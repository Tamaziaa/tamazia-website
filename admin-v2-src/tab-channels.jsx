// tab-channels.jsx — the channel-aware operator view ported from the old standalone admin worker.
// Two live sections: manual social touches (LinkedIn / Instagram pending, with mark-sent) and email
// deliverability (relay mix, status, 14-day volume, bounce rate). All numbers come from Neon; when a
// source is not wired the section shows an explicit "not connected" state, never a fake zero.
const TabChannels = () => {
  const ch = window.CHANNELS || { connected: false, linkedin: [], instagram: [], counts: {} };
  const dl = window.DELIVERABILITY || { connected: false, by_relay: [], by_status: [], volume_14d: [], sent_total: 0, bounce_total: 0, bounce_rate_pct: 0 };
  const [done, setDone] = React.useState({});   // id -> true once marked sent

  const markSent = async (id) => {
    setDone(d => ({ ...d, [id]: true }));
    try { await window.POST('channels/marksent', { id }); } catch (_e) {}
  };

  const SocialTable = ({ rows, handleLabel, kind }) => (
    <Card padding={0}><table className="tbl">
      <thead><tr><th>Company</th><th>{handleLabel}</th><th>Touch</th><th>Message</th><th></th></tr></thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id} style={done[r.id] ? { opacity: 0.45 } : null}>
            <td className="t-13" style={{ fontWeight: 500 }}>{r.company || '—'}</td>
            <td className="t-12 t-mono">{r.handle ? <a href={/^https?:/.test(r.handle) ? r.handle : '#'} target="_blank" rel="noopener">{r.handle}</a> : '—'}</td>
            <td className="t-12">T{r.touch}</td>
            <td className="t-12 t-soft" style={{ maxWidth: 360, whiteSpace: 'normal' }}>{(r.message_text || '').slice(0, 220)}</td>
            <td>{done[r.id] ? <span className="chip sm ok">sent</span> : <button className="btn ghost sm" onClick={() => markSent(r.id)}>Mark sent</button>}</td>
          </tr>
        ))}
      </tbody>
    </table></Card>
  );

  return (
    <Page>
      <PageHead eyebrow="channels · deliverability" title="Channels"
        lede="Manual LinkedIn + Instagram touches due now, and live email send-health. Mark a social touch sent once you've actioned it; the badge clears on the next refresh." />

      <Section title={`Manual social touches${ch.counts ? '' : ''}`}>
        {!ch.connected ? (
          <Card padding={0}><Empty title="Channel sends not connected" lede={ch.note || 'channel_sends is not populated yet. Once the engine queues LinkedIn/Instagram touches they appear here.'} /></Card>
        ) : (
          <>
            <div className="row" style={{ gap: 10, marginBottom: 12 }}>
              <Stat label="LinkedIn due" value={fmt((ch.counts && ch.counts.linkedin) || ch.linkedin.length)} kind={ch.linkedin.length ? 'warn' : undefined} />
              <Stat label="Instagram due" value={fmt((ch.counts && ch.counts.instagram) || ch.instagram.length)} kind={ch.instagram.length ? 'warn' : undefined} />
            </div>
            {ch.linkedin.length > 0 && <Section title="LinkedIn"><SocialTable rows={ch.linkedin} handleLabel="Profile" kind="linkedin" /></Section>}
            {ch.instagram.length > 0 && <Section title="Instagram"><SocialTable rows={ch.instagram} handleLabel="Handle" kind="instagram" /></Section>}
            {ch.linkedin.length === 0 && ch.instagram.length === 0 && <Card padding={0}><Empty title="No social touches due" lede="Nothing pending on LinkedIn or Instagram right now." /></Card>}
          </>
        )}
      </Section>

      <Section title="Email deliverability">
        {!dl.connected ? (
          <Card padding={0}><Empty title="Deliverability not connected" lede="The sends table is not reachable." /></Card>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
              <Stat label="Sent (all time)" value={fmt(dl.sent_total)} />
              <Stat label="Bounces" value={fmt(dl.bounce_total)} kind={dl.bounce_total ? 'warn' : 'ok'} />
              <Stat label="Bounce rate" value={dl.bounce_rate_pct + '%'} sub="live" kind={dl.bounce_rate_pct > 3 ? 'bad' : 'ok'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card padding={0}><table className="tbl"><thead><tr><th>Relay</th><th>Sends</th></tr></thead>
                <tbody>{dl.by_relay.map((r, i) => <tr key={i}><td className="t-12">{r.relay}</td><td className="t-12">{fmt(r.n)}</td></tr>)}</tbody></table></Card>
              <Card padding={0}><table className="tbl"><thead><tr><th>Delivery status</th><th>Count</th></tr></thead>
                <tbody>{dl.by_status.map((r, i) => <tr key={i}><td className="t-12">{r.status}</td><td className="t-12">{fmt(r.n)}</td></tr>)}</tbody></table></Card>
            </div>
          </>
        )}
      </Section>
    </Page>
  );
};
window.TabChannels = TabChannels;
