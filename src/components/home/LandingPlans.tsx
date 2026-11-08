'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingPlans.tsx
//  Plan summary on the landing page; /pricing holds the full comparison
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import { PLAN_PRICES } from '@/lib/subscription/pricing'
import styles from '@/components/home/LandingSections.module.css'

const PLANS = [{ id: 'free' }, { id: 'gold' }, { id: 'platinum' }] as const // copy: home.plans.<id>

export function LandingPlans({ trackLandingCta }: { trackLandingCta: (ctaName: string) => void }) {
  const [prices, setPrices] = useState<typeof PLAN_PRICES>(PLAN_PRICES)
  const t = useTranslations('home.plans')
  const locale = useLocale()
  // Western digits in both languages; hi-IN still groups lakhs/crores.
  const inr = new Intl.NumberFormat(locale === 'hi' ? 'hi-IN-u-nu-latn' : 'en-IN')

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
        kicker={t('kicker')}
        title={t('title')}
        description={t('description')}
        theme="gold"
      />
      <div className={styles.plans}>
        {PLANS.map((plan) => (
          <article key={plan.id} className={`${styles.plan} ${plan.id === 'gold' ? styles.planFeatured : ''}`}>
            <h3>{t(`${plan.id}.name`)}</h3>
            <p className={styles.planBlurb}>{t(`${plan.id}.blurb`)}</p>
            <p className={styles.planPrice}>
              {plan.id === 'free' ? (
                <strong>₹0</strong>
              ) : (
                <>
                  <strong>₹{inr.format(prices[plan.id].monthly)}</strong>
                  <span>{t('perMonth')}</span>
                </>
              )}
            </p>
            <p className={styles.planYearly}>
              {plan.id === 'free' ? t('freeForever') : t('orYearly', { price: inr.format(prices[plan.id].yearly) })}
            </p>
            <ul>
              {(t.raw(`${plan.id}.features`) as string[]).map((feature) => (
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
          {t('compare')}
        </Link>
      </div>
    </div>
  )
}
