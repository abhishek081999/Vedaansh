// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dashamsaAdvanced.ts
//  Advanced D10 levers — dispositor chain, graha drishti,
//  Shadbala, SAV, chara karakas, flags, raja links, timeline.
//  Pure: no React / ephemeris / network.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { buildUpcomingVimshottariTimeline } from '@/lib/engine/dasha/vimshottariTimeline'
import type { CareerTone, DashamsaAnalysis, DashamsaPlanetRow } from '@/lib/engine/dashamsaAnalysis'
import {
  aspectHouses,
  aspectsSign,
  type DashamsaClassical,
} from '@/lib/engine/dashamsaClassical'

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const KARAKA_CAREER: Record<string, string> = {
  AK: 'Atmakaraka — soul’s drive through the work',
  AmK: 'Amatyakaraka — the minister; profession and status',
  BK: 'Bhratrikaraka — siblings, courage, co-workers, effort',
  MK: 'Matrukaraka — emotional climate of the workplace',
  PK: 'Putrakaraka — students, creativity, authority projects',
  GK: 'Gnatikaraka — rivals, litigation, service friction',
  DK: 'Darakaraka — partners, clients, public contracts',
  PiK: 'Putrikaraka — creative lineage and protégés',
}

export interface DispositorLink {
  id: GrahaId
  name: string
  rashiName: string
  house: number
  dignity: Dignity
}

export interface DispositorChain {
  startId: GrahaId
  startName: string
  role: string
  links: DispositorLink[]
  cyclic: boolean
  prediction: string
}

export interface DrishtiHit {
  id: GrahaId
  name: string
  fromHouse: number
  aspectLabel: string
  tone: CareerTone
  note: string
}

export interface StrengthRow {
  id: GrahaId
  name: string
  role: string
  ratio: number | null
  total: number | null
  isStrong: boolean | null
  quality: string | null
  digBala: number | null
  note: string
}

export interface SavHouse {
  house: number
  rashiName: string
  bindus: number | null
  tone: CareerTone
  note: string
}

export interface KarakaInD10 {
  code: string
  label: string
  id: GrahaId
  name: string
  house: number
  rashiName: string
  dignity: Dignity
  careerNote: string
}

export interface PlanetFlag {
  id: GrahaId
  name: string
  role: string
  flags: string[]
  note: string
}

export interface RajaLink {
  id: string
  title: string
  formed: boolean
  tone: CareerTone
  prediction: string
}

export interface CareerTimelineItem {
  label: string
  lord: GrahaId
  lordName: string
  start: string
  end: string
  careerHit: boolean
  tone: CareerTone
  note: string
}

export interface DashamsaAdvanced {
  framing: string
  headline: string
  dispositor: DispositorChain[]
  drishti: {
    onTenth: DrishtiHit[]
    onLagna: DrishtiHit[]
    prediction: string
  }
  shadbala: {
    available: boolean
    rows: StrengthRow[]
    prediction: string
  }
  bhavaBala: {
    available: boolean
    tenth: { totalRupa: number; isStrong: boolean; note: string } | null
    eleventh: { totalRupa: number; isStrong: boolean; note: string } | null
    prediction: string
  }
  ashtakavarga: {
    available: boolean
    houses: SavHouse[]
    prediction: string
  }
  karakas: KarakaInD10[]
  flags: PlanetFlag[]
  raja: RajaLink[]
  timeline: {
    headline: string
    items: CareerTimelineItem[]
  }
  takeaways: string[]
}

function houseSign(asc: Rashi, house: number): Rashi {
  return (((asc - 1 + house - 1) % 12) + 1) as Rashi
}

function aspectLabel(id: GrahaId, fromRashi: Rashi, target: Rashi): string {
  const house = ((target - fromRashi + 12) % 12) + 1
  if (id === 'Ma' && (house === 4 || house === 8)) return `${house}th (Mars special)`
  if (id === 'Ju' && (house === 5 || house === 9)) return `${house}th (Jupiter special)`
  if (id === 'Sa' && (house === 3 || house === 10)) return `${house}th (Saturn special)`
  if (house === 7) return '7th (full)'
  return `${house}th`
}

