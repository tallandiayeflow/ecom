from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import hash_password, verify_password, generate_token, token_required
import uuid

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    
    if not email or not password or not name:
        return jsonify({'error': 'Email, password, and name are required'}), 400
    
    # Check if user exists
    existing_user = execute_query(
        "SELECT id FROM users WHERE email = %s",
        (email,),
        fetch_one=True
    )
    
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create user
    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    
    execute_query(
        "INSERT INTO users (id, email, password_hash, name, role) VALUES (%s, %s, %s, %s, %s)",
        (user_id, email, password_hash, name, 'user'),
        commit=True
    )
    
    token = generate_token(user_id, email, 'user')
    
    return jsonify({
        'user': {
            'id': user_id,
            'email': email,
            'name': name,
            'role': 'user',
            'loyaltyPoints': 0
        },
        'token': token
    }), 201

@bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Get user
    user = execute_query(
        "SELECT id, email, password_hash, name, role, is_active, loyalty_points FROM users WHERE email = %s",
        (email,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user['is_active']:
        return jsonify({'error': 'Account is inactive'}), 403
    
    # Verify password
    if not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = generate_token(user['id'], user['email'], user['role'])
    
    return jsonify({
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'role': user['role'],
            'loyaltyPoints': user['loyalty_points']
        },
        'token': token
    }), 200

@bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current user profile"""
    user = execute_query(
        "SELECT id, email, name, role, loyalty_points, created_at FROM users WHERE id = %s",
        (current_user['user_id'],),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user['id'],
        'email': user['email'],
        'name': user['name'],
        'role': user['role'],
        'loyaltyPoints': user['loyalty_points'],
        'createdAt': user['created_at'].isoformat() if user['created_at'] else None
    }), 200

@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Request password reset"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # In a real application, send a reset email
    # For now, just return success
    return jsonify({'message': 'Password reset email sent'}), 200
