// ─────────────────────────────────────────────────────────────
//  src/components/ui/GrahaTable.tsx
//  Planet positions table — degrees, nakshatra, dignity, karaka
// ─────────────────────────────────────────────────────────────
'use client'

import type { GrahaData } from '@/types/astrology'

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
  const map: Record<string, { cls: string; label: string }> = {
    exalted:      { cls: 'badge badge-exalt', label: 'Exalted' },
    moolatrikona: { cls: 'badge badge-gold',  label: 'Moolatrikona' },
    own:          { cls: 'badge badge-gold',  label: 'Own sign' },
    debilitated:  { cls: 'badge badge-debil', label: 'Debilitated' },
    neutral:      { cls: '', label: '' },
  }
  const d = map[dignity] ?? { cls: '', label: '' }
  if (!d.label) return null
  return <span className={d.cls} style={{ fontSize: '0.7rem' }}>{d.label}</span>
}

function fmtDeg(deg: number) {
  const d = Math.floor(deg)
  const m = Math.floor((deg - d) * 60)
  const s = Math.round(((deg - d) * 60 - m) * 60)
  return `${d}°${String(m).padStart(2,'0')}'${String(s).padStart(2,'0')}"`
}

interface GrahaTableProps {
  grahas: GrahaData[]
}

export function GrahaTable({ grahas }: GrahaTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '0.95rem',
      }}>
        <thead>
          <tr style={{
            borderBottom: '1px solid var(--border-bright)',
            color: 'var(--text-gold)',
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {['Graha','Sign','Degree','Nakshatra / Pada','Dignity','Karaka','Status'].map((h) => (
              <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 400 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grahas.map((g, i) => (
            <tr
              key={g.id}
              style={{
                borderBottom: '1px solid var(--border-soft)',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent')}
            >
              {/* Graha name */}
              <td style={{ padding: '0.6rem 0.75rem' }}>
                <span style={{
                  fontWeight: 500,
                  color: g.isRetro ? 'var(--rose)' : 'var(--text-primary)',
                  fontSize: '1rem',
                }}>
                  {GRAHA_FULL[g.id]}
                </span>
                <span style={{
                  marginLeft: 6, fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {g.id}
                </span>
              </td>

              {/* Sign */}
              <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>
                {RASHI_NAMES[g.rashi]}
                <span style={{
                  marginLeft: 6, fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {g.rashi}
                </span>
              </td>

              {/* Degree */}
              <td style={{
                padding: '0.6rem 0.75rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}>
                {fmtDeg(g.degree)}
              </td>

              {/* Nakshatra / Pada */}
              <td style={{ padding: '0.6rem 0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {g.nakshatraName}
                </span>
                <span style={{
                  marginLeft: 6,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}>
                  Pada {g.pada}
                </span>
              </td>

              {/* Dignity */}
              <td style={{ padding: '0.6rem 0.75rem' }}>
                {dignityBadge(g.dignity)}
              </td>

              {/* Karaka */}
              <td style={{ padding: '0.6rem 0.75rem' }}>
                {g.charaKaraka && (
                  <span style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '0.82rem',
                    color: 'var(--text-gold)',
                    fontStyle: 'italic',
                  }}>
                    {g.charaKaraka}
                  </span>
                )}
              </td>

              {/* Status */}
              <td style={{ padding: '0.6rem 0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {g.isRetro && (
                    <span className="badge badge-retro" style={{ fontSize: '0.68rem' }}>Retro</span>
                  )}
                  {g.isCombust && (
                    <span style={{
                      fontSize: '0.68rem', padding: '0.15rem 0.5rem',
                      background: 'rgba(228,104,58,0.12)',
                      color: '#e4683a',
                      border: '1px solid rgba(228,104,58,0.3)',
                      borderRadius: 99,
                      fontFamily: 'Cormorant Garamond, serif',
                      letterSpacing: '0.05em',
                    }}>
                      Combust
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
