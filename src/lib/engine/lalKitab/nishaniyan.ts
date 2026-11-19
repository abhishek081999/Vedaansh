// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/nishaniyan.ts
//  The signs-in-life checker. The viewer ticks the signs they see;
//  each planet's ticks are compared with what the chart says:
//    confirmed  — the chart reads it hard and signs agree
//    signsOnly  — two or more signs, but the chart reads it good:
//                 recheck the birth time or the planet's year chart
//    chartOnly  — the chart reads it hard, no signs ticked yet
//    clear      — chart good and no signs
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import { LK_NISHANIYAN_HI } from '@/lib/engine/locale/lalKitabNishaniyan.hi'
import { LK_NISHANIYAN, type LkNishani } from './catalogue/nishaniyan'
import type { LkPhalReading, LkPhalSide } from './phal'
import { LK_GRAHAS, type LkGraha } from './types'

export type LkNishaniStatus = 'confirmed' | 'signsOnly' | 'chartOnly' | 'clear'

export interface LkNishaniCheck {
  planet: LkGraha
  ticked: number
  total: number
  chartSide: LkPhalSide
  status: LkNishaniStatus
}

export function lkNishaniyan(lang: EngineLang = 'en'): LkNishani[] {
  return LK_NISHANIYAN.map((n) => (lang === 'hi' ? { ...n, text: LK_NISHANIYAN_HI[n.id] ?? n.text } : n))
}

export function lkCheckNishaniyan(ticked: readonly string[], readings: readonly LkPhalReading[]): LkNishaniCheck[] {
  const set = new Set(ticked)
  return LK_GRAHAS.flatMap((planet) => {
    const r = readings.find((x) => x.planet === planet)
    if (!r) return []
    const signs = LK_NISHANIYAN.filter((n) => n.planet === planet)
    const count = signs.filter((n) => set.has(n.id)).length
    const hard = r.side === 'hard'
    const status: LkNishaniStatus = hard
      ? (count > 0 ? 'confirmed' : 'chartOnly')
      : (count >= 2 ? 'signsOnly' : 'clear')
    return [{ planet, ticked: count, total: signs.length, chartSide: r.side, status }]
  })
}
