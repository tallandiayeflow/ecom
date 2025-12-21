from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import token_required
from datetime import datetime, date
import uuid

bp = Blueprint('appointments', __name__)

SERVICES = {
    'facial_care': 'Soins du visage',
    'pedicure': 'Pédicure', 
    'manicure': 'Manucure',
    'massage': 'Massage relaxant',
    'other': 'Autre soin'
}

# ✅ FONCTION CONVERSION TIMEDELTA → STRING
def format_time(time_obj):
    """Convertit TIME MySQL (timedelta/datetime.time) → HH:MM"""
    if isinstance(time_obj, (tuple, list)):
        time_obj = time_obj[0]
    if hasattr(time_obj, 'total_seconds'):
        # timedelta
        total_seconds = int(time_obj.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        return f"{hours:02d}:{minutes:02d}"
    elif isinstance(time_obj, datetime.time):
        return f"{time_obj.hour:02d}:{time_obj.minute:02d}"
    else:
        return str(time_obj)[:5]

@bp.route('/appointments/book', methods=['POST'])
def book_appointment():
    data = request.get_json()
    required = ['user_name', 'user_phone', 'service', 'appointment_date', 'appointment_time']
    if not all(data.get(field) for field in required):
        return jsonify({'error': 'Champs requis manquants'}), 400
    
    user_name = data['user_name'].strip()
    user_phone = data['user_phone'].strip()
    service_key = data['service']
    service_name = SERVICES.get(service_key, 'Autre soin')
    appointment_date = data['appointment_date']
    appointment_time = data['appointment_time'] + ':00'  # MySQL TIME format
    notes = data.get('notes', '').strip()
    
    try:
        date_obj = datetime.strptime(appointment_date, '%Y-%m-%d').date()
        time_obj = datetime.strptime(appointment_time, '%H:%M:%S').time()
        if date_obj < date.today() or time_obj.hour < 9 or time_obj.hour >= 19:
            return jsonify({'error': 'Date/heure invalide (9h-19h)'}), 400
    except ValueError:
        return jsonify({'error': 'Format invalide'}), 400
    
    existing = execute_query(
        "SELECT id FROM appointments WHERE appointment_date = %s AND appointment_time = %s AND status != 'cancelled'",
        (appointment_date, appointment_time),
        fetch_one=True
    )
    
    if existing:
        return jsonify({'error': 'Créneau déjà pris'}), 409
    
    appointment_id = str(uuid.uuid4())
    execute_query(
        """INSERT INTO appointments 
        (id, user_name, user_phone, service, service_name, appointment_date, appointment_time, notes, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')""",
        (appointment_id, user_name, user_phone, service_key, service_name, appointment_date, appointment_time, notes),
        commit=True
    )
    
    return jsonify({
        'message': '✅ RDV réservé !',
        'appointment_id': appointment_id,
        'details': {'service': service_name, 'date': appointment_date, 'time': data['appointment_time']}
    }), 201

@bp.route('/appointments/public', methods=['GET'])
def get_public_slots():
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Date requise'}), 400
    
    available_slots = []
    for hour in range(9, 19):
        for minute in [0, 30]:
            time_slot = f"{hour:02d}:{minute:02d}:00"
            taken = execute_query(
                "SELECT COUNT(*) as count FROM appointments WHERE appointment_date = %s AND appointment_time = %s AND status != 'cancelled'",
                (date_str, time_slot),
                fetch_one=True
            )
            if not taken or taken['count'] == 0:
                available_slots.append(f"{hour:02d}:{minute:02d}")
    
    return jsonify({'date': date_str, 'available_slots': available_slots})

@bp.route('/appointments/my', methods=['GET'])
@token_required
def get_user_appointments(current_user):
    user_phone = current_user.get('phone', '')
    appointments = execute_query(
        """SELECT id, service_name, appointment_date, appointment_time, 
                  status, notes, created_at
           FROM appointments WHERE user_phone = %s ORDER BY appointment_date DESC, appointment_time DESC""",
        (user_phone,),
        fetch_all=True
    )
    
    # ✅ Conversion côté Python
    for apt in appointments:
        apt['appointment_time'] = format_time(apt['appointment_time'])
        apt['created_at'] = apt['created_at'].strftime('%d/%m/%Y %H:%M') if hasattr(apt['created_at'], 'strftime') else str(apt['created_at'])
    
    return jsonify({'appointments': appointments or []})

@bp.route('/admin/appointments', methods=['GET'])
@token_required
def get_admin_appointments(current_user):
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    status = request.args.get('status')
    date_str = request.args.get('date')
    search = request.args.get('search', '')
    
    offset = (page - 1) * limit
    
    # ✅ Query SIMPLE sans TIME_FORMAT
    base_query = """
        SELECT id, user_name, user_phone, service_name, 
               appointment_date, appointment_time, 
               status, notes, created_at
        FROM appointments
    """
    
    params = []
    conditions = []
    
    if status:
        conditions.append("status = %s")
        params.append(status)
    if date_str:
        conditions.append("appointment_date = %s")
        params.append(date_str)
    if search:
        conditions.append("(user_name LIKE %s OR user_phone LIKE %s OR service_name LIKE %s)")
        params.extend([f"%{search}%"] * 3)
    
    if conditions:
        base_query += " WHERE " + " AND ".join(conditions)
    
    query = base_query + " ORDER BY appointment_date DESC, appointment_time ASC LIMIT %s OFFSET %s"
    
    appointments = execute_query(query, params + [limit, offset], fetch_all=True)
    
    # ✅ CONVERSION 100% PYTHON - AUCUN timedelta !
    for apt in appointments:
        apt['appointment_time'] = format_time(apt['appointment_time'])
        if hasattr(apt['created_at'], 'strftime'):
            apt['created_at'] = apt['created_at'].strftime('%Y-%m-%d %H:%M')
    
    # Total
    total_query = f"SELECT COUNT(*) as total FROM ({base_query}) as subquery"
    total_result = execute_query(total_query, params, fetch_one=True)
    total = total_result['total'] if total_result else 0
    
    return jsonify({
        'appointments': appointments or [],
        'total': total,
        'page': page,
        'limit': limit,
        'totalPages': (total + limit - 1) // limit
    })

@bp.route('/admin/appointments/<appointment_id>/status', methods=['PUT'])
@token_required
def update_appointment_status(current_user, appointment_id):
    data = request.get_json()
    new_status = data.get('status')
    notes = data.get('notes', '')
    
    if new_status not in ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']:
        return jsonify({'error': 'Statut invalide'}), 400
    
    apt = execute_query("SELECT id FROM appointments WHERE id = %s", (appointment_id,), fetch_one=True)
    if not apt:
        return jsonify({'error': 'RDV non trouvé'}), 404
    
    execute_query(
        "UPDATE appointments SET status = %s, notes = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
        (new_status, notes, appointment_id),
        commit=True
    )
    
    return jsonify({'message': f'Statut mis à jour: {new_status}'})

@bp.route('/admin/appointments/<appointment_id>', methods=['DELETE'])
@token_required
def delete_appointment(current_user, appointment_id):
    apt = execute_query("SELECT id FROM appointments WHERE id = %s", (appointment_id,), fetch_one=True)
    if not apt:
        return jsonify({'error': 'RDV non trouvé'}), 404
    
    execute_query("DELETE FROM appointments WHERE id = %s", (appointment_id,), commit=True)
    return jsonify({'message': 'RDV supprimé'})

@bp.route('/admin/appointments/stats', methods=['GET'])
@token_required
def get_appointments_stats(current_user):
    stats = execute_query("""
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
            COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show
        FROM appointments
    """, fetch_one=True)
    return jsonify(stats or {})
