/* ============================================================
   TAMAZIA AUDIT, chart + element library (returns HTML strings)
   ============================================================ */
window.CH = (function(){
  const uid = ()=> 'x'+Math.random().toString(36).slice(2,8);
  const stCls = s => s==='fail'?'r':s==='warn'?'a':s==='pass'?'g':'n';
  // Escape any DATA-sourced string before it enters innerHTML. Lighthouse/axe titles, live evidence quotes
  // and LLM text can contain literal "<iframe>"/"<frame>"/"<", injected raw they corrupt the DOM (an axe
  // rule name once swallowed every pillar after Regulatory). Display text only; never wrap intentional markup.
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* radial gauge with gradient stroke */
  function gauge(score, grade, o={}){
    const size=o.size||150, sw=o.stroke||12, r=(size-sw)/2, c=2*Math.PI*r;
    const sc=Math.max(0,Math.min(100,+score||0));   // clamp: a non-numeric score must not make the arc NaN
    const off=c*(1-sc/100), dark=o.dark, id=uid();
    return `<div class="gauge ${dark?'on-dark':''}" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#C9A87C"/><stop offset=".55" stop-color="#7A2A3B"/><stop offset="1" stop-color="#B3261E"/>
        </linearGradient></defs>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${dark?'rgba(255,255,255,.13)':'#EFE6D8'}" stroke-width="${sw}"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${sw}" stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size/2} ${size/2})"/>
      </svg>
      <div class="ctr"><div class="grade" style="font-size:${Math.round(size*.3)}px;color:${dark?'#fff':'var(--ox)'}">${grade}</div>
      <div class="sc">${score}/100</div></div></div>`;
  }

  /* small dial (0-100) for PSI/sub-scores */
  function dial(v, label, o={}){
    v=Math.max(0,Math.min(100,+v||0));   // clamp 0–100 so a missing sub-score can't NaN the arc
    const size=o.size||78, sw=8, r=(size-sw)/2, c=2*Math.PI*r, off=c*(1-v/100);
    const col = v>=75?'#2F7A4A':v>=45?'#B6791F':'#B3261E';
    return `<div style="text-align:center"><div class="gauge" style="width:${size}px;height:${size}px;margin:0 auto">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#EFE6D8" stroke-width="${sw}"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size/2} ${size/2})"/>
      </svg><div class="ctr"><div class="num" style="font-size:${size*.28}px;color:${col}">${v}</div></div></div>
      <div class="mono" style="font-size:9px;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;margin-top:5px">${label}</div></div>`;
  }

  /* gradient horizontal bars */
  function bars(data, o={}){
    data = Array.isArray(data)?data:[];
    // Guard the denominator: empty data or all-zero values must never yield 0/-Infinity (→ NaN widths).
    const rawMax = o.max||Math.max(0,...data.map(d=>+d.v||0)), max=rawMax>0?rawMax:1, unit=o.unit||'', fmt=o.fmt||(v=>v);
    return `<div class="barset">${data.map(d=>{
      const w=Math.max(3,((+d.v||0)/max)*100);
      return `<div class="bar-row"><div class="lbl ${d.you?'you':''}">${d.l}</div>
        <div class="bar-track"><div class="bar-fill ${d.you?'gold':d.cls||''}" style="width:${w}%"></div></div>
        <div class="val ${d.you?'':(d.v/max>=.55?'red':'')}">${fmt(d.v)}${unit}</div></div>`;
    }).join('')}</div>`;
  }

  /* exposure £ bars */
  function exposureBars(){
    return bars(D.exposureBars.map(b=>({l:b.l, v:b.v})), {max:18, fmt:v=> v>=1?'£'+v+'M':'£'+(v*1000)+'k'});
  }

  /* 5x5 risk heatmap */
  function heatmap(){
    let h='<div class="heat">';
    for(let r=0;r<5;r++){
      h+=`<div class="axL">${D.heatRows[r]}</div>`;
      for(let cI=0;cI<5;cI++){
        const v=D.heat[r][cI], risk=(4-r)+cI;
        let cls='h0'; if(v>0) cls= risk>=7?'h4':risk>=5?'h3':risk>=3?'h2':'h1';
        h+=`<div class="cell ${cls}">${v||''}</div>`;
      }
    }
    h+='<div class="blank"></div>'; D.heatCols.forEach(c=> h+=`<div class="axB">${c}</div>`);
    return h+'</div>';
  }

  /* AI visibility radar */
  function radar(axes, size=210){
    const cx=size/2, cy=size/2, R=size*0.36, n=axes.length, id=uid();
    const ang=i=>(-90 + i*360/n)*Math.PI/180, pt=(i,rad)=>[cx+rad*Math.cos(ang(i)), cy+rad*Math.sin(ang(i))];
    let grid='',ax='',lab='';
    [.25,.5,.75,1].forEach(f=>{ grid+=`<polygon points="${axes.map((_,i)=>pt(i,R*f).map(x=>x.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#E4DACE" stroke-width="1"/>`; });
    axes.forEach((a,i)=>{ const [x,y]=pt(i,R); ax+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#E4DACE" stroke-width="1"/>`;
      const [lx,ly]=pt(i,R+15); const anc=Math.abs(lx-cx)<6?'middle':(lx>cx?'start':'end');
      lab+=`<text x="${lx}" y="${ly}" font-family="JetBrains Mono" font-size="8" fill="#6E625F" text-anchor="${anc}" dominant-baseline="middle">${a.ax} ${a.v}</text>`; });
    const vp=axes.map((a,i)=>pt(i,R*Math.max(a.v,2)/100).map(x=>x.toFixed(1)).join(',')).join(' ');
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible">
      <defs><radialGradient id="${id}"><stop offset="0" stop-color="#C9A87C" stop-opacity=".55"/><stop offset="1" stop-color="#B3261E" stop-opacity=".5"/></radialGradient></defs>
      ${grid}${ax}<polygon points="${vp}" fill="url(#${id})" stroke="#7A2A3B" stroke-width="1.5"/>${lab}</svg>`;
  }

  /* trajectory line w/ area fill */
  function trajectory(w=520,h=130){
    const pad=34, iW=w-pad*2, iH=h-34, id=uid();
    const T=Array.isArray(D.trajectory)?D.trajectory:[], denom=Math.max(1,T.length-1);   // never divide by 0 (single point)
    const xs=T.map((_,i)=>pad+iW*i/denom);
    const ys=T.map(p=>(h-20)-(Math.max(0,Math.min(100,+p.v||0))/100)*iH);
    const line=xs.map((x,i)=>`${i?'L':'M'}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
    const area=xs.length?`${line} L${xs[xs.length-1].toFixed(1)} ${h-20} L${xs[0].toFixed(1)} ${h-20} Z`:'';
    let dots=''; xs.forEach((x,i)=> dots+=`<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="5" fill="${i===0?'#B3261E':i===xs.length-1?'#2F7A4A':'#7A2A3B'}" stroke="#fff" stroke-width="2"/>`);
    return `<div class="traj-wrap"><svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9A87C" stop-opacity=".42"/><stop offset="1" stop-color="#C9A87C" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#${id})"/><path d="${line}" fill="none" stroke="#7A2A3B" stroke-width="2.5"/>${dots}</svg>
      <div class="traj-pts">${T.map((p,i)=>`<div class="traj-pt ${i===0?'now':i===T.length-1?'end':''}"><b>${p.v}</b>${p.x} · ${p.g}</div>`).join('')}</div></div>`;
  }

  /* findings donut */
  function donut(){
    const t=D.counts.total||0, c=t?D.counts.critical/t*100:0, h=t?(D.counts.critical+D.counts.high)/t*100:0;
    return `<div style="display:flex;align-items:center;gap:18px">
      <div style="width:118px;height:118px;border-radius:50%;background:conic-gradient(var(--red) 0 ${c}%,var(--amber) ${c}% ${h}%,var(--gold) ${h}% 100%);display:grid;place-items:center">
        <div style="width:74px;height:74px;border-radius:50%;background:var(--paper);display:grid;place-items:center;text-align:center">
          <div><div class="num" style="font-size:23px">${t}</div><div class="mono" style="font-size:8px;color:var(--muted);letter-spacing:.06em">FINDINGS</div></div></div></div>
      <div style="display:flex;flex-direction:column;gap:9px">
        ${[['r','Critical',D.counts.critical],['a','High',D.counts.high],['g','Standard',D.counts.standard]].map(([d,l,v])=>
        `<div style="display:flex;align-items:baseline;gap:8px;line-height:1"><span class="dot ${d}" style="${d==='g'?'background:var(--gold)':''}"></span><span class="mono" style="font-size:11px">${l}</span><b class="num" style="font-size:15px;margin-left:auto">${v}</b></div>`).join('')}
      </div></div>`;
  }

  /* status pill */
  function pill(st){ const m={fail:'Fail',warn:'Needs work',pass:'Pass',na:'Not assessed'}; return `<span class="pill ${st}">${m[st]}</span>`; }

  /* dimension scorecard rows with mini-bar */
  function dimScorecard(){
    return `<div>${D.dims.map(d=>`<div class="dimrow">
      <div style="min-width:0"><div class="nm">${d.nm}</div><div class="sub">${d.sub}</div>
      <div class="bar-track" style="height:5px;margin-top:6px"><div class="bar-fill ${d.st==='fail'?'':d.st==='warn'?'amber':'gold'}" style="width:${d.v}%"></div></div></div>
      ${pill(d.st)}</div>`).join('')}</div>`;
  }

  /* CWV meter rows */
  function cwvMeters(){
    return `<div style="display:flex;flex-direction:column;gap:13px">${D.seo.cwv.map(m=>`
      <div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px">
          <span class="mono" style="font-size:10px;letter-spacing:.04em;color:var(--ink)"><b>${m.k}</b> · ${m.label}</span>
          <span><b class="num" style="font-size:16px;color:var(--${stCls(m.st)==='r'?'red':stCls(m.st)==='a'?'amber':'green'})">${m.v}</b> <span class="mono" style="font-size:9px;color:var(--muted-2)">target ${m.target}</span></span>
        </div>
        <div class="bar-track" style="height:7px;margin:5px 0 4px"><div class="bar-fill ${m.st==='warn'?'amber':''}" style="width:${m.pct}%"></div></div>
        <div class="capt">${m.plain}</div>
      </div>`).join('')}</div>`;
  }

  /* PSI category dials */
  function psiDials(){
    const p=D.seo.psi;
    return `<div style="display:flex;justify-content:space-around;gap:8px;flex-wrap:wrap">
      ${dial(p.performance,'Performance')}${dial(p.seo,'SEO')}${dial(p.security,'Security')}${dial(p.mobile,'Mobile')}</div>`;
  }

  /* generic issue list (onpage / security) */
  function issueList(items, keyName){
    return `<div class="issuelist">${items.map(it=>`
      <div class="issrow"><span class="dot ${it.sev==='crit'||it.sev==='high'?(it.sev==='crit'?'r':'a'):'n'}"></span>
        <div><div class="iss-t">${esc(it[keyName]||it.issue||it.h)}</div>
        <div class="iss-s">${esc(it.impact||it.note||'')}</div></div>
        ${it.fix?`<span class="iss-fix" data-tip="${it.fix.replace(/"/g,'&quot;')}">Tamazia fix ›</span>`:`<span class="mono" style="font-size:9px;color:${it.present?'var(--green)':'var(--red)'}">${it.present?'present':'missing'}</span>`}
      </div>`).join('')}</div>`;
  }

  /* security headers grid */
  function securityGrid(){
    return `<div class="secgrid">${D.seo.security.map(s=>`
      <div class="seccell ${s.present?'ok':'no'}"><div class="mono" style="font-size:10px;font-weight:500">${s.h}</div>
      <div class="mono" style="font-size:8px;letter-spacing:.04em;color:${s.present?'var(--green)':'var(--red)'};text-transform:uppercase">${s.present?'present':'missing'}</div>
      <div class="capt" style="margin-top:4px">${s.note}</div></div>`).join('')}</div>`;
  }

  /* AI engine grid */
  const ENG_SLUG={'ChatGPT':'chatgpt','Gemini':'gemini','Perplexity':'perplexity','Claude':'claude','Copilot':'copilot','Grok':'grok','Meta AI':'meta-ai','Google AI':'google-ai'};
  function engineGrid(){
    return `<div class="enggrid">${D.geo.engines.map(e=>{
      const slug=ENG_SLUG[e.nm]||String(e.nm||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
      return `<div class="engcell ${e.cites?'':'no'}"><div class="eng-id"><img class="eng-logo" src="/audit/engine-logos/${slug}.svg" alt="" loading="lazy" width="20" height="20" onerror="this.style.display='none'" style="width:20px;height:20px;object-fit:contain;${e.cites?'':'opacity:.42;filter:grayscale(1)'}"><span class="eng-nm" style="font-family:var(--mono);font-size:10px;color:var(--ink)">${esc(e.nm)}</span></div>
      <div class="num" style="font-size:18px;color:var(--${e.readiness<20?'red':'ox'})">${e.readiness}</div>
      <div class="st">${e.cites?'✓ citing you':'✕ not citing'}</div></div>`;
    }).join('')}</div>`;
  }

  /* schema checklist */
  function schemaChecklist(){
    return `<div class="checklist">${D.geo.schema.map(s=>`
      <div class="checkrow"><span class="xmark">${s.present?'✓':'✕'}</span>
      <div><span class="mono" style="font-size:11px;color:var(--ink)">${s.t}</span>
      <div class="capt">${s.why}</div></div></div>`).join('')}</div>`;
  }

  /* source gap */
  function sourceGap(){
    return `<div class="checklist">${D.geo.sourceGap.map(s=>{
      const ok = s.you===true, part = s.you==='partial'||s.you==='unverified';
      return `<div class="checkrow"><span class="xmark" style="color:var(--${ok?'green':part?'amber':'red'})">${ok?'✓':part?'~':'✕'}</span>
      <div><span class="mono" style="font-size:11px;color:var(--ink)">${s.src}</span><div class="capt">${s.note}</div></div></div>`;
    }).join('')}</div>`;
  }

  /* competitor comparison table */
  function competitorTable(){
    const c=D.competitors;
    return `<table class="tz-table cmp"><thead><tr><th>Firm</th>${c.cols.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>
      ${c.rows.map(r=>`<tr class="${r.you?'you-row':''}">
        <td><b>${r.name}</b>${r.you?' <span class="mono" style="font-size:8px;color:var(--red)">YOU</span>':''}</td>
        ${(r.cells||[]).map(cell=>`<td><span class="cmpv ${cell.cls||(r.you?'bad':'good')}">${cell.v}</span></td>`).join('')}
      </tr>`).join('')}</tbody></table>`;
  }

  /* citation / keyword tables */
  function citationTable(){
    return `<table class="tz-table"><thead><tr><th>Buyer asks AI…</th><th>You</th><th>AI names instead</th></tr></thead><tbody>
      ${D.geo.citations.map(c=>`<tr><td>${c.q}</td><td class="nr">Not cited</td><td><b style="color:var(--ox)">${c.who}</b>${c.pos?` <span class="rk">#${c.pos}</span>`:''}</td></tr>`).join('')}</tbody></table>`;
  }
  function keywordTable(){
    return `<table class="tz-table"><thead><tr><th>Keyword</th><th>Volume</th><th>You</th><th>Who ranks</th></tr></thead><tbody>
      ${D.seo.keywords.map(k=>`<tr><td>${k.kw}</td><td class="rk">${k.vol}</td><td class="${k.you==='#1'?'':'nr'}" style="${k.you==='#1'?'color:var(--green);font-family:var(--mono);font-size:11px':''}">${k.you}</td><td>${k.who===', '?'<span class="rk">, </span>':k.who+(k.pos?' <span class="rk">'+k.pos+'</span>':'')}</td></tr>`).join('')}</tbody></table>`;
  }

  /* big stat tile */
  function stat(v,l,o={}){ return `<div class="kpi ${o.red?'red':''} ${o.dark?'on-dark':''}" style="${o.align?'align-items:'+o.align:''}"><div class="v" style="${o.size?'font-size:'+o.size+'px':''}">${v}</div><div class="l">${l}</div></div>`; }

  /* urgency callout */
  function urgent(text, sub){
    return `<div class="urgent"><span class="upulse"></span><div><div class="ut">${text}</div>${sub?`<div class="us">${sub}</div>`:''}</div></div>`;
  }

  /* bingo finding card (7 layers) */
  function finding(f, open=false){
    f = Object.assign({n:0,reg:'',title:'Finding',exp:'',quote:'',plain:'',law:'',prec:'',fix:'',plan:'',shot:''}, f||{});
    // A money exposure (starts with £) carries the "statutory ceiling" caption; a ranking-impact finding
    // must NOT (calling "ranking impact" a statutory ceiling is nonsensical). (exposure-label consistency)
    const isMoney = /^£/.test(String(f.exp||''));
    const expCaption = isMoney ? 'statutory ceiling · evidence-locked' : 'ranking, AI-visibility & trust cost, not a statutory fine';
    return `<details class="finding" ${open?'open':''}>
      <summary><span class="sev ${f.n===3?'a':''}"></span>
        <span class="ftitle"><span class="tag">${esc(f.reg)}</span>${esc(f.title)}</span>
        <span style="display:flex;align-items:center;gap:10px"><span class="fexp">${f.exp}</span><span class="chev">▸</span></span></summary>
      <div class="fbody">
        <div class="layer"><div class="lk">① Live error</div><div class="lv"><div class="shot" style="background:#fff;padding:0;min-height:auto;overflow:hidden;position:relative;border-color:var(--line-2)">${f.shot?`<img src="${f.shot}" loading="lazy" referrerpolicy="no-referrer" alt="live screenshot of ${D.meta.domain}" style="width:100%;display:block">`:`▣ screenshot pending for ${D.meta.domain}`}<span style="position:absolute;top:8px;left:8px;background:var(--red);color:#fff;font-family:var(--mono);font-size:8px;letter-spacing:.07em;padding:3px 7px;border-radius:5px;box-shadow:0 2px 8px rgba(0,0,0,.25)">● LIVE · YOUR SITE</span></div>${f.quote?`<span class="quote" style="display:block;margin-top:9px">${esc(f.quote)}</span>`:''}</div></div>
        <div class="layer"><div class="lk">② What it means</div><div class="lv">${esc(f.plain)}</div></div>
        <div class="layer"><div class="lk">③ The law</div><div class="lv"><b>${esc(f.law)}</b></div></div>
        ${f.prec?`<div class="layer"><div class="lk">④ Past ruling</div><div class="lv">${esc(f.prec)}</div></div>`:''}
        <div class="layer"><div class="lk">⑤ Exposure</div><div class="lv"><span class="num" style="font-size:17px;color:var(--red)">${f.exp}</span> <span class="mono" style="font-size:9px;color:var(--muted)">${expCaption}</span></div></div>
        <div class="layer fix"><div class="lk">⑥ Tamazia fix</div><div class="lv">${esc(f.fix)}</div></div>
        <div class="layer"><div class="lk">⑦ Plan</div><div class="lv mono" style="font-size:11px;color:var(--muted)">${f.plan}</div></div>
      </div></details>`;
  }

  /* ---- money + deterministic regulator-badge colour ---- */
  function money(n){n=Math.round(+n||0); if(n>=1e6){const m=n/1e6;return '£'+(m>=10?Math.round(m):m.toFixed(1).replace(/\.0$/,''))+'M';} if(n>=1e3)return '£'+Math.round(n/1e3)+'k'; return '£'+n;}
  function badgeColor(code){const pal=['#5A1A2B','#2A5DA8','#2F7A4A','#B6791F','#7A2A3B','#8A1C16','#3a2d30','#2A0C14'];let h=0;for(const ch of String(code||'FW'))h=(h*31+ch.charCodeAt(0))>>>0;return pal[h%pal.length];}

  /* ---- rich 10-dimension scorecard card grid (Pass · Needs work · Fail) ---- */
  function dimCardGrid(){
    const lab={pass:'Pass',warn:'Needs work',fail:'Fail',na:'Not assessed'};
    return `<div class="dimgrid">${D.dims.map(d=>{
      const w=d.st==='na'?0:Math.max(4,d.v||0);
      return `<div class="dimcard ${d.st}"><div class="dch"><span class="dcn">${d.nm}</span><span class="pill ${d.st}">${lab[d.st]||d.st}</span></div>
        <div class="bar-track" style="height:5px;margin:7px 0 8px"><div class="bar-fill ${d.st==='fail'?'':d.st==='warn'?'amber':'gold'}" style="width:${w}%"></div></div>
        <div class="dcs">${d.sub||''}</div></div>`;
    }).join('')}</div>`;
  }

  /* ---- exposure waterfall: how the honest number is reached ---- */
  function waterfall(){
    const wf=D.exposureWaterfall; if(!wf||!wf.steps||wf.raw<=0) return '';
    const max=wf.raw||1;
    return `<div class="wf">${wf.steps.map(s=>`<div class="wf-row"><div class="wf-l">${s.l}</div>
      <div class="bar-track"><div class="bar-fill ${s.cls==='gold'?'gold':s.cls==='amber'?'amber':''}" style="width:${Math.max(3,(s.v/max)*100)}%"></div></div>
      <div class="wf-v ${s.final?'final':''}">${money(s.v)}</div></div>`).join('')}
      ${wf.savedPct>0?`<div class="wf-note">We collapse overlapping data-protection ceilings instead of stacking them, removing <b>${wf.savedPct}%</b> of the figure a naïve "add-it-all-up" audit would quote. <b>${money(wf.collapsed)}</b> is the number a regulator's GC would accept.</div>`:''}</div>`;
  }

  /* ---- GEO "why AI can't see you" causal chain ---- */
  function causalChain(){
    const rc=D.geo&&D.geo.rootCause; if(!rc) return '';
    return `<div class="causal">${rc.chain.map((c,i)=>`<div class="cc-node ${c.ok?'ok':'bad'}"><div class="cc-k">${esc(c.k)}</div><div class="cc-v">${esc(c.v)}</div></div>${i<rc.chain.length-1?'<div class="cc-arrow">→</div>':''}`).join('')}</div>
      <div class="cc-reason">${esc(rc.reason)}</div>`;
  }

  /* ---- element-level PSI evidence (real failing DOM nodes) ---- */
  function psiAuditList(){
    const a=(D.seo&&D.seo.psiAudits)||[];
    if(!a.length) return `<div class="capt" style="margin:0">Google PageSpeed could not deep-read your site this scan, a re-scan captures the element-level evidence (failing nodes, savings).</div>`;
    return `<div class="psi-list">${a.map(x=>`<div class="psi-row"><div class="psi-h"><span class="psi-t">${esc(x.title)}</span><span class="psi-lane l-${x.laneKey}">${esc(x.lane)}</span></div>
      <div class="psi-ev">Evidence · Google PageSpeed (mobile) · <span class="mono">${esc(x.id)}</span>${x.disp?' · '+esc(x.disp):''}${x.nodes?' · '+x.nodes+' element'+(x.nodes>1?'s':''):''}</div>
      ${x.sel?`<div class="psi-sel mono">${esc(x.sel)}</div>`:''}
      ${x.wcag?`<div class="psi-wcag">⚖ ${esc(x.wcag)}, enforceable under ADA Title III &amp; the EU Accessibility Act</div>`:''}
      <div class="psi-fix"><b>Tamazia fix</b> ${esc(x.fix)}</div></div>`).join('')}</div>`;
  }

  /* ---- framework severity bars + regulator badges ("Your top N regulatory exposures") ---- */
  function frameworkBars(){
    return `<div class="fwbars">${D.frameworks.map(f=>{
      const tot=Math.max(1,f.findings), cp=f.c/tot*100, hp=f.h/tot*100, sp=Math.max(0,100-cp-hp);
      const exp=(f.exp&&(String(f.exp)[0]==='£'))?f.exp:(f.exp==='ranking'?'ranking impact':f.exp);
      return `<div class="fwbar"><div class="fwbar-h"><span class="reg-badge" style="background:${badgeColor(f.code)}">${esc(f.code)}</span>
        <div class="fwbar-nm"><b>${esc(f.name)}</b><span class="fwbar-r">${esc(f.regulator)} · ${f.findings} finding${f.findings===1?'':'s'} · ${esc(exp)}</span></div>
        <div class="cnt">${f.c?`<span class="c">${f.c} crit</span>`:''}${f.h?`<span class="h">${f.h} high</span>`:''}${f.s?`<span class="s">${f.s} std</span>`:''}</div></div>
        <div class="fwbar-track">${cp?`<span style="width:${cp}%;background:var(--red)"></span>`:''}${hp?`<span style="width:${hp}%;background:var(--amber)"></span>`:''}${sp?`<span style="width:${sp}%;background:var(--gold-light)"></span>`:''}</div></div>`;
    }).join('')}</div>`;
  }

  return {gauge,dial,bars,exposureBars,heatmap,radar,trajectory,donut,pill,dimScorecard,dimCardGrid,
    waterfall,causalChain,psiAuditList,frameworkBars,
    cwvMeters,psiDials,issueList,securityGrid,engineGrid,schemaChecklist,sourceGap,
    competitorTable,citationTable,keywordTable,stat,urgent,finding};
})();
