import { authed, unauth, json, listKv } from './_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  // Phase B placeholder: read campaign metadata if synced to KV via n8n
  const campaigns = await listKv(env, 'mystrika-campaign:', 100);
  // Also surface the 11 known campaigns hard-coded from project memory
  const known = [
    'Tamazia Regulator Lookup',
    'Tamazia Compliance Finding',
    'Tamazia Sector Phrase',
    'Tamazia Anonymised Peer',
  ];
  return json({
    campaigns: campaigns,
    known_count: 11,
    known_community_prompts: known,
    note: campaigns.length === 0 ? 'No live sync yet · run n8n W6/W8 webhooks to populate KV mystrika-campaign:* prefix' : ''
  });
};
