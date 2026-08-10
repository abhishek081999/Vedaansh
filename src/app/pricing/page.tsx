'use client'
// src/app/pricing/page.tsx — Subscription tiers
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PLAN_PRICES } from '@/lib/subscription/pricing'
import { PRICING_FAQ } from '@/lib/seo/intro-content'

let razorpayLoadPromise: Promise<void> | null = null

const FEATURES = {
  free: {
    name: 'Free',
    subtitle: 'Free forever',
    price: { monthly: 0, yearly: 0 },
    color: 'var(--text-gold)',
    border: 'rgba(201,168,76,0.40)',
    bg: 'rgba(201,168,76,0.06)',
    badge: null,
    features: [
      '✓ Unlimited chart calculations',
      '✓ Shodashavarga (16 divisional charts)',
      '✓ Vimshottari (L4) & Yogini Dashas (L3)',
      '✓ Shadbala, Vimsopaka & Bhava Bala',
      '✓ Ashtakavarga, Arudhas & Chara Karakas',
      '✓ 100+ Graha Yogas detected',
      '✓ Daily Panchang & Muhurta tools',
      '✓ Relationship Compatibility (Ashtakoot)',
      '✓ Solar Return (Tajika/Varshaphal)',
      '✓ Interpretation Layer: Key Insights',
      '✓ KP System (Cusps & Significators)',
      '✓ Save up to 20 charts in library',
    ],
  },
  gold: {
    name: 'Gold',
    subtitle: 'For serious students',
    price: { 
      monthly: PLAN_PRICES.gold.monthly, 
      yearly: PLAN_PRICES.gold.yearly 
    },
    color: 'var(--accent)',
    border: 'rgba(139,124,246,0.50)',
    bg: 'rgba(139,124,246,0.08)',
    badge: 'Most Popular',
    features: [
      '✓ Everything in Free',
      '✓ Ashtottari & Chara (Jaimini) Dashas',
      '✓ Extended Vimshottari Depth (L6)',
      '✓ Professional PDF & HTML exports',
      '✓ Bulk Data Import (CSV/JSON)',
      '✓ Save up to 200 charts in library',
      '✓ Muhurta advanced routes & API',
    ],
  },
  platinum: {
    name: 'Platinum',
    subtitle: 'For professionals',
    price: { 
      monthly: PLAN_PRICES.platinum.monthly, 
      yearly: PLAN_PRICES.platinum.yearly 
    },
    color: 'var(--teal)',
    border: 'rgba(78,205,196,0.50)',
    bg: 'rgba(78,205,196,0.08)',
    badge: 'Premium',
    features: [
      '✓ Everything in Gold',
      '✓ Full 41 Varga Suite (All Divisions)',
      '✓ White-labeling: Custom brand & logo',
      '✓ Email chart reports to clients',
      '✓ Unlimited chart library',
      '✓ Client Management Dashboard',
      '✓ Bulk ZIP export for collections',
      '✓ Research routes and API access',
    ],
  },
}

const FAQ = [...PRICING_FAQ]

