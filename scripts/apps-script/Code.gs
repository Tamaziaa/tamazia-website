/**
 * Tamazia Form Submissions · Google Apps Script Web App
 *
 * Auto-generated 2026-05-04 by Cowork session for Phase 3.
 *
 * Deployment:
 *   1. Open https://script.google.com → New project
 *   2. Replace Code.gs with this file
 *   3. Project Settings → Script Properties:
 *        SHEETS_HMAC_SECRET = (must match Cloudflare Pages env)
 *        RESEND_API_KEY     = re_... (same as CF Pages env)
 *        ALERT_TO           = realfamemedia@gmail.com
 *        AUTO_ACK_FROM      = "Tamazia <founder@tamazia.in>"
 *        SHEET_ID           = (Sheet ID of the bound spreadsheet)
 *   4. Deploy → New deployment → Web app
 *        executeAs: Me
 *        access:    Anyone
 *   5. Copy the deployment URL → CF Pages env SHEETS_WEBHOOK_URL
 *
 * Tabs expected on the Sheet:
 *   contact, briefings, audit, bookings, errors, health
 */

const TAB_HEADERS = [
  'submitted_at', 'tab_source', 'request_id', 'name', 'email', 'company',
  'phone', 'intent_text', 'consent_legal_basis', 'consent_timestamp',
  'ua', 'ip_country', 'ip_truncated', 'referer',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'honeypot_value', 'time_on_form_ms', 'form_version', 'notes'
];

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  const SECRET = props.getProperty('SHEETS_HMAC_SECRET');
  const SHEET_ID = props.getProperty('SHEET_ID');
  const ALERT_TO = props.getProperty('ALERT_TO') || 'realfamemedia@gmail.com';
  const AUTO_ACK_FROM = props.getProperty('AUTO_ACK_FROM') || 'Tamazia <founder@tamazia.in>';
  const RESEND_KEY = props.getProperty('RESEND_API_KEY');

  // 1. Verify HMAC
  const provided = (e.parameter.sig || '').trim();
  const raw = e.postData ? e.postData.contents : '';
  const expected = computeHmac(raw, SECRET);
  if (!provided || provided !== expected) {
    return jsonResponse(403, { ok: false, error: 'invalid_signature' });
  }

  // 2. Parse payload
  let payload;
  try { payload = JSON.parse(raw); } catch (err) {
    return jsonResponse(400, { ok: false, error: 'invalid_json' });
  }
  const tab_source = (payload.tab_source || 'contact').replace(/[^a-z]/gi, '');
  const request_id = payload.request_id || Utilities.getUuid();

  // 3. Idempotency · check bookings/contact/etc tabs for existing request_id
  const ss = SpreadsheetApp.openById(SHEET_ID);
  if (rowExists(ss, tab_source, request_id)) {
    return jsonResponse(200, { ok: true, request_id, deduped: true });
  }

  // 4. Append row
  try {
    appendRow(ss, tab_source, payload, request_id);
  } catch (err) {
    appendRow(ss, 'errors', { ...payload, notes: 'Sheet write failed: ' + err.message }, request_id);
    return jsonResponse(500, { ok: false, error: 'sheet_write_failed' });
  }

  // 5. Fire alert email (fire-and-forget · errors logged to errors tab)
  if (RESEND_KEY) {
    try {
      fireAlertEmail(RESEND_KEY, ALERT_TO, payload, tab_source, request_id);
    } catch (err) {
      appendRow(ss, 'errors', { ...payload, notes: 'Alert email failed: ' + err.message }, request_id);
    }
    // 6. Fire auto-ack to submitter
    if (payload.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      try {
        fireAutoAck(RESEND_KEY, AUTO_ACK_FROM, payload, request_id);
      } catch (err) {
        appendRow(ss, 'errors', { ...payload, notes: 'Auto-ack failed: ' + err.message }, request_id);
      }
    }
  }

  // 7. Bookings paired row
  if ((payload.intent_text || '').match(/\b(call|meeting|book|demo)\b/i)) {
    try {
      appendRow(ss, 'bookings', { ...payload, notes: 'Auto-paired from ' + tab_source }, request_id);
    } catch (err) { /* non-fatal */ }
  }

  return jsonResponse(200, { ok: true, request_id });
}

