from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import token_required, admin_required
import uuid
import json
from datetime import datetime

bp = Blueprint('orders', __name__)


@bp.route('', methods=['GET'])
@token_required
def get_user_orders(current_user):
    """Get user's orders"""
    orders = execute_query(
        """SELECT * FROM orders
           WHERE user_id = %s
           ORDER BY created_at DESC""",
        (current_user['user_id'],),
        fetch_all=True
    )
    
    formatted_orders = []
    for order in orders:
        # ✅ Récupérer les items avec le nom du produit
        items = execute_query(
            "SELECT * FROM order_items WHERE order_id = %s",
            (order['id'],),
            fetch_all=True
        )
        
        formatted_orders.append({
            'id': order['id'],
            'status': order['status'],
            'total': float(order['total']),
            'discount': float(order.get('discount', 0)),
            'finalTotal': float(order.get('final_total', order['total'])),
            'shippingAddress': json.loads(order['shipping_address']),
            'voucherCode': order.get('voucher_code'),
            'loyaltyPointsEarned': order.get('loyalty_points_earned', 0),
            'items': [{
                'id': item['id'],
                'productId': item.get('product_id'),
                'productName': item['product_name'],  # ✅ NOM DU PRODUIT
                'productImage': item.get('product_image', ''),
                'price': float(item['price']),
                'quantity': item['quantity']
            } for item in items],
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else None,
            'qrCode': order.get('qr_code', '')
        })
    
    return jsonify(formatted_orders), 200


@bp.route('/<order_id>', methods=['GET'])
@token_required
def get_order(current_user, order_id):
    """Get single order details"""
    order = execute_query(
        "SELECT * FROM orders WHERE id = %s AND user_id = %s",
        (order_id, current_user['user_id']),
        fetch_one=True
    )
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # ✅ Récupérer les items
    items = execute_query(
        "SELECT * FROM order_items WHERE order_id = %s",
        (order_id,),
        fetch_all=True
    )
    
    return jsonify({
        'id': order['id'],
        'status': order['status'],
        'total': float(order['total']),
        'discount': float(order.get('discount', 0)),
        'finalTotal': float(order.get('final_total', order['total'])),
        'shippingAddress': json.loads(order['shipping_address']),
        'voucherCode': order.get('voucher_code'),
        'loyaltyPointsEarned': order.get('loyalty_points_earned', 0),
        'items': [{
            'id': item['id'],
            'productId': item.get('product_id'),
            'productName': item['product_name'],  # ✅ NOM DU PRODUIT
            'productImage': item.get('product_image', ''),
            'price': float(item['price']),
            'quantity': item['quantity']
        } for item in items],
        'createdAt': order['created_at'].isoformat() if order.get('created_at') else None,
        'qrCode': order.get('qr_code', '')
    }), 200


