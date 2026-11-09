// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/arrows.ts
//  Pythagorean birth chart — arrows of strength (full lines) and
//  weakness (empty lines) from birth-date digits only.
//  Layout: 3 6 9 / 2 5 8 / 1 4 7.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import { ARROW_HI } from '@/lib/engine/locale/numerologyExtras.hi'
import type { ParsedDate } from './core'
import { CORE_NUMBERS, type CoreNumber } from './data'

export const PYTHAGORAS_LAYOUT: CoreNumber[][] = [
  [3, 6, 9],
  [2, 5, 8],
  [1, 4, 7],
]

interface ArrowDef {
  numbers: [CoreNumber, CoreNumber, CoreNumber]
  strength: { name: string; meaning: string }
  weakness: { name: string; meaning: string }
}

const ARROWS: ArrowDef[] = [
  {
    numbers: [3, 6, 9],
    strength: { name: 'Arrow of Intellect', meaning: 'Excellent memory and a quick, reasoning mind.' },
    weakness: { name: 'Arrow of Poor Memory', meaning: 'Retention needs effort — use notes, repetition and routine.' },
  },
  {
    numbers: [2, 5, 8],
    strength: { name: 'Arrow of Emotional Balance', meaning: 'Steady feelings, sensitivity held in check, good empathy.' },
    weakness: { name: 'Arrow of Hypersensitivity', meaning: 'Easily hurt; can hide feelings — needs safe, patient company.' },
  },
  {
    numbers: [1, 4, 7],
    strength: { name: 'Arrow of Practicality', meaning: 'Good with hands, money and material matters; grounded.' },
    weakness: { name: 'Arrow of Disorder', meaning: 'Practical follow-through is weak — systems and checklists help.' },
  },
  {
    numbers: [1, 2, 3],
    strength: { name: 'Arrow of the Planner', meaning: 'Orderly, methodical thinker who plans before acting.' },
    weakness: { name: 'Arrow of Confusion', meaning: 'Plans scatter easily — break goals into small written steps.' },
  },
  {
    numbers: [4, 5, 6],
    strength: { name: 'Arrow of Will-power', meaning: 'Strong drive and determination to see goals through.' },
    weakness: { name: 'Arrow of Frustration', meaning: 'Disappointment when results lag — cultivate patience.' },
  },
  {
    numbers: [7, 8, 9],
    strength: { name: 'Arrow of Activity', meaning: 'Energetic, restless and happiest when doing.' },
    weakness: { name: 'Arrow of Passivity', meaning: 'Waits for things to happen — needs a push to start.' },
  },
  {
    numbers: [1, 5, 9],
    strength: { name: 'Arrow of Determination', meaning: 'Persistent and purposeful; obstacles harden resolve.' },
    weakness: { name: 'Arrow of Procrastination', meaning: 'Delays decisions — deadlines and accountability help.' },
  },
  {
    numbers: [3, 5, 7],
    strength: { name: 'Arrow of Spirituality', meaning: 'Natural faith, compassion and inner calm.' },
    weakness: { name: 'Arrow of Scepticism', meaning: 'Questions everything — needs proof before trust.' },
  },
]

export interface ArrowHit {
  numbers: [CoreNumber, CoreNumber, CoreNumber]
  name: string
  meaning: string
}

export interface PythagoreanArrows {
  counts: Record<CoreNumber, number>
  layout: CoreNumber[][]
  strengths: ArrowHit[]
  weaknesses: ArrowHit[]
}

export function getPythagoreanArrows(date: ParsedDate, lang: EngineLang = 'en'): PythagoreanArrows {
  const counts = Object.fromEntries(CORE_NUMBERS.map(n => [n, 0])) as Record<CoreNumber, number>
  for (const ch of `${date.day}${date.month}${date.year}`) {
    const d = Number(ch)
    if (d >= 1 && d <= 9) counts[d as CoreNumber]++
  }
  const strengths: ArrowHit[] = []
  const weaknesses: ArrowHit[] = []
  for (const a of ARROWS) {
    const present = a.numbers.filter(n => counts[n] > 0).length
    const hi = lang === 'hi' ? ARROW_HI[a.numbers.join('-')] : undefined
    if (present === 3) strengths.push({ numbers: a.numbers, ...(hi?.strength ?? a.strength) })
    else if (present === 0) weaknesses.push({ numbers: a.numbers, ...(hi?.weakness ?? a.weakness) })
  }
  return { counts, layout: PYTHAGORAS_LAYOUT, strengths, weaknesses }
}
