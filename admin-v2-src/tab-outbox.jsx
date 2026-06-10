// tab-outbox.jsx — drafts + send queue + manual LinkedIn/Insta touches in one calm stream

const TabOutbox = ({ setTab }) => {
  const openLead = useOpenLead();
  const [tab, setT] = React.useState('drafts');

  return (
    <Page>
      <PageHead
        eyebrow="Outbox"
        title="Drafts, sends, and manual touches"
        lede="Everything leaving the engine — emails composed and queued, recently sent, and the LinkedIn / Instagram windows waiting on you."
      />

      {/* Sub-tabs */}
      <div className="row" style={{ gap: 4, marginBottom: 22, borderBottom: '1px solid var(--line-1)', paddingBottom: 0 }}>
        {[
          ['drafts',  `Drafts (${DRAFTS.filter(d => d.state !== 'sent').length})`],
          ['queue',   'Send queue (89)'],
          ['recent',  'Recently sent'],
          ['manual',  'Manual touches (34)'],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setT(k)} style={{
            padding: '10px 14px', fontSize: 13, fontWeight: 500,
            color: tab === k ? 'var(--ink-1)' : 'var(--ink-3)',
            borderBottom: tab === k ? '2px solid var(--clay)' : '2px solid transparent',
            marginBottom: -1,
          }}>{l}</button>
        ))}
      </div>

      {tab === 'drafts' && <DraftsView openLead={openLead} />}
      {tab === 'queue'  && <QueueView openLead={openLead} />}
      {tab === 'recent' && <RecentView openLead={openLead} />}
      {tab === 'manual' && <ManualView openLead={openLead} />}
    </Page>
  );
};

// ── Drafts ───────────────────────────────────────────────────────────────────
const DraftsView = ({ openLead }) => {
  const [selected, setSelected] = React.useState(DRAFTS[0]);
  const states = {
    ready:             { label: 'Ready',                   color: 'var(--ok)' },
    awaiting_approval: { label: 'Awaiting approval',       color: 'var(--clay)' },
    pending_personal:  { label: 'Personalisation running', color: 'var(--info)' },
  };
  const visible = DRAFTS.filter(d => d.state !== 'sent');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18, alignItems: 'start' }}>
      <Card padding={0}>
        {visible.map((d, i) => {
          const m = states[d.state];
          const active = selected.id === d.id;
          return (
            <button key={d.id} onClick={() => setSelected(d)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '12px 14px',
              borderLeft: active ? '3px solid var(--clay)' : '3px solid transparent',
              background: active ? 'var(--clay-tint)' : 'transparent',
              borderBottom: i < visible.length - 1 ? '1px solid var(--line-2)' : 'none',
            }}>
              <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                <span className="chip sm" style={{ background: m.color, color: 'white', borderColor: m.color, fontSize: 9 }}>{d.touch}</span>
                <span className="t-13" style={{ fontWeight: 500 }}>{d.lead.company}</span>
                <span className="t-11 t-muted" style={{ marginLeft: 'auto' }}>{d.updated_min}m</span>
              </div>
              <div className="t-12 ellip t-muted">{d.subj}</div>
              <div className="t-11" style={{ color: m.color, marginTop: 4 }}>{m.label}</div>
            </button>
          );
        })}
      </Card>

      <div className="col" style={{ gap: 14 }}>
        <DraftEditor d={selected} openLead={openLead} />
      </div>
    </div>
  );
};

