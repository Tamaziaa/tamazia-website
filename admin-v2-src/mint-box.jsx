// mint-box.jsx — "Mint any brand" box. Type a website (or brand + domain), it enqueues a
// manual audit mint (POST /api/admin/audits/mint) and fires the engine. The result lands in
// the Audits → History tab with a Manual tag. Lives on Now and Audits.
const MintBox = ({ compact }) => {
  const [domain, setDomain] = React.useState('');
  const [sector, setSector] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);

  const go = async () => {
    const v = domain.trim();
    if (!v) { setMsg({ ok: false, t: 'Enter a website, e.g. example.com' }); return; }
    setBusy(true); setMsg(null);
    const r = (window.POST ? await window.POST('audits/mint', { domain: v, sector: sector.trim() || undefined }) : { ok: false, error: 'offline' });
    setBusy(false);
    if (r && r.ok) { setMsg({ ok: true, t: r.message || 'Queued — it will appear in History shortly.' }); setDomain(''); setSector(''); }
    else setMsg({ ok: false, t: (r && (r.detail || r.error)) || 'Could not queue the mint.' });
  };

  return (
    <Card padding={compact ? 16 : 20} kind="clay" style={{ marginBottom: compact ? 0 : 16 }}>
      <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--clay-2)' }}>Mint an audit for any brand</div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <div className="input grow" style={{ minWidth: 220, background: 'var(--card)' }}>
          <Icon name="file" sm />
          <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="website (e.g. mishcon.com)"
            onKeyDown={e => { if (e.key === 'Enter') go(); }} />
        </div>
        <div className="input" style={{ width: 150, background: 'var(--card)' }}>
          <input value={sector} onChange={e => setSector(e.target.value)} placeholder="sector (optional)"
            onKeyDown={e => { if (e.key === 'Enter') go(); }} />
        </div>
        <button className="btn clay" disabled={busy} onClick={go}>{busy ? 'Minting…' : 'Mint audit'}</button>
      </div>
      {msg && <div className="body-sm" style={{ marginTop: 10, color: msg.ok ? 'var(--ok)' : 'var(--clay-2)' }}>{msg.t}</div>}
    </Card>
  );
};
window.MintBox = MintBox;
