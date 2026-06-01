# Deploying Travu to a Namecheap VPS (Ubuntu/Debian)

Production host for **travunow.com** (business name stays **Travu**). Stack:
Next.js 16 + Prisma + **local Postgres**, behind **Nginx** with **Let's Encrypt**
HTTPS, kept alive by **PM2**. Code is deployed by `git pull` from
`BluemagicApps/Travu`.

> Run every command **in your VPS SSH terminal** unless it says "(local)" or
> "(Namecheap dashboard)". Paste the output back after each numbered step so it
> can be checked before moving on.

---

## 0. Point the domain at the VPS (Namecheap dashboard) — do this first, DNS takes time to propagate
1. Find your VPS public IP (in the Namecheap VPS panel, or on the box: `curl -4 ifconfig.me`).
2. Namecheap → **Domain List → travunow.com → Manage → Advanced DNS**. Add two **A records**:
   - Host `@`  →  Value `<VPS_IP>`  →  TTL Automatic
   - Host `www` → Value `<VPS_IP>` → TTL Automatic
   Remove any default parking/redirect records that conflict.
3. Check propagation (can take 5 min–24 h): `dig +short travunow.com` should return your VPS IP.

## 1. Connect + create a deploy user (so you're not running as root)
```bash
ssh root@<VPS_IP>          # or the user Namecheap gave you
adduser travu              # set a password when prompted
usermod -aG sudo travu
# (optional) copy your SSH key so you can: ssh travu@<VPS_IP>
rsync --archive --chown=travu:travu ~/.ssh /home/travu 2>/dev/null || true
su - travu                 # become the deploy user for the rest
```

## 2. Install system packages
```bash
sudo apt update && sudo apt upgrade -y
# Node.js 20 LTS (Next 16 needs Node >= 18.18; 20 is safe)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx postgresql postgresql-contrib
sudo npm install -g pm2
node -v && npm -v && psql --version && nginx -v
```

## 3. Create the local Postgres database
```bash
sudo -u postgres psql <<'SQL'
CREATE USER travu WITH PASSWORD 'CHANGE_ME_STRONG_PW';
CREATE DATABASE travu OWNER travu;
GRANT ALL PRIVILEGES ON DATABASE travu TO travu;
SQL
# sanity check (should print a row):
psql 'postgresql://travu:CHANGE_ME_STRONG_PW@localhost:5432/travu' -c '\conninfo'
```
Use the **same strong password** here and in `.env` (next step).

## 4. Clone the repo + configure env
```bash
cd ~
git clone https://github.com/BluemagicApps/Travu.git travu
cd travu
cp deploy/.env.production.example .env
nano .env        # fill in real values — see notes below, then Ctrl-O, Enter, Ctrl-X
```
Fill `.env`:
- `DATABASE_URL` / `DIRECT_URL` → `postgresql://travu:<your pw>@localhost:5432/travu` (both identical)
- `AUTH_SECRET` → generate: `openssl rand -base64 32` and paste the output
- `AUTH_URL` → `https://travunow.com`
- `ANTHROPIC_API_KEY`, `DUFFEL_API_TOKEN` → copy from your current local `.env`
- Amadeus keys can stay blank (mock flight fallback).

> **GitHub auth:** the repo is private, so `git clone`/`git pull` will prompt for
> a username + a **Personal Access Token** (not your password). Create one at
> github.com → Settings → Developer settings → Tokens (classic) → `repo` scope.
> Or set up a deploy SSH key. (We'll sort this when you hit the prompt.)

## 5. Install deps, migrate, seed, build
```bash
npm ci
npx prisma migrate deploy     # applies all migrations to the fresh DB
npx prisma generate
npm run db:seed               # seeds airports/airlines (flights reference data)
npm run build                 # production build; must end "Compiled successfully"
```

## 6. Start under PM2
```bash
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup          # prints a `sudo env PATH=… pm2 startup systemd -u travu …`
                     # COPY that printed line and run it once, so PM2 restarts on reboot
pm2 status           # travu should be "online"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000   # expect 200
```

## 7. Nginx reverse proxy
```bash
sudo cp deploy/nginx-travunow.conf /etc/nginx/sites-available/travunow
sudo ln -s /etc/nginx/sites-available/travunow /etc/nginx/sites-enabled/travunow
sudo rm -f /etc/nginx/sites-enabled/default      # drop the default page
sudo nginx -t && sudo systemctl reload nginx
```
Now `http://travunow.com` (once DNS resolves) should serve the app.

## 8. HTTPS (Let's Encrypt) — only after DNS resolves to the VPS
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d travunow.com -d www.travunow.com
# choose "redirect HTTP→HTTPS" when asked. Auto-renew is installed automatically.
```
Open **https://travunow.com** in a browser — search a city → book → confirm.

## 9. Firewall (optional but recommended)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

## Deploying updates later ("continue building from there")
From your laptop: push to `main` (or merge a PR) as usual. Then on the VPS:
```bash
cd ~/travu
bash deploy/update.sh        # pull main → npm ci → migrate deploy → build → pm2 restart
```
Watch logs with `pm2 logs travu`. Roll back with `git checkout <previous-sha> && bash deploy/update.sh`.

## Troubleshooting
- **502 Bad Gateway** → app isn't on :3000. `pm2 status`, `pm2 logs travu`.
- **DB connection errors** → check `.env` `DATABASE_URL` matches the password in step 3; `psql '<DATABASE_URL>' -c '\conninfo'`.
- **Build OOM on a small VPS** → add swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`.
- **Duffel Stays still mock** → expected; the live Stays API is 403 until Duffel enables it on your account. Flights use the real Duffel token.
- **Env change** → edit `.env`, then `pm2 restart travu --update-env`.
