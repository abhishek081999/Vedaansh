// ─────────────────────────────────────────────────────────────
//  EastIndianChakra.tsx — Bengali / Odisha style
//
//  SIGNS FIXED (like South Indian). Aries always top-centre.
//  Signs go ANTI-CLOCKWISE.
//  Ascendant cell gets highlighted. House numbers not shown.
//
//  Fixed sign grid:
//   [Pi|Aq]  [ Ar ]  [Ta|Ge]
//   [ Cp  ]  [ ॐ  ]  [ Cn  ]
//   [Sg|Sc]  [ Li ]  [Vi|Le]
//
//  Anti-clockwise from Ar(1):
//  Top-centre=Ar(1), TL-upper=Pi(12), TL-lower=Aq(11),
//  Left=Cp(10), BL-upper=Sg(9), BL-lower=Sc(8),
//  Bot=Li(7), BR-lower=Vi(6), BR-upper=Le(5),
//  Right=Cn(4), TR-lower=Ge(3), TR-upper=Ta(2)
// ─────────────────────────────────────────────────────────────
'use client'

import React from 'react'
import type { GrahaData, Rashi, ArudhaData } from '@/types/astrology'

function dignityColor(dignity: string, isRetro: boolean): string {
  if (isRetro) return 'var(--dig-retro)'
  switch (dignity) {
    case 'exalted':      return 'var(--dig-exalted)'
    case 'moolatrikona': return 'var(--dig-moola)'
    case 'own':          return 'var(--dig-own)'
    case 'debilitated':  return 'var(--dig-debilitate)'
    default:             return 'var(--dig-neutral)'
  }
}

type Pt = [number, number]
const poly = (pts: Pt[]) => pts.map(([x,y]) => `${x},${y}`).join(' ')
const cen  = (pts: Pt[]): Pt => [
  pts.reduce((s,p) => s+p[0], 0) / pts.length,
  pts.reduce((s,p) => s+p[1], 0) / pts.length,
]

const SIGN_ABBR: Record<number,string> = {
  1:'Ar',2:'Ta',3:'Ge',4:'Cn',5:'Le',6:'Vi',
  7:'Li',8:'Sc',9:'Sg',10:'Cp',11:'Aq',12:'Pi',
}

const ARUDHA_LABEL: Record<string,string> = {
  AL:'AL',A2:'A2',A3:'A3',A4:'A4',A5:'A5',A6:'A6',
  A7:'A7',A8:'A8',A9:'A9',A10:'A10',A11:'A11',A12:'UL',
}

// Signs go anti-clockwise from Ar at top-centre:
// Ar(1)=top, Pi(12)=TL-upper, Aq(11)=TL-lower, Cp(10)=left,
// Sg(9)=BL-upper, Sc(8)=BL-lower, Li(7)=bot,
// Vi(6)=BR-lower, Le(5)=BR-upper, Cn(4)=right,
// Ge(3)=TR-lower, Ta(2)=TR-upper

function makeCells(c: number): { sign: Rashi; pts: Pt[]; rect?: boolean }[] {
  return [
    // TL — \ diagonal: Pi(12) upper-right, Aq(11) lower-left
    { sign:12, pts:[[0,0],[c,0],[c,c]]                               },
    { sign:11, pts:[[0,0],[c,c],[0,c]]                               },
    // Top-centre rect = Ar(1)
    { sign:1,  pts:[[c,0],[2*c,0],[2*c,c],[c,c]],           rect:true },
    // TR — / diagonal: Ge(3) upper-left, Ta(2) lower-right
    { sign:3,  pts:[[2*c,0],[3*c,0],[2*c,c]]                         },
    { sign:2,  pts:[[3*c,0],[3*c,c],[2*c,c]]                         },
    // Left rect = Cp(10)
    { sign:10, pts:[[0,c],[c,c],[c,2*c],[0,2*c]],           rect:true },
    // Right rect = Cn(4)
    { sign:4,  pts:[[2*c,c],[3*c,c],[3*c,2*c],[2*c,2*c]],   rect:true },
    // BL — \ diagonal: Vi(6) upper-right, Le(5) lower-left
    { sign:6,  pts:[[0,2*c],[c,2*c],[c,3*c]]                         },
    { sign:5,  pts:[[0,2*c],[c,3*c],[0,3*c]]                         },
    // Bot-centre rect = Li(7)
    { sign:7,  pts:[[c,2*c],[2*c,2*c],[2*c,3*c],[c,3*c]],   rect:true },
    // BR — / diagonal: Sg(9) upper-left, Sc(8) lower-right
    { sign:9,  pts:[[2*c,2*c],[3*c,2*c],[2*c,3*c]]                   },
    { sign:8,  pts:[[3*c,2*c],[3*c,3*c],[2*c,3*c]]                   },
  ]
}

