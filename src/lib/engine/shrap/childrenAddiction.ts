// ─────────────────────────────────────────────────────────────
//  src/lib/engine/shrap/childrenAddiction.ts
//  Children’s focus / education hints and addiction signatures
//  Framed as tendencies — not medical or legal diagnosis.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { SHRAP_HI, shrapHouseObl } from '@/lib/engine/locale/shrapDosha.hi'
import { SIGN_LORD_BY_RASHI } from '@/lib/engine/lordshipInterpretations'
import {
  conjunct,
  findGraha,
  gn,
  gnList,
  houseOf,
  houseSign,
  maleficsOnHouse,
  onNodeAxis,
  tx,
  txList,
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

export function analyzeChildrenFocus(chart: ChartOutput, now = Date.now(), lang: EngineLang = 'en'): ChildrenFocusReading | null {
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

  const C = SHRAP_HI.children
  if (h5.length) {
    notes.push(tx(lang, `5th house under pressure from ${h5.map((g) => gn(g)).join(', ')} — study / focus themes need care.`, C.h5, {
      grahas: gnList(h5, lang),
    }))
  }
  if (me && (me.isCombust || onNodeAxis(chart, 'Me'))) {
    notes.push(tx(lang, 'Mercury weak or on the node axis — concentration and learning circuits fluctuate.', C.mercury))
  }
  if (meHouse === 12 || meHouse === 8) {
    notes.push(tx(
      lang,
      `Mercury in house ${meHouse} — mind may scatter into escape or secrecy rather than desk work.`,
      C.mercuryHouse,
      { graha: gn('Me', lang), ord: shrapHouseObl(meHouse) },
    ))
  }

  let severity: ShrapSeverity = 'clear'
  if (focusElsewhere && h5.length) severity = 'strong'
  else if (focusElsewhere || h5.length || notes.length) severity = 'watch'

  const dashaLabel = [md, ad]
    .filter(Boolean)
    .map(n => gn(n!.lord as GrahaId, lang))
    .join(' / ')

  return {
    headline: focusElsewhere
      ? tx(lang, 'Running dasha favours attention elsewhere — remedies must align with the period', C.headlineAway)
      : tx(lang, 'No strong “focus elsewhere” dasha house signal right now', C.headlineHere),
    severity,
    focusElsewhere,
    dashaHouses: uniqueHouses,
    dashaNote: dashaLabel
      ? tx(
          lang,
          `Current Vimshottari path: ${dashaLabel}. Houses linked to these lords: ${uniqueHouses.join(', ') || '—'}. Periods of 1st, 3rd, 11th, or 12th naturally pull focus away from studies.`,
          C.dasha,
          { path: dashaLabel, houses: uniqueHouses.join(', ') || '—' },
        )
      : tx(lang, 'Dasha path unavailable — check Vimshottari after recalculating.', C.dashaMissing),
    remedies: txList(lang, [
      'Neel Saraswati worship — especially for focus, studies, and wrong company',
      'Align remedial effort with the running dasha; wrong period = attention diverted regardless of effort',
      'Mercury / 5th-lord strengthening through honest study routine (behavioural upay first)',
    ], C.remedies),
    notes,
  }
}

export function analyzeAddictionSignatures(chart: ChartOutput, now = Date.now(), lang: EngineLang = 'en'): AddictionReading | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc || !chart.grahas?.length) return null

  const A = SHRAP_HI.addiction
  const houseRoles: Record<number, string> = lang === 'hi'
    ? { ...A.roles }
    : {
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
        ? tx(lang, `Occupied / aspected by ${occ.map((g) => gn(g)).join(', ')}`, A.hit, { grahas: gnList(occ, lang) })
        : tx(lang, 'No strong malefic occupation or classical aspect on this house', A.miss),
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
    tx(lang, 'Rahu — primary addiction planet', A.planets.Ra.label),
    tx(lang, `Rahu in house ${raHouse ?? '—'}: intoxicants, illusions, smoke, obsessive loops`, A.planets.Ra.detail, {
      graha: gn('Ra', lang),
      house: raHouse ?? '—',
    }),
    raHouse && [5, 6, 8, 12].includes(raHouse) ? 'strong' : 'watch',
    !!ra,
  )
  pushPlanet(
    'Mo',
    tx(lang, 'Moon — emotional comfort seeking', A.planets.Mo.label),
    tx(lang, 'Emotional / mental addiction signature when Moon is weak or with Rahu', A.planets.Mo.detail),
    onNodeAxis(chart, 'Mo') || (mo && mo.isCombust) ? 'watch' : 'clear',
    !!(mo && (onNodeAxis(chart, 'Mo') || mo.isCombust || (mo.dignity === 'debilitated'))),
  )
  pushPlanet(
    'Ve',
    tx(lang, 'Venus — pleasure / alcohol / luxury', A.planets.Ve.label),
    tx(lang, 'Pleasure-based addiction signature (alcohol, luxury, sensual excess)', A.planets.Ve.detail),
    conjunct(ve, ra) ? 'strong' : 'watch',
    !!(ve && (conjunct(ve, ra) || onNodeAxis(chart, 'Ve') || ve.dignity === 'debilitated')),
  )
  pushPlanet(
    'Sa',
    tx(lang, 'Saturn — entrenched habit', A.planets.Sa.label),
    tx(lang, 'Long-term habits and fear-based patterns — hardest to break without self-discipline', A.planets.Sa.detail),
    conjunct(sa, ra) ? 'strong' : 'watch',
    !!(sa && (conjunct(sa, ra) || (raHouse === 6 && houseOf(chart, 'Sa') === 6))),
  )
  pushPlanet(
    'Me',
    tx(lang, 'Mercury — tech / gaming / gambling', A.planets.Me.label),
    tx(lang, 'Technology addiction signature: gaming, internet, dating apps, trading', A.planets.Me.detail),
    conjunct(me, ra) ? 'strong' : 'watch',
    !!(me && (conjunct(me, ra) || onNodeAxis(chart, 'Me'))),
  )
  pushPlanet(
    'Ma',
    tx(lang, 'Mars — aggression under intoxication', A.planets.Ma.label),
    tx(lang, 'When linked with Rahu: risk of aggression while intoxicated — caution framing only', A.planets.Ma.detail),
    conjunct(ma, ra) ? 'strong' : 'watch',
    !!(ma && conjunct(ma, ra)),
  )
  pushPlanet(
    'Ju',
    tx(lang, 'Jupiter afflicted — excess / philosophical escapism', A.planets.Ju.label),
    tx(lang, 'Afflicted Jupiter can exaggerate excess in all areas', A.planets.Ju.detail),
    'watch',
    !!(ju && (ju.dignity === 'debilitated' || onNodeAxis(chart, 'Ju'))),
  )

  const combinations: AddictionSignature[] = []
  if (conjunct(ra, ve)) {
    combinations.push({
      id: 'ra-ve',
      label: tx(lang, 'Rahu + Venus', A.combos.ve.label),
      detail: tx(lang, 'High desire, alcohol tendency, luxury beyond status, sexual excess themes', A.combos.ve.detail),
      severity: 'strong',
    })
  }
  if (conjunct(ra, sa) && sa?.rashi === 10) {
    combinations.push({
      id: 'ra-sa-cap',
      label: tx(lang, 'Rahu + Saturn (Capricorn)', A.combos.saCap.label),
      detail: tx(lang, 'Near-impossible to break by ritual alone — self-discipline is the real remedy', A.combos.saCap.detail),
      severity: 'strong',
    })
  } else if (conjunct(ra, sa)) {
    combinations.push({
      id: 'ra-sa',
      label: tx(lang, 'Rahu + Saturn', A.combos.sa.label),
      detail: tx(lang, 'Entrenched addictive habit pattern — discipline outweighs external upay', A.combos.sa.detail),
      severity: 'strong',
    })
  }
  if (conjunct(ra, me)) {
    combinations.push({
      id: 'ra-me',
      label: tx(lang, 'Rahu + Mercury', A.combos.me.label),
      detail: tx(lang, 'Gaming, internet, dating apps, day trading, gambling signatures', A.combos.me.detail),
      severity: 'strong',
    })
  }
  if (conjunct(ra, ma)) {
    combinations.push({
      id: 'ra-ma',
      label: tx(lang, 'Rahu + Mars', A.combos.ma.label),
      detail: tx(lang, 'Most volatile intoxication signature — heightened aggression risk when impaired. Not a prediction of crime; a caution to avoid substances and seek support.', A.combos.ma.detail),
      severity: 'strong',
    })
  }

  const path = getDashaPathAt(chart.dashas?.vimshottari ?? [], now)
  const lords = path.map(n => n.lord as GrahaId)
  const triggerLords = new Set(['Ra', 'Ve', 'Sa', 'Me'])
  const dashaHit = lords.some(l => triggerLords.has(l))
  const lordLineEn = lords.map(l => gn(l, 'en')).join(' → ')
  const lordLine = lords.map(l => gn(l, lang)).join(' → ')
  const tailEn = dashaHit
    ? 'Current path includes a trigger lord — watch habits now.'
    : 'No classic trigger lord in the live path.'
  const dashaNote = lords.length
    ? tx(
        lang,
        `Running lords: ${lordLineEn}. Addiction themes most often activate in Rahu periods (also Venus / Saturn / Mercury by type). ${tailEn}`,
        A.dasha,
        { lords: lordLine, tail: dashaHit ? A.dashaHit : A.dashaQuiet },
      )
    : tx(lang, 'Dasha path unavailable.', A.dashaMissing)

  const hitHouses = primaryHouses.filter(h => h.hit).length
  let severity: ShrapSeverity = 'clear'
  if (combinations.some(c => c.severity === 'strong') || hitHouses >= 3) severity = 'strong'
  else if (combinations.length || hitHouses >= 1 || planetSignatures.some(p => p.severity !== 'clear')) severity = 'watch'

  return {
    headline: severity === 'clear'
      ? tx(lang, 'No strong addiction house / planet signature cluster', A.headlineClear)
      : tx(lang, 'Addiction signatures present — treat as tendencies, not a diagnosis', A.headlineOn),
    severity,
    disclaimer: tx(
      lang,
      'Educational astrology only. This is not a medical, psychiatric, or legal assessment. Seek professional help for substance or behavioural addiction.',
      A.disclaimer,
    ),
    primaryHouses,
    planetSignatures,
    combinations,
    dashaNote,
    remedies: txList(lang, [
      'Planet-specific remedies for the signature planet(s) above',
      'Rahu upay is almost always part of the stack when Rahu is involved',
      'Bhairav, Shiva, or Hanuman worship — match to the dasha lord',
      'For Saturn–Rahu: self-discipline is the only reliable remedy; rituals alone will not hold',
      'For children’s gaming / internet: same framework — identify planet + dasha',
    ], A.remedies),
    childVsAdult: tx(
      lang,
      'Same framework for adults and children; expression changes. Children: gaming / internet / mobile (Mercury–Rahu). Adults: substances / alcohol / gambling (Rahu–Venus–Saturn). Dasha triggers the pattern in both.',
      A.childVsAdult,
    ),
  }
}
