#!/bin/bash
# Tamazia n8n VPS bootstrap script
# Runs on Oracle Cloud Always Free Ubuntu 24.04 ARM
# Idempotent. Re-runnable.

set -euo pipefail

echo "=== Tamazia n8n VPS bootstrap ==="
echo "Started: $(date)"

# 1. System updates
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get -y -qq upgrade

# 2. Open ports 80 and 443 in iptables (Oracle Ubuntu blocks these by default)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || sudo apt-get -y -qq install iptables-persistent

# 3. Install Docker
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker ubuntu
fi

# 4. Install Docker Compose plugin
sudo apt-get -y -qq install docker-compose-plugin

# 5. Create Tamazia stack directory
sudo mkdir -p /opt/tamazia
sudo chown -R ubuntu:ubuntu /opt/tamazia
cd /opt/tamazia

# 6. Generate secure encryption key + DB password if not present
if [ ! -f .env ]; then
  N8N_KEY=$(openssl rand -hex 32)
  PG_PWD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
  N8N_AUTH_PWD=$(openssl rand -base64 18 | tr -d '/+=' | head -c 18)
  cat > .env <<EOF
POSTGRES_USER=n8n
POSTGRES_PASSWORD=${PG_PWD}
POSTGRES_DB=n8n
N8N_ENCRYPTION_KEY=${N8N_KEY}
N8N_HOST=n8n.tamazia.co.uk
N8N_BASIC_AUTH_USER=aman
N8N_BASIC_AUTH_PASSWORD=${N8N_AUTH_PWD}
EOF
  chmod 600 .env
  echo "Generated /opt/tamazia/.env with random secrets"
fi

# 7. Place docker-compose.yml and Caddyfile
# (operator will scp these in or pull from a private repo)
if [ ! -f docker-compose.yml ]; then
  echo "ERROR: docker-compose.yml missing in /opt/tamazia. scp it from your machine."
  exit 1
fi

# 8. Boot stack
sudo -u ubuntu docker compose up -d

# 9. Show status
sleep 5
sudo -u ubuntu docker compose ps

echo ""
echo "=== Bootstrap complete ==="
echo "n8n editor will be at: https://n8n.tamazia.co.uk (after DNS A record points to this VPS)"
echo "Basic Auth: aman / [check /opt/tamazia/.env]"
echo "First login: open n8n editor, set up owner account"
