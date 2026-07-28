// _qa/qa_v11.mjs - the v1.1 rich-render bridge contract, proven on REAL minted payloads.
// Each fixture under _qa/fixtures/v11/ is a genuine engine mint (ashtons/thackray/dds), enriched
// exactly as engine-v2.17.2 compose emits (obligations/why/enforcement/citation_url from the
// compiled catalogue). Asserts the founder's bar: the SAME rich report as a legacy payload -
// framework exhibits with the fine, why it matters, what the regulator assesses, cited
// enforcement and the law link - with zero dirty strings and the client booting clean.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { JSDOM } from 'jsdom';
import { v11ToD } from '../functions/audit/_v11.js';

const ROOT = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const FIX = path.join(ROOT, '_qa', 'fixtures', 'v11');
const CHARTS = fs.readFileSync(path.join(ROOT, 'public/audit/audit-charts.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'public/audit/audit-app.js'), 'utf8');

const issues = [];
const expect = (fx, ok, what) => { if (!ok) issues.push(fx + ': ' + what); };

for (const file of fs.readdirSync(FIX).filter((f) => f.endsWith('.json'))) {
  const payload = JSON.parse(fs.readFileSync(path.join(FIX, file), 'utf8'));
  const D = v11ToD(payload, { company: payload.meta.company, slug: 's', hash: 'h' });

  // adapter-level contract
  const fw = D.frameworks || [];
  const breached = fw.filter((f) => !f.screened);
  expect(file, fw.length >= 10, 'expected >=10 framework rows, got ' + fw.length);
  expect(file, breached.length >= 1, 'expected a breached framework');
  expect(file, breached.every((f) => String(f.exp || '').trim()), 'breached rows must carry a fine/exposure');
  const withObl = fw.filter((f) => (f.obligations || []).length);
  expect(file, withObl.length >= fw.length * 0.8, 'obligations coverage too thin: ' + withObl.length + '/' + fw.length);
  expect(file, fw.some((f) => f.citation_url), 'no framework carries the official law link');
  expect(file, !/undefined|NaN/.test(JSON.stringify(D)), 'dirty strings in D');
  expect(file, (D.fixes || []).length >= 1, 'no fixes derived');
  expect(file, typeof D.score === 'number' && D.grade, 'score/grade must derive');

  // client boot contract (jsdom, same as qa_render)
  const dom = new JSDOM('<div class="tz-shell" id="app"></div>', { runScripts: 'outside-only', url: 'https://x.test/' });
  dom.window.requestAnimationFrame = (cb) => cb();
  dom.window.D = JSON.parse(JSON.stringify(D));
  try {
    dom.window.eval(CHARTS);
    dom.window.eval(APP);
    const doc = dom.window.document;
    expect(file, doc.querySelectorAll('.fw').length === fw.length, 'DOM fw rows mismatch');
    expect(file, doc.querySelectorAll('.railnav button').length === 6, 'rail nav incomplete');
    expect(file, doc.querySelectorAll('.sev-card').length >= 1, 'severe trio missing');
    const html = doc.getElementById('app').innerHTML;
    expect(file, !/undefined/.test(html), 'literal undefined rendered');
    expect(file, /applies to you/.test(html), 'screened rows missing');
    expect(file, /Why this framework matters/.test(html), 'why-this-matters exhibit missing');
  } catch (e) {
    issues.push(file + ': client boot threw: ' + e.message);
  }
}

for (const i of issues) console.log('FLAG  ' + i);
console.log('\n==== ' + issues.length + ' total v11-bridge issues ====');
if (issues.length) process.exit(1);
