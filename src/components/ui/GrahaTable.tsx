// ─────────────────────────────────────────────────────────────
//  src/components/ui/GrahaTable.tsx
//  Planet positions table — degrees, nakshatra, dignity, karaka
// ─────────────────────────────────────────────────────────────
'use client'

import type { GrahaData } from '@/types/astrology'
import { NAKSHATRA_LORDS } from '@/types/astrology'

const GRAHA_FULL: Record<string, string> = {
  Su: 'Sun',  Mo: 'Moon',  Ma: 'Mars',    Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
}

const RASHI_NAMES: Record<number, string> = {
  1:'Aries', 2:'Taurus', 3:'Gemini', 4:'Cancer',
  5:'Leo',   6:'Virgo',  7:'Libra',  8:'Scorpio',
  9:'Sagittarius', 10:'Capricorn', 11:'Aquarius', 12:'Pisces',
}

function dignityBadge(dignity: string) {
  const isGold = ['exalted', 'moolatrikona', 'own', 'great_friend'].includes(dignity)
  const isDanger = ['debilitated', 'great_enemy', 'enemy'].includes(dignity)

  let bg = 'rgba(255,255,255,0.05)'
  let color = 'var(--text-muted)'
  let text = dignity.replace('_', ' ')

  if (isGold) {
    bg = 'var(--gold-faint)'
    color = 'var(--text-gold)'
  } else if (isDanger) {
    bg = 'rgba(224,123,142,0.1)'
    color = 'var(--rose)'
  } else if (dignity === 'friend') {
    bg = 'rgba(78,205,196,0.1)'
    color = 'var(--teal)'
  }

  if (dignity === 'neutral') text = 'Neutral'

  return (
    <span style={{
      display: 'inline-block',
      padding: '0.25rem 0.6rem',
      borderRadius: '999px',
      background: bg,
      color: color,
      fontSize: '0.68rem',
      fontWeight: 600,
      textTransform: 'capitalize',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap'
    }}>
      {text}
    </span>
  )
}

function fmtDeg(deg: number) {
  const d = Math.floor(deg)
  const m = Math.floor((deg - d) * 60)
  const s = Math.round(((deg - d) * 60 - m) * 60)
  return `${String(d).padStart(2,'0')}° ${String(m).padStart(2,'0')}' ${String(s).padStart(2,'0')}"`
}

interface GrahaTableProps {
  grahas: GrahaData[]
}

export function GrahaTable({ grahas }: GrahaTableProps) {
  // Sort so Sun is first... or just use the passed array
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
      }}>
        <thead>
          <tr style={{
            borderBottom: '2px solid var(--border)',
          }}>
            {['GRAHA', 'LONGITUDE', 'NAKSHATRA', 'PADA', 'LORD', 'DIGNITY'].map((h) => (
              <th key={h} style={{
                padding: '0.75rem 0.5rem',
                color: 'var(--rose)', // The deep crimson/red color from image
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem' }}>
          {grahas.map((g, i) => {
            const lordId = NAKSHATRA_LORDS[g.nakshatraIndex]
            const lordName = GRAHA_FULL[lordId] || lordId

            return (
              <tr
                key={g.id}
                style={{
                  borderBottom: '1px solid var(--border-soft)',
                  background: i % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gold-faint)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'transparent')}
              >
                {/* Graha name */}
                <td style={{ padding: '0.85rem 0.5rem' }}>
                  <span style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    color: g.isRetro ? 'var(--rose)' : 'var(--text-primary)',
                  }}>
                    {GRAHA_FULL[g.id]}
                    {g.isRetro && <span style={{ fontSize: '0.7rem', verticalAlign: 'top', marginLeft: 2 }}>(R)</span>}
                  </span>
                </td>

                {/* Longitude (Sign + Degree) */}
                <td style={{ padding: '0.85rem 0.5rem', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, marginRight: '0.5rem' }}>
                    {RASHI_NAMES[g.rashi]}
                  </span>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}>
                    {fmtDeg(g.degree)}
                  </span>
                </td>

                {/* Nakshatra */}
                <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-secondary)' }}>
                  {g.nakshatraName}
                </td>

                {/* Pada */}
                <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-secondary)' }}>
                  {g.pada}
                </td>

                {/* Lord */}
                <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {lordName}
                </td>

                {/* Dignity */}
                <td style={{ padding: '0.85rem 0.5rem' }}>
                  {dignityBadge(g.dignity)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

