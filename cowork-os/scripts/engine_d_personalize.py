#!/usr/bin/env python3
"""
Tamazia Engine D · Sector Personalization
============================================
Reads sector-pitch-library.md and a lead row, outputs:
  - subject line (1 of 3 sector options, cycled deterministically by lead.id)
  - email body (sector template with merge fields filled)
  - chosen alias from aliases-v2.json (round-robin within day quota)

Slots into n8n W2 send orchestration. Standalone for now.

Usage:
    python3 engine_d_personalize.py --lead lead.json
    python3 engine_d_personalize.py --batch leads.csv --out drafts.jsonl
"""

import argparse, json, re, sys, hashlib, datetime, random
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LIBRARY = ROOT.parent.parent / 'Tamazia-Rebuild' / 'sector-pitch-library.md'
ALIASES = ROOT.parent.parent / 'Tamazia-Rebuild' / 'email-aliases-v2.json'
# Fallback paths if running from outputs dir
if not LIBRARY.exists():
    LIBRARY = Path('/sessions/ecstatic-vibrant-goldberg/mnt/Tamazia-Rebuild/sector-pitch-library.md')
if not ALIASES.exists():
    ALIASES = Path('/sessions/ecstatic-vibrant-goldberg/mnt/Tamazia-Rebuild/email-aliases-v2.json')

SECTOR_ALIAS_MAP = {
    'hospitality': 'Hotels and Hospitality',
    'hotel': 'Hotels and Hospitality',
    'hotels': 'Hotels and Hospitality',
    'law': 'Law Firms',
    'legal': 'Law Firms',
    'finance': 'Financial Services',
    'financial': 'Financial Services',
    'real_estate': 'Real Estate and Property',
    'realestate': 'Real Estate and Property',
    'property': 'Real Estate and Property',
    'ipo': 'IPO and Pre IPO',
    'pre_ipo': 'IPO and Pre IPO',
    'restaurant': 'Restaurants, Bars, F&B',
    'fb': 'Restaurants, Bars, F&B',
    'restaurants': 'Restaurants, Bars, F&B',
    'executive': 'Executive Personal Brand',
    'epb': 'Executive Personal Brand',
    'education': 'Education',
    'edu': 'Education',
    'university': 'Education',
    'ecommerce': 'E Commerce and Luxury Retail',
    'e_commerce': 'E Commerce and Luxury Retail',
    'retail': 'E Commerce and Luxury Retail',
    'automotive': 'Automotive',
    'auto': 'Automotive',
    'wellness': 'Wellness and Fitness',
    'fitness': 'Wellness and Fitness',
    'technology': 'Technology and SaaS',
    'tech': 'Technology and SaaS',
    'saas': 'Technology and SaaS',
    'events': 'Events, Manufacturing and Other',
    'manufacturing': 'Events, Manufacturing and Other',
    'other': 'Events, Manufacturing and Other',
}


def parse_library(md_text):
    """Parse sector-pitch-library.md into a dict keyed by canonical sector heading."""
    sectors = {}
    # Sector blocks start with "## N. <Name>" and end at next "## " or "---"
    pattern = re.compile(r'^## \d+\. (.+)$', re.MULTILINE)
    matches = list(pattern.finditer(md_text))
    for i, m in enumerate(matches):
        name = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else md_text.find('## Common close')
        if end == -1:
            end = len(md_text)
        block = md_text[start:end]

        # Subject options: bullet list under "Subject options:"
        subjects = []
        sub_match = re.search(r'Subject options:\s*\n((?:[-*] .+\n?)+)', block)
        if sub_match:
            for line in sub_match.group(1).strip().split('\n'):
                line = line.lstrip('-* ').strip()
                if line:
                    subjects.append(line)

        # Body: blockquote starting after "Body:"
        body_match = re.search(r'Body:\s*\n((?:>\s.*\n?)+)', block)
        body = ''
        if body_match:
            body = '\n'.join(line.lstrip('> ').rstrip() for line in body_match.group(1).split('\n') if line.strip().startswith('>'))

        # Regulatory hook
        reg_match = re.search(r'Reg hook:\s*(.+)', block)
        reg_hook = reg_match.group(1).strip() if reg_match else ''

        # Pricing
        price_match = re.search(r'Pricing:\s*(.+)', block)
        pricing = price_match.group(1).strip() if price_match else ''

        # Pain stat
        pain_match = re.search(r'Pain stat:\s*(.+)', block)
        pain_stat = pain_match.group(1).strip() if pain_match else ''

        sectors[name] = {
            'name': name,
            'subjects': subjects,
            'body_template': body,
            'reg_hook': reg_hook,
            'pricing': pricing,
            'pain_stat': pain_stat,
        }
    return sectors


def resolve_sector(input_str, sectors):
    """Map free-form sector input to canonical sector dict."""
    key = input_str.lower().strip().replace(' ', '_').replace('-', '_')
    canonical_name = SECTOR_ALIAS_MAP.get(key)
    if canonical_name and canonical_name in sectors:
        return sectors[canonical_name]
    # Fuzzy match by substring
    for name, sec in sectors.items():
        if input_str.lower() in name.lower():
            return sec
    return None


