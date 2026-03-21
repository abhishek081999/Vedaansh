// ─────────────────────────────────────────────────────────────
//  src/components/ui/AshtakavargaGrid.tsx
//  Ashtakavarga — BAV grids + SAV display
// ─────────────────────────────────────────────────────────────
'use client'

import { useState } from 'react'
import type { AshtakavargaResult } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'

const PLANET_ORDER = ['Su','Mo','Ma','Me','Ju','Ve','Sa']
const PLANET_NAMES: Record<string, string> = {
  Su:'Sun', Mo:'Moon', Ma:'Mars', Me:'Mercury',
  Ju:'Jupiter', Ve:'Venus', Sa:'Saturn',
}
const PLANET_SYMBOL: Record<string, string> = {
  Su:'☀', Mo:'☽', Ma:'♂', Me:'☿', Ju:'♃', Ve:'♀', Sa:'♄',
}
const PLANET_COLOR: Record<string, string> = {
  Su:'#e8a730', Mo:'#b0c8e0', Ma:'#e05050',
  Me:'#50c878', Ju:'#f5d06e', Ve:'#f0a0c0', Sa:'#9988cc',
}

// Color for bindu count: 0-2 weak, 3-4 moderate, 5-6 good, 7-8 excellent
function binduColor(n: number): { bg: string; color: string; weight: number } {
  if (n >= 7) return { bg: 'rgba(78,205,196,0.20)',   color: 'var(--teal)',       weight: 700 }
  if (n >= 5) return { bg: 'rgba(78,205,196,0.10)',   color: 'var(--teal)',       weight: 600 }
  if (n >= 4) return { bg: 'rgba(201,168,76,0.10)',   color: 'var(--text-gold)',  weight: 500 }
  if (n >= 3) return { bg: 'rgba(201,168,76,0.06)',   color: 'var(--text-secondary)', weight: 400 }
  if (n >= 2) return { bg: 'rgba(224,123,142,0.06)',  color: 'var(--text-muted)', weight: 400 }
  return           { bg: 'rgba(224,123,142,0.14)',   color: 'var(--rose)',        weight: 700 }
}

// SAV color: ≥30 excellent, 25-29 good, 20-24 average, <20 weak
function savColor(n: number): { bg: string; color: string } {
  if (n >= 30) return { bg: 'rgba(78,205,196,0.18)',  color: 'var(--teal)' }
  if (n >= 25) return { bg: 'rgba(78,205,196,0.09)',  color: 'var(--teal)' }
  if (n >= 20) return { bg: 'rgba(201,168,76,0.10)',  color: 'var(--text-gold)' }
  return             { bg: 'rgba(224,123,142,0.14)', color: 'var(--rose)' }
}

