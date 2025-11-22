from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required, token_required
from datetime import datetime

bp = Blueprint('visit', __name__)

# Enregistrer une visite utilisateur (login utilisateur)
@bp.route('', methods=['POST'])
@token_required
def register_visit(current_user):
    try:
        user_id = current_user['user_id']
        phone = current_user.get('phone')

        execute_query(
            "INSERT INTO user_visits (user_id, visit_date, phone) VALUES (%s, NOW(), %s)",
            (user_id, phone),
            commit=True
        )
        return jsonify({"message": "Visite enregistrée avec téléphone"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Validation manuelle avec enregistrement du téléphone d’après l’utilisateur trouvé par code
@bp.route('/validate', methods=['POST'])
@admin_required
def validate_visit_by_code(current_user):
    data = request.get_json()
    user_code = data.get('user_code')

    if not user_code or len(user_code) != 8:
        return jsonify({"error": "Le code utilisateur doit contenir exactement 8 caractères."}), 400

    user = execute_query("SELECT id, phone FROM users WHERE code = %s", (user_code,), fetch_one=True)
    if not user:
        return jsonify({"error": "Utilisateur non trouvé pour ce code."}), 404

    try:
        execute_query(
            "INSERT INTO user_visits (user_id, visit_date, phone) VALUES (%s, NOW(), %s)",
            (user['id'], user['phone']),
            commit=True
        )
        return jsonify({"message": f"Visite enregistrée pour utilisateur {user_code} avec téléphone."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Récupérer les visites avec filtres (admin)
@bp.route('', methods=['GET'])
@admin_required
def get_visits(current_user):
    user_id = request.args.get('user_id')
    date_min = request.args.get('date_min')
    date_max = request.args.get('date_max')

    query = """
        SELECT uv.id, uv.user_id, u.name, uv.phone, uv.visit_date
        FROM user_visits uv
        JOIN users u ON uv.user_id = u.id
        WHERE 1=1
    """
    params = []

    if user_id:
        query += " AND uv.user_id = %s"
        params.append(user_id)

    if date_min:
        query += " AND uv.visit_date >= %s"
        params.append(date_min)

    if date_max:
        query += " AND uv.visit_date <= %s"
        params.append(date_max)

    query += " ORDER BY uv.visit_date DESC"

    try:
        visits = execute_query(query, params, fetch_all=True)
        return jsonify(visits), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Export CSV des visites filtrées (admin)
@bp.route('/export', methods=['GET'])
@admin_required
def export_visits(current_user):
    import io
    import csv
    from flask import Response

    user_id = request.args.get('user_id')
    date_min = request.args.get('date_min')
    date_max = request.args.get('date_max')

    query = """
        SELECT uv.id, uv.user_id, u.name, uv.phone, uv.visit_date
        FROM user_visits uv
        JOIN users u ON uv.user_id = u.id
        WHERE 1=1
    """
    params = []

    if user_id:
        query += " AND uv.user_id = %s"
        params.append(user_id)

    if date_min:
        query += " AND uv.visit_date >= %s"
        params.append(date_min)

    if date_max:
        query += " AND uv.visit_date <= %s"
        params.append(date_max)

    query += " ORDER BY uv.visit_date DESC"

    try:
        visits = execute_query(query, params, fetch_all=True)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'User ID', 'User Name', 'Phone', 'Visit Date'])
        for visit in visits:
            visit_date_str = visit['visit_date'].strftime("%Y-%m-%d %H:%M:%S") if visit['visit_date'] else ""
            writer.writerow([visit['id'], visit['user_id'], visit['name'], visit.get('phone', ''), visit_date_str])

        response = Response(output.getvalue(), mimetype="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=visits_report.csv"
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Statistiques globales des visites (admin)
@bp.route('/stats', methods=['GET'])
@admin_required
def visits_stats(current_user):
    try:
        total_visits = execute_query("SELECT COUNT(*) AS count FROM user_visits", fetch_one=True)['count']
        from datetime import date
        today_str = date.today().strftime("%Y-%m-%d")
        today_visits = execute_query(
            "SELECT COUNT(*) AS count FROM user_visits WHERE visit_date >= %s",
            (today_str + " 00:00:00",),
            fetch_one=True)['count']

        return jsonify({
            "total_visits": total_visits,
            "today_visits": today_visits
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