def fill_merge_fields(template, lead):
    """Fill {{token}} placeholders. Defaults for missing fields."""
    defaults = {
        'company': lead.get('company', '[your company]'),
        'contact_first': lead.get('contact_first', 'there'),
        'contact_last': lead.get('contact_last', ''),
        'contact_title': lead.get('contact_title', ''),
        'city': lead.get('city', lead.get('company', 'your market')),
        'property_type': lead.get('property_type', 'property'),
        'product_line': lead.get('product_line', 'your offering'),
        'programme': lead.get('programme', 'your programme'),
        'specialism': lead.get('specialism', 'your specialism'),
    }
    result = template
    for key, val in defaults.items():
        result = result.replace('{{' + key + '}}', str(val))
    return result


def pick_subject(subjects, lead):
    """Deterministic pick by lead id hash. Cycles through 3 options."""
    if not subjects:
        return '[no subject - sector library missing]'
    seed = lead.get('id') or lead.get('email') or lead.get('company', 'x')
    h = int(hashlib.sha1(seed.encode()).hexdigest(), 16)
    return subjects[h % len(subjects)]


def pick_alias(aliases_data, lead, day_state=None):
    """Pick the next alias for sending. Round-robin by day_state, default to deterministic per lead."""
    pool = aliases_data.get('tamazia_co_uk', [])
    if not pool:
        return None
    seed = lead.get('id') or lead.get('email') or lead.get('company', 'x')
    h = int(hashlib.sha1(seed.encode()).hexdigest(), 16)
    return pool[h % len(pool)]


def personalize(lead, sectors, aliases_data):
    sec = resolve_sector(lead.get('sector', ''), sectors)
    if not sec:
        return {'error': f'Unknown sector: {lead.get("sector")}', 'lead_id': lead.get('id')}

    subject = pick_subject(sec['subjects'], lead)
    subject = fill_merge_fields(subject, lead)

    body = fill_merge_fields(sec['body_template'], lead)

    alias = pick_alias(aliases_data, lead)

    return {
        'lead_id': lead.get('id'),
        'lead_company': lead.get('company'),
        'lead_email': lead.get('email'),
        'sector_canonical': sec['name'],
        'reg_hook': sec['reg_hook'],
        'pricing_recommended': sec['pricing'],
        'send_from_alias': alias['email'] if alias else None,
        'send_from_persona': alias['persona_name'] if alias else None,
        'subject': subject,
        'body': body,
        'generated_at': datetime.datetime.utcnow().isoformat() + 'Z',
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--lead', help='Single lead JSON file')
    parser.add_argument('--batch', help='Batch CSV with header row')
    parser.add_argument('--out', help='Output JSONL file (one draft per line)')
    parser.add_argument('--demo', action='store_true', help='Run with synthetic sample leads')
    args = parser.parse_args()

    md_text = LIBRARY.read_text()
    sectors = parse_library(md_text)
    aliases_data = json.loads(ALIASES.read_text())

    print(f'[engine-d] sectors loaded: {len(sectors)}', file=sys.stderr)
    print(f'[engine-d] aliases co.uk: {len(aliases_data.get("tamazia_co_uk", []))}', file=sys.stderr)

    leads = []
    if args.lead:
        leads = [json.loads(Path(args.lead).read_text())]
    elif args.batch:
        import csv
        with open(args.batch) as f:
            leads = list(csv.DictReader(f))
    elif args.demo:
        leads = [
            {'id': 'demo-001', 'company': 'The Standard Hotels London', 'sector': 'hospitality',
             'contact_first': 'Marcus', 'contact_last': 'Pemberton', 'contact_title': 'Director of Marketing',
             'email': 'marcus@thestandard.com', 'property_type': 'boutique luxury', 'city': 'London'},
            {'id': 'demo-002', 'company': 'Macfarlanes', 'sector': 'law',
             'contact_first': 'Helena', 'contact_title': 'Managing Partner',
             'email': 'helena@macfarlanes.com'},
            {'id': 'demo-003', 'company': 'Pictet Wealth Management', 'sector': 'finance',
             'contact_first': 'Jean Paul', 'contact_title': 'Head of UK Marketing',
             'email': 'jp@pictet.com'},
            {'id': 'demo-004', 'company': 'Knight Frank Private Office', 'sector': 'real_estate',
             'contact_first': 'Imogen', 'contact_title': 'Head of International Buyer Acquisition',
             'email': 'imogen@knightfrank.com'},
            {'id': 'demo-005', 'company': 'CG Oncology Pre-IPO', 'sector': 'ipo',
             'contact_first': 'Daniel', 'contact_title': 'Head of Investor Relations',
             'email': 'daniel@cgoncology.com'},
        ]
    else:
        parser.print_help()
        sys.exit(0)

    out_handle = open(args.out, 'w') if args.out else None
    for lead in leads:
        result = personalize(lead, sectors, aliases_data)
        json_line = json.dumps(result, ensure_ascii=False)
        if out_handle:
            out_handle.write(json_line + '\n')
        else:
            print('=' * 60)
            print(f"Lead: {result.get('lead_company')} ({result.get('sector_canonical')})")
            print(f"From: {result.get('send_from_persona')} <{result.get('send_from_alias')}>")
            print(f"To  : {result.get('lead_email')}")
            print(f"Subject: {result.get('subject')}")
            print()
            print(result.get('body', ''))
            print()
    if out_handle:
        out_handle.close()
        print(f'[engine-d] wrote drafts to {args.out}', file=sys.stderr)


if __name__ == '__main__':
    main()
