// Fire-and-forget sync of a website form submission into the Neon leads pipeline.
// Fail-open + no-op until env.NEON_URL is bound, so it can never affect the form's KV save or email.
export async function syncLeadToNeon(env, tab, body, request_id) {
  if (!env || !env.NEON_URL) return;
  try {
    // S4[D54] · parse the host with new URL() instead of a brittle regex. Neon HTTP
    // endpoints share the connection-string host. Fall back to the old regex only if
    // the string is not a parseable URL.
    let host;
    try { host = new URL(env.NEON_URL).host; }
    catch (_p) { host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1'); }

    const email = (body.email || body['audit-email'] || '').toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    const company = body.company || '';
    const sector = body.sector || body['audit-sector'] || '';
    // Mission D · D5 · prefer the explicit website field, then audit input, then honeypot-adjacent
    // fields, then the email domain. www. is stripped so the stored domain stays canonical.
    const domain = (body.website || body['audit-input'] || body.c_homepage_url || (email.split('@')[1] || ''))
      .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim();
    const name = body.name || '';
    const note = body.outcome || '';
    const channel = 'website_form_' + (tab || 'unknown');
    // S3[D26/X17/D25] · distinguish newsletter sign-ups (footer "Regulatory Briefings")
    // from sales enquiries so the COLD qualifier can exclude both from the cold path:
    //   briefings  → lead_type='newsletter'  (opt-in subscriber, not a sales prospect)
    //   everything else → lead_type='inbound' (inbound enquiry, already engaged, not cold)
    // The cold qualifier filters out lead_type IN ('newsletter','inbound').
    const lead_type = (tab === 'briefings') ? 'newsletter' : 'inbound';

    // CONTRACT (WEB-A) · the audit modal/forms POST audit_slug / audit_domain / top_finding.
    // Map them into the lead's personalisation_pointers so the engine + cockpit can read
    // which minted audit this lead came from. pending.js already reads
    // personalisation_pointers->>'top_finding', so this is the established home for them
    // (no new lead columns → stays additive/none per the Neon rule).
    const auditSlug = (body.audit_slug || '').toString().slice(0, 200);
    const auditDomain = (body.audit_domain || '').toString().slice(0, 200);
    const topFinding = (body.top_finding || '').toString().slice(0, 400);
    // DG5 · lead linkage. A submission that originated from a minted audit / outreach link can carry
    // back the originating lead's reference (lead_ref) or numeric id (lead_id). Stored in
    // personalisation_pointers alongside audit_slug so the engine + cockpit can join this web
    // submission to the lead it came from. Additive only (no new lead columns), fail-open.
    const leadRef = (body.lead_ref || body.leadRef || '').toString().slice(0, 200);
    const leadId = (body.lead_id || body.leadId || '').toString().slice(0, 64);
    // S3[D4] · explicit source_type tag so the COLD pipeline can exclude newsletter opt-ins.
    // The real `lead_type` column already carries 'newsletter' for the briefings tab (and the cold
    // qualifier filters on it); this mirrors that classification under the brief's source_type name,
    // stored in personalisation_pointers so no column is added to the shared leads table (additive only).
    const source_type = (tab === 'briefings') ? 'newsletter' : 'inbound';
    const pointers = { source: 'website', tab, lead_type, source_type, request_id, note };
    if (auditSlug) pointers.audit_slug = auditSlug;
    if (auditDomain) pointers.audit_domain = auditDomain;
    if (topFinding) pointers.top_finding = topFinding;
    if (leadRef) pointers.lead_ref = leadRef;
    if (leadId) pointers.lead_id = leadId;
    const pointersJson = JSON.stringify(pointers).slice(0, 2000);

    // S4[C15/C18] · idempotent insert keyed on contact_email so a repeat submission does
    // not create a duplicate lead. NOTE on the brief's "ON CONFLICT (contact_email)": the
    // leads table has no unique index on contact_email (add-manual.js dedupes leads in
    // application code on domain OR contact_email, and only minting_queue uses
    // ON CONFLICT (domain)). A bare ON CONFLICT (contact_email) would raise 42P10 and, on
    // this fail-open path, silently drop every web lead. Adding a unique index is DDL
    // (Neon rule = additive/prefer-none, leads is shared). An INSERT ... WHERE NOT EXISTS
    // delivers the same "no duplicate per email" guarantee, schema-safe, matching the
    // existing add-manual.js dedupe pattern.
    const sql = `INSERT INTO leads (company, domain, contact_email, sector, acquisition_channel, lead_type, lifecycle_stage, status, contact_first, personalisation_pointers, created_at, updated_at)
      SELECT $1,$2,$3,$4,$5,$6,'inbound_lead','new',$7,$8::jsonb,NOW(),NOW()
      WHERE NOT EXISTS (SELECT 1 FROM leads WHERE lower(contact_email) = lower($3))`;
    const params = [company || domain || email, domain, email, sector, channel, lead_type, name, pointersJson];
    await fetch(`https://${host}/sql`, {
      method: 'POST',
      headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql, params })
    });
  } catch (_e) { /* fail-open */ }
}
