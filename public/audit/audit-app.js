/* ============================================================
   TAMAZIA AUDIT, app: rail + panes + commerce + wiring
   ============================================================ */
(function(){
  /* ------------------------------------------------------------------
     PRICES — the ONE source of truth for every figure rendered on this
     page. Values are copied EXACTLY from src/content/pricing.ts (the
     repo's canonical price config). audit-app.js is a static asset and
     cannot import the .ts module at runtime, so the numbers are mirrored
     here verbatim; every render literal below READS from this block, so
     the two can never silently drift. British English. GBP integers.
     If pricing.ts changes, change ONLY this block.
     ------------------------------------------------------------------ */
  const PRICES = {
    entryAudit: 1500,                                   // entryAuditGbp · the report's published standalone price
    // pricingContent.tiers[]: priceGbp (from/month), priceGbpStandard (struck anchor), savesGbp6 (6-month saving)
    // UNCHANGED by the commercial rebuild. Mandates carry NO strikethrough and NO first-engagement discount.
    tiers: {
      foundation: { from:2500, standard:3300, saves6:4800 },
      authority:  { from:4500, standard:6000, saves6:9000 },
      enterprise: { from:9500, standard:12700, saves6:19200 },
    },
    // fixSprintsGbp · severity-based Sprints. standard = the published fee; offer = the rate THIS report
    // unlocks because it is a first engagement. offer = standard / 2, exactly (the strike is arithmetic).
    fixSprints: {
      sprint1: { standard:9800,  offer:4900,  days:14 },
      sprint2: { standard:17800, offer:8900,  days:30 },
      sprint3: { standard:25000, offer:12500, days:42 },
    },
    fixSprintCreditPct: 50,                             // fixSprintCreditPct
    fixSprintCreditDays: 60,                            // fixSprintCreditDays
    fixPacksLane: 'One fixed price. One fixed timeline. No retainer. The work is owned outright.', // fixPacksLane
    // sccoGuidelineRates · Senior Courts Costs Office guideline hourly rates, London 1, in force 1 January 2026.
    // Source printed inline beside every figure derived from it. Replaces the invented consultancy anchors (E36).
    scco: {
      gradeA: 579, gradeC: 305, band: 'London 1', inForce: '1 January 2026',
      source: 'SCCO Guideline Hourly Rates, London 1, in force 1 January 2026',
      sourceUrl: 'https://www.gov.uk/guidance/solicitors-guideline-hourly-rates',
    },
    // exposureReportGbp · £495 unlocks the full report AND includes the first month of Regulatory Watch;
    // from month two it is £1,500 a month. The £495 is credited in full against any Sprint or mandate
    // within 90 days. realValue (£1,500) is the report's published standalone price, so the strike is honest.
    exposureReport: { unlock:495, monthlyCover:1500, realValue:1500, creditDays:90 },
    independent: {                                       // independentSolutionsGbp · anchor = 2 x offer
      websiteRemodelling:    { anchor:17000, offer:8500, typical:12000 },
      aiAuthority:           { anchor:3800,  offer:1900 },
      onlinePersonalBranding:{ anchor:5000,  offer:2500 },
      instagramPresence:     { anchor:3000,  offer:1500 },
      ymylContent:           { anchor:2900,  offer:1450 },
      gbpDomination:         { anchor:3000,  offer:1500 },
    },
  };
  // ---------------------------------------------------------------------------
  // STRIPE · mirrors `stripeLinks` in src/content/pricing.ts, which is the ONE place the founder
  // pastes a Payment Link URL. No Stripe secret key exists in this repo, so links cannot be minted
  // from code; they are created in the Stripe dashboard at the `offer` price and pasted into
  // pricing.ts. tests/commercial-rebuild.test.mjs fails the build if this mirror drifts.
  //
  // An EMPTY string is safe. It NEVER hides a button (that was defect E39, which left Route 1
  // unpurchasable on every live report). Empty => the CTA falls back to the intake modal / booking
  // link. A payment path always exists.
  // ---------------------------------------------------------------------------
  const STRIPE_LINKS = {
    sprint1: '',
    sprint2: '',
    sprint3: '',
    unlock: '',
    watch: '',
    remodellingDeposit: '',
    websiteRemodelling: '',
    aiAuthority: '',
    onlinePersonalBranding: '',
    instagramPresence: '',
    ymylContent: '',
    gbpDomination: '',
  };
  // Env-threaded overrides (adapter → window.D.links). A non-empty env value wins over the pasted config,
  // so the founder can hot-swap a link without a deploy; when both are empty the fallback path runs.
  const LINKS = (window.D && window.D.links) || {};
  function strOr(v){ return (typeof v==='string' && v.trim()) ? v.trim() : ''; }
  const STRIPE = {
    sprint1: strOr(LINKS.stripeFix10) || STRIPE_LINKS.sprint1,
    sprint2: strOr(LINKS.stripeFix20) || STRIPE_LINKS.sprint2,
    sprint3: strOr(LINKS.stripeFix30) || STRIPE_LINKS.sprint3,
    unlock:  strOr(LINKS.stripeUnlock) || STRIPE_LINKS.unlock,
    cover:   strOr(LINKS.stripeCover)  || STRIPE_LINKS.watch,
  };
  function sprintStripe(k){ return STRIPE['sprint'+k] || ''; }
  function addonStripe(key){ return strOr(STRIPE_LINKS[key]); }

  // ---------------------------------------------------------------------------
  // BOOKING (E16 / E54) · every commercial CTA resolves to a real destination. The adapter supplies
  // D.links.booking when the env var is set; when it is not, we fall back to the public calendar so a
  // CTA is NEVER rendered with an empty href and NEVER hidden. Context params are carried into the
  // booked call: ?report={slug}&intent={findings|scoping|sprint|package}
  // ---------------------------------------------------------------------------
  const CAL_BOOKING_BASE = 'https://cal.com/tamazia/strategy-call';
  const BOOKING_URL   = strOr(LINKS.booking) || CAL_BOOKING_BASE;
  const CONTACT_PHONE = (window.D && typeof window.D.contactPhone === 'string') ? window.D.contactPhone.trim() : '';
  function reportSlug(){
    const ap = (location.pathname.match(/\/audit\/([^/]+)\/([^/]+)/) || []);
    return ap[1] || (window.D && window.D.meta && window.D.meta.slug) || '';
  }
  // The adapter ships D.links.cta_findings / cta_assessed as {text, href}. The href was an empty string on
  // every live report, and the renderer then dropped the band entirely (E16/E54). These two helpers guarantee
  // a destination: the env href when set, otherwise the intent-tagged booking URL. Never empty, never hidden.
  function ctaHref(key,intent){
    const o=LINKS[key];
    const h=(o && typeof o==='object') ? strOr(o.href) : '';
    return h || bookUrl(intent);
  }
  function ctaText(key,fallback){
    const o=LINKS[key];
    const t=(o && typeof o==='object') ? strOr(o.text) : '';
    return t || fallback;
  }
  function bookUrl(intent){
    const base = BOOKING_URL;
    const q = [];
    const slug = reportSlug();
    if(slug) q.push('report=' + encodeURIComponent(slug));
    q.push('intent=' + encodeURIComponent(intent || 'findings'));
    return base + (base.indexOf('?') > -1 ? '&' : '?') + q.join('&');
  }
  // Append the minted report's identity so the webhook can flip THIS report to unlocked after payment.
  function unlockHref(){
    const ap = (location.pathname.match(/\/audit\/([^/]+)\/([^/]+)/) || []);
    const slug = ap[1] || (window.D && window.D.meta && window.D.meta.slug) || '';
    const hash = ap[2] || '';
    const ref = (slug && hash) ? ('?client_reference_id=' + encodeURIComponent(slug + '__' + hash)) : '';
    return STRIPE.unlock ? (STRIPE.unlock + ref) : '';
  }

  const $ = (s,r=document)=>r.querySelector(s);
  // count-aware pluralization: plur(1,'finding')↗'finding', plur(2,'finding')↗'findings',
  // plur(1,'is','are')↗'is'. Used everywhere a live count precedes finding/critical/breach/run/dim/are.
  const plur = (n,s,p)=> n===1 ? s : (p||s+'s');
  // Escape DATA-sourced strings before innerHTML (evidence quotes/LLM text can carry a raw "<"
  // that would corrupt the DOM — the axe-rule-name regression). Display text only.
  // De-dash THEN HTML-escape every data-sourced display string: the founder's "no dashes anywhere" rule, applied
  // at the render chokepoint so any em/en dash baked into an engine payload (PSI fix, evidence quote, competitor
  // name) is neutralised to a comma. Regular hyphens (co-working, e-commerce) are left intact.
  const escH = s=>String(s==null?'':s).replace(/\s*[—–]\s*/g,', ').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // C-G: the SINGLE source for "which retainer tier do we recommend this firm". The adapter flags the
  // recommended tier on D.pricing (rec:true). The rail CTA routes to THIS tier
  // (not a hardcoded Enterprise/Authority), so the call the buyer books matches the tier the report recommends.
  // Falls back to Enterprise only if no rec flag is present (matches planData()'s default).
  function recommendedTierName(){
    const rec=(Array.isArray(D.pricing)?D.pricing:[]).find(p=>p&&p.rec);
    const nm=rec&&rec.tier?String(rec.tier):'';
    return /^(foundation|authority|enterprise)$/i.test(nm) ? (nm.charAt(0).toUpperCase()+nm.slice(1).toLowerCase()) : 'Enterprise';
  }

  /* ---------------- LEFT RAIL ---------------- */
  function rail(){
    const nav=[
      {id:'overview', nm:'Overview', dot:'r', c:''},
      {id:'seo', nm:'SEO &amp; Technical', dot:'a', c:(D.seo.issueCount||(D.seo.onpage||[]).length)+' '+plur(D.seo.issueCount||(D.seo.onpage||[]).length,'issue')},
      {id:'geo', nm:'AI &amp; GEO', dot:'r', c:(D.geo.issueCount||0)+' '+plur(D.geo.issueCount||0,'gap')},
      {id:'regulatory', nm:'Regulatory', dot:'r', c:(D.frameworks||[]).length+' '+plur((D.frameworks||[]).length,'framework')},
      {id:'competitors', nm:'Competitors', dot:'a', c:Math.max(0,(D.competitors.rows||[]).length-1)+' ahead'},
      {id:'plan', nm:'Plan &amp; Pricing', dot:'g', c:''}
    ];
    return `
    <aside class="rail"><div class="rail-inner">
      <div class="rail-brand"><a href="https://tamazia.co.uk" target="_blank" rel="noopener" aria-label="Tamazia, visit tamazia.co.uk"><img src="/tamazia-lockup-masthead-transparent.png" alt="Tamazia" class="rail-logo"></a></div>
      <h1>${escH(D.meta.company)}</h1>
      <div class="rail-report"><div class="rr-name">The Exposure Report</div><div class="rr-sub">Compliance, Search and AI Visibility</div></div>
      <div class="rail-meta">${escH(D.meta.sector)}<br>${[D.meta.country,D.meta.city].filter(Boolean).map(escH).join(' · ')}<br>${escH(D.meta.domain)}</div>
      <div class="rail-gauge">${CH.gauge(D.score,D.grade,{size:96,dark:true})}</div>
      <div class="rail-band">${D.screenedLabel} · ${D.frameworksBinding} bind you</div>
      <div class="rail-exposure"><div class="v">${D.exposureHeadline||D.exposure}</div><div class="l">${D.exposureNote}</div></div>
      ${D.adjudication ? `<div class="rail-adj"><div class="adj-h">✓ ${D.adjudication.reviewed} findings re-examined against the statute</div><div class="adj-l">${escH(D.adjudication.line)}</div></div>` : ''}
      <div class="rail-prep"><div class="rp-by">Report prepared by</div><div class="rp-name">Aman Pareek</div><div class="rp-deg">LLM in International Business Law,</div><div class="rp-inst"><img class="rp-logo" src="/audit/kings-logo.png" alt="King's College London" onerror="this.remove()">King&rsquo;s College London</div><div class="rp-rules">Every fix checked against ${D.rulesChecked} rule ${plur(D.rulesChecked,'check','checks')}</div></div>
      <div class="rail-social">
        <a href="https://www.instagram.com/tamaziauk/" target="_blank" rel="noopener" aria-label="Tamazia on Instagram" title="@tamaziauk"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
        <a href="https://www.linkedin.com/in/amanpareekk/" target="_blank" rel="noopener" aria-label="Aman Pareek on LinkedIn" title="Aman Pareek on LinkedIn"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.3-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21H9V9Z"/></svg></a>
        <a href="mailto:contact@tamazia.co.uk" aria-label="Email contact@tamazia.co.uk" title="contact@tamazia.co.uk"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></a>
      </div>
      <div class="rail-navtitle">Jump to</div>
      <nav class="railnav">${nav.map((n,i)=>`<button data-pane="${n.id}" class="${i===0?'active':''}"><span class="ni dot ${n.dot}"></span>${n.nm}<span class="nc">${n.c}</span></button>`).join('')}</nav>
      <button class="rail-cta" data-book="package" data-tier="${escH(recommendedTierName())}">Walk the report through in 20 minutes with the founder ↗</button>
    </div></aside>`;
  }

  /* ---------------- PANES ---------------- */
  // Phase 3 de-triplication: the FULL finding detail lives ONCE in P.overview (ids fx-1..N).
  // Everywhere else that referenced a top-fix (regulatory "breaches in full", verdict chips)
  // becomes a clickable SUMMARY that opens the overview detail. fixSummary keys on the fix's
  // position in D.fixes so the id matches the overview card exactly.
  function fixSummary(f){
    const i=(D.fixes||[]).indexOf(f);
    return `<button class="fix-summary" data-finding="fx-${i+1}">
      <span class="fs-tag">${escH(f.reg||f.pillar||'')}</span><span class="fs-t">${escH(f.title)}</span>
      <span class="fs-e">${escH(f.exp)}</span><span class="fs-go">full finding ↑</span></button>`;
  }
  const P = {};

  P.overview = ()=>`
    <div class="grid g2">
      <div class="card pad"><div class="card-h"><div class="t">Findings by severity</div><div class="meta">${D.confirmed} confirmed v. evidence</div></div>${CH.donut()}</div>
      <div class="card pad"><div class="card-h"><div class="t">Jurisdiction that governs you</div></div><p style="font-family:var(--body);font-size:13px;color:#3a2d30;line-height:1.5">${escH(D.jurisdiction)}</p></div>
    </div>
    <div class="card pad" style="margin-top:9px">
      <div class="card-h"><div class="t" style="font-size:11px;color:var(--muted);letter-spacing:.02em">How your ${D.score}/100 is calculated</div><div class="meta">${D.frameworksBinding} binding ${plur(D.frameworksBinding,'framework','frameworks')} · ${D.confirmed} evidence checks</div></div>
      <div class="grid g-7-5" style="gap:20px">
        <div><p style="font-size:13.5px;color:#3a2d30;line-height:1.55">${D.scoring.formula}</p>
          <p style="font-size:13px;color:var(--muted);margin-top:9px;line-height:1.5">${D.scoring.why}</p>
          <div class="mono" style="font-size:10px;color:var(--ox);margin-top:11px;letter-spacing:.02em;line-height:1.6">${D.scoring.inputs}</div></div>
        <div class="scorebands">${D.scoring.bands.map(b=>`<div class="sb ${b.g===D.grade[0]?'on':''}"><span class="sbg">${b.g}</span><span class="sbr">${b.r}</span><span class="sbd">${b.d}</span></div>`).join('')}</div>
      </div>
    </div>
    <div class="subhead"><span class="nt">↳</span><h3>The three you fix this quarter, Tamazia closes all three inside the first eight weeks.</h3></div>
    ${severityKey()}
    ${severeTrio()}
    <div class="card pad" style="margin-top:10px"><div class="card-h"><div class="t">Where Tamazia takes you</div><div class="meta">projected · prior engagements</div></div>${CH.trajectory(820,150)}</div>`;

  P.regulatory = ()=>{
    // #3: only render the "breaches in full" subhead + cards when the Regulatory-filtered
    // fixes list is non-empty, otherwise the heading/subhead sit above an empty body.
    const regFixes=(D.fixes||[]).filter(f=>f.pillar==='Regulatory');
    // E-213 REGISTERED REALITY: the government-register cross-check rows. Every line links to the official
    // source so the reader verifies Tamazia in one click. Renders whenever the payload carries registers,
    // independent of crawl success; a link-out row invites verification rather than asserting a delta.
    const regRows=(D.registers&&D.registers.rows)||[];
    const registersBlock = regRows.length?`
    <div class="subhead" style="margin-top:0"><span class="nt">↳</span><h3>Registered reality: your public register record, checked</h3></div>
    <p class="reg-sub">These lines come from the government registers your firm is already on, by API, not from your website. Verify each one on the official source.</p>
    <div class="reglist">${regRows.map(r=>{
      // E-233: OWN markup + OWN classes. The previous build reused .fw/.fw-head, which is a 4-column GRID
      // (46px 1fr auto auto) expecting .code/.fwn-wrap/.cnt/.fwe — passing one child dropped the content into
      // the 46px column and the text rendered one word per line. Never reuse the framework grid here.
      const cls=r.status==='confirmed'?'ok':(r.status==='not_found'?'miss':(r.status==='unavailable'?'na':'link'));
      const st=r.status==='confirmed'?'On the register':(r.status==='not_found'?'No exact match, confirm on the call':(r.status==='unavailable'?'Register unavailable this scan':'Verify on the register'));
      const rec=r.record?(escH(String(r.record.name||''))+(r.record.number?(' &middot; '+escH(String(r.record.number))):'')+(r.record.detail?(' &middot; '+escH(String(r.record.detail))):'')):'';
      const site=(r.on_site===true)?'Displayed on your site.':(r.on_site===false)?'Not found on your site on this scan.':'Site display not confirmed on this scan.';
      return `<div class="regrow ${cls}">
        <div class="regrow-top"><span class="reg-name">${escH(r.label)}</span><span class="reg-status ${cls}">${st}</span></div>
        ${rec?`<div class="reg-rec">${rec}</div>`:''}
        <div class="reg-line">${escH(r.statute_line)}</div>
        <div class="reg-foot"><span class="reg-site">${site}</span><a href="${escH(r.source_url)}" target="_blank" rel="noopener nofollow" class="reg-verify">Verify on the official register &#8599;</a></div>
      </div>`;
    }).join('')}</div>`:'';
    // E-218: point-in-time banner for anything the verifier has not passed. Honest scope, zero fear theatre,
    // and the re-check is the conversion mechanic.
    const pitBanner = (!D.verified)?`<div class="capt" style="margin:0 0 14px;padding:10px 14px;border:1px solid var(--line,#2a2a2a);border-radius:8px">Point-in-time scan${D.meta&&D.meta.date?(' of '+escH(D.meta.date)):''}${D.superseded?', since superseded by a newer assessment':''}. This view shows register facts, the binding-law map and only the findings that pass Tamazia&rsquo;s evidence gates from that scan. A fresh verified assessment re-checks every line against your live site${D.links&&D.links.booking?': <a href="'+escH(D.links.booking)+'" target="_blank" rel="noopener">book the re-check</a>':'.'}</div>`:'';
  return `
    ${pitBanner}
    ${registersBlock}
    <div class="pane-head"><span class="eyebrow">Regulatory exposure</span>
      <h2>${(D.compliance_unassessed ? (D.render_mode==='knowledge' && (D.frameworksBinding||0)>0 ? ('Your live pages could not be deep-read on this scan, so no breach is asserted anywhere below. What follows instead is the statute map: the '+(D.frameworksBinding)+' frameworks that bind a '+((D.meta&&D.meta.sector)||'regulated')+' firm established in your jurisdiction. Every row is catalogue fact tied to your registration, not inference from your site. A rendered-DOM re-scan completes the breach assessment on top of it.') : 'Compliance could not be assessed this scan. Your site blocked a deep read, so the checks below are incomplete and no pass is implied. A re-scan completes it.') : (D.regulatoryHeadline || ((D.catalogueSize ? ('All '+D.catalogueSize.toLocaleString('en-GB')+' compliance rules in the register were screened. ') : 'The full regulatory catalogue was screened. ')+(D.frameworksBinding||D.frameworksAssessed)+' '+plur(D.frameworksBinding||D.frameworksAssessed,'framework legally binds','frameworks legally bind')+' you, '+D.rulesChecked+' rule '+plur(D.rulesChecked,'check was','checks were')+' executed against them, and '+D.counts.critical+' '+plur(D.counts.critical,'is','are')+' breached on your live site right now.')))}</h2>
      <p>Every scan screens the full framework register${D.catalogueSize?(' ('+D.catalogueSize+' frameworks)'):''}; each one is jurisdiction-, sector-, capability- and trigger-gated, so only the laws that genuinely attach to you appear here. ${D.frameworksBinding} ${plur(D.frameworksBinding,'framework binds','frameworks bind')} you, and ${D.rulesChecked} page-level rule ${plur(D.rulesChecked,'check was','checks were')} executed against them. One box per framework; open it for the breaches, the regulator and its most recent enforcement action.</p></div>
    <div class="subhead" style="margin-top:0"><span class="nt">↳</span><h3>The ${D.frameworksAssessed} frameworks carrying your exposure${D.counts.critical>0?(', with '+D.counts.critical+' breached on your live site right now'):''}, worst exposure first</h3></div>
    <p class="reg-sub">One box per regulator. The bar shows the severity mix; open it for every breach evidenced on your live pages, the regulator's most recent enforcement, and the exact Tamazia fix.</p>
    ${(D.jurisdictions||[]).length>1?`<div class="jur-select"><span class="jur-lbl">Filter by jurisdiction</span><button class="jur-chip active" data-jurf="all">All</button>${D.jurisdictions.map(j=>`<button class="jur-chip" data-jurf="${j}">${j}</button>`).join('')}</div>`:''}
    ${D.frameworks.map((fw,i)=>{
      const tot=Math.max(1,fw.findings), cp=fw.c/tot*100, hp=fw.h/tot*100, sp=Math.max(0,100-cp-hp);
      return `<details class="fw" data-code="${escH(fw.code)}" data-jur="${fw.jur||'Global'}" ${i===0?'open':''}>
      <summary>
        <div class="fw-head"><span class="code">${escH(fw.code)}</span>
          <div class="fwn-wrap"><div class="fwn">${escH(fw.name)} <span class="jbadge">${escH(fw.jur||'Global')}</span>${fw.binding_label?' <span class="jbadge bbadge">'+escH(fw.binding_label)+'</span>':''}</div>${fw.screened ? `<div class="fw-assessed"><span class="abadge">${escH(fw.assessed_label || 'APPLIES · ASSESSED')}</span>${(fw.inspected_pages && fw.inspected_pages.length) ? `<span class="inspected" title="${escH(fw.inspected_pages.slice(0,8).join('  '))}">${fw.inspected_pages.length} ${plur(fw.inspected_pages.length,'page','pages')} inspected</span>` : ''}</div>` : ''}<div class="fwr">${escH(fw.regulator)} · ${fw.screened?'screened this scan':(fw.findings+' '+plur(fw.findings,'breach','breaches'))}</div></div>
          <div class="cnt">${fw.c?`<span class="c">${fw.c} crit</span>`:''}${fw.h?`<span class="h">${fw.h} high</span>`:''}${fw.s?`<span class="s">${fw.s} std</span>`:''}</div>
          <div class="fwe">${escH(fw.exp)}</div></div>
        <div class="fwbar"><div class="fwbar-track">${cp?`<span style="width:${cp}%;background:var(--red)"></span>`:''}${hp?`<span style="width:${hp}%;background:var(--amber)"></span>`:''}${sp?`<span style="width:${sp}%;background:var(--gold-light)"></span>`:''}</div></div>
      </summary>
      <div class="fwbody">
        <div class="lbl">Why this framework matters</div>${escH(fw.why)}
        ${(fw.obligations||[]).length?`<div class="lbl">What ${escH(fw.regulator)} assesses</div><ul class="obl">${fw.obligations.map(o=>`<li>${escH(o)}</li>`).join('')}</ul>`:''}
        ${fw.reg_focus?`<div class="lbl">What ${escH(fw.regulator)} is enforcing right now</div><div class="action">${escH(fw.reg_focus)}</div>`:''}
        ${fw.action?`<div class="lbl">${escH(fw.regulator)} &middot; recent enforcement</div><div class="action">${escH(fw.action)}${fw.enforcement_url?` <a href="${escH(fw.enforcement_url)}" target="_blank" rel="noopener nofollow" class="lawcite">source &#8599;</a>`:''}</div>`:''}
        ${fw.guidance?`<div class="lbl">Recent regulatory change</div><div class="action">${escH(fw.guidance)}</div>`:''}
        ${fw.citation_url?`<div class="lbl">The law</div><div class="action"><a href="${escH(fw.citation_url)}" target="_blank" rel="noopener nofollow" class="lawcite">${escH(fw.name)}, ${escH(fw.regulator)} official source &#8599;</a></div>`:''}
        ${(fw.articleGroups||[]).length?(()=>{const _all=(fw.articleGroups||[]).reduce((s,g)=>s+((g.items||[]).length),0);const _half=Math.ceil(_all/2);let _k=0;return `<div class="lbl">The breaches on your live site, and the Tamazia fix for each</div>
        <div class="artlist">${fw.articleGroups.map(gp=>`<div class="artgroup"><div class="art-head"><span class="art-a">${escH(gp.article)}</span>${gp.inspected.length?`<span class="art-insp">inspected ${gp.inspected.map(escH).join(', ')}</span>`:''}</div>
          <div class="art-items">${gp.items.map(it=>`<div class="art-item"><div class="art-subj"><span class="art-dot ${it.sev==='P0'?'c':it.sev==='P1'?'h':'s'}"></span>${escH(it.subject)}</div>${it.quote?`<div class="art-quote">&ldquo;${escH(it.quote)}&rdquo;</div>`:''}${(!it.quote&&it.absence)?`<div class="art-absence">${escH(it.absence)}</div>`:''}<div class="art-fix"><b>Tamazia fix</b>${CH.lockFix(escH(it.fix), (_k++)>=_half)}</div></div>`).join('')}</div>
        </div>`).join('')}</div>`;})():''}
      </div></details>`;
    }).join('')}`;
  };

  P.seo = ()=>{
    const ks=D.seo.keywordSummary||{};
    const totalTracked=+ks.totalTracked||0, onPageOne=+ks.onPageOne||0;
    const noKeywords=totalTracked===0;
    // PSI is unavailable when the CWV builder fell back to its "not assessed" sentinel
    // (no real CLS/PERF rows). Drives the speed clause + the "failing N of M" header.
    const cwv=(D.seo.cwv||[]);
    const cwvReal=cwv.filter(m=>m.k==='CLS'||m.k==='PERF');
    const psiAvail=cwvReal.length>0;
    const cwvFail=cwv.filter(m=>(m.st||m.state)==='fail').length;
    const cwvN=psiAvail?cwvReal.length:cwv.length;
    const seoHeadline=noKeywords
      ? (psiAvail
          ? 'Your buyers search specialist, commercial terms, not directory listings, and your live site is slow and thin when they do arrive.'
          : 'Your buyers search specialist, commercial terms, not directory listings, and the technical signals below decide who the answer engines surface.')
      : ('Off page one for '+(totalTracked-onPageOne)+' of '+totalTracked+' high-intent searches your buyers are typing'+(psiAvail?', and slow when they do arrive.':'.'));
  return `
    <div class="pane-head"><span class="eyebrow">Search &amp; AI both read these signals</span>
      <h2>${seoHeadline}</h2>
      <p>Search engines and AI answer engines read the same things, speed, structure, security, depth. Every signal below was measured live on your site, and each one is a buyer a competitor is capturing instead of you. Here is the exact fix.</p></div>
    <div class="subhead" style="margin-top:0"><span class="nt">↳</span><h3>On-page, technical and security signals, the structure that decides who ranks and who the answer engines surface.</h3><span class="subhead-note">Live PageSpeed (mobile and desktop) is in the scorecard above.</span></div>
    <div class="grid g2">
      <div class="card pad"><div class="card-h"><div class="t">On-page issues</div><div class="meta">hover a fix</div></div>${CH.issueList(D.seo.onpage,'issue')}</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="card pad"><div class="card-h"><div class="t">Tech &amp; tracking</div></div>
          <div class="facts"><div class="fact"><span class="k">SSL</span><span class="v">${D.seo.tech.ssl}</span></div>
          <div class="fact"><span class="k">Mobile-ready</span><span class="v" style="color:var(--${D.seo.tech.mobile==null?'muted':(D.seo.tech.mobile?'green':'red')})">${D.seo.tech.mobile==null?'Not assessed':(D.seo.tech.mobile?'Yes':'No')}</span></div>
          <div class="fact"><span class="k">Trackers</span><span class="v">${escH(D.seo.tech.trackers)}</span></div>
          <div class="fact"><span class="k">Ad pixels</span><span class="v">${escH(D.seo.tech.adPixels)}</span></div>
          <div class="fact"><span class="k">Page weight</span><span class="v">${D.seo.tech.pageWeight}</span></div>
          <div class="fact"><span class="k">Render</span><span class="v">${D.seo.tech.render}</span></div></div>
        </div>
        <div class="card pad"><div class="card-h"><div class="t">Security headers</div><div class="meta">each missing one is a red flag in enterprise review</div></div>${CH.securityGrid()}</div>
      </div>
    </div>
    <div class="subhead"><span class="nt">↳</span><h3>${D.seo.keywordsThin?'The queries that actually fit a firm of your scale':'Keyword demand a rival is capturing'}</h3></div>
    <div class="card pad">
      ${D.seo.keywordsThin?`<div class="urgent" style="margin-bottom:13px;background:linear-gradient(100deg,var(--cream-2),#fff);border-left-color:var(--gold)"><span class="upulse" style="background:var(--gold);animation:none"></span><div><div class="ut">Local “near me” searches are not your battleground.</div><div class="us">For a firm of your size, buyers search specialist, commercial terms, not directory listings. The low-intent and aggregator-led queries that would misrepresent you have been filtered out. Your real fight is brand authority and AI visibility, where the named rivals are pulling ahead.</div></div></div>`:''}
      ${noKeywords?'':`<div class="flexrow" style="justify-content:space-between;margin-bottom:12px">
        ${CH.stat(D.seo.keywordSummary.opportunity, D.seo.keywordSummary.oppLabel,{red:true,size:'30'})}
        ${CH.stat(D.seo.keywordSummary.onPageOne+' / '+D.seo.keywordSummary.totalTracked,'on page one today',{size:'30'})}
      </div>`}${CH.keywordTable()}</div>`;
  };

  P.geo = ()=>{
    const aiKnows=!!D.geo.aiKnows;
    // #6: the "no reliable information / vouch" boilerplate only holds when AI does NOT know the firm.
    // For a recognised firm, swap in a positive, defend-the-position callout.
    const aiCallout=aiKnows
      ? CH.urgent('AI engines can already identify '+D.meta.company+', the work now is to make you the default named answer over the rivals named alongside you, and to defend that position before they close the gap.', 'Sentiment probe: '+D.geo.sentiment)
      : CH.urgent('A live AI engine, asked who you are by name, returned “no reliable information.” It cannot vouch for you, and when pushed it may invent details you can’t control.', 'Sentiment probe: '+D.geo.sentiment);
    // #10: bind the radar "Entity" axis to the SAME score the header shows (entityReadiness),
    // not the hardcoded 80 the upstream radar may carry, so the 6-signals block and header agree.
    const radarAxes=(D.geo.radar||[]).map(a=>(a&&(a.ax==='Entity'))?Object.assign({},a,{v:D.geo.entityReadiness}):a);
    // #9: the "55% of UK SERPs" stat is UK-specific. For a non-UK firm, drop that clause
    // and keep only the jurisdiction-neutral claims so we never show a UK stat to a US/UAE firm.
    const _ctry=String((D.meta&&D.meta.country)||'').toLowerCase();
    const _mkts=((D.meta&&D.meta.markets)||[]).map(m=>String(m).toUpperCase());
    const isUK=/united kingdom|\buk\b|england|scotland|wales/.test(_ctry)||_mkts.includes('UK')||_mkts.includes('GB');
    const aiOverview=isUK
      ? D.geo.aiOverview
      : String(D.geo.aiOverview||'').replace(/^[^.;]*AI Overviews[;.]?\s*/i,'AI Overviews now sit above the classic results for your category; ');
  return `
    <div class="pane-head"><span class="eyebrow">When your buyers ask AI</span>
      <h2>${D.geo.aiKnows ? 'Are AI assistants recommending '+escH(D.meta.company)+'? You are cited, but rivals are still named alongside you on the core queries your buyers ask.' : (D.geo.citations.length>0 ? 'Are AI assistants recommending '+escH(D.meta.company)+'? Right now, no. On the core queries your buyers ask, the engines name a competitor instead.' : 'Are AI assistants recommending '+escH(D.meta.company)+'? Right now, no. The answer engines do not name you for the core queries your buyers ask yet.')}</h2>
      <p>${D.geo.rootCause?escH(D.geo.rootCause.reason):'The answer engines decide who to name from structured signals you are missing.'} ${escH(aiOverview)}</p></div>
    ${aiCallout}
    <div class="grid g-4-8" style="margin-top:10px">
      <div class="card pad" style="display:grid;place-items:center"><div class="card-h" style="width:100%"><div class="t">AI visibility</div><div class="meta">6 signals</div></div>${CH.radar(radarAxes,210)}</div>
      <div style="display:flex;flex-direction:column;gap:15px">
        <div class="card pad"><div class="card-h"><div class="t">Do AI engines cite you?</div><div class="meta">readiness /100 · ${D.geo.aiKnows?'recognised':'0 citing'}</div></div>${CH.engineGrid()}</div>
        <div class="flexrow" style="gap:15px">
          <div class="card pad" style="flex:1;text-align:center">${CH.stat(D.geo.entityReadiness,'Entity readiness')}</div>
          <div class="card pad" style="flex:1;text-align:center">${CH.stat(D.geo.shareOfVoice,'Share of voice',{red:true})}</div>
          <div class="card pad" style="flex:1.4"><div class="capt" style="margin:0"><b style="font-family:var(--mono);font-size:10px;color:var(--ink)">REPEATABILITY</b><br>${D.geo.repeatability}, the rivals named every run are the ones AI now treats as the default answer.</div></div>
        </div>
      </div>
    </div>
    <div class="grid g2" style="margin-top:10px">
      <div class="card pad"><div class="card-h"><div class="t">Structured-data gaps</div><div class="meta">what AI reads first</div></div>${CH.schemaChecklist()}</div>
      <div class="card pad"><div class="card-h"><div class="t">Authority sources you're absent from</div><div class="meta">source gap</div></div>${CH.sourceGap()}</div>
    </div>
    <div class="subhead"><span class="nt">↳</span><h3>Who AI names instead of you</h3></div>
    <div class="card pad">${CH.citationTable()}</div>
    ${(!D.seo.keywordsThin && (D.seo.keywords||[]).length>=2)?`<div class="subhead"><span class="nt">↳</span><h3>You currently rank 20 to 50 for these. Moving into the top 1 to 10 captures the high-intent traffic AI and Google hand to whoever ranks first</h3></div>
    <div class="card pad">${CH.keywordTable()}</div>`:''}
    <div class="subhead"><span class="nt">↳</span><h3>The fix, in full</h3></div>
    ${CH.finding(D.geo.fix,true,{locked:false})}
    <details class="gloss-mini"><summary>Plain-English glossary · ${Object.keys(D.glossary).length} terms</summary>
      <div class="glossgrid">${Object.entries(D.glossary).map(([k,v])=>`<div class="glossitem"><b>${escH(k)}</b><span>${escH(v)}</span></div>`).join('')}</div></details>`;
  };

  P.competitors = ()=>`
    <div class="pane-head"><span class="eyebrow">The firms being chosen over you</span>
      <h2>You versus the firms AI and Google name first for “${escH(D.competitors.bestKeyword)}”, and the exact move that overtakes each one.</h2>
      <p>These are the real, direct competitors the answer engines and search results put ahead of you, directories, blogs and listicles filtered out. For each, the one gap that decides it and the precise way you close it. The gap compounds every month you wait.</p></div>
    <div class="card pad" style="margin-bottom:14px"><div class="card-h"><div class="t">Head-to-head</div><div class="meta">real peers · your row highlighted</div></div>${CH.competitorTable()}</div>
    <div class="subhead"><span class="nt">↳</span><h3>How you beat each of them, the specific play, rival by rival</h3></div>
    <div class="card pad" style="margin-bottom:14px">${(D.competitors.ladder||[]).map((c,i)=>`<div class="beatcard">
      <div class="bc-rank">${i+1}</div>
      <div class="bc-body">
        <div class="bc-top"><span class="bc-rival">${escH(c.name)}</span><span class="bc-sig">${escH(c.signal)}</span></div>
        <div class="bc-move"><span class="bc-k">Beat them by</span> <b>${escH(c.beatBy.fix)}</b></div>
        <div class="bc-proof"><span class="bc-arrow">↳</span> ${escH(c.beatBy.proof)}</div>
        <div class="bc-foot"><span class="bc-metric">▸ ${escH(c.beatBy.metric)}</span>${c.beatBy.lever?`<span class="bc-lever"><span class="bc-lk">Tamazia lever</span> ${escH(c.beatBy.lever)}</span>`:''}</div>
      </div></div>`).join('')||'<div class="capt" style="margin:0">Your category was mis-classified upstream, competitor set is being re-probed for this firm.</div>'}</div>
    <div class="grid g2">
      ${D.competitors.sovBar
        ? `<div class="card pad"><div class="card-h"><div class="t">AI share of voice, you vs the firms named every run</div><div class="meta">real probe · ${D.competitors.sovBar.of} ${plur(D.competitors.sovBar.of,'run')}</div></div>${CH.bars(D.competitors.sovBar.rows,{max:D.competitors.sovBar.of,fmt:v=>v+'/'+D.competitors.sovBar.of})}</div>`
        : `<div class="card pad"><div class="card-h"><div class="t">AI citations &amp; page-one</div><div class="meta">you vs leader</div></div>${CH.bars(D.competitors.aiKwBars,{max:Math.max(2,...(D.competitors.aiKwBars||[{v:1}]).map(b=>b.v))})}</div>`}
      <div class="card pad"><div class="card-h"><div class="t">Domain rating vs rivals</div><div class="meta">0 to 100 authority</div></div>${CH.bars(D.competitors.drBars,{max:100})}${(D.competitors.ladder||[]).some(c=>c.drEstimated)?'<div class="capt" style="margin-top:7px">Rivals that publish no Domain Rating are shown as an <b>est</b>imate from their authority signals.</div>':''}</div>
    </div>
    ${CH.urgent('The gap compounds. Every month you are absent, the firms AI names every time accumulate the citations and authority that make them harder to displace.', 'Tamazia closes the entity, schema and authority gap that decides who gets named.')}`;

  P.plan = ()=> planAndPricing();

  /* TRUSTED-BY marquee removed (founder request 2026-07-20): the strip rendered placeholder/
     invented wordmarks and a real "adidas" mark under a "Trusted by regulated firms…" label —
     false client claims on a client-facing report. No client names are asserted anywhere now;
     credibility rests on the founder credential + the adjudication line, which are real. The
     .trusted-by / .tb-* CSS and the /audit/trusted-logos assets are no longer referenced. */

  // E12/E40 · severity language, defined inline at first use. "P0" was internal engineering vocabulary,
  // and every finding was being called "critical" regardless of its actual severity. The three words are
  // now defined once, here, and every severity dot carries the matching definition as a hover tip.
  const SEV_KEY = (D.severityDefs && D.severityDefs.length) ? D.severityDefs : [
    {word:'Critical', def:"A live breach of binding law on your site today, the item a regulator's first letter cites."},
    {word:'High',     def:'Regulator-visible on inspection, one step from a breach citation.'},
    {word:'Standard', def:'A best-practice gap costing rankings and AI visibility, not enforcement.'},
  ];
  function severityKey(){
    return `<div class="sev-key capt" role="note" aria-label="How severity is graded in this report">
      <span class="sev-key-h">How severity is graded here:</span>
      ${SEV_KEY.map(x=>`<span class="sev-key-i"><b>${escH(x.word)}</b> ${escH(x.def)}</span>`).join('')}
    </div>`;
  }

  // The top breaches as yellow-caution severe cards (Kimi §3); any beyond three continue as the existing
  // collapsed .finding rows. The locked flag is computed on the FULL D.fixes list exactly as before
  // (i >= ⌈N/2⌉) so the freemium half-lock counts are byte-identical. ids stay fx-1..N; severeCard renders
  // <article class="finding sev-card"> so the data-finding jump + the .finding contract still hold.
  function severeTrio(){
    const all=D.fixes||[]; const n=all.length; const lockOf=i=>i>=Math.ceil(n/2);
    const sev=all.slice(0,3).map((f,i)=>CH.severeCard(f,i,{id:'fx-'+(i+1),locked:lockOf(i)})).join('');
    const rest=all.slice(3).map((f,j)=>CH.finding(f,false,{id:'fx-'+(j+4),locked:lockOf(j+3)})).join('');
    return `<div class="sev3">${sev}</div>${rest}`;
  }

  /* ---------------- PLAN + PRICING + ADD-ONS + BOOKING ---------------- */
  // C-A: this pane is the ONE display source. Every price/figure here READS from the PRICES block above,
  // which mirrors src/content/pricing.ts verbatim (the canonical price config). The adapter's D.pricing is
  // consumed ONLY for the per-firm recommendation flags (rec/popular); it carries no prices. The server-side
  // Stripe/Cal mapping is functions/audit/_commerce.js (checkout only, not a display source).
  // gbpFmt: GBP-canonical formatter. ALL work is quoted + invoiced in GBP (see the pricing copy), so this is
  // used ONLY for the internal data-price value carried in the add-on intake POST (never shown to the buyer as
  // a localised price). Every VISIBLE price/figure goes through fmtMoney (currency-aware, D.cur + toggle). (C-E)
  const gbpFmt=n=>'£'+Number(n).toLocaleString('en-GB');
  // ---- Currency by region (founder: UK→£, EU→€, US→$, Middle East→AED, else £). All work is quoted +
  // invoiced in GBP; the local figure is an indicative conversion (rates approximate, rounded to clean values).
  // Detected from the audited firm's jurisdiction; a small toggle lets the viewer switch. ----
  const CURRS={GBP:{code:'GBP',sym:'£',rate:1},USD:{code:'USD',sym:'$',rate:1.27},EUR:{code:'EUR',sym:'€',rate:1.17},AED:{code:'AED',sym:'AED ',rate:4.65}};
  // The firm's HOME country is authoritative ("if client from uk → gbp"). Secondary operating markets only
  // act as a tiebreaker when the home country is unknown — so a UK firm that also serves France stays GBP.
  function curForRegion(){
    const pick=s=>{
      if(/emirat|\buae\b|dubai|abu dhabi|saudi|\bksa\b|qatar|bahrain|kuwait|\boman\b|\bgcc\b|middle east/.test(s)) return CURRS.AED;
      if(/united states|\busa?\b|america/.test(s)) return CURRS.USD;
      if(/european union|german|france|french|spain|italy|netherl|ireland|belgium|portugal|austria|greece|\beu\b|\bfr\b|\bde\b|\bes\b|\bnl\b|\bie\b/.test(s)) return CURRS.EUR;
      if(/united kingdom|\buk\b|\bgb\b|britain|england|scotland|wales/.test(s)) return CURRS.GBP;
      return null;
    };
    return pick(String((D.meta&&D.meta.country)||'').toLowerCase())
        || pick((((D.meta&&D.meta.markets)||[]).join(' ')).toLowerCase())
        || CURRS.GBP;   // confused → GBP fallback
  }
  let _curState=curForRegion();
  const fmtMoney=gbp=>{ const raw=(+gbp||0)*_curState.rate; const v=_curState.rate===1?raw:Math.round(raw/50)*50; return _curState.sym+v.toLocaleString('en-GB'); };
  // a toggleable price token: re-formats live when the currency toggle changes (.cmoney elements carry the GBP base)
  const priceSpan=(gbp,cls)=>'<span class="cmoney'+(cls?' '+cls:'')+'" data-gbp="'+gbp+'">'+fmtMoney(gbp)+'</span>';
  // Canonical tier display mirrors the live website EXACTLY: Standard price struck through, "From" price,
  // and the 6-month savings framing. Bullets are VERBATIM headlines from src/content/pricing.ts (the pane
  // is the display owner). feats = the 4 shown collapsed; more = the rest, behind "See everything ›".
  const PRICING_TIERS_RENDER=[
    {key:'foundation',name:'Foundation',standard:PRICES.tiers.foundation.standard,from:PRICES.tiers.foundation.from,saves6:PRICES.tiers.foundation.saves6,wk:'Single-location · local authority',
      blurb:'Single-location businesses and small groups building local search authority and compliance defence.',
      feats:[
        'The searches your buyers run when ready to act, targeted with commercial precision',
        'Every word reviewed against your sector’s legal framework before it goes live',
        'A complete technical audit with a prioritised fix document for your dev team',
        'Your Google Business Profile optimised to outrank local competitors',
      ],
      more:[
        'Business information verified across every directory your buyers trust',
        'Baseline AI-search audit across Claude, ChatGPT, Perplexity & Google AI Overviews',
        'Monthly reporting that attributes organic search to revenue, not positions',
        'Your primary operating jurisdiction covered, with change notifications',
      ]},
    {key:'authority',name:'Authority',standard:PRICES.tiers.authority.standard,from:PRICES.tiers.authority.from,saves6:PRICES.tiers.authority.saves6,wk:'Multi-location · two jurisdictions',
      blurb:'Multi-location and multi-property brands scaling organic growth across regions and jurisdictions.',
      feats:[
        'Everything in Foundation, included',
        'Every location, practice area & service line ranked simultaneously (30 keywords)',
        'GEO included as standard, your brand inside AI-generated answers',
        'The strategy that removes dependency on platforms taking 15 to 25% per booking',
      ],
      more:[
        'Online personal branding grown alongside your rankings',
        'Two jurisdictions reviewed on every piece of content simultaneously',
        'Four compliance-reviewed content pieces monthly',
        'Editorial placements in sector-relevant publications',
        'Up to three locations fully managed on Google Business Profile',
        'Regulatory monitoring across both jurisdictions, 72-hour notification',
        'Bi-weekly reporting with revenue attribution across all locations',
      ]},
    {key:'enterprise',name:'Enterprise',standard:PRICES.tiers.enterprise.standard,from:PRICES.tiers.enterprise.from,saves6:PRICES.tiers.enterprise.saves6,wk:'Full-stack · multi-market mandate',
      blurb:'Enterprise and regulated brands requiring full-stack SEO dominance across multiple jurisdictions.',
      feats:[
        'Everything in Authority, included',
        'Every market, territory & commercial keyword covered (50+ keywords)',
        'Your brand established as the source AI systems cite across all major engines',
        'IPO-grade compliance review applied to every asset, across every jurisdiction',
      ],
      more:[
        'Online personal branding grown alongside your rankings, across every platform your buyers check',
        'International SEO across up to five markets, full technical implementation',
        'Ten compliance-reviewed content pieces monthly',
        'Every location in your portfolio managed on Google Business Profile',
        'Crisis reputation management built before it is needed',
        'Dedicated regulatory monitoring with 24-hour notification',
        'Transaction-level revenue attribution across every market',
      ]},
  ];
  // Founder r29 · per-bullet "?" subtext for Route 2, synced from the website pricing cards
  // (src/content/pricing.ts feature bodies), kept tooltip-length. Indexed to feats[] above.
  const TIER_TIPS = {
    foundation: [
      "Keyword strategy built around transactional search across your sector, mapped against competitors' current positions before a word is written.",
      "One compliance-reviewed content piece a month, checked against your sector's rules (SRA, MHRA, FCA, ABA, HIPAA, RERA) before Google or a regulator sees it.",
      "Core Web Vitals, redirect chains, crawl errors, broken links and schema gaps identified and ranked by impact, delivered as developer instructions.",
      "Full Google Business Profile optimisation for one location: categories, attributes, posting schedule, Q&A, photos and a review-response system.",
    ],
    authority: [
      "Every Foundation deliverable carries forward into Authority, then builds on it.",
      "30 keywords across your full commercial footprint, so every location and service line surfaces for its own searches on the same day.",
      "GEO as standard: content restructured for AI citation across Claude, ChatGPT, Perplexity and Google AI Overviews.",
      "Direct search visibility that intercepts buyers before Booking.com or Expedia take their 15 to 25% cut, the approach behind 480% peak client revenue growth (verified).",
    ],
    enterprise: [
      "Every Authority deliverable carries forward into Enterprise, then scales across markets.",
      "50 or more keywords across every geography your buyers search from: London, Dubai, New York and beyond.",
      "Full AI-search dominance: structured data, entity and knowledge-panel work across Claude, ChatGPT, Perplexity, Google AI Overviews, Gemini and Copilot.",
      "UK GDPR, FCA COBS, SRA, HIPAA, MHRA, ASA, ABA, RERA, DFSA, UAE PDPL and more, applied to every asset across every jurisdiction.",
    ],
  };
  // Founder r31 · "?" subtext for the "See all inclusions" pointers (more[]), indexed to each tier's more[].
  const MORE_TIPS = {
    foundation: [
      "Directory citations with consistent name, address and phone across legal directories, healthcare registries, hospitality aggregators and property portals.",
      "Your current presence across the AI engines for your most commercial queries, documented at start and reviewed quarterly.",
      "A GA4 report showing which searches converted to bookings, appointments or enquiries, attributed to organic search at channel level.",
      "Your market's legal framework applied to every piece, with notification within one week of any change requiring an update.",
    ],
    authority: [
      "Managed audience development for your principals across the platforms enterprise buyers check before any conversation.",
      "UK and UAE, UK and USA, or UAE and USA: one agency holding both regulatory environments, not two who never speak.",
      "Practice areas, property types, service lines and procedures covered in one monthly programme.",
      "Two media outreach contacts a month to sector-relevant publications; placement earned on editorial merit, not guaranteed.",
      "Each location profiled separately with its own category strategy, posting schedule and review management.",
      "Every new ruling in your sectors flagged within 72 hours, with the exact page and rule affected.",
      "Twice-monthly reporting tying organic search to revenue across every location.",
    ],
    enterprise: [
      "A full personal-brand programme for your senior team across every platform buyers and partners evaluate.",
      "Hreflang, geo-targeted content and market-specific keyword strategies across up to five territories.",
      "Volume calibrated to your full operational scope, every piece reviewed across all covered jurisdictions.",
      "No location cap: hotel groups across countries, firms across cities, each with its own local strategy.",
      "Monitoring, suppression and response architecture in place before any incident, structural protection not reactive PR.",
      "Law changes tracked across every country you operate in, with content updated within one week.",
      "GA4 at transaction level, a monthly senior strategy call, and a board-ready executive review.",
    ],
  };
  function planData(){
    const Dp=Array.isArray(D.pricing)?D.pricing:[];
    const byName=n=>Dp.find(p=>String(p.tier||'').toLowerCase()===n)||{};
    const TIERS=PRICING_TIERS_RENDER.map(t=>{const d=byName(t.key);return Object.assign({ rec:!!d.rec, popular:!!d.popular },t);});
    // ensure exactly one recommended + one popular even if the adapter flags drift
    if(!TIERS.some(t=>t.rec)) TIERS[2].rec=true;
    if(!TIERS.some(t=>t.popular)) TIERS[1].popular=true;
    return TIERS;
  }
  // #8: add-on copy must not leak wrong-sector regulators. MHRA (UK medicines) only fits
  // healthcare; FCA/COBS (financial conduct) only fits financial firms. Detect from the sector
  // label and swap to a generic, sector-correct phrase otherwise.
  const _sectorStr=String((D.meta&&D.meta.sector)||'').toLowerCase();
  const isHealthcare=/health|medic|clinic|dental|pharma|care|hospital|wellness|aesthet/.test(_sectorStr);
  const isFinancial=/financ|bank|wealth|invest|insur|account|fintech|capital|asset manage|advis/.test(_sectorStr);
  const gbpAdRule=isHealthcare?'MHRA and sector ad rules':'your sector’s advertising rules';
  const coldSendRule=isFinancial?'FCA and COBS-compliant sends':'jurisdiction-compliant, opt-out-respecting sends';
  // Independent Solutions (C4) · SIX cards. ICP Outreach (E50) and Reputation & Crisis (E51, folded into
  // Regulatory Watch) are DELETED from both surfaces. Copy is the single source shared with the website
  // strip (src/components/sections/Pricing.astro), so the two can never drift again (E52 / E53).
  // Prices from PRICES.independent (mirrors pricing.ts): `anchor` is the standard fee, `offer` is the
  // first-engagement rate this report unlocks, and anchor = 2 x offer exactly.
  const I=PRICES.independent;
  const ADDONS=[
    {key:'websiteRemodelling', nm:'Website Remodelling', anchor:I.websiteRemodelling.anchor, offer:I.websiteRemodelling.offer, typical:I.websiteRemodelling.typical, unit:'one-time', hero:true,
      scope:'The site buyers trust and act on, rebuilt end to end on a compliant, fast, conversion-led foundation.',
      usp:'SEO and GEO can deliver the buyer; a site that does not convert spends that buyer. And your website is your largest regulated publication, live in front of your regulator 24 hours a day. The rebuild treats both problems as one.',
      excl:'A build, not a mandate: ongoing rankings, AI visibility and monthly content live in the mandates.',
      spec:['Audit of the current site against speed, conversion and compliance','Information architecture and page plan mapped to buyer intent','Colour, type and copy crafted end to end; each word keyword-optimised','Design and build on a Core-Web-Vitals-clean foundation','Optimised for the AI engines: schema, entity and llms.txt built in','Every page legally reviewed before launch; CTAs tested before ship','Handover with the work owned outright once paid']},
    {key:'aiAuthority', nm:'AI Authority', anchor:I.aiAuthority.anchor, offer:I.aiAuthority.offer, unit:'mo', hero:true,
      scope:'Be the named answer across the AI engines, with the machine-readable identity they read first. Month one is the entity build.',
      usp:'Ask ChatGPT tonight who the leading firms in your field are. Whatever it answers is already being read by your next client. The engines are choosing their citation set for your sector now; the names cited early compound.',
      excl:'Included inside Authority and Enterprise mandates; buy standalone only when no mandate runs.',
      spec:['Entity, schema, llms.txt and Wikidata build in month one','Google Knowledge Panel and sameAs across every verified profile','Answer-surface content targeting real buyer prompts, monthly','Compliance review of what the AI engines say about you','Per-engine position and share-of-voice reporting against named rivals (a report, not a guaranteed placement)']},
    {key:'onlinePersonalBranding', nm:'Online Personal Branding', anchor:I.onlinePersonalBranding.anchor, offer:I.onlinePersonalBranding.offer, unit:'mo',
      scope:'You and your senior team made the named experts buyers find first, on every platform they check. LinkedIn programme included.',
      usp:'Buyers shortlist the partner before the firm. When a general counsel, a patient or an investor searches your name, whatever surfaces is the pitch that happens without you.',
      excl:'Individual authority only; the firm’s rankings and AI visibility live in the mandates.',
      spec:['Voice and positioning captured for each principal','500-parameter LinkedIn profile optimisation, refreshed monthly','Ghostwritten, SEO-optimised posts on a schedule, each legally reviewed before publication','All profiles optimised and synced to the persona','Google snippet and priority-box targeting for your name','Reach and engagement reported monthly']},
    {key:'instagramPresence', nm:'Instagram Presence', anchor:I.instagramPresence.anchor, offer:I.instagramPresence.offer, unit:'mo',
      scope:'The social proof buyers check before they ever reach your website, held to your sector’s advertising code.',
      usp:'Before a patient books, a guest reserves or a buyer enquires, they look. An inactive or off-brand profile quietly prices you down before a word is exchanged.',
      excl:'Built for healthcare, aesthetics, hospitality, F&B and property. For law firms, Online Personal Branding is the correct instrument.',
      spec:['Content plan aligned to the brand and sector','Posts and stories produced on a schedule','Profile optimisation and sector-aligned audience engagement by a specialist growth team, never bought followers','Every post checked against '+gbpAdRule+' before publication','Reach and engagement reported monthly (no follower guarantee)']},
    {key:'ymylContent', nm:'YMYL Content', anchor:I.ymylContent.anchor, offer:I.ymylContent.offer, unit:'piece',
      scope:'Health, legal and money grade content, per compliance-reviewed piece.',
      usp:'Google holds Your-Money-or-Your-Life content to its highest standard; your regulator holds it higher. A piece that fails legal review costs you twice: the rewrite, and the exposure for every day it was live.',
      excl:'Per piece, on demand; monthly content programmes live inside the mandates.',
      spec:['1,500 or more words per piece, scoped to the query, never padded','Up to 100 keywords mapped per piece','Structured for search and AI citation','Vetted against your sector’s legal register before publication','Published on your website plus two blog properties','Brand and reputation angle built into every brief']},
    {key:'gbpDomination', nm:'GBP Domination', anchor:I.gbpDomination.anchor, offer:I.gbpDomination.offer, unit:'mo',
      scope:'Local map dominance for up to three locations, every element compliance-checked.',
      usp:'For clinics, hotels, restaurants and local firms, the map pack is the first screen most buyers ever see, and the last one most ever scroll past.',
      excl:'Local visibility only; site-wide rankings, content and AI visibility live in the mandates.',
      spec:['Up to three locations, each with its own category strategy','30,000 or more compliance-checked map citations per location','Posting schedule, Q&A and review-response system','Every element checked against '+gbpAdRule,'Local positions reported monthly']},
  ];
  // ---- interactive trajectory: current (flat/declining) vs Tamazia-projected (rising) ----
  // Reads real numbers from D (score, projected.wk12/wk24, trajectory). Hovering a tier tab
  // scales the projected ceiling so a higher mandate visibly lifts the curve. Keeps a .traj-pts
  // node so the existing render harness still detects the chart.
  function planTrajectory(score,wk12,wk24,TIERS,recKey){
    const W=900,H=176,padL=40,padR=18,padT=14,padB=30,iW=W-padL-padR,iH=H-padT-padB;
    const clamp=v=>Math.max(0,Math.min(100,+v||0));
    const X=i=>padL+iW*(i/2);
    const Y=v=>padT+iH*(1-clamp(v)/100);
    // current path: no engagement. A flat-to-declining drift from today's score.
    const cur=[score, Math.max(0,score-3), Math.max(0,score-6)];
    // projected path: today -> wk12 -> wk24, the real numbers from D.
    const proj=[score, clamp(wk12), clamp(wk24)];
    const lineOf=a=>a.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
    const areaOf=a=>`${lineOf(a)} L${X(2).toFixed(1)} ${(padT+iH).toFixed(1)} L${X(0).toFixed(1)} ${(padT+iH).toFixed(1)} Z`;
    const id='ptj'+Math.random().toString(36).slice(2,7);
    const grid=[0,25,50,75,100].map(g=>`<line x1="${padL}" y1="${Y(g).toFixed(1)}" x2="${W-padR}" y2="${Y(g).toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${padL-7}" y="${(Y(g)+3).toFixed(1)}" text-anchor="end" font-family="var(--mono)" font-size="8" fill="var(--muted-2)">${g}</text>`).join('');
    const dotsProj=proj.map((v,i)=>`<circle class="ptj-d" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="5" fill="${i===0?'#B3261E':i===2?'#2F7A4A':'#7A2A3B'}" stroke="#fff" stroke-width="2"/>`).join('');
    const dotsCur=cur.map((v,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3.4" fill="var(--muted-2)" stroke="#fff" stroke-width="1.5"/>`).join('');
    const labX=['Today','Week 12','Week 24'];
    return `<div class="plan-traj" data-traj
        data-score="${score}" data-w12="${proj[1]}" data-w24="${proj[2]}"
        data-c1="${cur[1]}" data-c2="${cur[2]}">
      <div class="ptj-head">
        <div><div class="ptj-t">Your trajectory, with Tamazia and without</div>
          <div class="ptj-meta">today ${score} ↗ week 12 ${proj[1]} ↗ week 24 ${proj[2]} · hover a tier to see it lift</div></div>
        <div class="ptj-key"><span class="k-cur">Left to drift</span><span class="k-proj">With Tamazia</span></div>
      </div>
      <svg class="ptj-svg" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Projected score trajectory">
        <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9A87C" stop-opacity=".40"/><stop offset="1" stop-color="#C9A87C" stop-opacity="0"/></linearGradient></defs>
        ${grid}
        ${labX.map((l,i)=>`<text x="${X(i).toFixed(1)}" y="${H-9}" text-anchor="${i===0?'start':i===2?'end':'middle'}" font-family="var(--mono)" font-size="8.5" fill="var(--muted)">${l}</text>`).join('')}
        <path class="ptj-curarea" d="${areaOf(cur)}" fill="rgba(110,98,95,.07)"/>
        <path class="ptj-cur" d="${lineOf(cur)}" fill="none" stroke="var(--muted-2)" stroke-width="2" stroke-dasharray="5 5"/>
        <path class="ptj-projarea" d="${areaOf(proj)}" fill="url(#${id})"/>
        <path class="ptj-proj" d="${lineOf(proj)}" fill="none" stroke="#7A2A3B" stroke-width="2.6"/>
        ${dotsCur}${dotsProj}
      </svg>
      <div class="traj-pts">
        <div class="traj-pt now"><b>${score}</b>Today · ${D.grade}</div>
        <div class="traj-pt"><b>${proj[1]}</b>Week 12</div>
        <div class="traj-pt end"><b>${proj[2]}</b>Week 24</div>
      </div>
      <p class="ptj-caption capt">Projected score with Sprint II completed and a mandate underway. The trajectory is a model of the fix plan, not a promise. Rankings typically move in months two to three, revenue in months four to six.</p>
      <div class="ptj-tiers"><span class="lbl">Projection assumes</span>${TIERS.map((t,i)=>`<button type="button" data-tier-tab="${i}" class="${i===0?'active':''}">${t.name}</button>`).join('')}</div>
    </div>`;
  }

  /* ---------------- ROUTE 1 (C1): the Fix Sprint · severity-based tiers ---------------- */
  // E37/E38/E40: count-based "Top 10 / 20 / 30" tiers (which read as a ransom, and called every finding
  // "critical") are replaced by severity-based Sprints with contractual delivery windows.
  // FIRST-ENGAGEMENT PRICING: `standard` is the published fee, `price` is what this report unlocks.
  // price = standard / 2, exactly. The strike is explained on the card, never left as decoration.
  function issuesTotal(){
    return (D.counts&&(D.counts.total||((D.counts.critical||0)+(D.counts.high||0)+(D.counts.medium||0)+(D.counts.low||0))))||+D.rulesChecked||0;
  }
  function sprintTiers(){
    const S=PRICES.fixSprints, n=issuesTotal();
    const critHigh=((D.counts&&D.counts.critical)||0)+((D.counts&&D.counts.high)||0);
    return [
      {k:'1', label:'Sprint I', nm:'Enforcement Clearance', price:S.sprint1.offer, standard:S.sprint1.standard, days:S.sprint1.days,
       head:'Every Critical and High regulatory finding on this report, closed.',
       blurb:`The layer a regulator's first letter cites, gone before the letter exists. ${critHigh>0?(critHigh+' '+plur(critHigh,'finding')+' in scope on this report.'):'Scoped to the regulatory findings on this report.'}`},
      {k:'2', label:'Sprint II', nm:'Full Remediation', price:S.sprint2.offer, standard:S.sprint2.standard, days:S.sprint2.days, badge:'Most chosen',
       head:`All ${n} ${plur(n,'finding')} on this report, closed.`,
       blurb:'Every finding on this report closed: compliance, search and AI visibility together.'},
      {k:'3', label:'Sprint III', nm:'Remediation + Verified Re-score', price:S.sprint3.offer, standard:S.sprint3.standard, days:S.sprint3.days,
       head:`All ${n} ${plur(n,'finding')} closed, re-scanned and certified.`,
       blurb:'Sprint II, then the prosecution-grade re-scan, a re-scored certificate, the evidence pack, and 30 days of Regulatory Watch. Built for the firm whose committee and insurer need the paper, not just the fix.'},
    ];
  }
  const SPRINT_DEFAULT=1;   // Sprint II is the default tab (C1)
  // The Sprint buy CTA. E39: an unset Payment Link must NEVER hide the button. When STRIPE.sprintN is empty
  // the CTA falls back to the intake modal (data-book), and its href is a real booking URL so it works with
  // JavaScript disabled too. A payment path always exists.
  function sprintCta(k){
    const url=sprintStripe(k);
    return url
      ? `<a class="btn solid block r1-buy" href="${escH(url)}" target="_blank" rel="noopener" data-fixtier="${escH(k)}">Take the first-engagement rate&nbsp;↗</a>`
      : `<a class="btn solid block r1-buy" href="${escH(bookUrl('sprint'))}" data-book="one_time_fix" data-fixtier="${escH(k)}">Start the Fix Sprint&nbsp;↗</a>`;
  }
  // The whole card body, re-rendered on every tab change (one code path, so the tabs can never desync).
  function sprintCardHtml(i){
    const T=sprintTiers(), sp=T[i]||T[SPRINT_DEFAULT];
    const credit=Math.round(sp.price*(PRICES.fixSprintCreditPct/100));
    const found=PRICES.tiers.foundation.from;
    const spare=credit-found;
    const sc=PRICES.scco;
    const hours=35, counsel=hours*sc.gradeA;
    const topFix=String((((D.fixes||[])[0])||{}).title||'your highest-severity finding').toLowerCase();
    const n=issuesTotal();
    const outcomes=[
      `Your highest-severity findings closed first, in priority order, starting with ${topFix}`,
      `A prosecution-grade re-scan of all ${D.frameworksBinding} binding ${plur(D.frameworksBinding,'framework','frameworks')}, proving every fix landed`,
      'An evidence pack your compliance committee and your insurer can file',
      `Half of your Sprint fee returned as credit against any mandate begun within ${PRICES.fixSprintCreditDays} days`,
      'A fixed scope and a fixed price. One engagement, not a retainer',
    ];
    return `
          <div class="fx-body">
            <div class="fx-eyebrow">One-time Fix Sprint · ${escH(sp.label)} · ${escH(sp.nm)}</div>
            <h3 class="r1-head">${escH(sp.head)}</h3>
            <p class="fx-line">A regulator does not read your intentions; it reads your live site, exactly as this scan did. ${n} ${plur(n,'finding')} ${plur(n,'sits','sit')} on yours today. At the courts' guideline hourly rates a Grade A London solicitor is ${priceSpan(sc.gradeA)} an hour (<a href="${escH(sc.sourceUrl)}" target="_blank" rel="noopener">${escH(sc.source)}</a>); ${hours} hours of external counsel time on this scope is ${priceSpan(counsel)} in advice alone, before anyone edits a page. The Sprint is the same outcome, productised: reviewed by lawyers, implemented by engineers, evidenced at the end, at a fixed price a partner can sign without a meeting.</p>
            <p class="fx-tierline">${escH(sp.blurb)}</p>
            <ul class="fx-list">${outcomes.map(o=>`<li>${escH(o)}</li>`).join('')}</ul>
          </div>
          <div class="fx-side">
            <div class="fx-price"><span class="fx-was r1-was cmoney" data-gbp="${sp.standard}">${fmtMoney(sp.standard)}</span><b class="r1-price cmoney" data-gbp="${sp.price}">${fmtMoney(sp.price)}</b></div>
            <div class="fx-firstline">First-engagement rate. The standard fee is ${priceSpan(sp.standard)}; this report unlocks the introductory price of ${priceSpan(sp.price)} because it is your first engagement with Tamazia.</div>
            <div class="fx-anchor r1-cap">One-time · fixed scope · delivered in ${sp.days} days, contractually</div>
            <div class="fx-credit">${PRICES.fixSprintCreditPct}% of the fee, ${priceSpan(credit)}, is credited against your first retainer or mandate begun within ${PRICES.fixSprintCreditDays} days. Foundation is ${priceSpan(found)} a month, so the credit covers your first mandate month${spare>0?` with ${fmtMoney(spare)} spare`:''}.</div>
            ${sprintCta(sp.k)}
            <a class="btn block fx-cta" href="${escH(bookUrl('sprint'))}" data-book="one_time_fix" data-fixtier="${escH(sp.k)}">Or scope it in 20 minutes&nbsp;↗</a>
          </div>`;
  }

  /* ---------------- ROUTE 3 (C3): Unlock + Regulatory Watch, the merged product ---------------- */
  // £495 unlocks every finding on this report AND starts month one of Regulatory Watch; from month two it is
  // £1,500 a month. The £495 is credited in full against any Sprint or mandate within 90 days (E41 / E49).
  // Regulatory Watch absorbs the retired Reputation & Crisis product (E51): review, mention and press
  // monitoring now sit inside the Watch spec list. The struck £1,500 is the report's published standalone
  // price, so the anchor is honest, not invented.
  // E39/E16: the buy CTA is NEVER hidden. When no Payment Link is set it routes to the metadata-bearing
  // /api/stripe/checkout intake (data-subscribe), whose contract is UNCHANGED so the webhook can still flip
  // audit_pages.unlocked for THIS exact report.
  function route3(){
    const P3=PRICES.exposureReport;
    const unlock=P3.unlock, cover=P3.monthlyCover, rv=P3.realValue, creditDays=P3.creditDays;
    const specs=[
      ['The full Exposure Report','Every locked fix opened in full, plus the complete compliance, search and AI-visibility assessment.'],
      ['Monthly re-scan and re-score','This exact audit re-run on your live data every month; the record always reflects the site as it stands today.'],
      ['Change log','A month-by-month history of what moved: findings closed, new gaps, score and exposure over time.'],
      ['72-hour breach alert','A new breach on your live site flagged within 72 hours of appearing, before enforcement or a competitor moves.'],
      ['Regulatory change alerts','Every new ruling in your sector flagged the day it lands, with the exact page, rule, impact, and the change required.'],
      ['Review, mention and press monitoring','Your reputation watched in real time, with a crisis playbook on standby.'],
      ['Board-ready quarterly certificate','A filed record your committee and insurer can rely on, benchmarked against your named competitors.'],
      ['Search and AI position tracking','Rankings and AI share of voice tracked over time against the rivals named alongside you.'],
      ['Legal oversight','Every monthly record is reviewed by the legal team before it reaches you.'],
    ];
    const specList=`<ul class="r3-list r3-specs">${specs.map(s=>`<li><span class="r3-spec-t">${escH(s[0])}</span><span class="r3-spec-q" data-tip="${escH(s[1])}" tabindex="0" role="note" aria-label="${escH(s[0])}: ${escH(s[1])}">?</span></li>`).join('')}</ul>`;
    // The pay CTA. A Payment Link is used only when one is pasted; otherwise the always-valid checkout/intake
    // path runs. Either way a button renders with a real destination.
    const payCta=(label,kind,trial)=>{
      const href=unlockHref();
      return href
        ? `<a class="btn solid block" href="${escH(href)}" target="_blank" rel="noopener">${label}&nbsp;↗</a>`
        : `<a class="btn solid block" href="${escH(bookUrl(kind==='exposure_cover'?'scoping':'findings'))}" data-subscribe="${escH(kind)}" data-trial="${trial||0}">${label}&nbsp;↗</a>`;
    };

    if(D.unlocked){
      // Cold / already-unlocked page: no paywall. Lead with the standing-record framing and ongoing Watch.
      return `
    <div class="subhead" style="margin-top:16px"><span class="nt">↳</span><h3>Route 3 · Regulatory Watch</h3></div>
    <p class="plan-sub r3-gold">Every fix in this report is already open to you. Keep it that way: ${priceSpan(cover)} a month keeps a legal team standing between your website and your regulator.</p>
    <div class="route route3">
      <div class="r3-rib">Where most boardrooms start</div>
      <div class="r3-grid">
        <div class="r3-main">
          <div class="fx-eyebrow">This exact report, current, in your inbox every month</div>
          <h3 class="r3-h">See everything today. Be told the moment anything changes.</h3>
          <p class="r3-body">When the law changes, your published pages do not. Watch closes that gap: within 72 hours of any development that touches you, you receive the exact page, the exact rule, the impact, and the exact change required. Not a newsletter. A named instruction. Your report is re-run on live data every month, so the record your committee sees is never stale, and every mention of your firm in reviews and the press is monitored on the same desk.</p>
          ${specList}
        </div>
        <div class="r3-side r3-pay">
          <div class="r3-price"><b class="cmoney" data-gbp="${cover}">${fmtMoney(cover)}</b><small>/month</small></div>
          ${payCta('Start Regulatory Watch','exposure_cover',0)}
          <div class="r3-terms">${priceSpan(cover)} a month. Watch detects and instructs; it never edits a page. Implementation is a Sprint or a mandate. Cancel anytime.</div>
        </div>
      </div>
    </div>`;
    }

    // Standard locked page: the paywall. £495 unlocks the report and includes month one of Watch.
    return `
    <div class="subhead" style="margin-top:16px"><span class="nt">↳</span><h3>Route 3 · Unlock this report, and start Regulatory Watch</h3></div>
    <p class="plan-sub r3-gold">${priceSpan(unlock)} unlocks every finding on this report and starts your first month of Regulatory Watch. From month two, ${priceSpan(cover)} a month keeps a legal team standing between your website and your regulator.</p>
    <div class="route route3">
      <div class="r3-rib">Where most boardrooms start</div>
      <div class="r3-grid">
        <div class="r3-main">
          <div class="fx-eyebrow">This exact report, current, in your inbox every month</div>
          <h3 class="r3-h">See everything today. Be told the moment anything changes.</h3>
          <p class="r3-body">When the law changes, your published pages do not. Watch closes that gap: within 72 hours of any development that touches you, you receive the exact page, the exact rule, the impact, and the exact change required. Not a newsletter. A named instruction. Your report is re-run on live data every month, so the record your committee sees is never stale, and every mention of your firm in reviews and the press is monitored on the same desk.</p>
          ${specList}
        </div>
        <div class="r3-side r3-pay">
          <div class="r3-was"><s class="cmoney" data-gbp="${rv}">${fmtMoney(rv)}</s></div>
          <div class="r3-price"><b class="cmoney" data-gbp="${unlock}">${fmtMoney(unlock)}</b><small>to unlock</small></div>
          <div class="r3-free">First month of Regulatory Watch included</div>
          ${payCta('Unlock the full report','compliance',1)}
          <div class="r3-terms">${priceSpan(unlock)} unlocks the full report and includes your first month of Watch. Then ${priceSpan(cover)} a month. Watch detects and instructs; it never edits a page. Implementation is a Sprint or a mandate. Cancel anytime. The ${priceSpan(unlock)} is credited in full against any Sprint or mandate within ${creditDays} days. The struck ${priceSpan(rv)} is the report's published standalone price, not an invented anchor.</div>
        </div>
      </div>
    </div>`;
  }

  function planAndPricing(){
    const TIERS=planData();
    const recT=TIERS.find(t=>t.rec)||TIERS[2];
    const recTier=recT.name;
    const crit=D.counts.critical;
    const score=+D.score||0;
    const wk12=(D.projected&&D.projected.wk12)||(D.trajectory&&D.trajectory[1]&&D.trajectory[1].v)||score;
    const wk24=(D.projected&&D.projected.wk24)||(D.trajectory&&D.trajectory[2]&&D.trajectory[2].v)||score;
    const topFix=((D.fixes||[])[0]||{}).title||'your highest-severity finding';

    const SPRINTS=sprintTiers();
    const crit2=D.counts.critical;
    const isLegal=/law|legal|solicit|barrist|attorney|chambers/.test(_sectorStr);
    // Sector conditioning: the Instagram card is suppressed on legal-sector reports (Online Personal
    // Branding is the correct instrument for a law firm).
    const ADDONS_SHOWN=ADDONS.filter(a=>!(isLegal && a.key==='instagramPresence'));

    return `
    <div class="plan2">
    <div class="pane-head"><span class="eyebrow">Three ways forward</span>
      <h2>${crit>0?`${crit} Critical ${plur(crit,'finding')} on your live site today. Three ways to close them, and the trajectory once you do.`:`Three ways to close your highest-severity gaps, and the trajectory once you do.`}</h2>
      <p>${escH(D.pricingNotes)}</p></div>

    ${planTrajectory(score,wk12,wk24,TIERS,recT.key)}

    <div class="cur-bar" role="tablist" aria-label="Display currency"><span class="cur-lbl">Prices in</span>${['GBP','USD','EUR','AED'].map(c=>{const s=CURRS[c].sym.trim();const lab=(s&&s!==c)?s+' '+c:c;return `<button class="cur-btn${_curState.code===c?' active':''}" data-cur="${c}" type="button" role="tab" aria-selected="${_curState.code===c?'true':'false'}">${lab}</button>`;}).join('')}<span class="cur-note">quoted &amp; invoiced in GBP</span></div>

    <div class="subhead" style="margin-top:12px"><span class="nt">↳</span><h3>Route 1 · One-time Fix Sprint</h3></div>
    <p class="plan-sub r1-lane">${escH(PRICES.fixPacksLane)}</p>
    <div class="route route1">
      <div class="fixbox r1-fixbox">
        <div class="fx-rib">One-time · no retainer</div>
        <div class="r1-toggle r1-toggle-dark" role="tablist" aria-label="Choose a Fix Sprint">${SPRINTS.map((sp,i)=>`<button class="r1-tab${i===SPRINT_DEFAULT?' active':''}" data-sprint="${i}" data-fixtier="${sp.k}" type="button" role="tab" aria-selected="${i===SPRINT_DEFAULT?'true':'false'}"><span class="r1t-l">${escH(sp.label)}${sp.badge?` <em class="r1t-badge">${escH(sp.badge)}</em>`:''}</span><small class="cmoney" data-gbp="${sp.price}">${fmtMoney(sp.price)}</small></button>`).join('')}</div>
        <div class="fx-main">${sprintCardHtml(SPRINT_DEFAULT)}</div>
        <div class="fx-foot capt">Delivery timeline is contractual. The Sprint clears today's backlog; it does not watch tomorrow. That is Regulatory Watch, below.</div>
      </div>
    </div>

    <div class="subhead" style="margin-top:16px"><span class="nt">↳</span><h3>Route 2 · A mandate</h3></div>
    <p class="plan-sub">Mandates implement and grow: the Sprint's fixes, sustained, plus rankings, AI visibility and compliance-reviewed content, every month. Regulatory Watch is included from Authority upward. Prices below are the mandate rates; no introductory discount applies to a recurring mandate.</p>
    <div class="route tiers3 tiers-lux">${TIERS.map(t=>`
      <div class="tier3 tl ${t.rec?'rec':''} ${t.popular?'pop':''}" data-tier-card="${t.key}">
        ${t.popular?'<div class="tl-rib">Most popular</div>':(t.rec?'<div class="tl-rib tl-rib-rec">Recommended</div>':'')}
        <div class="tl-head"><div class="tl-nm">${t.name}</div><div class="tl-who">${escH(t.wk)}</div></div>
        <div class="tl-priceline"><span class="tl-from">From</span><b class="cmoney" data-gbp="${t.from}">${fmtMoney(t.from)}</b><span class="tl-per">/month</span></div>
        <details class="tl-who-acc"><summary class="tl-who-sum">Who it is for <span class="tl-who-x" aria-hidden="true">+</span></summary><p class="tl-blurb tl-who-p">${escH(t.blurb)}</p></details>
        <ul class="tl-feats">${t.feats.map((f,i)=>{const tip=(TIER_TIPS[t.key]||[])[i]; return `<li><span class="tl-feat-t">${escH(f)}</span>${tip?`<span class="r3-spec-q tl-q" data-tip="${escH(tip)}" tabindex="0" role="note" aria-label="${escH(f)}: ${escH(tip)}">?</span>`:''}</li>`;}).join('')}</ul>
        <div class="t3-more tl-more" hidden><ul>${t.more.map((f,i)=>{const tip=(MORE_TIPS[t.key]||[])[i]; return `<li><span class="tl-feat-t">${escH(f)}</span>${tip?`<span class="r3-spec-q tl-q" data-tip="${escH(tip)}" tabindex="0" role="note" aria-label="${escH(f)}: ${escH(tip)}">?</span>`:''}</li>`;}).join('')}</ul></div>
        <div class="tl-foot"><button class="t3-toggle tl-toggle" type="button">See all inclusions</button><a class="btn block tl-cta" href="${escH(bookUrl('package'))}" data-book="package" data-tier="${escH(t.name)}">Begin ${/^[aeiou]/i.test(t.name)?'an':'a'} ${t.name} enquiry ↗</a></div>
      </div>`).join('')}</div>
    <p class="plan-sub tl-note">Every engagement opens with the Exposure Report you are reading; the ${priceSpan(PRICES.exposureReport.unlock)} unlock is credited in full against any Sprint or mandate within ${PRICES.exposureReport.creditDays} days. Mandates run on 90-day rolling terms; electing a six-month term unlocks the pilot rate shown. Quoted and invoiced in GBP.</p>

    ${route3()}

    <div class="subhead" style="margin-top:16px"><span class="nt">↳</span><h3>Independent Solutions, each one a programme in its own right</h3></div>
    <p class="plan-sub">Take any of these on its own, or layer it onto a Sprint or a mandate. Each carries the same first-engagement rate: the standard fee is struck, and this report unlocks the introductory price. Founding mandate rate held for the first three clients per sector per jurisdiction.</p>
    <div class="addon-railwrap">
      <button type="button" class="addon-nav addon-prev" aria-label="Previous solutions">&lsaquo;</button>
      <div class="addon-grid" role="list">
      ${ADDONS_SHOWN.map(a=>{
        const off=(a.offer!=null)?a.offer:a.price;          // the price actually charged
        const priceHtml=(a.anchor!=null)
          ? `<span class="apwas cmoney" data-gbp="${a.anchor}">${fmtMoney(a.anchor)}</span><b class="cmoney" data-gbp="${off}">${fmtMoney(off)}</b><small>/${a.unit}</small>`
          : `<b class="cmoney" data-gbp="${off}">${fmtMoney(off)}</b><small>/${a.unit}</small>`;
        // E16/E39: the CTA always has a destination. A pasted Payment Link takes the payment; an empty one
        // routes to the intake modal, which is never hidden.
        const su=addonStripe(a.key);
        const cta=su
          ? `<a class="btn gold addon-cta" href="${escH(su)}" target="_blank" rel="noopener">Add ${escH(a.nm.split(' ')[0])} ↗</a>`
          : `<a class="btn gold addon-cta" href="${escH(bookUrl('scoping'))}" data-addon="${escH(a.nm)}" data-price="${off}">Add ${escH(a.nm.split(' ')[0])} ↗</a>`;
        return `<div class="addon ${a.hero?'ag-hero':''}" role="listitem" tabindex="0">
        <div class="is-top">
          <div class="an">${escH(a.nm)}</div>
          <div class="ap">${priceHtml}</div>
          ${a.typical?`<div class="atyp capt">From ${fmtMoney(off)}; typical engagement ${fmtMoney(a.typical)}.</div>`:''}
          <div class="ascope">${escH(a.scope)}</div>
        </div>
        <div class="is-detail">
          <div class="tag">${escH(a.usp)}</div>
          <div class="afirst capt">First-engagement rate: the standard fee is ${fmtMoney(a.anchor)}; this report unlocks ${fmtMoney(off)}.</div>
          <div class="aspec-h">How it runs, step by step</div>
          <ol class="aspec-steps">${a.spec.map(x=>`<li>${escH(x)}</li>`).join('')}</ol>
          <div class="aexcl capt">${escH(a.excl||'')}</div>
          ${cta}
        </div>
      </div>`;}).join('')}
      </div>
      <button type="button" class="addon-nav addon-next" aria-label="More solutions">&rsaquo;</button>
    </div>
    <p class="plan-sub addon-disclosure">Figures shown for client engagements are drawn from verified analytics and are identified as such. Any figure labelled illustrative is a worked example, not a client result. Each solution commits to defined deliverables and to reach; commercial outcomes depend on factors outside any agency's control and are not guaranteed. Full terms: /legal/service-terms.</p>

    <div class="subhead founder-subhead" style="margin-top:13px"><span class="nt">↳</span><h3>Walk the report through in 20 minutes</h3></div>
    <div class="founder-cred">Every report is reviewed by the legal team, led by Aman Pareek, LLM in International Business Law, King&rsquo;s College London, before it reaches you.</div>
    <p class="plan-sub">Three ways to start. No sales team, no discovery loop; your route and strongest finding are carried into the first conversation.</p>
    <div class="booking">
      <div class="bookcard"><div class="rt">Mandate enquiries</div><h3>Discuss a mandate</h3>
        <p>A 30 minute confidential session on the Foundation, Authority or Enterprise mandate, and which one fits ${escH(D.meta.company)}.</p>
        <div class="cal-embed" data-cal-embed data-intent="package" data-tier="${recTier}" aria-label="Mandate strategy call calendar"></div>
        <p class="bookcard-note">Pick a time above, or <a href="${escH(bookUrl('package'))}" target="_blank" rel="noopener">open the calendar directly</a>. Your route and strongest finding are carried into the call.</p></div>
      <div class="bookcard"><div class="rt">One-time sprint</div><h3>Start a Fix Sprint</h3>
        <p>A 30 minute confidential session to scope a one-time, fixed-scope Fix Sprint. The urgent items closed first, no retainer.</p>
        <div class="cal-embed" data-cal-embed data-intent="one_time_fix" aria-label="Fix Sprint call calendar"></div>
        <p class="bookcard-note">Pick a time above, or <a href="${escH(bookUrl('sprint'))}" target="_blank" rel="noopener">open the calendar directly</a>. A written confirmation follows by email.</p></div>
    </div>

    <div class="subhead" style="margin-top:14px"><span class="nt">↳</span><h3>Prefer a written reply? Leave your details</h3></div>
    <p class="plan-sub">Send the basics and Tamazia replies within one business day. No obligation, no sales sequence.</p>
    <form class="audit-bookform" novalidate aria-label="Contact Tamazia">
      <input type="text" name="c_website_2" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
      <div class="abf-grid">
        <label class="abf-field"><span>Your name</span><input name="name" autocomplete="name" value="${escH((D.meta&&D.meta.company)||'')}"></label>
        <label class="abf-field"><span>Website</span><input name="audit-input" autocomplete="url" value="${escH((D.meta&&D.meta.domain)||'')}"></label>
        <label class="abf-field"><span>Email *</span><input name="email" type="email" required autocomplete="email" placeholder="you@firm.com"></label>
        <label class="abf-field"><span>Sector</span><input name="sector" value="${escH((D.meta&&D.meta.sector)||'')}"></label>
      </div>
      <div class="abf-err" role="alert" hidden></div>
      <div class="abf-actions"><button type="submit" class="btn solid abf-submit">Send to Tamazia ↗</button></div>
      <p class="abf-fine">Your details are recorded with Tamazia and acknowledged by email. No payment is taken here.</p>
    </form>

    <div class="card pad" style="margin-top:10px;background:var(--cream-2);border:0">
      <div class="capt" style="font-size:11px;line-height:1.6;margin:0">This is an automated marketing diagnostic from publicly observable signals (or the most recent web-archive snapshot where the live site was unreachable). The monetary figures are <b>statutory maximum fines</b>: worst-case ceilings to indicate exposure, not predictions. Not legal advice. Framework catalogue ${D.meta.catalogue}. Produced by Tamazia Ltd, London. Marketing diagnostic only.</div>
    </div>
    </div>`;
  }

  /* ---------------- VERDICT (always-visible, compact) ---------------- */
  function verdict(){
    const f=D.fixes||[];
    const company=(D.meta&&D.meta.company)||'your firm';
    const crit=(D.counts&&D.counts.critical)||0;
    const top=f[0]||{};
    const sov=D.geo&&D.geo.shareOfVoice;
    const rivals=Math.max(0,((D.competitors&&D.competitors.rows)||[]).length-1);
    const hasMoney=!!(D._meta&&D._meta.exposureN>0);
    // Crisp, personalised summary bullets built render-side from existing D fields (no engine change):
    // what the report is, the single biggest finding, where they stand on law/AI/competitors, how to read it,
    // and why to keep it current. (founder: replace the dense exec paragraph with crisp bullet points.)
    const bullets=[];
    bullets.push(`<b>What this is.</b> A live audit of ${escH(company)} across regulation, search and AI visibility. Every finding below was measured on your own site, never estimated.`);
    if(crit>0) bullets.push(`<b>The headline.</b> ${crit} critical ${plur(crit,'breach','breaches')} ${plur(crit,'is','are')} live on your site right now${hasMoney?(', carrying a median enforcement exposure of '+D.exposure):''}. Start with ${escH(String(top.title||'your highest-severity finding').toLowerCase())}.`);
    else if (D.compliance_unassessed) bullets.push(D.render_mode==='knowledge' && (D.frameworksBinding||0)>0 ? `<b>The headline.</b> ${D.frameworksBinding} statutory frameworks bind your firm on registration facts alone, mapped below with regulator and obligation. No breach is claimed because your live pages resisted a deep read this scan; the map is the floor, the re-scan finds what sits on top of it.` : `<b>The headline.</b> Your live site blocked a deep compliance read this scan, so the regulatory checks below could not be completed and no clean bill of health is implied. The ranking, authority and AI-visibility findings were still measured on your site and stand. A re-scan with a rendered-DOM read completes the compliance assessment.`);
    else bullets.push(`<b>The headline.</b> No critical statutory breach surfaced this scan. The gaps below are costing you rankings, buyers and AI visibility, not fines.`);
    bullets.push(`<b>Where you stand.</b> ${D.frameworksAssessed} framework${D.frameworksAssessed!==1?'s':''} legally bind${D.frameworksAssessed===1?'s':''} you${sov?(', AI names you in '+sov+' of the buyer queries probed'):''}${rivals>0?(', and '+rivals+' '+plur(rivals,'rival')+' '+plur(rivals,'is','are')+' ranked ahead of you'):''}.`);
    bullets.push(`<b>How to read it.</b> Open any of the six sections below. Each box opens in place, with the live evidence on the left and the exact Tamazia fix on the right.`);
    bullets.push(`<b>Keep it current.</b> Re-run this report every month so a new breach is caught the day it appears, before enforcement or a competitor moves first.`);
    return `<div class="verdict">
      <div><span class="eyebrow">The verdict</span>
        <h2>${D.score} / 100 · ${D.grade}${hasMoney?`, with a median enforcement exposure of <span class="vexp">${D.exposure}</span> across the ${D.counts.total} ${plur(D.counts.total,'breach','breaches')} evidenced on your live site.`:`, the gaps below are costing you rankings, buyers and AI visibility right now.`}</h2>
        <ul class="verdict-bullets">${bullets.map(b=>`<li>${b}</li>`).join('')}</ul>
        ${f.length?`<div class="vfix-head">Your three highest-priority breaches, fix these first</div>`:''}
        <div class="vfixes">${f.slice(0,3).map((x,i)=>`<button class="vfix" data-finding="fx-${i+1}"><span class="n">${i+1}</span><span class="t">${escH(x.title)}</span><span class="e">${x.exp}</span></button>`).join('')}</div>
      </div></div>`;
  }

  /* Founder-session yellow band removed (founder request 2026-07-20). The recommended-tier
     booking CTA remains on the rail (.rail-cta data-book="package") and in the Plan pane, so
     Drawer/Commerce wiring is unaffected. No .fsx-* / .cta-blindsend markup is emitted anywhere. */

  /* ---------------- PSI box (mobile|desktop) — rendered on the FIRST view, under the scorecard ---------------- */
  function psiBlock(){
    if(D.seo && D.seo.psiStrats){
      const av=['mobile','desktop'].filter(s=>D.seo.psiStrats[s]);
      return `<div class="subhead" style="margin:14px 0 10px"><span class="nt">↳</span><h3>Google PageSpeed, measured live on your DOM${av.length>1?', desktop and mobile':''}.</h3></div>
      ${av.length>1?`<div class="psi-toggle" role="tablist">${av.map(st=>`<button class="psi-tab${st===av[0]?' active':''}" data-strat="${st}" type="button" role="tab">${st==='mobile'?'Mobile':'Desktop'}</button>`).join('')}</div>`:''}
      ${av.map((st,i)=>{const S=D.seo.psiStrats[st];const fail=(S.cwv||[]).filter(c=>c.st==='fail').length;return `<div class="psi-strat${i===0?' active':''}" data-strat="${st}">
        <div class="grid g2">
          <div class="card pad"><div class="card-h"><div class="t">PageSpeed Insights</div><div class="meta">live &middot; ${st}</div></div>${CH.psiDialRow(S.dials)}</div>
          <div class="card pad"><div class="card-h"><div class="t">Core Web Vitals</div><div class="meta">${st} &middot; failing ${fail} of ${(S.cwv||[]).length}</div></div>${CH.cwvMeterRow(S.cwv)}</div>
        </div>
        <div class="card pad" style="margin-top:10px"><div class="card-h"><div class="t">Failing audits on your live DOM</div><div class="meta">${st} &middot; ${(S.audits||[]).length} found &middot; hover the fix</div></div>${CH.psiAuditRow(S.audits,st)}</div>
      </div>`;}).join('')}`;
    }
    // single-strategy / not-assessed fallback (never blank)
    const psi=(D.seo&&D.seo.psi)||{}; const psiAvail=psi.performance!=null;
    return `<div class="subhead" style="margin:14px 0 10px"><span class="nt">↳</span><h3>Google PageSpeed, measured live on your site.</h3></div>
      <div class="grid g2">
        <div class="card pad"><div class="card-h"><div class="t">PageSpeed Insights</div><div class="meta">live · mobile</div></div>${CH.psiDials()}</div>
        <div class="card pad"><div class="card-h"><div class="t">Core Web Vitals</div><div class="meta">${psiAvail?'real-user':'not assessed'}</div></div>${CH.cwvMeters()}</div>
      </div>`;
  }

  /* ---------------- HERO, the charts, above the collapsed boxes ---------------- */
  function heroCharts(){
    return `<section class="hero-charts">
      <div class="subhead" style="margin:2px 0 10px"><span class="nt">↳</span><h3>Every metric behind your score, visualised.</h3></div>
      <div class="card pad">${CH.dimCardGrid()}</div>
      ${psiBlock()}
      <div class="grid g2" style="margin-top:12px">
        <div class="card pad"><div class="card-h"><div class="t">${(D._meta&&D._meta.exposureN>0)?'How your '+D.exposure+' exposure is really calculated':'Exposure breakdown'}</div><div class="meta">not just a sum of ceilings</div></div>${CH.waterfall()||'<div class="capt" style="margin:0">No statutory exposure confirmed this scan, the gaps below are ranking and AI-visibility costs, not fines.</div>'}</div>
        <div class="card pad"><div class="card-h"><div class="t">Why AI can’t see ${escH(D.meta.company)}</div><div class="meta">root-cause chain</div></div>${CH.causalChain()||'<div class="capt" style="margin:0">Your identity signals are largely present, the work is to defend and deepen them.</div>'}</div>
      </div>
    </section>`;
  }

  /* ---------------- MOUNT, command deck: 6 collapsed pillars ---------------- */
  const app = document.getElementById('app');
  const SECT=[['overview','Overview'],['seo','SEO &amp; Technical'],['geo','AI &amp; GEO'],['regulatory','Regulatory'],['competitors','Competitors'],['plan','Plan &amp; Pricing']];
  const chip=(t,c)=>`<span class="pkpi ${c||''}">${t}</span>`;
  const maxDr=Math.max(0,...(D.competitors.ladder||[]).map(c=>c.dr||0));
  // DR chip: only show "vs N" when rival DR is actually known (adapter sets drHidden when <2 rivals have a DR);
  // never render "DR X vs 0" or "DR — vs 0".
  const drChip=(()=>{const y=((D.competitors.rows||[])[0]||{}).dr; if(y==null||y==='—'||y===''||y===', ')return ''; return D.competitors.drHidden?chip('DR '+y):chip('DR '+y+' vs '+maxDr,'red');})();
  const SUMM={
    overview:{ico:'◆',nm:'Diagnostics &amp; scorecard',kpis:chip(D.score+'/100')+chip(D.grade,'red')+chip(((D.dims||[]).filter(d=>d.st==='fail').length)+' '+plur((D.dims||[]).filter(d=>d.st==='fail').length,'dim')+' failing')},
    regulatory:{ico:'§',nm:'Regulatory exposure',kpis:chip(D.counts.critical+' critical','red')+(D.exposureFull>0?chip(D.exposure,'red'):'')+chip(D.frameworksAssessed+' frameworks bind')},
    seo:{ico:'⌕',nm:'SEO &amp; technical',kpis:chip('Perf '+D.seo.psi.performance)+chip(D.seo.onpage.length+' '+plur(D.seo.onpage.length,'issue'),'amber')+chip(D.seo.keywordSummary.onPageOne+'/'+D.seo.keywordSummary.totalTracked+' page-one')},
    geo:{ico:'❖',nm:'AI &amp; GEO visibility',kpis:chip('SoV '+D.geo.shareOfVoice,'red')+chip(D.geo.aiKnows?'AI cites you':'AI can’t cite you','red')+chip('Entity '+D.geo.entityReadiness)},
    competitors:{ico:'⤧',nm:'Competitors',kpis:chip(Math.max(0,(D.competitors.rows||[]).length-1)+' '+plur(Math.max(0,(D.competitors.rows||[]).length-1),'rival')+' ahead')+drChip},
    plan:{ico:'✦',nm:'Plan &amp; pricing',kpis:chip('From '+fmtMoney(PRICING_TIERS_RENDER[0].from)+'/mo')+chip(D.counts.critical+' to fix')},
  };
  app.innerHTML = rail() + `<main class="content">
    ${verdict()}
    ${heroCharts()}
    ${SECT.map(([k])=>`<details class="pillar" id="sec-${k}" data-section="${k}"><summary><span class="pico">${SUMM[k].ico}</span><span class="pname">${SUMM[k].nm}</span><span class="pkpis">${SUMM[k].kpis}</span><span class="pchev">▸</span></summary><div class="pbody">${P[k]()}</div></details>`).join('')}
  </main>`;

  /* ---------------- NAV, one pillar open at a time ---------------- */
  function setActive(id){ document.querySelectorAll('.railnav button').forEach(b=>b.classList.toggle('active', b.dataset.pane===id)); }
  // When navigating from a verdict/breach chip we open the overview pillar AND a specific finding;
  // suppress the pillar-level scrolls so only the finding scroll wins (the async pillar 'toggle'
  // otherwise fires last and overrides it — the #6/#7/#8 jump-to-bottom bug).
  let _chipNav=false, _navOpening=false;
  function openPillar(id){
    _navOpening=true;   // tells the toggle handler this open is a NAV (openPillar owns the scroll), not a direct click
    document.querySelectorAll('.pillar').forEach(d=>{ d.open=(d.id==='sec-'+id); });
    setActive(id);
    const el=document.getElementById('sec-'+id); if(el && !_chipNav) scrollHeadingTop(el);
    requestAnimationFrame(function(){ _navOpening=false; });
  }
  document.querySelectorAll('.railnav button').forEach(b=>b.addEventListener('click',e=>{e.preventDefault(); openPillar(b.dataset.pane);}));
  // Phase 10: a separate "Jump to pricing" control OUTSIDE .railnav (so the harness count stays 6).
  // E3: open the in-page pricing DRAWER (no navigation); fall back to opening the pane if the drawer is absent.
  document.querySelector('.rail-jump')?.addEventListener('click',e=>{e.preventDefault(); if(Drawer&&Drawer.open){ Drawer.open(); } else { openPillar('plan'); }});
  // Direct click on a pillar heading opens it IN PLACE: close the others (accordion) and ANCHOR the clicked
  // heading at its current viewport position by compensating the sibling-collapse shift — no jump-to-top.
  // (founder: "any box clicked just cuts the screen from top — fix this".) NAV opens (openPillar) own their scroll.
  document.querySelectorAll('.pillar').forEach(d=>d.addEventListener('toggle',()=>{
    if(!d.open) return;
    const sum=d.querySelector('summary'); const before=sum?sum.getBoundingClientRect().top:0;
    document.querySelectorAll('.pillar').forEach(o=>{ if(o!==d) o.open=false; });
    setActive(d.dataset.section);
    if(!_chipNav && !_navOpening){ requestAnimationFrame(function(){ const after=sum?sum.getBoundingClientRect().top:0; const dl=after-before; if(Math.abs(dl)>1){ try{ window.scrollBy(0,dl); }catch(_e){} } }); }
  }));
  app.addEventListener('click',e=>{ const v=e.target.closest('[data-open]'); if(v){ e.preventDefault(); openPillar(v.dataset.open); } });
  // Scorecard dimcards ("Every metric we judged you on") jump to their pillar.
  app.addEventListener('click',e=>{ const dc=e.target.closest('.dimcard[data-pane]'); if(dc){ e.preventDefault(); openPillar(dc.dataset.pane); } });
  app.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ const dc=e.target.closest('.dimcard[data-pane]'); if(dc){ e.preventDefault(); openPillar(dc.dataset.pane); } } });
  // PSI desktop|mobile toggle: switch the active strategy card-set within the SEO pane.
  app.addEventListener('click',function(e){ const t=e.target.closest('.psi-tab'); if(!t) return; e.preventDefault();
    const strat=t.dataset.strat, scope=t.closest('.pbody')||document;
    scope.querySelectorAll('.psi-tab').forEach(b=>b.classList.toggle('active', b===t));
    scope.querySelectorAll('.psi-strat').forEach(s=>s.classList.toggle('active', s.dataset.strat===strat));
  });

  /* ---------------- OPEN-FROM-HEADING for every box (robust) ---------------- */
  // Pin a box's heading (its <summary>) just under the top of the viewport when it opens.
  // INSTANT, not smooth: the page sets html{scroll-behavior:smooth}, so two programmatic scrolls
  // fired close together (e.g. openPillar then open-the-finding) ANIMATE and race — the later one
  // lands mid-flight and you overshoot to the BOTTOM of the box. We force instant + a monotonic
  // token so only the LATEST requested target keeps re-pinning; stale pins cancel themselves. We
  // re-pin across two frames + a short delay so an open-reflow or a sibling-close that shifts the
  // target can never leave the heading off-screen.
  function scrollHeadingTop(el){
    if(!el) return;
    // GENTLE: only scroll when the heading is actually out of comfortable view (above the fold, or sitting
    // more than ~40% down the viewport). If it is already near the top, DO NOT move the page — this is what
    // stops the jarring "cut to top" on clicks where the box is already visible. (founder)
    requestAnimationFrame(function(){
      try{
        const r=el.getBoundingClientRect();
        if(r.top>=-2 && r.top<=Math.max(140, innerHeight*0.4)) return;   // already in view → leave the page put
        el.scrollIntoView({ behavior:'smooth', block:'start' });
      }catch(_e){ try{ const y=Math.max(0, el.getBoundingClientRect().top+window.scrollY-18); window.scrollTo(0,y); }catch(_e2){} }
    });
  }
  // One delegated toggle-capture handler (toggle does NOT bubble ↗ capture). When a .fw/.finding
  // opens, single-open its siblings within the same pane and pin its heading to the top, so at
  // most one inner box is open and it always fits one viewport. Closing a sibling fires toggle
  // with open=false, guarded by the early return.
  document.addEventListener('toggle',function(e){
    const d=e.target;
    if(!(d instanceof HTMLDetailsElement) || !d.open) return;
    if(d.classList.contains('pillar')) return;            // pillars handled by openPillar()
    if(d.matches('.fw, .finding')){
      const scope=d.closest('.pbody')||document;
      const sel=d.matches('.fw')?'.fw[open]':'.finding[open]';
      scope.querySelectorAll(sel).forEach(function(o){ if(o!==d) o.open=false; });
      // founder: an inner box opens IN PLACE — never scroll it to the top of the screen. Only the six
      // main section pillars (handled by openPillar) pin to the top. So no scrollHeadingTop here.
    }
  },true);

  /* ---------------- Phase 3: clickable summaries open the ONE overview detail ---------------- */
  // Verdict chips + regulatory "breaches in full" summaries carry data-finding="fx-N". Clicking
  // opens the overview pillar, then (after the pillar's single-open settles) opens that finding
  // and pins its heading to the top. The detail exists exactly once (in overview).
  app.addEventListener('click',function(e){
    const b=e.target.closest('[data-finding]'); if(!b) return; e.preventDefault();
    const id=b.dataset.finding;
    // Open the Overview pillar (one of the six main boxes, so it DOES pin to the top), then open the
    // target finding in place. We do NOT scroll to the finding itself (founder: inner boxes open in place).
    openPillar('overview');
    requestAnimationFrame(function(){ const d=document.getElementById(id); if(d) d.open=true; });
  });

  /* ---------------- FREEMIUM LOCK: any locked Tamazia-fix opens Route 3 (unlock the report) ---------------- */
  // The green-gradient lock veil sits over each Tamazia-fix element (never the beat-cards). Clicking any of
  // them opens the Plan pillar and pins Route 3, where a successful payment unlocks the whole link for everyone.
  // E3: the lock veil opens the pricing DRAWER at Route 3 (no navigation). Falls back to the in-page pane.
  // Drawer is declared later in this IIFE but is always initialised by the time a click fires this.
  function goUnlock(){ if(Drawer && Drawer.open){ Drawer.open('.route3'); return; } openPillar('plan'); requestAnimationFrame(function(){ const r3=document.querySelector('#sec-plan .route3'); if(r3) scrollHeadingTop(r3); }); }
  app.addEventListener('click',function(e){ const v=e.target.closest('.tz-lock-veil'); if(!v) return; e.preventDefault(); goUnlock(); });
  app.addEventListener('keydown',function(e){ if(e.key!=='Enter'&&e.key!==' ')return; const v=e.target.closest('.tz-lock-veil'); if(!v)return; e.preventDefault(); goUnlock(); });

  /* ---------------- Phase 4: "Top N exposures" bars jump to their framework box ---------------- */
  // The bars sit inside the (already-open) regulatory pane; clicking one opens the matching
  // <details class="fw" data-code> and pins its heading to the top.
  app.addEventListener('click',function(e){
    const b=e.target.closest('[data-fwjump]'); if(!b) return; e.preventDefault();
    const t=document.querySelector('.fw[data-code="'+(b.dataset.fwjump||'').replace(/"/g,'')+'"]');
    if(t){ t.open=true; }   // open the framework box in place (founder: no scroll-to-top for inner boxes)
  });
  /* ---------- Gate 1: jurisdiction selector live-filters the regulatory layer ---------- */
  app.addEventListener('click',e=>{ const c=e.target.closest('.jur-chip'); if(!c)return; e.preventDefault();
    const sel=c.dataset.jurf, box=c.closest('#sec-regulatory')||document;
    box.querySelectorAll('.jur-chip').forEach(x=>x.classList.toggle('active', x===c));
    box.querySelectorAll('.fw[data-jur]').forEach(d=>{ const show=(sel==='all'||d.dataset.jur===sel); d.style.display=show?'':'none'; if(!show)d.open=false; });
  });

  /* ---------------- CUSTOM TOOLTIP ---------------- */
  const tip=document.createElement('div'); tip.className='tz-tip'; document.body.appendChild(tip);
  app.addEventListener('mouseover',e=>{ const t=e.target.closest('[data-tip]'); if(!t)return;
    /* SEC-01 (CodeQL js/xss-through-dom, HIGH): this was `tip.innerHTML = t.getAttribute('data-tip')`.
       data-tip is populated from the audit payload, and the audit payload is built from content CRAWLED OFF THE
       AUDITED FIRM'S OWN WEBSITE (evidence quotes, framework names, glossary terms). A crafted page could therefore
       inject markup that we would render as HTML on the report we hand to a client: stored XSS, delivered by us, on
       our own compliance report. Tooltips are plain prose; textContent renders them identically and cannot execute. */
    tip.textContent = t.getAttribute('data-tip') || ''; tip.classList.add('show'); });
  app.addEventListener('mousemove',e=>{ if(!tip.classList.contains('show'))return; const pad=14,w=tip.offsetWidth,h=tip.offsetHeight; let x=e.clientX+pad,y=e.clientY+pad; if(x+w>innerWidth-8)x=e.clientX-w-pad; if(y+h>innerHeight-8)y=e.clientY-h-pad; tip.style.left=x+'px'; tip.style.top=y+'px'; });
  app.addEventListener('mouseout',e=>{ if(e.target.closest('[data-tip]')) tip.classList.remove('show'); });
  // expand toggles (pricing + addons) + tier tabs + real commerce wiring (intake modal + Cal + Stripe)
  app.addEventListener('click',e=>{
    const tt=e.target.closest('[data-tier-tab]');
    if(tt){ selectTier(+tt.dataset.tierTab,true); return; }
    const mt=e.target.closest('.moretoggle');
    if(mt){ const card=mt.closest('.price, .addon'); const open=card.classList.toggle('open');
      if(mt.dataset.more==='price') mt.textContent= open?'Hide details':'See everything included';
      else mt.textContent= open?'Hide spec':'Full spec'; return; }
    const an=e.target.closest('.addon-nav');
    if(an){ const rail=an.parentElement.querySelector('.addon-grid'); if(rail){ const dir=an.classList.contains('addon-prev')?-1:1; rail.scrollBy({left:dir*Math.min(280,Math.round(rail.clientWidth*0.8)),behavior:'smooth'}); } return; }
    const bk=e.target.closest('[data-book]');
    if(bk){ e.preventDefault(); Commerce.openIntake(bk.dataset.book, bk.dataset.tier||bk.dataset.fixtier||null); return; }
    const ad=e.target.closest('[data-addon]');
    if(ad){ e.preventDefault(); Commerce.startAddon(ad.dataset.addon, ad.dataset.price||'', ad); return; }
    // Route 1 — Fix Sprint tabs (Sprint I / II / III). The whole card body is re-rendered from the ONE
    // renderer (sprintCardHtml), so price, strike, first-engagement line, credit arithmetic, delivery window
    // and the buy CTA can never desync. E39: the CTA is never hidden; when no Payment Link is set it falls
    // back to the intake modal with a real booking href.
    const r1=e.target.closest('.r1-tab');
    if(r1){ document.querySelectorAll('.r1-tab').forEach(b=>{const on=b===r1;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});
      const main=document.querySelector('.r1-fixbox .fx-main');
      if(main) main.innerHTML=sprintCardHtml(+r1.dataset.sprint||0);
      return; }
    // Currency toggle (Route prices) — re-format every .cmoney from its GBP base into the chosen currency.
    const cb=e.target.closest('.cur-btn');
    if(cb){ const code=cb.dataset.cur; if(CURRS[code]){ _curState=CURRS[code];
        document.querySelectorAll('.cur-btn').forEach(b=>{const on=b===cb;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});
        document.querySelectorAll('.cmoney').forEach(el=>{ el.textContent=fmtMoney(+el.dataset.gbp||0); }); } return; }
    // Route 2 — tier card "See all inclusions" reveal.
    const t3=e.target.closest('.t3-toggle');
    if(t3){ const card=t3.closest('.tier3'); const more=card.querySelector('.t3-more'); const open=more.hidden; more.hidden=!open; t3.textContent=open?'Show less':'See all inclusions'; card.classList.toggle('lx-open',open); return; }
    // Route 3 — recurring Exposure Report cover. The 'compliance' value keeps its EXACT legacy contract
    // (startAddon('Compliance Monitoring', …, {trial}) → /api/stripe/checkout → webhook flips audit_pages.unlocked).
    // 'exposure_cover' (the cold-page ongoing-cover CTA) routes to the same checkout/intake fallback. Do NOT
    // change the 'compliance' branch — the freemium unlock depends on it.
    const sub=e.target.closest('[data-subscribe]');
    if(sub){ e.preventDefault();
      const kind=sub.dataset.subscribe;
      if(kind==='exposure_cover'){ Commerce.startAddon('Compliance Monitoring', gbpFmt(PRICES.exposureReport.monthlyCover), sub, { trial:0 }); }
      else { Commerce.startAddon('Compliance Monitoring', gbpFmt(PRICES.exposureReport.unlock), sub, { trial:+sub.dataset.trial||0 }); }
      return; }
  });

  /* ---------------- PLAN: tier tabs + interactive trajectory morph ---------------- */
  // Switch the visible tier panel; a higher mandate scales the projected ceiling so the
  // curve visibly lifts. Real today/wk12/wk24 numbers come from the .plan-traj data-attrs.
  function selectTier(i,user){
    document.querySelectorAll('[data-tier-tab]').forEach(b=>b.classList.toggle('active',+b.dataset.tierTab===i));
    document.querySelectorAll('[data-tier-panel]').forEach(p=>p.classList.toggle('on',+p.dataset.tierPanel===i));
    morphTrajectory(i);
  }
  function morphTrajectory(tierIdx){
    const t=document.querySelector('[data-traj]'); if(!t)return;
    const s=+t.dataset.score, w12=+t.dataset.w12, w24=+t.dataset.w24;
    // Foundation reaches the base projection; Authority and Enterprise lift the ceiling toward 100.
    const lift=[0,0.45,0.85][tierIdx]||0;
    const p12=Math.round(w12+(100-w12)*lift*0.5), p24=Math.round(w24+(100-w24)*lift);
    const W=900,H=176,padL=40,padR=18,padT=14,padB=30,iW=W-padL-padR,iH=H-padT-padB;
    const cl=v=>Math.max(0,Math.min(100,v)); const X=k=>padL+iW*(k/2); const Y=v=>padT+iH*(1-cl(v)/100);
    const proj=[s,cl(p12),cl(p24)];
    const line=proj.map((v,k)=>`${k?'L':'M'}${X(k).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
    const area=`${line} L${X(2).toFixed(1)} ${(padT+iH).toFixed(1)} L${X(0).toFixed(1)} ${(padT+iH).toFixed(1)} Z`;
    const svg=t.querySelector('.ptj-svg'); if(!svg)return;
    svg.querySelector('.ptj-proj').setAttribute('d',line);
    svg.querySelector('.ptj-projarea').setAttribute('d',area);
    const dots=svg.querySelectorAll('.ptj-d');
    proj.forEach((v,k)=>{ if(dots[k]){ dots[k].setAttribute('cx',X(k).toFixed(1)); dots[k].setAttribute('cy',Y(v).toFixed(1)); } });
    const pts=t.querySelectorAll('.traj-pt b'); if(pts[1])pts[1].textContent=proj[1]; if(pts[2])pts[2].textContent=proj[2];
  }
  // hovering a tier tab previews its lift; leaving restores the active tier
  app.addEventListener('mouseover',e=>{ const tt=e.target.closest('[data-tier-tab]'); if(tt) morphTrajectory(+tt.dataset.tierTab); });
  app.addEventListener('mouseout',e=>{ const tt=e.target.closest('[data-tier-tab]'); if(tt){ const a=document.querySelector('[data-tier-tab].active'); morphTrajectory(a?+a.dataset.tierTab:0); } });

  /* ---------------- PRICING DRAWER (E3): in-page slide-over, no navigation ---------------- */
  // A right-side slide-over that shows the FULL Plan & Pricing pane WITHOUT navigating or opening a new tab.
  // It renders from the SAME source as the in-page pane: rather than re-rendering (which would duplicate the
  // #sec-plan id, the .route3 node and double-mount the Cal iframes), it RELOCATES the live #sec-plan node into
  // the drawer panel and back. The panel lives INSIDE #app so every app-delegated handler (tier tabs, currency,
  // add-ons, data-book, data-subscribe, the .route3 unlock) keeps firing unchanged. Closing restores the exact
  // scroll position. The freemium-lock veil and the finding fix-links open the drawer; #sec-plan/.route3 always
  // resolve because the node is preserved, not cloned.
  const Drawer=(function(){
    const plan=document.getElementById('sec-plan');
    if(!plan) return { open(){}, close(){}, isOpen(){return false;} };
    // placeholder marks the plan pane's original home so we can put it back in the exact same spot.
    const home=document.createComment('plan-home'); plan.parentNode.insertBefore(home, plan);
    const ov=document.createElement('div'); ov.className='pdrawer-ov'; ov.setAttribute('aria-hidden','true');
    const panel=document.createElement('aside'); panel.className='pdrawer'; panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','true'); panel.setAttribute('aria-label','Plans and pricing'); panel.setAttribute('aria-hidden','true');
    panel.innerHTML='<div class="pdrawer-bar"><span class="pdrawer-t">Plans &amp; pricing</span><button class="pdrawer-x" aria-label="Close plans">×</button></div><div class="pdrawer-body"></div>';
    // both overlay + panel sit INSIDE #app so the app-level delegated click/keydown handlers still receive events.
    app.appendChild(ov); app.appendChild(panel);
    const body=panel.querySelector('.pdrawer-body');
    let open=false, savedY=0, lastFocus=null;
    function isOpen(){ return open; }
    function doOpen(target){
      if(open){ if(target) scrollTo(target); return; }
      open=true; savedY=window.scrollY||window.pageYOffset||0; lastFocus=document.activeElement;
      plan.open=true;                              // ensure the pane body (and Cal mounts) exist
      body.appendChild(plan);                      // RELOCATE the live node (no clone, no re-render)
      ov.classList.add('show'); panel.classList.add('show');
      ov.setAttribute('aria-hidden','false'); panel.setAttribute('aria-hidden','false');
      document.body.classList.add('pdrawer-lock');
      mountPlanCalendars();                        // mount the two inline Cal widgets (guarded by dataset.mounted)
      try{ panel.querySelector('.pdrawer-x').focus(); }catch(_e){}
      if(target) requestAnimationFrame(()=>scrollTo(target));
    }
    function scrollTo(sel){ try{ const el=body.querySelector(sel); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); }catch(_e){} }
    function doClose(){
      if(!open) return; open=false;
      ov.classList.remove('show'); panel.classList.remove('show');
      ov.setAttribute('aria-hidden','true'); panel.setAttribute('aria-hidden','true');
      document.body.classList.remove('pdrawer-lock');
      home.parentNode.insertBefore(plan, home);    // put the pane back in its exact original spot
      try{ window.scrollTo(0, savedY); }catch(_e){} // restore exact scroll position
      try{ if(lastFocus&&lastFocus.focus) lastFocus.focus(); }catch(_e){}
    }
    ov.addEventListener('click',doClose);
    panel.querySelector('.pdrawer-x').addEventListener('click',doClose);
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&open) doClose(); });
    // sticky "Plans" pill (bottom-left; distinct from the bottom-right FAB + Notes toggle).
    const pill=document.createElement('button'); pill.className='plans-pill'; pill.type='button';
    pill.innerHTML='<span class="pp-ic">✦</span>Plans'; pill.setAttribute('aria-label','Open plans and pricing');
    pill.addEventListener('click',()=>doOpen()); document.body.appendChild(pill);
    return { open:doOpen, close:doClose, isOpen };
  })();

  /* ---------------- FLOATING CTA, "Fix these now!" opens the pricing drawer ---------------- */
  (function floatingCta(){
    const b=document.createElement('button');
    b.className='fix-fab'; b.type='button';
    b.innerHTML='<span class="ff-dot"></span>Fix these now!';
    // E3: open the in-page drawer at the Fix Sprint, no navigation. Falls back to the in-page pane if the drawer
    // is unavailable, so the control is never dead.
    b.addEventListener('click',()=>{ if(Drawer.isOpen&&Drawer.open){ Drawer.open('.route1'); } else { openPillar('plan'); requestAnimationFrame(()=>{ const fx=document.querySelector('#sec-plan .route1')||document.querySelector('#sec-plan .route'); if(fx) scrollHeadingTop(fx); }); } });
    document.body.appendChild(b);
  })();


  /* ============================================================
     COMMERCE, intake modal ↗ /api/intent ↗ Cal.com embed; add-ons ↗ Stripe
     ============================================================ */
  const Commerce = (function(){
    const meta = (D && D.meta) || {};
    // Map a data-book route to the hidden intent value the backend expects.
    function intentFor(route, tier){
      if(route==='one_time_fix') return 'one_time_fix';
      const t = String(tier||'').toLowerCase();
      if(t.indexOf('foundation')>=0) return 'foundation';
      if(t.indexOf('authority')>=0) return 'authority';
      if(t.indexOf('enterprise')>=0) return 'enterprise';
      return 'enterprise'; // package CTA with no explicit tier, default to the top mandate
    }
    // Human label for a tier/fix/add-on intent. Add-on intents pass the add-on display
    // name straight through (the backend accepts it via addonKey).
    const TIER_INTENTS={foundation:1,authority:1,enterprise:1,one_time_fix:1};
    function intentLabel(intent){
      if(intent==='one_time_fix') return 'One-time Fix Sprint';
      if(TIER_INTENTS[intent]) return intent.charAt(0).toUpperCase()+intent.slice(1)+' mandate';
      return String(intent||'')+' add-on'; // add-on display name
    }
    function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

    // --- modal shell (built once, reused) ---
    let modal=null;
    function ensureModal(){
      if(modal) return modal;
      modal=document.createElement('div');
      modal.className='cmx-overlay'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
      modal.innerHTML='<div class="cmx" role="document"><button class="cmx-x" aria-label="Close">×</button><div class="cmx-body"></div></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click',ev=>{ if(ev.target===modal) close(); });
      modal.querySelector('.cmx-x').addEventListener('click',close);
      document.addEventListener('keydown',ev=>{ if(ev.key==='Escape'&&modal.classList.contains('open')) close(); });
      return modal;
    }
    function open(){ ensureModal().classList.add('open'); document.body.classList.add('cmx-lock'); }
    function close(){ if(modal){ modal.classList.remove('open'); document.body.classList.remove('cmx-lock'); modal.querySelector('.cmx-body').innerHTML=''; } }

    // --- the intake form (tier, one_time_fix, OR an add-on enquiry) ---
    // opts.addon (a display name) routes this as an add-on enquiry: the hidden intent becomes
    // the add-on name and the copy explains the call will set the add-on up. Used when Stripe
    // checkout is unavailable, so the buyer never hits a dead redirect.
    function openIntake(route, tier, opts){
      opts=opts||{};
      const isAddon=!!opts.addon;
      const intent=isAddon?opts.addon:intentFor(route,tier);
      const topFinding=((D.fixes||[])[0]||{}).title||'';
      const m=ensureModal(); open();
      const turnstileSite = (window.TURNSTILE_SITE_KEY||'');
      const eyebrow=isAddon?(esc(opts.addon)+' · add-on'):esc(intentLabel(intent));
      const lede=isAddon
        ? 'Online checkout for this solution is being switched on. Leave your details and pick a time, and Tamazia will set it up with you on the call.'
        : ('30 seconds. This scopes the call so no time is wasted on discovery. '+(intent==='one_time_fix'?'A one-time, fixed-scope sprint, not a retainer.':'Your tier and strongest finding are carried into the conversation.'));
      m.querySelector('.cmx-body').innerHTML=`
        <div class="cmx-head">
          <span class="cmx-eyebrow">${eyebrow}</span>
          <h3>Share a few details about the firm, then pick a time</h3>
          <p>${lede}</p>
        </div>
        <form class="cmx-form" novalidate>
          <input type="hidden" name="intent" value="${esc(intent)}">
          <input type="hidden" name="audit_domain" value="${esc(meta.domain||'')}">
          <input type="hidden" name="audit_slug" value="${esc(meta.slug||'')}">
          <input type="hidden" name="top_finding" value="${esc(topFinding)}">
          <input type="text" name="c_website_2" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
          <div class="cmx-grid">
            <label class="cmx-field"><span>Firm name *</span><input name="firm_name" required value="${esc(meta.company||'')}" autocomplete="organization"></label>
            <label class="cmx-field"><span>Website</span><input name="domain" value="${esc(meta.domain||'')}" autocomplete="url"></label>
            <label class="cmx-field"><span>Sector</span><input name="sector" value="${esc(meta.sector||'')}"></label>
            <label class="cmx-field"><span>Jurisdiction(s)</span><input name="jurisdictions" value="${esc([meta.country].filter(Boolean).join(', '))}" placeholder="e.g. UK, UAE"></label>
            <label class="cmx-field"><span>Locations / scale</span><input name="locations" placeholder="e.g. 3 clinics, 1 country"></label>
            <label class="cmx-field"><span>Revenue band</span>
              <select name="revenue_band">
                <option value="">Prefer not to say</option>
                <option>Under £1M</option><option>£1M to £5M</option><option>£5M to £20M</option>
                <option>£20M to £100M</option><option>£100M+</option>
              </select></label>
            <label class="cmx-field"><span>Your role</span><input name="buyer_role" placeholder="e.g. Managing Partner, Founder, CMO"></label>
            <label class="cmx-field"><span>Timeline</span>
              <select name="timeline">
                <option value="">Unsure</option>
                <option>Immediately</option><option>This quarter</option>
                <option>Next quarter</option><option>Exploring</option>
              </select></label>
          </div>
          <label class="cmx-field cmx-wide"><span>What's the goal or the pain that triggered this?</span><textarea name="goal" rows="3" placeholder="The outcome you want, or the problem that prompted the audit."></textarea></label>
          ${turnstileSite?`<div class="cf-turnstile" data-sitekey="${esc(turnstileSite)}" data-theme="light"></div>`:''}
          <div class="cmx-err" role="alert" hidden></div>
          <div class="cmx-actions">
            <button type="submit" class="btn solid cmx-submit">Continue to the calendar ↗</button>
          </div>
          <p class="cmx-fine">Submitting records this enquiry with Tamazia and opens the founder's calendar. No payment is taken here.</p>
        </form>`;
      const form=m.querySelector('.cmx-form');
      // lazily render Turnstile widget if its script is present
      if(turnstileSite && window.turnstile && typeof window.turnstile.render==='function'){
        try{ window.turnstile.render(form.querySelector('.cf-turnstile')); }catch(_e){}
      }
      const firstInput=form.querySelector('input[name="firm_name"]'); if(firstInput) try{ firstInput.focus(); }catch(_e){}
      form.addEventListener('submit',ev=>{ ev.preventDefault(); submitIntake(form); });
    }

    function readForm(form){
      const fd=new FormData(form); const o={};
      fd.forEach((v,k)=>{ o[k]=v; });
      return o;
    }

    async function submitIntake(form){
      const errEl=form.querySelector('.cmx-err');
      const btn=form.querySelector('.cmx-submit');
      const body=readForm(form);
      if(!body.firm_name && !body.domain){ showErr(errEl,'Please enter the firm name.'); return; }
      // capture Turnstile token if present
      try{ if(window.turnstile && typeof window.turnstile.getResponse==='function'){ const t=window.turnstile.getResponse(); if(t) body['cf-turnstile-response']=t; } }catch(_e){}
      btn.disabled=true; const label=btn.textContent; btn.textContent='Saving…'; if(errEl) errEl.hidden=true;
      let res=null;
      try{
        const r=await fetch('/api/intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        res=await r.json().catch(()=>({}));
        if(!r.ok || !res || res.ok!==true){ throw new Error((res&&res.error)||('http_'+r.status)); }
      }catch(err){
        btn.disabled=false; btn.textContent=label;
        showErr(errEl,'That could not be saved just now. Please try again, or email founder@tamazia.co.uk.');
        return;
      }
      mountCal(res.calSlug, res.prefill||{}, intentLabel(body.intent));
    }
    function showErr(el,msg){ if(!el)return; el.textContent=msg; el.hidden=false; }

    // --- Cal.com inline embed (loaded on demand, after intent is saved) ---
    function loadCalOnce(ns){
      // standard Cal.com embed bootstrap (matches src/pages/book/[event].astro)
      (function (C, A, L) {
        let p=function(a,ar){a.q.push(ar);}; let d=C.document;
        C.Cal=C.Cal||function(){ let cal=C.Cal; let ar=arguments;
          if(!cal.loaded){ cal.ns={}; cal.q=cal.q||[]; d.head.appendChild(d.createElement('script')).src=A; cal.loaded=true; }
          if(ar[0]===L){ const api=function(){p(api,arguments);}; const namespace=ar[1]; api.q=api.q||[];
            if(typeof namespace==='string'){ cal.ns[namespace]=cal.ns[namespace]||api; p(cal.ns[namespace],ar); p(cal,['initNamespace',namespace]); }
            else{ p(cal,ar); } return; }
          p(cal,ar);
        };
      })(window,'https://app.cal.com/embed/embed.js','init');
    }
    function mountCal(slug, prefill, label){
      slug=slug||'tamazia/strategy-call';
      const m=ensureModal();
      const elId='cmx-cal-'+Math.random().toString(36).slice(2,8);
      m.querySelector('.cmx-body').innerHTML=`
        <div class="cmx-head">
          <span class="cmx-eyebrow">${esc(label||'')} · enquiry saved</span>
          <h3>Pick a time with the founder</h3>
          <p>Your details are with Tamazia. Choose a slot below and you'll get a calendar invite immediately.</p>
        </div>
        <div id="${elId}" class="cmx-cal" aria-label="Cal.com booking widget"></div>
        <p class="cmx-fine">Trouble loading? <a href="https://cal.com/${esc(slug)}" target="_blank" rel="noopener">Open the calendar directly</a> or email <a href="mailto:founder@tamazia.co.uk">founder@tamazia.co.uk</a>.</p>`;
      try{
        loadCalOnce(slug);
        window.Cal('init', slug, { origin:'https://app.cal.com' });
        const cfg={ layout:'month_view' };
        if(prefill && (prefill.name||prefill.notes)){ cfg.name=prefill.name||''; if(prefill.notes) cfg.notes=prefill.notes; }
        window.Cal.ns[slug]('inline',{ elementOrSelector:'#'+elId, config:cfg, calLink:slug });
        window.Cal.ns[slug]('ui',{ theme:'light', hideEventTypeDetails:false, layout:'month_view' });
      }catch(_e){
        // graceful fallback, direct link already shown above
        const el=document.getElementById(elId); if(el) el.innerHTML='<a class="btn solid" href="https://cal.com/'+esc(slug)+'" target="_blank" rel="noopener">Open the founder\'s calendar ↗</a>';
      }
      // GA4 lead event when the iframe attaches
      const wrap=document.getElementById(elId);
      if(wrap && window.MutationObserver){ const obs=new MutationObserver((mu,o)=>{ if(wrap.querySelector('iframe')){ if(typeof window.gtag==='function') window.gtag('event','generate_lead',{event_category:'audit_booking',event_label:slug,value:1}); o.disconnect(); } }); obs.observe(wrap,{childList:true,subtree:true}); }
    }

    // --- small inline Cal widget embedded straight into a booking card (Section 6) ---
    // Same slug + bootstrap as the modal embed (tamazia/strategy-call). The chosen intent is
    // carried as a prefill note so the founder sees the route. Degrades to a direct link.
    const CAL_SLUG='tamazia/strategy-call';
    function mountInline(el){
      if(!el || el.dataset.mounted) return; el.dataset.mounted='1';
      const intent=el.dataset.intent||'package';
      const tier=el.dataset.tier||'';
      const label=intent==='one_time_fix'?'One-time Fix Sprint':((tier?tier+' ':'')+'strategy call');
      const elId='cal-in-'+Math.random().toString(36).slice(2,8);
      el.innerHTML=`<div id="${elId}" class="cal-in-frame"></div>
        <p class="cmx-fine">Prefer a direct link? <a href="https://cal.com/${esc(CAL_SLUG)}" target="_blank" rel="noopener">Open the founder's calendar</a>.</p>`;
      try{
        const ns='cal_'+elId.replace(/[^a-z0-9]/gi,'');
        loadCalOnce(ns);
        window.Cal('init', ns, { origin:'https://app.cal.com' });
        const notes='Audit route: '+label+(meta.company?(' · '+meta.company):'');
        window.Cal.ns[ns]('inline',{ elementOrSelector:'#'+elId, config:{ layout:'month_view', notes }, calLink:CAL_SLUG });
        window.Cal.ns[ns]('ui',{ theme:'light', hideEventTypeDetails:true, layout:'month_view' });
      }catch(_e){
        const f=document.getElementById(elId); if(f) f.innerHTML='<a class="btn solid block" href="https://cal.com/'+esc(CAL_SLUG)+'" target="_blank" rel="noopener">Open the founder\'s calendar ↗</a>';
      }
    }

    // --- Stripe add-on checkout (with graceful intake fallback) ---
    // No Stripe key is live today, so /api/stripe/checkout returns { ok:false, fallback:true }.
    // We treat that as the expected path: open the intake modal with THIS add-on preselected.
    // When the keys land the same endpoint returns { ok:true, url }, which we redirect to.
    function addonFallback(addon, btn, label, note){
      if(btn){ btn.classList.remove('loading'); btn.textContent=label; }
      toast(note);
      openIntake('addon',null,{ addon });
    }
    async function startAddon(addon, price, btn, opts){
      opts = opts || {};
      const label = btn ? btn.textContent : '';
      if(btn){ btn.classList.add('loading'); btn.textContent='Opening checkout…'; }
      let res=null;
      try{
        // Carry this report's slug+hash so a successful Route 3 payment unlocks THIS exact link (webhook → audit_pages.unlocked).
      const _ap=(location.pathname.match(/\/audit\/([^/]+)\/([^/]+)/)||[]);
      const r=await fetch('/api/stripe/checkout',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ addon, price, audit_domain:meta.domain||'', company:meta.company||'', trial_days:opts.trial||0, audit_slug:(_ap[1]||meta.slug||''), audit_hash:(_ap[2]||'') })});
        res=await r.json().catch(()=>({}));
        // Live checkout session: go straight to Stripe.
        if(r.ok && res && res.ok && res.url){ window.location.assign(res.url); return; }
        // Explicit, expected fallback (no Stripe key / price): route to the intake modal.
        if(res && res.fallback){
          addonFallback(addon, btn, label, 'Online checkout for this add-on is being switched on. Leave your details and the founder will set it up with you.');
          return;
        }
        throw new Error((res&&res.error)||('http_'+r.status));
      }catch(err){
        // Genuine transient failure: still route to the founder path, never a dead end.
        addonFallback(addon, btn, label, 'Checkout could not open just now. Leave your details and the founder will sort it directly.');
      }
    }

    // tiny toast (no dependency)
    let toastEl=null, toastT=null;
    function toast(msg){
      if(!toastEl){ toastEl=document.createElement('div'); toastEl.className='cmx-toast'; document.body.appendChild(toastEl); }
      toastEl.textContent=msg; toastEl.classList.add('show');
      clearTimeout(toastT); toastT=setTimeout(()=>toastEl.classList.remove('show'),5200);
    }

    return { openIntake, startAddon, mountInline };
  })();

  /* ---------------- PLAN: lazy-mount the two inline Cal widgets when the pane opens ---------------- */
  // The booking calendars are heavy iframes. Mount them only once the plan pillar is opened,
  // so the one-page pane stays light until the buyer actually reaches "Two ways to start".
  function mountPlanCalendars(){ document.querySelectorAll('#sec-plan [data-cal-embed]').forEach(el=>Commerce.mountInline(el)); }
  (function planCalObserver(){
    const plan=document.getElementById('sec-plan'); if(!plan) return;
    if(plan.open) mountPlanCalendars();
    plan.addEventListener('toggle',()=>{ if(plan.open) mountPlanCalendars(); });
  })();

  /* ---------------- PostHog (E10): identify + event, no-op when unconfigured ---------------- */
  // Uses the project key threaded onto window.D.posthog (from env). If the PostHog JS lib is already
  // loaded (window.posthog) we use it; otherwise we POST to the capture API directly. When no key is
  // present every call is a silent no-op, so the page never errors without analytics configured.
  const PH=(function(){
    const cfg=(D&&D.posthog)||{}; const key=(typeof cfg.key==='string'&&cfg.key)?cfg.key:'';
    const host=((typeof cfg.host==='string'&&cfg.host)?cfg.host:'https://eu.i.posthog.com').replace(/\/$/,'');
    function identify(distinctId, props){
      if(!key||!distinctId) return;
      try{ if(window.posthog&&typeof window.posthog.identify==='function'){ window.posthog.identify(distinctId, props||{}); return; } }catch(_e){}
      try{ fetch(host+'/capture/',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,
        body:JSON.stringify({api_key:key,event:'$identify',distinct_id:distinctId,properties:Object.assign({'$set':props||{}},{lib:'tamazia-audit'})})}).catch(()=>{}); }catch(_e){}
    }
    function capture(event, distinctId, props){
      if(!key) return;
      try{ if(window.posthog&&typeof window.posthog.capture==='function'){ window.posthog.capture(event, props||{}); return; } }catch(_e){}
      try{ fetch(host+'/capture/',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,
        body:JSON.stringify({api_key:key,event:event,distinct_id:distinctId||((D.meta&&D.meta.domain)||'anon'),properties:Object.assign({},props||{},{lib:'tamazia-audit'})})}).catch(()=>{}); }catch(_e){}
    }
    return { identify, capture };
  })();

  /* ---------------- Booking form (E10): name / website / email / sector → Neon, + PostHog ---------------- */
  // POSTs to /api/audit-request (the proven handleSubmission pipeline: validates, KV-saves, writes Neon `leads`
  // via syncLeadToNeon, fires Resend acknowledgement + Slack/Telegram founder alert). On success we fire a
  // PostHog identify (keyed on the email) and an audit_contact_submitted event. Honeypot c_website_2 is server-checked.
  (function bookForm(){
    const form=document.querySelector('.audit-bookform'); if(!form) return;
    const errEl=form.querySelector('.abf-err'); const btn=form.querySelector('.abf-submit');
    form.addEventListener('submit',async function(ev){
      ev.preventDefault();
      const fd=new FormData(form); const body={}; fd.forEach((v,k)=>{ body[k]=v; });
      const email=String(body.email||'').trim();
      if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ if(errEl){errEl.textContent='Please enter a valid email address.';errEl.hidden=false;} return; }
      // fire-fill signal as the buyer commits (before the network round-trip)
      PH.capture('audit_contact_form_fill', email, { sector:body.sector||'', website:body['audit-input']||'', source:'audit_bookform' });
      const label=btn.textContent; btn.disabled=true; btn.textContent='Sending…'; if(errEl) errEl.hidden=true;
      try{
        // C-B contract (shared with WEB-B / neon-sync): both audit forms POST audit_slug + audit_domain +
        // top_finding so the lead resolves back to this exact report. top_finding = the highest-severity fix title.
        const r=await fetch('/api/audit-request',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify(Object.assign({}, body, { company:body.name||'', tab:'audit', audit_slug:(D.meta&&D.meta.slug)||'', audit_domain:(D.meta&&D.meta.domain)||'', top_finding:(((D.fixes||[])[0]||{}).title||'') }))});
        const res=await r.json().catch(()=>({}));
        if(!r.ok || (res && res.ok===false && !res.silent)){ throw new Error((res&&res.error)||('http_'+r.status)); }
        PH.identify(email, { email, name:body.name||'', sector:body.sector||'', website:body['audit-input']||'' });
        PH.capture('audit_contact_submitted', email, { sector:body.sector||'', website:body['audit-input']||'', source:'audit_bookform' });
        form.innerHTML='<div class="abf-done">Thank you. Your details are with Tamazia. A reply goes to '+escH(email)+' within one business day; time-sensitive matters can book the calendar directly.</div>';
      }catch(_e){
        btn.disabled=false; btn.textContent=label;
        if(errEl){ errEl.textContent='That could not be sent just now. Please try again, or email founder@tamazia.co.uk.'; errEl.hidden=false; }
      }
    });
  })();

  // notes toggle
  const nt=document.getElementById('notesToggle');
  if(nt) nt.addEventListener('click',function(){document.body.classList.toggle('no-notes');this.textContent=document.body.classList.contains('no-notes')?'Notes off':'Notes on';});
})();
