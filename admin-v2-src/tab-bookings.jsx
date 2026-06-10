// tab-bookings.jsx — cal.com bookings, 100% live (Neon cal_bookings + KV buffer via /api/admin/bookings).
const TabBookings = () => {
  const all = (window.BOOKINGS || []);
  const today = all.filter(b => b.bucket === 'today');
  const upcoming = all.filter(b => b.bucket === 'upcoming');
  const past = all.filter(b => b.bucket === 'past' || b.bucket === 'unknown');
  const confirmed = all.filter(b => !/cancel/.test(b.status));

  const Row = ({ b }) => (
    <tr key={b.id}>
      <td className="t-12">{b.when}{b.duration ? ` · ${b.duration}min` : ''}</td>
      <td>
        <div className="t-13" style={{ fontWeight: 500 }}>{b.name}</div>
        <div className="t-11 t-mono t-muted">{b.email || '—'}</div>
      </td>
      <td className="t-12">{b.event_type || '—'}</td>
      <td><StatusChip status={/cancel/.test(b.status) ? 'bad' : /reschedul/.test(b.status) ? 'warn' : 'ok'} label={b.status} sm /></td>
      <td className="t-12 t-soft">{b.outcome || b.notes || '—'}</td>
    </tr>
  );

  const Tbl = ({ rows }) => (
    <Card padding={0}><table className="tbl">
      <thead><tr><th>When</th><th>Who</th><th>Event</th><th>Status</th><th>Outcome / notes</th></tr></thead>
      <tbody>{rows.map(b => <Row key={b.id} b={b} />)}</tbody>
    </table></Card>
  );

  return (
    <Page>
      <PageHead
        eyebrow="cal.com bookings"
        title="Bookings"
        lede="Every booking from replies, audit links, and the website. Webhook-fed into Neon (cal_bookings) and matched to its lead by email."
        action={<a className="btn" href="https://app.cal.com/bookings/upcoming" target="_blank" rel="noopener">Open cal.com ↗</a>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <Stat label="Total" value={fmt(all.length)} sub="all captured" />
        <Stat label="Today" value={fmt(today.length)} sub="on the calendar" kind={today.length ? 'ok' : undefined} />
        <Stat label="Upcoming" value={fmt(upcoming.length)} sub="confirmed ahead" />
        <Stat label="Confirmed (all-time)" value={fmt(confirmed.length)} sub="not cancelled" kind="ok" />
      </div>

      {all.length === 0 ? (
        <Card padding={0}><Empty title="No bookings yet" lede="When a prospect books via cal.com, the webhook writes it here and pings you on Slack + Telegram. Test it by making a booking on your own cal link." /></Card>
      ) : (
        <>
          {today.length > 0 && <Section title="Today"><Tbl rows={today} /></Section>}
          {upcoming.length > 0 && <Section title="Upcoming"><Tbl rows={upcoming} /></Section>}
          {past.length > 0 && <Section title="Past"><Tbl rows={past} /></Section>}
        </>
      )}
    </Page>
  );
};
window.TabBookings = TabBookings;
