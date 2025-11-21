from flask_caching import Cache

cache = Cache(config={
    'CACHE_TYPE': 'SimpleCache',  # Cache en mémoire
    'CACHE_DEFAULT_TIMEOUT': 300,  # 5 minutes
    'CACHE_THRESHOLD': 500  # Maximum 500 entrées en cache
})
