// ─────────────────────────────────────────────────────────────
//  src/components/chakra/SouthIndianChakra.tsx
//  South Indian chart — 4×3 fixed grid, signs fixed in cells
//  Signs never move; Lagna marker shows ascendant sign
// ─────────────────────────────────────────────────────────────
'use client'

import type { GrahaData, Rashi } from '@/types/astrology'

// ── Layout constants ─────────────────────────────────────────

// Grid: 4 cols × 4 rows = 16 cells; 4 corner cells are empty
// Signs are fixed: Pisces top-left, clockwise around border
//
//   Pi  Ar  Ta  Ge
//   Aq   ·   ·  Cn
//   Cp   ·   ·  Le
//   Sg  Sc  Li  Vi

const SIGN_CELLS: Record<number, [number, number]> = {
  12: [0, 0], 1: [0, 1], 2: [0, 2],  3: [0, 3],
  11: [1, 0],                          4: [1, 3],
  10: [2, 0],                          5: [2, 3],
   9: [3, 0], 8: [3, 1], 7: [3, 2],  6: [3, 3],
}

// ── Sign abbreviations ───────────────────────────────────────

const SIGN_ABBR: Record<number, string> = {
  1:'Ar', 2:'Ta', 3:'Ge', 4:'Cn', 5:'Le', 6:'Vi',
  7:'Li', 8:'Sc', 9:'Sg', 10:'Cp', 11:'Aq', 12:'Pi',
}

// Graha display labels
const GRAHA_LABEL: Record<string, string> = {
  Su:'Su', Mo:'Mo', Ma:'Ma', Me:'Me',
  Ju:'Ju', Ve:'Ve', Sa:'Sa', Ra:'Ra', Ke:'Ke',
}

// ── Dignity colours ──────────────────────────────────────────

function dignityColor(dignity: string, isRetro: boolean): string {
  if (isRetro) return '#d4788a'
  switch (dignity) {
    case 'exalted':      return '#4ecdc4'
    case 'moolatrikona': return '#c9a84c'
    case 'own':          return '#e2c97e'
    case 'debilitated':  return '#e07070'
    default:             return '#c8c0e0'
  }
}

// ── Props ────────────────────────────────────────────────────

interface SouthIndianProps {
  ascRashi:     Rashi
  grahas:       GrahaData[]
  size?:        number
  showDegrees?: boolean
  showNakshatra?:boolean
  showKaraka?:  boolean
  interactive?: boolean
  onCellClick?: (rashi: Rashi) => void
  highlightRashi?: Rashi | null
}

// ── Component ────────────────────────────────────────────────

