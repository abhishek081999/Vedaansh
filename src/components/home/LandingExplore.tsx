'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingExplore.tsx
//  Tool directory on the landing page, grouped by purpose
// ─────────────────────────────────────────────────────────────

import type { ComponentType, MouseEvent } from 'react'
import Link from 'next/link'
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
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'

type ExploreSection = {
  title: string
  subtitle: string
  text: string
  href: string
  ctaName: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
}

const EXPLORE_GROUPS: { id: string; title: string; description: string; tier: 'primary' | 'secondary' | 'tertiary'; sections: ExploreSection[] }[] = [
  {
    id: 'chart',
    title: 'Read your chart',
    description: 'Start from your birth details.',
    tier: 'primary',
    sections: [
      { title: 'Astrology', subtitle: 'Workspace', text: 'Kundali, vargas, dasha, plus marriage and career readings.', href: '/?new=true', ctaName: 'major_sections_astrology', icon: Sparkles },
      { title: 'Today’s Reading', subtitle: 'Personal', text: 'Daily reading from your Moon, dasha, and transits.', href: '/today', ctaName: 'major_sections_today', icon: CalendarCheck },
      { title: 'Transits', subtitle: 'Gochar', text: 'Cosmic roadmap, Sade Sati, aspects, and live sky.', href: '/transit/roadmap', ctaName: 'major_sections_transits', icon: Orbit },
      { title: 'Relationship & Marriage', subtitle: 'Gold', text: 'Marriage promise, timing, Mars and Vivah readings.', href: '/relationship', ctaName: 'major_sections_relationship', icon: Heart },
      { title: 'Career & Profession', subtitle: 'Gold', text: 'Dashamsha strength and the professional method.', href: '/career', ctaName: 'major_sections_career', icon: Briefcase },
      { title: 'Dosha & Upay', subtitle: 'Gold', text: 'Pitru, Matru, Sarpa and related Shrap flags with remedies.', href: '/dosha', ctaName: 'major_sections_dosha', icon: ShieldAlert },
      { title: 'Kundali Matching', subtitle: 'Compatibility', text: '36-point Guna Milan, doshas, and synastry.', href: '/compare', ctaName: 'major_sections_kundali_matching', icon: HeartHandshake },
    ],
  },
  {
    id: 'timing',
    title: 'Plan the right time',
    description: 'Check the day before you commit.',
    tier: 'secondary',
    sections: [
      { title: 'Panchang', subtitle: 'Daily', text: 'Tithi, nakshatra, yoga, and karana.', href: '/panchang', ctaName: 'major_sections_panchang', icon: Compass },
      { title: 'Calendar', subtitle: 'Monthly', text: 'Month-level Vedic timing windows.', href: '/panchang/calendar', ctaName: 'major_sections_calendar', icon: Calendar },
      { title: 'Muhurta Finder', subtitle: 'Gold', text: 'Auspicious windows for key actions.', href: '/muhurta', ctaName: 'major_sections_muhurta_finder', icon: Clock },
      { title: 'Prashna', subtitle: 'Query', text: 'Guidance for specific questions.', href: '/prashna', ctaName: 'major_sections_prashna', icon: HelpCircle },
    ],
  },
  {
    id: 'advanced',
    title: 'Go deeper',
    description: 'Classical systems for closer study.',
    tier: 'tertiary',
    sections: [
      { title: 'Nakshatra', subtitle: 'Lunar', text: 'Nakshatra insights day by day.', href: '/nakshatra', ctaName: 'major_sections_nakshatra', icon: Star },
      { title: 'Jaimini Astrology', subtitle: 'Advanced', text: 'Jaimini charts and life direction.', href: '/jaimini', ctaName: 'major_sections_jaimini', icon: Zap },
      { title: 'Nadi Astrology', subtitle: 'Advanced', text: 'Chart, planetary positions, and dasha.', href: '/nadi', ctaName: 'major_sections_nadi', icon: Waypoints },
      { title: 'Sarvatobhadra Chakra', subtitle: 'Classical', text: 'Traditional S.B. Chakra timing.', href: '/sbc', ctaName: 'major_sections_sarvatobhadra', icon: Layers },
      { title: 'AstroCartography', subtitle: 'Location', text: 'Planetary lines for travel and moves.', href: '/acg', ctaName: 'major_sections_astrocartography', icon: Globe },
      { title: 'Astro Vastu', subtitle: 'Space', text: 'Vastu aligned with your chart.', href: '/vastu', ctaName: 'major_sections_astro_vastu', icon: Home },
      { title: 'Vedic Numerology', subtitle: 'Anka Jyotish', text: 'Moolank, Bhagyank, name and grid.', href: '/numerology', ctaName: 'major_sections_numerology', icon: Hash },
      { title: 'Jyotish Guides', subtitle: 'Learn', text: 'The methods behind each tool.', href: '/guides', ctaName: 'major_sections_guides', icon: BookOpen },
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
  return (
    <div className="landing-section-row-content">
      <VedicSectionHeader
        kicker="Explore"
        title="Every core Vedaansh journey"
        description="Jump straight to the tool you need."
        theme="gold"
      />
      {EXPLORE_GROUPS.map((group, groupIdx) => (
        <div
          key={group.id}
          className={`landing-major-group landing-explore-tier landing-explore-tier--${group.tier}`}
          data-count={group.sections.length}
        >
          <div className="landing-explore-group-head">
            <h3 className="landing-major-group-title">{group.title}</h3>
            <p className="landing-explore-group-desc">{group.description}</p>
          </div>
          <div className="landing-major-sections-grid landing-reveal-stagger">
            {group.sections.map((section, idx) => {
              const IconComponent = section.icon
              const isLead = group.tier === 'primary' && idx === 0
              const isGold = section.subtitle === 'Gold'
              return (
                <Link
                  key={section.title}
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
                    <span className={`card-kicker${isGold ? ' landing-explore-gold' : ''}`}>{section.subtitle}</span>
                    <span className="stat-value">{section.title}</span>
                    <span className="stat-sub">{section.text}</span>
                  </div>
                  {isLead ? (
                    <span className="landing-explore-lead-cta" aria-hidden="true">
                      Start a chart
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
