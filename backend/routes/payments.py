from flask import Blueprint, request, jsonify
import requests
import os
import json
import time
import uuid
from utils.database import execute_query
from utils.stock_sync import decrease_stock_from_order

bp = Blueprint('payments', __name__)

PAYTECH_API_KEY = os.getenv('PAYTECH_API_KEY')
PAYTECH_API_SECRET = os.getenv('PAYTECH_API_SECRET')
PAYTECH_API_URL = 'https://paytech.sn/api/payment/request-payment'
FRONTEND_URL = os.getenv('CORS_ORIGINS', 'https://talla-phone.vercel.app')
BACKEND_URL = os.getenv('BACKEND_URL', 'https://phone-backend.duckdns.org')

def create_order_from_data(data):
    user_id = data.get('user_id')
    items = data.get('items')
    shipping_address_obj = data.get('shippingAddress')
    json_shipping_address = json.dumps(shipping_address_obj)

    voucher_code = data.get('voucherCode')
    discount = float(data.get('discount', 0))
    total = float(data.get('total', 0))
    final_total = float(data.get('finalTotal', total))

    loyalty_points = int(final_total / 5000) if user_id else 0
    order_id = str(uuid.uuid4())

    execute_query(
        """
        INSERT INTO orders (id, user_id, total, discount, final_total,
                            status, shipping_address, voucher_code, loyalty_points_earned, created_at)
        VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s, NOW())
        """,
        (order_id, user_id, total, discount, final_total,
         json_shipping_address, voucher_code, loyalty_points),
        commit=True
    )

    for item in items:
        item_id = str(uuid.uuid4())
        product_name = item.get('name', '')
        product_image = ''
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
            INSERT INTO order_items (id, order_id, product_id, product_name, product_image, price, quantity)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (item_id, order_id, item['productId'], product_name, product_image, item['price'], item['quantity']),
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

    return order_id


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
    payment_method = data.get('payment_method', 'paytech')

    if not items or not shipping_address:
        return jsonify({'success': 0, 'message': 'Champs manquants'}), 400

    loyalty_points = int(final_total / 5000) if user_id else 0
    order_id = str(uuid.uuid4())

    try:
        # Créer commande temporaire pour respecter la contrainte FK
        execute_query(
            """
            INSERT INTO orders (id, user_id, total, discount, final_total,
                                status, shipping_address, voucher_code, loyalty_points_earned, created_at)
            VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s, NOW())
            """,
            (order_id, user_id, total, discount, final_total,
             shipping_address, voucher_code, loyalty_points),
            commit=True
        )

        for item in items:
            item_id = str(uuid.uuid4())
            product_name = item.get('name', '')
            product_image = ''
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
                INSERT INTO order_items (id, order_id, product_id, product_name, product_image, price, quantity)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (item_id, order_id, item['productId'], product_name, product_image, item['price'], item['quantity']),
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

    # Préparer appel PayTech
    item_name = f"Commande {order_id}"
    ref_command = f'ORDER_{order_id}_{int(time.time())}'

    payload = {
        "item_name": item_name,
        "item_price": final_total,
        "currency": "XOF",
        "ref_command": ref_command,
        "command_name": item_name,
        "env": "test",  # changer en "prod" en production
        "ipn_url": f"{BACKEND_URL}/api/payments/ipn",
        "success_url": f"{FRONTEND_URL}/payment-success",
        "cancel_url": f"{FRONTEND_URL}/payment-cancel/{order_id}",
        "custom_field": json.dumps(data),  # transmet toutes les données utiles
        
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
            (order_id, ref_command, payment_method, final_total, 'XOF', 'pending'),
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
            'UPDATE payments SET status=%s WHERE payment_ref=%s',
            ('paid', ref_command),
            commit=True
        )
        try:
            create_order_from_data(custom_field)
        except Exception as e:
            print(f"Erreur création commande via IPN : {e}")
            return "IPN KO - Erreur serveur", 500
        return "IPN OK", 200

    elif type_event == 'sale_canceled':
        execute_query(
            'UPDATE payments SET status=%s WHERE payment_ref=%s',
            ('canceled', ref_command),
            commit=True
        )
        return "IPN OK", 200

    return "IPN KO - Unknown event", 400