// Planet anchor per sign (in c units)
const ANCHOR: Record<number,[number,number]> = {
   1: [1.50,0.52],
  12: [0.68,0.35],  11: [0.32,0.65],  // TL: Pi upper-right, Aq lower-left
  10: [0.50,1.50],
   3: [2.32,0.35],   2: [2.68,0.65],  // TR: Ge upper-left, Ta lower-right
   4: [2.50,1.50],
   6: [0.68,2.35],   5: [0.32,2.65],  // BL: Vi upper-right, Le lower-left
   7: [1.50,2.50],
   9: [2.32,2.35],   8: [2.68,2.65],  // BR: Sg upper-left, Sc lower-right
}

const SLABEL: Record<number,[number,number]> = {
   1: [1.50,0.14],
  12: [0.78,0.22],  11: [0.22,0.78],
  10: [0.14,1.50],
   3: [2.22,0.22],   2: [2.78,0.78],
   4: [2.86,1.50],
   6: [0.78,2.22],   5: [0.22,2.78],
   7: [1.50,2.86],
   9: [2.22,2.22],   8: [2.78,2.78],
}

interface Props {
  ascRashi:       Rashi
  grahas:         GrahaData[]
  size?:          number
  showDegrees?:   boolean
  showNakshatra?: boolean
  showKaraka?:    boolean
  showArudha?:    boolean
  arudhas?:       ArudhaData
  transitGrahas?: GrahaData[]
  fontScale?:     number
  planetScale?:   number
  arudhaScale?:   number
  infoScale?:     number
  interactive?:   boolean
  onCellClick?:   (rashi: Rashi) => void
}

