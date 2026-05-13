from flask import Blueprint, request, jsonify
import requests
import os
import json
import time
import uuid
from utils.database import execute_query
from utils.stock_sync import decrease_stock_from_order, increase_stock_from_return

bp = Blueprint('payments', __name__)

PAYTECH_API_KEY = os.getenv('PAYTECH_API_KEY')
PAYTECH_API_SECRET = os.getenv('PAYTECH_API_SECRET')
PAYTECH_API_URL = 'https://paytech.sn/api/payment/request-payment'
FRONTEND_URL = os.getenv('CORS_ORIGINS', 'https://talla-phone.vercel.app')
BACKEND_URL = os.getenv('BACKEND_URL', 'https://phone-backend.duckdns.org')
PAYTECH_ENV = os.getenv('PAYTECH_ENV', 'test')


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

    data = request.json
    print("Données reçues:", json.dumps(data, indent=2))
    items = data.get('items')
    shipping_address = json.dumps(data.get('shippingAddress', {}))
    voucher_code = data.get('voucherCode')
    discount = float(data.get('discount', 0))
    total = float(data.get('total', 0))
    final_total = float(data.get('finalTotal', total))
    if not items or not shipping_address:
        return jsonify({'success': 0, 'message': 'Champs manquants'}), 400

    loyalty_points = int(final_total / 5000) if user_id else 0
    order_id = str(uuid.uuid4())

    try:
        execute_query(
            """
            INSERT INTO orders (id, user_id, total, discount, final_total,
                                status, shipping_address, voucher_code,
                                loyalty_points_earned, payment_method, created_at)
            VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s, 'paytech', NOW())
            """,
            (order_id, user_id, total, discount, final_total,
             shipping_address, voucher_code, loyalty_points),
            commit=True
        )

        for item in items:
            item_id = str(uuid.uuid4())
            product_name = item.get('name', '')
            product_image = ''
            selected_color = item.get('selectedColor')
            selected_size = item.get('selectedSize')
            product = execute_query(
                "SELECT image_url, images FROM products WHERE id=%s",
                (item['productId'],),
                fetch_one=True
            )
            if product:
                try:
                    images = json.loads(product.get('images', '[]'))
                    product_image = images[0] if images else product.get('image_url', '')
                except Exception:
                    product_image = product.get('image_url', '')
            execute_query(
                """
                INSERT INTO order_items (id, order_id, product_id, product_name,
                    product_image, price, quantity, selected_color, selected_size)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (item_id, order_id, item['productId'], product_name, product_image,
                 item['price'], item['quantity'], selected_color, selected_size),
                commit=True
            )

        if voucher_code:
            execute_query(
                "UPDATE vouchers SET used_count = used_count + 1 WHERE code=%s",
                (voucher_code,),
                commit=True
            )

        decrease_stock_from_order(items, user_id, reason=f"Commande #{order_id[:8]}")

        if user_id and loyalty_points > 0:
            execute_query(
                "UPDATE users SET loyalty_points = loyalty_points + %s WHERE id=%s",
                (loyalty_points, user_id),
                commit=True
            )

    except Exception as e:
        print(f"Erreur création commande PayTech : {e}")
        return jsonify({'success': 0, 'message': 'Erreur création commande'}), 500

    item_name = f"Commande {order_id}"
    ref_command = f'ORDER_{order_id}_{int(time.time())}'

    custom_field_data = {**data, "order_id": order_id}

    payload = {
        "item_name": item_name,
        "item_price": final_total,
        "currency": "XOF",
        "ref_command": ref_command,
        "command_name": item_name,
        "env": PAYTECH_ENV,
        "ipn_url": f"{BACKEND_URL}/api/payments/ipn",
        "success_url": f"{FRONTEND_URL}/payment-success",
        "cancel_url": f"{FRONTEND_URL}/payment-cancel",
        "custom_field": json.dumps(custom_field_data),
    }

    headers = {
        'API_KEY': PAYTECH_API_KEY,
        'API_SECRET': PAYTECH_API_SECRET,
        'Content-Type': 'application/json'
    }

    try:
        response = requests.post(PAYTECH_API_URL, json=payload, headers=headers)
        resp_json = response.json()
    except Exception as e:
        return jsonify({'success': 0, 'message': f'Erreur API PayTech: {str(e)}'}), 500

    if resp_json.get('success') == 1:
        execute_query(
            'INSERT INTO payments (order_id, payment_ref, payment_method, amount, currency, status) VALUES (%s, %s, %s, %s, %s, %s)',
            (order_id, ref_command, 'paytech', final_total, 'XOF', 'pending'),
            commit=True
        )
        return jsonify({'success': 1, 'redirect_url': resp_json['redirect_url'], 'order_id': order_id})
    else:
        return jsonify({'success': 0, 'message': resp_json.get('message', 'Erreur PayTech')}), 400


@bp.route('/ipn', methods=['POST'])
def payment_ipn():
    data = request.form.to_dict()
    type_event = data.get('type_event')
    ref_command = data.get('ref_command')
    custom_field_raw = data.get('custom_field', '{}')

    try:
        custom_field = json.loads(custom_field_raw)
    except Exception:
        custom_field = {}

    order_id = custom_field.get('order_id')
    if not order_id:
        return "IPN KO - Missing order_id", 400

    if type_event == 'sale_complete':
        execute_query(
            """UPDATE orders
               SET status='confirmed', payment_status='paid', payment_method='paytech'
               WHERE id=%s""",
            (order_id,),
            commit=True
        )
        execute_query(
            "UPDATE payments SET status='paid' WHERE payment_ref=%s",
            (ref_command,),
            commit=True
        )
        return "IPN OK", 200

    elif type_event == 'sale_canceled':
        execute_query(
            """UPDATE orders
               SET status='cancelled', payment_status='failed'
               WHERE id=%s AND status='pending'""",
            (order_id,),
            commit=True
        )
        execute_query(
            "UPDATE payments SET status='canceled' WHERE payment_ref=%s",
            (ref_command,),
            commit=True
        )
        items_to_restore = execute_query(
            "SELECT product_id, quantity FROM order_items WHERE order_id=%s",
            (order_id,),
            fetch_all=True
        )
        increase_stock_from_return(items_to_restore or [], user_id=None, reason=f"Paiement annulé #{order_id[:8]}")
        return "IPN OK", 200

    return "IPN KO - Unknown event", 400


@bp.route('/cancel-order/<order_id>', methods=['POST'])
def cancel_order(order_id):
    order = execute_query(
        "SELECT id, status FROM orders WHERE id=%s",
        (order_id,),
        fetch_one=True
    )
    if not order or order['status'] in ('cancelled', 'confirmed', 'shipped', 'delivered'):
        return jsonify({'success': True})

    execute_query(
        "UPDATE orders SET status='cancelled', payment_status='failed' WHERE id=%s",
        (order_id,),
        commit=True
    )

    items_to_restore = execute_query(
        "SELECT product_id, quantity FROM order_items WHERE order_id=%s",
        (order_id,),
        fetch_all=True
    )
    increase_stock_from_return(items_to_restore or [], user_id=None, reason=f"Paiement annulé #{order_id[:8]}")

    return jsonify({'success': True})
