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
      filter: (page) => !page.includes('/resources/') && !page.endsWith('/privacy/') && !page.endsWith('/privacy'),
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
