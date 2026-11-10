'use client'
// src/app/pricing/page.tsx — Subscription tiers
import { Link } from '@/i18n/navigation'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PLAN_PRICES, PLAN_PRICES_USD, type PaymentCurrency } from '@/lib/subscription/pricing'
import { PaymentHelpRequest, type PaymentHelpReason } from '@/components/pricing/PaymentHelpRequest'

let razorpayLoadPromise: Promise<void> | null = null

const CURRENCY_STORAGE_KEY = 'vedaansh:pricing-currency'

type PlanKey = 'free' | 'gold' | 'platinum'
type PaidPlan = 'gold' | 'platinum'

type PlanCopy = {
  name: string
  subtitle: string
  badge?: string
  features: string[]
}

/** Visitors whose browser is on Indian time see INR; everyone else sees USD. */
function guessCurrency(): PaymentCurrency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    return tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta' ? 'INR' : 'USD'
  } catch {
    return 'INR'
  }
}

function readSavedCurrency(): PaymentCurrency | null {
  try {
    const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY)
    return saved === 'INR' || saved === 'USD' ? saved : null
  } catch {
    return null
  }
}

function saveCurrency(currency: PaymentCurrency) {
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency)
  } catch {
    // Storage blocked: the choice just isn't remembered.
  }
}

