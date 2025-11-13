import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database
    DATABASE_HOST = os.getenv('DATABASE_HOST', 'localhost')
    DATABASE_USER = os.getenv('DATABASE_USER', 'phone_shop_user')
    DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD', '')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'phone_shop')
    DATABASE_PORT = int(os.getenv('DATABASE_PORT', 3306))
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))  # 24 hours
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:8088').split(',')
    
    # Server
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
