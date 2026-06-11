// Remodel P2 · consolidates _audit/raw/remodel-audit.json into the three audit docs.
import { readFileSync, writeFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync('_audit/raw/remodel-audit.json', 'utf8'));
const keys = Object.keys(raw);
const stamp = process.argv[2] || 'baseline';

const sev = (s) => ({ C: 'CRITICAL', H: 'HIGH', M: 'MEDIUM', L: 'LOW' }[s]);

// ---------- visual-audit.md ----------
let v = `# Visual audit · ${stamp}\n\nRoutes × viewpoints collected: ${keys.length}\n`;
let totalOverflow = 0, totalContrast = 0, totalTouch = 0;
for (const k of keys) {
  const d = raw[k];
  const issues = [];
  if (d.overflow.length) { totalOverflow += d.overflow.length; issues.push(`- **${sev('C')}** overflow ×${d.overflow.length}: ${d.overflow.slice(0, 5).map(o => `${o.sel}(→${o.right ?? o.scrollW}px)`).join(', ')}`); }
  if (d.contrast.length) { totalContrast += d.contrast.length; issues.push(`- **${sev('H')}** contrast<AA ×${d.contrast.length}: ${d.contrast.slice(0, 4).map(c => `"${c.text.slice(0, 24)}" ${c.ratio}:1 (needs ${c.min})`).join(' · ')}`); }
  const vpW = parseInt(k.split('@')[1]);
  if (vpW <= 430 && d.touch.length) { totalTouch += d.touch.length; issues.push(`- **${sev('M')}** touch<44px ×${d.touch.length}: ${d.touch.slice(0, 5).map(t => `"${t.label.slice(0, 18)}" ${t.w}×${t.h}`).join(' · ')}`); }
  if (d.images.length) issues.push(`- **${sev('M')}** aspect-distorted imgs: ${d.images.map(i => i.src).join(', ')}`);
  if (d.h1s !== 1 && k.startsWith('/@')) issues.push(`- **${sev('H')}** h1 count = ${d.h1s} (must be 1)`);
  if (issues.length) v += `\n## ${k}\n${issues.join('\n')}\n`;
}
v += `\n## Totals\n- overflow findings: ${totalOverflow}\n- contrast<AA findings: ${totalContrast}\n- touch-target findings (≤430px): ${totalTouch}\n`;
writeFileSync(`_audit/visual-audit${stamp === 'baseline' ? '' : '-' + stamp}.md`, v);

// ---------- space-audit.md ----------
let s = `# Space audit · ${stamp}\n`;
for (const k of keys.filter(k => k.startsWith('/@'))) {
  const d = raw[k];
  s += `\n## ${k}\n`;
  s += `hero: ${d.hero ? `${d.hero.heightPx}px tall, fills ${d.hero.heroVsViewport}% of first viewport` : 'n/a'}\n`;
  if (d.founderBox) s += `founder box: pill ${d.founderBox.pillW}×${d.founderBox.pillH}px in row ${d.founderBox.rowW}px → leftGap ${d.founderBox.leftGap}px, rightGap ${d.founderBox.rightGap}px${d.founderBox.rightGap > 120 ? ' ← DEAD SPACE' : ''}\n`;
  s += `| section | pt | pb | height | content els |\n|---|---|---|---|---|\n`;
  for (const sec of d.sections) {
    const flag = (sec.pt > 120 || sec.pb > 120) ? ' ⚠️>120' : '';
    const empty = sec.kids < 3 && sec.h > 120 ? ' ⚠️near-empty' : '';
    s += `| ${sec.id}${flag}${empty} | ${sec.pt} | ${sec.pb} | ${sec.h} | ${sec.kids} |\n`;
  }
}
writeFileSync(`_audit/space-audit${stamp === 'baseline' ? '' : '-' + stamp}.md`, s);

// ---------- typography-audit.md ----------
let t = `# Typography audit · ${stamp}\n`;
for (const k of keys.filter(k => ['/@375', '/@1440'].includes(k))) {
  const d = raw[k];
  t += `\n## ${k} — distinct text styles: ${d.typography.length}\n`;
  if (d.smallBody.length) t += `**body <16px on mobile** ×${d.smallBody.length}: ${d.smallBody.slice(0, 6).map(b => `${b.fs}px "${b.sample.slice(0, 24)}"`).join(' · ')}\n`;
  t += `| tag | size | weight | line-h | letter-sp | family | uses | sample |\n|---|---|---|---|---|---|---|---|\n`;
  for (const ty of d.typography.slice(0, 45)) t += `| ${ty.tag} | ${ty.fs} | ${ty.fw} | ${ty.lh} | ${ty.ls} | ${ty.ff} | ${ty.count} | ${ty.sample.replace(/\|/g, '/')} |\n`;
}
writeFileSync(`_audit/typography-audit${stamp === 'baseline' ? '' : '-' + stamp}.md`, t);

console.log(`consolidated → _audit/{visual,space,typography}-audit${stamp === 'baseline' ? '' : '-' + stamp}.md`);
console.log(`totals: overflow=${totalOverflow} contrast=${totalContrast} touch=${totalTouch}`);