@bp.route('', methods=['POST'])
@token_required
def create_order(current_user):
    """Create a new order"""
    data = request.get_json()
    
    # Validation
    if not data.get('items') or not data.get('shippingAddress'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    items = data['items']
    if not items:
        return jsonify({'error': 'Order must contain at least one item'}), 400
    
    # ✅ DEBUG : Afficher les données reçues
    print("📦 Items received from frontend:")
    for item in items:
        print(f"  - {item.get('name')} (ID: {item.get('productId')}) - {item.get('quantity')}x {item.get('price')} DH")
    
    order_id = str(uuid.uuid4())
    
    # Calculer le total
    subtotal = sum(float(item['price']) * int(item['quantity']) for item in items)
    discount = float(data.get('discount', 0))
    shipping_cost = 50 if subtotal < 500 else 0
    final_total = subtotal - discount + shipping_cost
    
    # Points de fidélité (1 point pour 10 DH)
    loyalty_points = int(final_total / 10)
    
    # Préparer les données de livraison
    shipping_address = json.dumps(data['shippingAddress'])
    
    try:
        # Créer la commande
        execute_query(
            """INSERT INTO orders 
               (id, user_id, total, discount, final_total, status, 
                shipping_address, voucher_code, loyalty_points_earned)
               VALUES (%s, %s, %s, %s, %s, 'pending', %s, %s, %s)""",
            (
                order_id,
                current_user['user_id'],
                subtotal,
                discount,
                final_total,
                shipping_address,
                data.get('voucherCode'),
                loyalty_points
            ),
            commit=True
        )
        print(f"✅ Order created: {order_id}")
    except Exception as e:
        print(f"❌ Error creating order: {e}")
        return jsonify({'error': 'Failed to create order'}), 500
    
    # ✅ Créer les order items avec le nom du produit
    for item in items:
        item_id = str(uuid.uuid4())
        
        # ✅ Récupérer le nom depuis le frontend
        product_name = item.get('name', 'Produit sans nom')
        
        # Récupérer l'image du produit si disponible
        product = execute_query(
            "SELECT image_url, images FROM products WHERE id = %s",
            (item['productId'],),
            fetch_one=True
        )
        
        # Utiliser la première image si disponible
        product_image = ''
        if product:
            if product.get('images'):
                try:
                    images_list = json.loads(product['images'])
                    product_image = images_list[0] if images_list else product.get('image_url', '')
                except:
                    product_image = product.get('image_url', '')
            else:
                product_image = product.get('image_url', '')
        
        # ✅ DEBUG
        print(f"💾 Inserting item: {product_name} - {item['quantity']}x {item['price']} DH")
        
        try:
            execute_query(
                """INSERT INTO order_items 
                   (id, order_id, product_id, product_name, product_image, 
                    price, quantity)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    item_id,
                    order_id,
                    item['productId'],
                    product_name,  # ✅ NOM DU PRODUIT
                    product_image,
                    item['price'],
                    item['quantity']
                ),
                commit=True
            )
            print(f"✅ Item inserted: {product_name}")
        except Exception as e:
            print(f"❌ Error inserting item: {e}")
    
    # Mettre à jour le voucher si utilisé
    if data.get('voucherCode'):
        try:
            execute_query(
                "UPDATE vouchers SET used_count = used_count + 1 WHERE code = %s",
                (data['voucherCode'],),
                commit=True
            )
        except:
            pass
    
    # Mettre à jour les points de fidélité
    try:
        execute_query(
            "UPDATE users SET loyalty_points = loyalty_points + %s WHERE id = %s",
            (loyalty_points, current_user['user_id']),
            commit=True
        )
    except:
        pass
    
    # Vider le panier
    try:
        execute_query(
            "DELETE FROM cart_items WHERE user_id = %s",
            (current_user['user_id'],),
            commit=True
        )
    except:
        pass
    
    # Retourner la commande créée
    return jsonify({
        'id': order_id,
        'userId': current_user['user_id'],
        'total': subtotal,
        'discount': discount,
        'finalTotal': final_total,
        'status': 'pending',
        'shippingAddress': data['shippingAddress'],
        'voucherCode': data.get('voucherCode'),
        'loyaltyPointsEarned': loyalty_points,
        'createdAt': datetime.now().isoformat()
    }), 201


@bp.route('/<order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(current_user, order_id):
    """Update order status (Admin only)"""
    data = request.get_json()
    status = data.get('status')
    
    if status not in ['pending', 'processing', 'shipped', 'delivered', 'cancelled']:
        return jsonify({'error': 'Invalid status'}), 400
    
    execute_query(
        "UPDATE orders SET status = %s WHERE id = %s",
        (status, order_id),
        commit=True
    )
    
    return jsonify({'message': 'Order status updated'}), 200


@bp.route('/admin/all', methods=['GET'])
@admin_required
def get_all_orders(current_user):
    """Get all orders (Admin only)"""
    orders = execute_query(
        "SELECT * FROM orders ORDER BY created_at DESC",
        fetch_all=True
    )
    
    formatted_orders = []
    for order in orders:
        # ✅ Récupérer les items avec le nom
        items = execute_query(
            "SELECT * FROM order_items WHERE order_id = %s",
            (order['id'],),
            fetch_all=True
        )
        
        formatted_orders.append({
            'id': order['id'],
            'userId': order['user_id'],
            'status': order['status'],
            'total': float(order['total']),
            'discount': float(order.get('discount', 0)),
            'finalTotal': float(order.get('final_total', order['total'])),
            'shippingAddress': json.loads(order['shipping_address']),
            'voucherCode': order.get('voucher_code'),
            'loyaltyPointsEarned': order.get('loyalty_points_earned', 0),
            'items': [{
                'id': item['id'],
                'productId': item.get('product_id'),
                'productName': item['product_name'],  # ✅ NOM DU PRODUIT
                'productImage': item.get('product_image', ''),
                'price': float(item['price']),
                'quantity': item['quantity']
            } for item in items],
            'createdAt': order['created_at'].isoformat() if order.get('created_at') else None
        })
    
    return jsonify(formatted_orders), 200


@bp.route('/public/<order_id>', methods=['GET'])
def get_public_order(order_id):
    """Get order details publicly without authentication"""
    order = execute_query(
        "SELECT * FROM orders WHERE id = %s",
        (order_id,),
        fetch_one=True
    )
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    items = execute_query(
        "SELECT * FROM order_items WHERE order_id = %s",
        (order_id,),
        fetch_all=True
    )

    return jsonify({
        'id': order['id'],
        'status': order['status'],
        'total': float(order['total']),
        'discount': float(order.get('discount', 0)),
        'finalTotal': float(order.get('final_total', order['total'])),
        'shippingAddress': json.loads(order['shipping_address']),
        'voucherCode': order.get('voucher_code'),
        'loyaltyPointsEarned': order.get('loyalty_points_earned', 0),
        'items': [{
            'id': item['id'],
            'productId': item.get('product_id'),
            'productName': item['product_name'],
            'productImage': item.get('product_image', ''),
            'price': float(item['price']),
            'quantity': item['quantity']
        } for item in items],
        'createdAt': order['created_at'].isoformat() if order.get('created_at') else None,
        'user': {
            'name': json.loads(order['shipping_address']).get('name'),
            'email': order.get('user_email', ''),
        }
    })
