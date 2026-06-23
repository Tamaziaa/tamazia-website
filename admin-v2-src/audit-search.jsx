// audit-search.jsx — Google-style batch audit bar. Paste one or many websites OR company names
// (newline / comma separated). One POST /api/admin/audits/mint {items:[...]} enqueues the whole
// batch (domains mint directly; bare company names are resolved to a domain by the engine). It then
// polls GET /api/admin/audits to resolve each row to its live /audit/<slug>/<hash> link as the
// engine mints them. Per-row: clickable + copyable link, status, and a Re-mint button. A daily cap
// (2000/day) is enforced server-side; the cap/rejection message surfaces here. History below is the
// permanent record (Neon + KV).
const AuditSearch = () => {
  const [raw, setRaw] = React.useState('');
  const [sector, setSector] = React.useState('');
  const [items, setItems] = React.useState([]);   // {key, label, domain, company, status, url, err}
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState('');
  const pollRef = React.useRef(null);

  // domain extractor — '' when the token is a bare company name (kept as-is for the engine to resolve)
  const asDomain = (s) => {
    s = String(s || '').trim().toLowerCase();
    if (!s) return '';
    s = s.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0].split('#')[0];
    return (/\./.test(s) && !/\s/.test(s)) ? s : '';
  };
  // Parse newline-separated input. A line splits further only on commas, or on spaces when every
  // token looks like a domain — so "Clyde & Co" stays one item; "a.com b.com" splits into two.
  const parse = (txt) => {
    const out = []; const seen = {};
    String(txt || '').split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const tokens = /,/.test(trimmed)
        ? trimmed.split(',')
        : (/\s/.test(trimmed) && trimmed.split(/\s+/).every(t => asDomain(t)) ? trimmed.split(/\s+/) : [trimmed]);
      tokens.forEach(tok => {
        const lbl = tok.trim();
        if (!lbl) return;
        const domain = asDomain(lbl);
        const key = (domain || lbl).toLowerCase();
        if (seen[key]) return; seen[key] = 1;
        out.push({ key, label: lbl, domain, company: domain ? '' : lbl });
      });
    });
    return out;
  };

  const stopPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  const resolveLinks = (rows) => {
    let ticks = 0;
    stopPoll();
    pollRef.current = setInterval(async () => {
      ticks++;
      const d = window.API ? await window.API('audits?limit=300') : null;
      const hist = (d && d.audits) || [];
      const byDomain = {}; const byCompany = {};
      hist.forEach(a => {
        const dk = asDomain(a.input || a.domain || ''); if (dk) byDomain[dk] = a;
        const ck = String(a.company || '').trim().toLowerCase(); if (ck) byCompany[ck] = a;
      });
      setItems(prev => prev.map(it => {
        if (it.status === 'live' || it.status === 'error') return it;
        const hit = (it.domain && byDomain[it.domain]) || (it.company && byCompany[it.company.toLowerCase()]);
        const link = hit && (hit.live_url || (hit.slug && hit.hash ? `/audit/${hit.slug}/${hit.hash}` : ''));
        if (link) return { ...it, status: 'live', url: link };
        return it;
      }));
      const done = rows.every(r => (r.domain && byDomain[r.domain]) || (r.company && byCompany[r.company.toLowerCase()]));
      if (done || ticks >= 48) { stopPoll(); setBusy(false); }   // 48 × 5s = 4 min (names take longer)
    }, 5000);
  };

  const run = async () => {
    const rows = parse(raw);
    if (!rows.length) { setNote('Enter at least one website (mishcon.com) or company name (Clyde & Co).'); return; }
    setNote('');
    setBusy(true);
    setItems(rows.map(r => ({ ...r, status: 'queuing', url: '', err: '' })));
    let res;
    try { res = window.POST ? await window.POST('audits/mint', { items: rows.map(r => r.label), sector: sector.trim() || undefined }) : { ok: false, error: 'offline' }; }
    catch (e) { res = { ok: false, error: e.message }; }
    const accKeys = {}; (res.accepted || []).forEach(a => { accKeys[(asDomain(a.domain || '') || String(a.company || '').toLowerCase())] = 1; });
    const rejMap = {}; (res.rejected || []).forEach(r => { rejMap[(asDomain(r.input || '') || String(r.input || '').toLowerCase())] = r.reason; });
    setItems(prev => prev.map(it => {
      const k = it.domain || it.company.toLowerCase();
      if (accKeys[k]) return { ...it, status: 'minting' };
      const reason = rejMap[k] || (res.ok ? '' : (res.detail || res.error));
      return { ...it, status: 'error', err: reason === 'daily_cap' ? 'over daily cap' : (reason || 'mint failed') };
    }));
    if (res && res.message) setNote(res.message);
    resolveLinks(rows.filter(r => accKeys[r.domain || r.company.toLowerCase()]));
  };

  const remint = async (it) => {
    setItems(prev => prev.map(x => x.key === it.key ? { ...x, status: 'minting', url: '', err: '' } : x));
    try { await window.POST('audits/mint', { items: [it.label], sector: sector.trim() || undefined }); } catch (_e) {}
    setBusy(true);
    resolveLinks([it]);
  };

  React.useEffect(() => () => stopPoll(), []);

  const copyAll = () => {
    const txt = items.filter(i => i.url).map(i => `${i.label}  ${location.origin}${i.url}`).join('\n');
    if (txt && navigator.clipboard) navigator.clipboard.writeText(txt);
  };
  const liveCount = items.filter(i => i.status === 'live').length;
  const pill = (s) => s === 'live' ? 'ok' : s === 'error' ? 'bad' : 'warn';
  const label = (s) => ({ queuing: 'queuing…', minting: 'minting…', live: 'ready', error: 'error' }[s] || s);

  return (
    <Card padding={20} kind="clay" style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--clay-2)' }}>Audit search — paste any number of websites or company names</div>
      <div className="t-12 t-muted" style={{ marginBottom: 10 }}>One per line, or comma separated. A website mints straight away; a company name is resolved to its domain by the engine first. Each becomes a live £1,500 audit link, shown below and in History.</div>
      <textarea
        value={raw} onChange={e => setRaw(e.target.value)}
        placeholder={"mishcon.com\nClyde & Co\nhttps://www.dlapiper.com"}
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
      {note && <div className="t-12" style={{ marginTop: 8, color: 'var(--clay-2)' }}>{note}</div>}
      {items.length > 0 && (
        <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
          {items.map((it, i) => (
            <div key={it.key || i} className="row" style={{ gap: 10, alignItems: 'center', padding: '8px 10px', background: 'var(--card)', borderRadius: 8 }}>
              <span className={`chip sm ${pill(it.status)}`}>{label(it.status)}</span>
              <span className="body-sm" style={{ minWidth: 160 }}>{it.label}{it.company && !it.domain ? <span className="t-12 t-muted"> · name</span> : null}</span>
              {it.url
                ? <a href={it.url} target="_blank" rel="noopener" className="body-sm" style={{ color: 'var(--clay-2)', textDecoration: 'underline', wordBreak: 'break-all' }}>{location.origin}{it.url}</a>
                : <span className="t-12 t-muted">{it.err || (it.status === 'minting' ? 'engine is minting — link appears here automatically' : '')}</span>}
              {(it.status === 'live' || it.status === 'error') && (
                <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => remint(it)}>Re-mint</button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
window.AuditSearch = AuditSearch;
