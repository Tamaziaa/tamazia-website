import { authed, unauth, json } from '../_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  if (!env.NEON_URL) return json({ ok: false, error: 'NEON_URL unbound' });
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id) return json({ ok: false, error: 'missing id' });
  const host = env.NEON_URL.replace(/.*@([^/]+)\/.*/, '$1');
  try {
    const r = await fetch('https://' + host + '/sql', { method: 'POST', headers: { 'Neon-Connection-String': env.NEON_URL, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "SELECT company, domain, sector, COALESCE(audit_url,'') audit_url, COALESCE(personalisation_pointers->>'top_finding','') finding FROM leads WHERE id=$1", params: [id] }) });
    const rows = (await r.json()).rows || []; const l = rows[0] || {};
    const proposal = `TAMAZIA · PROPOSAL\nFor: ${l.company || ''} (${l.domain || ''})\nSector: ${l.sector || ''}\n\nWHAT WE FOUND\n${l.finding || 'A compliance and SEO gap on your site, detailed in your audit.'}\n${l.audit_url ? ('Full audit: ' + l.audit_url) : ''}\n\nWHAT WE DO\nLawyer-led, compliance-first SEO and AI-visibility. Every campaign reviewed against 400+ legal and regulatory frameworks before publication.\n\nENGAGEMENT (90-day rolling, GBP)\n- Foundation, £2,500/mo, single location, 1 content piece/mo\n- Authority, £4,500/mo (pilot £3,600), multi-location, 4 pieces/mo, AI-search visibility\n- Enterprise, £9,500/mo, listed/pre-IPO, 10 pieces/mo, multilingual\n\nFIRST 30 DAYS\nKickoff, audit walkthrough, first compliance-reviewed content live, technical fixes, GEO and citations, month-1 GA4 review.\n\nAman Pareek, Founder, Tamazia Ltd, LLM King's College London`;
    return json({ ok: true, proposal, company: l.company });
  } catch (e) { return json({ ok: false, error: e.message }); }
};
