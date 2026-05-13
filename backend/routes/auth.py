from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import hash_password, verify_password, generate_token,token_required
import uuid
import random
import time
import string
import os
import secrets
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from utils.cache import cache  # Importer le cache


bp = Blueprint('auth', __name__)

def generate_unique_code(length=8):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    name = data.get('name', '').strip()

    if not phone or not password or not name:
        return jsonify({'error': 'Téléphone, mot de passe et nom sont requis'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Le mot de passe doit contenir au moins 6 caractères'}), 400

    # Email optionnel — générer un placeholder si absent
    if not email:
        email = f"user_{phone.replace('+', '')}@noor.local"

    existing_user = execute_query(
        "SELECT id FROM users WHERE phone = %s",
        (phone,),
        fetch_one=True
    )
    if not existing_user and email and not email.endswith('@noor.local'):
        existing_user = execute_query(
            "SELECT id FROM users WHERE email = %s",
            (email,),
            fetch_one=True
        )

    if existing_user:
        return jsonify({'error': 'Ce numéro de téléphone est déjà utilisé'}), 409

    unique_code = generate_unique_code()
    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)

    execute_query(
        "INSERT INTO users (id, email, phone, password_hash, name, role, code) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (user_id, email, phone, password_hash, name, 'user', unique_code),
        commit=True
    )

    token = generate_token(user_id, email, 'user')

    return jsonify({
        'user': {
            'id': user_id,
            'email': email,
            'phone': phone,
            'name': name,
            'role': 'user',
            'code': unique_code,
            'loyaltyPoints': 0
        },
        'token': token
    }), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = data.get('identifier', '').strip().lower()  # email ou téléphone
    password = data.get('password', '')

    if not identifier or not password:
        return jsonify({'error': 'Identifiant et mot de passe requis'}), 400

    user = execute_query(
        "SELECT id, email, phone, password_hash, name, role, is_active, loyalty_points ,code FROM users WHERE email = %s OR phone = %s",
        (identifier, identifier),
        fetch_one=True
    )
    if not user:
        return jsonify({'error': 'Identifiant ou mot de passe invalide'}), 401

    if not user['is_active']:
        return jsonify({'error': 'Compte inactif'}), 403

    if not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Identifiant ou mot de passe invalide'}), 401

    token = generate_token(user['id'], user['email'], user['role'])

    return jsonify({
        'user': {
            'id': user['id'],
            'email': user['email'],
            'phone': user['phone'],
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
    
    # Créer une clé de cache unique par utilisateur
    cache_key = f"user_profile_{current_user['user_id']}"
    
    # Vérifier si le profil est en cache
    cached_data = cache.get(cache_key)
    if cached_data:
        return jsonify(cached_data), 200
    
    # Si pas en cache, interroger la base de données
    user = execute_query(
        "SELECT id, email, name, role, loyalty_points, created_at FROM users WHERE id = %s",
        (current_user['user_id'],),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Formater la réponse
    response_data = {
        'id': user['id'],
        'email': user['email'],
        'name': user['name'],
        'role': user['role'],
        'loyaltyPoints': user['loyalty_points'],
        'createdAt': user['created_at'].isoformat() if user['created_at'] else None
    }
    
    # Stocker en cache pendant 2 minutes
    cache.set(cache_key, response_data, timeout=120)
    
    return jsonify(response_data), 200


@bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update current user profile"""
    data = request.get_json()
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    
    if not name or not phone:
        return jsonify({'error': 'Name and phone are required'}), 400
    
    execute_query(
        "UPDATE users SET name = %s, phone = %s WHERE id = %s",
        (name, phone, current_user['user_id']),
        commit=True
    )
    
    # AJOUTER : Invalider le cache du profil utilisateur
    cache_key = f"user_profile_{current_user['user_id']}"
    cache.delete(cache_key)
    
    return jsonify({'message': 'Profile updated successfully'}), 200

@bp.route('/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
    """Change current user password"""
    data = request.get_json()
    old_password = data.get('oldPassword', '')
    new_password = data.get('newPassword', '')
    
    if not old_password or not new_password:
        return jsonify({'error': 'Old password and new password are required'}), 400
    
    user = execute_query(
        "SELECT password_hash FROM users WHERE id = %s",
        (current_user['user_id'],),
        fetch_one=True
    )
    
    if not user or not verify_password(old_password, user['password_hash']):
        return jsonify({'error': 'Old password is incorrect'}), 401
    
    new_password_hash = hash_password(new_password)
    execute_query(
        "UPDATE users SET password_hash = %s WHERE id = %s",
        (new_password_hash, current_user['user_id']),
        commit=True
    )
    
    # AJOUTER : Invalider le cache (optionnel ici car le mot de passe n'apparaît pas dans /me)
    cache_key = f"user_profile_{current_user['user_id']}"
    cache.delete(cache_key)
    
    return jsonify({'message': 'Password changed successfully'}), 200


@bp.route('/activate-account', methods=['POST'])
def activate_account():
    """Activate user account (dummy implementation)"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    user = execute_query(
        "SELECT id, is_active FROM users WHERE email = %s",
        (email,),
        fetch_one=True
    )
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user['is_active']:
        return jsonify({'message': 'Account is already active'}), 200
    
    # Dummy activation process
    execute_query(
        "UPDATE users SET is_active = TRUE WHERE id = %s",
        (user['id'],),
        commit=True
    )
    
    return jsonify({'message': 'Account activated successfully'}), 200

@bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout current user (dummy implementation)"""
    # In a real application, you might handle token blacklisting here
    return jsonify({'message': 'Logged out successfully'}), 200

@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Handle forgot password: create a one-hour token and send reset email."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = execute_query(
        "SELECT id FROM users WHERE email = %s",
        (email,),
        fetch_one=True
    )
    if not user:
        return jsonify({'error': 'User not found'}), 404

    token = secrets.token_urlsafe(48)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    # Try to insert into password_resets table, fallback to users.reset_token fields
    try:
        execute_query(
            "INSERT INTO password_resets (user_id, token, expires_at, used, created_at) VALUES (%s, %s, %s, 0, NOW())",
            (user['id'], token, expires_at),
            commit=True
        )
    except Exception:
        try:
            execute_query(
                "UPDATE users SET reset_token = %s, reset_token_expiry = %s WHERE id = %s",
                (token, expires_at, user['id']),
                commit=True
            )
        except Exception:
            return jsonify({'error': "Erreur serveur: impossible de stocker le token de réinitialisation"}), 500

    SMTP_USER = os.getenv('MAIL_USERNAME')
    SMTP_PASSWORD = os.getenv('MAIL_PASSWORD')
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').rstrip('/')

    if not SMTP_USER or not SMTP_PASSWORD:
        return jsonify({'error': 'Email server not configured (set MAIL_USERNAME and MAIL_PASSWORD)'}), 500

    reset_link = f"{CORS_ORIGINS}/reset-password?token={token}&email={email}"

    msg = EmailMessage()
    msg['Subject'] = 'Réinitialisation de votre mot de passe'
    msg['From'] = SMTP_USER
    msg['To'] = email
    msg.set_content(
        f"Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe. "
        f"Veuillez cliquer sur le lien suivant pour définir un nouveau mot de passe (valide 1 heure):\n\n{reset_link}\n\n"
        "Si vous n'avez pas demandé cette action, ignorez cet e-mail.\n\nCordialement."
    )
    msg.add_alternative(f"""\
    <html>
      <body>
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous (valide 1 heure) :</p>
        <p><a href="{reset_link}">Réinitialiser mon mot de passe</a></p>
        <p>Si vous n'avez pas demandé cette action, ignorez cet e-mail.</p>
      </body>
    </html>
    """, subtype='html')

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        return jsonify({'error': "Impossible d'envoyer l'e-mail de réinitialisation", 'details': str(e)}), 500

    return jsonify({'message': "E-mail de réinitialisation envoyé. Vérifiez votre boîte mail."}), 200


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using a token sent by email."""
    data = request.get_json() or {}
    token = data.get('token', '').strip()
    new_password = data.get('newPassword', '')
    
    # Validation des données
    if not token or not new_password:
        return jsonify({'error': 'Token et nouveau mot de passe requis'}), 400
    
    if len(new_password) < 6:
        return jsonify({'error': 'Le mot de passe doit contenir au moins 6 caractères'}), 400
    
    now = datetime.utcnow()
    
    # 1) Essayer d'abord la table password_resets (recommandé)
    try:
        pr = execute_query(
            """SELECT pr.id, pr.expires_at, pr.used, pr.user_id 
               FROM password_resets pr
               WHERE pr.token = %s 
               ORDER BY pr.created_at DESC 
               LIMIT 1""",
            (token,),
            fetch_one=True
        )
    except Exception as e:
        print(f"Erreur password_resets: {e}")
        pr = None
    
    if pr:
        # Vérifier si le token est déjà utilisé
        if pr.get('used'):
            return jsonify({'error': 'Ce lien a déjà été utilisé'}), 400
        
        # Vérifier l'expiration
        expires_at = pr.get('expires_at')
        if expires_at and expires_at < now:
            return jsonify({'error': 'Ce lien a expiré. Demandez un nouveau lien de réinitialisation'}), 400
        
        # Récupérer l'utilisateur
        user = execute_query(
            "SELECT id, email FROM users WHERE id = %s",
            (pr['user_id'],),
            fetch_one=True
        )
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Hasher le nouveau mot de passe
        new_hash = hash_password(new_password)
        
        # Mettre à jour le mot de passe
        execute_query(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (new_hash, user['id']),
            commit=True
        )
        
        # Marquer le token comme utilisé
        execute_query(
            "UPDATE password_resets SET used = 1 WHERE id = %s",
            (pr['id'],),
            commit=True
        )
        
        return jsonify({
            'message': 'Mot de passe réinitialisé avec succès',
            'email': user['email']
        }), 200
    
    # 2) Fallback: essayer les champs reset_token dans la table users
    try:
        ur = execute_query(
            "SELECT id, email, reset_token, reset_token_expiry FROM users WHERE reset_token = %s",
            (token,),
            fetch_one=True
        )
    except Exception as e:
        print(f"Erreur users.reset_token: {e}")
        ur = None
    
    if ur and ur.get('reset_token'):
        # Vérifier l'expiration
        expiry = ur.get('reset_token_expiry')
        if expiry and expiry < now:
            return jsonify({'error': 'Ce lien a expiré. Demandez un nouveau lien de réinitialisation'}), 400
        
        # Hasher le nouveau mot de passe
        new_hash = hash_password(new_password)
        
        # Mettre à jour le mot de passe et supprimer le token
        execute_query(
            "UPDATE users SET password_hash = %s, reset_token = NULL, reset_token_expiry = NULL WHERE id = %s",
            (new_hash, ur['id']),
            commit=True
        )
        
        return jsonify({
            'message': 'Mot de passe réinitialisé avec succès',
            'email': ur['email']
        }), 200
    
    # Si aucun token valide n'a été trouvé
    return jsonify({'error': 'Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation'}), 400


@bp.route('/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """Verify if a password reset token is valid."""
    data = request.get_json() or {}
    token = data.get('token', '').strip()
    
    if not token:
        return jsonify({'error': 'Token is required'}), 400
    
    now = datetime.utcnow()
    
    # 1) Check in password_resets table
    try:
        pr = execute_query(
            """SELECT pr.expires_at, pr.used 
               FROM password_resets pr
               WHERE pr.token = %s 
               ORDER BY pr.created_at DESC 
               LIMIT 1""",
            (token,),
            fetch_one=True
        )
    except Exception as e:
        print(f"Erreur password_resets: {e}")
        pr = None
    
    if pr:
        if pr.get('used'):
            return jsonify({'error': 'This link has already been used'}), 400
        
        expires_at = pr.get('expires_at')
        if expires_at and expires_at < now:
            return jsonify({'error': 'This link has expired'}), 400
        
        return jsonify({'message': 'Token is valid'}), 200
    
    # 2) Fallback: check in users.reset_token
    try:
        ur = execute_query(
            "SELECT reset_token_expiry FROM users WHERE reset_token = %s",
            (token,),
            fetch_one=True
        )
    except Exception as e:
        print(f"Erreur users.reset_token: {e}")
        ur = None
    
    if ur and ur.get('reset_token_expiry'):
        expiry = ur.get('reset_token_expiry')
        if expiry and expiry < now:
            return jsonify({'error': 'This link has expired'}), 400
        
        return jsonify({'message': 'Token is valid'}), 200
    
    return jsonify({'error': 'Invalid or expired token'}), 400