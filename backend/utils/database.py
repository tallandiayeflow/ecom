import pymysql
from config import Config

def get_db_connection():
    """Create and return a database connection"""
    return pymysql.connect(
        host=Config.DATABASE_HOST,
        user=Config.DATABASE_USER,
        password=Config.DATABASE_PASSWORD,
        database=Config.DATABASE_NAME,
        port=Config.DATABASE_PORT,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        connect_timeout=10,
        read_timeout=30,
        write_timeout=30,
    )

def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """
    Execute a database query - VERSION CORRIGÉE
    
    Args:
        query: SQL query string
        params: Query parameters (tuple or dict)
        fetch_one: Return single row
        fetch_all: Return all rows  
        commit: Commit the transaction
    
    Returns:
        Query result or lastrowid for INSERT
    """
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            
            # ✅ LOGIQUE FLAGS CORRIGÉE
            if fetch_one:
                result = cursor.fetchone()
            elif fetch_all:
                result = cursor.fetchall()
            elif commit:
                connection.commit()
                result = cursor.lastrowid
            else:
                # ✅ SELECT sans fetch → juste execute
                result = True
            
            return result
            
    except Exception as e:
        if connection:
            connection.rollback()
        raise e
    finally:
        if connection:
            connection.close()

# ✅ FONCTIONS UTILITAIRES SUPPLÉMENTAIRES
def execute_many(query, params_list):
    """Execute multiple queries"""
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.executemany(query, params_list)
            connection.commit()
            return cursor.rowcount
    except Exception as e:
        if connection:
            connection.rollback()
        raise e
    finally:
        if connection:
            connection.close()

def get_scalar(query, params=None):
    """Get single scalar value"""
    result = execute_query(query, params, fetch_one=True)
    return result[list(result.keys())[0]] if result else None

def table_exists(table_name):
    """Check if table exists"""
    count = get_scalar(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = %s", 
        (table_name,)
    )
    return count > 0
