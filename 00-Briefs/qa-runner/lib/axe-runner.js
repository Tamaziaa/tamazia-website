// Helper: inject axe-core into a Playwright page and return violations.
// Usage:
//   import { runAxe } from '../lib/axe-runner.js';
//   const violations = await runAxe(page, { runOnly: ['color-contrast'] });

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedAxeSrc = null;
async function getAxeSrc() {
  if (cachedAxeSrc) return cachedAxeSrc;
  const path = join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js');
  cachedAxeSrc = await readFile(path, 'utf8');
  return cachedAxeSrc;
}

export async function runAxe(page, opts = {}) {
  const src = await getAxeSrc();
  await page.evaluate(src);
  const cfg = { resultTypes: ['violations'] };
  if (opts.runOnly) cfg.runOnly = { type: 'rule', values: opts.runOnly };
  if (opts.disableRules) cfg.rules = Object.fromEntries(opts.disableRules.map(r => [r, { enabled: false }]));
  const result = await page.evaluate(async (cfg) => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, cfg);
    return { violations: r.violations, incomplete: r.incomplete };
  }, cfg);
  return result;
}

// Convenience: convert axe violations to a single fail-detail string.
export function summariseViolations(violations) {
  if (!violations || !violations.length) return null;
  const lines = violations.map(v => {
    const targets = v.nodes.slice(0, 3).map(n => (n.target || []).join(' '));
    return `${v.id}: ${v.help} [${v.nodes.length} node(s)] ${targets.join(' | ')}`;
  });
  return lines.join(' || ');
}
