#!/usr/bin/env node
/* ============================================================
   npm test — the whole gate fleet, in one command.

   Until now this repo had NO test script: the suites under tests/ were run one
   file at a time by hand, and CI (.github/workflows/deploy.yml) named only two
   of the _qa harnesses. A gate nobody can run in one command is a gate that
   drifts. This runs every one of them and exits non-zero if any fails.

   Order is cheapest-first, so a font-token slip or a syntax error surfaces
   before the jsdom harnesses spend a minute rendering 19 audits.

     npm test                  everything
     node tests/run-all.mjs    the same
   ============================================================ */
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const unitTests = readdirSync(HERE).filter((f) => f.endsWith('.test.mjs')).sort()
  .map((f) => ['tests/' + f, []]);

const JOBS = [
  ['tests/font-guard.mjs', []],                 // v2 font tokens (Y1/Y2)
  ...unitTests,                                 // every tests/*.test.mjs
  ['_qa/qa_render.mjs', []],                    // jsdom render, 0 issues required (deploy.yml gate)
  ['_qa/backtest.mjs', ['--max-bugs=0']],       // 78 checks x 19 audits (deploy.yml gate)
  ['_qa/qa_lux.mjs', []],
  ['_qa/qa_v11.mjs', []],
  ['_qa/qa_breach_guards.mjs', []],
  ['_qa/qa_voluntary_fine.mjs', []],
  ['_qa/qa_xss.mjs', []],
  ['_qa/qa_legal.mjs', []],
];

const failed = [];
for (const [script, args] of JOBS) {
  const r = spawnSync(process.execPath, [path.join(ROOT, script), ...args], { cwd: ROOT, encoding: 'utf8' });
  const ok = r.status === 0;
  if (!ok) {
    failed.push(script);
    // Print the whole thing on failure: a summary line is useless when you need the assertion.
    process.stdout.write('\n===== FAIL ' + script + ' =====\n' + (r.stdout || '') + (r.stderr || '') + '\n');
  }
  console.log((ok ? 'PASS  ' : 'FAIL  ') + script + (args.length ? ' ' + args.join(' ') : ''));
}

console.log('\n' + (JOBS.length - failed.length) + '/' + JOBS.length + ' gates passed');
if (failed.length) {
  console.error('FAILED: ' + failed.join(', '));
  process.exit(1);
}
