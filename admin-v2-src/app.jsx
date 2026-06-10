// app.jsx — Tamazia Cockpit v2 shell
// Slim sidebar · header with kill-switch · slim bottom dock · ⌘K palette · hash routing.

// Simplified to the core loop the admin actually works every day. Badges are LIVE
// (computed from real data in the Sidebar): leads = pending approvals, inbox = replies.
const NAV = [
  { id: 'now',       label: 'Now',       icon: 'home' },
  { id: 'leads',     label: 'Leads',     icon: 'users',    badge: () => (window.PENDING || []).length },
  { id: 'outreach',  label: 'Outreach',  icon: 'outbox',   badge: () => ((window.OUTBOX || {}).count) || 0 },
  { id: 'inbox',     label: 'Inbox',     icon: 'inbox',    badge: () => (window.REPLIES || []).length },
  { id: 'audits',    label: 'Audits',    icon: 'file' },
  { id: 'bookings',  label: 'Bookings',  icon: 'calendar' },
  { id: 'settings',  label: 'Settings',  icon: 'cog' },
];

const TAB_COMPS = {
  now: 'TabNow', leads: 'TabLeads', outreach: 'TabOutreach', audits: 'TabAudits',
  inbox: 'TabInbox', bookings: 'TabBookings', settings: 'TabSettings',
};

// ── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ tab, onTab, min, onToggleMin, mode }) => (
  <aside className="sidebar" style={{
    background: 'var(--bg-soft)', borderRight: '1px solid var(--line-1)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }}>
    {/* Brand */}
    <div style={{ padding: min ? '14px 8px' : '16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 7,
        background: 'var(--ink-1)', color: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 16,
        flexShrink: 0,
      }}>T</div>
      {!min && (
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.2 }}>Tamazia</div>
          <div className="eyebrow" style={{ fontSize: 9, marginTop: 1 }}>cockpit · v2</div>
        </div>
      )}
      <button className="btn ghost icon" onClick={onToggleMin} title={min ? 'expand' : 'collapse'} style={{ flexShrink: 0 }}>
        <Icon name="chev" sm />
      </button>
    </div>

    {/* Nav */}
    <nav style={{ flex: 1, padding: '4px 10px', overflowY: 'auto' }}>
      {NAV.map(it => {
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onTab(it.id)}
            title={min ? it.label : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: min ? '9px' : '8px 10px',
              borderRadius: 7,
              background: active ? 'var(--ink-1)' : 'transparent',
              color: active ? 'var(--bg)' : 'var(--ink-2)',
              fontSize: 13, fontWeight: 500,
              marginBottom: 2, textAlign: 'left',
              transition: 'background 0.1s',
              justifyContent: min ? 'center' : 'flex-start',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--card-2)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}><Icon name={it.icon} sm /></span>
            {!min && <span className="grow ellip">{it.label}</span>}
            {(() => {
              const bv = typeof it.badge === 'function' ? it.badge() : it.badge;
              return (!min && bv) ? (
                <span className="t-num" style={{
                  background: 'var(--clay)', color: 'white',
                  fontSize: 10, padding: '0 6px',
                  borderRadius: 999, lineHeight: '16px', minWidth: 18, textAlign: 'center',
                }}>{bv}</span>
              ) : null;
            })()}
          </button>
        );
      })}
    </nav>

    {/* Footer */}
    {!min && (
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--line-1)' }}>
        <div className="eyebrow" style={{ marginBottom: 6, fontSize: 9 }}>ICP · target sectors</div>
        <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
          {ICP_SECTORS.map(s => <span key={s} className="chip sm">{s}</span>)}
        </div>
        <div className="row" style={{ marginTop: 12, padding: '8px 10px', background: 'var(--card)', border: '1px solid var(--line-1)', borderRadius: 7, gap: 8 }}>
          <span className="dot live-dot" style={{ background: 'var(--ok)' }} />
          <span className="t-12 grow">All systems good</span>
          <span className="t-num t-12" style={{ color: 'var(--ok)' }}>{TRUTH.health}%</span>
        </div>
      </div>
    )}
  </aside>
);

