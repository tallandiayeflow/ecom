import uuid
import re
import bcrypt
from datetime import datetime, date
from flask import Blueprint, request, jsonify
from utils.auth import cashier_or_admin_required, admin_required, generate_pos_token, verify_password
from utils.database import execute_query, get_db_connection
from config import Config

bp = Blueprint('pos', __name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_pos_products_base():
    return execute_query(
        """SELECT p.id, p.name, p.price, p.stock, p.barcode,
                  (SELECT image_url FROM product_images
                   WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) AS image
           FROM products p
           WHERE p.is_active = 1""",
        fetch_all=True
    ) or []

def _session_belongs_to(session_id, user_id, role):
    """Returns session row if accessible, else None."""
    if role == 'admin':
        return execute_query(
            "SELECT * FROM pos_sessions WHERE id = %s",
            (session_id,), fetch_one=True
        )
    return execute_query(
        "SELECT * FROM pos_sessions WHERE id = %s AND cashier_id = %s",
        (session_id, user_id), fetch_one=True
    )

def _recompute_expected_cash(session_id):
    """Recalculate expected_cash and persist it."""
    row = execute_query(
        """SELECT opening_balance,
                  COALESCE(SUM(cash_tendered), 0) AS cash_in,
                  COALESCE(SUM(change_given), 0)  AS change_out
           FROM pos_sessions s
           LEFT JOIN pos_transactions t ON t.session_id = s.id
             AND t.status NOT IN ('voided')
             AND (t.payment_method = 'cash' OR t.payment_method = 'mixed')
           WHERE s.id = %s
           GROUP BY s.opening_balance""",
        (session_id,), fetch_one=True
    )
    if not row:
        return

    movements = execute_query(
        """SELECT COALESCE(SUM(CASE WHEN type='in' THEN amount ELSE 0 END), 0) AS mv_in,
                  COALESCE(SUM(CASE WHEN type='out' THEN amount ELSE 0 END), 0) AS mv_out
           FROM pos_cash_movements WHERE session_id = %s""",
        (session_id,), fetch_one=True
    )
    mv_in  = float(movements['mv_in'])  if movements else 0
    mv_out = float(movements['mv_out']) if movements else 0

    expected = (
        float(row['opening_balance'])
        + float(row['cash_in'])
        + mv_in
        - float(row['change_out'])
        - mv_out
    )
    execute_query(
        "UPDATE pos_sessions SET expected_cash = %s WHERE id = %s",
        (expected, session_id), commit=True
    )


# ---------------------------------------------------------------------------
# AUTH — POST /pos/auth/login
# ---------------------------------------------------------------------------

@bp.route('/auth/login', methods=['POST'])
def pos_login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    pin   = str(data.get('pin') or '').strip()

    if not email or not pin:
        return jsonify({'error': 'Email et PIN requis'}), 400

    user = execute_query(
        """SELECT id, name, email, role, pos_pin_hash, pos_pin_attempts, pos_pin_locked_until
           FROM users WHERE email = %s AND role IN ('cashier','admin') AND is_active = 1""",
        (email,), fetch_one=True
    )

    if not user:
        return jsonify({'error': 'Identifiants invalides'}), 401

    # Check lockout
    if user['pos_pin_locked_until']:
        locked_until = user['pos_pin_locked_until']
        if isinstance(locked_until, str):
            locked_until = datetime.fromisoformat(locked_until)
        if datetime.utcnow() < locked_until:
            return jsonify({'error': 'Compte verrouillé. Réessayez plus tard.'}), 423

    if not user['pos_pin_hash']:
        return jsonify({'error': 'PIN non configuré. Contactez un administrateur.'}), 401

    if not verify_password(pin, user['pos_pin_hash']):
        attempts = (user['pos_pin_attempts'] or 0) + 1
        if attempts >= 5:
            execute_query(
                "UPDATE users SET pos_pin_attempts = %s, pos_pin_locked_until = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE) WHERE id = %s",
                (attempts, user['id']), commit=True
            )
        else:
            execute_query(
                "UPDATE users SET pos_pin_attempts = %s WHERE id = %s",
                (attempts, user['id']), commit=True
            )
        return jsonify({'error': 'PIN incorrect'}), 401

    # Success — reset attempts
    execute_query(
        "UPDATE users SET pos_pin_attempts = 0, pos_pin_locked_until = NULL WHERE id = %s",
        (user['id'],), commit=True
    )

    token = generate_pos_token(user['id'], user['email'], user['role'])
    return jsonify({
        'token': token,
        'user': {'id': user['id'], 'name': user['name'], 'role': user['role']}
    })


# ---------------------------------------------------------------------------
# SESSIONS — shifts
# ---------------------------------------------------------------------------

@bp.route('/sessions', methods=['POST'])
@cashier_or_admin_required
def open_session(payload):
    user_id = payload['user_id']

    # Only one open session at a time
    existing = execute_query(
        "SELECT id FROM pos_sessions WHERE cashier_id = %s AND status = 'open'",
        (user_id,), fetch_one=True
    )
    if existing:
        return jsonify({'error': 'Session déjà ouverte', 'sessionId': existing['id']}), 409

    data = request.get_json() or {}
    opening_balance = float(data.get('openingBalance', 0))

    session_id = str(uuid.uuid4())
    execute_query(
        """INSERT INTO pos_sessions (id, cashier_id, opening_balance, expected_cash, status)
           VALUES (%s, %s, %s, %s, 'open')""",
        (session_id, user_id, opening_balance, opening_balance), commit=True
    )

    session = execute_query(
        "SELECT * FROM pos_sessions WHERE id = %s", (session_id,), fetch_one=True
    )
    return jsonify(_fmt_session(session)), 201


@bp.route('/sessions/current', methods=['GET'])
@cashier_or_admin_required
def get_current_session(payload):
    user_id = payload['user_id']
    session = execute_query(
        "SELECT * FROM pos_sessions WHERE cashier_id = %s AND status = 'open' ORDER BY opened_at DESC LIMIT 1",
        (user_id,), fetch_one=True
    )
    if not session:
        return jsonify({'session': None})
    return jsonify(_fmt_session(session))


@bp.route('/sessions', methods=['GET'])
@admin_required
def list_sessions(payload):
    date_filter = request.args.get('date')
    cashier_id  = request.args.get('cashierId')

    query = """SELECT s.*, u.name AS cashier_name
               FROM pos_sessions s
               JOIN users u ON u.id = s.cashier_id
               WHERE 1=1"""
    params = []
    if date_filter:
        query += " AND DATE(s.opened_at) = %s"
        params.append(date_filter)
    if cashier_id:
        query += " AND s.cashier_id = %s"
        params.append(cashier_id)
    query += " ORDER BY s.opened_at DESC LIMIT 200"

    sessions = execute_query(query, params or None, fetch_all=True) or []
    return jsonify([_fmt_session(s) for s in sessions])


@bp.route('/sessions/<session_id>/close', methods=['PUT'])
@cashier_or_admin_required
def close_session(payload, session_id):
    session = _session_belongs_to(session_id, payload['user_id'], payload['role'])
    if not session:
        return jsonify({'error': 'Session introuvable'}), 404
    if session['status'] == 'closed':
        return jsonify({'error': 'Session déjà fermée'}), 400

    _recompute_expected_cash(session_id)
    session = execute_query("SELECT * FROM pos_sessions WHERE id = %s", (session_id,), fetch_one=True)

    data = request.get_json() or {}
    closing_balance = float(data.get('closingBalance', 0))
    notes = data.get('notes', '')
    expected = float(session['expected_cash'] or 0)
    difference = closing_balance - expected

    execute_query(
        """UPDATE pos_sessions
           SET status = 'closed', closing_balance = %s, cash_difference = %s,
               closed_at = UTC_TIMESTAMP(), notes = %s
           WHERE id = %s""",
        (closing_balance, difference, notes, session_id), commit=True
    )

    session = execute_query("SELECT * FROM pos_sessions WHERE id = %s", (session_id,), fetch_one=True)
    report = _build_z_report(session_id)
    return jsonify({'session': _fmt_session(session), 'report': report})


@bp.route('/sessions/<session_id>/report', methods=['GET'])
@cashier_or_admin_required
def get_session_report(payload, session_id):
    session = _session_belongs_to(session_id, payload['user_id'], payload['role'])
    if not session:
        return jsonify({'error': 'Session introuvable'}), 404
    return jsonify(_build_z_report(session_id))


def _fmt_session(s):
    return {
        'id': s['id'],
        'cashierId': s['cashier_id'],
        'cashierName': s.get('cashier_name'),
        'openingBalance': float(s['opening_balance']),
        'expectedCash': float(s['expected_cash'] or 0),
        'closingBalance': float(s['closing_balance']) if s['closing_balance'] is not None else None,
        'cashDifference': float(s['cash_difference']) if s['cash_difference'] is not None else None,
        'status': s['status'],
        'openedAt': s['opened_at'].isoformat() if s['opened_at'] else None,
        'closedAt': s['closed_at'].isoformat() if s['closed_at'] else None,
        'notes': s['notes'],
    }


def _build_z_report(session_id):
    session = execute_query(
        "SELECT s.*, u.name AS cashier_name FROM pos_sessions s JOIN users u ON u.id = s.cashier_id WHERE s.id = %s",
        (session_id,), fetch_one=True
    )
    if not session:
        return {}

    txns = execute_query(
        "SELECT * FROM pos_transactions WHERE session_id = %s AND status != 'voided'",
        (session_id,), fetch_all=True
    ) or []

    total_sales    = sum(float(t['total']) for t in txns)
    total_cash     = sum(float(t['cash_tendered']) for t in txns if t['payment_method'] in ('cash','mixed'))
    total_wave     = sum(float(t['mobile_tendered']) for t in txns if t['payment_method'] == 'wave')
    total_om       = sum(float(t['mobile_tendered']) for t in txns if t['payment_method'] == 'orange_money')
    total_mixed    = sum(float(t['total']) for t in txns if t['payment_method'] == 'mixed')
    total_discount = sum(float(t['discount']) for t in txns)
    total_change   = sum(float(t['change_given']) for t in txns)
    count          = len(txns)

    returns = execute_query(
        "SELECT * FROM pos_returns WHERE session_id = %s",
        (session_id,), fetch_all=True
    ) or []
    total_refunded = sum(float(r['total_refunded']) for r in returns)

    movements = execute_query(
        "SELECT * FROM pos_cash_movements WHERE session_id = %s",
        (session_id,), fetch_all=True
    ) or []
    mv_in  = sum(float(m['amount']) for m in movements if m['type'] == 'in')
    mv_out = sum(float(m['amount']) for m in movements if m['type'] == 'out')

    return {
        'sessionId': session_id,
        'cashierName': session['cashier_name'],
        'openedAt': session['opened_at'].isoformat() if session['opened_at'] else None,
        'closedAt': session['closed_at'].isoformat() if session['closed_at'] else None,
        'openingBalance': float(session['opening_balance']),
        'expectedCash': float(session['expected_cash'] or 0),
        'closingBalance': float(session['closing_balance']) if session['closing_balance'] is not None else None,
        'cashDifference': float(session['cash_difference']) if session['cash_difference'] is not None else None,
        'salesCount': count,
        'totalSales': total_sales,
        'totalCash': total_cash,
        'totalWave': total_wave,
        'totalOrangeMoney': total_om,
        'totalMixed': total_mixed,
        'totalDiscount': total_discount,
        'totalChange': total_change,
        'totalRefunded': total_refunded,
        'cashIn': mv_in,
        'cashOut': mv_out,
        'netCash': float(session['opening_balance']) + total_cash + mv_in - total_change - mv_out,
        'returnsCount': len(returns),
    }


# ---------------------------------------------------------------------------
# PRODUCTS (POS-optimized)
# ---------------------------------------------------------------------------

@bp.route('/products', methods=['GET'])
@cashier_or_admin_required
def pos_products(payload):
    q = (request.args.get('q') or '').strip()
    if q:
        products = execute_query(
            """SELECT id, name, price, stock, barcode, image_url AS image
               FROM products
               WHERE (name LIKE %s OR barcode = %s)
               ORDER BY name LIMIT 50""",
            (f'%{q}%', q), fetch_all=True
        ) or []
    else:
        products = execute_query(
            """SELECT id, name, price, stock, barcode, image_url AS image
               FROM products ORDER BY name LIMIT 200""",
            fetch_all=True
        ) or []

    return jsonify([_fmt_product(p) for p in products])


@bp.route('/products/barcode/<code>', methods=['GET'])
@cashier_or_admin_required
def pos_product_by_barcode(payload, code):
    product = execute_query(
        """SELECT id, name, price, stock, barcode, image_url AS image
           FROM products WHERE barcode = %s""",
        (code,), fetch_one=True
    )
    if not product:
        return jsonify({'error': 'Produit non trouvé'}), 404
    return jsonify(_fmt_product(product))


def _fmt_product(p):
    return {
        'id': p['id'],
        'name': p['name'],
        'price': float(p['price']),
        'stock': p['stock'],
        'barcode': p['barcode'],
        'image': p.get('image'),
    }


# ---------------------------------------------------------------------------
# TRANSACTIONS — single sale
# ---------------------------------------------------------------------------

@bp.route('/transactions', methods=['POST'])
@cashier_or_admin_required
def create_transaction(payload):
    data = request.get_json() or {}
    return _process_single_transaction(data, payload['user_id'], payload['role'])


def _process_single_transaction(data, user_id, role):
    session_id = data.get('sessionId')
    if not session_id:
        return jsonify({'error': 'sessionId requis'}), 400

    session = _session_belongs_to(session_id, user_id, role)
    if not session:
        return jsonify({'error': 'Session introuvable'}), 404
    if session['status'] != 'open':
        return jsonify({'error': 'Session fermée'}), 400

    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'Aucun article'}), 400

    txn_id = data.get('id') or str(uuid.uuid4())
    txn_number = data.get('transactionNumber') or _generate_txn_number(user_id)
    customer_name  = data.get('customerName')
    customer_phone = _sanitize_phone(data.get('customerPhone'))
    subtotal  = float(data.get('subtotal', 0))
    discount  = float(data.get('discount', 0))
    total     = float(data.get('total', 0))
    payment_method   = data.get('paymentMethod', 'cash')
    cash_tendered    = float(data.get('cashTendered', 0))
    mobile_tendered  = float(data.get('mobileTendered', 0))
    mobile_reference = data.get('mobileReference')
    change_given     = float(data.get('changeGiven', 0))
    client_created_at = data.get('clientCreatedAt')
    synced = data.get('synced', True)

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Check duplicate (idempotent on UUID)
            cur.execute("SELECT id FROM pos_transactions WHERE id = %s", (txn_id,))
            if cur.fetchone():
                conn.close()
                txn = execute_query("SELECT * FROM pos_transactions WHERE id = %s", (txn_id,), fetch_one=True)
                return jsonify({'transaction': _fmt_transaction(txn), 'status': 'already_synced'}), 200

            cur.execute(
                """INSERT INTO pos_transactions
                   (id, transaction_number, session_id, cashier_id, customer_name, customer_phone,
                    subtotal, discount, total, payment_method, cash_tendered, mobile_tendered,
                    mobile_reference, change_given, status, synced, client_created_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'completed',%s,%s)""",
                (txn_id, txn_number, session_id, user_id, customer_name, customer_phone,
                 subtotal, discount, total, payment_method, cash_tendered, mobile_tendered,
                 mobile_reference, change_given, synced, client_created_at)
            )

            for item in items:
                item_id = item.get('id') or str(uuid.uuid4())
                product_id   = item.get('productId')
                product_name = item.get('productName', '')
                product_barcode = item.get('productBarcode')
                unit_price  = float(item.get('unitPrice', 0))
                quantity    = int(item.get('quantity', 1))
                item_discount = float(item.get('discount', 0))
                line_total  = float(item.get('lineTotal', unit_price * quantity))

                cur.execute(
                    """INSERT INTO pos_transaction_items
                       (id, transaction_id, product_id, product_name, product_barcode,
                        unit_price, quantity, discount, line_total)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (item_id, txn_id, product_id, product_name, product_barcode,
                     unit_price, quantity, item_discount, line_total)
                )

                # Decrement stock (accept negative — flag only)
                if product_id:
                    cur.execute("SELECT stock FROM products WHERE id = %s FOR UPDATE", (product_id,))
                    prod = cur.fetchone()
                    if prod:
                        new_stock = prod['stock'] - quantity
                        cur.execute("UPDATE products SET stock = %s WHERE id = %s", (new_stock, product_id))

            conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

    _recompute_expected_cash(session_id)

    txn = execute_query("SELECT * FROM pos_transactions WHERE id = %s", (txn_id,), fetch_one=True)
    return jsonify({'transaction': _fmt_transaction(txn), 'status': 'synced'}), 201


@bp.route('/transactions/batch', methods=['POST'])
@cashier_or_admin_required
def batch_sync(payload):
    data = request.get_json() or {}
    transactions = data.get('transactions', [])
    if not transactions:
        return jsonify({'results': []})

    # Sort by client_created_at ascending
    transactions.sort(key=lambda t: t.get('clientCreatedAt') or '')

    results = []
    for txn_data in transactions:
        resp, status_code = _process_single_transaction(txn_data, payload['user_id'], payload['role'])
        resp_json = resp.get_json()
        results.append({
            'id': txn_data.get('id'),
            'status': resp_json.get('status', 'error'),
            'detail': resp_json.get('error'),
        })

    return jsonify({'results': results})


@bp.route('/transactions', methods=['GET'])
@cashier_or_admin_required
def list_transactions(payload):
    session_id = request.args.get('sessionId')
    limit = int(request.args.get('limit', 50))

    if payload['role'] == 'admin':
        if session_id:
            txns = execute_query(
                "SELECT * FROM pos_transactions WHERE session_id = %s ORDER BY created_at DESC LIMIT %s",
                (session_id, limit), fetch_all=True
            ) or []
        else:
            txns = execute_query(
                "SELECT * FROM pos_transactions ORDER BY created_at DESC LIMIT %s",
                (limit,), fetch_all=True
            ) or []
    else:
        if session_id:
            txns = execute_query(
                "SELECT * FROM pos_transactions WHERE session_id = %s AND cashier_id = %s ORDER BY created_at DESC LIMIT %s",
                (session_id, payload['user_id'], limit), fetch_all=True
            ) or []
        else:
            txns = execute_query(
                "SELECT * FROM pos_transactions WHERE cashier_id = %s ORDER BY created_at DESC LIMIT %s",
                (payload['user_id'], limit), fetch_all=True
            ) or []

    return jsonify([_fmt_transaction(t) for t in txns])


@bp.route('/transactions/<txn_id>', methods=['GET'])
@cashier_or_admin_required
def get_transaction(payload, txn_id):
    if payload['role'] == 'admin':
        txn = execute_query("SELECT * FROM pos_transactions WHERE id = %s", (txn_id,), fetch_one=True)
    else:
        txn = execute_query(
            "SELECT * FROM pos_transactions WHERE id = %s AND cashier_id = %s",
            (txn_id, payload['user_id']), fetch_one=True
        )
    if not txn:
        return jsonify({'error': 'Transaction introuvable'}), 404

    items = execute_query(
        "SELECT * FROM pos_transaction_items WHERE transaction_id = %s",
        (txn_id,), fetch_all=True
    ) or []

    result = _fmt_transaction(txn)
    result['items'] = [_fmt_txn_item(i) for i in items]
    return jsonify(result)


@bp.route('/transactions/<txn_id>/receipt', methods=['POST'])
@cashier_or_admin_required
def send_receipt(payload, txn_id):
    if payload['role'] == 'admin':
        txn = execute_query("SELECT * FROM pos_transactions WHERE id = %s", (txn_id,), fetch_one=True)
    else:
        txn = execute_query(
            "SELECT * FROM pos_transactions WHERE id = %s AND cashier_id = %s",
            (txn_id, payload['user_id']), fetch_one=True
        )
    if not txn:
        return jsonify({'error': 'Transaction introuvable'}), 404

    phone = _sanitize_phone(txn['customer_phone'])
    if not phone:
        return jsonify({'error': 'Numéro de téléphone manquant'}), 400

    items = execute_query(
        "SELECT * FROM pos_transaction_items WHERE transaction_id = %s",
        (txn_id,), fetch_all=True
    ) or []

    lines = '\n'.join(
        f"  {i['product_name']} x{i['quantity']} = {float(i['line_total']):.0f} XOF"
        for i in items
    )
    msg = (
        f"NOOR - Recu #{txn['transaction_number']}\n"
        f"{lines}\n"
        f"Total: {float(txn['total']):.0f} XOF\n"
        f"Paiement: {txn['payment_method']}\n"
        f"Merci pour votre achat!"
    )

    try:
        from twilio.rest import Client
        client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
        client.messages.create(body=msg, from_=Config.TWILIO_FROM_NUMBER, to=phone)
        return jsonify({'sent': True})
    except Exception as e:
        return jsonify({'error': f'SMS failed: {str(e)}'}), 500


def _fmt_transaction(t):
    return {
        'id': t['id'],
        'transactionNumber': t['transaction_number'],
        'sessionId': t['session_id'],
        'cashierId': t['cashier_id'],
        'customerName': t['customer_name'],
        'customerPhone': t['customer_phone'],
        'subtotal': float(t['subtotal']),
        'discount': float(t['discount']),
        'total': float(t['total']),
        'paymentMethod': t['payment_method'],
        'cashTendered': float(t['cash_tendered']),
        'mobileTendered': float(t['mobile_tendered']),
        'mobileReference': t['mobile_reference'],
        'changeGiven': float(t['change_given']),
        'status': t['status'],
        'synced': bool(t['synced']),
        'createdAt': t['created_at'].isoformat() if t['created_at'] else None,
        'clientCreatedAt': t['client_created_at'].isoformat() if t['client_created_at'] else None,
    }


def _fmt_txn_item(i):
    return {
        'id': i['id'],
        'productId': i['product_id'],
        'productName': i['product_name'],
        'productBarcode': i['product_barcode'],
        'unitPrice': float(i['unit_price']),
        'quantity': i['quantity'],
        'discount': float(i['discount']),
        'lineTotal': float(i['line_total']),
    }


# ---------------------------------------------------------------------------
# RETURNS
# ---------------------------------------------------------------------------

@bp.route('/returns', methods=['POST'])
@cashier_or_admin_required
def create_return(payload):
    data = request.get_json() or {}
    original_txn_id = data.get('originalTransactionId')
    session_id      = data.get('sessionId')
    refund_method   = data.get('refundMethod', 'cash')
    reason          = data.get('reason', '')
    items           = data.get('items', [])

    if not original_txn_id or not session_id or not items:
        return jsonify({'error': 'Champs manquants'}), 400

    # Verify original transaction
    if payload['role'] == 'admin':
        orig = execute_query("SELECT * FROM pos_transactions WHERE id = %s", (original_txn_id,), fetch_one=True)
    else:
        orig = execute_query(
            "SELECT * FROM pos_transactions WHERE id = %s",
            (original_txn_id,), fetch_one=True
        )
    if not orig:
        return jsonify({'error': 'Transaction originale introuvable'}), 404

    # Verify session
    session = _session_belongs_to(session_id, payload['user_id'], payload['role'])
    if not session or session['status'] != 'open':
        return jsonify({'error': 'Session invalide ou fermée'}), 400

    # Check quantities
    orig_items = execute_query(
        "SELECT * FROM pos_transaction_items WHERE transaction_id = %s",
        (original_txn_id,), fetch_all=True
    ) or []
    orig_map = {i['product_id']: i for i in orig_items if i['product_id']}

    prior_returns = execute_query(
        """SELECT ri.product_id, SUM(ri.quantity_returned) AS returned
           FROM pos_returns r
           JOIN pos_return_items ri ON ri.return_id = r.id
           WHERE r.original_transaction_id = %s
           GROUP BY ri.product_id""",
        (original_txn_id,), fetch_all=True
    ) or []
    returned_map = {r['product_id']: int(r['returned']) for r in prior_returns}

    total_refunded = 0.0
    for item in items:
        pid = item.get('productId')
        qty = int(item.get('quantityReturned', 0))
        orig_item = orig_map.get(pid)
        if not orig_item:
            return jsonify({'error': f'Produit {pid} absent de la transaction originale'}), 400
        already_returned = returned_map.get(pid, 0)
        if qty > (orig_item['quantity'] - already_returned):
            return jsonify({'error': f'Quantité retournée dépasse le vendable pour {orig_item["product_name"]}'}), 400
        total_refunded += float(orig_item['unit_price']) * qty

    # Persist
    return_id = str(uuid.uuid4())
    return_number = _generate_return_number(payload['user_id'])

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO pos_returns
                   (id, return_number, original_transaction_id, session_id, cashier_id,
                    refund_method, total_refunded, reason)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                (return_id, return_number, original_txn_id, session_id,
                 payload['user_id'], refund_method, total_refunded, reason)
            )
            for item in items:
                pid = item.get('productId')
                qty = int(item.get('quantityReturned', 0))
                orig_item = orig_map.get(pid, {})
                unit_price = float(orig_item.get('unit_price', 0))
                cur.execute(
                    """INSERT INTO pos_return_items
                       (id, return_id, product_id, product_name, quantity_returned, unit_price, line_total)
                       VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                    (str(uuid.uuid4()), return_id, pid,
                     orig_item.get('product_name', ''), qty, unit_price, unit_price * qty)
                )
                # Restore stock
                if pid:
                    cur.execute("SELECT stock FROM products WHERE id = %s FOR UPDATE", (pid,))
                    prod = cur.fetchone()
                    if prod:
                        cur.execute("UPDATE products SET stock = %s WHERE id = %s",
                                    (prod['stock'] + qty, pid))

            # Update original transaction status
            total_sold = sum(float(i['line_total']) for i in orig_items)
            all_returned = total_refunded >= total_sold
            new_status = 'refunded' if all_returned else 'partially_refunded'
            cur.execute("UPDATE pos_transactions SET status = %s WHERE id = %s",
                        (new_status, original_txn_id))

            conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

    ret = execute_query("SELECT * FROM pos_returns WHERE id = %s", (return_id,), fetch_one=True)
    return jsonify(_fmt_return(ret)), 201


