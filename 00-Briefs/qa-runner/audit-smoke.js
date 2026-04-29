// Tamazia QA Runner · SMOKE variant
// Subset of audit.js: 1 viewport (VP5 desktop), 1 route (/), default variant only.
// Used to prove the architecture end-to-end inside the 45s sandbox window.
// Same layer-loading + report-writing path as audit.js — only the matrix is smaller.

import { chromium } from 'playwright';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'https://tamazia-website.pages.dev';
const RUN_ID = 'smoke-' + new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_DIR = join(__dirname, 'reports', RUN_ID);

const VP = process.env.VP === 'VP5'
  ? { id: 'VP5', name: 'Full HD desktop (1920×1080)', width: 1920, height: 1080, isMobile: false, hasTouch: false, deviceScaleFactor: 1 }
  : { id: 'VP1', name: 'Mobile (360×800)', width: 360, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 3 };
const ROUTE = '/';

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
  console.log(`SMOKE RUN · ${BASE_URL} · ${VP.id} · ${ROUTE}`);
  await ensureDir(REPORT_DIR);
  await ensureDir(join(REPORT_DIR, 'screenshots'));

  const layers = await loadLayers();
  console.log(`Loaded ${layers.length} layers: ${layers.map(l => l.id).join(', ')}`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: VP.width, height: VP.height },
    deviceScaleFactor: VP.deviceScaleFactor,
    isMobile: VP.isMobile,
    hasTouch: VP.hasTouch,
  });
  const page = await ctx.newPage();
  const url = BASE_URL + ROUTE;
  const findings = [];
  const passes = [];

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.screenshot({ path: join(REPORT_DIR, 'screenshots', `${VP.id}-default-home.png`), fullPage: true });

  for (const layer of layers) {
    try {
      const result = await layer.run(page, { vp: VP, variant: { id: 'default' }, route: ROUTE, url, browser, baseUrl: BASE_URL });
      if (result && result.fail) {
        findings.push({ id: layer.id, name: layer.name, severity: layer.severity, detail: result.detail, evidence: result.evidence });
        console.log(`  FAIL  ${layer.id}: ${result.detail}`);
      } else {
        passes.push({ id: layer.id, name: layer.name });
        console.log(`  PASS  ${layer.id} ${layer.name || ''}`);
      }
    } catch (e) {
      findings.push({ id: layer.id, name: layer.name, severity: 'P2', detail: `Layer threw: ${e.message}` });
      console.log(`  ERR   ${layer.id}: ${e.message}`);
    }
  }

  await browser.close();

  let md = `# Tamazia QA SMOKE Report · ${RUN_ID}\n\n`;
  md += `Base: ${BASE_URL}\nViewport: ${VP.id} · Route: ${ROUTE}\nLayers run: ${layers.length}\n\n`;
  md += `## Summary\n- Pass: ${passes.length}\n- Fail: ${findings.length}\n\n`;
  md += `## Passes\n`;
  for (const p of passes) md += `- ${p.id} · ${p.name || ''}\n`;
  md += `\n## Findings\n`;
  if (!findings.length) md += `_None_\n`;
  for (const f of findings) {
    md += `\n### ${f.id} · ${f.severity} · ${f.name || ''}\n- ${f.detail}\n`;
    if (f.evidence) md += `- Evidence: \`${f.evidence}\`\n`;
  }
  await writeFile(join(REPORT_DIR, 'report.md'), md, 'utf8');
  console.log(`\nREPORT: ${join(REPORT_DIR, 'report.md')}`);
  console.log(`PASS=${passes.length}  FAIL=${findings.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
