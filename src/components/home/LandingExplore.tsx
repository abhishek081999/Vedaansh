'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingExplore.tsx
//  Tool directory on the landing page, grouped by purpose
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import type { ComponentType, MouseEvent } from 'react'
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Calendar,
  CalendarCheck,
  Clock,
  Compass,
  Globe,
  Hash,
  Heart,
  HeartHandshake,
  HelpCircle,
  Home,
  Layers,
  Orbit,
  ShieldAlert,
  Sparkles,
  Star,
  Waypoints,
  Zap,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'

// Copy lives in messages/<locale>/home.json under explore.cards.<id>.
type ExploreSection = {
  id: string
  /** Plan badge: shown in gold. */
  gold?: boolean
  href: string
  ctaName: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
}

const EXPLORE_GROUPS: { id: string; tier: 'primary' | 'secondary' | 'tertiary'; sections: ExploreSection[] }[] = [
  {
    id: 'chart',
    tier: 'primary',
    sections: [
      { id: 'astrology', href: '/?new=true', ctaName: 'major_sections_astrology', icon: Sparkles },
      { id: 'today', href: '/today', ctaName: 'major_sections_today', icon: CalendarCheck },
      { id: 'transits', href: '/transit/roadmap', ctaName: 'major_sections_transits', icon: Orbit },
      { id: 'relationship', gold: true, href: '/relationship', ctaName: 'major_sections_relationship', icon: Heart },
      { id: 'career', gold: true, href: '/career', ctaName: 'major_sections_career', icon: Briefcase },
      { id: 'dosha', gold: true, href: '/dosha', ctaName: 'major_sections_dosha', icon: ShieldAlert },
      { id: 'kundali_matching', href: '/compare', ctaName: 'major_sections_kundali_matching', icon: HeartHandshake },
    ],
  },
  {
    id: 'timing',
    tier: 'secondary',
    sections: [
      { id: 'panchang', href: '/panchang', ctaName: 'major_sections_panchang', icon: Compass },
      { id: 'calendar', href: '/panchang/calendar', ctaName: 'major_sections_calendar', icon: Calendar },
      { id: 'muhurta_finder', gold: true, href: '/muhurta', ctaName: 'major_sections_muhurta_finder', icon: Clock },
      { id: 'prashna', href: '/prashna', ctaName: 'major_sections_prashna', icon: HelpCircle },
    ],
  },
  {
    id: 'advanced',
    tier: 'tertiary',
    sections: [
      { id: 'nakshatra', href: '/nakshatra', ctaName: 'major_sections_nakshatra', icon: Star },
      { id: 'jaimini', href: '/jaimini', ctaName: 'major_sections_jaimini', icon: Zap },
      { id: 'nadi', href: '/nadi', ctaName: 'major_sections_nadi', icon: Waypoints },
      { id: 'sarvatobhadra', href: '/sbc', ctaName: 'major_sections_sarvatobhadra', icon: Layers },
      { id: 'astrocartography', href: '/acg', ctaName: 'major_sections_astrocartography', icon: Globe },
      { id: 'astro_vastu', href: '/vastu', ctaName: 'major_sections_astro_vastu', icon: Home },
      { id: 'numerology', href: '/numerology', ctaName: 'major_sections_numerology', icon: Hash },
      { id: 'guides', href: '/guides', ctaName: 'major_sections_guides', icon: BookOpen },
    ],
  },
]

function trackPointer(e: MouseEvent<HTMLAnchorElement>) {
  const rect = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
}

type LandingExploreProps = {
  trackLandingCta: (ctaName: string) => void
  withChartGate: (href: string, e?: MouseEvent<HTMLElement>) => void
}

export function LandingExplore({ trackLandingCta, withChartGate }: LandingExploreProps) {
  const t = useTranslations('home.explore')
  return (
    <div className="landing-section-row-content">
      <VedicSectionHeader
        kicker={t('kicker')}
        title={t('title')}
        description={t('description')}
        theme="gold"
      />
      {EXPLORE_GROUPS.map((group, groupIdx) => (
        <div
          key={group.id}
          className={`landing-major-group landing-explore-tier landing-explore-tier--${group.tier}`}
          data-count={group.sections.length}
        >
          <div className="landing-explore-group-head">
            <h3 className="landing-major-group-title">{t(`groups.${group.id}.title`)}</h3>
            <p className="landing-explore-group-desc">{t(`groups.${group.id}.description`)}</p>
          </div>
          <div className="landing-major-sections-grid landing-reveal-stagger">
            {group.sections.map((section, idx) => {
              const IconComponent = section.icon
              const isLead = group.tier === 'primary' && idx === 0
              const isGold = section.gold === true
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  onClick={(e) => {
                    trackLandingCta(section.ctaName)
                    withChartGate(section.href, e)
                  }}
                  onMouseMove={trackPointer}
                  className={`landing-major-section-card landing-premium-card${isLead ? ' landing-explore-lead' : ''}`}
                  style={{ ['--stagger-i' as string]: groupIdx * 6 + idx }}
                >
                  <div className="card-icon-wrapper">
                    <IconComponent size={20} strokeWidth={2} />
                  </div>
                  <div className="card-body">
                    <span className={`card-kicker${isGold ? ' landing-explore-gold' : ''}`}>{t(`cards.${section.id}.subtitle`)}</span>
                    <span className="stat-value">{t(`cards.${section.id}.title`)}</span>
                    <span className="stat-sub">{t(`cards.${section.id}.text`)}</span>
                  </div>
                  {isLead ? (
                    <span className="landing-explore-lead-cta" aria-hidden="true">
                      {t('startChart')}
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </span>
                  ) : (
                    <span className="card-arrow" aria-hidden="true">
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
