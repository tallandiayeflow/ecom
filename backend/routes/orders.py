from flask import Blueprint, request, jsonify
from utils.database import execute_query, get_db_connection
from utils.auth import token_required, admin_required
from utils.whatsapp import notify_admin_new_order, notify_client_status_change
import uuid
import json
from utils.stock_sync import decrease_stock_from_order, increase_stock_from_return

bp = Blueprint('orders', __name__)

@bp.route('', methods=['GET'])
@token_required
def get_user_orders(current_user):
    """Récupère les commandes de l'utilisateur connecté"""
    orders = execute_query(
        "SELECT * FROM orders WHERE user_id = %s ORDER BY created_at DESC",
        (current_user['user_id'],),
        fetch_all=True
    )
    formatted_orders = []
    for order in orders:
        items = execute_query(
            "SELECT * FROM order_items WHERE order_id = %s",
            (order['id'],),
            fetch_all=True
        )
        formatted_orders.append({
            'id': order['id'],
            'status': order['status'],
            'paymentMethod': order.get('payment_method'),
            'paymentStatus': order.get('payment_status'),
            'paymentReference': order.get('payment_ref'),
            'total': float(order['total']),
            'discount': float(order.get('discount', 0)),
            'finalTotal': float(order.get('final_total', order['total'])),
            'shippingAddress': json.loads(order['shipping_address']),
            'voucherCode': order.get('voucher_code'),
            'loyaltyPointsEarned': order.get('loyalty_points_earned', 0),
            'items': [{
                'id': item['id'],
                'productId': item.get('product_id'),
                'name': item['product_name'],
                'productName': item['product_name'],
                'productImage': item.get('product_image', ''),
                'price': float(item['price']),
                'quantity': item['quantity'],
                'selectedColor': item.get('selected_color'),
                'selectedSize': item.get('selected_size'),
            } for item in items],
            'createdAt': order.get('created_at').isoformat() if order.get('created_at') else None
        })
    return jsonify(formatted_orders), 200