@bp.route('/returns/<return_id>', methods=['GET'])
@cashier_or_admin_required
def get_return(payload, return_id):
    ret = execute_query("SELECT * FROM pos_returns WHERE id = %s", (return_id,), fetch_one=True)
    if not ret:
        return jsonify({'error': 'Retour introuvable'}), 404
    items = execute_query("SELECT * FROM pos_return_items WHERE return_id = %s",
                          (return_id,), fetch_all=True) or []
    result = _fmt_return(ret)
    result['items'] = items
    return jsonify(result)


def _fmt_return(r):
    return {
        'id': r['id'],
        'returnNumber': r['return_number'],
        'originalTransactionId': r['original_transaction_id'],
        'sessionId': r['session_id'],
        'cashierId': r['cashier_id'],
        'refundMethod': r['refund_method'],
        'totalRefunded': float(r['total_refunded']),
        'reason': r['reason'],
        'createdAt': r['created_at'].isoformat() if r['created_at'] else None,
    }


# ---------------------------------------------------------------------------
# CASH MOVEMENTS
# ---------------------------------------------------------------------------

@bp.route('/cash-movements', methods=['POST'])
@cashier_or_admin_required
def add_cash_movement(payload):
    data = request.get_json() or {}
    session_id = data.get('sessionId')
    mv_type    = data.get('type')
    amount     = float(data.get('amount', 0))
    reason     = data.get('reason', '')

    if not session_id or mv_type not in ('in', 'out') or amount <= 0:
        return jsonify({'error': 'Champs invalides'}), 400

    session = _session_belongs_to(session_id, payload['user_id'], payload['role'])
    if not session or session['status'] != 'open':
        return jsonify({'error': 'Session invalide'}), 400

    mv_id = str(uuid.uuid4())
    execute_query(
        """INSERT INTO pos_cash_movements (id, session_id, cashier_id, type, amount, reason)
           VALUES (%s,%s,%s,%s,%s,%s)""",
        (mv_id, session_id, payload['user_id'], mv_type, amount, reason), commit=True
    )
    _recompute_expected_cash(session_id)

    mv = execute_query("SELECT * FROM pos_cash_movements WHERE id = %s", (mv_id,), fetch_one=True)
    return jsonify({
        'id': mv['id'],
        'sessionId': mv['session_id'],
        'type': mv['type'],
        'amount': float(mv['amount']),
        'reason': mv['reason'],
        'createdAt': mv['created_at'].isoformat() if mv['created_at'] else None,
    }), 201


