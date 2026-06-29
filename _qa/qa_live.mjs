// Live rendered-report QA — pulls REAL minted payloads from Neon, renders the FULL production DOM
// (payloadToD + renderShell + JSDOM running app.js), and runs the same rendering-defect checks as qa_render.mjs.
// Usage: NEON_URL=... node _qa/qa_live.mjs domain1 domain2 ...   (or reads /tmp/qa_live_domains.txt)
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const { payloadToD } = await import(join(REPO, 'functions/audit/_adapter.js'));
const { renderShell } = await import(join(REPO, 'functions/audit/_shell.js'));
const DB = process.env.NEON_URL;

// Load the SAME client assets the production shell serves (audit-charts.js defines globals like CH that audit-app.js
// uses) so the JSDOM render mirrors the live page. Without charts, app.js throws "CH is not defined" — a harness
// false-positive that has nothing to do with the live audit.
import { readFileSync as _rf } from 'fs';
const _ASSETS = (() => { try { return { charts: _rf(join(REPO, 'public/audit/audit-charts.js'), 'utf8'), app: _rf(join(REPO, 'public/audit/audit-app.js'), 'utf8'), css: _rf(join(REPO, 'public/audit/audit.css'), 'utf8') }; } catch (_e) { return {}; } })();

function render(D) {
  const html = renderShell(D, { inline: true, assets: _ASSETS });
  return new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w) {
    w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    w.scrollTo = () => {}; w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  } });
}
function deepFind(obj, needles, path = '', hits = []) {
  if (obj == null) return hits;
  if (typeof obj === 'string') { for (const n of needles) if (obj.includes(n)) hits.push(`${path}=${JSON.stringify(obj).slice(0,50)}`); return hits; }
  if (typeof obj === 'number') { if (!isFinite(obj)) hits.push(`${path}=${obj}`); return hits; }
  if (Array.isArray(obj)) { obj.forEach((v,i)=>deepFind(v,needles,`${path}[${i}]`,hits)); return hits; }
  if (typeof obj === 'object') { for (const k of Object.keys(obj)) deepFind(obj[k],needles,path?`${path}.${k}`:k,hits); return hits; }
  return hits;
}
function checkD(D) {
  const out = [];
  deepFind(D, ['undefined','NaN','[object Object]','&amp;','&lt;','&gt;','&#','&quot;'], 'D').forEach(i=>out.push('Dval '+i));
  if (D.meta && /\.(com|co|org|net|io|ai|ae|uk|us|sa|qa|de|fr|it|es|london)\b/i.test(String(D.meta.company||''))) out.push(`company carries TLD "${D.meta.company}"`);
  if (D.counts && (D.counts.critical+D.counts.high+D.counts.standard)!==D.counts.total) out.push(`counts don't sum`);
  (D.frameworks||[]).forEach((f,i)=>{ if(!f.name||/^[A-Z_]+$/.test(f.name)) out.push(`framework[${i}] raw code "${f.name}"`); });
  return out;
}
function checkDom(doc) {
  const out = []; const app = doc.getElementById('app');
  if (!app || !app.innerHTML.trim()) return ['#app NOT BUILT (app.js threw)'];
  const html = app.innerHTML;
  // Structural corruption markers belong in innerHTML; HTML entities, however, are checked in the VISIBLE text only —
  // a `&amp;`/`&gt;` in innerHTML is correct escaping (e.g. the &#8599; arrow), whereas a literal entity in textContent
  // is a real double-encoding bug the user sees. (qa-accuracy)
  for (const m of ['undefined','NaN','[object Object]','undefinedpx','NaN%','null/','/null','&amp;amp;']) if (html.includes(m)) out.push(`DOM marker "${m}"`);
  const vis = app.textContent || '';
  for (const m of ['&amp;','&lt;','&gt;','&quot;','&#39;','&nbsp;','&#']) if (vis.includes(m)) out.push(`VISIBLE entity "${m}"`);
  const q = s => app.querySelectorAll(s).length;
  for (const [sel,n,op] of [['.railnav button',6,'='],['.pillar',6,'='],['.verdict',1,'='],['.dimcard',10,'='],['#sec-regulatory .fw',1,'>='],['#sec-overview .finding',1,'>='],['#sec-geo .engcell',8,'='],['.rail-social a',3,'=']]) { const c=q(sel); if(op==='='?c!==n:c<n) out.push(`${sel}=${c} (exp ${op}${n})`); }
  app.querySelectorAll('.num,.val,.v,.cmpv').forEach(el=>{ const t=(el.textContent||'').trim(); if(t===''||/NaN|undefined/.test(t)) out.push(`empty/NaN node <${el.className}>`); });
  // (Removed the "Tamazia repeated" heuristic: the brand legitimately appears in every fix line — it is not a defect.)
  return out;
}

const domains = process.argv.slice(2).length ? process.argv.slice(2) : readFileSync('/tmp/qa_live_domains.txt','utf8').split('\n').map(s=>s.trim()).filter(Boolean);
let grand = 0;
for (const domain of domains) {
  const inq = domain.replace(/'/g, "''");
  let pj, company;
  try {
    pj = execSync(`psql "${DB}" -tA -c "SELECT payload_json::text FROM audit_pages WHERE domain='${inq}' AND generated_at>now()-interval '6 hours' ORDER BY generated_at DESC LIMIT 1"`, { encoding: 'utf8', maxBuffer: 1 << 27 }).trim();
    company = execSync(`psql "${DB}" -tA -c "SELECT company FROM leads WHERE id=(SELECT lead_id FROM audit_pages WHERE domain='${inq}' AND generated_at>now()-interval '6 hours' ORDER BY generated_at DESC LIMIT 1)"`, { encoding: 'utf8' }).trim();
  } catch (e) { console.log(`\n### ${domain}: DB error ${String(e.message).slice(0,80)}`); continue; }
  if (!pj) { console.log(`\n### ${domain}: no recent audit`); continue; }
  let issues = [];
  try {
    const payload = JSON.parse(pj);
    const D = payloadToD(payload, { company: company || null, now: Date.parse('2026-06-29T00:00:00Z') });
    issues = issues.concat(checkD(D));
    issues = issues.concat(checkDom(render(D).window.document));
    const sec = payload.detected_sector, ctry = payload.country, nf = (payload.applicable_frameworks||[]).length;
    console.log(`\n### ${domain}  [${sec}/${ctry}, ${nf} fw, score ${D.score}, "${D.meta && D.meta.company}"]  — ${issues.length} issue(s)`);
  } catch (e) { issues.push('RENDER THREW: ' + String(e.message).slice(0,140)); console.log(`\n### ${domain} — RENDER FAILURE`); }
  issues.forEach(i => console.log('   x ' + i)); grand += issues.length;
}
console.log(`\n==== ${grand} total rendering issues across ${domains.length} reports ====`);
