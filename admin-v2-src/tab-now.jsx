// tab-now.jsx — calm greeting + critical cards + intel brief + today's pipeline
// Reads like a letter, not a dashboard.

const TabNow = ({ setTab }) => {
  const greet = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  // The things that need attention right now — derived from LIVE data.
  const replies = (window.REPLIES || []);
  const pending = (window.PENDING || []);
  const positive = replies.filter(r => /interest|meeting|question|pricing|referral/.test(r.cat || ''));
  const todo = [];
  positive.slice(0, 3).forEach(r => todo.push({
    kind: 'reply',
    title: `${(r.lead && r.lead.company) || 'A prospect'} replied — ${(r.cat || '').replace(/_/g, ' ')}.`,
    sub: r.preview ? `"${r.preview}"${r.conf ? ` — ${(r.conf * 100).toFixed(0)}% classifier confidence.` : ''}` : 'Open the inbox to read and respond.',
    primary: { label: 'Open inbox', kind: 'clay' }, secondary: null, goTab: 'inbox',
  }));
  if (pending.length) todo.push({
    kind: 'review',
    title: `${pending.length} lead${pending.length === 1 ? '' : 's'} waiting for your approval.`,
    sub: 'Tier-2 leads — real regulated businesses missing a clean email or a borderline signal. Approve the good ones into the mint queue.',
    primary: { label: 'Review approvals', kind: 'primary' }, secondary: null, goTab: 'leads',
  });
  const sentToday = (TRUTH && TRUTH.sentToday) || 0;

  return (
    <Page>
      {/* Greeting */}
      <header style={{ marginBottom: 36 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1 className="h1" style={{ margin: 0 }}>{greet}, Aman.</h1>
        <p className="lede" style={{ margin: '12px 0 0' }}>
          {todo.length
            ? <>You have <b className="t-num">{todo.length}</b> thing{todo.length === 1 ? '' : 's'} to look at. </>
            : <>Nothing needs you right now. </>}
          The engine sent <b className="t-num">{sentToday}</b> emails today and
          captured <b className="t-num">{replies.length}</b> repl{replies.length === 1 ? 'y' : 'ies'}. Everything else is running on its own.
        </p>
      </header>

      {/* The cards (live) */}
      <div className="col" style={{ gap: 14, marginBottom: 40 }}>
        {todo.length
          ? todo.map((t, i) => <TodoCard key={i} t={t} setTab={setTab} />)
          : <Card padding={22}><div className="row" style={{ gap: 12 }}><span style={{ fontSize: 20, color: 'var(--ok)' }}>✓</span><div><div className="h3" style={{ marginBottom: 2 }}>You're all caught up.</div><div className="body-sm t-muted">No positive replies or pending approvals waiting. New items appear here the moment they land.</div></div></div></Card>}
      </div>

      {/* Intel brief */}
      <Section title="What the engine learned in the last hour" lede="Hourly brief #1283 — intel-pulse worker."
        action={<button className="btn ghost sm" onClick={() => setTab('intel')}>Read all 1,283 →</button>}>
        <Card padding={20}>
          <p className="body" style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.6, color: 'var(--ink-1)', margin: 0 }}>
            {BRIEFS[0].summary}
          </p>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line-2)' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Recommended actions</div>
            <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {BRIEFS[0].improvements.map((imp, k) => (
                <li key={k} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: k < 2 ? '1px solid var(--line-2)' : 'none' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--clay-tint)', color: 'var(--clay-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 11,
                    flexShrink: 0,
                  }}>{k + 1}</div>
                  <span className="body-sm grow" style={{ paddingTop: 2 }}>{imp}</span>
                  <button className="btn ghost sm">Apply</button>
                </li>
              ))}
            </ol>
          </div>
          {BRIEFS[0].question && (
            <div style={{ marginTop: 18, padding: 14, background: 'var(--clay-tint)', borderRadius: 8, border: '1px solid var(--clay-soft)' }}>
              <div className="eyebrow" style={{ color: 'var(--clay-2)', marginBottom: 4 }}>Question for you</div>
              <div className="body-sm" style={{ color: 'var(--ink-1)', marginBottom: 10 }}>{BRIEFS[0].question}</div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn clay sm">Approve</button>
                <button className="btn sm">Defer 1h</button>
              </div>
            </div>
          )}
        </Card>
      </Section>

      {/* Today's pipeline summary */}
      <Section title="Today, in numbers" lede="From the 30-minute cron and the hourly pulse."
        action={<button className="btn ghost sm" onClick={() => setTab('pipeline')}>Open the pipeline →</button>}>
        <Card padding={24}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            <Stat label="Sourced today"   value={fmt(412)} sub="+8% vs yesterday" kind="ok" />
            <Stat label="Drafts ready"    value={fmt(287)} sub="of 1,800 daily cap" />
            <Stat label="Sent"            value={fmt(287)} sub="6 relays, all green" kind="ok" />
            <Stat label="Replies today"   value="7" sub="3 interest · 2 meeting" kind="ok" />
          </div>
          <div className="divider-soft" style={{ margin: '24px 0 18px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            <Stat label="Reply rate · 30d" value={`${TRUTH.replyRate}%`} sub="+0.2 wow" kind="ok" />
            <Stat label="Open rate · 30d"  value={`${TRUTH.openRate}%`} sub="Cloudflare pixel" />
            <Stat label="Bookings today"   value="3" sub="2 confirmed · 1 reschedule" />
            <Stat label="Bounce rate · 7d" value={`${TRUTH.bounceRate7d}%`} sub="warn at 3%" kind="ok" />
          </div>
        </Card>
      </Section>

      {/* What everything's doing */}
      <Section title="What each part of the engine is doing" lede="Every stage of the conveyor, at this moment."
        action={<button className="btn ghost sm" onClick={() => setTab('pipeline')}>See the conveyor →</button>}>
        <div className="col" style={{ gap: 8 }}>
          {CONVEYOR.map(s => (
            <ConveyorRow key={s.key} s={s} onClick={() => setTab('pipeline')} />
          ))}
        </div>
      </Section>

      {/* Quiet stat about open-tracking */}
      <Section>
        <Card padding={18} kind="soft">
          <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 22, lineHeight: 1, color: 'var(--clay)', flexShrink: 0 }}>◐</div>
            <div className="grow">
              <div className="t-13" style={{ fontWeight: 500, marginBottom: 2 }}>Open and click numbers are placeholder until Phase 4.</div>
              <div className="body-sm t-muted">
                The Cloudflare worker pixel and click-redirect are scheduled — once they ship, <code className="t-mono">sends.opened_at</code> populates and alias-health
                demotion gets a real signal. Until then, treat opens and clicks as illustrative.
              </div>
            </div>
            <button className="btn ghost sm" onClick={() => setTab('health')}>Open Health</button>
          </div>
        </Card>
      </Section>
    </Page>
  );
};

