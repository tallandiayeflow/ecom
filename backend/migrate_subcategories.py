import pymysql
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from config import Config


def run():
    print(f"Migrating: {Config.DATABASE_HOST}/{Config.DATABASE_NAME}")
    conn = None
    try:
        conn = pymysql.connect(
            host=Config.DATABASE_HOST,
            user=Config.DATABASE_USER,
            password=Config.DATABASE_PASSWORD,
            database=Config.DATABASE_NAME,
            port=Config.DATABASE_PORT
        )
        with conn.cursor() as cur:
            # --- categories: parent_id column ---
            cur.execute("SHOW COLUMNS FROM categories LIKE 'parent_id'")
            if not cur.fetchone():
                cur.execute("ALTER TABLE categories ADD COLUMN parent_id VARCHAR(36) NULL")
                print("parent_id column added to categories")
            else:
                print("parent_id already exists, skipping column")

            # --- categories: FK constraint (check independently — DDL auto-commits in MySQL) ---
            cur.execute(
                "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS "
                "WHERE CONSTRAINT_SCHEMA = %s AND TABLE_NAME = 'categories' "
                "AND CONSTRAINT_NAME = 'fk_category_parent'",
                (Config.DATABASE_NAME,)
            )
            if cur.fetchone()[0] == 0:
                cur.execute(
                    "ALTER TABLE categories ADD CONSTRAINT fk_category_parent "
                    "FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE"
                )
                print("FK constraint fk_category_parent added")
            else:
                print("FK constraint already exists, skipping")

            # --- categories: index on parent_id ---
            cur.execute(
                "SELECT COUNT(*) FROM information_schema.STATISTICS "
                "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'categories' AND INDEX_NAME = 'idx_parent'",
                (Config.DATABASE_NAME,)
            )
            if cur.fetchone()[0] == 0:
                cur.execute("ALTER TABLE categories ADD INDEX idx_parent (parent_id)")
                print("Index idx_parent added")
            else:
                print("Index idx_parent already exists, skipping")

            # --- product_subcategories table ---
            # Note: MySQL DDL statements (ALTER TABLE, CREATE TABLE) auto-commit implicitly.
            # conn.rollback() below cannot undo DDL that already executed.
            cur.execute("""
                CREATE TABLE IF NOT EXISTS product_subcategories (
                    product_id VARCHAR(36) NOT NULL,
                    subcategory_id VARCHAR(36) NOT NULL,
                    PRIMARY KEY (product_id, subcategory_id),
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            print("product_subcategories table created (or already exists)")

        conn.commit()
        print("Migration complete.")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Migration FAILED: {e}")
        raise
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    run()
