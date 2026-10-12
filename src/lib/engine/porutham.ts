// src/lib/engine/porutham.ts
// South Indian (Tamil / Kerala) Dasaja / 10-Porutham matching.
// Complements North-Indian Ashtakoot — pure engine.

import { getGanaName, getLord, getVashyaName, getYoniName } from '@/lib/engine/ashtakoot'

export interface PoruthamItem {
  name: string
  sanskrit: string
  matched: boolean
  detail: string
  weight: 'critical' | 'important' | 'supportive'
}

export interface PoruthamResult {
  items: PoruthamItem[]
  matchedCount: number
  total: 10
  scoreLabel: string
  summary: string
}

/** Rajju groups (nak 1–27). Same rajju = no porutham. */
const RAJJU: Record<string, number[]> = {
  Pada: [1, 9, 10, 18, 19, 27],
  Kati: [2, 8, 11, 17, 20, 26],
  Nabhi: [3, 7, 12, 16, 21, 25],
  Kanta: [4, 5, 14, 23],
  Siro: [6, 13, 15, 22, 24],
}

/** Classical Vedha nakshatra pairs (mutual). */
const VEDHA_PAIRS: [number, number][] = [
  [1, 18], [2, 17], [3, 16], [4, 15], [5, 14], [6, 13],
  [7, 12], [8, 11], [9, 10], [19, 27], [20, 26], [21, 25],
  [22, 24],
]

function rajjuOf(nak: number): string {
  for (const [name, list] of Object.entries(RAJJU)) {
    if (list.includes(nak)) return name
  }
  return 'Unknown'
}

function countInclusive(from: number, to: number): number {
  return ((to - from + 27) % 27) + 1
}

function taraOk(from: number, to: number): boolean {
  const rem = countInclusive(from, to) % 9
  return rem !== 3 && rem !== 5 && rem !== 7
}

