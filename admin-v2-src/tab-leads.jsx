// tab-leads.jsx — calm searchable list

const TabLeads = ({ setTab }) => {
  const openLead = useOpenLead();
  const [q, setQ] = React.useState('');
  const [sector, setSector] = React.useState('all');
  const [stage, setStage] = React.useState('all');
  const [minScore, setMinScore] = React.useState(0);
  const [fitOnly, setFitOnly] = React.useState(false);

  const filtered = React.useMemo(() => LEADS.filter(l => {
    if (q && !(l.company.toLowerCase().includes(q.toLowerCase()) || l.domain.includes(q.toLowerCase()))) return false;
    if (sector !== 'all' && l.sector !== sector) return false;
    if (stage !== 'all' && l.stage !== stage) return false;
    if (l.score < minScore) return false;
    if (fitOnly && !l.fit) return false;
    return true;
  }), [q, sector, stage, minScore, fitOnly]);

  return (
    <Page wide>
      <PageHead
        eyebrow="Leads"
        title={`${filtered.length} leads`}
        lede="Every lead in the pipeline. Click a row to open its full record."
        action={<button className="btn">Export CSV</button>}
      />

      {/* Filter row */}
      <Card padding={14} style={{ marginBottom: 18 }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <div className="input" style={{ flex: '1 1 240px', minWidth: 0 }}>
            <Icon name="search" sm />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Company or domain…" />
          </div>
          <Sel value={sector} onChange={setSector} label="sector" options={[['all','All'], ...ICP_SECTORS.map(s => [s, s])]} />
          <Sel value={stage} onChange={setStage} label="stage" options={[['all','All'],['new','new'],['contacted','contacted'],['engaged','engaged'],['replied','replied'],['booked','booked'],['won','won']]} />
          <label className="row" style={{ gap: 6, padding: '7px 12px', border: '1px solid var(--line-1)', borderRadius: 7, background: 'var(--card)' }}>
            <input type="checkbox" checked={fitOnly} onChange={e => setFitOnly(e.target.checked)} style={{ accentColor: 'var(--clay)' }} />
            <span className="t-13">FIT only</span>
          </label>
          <div className="row" style={{ gap: 6, padding: '7px 12px', border: '1px solid var(--line-1)', borderRadius: 7, background: 'var(--card)' }}>
            <span className="eyebrow">min score</span>
            <input type="range" min="0" max="100" value={minScore} onChange={e => setMinScore(+e.target.value)} style={{ width: 100 }} />
            <span className="t-num t-12" style={{ width: 24 }}>{minScore}</span>
          </div>
          <button className="btn ghost sm" onClick={() => { setQ(''); setSector('all'); setStage('all'); setMinScore(0); setFitOnly(false); }}>Reset</button>
        </div>
      </Card>

      {/* List */}
      <Card padding={0}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Company</th><th>Sector · Geo</th><th>Score</th><th>Stage</th><th>Cadence</th><th>Last action</th><th>Stream</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} onClick={() => openLead(l)} style={{ cursor: 'pointer' }}>
                <td>
                  <div className="t-13" style={{ fontWeight: 500, color: 'var(--ink-1)' }}>{l.company}</div>
                  <div className="t-11 t-mono t-muted">{l.domain}</div>
                </td>
                <td>
                  <div className="t-12">{l.sector}</div>
                  <div className="t-11 t-mono t-muted">{l.geo}</div>
                </td>
                <td><ScorePill score={l.score} fit={l.fit} /></td>
                <td><StatusChip status={l.stage === 'won' ? 'ok' : l.stage === 'replied' || l.stage === 'booked' || l.stage === 'engaged' ? 'info' : l.stage === 'lost' || l.stage === 'opt-out' ? 'bad' : 'idle'} label={l.stage} sm /></td>
                <td><TouchProgression history={l.touch_history} sm /></td>
                <td className="t-11 t-muted">{l.last_touch_sent}</td>
                <td><span className="chip sm">{l.stream}</span></td>
                <td onClick={e => e.stopPropagation()}><button className="btn ghost xs">⋯</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Page>
  );
};

const Sel = ({ value, onChange, label, options }) => (
  <div className="row" style={{ padding: '4px 8px 4px 12px', border: '1px solid var(--line-1)', borderRadius: 7, background: 'var(--card)', gap: 6 }}>
    <span className="eyebrow">{label}</span>
    <select value={value} onChange={e => onChange(e.target.value)} style={{ border: 0, outline: 0, background: 'transparent', fontSize: 13, padding: '4px 4px', fontFamily: 'var(--sans)', color: 'var(--ink-1)' }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </div>
);

window.TabLeads = TabLeads;
