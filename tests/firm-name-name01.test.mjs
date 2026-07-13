// NAME-01 — the live birketts audit was addressed to "Bristol Office".
// The engine had no company on the queue row, derived one from the page, and lifted an office heading.
// A firm's name shares a token with its own domain. A page heading does not.
import assert from 'node:assert/strict';
import { payloadToD } from '../functions/audit/_adapter.js';

// TWO DOORS: firm_profile (in the payload) and ctx.company (the audit_pages row column the live render passes in).
// The first version of this fix guarded only the first door, and the live page still said "Bristol Office".
const P = (company, domain) => payloadToD({
  domain, company, firm_profile: { name: company },
  detected_sector: 'law-firms', country: 'UK', engine_version: 'test',
  pointers: [], binding: {}, jurisdiction_families: { families: ['UK'], primary: 'UK' },
  verified: true, llm_verify: { status: 'pass' },
}, { verified: true });

// the door the LIVE renderer actually uses: functions/audit/[[path]].js passes row.company as ctx.company
const PASSED = (company, domain) => payloadToD({
  domain, company: null, firm_profile: {},
  detected_sector: 'law-firms', country: 'UK', engine_version: 'test',
  pointers: [], binding: {}, jurisdiction_families: { families: ['UK'], primary: 'UK' },
  verified: true, llm_verify: { status: 'pass' },
}, { verified: true, company });

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };

t('NAME-01: a page heading that shares nothing with the domain is REJECTED', () => {
  const d = P('Bristol Office', 'birketts.co.uk');
  const shown = JSON.stringify(d);
  assert.ok(!/Bristol Office/.test(shown), 'the report must never be addressed to "Bristol Office"');
  assert.ok(/Birketts/i.test(shown), 'it must fall back to the domain stem, got: ' + (d.company || d.firmName));
});
t('NAME-01: the real firm name is KEPT', () => {
  assert.match(JSON.stringify(P('Birketts LLP', 'birketts.co.uk')), /Birketts/);
});
t('NAME-01: a hyphenated/ampersand name still matches its domain', () => {
  assert.match(JSON.stringify(P('Mills & Reeve', 'mills-reeve.com')), /Mills/);
  assert.match(JSON.stringify(P('Russell-Cooke', 'russell-cooke.co.uk')), /Russell/);
});
t('NAME-01: a legitimate name containing a generic word is NOT destroyed', () => {
  assert.match(JSON.stringify(P('The Office Group', 'theofficegroup.com')), /Office Group/, 'a real name sharing a token with its domain must survive');
});

t('NAME-01b: THE LIVE DOOR — ctx.company from the audit_pages row is guarded too', () => {
  const d = PASSED('Bristol Office', 'birketts.co.uk');
  const shown = JSON.stringify(d);
  assert.ok(!/Bristol Office/.test(shown), 'THIS is the door the live render uses; it said "Bristol Office" on the real page');
  assert.ok(/Birketts/i.test(shown), 'must fall back to the domain stem');
});
t('NAME-01b: a real name passed through the live door survives', () => {
  assert.match(JSON.stringify(PASSED('Birketts LLP', 'birketts.co.uk')), /Birketts/);
  assert.match(JSON.stringify(PASSED('The Office Group', 'theofficegroup.com')), /Office Group/);
});

console.log(bad ? 'NAME-01: FAIL' : 'NAME-01: ALL GREEN (' + n + ' checks)');
process.exit(bad ? 1 : 0);
