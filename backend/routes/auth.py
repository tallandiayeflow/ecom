from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import hash_password, verify_password, generate_token
import uuid
import random
import time

from twilio.rest import Client

bp = Blueprint('auth', __name__)

# Twilio configuration (à personnaliser avec vos identifiants)
TWILIO_ACCOUNT_SID = "YOUR_TWILIO_SID"
TWILIO_AUTH_TOKEN = "YOUR_TWILIO_AUTH_TOKEN"
TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'  # Twilio Sandbox WhatsApp Number

# Stockage des OTPs en mémoire pour simplicité (à remplacer par cache ou DB)
otp_store = {}

# Envoi OTP via Twilio WhatsApp
def send_whatsapp_otp(phone_number: str, otp_code: str):
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    message = client.messages.create(
        from_=TWILIO_WHATSAPP_NUMBER,
        body=f"Votre code OTP est : {otp_code}",
        to=f"whatsapp:{phone_number}"
    )
    return message.sid

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    
    if not email or not phone or not password or not name:
        return jsonify({'error': 'Email, téléphone, mot de passe et nom sont requis'}), 400
    
    existing_user = execute_query(
        "SELECT id FROM users WHERE email = %s OR phone = %s",
        (email, phone),
        fetch_one=True
    )
    
    if existing_user:
        return jsonify({'error': 'Email ou téléphone déjà utilisé'}), 409
    
    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    
    execute_query(
        "INSERT INTO users (id, email, phone, password_hash, name, role) VALUES (%s, %s, %s, %s, %s, %s)",
        (user_id, email, phone, password_hash, name, 'user'),
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
        "SELECT id, email, phone, password_hash, name, role, is_active, loyalty_points FROM users WHERE email = %s OR phone = %s",
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

@bp.route('/reset-password-otp', methods=['POST'])
def reset_password_otp():
    data = request.get_json()
    phone = data.get('phone', '').strip()
    if not phone:
        return jsonify({'error': 'Numéro de téléphone requis'}), 400

    user = execute_query("SELECT id FROM users WHERE phone = %s", (phone,), fetch_one=True)
    if not user:
        return jsonify({'error': 'Téléphone non enregistré'}), 404

    otp_code = str(random.randint(100000, 999999))
    otp_store[phone] = {'otp': otp_code, 'timestamp': time.time()}

    try:
        send_whatsapp_otp(phone, otp_code)
    except Exception as e:
        return jsonify({'error': 'Erreur envoi OTP'}), 500

    return jsonify({'message': 'OTP envoyé au numéro WhatsApp'}), 200

@bp.route('/verify-otp-reset-password', methods=['POST'])
def verify_otp_reset_password():
    data = request.get_json()
    phone = data.get('phone', '').strip()
    otp = data.get('otp', '').strip()
    new_password = data.get('new_password', '')

    if not phone or not otp or not new_password:
        return jsonify({'error': 'Téléphone, OTP, et nouveau mot de passe requis'}), 400

    record = otp_store.get(phone)
    if not record or record['otp'] != otp or time.time() - record['timestamp'] > 300:
        return jsonify({'error': 'OTP invalide ou expiré'}), 400

    password_hash = hash_password(new_password)
    user = execute_query("SELECT id FROM users WHERE phone = %s", (phone,), fetch_one=True)
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    execute_query("UPDATE users SET password_hash = %s WHERE id = %s", (password_hash, user['id']), commit=True)

    del otp_store[phone]  # Supprimer OTP utilisé

    return jsonify({'message': 'Mot de passe réinitialisé avec succès'}), 200
