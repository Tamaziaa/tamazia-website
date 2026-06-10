// tab-inbox.jsx — replies inbox. 100% live data; crash-safe on empty; wired actions:
// "Mark handled" -> POST inbox/handle {id} · "Suppress sender" -> POST suppression {email}.
const TabInbox = () => {
  const replies = (window.REPLIES || []);
  const cats = (window.REPLY_CATS || []);
  const [selectedId, setSelectedId] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [msg, setMsg] = React.useState(null);

  const catColor = (cat) => (cats.find(c => c.key === cat) || {}).color || 'var(--ink-3)';
  const catLabel = (cat) => (cats.find(c => c.key === cat) || {}).label || (cat || '—');
  const filtered = replies.filter(r => filter === 'all' ? true : r.cat === filter);
  const selected = filtered.find(r => r.id === selectedId) || filtered[0] || null;
  const today = new Date().toISOString().slice(0, 10);

  const act = async (kind, r) => {
    if (!r) return;
    setMsg(null);
    if (kind === 'handle') {
      const id = Number(String(r.id).replace(/\D/g, ''));
      const res = id && window.POST ? await window.POST('inbox/handle', { id }) : { ok: false, error: 'no numeric id' };
      setMsg(res && res.ok ? 'Marked handled.' : 'Could not mark handled: ' + ((res && res.error) || ''));
    } else if (kind === 'suppress') {
      const email = (r.lead && r.lead.contact_email) || r.email || '';
      if (!email) { setMsg('No sender email on this reply.'); return; }
      const res = window.POST ? await window.POST('suppression', { email, reason: 'opt_out' }) : { ok: false };
      setMsg(res && res.ok ? `Suppressed ${email} — they will never be contacted again.` : 'Suppress failed.');
    }
  };

  return (
    <Page wide>
      <PageHead
        eyebrow="Inbox"
        title={replies.length ? `${replies.length} replies` : 'Replies'}
        lede="Every inbound reply, classified. Positive ones also appear on Now. A reply auto-pauses that lead's cadence."
      />

      {msg && <Card padding={12} kind="ok" style={{ marginBottom: 14 }}><div className="body-sm">{msg}</div></Card>}

      {/* live counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <Stat label="Total captured" value={fmt(replies.length)} sub="inbound_emails" />
        <Stat label="Today" value={fmt(replies.filter(r => (r.received_at || '').startsWith(today)).length)} sub="since midnight" />
        <Stat label="Positive / interested" value={fmt(replies.filter(r => /interest|meeting|question|pricing|referral/.test(r.cat || '')).length)} sub="needs you" kind="ok" />
      </div>

      {/* category pills (live rollup) */}
      <div className="row" style={{ gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`chip ${filter === 'all' ? 'clay' : ''}`} onClick={() => setFilter('all')}>All · {replies.length}</button>
        {cats.map(c => (
          <button key={c.key} className={`chip sm ${filter === c.key ? 'clay' : ''}`} onClick={() => setFilter(c.key)}>
            <span className="dot" style={{ background: c.color }} />{c.label} · {c.v}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card padding={0}><Empty title="No replies yet" lede="Inbound replies land here the moment the IMAP poller or Mystrika sync captures them. Sending is currently paused, so the inbox fills once outreach starts." /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18, alignItems: 'start' }}>
          <Card padding={0}>
            {filtered.map((r, i) => {
              const active = selected && selected.id === r.id;
              return (
                <button key={r.id || i} onClick={() => setSelectedId(r.id)} style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px',
                  borderLeft: active ? '3px solid var(--clay)' : '3px solid transparent',
                  background: active ? 'var(--clay-tint)' : 'transparent',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--line-2)' : 'none',
                }}>
                  <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                    <span className="t-13" style={{ fontWeight: 600 }}>{(r.lead && r.lead.company) || '—'}</span>
                    <span className="t-11 t-mono t-muted" style={{ marginLeft: 'auto' }}>{r.t || ''}</span>
                  </div>
                  <div className="row" style={{ gap: 6, marginBottom: 6 }}>
                    <span className="chip sm" style={{ background: catColor(r.cat), color: 'white', borderColor: catColor(r.cat), fontSize: 9 }}>{catLabel(r.cat)}</span>
                    {r.conf > 0 && <span className="t-11 t-muted">{(r.conf * 100).toFixed(0)}% conf</span>}
                  </div>
                  <div className="t-12 t-soft ellip" style={{ fontFamily: 'var(--serif)', lineHeight: 1.5 }}>{r.preview || '(no preview)'}</div>
                </button>
              );
            })}
          </Card>

          {selected && (
            <div className="col" style={{ gap: 14 }}>
              <Card title={(selected.lead && selected.lead.company) || 'Reply'} eyebrow={(selected.lead && selected.lead.contact_email) || ''} padding={20}>
                <div className="row" style={{ gap: 8, marginBottom: 14 }}>
                  <span className="chip" style={{ background: catColor(selected.cat), color: 'white', borderColor: catColor(selected.cat) }}>{catLabel(selected.cat)}</span>
                  {selected.conf > 0 && <span className="t-12 t-muted">{(selected.conf * 100).toFixed(0)}% classifier confidence</span>}
                </div>
                <div style={{ background: 'var(--card-2)', border: '1px solid var(--line-2)', borderRadius: 8, padding: 16, fontSize: 14, lineHeight: 1.6, fontFamily: 'var(--serif)', color: 'var(--ink-1)' }}>
                  {selected.preview || '(no body captured)'}
                </div>
                <div className="row" style={{ gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                  <button className="btn" onClick={() => act('handle', selected)}>Mark handled</button>
                  {(selected.lead && selected.lead.contact_email) && <a className="btn" href={'mailto:' + selected.lead.contact_email}>Reply by email ↗</a>}
                  <button className="btn ghost" style={{ marginLeft: 'auto', color: 'var(--clay-2)' }} onClick={() => act('suppress', selected)}>Suppress sender</button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </Page>
  );
};
window.TabInbox = TabInbox;
