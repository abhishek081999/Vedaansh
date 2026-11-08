// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dashamsaAdvanced.ts
//  Advanced D10 levers — dispositor chain, graha drishti,
//  Shadbala, SAV, chara karakas, flags, raja links, timeline.
//  Pure: no React / ephemeris / network.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, GrahaId, Rashi } from '@/types/astrology'
import { buildUpcomingVimshottariTimeline } from '@/lib/engine/dasha/vimshottariTimeline'
import type { CareerTone, DashamsaAnalysis, DashamsaPlanetRow } from '@/lib/engine/dashamsaAnalysis'
import { dignityText, fill, gName, pick, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import {
  D10A_TEXT_EN,
  D10A_TEXT_HI,
  KARAKA_CAREER_HI,
  type D10AText,
} from '@/lib/engine/locale/dashamsaAdvanced.hi'
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
  AK: 'Atmakaraka — soul\u2019s drive through the work',
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

function aspectLabel(id: GrahaId, fromRashi: Rashi, target: Rashi, T: D10AText): string {
  const house = ((target - fromRashi + 12) % 12) + 1
  if (id === 'Ma' && (house === 4 || house === 8)) return fill(T.aspectMarsSpecial, { house })
  if (id === 'Ju' && (house === 5 || house === 9)) return fill(T.aspectJuSpecial, { house })
  if (id === 'Sa' && (house === 3 || house === 10)) return fill(T.aspectSaSpecial, { house })
  if (house === 7) return T.aspect7Full
  return fill(T.aspectNth, { house })
}

function buildChain(
  start: DashamsaPlanetRow,
  role: string,
  byId: Map<GrahaId, DashamsaPlanetRow>,
  T: D10AText,
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
    ? fill(T.dispCyclic, {
        start: start.name,
        chain: links.map((l) => l.name).join(' → '),
      })
    : fill(T.dispLinear, {
        start: start.name,
        role,
        links: links.map((l) => fill(T.dispLink, { name: l.name, house: l.house })).join(' → '),
      }) + (tail ? fill(T.dispTail, { name: tail.name, rashi: tail.rashiName }) : '')
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
  T: D10AText,
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
    const asp = aspectLabel(p.id, p.d10Rashi, targetSign, T)
    hits.push({
      id: p.id,
      name: p.name,
      fromHouse: p.d10House,
      aspectLabel: asp,
      tone,
      note: fill(T.drishtiNote, {
        name: p.name,
        fromHouse: p.d10House,
        aspectLabel: asp,
        targetLabel,
        special: special ? T.drishtiSpecial : T.drishtiPlainEnd,
      }),
    })
  }
  return hits.sort((a, b) => a.fromHouse - b.fromHouse)
}

function buildRaja(
  analysis: DashamsaAnalysis,
  byId: Map<GrahaId, DashamsaPlanetRow>,
  T: D10AText,
  lang: EngineLang,
): RajaLink[] {
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
    { id: '1-10', title: T.rajaTitle1_10, a: L1, b: L10, why: T.rajaWhy1_10 },
    { id: '9-10', title: T.rajaTitle9_10, a: L9, b: L10, why: T.rajaWhy9_10 },
    { id: '5-10', title: T.rajaTitle5_10, a: L5, b: L10, why: T.rajaWhy5_10 },
    { id: '4-10', title: T.rajaTitle4_10, a: L4, b: L10, why: T.rajaWhy4_10 },
    { id: '7-10', title: T.rajaTitle7_10, a: L7, b: L10, why: T.rajaWhy7_10 },
  ]

  return pairs.map((p) => {
    const formed = connected(p.a, p.b)
    return {
      id: p.id,
      title: p.title,
      formed,
      tone: formed ? 'supportive' : 'neutral',
      prediction: formed
        ? fill(T.rajaFormed, { a: gName(p.a, lang), b: gName(p.b, lang), why: p.why })
        : fill(T.rajaNotFormed, { a: gName(p.a, lang), b: gName(p.b, lang) }),
    }
  })
}

function careerRoleLabel(
  id: GrahaId,
  tenthLordId: GrahaId,
  lagnaLordId: GrahaId,
  livelihoodId: GrahaId,
  amkId: GrahaId | null,
  T: D10AText,
  short: boolean,
): string {
  if (id === tenthLordId) return short ? T.role10thLord : T.roleD10TenthLord
  if (id === lagnaLordId) return short ? T.roleLagnaLord : T.roleD10LagnaLord
  if (id === livelihoodId) return short ? T.roleLivelihood : T.roleLivelihoodPlanet
  if (amkId && id === amkId) return T.roleAmK
  return short ? T.roleCareer : T.roleCareerLord
}

/**
 * Advanced Dashamsha technical layer.
 */
