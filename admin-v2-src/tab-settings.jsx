// tab-settings.jsx — settings & connectors

const TabSettings = ({ setTab, killOn, onKillToggle }) => {
  return (
    <Page>
      <PageHead
        eyebrow="Settings"
        title="Cockpit settings"
        lede="Connectors, cadence policy, the kill-switch, the ICP filter, and notification routing."
      />

      {/* Kill switch */}
      <Section title="Sending" lede="The one switch that stops every relay, every alias, every cadence touch within 60 seconds.">
        <Card padding={22} kind={killOn ? 'bad' : null}>
          <div className="row" style={{ gap: 14 }}>
            <span style={{
              width: 44, height: 44, borderRadius: 8,
              background: killOn ? '#b14730' : 'var(--ok-tint)',
              color: killOn ? 'white' : 'var(--ok)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><Icon name={killOn ? 'pause' : 'play'} /></span>
            <div className="grow">
              <div className="h3" style={{ margin: 0 }}>{killOn ? 'All sending is paused.' : 'Sending is on.'}</div>
              <div className="body-sm t-muted" style={{ marginTop: 2 }}>
                {killOn
                  ? 'system_state.paused = true. Inbound replies still capture and classify.'
                  : 'system_state.paused = false. Cadence runs as scheduled.'}
              </div>
            </div>
            <button className={`btn ${killOn ? 'clay' : 'bad'} lg`} onClick={onKillToggle}>
              {killOn ? 'Resume sending' : 'Pause all sending'}
            </button>
          </div>
        </Card>
      </Section>

      {/* ICP */}
      <Section title="ICP — target sectors" lede="Sourcing is constrained to these sectors. Out-of-sector domains are rejected at ingest.">
        <Card padding={22}>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {ICP_SECTORS.map(s => (
              <span key={s} className="chip clay" style={{ padding: '6px 12px', fontSize: 13 }}>
                {s} <span style={{ marginLeft: 4, opacity: 0.7 }}>×</span>
              </span>
            ))}
            <button className="btn ghost sm">+ Add sector</button>
          </div>
          <div className="t-12 t-muted">Geos: {GEOS.join(' · ')}</div>
        </Card>
      </Section>

      {/* Cadence */}
      <Section title="Cadence policy">
        <Card padding={22}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <SetPill label="Cadence days" value="0 · 5 · 10 · 20 · 35 · 90" />
            <SetPill label="Quality gate" value="≥ 60" />
            <SetPill label="FIT threshold" value="≥ 70 + sector match" />
            <SetPill label="Bounce warn / halt" value="3% · 8% (7d)" />
            <SetPill label="Daily caps per alias" value="25–45" />
            <SetPill label="Business-day math" value="skip weekends + UK holidays" />
            <SetPill label="Local-time window" value="recipient business hours" />
            <SetPill label="Reply pauses cadence" value="yes" />
            <SetPill label="Open + click tracking" value="Cloudflare pixel · phase 4" />
          </div>
        </Card>
      </Section>

      {/* Real / test */}
      <Section title="Real vs test" lede="Sends to these addresses count as TEST and are excluded from the REAL truth-line.">
        <Card padding={22}>
          <div className="col" style={{ gap: 6 }}>
            {TEST_ADDRESSES.map(a => (
              <div key={a} className="row" style={{ gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line-2)' }}>
                <span className="dot warn" />
                <code className="t-mono t-12 grow">{a}</code>
                <button className="btn ghost xs">remove</button>
              </div>
            ))}
            <button className="btn sm" style={{ alignSelf: 'flex-start', marginTop: 8 }}>+ Add rule</button>
          </div>
        </Card>
      </Section>

      {/* Notifications */}
      <Section title="Notifications · routing matrix" lede="Slack and Telegram mirror everything by default; dashboard is the desktop home.">
        <Card padding={0}>
          <table className="tbl">
            <thead>
              <tr><th>Event</th><th>Cockpit</th><th>Slack</th><th>Telegram</th><th>Email</th><th>Sound</th></tr>
            </thead>
            <tbody>
              {[
                ['Critical flag',          true, true, true,  false, true],
                ['New reply · interest',   true, true, true,  false, true],
                ['New reply · meeting',    true, true, true,  false, true],
                ['Bounce-rate warn',       true, true, true,  false, false],
                ['Audit minted',           true, false,false, false, false],
                ['Hourly intel brief',     true, true, false, false, false],
                ['Form submission',        true, true, true,  false, true],
                ['Booking confirmed',      true, true, false, true,  false],
                ['GDPR erasure',           true, true, true,  true,  true ],
              ].map((row, i) => (
                <tr key={i}>
                  <td className="t-13">{row[0]}</td>
                  {row.slice(1).map((v, j) => (
                    <td key={j}><input type="checkbox" defaultChecked={v} style={{ accentColor: 'var(--clay)' }} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      {/* Connectors */}
      <Section title="Connectors" lede="Every external service the engine talks to. Configure each, test the connection, reconnect if needed.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {CONNECTORS.map(c => (
            <Card key={c.name} padding={14}>
              <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                <span className="dot ok" />
                <span className="t-13" style={{ fontWeight: 500 }}>{c.name}</span>
                <span className="chip sm" style={{ marginLeft: 'auto', fontSize: 9 }}>{c.category}</span>
              </div>
              <div className="t-11 t-muted">{c.detail}</div>
              <div className="row" style={{ gap: 6, marginTop: 8 }}>
                <button className="btn ghost xs">configure</button>
                <button className="btn ghost xs">test</button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Suppression / compliance */}
      <Section title="Suppression list" lede={`${fmt(4127)} entries · +12 today · unified across reply / bounce / role / aggregator`}>
        <Card padding={0}>
          <table className="tbl">
            <thead><tr><th>Email</th><th>Reason</th><th>When</th><th>Source</th></tr></thead>
            <tbody>
              {SUPPRESSION.map((s, i) => (
                <tr key={i}>
                  <td className="t-mono t-12">{s.email}</td>
                  <td><span className="chip sm">{s.reason}</span></td>
                  <td className="t-11 t-muted">{s.when}</td>
                  <td className="t-11">{s.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      {/* Danger zone */}
      <Section title="Danger zone">
        <Card padding={22} style={{ borderColor: '#f0c8b6' }}>
          <DangerRow label="Pause all sending"           desc="Halts every relay within 60 seconds." btn="Pause all" onClick={onKillToggle} />
          <DangerRow label="Reset all warmup state"      desc="Sets warmup_day = 1 for every alias. Use only after major domain change." btn="Reset" />
          <DangerRow label="Run retention sweep"         desc="Purges leads older than retention policy (~412 records)." btn="Run sweep" />
          <DangerRow label="Re-sync locked templates"    desc="Resets Touches 1–5 from the approved copy file." btn="Resync" />
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

const DangerRow = ({ label, desc, btn, onClick }) => (
  <div className="row" style={{ gap: 12, padding: '10px 0', borderBottom: '1px dashed var(--line-2)' }}>
    <div className="grow">
      <div className="t-13" style={{ fontWeight: 500 }}>{label}</div>
      <div className="t-11 t-muted">{desc}</div>
    </div>
    <button className="btn" onClick={onClick} style={{ borderColor: '#f0c8b6', color: 'var(--clay-2)' }}>{btn}</button>
  </div>
);

window.TabSettings = TabSettings;
