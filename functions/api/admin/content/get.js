import { authed, unauth, json } from '../_lib.js';
import { ghRead } from '../_github.js';
const ALLOWED = [
  'src/content/hero.ts', 'src/content/pricing.ts', 'src/content/testimonials.ts',
  'src/content/whyUs.ts', 'src/content/sectors.ts', 'src/content/caseStudies.ts',
  'src/content/faq.ts', 'src/content/howWeWork.ts', 'src/content/footer.ts',
  'src/content/insights.ts', 'src/content/contact.ts', 'src/content/booking.ts',
  'src/components/sections/FinalHero.astro',
];
export const onRequestGet = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const url = new URL(request.url);
  const file = url.searchParams.get('file') || '';
  if (!ALLOWED.includes(file)) return json({ error: 'file not in allowlist', allowed: ALLOWED }, 400);
  try {
    const d = await ghRead(env, file);
    return json({ file, content: d.content, sha: d.sha, size: d.size });
  } catch (e) { return json({ error: e.message }, 500); }
};
