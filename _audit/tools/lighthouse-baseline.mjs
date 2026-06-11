// Remodel P3 · Lighthouse ×3 averaged per route against a local preview server.
// Usage: node _audit/tools/lighthouse-baseline.mjs [outSuffix]
// Expects the preview server already running on :4321 (npm run preview &).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ROUTES = ['/', '/instrument/', '/case-studies/cg-oncology/'];
const RUNS = 3;
const suffix = process.argv[2] || 'baseline';
mkdirSync('_audit/raw/lh', { recursive: true });

const pick = (lhr) => ({
  LCP: lhr.audits['largest-contentful-paint']?.numericValue ?? null,
  CLS: lhr.audits['cumulative-layout-shift']?.numericValue ?? null,
  TBT: lhr.audits['total-blocking-time']?.numericValue ?? null,
  TTFB: lhr.audits['server-response-time']?.numericValue ?? null,
  SI: lhr.audits['speed-index']?.numericValue ?? null,
  perf: (lhr.categories?.performance?.score ?? 0) * 100,
  a11y: (lhr.categories?.accessibility?.score ?? 0) * 100,
});

const avg = (arr, k) => {
  const vals = arr.map(x => x[k]).filter(v => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
};

let md = `# Performance baseline · ${suffix}\n\nLighthouse ×${RUNS} averaged, headless Chrome, local preview (:4321). INP is field-only; TBT is the lab proxy.\n\n| route | perf | a11y | LCP ms | CLS | TBT ms | TTFB ms | SI ms |\n|---|---|---|---|---|---|---|---|\n`;

for (const route of ROUTES) {
  const samples = [];
  for (let i = 1; i <= RUNS; i++) {
    const out = `_audit/raw/lh/${suffix}-${route.replace(/\//g, '_') || 'home'}-${i}.json`;
    try {
      execFileSync('npx', [
        'lighthouse', `http://localhost:4321${route}`,
        '--output=json', `--output-path=${out}`,
        '--only-categories=performance,accessibility',
        '--chrome-flags=--headless=new --no-sandbox',
        '--quiet', '--max-wait-for-load=45000',
      ], { stdio: 'pipe', timeout: 180_000 });
      samples.push(pick(JSON.parse(readFileSync(out, 'utf8'))));
      console.log(`lh ok ${route} run ${i}`);
    } catch (e) {
      console.error(`lh ERR ${route} run ${i}: ${String(e.message).split('\n')[0]}`);
    }
  }
  if (samples.length) {
    md += `| ${route} | ${avg(samples, 'perf')?.toFixed(0)} | ${avg(samples, 'a11y')?.toFixed(0)} | ${avg(samples, 'LCP')?.toFixed(0)} | ${avg(samples, 'CLS')?.toFixed(3)} | ${avg(samples, 'TBT')?.toFixed(0)} | ${avg(samples, 'TTFB')?.toFixed(0)} | ${avg(samples, 'SI')?.toFixed(0)} |\n`;
  } else {
    md += `| ${route} | — failed — |\n`;
  }
}

writeFileSync(`_audit/performance-${suffix}.md`, md);
console.log(`wrote _audit/performance-${suffix}.md`);