export function buildDashamsaAdvanced(
  analysis: DashamsaAnalysis,
  classical: DashamsaClassical,
  chart: ChartOutput,
  lang: EngineLang = 'en',
): DashamsaAdvanced | null {
  const T = pick(D10A_TEXT_EN, D10A_TEXT_HI, lang)
  const KARAKA = pick(KARAKA_CAREER, KARAKA_CAREER_HI, lang)

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
  if (tenthRow) {
    dispositor.push(
      buildChain(tenthRow, careerRoleLabel(tenthLordId, tenthLordId, lagnaLordId, livelihoodId, amkId, T, false), byId, T),
    )
  }
  if (lagnaRow && lagnaLordId !== tenthLordId) {
    dispositor.push(
      buildChain(lagnaRow, careerRoleLabel(lagnaLordId, tenthLordId, lagnaLordId, livelihoodId, amkId, T, false), byId, T),
    )
  }
  if (livelihoodId !== tenthLordId && livelihoodId !== lagnaLordId) {
    const liv = byId.get(livelihoodId)
    if (liv) {
      dispositor.push(
        buildChain(liv, careerRoleLabel(livelihoodId, tenthLordId, lagnaLordId, livelihoodId, amkId, T, false), byId, T),
      )
    }
  }

  const onTenth = buildDrishti(analysis, tenthSign, T.targetD10Tenth, T)
  const onLagna = buildDrishti(analysis, d10, T.targetD10Lagna, T)
  const drishtiPrediction = [
    onTenth.length
      ? fill(T.drishtiOnTenth, { names: onTenth.map((h) => h.name).join(', ') })
      : T.drishtiOnTenthNone,
    onLagna.length
      ? fill(T.drishtiOnLagna, { names: onLagna.map((h) => h.name).join(', ') })
      : T.drishtiOnLagnaNone,
  ].join(' ')

  const shadbalaAvailable = Boolean(chart.shadbala?.planets)
  const shadbalaRows: StrengthRow[] = careerIds.map((id) => {
    const sb = chart.shadbala?.planets?.[id]
    // Shadbala rows fall back to 'Career lord'; flag rows use the short 'Career'.
    const role = [tenthLordId, lagnaLordId, livelihoodId, amkId].includes(id)
      ? careerRoleLabel(id, tenthLordId, lagnaLordId, livelihoodId, amkId, T, true)
      : T.roleCareerLord
    const name = gName(id, lang)
    if (!sb) {
      return {
        id,
        name,
        role,
        ratio: null,
        total: null,
        isStrong: null,
        quality: null,
        digBala: null,
        note: T.shadbalaMissing,
      }
    }
    return {
      id,
      name,
      role,
      ratio: sb.ratio,
      total: sb.total,
      isStrong: sb.isStrong,
      quality: sb.qualityBand ?? null,
      digBala: sb.digBala,
      note: sb.isStrong
        ? fill(T.shadbalaStrong, { name, ratio: sb.ratio.toFixed(2) })
        : fill(T.shadbalaWeak, { name, ratio: sb.ratio.toFixed(2) }),
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
          note: fill(h10.isStrong ? T.bhava10Strong : T.bhava10Weak, { rupa: h10.totalRupa.toFixed(2) }),
        }
      : null,
    eleventh: h11
      ? {
          totalRupa: h11.totalRupa,
          isStrong: h11.isStrong,
          note: fill(h11.isStrong ? T.bhava11Strong : T.bhava11Weak, { rupa: h11.totalRupa.toFixed(2) }),
        }
      : null,
    prediction: (h10 || h11) ? T.bhavaPredAvailable : T.bhavaPredMissing,
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
    const rashiLabel = rName(sign, lang)
    const support =
      bindus == null ? ''
        : bindus >= 30 ? T.savSupportHigh
          : bindus >= 25 ? T.savSupportMid
            : T.savSupportLow
    return {
      house,
      rashiName: rashiLabel,
      bindus,
      tone,
      note: bindus == null
        ? fill(T.savUnavailable, { house })
        : fill(T.savNote, { house, rashi: rashiLabel, bindus, support }),
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
      const label = KARAKA[k.code] ?? k.code
      const place =
        [1, 10].includes(row.d10House) ? T.karakaThrone
          : [5, 9, 11].includes(row.d10House) ? T.karakaFortune
            : [6, 8, 12].includes(row.d10House) ? T.karakaPressure
              : T.karakaEffort
      return [{
        code: k.code,
        label,
        id: k.id,
        name: gName(k.id, lang),
        house: row.d10House,
        rashiName: row.d10RashiName,
        dignity: row.d10Dignity,
        careerNote: fill(T.karakaCareerNote, {
          code: k.code,
          name: gName(k.id, lang),
          house: row.d10House,
          rashi: row.d10RashiName,
          place,
          label,
        }),
      }]
    })

  const flags: PlanetFlag[] = careerIds.map((id) => {
    const row = byId.get(id)
    const natal = d1ById.get(id)
    const flagList: string[] = []
    if (row?.isVargottama) flagList.push(T.flagVargottama)
    if (natal?.pushkara?.isPushkara) flagList.push(T.flagPushkara)
    if (natal?.pushkara?.isPushkaraNavamsha) flagList.push(T.flagPushkaraNav)
    if (natal?.isCombust) flagList.push(T.flagCombust)
    if (natal?.isRetro) flagList.push(T.flagRetro)
    if (row && ['exalted', 'moolatrikona', 'own'].includes(row.d10Dignity)) {
      flagList.push(fill(T.flagD10Dignity, { dignity: dignityText(row.d10Dignity, lang) }))
    }
    if (row && row.d10Dignity === 'debilitated') flagList.push(T.flagD10Debilitated)
    const role = careerRoleLabel(id, tenthLordId, lagnaLordId, livelihoodId, amkId, T, true)
    const name = gName(id, lang)
    return {
      id,
      name,
      role,
      flags: flagList,
      note: flagList.length
        ? fill(T.flagNoteWith, { name, role, flags: flagList.join(', ') })
        : fill(T.flagNoteNone, { name, role }),
    }
  })

  const raja = buildRaja(analysis, byId, T, lang)

  const upcoming = buildUpcomingVimshottariTimeline(chart.dashas?.vimshottari ?? [], Date.now(), 6, lang)
  const timelineItems: CareerTimelineItem[] = upcoming.upcomingAntars.map((item) => {
    const hit = careerIds.includes(item.lord) || careerIds.includes(item.mahaLord)
    const row = byId.get(item.lord)
    const tone: CareerTone =
      hit
        ? (row && [6, 8, 12].includes(row.d10House) ? 'mixed' : 'supportive')
        : item.tone === 'caution' ? 'challenging' : item.tone === 'supportive' ? 'mixed' : 'neutral'
    const lordName = gName(item.lord, lang)
    return {
      label: item.label,
      lord: item.lord,
      lordName,
      start: item.startIso.slice(0, 10),
      end: item.endIso.slice(0, 10),
      careerHit: hit,
      tone,
      note: hit
        ? fill(T.timelineCareerHit, {
            name: lordName,
            housePart: row ? fill(T.timelineHousePart, { house: row.d10House }) : '',
            hint: item.hint ?? T.timelineHintDefault,
          })
        : fill(T.timelineBackground, {
            toneLabel: item.toneLabel,
            hint: item.hint ?? T.timelineHintBg,
          }),
    }
  })
  if (upcoming.nextMaha) {
    const m = upcoming.nextMaha
    const mahaName = gName(m.lord, lang)
    timelineItems.push({
      label: m.label,
      lord: m.lord,
      lordName: mahaName,
      start: m.startIso.slice(0, 10),
      end: m.endIso.slice(0, 10),
      careerHit: careerIds.includes(m.lord),
      tone: careerIds.includes(m.lord) ? 'supportive' : 'neutral',
      note: careerIds.includes(m.lord)
        ? fill(T.timelineNextMahaCareer, { name: mahaName })
        : fill(T.timelineNextMahaCheck, { name: mahaName }),
    })
  }

  const formedRaja = raja.filter((r) => r.formed)
  const strongSb = shadbalaRows.filter((r) => r.isStrong)
  const takeaways = [
    dispositor[0]?.prediction ?? T.takeawayDispMissing,
    drishtiPrediction,
    strongSb.length
      ? fill(T.takeawayStrongSb, { names: strongSb.map((r) => r.name).join(', ') })
      : shadbalaAvailable
        ? T.takeawayWeakSb
        : T.takeawaySbMissing,
    formedRaja.length
      ? fill(T.takeawayRajaFormed, { titles: formedRaja.map((r) => r.title).join('; ') })
      : T.takeawayRajaNone,
    timelineItems.find((t) => t.careerHit)?.note
      ?? T.takeawayTimelineNone,
  ]

  const headline = [
    formedRaja.length ? fill(T.headlineRajaLinks, { n: formedRaja.length }) : T.headlineTechnical,
    onTenth.length ? fill(T.headlineDrishti, { n: onTenth.length }) : null,
    strongSb.length ? fill(T.headlineStrong, { names: strongSb.map((r) => r.name).join('/') }) : null,
  ].filter(Boolean).join(' · ')

  return {
    framing: T.framing,
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
      prediction: shadbalaAvailable ? T.shadbalaPredAvailable : T.shadbalaPredMissing,
    },
    bhavaBala,
    ashtakavarga: {
      available: Boolean(sav),
      houses: savHouses,
      prediction: sav ? T.savPredAvailable : T.savPredMissing,
    },
    karakas,
    flags,
    raja,
    timeline: {
      headline: upcoming.headline || T.timelineHeadlineFallback,
      items: timelineItems,
    },
    takeaways,
  }
}
