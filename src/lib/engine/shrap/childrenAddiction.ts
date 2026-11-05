// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shrap/childrenAddiction.ts
//  Children’s focus / education hints and addiction signatures
//  Framed as tendencies — not medical or legal diagnosis.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { SIGN_LORD_BY_RASHI } from '@/lib/engine/lordshipInterpretations'
import {
  conjunct,
  findGraha,
  gn,
  houseOf,
  houseSign,
  maleficsOnHouse,
  onNodeAxis,
  type ShrapSeverity,
} from '@/lib/engine/shrap/helpers'

export interface ChildrenFocusReading {
  headline: string
  severity: ShrapSeverity
  focusElsewhere: boolean
  dashaHouses: number[]
  dashaNote: string
  remedies: string[]
  notes: string[]
}

export interface AddictionSignature {
  id: string
  label: string
  detail: string
  severity: ShrapSeverity
}

export interface AddictionReading {
  headline: string
  severity: ShrapSeverity
  disclaimer: string
  primaryHouses: Array<{ house: number; role: string; hit: boolean; detail: string }>
  planetSignatures: AddictionSignature[]
  combinations: AddictionSignature[]
  dashaNote: string
  remedies: string[]
  childVsAdult: string
}

const FOCUS_AWAY_HOUSES = new Set([1, 3, 11, 12])

function lordHousesFromAsc(ascRashi: Rashi, lord: GrahaId): number[] {
  const out: number[] = []
  for (let h = 1; h <= 12; h++) {
    if (SIGN_LORD_BY_RASHI[houseSign(ascRashi, h)] === lord) out.push(h)
  }
  return out
}

export function analyzeChildrenFocus(chart: ChartOutput, now = Date.now()): ChildrenFocusReading | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc || !chart.grahas?.length) return null

  const path = getDashaPathAt(chart.dashas?.vimshottari ?? [], now)
  const md = path[0]
  const ad = path[1]
  const dashaHouses: number[] = []
  for (const node of [md, ad]) {
    if (!node?.lord) continue
    const lord = node.lord as GrahaId
    dashaHouses.push(...lordHousesFromAsc(asc, lord))
  }
  const uniqueHouses = [...new Set(dashaHouses)]
  const focusElsewhere = uniqueHouses.some(h => FOCUS_AWAY_HOUSES.has(h))

  const h5 = maleficsOnHouse(chart, 5)
  const me = findGraha(chart, 'Me')
  const meHouse = houseOf(chart, 'Me')
  const notes: string[] = []

  if (h5.length) notes.push(`5th house under pressure from ${h5.map(gn).join(', ')} — study / focus themes need care.`)
  if (me && (me.isCombust || onNodeAxis(chart, 'Me'))) {
    notes.push('Mercury weak or on the node axis — concentration and learning circuits fluctuate.')
  }
  if (meHouse === 12 || meHouse === 8) {
    notes.push(`Mercury in house ${meHouse} — mind may scatter into escape or secrecy rather than desk work.`)
  }

  let severity: ShrapSeverity = 'clear'
  if (focusElsewhere && h5.length) severity = 'strong'
  else if (focusElsewhere || h5.length || notes.length) severity = 'watch'

  const dashaLabel = [md, ad]
    .filter(Boolean)
    .map(n => GRAHA_NAMES[n!.lord as GrahaId] ?? n!.lord)
    .join(' / ')

  return {
    headline: focusElsewhere
      ? 'Running dasha favours attention elsewhere — remedies must align with the period'
      : 'No strong “focus elsewhere” dasha house signal right now',
    severity,
    focusElsewhere,
    dashaHouses: uniqueHouses,
    dashaNote: dashaLabel
      ? `Current Vimshottari path: ${dashaLabel}. Houses linked to these lords: ${uniqueHouses.join(', ') || '—'}. Periods of 1st, 3rd, 11th, or 12th naturally pull focus away from studies.`
      : 'Dasha path unavailable — check Vimshottari after recalculating.',
    remedies: [
      'Neel Saraswati worship — especially for focus, studies, and wrong company',
      'Align remedial effort with the running dasha; wrong period = attention diverted regardless of effort',
      'Mercury / 5th-lord strengthening through honest study routine (behavioural upay first)',
    ],
    notes,
  }
}

