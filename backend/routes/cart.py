from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import token_required
import uuid
import json

bp = Blueprint('cart', __name__)


def _get_cart_items(user_id):
    """Helper function to get cart items (without decorator)"""
    cart_items = execute_query(
        """SELECT ci.*, 
           p.name, p.description, p.price, p.original_price, p.image_url, p.images,
           p.stock, p.brand, c.name as category_name, c.slug as category_slug
           FROM cart_items ci
           JOIN products p ON ci.product_id = p.id
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE ci.user_id = %s""",
        (user_id,),
        fetch_all=True
    )
    
    formatted_items = []
    for item in cart_items:
        # Parser les images JSON
        images_list = json.loads(item['images']) if item.get('images') else []
        
        formatted_items.append({
            'productId': item['product_id'],
            'quantity': item['quantity'],
            'product': {
                'id': item['product_id'],
                'name': item['name'],
                'description': item.get('description', ''),
                'price': float(item['price']),
                'originalPrice': float(item['original_price']) if item.get('original_price') else None,
                'images': images_list,
                'category': item['category_slug'],
                'inStock': item['stock'] > 0,
                'stockQuantity': item['stock'],
                'brand': item.get('brand')
            }
        })
    
    return formatted_items


@bp.route('', methods=['GET'])
@token_required
def get_cart(current_user):
    """Get user's cart with full product details"""
    cart_items = _get_cart_items(current_user['user_id'])
    return jsonify(cart_items), 200


@bp.route('', methods=['POST'])
@token_required
def add_to_cart(current_user):
    """Add item to cart"""
    data = request.get_json()
    product_id = data.get('productId')
    quantity = data.get('quantity', 1)
    
    if not product_id or quantity < 1:
        return jsonify({'error': 'Invalid product or quantity'}), 400
    
    # Vérifier le stock
    product = execute_query(
        "SELECT stock FROM products WHERE id = %s",
        (product_id,),
        fetch_one=True
    )
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Check if item already in cart
    existing = execute_query(
        "SELECT id, quantity FROM cart_items WHERE user_id = %s AND product_id = %s",
        (current_user['user_id'], product_id),
        fetch_one=True
    )
    
    if existing:
        # Update quantity
        new_quantity = existing['quantity'] + quantity
        
        # Vérifier le stock disponible
        if new_quantity > product['stock']:
            return jsonify({'error': f'Stock insuffisant. Disponible: {product["stock"]}'}), 400
        
        execute_query(
            "UPDATE cart_items SET quantity = %s WHERE id = %s",
            (new_quantity, existing['id']),
            commit=True
        )
    else:
        # Vérifier le stock disponible
        if quantity > product['stock']:
            return jsonify({'error': f'Stock insuffisant. Disponible: {product["stock"]}'}), 400
        
        # Insert new item
        cart_item_id = str(uuid.uuid4())
        execute_query(
            "INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (%s, %s, %s, %s)",
            (cart_item_id, current_user['user_id'], product_id, quantity),
            commit=True
        )
    
    # ✅ CORRECTION : Utiliser la fonction helper au lieu d'appeler get_cart
    cart_items = _get_cart_items(current_user['user_id'])
    return jsonify(cart_items), 200


@bp.route('/<product_id>', methods=['PUT'])
@token_required
def update_cart_item(current_user, product_id):
    """Update cart item quantity"""
    data = request.get_json()
    quantity = data.get('quantity', 1)
    
    if quantity < 1:
        return jsonify({'error': 'Invalid quantity'}), 400
    
    # Vérifier le stock
    product = execute_query(
        "SELECT stock FROM products WHERE id = %s",
        (product_id,),
        fetch_one=True
    )
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    if quantity > product['stock']:
        return jsonify({'error': f'Stock insuffisant. Disponible: {product["stock"]}'}), 400
    
    execute_query(
        "UPDATE cart_items SET quantity = %s WHERE user_id = %s AND product_id = %s",
        (quantity, current_user['user_id'], product_id),
        commit=True
    )
    
    # ✅ CORRECTION : Utiliser la fonction helper
    cart_items = _get_cart_items(current_user['user_id'])
    return jsonify(cart_items), 200


@bp.route('/<product_id>', methods=['DELETE'])
@token_required
def remove_from_cart(current_user, product_id):
    """Remove item from cart"""
    execute_query(
        "DELETE FROM cart_items WHERE user_id = %s AND product_id = %s",
        (current_user['user_id'], product_id),
        commit=True
    )
    
    # ✅ CORRECTION : Utiliser la fonction helper
    cart_items = _get_cart_items(current_user['user_id'])
    return jsonify(cart_items), 200


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
