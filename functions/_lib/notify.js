// CF Pages notification helpers · Slack + Telegram
// Fail-open: any notification failure MUST NOT affect form persistence or response.
// Required env vars (all secrets, all optional · silent no-op if absent):
//   SLACK_BOT_TOKEN       xoxb-... bot token with chat:write
//   SLACK_CHANNEL         e.g. #all-tamazia (or channel ID Cxxx)
//   TELEGRAM_BOT_TOKEN    8864.../...
//   TELEGRAM_CHAT_ID      numeric founder chat

const SLACK_API = 'https://slack.com/api/chat.postMessage';

// level: 'p0' | 'p1' | 'p2' | 'info' | 'ok'
const ICON_SLACK = { p0: ':red_circle:', p1: ':warning:', p2: ':information_source:', info: ':bell:', ok: ':white_check_mark:' };
const ICON_TG    = { p0: '\u{1F534}', p1: '\u{26A0}\u{FE0F}', p2: '\u{2139}\u{FE0F}', info: '\u{1F514}', ok: '\u{2705}' };

export async function notifySlack(env, opts) {
  const { level = 'info', summary = '', detail = '', threadDetail = '', emoji = null } = opts || {};
  if (!env || !env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL) {
    console.error('[notify:slack] skipped · bot_token=' + !!(env && env.SLACK_BOT_TOKEN) + ' channel=' + !!(env && env.SLACK_CHANNEL));
    return null;
  }
  const icon = emoji || ICON_SLACK[level] || ':bell:';
  try {
    const resp = await fetch(SLACK_API, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.SLACK_BOT_TOKEN, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        channel: env.SLACK_CHANNEL,
        text: icon + ' ' + summary,
        unfurl_links: false,
        unfurl_media: false,
        blocks: (detail) ? [
          { type: 'section', text: { type: 'mrkdwn', text: '*' + icon + ' ' + escMd(summary) + '*' } },
          { type: 'section', text: { type: 'mrkdwn', text: detail.slice(0, 2900) } },
        ] : undefined,
      })
    });
    if (!resp.ok) { console.error('[notify:slack] HTTP ' + resp.status); return null; }
    const j = await resp.json().catch(() => ({}));
    if (!j.ok) console.error('[notify:slack] api error · ' + (j.error || 'unknown'));
    const ts = j && j.ts ? j.ts : null;
    if (ts && threadDetail) {
      await fetch(SLACK_API, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + env.SLACK_BOT_TOKEN, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          channel: env.SLACK_CHANNEL,
          thread_ts: ts,
          text: threadDetail.slice(0, 38000),
          unfurl_links: false,
          unfurl_media: false,
        })
      }).catch(() => {});
    }
    return ts;
  } catch (e) { return null; }
}

export async function notifyTelegram(env, opts) {
  const { level = 'info', summary = '', detail = '', emoji = null } = opts || {};
  if (!env || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.error('[notify:telegram] skipped · bot_token=' + !!(env && env.TELEGRAM_BOT_TOKEN) + ' chat_id=' + !!(env && env.TELEGRAM_CHAT_ID));
    return null;
  }
  const icon = emoji || ICON_TG[level] || '\u{1F514}';
  let text = icon + ' <b>' + escHtml(summary) + '</b>';
  if (detail) text += '\n\n' + detail;
  try {
    const resp = await fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: text.slice(0, 3900),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
    });
    if (!resp.ok) { let b = ''; try { b = await resp.text(); } catch (_e) {} console.error('[notify:telegram] HTTP ' + resp.status + ' ' + b.slice(0, 250)); }
    return resp.ok;
  } catch (e) { console.error('[notify:telegram] threw ' + (e && e.message)); return false; }
}

// Unified founder alert across ALL channels (Telegram + Slack + Resend email) in one call.
// Returns a SINGLE promise — the caller MUST register it with ctx.waitUntil() so it survives
// the response (a CF isolate is torn down on return, cancelling un-anchored fetches). Use this
// at every "a user connected with us" point so coverage is consistent and no channel is forgotten.
// Fail-open: a failure in any channel never throws to the caller.
// Strip HTML tags until the result is stable. A single-pass /<[^>]+>/g leaves nested
// constructs like "<<a>script>" collapsing back into "<script>", so loop to a fixed point.
function stripTags(s) {
  let out = String(s == null ? '' : s);
  for (;;) {
    const next = out.replace(/<[^<>]*>/g, '');
    if (next === out) return next;
    out = next;
  }
}

export function notifyFounder(env, opts) {
  const { level = 'info', summary = '', detailMd = '', detailTg = '', subject = '', html = '' } = opts || {};
  const tasks = [
    notifySlack(env, { level, summary, detail: detailMd || stripTags(detailTg || '') }),
    notifyTelegram(env, { level, summary, detail: detailTg || detailMd }),
  ];
  if (env && env.RESEND_API_KEY) {
    const body = html || ('<div style="font-family:system-ui;font-size:14px;line-height:1.5;white-space:pre-wrap">'
      + escHtml(summary) + '\n\n' + escHtml(stripTags(detailTg || detailMd)) + '</div>');
    tasks.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.RESEND_FROM_ALERT || 'Tamazia Forms <forms@tamazia.in>',
          to: [env.ALERT_TO || 'founder@tamazia.co.uk'],
          subject: subject || summary.slice(0, 140),
          html: body,
        }),
      }).then(async (r) => { if (!r.ok) { let b = ''; try { b = await r.text(); } catch (_e) {} console.error('[notifyFounder:resend] HTTP ' + r.status + ' ' + b.slice(0, 200)); } })
        .catch((e) => console.error('[notifyFounder:resend] threw ' + (e && e.message)))
    );
  }
  return Promise.allSettled(tasks);
}

// Compact journey context for form alerts (compact summary + detail blob)
export function buildJourneyContext(request, body) {
  const ref = (request.headers.get('referer') || '').slice(0, 200);
  const ua = (request.headers.get('user-agent') || '').slice(0, 220);
  const country = request.headers.get('cf-ipcountry') || '?';
  const ip4 = (request.headers.get('cf-connecting-ip') || '').replace(/\.\d+$/, '.x');
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const utmParts = utmKeys.map(k => body[k] || body[k.toUpperCase()] || '').filter(Boolean);
  const utm = utmParts.length ? utmParts.join(' / ') : '(no UTM)';
  const device = /mobile/i.test(ua) ? 'mobile' : 'desktop';
  return { ref, ua, country, ip4, utm, device };
}

// Helper: detect high-intent signals in a form payload (for routing decisions)
export function isHighIntent(body) {
  const blob = [body.message, body.brief, body.outcome, body.notes, body.company, body.sector]
    .filter(Boolean).join(' ').toLowerCase();
  const tokens = ['authority', 'enterprise', 'budget', 'urgent', 'asap', 'pre-ipo', 'ipo', 'magic circle', 'silver circle', 'fortune', 'ftse', 'nasdaq', 'nyse', 'multi-jurisdic', 'group', 'pivotal', 'regulator', 'compliance hold', 'sovereign'];
  return tokens.some(t => blob.includes(t));
}

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}
function escMd(s) {
  // Backslash MUST be in the same single pass (and escaped itself), otherwise an input
  // backslash can neutralise the escape we add for the following metacharacter.
  return String(s == null ? '' : s).replace(/[\\*_`<>&]/g, c => ({ '\\': '\\\\', '*': '\\*', '_': '\\_', '`': '\\`', '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}
