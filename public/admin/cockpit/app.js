(function(){
  'use strict';
  let SECRET = sessionStorage.getItem('tamazia.admin') || null;
  const API = '/api/admin';
  let dockTimer = null;

  function $(sel){return document.querySelector(sel);}
  function $$(sel){return document.querySelectorAll(sel);}

  function status(msg, kind){
    const s = $('#status-bar'); s.textContent = msg || '';
    s.className = kind || '';
  }

  async function api(path, opts){
    if (!SECRET) throw new Error('no auth');
    const o = Object.assign({headers:{}}, opts || {});
    o.headers['x-admin-secret'] = SECRET;
    if (o.body && typeof o.body !== 'string') {
      o.headers['Content-Type'] = 'application/json';
      o.body = JSON.stringify(o.body);
    }
    const r = await fetch(API + path, o);
    if (r.status === 401) { signOut(); throw new Error('unauthorised'); }
    const j = await r.json().catch(()=>({error:'parse'}));
    if (!r.ok) throw new Error(j.error || 'http ' + r.status);
    return j;
  }

  function showCockpit(){
    $('#login-wrap').style.display = 'none';
    $('#cockpit').hidden = false;
    renderTab('now');
    startDockPoll();
  }
  function signOut(){
    SECRET = null;
    sessionStorage.removeItem('tamazia.admin');
    $('#login-wrap').style.display = '';
    $('#cockpit').hidden = true;
    stopDockPoll();
  }

  $('#login-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const k = $('#adminkey').value.trim();
    if (!k) return;
    SECRET = k;
    sessionStorage.setItem('tamazia.admin', k);
    api('/now').then(()=>{
      showCockpit();
      status('Welcome back · cockpit ready.', 'ok');
    }).catch(e=>{
      SECRET = null; sessionStorage.removeItem('tamazia.admin');
      status('Auth failed: ' + (e.message||'unknown'), 'err');
    });
  });
  $('#signout').addEventListener('click', signOut);
  // Founder removed the in-page login 2026-05-30: auto-enter the cockpit on load.
  try{ showCockpit(); }catch(e){}
  $$('#tabs .tab').forEach(b => b.addEventListener('click', ()=>{
    $$('#tabs .tab').forEach(t=>t.classList.remove('active'));
    b.classList.add('active');
    $$('.panel').forEach(p=>p.classList.remove('active'));
    const tab = b.dataset.tab;
    $('#tab-'+tab).classList.add('active');
    renderTab(tab);
  }));

  async function renderTab(tab){
    const root = $('#tab-'+tab);
    root.innerHTML = '<p class="sub">Loading…</p>';
    try{
      if (tab === 'now') await renderNow(root);
      else if (tab === 'pipeline') await renderPipeline(root);
      else if (tab === 'leads') await renderLeads(root);
      else if (tab === 'clients') await renderClients(root);
      else if (tab === 'forms') await renderForms(root);
      else if (tab === 'bookings') await renderBookings(root);
      else if (tab === 'inbox') await renderInbox(root);
      else if (tab === 'outbox') await renderOutbox(root);
      else if (tab === 'mystrika') await renderMystrika(root);
      else if (tab === 'icemail') await renderIceMail(root);
      else if (tab === 'audits') await renderAudits(root);
      else if (tab === 'sources') await renderSources(root);
      else if (tab === 'editor') await renderEditor(root);
      else if (tab === 'health') await renderHealth(root);
      else if (tab === 'settings') await renderSettings(root);
    }catch(e){
      root.innerHTML = '<p class="sub" style="color:var(--red)">Error · ' + esc(e.message||'unknown') + '</p>';
    }
  }

  async function renderNow(root){
    const [d, deploys, cal, flg, eng, aud] = await Promise.all([
      api('/now'),
      api('/deploys').catch(()=>({runs:[]})),
      api('/cal/events').catch(()=>({event_types:[]})),
      api('/flags').catch(()=>({flags:[]})),
      api('/engine/status').catch(()=>({})),
      api('/audits?limit=50').catch(()=>({hot:[],stats:{}})),
    ]);
    const hotAudits = (aud.hot||[]);
    const cards = (d.cards||[]).map(c => `<div class="card"><div class="card-title">${esc((c.kind||'').toUpperCase())}</div><p>${esc(c.title||'')}</p></div>`).join('');
    const hotCards = hotAudits.map(a => `<div class="card" style="border-color:var(--gold)"><div class="card-title">🔥 AUDIT OPENED · ${esc(a.open_count||0)}×</div><p><strong>${esc(a.company||a.input||a.domain||'A prospect')}</strong> opened their £1,500 audit${a.last_opened_at?(' · '+esc((a.last_opened_at||'').slice(0,16))):''}. Hottest signal in the pipeline — reach out now.</p><a href="${esc(location.origin+(a.live_url||''))}" target="_blank" class="btn-ghost" style="border:1px solid var(--gold);color:var(--ink);padding:4px 10px;font-size:10px;text-decoration:none">Open their audit</a></div>`).join('');
    const t = d.truth || {real:{},test:{}};
    const lastDeploy = (deploys.runs||[])[0];
    const deployBadge = lastDeploy ? `<span class="tag ${lastDeploy.conclusion==='success'?'green':lastDeploy.conclusion==='failure'?'red':'amber'}">${esc(lastDeploy.conclusion||lastDeploy.status||'?')}</span>` : '<span class="tag amber">unknown</span>';
    const _e0 = (eng&&eng.engine)||null;
    const _engC = _e0 ? (_e0.conclusion||_e0.status||'?') : 'unknown';
    const engBadge = `<span class="tag ${_engC==='success'?'green':_engC==='failure'?'red':'amber'}">${esc(_engC)}</span>`;
    root.innerHTML = `
      <h2>${esc(d.greeting||'Welcome')}, Aman.</h2>
      ${(flg.flags||[]).length ? `<div style="margin:8px 0;display:flex;flex-direction:column;gap:6px">${flg.flags.map(f=>`<div class="tag ${f.level==='p1'?'red':f.level==='p2'?'amber':'blue'}" style="display:block;padding:8px 12px">${esc(f.msg)}</div>`).join('')}</div>` : ''}
      <p class="sub">Today · ${d.pipeline_today?.forms||0} forms · ${d.pipeline_today?.bookings||0} bookings</p>
      <div class="cards-grid">
        <div class="kpi"><div class="kpi-label">Forms (KV)</div><div class="kpi-value">${t.real.prospects||0}</div><div class="kpi-sub">all-time</div></div>
        <div class="kpi"><div class="kpi-label">Bookings (KV)</div><div class="kpi-value">${t.real.booked||0}</div><div class="kpi-sub">all-time</div></div>
        <div class="kpi"><div class="kpi-label">Cal event types</div><div class="kpi-value">${cal.count||0}</div><div class="kpi-sub">live on cal.com/tamazia</div></div>
        <div class="kpi"><div class="kpi-label">Last deploy</div><div class="kpi-value" style="font-size:14px;font-family:var(--mono)">${esc(lastDeploy?.sha||'?')}</div><div class="kpi-sub">${deployBadge} ${esc(lastDeploy?.created_at?.slice(0,16)||'')}</div></div>
        <div class="kpi"><div class="kpi-label">Engine cycle</div><div class="kpi-value" style="font-size:14px">${engBadge}</div><div class="kpi-sub">${esc((_e0&&_e0.at||'').slice(0,16))} · sourcing</div></div>
      </div>
      ${hotAudits.length ? `<div class="tag green" style="display:block;padding:8px 12px;margin:8px 0">🔥 ${hotAudits.length} prospect${hotAudits.length>1?'s have':' has'} opened their £1,500 audit — follow up today</div>` : ''}
      <h3 class="card-title">Critical now</h3>
      ${hotCards}${cards || (hotCards?'':'<p class="sub">Nothing critical · all green.</p>')}
      <h3 class="card-title" style="margin-top:18px">Recent deploys</h3>
      <table><thead><tr><th>SHA</th><th>Status</th><th>Title</th><th>When</th></tr></thead><tbody>
        ${(deploys.runs||[]).slice(0,5).map(r => `<tr>
          <td><code style="font-family:var(--mono)">${esc(r.sha)}</code></td>
          <td><span class="tag ${r.conclusion==='success'?'green':r.conclusion==='failure'?'red':'amber'}">${esc(r.conclusion||r.status||'?')}</span></td>
          <td>${esc(r.title||'')}</td>
          <td>${esc((r.created_at||'').slice(0,16))}</td>
        </tr>`).join('') || '<tr><td colspan="4">No deploys.</td></tr>'}
      </tbody></table>
    `;
    if (d.build_sha) $('#build-sha').textContent = d.build_sha.slice(0,8);
  }

  async function renderClients(root){
    const [c, ob, inv] = await Promise.all([ api('/clients'), api('/onboarding').catch(()=>({tasks:[]})), api('/invoices').catch(()=>({invoices:[]})) ]);
    if (c.error && !(c.clients||[]).length){ root.innerHTML = `<h2>Clients</h2><p class="sub" style="color:var(--amber)">${esc(c.error)}</p><p class="sub">Convert a FIT lead from the Leads tab with the &rarr; Client button. The 30-day onboarding plan seeds automatically.</p>`; return; }
    var soon=function(d){ if(!d) return false; var dt=new Date(d); return (dt-Date.now())<2592000000 && dt>new Date('2000-01-01'); };
    var _portalLink=function(cl){ try{ var m=typeof cl.metadata==='string'?JSON.parse(cl.metadata||'{}'):(cl.metadata||{}); return (m&&m.portal_token)?('<a href="/portal/?c='+encodeURIComponent(cl.client_slug||'')+'&t='+encodeURIComponent(m.portal_token)+'" target="_blank">Portal</a>'):'-'; }catch(e){ return '-'; } };
    const crows=(c.clients||[]).map(cl=>`<tr><td>${esc(cl.legal_name||cl.company||'?')}</td><td><span class="tag blue">${esc(cl.tier||'?')}</span></td><td>${esc(cl.currency||'GBP')} ${esc(String(cl.deal_value||'-'))}</td><td><span class="tag ${cl.status==='active'?'green':cl.status==='churned'?'red':'amber'}">${esc(cl.status||'?')}</span></td><td>${cl.health_score!=null?esc(String(cl.health_score)):'-'}</td><td>${esc((cl.contract_end||'').slice(0,10))}${soon(cl.contract_end)?' <span class="tag amber">renew</span>':''}</td><td>${_portalLink(cl)}</td><td><button class="invnew" data-ca="${esc(String(cl.id))}">+ Invoice</button></td></tr>`).join('');
    const orows=(ob.tasks||[]).map(t=>`<tr class="ob-row"${t.needs_aman?' data-aman="1"':''}><td>${esc(t.legal_name||'?')}</td><td>Day ${esc(String(t.day_offset))}</td><td>${esc(t.title||'')}</td><td>${esc((t.due_date||'').slice(0,10))}</td><td><span class="tag ${t.status==='done'?'green':t.status==='overdue'?'red':'blue'}">${esc(t.status||'?')}</span>${t.needs_aman?' <span class="tag amber">you</span>':''}</td><td><button class="obtask" data-id="${esc(String(t.id))}" data-st="done">Done</button> <button class="obtask" data-id="${esc(String(t.id))}" data-st="skipped">Skip</button></td></tr>`).join('');
    const irows=(inv.invoices||[]).map(iv=>`<tr><td>${esc(iv.invoice_number||'?')}</td><td>${esc(iv.legal_name||'?')}</td><td>${esc(iv.invoice_kind||'')}</td><td>${esc(iv.currency||'GBP')} ${esc(String(iv.amount||'-'))}</td><td><span class="tag ${iv.status==='paid'?'green':iv.status==='overdue'?'red':'blue'}">${esc(iv.status||'?')}</span></td><td>${esc((iv.due_date||'').slice(0,10))}</td></tr>`).join('');
    root.innerHTML = `<h2>Clients</h2><p class="sub">${(c.clients||[]).length} client(s) &middot; convert FIT leads from the Leads tab.</p>
      <table><thead><tr><th>Client</th><th>Tier</th><th>Value</th><th>Status</th><th>Health</th><th>Renews</th><th>Portal</th><th></th></tr></thead><tbody>${crows||'<tr><td colspan="8">No clients yet.</td></tr>'}</tbody></table>
      <h3 class="card-title" style="margin-top:18px">Onboarding (30-day plan) <button id="aman-only" class="tab" style="margin-left:8px">Needs you</button></h3>
      <table><thead><tr><th>Client</th><th>Day</th><th>Task</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead><tbody>${orows||'<tr><td colspan="6">No onboarding tasks.</td></tr>'}</tbody></table>
      <h3 class="card-title" style="margin-top:18px">Invoices</h3>
      <table><thead><tr><th>Number</th><th>Client</th><th>Kind</th><th>Amount</th><th>Status</th><th>Due</th></tr></thead><tbody>${irows||'<tr><td colspan="6">No invoices.</td></tr>'}</tbody></table>`;
    root.querySelectorAll('.obtask').forEach(function(b){ b.addEventListener('click',function(){ b.disabled=true; api('/onboarding/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:Number(b.dataset.id),status:b.dataset.st})}).then(function(){ status('Task '+b.dataset.st,'ok'); renderTab('clients'); }).catch(function(){ b.disabled=false; status('Failed','err'); }); }); });
    root.querySelectorAll('.invnew').forEach(function(b){ b.addEventListener('click',function(){ b.disabled=true; api('/invoices/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_account_id:Number(b.dataset.ca)})}).then(function(r){ status(r&&r.ok?('Invoice '+r.invoice_number+' created'):'Failed','ok'); renderTab('clients'); }).catch(function(){ b.disabled=false; status('Failed','err'); }); }); });
    var _ao=document.getElementById('aman-only'); if(_ao){ var on=false; _ao.addEventListener('click',function(){ on=!on; _ao.classList.toggle('active',on); root.querySelectorAll('.ob-row').forEach(function(tr){ tr.style.display=(on && tr.dataset.aman!=='1')?'none':''; }); }); }
  }

  async function renderPipeline(root){
    const d = await api('/pipeline');
    const max = Math.max(1, ...(d.stages||[]).map(s => s.total||0));
    root.innerHTML = `
      <h2>Pipeline</h2>
      <p class="sub">8-stage conveyor · KV-backed counts. Generated ${esc(d.generated_at?.slice(11,16)||'')}.</p>
      <div class="cards-grid" style="grid-template-columns:repeat(8,1fr);gap:8px">
        ${(d.stages||[]).map(s => {
          const pct = Math.round(((s.total||0)/max)*100);
          return `<div class="kpi" style="padding:12px"><div class="kpi-label" style="font-size:9px">${esc(s.letter)} · ${esc(s.label)}</div><div class="kpi-value" style="font-size:22px">${s.total||0}</div><div class="kpi-sub">${s.today||0} today</div><div style="height:3px;background:var(--hairline);margin-top:8px;border-radius:2px;overflow:hidden"><div style="width:${pct}%;height:100%;background:var(--gold)"></div></div></div>`;
        }).join('')}
      </div>
      <p class="sub" style="margin-top:18px">Phase B will add: enrich + verify + qualify stages backed by Neon pipeline.</p>
    `;
  }

  async function renderLeads(root){
    const d = await api('/leads?limit=100');
    if (d.error) {
      root.innerHTML = `<h2>Leads</h2><p class="sub" style="color:var(--amber)">${esc(d.error)}${d.detail?' · '+esc(d.detail):''}</p><p class="sub">Phase B will reconcile schema.</p>`;
      return;
    }
    const rows = (d.leads||[]).map(l => `<tr${l.quality_fit?' data-fit="1"':''}>
      <td><input type="checkbox" class="lchk" data-id="${esc(String(l.id))}"></td>
      <td>${esc(l.company||'?')}</td>
      <td>${esc(l.domain||'?')}</td>
      <td>${esc(l.contact_email||'?')}</td>
      <td><span class="tag blue">${esc(l.sector||'?')}</span></td>
      <td title="${esc(l.top_finding||'')}">${l.quality_fit?'<span class="tag green">FIT</span> ':''}${l.quality_score!=null?esc(String(l.quality_score)):'<span class="sub">·</span>'}</td>
      <td>${esc(l.lifecycle_stage||'?')}</td>
      <td>${esc(l.status||'?')}</td>
      <td>${esc((l.updated_at||l.created_at||'').slice(0,16))}</td>
      <td><button class="rowbtn" data-id="${esc(String(l.id))}" data-action="advance">Advance</button> <button class="rowbtn" data-id="${esc(String(l.id))}" data-action="won">Won</button> <button class="rowbtn" data-id="${esc(String(l.id))}" data-action="lost">Lost</button> <button class="cbtn" data-id="${esc(String(l.id))}">&rarr; Client</button> <button class="pbtn" data-id="${esc(String(l.id))}">Proposal</button></td>
    </tr>`).join('');
    root.innerHTML = `
      <h2>Leads</h2>
      <p class="sub">${d.total||d.count||0} total in Neon · showing ${(d.leads||[]).length}.</p>
      <input id="leads-filter" placeholder="Filter leads (company, domain, sector, stage)..." style="width:100%;max-width:420px;padding:8px 12px;margin:0 0 10px;border:1px solid var(--hairline);border-radius:8px;font-size:13px">
      <button id="fit-only" class="tab" style="margin:0 0 10px 8px">FIT only</button>
      <button id="bulk-advance" class="tab" style="margin:0 0 10px 8px">Advance selected</button>
      <button id="bulk-won" class="tab" style="margin:0 0 10px 4px">Won selected</button>
      <table><thead><tr><th><input type="checkbox" id="lead-all"></th><th>Company</th><th>Domain</th><th>Email</th><th>Sector</th><th>FIT</th><th>Stage</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${rows||'<tr><td colspan="10">No leads yet.</td></tr>'}</tbody></table>
    `;
    root.querySelectorAll('.rowbtn').forEach(function(btn){ btn.addEventListener('click', function(){ var id=Number(btn.dataset.id), act=btn.dataset.action; if(!id) return; btn.disabled=true; status('Updating lead '+id+'...','ok'); api('/leads/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id,action:act})}).then(function(r){ status(r&&r.ok?('Lead '+id+' '+act):'Update: '+JSON.stringify(r),'ok'); renderTab('leads'); }).catch(function(e){ btn.disabled=false; status('Update failed: '+(e.message||'err'),'err'); }); }); });
    root.querySelectorAll('.pbtn').forEach(function(btn){ btn.addEventListener('click',function(){ status('Generating proposal...','ok'); api('/leads/proposal?id='+Number(btn.dataset.id)).then(function(r){ if(r&&r.ok){ _showModal('Proposal — '+(r.company||''), r.proposal); status('Proposal ready','ok'); } else status('Proposal: '+JSON.stringify(r),'err'); }).catch(function(){ status('Failed','err'); }); }); });
    root.querySelectorAll('.cbtn').forEach(function(btn){ btn.addEventListener('click',function(){ var id=Number(btn.dataset.id); btn.disabled=true; status('Converting lead '+id+' to client...','ok'); api('/clients/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lead_id:id})}).then(function(r){ status(r&&r.ok?('Client #'+r.client_id+' created + 30-day onboarding seeded'):'Convert: '+JSON.stringify(r),'ok'); renderTab('leads'); }).catch(function(e){ btn.disabled=false; status('Convert failed: '+(e.message||'err'),'err'); }); }); });
    var _lf=document.getElementById('leads-filter'); if(_lf){ _lf.addEventListener('input',function(){ var q=_lf.value.toLowerCase(); root.querySelectorAll('tbody tr').forEach(function(tr){ tr.style.display=tr.innerText.toLowerCase().indexOf(q)>=0?'':'none'; }); }); }
    var _fo=document.getElementById('fit-only'); if(_fo){ var _on=false; _fo.addEventListener('click',function(){ _on=!_on; _fo.classList.toggle('active',_on); root.querySelectorAll('tbody tr').forEach(function(tr){ tr.style.display=(_on && tr.dataset.fit!=='1')?'none':''; }); }); }
    var _all=document.getElementById('lead-all'); if(_all){ _all.addEventListener('change',function(){ root.querySelectorAll('.lchk').forEach(function(c){ c.checked=_all.checked; }); }); }
    function _bulk(act){ var ids=[]; root.querySelectorAll('.lchk:checked').forEach(function(c){ ids.push(Number(c.dataset.id)); }); if(!ids.length){ status('Select leads first','amber'); return; } status('Updating '+ids.length+' leads...','ok'); Promise.all(ids.map(function(id){ return api('/leads/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id,action:act})}); })).then(function(){ status(ids.length+' leads '+act,'ok'); renderTab('leads'); }).catch(function(e){ status('Bulk failed: '+(e.message||'err'),'err'); }); }
    var _ba=document.getElementById('bulk-advance'); if(_ba) _ba.addEventListener('click',function(){ _bulk('advance'); });
    var _bw=document.getElementById('bulk-won'); if(_bw) _bw.addEventListener('click',function(){ _bulk('won'); });
  }

  async function renderForms(root){
    const d = await api('/forms?limit=100');
    const rows = (d.submissions||[]).map(s => `<tr>
      <td>${esc((s.submitted_at||'').slice(0,16))}</td>
      <td><span class="tag blue">${esc(s.tab_source||s.form_type||'?')}</span></td>
      <td>${esc(s.name||'?')}</td>
      <td>${esc(s.email||'?')}</td>
      <td>${esc(s.company||'?')}</td>
      <td>${esc(s.sector||'?')}</td>
      <td>${esc(s.ip_country||'?')}</td>
    </tr>`).join('');
    root.innerHTML = `
      <h2>Forms</h2>
      <p class="sub">${d.count||0} submissions · contact + briefings KV.</p>
      <table><thead><tr><th>Submitted</th><th>Tab</th><th>Name</th><th>Email</th><th>Company</th><th>Sector</th><th>Country</th></tr></thead><tbody>${rows||'<tr><td colspan="7">No submissions yet.</td></tr>'}</tbody></table>
    `;
  }

  async function renderBookings(root){
    const [bk, cal] = await Promise.all([
      api('/bookings?limit=50'),
      api('/cal/events').catch(()=>({event_types:[]})),
    ]);
    const rows = (bk.bookings||[]).map(b => `<tr>
      <td>${esc((b.cal_start_time||'').slice(0,16))}</td>
      <td><span class="tag ${b.cal_trigger==='BOOKING_CANCELLED'?'red':b.cal_trigger==='BOOKING_RESCHEDULED'?'amber':'green'}">${esc(b.cal_trigger||'?')}</span></td>
      <td>${esc(b.name||'?')}</td>
      <td>${esc(b.email||'?')}</td>
      <td>${esc(b.cal_event_type||'?')}</td>
    </tr>`).join('');
    const evRows = (cal.event_types||[]).map(et => `<tr>
      <td><code style="font-family:var(--mono)">${esc(et.slug)}</code></td>
      <td>${esc(et.title)}</td>
      <td>${et.length}min</td>
      <td><span class="tag ${et.hidden?'amber':'green'}">${et.hidden?'HIDDEN':'PUBLIC'}</span></td>
      <td><a href="${esc(et.url)}" target="_blank" rel="noopener">${esc(et.url)}</a></td>
    </tr>`).join('');
    root.innerHTML = `
      <h2>Bookings</h2>
      <p class="sub">${bk.count||0} Cal.com bookings · KV. ${cal.count||0} event types live on cal.com/tamazia.</p>
      <h3 class="card-title">Cal.com event types</h3>
      <table><thead><tr><th>Slug</th><th>Title</th><th>Length</th><th>Visibility</th><th>URL</th></tr></thead><tbody>${evRows||'<tr><td colspan="5">CAL_API_KEY unbound.</td></tr>'}</tbody></table>
      <h3 class="card-title" style="margin-top:24px">Recent bookings</h3>
      <table><thead><tr><th>Time</th><th>Event</th><th>Name</th><th>Email</th><th>Type</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No bookings yet.</td></tr>'}</tbody></table>
    `;
  }

  async function renderHealth(root){
    const [d, cf, site, spam] = await Promise.all([
      api('/health'),
      api('/monitoring/cf').catch(() => ({})),
      api('/monitoring/site').catch(() => ({})),
      api('/monitoring/spam-landing').catch(() => ({})),
    ]);
    const rows = (d.probes||[]).map(p => `<tr>
      <td>${esc(p.name)}</td>
      <td><span class="tag ${p.status||'amber'}">${esc((p.status||'amber').toUpperCase())}</span></td>
      <td>${esc(p.latency_ms||'·')}ms</td>
      <td>${esc(p.detail||'')}</td>
    </tr>`).join('');
    root.innerHTML = `
      <h2>Health + Monitoring</h2>
      <p class="sub">${(d.probes||[]).length} service probes · ${(site.probes||[]).length} site URLs · ${(spam.domains||[]).length} domains tracked</p>
      <div class="cards-grid">
        <div class="kpi"><div class="kpi-label">Deploys 24h</div><div class="kpi-value">${cf.last_24h_deploys ?? 0}</div><div class="kpi-sub">${cf.last_7d_deploys ?? 0} in last 7d · ${cf.last_7d_success_rate ?? 100}% success</div></div>
        <div class="kpi"><div class="kpi-label">Site p95</div><div class="kpi-value">${site.p95_ms ?? 0}ms</div><div class="kpi-sub">${site.broken_count ?? 0} broken · ${site.slow_count ?? 0} slow</div></div>
        <div class="kpi"><div class="kpi-label">Spam landings</div><div class="kpi-value" style="font-size:20px">${(spam.domains||[]).filter(x => x.status === 'red').length}</div><div class="kpi-sub">${(spam.domains||[]).length} domains tracked</div></div>
      </div>
      <h3 class="card-title">Service probes</h3>
      <table><thead><tr><th>Service</th><th>Status</th><th>Latency</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>
      <h3 class="card-title" style="margin-top:24px">Site URLs</h3>
      <table><thead><tr><th>Path</th><th>Status</th><th>Latency</th><th>HTTP</th></tr></thead><tbody>${(site.probes||[]).map(p => `<tr><td>${esc(p.name)}</td><td><span class="tag ${p.status||'amber'}">${esc((p.status||'amber').toUpperCase())}</span></td><td>${esc(p.latency_ms||'·')}ms</td><td>${esc(p.detail||'')}</td></tr>`).join('')}</tbody></table>
      <h3 class="card-title" style="margin-top:24px">Postmaster reputation</h3>
      <table><thead><tr><th>Domain</th><th>Reputation</th><th>Spam %</th><th>Status</th><th>Last check</th></tr></thead><tbody>${(spam.domains||[]).map(p => `<tr><td>${esc(p.domain)}</td><td>${esc(p.reputation)}</td><td>${esc(p.spam_rate_pct)}%</td><td><span class="tag ${p.status||'amber'}">${esc((p.status||'amber').toUpperCase())}</span></td><td>${esc((p.last_check||'(never)').slice(0,16))}</td></tr>`).join('')}</tbody></table>
    `;
  }

  async function renderSettings(root){
    const d = await api('/settings');
    const ks = !!d.kill_switch;
    root.innerHTML = `
      <h2>Settings</h2>
      <p class="sub">Operational controls · changes hit KV immediately.</p>
      <div class="card">
        <div class="setting-row">
          <span class="label">Kill switch (pause all sends)</span>
          <span><span class="switch ${ks?'on':''}" id="ks-switch"></span></span>
        </div>
        <div class="setting-row"><span class="label">ICP sectors</span><span class="value">${(d.icp_sectors||[]).join(', ')}</span></div>
        <div class="setting-row"><span class="label">Cadence days</span><span class="value">[${(d.cadence_days||[]).join(', ')}]</span></div>
        <div class="setting-row"><span class="label">Quality pass threshold</span><span class="value">${d.quality_pass||60}</span></div>
      </div>
    `;
    $('#ks-switch').addEventListener('click', async ()=>{
      const newOn = !$('#ks-switch').classList.contains('on');
      try {
        await api('/settings/kill-switch', { method:'POST', body:{ on: newOn, reason: 'cockpit' }});
        $('#ks-switch').classList.toggle('on', newOn);
        status('Kill switch ' + (newOn?'paused':'resumed'), 'ok');
      } catch(e){ status('Kill switch error: '+esc(e.message), 'err'); }
    });
  }

  async function renderInbox(root){
    const d = await api('/inbox?limit=50');
    if (d.error) { root.innerHTML = `<h2>Inbox</h2><p class="sub" style="color:var(--amber)">${esc(d.error)}</p>`; return; }
    const rows = (d.replies||[]).map(r => `<tr>
      <td>${esc((r.received_at||r.submitted_at||'').slice(0,16))}</td>
      <td>${esc(r.from_email||r.from||'?')}</td>
      <td>${esc((r.subject||'').slice(0,80))}</td>
      <td><span class="tag ${r.classification==='positive'?'green':r.classification==='negative'?'red':'blue'}">${esc(r.classification||'?')}</span></td>
      <td><button class="ibtn" data-id="${esc(String(r.id))}">Mark handled</button></td>
    </tr>`).join('');
    root.innerHTML = `
      <h2>Inbox</h2>
      <p class="sub">${d.count||0} replies · source: ${esc(d.source||'?')}</p>
      <table><thead><tr><th>Received</th><th>From</th><th>Subject</th><th>Classification</th><th>Actions</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No replies yet.</td></tr>'}</tbody></table>
    `;
    root.querySelectorAll('.ibtn').forEach(function(btn){ btn.addEventListener('click',function(){ var id=Number(btn.dataset.id); btn.disabled=true; api('/inbox/handle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id})}).then(function(r){ status(r&&r.ok?('Reply '+id+' handled'):'Failed','ok'); renderTab('inbox'); }).catch(function(e){ btn.disabled=false; status('Failed: '+(e.message||'err'),'err'); }); }); });
  }

  async function renderOutbox(root){
    const d = await api('/outbox');
    if (d.source === 'neon-unbound' || d.source === 'neon-error') {
      root.innerHTML = `<h2>Outbox</h2><p class="sub" style="color:var(--amber)">${esc(d.source)}${d.detail?' · '+esc(d.detail):''}</p>`;
      return;
    }
    const rows = (d.drafts||[]).map(dr => `<tr>
      <td>${esc(dr.id||'?')}</td>
      <td>${esc(dr.lead_id||'?')}</td>
      <td>T${esc(dr.touch_number||'0')}</td>
      <td>${esc((dr.subject_line||'').slice(0,80))}</td>
      <td><span class="tag blue">${esc(dr.send_status||'?')}</span></td>
      <td>${esc((dr.created_at||'').slice(0,16))}</td>
      <td><button class="obtn" data-id="${esc(String(dr.id))}" data-act="approve">Approve</button> <button class="obtn" data-id="${esc(String(dr.id))}" data-act="marksent">Mark Sent</button></td>
    </tr>`).join('');
    root.innerHTML = `
      <h2>Outbox</h2>
      <p class="sub">${d.count||0} drafts pending · Neon outreach_drafts.</p>
      <table><thead><tr><th>Draft ID</th><th>Lead</th><th>Touch</th><th>Subject</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>${rows||'<tr><td colspan="7">No drafts.</td></tr>'}</tbody></table>
    `;
    root.querySelectorAll('.obtn').forEach(function(btn){ btn.addEventListener('click',function(){ var id=Number(btn.dataset.id), act=btn.dataset.act; btn.disabled=true; api('/outbox/'+(act==='approve'?'approve':'marksent'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id})}).then(function(r){ status(r&&r.ok?('Draft '+id+' '+act):'Failed','ok'); renderTab('outbox'); }).catch(function(e){ btn.disabled=false; status('Failed: '+(e.message||'err'),'err'); }); }); });
  }

  async function renderMystrika(root){
    const d = await api('/mystrika');
    const prompts = (d.known_community_prompts||[]).map(p => `<li>${esc(p)}</li>`).join('');
    root.innerHTML = `
      <h2>Mystrika</h2>
      <p class="sub">${d.known_count||11} campaigns wired to W8 reply handler. ${d.campaigns?.length||0} synced to KV.</p>
      ${d.note ? `<p class="sub" style="color:var(--amber)">${esc(d.note)}</p>` : ''}
      <div class="card">
        <div class="card-title">Community prompts (live)</div>
        <ul style="padding-left:20px">${prompts}</ul>
      </div>
      <p class="sub">Mystrika has no public REST API · stats sync via n8n W6/W8 webhooks.</p>
    `;
  }

  async function renderIceMail(root){
    const d = await api('/icemail');
    root.innerHTML = `
      <h2>IceMail</h2>
      <p class="sub">Bulk export status · 30 mailboxes target ${d.mystrika_target||299} Mystrika slots.</p>
      <div class="cards-grid">
        <div class="kpi"><div class="kpi-label">Last job ID</div><div class="kpi-value" style="font-size:12px;font-family:var(--mono)">${esc((d.last_job_id||'').slice(0,16))}</div></div>
        <div class="kpi"><div class="kpi-label">Progress</div><div class="kpi-value">${d.last_progress_pct||0}%</div></div>
        <div class="kpi"><div class="kpi-label">Last check</div><div class="kpi-value" style="font-size:12px">${esc((d.last_check||'(never)').slice(0,16))}</div></div>
      </div>
      <p class="sub">${esc(d.note||'')}</p>
    `;
  }

  async function renderEditor(root){
    const FILES = [
      ['src/content/hero.ts',         'Hero copy + H1 + frameworks'],
      ['src/content/pricing.ts',      'Pricing tiers'],
      ['src/content/testimonials.ts', 'Testimonials marquee'],
      ['src/content/whyUs.ts',        'Why Us section'],
      ['src/content/sectors.ts',      'Sectors cards'],
      ['src/content/caseStudies.ts',  'Case studies'],
      ['src/content/faq.ts',          'FAQ items'],
      ['src/content/howWeWork.ts',    'Process section'],
      ['src/content/footer.ts',       'Footer copy'],
      ['src/content/insights.ts',     'Insights blog metadata'],
      ['src/content/contact.ts',      'Contact section'],
      ['src/content/booking.ts',      'Booking event types'],
      ['src/components/sections/FinalHero.astro', 'Sextant SECTORS array (inside JS)'],
    ];
    root.innerHTML = `
      <h2>Editor</h2>
      <p class="sub">Inline edit any allowed source file. Save commits to main; auto-deploys via GitHub Actions in ~50s.</p>
      <div class="card">
        <label class="kpi-label" for="ed-file">File</label>
        <select id="ed-file" style="display:block;width:100%;padding:8px;font:inherit;border:1px solid var(--gold);background:var(--pearl);border-radius:3px;margin-bottom:14px">
          ${FILES.map(([f, label]) => `<option value="${esc(f)}">${esc(f)} · ${esc(label)}</option>`).join('')}
        </select>
        <textarea id="ed-content" style="display:block;width:100%;height:480px;padding:12px;font:13px var(--mono);border:1px solid var(--hairline);border-radius:3px;background:#fff;color:var(--ink)" placeholder="Loading..."></textarea>
        <div style="display:flex;gap:10px;margin-top:14px">
          <button id="ed-load" style="padding:9px 14px;background:var(--ivory);border:1px solid var(--gold);font:600 11px var(--body);letter-spacing:.14em;text-transform:uppercase;cursor:pointer;border-radius:3px">Load</button>
          <button id="ed-save" style="padding:9px 14px;background:var(--oxblood-ink);color:var(--ivory);border:none;font:600 11px var(--body);letter-spacing:.14em;text-transform:uppercase;cursor:pointer;border-radius:3px">Save + deploy</button>
          <input id="ed-msg" placeholder="Commit message" style="flex:1;padding:8px;font:inherit;border:1px solid var(--hairline);border-radius:3px" />
        </div>
        <p class="sub" id="ed-status" style="margin-top:10px"></p>
      </div>
    `;
    let currentSha = null;
    async function load(){
      const f = $('#ed-file').value;
      $('#ed-status').textContent = 'Loading...';
      try {
        const d = await api('/content/get?file=' + encodeURIComponent(f));
        $('#ed-content').value = d.content || '';
        currentSha = d.sha;
        $('#ed-status').textContent = 'Loaded ' + (d.size||'?') + ' bytes · sha ' + (d.sha||'?').slice(0,8);
      } catch(e) {
        $('#ed-content').value = '';
        $('#ed-status').textContent = 'Load error: ' + e.message;
      }
    }
    async function save(){
      const f = $('#ed-file').value;
      const c = $('#ed-content').value;
      const m = $('#ed-msg').value || 'cockpit edit · ' + f;
      if (!c || c.length < 10) { $('#ed-status').textContent = 'Content too short'; return; }
      $('#ed-status').textContent = 'Committing...';
      try {
        const d = await api('/content/put', { method:'POST', body:{ file: f, content: c, sha: currentSha, message: m }});
        $('#ed-status').textContent = 'OK · commit ' + (d.commit||'').slice(0,8) + ' · auto-deploy starts in ~10s';
        status('Saved ' + f, 'ok');
      } catch(e) {
        $('#ed-status').textContent = 'Save error: ' + e.message;
        status('Save failed: ' + e.message, 'err');
      }
    }
    $('#ed-load').addEventListener('click', load);
    $('#ed-save').addEventListener('click', save);
    $('#ed-file').addEventListener('change', load);
    load();
  }

  async function renderAudits(root){
    root.innerHTML = `
      <h2>Audits · history + runner</h2>
      <p class="sub">Every public audit + every founder-run audit saved to KV. Re-run, drill, export.</p>
      <div class="card">
        <div class="card-title">Run a new audit</div>
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:10px;align-items:end">
          <div><label class="kpi-label">Input (domain or keyword)</label><input id="aud-input" placeholder="yourdomain.com or keyword" style="width:100%;padding:9px;border:1px solid var(--gold);background:var(--pearl);font:inherit;border-radius:3px" /></div>
          <div><label class="kpi-label">Sector</label><select id="aud-sector" style="width:100%;padding:9px;border:1px solid var(--gold);background:var(--pearl);font:inherit;border-radius:3px"><option value="">auto</option><option>law firm</option><option>healthcare</option><option>hotels and hospitality</option><option>real estate</option><option>financial services</option><option>restaurants and f&amp;b</option></select></div>
          <div><label class="kpi-label">Email tag</label><input id="aud-email" placeholder="optional" value="admin@tamazia.co.uk" style="width:100%;padding:9px;border:1px solid var(--gold);background:var(--pearl);font:inherit;border-radius:3px" /></div>
          <button id="aud-run" style="padding:10px 18px;background:var(--oxblood-ink);color:var(--ivory);border:none;font:600 11px var(--body);letter-spacing:.14em;text-transform:uppercase;cursor:pointer;border-radius:3px;height:39px">Run</button>
        </div>
        <p class="sub" id="aud-status" style="margin-top:10px"></p>
      </div>
      <div id="aud-kpis" class="cards-grid" style="margin-bottom:16px"></div>
      <div class="card">
        <div class="card-title">History (most recent 50)</div>
        <input id="aud-search" placeholder="filter by input / sector / email..." style="width:100%;padding:9px;border:1px solid var(--hairline);background:#fff;font:inherit;border-radius:3px;margin-bottom:12px" />
        <table id="aud-table"><thead><tr><th>Created</th><th>Type</th><th>Input</th><th>Sector</th><th>Grade</th><th>Findings</th><th>Source</th><th></th></tr></thead><tbody><tr><td colspan="8">Loading...</td></tr></tbody></table>
      </div>
      <div id="aud-drill" class="card" hidden>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div class="card-title" id="aud-drill-title">Audit detail</div><button id="aud-drill-close" class="btn-ghost" style="border:1px solid var(--hairline);color:var(--ink)">Close</button></div>
        <pre id="aud-drill-json" style="background:#1B0A12;color:#E8D9C9;padding:12px;font:12px var(--mono);max-height:480px;overflow:auto;border-radius:3px"></pre>
      </div>
    `;
    let _audById = {};
    async function load(q){
      try {
        const d = await api('/audits?limit=50' + (q?('&q='+encodeURIComponent(q)):''));
        const st = d.stats || {};
        const k = $('#aud-kpis');
        if (k) k.innerHTML = [
          ['Total audits', st.total||0, 'all sources'],
          ['Full £1.5k', st.full||0, 'engine · Touch-1'],
          ['Opened', st.opened||0, 'prospect viewed'],
          ['Manual', st.manual||0, 'founder-run'],
          ['This week', st.this_week||0, 'last 7 days'],
        ].map(([l,v,s2])=>`<div class="kpi"><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub">${s2}</div></div>`).join('');
        _audById = {};
        (d.audits||[]).forEach((a,i)=>{ _audById[a.id||('row'+i)] = a; });
        const rows = (d.audits||[]).map((a,i) => { const rk=a.id||('row'+i); return `<tr>
          <td>${esc((a.created_at||'').slice(0,16))}</td>
          <td><span class="tag ${a.kind==='full'?'green':a.kind==='manual'?'amber':'blue'}">${esc(a.kind||a.type||'quick')}</span></td>
          <td>${esc((a.input||a.domain||'').slice(0,36))}${a.company?(' · '+esc(a.company)):''}</td>
          <td>${esc(a.sector||'auto')}</td>
          <td>${a.kind==='full'?'<span class="tag green">FULL £1.5k</span>':`<span class="tag ${(a.result_brief?.gradeLetter==='A'||a.result_brief?.gradeLetter==='B')?'green':a.result_brief?.gradeLetter==='F'?'red':'amber'}">${esc(a.result_brief?.gradeLetter||'?')}</span>`}</td>
          <td>${a.kind==='full'?((a.open_count||0)>0?('<span class="tag green">opened '+(a.open_count)+'</span>'):'opens 0'):(a.result_brief?.finding_count||0)}</td>
          <td><span class="tag ${a.source==='engine'?'amber':'blue'}">${esc(a.source||'public')}</span></td>
          <td style="white-space:nowrap">${a.live_url
            ? ('<a href="'+esc(a.live_url)+'" target="_blank" class="btn-ghost" style="border:1px solid var(--hairline);color:var(--ink);padding:4px 9px;font-size:10px;text-decoration:none">Open</a> <button data-url="'+esc(a.live_url)+'" class="aud-copy-btn btn-ghost" style="border:1px solid var(--gold);color:var(--ink);padding:4px 9px;font-size:10px">Copy link</button> <button data-rk="'+esc(rk)+'" class="aud-row-btn btn-ghost" style="border:1px solid var(--hairline);color:var(--ink);padding:4px 9px;font-size:10px">Details</button>')
            : ('<button data-key="audit-run:'+esc(a.created_at)+':'+esc(a.id)+'" class="aud-drill-btn btn-ghost" style="border:1px solid var(--hairline);color:var(--ink);padding:4px 10px;font-size:10px">View</button>')}</td>
        </tr>`; }).join('');
        $('#aud-table').querySelector('tbody').innerHTML = rows || '<tr><td colspan="8">No audits yet.</td></tr>';
        $$('#aud-table .aud-drill-btn').forEach(b => b.addEventListener('click', () => drill(b.dataset.key)));
        $$('#aud-table .aud-row-btn').forEach(b => b.addEventListener('click', () => drillRow(_audById[b.dataset.rk])));
        $$('#aud-table .aud-copy-btn').forEach(b => b.addEventListener('click', async () => {
          const abs = location.origin + b.dataset.url;
          try { await navigator.clipboard.writeText(abs); b.textContent='Copied ✓'; setTimeout(()=>{b.textContent='Copy link';},1400); }
          catch(_e){ $('#aud-status').textContent='Copy this into Touch 1: '+abs; }
        }));
      } catch(e) { $('#aud-table').querySelector('tbody').innerHTML = '<tr><td colspan="8" style="color:var(--red)">'+esc(e.message)+'</td></tr>'; }
    }
    function drillRow(a){
      if(!a) return;
      $('#aud-drill').hidden = false;
      $('#aud-drill-title').textContent = 'Full audit · ' + (a.input||a.domain||'?') + (a.company?(' · '+a.company):'');
      const abs = location.origin + (a.live_url||'');
      $('#aud-drill-json').textContent = [
        'Domain:        ' + (a.input||a.domain||'?'),
        'Company:       ' + (a.company||'—'),
        'Sector:        ' + (a.sector||'—'),
        'Minted:        ' + (a.created_at||'—'),
        'Opens:         ' + (a.open_count||0),
        'Last opened:   ' + (a.last_opened_at||'never'),
        'Status:        ' + (a.status||'—'),
        '',
        'Live audit URL (paste into Touch 1):',
        abs,
      ].join('\n');
    }
    async function drill(key){
      try {
        const d = await api('/audits/get?id=' + encodeURIComponent(key));
        $('#aud-drill').hidden = false;
        $('#aud-drill-title').textContent = 'Audit · ' + (d.input||'?') + ' · ' + (d.created_at||'');
        $('#aud-drill-json').textContent = JSON.stringify(d, null, 2);
      } catch(e) { status('drill error: '+e.message, 'err'); }
    }
    $('#aud-drill-close').addEventListener('click', () => { $('#aud-drill').hidden = true; });
    $('#aud-run').addEventListener('click', async () => {
      const input = $('#aud-input').value.trim();
      const sector = $('#aud-sector').value;
      const email = $('#aud-email').value.trim() || 'admin@tamazia.co.uk';
      if (!input) { $('#aud-status').textContent = 'enter input'; return; }
      $('#aud-status').textContent = 'running...';
      try {
        const d = await api('/audits/rerun', { method:'POST', body:{ input, sector, email }});
        $('#aud-status').textContent = 'done · status ' + d.status + ' · ' + (d.result?.overall?.gradeLetter || d.result?.gradeLetter || '?');
        setTimeout(() => load(''), 800);
      } catch(e) { $('#aud-status').textContent = 'error: '+e.message; }
    });
    $('#aud-search').addEventListener('input', () => load($('#aud-search').value.trim()));
    load('');
  }

  async function renderSources(root){
    root.innerHTML = `
      <h2>Sources · scrapers + history</h2>
      <p class="sub">Run SERPER, Hunter, NeverBounce. Every run saved with tags. Drill, re-run, export.</p>
      <div class="card">
        <div class="card-title">Run a scrape</div>
        <div style="display:grid;grid-template-columns:1fr 2fr 1fr 1fr auto;gap:10px;align-items:end">
          <div><label class="kpi-label">Type</label><select id="src-type" style="width:100%;padding:9px;border:1px solid var(--gold);background:var(--pearl);font:inherit;border-radius:3px"><option value="serper">SERPER · Google SERP</option><option value="hunter-domain">Hunter · domain search</option><option value="hunter-verify">Hunter · verify email</option><option value="neverbounce">NeverBounce · verify</option></select></div>
          <div><label class="kpi-label">Query</label><input id="src-query" placeholder="domain.com or query or email@..." style="width:100%;padding:9px;border:1px solid var(--gold);background:var(--pearl);font:inherit;border-radius:3px" /></div>
          <div><label class="kpi-label">Sector tag</label><input id="src-sector" placeholder="optional" style="width:100%;padding:9px;border:1px solid var(--gold);background:var(--pearl);font:inherit;border-radius:3px" /></div>
          <div><label class="kpi-label">Geo</label><input id="src-geo" placeholder="UK / US / UAE..." style="width:100%;padding:9px;border:1px solid var(--gold);background:var(--pearl);font:inherit;border-radius:3px" /></div>
          <button id="src-run" style="padding:10px 18px;background:var(--oxblood-ink);color:var(--ivory);border:none;font:600 11px var(--body);letter-spacing:.14em;text-transform:uppercase;cursor:pointer;border-radius:3px;height:39px">Run</button>
        </div>
        <p class="sub" id="src-status" style="margin-top:10px"></p>
      </div>
      <div class="card">
        <div class="card-title">History (most recent 50)</div>
        <input id="src-search" placeholder="filter by query / type / sector..." style="width:100%;padding:9px;border:1px solid var(--hairline);background:#fff;font:inherit;border-radius:3px;margin-bottom:12px" />
        <table id="src-table"><thead><tr><th>Created</th><th>Type</th><th>Query</th><th>Sector</th><th>Geo</th><th>Count</th><th>Latency</th><th></th></tr></thead><tbody><tr><td colspan="8">Loading...</td></tr></tbody></table>
      </div>
      <div id="src-drill" class="card" hidden>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div class="card-title" id="src-drill-title">Scrape detail</div><button id="src-drill-close" class="btn-ghost" style="border:1px solid var(--hairline);color:var(--ink)">Close</button></div>
        <pre id="src-drill-json" style="background:#1B0A12;color:#E8D9C9;padding:12px;font:12px var(--mono);max-height:480px;overflow:auto;border-radius:3px"></pre>
      </div>
    `;
    async function load(q){
      try {
        const d = await api('/scrape/history?limit=50' + (q?('&q='+encodeURIComponent(q)):''));
        const rows = (d.runs||[]).map(r => `<tr>
          <td>${esc((r.created_at||'').slice(0,16))}</td>
          <td><span class="tag blue">${esc(r.type||'?')}</span></td>
          <td>${esc((r.query||'').slice(0,40))}</td>
          <td>${esc(r.sector||'')}</td>
          <td>${esc(r.geo||'')}</td>
          <td>${r.result_count||0}</td>
          <td>${r.latency_ms||'?'}ms</td>
          <td><button data-key="scrape-run:${esc(r.created_at)}:${esc(r.id)}" class="src-drill-btn btn-ghost" style="border:1px solid var(--hairline);color:var(--ink);padding:4px 10px;font-size:10px">View</button></td>
        </tr>`).join('');
        $('#src-table').querySelector('tbody').innerHTML = rows || '<tr><td colspan="8">No scrapes yet · run one above.</td></tr>';
        $$('#src-table .src-drill-btn').forEach(b => b.addEventListener('click', () => drill(b.dataset.key)));
      } catch(e) { $('#src-table').querySelector('tbody').innerHTML = '<tr><td colspan="8" style="color:var(--red)">'+esc(e.message)+'</td></tr>'; }
    }
    async function drill(key){
      try {
        const d = await api('/scrape/get?id=' + encodeURIComponent(key));
        $('#src-drill').hidden = false;
        $('#src-drill-title').textContent = 'Scrape · ' + (d.type||'?') + ' · ' + (d.query||'?');
        $('#src-drill-json').textContent = JSON.stringify(d, null, 2);
      } catch(e) { status('drill error: '+e.message, 'err'); }
    }
    $('#src-drill-close').addEventListener('click', () => { $('#src-drill').hidden = true; });
    $('#src-run').addEventListener('click', async () => {
      const type = $('#src-type').value;
      const query = $('#src-query').value.trim();
      const sector = $('#src-sector').value.trim();
      const geo = $('#src-geo').value.trim();
      if (!query) { $('#src-status').textContent = 'enter query'; return; }
      $('#src-status').textContent = 'scraping...';
      try {
        const d = await api('/scrape/run', { method:'POST', body:{ type, query, sector, geo }});
        $('#src-status').textContent = 'done · ' + (d.result_count||0) + ' results · ' + (d.latency_ms||'?') + 'ms';
        setTimeout(() => load(''), 600);
      } catch(e) { $('#src-status').textContent = 'error: '+e.message; }
    });
    $('#src-search').addEventListener('input', () => load($('#src-search').value.trim()));
    load('');
  }

  async function dockTick(){
    try {
      const [ev, dp] = await Promise.all([
        api('/events/recent'),
        api('/deploys').catch(()=>({runs:[]})),
      ]);
      const events = (ev.events||[]);
      // Inject deploy events
      (dp.runs||[]).slice(0,3).forEach(r => events.push({
        t: (r.created_at||'').slice(11,16),
        msg: 'deploy · ' + r.sha + ' · ' + (r.conclusion||r.status||'?'),
        sev: r.conclusion === 'success' ? 'ok' : r.conclusion === 'failure' ? 'bad' : 'info',
      }));
      events.sort((a,b) => (b.t||'').localeCompare(a.t||''));
      const items = events.slice(0,20).map(e => `<li class="${esc(e.sev||'info')}"><span class="t">${esc(e.t||'')}</span>${esc(e.msg||'')}</li>`).join('');
      $('#dock-feed').innerHTML = items || '<li class="info">No activity yet.</li>';
    } catch(e){
      $('#dock-feed').innerHTML = '<li class="bad">dock error: '+esc(e.message)+'</li>';
    }
  }
  function startDockPoll(){
    dockTick();
    dockTimer = setInterval(dockTick, 30000);
    // SSE for true real-time
    try {
      const sse = new EventSource('/api/admin/events/stream?s=' + encodeURIComponent(SECRET));
      sse.addEventListener('ready', () => {});
      sse.onerror = () => { /* SSE auto-reconnects */ };
      window.__tamaziaSSE = sse;
    } catch(e) {}
  }
  function stopDockPoll(){ if(dockTimer) clearInterval(dockTimer); if(window.__tamaziaSSE) { try{window.__tamaziaSSE.close();}catch(e){} } }

  function esc(s){ return String(s==null?'':s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }

  if (SECRET) {
    api('/now').then(()=>{
      showCockpit();
      status('Restored session.', 'ok');
    }).catch(()=>signOut());
  }

  // ===== Phase 5 cockpit controls: CSV export + refresh + auto-refresh =====
  function _activeTabName(){ var a=document.querySelector('#tabs .tab.active'); return a?a.dataset.tab:null; }
  function _activeTable(){ var n=_activeTabName(); return n?document.querySelector('#tab-'+n+' table'):null; }
  function _tableToCSV(t){
    return Array.prototype.slice.call(t.querySelectorAll('tr')).map(function(r){
      return Array.prototype.slice.call(r.querySelectorAll('th,td')).map(function(c){
        return '"'+(c.innerText||'').replace(/"/g,'""').replace(/\s+/g,' ').trim()+'"';
      }).join(',');
    }).join('\n');
  }
  function _exportCSV(){
    var t=_activeTable();
    if(!t){ status('No table to export on this tab','amber'); return; }
    var blob=new Blob([_tableToCSV(t)],{type:'text/csv;charset=utf-8;'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='tamazia-'+(_activeTabName()||'export')+'-'+new Date().toISOString().slice(0,10)+'.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }
  function _showModal(title,text){
    var ov=document.createElement('div'); ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    var box=document.createElement('div'); box.style.cssText='background:#fff;max-width:640px;width:100%;max-height:80vh;overflow:auto;border-radius:10px;padding:20px';
    box.innerHTML='<h3 style="margin:0 0 10px">'+text.replace(/&/g,'&amp;')&&'<h3 style="margin:0 0 10px">'+title.replace(/</g,'&lt;')+'</h3><pre style="white-space:pre-wrap;font:13px/1.5 monospace;margin:0 0 14px">'+text.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</pre>';
    var cp=document.createElement('button'); cp.className='tab'; cp.textContent='Copy'; cp.addEventListener('click',function(){ if(navigator.clipboard) navigator.clipboard.writeText(text); status('Copied','ok'); });
    var cl=document.createElement('button'); cl.className='tab'; cl.textContent='Close'; cl.style.marginLeft='8px'; cl.addEventListener('click',function(){ document.body.removeChild(ov); });
    box.appendChild(cp); box.appendChild(cl); ov.appendChild(box); ov.addEventListener('click',function(ev){ if(ev.target===ov) document.body.removeChild(ov); }); document.body.appendChild(ov);
  }
  function _addControls(){
    if(document.querySelector('#csv-export')) return;
    var host=document.querySelector('#tabs'); if(!host) return;
    var rf=document.createElement('button'); rf.id='refresh-now'; rf.className='tab'; rf.textContent='Refresh';
    rf.addEventListener('click',function(){ var n=_activeTabName(); if(n) renderTab(n); });
    var ex=document.createElement('button'); ex.id='csv-export'; ex.className='tab'; ex.textContent='Export CSV';
    ex.addEventListener('click',_exportCSV);
    var re=document.createElement('button'); re.id='run-engine'; re.className='tab'; re.textContent='Run Engine';
    re.addEventListener('click',function(){ status('Dispatching engine cycle...','ok'); api('/engine/dispatch',{method:'POST'}).then(function(r){ status(r&&r.ok?'Engine cycle dispatched':'Dispatch: '+JSON.stringify(r),'ok'); }).catch(function(e){ status('Dispatch failed: '+(e.message||'err'),'err'); }); });
    var fi=document.createElement('input'); fi.id='global-filter'; fi.placeholder='Filter table...';
    fi.style.cssText='padding:6px 10px;border:1px solid var(--hairline);border-radius:8px;font-size:12px;margin-left:8px;max-width:200px';
    fi.addEventListener('input',function(){ var q=fi.value.toLowerCase(); var t=_activeTable(); if(!t) return; t.querySelectorAll('tbody tr').forEach(function(tr){ tr.style.display=tr.innerText.toLowerCase().indexOf(q)>=0?'':'none'; }); });
    var rq=document.createElement('button'); rq.id='requalify'; rq.className='tab'; rq.textContent='Re-qualify FIT';
    rq.addEventListener('click',function(){ status('Resetting FIT leads for re-qualify...','ok'); api('/engine/requalify',{method:'POST'}).then(function(r){ status(r&&r.ok?(r.note||'Re-qualify queued'):'Failed','ok'); }).catch(function(e){ status('Failed: '+(e.message||'err'),'err'); }); });
    host.appendChild(rf); host.appendChild(ex); host.appendChild(re); host.appendChild(fi); host.appendChild(rq);
  }
  try{ _addControls(); }catch(e){}
  setInterval(function(){ var n=_activeTabName(); if(n && ['now','health','pipeline','leads','inbox','outbox'].indexOf(n)>=0){ try{ renderTab(n); }catch(e){} } }, 60000);

})();
