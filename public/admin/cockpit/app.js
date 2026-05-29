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
      else if (tab === 'forms') await renderForms(root);
      else if (tab === 'bookings') await renderBookings(root);
      else if (tab === 'inbox') await renderInbox(root);
      else if (tab === 'outbox') await renderOutbox(root);
      else if (tab === 'mystrika') await renderMystrika(root);
      else if (tab === 'icemail') await renderIceMail(root);
      else if (tab === 'health') await renderHealth(root);
      else if (tab === 'settings') await renderSettings(root);
    }catch(e){
      root.innerHTML = '<p class="sub" style="color:var(--red)">Error · ' + esc(e.message||'unknown') + '</p>';
    }
  }

  async function renderNow(root){
    const [d, deploys, cal] = await Promise.all([
      api('/now'),
      api('/deploys').catch(()=>({runs:[]})),
      api('/cal/events').catch(()=>({event_types:[]})),
    ]);
    const cards = (d.cards||[]).map(c => `<div class="card"><div class="card-title">${esc((c.kind||'').toUpperCase())}</div><p>${esc(c.title||'')}</p></div>`).join('');
    const t = d.truth || {real:{},test:{}};
    const lastDeploy = (deploys.runs||[])[0];
    const deployBadge = lastDeploy ? `<span class="tag ${lastDeploy.conclusion==='success'?'green':lastDeploy.conclusion==='failure'?'red':'amber'}">${esc(lastDeploy.conclusion||lastDeploy.status||'?')}</span>` : '<span class="tag amber">unknown</span>';
    root.innerHTML = `
      <h2>${esc(d.greeting||'Welcome')}, Aman.</h2>
      <p class="sub">Today · ${d.pipeline_today?.forms||0} forms · ${d.pipeline_today?.bookings||0} bookings</p>
      <div class="cards-grid">
        <div class="kpi"><div class="kpi-label">Forms (KV)</div><div class="kpi-value">${t.real.prospects||0}</div><div class="kpi-sub">all-time</div></div>
        <div class="kpi"><div class="kpi-label">Bookings (KV)</div><div class="kpi-value">${t.real.booked||0}</div><div class="kpi-sub">all-time</div></div>
        <div class="kpi"><div class="kpi-label">Cal event types</div><div class="kpi-value">${cal.count||0}</div><div class="kpi-sub">live on cal.com/tamazia</div></div>
        <div class="kpi"><div class="kpi-label">Last deploy</div><div class="kpi-value" style="font-size:14px;font-family:var(--mono)">${esc(lastDeploy?.sha||'?')}</div><div class="kpi-sub">${deployBadge} ${esc(lastDeploy?.created_at?.slice(0,16)||'')}</div></div>
      </div>
      <h3 class="card-title">Critical now</h3>
      ${cards || '<p class="sub">Nothing critical · all green.</p>'}
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
    const rows = (d.leads||[]).map(l => `<tr>
      <td>${esc(l.company||'?')}</td>
      <td>${esc(l.domain||'?')}</td>
      <td>${esc(l.contact_email||'?')}</td>
      <td><span class="tag blue">${esc(l.sector||'?')}</span></td>
      <td>${esc(l.lifecycle_stage||'?')}</td>
      <td>${esc(l.status||'?')}</td>
      <td>${esc((l.updated_at||l.created_at||'').slice(0,16))}</td>
    </tr>`).join('');
    root.innerHTML = `
      <h2>Leads</h2>
      <p class="sub">${d.total||d.count||0} total in Neon · showing ${(d.leads||[]).length}.</p>
      <table><thead><tr><th>Company</th><th>Domain</th><th>Email</th><th>Sector</th><th>Stage</th><th>Status</th><th>Updated</th></tr></thead><tbody>${rows||'<tr><td colspan="7">No leads yet.</td></tr>'}</tbody></table>
    `;
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
    const d = await api('/health');
    const rows = (d.probes||[]).map(p => `<tr>
      <td>${esc(p.name)}</td>
      <td><span class="tag ${p.status||'amber'}">${esc((p.status||'amber').toUpperCase())}</span></td>
      <td>${esc(p.latency_ms||'·')}ms</td>
      <td>${esc(p.detail||'')}</td>
    </tr>`).join('');
    root.innerHTML = `
      <h2>Health</h2>
      <p class="sub">${(d.probes||[]).length} probes · last check ${esc(d.checked_at?.slice(11,19)||'')}</p>
      <table><thead><tr><th>Service</th><th>Status</th><th>Latency</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>
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
    </tr>`).join('');
    root.innerHTML = `
      <h2>Inbox</h2>
      <p class="sub">${d.count||0} replies · source: ${esc(d.source||'?')}</p>
      <table><thead><tr><th>Received</th><th>From</th><th>Subject</th><th>Classification</th></tr></thead><tbody>${rows||'<tr><td colspan="4">No replies yet.</td></tr>'}</tbody></table>
    `;
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
    </tr>`).join('');
    root.innerHTML = `
      <h2>Outbox</h2>
      <p class="sub">${d.count||0} drafts pending · Neon outreach_drafts.</p>
      <table><thead><tr><th>Draft ID</th><th>Lead</th><th>Touch</th><th>Subject</th><th>Status</th><th>Created</th></tr></thead><tbody>${rows||'<tr><td colspan="6">No drafts.</td></tr>'}</tbody></table>
    `;
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
})();
