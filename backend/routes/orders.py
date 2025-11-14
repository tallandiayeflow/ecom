from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import token_required, admin_required
import uuid
import json
from datetime import datetime

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
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else None
        })
    return jsonify(formatted_orders), 200

@bp.route('/<order_id>', methods=['GET'])
@token_required
def get_order(current_user, order_id):
    """Détails d'une commande spécifique"""
    order = execute_query(
        "SELECT * FROM orders WHERE id = %s AND user_id = %s",
        (order_id, current_user['user_id']),
        fetch_one=True
    )
    if not order:
        return jsonify({'error': 'Commande non trouvée'}), 404

    items = execute_query(
        "SELECT * FROM order_items WHERE order_id = %s",
        (order_id,),
        fetch_all=True
    )
    return jsonify({
        'id': order['id'],
        'status': order['status'],
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
        'createdAt': order['created_at'].isoformat() if order.get('created_at') else None
    }), 200

@bp.route('', methods=['POST'])
@token_required
def create_order(current_user):
    """Créer une nouvelle commande avec gestion du voucher"""
    data = request.get_json()
    items = data.get('items')
    shipping_address = json.dumps(data.get('shippingAddress', {}))
    voucher_code = data.get('voucherCode')
    discount = float(data.get('discount', 0))
    total = float(data.get('total', 0))
    final_total = float(data.get('finalTotal', total))

    if not items or not shipping_address:
        return jsonify({'error': 'Champs manquants'}), 400

    order_id = str(uuid.uuid4())

    try:
        # Insérer la commande principale
        execute_query(
            """
            INSERT INTO orders (id, user_id, total, discount, final_total,
                                status, shipping_address, voucher_code, loyalty_points_earned, created_at)
            VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s, NOW())
            """,
            (order_id, current_user['user_id'], total, discount, final_total,
             shipping_address, voucher_code, int(final_total/10)),
            commit=True
        )
        # Insérer les items
        for item in items:
            item_id = str(uuid.uuid4())
            product_name = item.get('name', 'Produit sans nom')
            product_image = ''
            product = execute_query(
                "SELECT image_url, images FROM products WHERE id = %s",
                (item['productId'],),
                fetch_one=True
            )
            if product:
                if product.get('images'):
                    try:
                        images_list = json.loads(product['images'])
                        product_image = images_list[0] if images_list else product.get('image_url', '')
                    except Exception:
                        product_image = product.get('image_url', '')
                else:
                    product_image = product.get('image_url', '')

            execute_query(
                """
                INSERT INTO order_items
                (id, order_id, product_id, product_name, product_image, price, quantity)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (item_id, order_id, item['productId'], product_name, product_image, item['price'], item['quantity']),
                commit=True
            )

        # Mettre à jour used_count du voucher s'il y a lieu
        if voucher_code:
            execute_query(
                "UPDATE vouchers SET used_count = used_count + 1 WHERE code = %s",
                (voucher_code,),
                commit=True
            )

    except Exception as e:
        print(f"Erreur création commande : {e}")
        return jsonify({'error': 'Erreur création commande'}), 500

    return jsonify({'id': order_id, 'status': 'pending'}), 201

@bp.route('/status', methods=['PUT'])
@admin_required
def update_order_status(current_user):
    data = request.get_json()
    order_id = data.get('orderId')
    status = data.get('status')

    if status not in ['pending', 'processing', 'shipped', 'delivered', 'cancelled']:
        return jsonify({'error': 'Statut invalide'}), 400

    execute_query(
        "UPDATE orders SET status = %s WHERE id = %s",
        (status, order_id),
        commit=True
    )
    return jsonify({'message': 'Statut mis à jour'}), 200

@bp.route('/admin/all', methods=['GET'])
@admin_required
def get_all_orders(current_user):
    orders = execute_query(
        "SELECT * FROM orders ORDER BY created_at DESC",
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
            'userId': order['user_id'],
            'status': order['status'],
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
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else None
        })
    return jsonify(formatted_orders), 200


@bp.route('/public/order/<order_id>', methods=['GET'])
def get_order_public(order_id):
    try:
        order = execute_query(
            """
            SELECT o.*, u.name as user_name, u.email as user_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
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
            'userName': order['user_name'],
            'userEmail': order['user_email'],
            'status': order['status'],
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
            'createdAt': order['created_at'].isoformat() if order['created_at'] else None
        })
    except Exception as e:
        return jsonify({"error": "Erreur lors de la récupération de la commande"}), 500