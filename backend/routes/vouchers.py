from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import token_required, admin_required
import uuid
from datetime import datetime

bp = Blueprint('vouchers', __name__)

@bp.route('', methods=['GET'])
@token_required
def get_vouchers(current_user):
    """Get available vouchers"""
    now = datetime.now()
    
    vouchers = execute_query(
        """SELECT * FROM vouchers
           WHERE is_active = TRUE
           AND valid_from <= %s
           AND valid_until >= %s
           AND (max_uses IS NULL OR used_count < max_uses)
           ORDER BY value DESC""",
        (now, now),
        fetch_all=True
    )
    
    formatted_vouchers = [{
        'id': v['id'],
        'code': v['code'],
        'type': v['type'],
        'value': float(v['value']),
        'minOrderAmount': float(v['min_order_amount']),
        'validFrom': v['valid_from'].isoformat() if v['valid_from'] else None,
        'validUntil': v['valid_until'].isoformat() if v['valid_until'] else None
    } for v in vouchers]
    
    return jsonify(formatted_vouchers), 200

@bp.route('/validate', methods=['POST'])
@token_required
def validate_voucher(current_user):
    """Validate a voucher code"""
    data = request.get_json()
    code = data.get('code', '').strip().upper()
    order_total = data.get('orderTotal', 0)
    
    if not code or order_total <= 0:
        return jsonify({'valid': False, 'message': 'Invalid request'}), 400
    
    now = datetime.now()
    
    voucher = execute_query(
        """SELECT * FROM vouchers
           WHERE code = %s
           AND is_active = TRUE
           AND valid_from <= %s
           AND valid_until >= %s""",
        (code, now, now),
        fetch_one=True
    )
    
    if not voucher:
        return jsonify({'valid': False, 'message': 'Invalid or expired voucher code'}), 200
    
    if voucher['max_uses'] and voucher['used_count'] >= voucher['max_uses']:
        return jsonify({'valid': False, 'message': 'Voucher usage limit reached'}), 200
    
    if order_total < voucher['min_order_amount']:
        return jsonify({
            'valid': False,
            'message': f"Minimum order amount is {voucher['min_order_amount']}"
        }), 200
    
    # Calculate discount
    if voucher['type'] == 'percentage':
        discount = (order_total * voucher['value']) / 100
    else:  # fixed
        discount = voucher['value']
    
    discount = min(discount, order_total)  # Don't exceed order total
    
    return jsonify({
        'valid': True,
        'discount': float(discount),
        'message': 'Voucher applied successfully'
    }), 200

@bp.route('', methods=['POST'])
@admin_required
def create_voucher(current_user):
    """Generate a voucher (admin only)"""
    data = request.get_json()
    
    voucher_id = str(uuid.uuid4())
    code = data.get('code', '').strip().upper()
    
    if not code:
        return jsonify({'error': 'Voucher code is required'}), 400
    
    # Check if code already exists
    existing = execute_query(
        "SELECT id FROM vouchers WHERE code = %s",
        (code,),
        fetch_one=True
    )
    
    if existing:
        return jsonify({'error': 'Voucher code already exists'}), 409
    
    execute_query(
        """INSERT INTO vouchers 
           (id, code, type, value, min_order_amount, max_uses, valid_from, valid_until)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (voucher_id, code, data['type'], data['value'], data.get('minOrderAmount', 0),
         data.get('maxUses'), data['validFrom'], data['validUntil']),
        commit=True
    )
    
    return jsonify({'id': voucher_id, 'message': 'Voucher created successfully'}), 201
