// ─────────────────────────────────────────────────────────────
//  src/components/ui/KalapurushaBodyMap.tsx
//  Kalapurusha body map — 12 rashis on body regions (Aries = head
//  … Pisces = feet), with chart-specific signs highlighted
// ─────────────────────────────────────────────────────────────
'use client'

import React from 'react'
import type { Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import { Legend } from '@/components/ui/viz'

/** Region per rashi: vertical band [y, h] and half-width in a 120×300 figure. */
const REGIONS: { rashi: Rashi; part: string; y: number; h: number; w: number; shape?: 'head' }[] = [
  { rashi: 1, part: 'Head, brain', y: 6, h: 30, w: 15, shape: 'head' },
  { rashi: 2, part: 'Face, throat', y: 38, h: 14, w: 9 },
  { rashi: 3, part: 'Shoulders, arms, lungs', y: 54, h: 20, w: 44 },
  { rashi: 4, part: 'Chest, breasts', y: 76, h: 22, w: 30 },
  { rashi: 5, part: 'Heart, upper abdomen', y: 100, h: 20, w: 28 },
  { rashi: 6, part: 'Intestines, waist', y: 122, h: 20, w: 25 },
  { rashi: 7, part: 'Lower abdomen, kidneys', y: 144, h: 18, w: 27 },
  { rashi: 8, part: 'Genitals, excretory', y: 164, h: 16, w: 24 },
  { rashi: 9, part: 'Hips, thighs', y: 182, h: 32, w: 23 },
  { rashi: 10, part: 'Knees, joints', y: 216, h: 14, w: 20 },
  { rashi: 11, part: 'Calves, ankles', y: 232, h: 36, w: 17 },
  { rashi: 12, part: 'Feet', y: 270, h: 18, w: 22 },
]

export interface BodyHighlight {
  rashi: Rashi
  color: string
  label: string
}

export function KalapurushaBodyMap({ highlights }: { highlights: BodyHighlight[] }) {
  const cx = 60
  const legend = Array.from(new Map(highlights.map((h) => [h.label, { label: h.label, color: h.color }])).values())
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 120 296" width={150} role="img" aria-label="Kalapurusha body map">
        {REGIONS.map((r) => {
          const hits = highlights.filter((h) => h.rashi === r.rashi)
          const fill = hits[0]?.color ?? 'var(--surface-3)'
          const title = `${RASHI_NAMES[r.rashi]} — ${r.part}${hits.length ? ` · ${hits.map((h) => h.label).join(', ')}` : ''}`
          const common = { fill, fillOpacity: hits.length ? 0.85 : 1, stroke: hits.length > 1 ? hits[1].color : 'var(--border)', strokeWidth: hits.length > 1 ? 2 : 0.8 }
          if (r.rashi === 9 || r.rashi === 10 || r.rashi === 11 || r.rashi === 12) {
            // Two legs
            const legW = r.w * 0.8
            return (
              <g key={r.rashi}>
                <title>{title}</title>
                <rect x={cx - 3 - legW} y={r.y} width={legW} height={r.h} rx={6} {...common} />
                <rect x={cx + 3} y={r.y} width={legW} height={r.h} rx={6} {...common} />
              </g>
            )
          }
          return (
            <g key={r.rashi}>
              <title>{title}</title>
              {r.shape === 'head' ? (
                <ellipse cx={cx} cy={r.y + r.h / 2} rx={r.w} ry={r.h / 2} {...common} />
              ) : (
                <rect x={cx - r.w} y={r.y} width={r.w * 2} height={r.h} rx={r.rashi === 3 ? 10 : 6} {...common} />
              )}
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 180 }}>
        {REGIONS.map((r) => {
          const hits = highlights.filter((h) => h.rashi === r.rashi)
          return (
            <div key={r.rashi} style={{ display: 'flex', gap: 6, alignItems: 'baseline', fontSize: '0.7rem', opacity: hits.length ? 1 : 0.6 }}>
              <span style={{ width: 70, color: hits[0]?.color ?? 'var(--text-muted)', fontWeight: hits.length ? 800 : 500 }}>{RASHI_NAMES[r.rashi]}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{r.part}</span>
            </div>
          )
        })}
        {legend.length > 0 && <div style={{ marginTop: 6 }}><Legend items={legend} /></div>}
      </div>
    </div>
  )
}
