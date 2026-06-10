// lib.jsx — calm primitives for the Claude-style cockpit
// Single-column pages, conversational headings, one clear action per card.

const { useState, useEffect, useMemo, useRef, useContext, createContext } = React;

// ── Page wrapper — single column, generous breathing room ─────────────────────
const Page = ({ children, wide = false, narrow = false, style }) => (
  <div className={`page ${wide ? 'page-wide' : narrow ? 'page-narrow' : ''}`} style={style}>
    {children}
  </div>
);

// ── Page header — eyebrow + title + lede (Claude-style) ───────────────────────
const PageHead = ({ eyebrow, title, lede, action }) => (
  <header style={{ marginBottom: 28 }}>
    {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14 }}>
      <h1 className="h1" style={{ margin: 0 }}>{title}</h1>
      {action}
    </div>
    {lede && <p className="lede" style={{ margin: '10px 0 0', maxWidth: '60ch' }}>{lede}</p>}
  </header>
);

// ── Section ─ a vertical block, with a quiet header ───────────────────────────
const Section = ({ title, lede, action, children, style, id }) => (
  <section id={id} style={{ marginBottom: 36, ...style }}>
    {title && (
      <div className="spread" style={{ marginBottom: 14 }}>
        <div>
          <h2 className="h2" style={{ margin: 0 }}>{title}</h2>
          {lede && <div className="body-sm t-muted" style={{ marginTop: 4, maxWidth: '54ch' }}>{lede}</div>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

// ── Card ─ flexible card primitive ────────────────────────────────────────────
const Card = ({ title, eyebrow, lede, action, children, kind, padding = 22, style }) => (
  <article className={`card ${kind || ''}`} style={style}>
    {(title || eyebrow || action) && (
      <div className="spread" style={{ padding: `${padding}px ${padding}px ${title ? 12 : padding}px` }}>
        <div>
          {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
          {title && <h3 className="h3" style={{ margin: 0 }}>{title}</h3>}
          {lede && <div className="body-sm t-muted" style={{ marginTop: 4 }}>{lede}</div>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    )}
    <div style={{ padding: title ? `0 ${padding}px ${padding}px` : padding }}>
      {children}
    </div>
  </article>
);

// ── Stat — single number, calm, with optional spark ───────────────────────────
const Stat = ({ label, value, sub, kind, sparkline }) => {
  const color = kind === 'ok' ? 'var(--ok)' : kind === 'warn' ? 'var(--warn)' : kind === 'bad' ? 'var(--clay-2)' : 'var(--ink-1)';
  return (
    <div style={{ minWidth: 0 }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      <div className="t-num" style={{ fontSize: 24, lineHeight: 1.1, color }}>{value}</div>
      {sub && <div className="body-sm t-muted" style={{ marginTop: 2 }}>{sub}</div>}
      {sparkline && <div style={{ marginTop: 8 }}>{sparkline}</div>}
    </div>
  );
};

// ── KV row ─ label + value with optional sub ──────────────────────────────────
const KV = ({ label, value, sub, kind }) => {
  const c = kind === 'ok' ? 'var(--ok)' : kind === 'warn' ? 'var(--warn)' : kind === 'bad' ? 'var(--clay-2)' : 'var(--ink-3)';
  return (
    <div className="spread" style={{ padding: '8px 0', borderBottom: '1px solid var(--line-2)' }}>
      <div>
        <div className="t-13">{label}</div>
        {sub && <div className="t-11" style={{ color: c }}>{sub}</div>}
      </div>
      <div className="t-num t-13">{value}</div>
    </div>
  );
};

// ── ActionRow ─ a tappable row with one clear primary action ──────────────────
const ActionRow = ({ icon, title, sub, action, onClick, accent }) => (
  <button
    onClick={onClick}
    className="card"
    style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
      width: '100%', textAlign: 'left',
      cursor: 'pointer',
      borderLeft: accent ? `3px solid var(--clay)` : '1px solid var(--line-1)',
      transition: 'border-color 0.12s, background 0.12s',
    }}
    onMouseEnter={e => { if (!accent) e.currentTarget.style.borderColor = 'var(--ink-4)'; }}
    onMouseLeave={e => { if (!accent) e.currentTarget.style.borderColor = 'var(--line-1)'; }}
  >
    {icon && <span className="ico" style={{ color: 'var(--ink-3)', flexShrink: 0 }}>{icon}</span>}
    <div className="grow">
      <div className="t-14" style={{ fontWeight: 500, color: 'var(--ink-1)' }}>{title}</div>
      {sub && <div className="body-sm t-muted" style={{ marginTop: 2 }}>{sub}</div>}
    </div>
    {action && <span style={{ flexShrink: 0 }}>{action}</span>}
  </button>
);

// ── StatusChip with dot ──────────────────────────────────────────────────────
const StatusChip = ({ status, label, sm, full }) => {
  const map = {
    ok:   { bg: 'var(--ok-tint)',   bd: 'var(--ok-soft)',   c: 'var(--ok)' },
    warn: { bg: 'var(--warn-tint)', bd: 'var(--warn-soft)', c: 'var(--warn)' },
    bad:  { bg: '#fbeae2',          bd: '#f0c8b6',          c: 'var(--clay-2)' },
    info: { bg: 'var(--info-tint)', bd: 'var(--info-soft)', c: 'var(--info)' },
    idle: { bg: 'var(--card-2)',    bd: 'var(--line-1)',    c: 'var(--ink-3)' },
  }[status] || { bg: 'var(--card)', bd: 'var(--line-1)', c: 'var(--ink-2)' };
  return (
    <span className="chip" style={{
      background: map.bg, borderColor: map.bd, color: map.c,
      padding: sm ? '1px 7px' : undefined,
      fontSize: sm ? 10 : 11,
    }}>
      <span className="dot" style={{ background: map.c, width: sm ? 5 : 7, height: sm ? 5 : 7 }} />
      {label}
    </span>
  );
};

// ── Sparkline — minimal, faint ────────────────────────────────────────────────
const Sparkline = ({ points, w = 220, h = 32, color = 'var(--ink-2)', fill = false, strokeWidth = 1.4 }) => {
  if (!points || points.length === 0) return null;
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const ys = points.map(p => h - 3 - ((p - min) / range) * (h - 6));
  const d = ys.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${y}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      {fill && <path d={`${d} L ${(points.length - 1) * step} ${h} L 0 ${h} Z`} fill={color} opacity="0.1" />}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(points.length - 1) * step} cy={ys[ys.length - 1]} r={2} fill={color} />
    </svg>
  );
};

// ── LineChart — single series, minimal ────────────────────────────────────────
const LineChart = ({ points, labels, w = 760, h = 200, color = 'var(--clay)', fill = true }) => {
  if (!points || points.length === 0) return null;
  const max = Math.max(...points), min = 0;
  const range = max - min || 1;
  const step = (w - 36) / (points.length - 1);
  const yScale = v => h - 26 - ((v - min) / range) * (h - 40);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${30 + i * step} ${yScale(p)}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block', maxWidth: '100%' }}>
      {[0, 0.5, 1].map((g, i) => (
        <g key={i}>
          <line x1={30} x2={w} y1={yScale(min + range * g)} y2={yScale(min + range * g)} stroke="var(--line-2)" strokeDasharray="2 4" />
          <text x={4} y={yScale(min + range * g) + 3} fontSize="10" fill="var(--ink-4)" fontFamily="var(--mono)">{Math.round(min + range * g)}</text>
        </g>
      ))}
      {fill && <path d={`${d} L ${30 + (points.length - 1) * step} ${h - 26} L 30 ${h - 26} Z`} fill={color} opacity="0.08" />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={30 + i * step} cy={yScale(p)} r={1.8} fill={color} />)}
      {labels?.map((l, i) => (
        i % Math.ceil(points.length / 7) === 0 || i === points.length - 1 ?
        <text key={i} x={30 + i * step} y={h - 6} fontSize="10" fill="var(--ink-4)" fontFamily="var(--mono)" textAnchor="middle">{l}</text>
        : null
      ))}
    </svg>
  );
};

// ── Horizontal bars ───────────────────────────────────────────────────────────
const HBars = ({ data, labelW = 140, valW = 60, height = 8, color = 'var(--ink-1)' }) => {
  const max = Math.max(...data.map(d => d.v || 0));
  return (
    <div className="col" style={{ gap: 8 }}>
      {data.map((d, i) => (
        <div key={i} className="row" style={{ gap: 10 }}>
          <div className="t-13 ellip" style={{ width: labelW, color: 'var(--ink-2)' }}>{d.label}</div>
          <div className="grow bar" style={{ height }}>
            <i style={{ width: `${max ? (d.v / max) * 100 : 0}%`, background: d.color || color }} />
          </div>
          <div className="t-num t-13" style={{ width: valW, textAlign: 'right' }}>{d.display ?? d.v}</div>
        </div>
      ))}
    </div>
  );
};

// ── Donut ─────────────────────────────────────────────────────────────────────
const Donut = ({ slices, size = 120, hole = 0.6, label, sub }) => {
  const total = slices.reduce((s, x) => s + x.v, 0);
  let acc = 0;
  const r = size / 2;
  const c = 2 * Math.PI * (r * 0.82);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${r} ${r}) rotate(-90)`}>
          {slices.map((s, i) => {
            const pct = total > 0 ? s.v / total : 0;
            const len = pct * c;
            const offset = -acc * c;
            acc += pct;
            return <circle key={i} r={r * 0.82} cx="0" cy="0" fill="none"
              stroke={s.color} strokeWidth={r * (1 - hole)} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={offset} />;
          })}
        </g>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="t-num" style={{ fontSize: Math.round(size / 5.5) }}>{label}</div>
        {sub && <div className="eyebrow" style={{ fontSize: 9 }}>{sub}</div>}
      </div>
    </div>
  );
};

// ── Drawer ───────────────────────────────────────────────────────────────────
const DrawerCtx = createContext(null);
const DrawerProvider = ({ children }) => {
  const [content, setContent] = useState(null);
  useEffect(() => {
    const onEsc = e => { if (e.key === 'Escape') setContent(null); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);
  return (
    <DrawerCtx.Provider value={{ open: setContent, close: () => setContent(null) }}>
      {children}
      {content && (
        <>
          <div onClick={() => setContent(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(36, 26, 12, 0.32)',
            zIndex: 90, animation: 'fadeIn 0.18s',
          }} />
          <div className="drawer-in" style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(640px, 96vw)',
            background: 'var(--bg)', borderLeft: '1px solid var(--line-1)',
            zIndex: 100, overflowY: 'auto', boxShadow: 'var(--shadow-pop)',
          }}>
            {content}
          </div>
        </>
      )}
    </DrawerCtx.Provider>
  );
};
const useDrawer = () => useContext(DrawerCtx);

// ── Modal (centered) ─────────────────────────────────────────────────────────
const ModalCtx = createContext(null);
const ModalProvider = ({ children }) => {
  const [content, setContent] = useState(null);
  useEffect(() => {
    const onEsc = e => { if (e.key === 'Escape') setContent(null); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);
  return (
    <ModalCtx.Provider value={{ open: setContent, close: () => setContent(null) }}>
      {children}
      {content && (
        <div onClick={() => setContent(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(36, 26, 12, 0.4)',
          zIndex: 200, animation: 'fadeIn 0.18s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} className="modal-in" style={{
            background: 'var(--bg)', border: '1px solid var(--line-1)',
            borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)',
            maxWidth: 480, width: '100%', overflow: 'hidden',
          }}>
            {content}
          </div>
        </div>
      )}
    </ModalCtx.Provider>
  );
};
const useModal = () => useContext(ModalCtx);

// ── Icons (inline SVG) ────────────────────────────────────────────────────────
const Icon = ({ name, sm }) => {
  const paths = {
    home:     <><path d="M3 12L12 4l9 8"/><path d="M5 10v10h14V10"/></>,
    pipeline: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    inbox:    <><path d="M22 12H16l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
    outbox:   <><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
    users:    <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    layers:   <><path d="M12 2l10 6-10 6L2 8l10-6z"/><path d="M2 16l10 6 10-6"/><path d="M2 12l10 6 10-6"/></>,
    file:     <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></>,
    pulse:    <><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>,
    cog:      <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    sparkle:  <><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    form:     <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/></>,
    play:     <><polygon points="5 3 19 12 5 21 5 3"/></>,
    pause:    <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
    search:   <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></>,
    arrowR:   <><path d="M5 12h14M12 5l7 7-7 7"/></>,
    check:    <><polyline points="20 6 9 17 4 12"/></>,
    x:        <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    chev:     <><polyline points="9 18 15 12 9 6"/></>,
    chevDown: <><polyline points="6 9 12 15 18 9"/></>,
    plus:     <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    refresh:  <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,
    sliders:  <><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>,
    bot:      <><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/></>,
    bolt:     <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  };
  return (
    <span className={`ico ${sm ? 'ico-sm' : ''}`}>
      <svg viewBox="0 0 24 24">{paths[name]}</svg>
    </span>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => typeof n === 'number' ? n.toLocaleString() : n;
const days14 = () => Array.from({ length: 14 }, (_, i) => 22 - (13 - i));

// ── Touch chips T0..T5 progression ────────────────────────────────────────────
const TouchProgression = ({ history, sm }) => {
  const labels = ['T0','T1','T2','T3','T4','T5'];
  const stateColor = { sent: 'var(--ok)', queued: 'var(--clay)', failed: 'var(--clay-2)', '—': 'var(--ink-5)' };
  const dim = sm ? 12 : 16;
  return (
    <div className="row" style={{ gap: sm ? 3 : 4 }}>
      {(history.length === 6 ? history : [...history, ...Array(6 - history.length).fill('—')]).map((s, i) => (
        <span key={i} title={`${labels[i]}: ${s}`} style={{
          width: dim, height: dim, borderRadius: '50%',
          background: stateColor[s] || 'var(--ink-5)',
          color: 'white', fontSize: sm ? 7 : 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontWeight: 500,
        }}>{i}</span>
      ))}
    </div>
  );
};

// ── ScorePill (smaller, calmer) ───────────────────────────────────────────────
const ScorePill = ({ score, fit }) => {
  const color = score >= 70 ? 'var(--ok)' : score >= 60 ? 'var(--ok)' : score >= 35 ? 'var(--clay)' : 'var(--ink-3)';
  return (
    <span className="row" style={{ gap: 6 }}>
      <span style={{
        position: 'relative', width: 36, height: 18, border: `1px solid ${color}`,
        borderRadius: 4, overflow: 'hidden', background: 'var(--card)',
      }}>
        <span style={{ position: 'absolute', inset: 0, width: `${score}%`, background: color, opacity: 0.18 }} />
        <span className="t-num" style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', height: '100%', fontSize: 11, color,
        }}>{score}</span>
      </span>
      {fit && <span className="chip clay sm" style={{ padding: '0 5px', fontSize: 9 }}>FIT</span>}
    </span>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────
const Empty = ({ title, lede, action }) => (
  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
    <div className="h3" style={{ marginBottom: 4 }}>{title}</div>
    {lede && <div className="body-sm t-muted" style={{ marginBottom: 14 }}>{lede}</div>}
    {action}
  </div>
);

Object.assign(window, {
  Page, PageHead, Section, Card, Stat, KV, ActionRow, StatusChip,
  Sparkline, LineChart, HBars, Donut,
  DrawerProvider, useDrawer, ModalProvider, useModal,
  Icon, fmt, days14, TouchProgression, ScorePill, Empty,
});
