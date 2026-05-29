import { authed, unauth, json, getState } from '../_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  // Read last reputation snapshot from KV (set by external scheduled task)
  const DOMAINS = ['tamazia.co.uk', 'tamazia.in', 'tamazia.uk', 'tamaziaworld.uk', 'tamazia.online', 'tamazia.store', 'tamazia.info'];
  const results = [];
  for (const d of DOMAINS) {
    const rep = await getState(env, 'postmaster_rep:' + d, 'unknown');
    const spam = await getState(env, 'postmaster_spam:' + d, '0');
    const checked = await getState(env, 'postmaster_check:' + d, '');
    results.push({
      domain: d,
      reputation: rep,
      spam_rate_pct: Number(spam) || 0,
      last_check: checked,
      status: rep === 'unknown' ? 'amber' : (rep === 'low' || Number(spam) > 0.3 ? 'red' : 'green'),
    });
  }
  return json({
    domains: results,
    note: 'Postmaster Tools data populated by scheduled task · v1 reads from KV postmaster_rep:* prefix',
  });
};
