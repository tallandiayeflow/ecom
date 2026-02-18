# 🚀 Guide Complet : Déploiement Automatique Backend Flask avec GitHub Actions

Ce guide vous permettra de déployer automatiquement votre backend Flask sur votre VPS Contabo à chaque commit sur la branche `main`.

---

## 📋 Prérequis

- VPS Contabo avec Ubuntu
- Compte GitHub
- Backend Flask fonctionnel
- MySQL installé sur le VPS
- Supervisor configuré

---

## 1️⃣ Configuration du VPS

### A. Installer les dépendances sur le VPS

```bash
sudo adduser noor
sudo usermod -aG sudo noor

ssh noor@77.237.233.252

# Installer Git, Python, et autres dépendances
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip mysql-server supervisor nginx
```

---

### B. Créer une clé SSH pour GitHub puis l'enregistre dans les cles public autorises (si pas déjà fait)

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**afficher et Copiez la clé publique et ajoutez-la sur le depot GitHub** :

```
cat ~/.ssh/github_actions

Copiez tout le contenu (de -----BEGIN OPENSSH PRIVATE KEY----- à -----END OPENSSH PRIVATE KEY-----)
```

- Allez sur **repot GitHub.com → Settings → secrtes et variables → actions → new repositry secret S**
- creer trois variable : `VPS Contabo`

```
cat ~/.ssh/github_actions
SERVER_IP
SERVER_USERNAME
SERVER_IP
SSH_PRIVATE_KEY
```

puis configure le fichier deploy.yml :

### C. Installer gir pui Cloner le repository sur le VPS

```bash
sudo apt update
sudo apt install git -y
# Pour Node.js (exemple, adaptez selon votre backend)
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

cd /home/noor/app
#ajouter la cle ssh de hithub
ssh-keyscan github.com >> ~/.ssh/known_hosts
#creer et afficher un cle public puis ajouter cette cles dans github sur paratres ssh keys
ssh-keygen -t ed25519 -C "tndiaye@flowrh.sn"
cat ~/.ssh/id_ed25519.pub


git clone git@github.com:talla-ndiaye/noor.git . ou git@github.com:talla-ndiaye/azure-noor-shop.git .
cd backend
```

---

### D. Créer l'environnement virtuel

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### E. Créer le fichier `.env`

```bash
nano .env
```

Contenu :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=noor

FLASK_ENV=production
SECRET_KEY=votre_secret_key_super_secrete

MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre_email@gmail.com
MAIL_PASSWORD=votre_mot_de_passe_app
MAIL_USE_TLS=True
```

Sauvegardez : `Ctrl+X`, `Y`, `Entrée`.

---

### F. Créer les dossiers nécessaires

```bash
mkdir -p logs uploads
```

---

### G. Créer le fichier `gunicorn_config.py`

```bash
nano gunicorn_config.py
```

Contenu :

```python
bind = "127.0.0.1:5000"
workers = 4
worker_class = "sync"
timeout = 30
keepalive = 2
errorlog = "/home/noor/app/noor/backend/logs/gunicorn-error.log"
accesslog = "/home/noor/app/noor/backend/logs/gunicorn-access.log"
loglevel = "info"
```

---

### H. Configurer Supervisor

```bash
sudo nano /etc/supervisor/conf.d/noor.conf
```

Contenu :

```ini
[program:noor]
directory=/home/noor/app/backend
command=/home/noor/app/backend/venv/bin/gunicorn -c gunicorn_config.py app:app
user=noor
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stderr_logfile=/home/noor/app/backend/logs/supervisor-error.log
stdout_logfile=/home/noor/app/backend/logs/supervisor-access.log
environment=PATH="/home/noor/app/backend/venv/bin"
```

Rechargez Supervisor :

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start noor
sudo supervisorctl status noor
```

---

### I. Configurer sudo sans mot de passe pour Supervisor

```bash
sudo visudo
```

Ajoutez à la fin :

```
noor ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl
```

Sauvegardez : `Ctrl+X`, `Y`, `Entrée`.

---

## 2️⃣ Configuration GitHub Actions

### A. Créer une clé SSH dédiée pour GitHub Actions

Sur le VPS :

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions
```

**Copiez la clé privée complète** (de `-----BEGIN` à `-----END`).

---

### B. Ajouter les secrets sur GitHub

Sur GitHub, allez dans votre repository :

**Settings → Secrets and variables → Actions → New repository secret**

Ajoutez ces 3 secrets :

| Nom           | Valeur                                            |
| ------------- | ------------------------------------------------- |
| `VPS_HOST`    | `77.237.233.252`                                  |
| `VPS_USER`    | `noor`                                            |
| `VPS_SSH_KEY` | La clé privée complète de `~/.ssh/github_actions` |

---

### C. Créer le fichier `.gitignore`

Sur votre machine Windows, dans le dossier `backend/`, créez `.gitignore` :

```
.env
.env.*
__pycache__/
*.pyc
venv/
logs/
uploads/
*.log
.DS_Store
```

---

### D. Créer le workflow GitHub Actions

Sur votre machine Windows, créez le fichier `.github/workflows/deploy-backend.yml` :

```yaml
name: Deploy Backend to VPS

