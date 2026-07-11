'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import Link from 'next/link'
import type { GrahaData } from '@/types/astrology'

const TransitScrubber = dynamic(() => import('@/components/dashboard/TransitScrubber').then(m => m.TransitScrubber), { ssr: false })

export default function ScrubberPage() {
  const { chart } = useChart()
  const [transitGrahas, setTransitGrahas] = useState<GrahaData[] | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1000)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!chart) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-gold)', marginBottom: '1rem' }}>Birth Data Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Transit lets you shift through time and see how planets move against your natal chart. Enter your birth details to get started.
          </p>
          <Link href="/?new=true" className="btn btn-primary" style={{ padding: '0.75rem 2rem', textDecoration: 'none' }}>
            Enter Birth Details
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.25rem' : '1.75rem', padding: isMobile ? '1rem' : '1.5rem 2rem 3rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <header style={{ paddingBottom: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
          <span className="badge-accent" style={{ fontSize: '0.65rem' }}>Interactive</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Natal overlay</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.55rem' : '2.1rem', fontWeight: 700, margin: 0, lineHeight: 1.15, color: 'var(--text-primary)' }}>
          Planetary Transit
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: 640, fontSize: isMobile ? '0.88rem' : '0.95rem', lineHeight: 1.55, marginBottom: 0 }}>
          Set any date and time to see transiting planets against your natal chart. Time uses your birth timezone.
        </p>
      </header>

      <TransitScrubber natalChart={chart} onTransitChange={setTransitGrahas} />
    </div>
  )
}
