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
  getPlanetInHouseClassicalSummary,
  type ClassicalNote,
} from '@/lib/engine/classicalInterpretations'
import { getRashiProfile, getRashiInHouse, getPlanetInSign } from '@/lib/engine/rashiInterpretations'
import { mixPlanetFromGraha } from '@/lib/engine/planetInterpretationMix'
import { getChartHouseClassical, getChartMultiVakriNotes } from '@/lib/engine/classicalChartAnalysis'
import { evaluateGochar, houseFrom, isGocharPlanet, type GocharPlanet } from '@/lib/engine/gocharRules'
import { analyzeVimshottariPeriod } from '@/lib/engine/dasha/vimshottariAnalysis'

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

function notePoints(notes: ClassicalNote[] | undefined, label?: string): HubPoint[] {
  return (notes ?? []).map((n) => ({
    label,
    text: n.text,
    source: n.ref ? `${CLASSICAL_SOURCE_LABEL[n.source]} · ${n.ref}` : CLASSICAL_SOURCE_LABEL[n.source],
  }))
}

function firstSentence(text: string | null | undefined): string {
  if (!text) return ''
  const m = text.match(/^.*?[.!?](\s|$)/)
  return (m ? m[0] : text).trim()
}

function houseOf(chart: ChartOutput, rashi: Rashi): HouseNumber {
  return wholeSignHouseFromLagna(chart.lagnas.ascRashi, rashi)
}

// ── Overview ────────────────────────────────────────────────

export function buildOverviewSection(chart: ChartOutput): HubSection {
  const interp = chart.interpretation
  const insights = interp
    ? [...interp.strengths, ...interp.cautions, ...interp.special].sort((a, b) => b.priority - a.priority)
    : []
  const items: HubItem[] = insights.map((i) => ({
    id: `insight-${i.id}`,
    title: i.title,
    subtitle: i.house ? `${i.category} · ${ordinal(i.house)} house` : i.category,
    tone: i.tone,
    summary: i.message,
    points: (i.actions ?? []).map((a) => ({ label: 'Action', text: a })),
    tags: i.relatedGrahas.map((g) => GRAHA_NAMES[g] ?? g),
  }))

  // Charts often hold several yogas with the same display name (e.g. multiple Raja Yogas).
  // Include index + planets so React keys and hub item ids stay unique.
  for (const [yi, y] of (chart.yogas ?? []).entries()) {
    items.push({
      id: `yoga-${yi}-${y.name}-${y.planets.join('-')}`,
      title: y.name,
      subtitle: `${y.sanskrit} · ${y.category} yoga · ${y.strength}`,
      tone: y.category === 'malefic' ? 'caution' : y.strength === 'weak' ? 'mixed' : 'supportive',
      summary: y.effect || y.description,
      points: [
        ...(y.description && y.description !== y.effect ? [{ label: 'Formation', text: y.description }] : []),
        ...(y.houses.length ? [{ label: 'Houses', text: y.houses.map(ordinal).join(', ') }] : []),
      ],
      tags: y.planets.map((p) => GRAHA_NAMES[p as GrahaId] ?? p),
    })
  }

  const vakri = getChartMultiVakriNotes(chart)
  if (vakri.length) {
    items.push({
      id: 'multi-vakri',
      title: 'Several retrograde planets',
      tone: 'mixed',
      summary: vakri[0].text,
      points: notePoints(vakri.slice(1)),
    })
  }

  return {
    id: 'overview',
    label: 'Overview',
    intro: interp?.headline ?? 'Key themes, yogas and chart-wide patterns.',
    items,
  }
}

// ── Planets ─────────────────────────────────────────────────

