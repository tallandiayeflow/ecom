from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
import uuid
import json
import os
from werkzeug.utils import secure_filename
import secrets

UPLOAD_FOLDER = 'uploads/products'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

bp = Blueprint('products', __name__)


def _parse_list_field(value):
    """Accept list[str] or 'a,b,c' and return list[str] or []"""
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [v.strip() for v in value.split(",") if v.strip()]
    return []


@bp.route('', methods=['GET'])
def get_products():
    """Get products with filtering and pagination"""
    category = request.args.get('category')
    min_price = request.args.get('minPrice', type=float)
    max_price = request.args.get('maxPrice', type=float)
    search = request.args.get('search', '').strip()
    in_stock = request.args.get('inStock', '').lower() == 'true'
    subcategory = request.args.get('subcategory')
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

    if subcategory:
        conditions.append("""p.id IN (
            SELECT ps.product_id FROM product_subcategories ps
            JOIN categories sc ON ps.subcategory_id = sc.id
            WHERE sc.slug = %s
        )""")
        params.append(subcategory)

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

    # Bulk fetch subcategories for all products on this page (avoids N+1)
    product_ids = [p['id'] for p in products]
    subcategories_by_product = {}
    if product_ids:
        placeholders = ', '.join(['%s'] * len(product_ids))
        sub_rows = execute_query(
            f"""SELECT ps.product_id, c.id, c.name, c.slug
                FROM product_subcategories ps
                JOIN categories c ON ps.subcategory_id = c.id
                WHERE ps.product_id IN ({placeholders})""",
            tuple(product_ids),
            fetch_all=True
        )
        for row in (sub_rows or []):
            subcategories_by_product.setdefault(row['product_id'], []).append({
                'id': row['id'],
                'name': row['name'],
                'slug': row['slug']
            })

    formatted_products = []
    for p in products:
        images_list = json.loads(p['images']) if p.get('images') else []
        specs = json.loads(p['specifications']) if p.get('specifications') else {}

        # ✅ NEW: colors/sizes
        colors_list = json.loads(p['colors']) if p.get('colors') else []
        sizes_list = json.loads(p['sizes']) if p.get('sizes') else []

        formatted_products.append({
            'id': p['id'],
            'name': p['name'],
            'description': p['description'] or '',
            'price': float(p['price']),
            'originalPrice': float(p['original_price']) if p.get('original_price') else None,
            'category': p['category_slug'],
            'images': images_list,
            'inStock': p['stock'] > 0,
            'stockQuantity': int(p['stock']),
            'specifications': specs,
            'featured': bool(p.get('is_featured', False)),
            'brand': p.get('brand'),
            'createdAt': p['created_at'].isoformat() if p.get('created_at') else None,

            # ✅ NEW
            'colors': colors_list,
            'sizes': sizes_list,
            'subcategories': subcategories_by_product.get(p['id'], []),
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

    images_list = json.loads(product['images']) if product.get('images') else []
    specs = json.loads(product['specifications']) if product.get('specifications') else {}

    # ✅ NEW
    colors_list = json.loads(product['colors']) if product.get('colors') else []
    sizes_list = json.loads(product['sizes']) if product.get('sizes') else []

    subcategories = execute_query(
        """SELECT c.id, c.name, c.slug
           FROM categories c
           JOIN product_subcategories ps ON c.id = ps.subcategory_id
           WHERE ps.product_id = %s""",
        (product_id,),
        fetch_all=True
    )

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
        'createdAt': product['created_at'].isoformat() if product.get('created_at') else None,

        # ✅ NEW
        'colors': colors_list,
        'sizes': sizes_list,
        'subcategories': [{'id': s['id'], 'name': s['name'], 'slug': s['slug']} for s in (subcategories or [])],
    }), 200


