// lead-drawer.jsx — calm right-side drawer for one lead

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
    else if (kind === 'reject') r = await window.POST('leads/update', { id, action: 'stage', stage: 'rejected' });
    else if (kind === 'mint') r = await window.POST('leads/update', { id, action: 'stage', stage: 'qualified' });
    setBusy(null);
    setMsg(r && r.ok !== false ? 'Done — refreshing…' : 'Failed: ' + ((r && r.error) || 'unknown'));
    if (r && r.ok !== false && window.API) { setTimeout(() => { if (window.location.reload) window.location.reload(); }, 700); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'touches',  label: 'Touches' },
    { id: 'replies',  label: 'Replies', badge: lead.replied ? 1 : 0 },
    { id: 'quality',  label: 'Quality' },
    { id: 'meta',     label: 'Source' },
    { id: 'notes',    label: 'Notes' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--line-1)', background: 'var(--bg)' }}>
        <div className="spread" style={{ marginBottom: 8 }}>
          <span className="eyebrow">{lead.id} · {lead.sector} · {lead.geo}</span>
          <button className="btn ghost icon" onClick={close}><Icon name="x" sm /></button>
        </div>
        <h2 className="h2" style={{ margin: 0 }}>{lead.company}</h2>
        <div className="row" style={{ marginTop: 8, gap: 10 }}>
          <a className="t-mono t-12" style={{ color: 'var(--clay)' }} href={lead.website} target="_blank">{lead.domain}</a>
          <span className="t-12 t-muted">·</span>
          <span className="t-12 t-soft">{lead.contact_first} {lead.contact_role && `· ${lead.contact_role}`}</span>
          <span style={{ marginLeft: 'auto' }}><ScorePill score={lead.score} fit={lead.fit} /></span>
        </div>
        <div className="row" style={{ marginTop: 12, gap: 6, flexWrap: 'wrap' }}>
          <StatusChip status={lead.verify_status === 'valid' ? 'ok' : lead.verify_status === 'risky' ? 'warn' : 'bad'} label={`verify · ${lead.verify_status}`} sm />
          <span className="chip sm">stage · {lead.stage}</span>
          <span className="chip sm">stream · {lead.stream}</span>
          {lead.audit_url && <a className="chip sm clay" style={{ textDecoration: 'none' }} href={lead.audit_url} target="_blank">audit ↗</a>}
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
          }}>
            {t.label}
            {t.badge ? <span className="chip clay sm" style={{ marginLeft: 6, padding: '0 5px' }}>{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
        {tab === 'overview'  && <Overview lead={lead} />}
        {tab === 'touches'   && <Touches lead={lead} />}
        {tab === 'replies'   && <RepliesView lead={lead} />}
        {tab === 'quality'   && <Quality lead={lead} />}
        {tab === 'meta'      && <Meta lead={lead} />}
        {tab === 'notes'     && <Notes lead={lead} />}
      </div>

      {/* Footer — live actions */}
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line-1)', background: 'var(--bg-soft)' }}>
        {msg && <div className="body-sm" style={{ marginBottom: 8, color: /Failed/.test(msg) ? 'var(--clay-2)' : 'var(--ok)' }}>{msg}</div>}
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {!lead.fit && <button className="btn clay" disabled={!!busy} onClick={() => act('approve')}>{busy === 'approve' ? 'Approving…' : 'Approve (Tier-2 → qualified)'}</button>}
          {lead.fit && <button className="btn clay" disabled={!!busy} onClick={() => act('mint')}>{busy === 'mint' ? 'Queuing…' : 'Send to mint queue'}</button>}
          {lead.audit_url && <a className="btn" href={lead.audit_url} target="_blank" rel="noopener">Open audit ↗</a>}
          <button className="btn ghost" disabled={!!busy} onClick={() => act('reject')} style={{ marginLeft: 'auto' }}>{busy === 'reject' ? 'Rejecting…' : 'Reject'}</button>
        </div>
      </div>
    </div>
  );
};