@bp.route('/cash-movements/<session_id>', methods=['GET'])
@cashier_or_admin_required
def list_cash_movements(payload, session_id):
    session = _session_belongs_to(session_id, payload['user_id'], payload['role'])
    if not session:
        return jsonify({'error': 'Session introuvable'}), 404

    movements = execute_query(
        "SELECT * FROM pos_cash_movements WHERE session_id = %s ORDER BY created_at ASC",
        (session_id,), fetch_all=True
    ) or []
    return jsonify([{
        'id': m['id'],
        'type': m['type'],
        'amount': float(m['amount']),
        'reason': m['reason'],
        'createdAt': m['created_at'].isoformat() if m['created_at'] else None,
    } for m in movements])


# ---------------------------------------------------------------------------
# REPORTS (admin only)
# ---------------------------------------------------------------------------

@bp.route('/reports/daily', methods=['GET'])
@admin_required
def daily_report(payload):
    report_date = request.args.get('date', date.today().isoformat())
    sessions = execute_query(
        """SELECT s.*, u.name AS cashier_name
           FROM pos_sessions s
           JOIN users u ON u.id = s.cashier_id
           WHERE DATE(s.opened_at) = %s
           ORDER BY s.opened_at""",
        (report_date,), fetch_all=True
    ) or []

    result = []
    for s in sessions:
        report = _build_z_report(s['id'])
        result.append(report)

    totals = {
        'date': report_date,
        'sessionsCount': len(result),
        'totalSales': sum(r['totalSales'] for r in result),
        'salesCount': sum(r['salesCount'] for r in result),
        'totalCash': sum(r['totalCash'] for r in result),
        'totalWave': sum(r['totalWave'] for r in result),
        'totalOrangeMoney': sum(r['totalOrangeMoney'] for r in result),
        'totalDiscount': sum(r['totalDiscount'] for r in result),
        'totalRefunded': sum(r['totalRefunded'] for r in result),
        'sessions': result,
    }
    return jsonify(totals)


