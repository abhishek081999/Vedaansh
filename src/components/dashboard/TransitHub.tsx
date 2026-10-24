// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/TransitHub.tsx
//  Unified Transit workspace — free core + Gold advanced tools
// ─────────────────────────────────────────────────────────────

'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
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

export type TransitHubTab = 'roadmap' | 'scrubber' | 'sade-sati' | 'aspects' | 'biwheel' | 'calendar'

const GOLD_TABS = new Set<TransitHubTab>(['sade-sati', 'aspects', 'biwheel', 'calendar'])

const TABS: Array<{ id: TransitHubTab; label: string; href: string; blurb: string; gold?: boolean }> = [
  {
    id: 'roadmap',
    label: 'Cosmic Roadmap',
    href: '/transit/roadmap',
    blurb: '12-month ingresses with Vimshottari MD/AD overlay',
  },
  {
    id: 'scrubber',
    label: 'Live Transit',
    href: '/transit/scrubber',
    blurb: 'Scrub date & time against your natal chart',
  },
  {
    id: 'sade-sati',
    label: 'Sade Sati',
    href: '/transit/sade-sati',
    blurb: 'Saturn vs Moon — Sade Sati, Kantaka/Dhaiya, Ashtama',
    gold: true,
  },
  {
    id: 'aspects',
    label: 'Aspects',
    href: '/transit/aspects',
    blurb: 'Gochara aspects + double/triple transit windows',
    gold: true,
  },
  {
    id: 'biwheel',
    label: 'Bi-wheel',
    href: '/transit/biwheel',
    blurb: 'Natal/transit wheel + Moorthy + D9 gochar',
    gold: true,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    href: '/transit/calendar',
    blurb: 'Personal monthly gochar calendar + printable HTML',
    gold: true,
  },
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
  const { chart, openBirthForm } = useChart()
  const { data: session } = useSession()
  const userPlan = ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free') as UserPlan
  const [, setTransitGrahas] = useState<GrahaData[] | null>(null)
  const [isMobile, setIsMobile] = useState(false)

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
            Birth Data Required
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Transit tools use your Ascendant, Moon, and Vimshottari dashas. Enter birth details to open the hub.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem' }}
            onClick={openBirthForm}
          >
            Enter Birth Details
          </button>
          <div style={{ marginTop: '1rem' }}>
            <Link href="/?new=true" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Or open the birth form on the home page
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const active = TABS.find(t => t.id === tab) ?? TABS[0]
  const wide = tab === 'scrubber' || tab === 'biwheel' || tab === 'calendar'

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
  } else if (tab === 'scrubber') {
    body = <TransitScrubber natalChart={chart} onTransitChange={setTransitGrahas} />
  } else if (tab === 'sade-sati') {
    body = wrapGold(userPlan, 'Sade Sati tracker', (
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.5rem 1.75rem' }}>
        <SadeSatiPanel chart={chart} />
      </div>
    ))
  } else if (tab === 'aspects') {
    body = wrapGold(userPlan, 'Transit aspects', (
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.5rem 1.75rem' }}>
        <TransitAspectsPanel chart={chart} />
      </div>
    ))
  } else if (tab === 'biwheel') {
    body = wrapGold(userPlan, 'Bi-wheel & Moorthy', (
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.5rem 1.75rem' }}>
        <TransitBiWheelPanel chart={chart} />
      </div>
    ))
  } else if (tab === 'calendar') {
    body = wrapGold(userPlan, 'Transit calendar', (
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
            Transit
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
            {active.blurb}
            {GOLD_TABS.has(tab) ? ' · Gold' : ''}
          </p>
        </div>

        <nav
          aria-label="Transit sections"
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
          {TABS.map(t => {
            const selected = t.id === tab
            return (
              <Link
                key={t.id}
                href={t.href}
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
                {t.label}{t.gold ? ' ✦' : ''}
              </Link>
            )
          })}
        </nav>
      </header>

      {body}
    </div>
  )
}
