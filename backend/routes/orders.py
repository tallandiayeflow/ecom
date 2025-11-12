from flask import Blueprint, request, jsonify
from utils.database import execute_query, get_db_connection
from utils.auth import token_required, admin_required
import uuid
import json

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
    
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Create order
            order_id = str(uuid.uuid4())
            cursor.execute(
                """INSERT INTO orders 
                   (id, user_id, status, total, shipping_address, voucher_code, discount_amount)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (order_id, current_user['user_id'], 'pending', data['total'],
                 json.dumps(data['shippingAddress']), data.get('voucherCode'),
                 data.get('discountAmount', 0))
            )
            
            # Create order items
            for item in data['items']:
                item_id = str(uuid.uuid4())
                cursor.execute(
                    """INSERT INTO order_items 
                       (id, order_id, product_id, product_name, product_image, quantity, price)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (item_id, order_id, item['product']['id'], item['product']['name'],
                     item['product']['image'], item['quantity'], item['product']['price'])
                )
                
                # Update product stock
                cursor.execute(
                    "UPDATE products SET stock = stock - %s WHERE id = %s",
                    (item['quantity'], item['product']['id'])
                )
            
            # Clear user's cart
            cursor.execute(
                "DELETE FROM cart_items WHERE user_id = %s",
                (current_user['user_id'],)
            )
            
            # Add loyalty points (1 point per dollar spent)
            points = int(data['total'])
            cursor.execute(
                "UPDATE users SET loyalty_points = loyalty_points + %s WHERE id = %s",
                (points, current_user['user_id'])
            )
            
            connection.commit()
            
        return jsonify({'id': order_id, 'message': 'Order created successfully'}), 201
        
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

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
