'use client'

import { Link } from '@/i18n/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { AdminMessage } from '@/components/admin/AdminMessage'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'

type Plan = 'gold' | 'platinum'
type Interval = 'monthly' | 'yearly'
type Currency = 'INR' | 'USD'

type PaymentRequestRow = {
  _id: string
  userId: string
  email: string
  name: string
  plan: Plan
  interval: Interval
  currency: Currency
  country: string
  method: string
  reason: string
  message: string
  failureNote: string
  status: 'pending' | 'invoiced' | 'paid' | 'rejected'
  adminNote: string
  paidAmount: number | null
  paidCurrency: Currency | null
  transactionId: string
  resolvedBy: string
  resolvedAt: string | null
  createdAt: string
}

type PriceTable = {
  prices: Record<Plan, { monthly: number; yearly: number }>
  usdPrices: Record<Plan, { monthly: number; yearly: number }>
}

const METHOD_LABELS: Record<string, string> = {
  paypal: 'PayPal', wise: 'Wise', upi: 'UPI', bank: 'Bank transfer', other: 'Other',
}
const REASON_LABELS: Record<string, string> = {
  checkout_failed: 'Checkout failed', international: 'International', other: 'Other',
}
const STATUS_COLORS: Record<PaymentRequestRow['status'], string> = {
  pending: 'var(--gold)', invoiced: 'var(--accent)', paid: 'var(--teal)', rejected: 'var(--rose)',
}

