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
  if (!env || !env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL) return null;
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
    if (!resp.ok) return null;
    const j = await resp.json().catch(() => ({}));
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
  if (!env || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return null;
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
    return resp.ok;
  } catch (e) { return false; }
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
  return String(s == null ? '' : s).replace(/[*_`<>&]/g, c => ({ '*': '\\*', '_': '\\_', '`': '\\`', '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}
