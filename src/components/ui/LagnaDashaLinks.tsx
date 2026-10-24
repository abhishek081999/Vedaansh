'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LagnaDashaLinks.tsx
//  Running Maha/Antar dasha lords tied to this Lagna's house readings
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { GRAHA_NAMES, type GrahaId, type Rashi } from '@/types/astrology'
import type { HouseNumber } from '@/lib/engine/houseInterpretations'
import { getLagnaHouseReading } from '@/lib/engine/lagnaCharacter'
import type { DashaLordLink } from '@/lib/engine/lagnaDashaLinks'

interface LagnaDashaLinksProps {
  ascRashi: Rashi
  links: DashaLordLink[]
  onJumpToHouse: (house: HouseNumber) => void
}

function fmt(d: Date | null): string {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function lordName(lord: string): string {
  return GRAHA_NAMES[lord as GrahaId] ?? lord
}

export function LagnaDashaLinks({ ascRashi, links, onJumpToHouse }: LagnaDashaLinksProps) {
  if (links.length === 0) return null

  return (
    <div className="card" style={{ padding: '1rem 1.15rem', border: '1px solid var(--border-soft)' }}>
      <div style={label}>Running dasha and your Lagna</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '0.55rem' }}>
        {links.map((link) => {
          const range = [fmt(link.start), fmt(link.end)].filter(Boolean).join(' to ')
          const houses: { kind: string; house: HouseNumber }[] = []
          if (link.placedHouse) houses.push({ kind: 'Sits in', house: link.placedHouse })
          for (const h of link.ruledHouses) houses.push({ kind: 'Rules', house: h })
          return (
            <div key={link.level}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {link.level}: {lordName(link.lord)}
                {range ? (
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.72rem' }}> · {range}</span>
                ) : null}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                {houses.map(({ kind, house }) => {
                  const reading = getLagnaHouseReading(ascRashi, house)
                  return (
                    <button
                      key={`${kind}-${house}`}
                      type="button"
                      onClick={() => onJumpToHouse(house)}
                      style={{
                        textAlign: 'left',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 8,
                        padding: '0.45rem 0.65rem',
                        cursor: 'pointer',
                        color: 'inherit',
                        fontSize: '0.76rem',
                        lineHeight: 1.45,
                      }}
                    >
                      <span style={{ color: 'var(--text-gold)', fontWeight: 700 }}>
                        {kind} house {house}
                      </span>
                      {reading ? (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {' '}· {reading.signName}: {reading.theme}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
                {houses.length === 0 ? (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    House placement not available for this lord.
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      <p style={{ margin: '0.65rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Rahu and Ketu own no house; read them through their sign lord and conjunctions. Tap a house to open its reading below.
      </p>
    </div>
  )
}

const label: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--text-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}
