import { authed, unauth, json } from '../_lib.js';
import { neonQuery } from '../_neon.js';
const SRC = "'serp-top','reddit','youtube','x-ads','social-ads','google_sponsored'";
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);
  const leadsR = await neonQuery(env,
    `SELECT company, domain, sector, platform, source, hot_score, fit, fit_score, audit_slug, audit_url,
            email, contact_name, contact_title, contact_linkedin,
            channel_email_ready, channel_linkedin_ready, channel_instagram_ready,
            jsonb_array_length(COALESCE(emails,'[]'::jsonb)) AS email_count,
            jsonb_array_length(COALESCE(decision_makers,'[]'::jsonb)) AS dm_count, sourced_at
     FROM leads WHERE source IN (${SRC}) ORDER BY sourced_at DESC NULLS LAST LIMIT $1`, [limit]);
  const runsR = await neonQuery(env,
    `SELECT source, records_found, records_new, status, started_at, payload_summary
     FROM sourcing_runs WHERE query='source-leads' ORDER BY started_at DESC LIMIT 20`, []);
  const leads = leadsR.ok ? leadsR.rows : [];
  const stats = {
    total: leads.length,
    hot: leads.filter(l => Number(l.hot_score) >= 70).length,
    fit: leads.filter(l => l.fit === true || l.fit === 't').length,
    email_ready: leads.filter(l => l.channel_email_ready === true || l.channel_email_ready === 't').length,
    linkedin_ready: leads.filter(l => l.channel_linkedin_ready === true || l.channel_linkedin_ready === 't').length,
  };
  return json({ leads, runs: runsR.ok ? runsR.rows : [], stats, error: leadsR.error || null });
};
