from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
import uuid
import json
from datetime import datetime

bp = Blueprint('flash_sales', __name__)

# ================= GET ALL FLASH SALES (ADMIN) =================
@bp.route('/admin', methods=['GET'])
@admin_required
def get_all_flash_sales(current_user):
    """
    Retourne toutes les ventes flash, passées, en cours ou futures.
    Admin seulement.
    """
    flash_sales = execute_query(
        """
        SELECT fs.*, p.name, p.description, p.price, p.image_url, p.images,
               p.stock, p.brand, p.specifications,
               c.name as category_name, c.slug as category_slug
        FROM flash_sales fs
        JOIN products p ON fs.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY fs.start_time DESC
        """,
        fetch_all=True
    )

    formatted_sales = []
    for fs in flash_sales:
        images_list = json.loads(fs['images']) if fs.get('images') else []
        specs = json.loads(fs['specifications']) if fs.get('specifications') else {}

        original_price = float(fs['original_price'])
        sale_price = float(fs['sale_price'])
        discount_percentage = round(((original_price - sale_price) / original_price) * 100)

        formatted_sales.append({
            'id': fs['id'],
            'productId': fs['product_id'],
            'product': {
                'id': fs['product_id'],
                'name': fs['name'],
                'description': fs.get('description', ''),
                'price': original_price,
                'images': images_list,
                'category': fs['category_slug'],
                'inStock': fs['stock'] > 0,
                'stockQuantity': fs['stock'],
                'specifications': specs,
                'brand': fs.get('brand')
            },
            'discountPrice': sale_price,
            'discountPercentage': discount_percentage,
            'startDate': fs['start_time'].isoformat() if fs['start_time'] else None,
            'endDate': fs['end_time'].isoformat() if fs['end_time'] else None,
            'stock': fs.get('stock_limit', fs['stock']),
            'soldCount': fs.get('sold_count', 0),
            'isActive': fs['is_active']
        })

    return jsonify(formatted_sales), 200
# ================= GET ACTIVE FLASH SALES (PUBLIC) =================
@bp.route('', methods=['GET'])
def get_active_flash_sales():
    """Liste uniquement les ventes flash actives et valides"""
    search = request.args.get('search', type=str)
    category = request.args.get('category', type=str)
    min_price = request.args.get('minPrice', type=float)
    max_price = request.args.get('maxPrice', type=float)
    in_stock = request.args.get('inStock', type=lambda v: v.lower() == 'true')
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=12, type=int)

    offset = (page - 1) * limit
    now = datetime.now()

    conditions = [
        "fs.is_active = TRUE",
        "fs.start_time <= %s",
        "fs.end_time >= %s"
    ]
    params = [now, now]

    if search:
        conditions.append("(p.name LIKE %s OR p.description LIKE %s)")
        search_param = f"%{search}%"
        params.extend([search_param, search_param])

    if category:
        conditions.append("c.slug = %s")
        params.append(category)

    if min_price is not None:
        conditions.append("fs.sale_price >= %s")
        params.append(min_price)

    if max_price is not None:
        conditions.append("fs.sale_price <= %s")
        params.append(max_price)

    if in_stock:
        conditions.append("(fs.stock_limit - fs.sold_count) > 0")

    where_clause = " AND ".join(conditions)

    query = f"""
        SELECT
            fs.id,
            fs.product_id,
            fs.sale_price AS discountPrice,
            ((p.price - fs.sale_price) / p.price * 100) AS discountPercentage,
            fs.start_time AS startDate,
            fs.end_time AS endDate,
            fs.stock_limit AS stock,
            fs.sold_count AS soldCount,
            fs.is_active AS isActive,
            p.name,
            p.description,
            p.price,
            p.images,
            p.category_id,
            c.slug AS category_slug,
            p.brand,
            p.stock
        FROM flash_sales fs
        JOIN products p ON fs.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE {where_clause}
        ORDER BY fs.start_time DESC
        LIMIT %s OFFSET %s
    """
    params.extend([limit, offset])
    flash_sales = execute_query(query, tuple(params), fetch_all=True)

    count_query = f"""
        SELECT COUNT(*)
        FROM flash_sales fs
        JOIN products p ON fs.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE {where_clause}
    """
    total_count = execute_query(count_query, tuple(params[:-2]), fetch_one=True)['COUNT(*)']

    formatted = []
    for fs in flash_sales:
        try:
            images_list = json.loads(fs['images']) if fs.get('images') else []
        except Exception:
            images_list = []

        formatted.append({
            'id': fs['id'],
            'productId': fs['product_id'],
            'product': {
                'id': fs['product_id'],
                'name': fs['name'],
                'description': fs['description'],
                'price': float(fs['price']),
                'images': images_list,
                'category': fs['category_slug'],
                'inStock': fs['stock'] > 0,
                'stockQuantity': fs['stock'],
                'brand': fs['brand'],
            },
            'discountPrice': float(fs['discountPrice']),
            'discountPercentage': round(float(fs['discountPercentage']), 2),
            'startDate': fs['startDate'].isoformat() if fs['startDate'] else None,
            'endDate': fs['endDate'].isoformat() if fs['endDate'] else None,
            'stock': fs['stock'],
            'soldCount': fs['soldCount'],
            'isActive': bool(fs['isActive']),
        })

    return jsonify({
        'flashSales': formatted,
        'total': total_count,
        'totalPages': (total_count + limit - 1) // limit,
        'currentPage': page
    })

