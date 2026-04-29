// Tamazia QA Runner · SITE-ONCE
// Runs every layer with runMode='site-once' or 'per-route' (one shot per route × VP1).
// For 'per-route' layers, iterates ROUTES.
//
// Outputs:
//   reports/<RUN_ID>/site-once/findings.json
//   reports/<RUN_ID>/site-once/report.md

import { chromium } from 'playwright';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { VIEWPORTS, ROUTES } from './viewports.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'https://tamazia-website.pages.dev';
const RUN_ID = process.env.RUN_ID || ('once-' + Date.now());
const REPORT_DIR = join(__dirname, 'reports', RUN_ID, 'site-once');

async function loadLayers() {
  const layersDir = join(__dirname, 'layers');
  const files = (await readdir(layersDir)).filter(f => /^L\d+.*\.js$/.test(f)).sort();
  const layers = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(layersDir, f)).href);
    if (mod.default) layers.push(mod.default);
  }
  return layers;
}

async function ensureDir(p) { await mkdir(p, { recursive: true }); }

async function main() {
  const t0 = Date.now();
  console.log(`SITE-ONCE · ${BASE_URL} · RUN_ID=${RUN_ID}`);
  await ensureDir(REPORT_DIR);

  const layers = await loadLayers();
  const onceLayers  = layers.filter(l => l.runMode === 'site-once');
  const routeLayers = layers.filter(l => l.runMode === 'per-route');
  console.log(`site-once: ${onceLayers.map(l => l.id).join(', ')}`);
  console.log(`per-route: ${routeLayers.map(l => l.id).join(', ')}`);

  const VP = VIEWPORTS[0]; // VP1 — by convention site-once + per-route use VP1
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: VP.width, height: VP.height },
    deviceScaleFactor: VP.deviceScaleFactor,
    isMobile: VP.isMobile,
    hasTouch: VP.hasTouch,
    userAgent: VP.userAgent || undefined,
  });
  const page = await ctx.newPage();
  const records = [];

  // site-once layers — run once at home
  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600);
  for (const layer of onceLayers) {
    const callCtx = { vp: VP, variant: { id: 'default' }, route: '/', url: BASE_URL + '/', browser, baseUrl: BASE_URL };
    try {
      const result = await layer.run(page, callCtx);
      records.push(toRecord(layer, '/', VP.id, result));
    } catch (e) {
      records.push({ id: layer.id, name: layer.name, severity: 'P2', vp: VP.id, route: '/', status: 'ERROR', detail: e.message });
    }
  }

  // per-route layers — run once per route at VP1
  for (const route of ROUTES) {
    let goErr = null;
    try {
      await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(600);
    } catch (e) { goErr = e.message; }
    if (goErr) { records.push({ id: 'L00-LOAD', name: 'Page load', severity: 'P0', vp: VP.id, route, status: 'FAIL', detail: goErr }); continue; }
    for (const layer of routeLayers) {
      const callCtx = { vp: VP, variant: { id: 'default' }, route, url: BASE_URL + route, browser, baseUrl: BASE_URL };
      try {
        const result = await layer.run(page, callCtx);
        records.push(toRecord(layer, route, VP.id, result));
      } catch (e) {
        records.push({ id: layer.id, name: layer.name, severity: 'P2', vp: VP.id, route, status: 'ERROR', detail: e.message });
      }
    }
  }

  await browser.close();

  await writeFile(join(REPORT_DIR, 'findings.json'), JSON.stringify(records, null, 2));
  let md = `# Tamazia QA · Site-Once + Per-Route\n\nBase: ${BASE_URL}\nRoutes: ${ROUTES.join(', ')}\n\n`;
  const fails = records.filter(r => r.status === 'FAIL');
  md += `## Summary\n- PASS: ${records.filter(r => r.status === 'PASS').length}\n- FAIL: ${fails.length}\n- SKIP: ${records.filter(r => r.status === 'SKIP').length}\n- ERROR: ${records.filter(r => r.status === 'ERROR').length}\n\n`;
  if (fails.length) {
    md += `## Failures\n`;
    for (const f of fails) {
      md += `\n### ${f.id} · ${f.severity} · ${f.route} · ${f.name || ''}\n- ${f.detail}\n`;
      if (f.evidence) md += `- Evidence: \`${(f.evidence + '').slice(0, 320)}\`\n`;
    }
  }
  await writeFile(join(REPORT_DIR, 'report.md'), md);

  console.log(`DONE in ${((Date.now() - t0) / 1000).toFixed(1)}s · FAIL=${fails.length}`);
  console.log(`REPORT: ${join(REPORT_DIR, 'report.md')}`);
}

function toRecord(layer, route, vp, result) {
  if (!result || result.pass) return { id: layer.id, name: layer.name, severity: layer.severity, vp, route, status: 'PASS' };
  if (result.skip) return { id: layer.id, name: layer.name, severity: layer.severity, vp, route, status: 'SKIP', detail: result.reason };
  if (result.fail) return { id: layer.id, name: layer.name, severity: layer.severity, vp, route, status: 'FAIL', detail: result.detail, evidence: result.evidence };
  return { id: layer.id, name: layer.name, severity: layer.severity, vp, route, status: 'PASS' };
}

main().catch(e => { console.error(e); process.exit(1); });
