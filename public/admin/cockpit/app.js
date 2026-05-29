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
    // probe /now to validate
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
      else if (tab === 'health') await renderHealth(root);
      else if (tab === 'settings') await renderSettings(root);
    }catch(e){
      root.innerHTML = '<p class="sub" style="color:var(--red)">' + esc(e.message||'error') + '</p>';
    }
  }

  async function renderNow(root){
    const d = await api('/now');
    const cards = (d.cards||[]).map(c => `<div class="card"><div class="card-title">${esc(c.kind||'·').toUpperCase()}</div><p>${esc(c.title||'')}</p></div>`).join('');
    const t = d.truth || {real:{},test:{}};
    root.innerHTML = `
      <h2>${esc(d.greeting||'Welcome')}, Aman.</h2>
      <p class="sub">Today: ${d.pipeline_today?.sourced||0} sourced · ${d.pipeline_today?.sent||0} sent · ${d.pipeline_today?.replies||0} replies · ${d.pipeline_today?.bookings||0} bookings</p>
      <div class="cards-grid">
        <div class="kpi"><div class="kpi-label">Real prospects</div><div class="kpi-value">${t.real.prospects||0}</div><div class="kpi-sub">${t.real.sent||0} sent · ${t.real.replies||0} replies · ${t.real.booked||0} booked</div></div>
        <div class="kpi"><div class="kpi-label">Test traffic</div><div class="kpi-value">${t.test.prospects||0}</div><div class="kpi-sub">Excluded from production counts</div></div>
        <div class="kpi"><div class="kpi-label">Build</div><div class="kpi-value" style="font-size:14px;font-family:var(--mono)">${esc(d.build_sha||'?')}</div><div class="kpi-sub">Deployed ${esc(d.build_at||'')}</div></div>
      </div>
      <h3 class="card-title">Critical now</h3>
      ${cards || '<p class="sub">Nothing critical · all green.</p>'}
    `;
    if (d.build_sha) $('#build-sha').textContent = d.build_sha.slice(0,8);
  }

  async function renderPipeline(root){
    root.innerHTML = '<h2>Pipeline</h2><p class="sub">8-stage conveyor · coming in Phase B.</p>';
  }
  async function renderLeads(root){
    root.innerHTML = '<h2>Leads</h2><p class="sub">Coming in Phase B · Neon integration.</p>';
  }
  async function renderForms(root){
    const d = await api('/forms?limit=50');
    const rows = (d.submissions||[]).map(s => `<tr>
      <td>${esc(s.submitted_at||'?')}</td>
      <td><span class="tag blue">${esc(s.tab_source||s.form_type||'?')}</span></td>
      <td>${esc(s.name||'?')}</td>
      <td>${esc(s.email||'?')}</td>
      <td>${esc(s.company||'?')}</td>
      <td>${esc(s.sector||'?')}</td>
      <td>${esc(s.ip_country||'?')}</td>
    </tr>`).join('');
    root.innerHTML = `
      <h2>Forms</h2>
      <p class="sub">${d.count||(d.submissions||[]).length} submissions from website · KV-backed.</p>
      <table><thead><tr><th>Submitted</th><th>Tab</th><th>Name</th><th>Email</th><th>Company</th><th>Sector</th><th>Country</th></tr></thead><tbody>${rows||'<tr><td colspan="7">No submissions yet.</td></tr>'}</tbody></table>
    `;
  }
  async function renderBookings(root){
    const d = await api('/bookings?limit=50');
    const rows = (d.bookings||[]).map(b => `<tr>
      <td>${esc(b.cal_start_time||'?')}</td>
      <td><span class="tag ${b.cal_trigger==='BOOKING_CANCELLED'?'red':b.cal_trigger==='BOOKING_RESCHEDULED'?'amber':'green'}">${esc(b.cal_trigger||'?')}</span></td>
      <td>${esc(b.name||'?')}</td>
      <td>${esc(b.email||'?')}</td>
      <td>${esc(b.cal_event_type||'?')}</td>
    </tr>`).join('');
    root.innerHTML = `
      <h2>Bookings</h2>
      <p class="sub">${d.count||(d.bookings||[]).length} Cal.com bookings · KV-backed.</p>
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
      <p class="sub">${(d.probes||[]).length} probes · last check ${esc(d.checked_at||'')}</p>
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
        <div class="setting-row">
          <span class="label">ICP sectors</span>
          <span class="value">${(d.icp_sectors||[]).join(', ')}</span>
        </div>
        <div class="setting-row">
          <span class="label">Cadence days</span>
          <span class="value">[${(d.cadence_days||[]).join(', ')}]</span>
        </div>
        <div class="setting-row">
          <span class="label">Quality pass threshold</span>
          <span class="value">${d.quality_pass||60}</span>
        </div>
      </div>
    `;
    $('#ks-switch').addEventListener('click', async ()=>{
      const newOn = !$('#ks-switch').classList.contains('on');
      try {
        await api('/settings/kill-switch', { method:'POST', body:{ on: newOn, reason: 'cockpit' }});
        $('#ks-switch').classList.toggle('on', newOn);
        status('Kill switch ' + (newOn?'paused':'resumed'), 'ok');
      } catch(e){ status('Kill switch error: '+e.message, 'err'); }
    });
  }

  // Dock · live feed (polled every 30s for now; SSE in Phase B)
  async function dockTick(){
    try {
      const d = await api('/events/recent');
      const items = (d.events||[]).slice(0,20).map(e => `<li class="${esc(e.sev||'info')}"><span class="t">${esc(e.t||'')}</span>${esc(e.msg||'')}</li>`).join('');
      $('#dock-feed').innerHTML = items || '<li class="info">No activity yet · waiting for events.</li>';
    } catch(e){
      $('#dock-feed').innerHTML = '<li class="bad">dock error: '+esc(e.message)+'</li>';
    }
  }
  function startDockPoll(){
    dockTick();
    dockTimer = setInterval(dockTick, 30000);
  }
  function stopDockPoll(){ if(dockTimer) clearInterval(dockTimer); }

  function esc(s){ return String(s==null?'':s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }

  if (SECRET) {
    // Try silent restore
    api('/now').then(()=>{
      showCockpit();
      status('Restored session · cockpit ready.', 'ok');
    }).catch(()=>{
      signOut();
    });
  }
})();
