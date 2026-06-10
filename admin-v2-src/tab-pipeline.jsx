// tab-pipeline.jsx — vertical 8-stage conveyor, drill-down per stage inline

const TabPipeline = ({ setTab }) => {
  const [open, setOpen] = React.useState('source'); // first stage expanded

  return (
    <Page>
      <PageHead
        eyebrow="The conveyor"
        title="Pipeline"
        lede="Every lead flows through eight stages. Each stage shows what it does, how many leads passed through, and what's there to manage."
      />

      {/* ICP banner */}
      <Card kind="soft" padding={16} style={{ marginBottom: 28 }}>
        <div className="row" style={{ gap: 14 }}>
          <span className="eyebrow" style={{ color: 'var(--clay)' }}>ICP</span>
          <span className="t-13">Sourcing is constrained to <b>hospitality · healthcare · real estate</b>. Out-of-sector domains are rejected at ingest.</span>
          <span style={{ marginLeft: 'auto' }}>
            <button className="btn ghost sm" onClick={() => setTab('settings')}>Edit ICP →</button>
          </span>
        </div>
      </Card>

      {/* Top funnel headline numbers — bound to live Neon funnel (window.TRUTH.funnel) */}
      {(() => {
        const f = (TRUTH && TRUTH.funnel) || {};
        const n = k => f[k] != null ? f[k] : 0;
        const total = Object.values(f).reduce((s, v) => s + (Number(v) || 0), 0);
        const sourced = n('sourced'), qualified = n('qualified'), contacted = n('contacted'), replied = n('replied'), won = n('won');
        const pct = (a, b) => b > 0 ? (100 * a / b).toFixed(1) + '%' : '—';
        return (
          <Card padding={22} style={{ marginBottom: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18 }}>
              <Stat label="In pipeline"    value={fmt(total)}     sub="all stages now" />
              <Stat label="Qualified"      value={fmt(qualified)} sub={pct(qualified, total) + ' of pile'} kind="ok" />
              <Stat label="Pending approve" value={fmt(n('pending_approval'))} sub="Tier-2 queue" />
              <Stat label="Contacted"      value={fmt(contacted)} sub={pct(contacted, total)} />
              <Stat label="Replied"        value={fmt(replied)}   sub="inbound captured" kind="ok" />
            </div>
          </Card>
        );
      })()}

      {/* The conveyor */}
      <Section title="The eight stages" lede="Click any stage to open its detail.">
        <div className="col" style={{ gap: 12 }}>
          {CONVEYOR.map((s, i) => (
            <StageBlock
              key={s.key}
              stage={s}
              index={i}
              open={open === s.key}
              onToggle={() => setOpen(open === s.key ? null : s.key)}
              setTab={setTab}
            />
          ))}
        </div>
      </Section>

      {/* Cadence */}
      <Section title="Cadence · Touch 0 → Touch 5" lede="Six touches per lead. Business-day math (skip weekends + UK holidays). Reply at any touch pauses cadence."
        action={<button className="btn ghost sm" onClick={() => setTab('settings')}>Edit cadence →</button>}>
        <CadenceVisual setTab={setTab} />
      </Section>
    </Page>
  );
};

