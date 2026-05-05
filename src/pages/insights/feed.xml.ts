// /insights/feed.xml · RSS 2.0 feed of Tamazia insights
// Phase 4 perfection · 2026-05-05
import rss from '@astrojs/rss';

export async function GET(context: any) {
  // Glob all insights pages and emit as feed items
  const insightsModules = import.meta.glob('./*/index.astro', { eager: true });
  const items = Object.entries(insightsModules)
    .filter(([path]) => !path.endsWith('/index.astro') || path !== './index.astro')
    .map(([path, mod]: any) => {
      const slug = path.replace(/^\.\/(.+?)\/index\.astro$/, '$1');
      const fm = mod?.frontmatter || mod?.default?.frontmatter || {};
      return {
        title: fm.title || slug,
        link: '/insights/' + slug + '/',
        pubDate: fm.pubDate ? new Date(fm.pubDate) : new Date('2026-01-01'),
        description: fm.description || ''
      };
    });

  return rss({
    title: 'Tamazia Insights',
    description: 'Lawyer-led SEO and compliance content perspectives from Tamazia',
    site: context.site || 'https://tamazia.co.uk',
    items,
    customData: '<language>en-GB</language><copyright>© 2026 Tamazia. All rights reserved.</copyright>'
  });
}
