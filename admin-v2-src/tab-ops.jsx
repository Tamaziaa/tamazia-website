// tab-ops.jsx — the operator control surface for the engine. Dispatches allowlisted GitHub Actions
// workflows (POST /api/admin/engine/dispatch) and shows live deploy history + system flags (the
// previously-orphan deploys/flags endpoints). Every button is wired to a real workflow; the result
// toast reports the dispatch status. Read panels fetch on mount and never block the rest of the UI.
const TabOps = () => {
  const [toast, setToast] = React.useState('');
  const [busy, setBusy] = React.useState('');
  const [deploys, setDeploys] = React.useState(null);
  const [flags, setFlags] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const d = window.API ? await window.API('deploys') : null;
      const f = window.API ? await window.API('flags') : null;
      if (!alive) return;
      setDeploys((d && d.runs) || []);
      setFlags((f && f.flags) || []);
    })();
    return () => { alive = false; };
  }, []);

  const run = async (workflow, label, inputs) => {
    setBusy(workflow); setToast('');
    let r;
    try { r = await window.POST('engine/dispatch', inputs ? { workflow, inputs } : { workflow }); }
    catch (e) { r = { ok: false, error: e.message }; }
    setBusy('');
    setToast(r && r.ok ? `${label} dispatched — running on GitHub Actions.` : `${label} failed: ${(r && (r.error || ('HTTP ' + r.status))) || 'error'}`);
  };

  const GROUPS = [
    { title: 'Pipeline', items: [
      ['engine', 'Run full engine cycle'],
      ['backlog', 'Backlog burst (requalify + enrich + mint)'],
      ['verify', 'Verify backlog (email)'],
      ['llm_rescue', 'LLM rescue (find missing contact)'],
      ['mint', 'Drain mint queue now'],
      ['remint', 'Re-mint audits'],
    ] },
    { title: 'Sourcing', items: [
      ['source', 'Source leads (channels)'],
      ['source_registers', 'Source from Companies House'],
      ['source_sponsored', 'Source sponsored targets'],
      ['smatleads', 'Sync SmatLeads pool'],
    ] },
    { title: 'Enrich · sync · reports', items: [
      ['ahrefs', 'Ahrefs enrich'],
      ['apollo', 'Apollo enrich'],
      ['notion', 'Sync Notion'],
      ['deliverability', 'Deliverability guard'],
      ['digest', 'Send founder digest'],
      ['capacity', 'Capacity report'],
    ] },
  ];

  const engine = window.ENGINE_STATUS || null;

  return (
    <Page>
      <PageHead eyebrow="engine control" title="Ops"
        lede="Trigger any engine job on demand. Each runs as a GitHub Actions workflow; watch progress in the run links below. Sending stays governed by the kill-switch." />

      {toast && <Card padding={12} style={{ marginBottom: 14 }}><span className="t-13">{toast}</span></Card>}

      {engine && (
        <Section title="Engine status">
          <Card padding={14}><div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
            <span className="t-12">cycle: <b>{(engine.engine && engine.engine.conclusion) || (engine.engine && engine.engine.status) || '—'}</b></span>
            {engine.engine && engine.engine.url && <a className="t-12" href={engine.engine.url} target="_blank" rel="noopener">last run ↗</a>}
            {engine.engine && engine.engine.at && <span className="t-12 t-muted">{engine.engine.at}</span>}
          </div></Card>
        </Section>
      )}

      {GROUPS.map(g => (
        <Section key={g.title} title={g.title}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {g.items.map(([wf, label]) => (
              <button key={wf} className="btn" disabled={busy === wf} onClick={() => run(wf, label)} style={{ justifyContent: 'flex-start' }}>
                {busy === wf ? 'Dispatching…' : label}
              </button>
            ))}
          </div>
        </Section>
      ))}

      <Section title="System flags">
        {flags == null ? <Card padding={14}><span className="t-12 t-muted">loading…</span></Card>
          : flags.length === 0 ? <Card padding={0}><Empty title="No flags" lede="Nothing needs attention." /></Card>
          : <Card padding={0}><table className="tbl"><thead><tr><th>Level</th><th>What</th><th>Count</th></tr></thead>
              <tbody>{flags.map((f, i) => <tr key={i}><td><span className={`chip sm ${f.level === 'p1' ? 'bad' : 'warn'}`}>{f.level}</span></td><td className="t-12">{f.msg || f.kind}</td><td className="t-12">{f.count != null ? f.count : '—'}</td></tr>)}</tbody></table></Card>}
      </Section>

      <Section title="Recent deploys">
        {deploys == null ? <Card padding={14}><span className="t-12 t-muted">loading…</span></Card>
          : deploys.length === 0 ? <Card padding={0}><Empty title="No deploys" lede="No recent deploy runs found." /></Card>
          : <Card padding={0}><table className="tbl"><thead><tr><th>When</th><th>Commit</th><th>Status</th><th></th></tr></thead>
              <tbody>{deploys.slice(0, 12).map((r, i) => (
                <tr key={i}><td className="t-12">{r.created_at}</td><td className="t-12 t-mono">{(r.sha || '').slice(0, 7)} {(r.title || '').slice(0, 48)}</td>
                  <td><span className={`chip sm ${r.conclusion === 'success' ? 'ok' : r.conclusion === 'failure' ? 'bad' : 'warn'}`}>{r.conclusion || r.status}</span></td>
                  <td>{r.url && <a className="t-12" href={r.url} target="_blank" rel="noopener">↗</a>}</td></tr>
              ))}</tbody></table></Card>}
      </Section>
    </Page>
  );
};
window.TabOps = TabOps;
