// Top 5 viewports per TAMAZIA-26 §4.
// Each crosses a different CSS breakpoint band so all layout rules are exercised.

export const VIEWPORTS = [
  { id: 'VP1', name: 'Mobile (360×800)',  width: 360,  height: 800,  isMobile: true,  hasTouch: true,  deviceScaleFactor: 3,  userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36' },
  { id: 'VP2', name: 'iPhone 14 (390×844)', width: 390,  height: 844,  isMobile: true,  hasTouch: true,  deviceScaleFactor: 3,  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1' },
  { id: 'VP3', name: 'iPad portrait (768×1024)', width: 768,  height: 1024, isMobile: true,  hasTouch: true,  deviceScaleFactor: 2,  userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1' },
  { id: 'VP4', name: 'HD laptop (1366×768)', width: 1366, height: 768,  isMobile: false, hasTouch: false, deviceScaleFactor: 1,  userAgent: '' },
  { id: 'VP5', name: 'Full HD desktop (1920×1080)', width: 1920, height: 1080, isMobile: false, hasTouch: false, deviceScaleFactor: 1,  userAgent: '' },
];

export const ROUTES = [
  '/',
  '/insights/',
  '/insights/legal/',
  '/insights/legal/sra-transparency-2026/',
];

export const STATE_VARIANTS = [
  { id: 'default',         emulate: () => ({}) },
  { id: 'reduced-motion',  emulate: () => ({ reducedMotion: 'reduce' }) },
  { id: 'forced-colors',   emulate: () => ({ forcedColors: 'active' }) },
];
