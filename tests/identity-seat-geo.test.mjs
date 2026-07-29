// IDENTITY · SEAT · GEO — the three wave-1 adapter hunks that did NOT come from adapter-patches.md.
// Sources: 05-wave1/SOUNDNESS-REPORT.md §1/§2 (B3, B6) and 05-wave1/WAVE1-LOG-UK.md §S2 item 8 (the seat).
//
// B3  NO ENGINE ROW WITHOUT A PROBE. The adapter fanned ONE provider's boolean (geoP.ai_knows) across eight
//     named engines, each rendered "cites you" / "not citing you", from payloads that probed at most one.
//     Seven of the eight were never asked anything. It now reads payload.geo_engines and invents no row.
// B6  THE ENGINE ALREADY RESOLVED THE NAME, WITH EVIDENCE. firmName() never read payload.firm_identity and
//     re-applied the same domain-token proxy the engine had already overruled, so a payload that said
//     "DiMichaelangelo Family Dentistry" rendered a report addressed to "Healthysmiles".
// S2  THE SEAT. meta.city read cleanCity(keyword_map.city) — a phrase PROBE over the firm's own copy, gated
//     to UK-only because it is a guess. The engine's firm-seat resolver emits a RECEIPTED seat at
//     payload.city + payload.city_evidence; doyleclayton's carried "London" from its Companies House
//     registered office and the rendered report still said "".
import assert from 'node:assert/strict';
import { payloadToD } from '../functions/audit/_adapter.js';

let n = 0, bad = 0;
const t = (name, fn) => { n++; try { fn(); console.log('ok ' + n + ' ' + name); } catch (e) { bad++; console.error('FAIL ' + n + ' ' + name + ': ' + e.message); } };

const P = (extra) => payloadToD(Object.assign({
  domain: 'healthysmiles.com', company: null, firm_profile: {},
  detected_sector: 'healthcare', country: 'US', engine_version: 'test',
  pointers: [], binding: {}, jurisdiction_families: { families: ['US'], primary: 'US' },
  verified: true, llm_verify: { status: 'pass' },
}, extra), { verified: true });

/* ---------------- B6 · the resolved identity ---------------- */

t('B6: a receipted firm_identity beats the domain stem', () => {
  const d = P({ firm_identity: { display_name: 'DiMichaelangelo Family Dentistry', source: 'schema_org_corroborated', confidence: 0.9 } });
  assert.match(d.meta.company, /DiMichaelangelo/, 'got: ' + d.meta.company);
  assert.ok(!/^Healthysmiles$/i.test(d.meta.company), 'the report was addressed to the domain stem again');
});

t('B6: firm_identity sourced from the DOMAIN STEM does not short-circuit', () => {
  // The stem is the last rung, not evidence. It must fall through to the existing ladder, or this hunk
  // would simply re-plumb the same weak proxy through a new field.
  const d = P({ firm_identity: { display_name: 'Healthysmiles', source: 'domain_stem', confidence: 0.2 },
    firm_profile: { name: 'Healthy Smiles Dental' } });
  assert.match(d.meta.company, /Healthy Smiles Dental/, 'got: ' + d.meta.company);
});

/* ---------------- B3 · no engine row without a probe ---------------- */

t('B3: a payload with no geo_engines renders NO engine rows, and says why', () => {
  const d = P({ geo: { ai_knows: true } });
  assert.equal((d.geo.engines || []).length, 0, 'eight names were invented from one boolean again');
  assert.equal(d.geo.enginesProbed, false);
  assert.ok(d.geo.enginesNote && /probed/i.test(d.geo.enginesNote), 'an empty grid must state its reason: ' + d.geo.enginesNote);
});

t('B3: one probed engine renders exactly one row, carrying its own probe receipt', () => {
  const d = P({
    geo: { ai_knows: false },
    geo_engines: { fanout_forbidden: true, engines: [{ name: 'Google AI', cited: true, provider: 'serper', method: 'grounded', samples: 2 }] },
  });
  assert.equal(d.geo.engines.length, 1, 'one probe, one row');
  assert.equal(d.geo.engines[0].nm, 'Google AI');
  assert.equal(d.geo.engines[0].probed, true, 'every row must carry a probe receipt');
  assert.equal(d.geo.engines[0].cites, true, 'cites comes from the PROBE, not from geo.ai_knows');
  assert.equal(d.geo.enginesProbed, true);
  assert.equal(d.geo.enginesNote, null);
});

t('B3: the cite column is never fanned — one probe can never speak for a second engine', () => {
  const d = P({
    geo: { ai_knows: true },
    geo_engines: { engines: [{ name: 'Perplexity', cited: false, provider: 'perplexity', method: 'live', samples: 3 }] },
  });
  assert.equal(d.geo.engines.length, 1);
  assert.equal(d.geo.engines[0].cites, false, 'ai_knows=true must not overwrite a probe that found no citation');
});

/* ---------------- S2 item 8 · the seat, not the keyword probe ---------------- */

t('S2: a register-grade seat is used, and the keyword probe is not consulted', () => {
  const d = P({
    domain: 'doyleclayton.co.uk', country: 'UK', jurisdiction_families: { families: ['UK'], primary: 'UK' },
    city: 'London',
    city_evidence: { city: 'London', source: 'companies_house_registered_office', confidence: 0.95, postcode: 'EC1Y 4TY' },
    keyword_map: { city: 'Reading' },
  });
  assert.equal(d.meta.city, 'London', 'the engine proved a seat and the render asked a different lane');
  assert.equal(d.meta.cityEvidence.source, 'companies_house_registered_office');
  assert.equal(d.meta.cityEvidence.postcode, 'EC1Y 4TY');
});

t('S2: a seat with NO receipt falls through to the keyword probe', () => {
  const d = P({
    domain: 'doyleclayton.co.uk', country: 'UK', jurisdiction_families: { families: ['UK'], primary: 'UK' },
    city: 'London', city_evidence: null, keyword_map: { city: 'Reading' },
  });
  assert.equal(d.meta.city, 'Reading', 'a bare string with no source is not a seat');
  assert.equal(d.meta.cityEvidence, null, 'a probed city must never be badged as a register lookup');
});

t('S2: the UK-only guess guard still binds the PROBE, and does not bind a proven seat', () => {
  const probed = P({ domain: 'emaar.ae', country: 'AE', jurisdiction_families: { families: ['AE'], primary: 'AE' },
    keyword_map: { city: 'Reading' } });
  assert.equal(probed.meta.city, '', 'the "Reading on Emaar" domino: a probed city outside the UK is a guess');

  const proven = P({ domain: 'emaar.ae', country: 'AE', jurisdiction_families: { families: ['AE'], primary: 'AE' },
    city: 'Dubai', city_evidence: { city: 'Dubai', source: 'registered_office', confidence: 0.95 },
    keyword_map: { city: 'Reading' } });
  assert.equal(proven.meta.city, 'Dubai', 'a receipted seat is evidence, not a guess, in any market');
});

t('S2: a COUNTRY in the city slot is never printed as a city', () => {
  const d = P({ domain: 'x.co.uk', country: 'UK', jurisdiction_families: { families: ['UK'], primary: 'UK' },
    city: 'UK', city_evidence: { city: 'UK', source: 'registered_office', confidence: 0.5 } });
  assert.equal(d.meta.city, '');
  assert.equal(d.meta.cityEvidence, null);
});

console.log(bad ? 'IDENTITY/SEAT/GEO: FAIL' : 'IDENTITY/SEAT/GEO: ALL GREEN (' + n + ' checks)');
process.exit(bad ? 1 : 0);
