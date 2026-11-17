// ─────────────────────────────────────────────────────────────
//  src/lib/engine/degreeBelts.ts
//  Degree belts (ansha kshetra): every sign is split into belts
//  owned by one planet's exaltation, mooltrikona, own-sign or
//  debilitation energy. Compiled from Phaladeepika and BPHS.
//
//  Teaching rules:
//  • Dignity is a degree question, not a sign question. Moon in
//    Scorpio is debilitated only at 0–3°; 4–30° is Mars's own-sign
//    belt, where the Moon is in a friend's sign.
//  • Belts never overlap, except Virgo 16–20° (Mercury mooltrikona
//    and Venus debilitation), where both apply.
//  • A planet sitting in another planet's exaltation or debilitation
//    belt lifts or disturbs THAT planet's karakatvas in the house the
//    sign falls in (Mars at 2° Scorpio → Moon's karakatvas there).
//  • Previous / current / next sign of a karaka reads the past,
//    present and future of what it signifies (Sun → father).
//  • Rahu and Ketu have no agreed exaltation; they are read only by
//    the belt they sit in.
//
//  Pure: no React / DB. Hindi text in ./locale/degreeBelts.hi.ts.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { fill, type EngineLang } from '@/lib/engine/lang'
import {
  DEBILITATION_SIGN,
  EXALTATION_DEGREE,
  EXALTATION_SIGN,
  MOOLATRIKONA_SIGN,
  OWN_SIGNS,
  naturalRelationship,
} from '@/lib/engine/dignity'
import { SIGN_LORD_BY_RASHI } from '@/lib/engine/lordshipInterpretations'
import { gn, rn, wholeSignHouse } from '@/lib/engine/shrap/helpers'
import { karakatvasFor, type NatalKarakatva } from '@/lib/engine/natalKarakatva'
import { DEGREE_BELTS_HI } from '@/lib/engine/locale/degreeBelts.hi'

// ── Types ─────────────────────────────────────────────────────

export type BeltKind = 'exaltation' | 'mooltrikona' | 'own' | 'debilitation'
export type BeltStanding = 'exalted' | 'mooltrikona' | 'own' | 'debilitated' | 'friend' | 'neutral' | 'enemy'
export type BeltTone = 'strong' | 'good' | 'mixed' | 'weak'
export type BeltEffect = 'supported' | 'mixed' | 'disturbed'
export type BeltMotion = 'towardsExaltation' | 'towardsDebilitation'

export interface DegreeBelt {
  rashi: Rashi
  /** Whole degrees, inclusive. 0–3 covers 0°00′ to 3°59′. `to` of 30 means the end of the sign. */
  from: number
  to: number
  owner: GrahaId
  kind: BeltKind
}

export interface BeltKarakatva {
  id: string
  label: string
  source?: string
}

export interface BeltEffectReading {
  planet: GrahaId
  planetName: string
  effect: BeltEffect
  text: string
  karakatvas: BeltKarakatva[]
}

export interface BeltPlacement {
  graha: GrahaId
  name: string
  rashi: Rashi
  rashiName: string
  degree: number
  degreeLabel: string
  house: number
  isRetro: boolean
  belts: Array<DegreeBelt & { label: string }>
  standing: BeltStanding
  standingLabel: string
  tone: BeltTone
  lines: string[]
  effects: BeltEffectReading[]
  motion: BeltMotion | null
  motionText: string | null
}

export type StageTone = 'good' | 'mixed' | 'hard'
export type TrajectoryTopic = 'father' | 'wife' | 'husband'

export interface TrajectoryStage {
  stage: 'past' | 'present' | 'future'
  stageLabel: string
  rashi: Rashi
  rashiName: string
  status: BeltStanding
  statusLabel: string
  occupants: GrahaId[]
  tone: StageTone
  text: string
}

export interface KarakaTrajectory {
  graha: GrahaId
  name: string
  topic: TrajectoryTopic
  topicLabel: string
  stages: TrajectoryStage[]
}

export interface SignBeltRow {
  rashi: Rashi
  rashiName: string
  house: number
  belts: Array<DegreeBelt & { label: string }>
  /** Planets in this sign, with degree, for markers on the belt bar. */
  planets: Array<{ graha: GrahaId; degree: number }>
}

