"""
Test rapide des notifications WhatsApp.
Usage: python test_whatsapp.py
"""
import os
from dotenv import load_dotenv

load_dotenv('.env')

from utils.whatsapp import (
    notify_admin_new_order,
    notify_client_status_change,
    WASEND_API_KEY,
    ADMIN_PHONE,
    WASEND_API_URL,
)

print("=== Config ===")
print(f"API URL   : {WASEND_API_URL}")
print(f"Admin     : {ADMIN_PHONE}")
print(f"API Key   : {'OK definie' if WASEND_API_KEY else 'MANQUANTE - definir WASEND_API_KEY dans .env'}")
print()

if not WASEND_API_KEY:
    print("STOP: impossible de tester sans API key.")
    exit(1)

print("=== Test 1 : Notification nouvelle commande -> admin ===")
ok = notify_admin_new_order(
    order_id="TEST-1234-ABCD",
    client_name="Talla Test",
    client_phone="+221781234567",
    total=45000,
    items_count=3,
)
print(f"Resultat : {'ENVOYE' if ok else 'ECHEC'}")
print()

print("=== Test 2 : Notification changement statut -> client ===")
test_phone = os.getenv('TEST_CLIENT_PHONE', ADMIN_PHONE)
statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
for status in statuses:
    ok = notify_client_status_change(test_phone, "TEST-1234", status)
    print(f"  {status:<12} -> {'OK' if ok else 'ECHEC'}")
