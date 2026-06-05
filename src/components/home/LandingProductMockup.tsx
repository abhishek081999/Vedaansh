'use client'

import { CelestialAstrolabe } from '@/components/home/CelestialAstrolabe'
import { NorthIndianMockChart } from '@/components/home/NorthIndianMockChart'

export type MockupSlideId = 'astrology' | 'prashna' | 'panchang' | 'calendar' | 'compare'

type SlideConfig = {
  url: string
  tabs: string[]
  activeTab: number
  chartTitle: string
  badge: string
  metaLeft: string
  metaRight: string
  sidebarLabel: string
  sidebarRows: { label: string; sub: string; active?: boolean }[]
}

const SLIDE_CONFIG: Record<MockupSlideId, SlideConfig> = {
  astrology: {
    url: 'vedaansh.app / astrology',
    tabs: ['Chart', 'Dashas', 'Panchang'],
    activeTab: 0,
    chartTitle: 'D1 Rashi',
    badge: 'Lahiri',
    metaLeft: 'Scorpio · Shravana Mo',
    metaRight: 'Moon Mahadasha',
    sidebarLabel: 'Active dasha',
    sidebarRows: [
      { label: 'Mo', sub: '2024 – 2034', active: true },
      { label: 'Ma', sub: '2034 – 2041' },
      { label: 'Ra', sub: '2041 – 2059' },
    ],
  },
  prashna: {
    url: 'vedaansh.app / prashna',
    tabs: ['Query', 'Chart', 'Verdict'],
    activeTab: 0,
    chartTitle: 'Prashna Chart',
    badge: 'Focused',
    metaLeft: 'Question · Now',
    metaRight: 'Hora lord',
    sidebarLabel: 'Reading',
    sidebarRows: [
      { label: 'Yes', sub: 'Favourable', active: true },
      { label: 'Timing', sub: 'Within 7 days' },
      { label: 'House', sub: '11th gains' },
    ],
  },
  panchang: {
    url: 'vedaansh.app / panchang',
    tabs: ['Today', 'Rahu', 'Yogas'],
    activeTab: 0,
    chartTitle: 'Daily Panchang',
    badge: 'Live',
    metaLeft: 'Shukla Navami',
    metaRight: 'Bharani',
    sidebarLabel: 'Day factors',
    sidebarRows: [
      { label: 'Tithi', sub: 'Navami', active: true },
      { label: 'Yoga', sub: 'Siddha' },
      { label: 'Karana', sub: 'Balava' },
    ],
  },
  calendar: {
    url: 'vedaansh.app / calendar',
    tabs: ['Month', 'Festivals', 'Muhurta'],
    activeTab: 0,
    chartTitle: 'Vedic Calendar',
    badge: 'June 2026',
    metaLeft: 'Ekadashi · 12',
    metaRight: 'Purnima · 28',
    sidebarLabel: 'This month',
    sidebarRows: [
      { label: 'Guru', sub: 'Strong window', active: true },
      { label: 'Rahu', sub: 'Avoid starts' },
      { label: 'Festival', sub: '3 marked' },
    ],
  },
  compare: {
    url: 'vedaansh.app / matching',
    tabs: ['Charts', 'Guna', 'Dosha'],
    activeTab: 1,
    chartTitle: 'Ashtakoot',
    badge: '36 pts',
    metaLeft: 'Score · 28/36',
    metaRight: 'Nadi clear',
    sidebarLabel: 'Kootas',
    sidebarRows: [
      { label: 'Varna', sub: '1 / 1', active: true },
      { label: 'Bhakut', sub: '7 / 7' },
      { label: 'Nadi', sub: '8 / 8' },
    ],
  },
}

function MockChart({ slideId }: { slideId: MockupSlideId }) {
  if (slideId === 'astrology' || slideId === 'prashna') {
    return <NorthIndianMockChart />
  }

  if (slideId === 'compare') {
    return (
      <svg viewBox="0 0 100 100" className="landing-mockup-chart-svg" aria-hidden>
        <rect x="2" y="8" width="44" height="84" rx="2" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <rect x="54" y="8" width="44" height="84" rx="2" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <text x="24" y="52" textAnchor="middle" className="landing-mockup-planet-label">A</text>
        <text x="76" y="52" textAnchor="middle" className="landing-mockup-planet-label">B</text>
        <line x1="50" y1="50" x2="50" y2="50" stroke="currentColor" strokeWidth="0" />
        <text x="50" y="92" textAnchor="middle" className="landing-mockup-house-label">28 / 36</text>
      </svg>
    )
  }

  if (slideId === 'calendar') {
    return (
      <svg viewBox="0 0 100 100" className="landing-mockup-chart-svg" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => {
          const col = i % 4
          const row = Math.floor(i / 4)
          const x = 8 + col * 22
          const y = 12 + row * 26
          const strong = i === 3 || i === 7
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="18"
              height="20"
              rx="2"
              className={strong ? 'landing-mockup-planet-bg' : ''}
              fill={strong ? undefined : 'none'}
              stroke="currentColor"
              strokeWidth="0.4"
              opacity={strong ? 1 : 0.25}
            />
          )
        })}
      </svg>
    )
  }

  if (slideId === 'panchang') {
    return (
      <svg viewBox="0 0 100 100" className="landing-mockup-chart-svg" aria-hidden>
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.22" strokeDasharray="3 2" />
        <text x="50" y="44" textAnchor="middle" className="landing-mockup-planet-label">☽ Mo</text>
        <text x="50" y="58" textAnchor="middle" className="landing-mockup-house-label">Bharani</text>
      </svg>
    )
  }

  return <NorthIndianMockChart />
}

type LandingProductMockupProps = {
  slideId?: MockupSlideId
  accent?: string
}

export function LandingProductMockup({ slideId = 'astrology', accent = 'var(--gold)' }: LandingProductMockupProps) {
  const cfg = SLIDE_CONFIG[slideId]

  return (
    <div className="landing-product-mockup" aria-hidden="true">
      <div className="landing-product-mockup-ambient">
        <CelestialAstrolabe accent={accent} id={`mockup-${slideId}`} />
      </div>

      <div className="landing-product-mockup-frame">
        <div className="landing-product-mockup-chrome">
          <div className="landing-product-mockup-dots">
            <span /><span /><span />
          </div>
          <div className="landing-product-mockup-url">{cfg.url}</div>
        </div>

        <div className="landing-product-mockup-body">
          <div className="landing-product-mockup-tabs">
            {cfg.tabs.map((tab, i) => (
              <span key={tab} className={`landing-product-mockup-tab${i === cfg.activeTab ? ' is-active' : ''}`}>
                {tab}
              </span>
            ))}
          </div>

          <div className="landing-product-mockup-layout">
            <div className="landing-product-mockup-chart-wrap">
              <div className="landing-product-mockup-chart-header">
                <span className="landing-product-mockup-chart-title">{cfg.chartTitle}</span>
                <span className="landing-product-mockup-badge">{cfg.badge}</span>
              </div>
              <MockChart slideId={slideId} />
              <div className="landing-product-mockup-meta">
                <span>{cfg.metaLeft}</span>
                <span>{cfg.metaRight}</span>
              </div>
            </div>

            <div className="landing-product-mockup-sidebar">
              <span className="landing-product-mockup-sidebar-label">{cfg.sidebarLabel}</span>
              {cfg.sidebarRows.map((row) => (
                <div key={row.label} className={`landing-product-mockup-dasha${row.active ? ' is-active' : ''}`}>
                  <span className="landing-product-mockup-dasha-planet">{row.label}</span>
                  <span className="landing-product-mockup-dasha-period">{row.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
