// ─────────────────────────────────────────────────────────────
//  src/lib/engine/planetaryEnergyCycles.ts
//  Planetary energy forms from satsang teaching — independent of dasha
//  Source: air-sign / cycle discourse (Su, Mo, Ma, Me, Ju, Ve, Sa, Ra, Ke)
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'

export type EnergyCycleStatus =
  | 'active'
  | 'approaching'
  | 'dormant'
  | 'continuous'
  | 'natal'
  | 'not_applicable'

export type EnergyCycleKind =
  | 'sun_air_authority'
  | 'moon_emotional_memory'
  | 'mars_four_fires'
  | 'mercury_circuits'
  | 'jupiter_peace'
  | 'venus_desires'
  | 'saturn_karma_lock'
  | 'rahu_magnetic'
  | 'ketu_past_life'

export interface EnergyPhase {
  label: string
  description: string
}

export interface EnergyWindow {
  label: string
  ages: string
  kind: 'lock' | 'release' | 'activation' | 'cycle'
  active: boolean
}

export interface PlanetaryEnergyCycle {
  grahaId: GrahaId
  grahaName: string
  kind: EnergyCycleKind
  title: string
  theme: string
  cyclePeriod: string
  status: EnergyCycleStatus
  statusLabel: string
  summary: string
  phases: EnergyPhase[]
  windows: EnergyWindow[]
  manifestations: string[]
  natalNotes: string[]
  insight: string
}

export interface PlanetaryEnergyCyclesResult {
  age: number
  birthDate: string
  asOf: string
  cycles: PlanetaryEnergyCycle[]
  insight: string
}

/** Gemini, Libra, Aquarius — Sun Authority Switch applies in any house. */
const AIR_RASHIS: Rashi[] = [3, 7, 11]

const SUN_ACTIVATION_AGES = [17, 24, 33, 42, 51, 68]
const JUPITER_PEACE_AGES = [12, 24, 36, 48, 60]

const SATURN_LOCKS: Array<{ label: string; from: number; to: number }> = [
  { label: '1st Lock', from: 18, to: 21 },
  { label: '2nd Lock', from: 29, to: 32 },
  { label: '3rd Lock', from: 42, to: 45 },
]
const SATURN_RELEASES: Array<{ label: string; from: number; to: number }> = [
  { label: '1st Release', from: 24, to: 26 },
  { label: '2nd Release', from: 36, to: 38 },
  { label: '3rd Release', from: 48, to: 51 },
]

/** Example Mars fire flavours by natal nakshatra (teaching examples). */
const MARS_FIRE_BY_NAK: Partial<Record<number, string>> = {
  4: 'Desire-based Fire',  // Mrigashira
  13: 'Creative Fire',     // Chitra
  20: 'Strategic Fire',    // Uttara Ashadha
}

/** Logical circuit: Purva Bhadra, Hasta; also Kanya (Virgo) influence. */
const MERCURY_LOGICAL_NAK = new Set([12, 24]) // Hasta, Purva Bhadra
/** Chaotic / poetic circuit: Krittika, Ardra, Jyeshtha. */
const MERCURY_CHAOTIC_NAK = new Set([2, 5, 17])

const VENUS_PADA_DESIRE: Record<1 | 2 | 3 | 4, { type: string; meaning: string }> = {
  1: { type: 'Bhog', meaning: 'Material enjoyment / pleasures' },
  2: { type: 'Prem', meaning: 'Experience of love' },
  3: { type: 'Kala Siddhi', meaning: 'Mastery of art' },
  4: { type: 'Tapasya & Tyag', meaning: 'Penance and sacrifice' },
}

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const CORE_INSIGHT =
  'These are energy forms — they activate regardless of which mahadasha or antardasha is running.'

/** Completed age in whole years from YYYY-MM-DD birth date. */
export function ageFromBirthDate(birthDate: string, asOf: Date = new Date()): number {
  const [y, mm, dd] = birthDate.split('-').map(Number)
  if (!y || !mm || !dd) return 0
  const birth = new Date(y, mm - 1, dd)
  let age = asOf.getFullYear() - birth.getFullYear()
  const monthDiff = asOf.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birth.getDate())) age--
  return Math.max(0, age)
}

