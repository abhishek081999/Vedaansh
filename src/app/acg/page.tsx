'use client'

import React, { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import Link from 'next/link'

const AstroCartographyMap = dynamic(() => import('@/components/ui/AstroCartographyMap'), { ssr: false })
const AstroCartographyAnalysis = dynamic(() => import('@/components/ui/AstroCartographyAnalysis').then(m => m.AstroCartographyAnalysis), { ssr: false })

export default function ACGPage() {
  const { chart } = useChart()
  const [selectedPlanets, setSelectedPlanets] = useState<Set<any>>(new Set(['Su', 'Mo', 'Ju', 'Ve']))
  const [activeParans, setActiveParans] = useState<any[]>([])
  const [natalData, setNatalData] = useState<any[]>([])

  const handlePlanetsChange = useCallback((planets: Set<any>, parans: any[], rawNatal?: any[]) => {
    setSelectedPlanets(planets)
    setActiveParans(parans)
    if (rawNatal) setNatalData(rawNatal)
  }, [])

  if (!chart) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🌍</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-gold)', marginBottom: '1rem' }}>Birth Data Required</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Astrocartography requires your exact birth coordinates to map your personal power lines across the globe.
          </p>
          <Link href="/?new=true" className="btn btn-primary" style={{ padding: '0.75rem 2rem', textDecoration: 'none' }}>
            Enter Birth Details
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="badge-accent">Premium Module</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Relocation Intelligence</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>
          Global Horizon Mapping
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: '800px', fontSize: '1.1rem' }}>
          Explore how the planetary positions at your moment of birth resonate with different locations worldwide. 
          Discover your zones of success, love, and spiritual growth.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
        <div className="card" style={{ padding: '0.5rem', overflow: 'hidden', height: '750px', border: '1px solid var(--gold-faint)' }}>
          <AstroCartographyMap 
            jd={chart.meta.julianDay} 
            birthCoords={[chart.meta.latitude, chart.meta.longitude]} 
            onVisiblePlanetsChange={handlePlanetsChange}
          />
        </div>
        <aside style={{ position: 'sticky', top: '2rem' }}>
          <AstroCartographyAnalysis 
            visiblePlanets={selectedPlanets} 
            parans={activeParans}
            natalData={natalData}
          />
        </aside>
      </div>

      <footer className="card-primary" style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--gold-faint)' }}>
        <p style={{ margin: 0, color: 'var(--text-on-gold)', fontWeight: 500 }}>
          💡 <strong>Pro Tip:</strong> Click any city on the map to see how your Rising Sign (Lagna) shifts in that specific region.
        </p>
      </footer>
    </div>
  )
}