// ── Single BAV grid ───────────────────────────────────────────
function BAVGrid({ planet, bindus, total, ascRashi }: {
  planet: string; bindus: number[]; total: number; ascRashi: number; key?: string
}) {
  const col   = PLANET_COLOR[planet] ?? 'var(--gold)'
  const houses = Array.from({ length: 12 }, (_, i) => {
    const houseNum = i + 1
    const rashiIdx = ((ascRashi - 1 + i) % 12)   // 0-based rashi index
    return { house: houseNum, rashi: rashiIdx + 1, bindu: bindus[i] }
  })

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderTop: `3px solid ${col}`,
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.6rem 0.85rem',
        borderBottom: '1px solid var(--border-soft)',
        background: 'var(--surface-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: col }}>{PLANET_SYMBOL[planet]}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {PLANET_NAMES[planet]}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Total: <span style={{ color: col, fontWeight: 700 }}>{total}</span>
        </div>
      </div>

      {/* 12 house cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {houses.map(({ house, rashi, bindu }) => {
          const style = binduColor(bindu)
          return (
            <div key={house} style={{
              padding: '0.5rem 0.3rem',
              background: style.bg,
              borderRight: '1px solid var(--border-soft)',
              borderBottom: '1px solid var(--border-soft)',
              textAlign: 'center',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                H{house}
              </div>
              <div style={{
                fontSize: '1rem', fontWeight: style.weight,
                fontFamily: 'var(--font-mono)', color: style.color,
                lineHeight: 1,
              }}>
                {bindu}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                {RASHI_SHORT[rashi as keyof typeof RASHI_SHORT]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── SAV Summary Bar ───────────────────────────────────────────
function SAVBar({ sav, ascRashi }: { sav: number[]; ascRashi: number }) {
  const houses = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    rashi: ((ascRashi - 1 + i) % 12) + 1,
    bindu: sav[i],
  }))
  const max = Math.max(...sav, 1)

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border-bright)',
      borderTop: '3px solid var(--gold)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.6rem 0.85rem',
        borderBottom: '1px solid var(--border-soft)',
        background: 'rgba(201,168,76,0.06)',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-gold)', fontSize: '0.95rem' }}>
          Sarvaṣṭakavarga (SAV)
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Total: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{sav.reduce((a,b)=>a+b,0)}</span>
          <span style={{ marginLeft: 8, opacity: 0.6 }}>/ 337 typical</span>
        </span>
      </div>

      {/* Grid view */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {houses.map(({ house, rashi, bindu }) => {
          const style = savColor(bindu)
          const pct   = (bindu / max) * 100
          return (
            <div key={house} style={{
              padding: '0.6rem 0.4rem',
              background: style.bg,
              borderRight: '1px solid var(--border-soft)',
              borderBottom: '1px solid var(--border-soft)',
              textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>H{house}</div>
              <div style={{
                fontSize: '1.1rem', fontWeight: 700,
                fontFamily: 'var(--font-mono)', color: style.color,
              }}>
                {bindu}
              </div>
              {/* Mini bar */}
              <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden', margin: '0 4px' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: style.color, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                {RASHI_SHORT[rashi as keyof typeof RASHI_SHORT]}
              </div>
            </div>
          )
        })}
      </div>

      {/* Strength legend */}
      <div style={{ padding: '0.5rem 0.85rem', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: '≥30 Excellent', color: 'var(--teal)' },
          { label: '25–29 Good',    color: 'var(--teal)', opacity: 0.6 },
          { label: '20–24 Average', color: 'var(--text-gold)' },
          { label: '<20 Weak',      color: 'var(--rose)' },
        ].map(({ label, color, opacity }) => (
          <span key={label} style={{ fontSize: '0.68rem', fontFamily: 'var(--font-display)', color, opacity }}>
            ● {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function AshtakavargaGrid({
  ashtakavarga, ascRashi,
}: {
  ashtakavarga: AshtakavargaResult
  ascRashi:     number
}) {
  const [view, setView] = useState<'sav' | 'bav'>('sav')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <div className="label-caps" style={{ flex: 1 }}>Aṣṭakavarga</div>
        {(['sav', 'bav'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '0.3rem 0.75rem',
            background: view === v ? 'rgba(201,168,76,0.15)' : 'var(--surface-2)',
            border: `1px solid ${view === v ? 'var(--border-bright)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: '0.82rem',
            fontWeight: view === v ? 700 : 500,
            color: view === v ? 'var(--text-gold)' : 'var(--text-secondary)',
          }}>
            {v === 'sav' ? 'SAV (Total)' : 'BAV (Per Planet)'}
          </button>
        ))}
      </div>

      {view === 'sav' && (
        <SAVBar sav={ashtakavarga.sav} ascRashi={ascRashi} />
      )}

      {view === 'bav' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
          {PLANET_ORDER.map(planet => {
            const bav = ashtakavarga.bav[planet]
            if (!bav) return null
            return (
              <BAVGrid
                key={planet}
                planet={planet}
                bindus={bav.bindus}
                total={bav.total}
                ascRashi={ascRashi}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}