export default function AdminPaymentRequestsPage() {
  const [data, setData] = useState<{ requests: PaymentRequestRow[]; openCount: number; pagination: any } | null>(null)
  const [prices, setPrices] = useState<PriceTable | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [status, setStatus] = useState('open')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (status) params.set('status', status)
      const res = await fetch(`/api/admin/payment-requests?${params}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load requests')
      setData({ requests: json.requests, openCount: json.openCount, pagination: json.pagination })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    fetch('/api/subscription/pricing')
      .then(r => r.json())
      .then(json => { if (json.success) setPrices({ prices: json.prices, usdPrices: json.usdPrices }) })
      .catch(() => {})
  }, [])

  async function patch(id: string, body: Record<string, unknown>, done: string) {
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/payment-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Update failed')
      setNotice(done)
      setPayingId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  function markInvoiced(r: PaymentRequestRow) {
    const note = window.prompt('Note (optional), e.g. "PayPal invoice sent 5 Nov":', '')
    if (note === null) return
    void patch(r._id, { action: 'invoiced', adminNote: note }, `Marked ${r.email} as invoiced.`)
  }

  function reject(r: PaymentRequestRow) {
    const note = window.prompt(`Close ${r.email}'s request without activating? Reason (optional):`, '')
    if (note === null) return
    void patch(r._id, { action: 'rejected', adminNote: note }, `Closed ${r.email}'s request.`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Payment Requests</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0', fontSize: '0.85rem', lineHeight: 1.6 }}>
          Users who asked the team to set up a plan by hand: failed checkouts and international payments.
          Send them a PayPal invoice, Wise or UPI details, then <strong>Mark paid</strong> to activate the plan.
          {data ? ` ${data.openCount} open.` : ''}
        </p>
      </div>

      <AdminMessage message={error} type="error" onDismiss={() => setError(null)} />
      <AdminMessage message={notice} type="success" onDismiss={() => setNotice(null)} />

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={inputStyle}>
          <option value="open">Open (pending + invoiced)</option>
          <option value="pending">Pending</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
        <button className="btn btn-secondary" onClick={() => void load()}>Refresh</button>
      </div>

      {loading && !data ? (
        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
          <VedaanshLoader message="Loading requests…" />
        </div>
      ) : !data?.requests.length ? (
        <div style={{ ...boxStyle, color: 'var(--text-muted)', textAlign: 'center' }}>No requests here.</div>
      ) : (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {data.requests.map(r => {
            const open = r.status === 'pending' || r.status === 'invoiced'
            return (
              <div key={r._id} style={boxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{r.name || 'Unnamed user'}</div>
                    <a href={`mailto:${r.email}`} style={{ fontSize: '0.8rem', color: 'var(--gold)', wordBreak: 'break-all' }}>{r.email}</a>
                    {' · '}
                    <Link href={`/admin/users/${r.userId}`} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>View user</Link>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: STATUS_COLORS[r.status], border: `1px solid ${STATUS_COLORS[r.status]}`,
                      borderRadius: 99, padding: '0.15rem 0.6rem',
                    }}>
                      {r.status}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginTop: '0.85rem', fontSize: '0.82rem' }}>
                  <Field label="Plan" value={`${cap(r.plan)} · ${r.interval}`} />
                  <Field label="Currency" value={r.currency} />
                  <Field label="Method" value={METHOD_LABELS[r.method] ?? r.method} />
                  <Field label="Country" value={r.country || '—'} />
                  <Field label="Reason" value={REASON_LABELS[r.reason] ?? r.reason} />
                  {prices && <Field label="List price" value={listPrice(prices, r.currency, r.plan, r.interval)} />}
                </div>
                {r.failureNote && <Note label="Checkout error" text={r.failureNote} />}
                {r.message && <Note label="Message" text={r.message} />}
                {r.adminNote && <Note label="Admin note" text={r.adminNote} />}
                {r.status === 'paid' && (
                  <Note
                    label="Paid"
                    text={`${r.paidCurrency} ${((r.paidAmount ?? 0) / 100).toFixed(2)} · txn ${r.transactionId} · by ${r.resolvedBy}${r.resolvedAt ? ` on ${new Date(r.resolvedAt).toLocaleDateString()}` : ''}`}
                  />
                )}

                {open && payingId !== r._id && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
                    <button className="btn btn-primary btn-sm" disabled={busyId === r._id} onClick={() => setPayingId(r._id)}>
                      Mark paid…
                    </button>
                    {r.status === 'pending' && (
                      <button className="btn btn-secondary btn-sm" disabled={busyId === r._id} onClick={() => markInvoiced(r)}>
                        Mark invoiced
                      </button>
                    )}
                    <button className="btn btn-secondary btn-sm" disabled={busyId === r._id} onClick={() => reject(r)}>
                      Reject
                    </button>
                  </div>
                )}

                {open && payingId === r._id && (
                  <MarkPaidForm
                    request={r}
                    prices={prices}
                    busy={busyId === r._id}
                    onCancel={() => setPayingId(null)}
                    onSubmit={body => void patch(r._id, { action: 'paid', ...body }, `Activated ${cap(body.plan)} for ${r.email}.`)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {data?.pagination && (
        <AdminPagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

function MarkPaidForm({ request, prices, busy, onCancel, onSubmit }: {
  request: PaymentRequestRow
  prices: PriceTable | null
  busy: boolean
  onCancel: () => void
  onSubmit: (body: { plan: Plan; interval: Interval; currency: Currency; amount: number; transactionId: string; adminNote: string }) => void
}) {
  const [plan, setPlan] = useState<Plan>(request.plan)
  const [interval, setBillingInterval] = useState<Interval>(request.interval)
  const [currency, setCurrency] = useState<Currency>(request.currency)
  const [amount, setAmount] = useState(() => (prices ? String(listAmount(prices, request.currency, request.plan, request.interval)) : ''))
  const [transactionId, setTransactionId] = useState('')
  const [adminNote, setAdminNote] = useState('')

  const valid = Number(amount) > 0 && transactionId.trim().length > 0

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    if (!window.confirm(`Activate ${cap(plan)} (${interval}) for ${request.email} after receiving ${currency} ${amount}?`)) return
    onSubmit({ plan, interval, currency, amount: Number(amount), transactionId: transactionId.trim(), adminNote: adminNote.trim() })
  }

  return (
    <form onSubmit={submit} style={{ marginTop: '0.9rem', borderTop: '1px solid var(--border-soft)', paddingTop: '0.9rem', display: 'grid', gap: '0.6rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Record the payment you received. The plan starts now, or after their current period if they are renewing the same plan.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
        <Labeled label="Plan">
          <select value={plan} onChange={e => setPlan(e.target.value as Plan)} style={inputStyle}>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </Labeled>
        <Labeled label="Interval">
          <select value={interval} onChange={e => setBillingInterval(e.target.value as Interval)} style={inputStyle}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </Labeled>
        <Labeled label="Currency received">
          <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} style={inputStyle}>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </Labeled>
        <Labeled label={`Amount (${currency})`}>
          <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
        </Labeled>
      </div>
      {prices && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          List price: {listPrice(prices, currency, plan, interval)}
        </div>
      )}
      <Labeled label="Transaction / invoice ID (PayPal, Wise, UPI ref)">
        <input value={transactionId} onChange={e => setTransactionId(e.target.value)} maxLength={120} style={inputStyle} />
      </Labeled>
      <Labeled label="Note (optional)">
        <input value={adminNote} onChange={e => setAdminNote(e.target.value)} maxLength={500} style={inputStyle} />
      </Labeled>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!valid || busy}>
          {busy ? 'Activating…' : 'Activate plan'}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  )
}

function listAmount(prices: PriceTable, currency: Currency, plan: Plan, interval: Interval): number {
  const table = currency === 'USD' ? prices.usdPrices : prices.prices
  return table?.[plan]?.[interval] ?? 0
}

function listPrice(prices: PriceTable, currency: Currency, plan: Plan, interval: Interval): string {
  const amount = listAmount(prices, currency, plan, interval)
  return amount ? `${currency === 'USD' ? '$' : '₹'}${amount}/${interval === 'monthly' ? 'mo' : 'yr'}` : '—'
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function Note({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', background: 'var(--surface-2)', borderRadius: 8, padding: '0.5rem 0.7rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}: </span>{text}
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '0.25rem' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
      {children}
    </label>
  )
}

const boxStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  padding: '1.1rem',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  color: 'var(--text-primary)',
  width: '100%',
}
