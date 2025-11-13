from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
import json
from utils.auth import hash_password

bp = Blueprint('admin', __name__)
def is_admin(current_user):
    return current_user.get('role') == 'admin'

@bp.route('/users', methods=['GET'])
@admin_required
def admin_list_users(current_user):
    if not is_admin(current_user):
        return jsonify({"error": "Access denied"}), 403
    
    users = execute_query(
        "SELECT id, name, email, phone, address FROM users ORDER BY name ASC",
        fetch_all=True
    )
    return jsonify(users), 200

@bp.route('/users/<user_id>', methods=['PUT'])
@admin_required
def admin_update_user(current_user, user_id):
    if not is_admin(current_user):
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    address = data.get('address')
    password = data.get('password')

    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400

    existing = execute_query("SELECT id FROM users WHERE email = %s AND id != %s", (email, user_id), fetch_one=True)
    if existing:
        return jsonify({"error": "Email already in use"}), 409

    if password:
        hashed_password = hash_password(password)
        execute_query(
            "UPDATE users SET name = %s, email = %s, phone = %s, address = %s, password_hash = %s WHERE id = %s",
            (name, email, phone, address, hashed_password, user_id),
            commit=True
        )
    else:
        execute_query(
            "UPDATE users SET name = %s, email = %s, phone = %s, address = %s WHERE id = %s",
            (name, email, phone, address, user_id),
            commit=True
        )
    return jsonify({"message": "User updated successfully"}), 200

@bp.route('/users', methods=['POST'])
@admin_required
def admin_create_user(current_user):
    if not is_admin(current_user):
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    address = data.get('address')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    existing = execute_query("SELECT id FROM users WHERE email = %s", (email,), fetch_one=True)
    if existing:
        return jsonify({"error": "Email already in use"}), 409

    hashed_password = hash_password(password)
    execute_query(
        "INSERT INTO users (name, email, phone, address, password_hash) VALUES (%s, %s, %s, %s, %s)",
        (name, email, phone, address, hashed_password),
        commit=True
    )
    return jsonify({"message": "User created successfully"}), 201
@bp.route('/users/<user_id>/toggle-status', methods=['PUT'])
@admin_required
def toggle_user_status(current_user, user_id):
    """Toggle user active status (admin only)"""
    execute_query(
        "UPDATE users SET is_active = NOT is_active WHERE id = %s",
        (user_id,),
        commit=True
    )
    
    return jsonify({'message': 'User status updated'}), 200

@bp.route('/orders', methods=['GET'])
@admin_required
def get_all_orders(current_user):
    """Get all orders (admin only)"""
    orders = execute_query(
        """SELECT o.*, u.email, u.name as user_name
           FROM orders o
           JOIN users u ON o.user_id = u.id
           ORDER BY o.created_at DESC""",
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
            'user': {
                'id': order['user_id'],
                'email': order['email'],
                'name': order['user_name']
            },
            'status': order['status'],
            'total': float(order['total']),
            'shippingAddress': json.loads(order['shipping_address']),
            'items': [{
                'id': item['id'],
                'name': item['product_name'],
                'price': float(item['price']),
                'quantity': item['quantity']
            } for item in items],
            'createdAt': order['created_at'].isoformat() if order['created_at'] else None
        })
    
    return jsonify(formatted_orders), 200

@bp.route('/stats', methods=['GET'])
@admin_required
def get_stats(current_user):
    """Get admin dashboard stats"""
    # Total users
    users_count = execute_query(
        "SELECT COUNT(*) as count FROM users",
        fetch_one=True
    )
    
    # Total orders
    orders_count = execute_query(
        "SELECT COUNT(*) as count FROM orders",
        fetch_one=True
    )
    
    # Total revenue
    revenue = execute_query(
        "SELECT SUM(total) as total FROM orders WHERE status != 'cancelled'",
        fetch_one=True
    )
    
    # Total products
    products_count = execute_query(
        "SELECT COUNT(*) as count FROM products",
        fetch_one=True
    )
    
    return jsonify({
        'totalUsers': users_count['count'],
        'totalOrders': orders_count['count'],
        'totalRevenue': float(revenue['total']) if revenue['total'] else 0,
        'totalProducts': products_count['count']
    }), 200
