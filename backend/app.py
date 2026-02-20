from utils.cache import cache
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes import auth, appointements,products, categories, cart, orders, flash_sales, banners, vouchers, admin, user, factures, stock,loyalty,visits,payments, jobs, contacts

app = Flask(__name__)
app.config.from_object(Config)
cache.init_app(app)


# CORSssss
"""CORS(app, resources={
    r"/api/*": {
        "origins": Config.CORS_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})"""

#CORS(app)
# Blueprints tests
app.register_blueprint(auth.bp, url_prefix='/api/auth')
app.register_blueprint(products.bp, url_prefix='/api/products')
app.register_blueprint(categories.bp, url_prefix='/api/categories')
app.register_blueprint(cart.bp, url_prefix='/api/cart')
app.register_blueprint(orders.bp, url_prefix='/api/orders')
app.register_blueprint(flash_sales.bp, url_prefix='/api/flash-sales')
app.register_blueprint(banners.bp, url_prefix='/api/banners')
app.register_blueprint(vouchers.bp, url_prefix='/api/vouchers')
app.register_blueprint(admin.bp, url_prefix='/api/admin')
app.register_blueprint(user.bp, url_prefix='/api/user')
app.register_blueprint(factures.factures_bp, url_prefix='/api/factures')
app.register_blueprint(stock.bp, url_prefix='/api/stock')
app.register_blueprint(loyalty.bp, url_prefix='/api/loyalty')
app.register_blueprint(visits.bp, url_prefix='/api/visits')
app.register_blueprint(payments.bp, url_prefix='/api/payments')
app.register_blueprint(jobs.bp, url_prefix='/api/jobs')
app.register_blueprint(contacts.bp, url_prefix='/api/contacts')
app.register_blueprint(appointements.bp, url_prefix='/api')
import os
from flask import send_from_directory

@app.route('/api/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(os.path.join(app.root_path, 'uploads'), filename)


# Health check
@app.route('/api/health')
def health_check():
    return jsonify({'status': 'ok', 'message': 'Phone Shop API is running'})

# Error handlers test
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'Le fichier est trop volumineux. La limite est de 16 Mo.'}), 413

if __name__ == '__main__':
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
"""

CREATE TABLE job_applications (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    desired_position VARCHAR(255) NOT NULL,
    cv_filename VARCHAR(255) NOT NULL,
    cv_path VARCHAR(500) NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE appointments (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    user_name VARCHAR(255) NOT NULL,
    user_phone VARCHAR(20) NOT NULL,
    service ENUM('facial_care', 'pedicure', 'manicure', 'massage', 'other') NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_appointment (appointment_date, appointment_time),
    INDEX idx_date_time (appointment_date, appointment_time),
    INDEX idx_user_phone (user_phone),
    INDEX idx_status (status)
);

-- Services prédéfinis (optionnel)
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 60,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO services (name, description, duration_minutes, price) VALUES
('Soins du visage', 'Nettoyage profond + masque hydratant', 45, 15000),
('Pédicure', 'Soin complet des pieds + vernis', 60, 12000),
('Manucure', 'Soin des mains + pose vernis', 45, 10000),
('Massage relaxant', 'Massage corps complet 60min', 60, 25000),
('Massage dos', 'Massage ciblé dos/cervicales', 30, 15000);

"""