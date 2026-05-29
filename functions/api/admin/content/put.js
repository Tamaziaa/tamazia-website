import { authed, unauth, json } from '../_lib.js';
import { ghWrite } from '../_github.js';
const ALLOWED = [
  'src/content/hero.ts', 'src/content/pricing.ts', 'src/content/testimonials.ts',
  'src/content/whyUs.ts', 'src/content/sectors.ts', 'src/content/caseStudies.ts',
  'src/content/faq.ts', 'src/content/howWeWork.ts', 'src/content/footer.ts',
  'src/content/insights.ts', 'src/content/contact.ts', 'src/content/booking.ts',
  'src/components/sections/FinalHero.astro',
];
export const onRequestPost = async ({ request, env }) => {
  if (!authed(request, env)) return unauth();
  const body = await request.json().catch(() => ({}));
  const { file, content, sha, message } = body || {};
  if (!ALLOWED.includes(file)) return json({ error: 'file not in allowlist', allowed: ALLOWED }, 400);
  if (typeof content !== 'string' || content.length < 10) return json({ error: 'content missing' }, 400);
  // em-dash safety (matches patch-dist gate 6)
  const stripped = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  if (stripped.includes('—')) return json({ error: 'em-dash detected outside comments · use interpunct ·' }, 422);
  try {
    const res = await ghWrite(env, file, content, message || 'cockpit edit · ' + file, sha);
    return json({ ok: true, commit: res.commit?.sha, html_url: res.commit?.html_url });
  } catch (e) { return json({ error: e.message }, 500); }
};
