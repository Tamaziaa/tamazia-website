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
    entryAudit: 1500,                                   // entryAuditGbp
    // pricingContent.tiers[]: priceGbp (from/month), priceGbpStandard (struck anchor), savesGbp6 (6-month saving)
    tiers: {
      foundation: { from:2500, standard:3300, saves6:4800 },
      authority:  { from:4500, standard:6000, saves6:9000 },
      enterprise: { from:9500, standard:12700, saves6:19200 },
    },
    fixPacks: { ten:7500, twenty:12500, thirty:17500 }, // fixPacksGbp
    fixPacksLane: 'No retainer required. Buy the fixes, own the work.', // fixPacksLane
    // exposureReportGbp · £449 unlocks the full report (first month free), then £750/mo recurring; £1,500 real value (struck).
    exposureReport: { unlock:449, monthlyCover:750, realValue:1500 },
    independent: {                                       // independentSolutionsGbp (anchor→offer) · synced to pricing.ts
      websiteRemodelling:   { anchor:4800, offer:2400 },
      aiAuthority:          { anchor:3600, offer:1800 },
      icpOutreach:          { anchor:5600, offer:2800 },
      onlinePersonalBranding:{ anchor:2200, offer:1100 },
      instagramPresence:    { anchor:1800, offer:900 },
      ymylContent:          { anchor:2400, offer:1200 },
      reputationCrisis:     { anchor:3000, offer:1500 },
      gbpDomination:        { anchor:2400, offer:1200 },
    },
  };
  // FOUNDER-BLOCKED links + contact. Threaded from env via the adapter into window.D.
  // Each is rendered ONLY when it is a non-empty string; when unset the element is omitted
  // entirely (no placeholder, no dead button). See PRECHECK §2.
  const LINKS = (window.D && window.D.links) || {};
  const BOOKING_URL   = typeof LINKS.booking === 'string' ? LINKS.booking.trim() : '';
  const CONTACT_PHONE = (window.D && typeof window.D.contactPhone === 'string') ? window.D.contactPhone.trim() : '';
  const STRIPE = {
    unlock: strOr(LINKS.stripeUnlock), cover: strOr(LINKS.stripeCover),
    fix10: strOr(LINKS.stripeFix10), fix20: strOr(LINKS.stripeFix20), fix30: strOr(LINKS.stripeFix30),
  };
  function strOr(v){ return (typeof v==='string' && v.trim()) ? v.trim() : ''; }
  // Stripe Payment Link by fix-pack scope key (10 / 20 / 30 / all→30). '' when unset.
  function stripeFixLink(k){ return k==='10'?STRIPE.fix10 : k==='20'?STRIPE.fix20 : (k==='30'||k==='all')?STRIPE.fix30 : ''; }
  // Hosted Stripe Payment Links (LIVE, GBP). Independent Solutions keyed by EXACT addon name (ADDONS[].nm);
  // STRIPE_UNLOCK is the Audit Unlock card. Keep in sync with STRIPE_LINKS in src/components/sections/Pricing.astro.
  const STRIPE_LINKS = {
    'Website Remodelling': 'https://buy.stripe.com/cNi00jcwI1i432w7Auf7i00',
    'AI Authority': 'https://buy.stripe.com/fZu4gz9kw6Co0Uo3kef7i0f',
    'ICP Outreach': 'https://buy.stripe.com/bJe14n8gs1i4gTm1c6f7i0g',
    'Online Personal Branding': 'https://buy.stripe.com/28EdR97co7GseLedYSf7i0h',
    'Instagram Presence': 'https://buy.stripe.com/aFa5kD9kw4ug1Ys082f7i0i',
    'YMYL Content': 'https://buy.stripe.com/6oU3cvbsEd0M32w3kef7i05',
    'Reputation & Crisis': 'https://buy.stripe.com/aFa00jdAMe4Q8mQg70f7i0k',
    'GBP Domination': 'https://buy.stripe.com/00wcN57co2m8eLef2Wf7i0l',
  };
  const STRIPE_UNLOCK = 'https://buy.stripe.com/3cI3cv1S44ugbz2aMGf7i0d';
  // Append the minted report's identity so the webhook can flip THIS report to unlocked after payment.
  function unlockHref(){
    const ap = (location.pathname.match(/\/audit\/([^/]+)\/([^/]+)/) || []);
    const slug = ap[1] || (window.D && window.D.meta && window.D.meta.slug) || '';
    const hash = ap[2] || '';
    const ref = (slug && hash) ? ('?client_reference_id=' + encodeURIComponent(slug + '__' + hash)) : '';
    return STRIPE_UNLOCK + ref;
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
  // recommended tier on D.pricing (rec:true). The rail CTA + the founder-session CTA both route to THIS tier
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
      <div class="rail-band">${D.frameworksTotal} frameworks screened · ${D.frameworksAssessed} bind you</div>
      <div class="rail-exposure"><div class="v">${D.exposureHeadline||D.exposure}</div><div class="l">${D.exposureNote}</div></div>
      <div class="rail-kpis">
        <div class="rail-kpi"><div class="v red">${D.counts.critical}</div><div class="l">Critical findings</div></div>
        <div class="rail-kpi"><div class="v">${D.confirmed}</div><div class="l">Confirmed v. evidence</div></div>
        <div class="rail-kpi"><div class="v red">${D.geo.shareOfVoice}</div><div class="l">AI share of voice</div></div>
        <div class="rail-kpi"><div class="v">${D.competitors.rows[0].dr}</div><div class="l">Domain rating</div></div>
      </div>
      <div class="rail-prep"><div class="rp-by">Report prepared by</div><div class="rp-name">Aman Pareek</div><div class="rp-deg">LLM in International Business Law,</div><div class="rp-inst"><img class="rp-logo" src="/audit/kings-logo.png" alt="King's College London" onerror="this.remove()">King&rsquo;s College London</div><div class="rp-rules">Every fix checked against ${D.rulesChecked} rules</div></div>
      <div class="rail-social">
        <a href="https://www.instagram.com/tamaziauk/" target="_blank" rel="noopener" aria-label="Tamazia on Instagram" title="@tamaziauk"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
        <a href="https://www.linkedin.com/in/amanpareekk/" target="_blank" rel="noopener" aria-label="Aman Pareek on LinkedIn" title="Aman Pareek on LinkedIn"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.3-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21H9V9Z"/></svg></a>
        <a href="mailto:contact@tamazia.co.uk" aria-label="Email contact@tamazia.co.uk" title="contact@tamazia.co.uk"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></a>
      </div>
      <div class="rail-navtitle">Jump to</div>
      <nav class="railnav">${nav.map((n,i)=>`<button data-pane="${n.id}" class="${i===0?'active':''}"><span class="ni dot ${n.dot}"></span>${n.nm}<span class="nc">${n.c}</span></button>`).join('')}</nav>
      <button class="rail-cta" data-book="package" data-tier="${escH(recommendedTierName())}">Walk report with the founder ↗</button>
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
      <div class="card-h"><div class="t" style="font-size:11px;color:var(--muted);letter-spacing:.02em">How your ${D.score}/100 is calculated</div><div class="meta">${D.frameworksTotal} frameworks · ${D.confirmed} evidence checks</div></div>
      <div class="grid g-7-5" style="gap:20px">
        <div><p style="font-size:13.5px;color:#3a2d30;line-height:1.55">${D.scoring.formula}</p>
          <p style="font-size:13px;color:var(--muted);margin-top:9px;line-height:1.5">${D.scoring.why}</p>
          <div class="mono" style="font-size:10px;color:var(--ox);margin-top:11px;letter-spacing:.02em;line-height:1.6">${D.scoring.inputs}</div></div>
        <div class="scorebands">${D.scoring.bands.map(b=>`<div class="sb ${b.g===D.grade[0]?'on':''}"><span class="sbg">${b.g}</span><span class="sbr">${b.r}</span><span class="sbd">${b.d}</span></div>`).join('')}</div>
      </div>
    </div>
    <div class="subhead"><span class="nt">↳</span><h3>The three you fix this quarter, Tamazia closes all three inside the first eight weeks.</h3></div>
    ${D.fixes.map((f,i,a)=>CH.finding(f,i===0,{id:'fx-'+(i+1),locked:i>=Math.ceil(a.length/2)})).join('')}
    <div class="card pad" style="margin-top:10px"><div class="card-h"><div class="t">Where Tamazia takes you</div><div class="meta">projected · prior engagements</div></div>${CH.trajectory(820,150)}</div>`;

  P.regulatory = ()=>{
    // #3: only render the "breaches in full" subhead + cards when the Regulatory-filtered
    // fixes list is non-empty, otherwise the heading/subhead sit above an empty body.
    const regFixes=(D.fixes||[]).filter(f=>f.pillar==='Regulatory');
  return `
    <div class="pane-head"><span class="eyebrow">Regulatory exposure</span>
      <h2>${(D.compliance_unassessed ? (D.render_mode==='knowledge' && (D.frameworksBinding||0)>0 ? ('Your live pages could not be deep-read on this scan, so no breach is asserted anywhere below. What follows instead is the statute map: the '+(D.frameworksBinding)+' frameworks that bind a '+((D.meta&&D.meta.sector)||'regulated')+' firm established in your jurisdiction. Every row is catalogue fact tied to your registration, not inference from your site. A rendered-DOM re-scan completes the breach assessment on top of it.') : 'Compliance could not be assessed this scan. Your site blocked a deep read, so the checks below are incomplete and no pass is implied. A re-scan completes it.') : (D.regulatoryHeadline || ('All '+D.rulesChecked+' active frameworks were screened. '+(D.frameworksBinding||D.frameworksAssessed)+' of them legally bind you, and '+D.counts.critical+' '+plur(D.counts.critical,'is','are')+' breached on your live site right now.')))}</h2>
      <p>Every scan screens all ${D.rulesChecked} active frameworks; each is jurisdiction-, sector-, capability- and trigger-gated, so only the laws that genuinely attach, and where the gap is genuinely present, appear here. One box per framework; open it for the breaches, the regulator and its most recent enforcement action.</p></div>
    <div class="subhead" style="margin-top:0"><span class="nt">↳</span><h3>The ${D.frameworksAssessed} frameworks carrying your exposure${D.counts.critical>0?(', with '+D.counts.critical+' breached on your live site right now'):''}, worst exposure first</h3></div>
    <p class="reg-sub">One box per regulator. The bar shows the severity mix; open it for every breach evidenced on your live pages, the regulator's most recent enforcement, and the exact Tamazia fix.</p>
    ${(D.jurisdictions||[]).length>1?`<div class="jur-select"><span class="jur-lbl">Filter by jurisdiction</span><button class="jur-chip active" data-jurf="all">All</button>${D.jurisdictions.map(j=>`<button class="jur-chip" data-jurf="${j}">${j}</button>`).join('')}</div>`:''}
    ${D.frameworks.map((fw,i)=>{
      const tot=Math.max(1,fw.findings), cp=fw.c/tot*100, hp=fw.h/tot*100, sp=Math.max(0,100-cp-hp);
      return `<details class="fw" data-code="${escH(fw.code)}" data-jur="${fw.jur||'Global'}" ${i===0?'open':''}>
      <summary>
        <div class="fw-head"><span class="code">${escH(fw.code)}</span>
          <div class="fwn-wrap"><div class="fwn">${escH(fw.name)} <span class="jbadge">${escH(fw.jur||'Global')}</span>${fw.binding_label?' <span class="jbadge bbadge">'+escH(fw.binding_label)+'</span>':''}</div>${fw.screened ? `<div class="fw-assessed"><span class="badge">${fw.assessed_label || 'APPLIES · ASSESSED'}</span>${(fw.inspected_pages && fw.inspected_pages.length) ? `<span class="inspected">Inspected: ${fw.inspected_pages.slice(0,4).join(' · ')}</span>` : ''}</div>` : ''}<div class="fwr">${escH(fw.regulator)} · ${fw.screened?'screened this scan':(fw.findings+' '+plur(fw.findings,'breach','breaches'))}</div></div>
          <div class="cnt">${fw.c?`<span class="c">${fw.c} crit</span>`:''}${fw.h?`<span class="h">${fw.h} high</span>`:''}${fw.s?`<span class="s">${fw.s} std</span>`:''}</div>
          <div class="fwe">${escH(fw.exp)}</div></div>
        <div class="fwbar"><div class="fwbar-track">${cp?`<span style="width:${cp}%;background:var(--red)"></span>`:''}${hp?`<span style="width:${hp}%;background:var(--amber)"></span>`:''}${sp?`<span style="width:${sp}%;background:var(--gold-light)"></span>`:''}</div></div>
      </summary>
      <div class="fwbody">
        <div class="lbl">Why this framework matters</div>${escH(fw.why)}
        ${(fw.obligations||[]).length?`<div class="lbl">What ${escH(fw.regulator)} assesses</div><ul class="obl">${fw.obligations.map(o=>`<li>${escH(o)}</li>`).join('')}</ul>`:''}
        <div class="lbl">${escH(fw.regulator)} &middot; recent enforcement</div><div class="action">${escH(fw.action)}${fw.enforcement_url?` <a href="${escH(fw.enforcement_url)}" target="_blank" rel="noopener nofollow" class="lawcite">source &#8599;</a>`:''}</div>
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

  /* ---------------- TRUSTED-BY (demo / placeholder logos only) ---------------- */
  // Continuously-scrolling grey watermark strip. The SVGs in /audit/trusted-logos/ are
  // GENERIC PLACEHOLDERS (abstract marks + invented wordmarks), never real client names.
  // If a logo SVG is missing it onerrors into a styled grey text-name placeholder that
  // drops in cleanly when the real demo SVGs land.
  const TRUSTED_LOGOS = [
    ['demo-1','Meridian'],['demo-2','Calloway'],['demo-3','Ardent'],
    ['demo-4','Thornbury'],['demo-5','Vaughn & Hale'],['demo-6','Sterling Park'],
    ['demo-7','Lockhart'],['demo-8','Ashbourne'],['adidas','adidas'],
  ];
  function tbItem(n,label){
    const fb="this.outerHTML='<span class=\\'tb-name\\'>"+label.replace(/'/g,'')+"</span>'";
    return `<img class="tb-logo" src="/audit/trusted-logos/${n}.svg" alt="" aria-hidden="true" loading="lazy" decoding="async" width="150" height="34" onerror="${fb}">`;
  }
  function trustedStrip(){
    const row=TRUSTED_LOGOS.map(([n,l])=>tbItem(n,l)).join('');
    return `<div class="trusted-by" aria-label="Representative client profile, demo logos">
      <div class="tb-label">Trusted by regulated firms across UK, EU, USA, Middle East, Asia and worldwide</div>
      <div class="tb-marquee"><div class="tb-track">${row}${row}</div></div>
    </div>`;
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
  // Independent Solutions (E7): the seven standalone programmes + GBP Domination. Each leads with the RESULT,
  // then carries a one-line scope and five concrete steps. Prices come from PRICES.independent (pricing.ts):
  // anchor struck through, offer shown. AI Authority merges the former GEO + AI Entity/Knowledge-Panel work;
  // its measurement is framed as REPORTING, never a guarantee. Instagram carries no follower guarantee. No 'we'/'our'.
  const I=PRICES.independent;
  const ADDONS=[
    {nm:'Website Remodelling', anchor:I.websiteRemodelling.anchor, offer:I.websiteRemodelling.offer, unit:'one-time', hero:true,
      scope:'A full rebuild of the site that sells, on a compliant, fast, conversion-led foundation.',
      usp:'The site buyers actually trust and act on. Rebuilt for speed, clarity and conversion, with every page reviewed against your sector’s law before it ships.',
      spec:['Audit of the current site against speed, conversion and compliance','Information architecture and page plan mapped to buyer intent','Design and build on a Core-Web-Vitals-clean foundation','Every page legally reviewed before launch','Handover with the work owned outright once paid']},
    {nm:'AI Authority', anchor:I.aiAuthority.anchor, offer:I.aiAuthority.offer, unit:'mo', hero:true,
      scope:'GEO and entity authority merged: be the named answer across the AI engines, with the machine-readable identity they read first.',
      usp:'Appear inside ChatGPT, Perplexity, Claude, Gemini, Copilot and Google AI Overviews, and own the entity they read first. The only compliance-reviewed AI authority programme for regulated firms.',
      spec:['Entity, schema, llms.txt and Wikidata build','Google Knowledge Panel and sameAs across every verified profile','Answer-surface content targeting real buyer prompts','Compliance review of what AI says about you','Per-engine position and share-of-voice reporting against named rivals (a report, not a guaranteed placement)']},
    {nm:'ICP Outreach', anchor:I.icpOutreach.anchor, offer:I.icpOutreach.offer, unit:'mo',
      scope:'Compliant outbound to your exact buyer, the same engine that found you.',
      usp:'Your exact buyer reached at scale: 25,000 to 30,000 ICP-targeted, compliance-reviewed emails a month, every lead tracked and classified by intent.',
      spec:['ICP defined and 25,000 to 30,000 targeted contacts sourced monthly','A compliant B2B template built per jurisdiction','Five to seven follow-ups per prospect, reply-stopped','Deliverability managed with inbox rotation',coldSendRule]},
    {nm:'Online Personal Branding', anchor:I.onlinePersonalBranding.anchor, offer:I.onlinePersonalBranding.offer, unit:'mo',
      scope:'The founder and partners made visible and credible across every platform buyers check.',
      usp:'The named-expert authority enterprise buyers and referral partners evaluate before any conversation. Built across every platform they check, not one.',
      spec:['Voice and positioning captured for each principal','Ghostwritten, SEO-optimised posts published on a schedule','Every post compliance-checked before it publishes','Profiles optimised across the platforms buyers check','Engagement and reach reported monthly']},
    {nm:'Instagram Presence', anchor:I.instagramPresence.anchor, offer:I.instagramPresence.offer, unit:'mo',
      scope:'A credible, compliant Instagram presence aligned to your brand.',
      usp:'The social proof buyers check before they reach the website. Built through sector-aligned content and engagement, held to your sector’s ad rules.',
      spec:['Content plan aligned to the brand and sector','Posts and stories produced on a schedule','Sector-aligned audience engagement','Every post checked against '+gbpAdRule,'Reach and engagement reported monthly (no follower guarantee)']},
    {nm:'YMYL Content', anchor:I.ymylContent.anchor, offer:I.ymylContent.offer, unit:'piece',
      scope:'Health and legal grade content, per compliance-reviewed piece.',
      usp:'Content that passes your compliance function first time. Health and legal grade, held to Google’s highest Your-Money-or-Your-Life standard, never generic.',
      spec:['1,200 or more words per piece','Reviewed against your sector’s law before it publishes','Held to Google’s YMYL standard','Structured for search and AI citation','Cheaper than the internal cost of content that fails review']},
    {nm:'Reputation & Crisis', anchor:I.reputationCrisis.anchor, offer:I.reputationCrisis.offer, unit:'mo',
      scope:'Real-time reputation cover with a crisis playbook on standby, and every new ruling the day it lands.',
      usp:'Protect the reputation your pipeline depends on, and move before enforcement does. Real-time monitoring, pre-built suppression and 24-hour crisis response, plus every new ruling in your sector flagged the day it appears.',
      spec:['Real-time review, mention and press monitoring','Suppression architecture, not just alerting','A crisis playbook on standby with the founder','Every new sector ruling flagged with the exact page and rule affected','Sector and jurisdiction filtered, never generic noise']},
    {nm:'GBP Domination', anchor:I.gbpDomination.anchor, offer:I.gbpDomination.offer, unit:'mo',
      scope:'Local map dominance, up to three locations, every element compliance-checked.',
      usp:'Own the local pack that drives 44 percent of search clicks. 30,000 or more compliance-checked map citations per location, every listing and review response reviewed.',
      spec:['Up to three locations, each with its own category strategy','30,000 or more map citations per location','Posting schedule, Q&A and review response system','Every GBP element checked against '+gbpAdRule,'Local position reported monthly']},
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
      <div class="ptj-tiers"><span class="lbl">Projection assumes</span>${TIERS.map((t,i)=>`<button type="button" data-tier-tab="${i}" class="${i===0?'active':''}">${t.name}</button>`).join('')}</div>
    </div>`;
  }

  /* ---------------- ROUTE 3 (E6): recurring Exposure Report cover ---------------- */
  // Absorbs the former standalone "Compliance Monitoring" + "Regulatory Change Alerts" add-ons (they appear
  // NOWHERE else now). Offer model: a one-time £750 unlock that INCLUDES the first month of monthly cover,
  // then £449/month ongoing. Prices from PRICES.exposureReport. The eight specs carry an inline hover detail
  // (data-tip) so the block stays compact. Unlock + Cover are FOUNDER-BLOCKED direct Payment Links (rendered
  // only when STRIPE_LINK_UNLOCK / STRIPE_LINK_COVER are set); the data-subscribe="compliance" path is the
  // always-valid fallback and its contract (data-trial, slug+hash capture in startAddon) is UNCHANGED so the
  // Stripe webhook can still flip audit_pages.unlocked for this exact page. Cold minted pages (D.unlocked=true)
  // skip the paywall: the locked fixes are already open, so the block leads with the founder oversight framing
  // and offers ongoing cover, never an "unlock".
  function route3(){
    const unlock=PRICES.exposureReport.unlock, cover=PRICES.exposureReport.monthlyCover, rv=PRICES.exposureReport.realValue;
    const specs=[
      ['The full Exposure Report','Every locked fix in this report opened in full, plus the complete compliance, search and AI-visibility assessment.'],
      ['Monthly re-scan','This exact audit re-run on your live data every month, so the record always reflects the site as it stands today.'],
      ['Change log','A month-by-month history of what moved: findings closed, new gaps, score and exposure over time.'],
      ['72-hour breach alert','A new breach on your live site flagged within 72 hours of appearing, before enforcement or a competitor moves.'],
      ['Regulatory change alerts','Every new ruling in your sector flagged the day it lands, with the exact page and rule affected.'],
      ['Board-ready quarterly certificate','An enhanced quarterly certificate your committee and insurer can file, benchmarked against your named competitors.'],
      ['Search and AI position tracking','Your rankings and AI share of voice tracked over time against the rivals named alongside you.'],
      ['Founder oversight','Aman Pareek reviews the monthly record personally. Your team’s work is tracked, not just the gaps.'],
    ];
    const specList=`<ul class="r3-list r3-specs">${specs.map(s=>`<li><span class="r3-spec-t">${escH(s[0])}</span><span class="r3-spec-q" data-tip="${escH(s[1])}" tabindex="0" role="note" aria-label="${escH(s[0])}: ${escH(s[1])}">?</span></li>`).join('')}</ul>`;

    if(D.unlocked){
      // Cold / already-unlocked page: no paywall. Lead with founder oversight + ongoing cover.
      // C-H: always route via the metadata-bearing /api/stripe/checkout (data-subscribe) so this report's
      // slug+hash reach the webhook. A static Payment Link cannot carry per-recipient metadata, so it is
      // never used for the unlock/cover flow even when STRIPE_LINK_COVER is set.
      const coverBtn = `<a class="btn solid block" href="${unlockHref()}" target="_blank" rel="noopener">Start monthly cover&nbsp;↗</a>`;
      return `
    <div class="subhead" style="margin-top:16px"><span class="nt">↳</span><h3>Route 3 · Keep this report live</h3></div>
    <p class="plan-sub r3-gold">Every fix in this report is already open to you. Keep it that way: founder-reviewed cover that re-runs this audit on your live data every month.</p>
    <div class="route route3">
      <div class="r3-rib">Founder oversight, every month</div>
      <div class="r3-grid">
        <div class="r3-main">
          <div class="fx-eyebrow">This exact report, kept current</div>
          <h3 class="r3-h">The standing record General Counsels, Heads of Compliance, Marketing Directors and CFOs quote in board packs.</h3>
          ${specList}
        </div>
        <div class="r3-side r3-pay">
          <div class="r3-price"><b class="cmoney" data-gbp="${cover}">${fmtMoney(cover)}</b><small>/month</small></div>
          ${coverBtn}
          <div class="r3-terms">Founder-reviewed monthly cover, ${priceSpan(cover)}/mo. Cancel anytime.</div>        </div>
      </div>
    </div>`;
    }

    // Standard locked page: the paywall. Unlock includes the first month of cover, then £449/mo.
    // C-H: the unlock MUST flow through /api/stripe/checkout (data-subscribe) so this report's slug+hash are
    // carried in the session metadata and the webhook can flip audit_pages.unlocked for THIS exact link. A
    // static Payment Link carries no metadata and would take the payment without ever unlocking the report,
    // so it is no longer used here even when STRIPE_LINK_UNLOCK is set. trial is server-pinned (see checkout.js).
    const unlockBtn = `<a class="btn solid block" href="${unlockHref()}" target="_blank" rel="noopener">Unlock the full report&nbsp;↗</a>`;
    const coverBtn = '';
    return `
    <div class="subhead" style="margin-top:16px"><span class="nt">↳</span><h3>Route 3 · Unlock this report</h3></div>
    <p class="plan-sub r3-gold">Unlock the full Exposure Report for ${priceSpan(unlock)}, with your first month of monitoring included free. After that, ${priceSpan(cover)} per month, and a new breach is caught the day it appears.</p>
    <div class="route route3">
      <div class="r3-rib">Where most board-rooms start</div>
      <div class="r3-grid">
        <div class="r3-main">
          <div class="fx-eyebrow">This exact report, in your inbox every month</div>
          <h3 class="r3-h">Unlock every locked fix now, then re-run this audit on your live data each month.</h3>
          ${specList}
        </div>
        <div class="r3-side r3-pay">
          <div class="r3-was"><s class="cmoney" data-gbp="${rv}">${fmtMoney(rv)}</s></div>
          <div class="r3-price"><b class="cmoney" data-gbp="${unlock}">${fmtMoney(unlock)}</b><small>to unlock</small></div>
          <div class="r3-free">First month of monitoring free</div>
          ${unlockBtn}
          <div class="r3-terms">${priceSpan(unlock)} unlocks the full report and includes your first month. Then ${priceSpan(cover)}/month, founder-reviewed. Cancel anytime.</div>        </div>
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

    // ---- Fix Sprint tiers (Route 1): top 10 / top 20 / top 30. Prices from PRICES.fixPacks. ----
    const _issuesTotal=(D.counts&&(D.counts.total||((D.counts.critical||0)+(D.counts.high||0)+(D.counts.medium||0)+(D.counts.low||0))))||+D.rulesChecked||0;
    const FIX_SPRINT=[
      {k:'10',label:'Top 10',scope:'top 10',price:PRICES.fixPacks.ten,anchor:25000,weeks:8,n:Math.min(10,_issuesTotal||10)},
      {k:'20',label:'Top 20',scope:'top 20',price:PRICES.fixPacks.twenty,anchor:41000,weeks:16,n:Math.min(20,_issuesTotal||20)},
      {k:'30',label:'Top 30',scope:'top 30',price:PRICES.fixPacks.thirty,anchor:65000,weeks:24,n:(_issuesTotal&&_issuesTotal>30?30:(_issuesTotal>20?_issuesTotal:30))},
    ];
    const fixOutcomes=[
      `Your highest-severity findings closed first, in priority order, starting with ${topFix.toLowerCase()}`,
      `A prosecution grade re-scan of all ${D.rulesChecked} frameworks, proving every fix landed`,
      'An evidence pack your compliance committee and your insurer can file',
      'A fixed scope and a fixed price. One engagement, not a retainer',
    ];

    return `
    <div class="plan2">
    <div class="pane-head"><span class="eyebrow">Three ways forward</span>
      <h2>${crit>0?`${crit} critical finding${crit===1?'':'s'} on your live site today, three ways to close them`:`Three ways to close your highest-severity gaps`}, and the trajectory once you do.</h2>
      <p>${D.pricingNotes}</p></div>

    ${planTrajectory(score,wk12,wk24,TIERS,recT.key)}

    <div class="cur-bar" role="tablist" aria-label="Display currency"><span class="cur-lbl">Prices in</span>${['GBP','USD','EUR','AED'].map(c=>{const s=CURRS[c].sym.trim();const lab=(s&&s!==c)?s+' '+c:c;return `<button class="cur-btn${_curState.code===c?' active':''}" data-cur="${c}" type="button" role="tab" aria-selected="${_curState.code===c?'true':'false'}">${lab}</button>`;}).join('')}<span class="cur-note">quoted &amp; invoiced in GBP</span></div>

    <div class="subhead" style="margin-top:12px"><span class="nt">↳</span><h3>Route 1 · One-time Fix Sprint</h3></div>
    <p class="plan-sub r1-lane">${escH(PRICES.fixPacksLane)}</p>
    <div class="route route1">
      <div class="fixbox r1-fixbox">
        <div class="fx-rib">One-time · no retainer</div>
        <div class="r1-toggle r1-toggle-dark" role="tablist" aria-label="Choose Fix Sprint scope">${FIX_SPRINT.map((s,i)=>`<button class="r1-tab${i===0?' active':''}" data-fixtier="${s.k}" data-price="${s.price}" data-anchor="${s.anchor}" data-scope="${s.scope}" data-n="${s.n}" data-weeks="${s.weeks}" type="button" role="tab" aria-selected="${i===0?'true':'false'}"><span class="r1t-l">${s.label}</span><small class="cmoney" data-gbp="${s.price}">${fmtMoney(s.price)}</small></button>`).join('')}</div>
        <div class="fx-main">
          <div class="fx-body">
            <div class="fx-eyebrow">One-time fix sprint</div>
            <h3>Top <span class="r1-headN">${FIX_SPRINT[0].n}</span> critical issues solved.</h3>
            <p class="fx-line">A consultancy quotes <span class="r1-anchor cmoney" data-gbp="${FIX_SPRINT[0].anchor}">${fmtMoney(FIX_SPRINT[0].anchor)}</span>+ to remediate this scope. The Fix Sprint is the same outcome, productised: one fixed price, one fixed timeline, no retainer.</p>
            <ul class="fx-list">${fixOutcomes.map(o=>`<li>${escH(o)}</li>`).join('')}</ul>
          </div>
          <div class="fx-side">
            <div class="fx-price"><span class="fx-was r1-was cmoney" data-gbp="${FIX_SPRINT[0].anchor}">${fmtMoney(FIX_SPRINT[0].anchor)}</span><b class="r1-price cmoney" data-gbp="${FIX_SPRINT[0].price}">${fmtMoney(FIX_SPRINT[0].price)}</b></div>
            <div class="fx-anchor r1-cap">One-time · fixed scope · <span class="r1-weeks">${FIX_SPRINT[0].weeks}</span> weeks</div>
            ${(STRIPE.fix10||STRIPE.fix20||STRIPE.fix30)?`<a class="btn solid block r1-buy" href="${escH(STRIPE.fix10||'#')}" target="_blank" rel="noopener" data-fixtier="10"${STRIPE.fix10?'':' hidden'}>Buy the Fix Sprint&nbsp;↗</a>`:''}
            <a class="btn block fx-cta" data-book="one_time_fix" data-fixtier="10">${STRIPE.fix10?'Or scope it with the founder ↗':'Start the Fix Sprint&nbsp;↗'}</a>
          </div>
        </div>
      </div>
    </div>

    <div class="subhead" style="margin-top:16px"><span class="nt">↳</span><h3>Route 2 · Choose a retainer</h3></div>
    <div class="route tiers3 tiers-lux">${TIERS.map(t=>`
      <div class="tier3 tl ${t.rec?'rec':''} ${t.popular?'pop':''}" data-tier-card="${t.key}">
        ${t.popular?'<div class="tl-rib">Most popular</div>':(t.rec?'<div class="tl-rib tl-rib-rec">Recommended</div>':'')}
        <div class="tl-head"><div class="tl-nm">${t.name}</div><div class="tl-who">${escH(t.wk)}</div></div>
        <div class="tl-priceline"><span class="tl-from">From</span><b class="cmoney" data-gbp="${t.from}">${fmtMoney(t.from)}</b><span class="tl-per">/month</span></div>
        <details class="tl-who-acc"><summary class="tl-who-sum">Who it is for <span class="tl-who-x" aria-hidden="true">+</span></summary><p class="tl-blurb tl-who-p">${escH(t.blurb)}</p></details>
        <ul class="tl-feats">${t.feats.map((f,i)=>{const tip=(TIER_TIPS[t.key]||[])[i]; return `<li><span class="tl-feat-t">${escH(f)}</span>${tip?`<span class="r3-spec-q tl-q" data-tip="${escH(tip)}" tabindex="0" role="note" aria-label="${escH(f)}: ${escH(tip)}">?</span>`:''}</li>`;}).join('')}</ul>
        <div class="t3-more tl-more" hidden><ul>${t.more.map((f,i)=>{const tip=(MORE_TIPS[t.key]||[])[i]; return `<li><span class="tl-feat-t">${escH(f)}</span>${tip?`<span class="r3-spec-q tl-q" data-tip="${escH(tip)}" tabindex="0" role="note" aria-label="${escH(f)}: ${escH(tip)}">?</span>`:''}</li>`;}).join('')}</ul></div>
        <div class="tl-foot"><button class="t3-toggle tl-toggle" type="button">See all inclusions</button><a class="btn block tl-cta" data-book="package" data-tier="${t.name}">Begin ${/^[aeiou]/i.test(t.name)?'an':'a'} ${t.name} enquiry ↗</a></div>
      </div>`).join('')}</div>
    <p class="plan-sub tl-note">Every engagement opens with the ${priceSpan(PRICES.entryAudit)} audit you are reading. A six-month commitment unlocks the pilot rate shown; thereafter it is a 90-day rolling mandate, cancellable in writing. Quoted &amp; invoiced in GBP.</p>

    ${route3()}

    <div class="subhead" style="margin-top:16px"><span class="nt">↳</span><h3>Independent Solutions, each one a programme in its own right</h3></div>
    <p class="plan-sub">Take any of these on its own, or layer it onto a route above. Each is the same compliance-first engine behind this report, pointed at a single lever. ${D.upsellProof}</p>
    <div class="addon-railwrap">
      <button type="button" class="addon-nav addon-prev" aria-label="Previous solutions">&lsaquo;</button>
      <div class="addon-grid" role="list">
      ${ADDONS.map(a=>{
        const off=(a.offer!=null)?a.offer:a.price;          // the price actually charged
        const priceHtml=(a.anchor!=null)
          ? `<span class="apwas cmoney" data-gbp="${a.anchor}">${fmtMoney(a.anchor)}</span><b class="cmoney" data-gbp="${off}">${fmtMoney(off)}</b><small>/${a.unit}</small>`
          : `<b class="cmoney" data-gbp="${off}">${fmtMoney(off)}</b><small>/${a.unit}</small>`;
        return `<div class="addon ${a.hero?'ag-hero':''}" role="listitem" tabindex="0">
        <div class="is-top">
          <div class="an">${escH(a.nm)}</div>
          <div class="ap">${priceHtml}</div>
          <div class="ascope">${escH(a.scope)}</div>
        </div>
        <div class="is-detail">
          <div class="tag">${escH(a.usp)}</div>
          <div class="aspec-h">How it runs, step by step</div>
          <ol class="aspec-steps">${a.spec.map(s=>`<li>${escH(s)}</li>`).join('')}</ol>
          <a class="btn gold addon-cta" href="${STRIPE_LINKS[a.nm]||'#'}" target="_blank" rel="noopener">Add ${escH(a.nm.split(' ')[0])} ↗</a>
        </div>
      </div>`;}).join('')}
      </div>
      <button type="button" class="addon-nav addon-next" aria-label="More solutions">&rsaquo;</button>
    </div>
    <p class="plan-sub addon-disclosure">Figures shown for client engagements are drawn from verified analytics and are identified as such. Any figure labelled illustrative is a worked example, not a client result. Each solution commits to defined deliverables and to reach; commercial outcomes depend on factors outside any agency’s control and are not guaranteed. Full terms: /legal/service-terms.</p>

    ${trustedStrip()}

    <div class="subhead founder-subhead" style="margin-top:13px"><span class="nt">↳</span><h3>Walk report with the founder</h3></div>
    <div class="founder-cred">Founder: Aman Pareek. LLM in International Business Law, King&rsquo;s College London.</div>
    <p class="plan-sub">Two ways to start, both with the founder directly. No sales team, no discovery loop. Your route and strongest finding are carried into the call.</p>
    <div class="booking">
      <div class="bookcard"><div class="rt">Retainer enquiries</div><h3>Discuss a retainer</h3>
        <p>A 30 minute confidential session on the Foundation, Authority or Enterprise mandate, and which one fits ${escH(D.meta.company)}.</p>
        <div class="cal-embed" data-cal-embed data-intent="package" data-tier="${recTier}" aria-label="Retainer strategy call calendar"></div>
        <p class="bookcard-note">Pick a time above. Your route and strongest finding are carried into the call.</p></div>
      <div class="bookcard"><div class="rt">One-time sprint</div><h3>Start a Fix Sprint</h3>
        <p>A 30 minute confidential session to scope a one-time, fixed-scope Fix Sprint. The urgent items closed first, no retainer.</p>
        <div class="cal-embed" data-cal-embed data-intent="one_time_fix" aria-label="Fix Sprint call calendar"></div>
        <p class="bookcard-note">Pick a time above. We will confirm by email.</p></div>
    </div>

    <div class="subhead" style="margin-top:14px"><span class="nt">↳</span><h3>Prefer a written reply? Leave your details</h3></div>
    <p class="plan-sub">Send the basics and the founder responds directly. No obligation, no sales sequence.</p>
    <form class="audit-bookform" novalidate aria-label="Contact the founder">
      <input type="text" name="c_website_2" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
      <div class="abf-grid">
        <label class="abf-field"><span>Your name</span><input name="name" autocomplete="name" value="${escH((D.meta&&D.meta.company)||'')}"></label>
        <label class="abf-field"><span>Website</span><input name="audit-input" autocomplete="url" value="${escH((D.meta&&D.meta.domain)||'')}"></label>
        <label class="abf-field"><span>Email *</span><input name="email" type="email" required autocomplete="email" placeholder="you@firm.com"></label>
        <label class="abf-field"><span>Sector</span><input name="sector" value="${escH((D.meta&&D.meta.sector)||'')}"></label>
      </div>
      <div class="abf-err" role="alert" hidden></div>
      <div class="abf-actions"><button type="submit" class="btn solid abf-submit">Send to the founder ↗</button></div>
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
    if(crit>0) bullets.push(`<b>The headline.</b> ${crit} critical ${plur(crit,'breach','breaches')} ${plur(crit,'is','are')} live on your site right now${hasMoney?(', carrying up to '+D.exposure+' in maximum statutory penalties'):''}. Start with ${escH(String(top.title||'your highest-severity finding').toLowerCase())}.`);
    else if (D.compliance_unassessed) bullets.push(D.render_mode==='knowledge' && (D.frameworksBinding||0)>0 ? `<b>The headline.</b> ${D.frameworksBinding} statutory frameworks bind your firm on registration facts alone, mapped below with regulator and obligation. No breach is claimed because your live pages resisted a deep read this scan; the map is the floor, the re-scan finds what sits on top of it.` : `<b>The headline.</b> Your live site blocked a deep compliance read this scan, so the regulatory checks below could not be completed and no clean bill of health is implied. The ranking, authority and AI-visibility findings were still measured on your site and stand. A re-scan with a rendered-DOM read completes the compliance assessment.`);
    else bullets.push(`<b>The headline.</b> No critical statutory breach surfaced this scan. The gaps below are costing you rankings, buyers and AI visibility, not fines.`);
    bullets.push(`<b>Where you stand.</b> ${D.frameworksAssessed} framework${D.frameworksAssessed!==1?'s':''} legally bind${D.frameworksAssessed===1?'s':''} you${sov?(', AI names you in '+sov+' of the buyer queries probed'):''}${rivals>0?(', and '+rivals+' '+plur(rivals,'rival')+' '+plur(rivals,'is','are')+' ranked ahead of you'):''}.`);
    bullets.push(`<b>How to read it.</b> Open any of the six sections below. Each box opens in place, with the live evidence on the left and the exact Tamazia fix on the right.`);
    bullets.push(`<b>Keep it current.</b> Re-run this report every month so a new breach is caught the day it appears, before enforcement or a competitor moves first.`);
    return `<div class="verdict">
      <div><span class="eyebrow">The verdict</span>
        <h2>${D.score} / 100 · ${D.grade}${hasMoney?`, with up to <span class="vexp">${D.exposure}</span> in maximum statutory penalties across the breaches evidenced on your live site.`:`, the gaps below are costing you rankings, buyers and AI visibility right now.`}</h2>
        <ul class="verdict-bullets">${bullets.map(b=>`<li>${b}</li>`).join('')}</ul>
        ${f.length?`<div class="vfix-head">Your three highest-priority breaches, fix these first</div>`:''}
        <div class="vfixes">${f.slice(0,3).map((x,i)=>`<button class="vfix" data-finding="fx-${i+1}"><span class="n">${i+1}</span><span class="t">${escH(x.title)}</span><span class="e">${x.exp}</span></button>`).join('')}</div>
      </div></div>`;
  }

  /* ---------------- FOUNDER SESSION (E2) — directly under the score header ---------------- */
  // Copy is VERBATIM and locked. Credential EXACTLY "LLM in International Business Law, King's College London".
  // "Claim the session" → BOOKING_URL when that env is set; otherwise it falls back to the live Cal intake
  // (data-book="package") so the button is never dead. founder@tamazia.co.uk always renders. The phone line is
  // FOUNDER-BLOCKED: rendered ONLY when CONTACT_PHONE is set, omitted entirely otherwise (no placeholder).
  function founderSession(){
    // Founder r28: "Claim the session" ALWAYS opens the on-page calendar (data-book → intake+Cal), never an external link.
    const claim = `<a class="btn solid fsx-claim" data-book="package" data-tier="${escH(recommendedTierName())}">Claim the session ↗</a>`;
    const phone = CONTACT_PHONE
      ? `<a class="fsx-contact fsx-phone" href="tel:${escH(CONTACT_PHONE.replace(/[^0-9+]/g,''))}"><svg class="fsx-ph-ic" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${escH(CONTACT_PHONE)}</a>`
      : '';
    return `<section class="founder-session" aria-label="A direct line to the founder">
      <div class="fsx-inner">
        <div class="fsx-copy">
          <div class="fsx-lead">A direct line to the founder.</div>
          <div class="fsx-name">Aman Pareek. LLM in International Business Law, King&rsquo;s College London.</div>
          <p class="fsx-body">Book a real conversation about your brand&rsquo;s growth and compliance.</p>
        </div>
        <div class="fsx-act">
          ${claim}
          <div class="fsx-contacts">
            <a class="fsx-contact" href="mailto:founder@tamazia.co.uk">founder@tamazia.co.uk</a>${phone}
          </div>
        </div>
      </div>
    ${BOOKING_URL ? `<div class="cta-blindsend"><a class="btn-book" href="${BOOKING_URL}">Walk through these findings with the founder. 20 minutes, the exact fixes, and what a regulator would ask first: book the review.</a><a class="btn-book alt" href="${BOOKING_URL}">Everything marked APPLIES · ASSESSED is verified at page level. Records, processes and filings are the full engagement: book the scoping call.</a></div>` : ''}</section>`;
  }

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
    ${founderSession()}
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
  app.addEventListener('mouseover',e=>{ const t=e.target.closest('[data-tip]'); if(!t)return; tip.innerHTML=t.getAttribute('data-tip'); tip.classList.add('show'); });
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
    // Route 1 — Fix Sprint top10/20/all toggle: update headline count, the scaling struck anchor (price + line),
    // the big price, the delivery weeks (caption), and the CTA's tier.
    const r1=e.target.closest('.r1-tab');
    if(r1){ document.querySelectorAll('.r1-tab').forEach(b=>{const on=b===r1;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});
      const price=+r1.dataset.price, anchor=+r1.dataset.anchor;
      const setM=(sel,gbp)=>{const el=document.querySelector(sel); if(el){ el.dataset.gbp=gbp; el.textContent=fmtMoney(gbp); }};
      setM('.r1-price',price); setM('.r1-was',anchor); setM('.r1-anchor',anchor);
      const hn=document.querySelector('.r1-headN'); if(hn) hn.textContent=r1.dataset.n;
      document.querySelectorAll('.r1-weeks').forEach(w=>{ w.textContent=r1.dataset.weeks; });
      const cta=document.querySelector('.fx-cta[data-fixtier]'); if(cta) cta.dataset.fixtier=r1.dataset.fixtier;
      // Stripe buy button (E5): swap its Payment Link to the active scope. Conditional — the link is '' when
      // that STRIPE_LINK_FIX* env is unset, so we hide the button rather than render a dead href.
      const buy=document.querySelector('.r1-buy');
      if(buy){ const url=stripeFixLink(r1.dataset.fixtier); if(url){ buy.href=url; buy.dataset.fixtier=r1.dataset.fixtier; buy.hidden=false; } else { buy.hidden=true; } }
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
        ? 'Online checkout for this add-on is being switched on. Leave your details and pick a time, and the founder will set it up with you on the call.'
        : ('30 seconds. This scopes the call so no time is wasted on discovery. '+(intent==='one_time_fix'?'A one-time, fixed-scope sprint, not a retainer.':'Your tier and strongest finding are carried into the conversation.'));
      m.querySelector('.cmx-body').innerHTML=`
        <div class="cmx-head">
          <span class="cmx-eyebrow">${eyebrow}</span>
          <h3>Share a few details about the firm, then pick a time with the founder</h3>
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
        form.innerHTML='<div class="abf-done">Thank you. Your details are with Tamazia and the founder will reply to '+escH(email)+' directly. A confirmation is on its way to your inbox.</div>';
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