const DraftEditor = ({ d, openLead }) => {
  const [subj, setSubj] = React.useState(d.subj);
  const [body, setBody] = React.useState(`Hi ${d.lead.contact_first},

I run a small compliance practice. I spotted three quick wins on ${d.lead.domain}'s setup that could close a DPA gap before audit season:

1. Processor mapping — your sub-processor list is missing two we found in your privacy policy.
2. Retention — your public policy is 7y but your DPA references 5y. One needs updating.
3. Access rights — DSAR flow goes to a shared inbox; that's a risk under DIFC enforcement.

I sketched the full audit here: ${d.lead.audit_url || 'audit.tamazia.co.uk/…'}

15-min call to walk through?

— Aman
Tamazia`);
  React.useEffect(() => { setSubj(d.subj); }, [d.id]);

  return (
    <>
      <Card title={`${d.touch} · ${d.lead.company}`} eyebrow={`to ${d.lead.contact_email}`} padding={20}
        action={
          <div className="row" style={{ gap: 6 }}>
            <button className="btn ghost sm" onClick={() => openLead(d.lead)}>Open lead</button>
          </div>
        }
      >
        <label className="col" style={{ gap: 4, marginBottom: 12 }}>
          <span className="eyebrow">Subject</span>
          <input value={subj} onChange={e => setSubj(e.target.value)} style={{
            padding: '10px 12px', fontSize: 14, fontFamily: 'var(--serif)',
            border: '1px solid var(--line-1)', borderRadius: 7,
            background: 'var(--card)', outline: 'none',
          }} />
        </label>
        <label className="col" style={{ gap: 4 }}>
          <span className="eyebrow">Body</span>
          <textarea value={body} onChange={e => setBody(e.target.value)} style={{
            padding: 14, fontSize: 14, lineHeight: 1.6, minHeight: 320, fontFamily: 'var(--serif)',
            border: '1px solid var(--line-1)', borderRadius: 7,
            background: 'var(--card)', resize: 'vertical', outline: 'none', color: 'var(--ink-1)',
          }} />
        </label>

        <div style={{ marginTop: 14, padding: 12, background: 'var(--card-2)', border: '1px solid var(--line-2)', borderRadius: 7 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Gates · S009 disclaimer · S010 forbidden phrases · spam-lint · B6 placeholder gate</div>
          <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
            <Check label="Disclaimer applied" />
            <Check label="No spam phrases" />
            <Check label="No AI-tells" />
            <Check label="No unfilled tokens" />
            <Check label="Spam score 0.4 / 5" />
          </div>
        </div>

        <div className="row" style={{ gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="btn">Regenerate Touch-0</button>
          <button className="btn">Re-personalise</button>
          <button className="btn">Spam-lint</button>
          <span style={{ flex: 1 }} />
          <button className="btn">Save</button>
          <button className="btn clay">Approve → queue</button>
        </div>
      </Card>
    </>
  );
};

const Check = ({ label }) => (
  <span className="row" style={{ gap: 6 }}>
    <span style={{
      width: 16, height: 16, borderRadius: '50%',
      background: 'var(--ok)', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
    }}>✓</span>
    <span className="t-12">{label}</span>
  </span>
);

// ── Queue ─────────────────────────────────────────────────────────────────────
const QueueView = ({ openLead }) => (
  <Card padding={0}>
    <table className="tbl">
      <thead><tr><th>Due</th><th>Lead</th><th>Touch</th><th>Subject</th><th>Relay</th><th>Alias</th><th></th></tr></thead>
      <tbody>
        {LEADS.slice(0, 14).map((l, i) => (
          <tr key={l.id} onClick={() => openLead(l)} style={{ cursor: 'pointer' }}>
            <td className="t-mono t-11">{['12:30','13:00','13:00','13:30','14:00','14:30','15:00','15:00','15:30','16:00','16:30','17:00','17:00','17:30'][i]}</td>
            <td>
              <div className="t-13" style={{ fontWeight: 500 }}>{l.company}</div>
              <div className="t-11 t-mono t-muted">{l.contact_email}</div>
            </td>
            <td><span className="chip sm" style={{ background: 'var(--ink-1)', color: 'white', borderColor: 'var(--ink-1)', fontSize: 10 }}>{l.next_touch}</span></td>
            <td className="t-12 ellip" style={{ maxWidth: 280 }}>{`Audit for ${l.company} — 3 quick wins`}</td>
            <td className="t-11 t-mono">{RELAYS[i % RELAYS.length].name}</td>
            <td className="t-11 t-mono">#{(i * 7) % 90 + 1}</td>
            <td onClick={e => e.stopPropagation()}><button className="btn ghost xs">delay</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

// ── Recent sends ──────────────────────────────────────────────────────────────
const RecentView = ({ openLead }) => (
  <Card padding={0}>
    <table className="tbl">
      <thead><tr><th>When</th><th>Lead</th><th>Touch</th><th>Subject</th><th>Relay</th><th>Opened</th><th>Replied</th></tr></thead>
      <tbody>
        {LEADS.slice(0, 14).map((l, i) => (
          <tr key={l.id} onClick={() => openLead(l)} style={{ cursor: 'pointer' }}>
            <td className="t-mono t-11">{['12:04','11:58','11:54','11:47','11:38','11:24','11:18','11:11','10:58','10:42','10:14','10:04','09:48','09:22'][i]}</td>
            <td>
              <div className="t-13" style={{ fontWeight: 500 }}>{l.company}</div>
              <div className="t-11 t-mono t-muted">{l.contact_email}</div>
            </td>
            <td><span className="chip sm">{['T0','T1','T2','T3','T4'][i % 5]}</span></td>
            <td className="t-12 ellip" style={{ maxWidth: 280 }}>{`Audit for ${l.company}`}</td>
            <td className="t-11 t-mono">{RELAYS[i % RELAYS.length].name}</td>
            <td>{i % 3 === 0 ? <StatusChip status="ok" label="opened" sm /> : <span className="t-11 t-muted">—</span>}</td>
            <td>{i % 7 === 0 ? <StatusChip status="ok" label="replied" sm /> : <span className="t-11 t-muted">—</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

// ── Manual touches ────────────────────────────────────────────────────────────
const ManualView = ({ openLead }) => (
  <div className="col" style={{ gap: 18 }}>
    <ChannelCard channel="LinkedIn"  total={23} byTouch={{ T0: 8, T1: 7, T2: 5, T3: 3 }} leads={LEADS.slice(0, 4)} openLead={openLead} />
    <ChannelCard channel="Instagram" total={11} byTouch={{ T0: 4, T1: 5, T2: 2 }}        leads={LEADS.slice(4, 7)} openLead={openLead} />
  </div>
);

const ChannelCard = ({ channel, total, byTouch, leads, openLead }) => (
  <Card title={`${channel} · ${total} due`} eyebrow="manual outreach window" padding={20}
    action={<button className="btn clay sm">Open send window</button>}>
    <div className="row" style={{ gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
      {Object.entries(byTouch).map(([t, n]) => (
        <span key={t} className="chip sm">{t} · {n}</span>
      ))}
    </div>
    <div className="col" style={{ gap: 6 }}>
      {leads.map(l => (
        <div key={l.id} className="row" style={{ gap: 10, padding: '8px 12px', background: 'var(--card-2)', border: '1px solid var(--line-2)', borderRadius: 7 }}>
          <span className="dot clay" />
          <span className="t-13 grow" style={{ fontWeight: 500 }}>{l.company}</span>
          <span className="t-11 t-muted">{l.contact_first}</span>
          <button className="btn ghost xs" onClick={() => openLead(l)}>open</button>
          <button className="btn primary xs">mark sent</button>
        </div>
      ))}
      <div className="t-11 t-muted" style={{ textAlign: 'center', marginTop: 4 }}>+ {total - leads.length} more</div>
    </div>
  </Card>
);

window.TabOutbox = TabOutbox;
