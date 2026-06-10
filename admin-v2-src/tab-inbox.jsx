// tab-inbox.jsx — replies inbox (Superhuman-calm)

const TabInbox = ({ setTab }) => {
  const openLead = useOpenLead();
  const [selected, setSelected] = React.useState(REPLIES[0]);
  const [filter, setFilter] = React.useState('all');

  const catColor = cat => REPLY_CATS.find(c => c.key === cat)?.color || 'var(--ink-3)';
  const catLabel = cat => REPLY_CATS.find(c => c.key === cat)?.label || cat;

  const filtered = REPLIES.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'unreviewed') return !r.reviewed;
    if (filter === 'drafted') return r.drafted;
    return r.cat === filter;
  });

  return (
    <Page wide>
      <PageHead
        eyebrow="Inbox"
        title="Replies"
        lede={<>Every reply, classified by the S012 LLM and drafted by S013. Reply rate <b>{TRUTH.replyRate}%</b> · median time-to-reply <b>{TRUTH.ttfr_hours}h</b>.</>}
      />

      {/* Headline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <Stat label="Today"     value="7"  sub="3 interest · 2 meeting" kind="ok" />
        <Stat label="This week" value="34" sub="↑ 12% wow" kind="ok" />
        <Stat label="Reply rate · 30d"  value={`${TRUTH.replyRate}%`} sub="of contacted" kind="ok" />
        <Stat label="Opt-outs honored"  value="0" sub="still queued · must be 0" kind="ok" />
      </div>

      {/* Filter pills */}
      <div className="row" style={{ gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`chip ${filter === 'all' ? 'clay' : ''}`} onClick={() => setFilter('all')}>All · {REPLIES.length}</button>
        <button className={`chip ${filter === 'unreviewed' ? 'clay' : ''}`} onClick={() => setFilter('unreviewed')}>Unreviewed · {REPLIES.filter(r => !r.reviewed).length}</button>
        <button className={`chip ${filter === 'drafted' ? 'clay' : ''}`} onClick={() => setFilter('drafted')}>With draft · {REPLIES.filter(r => r.drafted).length}</button>
        {REPLY_CATS.slice(0, 6).map(c => (
          <button key={c.key} className={`chip sm ${filter === c.key ? 'clay' : ''}`} onClick={() => setFilter(c.key)}>
            <span className="dot" style={{ background: c.color }} />
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18, alignItems: 'start' }}>
        {/* List */}
        <Card padding={0}>
          {filtered.map((r, i) => {
            const active = selected.id === r.id;
            return (
              <button key={r.id} onClick={() => setSelected(r)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '14px 16px',
                borderLeft: active ? '3px solid var(--clay)' : '3px solid transparent',
                background: active ? 'var(--clay-tint)' : (r.reviewed ? 'var(--card-2)' : 'transparent'),
                borderBottom: i < filtered.length - 1 ? '1px solid var(--line-2)' : 'none',
              }}>
                <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                  <span className="t-13" style={{ fontWeight: 600 }}>{r.lead.company}</span>
                  <span className="t-11 t-mono t-muted" style={{ marginLeft: 'auto' }}>{r.t}</span>
                </div>
                <div className="row" style={{ gap: 6, marginBottom: 6 }}>
                  <span className="chip sm" style={{ background: catColor(r.cat), color: 'white', borderColor: catColor(r.cat), fontSize: 9 }}>{catLabel(r.cat)}</span>
                  <span className="t-11 t-muted">{(r.conf * 100).toFixed(0)}% conf</span>
                  {r.drafted && <span className="chip sm ok" style={{ marginLeft: 'auto', fontSize: 9 }}>draft ready</span>}
                </div>
                <div className="t-12 t-soft ellip" style={{ fontFamily: 'var(--serif)', lineHeight: 1.5 }}>{r.preview}</div>
              </button>
            );
          })}
        </Card>

        {/* Detail */}
        {selected && <ReplyDetail r={selected} openLead={openLead} />}
      </div>
    </Page>
  );
};

const ReplyDetail = ({ r, openLead }) => {
  const cat = REPLY_CATS.find(c => c.key === r.cat);
  return (
    <div className="col" style={{ gap: 14 }}>
      <Card title={r.lead.company} eyebrow={`${r.lead.contact_first} · ${r.lead.contact_role} · ${r.lead.contact_email}`} padding={20}
        action={<button className="btn ghost sm" onClick={() => openLead(r.lead)}>Open lead</button>}
      >
        <div className="row" style={{ gap: 8, marginBottom: 14 }}>
          <span className="chip" style={{ background: cat.color, color: 'white', borderColor: cat.color }}>{cat.label}</span>
          <span className="t-12 t-muted">{(r.conf * 100).toFixed(0)}% classifier confidence</span>
          <span className="t-12 t-muted">·</span>
          <span className="t-12 t-muted">received {r.t}</span>
        </div>

        <div style={{
          background: 'var(--card-2)', border: '1px solid var(--line-2)', borderRadius: 8,
          padding: 16, fontSize: 14, lineHeight: 1.6, fontFamily: 'var(--serif)', color: 'var(--ink-1)',
        }}>
          {r.preview}
          <div className="t-11 t-muted" style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed var(--line-2)', fontFamily: 'var(--sans)' }}>
            ↳ in reply to "Compliance audit for {r.lead.company} — 3 quick wins" (T0, sent 4d ago)
          </div>
        </div>
      </Card>

      {r.drafted ? (
        <Card title="Drafted response" eyebrow="auto-generated by S013" padding={20}
          action={<StatusChip status="ok" label="ready" sm />}>
          <div style={{
            background: 'var(--clay-tint)', border: '1px solid var(--clay-soft)', borderRadius: 8,
            padding: 16, fontSize: 14, lineHeight: 1.6, fontFamily: 'var(--serif)', color: 'var(--ink-1)',
          }}>
            Hi {r.lead.contact_first} — glad it landed. The audit covers DPA, processor mapping, retention and access rights, then highlights gaps with severity. Companies under 50 are exactly our sweet spot — half our wins last quarter were that size.<br/><br/>
            I've grabbed Tuesday 16:00 BST: <a style={{ color: 'var(--clay)' }}>cal.com/tamazia/15</a>. Does that work?<br/><br/>— Aman
          </div>
          <div className="row" style={{ gap: 6, marginTop: 14, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button className="btn ghost">Edit</button>
            <button className="btn">Attach audit page</button>
            <button className="btn">Schedule call</button>
            <button className="btn clay">Approve & send</button>
          </div>
        </Card>
      ) : (
        <Card title="No draft generated" eyebrow={`auto-draft skipped · ${cat.label}`} padding={20}>
          <button className="btn clay">Generate draft now</button>
        </Card>
      )}

      <Card title="Quick actions" padding={16}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <ActionRow icon={<Icon name="bolt" sm />} title="Send the audit page" sub="audit.tamazia.co.uk/…" />
          <ActionRow icon={<Icon name="calendar" sm />} title="Schedule a call" sub="cal.com slot picker" />
          <ActionRow icon={<Icon name="check" sm />} title="Mark as handled" sub="close this thread" />
          <ActionRow icon={<Icon name="x" sm />} title="Mark as opt-out" sub="auto-suppress and honor" />
        </div>
      </Card>
    </div>
  );
};

window.TabInbox = TabInbox;
