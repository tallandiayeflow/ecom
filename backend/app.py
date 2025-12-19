from utils.cache import cache
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes import auth, products, categories, cart, orders, flash_sales, banners, vouchers, admin, user, factures, stock,loyalty,visits,payments

app = Flask(__name__)
app.config.from_object(Config)
cache.init_app(app)


# CORSssss
"""
CORS(app, resources={
    r"/api/*": {
        "origins": Config.CORS_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

Set up CORS with specific configuration for API routes."""

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

if __name__ == '__main__':
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)