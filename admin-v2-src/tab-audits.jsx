// tab-audits.jsx — mint any brand + the tagged audit History. All live data.
const TabAudits = () => {
  const [filter, setFilter] = React.useState('all'); // all | manual | auto
  const audits = (window.AUDITS || []);
  const manual = audits.filter(a => a.tag === 'manual');
  const opened = audits.filter(a => (a.views || 0) > 0);
  const rows = filter === 'all' ? audits : audits.filter(a => a.tag === filter);

  return (
    <Page wide>
      <PageHead
        eyebrow="Audit micro-sites"
        title="Audits"
        lede="Mint a £1,500 audit for any brand, then track every minted page here. Manual mints (from the box below) are tagged so you can tell them apart from the engine's auto-mints."
      />

      <MintBox />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, margin: '22px 0' }}>
        <Stat label="Total audits" value={fmt(audits.length)} sub="minted pages" />
        <Stat label="Manual mints" value={fmt(manual.length)} sub="from the box" kind={manual.length ? 'ok' : undefined} />
        <Stat label="Opened" value={fmt(opened.length)} sub="prospect viewed" kind={opened.length ? 'ok' : undefined} />
        <Stat label="Auto mints" value={fmt(audits.length - manual.length)} sub="from the engine" />
      </div>

      <Section
        title="History"
        lede="Every minted audit, newest first. Click the link to open the live page."
        action={
          <div className="row" style={{ gap: 4 }}>
            {['all', 'manual', 'auto'].map(f => (
              <button key={f} className={`btn ${filter === f ? 'primary' : 'ghost'} sm`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        }
      >
        <Card padding={0}>
          {rows.length === 0 ? (
            <Empty title="No audits yet" lede="Mint one with the box above, or the engine will mint qualified leads automatically." />
          ) : (
            <table className="tbl">
              <thead><tr><th>Brand</th><th>Tag</th><th>Minted</th><th>Views</th><th>Last view</th><th>Link</th></tr></thead>
              <tbody>
                {rows.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="t-13" style={{ fontWeight: 500 }}>{a.company}</div>
                      <div className="t-11 t-muted">{a.domain}{a.sector ? ` · ${a.sector}` : ''}</div>
                    </td>
                    <td>
                      {a.tag === 'manual'
                        ? <span className="chip clay sm">Manual</span>
                        : <span className="chip sm">Auto</span>}
                    </td>
                    <td className="t-11 t-muted">{a.minted_at || '—'}</td>
                    <td><span className="t-num t-13" style={{ color: (a.views || 0) > 0 ? 'var(--ok)' : 'var(--ink-3)' }}>{a.views || 0}</span></td>
                    <td className="t-11 t-muted">{a.last_view ? String(a.last_view).slice(0, 16).replace('T', ' ') : '—'}</td>
                    <td>{a.url ? <a className="btn ghost xs" href={a.url.startsWith('http') ? a.url : a.url} target="_blank" rel="noopener">open ↗</a> : <span className="t-11 t-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </Section>
    </Page>
  );
};
window.TabAudits = TabAudits;
