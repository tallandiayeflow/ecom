from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
import json
import uuid
from werkzeug.security import generate_password_hash

bp = Blueprint('admin', __name__)

# ----------- Utilisateurs -----------

@bp.route('/users', methods=['GET'])
@admin_required
def admin_list_users(current_user):
    users = execute_query(
        "SELECT id, name, email, phone, address, role FROM users ORDER BY name ASC",
        fetch_all=True
    )
    return jsonify(users), 200

@bp.route('/users', methods=['POST'])
@admin_required
def admin_create_user(current_user):
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone', '')
    address = data.get('address', '')
    password = data.get('password')

    # Valider les champs obligatoires
    if not name or not email or not password:
        return jsonify({'error': 'Nom, email, et mot de passe sont requis'}), 400

    hashed_password = generate_password_hash(password)

    # Forcer le rôle admin, le formulaire ne l'envoie pas
    role = 'admin'

    try:
        execute_query(
            "INSERT INTO users (id, name, email, phone, address, password_hash, role) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (str(uuid.uuid4()), name, email, phone, address, hashed_password, role),
            commit=True
        )
    except Exception as e:
        print(f"Erreur création utilisateur : {e}")
        return jsonify({'error': 'Erreur création utilisateur'}), 500

    return jsonify({'message': 'Utilisateur admin créé avec succès'}), 201


@bp.route('/users/<user_id>', methods=['PUT'])
@admin_required
def admin_update_user(current_user, user_id):
    data = request.get_json()
    if not data.get('name') or not data.get('email'):
        return jsonify({'error': 'Nom et email requis'}), 400
    execute_query(
        "UPDATE users SET name=%s, email=%s, phone=%s, address=%s WHERE id=%s",
        (data['name'], data['email'], data.get('phone'), data.get('address'), user_id),
        commit=True
    )
    return jsonify({'message': 'Utilisateur mis à jour'}), 200

@bp.route('/users/<user_id>/toggle-status', methods=['PUT'])
@admin_required
def admin_toggle_user_status(current_user, user_id):
    user = execute_query("SELECT is_active FROM users WHERE id = %s", (user_id,), fetch_one=True)
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    new_status = 0 if user['is_active'] else 1
    execute_query("UPDATE users SET is_active = %s WHERE id = %s", (new_status, user_id), commit=True)
    return jsonify({'message': 'Statut utilisateur mis à jour'}), 200

# ----------- Commandes -----------

@bp.route('/orders', methods=['GET'])
@admin_required
def admin_get_orders(current_user):
    # Récupérer les paramètres de filtrage et pagination
    date_min = request.args.get('date_min')
    date_max = request.args.get('date_max')
    limit = request.args.get('limit', type=int, default=10)
    offset = request.args.get('offset', type=int, default=0)

    query = """
        SELECT o.*, u.name AS user_name, u.email AS user_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE 1=1
    """
    params = []

    if date_min:
        query += " AND o.created_at >= %s"
        params.append(date_min)
    if date_max:
        query += " AND o.created_at <= %s"
        params.append(date_max)

    query += " ORDER BY o.created_at DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])

    orders = execute_query(query, tuple(params), fetch_all=True)

    count_query = """
        SELECT COUNT(*) as total
        FROM orders o
        WHERE 1=1
    """
    count_params = []
    if date_min:
        count_query += " AND o.created_at >= %s"
        count_params.append(date_min)
    if date_max:
        count_query += " AND o.created_at <= %s"
        count_params.append(date_max)

    total_result = execute_query(count_query, tuple(count_params), fetch_one=True)
    total = total_result.get('total', 0)

    response = []
    for order in orders:
        items = execute_query("SELECT * FROM order_items WHERE order_id = %s", (order['id'],), fetch_all=True)
        response.append({
            'id': order['id'],
            'userId': order['user_id'],
            'userName': order.get('user_name'),
            'userEmail': order.get('user_email'),
            'status': order['status'],
            'paymentMethod': order.get('payment_method'),
            'paymentStatus': order.get('payment_status'),
            'paymentReference': order.get('payment_ref'),
            'total': float(order['total']),
            'discount': float(order.get('discount', 0)),
            'finalTotal': float(order.get('final_total', order['total'])),
            'shippingAddress': json.loads(order['shipping_address']),
            'voucherCode': order.get('voucher_code'),
            'loyaltyPointsEarned': order.get('loyalty_points_earned', 0),
            'items': [{
                'id': item['id'],
                'productId': item.get('product_id'),
                'productName': item['product_name'],
                'productImage': item.get('product_image', ''),
                'price': float(item['price']),
                'quantity': item['quantity']
            } for item in items],
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else None
        })

    return jsonify({'orders': response, 'total': total}), 200

