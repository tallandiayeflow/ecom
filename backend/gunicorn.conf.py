# gunicorn.conf.py

import os

# Configuration du timeout
timeout = 300

# Nombre de workers (ajustez selon vos besoins)
workers = 4

# Bind à tous les interfaces sur le port d'environnement (Render l'utilise)
bind = f"0.0.0.0:{os.getenv('PORT', 5000)}"

# Autres configurations optionnelles
worker_class = "sync"
max_requests = 1000
max_requests_jitter = 50
