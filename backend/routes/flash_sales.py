from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
import uuid
import json
from datetime import datetime

bp = Blueprint('flash_sales', __name__)

# ================= GET FLASH SALES =================
@bp.route('', methods=['GET'])
def get_flash_sales():
    """Get active flash sales"""
    now = datetime.now()
    flash_sales = execute_query(
        """
        SELECT fs.*, p.name, p.description, p.price, p.image_url, p.images,
               p.stock, p.brand, p.specifications,
               c.name AS category_name, c.slug AS category_slug
        FROM flash_sales fs
        JOIN products p ON fs.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE fs.is_active = TRUE
          AND fs.start_time <= %s
          AND fs.end_time >= %s
        ORDER BY fs.end_time
        """,
        (now, now),
        fetch_all=True
    )

    formatted_sales = []
    for fs in flash_sales:
        # Parser les images et specifications
        images_list = json.loads(fs['images']) if fs.get('images') else []
        specs = json.loads(fs['specifications']) if fs.get('specifications') else {}

        # Calculer le pourcentage de réduction
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
            'isActive': True
        })

    return jsonify(formatted_sales), 200


# ================= CREATE FLASH SALE =================
@bp.route('', methods=['POST'])
@admin_required
def create_flash_sale(current_user):
    """Create a flash sale (admin only)"""
    data = request.get_json()

    # Champs obligatoires
    required_fields = ['productId', 'discountPrice', 'startDate', 'endDate']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    # Récupérer le prix original du produit
    product = execute_query(
        "SELECT price FROM products WHERE id = %s",
        (data['productId'],),
        fetch_one=True
    )
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    # Convertir les dates ISO en format MySQL DATETIME
    def parse_iso_datetime(iso_str):
        try:
            return datetime.fromisoformat(iso_str.replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            return None

    start_time = parse_iso_datetime(data['startDate'])
    end_time = parse_iso_datetime(data['endDate'])
    if not start_time or not end_time:
        return jsonify({'error': 'Invalid date format'}), 400

    flash_sale_id = str(uuid.uuid4())

    execute_query(
        """
        INSERT INTO flash_sales
            (id, product_id, original_price, sale_price, start_time, end_time, stock_limit, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
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

    return jsonify({
        'id': flash_sale_id,
        'message': 'Flash sale created successfully'
    }), 201


# ================= DELETE FLASH SALE =================
@bp.route('/<flash_sale_id>', methods=['DELETE'])
@admin_required
def delete_flash_sale(current_user, flash_sale_id):
    """Delete a flash sale (admin only)"""
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
