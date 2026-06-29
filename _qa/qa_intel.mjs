// Phase 4 validation — pull the LATEST minted payload for each domain, confirm it carries framework_intel from the
// engine (proves build.js emit), render via payloadToD, and report the regulatory-intelligence per framework card:
// obligation count, whether a VERIFIED enforcement action (with source url) is shown, and the guidance line.
// Usage: NEON_URL=... node _qa/qa_intel.mjs rashidlaw.co.uk coutts.com ...
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const { payloadToD } = await import(join(REPO, 'functions/audit/_adapter.js'));
const DB = process.env.NEON_URL;
const q = (sql) => execSync(`psql "${DB}" -tA -c "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf8', maxBuffer: 1 << 27 }).trim();

const domains = process.argv.slice(2);
if (!domains.length) { console.error('Usage: node _qa/qa_intel.mjs <domain> ...'); process.exit(2); }

let totalFail = 0;
for (const d of domains) {
  const row = q(`SELECT payload_json::text FROM audit_pages WHERE domain='${d}' ORDER BY generated_at DESC LIMIT 1`);
  if (!row) { console.log(`\n### ${d} — NO minted row`); totalFail++; continue; }
  const payload = JSON.parse(row);
  const hasIntel = payload.framework_intel && Object.keys(payload.framework_intel).length;
  const D = payloadToD(payload, { company: null });
  const fws = D.frameworks || [];
  const withObl = fws.filter((f) => (f.obligations || []).length).length;
  const withVerEnf = fws.filter((f) => f.enforcement_url).length;
  console.log(`\n### ${d} — framework_intel in payload: ${hasIntel ? 'YES (' + Object.keys(payload.framework_intel).length + ')' : 'NO — re-mint needed'} | cards=${fws.length} | with-obligations=${withObl} | with-verified-enforcement=${withVerEnf}`);
  if (!hasIntel) totalFail++;
  for (const f of fws) {
    const mark = (f.obligations || []).length ? (f.enforcement_url ? 'INTEL+ENF' : 'INTEL') : (f.screened ? 'screened ' : 'breach   ');
    const enf = f.enforcement_url ? String(f.action).slice(0, 84) : '(generic prose)';
    console.log(`   [${mark}] ${(f.name || '').slice(0, 40).padEnd(40)} obl=${String((f.obligations || []).length).padStart(2)} | ${enf}`);
  }
}
console.log(`\n==== ${totalFail} domains missing intel (0 = all carry curated regulatory-intelligence) ====`);
process.exit(0);