on:
  push:
    branches:
      - main
    paths:
      - "backend/**"

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v3

      - name: 🚀 Deploy Backend to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/noor/app/noor/backend

            # Sauvegarder .env
            if [ -f .env ]; then
              cp .env .env.backup
            fi

            # Pull les changements
            git pull origin main

            # Restaurer .env
            if [ -f .env.backup ]; then
              mv .env.backup .env
            fi

            # Activer venv et installer dépendances
            source venv/bin/activate
            pip install -r requirements.txt --quiet

            # Redémarrer le service
            sudo supervisorctl restart noor

            # Afficher le statut
            echo "✅ Déploiement terminé"
            sudo supervisorctl status noor
```

---

### E. Committer et pousser

```bash
git add .
git commit -m "Setup GitHub Actions CI/CD"
git push origin main
```

---

## 3️⃣ Test du déploiement automatique

### A. Modifier un fichier backend

Sur votre machine Windows, modifiez un fichier (par exemple `app.py`).

---

### B. Committer et pousser

```bash
git add .
git commit -m "Test automatic deployment"
git push origin main
```

---

### C. Vérifier sur GitHub

Allez sur **GitHub → Actions** et voyez le workflow en cours d'exécution.

---

### D. Vérifier sur le VPS

```bash
ssh noor@77.237.233.252
cd /home/noor/app/noor/backend
sudo supervisorctl status noor
```

---

## 4️⃣ Workflow quotidien

Maintenant, à chaque fois que vous modifiez le backend :

1. **Sur Windows** : Modifiez le code
2. **Commit et push** :
   ```bash
   git add .
   git commit -m "Description des changements"
   git push origin main
   ```
3. **GitHub Actions** déploie automatiquement sur le VPS
4. **Vérifiez** que tout fonctionne

---

## 5️⃣ Commandes utiles

```bash
# Voir les logs du déploiement
ssh noor@77.237.233.252
tail -f /home/noor/app/backend/logs/supervisor-error.log

# Redémarrer manuellement
sudo supervisorctl restart noor

# Voir le statut
sudo supervisorctl status noor

# Pull manuel (si besoin)
cd /home/noor/app/noor/backend
git pull origin main
sudo supervisorctl restart noor
```

---

## Configuer nginx pour ssl Récapitulatif

```bash
sudo apt update
sudo apt install nginx -y

#Créez un fichier dans /etc/nginx/sites-available/noor par exemple :
sudo nano /etc/nginx/sites-available/noor
server {
    listen 80;
    server_name 77.237.233.252;  # Ou votre nom de domaine

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    error_log /var/log/nginx/noor-error.log;
    access_log /var/log/nginx/noor-access.log;
}
# Activer la configuration Nginx
sudo ln -s /etc/nginx/sites-available/noor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

#verifification
sudo ss -tlnp | grep nginx

```

## Configuration certificat ssl avec duckdns

```bash
#intallation
mkdir -p ~/duckdns
cd ~/duckdns
nano duck.sh
echo url="https://www.duckdns.org/update?domains=noor-backend&token=66ef02c1-d6a2-48b7-a581-e04d16f81ab4&ip=" | curl -k -o ~/duckdns/duck.log -K -


#demande ssl
sudo certbot --nginx -d backend-noor.com

Créez un script pour mettre à jour l’IP dynamique auprès de DuckDNS :

bash
mkdir -p ~/duckdns
cd ~/duckdns
nano duck.sh
#Mettre dedans ce contenu (en remplaçant monapp par votre domaine, et YOUR_TOKEN par votre token DuckDNS) :

echo url="https://www.duckdns.org/update?domains=monapp&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
Rendez le script exécutable :

chmod 700 duck.sh
#Testez la mise à jour :
./duck.sh

#3. Automatiser la mise à jour de votre IP dynamique via cron
crontab -e
#Ajoutez la ligne suivante pour exécuter la mise à jour toutes les 5 minutes :
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1


bash
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
4. Configurer Nginx avec votre domaine DuckDNS
Modifiez votre configuration Nginx (ex : /etc/nginx/sites-available/noor) :

