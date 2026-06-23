// tab-clients.jsx — the revenue view. Surfaces the previously-orphan clients / invoices / onboarding
// endpoints: won clients, their invoices, and onboarding tasks. Fetches on mount (kept out of the
// 60s core poll to stay light). "Issue invoice" wires clients -> invoices/create.
const TabClients = () => {
  const [clients, setClients] = React.useState(null);
  const [invoices, setInvoices] = React.useState(null);
  const [onboarding, setOnboarding] = React.useState(null);
  const [toast, setToast] = React.useState('');

  const aliveRef = React.useRef(true);
  const load = async () => {
    const [c, i, o] = await Promise.all([
      window.API ? window.API('clients') : null,
      window.API ? window.API('invoices') : null,
      window.API ? window.API('onboarding') : null,
    ]);
    if (!aliveRef.current) return;
    setClients((c && c.clients) || []);
    setInvoices((i && i.invoices) || []);
    setOnboarding((o && (o.tasks || o.onboarding)) || []);
  };
  React.useEffect(() => { aliveRef.current = true; load().catch(() => {}); return () => { aliveRef.current = false; }; }, []);

  const issueInvoice = async (clientId) => {
    setToast('');
    let r; try { r = await window.POST('invoices/create', { client_account_id: clientId }); } catch (e) { r = { ok: false, error: e.message }; }
    setToast(r && r.ok ? 'Draft invoice created.' : `Failed: ${(r && r.error) || 'error'}`);
    if (r && r.ok) load().catch(() => {});
  };

  return (
    <Page>
      <PageHead eyebrow="revenue" title="Clients"
        lede="Won clients, their invoices and onboarding. Issue a draft invoice from a client row." />
      {toast && <Card padding={12} style={{ marginBottom: 14 }}><span className="t-13">{toast}</span></Card>}

      <Section title="Clients">
        {clients == null ? <Card padding={14}><span className="t-12 t-muted">loading…</span></Card>
          : clients.length === 0 ? <Card padding={0}><Empty title="No clients yet" lede="Win a lead from the Leads drawer to create a client account." /></Card>
          : <Card padding={0}><table className="tbl"><thead><tr><th>Client</th><th>Tier</th><th>Deal</th><th>Since</th><th></th></tr></thead>
              <tbody>{clients.map((c, i) => (
                <tr key={c.id || i}><td className="t-13" style={{ fontWeight: 500 }}>{c.legal_name || c.company || '—'}</td>
                  <td className="t-12">{c.tier || '—'}</td><td className="t-12">{c.deal_value != null ? '£' + fmt(c.deal_value) : '—'}</td>
                  <td className="t-12">{c.created_at || c.contract_start || '—'}</td>
                  <td><button className="btn ghost sm" onClick={() => issueInvoice(c.id)}>Issue invoice</button></td></tr>
              ))}</tbody></table></Card>}
      </Section>

      <Section title="Invoices">
        {invoices == null ? <Card padding={14}><span className="t-12 t-muted">loading…</span></Card>
          : invoices.length === 0 ? <Card padding={0}><Empty title="No invoices" lede="Issued invoices show here." /></Card>
          : <Card padding={0}><table className="tbl"><thead><tr><th>Invoice</th><th>Amount</th><th>Status</th><th>Due</th></tr></thead>
              <tbody>{invoices.map((v, i) => (
                <tr key={v.id || i}><td className="t-12 t-mono">{v.invoice_number || v.id}</td>
                  <td className="t-12">{v.amount != null ? '£' + fmt(v.amount) : '—'}</td>
                  <td><span className={`chip sm ${v.status === 'paid' ? 'ok' : v.status === 'overdue' ? 'bad' : 'warn'}`}>{v.status}</span></td>
                  <td className="t-12">{v.due_date || '—'}</td></tr>
              ))}</tbody></table></Card>}
      </Section>

      <Section title="Onboarding tasks">
        {onboarding == null ? <Card padding={14}><span className="t-12 t-muted">loading…</span></Card>
          : onboarding.length === 0 ? <Card padding={0}><Empty title="No onboarding tasks" lede="Created when a lead is won." /></Card>
          : <Card padding={0}><table className="tbl"><thead><tr><th>Task</th><th>Day</th><th>Status</th><th>Due</th></tr></thead>
              <tbody>{onboarding.map((t, i) => (
                <tr key={t.id || i}><td className="t-13">{t.title || '—'}</td><td className="t-12">{t.day_offset != null ? 'D+' + t.day_offset : '—'}</td>
                  <td><span className={`chip sm ${t.status === 'done' ? 'ok' : 'warn'}`}>{t.status}</span></td>
                  <td className="t-12">{t.due_date || '—'}</td></tr>
              ))}</tbody></table></Card>}
      </Section>
    </Page>
  );
};
window.TabClients = TabClients;
