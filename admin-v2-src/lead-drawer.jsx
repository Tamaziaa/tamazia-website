// lead-drawer.jsx — one lead's full record. Every field is live from v_admin_leads;
// every button calls a real endpoint. No simulated touches/replies — honest states only.

const LeadDrawer = ({ lead }) => {
  const { close } = useDrawer();
  const [tab, setTab] = React.useState('overview');
  const [busy, setBusy] = React.useState(null);
  const [msg, setMsg] = React.useState(null);

  const act = async (kind) => {
    if (!window.POST || !lead.id) { setMsg('No live connection.'); return; }
    const id = Number(String(lead.id).replace(/\D/g, ''));
    if (!id) { setMsg('This lead has no numeric id.'); return; }
    setBusy(kind); setMsg(null);
    let r;
    if (kind === 'approve') r = await window.POST('leads/approve', { id });
    else if (kind === 'push') r = await window.POST('leads/push', { id });
    else if (kind === 'reject') r = await window.POST('leads/update', { id, action: 'stage', stage: 'rejected' });
    else if (kind === 'mint') r = await window.POST('audits/mint', { domain: lead.domain, company: lead.company, sector: lead.sector });
    else if (kind === 'suppress') r = await window.POST('suppression', { email: lead.contact_email, reason: 'manual' });
    setBusy(null);
    setMsg(r && r.ok !== false ? (r.message || 'Done — refreshing…') : 'Failed: ' + ((r && (r.detail || r.error)) || 'unknown'));
    if (r && r.ok !== false && kind !== 'mint') setTimeout(() => location.reload(), 900);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'quality', label: 'Quality' },
    { id: 'source', label: 'Source' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--line-1)', background: 'var(--bg)' }}>
        <div className="spread" style={{ marginBottom: 8 }}>
          <span className="eyebrow">lead #{lead.id} · {lead.sector || '—'} · {lead.jurisdiction || lead.geo || '—'}</span>
          <button className="btn ghost icon" onClick={close}><Icon name="x" sm /></button>
        </div>
        <h2 className="h2" style={{ margin: 0 }}>{lead.company}</h2>
        <div className="row" style={{ marginTop: 8, gap: 10, flexWrap: 'wrap' }}>
          {lead.domain && <a className="t-mono t-12" style={{ color: 'var(--clay)' }} href={'https://' + lead.domain} target="_blank" rel="noopener">{lead.domain} ↗</a>}
          <span style={{ marginLeft: 'auto' }}><ScorePill score={lead.score || 0} fit={lead.fit} /></span>
        </div>
        <div className="row" style={{ marginTop: 12, gap: 6, flexWrap: 'wrap' }}>
          <span className="chip sm">stage · {lead.stage || '—'}</span>
          {lead.icp_tier && <span className={`chip sm ${lead.icp_tier === 1 ? 'ok' : lead.icp_tier === 2 ? 'warn' : ''}`}>Tier {lead.icp_tier}</span>}
          <StatusChip status={lead.verify_status === 'valid' ? 'ok' : /risky|catch/.test(lead.verify_status || '') ? 'warn' : 'idle'} label={`email · ${lead.verify_status || 'unchecked'}`} sm />
          {lead.priority_source === 'manual' && <span className="chip clay sm">VIP</span>}
          {lead.replied && <span className="chip ok sm">replied</span>}
          {lead.audit_url && <a className="chip sm clay" style={{ textDecoration: 'none' }} href={lead.audit_url} target="_blank" rel="noopener">audit ↗</a>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 24px', borderBottom: '1px solid var(--line-1)', background: 'var(--bg)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 12px', fontSize: 12, fontWeight: 500,
            color: tab === t.id ? 'var(--ink-1)' : 'var(--ink-3)',
            borderBottom: tab === t.id ? '2px solid var(--clay)' : '2px solid transparent',
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
        {tab === 'overview' && (
          <div className="col" style={{ gap: 14 }}>
            <Card title="Contact" padding={16}>
              <KV label="Best email" value={lead.contact_email ? <span className="t-mono">{lead.contact_email}</span> : '— (finder will fill)'} />
              <KV label="Verify status" value={lead.verify_status || 'unchecked'} kind={lead.verify_status === 'valid' ? 'ok' : undefined} />
              <KV label="Replied" value={lead.replied ? 'yes — cadence paused' : 'not yet'} />
            </Card>
            <Card title="Timeline" padding={16}>
              <KV label="Created" value={(lead.created_at || '—').slice(0, 10)} />
              <KV label="First contacted" value={lead.last_touch_sent ? String(lead.last_touch_sent).slice(0, 10) : 'not contacted (sending paused)'} />
              <KV label="Last reply" value={lead.last_reply ? String(lead.last_reply).slice(0, 16).replace('T', ' ') : '—'} />
              <KV label="Next touch" value={lead.next_touch_date ? String(lead.next_touch_date).slice(0, 10) : '—'} />
            </Card>
            <Card title="Audit" padding={16}>
              {lead.audit_url
                ? <div className="row" style={{ gap: 8 }}><span className="dot ok" /><a className="t-13" style={{ color: 'var(--clay)' }} href={lead.audit_url} target="_blank" rel="noopener">Open the live audit page ↗</a></div>
                : <div className="body-sm t-muted">No audit minted yet. Use "Mint audit" below — it appears in Audits → History when done (~2 min).</div>}
            </Card>
          </div>
        )}
        {tab === 'quality' && (
          <Card title={`${lead.score || 0}/100`} eyebrow="10-layer quality score (engine lead-quality.js)" padding={16}>
            <div className="col" style={{ gap: 8 }}>
              <KV label="ICP tier" value={lead.icp_tier ? `Tier ${lead.icp_tier} — ${lead.icp_tier === 1 ? 'auto-eligible' : lead.icp_tier === 2 ? 'needs your approval' : 'rejected'}` : 'not yet scored'} />
              <KV label="Quality fit" value={lead.fit ? 'FIT (Tier-1 gate passed)' : 'not fit yet'} kind={lead.fit ? 'ok' : undefined} />
              <KV label="Stage routing" value={lead.stage || '—'} />
              <div className="body-sm t-muted" style={{ marginTop: 6 }}>
                Tier-1 = regulated sector + established site + a fixable gap + a clean named decision-maker email.
                Re-run the gate any time with "Re-qualify the pile" on Now.
              </div>
            </div>
          </Card>
        )}
        {tab === 'source' && (
          <Card title="Provenance" padding={16}>
            <KV label="Acquisition" value={lead.stream || '—'} />
            <KV label="Priority source" value={lead.priority_source || 'organic pipeline'} />
            <KV label="Sector / guess" value={`${lead.sector || '—'}${lead.icp_guess ? ' · guess: ' + lead.icp_guess : ''}`} />
            <KV label="Jurisdiction" value={lead.jurisdiction || lead.geo || '—'} />
            <KV label="Website" value={lead.domain ? <a className="t-mono t-12" style={{ color: 'var(--clay)' }} href={'https://' + lead.domain} target="_blank" rel="noopener">{lead.domain}</a> : '—'} />
          </Card>
        )}
      </div>

      {/* Footer — live actions */}
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line-1)', background: 'var(--bg-soft)' }}>
        {msg && <div className="body-sm" style={{ marginBottom: 8, color: /Failed/.test(msg) ? 'var(--clay-2)' : 'var(--ok)' }}>{msg}</div>}
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {!lead.fit && <button className="btn clay" disabled={!!busy} onClick={() => act('approve')}>{busy === 'approve' ? 'Approving…' : 'Approve → qualified'}</button>}
          <button className="btn" disabled={!!busy || !lead.domain} onClick={() => act('mint')}>{busy === 'mint' ? 'Queuing…' : 'Mint audit'}</button>
          <button className="btn" disabled={!!busy} onClick={() => act('push')} title="Qualify + enqueue audit so it enters the send path">{busy === 'push' ? 'Pushing…' : 'Push to send'}</button>
          {lead.contact_email && <button className="btn ghost" disabled={!!busy} onClick={() => act('suppress')}>Suppress email</button>}
          <button className="btn ghost" disabled={!!busy} onClick={() => act('reject')} style={{ marginLeft: 'auto', color: 'var(--clay-2)' }}>{busy === 'reject' ? 'Rejecting…' : 'Reject'}</button>
        </div>
      </div>
    </div>
  );
};

// helper hook
const useOpenLead = () => {
  const { open } = useDrawer();
  return (lead) => open(<LeadDrawer lead={lead} />);
};
window.LeadDrawer = LeadDrawer;
window.useOpenLead = useOpenLead;
