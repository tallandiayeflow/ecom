"""
Routes pour la gestion du stock
"""
from flask import Blueprint, request, jsonify
from utils.auth import token_required, admin_required
from utils.database import get_db_connection
import uuid
from datetime import datetime

stock_bp = Blueprint('stock', __name__)

@stock_bp.route('/', methods=['GET'])
@admin_required
def get_stock_movements(current_user):
    """Récupérer tous les mouvements de stock"""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    sm.*,
                    p.name as product_name,
                    p.image_url as product_image,
                    u.name as user_name
                FROM stock_movements sm
                LEFT JOIN products p ON sm.product_id = p.id
                LEFT JOIN users u ON sm.user_id = u.id
                ORDER BY sm.created_at DESC
            """)
            movements = cursor.fetchall()
            
            return jsonify(movements), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@stock_bp.route('/product/<product_id>', methods=['GET'])
@admin_required
def get_product_stock_movements(current_user, product_id):
    """Récupérer les mouvements de stock d'un produit spécifique"""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    sm.*,
                    u.name as user_name
                FROM stock_movements sm
                LEFT JOIN users u ON sm.user_id = u.id
                WHERE sm.product_id = %s
                ORDER BY sm.created_at DESC
            """, (product_id,))
            movements = cursor.fetchall()
            
            return jsonify(movements), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@stock_bp.route('/movement', methods=['POST'])
@admin_required
def create_stock_movement(current_user):
    """Créer un mouvement de stock"""
    data = request.json
    
    required_fields = ['product_id', 'quantity', 'movement_type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Champs manquants'}), 400
    
    # Valider le type de mouvement
    valid_types = ['in', 'out', 'adjustment', 'return']
    if data['movement_type'] not in valid_types:
        return jsonify({'error': f'Type de mouvement invalide. Valeurs acceptées: {", ".join(valid_types)}'}), 400
    
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Vérifier si le produit existe
            cursor.execute("SELECT stock FROM products WHERE id = %s", (data['product_id'],))
            product = cursor.fetchone()
            
            if not product:
                return jsonify({'error': 'Produit non trouvé'}), 404
            
            current_stock = product['stock']
            
            # Calculer le nouveau stock
            if data['movement_type'] in ['in', 'return']:
                new_stock = current_stock + data['quantity']
            else:  # out ou adjustment
                new_stock = current_stock - data['quantity']
                
                if new_stock < 0:
                    return jsonify({'error': 'Stock insuffisant'}), 400
            
            # Créer le mouvement
            movement_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO stock_movements (
                    id, product_id, quantity, movement_type,
                    previous_stock, new_stock, reason, user_id
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                movement_id, data['product_id'], data['quantity'],
                data['movement_type'], current_stock, new_stock,
                data.get('reason', ''), current_user['id']
            ))
            
            # Mettre à jour le stock du produit
            cursor.execute("""
                UPDATE products SET stock = %s WHERE id = %s
            """, (new_stock, data['product_id']))
            
            connection.commit()
            
            # Récupérer le mouvement créé
            cursor.execute("""
                SELECT 
                    sm.*,
                    p.name as product_name,
                    u.name as user_name
                FROM stock_movements sm
                LEFT JOIN products p ON sm.product_id = p.id
                LEFT JOIN users u ON sm.user_id = u.id
                WHERE sm.id = %s
            """, (movement_id,))
            movement = cursor.fetchone()
            
            return jsonify(movement), 201
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@stock_bp.route('/alerts', methods=['GET'])
@admin_required
def get_stock_alerts(current_user):
    """Récupérer les alertes de stock (produits en rupture ou stock faible)"""
    threshold = request.args.get('threshold', default=10, type=int)
    
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    id, name, stock, image_url, price, category_id
                FROM products
                WHERE stock <= %s AND stock > 0
                ORDER BY stock ASC
            """, (threshold,))
            low_stock = cursor.fetchall()
            
            cursor.execute("""
                SELECT 
                    id, name, stock, image_url, price, category_id
                FROM products
                WHERE stock = 0
            """)
            out_of_stock = cursor.fetchall()
            
            return jsonify({
                'low_stock': low_stock,
                'out_of_stock': out_of_stock,
                'low_stock_count': len(low_stock),
                'out_of_stock_count': len(out_of_stock)
            }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@stock_bp.route('/stats', methods=['GET'])
@admin_required
def get_stock_stats(current_user):
    """Obtenir les statistiques de stock"""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Statistiques générales
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_products,
                    SUM(stock) as total_stock,
                    SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
                    SUM(CASE WHEN stock <= 10 AND stock > 0 THEN 1 ELSE 0 END) as low_stock_count,
                    SUM(stock * price) as total_stock_value
                FROM products
            """)
            general_stats = cursor.fetchone()
            
            # Mouvements récents (7 derniers jours)
            cursor.execute("""
                SELECT 
                    DATE(created_at) as date,
                    movement_type,
                    SUM(quantity) as total_quantity
                FROM stock_movements
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at), movement_type
                ORDER BY date DESC
            """)
            recent_movements = cursor.fetchall()
            
            # Top produits par valeur de stock
            cursor.execute("""
                SELECT 
                    id, name, stock, price, (stock * price) as stock_value
                FROM products
                WHERE stock > 0
                ORDER BY stock_value DESC
                LIMIT 10
            """)
            top_products = cursor.fetchall()
            
            return jsonify({
                'general': general_stats,
                'recent_movements': recent_movements,
                'top_products': top_products
            }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@stock_bp.route('/inventory', methods=['GET'])
@admin_required
def get_inventory(current_user):
    """Obtenir l'inventaire complet avec valeur du stock"""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    p.id, p.name, p.stock, p.price, p.image_url,
                    p.category_id, c.name as category_name,
                    (p.stock * p.price) as stock_value,
                    CASE 
                        WHEN p.stock = 0 THEN 'out_of_stock'
                        WHEN p.stock <= 10 THEN 'low_stock'
                        WHEN p.stock <= 50 THEN 'medium_stock'
                        ELSE 'good_stock'
                    END as stock_status
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                ORDER BY p.name ASC
            """)
            inventory = cursor.fetchall()
            
            return jsonify(inventory), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()
