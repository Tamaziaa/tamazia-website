// /api/briefings · Phase 3+7 · KV-backed receiver with email validation
// Shared form receiver · KV storage + Resend transactional + idempotency + validator chain
// Replaces the Apps Script dependency completely.

import { validateEmail, shouldRejectEmail } from '../_lib/email-validator.js';
import { mintRequestId } from '../_lib/request-id.js';
import { verifyTurnstile } from '../_lib/turnstile.js';
import { syncLeadToNeon } from '../_lib/neon-sync.js';
import { notifySlack, notifyTelegram, buildJourneyContext, isHighIntent } from '../_lib/notify.js';

export async function handleSubmission(request, env, tab) {
  const baseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store'
  };

  let body;
  try { body = await request.json(); } catch {
    return json({ error: 'invalid_json' }, 400, baseHeaders);
  }

  if (body['bot-field'] || body.honeypot_value || body.c_website_2 || body.c_homepage_url) {
    return json({ ok: true, silent: true }, 200, baseHeaders);
  }
  const formAge = body.ts_form_open ? (Date.now() - Number(body.ts_form_open)) : 0;
  const MAX_FORM_AGE_MS = 30 * 60 * 1000;
  if (body.ts_form_open && formAge < 2000) {
    return json({ ok: true, silent: true }, 200, baseHeaders);
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return json({ error: 'invalid_email' }, 400, baseHeaders);
  }

  // Email validator chain · ZeroBounce → Hunter → NeverBounce · fail-open
  const validation = await validateEmail(body.email, env);
  const reject = shouldRejectEmail(validation, env);
  if (reject.reject) {
    return json({ error: reject.reason }, 422, baseHeaders);
  }

  // Phase 12 · server-mints request_id (ignores client-supplied to prevent spoof)
  const request_id = await mintRequestId(env);
  const submitted_at = new Date().toISOString();

  if (env.FORM_SUBMISSIONS) {
    const existing = await env.FORM_SUBMISSIONS.get(`${tab}:${request_id}`);
    if (existing) {
      return json({ ok: true, request_id, deduped: true }, 200, baseHeaders);
    }
    const record = {
      ...body,
      tab_source: tab,
      request_id,
      submitted_at,
      email_validation: validation,
      ip_country: request.headers.get('cf-ipcountry') || '',
      ip_truncated: (request.headers.get('cf-connecting-ip') || '').replace(/\.\d+$/, '.x'),
      ua: request.headers.get('user-agent') || '',
      referer: request.headers.get('referer') || ''
    };
    await env.FORM_SUBMISSIONS.put(`${tab}:${request_id}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 365 * 2
    });
    // Phase 12 · email-briefings: reverse index for O(1) unsubscribe lookup
    if (record.email) {
      await env.FORM_SUBMISSIONS.put(
        `email-briefings:${record.email.toLowerCase()}:${request_id}`,
        JSON.stringify({ kv_key: `${tab}:${request_id}`, indexed_at: new Date().toISOString() }),
        { expirationTtl: 60 * 60 * 24 * 365 * 2 }
      );
    }
  }

  const sideEffects = [];
  sideEffects.push(syncLeadToNeon(env, tab, body, request_id));
  if (env.RESEND_API_KEY) {
    sideEffects.push(fireAlert(env, tab, body, request_id));
    sideEffects.push(fireAutoAck(env, body, request_id));
  }
  // sweep-4 · Slack + Telegram founder alerts (fail-open, no impact on response)
  const ctx = buildJourneyContext(request, body);
  const intent = isHighIntent(body);
  const intentTag = intent ? ' · *HIGH-INTENT*' : '';
  const personLine = (body.name || 'unknown') + ' · ' + (body.company || '(no company)') + ' · ' + (body.email || '');
  const summary = '[' + tab + '] ' + personLine + intentTag;
  const detailMd = [
    '*Sector:* ' + (body.sector || '?'),
    '*Country/IP:* ' + ctx.country + ' · ' + ctx.ip4 + ' · ' + ctx.device,
    '*Source:* ' + (ctx.ref || '(direct)'),
    '*UTM:* ' + ctx.utm,
    '*Request ID:* ' + request_id,
  ].join('\n');
  const tgDetail = [
    '<b>Sector:</b> ' + (body.sector || '?'),
    '<b>Country:</b> ' + ctx.country + ' · ' + ctx.ip4 + ' · ' + ctx.device,
    '<b>Source:</b> ' + (ctx.ref || '(direct)'),
    '<b>UTM:</b> ' + ctx.utm,
    '<b>Request ID:</b> <code>' + request_id + '</code>',
    body.message || body.brief || body.outcome ? '\n<b>Brief:</b> ' + String(body.message || body.brief || body.outcome).slice(0, 800) : '',
  ].filter(Boolean).join('\n');
  const fullPayload = Object.entries(body).filter(([k, v]) => v && !k.startsWith('c_') && !k.startsWith('ts_') && k !== 'bot-field' && k !== 'honeypot_value').map(([k, v]) => k + ': ' + String(v).slice(0, 400)).join('\n');
  sideEffects.push(notifySlack(env, { level: intent ? 'p1' : 'info', summary, detail: detailMd, threadDetail: 'Full payload\n' + fullPayload }));
  sideEffects.push(notifyTelegram(env, { level: intent ? 'p1' : 'info', summary, detail: tgDetail }));
  Promise.allSettled(sideEffects).catch(() => {});

  baseHeaders['Set-Cookie'] = 'tamazia_last_request_id=' + request_id + '; Path=/; Max-Age=2592000; SameSite=Strict; Secure; HttpOnly';
  return json({ ok: true, request_id, message: 'Brief received. Reply within one working day.' }, 200, baseHeaders);
}

async function fireAlert(env, tab, body, request_id) {
  const html = `<h2 style="font-family:Georgia,serif">New ${tab} submission</h2>
    <p>Request <code>${request_id}</code></p>
    <table style="border-collapse:collapse;font-family:system-ui;font-size:14px">${
      Object.entries(body).map(([k,v]) => `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">${esc(k)}</td><td style="padding:6px 12px">${esc(String(v).slice(0,500))}</td></tr>`).join('')
    }</table>`;
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.RESEND_FROM_ALERT || 'Tamazia Forms <forms@tamazia.in>',
      to: [env.ALERT_TO || 'realfamemedia@gmail.com'],
      subject: `[Form: ${tab}] ${body.name || 'unknown'} at ${body.company || ''}`,
      html
    })
  });
}

async function fireAutoAck(env, body, request_id) {
  const greeting = body.name ? 'Hello ' + String(body.name).split(' ')[0] + ',' : 'Hello,';
  const html = `<div style="font-family:Georgia,serif;color:#2A0C14;max-width:560px;line-height:1.5">
    <p>${esc(greeting)}</p>
    <p>Thank you for the enquiry. The brief is logged with us under reference <code>${request_id.slice(0,8)}</code> and a member of the Tamazia team will reply within one working day, UK time.</p>
    <p>Recent work is collected at <a href="https://tamazia.co.uk/case-studies/">tamazia.co.uk/case-studies</a>. If your request is time-sensitive, write directly to founder@tamazia.co.uk and mark the subject line URGENT.</p>
    <p>Best regards,<br>Aman Pareek<br>Founder, Tamazia</p>
    <p style="font-size:12px;color:#5C4047;margin-top:32px">This is an automated acknowledgement of your form submission. Processed under UK GDPR Article 6(1)(f) Legitimate Interest.</p>
  </div>`;
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.RESEND_FROM_ACK || 'Tamazia <founder@tamazia.in>',
      to: [body.email],
      reply_to: env.RESEND_REPLY_TO || 'founder@tamazia.co.uk',
      subject: 'We received your enquiry · Tamazia',
      html,
      headers: {
        'List-Unsubscribe': `<mailto:founder@tamazia.co.uk?subject=unsubscribe>, <https://tamazia.co.uk/api/list-unsubscribe?id=${request_id}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    })
  });
}

function esc(s) {
  return String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers });
}

export const onRequestPost = ({ request, env }) => handleSubmission(request, env, 'briefings');
export const onRequestOptions = () => new Response(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});
