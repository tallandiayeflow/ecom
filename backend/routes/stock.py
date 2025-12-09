from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
from utils.cache import cache
import uuid
from datetime import datetime
import json


bp = Blueprint('stock', __name__)


# ================= GET STOCK STATISTICS =================
@bp.route('/stats', methods=['GET'])
@admin_required
@cache.cached(timeout=120)  # Cache 2 minutes
def get_stock_stats(current_user):
    """Obtenir les statistiques globales du stock"""
    
    # Total des produits
    total_products = execute_query(
        "SELECT COUNT(*) as count FROM products",
        fetch_one=True
    )['count']
    
    # Total du stock (somme de toutes les quantités)
    total_stock = execute_query(
        "SELECT COALESCE(SUM(stock), 0) as total FROM products",
        fetch_one=True
    )['total']
    
    # Produits en stock faible (< 10 unités)
    low_stock = execute_query(
        "SELECT COUNT(*) as count FROM products WHERE stock > 0 AND stock < 10",
        fetch_one=True
    )['count']
    
    # Produits en rupture de stock
    out_of_stock = execute_query(
        "SELECT COUNT(*) as count FROM products WHERE stock = 0",
        fetch_one=True
    )['count']
    
    # Valeur totale du stock (prix * quantité)
    stock_value = execute_query(
        "SELECT COALESCE(SUM(price * stock), 0) as value FROM products",
        fetch_one=True
    )['value']
    
    return jsonify({
        'totalProducts': total_products,
        'totalStock': int(total_stock),
        'lowStockCount': low_stock,
        'outOfStockCount': out_of_stock,
        'totalStockValue': float(stock_value)
    }), 200


# ================= GET STOCK ALERTS =================
@bp.route('/alerts', methods=['GET'])
@admin_required
@cache.cached(timeout=180)  # Cache 3 minutes
def get_stock_alerts(current_user):
    """Obtenir les alertes de stock (produits en stock faible ou en rupture)"""
    
    # Produits en stock faible
    low_stock_products = execute_query(
        """SELECT id, name, stock, image_url, price
           FROM products
           WHERE stock > 0 AND stock < 10
           ORDER BY stock ASC
           LIMIT 20""",
        fetch_all=True
    )
    
    # Produits en rupture
    out_of_stock_products = execute_query(
        """SELECT id, name, stock, image_url, price
           FROM products
           WHERE stock = 0
           ORDER BY name
           LIMIT 20""",
        fetch_all=True
    )
    
    formatted_low_stock = [{
        'id': p['id'],
        'name': p['name'],
        'stock': p['stock'],
        'imageUrl': p['image_url'],
        'price': float(p['price']),
        'status': 'low'
    } for p in low_stock_products]
    
    formatted_out_of_stock = [{
        'id': p['id'],
        'name': p['name'],
        'stock': p['stock'],
        'imageUrl': p['image_url'],
        'price': float(p['price']),
        'status': 'out'
    } for p in out_of_stock_products]
    
    return jsonify({
        'lowStockCount': len(formatted_low_stock),
        'outOfStockCount': len(formatted_out_of_stock),
        'alerts': formatted_low_stock + formatted_out_of_stock
    }), 200


# ================= GET INVENTORY (FULL STOCK LIST) =================
@bp.route('/inventory', methods=['GET'])
@admin_required
@cache.cached(timeout=60, query_string=True)  # Cache 1 minute
def get_inventory(current_user):
    """Obtenir l'inventaire complet avec statut de stock"""
    
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    offset = (page - 1) * limit
    
    inventory = execute_query(
        """SELECT p.id, p.name, p.stock, p.price, p.image_url,
                  c.name as category_name,
                  (p.price * p.stock) as stock_value
           FROM products p
           LEFT JOIN categories c ON p.category_id = c.id
           ORDER BY p.name
           LIMIT %s OFFSET %s""",
        (limit, offset),
        fetch_all=True
    )
    
    # Déterminer le statut de stock pour chaque produit
    formatted_inventory = []
    for item in inventory:
        stock = item['stock']
        
        # Déterminer le statut
        if stock == 0:
            stock_status = 'out_of_stock'
        elif stock < 5:
            stock_status = 'low_stock'
        elif stock < 10:
            stock_status = 'medium_stock'
        else:
            stock_status = 'good_stock'
        
        formatted_inventory.append({
            'id': item['id'],
            'name': item['name'],
            'category': item['category_name'] or 'Non catégorisé',
            'stock': stock,
            'price': float(item['price']),
            'stockValue': float(item['stock_value']),
            'imageUrl': item['image_url'],
            'stockStatus': stock_status
        })
    
    # Compter le total
    total = execute_query(
        "SELECT COUNT(*) as count FROM products",
        fetch_one=True
    )['count']
    
    return jsonify({
        'inventory': formatted_inventory,
        'total': total,
        'page': page,
        'totalPages': (total + limit - 1) // limit
    }), 200


# ================= GET STOCK MOVEMENTS =================
@bp.route('/movements', methods=['GET'])
@admin_required
@cache.cached(timeout=30, query_string=True)  # Cache 30 secondes
def get_stock_movements(current_user):
    """Obtenir l'historique des mouvements de stock"""
    
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    offset = (page - 1) * limit
    
    movements = execute_query(
        """SELECT sm.*, p.name as product_name, p.image_url,
                  u.name as user_name
           FROM stock_movements sm
           JOIN products p ON sm.product_id = p.id
           LEFT JOIN users u ON sm.user_id = u.id
           ORDER BY sm.created_at DESC
           LIMIT %s OFFSET %s""",
        (limit, offset),
        fetch_all=True
    )
    
    formatted_movements = [{
        'id': m['id'],
        'productId': m['product_id'],
        'productName': m['product_name'],
        'productImage': m['image_url'],
        'type': m['movement_type'],
        'quantity': m['quantity'],
        'previousStock': m['previous_stock'],
        'newStock': m['new_stock'],
        'reason': m['reason'],
        'user': m['user_name'] or 'Système',
        'date': m['created_at'].isoformat() if m['created_at'] else None
    } for m in movements]
    
    total = execute_query(
        "SELECT COUNT(*) as count FROM stock_movements",
        fetch_one=True
    )['count']
    
    return jsonify({
        'movements': formatted_movements,
        'total': total,
        'page': page,
        'totalPages': (total + limit - 1) // limit
    }), 200


