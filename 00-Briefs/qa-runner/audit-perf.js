// Tamazia QA Runner · LIGHTHOUSE PERF
// Runs every layer with runMode='lighthouse'. Each layer receives the lhr object
// for its target form-factor (mobile or desktop) and produces a finding.
//
// Outputs:
//   reports/<RUN_ID>/perf/findings.json
//   reports/<RUN_ID>/perf/report.md

import { writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { runLighthouse } from './lib/lighthouse-runner.js';
import { ROUTES } from './viewports.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'https://tamazia-website.pages.dev';
const ROUTE = process.env.ROUTE || '/';
const FORM_FACTOR = process.env.FORM_FACTOR === 'desktop' ? 'desktop' : 'mobile';
const RUN_ID = process.env.RUN_ID || ('perf-' + Date.now());
const REPORT_DIR = join(__dirname, 'reports', RUN_ID, 'perf');

async function loadLayers() {
  const layersDir = join(__dirname, 'layers');
  const files = (await readdir(layersDir)).filter(f => /^L\d+.*\.js$/.test(f)).sort();
  const layers = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(layersDir, f)).href);
    if (mod.default && (mod.default.runMode === 'lighthouse')) layers.push(mod.default);
  }
  return layers;
}

async function ensureDir(p) { await mkdir(p, { recursive: true }); }

async function main() {
  const t0 = Date.now();
  console.log(`PERF · ${BASE_URL}${ROUTE} · ${FORM_FACTOR} · RUN_ID=${RUN_ID}`);
  await ensureDir(REPORT_DIR);

  const layers = await loadLayers();
  if (!layers.length) { console.log('No lighthouse layers loaded.'); return; }
  console.log(`Lighthouse layers: ${layers.map(l => l.id).join(', ')}`);

  const lhr = await runLighthouse(BASE_URL + ROUTE, { formFactor: FORM_FACTOR });
  console.log(`Lighthouse done in ${((Date.now() - t0) / 1000).toFixed(1)}s · perfScore=${lhr.perfScore}`);

  const records = [];
  for (const layer of layers) {
    const ctx = { route: ROUTE, formFactor: FORM_FACTOR, lhr, baseUrl: BASE_URL };
    try {
      const result = await layer.evaluate(ctx);
      if (!result || result.pass) records.push({ id: layer.id, name: layer.name, severity: layer.severity, vp: FORM_FACTOR, route: ROUTE, status: 'PASS' });
      else if (result.fail) records.push({ id: layer.id, name: layer.name, severity: layer.severity, vp: FORM_FACTOR, route: ROUTE, status: 'FAIL', detail: result.detail, evidence: result.evidence });
      else records.push({ id: layer.id, name: layer.name, severity: layer.severity, vp: FORM_FACTOR, route: ROUTE, status: 'PASS' });
    } catch (e) {
      records.push({ id: layer.id, name: layer.name, severity: 'P2', vp: FORM_FACTOR, route: ROUTE, status: 'ERROR', detail: e.message });
    }
  }

  // Append: also persist the raw lhr so subsequent runs/triage can reference it
  await writeFile(join(REPORT_DIR, `lhr-${ROUTE.replace(/\//g, '_')}-${FORM_FACTOR}.json`), JSON.stringify(lhr, null, 2));
  await writeFile(join(REPORT_DIR, `findings-${ROUTE.replace(/\//g, '_')}-${FORM_FACTOR}.json`), JSON.stringify(records, null, 2));

  const fails = records.filter(r => r.status === 'FAIL').length;
  console.log(`DONE in ${((Date.now() - t0) / 1000).toFixed(1)}s · FAIL=${fails}`);
}

main().catch(e => { console.error(e); process.exit(1); });
