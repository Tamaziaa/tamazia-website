// Fire-and-forget sync of a website form submission into the Neon leads pipeline.
// Fail-open + no-op until env.NEON_URL is bound, so it can never affect the form's KV save or email.
export async function syncLeadToNeon(env, tab, body, request_id) {
  if (!env || !env.NEON_URL) return;
  try {
    const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
    const email = (body.email || body['audit-email'] || '').toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    const company = body.company || '';
    const sector = body.sector || body['audit-sector'] || '';
    const domain = (body['audit-input'] || body.c_homepage_url || (email.split('@')[1] || ''))
      .replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    const name = body.name || '';
    const note = body.outcome || '';
    const channel = 'website_form_' + (tab || 'unknown');
    const sql = `INSERT INTO leads (company, domain, contact_email, sector, acquisition_channel, lead_type, lifecycle_stage, status, contact_first, personalisation_pointers, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,'inbound','inbound_lead','new',$6,$7,NOW(),NOW())`;
    const params = [company || domain || email, domain, email, sector, channel, name,
      JSON.stringify({ source: 'website', tab, request_id, note }).slice(0, 2000)];
    await fetch(`https://${host}/sql`, {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql, params })
    });
  } catch (_e) { /* fail-open */ }
}
