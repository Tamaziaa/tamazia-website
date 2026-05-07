---
name: tamazia-deploy
description: Deploy n8n stack to Oracle/DigitalOcean/any-VPS via SSH + Docker compose. Triggers on "deploy n8n", "set up VPS", "install pipeline", "spin up server".
---

# Deploy n8n stack

## Provisioning targets (in order of preference)

1. **Oracle Cloud Always Free** — 4 OCPU ARM Ampere A1 + 24GB RAM, free forever
2. **DigitalOcean** — £4/month basic droplet, no ID required
3. **Vultr / Linode** — £4/month, no ID for most
4. **Mac Docker fallback** — Aman's Mac + Docker Desktop + Cloudflare Tunnel (free, but Mac must stay on)

## Bootstrap script

Located at `scripts/install_vps.sh`. Idempotent. Re-runnable.

```bash
ssh ubuntu@<public_ip>
mkdir -p /opt/tamazia && cd /opt/tamazia
# scp the docker-compose.yml, Caddyfile, postgres-schema.sql, install_vps.sh
bash install_vps.sh
```

## Stack layout

```
n8n (Docker) ←→ Postgres (Docker) ←→ Caddy (Docker, HTTPS)
                                         ↓
                              n8n.tamazia.co.uk
```

## Post-install

1. DNS: A record n8n.tamazia.co.uk → VPS public IP (CF API call)
2. n8n editor: https://n8n.tamazia.co.uk (Caddy auto-TLS via Let's Encrypt)
3. Basic auth: aman / [generated password in /opt/tamazia/.env]
4. Apply postgres schema: `docker exec -i tamazia-postgres psql -U n8n -d n8n < postgres-schema.sql`
5. Import workflow JSONs: copy to `/opt/tamazia/files/`, import via n8n editor UI

## SSH key

Saved at `.credentials/ssh-keys/tamazia-n8n` (private) and `.credentials/ssh-keys/tamazia-n8n.pub` (public).

## DNS setup via CF API

```bash
ZONE_TOKEN="<from .env.cloudflare>"
TUK="a564b60458bb5eec33bbe7f13eb0e4e1"  # tamazia.co.uk zone ID
curl -X POST "https://api.cloudflare.com/client/v4/zones/$TUK/dns_records" \
  -H "Authorization: Bearer $ZONE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"A","name":"n8n.tamazia.co.uk","content":"<VPS_IP>","ttl":1,"proxied":false}'
```