// ── Header ───────────────────────────────────────────────────────────────────
const Header = ({ mode, setMode, onCmd, killOn, onKillToggle }) => {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const tStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header className="header" style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 24px', borderBottom: '1px solid var(--line-1)',
      background: 'var(--bg)', position: 'relative',
    }}>
      {/* left — search */}
      <button className="btn ghost" onClick={onCmd} style={{
        flex: 1, maxWidth: 380, justifyContent: 'flex-start',
        border: '1px solid var(--line-1)', background: 'var(--card)',
      }}>
        <Icon name="search" sm />
        <span className="t-muted" style={{ flex: 1, textAlign: 'left' }}>Search leads, drafts, replies…</span>
        <kbd>⌘K</kbd>
      </button>

      {/* center — time */}
      <div className="row" style={{ gap: 10, color: 'var(--ink-3)' }}>
        <span className="t-mono t-12">{tStr}</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* right — the one control that matters: the send kill-switch (writes engine system_state.paused) */}
      <button
        onClick={onKillToggle}
        className="btn"
        style={{
          gap: 6,
          background: killOn ? '#b14730' : 'var(--card)',
          color: killOn ? 'white' : 'var(--ink-2)',
          borderColor: killOn ? '#b14730' : 'var(--line-1)',
        }}
      >
        <Icon name={killOn ? 'play' : 'pause'} sm />
        {killOn ? 'Sending paused — resume' : 'Pause all sending'}
      </button>
    </header>
  );
};

