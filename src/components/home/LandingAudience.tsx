'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingAudience.tsx
//  Who Vedaansh is for, with entry points into the matching tools
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import type { MouseEvent } from 'react'
import { BookOpen, Sprout, UsersRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import styles from '@/components/home/LandingSections.module.css'

const AUDIENCES = [
  {
    id: 'seekers',
    icon: Sprout,
    links: [
      { href: '/today', slug: 'today_s_reading' },
      { href: '/panchang', slug: 'daily_panchang' },
      { href: '/compare', slug: 'kundali_matching' },
    ],
  },
  {
    id: 'students',
    icon: BookOpen,
    links: [
      { href: '/guides', slug: 'jyotish_guides' },
      { href: '/jaimini', slug: 'jaimini' },
      { href: '/nadi', slug: 'nadi' },
    ],
  },
  {
    id: 'practitioners',
    icon: UsersRound,
    links: [
      { href: '/pricing', slug: 'client_crm' },
      { href: '/pricing', slug: 'white_label_reports' },
      { href: '/pricing', slug: 'pdf_exports' },
    ],
  },
] as const

type LandingAudienceProps = {
  trackLandingCta: (ctaName: string) => void
  withChartGate: (href: string, e?: MouseEvent<HTMLElement>) => void
}

export function LandingAudience({ trackLandingCta, withChartGate }: LandingAudienceProps) {
  const t = useTranslations('home.audience')
  return (
    <div className="landing-section-row-content">
      <VedicSectionHeader kicker={t('kicker')} title={t('title')} theme="gold" />
      <div className={styles.audience}>
        {AUDIENCES.map(({ id, icon: Icon, links }) => {
          const labels = t.raw(`${id}.links`) as string[]
          return (
          <article key={id} className={styles.audienceCard}>
            <Icon size={24} strokeWidth={1.6} aria-hidden />
            <h3>{t(`${id}.title`)}</h3>
            <p>{t(`${id}.text`)}</p>
            <ul>
              {links.map((link, i) => (
                <li key={link.slug}>
                  <Link
                    href={link.href}
                    onClick={(e) => {
                      trackLandingCta(`audience_${id}_${link.slug}`)
                      withChartGate(link.href, e)
                    }}
                  >
                    {labels[i] ?? link.slug}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
          )
        })}
      </div>
    </div>
  )
}
