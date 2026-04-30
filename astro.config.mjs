import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tamazia.co.uk',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
