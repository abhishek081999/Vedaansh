'use client'
// Lets a user ask the Vedaansh team to set up a paid plan by hand when online
// checkout fails or they pay from outside India. The team replies with a
// PayPal invoice / Wise / UPI details and activates the plan once paid.

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

type Plan = 'gold' | 'platinum'
type Interval = 'monthly' | 'yearly'
type Currency = 'INR' | 'USD'
type Method = 'paypal' | 'wise' | 'upi' | 'bank' | 'other'
export type PaymentHelpReason = 'checkout_failed' | 'international' | 'other'

const METHOD_VALUES: Method[] = ['paypal', 'wise', 'upi', 'bank', 'other']

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
  const t = useTranslations('pricing.help')
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
      const json = await res.json().catch(() => ({ success: false, error: t('sendFailed') }))
      if (res.status === 401) {
        window.location.href = '/login?callbackUrl=%2Fpricing%3Fhelp%3D1'
        return
      }
      if (!json.success) throw new Error(json.error ?? t('sendFailed'))
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sendFailed'))
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
            {sent ? t('titleSent') : t('title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {sent ? (
          <div style={{ marginTop: '1rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            <p style={{ margin: '0 0 0.75rem' }}>
              {t('thanks')}
            </p>
            <p style={{ margin: '0 0 1.25rem' }}>
              {t('activation')}
            </p>
            <button type="button" className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>{t('done')}</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: '0.85rem', marginTop: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {reason === 'checkout_failed' ? t('introFailed') : t('introOther')}
            </p>

            {existing && (
              <div style={{ fontSize: '0.8rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>
                {t('existing', {
                  status: existing.status,
                  date: new Date(existing.createdAt).toLocaleDateString(),
                })}
              </div>
            )}

            {failureNote && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {t('errorSeen')}{' '}
                <span style={{ color: 'var(--text-danger)' }}>{failureNote}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <Labeled label={t('plan')}>
                <select value={plan} onChange={e => setPlan(e.target.value as Plan)} style={inputStyle}>
                  <option value="gold">{t('plans.gold')}</option>
                  <option value="platinum">{t('plans.platinum')}</option>
                </select>
              </Labeled>
              <Labeled label={t('billing')}>
                <select value={interval} onChange={e => setBillingInterval(e.target.value as Interval)} style={inputStyle}>
                  <option value="monthly">{t('monthly')}</option>
                  <option value="yearly">{t('yearly')}</option>
                </select>
              </Labeled>
              <Labeled label={t('payIn')}>
                <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} style={inputStyle}>
                  <option value="USD">{t('usd')}</option>
                  <option value="INR">{t('inr')}</option>
                </select>
              </Labeled>
              <Labeled label={t('country')}>
                <input value={country} onChange={e => setCountry(e.target.value)} maxLength={60} placeholder={t('countryPlaceholder')} style={inputStyle} />
              </Labeled>
            </div>

            <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
              <legend style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{t('methodLegend')}</legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {METHOD_VALUES.map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMethod(value)}
                    aria-pressed={method === value}
                    title={t(`methods.${value}.hint`)}
                    style={{
                      padding: '0.4rem 0.8rem', borderRadius: 99, cursor: 'pointer',
                      fontFamily: 'var(--font-display)', fontSize: '0.8rem',
                      border: `1px solid ${method === value ? 'var(--gold)' : 'var(--border)'}`,
                      background: method === value ? 'rgba(201,168,76,0.12)' : 'transparent',
                      color: method === value ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: method === value ? 700 : 400,
                    }}
                  >
                    {t(`methods.${value}.label`)}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {t(`methods.${method}.hint`)}
              </span>
            </fieldset>

            <Labeled label={t('message')}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={t('messagePlaceholder')}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Labeled>

            {error && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-danger)' }}>{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? t('submitting') : t('submit')}
            </button>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              {t('replyNote')}
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
