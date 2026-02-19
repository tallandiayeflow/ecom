## 1 Création utilisateur + installations système (VPS)

### 1.1 Créer l’utilisateur et donner sudo

```bash
sudo adduser noor
sudo usermod -aG sudo noor
```

### 1.2 Connexion SSH

```bash
ssh noor@d91.134.143.81
```

### 1.3 Installer les dépendances

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip mysql-server supervisor nginx
```

### 1.4 Préparer le dossier applicatif

```bash
mkdir -p /home/noor/app
cd /home/noor/app
```

---

## 2) MySQL (création DB + user)

> Recommandation : utiliser un user dédié au lieu de `root`.

### 2.1 Connexion MySQL

```bash
sudo mysql
```

### 2.2 Création base + user

```sql
CREATE DATABASE noor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'noor_user'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON noor.* TO 'noor_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 3) Clonage du projet (chemins réels)

Chemin projet :

- Root repo : `/home/noor/app/noor`
- Backend : `/home/noor/app/noor/backend`

### 3.1 Préparer SSH GitHub (si besoin)

```bash
ssh-keyscan github.com >> ~/.ssh/known_hosts
ssh-keygen -t ed25519 -C "tndiaye@flowrh.sn"
cat ~/.ssh/id_ed25519.pub
```

Ajouter la clé publique dans GitHub → Settings → SSH and GPG keys.

### 3.2 Cloner

```bash
cd /home/noor/app
git clone git@github.com:talla-ndiaye/azure-noor-shop.git noor
cd /home/noor/app/noor/backend
```

---

## 4) Python venv + requirements + .env

### 4.1 venv

```bash
cd /home/noor/app/noor/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4.2 Fichier `.env`

```bash
nano /home/noor/app/noor/backend/.env
```

Exemple :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=noor_user
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_NAME=noor

FLASK_ENV=production
SECRET_KEY=CHANGE_ME_SUPER_SECRET
```

### 4.3 Dossiers

```bash
mkdir -p /home/noor/app/noor/backend/logs
mkdir -p /home/noor/app/noor/backend/uploads
```

---

## 5) Gunicorn (config)

Créer :
`/home/noor/app/noor/backend/gunicorn_config.py`

```python
bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
timeout = 30
keepalive = 2
errorlog = "/home/noor/app/noor/backend/logs/gunicorn-error.log"
accesslog = "/home/noor/app/noor/backend/logs/gunicorn-access.log"
loglevel = "info"
```

---

## 6) Supervisor (service backend)

Créer :
`sudo nano /etc/supervisor/conf.d/noor.conf`

```ini
[program:noor]
directory=/home/noor/app/noor/backend
command=/home/noor/app/noor/backend/venv/bin/gunicorn -c gunicorn_config.py app:app
user=noor
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stderr_logfile=/home/noor/app/noor/backend/logs/supervisor-error.log
stdout_logfile=/home/noor/app/noor/backend/logs/supervisor-access.log
environment=PATH="/home/noor/app/noor/backend/venv/bin"
```

Activer :

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart noor
sudo supervisorctl status noor
```

Option : sudo sans mot de passe pour supervisorctl

```bash
sudo visudo
```

Ajouter :

```txt
noor ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl
```

---

## 7) DuckDNS (domaine backend) + cron

### 7.1 Script DuckDNS

```bash
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Contenu (remplacer domaine + token) :

```bash
echo url="https://www.duckdns.org/update?domains=noor-boutique&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

```bash
chmod 700 ~/duckdns/duck.sh
~/duckdns/duck.sh
```

### 7.2 Cron

```bash
crontab -e
```

Ajouter :

```bash
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## 8) Nginx (reverse proxy + uploads + CORS 2 origines)

### 8.1 CORS : pourquoi map ?

On ne peut pas envoyer plusieurs origines dans `Access-Control-Allow-Origin`; il faut renvoyer l’Origin si elle est autorisée. [web:797]

Créer `/etc/nginx/conf.d/cors-map.conf` :

```nginx
map $http_origin $cors_origin {
    default "";
    "https://noor-boutique.com" $http_origin;
    "https://www.noor-boutique.com" $http_origin;
}
```

### 8.2 Config Nginx

Créer `/etc/nginx/sites-available/noor` :

```nginx
server {
    listen 443 ssl;
    server_name noor-boutique.duckdns.org;

    client_max_body_size 16M;

    ssl_certificate /etc/letsencrypt/live/noor-boutique.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/noor-boutique.duckdns.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Vary "Origin" always;
    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    add_header Access-Control-Allow-Credentials "true" always;

    if ($request_method = OPTIONS) { return 204; }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /uploads {
        alias /home/noor/app/noor/backend/uploads;
    }
}

server {
    listen 80;
    server_name noor-boutique.duckdns.org;
    return 301 https://$host$request_uri;
}
```

Activer :

```bash
sudo ln -sf /etc/nginx/sites-available/noor /etc/nginx/sites-enabled/noor
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9) SSL Let's Encrypt (Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d noor-boutique.duckdns.org
```

---

## 10) Déploiement automatique (GitHub Actions → VPS)

### 10.1 Clé SSH GitHub Actions (sur le VPS)

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/github_actions
```

### 10.2 Secrets GitHub

Ajouter dans GitHub Actions Secrets :

- `VPS_HOST` = `d91.134.143.81`
- `VPS_USER` = `noor`
- `VPS_SSH_KEY` = contenu complet de `~/.ssh/github_actions`

### 10.3 Workflow

`.github/workflows/deploy-backend.yml`

```yaml
name: Deploy Backend to VPS

on:
  push:
    branches: ["main"]
    paths:
      - "backend/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e
            cd /home/noor/app/noor/backend

            # Backup .env
            if [ -f .env ]; then cp .env .env.backup; fi

            git pull origin main

            # Restore .env
            if [ -f .env.backup ]; then mv .env.backup .env; fi

            source venv/bin/activate
            pip install -r requirements.txt --quiet

            sudo supervisorctl restart noor
            sudo supervisorctl status noor
```

---

## 11) Domaine OVH → Vercel (Frontend)

### 11.1 Ajouter les domaines dans Vercel

Vercel → Project → Settings → Domains :

- `noor-boutique.com`
- `www.noor-boutique.com` [web:646]

Vercel affiche les DNS à configurer. [web:646]

### 11.2 Zone DNS OVH (règles)

- **Apex domain** (`noor-boutique.com`) → config via **A record**. [web:646]
- **Subdomain** (`www.noor-boutique.com`) → config via **CNAME record**. [web:646]

### 11.3 Valeurs appliquées (cas réel de la discussion)

- `@` : `A` → `216.198.79.1` (valeur demandée par Vercel à ce moment).
- `www` : `CNAME` → valeur unique fournie par Vercel (ex: `b94f3a412b9cd6a7.vercel-dns-017.com.`).

### 11.4 Validation

Dans Vercel → Domains : Refresh/Verify jusqu’à “Valid configuration”. [web:647]

---

## 12) Post-déploiement (contrôles)

- `sudo supervisorctl status noor`
- `sudo tail -f /home/noor/app/noor/backend/logs/supervisor-error.log`
- Vérifier API : `https://noor-boutique.duckdns.org`
- Vérifier Front : `https://noor-boutique.com` et `https://www.noor-boutique.com`
- Vérifier CORS depuis le front (2 origines). [web:797]

````

Pour que je te le rende **parfaitement exact**, envoie juste :
```bash
ls -la /home/noor/app
ls -la /home/noor/app/noor
````

et je mets les chemins finaux partout (supervisor, nginx, gunicorn, workflow) sans aucune ambiguïté.
