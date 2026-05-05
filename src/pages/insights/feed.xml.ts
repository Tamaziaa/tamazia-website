// /insights/feed.xml · RSS 2.0 feed of Tamazia insights
// Phase 6 perfection · 2026-05-04 · author + category + atom:self + category text
import rss from '@astrojs/rss';
import { insightPosts } from '../../content/insights';

export async function GET(context: any) {
  const site = context.site?.toString() || 'https://tamazia.co.uk/';
  const baseUrl = site.replace(/\/$/, '');

  const items = insightPosts
    .filter(p => p.status === 'published')
    .sort((a, b) => (b.publishedDate || '').localeCompare(a.publishedDate || ''))
    .map(p => ({
      title: p.title,
      link: `${baseUrl}/insights/${p.sectorSlug}/${p.slug}/`,
      pubDate: new Date(p.publishedDate || '2026-01-01'),
      description: p.excerpt,
      author: 'founder@tamazia.co.uk (Aman Pareek)',
      categories: [p.sector, p.regulator || ''].filter(Boolean),
      customData: `<dc:creator><![CDATA[Aman Pareek]]></dc:creator>` +
                  (p.regulator ? `<source url="${baseUrl}/insights/${p.sectorSlug}/">${p.regulator}</source>` : '')
    }));

  return rss({
    title: 'Tamazia Insights',
    description: 'Lawyer-led SEO and compliance content perspectives from Tamazia.',
    site,
    items,
    xmlns: { dc: 'http://purl.org/dc/elements/1.1/', atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>en-GB</language>
<copyright>© 2026 Tamazia. All rights reserved.</copyright>
<atom:link href="${baseUrl}/insights/feed.xml" rel="self" type="application/rss+xml" />
<webMaster>founder@tamazia.co.uk (Aman Pareek)</webMaster>
<managingEditor>founder@tamazia.co.uk (Aman Pareek)</managingEditor>
<image><url>${baseUrl}/og-default.png</url><title>Tamazia Insights</title><link>${baseUrl}/insights/</link></image>`
  });
}
