// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/vimshottariClassicalRules.ts
//  Classroom Parashari / Laghu Parashari dasha rules, conditioned on
//  the running MD/AD lords. Each hit is a flag plus a soft weight that
//  nudges the favourable / challenging mix — never a verdict.
//  Educational overlays — never imply death timing.
// ─────────────────────────────────────────────────────────────

import type { AshtakavargaResult, GrahaData, GrahaId, Rashi, ShadbalaResult } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { DASHA_SEQUENCE } from '@/lib/engine/dasha/vimshottari'
import type { VimshottariFlag } from '@/lib/engine/dasha/vimshottariAnalysis'

export interface ClassicalRuleHit {
  flag: VimshottariFlag
  /** Positive → favourable share, negative → challenging share, 0 → neutral */
  weight: number
}

export interface ClassicalRuleInput {
  ascRashi: Rashi
  grahas: GrahaData[]
  mahaLord: string
  antarLord: string | null
  /** 0-based mahadasha index from birth (birth MD = 0); -1 when unknown */
  mahaSequenceIndex: number
  /** 0-based antar index inside the mahadasha (0 = MD lord, 8 = last); -1 when unknown */
  antarIndexInMaha: number
  navamshaGrahas?: GrahaData[] | null
  /** Fraction of the running mahadasha elapsed (0–1); null when unknown */
  mahaProgress?: number | null
  /** Native's age in years when the running mahadasha began; null when unknown */
  ageAtMahaStartYears?: number | null
  shadbala?: ShadbalaResult | null
  ashtakavarga?: AshtakavargaResult | null
}