// ── Stage block ──────────────────────────────────────────────────────────────
const StageBlock = ({ stage, index, open, onToggle, setTab }) => {
  const arrow = index < CONVEYOR.length - 1;
  return (
    <div>
      <div className="card" style={{
        padding: 0, overflow: 'hidden',
        borderColor: open ? 'var(--clay-soft)' : 'var(--line-1)',
        transition: 'border-color 0.15s',
      }}>
        <button onClick={onToggle} style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px',
          width: '100%', textAlign: 'left',
        }}>
          {/* Letter badge */}
          <span style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--ink-1)', color: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600, flexShrink: 0,
          }}>{stage.letter}</span>

          {/* Title + one-liner */}
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="h3" style={{ marginBottom: 4 }}>{stage.label}</div>
            <div className="body-sm t-muted" style={{ overflow: 'hidden' }}>{stage.one_liner}</div>
          </div>

          {/* Right side: count + today + status */}
          <div className="row" style={{ gap: 22, flexShrink: 0 }}>
            {stage.counts.out != null && (
              <div style={{ textAlign: 'right' }}>
                <div className="t-num" style={{ fontSize: 18, color: 'var(--ink-1)' }}>{fmt(stage.counts.out)}</div>
                <div className="eyebrow" style={{ fontSize: 9 }}>through · 30d</div>
              </div>
            )}
            {stage.today != null && (
              <div style={{ textAlign: 'right' }}>
                <div className="t-num" style={{ fontSize: 18, color: 'var(--clay)' }}>+{fmt(stage.today)}</div>
                <div className="eyebrow" style={{ fontSize: 9 }}>today</div>
              </div>
            )}
            <span className="dot live-dot" style={{ background: 'var(--ok)' }} />
            <span style={{ color: 'var(--ink-4)', display: 'flex', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
              <Icon name="chev" />
            </span>
          </div>
        </button>

        {open && (
          <div className="fade-in" style={{ padding: '4px 22px 22px', borderTop: '1px solid var(--line-2)' }}>
            <div style={{ marginTop: 18, marginBottom: 18 }}>
              <p className="body-sm" style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {stage.detail}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
              {stage.metrics.map((m, i) => (
                <div key={i} style={{
                  padding: '12px 14px',
                  background: 'var(--card-2)',
                  border: '1px solid var(--line-2)',
                  borderRadius: 7,
                }}>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>{m.l}</div>
                  <div className="t-num" style={{ fontSize: 20 }}>{typeof m.v === 'number' ? m.v.toLocaleString() : m.v}</div>
                  {m.sub && <div className="t-11 t-muted" style={{ marginTop: 2 }}>{m.sub}</div>}
                </div>
              ))}
            </div>

            <StageDetail key={stage.key} stage={stage} setTab={setTab} />

            <div className="row" style={{ gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              {stage.actions.map((a, i) => (
                <button key={i} className={`btn ${i === 0 ? 'primary' : ''}`}>{a}</button>
              ))}
              <span style={{ flex: 1 }} />
              <button className="btn ghost sm" onClick={() => routeStage(stage.key, setTab)}>Open detail page →</button>
            </div>
          </div>
        )}
      </div>

      {/* Arrow between stages */}
      {arrow && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0', color: 'var(--ink-4)' }}>
          <Icon name="chevDown" sm />
        </div>
      )}
    </div>
  );
};

// Per-stage extra detail (different per stage)
const StageDetail = ({ stage, setTab }) => {
  if (stage.key === 'source') {
    return (
      <div className="col" style={{ gap: 12 }}>
        <div className="eyebrow">Top yielding queries · 30d</div>
        <div className="col" style={{ gap: 6 }}>
          {[
            { q: 'hospitality compliance UAE', y: 184 },
            { q: 'healthcare GDPR audit Manchester', y: 122 },
            { q: 'real estate compliance Dubai', y: 98 },
            { q: 'boutique hotel audit London', y: 76 },
          ].map((r, i) => (
            <div key={i} className="row" style={{ gap: 10 }}>
              <code className="t-mono t-12 grow">{r.q}</code>
              <span className="t-num t-12" style={{ color: 'var(--ok)' }}>+{r.y}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (stage.key === 'verify') {
    return (
      <Donut size={120} hole={0.55} label="89%" sub="valid"
        slices={[
          { v: 89.4, color: 'var(--ok)' },
          { v:  6.1, color: 'var(--warn)' },
          { v:  3.2, color: 'var(--clay-2)' },
          { v:  1.3, color: 'var(--ink-4)' },
        ]} />
    );
  }
  if (stage.key === 'compose') {
    return (
      <div className="col" style={{ gap: 8 }}>
        <div className="eyebrow">Quality score · distribution</div>
        <HBars data={[
          { label: '70-100', v: 412 },
          { label: '60-69',  v: 1325, color: 'var(--ok)' },
          { label: '35-59',  v: 2103, color: 'var(--clay)' },
          { label: '0-34',   v: 1601, color: 'var(--ink-3)' },
        ]} />
      </div>
    );
  }
  if (stage.key === 'send') {
    return (
      <div className="col" style={{ gap: 10 }}>
        <div className="eyebrow">Six relays · 24h</div>
        {RELAYS.map((r, i) => (
          <div key={i} className="row" style={{ gap: 10 }}>
            <span className="t-13" style={{ width: 110 }}>{r.name}</span>
            <div className="grow bar"><i style={{ width: `${(r.sent / r.cap) * 100}%`, background: 'var(--ink-1)' }} /></div>
            <span className="t-num t-12" style={{ width: 80, textAlign: 'right' }}>{r.sent}/{r.cap}</span>
          </div>
        ))}
      </div>
    );
  }
  if (stage.key === 'reply') {
    return (
      <div className="col" style={{ gap: 8 }}>
        <div className="eyebrow">Reply mix · 30d</div>
        <HBars data={REPLY_CATS.slice(0, 7).map(c => ({ label: c.label, v: c.v, color: c.color }))} />
      </div>
    );
  }
  if (stage.key === 'track') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">Booking funnel · 30d</div>
          <KV label="Reply → call request" value="29%" />
          <KV label="Request → booked" value="78%" />
          <KV label="Booked → showed" value="71%" />
          <KV label="Showed → won" value="30%" />
        </div>
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">Open + click · 14d</div>
          <Sparkline points={[28,29,31,30,32,31,33,32,34,33,32,33,34,31]} w={300} h={60} color="var(--clay)" fill />
        </div>
      </div>
    );
  }
  if (stage.key === 'enrich') {
    return (
      <Donut size={120} hole={0.55} label="94%" sub="enriched"
        slices={[
          { v: 78, color: 'var(--ok)' },
          { v: 16, color: 'var(--clay)' },
          { v:  6, color: 'var(--ink-4)' },
        ]} />
    );
  }
  if (stage.key === 'personalise') {
    return (
      <div className="col" style={{ gap: 8 }}>
        <div className="eyebrow">Pointers per lead · top sectors</div>
        <HBars data={[
          { label: 'hospitality',  v: 5.2 },
          { label: 'healthcare',   v: 4.8 },
          { label: 'real estate',  v: 4.1 },
        ]} />
      </div>
    );
  }
  return null;
};

const routeStage = (key, setTab) => {
  const map = { source: 'leads', enrich: 'leads', verify: 'leads', personalise: 'audits',
    compose: 'outbox', send: 'aliases', reply: 'inbox', track: 'health' };
  setTab(map[key] || 'leads');
};

// ── Cadence visual ──────────────────────────────────────────────────────────
const CadenceVisual = ({ setTab }) => (
  <Card padding={22}>
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
      {CADENCE.map((c, i) => (
        <React.Fragment key={c.key}>
          <div style={{
            minWidth: 130, padding: 14, border: '1px solid var(--line-1)', borderRadius: 8,
            background: 'var(--card-2)',
          }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>{c.label} · day {c.day}</div>
            <div className="t-13" style={{ fontWeight: 500, marginBottom: 6, color: 'var(--ink-1)' }}>{c.kind === 'personal' ? 'Personalised' : 'Locked'}</div>
            <div className="t-11 t-muted">{c.purpose}</div>
          </div>
          {i < CADENCE.length - 1 && (
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-4)' }}>
              <Icon name="arrowR" sm />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
    <div className="divider-soft" />
    <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
      <div className="row" style={{ gap: 6 }}><span className="dot" style={{ background: 'var(--clay)' }} /><span className="t-12">T0 — personalised (S063)</span></div>
      <div className="row" style={{ gap: 6 }}><span className="dot" style={{ background: 'var(--ink-1)' }} /><span className="t-12">T1–T5 — locked (S064)</span></div>
      <div className="row" style={{ gap: 6 }}><span className="dot ok" /><span className="t-12">reply pauses cadence</span></div>
    </div>
  </Card>
);

window.TabPipeline = TabPipeline;