text
server {
    listen 80;
    server_name noor.duckdns.org;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
#Activez le site :
sudo ln -sf /etc/nginx/sites-available/noor /etc/nginx/sites-enabled/noor
sudo nginx -t
sudo systemctl reload nginx
sudo apt install certbot python3-certbot-nginx -y

```

\*\*#===========================
Voici un guide complet étape par étape pour déployer un backend Flask avec Gunicorn, supervisé, accessible via DuckDNS, et sécurisé par HTTPS avec Let's Encrypt, de A à Z :

---

# Guide Complet : Déploiement Flask + Gunicorn + Nginx + DuckDNS + SSL Let's Encrypt

---

## 1. Préparation du serveur

- Connectez-vous à votre VPS (par exemple avec SSH).
- Mettez à jour les paquets :

```bash
sudo apt update && sudo apt upgrade -y
```

- Installez Python3, pip, virtualenv (si pas déjà) :

```bash
sudo apt install python3 python3-pip python3-venv nginx curl ufw -y
```

---

## 2. Préparation de l’application Flask

- Placez/clonez votre application dans un dossier, par ex `/home/noor/app/backend`.
- Créez un environnement virtuel et activez-le :

```bash
cd /home/noor/app/backend
python3 -m venv venv
source venv/bin/activate
```

- Installez les dépendances (Flask, Gunicorn, autres) :

```bash
pip install flask gunicorn
pip install -r requirements.txt  # si requis
```

- Vérifiez que vous pouvez lancer Gunicorn localement :

```bash
gunicorn -c gunicorn.conf.py app:app
```

---

## 3. Configuration Gunicorn

- Exemple de `gunicorn.conf.py` simple :

```python
bind = "0.0.0.0:8000"
workers = 3
errorlog = "/home/noor/app/backend/logs/gunicorn-error.log"
accesslog = "/home/noor/app/backend/logs/gunicorn-access.log"
```

- Créez le dossier logs si besoin, avec permissions :

```bash
mkdir -p /home/noor/app/backend/logs
chown noor:noor /home/noor/app/backend/logs
chmod 755 /home/noor/app/backend/logs
```

---

## 4. Supervision avec Supervisor

- Installez Supervisor :

```bash
sudo apt install supervisor -y
```

- Créez un fichier `/etc/supervisor/conf.d/noor.conf` :

```ini
[program:noor]
directory=/home/noor/app/backend
command=/home/noor/app/backend/venv/bin/gunicorn -c /home/noor/app/backend/gunicorn.conf.py app:app
autostart=true
autorestart=true
stderr_logfile=/home/noor/app/backend/logs/supervisor-error.log
stdout_logfile=/home/noor/app/backend/logs/supervisor-access.log
user=noor
environment=PATH="/home/noor/app/backend/venv/bin"
```

- Rechargez Supervisor :

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start noor
sudo supervisorctl status noor
```

---

## 5. Configuration DuckDNS

- Sur https://www.duckdns.org/, créez un compte puis votre sous-domaine (exemple `noor-backend.duckdns.org`).
- Notez votre token.
- Sur VPS, créez le script de mise à jour IP :

```bash
mkdir -p ~/duckdns
nano ~/duckdns/duck.sh
```

Collez dedans :

```bash
echo url="https://www.duckdns.org/update?domains=noor-backend&token=VOTRE_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

Rendez le script exécutable :

```bash
chmod 700 ~/duckdns/duck.sh
```

Testez-le :

```bash
~/duckdns/duck.sh
```

Automatisez avec cron :

```bash
crontab -e
```

Ajoutez :

```bash
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## 6. Configuration Nginx

- Créez le fichier `/etc/nginx/sites-available/noor-backend` :

```nginx
server {
    listen 80;
    server_name noor-backend.duckdns.org;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

- Activez la config et testez :

```bash
sudo ln -sf /etc/nginx/sites-available/noor-boutique /etc/nginx/sites-enabled/noor-boutique
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Sécurité réseau (firewall)

- Activez ufw et ouvrez les ports :

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

- Vérifiez et ouvrez aussi les ports sur le firewall de votre hébergeur (Contabo).

---

## 8. Installation Certbot et création du certificat SSL

- Installez Certbot avec Nginx plugin :

```bash
sudo apt install certbot python3-certbot-nginx -y
```

- Obtenez le certificat SSL :

```bash
sudo certbot --nginx -d noor-backend.duckdns.org
```

- Certbot va automatiquement configurer la redirection HTTP->HTTPS, générer et déployer le certificat.

---

## 9. Vérifications finales

- Visitez : https://noor-backend.duckdns.org
- Vérifiez la validité SSL dans le navigateur.
- Testez toutes les routes API ou pages.

---

## 10. Maintenance et renouvellement

- Certbot renouvelle automatiquement votre certificat.
- Vérifiez le renouvellement avec :

```bash
sudo certbot renew --dry-run
```

---

### Ce guide couvre tout, du VPS à HTTPS via DuckDNS.

Je peux vous fournir tous les fichiers exemples complets ou vous accompagner pas à pas pour chaque étape.  
Souhaitez-vous que je vous assiste pour une étape particulière ?

[ { icon: Users, label: 'Utilisateurs', path: '/admin/users' },](https://talla-ndiaye.imgbb.com/)

server {
server_name noor-boutique.duckdns.org;

    client_max_body_size 16M;

    location / {
        # CORS headers
        add_header Access-Control-Allow-Origin "https://noor-boutique.vercel.app" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # Preflight OPTIONS
        if ($request_method = OPTIONS) {
          return 204;
        }

        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /uploads {
        alias /home/noor/app/backend/uploads;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/noor-boutique.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/noor-boutique.duckdns.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

}

server {
listen 80;
server_name noor-boutique.duckdns.org;

    return 301 https://$host$request_uri;

}
