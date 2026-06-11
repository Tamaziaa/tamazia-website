// Remodel P0 · live-site baseline screenshots at the 10 canonical viewpoints.
// Usage: node _audit/tools/live-baseline.mjs [baseUrl] [outDir]
// Scrolls through each page first so IntersectionObserver reveals fire, waits for
// the typewriter, then captures a full-page screenshot.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.argv[2] || 'https://tamazia.co.uk';
const OUT = process.argv[3] || '_audit/baseline-screenshots/live';

const VIEWPOINTS = [
  { name: '320-mobile-se', width: 320, height: 568 },
  { name: '375-mobile-14', width: 375, height: 812 },
  { name: '430-mobile-14promax', width: 430, height: 932 },
  { name: '768-tablet', width: 768, height: 1024 },
  { name: '1024-tablet-ls', width: 1024, height: 768 },
  { name: '1280-laptop', width: 1280, height: 800 },
  { name: '1440-desktop', width: 1440, height: 900 },
  { name: '1920-desktop-lg', width: 1920, height: 1080 },
  { name: '2560-ultrawide', width: 2560, height: 1440 },
  { name: '1280-reduced-motion', width: 1280, height: 800, reducedMotion: 'reduce' },
];

const ROUTES = [
  { path: '/', slug: 'home' },
  { path: '/instrument/', slug: 'instrument' },
  { path: '/case-studies/cg-oncology/', slug: 'case-cgon' },
];

async function settle(page) {
  // Let fonts + first reveals land, give the typewriter time to finish.
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(6500);
  // Scroll through the page so every IO-gated reveal fires.
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(innerHeight * 0.6));
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 130));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 400));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
}

const browser = await chromium.launch();
for (const vp of VIEWPOINTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: vp.reducedMotion || 'no-preference',
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36 TamaziaBaselineBot',
  });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    // The case-study route only needs 3 representative widths.
    if (route.slug !== 'home' && ![375, 1280, 1440].includes(vp.width)) continue;
    try {
      await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await settle(page);
      await mkdir(OUT, { recursive: true });
      await page.screenshot({ path: `${OUT}/${route.slug}-${vp.name}.png`, fullPage: true });
      console.log(`ok  ${route.slug} @ ${vp.name}`);
    } catch (e) {
      console.error(`ERR ${route.slug} @ ${vp.name}: ${e.message.split('\n')[0]}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log('baseline complete');
