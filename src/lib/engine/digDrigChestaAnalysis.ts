// ─────────────────────────────────────────────────────────────
//  src/lib/engine/digDrigChestaAnalysis.ts
//  Interpretive Dig / Drig / Cheshta (+ brief Naisargika) layer
//  Soft heuristics from practitioner lecture; classical Dig min = 35,
//  Cheshta min = 50 Virupas (Parashara-style UI).
// ─────────────────────────────────────────────────────────────

import type { DashaNode, GrahaData, GrahaId, Rashi, ShadbalaPlanet, ShadbalaResult } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { signModality, type SignModality } from '@/lib/engine/dashamsaClassical'
import { D9 } from '@/lib/engine/vargas'

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

export const DIG_CLASSICAL_MIN_VIRUPAS = 35
export const CHESTA_CLASSICAL_MIN_VIRUPAS = 50
/** Lecture: Dig ~40–50+ = strong directional clarity / stubbornness. */
export const DIG_SOFT_STRONG = 40
export const DIG_SOFT_BASELINE = 20

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const NAISARGIKA_RANK: GrahaId[] = ['Su', 'Mo', 'Ve', 'Ju', 'Me', 'Ma', 'Sa']

export type SoftBand = 'strong' | 'baseline' | 'weak'
export type PredictionTone = 'favorable' | 'supportive' | 'mixed' | 'caution'

export interface DigPlanetRow {
  id: GrahaId
  name: string
  virupas: number
  rupas: number
  softBand: SoftBand
  meetsClassicalMin: boolean
  note: string
  remedy: string
}

export interface DrigPlanetRow {
  id: GrahaId
  name: string
  virupas: number
  rupas: number
  polarity: 'positive' | 'negative' | 'neutral'
  benefic: number | null
  malefic: number | null
  note: string
  remedy: string
}

export interface ChestaPlanetRow {
  id: GrahaId
  name: string
  virupas: number
  rupas: number
  softBand: SoftBand
  meetsClassicalMin: boolean
  effortTheme: string
  note: string
  remedy: string
}

export interface NaisargikaRow {
  id: GrahaId
  name: string
  virupas: number
  rank: number
}

export interface ModalityProfile {
  dominant: SignModality
  movableCount: number
  fixedCount: number
  dualCount: number
  seventhModality: SignModality | null
  seventhRashi: Rashi | null
  note: string
  relationshipNote: string | null
}

export interface DigDrigChestaPrediction {
  id: string
  topic: 'dig' | 'drig' | 'chesta' | 'modality' | 'naisargika' | 'combo' | 'remedy'
  title: string
  tone: PredictionTone
  text: string
  basedOn?: string
  virupas?: number | null
}

export interface DigDrigChestaAnalysis {
  dig: {
    strongestId: GrahaId
    weakestId: GrahaId
    meanVirupas: number
    rows: DigPlanetRow[]
    summary: string
  }
  drig: {
    mostPositiveId: GrahaId
    mostNegativeId: GrahaId
    meanVirupas: number
    rows: DrigPlanetRow[]
    summary: string
  }
  chesta: {
    strongestId: GrahaId
    weakestId: GrahaId
    meanVirupas: number
    rows: ChestaPlanetRow[]
    summary: string
  }
  naisargika: {
    rows: NaisargikaRow[]
    note: string
  }
  modality: ModalityProfile
  dashaDig: {
    current: { lord: string; lordName: string; scoredId: GrahaId | null; virupas: number | null; note: string } | null
    next: { lord: string; lordName: string; scoredId: GrahaId | null; virupas: number | null; note: string } | null
  }
  predictions: DigDrigChestaPrediction[]
  libraConfusionCue: string | null
}

const DIG_NOTES: Record<string, string> = {
  strong: 'Clear directional drive — committed (even stubborn) about where to go; not proof the path is correct.',
  baseline: 'Moderate direction sense — purpose is present but can blur under pressure.',
  weak: 'Confused about direction — seek mentors, wait out the storm, communicate that you need processing time.',
}

