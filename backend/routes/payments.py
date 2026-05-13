from flask import Blueprint, request, jsonify
import requests as http_requests
import hashlib
import os
import json
import time
import uuid
from utils.database import execute_query, get_db_connection
from utils.auth import token_required
from utils.stock_sync import decrease_stock_from_order, increase_stock_from_return
from utils.whatsapp import notify_admin_new_order

bp = Blueprint('payments', __name__)

PAYTECH_API_KEY    = os.getenv('PAYTECH_API_KEY')
PAYTECH_API_SECRET = os.getenv('PAYTECH_API_SECRET')
PAYTECH_API_URL    = 'https://paytech.sn/api/payment/request-payment'
FRONTEND_URL       = os.getenv('CORS_ORIGINS', 'https://talla-phone.vercel.app')
BACKEND_URL        = os.getenv('BACKEND_URL', 'https://phone-backend.duckdns.org')
PAYTECH_ENV        = os.getenv('PAYTECH_ENV', 'test')
PAYTECH_IPN_URL    = os.getenv('PAYTECH_IPN_URL', f'{BACKEND_URL}/api/payments/ipn')


def _verify_paytech_ipn(data: dict) -> bool:
    """Verify PayTech IPN signature using API_KEY + API_SECRET hash."""
    api_key    = PAYTECH_API_KEY or ''
    api_secret = PAYTECH_API_SECRET or ''
    token      = data.get('token', '')
    expected   = hashlib.sha256((api_key + api_secret).encode()).hexdigest()
    if token and token == expected:
        return True
    # Fallback: accept if running in test env and env is 'test'
    if PAYTECH_ENV == 'test' and data.get('env') == 'test':
        return True
    return False


