'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/(public)/page.tsx  — or  src/app/page.tsx
//  Home page: birth form + chart result with tabs
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { BirthForm }       from '@/components/ui/BirthForm'
import { ChakraSelector }  from '@/components/chakra/ChakraSelector'
import { DashaTree }       from '@/components/dasha/DashaTree'
import { GrahaTable }      from '@/components/ui/GrahaTable'
import type { ChartOutput } from '@/types/astrology'

type Tab = 'chart' | 'planets' | 'dasha' | 'panchang'

// ── Panchang display (inline, no extra component needed) ──────

function PanchangPanel({ p }: { p: ChartOutput['panchang'] }) {
  const items = [
    { label: 'Vara',     value: p.vara.name,      sub: p.vara.lord },
    { label: 'Tithi',    value: p.tithi.name,     sub: `${p.tithi.paksha === 'shukla' ? '☽' : '🌑'} ${p.tithi.paksha}` },
    { label: 'Nakshatra',value: p.nakshatra.name, sub: `Pada ${p.nakshatra.pada} · ${p.nakshatra.lord}` },
    { label: 'Yoga',     value: p.yoga.name,      sub: '' },
    { label: 'Karana',   value: p.karana.name,    sub: '' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
      {items.map(({ label, value, sub }) => (
        <div key={label} className="card" style={{ padding: '1rem' }}>
          <div style={{
            fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--text-gold)', fontFamily: 'Cormorant Garamond, serif',
            marginBottom: '0.4rem',
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '1.1rem', fontFamily: 'Cormorant Garamond, serif',
            color: 'var(--text-primary)',
          }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {sub}
            </div>
          )}
        </div>
      ))}

      {/* Rahu Kalam */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', fontFamily: 'Cormorant Garamond, serif', marginBottom: '0.4rem' }}>
          Rahu Kalam
        </div>
        <div style={{ fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
          {new Date(p.rahuKalam.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          {' – '}
          {new Date(p.rahuKalam.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────

export default function HomePage() {
  const [chart,     setChart]     = useState<ChartOutput | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('chart')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        padding: '1.5rem 2rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(14,14,22,0.85)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🪐</span>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.4rem', fontWeight: 300,
            letterSpacing: '0.06em',
            color: 'var(--text-gold)',
            margin: 0,
          }}>
            Jyotiṣa
          </h1>
          <span style={{
            fontSize: '0.72rem', color: 'var(--text-muted)',
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
            letterSpacing: '0.04em',
          }}>
            The Eye of the Vedas
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          <a href="/panchang" style={{ color: 'var(--text-secondary)', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', textDecoration: 'none' }}>
            Pañcāṅga
          </a>
        </nav>
      </header>

      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: chart ? '380px 1fr' : '1fr',
        maxWidth: chart ? '1400px' : '540px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem',
        gap: '2rem',
        transition: 'max-width 0.4s ease',
        alignItems: 'start',
      }}>

        {/* Left: Birth form */}
        <div style={{ position: 'sticky', top: '5rem' }}>
          {!chart && (
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }} className="fade-up">
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 300,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
              }}>
                Vedic Birth Chart
              </h2>
              <p style={{
                color: 'var(--text-secondary)',
                fontFamily: 'Crimson Pro, serif',
                fontSize: '1.05rem',
                maxWidth: 400, margin: '0 auto',
              }}>
                Arc-second precision via Swiss Ephemeris. Lahiri ayanamsha.
                Vimshottari Dasha to Deha level.
              </p>
            </div>
          )}

          <div className={`card fade-up-${chart ? '1' : '2'}`}>
            <BirthForm onResult={setChart} onLoading={setLoading} />
          </div>
        </div>

        {/* Right: Chart result */}
        {chart && (
          <div className="fade-up" style={{ minWidth: 0 }}>

            {/* Chart header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.8rem', fontWeight: 300,
                color: 'var(--text-primary)',
                marginBottom: '0.25rem',
              }}>
                {chart.meta.name}
              </h2>
              <div style={{
                color: 'var(--text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.8rem',
                display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
              }}>
                <span>{chart.meta.birthDate} · {chart.meta.birthTime}</span>
                <span>{chart.meta.birthPlace}</span>
                <span style={{ color: 'var(--text-gold)', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>
                  Asc: {chart.lagnas.ascRashi} · JD {chart.meta.julianDay.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', gap: '0.25rem',
              borderBottom: '1px solid var(--border)',
              marginBottom: '1.5rem',
            }}>
              {([
                { id: 'chart',    label: 'Chart' },
                { id: 'planets',  label: 'Planets' },
                { id: 'dasha',    label: 'Dasha' },
                { id: 'panchang', label: 'Pañcāṅga' },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    padding: '0.5rem 1.1rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '1rem',
                    color: activeTab === id ? 'var(--text-gold)' : 'var(--text-muted)',
                    borderBottom: activeTab === id ? '2px solid var(--gold)' : '2px solid transparent',
                    marginBottom: -1,
                    transition: 'color 0.15s',
                    letterSpacing: '0.02em',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="fade-up">
              {activeTab === 'chart' && (
                <ChakraSelector
                  ascRashi={chart.lagnas.ascRashi}
                  grahas={chart.grahas}
                  size={500}
                />
              )}

              {activeTab === 'planets' && (
                <div className="card">
                  <GrahaTable grahas={chart.grahas} />
                </div>
              )}

              {activeTab === 'dasha' && (
                <div className="card">
                  <DashaTree
                    nodes={chart.dashas.vimshottari}
                    birthDate={new Date(chart.meta.birthDate)}
                  />
                </div>
              )}

              {activeTab === 'panchang' && (
                <PanchangPanel p={chart.panchang} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(14,14,22,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48,
              border: '3px solid rgba(201,168,76,0.2)',
              borderTopColor: 'var(--gold)',
              borderRadius: '50%',
              animation: 'spin-slow 0.8s linear infinite',
              margin: '0 auto 1rem',
            }} />
            <p style={{
              fontFamily: 'Cormorant Garamond, serif',
              color: 'var(--text-gold)', fontSize: '1.1rem', fontStyle: 'italic',
            }}>
              Consulting the ephemeris…
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        padding: '1.5rem 2rem',
        borderTop: '1px solid var(--border-soft)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '0.82rem',
        letterSpacing: '0.04em',
      }}>
        <p>
          Calculations powered by{' '}
          <span style={{ color: 'var(--text-gold)' }}>Swiss Ephemeris</span>
          {' '}· Lahiri ayanamsha · Kāla tier — free forever
        </p>
      </footer>
    </div>
  )
}