function inRange(age: number, from: number, to: number): boolean {
  return age >= from && age <= to
}

function nearestFutureAge(age: number, ages: number[]): number | null {
  return ages.find(a => a > age) ?? null
}

function ageHitStatus(
  age: number,
  activationAges: number[],
): { status: EnergyCycleStatus; statusLabel: string } {
  if (activationAges.includes(age)) {
    return { status: 'active', statusLabel: 'Active now' }
  }
  const next = nearestFutureAge(age, activationAges)
  if (next != null && next - age <= 2) {
    return { status: 'approaching', statusLabel: `Approaching age ${next}` }
  }
  if (next != null) {
    return { status: 'dormant', statusLabel: `Next at age ${next}` }
  }
  return { status: 'dormant', statusLabel: 'Past listed activation ages' }
}

function findGraha(grahas: GrahaData[], id: GrahaId): GrahaData | undefined {
  return grahas.find(g => g.id === id)
}

function nextMultiple(age: number, every: number): number {
  if (age <= 0) return every
  const rem = age % every
  return rem === 0 ? age + every : age + (every - rem)
}

// ── Sun: Authority Switch (air signs only, any house) ────────

function sunCycle(age: number, g: GrahaData | undefined): PlanetaryEnergyCycle {
  const rashi = g?.rashi
  const isAir = rashi != null && AIR_RASHIS.includes(rashi)
  const base = ageHitStatus(age, SUN_ACTIVATION_AGES)
  const status = !isAir ? 'not_applicable' : base.status
  const statusLabel = !isAir
    ? 'Only when Sun is in Gemini, Libra, or Aquarius'
    : base.statusLabel

  return {
    grahaId: 'Su',
    grahaName: GRAHA_NAMES.Su,
    kind: 'sun_air_authority',
    title: 'Authority Switch Energy',
    theme: 'Confident authority ↔ approval-seeking',
    cyclePeriod: 'Every 3–4 years when air-Sun pattern is lit',
    status,
    statusLabel,
    summary: isAir
      ? 'Sun in an air sign (any house) gives Authority Switch energy. About every 3–4 years it activates: first confident and authoritative, then suddenly confused into approval-seeking, then back into the authority zone with an identity reboot.'
      : `Natal Sun is in ${rashi ? RASHI_NAMES[rashi] : '—'} (not air). This Authority Switch pattern applies only when Sun sits in Gemini, Libra, or Aquarius — house does not matter.`,
    phases: [
      { label: 'Phase 1', description: 'Very confident and authoritative.' },
      { label: 'Phase 2', description: 'Sudden confusion; becomes an approval seeker.' },
      { label: 'Phase 3', description: 'Returns to the authority zone; identity reboot.' },
    ],
    windows: SUN_ACTIVATION_AGES.map(a => ({
      label: `Age ${a}`,
      ages: String(a),
      kind: 'activation' as const,
      active: isAir && age === a,
    })),
    manifestations: [
      'Sudden job change',
      'Wrong decisions by listening to others',
      'Regret over those decisions',
      'Clarity returns',
      'Identity reboot',
    ],
    natalNotes: [
      `Sun in ${rashi ? RASHI_NAMES[rashi] : '—'}${isAir ? ' (air — pattern applies, any house)' : ' (not air — pattern does not apply)'}`,
      ...(g ? [`${NAKSHATRA_NAMES[g.nakshatraIndex]} · Pada ${g.pada}`] : []),
      ...(isAir
        ? [`Listed trigger ages: ${SUN_ACTIVATION_AGES.join(', ')}`]
        : []),
    ],
    insight: CORE_INSIGHT,
  }
}

// ── Moon: Emotional memory (7y) / negative nakshatra form (14y) ─

