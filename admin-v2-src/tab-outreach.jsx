// tab-outreach.jsx — the email engine, tracked. Three live views:
//   Sent      — every email the system sent (sends table): who, subject, touch, opened, replied
//   Follow-ups— the cadence state per lead (email_sequence_state): touch + when next is due
//   Drafts    — ready / pending drafts (outreach_drafts), with Approve & send (gated while paused)
const TabOutreach = () => {
  const [view, setView] = React.useState('sent');
  const S = window.SENDS || { sends: [], total: 0, opened: 0, replied: 0, today: 0, counts: {} };
  const SEQ = window.SEQUENCES || { rows: [], byTouch: {}, active: 0, dueNow: 0 };
  const OUT = window.OUTBOX || { drafts: [], count: 0 };
  const paused = !!(window.TRUTH && window.TRUTH.killSwitchOn);
  const [msg, setMsg] = React.useState(null);

  const openRate = S.total ? ((S.opened / S.total) * 100).toFixed(1) : '0';
  const replyRate = S.total ? ((S.replied / S.total) * 100).toFixed(1) : '0';

  const approveDraft = async (d) => {
    setMsg(null);
    if (paused) { setMsg('Sending is paused — resume it from the header before approving sends.'); return; }
    const id = Number(String(d.id).replace(/\D/g, ''));
    const r = id && window.POST ? await window.POST('outbox/approve', { id }) : { ok: false };
    setMsg(r && r.ok ? 'Draft approved — it sends on the next cycle.' : 'Could not approve (endpoint gated or offline).');
  };

  return (
    <Page wide>
      <PageHead eyebrow="Outreach" title="Emails & follow-ups"
        lede="Every email the system has sent, the follow-up cadence each lead is on, and the drafts waiting to go. Sending is OFF until you flip the kill-switch." />

      {paused && <Card padding={12} kind="warn" style={{ marginBottom: 14 }}><div className="body-sm">Sending is paused (system_state.paused). Nothing goes out; this is tracking + dry-run only.</div></Card>}
      {msg && <Card padding={12} style={{ marginBottom: 14 }}><div className="body-sm">{msg}</div></Card>}

      {/* headline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
        <Stat label="Sent (all-time)" value={fmt(S.total || 0)} sub={`${S.today || 0} today`} />
        <Stat label="Opened" value={`${openRate}%`} sub={`${fmt(S.opened || 0)} opens`} kind={S.opened ? 'ok' : undefined} />
        <Stat label="Replied" value={`${replyRate}%`} sub={`${fmt(S.replied || 0)} replies`} kind={S.replied ? 'ok' : undefined} />
        <Stat label="In cadence" value={fmt(SEQ.active || 0)} sub={`${SEQ.dueNow || 0} due now`} />
        <Stat label="Drafts ready" value={fmt(OUT.count || 0)} sub="awaiting send" />
      </div>

      {/* view switch */}
      <div className="row" style={{ gap: 6, marginBottom: 16 }}>
        <button className={`chip ${view === 'sent' ? 'clay' : ''}`} onClick={() => setView('sent')}>Sent · {S.sends.length}</button>
        <button className={`chip ${view === 'followups' ? 'clay' : ''}`} onClick={() => setView('followups')}>Follow-ups · {SEQ.rows.length}</button>
        <button className={`chip ${view === 'drafts' ? 'clay' : ''}`} onClick={() => setView('drafts')}>Drafts · {OUT.drafts.length}</button>
      </div>

      {view === 'sent' && (
        <Card padding={0}>
          {S.sends.length === 0 ? <Empty title="No emails sent yet" lede="The sends table fills the moment outreach starts. Each row tracks delivery, opens, and replies per touch." /> : (
            <table className="tbl">
              <thead><tr><th>To</th><th>Subject</th><th>Touch</th><th>Sent</th><th>Status</th><th>Opened</th><th>Replied</th></tr></thead>
              <tbody>
                {S.sends.map((s, i) => (
                  <tr key={s.id || i}>
                    <td><div className="t-13" style={{ fontWeight: 500 }}>{s.company || '—'}</div><div className="t-11 t-mono t-muted">{s.recipient}</div></td>
                    <td className="t-12 ellip" style={{ maxWidth: 280 }}>{s.subject || '—'}</td>
                    <td><span className="chip sm">T{s.sequence_step != null ? s.sequence_step : '?'}</span></td>
                    <td className="t-11 t-muted">{(s.sent_at || '').slice(0, 16).replace('T', ' ')}</td>
                    <td><StatusChip status={/deliver|sent|ok/.test(s.delivery_status || '') ? 'ok' : /bounce|fail|reject/.test(s.delivery_status || '') ? 'bad' : 'idle'} label={s.delivery_status || '—'} sm /></td>
                    <td>{s.opened_at ? <span className="chip ok sm">yes</span> : <span className="t-11 t-muted">—</span>}</td>
                    <td>{s.replied_at ? <span className="chip ok sm">yes</span> : <span className="t-11 t-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {view === 'followups' && (
        <>
          <Card padding={14} style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <span className="eyebrow">By touch</span>
              {Object.keys(SEQ.byTouch).length === 0 ? <span className="t-12 t-muted">no active sequences</span> :
                Object.entries(SEQ.byTouch).map(([t, n]) => <span key={t} className="chip sm">{t} · {n}</span>)}
            </div>
          </Card>
          <Card padding={0}>
            {SEQ.rows.length === 0 ? <Empty title="No follow-ups scheduled" lede="When a lead enters the 5-touch sequence, its cadence state shows here with the next due date. A reply auto-pauses it." /> : (
              <table className="tbl">
                <thead><tr><th>Lead</th><th>Current touch</th><th>Last sent</th><th>Next due</th><th>Status</th></tr></thead>
                <tbody>
                  {SEQ.rows.map((r, i) => (
                    <tr key={r.id || i}>
                      <td><div className="t-13" style={{ fontWeight: 500 }}>{r.company || ('lead #' + r.lead_id)}</div><div className="t-11 t-mono t-muted">{r.domain || ''}</div></td>
                      <td><span className="chip sm">T{r.current_touch != null ? r.current_touch : '?'}</span></td>
                      <td className="t-11 t-muted">{(r.last_touch_sent_at || '').slice(0, 16).replace('T', ' ') || '—'}</td>
                      <td className="t-12">{(r.next_due_at || '').slice(0, 16).replace('T', ' ') || '—'}</td>
                      <td><StatusChip status={r.status === 'active' ? 'ok' : r.status === 'paused' ? 'warn' : 'idle'} label={r.status || '—'} sm /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {view === 'drafts' && (
        <Card padding={0}>
          {OUT.drafts.length === 0 ? <Empty title="No drafts" lede="Touch-0 drafts (S063 deep-research) and locked follow-ups appear here, ready to approve. Approval is gated while sending is paused." /> : (
            <table className="tbl">
              <thead><tr><th>Lead</th><th>Subject</th><th>Touch</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {OUT.drafts.map((d, i) => (
                  <tr key={d.id || i}>
                    <td className="t-13" style={{ fontWeight: 500 }}>{d.company || d.domain || ('lead #' + (d.lead_id || '?'))}</td>
                    <td className="t-12 ellip" style={{ maxWidth: 320 }}>{d.draft_subject || d.subject || '(no subject)'}</td>
                    <td><span className="chip sm">T{(d.draft_metadata && d.draft_metadata.touch) != null ? (d.draft_metadata && d.draft_metadata.touch) : (d.touch != null ? d.touch : '?')}</span></td>
                    <td><StatusChip status={/ready/.test(d.send_status || '') ? 'ok' : 'idle'} label={d.send_status || 'pending'} sm /></td>
                    <td><button className="btn clay xs" disabled={paused} onClick={() => approveDraft(d)}>{paused ? 'paused' : 'Approve & send'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </Page>
  );
};
window.TabOutreach = TabOutreach;
