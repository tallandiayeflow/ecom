from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
import uuid
import json
from datetime import datetime

bp = Blueprint('flash_sales', __name__)

@bp.route('', methods=['GET'])
def get_flash_sales():
    """Get active flash sales"""
    now = datetime.now()
    
    flash_sales = execute_query(
        """SELECT fs.*, p.name, p.image_url, p.category_id,
                  c.name as category_name, c.slug as category_slug
           FROM flash_sales fs
           JOIN products p ON fs.product_id = p.id
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE fs.is_active = TRUE 
           AND fs.start_time <= %s 
           AND fs.end_time >= %s
           ORDER BY fs.end_time""",
        (now, now),
        fetch_all=True
    )
    
    formatted_sales = [{
        'id': fs['id'],
        'product': {
            'id': fs['product_id'],
            'name': fs['name'],
            'image': fs['image_url'],
            'category': fs['category_slug']
        },
        'originalPrice': float(fs['original_price']),
        'salePrice': float(fs['sale_price']),
        'startTime': fs['start_time'].isoformat() if fs['start_time'] else None,
        'endTime': fs['end_time'].isoformat() if fs['end_time'] else None,
        'stockLimit': fs['stock_limit'],
        'soldCount': fs['sold_count']
    } for fs in flash_sales]
    
    return jsonify(formatted_sales), 200

@bp.route('', methods=['POST'])
@admin_required
def create_flash_sale(current_user):
    """Create a flash sale (admin only)"""
    data = request.get_json()
    
    flash_sale_id = str(uuid.uuid4())
    
    execute_query(
        """INSERT INTO flash_sales 
           (id, product_id, original_price, sale_price, start_time, end_time, stock_limit)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (flash_sale_id, data['productId'], data['originalPrice'], data['salePrice'],
         data['startTime'], data['endTime'], data.get('stockLimit')),
        commit=True
    )
    
    return jsonify({'id': flash_sale_id, 'message': 'Flash sale created successfully'}), 201

@bp.route('/<flash_sale_id>', methods=['DELETE'])
@admin_required
def delete_flash_sale(current_user, flash_sale_id):
    """Delete a flash sale (admin only)"""
    execute_query("DELETE FROM flash_sales WHERE id = %s", (flash_sale_id,), commit=True)
    return jsonify({'message': 'Flash sale deleted successfully'}), 200