@bp.route('/orders/<order_id>', methods=['GET'])
@admin_required
def admin_get_order_detail(current_user, order_id):
    order = execute_query(
        """
        SELECT o.*, u.name AS user_name, u.email AS user_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = %s
        """,
        (order_id,),
        fetch_one=True
    )
    if not order:
        return jsonify({'error': 'Commande non trouvée'}), 404
    items = execute_query("SELECT * FROM order_items WHERE order_id = %s", (order_id,), fetch_all=True)
    return jsonify({
        'id': order['id'],
        'userId': order['user_id'],
        'userName': order.get('user_name'),
        'userEmail': order.get('user_email'),
        'status': order['status'],
        'paymentMethod': order.get('payment_method'),
        'paymentStatus': order.get('payment_status'),
        'paymentReference': order.get('payment_ref'),
        'total': float(order['total']),
        'discount': float(order.get('discount', 0)),
        'finalTotal': float(order.get('final_total', order['total'])),
        'shippingAddress': json.loads(order['shipping_address']),
        'voucherCode': order.get('voucher_code'),
        'loyaltyPointsEarned': order.get('loyalty_points_earned', 0),
        'items': [{
            'id': item['id'],
            'productId': item.get('product_id'),
            'productName': item['product_name'],
            'productImage': item.get('product_image', ''),
            'price': float(item['price']),
            'quantity': item['quantity']
        } for item in items],
        'createdAt': order.get('created_at').isoformat() if order.get('created_at') else None
    }), 200

@bp.route('/orders/update/<order_id>', methods=['PUT'])
@admin_required
def admin_update_order_status(current_user, order_id):
    data = request.get_json()
    new_status = data.get('status')
    new_payment_method = data.get('payment_method')
    new_payment_status = data.get('payment_status')
    new_payment_reference = data.get('payment_reference')
    print(data)

    valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    valid_payment_statuses = ['pending', 'paid', 'failed']

    if new_status and new_status not in valid_statuses:
        return jsonify({'error': 'Statut commande invalide'}), 400

    if new_payment_status and new_payment_status not in valid_payment_statuses:
        return jsonify({'error': 'Statut paiement invalide'}), 400

    order = execute_query("SELECT id FROM orders WHERE id = %s", (order_id,), fetch_one=True)
    if not order:
        return jsonify({'error': 'Commande non trouvée'}), 404

    # Construire la requête de mise à jour dynamique selon champs fournis
    fields_to_update = []
    params = []

    if new_status:
        fields_to_update.append("status = %s")
        params.append(new_status)
    if new_payment_method is not None:
        fields_to_update.append("payment_method = %s")
        params.append(new_payment_method)
    if new_payment_status is not None:
        fields_to_update.append("payment_status = %s")
        params.append(new_payment_status)
    if new_payment_reference is not None:
        fields_to_update.append("payment_ref = %s")
        params.append(new_payment_reference)

    if not fields_to_update:
        return jsonify({'error': 'Aucun champ à mettre à jour fourni'}), 400

    query = f"UPDATE orders SET {', '.join(fields_to_update)} WHERE id = %s"
    params.append(order_id)

    execute_query(query, tuple(params), commit=True)
    return jsonify({'message': 'Commande mise à jour avec succès'}), 200


@bp.route('/orders/<order_id>', methods=['DELETE'])
@admin_required
def admin_delete_order(current_user, order_id):
    order = execute_query("SELECT id FROM orders WHERE id = %s", (order_id,), fetch_one=True)
    if not order:
        return jsonify({'error': 'Commande non trouvée'}), 404
    execute_query("DELETE FROM order_items WHERE order_id = %s", (order_id,), commit=True)
    execute_query("DELETE FROM orders WHERE id = %s", (order_id,), commit=True)
    return jsonify({'message': 'Commande supprimée'}), 200
