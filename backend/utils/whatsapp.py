import os
import requests

WASEND_API_KEY = os.getenv('WASEND_API_KEY', '')
WASEND_API_URL = os.getenv('WASEND_API_URL', 'https://www.wasenderapi.com/api/send-message')
ADMIN_PHONE    = os.getenv('ADMIN_WHATSAPP_PHONE', '22178444828')

STATUS_MESSAGES = {
    'pending':    "⏳ Votre commande #{order_id} a été reçue et est en attente de traitement.",
    'processing': "🔧 Votre commande #{order_id} est en cours de préparation.",
    'shipped':    "🚚 Votre commande #{order_id} a été expédiée et est en route vers vous !",
    'delivered':  "✅ Votre commande #{order_id} a été livrée. Merci pour votre achat chez NOOR !",
    'cancelled':  "❌ Votre commande #{order_id} a été annulée. Contactez-nous pour plus d'informations.",
}


def _format_phone(phone: str) -> str:
    """Strip leading + and spaces — wasenderapi expects digits only."""
    return phone.replace('+', '').replace(' ', '').strip()


def _send(phone: str, message: str) -> bool:
    if not WASEND_API_KEY:
        print("[WhatsApp] WASEND_API_KEY not set — message skipped")
        return False
    try:
        resp = requests.post(
            WASEND_API_URL,
            headers={
                'Authorization': f'Bearer {WASEND_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={'to': _format_phone(phone), 'text': message},
            timeout=10,
        )
        if not resp.ok:
            print(f"[WhatsApp] Error {resp.status_code}: {resp.text}")
            return False
        return True
    except Exception as e:
        print(f"[WhatsApp] Exception: {e}")
        return False


def notify_admin_new_order(order_id: str, client_name: str, client_phone: str,
                           total: float, items_count: int) -> bool:
    msg = (
        f"🛍️ *Nouvelle commande #{order_id[:8]}*\n"
        f"👤 Client : {client_name}\n"
        f"📞 Téléphone : {client_phone}\n"
        f"🛒 Articles : {items_count}\n"
        f"💰 Total : {int(total):,} FCFA"
    )
    return _send(ADMIN_PHONE, msg)


def notify_client_status_change(client_phone: str, order_id: str, new_status: str) -> bool:
    template = STATUS_MESSAGES.get(new_status)
    if not template:
        return False
    msg = template.replace('{order_id}', order_id[:8])
    return _send(client_phone, msg)