export function buildPlanetsSection(chart: ChartOutput): HubSection {
  const ascRashi = chart.lagnas.ascRashi
  const items: HubItem[] = []
  for (const id of CLASSICAL_ORDER) {
    const g = chart.grahas.find((p) => p.id === id)
    if (!g) continue
    const house = houseOf(chart, g.rashi)
    const mix = mixPlanetFromGraha(g, house, ascRashi)
    const flags = [
      g.isRetro ? 'Retrograde' : null,
      g.isCombust ? 'Combust' : null,
      g.charaKaraka ? g.charaKaraka : null,
      g.gandanta?.isGandanta ? 'Gandanta' : null,
    ].filter(Boolean) as string[]
    items.push({
      id: `planet-${id}`,
      title: `${g.name} in ${g.rashiName}`,
      subtitle: `${ordinal(house)} house · ${g.nakshatraName} pada ${g.pada} · ${DIGNITY_LABEL[g.dignity] ?? g.dignity}`,
      tone: dignityTone(g.dignity),
      summary:
        getPlanetInHouse(id, house, 'summary')
        ?? getPlanetInSign(id, g.rashi, 'summary')
        ?? mix?.blendedSummary
        ?? `${g.name} occupies the ${ordinal(house)} house.`,
      points: (mix?.layers ?? []).flatMap((l) => [
        ...l.texts.map((t) => ({ label: l.label, text: t, source: l.provenance })),
        ...notePoints(l.classicalNotes, l.label),
      ]),
      tags: flags,
    })
  }
  return {
    id: 'planets',
    label: 'Planets',
    intro: 'Each graha read through its house, sign, dignity, nakshatra, lordship and retrograde/combust state.',
    items,
  }
}

// ── Houses ──────────────────────────────────────────────────

export function buildHousesSection(chart: ChartOutput): HubSection {
  const ascRashi = chart.lagnas.ascRashi
  const items: HubItem[] = []
  for (let h = 1 as HouseNumber; h <= 12; h = (h + 1) as HouseNumber) {
    const theme = getHouseTheme(h)
    const rashi = (((ascRashi - 1 + h - 1) % 12) + 1) as Rashi
    const pkg = getChartHouseClassical(chart, h)
    const bb = chart.bhavaBala?.houses?.[h]
    const occupants = chart.grahas.filter((g) => isClassicalGraha(g.id) && houseOf(chart, g.rashi) === h)
    const lordName = pkg.lordship ? GRAHA_NAMES[pkg.lordship.lordId] : null

    let tone: HubTone = 'neutral'
    if (chart.bhavaBala) {
      if (chart.bhavaBala.strongestHouse === h) tone = 'supportive'
      else if (chart.bhavaBala.weakestHouse === h) tone = 'caution'
    }

    const points: HubPoint[] = [
      ...(theme?.intro ? [{ label: 'Meaning', text: theme.intro }] : []),
      ...[getSignInHouse(h, rashi), getRashiInHouse(rashi, h)]
        .filter((t): t is string => !!t)
        .map((text) => ({ label: `${RASHI_NAMES[rashi]} on this house`, text })),
      ...(pkg.lordship && lordName
        ? [{
            label: 'House lord',
            text: `${lordName} rules this house and sits in the ${ordinal(pkg.lordship.placedIn)} house.`,
          }, ...notePoints(pkg.lordship.notes, 'House lord')]
        : []),
      ...occupants.map((g) => ({
        label: `${g.name} here`,
        text: getPlanetInHouse(g.id, h, 'summary') ?? getPlanetInHouseClassicalSummary(g.id, h) ?? '',
      })).filter((p) => p.text),
      ...pkg.aspectHits.map((a) => ({
        label: `${GRAHA_NAMES[a.fromGraha]} aspect from ${ordinal(a.fromHouse)}`,
        text: a.note.text,
        source: CLASSICAL_SOURCE_LABEL[a.note.source],
      })),
      ...notePoints(pkg.houseNotes, 'Classical'),
      ...(bb ? [{ label: 'Bhava Bala', text: `${bb.totalRupa.toFixed(2)} rupas` }] : []),
    ]

    items.push({
      id: `house-${h}`,
      title: `${ordinal(h)} house — ${theme?.english ?? ''}`.trim(),
      subtitle: `${theme?.sanskrit ?? ''} · ${RASHI_NAMES[rashi]}${lordName ? ` · lord ${lordName}` : ''}`,
      tone,
      summary: theme?.shortThemes ?? '',
      points,
      tags: occupants.map((g) => g.name),
    })
  }
  return {
    id: 'houses',
    label: 'Houses',
    intro: 'All 12 bhavas with their sign, lord placement, occupants, aspects and Bhava Bala.',
    items,
  }
}

// ── Rashis ──────────────────────────────────────────────────