function buildChain(
  start: DashamsaPlanetRow,
  role: string,
  byId: Map<GrahaId, DashamsaPlanetRow>,
): DispositorChain {
  const links: DispositorLink[] = []
  const seen = new Set<GrahaId>()
  let current: DashamsaPlanetRow | undefined = start
  let cyclic = false
  for (let i = 0; i < 8 && current; i++) {
    if (seen.has(current.id)) {
      cyclic = true
      break
    }
    seen.add(current.id)
    links.push({
      id: current.id,
      name: current.name,
      rashiName: current.d10RashiName,
      house: current.d10House,
      dignity: current.d10Dignity,
    })
    const nextId = SIGN_LORDS[current.d10Rashi]
    if (nextId === current.id) break
    current = byId.get(nextId)
  }
  const tail = links[links.length - 1]
  const prediction = cyclic
    ? `${start.name}’s D10 dispositor chain loops (${links.map((l) => l.name).join(' → ')}). A closed loop locks the career style — results recycle through those planets’ dashas.`
    : `${start.name} (${role}) runs ${links.map((l) => `${l.name} H${l.house}`).join(' → ')}.${
      tail ? ` Final support rests with ${tail.name} in ${tail.rashiName}.` : ''
    }`
  return {
    startId: start.id,
    startName: start.name,
    role,
    links,
    cyclic,
    prediction,
  }
}

function buildDrishti(
  analysis: DashamsaAnalysis,
  targetSign: Rashi,
  targetLabel: string,
): DrishtiHit[] {
  const hits: DrishtiHit[] = []
  for (const p of analysis.planets) {
    if (!CLASSICAL.includes(p.id)) continue
    if (p.d10Rashi === targetSign) continue
    if (!aspectsSign(p.d10Rashi, p.id, targetSign)) continue
    const span = ((targetSign - p.d10Rashi + 12) % 12) + 1
    const special = aspectHouses(p.id).includes(span) && span !== 7
    const tone: CareerTone =
      (p.id === 'Ju' || p.id === 'Ve' || (p.id === 'Mo' && !['debilitated', 'enemy'].includes(p.d10Dignity)))
        ? 'supportive'
        : (p.id === 'Sa' || p.id === 'Ma' || p.id === 'Ra')
          ? 'mixed'
          : 'neutral'
    hits.push({
      id: p.id,
      name: p.name,
      fromHouse: p.d10House,
      aspectLabel: aspectLabel(p.id, p.d10Rashi, targetSign),
      tone,
      note: `${p.name} from D10 H${p.d10House} casts ${aspectLabel(p.id, p.d10Rashi, targetSign)} on the ${targetLabel}${special ? ' — special aspect counts full in Parashara.' : '.'}`,
    })
  }
  return hits.sort((a, b) => a.fromHouse - b.fromHouse)
}

function buildRaja(analysis: DashamsaAnalysis, byId: Map<GrahaId, DashamsaPlanetRow>): RajaLink[] {
  const d10 = analysis.d10Lagna
  const lord = (h: number) => SIGN_LORDS[houseSign(d10, h)]
  const L1 = lord(1)
  const L5 = lord(5)
  const L9 = lord(9)
  const L10 = lord(10)
  const L4 = lord(4)
  const L7 = lord(7)

  const connected = (a: GrahaId, b: GrahaId): boolean => {
    if (a === b) return true
    const ra = byId.get(a)
    const rb = byId.get(b)
    if (!ra || !rb) return false
    if (ra.d10Rashi === rb.d10Rashi) return true
    if (SIGN_LORDS[ra.d10Rashi] === b && SIGN_LORDS[rb.d10Rashi] === a) return true
    return aspectsSign(ra.d10Rashi, a, rb.d10Rashi) || aspectsSign(rb.d10Rashi, b, ra.d10Rashi)
  }

  const pairs: { id: string; title: string; a: GrahaId; b: GrahaId; why: string }[] = [
    { id: '1-10', title: 'Lagna–10th link', a: L1, b: L10, why: 'Self and profession reinforce each other' },
    { id: '9-10', title: '9th–10th dharma-karma', a: L9, b: L10, why: 'Fortune and work move together' },
    { id: '5-10', title: '5th–10th counsel yoga', a: L5, b: L10, why: 'Intelligence and status (ministerial flavour)' },
    { id: '4-10', title: '4th–10th axis', a: L4, b: L10, why: 'Base and peak — property, vehicles, or homeland duty with status' },
    { id: '7-10', title: '7th–10th public axis', a: L7, b: L10, why: 'Partners and profession share one story' },
  ]

  return pairs.map((p) => {
    const formed = connected(p.a, p.b)
    return {
      id: p.id,
      title: p.title,
      formed,
      tone: formed ? 'supportive' : 'neutral',
      prediction: formed
        ? `${GRAHA_NAMES[p.a]} and ${GRAHA_NAMES[p.b]} are linked in Dashamsha — ${p.why}.`
        : `${GRAHA_NAMES[p.a]} and ${GRAHA_NAMES[p.b]} are not joined by conjunction, exchange, or aspect in D10.`,
    }
  })
}

