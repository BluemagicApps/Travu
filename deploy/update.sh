#!/usr/bin/env bash
# Deploy the latest main to the VPS. Run from the repo root:  bash deploy/update.sh
set -euo pipefail

echo "→ Pulling latest main…"
git fetch origin
git checkout main
git pull --ff-only origin main

echo "→ Installing deps (clean, prod+build)…"
npm ci

echo "→ Applying database migrations…"
npx prisma migrate deploy
npx prisma generate

echo "→ Building…"
npm run build

echo "→ Restarting via PM2…"
pm2 restart travu --update-env || pm2 start deploy/ecosystem.config.js

echo "✓ Deploy complete. Logs: pm2 logs travu"
