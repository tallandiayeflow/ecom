import os
import multiprocessing

# Timeout
timeout = 300

# Workers basés sur CPU
workers = multiprocessing.cpu_count() * 2 + 1

# Bind sur le port Render ddd
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"

# Classe de workers
worker_class = "sync"

# Max requests pour éviter les fuites mémoire  test  
max_requests = 1000
max_requests_jitter = 50

# Logging optionnel
accesslog = "-"  # stdout
errorlog = "-"   # stderr