export function SouthIndianChakra({
  ascRashi,
  grahas,
  size = 480,
  showDegrees = true,
  showNakshatra = false,
  showKaraka = false,
  interactive = false,
  onCellClick,
  highlightRashi = null,
}: SouthIndianProps) {
  const cell = size / 4

  // Group grahas by rashi
  const byRashi: Record<number, GrahaData[]> = {}
  for (const g of grahas) {
    if (!byRashi[g.rashi]) byRashi[g.rashi] = []
    byRashi[g.rashi].push(g)
  }

  // Font sizes relative to cell
  const fs = {
    sign:   Math.round(cell * 0.09),
    graha:  Math.round(cell * 0.115),
    degree: Math.round(cell * 0.082),
    lagna:  Math.round(cell * 0.085),
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-label="South Indian birth chart"
    >
      <defs>
        <filter id="glow-cell">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width={size} height={size} fill="var(--surface-1, #1a1a2e)" rx="8" />

      {/* Grid cells */}
      {Object.entries(SIGN_CELLS).map(([signStr, [row, col]]) => {
        const sign      = Number(signStr) as Rashi
        const isAsc     = sign === ascRashi
        const isHi      = sign === highlightRashi
        const x         = col * cell
        const y         = row * cell
        const cellGrahas = byRashi[sign] ?? []

        return (
          <g
            key={sign}
            onClick={() => interactive && onCellClick?.(sign)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            {/* Cell background */}
            <rect
              x={x + 0.5} y={y + 0.5}
              width={cell - 1} height={cell - 1}
              fill={
                isHi   ? 'rgba(123,104,238,0.15)' :
                isAsc  ? 'rgba(201,168,76,0.08)'  :
                         'rgba(255,255,255,0.015)'
              }
              stroke={
                isAsc ? 'rgba(201,168,76,0.5)' :
                        'rgba(201,168,76,0.12)'
              }
              strokeWidth={isAsc ? 1.5 : 0.75}
            />

            {/* Sign number — top-left corner */}
            <text
              x={x + cell * 0.07}
              y={y + cell * 0.18}
              fontSize={fs.sign}
              fill="rgba(201,168,76,0.35)"
              fontFamily="Cormorant Garamond, serif"
            >
              {sign}
            </text>

            {/* Sign abbreviation — top-right */}
            <text
              x={x + cell * 0.93}
              y={y + cell * 0.18}
              fontSize={fs.sign}
              fill="rgba(201,168,76,0.25)"
              fontFamily="Cormorant Garamond, serif"
              textAnchor="end"
            >
              {SIGN_ABBR[sign]}
            </text>

            {/* Lagna marker (diagonal cross lines in top-left of cell) */}
            {isAsc && (
              <g stroke="rgba(201,168,76,0.7)" strokeWidth="1" strokeLinecap="round">
                <line x1={x + 4} y1={y + 4} x2={x + cell * 0.22} y2={y + 4} />
                <line x1={x + 4} y1={y + 4} x2={x + 4} y2={y + cell * 0.22} />
                <text
                  x={x + cell * 0.5}
                  y={y + cell * 0.96}
                  fontSize={fs.lagna}
                  fill="rgba(201,168,76,0.55)"
                  fontFamily="Cormorant Garamond, serif"
                  textAnchor="middle"
                  fontStyle="italic"
                >
                  Asc
                </text>
              </g>
            )}

            {/* Grahas */}
            {cellGrahas.map((g, i) => {
              const lineH = cell / (Math.max(cellGrahas.length, 1) + 1.2)
              const yPos  = y + cell * 0.3 + i * lineH * 1.1
              const color = dignityColor(g.dignity, g.isRetro)

              // Build label: "Su(R) 15°"
              const retMark = g.isRetro ? 'ᴿ' : ''
              const degStr  = showDegrees
                ? ` ${Math.floor(g.degree)}°${String(Math.floor((g.degree % 1) * 60)).padStart(2,'0')}'`
                : ''
              const karakaStr = showKaraka && g.charaKaraka
                ? ` [${g.charaKaraka}]`
                : ''

              return (
                <g key={g.id}>
                  <text
                    x={x + cell * 0.12}
                    y={yPos}
                    fontSize={fs.graha}
                    fill={color}
                    fontFamily="Cormorant Garamond, serif"
                    fontWeight="500"
                  >
                    {GRAHA_LABEL[g.id]}{retMark}
                  </text>
                  {(showDegrees || showKaraka) && (
                    <text
                      x={x + cell * 0.12}
                      y={yPos + fs.degree + 1}
                      fontSize={fs.degree}
                      fill="rgba(184,176,212,0.65)"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {degStr}{karakaStr}
                    </text>
                  )}
                  {showNakshatra && (
                    <text
                      x={x + cell * 0.12}
                      y={yPos + fs.degree * 2 + 2}
                      fontSize={fs.degree * 0.88}
                      fill="rgba(184,176,212,0.45)"
                      fontFamily="Cormorant Garamond, serif"
                      fontStyle="italic"
                    >
                      {g.nakshatraName.slice(0,3)}{g.pada}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}

      {/* Center decorative diamond */}
      <g opacity="0.25">
        <line x1={cell} y1={cell} x2={cell*3} y2={cell}   stroke="rgba(201,168,76,0.4)" strokeWidth="0.5" />
        <line x1={cell} y1={cell*3} x2={cell*3} y2={cell*3} stroke="rgba(201,168,76,0.4)" strokeWidth="0.5" />
        <line x1={cell} y1={cell} x2={cell} y2={cell*3}   stroke="rgba(201,168,76,0.4)" strokeWidth="0.5" />
        <line x1={cell*3} y1={cell} x2={cell*3} y2={cell*3} stroke="rgba(201,168,76,0.4)" strokeWidth="0.5" />
        {/* Diagonal cross inside center */}
        <line x1={cell} y1={cell} x2={cell*3} y2={cell*3} stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
        <line x1={cell*3} y1={cell} x2={cell} y2={cell*3} stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
      </g>
    </svg>
  )
}
