'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingGuidesInstall.tsx
//  Guide links and a compact install prompt for the landing page
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import { ArrowRight, Smartphone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import styles from '@/components/home/LandingSections.module.css'

// Titles: messages/<locale>/home.json → guides.items.<slug> (shortened from src/lib/seo/guides.ts).
const FEATURED_GUIDES = [
  { slug: 'free-vedic-birth-chart-kundali' },
  { slug: 'vimshottari-dasha-explained' },
  { slug: 'what-is-navamsha-d9-chart' },
  { slug: 'ashtakoot-guna-milan-explained' },
] as const

type TrackProps = { trackLandingCta: (ctaName: string) => void }

export function LandingGuides({ trackLandingCta }: TrackProps) {
  const t = useTranslations('home.guides')
  return (
    <div className="landing-section-row-content">
      <VedicSectionHeader kicker={t('kicker')} title={t('title')} theme="gold" />
      <div className={styles.guides}>
        {FEATURED_GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className={styles.guide}
            onClick={() => trackLandingCta(`guide_${guide.slug}`)}
          >
            <span>{t(`items.${guide.slug}.topic`)}</span>
            <strong>{t(`items.${guide.slug}.title`)}</strong>
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
          </Link>
        ))}
      </div>
      <div className={styles.centerAction}>
        <Link href="/guides" className={styles.textLink} onClick={() => trackLandingCta('guides_all')}>
          {t('seeAll')}
          <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
        </Link>
      </div>
    </div>
  )
}

export function LandingInstallStrip({ trackLandingCta }: TrackProps) {
  const t = useTranslations('home.install')
  return (
    <div className={styles.install}>
      <span className={styles.installIcon}><Smartphone size={22} strokeWidth={1.75} aria-hidden /></span>
      <div>
        <h3>{t('title')}</h3>
        <p>{t('text')}</p>
      </div>
      <Link href="/install" className="btn btn-secondary" style={{ textDecoration: 'none' }} onClick={() => trackLandingCta('install_strip')}>
        {t('cta')}
      </Link>
    </div>
  )
}
