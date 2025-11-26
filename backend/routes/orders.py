from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import token_required, admin_required
import uuid
import json
from datetime import datetime
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
                'productName': item['product_name'],
                'productImage': item.get('product_image', ''),
                'price': float(item['price']),
                'quantity': item['quantity']
            } for item in items],
            'createdAt': order.get('created_at').isoformat() if order.get('created_at') else None
        })
    return jsonify(formatted_orders), 200

@bp.route('', methods=['POST'])
def create_order():
    """Créer une commande avec ou sans utilisateur connecté"""
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
    shipping_address = json.dumps(data.get('shippingAddress', {}))
    voucher_code = data.get('voucherCode')
    discount = float(data.get('discount', 0))
    total = float(data.get('total', 0))
    final_total = float(data.get('finalTotal', total))

    if not items or not shipping_address:
        return jsonify({'error': 'Champs manquants'}), 400

    if user_id:
        loyalty_points = int(final_total / 5000)

    order_id = str(uuid.uuid4())
    try:
        execute_query(
            """
            INSERT INTO orders (id, user_id, total, discount, final_total,
                                status, shipping_address, voucher_code, loyalty_points_earned, created_at)
            VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s, NOW())
            """,
            (order_id, user_id, total, discount, final_total,
             shipping_address, voucher_code, loyalty_points),
            commit=True
        )
        for item in items:
            item_id = str(uuid.uuid4())
            product_name = item.get('name','')
            product_image = ''
            product = execute_query("SELECT image_url, images FROM products WHERE id=%s", (item['productId'],), fetch_one=True)
            if product:
                try:
                    images = json.loads(product.get('images','[]'))
                    product_image = images[0] if images else product.get('image_url','')
                except:
                    product_image = product.get('image_url','')
            execute_query(
                """
                INSERT INTO order_items (id, order_id, product_id, product_name, product_image, price, quantity)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (item_id, order_id, item['productId'], product_name, product_image, item['price'], item['quantity']),
                commit=True
            )
        if voucher_code:
            execute_query("UPDATE vouchers SET used_count = used_count + 1 WHERE code=%s", (voucher_code,), commit=True)
            # Décrémenter automatiquement le stock
            decrease_stock_from_order(items, user_id, reason=f"Commande #{order_id[:8]}")
        
        if user_id and loyalty_points > 0:
            execute_query("UPDATE users SET loyalty_points = loyalty_points + %s WHERE id=%s", (loyalty_points,user_id), commit=True)

    except Exception as e:
        print(f"Erreur création commande : {e}")
        return jsonify({'error': 'Erreur création commande'}), 500

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
            'productName': item['product_name'],
            'productImage': item.get('product_image', ''),
            'price': float(item['price']),
            'quantity': item['quantity']
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
                'productName': item['product_name'],
                'productImage': item['product_image'],
                'price': float(item['price']),
                'quantity': item['quantity']
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
    order = execute_query("SELECT id FROM orders WHERE id=%s", (order_id,), fetch_one=True)
    if not order:
        return jsonify({'error': 'Commande non trouvée'}), 404
    execute_query("UPDATE orders SET status=%s WHERE id=%s", (new_status, order_id), commit=True)
    # ✅ AJOUTER : Si commande annulée, restaurer le stock
    if new_status == 'cancelled':
        # Récupérer les items de la commande
        order_items = execute_query(
            "SELECT product_id, quantity FROM order_items WHERE order_id=%s",
            (order_id,),
            fetch_all=True
        )
        increase_stock_from_return(order_items, current_user['user_id'], reason=f"Annulation commande #{order_id[:8]}")
    return jsonify({'message': 'Statut mis à jour'}), 200


@bp.route('/<order_id>', methods=['DELETE'])
@admin_required
def delete_order(current_user, order_id):
    order = execute_query("SELECT id FROM orders WHERE id=%s", (order_id,), fetch_one=True)
    if not order:
        return jsonify({'error': 'Commande non trouvée'}), 404
    execute_query("DELETE FROM order_items WHERE order_id=%s", (order_id,), commit=True)
    execute_query("DELETE FROM orders WHERE id=%s", (order_id,), commit=True)
    return jsonify({'message': 'Commande supprimée'}), 200
