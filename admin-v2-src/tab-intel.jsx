// tab-intel.jsx — hourly intel brief archive

const TabIntel = ({ setTab }) => {
  const [selected, setSelected] = React.useState(BRIEFS[0]);
  const [q, setQ] = React.useState('');

  const filtered = BRIEFS.filter(b => !q || b.summary.toLowerCase().includes(q.toLowerCase()));

  return (
    <Page wide>
      <PageHead
        eyebrow="Intelligence"
        title="Hourly briefs"
        lede="The intel-pulse worker writes one every hour. It reads the last 60 minutes of pipeline state and tells you what changed, what to do, and what to approve."
        action={<button className="btn clay">Re-run now</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <Stat label="Briefs generated" value={fmt(1283)} sub="all-time" />
        <Stat label="This week" value="168" sub="every hour" />
        <Stat label="Suggestions approved" value="89%" sub="of actionable items" kind="ok" />
        <Stat label="Auto-applied" value="42%" sub="of approved" kind="ok" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 18, alignItems: 'start' }}>
        <Card padding={0}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--line-1)' }}>
            <div className="input">
              <Icon name="search" sm />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search past briefs…" />
            </div>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
            {filtered.map((b, i) => {
              const active = selected.n === b.n;
              return (
                <button key={b.n} onClick={() => setSelected(b)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '12px 16px',
                  borderLeft: active ? '3px solid var(--clay)' : '3px solid transparent',
                  background: active ? 'var(--clay-tint)' : 'transparent',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--line-2)' : 'none',
                }}>
                  <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                    <span className="t-mono t-11" style={{ fontWeight: 600, color: 'var(--clay)' }}>#{b.n}</span>
                    <span className="t-mono t-11 t-muted" style={{ marginLeft: 'auto' }}>{b.timestamp.slice(11)}</span>
                  </div>
                  <div className="t-12 t-soft" style={{ fontFamily: 'var(--serif)', lineHeight: 1.5 }}>{b.summary.slice(0, 110)}…</div>
                </button>
              );
            })}
          </div>
        </Card>

        {selected && (
          <div className="col" style={{ gap: 14 }}>
            <Card title={`Brief #${selected.n}`} eyebrow={selected.timestamp} padding={22}
              action={
                <div className="row" style={{ gap: 6 }}>
                  {selected.approved && <span className="chip sm ok">approved</span>}
                  <button className="btn ghost sm">Copy</button>
                </div>
              }
            >
              <p className="body" style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.65, margin: 0, color: 'var(--ink-1)' }}>
                {selected.summary}
              </p>
            </Card>

            <Card title="Ranked improvements" eyebrow="top 3 actions" padding={20}>
              <div className="col" style={{ gap: 10 }}>
                {selected.improvements.map((imp, i) => (
                  <div key={i} className="row" style={{ gap: 12, padding: 12, border: '1px solid var(--line-2)', borderRadius: 7, background: 'var(--card)' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--clay-tint)', color: 'var(--clay-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 12, flexShrink: 0,
                    }}>{i + 1}</div>
                    <span className="t-13 grow">{imp}</span>
                    <button className="btn sm">Apply</button>
                    <button className="btn ghost sm">Defer</button>
                  </div>
                ))}
              </div>
            </Card>

            {selected.question && (
              <Card kind="clay" padding={20}>
                <div className="eyebrow" style={{ color: 'var(--clay-2)', marginBottom: 6 }}>Question for you</div>
                <p className="body-sm" style={{ fontFamily: 'var(--serif)', fontSize: 15, margin: '0 0 12px', color: 'var(--ink-1)' }}>{selected.question}</p>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn clay">Approve</button>
                  <button className="btn">Defer 1h</button>
                  <button className="btn ghost">Reject</button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Page>
  );
};

window.TabIntel = TabIntel;
