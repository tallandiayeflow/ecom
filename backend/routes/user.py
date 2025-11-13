from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import token_required
import json

bp = Blueprint('user', __name__)

@bp.route('', methods=['GET'])
@token_required
def get_user_info(current_user):
    user_id = current_user['user_id']
    user = execute_query(
        "SELECT id, name, email, phone, address, loyalty_points FROM users WHERE id = %s",
        (user_id,),
        fetch_one=True
    )
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    return jsonify({
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'phone': user.get('phone'),
        'address': user.get('address'),
        'loyaltyPoints': user.get('loyalty_points', 0)
    })

@bp.route('', methods=['PUT'])
@token_required
def update_user_info(current_user):
    user_id = current_user['user_id']
    data = request.get_json()

    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    address = data.get('address')

    if not name or not email:
        return jsonify({'error': 'Nom et email sont requis'}), 400

    existing = execute_query("SELECT id FROM users WHERE email = %s AND id != %s", (email, user_id), fetch_one=True)
    if existing:
        return jsonify({'error': 'Email déjà utilisé'}), 409

    execute_query(
        "UPDATE users SET name = %s, email = %s, phone = %s, address = %s WHERE id = %s",
        (name, email, phone, address, user_id),
        commit=True
    )

    return jsonify({'message': 'Profil mis à jour avec succès'}), 200

@bp.route('/orders', methods=['GET'])
@token_required
def get_user_orders(current_user):
    user_id = current_user['user_id']
    orders = execute_query(
        "SELECT * FROM orders WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,),
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
                'name': item['product_name'],
                'productImage': item.get('product_image'),
                'price': float(item['price']),
                'quantity': item['quantity']
            } for item in items],
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else None
        })

    return jsonify(formatted_orders), 200