@bp.route('', methods=['POST'])
def create_order():
    auth_header = request.headers.get('Authorization', '')
    user_id = None
    loyalty_points = 0
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            from utils.auth import decode_token
            decoded = decode_token(token)
            user_id = decoded.get('user_id')
        except Exception:
            pass

    data = request.get_json()
    items = data.get('items')
    shipping = data.get('shippingAddress', {})
    voucher_code = data.get('voucherCode', '').strip().upper() or None

    # Validate shipping address
    if not items:
        return jsonify({'error': 'Champs manquants'}), 400
    if not shipping.get('name') or not shipping.get('phone') or not shipping.get('address') or not shipping.get('city'):
        return jsonify({'error': 'Adresse de livraison incomplète'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Recalculate total server-side from actual DB prices
            actual_total = 0.0
            validated_items = []
            for item in items:
                cursor.execute("SELECT id, name, price, image_url, images, stock FROM products WHERE id=%s", (item['productId'],))
                product = cursor.fetchone()
                if not product:
                    conn.rollback()
                    return jsonify({'error': f"Produit introuvable: {item['productId']}"}), 400
                qty = max(1, int(item.get('quantity', 1)))
                actual_total += float(product['price']) * qty
                try:
                    images = json.loads(product.get('images') or '[]')
                    product_image = images[0] if images else product.get('image_url', '')
                except Exception:
                    product_image = product.get('image_url', '')
                validated_items.append({
                    'productId': product['id'],
                    'name': product['name'],
                    'price': float(product['price']),
                    'quantity': qty,
                    'image': product_image,
                    'selectedColor': item.get('selectedColor'),
                    'selectedSize': item.get('selectedSize'),
                })

            # Validate and apply voucher server-side
            actual_discount = 0.0
            if voucher_code:
                cursor.execute(
                    """SELECT id, type, value, min_order_amount, max_uses, used_count
                       FROM vouchers
                       WHERE code=%s AND is_active=1 AND valid_until >= NOW()
                       FOR UPDATE""",
                    (voucher_code,)
                )
                voucher = cursor.fetchone()
                if not voucher:
                    conn.rollback()
                    return jsonify({'error': 'Voucher invalide ou expiré'}), 400
                if voucher['max_uses'] and voucher['used_count'] >= voucher['max_uses']:
                    conn.rollback()
                    return jsonify({'error': 'Voucher épuisé'}), 400
                if actual_total < float(voucher['min_order_amount'] or 0):
                    conn.rollback()
                    return jsonify({'error': 'Montant minimum non atteint pour ce voucher'}), 400
                if voucher['type'] == 'fixed':
                    actual_discount = min(float(voucher['value']), actual_total)
                elif voucher['type'] == 'percentage':
                    actual_discount = round(actual_total * float(voucher['value']) / 100, 2)

            actual_final_total = max(0.0, actual_total - actual_discount)
            if user_id:
                loyalty_points = int(actual_final_total / 5000)

            order_id = str(uuid.uuid4())
            cursor.execute(
                """INSERT INTO orders (id, user_id, total, discount, final_total,
                                      status, shipping_address, voucher_code, loyalty_points_earned, created_at)
                   VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s, NOW())""",
                (order_id, user_id, actual_total, actual_discount, actual_final_total,
                 json.dumps(shipping), voucher_code, loyalty_points)
            )
            for item in validated_items:
                cursor.execute(
                    """INSERT INTO order_items (id, order_id, product_id, product_name, product_image,
                           price, quantity, selected_color, selected_size)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (str(uuid.uuid4()), order_id, item['productId'], item['name'], item['image'],
                     item['price'], item['quantity'], item['selectedColor'], item['selectedSize'])
                )
            if voucher_code:
                cursor.execute("UPDATE vouchers SET used_count = used_count + 1 WHERE code=%s", (voucher_code,))
            if user_id and loyalty_points > 0:
                cursor.execute("UPDATE users SET loyalty_points = loyalty_points + %s WHERE id=%s", (loyalty_points, user_id))
            conn.commit()

    except Exception as e:
        conn.rollback()
        return jsonify({'error': 'Erreur création commande'}), 500
    finally:
        conn.close()

    decrease_stock_from_order(validated_items, user_id, reason=f"Commande #{order_id[:8]}")
    notify_admin_new_order(
        order_id=order_id,
        client_name=shipping.get('name', 'Inconnu'),
        client_phone=shipping.get('phone', ''),
        total=actual_final_total,
        items_count=len(validated_items),
    )

    return jsonify({'id': order_id, 'status': 'pending', 'loyaltyPointsEarned': loyalty_points}), 201


@bp.route('/<order_id>', methods=['GET'])
@token_required
def get_order(current_user, order_id):
    order = execute_query("SELECT * FROM orders WHERE id=%s AND user_id=%s", (order_id, current_user['user_id']), fetch_one=True)
    if not order:
        return jsonify({'error': 'Commande non trouvée'}), 404
    items = execute_query("SELECT * FROM order_items WHERE order_id=%s", (order_id,), fetch_all=True)
    return jsonify({
        'id': order['id'],
        'status': order['status'],
        'paymentMethod': order.get('payment_method'),
        'paymentStatus': order.get('payment_status'),
        'paymentReference': order.get('payment_ref'),
        'total': float(order['total']),
        'discount': float(order.get('discount', 0)),
        'finalTotal': float(order.get('final_total', order['total'])),
        'shippingAddress': json.loads(order['shipping_address']),
        'voucherCode': order.get('voucher_code'),
        'loyaltyPointsEarned': order.get('loyalty_points_earned', 0),
        'items': [{
            'id': item['id'],
            'productId': item.get('product_id'),
            'name': item['product_name'],
            'productName': item['product_name'],
            'productImage': item.get('product_image', ''),
            'price': float(item['price']),
            'quantity': item['quantity'],
            'selectedColor': item.get('selected_color'),
            'selectedSize': item.get('selected_size'),
        } for item in items],
        'createdAt': order.get('created_at').isoformat() if order.get('created_at') else None
    }), 200


@bp.route('/public/order/<order_id>', methods=['GET'])
def get_order_public(order_id):
    """Récupérer commande sans authentification"""
    try:
        order = execute_query(
            """
            SELECT o.*, u.name as user_name, u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = %s
            """,
            (order_id,),
            fetch_one=True
        )
        if not order:
            return jsonify({"error": "Commande non trouvée"}), 404

        items = execute_query("SELECT * FROM order_items WHERE order_id = %s", (order_id,), fetch_all=True)
        return jsonify({
            'id': order['id'],
            'userName': order.get('user_name'),
            'userEmail': order.get('user_email'),
            'status': order['status'],
            'paymentMethod': order.get('payment_method'),
            'paymentStatus': order.get('payment_status'),
            'paymentReference': order.get('payment_ref'),
            'total': float(order['total']),
            'discount': float(order.get('discount', 0)),
            'finalTotal': float(order.get('final_total', order['total'])),
            'shippingAddress': json.loads(order['shipping_address']),
            'voucherCode': order.get('voucher_code'),
            'loyaltyPointsEarned': order.get('loyalty_points_earned', 0),
            'items': [{
                'id': item['id'],
                'productId': item['product_id'],
                'name': item['product_name'],
                'productName': item['product_name'],
                'productImage': item['product_image'],
                'price': float(item['price']),
                'quantity': item['quantity'],
                'selectedColor': item.get('selected_color'),
                'selectedSize': item.get('selected_size'),
            } for item in items],
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else None
        })
    except Exception as e:
        return jsonify({"error": "Erreur lors de la récupération de la commande"}), 500


@bp.route('/status/<order_id>', methods=['PUT'])
@admin_required
def update_order_status(current_user, order_id):
    data = request.get_json()
    new_status = data.get('status')
    valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({'error': 'Statut invalide'}), 400
    order = execute_query(
        "SELECT id, status, user_id, loyalty_points_earned, shipping_address FROM orders WHERE id=%s",
        (order_id,), fetch_one=True
    )
    if not order:
        return jsonify({'error': 'Commande non trouvée'}), 404
    execute_query("UPDATE orders SET status=%s WHERE id=%s", (new_status, order_id), commit=True)

    shipping = json.loads(order.get('shipping_address') or '{}')
    client_phone = shipping.get('phone', '')
    if client_phone:
        notify_client_status_change(client_phone, order_id, new_status)

    if new_status == 'cancelled' and order['status'] != 'cancelled':
        order_items = execute_query(
            "SELECT product_id, quantity FROM order_items WHERE order_id=%s",
            (order_id,), fetch_all=True
        )
        increase_stock_from_return(order_items, current_user['user_id'], reason=f"Annulation commande #{order_id[:8]}")
        points_earned = order.get('loyalty_points_earned') or 0
        if order.get('user_id') and points_earned > 0:
            execute_query(
                "UPDATE users SET loyalty_points = GREATEST(0, loyalty_points - %s) WHERE id=%s",
                (points_earned, order['user_id']), commit=True
            )
    return jsonify({'message': 'Statut mis à jour'}), 200


@bp.route('/<order_id>', methods=['DELETE'])
@admin_required
def delete_order(current_user, order_id):
    order = execute_query(
        "SELECT id, status, user_id, loyalty_points_earned FROM orders WHERE id=%s",
        (order_id,), fetch_one=True
    )
    if not order:
        return jsonify({'error': 'Commande non trouvée'}), 404
    order_items = execute_query(
        "SELECT product_id, quantity FROM order_items WHERE order_id=%s",
        (order_id,), fetch_all=True
    )
    if order_items:
        increase_stock_from_return(order_items, current_user['user_id'],
                                   reason=f"Suppression commande #{order_id[:8]}")
    points_earned = order.get('loyalty_points_earned') or 0
    if order.get('user_id') and points_earned > 0 and order.get('status') != 'cancelled':
        execute_query(
            "UPDATE users SET loyalty_points = GREATEST(0, loyalty_points - %s) WHERE id=%s",
            (points_earned, order['user_id']), commit=True
        )
    execute_query("DELETE FROM order_items WHERE order_id=%s", (order_id,), commit=True)
    execute_query("DELETE FROM orders WHERE id=%s", (order_id,), commit=True)
    return jsonify({'message': 'Commande supprimée'}), 200