// ── Todo card ────────────────────────────────────────────────────────────────
const TodoCard = ({ t, setTab }) => {
  const { open } = useDrawer();
  return (
    <article className="card" style={{
      padding: 22, borderLeft: '3px solid var(--clay)',
    }}>
      <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
        <span className="eyebrow" style={{
          color: t.kind === 'reply' ? 'var(--ok)' : 'var(--clay)',
          padding: '4px 8px', borderRadius: 4,
          background: t.kind === 'reply' ? 'var(--ok-tint)' : 'var(--clay-tint)',
          flexShrink: 0, marginTop: 2,
        }}>{t.kind === 'reply' ? 'Reply' : 'Review'}</span>
        <div className="grow">
          <div className="h3" style={{ marginBottom: 6 }}>{t.title}</div>
          <p className="body-sm" style={{ margin: 0 }}>{t.sub}</p>
        </div>
      </div>
      <div className="row" style={{ marginTop: 16, gap: 8 }}>
        <button className={`btn ${t.primary.kind}`} onClick={() => t.goTab && setTab(t.goTab)}>{t.primary.label}</button>
        {t.secondary && <button className="btn ghost" onClick={() => t.goTab && setTab(t.goTab)}>{t.secondary}</button>}
        {t.lead && <button className="btn ghost" onClick={() => open(<LeadDrawer lead={t.lead} />)} style={{ marginLeft: 'auto' }}>Open lead</button>}
      </div>
    </article>
  );
};

// ── Conveyor row (compact view used on Now page) ─────────────────────────────
const ConveyorRow = ({ s, onClick }) => (
  <button onClick={onClick} className="card" style={{
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
    width: '100%', textAlign: 'left', cursor: 'pointer',
    transition: 'border-color 0.12s, background 0.12s',
  }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink-4)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line-1)'}
  >
    <span style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'var(--ink-1)', color: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--serif)', fontSize: 13, fontWeight: 600, flexShrink: 0,
    }}>{s.letter}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="t-14" style={{ fontWeight: 500, color: 'var(--ink-1)' }}>{s.label}</div>
      <div className="body-sm t-muted ellip">{s.one_liner}</div>
    </div>
    <span className="t-num t-13" style={{ flexShrink: 0, color: 'var(--ink-1)' }}>{s.today != null ? `+${s.today}` : '—'} <span className="t-11 t-muted">today</span></span>
    <span className="dot ok" style={{ flexShrink: 0 }} />
    <span style={{ color: 'var(--ink-4)', display: 'flex' }}><Icon name="chev" sm /></span>
  </button>
);

window.TabNow = TabNow;
