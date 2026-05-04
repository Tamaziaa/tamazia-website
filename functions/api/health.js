// Cloudflare Pages Function · /api/health
// Phase 0 addition (2026-05-04) · synthetic health endpoint for monitoring tools.
// Returns 200 with version, timestamp, and a boolean for each expected env var.
// Never exposes secret values · only existence flags.

export const onRequestGet = async ({ env }) => {
  return new Response(
    JSON.stringify({
      ok: true,
      service: 'tamazia-website',
      version: '2026.05.04',
      timestamp: new Date().toISOString(),
      env_present: {
        RESEND_API_KEY: !!env.RESEND_API_KEY,
        CONTACT_FROM: !!env.CONTACT_FROM,
        CONTACT_TO: !!env.CONTACT_TO,
        SEO_SCORE_API_KEY: !!env.SEO_SCORE_API_KEY,
      },
    }, null, 2),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};

export const onRequestHead = async () => new Response(null, { status: 200 });