@bp.route('/reports/cashier/<cashier_id>', methods=['GET'])
@admin_required
def cashier_report(payload, cashier_id):
    date_from = request.args.get('from', date.today().isoformat())
    date_to   = request.args.get('to', date.today().isoformat())

    sessions = execute_query(
        """SELECT id FROM pos_sessions
           WHERE cashier_id = %s AND DATE(opened_at) BETWEEN %s AND %s""",
        (cashier_id, date_from, date_to), fetch_all=True
    ) or []

    reports = [_build_z_report(s['id']) for s in sessions]
    return jsonify({
        'cashierId': cashier_id,
        'from': date_from,
        'to': date_to,
        'sessions': reports,
        'totalSales': sum(r['totalSales'] for r in reports),
        'salesCount': sum(r['salesCount'] for r in reports),
    })


# ---------------------------------------------------------------------------
# CASHIER MANAGEMENT (admin only)
# ---------------------------------------------------------------------------

@bp.route('/cashiers', methods=['GET'])
@admin_required
def list_cashiers(payload):
    cashiers = execute_query(
        """SELECT id, name, email, phone, role, is_active,
                  CASE WHEN pos_pin_hash IS NOT NULL THEN 1 ELSE 0 END AS has_pin,
                  pos_pin_locked_until, created_at
           FROM users WHERE role IN ('cashier','admin')
           ORDER BY name""",
        fetch_all=True
    ) or []
    return jsonify([{
        'id': c['id'],
        'name': c['name'],
        'email': c['email'],
        'phone': c['phone'],
        'role': c['role'],
        'isActive': bool(c['is_active']),
        'hasPin': bool(c['has_pin']),
        'pinLockedUntil': c['pos_pin_locked_until'].isoformat() if c['pos_pin_locked_until'] else None,
        'createdAt': c['created_at'].isoformat() if c['created_at'] else None,
    } for c in cashiers])