const DIG_REMEDY =
  'Ask mentors/counselors for direction; pay respect/charity to Jupiter if Ju Dig is weak; shelter during confusion storms; do not abandon preparation — wait for clarity.'

const DRIG_REMEDY_NEG =
  'Gemstone of the planet (in moderation), daan, Ganesh + Shiva abhishek, stay humble/sattvic, check muhurta for special occasions only.'

const DRIG_REMEDY_POS =
  'Keep positive associations; avoid company that “cuts” strong Dig — Drig shows who amplifies or restrains you.'

type ThemeGraha = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'

const CHESTA_THEME: Record<ThemeGraha, string> = {
  Su: 'Serving / pleasing authority',
  Mo: 'Effort toward comfort, care, and emotional labor',
  Ma: 'Networking / connectivity effort',
  Me: 'Communication with managers and paperwork effort',
  Ju: 'Spiritual / wisdom effort (sadhu authenticity cue)',
  Ve: 'Relationship investment effort',
  Sa: 'Loyal protective work effort (dedicated employee cue)',
  Ra: 'Obsessive / amplified effort',
  Ke: 'Withdrawn or cut effort',
}

const CHESTA_REMEDY =
  'Hanuman / Narasimha worship, Hanuman Chalisa, Ekadashi fasting, mauna, and social-media detox rebuild effort capacity (3rd-house / Mars domain).'

function digBand(v: number): SoftBand {
  if (v >= DIG_SOFT_STRONG) return 'strong'
  if (v >= DIG_SOFT_BASELINE) return 'baseline'
  return 'weak'
}

function chestaBand(v: number): SoftBand {
  if (v >= 45) return 'strong'
  if (v >= 25) return 'baseline'
  return 'weak'
}

function virupa(p: ShadbalaPlanet | undefined, key: 'dig' | 'drik' | 'chesta' | 'naisargika', rupaKey: keyof ShadbalaPlanet): number {
  if (!p) return 0
  const sh = p.componentShash?.[key as keyof NonNullable<ShadbalaPlanet['componentShash']>]
  if (typeof sh === 'number' && Number.isFinite(sh)) return sh
  return (Number(p[rupaKey]) || 0) * 60
}

function resolveScored(
  lord: string,
  grahas?: GrahaData[],
): GrahaId | null {
  if (ORDER.includes(lord as GrahaId)) return lord as GrahaId
  if ((lord === 'Ra' || lord === 'Ke') && grahas?.length) {
    const node = grahas.find((g) => g.id === lord)
    if (node?.rashi) return SIGN_LORDS[node.rashi as Rashi]
  }
  return null
}

function pickCurrentNext(nodes: DashaNode[], asOf: Date): { current: DashaNode | null; next: DashaNode | null } {
  const maha = nodes
    .filter((n) => n.level === 1)
    .slice()
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  if (!maha.length) return { current: null, next: null }
  const t = asOf.getTime()
  const current =
    maha.find((n) => n.isCurrent) ??
    maha.find((n) => {
      const s = new Date(n.start).getTime()
      const e = new Date(n.end).getTime()
      return t >= s && t <= e
    }) ??
    null
  if (!current) {
    return { current: null, next: maha.find((n) => new Date(n.start).getTime() > t) ?? null }
  }
  const idx = maha.indexOf(current)
  return { current, next: idx >= 0 && idx < maha.length - 1 ? maha[idx + 1] : null }
}

function modalityNote(dom: SignModality, movable: number, fixed: number, dual: number): string {
  if (dom === 'movable') {
    return `Chara-heavy natal map (${movable} movable vs ${fixed} fixed / ${dual} dual) — life tends to reinvent every few years; Dig often looks restless/confused under change pressure.`
  }
  if (dom === 'fixed') {
    return `Sthira-heavy map (${fixed} fixed) — resistant to change; Dig can look low because the native refuses to shift stance even when strong Dig exists on a path.`
  }
  return `Dwiswabhava-heavy map (${dual} dual) — negotiation/side-hustle mind; most confusion-prone, oscillating between stay and change.`
}

