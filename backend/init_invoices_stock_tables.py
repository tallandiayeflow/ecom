import pymysql
from config import Config

def create_invoices_and_stock_tables():
    """Créer les tables invoices, invoice_items et stock_movements"""
    connection = pymysql.connect(
        host=Config.DATABASE_HOST,
        user=Config.DATABASE_USER,
        password=Config.DATABASE_PASSWORD,
        database=Config.DATABASE_NAME,
        port=Config.DATABASE_PORT
    )
    
    try:
        with connection.cursor() as cursor:
            # Table des factures
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS invoices (
                    id VARCHAR(36) PRIMARY KEY,
                    invoice_number VARCHAR(50) UNIQUE NOT NULL,
                    order_id VARCHAR(36) NOT NULL,
                    user_id VARCHAR(36) NOT NULL,
                    amount DECIMAL(10, 2) NOT NULL,
                    tax DECIMAL(10, 2) DEFAULT 0,
                    total DECIMAL(10, 2) NOT NULL,
                    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
                    payment_method VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    paid_at TIMESTAMP NULL,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_invoice_number (invoice_number),
                    INDEX idx_order (order_id),
                    INDEX idx_user (user_id),
                    INDEX idx_status (status),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Table des items de facture
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS invoice_items (
                    id VARCHAR(36) PRIMARY KEY,
                    invoice_id VARCHAR(36) NOT NULL,
                    product_name VARCHAR(255) NOT NULL,
                    quantity INT NOT NULL,
                    unit_price DECIMAL(10, 2) NOT NULL,
                    total_price DECIMAL(10, 2) NOT NULL,
                    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
                    INDEX idx_invoice (invoice_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # Table des mouvements de stock
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS stock_movements (
                    id VARCHAR(36) PRIMARY KEY,
                    product_id VARCHAR(36) NOT NULL,
                    quantity INT NOT NULL,
                    movement_type ENUM('in', 'out', 'adjustment', 'return') NOT NULL,
                    previous_stock INT NOT NULL,
                    new_stock INT NOT NULL,
                    reason TEXT,
                    user_id VARCHAR(36) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_product (product_id),
                    INDEX idx_user (user_id),
                    INDEX idx_type (movement_type),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            connection.commit()
            print("✅ Tables 'invoices', 'invoice_items' et 'stock_movements' créées avec succès!")
            
    except Exception as e:
        print(f"❌ Erreur lors de la création des tables: {e}")
        connection.rollback()
    finally:
        connection.close()

if __name__ == '__main__':
    print("🔨 Création des tables factures et stock...")
    create_invoices_and_stock_tables()
