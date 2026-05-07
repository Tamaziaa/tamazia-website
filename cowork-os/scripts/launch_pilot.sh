#!/bin/bash
# Tamazia · Cold campaign pilot launcher
# Sends N leads through Engine D personalization + Mailjet relay
# Logs results to /opt/tamazia/pilot_log.jsonl
#
# Usage: ./launch_pilot.sh leads.csv

set -euo pipefail

LEADS_CSV="${1:-leads.csv}"
ENV_FILE="/opt/tamazia/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Run install_vps.sh first."
  exit 1
fi

source "$ENV_FILE"

if [ ! -f "$LEADS_CSV" ]; then
  echo "ERROR: leads CSV not found at $LEADS_CSV"
  echo "Format: id,company,domain,sector,contact_first,contact_last,contact_title,email,city,product_line"
  exit 1
fi

# Run Engine D to generate drafts
python3 /opt/tamazia/engine_d_personalize.py --batch "$LEADS_CSV" --out /tmp/drafts.jsonl

# Loop through drafts, send via Mailjet
SENT=0
FAILED=0
SKIP_SUPPRESSED=0

while IFS= read -r draft; do
  recipient=$(echo "$draft" | python3 -c "import json,sys;d=json.loads(sys.stdin.read());print(d.get('lead_email',''))")
  alias=$(echo "$draft" | python3 -c "import json,sys;d=json.loads(sys.stdin.read());print(d.get('send_from_alias',''))")
  persona=$(echo "$draft" | python3 -c "import json,sys;d=json.loads(sys.stdin.read());print(d.get('send_from_persona',''))")
  subject=$(echo "$draft" | python3 -c "import json,sys;d=json.loads(sys.stdin.read());print(d.get('subject',''))")
  body=$(echo "$draft" | python3 -c "import json,sys;d=json.loads(sys.stdin.read());print(d.get('body',''))")

  if [ -z "$recipient" ] || [ -z "$alias" ]; then
    FAILED=$((FAILED + 1))
    continue
  fi

  # Suppression check
  suppressed=$(curl -s "https://api.mailjet.com/v3/REST/sender/$recipient" -u "$MAILJET_API_KEY:$MAILJET_SECRET_KEY" 2>/dev/null | python3 -c "import json,sys;d=json.load(sys.stdin);print('yes' if d.get('Count',0)>0 else 'no')" 2>/dev/null || echo "no")

  # Send
  resp=$(curl -s -X POST "https://api.mailjet.com/v3.1/send" \
    -u "$MAILJET_API_KEY:$MAILJET_SECRET_KEY" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "
import json
import sys
print(json.dumps({
  'Messages': [{
    'From': {'Email': '$alias', 'Name': '$persona'},
    'To': [{'Email': '$recipient'}],
    'Subject': '$subject',
    'TextPart': '''$body''',
    'ReplyTo': {'Email': 'founder@tamazia.co.uk', 'Name': 'Aman Pareek'}
  }]
}))
")")

  status=$(echo "$resp" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d.get('Messages',[{}])[0].get('Status','fail'))")
  if [ "$status" = "success" ]; then
    SENT=$((SENT + 1))
    echo "$(date -u +%FT%TZ) SENT $alias → $recipient" >> /opt/tamazia/pilot_log.jsonl
  else
    FAILED=$((FAILED + 1))
    echo "$(date -u +%FT%TZ) FAIL $alias → $recipient · $resp" >> /opt/tamazia/pilot_log.jsonl
  fi

  # Throttle: 1 send per 12 seconds (well under per-alias day quota)
  sleep 12
done < /tmp/drafts.jsonl

echo ""
echo "=== Pilot complete ==="
echo "Sent: $SENT"
echo "Failed: $FAILED"
echo "Log: /opt/tamazia/pilot_log.jsonl"
