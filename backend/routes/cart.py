from flask import Blueprint, request, jsonify
from utils.database import execute_query, get_db_connection
from utils.auth import token_required
import uuid
import json

bp = Blueprint('cart', __name__)

@bp.route('', methods=['GET'])
@token_required
def get_cart(current_user):
    """Get user's cart"""
    cart_items = execute_query(
        """SELECT ci.*, p.name, p.price, p.image_url, p.stock, c.name as category_name
           FROM cart_items ci
           JOIN products p ON ci.product_id = p.id
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE ci.user_id = %s""",
        (current_user['user_id'],),
        fetch_all=True
    )
    
    formatted_items = [{
        'id': item['id'],
        'product': {
            'id': item['product_id'],
            'name': item['name'],
            'price': float(item['price']),
            'image': item['image_url'],
            'category': item['category_name'],
            'stock': item['stock']
        },
        'quantity': item['quantity']
    } for item in cart_items]
    
    return jsonify(formatted_items), 200

@bp.route('', methods=['POST'])
@token_required
def add_to_cart(current_user):
    """Add item to cart"""
    data = request.get_json()
    product_id = data.get('productId')
    quantity = data.get('quantity', 1)
    
    if not product_id or quantity < 1:
        return jsonify({'error': 'Invalid product or quantity'}), 400
    
    # Check if item already in cart
    existing = execute_query(
        "SELECT id, quantity FROM cart_items WHERE user_id = %s AND product_id = %s",
        (current_user['user_id'], product_id),
        fetch_one=True
    )
    
    if existing:
        # Update quantity
        new_quantity = existing['quantity'] + quantity
        execute_query(
            "UPDATE cart_items SET quantity = %s WHERE id = %s",
            (new_quantity, existing['id']),
            commit=True
        )
    else:
        # Insert new item
        cart_item_id = str(uuid.uuid4())
        execute_query(
            "INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (%s, %s, %s, %s)",
            (cart_item_id, current_user['user_id'], product_id, quantity),
            commit=True
        )
    
    return get_cart(current_user)

@bp.route('/<product_id>', methods=['PUT'])
@token_required
def update_cart_item(current_user, product_id):
    """Update cart item quantity"""
    data = request.get_json()
    quantity = data.get('quantity', 1)
    
    if quantity < 1:
        return jsonify({'error': 'Invalid quantity'}), 400
    
    execute_query(
        "UPDATE cart_items SET quantity = %s WHERE user_id = %s AND product_id = %s",
        (quantity, current_user['user_id'], product_id),
        commit=True
    )
    
    return get_cart(current_user)

@bp.route('/<product_id>', methods=['DELETE'])
@token_required
def remove_from_cart(current_user, product_id):
    """Remove item from cart"""
    execute_query(
        "DELETE FROM cart_items WHERE user_id = %s AND product_id = %s",
        (current_user['user_id'], product_id),
        commit=True
    )
    
    return get_cart(current_user)

@bp.route('', methods=['DELETE'])
@token_required
def clear_cart(current_user):
    """Clear entire cart"""
    execute_query(
        "DELETE FROM cart_items WHERE user_id = %s",
        (current_user['user_id'],),
        commit=True
    )
    
    return jsonify({'message': 'Cart cleared'}), 200
