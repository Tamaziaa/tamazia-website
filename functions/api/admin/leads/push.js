import { authed, unauth, json } from '../_lib.js';
// POST /api/admin/leads/push  { id }
// "Push" a lead toward send: qualify it (quality_fit=TRUE, lifecycle_stage='qualified') AND make sure
// it has an audit in flight by enqueuing its domain into minting_queue when it has no audit_url yet.
// The engine cycle then mints + renders the Touch-0 draft. Blocks if the lead's email is suppressed.
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  let b = {}; try { b = await request.json(); } catch (_e) {}
  const id = Number(b.id);
  if (!id) return json({ ok: false, error: 'missing id' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  const q = async (query, params) => {
    const r = await fetch('https://' + host + '/sql', {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params: params || [] }),
    });
    if (!r.ok) throw new Error('Neon HTTP ' + r.status);
    return r.json();
  };
  const rowsOf = (d) => d.rows || d.results || [];
  try {
    const lead = rowsOf(await q('SELECT id, domain, company, sector, best_email, audit_url, status FROM leads WHERE id=$1', [id]))[0];
    if (!lead) return json({ ok: false, error: 'lead not found' });

    // Suppression guard — never push a do-not-contact email into the send path.
    if (lead.best_email) {
      const sup = rowsOf(await q('SELECT 1 FROM suppression WHERE lower(email)=lower($1) LIMIT 1', [lead.best_email]));
      if (sup.length) return json({ ok: false, error: 'suppressed', detail: 'This email is on the suppression list; not pushed.' }, 409);
    }
    if (['duplicate', 'dnc', 'bounced', 'suppressed'].includes(String(lead.status || ''))) {
      return json({ ok: false, error: 'blocked_status', detail: `Lead status '${lead.status}' cannot be pushed.` }, 409);
    }

    await q('UPDATE leads SET quality_fit=TRUE, lifecycle_stage=$1, updated_at=NOW() WHERE id=$2', ['qualified', id]);

    let enqueued = false;
    if (lead.domain && !(lead.audit_url && String(lead.audit_url).length)) {
      await q(
        `INSERT INTO minting_queue (domain, company, sector, country, lead_id, status, source, enqueued_at)
         VALUES ($1, $2, $3, 'UK', $4, 'pending', 'manual', now())
         ON CONFLICT (domain) DO UPDATE SET status='pending', source='manual', error=NULL, enqueued_at=now()`,
        [lead.domain, lead.company, lead.sector || 'general', id]
      );
      enqueued = true;
    }
    return json({ ok: true, id, qualified: true, enqueued, has_audit: !!lead.audit_url });
  } catch (e) { return json({ ok: false, error: (e.message || '').slice(0, 120) }); }
};
