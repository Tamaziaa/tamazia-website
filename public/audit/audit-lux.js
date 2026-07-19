/* ============================================================
   TAMAZIA AUDIT · LUX (contract-v1.1) client renderer.
   Builds the report into #app from window.P (the RAW v1.1 payload the engine
   composed render-ready): B3 the left rail, then B1 the verdict band, B4 the
   exposure waterfall, B2 the per-finding law cards (evidence-left, action-right),
   and the pinned not-legal-advice line.

   HONESTY CONTRACT (every rule is load-bearing, the truth-pack re-matches this page):
   · Rule 1 · read the payload, re-derive nothing. The only presentation counting is
               splitting findings by their own `state` for the verdict sentence (B1),
               and reading array LENGTHS (pages_checked, searched_patterns) for a
               coverage_proof card, both of which the brief sanctions.
   · B2 · each finding renders one law card. Evidence is a verbatim evidence_quote when
               present, else an artifact summary built only from artifact fields (a
               dom_node shows selector + clipped snippet; a network_event shows host +
               name; a coverage_proof shows the pages-checked + searched-patterns counts).
               A real enforcement case renders only when the payload carries enforcement[]
               (never filler · C-115). A fix renders only when carried, else a neutral line.
   · B3 · the rail prints the three honest numbers verbatim (frameworksAssessed with
               screenedLabel, frameworksBinding, rulesChecked · C-117/C-118), real
               scroll-derived reading progress, jump links, the pinned notLegalAdvice line
               and ONE calm mailto CTA with no countdown, scarcity or invented price
               (C-200 / DMCCA).
   · Rule 2 · every rendered fine, regulator and law-name traces to a payload field.
               No hardcoded law/regulator/amount anywhere in this file.
   · C-094/096 · the exposure HEADLINE is P.exposure.value with P.exposure.label
               verbatim (a typical enforcement band midpoint), NEVER a statutory
               maximum, the ceiling, or the with-review total.
   · Rule 10 / C-111 · needs_review renders categorically differently from violation:
               hatched in the waterfall, drawn OUTSIDE the confident subtotal, and its
               specific figure is WITHHELD in the findings list until confirmed.
   · C-200 · findings are evidence-quoted observations, never adjudicated legal
               conclusions; P.notLegalAdvice is pinned and visible on every screen.
   · C-118 · the honest numbers print with P.screenedLabel; catalogueSize is never
               invented.
   All payload text enters the DOM via textContent (never innerHTML): XSS-safe.
   ============================================================ */
