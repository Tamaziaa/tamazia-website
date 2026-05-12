import { test, expect } from '@playwright/test';
const BREAKPOINTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-414', width: 414, height: 896 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];
const ROUTES = ['/', '/pricing', '/contact', '/case-studies/cg-oncology', '/services'];

for (const route of ROUTES) {
  for (const bp of BREAKPOINTS) {
    test(`${route} @ ${bp.name} — overflow audit`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('http://localhost:4321' + route, { waitUntil: 'networkidle' });
      const overflows = await page.evaluate(() => {
        const elements = [...document.querySelectorAll<HTMLElement>('*')];
        return elements
          .filter(el => {
            const cs = getComputedStyle(el);
            if (cs.overflow !== 'visible') return false;
            return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
          })
          .map(el => ({
            tag: el.tagName,
            cls: el.className?.toString?.()?.slice(0, 60) || '',
            id: el.id || '',
            sw: el.scrollWidth, cw: el.clientWidth,
            sh: el.scrollHeight, ch: el.clientHeight,
          }))
          .slice(0, 20);
      });
      if (overflows.length > 0) {
        console.error('OVERFLOW DETECTED:', overflows);
      }
      expect(overflows.length, `Overflow elements at ${bp.name}`).toBeLessThan(3);
    });

    test(`${route} @ ${bp.name} — screenshot baseline`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('http://localhost:4321' + route, { waitUntil: 'networkidle' });
      await expect(page).toHaveScreenshot(`${route.replace(/\//g, '_') || 'home'}-${bp.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.005,
      });
    });
  }
}
