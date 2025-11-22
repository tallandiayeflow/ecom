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

    # Format products according to TypeScript interface
    formatted_products = []
    for p in products:
        # Parse images JSON
        images_list = json.loads(p['images']) if p.get('images') else []
        
        # Parse specifications JSON
        specs = json.loads(p['specifications']) if p.get('specifications') else {}
        
        formatted_products.append({
            'id': p['id'],
            'name': p['name'],
            'description': p['description'] or '',
            'price': float(p['price']),
            'originalPrice': float(p['original_price']) if p.get('original_price') else None,
            'category': p['category_slug'],  # Slug de la catégorie
            'images': images_list,  # Array de strings
            'inStock': p['stock'] > 0,  # Boolean
            'stockQuantity': int(p['stock']),
            'specifications': specs,  # Record<string, string>
            'featured': bool(p.get('is_featured', False)),
            'brand': p.get('brand'),
            'createdAt': p['created_at'].isoformat() if p.get('created_at') else None
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

    # Parse images and specifications
    images_list = json.loads(product['images']) if product.get('images') else []
    specs = json.loads(product['specifications']) if product.get('specifications') else {}

    return jsonify({
        'id': product['id'],
        'name': product['name'],
        'description': product['description'] or '',
        'price': float(product['price']),
        'originalPrice': float(product['original_price']) if product.get('original_price') else None,
        'category': product['category_slug'],
        'images': images_list,
        'inStock': product['stock'] > 0,
        'stockQuantity': int(product['stock']),
        'specifications': specs,
        'featured': bool(product.get('is_featured', False)),
        'brand': product.get('brand'),
        'createdAt': product['created_at'].isoformat() if product.get('created_at') else None
    }), 200


@bp.route('', methods=['POST'])
@admin_required
def create_product(current_user):
    """Create a new product (admin only)"""
    data = request.get_json()
    
    # Validation des champs requis
    required_fields = ['name', 'description', 'price', 'category']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Field {field} is required'}), 400
    
    product_id = str(uuid.uuid4())
    
    # Préparer les images
    images = data.get('images', [])
    if isinstance(images, str):
        images = [img.strip() for img in images.split(',')]
    
    # Préparer l'image principale (première image de la liste)
    image_url = images[0] if images else data.get('image', '')
    
    # Préparer les spécifications
    specifications = data.get('specifications', {})
    if isinstance(specifications, str):
        try:
            specifications = json.loads(specifications)
        except json.JSONDecodeError:
            specifications = {}
    
    # Insérer le produit
    execute_query(
        """INSERT INTO products 
           (id, name, description, price, original_price, category_id, 
            image_url, images, stock, brand, specifications, is_featured)
           VALUES (%s, %s, %s, %s, %s, 
                   (SELECT id FROM categories WHERE slug = %s), 
                   %s, %s, %s, %s, %s, %s)""",
        (
            product_id, 
            data['name'], 
            data.get('description', ''), 
            data['price'],
            data.get('originalPrice'),
            data['category'],
            image_url,
            json.dumps(images),
            data.get('stock', 0),
            data.get('brand'),
            json.dumps(specifications),
            data.get('featured', False)
        ),
        commit=True
    )

    return jsonify({
        'id': product_id, 
        'message': 'Product created successfully'
    }), 201


@bp.route('/<product_id>', methods=['PUT'])
@admin_required
def update_product(current_user, product_id):
    """Update a product (admin only)"""
    data = request.get_json()
    
    updates = []
    params = []

    # Mapper les champs TypeScript aux champs SQL
    field_mappings = {
        'name': 'name',
        'description': 'description',
        'price': 'price',
        'originalPrice': 'original_price',
        'stock': 'stock',
        'brand': 'brand',
        'featured': 'is_featured'
    }

    for ts_field, sql_field in field_mappings.items():
        if ts_field in data:
            updates.append(f"{sql_field} = %s")
            params.append(data[ts_field])
    
    # Gérer les images
    if 'images' in data:
        images = data['images']
        if isinstance(images, str):
            images = [img.strip() for img in images.split(',')]
        
        updates.append("images = %s")
        params.append(json.dumps(images))
        
        # Mettre à jour aussi l'image principale
        if images:
            updates.append("image_url = %s")
            params.append(images[0])
    
    # Gérer les spécifications
    if 'specifications' in data:
        specs = data['specifications']
        if isinstance(specs, str):
            try:
                specs = json.loads(specs)
            except json.JSONDecodeError:
                specs = {}
        
        updates.append("specifications = %s")
        params.append(json.dumps(specs))
    
    # Gérer la catégorie (slug -> id)
    if 'category' in data:
        updates.append("category_id = (SELECT id FROM categories WHERE slug = %s)")
        params.append(data['category'])

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
    # Vérifier si le produit existe
    product = execute_query(
        "SELECT id FROM products WHERE id = %s",
        (product_id,),
        fetch_one=True
    )
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    execute_query("DELETE FROM products WHERE id = %s", (product_id,), commit=True)
    
    return jsonify({'message': 'Product deleted successfully'}), 200