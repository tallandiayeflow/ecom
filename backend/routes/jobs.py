from flask import Blueprint, request, jsonify, send_from_directory
from utils.database import execute_query  # ✅ execute_query
from utils.auth import token_required
import uuid
import os
from werkzeug.utils import secure_filename
import secrets

bp = Blueprint('jobs', __name__)

# Configuration upload
UPLOAD_FOLDER = 'uploads/cvs'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Vérifie si l'extension du fichier est autorisée"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/apply', methods=['POST'])
def apply_job():
    """Soumettre une candidature emploi - UNIQUEMENT si pas déjà candidat"""
    data = request.form
    full_name = data.get('full_name', '').strip()
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip().lower()
    desired_position = data.get('desired_position', '').strip()
    
    # Validation champs requis
    if not all([full_name, phone, email, desired_position]):
        return jsonify({'error': 'Tous les champs sont requis'}), 400
    
    # Vérifier doublon téléphone OU email
    existing = execute_query(
        "SELECT id FROM job_applications WHERE phone = %s OR email = %s", 
        (phone, email), 
        fetch_one=True
    )
    if existing:
        return jsonify({'error': 'Vous avez déjà soumis une candidature avec ce téléphone ou email'}), 409
    
    # Upload CV
    if 'cv' not in request.files:
        return jsonify({'error': 'CV requis'}), 400
    
    file = request.files['cv']
    if file.filename == '':
        return jsonify({'error': 'Aucun fichier CV sélectionné'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{secrets.token_urlsafe(8)}_{filename}"
        cv_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(cv_path)
        
        # Enregistrer candidature
        job_id = str(uuid.uuid4())
        execute_query(
            """INSERT INTO job_applications 
            (id, full_name, phone, email, desired_position, cv_filename, cv_path, status) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')""",
            (job_id, full_name, phone, email, desired_position, file.filename, cv_path),
            commit=True
        )
        
        return jsonify({
            'message': 'Candidature soumise avec succès ! En attente validation admin',
            'job_id': job_id
        }), 201
    else:
        return jsonify({'error': 'Format CV invalide (PDF, DOC, DOCX seulement)'}), 400

@bp.route('/admin/jobs', methods=['GET'])
@token_required
def get_all_jobs(current_user):
    """Admin: Lister toutes les candidatures"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    status_filter = request.args.get('status')
    search = request.args.get('search', '')
    
    offset = (page - 1) * limit
    
    where_clause = "WHERE 1=1"
    params = []
    
    if status_filter:
        where_clause += " AND status = %s"
        params.append(status_filter)
    if search:
        where_clause += " AND (full_name LIKE %s OR email LIKE %s OR phone LIKE %s OR desired_position LIKE %s)"
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term, search_term])
    
    # Récupérer les candidatures
    jobs_query = f"""
        SELECT id, full_name, phone, email, desired_position, 
               cv_filename, status, admin_notes, created_at 
        FROM job_applications {where_clause} 
        ORDER BY created_at DESC LIMIT %s OFFSET %s
    """
    jobs = execute_query(jobs_query, params + [limit, offset], fetch_all=True)
    
    # Compteur total
    count_query = f"SELECT COUNT(*) as total FROM job_applications {where_clause}"
    total_result = execute_query(count_query, params, fetch_all=True)
    total = total_result[0]['total'] if total_result else 0
    
    return jsonify({
        'jobs': jobs or [],
        'total': total,
        'page': page,
        'limit': limit,
        'totalPages': (total + limit - 1) // limit if limit > 0 else 0
    })

@bp.route('/admin/jobs/<job_id>/download', methods=['GET'])
@token_required
def download_cv(current_user, job_id):
    """Admin: Télécharger CV"""
    job = execute_query(
        "SELECT cv_path, cv_filename FROM job_applications WHERE id = %s", 
        (job_id,), 
        fetch_one=True
    )
    if not job:
        return jsonify({'error': 'Candidature non trouvée'}), 404
    
    cv_path, cv_filename = job['cv_path'], job['cv_filename']
    if not os.path.exists(cv_path):
        return jsonify({'error': 'Fichier CV introuvable'}), 404
    
    return send_from_directory(
        os.path.dirname(cv_path), 
        os.path.basename(cv_path), 
        as_attachment=True,
        download_name=cv_filename
    )

@bp.route('/admin/jobs/<job_id>/status', methods=['PUT'])
@token_required
def update_job_status(current_user, job_id):
    """Admin: Accepter/Refuser candidature"""
    data = request.get_json()
    new_status = data.get('status')  # 'accepted' ou 'rejected'
    admin_notes = data.get('admin_notes', '')
    
    if new_status not in ['accepted', 'rejected']:
        return jsonify({'error': 'Status invalide (accepted ou rejected)'}), 400
    
    # Vérifier existence et statut
    job = execute_query(
        "SELECT status FROM job_applications WHERE id = %s", 
        (job_id,), 
        fetch_one=True
    )
    if not job:
        return jsonify({'error': 'Candidature non trouvée'}), 404
    
    if job['status'] != 'pending':
        return jsonify({'error': 'Candidature déjà traitée'}), 400
    
    # Mise à jour
    execute_query(
        """UPDATE job_applications SET status = %s, admin_notes = %s, updated_at = NOW() 
        WHERE id = %s""",
        (new_status, admin_notes, job_id), 
        commit=True
    )
    
    return jsonify({'message': f'Candidature {new_status} avec succès'})

@bp.route('/admin/jobs/<job_id>', methods=['DELETE'])
@token_required
def delete_job(current_user, job_id):
    """Admin: Supprimer candidature"""
    job = execute_query(
        "SELECT cv_path FROM job_applications WHERE id = %s", 
        (job_id,), 
        fetch_one=True
    )
    if not job:
        return jsonify({'error': 'Candidature non trouvée'}), 404
    
    # Supprimer fichier CV
    cv_path = job['cv_path']
    try:
        if os.path.exists(cv_path):
            os.remove(cv_path)
    except Exception as e:
        print(f"Erreur suppression fichier: {e}")
    
    # Supprimer en base
    execute_query(
        "DELETE FROM job_applications WHERE id = %s", 
        (job_id,), 
        commit=True
    )
    
    return jsonify({'message': 'Candidature supprimée avec succès'})

@bp.route('/admin/jobs/stats', methods=['GET'])
@token_required
def get_jobs_stats(current_user):
    """Admin: Statistiques candidatures"""
    stats = execute_query("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM job_applications
    """, fetch_one=True)
    
    return jsonify({
        'total': stats['total'] if stats else 0,
        'pending': stats['pending'] if stats else 0,
        'accepted': stats['accepted'] if stats else 0,
        'rejected': stats['rejected'] if stats else 0
    })
