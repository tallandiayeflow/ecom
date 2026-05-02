import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Base de données
    DATABASE_HOST = os.getenv('DATABASE_HOST', 'localhost')
    DATABASE_USER = os.getenv('DATABASE_USER', 'phone_shop_user')
    DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD', '')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'phone_shop')
    DATABASE_PORT = int(os.getenv('DATABASE_PORT', 3306))
    PAYTECH_API_KEY = os.getenv('PAYTECH_API_KEY', '')
    PAYTECH_API_SECRET = os.getenv('PAYTECH_API_SECRET', '')
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'https://talla-phone.vercel.app').split(',')
    
    # Serveur
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 8000))
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Limite de taille pour les uploads (16 MB)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

    # Twilio (SMS receipts)
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
    TWILIO_FROM_NUMBER = os.getenv('TWILIO_FROM_NUMBER', '')  # e.g. +12125551234
