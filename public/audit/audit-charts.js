/* ============================================================
   TAMAZIA AUDIT, chart + element library (returns HTML strings)
   ============================================================ */
window.CH = (function(){
  const uid = ()=> 'x'+Math.random().toString(36).slice(2,8);
  const stCls = s => s==='fail'?'r':s==='warn'?'a':s==='pass'?'g':'n';
  // Escape any DATA-sourced string before it enters innerHTML. Lighthouse/axe titles, live evidence quotes
  // and LLM text can contain literal "<iframe>"/"<frame>"/"<", injected raw they corrupt the DOM (an axe
  // rule name once swallowed every pillar after Regulatory). Display text only; never wrap intentional markup.
  // De-dash THEN escape: neutralise any em/en dash baked into an engine payload (PSI fix text, evidence quote,
  // competitor name) to a comma at the render chokepoint, per the founder's "no dashes anywhere" rule. Regular
  // hyphens are left intact.
  const esc = s => String(s==null?'':s).replace(/\s*[—–]\s*/g, ', ').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

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
    const size=o.size||78, sw=8, r=(size-sw)/2, c=2*Math.PI*r;
    // A metric the scan could not assess arrives as null/undefined/NaN. Render a neutral "n/a" dial
    // (grey ring, no score arc, no red 0) rather than a misleading red 0/100. (PSI-availability)
    const na = (v==null || isNaN(+v));
    if(na){
      return `<div style="text-align:center"><div class="gauge" style="width:${size}px;height:${size}px;margin:0 auto">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#EFE6D8" stroke-width="${sw}"/>
        </svg><div class="ctr"><div class="num" style="font-size:${size*.2}px;color:var(--muted)">n/a</div></div></div>
        <div class="mono" style="font-size:9px;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;margin-top:5px">${label}</div>
        <div class="mono" style="font-size:8px;color:var(--muted-2);letter-spacing:.04em">not assessed</div></div>`;
    }
    v=Math.max(0,Math.min(100,+v||0));   // clamp 0–100 so a missing sub-score can't NaN the arc
    const off=c*(1-v/100);
    const col = v>=75?'#2F7A4A':v>=45?'#B6791F':'#B3261E';
    return `<div style="text-align:center"><div class="gauge" style="width:${size}px;height:${size}px;margin:0 auto">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#EFE6D8" stroke-width="${sw}"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size/2} ${size/2})"/>
      </svg><div class="ctr"><div class="num" style="font-size:${size*.28}px;color:${col}">${v}</div></div></div>
      <div class="mono" style="font-size:9px;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;margin-top:5px">${label}</div></div>`;
  }

  /* tiny "data unavailable" note shared by charts that must degrade rather than draw an empty frame */
  function naNote(t){ return `<div class="capt" style="margin:0;color:var(--muted)">${t||'Not available for this scan.'}</div>`; }

  /* FREEMIUM LOCK — wrap a Tamazia-fix value behind a green-gradient blur + lock veil. The "Tamazia fix" label
     above stays visible as the teaser; the prose is blurred, and clicking the veil opens Route 3 (unlock). When
     window.D.unlocked is true (a successful Route 3 payment unlocked the whole link), the fix renders in full for
     everyone. Used ONLY on the finding fix, the PSI fix and the regulatory art-fix — NEVER on the beat-cards. */
  function lockFix(innerHTML, locked){
    // Per-group half-visible model: a call site passes locked=false for the first ⌈N/2⌉ fixes (free) and
    // locked=true for the last ⌊N/2⌋. Omitting the arg keeps the old "always lock" behaviour (back-compat).
    // A successful Route 3 payment (window.D.unlocked) opens everything regardless of the flag.
    if (locked === false || (window.D && window.D.unlocked)) return '<div class="tz-fixv">'+innerHTML+'</div>';
    return '<div class="tz-lock"><div class="tz-lock-blur tz-fixv">'+innerHTML+'</div>'
      +'<div class="tz-lock-veil" role="button" tabindex="0" aria-label="Unlock the full report, first month free">'
      +'<svg class="tz-lock-ic" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
      +'<span class="tz-lock-t">Unlock the fix</span></div></div>';
  }

  /* gradient horizontal bars */
  function bars(data, o={}){
    data = Array.isArray(data)?data:[];
    // Comparison bars are meaningless with no rival to compare against. When the adapter hands an empty
    // array (or a flag), or only the lone "You" bar survives, degrade to a short note instead of drawing a
    // single-bar chart that reads as broken. (DR-vs-rivals / sparse-comparison) — generic callers with real
    // multi-bar data are unaffected; opt-in via o.compare for charts that should keep a single bar.
    const onlyYou = data.length===1 && data[0] && data[0].you;
    if(o.drHidden || data.length===0 || (onlyYou && o.compare!==false)){
      return naNote(o.naText || 'Comparison data not available for this scan.');
    }
    // Guard the denominator: empty data or all-zero values must never yield 0/-Infinity (↗ NaN widths).
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
    axes=Array.isArray(axes)?axes:[];
    // With <3 axes the polygon math (360/n) degenerates / divides by zero and draws an empty broken frame.
    if(axes.length<3) return naNote('AI-visibility signals not available for this scan.');
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
    if(!T.length) return naNote('Trajectory projection not available for this scan.');   // no points ↗ no empty frame
    const xs=T.map((_,i)=>pad+iW*i/denom);
    const ys=T.map(p=>(h-20)-(Math.max(0,Math.min(100,+p.v||0))/100)*iH);
    const line=xs.map((x,i)=>`${i?'L':'M'}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
    const area=xs.length?`${line} L${xs[xs.length-1].toFixed(1)} ${h-20} L${xs[0].toFixed(1)} ${h-20} Z`:'';
    let dots=''; xs.forEach((x,i)=> dots+=`<circle cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="5" fill="${i===0?'#B3261E':i===xs.length-1?'#2F7A4A':'#7A2A3B'}" stroke="#fff" stroke-width="2"/>`);
    return `<div class="traj-wrap"><svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}">
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

  /* CWV — compact 2-up chip grid (value big, target small, 4px bar, plain-English on hover). ~60% shorter. */
  function cwvMeters(){
    return `<div class="cwvgrid">${(D.seo.cwv||[]).map(m=>{
      const col=stCls(m.st)==='r'?'red':stCls(m.st)==='a'?'amber':'green';
      return `<div class="cwvchip" data-tip="${esc(String(m.plain||'')).replace(/"/g,'&quot;')}">
        <div class="cwv-k"><b>${esc(m.k)}</b> · ${esc(m.label)}</div>
        <div class="cwv-v num" style="color:var(--${col})">${esc(m.v)}<span class="cwv-t mono">target ${esc(m.target)}</span></div>
        <div class="bar-track cwv-bar"><div class="bar-fill ${m.st==='warn'?'amber':''}" style="width:${m.pct}%"></div></div>
      </div>`;
    }).join('')}</div>`;
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
    // present===null/undefined => site was not reachably scanned (not assessed). Never show the risk note
    // when a header is PRESENT (that was the self-contradiction: "present" + "…missing/exposed" beneath it).
    return `<div class="secgrid">${D.seo.security.map(s=>{
      const na=(s.present===null||s.present===undefined);
      const stt=na?'not assessed':(s.present?'present':'missing');
      const col=na?'var(--ink)':(s.present?'var(--green)':'var(--red)');
      const note=na?'Not assessed, your site was not reachably scanned this run.':(s.present?'Present and correctly configured.':s.note);
      return `<div class="seccell ${na?'':(s.present?'ok':'no')}"><div class="mono" style="font-size:10px;font-weight:500">${s.h}</div>
      <div class="mono" style="font-size:8px;letter-spacing:.04em;color:${col};text-transform:uppercase;${na?'opacity:.6':''}">${stt}</div>
      <div class="capt" style="margin-top:4px">${note}</div></div>`;
    }).join('')}</div>`;
  }

  /* AI engine grid */
  const ENG_SLUG={'ChatGPT':'chatgpt','Gemini':'gemini','Perplexity':'perplexity','Claude':'claude','Copilot':'copilot','Grok':'grok','Meta AI':'meta-ai','Google AI':'google-ai'};
  const ENG_LOGO={"chatgpt":"<svg width=\"20\" height=\"20\" style=\"display:block\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"currentColor\" role=\"img\" aria-label=\"ChatGPT\"><title>ChatGPT</title><path d=\"M21.18 9.83a5.6 5.6 0 0 0-.49-4.6 5.69 5.69 0 0 0-6.12-2.72A5.62 5.62 0 0 0 4.9 4.55a5.6 5.6 0 0 0-3.75 2.72 5.68 5.68 0 0 0 .7 6.66 5.6 5.6 0 0 0 .49 4.61 5.69 5.69 0 0 0 6.12 2.72 5.6 5.6 0 0 0 4.23 1.89 5.69 5.69 0 0 0 5.42-3.94 5.6 5.6 0 0 0 3.75-2.72 5.68 5.68 0 0 0-.7-6.66Zm-8.49 11.86a4.21 4.21 0 0 1-2.7-.98l.13-.07 4.49-2.6a.74.74 0 0 0 .37-.63v-6.34l1.9 1.1v5.24a4.23 4.23 0 0 1-4.19 4.28Zm-9.06-3.87a4.22 4.22 0 0 1-.5-2.83l.13.08 4.49 2.6a.73.73 0 0 0 .73 0l5.49-3.17v2.19l-4.55 2.63a4.23 4.23 0 0 1-5.78-1.5Zm-1.18-9.8A4.21 4.21 0 0 1 4.66 6.2v5.33a.73.73 0 0 0 .37.63l5.48 3.17-1.9 1.1L4.07 13.9a4.23 4.23 0 0 1-1.62-5.88Zm15.6 3.63-5.49-3.18 1.9-1.09 4.55 2.62a4.22 4.22 0 0 1-.65 7.62v-5.34a.74.74 0 0 0-.37-.63ZM20.43 7.7l-.13-.08-4.48-2.62a.74.74 0 0 0-.74 0L9.6 8.18V5.99l4.54-2.62a4.22 4.22 0 0 1 6.28 4.37ZM8.56 12.6l-1.9-1.1V6.26a4.22 4.22 0 0 1 6.92-3.24l-.13.07-4.49 2.6a.73.73 0 0 0-.37.63Zm1.03-2.23 2.45-1.41 2.45 1.41v2.83l-2.45 1.41-2.45-1.41Z\"/></svg>","claude":"<svg width=\"20\" height=\"20\" style=\"display:block\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"currentColor\" role=\"img\" aria-label=\"Claude\"><title>Claude</title><path d=\"M12 2.2c.28 3.05.62 4.27 1.46 5.1.85.85 2.07 1.19 5.12 1.47-3.05.28-4.27.62-5.12 1.46-.84.84-1.18 2.06-1.46 5.11-.28-3.05-.62-4.27-1.46-5.11-.85-.84-2.07-1.18-5.12-1.46 3.05-.28 4.27-.62 5.12-1.47.84-.83 1.18-2.05 1.46-5.1Z\"/><path d=\"M17.4 13.3c.16 1.74.35 2.44.83 2.92.48.48 1.18.67 2.92.83-1.74.16-2.44.35-2.92.83-.48.48-.67 1.18-.83 2.92-.16-1.74-.35-2.44-.83-2.92-.48-.48-1.18-.67-2.92-.83 1.74-.16 2.44-.35 2.92-.83.48-.48.67-1.18.83-2.92Z\"/></svg>","copilot":"<svg width=\"20\" height=\"20\" style=\"display:block\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" role=\"img\" aria-label=\"Microsoft Copilot\"><title>Microsoft Copilot</title><path d=\"M4 14.5c0-2.8 1.5-5.5 3.8-5.5 1.9 0 2.7 1.7 3.5 3.7.7 1.9 1.5 3.8 3.4 3.8 2 0 3.3-2.1 3.3-4.3\"/><path d=\"M20 11.5c0-2.2-1.3-4.3-3.3-4.3-1.9 0-2.7 1.9-3.4 3.8-.8 2-1.6 3.7-3.5 3.7C7.5 14.5 6 11.8 6 9\"/></svg>","gemini":"<svg width=\"20\" height=\"20\" style=\"display:block\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"currentColor\" role=\"img\" aria-label=\"Google Gemini\"><title>Google Gemini</title><path d=\"M12 1.5c.33 5.55 4.95 10.17 10.5 10.5-5.55.33-10.17 4.95-10.5 10.5C11.67 16.95 7.05 12.33 1.5 12 7.05 11.67 11.67 7.05 12 1.5Z\"/></svg>","google-ai":"<svg width=\"20\" height=\"20\" style=\"display:block\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"currentColor\" role=\"img\" aria-label=\"Google AI\"><title>Google AI</title><path d=\"M12 3a9 9 0 1 0 8.78 11h-8.78v-3.6h12.2c.12.78.18 1.4.18 2.1 0 5.46-3.66 9.5-9.38 9.5a9.5 9.5 0 0 1 0-19 9.13 9.13 0 0 1 6.38 2.5l-2.6 2.5A5.3 5.3 0 0 0 12 6.6 5.4 5.4 0 0 0 12 17.4 5.36 5.36 0 0 0 17.1 14H12V3Z\"/></svg>","grok":"<svg width=\"20\" height=\"20\" style=\"display:block\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"currentColor\" role=\"img\" aria-label=\"Grok\"><title>Grok</title><path d=\"M7.1 18.3 16.4 6.4h2.7L9.8 18.3a.9.9 0 0 1-.71.35H7a.5.5 0 0 1-.4-.8l.5-.65a.9.9 0 0 1 .01-.01Z\"/><path d=\"M5.2 6.4h2.7l3.05 4-1.45 1.85L5.2 6.4Z\"/><path d=\"M14.6 12.85 16.05 14.7v2.75a1.2 1.2 0 0 0 1.2 1.2h1.55V12.5a.9.9 0 0 0-.18-.54l-.62-.83-2.4 1.72Z\"/></svg>","meta-ai":"<svg width=\"20\" height=\"20\" style=\"display:block\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" role=\"img\" aria-label=\"Meta AI\"><title>Meta AI</title><path d=\"M2.5 16.5c0-4 1.9-8 4.4-8 1.7 0 2.9 1.6 4.1 4 .6 1.2 1.1 2.2 1.6 3\"/><path d=\"M21.5 16.5c0-4-1.9-8-4.4-8-1.7 0-2.9 1.6-4.1 4-.6 1.2-1.1 2.2-1.6 3\"/><path d=\"M4.7 16.5c1.5 0 2.5-1.3 3.8-3.5C9.9 10.6 10.9 8.5 12 8.5s2.1 2.1 3.5 4.5c1.3 2.2 2.3 3.5 3.8 3.5\"/></svg>","perplexity":"<svg width=\"20\" height=\"20\" style=\"display:block\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" role=\"img\" aria-label=\"Perplexity\"><title>Perplexity</title><path d=\"M12 3.6v16.8\"/><path d=\"M12 8.2 6 4.4v6.2l6 4 6-4V4.4l-6 3.8Z\"/><path d=\"M6 13.6v5.2l6-4M18 13.6v5.2l-6-4\"/></svg>"};
  // A–E letter grade from a 0–100 readiness score (founder: "show A to E grades not numbers").
  function gradeOf(score){ const n=+score; if(!isFinite(n)) return 'NA'; if(n>=85)return 'A'; if(n>=70)return 'B'; if(n>=55)return 'C'; if(n>=40)return 'D'; return 'E'; }
  function gradeColor(g){ return g==='A'?'var(--green)':g==='B'?'var(--ox)':g==='C'?'var(--amber)':'var(--red)'; }
  function engineGrid(){
    // Logo-hero: the 8 engine LOGOS lead (28px), name demoted to a tiny caption. Readiness shown as an A–E GRADE
    // (big) with the raw score small/secondary, per founder. Cite status kept.
    return `<div class="enggrid">${D.geo.engines.map(e=>{
      const slug=ENG_SLUG[e.nm]||String(e.nm||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
      const g=gradeOf(e.readiness);
      return `<div class="engcell ${e.cites?'':'no'}"><span class="eng-logo" style="${e.cites?'':'opacity:.4;filter:grayscale(1)'}">${ENG_LOGO[slug]||''}</span>
      <div class="eng-nm">${esc(e.nm)}</div>
      <div class="eng-grade"><b class="gr" style="color:${gradeColor(g)}">${g}</b><span class="gn">${e.readiness}</span></div>
      <div class="st">${e.cites?'✓ citing':'✕ not citing'}</div></div>`;
    }).join('')}</div>`;
  }

  /* structured-data GAPS: a missing type is a red ✗ (the gap), a present type a muted ✓. */
  function schemaChecklist(){
    return `<div class="checklist">${D.geo.schema.map(s=>`
      <div class="checkrow"><span class="xmark" style="color:var(--${s.present?'green':'red'})">${s.present?'✓':'✗'}</span>
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
        ${(r.cells||[]).map(cell=>`<td><span class="cmpv ${cell.cls||(r.you?'bad':'good')}">${cell.v}</span>${cell.est?'<span class="est" data-tip="Estimated from authority signals, this rival publishes no Domain Rating">est</span>':''}</td>`).join('')}
      </tr>`).join('')}</tbody></table>`;
  }

  /* citation / keyword tables */
  function citationTable(){
    return `<table class="tz-table"><thead><tr><th>Buyer asks AI…</th><th>You</th><th>AI names instead</th></tr></thead><tbody>
      ${D.geo.citations.map(c=>`<tr><td>${c.q}</td><td class="nr">Not cited</td><td><b style="color:var(--ox)">${c.who}</b>${c.pos?` <span class="rk">#${c.pos}</span>`:''}</td></tr>`).join('')}</tbody></table>`;
  }
  function keywordTable(){
    // Every cell value is DATA-sourced (keyword/leader-domain text); escape it so a stray glyph or a raw
    // "<" in a term can't break out of its <td> and let the next section's icon bleed into this cell. (esc)
    return `<table class="tz-table"><thead><tr><th>Keyword</th><th>Volume</th><th>You</th><th>Who ranks</th></tr></thead><tbody>
      ${D.seo.keywords.map(k=>`<tr><td>${esc(k.kw)}</td><td class="rk">${esc(k.vol)}</td><td class="${k.you==='#1'?'':'nr'}" style="${k.you==='#1'?'color:var(--green);font-family:var(--mono);font-size:11px':''}">${esc(k.you)}</td><td>${k.who===', '?'<span class="rk">n/a</span>':esc(k.who)+(k.pos?' <span class="rk">'+esc(k.pos)+'</span>':'')}</td></tr>`).join('')}</tbody></table>`;
  }

  /* big stat tile */
  function stat(v,l,o={}){ return `<div class="kpi ${o.red?'red':''} ${o.dark?'on-dark':''}" style="${o.align?'align-items:'+o.align:''}"><div class="v" style="${o.size?'font-size:'+o.size+'px':''}">${v}</div><div class="l">${l}</div></div>`; }

  /* urgency callout */
  function urgent(text, sub){
    return `<div class="urgent"><span class="upulse"></span><div><div class="ut">${text}</div>${sub?`<div class="us">${sub}</div>`:''}</div></div>`;
  }

  /* bingo finding card — 7 layers, folded into a 2-column dense grid (Evidence | The case).
     opts.id stamps a stable DOM id (Phase 3 de-triplication: the FULL detail lives once). */
  function finding(f, open=false, opts={}){
    f = Object.assign({n:0,reg:'',title:'Finding',exp:'',quote:'',plain:'',law:'',prec:'',fix:'',plan:'',shot:''}, f||{});
    // A money exposure (starts with £) carries the "statutory ceiling" caption; a ranking-impact finding
    // must NOT (calling "ranking impact" a statutory ceiling is nonsensical). (exposure-label consistency)
    const isMoney = /^£/.test(String(f.exp||''));
    const expCaption = isMoney ? 'statutory ceiling · evidence-locked' : 'ranking, AI-visibility & trust cost, not a statutory fine';
    const idAttr = opts.id ? ` id="${opts.id}"` : '';
    return `<details class="finding"${idAttr} ${open?'open':''}>
      <summary><span class="sev ${f.n===3?'a':''}"></span>
        <span class="ftitle"><span class="tag">${esc(f.reg)}</span>${esc(f.title)}</span>
        <span style="display:flex;align-items:center;gap:10px"><span class="fexp">${f.exp}</span><span class="chev">▸</span></span></summary>
      <div class="fbody dense">
        <div class="fcol fcol-ev">
          <div class="lk">① Live error · your site</div>
          <div class="shot-wrap">${f.shot?`<img src="${f.shot}" loading="lazy" referrerpolicy="no-referrer" alt="live screenshot of ${esc(D.meta.domain)}">`:`<span class="shot-ph">▣ screenshot pending for ${esc(D.meta.domain)}</span>`}<span class="shot-live">● LIVE · YOUR SITE</span></div>
          ${f.quote?`<div class="quote">${esc(f.quote)}</div>`:''}
          <div class="lk">② What it means</div><div class="lv">${esc(f.plain)}</div>
        </div>
        <div class="fcol fcol-case">
          <div class="meta-row"><span class="mk">③ ${esc(f.labelKind||'Law')}</span><b>${esc(f.law)}</b></div>
          ${f.prec?`<div class="meta-row"><span class="mk">④ Ruling</span><span>${esc(f.prec)}</span></div>`:''}
          <div class="meta-row"><span class="mk">⑤ Exposure</span><span><span class="num exp">${f.exp}</span> <span class="cap">${expCaption}</span></span></div>
          <div class="fix-block"><div class="fix-h"><span class="lk">⑥ Tamazia fix</span><span class="fix-rib">✓ every mandate</span></div>${lockFix('<div class="lv">'+esc(f.fix)+'</div>', opts.locked)}</div>
          <div class="plan-line">⑦ ${f.plan}</div>
        </div>
      </div></details>`;
  }

  /* ---- money + deterministic regulator-badge colour ---- */
  function money(n){const c=(D&&D.cur)||'£';n=Math.round(+n||0); if(n>=1e6){const m=n/1e6;return c+(m>=10?Math.round(m):m.toFixed(1).replace(/\.0$/,''))+'M';} if(n>=1e3)return c+Math.round(n/1e3)+'k'; return c+n;}
  function badgeColor(code){const pal=['#5A1A2B','#2A5DA8','#2F7A4A','#B6791F','#7A2A3B','#8A1C16','#3a2d30','#2A0C14'];let h=0;for(const ch of String(code||'FW'))h=(h*31+ch.charCodeAt(0))>>>0;return pal[h%pal.length];}

  /* ---- rich 10-dimension scorecard card grid (Pass · Needs work · Fail) ---- */
  function dimCardGrid(){
    const lab={pass:'Pass',warn:'Needs work',fail:'Fail',na:'Not assessed'};
    return `<div class="dimgrid">${D.dims.map(d=>{
      const w=d.st==='na'?0:Math.max(4,d.v||0);
      const pane=/geo|ai search|ai visib|answer engine/i.test(d.nm)?'geo':/authorit|backlink|domain|referring/i.test(d.nm)?'competitors':/complian|regulat|gdpr|privac|consent|cookie|breach/i.test(d.nm)?'regulatory':'seo';
      return `<div class="dimcard ${d.st}" data-pane="${pane}" role="button" tabindex="0" title="Open ${d.nm} ↗"><div class="dch"><span class="dcn">${d.nm}</span><span class="pill ${d.st}">${lab[d.st]||d.st}</span></div>
        <div class="bar-track" style="height:5px;margin:7px 0 8px"><div class="bar-fill ${d.st==='fail'?'':d.st==='warn'?'amber':'gold'}" style="width:${w}%"></div></div>
        <div class="dcs">${d.sub||''}</div></div>`;
    }).join('')}</div>`;
  }

  /* ---- exposure waterfall: how the honest number is reached ---- */
  function waterfall(){
    const wf=D.exposureWaterfall; if(!wf||!wf.steps||wf.raw<=0) return '';
    const max=wf.raw||1;
    // Drop adjacent steps with an identical value: when nothing collapses (no overlapping DP ceilings),
    // the raw/collapsed/real values are equal and would render as 3 identical bars (reads as broken).
    const steps=wf.steps.filter((s,i,a)=> i===0 || s.v!==a[i-1].v);
    return `<div class="wf">${steps.map(s=>`<div class="wf-row"><div class="wf-l">${s.l}</div>
      <div class="bar-track"><div class="bar-fill ${s.cls==='gold'?'gold':s.cls==='amber'?'amber':''}" style="width:${Math.max(3,(s.v/max)*100)}%"></div></div>
      <div class="wf-v ${s.final?'final':''}">${money(s.v)}</div></div>`).join('')}
      ${wf.savedPct>0?`<div class="wf-note">Overlapping data-protection ceilings are collapsed instead of stacked, removing <b>${wf.savedPct}%</b> of the figure a naïve "add-it-all-up" audit would quote. <b>${money(wf.collapsed)}</b> is the number a regulator's GC would accept.</div>`:`<div class="wf-note">This is the statutory ceiling across your binding frameworks. There were no overlapping data-protection maxima to collapse, so the figure stands as your real exposure.</div>`}</div>`;
  }

  /* ---- GEO "why AI can't see you" causal chain ---- */
  function causalChain(){
    const rc=D.geo&&D.geo.rootCause; if(!rc) return '';
    return `<div class="causal">${rc.chain.map((c,i)=>`<div class="cc-node ${c.ok?'ok':'bad'}"><div class="cc-k">${esc(c.k)}</div><div class="cc-v">${esc(c.v)}</div></div>${i<rc.chain.length-1?'<div class="cc-arrow">↗</div>':''}`).join('')}</div>
      <div class="cc-reason">${esc(rc.reason)}</div>`;
  }

  /* ---- element-level PSI evidence (real failing DOM nodes) ---- */
  function psiAuditList(){
    const a=(D.seo&&D.seo.psiAudits)||[];
    if(!a.length) return `<div class="capt" style="margin:0">Google PageSpeed could not deep-read your site this scan, a re-scan captures the element-level evidence, the exact nodes and the savings each is worth.</div>`;
    return `<div class="psi-list">${a.map(x=>`<div class="psi-row"><div class="psi-h"><span class="psi-t">${esc(x.title)}</span><span class="psi-lane l-${x.laneKey}">${esc(x.lane)}</span></div>
      <div class="psi-ev">Evidence · Google PageSpeed (mobile) · <span class="mono">${esc(x.id)}</span>${x.disp?' · '+esc(x.disp):''}${x.nodes?' · '+x.nodes+' element'+(x.nodes>1?'s':''):''}</div>
      ${x.sel?`<div class="psi-sel mono">${esc(x.sel)}</div>`:''}
      ${x.wcag?`<div class="psi-wcag">⚖ ${esc(x.wcag)}, enforceable under ADA Title III &amp; the EU Accessibility Act</div>`:''}
      <div class="psi-fix"><b>Tamazia fix</b> ${esc(x.fix)}</div></div>`).join('')}</div>`;
  }
  /* ---- strategy-aware PSI (desktop|mobile) — data passed in explicitly ---- */
  function psiDialRow(d){ d=d||{};
    return `<div style="display:flex;justify-content:space-around;gap:8px;flex-wrap:wrap">${dial(d.performance,'Performance')}${dial(d.accessibility,'Accessibility')}${dial(d.bestPractices,'Best practices')}${dial(d.seo,'SEO')}</div>`;
  }
  function cwvMeterRow(cwv){
    return `<div class="cwvgrid">${(cwv||[]).map(m=>{
      const col=stCls(m.st)==='r'?'red':stCls(m.st)==='a'?'amber':'green';
      return `<div class="cwvchip" data-tip="${esc(String(m.plain||'')).replace(/"/g,'&quot;')}">
        <div class="cwv-k"><b>${esc(m.k)}</b> · ${esc(m.label)}</div>
        <div class="cwv-v num" style="color:var(--${col})">${esc(m.v)}<span class="cwv-t mono">target ${esc(m.target)}</span></div>
        <div class="bar-track cwv-bar"><div class="bar-fill ${m.st==='warn'?'amber':''}" style="width:${m.pct}%"></div></div>
      </div>`;
    }).join('')}</div>`;
  }
  function psiAuditRow(a,strat){ a=a||[];
    if(!a.length) return `<div class="capt" style="margin:0">No failing audits surfaced for ${esc(strat||'this strategy')} this scan, your live site cleared this lane.</div>`;
    const half=Math.ceil(a.length/2);   // first ⌈N/2⌉ fixes free, rest locked
    return `<div class="psi-list">${a.map((x,i)=>`<div class="psi-row"><div class="psi-h"><span class="psi-t">${esc(x.title)}</span><span class="psi-lane l-${x.laneKey}">${esc(x.lane)}</span></div>
      <div class="psi-ev">Evidence · Google PageSpeed (${esc(strat||'mobile')}) · <span class="mono">${esc(x.id)}</span>${x.disp?' · '+esc(x.disp):''}${x.nodes?' · '+x.nodes+' element'+(x.nodes>1?'s':''):''}</div>
      ${x.sel?`<div class="psi-sel mono">${esc(x.sel)}</div>`:''}
      ${x.wcag?`<div class="psi-wcag">⚖ ${esc(x.wcag)}, enforceable under ADA Title III &amp; the EU Accessibility Act</div>`:''}
      ${x.fix?`<div class="psi-fix"><b>Tamazia fix</b>${lockFix(esc(x.fix), i>=half)}</div>`:''}</div>`).join('')}</div>`;
  }

  /* ---- framework severity bars + regulator badges ("Your top N regulatory exposures") ---- */
  function frameworkBars(){
    return `<div class="fwbars">${D.frameworks.map(f=>{
      const tot=Math.max(1,f.findings), cp=f.c/tot*100, hp=f.h/tot*100, sp=Math.max(0,100-cp-hp);
      const exp=(f.exp&&(String(f.exp)[0]==='£'))?f.exp:(f.exp==='ranking'?'ranking impact':f.exp);
      return `<button class="fwbar" type="button" data-fwjump="${esc(f.code)}"><div class="fwbar-h"><span class="reg-badge" style="background:${badgeColor(f.code)}">${esc(f.code)}</span>
        <div class="fwbar-nm"><b>${esc(f.name)}</b><span class="fwbar-r">${esc(f.regulator)} · ${f.findings} finding${f.findings===1?'':'s'} · ${esc(exp)}</span></div>
        <div class="cnt">${f.c?`<span class="c">${f.c} crit</span>`:''}${f.h?`<span class="h">${f.h} high</span>`:''}${f.s?`<span class="s">${f.s} std</span>`:''}</div></div>
        <div class="fwbar-track">${cp?`<span style="width:${cp}%;background:var(--red)"></span>`:''}${hp?`<span style="width:${hp}%;background:var(--amber)"></span>`:''}${sp?`<span style="width:${sp}%;background:var(--gold-light)"></span>`:''}</div></button>`;
    }).join('')}</div>`;
  }

  return {gauge,dial,bars,exposureBars,heatmap,radar,trajectory,donut,pill,dimScorecard,dimCardGrid,
    waterfall,causalChain,psiAuditList,frameworkBars,lockFix,
    cwvMeters,psiDials,psiDialRow,cwvMeterRow,psiAuditRow,issueList,securityGrid,engineGrid,schemaChecklist,sourceGap,
    competitorTable,citationTable,keywordTable,stat,urgent,finding};
})();