function moonCycle(age: number, g: GrahaData | undefined): PlanetaryEnergyCycle {
  const positiveHit = age > 0 && age % 7 === 0
  const negativeHit = age > 0 && age % 14 === 0
  let status: EnergyCycleStatus = 'dormant'
  let statusLabel = `Next mindset shift at age ${nextMultiple(age, 7)}`

  if (negativeHit) {
    status = 'active'
    statusLabel = 'Negative nakshatra form active (14-year mark)'
  } else if (positiveHit) {
    status = 'active'
    statusLabel = 'Emotional memory / mindset shift (7-year mark)'
  } else if (age % 7 >= 5) {
    status = 'approaching'
    statusLabel = `Mindset shift near age ${nextMultiple(age, 7)}`
  }

  const nak = g ? NAKSHATRA_NAMES[g.nakshatraIndex] : '—'
  return {
    grahaId: 'Mo',
    grahaName: GRAHA_NAMES.Mo,
    kind: 'moon_emotional_memory',
    title: 'Emotional Memory Cycle',
    theme: 'Mindset change · nakshatra shadow every 14y',
    cyclePeriod: '7 years (mindset) · 14 years (negative form)',
    status,
    statusLabel,
    summary:
      'Moon carries an emotional-memory cycle. Every 7 years it changes the mindset. Every 14 years the negative form / negative energy of the birth Moon nakshatra activates. This is recognized only when recurring life cycles are observed.',
    phases: [
      {
        label: '7-year cycle',
        description: 'Emotional memory resets; mindset changes.',
      },
      {
        label: '14-year cycle',
        description: 'Negative form of the natal Moon nakshatra activates.',
      },
    ],
    windows: [
      {
        label: 'Mindset change',
        ages: 'Every 7 years',
        kind: 'cycle',
        active: positiveHit && !negativeHit,
      },
      {
        label: 'Negative nakshatra form',
        ages: 'Every 14 years',
        kind: 'activation',
        active: negativeHit,
      },
    ],
    manifestations: [
      'Recurring emotional themes return',
      'Mindset shifts after observation of the pattern',
      'Understood only when life cycles are realized in hindsight',
    ],
    natalNotes: [
      `Moon in ${nak}${g ? ` · Pada ${g.pada}` : ''}`,
      'Applies for the natal Moon nakshatra — not limited to air signs',
    ],
    insight: CORE_INSIGHT,
  }
}

// ── Mars: Four platforms + nakshatra fire flavour ─────────────

function marsCycle(g: GrahaData | undefined): PlanetaryEnergyCycle {
  const fire =
    g != null ? (MARS_FIRE_BY_NAK[g.nakshatraIndex] ?? 'Nakshatra-specific Fire') : 'Nakshatra-specific Fire'
  const nak = g ? NAKSHATRA_NAMES[g.nakshatraIndex] : '—'
  const knownExample = g != null && MARS_FIRE_BY_NAK[g.nakshatraIndex] != null

  return {
    grahaId: 'Ma',
    grahaName: GRAHA_NAMES.Ma,
    kind: 'mars_four_fires',
    title: 'Four Platforms of Operation',
    theme: 'Physical · Sexual · Competitive · Survival',
    cyclePeriod: 'Triggered by nakshatra deity, pada, or Agni Yoga',
    status: 'natal',
    statusLabel: knownExample ? `${fire} (natal)` : `${fire} · decode via deity & pada`,
    summary:
      'Mars operates on four energy levels: physical drive, sexual magnetism, competitive fire, and survival instinct. Activation comes through the nakshatra’s deities, the charan (pada), and when Agni Yoga forms in any dasha/antardasha — Mars need not be the dasha lord.',
    phases: [
      { label: 'Physical Drive', description: 'Body energy, effort, stamina.' },
      { label: 'Sexual Magnetism', description: 'Attraction and desire charge.' },
      { label: 'Competitive Fire', description: 'Drive to win and assert.' },
      { label: 'Survival Instinct', description: 'Self-protection and fight response.' },
    ],
    windows: [
      { label: 'Nakshatra deities', ages: 'Natal / ongoing', kind: 'cycle', active: true },
      { label: 'Pada (charan)', ages: g ? `Pada ${g.pada}` : 'Natal', kind: 'activation', active: true },
      {
        label: 'Agni Yoga',
        ages: 'Any MD/AD (Mars not required)',
        kind: 'activation',
        active: false,
      },
    ],
    manifestations: [
      `${nak}: ${fire}`,
      'Fire type flavours how Mars plays across the four platforms',
      'Agni Yoga in the running dasha can light these platforms even without Mars as lord',
    ],
    natalNotes: [
      `Mars in ${nak}${g ? ` · Pada ${g.pada}` : ''}`,
      `Fire signature: ${fire}`,
      'Teaching examples — Uttara Ashadha: Strategic · Chitra: Creative · Mrigashira: Desire-based',
    ],
    insight: CORE_INSIGHT,
  }
}

