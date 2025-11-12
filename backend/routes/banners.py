from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
import uuid

bp = Blueprint('banners', __name__)

@bp.route('', methods=['GET'])
def get_banners():
    """Get active banners"""
    banners = execute_query(
        """SELECT b.*, p.name, p.image_url, p.price, c.slug as category_slug
           FROM banners b
           JOIN products p ON b.product_id = p.id
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE b.is_active = TRUE
           ORDER BY b.display_order""",
        fetch_all=True
    )
    
    formatted_banners = [{
        'id': banner['id'],
        'product': {
            'id': banner['product_id'],
            'name': banner['name'],
            'image': banner['image_url'],
            'price': float(banner['price']),
            'category': banner['category_slug']
        },
        'title': banner['title'],
        'subtitle': banner['subtitle']
    } for banner in banners]
    
    return jsonify(formatted_banners), 200

@bp.route('', methods=['POST'])
@admin_required
def create_banner(current_user):
    """Create a banner (admin only)"""
    data = request.get_json()
    
    banner_id = str(uuid.uuid4())
    
    execute_query(
        """INSERT INTO banners (id, product_id, title, subtitle, display_order)
           VALUES (%s, %s, %s, %s, %s)""",
        (banner_id, data['productId'], data.get('title'), data.get('subtitle'),
         data.get('displayOrder', 0)),
        commit=True
    )
    
    return jsonify({'id': banner_id, 'message': 'Banner created successfully'}), 201

@bp.route('/<banner_id>', methods=['DELETE'])
@admin_required
def delete_banner(current_user, banner_id):
    """Delete a banner (admin only)"""
    execute_query("DELETE FROM banners WHERE id = %s", (banner_id,), commit=True)
    return jsonify({'message': 'Banner deleted successfully'}), 200
