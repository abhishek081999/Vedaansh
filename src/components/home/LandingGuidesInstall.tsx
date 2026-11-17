'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingGuidesInstall.tsx
//  Guide links and a compact install prompt for the landing page
// ─────────────────────────────────────────────────────────────

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ArrowRight, HeartHandshake, LayoutDashboard, Rocket, Settings2, Smartphone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import styles from '@/components/home/LandingSections.module.css'
import guide from '@/components/help/Help.module.css'
import { HELP_CATEGORIES, HELP_TOPICS, helpShotSize } from '@/lib/help/topics'

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
      <div className={styles.guides} data-stagger>
        {FEATURED_GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className={styles.guide}
            data-spotlight
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

// App Guide hero, the same design as the top of /help (styles shared from Help.module.css).
// Text: messages/<locale>/home.json → appGuide. Card ids are /help/<id> pages.
const APP_GUIDE_PICKS = [
  { id: 'getting-started', icon: Rocket },
  { id: 'workspace', icon: LayoutDashboard },
  { id: 'chart-settings', icon: Settings2 },
  { id: 'matching', icon: HeartHandshake },
] as const

const HERO_PHONE = 'ws-mobile.jpg'

export function LandingAppGuide({ trackLandingCta }: TrackProps) {
  const t = useTranslations('home.appGuide')
  const phone = helpShotSize(HERO_PHONE)

  return (
    <div className="landing-section-row-content">
      <header className={guide.hero}>
        <div className={guide.heroText}>
          <p className={guide.eyebrow}>{t('kicker')}</p>
          <h2 className={guide.heroTitle}>{t('title')}</h2>
          <p className={guide.heroLede}>{t('description')}</p>
          <Link href="/help" className={guide.btnPrimary} onClick={() => trackLandingCta('app_guide_all')}>
            {t('cta')} <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
          </Link>
          <p className={guide.heroStats}>
            {t('stats', { guides: HELP_TOPICS.length, sections: HELP_CATEGORIES.length })}
          </p>
        </div>
        {/* Decorative: the Workspace on a phone. */}
        <div className={guide.heroPhone} aria-hidden>
          <Image src={`/help/${HERO_PHONE}`} alt="" width={phone.width} height={phone.height} sizes="15rem" />
        </div>
      </header>

      <div className={styles.appGuide} data-stagger>
        {APP_GUIDE_PICKS.map(({ id, icon: Icon }) => (
          <Link
            key={id}
            href={`/help/${id}`}
            className={styles.appGuideCard}
            data-spotlight
            onClick={() => trackLandingCta(`app_guide_${id}`)}
          >
            <span className={styles.appGuideIcon}><Icon size={20} strokeWidth={1.75} aria-hidden /></span>
            <strong>{t(`items.${id}.title`)}</strong>
            <p>{t(`items.${id}.text`)}</p>
            <span className={styles.appGuideMore}>
              {t('read')} <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