function yoniPoints(bNak: number, gNak: number): number {
  // Reuse animal equality / enemy via names for porutham pass/fail
  const a = getYoniName(bNak)
  const b = getYoniName(gNak)
  if (a === b) return 4
  const enemies: [string, string][] = [
    ['Horse', 'Buffalo'], ['Elephant', 'Lion'], ['Sheep', 'Monkey'],
    ['Serpent', 'Mongoose'], ['Dog', 'Hare'], ['Cat', 'Rat'], ['Cow', 'Tiger'],
  ]
  if (enemies.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return 0
  return 2
}

/**
 * 10 Porutham from boy/girl Moon nakshatra (1–27) and Moon signs (1–12).
 * boy = groom, girl = bride (directional rules).
 */
export function calculatePorutham(
  boyNak: number,
  boySign: number,
  girlNak: number,
  girlSign: number,
): PoruthamResult {
  const items: PoruthamItem[] = []

  // 1. Dina (Tara)
  const dina = taraOk(girlNak, boyNak)
  items.push({
    name: 'Dina',
    sanskrit: 'தினம் / दिन',
    matched: dina,
    detail: dina
      ? 'Bride→Groom Tara is Shubh (not Vipat/Pratyari/Vadha).'
      : 'Bride→Groom Tara falls in Vipat / Pratyari / Vadha — traditionally refused.',
    weight: 'important',
  })

  // 2. Gana (classical bride×groom)
  const gB = getGanaName(boyNak)
  const gG = getGanaName(girlNak)
  let ganaOk = false
  if (gB === gG) ganaOk = true
  else if (gB === 'Deva' && gG === 'Manushya') ganaOk = true
  else if (gB === 'Manushya' && gG === 'Deva') ganaOk = true
  else if (gB === 'Deva' && gG === 'Rakshasa') ganaOk = false
  else if (gB === 'Rakshasa' && gG === 'Deva') ganaOk = false
  else ganaOk = false
  // Classical: Deva bride + Rakshasa groom worst; same gana best
  if (gG === 'Deva' && gB === 'Rakshasa') ganaOk = false
  if (gB === gG) ganaOk = true
  items.push({
    name: 'Gana',
    sanskrit: 'கணம் / गण',
    matched: ganaOk,
    detail: `${gB} (groom) × ${gG} (bride) — ${ganaOk ? 'acceptable temperament' : 'Gana mismatch'}.`,
    weight: 'important',
  })

  // 3. Mahendra — count from bride nak to groom: 4,7,10,13,16,19,22,25
  const mahCount = countInclusive(girlNak, boyNak)
  const mahendra = [4, 7, 10, 13, 16, 19, 22, 25].includes(mahCount)
  items.push({
    name: 'Mahendra',
    sanskrit: 'மகேந்திரம்',
    matched: mahendra,
    detail: `Count bride→groom = ${mahCount}. Mahendra wants 4/7/10/13/16/19/22/25 — progeny & longevity favour.`,
    weight: 'supportive',
  })

  // 4. Stree Deergha — count bride→groom preferably ≥ 13 (some schools ≥ 9)
  const stree = mahCount >= 13
  items.push({
    name: 'Stree Deergha',
    sanskrit: 'ஸ்த்ரீ தீர்க்கம்',
    matched: stree,
    detail: stree
      ? `Distance ${mahCount} ≥ 13 — bride’s prosperity / long married life favoured.`
      : `Distance ${mahCount} < 13 — Stree Deergha weak in strict schools.`,
    weight: 'supportive',
  })

  // 5. Yoni
  const yp = yoniPoints(boyNak, girlNak)
  items.push({
    name: 'Yoni',
    sanskrit: 'யோனி',
    matched: yp >= 2,
    detail: `${getYoniName(boyNak)} × ${getYoniName(girlNak)} (${yp}/4). Enemy yoni fails Porutham.`,
    weight: 'critical',
  })

  // 6. Rasi — groom Moon not in 6th/8th from bride; 2/12 often also watched
  const boyFromGirl = ((boySign - girlSign + 12) % 12) + 1
  const rasiOk = ![6, 8].includes(boyFromGirl)
  items.push({
    name: 'Rasi',
    sanskrit: 'ராசி',
    matched: rasiOk,
    detail: `Groom Moon is ${boyFromGirl}th from bride Moon — ${rasiOk ? 'acceptable' : '6/8 Rasi dosha'}.`,
    weight: 'critical',
  })

  // 7. Rasyadhipati (Graha Maitri lite)
  const lB = getLord(boySign)
  const lG = getLord(girlSign)
  const friends: Record<string, string[]> = {
    Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'],
    Mars: ['Sun', 'Moon', 'Jupiter'], Mercury: ['Sun', 'Venus'],
    Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'],
    Saturn: ['Mercury', 'Venus'],
  }
  const rasyadhi = lB === lG || (friends[lB]?.includes(lG) ?? false) || (friends[lG]?.includes(lB) ?? false)
  items.push({
    name: 'Rasyadhipati',
    sanskrit: 'ராசியதிபதி',
    matched: rasyadhi,
    detail: `Moon lords ${lB} × ${lG} — ${rasyadhi ? 'friendly / same' : 'not mutual friends'}.`,
    weight: 'important',
  })

  // 8. Vasya
  const vB = getVashyaName(boySign)
  const vG = getVashyaName(girlSign)
  const vasya = vB === vG || !(vB === 'Wild' && vG === 'Water')
  items.push({
    name: 'Vasya',
    sanskrit: 'வசியம்',
    matched: vasya,
    detail: `${vB} × ${vG} — mutual influence ${vasya ? 'workable' : 'harsh'}.`,
    weight: 'supportive',
  })

  // 9. Rajju
  const rB = rajjuOf(boyNak)
  const rG = rajjuOf(girlNak)
  const rajju = rB !== rG
  items.push({
    name: 'Rajju',
    sanskrit: 'ரஜ்ஜு',
    matched: rajju,
    detail: rajju
      ? `${rB} × ${rG} — different rajju (good).`
      : `Same ${rB} rajju — traditionally avoided (body-region affliction).`,
    weight: 'critical',
  })

  // 10. Vedha
  const vedha = VEDHA_PAIRS.some(
    ([a, b]) => (a === boyNak && b === girlNak) || (a === girlNak && b === boyNak),
  )
  items.push({
    name: 'Vedha',
    sanskrit: 'வேதை',
    matched: !vedha,
    detail: vedha
      ? 'Nakshatras form classical Vedha pair — obstruction to harmony.'
      : 'No Vedha between birth stars.',
    weight: 'critical',
  })

  const matchedCount = items.filter(i => i.matched).length
  const criticalFail = items.filter(i => i.weight === 'critical' && !i.matched).length
  let scoreLabel = 'Poor'
  if (matchedCount >= 8 && criticalFail === 0) scoreLabel = 'Excellent'
  else if (matchedCount >= 7) scoreLabel = 'Good'
  else if (matchedCount >= 5) scoreLabel = 'Average'
  else scoreLabel = 'Challenging'

  return {
    items,
    matchedCount,
    total: 10,
    scoreLabel,
    summary: `${matchedCount}/10 Poruthams matched (${scoreLabel}). Critical fails: ${criticalFail}. South-Indian school — compare with North Ashtakoot side-by-side.`,
  }
}
