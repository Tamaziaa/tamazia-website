import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tamazia.co.uk',
  integrations: [
    sitemap({
      // Phase 0 (2026-05-04) · Exclude legacy /resources/ tree from sitemap.
      // _redirects path-301s every /resources/* request to /insights/:splat,
      // so even though the pages build into dist/, search engines see only the
      // canonical /insights/ tree.
      filter: (page) => !page.includes('/resources/') && !page.includes('/admin/') && !page.endsWith('/privacy/') && !page.endsWith('/privacy'),
      serialize(item) {
        // Phase 6 · per-route priority + changefreq
        const url = item.url;
        if (url.endsWith('/book/')) { item.priority = 0.9; item.changefreq = 'monthly'; }
        else if (url === 'https://tamazia.co.uk/') { item.priority = 1.0; item.changefreq = 'weekly'; }
        else if (url.includes('/case-studies/')) { item.priority = 0.85; item.changefreq = 'monthly'; }
        else if (url.includes('/services/')) { item.priority = 0.85; item.changefreq = 'monthly'; }
        else if (url.endsWith('/about/')) { item.priority = 0.8; item.changefreq = 'monthly'; }
        else if (url.endsWith('/contact/')) { item.priority = 0.8; item.changefreq = 'monthly'; }
        else if (url.includes('/insights/')) { item.priority = 0.7; item.changefreq = 'weekly'; }
        else if (url.includes('/press/')) { item.priority = 0.6; item.changefreq = 'monthly'; }
        else if (url.endsWith('/terms/') || url.endsWith('/privacy-notice/') || url.endsWith('/cookie-policy/') || url.endsWith('/complaints/') || url.endsWith('/acceptable-use/') || url.endsWith('/modern-slavery-statement/') || url.endsWith('/security-policy/') || url.endsWith('/security-acknowledgments/')) { item.priority = 0.4; item.changefreq = 'yearly'; }
        return item;
      },
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