export function buildRashisSection(chart: ChartOutput): HubSection {
  const ascRashi = chart.lagnas.ascRashi
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const sun = chart.grahas.find((g) => g.id === 'Su')
  const keyRoles = new Map<Rashi, string[]>()
  const addRole = (r: Rashi | undefined, role: string) => {
    if (!r) return
    keyRoles.set(r, [...(keyRoles.get(r) ?? []), role])
  }
  addRole(ascRashi, 'Lagna')
  addRole(moon?.rashi, 'Moon sign')
  addRole(sun?.rashi, 'Sun sign')

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
      title: `${p.english} (${p.sanskrit})`,
      subtitle: `${ordinal(house)} house · lord ${GRAHA_NAMES[p.lord]}`,
      tone: 'neutral',
      summary: p.coreSummary,
      points: [
        ...p.coreNature.map((t) => ({ label: 'Nature', text: t })),
        { label: 'Lord', text: p.lordSummary },
        ...(p.inHouse[house] ? [{ label: `In your ${ordinal(house)} house`, text: p.inHouse[house] }] : []),
        ...occupants.map((g) => ({
          label: `${g.name} in ${p.english}`,
          text: getPlanetInSign(g.id, r, 'full') ?? '',
        })).filter((x) => x.text),
        ...p.specialRules.map((t) => ({ label: 'Special rule', text: t })),
        ...p.remedies.map((t) => ({ label: 'Remedy', text: t })),
      ],
      tags: [...(keyRoles.get(r) ?? []), ...occupants.map((g) => g.name)],
    })
  }
  return {
    id: 'rashis',
    label: 'Rashis',
    intro: 'Lagna, Moon and Sun signs first, then every sign that holds a planet.',
    items,
  }
}

// ── Strength ────────────────────────────────────────────────

