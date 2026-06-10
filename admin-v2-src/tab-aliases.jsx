// tab-aliases.jsx — 90 mailboxes grouped by relay/domain

const TabAliases = ({ setTab }) => {
  const [groupBy, setGroupBy] = React.useState('relay');
  const [selected, setSelected] = React.useState(null);

  const groups = React.useMemo(() => {
    const m = new Map();
    ALIASES.forEach(a => {
      const k = a[groupBy];
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(a);
    });
    return Array.from(m.entries());
  }, [groupBy]);

  const stats = {
    total: ALIASES.length,
    healthy: ALIASES.filter(a => a.status === 'healthy').length,
    warmup: ALIASES.filter(a => a.status === 'warmup').length,
    sent_today: ALIASES.reduce((s, a) => s + a.sent_today, 0),
    quota: ALIASES.reduce((s, a) => s + a.day_quota, 0),
  };

  return (
    <Page wide>
      <PageHead
        eyebrow="Aliases · 90 mailboxes"
        title="Sender identities"
        lede="Each persona has its own daily cap, warmup schedule, and health score. The rotator picks the right alias for every send."
        action={<button className="btn">Add alias</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <Stat label="Aliases · total" value={stats.total} sub={`${DOMAINS.length} domains · ${RELAYS.length} relays`} />
        <Stat label="Healthy"          value={stats.healthy} sub={`${Math.round(stats.healthy / stats.total * 100)}%`} kind="ok" />
        <Stat label="In warmup"        value={stats.warmup} sub={`${stats.warmup} ramping`} kind="warn" />
        <Stat label="Sent today"       value={fmt(stats.sent_today)} sub={`of ${fmt(stats.quota)} quota (${Math.round(stats.sent_today / stats.quota * 100)}%)`} />
      </div>

      <Card padding={14} style={{ marginBottom: 18 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="eyebrow">Group by</span>
          {['relay', 'domain', 'status'].map(g => (
            <button key={g} className={`chip sm ${groupBy === g ? 'clay' : ''}`} onClick={() => setGroupBy(g)}>{g}</button>
          ))}
        </div>
      </Card>

      <div className="col" style={{ gap: 14 }}>
        {groups.map(([key, items]) => (
          <Card key={key}
            title={<span style={{ textTransform: 'capitalize' }}>{key}</span>}
            eyebrow={`${items.length} aliases · ${items.reduce((s, a) => s + a.sent_today, 0)} sent today`}
            padding={0}
            action={
              <div className="row" style={{ gap: 4 }}>
                <span className="chip sm ok">{items.filter(a => a.status === 'healthy').length} healthy</span>
                {items.filter(a => a.status === 'warmup').length > 0 && <span className="chip sm warn">{items.filter(a => a.status === 'warmup').length} warmup</span>}
              </div>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 0 }}>
              {items.map(a => <AliasCard key={a.id} a={a} onClick={() => setSelected(a)} />)}
            </div>
          </Card>
        ))}
      </div>

      {selected && <AliasDrawer a={selected} onClose={() => setSelected(null)} />}
    </Page>
  );
};

const AliasCard = ({ a, onClick }) => {
  const color = a.status === 'healthy' ? 'var(--ok)' : a.status === 'warmup' ? 'var(--warn)' : 'var(--clay-2)';
  const usage = a.day_quota > 0 ? a.sent_today / a.day_quota : 0;
  return (
    <button onClick={onClick} style={{
      padding: 14, textAlign: 'left', cursor: 'pointer',
      borderLeft: `3px solid ${color}`,
      borderTop: '1px solid var(--line-2)', borderBottom: '1px solid var(--line-2)',
      background: 'var(--card)',
    }}>
      <div className="row" style={{ gap: 6, marginBottom: 4 }}>
        <span className="dot" style={{ background: color }} />
        <span className="t-mono t-12 ellip" style={{ fontWeight: 500 }}>{a.email}</span>
      </div>
      <div className="t-11 t-muted" style={{ marginBottom: 8 }}>
        {a.persona} · {a.relay}{a.warmup_day ? ` · warmup d${a.warmup_day}` : ''}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <div className="grow bar" style={{ height: 5 }}>
          <i style={{ width: `${Math.min(100, usage * 100)}%`, background: usage > 0.9 ? 'var(--warn)' : color }} />
        </div>
        <span className="t-num t-11" style={{ minWidth: 56, textAlign: 'right' }}>{a.sent_today}/{a.day_quota}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <Sparkline points={a.sparkline} w={232} h={20} color={color} fill={false} strokeWidth={1.2} />
      </div>
    </button>
  );
};

const AliasDrawer = ({ a, onClose }) => (
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,26,12,0.32)', zIndex: 90, animation: 'fadeIn 0.18s' }} />
    <div className="drawer-in" style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(520px, 96vw)',
      background: 'var(--bg)', borderLeft: '1px solid var(--line-1)', zIndex: 100,
      overflowY: 'auto', boxShadow: 'var(--shadow-pop)',
    }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--line-1)' }}>
        <div className="spread" style={{ marginBottom: 6 }}>
          <span className="eyebrow">Alias #{a.id} · {a.relay} · {a.domain}</span>
          <button className="btn ghost icon" onClick={onClose}><Icon name="x" sm /></button>
        </div>
        <h2 className="h2" style={{ margin: 0, fontSize: 22 }}>{a.email}</h2>
        <div className="t-12 t-muted" style={{ marginTop: 4 }}>Persona: <b style={{ color: 'var(--ink-1)' }}>{a.persona}</b></div>
      </div>

      <div className="col" style={{ padding: 22, gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Card padding={14}><Stat label="Status" value={a.status} kind={a.status === 'healthy' ? 'ok' : 'warn'} /></Card>
          <Card padding={14}><Stat label="Sent today" value={`${a.sent_today} / ${a.day_quota}`} sub={`${Math.round(a.sent_today / a.day_quota * 100)}% of cap`} /></Card>
          <Card padding={14}><Stat label="Open rate" value={`${(a.open_rate * 100).toFixed(0)}%`} sub="placeholder · phase 4" /></Card>
          <Card padding={14}><Stat label="Bounce rate" value={`${(a.bounce_rate * 100).toFixed(1)}%`} sub="halt at 8%" kind="ok" /></Card>
        </div>

        <Card title="14-day send history" padding={16}>
          <Sparkline points={a.sparkline} w={460} h={70} color="var(--clay)" fill />
        </Card>

        <Card title="Warmup ramp" eyebrow="30-day plan" padding={16}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 2 }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const done = a.warmup_day ? i < a.warmup_day : true;
              const cur = a.warmup_day && a.warmup_day === i + 1;
              return <div key={i} style={{
                aspectRatio: '1', borderRadius: 2,
                background: cur ? 'var(--clay)' : done ? 'var(--ok)' : 'var(--card-3)',
              }} />;
            })}
          </div>
          <div className="t-11 t-muted" style={{ marginTop: 8 }}>
            {a.warmup_day ? `Day ${a.warmup_day} of 30 · ${30 - a.warmup_day} days to full quota` : 'Warmup complete · running at full quota'}
          </div>
        </Card>

        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          <button className="btn">Demote</button>
          <button className="btn">Pause sending</button>
          <button className="btn">Edit persona</button>
          <button className="btn ghost">Rotate relay</button>
        </div>
      </div>
    </div>
  </>
);

window.TabAliases = TabAliases;