# ================= GET FLASH SALE BY ID =================
@bp.route('/<flash_id>', methods=['GET'])
def get_flash_sale_by_id(flash_id):
    flash_sale = execute_query("""
        SELECT
            f.id,
            f.product_id,
            f.original_price,
            f.sale_price,
            f.start_time,
            f.end_time,
            f.stock_limit,
            f.sold_count,
            f.is_active,
            p.name,
            p.description,
            p.image_url,
            p.images,
            p.brand,
            p.category_id,
            p.stock,
            p.specifications,
            c.name as category_name,
            c.slug as category_slug
        FROM flash_sales f
        JOIN products p ON f.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE f.id = %s
    """, (flash_id,), fetch_one=True)

    if not flash_sale:
        return jsonify({'error': 'Vente flash non trouvée'}), 404

    try:
        images_list = json.loads(flash_sale['images']) if flash_sale.get('images') else []
    except Exception:
        images_list = []

    try:
        specs = json.loads(flash_sale['specifications']) if flash_sale.get('specifications') else {}
    except Exception:
        specs = {}

    original_price = float(flash_sale['original_price'])
    sale_price = float(flash_sale['sale_price'])
    discount_percentage = round(((original_price - sale_price) / original_price) * 100)
    remaining_stock = flash_sale['stock_limit'] - flash_sale['sold_count'] if flash_sale['stock_limit'] is not None else flash_sale['stock']

    now = datetime.now()
    start_time = flash_sale['start_time']
    end_time = flash_sale['end_time']

    is_ongoing = (
        bool(flash_sale['is_active']) and
        start_time <= now <= end_time and
        remaining_stock > 0
    )

    response = {
        'id': flash_sale['id'],
        'productId': flash_sale['product_id'],
        'product': {
            'id': flash_sale['product_id'],
            'name': flash_sale['name'],
            'description': flash_sale.get('description', ''),
            'price': original_price,
            'images': images_list,
            'category': flash_sale['category_slug'],
            'inStock': flash_sale['stock'] > 0,
            'stockQuantity': flash_sale['stock'],
            'specifications': specs,
            'brand': flash_sale.get('brand')
        },
        'discountPrice': sale_price,
        'discountPercentage': discount_percentage,
        'startDate': start_time.isoformat() if start_time else None,
        'endDate': end_time.isoformat() if end_time else None,
        'stock': flash_sale['stock_limit'],
        'soldCount': flash_sale['sold_count'],
        'remainingStock': remaining_stock,
        'isActive': bool(flash_sale['is_active']),
        'isOngoing': is_ongoing
    }

    return jsonify(response)

