'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingGuidesInstall.tsx
//  Guide links and a compact install prompt for the landing page
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import { ArrowRight, Smartphone } from 'lucide-react'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import styles from '@/components/home/LandingSections.module.css'

// Titles are shortened from src/lib/seo/guides.ts so that page data stays out of this bundle.
const FEATURED_GUIDES = [
  { slug: 'free-vedic-birth-chart-kundali', topic: 'Start here', title: 'What a Vedic birth chart shows' },
  { slug: 'vimshottari-dasha-explained', topic: 'Timing', title: 'Vimshottari Dasha explained' },
  { slug: 'what-is-navamsha-d9-chart', topic: 'Divisional charts', title: 'What is Navamsha (D9)?' },
  { slug: 'ashtakoot-guna-milan-explained', topic: 'Matching', title: 'Ashtakoot Guna Milan explained' },
] as const

type TrackProps = { trackLandingCta: (ctaName: string) => void }

export function LandingGuides({ trackLandingCta }: TrackProps) {
  return (
    <div className="landing-section-row-content">
      <VedicSectionHeader kicker="Learn" title="Learn Jyotish as you go" theme="gold" />
      <div className={styles.guides}>
        {FEATURED_GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className={styles.guide}
            onClick={() => trackLandingCta(`guide_${guide.slug}`)}
          >
            <span>{guide.topic}</span>
            <strong>{guide.title}</strong>
            <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
          </Link>
        ))}
      </div>
      <div className={styles.centerAction}>
        <Link href="/guides" className={styles.textLink} onClick={() => trackLandingCta('guides_all')}>
          See all guides
          <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
        </Link>
      </div>
    </div>
  )
}

export function LandingInstallStrip({ trackLandingCta }: TrackProps) {
  return (
    <div className={styles.install}>
      <span className={styles.installIcon}><Smartphone size={22} strokeWidth={1.75} aria-hidden /></span>
      <div>
        <h3>Keep Vedaansh on your home screen</h3>
        <p>Install it from Chrome on Android or Safari on iPhone and iPad. No app store needed.</p>
      </div>
      <Link href="/install" className="btn btn-secondary" style={{ textDecoration: 'none' }} onClick={() => trackLandingCta('install_strip')}>
        See how to install
      </Link>
    </div>
  )
}