/** Amount text without the symbol. INR shows whole rupees; USD keeps cents when there are any. */
function amountText(minor: number, currency: PaymentCurrency): string {
  if (currency === 'INR') return String(Math.round(minor / 100))
  const cents = Math.round(minor)
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

/** Visual tokens only — display copy comes from the pricing catalogue. */
const TIER_STYLE: Record<PlanKey, { color: string; border: string; bg: string }> = {
  free: {
    color: 'var(--text-gold)',
    border: 'rgba(201,168,76,0.40)',
    bg: 'rgba(201,168,76,0.06)',
  },
  gold: {
    color: 'var(--accent)',
    border: 'rgba(139,124,246,0.50)',
    bg: 'rgba(139,124,246,0.08)',
  },
  platinum: {
    color: 'var(--teal)',
    border: 'rgba(78,205,196,0.50)',
    bg: 'rgba(78,205,196,0.08)',
  },
}

const PLAN_KEYS: PlanKey[] = ['free', 'gold', 'platinum']

export default function PricingPage() {
  const t = useTranslations('pricing')
  const { data: session } = useSession()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)  // plan key being loaded
  const [checkoutError,  setCheckoutError]  = useState<string | null>(null)
  const [failedPlan, setFailedPlan] = useState<PaidPlan | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    description: string
    discounts: Record<string, { valid: boolean; discountPaise: number; finalAmountPaise: number }>
  } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [runtimePrices, setRuntimePrices] = useState<{
    gold: { monthlyPaise: number; yearlyPaise: number }
    platinum: { monthlyPaise: number; yearlyPaise: number }
  }>(PLAN_PRICES)
  const [runtimeUsdPrices, setRuntimeUsdPrices] = useState<{
    gold: { monthlyCents: number; yearlyCents: number }
    platinum: { monthlyCents: number; yearlyCents: number }
  }>(PLAN_PRICES_USD)
  const [internationalEnabled, setInternationalEnabled] = useState(false)
  const [currency, setCurrency] = useState<PaymentCurrency>('INR')
  const [help, setHelp] = useState<{
    open: boolean
    plan: PaidPlan
    reason: PaymentHelpReason
    failureNote: string | null
  }>({ open: false, plan: 'gold', reason: 'international', failureNote: null })
  // Set while the Razorpay modal is open if a payment attempt fails inside it.
  const paymentFailureRef = useRef<string | null>(null)

  const faqItems = t.raw('faq.items') as Array<{ q: string; a: string }>

  function openHelp(plan: PaidPlan, reason: PaymentHelpReason, failureNote: string | null = null) {
    if (!session) {
      window.location.href = '/login?callbackUrl=%2Fpricing%3Fhelp%3D1'
      return
    }
    setHelp({ open: true, plan, reason, failureNote })
  }
  const symbol = currency === 'USD' ? '$' : '₹'

  function planMinor(plan: PaidPlan, interval: 'monthly' | 'yearly'): number {
    if (currency === 'USD') {
      return runtimeUsdPrices[plan][interval === 'monthly' ? 'monthlyCents' : 'yearlyCents']
    }
    return runtimePrices[plan][interval === 'monthly' ? 'monthlyPaise' : 'yearlyPaise']
  }

  function chooseCurrency(next: PaymentCurrency) {
    setCurrency(next)
    saveCurrency(next)
  }

  const currentPlan = (session?.user as { plan?: string } | undefined)?.plan ?? 'free'
  const PLAN_RANK: Record<string, number> = { free: 0, gold: 1, platinum: 2 }

  // /pricing?help=1 (e.g. after signing in from the help link) opens the request form.
  useEffect(() => {
    if (!session) return
    try {
      if (new URLSearchParams(window.location.search).get('help') === '1') {
        setHelp(h => ({ ...h, open: true }))
      }
    } catch {
      // ignore
    }
  }, [session])

  useEffect(() => {
    // Warm up SDK after first render so checkout opens faster and more reliably.
    void ensureRazorpayScript(t('errors.razorpayLoad'))

    fetch('/api/subscription/pricing')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.prices) {
          setRuntimePrices(json.prices)
        }
        if (json.success && json.usdPrices?.gold?.monthlyCents) {
          setRuntimeUsdPrices(json.usdPrices)
        }
        if (json.success && json.internationalEnabled) {
          setInternationalEnabled(true)
          setCurrency(readSavedCurrency() ?? guessCurrency())
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps -- warm SDK once; locale message is fine if stale briefly
  }, [])

  async function applyCoupon() {
    const code = couponCode.trim()
    if (!code) {
      setCouponMessage({ type: 'error', text: t('coupon.enterFirst') })
      return
    }

    setCouponLoading(true)
    setCouponMessage(null)

    try {
      const res = await fetch('/api/subscription/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code, interval: billing, currency }),
      })
      const data = await res.json().catch(() => ({ success: false, error: t('coupon.validateFailed') }))
      if (!data.success) {
        setAppliedCoupon(null)
        setCouponMessage({ type: 'error', text: data.error ?? t('coupon.invalid') })
        return
      }

      setAppliedCoupon({
        code: data.coupon.code,
        description: data.coupon.description,
        discounts: data.discounts,
      })
      setCouponCode(data.coupon.code)
      setCouponMessage({ type: 'success', text: t('coupon.applied', { code: data.coupon.code }) })
    } catch {
      setCouponMessage({ type: 'error', text: t('coupon.validateRetry') })
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponMessage(null)
  }

  useEffect(() => {
    if (!appliedCoupon) return
    const code = appliedCoupon.code
    setAppliedCoupon(null)
    setCouponMessage(null)
    if (!code) return

    void (async () => {
      setCouponLoading(true)
      try {
        const res = await fetch('/api/subscription/coupon/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ couponCode: code, interval: billing, currency }),
        })
        const data = await res.json()
        if (data.success) {
          setAppliedCoupon({
            code: data.coupon.code,
            description: data.coupon.description,
            discounts: data.discounts,
          })
          setCouponMessage({ type: 'success', text: t('coupon.applied', { code: data.coupon.code }) })
        }
      } finally {
        setCouponLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billing, currency])

  // ── Razorpay checkout ────────────────────────────────────────
  async function handleSubscribe(planKey: PaidPlan) {
    if (!session) {
      window.location.href = '/login?callbackUrl=/pricing'
      return
    }
    setCheckoutLoading(planKey)
    setCheckoutError(null)
    setFailedPlan(null)
    paymentFailureRef.current = null

    try {
      // 1. Create order on server
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planKey,
          interval: billing,
          currency,
          couponCode: appliedCoupon?.code || couponCode.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? t('errors.orderFailed'))

      // 2. Load Razorpay script if not already present
      await ensureRazorpayScript(t('errors.razorpayLoad'))

      // 3. Open Razorpay modal
      const rzp = new (window as unknown as { Razorpay: new (opts: object) => { on: (e: string, cb: (r: unknown) => void) => void; open: () => void } }).Razorpay({
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.orderId,
        name:        'Vedaansh',
        description: t('checkout.description', {
          plan: t(`plans.${planKey}.name`),
          billing: t(`billing.${billing}`),
        }),
        prefill: {
          name:  data.userName,
          email: data.userEmail,
        },
        theme: { color: planKey === 'gold' ? '#8B7CF6' : '#4ECDC4' },
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          // 4. Verify payment signature + activate subscription via webhook
          //    (webhook handles plan upgrade asynchronously)
          //    Show a success message immediately on payment capture
          await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId:  response.razorpay_payment_id,
              orderId:    response.razorpay_order_id,
              signature:  response.razorpay_signature,
              plan:       planKey,
              interval:   billing,
            }),
          })
          window.location.href = '/account?upgraded=1'
        },
        modal: {
          ondismiss: () => {
            setCheckoutLoading(null)
            // The user closed the modal after a failed attempt: offer the team's help.
            if (paymentFailureRef.current) {
              setCheckoutError(paymentFailureRef.current)
              setFailedPlan(planKey)
            }
          },
        },
      })
      rzp.on('payment.failed', (response: unknown) => {
        const err = response as { error?: { description?: string; reason?: string } }
        paymentFailureRef.current = err?.error?.description || t('errors.paymentIncomplete')
      })
      rzp.open()

    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : t('errors.paymentFailed'))
      setFailedPlan(planKey)
      setCheckoutLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      {/* Header */}
      <header className="pricing-header">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <Image src="/veda-icon.png" alt="Vedaansh" width={24} height={24} style={{ objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-gold)' }}>Vedaansh</span>
        </Link>
        <div className="pricing-header-actions">
          {session ? (
            <Link href="/account" style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              {t('header.myAccount')}
            </Link>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">{t('header.signIn')}</Link>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main style={{ 
        flex: 1, 
        maxWidth: 1100, 
        width: '100%', 
        margin: '0 auto', 
        padding: 'clamp(1rem,4vw,2rem)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'clamp(1.25rem, 4vw, 2.25rem)', 
        alignItems: 'center' 
      }}>

        {/* Hero & Icon - Combined for compactness */}
        <div style={{ textAlign: 'center', maxWidth: 700, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Image src="/veda-icon.png" alt="Vedaansh" width={54} height={54} style={{ objectFit: 'contain', opacity: 0.8, marginBottom: '0.75rem' }} />
          
          <div style={{ 
            fontSize: '0.65rem', 
            fontWeight: 800, 
            letterSpacing: '0.2em', 
            textTransform: 'uppercase', 
            color: 'var(--text-gold)', 
            fontFamily: 'var(--font-display)', 
            marginBottom: '0.4rem',
            opacity: 0.9
          }}>
            {t('hero.kicker')}
          </div>
          
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: 'clamp(1.6rem,5vw,2.4rem)', 
            fontWeight: 800, 
            color: 'var(--text-primary)', 
            lineHeight: 1.05, 
            margin: '0 0 0.6rem 0',
            letterSpacing: '-0.02em'
          }}>
            {t('hero.title')}{' '}
            <span style={{ color: 'var(--text-gold)' }}>{t('hero.titleHighlight')}</span>
          </h1>
          
          <p style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '0.92rem', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.45, 
            margin: 0,
            maxWidth: '480px'
          }}>
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--surface-2)', padding: '0.3rem', borderRadius: 99, border: '1px solid var(--border)' }}>
          {(['monthly', 'yearly'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: '0.4rem 1.25rem', borderRadius: 99, cursor: 'pointer', border: 'none',
              fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: billing === b ? 700 : 400,
              background: billing === b ? 'var(--surface-1)' : 'transparent',
              color: billing === b ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: billing === b ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.15s',
            }}>
              {t(`billing.${b}`)}
              {b === 'yearly' && (
                <span style={{ marginLeft: 6, fontSize: '0.68rem', color: 'var(--teal)', fontWeight: 700 }}>{t('billing.bestValue')}</span>
              )}
            </button>
          ))}
        </div>

        {internationalEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', marginTop: '-0.5rem' }}>
            <div role="group" aria-label={t('currency.ariaLabel')} style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 99, border: '1px solid var(--border)' }}>
              {(['INR', 'USD'] as const).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => chooseCurrency(c)}
                  aria-pressed={currency === c}
                  style={{
                    padding: '0.3rem 0.9rem', borderRadius: 99, cursor: 'pointer', border: 'none',
                    fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: currency === c ? 700 : 400,
                    background: currency === c ? 'var(--surface-1)' : 'transparent',
                    color: currency === c ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: currency === c ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  {c === 'INR' ? t('currency.inr') : t('currency.usd')}
                </button>
              ))}
            </div>
            {currency === 'USD' && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                {t('currency.usdHint')}
              </span>
            )}
          </div>
        )}

        <div style={{ width: '100%', maxWidth: 480, display: 'grid', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase())
                if (appliedCoupon) setAppliedCoupon(null)
                setCouponMessage(null)
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') void applyCoupon() }}
              placeholder={t('coupon.placeholder')}
              disabled={couponLoading}
              style={{
                flex: 1,
                border: `1px solid ${appliedCoupon ? 'var(--teal)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                background: 'var(--surface-1)',
                color: 'var(--text-primary)',
                padding: '0.7rem 0.9rem',
                fontFamily: 'var(--font-display)',
                fontSize: '0.85rem',
              }}
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={removeCoupon}
                style={{
                  padding: '0.7rem 1rem',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('coupon.remove')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void applyCoupon()}
                disabled={couponLoading || !couponCode.trim()}
                style={{
                  padding: '0.7rem 1.1rem',
                  borderRadius: 'var(--r-md)',
                  border: 'none',
                  background: 'var(--text-gold)',
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: couponLoading || !couponCode.trim() ? 'not-allowed' : 'pointer',
                  opacity: couponLoading || !couponCode.trim() ? 0.65 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {couponLoading ? t('coupon.applying') : t('coupon.apply')}
              </button>
            )}
          </div>
          {couponMessage && (
            <p style={{
              margin: 0,
              fontSize: '0.78rem',
              fontFamily: 'var(--font-display)',
              color: couponMessage.type === 'success' ? 'var(--teal)' : 'var(--text-danger)',
            }}>
              {couponMessage.text}
            </p>
          )}
          {appliedCoupon?.description && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              {appliedCoupon.description}
            </p>
          )}
        </div>

        {/* Tier cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', width: '100%' }}>
          {PLAN_KEYS.map((key) => {
            const tier = TIER_STYLE[key]
            const { name, subtitle, badge, features } = t.raw(`plans.${key}`) as PlanCopy
            const isCurrent = currentPlan === key
            const paidKey = key === 'gold' || key === 'platinum' ? key : null
            // All amounts in the smallest unit of `currency` (paise or cents).
            const monthlyMinor = paidKey ? planMinor(paidKey, 'monthly') : 0
            const yearlyMinor = paidKey ? planMinor(paidKey, 'yearly') : 0
            const price = billing === 'yearly' ? yearlyMinor : monthlyMinor
            const isGold = key === 'gold'
            const planDiscount = paidKey && appliedCoupon?.discounts[paidKey]?.valid
              ? appliedCoupon.discounts[paidKey]
              : null
            const originalMonthlyMinor = billing === 'yearly' ? yearlyMinor / 12 : monthlyMinor
            const displayMonthlyMinor = planDiscount
              ? planDiscount.finalAmountPaise / (billing === 'yearly' ? 12 : 1)
              : originalMonthlyMinor
            const fmt = (minor: number) => `${symbol}${amountText(minor, currency)}`

            return (
              <div key={key} style={{
                background: isGold ? 'var(--surface-1)' : 'var(--surface-1)',
                border: `1px solid ${isGold ? tier.border : 'var(--border)'}`,
                borderTop: `3px solid ${tier.color}`,
                borderRadius: 'var(--r-lg)',
                padding: '1.75rem',
                display: 'flex', flexDirection: 'column', gap: '1.25rem',
                position: 'relative',
                boxShadow: isGold ? '0 4px 24px rgba(139,124,246,0.12)' : 'none',
              }}>
                {/* Popular badge */}
                {badge && (
                  <div style={{
                    position: 'absolute', top: -1, right: 20,
                    padding: '0.2rem 0.75rem',
                    background: tier.color, color: '#fff',
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', fontFamily: 'var(--font-display)',
                    borderRadius: '0 0 var(--r-sm) var(--r-sm)',
                  }}>
                    {badge}
                  </div>
                )}

                {/* Plan name */}
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: tier.color, marginBottom: 2 }}>
                    {name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                    {subtitle}
                  </div>
                </div>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', minHeight: '3.5rem', flexWrap: 'wrap' }}>
                  {price === 0 ? (
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t('price.free')}
                    </span>
                  ) : (
                    <>
                      {planDiscount && (
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginRight: '0.25rem' }}>
                          {fmt(originalMonthlyMinor)}
                        </span>
                      )}
                      <span style={{ fontSize: '1rem', color: 'var(--text-muted)', alignSelf: 'flex-start', marginTop: 8 }}>{symbol}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 700, color: planDiscount ? 'var(--teal)' : 'var(--text-primary)' }}>
                        {amountText(displayMonthlyMinor, currency)}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                        {t('price.perMonth')}
                      </span>
                    </>
                  )}
                </div>
                {planDiscount && price > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--teal)', fontFamily: 'var(--font-display)', marginTop: -8 }}>
                    {t('price.couponSave', {
                      amount: fmt(planDiscount.discountPaise),
                      period: billing === 'yearly' ? t('price.perYear') : t('price.perMonth'),
                    })}
                  </div>
                )}
                {billing === 'yearly' && price > 0 && !planDiscount && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--teal)', fontFamily: 'var(--font-display)', marginTop: -8 }}>
                    {key === 'platinum' || monthlyMinor * 12 <= yearlyMinor
                      ? t('price.yearlyBilled', { yearly: fmt(yearlyMinor), monthly: fmt(yearlyMinor / 12) })
                      : t('price.yearlySave', { yearly: fmt(yearlyMinor), amount: fmt(monthlyMinor * 12 - yearlyMinor) })}
                  </div>
                )}

                {/* CTA */}
                {isCurrent ? (
                  <div style={{
                    padding: '0.6rem 1rem', textAlign: 'center',
                    background: tier.bg, border: `1px solid ${tier.border}`,
                    borderRadius: 'var(--r-md)',
                    fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                    fontWeight: 600, color: tier.color,
                  }}>
                    {t('cta.currentPlan')}
                  </div>
                ) : price === 0 ? (
                  <Link href="/" style={{
                    display: 'block', padding: '0.65rem 1rem', textAlign: 'center',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)', textDecoration: 'none',
                    fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                    fontWeight: 600, color: 'var(--text-secondary)',
                  }}>
                    {t('cta.getStarted')}
                  </Link>
                ) : PLAN_RANK[currentPlan] > PLAN_RANK[key] ? (
                  <div style={{
                    padding: '0.6rem 1rem', textAlign: 'center',
                    background: 'var(--surface-3)', border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--r-md)',
                    fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                    fontWeight: 600, color: 'var(--text-muted)',
                  }}>
                    {t('cta.included')}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleSubscribe(key as PaidPlan)}
                      disabled={checkoutLoading === key}
                      style={{
                        display: 'block', width: '100%', padding: '0.65rem 1rem',
                        textAlign: 'center', background: tier.color,
                        borderRadius: 'var(--r-md)', textDecoration: 'none',
                        fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                        fontWeight: 700, color: '#fff', border: 'none',
                        cursor: checkoutLoading === key ? 'not-allowed' : 'pointer',
                        opacity: checkoutLoading === key ? 0.75 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {checkoutLoading === key
                        ? t('cta.openingCheckout')
                        : t('cta.upgrade', { name })}
                    </button>
                    {checkoutError && checkoutLoading === null && failedPlan === key && (
                      <div style={{
                        marginTop: '0.5rem', padding: '0.7rem 0.8rem', textAlign: 'center',
                        border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)',
                      }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-danger)', margin: '0 0 0.5rem' }}>
                          {checkoutError}
                        </p>
                        <button
                          type="button"
                          onClick={() => openHelp(key as PaidPlan, 'checkout_failed', checkoutError)}
                          style={{
                            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                            fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700,
                            color: 'var(--text-gold)', textDecoration: 'underline',
                          }}
                        >
                          {t('cta.paymentHelp')}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-soft)', paddingTop: '1rem' }}>
                  {features.map((f, i) => (
                    <div key={i} style={{
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-display)',
                      color: f.startsWith('—') ? 'var(--text-muted)' : 'var(--text-secondary)',
                      display: 'flex', gap: '0.35rem', alignItems: 'flex-start',
                    }}>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Manual payment help */}
        <div style={{
          width: '100%', maxWidth: 680, padding: '1.1rem 1.25rem',
          border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', minWidth: 0, flex: '1 1 260px' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {t('cta.manualTitle')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>
              {t('cta.manualBody')}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => openHelp(failedPlan ?? 'gold', failedPlan ? 'checkout_failed' : 'international', failedPlan ? checkoutError : null)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {t('cta.requestHelp')}
          </button>
        </div>

        {/* Trust signals */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '🔒', text: currency === 'USD' ? t('trust.secureUsd') : t('trust.secureInr') },
            { icon: <Image src="/veda-icon.png" alt="" width={16} height={16} style={{ objectFit: 'contain' }} />, text: t('trust.ephemeris') },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              <span>{icon}</span> {text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ width: '100%', maxWidth: 680 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '1.5rem' }}>
            {t('faq.title')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {faqItems.map(({ q, a }, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '0.9rem 1.1rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--surface-1)', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontSize: '0.88rem',
                    fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left',
                  }}
                >
                  {q}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0, marginLeft: 8 }}>
                    {openFaq === i ? '▲' : '▼'}
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{
                    padding: '0.9rem 1.1rem',
                    background: 'var(--surface-2)',
                    fontFamily: 'var(--font-display)', fontSize: '0.84rem',
                    color: 'var(--text-secondary)', lineHeight: 1.65,
                    borderTop: '1px solid var(--border-soft)',
                  }}>
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: 'center', padding: '2rem',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.07), rgba(139,124,246,0.07))',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', maxWidth: 540, width: '100%',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {t('bottom.title')}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
            {t('bottom.subtitle')}
          </div>
          <Link href="/" className="btn btn-primary" style={{ padding: '0.65rem 2rem' }}>
            {t('bottom.cta')}
          </Link>
        </div>

      </main>

      <PaymentHelpRequest
        open={help.open}
        onClose={() => setHelp(h => ({ ...h, open: false }))}
        defaultPlan={help.plan}
        defaultInterval={billing}
        defaultCurrency={currency === 'INR' && !internationalEnabled && guessCurrency() === 'USD' ? 'USD' : currency}
        reason={help.reason}
        failureNote={help.failureNote}
      />

      <footer style={{ padding: '1.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ marginBottom: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('footer.terms')}</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('footer.privacy')}</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/refund" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('footer.refunds')}</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/support" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('footer.support')}</Link>
        </div>
        Vedaansh · <span style={{ color: 'var(--text-gold)' }}>{t('footer.tagline')}</span> · {currency === 'USD' ? t('footer.pricesUsd') : t('footer.pricesInr')}
      </footer>
    </div>
  )
}

function ensureRazorpayScript(loadErrorMessage: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve()
  if (razorpayLoadPromise) return razorpayLoadPromise

  razorpayLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="1"]')
    if (existingScript) {
      const done = () => {
        existingScript.removeEventListener('load', done)
        existingScript.removeEventListener('error', fail)
        if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
          resolve()
          return
        }
        razorpayLoadPromise = null
        reject(new Error(loadErrorMessage))
      }
      const fail = () => {
        existingScript.removeEventListener('load', done)
        existingScript.removeEventListener('error', fail)
        razorpayLoadPromise = null
        reject(new Error(loadErrorMessage))
      }

      existingScript.addEventListener('load', done, { once: true })
      existingScript.addEventListener('error', fail, { once: true })

      // If script has already finished loading, resolve immediately.
      if ((existingScript as HTMLScriptElement & { readyState?: string }).readyState === 'complete' || (window as unknown as { Razorpay?: unknown }).Razorpay) {
        done()
      }
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.setAttribute('data-razorpay-checkout', '1')
    script.onload = () => {
      if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
        resolve()
        return
      }
      razorpayLoadPromise = null
      reject(new Error(loadErrorMessage))
    }
    script.onerror = () => {
      razorpayLoadPromise = null
      script.remove()
      reject(new Error(loadErrorMessage))
    }
    document.head.appendChild(script)
  })

  return razorpayLoadPromise
}
