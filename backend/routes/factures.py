from flask import Blueprint, request, jsonify, send_file
from utils.auth import token_required, admin_required
from utils.database import get_db_connection
import uuid
from datetime import datetime, timedelta
import io
import os
import tempfile

# ReportLab
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

# QR Code
import qrcode


factures_bp = Blueprint('factures', __name__)


# ========== HELPER FUNCTIONS ==========
def get_user_id(current_user):
    """Extrait l'ID utilisateur."""
    if isinstance(current_user, dict):
        return current_user.get('id') or current_user.get('user_id') or current_user.get('sub')
    elif isinstance(current_user, str):
        return current_user
    elif hasattr(current_user, 'id'):
        return current_user.id
    return None


def update_stock_for_invoice(cursor, items, invoice_number, user_id, operation='out'):
    """Met à jour stock + log mouvements."""
    for item in items:
        product_id = item.get('productId') or item.get('product_id')
        quantity = int(item.get('quantity') or 1)

        if not product_id:
            continue

        cursor.execute("SELECT stock, name FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()

        if not product:
            continue

        previous_stock = product['stock']

        if operation == 'out':
            new_stock = max(0, previous_stock - quantity)
            movement_type = 'out'
            reason = f'Facture #{invoice_number}'
        else:
            new_stock = previous_stock + quantity
            movement_type = 'return'
            reason = f'Remboursement #{invoice_number}'

        cursor.execute("UPDATE products SET stock = %s WHERE id = %s", (new_stock, product_id))

        movement_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO stock_movements (id, product_id, movement_type, quantity, 
            previous_stock, new_stock, reason, user_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """, (movement_id, product_id, movement_type, quantity, 
              previous_stock, new_stock, reason, user_id))


def invalidate_stock_cache():
    """Invalide caches stock."""
    try:
        from utils.cache import cache
        cache.delete_memoized('get_stock_stats')
        cache.delete_memoized('get_stock_alerts')
        cache.delete_memoized('get_inventory')
        cache.delete_memoized('get_stock_movements')
    except:
        pass


# ========== ROUTES CRUD ==========
@factures_bp.route('', methods=['GET'])
@admin_required
def get_factures(current_user):
    """Liste toutes les factures."""
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

            for facture in factures:
                cursor.execute("""
                    SELECT id, product_id, product_name, product_image,
                    unit_price, quantity, total
                    FROM invoice_items WHERE invoice_id = %s
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
    """Détails d'une facture."""
    conn = get_db_connection()
    user_id = get_user_id(current_user)

    try:
        with conn.cursor() as cursor:
            if current_user.get('role') != 'admin':
                cursor.execute("SELECT COUNT(*) AS count FROM invoices WHERE id=%s AND user_id=%s",
                             (invoice_id, user_id))
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
    """Créer facture + MAJ stock auto."""
    data = request.json or {}
    user_id = get_user_id(current_user)

    customer_name = data.get('customerName') or data.get('customer_name')
    customer_email = data.get('customerEmail') or data.get('customer_email')
    customer_phone = data.get('customerPhone') or data.get('customer_phone')
    customer_address = data.get('customerAddress') or data.get('customer_address')
    customer_city = data.get('customerCity') or data.get('customer_city')
    items = data.get('items') or []

    if not customer_name or not customer_email:
        return jsonify({'error': 'customerName et customerEmail requis'}), 400

    if not isinstance(items, list) or len(items) == 0:
        return jsonify({'error': 'Au moins un article requis'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            invoice_id = str(uuid.uuid4())
            invoice_number = data.get('invoiceNumber') or f"INV-{uuid.uuid4().hex[:8].upper()}"

            subtotal = 0
            for item in items:
                unit_price = item.get('unitPrice') or item.get('unit_price')
                quantity = item.get('quantity') or 1
                if unit_price is None:
                    return jsonify({'error': 'Chaque article doit avoir unitPrice'}), 400
                subtotal += float(unit_price) * int(quantity)

            tax_rate = float(data.get('taxRate', 20.0))
            tax = subtotal * tax_rate / 100
            discount = float(data.get('discount', 0.0))
            total = subtotal + tax - discount

            cursor.execute("""
                INSERT INTO invoices (
                    id, invoice_number, order_id, user_id,
                    customer_name, customer_email, customer_phone,
                    customer_address, customer_city,
                    amount, tax, tax_rate, discount, total,
                    status, payment_method, payment_date, notes, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                invoice_id, invoice_number,
                data.get('orderId') or data.get('order_id'),
                data.get('userId') or data.get('user_id'),
                customer_name, customer_email, customer_phone,
                customer_address, customer_city,
                subtotal, tax, tax_rate, discount, total,
                data.get('status', 'pending'),
                data.get('paymentMethod') or data.get('payment_method', 'cash_on_delivery'),
                datetime.now() if data.get('status') == 'paid' else None,
                data.get('notes')
            ))

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
                """, (item_id, invoice_id, product_id, product_name, 
                      product_image, unit_price, quantity, total_item))

            update_stock_for_invoice(cursor, items, invoice_number, user_id, operation='out')

            conn.commit()
            invalidate_stock_cache()

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
    """Modifier statut/paiement."""
    data = request.json
    user_id = get_user_id(current_user)
    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM invoices WHERE id=%s", (invoice_id,))
            old_invoice = cursor.fetchone()

            if not old_invoice:
                return jsonify({'error': 'Facture non trouvée'}), 404

            fields = []
            params = []

            if 'status' in data and data['status'] == 'cancelled' and old_invoice['status'] != 'cancelled':
                cursor.execute("SELECT * FROM invoice_items WHERE invoice_id=%s", (invoice_id,))
                items = cursor.fetchall()
                update_stock_for_invoice(cursor, items, old_invoice['invoice_number'], 
                                       user_id, operation='return')

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

            invalidate_stock_cache()

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


@factures_bp.route('/<invoice_id>/complete', methods=['PUT'])
@admin_required
def update_facture_complete(current_user, invoice_id):
    """Modifier TOUT (client + items)."""
    data = request.json or {}
    user_id = get_user_id(current_user)
    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM invoices WHERE id=%s", (invoice_id,))
            old_invoice = cursor.fetchone()

            if not old_invoice:
                return jsonify({'error': 'Facture non trouvée'}), 404

            if 'items' in data:
                cursor.execute("SELECT * FROM invoice_items WHERE invoice_id=%s", (invoice_id,))
                old_items = cursor.fetchall()
                update_stock_for_invoice(cursor, old_items, old_invoice['invoice_number'], 
                                       user_id, operation='return')

            update_fields = []
            params = []

            if 'customerName' in data or 'customer_name' in data:
                update_fields.append("customer_name=%s")
                params.append(data.get('customerName') or data.get('customer_name'))

            if 'customerEmail' in data or 'customer_email' in data:
                update_fields.append("customer_email=%s")
                params.append(data.get('customerEmail') or data.get('customer_email'))

            if 'customerPhone' in data or 'customer_phone' in data:
                update_fields.append("customer_phone=%s")
                params.append(data.get('customerPhone') or data.get('customer_phone'))

            if 'customerAddress' in data or 'customer_address' in data:
                update_fields.append("customer_address=%s")
                params.append(data.get('customerAddress') or data.get('customer_address'))

            if 'customerCity' in data or 'customer_city' in data:
                update_fields.append("customer_city=%s")
                params.append(data.get('customerCity') or data.get('customer_city'))

            if 'status' in data:
                update_fields.append("status=%s")
                params.append(data['status'])
                if data['status'] == 'paid':
                    update_fields.append("payment_date=NOW()")

            if 'paymentMethod' in data or 'payment_method' in data:
                update_fields.append("payment_method=%s")
                params.append(data.get('paymentMethod') or data.get('payment_method'))

            if 'notes' in data:
                update_fields.append("notes=%s")
                params.append(data['notes'])

            if 'items' in data:
                items = data['items']

                cursor.execute("DELETE FROM invoice_items WHERE invoice_id=%s", (invoice_id,))

                subtotal = 0
                for item in items:
                    unit_price = item.get('unitPrice') or item.get('unit_price')
                    quantity = item.get('quantity') or 1
                    if unit_price is None:
                        return jsonify({'error': 'Chaque article doit avoir unitPrice'}), 400
                    subtotal += float(unit_price) * int(quantity)

                tax_rate = float(data.get('taxRate', old_invoice['tax_rate']))
                tax = subtotal * tax_rate / 100
                discount = float(data.get('discount', old_invoice['discount']))
                total = subtotal + tax - discount

                update_fields.extend(["amount=%s", "tax=%s", "tax_rate=%s", "discount=%s", "total=%s"])
                params.extend([subtotal, tax, tax_rate, discount, total])

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
                    """, (item_id, invoice_id, product_id, product_name, 
                          product_image, unit_price, quantity, total_item))

                update_stock_for_invoice(cursor, items, old_invoice['invoice_number'], 
                                       user_id, operation='out')

            if update_fields:
                update_fields.append("updated_at=NOW()")
                params.append(invoice_id)
                query = f"UPDATE invoices SET {', '.join(update_fields)} WHERE id=%s"
                cursor.execute(query, tuple(params))

            conn.commit()
            invalidate_stock_cache()

            cursor.execute("SELECT * FROM invoices WHERE id=%s", (invoice_id,))
            facture = cursor.fetchone()
            cursor.execute("SELECT * FROM invoice_items WHERE invoice_id=%s", (invoice_id,))
            facture['items'] = cursor.fetchall()

            return jsonify(facture), 200

    except Exception as e:
        conn.rollback()
        print(f"Erreur update_facture_complete: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@factures_bp.route('/<invoice_id>', methods=['DELETE'])
@admin_required
def delete_facture(current_user, invoice_id):
    """Supprimer facture."""
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


# ========== GÉNÉRATION PDF FACTURE AVEC QR CODE + LOGO ==========


@factures_bp.route('/<invoice_id>/pdf', methods=['GET'])
@token_required
def download_facture_pdf(current_user, invoice_id):
    """Télécharge facture PDF A4 compacte (1 page)."""
    conn = get_db_connection()
    user_id = get_user_id(current_user)

    try:
        with conn.cursor() as cursor:
            # Vérification des permissions
            if current_user.get('role') != 'admin':
                cursor.execute("SELECT COUNT(*) AS count FROM invoices WHERE id=%s AND user_id=%s",
                             (invoice_id, user_id))
                if cursor.fetchone()['count'] == 0:
                    return jsonify({'error': 'Accès non autorisé'}), 403

            # Récupérer la facture
            cursor.execute("""
                SELECT i.*, u.name as user_name, u.email as user_email
                FROM invoices i
                LEFT JOIN users u ON i.user_id = u.id
                WHERE i.id=%s
            """, (invoice_id,))
            invoice = cursor.fetchone()

            if not invoice:
                return jsonify({'error': 'Facture non trouvée'}), 404

            # Récupérer les articles
            cursor.execute("SELECT * FROM invoice_items WHERE invoice_id=%s ORDER BY id", (invoice_id,))
            invoice['items'] = cursor.fetchall()

            # ========== GÉNÉRATION DU QR CODE ==========
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
            qr_url = f"{frontend_url}/invoices/{invoice_id}"

            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=8,  # Réduit de 10 à 8
                border=1,    # Réduit de 2 à 1
            )
            qr.add_data(qr_url)
            qr.make(fit=True)

            qr_img = qr.make_image(fill_color="black", back_color="white")

            qr_buffer = io.BytesIO()
            qr_img.save(qr_buffer, format='PNG')
            qr_buffer.seek(0)

            qr_temp = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            qr_temp.write(qr_buffer.read())
            qr_temp.close()

            # ========== VÉRIFIER SI LE LOGO EXISTE ==========
            logo_path = 'uploads/logo/logo.png'
            if not os.path.exists(logo_path):
                logo_path = 'uploads/logo/logo.jpg'
            logo_exists = os.path.exists(logo_path)

            # ========== CRÉATION DU PDF (MARGES RÉDUITES) ==========
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=12*mm,   # Réduit de 15 à 12mm
                leftMargin=12*mm,    # Réduit de 15 à 12mm
                topMargin=10*mm,     # Réduit de 15 à 10mm
                bottomMargin=10*mm   # Réduit de 15 à 10mm
            )

            # ========== STYLES COMPACTS ==========
            styles = getSampleStyleSheet()

            # Texte normal plus petit
            normal_style = ParagraphStyle(
                'ModernNormal',
                parent=styles['Normal'],
                fontSize=8,          # Réduit de 10 à 8
                textColor=colors.HexColor('#374151'),
                fontName='Helvetica',
                leading=10           # Espacement lignes
            )

            # Headers plus petits
            header_style = ParagraphStyle(
                'SectionHeader',
                parent=styles['Heading2'],
                fontSize=11,         # Réduit de 14 à 11
                spaceAfter=6,        # Réduit de 12 à 6
                spaceBefore=8,       # Réduit de 15 à 8
                textColor=colors.HexColor('#111827'),
                fontName='Helvetica-Bold'
            )

            # Style QR text
            qr_text_style = ParagraphStyle(
                'QRText',
                parent=normal_style,
                fontSize=7,          # Réduit de 8 à 7
                textColor=colors.HexColor('#6b7280'),
                alignment=TA_CENTER,
                leading=8
            )

            story = []

            # ========== INFORMATIONS BOUTIQUE ==========
            SHOP_INFO = {
                'name': 'TEUSS PHONE SHOP',
                'address': 'Casablanca, Maroc',
                'phone': '+212 6XX XXX XXX',
                'email': 'contact@teussphone.com',
                'ice': 'ICE000000000',
                'website': 'www.teussphone.com'
            }

            # ========== EN-TÊTE COMPACT AVEC LOGO ==========
            left_content = []

            # Logo plus petit
            if logo_exists:
                try:
                    logo_img = RLImage(logo_path, width=25*mm, height=25*mm, kind='proportional')  # Réduit de 40 à 25mm
                    left_content.append(logo_img)
                    left_content.append(Spacer(1, 2))  # Réduit de 5 à 2
                except Exception as e:
                    print(f"Erreur chargement logo: {e}")

            # Infos boutique compactes
            shop_info_text = f"""<b><font size="12" color="#1f2937">{SHOP_INFO['name']}</font></b><br/>
                <font size="7" color="#6366f1">{SHOP_INFO['website']}</font><br/>
                <font size="7" color="#6b7280">
                📍 {SHOP_INFO['address']}<br/>
                📞 {SHOP_INFO['phone']}<br/>
                ✉ {SHOP_INFO['email']}<br/>
                <font size="6">ICE: {SHOP_INFO['ice']}</font>
                </font>"""

            left_content.append(Paragraph(shop_info_text, normal_style))

            left_table = Table([[item] for item in left_content], colWidths=[85*mm])
            left_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))

            # Colonne droite : Info facture compacte
            status_color = '#22c55e' if invoice['status'] == 'paid' else '#f59e0b' if invoice['status'] == 'pending' else '#ef4444'

            right_text = Paragraph(f"""<para align="right">
                <b><font size="24" color="#1f2937">FACTURE</font></b><br/>
                <font size="8" color="#6b7280">
                <b>N° {invoice['invoice_number']}</b><br/>
                📅 {invoice['created_at'].strftime('%d/%m/%Y')}<br/>
                <font size="8" color="{status_color}">
                ● {invoice['status'].upper()}
                </font>
                </font>
                </para>""", normal_style)

            header_table = Table([[left_table, right_text]], colWidths=[85*mm, 101*mm])
            header_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
            story.append(header_table)
            story.append(Spacer(1, 8))  # Réduit de 15 à 8

            # Ligne de séparation fine
            separator_line = Table([['']], colWidths=[186*mm], rowHeights=[1])
            separator_line.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e5e7eb'))
            ]))
            story.append(separator_line)
            story.append(Spacer(1, 8))  # Réduit de 20 à 8

            # ========== SECTION CLIENT COMPACTE ==========
            story.append(Paragraph('<b>FACTURÉ À</b>', header_style))

            client_content = f"""<b><font size="9" color="#1f2937">{invoice['customer_name']}</font></b><br/>
                <font size="7" color="#6b7280">"""

            if invoice.get('customer_email'):
                client_content += f"✉ {invoice['customer_email']} "
            if invoice.get('customer_phone'):
                client_content += f"• 📞 {invoice['customer_phone']}"
            if invoice.get('customer_address'):
                client_content += f"<br/>📍 {invoice['customer_address']}"
            if invoice.get('customer_city'):
                client_content += f" - {invoice['customer_city']}"

            client_content += "</font>"

            client_table = Table([[Paragraph(client_content, normal_style)]], colWidths=[186*mm])
            client_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f3f4f6')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e5e7eb')),
                ('LEFTPADDING', (0,0), (-1,-1), 10),  # Réduit de 15 à 10
                ('TOPPADDING', (0,0), (-1,-1), 6),    # Réduit de 12 à 6
                ('BOTTOMPADDING', (0,0), (-1,-1), 6), # Réduit de 12 à 6
            ]))
            story.append(client_table)
            story.append(Spacer(1, 10))  # Réduit de 25 à 10

            # ========== SECTION ARTICLES COMPACTE ==========
            story.append(Paragraph('<b>ARTICLES</b>', header_style))

            items_data = [[
                Paragraph('<b>Description</b>', normal_style),
                Paragraph('<b>Prix U.</b>', normal_style),
                Paragraph('<b>Qté</b>', normal_style),
                Paragraph('<b>Total</b>', normal_style)
            ]]

            for item in invoice['items']:
                items_data.append([
                    Paragraph(f"{item['product_name'][:40]}", normal_style),  # Réduit de 50 à 40 chars
                    Paragraph(f"{float(item['unit_price']):,.0f}", normal_style),
                    Paragraph(f"{item['quantity']}", normal_style),
                    Paragraph(f"{float(item['total']):,.0f}", normal_style)
                ])

            items_table = Table(items_data, colWidths=[100*mm, 28*mm, 18*mm, 40*mm])
            items_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1f2937')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTSIZE', (0,0), (-1,0), 8),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('ALIGN', (0,0), (0,-1), 'LEFT'),
                ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
                ('ALIGN', (2,0), (2,-1), 'CENTER'),
                ('FONTSIZE', (0,1), (-1,-1), 8),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f9fafb')]),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#d1d5db')),
                ('LEFTPADDING', (0,0), (-1,-1), 6),   # Réduit de 10 à 6
                ('RIGHTPADDING', (0,0), (-1,-1), 6),  # Réduit de 10 à 6
                ('TOPPADDING', (0,0), (-1,-1), 4),    # Réduit de 8 à 4
                ('BOTTOMPADDING', (0,0), (-1,-1), 4), # Réduit de 8 à 4
            ]))
            story.append(items_table)
            story.append(Spacer(1, 10))  # Réduit de 30 à 10

            # ========== SECTION TOTAUX COMPACTE ==========
            totals_data = [
                [Paragraph('<font size="7" color="#6b7280">Sous-total HT:</font>', normal_style),
                 Paragraph(f'<font size="8"><b>{float(invoice["amount"]):,.0f} FCFA</b></font>', normal_style)]
            ]

            if invoice.get('discount') and float(invoice['discount']) > 0:
                totals_data.append([
                    Paragraph('<font size="7" color="#ef4444">Remise:</font>', normal_style),
                    Paragraph(f'<font size="8" color="#ef4444"><b>-{float(invoice["discount"]):,.0f} FCFA</b></font>', normal_style)
                ])

            totals_data.append([
                Paragraph(f'<font size="7" color="#6b7280">TVA ({invoice["tax_rate"]:.0f}%):</font>', normal_style),
                Paragraph(f'<font size="8"><b>{float(invoice["tax"]):,.0f} FCFA</b></font>', normal_style)
            ])

            totals_data.append([
                Paragraph('<font size="10" color="white"><b>TOTAL TTC</b></font>', normal_style),
                Paragraph(f'<font size="11" color="white"><b>{float(invoice["total"]):,.0f} FCFA</b></font>', normal_style)
            ])

            totals_table = Table(totals_data, colWidths=[45*mm, 35*mm])  # Réduit largeurs
            totals_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (0,-2), 'LEFT'),
                ('ALIGN', (1,0), (1,-1), 'RIGHT'),
                ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#6366f1')),
                ('TEXTCOLOR', (0,-1), (-1,-1), colors.white),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#d1d5db')),
                ('LEFTPADDING', (0,0), (-1,-1), 8),   # Réduit de 12 à 8
                ('RIGHTPADDING', (0,0), (-1,-1), 8),  # Réduit de 12 à 8
                ('TOPPADDING', (0,0), (-1,-1), 4),    # Réduit de 8 à 4
                ('BOTTOMPADDING', (0,0), (-1,-1), 4), # Réduit de 8 à 4
                ('TOPPADDING', (0,-1), (-1,-1), 6),   # Réduit de 12 à 6
                ('BOTTOMPADDING', (0,-1), (-1,-1), 6),# Réduit de 12 à 6
            ]))

            totals_wrapper = Table([[None, totals_table]], colWidths=[106*mm, 80*mm])
            totals_wrapper.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
            story.append(totals_wrapper)
            story.append(Spacer(1, 10))  # Réduit de 30 à 10

            # ========== FOOTER COMPACT AVEC QR CODE ==========
            separator_line = Table([['']], colWidths=[186*mm], rowHeights=[1])
            separator_line.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e5e7eb'))
            ]))
            story.append(separator_line)
            story.append(Spacer(1, 6))  # Réduit de 15 à 6

            # QR Code plus petit
            qr_image = RLImage(qr_temp.name, width=20*mm, height=20*mm)  # Réduit de 30 à 20mm

            qr_section = Table([
                [qr_image],
                [Paragraph('Scannez', qr_text_style)]  # Texte raccourci
            ], colWidths=[25*mm])

            qr_section.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))

            # Footer texte compact
            footer_content = f"""<font size="7" color="#6b7280">
                <b>Conditions:</b> Garantie 3 mois • Conservez ce reçu • Échange sous 7j<br/>
                <b>Merci !</b> • <font size="6">Généré le {datetime.now().strftime('%d/%m/%Y')}</font>
                </font>"""

            footer_table = Table([[qr_section, Paragraph(footer_content, normal_style)]], 
                                colWidths=[30*mm, 156*mm])
            footer_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
            ]))

            story.append(footer_table)

            # ========== GÉNÉRATION DU PDF ==========
            doc.build(story)
            buffer.seek(0)

            # Nettoyer le fichier temporaire du QR code
            try:
                os.unlink(qr_temp.name)
            except Exception as e:
                print(f"Erreur suppression QR temp: {e}")

            return send_file(
                buffer,
                as_attachment=True,
                download_name=f"Facture_{invoice['invoice_number']}.pdf",
                mimetype='application/pdf'
            )

    except Exception as e:
        print(f"Erreur génération PDF: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de la génération du PDF: {str(e)}'}), 500

    finally:
        if conn:
            conn.close()


# ========== RAPPORTS DE VENTES ==========
@factures_bp.route('/reports/sales', methods=['GET'])
@admin_required
def get_sales_report(current_user):
    """Rapport ventes JSON."""
    period = request.args.get('period', 'month')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:
            if not start_date or not end_date:
                if period == 'day':
                    start_date = datetime.now().strftime('%Y-%m-%d')
                    end_date = start_date
                elif period == 'week':
                    start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
                    end_date = datetime.now().strftime('%Y-%m-%d')
                else:
                    start_date = datetime.now().replace(day=1).strftime('%Y-%m-%d')
                    end_date = datetime.now().strftime('%Y-%m-%d')

            cursor.execute("""
                SELECT 
                    COUNT(*) as total_invoices,
                    COALESCE(SUM(total), 0) as total_revenue,
                    COALESCE(SUM(amount), 0) as total_ht,
                    COALESCE(SUM(tax), 0) as total_tax,
                    COALESCE(SUM(discount), 0) as total_discounts,
                    COALESCE(AVG(total), 0) as average_invoice
                FROM invoices
                WHERE DATE(created_at) BETWEEN %s AND %s
                AND status != 'cancelled'
            """, (start_date, end_date))
            stats = cursor.fetchone()

            cursor.execute("""
                SELECT DATE(created_at) as date, COUNT(*) as invoices_count,
                    COALESCE(SUM(total), 0) as daily_revenue
                FROM invoices
                WHERE DATE(created_at) BETWEEN %s AND %s AND status != 'cancelled'
                GROUP BY DATE(created_at) ORDER BY date DESC
            """, (start_date, end_date))
            daily_sales = cursor.fetchall()

            cursor.execute("""
                SELECT ii.product_name, SUM(ii.quantity) as total_quantity,
                    COALESCE(SUM(ii.total), 0) as total_revenue
                FROM invoice_items ii
                JOIN invoices i ON ii.invoice_id = i.id
                WHERE DATE(i.created_at) BETWEEN %s AND %s AND i.status != 'cancelled'
                GROUP BY ii.product_id, ii.product_name
                ORDER BY total_revenue DESC LIMIT 10
            """, (start_date, end_date))
            top_products = cursor.fetchall()

            return jsonify({
                'period': period,
                'start_date': start_date,
                'end_date': end_date,
                'statistics': {
                    'total_invoices': stats['total_invoices'],
                    'total_revenue': float(stats['total_revenue']),
                    'total_ht': float(stats['total_ht']),
                    'total_tax': float(stats['total_tax']),
                    'total_discounts': float(stats['total_discounts']),
                    'average_invoice': float(stats['average_invoice'])
                },
                'daily_sales': [
                    {
                        'date': d['date'].strftime('%Y-%m-%d') if hasattr(d['date'], 'strftime') else str(d['date']),
                        'invoices_count': d['invoices_count'],
                        'revenue': float(d['daily_revenue'])
                    } for d in daily_sales
                ],
                'top_products': [
                    {
                        'product_name': p['product_name'],
                        'quantity_sold': p['total_quantity'],
                        'revenue': float(p['total_revenue'])
                    } for p in top_products
                ]
            }), 200

    except Exception as e:
        print(f"Erreur sales_report: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ========== RAPPORT PDF ==========
@factures_bp.route('/reports/sales/pdf', methods=['GET'])
@admin_required
def export_sales_report_pdf(current_user):
    """Télécharge rapport ventes PDF."""
    period = request.args.get('period', 'month')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cursor:
            if not start_date or not end_date:
                if period == 'day':
                    start_date = datetime.now().strftime('%Y-%m-%d')
                    end_date = start_date
                    period_label = f"Journée du {datetime.now().strftime('%d/%m/%Y')}"
                elif period == 'week':
                    start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
                    end_date = datetime.now().strftime('%Y-%m-%d')
                    period_label = f"Semaine du {datetime.strptime(start_date, '%Y-%m-%d').strftime('%d/%m/%Y')} au {datetime.now().strftime('%d/%m/%Y')}"
                else:
                    start_date = datetime.now().replace(day=1).strftime('%Y-%m-%d')
                    end_date = datetime.now().strftime('%Y-%m-%d')
                    period_label = f"{datetime.now().strftime('%B %Y').capitalize()}"
            else:
                period_label = f"Période du {datetime.strptime(start_date, '%Y-%m-%d').strftime('%d/%m/%Y')} au {datetime.strptime(end_date, '%Y-%m-%d').strftime('%d/%m/%Y')}"
            
            # Stats
            cursor.execute("""
                SELECT COUNT(*) as total_invoices, COALESCE(SUM(total), 0) as total_revenue,
                    COALESCE(SUM(amount), 0) as total_ht, COALESCE(SUM(tax), 0) as total_tax,
                    COALESCE(SUM(discount), 0) as total_discounts, COALESCE(AVG(total), 0) as average_invoice
                FROM invoices WHERE DATE(created_at) BETWEEN %s AND %s AND status != 'cancelled'
            """, (start_date, end_date))
            stats = cursor.fetchone()
            
            cursor.execute("""
                SELECT DATE(created_at) as date, COUNT(*) as invoices_count, COALESCE(SUM(total), 0) as daily_revenue
                FROM invoices WHERE DATE(created_at) BETWEEN %s AND %s AND status != 'cancelled'
                GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 15
            """, (start_date, end_date))
            daily_sales = cursor.fetchall()
            
            cursor.execute("""
                SELECT ii.product_name, SUM(ii.quantity) as total_quantity, COALESCE(SUM(ii.total), 0) as total_revenue
                FROM invoice_items ii JOIN invoices i ON ii.invoice_id = i.id
                WHERE DATE(i.created_at) BETWEEN %s AND %s AND i.status != 'cancelled'
                GROUP BY ii.product_id, ii.product_name ORDER BY total_revenue DESC LIMIT 10
            """, (start_date, end_date))
            top_products = cursor.fetchall()
            
            # PDF
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=15*mm, leftMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm)
            styles = getSampleStyleSheet()
            
            title_style = ParagraphStyle('ReportTitle', parent=styles['Title'], fontSize=28, alignment=TA_CENTER, 
                                        textColor=colors.HexColor('#1f2937'), fontName='Helvetica-Bold')
            subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=14, spaceAfter=20, alignment=TA_CENTER, 
                                           textColor=colors.HexColor('#6b7280'), fontName='Helvetica')
            section_header = ParagraphStyle('SectionHeader', parent=styles['Heading2'], fontSize=16, spaceAfter=12, spaceBefore=20, 
                                          textColor=colors.HexColor('#1f2937'), fontName='Helvetica-Bold')
            normal_style = ParagraphStyle('ModernNormal', parent=styles['Normal'], fontSize=10, 
                                         textColor=colors.HexColor('#374151'), fontName='Helvetica')
            
            story = []
            SHOP_INFO = {'name': 'TEUSS PHONE SHOP', 'address': 'Casablanca, Maroc', 'phone': '+212 6XX XXX XXX', 
                        'email': 'contact@teussphone.com', 'website': 'www.teussphone.com'}
            
            story.append(Paragraph(f"<b>{SHOP_INFO['name']}</b>", title_style))
            story.append(Paragraph("RAPPORT DE VENTES", title_style))
            story.append(Paragraph(period_label, subtitle_style))
            story.append(Spacer(1, 10))
            
            story.append(Table([['']], colWidths=[180*mm], rowHeights=[2]))
            story[-1].setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#6366f1'))]))
            story.append(Spacer(1, 20))
            
            # KPI Cards
            story.append(Paragraph("📊 VUE D'ENSEMBLE", section_header))
            stats_data = [[
                Paragraph(f"""<para align="center"><font size="12" color="#6366f1"><b>{stats['total_invoices']}</b></font><br/>
                    <font size="9" color="#6b7280">Factures</font></para>""", normal_style),
                Paragraph(f"""<para align="center"><font size="12" color="#22c55e"><b>{float(stats['total_revenue']):,.0f} FCFA</b></font><br/>
                    <font size="9" color="#6b7280">CA TTC</font></para>""", normal_style),
                Paragraph(f"""<para align="center"><font size="12" color="#f59e0b"><b>{float(stats['average_invoice']):,.0f} FCFA</b></font><br/>
                    <font size="9" color="#6b7280">Panier moyen</font></para>""", normal_style),
                Paragraph(f"""<para align="center"><font size="12" color="#ef4444"><b>{float(stats['total_discounts']):,.0f} FCFA</b></font><br/>
                    <font size="9" color="#6b7280">Remises</font></para>""", normal_style)
            ]]
            
            stats_table = Table(stats_data, colWidths=[45*mm]*4)
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f9fafb')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e5e7eb')),
                ('INNERGRID', (0,0), (-1,-1), 1, colors.HexColor('#e5e7eb')),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('TOPPADDING', (0,0), (-1,-1), 15),
                ('BOTTOMPADDING', (0,0), (-1,-1), 15),
            ]))
            story.append(stats_table)
            story.append(Spacer(1, 25))
            
            # Détails financiers
            story.append(Paragraph("💰 DÉTAILS FINANCIERS", section_header))
            financial_data = [
                ['Montant HT', f"{float(stats['total_ht']):,.0f} FCFA"],
                ['TVA collectée', f"{float(stats['total_tax']):,.0f} FCFA"],
                ['Remises accordées', f"-{float(stats['total_discounts']):,.0f} FCFA"],
                ['TOTAL TTC', f"{float(stats['total_revenue']):,.0f} FCFA"]
            ]
            
            financial_table = Table(financial_data, colWidths=[90*mm, 90*mm])
            financial_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (0,-1), 'LEFT'),
                ('ALIGN', (1,0), (1,-1), 'RIGHT'),
                ('FONTNAME', (0,0), (-1,-2), 'Helvetica'),
                ('FONTSIZE', (0,0), (-1,-2), 11),
                ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#6366f1')),
                ('TEXTCOLOR', (0,-1), (-1,-1), colors.white),
                ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
                ('FONTSIZE', (0,-1), (-1,-1), 13),
                ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#e5e7eb')),
                ('LEFTPADDING', (0,0), (-1,-1), 15),
                ('TOPPADDING', (0,0), (-1,-1), 10),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ]))
            story.append(financial_table)
            story.append(Spacer(1, 25))
            
            # Ventes quotidiennes
            if daily_sales:
                story.append(Paragraph("📅 VENTES QUOTIDIENNES", section_header))
                daily_data = [['Date', 'Factures', 'CA']]
                for day in daily_sales:
                    date_str = day['date'].strftime('%d/%m/%Y') if hasattr(day['date'], 'strftime') else str(day['date'])
                    daily_data.append([date_str, str(day['invoices_count']), f"{float(day['daily_revenue']):,.0f} FCFA"])
                
                daily_table = Table(daily_data, colWidths=[60*mm, 60*mm, 60*mm])
                daily_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1f2937')),
                    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('ALIGN', (1,0), (-1,-1), 'CENTER'),
                    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f9fafb')]),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#d1d5db')),
                    ('LEFTPADDING', (0,0), (-1,-1), 10),
                    ('TOPPADDING', (0,0), (-1,-1), 8),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ]))
                story.append(daily_table)
                story.append(Spacer(1, 25))
            
            # Top produits
            if top_products:
                story.append(Paragraph("🏆 TOP 10 PRODUITS", section_header))
                products_data = [['Produit', 'Qté', 'Revenus']]
                for idx, product in enumerate(top_products, 1):
                    products_data.append([
                        f"{idx}. {product['product_name'][:40]}",
                        str(product['total_quantity']),
                        f"{float(product['total_revenue']):,.0f} FCFA"
                    ])
                
                products_table = Table(products_data, colWidths=[100*mm, 30*mm, 50*mm])
                products_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#22c55e')),
                    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('ALIGN', (1,0), (-1,-1), 'CENTER'),
                    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f0fdf4')]),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#bbf7d0')),
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#86efac')),
                    ('LEFTPADDING', (0,0), (-1,-1), 10),
                    ('TOPPADDING', (0,0), (-1,-1), 8),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ]))
                story.append(products_table)
                story.append(Spacer(1, 30))
            
            # Footer
            story.append(Table([['']], colWidths=[180*mm], rowHeights=[1]))
            story[-1].setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e5e7eb'))]))
            story.append(Spacer(1, 15))
            
            footer_content = f"""<font size="9" color="#6b7280">
                <b>{SHOP_INFO['name']}</b> - {SHOP_INFO['address']}<br/>
                Tel: {SHOP_INFO['phone']} | Email: {SHOP_INFO['email']}<br/><br/>
                <font size="8">Rapport généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}</font>
                </font>"""
            
            story.append(Paragraph(footer_content, normal_style))
            
            doc.build(story)
            buffer.seek(0)
            
            filename = f"Rapport_Ventes_{period}_{start_date}_{end_date}.pdf"
            return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')
            
    except Exception as e:
        print(f"Erreur rapport PDF: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()