# ================= CREATE STOCK MOVEMENT (ADJUST STOCK) =================
@bp.route('/movements', methods=['POST'])
@admin_required
def create_stock_movement(current_user):
    """Créer un mouvement de stock (ajustement manuel, entrée, sortie, retour)"""
    
    data = request.get_json()
    
    # Validation
    if not data.get('productId'):
        return jsonify({'error': 'productId is required'}), 400
    if not data.get('type'):
        return jsonify({'error': 'type is required'}), 400
    if 'quantity' not in data:
        return jsonify({'error': 'quantity is required'}), 400
    
    product_id = data['productId']
    movement_type = data['type']  # 'in', 'out', 'return', 'adjustment'
    quantity = int(data['quantity'])
    reason = data.get('reason', '')
    
    if movement_type not in ['in', 'out', 'return', 'adjustment']:
        return jsonify({'error': 'Invalid movement type. Must be: in, out, return, or adjustment'}), 400
    
    if quantity < 0:
        return jsonify({'error': 'Quantity must be positive'}), 400
    
    # Récupérer le stock actuel
    product = execute_query(
        "SELECT stock, name FROM products WHERE id = %s",
        (product_id,),
        fetch_one=True
    )
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    previous_stock = product['stock']
    
    # Calculer le nouveau stock
    if movement_type in ['in', 'return']:
        new_stock = previous_stock + quantity
    elif movement_type == 'out':
        new_stock = max(0, previous_stock - quantity)
    else:  # adjustment (définir directement le stock à cette valeur)
        new_stock = quantity
        quantity = abs(new_stock - previous_stock)  # Calculer la différence
    
    # Mettre à jour le stock du produit
    execute_query(
        "UPDATE products SET stock = %s WHERE id = %s",
        (new_stock, product_id),
        commit=True
    )
    
    # Créer le mouvement de stock
    movement_id = str(uuid.uuid4())
    execute_query(
        """INSERT INTO stock_movements
           (id, product_id, movement_type, quantity, previous_stock, new_stock, reason, user_id, created_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            movement_id,
            product_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            reason,
            current_user['user_id'],
            datetime.now()
        ),
        commit=True
    )
    
    # Invalider les caches
    cache.delete_memoized(get_stock_stats)
    cache.delete_memoized(get_stock_alerts)
    cache.delete_memoized(get_inventory)
    cache.delete_memoized(get_stock_movements)
    
    return jsonify({
        'id': movement_id,
        'message': f'Stock updated successfully for {product["name"]}',
        'previousStock': previous_stock,
        'newStock': new_stock
    }), 201


# ================= UPDATE PRODUCT STOCK (SIMPLE) =================
@bp.route('/products/<product_id>', methods=['PATCH'])
@admin_required
def update_product_stock(current_user, product_id):
    """Mise à jour simple du stock d'un produit"""
    
    data = request.get_json()
    
    if 'stock' not in data:
        return jsonify({'error': 'stock is required'}), 400
    
    new_stock = int(data['stock'])
    
    if new_stock < 0:
        return jsonify({'error': 'Stock cannot be negative'}), 400
    
    # Récupérer le produit
    product = execute_query(
        "SELECT stock, name FROM products WHERE id = %s",
        (product_id,),
        fetch_one=True
    )
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    previous_stock = product['stock']
    
    # Mettre à jour le stock
    execute_query(
        "UPDATE products SET stock = %s WHERE id = %s",
        (new_stock, product_id),
        commit=True
    )
    
    # Créer un mouvement
    movement_id = str(uuid.uuid4())
    execute_query(
        """INSERT INTO stock_movements
           (id, product_id, movement_type, quantity, previous_stock, new_stock, reason, user_id, updated_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            movement_id,
            product_id,
            'adjustment',
            abs(new_stock - previous_stock),
            previous_stock,
            new_stock,
            data.get('reason', 'Manual stock adjustment'),
            current_user['user_id'],
            datetime.now()
        ),
        commit=True
    )
    
    # Invalider les caches
    cache.delete_memoized(get_stock_stats)
    cache.delete_memoized(get_stock_alerts)
    cache.delete_memoized(get_inventory)
    cache.delete_memoized(get_stock_movements)
    
    return jsonify({
        'message': 'Stock updated successfully',
        'productName': product['name'],
        'previousStock': previous_stock,
        'newStock': new_stock
    }), 200


# ================= DELETE STOCK MOVEMENT =================
@bp.route('/movements/<movement_id>', methods=['DELETE'])
@admin_required
def delete_stock_movement(current_user, movement_id):
    """Supprimer un mouvement de stock (ne restaure pas le stock)"""
    
    movement = execute_query(
        "SELECT id FROM stock_movements WHERE id = %s",
        (movement_id,),
        fetch_one=True
    )
    
    if not movement:
        return jsonify({'error': 'Stock movement not found'}), 404
    
    execute_query(
        "DELETE FROM stock_movements WHERE id = %s",
        (movement_id,),
        commit=True
    )
    
    # Invalider le cache des mouvements
    cache.delete_memoized(get_stock_movements)
    
    return jsonify({'message': 'Stock movement deleted successfully'}), 200
