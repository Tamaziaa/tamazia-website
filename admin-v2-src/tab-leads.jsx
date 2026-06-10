// tab-leads.jsx — the lead table. Live filters (options derived from the data), working CSV
// export, the Tier-2 approval queue, and "Add VIP lead" (CC-5) wired to leads/add-manual.
const TabLeads = () => {
  const openLead = useOpenLead();
  const leads = (window.LEADS || []);
  const pending = (window.PENDING || []);
  const [q, setQ] = React.useState('');
  const [sector, setSector] = React.useState('all');
  const [stage, setStage] = React.useState('all');
  const [fitOnly, setFitOnly] = React.useState(false);
  const [view, setView] = React.useState('all'); // all | approvals
  const [showVip, setShowVip] = React.useState(false);

  const sectors = React.useMemo(() => ['all', ...Array.from(new Set(leads.map(l => l.sector).filter(Boolean))).sort()], [leads]);
  const stages = React.useMemo(() => ['all', ...Array.from(new Set(leads.map(l => l.stage).filter(Boolean))).sort()], [leads]);

  const base = view === 'approvals' ? pending : leads;
  const filtered = React.useMemo(() => base.filter(l => {
    if (q && !((l.company || '').toLowerCase().includes(q.toLowerCase()) || (l.domain || '').includes(q.toLowerCase()))) return false;
    if (sector !== 'all' && l.sector !== sector) return false;
    if (stage !== 'all' && l.stage !== stage) return false;
    if (fitOnly && !l.fit) return false;
    return true;
  }), [base, q, sector, stage, fitOnly]);

  const exportCsv = () => {
    const cols = ['id', 'company', 'domain', 'sector', 'jurisdiction', 'stage', 'icp_tier', 'score', 'fit', 'contact_email', 'verify_status', 'audit_url', 'priority_source', 'created_at'];
    const lines = [cols.join(',')].concat(filtered.map(l => cols.map(c => {
      const v = l[c] == null ? '' : String(l[c]);
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tamazia-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <Page wide>
      <PageHead
        eyebrow="Leads"
        title={`${filtered.length} ${view === 'approvals' ? 'awaiting approval' : 'leads'}`}
        lede={view === 'approvals'
          ? 'Tier-2 leads — real regulated businesses missing a clean email or borderline. Open one and approve or reject.'
          : 'Every lead, ranked best-first (VIPs on top). Click a row for the full record and actions.'}
        action={
          <div className="row" style={{ gap: 6 }}>
            <button className="btn clay" onClick={() => setShowVip(true)}>+ Add VIP lead</button>
            <button className="btn" onClick={exportCsv}>Export CSV</button>
          </div>
        }
      />

      {/* view switch */}
      <div className="row" style={{ gap: 6, marginBottom: 14 }}>
        <button className={`chip ${view === 'all' ? 'clay' : ''}`} onClick={() => setView('all')}>All · {leads.length}</button>
        <button className={`chip ${view === 'approvals' ? 'clay' : ''}`} onClick={() => setView('approvals')}>Needs approval · {pending.length}</button>
      </div>

      {/* Filter row */}
      <Card padding={14} style={{ marginBottom: 18 }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <div className="input" style={{ flex: '1 1 240px', minWidth: 0 }}>
            <Icon name="search" sm />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Company or domain…" />
          </div>
          <Sel value={sector} onChange={setSector} label="sector" options={sectors.map(s => [s, s])} />
          <Sel value={stage} onChange={setStage} label="stage" options={stages.map(s => [s, s])} />
          <label className="row" style={{ gap: 6, padding: '7px 12px', border: '1px solid var(--line-1)', borderRadius: 7, background: 'var(--card)' }}>
            <input type="checkbox" checked={fitOnly} onChange={e => setFitOnly(e.target.checked)} style={{ accentColor: 'var(--clay)' }} />
            <span className="t-13">Tier-1 only</span>
          </label>
          <button className="btn ghost sm" onClick={() => { setQ(''); setSector('all'); setStage('all'); setFitOnly(false); }}>Reset</button>
        </div>
      </Card>

      {/* List */}
      <Card padding={0}>
        {filtered.length === 0 ? (
          <Empty title={view === 'approvals' ? 'Approval queue is clear.' : 'No leads match this filter.'} />
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Company</th><th>Sector · Geo</th><th>Score</th><th>Tier</th><th>Stage</th><th>Email</th><th>Audit</th></tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map(l => (
                <tr key={l.id} onClick={() => openLead(l)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <span className="t-13" style={{ fontWeight: 500, color: 'var(--ink-1)' }}>{l.company}</span>
                      {l.priority_source === 'manual' && <span className="chip clay sm" style={{ fontSize: 8 }}>VIP</span>}
                    </div>
                    <div className="t-11 t-mono t-muted">{l.domain}</div>
                  </td>
                  <td>
                    <div className="t-12">{l.sector || '—'}</div>
                    <div className="t-11 t-mono t-muted">{l.jurisdiction || l.geo || ''}</div>
                  </td>
                  <td><ScorePill score={l.score || 0} fit={l.fit} /></td>
                  <td>{l.icp_tier ? <span className={`chip sm ${l.icp_tier === 1 ? 'ok' : l.icp_tier === 2 ? 'warn' : ''}`}>T{l.icp_tier}</span> : <span className="t-11 t-muted">—</span>}</td>
                  <td><StatusChip status={l.stage === 'qualified' || l.stage === 'won' ? 'ok' : l.stage === 'replied' || l.stage === 'booked' ? 'info' : l.stage === 'rejected' ? 'bad' : 'idle'} label={l.stage} sm /></td>
                  <td className="t-11 t-mono t-muted">{l.contact_email ? (l.contact_email.length > 26 ? l.contact_email.slice(0, 24) + '…' : l.contact_email) : '—'}</td>
                  <td>{l.audit_url ? <a className="chip sm clay" style={{ textDecoration: 'none' }} href={l.audit_url} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>open ↗</a> : <span className="t-11 t-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {filtered.length > 200 && <div className="body-sm t-muted" style={{ marginTop: 8 }}>Showing the top 200 of {filtered.length} — narrow the filter or export the CSV for the full set.</div>}

      {showVip && <VipModal onClose={() => setShowVip(false)} />}
    </Page>
  );
};

// CC-5 · Add VIP lead — wired to POST leads/add-manual (verify + suppression + dedupe +
// audience block + daily cap + lawful basis all enforced server-side).
const VipModal = ({ onClose }) => {
  const [f, setF] = React.useState({ domain: '', email: '', company: '', sector: '', lawful_basis: 'legitimate_interest' });
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = async () => {
    setBusy(true); setMsg(null);
    const r = window.POST ? await window.POST('leads/add-manual', f) : { ok: false };
    setBusy(false);
    if (r && r.ok) { setMsg({ ok: true, t: r.message }); setTimeout(() => location.reload(), 1400); }
    else setMsg({ ok: false, t: (r && (r.detail || r.error)) || 'Failed.' });
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,26,12,0.4)', zIndex: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} className="card modal-in" style={{ width: 'min(460px,100%)', boxShadow: 'var(--shadow-pop)', padding: 24 }}>
        <h3 className="h3" style={{ marginTop: 0, marginBottom: 4 }}>Add a VIP lead</h3>
        <div className="body-sm t-muted" style={{ marginBottom: 14 }}>Front of the queue, audit minted first. Still passes verify + suppression before any send. Duplicates get raised, never doubled.</div>
        <div className="col" style={{ gap: 8 }}>
          <div className="input"><input value={f.domain} onChange={set('domain')} placeholder="website (required) — e.g. example.com" /></div>
          <div className="input"><input value={f.email} onChange={set('email')} placeholder="decision-maker email (optional)" /></div>
          <div className="row" style={{ gap: 8 }}>
            <div className="input grow"><input value={f.company} onChange={set('company')} placeholder="company (optional)" /></div>
            <div className="input" style={{ width: 130 }}><input value={f.sector} onChange={set('sector')} placeholder="sector" /></div>
          </div>
          <div className="row" style={{ gap: 8, padding: '7px 12px', border: '1px solid var(--line-1)', borderRadius: 7, background: 'var(--card)' }}>
            <span className="eyebrow">lawful basis</span>
            <select value={f.lawful_basis} onChange={set('lawful_basis')} style={{ border: 0, outline: 0, background: 'transparent', fontSize: 13, flex: 1 }}>
              <option value="legitimate_interest">Legitimate interest (B2B)</option>
              <option value="soft_opt_in">Soft opt-in (existing relationship)</option>
              <option value="consent">Consent given</option>
            </select>
          </div>
        </div>
        {msg && <div className="body-sm" style={{ marginTop: 10, color: msg.ok ? 'var(--ok)' : 'var(--clay-2)' }}>{msg.t}</div>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn clay" disabled={busy} onClick={go}>{busy ? 'Adding…' : 'Add VIP'}</button>
        </div>
      </div>
    </div>
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
