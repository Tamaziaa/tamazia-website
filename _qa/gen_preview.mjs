// _qa/gen_preview.mjs — generate the EXACT production HTML for a fixture (payload -> payloadToD ->
// renderShell with inlined assets) and write it to public/audit/_preview.html so the static preview
// server can render the real page without the CF function / Neon. Usage: node _qa/gen_preview.mjs <fixtureKey>
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const { payloadToD } = await import(join(REPO, 'functions/audit/_adapter.js'));
const { renderShell } = await import(join(REPO, 'functions/audit/_shell.js'));
const assets = {
  css: readFileSync(join(REPO, 'public/audit/audit.css'), 'utf8'),
  charts: readFileSync(join(REPO, 'public/audit/audit-charts.js'), 'utf8'),
  app: readFileSync(join(REPO, 'public/audit/audit-app.js'), 'utf8'),
};
const NAME = {
  'harley-healthcare-uk': 'Harley Street Dental Clinic', 'fenwick-law-us': 'Fenwick & West LLP',
  'thirdspace-gym-uk': 'Third Space', 'altamimi-law-uae': 'Al Tamimi & Company',
  'emaar-realestate-uae': 'Emaar Properties', 'greystar-realestate-uk': 'Greystar UK',
  'loaf-ecommerce-uk': 'Loaf', 'fourseasons-hospitality-uk': 'Four Seasons',
  'legalconsultants-law-uae': 'Legal Consultants Dubai', 'chapter-realestate-uk': 'Chapter Living',
};
const key = process.argv[2] || 'harley-healthcare-uk';
const payload = JSON.parse(readFileSync(join(REPO, '_qa/fixtures', key + '.json'), 'utf8'));
const company = (payload._matrix && payload._matrix.company) || NAME[key] || null;
const D = payloadToD(payload, { company, now: Date.parse('2026-06-05T00:00:00Z') });
const html = renderShell(D, { inline: true, assets });
writeFileSync(join(REPO, 'public/audit/_preview.html'), html);
console.log('wrote public/audit/_preview.html for ' + key + ' (' + html.length + ' bytes, company=' + company + ')');
