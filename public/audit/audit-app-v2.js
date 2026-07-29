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
    fixPacksLane: 'One fixed price. One fixed timeline. No mandate. You own the work outright.', // fixPacksLane
    // sccoGuidelineRates · Senior Courts Costs Office guideline hourly rates, London 1, in force 1 January 2026.
    // Source printed inline beside every figure derived from it. Replaces the invented consultancy anchors (E36).
    scco: {
      gradeA: 579, gradeC: 305, band: 'London 1', inForce: '1 January 2026',
      source: 'SCCO Guideline Hourly Rates, London 1, in force 1 January 2026',
      sourceUrl: 'https://www.gov.uk/guidance/solicitors-guideline-hourly-rates',
    },
    // FOUNDER DECISION Q4 (2026-07-29) · the £495 unlock framing is RETIRED. The middle offer is
    // Regulatory Watch at £1,500 a month with month one free: it unlocks the full audit, runs the
    // continuous law watch, re-runs the audit monthly, and DELIVERS the fix specification (the exact
    // page, rule and change). It does not implement: implementation is a Sprint or a mandate.
    // DMCCA Sch 20 / subscription rules: the renewal must be stated plainly on the card, and it is.
    // OPEN, FOUNDER-GATED (see PRICING-REQUIREMENTS.md Q4): pricing.ts still carries unlock:495 and a
    // LIVE £495 Payment Link. A "first month free, then £1,500/month" offer must NOT be wired to it,
    // so the pay CTA below routes to the subscription path, never to the one-time unlock link.
    exposureReport: { monthlyCover:1500, freeMonths:1 },
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
  // Q4 · the one-time unlock Payment Link is no longer reachable from the render. It is kept
  // in STRIPE only so a drift check against pricing.ts still has something to compare, and it
  // must NOT be wired to the monitoring CTA: it charges a one-time £495, while the offer on
  // the page is a monthly subscription with the first month free (DMCCA: the displayed price
  // must be the charged price). Founder action is logged in PRICING-REQUIREMENTS.md Q4.
  void STRIPE.unlock;

  const $ = (s,r=document)=>r.querySelector(s);
  // count-aware pluralization: plur(1,'finding')↗'finding', plur(2,'finding')↗'findings',
  // plur(1,'is','are')↗'is'. Used everywhere a live count precedes finding/critical/breach/run/dim/are.
  const plur = (n,s,p)=> n===1 ? s : (p||s+'s');
  // Escape DATA-sourced strings before innerHTML (evidence quotes/LLM text can carry a raw "<"
  // that would corrupt the DOM — the axe-rule-name regression). Display text only.
  // De-dash THEN HTML-escape every data-sourced display string: the founder's "no dashes anywhere" rule, applied
  // at the render chokepoint so any em/en dash baked into an engine payload (PSI fix, evidence quote, competitor
  // name) is neutralised to a comma. Regular hyphens (co-working, e-commerce) are left intact.
  // Legacy payloads embed marketing claims the spec bans as floating numbers (R5/N2): normalise
  // them at the same chokepoint that escapes. The screened-label system, not payload prose, is the
  // only place register counts may appear.
  // CONFUSION-LEDGER G5/G6/G7/G14/G17: the claim fix, the money/date/unit formats, the
  // engine-internals scrub and the UK-spelling normaliser all live in ONE function
  // (COPY.js -> window.TZTEXT.norm) so a format defect is fixed once, not at 200 call sites.
  const NORM = (window.TZTEXT && window.TZTEXT.norm) ? window.TZTEXT.norm : (v=>String(v==null?'':v));
  const escH = s=> NORM(s).replace(/\s*[—–]\s*/g,', ').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const TFIX = s => (window.TZTEXT && window.TZTEXT.termFix) ? window.TZTEXT.termFix(s) : s;

  /* ============================================================
     v2 TRUTH LAYER — every count, state and empty string resolves here.
     N3 (counts agree everywhere), N1 (never claim what was not measured)
     and spec item 11 (no "null"/"undefined"/"NaN" in rendered text) are
     enforced at this single chokepoint rather than at 40 call sites.
     ============================================================ */
  const C = (window.COPY) || {};
  const txt = v => { const s=String(v==null?'':v).trim(); return /^(null|undefined|NaN)$/i.test(s)?'':s; };
  const numOr = (v,f) => { const n=+v; return isFinite(n)?n:f; };
  const isNum = v => (v!==null && v!=='' && typeof v!=='boolean' && isFinite(+v));
  const NA = C.notAssessed || 'Not assessed on this scan.';
  const naLine = t => '<div class="na-line">'+escH(t||NA)+'</div>';
  const naChip = () => '<span class="na-chip">'+escH(C.notAssessedChip||'Not assessed')+'</span>';
  const isMoney = s => (window.CH && CH.isMoneyStr) ? CH.isMoneyStr(s) : /^[£$€]/.test(String(s||''));
  // a currency string with no non-zero digit carries no value claim (N2)
  const hasValue = s => isMoney(s) && /[1-9]/.test(String(s||''));
  /* R3 · the exposure badge. Money is a gradient chip; a measured non-money exposure
     ("ranking", "Unlimited (Vento bands ...)") is a muted chip carrying its own words;
     an absent exposure renders NOTHING rather than an invented phrase. */
  function expBadge(raw,cls){
    let full=txt(raw)==='ranking' ? 'ranking impact' : txt(raw);
    if(/^(applies to you|applies|binding|binds you|assessed)$/i.test(full)) full=C.regNoFine||full;
    if(!full) return '';
    if(isMoney(full)) return '<span class="'+cls+'">'+escH(full)+'</span>';
    const short=full.length>30 ? full.slice(0,29).replace(/\s+\S*$/,'')+'\u2026' : full;
    return '<span class="'+cls+' nonmoney" title="'+escH(full)+'">'+escH(short)+'</span>';
  }

  /* PAYLOAD CLASS. dental-old is the one pre-bridge capture and the one that carries
     psiStrats (D-live-evidence §2). On a LEGACY payload "None detected" is a measured
     absence and renders as such; on a v1.1 payload the tracker sniffer never ran, so the
     same string is a false negative and degrades to "Not assessed on this scan" (N1/B2).
     A bridge that sets D.payloadClass explicitly always wins over the heuristic. */
  const PCLASS = txt(D.payloadClass) || ((D.seo && D.seo.psiStrats) ? 'legacy' : 'v1.1');
  const ABSENCE = /^(none detected|not measured|not assessed|unknown|n\/a|not detected)$/i;
  function measured(v){
    const s=txt(v);
    if(!s) return '';
    if(!ABSENCE.test(s)) return s;
    if(PCLASS==='legacy' && /^none detected$/i.test(s)) return (C.noneFound||s);   // genuinely measured absence
    return '';
  }
  const techCell = v => { const m=measured(v); return m ? escH(m) : naChip(); };

  /* REGULATORY TRUTH (N3 / C §1 fix 3). The framework boxes already dedupe by subject,
     so the deduped set IS what the page renders; every headline count derives from it.
     The raw pointer count survives only as an explicit "N failing elements" sub-line. */
  const REG = (function(){
    const seen=new Set(), items=[]; const fwHit=new Set();
    for(const fw of (D.frameworks||[])){
      for(const g of ((fw&&fw.articleGroups)||[])){
        for(const it of ((g&&g.items)||[])){
          const k=String((it&&it.subject)||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
          if(!k || seen.has(k)) continue;
          seen.add(k); items.push({it:it, fw:fw, g:g}); fwHit.add(String(fw.code||fw.name||''));
        }
      }
    }
    const sev={crit:0,high:0,std:0};
    for(const r of items){
      const s=String((r.it&&r.it.sev)||'').toLowerCase();
      if(/^(p0|crit)/.test(s)) sev.crit++; else if(/^(p1|high)/.test(s)) sev.high++; else sev.std++;
    }
    const rules=items.length;
    const inst=numOr(D.countsRegulatory&&D.countsRegulatory.total, numOr(D.counts&&D.counts.total, rules));
    return { rules:rules, instances:Math.max(rules,inst), sev:sev, items:items, fwWithBreach:fwHit.size };
  })();

  /* ============================================================
     THE MEASUREMENT GATE (G8 · CONF-211, 247, 248, 251).
     A scan that assessed NO dimension measured nothing, so nothing on it may render as a
     number: not a score, not a grade, not "0 issues", not a trajectory. REPORT-SPEC L3 banned
     "0 ahead" from a dead probe; this is the same rule applied to every chip and the dial.
     Every REAL fixture keeps its score, because every real fixture assesses at least one
     dimension (the six live reports assess 8 or 10 of 10).
     ============================================================ */
  const SCORED = ((D.dims)||[]).some(d=> d && d.st && d.st!=='na');
  const SEO_ASSESSED = (((D.seo&&D.seo.onpage)||[]).length>0)
    || !!(D.seo&&D.seo.psiStrats) || !!(D.seo&&D.seo.psi&&isNum(D.seo.psi.performance))
    || (((D.seo&&D.seo.keywords)||[]).length>0);
  const GEO_ASSESSED = numOr(D.geo&&D.geo.issueCount,0)>0
    || (((D.geo&&D.geo.citations)||[]).length>0);

  /* COMPETITOR STATE (C1/C2). "0 ahead" from a dead probe is banned; the set is either
     assessed (real ladder + real rivals) or it is not assessed. */
  function competitorState(){
    const c=D.competitors||{};
    const rows=((c.rows)||[]).length, ladder=((c.ladder)||[]).length;
    return { assessed: !c.needsReview && ladder>0 && rows>1, ahead: Math.max(0,rows-1), rows:rows, ladder:ladder };
  }

  /* THE COUNT REGISTER. The rail chip and the pillar header chip read the SAME string,
     so N3 cannot break by editing one of them. Every count equals items rendered. */
  // G2 · ONE count vocabulary. "issue" and "gap" are banned as count nouns; a countable item on
  // this report is a FINDING, an evidenced failure is a BREACH, a catalogue duty is an
  // OBLIGATION, a catalogue law is a FRAMEWORK and a DOM instance is a FAILING ELEMENT.
  const COUNTS = (function(){
    const seoN=((D.seo&&D.seo.onpage)||[]).length;
    const geoN=numOr(D.geo&&D.geo.issueCount,0);
    const fwN=((D.frameworks)||[]).length;
    const cmp=competitorState();
    const na=C.notAssessedChip||'Not assessed';
    return {
      seo:{ n:seoN, assessed:SEO_ASSESSED, chip: SEO_ASSESSED ? (seoN+' '+plur(seoN,'finding')) : na },
      geo:{ n:geoN, assessed:GEO_ASSESSED, chip: GEO_ASSESSED ? (geoN+' '+plur(geoN,'finding')) : na },
      regulatory:{ n:fwN, chip:fwN+' '+plur(fwN,'framework') },
      competitors:{ n:cmp.ahead, assessed:cmp.assessed,
        chip: cmp.assessed ? (C.cmpAhead?C.cmpAhead(cmp.ahead):(cmp.ahead+' ahead')) : na },
    };
  })();

  /* T3 · the 3-slot ladder. The bridge builds it deduped; this is the RENDER-SIDE GUARD
     so a stale payload carrying three copies of one rule can still never show three
     identical cards (C §1 fault 1A). ruleKey = framework_short | fact.slice(0,60). */
  const normKey = s => String(s==null?'':s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  // the fact, normalised and capped at the spec's 60 characters
  function factKey(f){ return normKey(txt(f.fact)||txt(f.title)||txt(f.plain)).slice(0,60); }
  function fixRuleKey(f){
    if(txt(f.ruleKey)) return normKey(f.ruleKey);
    const fw=normKey(txt(f.framework_short)||txt(f.reg)||txt(f.law));
    return fw+'|'+factKey(f);
  }
  const LADDER = (function(){
    const seen=new Set(), out=[];
    for(const f of (D.fixes||[])){
      if(!f) continue;
      const k=factKey(f)||fixRuleKey(f);
      if(!k || seen.has(k)) continue;
      seen.add(k); out.push(f);
    }
    if(out.length<3){
      const have=new Set(out.map(factKey));
      for(const r of REG.items){
        if(out.length>=3) break;
        const subj=txt(r.it&&r.it.subject); if(!subj) continue;
        const k=factKey({ title:subj });
        if(!k || have.has(k)) continue;
        have.add(k);
        out.push({
          state:'breached',
          reg: txt(r.fw.code)||txt(r.fw.regulator),
          law: txt(r.fw.name),
          title: subj,
          plain: '',
          quote: txt(r.it.quote),
          fix: txt(r.it.fix),
          exp: txt(r.fw.exp),
          page: txt((r.g.inspected||[])[0]),
          sev: txt(r.it.sev),
        });
      }
    }
    return out;
  })();

  /* W4 · the three severity definitions become tooltips on the dots, not a page row. */
  const SEV_DEFS = (D.severityDefs && D.severityDefs.length) ? D.severityDefs : [];
  function sevDef(sev){
    const s=String(sev||'').toLowerCase();
    const want=/^(p0|crit)/.test(s)?'critical':(/^(p1|high)/.test(s)?'high':'standard');
    const hit=SEV_DEFS.filter(function(x){ return String(x.word||'').toLowerCase()===want; })[0];
    return hit ? (hit.word+': '+hit.def) : want.charAt(0).toUpperCase()+want.slice(1);
  }

  // C-G: the SINGLE source for "which retainer tier do we recommend this firm". The adapter flags the
  // recommended tier on D.pricing (rec:true). The rail CTA routes to THIS tier
  // (not a hardcoded Enterprise/Authority), so the call the buyer books matches the tier the report recommends.
  // Falls back to Enterprise only if no rec flag is present (matches planData()'s default).
  function recommendedTierName(){
    const rec=(Array.isArray(D.pricing)?D.pricing:[]).find(p=>p&&p.rec);
    const nm=rec&&rec.tier?String(rec.tier):'';
    return /^(foundation|authority|enterprise)$/i.test(nm) ? (nm.charAt(0).toUpperCase()+nm.slice(1).toLowerCase()) : 'Enterprise';
  }

  /* ---------------- LEFT RAIL · L1-L3, eight bands, one view ----------------
     The fit is bought with CONTENT CUTS, not type shrinking: the four @media
     shrink packs and all 25 clamp() font declarations are deleted from the CSS.
     ------------------------------------------------------------------------- */
  // G1 / CONF-001…006 · ONE section-name source (COPY.sections). The nav row, the pillar header
  // and the pane eyebrow now carry the identical string, so a click and the box it opens can
  // never read as two different places, and no future edit can drift one of the three arrays.
  const S = C.sections || {overview:'Overview',seo:'SEO & technical',geo:'AI & GEO',
    regulatory:'Regulatory exposure',competitors:'Competitors',plan:'Plan & pricing'};
  function railNav(){
    const n=[
      {id:'overview',    nm:S.overview,    dot:'r', c:''},
      {id:'seo',         nm:S.seo,         dot:'a', c:COUNTS.seo.chip},
      {id:'geo',         nm:S.geo,         dot:'r', c:COUNTS.geo.chip},
      {id:'regulatory',  nm:S.regulatory,  dot:'r', c:COUNTS.regulatory.chip},
      {id:'competitors', nm:S.competitors, dot:'a', c:COUNTS.competitors.chip},
      {id:'plan',        nm:S.plan,        dot:'g', c:''}
    ];
    // L2 item 7: the Competitors row disappears when the set was not assessed.
    return COUNTS.competitors.assessed ? n : n.filter(function(x){ return x.id!=='competitors'; });
  }
  // L2 item 3: REAL values only. An empty sector or city renders nothing, never an empty row.
  function railMetaLine(){
    const parts=[D.meta&&D.meta.sector, D.meta&&D.meta.city, D.meta&&D.meta.domain].map(txt).filter(Boolean);
    return parts.length ? '<div class="rail-meta">'+parts.map(escH).join(' · ')+'</div>' : '';
  }
  /* C §3: "N compliance rules screened" prints an obligations-evaluated count as a register
     size. Until the engine emits catalogueObligations we fall back to its own honest label. */
  // G2 / G3 · CONF-079 / 080 · the scoring inputs shipped "1 evidence checks" beside
  // "0 evidence checks passed", two counts of different things under one name, in adjacent
  // rows. The ambiguous segment is dropped; the card meta above states the one true figure.
  const MISLABELLED=/(compliance rules screened|rule checks (were )?executed|evidence checks passed)/i;
  function sanitiseInputs(s){
    return txt(s).split('·').map(x=>x.trim())
      .filter(x=>x && !MISLABELLED.test(x)).join(' · ');
  }
  function honestScreenedLabel(){
    const s=txt(D.screenedLabel);
    if(!s || /compliance rules screened/i.test(s) || /^full catalogue screened$/i.test(s)) return C.screenedFallback;
    return s;
  }
  function screenedCaption(){
    const bind=numOr(D.frameworksBinding, numOr(D.frameworksAssessed,0));
    const obl=numOr(D.catalogueObligations,0);
    const checked=numOr(D.rulesEvaluated,0);
    const parts=[obl>0 ? (obl.toLocaleString('en-GB')+' obligations screened') : honestScreenedLabel()];
    if(bind>0) parts.push(C.bindYou(bind));
    if(checked>0) parts.push(C.checkedOnPages(checked));
    return parts.join(' · ');
  }
  // L2 item 5: big figure + a <=6-word label; the no-FX sentence lives on the tooltip.
  // CONF-052 / 053 / 268 · the biggest number-shaped element on the page may not carry a
  // non-number ("Ranking & AI" under a label that says "cost"), and its label may not end in a
  // bare currency symbol. No money exposure ⇒ no money tile, and no currency tooltip either.
  function exposureTile(){
    const v=txt(D.exposureHeadline)||txt(D.exposure);
    if(!hasValue(v)) return '';
    const label=C.exposureLabel+', in '+String((D.cur||'£')).trim();
    // COPY.exposureTip is the single tooltip source; payload exposureBasis carries the legacy
    // banned sentence ("No exchange rate is applied") and never reaches the DOM (CONF/W3).
    return '<div class="rail-exposure"><div class="v">'+escH(v)+'</div>'
      +'<div class="l" title="'+escH(C.exposureTip)+'">'+escH(label)+'</div></div>';
  }
  const RAIL_SOCIAL='<span class="rail-social">'
    +'<a href="https://www.instagram.com/tamaziauk/" target="_blank" rel="noopener" aria-label="Tamazia on Instagram"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>'
    +'<a href="https://www.linkedin.com/in/amanpareekk/" target="_blank" rel="noopener" aria-label="Aman Pareek on LinkedIn"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.3-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21H9V9Z"/></svg></a>'
    +'<a href="mailto:contact@tamazia.co.uk" aria-label="Email contact@tamazia.co.uk"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></a></span>';
  function rail(){
    const nav=railNav();
    return `
    <aside class="rail"><div class="rail-inner">
      <div class="rail-brand"><a href="https://tamazia.co.uk" target="_blank" rel="noopener" aria-label="Tamazia, visit tamazia.co.uk"><img src="/tamazia-lockup-masthead-transparent.png" alt="Tamazia" class="rail-logo"></a></div>
      <div class="rail-ident"><h1>${escH(txt(D.meta&&D.meta.company))}</h1><span class="rail-ident-sub">${escH(C.reportName)}</span></div>
      ${railMetaLine()}
      <div class="rail-score">${CH.gauge(numOr(D.score,0),escH(txt(D.grade)),{size:96,dark:true,na:!SCORED})}${SCORED?`<div class="rail-screened">${escH(C.scoreScale)}</div>`:''}<div class="rail-screened">${escH(screenedCaption())}</div></div>
      ${exposureTile()}
      <div class="rail-prep">
        <div class="rp-line"><img class="rp-logo" src="/audit/kings-logo.png" alt="" onerror="this.remove()">${escH(C.preparedBy)}</div>
        <div class="rp-foot"><span class="rp-rules">${escH(C.rulesLine())}</span>${RAIL_SOCIAL}</div>
      </div>
      <nav class="railnav">${nav.map((n,i)=>`<button data-pane="${n.id}" class="${i===0?'active':''}"><span class="ni dot ${n.dot}"></span>${escH(n.nm)}<span class="nc">${escH(n.c)}</span></button>`).join('')}</nav>
      <button class="rail-cta" data-book="package" data-tier="${escH(recommendedTierName())}">${escH(C.ctaRail)}</button>
    </div></aside>`;
  }

  /* ---------------- PANES ---------------- */
  // Phase 3 de-triplication: the FULL finding detail lives ONCE in P.overview (ids fx-1..N).
  // Everywhere else that referenced a top-fix (regulatory "breaches in full", verdict chips)
  // becomes a clickable SUMMARY that opens the overview detail. fixSummary keys on the fix's
  // position in D.fixes so the id matches the overview card exactly.
  function fixSummary(f){
    const i=LADDER.indexOf(f);
    return `<button class="fix-summary" data-finding="fx-${i+1}">
      <span class="fs-tag">${escH(txt(f.reg)||txt(f.pillar))}</span><span class="fs-t">${escH(txt(f.title))}</span>
      <span class="fs-e">${escH(txt(f.exp))}</span><span class="fs-go">full finding ↑</span></button>`;
  }
  const P = {};

  // W4: the severity-definition strip is deleted; the definitions ride the severity dots.
  /* CONF-175 / 176 / 078 · the header may only call the cards "breaches" when EVERY card is a
     breach. A trio badged SEVERE / AT RISK / APPLIES TO YOU is a set of priority FINDINGS, and
     when the trio is a subset of the total the header says which subset it is showing.
     (T2 keeps the per-card kicker at "Priority breach NN" — that is REPORT-SPEC, not drift.) */
  function trioAllBreached(){
    const cards=LADDER.slice(0,3);
    return cards.length>0 && cards.every(function(f){ return CH.stateOf(f)===CH.SEV_STATE.breached; });
  }
  function trioHead(){
    const n=Math.min(3,LADDER.length);
    if(!n) return '<div class="subhead mt-0"><span class="nt">↳</span><h3>'+escH(C.trioNone)+'</h3></div>';
    const allB=trioAllBreached();
    const total=Math.max(REG.rules, LADDER.length);
    const h = (n<total) ? C.trioSubset(n,total,allB)
                        : (allB ? C.trioHeader(n) : C.trioHeaderMixed(n));
    return '<div class="subhead mt-0"><span class="nt">↳</span><h3>'+escH(h)+'</h3></div>';
  }
  function adjudicationCard(){
    const a=D.adjudication; if(!a||!isNum(a.reviewed)) return '';
    return '<div class="card pad mt-9"><div class="card-h"><div class="t">'+escH(C.ovAdjudication(numOr(a.reviewed,0)))+'</div></div>'
      +'<p class="jur-p">'+escH(txt(a.line))+'</p></div>';
  }
  // CONF-042 · "Critical" is already a severity word on this page; an F-band firm reading
  // "Critical" beside its grade reads it as a severity. The failing band is "Failing".
  const bandDesc = (b)=> String(b.g||'').toUpperCase()==='F'
    ? txt(b.d).replace(/\bcritical\b/i, C.bandCritical) : txt(b.d);
  P.overview = ()=>`
    ${restFindings()}
    ${heroCharts()}
    <div class="card pad mt-12"><div class="card-h"><div class="t">${escH(C.ovSeverity)}</div><div class="meta">${escH(C.ovConfirmed(numOr(D.confirmed,0)))}</div></div>${CH.donut()}</div>
    ${adjudicationCard()}
    <div class="card pad mt-9"><div class="card-h"><div class="t">${escH(C.ovJurisdiction)}</div></div><p class="jur-p">${escH(txt(D.jurisdiction))}</p></div>
    <div class="card pad mt-9">
      <div class="card-h"><div class="t t-quiet">${escH(SCORED?C.ovScoring(numOr(D.score,0)):C.ovScoringNA)}</div><div class="meta">${numOr(D.frameworksBinding,0)} binding ${plur(numOr(D.frameworksBinding,0),'framework','frameworks')} · ${escH(C.ovConfirmed(numOr(D.confirmed,0)))}</div></div>
      <div class="grid g-7-5" style="gap:20px">
        <div>${SCORED?`<p class="sc-formula">${escH(txt(D.scoring&&D.scoring.formula).replace(MISLABELLED,'catalogue screened'))}</p>
          <p class="sc-why">${escH(txt(D.scoring&&D.scoring.why).replace(MISLABELLED,'catalogue screened'))}</p>`:`<p class="sc-why">${escH(C.notScoredWhy)}</p>`}
          <div class="mono sc-inputs">${escH(sanitiseInputs(D.scoring&&D.scoring.inputs))}</div></div>
        <div class="scorebands">${((D.scoring&&D.scoring.bands)||[]).map(b=>`<div class="sb ${b.g===String(D.grade||'')[0]?'on':''}"><span class="sbg">${escH(txt(b.g))}</span><span class="sbr">${escH(txt(b.r))}</span><span class="sbd">${escH(bandDesc(b))}</span></div>`).join('')}</div>
      </div>
    </div>
    <div class="card pad mt-10"><div class="card-h"><div class="t">${escH(C.ovTrajectory)}</div><div class="meta">${escH(C.ovTrajectoryMeta)}</div></div>${SCORED?CH.trajectory(820,150):naLine(C.ovTrajectoryNA)}</div>`;

  // --- P.regulatory helpers: single-purpose builders (CodeScene: flat conditionals, small methods).
  // Output is identical to the previous inline build; only the structure changed.
  // CONF-050 · "confirmed" already counts evidence elsewhere; a register row is FOUND or not.
  // CONF-257 · a status chip states the status; it does not hand the reader a task.
  const regRowStatus = (r)=>{
    if (r.status==='confirmed') return {cls:'ok', st:C.regOnRegister};
    if (r.status==='not_found') return {cls:'miss', st:C.regNoMatch};
    if (r.status==='unavailable') return {cls:'na', st:C.regUnavailable};
    return {cls:'link', st:C.regVerify};
  };
  // CONF-258 · one tri-state, one tense, one structure.
  const regRowSite = (r)=>{
    if (r.on_site===true) return C.siteShown;
    if (r.on_site===false) return C.siteNotShown;
    return C.siteUnknown;
  };
  // E-233: OWN markup + OWN classes. Never reuse the framework grid (.fw/.fw-head) here - passing one
  // child into that 4-column grid dropped the content into the 46px column (one word per line).
  const regRowHtml = (r)=>{
    const {cls,st}=regRowStatus(r);
    const rec=r.record?(escH(String(r.record.name||''))+(r.record.number?(' &middot; '+escH(String(r.record.number))):'')+(r.record.detail?(' &middot; '+escH(String(r.record.detail))):'')):'';
    return `<div class="regrow ${cls}">
        <div class="regrow-top"><span class="reg-name">${escH(r.label)}</span><span class="reg-status ${cls}">${st}</span></div>
        ${rec?`<div class="reg-rec">${rec}</div>`:''}
        <div class="reg-line">${escH(r.statute_line)}</div>
        <div class="reg-foot"><span class="reg-site">${escH(regRowSite(r))}</span>${r.status==='unavailable'?'':`<a href="${escH(r.source_url)}" target="_blank" rel="noopener nofollow" class="reg-verify">${escH(C.verifyRegister)}</a>`}</div>
      </div>`;
  };
  // E-213 REGISTERED REALITY: the government-register cross-check rows; every line links to the
  // official source. Renders whenever the payload carries registers, independent of crawl success.
  const regRegistersBlock = ()=>{
    const regRows=(D.registers&&D.registers.rows)||[];
    if(!regRows.length) return '';
    return `
    <div class="subhead mt-0"><span class="nt">↳</span><h3>${escH(C.registersHead)}</h3></div>
    <p class="reg-sub">${escH(C.registersSub)}</p>
    <div class="reglist">${regRows.map(regRowHtml).join('')}</div>`;
  };
  // E-218: point-in-time banner for anything the verifier has not passed. Honest scope, zero fear
  // theatre, and the re-check is the conversion mechanic.
  // CONF-231 · three short sentences, not one 55-word chain. CONF-201 · the re-check names its price.
  const regPitBanner = ()=>{
    if (D.verified) return '';
    const when = (D.meta&&D.meta.date)?escH(D.meta.date):'';
    const sup = D.superseded?' It has since been superseded by a newer assessment.':'';
    const price = fmtMoney(PRICES.exposureReport.monthlyCover);
    const book = (D.links&&D.links.booking)
      ? (': <a href="'+escH(D.links.booking)+'" target="_blank" rel="noopener">'+escH(C.pointInTimeBook(price))+'</a>.')
      : '.';
    return `<div class="capt" style="margin:0 0 14px;padding:10px 14px;border:1px solid var(--line,#2a2a2a);border-radius:8px">${escH(C.pointInTime(when))}${sup} ${escH(C.pointInTime2)} ${escH(C.pointInTime3)}${book}</div>`;
  };
  const regKnowledgeMode = ()=> D.render_mode==='knowledge' && (D.frameworksBinding||0)>0;
  const regHeadlineUnassessed = ()=>{
    if (regKnowledgeMode()) {
      return 'Your live pages could not be deep-read on this scan, so no breach is asserted anywhere below. What follows instead is the statute map: the '+(D.frameworksBinding)+' frameworks that bind a '+((D.meta&&D.meta.sector)||'regulated')+' firm established in your jurisdiction. Every row is catalogue fact tied to your registration, not inference from your site. A rendered-DOM re-scan completes the breach assessment on top of it.';
    }
    return 'Compliance could not be assessed this scan. Your site blocked a deep read, so the checks below are incomplete and no pass is implied. A re-scan completes it.';
  };
  /* R1 · ONE sentence, built from the DEDUPED set the boxes below actually render. */
  // G3 / CONF-084 / 085 · the band says "27 frameworks bind you" and the lede used to say "26
  // further frameworks bind you" one line below it. One sentence now reconciles the two.
  const regLedeText = ()=>{
    if (D.compliance_unassessed) return regHeadlineUnassessed();
    const bind=numOr(D.frameworksBinding, numOr(D.frameworksAssessed,0));
    if(!REG.rules || !REG.fwWithBreach) return C.regLedeClean(bind);
    const breached=Math.min(REG.fwWithBreach, bind);
    return C.regLedeOfTotal(breached, bind, Math.max(0, bind-breached));
  };
  /* R1 · the value band. A cell renders only where a real figure exists (N2). */
  const regValueBand = ()=>{
    const cell=(k,v,l)=>'<div class="regval-cell '+k+'"><div class="regval-v">'+escH(v)+'</div><div class="regval-l">'+escH(l)+'</div></div>';
    const median=txt(D.exposureHeadline)||txt(D.exposure);
    const ceiling=txt(D.exposureCeiling);
    const bind=numOr(D.frameworksBinding, numOr(D.frameworksAssessed,0));
    const cells=[];
    if(hasValue(median)) cells.push(cell('median',median,C.regMedian));
    if(hasValue(ceiling)) cells.push(cell('ceiling',ceiling,C.regCeiling));
    cells.push(cell('bind',String(bind),C.regBinding(bind)));
    // G3 / CONF-081 · two money figures side by side need the sentence that reconciles them.
    // CONF-244 · a median needs a pointer to what it is a median of.
    const notes=[];
    if(hasValue(median) && hasValue(ceiling)) notes.push(C.regBandBridge(ceiling,median));
    if(hasValue(median)) notes.push(C.regMedianBasis);
    const note=notes.length?'<div class="regval-note capt">'+escH(notes.join(' '))+'</div>':'';
    return '<div class="regval">'+cells.join('')+'</div>'+note;
  };
  /* R2 · the waterfall moves out of Overview and sits under the value band, with the
     exposure bars beside it when there is an actual comparison to draw. */
  const regExposureExhibits = ()=>{
    const wf=CH.waterfall();
    const bars=CH.exposureBars();
    if(!wf && !bars) return '';
    const wfCard=wf ? '<div class="card pad"><div class="card-h"><div class="t">'
      +escH(hasValue(txt(D.exposure))?C.ovExposure(txt(D.exposure)):C.ovExposureNone)
      +'</div><div class="meta">not just a sum of ceilings</div></div>'+wf+'</div>' : '';
    const barCard=bars ? '<div class="card pad"><div class="card-h"><div class="t">Exposure by framework</div><div class="meta">'+escH(C.regCeiling)+'</div></div>'+bars+'</div>' : '';
    return '<div class="grid '+(wfCard&&barCard?'g2':'')+'" style="margin-bottom:12px">'+wfCard+barCard+'</div>';
  };
  const sevDotCls = (sev)=>{
    if (sev==='P0') return 'c';
    if (sev==='P1') return 'h';
    return 's';
  };
  /* R4 · every breach row reads error, then where, then fine. The quote is sanitised
     (T5): raw DOM fragments and entities never reach the page. */
  const regBreachItem = (it, locked, ctx)=>{
    ctx=ctx||{};
    // CONF-240 · severeCard already floors evidence at 3 alphanumerics; a one-character residue
    // ("X") is not proof, so the same floor applies here.
    const q0=CH.sanitiseQuote(it.quote,190);
    const q=q0.replace(/[^a-z0-9]/gi,'').length>=3 ? q0 : '';
    const pages=((ctx.inspected)||[]).map(txt).filter(Boolean);
    const where=pages.length?'<span class="art-where"><b>'+escH(C.whereLabel)+'</b> '+escH(pages.slice(0,3).join(', '))+'</span>':'';
    const fine=expBadge(ctx.exp,'art-fine');
    const meta=(where||fine)?('<div class="art-meta">'+where+fine+'</div>'):'';
    return `<div class="art-item"><div class="art-subj"><span class="art-dot ${sevDotCls(it.sev)}" title="${escH(sevDef(it.sev))}"></span>${escH(txt(it.subject))}</div>${q?`<div class="art-quote">&ldquo;${escH(q)}&rdquo;</div>`:''}${(!q&&txt(it.absence))?`<div class="art-absence">${escH(txt(it.absence))}</div>`:''}${meta}<div class="art-fix"><b>${escH(C.tamaziaFix)}</b>${CH.lockFix(escH(txt(it.fix)), locked)}</div></div>`;
  };
  const regBreachList = (fw)=>{
    const groups=fw.articleGroups||[];
    if(!groups.length) return '';
    const all=groups.reduce((s,g)=>s+((g.items||[]).length),0);
    const half=Math.ceil(all/2);
    let k=0;
    return `<div class="lbl">${escH(C.breachesHead)}</div>
        <div class="artlist">${groups.map(gp=>`<div class="artgroup"><div class="art-head"><span class="art-a">${escH(txt(gp.article))}</span>${(gp.inspected||[]).length?`<span class="art-insp">inspected ${gp.inspected.map(txt).filter(Boolean).map(escH).join(', ')}</span>`:''}</div>
          <div class="art-items">${(gp.items||[]).map(it=>regBreachItem(it,(k++)>=half,{inspected:gp.inspected,exp:fw.exp})).join('')}</div>
        </div>`).join('')}</div>`;
  };
  const regFwAssessed = (fw)=>{
    if(!fw.screened) return '';
    // CONF-047 · the title used to render a raw URL where the visible text said "1 page inspected".
    const pages=(fw.inspected_pages&&fw.inspected_pages.length)?`<span class="inspected">${fw.inspected_pages.length} ${plur(fw.inspected_pages.length,'page','pages')} inspected</span>`:'';
    // CONF-034 · "APPLIES · ASSESSED" is internal shorthand; the verb is "binds you".
    return `<div class="fw-assessed"><span class="abadge">${escH(C.bindsYouBadge)}</span>${pages}</div>`;
  };
  const regFwSummary = (fw)=>{
    const badges=`<span class="jbadge">${escH(fw.jur||'Global')}</span>${fw.binding_label?' <span class="jbadge bbadge">'+escH(fw.binding_label)+'</span>':''}`;
    // CONF-039 · one data type in this slot: a count. A framework screened and clean is "0 breaches".
    const nb=fw.screened?0:numOr(fw.findings,0);
    const status=nb+' '+plur(nb,'breach','breaches');
    const cnt=`${fw.c?`<span class="c">${fw.c} crit</span>`:''}${fw.h?`<span class="h">${fw.h} high</span>`:''}${fw.s?`<span class="s">${fw.s} std</span>`:''}`;
    // R3 · the fine is a right-aligned money badge, not a cell in a four-column grid.
    const expRaw=txt(fw.exp);
    let badge=expBadge(expRaw,'fw-money');
    if(badge && isMoney(expRaw)) badge=badge.replace('class="fw-money"',
      'class="fw-money" style="background:linear-gradient(135deg,'+CH.badgeColor(fw.code)+',var(--ox-deep))"');
    return `<div class="fw-head"><span class="code">${escH(txt(fw.code))}</span>
          <div class="fwn-wrap"><div class="fwn">${escH(txt(fw.name))} ${badges}</div>${regFwAssessed(fw)}<div class="fwr">${escH(txt(fw.regulator))} · ${status}</div></div>
          <div class="cnt">${cnt}</div>
          ${badge}</div>`;
  };
  /* CONF-227 · the per-card "This framework legally binds you…" sentence is stated ONCE above the
     list, not appended to roughly twenty cards. Stripped here if the payload still carries it. */
  const stripPreamble = (s)=> txt(s).replace(/\s*This framework legally binds you[^.]*\./i,'').trim();
  /* G11 / CONF-167 · a label that promises a reason must be followed by a reason. When the body
     is a duty it says so; when it is a question the regulator would ask, it says that instead. */
  const whyLabel = (why)=> /\?\s*$/.test(String(why||'').trim()) ? C.fwQuestionLabel : C.fwRequiresLabel;
  const regFwBody = (fw)=>{
    const why=stripPreamble(fw.why);
    return `<div class="fwbody">
        ${why?`<div class="lbl">${escH(whyLabel(why))}</div>${escH(why)}`:''}
        ${(fw.obligations||[]).length?`<div class="lbl">${escH(C.fwAssessedLabel)}</div><div class="capt fw-by">${escH(C.fwAssessedBy)}: ${escH(fw.regulator)}</div><ul class="obl">${fw.obligations.map(o=>`<li>${escH(o)}</li>`).join('')}</ul>`:''}
        ${(fw.reg_focus && txt(fw.reg_focus)!==why)?`<div class="lbl">${escH(C.fwFocusLabel)}</div><div class="action">${escH(fw.reg_focus)}</div>`:''}
        ${(fw.action&&fw.enforcement_url)?`<div class="lbl">${escH(C.fwEnforcement)}</div><div class="action">${escH(fw.action)} <a href="${escH(fw.enforcement_url)}" target="_blank" rel="noopener nofollow" class="lawcite">${escH(C.sourceLink)}</a></div>`:''}
        ${fw.guidance?`<div class="lbl">${escH(C.fwGuidance)}</div><div class="action">${escH(fw.guidance)}</div>`:''}
        ${fw.citation_url?`<div class="lbl">${escH(C.fwLawLabel)}</div><div class="action"><a href="${escH(fw.citation_url)}" target="_blank" rel="noopener nofollow" class="lawcite">${escH(C.fwLawLink)}</a></div>`:''}
        ${regBreachList(fw)}
      </div>`;
  };
  const regFwCard = (fw,i)=>{
    const tot=Math.max(1,fw.findings), cp=fw.c/tot*100, hp=fw.h/tot*100, sp=Math.max(0,100-cp-hp);
    return `<details class="fw" data-code="${escH(fw.code)}" data-jur="${fw.jur||'Global'}" ${i===0?'open':''}>
      <summary>
        ${regFwSummary(fw)}
        <div class="fwbar"><div class="fwbar-track">${cp?`<span style="width:${cp}%;background:var(--red)"></span>`:''}${hp?`<span style="width:${hp}%;background:var(--amber)"></span>`:''}${sp?`<span style="width:${sp}%;background:var(--gold-light)"></span>`:''}</div></div>
      </summary>
      ${regFwBody(fw)}</details>`;
  };
  P.regulatory = ()=>{
    const jurFilter=(D.jurisdictions||[]).length>1?`<div class="jur-select"><span class="jur-lbl">Filter by jurisdiction</span><button class="jur-chip active" data-jurf="all">All</button>${D.jurisdictions.map(j=>`<button class="jur-chip" data-jurf="${escH(j)}">${escH(j)}</button>`).join('')}</div>`:'';
    const fws=(D.frameworks||[]);
    return `
    ${regPitBanner()}
    ${regRegistersBlock()}
    <div class="pane-head"><span class="eyebrow">${escH(C.regEyebrow)}</span>
      ${regValueBand()}
      <h2>${escH(regLedeText())}</h2></div>
    ${regExposureExhibits()}
    <div class="subhead mt-0"><span class="nt">↳</span><h3>${escH(C.fwListHead(fws.length))}</h3></div>
    <p class="capt fw-preamble">${escH(C.fwBindingPreamble)}</p>
    ${jurFilter}
    ${fws.map(regFwCard).join('')}`;
  };

  P.seo = ()=>{
    const ks=(D.seo&&D.seo.keywordSummary)||{};
    const rows=CH.usableKeywords();
    const totalTracked=numOr(ks.totalTracked,0), onPageOne=numOr(ks.onPageOne,0);
    const psiAvail=!!(D.seo&&D.seo.psiStrats);
    // G9 / CONF-047 · the heading degrades with the body, and "page one" (a rank) never collides
    // with "Page" (a URL).
    const seoHeadline = !SEO_ASSESSED ? C.seoHeadNA
      : (rows.length ? C.seoHeadline(Math.max(0,totalTracked-onPageOne), totalTracked)
                     : C.seoHeadlineTech);
    return `
    <div class="pane-head"><span class="eyebrow">${escH(C.seoEyebrow)}</span>
      <h2>${escH(seoHeadline)}</h2>
      ${SEO_ASSESSED?`<p>${escH(C.seoLede)}</p>`:''}</div>
    <div class="subhead mt-0"><span class="nt">↳</span><h3>${escH(C.seoSub)}</h3></div>
    <div class="grid g2">
      <div class="card pad"><div class="card-h"><div class="t">${escH(C.onpageHead)}</div><div class="meta">${escH(COUNTS.seo.chip)}</div></div>${COUNTS.seo.n?CH.issueList(D.seo.onpage,'issue'):naLine()}</div>
      <div class="col-stack">
        <div class="card pad"><div class="card-h"><div class="t">${escH(C.techHead)}</div></div>
          <div class="facts"><div class="fact"><span class="k">SSL</span><span class="v">${techCell(D.seo.tech.ssl)}</span></div>
          <div class="fact"><span class="k">Mobile-ready</span><span class="v">${D.seo.tech.mobile==null?naChip():(D.seo.tech.mobile?'Yes':'No')}</span></div>
          <div class="fact"><span class="k">Trackers</span><span class="v">${techCell(D.seo.tech.trackers)}</span></div>
          <div class="fact"><span class="k">Ad pixels</span><span class="v">${techCell(D.seo.tech.adPixels)}</span></div>
          <div class="fact"><span class="k">Page weight</span><span class="v">${techCell(D.seo.tech.pageWeight)}</span></div>
          <div class="fact"><span class="k">Render</span><span class="v">${techCell(D.seo.tech.render)}</span></div></div>
        </div>
        <div class="card pad"><div class="card-h"><div class="t">${escH(C.securityHead)}</div><div class="meta">${escH(C.securitySub)}</div></div>${CH.securityGrid()}</div>
      </div>
    </div>
    ${psiBlock()}
    <div class="subhead"><span class="nt">↳</span><h3>${escH(rows.length?C.keywordsHead:C.keywordsHeadNA)}</h3></div>
    <div class="card pad">
      ${(D.seo.keywordsThin&&rows.length)?`<div class="urgent" style="margin-bottom:13px;background:linear-gradient(100deg,var(--cream-2),#fff);border-left-color:var(--gold)"><span class="upulse" style="background:var(--gold);animation:none"></span><div><div class="ut">${escH(C.nearMeTitle)}</div><div class="us">${escH(C.nearMeBody)}</div></div></div>`:''}
      ${CH.keywordTable()}</div>`;
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
  // CONF-070 / 156 / 245 · "Repeatability" is an abstract noun with no definition anywhere.
  // The sentence carries the sample size on its face instead.
  const repeatLine=(function(){
    const raw=txt(D.geo.repeatability);
    const m=raw.match(/named\s+(\d+)\s+of\s+(\d+)/i);
    return m ? C.repeatLine(+m[1],+m[2]) : raw;
  })();
  return `
    <div class="pane-head"><span class="eyebrow">${escH(C.geoEyebrow)}</span>
      <h2>${D.geo.aiKnows ? 'Are AI assistants recommending '+escH(D.meta.company)+'? You are cited, but rivals are still named alongside you on the core queries your buyers ask.' : (D.geo.citations.length>0 ? 'Are AI assistants recommending '+escH(D.meta.company)+'? Right now, no. On the core queries your buyers ask, the engines name a competitor instead.' : 'Are AI assistants recommending '+escH(D.meta.company)+'? Right now, no. The answer engines do not name you for the core queries your buyers ask yet.')}</h2>
      <p>${D.geo.rootCause?escH(D.geo.rootCause.reason):'The answer engines decide who to name from structured signals you are missing.'}</p>
      <p>${escH(aiOverview)}</p>
      <p class="capt geo-prov">${escH(C.geoProvenance(!!D.geo.engineEstimate))}</p></div>
    ${aiCallout}
    <div class="grid g-4-8" style="margin-top:10px">
      <div class="card pad geo-radar-card"><div class="card-h"><div class="t">${escH(C.aiVisHead)}</div><div class="meta">${escH(C.aiVisMeta)}</div></div>${CH.radar(radarAxes,210)}</div>
      <div class="col-stack-lg">
        <div class="card pad"><div class="card-h"><div class="t">${escH(D.geo.engineEstimate?C.geoCiteQModelled:C.geoCiteQ)}</div><div class="meta">${D.geo.engineEstimate?`<span class="est-tag" title="${escH(C.modelledTip)}">${escH(C.modelled)}</span>`:'real probe'}</div></div>${CH.engineGrid()}</div>
        <div class="geo-3">
          <div class="card pad" style="flex:1;text-align:center">${CH.stat(D.geo.entityReadiness,C.entityStat,{na:!GEO_ASSESSED})}</div>
          <div class="card pad" style="flex:1;text-align:center">${CH.stat(D.geo.shareOfVoice,C.sovStat,{red:true,na:!GEO_ASSESSED})}</div>
          <div class="card pad wide"><div class="capt" style="margin:0">${escH(GEO_ASSESSED?repeatLine:C.notAssessed)}</div></div>
        </div>
      </div>
    </div>
    <div class="grid g2" style="margin-top:10px">
      <div class="card pad"><div class="card-h"><div class="t">${escH(C.schemaHead)}</div><div class="meta">${escH(C.schemaMeta)}</div></div>${CH.schemaChecklist()}</div>
      <div class="card pad"><div class="card-h"><div class="t">${escH(C.sourceHead)}</div><div class="meta">${escH(C.sourceMeta)}</div></div>${CH.sourceGap()}</div>
    </div>
    <div class="subhead"><span class="nt">↳</span><h3>${escH(((D.geo.citations||[]).length)?C.geoCiteHead:C.geoCiteHeadNA)}</h3></div>
    <div class="card pad">${CH.citationTable()}</div>
    <div class="subhead"><span class="nt">↳</span><h3>${escH(C.geoFixHead)}</h3></div>
    ${CH.finding(D.geo.fix,true,{locked:false})}
    ${glossaryBlock()}`;
  };

  /* G16 / CONF-130, 155, 259…267 · ONE glossary. The base set in COPY is the superset (one
     definition per term, UK GDPR corrected, da/pa deleted); a payload term the base does not
     hold is merged in with its key title-cased. Open by default so a first read can reach it. */
  function glossaryBlock(){
    const base=Object.assign({}, C.glossaryBase||{});
    const keyed={}; Object.keys(base).forEach(k=>{ keyed[k.toLowerCase()]=k; });
    Object.entries(D.glossary||{}).forEach(([k,v])=>{
      const lk=String(k).toLowerCase();
      if(keyed[lk]) return;                                    // one definition per term, ours wins
      const title=String(k).replace(/^[a-z]/,c=>c.toUpperCase());
      base[title]=v;
    });
    const rows=Object.entries(base).sort((a,b)=>a[0].localeCompare(b[0]));
    return `<details class="gloss-mini" open><summary>${escH(C.glossaryHead(rows.length))}</summary>
      <div class="glossgrid">${rows.map(([k,v])=>`<div class="glossitem"><b>${escH(k)}</b><span>${escH(v)}</span></div>`).join('')}</div></details>`;
  }

  P.competitors = ()=>{
    const st=competitorState();
    // C2 · not assessed renders one honest line: no apology, no empty charts, no zero bars.
    // G9 / CONF-164 · the eyebrow may not assert that rivals are winning when nothing was checked.
    if(!st.assessed) return `
    <div class="pane-head"><span class="eyebrow">${escH(C.cmpEyebrowNA)}</span>
      <h2>${escH(C.cmpNA)}</h2></div>`;
    return `
    <div class="pane-head"><span class="eyebrow">${escH(C.cmpEyebrow)}</span>
      <h2>You versus the firms AI and Google name first for “${escH(txt(D.competitors.bestKeyword))}”.</h2>
      <p>${escH(C.cmpLede)}</p></div>
    <div class="card pad" style="margin-bottom:14px"><div class="card-h"><div class="t">${escH(C.cmpHead)}</div><div class="meta">real peers · your row highlighted</div></div>${CH.competitorTable()}</div>
    <div class="subhead"><span class="nt">↳</span><h3>${escH(C.cmpBeatHead)}</h3></div>
    <div class="card pad" style="margin-bottom:14px">${(D.competitors.ladder||[]).map((c,i)=>`<div class="beatcard">
      <div class="bc-rank">${i+1}</div>
      <div class="bc-body">
        <div class="bc-top"><span class="bc-rival">${escH(txt(c.name))}</span><span class="bc-sig">${escH(txt(c.signal))}</span></div>
        <div class="bc-move"><span class="bc-k">${escH(C.cmpBeatLabel)}</span> <b>${escH(txt(c.beatBy&&c.beatBy.fix))}</b></div>
        <div class="bc-proof"><span class="bc-arrow" aria-hidden="true">›</span> ${escH(txt(c.beatBy&&c.beatBy.proof))}</div>
        <div class="bc-foot"><span class="bc-metric">▸ ${escH(txt(c.beatBy&&c.beatBy.metric))}</span> ${(c.beatBy&&txt(c.beatBy.lever))?`<span class="bc-lever"><span class="bc-lk">${escH(C.cmpLever)}</span> ${escH(txt(c.beatBy.lever))}</span>`:''}</div>
      </div></div>`).join('')}</div>
    <div class="grid g2">
      ${D.competitors.sovBar
        ? `<div class="card pad"><div class="card-h"><div class="t">${escH(C.sovHead)}</div><div class="meta">${escH(C.sovMeta(numOr(D.competitors.sovBar.of,0)))}</div></div>${CH.bars(D.competitors.sovBar.rows,{max:numOr(D.competitors.sovBar.of,1),fmt:v=>v+' of '+numOr(D.competitors.sovBar.of,0)})}</div>`
        : ''}
      <div class="card pad"><div class="card-h"><div class="t">${escH(C.drHead)}</div><div class="meta">${escH(C.drMeta)}</div></div>${CH.bars(D.competitors.drBars,{max:100,drHidden:D.competitors.drHidden,zeroNA:true})}</div>
    </div>`;
  };

  P.plan = ()=> planAndPricing();

  /* TRUSTED-BY marquee removed (founder request 2026-07-20): the strip rendered placeholder/
     invented wordmarks and a real "adidas" mark under a "Trusted by regulated firms…" label —
     false client claims on a client-facing report. No client names are asserted anywhere now;
     credibility rests on the founder credential + the adjudication line, which are real. The
     .trusted-by / .tb-* CSS and the /audit/trusted-logos assets are no longer referenced. */

  // E12/E40 · severity language, defined inline at first use. "P0" was internal engineering vocabulary,
  // and every finding was being called "critical" regardless of its actual severity. The three words are
  // now defined once, here, and every severity dot carries the matching definition as a hover tip.
  /* T3 · the trio consumes the DEDUPED ladder. Two cards can never carry one ruleKey.
     Anything past slot 3 continues as the existing collapsed .finding rows; the freemium
     half-lock counts from the same list so the lock arithmetic stays consistent. */
  const lockOf = i => i>=Math.ceil(LADDER.length/2);
  function severeTrio(){
    const n=Math.min(3,LADDER.length);
    if(!n) return naLine(C.trioNone);
    const sev=LADDER.slice(0,3).map((f,i)=>CH.severeCard(f,i,{id:'fx-'+(i+1),locked:lockOf(i)})).join('');
    // the grid tracks the real card count so one card never sits in a three-column hole
    return '<div class="sev3" data-n="'+n+'">'+sev+'</div>';
  }
  // everything past slot 3 keeps the existing collapsed .finding rows, inside Overview
  function restFindings(){
    return LADDER.slice(3).map((f,j)=>CH.finding(f,false,{id:'fx-'+(j+4),locked:lockOf(j+3)})).join('');
  }
  // the block the main column mounts directly under the verdict
  function trioBlock(){ return trioHead()+severeTrio(); }


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
        'The strategy that removes dependency on booking platforms charging 15% to 25% commission on each reservation',
      ],
      more:[
        'Online personal branding grown alongside your rankings',
        'Two jurisdictions reviewed on every piece of content simultaneously',
        'Four compliance-reviewed content pieces monthly',
        'Editorial placements in sector-relevant publications',
        'Up to three locations fully managed on Google Business Profile',
        'Regulatory monitoring across both jurisdictions',
        'Twice-monthly reporting with revenue attribution across all locations',
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
        'Dedicated regulatory monitoring',
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
      "Direct search visibility that intercepts buyers before Booking.com or Expedia take their 15% to 25% commission.",
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
      "A Google Analytics 4 (GA4) report showing which searches converted to bookings, appointments or enquiries, attributed to organic search at channel level.",
      "Your market's legal framework applied to every piece, with notification within one week of any change requiring an update.",
    ],
    authority: [
      "Managed audience development for your principals across the platforms enterprise buyers check before any conversation.",
      "UK and UAE, UK and USA, or UAE and USA: one agency holding both regulatory environments, not two who never speak.",
      "Practice areas, property types, service lines and procedures covered in one monthly programme.",
      "Two media outreach contacts a month to sector-relevant publications; placement earned on editorial merit, not guaranteed.",
      "Each location profiled separately with its own category strategy, posting schedule and review management.",
      "Every new ruling in your sectors flagged, with the exact page and rule affected.",
      "Twice-monthly reporting tying organic search to revenue across every location.",
    ],
    enterprise: [
      "A full personal-brand programme for your senior team across every platform buyers and partners evaluate.",
      "International language and country tags (hreflang), geo-targeted content and market-specific keyword strategies across up to five territories.",
      "Volume calibrated to your full operational scope, every piece reviewed across all covered jurisdictions.",
      "No location cap: hotel groups across countries, firms across cities, each with its own local strategy.",
      "Monitoring, suppression and response architecture in place before any incident, structural protection not reactive PR.",
      "Law changes tracked across every country you operate in, with content updated within one week.",
      "Google Analytics 4 at transaction level, a monthly senior strategy call, and a board-ready executive review.",
    ],
  };
  /* CONF-184 · "See all inclusions" revealed `more[]` only, so `feats[3]` — the fourth headline
     feature of EVERY tier — was rendered nowhere on the page and the control's label was false.
     The reveal now opens with the features the collapsed card could not fit, then the rest. */
  function tierMore(t){
    const out=[];
    (t.feats||[]).slice(3).forEach((f,i)=> out.push({t:f, tip:(TIER_TIPS[t.key]||[])[i+3]||''}));
    (t.more||[]).forEach((f,i)=> out.push({t:f, tip:(MORE_TIPS[t.key]||[])[i]||''}));
    return out;
  }
  function planData(){
    const Dp=Array.isArray(D.pricing)?D.pricing:[];
    const byName=n=>Dp.find(p=>String(p.tier||'').toLowerCase()===n)||{};
    const TIERS=PRICING_TIERS_RENDER.map(t=>{const d=byName(t.key);return Object.assign({ rec:!!d.rec, popular:!!d.popular },t);});
    // P1 · EXACTLY ONE emphasis flag across the card set, and 'rec' wins over 'popular'
    // (the payload carries both today, which lit two ribbons on one row).
    if(!TIERS.some(t=>t.rec)) TIERS[2].rec=true;
    TIERS.forEach(t=>{ t.popular=false; });
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
      scope:'The site buyers trust and act on, rebuilt compliant, fast and conversion-led.',
      usp:'SEO and GEO deliver the buyer; a site that does not convert spends them. Your website is also your largest regulated publication, live to your regulator every day.',
      excl:'A build, not a mandate. Rankings, AI visibility and content live in the mandates.',
      spec:['Audit of the current site against speed, conversion and compliance','Information architecture and page plan mapped to buyer intent','Colour, type and copy crafted end to end; each word keyword-optimised','Design and build on a Core-Web-Vitals-clean foundation','Optimised for the AI engines: schema, entity and llms.txt built in','Every page legally reviewed before launch; CTAs tested before ship','Handover with the work owned outright once paid']},
    {key:'aiAuthority', nm:'AI Authority', anchor:I.aiAuthority.anchor, offer:I.aiAuthority.offer, unit:'a month', hero:true,
      scope:'Be the named answer across the AI engines. Month one builds the machine-readable identity.',
      usp:'Ask ChatGPT tonight who leads your field. That answer is already reaching your next client, and the names cited early compound.',
      excl:'Included in Authority and Enterprise mandates; buy standalone only when no mandate runs.',
      spec:['Entity, schema, llms.txt and Wikidata build in month one','Google Knowledge Panel and sameAs across every verified profile','Answer-surface content targeting real buyer prompts, monthly','Compliance review of what the AI engines say about you','Per-engine position and share-of-voice reporting against named rivals (a report, not a guaranteed placement)']},
    {key:'onlinePersonalBranding', nm:'Online Personal Branding', anchor:I.onlinePersonalBranding.anchor, offer:I.onlinePersonalBranding.offer, unit:'a month',
      scope:'You and your senior team made the named experts buyers find first. LinkedIn programme included.',
      usp:'Buyers shortlist the partner before the firm. Whatever surfaces when they search your name is the pitch that happens without you.',
      excl:'Individual authority only; firm rankings and AI visibility live in the mandates.',
      spec:['Voice and positioning captured for each principal','A full LinkedIn profile rebuild against our published checklist, refreshed monthly','Ghostwritten, SEO-optimised posts on a schedule, each legally reviewed before publication','All profiles optimised and synced to the persona','Google snippet and priority-box targeting for your name','Reach and engagement reported monthly']},
    {key:'instagramPresence', nm:'Instagram Presence', anchor:I.instagramPresence.anchor, offer:I.instagramPresence.offer, unit:'a month',
      scope:'The social proof buyers check before your website, held to your sector’s advertising code.',
      usp:'Before a patient books or a buyer enquires, they look. An inactive profile quietly prices you down before a word is exchanged.',
      excl:'Built for healthcare, aesthetics, hospitality and property. For law firms, Online Personal Branding is the instrument.',
      spec:['Content plan aligned to the brand and sector','Posts and stories produced on a schedule','Profile optimisation and sector-aligned audience engagement by a specialist growth team, never bought followers','Every post checked against '+gbpAdRule+' before publication','Reach and engagement reported monthly (no follower guarantee)']},
    {key:'ymylContent', nm:'YMYL (Your Money or Your Life) content', anchor:I.ymylContent.anchor, offer:I.ymylContent.offer, unit:'per piece',
      scope:'Health, legal and money grade content, per compliance-reviewed piece.',
      usp:'Google holds Your-Money-or-Your-Life content to its highest standard; your regulator holds it higher. A piece that fails legal review costs you twice.',
      excl:'Per piece, on demand; monthly content programmes live inside the mandates.',
      spec:['1,500 or more words per piece, scoped to the query, never padded','Structured for search and AI citation','Vetted against your sector’s legal register before publication','Published on your website plus two blog properties','Brand and reputation angle built into every brief']},
    {key:'gbpDomination', nm:'Google Business Profile Domination', anchor:I.gbpDomination.anchor, offer:I.gbpDomination.offer, unit:'a month',
      scope:'Google Business Profile dominance for up to three locations, every element compliance-checked.',
      usp:'For clinics, hotels and local firms, the map pack is the first screen most buyers see and the last they scroll past.',
      excl:'Local visibility only; site-wide rankings, content and AI visibility live in the mandates.',
      spec:['Up to three locations, each with its own category strategy','Citations built and kept consistent across the directories your buyers use','Posting schedule, Q&A and review-response system','Every element checked against '+gbpAdRule,'Local positions reported monthly']},
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
          <div class="ptj-meta">${escH(C.trajHint)}</div></div>
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
        <div class="traj-pt now"><b>${score}</b>Today · ${escH(txt(D.grade))}</div>
        <div class="traj-pt"><b>${proj[1]}</b>Week 12</div>
        <div class="traj-pt end"><b>${proj[2]}</b>Week 24</div>
      </div>
      <p class="ptj-caption capt">${escH(C.trajectoryCaption)}</p>
      <div class="ptj-tiers"><span class="lbl">Projection assumes</span>${TIERS.map((t,i)=>`<button type="button" data-tier-tab="${i}" class="${i===0?'active':''}">${t.name}</button>`).join('')}</div>
    </div>`;
  }

  /* ---------------- ROUTE 1 (C1): the Fix Sprint · severity-based tiers ---------------- */
  // E37/E38/E40: count-based "Top 10 / 20 / 30" tiers (which read as a ransom, and called every finding
  // "critical") are replaced by severity-based Sprints with contractual delivery windows.
  // FIRST-ENGAGEMENT PRICING: `standard` is the published fee, `price` is what this report unlocks.
  // price = standard / 2, exactly. The strike is explained on the card, never left as decoration.
  function issuesTotal(){
    // N3 · findings, not frameworks. The old "|| +D.rulesChecked" fallback printed a
    // framework count as a finding count on any report with a zero total.
    return Math.max(REG.rules, numOr(D.counts&&D.counts.total, 0));
  }
  // P6 / LEDGER P011 · grammar that survives n===0 and n===1 alike. The old form built
  // "All "+n+" finding" and so shipped the exact string the copy header bans,
  // "All 1 finding on this report, closed." n===1 now takes its own phrasing.
  function findingsPhrase(n){
    if(n>1) return 'All '+n+' findings on this report';
    if(n===1) return 'The one finding on this report';
    return 'Every finding on this report';
  }
  // The first fix title is an engine-authored obligation statement: it can run 30 words and
  // carry a statutory citation in brackets. The old code lower-cased the whole thing, which
  // mangled acronyms ("wcag 2.2 aa") and dumped a 30-word clause into a bullet.
  // C1 · a truncated obligation reads as a misquoted law, so this returns a name ONLY when a
  // COMPLETE leading clause exists (terminated by ; : or .) and it fits in nine words.
  // Otherwise the bullet drops the clause rather than shipping a fragment.
  function topFixShort(){
    const raw=txt((((D.fixes||[])[0])||{}).title);
    if(!raw) return '';
    const m=raw.match(/^([^;:.(]+)(;|:|\.)/);
    const clause=m ? m[1].trim() : '';
    if(!clause || clause.split(/\s+/).length>9) return '';
    return clause;
  }
  function sprintTiers(){
    const S=PRICES.fixSprints, n=issuesTotal();
    const critHigh=((D.counts&&D.counts.critical)||0)+((D.counts&&D.counts.high)||0);
    return [
      {k:'1', label:'Sprint I', nm:'Enforcement Clearance', price:S.sprint1.offer, standard:S.sprint1.standard, days:S.sprint1.days,
       head:'Every Critical and High regulatory finding on this report, closed.',
       blurb:`The layer a regulator's first letter cites, gone before the letter exists. ${critHigh>0?(critHigh+' '+plur(critHigh,'finding')+' in scope here.'):'Scoped to the regulatory findings here.'}`,
       // Q4 · compact spec rows: term + one line. Deliverables and timeline, never prose.
       specs:[
         ['Scope', critHigh>0 ? (critHigh+' Critical and High regulatory '+plur(critHigh,'finding')+' on this report') : 'The Critical and High regulatory findings on this report'],
         ['Delivered', 'Rewritten pages and elements, each re-checked against the rule it breached'],
         ['Evidence', 'A before and after record for every finding closed'],
         ['Timeline', S.sprint1.days+' days from scope sign-off, contractual'],
       ]},
      {k:'2', label:'Sprint II', nm:'Full Remediation', price:S.sprint2.offer, standard:S.sprint2.standard, days:S.sprint2.days, badge:'Most chosen',
       head:findingsPhrase(n)+', closed.',
       blurb:'Every finding on this report closed. Compliance, search and AI visibility together.',
       specs:[
         ['Scope', 'Everything in Sprint I, plus every search and AI visibility finding'],
         ['Delivered', 'Compliance, on-page, technical and entity fixes implemented on your live site'],
         ['Evidence', 'A before and after record, plus the evidence pack your committee can file'],
         ['Timeline', S.sprint2.days+' days from scope sign-off, contractual'],
       ]},
      {k:'3', label:'Sprint III', nm:'Remediation + Verified Re-score', price:S.sprint3.offer, standard:S.sprint3.standard, days:S.sprint3.days,
       head:findingsPhrase(n)+', closed, re-scanned and certified.',
       blurb:'Sprint II plus '+C.sprintReScan+', a re-scored certificate and 30 days of Watch. Built for a committee and an insurer who need the paper.',
       specs:[
         ['Scope', 'Everything in Sprint II, then the whole site re-scanned from scratch'],
         ['Delivered', 'A re-scored certificate and the filed evidence pack, plus 30 days of Regulatory Watch'],
         ['Evidence', 'Every fix proven against the statute it answers, finding by finding'],
         ['Timeline', S.sprint3.days+' days from scope sign-off, contractual'],
       ]},
    ];
  }
  const SPRINT_DEFAULT=1;   // Sprint II is the default tab (C1)
  // The Sprint buy CTA. E39: an unset Payment Link must NEVER hide the button. When STRIPE.sprintN is empty
  // the CTA falls back to the intake modal (data-book), and its href is a real booking URL so it works with
  // JavaScript disabled too. A payment path always exists.
  function sprintCta(k){
    const url=sprintStripe(k);
    return url
      ? `<a class="btn solid block r1-buy" href="${escH(url)}" target="_blank" rel="noopener" data-fixtier="${escH(k)}">${escH(C.ctaSprintBuy)}</a>`
      : `<a class="btn solid block r1-buy" href="${escH(bookUrl('sprint'))}" data-book="one_time_fix" data-fixtier="${escH(k)}">${escH(C.ctaSprintScope)}</a>`;
  }
  // The whole card body, re-rendered on every tab change (one code path, so the tabs can never desync).
  function sprintCardHtml(i){
    const T=sprintTiers(), sp=T[i]||T[SPRINT_DEFAULT];
    const credit=Math.round(sp.price*(PRICES.fixSprintCreditPct/100));
    const found=PRICES.tiers.foundation.from;
    const sc=PRICES.scco;
    const hours=35, counsel=hours*sc.gradeA;
    const topFix=topFixShort();
    const n=issuesTotal();
    // Q4 · the shared five-bullet outcome list is replaced by the tier's OWN spec rows, so
    // each price is answered by what that Sprint actually delivers and by when. The order
    // line is the one per-firm bullet: it names this report's top finding when the engine
    // gives a clean, short clause for it.
    const order='Your highest-severity findings closed first, in priority order'+(topFix?', starting with “'+topFix+'”':'');
    const specRows=(sp.specs||[]).map(r=>`<div class="fx-spec"><dt>${escH(r[0])}</dt><dd>${escH(r[1])}</dd></div>`).join('');
    return `
          <div class="fx-body">
            <div class="fx-eyebrow">Fix ${escH(sp.label)} · ${escH(sp.nm)}</div>
            <h3 class="r1-head">${escH(sp.head)}</h3>
            <p class="fx-line">${escH(C.sccoHeadline(hours,fmtMoney(sc.gradeA),fmtMoney(counsel)))}</p>
            <details class="scco-note"><summary>${escH(C.sccoSummary)}</summary><p>${escH(C.sccoDetail(fmtMoney(sc.gradeA),sc.band,sc.inForce,fmtMoney(counsel),hours))} <a href="${escH(sc.sourceUrl)}" target="_blank" rel="noopener">${escH(sc.source)}</a></p></details>
            <p class="fx-tierline">${escH(sp.blurb)}</p>
            <dl class="fx-specs">${specRows}</dl>
            <p class="fx-order capt">${escH(order)}</p>
          </div>
          <div class="fx-side">
            <div class="fx-price"><span class="fx-was r1-was cmoney" data-gbp="${sp.standard}">${fmtMoney(sp.standard)}</span><b class="r1-price cmoney" data-gbp="${sp.price}">${fmtMoney(sp.price)}</b></div>
            <div class="fx-firstline">${escH(C.firstEngagement('{S}','{O}')).replace('{S}',priceSpan(sp.standard)).replace('{O}',priceSpan(sp.price))}</div>
            <div class="fx-anchor r1-cap">One-time · fixed scope · delivered in ${sp.days} days, contractually</div>
            <div class="fx-credit">${escH(C.sprintCredit(PRICES.fixSprintCreditPct,'{C}',PRICES.fixSprintCreditDays)).replace('{C}',priceSpan(credit))}${credit>=found?escH(C.sprintCreditCovers('{F}')).replace('{F}',priceSpan(found)):''}</div>
            ${sprintCta(sp.k)}
            <a class="btn block fx-cta" href="${escH(bookUrl('sprint'))}" data-book="one_time_fix" data-fixtier="${escH(sp.k)}">${escH(C.ctaSprintCall)}</a>
          </div>`;
  }

  /* ---------------- THE MONITORING RADAR (Q4, founder 2026-07-29) ----------------
     A large radar showing what Regulatory Watch actually watches. Every part of it is
     honest by construction:
       · the SPOKES are the monitored dimensions. They are a CAPABILITY statement and render
         identically for every firm, so nobody can read a spoke as a measurement of their site.
         The caption says so in as many words (CAP 3.7: never state an unmeasured finding as fact).
       · the OUTER RING carries the real regulators resolved from THIS report's frameworks.
         A regulator that does not reduce to a clean short name is dropped, never guessed.
       · the CENTRE is the audited domain.
       · the sweep is motion, not data, and it is disabled under prefers-reduced-motion.
     Inline SVG only: no external asset, no web font, font sizes as SVG attributes (never a
     style="font-size" that the type guard would, correctly, reject).                        */
  const RADAR_SPOKES=['Advertising law','Data and GDPR','Regulator rules','Consumer law','Accessibility','SEO','AI visibility'];
  // Short regulator names for the outer ring. Prefer the parenthesised acronym the engine
  // already writes; otherwise an all-caps token; otherwise a short single-word name. Anything
  // that does not reduce cleanly is DROPPED rather than abbreviated into something wrong.
  function regulatorShorts(){
    const out=[];
    ((D.frameworks)||[]).forEach(f=>{
      const raw=txt(f&&(f.regulator||f.authority)); if(!raw) return;
      let s='';
      const paren=raw.match(/\(([A-Z][A-Za-z0-9&./-]{1,9})\)/);
      if(paren) s=paren[1];
      else { const caps=raw.match(/\b[A-Z]{2,6}\b/); if(caps) s=caps[0];
             else if(raw.length<=12 && !/[,;/(]/.test(raw)) s=raw; }
      s=s.trim();
      if(!s || s.length>12 || out.indexOf(s)>-1) return;
      out.push(s);
    });
    return out.slice(0,6);
  }
  function watchRadar(){
    const W=520,H=440,cx=260,cy=220;
    const rings=[52,92,132], rSpoke=132, rLab=150, rReg=182;
    const pt=(r,deg)=>[cx+r*Math.cos((deg-90)*Math.PI/180), cy+r*Math.sin((deg-90)*Math.PI/180)];
    const ringEls=rings.map((r,i)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${i===rings.length-1?1.4:1}"/>`).join('');
    const step=360/RADAR_SPOKES.length;
    const spokes=RADAR_SPOKES.map((nm,i)=>{
      const a=i*step, [x2,y2]=pt(rSpoke,a), [lx,ly]=pt(rLab,a);
      const anchor=(Math.abs(a%360)<1||Math.abs(a%360-180)<1)?'middle':((a%360)<180?'start':'end');
      const dy=(Math.abs(a%360)<1)?-4:((Math.abs(a%360-180)<1)?11:4);
      return `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--line-2)" stroke-width="1"/>`
        +`<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="3.6" fill="var(--gold)"/>`
        +`<text x="${lx.toFixed(1)}" y="${(ly+dy).toFixed(1)}" text-anchor="${anchor}" font-family="var(--mono)" font-size="11" fill="var(--ox)">${escH(nm)}</text>`;
    }).join('');
    const regs=regulatorShorts();
    const regRing=`<circle cx="${cx}" cy="${cy}" r="${rReg}" fill="none" stroke="var(--gold)" stroke-width="1" stroke-dasharray="3 7" opacity=".55"/>`;
    const regEls=regs.length>=3 ? regs.map((r,i)=>{
      const a=(360/regs.length)*i+(360/regs.length)/2, [x,y]=pt(rReg,a);
      return `<g><rect x="${(x-r.length*3.6-7).toFixed(1)}" y="${(y-9).toFixed(1)}" width="${(r.length*7.2+14).toFixed(1)}" height="18" rx="9" fill="var(--paper)" stroke="var(--gold)" stroke-width="1"/>`
        +`<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--ox)">${escH(r)}</text></g>`;
    }).join('') : '';
    const [sx,sy]=pt(rSpoke,0);
    const sweep=`<g class="rdr-sweep" style="transform-origin:${cx}px ${cy}px">`
      +`<path d="M${cx} ${cy} L${sx.toFixed(1)} ${sy.toFixed(1)} A${rSpoke} ${rSpoke} 0 0 1 ${pt(rSpoke,52)[0].toFixed(1)} ${pt(rSpoke,52)[1].toFixed(1)} Z" fill="url(#rdrg)"/></g>`;
    const dom=txt(D.meta&&D.meta.domain)||txt(D.meta&&D.meta.company)||'your site';
    const domShort=dom.length>22 ? dom.slice(0,21)+'…' : dom;
    return `<div class="rdr">
      <svg class="rdr-svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${escH(C.radarAria)}">
        <defs><radialGradient id="rdrg"><stop offset="0" stop-color="var(--gold)" stop-opacity=".38"/><stop offset="1" stop-color="var(--gold)" stop-opacity="0"/></radialGradient></defs>
        ${regRing}${ringEls}${sweep}${spokes}${regEls}
        <circle cx="${cx}" cy="${cy}" r="34" fill="var(--ox-deep)"/>
        <text x="${cx}" y="${cy+4}" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="#fff">YOU</text>
        <text x="${cx}" y="${cy+54}" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--muted)">${escH(domShort)}</text>
      </svg>
      <div class="rdr-side">
        <div class="rdr-h">${escH(C.radarHead)}</div>
        <ul class="rdr-chips">${C.radarChips.map(c=>`<li>${escH(c)}</li>`).join('')}</ul>
        <p class="rdr-cap capt">${escH(C.radarCaption)}</p>
        <p class="rdr-cap capt">${escH(regs.length>=3 ? C.radarRegs(regs.length) : C.radarRegsNone)}</p>
        <p class="rdr-cap capt rdr-tiein"><b>${escH(C.watchTieIn ? C.watchTieIn(numOr(D.frameworksBinding, COUNTS.regulatory.n), numOr(REG.rules,0)) : '')}</b></p>
      </div>
    </div>`;
  }

  /* ---------------- ROUTE 2 (Q4): Regulatory Watch, the monitoring tier ----------------
     FOUNDER DECISION Q4 (2026-07-29): the £495 unlock is retired. The middle offer is
     £1,500 a month with month one free. It unlocks the full audit, watches the law
     continuously, re-runs the audit monthly and DELIVERS the fix specification. It does not
     implement: implementation lives in a Sprint or a mandate, and the card says so.
     DMCCA Sch 20 · the renewal is stated plainly on the card, not in a footnote.
     E39/E16: the buy CTA is NEVER hidden. It routes to the SUBSCRIPTION intake, never to the
     one-time £495 Payment Link still sitting in pricing.ts, which would charge the wrong
     amount for this offer (flagged as founder-gated in PRICING-REQUIREMENTS.md).           */
  function routeWatch(){
    const cover=PRICES.exposureReport.monthlyCover;
    const specs=[
      ['The full audit, unlocked','Every locked fix opened in full, plus the complete compliance, search and AI-visibility assessment.'],
      ['Monthly re-run and re-score','This report re-run on your live data every month, so the record always reflects the site as it stands.'],
      ['Law watch, around the clock','Your sector’s registers and regulators watched continuously, not swept once a month.'],
      ['Law change flagged within 48 hours','Every new ruling that touches you flagged within 48 hours, with the page and the rule it affects.'],
      ['Breach specified within 72 hours','A new breach on your live site returned as a written fix specification within 72 hours.'],
      ['The exact page, rule and change','You are told precisely what to change and where. Implementation is a Sprint or a mandate.'],
      ['Change log and quarterly certificate','A month-by-month history, and a filed record your committee and insurer can rely on.'],
      ['Search and AI position tracking','Rankings and AI share of voice tracked over time against the rivals named alongside you.'],
      ['Review, mention and press monitoring','Your reputation watched alongside the law, with a crisis playbook on standby.'],
    ];
    const specList=`<ul class="r3-list r3-specs">${specs.map(s=>`<li><span class="r3-spec-t">${escH(s[0])}</span><span class="r3-spec-q" data-tip="${escH(s[1])}" tabindex="0" aria-label="${escH(s[0])}: ${escH(s[1])}">?</span></li>`).join('')}</ul>`;
    // A Payment Link is used only when a SUBSCRIPTION link is pasted; otherwise the
    // always-valid checkout/intake path runs. Either way a button renders with a real
    // destination, and neither path can charge the retired one-time price.
    const payCta=(label)=>{
      const href=strOr(STRIPE.cover);
      return href
        ? `<a class="btn solid block" href="${escH(href)}" target="_blank" rel="noopener">${label}&nbsp;↗</a>`
        : `<a class="btn solid block" href="${escH(bookUrl('scoping'))}" data-subscribe="exposure_cover" data-trial="${PRICES.exposureReport.freeMonths}">${label}&nbsp;↗</a>`;
    };
    const open=!!D.unlocked;
    return `
    <div class="subhead" style="margin-top:16px"><span class="nt">↳</span><h3>${escH(open?C.routeWatchHeadOpen:C.routeWatchHead)}</h3></div>
    <p class="plan-sub r3-gold">${escH((open?C.watchLedeOpen:C.watchLede)('{C}')).replace('{C}',priceSpan(cover))}</p>
    <div class="route route3">
      <div class="r3-rib">${escH(C.watchRib)}</div>
      ${watchRadar()}
      <div class="r3-grid">
        <div class="r3-main">
          <div class="fx-eyebrow">${escH(C.watchEyebrow)}</div>
          <h3 class="r3-h">${escH(C.watchHead)}</h3>
          <p class="r3-body">${escH(C.watchBody)}</p>
          ${specList}
        </div>
        <div class="r3-side r3-pay">
          <div class="r3-price"><b class="cmoney" data-gbp="${cover}">${fmtMoney(cover)}</b><small>a month</small></div>
          <div class="r3-free">${escH(C.watchFree)}</div>
          ${payCta(C.watchCta)}
          <div class="r3-terms">${escH(C.watchTerms('{C}')).replace('{C}',priceSpan(cover))}</div>
          <details class="r3-note"><summary>${escH(C.r3TermsSummary)}</summary><p>${escH(C.watchTermsDetail)}</p></details>
        </div>
      </div>
    </div>`;
  }

  function planAndPricing(){
    const TIERS=planData();
    const recT=TIERS.find(t=>t.rec)||TIERS[2];
    const recTier=recT.name;
    const crit=REG.sev.crit;
    const score=numOr(D.score,0);
    const wk12=(D.projected&&D.projected.wk12)||(D.trajectory&&D.trajectory[1]&&D.trajectory[1].v)||score;
    const wk24=(D.projected&&D.projected.wk24)||(D.trajectory&&D.trajectory[2]&&D.trajectory[2].v)||score;
    const topFix=((D.fixes||[])[0]||{}).title||'your highest-severity finding';

    const SPRINTS=sprintTiers();
    const isLegal=/law|legal|solicit|barrist|attorney|chambers/.test(_sectorStr);
    // Sector conditioning: the Instagram card is suppressed on legal-sector reports (Online Personal
    // Branding is the correct instrument for a law firm).
    const ADDONS_SHOWN=ADDONS.filter(a=>!(isLegal && a.key==='instagramPresence'));

    return `
    <div class="plan2">
    <div class="pane-head"><span class="eyebrow">${escH(C.planEyebrow)}</span>
      <h2>${escH(crit>0?C.planHead(crit):C.planHeadClean)}</h2>
      <p>${escH(C.pricingNotes)}</p></div>

    ${SCORED?planTrajectory(score,wk12,wk24,TIERS,recT.key):''}

    <div class="cur-bar" role="group" aria-label="Display currency"><span class="cur-lbl">Prices in</span>${['GBP','USD','EUR','AED'].map(c=>`<button class="cur-btn${_curState.code===c?' active':''}" data-cur="${c}" type="button" aria-pressed="${_curState.code===c?'true':'false'}">${c}</button>`).join('')}<span class="cur-note">quoted &amp; invoiced in GBP</span></div>

    <div class="subhead" style="margin-top:12px"><span class="nt">↳</span><h3>${escH(C.routeSprintHead)}</h3></div>
    <p class="plan-sub r1-lane">${escH(PRICES.fixPacksLane)}</p>
    <div class="route route1">
      <div class="fixbox r1-fixbox">
        <div class="fx-rib">One-time · no mandate</div>
        <div class="r1-toggle r1-toggle-dark" role="tablist" aria-label="Choose a Fix Sprint">${SPRINTS.map((sp,i)=>`<button class="r1-tab${i===SPRINT_DEFAULT?' active':''}" data-sprint="${i}" data-fixtier="${sp.k}" type="button" role="tab" aria-selected="${i===SPRINT_DEFAULT?'true':'false'}"><span class="r1t-l">${escH(sp.label)}${sp.badge?` <em class="r1t-badge">${escH(sp.badge)}</em>`:''}</span><small class="cmoney" data-gbp="${sp.price}">${fmtMoney(sp.price)}</small></button>`).join('')}</div>
        <div class="fx-main">${sprintCardHtml(SPRINT_DEFAULT)}</div>
        <div class="fx-foot capt">${escH(C.sprintFoot)}</div>
      </div>
    </div>

    ${routeWatch()}

    <div class="subhead" style="margin-top:16px"><span class="nt">↳</span><h3>${escH(C.routeMandateHead)}</h3></div>
    <p class="plan-sub">${escH(C.routeMandateLede)}</p>
    <div class="pilot-bar">
      <button class="pilot-btn" type="button" data-pilot aria-pressed="false"><span class="pilot-dot" aria-hidden="true"></span>${escH(C.pilotToggle)}</button>
    </div>
    <div class="route tiers3 tiers-lux">${TIERS.map(t=>`
      <div class="tier3 tl ${t.rec?'rec':''} ${t.popular?'pop':''}" data-tier-card="${t.key}">
        ${t.rec?'<div class="tl-rib tl-rib-rec">Recommended</div>':''}
        <div class="tl-head"><div class="tl-nm">${t.name}</div><div class="tl-who">${escH(t.wk)}</div></div>
        <div class="tl-priceline"><span class="tl-from">From</span><b class="cmoney" data-gbp="${t.from}">${fmtMoney(t.from)}</b><span class="tl-per">a month</span><span class="tl-vs">· ${escH(C.tierStandard)}</span><s class="tl-was cmoney" data-gbp="${t.standard}">${fmtMoney(t.standard)}</s></div>
        <p class="tl-saves">${escH(C.tierSaves('{M}','{S}','{V}'))
            .replace('{M}','<span class="cmoney" data-gbp="'+(t.standard-t.from)+'">'+fmtMoney(t.standard-t.from)+'</span>')
            .replace('{S}','<span class="cmoney" data-gbp="'+t.standard+'">'+fmtMoney(t.standard)+'</span>')
            .replace('{V}','<span class="cmoney" data-gbp="'+t.saves6+'">'+fmtMoney(t.saves6)+'</span>')}</p>
        <p class="tl-blurb">${escH(t.blurb)}</p>
        <ul class="tl-feats">${t.feats.slice(0,3).map((f,i)=>{const tip=(TIER_TIPS[t.key]||[])[i]; return `<li><span class="tl-feat-t">${escH(f)}</span>${tip?`<span class="r3-spec-q tl-q" data-tip="${escH(tip)}" tabindex="0" aria-label="${escH(f)}: ${escH(tip)}">?</span>`:''}</li>`;}).join('')}</ul>
        <div class="t3-more tl-more" hidden><ul>${tierMore(t).map(m=>`<li><span class="tl-feat-t">${escH(m.t)}</span>${m.tip?`<span class="r3-spec-q tl-q" data-tip="${escH(m.tip)}" tabindex="0" aria-label="${escH(m.t)}: ${escH(m.tip)}">?</span>`:''}</li>`).join('')}</ul></div>
        <div class="tl-foot"><button class="t3-toggle tl-toggle" type="button">${escH(C.ctaShowMore)}</button><a class="btn block tl-cta" href="${escH(bookUrl('package'))}" data-book="package" data-tier="${escH(t.name)}">${escH(C.ctaTier(t.name))}</a></div>
      </div>`).join('')}</div>
    <p class="plan-sub tl-note">${escH(C.mandateNote)}</p>

    <div class="subhead" style="margin-top:16px"><span class="nt">↳</span><h3>${escH(C.addonsHead)}</h3></div>
    <p class="plan-sub">${escH(C.addonsLede)}</p>
    <div class="addon-railwrap">
      <button type="button" class="addon-nav addon-prev" aria-label="${escH(C.navPrev)}">&lsaquo;</button>
      <div class="addon-grid" role="list">
      ${ADDONS_SHOWN.map(a=>{
        const off=(a.offer!=null)?a.offer:a.price;          // the price actually charged
        const priceHtml=(a.anchor!=null)
          ? `<span class="apwas cmoney" data-gbp="${a.anchor}">${fmtMoney(a.anchor)}</span><b class="cmoney" data-gbp="${off}">${fmtMoney(off)}</b><small>${escH(a.unit)}</small>`
          : `<b class="cmoney" data-gbp="${off}">${fmtMoney(off)}</b><small>${escH(a.unit)}</small>`;
        // E16/E39: the CTA always has a destination. A pasted Payment Link takes the payment; an empty one
        // routes to the intake modal, which is never hidden.
        const su=addonStripe(a.key);
        const cta=su
          ? `<a class="btn gold addon-cta" href="${escH(su)}" target="_blank" rel="noopener">${escH(C.ctaAddon(a.nm))}</a>`
          : `<a class="btn gold addon-cta" href="${escH(bookUrl('scoping'))}" data-addon="${escH(a.nm)}" data-price="${off}">${escH(C.ctaAddon(a.nm))}</a>`;
        return `<div class="addon ${a.hero?'ag-hero':''}" role="listitem" tabindex="0">
        <div class="is-top">
          <div class="an">${escH(a.nm)}</div>
          <div class="ap">${priceHtml}</div>
          ${a.typical?`<div class="atyp capt">${escH(C.addonTypical(fmtMoney(off),fmtMoney(a.typical)))}</div>`:''}
          <div class="ascope">${escH(a.scope)}</div>
        </div>
        <div class="is-detail">
          <div class="tag">${escH(a.usp)}</div>
          <div class="afirst capt">${escH(C.addonFirst(fmtMoney(a.anchor),fmtMoney(off)))}</div>
          <div class="aspec-h">How it runs, step by step</div>
          <ol class="aspec-steps">${a.spec.map(x=>`<li>${escH(x)}</li>`).join('')}</ol>
          <div class="aexcl capt">${escH(a.excl||'')}</div>
          ${cta}
        </div>
      </div>`;}).join('')}
      </div>
      <button type="button" class="addon-nav addon-next" aria-label="${escH(C.navNext)}">&rsaquo;</button>
    </div>
    <p class="plan-sub addon-disclosure">${escH(C.addonDisclosure)}</p>

    <div class="subhead founder-subhead" style="margin-top:13px"><span class="nt">↳</span><h3>${escH(C.bookingHead)}</h3></div>
    <div class="founder-cred">${escH(C.legalReviewed)}</div>
    <p class="plan-sub">${escH(C.bookingLede)}</p>
    <div class="booking">
      <div class="bookcard"><div class="rt">${escH(C.bookMandateTag)}</div><h3>${escH(C.bookMandateHead)}</h3>
        <p>${escH(C.bookMandateBody(txt(D.meta&&D.meta.company)||'your firm'))}</p>
        <div class="cal-embed" data-cal-embed data-intent="package" data-tier="${recTier}" aria-label="${escH(C.bookMandateHead)}"></div>
        <p class="bookcard-note">${escH(C.bookPick)}<a href="${escH(bookUrl('package'))}" target="_blank" rel="noopener">${escH(C.bookPickLink)}</a>.</p></div>
      <div class="bookcard"><div class="rt">${escH(C.bookSprintTag)}</div><h3>${escH(C.bookSprintHead)}</h3>
        <p>${escH(C.bookSprintBody)}</p>
        <div class="cal-embed" data-cal-embed data-intent="one_time_fix" aria-label="${escH(C.bookSprintHead)}"></div>
        <p class="bookcard-note">${escH(C.bookPick)}<a href="${escH(bookUrl('sprint'))}" target="_blank" rel="noopener">${escH(C.bookPickLink)}</a>. ${escH(C.bookSprintNote)}</p></div>
    </div>

    <div class="subhead" style="margin-top:14px"><span class="nt">↳</span><h3>${escH(C.writtenHead)}</h3></div>
    <p class="plan-sub">${escH(C.writtenLede)}</p>
    <form class="audit-bookform" novalidate aria-label="Contact Tamazia">
      <input type="text" name="c_website_2" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
      <div class="abf-grid">
        <label class="abf-field"><span>Your name</span><input name="name" autocomplete="name" value="${escH((D.meta&&D.meta.company)||'')}"></label>
        <label class="abf-field"><span>Website</span><input name="audit-input" autocomplete="url" value="${escH((D.meta&&D.meta.domain)||'')}"></label>
        <label class="abf-field"><span>Email *</span><input name="email" type="email" required autocomplete="email" placeholder="you@firm.com"></label>
        <label class="abf-field"><span>Sector</span><input name="sector" value="${escH((D.meta&&D.meta.sector)||'')}"></label>
      </div>
      <div class="abf-err" role="alert" hidden></div>
      <div class="abf-actions"><button type="submit" class="btn solid abf-submit">${escH(C.ctaWritten)}</button></div>
      <p class="abf-fine">${escH(C.writtenFine)}</p>
    </form>

    <div class="card pad mt-10" style="background:var(--cream-2);border:0">
      <details class="legal-more"><summary>${escH(C.legalSummary)}</summary>
        <div class="capt legal-fine">${escH(C.legalBody(txt(D.meta&&D.meta.catalogue).replace(/^v+/i,'v')||'not stated'))}</div></details>
    </div>
    </div>`;
  }

  /* ---------------- VERDICT (A2, R1: conclusion first) ---------------- */
  // T1 · the .vfix-head / .vfixes chip strip is DELETED. The trio has exactly one home:
  // the yellow caution cards in Overview.
  function verdict(){
    const company=txt(D.meta&&D.meta.company)||'your firm';
    const expStr=txt(D.exposure);
    const hasMoney=hasValue(expStr) && REG.rules>0;
    const bind=numOr(D.frameworksAssessed, numOr(D.frameworksBinding,0));
    const bullets=[];
    bullets.push('<b>'+escH(C.labelWhat)+'</b> '+escH(C.verdictWhat(company)));
    if(REG.rules>0) bullets.push('<b>'+escH(C.labelHeadline)+'</b> '+escH(C.verdictHeadline(REG.rules)));
    else if(D.compliance_unassessed) bullets.push('<b>'+escH(C.labelHeadline)+'</b> '+escH(C.verdictBlocked));
    else bullets.push('<b>'+escH(C.labelHeadline)+'</b> '+escH(C.verdictClean));
    bullets.push('<b>'+escH(C.labelStand)+'</b> '+escH(C.verdictStand(bind)));
    // N3 · the rule count leads; the raw element instances are an explicit sub-line, never
    // a second contradictory total.
    const totalFindings=issuesTotal();
    const sub=(REG.instances>REG.rules || totalFindings>REG.rules)
      ? '<div class="capt">'+escH(C.instanceLine(REG.rules,REG.instances,totalFindings))+'</div>' : '';
    // CONF-211 · a score computed from zero assessed dimensions is not a score.
    // CONF-013 · ONE string names this figure, here and in the value band.
    // CONF-210 · a clean scan must not point the reader at "the gaps below".
    const scorePart=numOr(D.score,0)+' / 100 · '+escH(txt(D.grade));
    let head;
    if(!SCORED) head=escH(C.notScoredLine)+' '+escH(C.notScoredWhy);
    else if(hasMoney) head=scorePart+'. '+escH(C.regMedian)+' <span class="vexp">'+escH(expStr)+'</span> across '+REG.rules+' '+plur(REG.rules,'breach','breaches')+' evidenced on your live site.';
    else head=scorePart+'. '+escH(REG.rules>0?C.verdictGapsLine:C.verdictNoGaps);
    return '<div class="verdict"><div><span class="eyebrow">'+escH(C.verdictEyebrow)+'</span>'
      +'<h2>'+head+'</h2>'+sub
      +'<ul class="verdict-bullets">'+bullets.map(b=>'<li>'+b+'</li>').join('')+'</ul>'
      +'<p class="verdict-foot capt">'+escH(C.verdictRead)+' '+escH(C.verdictKeep)+'</p>'
      +'</div></div>';
  }

  /* Founder-session yellow band removed (founder request 2026-07-20). The recommended-tier
     booking CTA remains on the rail (.rail-cta data-book="package") and in the Plan pane, so
     Drawer/Commerce wiring is unaffected. No .fsx-* / .cta-blindsend markup is emitted anywhere. */

  /* ---------------- S2 · PageSpeed: desktop AND mobile, side by side ---------------- */
  function psiBlock(){
    const S=(D.seo&&D.seo.psiStrats)||null;
    const av=S?['mobile','desktop'].filter(s=>S[s]):[];
    // G9 / CONF-162 · the heading may only claim the measurement its body carries.
    const headText = av.length ? C.psiHead : C.psiHeadNA;
    const head='<div class="subhead" style="margin:14px 0 10px"><span class="nt">↳</span><h3>'+escH(headText)+'</h3></div>';
    // N1 · absent means "Not assessed on this scan", never a red zero and never "Perf null".
    if(!av.length) return head+naLine(C.psiNA);
    const pair=av.map(function(st){
      const s=S[st]||{}; const cwv=(s.cwv||[]);
      // G3 / CONF-091 / 092 · the failing COUNT is computed from the same value-versus-target
      // comparison the reader can see in the chips below it.
      const fail=CH.cwvFailCount(cwv);
      return '<div class="psi-col">'
        +'<div class="card pad"><div class="card-h"><div class="t">'+escH(st==='mobile'?C.psiMobile:C.psiDesktop)+'</div><div class="meta">PageSpeed Insights · live</div></div>'+CH.psiDialRow(s.dials)+'</div>'
        +'<div class="card pad"><div class="card-h"><div class="t">'+escH(C.cwvHead)+'</div><div class="meta">'+escH(cwv.length?C.cwvFailing(fail,cwv.length):C.notAssessedChip)+'</div></div>'
        +(cwv.length?CH.cwvMeterRow(cwv):naLine(C.psiNA))+'</div>'
        +'</div>';
    }).join('');
    const audits=av.map(function(st){
      const a=((S[st]||{}).audits)||[];
      if(!a.length) return '';
      return '<div class="card pad mt-10"><div class="card-h"><div class="t">'+escH(C.psiAuditsHead)+'</div>'
        +'<div class="meta">'+escH(st)+' · '+a.length+' found</div></div>'+CH.psiAuditRow(a,st)+'</div>';
    }).join('');
    return head+'<div class="psi-pair">'+pair+'</div>'+audits;
  }

  /* ---------------- HERO charts ----------------
     A3 · the risk heatmap is removed at every layer. R2 · the waterfall moved into the
     Regulatory pane. What is left is the scorecard and the AI root-cause chain. */
  function heroCharts(){
    const chain=CH.causalChain();
    return `<section class="hero-charts">
      <div class="subhead" style="margin:2px 0 10px"><span class="nt">↳</span><h3>${escH(C.ovMetrics)}</h3></div>
      <div class="card pad">${CH.dimCardGrid({competitors:COUNTS.competitors.assessed, seo:SEO_ASSESSED, geo:GEO_ASSESSED})}</div>
      <div class="card pad mt-12"><div class="card-h"><div class="t">${escH(C.ovCausal(txt(D.meta&&D.meta.company)||'your firm'))}</div><div class="meta">root-cause chain</div></div>${chain||naLine(C.ovCausalOk)}</div>
    </section>`;
  }

  /* ---------------- MOUNT, command deck: 6 collapsed pillars ---------------- */
  const app = document.getElementById('app');
  // G1 · the pillar header reads the SAME string as the nav row that opens it.
  const SECT=[['overview',S.overview],['seo',S.seo],['geo',S.geo],['regulatory',S.regulatory],['competitors',S.competitors],['plan',S.plan]];
  const chip=(t,c)=>`<span class="pkpi ${c||''}">${t}</span>`;
  const maxDr=Math.max(0,...((D.competitors&&D.competitors.ladder)||[]).map(c=>numOr(c&&c.dr,0)));
  // C1 · a DR chip renders only from a REAL rival DR. "DR X vs 0" is banned.
  // CONF-008 / 138 · "DR" is expanded; the abbreviation is never a chip's first appearance.
  const drChip=(function(){
    if(!COUNTS.competitors.assessed) return '';
    const y=((D.competitors.rows||[])[0]||{}).dr;
    if(!isNum(y)) return '';
    return D.competitors.drHidden ? chip(escH(C.drChipSolo(y))) : chip(escH(C.drChip(y,maxDr)),'red');
  })();
  // S1 · the header chip renders a value or "Not assessed". "Perf null" cannot happen.
  // CONF-093 · the strategy is named, so a mobile figure cannot be read as the desktop one.
  // CONF-166 · when it is absent the chip says WHICH signal is unassessed.
  const perfChip=(function(){
    const p=(D.seo&&D.seo.psi)?D.seo.psi.performance:null;
    if(!isNum(p)) return chip(escH(C.perfChipNA));
    const st=(D.seo&&D.seo.psiStrats)||null;
    const dk=st&&st.desktop&&st.desktop.dials?st.desktop.dials.performance:null;
    return chip('Perf '+Math.round(+p)+' mobile'+(isNum(dk)?' · '+Math.round(+dk)+' desktop':''));
  })();
  // CONF-047 · a rank position is "top 10", never "page one" (which collides with "Page" = URL).
  const kwChip=(function(){
    const ks=(D.seo&&D.seo.keywordSummary)||{};
    const t=numOr(ks.totalTracked,0);
    return (t>0 && CH.usableKeywords().length) ? chip(numOr(ks.onPageOne,0)+' of '+t+' in the top 10') : '';
  })();
  const failDims=((D.dims||[]).filter(d=>d&&d.st==='fail')).length;
  const totalDims=((D.dims||[]).length)||10;
  // CONF-075 · the pillar chip and Sprint II's "All M findings on this report, closed." now read
  // the SAME total. They disagreed on every fixture (DEN 4 vs 56, SM 4 vs 59, THA 1 vs 15).
  const planFixChip=(function(){ const n=issuesTotal(); return n+' '+plur(n,'finding')+' to fix'; })();
  const SUMM={
    overview:{ico:'◆',nm:S.overview,kpis:(SCORED?chip(numOr(D.score,0)+'/100')+chip(escH(txt(D.grade)),'red')+chip(escH(C.dimsChip(failDims,totalDims))):chip(escH(C.notScoredChip)))},
    regulatory:{ico:'§',nm:S.regulatory,kpis:(REG.sev.crit?chip(REG.sev.crit+' critical','red'):'')+(hasValue(txt(D.exposure))?chip(escH(txt(D.exposure)),'red'):'')+chip(escH(COUNTS.regulatory.chip))},
    seo:{ico:'⌕',nm:S.seo,kpis:perfChip+chip(escH(COUNTS.seo.chip),'amber')+kwChip},
    geo:{ico:'❖',nm:S.geo,kpis:(GEO_ASSESSED?chip(escH(C.sovChip(txt(D.geo&&D.geo.shareOfVoice)||'0')),'red'):'')+chip(escH(COUNTS.geo.chip))+(GEO_ASSESSED?chip(escH(C.entityChip(numOr(D.geo&&D.geo.entityReadiness,0)))):'')},
    competitors:{ico:'⤧',nm:S.competitors,kpis:chip(escH(COUNTS.competitors.chip))+drChip},
    plan:{ico:'✦',nm:S.plan,kpis:chip('From '+fmtMoney(PRICING_TIERS_RENDER[0].from)+' a month')+chip(escH(planFixChip))},
  };
  app.innerHTML = rail() + `<main class="content">
    ${verdict()}
    ${trioBlock()}
    ${SECT.map(([k])=>`<details class="pillar" id="sec-${k}" data-section="${k}"><summary><span class="pico">${SUMM[k].ico}</span><span class="pname">${escH(SUMM[k].nm)}</span><span class="pkpis">${SUMM[k].kpis}</span><span class="pchev">▸</span></summary><div class="pbody">${P[k]()}</div></details>`).join('')}
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
    if(t3){ const card=t3.closest('.tier3'); const more=card.querySelector('.t3-more'); const open=more.hidden; more.hidden=!open; t3.textContent=open?C.ctaShowLess:C.ctaShowMore; card.classList.toggle('lx-open',open); return; }
    // Q4 · the six-month engagement toggle, mirroring the live site's pilot switch: it reveals
    // the struck standard fee and what the six-month term saves. Both figures are .cmoney, so
    // the currency switcher re-formats them without a second code path.
    const pt=e.target.closest('[data-pilot]');
    if(pt){ const on=pt.getAttribute('aria-pressed')!=='true';
      pt.setAttribute('aria-pressed',on?'true':'false');
      document.querySelectorAll('.tiers3').forEach(g=>g.classList.toggle('show-saves',on));
      return; }
    // Regulatory Watch, the recurring monitoring tier. The checkout contract is unchanged
    // (startAddon('Compliance Monitoring', …, {trial}) → /api/stripe/checkout → webhook flips
    // audit_pages.unlocked), but Q4 retired the one-time unlock price, so the ONLY figure
    // that can reach checkout is the monthly cover, carrying the free-month count as trial.
    // A path that could post the retired £495 no longer exists.
    const sub=e.target.closest('[data-subscribe]');
    if(sub){ e.preventDefault();
      Commerce.startAddon('Compliance Monitoring', gbpFmt(PRICES.exposureReport.monthlyCover), sub, { trial:+sub.dataset.trial||0 });
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
    panel.setAttribute('aria-modal','true'); panel.setAttribute('aria-label',S.plan); panel.setAttribute('aria-hidden','true');
    panel.innerHTML='<div class="pdrawer-bar"><span class="pdrawer-t">'+escH(S.plan)+'</span><button class="pdrawer-x" aria-label="Close '+escH(S.plan)+'">×</button></div><div class="pdrawer-body"></div>';
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
    // A4 · the "+PLANS" pill is removed. Plan access is the rail nav row and pillar 6.
    return { open:doOpen, close:doClose, isOpen };
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
      return String(intent||''); // Independent Solution display name
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
      const eyebrow=isAddon?(esc(opts.addon)+' · Independent Solution'):esc(intentLabel(intent));
      const lede=isAddon
        ? 'Online checkout for this solution is being switched on. Leave your details and pick a time, and Tamazia will set it up with you on the call.'
        : ('30 seconds. This scopes the call so no time is wasted on discovery. '+(intent==='one_time_fix'?'A one-time, fixed-scope sprint, not a mandate.':'Your tier and strongest finding are carried into the conversation.'));
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
            <button type="submit" class="btn solid cmx-submit">${esc(C.ctaIntake)}</button>
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
          addonFallback(addon, btn, label, 'Online checkout for this solution is being switched on. Leave your details and the founder will set it up with you.');
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