@bp.route('/upload', methods=['POST'])
@admin_required
def upload_image(current_user):
    """Upload a product image (admin only)"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add random string to avoid collisions
        unique_filename = f"{secrets.token_urlsafe(8)}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # Return the public URL
        url = f"/api/uploads/products/{unique_filename}"
        return jsonify({
            'url': url,
            'message': 'Image uploaded successfully'
        }), 201
    
    return jsonify({'error': 'Invalid file type'}), 400


@bp.route('', methods=['POST'])
@admin_required
def create_product(current_user):
    """Create a new product (admin only)"""
    data = request.get_json() or {}

    required_fields = ['name', 'description', 'price', 'category']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Field {field} is required'}), 400

    product_id = str(uuid.uuid4())

    images = data.get('images', [])
    if isinstance(images, str):
        images = [img.strip() for img in images.split(',') if img.strip()]

    image_url = images[0] if images else data.get('image', '')

    specifications = data.get('specifications', {})
    if isinstance(specifications, str):
        try:
            specifications = json.loads(specifications)
        except json.JSONDecodeError:
            specifications = {}

    # ✅ NEW: colors/sizes (optionnels)
    colors = _parse_list_field(data.get('colors'))
    sizes = _parse_list_field(data.get('sizes'))

    from utils.database import get_db_connection
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO products
                   (id, name, description, price, original_price, category_id,
                    image_url, images, stock, brand, specifications, is_featured,
                    colors, sizes)
                   VALUES (%s, %s, %s, %s, %s,
                          (SELECT id FROM categories WHERE slug = %s),
                          %s, %s, %s, %s, %s, %s,
                          %s, %s)""",
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
                    data.get('featured', False),
                    json.dumps(colors) if colors else None,
                    json.dumps(sizes) if sizes else None
                )
            )
            subcategory_ids = data.get('subcategory_ids') or []
            if subcategory_ids:
                cur.executemany(
                    "INSERT IGNORE INTO product_subcategories (product_id, subcategory_id) VALUES (%s, %s)",
                    [(product_id, sid) for sid in subcategory_ids]
                )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    return jsonify({'id': product_id, 'message': 'Product created successfully'}), 201


@bp.route('/<product_id>', methods=['PUT'])
@admin_required
def update_product(current_user, product_id):
    """Update a product (admin only)"""
    data = request.get_json() or {}

    updates = []
    params = []

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

    if 'images' in data:
        images = data['images']
        if isinstance(images, str):
            images = [img.strip() for img in images.split(',') if img.strip()]

        updates.append("images = %s")
        params.append(json.dumps(images))

        if images:
            updates.append("image_url = %s")
            params.append(images[0])

    if 'specifications' in data:
        specs = data['specifications']
        if isinstance(specs, str):
            try:
                specs = json.loads(specs)
            except json.JSONDecodeError:
                specs = {}
        updates.append("specifications = %s")
        params.append(json.dumps(specs))

    # ✅ NEW: colors/sizes
    if 'colors' in data:
        colors = _parse_list_field(data.get('colors'))
        updates.append("colors = %s")
        params.append(json.dumps(colors) if colors else None)

    if 'sizes' in data:
        sizes = _parse_list_field(data.get('sizes'))
        updates.append("sizes = %s")
        params.append(json.dumps(sizes) if sizes else None)

    if 'category' in data:
        updates.append("category_id = (SELECT id FROM categories WHERE slug = %s)")
        params.append(data['category'])

    if not updates and 'subcategory_ids' not in data:
        return jsonify({'error': 'No fields to update'}), 400

    from utils.database import get_db_connection
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Verify product exists
            cur.execute("SELECT id FROM products WHERE id = %s", (product_id,))
            if not cur.fetchone():
                return jsonify({'error': 'Product not found'}), 404

            # Update product fields
            if updates:
                params.append(product_id)
                query = f"UPDATE products SET {', '.join(updates)} WHERE id = %s"
                cur.execute(query, tuple(params))

            # Replace subcategory links atomically in the same transaction
            if 'subcategory_ids' in data:
                cur.execute("DELETE FROM product_subcategories WHERE product_id = %s", (product_id,))
                subcategory_ids = data['subcategory_ids']
                if subcategory_ids:
                    cur.executemany(
                        "INSERT INTO product_subcategories (product_id, subcategory_id) VALUES (%s, %s)",
                        [(product_id, sid) for sid in subcategory_ids]
                    )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

    return jsonify({'message': 'Product updated successfully'}), 200


@bp.route('/<product_id>', methods=['DELETE'])
@admin_required
def delete_product(current_user, product_id):
    """Delete a product (admin only)"""
    product = execute_query(
        "SELECT id FROM products WHERE id = %s",
        (product_id,),
        fetch_one=True
    )

    if not product:
        return jsonify({'error': 'Product not found'}), 404

    execute_query("DELETE FROM products WHERE id = %s", (product_id,), commit=True)
    return jsonify({'message': 'Product deleted successfully'}), 200
