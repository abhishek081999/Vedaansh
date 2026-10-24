'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LagnaGuideTab.tsx
//  Ascendant Guide — character profile and house-by-house reading
//  for this chart's own Lagna only
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import type { ChartOutput } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SANSKRIT, type Dignity } from '@/types/astrology'
import {
  getPlanetInHouse,
  RASHI_LORDS,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { getLagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'
import { buildLagnaChartOverlay, type HouseOverlay } from '@/lib/engine/lagnaChartOverlay'
import { getDashaTouchedHouses, getLagnaDashaLinks } from '@/lib/engine/lagnaDashaLinks'
import { LagnaCharacterGuide } from './LagnaCharacterGuide'
import { LagnaCheatSheet } from './LagnaCheatSheet'
import { LagnaDashaLinks } from './LagnaDashaLinks'

const HOUSES = Array.from({ length: 12 }, (_, i) => (i + 1) as HouseNumber)

const DIGNITY_LABEL: Partial<Record<Dignity, string>> = {
  exalted: 'exalted',
  moolatrikona: 'moolatrikona',
  own: 'own sign',
  debilitated: 'debilitated',
  great_friend: 'great friend sign',
  friend: 'friend sign',
  enemy: 'enemy sign',
  great_enemy: 'great enemy sign',
}

interface LagnaGuideTabProps {
  chart: ChartOutput
}

export function LagnaGuideTab({ chart }: LagnaGuideTabProps) {
  const ascRashi = chart.lagnas.ascRashi
  const [openHouse, setOpenHouse] = useState<HouseNumber | null>(1)

  const profile = useMemo(() => getLagnaCharacterProfile(ascRashi), [ascRashi])
  const lordRow = RASHI_LORDS.find((r) => r.number === ascRashi)

  const overlay = useMemo(() => buildLagnaChartOverlay(ascRashi, chart.grahas), [ascRashi, chart.grahas])
  const dashaLinks = useMemo(() => getLagnaDashaLinks(chart, ascRashi), [chart, ascRashi])
  const dashaHouses = useMemo(() => new Set<HouseNumber>(getDashaTouchedHouses(dashaLinks)), [dashaLinks])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        className="card"
        style={{
          padding: '1rem 1.15rem',
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div style={sectionLabel}>Ascendant guide</div>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          This chart’s Lagna is <strong style={{ color: 'var(--text-gold)' }}>{RASHI_NAMES[ascRashi]}</strong>{' '}
          ({RASHI_SANSKRIT[ascRashi]})
          {lordRow ? `, ruled by ${GRAHA_NAMES[lordRow.lord]} (${lordRow.lordHindi})` : ''}. Educational reference —
          actual planets, lords and aspects in the chart refine every reading.
        </p>
      </div>

      <LagnaCheatSheet ascRashi={ascRashi} grahas={chart.grahas} />

      <LagnaDashaLinks ascRashi={ascRashi} links={dashaLinks} onJumpToHouse={setOpenHouse} />

      <LagnaCharacterGuide ascRashi={ascRashi} />

      {profile ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              color: 'var(--text-primary)',
            }}
          >
            {profile.title} — house by house
          </h3>

          {HOUSES.map((houseNum) => {
            const reading = profile.houses[houseNum]
            const open = openHouse === houseNum
            const ov = overlay[houseNum - 1]
            const occupants = ov.occupants
            const dashaActive = dashaHouses.has(houseNum)
            return (
              <div
                key={houseNum}
                className="card"
                style={{
                  padding: 0,
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-soft)',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenHouse(open ? null : houseNum)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.9rem 1.15rem',
                    background: open ? 'var(--surface-2)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: 'inherit',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      House {houseNum} · {reading.signName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                      {reading.theme}
                      {occupants.length > 0 ? (
                        <span style={{ color: 'var(--text-gold)' }}>
                          {' '}· Occupants: {occupants.map((o) => o.id).join(' · ')}
                        </span>
                      ) : null}
                      {dashaActive ? (
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}> · Dasha active</span>
                      ) : null}
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-gold)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                    {open ? '−' : '+'}
                  </span>
                </button>
                {open ? (
                  <div style={{ padding: '0 1.15rem 1.1rem' }}>
                    <ChartOverlayBlock ov={ov} />
                    <ul
                      style={{
                        margin: '0.5rem 0 0',
                        paddingLeft: '1.1rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {reading.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )
          })}
        </section>
      ) : null}
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--text-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

function ChartOverlayBlock({ ov }: { ov: HouseOverlay }) {
  const lordName = GRAHA_NAMES[ov.lordId]
  return (
    <div
      style={{
        marginTop: '0.6rem',
        padding: '0.65rem 0.8rem',
        borderRadius: 8,
        background: 'rgba(201,168,76,0.06)',
        border: '1px solid var(--border-soft)',
        fontSize: '0.78rem',
        lineHeight: 1.55,
        color: 'var(--text-secondary)',
      }}
    >
      <div style={sectionLabel}>In your chart</div>
      <div style={{ marginTop: 4 }}>
        House lord {lordName}{' '}
        {ov.lordPlacedHouse ? (
          <>sits in house {ov.lordPlacedHouse}. Read this house’s results through that placement.</>
        ) : (
          <>placement not available.</>
        )}
      </div>
      {ov.occupants.length === 0 ? (
        <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
          No planets here; the house speaks mainly through its lord.
        </div>
      ) : (
        <ul style={{ margin: '4px 0 0', paddingLeft: '1.1rem' }}>
          {ov.occupants.map((o) => {
            const tags = [
              DIGNITY_LABEL[o.dignity],
              o.isRetro ? 'retrograde' : null,
              o.isCombust ? 'combust' : null,
            ].filter(Boolean)
            const text = getPlanetInHouse(o.id, ov.house, 'summary')
            return (
              <li key={o.id}>
                <strong style={{ color: 'var(--text-primary)' }}>{GRAHA_NAMES[o.id]}</strong>
                {tags.length > 0 ? ` (${tags.join(', ')})` : ''}
                {text ? `: ${text}` : ''}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