function doGet() {
  // Health probe path · responds for /api/health watchdog
  return jsonResponse(200, { ok: true, service: 'tamazia-forms-receiver', ts: new Date().toISOString() });
}

function appendRow(ss, tabName, payload, request_id) {
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(TAB_HEADERS);
    sheet.setFrozenRows(1);
  }
  const row = TAB_HEADERS.map(h => {
    if (h === 'submitted_at') return new Date().toISOString();
    if (h === 'tab_source') return tabName;
    if (h === 'request_id') return request_id;
    return payload[h] || '';
  });
  sheet.appendRow(row);
}

function rowExists(ss, tabName, request_id) {
  const sheet = ss.getSheetByName(tabName);
  if (!sheet) return false;
  const data = sheet.getRange(1, 3, sheet.getLastRow(), 1).getValues();
  return data.some(r => r[0] === request_id);
}

function computeHmac(raw, secret) {
  const sig = Utilities.computeHmacSha256Signature(raw, secret);
  return sig.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function jsonResponse(status, obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function fireAlertEmail(key, to, payload, tab_source, request_id) {
  const subject = '[Form: ' + tab_source + '] ' + (payload.name || 'unknown') + ' at ' + (payload.company || '');
  const body = '<h2 style="font-family:Georgia,serif">New ' + tab_source + ' submission</h2>'
    + '<p>Request ID <code>' + request_id + '</code></p>'
    + '<table style="border-collapse:collapse;font-family:system-ui;font-size:14px">'
    + Object.entries(payload).map(([k,v]) => '<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600">' + k + '</td><td style="padding:6px 12px">' + String(v).slice(0,500) + '</td></tr>').join('')
    + '</table>';
  UrlFetchApp.fetch('https://api.resend.com/emails', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    payload: JSON.stringify({
      from: 'Tamazia Forms <forms@tamazia.in>',
      to: [to],
      subject: subject,
      html: body
    }),
    muteHttpExceptions: true
  });
}

function fireAutoAck(key, from, payload, request_id) {
  const greeting = payload.name ? 'Hello ' + payload.name.split(' ')[0] + ',' : 'Hello,';
  const html = '<div style="font-family:Georgia,serif;color:#2A0C14;max-width:560px;line-height:1.5">'
    + '<p>' + greeting + '</p>'
    + '<p>Thank you for the enquiry. The brief is logged with us under reference <code>' + request_id.slice(0,8) + '</code> and a member of the Tamazia team will reply within one working day, UK time.</p>'
    + '<p>In the meantime, our recent work is collected at <a href="https://tamazia.co.uk/case-studies/">tamazia.co.uk/case-studies</a>. If your request is time-sensitive, write directly to founder@tamazia.co.uk and mark the subject line URGENT.</p>'
    + '<p>Best regards,<br>Aman Pareek<br>Founder, Tamazia</p>'
    + '<p style="font-size:12px;color:#5C4047;margin-top:32px">This is an automated acknowledgement of your form submission. Processed under UK GDPR Article 6(1)(f) Legitimate Interest. To opt out, reply STOP.</p>'
    + '</div>';
  UrlFetchApp.fetch('https://api.resend.com/emails', {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    payload: JSON.stringify({
      from: from,
      to: [payload.email],
      reply_to: 'founder@tamazia.co.uk',
      subject: 'We received your enquiry · Tamazia',
      html: html,
      headers: {
        'List-Unsubscribe': '<mailto:founder@tamazia.co.uk?subject=unsubscribe>, <https://tamazia.co.uk/api/list-unsubscribe?id=' + request_id + '>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    }),
    muteHttpExceptions: true
  });
}
