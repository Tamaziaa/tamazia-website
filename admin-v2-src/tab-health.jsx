// tab-health.jsx — 30 probes + connectors + relays + DKIM. Aspirational: all healthy.

const TabHealth = ({ setTab }) => {
  const okN = HEALTH_PROBES.filter(p => p.s === 'ok').length;
  const warnN = HEALTH_PROBES.filter(p => p.s === 'warn').length;
  const badN = HEALTH_PROBES.filter(p => p.s === 'bad').length;

  return (
    <Page>
      <PageHead
        eyebrow="System health"
        title="Everything's running."
        lede={<><b className="t-num">{HEALTH_PROBES.length}</b> probes · <b className="t-num" style={{color:'var(--ok)'}}>{okN}</b> ok · {warnN > 0 ? <><b style={{color:'var(--warn)'}}>{warnN} warn</b> · </> : ''}{badN > 0 ? <><b style={{color:'var(--clay-2)'}}>{badN} bad</b> · </> : ''}runs every 60 seconds.</>}
        action={<button className="btn">Run all now</button>}
      />

      {/* Score */}
      <Card padding={28} style={{ marginBottom: 28 }}>
        <div className="row" style={{ gap: 24, alignItems: 'center' }}>
          <Donut size={140} hole={0.7} label={`${TRUTH.health}`} sub="health"
            slices={[
              { v: okN, color: 'var(--ok)' },
              { v: warnN, color: 'var(--warn)' },
              { v: badN, color: 'var(--clay-2)' },
            ]} />
          <div style={{ flex: 1 }}>
            <h3 className="h3" style={{ margin: 0 }}>Aspirational state: every gap closed.</h3>
            <p className="body-sm" style={{ marginTop: 6, color: 'var(--ink-2)' }}>
              When the audit-doc remediations land (Phases 1–6), every probe stays green, every connector is wired, every cadence touch fires, and every reply gets the LLM treatment. This page reflects that target state.
            </p>
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <span className="chip ok">all probes ok</span>
              <span className="chip ok">all connectors live</span>
              <span className="chip ok">DKIM · SPF · DMARC pass</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Liveness chips */}
      <Section title="Workers" lede="Always-visible heartbeats. Every cron consumer reports its last run.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { k: 'cron-scheduler',    label: 'Cron scheduler',     age: '4m'   },
            { k: 'sender-service',    label: 'Sender service',     age: '2m'   },
            { k: 'scraper-serp',      label: 'Scraper / SERP',     age: '47s'  },
            { k: 'audit-worker',      label: 'Audit worker',       age: '6m'   },
            { k: 'reply-poller',      label: 'Reply poller (IMAP)',age: '38s'  },
            { k: 'intel-pulse',       label: 'Intel-pulse',        age: '12m'  },
            { k: 'host-api',          label: 'Host / API server',  age: '8d 14h' },
            { k: 'warmup-drainer',    label: 'Warmup drainer',     age: '14m'  },
            { k: 'open-pixel',        label: 'Open pixel worker',  age: '58s'  },
          ].map(c => (
            <Card key={c.k} kind="ok" padding={14}>
              <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                <span className="dot live-dot" style={{ background: 'var(--ok)' }} />
                <span className="t-13" style={{ fontWeight: 500 }}>{c.label}</span>
              </div>
              <div className="t-11 t-mono" style={{ color: 'var(--ok)' }}>last run {c.age} ago</div>
            </Card>
          ))}
        </div>
      </Section>

      {/* 30 probes heat grid */}
      <Section title="30 probes · last full sweep" lede="Click any cell to see what it checked.">
        <Card padding={20}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: 4 }}>
            {HEALTH_PROBES.map(p => (
              <div key={p.k} title={`${p.k} · ${p.d}`} style={{
                aspectRatio: '1', borderRadius: 3,
                background: p.s === 'ok' ? 'var(--ok)' : p.s === 'warn' ? 'var(--warn)' : 'var(--clay-2)',
                cursor: 'pointer',
              }} />
            ))}
          </div>
          <div className="row" style={{ marginTop: 14, gap: 16 }}>
            <span className="row" style={{ gap: 6 }}><span className="dot ok" /><span className="t-11">ok · {okN}</span></span>
            {warnN > 0 && <span className="row" style={{ gap: 6 }}><span className="dot warn" /><span className="t-11">warn · {warnN}</span></span>}
            {badN > 0 && <span className="row" style={{ gap: 6 }}><span className="dot bad" /><span className="t-11">bad · {badN}</span></span>}
            <span style={{ flex: 1 }} />
            <span className="t-11 t-muted">last full sweep · 47s ago</span>
          </div>
        </Card>
      </Section>

      {/* Probes by category */}
      <Section title="Probes by category">
        {HEALTH_CATEGORIES.map(cat => {
          const items = HEALTH_PROBES.filter(p => p.c === cat.key);
          if (items.length === 0) return null;
          return (
            <Card key={cat.key} title={cat.label} padding={0} style={{ marginBottom: 12 }}
              action={<span className="chip sm ok">{items.length} ok</span>}>
              <table className="tbl">
                <tbody>
                  {items.map(p => (
                    <tr key={p.k}>
                      <td style={{ width: 24 }}><span className="dot" style={{ background: p.s === 'ok' ? 'var(--ok)' : p.s === 'warn' ? 'var(--warn)' : 'var(--clay-2)' }} /></td>
                      <td className="t-mono t-12" style={{ fontWeight: 500 }}>{p.k}</td>
                      <td className="t-12 t-soft" dangerouslySetInnerHTML={{ __html: p.d }} />
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn ghost xs">re-run</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          );
        })}
      </Section>

      {/* Relays */}
      <Section title="Relays · 24h">
        <Card padding={20}>
          <div className="col" style={{ gap: 10 }}>
            {RELAYS.map(r => (
              <div key={r.name}>
                <div className="row" style={{ gap: 12, marginBottom: 4 }}>
                  <span className="dot ok" />
                  <span className="t-13" style={{ fontWeight: 500, minWidth: 110 }}>{r.name}</span>
                  <div className="grow bar"><i style={{ width: `${(r.sent / r.cap) * 100}%`, background: 'var(--ink-1)' }} /></div>
                  <span className="t-num t-12" style={{ minWidth: 70, textAlign: 'right' }}>{r.sent}/{r.cap}</span>
                  <span className="t-11 t-muted" style={{ minWidth: 60, textAlign: 'right' }}>{Math.round(r.sent / r.cap * 100)}%</span>
                  <button className="btn ghost xs">pause</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* Domain auth */}
      <Section title="Sending domains · DKIM · SPF · DMARC">
        <Card padding={0}>
          <table className="tbl">
            <thead><tr><th>Domain</th><th>DKIM</th><th>SPF</th><th>DMARC</th><th>Warmup</th><th>Reputation</th></tr></thead>
            <tbody>
              {DOMAIN_AUTH.map(d => (
                <tr key={d.domain}>
                  <td className="t-mono t-12" style={{ fontWeight: 500 }}>{d.domain}</td>
                  <td><StatusChip status="ok" label="pass" sm /></td>
                  <td><StatusChip status="ok" label="pass" sm /></td>
                  <td><StatusChip status="ok" label="pass" sm /></td>
                  <td><StatusChip status="ok" label="complete" sm /></td>
                  <td className="t-num t-12" style={{ color: 'var(--ok)' }}>{d.rep}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      {/* Connectors */}
      <Section title="Connectors · all live" lede="Every external service the engine talks to.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {CONNECTORS.map(c => (
            <Card key={c.name} padding={14} kind="ok">
              <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                <span className="dot ok" />
                <span className="t-13" style={{ fontWeight: 500 }}>{c.name}</span>
                <span className="chip sm" style={{ marginLeft: 'auto', fontSize: 9, background: 'var(--card)' }}>{c.category}</span>
              </div>
              <div className="t-11" style={{ color: 'var(--ok)' }}>{c.detail}</div>
            </Card>
          ))}
        </div>
      </Section>
    </Page>
  );
};

window.TabHealth = TabHealth;
