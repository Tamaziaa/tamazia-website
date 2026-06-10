// tab-audits.jsx — audit micro-site stats

const TabAudits = ({ setTab }) => {
  const openLead = useOpenLead();
  const totalMinted = 3826;
  const t1Coverage = 88;
  const totalViews = AUDITS.reduce((s, a) => s + a.views, 0) + 1284;
  const replyAttributed = AUDITS.filter(a => a.attributed_reply).length;

  return (
    <Page wide>
      <PageHead
        eyebrow="Audit micro-sites"
        title="Audits"
        lede="A personalised audit page for each lead, signed and time-limited, linked from Touch-1. The strongest single signal we have for reply intent."
        action={<button className="btn">Re-mint failed</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <Stat label="Audits minted" value={fmt(totalMinted)} sub="all-time" />
        <Stat label="Touch-1 coverage" value={`${t1Coverage}%`} sub="audits in T1 email" kind="ok" />
        <Stat label="Total page views" value={fmt(totalViews)} sub="across all audits" />
        <Stat label="Reply-attributed" value={`${replyAttributed} / ${AUDITS.length}`} sub="audits → reply" kind="ok" />
      </div>

      <Section title="14-day mint volume" action={<button className="btn ghost sm">view all metrics</button>}>
        <Card padding={20}>
          <LineChart
            points={[82, 94, 118, 102, 134, 141, 128, 156, 167, 178, 164, 188, 176, 182]}
            labels={days14().map(d => `${d}`)}
            w={820} h={200}
          />
        </Card>
      </Section>

      <Section title="Live audits" lede="Recent mints with view counts and reply attribution.">
        <Card padding={0}>
          <table className="tbl">
            <thead><tr><th>Audit</th><th>Lead</th><th>Minted</th><th>Views</th><th>Last view</th><th>Reply?</th><th></th></tr></thead>
            <tbody>
              {AUDITS.map(a => (
                <tr key={a.id} onClick={() => openLead(a.lead)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="t-mono t-11" style={{ fontWeight: 500 }}>{a.id}</div>
                    <a className="t-mono t-11" style={{ color: 'var(--clay)' }} href={a.url} onClick={e => e.stopPropagation()} target="_blank">{a.url.replace('https://','').slice(0, 38)}…</a>
                  </td>
                  <td>
                    <div className="t-13" style={{ fontWeight: 500 }}>{a.lead.company}</div>
                    <div className="t-11 t-muted">{a.lead.sector}</div>
                  </td>
                  <td className="t-11 t-muted">{a.minted_at}</td>
                  <td>
                    <span className="t-num t-13" style={{ color: a.views > 5 ? 'var(--ok)' : 'var(--ink-1)' }}>{a.views}</span>
                  </td>
                  <td className="t-11 t-muted">{a.last_view || '—'}</td>
                  <td>{a.attributed_reply ? <StatusChip status="ok" label="attributed" sm /> : <span className="t-11 t-muted">—</span>}</td>
                  <td onClick={e => e.stopPropagation()}><button className="btn ghost xs">preview</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Attribution funnel · 30 days" lede="Multi-view audits convert 10× the baseline reply rate.">
        <Card padding={22}>
          <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
            <FunnelStep label="Minted"      value="3,826"  pct="100%" />
            <FunnelStep label="Viewed"      value="1,284"  pct="34%" />
            <FunnelStep label="Multi-view"  value="284"    pct="7%" />
            <FunnelStep label="Attributed"  value="48"     pct="1.3%" kind="ok" last />
          </div>
        </Card>
      </Section>
    </Page>
  );
};

const FunnelStep = ({ label, value, pct, kind, last }) => (
  <React.Fragment>
    <div style={{ flex: 1, minWidth: 120, padding: 14, border: '1px solid var(--line-1)', borderRadius: 7, background: kind === 'ok' ? 'var(--ok-tint)' : 'var(--card)' }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      <div className="t-num" style={{ fontSize: 24, lineHeight: 1.1, color: kind === 'ok' ? 'var(--ok)' : 'var(--ink-1)' }}>{value}</div>
      <div className="t-11 t-muted" style={{ marginTop: 2 }}>{pct}</div>
    </div>
    {!last && <div style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-4)' }}><Icon name="arrowR" sm /></div>}
  </React.Fragment>
);

window.TabAudits = TabAudits;