(function () {
  'use strict';
  var P = (typeof window !== 'undefined' && window.P) || {};
  var doc = typeof document !== 'undefined' ? document : null;
  if (!doc) return;
  var app = doc.getElementById('app');
  if (!app) return;

  /* ---------------- safe helpers ---------------- */
  var isNum = function (n) { return typeof n === 'number' && isFinite(n); };
  function g(obj, path, def) {
    try {
      var o = obj;
      var parts = path.split('.');
      for (var i = 0; i < parts.length; i++) { if (o == null) return def; o = o[parts[i]]; }
      return o == null ? def : o;
    } catch (e) { return def; }
  }
  var arr = function (v) { return Array.isArray(v) ? v : []; };

  // el(tag, className, text) · text (when given) enters as textContent, never markup.
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null && text !== '') n.textContent = String(text);
    return n;
  }

  // money(value, currency) · grouped, full-precision, currency-prefixed. Never abbreviated
  // (an abbreviation like "17.5M" would break the digit-trace: "17"/"5" are not payload runs).
  // Returns '' when the value is absent so we abstain rather than print a fabricated 0.
  var SYM = { GBP: '£', USD: '$', EUR: '€' };
  function money(value, currency) {
    if (!isNum(Number(value))) return '';
    var n = Math.round(Number(value));
    var grouped = n.toLocaleString('en-GB');
    var sym = SYM[currency];
    if (sym) return sym + grouped;
    return currency ? (currency + ' ' + grouped) : grouped;
  }

  // British-format the ISO audit date. Digits ("19","2026") also occur in the ISO string,
  // so they trace; month names carry no digits.
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function ukDate(iso) {
    var s = String(iso || '');
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    var y = m[1], mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (!(mo >= 1 && mo <= 12)) return '';
    return d + ' ' + MONTHS[mo - 1] + ' ' + y;
  }

  // Month + year from an ISO "YYYY-MM" or "YYYY-MM-DD" (enforcement dates carry only the month).
  // Falls back to the raw string (still a payload substring, so it stays traceable) if unparseable.
  function monthYear(iso) {
    var s = String(iso || '');
    var m = s.match(/^(\d{4})-(\d{2})/);
    if (!m) return s;
    var mo = parseInt(m[2], 10);
    if (!(mo >= 1 && mo <= 12)) return s;
    return MONTHS[mo - 1] + ' ' + m[1];
  }

  // De-snake an artifact enum for prose (e.g. "visible_text" -> "visible text"). No invention.
  function humanise(s) { return String(s == null ? '' : s).replace(/_/g, ' ').trim(); }

  // Clip an evidence snippet so a long captured node cannot blow the card width. The ellipsis
  // marks the truncation honestly; the full node lives in the payload.
  function clip(s, n) {
    var str = String(s == null ? '' : s);
    return str.length > n ? (str.slice(0, n) + '…') : str;
  }

  /* ---------------- payload reads (no derivation beyond the brief-sanctioned state split) ---- */
  var company = g(P, 'meta.company', '');
  var domain = g(P, 'meta.domain', '');
  var date = ukDate(g(P, 'meta.date', ''));
  var findings = arr(g(P, 'findings', []));
  var counts = g(P, 'counts', {}) || {};
  var nViol = findings.filter(function (f) { return g(f, 'state', '') === 'violation'; }).length;
  var nRev = findings.filter(function (f) { return g(f, 'state', '') === 'needs_review'; }).length;
  var total = isNum(counts.total) ? counts.total : findings.length;
  var screenedLabel = g(P, 'screenedLabel', '');
  var frameworksAssessed = g(P, 'frameworksAssessed', null);
  var frameworksBinding = g(P, 'frameworksBinding', null);
  var rulesChecked = g(P, 'rulesChecked', null);
  var exposure = g(P, 'exposure', {}) || {};
  var exposureFull = g(P, 'exposureFull', {}) || {};
  var exposureNote = g(P, 'exposureNote', '');
  var wf = g(P, 'exposureWaterfall', {}) || {};
  var notLegalAdvice = g(P, 'notLegalAdvice', '');

  /* ============================================================
     B1 · THE VERDICT BAND (action-title, answer-first)
     ============================================================ */
  function buildBand() {
    var band = el('section', 'lux-band');
    band.id = 'lux-verdict';
    band.setAttribute('aria-label', 'Verdict');

    band.appendChild(el('span', 'lux-eyebrow', 'Compliance exposure review'));

    // "prepared for <company>" + domain, from P.meta
    var head = el('div', 'lux-band-head');
    var forLine = el('div');
    var forStrong = el('span', 'lux-for');
    forStrong.textContent = company ? ('Prepared for ' + company) : 'Prepared for your organisation';
    forLine.appendChild(forStrong);
    head.appendChild(forLine);
    if (domain) {
      var dl = el('div', 'lux-domain');
      dl.textContent = date ? (domain + '  ·  ' + date) : domain;
      head.appendChild(dl);
    }
    band.appendChild(head);

    // answer-first verdict sentence, observation voice, derived from findings states
    var verdict = el('h1', 'lux-verdict');
    verdict.textContent = verdictSentence();
    band.appendChild(verdict);

    // exposure headline: P.exposure.value + P.exposure.label VERBATIM. Never the ceiling/max/full.
    var expoStr = money(exposure.value, exposure.currency);
    if (expoStr) {
      var expo = el('div', 'lux-expo');
      expo.appendChild(el('div', 'v', expoStr));
      if (exposure.label) expo.appendChild(el('div', 'l', exposure.label));
      band.appendChild(expo);
    }

    // counts line (testable, every number a payload field)
    var cnt = el('div', 'lux-counts');
    cnt.id = 'lux-counts';
    cnt.appendChild(chip('lux-c-total', total, total === 1 ? 'finding' : 'findings'));
    cnt.appendChild(chip('lux-c-confirmed', nViol, 'confirmed'));
    cnt.appendChild(chip('lux-c-review', nRev, 'for review'));
    if (isNum(frameworksAssessed)) cnt.appendChild(chip('lux-c-assessed', frameworksAssessed, 'assessed'));
    if (isNum(frameworksBinding)) cnt.appendChild(chip('lux-c-binding', frameworksBinding, 'binding'));
    if (isNum(rulesChecked)) cnt.appendChild(chip('lux-c-rules', rulesChecked, rulesChecked === 1 ? 'rule checked' : 'rules checked'));
    band.appendChild(cnt);

    // screened label VERBATIM (C-118: catalogue size is never invented)
    if (screenedLabel) band.appendChild(el('div', 'lux-screened', screenedLabel));

    return band;
  }

  function chip(cls, n, label) {
    var c = el('span', 'lux-count ' + cls);
    var b = el('b'); b.textContent = String(n);
    c.appendChild(b);
    c.appendChild(doc.createTextNode(' ' + label));
    return c;
  }

  function verdictSentence() {
    if (total === 0) {
      return 'On a limited read of your live pages, we found no confirmed compliance findings.';
    }
    var v = nViol + ' ' + (nViol === 1 ? 'finding is confirmed on your site' : 'findings are confirmed on your site');
    var r = nRev + ' ' + (nRev === 1 ? 'is put to you for review' : 'are put to you for review');
    if (nViol === 0) return 'On a limited read of your live pages, ' + r + '.';
    if (nRev === 0) return 'On a limited read of your live pages, ' + v + '.';
    return 'On a limited read of your live pages, ' + v + ' and ' + r + '.';
  }

  /* ============================================================
     B4 · THE EXPOSURE WATERFALL (bridge: confident solid, review hatched + outside)
     ============================================================ */
  function buildWaterfall() {
    var sec = el('section', 'lux-sec');
    sec.id = 'lux-exposure';
    sec.appendChild(el('span', 'lux-eyebrow', 'Exposure'));
    sec.appendChild(el('h2', null, 'Where the exposure sits'));

    var steps = arr(g(wf, 'steps', []));
    var ceiling = g(wf, 'ceiling', null);

    if (!steps.length) {
      // honest compliant / not-plotted state: no invented bars
      sec.appendChild(el('div', 'lux-wf-empty',
        'No confirmed statute family carries a typical enforcement band in this run, so there is no exposure bridge to plot.'));
      if (exposureNote) sec.appendChild(el('p', 'lux-wf-basis', exposureNote));
      return sec;
    }

    // shared logarithmic scale across every plotted bound (bands span orders of magnitude)
    var vals = [];
    steps.forEach(function (s) {
      [g(s, 'typical_low', null), g(s, 'typical_high', null)].forEach(function (x) { if (isNum(x) && x > 0) vals.push(x); });
    });
    if (isNum(exposure.value) && exposure.value > 0) vals.push(exposure.value);
    if (isNum(exposureFull.value) && exposureFull.value > 0) vals.push(exposureFull.value);
    if (ceiling && isNum(ceiling.value) && ceiling.value > 0) vals.push(ceiling.value);
    var lo = vals.length ? Math.min.apply(null, vals) : 1;
    var hi = vals.length ? Math.max.apply(null, vals) : 10;
    function xPos(v) {
      if (!isNum(v) || v <= 0) return 0;
      if (hi <= lo) return 50;
      var p = (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
      return Math.max(0, Math.min(100, p * 100));
    }

    var wrap = el('div', 'lux-wf-wrap');
    var chart = el('div', 'lux-wf');

    var violSteps = steps.filter(function (s) { return g(s, 'state', '') === 'violation'; });
    var reviewSteps = steps.filter(function (s) { return g(s, 'state', '') !== 'violation'; });

    // --- confident zone (solid violation bars) ---
    var zc = el('div', 'lux-wf-zone z-confident');
    zc.appendChild(el('div', 'lux-wf-ztitle z-solid', 'Confident exposure'));
    violSteps.forEach(function (s) { zc.appendChild(stepEl(s, xPos, false)); });
    var confStr = money(exposure.value, exposure.currency);
    if (confStr) {
      var st = el('div', 'lux-wf-subtotal');
      st.appendChild(doc.createTextNode('Confident subtotal '));
      var b = el('b'); b.textContent = confStr; st.appendChild(b);
      if (exposure.label) st.appendChild(doc.createTextNode(' ' + exposure.label));
      zc.appendChild(st);
    }
    chart.appendChild(zc);

    // --- under-review zone (hatched, OUTSIDE the confident subtotal) ---
    if (reviewSteps.length) {
      var zr = el('div', 'lux-wf-zone z-review');
      zr.appendChild(el('div', 'lux-wf-ztitle z-review', 'Items under review, outside the confident total'));
      reviewSteps.forEach(function (s) { zr.appendChild(stepEl(s, xPos, true)); });
      var fullStr = money(exposureFull.value, exposureFull.currency);
      if (fullStr) {
        var stf = el('div', 'lux-wf-subtotal z-review');
        stf.appendChild(doc.createTextNode('With items under review '));
        var bf = el('b'); bf.textContent = fullStr; stf.appendChild(bf);
        if (exposureFull.label) stf.appendChild(doc.createTextNode(' ' + exposureFull.label));
        zr.appendChild(stf);
      }
      chart.appendChild(zr);
    }

    // --- ceiling plateau (labelled, never summed). Absent in this run (ceiling === null). ---
    if (ceiling && isNum(ceiling.value)) {
      var ce = el('div', 'lux-wf-ceiling');
      ce.appendChild(el('span', null, ceiling.label ? ceiling.label : 'Statutory ceiling'));
      var cb = el('b'); cb.textContent = money(ceiling.value, g(ceiling, 'currency', exposure.currency)); ce.appendChild(cb);
      chart.appendChild(ce);
    }

    chart.appendChild(el('div', 'lux-wf-scale', 'Bars use a logarithmic scale; a longer bar means a higher typical band.'));
    wrap.appendChild(chart);
    sec.appendChild(wrap);

    if (exposureNote) sec.appendChild(el('p', 'lux-wf-basis', exposureNote));
    return sec;
  }

  // one waterfall step. hatched === true tags the review class the truth-pack asserts.
  function stepEl(s, xPos, hatched) {
    var state = g(s, 'state', 'needs_review');
    var wrap = el('div', 'lux-wf-step lux-wf-step--' + state);
    wrap.appendChild(el('div', 'lux-wf-family', g(s, 'family', '')));

    var low = g(s, 'typical_low', null);
    var high = g(s, 'typical_high', null);
    var cur = g(s, 'currency', exposure.currency);

    var row = el('div', 'lux-wf-barrow');
    var bar = el('div', 'lux-wf-bar' + (hatched ? ' lux-wf-hatch' : ''));
    var left = xPos(isNum(low) ? low : high);
    var right = xPos(isNum(high) ? high : low);
    bar.style.left = left + '%';
    bar.style.width = Math.max(0, right - left) + '%';
    row.appendChild(bar);
    wrap.appendChild(row);

    var band = el('div', 'lux-wf-band');
    var loS = money(low, cur), hiS = money(high, cur);
    if (loS && hiS) band.appendChild(doc.createTextNode(loS + ' to ' + hiS + ' typical band'));
    else if (hiS) band.appendChild(doc.createTextNode('up to ' + hiS + ' typical'));
    if (hatched) {
      band.appendChild(doc.createTextNode('  '));
      band.appendChild(el('span', 'st', 'needs review'));
    }
    wrap.appendChild(band);
    return wrap;
  }

  /* ============================================================
     B2 · PER-FINDING LAW CARDS (evidence-left, action-right, three-state)
     Each finding renders one card. Every string traces to a payload field:
     · left  = the observation lead-in (by state) + the evidence: a verbatim
               evidence_quote when present, else an artifact summary built ONLY from
               artifact fields (no invention).
     · right = the obligation (description), statute + regulator, penalty AS CONTEXT
               (withheld for needs_review · C-111), ONE real cited enforcement case when
               enforcement[] is carried (never filler · C-115), and the fix (or a neutral
               line when none is carried).
     Violation cards are solid-ruled; needs_review cards are dashed and figure-free.
     Confident voice is used ONLY when voice_tier === 'confident' (C-200).
     ============================================================ */
  var BADGE = {
    violation: { cls: 'lux-badge--violation', glyph: '▲', word: 'Confirmed finding' },
    needs_review: { cls: 'lux-badge--needs_review', glyph: '◆', word: 'For your review' },
    pass: { cls: 'lux-badge--pass', glyph: '✓', word: 'Compliant' }
  };

  function buildCards() {
    var sec = el('section', 'lux-sec lux-cards');
    sec.id = 'lux-findings';
    sec.appendChild(el('span', 'lux-eyebrow', 'Findings'));
    sec.appendChild(el('h2', null, 'The evidence, finding by finding'));
    if (!findings.length) {
      sec.appendChild(el('p', 'lux-lede', 'No findings were recorded in this run.'));
      return sec;
    }
    findings.forEach(function (f) { sec.appendChild(cardEl(f)); });
    return sec;
  }

  function cardEl(f) {
    var state = g(f, 'state', 'needs_review');
    if (state !== 'violation' && state !== 'needs_review' && state !== 'pass') state = 'needs_review';
    var meta = BADGE[state] || BADGE.needs_review;

    var card = el('div', 'lux-card lux-card--' + state);

    // header · state badge + framework name VERBATIM (class the truth-pack matches on)
    var h = el('div', 'lux-card-h');
    var badge = el('span', 'lux-badge ' + meta.cls);
    badge.appendChild(el('span', 'g', meta.glyph));
    badge.appendChild(doc.createTextNode(meta.word));
    h.appendChild(badge);
    h.appendChild(el('div', 'lux-fw-name', g(f, 'framework', '')));
    card.appendChild(h);

    // two columns · evidence left, action right
    var cols = el('div', 'lux-card-cols');
    cols.appendChild(evidenceCol(f, state));
    cols.appendChild(actionCol(f, state));
    card.appendChild(cols);

    // full-width voice note (C-200 / Rule 10)
    card.appendChild(voiceNote(f, state));
    return card;
  }

  // LEFT · the observation lead-in (by state) then the evidence.
  function evidenceCol(f, state) {
    var col = el('div', 'lux-card-ev');
    col.appendChild(el('span', 'lux-col-label', 'Evidence'));

    var quote = g(f, 'evidence_quote', '');
    var body = quote ? el('blockquote', 'lux-ev-quote', quote) : artifactSummary(g(f, 'artifact', null));

    if (body) {
      // lead-in only introduces evidence we actually have (never a bare lead-in · C-115)
      var url = g(f, 'page_url', '');
      var lead = (state === 'violation')
        ? (url ? ('On ' + url + ', we captured the following:') : 'On your live site, we captured the following:')
        : 'From the pages we could read, we detected the following, which needs your confirmation:';
      col.appendChild(el('p', 'lux-ev-lead', lead));
      col.appendChild(body);
    } else {
      col.appendChild(el('p', 'lux-ev-lead', state === 'violation'
        ? 'The underlying capture is recorded against this finding.'
        : 'This is put to you for your review.'));
    }
    return col;
  }

  // Artifact summary rendered ONLY from artifact fields. Returns null when there is nothing to show.
  function artifactSummary(art) {
    if (!art || typeof art !== 'object') return null;
    var type = g(art, 'type', '');

    if (type === 'dom_node') {
      var wrap = el('div', 'lux-ev-artifact lux-ev-dom');
      var sel = g(art, 'selector', '');
      if (sel) {
        var r = el('div', 'lux-ev-kv');
        r.appendChild(el('span', 'k', 'Selector'));
        r.appendChild(el('code', 'lux-ev-selector', sel));
        wrap.appendChild(r);
      }
      var snip = g(art, 'snippet', '');
      if (snip) wrap.appendChild(el('pre', 'lux-ev-snippet', clip(snip, 240)));
      // captured-node detail · the automated rule and WCAG success criterion, both from the artifact
      var rule = g(art, 'rule_id', ''), wcag = g(art, 'wcag_sc', '');
      var det = '';
      if (rule) det = 'Automated check ' + rule;
      if (wcag) det += (det ? ' · WCAG ' : 'WCAG ') + wcag;
      if (det) wrap.appendChild(el('div', 'lux-ev-detail', det));
      return (sel || snip || det) ? wrap : null;
    }

    if (type === 'network_event') {
      var w2 = el('div', 'lux-ev-artifact lux-ev-net');
      var host = g(art, 'host', ''), name = g(art, 'name', '');
      if (host) { var rh = el('div', 'lux-ev-kv'); rh.appendChild(el('span', 'k', 'Host')); rh.appendChild(el('code', 'lux-ev-selector', host)); w2.appendChild(rh); }
      if (name) { var rn = el('div', 'lux-ev-kv'); rn.appendChild(el('span', 'k', 'Request')); rn.appendChild(el('code', 'lux-ev-selector', name)); w2.appendChild(rn); }
      return (host || name) ? w2 : null;
    }

    if (type === 'coverage_proof') {
      var w3 = el('div', 'lux-ev-artifact lux-ev-coverage');
      var pages = arr(g(art, 'pages_checked', []));
      var pats = arr(g(art, 'searched_patterns', []));
      var stats = el('div', 'lux-ev-covstats');
      stats.appendChild(covStat(pages.length, pages.length === 1 ? 'page checked' : 'pages checked'));
      stats.appendChild(covStat(pats.length, pats.length === 1 ? 'search pattern' : 'search patterns'));
      w3.appendChild(stats);
      var surface = humanise(g(art, 'surface', ''));
      w3.appendChild(el('p', 'lux-ev-covcap',
        'We searched the ' + (surface || 'text') + ' of these pages for the signals this obligation requires and did not find them. '
        + 'Because such signals can sit outside the text we can read, this is put to you to confirm rather than asserted.'));
      return w3;
    }

    return null;
  }

  function covStat(n, label) {
    var s = el('span', 'lux-ev-covstat');
    var b = el('b'); b.textContent = String(n); s.appendChild(b);
    s.appendChild(doc.createTextNode(' ' + label));
    return s;
  }

  // RIGHT · the obligation, statute, regulator, penalty-as-context, enforcement, fix.
  function actionCol(f, state) {
    var col = el('div', 'lux-card-ac');
    col.appendChild(el('span', 'lux-col-label', 'What it means'));

    var desc = g(f, 'description', '');
    if (desc) col.appendChild(el('p', 'lux-ac-duty', desc));

    var m = el('div', 'lux-ac-meta');
    var cite = g(f, 'statutory_citation', '');
    if (cite) m.appendChild(metaRow('Statute', cite));
    var reg = g(f, 'regulator', '');
    if (reg) m.appendChild(metaRow('Regulator', reg, 'reg', 'lux-reg-name'));

    // penalty AS CONTEXT · violation shows its typical band + basis; needs_review WITHHOLDS every
    // figure until confirmed (Rule 10 / C-111). The contingent band still shows, hatched, in B4.
    var pen = g(f, 'penalty', {}) || {};
    if (state === 'violation') {
      var cur = g(pen, 'currency', '');
      var loS = money(g(pen, 'typical_low', null), cur), hiS = money(g(pen, 'typical_high', null), cur);
      if (loS && hiS) m.appendChild(metaRow('Enforcement band', loS + ' to ' + hiS + ' typical', 'pen'));
      else if (hiS) m.appendChild(metaRow('Enforcement band', 'up to ' + hiS + ' typical', 'pen'));
      var basis = g(pen, 'basis', '');
      if (basis) m.appendChild(metaRow('Context', basis, 'basis'));
    } else {
      m.appendChild(metaRow('Exposure', 'Figure withheld until confirmed', 'withheld'));
    }
    col.appendChild(m);

    // ONE real cited enforcement case, ONLY when the payload carries enforcement[] (C-105/C-106).
    // None carried => render nothing (never filler · C-115).
    var enf = arr(g(f, 'enforcement', []));
    if (enf.length) {
      var e0 = enf[0];
      if (e0 && (g(e0, 'case', '') || g(e0, 'date', '') || g(e0, 'amount', ''))) col.appendChild(enforcementEl(e0, state));
    }

    // remediation · the real fix when carried, else a neutral line (no invented specifics)
    var fix = g(f, 'fix', '');
    var rem = el('div', 'lux-ac-rem');
    rem.appendChild(el('span', 'lux-col-mini', 'Remediation'));
    rem.appendChild(el('p', 'lux-ac-fix', fix ? fix : 'Remediation guidance available in your walkthrough.'));
    col.appendChild(rem);

    return col;
  }

  // One cited enforcement case. The monetary amount shows ONLY on a violation card; on a
  // needs_review card every figure is withheld (C-111), so we cite the case + date for posture only.
  function enforcementEl(e, state) {
    var box = el('div', 'lux-ac-enf');
    box.appendChild(el('span', 'lux-col-mini', 'Regulator posture'));
    var cs = g(e, 'case', '');
    if (cs) box.appendChild(el('p', 'lux-enf-case', cs));
    var line = monthYear(g(e, 'date', ''));
    var amt = g(e, 'amount', '');
    if (state === 'violation' && amt) line += (line ? ' · ' : '') + amt;
    if (line) box.appendChild(el('p', 'lux-enf-meta', line));
    var sum = g(e, 'summary', '');
    if (sum) box.appendChild(el('p', 'lux-enf-sum', sum));
    box.appendChild(el('p', 'lux-enf-note', state === 'violation'
      ? 'A real, dated enforcement outcome, shown to indicate how the regulator acts.'
      : 'Cited to show the regulator acts in this area. No figure attaches to your finding until it is confirmed.'));
    return box;
  }

  function voiceNote(f, state) {
    var vt = g(f, 'voice_tier', 'observation');
    var note = el('p', 'lux-card-note');
    if (state === 'needs_review') {
      note.textContent = 'Detected on a limited read of your pages. This needs your confirmation before any figure attaches.';
    } else if (vt === 'confident') {
      note.textContent = 'Evidenced on your live site and verified against the register.';
    } else {
      note.textContent = 'Observed on your live pages and put to you as a factual observation, not a legal conclusion.';
    }
    return note;
  }

  function metaRow(k, v, valCls, nameCls) {
    var row = el('div', 'lux-mrow');
    row.appendChild(el('span', 'k', k));
    var val = el('span', 'val' + (valCls ? ' ' + valCls : '') + (nameCls ? ' ' + nameCls : ''), v);
    row.appendChild(val);
    return row;
  }

  /* ============================================================
     PINNED NOT-LEGAL-ADVICE STANDING LINE (C-200)
     ============================================================ */
  function buildNla() {
    var nla = el('aside', 'lux-nla');
    nla.setAttribute('role', 'note');
    if (notLegalAdvice) {
      var b = el('b'); b.textContent = notLegalAdvice;
      nla.appendChild(b);
    }
    return nla;
  }

  /* ============================================================
     B3 · THE LEFT RAIL (sticky desktop, collapsing on mobile)
     Three honest numbers (verbatim, C-117/C-118), real reading progress, jump links,
     the pinned not-legal-advice line, and ONE calm CTA (no scarcity · C-200 / DMCCA).
     ============================================================ */
  function buildRail() {
    var rail = el('aside', 'lux-rail');
    rail.setAttribute('aria-label', 'Report summary and navigation');

    // real reading progress · scroll-derived. ARIA carries the value; no count-up animation, and it
    // stays honest because it is derived from the document scroll position, not a payload figure.
    var prog = el('div', 'lux-rail-progress');
    prog.setAttribute('role', 'progressbar');
    prog.setAttribute('aria-label', 'Reading progress');
    prog.setAttribute('aria-valuemin', '0');
    prog.setAttribute('aria-valuemax', '100');
    prog.setAttribute('aria-valuenow', '0');
    prog.appendChild(el('div', 'lux-rail-progress-bar'));
    rail.appendChild(prog);

    // the three honest numbers · verbatim payload counts. frameworksAssessed is labelled with
    // screenedLabel because catalogueSize is deliberately nullable and never invented (C-118).
    var stats = el('div', 'lux-rail-stats');
    if (isNum(frameworksAssessed)) {
      stats.appendChild(railStat(frameworksAssessed, 'frameworks assessed'));
      if (screenedLabel) stats.appendChild(el('div', 'lux-rail-screened', screenedLabel));
    }
    if (isNum(frameworksBinding)) stats.appendChild(railStat(frameworksBinding, 'frameworks binding'));
    if (isNum(rulesChecked)) stats.appendChild(railStat(rulesChecked, rulesChecked === 1 ? 'rule checked' : 'rules checked'));
    rail.appendChild(stats);

    // jump links to the three beats
    var nav = el('nav', 'lux-rail-nav');
    nav.setAttribute('aria-label', 'Jump to section');
    [['#lux-verdict', 'Verdict'], ['#lux-exposure', 'Exposure'], ['#lux-findings', 'Findings']].forEach(function (p) {
      var a = el('a', 'lux-rail-link', p[1]);
      a.setAttribute('href', p[0]);
      nav.appendChild(a);
    });
    rail.appendChild(nav);

    // pinned not-legal-advice line (C-200), verbatim from the payload
    if (notLegalAdvice) rail.appendChild(el('p', 'lux-rail-nla', notLegalAdvice));

    // ONE calm CTA · a plain mailto. No countdown, no scarcity, no invented price (C-200 / DMCCA).
    var subject = 'Walk me through my compliance findings' + (company ? (' for ' + company) : '');
    var cta = el('a', 'lux-rail-cta', 'Walk me through my breaches');
    cta.setAttribute('href', 'mailto:hello@tamazia.co.uk?subject=' + encodeURIComponent(subject));
    rail.appendChild(cta);

    return rail;
  }

  function railStat(n, label) {
    var s = el('div', 'lux-rail-stat');
    var b = el('b'); b.textContent = String(n); s.appendChild(b);
    s.appendChild(el('span', 'lux-rail-stat-l', label));
    return s;
  }

  // wireProgress · update the rail progress bar from the live scroll position. Every read is guarded:
  // the bar is presentational, so a failed measurement must never blank the already-rendered report.
  function wireProgress() {
    try {
      var bar = doc.querySelector('.lux-rail-progress-bar');
      var region = doc.querySelector('.lux-rail-progress');
      if (!bar || !region || typeof window === 'undefined') return;
      var update = function () {
        try {
          var de = doc.documentElement || {};
          var span = (de.scrollHeight || 0) - (de.clientHeight || 0);
          var top = (typeof window.pageYOffset === 'number' ? window.pageYOffset : (de.scrollTop || 0)) || 0;
          var pct = span > 0 ? Math.max(0, Math.min(100, Math.round((top / span) * 100))) : 0;
          bar.style.width = pct + '%';
          region.setAttribute('aria-valuenow', String(pct));
        } catch (e) {
          // FAIL-OPEN: a progress read must never break the report. The audit body is already mounted
          // and fully readable without a progress indicator, so we swallow and leave the last value.
        }
      };
      update();
      if (typeof window.addEventListener === 'function') {
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
      }
    } catch (e) {
      // FAIL-OPEN: wiring the (decorative) progress bar must never take the report down with it.
    }
  }

  /* ---------------- mount ---------------- */
  app.textContent = '';
  app.appendChild(buildRail());
  var main = el('div', 'lux-main');
  main.appendChild(buildBand());
  main.appendChild(buildWaterfall());
  main.appendChild(buildCards());
  app.appendChild(main);
  app.appendChild(buildNla());
  wireProgress();
})();
