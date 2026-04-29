// Cloudflare Pages Function · /api/contact
// Receives contact form submissions, sends email via Resend.
// REQUIRED env var (set via Cloudflare dashboard → Pages → Settings → Environment variables):
//   RESEND_API_KEY = re_... (sign up at https://resend.com, free 3,000 emails/month)
//   CONTACT_TO     = realfamemedia@gmail.com (where briefing requests go)
//   CONTACT_FROM   = noreply@tamazia.in (sender address — must be verified domain in Resend)

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

  // Validate required fields
  const { name, email, company, role, sector, outcome } = body;
  if (!name || !email || !company || !sector) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: baseHeaders });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email format' }), { status: 400, headers: baseHeaders });
  }

  // Bot honeypot
  if (body['bot-field']) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: baseHeaders });
  }

  // Sanitise for HTML email
  const esc = (s) => String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));

  const subject = `[Tamazia briefing request] ${esc(name)} · ${esc(company)} · ${esc(sector)}`;
  const html = `
    <!DOCTYPE html>
    <html><body style="font-family: -apple-system, system-ui, sans-serif; color: #2A0C14; max-width: 640px; margin: 0 auto; padding: 32px;">
      <h1 style="font-family: Georgia, serif; font-weight: 500; color: #5A1A2B; border-bottom: 1px solid #C9A772; padding-bottom: 16px;">New briefing request</h1>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr><td style="padding: 8px 12px; background: #F4F0E8; font-weight: 600; width: 30%;">Name</td><td style="padding: 8px 12px;">${esc(name)}</td></tr>
        <tr><td style="padding: 8px 12px; background: #F4F0E8; font-weight: 600;">Email</td><td style="padding: 8px 12px;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        <tr><td style="padding: 8px 12px; background: #F4F0E8; font-weight: 600;">Company</td><td style="padding: 8px 12px;">${esc(company)}</td></tr>
        <tr><td style="padding: 8px 12px; background: #F4F0E8; font-weight: 600;">Role</td><td style="padding: 8px 12px;">${esc(role)}</td></tr>
        <tr><td style="padding: 8px 12px; background: #F4F0E8; font-weight: 600;">Sector</td><td style="padding: 8px 12px;">${esc(sector)}</td></tr>
        <tr><td style="padding: 8px 12px; background: #F4F0E8; font-weight: 600; vertical-align: top;">Primary outcome</td><td style="padding: 8px 12px; white-space: pre-wrap;">${esc(outcome)}</td></tr>
      </table>
      <p style="color: #4A1625; font-size: 13px; margin-top: 32px;">Submitted via tamazia.in contact form. Reply directly to this email — the from-address is set to the sender.</p>
    </body></html>
  `;

  // If RESEND_API_KEY missing, log to a basic acknowledge and return success (so form still works)
  if (!env.RESEND_API_KEY) {
    return new Response(JSON.stringify({
      ok: true,
      message: 'Briefing request received. (Email delivery pending Resend API key configuration.)',
      logged: true,
    }), { status: 200, headers: baseHeaders });
  }

  // Send via Resend API
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
        error: 'Email delivery failed. Please email us directly at realfamemedia@gmail.com.',
        debug: errText.slice(0, 200),
      }), { status: 502, headers: baseHeaders });
    }

    return new Response(JSON.stringify({
      ok: true,
      message: 'Your briefing request has been received. The founder will be in touch within 12 hours.',
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