export interface DegreeBeltReading {
  method: string[]
  table: SignBeltRow[]
  placements: BeltPlacement[]
  trajectories: KarakaTrajectory[]
  practice: string
  disclaimer: string
}

// ── Belt table ────────────────────────────────────────────────

type BeltRow = [number, number, GrahaId, BeltKind]

const BELT_ROWS: Record<Rashi, BeltRow[]> = {
  1: [[0, 10, 'Su', 'exaltation'], [11, 12, 'Ma', 'mooltrikona'], [13, 20, 'Sa', 'debilitation'], [21, 30, 'Ma', 'own']],
  2: [[0, 3, 'Mo', 'exaltation'], [4, 20, 'Mo', 'mooltrikona'], [21, 30, 'Ve', 'own']],
  3: [[0, 30, 'Me', 'own']],
  4: [[0, 5, 'Ju', 'exaltation'], [6, 28, 'Ma', 'debilitation'], [29, 30, 'Mo', 'own']],
  5: [[0, 20, 'Su', 'mooltrikona'], [21, 30, 'Su', 'own']],
  6: [[0, 15, 'Me', 'exaltation'], [16, 20, 'Me', 'mooltrikona'], [16, 27, 'Ve', 'debilitation'], [28, 30, 'Me', 'own']],
  7: [[0, 10, 'Su', 'debilitation'], [11, 12, 'Ve', 'mooltrikona'], [13, 20, 'Sa', 'exaltation'], [21, 30, 'Ve', 'own']],
  8: [[0, 3, 'Mo', 'debilitation'], [4, 30, 'Ma', 'own']],
  9: [[0, 10, 'Ju', 'mooltrikona'], [11, 30, 'Ju', 'own']],
  10: [[0, 5, 'Ju', 'debilitation'], [6, 28, 'Ma', 'exaltation'], [29, 30, 'Sa', 'own']],
  11: [[0, 20, 'Sa', 'mooltrikona'], [21, 30, 'Sa', 'own']],
  12: [[0, 15, 'Me', 'debilitation'], [16, 27, 'Ve', 'exaltation'], [28, 30, 'Ju', 'own']],
}

