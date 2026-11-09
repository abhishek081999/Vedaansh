// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/TransitHub.tsx
//  Unified Transit workspace — free core + Gold advanced tools
// ─────────────────────────────────────────────────────────────

'use client'

import { Link } from '@/i18n/navigation'
import React, { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useChart } from '@/components/providers/ChartProvider'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import type { GrahaData, UserPlan } from '@/types/astrology'

const TransitTimeline = dynamic(
  () => import('@/components/ui/TransitTimeline').then(m => m.TransitTimeline),
  { ssr: false },
)
const TransitScrubber = dynamic(
  () => import('@/components/dashboard/TransitScrubber').then(m => m.TransitScrubber),
  { ssr: false },
)
const SadeSatiPanel = dynamic(
  () => import('@/components/dashboard/SadeSatiPanel').then(m => m.SadeSatiPanel),
  { ssr: false },
)
const TransitAspectsPanel = dynamic(
  () => import('@/components/dashboard/TransitAspectsPanel').then(m => m.TransitAspectsPanel),
  { ssr: false },
)
const TransitBiWheelPanel = dynamic(
  () => import('@/components/dashboard/TransitBiWheelPanel').then(m => m.TransitBiWheelPanel),
  { ssr: false },
)
const TransitCalendarPanel = dynamic(
  () => import('@/components/dashboard/TransitCalendarPanel').then(m => m.TransitCalendarPanel),
  { ssr: false },
)
const TransitForecastPanel = dynamic(
  () => import('@/components/dashboard/TransitForecastPanel').then(m => m.TransitForecastPanel),
  { ssr: false },
)
const MoonTransitPanel = dynamic(
  () => import('@/components/dashboard/MoonTransitPanel').then(m => m.MoonTransitPanel),
  { ssr: false },
)

export type TransitHubTab = 'roadmap' | 'forecast' | 'scrubber' | 'moon' | 'sade-sati' | 'aspects' | 'biwheel' | 'calendar'

const GOLD_TABS = new Set<TransitHubTab>(['forecast', 'sade-sati', 'aspects', 'biwheel', 'calendar'])

const TAB_CONFIG: Array<{ id: TransitHubTab; href: string; gold?: boolean }> = [
  { id: 'scrubber', href: '/transit/scrubber' },
  { id: 'forecast', href: '/transit/forecast', gold: true },
  { id: 'moon', href: '/transit/moon' },
  { id: 'roadmap', href: '/transit/roadmap' },
  { id: 'sade-sati', href: '/transit/sade-sati', gold: true },
  { id: 'aspects', href: '/transit/aspects', gold: true },
  { id: 'biwheel', href: '/transit/biwheel', gold: true },
  { id: 'calendar', href: '/transit/calendar', gold: true },
]

interface TransitHubProps {
  tab: TransitHubTab
}

function wrapGold(userPlan: UserPlan, featureName: string, children: React.ReactNode) {
  return (
    <PlanGate userPlan={userPlan} required="gold" featureName={featureName}>
      {children}
    </PlanGate>
  )
}

export function TransitHub({ tab }: TransitHubProps) {
  const t = useTranslations('transit.hub')
  const { chart, openBirthForm } = useChart()
  const { data: session } = useSession()
  const userPlan = ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free') as UserPlan
  const [, setTransitGrahas] = useState<GrahaData[] | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const tabs = useMemo(
    () =>
      TAB_CONFIG.map(row => ({
        ...row,
        label: t(`tabs.${row.id}.label`),
        blurb: t(`tabs.${row.id}.blurb`),
      })),
    [t],
  )

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!chart) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-gold)', marginBottom: '1rem' }}>
            {t('emptyTitle')}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            {t('emptyBody')}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem' }}
            onClick={openBirthForm}
          >
            {t('enterBirth')}
          </button>
          <div style={{ marginTop: '1rem' }}>
            <Link href="/?new=true" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('orHome')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const active = tabs.find(row => row.id === tab) ?? tabs[0]
  const wide = tab === 'forecast' || tab === 'scrubber' || tab === 'moon' || tab === 'biwheel' || tab === 'calendar'

  let body: React.ReactNode = null
  if (tab === 'roadmap') {
    body = (
      <div className="card" style={{ padding: isMobile ? '1.25rem 1rem' : '2rem 2.5rem' }}>
        <TransitTimeline
          ascRashi={chart.lagnas.ascRashi}
          vimshottari={chart.dashas?.vimshottari}
        />
      </div>
    )
  } else if (tab === 'forecast') {
    body = wrapGold(userPlan, t('gates.forecast'), (
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.5rem 1.75rem' }}>
        <TransitForecastPanel chart={chart} />
      </div>
    ))
  } else if (tab === 'scrubber') {
    body = <TransitScrubber natalChart={chart} onTransitChange={setTransitGrahas} />
  } else if (tab === 'moon') {
    body = (
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.5rem 1.75rem' }}>
        <MoonTransitPanel natalChart={chart} />
      </div>
    )
  } else if (tab === 'sade-sati') {
    body = wrapGold(userPlan, t('gates.sadeSati'), (
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.5rem 1.75rem' }}>
        <SadeSatiPanel chart={chart} />
      </div>
    ))
  } else if (tab === 'aspects') {
    body = wrapGold(userPlan, t('gates.aspects'), (
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.5rem 1.75rem' }}>
        <TransitAspectsPanel chart={chart} />
      </div>
    ))
  } else if (tab === 'biwheel') {
    body = wrapGold(userPlan, t('gates.biwheel'), (
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.5rem 1.75rem' }}>
        <TransitBiWheelPanel chart={chart} />
      </div>
    ))
  } else if (tab === 'calendar') {
    body = wrapGold(userPlan, t('gates.calendar'), (
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.5rem 1.75rem' }}>
        <TransitCalendarPanel chart={chart} />
      </div>
    ))
  }

  return (
    <div
      className="fade-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '0.85rem' : '1.25rem',
        padding: isMobile ? '0.85rem' : '1.25rem 1.5rem 2.5rem',
        maxWidth: wide ? 1280 : 960,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.5rem 0.85rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? '1.45rem' : tab === 'roadmap' ? '2.25rem' : '1.65rem',
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.15,
              color: 'var(--text-primary)',
            }}
          >
            {t('title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
            {active.blurb}
            {GOLD_TABS.has(tab) ? t('goldSuffix') : ''}
          </p>
        </div>

        <nav
          aria-label={t('navAriaLabel')}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem',
            background: 'var(--surface-3)',
            padding: 3,
            borderRadius: 10,
            border: '1px solid var(--border-soft)',
            width: 'fit-content',
            maxWidth: '100%',
          }}
        >
          {tabs.map(row => {
            const selected = row.id === tab
            return (
              <Link
                key={row.id}
                href={row.href}
                style={{
                  padding: isMobile ? '0.45rem 0.75rem' : '0.5rem 1rem',
                  borderRadius: 8,
                  border: 'none',
                  textDecoration: 'none',
                  background: selected ? 'var(--gold)' : 'transparent',
                  color: selected ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {row.label}{row.gold ? ' ✦' : ''}
              </Link>
            )
          })}
        </nav>
      </header>

      {body}
    </div>
  )
}