export function buildStrengthSection(chart: ChartOutput): HubSection {
  const items: HubItem[] = []
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
        title: `${GRAHA_NAMES[id]} — ${band}`,
        subtitle: `Shadbala ${p.total.toFixed(2)} / ${p.required.toFixed(2)} rupas · ratio ${p.ratio.toFixed(2)}`,
        tone: band === 'excellent' || band === 'strong' ? 'supportive' : band === 'weak' ? 'caution' : 'mixed',
        summary:
          p.interpretation
          ?? (p.isStrong
            ? `${GRAHA_NAMES[id]} has enough strength to deliver its significations reliably.`
            : `${GRAHA_NAMES[id]} falls short of its required strength; its results need support.`),
        points: comps
          ? [
              { label: 'Sthana (position)', text: `${comps.sthana.toFixed(1)} shashtiamsas` },
              { label: 'Dig (direction)', text: `${comps.dig.toFixed(1)} shashtiamsas` },
              { label: 'Kala (time)', text: `${comps.kala.toFixed(1)} shashtiamsas` },
              { label: 'Chesta (motion)', text: `${comps.chesta.toFixed(1)} shashtiamsas` },
              { label: 'Naisargika (natural)', text: `${comps.naisargika.toFixed(1)} shashtiamsas` },
              { label: 'Drik (aspect)', text: `${comps.drik.toFixed(1)} shashtiamsas` },
            ]
          : [],
        tags: [
          ...(sb.strongest === id ? ['Strongest'] : []),
          ...(sb.weakest === id ? ['Weakest'] : []),
        ],
      })
    }
  }

  const bb = chart.bhavaBala
  if (bb) {
    const strongTheme = getHouseTheme(bb.strongestHouse)
    const weakTheme = getHouseTheme(bb.weakestHouse)
    const ranked = Object.values(bb.houses).sort((a, b) => b.totalRupa - a.totalRupa)
    items.push({
      id: 'bhava-bala',
      title: 'House strength (Bhava Bala)',
      subtitle: `Strongest ${ordinal(bb.strongestHouse)} · weakest ${ordinal(bb.weakestHouse)}`,
      tone: 'neutral',
      summary: `Life areas of the ${ordinal(bb.strongestHouse)} house (${strongTheme?.shortThemes ?? ''}) flow most easily; the ${ordinal(bb.weakestHouse)} house (${weakTheme?.shortThemes ?? ''}) needs the most conscious effort.`,
      points: ranked.map((h) => ({
        label: `${ordinal(h.house)} house`,
        text: `${h.totalRupa.toFixed(2)} rupas — ${getHouseTheme(h.house)?.english ?? ''}`,
      })),
    })
  }

  return {
    id: 'strength',
    label: 'Strength',
    intro: sb?.generatedProfile
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

export function buildTransitSection(chart: ChartOutput, positions: TransitPosition[] | null): HubSection {
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const items: HubItem[] = []
  if (!positions?.length || !moon) {
    return {
      id: 'transit',
      label: 'Transit',
      intro: positions === null ? 'Loading current planetary positions…' : 'Current transit positions are unavailable.',
      items,
    }
  }

  const fromMoon: Partial<Record<GocharPlanet, number>> = {}
  for (const p of positions) {
    if (isGocharPlanet(p.planetId)) fromMoon[p.planetId] = houseFrom(p.sign, moon.rashi)
  }

  const saturn = positions.find((p) => p.planetId === 'Sa')
  if (saturn) {
    const phase = SATURN_FROM_MOON[houseFrom(saturn.sign, moon.rashi)]
    if (phase) {
      items.push({ id: 'sade-sati', title: phase.label, tone: phase.tone, summary: phase.text, points: [], tags: ['Saturn'] })
    }
  }

  for (const id of CLASSICAL_ORDER) {
    const p = positions.find((x) => x.planetId === id)
    if (!p) continue
    const name = GRAHA_NAMES[id]
    const moonHouse = fromMoon[id as GocharPlanet]
    const gochar = isGocharPlanet(id) ? evaluateGochar(id, fromMoon) : null
    const natal = chart.grahas.find((g) => g.id === id)
    const lagnaText = getPlanetInHouse(id, p.house, 'summary') ?? getPlanetInHouseClassicalSummary(id, p.house)
    const moonText = moonHouse ? getPlanetInHouse(id, moonHouse, 'summary') : null
    const tone: HubTone =
      gochar?.status === 'favourable' ? 'supportive' : gochar?.status === 'unfavourable' ? 'caution' : 'mixed'
    const statusText =
      gochar?.status === 'favourable'
        ? `Favourable gochar from the Moon (${ordinal(gochar.houseFromMoon)} house).`
        : gochar?.status === 'vedha'
          ? `Favourable position blocked by Vedha from ${GRAHA_NAMES[gochar.vedhaBy!]} in the ${ordinal(gochar.vedhaHouse!)} from Moon.`
          : gochar
            ? `Not a favourable gochar house from the Moon (${ordinal(gochar.houseFromMoon)}).`
            : ''

    items.push({
      id: `transit-${id}`,
      title: `${name} transiting ${RASHI_NAMES[p.sign]}${p.isRetro ? ' (R)' : ''}`,
      subtitle: `${ordinal(p.house)} from Lagna · ${moonHouse ? `${ordinal(moonHouse)} from Moon · ` : ''}${p.nakshatra} pada ${p.pada}`,
      tone,
      summary: statusText + (lagnaText ? ` ${firstSentence(lagnaText)}` : ''),
      points: [
        ...(lagnaText ? [{ label: `From Lagna — ${ordinal(p.house)} house`, text: lagnaText }] : []),
        ...(moonText && moonHouse !== p.house ? [{ label: `From Moon — ${ordinal(moonHouse!)} house`, text: moonText }] : []),
        ...(natal && natal.rashi === p.sign ? [{ label: 'Return', text: `${name} is back in its natal sign — its natal promise is re-activated.` }] : []),
        ...(p.isRetro ? [{ label: 'Retrograde', text: `Review and revisit the themes of the ${ordinal(p.house)} house rather than starting new ones.` }] : []),
      ],
    })
  }

  return {
    id: 'transit',
    label: 'Transit',
    intro: 'Where the planets are today, read from your Lagna and natal Moon with classical gochar and Vedha rules.',
    items,
  }
}

// ── Dasha ───────────────────────────────────────────────────

export function buildDashaSection(chart: ChartOutput, now: number = Date.now()): HubSection {
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
      })
    : null

  if (analysis) {
    const { insight } = analysis
    items.push({
      id: 'dasha-now',
      title: insight.toneLabel,
      subtitle: [analysis.mahadasha, analysis.antardasha, analysis.pratyantardasha]
        .filter(Boolean)
        .map((s) => GRAHA_NAMES[s!.lord])
        .join(' › '),
      tone: insight.toneLabel === 'Favorable stretch' ? 'supportive' : insight.toneLabel === 'Challenging stretch' ? 'caution' : 'mixed',
      summary: insight.headline,
      points: [
        ...insight.bullets.map((t) => ({ label: 'What happens', text: t })),
        ...(insight.watch ? [{ label: 'Watch', text: insight.watch }] : []),
        { label: 'Balance', text: `${analysis.favorableShare}% favourable · ${analysis.neutralShare}% neutral · ${analysis.challengingShare}% challenging` },
        ...[analysis.yogakarakaNote, analysis.lagnaSpecialNote, analysis.marakaNote, analysis.d9Note, analysis.charaKarakaNote]
          .filter((t): t is string => !!t)
          .map((t) => ({ label: 'Note', text: t })),
      ],
    })

    for (const snap of [analysis.mahadasha, analysis.antardasha]) {
      if (!snap) continue
      const isMd = snap === analysis.mahadasha
      const name = GRAHA_NAMES[snap.lord]
      items.push({
        id: `dasha-lord-${isMd ? 'md' : 'ad'}`,
        title: `${isMd ? 'Mahadasha' : 'Antardasha'} lord — ${name}`,
        subtitle: [
          snap.house ? `${ordinal(snap.house)} house` : null,
          snap.housesRuled.length ? `rules ${snap.housesRuled.map(ordinal).join(', ')}` : null,
          snap.dignity ? DIGNITY_LABEL[snap.dignity as Dignity] ?? snap.dignity : null,
        ].filter(Boolean).join(' · '),
        tone: dignityTone(snap.dignity),
        summary: snap.house ? getPlanetInHouse(snap.lord, snap.house, 'summary') ?? '' : '',
        points: [
          ...snap.housesRuled.map((h) => ({
            label: `Activates ${ordinal(h)} house`,
            text: getHouseTheme(h)?.shortThemes ?? '',
          })),
          ...(snap.isVargottama ? [{ label: 'Vargottama', text: `${name} holds the same sign in D1 and D9 — results are dependable.` }] : []),
          ...(snap.d9Dignity ? [{ label: 'Navamsha', text: `${DIGNITY_LABEL[snap.d9Dignity as Dignity] ?? snap.d9Dignity} in D9.` }] : []),
          ...(snap.shadbalaRatio != null ? [{ label: 'Shadbala', text: `Ratio ${snap.shadbalaRatio.toFixed(2)}` }] : []),
        ],
      })
    }

    items.push({
      id: 'dasha-life-areas',
      title: 'Life areas activated now',
      tone: 'neutral',
      summary: analysis.lifeAreas.headline,
      points: analysis.lifeAreas.areas.map((a) => ({ label: `${a.label} · ${a.strength}`, text: a.note })),
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
      title: 'Coming periods',
      tone: 'neutral',
      summary: 'The next Antardashas and the houses their lords sit in.',
      points: upcoming.map(({ md, ad }) => {
        const g = chart.grahas.find((x) => x.id === ad.lord)
        const house = g ? houseOf(chart, g.rashi) : null
        const text = house ? getPlanetInHouse(ad.lord, house, 'summary') : null
        return {
          label: `${GRAHA_NAMES[md.lord as GrahaId] ?? md.lord} › ${GRAHA_NAMES[ad.lord as GrahaId] ?? ad.lord} (${fmt(ad.start)} → ${fmt(ad.end)})`,
          text: text ? firstSentence(text) : `${GRAHA_NAMES[ad.lord as GrahaId] ?? ad.lord} sub-period.`,
        }
      }),
    })
  }

  return {
    id: 'dasha',
    label: 'Dasha',
    intro: analysis ? analysis.lifeAreas.headline : 'Vimshottari dasha data is unavailable for this chart.',
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
): HubSection[] {
  return [
    buildOverviewSection(chart),
    buildPlanetsSection(chart),
    buildHousesSection(chart),
    buildRashisSection(chart),
    buildStrengthSection(chart),
    buildTransitSection(chart, transitPositions),
    buildDashaSection(chart, now),
  ].map(withUniqueItemIds)
}
