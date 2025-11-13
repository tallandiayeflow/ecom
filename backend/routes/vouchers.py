from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import token_required, admin_required
import uuid
from datetime import datetime

bp = Blueprint('vouchers', __name__)

@bp.route('', methods=['GET'])
@admin_required
def get_all_vouchers(current_user):
    vouchers = execute_query(
        "SELECT * FROM vouchers ORDER BY created_at DESC",
        fetch_all=True
    )
    formatted = [{
        'id': v['id'],
        'code': v['code'],
        'discountType': v['type'],         # ici 'type' et non 'discount_type'
        'discountValue': float(v['value']), # ici 'value' et non 'discount_value'
        'minPurchase': float(v['min_order_amount']),
        'maxUses': v['max_uses'],
        'usedCount': v['used_count'],
        'expiryDate': v['valid_until'].isoformat() if v['valid_until'] else None,
        'isActive': v['is_active'],
        'createdAt': v['created_at'].isoformat() if v['created_at'] else None
    } for v in vouchers]
    return jsonify(formatted), 200


@bp.route('', methods=['POST'])
@admin_required
def create_voucher(current_user):
    data = request.get_json()
    required = ['code', 'discountType', 'discountValue', 'expiryDate', 'isActive']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Champ {field} manquant'}), 400

    code = data['code'].strip().upper()
    # Vérifie si le code existe déjà
    exists = execute_query("SELECT id FROM vouchers WHERE code = %s", (code,), fetch_one=True)
    if exists:
        return jsonify({'error': 'Code voucher existant'}), 409

    voucher_id = str(uuid.uuid4())
    execute_query(
        """INSERT INTO vouchers
           (id, code, discount_type, discount_value, min_purchase, max_uses, expiry_date, is_active, created_at, used_count)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), 0)""",
        (voucher_id, code, data['discountType'], data['discountValue'], data.get('minPurchase', 0),
         data.get('maxUses', None), data['expiryDate'], data['isActive']),
        commit=True
    )
    return jsonify({'id': voucher_id, 'message': 'Voucher créé'}), 201

@bp.route('/<voucher_id>', methods=['PUT'])
@admin_required
def update_voucher(current_user, voucher_id):
    data = request.get_json()
    fields = []
    values = []
    mapping = {
        'code': 'code',
        'discountType': 'discount_type',
        'discountValue': 'discount_value',
        'minPurchase': 'min_purchase',
        'maxUses': 'max_uses',
        'expiryDate': 'expiry_date',
        'isActive': 'is_active'
    }
    for key, db_key in mapping.items():
        if key in data:
            fields.append(f"{db_key} = %s")
            values.append(data[key])
    if not fields:
        return jsonify({'error': 'Aucun champ fourni'}), 400
    values.append(voucher_id)

    execute_query(
        f"UPDATE vouchers SET {', '.join(fields)} WHERE id = %s",
        tuple(values),
        commit=True
    )
    return jsonify({'message': 'Voucher mis à jour'}), 200

@bp.route('/<voucher_id>', methods=['DELETE'])
@admin_required
def delete_voucher(current_user, voucher_id):
    execute_query(
        "DELETE FROM vouchers WHERE id = %s",
        (voucher_id,),
        commit=True
    )
    return jsonify({'message': 'Voucher supprimé'}), 200