const RASHIS: Rashi[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export const DEGREE_BELTS: readonly DegreeBelt[] = RASHIS.flatMap((rashi) =>
  BELT_ROWS[rashi].map(([from, to, owner, kind]) => ({ rashi, from, to, owner, kind })),
)

/** Belts covering a degree in a sign. Usually one; Virgo 16–20° returns two. */
export function beltsAt(rashi: Rashi, degreeInSign: number): DegreeBelt[] {
  const d = Math.min(29, Math.max(0, Math.floor(degreeInSign)))
  return DEGREE_BELTS.filter((b) => b.rashi === rashi && d >= b.from && d <= Math.min(29, b.to))
}

// ── English text ──────────────────────────────────────────────

export const DEGREE_BELTS_EN = {
  kind: {
    exaltation: 'exaltation', mooltrikona: 'mooltrikona', own: 'own sign', debilitation: 'debilitation',
  } as Record<BeltKind, string>,
  standing: {
    exalted: 'exaltation belt', mooltrikona: 'mooltrikona belt', own: 'own-sign belt', debilitated: 'debilitation belt',
    friend: "friend's belt", neutral: 'neutral belt', enemy: "enemy's belt",
  } as Record<BeltStanding, string>,
  signStatus: {
    exalted: 'exalted', mooltrikona: 'mooltrikona sign', own: 'own sign', debilitated: 'debilitated',
    friend: "friend's sign", neutral: 'neutral sign', enemy: "enemy's sign",
  } as Record<BeltStanding, string>,
  beltLabel: '{from}–{to}° · {p} {kind}',
  lines: {
    exalted: '{p} sits inside its own exaltation belt: full potential for everything it signifies and for the houses it rules.',
    mooltrikona: '{p} sits in its mooltrikona belt: strong, steady results.',
    own: '{p} sits in its own-sign belt: comfortable and reliable.',
    debilitated: '{p} sits inside its own debilitation belt. It does not turn bad itself; its significations get diluted and it cannot deliver them fully.',
    friend: "{p} sits in {o}'s {kind} belt. {p} and {o} are friends, so results stay good, though below {p}'s own exaltation.",
    neutral: "{p} sits in {o}'s {kind} belt. The two are neutral to each other, so results are average.",
    enemy: "{p} sits in {o}'s {kind} belt. {o} is unfriendly to {p}, so {p} works under pressure here.",
    signOnlyExalted: '{sign} is {p}’s exaltation sign, but at {deg} it is outside the exaltation belt, so do not read it as exalted.',
    signOwnOther: '{sign} is {p}’s own sign, but at {deg} the belt belongs to {o}; read {o}’s energy here as well.',
    signOnlyDebilitated: '{sign} is {p}’s debilitation sign, but at {deg} it is outside the debilitation belt. The rest of the sign is not debilitation.',
    overlap: 'Virgo 16–20° is the one overlap in the whole zodiac: Mercury’s mooltrikona and Venus’s debilitation both act here.',
    node: '{p} has no agreed exaltation or debilitation in the classics, so it is read only through the belt it occupies.',
  },
  effects: {
    ownSupported: "{p}'s own significations in house {h} work well.",
    ownMixed: "{p}'s own significations in house {h} give average results.",
    ownDisturbed: "{p}'s own significations in house {h} are weakened.",
    otherExalted: "This is {o}'s exaltation belt, so {o}'s significations in house {h} get support.",
    otherDebilitated: "This is {o}'s debilitation belt, so {o}'s significations in house {h} are disturbed, however well {p} itself is placed.",
    none: 'No natal karakatva of {o} is listed for house {h}; read {o}’s general significations here.',
  },
  motion: {
    towardsExaltation: 'Uccha abhilashi: moving towards its exaltation point ({deg}° {sign}), so its results keep improving.',
    towardsDebilitation: 'Neecha abhilashi: moving towards its debilitation point ({deg}° {sign}), so its results keep thinning.',
    retro: ' Counted along its retrograde (backward) motion.',
  },
  topic: { father: 'Father', wife: 'Wife', husband: 'Husband' } as Record<TrajectoryTopic, string>,
  stage: {
    father: { past: 'Before your birth', present: 'At your birth', future: 'After your birth' },
    wife: { past: 'Her background', present: 'Her present', future: 'After marriage' },
    husband: { past: 'His background', present: 'His present', future: 'After marriage' },
  } as Record<TrajectoryTopic, Record<'past' | 'present' | 'future', string>>,
  stageText: {
    past: {
      good: '{p} came through {sign} ({status}{occ}): a supported background.',
      mixed: '{p} came through {sign} ({status}{occ}): an ordinary, mixed background.',
      hard: '{p} came through {sign} ({status}{occ}): a background of struggle and difficulty.',
    },
    present: {
      good: '{p} stands in {sign} ({status}{occ}): conditions now are good.',
      mixed: '{p} stands in {sign} ({status}{occ}): conditions now are mixed.',
      hard: '{p} stands in {sign} ({status}{occ}): conditions now are hard.',
    },
    future: {
      good: '{p} moves on to {sign} ({status}{occ}): things improve ahead.',
      mixed: '{p} moves on to {sign} ({status}{occ}): no big change ahead.',
      hard: '{p} moves on to {sign} ({status}{occ}): more pressure ahead.',
    },
  } as Record<'past' | 'present' | 'future', Record<StageTone, string>>,
  occupants: ', with {list}',
  method: [
    'Every degree of a sign belongs to one belt. Find the belt of each planet’s degree, not just its sign.',
    'In its own belt a planet shows its exaltation, mooltrikona, own-sign or debilitation result.',
    'In another planet’s belt, judge by friendship with the belt’s owner: friends do well, enemies struggle.',
    'If the belt is another planet’s exaltation or debilitation, that planet’s karakatvas in this house are lifted or disturbed.',
    'A degree counts with its minutes: 0–3° runs up to 3°59′; 4° starts the next belt.',
    'Sign (rashi) and house (bhava) are different: exaltation is read only from the sign.',
  ],
  practice:
    'Practice: take 10 charts. Read the Sun for the father and Venus for the wife. Match the previous sign with the background, the current sign with the present and the next sign with what follows, then ask the native.',
  disclaimer:
    'Teaching lens on whole-sign houses. Belts point where to look; a full reading weighs strength, dashas and vargas. The previous and next sign are a virtual movement, used as a reading device.',
}

export const DEGREE_BELTS_UI_EN = {
  title: 'Degree belts',
  subtitle: 'Each sign is split into degree belts of exaltation, mooltrikona, own sign and debilitation. Your planets are marked on them.',
  methodTitle: 'How to read',
  tableTitle: 'Belts in your chart',
  placementsTitle: 'Planet by planet',
  trajectoryTitle: 'Past, present and future of a karaka',
  karakatvas: 'Karakatvas in this house',
  house: 'H{n}',
  legend: { exaltation: 'Exaltation', mooltrikona: 'Mooltrikona', own: 'Own sign', debilitation: 'Debilitation' } as Record<BeltKind, string>,
  tone: { strong: 'Strong', good: 'Good', mixed: 'Average', weak: 'Weak' } as Record<BeltTone, string>,
  effect: { supported: 'Supported', mixed: 'Average', disturbed: 'Disturbed' } as Record<BeltEffect, string>,
  stageTone: { good: 'Good', mixed: 'Mixed', hard: 'Hard' } as Record<StageTone, string>,
  karakatvaTableTitle: 'Natal karakatvas (house × planet)',
}

export function degreeBeltsUiText(lang: EngineLang = 'en') {
  return lang === 'hi' ? DEGREE_BELTS_HI.ui : DEGREE_BELTS_UI_EN
}

function txt(lang: EngineLang) {
  return lang === 'hi' ? DEGREE_BELTS_HI.text : DEGREE_BELTS_EN
}

// ── Helpers ───────────────────────────────────────────────────

const GRAHAS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const NODES: GrahaId[] = ['Ra', 'Ke']

const KIND_STANDING: Record<BeltKind, BeltStanding> = {
  exaltation: 'exalted', mooltrikona: 'mooltrikona', own: 'own', debilitation: 'debilitated',
}

const STANDING_TONE: Record<BeltStanding, BeltTone> = {
  exalted: 'strong', mooltrikona: 'strong', own: 'good', friend: 'good', neutral: 'mixed', enemy: 'weak', debilitated: 'weak',
}

const STANDING_SCORE: Record<BeltStanding, number> = {
  exalted: 2, mooltrikona: 1, own: 1, friend: 1, neutral: 0, enemy: -1, debilitated: -2,
}

function fmtDeg(deg: number): string {
  const d = Math.floor(deg)
  const m = Math.floor((deg - d) * 60)
  return `${d}°${String(m).padStart(2, '0')}′`
}

function beltLabel(b: DegreeBelt, lang: EngineLang): string {
  const t = txt(lang)
  return fill(t.beltLabel, { from: b.from, to: b.to, p: gn(b.owner, lang), kind: t.kind[b.kind] })
}

/** Relation in either direction: an enemy on one side spoils the pair. */
function mutualRelation(a: GrahaId, b: GrahaId): 'friend' | 'neutral' | 'enemy' {
  const ab = naturalRelationship(a, b)
  const ba = naturalRelationship(b, a)
  if (ab === 'enemy' || ba === 'enemy') return 'enemy'
  if (ab === 'friend' || ba === 'friend') return 'friend'
  return 'neutral'
}

/** Where the planet stands by its degree belt. */
export function beltStanding(graha: GrahaId, belts: DegreeBelt[]): { standing: BeltStanding; via: DegreeBelt | null } {
  const own = belts.find((b) => b.owner === graha)
  if (own) return { standing: KIND_STANDING[own.kind], via: own }
  const first = belts[0]
  if (!first) return { standing: 'neutral', via: null }
  return { standing: mutualRelation(graha, first.owner), via: first }
}

/** Sign-level status, used for the previous / next sign of a karaka. */
export function signStatus(graha: GrahaId, rashi: Rashi): BeltStanding {
  if (EXALTATION_SIGN[graha] === rashi && !NODES.includes(graha)) return 'exalted'
  if (DEBILITATION_SIGN[graha] === rashi && !NODES.includes(graha)) return 'debilitated'
  if (MOOLATRIKONA_SIGN[graha] === rashi) return 'mooltrikona'
  if (OWN_SIGNS[graha]?.includes(rashi)) return 'own'
  return mutualRelation(graha, SIGN_LORD_BY_RASHI[rashi])
}

/** Uccha / neecha abhilashi from the exact exaltation point. */
export function beltMotion(graha: GrahaId, lonSidereal: number, isRetro: boolean): BeltMotion | null {
  const exSign = EXALTATION_SIGN[graha]
  const exDeg = EXALTATION_DEGREE[graha]
  if (NODES.includes(graha) || !exSign || exDeg === undefined) return null
  const ex = (exSign - 1) * 30 + exDeg
  const deb = (ex + 180) % 360
  const lon = ((lonSidereal % 360) + 360) % 360
  const ahead = (target: number) => (isRetro ? (lon - target + 360) % 360 : (target - lon + 360) % 360)
  return ahead(ex) < ahead(deb) ? 'towardsExaltation' : 'towardsDebilitation'
}

function karakaList(planet: GrahaId, house: number, lang: EngineLang): BeltKarakatva[] {
  return karakatvasFor(planet, house).map((k: NatalKarakatva) => ({
    id: k.id,
    label: lang === 'hi' ? k.hi : k.en,
    ...(k.source ? { source: k.source } : {}),
  }))
}

// ── Placement reading ─────────────────────────────────────────

export function readBeltPlacement(g: GrahaData, ascRashi: Rashi, lang: EngineLang = 'en'): BeltPlacement {
  const t = txt(lang)
  const belts = beltsAt(g.rashi, g.degree)
  const house = wholeSignHouse(g.rashi, ascRashi)
  const { standing, via } = beltStanding(g.id, belts)
  const tone = STANDING_TONE[standing]
  const p = gn(g.id, lang)
  const sign = rn(g.rashi, lang)
  const deg = fmtDeg(g.degree)

  const lines: string[] = []
  if (via && via.owner === g.id) {
    lines.push(fill(t.lines[standing as 'exalted' | 'mooltrikona' | 'own' | 'debilitated'], { p }))
  } else if (via) {
    lines.push(fill(t.lines[standing as 'friend' | 'neutral' | 'enemy'], { p, o: gn(via.owner, lang), kind: t.kind[via.kind] }))
  }
  if (via && via.owner !== g.id && OWN_SIGNS[g.id]?.includes(g.rashi)) {
    lines.push(fill(t.lines.signOwnOther, { p, sign, deg, o: gn(via.owner, lang) }))
  }
  if (!NODES.includes(g.id)) {
    if (EXALTATION_SIGN[g.id] === g.rashi && standing !== 'exalted') lines.push(fill(t.lines.signOnlyExalted, { p, sign, deg }))
    if (DEBILITATION_SIGN[g.id] === g.rashi && standing !== 'debilitated') lines.push(fill(t.lines.signOnlyDebilitated, { p, sign, deg }))
  } else {
    lines.push(fill(t.lines.node, { p }))
  }
  if (belts.length > 1) lines.push(t.lines.overlap)

  // Effects: the planet's own karakatvas here, then hidden owners.
  const effects: BeltEffectReading[] = []
  const ownEffect: BeltEffect = tone === 'weak' ? 'disturbed' : tone === 'mixed' ? 'mixed' : 'supported'
  const ownKey = ownEffect === 'supported' ? 'ownSupported' : ownEffect === 'mixed' ? 'ownMixed' : 'ownDisturbed'
  const ownKaraka = karakaList(g.id, house, lang)
  if (ownKaraka.length) {
    effects.push({ planet: g.id, planetName: p, effect: ownEffect, text: fill(t.effects[ownKey], { p, h: house }), karakatvas: ownKaraka })
  }
  for (const b of belts) {
    if (b.owner === g.id) continue
    if (b.kind !== 'exaltation' && b.kind !== 'debilitation') continue
    const o = gn(b.owner, lang)
    const list = karakaList(b.owner, house, lang)
    const head = fill(b.kind === 'exaltation' ? t.effects.otherExalted : t.effects.otherDebilitated, { o, p, h: house })
    effects.push({
      planet: b.owner,
      planetName: o,
      effect: b.kind === 'exaltation' ? 'supported' : 'disturbed',
      text: list.length ? head : `${head} ${fill(t.effects.none, { o, h: house })}`,
      karakatvas: list,
    })
  }

  const motion = beltMotion(g.id, g.lonSidereal, g.isRetro)
  let motionText: string | null = null
  if (motion) {
    const exSign = EXALTATION_SIGN[g.id] as Rashi
    const pointSign = motion === 'towardsExaltation' ? exSign : ((((exSign - 1 + 6) % 12) + 1) as Rashi)
    motionText = fill(t.motion[motion], { deg: EXALTATION_DEGREE[g.id] ?? 0, sign: rn(pointSign, lang) })
    if (g.isRetro) motionText += t.motion.retro
  }

  return {
    graha: g.id,
    name: p,
    rashi: g.rashi,
    rashiName: sign,
    degree: g.degree,
    degreeLabel: deg,
    house,
    isRetro: g.isRetro,
    belts: belts.map((b) => ({ ...b, label: beltLabel(b, lang) })),
    standing,
    standingLabel: t.standing[standing],
    tone,
    lines,
    effects,
    motion,
    motionText,
  }
}

// ── Karaka trajectory (previous / current / next sign) ───────

function stageTone(graha: GrahaId, status: BeltStanding, occupants: GrahaId[]): StageTone {
  let score = STANDING_SCORE[status]
  for (const o of occupants) {
    const rel = mutualRelation(graha, o)
    if (rel === 'enemy') score -= 1
    else if (rel === 'friend') score += 0.5
  }
  if (score >= 1) return 'good'
  if (score <= -1) return 'hard'
  return 'mixed'
}

export function readTrajectory(
  chart: ChartOutput,
  graha: GrahaId,
  topic: TrajectoryTopic,
  lang: EngineLang = 'en',
): KarakaTrajectory | null {
  const t = txt(lang)
  const g = chart.grahas?.find((x) => x.id === graha)
  if (!g) return null
  const step = g.isRetro ? -1 : 1
  const shift = (r: Rashi, n: number) => ((((r - 1 + n) % 12) + 12) % 12 + 1) as Rashi
  const signs: Record<'past' | 'present' | 'future', Rashi> = {
    past: shift(g.rashi, -step),
    present: g.rashi,
    future: shift(g.rashi, step),
  }
  const p = gn(graha, lang)
  const stages = (['past', 'present', 'future'] as const).map((stage): TrajectoryStage => {
    const rashi = signs[stage]
    const occupants = (chart.grahas ?? []).filter((x) => GRAHAS.includes(x.id) && x.id !== graha && x.rashi === rashi).map((x) => x.id)
    const status = stage === 'present' ? beltStanding(graha, beltsAt(rashi, g.degree)).standing : signStatus(graha, rashi)
    const tone = stageTone(graha, status, occupants)
    const statusLabel = stage === 'present' ? t.standing[status] : t.signStatus[status]
    const occ = occupants.length ? fill(t.occupants, { list: occupants.map((o) => gn(o, lang)).join(', ') }) : ''
    return {
      stage,
      stageLabel: t.stage[topic][stage],
      rashi,
      rashiName: rn(rashi, lang),
      status,
      statusLabel,
      occupants,
      tone,
      text: fill(t.stageText[stage][tone], { p, sign: rn(rashi, lang), status: statusLabel, occ }),
    }
  })
  return { graha, name: p, topic, topicLabel: t.topic[topic], stages }
}

// ── Full reading ──────────────────────────────────────────────

export function buildDegreeBelts(chart: ChartOutput, lang: EngineLang = 'en'): DegreeBeltReading | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc || !chart.grahas?.length) return null
  const t = txt(lang)
  const grahas = chart.grahas.filter((g) => GRAHAS.includes(g.id))

  const table: SignBeltRow[] = RASHIS.map((rashi) => ({
    rashi,
    rashiName: rn(rashi, lang),
    house: wholeSignHouse(rashi, asc),
    belts: DEGREE_BELTS.filter((b) => b.rashi === rashi).map((b) => ({ ...b, label: beltLabel(b, lang) })),
    planets: grahas.filter((g) => g.rashi === rashi).map((g) => ({ graha: g.id, degree: g.degree })),
  }))

  const spouse: { graha: GrahaId; topic: TrajectoryTopic } =
    chart.meta?.gender === 'female' ? { graha: 'Ju', topic: 'husband' } : { graha: 'Ve', topic: 'wife' }
  const trajectories = [
    readTrajectory(chart, 'Su', 'father', lang),
    readTrajectory(chart, spouse.graha, spouse.topic, lang),
  ].filter((x): x is KarakaTrajectory => x !== null)

  return {
    method: [...t.method],
    table,
    placements: grahas.map((g) => readBeltPlacement(g, asc, lang)),
    trajectories,
    practice: t.practice,
    disclaimer: t.disclaimer,
  }
}