function seventhRelNote(mod: SignModality | null): string | null {
  if (!mod) return null
  if (mod === 'movable') {
    return '7th is Chara — partnership patterns may change frequently (psychological tendency, not a moral verdict).'
  }
  if (mod === 'fixed') {
    return '7th is Sthira — loyalty and stickiness in partnership; hard to leave even under strain.'
  }
  return '7th is Dwiswabhava — partnership stance shifts with the “deal” on offer; negotiation energy.'
}

export interface AnalyzeDigDrigChestaOptions {
  dashaNodes?: DashaNode[]
  grahas?: GrahaData[]
  ascRashi?: Rashi
  asOf?: Date
}

export function analyzeDigDrigChesta(
  shadbala: ShadbalaResult | null | undefined,
  opts: AnalyzeDigDrigChestaOptions = {},
): DigDrigChestaAnalysis | null {
  if (!shadbala?.planets) return null
  const sb = shadbala

  const digRows: DigPlanetRow[] = ORDER.map((id) => {
    const v = virupa(sb.planets[id], 'dig', 'digBala')
    const softBand = digBand(v)
    return {
      id,
      name: GRAHA_NAMES[id],
      virupas: +v.toFixed(2),
      rupas: +(v / 60).toFixed(3),
      softBand,
      meetsClassicalMin: v >= DIG_CLASSICAL_MIN_VIRUPAS,
      note: DIG_NOTES[softBand],
      remedy: DIG_REMEDY,
    }
  })

  const drigRows: DrigPlanetRow[] = ORDER.map((id) => {
    const p = sb.planets[id]
    const v = virupa(p, 'drik', 'drikBala')
    const benefic = p?.details?.drik?.benefic ?? null
    const malefic = p?.details?.drik?.malefic ?? null
    const polarity: DrigPlanetRow['polarity'] =
      v > 2 ? 'positive' : v < -2 ? 'negative' : 'neutral'
    return {
      id,
      name: GRAHA_NAMES[id],
      virupas: +v.toFixed(2),
      rupas: +(v / 60).toFixed(3),
      polarity,
      benefic: benefic != null ? +benefic.toFixed(2) : null,
      malefic: malefic != null ? +malefic.toFixed(2) : null,
      note:
        polarity === 'positive'
          ? 'Associations push you to do more — encouraging / amplifying company.'
          : polarity === 'negative'
            ? 'Associations restrain you (“sit down”) — protective friction, not always moral “bad”.'
            : 'Mixed / mild aspectual push — neither strong encouragement nor strong restraint.',
      remedy: polarity === 'negative' ? DRIG_REMEDY_NEG : DRIG_REMEDY_POS,
    }
  })

  const chestaRows: ChestaPlanetRow[] = ORDER.map((id) => {
    const v = virupa(sb.planets[id], 'chesta', 'chestaBala')
    const softBand = chestaBand(v)
    return {
      id,
      name: GRAHA_NAMES[id],
      virupas: +v.toFixed(2),
      rupas: +(v / 60).toFixed(3),
      softBand,
      meetsClassicalMin: v >= CHESTA_CLASSICAL_MIN_VIRUPAS,
      effortTheme: CHESTA_THEME[id as ThemeGraha],
      note:
        softBand === 'strong'
          ? `Real effort is invested in ${CHESTA_THEME[id as ThemeGraha].toLowerCase()}.`
          : softBand === 'weak'
            ? `Low effort signal on ${CHESTA_THEME[id as ThemeGraha].toLowerCase()} — rebuild focus (detox, fasting, Hanuman).`
            : `Moderate effort on ${CHESTA_THEME[id as ThemeGraha].toLowerCase()}.`,
      remedy: CHESTA_REMEDY,
    }
  })

  const naisargika: NaisargikaRow[] = NAISARGIKA_RANK.map((id, i) => ({
    id,
    name: GRAHA_NAMES[id],
    virupas: +virupa(sb.planets[id], 'naisargika', 'naisargikaBala').toFixed(2),
    rank: i + 1,
  }))

  // Modality from natal graha rashis
  let movableCount = 0
  let fixedCount = 0
  let dualCount = 0
  if (opts.grahas?.length) {
    for (const g of opts.grahas) {
      if (!ORDER.includes(g.id as GrahaId) || !g.rashi) continue
      const m = signModality(g.rashi as Rashi)
      if (m === 'movable') movableCount++
      else if (m === 'fixed') fixedCount++
      else dualCount++
    }
  }
  const dominant: SignModality =
    movableCount >= fixedCount && movableCount >= dualCount
      ? 'movable'
      : fixedCount >= dualCount
        ? 'fixed'
        : 'dual'

  let seventhRashi: Rashi | null = null
  let seventhModality: SignModality | null = null
  if (opts.ascRashi) {
    seventhRashi = ((((opts.ascRashi - 1 + 6) % 12) + 1) as Rashi)
    seventhModality = signModality(seventhRashi)
  }

  const modality: ModalityProfile = {
    dominant,
    movableCount,
    fixedCount,
    dualCount,
    seventhModality,
    seventhRashi,
    note: modalityNote(dominant, movableCount, fixedCount, dualCount),
    relationshipNote: seventhRelNote(seventhModality),
  }

  const digStrong = digRows.reduce((a, b) => (b.virupas > a.virupas ? b : a))
  const digWeak = digRows.reduce((a, b) => (b.virupas < a.virupas ? b : a))
  const digMean = digRows.reduce((s, r) => s + r.virupas, 0) / digRows.length

  const drigPos = drigRows.reduce((a, b) => (b.virupas > a.virupas ? b : a))
  const drigNeg = drigRows.reduce((a, b) => (b.virupas < a.virupas ? b : a))
  const drigMean = drigRows.reduce((s, r) => s + r.virupas, 0) / drigRows.length

  const chestaStrong = chestaRows.reduce((a, b) => (b.virupas > a.virupas ? b : a))
  const chestaWeak = chestaRows.reduce((a, b) => (b.virupas < a.virupas ? b : a))
  const chestaMean = chestaRows.reduce((s, r) => s + r.virupas, 0) / chestaRows.length

  const asOf = opts.asOf ?? new Date()
  const { current, next } = opts.dashaNodes?.length
    ? pickCurrentNext(opts.dashaNodes, asOf)
    : { current: null, next: null }

  function digCue(node: DashaNode | null) {
    if (!node?.lord) return null
    const scoredId = resolveScored(node.lord, opts.grahas)
    const virupas = scoredId ? virupa(sb.planets[scoredId], 'dig', 'digBala') : null
    const lordName = GRAHA_NAMES[node.lord as GrahaId] ?? node.lord
    let note = `${lordName} Dig unavailable (need dispositor for Ra/Ke).`
    if (scoredId && virupas != null) {
      const band = digBand(virupas)
      note =
        band === 'strong'
          ? `${lordName} Dig ${virupas.toFixed(0)} — adamant pursuit in this MD; pair with Kaal curvature so effort rides an upward slope.`
          : band === 'weak'
            ? `${lordName} Dig ${virupas.toFixed(0)} — confusion window; ask for direction, wait the storm.`
            : `${lordName} Dig ${virupas.toFixed(0)} — moderate directional drive this MD.`
    }
    return { lord: node.lord, lordName, scoredId, virupas, note }
  }

  const dashaDig = { current: digCue(current), next: digCue(next) }

  // Libra confusion: Libra = rashi 7; check D9 of lagna lord or many planets in Libra D9
  let libraConfusionCue: string | null = null
  if (opts.grahas?.length) {
    const inLibraD9 = opts.grahas.filter((g) => ORDER.includes(g.id as GrahaId) && D9(g.totalDegree) === 7).length
    if (inLibraD9 >= 3) {
      libraConfusionCue = `${inLibraD9} planets occupy Libra Navamsha — peak crossroads / confusion tendency when Libra amsha periods activate.`
    }
  }
  if (current?.lord === 'Ve' || next?.lord === 'Ve') {
    const when = current?.lord === 'Ve' ? 'current' : 'upcoming'
    libraConfusionCue = [
      libraConfusionCue,
      `Venus ${when} mahadasha can amplify Libra-like crossroads confusion — seek mentors before major forks.`,
    ]
      .filter(Boolean)
      .join(' ')
  }

  const predictions = buildPredictions({
    digRows,
    drigRows,
    chestaRows,
    digStrong,
    digWeak,
    digMean,
    drigPos,
    drigNeg,
    chestaStrong,
    chestaWeak,
    modality,
    dashaDig,
    libraConfusionCue,
  })

  return {
    dig: {
      strongestId: digStrong.id,
      weakestId: digWeak.id,
      meanVirupas: +digMean.toFixed(2),
      rows: digRows,
      summary: `Dig mean ${digMean.toFixed(0)} Virupas — strongest ${digStrong.name} (${digStrong.virupas.toFixed(0)}), weakest ${digWeak.name} (${digWeak.virupas.toFixed(0)}). Dig = clarity/stubbornness of direction, not correctness.`,
    },
    drig: {
      mostPositiveId: drigPos.id,
      mostNegativeId: drigNeg.id,
      meanVirupas: +drigMean.toFixed(2),
      rows: drigRows,
      summary: `Drig mean ${drigMean.toFixed(1)} — most encouraging ${drigPos.name} (${drigPos.virupas.toFixed(1)}), most restraining ${drigNeg.name} (${drigNeg.virupas.toFixed(1)}).`,
    },
    chesta: {
      strongestId: chestaStrong.id,
      weakestId: chestaWeak.id,
      meanVirupas: +chestaMean.toFixed(2),
      rows: chestaRows,
      summary: `Cheshta mean ${chestaMean.toFixed(0)} — most effort ${chestaStrong.name} (${chestaStrong.virupas.toFixed(0)}), least ${chestaWeak.name} (${chestaWeak.virupas.toFixed(0)}).`,
    },
    naisargika: {
      rows: naisargika,
      note: 'Naisargika is fixed natural luminosity order (Sun → … → Saturn). Nothing to “fix” — use it as baseline hierarchy only.',
    },
    modality,
    dashaDig,
    predictions,
    libraConfusionCue,
  }
}

