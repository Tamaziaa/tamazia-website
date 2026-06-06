/* ============================================================
   TAMAZIA AUDIT, app: rail + panes + commerce + wiring
   ============================================================ */
(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  // count-aware pluralization: plur(1,'finding')→'finding', plur(2,'finding')→'findings',
  // plur(1,'is','are')→'is'. Used everywhere a live count precedes finding/critical/breach/run/dim/are.
  const plur = (n,s,p)=> n===1 ? s : (p||s+'s');
  // Escape DATA-sourced strings before innerHTML (evidence quotes/LLM text can carry a raw "<"
  // that would corrupt the DOM — the axe-rule-name regression). Display text only.
  const escH = s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* ---------------- LEFT RAIL ---------------- */
  function rail(){
    const nav=[
      {id:'overview', nm:'Overview', dot:'r', c:''},
      {id:'regulatory', nm:'Regulatory', dot:'r', c:(D.frameworks||[]).length+' '+plur((D.frameworks||[]).length,'framework')},
      {id:'seo', nm:'SEO &amp; Technical', dot:'a', c:(D.seo.issueCount||(D.seo.onpage||[]).length)+' '+plur(D.seo.issueCount||(D.seo.onpage||[]).length,'issue')},
      {id:'geo', nm:'AI &amp; GEO', dot:'r', c:(D.geo.issueCount||0)+' '+plur(D.geo.issueCount||0,'gap')},
      {id:'competitors', nm:'Competitors', dot:'a', c:Math.max(0,(D.competitors.rows||[]).length-1)+' ahead'},
      {id:'plan', nm:'Plan &amp; Pricing', dot:'g', c:''}
    ];
    return `
    <aside class="rail">
      <div class="rail-brand"><img src="/tamazia-lockup-masthead-transparent.png" alt="Tamazia" class="rail-logo"></div>
      <h1>${D.meta.company}</h1>
      <div class="rail-meta">${D.meta.sector}<br>${[D.meta.country,D.meta.city,D.meta.date].filter(Boolean).join(' · ')}<br>${D.meta.domain}</div>
      <div class="rail-gauge">${CH.gauge(D.score,D.grade,{size:96,dark:true})}</div>
      <div class="rail-band">${D.frameworksTotal} frameworks screened · ${D.frameworksAssessed} bind you</div>
      <div class="rail-exposure"><div class="v">${D.exposureHeadline||D.exposure}</div><div class="l">${D.exposureNote}</div></div>
      <div class="rail-kpis">
        <div class="rail-kpi"><div class="v red">${D.counts.critical}</div><div class="l">Critical findings</div></div>
        <div class="rail-kpi"><div class="v">${D.confirmed}</div><div class="l">Confirmed v. evidence</div></div>
        <div class="rail-kpi"><div class="v red">${D.geo.shareOfVoice}</div><div class="l">AI share of voice</div></div>
        <div class="rail-kpi"><div class="v">${D.competitors.rows[0].dr}</div><div class="l">Domain rating</div></div>
      </div>
      <div class="rail-navtitle">Jump to</div>
      <nav class="railnav">${nav.map((n,i)=>`<button data-pane="${n.id}" class="${i===0?'active':''}"><span class="ni dot ${n.dot}"></span>${n.nm}<span class="nc">${n.c}</span></button>`).join('')}</nav>
      <button class="rail-jump" data-pane="plan">Jump to pricing →</button>
      <button class="rail-cta" data-book="package" data-tier="Enterprise">Walk this with the founder →</button>
      <div class="rail-trust">Founder-led · every fix checked against ${D.rulesChecked} rules</div>
    </aside>`;
  }

  /* ---------------- PANES ---------------- */
  // Phase 3 de-triplication: the FULL finding detail lives ONCE in P.overview (ids fx-1..N).
  // Everywhere else that referenced a top-fix (regulatory "breaches in full", verdict chips)
  // becomes a clickable SUMMARY that opens the overview detail. fixSummary keys on the fix's
  // position in D.fixes so the id matches the overview card exactly.
  function fixSummary(f){
    const i=(D.fixes||[]).indexOf(f);
    return `<button class="fix-summary" data-finding="fx-${i+1}">
      <span class="fs-tag">${f.reg||f.pillar||''}</span><span class="fs-t">${f.title}</span>
      <span class="fs-e">${f.exp}</span><span class="fs-go">full finding ↑</span></button>`;
  }
  const P = {};

  P.overview = ()=>`
    <div class="grid g2">
      <div class="card pad"><div class="card-h"><div class="t">Findings by severity</div><div class="meta">${D.confirmed} confirmed v. evidence</div></div>${CH.donut()}</div>
      <div class="card pad"><div class="card-h"><div class="t">Jurisdiction that governs you</div></div><p style="font-family:var(--body);font-size:13px;color:#3a2d30;line-height:1.5">${D.jurisdiction}</p></div>
    </div>
    <div class="card pad" style="margin-top:14px">
      <div class="card-h"><div class="t">How your ${D.score}/100 is calculated</div><div class="meta">${D.frameworksTotal} frameworks · ${D.confirmed} evidence checks</div></div>
      <div class="grid g-7-5" style="gap:20px">
        <div><p style="font-size:13.5px;color:#3a2d30;line-height:1.55">${D.scoring.formula}</p>
          <p style="font-size:13px;color:var(--muted);margin-top:9px;line-height:1.5">${D.scoring.why}</p>
          <div class="mono" style="font-size:10px;color:var(--ox);margin-top:11px;letter-spacing:.02em;line-height:1.6">${D.scoring.inputs}</div></div>
        <div class="scorebands">${D.scoring.bands.map(b=>`<div class="sb ${b.g===D.grade[0]?'on':''}"><span class="sbg">${b.g}</span><span class="sbr">${b.r}</span><span class="sbd">${b.d}</span></div>`).join('')}</div>
      </div>
    </div>
    <div class="subhead"><span class="nt">↳</span><h3>The three you fix this quarter, Tamazia closes all three inside the first eight weeks.</h3></div>
    ${D.fixes.map((f,i)=>CH.finding(f,i===0,{id:'fx-'+(i+1)})).join('')}
    <div class="card pad" style="margin-top:15px"><div class="card-h"><div class="t">Where Tamazia takes you</div><div class="meta">projected · prior engagements</div></div>${CH.trajectory(820,150)}</div>`;

  P.regulatory = ()=>{
    // #3: only render the "breaches in full" subhead + cards when the Regulatory-filtered
    // fixes list is non-empty, otherwise the heading/subhead sit above an empty body.
    const regFixes=(D.fixes||[]).filter(f=>f.pillar==='Regulatory');
  return `
    <div class="pane-head"><span class="eyebrow">Regulatory exposure</span>
      <h2>${D.regulatoryHeadline || ('We screened all '+D.rulesChecked+' active frameworks. '+D.frameworksAssessed+' of them legally bind you, and '+D.counts.critical+' '+plur(D.counts.critical,'is','are')+' breached on your live site right now.')}</h2>
      <p>We screen all ${D.rulesChecked} active frameworks every scan; each is jurisdiction-, sector-, capability- and trigger-gated, so only the laws that genuinely attach, and where the gap is genuinely present, appear here. One box per framework; open it for the breaches, the regulator and its most recent enforcement action.</p></div>
    <div class="subhead" style="margin-top:0"><span class="nt">↳</span><h3>Your ${D.frameworksAssessed} binding frameworks${D.counts.critical>0?(', and the '+D.counts.critical+' breached on your live site right now'):''} &mdash; worst exposure first</h3></div>
    <p class="reg-sub">One box per regulator. The bar shows the severity mix; open it for every breach we evidenced on your live pages, the regulator's most recent enforcement, and the exact Tamazia fix.</p>
    ${(D.jurisdictions||[]).length>1?`<div class="jur-select"><span class="jur-lbl">Filter by jurisdiction</span><button class="jur-chip active" data-jurf="all">All</button>${D.jurisdictions.map(j=>`<button class="jur-chip" data-jurf="${j}">${j}</button>`).join('')}</div>`:''}
    ${D.frameworks.map((fw,i)=>{
      const tot=Math.max(1,fw.findings), cp=fw.c/tot*100, hp=fw.h/tot*100, sp=Math.max(0,100-cp-hp);
      return `<details class="fw" data-code="${escH(fw.code)}" data-jur="${fw.jur||'Global'}" ${i===0?'open':''}>
      <summary>
        <div class="fw-head"><span class="code">${fw.code}</span>
          <div class="fwn-wrap"><div class="fwn">${fw.name} <span class="jbadge">${fw.jur||'Global'}</span></div><div class="fwr">${fw.regulator} · ${fw.screened?'screened this scan':(fw.findings+' '+plur(fw.findings,'breach','breaches'))}</div></div>
          <div class="cnt">${fw.c?`<span class="c">${fw.c} crit</span>`:''}${fw.h?`<span class="h">${fw.h} high</span>`:''}${fw.s?`<span class="s">${fw.s} std</span>`:''}</div>
          <div class="fwe">${fw.exp}</div></div>
        <div class="fwbar"><div class="fwbar-track">${cp?`<span style="width:${cp}%;background:var(--red)"></span>`:''}${hp?`<span style="width:${hp}%;background:var(--amber)"></span>`:''}${sp?`<span style="width:${sp}%;background:var(--gold-light)"></span>`:''}</div></div>
      </summary>
      <div class="fwbody">
        <div class="lbl">Why this framework matters</div>${fw.why}
        <div class="lbl">${fw.regulator} &middot; recent enforcement</div><div class="action">${fw.action}</div>
        ${(fw.articleGroups||[]).length?`<div class="lbl">The breaches on your live site, and the Tamazia fix for each</div>
        <div class="artlist">${fw.articleGroups.map(gp=>`<div class="artgroup"><div class="art-head"><span class="art-a">${escH(gp.article)}</span>${gp.inspected.length?`<span class="art-insp">inspected ${gp.inspected.map(escH).join(', ')}</span>`:''}</div>
          <div class="art-items">${gp.items.map(it=>`<div class="art-item"><div class="art-subj"><span class="art-dot ${it.sev==='P0'?'c':it.sev==='P1'?'h':'s'}"></span>${escH(it.subject)}</div>${it.quote?`<div class="art-quote">&ldquo;${escH(it.quote)}&rdquo;</div>`:''}<div class="art-fix"><b>Tamazia fix</b> ${escH(it.fix)}</div></div>`).join('')}</div>
        </div>`).join('')}</div>`:''}
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
    ${D.seo.psiStrats?`
    <div class="subhead" style="margin-top:0"><span class="nt">↳</span><h3>SEO &amp; technical loopholes, measured live on your DOM by Google PageSpeed &mdash; desktop and mobile.</h3></div>
    ${(function(){const av=['mobile','desktop'].filter(s=>D.seo.psiStrats[s]);return av.length>1?`<div class="psi-toggle" role="tablist">${av.map(st=>`<button class="psi-tab${st===av[0]?' active':''}" data-strat="${st}" type="button" role="tab">${st==='mobile'?'Mobile':'Desktop'}</button>`).join('')}</div>`:'';})()}
    ${['mobile','desktop'].filter(s=>D.seo.psiStrats[s]).map((st,i)=>{const S=D.seo.psiStrats[st];const fail=S.cwv.filter(c=>c.st==='fail').length;return `<div class="psi-strat${i===0?' active':''}" data-strat="${st}">
      <div class="card pad" style="margin-bottom:15px"><div class="card-h"><div class="t">PageSpeed Insights</div><div class="meta">live &middot; ${st}</div></div>${CH.psiDialRow(S.dials)}</div>
      <div class="card pad" style="margin-bottom:15px"><div class="card-h"><div class="t">Core Web Vitals</div><div class="meta">${st} &middot; failing ${fail} of ${S.cwv.length}</div></div>${CH.cwvMeterRow(S.cwv)}</div>
      <div class="card pad" style="margin-bottom:15px"><div class="card-h"><div class="t">Failing audits on your live DOM</div><div class="meta">${st} &middot; ${S.audits.length} found &middot; hover the fix</div></div>${CH.psiAuditRow(S.audits,st)}</div>
    </div>`;}).join('')}`:`
    <div class="subhead" style="margin-top:0"><span class="nt">↳</span><h3>SEO &amp; technical loopholes, measured live on your DOM by Google PageSpeed.</h3></div>
    <div class="card pad" style="margin-bottom:15px">${CH.psiAuditList()}</div>
    <div class="card pad" style="margin-bottom:15px"><div class="card-h"><div class="t">PageSpeed Insights</div><div class="meta">live · mobile</div></div>${CH.psiDials()}</div>
    <div class="card pad" style="margin-bottom:15px"><div class="card-h"><div class="t">Core Web Vitals</div><div class="meta">${psiAvail?('real-user · failing '+cwvFail+' of '+cwvN):'real-user · not assessed'}</div></div>${CH.cwvMeters()}</div>`}
    <div class="grid g2">
      <div class="card pad"><div class="card-h"><div class="t">On-page issues</div><div class="meta">hover a fix</div></div>${CH.issueList(D.seo.onpage,'issue')}</div>
      <div class="card pad"><div class="card-h"><div class="t">Tech &amp; tracking</div></div>
        <div class="facts"><div class="fact"><span class="k">SSL</span><span class="v">${D.seo.tech.ssl}</span></div>
        <div class="fact"><span class="k">Mobile-ready</span><span class="v" style="color:var(--${D.seo.tech.mobile==null?'muted':(D.seo.tech.mobile?'green':'red')})">${D.seo.tech.mobile==null?'Not assessed':(D.seo.tech.mobile?'Yes':'No')}</span></div>
        <div class="fact"><span class="k">Trackers</span><span class="v">${D.seo.tech.trackers}</span></div>
        <div class="fact"><span class="k">Ad pixels</span><span class="v">${D.seo.tech.adPixels}</span></div>
        <div class="fact"><span class="k">Page weight</span><span class="v">${D.seo.tech.pageWeight}</span></div>
        <div class="fact"><span class="k">Render</span><span class="v">${D.seo.tech.render}</span></div></div>
      </div>
    </div>
    <div class="subhead"><span class="nt">↳</span><h3>Security headers &mdash; each one missing is an easy red flag in any enterprise security review.</h3></div>
    <div class="card pad">${CH.securityGrid()}</div>
    <div class="subhead"><span class="nt">↳</span><h3>${D.seo.keywordsThin?'The queries that actually fit a firm of your scale':'Keyword demand a rival is capturing'}</h3></div>
    <div class="card pad">
      ${D.seo.keywordsThin?`<div class="urgent" style="margin-bottom:13px;background:linear-gradient(100deg,var(--cream-2),#fff);border-left-color:var(--gold)"><span class="upulse" style="background:var(--gold);animation:none"></span><div><div class="ut">Local “near me” searches are not your battleground.</div><div class="us">For a firm of your size, buyers search specialist, commercial terms, not directory listings. We filtered out the low-intent and aggregator-led queries that would misrepresent you. Your real fight is brand authority and AI visibility, where the named rivals are pulling ahead.</div></div></div>`:''}
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
      <h2>${D.geo.aiKnows ? 'Are AI assistants recommending '+D.meta.company+'? You are cited, but rivals are still named alongside you on the core queries your buyers ask.' : (D.geo.citations.length>0 ? 'Are AI assistants recommending '+D.meta.company+'? Right now, no. On the core queries your buyers ask, the engines name a competitor instead.' : 'Are AI assistants recommending '+D.meta.company+'? Right now, no. The answer engines do not name you for the core queries your buyers ask yet.')}</h2>
      <p>${D.geo.rootCause?D.geo.rootCause.reason:'The answer engines decide who to name from structured signals you are missing.'} ${aiOverview}</p></div>
    ${aiCallout}
    <div class="grid g-4-8" style="margin-top:16px">
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
    <div class="grid g2" style="margin-top:15px">
      <div class="card pad"><div class="card-h"><div class="t">Structured-data gaps</div><div class="meta">what AI reads first</div></div>${CH.schemaChecklist()}</div>
      <div class="card pad"><div class="card-h"><div class="t">Authority sources you're absent from</div><div class="meta">source gap</div></div>${CH.sourceGap()}</div>
    </div>
    <div class="subhead"><span class="nt">↳</span><h3>Who AI names instead of you</h3></div>
    <div class="card pad">${CH.citationTable()}</div>
    ${(!D.seo.keywordsThin && (D.seo.keywords||[]).length>=2)?`<div class="subhead"><span class="nt">↳</span><h3>The searches you rank 20&ndash;50 for, and who AI &amp; Google name first</h3></div>
    <div class="card pad">${CH.keywordTable()}</div>`:''}
    <div class="subhead"><span class="nt">↳</span><h3>The fix, in full</h3></div>
    ${CH.finding(D.geo.fix,true)}
    <details class="gloss-mini"><summary>Plain-English glossary · ${Object.keys(D.glossary).length} terms</summary>
      <div class="glossgrid">${Object.entries(D.glossary).map(([k,v])=>`<div class="glossitem"><b>${k}</b><span>${v}</span></div>`).join('')}</div></details>`;
  };

  P.competitors = ()=>`
    <div class="pane-head"><span class="eyebrow">The firms being chosen over you</span>
      <h2>You versus the firms AI and Google name first for “${D.competitors.bestKeyword}”, and the exact move that overtakes each one.</h2>
      <p>These are the real, direct competitors the answer engines and search results put ahead of you, directories, blogs and listicles filtered out. For each, the one gap that decides it and the precise way you close it. The gap compounds every month you wait.</p></div>
    <div class="card pad" style="margin-bottom:14px"><div class="card-h"><div class="t">Head-to-head</div><div class="meta">real peers · your row highlighted</div></div>${CH.competitorTable()}</div>
    <div class="subhead"><span class="nt">↳</span><h3>How you beat each of them</h3></div>
    <div class="card pad" style="margin-bottom:14px">${(D.competitors.ladder||[]).map(c=>`<div class="beatrow"><div class="bn">${c.name}<span class="bsig">${c.signal}</span></div><div class="bb"><b>Beat them by</b> ${c.beatBy.fix} <span class="barrow">→</span> <span class="bproof">${c.beatBy.proof}</span> <span class="barrow">→</span> <span class="bmetric">${c.beatBy.metric}</span></div>${c.beatBy.lever?`<div class="blever"><span class="blk">How Tamazia wins it</span> ${c.beatBy.lever}</div>`:''}</div>`).join('')||'<div class="capt" style="margin:0">Your category was mis-classified upstream, competitor set is being re-probed for this firm.</div>'}</div>
    <div class="grid g2">
      ${D.competitors.sovBar
        ? `<div class="card pad"><div class="card-h"><div class="t">AI share of voice, you vs the firms named every run</div><div class="meta">real probe · ${D.competitors.sovBar.of} ${plur(D.competitors.sovBar.of,'run')}</div></div>${CH.bars(D.competitors.sovBar.rows,{max:D.competitors.sovBar.of,fmt:v=>v+'/'+D.competitors.sovBar.of})}</div>`
        : `<div class="card pad"><div class="card-h"><div class="t">AI citations &amp; page-one</div><div class="meta">you vs leader</div></div>${CH.bars(D.competitors.aiKwBars,{max:Math.max(2,...(D.competitors.aiKwBars||[{v:1}]).map(b=>b.v))})}</div>`}
      <div class="card pad"><div class="card-h"><div class="t">Domain rating vs rivals</div><div class="meta">0–100 authority</div></div>${CH.bars(D.competitors.drBars,{max:100})}${(D.competitors.ladder||[]).some(c=>c.drEstimated)?'<div class="capt" style="margin-top:7px">Rivals that publish no Domain Rating are shown as an <b>est</b>imate from their authority signals.</div>':''}</div>
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
      <div class="tb-label">Trusted by regulated firms across law, healthcare, property &amp; hospitality</div>
      <div class="tb-marquee"><div class="tb-track">${row}${row}</div></div>
    </div>`;
  }

  /* ---------------- PLAN + PRICING + ADD-ONS + BOOKING ---------------- */
  // Canonical pricing mirrors functions/audit/_commerce.js (PRICING_TIERS / ONE_TIME_FIX_GBP)
  // and the full ADDON_CATALOGUE. The adapter's thin D.pricing/D.addons does not carry the
  // list/pilot split, the was-prices or the outcome-led USPs, so the pane owns the display copy.
  // List prices are verbatim from src/content/pricing.ts; pilot = 0.6 x list, a compliance-safe
  // limited engagement (no countdown). Per-firm recommendation flows from D.pricing flags.
  const gbpFmt=n=>'£'+Number(n).toLocaleString('en-GB');
  // Canonical tier display mirrors the live website EXACTLY: Standard price struck through, "From" price,
  // and the 6-month savings framing. Bullets are VERBATIM headlines from src/content/pricing.ts (the pane
  // is the display owner). feats = the 4 shown collapsed; more = the rest, behind "See everything ›".
  const PRICING_TIERS_RENDER=[
    {key:'foundation',name:'Foundation',standard:3300,from:2500,saves6:4800,wk:'Single-location · local authority',
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
    {key:'authority',name:'Authority',standard:6000,from:4500,saves6:9000,wk:'Multi-location · two jurisdictions',
      blurb:'Multi-location and multi-property brands scaling organic growth across regions and jurisdictions.',
      feats:[
        'Everything in Foundation, included',
        'Every location, practice area & service line ranked simultaneously (30 keywords)',
        'GEO included as standard — your brand inside AI-generated answers',
        'The strategy that removes dependency on platforms taking 15–25% per booking',
      ],
      more:[
        'Your Instagram authority grown alongside your rankings',
        'Two jurisdictions reviewed on every piece of content simultaneously',
        'Four compliance-reviewed content pieces monthly',
        'Editorial placements in sector-relevant publications',
        'Up to three locations fully managed on Google Business Profile',
        'Regulatory monitoring across both jurisdictions, 72-hour notification',
        'Bi-weekly reporting with revenue attribution across all locations',
      ]},
    {key:'enterprise',name:'Enterprise',standard:12700,from:9500,saves6:19200,wk:'Full-stack · multi-market mandate',
      blurb:'Enterprise and regulated brands requiring full-stack SEO dominance across multiple jurisdictions.',
      feats:[
        'Everything in Authority, included',
        'Every market, territory & commercial keyword covered (50+ keywords)',
        'Your brand established as the source AI systems cite across all major engines',
        'The compliance standard applied to a Nasdaq-listed company, every jurisdiction',
      ],
      more:[
        'LinkedIn and Instagram authority grown alongside your rankings',
        'International SEO across up to five markets, full technical implementation',
        'Ten compliance-reviewed content pieces monthly',
        'Every location in your portfolio managed on Google Business Profile',
        'Crisis reputation management built before it is needed',
        'Dedicated regulatory monitoring with 24-hour notification',
        'Transaction-level revenue attribution across every market',
      ]},
  ];
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
  // Full add-on catalogue (value-only, leads with the outcome USP). Mirrors _commerce.js.
  const ADDONS=[
    {nm:'GEO / AI Search Presence', gbp:1800, was:950, unit:'mo', usp:'Appear inside ChatGPT, Perplexity, Claude, Gemini, Copilot and Google AI Overviews. AI-referred visitors arrive with high intent. The only compliance-reviewed GEO for regulated firms.', spec:['Per-engine citation measurement across all 6 engines','Entity, schema, llms.txt and Wikidata build','Compliance review of what AI says about you','Monthly share of voice against named rivals'], hero:true},
    {nm:'Cold Email Outreach Engine', gbp:1400, was:499, unit:'mo', usp:'We source 30,000 ICP-targeted leads, build a compliant template per jurisdiction, run 5 to 7 follow-ups and track every lead. The same compliance-first outbound engine, working for your pipeline.', spec:['Built on the 400+ rule compliance database','Self-healing deliverability with inbox rotation','3 to 8 percent target reply rate',coldSendRule], hero:true},
    {nm:'Compliance Monitoring', gbp:399, was:0, unit:'mo', usp:'The audit, in your inbox every month — your live position across compliance, SEO and GEO, tracked over time. The report partners quote in management meetings and quarterly board packs.', spec:['Monthly compliance + SEO + GEO position report','Catches new breaches the day the law changes','Alerts within 24 hours of a new gap','Quarterly board-ready certificate'], hot:true},
    {nm:'LinkedIn Executive Authority', gbp:1100, was:750, unit:'mo', usp:'Ghostwritten, SEO-optimised, compliance-reviewed partner posts. 4 times the conversion of company content. Ranks on LinkedIn and Google.', spec:['Dual distribution, LinkedIn and Google','8 to 12 posts per month per executive','Every post compliance-checked','Builds the named-expert E-E-A-T signal']},
    {nm:'Reputation Monitoring + Crisis', gbp:1500, was:0, unit:'mo', usp:'Real-time monitoring, pre-built suppression, 24-hour crisis response — protect the reputation your referrals and pipeline depend on, before a problem spreads.', spec:['Real-time review, mention and press monitoring','Crisis playbook on standby with the founder','Suppression architecture, not just alerting','Compliance-aware responses from minute one']},
    {nm:'GBP Domination', gbp:650, was:850, unit:'mo', usp:'30,000 or more compliance-checked map citations per location. Every listing, post and review response reviewed against '+gbpAdRule+'.', spec:['Up to 3 locations, each its own strategy','Every element checked against ad rules','Posting, Q&A and review response system','Local pack drives 44 percent of clicks']},
    {nm:'AI Entity + Knowledge Panel', gbp:1200, was:0, unit:'mo', usp:'Your machine-readable entity: Organization schema, sameAs, Wikidata and llms.txt, so AI engines identify and cite you correctly.', spec:['Wikidata entry and Knowledge Panel build','sameAs across every verified profile','Wikipedia presence where eligible','Feeds the identity layer AI reads first']},
    {nm:'Regulatory Change Alerts', gbp:199, was:0, unit:'mo', usp:'Every new ruling in your sector, the day it lands — so you move before enforcement does.', spec:['Names the exact page and rule affected','Sector and jurisdiction filtered','The earliest warning of a new obligation','Every alert is a natural brief for a fix']},
    {nm:'YMYL Content', gbp:800, was:550, unit:'piece', usp:'Per compliance-reviewed piece. Health and legal grade, held to Google\'s highest YMYL standard, not generic.', spec:['1,200 or more words, reviewed before publish','Passes your compliance function first time','Held to Google\'s YMYL standard','Cheaper than fixing content that fails review']},
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
          <div class="ptj-meta">today ${score} → week 12 ${proj[1]} → week 24 ${proj[2]} · hover a tier to see it lift</div></div>
        <div class="ptj-key"><span class="k-cur">Left to drift</span><span class="k-proj">With Tamazia</span></div>
      </div>
      <svg class="ptj-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" width="100%" height="${H}" role="img" aria-label="Projected score trajectory">
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

    // ---- £7,500 one-time fix box: stacked concrete outcomes ----
    const fixOutcomes=[
      `The top 30 critical issues solved, your ${crit} highest-severity finding${crit===1?'':'s'} closed first`,
      `A prosecution-grade re-scan of all ${D.rulesChecked} frameworks, proving every fix landed`,
      'An evidence pack your compliance committee and your insurer can file',
      'A fixed scope and a fixed price. One engagement, not a retainer',
    ];

    return `
    <div class="plan2">
    <div class="pane-head"><span class="eyebrow">The path</span>
      <h2>${crit>0?`${crit} critical finding${crit===1?'':'s'} on your live site today. Here is the price to close them`:`Here is the price to close your highest-severity gaps`}, and the trajectory once you do.</h2>
      <p>${D.pricingNotes}</p></div>

    ${planTrajectory(score,wk12,wk24,TIERS,recT.key)}

    <div class="subhead" style="margin-top:14px"><span class="nt">↳</span><h3>Start here, or scale into a mandate</h3></div>
    <div class="plan-offer">
      <div class="fixbox">
        <div class="fx-rib">Anchor offer</div>
        <div class="fx-eyebrow">One-time Fix Sprint</div>
        <h3>${crit>0?`Your ${crit} critical ${plur(crit,'finding')}, solved`:`Your highest-severity gaps, solved`}.</h3>
        <div class="fx-price"><b>${gbpFmt(7500)}</b><span>one-time, fixed scope</span></div>
        <div class="fx-anchor">Fixed scope, fixed price, productised &mdash; the same remediation a bespoke engagement delivers, without the open-ended day rate.</div>
        <ul class="fx-list">${fixOutcomes.map(o=>`<li>${o}</li>`).join('')}</ul>
        <p class="fx-line">For the firm that wants the urgent items closed first. ${crit>0?`The ${crit} ${plur(crit,'critical')} closed`:`The highest-severity gaps closed`} in 8 weeks, in priority order, starting with ${topFix.toLowerCase()}.</p>
        <a class="btn solid block fx-cta" data-book="one_time_fix">Start the Fix Sprint, ${gbpFmt(7500)} →</a>
      </div>
      <div class="tiers">
        <div class="tier-bar" role="tablist" aria-label="Recurring mandate">
          ${TIERS.map((t,i)=>`<button class="tier-tab ${i===0?'active':''}" role="tab" data-tier-tab="${i}" id="tt-${i}">${t.name}<small>From ${gbpFmt(t.from)}</small></button>`).join('')}
        </div>
        <div class="pilot-note">Each shows the standard rate struck through and your <b>“from” price</b>, the same figures as our pricing page, plus what you save across the first six months. 90-day rolling, no long-term contract.</div>
        <div class="tier-decoy"><b>Authority</b> is where most multi-location firms your size start. Foundation proves the model on one location; Enterprise is the full multi-market mandate.</div>
        <div class="price-grid">
          ${TIERS.map((t,i)=>`<div class="price tierpanel ${t.rec?'rec':''} ${i===0?'on':''}" data-tier-panel="${i}" role="tabpanel" aria-labelledby="tt-${i}">
            ${t.rec?'<span class="badge rec">Recommended for this firm</span>':''}${t.popular?'<span class="badge pop">Most popular</span>':''}
            <div class="tier">${t.name}</div><div class="blurb">${t.blurb}</div>
            <div class="pr"><span class="was">${gbpFmt(t.standard)}</span><b>From ${gbpFmt(t.from)}</b><small>/mo</small></div>
            <div class="wk">${t.wk} · 90-day rolling · saves ${gbpFmt(t.saves6)} over 6 months</div>
            <ul>${t.feats.map(f=>`<li>${f}</li>`).join('')}</ul>
            <button class="moretoggle" data-more="price">See everything included ›</button>
            <div class="more"><ul style="padding-top:6px">${t.more.map(f=>`<li>${f}</li>`).join('')}</ul></div>
            <div class="spacer"></div>
            <a class="btn ${t.rec?'solid':''} block" data-book="package" data-tier="${t.name}" style="margin-top:10px">Book a ${t.name} call →</a>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="subhead" style="margin-top:22px"><span class="nt">↳</span><h3>Add-ons, billed monthly. Hover any for the full spec.</h3>
      <span class="engnote" style="margin-left:auto">✎ Stripe checkout · selection saved to backend</span></div>
    <p class="plan-sub">Bolt any of these onto a mandate, or take them entirely on their own. ${D.upsellProof}</p>
    <div class="addon-grid">
      ${ADDONS.map(a=>`<div class="addon ${a.hero?'ag-hero':''} ${a.hot?'ag-hot':''}" tabindex="0">
        <div class="ah"><div class="an">${a.nm}</div>
          <div class="ap">${a.was?`<span class="apwas">${gbpFmt(a.was)}</span>`:''}<b>${gbpFmt(a.gbp)}</b><small>/${a.unit}</small></div></div>
        <div class="tag">${a.usp}</div>
        <div class="more"><div class="aspec-h">What you get</div><ul>${a.spec.map(s=>`<li>${s}</li>`).join('')}</ul></div>
        <div class="foot"><button class="moretoggle" data-more="addon">Full spec ›</button><a class="btn gold block" data-addon="${a.nm}" data-price="${gbpFmt(a.gbp)}" style="flex:1">Add ${a.nm.split(' ')[0]} →</a></div>
      </div>`).join('')}
    </div>

    ${trustedStrip()}

    <div class="subhead" style="margin-top:22px"><span class="nt">↳</span><h3>Two ways to start, both with the founder</h3></div>
    <div class="booking">
      <div class="bookcard"><div class="rt">Route 1 · Strategy call</div><h3>Walk the report with the founder</h3>
        <p>A 30 minute confidential session with Aman Pareek. No sales team, no discovery loop. Your tier and strongest finding are carried into the call.</p>
        <div class="cal-embed" data-cal-embed data-intent="package" data-tier="${recTier}" aria-label="Strategy call calendar"></div>
        <a class="btn solid block" data-book="package" data-tier="${recTier}">Book a strategy call →</a></div>
      <div class="bookcard"><div class="rt">Route 2 · Fix Sprint</div><h3>${crit>0?`Close the ${crit} ${plur(crit,'critical')} in 8 weeks`:`Fix the highest-severity gaps in 8 weeks`}</h3>
        <p>A single fixed-scope engagement at ${gbpFmt(7500)}, not a retainer — for the firm that wants the urgent items closed first.</p>
        <ul class="route-val">${fixOutcomes.slice(0,4).map(o=>`<li>${escH(o)}</li>`).join('')}</ul>
        <div class="route-price"><b>${gbpFmt(7500)}</b><span>one-time · fixed scope · 8 weeks</span></div>
        <a class="btn solid block fx-cta" data-book="one_time_fix">Start the Fix Sprint →</a></div>
    </div>

    <div class="card pad" style="margin-top:16px;background:var(--cream-2);border:0">
      <div class="capt" style="font-size:11px;line-height:1.6;margin:0">This is an automated marketing diagnostic from publicly observable signals (or the most recent web-archive snapshot where the live site was unreachable). The monetary figures are <b>statutory maximum fines</b>: worst-case ceilings to indicate exposure, not predictions. Not legal advice. Framework catalogue ${D.meta.catalogue}. Produced by Tamazia Ltd, London. Marketing diagnostic only.</div>
    </div>
    </div>`;
  }

  /* ---------------- VERDICT (always-visible, compact) ---------------- */
  function verdict(){
    const f=D.fixes||[];
    return `<div class="verdict">
      <div><span class="eyebrow">The verdict</span>
        <h2>${D.score} / 100 · ${D.grade}${(D._meta&&D._meta.exposureN>0)?`, with up to <span class="vexp">${D.exposure}</span> in maximum statutory penalties across the breaches evidenced on your live site.`:`, the gaps below are costing you rankings, buyers and AI visibility right now.`}</h2>
        <p>${D.exec}</p>
        <div class="vfixes">${f.slice(0,3).map((x,i)=>`<button class="vfix" data-finding="fx-${i+1}"><span class="n">${i+1}</span><span class="t">${x.title}</span><span class="e">${x.exp}</span></button>`).join('')}</div>
      </div></div>`;
  }

  /* ---------------- HERO, the charts, above the collapsed boxes ---------------- */
  function heroCharts(){
    return `<section class="hero-charts">
      <div class="subhead" style="margin:2px 0 10px"><span class="nt">↳</span><h3>Every metric we judged you on, visualised.</h3></div>
      <div class="card pad">${CH.dimCardGrid()}</div>
      <div class="grid g2" style="margin-top:12px">
        <div class="card pad"><div class="card-h"><div class="t">${(D._meta&&D._meta.exposureN>0)?'How your '+D.exposure+' exposure is really calculated':'Exposure breakdown'}</div><div class="meta">we don’t just add up ceilings</div></div>${CH.waterfall()||'<div class="capt" style="margin:0">No statutory exposure confirmed this scan, the gaps below are ranking and AI-visibility costs, not fines.</div>'}</div>
        <div class="card pad"><div class="card-h"><div class="t">Why AI can’t see ${D.meta.company}</div><div class="meta">root-cause chain</div></div>${CH.causalChain()||'<div class="capt" style="margin:0">Your identity signals are largely present, the work is to defend and deepen them.</div>'}</div>
      </div>
    </section>`;
  }

  /* ---------------- MOUNT, command deck: 6 collapsed pillars ---------------- */
  const app = document.getElementById('app');
  const SECT=[['overview','Overview'],['regulatory','Regulatory'],['seo','SEO &amp; Technical'],['geo','AI &amp; GEO'],['competitors','Competitors'],['plan','Plan &amp; Pricing']];
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
    plan:{ico:'✦',nm:'Plan &amp; pricing',kpis:chip('From '+gbpFmt(PRICING_TIERS_RENDER[0].from)+'/mo')+chip(D.counts.critical+' to fix')},
  };
  app.innerHTML = rail() + `<main class="content">
    ${verdict()}
    ${heroCharts()}
    ${SECT.map(([k])=>`<details class="pillar" id="sec-${k}" data-section="${k}"><summary><span class="pico">${SUMM[k].ico}</span><span class="pname">${SUMM[k].nm}</span><span class="pkpis">${SUMM[k].kpis}</span><span class="pchev">▸</span></summary><div class="pbody">${P[k]()}</div></details>`).join('')}
  </main>`;

  /* ---------------- NAV, one pillar open at a time ---------------- */
  function setActive(id){ document.querySelectorAll('.railnav button').forEach(b=>b.classList.toggle('active', b.dataset.pane===id)); }
  function openPillar(id){
    document.querySelectorAll('.pillar').forEach(d=>{ d.open=(d.id==='sec-'+id); });
    setActive(id);
    const el=document.getElementById('sec-'+id); if(el) scrollHeadingTop(el);
  }
  document.querySelectorAll('.railnav button').forEach(b=>b.addEventListener('click',e=>{e.preventDefault(); openPillar(b.dataset.pane);}));
  // Phase 10: a separate "Jump to pricing" control OUTSIDE .railnav (so the harness count stays 6).
  document.querySelector('.rail-jump')?.addEventListener('click',e=>{e.preventDefault(); openPillar('plan');});
  document.querySelectorAll('.pillar').forEach(d=>d.addEventListener('toggle',()=>{ if(d.open){ document.querySelectorAll('.pillar').forEach(o=>{ if(o!==d) o.open=false; }); setActive(d.dataset.section); scrollHeadingTop(d); } }));
  app.addEventListener('click',e=>{ const v=e.target.closest('[data-open]'); if(v){ e.preventDefault(); openPillar(v.dataset.open); } });
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
  let _scrollTok=0;
  function scrollHeadingTop(el){
    if(!el) return;
    const tok=++_scrollTok;
    const pin=function(){ if(tok!==_scrollTok)return; const y=Math.max(0, el.getBoundingClientRect().top+window.scrollY-12);
      try{ window.scrollTo({top:y,behavior:'instant'}); }catch(_e){ try{ window.scrollTo(0,y); }catch(_e2){} } };
    pin();
    requestAnimationFrame(function(){ pin(); requestAnimationFrame(pin); });
    setTimeout(pin, 140);
  }
  // One delegated toggle-capture handler (toggle does NOT bubble → capture). When a .fw/.finding
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
      requestAnimationFrame(function(){ scrollHeadingTop(d); });
    }
  },true);

  /* ---------------- Phase 3: clickable summaries open the ONE overview detail ---------------- */
  // Verdict chips + regulatory "breaches in full" summaries carry data-finding="fx-N". Clicking
  // opens the overview pillar, then (after the pillar's single-open settles) opens that finding
  // and pins its heading to the top. The detail exists exactly once (in overview).
  app.addEventListener('click',function(e){
    const b=e.target.closest('[data-finding]'); if(!b) return; e.preventDefault();
    const id=b.dataset.finding;
    openPillar('overview');
    requestAnimationFrame(function(){ const d=document.getElementById(id); if(d){ d.open=true; scrollHeadingTop(d); } });
  });

  /* ---------------- Phase 4: "Top N exposures" bars jump to their framework box ---------------- */
  // The bars sit inside the (already-open) regulatory pane; clicking one opens the matching
  // <details class="fw" data-code> and pins its heading to the top.
  app.addEventListener('click',function(e){
    const b=e.target.closest('[data-fwjump]'); if(!b) return; e.preventDefault();
    const t=document.querySelector('.fw[data-code="'+(b.dataset.fwjump||'').replace(/"/g,'')+'"]');
    if(t){ t.open=true; scrollHeadingTop(t); }
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
      if(mt.dataset.more==='price') mt.textContent= open?'Hide details ›':'See everything included ›';
      else mt.textContent= open?'Less spec ›':'Full spec ›'; return; }
    const bk=e.target.closest('[data-book]');
    if(bk){ e.preventDefault(); Commerce.openIntake(bk.dataset.book, bk.dataset.tier||null); return; }
    const ad=e.target.closest('[data-addon]');
    if(ad){ e.preventDefault(); Commerce.startAddon(ad.dataset.addon, ad.dataset.price||'', ad); }
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

  /* ---------------- FLOATING CTA, "Fix these now!" scrolls to the plan pane ---------------- */
  (function floatingCta(){
    const b=document.createElement('button');
    b.className='fix-fab'; b.type='button';
    b.innerHTML='<span class="ff-dot"></span>Fix these now!';
    // Phase 11: ALWAYS visible (no hide-on-open). Click opens the plan pane AND scrolls to the Fix Sprint box.
    b.addEventListener('click',()=>{ openPillar('plan'); requestAnimationFrame(()=>{ const fx=document.querySelector('#sec-plan .fixbox'); if(fx) scrollHeadingTop(fx); }); });
    document.body.appendChild(b);
  })();

  /* ============================================================
     COMMERCE, intake modal → /api/intent → Cal.com embed; add-ons → Stripe
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
          <h3>Tell us about the firm, then pick a time with the founder</h3>
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
                <option>Under £1M</option><option>£1M–£5M</option><option>£5M–£20M</option>
                <option>£20M–£100M</option><option>£100M+</option>
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
            <button type="submit" class="btn solid cmx-submit">Continue to the calendar →</button>
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
        showErr(errEl,'We could not save that just now. Please try again, or email founder@tamazia.co.uk.');
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
        const el=document.getElementById(elId); if(el) el.innerHTML='<a class="btn solid" href="https://cal.com/'+esc(slug)+'" target="_blank" rel="noopener">Open the founder\'s calendar →</a>';
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
        loadCalOnce(CAL_SLUG);
        window.Cal('init', CAL_SLUG, { origin:'https://app.cal.com' });
        const notes='Audit route: '+label+(meta.company?(' · '+meta.company):'');
        window.Cal.ns[CAL_SLUG]('inline',{ elementOrSelector:'#'+elId, config:{ layout:'month_view', notes }, calLink:CAL_SLUG });
        window.Cal.ns[CAL_SLUG]('ui',{ theme:'light', hideEventTypeDetails:true, layout:'month_view' });
      }catch(_e){
        const f=document.getElementById(elId); if(f) f.innerHTML='<a class="btn solid block" href="https://cal.com/'+esc(CAL_SLUG)+'" target="_blank" rel="noopener">Open the founder\'s calendar →</a>';
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
    async function startAddon(addon, price, btn){
      const label = btn ? btn.textContent : '';
      if(btn){ btn.classList.add('loading'); btn.textContent='Opening checkout…'; }
      let res=null;
      try{
        const r=await fetch('/api/stripe/checkout',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ addon, price, audit_domain:meta.domain||'', company:meta.company||'' })});
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
        addonFallback(addon, btn, label, 'We could not open checkout just now. Leave your details and we will sort it directly.');
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

  // notes toggle
  const nt=document.getElementById('notesToggle');
  if(nt) nt.addEventListener('click',function(){document.body.classList.toggle('no-notes');this.textContent=document.body.classList.contains('no-notes')?'Notes off':'Notes on';});
})();
