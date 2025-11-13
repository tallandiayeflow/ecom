from flask import Blueprint, request, jsonify
from utils.auth import token_required, admin_required
from utils.database import get_db_connection
import uuid
from datetime import datetime

factures_bp = Blueprint('factures', __name__)

@factures_bp.route('', methods=['GET'])
@admin_required
def get_factures(current_user):
    """Récupère toutes les factures."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT i.*, u.name as user_name, u.email as user_email
                FROM invoices i
                LEFT JOIN users u ON i.user_id = u.id
                ORDER BY i.created_at DESC
            """)
            factures = cursor.fetchall()

            # Récupérer les articles pour chaque facture
            for facture in factures:
                cursor.execute("""
                    SELECT id, product_id, product_name, product_image,
                           unit_price, quantity, total
                    FROM invoice_items
                    WHERE invoice_id = %s
                """, (facture['id'],))
                facture['items'] = cursor.fetchall()

            return jsonify(factures), 200
    except Exception as e:
        print(f"Erreur get_factures: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@factures_bp.route('/<invoice_id>', methods=['GET'])
@token_required
def get_facture(current_user, invoice_id):
    """Récupère une facture par ID."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if current_user['role'] != 'admin':
                cursor.execute("SELECT COUNT(*) AS count FROM invoices WHERE id=%s AND user_id=%s",
                               (invoice_id, current_user['id']))
                if cursor.fetchone()['count'] == 0:
                    return jsonify({'error': 'Accès non autorisé'}), 403

            cursor.execute("""
                SELECT i.*, u.name as user_name, u.email as user_email
                FROM invoices i
                LEFT JOIN users u ON i.user_id = u.id
                WHERE i.id=%s
            """, (invoice_id,))
            facture = cursor.fetchone()
            if not facture:
                return jsonify({'error': 'Facture non trouvée'}), 404

            cursor.execute("SELECT * FROM invoice_items WHERE invoice_id=%s", (invoice_id,))
            facture['items'] = cursor.fetchall()

            return jsonify(facture), 200
    except Exception as e:
        print(f"Erreur get_facture: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@factures_bp.route('', methods=['POST'])
@admin_required
def create_facture(current_user):
    """Crée une facture avec ses articles, accepte camelCase et snake_case."""
    data = request.json or {}

    # Supporte camelCase et snake_case
    customer_name = data.get('customerName') or data.get('customer_name')
    customer_email = data.get('customerEmail') or data.get('customer_email')
    customer_phone = data.get('customerPhone') or data.get('customer_phone')
    customer_address = data.get('customerAddress') or data.get('customer_address')
    customer_city = data.get('customerCity') or data.get('customer_city')
    items = data.get('items') or []

    # Validation
    if not customer_name or not customer_email:
        return jsonify({'error': 'Champs manquants : customerName / customerEmail requis'}), 400
    if not isinstance(items, list) or len(items) == 0:
        return jsonify({'error': 'Au moins un article est requis'}), 400

    # Prépare la facture
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            invoice_id = str(uuid.uuid4())
            invoice_number = data.get('invoiceNumber') or f"INV-{uuid.uuid4().hex[:8].upper()}"

            # Calcul des totaux
            subtotal = 0
            for item in items:
                # Support camelCase et snake_case
                unit_price = item.get('unitPrice') or item.get('unit_price')
                quantity = item.get('quantity') or 1
                if unit_price is None:
                    return jsonify({'error': 'Chaque article doit avoir unitPrice'}), 400
                subtotal += float(unit_price) * int(quantity)

            tax_rate = float(data.get('taxRate', 20.0))
            tax = subtotal * tax_rate / 100
            discount = float(data.get('discount', 0.0))
            total = subtotal + tax - discount

            # Insert facture
            cursor.execute("""
                INSERT INTO invoices (
                    id, invoice_number, order_id, user_id,
                    customer_name, customer_email, customer_phone,
                    customer_address, customer_city,
                    amount, tax, tax_rate, discount, total,
                    status, payment_method, payment_date, notes,
                    created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                invoice_id,
                invoice_number,
                data.get('orderId') or data.get('order_id'),
                data.get('userId') or data.get('user_id'),
                customer_name,
                customer_email,
                customer_phone,
                customer_address,
                customer_city,
                subtotal,
                tax,
                tax_rate,
                discount,
                total,
                data.get('status', 'pending'),
                data.get('paymentMethod') or data.get('payment_method', 'cash_on_delivery'),
                datetime.now() if data.get('status') == 'paid' else None,
                data.get('notes', None)
            ))

            # Insert articles
            for item in items:
                item_id = str(uuid.uuid4())
                product_id = item.get('productId') or item.get('product_id')
                product_name = item.get('name') or item.get('product_name')
                product_image = item.get('productImage') or item.get('product_image')
                unit_price = float(item.get('unitPrice') or item.get('unit_price'))
                quantity = int(item.get('quantity') or 1)
                total_item = unit_price * quantity

                cursor.execute("""
                    INSERT INTO invoice_items (
                        id, invoice_id, product_id, product_name, product_image,
                        unit_price, quantity, total
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    item_id,
                    invoice_id,
                    product_id,
                    product_name,
                    product_image,
                    unit_price,
                    quantity,
                    total_item
                ))

            conn.commit()

            # Retourne la facture complète
            cursor.execute("SELECT * FROM invoices WHERE id=%s", (invoice_id,))
            facture = cursor.fetchone()
            cursor.execute("SELECT * FROM invoice_items WHERE invoice_id=%s", (invoice_id,))
            facture['items'] = cursor.fetchall()
            return jsonify(facture), 201

    except Exception as e:
        conn.rollback()
        print(f"Erreur create_facture: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@factures_bp.route('/<invoice_id>', methods=['PUT'])
@admin_required
def update_facture(current_user, invoice_id):
    """Met à jour une facture."""
    data = request.json
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM invoices WHERE id=%s", (invoice_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Facture non trouvée'}), 404

            fields = []
            params = []

            if 'status' in data:
                fields.append("status=%s")
                params.append(data['status'])
                if data['status'] == 'paid':
                    fields.append("payment_date=NOW()")

            if 'paymentMethod' in data:
                fields.append("payment_method=%s")
                params.append(data['paymentMethod'])

            if 'notes' in data:
                fields.append("notes=%s")
                params.append(data['notes'])

            if not fields:
                return jsonify({'error': 'Aucun champ à mettre à jour'}), 400

            fields.append("updated_at=NOW()")
            params.append(invoice_id)

            query = f"UPDATE invoices SET {', '.join(fields)} WHERE id=%s"
            cursor.execute(query, tuple(params))
            conn.commit()

            cursor.execute("SELECT * FROM invoices WHERE id=%s", (invoice_id,))
            facture = cursor.fetchone()
            cursor.execute("SELECT * FROM invoice_items WHERE invoice_id=%s", (invoice_id,))
            facture['items'] = cursor.fetchall()
            return jsonify(facture), 200

    except Exception as e:
        conn.rollback()
        print(f"Erreur update_facture: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@factures_bp.route('/<invoice_id>', methods=['DELETE'])
@admin_required
def delete_facture(current_user, invoice_id):
    """Supprime une facture."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM invoices WHERE id=%s", (invoice_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Facture non trouvée'}), 404

            cursor.execute("DELETE FROM invoice_items WHERE invoice_id=%s", (invoice_id,))
            cursor.execute("DELETE FROM invoices WHERE id=%s", (invoice_id,))
            conn.commit()
            return jsonify({'message': 'Facture supprimée avec succès'}), 200

    except Exception as e:
        conn.rollback()
        print(f"Erreur delete_facture: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
