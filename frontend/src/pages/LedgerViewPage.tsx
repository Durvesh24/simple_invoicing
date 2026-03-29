import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getApiErrorMessage } from '../api/client';
import type { CompanyProfile, Invoice, Ledger, LedgerStatement, Product } from '../types/api';
import InvoicePreview from '../components/InvoicePreview';

function formatCurrency(value: number, currencyCode = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
    }).format(value);
  } catch {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  }
}

function defaultDateRange() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { fromDate: toIso(firstDay), toDate: toIso(today) };
}

export default function LedgerViewPage() {
  const { id } = useParams<{ id: string }>();
  const ledgerId = Number(id);
  const navigate = useNavigate();

  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [statement, setStatement] = useState<LedgerStatement | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(defaultDateRange);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingLedger(true);
        const [ledgerRes, companyRes, productsRes] = await Promise.all([
          api.get<Ledger>(`/ledgers/${ledgerId}`),
          api.get<CompanyProfile>('/company/'),
          api.get<Product[]>('/products/'),
        ]);
        if (cancelled) return;
        setLedger(ledgerRes.data);
        setCompany(companyRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load ledger'));
      } finally {
        if (!cancelled) setLoadingLedger(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ledgerId]);

  useEffect(() => {
    if (!ledgerId || !period.fromDate || !period.toDate) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingStatement(true);
        setError('');
        const res = await api.get<LedgerStatement>(`/ledgers/${ledgerId}/statement`, {
          params: { from_date: period.fromDate, to_date: period.toDate },
        });
        if (!cancelled) setStatement(res.data);
      } catch (err) {
        if (!cancelled) {
          setStatement(null);
          setError(getApiErrorMessage(err, 'Unable to load ledger statement'));
        }
      } finally {
        if (!cancelled) setLoadingStatement(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ledgerId, period.fromDate, period.toDate]);

  const activeCurrencyCode = company?.currency_code || 'INR';

  async function handleViewInvoice(invoiceId: number) {
    try {
      setError('');
      const res = await api.get<Invoice>(`/invoices/${invoiceId}`);
      setPreviewInvoice(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load invoice'));
    }
  }

  if (loadingLedger) {
    return (
      <div className="page-grid">
        <section className="page-hero">
          <div>
            <p className="eyebrow">Ledgers</p>
            <h1 className="page-title">Loading ledger...</h1>
          </div>
        </section>
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="page-grid">
        <section className="page-hero">
          <div>
            <p className="eyebrow">Ledgers</p>
            <h1 className="page-title">Ledger not found</h1>
          </div>
        </section>
        {error ? <div className="status-banner status-banner--error">{error}</div> : null}
      </div>
    );
  }

  return (
    <div className="page-grid">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Ledger statement</p>
          <h1 className="page-title">{ledger.name}</h1>
          <p className="section-copy">
            {ledger.gst} · {ledger.phone_number}
            {ledger.email ? ` · ${ledger.email}` : ''}
          </p>
        </div>
        <button type="button" className="button button--secondary" onClick={() => navigate('/ledgers')}>
          Back to ledgers
        </button>
      </section>

      {error ? <div className="status-banner status-banner--error">{error}</div> : null}

      <section className="content-grid">
        <article className="panel stack">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Ledger details</p>
              <h2 className="nav-panel__title">Account info</h2>
            </div>
            <button type="button" className="button button--ghost" onClick={() => navigate(`/ledgers/${ledgerId}/edit`)}>
              Edit
            </button>
          </div>

          <div className="summary-box">
            <p><strong>Address:</strong> {ledger.address}</p>
            {ledger.website ? <p><strong>Website:</strong> {ledger.website}</p> : null}
            {(ledger.bank_name || ledger.account_number) ? (
              <p>
                <strong>Bank:</strong> {ledger.bank_name || 'N/A'}
                {ledger.branch_name ? ` (${ledger.branch_name})` : ''} · A/C: {ledger.account_number || 'N/A'}
                {ledger.ifsc_code ? ` · IFSC: ${ledger.ifsc_code}` : ''}
              </p>
            ) : null}
          </div>
        </article>

        <article className="panel stack">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Period statement</p>
              <h2 className="nav-panel__title">Period view</h2>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="statement-from">From</label>
              <input
                id="statement-from"
                className="input"
                type="date"
                value={period.fromDate}
                onChange={(e) => setPeriod((c) => ({ ...c, fromDate: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="statement-to">To</label>
              <input
                id="statement-to"
                className="input"
                type="date"
                value={period.toDate}
                onChange={(e) => setPeriod((c) => ({ ...c, toDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="summary-box">
            <p className="eyebrow">Tally-style summary</p>
            <p className="summary-box__value">{statement ? formatCurrency(statement.closing_balance, activeCurrencyCode) : formatCurrency(0, activeCurrencyCode)}</p>
            <p className="muted-text">
              Opening {statement ? formatCurrency(statement.opening_balance, activeCurrencyCode) : formatCurrency(0, activeCurrencyCode)} · Debit{' '}
              {statement ? formatCurrency(statement.period_debit, activeCurrencyCode) : formatCurrency(0, activeCurrencyCode)} · Credit{' '}
              {statement ? formatCurrency(statement.period_credit, activeCurrencyCode) : formatCurrency(0, activeCurrencyCode)}
            </p>
          </div>

          <div className="invoice-list">
            {loadingStatement ? <div className="empty-state">Loading statement...</div> : null}
            {!loadingStatement && statement && statement.entries.length === 0 ? (
              <div className="empty-state">No voucher entries in selected period.</div>
            ) : null}
            {!loadingStatement && statement
              ? statement.entries.map((entry) => (
                  <div key={entry.invoice_id} className="invoice-row">
                    <div className="invoice-row__meta">
                      <strong>{entry.voucher_type} #{entry.invoice_id}</strong>
                      <span className="table-subtext">{new Date(entry.date).toLocaleDateString()} · {entry.particulars}</span>
                    </div>
                    <span className="invoice-row__price">
                      {entry.debit > 0 ? `Dr ${formatCurrency(entry.debit, activeCurrencyCode)}` : `Cr ${formatCurrency(entry.credit, activeCurrencyCode)}`}
                    </span>
                    <button
                      type="button"
                      className="button button--ghost button--small"
                      onClick={() => void handleViewInvoice(entry.invoice_id)}
                      title="View invoice"
                    >
                      View
                    </button>
                  </div>
                ))
              : null}
          </div>
        </article>
      </section>

      {previewInvoice ? (
        <InvoicePreview
          invoice={previewInvoice}
          products={products}
          currencyCode={activeCurrencyCode}
          onClose={() => setPreviewInvoice(null)}
          onError={(msg) => setError(msg)}
        />
      ) : null}
    </div>
  );
}
