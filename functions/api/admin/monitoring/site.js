import { authed, unauth, json, probe } from '../_lib.js';
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const URLS = ['/', '/book/', '/sectors/', '/pricing/', '/cases/', '/process/', '/why-us/', '/faq/', '/api/health'];
  const base = 'https://tamazia-website.pages.dev';
  const results = await Promise.all(URLS.map(p => probe(p, base + p, { timeout: 4000 })));
  const slow = results.filter(r => r.latency_ms > 1500);
  const broken = results.filter(r => r.status !== 'green');
  return json({
    probes: results,
    slow_count: slow.length,
    broken_count: broken.length,
    p95_ms: percentile(results.map(r => r.latency_ms).sort((a, b) => a - b), 0.95),
    checked_at: new Date().toISOString(),
  });
};
function percentile(arr, p) {
  if (!arr.length) return 0;
  return arr[Math.min(arr.length - 1, Math.floor(p * arr.length))];
}
