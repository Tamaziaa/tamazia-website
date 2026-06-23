// audit-search.jsx — Google-style batch audit bar. Paste one or many website URLs (newline / comma /
// space separated), it mints a £1,500 audit for each via POST /api/admin/audits/mint, then polls
// GET /api/admin/audits to resolve each domain to its live /audit/<slug>/<hash> link as the engine
// mints them. Per-batch results show clickable + copyable links; the History table below is the
// permanent record (Neon + KV). No new backend — pure UX over the existing mint + audits APIs.
const AuditSearch = () => {
  const [raw, setRaw] = React.useState('');
  const [sector, setSector] = React.useState('');
  const [items, setItems] = React.useState([]);   // {domain, status, url, err}
  const [busy, setBusy] = React.useState(false);
  const pollRef = React.useRef(null);

  const norm = (s) => {
    s = String(s || '').trim().toLowerCase();
    if (!s) return '';
    s = s.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0].split('#')[0];
    return (/\./.test(s) && !/\s/.test(s)) ? s : '';
  };
  const parse = (txt) => {
    const out = []; const seen = {};
    String(txt || '').split(/[\s,]+/).forEach(tok => { const d = norm(tok); if (d && !seen[d]) { seen[d] = 1; out.push(d); } });
    return out;
  };

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  const resolveLinks = (list) => {
    // poll the audits API and match domains -> live_url; stop when all resolved or after ~3 min
    let ticks = 0;
    stopPoll();
    pollRef.current = setInterval(async () => {
      ticks++;
      const d = window.API ? await window.API('audits?limit=300') : null;
      const rows = (d && d.audits) || [];
      const byDomain = {};
      rows.forEach(a => { const k = norm(a.input || a.domain || ''); if (k) byDomain[k] = a; });
      setItems(prev => prev.map(it => {
        if (it.status === 'live' || it.status === 'error') return it;
        const hit = byDomain[it.domain];
        const link = hit && (hit.live_url || (hit.slug && hit.hash ? `/audit/${hit.slug}/${hit.hash}` : ''));
        if (link) return { ...it, status: 'live', url: link };
        return it;
      }));
      const done = list.every(dm => { const a = byDomain[dm]; return a && (a.live_url || (a.slug && a.hash)); });
      if (done || ticks >= 36) { stopPoll(); setBusy(false); }   // 36 × 5s = 3 min cap
    }, 5000);
  };

  const run = async () => {
    const domains = parse(raw);
    if (!domains.length) { setItems([{ domain: '—', status: 'error', err: 'Enter at least one website, e.g. mishcon.com' }]); return; }
    setBusy(true);
    setItems(domains.map(dm => ({ domain: dm, status: 'queuing', url: '', err: '' })));
    // fire mints (sequential to be gentle on the engine + Neon)
    for (const dm of domains) {
      let r;
      try { r = window.POST ? await window.POST('audits/mint', { domain: dm, sector: sector.trim() || undefined }) : { ok: false, error: 'offline' }; }
      catch (e) { r = { ok: false, error: e.message }; }
      setItems(prev => prev.map(it => it.domain === dm
        ? (r && r.ok ? { ...it, status: 'minting' } : { ...it, status: 'error', err: (r && (r.detail || r.error)) || 'mint failed' })
        : it));
    }
    resolveLinks(domains);
  };

  React.useEffect(() => () => stopPoll(), []);

  const copyAll = () => {
    const txt = items.filter(i => i.url).map(i => `${i.domain}  ${location.origin}${i.url}`).join('\n');
    if (txt && navigator.clipboard) navigator.clipboard.writeText(txt);
  };
  const liveCount = items.filter(i => i.status === 'live').length;

  const pill = (s) => s === 'live' ? 'ok' : s === 'error' ? 'bad' : 'warn';
  const label = (s) => ({ queuing: 'queuing…', minting: 'minting…', live: 'ready', error: 'error' }[s] || s);

  return (
    <Card padding={20} kind="clay" style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--clay-2)' }}>Audit search — paste any number of websites</div>
      <div className="t-12 t-muted" style={{ marginBottom: 10 }}>One per line, or comma/space separated. Each becomes a live £1,500 audit link. Results appear below and in History.</div>
      <textarea
        value={raw} onChange={e => setRaw(e.target.value)}
        placeholder={"mishcon.com\nclydeco.com\nhttps://www.dlapiper.com"}
        rows={4}
        style={{ width: '100%', resize: 'vertical', background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 10, padding: 12, font: 'inherit' }}
      />
      <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <div className="input" style={{ width: 170, background: 'var(--card)' }}>
          <input value={sector} onChange={e => setSector(e.target.value)} placeholder="sector (optional)" />
        </div>
        <button className="btn clay" disabled={busy} onClick={run}>{busy ? 'Generating…' : 'Generate audit links'}</button>
        {items.some(i => i.url) && <button className="btn ghost" onClick={copyAll}>Copy all links</button>}
        {items.length > 0 && <span className="t-12 t-muted" style={{ marginLeft: 'auto' }}>{liveCount}/{items.length} ready</span>}
      </div>
      {items.length > 0 && (
        <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
          {items.map((it, i) => (
            <div key={i} className="row" style={{ gap: 10, alignItems: 'center', padding: '8px 10px', background: 'var(--card)', borderRadius: 8 }}>
              <span className={`chip sm ${pill(it.status)}`}>{label(it.status)}</span>
              <span className="body-sm" style={{ minWidth: 160 }}>{it.domain}</span>
              {it.url
                ? <a href={it.url} target="_blank" rel="noopener" className="body-sm" style={{ color: 'var(--clay-2)', textDecoration: 'underline', wordBreak: 'break-all' }}>{location.origin}{it.url}</a>
                : <span className="t-12 t-muted">{it.err || (it.status === 'minting' ? 'engine is minting — link appears here automatically' : '')}</span>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
window.AuditSearch = AuditSearch;