function buildPredictions(input: {
  digRows: DigPlanetRow[]
  drigRows: DrigPlanetRow[]
  chestaRows: ChestaPlanetRow[]
  digStrong: DigPlanetRow
  digWeak: DigPlanetRow
  digMean: number
  drigPos: DrigPlanetRow
  drigNeg: DrigPlanetRow
  chestaStrong: ChestaPlanetRow
  chestaWeak: ChestaPlanetRow
  modality: ModalityProfile
  dashaDig: DigDrigChestaAnalysis['dashaDig']
  libraConfusionCue: string | null
}): DigDrigChestaPrediction[] {
  const out: DigDrigChestaPrediction[] = []

  out.push({
    id: 'dig-core',
    topic: 'dig',
    title: 'Directional clarity (Dig)',
    tone: input.digMean >= DIG_SOFT_STRONG ? 'supportive' : input.digMean < DIG_SOFT_BASELINE ? 'caution' : 'mixed',
    text: `Mean Dig ${input.digMean.toFixed(0)} Virupas. Strongest ${input.digStrong.name} (${input.digStrong.virupas.toFixed(0)}) shows adamant direction; weakest ${input.digWeak.name} (${input.digWeak.virupas.toFixed(0)}) shows confusion. Dig ≠ correct path.`,
    basedOn: input.digStrong.name,
    virupas: input.digStrong.virupas,
  })

  if (input.digStrong.softBand === 'strong' && input.digStrong.virupas >= 50) {
    out.push({
      id: 'dig-wrong-path',
      topic: 'dig',
      title: 'High Dig caution',
      tone: 'caution',
      text: `${input.digStrong.name} Dig is very high (${input.digStrong.virupas.toFixed(0)}) — pause and reflect if ego is locking a wrong fork (e.g. stubborn marriage/career). Strong Dig can destroy through adamancy.`,
      basedOn: input.digStrong.name,
      virupas: input.digStrong.virupas,
    })
  }

  out.push({
    id: 'drig-core',
    topic: 'drig',
    title: 'Associations (Drig)',
    tone: input.drigNeg.polarity === 'negative' ? 'mixed' : 'supportive',
    text: `${input.drigPos.name} aspects encourage growth (${input.drigPos.virupas.toFixed(1)}); ${input.drigNeg.name} restrains (${input.drigNeg.virupas.toFixed(1)}). Negative Drig is protective grease — without it, excess runs unchecked.`,
    basedOn: input.drigNeg.name,
    virupas: input.drigNeg.virupas,
  })

  const veChesta = input.chestaRows.find((r) => r.id === 'Ve')
  if (veChesta) {
    out.push({
      id: 'chesta-venus',
      topic: 'chesta',
      title: 'Relationship effort (Venus Cheshta)',
      tone: veChesta.softBand === 'strong' ? 'favorable' : veChesta.softBand === 'weak' ? 'caution' : 'mixed',
      text:
        veChesta.softBand === 'weak'
          ? `Venus Cheshta is low (${veChesta.virupas.toFixed(0)}) — partner may treat the bond like a passive asset; look for real chase/effort.`
          : veChesta.softBand === 'strong'
            ? `Venus Cheshta is high (${veChesta.virupas.toFixed(0)}) — real relationship investment (claims of total detachment may not match effort).`
            : `Venus Cheshta is moderate (${veChesta.virupas.toFixed(0)}) — some investment, not obsessive.`,
      basedOn: 'Venus',
      virupas: veChesta.virupas,
    })
  }

  const juChesta = input.chestaRows.find((r) => r.id === 'Ju')
  if (juChesta) {
    out.push({
      id: 'chesta-jupiter',
      topic: 'chesta',
      title: 'Spiritual effort (Jupiter Cheshta)',
      tone: juChesta.softBand === 'strong' ? 'favorable' : 'mixed',
      text:
        juChesta.softBand === 'strong'
          ? `Jupiter Cheshta ${juChesta.virupas.toFixed(0)} — genuine sadhana/wisdom effort (sadhu authenticity cue).`
          : `Jupiter Cheshta ${juChesta.virupas.toFixed(0)} — spiritual effort is not the chart’s loudest signal.`,
      basedOn: 'Jupiter',
      virupas: juChesta.virupas,
    })
  }

  const saChesta = input.chestaRows.find((r) => r.id === 'Sa')
  if (saChesta) {
    out.push({
      id: 'chesta-saturn',
      topic: 'chesta',
      title: 'Employee loyalty effort (Saturn Cheshta)',
      tone: saChesta.softBand === 'strong' ? 'supportive' : 'mixed',
      text:
        saChesta.softBand === 'strong'
          ? `Saturn Cheshta ${saChesta.virupas.toFixed(0)} — dedicated “I will protect you” work ethic.`
          : `Saturn Cheshta ${saChesta.virupas.toFixed(0)} — protective work effort is average/low.`,
      basedOn: 'Saturn',
      virupas: saChesta.virupas,
    })
  }

  out.push({
    id: 'modality',
    topic: 'modality',
    title: 'Chara / Sthira / Dual temperament',
    tone: input.modality.dominant === 'dual' ? 'caution' : 'mixed',
    text: [
      input.modality.note,
      input.modality.relationshipNote,
      input.modality.seventhRashi
        ? `7th sign: ${RASHI_NAMES[input.modality.seventhRashi]}.`
        : null,
    ]
      .filter(Boolean)
      .join(' '),
  })

  if (input.libraConfusionCue) {
    out.push({
      id: 'libra-confusion',
      topic: 'dig',
      title: 'Libra / crossroads confusion',
      tone: 'caution',
      text: input.libraConfusionCue,
    })
  }

  if (input.dashaDig.current) {
    out.push({
      id: 'dig-md-current',
      topic: 'dig',
      title: 'Dig in current MD',
      tone: (input.dashaDig.current.virupas ?? 0) >= DIG_SOFT_STRONG ? 'supportive' : (input.dashaDig.current.virupas ?? 0) < DIG_SOFT_BASELINE ? 'caution' : 'mixed',
      text: input.dashaDig.current.note,
      basedOn: input.dashaDig.current.lordName,
      virupas: input.dashaDig.current.virupas,
    })
  }
  if (input.dashaDig.next) {
    out.push({
      id: 'dig-md-next',
      topic: 'dig',
      title: 'Dig in next MD',
      tone: (input.dashaDig.next.virupas ?? 0) >= DIG_SOFT_STRONG ? 'supportive' : (input.dashaDig.next.virupas ?? 0) < DIG_SOFT_BASELINE ? 'caution' : 'mixed',
      text: input.dashaDig.next.note,
      basedOn: input.dashaDig.next.lordName,
      virupas: input.dashaDig.next.virupas,
    })
  }

  // Combo: strong Dig + need positive Drig
  if (input.digStrong.softBand === 'strong') {
    out.push({
      id: 'combo-dig-drig',
      topic: 'combo',
      title: 'Strong Dig needs good company',
      tone: input.drigNeg.polarity === 'negative' ? 'caution' : 'supportive',
      text: `With strong Dig (${input.digStrong.name} ${input.digStrong.virupas.toFixed(0)}), keep positive associations — negative Drig can cut directional energy. Watch ${input.drigNeg.name} restraint (${input.drigNeg.virupas.toFixed(1)}).`,
      basedOn: input.digStrong.name,
    })
  }

  out.push({
    id: 'naisargika',
    topic: 'naisargika',
    title: 'Naisargika (natural order)',
    tone: 'mixed',
    text: 'Fixed hierarchy by natural light: Sun > Moon > Venus > Jupiter > Mercury > Mars > Saturn. Display-only — no remedial “fix.”',
  })

  if (input.digWeak.softBand === 'weak') {
    out.push({
      id: 'remedy-dig',
      topic: 'remedy',
      title: 'Weak Dig remedies',
      tone: 'mixed',
      text: DIG_REMEDY,
      basedOn: input.digWeak.name,
      virupas: input.digWeak.virupas,
    })
  }

  if (input.chestaWeak.softBand === 'weak') {
    out.push({
      id: 'remedy-chesta',
      topic: 'remedy',
      title: 'Low Cheshta remedies',
      tone: 'mixed',
      text: CHESTA_REMEDY,
      basedOn: input.chestaWeak.name,
      virupas: input.chestaWeak.virupas,
    })
  }

  return out
}

export function softBandColor(band: SoftBand): string {
  if (band === 'strong') return 'var(--teal)'
  if (band === 'baseline') return 'var(--text-muted)'
  return 'var(--rose)'
}

export function softBandLabel(band: SoftBand): string {
  if (band === 'strong') return 'strong'
  if (band === 'baseline') return 'baseline'
  return 'weak'
}

export function predictionToneColor(tone: PredictionTone): string {
  if (tone === 'favorable') return 'var(--teal)'
  if (tone === 'supportive') return 'var(--text-gold)'
  if (tone === 'caution') return 'var(--rose)'
  return 'var(--amber)'
}

export function predictionToneLabel(tone: PredictionTone): string {
  if (tone === 'favorable') return 'Favorable'
  if (tone === 'supportive') return 'Supportive'
  if (tone === 'caution') return 'Caution'
  return 'Mixed'
}

export function drigPolarityColor(p: 'positive' | 'negative' | 'neutral'): string {
  if (p === 'positive') return 'var(--teal)'
  if (p === 'negative') return 'var(--rose)'
  return 'var(--text-muted)'
}
