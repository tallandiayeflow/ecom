# Backend Flask + MySQL - Phone Shop

## 📋 Prérequis

- Python 3.8+
- MySQL 8.0+
- pip (gestionnaire de paquets Python)

## 🚀 Installation

### 1. Installer les dépendances Python

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurer MySQL

Créez une base de données MySQL :

```sql
CREATE DATABASE phone_shop;
CREATE USER 'phone_shop_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON phone_shop.* TO 'phone_shop_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configuration de l'environnement

Créez un fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

Modifiez les valeurs dans `.env` :

```
DATABASE_HOST=localhost
DATABASE_USER=phone_shop_user
DATABASE_PASSWORD=votre_mot_de_passe
DATABASE_NAME=phone_shop
SECRET_KEY=votre_cle_secrete_tres_longue_et_aleatoire
JWT_SECRET_KEY=votre_cle_jwt_secrete
```

### 4. Initialiser la base de données

```bash
python init_db.py
```

Cette commande va créer toutes les tables nécessaires.

### 5. (Optionnel) Insérer des données de test

```bash
python seed_db.py
```

## 🏃 Lancement du serveur

### Mode développement

```bash
python app.py
```

Le serveur sera accessible sur `http://localhost:5000`

### Mode production (avec Gunicorn)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📁 Structure du projet

```
backend/
├── app.py                 # Point d'entrée de l'application
├── config.py             # Configuration de l'application
├── requirements.txt      # Dépendances Python
├── .env.example         # Exemple de configuration
├── init_db.py           # Script d'initialisation de la DB
├── seed_db.py           # Script de données de test
├── models/              # Modèles de données
│   ├── __init__.py
│   ├── user.py
│   ├── product.py
│   ├── category.py
│   ├── order.py
│   ├── cart.py
│   ├── flash_sale.py
│   ├── banner.py
│   └── voucher.py
├── routes/              # Routes API
│   ├── __init__.py
│   ├── auth.py
│   ├── products.py
│   ├── categories.py
│   ├── cart.py
│   ├── orders.py
│   ├── flash_sales.py
│   ├── banners.py
│   ├── vouchers.py
│   └── admin.py
└── utils/               # Utilitaires
    ├── __init__.py
    ├── auth.py          # Middleware d'authentification
    └── database.py      # Connexion à la base de données
```

## 🔌 Endpoints API

### Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/reset-password` - Réinitialisation du mot de passe
- `GET /api/auth/me` - Profil utilisateur (authentifié)

### Products
- `GET /api/products` - Liste des produits (avec filtres)
- `GET /api/products/:id` - Détail d'un produit
- `POST /api/products` - Créer un produit (admin)
- `PUT /api/products/:id` - Modifier un produit (admin)
- `DELETE /api/products/:id` - Supprimer un produit (admin)

### Categories
- `GET /api/categories` - Liste des catégories
- `POST /api/categories` - Créer une catégorie (admin)
- `PUT /api/categories/:id` - Modifier une catégorie (admin)
- `DELETE /api/categories/:id` - Supprimer une catégorie (admin)

### Cart
- `GET /api/cart` - Panier de l'utilisateur
- `POST /api/cart` - Ajouter au panier
- `PUT /api/cart/:productId` - Modifier quantité
- `DELETE /api/cart` - Vider le panier

### Orders
- `GET /api/orders` - Commandes de l'utilisateur
- `GET /api/orders/:id` - Détail d'une commande
- `POST /api/orders` - Créer une commande
- `PUT /api/orders/:id/status` - Modifier statut (admin)

### Flash Sales
- `GET /api/flash-sales` - Ventes flash actives
- `POST /api/flash-sales` - Créer une vente flash (admin)
- `DELETE /api/flash-sales/:id` - Supprimer une vente flash (admin)

### Banners
- `GET /api/banners` - Bannières actives
- `POST /api/banners` - Créer une bannière (admin)
- `DELETE /api/banners/:id` - Supprimer une bannière (admin)

### Vouchers
- `GET /api/vouchers` - Bons de réduction disponibles
- `POST /api/vouchers` - Générer un bon (admin)
- `POST /api/vouchers/validate` - Valider un code promo

## 🔒 Sécurité

- Authentification JWT
- Hash des mots de passe avec bcrypt
- Protection CORS
- Validation des données avec Flask-Validator
- Protection contre les injections SQL (parameterized queries)

## 🔗 Intégration avec le Frontend

Dans votre frontend React, modifiez `src/lib/api.ts` pour pointer vers le backend :

```typescript
const API_BASE_URL = 'http://localhost:5000/api';

// Exemple pour la fonction login
export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return response.json();
};
```

## 🐛 Dépannage

### Erreur de connexion MySQL
- Vérifiez que MySQL est bien démarré
- Vérifiez les credentials dans `.env`
- Vérifiez que l'utilisateur a les bonnes permissions

### Erreur de CORS
- Ajustez `CORS_ORIGINS` dans `config.py` pour inclure votre frontend

### Port déjà utilisé
- Changez le port dans `app.py` ou arrêtez le processus utilisant le port 5000

## 📝 Notes importantes

1. **Ne commitez JAMAIS le fichier `.env`** - il contient des informations sensibles
2. Changez les clés secrètes avant de passer en production
3. Utilisez HTTPS en production
4. Configurez des sauvegardes régulières de la base de données
5. Limitez les requêtes API (rate limiting) en production

## 📚 Documentation supplémentaire

- [Flask Documentation](https://flask.palletsprojects.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [JWT Authentication](https://jwt.io/)
