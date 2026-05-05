#!/usr/bin/env node
// Phase 7.4 · OG image generator · Tamazia 2026
//
// Strategy: emit per-page OG cards as SVG (1200×630), then convert to PNG
// at build time using @resvg/resvg-js. SVG sources stay in repo for review;
// PNG outputs go to dist/og/<slug>.png so the BaseLayout ogImage prop can
// reference a stable URL.
//
// Templates live in scripts/og-templates/ and are filled at build time.
// Currently: default, book, press, article, service, case-study.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
// async wrapper required for top-level await

import { join, dirname } from 'node:path';

const TEMPLATES = {
  default: {
    eyebrow: 'INTERNATIONAL SEO · REGULATED ENTERPRISES',
    title: 'Tamazia',
    subtitle: 'Lawyer-led SEO and regulatory compliance.',
    accent: 'Ranking is only valuable if it is legal.',
  },
  book: {
    eyebrow: 'CALL · 30 MINUTES',
    title: 'Book a Strategy Call',
    subtitle: 'Direct line to the founder of Tamazia.',
    accent: '/book/',
  },
  press: {
    eyebrow: 'PRESS · TAMAZIA',
    title: 'Press Kit',
    subtitle: 'Brand assets, boilerplate, founder bio.',
    accent: '/press/',
  },
  article: {
    eyebrow: 'INSIGHT · TAMAZIA',
    title: '{{title}}',
    subtitle: '{{sector}} · {{regulator}}',
    accent: 'tamazia.co.uk',
  },
  service: {
    eyebrow: 'SERVICE · TAMAZIA',
    title: '{{title}}',
    subtitle: '{{sector}} · regulator-compliant SEO',
    accent: '/services/',
  },
  caseStudy: {
    eyebrow: 'CASE STUDY · TAMAZIA',
    title: '{{title}}',
    subtitle: '{{result}}',
    accent: 'tamazia.co.uk',
  },
};

const COLORS = {
  bg: '#FAF7F2',          // ivory
  oxblood: '#5A1A2B',
  ink: '#2A0C14',
  gold: '#C9A772',
  rule: '#E5DDCB',
};

function svgTemplate({ eyebrow, title, subtitle, accent, type }) {
  const titleSize = title.length > 40 ? 56 : (title.length > 25 ? 68 : 84);
  const subtitleLines = wrapText(subtitle, 62);
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .eyebrow { font: 600 18px/1 'Inter', sans-serif; letter-spacing: 0.18em; fill: ${COLORS.oxblood}; }
      .title { font: 500 ${titleSize}px/1.05 'Playfair Display', Georgia, serif; fill: ${COLORS.ink}; }
      .subtitle { font: 400 26px/1.4 'Inter', sans-serif; fill: #4A1625; }
      .accent { font: italic 600 22px/1 'Playfair Display', serif; fill: ${COLORS.oxblood}; }
      .lockup { font: 700 28px/1 'Playfair Display', serif; letter-spacing: 0.06em; fill: ${COLORS.ink}; }
      .url { font: 500 16px/1 'Inter', sans-serif; letter-spacing: 0.08em; fill: ${COLORS.oxblood}; }
    </style>
  </defs>
  <rect width="1200" height="630" fill="${COLORS.bg}"/>
  <rect x="0" y="0" width="1200" height="6" fill="${COLORS.oxblood}"/>
  <rect x="60" y="60" width="1080" height="510" fill="none" stroke="${COLORS.rule}" stroke-width="1"/>
  <text x="100" y="120" class="lockup">TAMAZIA</text>
  <line x1="100" y1="140" x2="180" y2="140" stroke="${COLORS.gold}" stroke-width="1.5"/>
  <text x="100" y="180" class="eyebrow">${escape(eyebrow)}</text>
  <text x="100" y="${280}" class="title">${escape(title)}</text>
  ${subtitleLines.map((line, i) => `<text x="100" y="${360 + i * 36}" class="subtitle">${escape(line)}</text>`).join('\n  ')}
  <text x="100" y="540" class="accent">${escape(accent)}</text>
  <text x="1100" y="540" class="url" text-anchor="end">tamazia.co.uk</text>
</svg>`;
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxChars) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const OUT_DIR = join(process.cwd(), 'public', 'og');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// Generate static templates
const STATIC = [
  { slug: 'default', tpl: TEMPLATES.default, type: 'default' },
  { slug: 'book',    tpl: TEMPLATES.book,    type: 'book' },
  { slug: 'press',   tpl: TEMPLATES.press,   type: 'press' },
];

let count = 0;
for (const { slug, tpl, type } of STATIC) {
  const svg = svgTemplate({ ...tpl, type });
  writeFileSync(join(OUT_DIR, `${slug}.svg`), svg);
  count++;
}

// Generate per-insight + per-case-study + per-service from content files
try {
  const insightsRaw = readFileSync(join(process.cwd(), 'src/content/insights.ts'), 'utf8');
  // Extract published slugs + titles via regex (avoid importing TS at runtime)
  const slugTitleRe = /slug:\s*'([^']+)'[\s\S]*?title:\s*"([^"]+)"[\s\S]*?sector:\s*'([^']+)'[\s\S]*?regulator:\s*'([^']+)'[\s\S]*?status:\s*'(published|in-preparation)'/g;
  let m;
  while ((m = slugTitleRe.exec(insightsRaw)) !== null) {
    if (m[5] !== 'published') continue;
    const tpl = TEMPLATES.article;
    const svg = svgTemplate({
      eyebrow: tpl.eyebrow,
      title: m[2].length > 60 ? m[2].slice(0, 57) + '…' : m[2],
      subtitle: `${m[3]} · ${m[4]}`,
      accent: tpl.accent,
      type: 'article',
    });
    writeFileSync(join(OUT_DIR, `insight-${m[1]}.svg`), svg);
    count++;
  }
} catch (e) {
  console.error('og · insights extraction skipped:', e.message);
}

// SVG → PNG conversion using sharp (best-effort; SVGs serve as fallback)
try {
  const sharpMod = await import('sharp');
  const sharp = sharpMod.default;
  const { readdirSync } = await import('node:fs');
  const svgs = readdirSync(OUT_DIR).filter(f => f.endsWith('.svg'));
  let pngCount = 0;
  for (const svg of svgs) {
    const svgPath = join(OUT_DIR, svg);
    const pngPath = svgPath.replace(/\.svg$/, '.png');
    try {
      await sharp(svgPath).png({ quality: 90, compressionLevel: 9 }).toFile(pngPath);
      pngCount++;
    } catch (e) {
      console.error(`og · sharp failed on ${svg}: ${e.message}`);
    }
  }
  console.log(`og · converted ${pngCount}/${svgs.length} SVG → PNG via sharp`);
} catch (e) {
  console.error('og · sharp not available, SVG-only:', e.message);
}

console.log(`og · generated ${count} OG images in public/og/`);
