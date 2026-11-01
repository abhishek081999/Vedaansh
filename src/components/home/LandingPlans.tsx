'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingPlans.tsx
//  Plan summary on the landing page; /pricing holds the full comparison
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import { PLAN_PRICES } from '@/lib/subscription/pricing'
import styles from '@/components/home/LandingSections.module.css'

const inr = new Intl.NumberFormat('en-IN')

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    blurb: 'Core charts and daily timing.',
    features: ['Birth chart and 16 Shodashavarga', 'Panchang and public share links', '20 saved charts and 20 matches'],
  },
  {
    id: 'gold',
    name: 'Gold',
    blurb: 'Full readings and timing tools.',
    features: ['Relationship and career readings', 'Muhurta Finder and PDF export', '200 saved charts and 200 matches'],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    blurb: 'For professional practice.',
    features: ['All 41 varga charts', 'Client CRM and white-label reports', 'Unlimited saves, email and bulk ZIP'],
  },
] as const

export function LandingPlans({ trackLandingCta }: { trackLandingCta: (ctaName: string) => void }) {
  const [prices, setPrices] = useState<typeof PLAN_PRICES>(PLAN_PRICES)

  // Admin BillingConfig may override the defaults, same as /pricing.
  useEffect(() => {
    fetch('/api/subscription/pricing')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.prices) setPrices(json.prices)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="landing-section-row-content">
      <VedicSectionHeader
        kicker="Plans"
        title="Start free, upgrade when your work needs it"
        description="No credit card is needed for the Free plan."
        theme="gold"
      />
      <div className={styles.plans}>
        {PLANS.map((plan) => (
          <article key={plan.id} className={`${styles.plan} ${plan.id === 'gold' ? styles.planFeatured : ''}`}>
            <h3>{plan.name}</h3>
            <p className={styles.planBlurb}>{plan.blurb}</p>
            <p className={styles.planPrice}>
              {plan.id === 'free' ? (
                <strong>₹0</strong>
              ) : (
                <>
                  <strong>₹{inr.format(prices[plan.id].monthly)}</strong>
                  <span>/month</span>
                </>
              )}
            </p>
            <p className={styles.planYearly}>
              {plan.id === 'free' ? 'Free forever' : `or ₹${inr.format(prices[plan.id].yearly)} a year`}
            </p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <Check size={14} strokeWidth={2.5} aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className={styles.centerAction}>
        <Link href="/pricing" className="btn btn-secondary" style={{ textDecoration: 'none' }} onClick={() => trackLandingCta('plans_compare')}>
          Compare all features
        </Link>
      </div>
    </div>
  )
}
