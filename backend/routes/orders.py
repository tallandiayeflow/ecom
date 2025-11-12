from flask import Blueprint, request, jsonify
from utils.database import execute_query, get_db_connection
from utils.auth import token_required, admin_required
import uuid
import json
from datetime import datetime

bp = Blueprint('orders', __name__)

@bp.route('', methods=['GET'])
@token_required
def get_user_orders(current_user):
    """Get user's orders"""
    orders = execute_query(
        """SELECT * FROM orders 
           WHERE user_id = %s 
           ORDER BY created_at DESC""",
        (current_user['user_id'],),
        fetch_all=True
    )
    
    formatted_orders = []
    for order in orders:
        # Get order items
        items = execute_query(
            "SELECT * FROM order_items WHERE order_id = %s",
            (order['id'],),
            fetch_all=True
        )
        
        formatted_orders.append({
            'id': order['id'],
            'status': order['status'],
            'total': float(order['total']),
            'shippingAddress': json.loads(order['shipping_address']),
            'items': [{
                'id': item['id'],
                'name': item['product_name'],
                'price': float(item['price']),
                'quantity': item['quantity'],
                'image': item['product_image']
            } for item in items],
            'createdAt': order['created_at'].isoformat() if order['created_at'] else None
        })
    
    return jsonify(formatted_orders), 200

@bp.route('/<order_id>', methods=['GET'])
@token_required
def get_order(current_user, order_id):
    """Get a specific order"""
    order = execute_query(
        "SELECT * FROM orders WHERE id = %s AND user_id = %s",
        (order_id, current_user['user_id']),
        fetch_one=True
    )
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    items = execute_query(
        "SELECT * FROM order_items WHERE order_id = %s",
        (order_id,),
        fetch_all=True
    )
    
    return jsonify({
        'id': order['id'],
        'status': order['status'],
        'total': float(order['total']),
        'shippingAddress': json.loads(order['shipping_address']),
        'items': [{
            'id': item['id'],
            'name': item['product_name'],
            'price': float(item['price']),
            'quantity': item['quantity'],
            'image': item['product_image']
        } for item in items],
        'createdAt': order['created_at'].isoformat() if order['created_at'] else None
    }), 200

@bp.route('', methods=['POST'])
@token_required
def create_order(current_user):
    """Create a new order"""
    data = request.get_json()
    
    # Validation
    if not data.get('items') or not data.get('shippingAddress'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    order_id = str(uuid.uuid4())
    
    # Calculer les totaux
    items = data['items']
    subtotal = sum(item['price'] * item['quantity'] for item in items)
    discount = data.get('discount', 0)
    shipping_cost = 50 if subtotal < 500 else 0
    final_total = subtotal - discount + shipping_cost
    
    # Points de fidélité (1 point pour 10 DH)
    loyalty_points = int(final_total / 10)
    
    # Créer la commande
    execute_query(
        """INSERT INTO orders 
           (id, user_id, total, discount, final_total, status, 
            shipping_address, voucher_code, loyalty_points_earned)
           VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s)""",
        (
            order_id,
            current_user['user_id'],
            subtotal,
            discount,
            final_total,
            json.dumps(data['shippingAddress']),
            data.get('voucherCode'),
            loyalty_points
        ),
        commit=True
    )
    
    # Créer les items de commande
    for item in items:
        item_id = str(uuid.uuid4())
        execute_query(
            """INSERT INTO order_items 
               (id, order_id, product_id, product_name, product_image, 
                price, quantity)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (
                item_id,
                order_id,
                item['productId'],
                item['name'],
                '',  # Vous pouvez ajouter l'image si nécessaire
                item['price'],
                item['quantity']
            ),
            commit=True
        )
    
    # Mettre à jour l'utilisation du voucher si applicable
    if data.get('voucherCode'):
        execute_query(
            "UPDATE vouchers SET used_count = used_count + 1 WHERE code = %s",
            (data['voucherCode'],),
            commit=True
        )
    
    # Mettre à jour les points de fidélité de l'utilisateur
    execute_query(
        "UPDATE users SET loyalty_points = loyalty_points + %s WHERE id = %s",
        (loyalty_points, current_user['user_id']),
        commit=True
    )
    
    # Vider le panier
    execute_query(
        "DELETE FROM cart_items WHERE user_id = %s",
        (current_user['user_id'],),
        commit=True
    )
    
    # Retourner la commande créée
    return jsonify({
        'id': order_id,
        'userId': current_user['user_id'],
        'total': subtotal,
        'discount': discount,
        'finalTotal': final_total,
        'status': 'pending',
        'shippingAddress': data['shippingAddress'],
        'voucherCode': data.get('voucherCode'),
        'loyaltyPointsEarned': loyalty_points,
        'createdAt': datetime.now().isoformat()
    }), 201

@bp.route('/<order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(current_user, order_id):
    """Update order status (admin only)"""
    data = request.get_json()
    status = data.get('status')
    
    if status not in ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']:
        return jsonify({'error': 'Invalid status'}), 400
    
    execute_query(
        "UPDATE orders SET status = %s WHERE id = %s",
        (status, order_id),
        commit=True
    )
    
    return jsonify({'message': 'Order status updated'}), 200
