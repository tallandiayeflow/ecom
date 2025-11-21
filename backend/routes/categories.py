from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
from utils.cache import cache  # AJOUTER cette ligne
import uuid


bp = Blueprint('categories', __name__)


# GET - Appliquer le cache (lecture seule)
@bp.route('', methods=['GET'])
@cache.cached(timeout=1800)  # Cache 30 minutes (les catégories changent rarement)
def get_categories():
    """Get all categories"""
    categories = execute_query(
        """SELECT c.*, COUNT(p.id) as product_count
           FROM categories c
           LEFT JOIN products p ON c.id = p.category_id
           GROUP BY c.id
           ORDER BY c.name""",
        fetch_all=True
    )
    
    formatted_categories = [{
        'id': c['id'],
        'name': c['name'],
        'slug': c['slug'],
        'icon': c['icon'],
        'productCount': c['product_count']
    } for c in categories]
    
    return jsonify(formatted_categories), 200


# POST - Pas de cache, mais invalider après création
@bp.route('', methods=['POST'])
@admin_required
def create_category(current_user):
    """Create a new category (admin only)"""
    data = request.get_json()
    
    category_id = str(uuid.uuid4())
    
    execute_query(
        "INSERT INTO categories (id, name, slug, icon) VALUES (%s, %s, %s, %s)",
        (category_id, data['name'], data['slug'], data.get('icon')),
        commit=True
    )
    
    # Invalider le cache de la liste des catégories
    cache.delete_memoized(get_categories)
    
    return jsonify({'id': category_id, 'message': 'Category created successfully'}), 201


# PUT - Pas de cache, mais invalider après modification
@bp.route('/<category_id>', methods=['PUT'])
@admin_required
def update_category(current_user, category_id):
    """Update a category (admin only)"""
    data = request.get_json()
    
    updates = []
    params = []
    
    if 'name' in data:
        updates.append("name = %s")
        params.append(data['name'])
    if 'slug' in data:
        updates.append("slug = %s")
        params.append(data['slug'])
    if 'icon' in data:
        updates.append("icon = %s")
        params.append(data['icon'])
    
    if not updates:
        return jsonify({'error': 'No fields to update'}), 400
    
    params.append(category_id)
    query = f"UPDATE categories SET {', '.join(updates)} WHERE id = %s"
    
    execute_query(query, tuple(params), commit=True)
    
    # Invalider le cache de la liste des catégories
    cache.delete_memoized(get_categories)
    
    return jsonify({'message': 'Category updated successfully'}), 200


# DELETE - Pas de cache, mais invalider après suppression
@bp.route('/<category_id>', methods=['DELETE'])
@admin_required
def delete_category(current_user, category_id):
    """Delete a category (admin only)"""
    execute_query("DELETE FROM categories WHERE id = %s", (category_id,), commit=True)
    
    # Invalider le cache de la liste des catégories
    cache.delete_memoized(get_categories)
    
    return jsonify({'message': 'Category deleted successfully'}), 200
