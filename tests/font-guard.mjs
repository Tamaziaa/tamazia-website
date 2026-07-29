#!/usr/bin/env node
/* ============================================================
   FONT GUARD — REPORT-SPEC Y1/Y2.
   Fails when any font-size in the v2 render layer is not bound to one of the
   EIGHT R2 tokens. Mirrors the patch-dist.js gate style already used in the
   website repo: exit 1 on a violation, print file:line and the offending text.

     node tests/font-guard.mjs
     npm test                     (runs it with the rest of the suite)

   Ported from AUDIT-FINAL/04-prototype/verify/font-guard.mjs. The ONLY change is
   the scope: it reads the four v2 files as they land in this repo, at
   public/audit/, and it deliberately does NOT look at the v1 render layer —
   v1 predates the token system and is not being retrofitted here.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '../public/audit');

export const TOKENS = ['--fs-label','--fs-caption','--fs-body-sm','--fs-body',
                       '--fs-h3','--fs-h2','--fs-h1','--fs-display'];

/* The ONLY exemptions, per C §9 fix 3: three gauge/dial internals whose size is
   legitimately proportional to the SVG box they are drawn inside. Anything else
   that wants a size must take a token. */
export const SVG_EXEMPT = [
  'font-size:${Math.round(size*.3)}px',   // audit-charts-v2.js gauge() grade numeral
  'font-size:${size*.2}px',               // audit-charts-v2.js dial() "n/a" numeral
  'font-size:${size*.28}px',              // audit-charts-v2.js dial() value numeral
];

const FILES = ['audit-v2.css','audit-app-v2.js','audit-charts-v2.js','copy-v2.js'];

export function scan(dir = V2){
  const violations = [];
  const seenExempt = new Set();
  for (const f of FILES){
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) { violations.push({file:f, line:0, text:'MISSING FILE'}); continue; }
    const lines = fs.readFileSync(p,'utf8').split('\n');
    lines.forEach((line, i) => {
      // `\$\{...\}px` is matched first so a template expression is not cut at its own brace
      const re = /font-size\s*:\s*(\$\{[^}]*\}px|[^;"'}\n]+)/g;
      let m;
      while ((m = re.exec(line)) !== null){
        const decl = ('font-size:' + m[1]).replace(/\s+/g,'');
        const exempt = SVG_EXEMPT.find(x => decl === x.replace(/\s+/g,''));
        if (exempt) { seenExempt.add(exempt); continue; }
        const val = m[1].trim().replace(/\s*!important$/,'');   // !important is orthogonal to the token rule
        const tokenMatch = /^var\(\s*(--fs-[a-z0-9-]+)\s*\)$/.exec(val);
        if (tokenMatch && TOKENS.includes(tokenMatch[1])) continue;
        violations.push({ file:f, line:i+1, text:('font-size:'+val).slice(0,120) });
      }
    });
  }
  return { violations, exemptionsUsed:[...seenExempt] };
}

if (import.meta.url === `file://${process.argv[1]}`){
  const { violations, exemptionsUsed } = scan();
  const isMain = true;
  if (violations.length){
    console.error('FONT GUARD FAILED — ' + violations.length + ' font-size declaration(s) outside the eight tokens:');
    for (const v of violations) console.error('  ' + v.file + ':' + v.line + '  ' + v.text);
    console.error('\nAllowed: ' + TOKENS.join(' '));
    console.error('Exempt (SVG-proportional only): ' + SVG_EXEMPT.join(' | '));
    process.exit(1);
  }
  console.log('FONT GUARD PASS — every font-size in render/v2 is bound to one of the 8 tokens.');
  console.log('  tokens: ' + TOKENS.join(' '));
  console.log('  SVG exemptions used: ' + (exemptionsUsed.length ? exemptionsUsed.join(' | ') : 'none'));
  void isMain;
}