/**
 * Advanced Dashamsha technical layer.
 */
export function buildDashamsaAdvanced(
  analysis: DashamsaAnalysis,
  classical: DashamsaClassical,
  chart: ChartOutput,
): DashamsaAdvanced | null {
  if (!analysis.planets.length) return null
  const byId = new Map(analysis.planets.map((p) => [p.id, p]))
  const d1ById = new Map(chart.grahas?.map((g) => [g.id, g]) ?? [])
  const d10 = analysis.d10Lagna
  const tenthSign = houseSign(d10, 10)
  const tenthLordId = classical.tenthLord.id
  const lagnaLordId = SIGN_LORDS[d10]
  const livelihoodId = classical.livelihood.winner.id
  const amkId = classical.amatyakaraka?.id ?? (chart.karakas?.AmK as GrahaId | undefined) ?? null

  const careerIds = [...new Set([
    tenthLordId,
    lagnaLordId,
    livelihoodId,
    classical.mahatEmphasis.winner.id,
    ...(amkId ? [amkId] : []),
  ])]

  const dispositor: DispositorChain[] = []
  const tenthRow = byId.get(tenthLordId)
  const lagnaRow = byId.get(lagnaLordId)
  if (tenthRow) dispositor.push(buildChain(tenthRow, 'D10 10th lord', byId))
  if (lagnaRow && lagnaLordId !== tenthLordId) {
    dispositor.push(buildChain(lagnaRow, 'D10 lagna lord', byId))
  }
  if (livelihoodId !== tenthLordId && livelihoodId !== lagnaLordId) {
    const liv = byId.get(livelihoodId)
    if (liv) dispositor.push(buildChain(liv, 'livelihood planet', byId))
  }

  const onTenth = buildDrishti(analysis, tenthSign, 'D10 10th')
  const onLagna = buildDrishti(analysis, d10, 'D10 lagna')
  const drishtiPrediction = [
    onTenth.length
      ? `Aspects on the D10 10th: ${onTenth.map((h) => h.name).join(', ')}.`
      : 'No full graha drishti reaches the D10 10th from other signs.',
    onLagna.length
      ? `Aspects on D10 lagna: ${onLagna.map((h) => h.name).join(', ')}.`
      : 'D10 lagna is free of outside full aspects.',
  ].join(' ')

  const shadbalaAvailable = Boolean(chart.shadbala?.planets)
  const shadbalaRows: StrengthRow[] = careerIds.map((id) => {
    const sb = chart.shadbala?.planets?.[id]
    const role =
      id === tenthLordId ? '10th lord'
        : id === lagnaLordId ? 'Lagna lord'
          : id === livelihoodId ? 'Livelihood'
            : id === amkId ? 'AmK'
              : 'Career lord'
    if (!sb) {
      return {
        id, name: GRAHA_NAMES[id], role,
        ratio: null, total: null, isStrong: null, quality: null, digBala: null,
        note: 'Shadbala not on this chart payload.',
      }
    }
    return {
      id,
      name: GRAHA_NAMES[id],
      role,
      ratio: sb.ratio,
      total: sb.total,
      isStrong: sb.isStrong,
      quality: sb.qualityBand ?? null,
      digBala: sb.digBala,
      note: sb.isStrong
        ? `${GRAHA_NAMES[id]} clears required Shadbala (ratio ${sb.ratio.toFixed(2)}) — natal muscle behind the D10 promise.`
        : `${GRAHA_NAMES[id]} is below required Shadbala (ratio ${sb.ratio.toFixed(2)}) — D10 status needs supporting lords and dasha.`,
    }
  })

  const bhava = chart.bhavaBala?.houses
  const h10 = bhava?.[10]
  const h11 = bhava?.[11]
  const bhavaBala = {
    available: Boolean(h10 || h11),
    tenth: h10
      ? {
          totalRupa: h10.totalRupa,
          isStrong: h10.isStrong,
          note: `Natal 10th bhava bala ${h10.totalRupa.toFixed(2)} rupa — ${h10.isStrong ? 'strong career house' : 'career house needs effort'}.`,
        }
      : null,
    eleventh: h11
      ? {
          totalRupa: h11.totalRupa,
          isStrong: h11.isStrong,
          note: `Natal 11th bhava bala ${h11.totalRupa.toFixed(2)} rupa — ${h11.isStrong ? 'gains house supports awards' : 'gains come slowly'}.`,
        }
      : null,
    prediction: (h10 || h11)
      ? 'Bhava bala is cast on the birth chart; strong natal 10th/11th backs whatever Dashamsha promises.'
      : 'Bhava bala not attached — recalculate for house strength.',
  }

  const d1Asc = chart.lagnas.ascRashi
  const sav = chart.ashtakavarga?.sav
  const savHouses: SavHouse[] = [10, 11, 1].map((house) => {
    const sign = houseSign(d1Asc, house)
    const bindus = sav ? sav[sign - 1] ?? null : null
    const tone: CareerTone =
      bindus == null ? 'neutral'
        : bindus >= 30 ? 'supportive'
          : bindus >= 25 ? 'mixed'
            : 'challenging'
    return {
      house,
      rashiName: RASHI_NAMES[sign],
      bindus,
      tone,
      note: bindus == null
        ? `SAV for natal H${house} unavailable.`
        : `Natal H${house} (${RASHI_NAMES[sign]}) has ${bindus} SAV bindus — ${
          bindus >= 30 ? 'transit and dasha fruits land easily'
            : bindus >= 25 ? 'average support'
              : 'thin support; effort and remedies matter'
        }.`,
    }
  })

  const karakaCodes: { code: string; id: GrahaId | null | undefined }[] = [
    { code: 'AK', id: chart.karakas?.AK as GrahaId | undefined },
    { code: 'AmK', id: chart.karakas?.AmK as GrahaId | undefined },
    { code: 'BK', id: chart.karakas?.BK as GrahaId | undefined },
    { code: 'MK', id: chart.karakas?.MK as GrahaId | undefined },
    { code: 'PK', id: chart.karakas?.PK as GrahaId | undefined },
    { code: 'GK', id: chart.karakas?.GK as GrahaId | undefined },
    { code: 'DK', id: chart.karakas?.DK as GrahaId | undefined },
    { code: 'PiK', id: chart.karakas?.PiK as GrahaId | null | undefined },
  ]
  const karakas: KarakaInD10[] = karakaCodes
    .filter((k): k is { code: string; id: GrahaId } => Boolean(k.id) && CLASSICAL.includes(k.id as GrahaId))
    .flatMap((k) => {
      const row = byId.get(k.id)
      if (!row) return []
      const label = KARAKA_CAREER[k.code] ?? k.code
      const place =
        [1, 10].includes(row.d10House) ? 'sits on the career throne'
          : [5, 9, 11].includes(row.d10House) ? 'supports status through fortune or gains'
            : [6, 8, 12].includes(row.d10House) ? 'works through pressure, secrecy, or service'
              : 'supports the profession from effort and speech'
      return [{
        code: k.code,
        label,
        id: k.id,
        name: GRAHA_NAMES[k.id],
        house: row.d10House,
        rashiName: row.d10RashiName,
        dignity: row.d10Dignity,
        careerNote: `${k.code} ${GRAHA_NAMES[k.id]} in D10 H${row.d10House} (${row.d10RashiName}) ${place}. ${label}.`,
      }]
    })

  const flags: PlanetFlag[] = careerIds.map((id) => {
    const row = byId.get(id)
    const natal = d1ById.get(id)
    const flagList: string[] = []
    if (row?.isVargottama) flagList.push('Vargottama')
    if (natal?.pushkara?.isPushkara) flagList.push('Pushkara')
    if (natal?.pushkara?.isPushkaraNavamsha) flagList.push('Pushkara Navamsha')
    if (natal?.isCombust) flagList.push('Combust')
    if (natal?.isRetro) flagList.push('Retrograde')
    if (row && ['exalted', 'moolatrikona', 'own'].includes(row.d10Dignity)) flagList.push(`D10 ${row.d10Dignity}`)
    if (row && row.d10Dignity === 'debilitated') flagList.push('D10 debilitated')
    const role =
      id === tenthLordId ? '10th lord'
        : id === lagnaLordId ? 'Lagna lord'
          : id === livelihoodId ? 'Livelihood'
            : id === amkId ? 'AmK'
              : 'Career'
    return {
      id,
      name: GRAHA_NAMES[id],
      role,
      flags: flagList,
      note: flagList.length
        ? `${GRAHA_NAMES[id]} (${role}): ${flagList.join(', ')}.`
        : `${GRAHA_NAMES[id]} (${role}): no special dignity flags.`,
    }
  })

  const raja = buildRaja(analysis, byId)

  const upcoming = buildUpcomingVimshottariTimeline(chart.dashas?.vimshottari ?? [], Date.now(), 6)
  const timelineItems: CareerTimelineItem[] = upcoming.upcomingAntars.map((item) => {
    const hit = careerIds.includes(item.lord) || careerIds.includes(item.mahaLord)
    const row = byId.get(item.lord)
    const tone: CareerTone =
      hit
        ? (row && [6, 8, 12].includes(row.d10House) ? 'mixed' : 'supportive')
        : item.tone === 'caution' ? 'challenging' : item.tone === 'supportive' ? 'mixed' : 'neutral'
    return {
      label: item.label,
      lord: item.lord,
      lordName: GRAHA_NAMES[item.lord],
      start: item.startIso.slice(0, 10),
      end: item.endIso.slice(0, 10),
      careerHit: hit,
      tone,
      note: hit
        ? `${GRAHA_NAMES[item.lord]} is a D10 career significator${row ? ` in H${row.d10House}` : ''}. ${item.hint ?? 'Watch status, role, and income moves.'}`
        : `${item.toneLabel}. ${item.hint ?? 'Background period for livelihood.'}`,
    }
  })
  if (upcoming.nextMaha) {
    const m = upcoming.nextMaha
    timelineItems.push({
      label: m.label,
      lord: m.lord,
      lordName: GRAHA_NAMES[m.lord],
      start: m.startIso.slice(0, 10),
      end: m.endIso.slice(0, 10),
      careerHit: careerIds.includes(m.lord),
      tone: careerIds.includes(m.lord) ? 'supportive' : 'neutral',
      note: careerIds.includes(m.lord)
        ? `Next mahadasha of career lord ${GRAHA_NAMES[m.lord]} — major professional chapter.`
        : `Next mahadasha ${GRAHA_NAMES[m.lord]} — check its D10 house when it arrives.`,
    })
  }

  const formedRaja = raja.filter((r) => r.formed)
  const strongSb = shadbalaRows.filter((r) => r.isStrong)
  const takeaways = [
    dispositor[0]?.prediction ?? 'Dispositor chain unavailable.',
    drishtiPrediction,
    strongSb.length
      ? `Strong natal Shadbala: ${strongSb.map((r) => r.name).join(', ')}.`
      : shadbalaAvailable
        ? 'Career lords are not all strong in Shadbala — lean on timing and supporting yogas.'
        : 'Attach Shadbala on recalculation for strength confirmation.',
    formedRaja.length
      ? `Formed D10 raja links: ${formedRaja.map((r) => r.title).join('; ')}.`
      : 'No kendra–trikona career links formed in D10 beyond isolated lords.',
    timelineItems.find((t) => t.careerHit)?.note
      ?? 'No immediate career-lord antardasha in the next windows — watch the listed timeline.',
  ]

  const headline = [
    formedRaja.length ? `${formedRaja.length} raja links` : 'technical read',
    onTenth.length ? `drishti×${onTenth.length}` : null,
    strongSb.length ? `strong ${strongSb.map((r) => r.name).join('/')}` : null,
  ].filter(Boolean).join(' · ')

  return {
    framing:
      'Advanced levers behind the Śāstra and Synthesis tabs: who feeds the career lords (dispositors), who aspects the D10 10th, natal Shadbala and SAV support, Jaimini karakas in D10, dignity flags, kendra–trikona links, and the next career-sensitive dasha windows.',
    headline,
    dispositor,
    drishti: {
      onTenth,
      onLagna,
      prediction: drishtiPrediction,
    },
    shadbala: {
      available: shadbalaAvailable,
      rows: shadbalaRows,
      prediction: shadbalaAvailable
        ? 'Shadbala is natal strength. A weak 10th lord can still deliver in its dasha if D10 yoga and SAV support, but the road is harder.'
        : 'Recalculate the chart to attach Shadbala.',
    },
    bhavaBala,
    ashtakavarga: {
      available: Boolean(sav),
      houses: savHouses,
      prediction: sav
        ? 'SAV bindus show how easily transit and dasha results land in natal career houses. Pair with D10 for what the result looks like.'
        : 'Ashtakavarga not on this payload.',
    },
    karakas,
    flags,
    raja,
    timeline: {
      headline: upcoming.headline || 'Upcoming Vimshottari windows',
      items: timelineItems,
    },
    takeaways,
  }
}