@bp.route('/request-payment', methods=['POST'])
def request_payment():
    auth_header = request.headers.get('Authorization', '')
    user_id = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            from utils.auth import decode_token
            decoded = decode_token(token)
            user_id = decoded.get('user_id')
        except Exception:
            pass

    data = request.json or {}
    items = data.get('items')
    shipping = data.get('shippingAddress', {})
    voucher_code = (data.get('voucherCode') or '').strip().upper() or None

    if not items:
        return jsonify({'success': 0, 'message': 'Champs manquants'}), 400
    if not shipping.get('name') or not shipping.get('phone') or not shipping.get('address') or not shipping.get('city'):
        return jsonify({'success': 0, 'message': 'Adresse de livraison incomplète'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Recalculate total server-side
            actual_total = 0.0
            validated_items = []
            for item in items:
                cursor.execute("SELECT id, name, price, image_url, images FROM products WHERE id=%s", (item['productId'],))
                product = cursor.fetchone()
                if not product:
                    conn.rollback()
                    return jsonify({'success': 0, 'message': f"Produit introuvable: {item['productId']}"}), 400
                qty = max(1, int(item.get('quantity', 1)))
                actual_total += float(product['price']) * qty
                try:
                    images = json.loads(product.get('images') or '[]')
                    product_image = images[0] if images else product.get('image_url', '')
                except Exception:
                    product_image = product.get('image_url', '')
                validated_items.append({
                    'productId': product['id'],
                    'name': product['name'],
                    'price': float(product['price']),
                    'quantity': qty,
                    'image': product_image,
                    'selectedColor': item.get('selectedColor'),
                    'selectedSize': item.get('selectedSize'),
                })

            # Validate voucher server-side with lock
            actual_discount = 0.0
            if voucher_code:
                cursor.execute(
                    """SELECT id, type, value, min_order_amount, max_uses, used_count
                       FROM vouchers
                       WHERE code=%s AND is_active=1 AND valid_until >= NOW()
                       FOR UPDATE""",
                    (voucher_code,)
                )
                voucher = cursor.fetchone()
                if not voucher:
                    conn.rollback()
                    return jsonify({'success': 0, 'message': 'Voucher invalide ou expiré'}), 400
                if voucher['max_uses'] and voucher['used_count'] >= voucher['max_uses']:
                    conn.rollback()
                    return jsonify({'success': 0, 'message': 'Voucher épuisé'}), 400
                if actual_total < float(voucher['min_order_amount'] or 0):
                    conn.rollback()
                    return jsonify({'success': 0, 'message': 'Montant minimum non atteint pour ce voucher'}), 400
                if voucher['type'] == 'fixed':
                    actual_discount = min(float(voucher['value']), actual_total)
                elif voucher['type'] == 'percentage':
                    actual_discount = round(actual_total * float(voucher['value']) / 100, 2)

            actual_final_total = max(0.0, actual_total - actual_discount)
            loyalty_points = int(actual_final_total / 5000) if user_id else 0
            order_id = str(uuid.uuid4())

            cursor.execute(
                """INSERT INTO orders (id, user_id, total, discount, final_total,
                                      status, shipping_address, voucher_code,
                                      loyalty_points_earned, payment_method, created_at)
                   VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s, 'paytech', NOW())""",
                (order_id, user_id, actual_total, actual_discount, actual_final_total,
                 json.dumps(shipping), voucher_code, loyalty_points)
            )
            for item in validated_items:
                cursor.execute(
                    """INSERT INTO order_items (id, order_id, product_id, product_name,
                           product_image, price, quantity, selected_color, selected_size)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (str(uuid.uuid4()), order_id, item['productId'], item['name'], item['image'],
                     item['price'], item['quantity'], item['selectedColor'], item['selectedSize'])
                )
            if voucher_code:
                cursor.execute("UPDATE vouchers SET used_count = used_count + 1 WHERE code=%s", (voucher_code,))
            if user_id and loyalty_points > 0:
                cursor.execute("UPDATE users SET loyalty_points = loyalty_points + %s WHERE id=%s", (loyalty_points, user_id))
            conn.commit()

    except Exception as e:
        conn.rollback()
        return jsonify({'success': 0, 'message': 'Erreur création commande'}), 500
    finally:
        conn.close()

    decrease_stock_from_order(validated_items, user_id, reason=f"Commande #{order_id[:8]}")
    notify_admin_new_order(
        order_id=order_id,
        client_name=shipping.get('name', 'Inconnu'),
        client_phone=shipping.get('phone', ''),
        total=actual_final_total,
        items_count=len(validated_items),
    )

    ref_command = f'ORDER_{order_id}_{int(time.time())}'
    payload = {
        "item_name": f"Commande {order_id}",
        "item_price": int(actual_final_total),
        "currency": "XOF",
        "ref_command": ref_command,
        "command_name": f"Commande {order_id}",
        "env": PAYTECH_ENV,
        "ipn_url": PAYTECH_IPN_URL,
        "success_url": f"{FRONTEND_URL}/payment-success",
        "cancel_url": f"{FRONTEND_URL}/payment-cancel",
        "custom_field": json.dumps({"order_id": order_id}),
    }
    headers = {
        'API_KEY': PAYTECH_API_KEY,
        'API_SECRET': PAYTECH_API_SECRET,
        'Content-Type': 'application/json',
    }

    try:
        response = http_requests.post(PAYTECH_API_URL, json=payload, headers=headers, timeout=15)
        resp_json = response.json()
    except Exception as e:
        return jsonify({'success': 0, 'message': f'Erreur API PayTech: {str(e)}'}), 500

    if resp_json.get('success') == 1:
        execute_query(
            'INSERT INTO payments (order_id, payment_ref, payment_method, amount, currency, status) VALUES (%s, %s, %s, %s, %s, %s)',
            (order_id, ref_command, 'paytech', actual_final_total, 'XOF', 'pending'),
            commit=True
        )
        return jsonify({'success': 1, 'redirect_url': resp_json['redirect_url'], 'order_id': order_id})
    else:
        return jsonify({'success': 0, 'message': resp_json.get('message', 'Erreur PayTech')}), 400


def _delete_pending_paytech_order(order_id):
    order = execute_query(
        "SELECT id, status, voucher_code, user_id, loyalty_points_earned FROM orders WHERE id=%s",
        (order_id,), fetch_one=True
    )
    if not order or order['status'] != 'pending':
        return

    items = execute_query(
        "SELECT product_id, quantity FROM order_items WHERE order_id=%s",
        (order_id,), fetch_all=True
    )
    increase_stock_from_return(items or [], user_id=None, reason=f"Paiement annulé #{order_id[:8]}")

    if order.get('voucher_code'):
        execute_query(
            "UPDATE vouchers SET used_count = GREATEST(0, used_count - 1) WHERE code=%s",
            (order['voucher_code'],), commit=True
        )
    if order.get('user_id') and (order.get('loyalty_points_earned') or 0) > 0:
        execute_query(
            "UPDATE users SET loyalty_points = GREATEST(0, loyalty_points - %s) WHERE id=%s",
            (order['loyalty_points_earned'], order['user_id']), commit=True
        )
    execute_query("DELETE FROM orders WHERE id=%s", (order_id,), commit=True)


@bp.route('/ipn', methods=['POST'])
def payment_ipn():
    data = request.form.to_dict()
    type_event = data.get('type_event')
    ref_command = data.get('ref_command', '')

    # Verify IPN authenticity
    if not _verify_paytech_ipn(data):
        return "IPN KO - Invalid signature", 403

    # Validate ref_command format: ORDER_<uuid>_<timestamp>
    if not ref_command.startswith('ORDER_'):
        return "IPN KO - Invalid ref", 400

    try:
        custom_field = json.loads(data.get('custom_field', '{}'))
    except Exception:
        custom_field = {}

    order_id = custom_field.get('order_id')
    if not order_id:
        return "IPN KO - Missing order_id", 400

    # Verify order exists and is pending before any update
    order = execute_query("SELECT id, status FROM orders WHERE id=%s", (order_id,), fetch_one=True)
    if not order:
        return "IPN KO - Order not found", 404

    if type_event == 'sale_complete':
        if order['status'] == 'pending':
            execute_query(
                "UPDATE orders SET status='confirmed', payment_status='paid', payment_method='paytech' WHERE id=%s",
                (order_id,), commit=True
            )
            execute_query(
                "UPDATE payments SET status='paid' WHERE payment_ref=%s",
                (ref_command,), commit=True
            )
        return "IPN OK", 200

    elif type_event == 'sale_canceled':
        _delete_pending_paytech_order(order_id)
        return "IPN OK", 200

    return "IPN KO - Unknown event", 400


@bp.route('/cancel-order/<order_id>', methods=['POST'])
@token_required
def cancel_order(current_user, order_id):
    order = execute_query(
        "SELECT id, user_id, status FROM orders WHERE id=%s",
        (order_id,), fetch_one=True
    )
    if not order:
        return jsonify({'success': False, 'error': 'Commande introuvable'}), 404
    # Only order owner or admin can cancel
    if order['user_id'] != current_user['user_id'] and current_user.get('role') != 'admin':
        return jsonify({'success': False, 'error': 'Non autorisé'}), 403
    _delete_pending_paytech_order(order_id)
    return jsonify({'success': True})
