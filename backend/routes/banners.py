from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
from utils.cache import cache  # ✅ AJOUTER cette ligne
import uuid
import json


bp = Blueprint('banners', __name__)


# GET - Appliquer le cache (banners affichées sur page d'accueil)
@bp.route('', methods=['GET'])
@cache.cached(timeout=600)  # Cache 10 minutes
def get_banners():
    """Get active banners"""
    banners = execute_query(
        """SELECT b.*, p.name, p.image_url, p.images, p.price, p.stock,
           c.slug as category_slug
           FROM banners b
           JOIN products p ON b.product_id = p.id
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE b.is_active = TRUE
           ORDER BY b.display_order""",
        fetch_all=True
    )
    
    formatted_banners = []
    for banner in banners:
        # Parser les images JSON
        images_list = json.loads(banner['images']) if banner.get('images') else []
        
        formatted_banners.append({
            'id': banner['id'],
            'productId': banner['product_id'],
            'product': {
                'id': banner['product_id'],
                'name': banner['name'],
                'price': float(banner['price']),
                'images': images_list,
                'category': banner['category_slug'],
                'inStock': banner['stock'] > 0 if banner.get('stock') is not None else True,
                'stockQuantity': banner['stock'] if banner.get('stock') is not None else 0
            },
            'title': banner['title'],
            'subtitle': banner['subtitle'],
            'imageUrl': banner['image_url'],
            'images': images_list,
            'order': banner['display_order'],
            'isActive': bool(banner.get('is_active', True))
        })

    return jsonify(formatted_banners), 200


# POST - Pas de cache, mais invalider après création
@bp.route('', methods=['POST'])
@admin_required
def create_banner(current_user):
    """Create a banner (admin only)"""
    data = request.get_json()
    
    # Validation des champs requis
    if not data.get('productId') or not data.get('title'):
        return jsonify({'error': 'productId and title are required'}), 400
    
    banner_id = str(uuid.uuid4())
    
    execute_query(
        """INSERT INTO banners (id, product_id, title, subtitle, display_order, is_active)
           VALUES (%s, %s, %s, %s, %s, TRUE)""",
        (
            banner_id, 
            data['productId'], 
            data.get('title'), 
            data.get('subtitle', ''),
            data.get('displayOrder', 0)
        ),
        commit=True
    )
    
    # ✅ AJOUTER : Invalider le cache des banners
    cache.delete_memoized(get_banners)
    
    return jsonify({
        'id': banner_id, 
        'message': 'Banner created successfully'
    }), 201


# DELETE - Pas de cache, mais invalider après suppression
@bp.route('/<banner_id>', methods=['DELETE'])
@admin_required
def delete_banner(current_user, banner_id):
    """Delete a banner (admin only)"""
    # Vérifier si la bannière existe
    banner = execute_query(
        "SELECT id FROM banners WHERE id = %s",
        (banner_id,),
        fetch_one=True
    )
    
    if not banner:
        return jsonify({'error': 'Banner not found'}), 404
    
    execute_query(
        "DELETE FROM banners WHERE id = %s", 
        (banner_id,), 
        commit=True
    )
    
    # ✅ AJOUTER : Invalider le cache des banners
    cache.delete_memoized(get_banners)
    
    return jsonify({'message': 'Banner deleted successfully'}), 200
# PUT - Pas de cache, mais invalider après modification