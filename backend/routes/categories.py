from flask import Blueprint, request, jsonify
from utils.database import execute_query
from utils.auth import admin_required
import uuid
import re
import unicodedata


bp = Blueprint('categories', __name__)


def generate_slug(name):
    """
    Génère un slug URL-friendly à partir du nom
    Exemples:
        "Smartphones" -> "smartphones"
        "Tablettes & iPad" -> "tablettes-ipad"
        "Écouteurs Bluetooth" -> "ecouteurs-bluetooth"
    """
    # Normaliser Unicode et supprimer les accents
    slug = unicodedata.normalize('NFKD', name)
    slug = slug.encode('ascii', 'ignore').decode('ascii')
    
    # Convertir en minuscules
    slug = slug.lower().strip()
    
    # Remplacer les espaces et caractères spéciaux par des tirets
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    
    # Supprimer les tirets en début/fin
    slug = slug.strip('-')
    
    return slug


def ensure_unique_slug(base_slug, exclude_id=None):
    """
    S'assure que le slug est unique en ajoutant un numéro si nécessaire
    Exemples:
        "smartphones" -> "smartphones"
        "smartphones" (déjà existant) -> "smartphones-1"
        "smartphones-1" (déjà existant) -> "smartphones-2"
    """
    slug = base_slug
    counter = 1
    
    while True:
        # Vérifier si le slug existe déjà (en excluant l'ID actuel pour les updates)
        if exclude_id:
            existing = execute_query(
                "SELECT id FROM categories WHERE slug = %s AND id != %s",
                (slug, exclude_id),
                fetch_one=True
            )
        else:
            existing = execute_query(
                "SELECT id FROM categories WHERE slug = %s",
                (slug,),
                fetch_one=True
            )
        
        # Si le slug n'existe pas, on peut l'utiliser
        if not existing:
            return slug
        
        # Sinon, ajouter un numéro et réessayer
        slug = f"{base_slug}-{counter}"
        counter += 1


@bp.route('', methods=['GET'])
def get_categories():
    """Get all categories with product count"""
    try:
        categories = execute_query(
            """SELECT c.*, COUNT(p.id) as product_count
               FROM categories c
               LEFT JOIN products p ON c.id = p.category_id
               GROUP BY c.id
               ORDER BY c.name""",
            fetch_all=True
        )
        
        formatted_categories = [{
            'id': c['id'],
            'name': c['name'],
            'slug': c['slug'],
            'icon': c['icon'],
            'productCount': c['product_count']
        } for c in categories]
        
        return jsonify(formatted_categories), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('', methods=['POST'])
@admin_required
def create_category(current_user):
    """Create a new category (admin only)"""
    try:
        data = request.get_json()
        
        # Validation
        name = data.get('name', '').strip()
        if not name:
            return jsonify({'error': 'Le nom est requis'}), 400
        
        icon = data.get('icon', 'Folder')
        
        # 🔥 Générer un slug unique automatiquement
        base_slug = generate_slug(name)
        unique_slug = ensure_unique_slug(base_slug)
        
        # Générer un ID unique
        category_id = str(uuid.uuid4())
        
        # Insérer la catégorie
        execute_query(
            "INSERT INTO categories (id, name, slug, icon) VALUES (%s, %s, %s, %s)",
            (category_id, name, unique_slug, icon),
            commit=True
        )
        
        return jsonify({
            'id': category_id,
            'message': 'Catégorie créée avec succès',
            'category': {
                'id': category_id,
                'name': name,
                'slug': unique_slug,
                'icon': icon
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<category_id>', methods=['PUT'])
@admin_required
def update_category(current_user, category_id):
    """Update a category (admin only)"""
    try:
        data = request.get_json()
        
        # Vérifier que la catégorie existe
        category = execute_query(
            "SELECT * FROM categories WHERE id = %s",
            (category_id,),
            fetch_one=True
        )
        
        if not category:
            return jsonify({'error': 'Catégorie non trouvée'}), 404
        
        # Récupérer les nouvelles valeurs
        name = data.get('name', '').strip()
        icon = data.get('icon')
        
        if not name:
            return jsonify({'error': 'Le nom est requis'}), 400
        
        # 🔥 Générer un nouveau slug si le nom change
        if name != category['name']:
            base_slug = generate_slug(name)
            unique_slug = ensure_unique_slug(base_slug, exclude_id=category_id)
        else:
            # Garder le slug existant si le nom ne change pas
            unique_slug = category['slug']
        
        # Mettre à jour la catégorie
        execute_query(
            "UPDATE categories SET name = %s, slug = %s, icon = %s WHERE id = %s",
            (name, unique_slug, icon, category_id),
            commit=True
        )
        
        return jsonify({
            'message': 'Catégorie mise à jour avec succès',
            'category': {
                'id': category_id,
                'name': name,
                'slug': unique_slug,
                'icon': icon
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<category_id>', methods=['DELETE'])
@admin_required
def delete_category(current_user, category_id):
    """Delete a category (admin only)"""
    try:
        # Vérifier que la catégorie existe
        category = execute_query(
            "SELECT * FROM categories WHERE id = %s",
            (category_id,),
            fetch_one=True
        )
        
        if not category:
            return jsonify({'error': 'Catégorie non trouvée'}), 404
        
        # Vérifier qu'elle n'a pas de produits associés
        product_count = execute_query(
            "SELECT COUNT(*) as count FROM products WHERE category_id = %s",
            (category_id,),
            fetch_one=True
        )
        
        if product_count['count'] > 0:
            return jsonify({
                'error': f'Impossible de supprimer cette catégorie car elle contient {product_count["count"]} produit(s)'
            }), 400
        
        # Supprimer la catégorie
        execute_query(
            "DELETE FROM categories WHERE id = %s",
            (category_id,),
            commit=True
        )
        
        return jsonify({'message': 'Catégorie supprimée avec succès'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
