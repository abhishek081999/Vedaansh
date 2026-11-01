'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingAudience.tsx
//  Who Vedaansh is for, with entry points into the matching tools
// ─────────────────────────────────────────────────────────────

import type { MouseEvent } from 'react'
import Link from 'next/link'
import { BookOpen, Sprout, UsersRound } from 'lucide-react'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import styles from '@/components/home/LandingSections.module.css'

const AUDIENCES = [
  {
    id: 'seekers',
    icon: Sprout,
    title: 'For seekers',
    text: 'Understand your own chart and plan each day without learning the whole system first.',
    links: [
      { href: '/today', label: 'Today’s Reading' },
      { href: '/panchang', label: 'Daily Panchang' },
      { href: '/compare', label: 'Kundali Matching' },
    ],
  },
  {
    id: 'students',
    icon: BookOpen,
    title: 'For students',
    text: 'Work through classical methods on real charts, with plain-language guides beside the calculations.',
    links: [
      { href: '/guides', label: 'Jyotish guides' },
      { href: '/jaimini', label: 'Jaimini' },
      { href: '/nadi', label: 'Nadi' },
    ],
  },
  {
    id: 'practitioners',
    icon: UsersRound,
    title: 'For practitioners',
    text: 'Keep client records, prepare consultations and send out reports under your own brand.',
    links: [
      { href: '/pricing', label: 'Client CRM' },
      { href: '/pricing', label: 'White-label reports' },
      { href: '/pricing', label: 'PDF exports' },
    ],
  },
] as const

type LandingAudienceProps = {
  trackLandingCta: (ctaName: string) => void
  withChartGate: (href: string, e?: MouseEvent<HTMLElement>) => void
}

export function LandingAudience({ trackLandingCta, withChartGate }: LandingAudienceProps) {
  return (
    <div className="landing-section-row-content">
      <VedicSectionHeader kicker="Who it's for" title="Built for every stage of practice" theme="gold" />
      <div className={styles.audience}>
        {AUDIENCES.map(({ id, icon: Icon, title, text, links }) => (
          <article key={id} className={styles.audienceCard}>
            <Icon size={24} strokeWidth={1.6} aria-hidden />
            <h3>{title}</h3>
            <p>{text}</p>
            <ul>
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={(e) => {
                      trackLandingCta(`audience_${id}_${link.label.toLowerCase().replace(/\W+/g, '_')}`)
                      withChartGate(link.href, e)
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}
