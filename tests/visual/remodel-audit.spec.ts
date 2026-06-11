/**
 * Remodel P2 · data-collection audit at the 10 canonical viewpoints.
 * This spec RECORDS findings (overflow, contrast, touch targets, space,
 * typography) into _audit/raw/*.json — it only hard-fails on harness errors,
 * never on findings, so a single run yields the complete picture.
 * Consolidation: node _audit/tools/consolidate-audit.mjs
 */
import { test, chromium, type Browser } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const VIEWPOINTS = [
  { name: '320', width: 320, height: 568 },
  { name: '375', width: 375, height: 812 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
  { name: '2560', width: 2560, height: 1440 },
  { name: '1280rm', width: 1280, height: 800, reducedMotion: 'reduce' as const },
];

const ROUTES = ['/', '/instrument/', '/case-studies/cg-oncology/'];

// Everything below runs inside the page.
const COLLECT = `(() => {
  const out = { overflow: [], touch: [], contrast: [], sections: [], typography: [], h1s: 0, smallBody: [], hero: null, founderBox: null, images: [] };
  const vw = innerWidth, vh = innerHeight;

  // ---- overflow ----
  const docW = document.documentElement.scrollWidth;
  if (docW > vw + 1) out.overflow.push({ sel: 'document', scrollW: docW, vw });
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > vw + 8 && cs.overflowX !== 'hidden' && cs.position !== 'fixed') {
      const tag = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '');
      if (out.overflow.length < 25) out.overflow.push({ sel: tag, right: Math.round(r.right), vw });
    }
  }

  // ---- touch targets (only meaningful at narrow widths; recorded always) ----
  for (const el of document.querySelectorAll('a, button, [role="button"], input, select, summary')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width < 44 || r.height < 44) {
      const label = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40);
      if (label && out.touch.length < 40) out.touch.push({ label, w: Math.round(r.width), h: Math.round(r.height), tag: el.tagName.toLowerCase() });
    }
  }

  // ---- contrast (WCAG AA) ----
  const lum = (r, g, b) => { const f = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const parse = s => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const effBg = el => { let n = el; while (n && n !== document.documentElement) { const bg = parse(getComputedStyle(n).backgroundColor); if (bg && bg.a > 0.9) return bg; n = n.parentElement; } return { r: 250, g: 247, b: 242, a: 1 }; };
  const seen = new Set();
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,a,span,li,button,blockquote,cite,dt,dd,label,summary')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.45) continue;
    const txt = (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) ? el.textContent.trim() : '';
    if (!txt) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const fg = parse(cs.color); if (!fg) continue;
    const bg = effBg(el);
    const L1 = lum(fg.r, fg.g, fg.b), L2 = lum(bg.r, bg.g, bg.b);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const fs = parseFloat(cs.fontSize);
    const big = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700);
    const min = big ? 3 : 4.5;
    if (ratio < min) {
      const key = txt.slice(0, 30) + '|' + Math.round(ratio * 10);
      if (!seen.has(key) && out.contrast.length < 40) { seen.add(key); out.contrast.push({ text: txt.slice(0, 50), ratio: Math.round(ratio * 100) / 100, min, fs: Math.round(fs), color: cs.color, bg: 'rgb(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ')' }); }
    }
  }

  // ---- sections / space audit ----
  for (const s of document.querySelectorAll('main section, main > div, footer')) {
    const cs = getComputedStyle(s);
    if (cs.display === 'none') continue;
    const r = s.getBoundingClientRect();
    if (r.height < 10) continue;
    const kids = [...s.querySelectorAll('h1,h2,h3,p,li,img,svg,form,blockquote,button,a')].filter(k => { const kr = k.getBoundingClientRect(); return kr.width > 0 && kr.height > 0; }).length;
    out.sections.push({ id: s.id || s.className.toString().split(' ')[0] || s.tagName, pt: Math.round(parseFloat(cs.paddingTop)), pb: Math.round(parseFloat(cs.paddingBottom)), h: Math.round(r.height), kids });
  }

  // ---- hero density ----
  const hero = document.querySelector('.tz-mhero, main section');
  if (hero) {
    const hr = hero.getBoundingClientRect();
    let contentArea = 0;
    for (const el of hero.querySelectorAll('h1,h2,p,span,img,a,blockquote,div.tz-founder-pill')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.top < vh) contentArea += Math.min(r.width, vw) * Math.min(r.height, vh) / 4;
    }
    out.hero = { heightPx: Math.round(hr.height), viewportH: vh, heroVsViewport: Math.round((Math.min(hr.height, vh) / vh) * 100) };
  }

  // ---- founder box dead space ----
  const pill = document.querySelector('.tz-founder-pill');
  const row = document.querySelector('.tz-founder-cta-row');
  if (pill && row) {
    const pr = pill.getBoundingClientRect(), rr = row.getBoundingClientRect();
    out.founderBox = { pillW: Math.round(pr.width), rowW: Math.round(rr.width), leftGap: Math.round(pr.left - rr.left), rightGap: Math.round(rr.right - pr.right), pillH: Math.round(pr.height) };
  }

  // ---- typography map ----
  out.h1s = document.querySelectorAll('h1').length;
  const typoSeen = new Map();
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,a,li,blockquote,cite,button,span.emph,div')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const key = el.tagName + '|' + cs.fontSize + '|' + cs.fontWeight + '|' + cs.lineHeight + '|' + cs.letterSpacing + '|' + cs.fontFamily.split(',')[0];
    if (!typoSeen.has(key)) typoSeen.set(key, { tag: el.tagName.toLowerCase(), fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, ff: cs.fontFamily.split(',')[0].replace(/"/g, ''), sample: el.textContent.trim().slice(0, 30), count: 0 });
    typoSeen.get(key).count++;
    const fs = parseFloat(cs.fontSize);
    if (el.tagName === 'P' && fs < 16 && vw <= 430 && out.smallBody.length < 15) out.smallBody.push({ fs: Math.round(fs * 10) / 10, sample: el.textContent.trim().slice(0, 40) });
  }
  out.typography = [...typoSeen.values()].sort((a, b) => b.count - a.count).slice(0, 60);

  // ---- images ----
  for (const img of document.querySelectorAll('img')) {
    const r = img.getBoundingClientRect();
    if (r.width === 0) continue;
    const natural = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0;
    const displayed = r.width / Math.max(r.height, 1);
    if (natural && Math.abs(natural - displayed) > 0.12 && getComputedStyle(img).objectFit === 'fill') {
      out.images.push({ src: (img.currentSrc || img.src).split('/').pop(), natural: Math.round(natural * 100) / 100, displayed: Math.round(displayed * 100) / 100 });
    }
  }
  return out;
})()`;

test('remodel audit · all viewpoints', async () => {
  test.setTimeout(15 * 60_000);
  mkdirSync('_audit/raw', { recursive: true });
  const browser: Browser = await chromium.launch();
  const results: Record<string, unknown> = {};

  for (const vp of VIEWPOINTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: vp.reducedMotion ?? 'no-preference',
    });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      if (route !== '/' && !['375', '1280', '1440'].includes(vp.name)) continue;
      await page.goto(route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(vp.reducedMotion ? 1500 : 7000);
      await page.evaluate(async () => {
        const step = Math.max(300, Math.floor(innerHeight * 0.6));
        for (let y = 0; y <= document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 110));
        }
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 350));
      });
      const data = await page.evaluate(COLLECT);
      results[`${route}@${vp.name}`] = data;
      console.log(`collected ${route} @ ${vp.name}`);
    }
    await ctx.close();
  }
  await browser.close();
  writeFileSync('_audit/raw/remodel-audit.json', JSON.stringify(results, null, 1));
});
