'use client'
// Lets a user ask the Vedaansh team to set up a paid plan by hand when online
// checkout fails or they pay from outside India. The team replies with a
// PayPal invoice / Wise / UPI details and activates the plan once paid.

import { useEffect, useRef, useState } from 'react'

type Plan = 'gold' | 'platinum'
type Interval = 'monthly' | 'yearly'
type Currency = 'INR' | 'USD'
type Method = 'paypal' | 'wise' | 'upi' | 'bank' | 'other'
export type PaymentHelpReason = 'checkout_failed' | 'international' | 'other'

const METHODS: Array<{ value: Method; label: string; hint: string }> = [
  { value: 'paypal', label: 'PayPal', hint: 'Invoice payable by PayPal or card' },
  { value: 'wise', label: 'Wise', hint: 'International bank transfer' },
  { value: 'upi', label: 'UPI', hint: 'India only' },
  { value: 'bank', label: 'Bank transfer', hint: 'NEFT / IMPS / SWIFT' },
  { value: 'other', label: 'Other', hint: 'Tell us in the message' },
]

export function PaymentHelpRequest({
  open,
  onClose,
  defaultPlan,
  defaultInterval,
  defaultCurrency,
  reason,
  failureNote,
}: {
  open: boolean
  onClose: () => void
  defaultPlan: Plan
  defaultInterval: Interval
  defaultCurrency: Currency
  reason: PaymentHelpReason
  failureNote?: string | null
}) {
  const [plan, setPlan] = useState<Plan>(defaultPlan)
  const [interval, setBillingInterval] = useState<Interval>(defaultInterval)
  const [currency, setCurrency] = useState<Currency>(defaultCurrency)
  const [method, setMethod] = useState<Method>(defaultCurrency === 'INR' ? 'upi' : 'paypal')
  const [country, setCountry] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [existing, setExisting] = useState<{ status: string; plan: string; createdAt: string } | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Reset to the plan the user clicked each time the form opens.
  useEffect(() => {
    if (!open) return
    setPlan(defaultPlan)
    setBillingInterval(defaultInterval)
    setCurrency(defaultCurrency)
    setMethod(defaultCurrency === 'INR' ? 'upi' : 'paypal')
    setError(null)
    setSent(false)
    fetch('/api/payment/request')
      .then(r => r.json())
      .then(json => setExisting(json.success ? json.request : null))
      .catch(() => setExisting(null))
    dialogRef.current?.focus()
  }, [open, defaultPlan, defaultInterval, defaultCurrency])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          interval,
          currency,
          method,
          country: country.trim(),
          message: message.trim(),
          reason,
          failureNote: (failureNote ?? '').slice(0, 300),
        }),
      })
      const json = await res.json().catch(() => ({ success: false, error: 'Could not send your request.' }))
      if (res.status === 401) {
        window.location.href = '/login?callbackUrl=%2Fpricing%3Fhelp%3D1'
        return
      }
      if (!json.success) throw new Error(json.error ?? 'Could not send your request.')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-help-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--surface-1)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: '1.5rem',
          fontFamily: 'var(--font-display)', outline: 'none',
          boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <h2 id="payment-help-title" style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
            {sent ? 'Request sent' : 'Get your plan set up by our team'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {sent ? (
          <div style={{ marginTop: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            <p style={{ margin: '0 0 0.75rem' }}>
              Thanks! The Vedaansh team will email you payment details, usually within 1–2 business days.
            </p>
            <p style={{ margin: '0 0 1.25rem' }}>
              Once your payment is confirmed we&apos;ll activate your plan and send a confirmation email.
              You don&apos;t need to pay anything until you hear from us.
            </p>
            <button type="button" className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: '0.85rem', marginTop: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {reason === 'checkout_failed'
                ? 'Sorry your payment didn’t go through. Tell us how you’d like to pay and we’ll send you an invoice or payment details.'
                : 'Paying from outside India, or prefer to pay another way? Tell us how and we’ll send you an invoice or payment details.'}
            </p>

            {existing && (
              <div style={{ fontSize: '0.8rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>
                You already have a request with our team ({existing.status}, sent {new Date(existing.createdAt).toLocaleDateString()}).
                Sending this form again updates it.
              </div>
            )}

            {failureNote && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Error you saw: <span style={{ color: 'var(--text-danger)' }}>{failureNote}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <Labeled label="Plan">
                <select value={plan} onChange={e => setPlan(e.target.value as Plan)} style={inputStyle}>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </Labeled>
              <Labeled label="Billing">
                <select value={interval} onChange={e => setBillingInterval(e.target.value as Interval)} style={inputStyle}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </Labeled>
              <Labeled label="Pay in">
                <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} style={inputStyle}>
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </Labeled>
              <Labeled label="Country">
                <input value={country} onChange={e => setCountry(e.target.value)} maxLength={60} placeholder="e.g. United States" style={inputStyle} />
              </Labeled>
            </div>

            <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
              <legend style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>How would you like to pay?</legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {METHODS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    aria-pressed={method === m.value}
                    title={m.hint}
                    style={{
                      padding: '0.4rem 0.8rem', borderRadius: 99, cursor: 'pointer',
                      fontFamily: 'var(--font-display)', fontSize: '0.8rem',
                      border: `1px solid ${method === m.value ? 'var(--gold)' : 'var(--border)'}`,
                      background: method === m.value ? 'rgba(201,168,76,0.12)' : 'transparent',
                      color: method === m.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: method === m.value ? 700 : 400,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {METHODS.find(m => m.value === method)?.hint}
              </span>
            </fieldset>

            <Labeled label="Message (optional)">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Anything we should know, e.g. your PayPal email if it differs from your account email"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Labeled>

            {error && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-danger)' }}>{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Sending…' : 'Send request to Vedaansh team'}
            </button>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              We&apos;ll reply to your account email. No payment is taken now.
            </p>
          </form>
        )}
      </div>
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  padding: '0.55rem 0.7rem',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-display)',
  fontSize: '0.85rem',
}
