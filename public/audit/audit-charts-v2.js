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
  // CONFUSION-LEDGER G5/G6/G7/G14/G17: every data-sourced display string is normalised ONCE
  // here (money form, date form, units, engine internals, UK spelling, entity decode) before it
  // is escaped, so a format defect is fixed in one place instead of at 200 call sites.
  const NORM = (window.TZTEXT && window.TZTEXT.norm) ? window.TZTEXT.norm : (v=>String(v==null?'':v));
  const esc = s => NORM(s).replace(/\s*[—–]\s*/g, ', ').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const CP = ()=> (window.COPY||{});
  const NAC = ()=> (CP().notAssessedChip || 'Not assessed');
  const TFIX = s => (window.TZTEXT && window.TZTEXT.termFix) ? window.TZTEXT.termFix(s) : s;
  /* N-guard: no "null"/"undefined"/"NaN" may ever reach rendered text. Every value that
     could be absent goes through txt() (returns '' ) or numOr() (returns the fallback). */
  const BAD=/^(null|undefined|nan|none|n\/a)$/i;
  const txt = v => { const s=String(v==null?'':v).trim(); return BAD.test(s)?'':s; };
  const numOr = (v,f)=>{ const n=+v; return isFinite(n)?n:f; };
  /* T5: evidence quotes arrive as raw DOM fragments ("<span data-image=…"). Decode entities
     BOTH directions, strip tags and their attribute noise, collapse whitespace, then cap. */
  function decodeEnt(s){
    return String(s==null?'':s)
      .replace(/&(amp|lt|gt|quot|apos|#39|nbsp|rsquo|lsquo|ldquo|rdquo|middot|hellip);/gi,(m,k)=>({
        amp:'&',lt:'<',gt:'>',quot:'"',apos:"'","#39":"'",nbsp:' ',rsquo:'\u2019',lsquo:'\u2018',
        ldquo:'"',rdquo:'"',middot:'\u00b7',hellip:'\u2026'}[String(k).toLowerCase()]||m));
  }
  function sanitiseQuote(s,cap){
    let t=decodeEnt(s);
    t=t.replace(/<[^>]*>?/g,' ');                      // whole tags AND an unterminated trailing tag
    t=t.replace(/\b[a-z-]+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,' ');   // orphan attributes left by a cut tag
    t=t.replace(/https?:\/\/\S+/g,' ');                 // raw asset URLs are not evidence prose
    t=t.replace(/\s+/g,' ').trim();
    const n=numOr(cap,190);
    if(t.length>n) t=t.slice(0,n).replace(/\s+\S*$/,'')+'\u2026';
    return t;
  }
  /* the ONE honest empty state (N1): never a bare dash, never a reassuring zero. */
  function notAssessed(what){ return '<div class="na-line">'+esc(what||(window.COPY&&COPY.notAssessed)||'Not assessed on this scan.')+'</div>'; }

  /* radial gauge with gradient stroke.
     CONF-211 / G8 · o.na means NO dimension was assessed. A grade computed from nothing is a
     lie, so the arc is not drawn and the centre states the truth instead of a number. */
  function gauge(score, grade, o={}){
    const size=o.size||150, sw=o.stroke||12, r=(size-sw)/2, c=2*Math.PI*r;
    const sc=Math.max(0,Math.min(100,+score||0));   // clamp: a non-numeric score must not make the arc NaN
    const off=c*(1-sc/100), dark=o.dark, id=uid();
    const ring=`<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${dark?'rgba(255,255,255,.13)':'#EFE6D8'}" stroke-width="${sw}"/>`;
    if(o.na){
      return `<div class="gauge ${dark?'on-dark':''}" style="width:${size}px;height:${size}px">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${ring}</svg>
        <div class="ctr"><div class="sc">${esc(CP().notScoredChip||'Not scored')}</div></div></div>`;
    }
    return `<div class="gauge ${dark?'on-dark':''}" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#C9A87C"/><stop offset=".55" stop-color="#7A2A3B"/><stop offset="1" stop-color="#B3261E"/>
        </linearGradient></defs>
        ${ring}
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
      // G8 / CONF-016 / CONF-254 · "n/a" is banned as an absence marker. The ring stays empty and
      // the words below it carry the state, so exactly one absence vocabulary is on the page.
      return `<div style="text-align:center"><div class="gauge" style="width:${size}px;height:${size}px;margin:0 auto">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#EFE6D8" stroke-width="${sw}"/>
        </svg></div>
        <div class="dial-lab">${esc(label)}</div>
        <div class="dial-na">${esc(NAC())}</div></div>`;
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
      <div class="dial-lab">${esc(label)}</div></div>`;
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
    // CONF-193 / 202 · ONE CTA string for this action, and the aria label matches the visible text.
    const cta=(window.COPY&&COPY.unlockCta)||'Unlock the full report';
    const aria=(window.COPY&&COPY.unlockAria)||'Unlock the full report, first month free';
    return '<div class="tz-lock"><div class="tz-lock-blur tz-fixv">'+innerHTML+'</div>'
      +'<div class="tz-lock-veil" role="button" tabindex="0" aria-label="'+esc(aria)+'">'
      +'<svg class="tz-lock-ic" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
      +'<span class="tz-lock-t">'+esc(cta)+'</span></div></div>';
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
      // G8 / CONF-095 · on a scale where 0 cannot be a real reading (domain rating), a zero is
      // an unmeasured value, not a measured one. It renders as the absence state.
      const zeroNA = o.zeroNA && !(+d.v>0);
      return `<div class="bar-row"><div class="lbl ${d.you?'you':''}">${d.l}</div>
        <div class="bar-track"><div class="bar-fill ${d.you?'gold':d.cls||''}" style="width:${zeroNA?0:w}%"></div></div>
        <div class="val ${zeroNA?'na':(d.you?'':(d.v/max>=.55?'red':''))}">${zeroNA?esc(NAC()):(fmt(d.v)+unit)}</div></div>`;
    }).join('')}</div>`;
  }

  /* exposure bars — labels in the page display currency (D.cur), not a hardcoded £ (C-E) */
  function exposureBars(){
    // R2: rendered beside the waterfall when there is an actual comparison to draw. One bar is
    // not a comparison (the framework card already carries that figure), so we render nothing
    // rather than a single-bar chart that reads as broken. Never a dead export.
    const rows=(D&&Array.isArray(D.exposureBars)?D.exposureBars:[]).filter(b=>b&&numOr(b.v,0)>0);
    if(rows.length<2) return '';
    const c=(D&&D.cur)||'£';
    const top=Math.max(...rows.map(b=>+b.v||0));
    // G5 · lowercase magnitude. CONF-082/083 · the bars overlap, so the caption says they do not sum.
    const caption=`<div class="capt bars-cap">${esc((window.COPY&&COPY.barsCaption)||'')}</div>`;
    return bars(rows.map(b=>({l:esc(b.l), v:+b.v||0})), {max:top, fmt:v=> v>=1?c+(Math.round(v*10)/10)+'m':c+Math.round(v*1000)+'k'}) + caption;
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
      lab+=`<text x="${lx}" y="${ly}" font-family="JetBrains Mono" font-size="8" fill="#6E625F" text-anchor="${anc}" dominant-baseline="middle">${esc(a.ax)} ${esc(a.v)}</text>`; });
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
          <div><div class="num donut-n">${t}</div><div class="donut-k">${(window.COPY&&COPY.donutKicker)||'FINDINGS'}</div></div></div></div>
      <div style="display:flex;flex-direction:column;gap:9px">
        ${[['r','Critical',D.counts.critical],['a','High',D.counts.high],['g','Standard',D.counts.standard]].map(([d,l,v])=>
        `<div class="donut-row"><span class="dot ${d}" style="${d==='g'?'background:var(--gold)':''}"></span><span class="donut-l">${l}</span><b class="num donut-v">${numOr(v,0)}</b></div>`).join('')}
      </div></div>`;
  }

  /* status pill */
  function pill(st){ const m=(window.COPY&&COPY.statusWords)||{fail:'Fail',warn:'Needs work',pass:'Pass',na:'Not assessed'}; return `<span class="pill ${st}">${m[st]}</span>`; }

  /* dimension scorecard rows with mini-bar */
  function dimScorecard(){
    return `<div>${D.dims.map(d=>`<div class="dimrow">
      <div style="min-width:0"><div class="nm">${esc(txt(d.nm))}</div><div class="sub">${esc(txt(d.sub))}</div>
      <div class="bar-track" style="height:5px;margin-top:6px"><div class="bar-fill ${dimBarClass(d.st)}" style="width:${d.v}%"></div></div></div>
      ${pill(d.st)}</div>`).join('')}</div>`;
  }

  /* ---- CWV truth layer (G3 / G7 · CONF-071, 072, 091, 092, 116) ----
     The failing COUNT must be computed from the same comparison the reader can see, and a value
     and its target must share a unit. Both are derived here, once, from the rendered figures. */
  function cwvParse(str){
    const s=String(str==null?'':str).trim();
    const m=s.match(/(-?[\d.,]+)\s*(ms|s)?/i);
    if(!m) return null;
    const n=parseFloat(String(m[1]).replace(/,/g,''));
    if(!isFinite(n)) return null;
    const u=(m[2]||'').toLowerCase();
    return { n:n, unit:u, ms: u==='ms' ? n : (u==='s' ? n*1000 : null) };
  }
  function cwvFmt(key,p){
    const k=String(key||'').toUpperCase();
    if(k==='CLS') return p.n.toFixed(2);                       // CONF-072 · always two decimals
    if(p.ms==null) return String(p.n);
    if(k==='TBT') return Math.round(p.ms)+'ms';                // integer ms
    return (p.ms/1000).toFixed(1)+'s';                         // CONF-071 · seconds, one decimal
  }
  function cwvRow(m){
    m=m||{};
    const pv=cwvParse(m.v), pt=cwvParse(m.target);
    const cv=pv?(pv.ms==null?pv.n:pv.ms):null, ct=pt?(pt.ms==null?pt.n:pt.ms):null;
    const known=(cv!=null && ct!=null);
    const fail=known ? cv>ct : m.st==='fail';
    const st=known ? (fail?'fail':(m.st==='warn'?'warn':'pass')) : (m.st||'na');
    return {
      v: pv?cwvFmt(m.k,pv):txt(m.v),
      target: pt?('< '+cwvFmt(m.k,pt)):txt(m.target),
      fail:fail, st:st
    };
  }
  function cwvFailCount(cwv){ return (cwv||[]).filter(m=>cwvRow(m).fail).length; }

  /* CWV — compact 2-up chip grid (value big, target small, 4px bar, plain-English on hover). ~60% shorter. */
  function cwvMeters(){ return cwvMeterRow((D.seo&&D.seo.cwv)||[]); }

  /* PSI category dials */
  function psiDials(){
    const p=D.seo.psi;
    return `<div class="psi-flex">
      ${dial(p.performance,'Performance')}${dial(p.seo,'SEO')}${dial(p.security,'Security')}${dial(p.mobile,'Mobile')}</div>`;
  }

  /* generic issue list (onpage / security).
     CONF-017 / G8 · ONE three-state vocabulary: Pass · Needs work · Fail, plus Not assessed. */
  function stateWord(present){
    const w=CP().statusWords||{pass:'Pass',fail:'Fail',na:'Not assessed'};
    if(present===null||present===undefined) return w.na;
    return present ? w.pass : w.fail;
  }
  function issueList(items, keyName){
    return `<div class="issuelist">${items.map(it=>`
      <div class="issrow"><span class="dot ${it.sev==='crit'||it.sev==='high'?(it.sev==='crit'?'r':'a'):'n'}"></span>
        <div><div class="iss-t">${esc(it[keyName]||it.issue||it.h)}</div>
        <div class="iss-s">${esc(it.impact||it.note||'')}</div></div>
        ${it.fix?`<span class="iss-fix" data-tip="${esc(it.fix).replace(/"/g,'&quot;')}">${esc(CP().fixHint||'Tamazia fix ›')}</span>`:`<span class="iss-state ${it.present?'on':'off'}">${esc(stateWord(it.present))}</span>`}
      </div>`).join('')}</div>`;
  }

  /* security headers grid */
  function securityGrid(){
    // present===null/undefined => site was not reachably scanned (not assessed). Never show the risk note
    // when a header is PRESENT (that was the self-contradiction: "present" + "…missing/exposed" beneath it).
    return `<div class="secgrid">${D.seo.security.map(s=>{
      const na=(s.present===null||s.present===undefined);
      const col=na?'var(--ink)':(s.present?'var(--green)':'var(--red)');
      // CONF-253 · one sentence, no comma splice, "scan" vocabulary
      const note=na?(CP().notReachable||'Not assessed. We could not reach your site on this scan.')
                  :(s.present?'Present and correctly configured.':s.note);
      return `<div class="seccell ${na?'':(s.present?'ok':'no')}"><div class="sec-h">${esc(s.h)}</div>
      <div class="sec-st" style="color:${col};${na?'opacity:.6':''}">${esc(stateWord(s.present))}</div>
      <div class="capt" style="margin-top:4px">${esc(note)}</div></div>`;
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
    // CONF-213 · letter and number are separated and the scale is stated (E · 36/100).
    // CONF-214 · while the card meta says "modelled estimate", a tick may not assert a fact.
    // CONF-212 · this grid uses its own alphabet, so it prints its own key.
    const modelled=!!(D.geo&&D.geo.engineEstimate);
    const yes=modelled?(CP().engineLikely||'Likely to cite'):(CP().engineCiting||'Citing you');
    const no =modelled?(CP().engineUnlikely||'Unlikely to cite'):(CP().engineNotCiting||'Not citing you');
    return `<div class="enggrid">${D.geo.engines.map(e=>{
      const slug=ENG_SLUG[e.nm]||String(e.nm||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
      const g=gradeOf(e.readiness);
      return `<div class="engcell ${e.cites?'':'no'}"><span class="eng-logo" style="${e.cites?'':'opacity:.4;filter:grayscale(1)'}">${ENG_LOGO[slug]||''}</span>
      <div class="eng-nm">${esc(e.nm)}</div>
      <div class="eng-grade"><b class="gr" style="color:${gradeColor(g)}">${g}</b><span class="gn"> · ${numOr(e.readiness,0)}/100</span></div>
      <div class="st">${esc(e.cites?yes:no)}</div></div>`;
    }).join('')}</div>
    <div class="capt eng-key">${esc(CP().engineGradeKey||'Readiness graded A to E. A is strongest.')}</div>`;
  }

  /* structured-data GAPS: a missing type is a red ✗ (the gap), a present type a muted ✓. */
  function schemaChecklist(){
    return `<div class="checklist">${D.geo.schema.map(s=>`
      <div class="checkrow"><span class="xmark" style="color:var(--${s.present?'green':'red'})">${s.present?'✓':'✗'}</span>
      <div><span class="chk-t">${esc(s.t)}</span>
      <div class="capt">${esc(s.why)}</div></div></div>`).join('')}</div>`;
  }

  /* source gap. CONF-215 · the middle state is "Needs work" everywhere, with one glyph. */
  function sourceGap(){
    const w=CP().statusWords||{pass:'Pass',warn:'Needs work',fail:'Fail'};
    return `<div class="checklist">${D.geo.sourceGap.map(s=>{
      const ok = s.you===true, part = s.you==='partial'||s.you==='unverified';
      const word = ok?w.pass:(part?w.warn:w.fail);
      return `<div class="checkrow"><span class="xmark" style="color:var(--${ok?'green':part?'amber':'red'})" title="${esc(word)}">${ok?'✓':part?'~':'✕'}</span>
      <div><span class="chk-t">${esc(s.src)}</span> <span class="chk-st">${esc(word)}</span><div class="capt">${esc(s.note)}</div></div></div>`;
    }).join('')}</div>`;
  }

  /* competitor comparison table.
     CONF-051 / 246 · "est" is spelled out and carries a visible flag, not a hover-only one. */
  function competitorTable(){
    const c=D.competitors;
    const estTag=CP().estimatedTag||'estimated', estTip=CP().estimatedTip||'Estimated from authority signals.';
    return `<table class="tz-table cmp"><thead><tr><th>Firm</th>${c.cols.map(h=>`<th>${esc(TFIX(h))}</th>`).join('')}</tr></thead><tbody>
      ${c.rows.map(r=>`<tr class="${r.you?'you-row':''}">
        <td><b>${esc(r.name)}</b>${r.you?' <span class="you-tag">'+esc(CP().youTag||'YOU')+'</span>':''}</td>
        ${(r.cells||[]).map(cell=>`<td><span class="cmpv ${cell.cls||(r.you?'bad':'good')}">${esc(cell.v)}</span>${cell.est?'<span class="est" data-tip="'+esc(estTip)+'">'+esc(estTag)+'</span>':''}</td>`).join('')}
      </tr>`).join('')}</tbody></table>`;
  }

  /* citation / keyword tables.
     CONF-187 · the "You" column was a hardcoded constant inside a table of measured values.
     CONF-188 · an empty table promising evidence degrades to the one honest line. */
  function citationTable(){
    const rows=(D.geo.citations||[]);
    if(!rows.length) return notAssessed();
    return `<table class="tz-table"><thead><tr><th>Buyer asks AI…</th><th>You</th><th>AI names instead</th></tr></thead><tbody>
      ${rows.map(c=>{
        const you = txt(c.you) || (c.named===true ? (CP().engineCiting||'Named') : (c.named===false ? (CP().notNamed||'Not named') : NAC()));
        return `<tr><td>${esc(txt(c.q))}</td><td class="nr">${esc(you)}</td><td><b style="color:var(--ox)">${esc(txt(c.who))}</b>${txt(c.pos)?` <span class="rk">#${esc(txt(c.pos))}</span>`:''}</td></tr>`;
      }).join('')}</tbody></table>`;
  }
  // S5: a row survives only with a REAL probed ranker. Sector-template rows ("Law Firms services")
  // and broken joins (who: ", ") are dropped here as well as at the bridge, so a stale payload
  // can never put a fabricated keyword row on the page.
  function usableKeywords(){
    return ((D.seo&&D.seo.keywords)||[]).filter(k=>{
      if(!k) return false;
      const who=txt(k.who).replace(/^[,\s]+|[,\s]+$/g,'');
      const kw=txt(k.kw);
      if(!kw) return false;
      if(who.length<2) return false;                       // ", " / "" / null
      if(/\bservices$/i.test(kw) && !txt(k.pos)) return false;   // sector template with no position
      return true;
    });
  }
  function keywordTable(){
    const rows=usableKeywords();
    if(!rows.length) return notAssessed((window.COPY&&COPY.keywordsNA)||'Keyword positions were not assessed on this scan.');
    // Every cell value is DATA-sourced (keyword/leader-domain text); escape it so a stray glyph or a raw
    // "<" in a term can't break out of its <td> and let the next section's icon bleed into this cell. (esc)
    // CONF-048 · a reader expects a NUMBER under "Volume". An intent word gets its own column.
    const volOf = k => /\d/.test(txt(k.vol)) ? txt(k.vol) : NAC();
    const intentOf = k => /\d/.test(txt(k.vol)) ? (txt(k.intent)||'') : (txt(k.vol)||txt(k.intent)||'');
    return `<table class="tz-table"><thead><tr><th>Keyword</th><th>${esc(CP().volumeCol||'Volume')}</th><th>${esc(CP().intentCol||'Intent')}</th><th>You</th><th>Who ranks</th></tr></thead><tbody>
      ${rows.map(k=>`<tr><td>${esc(k.kw)}</td><td class="rk">${esc(volOf(k))}</td><td class="rk">${esc(intentOf(k))}</td><td class="${k.you==='#1'?'kw-hit':'nr'}">${esc(txt(k.you)||CP().notRanking||'Not ranking')}</td><td>${esc(txt(k.who))}${txt(k.pos)?' <span class="rk">'+esc(txt(k.pos))+'</span>':''}</td></tr>`).join('')}</tbody></table>`;
  }

  /* big stat tile */
  // Y1: the old {size:'30'} escape hatch is gone; emphasis is a CLASS (.lg), never an ad-hoc px.
  // CONF-251 / G8: an ABSENT statistic used to print "0", which reads as a measured zero.
  function stat(v,l,o={}){
    const val = (o.na || txt(v)==='') ? NAC() : txt(v);
    return `<div class="kpi ${o.red&&!o.na?'red':''} ${o.dark?'on-dark':''} ${o.lg?'lg':''}"><div class="v">${esc(val)}</div><div class="l">${esc(l)}</div></div>`;
  }

  /* urgency callout. text/sub are plain strings built with engine-derived values (company, sentiment);
     escape both at this chokepoint so a hostile company/sentiment string can't inject markup. (XSS, C-C) */
  function urgent(text, sub){
    return `<div class="urgent"><span class="upulse"></span><div><div class="ut">${esc(text)}</div>${sub?`<div class="us">${esc(sub)}</div>`:''}</div></div>`;
  }

  /* bingo finding card — 7 layers, folded into a 2-column dense grid (Evidence | The case).
     opts.id stamps a stable DOM id (Phase 3 de-triplication: the FULL detail lives once). */
  function finding(f, open=false, opts={}){
    f = Object.assign({n:0,reg:'',title:'Finding',exp:'',quote:'',plain:'',law:'',prec:'',fix:'',plan:'',shot:''}, f||{});
    // A money exposure (a currency-prefixed figure) carries the "statutory ceiling" caption; a ranking-impact
    // finding must NOT (calling "ranking impact" a statutory ceiling is nonsensical). Test against the page's
    // own display currency symbol (D.cur), not a hardcoded '£', so a $/€/AED firm is detected too. (C-E)
    const isMoney = isMoneyStr(f.exp);
    // CONF-014 / G4 · one name for this number: "Statutory ceiling". "evidence-locked" is deleted.
    const expCaption = isMoney ? (CP().maxPenalty||'Statutory ceiling') : 'ranking, AI-visibility and trust cost, not a statutory fine';
    const idAttr = opts.id ? ` id="${opts.id}"` : '';
    return `<details class="finding"${idAttr} ${open?'open':''}>
      <summary><span class="sev ${f.n===3?'a':''}"></span>
        <span class="ftitle"><span class="tag">${esc(f.reg)}</span>${esc(f.title)}</span>
        <span style="display:flex;align-items:center;gap:10px"><span class="fexp">${esc(f.exp)}</span><span class="chev">▸</span></span></summary>
      <div class="fbody dense">
        <div class="fcol fcol-ev">
          <div class="lk">Evidence · your site</div>
          <div class="shot-wrap">${f.shot?`<img src="${esc(f.shot)}" loading="lazy" referrerpolicy="no-referrer" alt="live screenshot of ${esc(D.meta.domain)}">`:`<span class="shot-ph">▣ screenshot pending for ${esc(D.meta.domain)}</span>`}<span class="shot-live">● LIVE · YOUR SITE</span></div>
          ${f.quote?`<div class="quote">${esc(f.quote)}</div>`:''}
          <div class="lk">What it means</div><div class="lv">${esc(f.plain)}</div>
        </div>
        <div class="fcol fcol-case">
          <div class="meta-row"><span class="mk">${esc(labelKindOf(f))}</span><b>${esc(f.law)}</b></div>
          ${f.prec?`<div class="meta-row"><span class="mk">Why it matters</span><span>${esc(f.prec)}</span></div>`:''}
          <div class="meta-row"><span class="mk">Exposure</span><span><span class="num exp">${esc(f.exp)}</span> <span class="cap">${esc(expCaption)}</span></span></div>
          <div class="fix-block"><div class="fix-h"><span class="lk">${esc(CP().tamaziaFix||'Tamazia fix')}</span><span class="fix-rib">✓ every mandate</span></div>${lockFix('<div class="lv">'+esc(f.fix)+'</div>', opts.locked)}</div>
          <div class="plan-line">${esc(f.plan)}</div>
        </div>
      </div></details>`;
  }

  /* ---- severe-findings caution card (the top breaches, yellow --caution treatment) ----
     Renders as <article class="finding sev-card"> so the freemium-lock, the data-finding jump
     and the qa "#sec-overview .finding" contract all hold, with the board-warning caution motif
     layered on top. The --caution yellow is used ONLY here. lockFix(opts.locked) keeps the
     half-visible lock byte-identical to CH.finding — no fact, figure or fine is altered. */
  /* T3 states. The badge text says which kind of claim the card is making (W7):
     verified breach / assessed, not asserted / binds you, unproven this scan. */
  // CONF-203…206 · the badge sub-text is what a buyer reads, so it says what the claim IS,
  // in plain words, not in internal methodology language. "APPLIES TO YOU" is a founder ruling
  // (2026-06-29) and never reverts to "unproven this scan".
  const SEV_STATE={
    breached:{k:'st-breached', label:'BREACHED',  sub:'Evidenced on your live site'},
    at_risk :{k:'st-risk',     label:'AT RISK',   sub:'We can see the risk; we have not proved a breach'},
    binding :{k:'st-binding',  label:'APPLIES TO YOU', sub:'Binds you · no breach found this scan'},
    severe  :{k:'st-severe',   label:'IMPACT',    sub:'Measured impact, not a statutory breach'},
  };
  function stateOf(f){
    const raw=String((f&&f.state)||'').toLowerCase().replace(/[\s-]+/g,'_');
    if(SEV_STATE[raw]) return SEV_STATE[raw];
    // Legacy payloads carry no explicit ladder state. A non-statutory finding (PSI/a11y severity,
    // "no published penalty figure") is a measured impact, never a law breach — W7/N1: the label
    // must say which claim class it is. Money exposure or a named regulator ⇒ statutory pointer.
    const exp=String((f&&f.exp)||'');
    if(/non-statutory|no published penalty|ranking and ai|ranking impact/i.test(exp) && !isMoneyStr(exp)) return SEV_STATE.severe;
    return SEV_STATE.breached;   // confirmed statutory pointers (money exp or regulator-backed)
  }
  function labelKindOf(f){
    const map=(window.TZTEXT&&window.TZTEXT.LABEL_KIND)||{};
    const raw=String((f&&f.labelKind)||'law').toLowerCase().trim();
    return map[raw] || (f&&f.labelKind) || 'The rule';
  }
  // G4 / CONF-014 / 056 / 057 · a money figure carries exactly ONE of three basis labels, and a
  // range described as "typical" is an enforcement band, never a maximum.
  function isTypical(exp){ return /\btypical\b/i.test(String(exp||'')); }
  function severeCaption(exp){
    if(!isMoneyStr(exp)) return '';
    return isTypical(exp) ? (CP().typicalBand||'Typical enforcement band') : (CP().maxPenalty||'Statutory ceiling');
  }
  function expValue(exp){ return String(exp||'').replace(/\s*\btypical\b\s*/i,' ').trim(); }
  function pad2(n){ return n<10 ? '0'+String(n) : String(n); }
  /* T5: WHERE the breach sits. Rendered only from a value that actually exists. */
  function whereOf(f){
    const page=txt(f.page)||txt(f.pageUrl)||txt(f.page_url)||txt((f.inspected||[])[0]);
    const el=txt(f.element)||txt(f.selector)||txt(f.sel);
    const bits=[];
    if(page) bits.push('<span class="sev-w"><b>'+((window.COPY&&COPY.pageLabel)||'Page')+'</b> '+esc(page)+'</span>');
    if(el)   bits.push('<span class="sev-w"><b>'+((window.COPY&&COPY.elementLabel)||'Element')+'</b> '+esc(el)+'</span>');
    return bits.length ? '<div class="sev-where">'+bits.join(' ')+'</div>' : '';
  }
  const SEV_MARK='<span class="sev-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>';
  // Money exposures carry the "max statutory penalty" caption; a non-money exposure string is already
  // self-describing ("non-statutory (ranking and AI-visibility impact)"), so no caption is appended.

  /* T2/T5: kicker is "Priority breach NN", the state badge carries the claim class, the penalty
     is a chip, WHERE comes from the pointer, the quote is sanitised, the fix is one line. */
  // CONF-177 / G13 · a finding is named by the failure, never by the metric that measured it.
  const METRIC_TITLE={
    'largest contentful paint':'Your main content takes too long to appear',
    'first contentful paint':'The first content on your page appears too slowly',
    'cumulative layout shift':'Your page content moves around as it loads',
    'total blocking time':'Your page is frozen while its scripts run',
    'speed index':'Your content takes too long to fill the screen',
    'time to interactive':'Your page is slow to become usable',
    'target size':'Your tap targets are too small or too close together',
  };
  function failureTitle(t){
    const k=String(t==null?'':t).toLowerCase().replace(/[.\s]+$/,'').trim();
    return METRIC_TITLE[k] || t;
  }
  // CONF-172 / 242 · the evidence slot takes a quote of the failing content. It never takes a
  // bare score, and it never takes the finding's own title with a prefix bolted on.
  function evidenceQuote(raw,title,rawTitle){
    let q=sanitiseQuote(raw,190);
    if(q.replace(/[^a-z0-9]/gi,'').length<3) return '';          // 1-char residue is not evidence
    if(/^[a-z][a-z\s]{2,40}\s\d+\s*\/\s*\d+$/i.test(q.trim())) return '';   // a score, not a quote
    const strip=s=>String(s||'').toLowerCase().replace(/^right now:\s*/,'').replace(/[^a-z0-9]/g,'');
    const sq=strip(q);
    if(sq && (sq===strip(title) || sq===strip(rawTitle))) return '';  // repeats the title, adds nothing
    return q;
  }
  function severeCard(f, i, opts={}){
    f = Object.assign({reg:'',title:'Finding',exp:'',quote:'',plain:'',fix:''}, f||{});
    const st=stateOf(f);
    const idAttr = opts.id ? ` id="${opts.id}"` : '';
    const cardTitle=failureTitle(txt(f.title));
    const q=evidenceQuote(f.quote,cardTitle,txt(f.title));
    const quote = q ? `<blockquote class="sev-quote">&ldquo;${esc(q)}&rdquo;</blockquote>` : '';
    const what = txt(f.plain) ? `<div class="sev-what">${esc(txt(f.plain))}</div>` : '';
    const cap = severeCaption(f.exp);
    const exp = expValue(txt(f.exp));
    const kicker=((window.COPY&&COPY.priorityBreach)||'Priority breach')+' '+pad2(i+1);
    const money = isMoneyStr(exp);
    const fine = exp ? `<span class="sev-fine sev-penalty${money?'':' nonmoney'}"${money?'':' title="'+esc(exp)+'"'}>${esc(money?exp:(exp.length>28?exp.slice(0,27).replace(/\s+\S*$/,'')+'\u2026':exp))}${cap?`<small>${esc(cap)}</small>`:''}</span>` : '';
    return `<article class="finding sev-card" role="group" aria-label="${esc(kicker)}, ${esc(st.label)}, ${esc(cardTitle)}"${idAttr}>
      <header class="sev-flag">${SEV_MARK}<span class="sev-kicker">${esc(kicker)}</span>
        <span class="sev-state ${st.k}" title="${esc(st.sub)}">${esc(st.label)}</span>
        ${fine}</header>
      <div class="sev-body">
        <h4 class="sev-title">${esc(cardTitle||(CP().untitledFinding||'Finding'))}</h4>
        ${whereOf(f)}${quote}${what}
        <div class="sev-fix"><b>${(window.COPY&&COPY.tamaziaFix)||'Tamazia fix'}</b> ${lockFix(esc(txt(f.fix)), opts.locked)}</div>
      </div>
    </article>`;
  }

  /* ---- money + deterministic regulator-badge colour ---- */
  // G5 / CONF-105 · lowercase k, m, bn throughout. Never "M".
  function moneyScale(n){
    if(n>=1e6){
      const m=n/1e6;
      if(m>=10) return Math.round(m)+'m';
      return m.toFixed(1).replace(/\.0$/,'')+'m';
    }
    if(n>=1e3) return Math.round(n/1e3)+'k';
    return String(n);
  }
  function money(n){
    const c=(D&&D.cur)||'£';
    const sp=c.length>1?' ':'';
    return c+sp+moneyScale(Math.round(+n||0));
  }
  // Is this exposure string a MONETARY figure (vs 'ranking'/'ranking impact')? Adapter formats every money
  // exposure with the page currency symbol D.cur ('£' default, '$'/'€'/'AED ' otherwise). Test the page symbol
  // first, then any known currency prefix, so the money/ranking caption is correct in every currency. (C-E)
  function isMoneyStr(s){ s=String(s==null?'':s).trim(); const cur=((D&&D.cur)||'£').trim(); return (cur&&s.indexOf(cur)===0) || /^[£$€]/.test(s) || /^(AED|SAR|QAR|USD|EUR|GBP)\b/i.test(s); }
  function badgeColor(code){const pal=['#5A1A2B','#2A5DA8','#2F7A4A','#B6791F','#7A2A3B','#8A1C16','#3a2d30','#2A0C14'];let h=0;for(const ch of String(code||'FW'))h=(h*31+ch.charCodeAt(0))>>>0;return pal[h%pal.length];}

  /* dimension-card helpers: route each dimension to its pane + bar colour without nested ternaries */
  function dimPaneFor(nm){
    if(/geo|ai search|ai visib|answer engine/i.test(nm)) return 'geo';
    if(/authorit|backlink|domain|referring/i.test(nm)) return 'competitors';
    if(/complian|regulat|gdpr|privac|consent|cookie|breach/i.test(nm)) return 'regulatory';
    return 'seo';
  }
  function dimBarClass(st){
    if(st==='fail') return '';
    if(st==='warn') return 'amber';
    return 'gold';
  }
  // G8 / CONF-016 / CONF-254 · "n/a" is banned. The pill beside it already carries the words,
  // so an unassessed dimension shows no number at all rather than a second absence vocabulary.
  function dimScoreText(d){
    if(d.st==='na') return '';
    return Math.round(numOr(d.v,0))+'<span class="dc-den">/100</span>';
  }
  // CONF-216 · both "Scored 0 because…" sentences are scoring RULES, not findings. Say so.
  function dimNote(note){
    const t=String(note==null?'':note);
    if(!t) return '';
    const m=t.match(/^\s*Scored 0 because\s+(.*)$/i);
    return m ? ((window.COPY&&COPY.whyZero||'Why 0:')+' '+m[1].charAt(0).toUpperCase()+m[1].slice(1)) : t;
  }
  /* ---- rich 10-dimension scorecard card grid (Pass · Needs work · Fail) ---- */
  function dimCardGrid(paneOk){
    const lab=CP().statusWords||{pass:'Pass',warn:'Needs work',fail:'Fail',na:'Not assessed'};
    const secs=CP().sections||{};
    const ok=p=> !paneOk || paneOk[p]!==false;
    return `<div class="dimgrid">${D.dims.map(d=>{
      const w=d.st==='na'?0:Math.max(4,d.v||0);
      const pane=dimPaneFor(d.nm);
      const live=ok(pane);
      const scoreTxt=dimScoreText(d);
      const nm=TFIX(txt(d.nm));   // CONF-044 · one name per metric
      // CONF-174 · the control names the pane it opens, and is inert when that pane is not assessed.
      const dest=secs[pane]||pane;
      return `<div class="dimcard ${d.st}"${live?` data-pane="${pane}" role="button" tabindex="0" title="Open in ${esc(dest)} ↗"`:''}><div class="dch"><span class="dcn">${esc(nm)}</span><span class="pill ${d.st}">${esc(lab[d.st]||d.st)}</span></div>
        <div class="dc-barrow"><div class="bar-track"><div class="bar-fill ${dimBarClass(d.st)}" style="width:${w}%"></div></div><span class="dc-score">${scoreTxt}</span></div>
        <div class="dcs">${esc(TFIX(txt(d.sub)))}</div>${d.note?`<div class="dcs dc-floor">${esc(dimNote(d.note))}</div>`:''}</div>`;
    }).join('')}</div>`;
  }

  /* ---- exposure waterfall: how the honest number is reached ---- */
  function wfDataOk(wf){
    if(!wf || !wf.steps) return false;
    return wf.raw > 0;
  }
  function wfBarClass(cls){
    if(cls==='gold') return 'gold';
    if(cls==='amber') return 'amber';
    return '';
  }
  /* CONF-015 / 131 · fixed step vocabulary. The same chart position had two different labels on
     two reports, and one of them abbreviated "data protection" to "DP". */
  function wfStepLabel(raw){
    const S=(window.COPY&&COPY.wfSteps)||[];
    const t=String(raw==null?'':raw);
    if(/sum|summed/i.test(t) && /ceiling/i.test(t)) return S[0]||t;
    if(/collaps|overlap/i.test(t))                  return S[1]||t;
    if(/median|typical/i.test(t))                   return S[2]||t;
    return t;
  }
  function waterfall(){
    const wf=D.exposureWaterfall; if(!wfDataOk(wf)) return '';
    const max=wf.raw||1;
    // Drop adjacent steps with an identical value: when nothing collapses (no overlapping
    // data-protection ceilings), the raw/collapsed/real values are equal and would render as 3
    // identical bars (reads as broken).
    const steps=wf.steps.filter((s,i,a)=> i===0 || s.v!==a[i-1].v);
    // CONF-067 · the collapse note may only render when a collapse step actually exists.
    const collapsed=(wf.savedPct>0 && steps.length>1);
    const note=collapsed
      ? ((window.COPY&&COPY.wfNote) ? COPY.wfNote(money(wf.raw),money(wf.collapsed),wf.savedPct) : '')
      : ((window.COPY&&COPY.wfNoteFlat)||'');
    return `<div class="wf">${steps.map(s=>`<div class="wf-row"><div class="wf-l">${esc(wfStepLabel(s.l))}</div>
      <div class="bar-track"><div class="bar-fill ${wfBarClass(s.cls)}" style="width:${Math.max(3,(s.v/max)*100)}%"></div></div>
      <div class="wf-v ${s.final?'final':''}">${esc(money(s.v))}</div></div>`).join('')}
      <div class="wf-note">${esc(note)}</div></div>`;
  }

  /* ---- GEO "why AI can't see you" causal chain ---- */
  function causalChain(){
    const rc=D.geo&&D.geo.rootCause; if(!rc) return '';
    // CONF-040 · "↗" means external link and nothing else on this page. A chain step is a chevron.
    return `<div class="causal">${rc.chain.map((c,i)=>`<div class="cc-node ${c.ok?'ok':'bad'}"><div class="cc-k">${esc(c.k)}</div><div class="cc-v">${esc(c.v)}</div></div>${i<rc.chain.length-1?'<div class="cc-arrow" aria-hidden="true">›</div>':''}`).join('')}</div>
      <div class="cc-reason">${esc(rc.reason)}</div>`;
  }

  /* ---- element-level PSI evidence (real failing page elements) ----
     G13 / G14 / CONF-021…025, 141, 142 · a Lighthouse audit id and a developer-console title
     never reach a managing partner. The id moves to a data- attribute for our engineers and the
     title comes from one plain-English, UK-spelling lookup. */
  function psiTitle(x){
    const map=(window.TZTEXT&&window.TZTEXT.PSI_TITLES)||{};
    return map[String((x&&x.id)||'').toLowerCase()] || txt(x&&x.title);
  }
  // CONF-144 · the enforcement route is chosen by the AUDITED FIRM'S jurisdiction, and the
  // statute is expanded at first use. A UK firm is never told the ADA enforces its site.
  function a11yRoute(){
    const s=String(((D.meta&&D.meta.country)||'')+' '+(((D.meta&&D.meta.markets)||[]).join(' '))).toLowerCase();
    if(/united states|\busa?\b|america/.test(s)) return 'enforceable under the Americans with Disabilities Act (ADA) Title III';
    if(/united kingdom|\buk\b|britain|england|scotland|wales/.test(s)) return 'enforceable under the Equality Act 2010';
    return 'the recognised accessibility benchmark for your jurisdiction';
  }
  function wcagLabel(s){ return String(s==null?'':s).replace(/\s*[·,]\s*(ADA Title III|Americans with Disabilities Act[^,·]*|EU Accessibility Act)\s*/gi,'').trim(); }
  function psiEvidence(x,strat){
    const bits=[(CP().psiMeasuredBy||'Measured by Google PageSpeed')+' ('+(strat||'mobile')+')'];
    if(txt(x.disp)) bits.push(txt(x.disp));
    const n=numOr(x.nodes,0);
    if(n) bits.push(CP().psiNodes?CP().psiNodes(n):(n+' elements affected'));
    return bits.join(' · ');
  }
  function psiAuditList(){
    const a=(D.seo&&D.seo.psiAudits)||[];
    if(!a.length) return `<div class="capt" style="margin:0">Google PageSpeed could not deep-read your site this scan. A re-scan captures the element-level evidence.</div>`;
    return `<div class="psi-list">${a.map(x=>`<div class="psi-row" data-audit-id="${esc(txt(x.id))}"><div class="psi-h"><span class="psi-t">${esc(psiTitle(x))}</span><span class="psi-lane l-${x.laneKey}">${esc(x.lane)}</span></div>
      <div class="psi-ev">${esc(psiEvidence(x,'mobile'))}</div>
      ${x.sel?`<div class="psi-sel mono">${esc(x.sel)}</div>`:''}
      ${x.wcag?`<div class="psi-wcag">⚖ ${esc(wcagLabel(x.wcag))}, ${esc(a11yRoute())}</div>`:''}
      <div class="psi-fix"><b>${esc(CP().tamaziaFix||'Tamazia fix')}</b> ${esc(x.fix)}</div></div>`).join('')}</div>`;
  }
  /* ---- strategy-aware PSI (desktop|mobile) — data passed in explicitly ---- */
  function psiDialRow(d){ d=d||{};
    return `<div class="psi-flex">${dial(d.performance,'Performance')}${dial(d.accessibility,'Accessibility')}${dial(d.bestPractices,'Best practices')}${dial(d.seo,'SEO')}</div>`;
  }
  function cwvMeterRow(cwv){
    return `<div class="cwvgrid">${(cwv||[]).map(m=>{
      const r=cwvRow(m);
      const col=stCls(r.st)==='r'?'red':stCls(r.st)==='a'?'amber':'green';
      return `<div class="cwvchip" data-tip="${esc(String(m.plain||'')).replace(/"/g,'&quot;')}">
        <div class="cwv-k"><b>${esc(m.k)}</b> · ${esc(m.label)}</div>
        <div class="cwv-v num" style="color:var(--${col})">${esc(r.v||NAC())}<span class="cwv-t mono">target ${esc(r.target||NAC())}</span></div>
        <div class="bar-track cwv-bar"><div class="bar-fill ${r.st==='warn'?'amber':''}" style="width:${Math.max(0,Math.min(100,numOr(m.pct,0)))}%"></div></div>
      </div>`;
    }).join('')}</div>`;
  }
  function psiAuditRow(a,strat){ a=a||[];
    if(!a.length) return `<div class="capt" style="margin:0">No failing audits surfaced for ${esc(strat||'this strategy')} this scan, your live site cleared this lane.</div>`;
    const half=Math.ceil(a.length/2);   // first ⌈N/2⌉ fixes free, rest locked
    return `<div class="psi-list">${a.map((x,i)=>`<div class="psi-row" data-audit-id="${esc(txt(x.id))}"><div class="psi-h"><span class="psi-t">${esc(psiTitle(x))}</span><span class="psi-lane l-${x.laneKey}">${esc(x.lane)}</span></div>
      <div class="psi-ev">${esc(psiEvidence(x,strat))}</div>
      ${x.sel?`<div class="psi-sel mono">${esc(x.sel)}</div>`:''}
      ${x.wcag?`<div class="psi-wcag">⚖ ${esc(wcagLabel(x.wcag))}, ${esc(a11yRoute())}</div>`:''}
      ${x.fix?`<div class="psi-fix"><b>${esc(CP().tamaziaFix||'Tamazia fix')}</b>${lockFix(esc(x.fix), i>=half)}</div>`:''}</div>`).join('')}</div>`;
  }

  /* ---- framework severity bars + regulator badges ("Your top N regulatory exposures") ---- */
  function frameworkBars(){
    return `<div class="fwbars">${D.frameworks.map(f=>{
      const tot=Math.max(1,f.findings), cp=f.c/tot*100, hp=f.h/tot*100, sp=Math.max(0,100-cp-hp);
      const exp=isMoneyStr(f.exp)?txt(f.exp):(txt(f.exp)==='ranking'?'ranking impact':(txt(f.exp)||((window.COPY&&COPY.notAssessedShort)||'not assessed')));
      return `<button class="fwbar" type="button" data-fwjump="${esc(f.code)}"><div class="fwbar-h"><span class="reg-badge" style="background:${badgeColor(f.code)}">${esc(f.code)}</span>
        <div class="fwbar-nm"><b>${esc(f.name)}</b><span class="fwbar-r">${esc(f.regulator)} · ${f.findings} finding${f.findings===1?'':'s'} · ${esc(exp)}</span></div>
        <div class="cnt">${f.c?`<span class="c">${f.c} crit</span>`:''}${f.h?`<span class="h">${f.h} high</span>`:''}${f.s?`<span class="s">${f.s} std</span>`:''}</div></div>
        <div class="fwbar-track">${cp?`<span style="width:${cp}%;background:var(--red)"></span>`:''}${hp?`<span style="width:${hp}%;background:var(--amber)"></span>`:''}${sp?`<span style="width:${sp}%;background:var(--gold-light)"></span>`:''}</div></button>`;
    }).join('')}</div>`;
  }

  return {gauge,dial,bars,exposureBars,radar,trajectory,donut,pill,dimScorecard,dimCardGrid,
    waterfall,causalChain,psiAuditList,frameworkBars,lockFix,severeCard,
    cwvMeters,psiDials,psiDialRow,cwvMeterRow,cwvFailCount,psiAuditRow,psiTitle,issueList,securityGrid,engineGrid,schemaChecklist,sourceGap,
    competitorTable,citationTable,keywordTable,usableKeywords,stat,urgent,finding,stateWord,
    notAssessed,sanitiseQuote,decodeEnt,isMoneyStr,badgeColor,txt,numOr,stateOf,SEV_STATE};
})();