const Overview = ({ lead }) => (
  <div className="col" style={{ gap: 16 }}>
    <Card title="Cadence progression" eyebrow={`next · ${lead.next_touch} on ${lead.next_touch_date}`} padding={16}>
      <div className="row" style={{ gap: 12 }}>
        <TouchProgression history={lead.touch_history} />
        <span className="t-12 t-muted">{lead.touch_history.filter(s => s === 'sent').length} of 6 touches sent</span>
      </div>
    </Card>

    <Card title="Contact" padding={16}>
      <KV label="Primary email"   value={<span className="t-mono">{lead.contact_email}</span>} />
      <KV label="Name & role"     value={`${lead.contact_first} · ${lead.contact_role}`} />
      <KV label="Emails found"    value={`${lead.all_emails}`} sub="via waterfall" />
      <KV label="Socials"         value={Object.entries(lead.all_socials).filter(([_, v]) => v).map(([k]) => k).join(' · ') || '—'} />
    </Card>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <Card padding={16}><Stat label="Verify confidence" value={`${(lead.verify_confidence * 100).toFixed(0)}%`} sub={lead.verify_status} kind={lead.verify_status === 'valid' ? 'ok' : 'warn'} /></Card>
      <Card padding={16}><Stat label="Audit views"       value={lead.audit_url ? (lead.opens + 2) : '—'} sub={lead.audit_url ? 'last viewed 8h ago' : 'no audit minted'} /></Card>
      <Card padding={16}><Stat label="Email opens"       value={lead.opens || '—'} sub="across 6 touches" /></Card>
      <Card padding={16}><Stat label="Link clicks"       value={lead.clicks || '—'} sub="audit + CTA" /></Card>
    </div>
  </div>
);

const Touches = ({ lead }) => (
  <div className="col" style={{ gap: 12 }}>
    {CADENCE.map((c, i) => {
      const s = lead.touch_history[i];
      const subjects = [
        `Compliance audit for ${lead.company} — 3 quick wins`,
        `Following up — audit for ${lead.company}`,
        `Re: audit for ${lead.company}`,
        `Last note — ${lead.company}`,
        `Closing the loop — keep the ${lead.company} audit live?`,
        `Sector intel for ${lead.company} (90-day check-in)`,
      ];
      return (
        <Card key={c.key} padding={14}
          title={`${c.label} · day ${c.day}`}
          eyebrow={c.kind === 'personal' ? 'PERSONALISED' : 'LOCKED TEMPLATE'}
          action={<StatusChip status={s === 'sent' ? 'ok' : s === 'queued' ? 'warn' : 'idle'} label={s} sm />}
        >
          <div className="t-13" style={{ fontWeight: 500, marginBottom: 6 }}>{subjects[i]}</div>
          <div className="body-sm t-muted" style={{ marginBottom: 8 }}>{c.purpose}</div>
          {s === 'sent' && <div className="t-11 t-muted">Sent via Mailjet · opened {lead.opens ? `${lead.opens}× · last 8h ago` : 'not yet'}</div>}
          {s === 'queued' && <div className="t-11" style={{ color: 'var(--clay)' }}>Queued for {lead.next_touch_date}</div>}
          {s === '—' && <div className="t-11 t-muted">Not yet sent</div>}
          <div className="row" style={{ gap: 6, marginTop: 8 }}>
            <button className="btn xs">View body</button>
            <button className="btn xs">Regenerate</button>
            {s === 'queued' && <button className="btn clay xs">Send now</button>}
          </div>
        </Card>
      );
    })}
  </div>
);

const RepliesView = ({ lead }) => lead.replied ? (
  <Card title="Reply" eyebrow="inbound · interest · 0.94 conf" padding={16}>
    <p className="body-sm" style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>
      "Yes, would like to know more about the GDPR audit. Can you share what it covers? Also — do you work with companies under 50 staff?"
    </p>
    <div className="body-sm t-muted" style={{ marginBottom: 14 }}>Received {lead.last_reply} from {lead.contact_email}</div>

    <div className="eyebrow" style={{ marginBottom: 6 }}>Drafted response</div>
    <div style={{ background: 'var(--clay-tint)', border: '1px solid var(--clay-soft)', borderRadius: 6, padding: 12 }}>
      <p className="body-sm" style={{ fontFamily: 'var(--serif)', margin: 0 }}>
        Hi {lead.contact_first} — great. The audit covers DPA, processor mapping, retention and access rights, then highlights gaps with severity. Companies under 50 are exactly our sweet spot — half our wins last quarter were that size. Tuesday 16:00 BST works: <a style={{ color: 'var(--clay)' }}>cal.com/tamazia/15</a>?
      </p>
    </div>
    <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
      <button className="btn clay">Approve & send</button>
      <button className="btn">Edit</button>
      <button className="btn">Send audit link</button>
    </div>
  </Card>
) : (
  <Empty title="No replies yet" lede={`Nothing from ${lead.company}.`} />
);

