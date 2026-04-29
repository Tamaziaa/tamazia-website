// Tamazia QA Runner · entry point
// Runs all 50 layers across 5 viewports, writes report + screenshots.
//
// Usage: node audit.js [--base-url=https://tamazia-website.pages.dev]
//
// Output: reports/<ISO-timestamp>/{report.md, screenshots/, raw/}

import { chromium } from 'playwright';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { VIEWPORTS, ROUTES, STATE_VARIANTS } from './viewports.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'https://tamazia-website.pages.dev';
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_DIR = join(__dirname, 'reports', RUN_ID);

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
  console.log(`\n=== TAMAZIA QA RUNNER ===`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Run ID: ${RUN_ID}\n`);

  await ensureDir(REPORT_DIR);
  await ensureDir(join(REPORT_DIR, 'screenshots'));
  await ensureDir(join(REPORT_DIR, 'raw'));

  const layers = await loadLayers();
  console.log(`Loaded ${layers.length} layers.\n`);

  const browser = await chromium.launch({ headless: true });
  const findings = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Viewport ${vp.id}: ${vp.name} ---`);
    for (const variant of STATE_VARIANTS) {
      // Variants only run at VP1 + VP5 (boundary viewports) per TAMAZIA-26
      if (variant.id !== 'default' && vp.id !== 'VP1' && vp.id !== 'VP5') continue;
      const ctxOpts = {
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        userAgent: vp.userAgent || undefined,
        ...variant.emulate(),
      };
      const ctx = await browser.newContext(ctxOpts);
      const page = await ctx.newPage();

      for (const route of ROUTES) {
        const url = BASE_URL + route;
        const tag = `${vp.id}-${variant.id}-${route.replace(/\//g, '_') || 'home'}`;
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        } catch (e) {
          findings.push({ layer: 'L00-LOAD', vp: vp.id, variant: variant.id, route, severity: 'P0', detail: `Page failed to load: ${e.message}` });
          continue;
        }
        // Screenshot full page
        const shotPath = join(REPORT_DIR, 'screenshots', `${tag}.png`);
        try { await page.screenshot({ path: shotPath, fullPage: true }); } catch (e) { console.log(`  screenshot failed: ${e.message}`); }

        // Run every layer
        for (const layer of layers) {
          if (layer.skipOnVariant && layer.skipOnVariant.includes(variant.id)) continue;
          if (layer.skipOnRoute && layer.skipOnRoute.includes(route)) continue;
          try {
            const result = await layer.run(page, { vp, variant, route, url, browser, baseUrl: BASE_URL });
            if (result && result.fail) {
              findings.push({ layer: layer.id, name: layer.name, vp: vp.id, variant: variant.id, route, severity: layer.severity, detail: result.detail, evidence: result.evidence });
            }
          } catch (e) {
            findings.push({ layer: layer.id, name: layer.name, vp: vp.id, variant: variant.id, route, severity: 'P2', detail: `Layer threw: ${e.message}` });
          }
        }
      }

      await ctx.close();
      console.log(`  ${vp.id}/${variant.id}: ${findings.length} cumulative findings`);
    }
  }

  await browser.close();

  // Write report.md
  const grouped = groupBy(findings, f => f.severity);
  const order = ['P0', 'P1', 'P2', 'P3'];
  let md = `# Tamazia QA Report · ${RUN_ID}\n\n`;
  md += `Base URL: ${BASE_URL}\n\n`;
  md += `Layers: ${layers.length} · Viewports: ${VIEWPORTS.length} · Variants: ${STATE_VARIANTS.length}\n\n`;
  md += `## Summary\n\n`;
  for (const s of order) {
    md += `- **${s}**: ${(grouped[s] || []).length} finding(s)\n`;
  }
  md += `\n## Findings\n\n`;
  for (const s of order) {
    const items = grouped[s] || [];
    if (!items.length) continue;
    md += `### ${s}\n\n`;
    for (const f of items) {
      md += `- **${f.layer}** ${f.name || ''} · ${f.vp}/${f.variant}/${f.route}\n`;
      md += `  - ${f.detail}\n`;
      if (f.evidence) md += `  - Evidence: ${f.evidence}\n`;
    }
    md += `\n`;
  }
  await writeFile(join(REPORT_DIR, 'report.md'), md, 'utf8');

  console.log(`\n=== DONE ===`);
  console.log(`Report: ${join(REPORT_DIR, 'report.md')}`);
  console.log(`Screenshots: ${join(REPORT_DIR, 'screenshots')}`);
  console.log(`Findings: P0=${(grouped.P0||[]).length} P1=${(grouped.P1||[]).length} P2=${(grouped.P2||[]).length} P3=${(grouped.P3||[]).length}\n`);
}

function groupBy(arr, fn) {
  return arr.reduce((acc, x) => { const k = fn(x); (acc[k] = acc[k] || []).push(x); return acc; }, {});
}

main().catch(e => { console.error(e); process.exit(1); });