export function EastIndianChakra({
  ascRashi, grahas, size=480,
  showDegrees=true, showNakshatra=false, showKaraka=false,
  showArudha=false, arudhas, transitGrahas=[],
  fontScale=1.0, planetScale=1.0, arudhaScale=1.0, infoScale=1.0,
  interactive=false, onCellClick,
}: Props) {
  const S = size
  const c = S / 3
  const cells = makeCells(c)

  const BASE_PL  = S * 0.038 * fontScale * planetScale
  const BASE_DEG = S * 0.024 * fontScale * infoScale

  // Group by rashi (signs fixed)
  const byRashi: Record<number, GrahaData[]> = {}
  for (const g of grahas) { (byRashi[g.rashi] ??= []).push(g) }

  const tByRashi: Record<number, GrahaData[]> = {}
  for (const g of transitGrahas) { (tByRashi[g.rashi] ??= []).push(g) }

  const aByRashi: Record<number, string[]> = {}
  if (showArudha && arudhas) {
    const KEYS = ['AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] as const
    for (const key of KEYS) {
      const r = arudhas[key] as Rashi|undefined
      if (r) (aByRashi[r] ??= []).push(key)
    }
  }

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S}
      style={{ display:'block', maxWidth:'100%', height:'auto', overflow:'visible' }}
      aria-label="East Indian birth chart"
    >
      <rect width={S} height={S} fill="transparent"/>

      {/* Centre */}
      <rect x={c+0.5} y={c+0.5} width={c-1} height={c-1}
        fill="transparent" stroke="var(--gold,#c9a84c)" strokeWidth={1.25}/>
      <text x={S/2} y={S/2} textAnchor="middle" dominantBaseline="central"
        fontSize={c*0.38} fill="rgba(201,168,76,0.18)" fontFamily="var(--font-chart-planets)">ॐ</text>

      {cells.map(({ sign, pts, rect }) => {
        const isLagna  = sign === ascRashi
        const planets  = byRashi[sign]  ?? []
        const transits = tByRashi[sign] ?? []
        const aList    = aByRashi[sign] ?? []

        const [lx,ly] = (SLABEL[sign]  ?? [1.5,1.5]).map(v=>v*c) as [number,number]
        const [ax,ay] = (ANCHOR[sign]  ?? [1.5,1.5]).map(v=>v*c) as [number,number]

        const plFont  = rect ? Math.min(BASE_PL,c*0.19) : Math.min(BASE_PL*0.82,c*0.155)
        const degFont = Math.min(BASE_DEG*(rect?1:0.82), plFont*0.72)
        const lineH   = plFont*1.15 + (showDegrees?degFont*1.1:0) + (showNakshatra?degFont*0.95:0)
        const aFont   = Math.min(plFont*0.82,S*0.026)*arudhaScale
        const n       = planets.length
        const two     = n>3 && !!rect
        const rows    = two ? Math.ceil(n/2) : n
        const cOff    = two ? c*0.22 : 0
        const totalPl = rows*lineH
        const totalA  = aList.length ? aFont*1.3*Math.ceil(aList.length/3) : 0
        const startY  = ay - (totalPl+totalA)/2
        const sf      = Math.round(Math.min(plFont*0.78, c*0.115))

        return (
          <g key={sign}
            onClick={() => interactive && onCellClick?.(sign)}
            style={{ cursor: interactive?'pointer':'default' }}
          >
            <polygon points={poly(pts)}
              fill={isLagna ? 'var(--gold-faint)' : 'transparent'}
              stroke="var(--gold,#c9a84c)"
              strokeWidth={isLagna?2:1.25} strokeLinejoin="round"
            />

            {/* Sign number */}
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize={sf} fontWeight="600"
              fontFamily="var(--font-mono,monospace)"
              fill={isLagna?'var(--gold)':'var(--chart-sign-green,#6aaa6a)'}
              opacity={0.9}
            >{sign}</text>

            {/* Planets */}
            {planets.map((g,gi) => {
              const col  = two?gi%2:0
              const row  = two?Math.floor(gi/2):gi
              const px   = ax+(two?(col===0?-cOff:cOff):0)
              const py   = startY+row*lineH+plFont*0.55
              const fc   = dignityColor(g.dignity,g.isRetro)
              const ret  = g.isRetro?'ᴿ':''
              const kar  = showKaraka&&g.charaKaraka?` [${g.charaKaraka}]`:''
              const deg  = showDegrees
                ? `${Math.floor(g.degree)}°${String(Math.floor((g.degree%1)*60)).padStart(2,'0')}'` : ''
              return (
                <g key={g.id}>
                  <text x={px} y={py} textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.round(plFont)} fontWeight="500"
                    fontFamily="var(--font-chart-planets)" fill={fc}
                  >{g.id}{ret}{kar}</text>
                  {showDegrees && <text x={px} y={py+plFont*0.72+degFont*0.5}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.round(degFont)} fontFamily="JetBrains Mono,monospace"
                    fill="var(--text-muted)">{deg}</text>}
                  {showNakshatra && <text x={px}
                    y={py+plFont*0.72+degFont*(showDegrees?1.65:0.5)}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.round(degFont*0.85)} fontStyle="italic"
                    fontFamily="var(--font-chart-planets)" fill="var(--text-muted)"
                  >{g.nakshatraName?.slice(0,3)} {g.pada}</text>}
                </g>
              )
            })}

            {/* Transits */}
            {transits.map((tg,ti) => (
              <text key={`t-${tg.id}`}
                x={ax+(transits.length>1?(ti%2===0?-c*0.12:c*0.12):0)}
                y={ay+c*0.08+Math.floor(ti/2)*plFont*1.3}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.round(plFont*0.88)} fontWeight={700}
                fontFamily="var(--font-mono)"
                fill={tg.isRetro?'rgba(200,140,255,0.9)':'rgba(139,124,246,0.9)'}
              >{tg.id}{tg.isRetro?'℞':''}</text>
            ))}

            {/* Āruḍha */}
            {aList.length>0 && (() => {
              const baseY = startY+totalPl+aFont*0.7
              const chunks: string[] = []
              for (let i=0;i<aList.length;i+=3)
                chunks.push(aList.slice(i,i+3).map(k=>ARUDHA_LABEL[k]??k).join(' · '))
              return chunks.map((txt,ci) => (
                <text key={`a${ci}`} x={ax} y={baseY+ci*aFont*1.3}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.round(aFont)} fontStyle="italic" fontWeight="700"
                  fontFamily="var(--font-chart-planets)" fill="var(--text-gold)"
                >{txt}</text>
              ))
            })()}
          </g>
        )
      })}

      {/* Outer border */}
      <rect x=".5" y=".5" width={S-1} height={S-1}
        fill="none" stroke="var(--gold,#c9a84c)" strokeWidth="1.5"/>
    </svg>
  )
}