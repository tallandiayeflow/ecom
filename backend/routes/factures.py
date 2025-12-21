from flask import Blueprint, request, jsonify, send_file
from utils.auth import token_required, admin_required
from utils.database import get_db_connection
import uuid
from datetime import datetime
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import qrcode
from PIL import Image as PILImage
import base64

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

# ✅ NOUVELLE ROUTE : TÉLÉCHARGEMENT PDF
@factures_bp.route('/<invoice_id>/pdf', methods=['GET'])
@token_required
def download_facture_pdf(current_user, invoice_id):
    """Télécharge une facture en PDF format A4 professionnel."""
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cursor:
            # Vérification autorisation
            if current_user['role'] != 'admin':
                cursor.execute("SELECT COUNT(*) AS count FROM invoices WHERE id=%s AND user_id=%s",
                              (invoice_id, current_user['id']))
                if cursor.fetchone()['count'] == 0:
                    return jsonify({'error': 'Accès non autorisé'}), 403

            # Récupérer facture complète
            cursor.execute("""
                SELECT i.*, u.name as user_name, u.email as user_email
                FROM invoices i
                LEFT JOIN users u ON i.user_id = u.id
                WHERE i.id=%s
            """, (invoice_id,))
            invoice = cursor.fetchone()
            
            if not invoice:
                return jsonify({'error': 'Facture non trouvée'}), 404

            cursor.execute("SELECT * FROM invoice_items WHERE invoice_id=%s ORDER BY id", (invoice_id,))
            invoice['items'] = cursor.fetchall()

        # Créer PDF en mémoire
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=15*mm,
            leftMargin=15*mm,
            topMargin=20*mm,
            bottomMargin=20*mm
        )

        # Styles personnalisés
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Title'],
            fontSize=32,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#1E40AF'),
            fontName='Helvetica-Bold',
            leading=36
        )
        
        header_style = ParagraphStyle(
            'Header',
            parent=styles['Heading2'],
            fontSize=18,
            spaceAfter=12,
            textColor=colors.black,
            fontName='Helvetica-Bold'
        )

        story = []

        # INFORMATIONS MAGASIN
        SHOP_INFO = {
            'name': 'TEUSS PHONE SHOP',
            'address': 'Casablanca, Maroc',
            'phone': '+212 6XX XXX XXX',
            'email': 'contact@teussphone.com',
            'ice': 'ICE000000000',
            'website': 'www.teussphone.com'
        }

        # 1. EN-TÊTE
        story.append(Paragraph("FACTURE COMMERCIALE", title_style))
        story.append(Spacer(1, 12))
        
        # Tableau en-tête (Numéro, Date, Statut)
        header_data = [
            ['NUMÉRO DE FACTURE', invoice['invoice_number']],
            ['DATE DE FACTURATION', invoice['created_at'].strftime('%d/%m/%Y à %H:%M')],
            ['STATUT', invoice['status'].upper()]
        ]
        
        header_table = Table(header_data, colWidths=[85*mm, 85*mm])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 11),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E40AF')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12)
        ]))
        story.append(header_table)
        story.append(Spacer(1, 20))

        # 2. INFORMATIONS SOCIÉTÉ
        story.append(Paragraph("INFORMATIONS SOCIÉTÉ", header_style))
        shop_data = [
            [f"<b>{SHOP_INFO['name']}</b>"],
            [SHOP_INFO['address']],
            [f"Tél: <b>{SHOP_INFO['phone']}</b>"],
            [f"Email: <b>{SHOP_INFO['email']}</b>"],
            [f"ICE: <b>{SHOP_INFO['ice']}</b>"]
        ]
        shop_table = Table(shop_data, colWidths=[160*mm])
        shop_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 11),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EFF6FF')),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#3B82F6')),
            ('LEFTPADDING', (0,0), (-1,-1), 20),
            ('RIGHTPADDING', (0,0), (-1,-1), 20),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
        ]))
        story.append(shop_table)
        story.append(Spacer(1, 20))

        # 3. CLIENT
        story.append(Paragraph("FACTURÉ À", header_style))
        client_data = [
            [f"<b>{invoice['customer_name']}</b>"],
            [f"Tél: {invoice.get('customer_phone', 'Non renseigné')}"],
            [invoice.get('customer_email', 'Non renseigné')],
            [f"{invoice.get('customer_address', '')} {invoice.get('customer_city', '')}".strip()]
        ]
        client_table = Table(client_data, colWidths=[160*mm])
        client_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 11),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0F9FF')),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#0EA5E9')),
            ('LEFTPADDING', (0,0), (-1,-1), 20),
            ('RIGHTPADDING', (0,0), (-1,-1), 20),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
        ]))
        story.append(client_table)
        story.append(Spacer(1, 25))

        # 4. TABLEAU ARTICLES
        story.append(Paragraph("DÉTAIL DES ARTICLES", header_style))
        
        # En-têtes
        items_data = [['DESCRIPTION', 'PRIX U.', 'QTÉ', 'TOTAL']]
        
        # Articles
        for item in invoice['items']:
            items_data.append([
                item['product_name'][:60] + ('...' if len(item['product_name']) > 60 else ''),
                f"{float(item['unit_price']):,.0f} DH",
                str(item['quantity']),
                f"{float(item['total']):,.0f} DH"
            ])

        items_table = Table(items_data, colWidths=[100*mm, 30*mm, 20*mm, 30*mm])
        items_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (0,-1), 'LEFT'),
            ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
            ('ALIGN', (2,0), (2,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 11),
            ('FONTSIZE', (0,1), (-1,-1), 10),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E40AF')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12)
        ]))
        story.append(items_table)
        story.append(Spacer(1, 25))

        # 5. TOTAUX
        story.append(Paragraph("RÉCAPITULATIF", header_style))
        totals_data = [
            ['Sous-total HT', f"{float(invoice['amount']):,.0f} DH"],
            [f"TVA ({invoice['tax_rate']:.0f}%)", f"{float(invoice['tax']):,.0f} DH"],
        ]
        
        if invoice['discount'] and float(invoice['discount']) > 0:
            totals_data.append(['Remise', f"-{float(invoice['discount']):,.0f} DH"])
        
        totals_data.append(['TOTAL TTC', f"{float(invoice['total']):,.0f} DH"])

        totals_table = Table(totals_data, colWidths=[120*mm, 40*mm])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (0,-1), 'LEFT'),
            ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 12),
            ('FONTWEIGHT', (0,-1), (0,-1), 'BOLD'),
            ('FONTWEIGHT', (1,-1), (1,-1), 'BOLD'),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#1E40AF')),
            ('TEXTCOLOR', (0,-1), (-1,-1), colors.white),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#374151')),
            ('LEFTPADDING', (0,0), (-1,-1), 15),
            ('RIGHTPADDING', (0,0), (-1,-1), 15)
        ]))
        story.append(totals_table)
        story.append(Spacer(1, 30))

        # 6. PIED DE PAGE
        footer_text = f"""
        <b>CONDITIONS GÉNÉRALES:</b><br/><br/>
        • Garantie commerciale: 3 mois sur tous les produits<br/>
        • Conservez ce document pour toute réclamation<br/>
        • Retour/échange possible sous 7 jours (pièces neuves)<br/>
        • Aucun remboursement en espèces après paiement<br/><br/>
        <b>Teuss Phone Shop - Casablanca, Maroc</b><br/>
        Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}
        """
        story.append(Paragraph(footer_text, styles['Normal']))

        # Construire le PDF
        doc.build(story)
        buffer.seek(0)

        # ✅ CORRECTION : Suppression de cache_timeout
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"Facture_{invoice['invoice_number']}.pdf",
            mimetype='application/pdf'
        )

    except Exception as e:
        print(f"Erreur génération PDF facture {invoice_id}: {e}")
        return jsonify({'error': f'Erreur génération PDF: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()