export default function PricingPage() {
  const { data: session } = useSession()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)  // plan key being loaded
  const [checkoutError,  setCheckoutError]  = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    description: string
    discounts: Record<string, { valid: boolean; discountPaise: number; finalAmountPaise: number }>
  } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [runtimePrices, setRuntimePrices] = useState(PLAN_PRICES)

  const currentPlan = (session?.user as any)?.plan ?? 'free'
  const PLAN_RANK: Record<string, number> = { free: 0, gold: 1, platinum: 2 }

  useEffect(() => {
    // Warm up SDK after first render so checkout opens faster and more reliably.
    void ensureRazorpayScript()

    fetch('/api/subscription/pricing')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.prices) {
          setRuntimePrices(json.prices)
        }
      })
      .catch(() => {})
  }, [])

  async function applyCoupon() {
    const code = couponCode.trim()
    if (!code) {
      setCouponMessage({ type: 'error', text: 'Enter a coupon code first.' })
      return
    }

    setCouponLoading(true)
    setCouponMessage(null)

    try {
      const res = await fetch('/api/subscription/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code, interval: billing }),
      })
      const data = await res.json().catch(() => ({ success: false, error: 'Could not validate coupon.' }))
      if (!data.success) {
        setAppliedCoupon(null)
        setCouponMessage({ type: 'error', text: data.error ?? 'Invalid coupon code' })
        return
      }

      setAppliedCoupon({
        code: data.coupon.code,
        description: data.coupon.description,
        discounts: data.discounts,
      })
      setCouponCode(data.coupon.code)
      setCouponMessage({ type: 'success', text: `Coupon "${data.coupon.code}" applied.` })
    } catch {
      setCouponMessage({ type: 'error', text: 'Could not validate coupon. Try again.' })
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
          body: JSON.stringify({ couponCode: code, interval: billing }),
        })
        const data = await res.json()
        if (data.success) {
          setAppliedCoupon({
            code: data.coupon.code,
            description: data.coupon.description,
            discounts: data.discounts,
          })
          setCouponMessage({ type: 'success', text: `Coupon "${data.coupon.code}" applied.` })
        }
      } finally {
        setCouponLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billing])

  // ── Razorpay checkout ────────────────────────────────────────
  async function handleSubscribe(planKey: 'gold' | 'platinum') {
    if (!session) {
      window.location.href = '/login?callbackUrl=/pricing'
      return
    }
    setCheckoutLoading(planKey)
    setCheckoutError(null)

    try {
      // 1. Create order on server
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planKey,
          interval: billing,
          couponCode: appliedCoupon?.code || couponCode.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Order creation failed')

      // 2. Load Razorpay script if not already present
      await ensureRazorpayScript()

      // 3. Open Razorpay modal
      const rzp = new (window as any).Razorpay({
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.orderId,
        name:        'Vedaansh',
        description: `${data.planLabel} — ${billing} subscription`,
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
          ondismiss: () => setCheckoutLoading(null),
        },
      })
      rzp.open()

    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
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
              My Account
            </Link>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">Sign In</Link>
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
            Simple, transparent pricing
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
            Professional Jyotisha. <span style={{ color: 'var(--text-gold)' }}>Free to start.</span>
          </h1>
          
          <p style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '0.92rem', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.45, 
            margin: 0,
            maxWidth: '480px'
          }}>
            Swiss Ephemeris precision for every chart. All core features free forever.
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
              {b === 'monthly' ? 'Monthly' : 'Yearly'}
              {b === 'yearly' && (
                <span style={{ marginLeft: 6, fontSize: '0.68rem', color: 'var(--teal)', fontWeight: 700 }}>Best value</span>
              )}
            </button>
          ))}
        </div>

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
              placeholder="Have a coupon? Enter code"
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
                Remove
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
                {couponLoading ? 'Applying…' : 'Apply'}
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
          {(Object.entries(FEATURES) as [string, typeof FEATURES.free][]).map(([key, tier]) => {
            const isCurrent = currentPlan === key
            const dynamicPrice = key === 'gold'
              ? runtimePrices.gold
              : key === 'platinum'
                ? runtimePrices.platinum
                : tier.price
            const price = dynamicPrice[billing as 'monthly' | 'yearly']
            const isGold = key === 'gold'
            const planDiscount = (key === 'gold' || key === 'platinum') && appliedCoupon?.discounts[key]?.valid
              ? appliedCoupon.discounts[key]
              : null
            const displayMonthly = planDiscount
              ? Math.round((planDiscount.finalAmountPaise / 100) / (billing === 'yearly' ? 12 : 1))
              : billing === 'yearly'
                ? Math.round(dynamicPrice.yearly / 12)
                : dynamicPrice.monthly
            const originalMonthly = billing === 'yearly'
              ? Math.round(dynamicPrice.yearly / 12)
              : dynamicPrice.monthly

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
                {tier.badge && (
                  <div style={{
                    position: 'absolute', top: -1, right: 20,
                    padding: '0.2rem 0.75rem',
                    background: tier.color, color: '#fff',
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', fontFamily: 'var(--font-display)',
                    borderRadius: '0 0 var(--r-sm) var(--r-sm)',
                  }}>
                    {tier.badge}
                  </div>
                )}

                {/* Plan name */}
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: tier.color, marginBottom: 2 }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                    {tier.subtitle}
                  </div>
                </div>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', minHeight: '3.5rem', flexWrap: 'wrap' }}>
                  {price === 0 ? (
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Free
                    </span>
                  ) : (
                    <>
                      {planDiscount && (
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginRight: '0.25rem' }}>
                          ₹{originalMonthly}
                        </span>
                      )}
                      <span style={{ fontSize: '1rem', color: 'var(--text-muted)', alignSelf: 'flex-start', marginTop: 8 }}>₹</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 700, color: planDiscount ? 'var(--teal)' : 'var(--text-primary)' }}>
                        {displayMonthly}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                        /month
                      </span>
                    </>
                  )}
                </div>
                {planDiscount && price > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--teal)', fontFamily: 'var(--font-display)', marginTop: -8 }}>
                    Coupon applied — save ₹{Math.round(planDiscount.discountPaise / 100)}
                    {billing === 'yearly' ? '/year' : '/month'}
                  </div>
                )}
                {billing === 'yearly' && price > 0 && !planDiscount && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--teal)', fontFamily: 'var(--font-display)', marginTop: -8 }}>
                    {key === 'platinum'
                      ? `₹${dynamicPrice.yearly}/year — ₹${Math.round(dynamicPrice.yearly / 12)}/month billed yearly`
                      : `₹${dynamicPrice.yearly}/year — save ₹${(dynamicPrice.monthly * 12) - dynamicPrice.yearly}`}
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
                    ✓ Current Plan
                  </div>
                ) : price === 0 ? (
                  <Link href="/" style={{
                    display: 'block', padding: '0.65rem 1rem', textAlign: 'center',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)', textDecoration: 'none',
                    fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                    fontWeight: 600, color: 'var(--text-secondary)',
                  }}>
                    Get Started Free →
                  </Link>
                ) : PLAN_RANK[currentPlan] > PLAN_RANK[key] ? (
                  <div style={{
                    padding: '0.6rem 1rem', textAlign: 'center',
                    background: 'var(--surface-3)', border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--r-md)',
                    fontFamily: 'var(--font-display)', fontSize: '0.85rem',
                    fontWeight: 600, color: 'var(--text-muted)',
                  }}>
                    ✓ Included in your plan
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleSubscribe(key as 'gold' | 'platinum')}
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
                        ? 'Opening checkout…'
                        : `Upgrade to ${tier.name} →`}
                    </button>
                    {checkoutError && checkoutLoading === null && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-danger)', marginTop: '0.4rem', textAlign: 'center' }}>
                        {checkoutError}
                      </p>
                    )}
                  </>
                )}

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-soft)', paddingTop: '1rem' }}>
                  {tier.features.map((f, i) => (
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

        {/* Trust signals */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '🔒', text: 'Secure payments via Razorpay' },
            { icon: <Image src="/veda-icon.png" alt="" width={16} height={16} style={{ objectFit: 'contain' }} />, text: 'Swiss Ephemeris precision' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              <span>{icon}</span> {text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ width: '100%', maxWidth: 680 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '1.5rem' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {FAQ.map(({ q, a }, i) => (
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
            Start with Free — free forever
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
            No credit card. No expiry. Upgrade when you&apos;re ready.
          </div>
          <Link href="/" className="btn btn-primary" style={{ padding: '0.65rem 2rem' }}>
            Calculate My Chart →
          </Link>
        </div>

      </main>

      <footer style={{ padding: '1.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ marginBottom: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/refund" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Refunds</Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/support" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Support</Link>
        </div>
        Vedaansh · <span style={{ color: 'var(--text-gold)' }}>Jyotisha Platform</span> · All prices in INR · GST applicable
      </footer>
    </div>
  )
}

function ensureRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as any).Razorpay) return Promise.resolve()
  if (razorpayLoadPromise) return razorpayLoadPromise

  razorpayLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="1"]')
    if (existingScript) {
      const done = () => {
        existingScript.removeEventListener('load', done)
        existingScript.removeEventListener('error', fail)
        if ((window as any).Razorpay) {
          resolve()
          return
        }
        razorpayLoadPromise = null
        reject(new Error('Failed to load Razorpay SDK'))
      }
      const fail = () => {
        existingScript.removeEventListener('load', done)
        existingScript.removeEventListener('error', fail)
        razorpayLoadPromise = null
        reject(new Error('Failed to load Razorpay SDK'))
      }

      existingScript.addEventListener('load', done, { once: true })
      existingScript.addEventListener('error', fail, { once: true })

      // If script has already finished loading, resolve immediately.
      if ((existingScript as any).readyState === 'complete' || (window as any).Razorpay) {
        done()
      }
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.setAttribute('data-razorpay-checkout', '1')
    script.onload = () => {
      if ((window as any).Razorpay) {
        resolve()
        return
      }
      razorpayLoadPromise = null
      reject(new Error('Failed to load Razorpay SDK'))
    }
    script.onerror = () => {
      razorpayLoadPromise = null
      script.remove()
      reject(new Error('Failed to load Razorpay SDK'))
    }
    document.head.appendChild(script)
  })

  return razorpayLoadPromise
}
