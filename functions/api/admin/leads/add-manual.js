import { authed, unauth, json } from '../_lib.js';
// CC-5 · POST /api/admin/leads/add-manual — inject a VIP lead with the 9 safety pitfalls solved.
// body: { domain, email?, company?, contact_name?, sector?, jurisdiction?, lawful_basis }
// VIPs jump the queue (priority_source='manual', manual_rank=now) but NEVER bypass the safety gates.
//
// Pitfalls enforced:
//  1 priority_source='manual' + manual_rank timestamp (front of queue)
//  2 verify shape (syntax + not disposable) + suppression + already-contacted
//  5 dedupe on domain AND email -> if it exists, RAISE priority instead of a 2nd thread
//  6 audience block (investor/institution/existing-client/LexQuity)
//  7 per-day manual cap (protects A/B from contamination)
//  8 cross-domain person dedupe (same email anywhere -> raise the existing record)
//  9 PECR/GDPR lawful-basis tag required
// (3 per-inbox cap + 4 priority-mint happen in the engine: this enqueues minting_queue source='manual'.)

const DISPOSABLE = /@(mailinator|guerrillamail|10minutemail|tempmail|trashmail|yopmail|throwaway|sharklasers|getnada)\./i;
const BLOCK_TYPE = new Set(['investor', 'institution', 'client', 'existing_client', 'lexquity', 'internal']);
const BLOCK_RX = /lexquity|\binvestor\b|\bfund\b|\bventures?\b|\bcapital partners\b/i;
const VALID_BASIS = new Set(['legitimate_interest', 'soft_opt_in', 'consent']);
const MANUAL_DAILY_CAP = 25;

function toDomain(raw) {
  let s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0];
  return (/\./.test(s) && !/\s/.test(s)) ? s : '';
}

export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  let b = {}; try { b = await request.json(); } catch (_e) {}

  const domain = toDomain(b.domain);
  const email = String(b.email || '').trim().toLowerCase();
  const company = b.company ? String(b.company).slice(0, 160) : null;
  const sector = b.sector ? String(b.sector).slice(0, 64) : null;
  const jurisdiction = b.jurisdiction ? String(b.jurisdiction).slice(0, 32) : 'UK';
  const basis = String(b.lawful_basis || '').trim();

  // 9 · lawful basis required (PECR/GDPR — a hand-added individual still needs a basis)
  if (!VALID_BASIS.has(basis)) return json({ ok: false, error: 'lawful_basis_required', detail: 'Pick a lawful basis: legitimate_interest, soft_opt_in, or consent.' }, 400);
  if (!domain) return json({ ok: false, error: 'need_domain', detail: 'Enter the firm website (e.g. example.com).' }, 400);
  // 2 · email shape (full verify happens in the engine before any send)
  if (email && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || DISPOSABLE.test(email))) {
    return json({ ok: false, error: 'bad_email', detail: 'That email is malformed or disposable. Fix it or leave it blank (the finder will fill it).' }, 400);
  }
  // 6 · audience block
  if (BLOCK_RX.test((company || '') + ' ' + domain)) {
    return json({ ok: false, error: 'audience_blocked', detail: 'Looks like an investor/institution/LexQuity contact — VIP injection is for prospects only.' }, 400);
  }

  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (query, params) => {
    const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, params }) });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    return r.json();
  };
  const rows = (r) => (r && (r.rows || r.results)) || [];

  try {
    // 2 · suppression check
    if (email) {
      const sup = await q('SELECT 1 FROM suppression WHERE lower(email)=lower($1) LIMIT 1', [email]);
      if (rows(sup).length) return json({ ok: false, error: 'suppressed', detail: 'That address is on the suppression list (opted out / bounced). Not adding.' }, 409);
    }
    // 6 · audience block by lead_type on an existing record at this domain
    const typed = await q("SELECT lead_type FROM leads WHERE lower(domain)=lower($1) AND lead_type IS NOT NULL LIMIT 1", [domain]);
    if (rows(typed).length && BLOCK_TYPE.has(String(rows(typed)[0].lead_type || '').toLowerCase())) {
      return json({ ok: false, error: 'audience_blocked', detail: 'This domain is tagged as a non-prospect audience.' }, 400);
    }
    // 7 · per-day manual cap
    const cnt = await q("SELECT COUNT(*)::int n FROM leads WHERE priority_source='manual' AND manual_rank::date = CURRENT_DATE", []);
    if ((rows(cnt)[0] || {}).n >= MANUAL_DAILY_CAP) {
      return json({ ok: false, error: 'daily_cap', detail: `Manual cap of ${MANUAL_DAILY_CAP}/day reached (protects A/B). Try again tomorrow.` }, 429);
    }
    // 5 + 8 · dedupe on domain OR email (cross-domain person) -> RAISE priority, no 2nd thread
    const dup = await q("SELECT id, lifecycle_stage FROM leads WHERE lower(domain)=lower($1) OR (lower(COALESCE(contact_email,email))=lower($2) AND $2 <> '') ORDER BY id LIMIT 1", [domain, email]);
    if (rows(dup).length) {
      const id = rows(dup)[0].id;
      await q("UPDATE leads SET priority_source='manual', manual_rank=NOW(), lawful_basis=$2, manual_added_by='cockpit', updated_at=NOW() WHERE id=$1", [id, basis]);
      return json({ ok: true, action: 'raised', id, message: 'Already in the system — raised to VIP priority instead of creating a duplicate thread.' });
    }
    // INSERT the VIP lead (1 + 9 tags). lifecycle starts at sourced; the engine enrich/verify/qualify/mint
    // gates still apply — VIP skips SCORING priority, never the safety gates.
    const ins = await q(
      `INSERT INTO leads (company, domain, contact_email, sector, jurisdiction, lead_type, lifecycle_stage,
         priority_source, manual_rank, lawful_basis, manual_added_by, acquisition_channel, created_at, updated_at)
       VALUES ($1,$2,NULLIF($3,''),$4,$5,'prospect','sourced','manual',NOW(),$6,'cockpit','manual',NOW(),NOW())
       RETURNING id`,
      [company || domain, domain, email, sector, jurisdiction, basis]
    );
    const id = (rows(ins)[0] || {}).id;
    // 4 · priority-mint: enqueue so the VIP audit mints first (mint-worker drains; surfaces in History)
    await q(
      `INSERT INTO minting_queue (domain, company, sector, country, lead_id, status, source, enqueued_at)
       VALUES ($1,$2,$3,$4,$5,'pending','manual',now())
       ON CONFLICT (domain) DO UPDATE SET status='pending', source='manual', lead_id=EXCLUDED.lead_id, error=NULL, enqueued_at=now()`,
      [domain, company || domain, sector || 'general', jurisdiction === 'UK' ? 'UK' : jurisdiction, id]
    );
    return json({ ok: true, action: 'added', id, domain,
      message: 'VIP lead added, front of queue, audit queued to mint. It still passes verify + suppression before any send.' });
  } catch (e) {
    return json({ ok: false, error: 'failed', detail: e.message }, 500);
  }
};
