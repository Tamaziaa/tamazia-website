// Legal-section validator for the 10-company multi-sector/jurisdiction check. For each domain it reports the detected
// jurisdictions, the laws shown (with country badge + regulator), whether EVERY detected jurisdiction is represented
// (the founder's multi-jurisdiction requirement), and flags any law whose country is NOT one the firm operates in
// (a "wrong law"). Usage: NEON_URL=... node _qa/qa_legal.mjs domain1 domain2 ...
import { execFileSync } from 'child_process';
// No shell: argv array means NEON_URL / argv domains can never be interpreted as shell syntax.
const psql = (sql) => execFileSync('psql', [process.env.NEON_URL, '-tA', '-c', sql], { encoding: 'utf8', maxBuffer: 1 << 27 }).trim();
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const { payloadToD } = await import(join(REPO, 'functions/audit/_adapter.js'));
const DB = process.env.NEON_URL;
const JN = { 'UNITED KINGDOM': 'UK', 'GREAT BRITAIN': 'UK', 'UNITED STATES': 'US', USA: 'US', 'UNITED ARAB EMIRATES': 'AE', UAE: 'AE', 'SAUDI ARABIA': 'SA', QATAR: 'QA', SINGAPORE: 'SG', 'EUROPEAN UNION': 'EU', FRANCE: 'FR', GERMANY: 'DE', IRELAND: 'IE', ITALY: 'IT', SPAIN: 'ES', NETHERLANDS: 'NL', INDIA: 'IN', CANADA: 'CA', AUSTRALIA: 'AU' };

let totalFlags = 0;
for (const d of process.argv.slice(2)) {
  let pj; try { pj = psql(`SELECT payload_json::text FROM audit_pages WHERE domain='${d.replace(/'/g, "''")}' ORDER BY generated_at DESC LIMIT 1`); } catch (e) { console.log(`\n### ${d}: DB error`); continue; }
  if (!pj) { console.log(`\n### ${d}: no audit`); continue; }
  const p = JSON.parse(pj);
  const D = payloadToD(p, { company: null });
  const detected = (p.detected_jurisdictions || []).map((x) => JN[String(x).toUpperCase().trim()] || null).filter(Boolean);
  const detSet = new Set(detected.length ? detected : [JN[String(p.country || '').toUpperCase()] || 'UK']);
  const fws = (D.frameworks || []).filter((f) => f.code !== 'SCAN');
  const shownJur = {}; for (const f of fws) shownJur[f.jur] = (shownJur[f.jur] || 0) + 1;
  // wrong-law: a framework badged to a country the firm does NOT operate in (Global is always fine)
  const jmap = { UK: 'UK', EU: 'EU', US: 'US', UAE: 'AE', KSA: 'SA', Qatar: 'QA', Singapore: 'SG', France: 'FR', Germany: 'DE', India: 'IN', Global: 'GLOBAL' };
  const wrong = fws.filter((f) => { const code = jmap[f.jur] || f.jur; return code !== 'GLOBAL' && !detSet.has(code); });
  // missing jurisdiction: a detected country with NO law shown
  const shownCodes = new Set(fws.map((f) => jmap[f.jur] || f.jur));
  const missing = [...detSet].filter((c) => c !== 'GLOBAL' && !shownCodes.has(c));
  const placeholder = fws.filter((f) => /Sector regulator|^Framework$/.test(f.regulator || ''));
  const flags = wrong.length + missing.length + placeholder.length;
  totalFlags += flags;
  console.log(`\n### ${d} [${p.detected_sector || p.sector}] detected=${[...detSet].join('+')} — ${flags === 0 ? 'CLEAN' : flags + ' flag(s)'}`);
  console.log(`   laws (${fws.length}): ${fws.map((f) => f.code + '·' + f.jur).join('  ')}`);
  if (wrong.length) console.log(`   ⚠ WRONG-COUNTRY law: ${wrong.map((f) => f.name + '(' + f.jur + ')').join(', ')}`);
  if (missing.length) console.log(`   ⚠ MISSING jurisdiction laws for: ${missing.join(', ')}`);
  if (placeholder.length) console.log(`   ⚠ placeholder regulator: ${placeholder.map((f) => f.name).join(', ')}`);
}
console.log(`\n==== ${totalFlags} total legal-section flags ====`);
