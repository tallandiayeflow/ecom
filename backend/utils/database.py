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
        autocommit=False
    )

def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """
    Execute a database query
    
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
            
            if fetch_one:
                result = cursor.fetchone()
            elif fetch_all:
                result = cursor.fetchall()
            elif commit:
                connection.commit()
                result = cursor.lastrowid
            else:
                result = None
                
        return result
    except Exception as e:
        connection.rollback()
        raise e
    finally:
        connection.close()