// ── Mercury: Logical vs chaotic/poetic circuits ───────────────

function mercuryCycle(g: GrahaData | undefined): PlanetaryEnergyCycle {
  const nakIdx = g?.nakshatraIndex
  const inVirgo = g?.rashi === 6
  const logicalNatal = (nakIdx != null && MERCURY_LOGICAL_NAK.has(nakIdx)) || inVirgo
  const chaoticNatal = nakIdx != null && MERCURY_CHAOTIC_NAK.has(nakIdx)

  let status: EnergyCycleStatus = 'natal'
  let statusLabel = 'Decode which circuit is lit'
  let summary =
    'Mercury always works on two energy levels. Most charts are misread as “combust — Sun takes over.” Instead ask which circuit is active: logical, or chaotic/poetic.'

  if (logicalNatal && chaoticNatal) {
    statusLabel = 'Both circuit signatures present'
    summary +=
      ' Natal Mercury touches both logical and chaotic signatures — decode which influence is loud in the current period.'
  } else if (logicalNatal) {
    statusLabel = 'Logical circuit (natal)'
    summary =
      'Logical circuit is indicated: Purva Bhadra, Hasta, or Virgo (Kanya) influence on Mercury.'
  } else if (chaoticNatal) {
    status = 'active'
    statusLabel = 'Chaotic / poetic circuit (natal)'
    summary =
      'Chaotic/poetic circuit is indicated (Jyeshtha, Ardra, or Krittika influence). When lit, Mercury can overturn life patterns completely.'
  }

  return {
    grahaId: 'Me',
    grahaName: GRAHA_NAMES.Me,
    kind: 'mercury_circuits',
    title: 'Two Energy Circuits',
    theme: 'Logical vs Chaotic / Poetic',
    cyclePeriod: 'By nakshatra & Kanya influence — not by combust alone',
    status,
    statusLabel,
    summary,
    phases: [
      {
        label: 'Logical circuit',
        description: 'Activates under Purva Bhadra, Hasta, or Virgo (Kanya) influence.',
      },
      {
        label: 'Chaotic / poetic circuit',
        description:
          'Activates under Jyeshtha, Ardra, or Krittika influence — can create full upheaval in life.',
      },
    ],
    windows: [
      {
        label: 'Logical triggers',
        ages: 'Purva Bhadra · Hasta · Virgo',
        kind: 'cycle',
        active: logicalNatal,
      },
      {
        label: 'Chaotic / poetic triggers',
        ages: 'Jyeshtha · Ardra · Krittika',
        kind: 'cycle',
        active: chaoticNatal,
      },
    ],
    manifestations: [
      'Do not stop at “combust” and hand the reading to Sun',
      'Logical circuit: ordered, analytical Budha',
      'Chaotic/poetic circuit: upheaval and intensity',
      'Even if Mercury is combust, Mercury-like results can still manifest',
      'Even if Ketu’s dasha is running (and Mercury’s is not), Mercury-like results can still appear',
    ],
    natalNotes: [
      `Mercury in ${g ? RASHI_NAMES[g.rashi] : '—'} · ${g ? NAKSHATRA_NAMES[g.nakshatraIndex] : '—'}`,
      ...(g?.isCombust
        ? ['Combust noted — still decode Mercury’s own circuit; Sun does not erase Budha']
        : ['If combust later by transit/dasha context: still decode Mercury’s circuit']),
      'Circuit read from Mercury’s own sign/nakshatra influence; broader yogas may also light a circuit',
    ],
    insight: CORE_INSIGHT,
  }
}

