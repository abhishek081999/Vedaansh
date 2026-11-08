// ─────────────────────────────────────────────────────────────
//  src/lib/engine/interpretationHub.ts
//  One place for every reading the chart supports: overview,
//  planets, houses, rashis, strength, transits and dashas.
//  Pure and client-safe — transit positions are passed in.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { TransitPosition } from '@/lib/engine/transits'
import {
  getHouseTheme,
  getPlanetInHouse,
  getSignInHouse,
  isClassicalGraha,
  wholeSignHouseFromLagna,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import {
  CLASSICAL_SOURCE_LABEL,
  classicalNotesInLang,
  classicalSourceLabel,
  classicalTextHi,
  getPlanetInHouseClassicalSummary,
  type ClassicalNote,
} from '@/lib/engine/classicalInterpretations'
import { getRashiProfile, getRashiInHouse, getPlanetInSign, rashiProfileText } from '@/lib/engine/rashiInterpretations'
import { SIGN_TEXT_HI } from '@/lib/engine/locale/signInterpretations.hi'
import { mixPlanetFromGraha } from '@/lib/engine/planetInterpretationMix'
import { localizeChartInterpretation } from '@/lib/engine/advancedInterpretationLang'
import { dignityInterpretation, nakshatraInterpretation } from '@/lib/engine/interpretations'
import { getChartHouseClassical, getChartMultiVakriNotes } from '@/lib/engine/classicalChartAnalysis'
import { evaluateGochar, houseFrom, isGocharPlanet, type GocharPlanet } from '@/lib/engine/gocharRules'
import { analyzeVimshottariPeriod } from '@/lib/engine/dasha/vimshottariAnalysis'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { GRAHA_HI, KARAKA_SHORT_HI, NAKSHATRA_DEITY_HI, NAKSHATRA_HI, NAKSHATRA_SYMBOL_HI, RASHI_HI } from '@/i18n/jyotish'
import { getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'
import { SHAKTI_HI } from '@/lib/engine/locale/nakshatraMuhurta.hi'
import { NAKSHATRA_NAMES } from '@/types/astrology'
import { ordHi, ordHiDirect } from '@/lib/engine/locale/todayReading.hi'
import { YOGA_CATEGORY_HI, YOGA_STRENGTH_HI, yogaDescriptionHi, yogaEffectHi, yogaNameHi } from '@/lib/engine/locale/yogas.hi'
import { RASHI_FIRST_REMEDY_HI } from '@/lib/engine/locale/tattvaPrediction.hi'
import {
  HUB_AREA_STRENGTH_HI,
  HUB_BAND_HI,
  HUB_CATEGORY_HI,
  HUB_DIGNITY_HI,
  HUB_HI as HH,
  HUB_HI,
  HUB_LAYER_HI,
  NAK_BODY_PART_HI,
  NAK_GANA_HI,
  NAK_NADI_HI,
  NAK_NATURE_HI,
  NAK_ROW_HI,
  HUB_PROFILE_HI,
  HUB_RASHI_HI,
  HUB_SATURN_FROM_MOON_HI,
  HUB_SECTION_HI,
} from '@/lib/engine/locale/interpretationHub.hi'

export type HubTone = 'supportive' | 'caution' | 'mixed' | 'neutral'

export type HubSectionId = 'overview' | 'planets' | 'houses' | 'rashis' | 'strength' | 'transit' | 'dasha'

export interface HubPoint {
  label?: string
  text: string
  source?: string
}

export interface HubItem {
  id: string
  title: string
  subtitle?: string
  tone: HubTone
  summary: string
  points: HubPoint[]
  tags?: string[]
}

export interface HubSection {
  id: HubSectionId
  label: string
  intro: string
  items: HubItem[]
}

const CLASSICAL_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const DIGNITY_LABEL: Record<Dignity, string> = {
  exalted: 'Exalted',
  moolatrikona: 'Moolatrikona',
  own: 'Own sign',
  great_friend: 'Great friend',
  friend: 'Friendly',
  neutral: 'Neutral',
  enemy: 'Enemy sign',
  great_enemy: 'Great enemy',
  debilitated: 'Debilitated',
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function dignityTone(d: string | null | undefined): HubTone {
  if (d === 'exalted' || d === 'moolatrikona' || d === 'own' || d === 'great_friend' || d === 'friend') return 'supportive'
  if (d === 'debilitated' || d === 'enemy' || d === 'great_enemy') return 'caution'
  return 'mixed'
}

function notePoints(notes: ClassicalNote[] | undefined, label?: string, lang: EngineLang = 'en'): HubPoint[] {
  return classicalNotesInLang(notes ?? [], lang).map((n) => ({
    label,
    text: n.text,
    source: n.ref ? `${classicalSourceLabel(n.source, lang)} · ${n.ref}` : classicalSourceLabel(n.source, lang),
  }))
}

const RASHI_CORE_TO_HI = new Map<string, string>(
  (Object.keys(HUB_RASHI_HI) as unknown as Rashi[]).flatMap((r) => {
    const p = getRashiProfile(Number(r))
    return [[p?.coreSummary ?? '', HUB_RASHI_HI[r].core], [p?.lordSummary ?? '', HUB_RASHI_HI[r].lord]] as [string, string][]
  }),
)

/** Any shared-corpus sentence in `lang` (classical, vakri, lordship, rashi prose, sign psyche); unknown text unchanged. */
function txt(text: string, lang: EngineLang): string {
  if (lang !== 'hi' || !text) return text
  const c = classicalTextHi(text)
  if (c !== text) return c
  const r = rashiProfileText(text, 'hi')
  if (r !== text) return r
  return SIGN_TEXT_HI[text] ?? RASHI_CORE_TO_HI.get(text) ?? text
}

function gn(id: GrahaId, lang: EngineLang): string {
  return (lang === 'hi' ? GRAHA_HI[id] : GRAHA_NAMES[id]) ?? id
}

function rn(r: Rashi, lang: EngineLang): string {
  return lang === 'hi' ? RASHI_HI[r] : RASHI_NAMES[r]
}

function dig(d: string, lang: EngineLang): string {
  return (lang === 'hi' ? HUB_DIGNITY_HI[d] : DIGNITY_LABEL[d as Dignity]) ?? d
}

function nakHi(name: string): string {
  const i = NAKSHATRA_NAMES.indexOf(name as (typeof NAKSHATRA_NAMES)[number])
  return i >= 0 ? NAKSHATRA_HI[i] ?? name : name
}

function hiLabel(id: HubSectionId): string {
  return HUB_SECTION_HI[id]!.label
}

function firstSentence(text: string | null | undefined): string {
  if (!text) return ''
  const m = text.match(/^.*?[.!?।](\s|$)/)
  return (m ? m[0] : text).trim()
}

function houseOf(chart: ChartOutput, rashi: Rashi): HouseNumber {
  return wholeSignHouseFromLagna(chart.lagnas.ascRashi, rashi)
}

// ── Overview ────────────────────────────────────────────────

export function buildOverviewSection(chart: ChartOutput, lang: EngineLang = 'en'): HubSection {
  const hi = lang === 'hi'
  const interp = hi && chart.interpretation
    ? localizeChartInterpretation(chart.interpretation, { grahas: chart.grahas, shadbala: chart.shadbala, ascRashi: chart.lagnas.ascRashi }, 'hi')
    : chart.interpretation
  const insights = interp
    ? [...interp.strengths, ...interp.cautions, ...interp.special].sort((a, b) => b.priority - a.priority)
    : []
  const items: HubItem[] = insights.map((i) => ({
    id: `insight-${i.id}`,
    title: i.title,
    subtitle: hi
      ? i.house ? fill(HH.insightSubtitleHouse, { category: HUB_CATEGORY_HI[i.category] ?? i.category, nth: ordHiDirect(i.house) }) : HUB_CATEGORY_HI[i.category] ?? i.category
      : i.house ? `${i.category} · ${ordinal(i.house)} house` : i.category,
    tone: i.tone,
    summary: i.message,
    points: (i.actions ?? []).map((a) => ({ label: hi ? HH.action : 'Action', text: a })),
    tags: i.relatedGrahas.map((g) => gn(g, lang)),
  }))

  // Charts often hold several yogas with the same display name (e.g. multiple Raja Yogas).
  // Include index + planets so React keys and hub item ids stay unique.
  for (const [yi, y] of (chart.yogas ?? []).entries()) {
    items.push({
      id: `yoga-${yi}-${y.name}-${y.planets.join('-')}`,
      title: hi ? yogaNameHi(y.name) : y.name,
      subtitle: hi
        ? fill(HH.yogaSubtitle, { category: YOGA_CATEGORY_HI[y.category] ?? y.category, strength: YOGA_STRENGTH_HI[y.strength] ?? y.strength })
        : `${y.sanskrit} · ${y.category} yoga · ${y.strength}`,
      tone: y.category === 'malefic' ? 'caution' : y.strength === 'weak' ? 'mixed' : 'supportive',
      summary: hi
        ? (y.effect ? yogaEffectHi(y.name, y.effect) : yogaDescriptionHi(y.description))
        : y.effect || y.description,
      points: [
        ...(y.description && y.description !== y.effect ? [{ label: hi ? HH.formation : 'Formation', text: hi ? yogaDescriptionHi(y.description) : y.description }] : []),
        ...(y.houses.length ? [{ label: hi ? HH.houses : 'Houses', text: hi ? y.houses.join(', ') : y.houses.map(ordinal).join(', ') }] : []),
      ],
      tags: y.planets.map((p) => gn(p as GrahaId, lang)),
    })
  }

  const vakri = getChartMultiVakriNotes(chart)
  if (vakri.length) {
    items.push({
      id: 'multi-vakri',
      title: hi ? HH.multiVakri : 'Several retrograde planets',
      tone: 'mixed',
      summary: txt(vakri[0].text, lang),
      points: notePoints(vakri.slice(1), undefined, lang),
    })
  }

  return {
    id: 'overview',
    label: hi ? hiLabel('overview') : 'Overview',
    intro: hi ? HUB_SECTION_HI.overview!.intro : interp?.headline ?? 'Key themes, yogas and chart-wide patterns.',
    items,
  }
}

// ── Planets ─────────────────────────────────────────────────

type MixLayer = NonNullable<ReturnType<typeof mixPlanetFromGraha>>['layers'][number]

/** Hindi label/provenance for a planet-mix layer; swaps in Hindi text where the shared tables have it. */
function mixLayerHi(
  l: MixLayer,
  c: { id: GrahaId; house: number; rashi: Rashi; nak: number; pada: number; dignity: string },
): MixLayer {
  const graha = GRAHA_HI[c.id]
  const rashi = RASHI_HI[c.rashi]
  const nth = ordHi(c.house)
  const meta = HUB_LAYER_HI[l.id]
  if (!meta) return l
  const owns = l.id === 'lordship' ? (l.label.match(/\d+/g) ?? []).join(', ') : ''
  const label = fill(l.id === 'lordship' && !/^Lagna lord/.test(l.label) ? HUB_HI.lordshipOwns : meta.label, {
    graha, rashi, nth, h: c.house, nak: NAKSHATRA_HI[c.nak] ?? '', pada: c.pada, dignity: HUB_DIGNITY_HI[c.dignity] ?? c.dignity, owns,
  })
  let texts = l.texts.map((t) => txt(t, 'hi'))
  if (l.id === 'house_theme') {
    const th = getHouseTheme(c.house, 'hi')
    if (th) texts = [`${th.english} (${th.sanskrit}): ${th.shortThemes}`, th.intro, ...(th.coreThemes ?? []).slice(0, 4)].filter(Boolean)
  }
  if (l.id === 'sign_in_house') texts = [getSignInHouse(c.house, c.rashi, 'hi') ?? texts[0]!].filter(Boolean)
  if (l.id === 'lordship' && owns) texts = [fill(NAK_ROW_HI.ownsLord, { list: owns, h: c.house })]
  if (l.id === 'planet_house_platform') texts = [getPlanetInHouse(c.id, c.house, 'full', 'hi') ?? getPlanetInHouse(c.id, c.house, 'summary', 'hi') ?? texts[0]!].filter(Boolean)
  if (l.id === 'planet_sign_platform') texts = [getPlanetInSign(c.id, c.rashi, 'summary', 'hi') ?? texts[0]!].filter(Boolean)
  if (l.id === 'dignity') texts = [dignityInterpretation(c.dignity, 'hi') ?? texts[0]!].filter(Boolean)
  if (l.id === 'nakshatra' && texts.length) {
    const ch = getNakshatraCharacteristics(c.nak, c.pada)
    texts = [
      nakshatraInterpretation(c.nak, 'hi') ?? texts[0]!,
      fill(NAK_ROW_HI.meta, {
        lord: GRAHA_HI[ch.lord], deity: NAKSHATRA_DEITY_HI[ch.index] ?? ch.deity, gana: NAK_GANA_HI[ch.gana] ?? ch.gana,
        nadi: NAK_NADI_HI[ch.nadi] ?? ch.nadi, symbol: NAKSHATRA_SYMBOL_HI[ch.index] ?? ch.symbol,
      }),
      ...(ch.shakti ? [fill(NAK_ROW_HI.shakti, { v: SHAKTI_HI[ch.index] ?? ch.shakti })] : []),
      ...(ch.nature ? [fill(NAK_ROW_HI.nature, { v: NAK_NATURE_HI[ch.nature] ?? ch.nature })] : []),
      ...(ch.bodyPart ? [fill(NAK_ROW_HI.body, { v: NAK_BODY_PART_HI[ch.index] ?? ch.bodyPart })] : []),
    ]
  }
  return { ...l, label, provenance: meta.source, texts }
}

export function buildPlanetsSection(chart: ChartOutput, lang: EngineLang = 'en'): HubSection {
  const ascRashi = chart.lagnas.ascRashi
  const hi = lang === 'hi'
  const items: HubItem[] = []
  for (const id of CLASSICAL_ORDER) {
    const g = chart.grahas.find((p) => p.id === id)
    if (!g) continue
    const house = houseOf(chart, g.rashi)
    const mix = mixPlanetFromGraha(g, house, ascRashi)
    const flags = [
      g.isRetro ? (hi ? HH.retro : 'Retrograde') : null,
      g.isCombust ? (hi ? HH.combust : 'Combust') : null,
      g.charaKaraka ? (hi ? KARAKA_SHORT_HI[g.charaKaraka] ?? g.charaKaraka : g.charaKaraka) : null,
      g.gandanta?.isGandanta ? (hi ? HH.gandanta : 'Gandanta') : null,
    ].filter(Boolean) as string[]
    items.push({
      id: `planet-${id}`,
      title: hi ? fill(HH.planetTitle, { graha: gn(id, lang), rashi: rn(g.rashi, lang) }) : `${g.name} in ${g.rashiName}`,
      subtitle: hi
        ? fill(HH.planetSubtitle, { nth: ordHiDirect(house), nak: NAKSHATRA_HI[g.nakshatraIndex] ?? g.nakshatraName, pada: g.pada, dignity: dig(g.dignity, lang) })
        : `${ordinal(house)} house · ${g.nakshatraName} pada ${g.pada} · ${DIGNITY_LABEL[g.dignity] ?? g.dignity}`,
      tone: dignityTone(g.dignity),
      summary: hi
        ? getPlanetInHouse(id, house, 'summary', 'hi')
          ?? getPlanetInSign(id, g.rashi, 'summary', 'hi')
          ?? fill(HH.planetFallback, { graha: gn(id, lang), nth: ordHi(house) })
        : getPlanetInHouse(id, house, 'summary')
        ?? getPlanetInSign(id, g.rashi, 'summary')
        ?? mix?.blendedSummary
        ?? `${g.name} occupies the ${ordinal(house)} house.`,
      points: (mix?.layers ?? []).map((l) => (hi ? mixLayerHi(l, { id, house, rashi: g.rashi, nak: g.nakshatraIndex, pada: g.pada, dignity: g.dignity }) : l)).flatMap((l) => [
        ...l.texts.map((t) => ({ label: l.label, text: t, source: l.provenance })),
        ...notePoints(l.classicalNotes, l.label, lang),
      ]),
      tags: flags,
    })
  }
  return {
    id: 'planets',
    label: hi ? hiLabel('planets') : 'Planets',
    intro: hi ? HUB_SECTION_HI.planets!.intro : 'Each graha read through its house, sign, dignity, nakshatra, lordship and retrograde/combust state.',
    items,
  }
}

// ── Houses ──────────────────────────────────────────────────

export function buildHousesSection(chart: ChartOutput, lang: EngineLang = 'en'): HubSection {
  const ascRashi = chart.lagnas.ascRashi
  const hi = lang === 'hi'
  const items: HubItem[] = []
  for (let h = 1 as HouseNumber; h <= 12; h = (h + 1) as HouseNumber) {
    const theme = getHouseTheme(h, lang)
    const rashi = (((ascRashi - 1 + h - 1) % 12) + 1) as Rashi
    const pkg = getChartHouseClassical(chart, h)
    const bb = chart.bhavaBala?.houses?.[h]
    const occupants = chart.grahas.filter((g) => isClassicalGraha(g.id) && houseOf(chart, g.rashi) === h)
    const lordName = pkg.lordship ? gn(pkg.lordship.lordId, lang) : null

    let tone: HubTone = 'neutral'
    if (chart.bhavaBala) {
      if (chart.bhavaBala.strongestHouse === h) tone = 'supportive'
      else if (chart.bhavaBala.weakestHouse === h) tone = 'caution'
    }

    const points: HubPoint[] = [
      ...(theme?.intro ? [{ label: hi ? HH.meaning : 'Meaning', text: theme.intro }] : []),
      ...[getSignInHouse(h, rashi, lang), txt(getRashiInHouse(rashi, h) ?? '', lang)]
        .filter((t): t is string => !!t)
        .map((text) => ({ label: hi ? fill(HH.rashiOnHouse, { rashi: RASHI_HI[rashi] }) : `${RASHI_NAMES[rashi]} on this house`, text })),
      ...(pkg.lordship && lordName
        ? [{
            label: hi ? HH.houseLord : 'House lord',
            text: hi
              ? fill(HH.houseLordText, { lord: lordName, nth: ordHi(pkg.lordship.placedIn) })
              : `${lordName} rules this house and sits in the ${ordinal(pkg.lordship.placedIn)} house.`,
          }, ...notePoints(pkg.lordship.notes, hi ? HH.houseLord : 'House lord', lang)]
        : []),
      ...occupants.map((g) => ({
        label: hi ? fill(HH.occupantHere, { graha: gn(g.id, lang) }) : `${g.name} here`,
        text: (hi ? getPlanetInHouse(g.id, h, 'summary', 'hi') : null) ?? getPlanetInHouse(g.id, h, 'summary') ?? txt(getPlanetInHouseClassicalSummary(g.id, h) ?? '', lang),
      })).filter((p) => p.text),
      ...pkg.aspectHits.map((a) => ({
        label: hi ? fill(HH.aspectFrom, { graha: gn(a.fromGraha, lang), nth: ordHi(a.fromHouse) }) : `${GRAHA_NAMES[a.fromGraha]} aspect from ${ordinal(a.fromHouse)}`,
        text: txt(a.note.text, lang),
        source: classicalSourceLabel(a.note.source, lang),
      })),
      ...notePoints(pkg.houseNotes, hi ? HH.classical : 'Classical', lang),
      ...(bb ? [{ label: hi ? HH.bhavaBala : 'Bhava Bala', text: hi ? fill(HH.rupas, { n: bb.totalRupa.toFixed(2) }) : `${bb.totalRupa.toFixed(2)} rupas` }] : []),
    ]

    items.push({
      id: `house-${h}`,
      title: hi ? fill(HH.houseTitle, { nth: ordHiDirect(h), english: theme?.english ?? '' }).trim() : `${ordinal(h)} house — ${theme?.english ?? ''}`.trim(),
      subtitle: hi
        ? fill(lordName ? HH.houseSubtitleLord : HH.houseSubtitle, { sanskrit: theme?.sanskrit ?? '', rashi: RASHI_HI[rashi], lord: lordName ?? '' })
        : `${theme?.sanskrit ?? ''} · ${RASHI_NAMES[rashi]}${lordName ? ` · lord ${lordName}` : ''}`,
      tone,
      summary: theme?.shortThemes ?? '',
      points,
      tags: occupants.map((g) => gn(g.id, lang)),
    })
  }
  return {
    id: 'houses',
    label: hi ? hiLabel('houses') : 'Houses',
    intro: hi ? HUB_SECTION_HI.houses!.intro : 'All 12 bhavas with their sign, lord placement, occupants, aspects and Bhava Bala.',
    items,
  }
}

// ── Rashis ──────────────────────────────────────────────────

export function buildRashisSection(chart: ChartOutput, lang: EngineLang = 'en'): HubSection {
  const ascRashi = chart.lagnas.ascRashi
  const hi = lang === 'hi'
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const sun = chart.grahas.find((g) => g.id === 'Su')
  const keyRoles = new Map<Rashi, string[]>()
  const addRole = (r: Rashi | undefined, role: string) => {
    if (!r) return
    keyRoles.set(r, [...(keyRoles.get(r) ?? []), role])
  }
  addRole(ascRashi, hi ? HH.lagna : 'Lagna')
  addRole(moon?.rashi, hi ? HH.moonSign : 'Moon sign')
  addRole(sun?.rashi, hi ? HH.sunSign : 'Sun sign')

  const occupied = new Set(chart.grahas.filter((g) => isClassicalGraha(g.id)).map((g) => g.rashi))
  const ordered: Rashi[] = [
    ...keyRoles.keys(),
    ...Array.from({ length: 12 }, (_, i) => (((ascRashi - 1 + i) % 12) + 1) as Rashi)
      .filter((r) => !keyRoles.has(r) && occupied.has(r)),
  ]

  const items: HubItem[] = []
  for (const r of ordered) {
    const p = getRashiProfile(r)
    if (!p) continue
    const house = houseOf(chart, r)
    const occupants = chart.grahas.filter((g) => isClassicalGraha(g.id) && g.rashi === r)
    items.push({
      id: `rashi-${r}`,
      title: hi ? RASHI_HI[r] : `${p.english} (${p.sanskrit})`,
      subtitle: hi ? fill(HH.rashiSubtitle, { nth: ordHiDirect(house), lord: gn(p.lord, lang) }) : `${ordinal(house)} house · lord ${GRAHA_NAMES[p.lord]}`,
      tone: 'neutral',
      summary: hi ? HUB_RASHI_HI[r].core : p.coreSummary,
      points: [
        ...p.coreNature.map((t) => ({ label: hi ? HH.nature : 'Nature', text: txt(t, lang) })),
        { label: hi ? HH.lord : 'Lord', text: hi ? HUB_RASHI_HI[r].lord : p.lordSummary },
        ...(p.inHouse[house] ? [{ label: hi ? fill(HH.inYourHouse, { nth: ordHi(house) }) : `In your ${ordinal(house)} house`, text: txt(p.inHouse[house], lang) }] : []),
        ...occupants.map((g) => ({
          label: hi ? fill(HH.planetInRashi, { graha: gn(g.id, lang), rashi: RASHI_HI[r] }) : `${g.name} in ${p.english}`,
          text: getPlanetInSign(g.id, r, 'full', lang) ?? '',
        })).filter((x) => x.text),
        ...p.specialRules.map((t) => ({ label: hi ? HH.specialRule : 'Special rule', text: txt(t, lang) })),
        ...p.remedies.map((t, i) => ({ label: hi ? HH.remedy : 'Remedy', text: hi && i === 0 ? RASHI_FIRST_REMEDY_HI[r] : txt(t, lang) })),
      ],
      tags: [...(keyRoles.get(r) ?? []), ...occupants.map((g) => gn(g.id, lang))],
    })
  }
  return {
    id: 'rashis',
    label: hi ? hiLabel('rashis') : 'Rashis',
    intro: hi ? HUB_SECTION_HI.rashis!.intro : 'Lagna, Moon and Sun signs first, then every sign that holds a planet.',
    items,
  }
}

// ── Strength ────────────────────────────────────────────────

export function buildStrengthSection(chart: ChartOutput, lang: EngineLang = 'en'): HubSection {
  const items: HubItem[] = []
  const hi = lang === 'hi'
  const sh = (n: number) => (hi ? fill(HH.shash, { n: n.toFixed(1) }) : `${n.toFixed(1)} shashtiamsas`)
  const sb = chart.shadbala
  if (sb?.planets) {
    const rows = CLASSICAL_ORDER
      .map((id) => ({ id, p: sb.planets[id] }))
      .filter((r) => r.p)
      .sort((a, b) => b.p.ratio - a.p.ratio)
    for (const { id, p } of rows) {
      const band = p.qualityBand ?? (p.isStrong ? 'strong' : 'weak')
      const comps = p.componentShash
      items.push({
        id: `shadbala-${id}`,
        title: hi ? fill(HH.strengthTitle, { graha: gn(id, lang), band: HUB_BAND_HI[band] ?? band }) : `${GRAHA_NAMES[id]} — ${band}`,
        subtitle: hi
          ? fill(HH.strengthSubtitle, { total: p.total.toFixed(2), required: p.required.toFixed(2), ratio: p.ratio.toFixed(2) })
          : `Shadbala ${p.total.toFixed(2)} / ${p.required.toFixed(2)} rupas · ratio ${p.ratio.toFixed(2)}`,
        tone: band === 'excellent' || band === 'strong' ? 'supportive' : band === 'weak' ? 'caution' : 'mixed',
        summary: hi
          ? fill(p.isStrong ? HH.strengthStrong : HH.strengthWeak, { graha: gn(id, lang) })
          : p.interpretation
          ?? (p.isStrong
            ? `${GRAHA_NAMES[id]} has enough strength to deliver its significations reliably.`
            : `${GRAHA_NAMES[id]} falls short of its required strength; its results need support.`),
        points: comps
          ? [
              { label: hi ? HH.sthana : 'Sthana (position)', text: sh(comps.sthana) },
              { label: hi ? HH.dig : 'Dig (direction)', text: sh(comps.dig) },
              { label: hi ? HH.kala : 'Kala (time)', text: sh(comps.kala) },
              { label: hi ? HH.chesta : 'Chesta (motion)', text: sh(comps.chesta) },
              { label: hi ? HH.naisargika : 'Naisargika (natural)', text: sh(comps.naisargika) },
              { label: hi ? HH.drik : 'Drik (aspect)', text: sh(comps.drik) },
            ]
          : [],
        tags: [
          ...(sb.strongest === id ? [hi ? HH.strongest : 'Strongest'] : []),
          ...(sb.weakest === id ? [hi ? HH.weakest : 'Weakest'] : []),
        ],
      })
    }
  }

  const bb = chart.bhavaBala
  if (bb) {
    const strongTheme = getHouseTheme(bb.strongestHouse, lang)
    const weakTheme = getHouseTheme(bb.weakestHouse, lang)
    const ranked = Object.values(bb.houses).sort((a, b) => b.totalRupa - a.totalRupa)
    items.push({
      id: 'bhava-bala',
      title: hi ? HH.bhavaBalaTitle : 'House strength (Bhava Bala)',
      subtitle: hi ? fill(HH.bhavaBalaSubtitle, { strong: ordHiDirect(bb.strongestHouse), weak: ordHiDirect(bb.weakestHouse) }) : `Strongest ${ordinal(bb.strongestHouse)} · weakest ${ordinal(bb.weakestHouse)}`,
      tone: 'neutral',
      summary: hi
        ? fill(HH.bhavaBalaSummary, { strongNth: ordHi(bb.strongestHouse), strongThemes: strongTheme?.shortThemes ?? '', weakNth: ordHi(bb.weakestHouse), weakThemes: weakTheme?.shortThemes ?? '' })
        : `Life areas of the ${ordinal(bb.strongestHouse)} house (${strongTheme?.shortThemes ?? ''}) flow most easily; the ${ordinal(bb.weakestHouse)} house (${weakTheme?.shortThemes ?? ''}) needs the most conscious effort.`,
      points: ranked.map((h) => ({
        label: hi ? fill(HH.houseLabel, { nth: ordHiDirect(h.house) }) : `${ordinal(h.house)} house`,
        text: hi
          ? fill(HH.bhavaBalaPoint, { n: h.totalRupa.toFixed(2), english: getHouseTheme(h.house, 'hi')?.english ?? '' })
          : `${h.totalRupa.toFixed(2)} rupas — ${getHouseTheme(h.house)?.english ?? ''}`,
      })),
    })
  }

  return {
    id: 'strength',
    label: hi ? hiLabel('strength') : 'Strength',
    intro: hi
      ? sb?.generatedProfile
        ? fill(HH.strengthIntroProfile, { profile: HUB_PROFILE_HI[sb.generatedProfile] ?? sb.generatedProfile })
        : HUB_SECTION_HI.strength!.intro
      : sb?.generatedProfile
      ? `Overall strength profile: ${sb.generatedProfile}. Planets are ranked by Shadbala ratio.`
      : 'Planets ranked by Shadbala ratio, followed by house strength.',
    items,
  }
}

// ── Transit ─────────────────────────────────────────────────

const SATURN_FROM_MOON: Record<number, { label: string; text: string; tone: HubTone }> = {
  12: { label: 'Sade Sati — rising phase', tone: 'caution', text: 'Saturn in the 12th from Moon: expenses, sleep and letting go of old structures.' },
  1: { label: 'Sade Sati — peak phase', tone: 'caution', text: 'Saturn over the natal Moon: emotional pressure, responsibility and maturity tests.' },
  2: { label: 'Sade Sati — setting phase', tone: 'caution', text: 'Saturn in the 2nd from Moon: family, finances and speech get restructured.' },
  4: { label: 'Kantaka Shani', tone: 'caution', text: 'Saturn in the 4th from Moon: home, peace of mind and property need patience.' },
  8: { label: 'Ashtama Shani', tone: 'caution', text: 'Saturn in the 8th from Moon: transformation and sudden structural change; confirm with dasha.' },
}

export function buildTransitSection(chart: ChartOutput, positions: TransitPosition[] | null, lang: EngineLang = 'en'): HubSection {
  const hi = lang === 'hi'
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const items: HubItem[] = []
  if (!positions?.length || !moon) {
    return {
      id: 'transit',
      label: hi ? hiLabel('transit') : 'Transit',
      intro: hi
        ? positions === null ? HH.transitLoading : HH.transitUnavailable
        : positions === null ? 'Loading current planetary positions…' : 'Current transit positions are unavailable.',
      items,
    }
  }

  const fromMoon: Partial<Record<GocharPlanet, number>> = {}
  for (const p of positions) {
    if (isGocharPlanet(p.planetId)) fromMoon[p.planetId] = houseFrom(p.sign, moon.rashi)
  }

  const saturn = positions.find((p) => p.planetId === 'Sa')
  if (saturn) {
    const fromMoonHouse = houseFrom(saturn.sign, moon.rashi)
    const phase = SATURN_FROM_MOON[fromMoonHouse]
    if (phase) {
      const text = hi ? HUB_SATURN_FROM_MOON_HI[fromMoonHouse]! : phase
      items.push({ id: 'sade-sati', title: text.label, tone: phase.tone, summary: text.text, points: [], tags: [hi ? HH.saturn : 'Saturn'] })
    }
  }

  for (const id of CLASSICAL_ORDER) {
    const p = positions.find((x) => x.planetId === id)
    if (!p) continue
    const name = gn(id, lang)
    const moonHouse = fromMoon[id as GocharPlanet]
    const gochar = isGocharPlanet(id) ? evaluateGochar(id, fromMoon) : null
    const natal = chart.grahas.find((g) => g.id === id)
    const lagnaText = getPlanetInHouse(id, p.house, 'summary', lang) ?? (getPlanetInHouseClassicalSummary(id, p.house) ? txt(getPlanetInHouseClassicalSummary(id, p.house)!, lang) : null)
    const moonText = moonHouse ? getPlanetInHouse(id, moonHouse, 'summary', lang) : null
    const tone: HubTone =
      gochar?.status === 'favourable' ? 'supportive' : gochar?.status === 'unfavourable' ? 'caution' : 'mixed'
    const statusText = hi
      ? gochar?.status === 'favourable'
        ? fill(HH.gocharGood, { nth: ordHiDirect(gochar.houseFromMoon) })
        : gochar?.status === 'vedha'
          ? fill(HH.gocharVedha, { nth: ordHi(gochar.vedhaHouse!), graha: gn(gochar.vedhaBy!, lang) })
          : gochar
            ? fill(HH.gocharBad, { nth: ordHiDirect(gochar.houseFromMoon) })
            : ''
      : gochar?.status === 'favourable'
        ? `Favourable gochar from the Moon (${ordinal(gochar.houseFromMoon)} house).`
        : gochar?.status === 'vedha'
          ? `Favourable position blocked by Vedha from ${GRAHA_NAMES[gochar.vedhaBy!]} in the ${ordinal(gochar.vedhaHouse!)} from Moon.`
          : gochar
            ? `Not a favourable gochar house from the Moon (${ordinal(gochar.houseFromMoon)}).`
            : ''

    items.push({
      id: `transit-${id}`,
      title: hi
        ? fill(HH.transitTitle, { graha: name, rashi: RASHI_HI[p.sign] }) + (p.isRetro ? HH.retroMark : '')
        : `${name} transiting ${RASHI_NAMES[p.sign]}${p.isRetro ? ' (R)' : ''}`,
      subtitle: hi
        ? fill(HH.transitSubtitle, { lagnaNth: ordHiDirect(p.house), moonPart: moonHouse ? fill(HH.fromMoonPart, { nth: ordHiDirect(moonHouse) }) : '', nak: nakHi(p.nakshatra), pada: p.pada })
        : `${ordinal(p.house)} from Lagna · ${moonHouse ? `${ordinal(moonHouse)} from Moon · ` : ''}${p.nakshatra} pada ${p.pada}`,
      tone,
      summary: statusText + (lagnaText ? ` ${firstSentence(lagnaText)}` : ''),
      points: [
        ...(lagnaText ? [{ label: hi ? fill(HH.fromLagnaLabel, { nth: ordHiDirect(p.house) }) : `From Lagna — ${ordinal(p.house)} house`, text: lagnaText }] : []),
        ...(moonText && moonHouse !== p.house ? [{ label: hi ? fill(HH.fromMoonLabel, { nth: ordHiDirect(moonHouse!) }) : `From Moon — ${ordinal(moonHouse!)} house`, text: moonText }] : []),
        ...(natal && natal.rashi === p.sign ? [{ label: hi ? HH.returnLabel : 'Return', text: hi ? fill(HH.returnText, { graha: name }) : `${name} is back in its natal sign — its natal promise is re-activated.` }] : []),
        ...(p.isRetro ? [{ label: hi ? HH.retro : 'Retrograde', text: hi ? fill(HH.retroText, { nth: ordHi(p.house) }) : `Review and revisit the themes of the ${ordinal(p.house)} house rather than starting new ones.` }] : []),
      ],
    })
  }

  return {
    id: 'transit',
    label: hi ? hiLabel('transit') : 'Transit',
    intro: hi ? HUB_SECTION_HI.transit!.intro : 'Where the planets are today, read from your Lagna and natal Moon with classical gochar and Vedha rules.',
    items,
  }
}

// ── Dasha ───────────────────────────────────────────────────

export function buildDashaSection(chart: ChartOutput, now: number = Date.now(), lang: EngineLang = 'en'): HubSection {
  const hi = lang === 'hi'
  const nodes = chart.dashas?.vimshottari ?? []
  const items: HubItem[] = []
  const analysis = nodes.length
    ? analyzeVimshottariPeriod({
        nodes,
        ascRashi: chart.lagnas.ascRashi,
        grahas: chart.grahas,
        shadbala: chart.shadbala,
        ashtakavarga: chart.ashtakavarga,
        navamshaGrahas: chart.vargas?.D9 ?? null,
        ...(hi ? { lang } : {}),
      })
    : null

  if (analysis) {
    const { insight } = analysis
    items.push({
      id: 'dasha-now',
      title: hi ? insight.toneText ?? insight.toneLabel : insight.toneLabel,
      subtitle: [analysis.mahadasha, analysis.antardasha, analysis.pratyantardasha]
        .filter(Boolean)
        .map((s) => gn(s!.lord, lang))
        .join(' › '),
      tone: insight.toneLabel === 'Favorable stretch' ? 'supportive' : insight.toneLabel === 'Challenging stretch' ? 'caution' : 'mixed',
      summary: insight.headline,
      points: [
        ...insight.bullets.map((t) => ({ label: hi ? HH.whatHappens : 'What happens', text: t })),
        ...(insight.watch ? [{ label: hi ? HH.watch : 'Watch', text: insight.watch }] : []),
        {
          label: hi ? HH.balance : 'Balance',
          text: hi
            ? fill(HH.balanceText, { fav: analysis.favorableShare, neu: analysis.neutralShare, cha: analysis.challengingShare })
            : `${analysis.favorableShare}% favourable · ${analysis.neutralShare}% neutral · ${analysis.challengingShare}% challenging`,
        },
        ...[analysis.yogakarakaNote, analysis.lagnaSpecialNote, analysis.marakaNote, analysis.d9Note, analysis.charaKarakaNote]
          .filter((t): t is string => !!t)
          .map((t) => ({ label: hi ? HH.note : 'Note', text: t })),
      ],
    })

    for (const snap of [analysis.mahadasha, analysis.antardasha]) {
      if (!snap) continue
      const isMd = snap === analysis.mahadasha
      const name = gn(snap.lord, lang)
      items.push({
        id: `dasha-lord-${isMd ? 'md' : 'ad'}`,
        title: hi ? fill(isMd ? HH.mdLord : HH.adLord, { graha: name }) : `${isMd ? 'Mahadasha' : 'Antardasha'} lord — ${name}`,
        subtitle: [
          snap.house ? (hi ? fill(HH.houseLabel, { nth: ordHiDirect(snap.house) }) : `${ordinal(snap.house)} house`) : null,
          snap.housesRuled.length ? (hi ? fill(HH.rules, { list: snap.housesRuled.map(ordHi).join(', ') }) : `rules ${snap.housesRuled.map(ordinal).join(', ')}`) : null,
          snap.dignity ? dig(snap.dignity, lang) : null,
        ].filter(Boolean).join(' · '),
        tone: dignityTone(snap.dignity),
        summary: snap.house ? getPlanetInHouse(snap.lord, snap.house, 'summary', lang) ?? '' : '',
        points: [
          ...snap.housesRuled.map((h) => ({
            label: hi ? fill(HH.activates, { nth: ordHiDirect(h) }) : `Activates ${ordinal(h)} house`,
            text: getHouseTheme(h, lang)?.shortThemes ?? '',
          })),
          ...(snap.isVargottama ? [{ label: hi ? HH.vargottama : 'Vargottama', text: hi ? fill(HH.vargottamaText, { graha: name }) : `${name} holds the same sign in D1 and D9 — results are dependable.` }] : []),
          ...(snap.d9Dignity ? [{ label: hi ? HH.navamsha : 'Navamsha', text: hi ? fill(HH.navamshaText, { dignity: dig(snap.d9Dignity, lang) }) : `${DIGNITY_LABEL[snap.d9Dignity as Dignity] ?? snap.d9Dignity} in D9.` }] : []),
          ...(snap.shadbalaRatio != null ? [{ label: hi ? HH.shadbala : 'Shadbala', text: hi ? fill(HH.ratio, { ratio: snap.shadbalaRatio.toFixed(2) }) : `Ratio ${snap.shadbalaRatio.toFixed(2)}` }] : []),
        ],
      })
    }

    items.push({
      id: 'dasha-life-areas',
      title: hi ? HH.lifeAreas : 'Life areas activated now',
      tone: 'neutral',
      summary: analysis.lifeAreas.headline,
      points: analysis.lifeAreas.areas.map((a) => ({ label: `${a.label} · ${hi ? HUB_AREA_STRENGTH_HI[a.strength] ?? a.strength : a.strength}`, text: a.note })),
    })

    for (const f of analysis.flags) {
      items.push({
        id: `dasha-flag-${f.id}`,
        title: f.label,
        tone: f.tone,
        summary: f.detail,
        points: [],
      })
    }
  }

  const fmt = (d: Date | string) => new Date(d).toISOString().slice(0, 10)
  const upcoming = nodes
    .flatMap((md) => md.children.map((ad) => ({ md, ad })))
    .filter(({ ad }) => new Date(ad.start).getTime() > now)
    .slice(0, 4)
  if (upcoming.length) {
    items.push({
      id: 'dasha-upcoming',
      title: hi ? HH.upcoming : 'Coming periods',
      tone: 'neutral',
      summary: hi ? HH.upcomingSummary : 'The next Antardashas and the houses their lords sit in.',
      points: upcoming.map(({ md, ad }) => {
        const g = chart.grahas.find((x) => x.id === ad.lord)
        const house = g ? houseOf(chart, g.rashi) : null
        const text = house ? getPlanetInHouse(ad.lord, house, 'summary', lang) : null
        return {
          label: `${gn(md.lord as GrahaId, lang)} › ${gn(ad.lord as GrahaId, lang)} (${fmt(ad.start)} → ${fmt(ad.end)})`,
          text: text ? firstSentence(text) : hi ? fill(HH.subPeriod, { graha: gn(ad.lord as GrahaId, lang) }) : `${GRAHA_NAMES[ad.lord as GrahaId] ?? ad.lord} sub-period.`,
        }
      }),
    })
  }

  return {
    id: 'dasha',
    label: hi ? hiLabel('dasha') : 'Dasha',
    intro: analysis ? analysis.lifeAreas.headline : hi ? HUB_SECTION_HI.dasha!.intro : 'Vimshottari dasha data is unavailable for this chart.',
    items,
  }
}

// ── All sections ────────────────────────────────────────────

function withUniqueItemIds(section: HubSection): HubSection {
  const seen = new Map<string, number>()
  return {
    ...section,
    items: section.items.map((item) => {
      const n = seen.get(item.id) ?? 0
      seen.set(item.id, n + 1)
      return n === 0 ? item : { ...item, id: `${item.id}#${n}` }
    }),
  }
}

export function buildInterpretationHub(
  chart: ChartOutput,
  transitPositions: TransitPosition[] | null,
  now: number = Date.now(),
  lang: EngineLang = 'en',
): HubSection[] {
  return [
    buildOverviewSection(chart, lang),
    buildPlanetsSection(chart, lang),
    buildHousesSection(chart, lang),
    buildRashisSection(chart, lang),
    buildStrengthSection(chart, lang),
    buildTransitSection(chart, transitPositions, lang),
    buildDashaSection(chart, now, lang),
  ].map(withUniqueItemIds)
}
