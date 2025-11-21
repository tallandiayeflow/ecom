"""
Module de synchronisation automatique du stock
Utilisé par orders.py et factures.py
"""
from utils.database import execute_query
from utils.cache import cache
import uuid
from datetime import datetime


def decrease_stock_from_order(order_items, user_id, reason="Vente"):
    """
    Décrémente le stock après une commande
    
    Args:
        order_items: Liste des articles de la commande [{productId, quantity, ...}]
        user_id: ID de l'utilisateur qui a passé la commande
        reason: Raison du mouvement
    
    Returns:
        list: Liste des mouvements créés
    """
    movements = []
    
    for item in order_items:
        product_id = item.get('productId')
        quantity = int(item.get('quantity', 0))
        
        if not product_id or quantity <= 0:
            continue
        
        # Récupérer le stock actuel
        product = execute_query(
            "SELECT stock, name FROM products WHERE id = %s",
            (product_id,),
            fetch_one=True
        )
        
        if not product:
            continue
        
        previous_stock = product['stock']
        new_stock = max(0, previous_stock - quantity)
        
        # Mettre à jour le stock
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
               VALUES (%s, %s, 'out', %s, %s, %s, %s, %s, %s)""",
            (
                movement_id,
                product_id,
                quantity,
                previous_stock,
                new_stock,
                reason,
                user_id,
                datetime.now()
            ),
            commit=True
        )
        
        movements.append({
            'id': movement_id,
            'product_id': product_id,
            'product_name': product['name'],
            'quantity': quantity,
            'previous_stock': previous_stock,
            'new_stock': new_stock
        })
    
    # Invalider les caches
    _invalidate_stock_caches()
    
    return movements


def increase_stock_from_return(order_items, user_id, reason="Retour commande"):
    """
    Incrémente le stock après un retour de commande
    
    Args:
        order_items: Liste des articles retournés
        user_id: ID de l'utilisateur
        reason: Raison du retour
    
    Returns:
        list: Liste des mouvements créés
    """
    movements = []
    
    for item in order_items:
        product_id = item.get('product_id') or item.get('productId')
        quantity = int(item.get('quantity', 0))
        
        if not product_id or quantity <= 0:
            continue
        
        # Récupérer le stock actuel
        product = execute_query(
            "SELECT stock, name FROM products WHERE id = %s",
            (product_id,),
            fetch_one=True
        )
        
        if not product:
            continue
        
        previous_stock = product['stock']
        new_stock = previous_stock + quantity
        
        # Mettre à jour le stock
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
               VALUES (%s, %s, 'return', %s, %s, %s, %s, %s, %s)""",
            (
                movement_id,
                product_id,
                quantity,
                previous_stock,
                new_stock,
                reason,
                user_id,
                datetime.now()
            ),
            commit=True
        )
        
        movements.append({
            'id': movement_id,
            'product_id': product_id,
            'product_name': product['name'],
            'quantity': quantity,
            'previous_stock': previous_stock,
            'new_stock': new_stock
        })
    
    # Invalider les caches
    _invalidate_stock_caches()
    
    return movements


def increase_stock_from_invoice(invoice_items, user_id, reason="Réception marchandises"):
    """
    Incrémente le stock après réception d'une facture fournisseur
    
    Args:
        invoice_items: Liste des articles de la facture
        user_id: ID de l'admin
        reason: Raison de l'entrée
    
    Returns:
        list: Liste des mouvements créés
    """
    movements = []
    
    for item in invoice_items:
        product_id = item.get('product_id') or item.get('productId')
        quantity = int(item.get('quantity', 0))
        
        if not product_id or quantity <= 0:
            continue
        
        # Récupérer le stock actuel
        product = execute_query(
            "SELECT stock, name FROM products WHERE id = %s",
            (product_id,),
            fetch_one=True
        )
        
        if not product:
            continue
        
        previous_stock = product['stock']
        new_stock = previous_stock + quantity
        
        # Mettre à jour le stock
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
               VALUES (%s, %s, 'in', %s, %s, %s, %s, %s, %s)""",
            (
                movement_id,
                product_id,
                quantity,
                previous_stock,
                new_stock,
                reason,
                user_id,
                datetime.now()
            ),
            commit=True
        )
        
        movements.append({
            'id': movement_id,
            'product_id': product_id,
            'product_name': product['name'],
            'quantity': quantity,
            'previous_stock': previous_stock,
            'new_stock': new_stock
        })
    
    # Invalider les caches
    _invalidate_stock_caches()
    
    return movements


def _invalidate_stock_caches():
    """Invalide tous les caches liés au stock"""
    try:
        from routes.stock import (
            get_stock_stats,
            get_stock_alerts,
            get_inventory,
            get_stock_movements
        )
        
        cache.delete_memoized(get_stock_stats)
        cache.delete_memoized(get_stock_alerts)
        cache.delete_memoized(get_inventory)
        cache.delete_memoized(get_stock_movements)
    except:
        pass  # En cas d'erreur, on continue
