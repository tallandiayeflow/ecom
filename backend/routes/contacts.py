from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
import uuid
from datetime import datetime

bp = Blueprint('contacts', __name__)

# --- Route Publique : Envoyer un message ---
@bp.route('', methods=['POST'])
def send_contact_message():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone', '')
    subject = data.get('subject', 'Demande de contact')
    message = data.get('message')

    if not name or not email or not message:
        return jsonify({'error': 'Nom, email et message sont requis'}), 400

    message_id = str(uuid.uuid4())
    
    try:
        execute_query(
            "INSERT INTO contacts (id, name, email, phone, subject, message) VALUES (%s, %s, %s, %s, %s, %s)",
            (message_id, name, email, phone, subject, message),
            commit=True
        )
    except Exception as e:
        print(f"Erreur insertion contact : {e}")
        return jsonify({'error': 'Erreur lors de l\'envoi du message'}), 500

    return jsonify({'message': 'Message envoyé avec succès !'}), 201

# --- Routes Admin ---
@bp.route('/admin', methods=['GET'])
@admin_required
def list_contact_messages(current_user):
    messages = execute_query(
        "SELECT * FROM contacts ORDER BY created_at DESC",
        fetch_all=True
    )
    # Formater les dates pour le JSON
    for msg in messages:
        if msg.get('created_at'):
            msg['created_at'] = msg['created_at'].isoformat()
            
    return jsonify(messages), 200

@bp.route('/admin/<message_id>/status', methods=['PUT'])
@admin_required
def update_message_status(current_user, message_id):
    data = request.get_json()
    status = data.get('status')
    
    if status not in ['new', 'read', 'replied']:
        return jsonify({'error': 'Statut invalide'}), 400
        
    execute_query(
        "UPDATE contacts SET status = %s WHERE id = %s",
        (status, message_id),
        commit=True
    )
    return jsonify({'message': 'Statut mis à jour'}), 200

@bp.route('/admin/<message_id>', methods=['DELETE'])
@admin_required
def delete_contact_message(current_user, message_id):
    execute_query("DELETE FROM contacts WHERE id = %s", (message_id,), commit=True)
    return jsonify({'message': 'Message supprimé'}), 200