const SIGN_LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const KENDRA = [1, 4, 7, 10]
const TRIKONA = [1, 5, 9]
/** Natural malefics for placement rules (nodes included) */
const NATURAL_MALEFIC = new Set(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
const NODES = new Set(['Ra', 'Ke'])

function name(id: string): string {
  return GRAHA_NAMES[id as GrahaId] ?? id
}

function wholeSignHouse(planetRashi: number, ascRashi: number): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function signOfHouse(ascRashi: Rashi, house: number): number {
  return ((ascRashi - 1 + house - 1) % 12) + 1
}

function houseLord(ascRashi: Rashi, house: number): GrahaId {
  return SIGN_LORDS[signOfHouse(ascRashi, house)]
}

function housesRuled(ascRashi: Rashi, id: string): number[] {
  const out: number[] = []
  for (let h = 1; h <= 12; h++) if (houseLord(ascRashi, h) === id) out.push(h)
  return out
}

function signCount(from: number, to: number): number {
  return ((to - from + 12) % 12) + 1
}

/** Parashari whole-sign aspects; nodes cast none here. */
function aspectsSign(source: GrahaData, targetRashi: number): boolean {
  if (NODES.has(source.id)) return false
  const diff = signCount(source.rashi, targetRashi)
  if (diff === 7) return true
  if (source.id === 'Ma' && (diff === 4 || diff === 8)) return true
  if (source.id === 'Ju' && (diff === 5 || diff === 9)) return true
  if (source.id === 'Sa' && (diff === 3 || diff === 10)) return true
  return false
}

function connected(a: GrahaData | undefined, b: GrahaData | undefined, ascRashi: Rashi): boolean {
  if (!a || !b || a.id === b.id) return false
  if (a.rashi === b.rashi) return true
  if (aspectsSign(a, b.rashi) || aspectsSign(b, a.rashi)) return true
  const aHouse = wholeSignHouse(a.rashi, ascRashi)
  const bHouse = wholeSignHouse(b.rashi, ascRashi)
  return houseLord(ascRashi, aHouse) === b.id && houseLord(ascRashi, bHouse) === a.id
}

function find(grahas: GrahaData[], id: string): GrahaData | undefined {
  return grahas.find(g => g.id === id)
}

function hit(
  id: string,
  label: string,
  tone: VimshottariFlag['tone'],
  detail: string,
  weight: number,
): ClassicalRuleHit {
  return { flag: { id, label, tone, detail }, weight }
}

/** Lagna-specific pairings taught for the dasha of either partner. */
const LAGNA_PAIRINGS: Partial<Record<Rashi, Array<{ a: GrahaId; b: GrahaId; tone: 'supportive' | 'caution'; detail: string }>>> = {
  1: [
    { a: 'Ju', b: 'Su', tone: 'supportive', detail: 'For Aries lagna, Jupiter linked with the Sun joins the lords of the 9th and the 5th. That is a form of rajayoga.' },
    { a: 'Ju', b: 'Sa', tone: 'caution', detail: 'For Aries lagna, Jupiter linked with Saturn loses part of its auspiciousness. Its period delivers less than its promise.' },
    { a: 'Ve', b: 'Sa', tone: 'caution', detail: 'For Aries lagna, Venus already rules the 2nd and the 7th. Linked with Saturn, its period carries heavy pressure. This is the intensity of hardship, not a forecast of the end of life.' },
  ],
  2: [{ a: 'Sa', b: 'Me', tone: 'supportive', detail: 'For Taurus lagna, Saturn (9th and 10th) with Mercury (5th) joins trikona lords. That is a strongly productive pairing.' }],
  3: [{ a: 'Me', b: 'Ve', tone: 'supportive', detail: 'For Gemini lagna, Mercury with Venus is the strongest pairing.' }],
  7: [{ a: 'Mo', b: 'Me', tone: 'supportive', detail: 'For Libra lagna, the Moon with Mercury can feel immature in the moment, yet the outcome tends to turn out well.' }],
  10: [{ a: 'Ve', b: 'Me', tone: 'supportive', detail: 'For Capricorn lagna, Venus with Mercury strengthens the single yogakaraka.' }],
  12: [{ a: 'Ma', b: 'Ju', tone: 'supportive', detail: 'For Pisces lagna, Mars with Jupiter forms a fine rajayoga.' }],
}

/** Themes classically tied to a malefic period lord sitting in the 4th. */
const FOURTH_HOUSE_MALEFIC: Record<string, string> = {
  Ma: 'fire, theft, or loss around the home, and care for pets',
  Sa: 'heaviness in the chest or head, and slow repairs at home',
  Su: 'friction with authority or officials that reaches the home',
  Ra: 'food-borne illness in the household, or a hospital visit',
  Ke: 'sudden detachment from property, or an unexplained household strain',
}

/** Moon brightness 0 (new) … 180 (full), from Sun–Moon elongation. */
export function moonBrightness(grahas: GrahaData[]): number | null {
  const su = find(grahas, 'Su')
  const mo = find(grahas, 'Mo')
  if (!su || !mo) return null
  const elong = ((mo.lonSidereal - su.lonSidereal) % 360 + 360) % 360
  return elong <= 180 ? elong : 360 - elong
}

/**
 * Evaluate the classroom dasha rules for the running MD/AD lords.
 * Each rule is checked once per lord; duplicates across MD and AD are merged.
 */
export function collectClassicalDashaRules(input: ClassicalRuleInput): ClassicalRuleHit[] {
  const { ascRashi, grahas, mahaLord, antarLord, mahaSequenceIndex, antarIndexInMaha, navamshaGrahas } = input
  const hits: ClassicalRuleHit[] = []
  const seen = new Set<string>()
  const push = (h: ClassicalRuleHit) => {
    if (seen.has(h.flag.id)) return
    seen.add(h.flag.id)
    hits.push(h)
  }

  const lord5 = houseLord(ascRashi, 5)
  const lord9 = houseLord(ascRashi, 9)
  const lord4 = houseLord(ascRashi, 4)
  const lord10 = houseLord(ascRashi, 10)
  const g5 = find(grahas, lord5)
  const g9 = find(grahas, lord9)
  const g4 = find(grahas, lord4)
  const g10 = find(grahas, lord10)

  const layers: Array<{ lord: string; layer: 'MD' | 'AD' }> = [{ lord: mahaLord, layer: 'MD' }]
  if (antarLord && antarLord !== mahaLord) layers.push({ lord: antarLord, layer: 'AD' })

  for (const { lord, layer } of layers) {
    const g = find(grahas, lord)
    if (!g) continue
    const n = name(lord)
    const house = wholeSignHouse(g.rashi, ascRashi)
    const ruled = housesRuled(ascRashi, lord)
    const isNode = NODES.has(lord)

    // Lagna lord and trikona lords give good results in their own periods.
    if (ruled.includes(1)) {
      push(hit('cl-lagnesh', 'Lagna lord period', 'supportive',
        `${n} rules the lagna. The lagna lord can deliver every area of life, from vitality to the outcome of effort.`, 5))
    } else if (ruled.some(h => h === 5 || h === 9)) {
      push(hit(`cl-trikona-lord-${layer}`, `Trikona lord period (${layer})`, 'supportive',
        `${n} rules the ${ruled.filter(h => h === 5 || h === 9).join(' and ')} — a lakshmi sthana. Its period tends to bring fortune and money.`, 5))
    }

    // 3rd / 6th / 11th lords: trouble, unless a trikona lordship softens it.
    const trishadaya = ruled.filter(h => h === 3 || h === 6 || h === 11)
    if (trishadaya.length && !ruled.some(h => TRIKONA.includes(h))) {
      push(hit(`cl-trishadaya-${layer}`, `Lord of ${trishadaya.join('/')} (${layer})`, 'caution',
        `${n} rules the ${trishadaya.join(' and ')}. These periods bring effort, competition, and friction before gain.`, -6))
    }

    // 8th / 12th lordship alone is neutral: results follow association.
    if (ruled.length && ruled.every(h => h === 8 || h === 12)) {
      push(hit(`cl-neutral-lord-${layer}`, `Neutral lordship (${layer})`, 'neutral',
        `${n} rules only the ${ruled.join(' and ')}. Such a lord is neutral; it gives results through the planets it joins and the house it occupies.`, 0))
    }

    // Kendradhipati dosha: a natural benefic owning two kendras.
    if ((lord === 'Ju' || lord === 'Me') && ruled.filter(h => KENDRA.includes(h)).length >= 2) {
      push(hit('cl-kendradhipati', 'Kendradhipati dosha', 'caution',
        `${n} is a natural benefic that owns two kendras. It loses part of its benefic nature, so its period gives mixed results.`, -5))
    }

    // Natural malefic as kendra lord (non-trikona) loses its malefic edge.
    if (['Su', 'Ma', 'Sa'].includes(lord) && ruled.some(h => h !== 1 && KENDRA.includes(h)) && !ruled.some(h => TRIKONA.includes(h))) {
      push(hit(`cl-malefic-kendra-${layer}`, `Malefic kendra lord (${layer})`, 'mixed',
        `${n} is a natural malefic that owns a kendra. Kendra lordship softens its harsh side.`, 2))
    }

    // Malefics thrive in 3, 6, 11.
    if (NATURAL_MALEFIC.has(lord) && [3, 6, 11].includes(house)) {
      push(hit(`cl-malefic-upachaya-${layer}`, `Malefic in ${house}th (${layer})`, 'supportive',
        `${n} is a natural malefic placed in the ${house}th. Cruel planets in the 3rd, 6th, and 11th give good results in their periods.`, 6))
    }

    // Viparita: debilitated planet in 3/6/8, or debilitated lord of 3/6/12.
    if (g.dignity === 'debilitated' && ([3, 6, 8].includes(house) || ruled.some(h => [3, 6, 12].includes(h)))) {
      push(hit(`cl-viparita-${layer}`, `Debilitated in a hard place (${layer})`, 'supportive',
        `${n} is debilitated and tied to a dusthana. A weak lord of a difficult house is taught to give a surprisingly good period, after early strain.`, 5))
    }

    // Malefic in the 4th: home and property themes.
    if (NATURAL_MALEFIC.has(lord) && house === 4) {
      push(hit(`cl-malefic-4th-${layer}`, `Malefic in the 4th (${layer})`, 'caution',
        `${n} sits in the 4th. Watch for ${FOURTH_HOUSE_MALEFIC[lord] ?? 'loss around land and home'}. This is a theme to guard, not a certainty, and not medical advice.`, -5))
    }

    // Lord aspects its own house.
    if (!isNode) {
      const own = ruled.filter(h => aspectsSign(g, signOfHouse(ascRashi, h)))
      if (own.length) {
        push(hit(`cl-own-aspect-${layer}`, `Aspects own house (${layer})`, 'supportive',
          `${n} aspects the ${own.join(' and ')}, a house it rules. A planet that looks at its own house protects it in its period.`, 4))
      }
    }

    // Laghu Parashari: 2nd/7th lord placed in or linked to the 4th lord.
    if ((ruled.includes(2) || ruled.includes(7)) && lord !== lord4 && (house === 4 || connected(g, g4, ascRashi))) {
      push(hit('cl-maraka-4th', 'Maraka lord linked to the 4th', 'supportive',
        `${n} rules the 2nd or the 7th and is tied to the 4th. Its period still brings strain, but the returns are taught to outweigh it.`, 5))
    }

    // 6th / 8th / 12th lord linked to the 5th lord.
    if (ruled.some(h => [6, 8, 12].includes(h)) && lord !== lord5 && connected(g, g5, ascRashi)) {
      push(hit('cl-dusthana-5th', 'Dusthana lord linked to the 5th', 'supportive',
        `${n} rules a dusthana and is linked with the 5th lord (${name(lord5)}). Laghu Parashari reads this as good results in the period.`, 5))
    }

    // 6th / 7th lord in the 10th or linked to the 10th lord.
    if ((ruled.includes(6) || ruled.includes(7)) && (house === 10 || (lord !== lord10 && connected(g, g10, ascRashi)))) {
      push(hit('cl-6-7-tenth', '6th/7th lord tied to the 10th', 'supportive',
        `${n} rules the 6th or the 7th and is tied to the 10th. Only then is such a period auspicious, through work and status.`, 5))
    }

    // 5th lord in 10th; 10th lord in 9th.
    if (lord === lord5 && house === 10) {
      push(hit('cl-5in10', '5th lord in the 10th', 'supportive',
        `${n}, lord of the 5th, sits in the 10th. Money, property, and power are classically promised in its periods.`, 6))
    }
    if (lord === lord10 && house === 9) {
      push(hit('cl-10in9', '10th lord in the 9th', 'supportive',
        `${n}, lord of the 10th, sits in the 9th. This gives a good position and a strong period.`, 5))
    }

    // Nodes: kendra + trikona-lord link is the best dasha; Rahu alone in 5th needs care.
    if (isNode) {
      const linkedTrikona = [g5, g9].some(t => t && (t.rashi === g.rashi || aspectsSign(t, g.rashi)))
      if (KENDRA.includes(house) && linkedTrikona) {
        push(hit(`cl-node-kendra-${lord}`, `${n} in kendra with trikona lord`, 'supportive',
          `${n} sits in a kendra and is joined or aspected by the lord of the 5th or the 9th. Few dashas are better than this.`, 10))
      }
      if (lord === 'Ra' && house === 5) {
        const kendraLords = KENDRA.map(h => find(grahas, houseLord(ascRashi, h)))
        const linkedKendra = kendraLords.some(k => k && (k.rashi === g.rashi || aspectsSign(k, g.rashi)))
        if (linkedTrikona || linkedKendra) {
          push(hit('cl-rahu-5th-linked', 'Rahu in 5th, well linked', 'supportive',
            'Rahu in the 5th is joined or aspected by a kendra or trikona lord. That turns its period good.', 5))
        } else {
          push(hit('cl-rahu-5th-alone', 'Rahu alone in the 5th', 'caution',
            'Rahu sits alone in the 5th with no kendra or trikona lord linked. Classically, progeny matters need extra care in this period. Read it with the D7, and consult a medical professional for any concern.', -4))
        }
      }
    }

    // 1–7 axis: only Ma–Mo, Sa–Ju, Ma–Ju across the axis are fine.
    if (!isNode && (house === 1 || house === 7)) {
      const oppHouse = house === 1 ? 7 : 1
      const opp = grahas.filter(o => !NODES.has(o.id) && wholeSignHouse(o.rashi, ascRashi) === oppHouse)
      if (opp.length) {
        const fine = (a: string, b: string) => {
          const key = [a, b].sort().join('-')
          return key === 'Ma-Mo' || key === 'Ju-Sa' || key === 'Ju-Ma'
        }
        const allFine = opp.every(o => fine(lord, o.id))
        push(hit(`cl-axis-1-7-${layer}`, `1–7 axis (${layer})`, allFine ? 'supportive' : 'caution',
          allFine
            ? `${n} faces ${opp.map(o => name(o.id)).join(', ')} across the 1–7 axis. This is one of the taught exceptions that works well.`
            : `${n} faces ${opp.map(o => name(o.id)).join(', ')} across the 1–7 axis. Apart from Mars–Moon, Saturn–Jupiter, and Mars–Jupiter, such periods tend not to go smoothly.`,
          allFine ? 4 : -5))
      }
    }

    // D1 vs D9 dignity reversal.
    const d9 = navamshaGrahas?.length ? find(navamshaGrahas, lord) : undefined
    if (d9) {
      if (g.dignity === 'exalted' && d9.dignity === 'debilitated') {
        push(hit(`cl-d1-d9-fall-${layer}`, `Exalted D1, debilitated D9 (${layer})`, 'caution',
          lord === 'Ma'
            ? 'Mars is exalted in the rashi and debilitated in the navamsha. Its period is taught to bring serious trouble for a brother or a close friend; keep them close.'
            : lord === 'Su'
              ? 'The Sun is exalted in the rashi and debilitated in the navamsha. Its period is taught to bring a run of losses in the family and in agricultural land. Read it as a call to protect, not a certainty.'
              : `${n} is exalted in the rashi and debilitated in the navamsha. The promise looks strong but falls short; family and fixed assets need protection.`, -6))
      } else if (g.dignity === 'debilitated' && d9.dignity === 'exalted') {
        push(hit(`cl-d1-d9-rise-${layer}`, `Debilitated D1, exalted D9 (${layer})`, 'supportive',
          lord === 'Ma'
            ? 'Mars is debilitated in the rashi and exalted in the navamsha. Farmland or a farmhouse, if you hold one, is taught to profit well in this period.'
            : lord === 'Su'
              ? 'The Sun is debilitated in the rashi and exalted in the navamsha. Expect early defamation or a setback at work, then vindication and strong money.'
              : `${n} is debilitated in the rashi and exalted in the navamsha. Expect early setbacks, then a strong final result.`, 5))
      }
    }

    collectPlacementRules({ ...input, lord, layer, g, house, ruled }, push)

    // Moon: paksha bala decides whether the period feels steady or strained.
    if (lord === 'Mo') {
      const b = moonBrightness(grahas)
      if (b != null && b >= 120) {
        push(hit('cl-moon-bright', 'Paksha-bali Moon', 'supportive',
          'The Moon is bright (near full). It makes the mind resilient and supports money and home, even if the sign is weak.', 5))
      } else if (b != null && b <= 48) {
        push(hit('cl-moon-dark', 'Dark Moon (near amavasya)', 'caution',
          'The Moon is near new moon and lacks paksha bala. Its period can bring emotional strain and repeated minor illness, even in a good sign. This is not medical advice.', -5))
      }
    }
  }

  // Rajayoga antar: MD and AD lords join kendra and trikona lordship and are connected.
  if (antarLord && antarLord !== mahaLord) {
    const md = housesRuled(ascRashi, mahaLord)
    const ad = housesRuled(ascRashi, antarLord)
    const ownsKendra = (r: number[]) => r.some(h => KENDRA.includes(h))
    const ownsTrikona = (r: number[]) => r.some(h => h === 5 || h === 9)
    const pairs = (ownsKendra(md) && ownsTrikona(ad)) || (ownsTrikona(md) && ownsKendra(ad))
    if (pairs && connected(find(grahas, mahaLord), find(grahas, antarLord), ascRashi)) {
      push(hit('cl-rajayoga-antar', 'Rajayoga antardasha', 'supportive',
        `${name(mahaLord)} and ${name(antarLord)} join kendra and trikona lordship and are connected. This is a rajayoga-giving stretch, usually six months to three years.`, 10))
    }
  }

  // Lagna-specific pairings involving a running period lord.
  for (const p of LAGNA_PAIRINGS[ascRashi] ?? []) {
    const involved = [mahaLord, antarLord].includes(p.a) || [mahaLord, antarLord].includes(p.b)
    if (involved && connected(find(grahas, p.a), find(grahas, p.b), ascRashi)) {
      push(hit(`cl-lagna-pair-${p.a}-${p.b}`, `${name(p.a)}–${name(p.b)} pairing`, p.tone, p.detail, p.tone === 'supportive' ? 6 : -6))
    }
  }

  // Birth-sequence: 4th Saturn, 6th Jupiter, 4th/6th/9th Rahu or Mars.
  const seq = mahaSequenceIndex
  if (seq >= 0) {
    const nth = seq + 1
    const bad =
      (nth === 4 && mahaLord === 'Sa')
      || (nth === 6 && mahaLord === 'Ju')
      || ([4, 6, 9].includes(nth) && (mahaLord === 'Ra' || mahaLord === 'Ma'))
    if (bad) {
      push(hit('cl-birth-sequence', `${nth}th mahadasha from birth`, 'caution',
        `${name(mahaLord)} as the ${nth}th mahadasha from birth is taught to give malefic results, even when placed well.`, -6))
    }
  }

  // Dasha sandhi: the last antar prepares the next mahadasha.
  if (antarIndexInMaha === 8) {
    const seqArr = DASHA_SEQUENCE as readonly string[]
    const next = seqArr[(seqArr.indexOf(mahaLord) + 1) % 9]
    const venusNote = mahaLord === 'Ve'
      ? ' After Venus come the Sun (6 years) and the Moon (10 years); read both now, because guidance given at the end of Venus changes in the Moon.'
      : ''
    push(hit('cl-sandhi', 'Dasha sandhi', 'neutral',
      `The mahadasha is in its last antar. ${name(next)} begins next, and its themes are already forming. Judge the next lord before advising.${venusNote}`, 0))
  }

  return hits
}

// ── Planet-specific placement rules ──────────────────────────

interface PlacementCtx extends ClassicalRuleInput {
  lord: string
  layer: 'MD' | 'AD'
  g: GrahaData
  house: number
  ruled: number[]
}

/** Mars by house, as taught for its own periods. */
const MARS_BY_HOUSE: Record<number, { tone: VimshottariFlag['tone']; detail: string }> = {
  1: { tone: 'mixed', detail: 'Mars in the 1st brings opposition from family whatever the sign, and often a mark near the eyebrow from childhood.' },
  2: { tone: 'mixed', detail: 'Mars in the 2nd grows money, but gives a harsh tongue and often a mark on the face or chin.' },
  3: { tone: 'supportive', detail: 'Mars in the 3rd gives money and courage in its period.' },
  4: { tone: 'mixed', detail: 'Mars in the 4th moves you from your place, yet rarely lets you settle abroad. The son of the earth stays near his land.' },
  5: { tone: 'mixed', detail: 'Mars in the 5th gives technical knowledge, friction with friends, and some delay or reduction in children.' },
  6: { tone: 'mixed', detail: 'Mars in the 6th gives property, but also disputes over it and a risk of accident.' },
  7: { tone: 'caution', detail: 'Mars in the 7th can strain the health of the reproductive organs. This is not medical advice.' },
  8: { tone: 'caution', detail: 'Mars in the 8th can unsettle your position and roughen your speech.' },
  9: { tone: 'mixed', detail: 'Mars in the 9th brings much travel, and friction with father, boss, or authority.' },
  10: { tone: 'supportive', detail: 'Mars in the 10th gives a good job, promotion, and awards, and stops the bad from taking hold.' },
  11: { tone: 'supportive', detail: 'Mars in the 11th gives awards and recognition, and a pleasant voice.' },
}

/** Lagna-specific notes for a running lord. Key = `${asc}-${lord}`. */
const LAGNA_LORD_NOTES: Record<string, { tone: VimshottariFlag['tone']; detail: string; weight: number }> = {
  '1-Ve': { tone: 'caution', detail: 'For Aries lagna, Venus rules the 2nd and the 7th: a strong maraka. Expect pressure on wealth, family, and partnership that never feels fully settled.', weight: -4 },
  '3-Ve': { tone: 'mixed', detail: 'For Gemini lagna, Venus rules the 5th and the 12th. It gives creativity without fail, but a mid-dasha crisis can bring losses in relationship, knowledge, or children’s matters.', weight: 0 },
  '2-Me': { tone: 'supportive', detail: 'For Taurus lagna, Mercury rules the 2nd and the 5th. The 2nd makes it a maraka, but the 5th turns that into foresight, precise planning, and decisions that win over competitors.', weight: 4 },
}

function collectPlacementRules(c: PlacementCtx, push: (h: ClassicalRuleHit) => void): void {
  const { ascRashi, grahas, lord, layer, g, house, ruled } = c
  const conj = (id: string) => grahas.some(o => o.id === id && o.id !== lord && o.rashi === g.rashi)
  const conjLordOf = (h: number) => {
    const l = houseLord(ascRashi, h)
    return l !== lord && conj(l)
  }

  // Lagna-specific notes for Venus / Mercury.
  const note = LAGNA_LORD_NOTES[`${ascRashi}-${lord}`]
  if (note) push(hit(`cl-lagna-lord-${lord}`, `${name(lord)} for this lagna`, note.tone, note.detail, note.weight))

  // Shadbala in rupas.
  const sb = c.shadbala?.planets?.[lord]
  if (sb) {
    const rupa = sb.totalShash ? sb.totalShash / 60 : sb.total
    if (rupa >= 6) {
      push(hit(`cl-shadbala-6-${layer}`, `Shadbala above 6 rupas (${layer})`, 'supportive',
        `${name(lord)} has ${rupa.toFixed(1)} rupas of Shadbala. Above six rupas, and in its own or a friend’s sign, a lord gives a good period.`,
        g.dignity === 'own' || g.dignity === 'friend' || g.dignity === 'great_friend' || g.dignity === 'moolatrikona' ? 5 : 3))
    }
  }

  if (lord === 'Su') {
    const afflicted = conj('Ra') || conj('Ke') || conj('Sa') || g.dignity === 'debilitated'
    if (!afflicted && ([1, 4, 5, 7, 9, 10, 11].includes(house) || ruled.includes(9) || ruled.includes(10))) {
      push(hit('cl-sun-fame', 'Sun well placed', 'supportive',
        'A clean Sun in a kendra, a trikona, or the 11th, or as lord of the 9th or the 10th, gives money, honour, and fame in its period. Government awards are possible.', 6))
    }
    if (conjLordOf(5)) {
      push(hit('cl-sun-5th-lord', 'Sun with the 5th lord', 'supportive',
        'The Sun joins the 5th lord. If its period comes when children are planned, it is taught to give a child, often a son.', 4))
    }
    if (conjLordOf(2)) {
      push(hit('cl-sun-2nd-lord', 'Sun with the 2nd lord', 'supportive',
        'The Sun joins the 2nd lord. Money arrives, and an auspicious event takes place in the family.', 4))
    }
    if ([6, 8, 12].includes(house)) {
      const withNode = conj('Ra') || conj('Ke')
      push(hit('cl-sun-dusthana', withNode ? 'Sun with a node in a dusthana' : 'Sun in a dusthana', 'caution',
        withNode
          ? 'The Sun sits with a node in the 6th, 8th, or 12th. This is taught as a very hard period, in which name, standing, and money can all be lost. Keep the Moon’s period, which follows, in view.'
          : 'The Sun sits in the 6th, 8th, or 12th. Watch loans and defaults, raids or inquiries, and anything that could cost your reputation.',
        withNode ? -9 : -5))
    }
    if (house === 3) {
      push(hit('cl-sun-3rd', 'Sun in the 3rd', 'mixed',
        'The Sun in the 3rd gives a sudden early jump. Do not be drawn in by the hype; a decline can follow.', 0))
    }
  }

  if (lord === 'Mo') {
    const bright = (moonBrightness(grahas) ?? 90) >= 120
    if (g.dignity === 'exalted') {
      push(hit('cl-moon-exalted', 'Exalted Moon', 'supportive',
        'An exalted Moon in its own period brings power and authority.', 5))
    } else if (g.dignity === 'debilitated' && g.degree <= 5 && house === 8 && !bright) {
      push(hit('cl-moon-deep-8', 'Deeply debilitated Moon in the 8th', 'caution',
        'This is the hardest Moon placement taught. Its period can bring deep emotional lows. Keep support close, be careful around water and substances, and take any mental-health concern to a professional.', -8))
    } else if ((g.dignity === 'enemy' || g.dignity === 'great_enemy') && house >= 6) {
      push(hit('cl-moon-bondage', 'Moon in an enemy sign', 'caution',
        'The Moon in an enemy sign in the later houses can feel like bondage: home or work feels like a cage where you cannot do as you wish.', -5))
    } else if (g.dignity === 'friend' || g.dignity === 'great_friend') {
      push(hit('cl-moon-friend', 'Moon in a friend’s sign', 'supportive',
        'The Moon in a friend’s sign gives joy from family and relatives, and a wish to keep your own people around you. Emotional security grows.', 4))
    }
    if (house >= 1 && house <= 4 && (conjLordOf(4) || conjLordOf(9) || conjLordOf(10))) {
      push(hit('cl-moon-wealth-home', 'Moon with the 4th, 9th or 10th lord', 'supportive',
        'The Moon sits in houses 1 to 4 with the lord of the 4th, the 9th, or the 10th. Its period is taught to give much money, respect, and a fine house.', 6))
    }
    const bav = c.ashtakavarga?.bav?.Mo?.bindus?.[g.rashi - 1]
    if (bav != null && bav >= 6) {
      push(hit('cl-moon-bav-high', `Moon with ${bav} bindus`, 'supportive',
        `The Moon has ${bav} Ashtakavarga bindus in its sign. With six or seven, its period is taught to give a great deal of money.`, 5))
    }
  }

  if (lord === 'Ma') {
    const m = MARS_BY_HOUSE[house]
    if (m) {
      push(hit(`cl-mars-house-${house}`, `Mars in the ${house}th`, m.tone, m.detail,
        m.tone === 'supportive' ? 4 : m.tone === 'caution' ? -4 : 0))
    }
  }

  if (lord === 'Sa') {
    const at = (n: number) => ((house - 1 + n - 1) % 12) + 1
    push(hit(`cl-saturn-aspects-${layer}`, 'Saturn’s aspects', 'neutral',
      `Saturn’s 3rd aspect falls on house ${at(3)}: plan for the future there. Its 7th aspect falls on house ${at(7)}: present karma pays out there. Its 10th aspect falls on house ${at(10)}: old karma is re-engineered there.`, 0))
  }

  if (layer === 'MD' && (lord === 'Ra' || lord === 'Ke') && c.mahaProgress != null) {
    const p = Math.min(Math.max(c.mahaProgress, 0), 1)
    if (lord === 'Ra') {
      const phase = p < 1 / 3 ? 'start' : p < 2 / 3 ? 'middle' : 'end'
      push(hit('cl-rahu-phase', `Rahu phase: ${phase}`, phase === 'middle' ? 'supportive' : 'caution',
        phase === 'start'
          ? 'The opening years of Rahu bring sorrow and confusion before the rise.'
          : phase === 'middle'
            ? 'The middle of Rahu is where comfort and gains begin to arrive.'
            : 'The last years of Rahu give good results, but classically weigh on the elders of the family, often a grandparent. Keep their health in view.',
        phase === 'middle' ? 4 : -3))
    } else {
      const year = p * 7
      const phase = year < 2 ? 'start' : year < 5 ? 'middle' : 'end'
      push(hit('cl-ketu-phase', `Ketu phase: ${phase}`, 'neutral',
        phase === 'start'
          ? 'The first two years of Ketu unsettle: illusions, and old karma returning to the surface.'
          : phase === 'middle'
            ? 'Years three to five of Ketu turn you inward. Events push you to think about yourself, and inner guidance arrives.'
            : 'The last years of Ketu bring detachment, from a relationship, a desire, or a comfort, not only in spiritual form.',
        0))
    }
  }

  if (lord === 'Ke') {
    if (conj('Ju') && conj('Mo')) {
      push(hit('cl-ketu-ju-mo', 'Ketu with Jupiter and the Moon', 'supportive',
        'A rare combination of Ketu, Jupiter, and the Moon gives a kind of divine sight. Memories of past lives can surface in its period.', 5))
    }
    if (conj('Ma') && conj('Sa')) {
      push(hit('cl-ketu-ma-sa', 'Ketu with Mars and Saturn', 'mixed',
        'Ketu with Mars and Saturn makes a secret warrior, with a life close to that of an ascetic.', 0))
    }
    if (conj('Ve') && conj('Me')) {
      push(hit('cl-ketu-ve-me', 'Ketu with Venus and Mercury', 'supportive',
        'Ketu with Venus and Mercury makes a poet of devotion, in the line of Kabir.', 4))
    }
    if (layer === 'MD' && c.ageAtMahaStartYears != null && c.ageAtMahaStartYears >= 24 && c.ageAtMahaStartYears <= 26) {
      push(hit('cl-ketu-best-age', 'Ketu at its best age', 'mixed',
        'Ketu running from about 25 to 32 is its strongest stretch. Good or bad, it brings sudden changes and a turn in the life.', 0))
    }
  }
}
