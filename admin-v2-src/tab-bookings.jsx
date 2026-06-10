// tab-bookings.jsx — Cal.com bookings

const TabBookings = ({ setTab }) => {
  const openLead = useOpenLead();
  const today = BOOKINGS.filter(b => b.when.includes('Today'));
  const upcoming = BOOKINGS.filter(b => !b.when.includes('Today') && !b.when.includes('Yesterday'));
  const past = BOOKINGS.filter(b => b.when.includes('Yesterday'));

  return (
    <Page>
      <PageHead
        eyebrow="Cal.com bookings"
        title="Bookings"
        lede="Calls booked from replies, audit links, and website forms. Pre-call brief auto-generates on every confirm."
        action={<button className="btn">Open Cal.com ↗</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <Stat label="Today" value={today.length} sub="2 confirmed" />
        <Stat label="This week" value={BOOKINGS.length} sub="↑ 50%" kind="ok" />
        <Stat label="Show rate · 30d" value="71%" sub="67 of 94 attended" kind="ok" />
        <Stat label="Won from calls" value={fmt(15)} sub="30d" kind="ok" />
      </div>

      <Section title="Today">
        {today.length === 0 ? <Empty title="No calls today." /> : (
          <div className="col" style={{ gap: 10 }}>
            {today.map(b => (
              <Card key={b.id} title={b.lead.company} eyebrow={b.when} padding={20}
                action={<StatusChip status="ok" label="confirmed" sm />}
              >
                <KV label="Contact" value={`${b.lead.contact_first} · ${b.lead.contact_role}`} />
                <KV label="Sector" value={`${b.lead.sector} · ${b.lead.geo}`} />
                <KV label="Duration" value={`${b.duration} min`} />
                <KV label="Source" value={b.source} />
                <KV label="Quality score" value={<ScorePill score={b.lead.score} fit={b.lead.fit} />} />
                <div className="row" style={{ gap: 6, marginTop: 14 }}>
                  <button className="btn clay">Join call ↗</button>
                  <button className="btn" onClick={() => openLead(b.lead)}>Open lead</button>
                  <button className="btn ghost">Open pre-call brief</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Upcoming · this week">
        <Card padding={0}>
          <table className="tbl">
            <thead><tr><th>When</th><th>Lead</th><th>Sector</th><th>Source</th><th>Status</th><th>Score</th></tr></thead>
            <tbody>
              {upcoming.map(b => (
                <tr key={b.id} onClick={() => openLead(b.lead)} style={{ cursor: 'pointer' }}>
                  <td className="t-12">{b.when} · {b.duration}min</td>
                  <td>
                    <div className="t-13" style={{ fontWeight: 500 }}>{b.lead.company}</div>
                    <div className="t-11 t-mono t-muted">{b.lead.contact_email}</div>
                  </td>
                  <td className="t-12">{b.lead.sector}</td>
                  <td><span className="chip sm">{b.source}</span></td>
                  <td><StatusChip status={b.status === 'confirmed' ? 'ok' : 'warn'} label={b.status} sm /></td>
                  <td><ScorePill score={b.lead.score} fit={b.lead.fit} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title="Recent · with outcomes">
        <Card padding={0}>
          <table className="tbl">
            <thead><tr><th>When</th><th>Lead</th><th>Outcome</th><th>Notes</th></tr></thead>
            <tbody>
              {past.map(b => (
                <tr key={b.id} onClick={() => openLead(b.lead)} style={{ cursor: 'pointer' }}>
                  <td className="t-12">{b.when}</td>
                  <td>
                    <div className="t-13" style={{ fontWeight: 500 }}>{b.lead.company}</div>
                    <div className="t-11 t-muted">{b.lead.sector}</div>
                  </td>
                  <td><StatusChip status="ok" label="attended" sm /></td>
                  <td className="t-12 t-soft">{b.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>
    </Page>
  );
};

window.TabBookings = TabBookings;
