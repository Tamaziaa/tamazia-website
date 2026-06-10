// tab-forms.jsx — website form submissions

const TabForms = ({ setTab }) => {
  const formMix = [
    { l: 'Audit request',    v: 18, color: 'var(--clay)' },
    { l: 'Contact',          v: 11, color: 'var(--ok)' },
    { l: 'Briefings',        v:  7, color: 'var(--info)' },
    { l: 'Newsletter',       v: 24, color: 'var(--ink-3)' },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Website forms"
        title="Forms"
        lede="The warm inbound: /audit · /contact · /briefings · /newsletter. KV-buffered then synced to leads every 5 min."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <Stat label="Today" value="5" sub="↑ 2 vs yesterday" kind="ok" />
        <Stat label="This week" value="38" sub="↑ 14% wow" kind="ok" />
        <Stat label="Form → qualified" value="42%" sub="vs 34% organic" kind="ok" />
        <Stat label="Form → booked" value="11%" sub="strong warm conv" kind="ok" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, marginBottom: 28 }}>
        <Card title="By form type · 30d" padding={20}>
          <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
            <Donut size={120} hole={0.6} label={formMix.reduce((s,c)=>s+c.v,0)} sub="subs"
              slices={formMix.map(f => ({ v: f.v, color: f.color }))} />
            <div className="col" style={{ gap: 6, flex: 1 }}>
              {formMix.map(f => (
                <div key={f.l} className="row">
                  <span className="dot" style={{ background: f.color }} />
                  <span className="t-13 grow">{f.l}</span>
                  <span className="t-num t-13">{f.v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="14-day trend" padding={20}>
          <LineChart points={[3,5,4,6,8,5,7,9,6,8,10,7,9,12]} labels={days14().map(d => `${d}`)} w={520} h={170} color="var(--clay)" />
        </Card>
      </div>

      <Section title="Recent submissions">
        <Card padding={0}>
          <table className="tbl">
            <thead><tr><th>When</th><th>Form</th><th>Name</th><th>Email</th><th>Source</th><th>Converted</th></tr></thead>
            <tbody>
              {FORM_SUBS.map(s => (
                <tr key={s.id}>
                  <td className="t-mono t-11">{s.when}</td>
                  <td><span className="chip sm" style={{
                    background: s.type === 'audit' ? 'var(--clay-tint)' : s.type === 'newsletter' ? 'var(--card-2)' : 'var(--ok-tint)',
                    color: s.type === 'audit' ? 'var(--clay)' : s.type === 'newsletter' ? 'var(--ink-3)' : 'var(--ok)',
                  }}>{s.type}</span></td>
                  <td className="t-13">{s.name}</td>
                  <td className="t-mono t-11">{s.email}</td>
                  <td className="t-mono t-11">{s.source}</td>
                  <td>{s.converted ? <StatusChip status="ok" label="lead created" sm /> : <span className="t-11 t-muted">pending sync</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>
    </Page>
  );
};

window.TabForms = TabForms;
