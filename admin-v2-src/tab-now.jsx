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

      {/* Mint any brand + run controls */}
      <MintBox />
      <QuickActions />

      {/* The cards (live) */}
      <div className="col" style={{ gap: 14, margin: '24px 0 40px' }}>
        {todo.length
          ? todo.map((t, i) => <TodoCard key={i} t={t} setTab={setTab} />)
          : <Card padding={22}><div className="row" style={{ gap: 12 }}><span style={{ fontSize: 20, color: 'var(--ok)' }}>✓</span><div><div className="h3" style={{ marginBottom: 2 }}>You're all caught up.</div><div className="body-sm t-muted">No positive replies or pending approvals waiting. New items appear here the moment they land.</div></div></div></Card>}
      </div>

      {/* The funnel — live counts straight from Neon (window.TRUTH.funnel) */}
      <Section title="The pipeline, right now" lede="Every lead's stage, live from the database.">
        {(() => {
          const f = (TRUTH && TRUTH.funnel) || {};
          const n = k => f[k] != null ? f[k] : 0;
          const total = Object.values(f).reduce((s, v) => s + (Number(v) || 0), 0);
          const emailReady = (window.AUDITS || []).length ? n('qualified') : n('qualified'); // qualified leads are mint-eligible
          const cells = [
            { l: 'In pipeline', v: total, k: undefined },
            { l: 'Sourced', v: n('sourced'), k: undefined },
            { l: 'Enriched', v: n('enriched'), k: undefined },
            { l: 'Qualified (Tier-1)', v: n('qualified'), k: 'ok' },
            { l: 'Pending approval', v: n('pending_approval'), k: n('pending_approval') ? 'warn' : undefined },
            { l: 'Replied', v: n('replied'), k: n('replied') ? 'ok' : undefined },
            { l: 'Booked', v: n('booked'), k: n('booked') ? 'ok' : undefined },
            { l: 'Rejected', v: n('rejected'), k: undefined },
          ];
          return (
            <Card padding={24}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
                {cells.map((c, i) => <Stat key={i} label={c.l} value={fmt(c.v)} kind={c.k} />)}
              </div>
            </Card>
          );
        })()}
      </Section>
    </Page>
  );
};

// ── Quick actions — run the engine / re-score the pile (wired to engine/dispatch) ──
const QuickActions = () => {
  const [busy, setBusy] = React.useState(null);
  const [msg, setMsg] = React.useState(null);
  const fire = async (workflow, label) => {
    setBusy(workflow); setMsg(null);
    const r = window.POST ? await window.POST('engine/dispatch', { workflow }) : { ok: false };
    setBusy(null);
    setMsg(r && r.ok ? `${label} started — it runs in GitHub Actions (no sending).` : `Could not start ${label}.`);
  };
  return (
    <Card padding={16} style={{ marginBottom: 0 }}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <div className="grow">
          <div className="t-13" style={{ fontWeight: 500 }}>Run the engine</div>
          <div className="body-sm t-muted">Source, enrich, qualify, mint — all £0, no emails sent (paused).</div>
        </div>
        <button className="btn" disabled={!!busy} onClick={() => fire('engine', 'Engine cycle')}>{busy === 'engine' ? 'Starting…' : 'Run engine now'}</button>
        <button className="btn" disabled={!!busy} onClick={() => fire('requalify', 'Re-qualify')}>{busy === 'requalify' ? 'Starting…' : 'Re-qualify the pile'}</button>
      </div>
      {msg && <div className="body-sm" style={{ marginTop: 8, color: /Could not/.test(msg) ? 'var(--clay-2)' : 'var(--ok)' }}>{msg}</div>}
    </Card>
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

window.TabNow = TabNow;