// ── Jupiter: Peace period every 12 years ──────────────────────

function jupiterCycle(age: number, g: GrahaData | undefined): PlanetaryEnergyCycle {
  const base = ageHitStatus(age, JUPITER_PEACE_AGES)
  return {
    grahaId: 'Ju',
    grahaName: GRAHA_NAMES.Ju,
    kind: 'jupiter_peace',
    title: 'Peace Period (Shanti Kaal)',
    theme: 'Invisible blessings & protection',
    cyclePeriod: 'Every 12 years',
    status: base.status,
    statusLabel: base.statusLabel,
    summary:
      'Jupiter activates an inner peace period every 12 years. At ages 12, 24, 36, 48, and 60, unseen or invisible blessings / protection are indicated — check those years in the native’s life.',
    phases: [
      {
        label: 'Shanti kaal',
        description: 'Peace window; unseen blessing or protection arrives.',
      },
    ],
    windows: JUPITER_PEACE_AGES.map(a => ({
      label: `Age ${a}`,
      ages: String(a),
      kind: 'activation' as const,
      active: age === a,
    })),
    manifestations: [
      'Unseen / invisible blessings',
      'Protection that may only be clear in hindsight',
    ],
    natalNotes: [
      `Jupiter in ${g ? RASHI_NAMES[g.rashi] : '—'} · ${g ? NAKSHATRA_NAMES[g.nakshatraIndex] : '—'}`,
      `Peace ages: ${JUPITER_PEACE_AGES.join(', ')}`,
    ],
    insight: CORE_INSIGHT,
  }
}

// ── Venus: Three pre-birth desires by pada (no 6y cycle in source) ─

function venusCycle(g: GrahaData | undefined): PlanetaryEnergyCycle {
  const padaRaw = g?.pada ?? 1
  const pada = (padaRaw >= 1 && padaRaw <= 4 ? padaRaw : 1) as 1 | 2 | 3 | 4
  const desire = VENUS_PADA_DESIRE[pada]

  return {
    grahaId: 'Ve',
    grahaName: GRAHA_NAMES.Ve,
    kind: 'venus_desires',
    title: 'Three Pre-birth Desires',
    theme: 'Bhog · Prem · Kala · (4th: Tapasya & Tyag)',
    cyclePeriod: 'Fixed by Venus pada at birth',
    status: 'natal',
    statusLabel: `Pada ${pada}: ${desire.type}`,
    summary: `Before birth, Venus implants desire into the native. The Venus pada decides which seed dominates: ${desire.type} — ${desire.meaning}.`,
    phases: [
      { label: '1st Pada — Bhog', description: 'Material enjoyment / pleasures.' },
      { label: '2nd Pada — Prem', description: 'Experience of love.' },
      { label: '3rd Pada — Kala Siddhi', description: 'Mastery of art.' },
      { label: '4th Pada — Tapasya & Tyag', description: 'Penance and sacrifice.' },
    ],
    windows: [
      {
        label: `Natal Venus pada ${pada}`,
        ages: desire.type,
        kind: 'activation',
        active: true,
      },
    ],
    manifestations: [
      'Desire seed is set before birth',
      'Pada shows which of the four tracks is primary',
    ],
    natalNotes: [
      `Venus in ${g ? NAKSHATRA_NAMES[g.nakshatraIndex] : '—'} · Pada ${pada}`,
      `Seed desire: ${desire.type} — ${desire.meaning}`,
    ],
    insight: CORE_INSIGHT,
  }
}

// ── Saturn: 3 locks + 3 releases ──────────────────────────────