@bp.route('/cashiers', methods=['POST'])
@admin_required
def create_cashier(payload):
    data = request.get_json() or {}
    name  = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    pin   = str(data.get('pin') or '').strip()
    phone = data.get('phone', '')
    role  = data.get('role', 'cashier')

    if not name or not email or not pin:
        return jsonify({'error': 'name, email, pin requis'}), 400
    if len(pin) < 4 or len(pin) > 6:
        return jsonify({'error': 'PIN doit être 4-6 chiffres'}), 400
    if not pin.isdigit():
        return jsonify({'error': 'PIN doit contenir uniquement des chiffres'}), 400
    if role not in ('cashier', 'admin'):
        role = 'cashier'

    existing = execute_query("SELECT id FROM users WHERE email = %s", (email,), fetch_one=True)
    if existing:
        return jsonify({'error': 'Email déjà utilisé'}), 409

    user_id = str(uuid.uuid4())
    pin_hash = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    # Generate unique 8-char code for the users.code NOT NULL column
    import secrets, string
    code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

    execute_query(
        """INSERT INTO users (id, name, email, phone, role, pos_pin_hash, password_hash, is_active, code)
           VALUES (%s,%s,%s,%s,%s,%s,'',1,%s)""",
        (user_id, name, email, phone, role, pin_hash, code), commit=True
    )

    user = execute_query("SELECT id, name, email, role FROM users WHERE id = %s", (user_id,), fetch_one=True)
    return jsonify(user), 201