// ── Bottom dock — slim live feed ─────────────────────────────────────────────
const BottomDock = ({ open, onToggle }) => {
  const latest = EVENTS[0];
  const srcColor = src => ({
    reply: 'var(--ok)', send: 'var(--ink-3)', scrape: 'var(--info)',
    audit: 'var(--clay)', intel: 'var(--clay)', form: 'var(--ok)',
  }[src] || 'var(--ink-3)');

  return (
    <footer className="dock" style={{
      borderTop: '1px solid var(--line-1)',
      background: 'var(--bg-soft)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* slim collapsed bar */}
      <button onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        height: 36, padding: '0 18px', width: '100%',
        textAlign: 'left',
        borderBottom: open ? '1px solid var(--line-1)' : 'none',
      }}>
        <span className="dot live-dot" style={{ background: 'var(--ok)' }} />
        <span className="t-12 t-muted">Activity</span>
        <span className="t-mono t-11" style={{ color: 'var(--ink-3)' }}>{latest.t}</span>
        <span className="t-12 t-mono" style={{ color: srcColor(latest.src), fontWeight: 600, textTransform: 'lowercase' }}>{latest.src}</span>
        <span className="t-12 ellip grow">{latest.m}</span>
        <span className="chip sm">{(window.REPLIES || []).length} replies · {((window.TRUTH || {}).funnel || {}).qualified || 0} qualified</span>
        <span className="t-11 t-muted">live feed</span>
        <span style={{ display: 'flex', color: 'var(--ink-3)' }}>
          <Icon name="chev" sm />
        </span>
      </button>

      {/* expanded body */}
      {open && (
        <div style={{ flex: 1, padding: 18, overflowY: 'auto', background: 'var(--bg)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div className="spread" style={{ marginBottom: 12 }}>
              <h3 className="h3" style={{ margin: 0 }}>Activity</h3>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn ghost sm">All</button>
                <button className="btn ghost sm">Replies</button>
                <button className="btn ghost sm">Sends</button>
                <button className="btn ghost sm">Mute</button>
              </div>
            </div>
            <div className="col" style={{ gap: 0 }}>
              {EVENTS.map((e, i) => (
                <div key={i} className="row" style={{
                  gap: 10, padding: '8px 0',
                  borderBottom: i < EVENTS.length - 1 ? '1px solid var(--line-2)' : 'none',
                }}>
                  <span className="t-mono t-11" style={{ color: 'var(--ink-3)', width: 44 }}>{e.t}</span>
                  <span className="t-mono t-11" style={{ width: 60, color: srcColor(e.src), fontWeight: 600 }}>{e.src}</span>
                  <span className="dot" style={{ background: e.sev === 'ok' ? 'var(--ok)' : 'var(--ink-4)' }} />
                  <span className="t-13 grow ellip">{e.m}</span>
                  {e.ch.map(c => <span key={c} className="chip sm">{c}</span>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

// ── Command palette ──────────────────────────────────────────────────────────
const CommandPalette = ({ open, onClose, onNav }) => {
  const [q, setQ] = React.useState('');
  React.useEffect(() => { if (open) setQ(''); }, [open]);
  const items = React.useMemo(() => {
    const tabs = NAV.map(n => ({ kind: 'tab', label: n.label, id: n.id, hint: 'go to' }));
    const leads = (window.LEADS || []).slice(0, 200).map(l => ({ kind: 'lead', label: l.company, id: l.id, hint: l.sector, lead: l }));
    const all = [...tabs, ...leads];
    return q ? all.filter(x => (x.label + (x.hint || '')).toLowerCase().includes(q.toLowerCase())) : all;
  }, [q]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(36,26,12,0.36)',
      zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 92, animation: 'fadeIn 0.18s',
    }}>
      <div onClick={e => e.stopPropagation()} className="modal-in card" style={{
        width: 'min(640px, 90vw)', boxShadow: 'var(--shadow-pop)', overflow: 'hidden',
      }}>
        <div className="row" style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-1)' }}>
          <Icon name="search" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search anywhere…"
            style={{ flex: 1, border: 0, outline: 0, fontSize: 15, background: 'transparent' }} />
          <kbd>Esc</kbd>
        </div>
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {items.slice(0, 16).map((it, i) => (
            <button key={`${it.kind}-${it.id}`} onClick={() => { if (it.kind === 'tab') onNav(it.id); else if (it.kind === 'lead' && it.lead && window.__openLead) window.__openLead(it.lead); onClose(); }} style={{
              display: 'flex', width: '100%', padding: '11px 16px', alignItems: 'center', gap: 10,
              textAlign: 'left', borderBottom: i < Math.min(15, items.length - 1) ? '1px solid var(--line-2)' : 'none',
              fontSize: 13, color: 'var(--ink-1)',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--card-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span className="chip sm" style={{ fontSize: 9, minWidth: 50, justifyContent: 'center' }}>{it.kind}</span>
              <span className="grow">{it.label}</span>
              {it.hint && <span className="t-11 t-muted">{it.hint}</span>}
            </button>
          ))}
          {items.length === 0 && <div className="body-sm t-muted" style={{ padding: 24, textAlign: 'center' }}>No matches.</div>}
        </div>
        <div className="row" style={{
          padding: '8px 14px', borderTop: '1px solid var(--line-1)',
          background: 'var(--card-2)', gap: 14, fontSize: 10,
        }}>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>↑↓</kbd> navigate</span>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-3)' }}>{items.length} results</span>
        </div>
      </div>
    </div>
  );
};

// ── Kill-switch confirm modal ────────────────────────────────────────────────
const KillSwitchModal = ({ open, action, onConfirm, onCancel }) => {
  if (!open) return null;
  const pausing = action === 'pause';
  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(36,26,12,0.4)', zIndex: 220,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      animation: 'fadeIn 0.18s',
    }}>
      <div onClick={e => e.stopPropagation()} className="card modal-in" style={{
        width: 'min(440px, 100%)', boxShadow: 'var(--shadow-pop)', padding: 24,
      }}>
        <div className="row" style={{ gap: 10, marginBottom: 10 }}>
          <Icon name={pausing ? 'pause' : 'play'} />
          <h3 className="h3" style={{ margin: 0 }}>{pausing ? 'Pause all sending?' : 'Resume sending?'}</h3>
        </div>
        <p className="body-sm" style={{ marginBottom: 16 }}>
          {pausing
            ? 'This sets system_state.paused = true. Every relay, every alias, every cadence touch stops within 60 seconds. Inbound replies still capture and classify.'
            : 'This sets system_state.paused = false. Cadence resumes from where it left off; due touches go out on the next cycle.'}
        </p>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${pausing ? 'bad' : 'clay'}`} onClick={onConfirm}>{pausing ? 'Yes, pause all' : 'Resume sending'}</button>
        </div>
      </div>
    </div>
  );
};

// expose the drawer-opener globally for the command palette (lives INSIDE the provider)
const PaletteBridge = () => {
  const o = useOpenLead();
  React.useEffect(() => { window.__openLead = o; }, [o]);
  return null;
};

// ── Root app ─────────────────────────────────────────────────────────────────
const App = () => {
  const [tab, _setTab] = React.useState(() => location.hash.replace('#', '') || 'now');
  const [sidebarMin, setSidebarMin] = React.useState(false);
  const [dockOpen, setDockOpen] = React.useState(false);
  const [mode, setMode] = React.useState('real');
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [killOn, setKillOn] = React.useState(() => !!(window.TRUTH && window.TRUTH.killSwitchOn));
  const [killModal, setKillModal] = React.useState(null);

  const setTab = t => {
    _setTab(t);
    location.hash = t;
    requestAnimationFrame(() => document.querySelector('.main')?.scrollTo(0, 0));
  };

  React.useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdOpen(o => !o); }
      else if (e.key === 'Escape') { setCmdOpen(false); setKillModal(null); }
      else if ((e.metaKey || e.ctrlKey) && e.key === '\\') { e.preventDefault(); setDockOpen(o => !o); }
    };
    const onHash = () => _setTab(location.hash.replace('#', '') || 'now');
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', onHash); };
  }, []);

  const onKillToggle = () => setKillModal(killOn ? 'resume' : 'pause');
  const onKillConfirm = () => {
    const next = !killOn;
    setKillOn(next); setKillModal(null);
    // persist to the real engine kill-switch (system_state.paused). Fail-safe: revert on error.
    if (window.POST) window.POST('settings/kill-switch', { on: next, reason: 'cockpit' }).then(r => {
      if (r && r.ok === false) setKillOn(!next);
    }).catch(() => setKillOn(!next));
  };

  const TabComp = window[TAB_COMPS[tab]] || (() => (
    <Page><PageHead title="Coming soon" lede={`Tab "${tab}" not built yet.`} /></Page>
  ));

  return (
    <DrawerProvider>
      <ModalProvider>
        <PaletteBridge />
        <div className="app" data-sidebar={sidebarMin ? 'min' : 'full'} data-dock={dockOpen ? 'open' : 'closed'}>
          <Sidebar tab={tab} onTab={setTab} min={sidebarMin} onToggleMin={() => setSidebarMin(m => !m)} mode={mode} />
          <Header mode={mode} setMode={setMode} onCmd={() => setCmdOpen(true)} killOn={killOn} onKillToggle={onKillToggle} />
          <main className="main fade-in" key={tab}>
            <TabComp setTab={setTab} mode={mode} killOn={killOn} onKillToggle={onKillToggle} />
          </main>
          <BottomDock open={dockOpen} onToggle={() => setDockOpen(o => !o)} />
        </div>
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNav={setTab} />
        <KillSwitchModal open={!!killModal} action={killModal} onConfirm={onKillConfirm} onCancel={() => setKillModal(null)} />
      </ModalProvider>
    </DrawerProvider>
  );
};

window.CockpitApp = App;