function saturnCycle(age: number, g: GrahaData | undefined): PlanetaryEnergyCycle {
  const lock = SATURN_LOCKS.find(w => inRange(age, w.from, w.to))
  const release = SATURN_RELEASES.find(w => inRange(age, w.from, w.to))
  let status: EnergyCycleStatus = 'dormant'
  let statusLabel = 'Between lock and release windows'

  if (lock) {
    status = 'active'
    statusLabel = `${lock.label} active (${lock.from}–${lock.to})`
  } else if (release) {
    status = 'active'
    statusLabel = `${release.label} active (${release.from}–${release.to})`
  } else {
    const nextLock = SATURN_LOCKS.find(w => w.from > age)
    const nextRelease = SATURN_RELEASES.find(w => w.from > age)
    const next = [nextLock, nextRelease]
      .filter(Boolean)
      .sort((a, b) => a!.from - b!.from)[0]
    if (next && next.from - age <= 2) {
      status = 'approaching'
      statusLabel = `Approaching ${next.label} (${next.from}–${next.to})`
    } else if (next) {
      statusLabel = `Next: ${next.label} (${next.from}–${next.to})`
    } else {
      statusLabel = 'Primary lock/release windows passed'
    }
  }

  return {
    grahaId: 'Sa',
    grahaName: GRAHA_NAMES.Sa,
    kind: 'saturn_karma_lock',
    title: 'Karma Lock & Release',
    theme: 'Stuck periods → destiny doors open or close',
    cyclePeriod: '3 locks · 3 releases in life',
    status,
    statusLabel,
    summary:
      'Saturn locks karma three times and releases it three times. Lock means being stuck in one place — progress is blocked until inner faults (dosha) are corrected. In release years, destiny / luck / fortune’s door opens or closes on its own. No remedy, puja, or upay changes these windows.',
    phases: [
      {
        label: 'Lock',
        description: 'Stuck; blocked from moving forward until inner dosha is corrected.',
      },
      {
        label: 'Between lock & release',
        description: 'Life pattern, mindset, and activities change — even over small things.',
      },
      {
        label: 'Release',
        description: 'Destiny door opens automatically — or closes automatically.',
      },
    ],
    windows: [
      ...SATURN_LOCKS.map(w => ({
        label: w.label,
        ages: `${w.from}–${w.to}`,
        kind: 'lock' as const,
        active: inRange(age, w.from, w.to),
      })),
      ...SATURN_RELEASES.map(w => ({
        label: w.label,
        ages: `${w.from}–${w.to}`,
        kind: 'release' as const,
        active: inRange(age, w.from, w.to),
      })),
    ],
    manifestations: [
      'No remedy, puja, or upay overrides these windows',
      'Lock purpose: correct inner faults before progress',
      'Between windows: change patterns even in small matters',
      'Release experiences can be good or tough — the door still moves',
    ],
    natalNotes: [
      `Saturn in ${g ? RASHI_NAMES[g.rashi] : '—'} · ${g ? NAKSHATRA_NAMES[g.nakshatraIndex] : '—'}`,
    ],
    insight: CORE_INSIGHT,
  }
}

// ── Rahu: Magnetic field — only three attractions ────────────

function rahuCycle(g: GrahaData | undefined): PlanetaryEnergyCycle {
  return {
    grahaId: 'Ra',
    grahaName: GRAHA_NAMES.Ra,
    kind: 'rahu_magnetic',
    title: 'Magnetic Field',
    theme: 'Three attractions → identity distortion → tapasya',
    cyclePeriod: 'Continuous',
    status: 'continuous',
    statusLabel: 'Always operating',
    summary:
      'Rahu’s magnetic field attracts toward only three things: what you do not get; what you should not get; and what does not stay after you get it. There is no fourth. This reflects as identity distortion — Rahu breaks identity again and again, and ultimately leads toward tapasya. Do not dismiss Rahu as “only malefic”; you cannot manage without it.',
    phases: [
      { label: 'Unattainable', description: 'Attracts toward what you do not get.' },
      { label: 'Not meant for you', description: 'Attracts toward what you should not get.' },
      { label: 'Does not stay', description: 'Attracts toward what will not last after gaining it.' },
    ],
    windows: [
      { label: 'Magnetic field', ages: 'Lifelong', kind: 'cycle', active: true },
    ],
    manifestations: [
      'Identity breaks and rebuilds repeatedly',
      'Ultimate direction: tapasya',
      'Not “only malefic” — essential to the native’s path',
    ],
    natalNotes: [
      `Rahu in ${g ? RASHI_NAMES[g.rashi] : '—'} · ${g ? NAKSHATRA_NAMES[g.nakshatraIndex] : '—'}`,
    ],
    insight: CORE_INSIGHT,
  }
}

