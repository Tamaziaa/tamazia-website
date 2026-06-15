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
      // S7[D45] · also exclude the two noindex DRAFT legal pages
      // (/legal/service-terms/, /legal/cold-outreach-privacy-notice/) so the sitemap
      // never advertises a noindex page. The other /legal/ pages (data-protection,
      // dpa, sub-processors) are indexable and stay in. /terms/ is the canonical terms URL.
      filter: (page) => !page.includes('/resources/') && !page.includes('/admin/') && !page.endsWith('/privacy/') && !page.endsWith('/privacy') && !page.endsWith('/erased/') && !page.endsWith('/unsubscribed/') && !page.endsWith('/dsar-confirm/') && !page.endsWith('/legal/service-terms/') && !page.endsWith('/legal/cold-outreach-privacy-notice/'),
      serialize(item) {
        // Phase 6 · per-route priority + changefreq
        const url = item.url;
        if (url.endsWith('/book/')) { item.priority = 0.9; item.changefreq = 'monthly'; }
        else if (url === 'https://tamazia.co.uk/' || url === 'https://tamazia.co.uk') { item.priority = 1.0; item.changefreq = 'weekly'; }
        else if (url.includes('/case-studies/')) { item.priority = 0.85; item.changefreq = 'monthly'; }
        else if (url.includes('/services/')) { item.priority = 0.85; item.changefreq = 'monthly'; }
        else if (url.endsWith('/about/')) { item.priority = 0.8; item.changefreq = 'monthly'; }
        else if (url.endsWith('/contact/')) { item.priority = 0.8; item.changefreq = 'monthly'; }
        else if (url.includes('/insights/')) { item.priority = 0.7; item.changefreq = 'weekly'; }
        else if (url.includes('/press/')) { item.priority = 0.6; item.changefreq = 'monthly'; }
        else if (url.endsWith('/terms/') || url.endsWith('/privacy-notice/') || url.endsWith('/cookie-policy/') || url.endsWith('/complaints/') || url.endsWith('/acceptable-use/') || url.endsWith('/modern-slavery-statement/') || url.endsWith('/security-policy/') || url.endsWith('/security-acknowledgments/')) { item.priority = 0.4; item.changefreq = 'yearly'; }
        else { item.priority = 0.5; item.changefreq = 'monthly'; }
        return item;
      },
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
