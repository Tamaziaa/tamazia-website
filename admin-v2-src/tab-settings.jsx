// tab-settings.jsx — only the controls that actually do something. No decoration.
const TabSettings = ({ killOn, onKillToggle }) => {
  const connectors = (window.CONNECTORS || []);
  const sectors = (window.ICP_SECTORS || []);
  return (
    <Page>
      <PageHead eyebrow="Settings" title="Controls" lede="The switches that actually do something, and what the engine is connected to." />

      {/* Sending kill-switch (writes engine system_state.paused) */}
      <Section title="Sending" lede="One switch. It writes system_state.paused, which the engine checks every cycle — sending halts within 60 seconds. Inbound replies still capture.">
        <Card padding={22} kind={killOn ? 'bad' : null}>
          <div className="row" style={{ gap: 14 }}>
            <span style={{
              width: 44, height: 44, borderRadius: 8,
              background: killOn ? '#b14730' : 'var(--ok-tint)', color: killOn ? 'white' : 'var(--ok)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><Icon name={killOn ? 'pause' : 'play'} /></span>
            <div className="grow">
              <div className="h3" style={{ margin: 0 }}>{killOn ? 'All sending is paused.' : 'Sending is on.'}</div>
              <div className="body-sm t-muted" style={{ marginTop: 2 }}>
                {killOn ? 'system_state.paused = true.' : 'system_state.paused = false. Cadence runs as scheduled.'}
              </div>
            </div>
            <button className={`btn ${killOn ? 'clay' : 'bad'} lg`} onClick={onKillToggle}>
              {killOn ? 'Resume sending' : 'Pause all sending'}
            </button>
          </div>
        </Card>
      </Section>

      {/* System health — LIVE probes from /api/admin/health */}
      <Section title="System health" lede="Every external service the engine talks to, checked live.">
        {connectors.length === 0
          ? <Card padding={20}><div className="body-sm t-muted">Loading health checks…</div></Card>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {connectors.map((c, i) => (
                <Card key={i} padding={14}>
                  <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                    <span className={`dot ${c.status === 'ok' ? 'ok' : c.status === 'warn' ? 'warn' : 'bad'}`} />
                    <span className="t-13" style={{ fontWeight: 500 }}>{c.name}</span>
                    <span className="chip sm" style={{ marginLeft: 'auto', fontSize: 9 }}>{c.category}</span>
                  </div>
                  <div className="t-11 t-muted">{c.detail}</div>
                </Card>
              ))}
            </div>
          )}
      </Section>

      {/* Engine workflows — live from GitHub Actions */}
      <Section title="Engine runs" lede="The 30-minute cycle and the hourly intel pulse, live from GitHub Actions.">
        {(() => {
          const es = window.ENGINE_STATUS;
          const one = (label, r) => (
            <Card padding={14} key={label}>
              <div className="row" style={{ gap: 8 }}>
                <span className={`dot ${r ? (r.conclusion === 'success' ? 'ok' : r.status === 'in_progress' || r.status === 'queued' ? 'warn' : 'bad') : 'idle'}`} />
                <span className="t-13" style={{ fontWeight: 500 }}>{label}</span>
                <span className="t-11 t-muted" style={{ marginLeft: 'auto' }}>{r ? `${r.status}${r.conclusion ? ' · ' + r.conclusion : ''} · ${(r.at || '').slice(0, 16).replace('T', ' ')}` : 'no data'}</span>
                {r && r.url && <a className="btn ghost xs" href={r.url} target="_blank" rel="noopener">logs ↗</a>}
              </div>
            </Card>
          );
          return <div className="col" style={{ gap: 8 }}>{one('Engine cycle (every 30 min)', es && es.engine)}{one('Intel pulse (hourly)', es && es.intel)}</div>;
        })()}
      </Section>

      {/* Suppression — the do-not-contact truth (Neon suppression table) */}
      <Section title="Suppression list" lede="Anyone here is never contacted again. Repliers and opt-outs are added automatically; you can add manually from the Inbox.">
        {(() => {
          const s = window.SUPPRESSION_LIVE || { count: 0, rows: [] };
          return (
            <Card padding={s.rows.length ? 0 : 20}>
              {s.rows.length === 0 ? <div className="body-sm t-muted">Empty ({s.count} total). Suppressions appear here as replies and opt-outs land.</div> : (
                <table className="tbl">
                  <thead><tr><th>Email</th><th>Reason</th><th>When</th></tr></thead>
                  <tbody>{s.rows.slice(0, 10).map((r, i) => (
                    <tr key={i}><td className="t-mono t-12">{r.email}</td><td><span className="chip sm">{r.reason || '—'}</span></td><td className="t-11 t-muted">{(r.suppressed_at || '').slice(0, 10)}</td></tr>
                  ))}</tbody>
                </table>
              )}
            </Card>
          );
        })()}
      </Section>

      {/* Read-only facts the admin should be able to see at a glance */}
      <Section title="How the engine is configured" lede="The standing policy. These are facts, not toggles.">
        <Card padding={22}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <SetPill label="Cadence (days)" value="0 · 5 · 10 · 20 · 35 · 90" />
            <SetPill label="Send brain" value="Mystrika (throwaway domains)" />
            <SetPill label="Reply pauses cadence" value="yes" />
            <SetPill label="90-day recycle" value="non-repliers re-enter" />
            <SetPill label="Verify" value="free MX + SMTP + 5 filters" />
            <SetPill label="Target sectors" value={sectors.join(' · ') || '—'} />
          </div>
        </Card>
      </Section>
    </Page>
  );
};

const SetPill = ({ label, value }) => (
  <div style={{ padding: 12, background: 'var(--card-2)', border: '1px solid var(--line-2)', borderRadius: 7 }}>
    <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
    <div className="t-13" style={{ fontWeight: 500 }}>{value}</div>
  </div>
);

window.TabSettings = TabSettings;
