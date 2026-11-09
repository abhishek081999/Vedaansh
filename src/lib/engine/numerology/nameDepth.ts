// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/nameDepth.ts
//  Name depth — karmic lessons (missing letter values), hidden
//  passion, balance number, letter intensity — and side-by-side
//  comparison of alternative spellings.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import { NAME_BALANCE_HI, NAME_LESSON_HI, NAME_PASSION_HI } from '@/lib/engine/locale/numerologyExtras.hi'
import { numberHarmony, reduceToCore, supportScore, type Harmony } from './core'
import {
  CORE_NUMBERS,
  PYTHAGOREAN_VALUES,
  compoundReadAs,
  getCompoundMeaning,
  type CompoundMeaning,
  type CoreNumber,
} from './data'
import { getNameNumber } from './calc'

// Karmic lessons and hidden passion need all nine values, so they are
// read on the Pythagorean table (Chaldean has no letter worth 9).

const KARMIC_LESSON: Record<CoreNumber, string> = {
  1: 'Build self-belief and initiative; practise deciding and standing by it.',
  2: 'Develop patience, tact and cooperation; listen before acting.',
  3: 'Learn to express feelings and ideas openly; creative outlets heal.',
  4: 'Cultivate order and steady work; avoid shortcuts and loose ends.',
  5: 'Embrace change and new experiences; fear of the unknown limits growth.',
  6: 'Accept responsibility for home and community; give care without resentment.',
  7: 'Deepen faith and inner study; question beliefs rather than borrowing them.',
  8: 'Master money and authority; learn practical judgement in material matters.',
  9: 'Widen compassion; serve beyond your own circle and let go gracefully.',
}

const HIDDEN_PASSION: Record<CoreNumber, string> = {
  1: 'Drive to lead, pioneer and be recognised for original work.',
  2: 'Longing for partnership, peace and being of quiet service.',
  3: 'Love of expression — words, art, performance and good company.',
  4: 'Passion for structure, craft and building something lasting.',
  5: 'Hunger for freedom, travel, variety and the senses.',
  6: 'Devotion to family, beauty, healing and harmony at home.',
  7: 'Thirst for knowledge, research and spiritual truth.',
  8: 'Ambition for wealth, power and executive control.',
  9: 'Calling to humanitarian causes, the arts and universal love.',
}

const BALANCE: Record<CoreNumber, string> = {
  1: 'Under pressure, rely on your own judgement but avoid isolating yourself.',
  2: 'In a crisis, seek quiet cooperation; tact settles what force cannot.',
  3: 'Lighten up — humour and honest talk dissolve tension.',
  4: 'Restore calm through routine, lists and practical steps.',
  5: 'Step back and change the scene; avoid impulsive escapes.',
  6: 'Turn to family and friends; service restores your balance.',
  7: 'Retreat, reflect and pray; solitude brings the answer.',
  8: 'Take charge calmly; firm, fair decisions steady others.',
  9: 'Rise above the personal; compassion and perspective heal.',
}

export interface NameDepthResult {
  /** Count of letters per Pythagorean value 1–9. */
  intensity: Record<CoreNumber, number>
  karmicLessons: { number: CoreNumber; lesson: string }[]
  hiddenPassion: { numbers: CoreNumber[]; count: number; meaning: string } | null
  balance: { value: CoreNumber; initials: string; meaning: string } | null
  letterCount: number
}

export function getNameDepth(name: string, lang: EngineLang = 'en'): NameDepthResult | null {
  const words = name.toUpperCase().split(/\s+/).map(w => w.replace(/[^A-Z]/g, '')).filter(Boolean)
  if (words.length === 0) return null

  const intensity = Object.fromEntries(CORE_NUMBERS.map(n => [n, 0])) as Record<CoreNumber, number>
  let letterCount = 0
  for (const w of words) {
    for (const ch of w) {
      const v = PYTHAGOREAN_VALUES[ch] as CoreNumber | undefined
      if (!v) continue
      intensity[v]++
      letterCount++
    }
  }

  const karmicLessons = CORE_NUMBERS
    .filter(n => intensity[n] === 0)
    .map(n => ({ number: n, lesson: lang === 'hi' ? NAME_LESSON_HI[n] : KARMIC_LESSON[n] }))

  const max = Math.max(...CORE_NUMBERS.map(n => intensity[n]))
  const passionNums = CORE_NUMBERS.filter(n => intensity[n] === max)
  // A hidden passion needs a value that genuinely repeats and stands out.
  const hiddenPassion = max >= 2 && passionNums.length <= 2
    ? { numbers: passionNums, count: max, meaning: passionNums.map(n => (lang === 'hi' ? NAME_PASSION_HI[n] : HIDDEN_PASSION[n])).join(' ') }
    : null

  const initials = words.map(w => w[0]!).join('')
  const initialsSum = [...initials].reduce((s, ch) => s + (PYTHAGOREAN_VALUES[ch] ?? 0), 0)
  const balanceValue = reduceToCore(initialsSum)
  const balance = balanceValue
    ? { value: balanceValue as CoreNumber, initials, meaning: lang === 'hi' ? NAME_BALANCE_HI[balanceValue as CoreNumber] : BALANCE[balanceValue as CoreNumber] }
    : null

  return { intensity, karmicLessons, hiddenPassion, balance, letterCount }
}

// ── Spelling comparison ───────────────────────────────────────

export interface SpellingComparison {
  spelling: string
  compound: number
  /** Compound used for the meaning lookup (differs only above 52). */
  readAs: number
  root: CoreNumber
  compoundMeaning: CompoundMeaning | null
  moolankHarmony: Harmony
  bhagyankHarmony: Harmony
  score: number
  verdict: 'favourable' | 'acceptable' | 'unfavourable'
  best: boolean
}

const QUALITY_ADJUST = { fortunate: 10, mixed: 0, warning: -25 } as const

/** Ranks alternative spellings (Chaldean) against Moolank and Bhagyank. */
export function compareNameSpellings(
  spellings: string[],
  moolank: CoreNumber,
  bhagyank: CoreNumber,
  lang: EngineLang = 'en',
): SpellingComparison[] {
  const seen = new Set<string>()
  const rows: SpellingComparison[] = []
  for (const raw of spellings) {
    const spelling = raw.trim().replace(/\s+/g, ' ')
    const key = spelling.toUpperCase()
    if (!spelling || seen.has(key)) continue
    seen.add(key)
    const n = getNameNumber(spelling, 'chaldean')
    if (!n) continue
    const compoundMeaning = getCompoundMeaning(n.compound, lang)
    const base = supportScore(n.value, moolank, bhagyank)
    const score = Math.max(0, Math.min(100, base + (compoundMeaning ? QUALITY_ADJUST[compoundMeaning.quality] : 0)))
    rows.push({
      spelling,
      compound: n.compound,
      readAs: compoundReadAs(n.compound),
      root: n.value,
      compoundMeaning,
      moolankHarmony: numberHarmony(n.value, moolank),
      bhagyankHarmony: numberHarmony(n.value, bhagyank),
      score,
      verdict: score >= 63 ? 'favourable' : score >= 43 ? 'acceptable' : 'unfavourable',
      best: false,
    })
  }
  rows.sort((a, b) => b.score - a.score)
  if (rows.length > 1 && rows[0]!.score > rows[1]!.score) rows[0]!.best = true
  return rows
}
