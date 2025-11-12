import pymysql
from config import Config
from utils.auth import hash_password
import uuid
from datetime import datetime, timedelta
import json

def seed_database():
    """Seed the database with sample data"""
    connection = pymysql.connect(
        host=Config.DATABASE_HOST,
        user=Config.DATABASE_USER,
        password=Config.DATABASE_PASSWORD,
        database=Config.DATABASE_NAME,
        port=Config.DATABASE_PORT
    )
    
    try:
        with connection.cursor() as cursor:
            print("🌱 Seeding database...")
            
            # Create admin user
            admin_id = str(uuid.uuid4())
            admin_password = hash_password('admin123')
            cursor.execute(
                """INSERT INTO users (id, email, password_hash, name, role, loyalty_points)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (admin_id, 'admin@phoneshop.com', admin_password, 'Admin User', 'admin', 1000)
            )
            print("✅ Admin user created (admin@phoneshop.com / admin123)")
            
            # Create test user
            user_id = str(uuid.uuid4())
            user_password = hash_password('user123')
            cursor.execute(
                """INSERT INTO users (id, email, password_hash, name, role, loyalty_points)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (user_id, 'user@example.com', user_password, 'Test User', 'user', 500)
            )
            print("✅ Test user created (user@example.com / user123)")
            
            # Create categories
            categories = [
                ('smartphones', 'Smartphones', 'Smartphone'),
                ('accessories', 'Accessoires', 'Headphones'),
                ('tablets', 'Tablettes', 'Tablet'),
                ('smartwatches', 'Montres connectées', 'Watch')
            ]
            
            category_ids = {}
            for slug, name, icon in categories:
                cat_id = str(uuid.uuid4())
                category_ids[slug] = cat_id
                cursor.execute(
                    "INSERT INTO categories (id, name, slug, icon) VALUES (%s, %s, %s, %s)",
                    (cat_id, name, slug, icon)
                )
            print(f"✅ Created {len(categories)} categories")
            
            # Create products
            products = [
                {
                    'name': 'iPhone 15 Pro Max',
                    'description': 'Le dernier iPhone avec puce A17 Pro',
                    'price': 1199.99,
                    'category': 'smartphones',
                    'image': 'https://images.unsplash.com/photo-1696446702061-cbd8e7e14c9e',
                    'stock': 50,
                    'brand': 'Apple',
                    'rating': 4.8
                },
                {
                    'name': 'Samsung Galaxy S24 Ultra',
                    'description': 'Smartphone flagship avec S Pen',
                    'price': 1099.99,
                    'category': 'smartphones',
                    'image': 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c',
                    'stock': 35,
                    'brand': 'Samsung',
                    'rating': 4.7
                },
                {
                    'name': 'AirPods Pro 2',
                    'description': 'Écouteurs sans fil avec réduction de bruit',
                    'price': 249.99,
                    'category': 'accessories',
                    'image': 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7',
                    'stock': 100,
                    'brand': 'Apple',
                    'rating': 4.6
                },
                {
                    'name': 'iPad Air',
                    'description': 'Tablette puissante avec puce M1',
                    'price': 599.99,
                    'category': 'tablets',
                    'image': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0',
                    'stock': 25,
                    'brand': 'Apple',
                    'rating': 4.7
                },
                {
                    'name': 'Apple Watch Series 9',
                    'description': 'Montre connectée avec GPS',
                    'price': 429.99,
                    'category': 'smartwatches',
                    'image': 'https://images.unsplash.com/photo-1434493651957-6eb9bfbf6632',
                    'stock': 40,
                    'brand': 'Apple',
                    'rating': 4.5
                }
            ]
            
            product_ids = []
            for product in products:
                prod_id = str(uuid.uuid4())
                product_ids.append(prod_id)
                
                images = json.dumps([product['image']])
                specs = json.dumps({'brand': product['brand']})
                
                cursor.execute(
                    """INSERT INTO products 
                       (id, name, description, price, category_id, image_url, images, 
                        stock, rating, brand, specifications, is_featured)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (prod_id, product['name'], product['description'], product['price'],
                     category_ids[product['category']], product['image'], images,
                     product['stock'], product['rating'], product['brand'], specs, True)
                )
            print(f"✅ Created {len(products)} products")
            
            # Create flash sales
            if len(product_ids) >= 2:
                now = datetime.now()
                for i in range(2):
                    fs_id = str(uuid.uuid4())
                    cursor.execute(
                        """INSERT INTO flash_sales 
                           (id, product_id, original_price, sale_price, start_time, end_time, stock_limit)
                           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                        (fs_id, product_ids[i], products[i]['price'], 
                         products[i]['price'] * 0.8, now, now + timedelta(days=7), 20)
                    )
                print("✅ Created flash sales")
            
            # Create banners
            if len(product_ids) >= 3:
                for i in range(3):
                    banner_id = str(uuid.uuid4())
                    cursor.execute(
                        """INSERT INTO banners (id, product_id, title, subtitle, display_order)
                           VALUES (%s, %s, %s, %s, %s)""",
                        (banner_id, product_ids[i], products[i]['name'], 
                         'Offre spéciale', i)
                    )
                print("✅ Created banners")
            
            # Create vouchers
            vouchers = [
                ('WELCOME10', 'percentage', 10, 0, datetime.now(), datetime.now() + timedelta(days=30)),
                ('SAVE50', 'fixed', 50, 500, datetime.now(), datetime.now() + timedelta(days=60))
            ]
            
            for code, vtype, value, min_amount, valid_from, valid_until in vouchers:
                voucher_id = str(uuid.uuid4())
                cursor.execute(
                    """INSERT INTO vouchers 
                       (id, code, type, value, min_order_amount, max_uses, valid_from, valid_until)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (voucher_id, code, vtype, value, min_amount, 100, valid_from, valid_until)
                )
            print(f"✅ Created {len(vouchers)} vouchers")
            
            connection.commit()
            print("\n✨ Database seeded successfully!")
            print("\n📝 Login credentials:")
            print("   Admin: admin@phoneshop.com / admin123")
            print("   User:  user@example.com / user123")
            
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        connection.rollback()
    finally:
        connection.close()

if __name__ == '__main__':
    seed_database()
