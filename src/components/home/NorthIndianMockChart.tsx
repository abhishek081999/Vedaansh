'use client'

import { grahaChartFill } from '@/lib/engine/grahaDisplayColors'

const S = 100
const Q = S / 4
const M = S / 2

/** Same house polygons as NorthIndianChakra */
function polyPts(h: number): [number, number][] {
  switch (h) {
    case 1: return [[Q, Q], [M, M], [3 * Q, Q], [M, 0]]
    case 2: return [[0, 0], [Q, Q], [M, 0]]
    case 3: return [[0, 0], [0, M], [Q, Q]]
    case 4: return [[0, M], [Q, 3 * Q], [M, M], [Q, Q]]
    case 5: return [[0, M], [0, S], [Q, 3 * Q]]
    case 6: return [[Q, 3 * Q], [0, S], [M, S]]
    case 7: return [[Q, 3 * Q], [M, S], [3 * Q, 3 * Q], [M, M]]
    case 8: return [[3 * Q, 3 * Q], [M, S], [S, S]]
    case 9: return [[3 * Q, 3 * Q], [S, S], [S, M]]
    case 10: return [[3 * Q, Q], [M, M], [3 * Q, 3 * Q], [S, M]]
    case 11: return [[3 * Q, Q], [S, M], [S, 0]]
    case 12: return [[M, 0], [3 * Q, Q], [S, 0]]
    default: return []
  }
}

function centroid(pts: [number, number][]): [number, number] {
  return [
    pts.reduce((sum, p) => sum + p[0], 0) / pts.length,
    pts.reduce((sum, p) => sum + p[1], 0) / pts.length,
  ]
}

function signInHouse(h: number, ascRashi: number): number {
  return ((ascRashi - 1 + h - 1) % 12) + 1
}

function rashiPos(h: number): { x: number; y: number } {
  const o = S * 0.045
  switch (h) {
    case 1: return { x: M, y: M - o }
    case 2: return { x: Q, y: Q - o }
    case 3: return { x: Q - o, y: Q }
    case 4: return { x: M - o, y: M }
    case 5: return { x: Q - o, y: 3 * Q }
    case 6: return { x: Q, y: 3 * Q + o }
    case 7: return { x: M, y: M + o }
    case 8: return { x: 3 * Q, y: 3 * Q + o }
    case 9: return { x: 3 * Q + o, y: 3 * Q }
    case 10: return { x: M + o, y: M }
    case 11: return { x: 3 * Q + o, y: Q }
    case 12: return { x: 3 * Q, y: Q - o }
    default: return { x: M, y: M }
  }
}

type MockPlanet = {
  house: number
  id: string
  retro?: boolean
}

/** Netal sample — Scorpio Lagna D1 (matches workspace screenshot) */
const NETAL_D1_PLANETS: MockPlanet[] = [
  { house: 1, id: 'AS' },
  { house: 3, id: 'Mo' },
  { house: 4, id: 'Ra', retro: true },
  { house: 5, id: 'Sa' },
  { house: 6, id: 'Ma' },
  { house: 7, id: 'Su' },
  { house: 8, id: 'Me' },
  { house: 8, id: 'Ve' },
  { house: 9, id: 'Ju' },
  { house: 10, id: 'Ke', retro: true },
]

function planetPositions(house: number, planets: MockPlanet[]): { x: number; y: number }[] {
  const [cx, cy] = centroid(polyPts(house))
  const rp = rashiPos(house)
  const count = planets.length

  if (count === 1) {
    return [{ x: cx, y: Math.min(cy + 5, rp.y + 9) }]
  }

  if (count === 2) {
    const isWide = house === 1 || house === 4 || house === 7 || house === 10
    if (isWide) {
      return [
        { x: cx - 5, y: cy + 4 },
        { x: cx + 5, y: cy + 4 },
      ]
    }
    return [
      { x: cx, y: cy + 2 },
      { x: cx, y: cy + 8 },
    ]
  }

  return planets.map((_, i) => ({
    x: cx,
    y: cy + (i - (count - 1) / 2) * 5,
  }))
}

type NorthIndianMockChartProps = {
  ascRashi?: number
  planets?: MockPlanet[]
}

export function NorthIndianMockChart({
  ascRashi = 8,
  planets = NETAL_D1_PLANETS,
}: NorthIndianMockChartProps) {
  const byHouse: Record<number, MockPlanet[]> = {}
  for (const p of planets) {
    if (!byHouse[p.house]) byHouse[p.house] = []
    byHouse[p.house].push(p)
  }

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="landing-mockup-chart-svg landing-ni-mock-chart" aria-hidden>
      <rect width={S} height={S} fill="transparent" />

      {Array.from({ length: 12 }, (_, i) => {
        const h = i + 1
        const pts = polyPts(h)
        const sign = signInHouse(h, ascRashi)
        const rp = rashiPos(h)
        const housePlanets = byHouse[h] ?? []
        const positions = planetPositions(h, housePlanets)

        return (
          <g key={h}>
            <polygon
              points={pts.map(([x, y]) => `${x},${y}`).join(' ')}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="0.55"
              strokeOpacity="0.42"
              strokeLinejoin="round"
            />
            <text
              x={rp.x}
              y={rp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`landing-ni-mock-sign${h === 1 ? ' is-lagna' : ''}`}
            >
              {sign}
            </text>
            {housePlanets.map((planet, idx) => {
              const pos = positions[idx]
              return (
                <text
                  key={`${planet.id}-${idx}`}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="landing-ni-mock-planet"
                  fill={grahaChartFill(planet.id)}
                >
                  {planet.id}
                  {planet.retro ? (
                    <tspan className="landing-ni-mock-retro" baselineShift="super">ᴿ</tspan>
                  ) : null}
                </text>
              )
            })}
          </g>
        )
      })}

      <rect
        x={0.5}
        y={0.5}
        width={S - 1}
        height={S - 1}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.55"
        strokeOpacity="0.42"
      />
    </svg>
  )
}
