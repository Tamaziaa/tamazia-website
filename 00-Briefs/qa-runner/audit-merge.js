// Tamazia QA Runner · MERGE
// Combines all chunk findings.json under reports/<RUN_ID>/ into one master report.

import { readFile, readdir, writeFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUN_ID = process.env.RUN_ID;
if (!RUN_ID) { console.error('RUN_ID env var required'); process.exit(1); }
const ROOT = join(__dirname, 'reports', RUN_ID);

async function walk(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (/findings.*\.json$/.test(e.name)) out.push(p);
  }
  return out;
}

async function main() {
  await stat(ROOT).catch(() => { console.error('Run dir not found:', ROOT); process.exit(1); });
  const files = await walk(ROOT);
  const all = [];
  for (const f of files) {
    try {
      const arr = JSON.parse(await readFile(f, 'utf8'));
      if (Array.isArray(arr)) all.push(...arr);
    } catch (e) { console.warn('Skip', f, e.message); }
  }

  const fails = all.filter(r => r.status === 'FAIL');
  const errs = all.filter(r => r.status === 'ERROR');
  const passes = all.filter(r => r.status === 'PASS');
  const skips = all.filter(r => r.status === 'SKIP');

  // Group failures by severity then layer
  const bySev = { P0: [], P1: [], P2: [], P3: [] };
  for (const f of fails) (bySev[f.severity] = bySev[f.severity] || []).push(f);

  // Collapse duplicate (layer, detail) pairs across viewports/routes
  function collapseAcrossScopes(arr) {
    const map = new Map();
    for (const f of arr) {
      const key = f.id + '||' + (f.detail || '');
      if (!map.has(key)) map.set(key, { ...f, scopes: new Set() });
      map.get(key).scopes.add(`${f.vp || '-'}/${f.route || '-'}`);
    }
    return [...map.values()].map(x => ({ ...x, scopes: [...x.scopes] }));
  }

  let md = `# Tamazia QA · Master Report\n\nRun ID: ${RUN_ID}\nGenerated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n- Total checks: ${all.length}\n- PASS: ${passes.length}\n- FAIL: ${fails.length}\n- SKIP: ${skips.length}\n- ERROR: ${errs.length}\n\n`;
  md += `### Failures by severity\n`;
  for (const s of ['P0', 'P1', 'P2', 'P3']) md += `- **${s}**: ${(bySev[s] || []).length} finding(s)\n`;
  md += `\n`;

  for (const sev of ['P0', 'P1', 'P2', 'P3']) {
    const items = collapseAcrossScopes(bySev[sev] || []);
    if (!items.length) continue;
    md += `## ${sev} (${items.length} unique)\n`;
    for (const it of items) {
      md += `\n### ${it.id} · ${it.name || ''}\n`;
      md += `- Scope: ${it.scopes.join(', ')}\n`;
      md += `- Detail: ${it.detail}\n`;
      if (it.evidence) md += `- Evidence: \`${(it.evidence + '').slice(0, 320)}\`\n`;
    }
    md += `\n`;
  }

  if (errs.length) {
    md += `## Layer errors\n`;
    for (const e of errs.slice(0, 30)) md += `- ${e.id} · ${e.vp}/${e.route}: ${e.detail}\n`;
  }

  await writeFile(join(ROOT, 'master-report.md'), md, 'utf8');
  await writeFile(join(ROOT, 'master-findings.json'), JSON.stringify(all, null, 2));
  console.log('Master report:', join(ROOT, 'master-report.md'));
  console.log(`P0=${(bySev.P0||[]).length} P1=${(bySev.P1||[]).length} P2=${(bySev.P2||[]).length} P3=${(bySev.P3||[]).length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