export function analyzeAddictionSignatures(chart: ChartOutput, now = Date.now()): AddictionReading | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc || !chart.grahas?.length) return null

  const houseRoles: Record<number, string> = {
    12: 'Pleasure-seeking, escapism, altered consciousness, self-undoing',
    5: 'Cravings, pleasure, compulsive desire',
    6: 'Habits, compulsive behaviour, daily routines',
    8: 'Secrecy, hidden behaviour, psychological compulsion',
  }

  const primaryHouses = ([12, 5, 6, 8] as const).map(house => {
    const occ = maleficsOnHouse(chart, house)
    const hit = occ.length > 0
    return {
      house,
      role: houseRoles[house],
      hit,
      detail: hit
        ? `Occupied / aspected by ${occ.map(gn).join(', ')}`
        : 'No strong malefic occupation or classical aspect on this house',
    }
  })

  const ra = findGraha(chart, 'Ra')
  const ve = findGraha(chart, 'Ve')
  const sa = findGraha(chart, 'Sa')
  const me = findGraha(chart, 'Me')
  const ma = findGraha(chart, 'Ma')
  const mo = findGraha(chart, 'Mo')
  const ju = findGraha(chart, 'Ju')

  const planetSignatures: AddictionSignature[] = []
  const pushPlanet = (id: GrahaId, label: string, detail: string, severity: ShrapSeverity, active: boolean) => {
    if (!active) return
    planetSignatures.push({ id, label, detail, severity })
  }

  const raHouse = houseOf(chart, 'Ra')
  pushPlanet(
    'Ra',
    'Rahu — primary addiction planet',
    `Rahu in house ${raHouse ?? '—'}: intoxicants, illusions, smoke, obsessive loops`,
    raHouse && [5, 6, 8, 12].includes(raHouse) ? 'strong' : 'watch',
    !!ra,
  )
  pushPlanet(
    'Mo',
    'Moon — emotional comfort seeking',
    'Emotional / mental addiction signature when Moon is weak or with Rahu',
    onNodeAxis(chart, 'Mo') || (mo && mo.isCombust) ? 'watch' : 'clear',
    !!(mo && (onNodeAxis(chart, 'Mo') || mo.isCombust || (mo.dignity === 'debilitated'))),
  )
  pushPlanet(
    'Ve',
    'Venus — pleasure / alcohol / luxury',
    'Pleasure-based addiction signature (alcohol, luxury, sensual excess)',
    conjunct(ve, ra) ? 'strong' : 'watch',
    !!(ve && (conjunct(ve, ra) || onNodeAxis(chart, 'Ve') || ve.dignity === 'debilitated')),
  )
  pushPlanet(
    'Sa',
    'Saturn — entrenched habit',
    'Long-term habits and fear-based patterns — hardest to break without self-discipline',
    conjunct(sa, ra) ? 'strong' : 'watch',
    !!(sa && (conjunct(sa, ra) || (raHouse === 6 && houseOf(chart, 'Sa') === 6))),
  )
  pushPlanet(
    'Me',
    'Mercury — tech / gaming / gambling',
    'Technology addiction signature: gaming, internet, dating apps, trading',
    conjunct(me, ra) ? 'strong' : 'watch',
    !!(me && (conjunct(me, ra) || onNodeAxis(chart, 'Me'))),
  )
  pushPlanet(
    'Ma',
    'Mars — aggression under intoxication',
    'When linked with Rahu: risk of aggression while intoxicated — caution framing only',
    conjunct(ma, ra) ? 'strong' : 'watch',
    !!(ma && conjunct(ma, ra)),
  )
  pushPlanet(
    'Ju',
    'Jupiter afflicted — excess / philosophical escapism',
    'Afflicted Jupiter can exaggerate excess in all areas',
    'watch',
    !!(ju && (ju.dignity === 'debilitated' || onNodeAxis(chart, 'Ju'))),
  )

  const combinations: AddictionSignature[] = []
  if (conjunct(ra, ve)) {
    combinations.push({
      id: 'ra-ve',
      label: 'Rahu + Venus',
      detail: 'High desire, alcohol tendency, luxury beyond status, sexual excess themes',
      severity: 'strong',
    })
  }
  if (conjunct(ra, sa) && sa?.rashi === 10) {
    combinations.push({
      id: 'ra-sa-cap',
      label: 'Rahu + Saturn (Capricorn)',
      detail: 'Near-impossible to break by ritual alone — self-discipline is the real remedy',
      severity: 'strong',
    })
  } else if (conjunct(ra, sa)) {
    combinations.push({
      id: 'ra-sa',
      label: 'Rahu + Saturn',
      detail: 'Entrenched addictive habit pattern — discipline outweighs external upay',
      severity: 'strong',
    })
  }
  if (conjunct(ra, me)) {
    combinations.push({
      id: 'ra-me',
      label: 'Rahu + Mercury',
      detail: 'Gaming, internet, dating apps, day trading, gambling signatures',
      severity: 'strong',
    })
  }
  if (conjunct(ra, ma)) {
    combinations.push({
      id: 'ra-ma',
      label: 'Rahu + Mars',
      detail: 'Most volatile intoxication signature — heightened aggression risk when impaired. Not a prediction of crime; a caution to avoid substances and seek support.',
      severity: 'strong',
    })
  }

  const path = getDashaPathAt(chart.dashas?.vimshottari ?? [], now)
  const lords = path.map(n => n.lord as GrahaId)
  const triggerLords = new Set(['Ra', 'Ve', 'Sa', 'Me'])
  const dashaHit = lords.some(l => triggerLords.has(l))
  const dashaNote = lords.length
    ? `Running lords: ${lords.map(l => GRAHA_NAMES[l] ?? l).join(' → ')}. Addiction themes most often activate in Rahu periods (also Venus / Saturn / Mercury by type). ${dashaHit ? 'Current path includes a trigger lord — watch habits now.' : 'No classic trigger lord in the live path.'}`
    : 'Dasha path unavailable.'

  const hitHouses = primaryHouses.filter(h => h.hit).length
  let severity: ShrapSeverity = 'clear'
  if (combinations.some(c => c.severity === 'strong') || hitHouses >= 3) severity = 'strong'
  else if (combinations.length || hitHouses >= 1 || planetSignatures.some(p => p.severity !== 'clear')) severity = 'watch'

  return {
    headline:
      severity === 'clear'
        ? 'No strong addiction house / planet signature cluster'
        : 'Addiction signatures present — treat as tendencies, not a diagnosis',
    severity,
    disclaimer:
      'Educational astrology only. This is not a medical, psychiatric, or legal assessment. Seek professional help for substance or behavioural addiction.',
    primaryHouses,
    planetSignatures,
    combinations,
    dashaNote,
    remedies: [
      'Planet-specific remedies for the signature planet(s) above',
      'Rahu upay is almost always part of the stack when Rahu is involved',
      'Bhairav, Shiva, or Hanuman worship — match to the dasha lord',
      'For Saturn–Rahu: self-discipline is the only reliable remedy; rituals alone will not hold',
      'For children’s gaming / internet: same framework — identify planet + dasha',
    ],
    childVsAdult:
      'Same framework for adults and children; expression changes. Children: gaming / internet / mobile (Mercury–Rahu). Adults: substances / alcohol / gambling (Rahu–Venus–Saturn). Dasha triggers the pattern in both.',
  }
}