const Quality = ({ lead }) => {
  const layers = [
    { k: 'Domain reputation',  w: 12, pass: true,  d: 'clean MX, no blacklist hits' },
    { k: 'ICP fit (sector)',   w: 15, pass: true,  d: `${lead.sector} · in target` },
    { k: 'Company size match', w: 10, pass: true,  d: '50–250 employees · target' },
    { k: 'Jurisdiction match', w:  8, pass: true,  d: `${lead.geo} · permitted` },
    { k: 'Contact found',      w: 10, pass: true,  d: `${lead.all_emails} contacts · 1 decision-maker` },
    { k: 'Email verified',     w: 12, pass: lead.verify_status === 'valid', d: `${lead.verify_status} · conf ${(lead.verify_confidence * 100).toFixed(0)}%` },
    { k: 'Web presence',       w:  8, pass: true,  d: 'site + LinkedIn + IG' },
    { k: 'Recent activity',    w: 10, pass: true,  d: '3 articles · 14d window' },
    { k: 'Not in suppression', w:  5, pass: true,  d: 'clean' },
    { k: 'Not aggregator',     w: 10, pass: true,  d: 'standalone domain' },
  ];
  const got = layers.reduce((s, l) => s + (l.pass ? l.w : 0), 0);
  return (
    <Card title={`${lead.score}/100 · pass ≥60`} eyebrow="10-layer quality score" padding={16}>
      <div className="body-sm t-muted" style={{ marginBottom: 14 }}>
        {got >= 60 ? `Passes the gate. ${lead.fit ? 'FIT-flagged for white-glove handling.' : ''}` : 'Below the gate; held back from send.'}
      </div>
      <div className="col" style={{ gap: 8 }}>
        {layers.map((l, i) => (
          <div key={i} className="row" style={{ gap: 10, padding: '6px 0', borderBottom: i < layers.length - 1 ? '1px solid var(--line-2)' : 'none' }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: l.pass ? 'var(--ok)' : 'var(--clay-2)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0,
            }}>{l.pass ? '✓' : '×'}</span>
            <span className="t-13 grow">{l.k}</span>
            <span className="t-11 t-muted">{l.d}</span>
            <span className="t-num t-12" style={{ color: l.pass ? 'var(--ok)' : 'var(--ink-3)', width: 32, textAlign: 'right' }}>{l.pass ? `+${l.w}` : `0`}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

const Meta = ({ lead }) => (
  <Card title="Source · enrichment · provenance" padding={16}>
    <KV label="Acquisition stream" value={lead.stream} />
    <KV label="Query that found them" value={<code className="t-mono t-12">{lead.query}</code>} />
    <KV label="Created" value={lead.created_at} />
    <KV label="Sector" value={lead.sector} />
    <KV label="Jurisdiction" value={lead.jurisdiction} />
    <KV label="Website" value={<a className="t-mono t-12" style={{ color: 'var(--clay)' }} href={lead.website}>{lead.website}</a>} />
    <KV label="Personalisation context" value="S063 deep-research · 3 brand pointers · 14d news scan" />
  </Card>
);

const Notes = ({ lead }) => (
  <Card title="Personal notes" padding={16}>
    <textarea placeholder="Anything to remember about this lead…" style={{
      width: '100%', minHeight: 220, padding: 12,
      fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.55,
      border: '1px solid var(--line-1)', borderRadius: 7, resize: 'vertical', outline: 'none',
      background: 'var(--card)',
    }} />
    <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
      <button className="btn primary sm">Save</button>
    </div>
  </Card>
);

// helper hook
const useOpenLead = () => {
  const { open } = useDrawer();
  return (lead) => open(<LeadDrawer lead={lead} />);
};

window.LeadDrawer = LeadDrawer;
window.useOpenLead = useOpenLead;
