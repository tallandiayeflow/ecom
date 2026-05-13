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
    """Get all categories with hierarchical structure"""
    try:
        rows = execute_query(
            """SELECT c.id, c.name, c.slug, c.icon, c.parent_id,
                  CASE
                      WHEN c.parent_id IS NULL THEN
                          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id)
                      ELSE
                          (SELECT COUNT(*) FROM product_subcategories ps WHERE ps.subcategory_id = c.id)
                  END as product_count
               FROM categories c
               ORDER BY c.parent_id IS NOT NULL, c.name""",
            fetch_all=True
        )

        sub_map = {}
        root_list = []

        for c in rows:
            entry = {
                'id': c['id'],
                'name': c['name'],
                'slug': c['slug'],
                'icon': c['icon'],
                'productCount': c['product_count'],
                'parentId': c['parent_id'],
            }
            if c['parent_id']:
                sub_map.setdefault(c['parent_id'], []).append(entry)
            else:
                root_list.append(entry)

        for cat in root_list:
            cat['subcategories'] = sub_map.get(cat['id'], [])

        return jsonify(root_list), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('', methods=['POST'])
@admin_required
def create_category(current_user):
    """Create a new category or subcategory (admin only)"""
    try:
        data = request.get_json()

        name = data.get('name', '').strip()
        if not name:
            return jsonify({'error': 'Le nom est requis'}), 400

        icon = data.get('icon', 'Folder')
        parent_id = data.get('parent_id') or None

        if parent_id:
            parent = execute_query(
                "SELECT id FROM categories WHERE id = %s AND parent_id IS NULL",
                (parent_id,),
                fetch_one=True
            )
            if not parent:
                return jsonify({'error': 'Catégorie parente invalide'}), 400

        base_slug = generate_slug(name)
        unique_slug = ensure_unique_slug(base_slug)
        category_id = str(uuid.uuid4())

        execute_query(
            "INSERT INTO categories (id, name, slug, icon, parent_id) VALUES (%s, %s, %s, %s, %s)",
            (category_id, name, unique_slug, icon, parent_id),
            commit=True
        )

        return jsonify({
            'id': category_id,
            'message': 'Catégorie créée avec succès',
            'category': {
                'id': category_id,
                'name': name,
                'slug': unique_slug,
                'icon': icon,
                'parentId': parent_id
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
        name = (data.get('name') or '').strip() or category.get('name', '')
        icon = data.get('icon', category.get('icon'))
        
        if not name:
            return jsonify({'error': 'Le nom est requis'}), 400
        
        # 🔥 Générer un nouveau slug si le nom change
        if name != category['name']:
            base_slug = generate_slug(name)
            unique_slug = ensure_unique_slug(base_slug, exclude_id=category_id)
        else:
            # Garder le slug existant si le nom ne change pas
            unique_slug = category['slug']
        
        if 'parent_id' in data:
            parent_id = data['parent_id'] or None
        else:
            parent_id = category.get('parent_id')

        if parent_id is not None:
            if parent_id == category_id:
                return jsonify({'error': 'Une catégorie ne peut pas être sa propre parente'}), 400
            parent = execute_query(
                "SELECT id FROM categories WHERE id = %s AND parent_id IS NULL",
                (parent_id,),
                fetch_one=True
            )
            if not parent:
                return jsonify({'error': 'Catégorie parente invalide'}), 400
            child_count = execute_query(
                "SELECT COUNT(*) as count FROM categories WHERE parent_id = %s",
                (category_id,),
                fetch_one=True
            )
            if child_count['count'] > 0:
                return jsonify({'error': 'Impossible de déplacer une catégorie qui a des sous-catégories'}), 400

        execute_query(
            "UPDATE categories SET name = %s, slug = %s, icon = %s, parent_id = %s WHERE id = %s",
            (name, unique_slug, icon, parent_id, category_id),
            commit=True
        )

        return jsonify({
            'message': 'Catégorie mise à jour avec succès',
            'category': {
                'id': category_id,
                'name': name,
                'slug': unique_slug,
                'icon': icon,
                'parentId': parent_id
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

        # Block delete if category has subcategories
        subcategory_count = execute_query(
            "SELECT COUNT(*) as count FROM categories WHERE parent_id = %s",
            (category_id,),
            fetch_one=True
        )
        if subcategory_count['count'] > 0:
            return jsonify({
                'error': f'Impossible de supprimer cette catégorie car elle a {subcategory_count["count"]} sous-catégorie(s)'
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