@bp.route('/cashiers/<user_id>/pin', methods=['PUT'])
@admin_required
def reset_cashier_pin(payload, user_id):
    data = request.get_json() or {}
    pin  = str(data.get('pin') or '').strip()

    if len(pin) < 4 or len(pin) > 6 or not pin.isdigit():
        return jsonify({'error': 'PIN doit être 4-6 chiffres numériques'}), 400

    pin_hash = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    execute_query(
        "UPDATE users SET pos_pin_hash = %s, pos_pin_attempts = 0, pos_pin_locked_until = NULL WHERE id = %s",
        (pin_hash, user_id), commit=True
    )
    return jsonify({'updated': True})


@bp.route('/cashiers/me/pin', methods=['PUT'])
@cashier_or_admin_required
def change_own_pin(payload):
    data = request.get_json() or {}
    current_pin = str(data.get('currentPin') or '').strip()
    new_pin     = str(data.get('newPin') or '').strip()

    user = execute_query(
        "SELECT pos_pin_hash FROM users WHERE id = %s", (payload['user_id'],), fetch_one=True
    )
    if not user or not verify_password(current_pin, user['pos_pin_hash'] or ''):
        return jsonify({'error': 'PIN actuel incorrect'}), 401

    if len(new_pin) < 4 or len(new_pin) > 6 or not new_pin.isdigit():
        return jsonify({'error': 'Nouveau PIN doit être 4-6 chiffres'}), 400

    new_hash = bcrypt.hashpw(new_pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    execute_query(
        "UPDATE users SET pos_pin_hash = %s WHERE id = %s",
        (new_hash, payload['user_id']), commit=True
    )
    return jsonify({'updated': True})


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def _sanitize_phone(phone):
    if not phone:
        return None
    cleaned = re.sub(r'[^\d+]', '', str(phone))
    return cleaned if len(cleaned) >= 8 else None


def _generate_txn_number(user_id):
    user = execute_query("SELECT name FROM users WHERE id = %s", (user_id,), fetch_one=True)
    code = (user['name'][:4].upper() if user else 'CASH').replace(' ', '')
    today = date.today().strftime('%Y%m%d')
    count = execute_query(
        "SELECT COUNT(*) AS cnt FROM pos_transactions WHERE cashier_id = %s AND DATE(created_at) = CURDATE()",
        (user_id,), fetch_one=True
    )
    seq = (count['cnt'] + 1) if count else 1
    return f"POS-{today}-{code}-{seq:04d}"


def _generate_return_number(user_id):
    today = date.today().strftime('%Y%m%d')
    count = execute_query(
        "SELECT COUNT(*) AS cnt FROM pos_returns WHERE cashier_id = %s AND DATE(created_at) = CURDATE()",
        (user_id,), fetch_one=True
    )
    seq = (count['cnt'] + 1) if count else 1
    return f"RET-{today}-{seq:04d}"
