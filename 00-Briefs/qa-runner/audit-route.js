// Tamazia QA Runner · ROUTE-CHUNK
// Runs all DOM/static/AXE/NET layers (runMode: per-page or per-route) on ONE route across 5 viewports.
// Designed to fit in the 45s sandbox window. Sequence ROUTE runs to do a full audit.
// Layers with runMode 'lighthouse' or 'site-once' are skipped here.
//
// Outputs:
//   reports/<RUN_ID>/route-<route>/report.md
//   reports/<RUN_ID>/route-<route>/findings.json    ← merged by audit-merge.js

import { chromium } from 'playwright';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { VIEWPORTS } from './viewports.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'https://tamazia-website.pages.dev';
const ROUTE = process.env.ROUTE || '/';
const RUN_ID = process.env.RUN_ID || ('route-only-' + Date.now());
const REPORT_DIR = join(__dirname, 'reports', RUN_ID, 'route-' + ROUTE.replace(/\//g, '_'));

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

function shouldRun(layer, vp) {
  const mode = layer.runMode || 'per-page';
  if (mode === 'lighthouse' || mode === 'site-once') return false;
  if (mode === 'per-route') return vp.id === 'VP1';
  return true; // per-page
}

async function main() {
  const t0 = Date.now();
  console.log(`ROUTE-CHUNK · ${BASE_URL}${ROUTE} · RUN_ID=${RUN_ID}`);
  await ensureDir(REPORT_DIR);
  await ensureDir(join(REPORT_DIR, 'screenshots'));

  const layers = await loadLayers();
  console.log(`Loaded ${layers.length} layers.`);

  const browser = await chromium.launch({ headless: true });
  const records = []; // { id, name, severity, vp, route, status, detail, evidence }

  for (const vp of VIEWPORTS) {
    const ctxOpts = {
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      userAgent: vp.userAgent || undefined,
    };
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const url = BASE_URL + ROUTE;
    let loadError = null;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      // Let CSS paint, IntersectionObserver fire, fonts swap before running layers
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(600);
    } catch (e) { loadError = e.message; }
    if (loadError) {
      records.push({ id: 'L00-LOAD', name: 'Page load', severity: 'P0', vp: vp.id, route: ROUTE, status: 'FAIL', detail: `Page failed: ${loadError}` });
      await ctx.close();
      continue;
    }
    const tag = `${vp.id}-default-${ROUTE.replace(/\//g, '_') || 'home'}`;
    try { await page.screenshot({ path: join(REPORT_DIR, 'screenshots', `${tag}.png`), fullPage: true }); } catch {}

    for (const layer of layers) {
      const callCtx = { vp, variant: { id: 'default' }, route: ROUTE, url, browser, baseUrl: BASE_URL };
      if (!shouldRun(layer, vp)) {
        records.push({ id: layer.id, name: layer.name, severity: layer.severity, vp: vp.id, route: ROUTE, status: 'SKIP', detail: `runMode=${layer.runMode || 'per-page'} excludes this scope` });
        continue;
      }
      if (layer.skipOnRoute && layer.skipOnRoute.includes(ROUTE)) { records.push({ id: layer.id, name: layer.name, severity: layer.severity, vp: vp.id, route: ROUTE, status: 'SKIP', detail: 'skipOnRoute' }); continue; }
      try {
        const result = await layer.run(page, callCtx);
        if (!result || result.pass) {
          records.push({ id: layer.id, name: layer.name, severity: layer.severity, vp: vp.id, route: ROUTE, status: 'PASS' });
        } else if (result.skip) {
          records.push({ id: layer.id, name: layer.name, severity: layer.severity, vp: vp.id, route: ROUTE, status: 'SKIP', detail: result.reason });
        } else if (result.fail) {
          records.push({ id: layer.id, name: layer.name, severity: layer.severity, vp: vp.id, route: ROUTE, status: 'FAIL', detail: result.detail, evidence: result.evidence });
        } else {
          records.push({ id: layer.id, name: layer.name, severity: layer.severity, vp: vp.id, route: ROUTE, status: 'PASS' });
        }
      } catch (e) {
        records.push({ id: layer.id, name: layer.name, severity: 'P2', vp: vp.id, route: ROUTE, status: 'ERROR', detail: e.message });
      }
    }
    await ctx.close();
    console.log(`  ${vp.id}: ${((Date.now() - t0) / 1000).toFixed(1)}s elapsed`);
  }

  await browser.close();

  await writeFile(join(REPORT_DIR, 'findings.json'), JSON.stringify(records, null, 2));
  await writeFile(join(REPORT_DIR, 'report.md'), buildMarkdown(records, layers), 'utf8');

  const fails = records.filter(r => r.status === 'FAIL').length;
  const passes = records.filter(r => r.status === 'PASS').length;
  const skips = records.filter(r => r.status === 'SKIP').length;
  const errs = records.filter(r => r.status === 'ERROR').length;
  console.log(`DONE in ${((Date.now() - t0) / 1000).toFixed(1)}s · PASS=${passes} FAIL=${fails} SKIP=${skips} ERROR=${errs}`);
  console.log(`REPORT: ${join(REPORT_DIR, 'report.md')}`);
}

function buildMarkdown(records, layers) {
  let md = `# Tamazia QA · Route ${ROUTE}\n\nBase: ${BASE_URL}\nViewports: ${VIEWPORTS.map(v => v.id).join(', ')}\nLayers loaded: ${layers.length}\n\n`;
  const fails = records.filter(r => r.status === 'FAIL');
  const errs = records.filter(r => r.status === 'ERROR');
  md += `## Summary\n- PASS: ${records.filter(r => r.status === 'PASS').length}\n- FAIL: ${fails.length}\n- SKIP: ${records.filter(r => r.status === 'SKIP').length}\n- ERROR: ${errs.length}\n\n`;
  if (fails.length) {
    md += `## Failures\n`;
    for (const f of fails) {
      md += `\n### ${f.id} · ${f.severity} · ${f.vp} · ${f.name || ''}\n- ${f.detail}\n`;
      if (f.evidence) md += `- Evidence: \`${(f.evidence + '').slice(0, 320)}\`\n`;
    }
  }
  if (errs.length) {
    md += `\n## Errors (layer threw)\n`;
    for (const e of errs) md += `- ${e.id} ${e.vp}: ${e.detail}\n`;
  }
  md += `\n## Pass/Fail/Skip Matrix\n| Layer | ${VIEWPORTS.map(v => v.id).join(' | ')} |\n|---|${VIEWPORTS.map(() => '---').join('|')}|\n`;
  for (const layer of layers) {
    const row = VIEWPORTS.map(v => {
      const r = records.find(x => x.id === layer.id && x.vp === v.id);
      return r ? r.status : '—';
    });
    md += `| ${layer.id} | ${row.join(' | ')} |\n`;
  }
  return md;
}

main().catch(e => { console.error(e); process.exit(1); });