# ================= CREATE FLASH SALE =================
@bp.route('', methods=['POST'])
@admin_required
def create_flash_sale(current_user):
    data = request.get_json()

    required_fields = ['productId', 'discountPrice', 'startDate', 'endDate']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    product = execute_query(
        "SELECT price FROM products WHERE id = %s",
        (data['productId'],),
        fetch_one=True
    )
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    if data['discountPrice'] >= product['price']:
        return jsonify({'error': 'Discount price must be less than original price'}), 400

    def parse_iso_datetime(iso_str):
        try:
            return datetime.fromisoformat(iso_str.replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            return None

    start_time = parse_iso_datetime(data['startDate'])
    end_time = parse_iso_datetime(data['endDate'])

    if not start_time or not end_time:
        return jsonify({'error': 'Invalid date format'}), 400
    if datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S') <= datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S'):
        return jsonify({'error': 'End date must be after start date'}), 400

    flash_sale_id = str(uuid.uuid4())

    execute_query(
        """
        INSERT INTO flash_sales
            (id, product_id, original_price, sale_price, start_time, end_time, stock_limit, sold_count, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 0, TRUE)
        """,
        (
            flash_sale_id,
            data['productId'],
            product['price'],
            data['discountPrice'],
            start_time,
            end_time,
            data.get('stock', 100)
        ),
        commit=True
    )

    return jsonify({'id': flash_sale_id, 'message': 'Flash sale created successfully'}), 201

# ================= UPDATE FLASH SALE =================
@bp.route('/<flash_sale_id>', methods=['PUT'])
@admin_required
def update_flash_sale(current_user, flash_sale_id):
    """Met à jour une vente flash (admin uniquement)"""

    data = request.get_json()

    # Vérification que la vente flash existe
    sale = execute_query(
        "SELECT * FROM flash_sales WHERE id = %s",
        (flash_sale_id,),
        fetch_one=True
    )
    if not sale:
        return jsonify({'error': 'Flash sale not found'}), 404

    update_fields = []
    params = []

    # Gestion des champs modifiables
    if 'discountPrice' in data:
        update_fields.append("sale_price = %s")
        params.append(data['discountPrice'])

    if 'startDate' in data:
        try:
            start_time = datetime.fromisoformat(data['startDate'].replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M:%S')
            update_fields.append("start_time = %s")
            params.append(start_time)
        except Exception:
            return jsonify({'error': 'Invalid startDate format'}), 400

    if 'endDate' in data:
        try:
            end_time = datetime.fromisoformat(data['endDate'].replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M:%S')
            update_fields.append("end_time = %s")
            params.append(end_time)
        except Exception:
            return jsonify({'error': 'Invalid endDate format'}), 400

    if 'stock' in data:
        update_fields.append("stock_limit = %s")
        params.append(data['stock'])

    if 'isActive' in data:
        update_fields.append("is_active = %s")
        params.append(bool(data['isActive']))

    if not update_fields:
        return jsonify({'error': 'No valid fields to update'}), 400

    params.append(flash_sale_id)
    query = f"UPDATE flash_sales SET {', '.join(update_fields)} WHERE id = %s"

    execute_query(query, tuple(params), commit=True)

    return jsonify({'message': 'Flash sale updated successfully'}), 200

# ================= DELETE FLASH SALE =================
@bp.route('/<flash_sale_id>', methods=['DELETE'])
@admin_required
def delete_flash_sale(current_user, flash_sale_id):
    sale = execute_query(
        "SELECT id FROM flash_sales WHERE id = %s",
        (flash_sale_id,),
        fetch_one=True
    )

    if not sale:
        return jsonify({'error': 'Flash sale not found'}), 404

    execute_query(
        "DELETE FROM flash_sales WHERE id = %s",
        (flash_sale_id,),
        commit=True
    )

    return jsonify({'message': 'Flash sale deleted successfully'}), 200
