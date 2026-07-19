/* ============================================================
   TAMAZIA AUDIT · LUX (contract-v1.1) client renderer.
   Builds two exhibits into #app from window.P (the RAW v1.1 payload the engine
   composed render-ready): B1 the verdict band, B4 the exposure waterfall, then a
   plain state-badged findings list and the pinned not-legal-advice line.

   HONESTY CONTRACT (every rule is load-bearing, the truth-pack re-matches this page):
   · Rule 1 · read the payload, re-derive nothing. The only presentation counting is
               splitting findings by their own `state` for the verdict sentence, which
               the brief sanctions for B1.
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
     FINDINGS LIST · state-badged, honest voice (so the band is accountable)
     ============================================================ */
  var BADGE = {
    violation: { cls: 'lux-badge--violation', glyph: '▲', word: 'Confirmed finding' },
    needs_review: { cls: 'lux-badge--needs_review', glyph: '◆', word: 'For your review' },
    pass: { cls: 'lux-badge--pass', glyph: '✓', word: 'Compliant' }
  };
  function buildFindings() {
    var sec = el('section', 'lux-sec');
    sec.id = 'lux-findings';
    sec.appendChild(el('span', 'lux-eyebrow', 'Findings'));
    sec.appendChild(el('h2', null, 'What the band summarises'));
    if (!findings.length) {
      sec.appendChild(el('p', 'lux-lede', 'No findings were recorded in this run.'));
      return sec;
    }
    findings.forEach(function (f) { sec.appendChild(findingCard(f)); });
    return sec;
  }

  function findingCard(f) {
    var state = g(f, 'state', 'needs_review');
    var voiceTier = g(f, 'voice_tier', 'observation');
    var meta = BADGE[state] || BADGE.needs_review;

    var card = el('div', 'lux-find lux-find--' + state);

    var h = el('div', 'lux-find-h');
    var badge = el('span', 'lux-badge ' + meta.cls);
    badge.appendChild(el('span', 'g', meta.glyph));
    badge.appendChild(doc.createTextNode(meta.word));
    h.appendChild(badge);
    // framework name VERBATIM (class the truth-pack matches against the payload)
    h.appendChild(el('div', 'lux-fw-name', g(f, 'framework', '')));
    card.appendChild(h);

    // description VERBATIM
    var desc = g(f, 'description', '');
    if (desc) card.appendChild(el('p', 'lux-find-desc', desc));

    var mrows = el('div', 'lux-find-meta');
    // regulator VERBATIM (class the truth-pack matches against the payload)
    var reg = g(f, 'regulator', '');
    if (reg) mrows.appendChild(metaRow('Regulator', reg, 'reg', 'lux-reg-name'));

    // exposure: violation shows its typical band (the confident exposure); needs_review WITHHOLDS
    // the figure until confirmed (Rule 10 / C-111). The contingent band still shows, hatched, in B4.
    var pen = g(f, 'penalty', {}) || {};
    if (state === 'violation') {
      var loS = money(pen.typical_low, pen.currency), hiS = money(pen.typical_high, pen.currency);
      if (loS && hiS) mrows.appendChild(metaRow('Typical enforcement band', loS + ' to ' + hiS, 'pen'));
      else if (hiS) mrows.appendChild(metaRow('Typical enforcement band', 'up to ' + hiS, 'pen'));
    } else {
      mrows.appendChild(metaRow('Exposure', 'Figure withheld until this is confirmed', 'pen'));
    }

    // statutory citation VERBATIM
    var cite = g(f, 'statutory_citation', '');
    if (cite) mrows.appendChild(metaRow('Statute', cite));
    card.appendChild(mrows);

    // honest voice note. needs_review always observational; a violation stays observational unless
    // its voice_tier earns the confident register.
    var note = el('p', 'lux-find-note');
    if (state === 'needs_review') {
      note.textContent = 'Detected on a limited read of your pages. This needs your confirmation before any figure attaches.';
    } else if (voiceTier === 'confident') {
      note.textContent = 'Evidenced on your live site and verified against the register.';
    } else {
      note.textContent = 'Observed on your live pages and put to you as a factual observation, not a legal conclusion.';
    }
    card.appendChild(note);

    return card;
  }

  function metaRow(k, v, valCls, nameCls) {
    var row = el('div', 'lux-find-row');
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

  /* ---------------- mount ---------------- */
  app.textContent = '';
  app.appendChild(buildBand());
  app.appendChild(buildWaterfall());
  app.appendChild(buildFindings());
  app.appendChild(buildNla());
})();
