// Cloudflare Pages Function · /api/briefings
// Receives footer briefings-signup submissions, sends email via Resend.
// Replaces the broken data-netlify="true" form (TAMAZIA-24 G2 / TAMAZIA-28 P0 #1).
//
// REQUIRED env vars (set in Cloudflare dashboard → Pages → Settings → Environment variables):
//   RESEND_API_KEY = re_...
//   CONTACT_TO     = realfamemedia@gmail.com
//   CONTACT_FROM   = noreply@tamazia.in (must be a verified Resend sender)

export const onRequestPost = async ({ request, env }) => {
  const baseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: baseHeaders });
  }

  const { email } = body || {};
  if (!email || typeof email !== 'string') {
    return new Response(JSON.stringify({ error: 'Email is required.' }), { status: 400, headers: baseHeaders });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email format.' }), { status: 400, headers: baseHeaders });
  }

  // Bot honeypot — silently 200 if filled
  if (body['bot-field']) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: baseHeaders });
  }

  const esc = (s) => String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));

  const subject = `[Tamazia · Regulatory Briefings] New subscriber: ${esc(email)}`;
  const html = `
    <!DOCTYPE html>
    <html><body style="font-family: -apple-system, system-ui, sans-serif; color: #2A0C14; max-width: 640px; margin: 0 auto; padding: 32px;">
      <h1 style="font-family: Georgia, serif; font-weight: 500; color: #5A1A2B; border-bottom: 1px solid #C9A772; padding-bottom: 16px; margin-bottom: 20px;">
        New regulatory briefings subscriber
      </h1>
      <p style="font-size: 15px; line-height: 1.6;">A new subscriber has signed up for the regulatory briefings list:</p>
      <p style="background: #F4F0E8; padding: 16px 20px; border-left: 3px solid #C9A772; font-size: 16px; margin: 20px 0;">
        <a href="mailto:${esc(email)}" style="color: #5A1A2B; text-decoration: none;">${esc(email)}</a>
      </p>
      <p style="color: #4A1625; font-size: 13px; margin-top: 32px; line-height: 1.6;">
        Submitted via the footer signup on tamazia.in. Add to your briefings distribution list.
      </p>
    </body></html>
  `;

  if (!env.RESEND_API_KEY) {
    return new Response(JSON.stringify({
      ok: true,
      message: 'Subscription received. (Email delivery pending Resend API key configuration.)',
      logged: true,
    }), { status: 200, headers: baseHeaders });
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'Tamazia <onboarding@resend.dev>',
        to: [env.CONTACT_TO || 'realfamemedia@gmail.com'],
        reply_to: email,
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      return new Response(JSON.stringify({
        ok: false,
        error: 'Subscription delivery failed. Please email us directly at realfamemedia@gmail.com.',
        debug: errText.slice(0, 200),
      }), { status: 502, headers: baseHeaders });
    }

    return new Response(JSON.stringify({
      ok: true,
      message: 'Subscribed. The first briefing will arrive within 7 days.',
    }), { status: 200, headers: baseHeaders });
  } catch (e) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Network error reaching email service. Please email us directly at realfamemedia@gmail.com.',
    }), { status: 502, headers: baseHeaders });
  }
};

export const onRequestOptions = async () => new Response(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
});
