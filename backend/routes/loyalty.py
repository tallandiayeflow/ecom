from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import token_required
import uuid
from datetime import datetime, timedelta
import random
import string

bp = Blueprint('loyalty', __name__)

# ==================== REDEEM LOYALTY POINTS ====================
@bp.route('/redeem', methods=['POST'])
@token_required
def redeem_loyalty_points(current_user):
    """
    Permet aux utilisateurs d'échanger leurs points de fidélité contre un voucher
    """
    data = request.get_json()
    
    # Validation des données
    if 'pointsCost' not in data or 'voucherValue' not in data:
        return jsonify({'error': 'pointsCost et voucherValue requis'}), 400
    
    points_cost = int(data['pointsCost'])
    voucher_value = float(data['voucherValue'])
    
    # Récupérer l'ID utilisateur depuis le payload JWT
    # current_user peut avoir 'user_id' ou 'id' selon votre implémentation
    user_id = current_user.get('user_id') or current_user.get('id')
    
    # Récupérer les points de l'utilisateur
    user = execute_query(
        "SELECT loyalty_points FROM users WHERE id = %s",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    current_points = user['loyalty_points']
    
    # Vérifier si l'utilisateur a assez de points
    if current_points < points_cost:
        return jsonify({
            'error': 'Points insuffisants',
            'required': points_cost,
            'available': current_points
        }), 400
    
    # Générer un code unique pour le voucher
    def generate_voucher_code():
        """Génère un code unique de 8 caractères alphanumériques"""
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    code = generate_voucher_code()
    
    # Vérifier l'unicité du code
    while execute_query("SELECT id FROM vouchers WHERE code = %s", (code,), fetch_one=True):
        code = generate_voucher_code()
    
    # Dates de validité du voucher (valide 30 jours)
    valid_from = datetime.now()
    valid_until = valid_from + timedelta(days=30)
    
    voucher_id = str(uuid.uuid4())
    
    try:
        # Créer le voucher
        execute_query(
            """INSERT INTO vouchers
            (id, code, type, value, min_order_amount, max_uses,
            valid_from, valid_until, is_active, created_at, used_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), 0)""",
            (
                voucher_id,
                code,
                'fixed',  # Type fixe car montant en FCFA
                voucher_value,
                0,  # Pas de montant minimum
                1,  # Utilisable une seule fois
                valid_from,
                valid_until,
                1  # Actif
            ),
            commit=True
        )
        
        # Déduire les points de l'utilisateur
        new_points = current_points - points_cost
        execute_query(
            "UPDATE users SET loyalty_points = %s WHERE id = %s",
            (new_points, user_id),
            commit=True
        )
        
        return jsonify({
            'message': 'Bon d\'achat généré avec succès',
            'voucher': {
                'id': voucher_id,
                'code': code,
                'value': voucher_value,
                'validFrom': valid_from.isoformat(),
                'validUntil': valid_until.isoformat()
            },
            'pointsDeducted': points_cost,
            'remainingPoints': new_points
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la création du voucher: {str(e)}'}), 500


# ==================== GET USER VOUCHERS ====================
@bp.route('/vouchers', methods=['GET'])
@token_required
def get_user_vouchers(current_user):
    """
    Récupère tous les vouchers actifs et valides
    """
    vouchers = execute_query(
        """SELECT * FROM vouchers 
        WHERE is_active = 1 
        AND valid_until >= NOW()
        AND (max_uses IS NULL OR used_count < max_uses)
        ORDER BY created_at DESC""",
        fetch_all=True
    )
    
    formatted = [{
        'id': v['id'],
        'code': v['code'],
        'type': v['type'],
        'value': float(v['value']),
        'minPurchase': float(v['min_order_amount']),
        'validFrom': v['valid_from'].isoformat() if v['valid_from'] else None,
        'validUntil': v['valid_until'].isoformat() if v['valid_until'] else None,
        'usedCount': v['used_count'],
        'maxUses': v['max_uses']
    } for v in vouchers]
    
    return jsonify(formatted), 200
