'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import Link from 'next/link'

const TransitTimeline = dynamic(() => import('@/components/ui/TransitTimeline').then(m => m.TransitTimeline), { ssr: false })

export default function RoadmapPage() {
  const { chart } = useChart()

  if (!chart) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚀</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-gold)', marginBottom: '1rem' }}>Birth Data Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            The Cosmic Roadmap calculates transits relative to your personal Ascendant. Enter your birth details to see your 12-month outlook.
          </p>
          <Link href="/?new=true" className="btn btn-primary" style={{ padding: '0.75rem 2rem', textDecoration: 'none' }}>
            Enter Birth Details
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="badge-accent">Predictive Suite</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Time Dynamics</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 700, margin: 0 }}>
          Your Cosmic Roadmap
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.6rem', fontSize: '1.1rem', maxWidth: '700px', margin: '0.6rem auto 0' }}>
          A personalized 12-month journey tracking the movements of Jupiter, Saturn, and the Nodes as they navigate your natal houses.
        </p>
      </header>

      <div className="card" style={{ padding: '3rem' }}>
        <TransitTimeline ascRashi={chart.lagnas.ascRashi} />
      </div>

      <div style={{ height: '4rem' }} />
    </div>
  )
}
