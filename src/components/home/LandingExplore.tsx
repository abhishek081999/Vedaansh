'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingExplore.tsx
//  Tool directory on the landing page: three journey lanes
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import { useState, type ComponentType, type MouseEvent } from 'react'
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

const EXPLORE_GROUPS: { id: string; sections: ExploreSection[] }[] = [
  {
    id: 'chart',
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
    sections: [
      { id: 'panchang', href: '/panchang', ctaName: 'major_sections_panchang', icon: Compass },
      { id: 'calendar', href: '/panchang/calendar', ctaName: 'major_sections_calendar', icon: Calendar },
      { id: 'muhurta_finder', gold: true, href: '/muhurta', ctaName: 'major_sections_muhurta_finder', icon: Clock },
      { id: 'prashna', href: '/prashna', ctaName: 'major_sections_prashna', icon: HelpCircle },
    ],
  },
  {
    id: 'advanced',
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

/**
 * Three journey lanes. Desktop and tablet show every lane side by side;
 * below 768px a segmented switcher shows one lane at a time. All links stay
 * in the DOM so crawlers and keyboard users reach every tool.
 */
export function LandingExplore({ trackLandingCta, withChartGate }: LandingExploreProps) {
  const t = useTranslations('home.explore')
  const [activeLane, setActiveLane] = useState(EXPLORE_GROUPS[0].id)

  const open = (section: ExploreSection) => (e: MouseEvent<HTMLAnchorElement>) => {
    trackLandingCta(section.ctaName)
    withChartGate(section.href, e)
  }

  return (
    <div className="landing-section-row-content lj">
      <VedicSectionHeader
        kicker={t('kicker')}
        title={t('title')}
        description={t('description')}
        theme="gold"
      />

      <div className="lj-switch" role="group" aria-label={t('lanesLabel')}>
        {EXPLORE_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            className="lj-switch-btn"
            aria-pressed={activeLane === group.id}
            aria-controls={`lj-lane-${group.id}`}
            onClick={() => setActiveLane(group.id)}
          >
            <span>{t(`groups.${group.id}.short`)}</span>
            <span className="lj-switch-count">{group.sections.length}</span>
          </button>
        ))}
      </div>

      <div className="lj-lanes">
        {EXPLORE_GROUPS.map((group, groupIdx) => {
          // The chart lane opens with the Astrology workspace as its featured entry.
          const lead = group.id === 'chart' ? group.sections[0] : null
          const rest = lead ? group.sections.slice(1) : group.sections
          return (
            <section
              key={group.id}
              id={`lj-lane-${group.id}`}
              className={`lj-lane lj-lane--${group.id}`}
              data-active={activeLane === group.id}
              aria-labelledby={`lj-lane-title-${group.id}`}
              style={{ ['--stagger-i' as string]: groupIdx }}
            >
              <header className="lj-lane-head">
                <span className="lj-lane-num" aria-hidden="true">
                  {String(groupIdx + 1).padStart(2, '0')}
                </span>
                <div className="lj-lane-heading">
                  <h3 id={`lj-lane-title-${group.id}`} className="lj-lane-title">
                    {t(`groups.${group.id}.title`)}
                  </h3>
                  <p className="lj-lane-desc">{t(`groups.${group.id}.description`)}</p>
                </div>
                <span className="lj-lane-count">{t('toolCount', { count: group.sections.length })}</span>
              </header>

              {lead && (
                <Link
                  href={lead.href}
                  onClick={open(lead)}
                  onMouseMove={trackPointer}
                  className="lj-lead"
                >
                  <span className="lj-lead-icon" aria-hidden="true">
                    <lead.icon size={22} strokeWidth={1.8} />
                  </span>
                  <span className="lj-lead-body">
                    <span className="lj-lead-kicker">{t(`cards.${lead.id}.subtitle`)}</span>
                    <span className="lj-lead-title">{t(`cards.${lead.id}.title`)}</span>
                    <span className="lj-lead-text">{t(`cards.${lead.id}.text`)}</span>
                    <span className="lj-lead-cta">
                      {t('startChart')}
                      <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              )}

              <ul className="lj-list">
                {rest.map((section) => {
                  const Icon = section.icon
                  return (
                    <li key={section.id}>
                      <Link href={section.href} onClick={open(section)} className="lj-row">
                        <span className="lj-row-icon" aria-hidden="true">
                          <Icon size={17} strokeWidth={1.9} />
                        </span>
                        <span className="lj-row-body">
                          <span className="lj-row-title">
                            {t(`cards.${section.id}.title`)}
                            {section.gold && (
                              <span className="lj-gold">{t(`cards.${section.id}.subtitle`)}</span>
                            )}
                          </span>
                          <span className="lj-row-text">{t(`cards.${section.id}.text`)}</span>
                        </span>
                        <ArrowRight className="lj-row-arrow" size={15} strokeWidth={2.2} aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
