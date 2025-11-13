"""
Routes pour la gestion des factures
"""
from flask import Blueprint, request, jsonify
from utils.auth import token_required, admin_required
from utils.database import get_db_connection
import uuid
from datetime import datetime

factures_bp = Blueprint('factures', __name__)

@factures_bp.route('/', methods=['GET'])
@admin_required
def get_factures(current_user):
    """Récupérer toutes les factures"""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Récupérer les factures avec les informations de commande
            cursor.execute("""
                SELECT 
                    i.id, i.invoice_number, i.order_id, i.user_id,
                    i.amount, i.tax, i.total, i.status, i.payment_method,
                    i.created_at, i.paid_at,
                    o.status as order_status,
                    u.name as user_name, u.email as user_email
                FROM invoices i
                LEFT JOIN orders o ON i.order_id = o.id
                LEFT JOIN users u ON i.user_id = u.id
                ORDER BY i.created_at DESC
            """)
            factures = cursor.fetchall()
            
            return jsonify(factures), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@factures_bp.route('/<invoice_id>', methods=['GET'])
@token_required
def get_facture(current_user, invoice_id):
    """Récupérer une facture spécifique"""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Vérifier si l'utilisateur est admin ou propriétaire de la facture
            if current_user['role'] != 'admin':
                cursor.execute("""
                    SELECT COUNT(*) as count FROM invoices WHERE id = %s AND user_id = %s
                """, (invoice_id, current_user['id']))
                if cursor.fetchone()['count'] == 0:
                    return jsonify({'error': 'Accès non autorisé'}), 403
            
            # Récupérer la facture avec détails
            cursor.execute("""
                SELECT 
                    i.*,
                    o.shipping_address,
                    u.name as user_name, u.email as user_email
                FROM invoices i
                LEFT JOIN orders o ON i.order_id = o.id
                LEFT JOIN users u ON i.user_id = u.id
                WHERE i.id = %s
            """, (invoice_id,))
            facture = cursor.fetchone()
            
            if not facture:
                return jsonify({'error': 'Facture non trouvée'}), 404
            
            # Récupérer les items de la facture
            cursor.execute("""
                SELECT * FROM invoice_items WHERE invoice_id = %s
            """, (invoice_id,))
            facture['items'] = cursor.fetchall()
            
            return jsonify(facture), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@factures_bp.route('/', methods=['POST'])
@admin_required
def create_facture(current_user):
    """Créer une nouvelle facture"""
    data = request.json
    
    required_fields = ['order_id', 'user_id', 'amount', 'items']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Champs manquants'}), 400
    
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            invoice_id = str(uuid.uuid4())
            invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            # Calculer la taxe (20% par défaut)
            tax = data['amount'] * 0.20
            total = data['amount'] + tax
            
            # Créer la facture
            cursor.execute("""
                INSERT INTO invoices (
                    id, invoice_number, order_id, user_id,
                    amount, tax, total, status, payment_method
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                invoice_id, invoice_number, data['order_id'], data['user_id'],
                data['amount'], tax, total, 
                data.get('status', 'pending'),
                data.get('payment_method', 'cash_on_delivery')
            ))
            
            # Ajouter les items de la facture
            for item in data['items']:
                cursor.execute("""
                    INSERT INTO invoice_items (
                        id, invoice_id, product_name, quantity, unit_price, total_price
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()), invoice_id,
                    item['product_name'], item['quantity'],
                    item['unit_price'], item['quantity'] * item['unit_price']
                ))
            
            connection.commit()
            
            # Récupérer la facture créée
            cursor.execute("SELECT * FROM invoices WHERE id = %s", (invoice_id,))
            facture = cursor.fetchone()
            
            return jsonify(facture), 201
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@factures_bp.route('/<invoice_id>', methods=['PUT'])
@admin_required
def update_facture(current_user, invoice_id):
    """Mettre à jour une facture"""
    data = request.json
    
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Vérifier si la facture existe
            cursor.execute("SELECT * FROM invoices WHERE id = %s", (invoice_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Facture non trouvée'}), 404
            
            # Construire la requête de mise à jour
            update_fields = []
            params = []
            
            if 'status' in data:
                update_fields.append("status = %s")
                params.append(data['status'])
                
                # Si le statut passe à payé, ajouter la date de paiement
                if data['status'] == 'paid':
                    update_fields.append("paid_at = NOW()")
            
            if 'payment_method' in data:
                update_fields.append("payment_method = %s")
                params.append(data['payment_method'])
            
            if not update_fields:
                return jsonify({'error': 'Aucun champ à mettre à jour'}), 400
            
            params.append(invoice_id)
            query = f"UPDATE invoices SET {', '.join(update_fields)} WHERE id = %s"
            
            cursor.execute(query, tuple(params))
            connection.commit()
            
            # Récupérer la facture mise à jour
            cursor.execute("SELECT * FROM invoices WHERE id = %s", (invoice_id,))
            facture = cursor.fetchone()
            
            return jsonify(facture), 200
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@factures_bp.route('/<invoice_id>', methods=['DELETE'])
@admin_required
def delete_facture(current_user, invoice_id):
    """Supprimer une facture"""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Vérifier si la facture existe
            cursor.execute("SELECT * FROM invoices WHERE id = %s", (invoice_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Facture non trouvée'}), 404
            
            # Supprimer les items de la facture
            cursor.execute("DELETE FROM invoice_items WHERE invoice_id = %s", (invoice_id,))
            
            # Supprimer la facture
            cursor.execute("DELETE FROM invoices WHERE id = %s", (invoice_id,))
            connection.commit()
            
            return jsonify({'message': 'Facture supprimée avec succès'}), 200
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@factures_bp.route('/stats', methods=['GET'])
@admin_required
def get_factures_stats(current_user):
    """Obtenir les statistiques des factures"""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_invoices,
                    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_invoices,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_invoices,
                    SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_revenue,
                    AVG(CASE WHEN status = 'paid' THEN total ELSE NULL END) as avg_invoice_amount
                FROM invoices
            """)
            stats = cursor.fetchone()
            
            return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()
