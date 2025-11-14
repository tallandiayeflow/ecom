from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import token_required, admin_required
import uuid
from datetime import datetime

bp = Blueprint('vouchers', __name__)

# ==================== ADMIN ROUTES ====================

@bp.route('', methods=['GET'])
@admin_required
def get_all_vouchers(current_user):
    """Get all vouchers (Admin only)"""
    vouchers = execute_query(
        "SELECT * FROM vouchers ORDER BY created_at DESC",
        fetch_all=True
    )
    
    formatted = [{
        'id': v['id'],
        'code': v['code'],
        'discountType': v['type'],
        'discountValue': float(v['value']),
        'minPurchase': float(v['min_order_amount']),
        'maxUses': v['max_uses'],
        'usedCount': v['used_count'],
        'validFrom': v['valid_from'].isoformat() if v['valid_from'] else None,
        'validUntil': v['valid_until'].isoformat() if v['valid_until'] else None,
        'isActive': bool(v['is_active']),
        'createdAt': v['created_at'].isoformat() if v['created_at'] else None
    } for v in vouchers]
    
    return jsonify(formatted), 200


@bp.route('', methods=['POST'])
@admin_required
def create_voucher(current_user):
    """Create a new voucher (Admin only)"""
    data = request.get_json()
    
    # Validation des champs requis
    required = ['code', 'discountType', 'discountValue', 'validFrom', 'validUntil', 'isActive']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Champ {field} manquant'}), 400
    
    code = data['code'].strip().upper()
    
    # Vérifier si le code existe déjà
    exists = execute_query(
        "SELECT id FROM vouchers WHERE code = %s", 
        (code,), 
        fetch_one=True
    )
    if exists:
        return jsonify({'error': 'Code voucher existant'}), 409
    
    # Validation du type
    if data['discountType'] not in ['percentage', 'fixed']:
        return jsonify({'error': 'Type invalide (percentage ou fixed)'}), 400
    
    voucher_id = str(uuid.uuid4())
    
    execute_query(
        """INSERT INTO vouchers 
           (id, code, type, value, min_order_amount, max_uses, 
            valid_from, valid_until, is_active, created_at, used_count)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), 0)""",
        (
            voucher_id,
            code,
            data['discountType'],
            data['discountValue'],
            data.get('minPurchase', 0),
            data.get('maxUses', None),
            data['validFrom'],
            data['validUntil'],
            data['isActive']
        ),
        commit=True
    )
    
    return jsonify({'id': voucher_id, 'message': 'Voucher créé avec succès'}), 201


@bp.route('/<voucher_id>', methods=['PUT'])
@admin_required
def update_voucher(current_user, voucher_id):
    """Update an existing voucher (Admin only)"""
    data = request.get_json()
    
    fields = []
    values = []
    
    # Mapping des champs API vers colonnes DB
    mapping = {
        'code': 'code',
        'discountType': 'type',
        'discountValue': 'value',
        'minPurchase': 'min_order_amount',
        'maxUses': 'max_uses',
        'validFrom': 'valid_from',
        'validUntil': 'valid_until',
        'isActive': 'is_active'
    }
    
    for key, db_key in mapping.items():
        if key in data:
            # Conversion du code en majuscule
            if key == 'code':
                values.append(data[key].strip().upper())
            else:
                values.append(data[key])
            fields.append(f"{db_key} = %s")
    
    if not fields:
        return jsonify({'error': 'Aucun champ à mettre à jour'}), 400
    
    values.append(voucher_id)
    
    execute_query(
        f"UPDATE vouchers SET {', '.join(fields)} WHERE id = %s",
        tuple(values),
        commit=True
    )
    
    return jsonify({'message': 'Voucher mis à jour avec succès'}), 200


@bp.route('/<voucher_id>', methods=['DELETE'])
@admin_required
def delete_voucher(current_user, voucher_id):
    """Delete a voucher (Admin only)"""
    execute_query(
        "DELETE FROM vouchers WHERE id = %s",
        (voucher_id,),
        commit=True
    )
    
    return jsonify({'message': 'Voucher supprimé avec succès'}), 200


# ==================== CLIENT ROUTE ====================

@bp.route('/validate', methods=['POST'])
@token_required
def validate_voucher(current_user):
    data = request.get_json()

    # Vérifier présence des champs
    if not data.get('code') or not data.get('orderTotal'):
        return jsonify({'error': 'Code et montant de commande requis'}), 400

    code = data['code'].strip().upper()
    order_total = float(data['orderTotal'])

    voucher = execute_query(
        "SELECT * FROM vouchers WHERE code = %s AND is_active = 1",
        (code,),
        fetch_one=True
    )
    if not voucher:
        return jsonify({'error': 'Code promo invalide ou inactif'}), 404

    now = datetime.now()
    if voucher['valid_from'] and voucher['valid_from'] > now:
        return jsonify({'error': 'Ce code promo n’est pas encore actif'}), 400

    if voucher['valid_until'] and voucher['valid_until'] < now:
        return jsonify({'error': 'Ce code promo a expiré'}), 400

    if voucher['min_order_amount'] and order_total < float(voucher['min_order_amount']):
        return jsonify({'error': f'Montant minimum de {voucher["min_order_amount"]} requis'}), 400

    if voucher['max_uses'] and voucher['used_count'] >= voucher['max_uses']:
        return jsonify({'error': 'Ce code promo a atteint sa limite d’utilisation'}), 400

    discount = 0
    if voucher['type'] == 'percentage':
        discount = order_total * (float(voucher['value']) / 100)
    elif voucher['type'] == 'fixed':
        discount = float(voucher['value'])

    discount = min(discount, order_total)
    final_total = order_total - discount

    return jsonify({
        'valid': True,
        'voucher': {
            'id': voucher['id'],
            'code': voucher['code'],
            'type': voucher['type'],
            'value': float(voucher['value']),
            'discount': round(discount, 2)
        },
        'orderTotal': round(order_total, 2),
        'discount': round(discount, 2),
        'finalTotal': round(final_total, 2)
    }), 200