// Helper: run Lighthouse against a URL and return parsed metrics.
// Lighthouse spawns its own Chromium. We point it at the same headless-shell
// binary Playwright already downloaded so we don't re-download.
//
// Usage:
//   import { runLighthouse } from '../lib/lighthouse-runner.js';
//   const m = await runLighthouse('https://tamazia-website.pages.dev/', { formFactor: 'mobile' });

import lighthouse from 'lighthouse';
import { launch as launchChrome } from 'chrome-launcher';
import { chromium } from 'playwright';

export async function runLighthouse(url, opts = {}) {
  const formFactor = opts.formFactor === 'mobile' ? 'mobile' : 'desktop';
  // Use the full Chromium binary (not headless-shell) for accurate Lighthouse metrics.
  // I extracted this to ~/.cache/ms-playwright/chromium-1217/chrome-linux/chrome earlier in this session.
  const fs = await import('fs');
  const path = await import('path');
  const fullChromium = path.join(process.env.HOME || '', '.cache/ms-playwright/chromium-1217/chrome-linux/chrome');
  const chromePath = fs.existsSync(fullChromium) ? fullChromium : chromium.executablePath();
  const chrome = await launchChrome({
    chromePath,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const cfg = formFactor === 'mobile' ? mobileConfig() : desktopConfig();
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance'],
      throttlingMethod: 'simulate',
      ...cfg,
    });
    const lhr = result.lhr;
    return {
      url,
      formFactor,
      audits: {
        lcp: pick(lhr, 'largest-contentful-paint'),
        fcp: pick(lhr, 'first-contentful-paint'),
        cls: pick(lhr, 'cumulative-layout-shift'),
        tbt: pick(lhr, 'total-blocking-time'),
        si:  pick(lhr, 'speed-index'),
        tti: pick(lhr, 'interactive'),
        srt: pick(lhr, 'server-response-time'),
      },
      perfScore: lhr.categories.performance ? lhr.categories.performance.score : null,
    };
  } finally {
    await chrome.kill();
  }
}

function pick(lhr, id) {
  const a = lhr.audits[id];
  if (!a) return null;
  return { value: a.numericValue, displayValue: a.displayValue, score: a.score };
}

function mobileConfig() {
  return {
    formFactor: 'mobile',
    screenEmulation: { mobile: true, width: 360, height: 800, deviceScaleFactor: 3, disabled: false },
    throttling: { rttMs: 150, throughputKbps: 1638.4, requestLatencyMs: 562.5, downloadThroughputKbps: 1474.56, uploadThroughputKbps: 675, cpuSlowdownMultiplier: 4 },
  };
}

function desktopConfig() {
  return {
    formFactor: 'desktop',
    screenEmulation: { mobile: false, width: 1920, height: 1080, deviceScaleFactor: 1, disabled: false },
    throttling: { rttMs: 40, throughputKbps: 10240, requestLatencyMs: 0, downloadThroughputKbps: 10240, uploadThroughputKbps: 10240, cpuSlowdownMultiplier: 1 },
  };
}