// ── Ketu: Past-life threads every 7 years · three faces ───────

function ketuCycle(age: number, g: GrahaData | undefined): PlanetaryEnergyCycle {
  const hit = age > 0 && age % 7 === 0
  const approaching = !hit && age % 7 >= 5
  const next = nextMultiple(age, 7)

  let status: EnergyCycleStatus = 'dormant'
  let statusLabel = `Next surfacing at age ${next}`
  if (hit) {
    status = 'active'
    statusLabel = '7-year surfacing active'
  } else if (approaching) {
    status = 'approaching'
    statusLabel = `Surfacing near age ${next}`
  }

  return {
    grahaId: 'Ke',
    grahaName: GRAHA_NAMES.Ke,
    kind: 'ketu_past_life',
    title: 'Past-Life Surfacing',
    theme: 'Confusion · Isolation · Realization',
    cyclePeriod: 'Every 7 years',
    status,
    statusLabel,
    summary:
      'Ketu stays tied to past-life connection. Every 7 years it brings incomplete tasks, incomplete relationships, and unfulfilled desires to the surface. The process moves through three faces — confusion, isolation, and realization — regardless of which dasha is running.',
    phases: [
      { label: 'Confusion', description: 'Incomplete threads blur direction.' },
      { label: 'Isolation', description: 'Withdrawal while past material is processed.' },
      { label: 'Realization', description: 'Meaning and detachment crystallize.' },
    ],
    windows: [
      {
        label: 'Surfacing cycle',
        ages: 'Every 7 years',
        kind: 'cycle',
        active: hit,
      },
    ],
    manifestations: [
      'Incomplete work resurfaces',
      'Incomplete relationships return',
      'Unfulfilled desires and past-life links appear',
      'Three faces appear across the process — not as fixed year-slices',
    ],
    natalNotes: [
      `Ketu in ${g ? RASHI_NAMES[g.rashi] : '—'} · ${g ? NAKSHATRA_NAMES[g.nakshatraIndex] : '—'}`,
      `Next 7-year mark: age ${hit ? age + 7 : next}`,
    ],
    insight: CORE_INSIGHT,
  }
}

/**
 * Personalized planetary energy-form readouts for a chart.
 * Faithful to the air-sign / cycles satsang teaching.
 */
export function computePlanetaryEnergyCycles(
  grahas: GrahaData[],
  birthDate: string,
  asOf: Date = new Date(),
): PlanetaryEnergyCyclesResult {
  const age = ageFromBirthDate(birthDate, asOf)
  const classic = grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))

  const cycles: PlanetaryEnergyCycle[] = ORDER.map(id => {
    switch (id) {
      case 'Su': return sunCycle(age, findGraha(classic, 'Su'))
      case 'Mo': return moonCycle(age, findGraha(classic, 'Mo'))
      case 'Ma': return marsCycle(findGraha(classic, 'Ma'))
      case 'Me': return mercuryCycle(findGraha(classic, 'Me'))
      case 'Ju': return jupiterCycle(age, findGraha(classic, 'Ju'))
      case 'Ve': return venusCycle(findGraha(classic, 'Ve'))
      case 'Sa': return saturnCycle(age, findGraha(classic, 'Sa'))
      case 'Ra': return rahuCycle(findGraha(classic, 'Ra'))
      case 'Ke': return ketuCycle(age, findGraha(classic, 'Ke'))
      default: return null
    }
  }).filter((c): c is PlanetaryEnergyCycle => c != null)

  return {
    age,
    birthDate,
    asOf: asOf.toISOString().slice(0, 10),
    cycles,
    insight: CORE_INSIGHT,
  }
}

/** Compact cycle blurb for a single planet card. */
export function getPlanetEnergyTeaser(
  grahaId: GrahaId,
  grahas: GrahaData[],
  birthDate: string,
  asOf?: Date,
): PlanetaryEnergyCycle | null {
  const result = computePlanetaryEnergyCycles(grahas, birthDate, asOf)
  return result.cycles.find(c => c.grahaId === grahaId) ?? null
}
