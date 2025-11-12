from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
import json

bp = Blueprint('admin', __name__)

@bp.route('/users', methods=['GET'])
@admin_required
def get_all_users(current_user):
    """Get all users (admin only)"""
    users = execute_query(
        """SELECT id, email, name, role, is_active, loyalty_points, created_at
           FROM users
           ORDER BY created_at DESC""",
        fetch_all=True
    )
    
    formatted_users = [{
        'id': u['id'],
        'email': u['email'],
        'name': u['name'],
        'role': u['role'],
        'isActive': bool(u['is_active']),
        'loyaltyPoints': u['loyalty_points'],
        'createdAt': u['created_at'].isoformat() if u['created_at'] else None
    } for u in users]
    
    return jsonify(formatted_users), 200

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
