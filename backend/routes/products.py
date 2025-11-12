from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
import uuid
import json

bp = Blueprint('products', __name__)

@bp.route('', methods=['GET'])
def get_products():
    """Get products with filtering and pagination"""
    category = request.args.get('category')
    min_price = request.args.get('minPrice', type=float)
    max_price = request.args.get('maxPrice', type=float)
    search = request.args.get('search', '').strip()
    in_stock = request.args.get('inStock', '').lower() == 'true'
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 12, type=int)
    
    offset = (page - 1) * limit
    
    # Build query
    conditions = []
    params = []
    
    if category:
        conditions.append("c.slug = %s")
        params.append(category)
    
    if min_price is not None:
        conditions.append("p.price >= %s")
        params.append(min_price)
    
    if max_price is not None:
        conditions.append("p.price <= %s")
        params.append(max_price)
    
    if search:
        conditions.append("(p.name LIKE %s OR p.description LIKE %s OR p.brand LIKE %s)")
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term])
    
    if in_stock:
        conditions.append("p.stock > 0")
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    # Get total count
    count_query = f"""
        SELECT COUNT(*) as total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        {where_clause}
    """
    total_result = execute_query(count_query, tuple(params), fetch_one=True)
    total = total_result['total']
    
    # Get products
    products_query = f"""
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        {where_clause}
        ORDER BY p.created_at DESC
        LIMIT %s OFFSET %s
    """
    params.extend([limit, offset])
    products = execute_query(products_query, tuple(params), fetch_all=True)
    
    # Format products
    formatted_products = []
    for p in products:
        formatted_products.append({
            'id': p['id'],
            'name': p['name'],
            'description': p['description'],
            'price': float(p['price']),
            'category': p['category_slug'],
            'image': p['image_url'],
            'images': json.loads(p['images']) if p['images'] else [],
            'stock': p['stock'],
            'rating': float(p['rating']) if p['rating'] else 0,
            'reviewsCount': p['reviews_count'],
            'brand': p['brand'],
            'specifications': json.loads(p['specifications']) if p['specifications'] else {},
            'createdAt': p['created_at'].isoformat() if p['created_at'] else None
        })
    
    total_pages = (total + limit - 1) // limit
    
    return jsonify({
        'products': formatted_products,
        'total': total,
        'page': page,
        'totalPages': total_pages
    }), 200

@bp.route('/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product"""
    product = execute_query(
        """SELECT p.*, c.name as category_name, c.slug as category_slug
           FROM products p
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.id = %s""",
        (product_id,),
        fetch_one=True
    )
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    return jsonify({
        'id': product['id'],
        'name': product['name'],
        'description': product['description'],
        'price': float(product['price']),
        'category': product['category_slug'],
        'image': product['image_url'],
        'images': json.loads(product['images']) if product['images'] else [],
        'stock': product['stock'],
        'rating': float(product['rating']) if product['rating'] else 0,
        'reviewsCount': product['reviews_count'],
        'brand': product['brand'],
        'specifications': json.loads(product['specifications']) if product['specifications'] else {},
        'createdAt': product['created_at'].isoformat() if product['created_at'] else None
    }), 200

@bp.route('', methods=['POST'])
@admin_required
def create_product(current_user):
    """Create a new product (admin only)"""
    data = request.get_json()
    
    product_id = str(uuid.uuid4())
    
    execute_query(
        """INSERT INTO products 
           (id, name, description, price, category_id, image_url, images, stock, brand, specifications, is_featured)
           VALUES (%s, %s, %s, %s, 
                  (SELECT id FROM categories WHERE slug = %s),
                  %s, %s, %s, %s, %s, %s)""",
        (product_id, data['name'], data.get('description'), data['price'],
         data['category'], data.get('image'), json.dumps(data.get('images', [])),
         data.get('stock', 0), data.get('brand'), json.dumps(data.get('specifications', {})),
         data.get('isFeatured', False)),
        commit=True
    )
    
    return jsonify({'id': product_id, 'message': 'Product created successfully'}), 201

@bp.route('/<product_id>', methods=['PUT'])
@admin_required
def update_product(current_user, product_id):
    """Update a product (admin only)"""
    data = request.get_json()
    
    updates = []
    params = []
    
    if 'name' in data:
        updates.append("name = %s")
        params.append(data['name'])
    if 'description' in data:
        updates.append("description = %s")
        params.append(data['description'])
    if 'price' in data:
        updates.append("price = %s")
        params.append(data['price'])
    if 'stock' in data:
        updates.append("stock = %s")
        params.append(data['stock'])
    if 'images' in data:
        updates.append("images = %s")
        params.append(json.dumps(data['images']))
    if 'specifications' in data:
        updates.append("specifications = %s")
        params.append(json.dumps(data['specifications']))
    
    if not updates:
        return jsonify({'error': 'No fields to update'}), 400
    
    params.append(product_id)
    query = f"UPDATE products SET {', '.join(updates)} WHERE id = %s"
    
    execute_query(query, tuple(params), commit=True)
    
    return jsonify({'message': 'Product updated successfully'}), 200

@bp.route('/<product_id>', methods=['DELETE'])
@admin_required
def delete_product(current_user, product_id):
    """Delete a product (admin only)"""
    execute_query("DELETE FROM products WHERE id = %s", (product_id,), commit=True)
    return jsonify({'message': 'Product deleted successfully'}), 200
