// src/lib/engine/jayaBhava.ts
// Jaya Bhava — 7th-house marriage reading applied to one chart.
// Social types in the shlokas are read as partnership patterns.
// A single line is a tendency. Events need Navamsha and dasha as well.
// Pure engine — no React/DB.

import type { ChartOutput, Dignity, Gender, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { D9 } from '@/lib/engine/vargas'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'

export interface JayaFlags {
  dignifiedLord: boolean
  dusthanaUndignified: boolean
  goldStandard: boolean
  weakLord: boolean
  lossSpectrum: boolean
  siege: boolean
  earliestYear: number | null
  latestYear: number | null
}

export interface JayaBhavaReading {
  headline: string
  summary: string
  principles: string
  lord: MarriedLifeNote[]
  occupants: MarriedLifeNote[]
  dynamics: MarriedLifeNote[]
  multiplicity: MarriedLifeNote[]
  timing: MarriedLifeNote[]
  strain: MarriedLifeNote[]
  flags: JayaFlags
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const MALEFIC = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
const DUSTHANA = new Set([6, 8, 12])
const DUAL = new Set([3, 6, 9, 12])
const BENEFIC_SIGNS = new Set([2, 3, 4, 6, 7, 9, 12])
const SATURN_SIGNS = new Set([10, 11])
const VENUS_SIGNS = new Set([2, 7])
/** Lagnas whose 7th is naturally ruled by Mars or Saturn. */
const NATURAL_MA_SA = new Set([2, 4, 5, 7])

const DIGNIFIED: Dignity[] = ['exalted', 'moolatrikona', 'own']

export const JAYA_PRINCIPLES =
  'The 7th is read as a mirror of the 1st. Dignity of the 7th lord outweighs the house it sits in. A 6th, 8th, or 12th seat is a developmental program — service, transformation, or sacrifice — not a punishment. Venus and Jupiter still have to be read on their own. Confirm a strong line in Navamsha and in dasha before treating it as an event. Ages are relative markers from an era of early marriage; a chart marked early marries earlier than one marked late.'

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function signOf(asc: number, house: number): Rashi {
  return ((((asc - 1 + house - 1) % 12) + 1) as Rashi)
}

function nthFrom(sign: number, count: number): Rashi {
  return ((((sign - 1 + count - 1) % 12) + 1) as Rashi)
}

function rn(r: number): string {
  return RASHI_NAMES[r as Rashi] ?? `R${r}`
}

function gn(id: GrahaId): string {
  return GRAHA_NAMES[id] ?? id
}

function find(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.grahas.find(g => g.id === id)
}

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

function partner(gender: Gender | undefined): string {
  if (gender === 'male') return 'wife'
  if (gender === 'female') return 'husband'
  return 'partner'
}

function dignified(d: Dignity | undefined): boolean {
  return !!d && DIGNIFIED.includes(d)
}

function enemySign(d: Dignity | undefined): boolean {
  return d === 'enemy' || d === 'great_enemy'
}

function weakDignity(g: GrahaData | undefined): boolean {
  if (!g) return true
  return g.dignity === 'debilitated' || enemySign(g.dignity) || !!g.isCombust
}

function aspects(source: GrahaData, targetSign: number): boolean {
  if (source.rashi === targetSign) return false
  const diff = ((targetSign - source.rashi + 12) % 12) + 1
  if (diff === 7) return true
  if (source.id === 'Ma' && (diff === 4 || diff === 8)) return true
  if (source.id === 'Ju' && (diff === 5 || diff === 9)) return true
  if (source.id === 'Sa' && (diff === 3 || diff === 10)) return true
  return false
}

function isBenefic(g: GrahaData, chart: ChartOutput): boolean {
  if (g.id === 'Ju' || g.id === 'Ve') return true
  if (g.id === 'Mo') return g.isWaxingMoon === true
  if (g.id === 'Me') {
    return !chart.grahas.some(o => o.id !== 'Me' && o.rashi === g.rashi && MALEFIC.has(o.id))
  }
  return false
}

function joinedOrSeenByBenefic(target: GrahaData, chart: ChartOutput): boolean {
  return chart.grahas.some(g => {
    if (g.id === target.id || !isBenefic(g, chart)) return false
    return g.rashi === target.rashi || aspects(g, target.rashi)
  })
}

function maleficsWith(target: GrahaData, chart: ChartOutput): GrahaData[] {
  return chart.grahas.filter(g => g.id !== target.id && g.rashi === target.rashi && MALEFIC.has(g.id))
}

function d9RashiOf(chart: ChartOutput, g: GrahaData): Rashi | null {
  const fromVarga = chart.vargas?.D9?.find(x => x.id === g.id)
  if (fromVarga) return fromVarga.rashi
  if (typeof g.lonSidereal === 'number' && Number.isFinite(g.lonSidereal)) {
    return D9(g.lonSidereal) as Rashi
  }
  return null
}

function waxing(moon: GrahaData | undefined, sun: GrahaData | undefined): boolean | null {
  if (!moon) return null
  if (typeof moon.isWaxingMoon === 'boolean') return moon.isWaxingMoon
  if (typeof moon.lonSidereal === 'number' && sun && typeof sun.lonSidereal === 'number') {
    return ((moon.lonSidereal - sun.lonSidereal + 360) % 360) < 180
  }
  return null
}

const MOON_SIGN_TEXTURE: Record<number, string> = {
  1: 'The bond is direct and self-starting.',
  2: 'The bond wants steadiness and a sensual, unhurried pace.',
  3: 'The partner is communicative and adapts the relationship to the room they are in.',
  4: 'The marriage feels like a household: nurture, food, and private feeling come first.',
  5: 'The partnership is visible. Pride and recognition sit inside it.',
  6: 'The partner is exacting and not yet settled; the bond is improved by work, not by display.',
  7: 'The marriage is socially polished and lives partly in public view.',
  8: 'The bond is private and intense. Little stays on the surface.',
  9: 'The partner brings a belief system, a teacher, or a horizon beyond the house.',
  10: 'Duty and status organize the marriage more than romance does.',
  11: 'The partner is unconventional and friendly; the bond includes a circle, not only a couple.',
  12: 'The boundary between the two is thin: devotion, imagination, or quiet withdrawal.',
}

const OCCUPANT: Partial<Record<GrahaId, { title: string; detail: string; tone: LifeTone }>> = {
  Su: {
    title: 'Sun in the 7th — status in the bond',
    detail: 'The partner comes with a recognizable standing, or the marriage itself is meant to be seen. Equality is the work: one identity can overshadow the other. The draw is toward dignity and a public shape for the couple, more than toward a hidden romance.',
    tone: 'mixed',
  },
  Ma: {
    title: 'Mars in the 7th — heat',
    detail: 'Attraction arrives fast and through the body. Chemistry is strong, decisions get made at a high pitch, and the same heat that bonds the couple can scorch the peace if it is the only language they have. Arguments and reconciliations both run hot. Nothing in this placement is lukewarm.',
    tone: 'mixed',
  },
  Me: {
    title: 'Mercury in the 7th — the negotiating bond',
    detail: 'The partner is articulate, socially mobile, and practical. Wit does as much of the attracting as appearance. The relationship has an exchange in it: what each person brings, and what each person needs back. Charm here is social intelligence. It is easy to misread as flirtation.',
    tone: 'mixed',
  },
  Ju: {
    title: 'Jupiter in the 7th — dharma and generation',
    detail: 'The partner is read through ethics, education, and counsel. The bond wants to produce something: a child, a body of work, a standard the two can teach. Jupiter can go toward a principled marriage or toward a morally tangled one. Dignity and the company Jupiter keeps decide which way.',
    tone: 'mixed',
  },
  Ve: {
    title: 'Venus in the 7th — a rich bond',
    detail: 'Beauty, romance, and sensual generosity dominate how the partnership sustains the person. The standard is high on every register at once: peace, feeling, and chemistry. A plain or careless bond feels like a loss even when nothing is “wrong.”',
    tone: 'mixed',
  },
  Sa: {
    title: 'Saturn in the 7th — a closed gate',
    detail: 'The partnership does not yield on demand. Intimacy is slow, marriage is often late, and duty carries more of the bond than warmth does. That is a closed system, not a fertility verdict. The lesson is whether nourishment can be built by patience when it is not given freely. The draw is toward reliability more than vitality.',
    tone: 'caution',
  },
  Ra: {
    title: 'Rahu in the 7th — an unconventional match',
    detail: 'The partnership sits outside the expected social frame, or it blooms larger than the reality underneath it. Attraction is amplified. The risk is marrying an image. The 7th lord and Venus show whether the person still feels true once the fascination cools.',
    tone: 'caution',
  },
  Ke: {
    title: 'Ketu in the 7th — a bond already in progress',
    detail: 'The partnership carries residual karma: a feeling of having started before this life, or of arriving after the easy season. Detachment is structural. The work is to stay in contact without pretending the relationship has no needs.',
    tone: 'caution',
  },
}

function dusthanaCopy(house: number, spouse: string): string {
  if (house === 6) {
    return `The 7th lord in the 6th makes the marriage a service. One partner becomes the caretaker, effort does not stay optional, and the caretaker’s reserves are what get spent. That disturbance of ease is what classical texts call a sickly ${spouse}: the strain is emotional first. The 6th also looks toward loss, so the care can be used up.`
  }
  if (house === 8) {
    return `The 7th lord in the 8th makes marriage a transformation. The bond is karmically loud, the partner is emotionally deep, and the story turns on crises. Even a welcome change rubs. Shared money and the partner’s family resources move with this placement, because the 8th sees the 2nd.`
  }
  return `The 7th lord in the 12th asks for a real giving-up: distance, a foreign chapter, or a marriage aimed past domestic comfort. The line between self and partner either thins into a genuine union or into a loss of outline. That sacrifice feeds back into health and daily struggle, because the 12th sees the 6th.`
}

function venusMaleficCopy(ids: GrahaId[]): string {
  const lines: string[] = []
  if (ids.includes('Sa')) lines.push('Saturn cools it: duty replaces warmth.')
  if (ids.includes('Ma')) lines.push('Mars agitates it: harmony gives way to contest.')
  if (ids.includes('Ra')) lines.push('Rahu clouds it: the bond can become an image, an obsession, or a performance.')
  if (ids.includes('Ke')) lines.push('Ketu thins it: feeling steps back, and the relationship is treated as something already finished.')
  if (ids.includes('Su')) lines.push('The Sun unbalances it: one ego sets the terms.')
  return lines.join(' ')
}

function nurtureLine(id: GrahaId): string | null {
  if (id === 'Ma') return 'Mars adds an immediate physical pull. The person is drawn before they have a theory of the partner.'
  if (id === 'Sa') return 'Saturn’s way of sustaining a bond is stability with low vitality. The relationship underperforms as romance and overperforms as structure.'
  if (id === 'Ju') return 'Jupiter sustains by substance. The partner is impressive in wisdom or standing, and the couple is visible for that reason.'
  if (id === 'Ve') return 'Venus sustains by abundance. Romance and sensual ease are how the bond feeds the person.'
  return null
}

/**
 * Seventh-house combinations that this chart actually forms.
 * Returns null when the ascendant is missing.
 */
export function analyzeJayaBhava(chart: ChartOutput): JayaBhavaReading | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return null

  const gender = chart.meta?.gender
  const spouse = partner(gender)
  const seventhSign = signOf(asc, 7)
  const lordId = LORDS[seventhSign]
  const lord = find(chart, lordId)
  const lordHouse = lord ? houseOf(lord.rashi, asc) : null
  const lagnaId = LORDS[asc]
  const lagnaLord = find(chart, lagnaId)
  const lagnaHouse = lagnaLord ? houseOf(lagnaLord.rashi, asc) : null

  const venus = find(chart, 'Ve')
  const jupiter = find(chart, 'Ju')
  const mars = find(chart, 'Ma')
  const saturn = find(chart, 'Sa')
  const moon = find(chart, 'Mo')
  const sun = find(chart, 'Su')
  const mercury = find(chart, 'Me')
  const rahu = find(chart, 'Ra')

  const in7 = chart.grahas.filter(g => houseOf(g.rashi, asc) === 7)
  const lordDignified = !!lord && dignified(lord.dignity)
  const lordWeak = !!lord && weakDignity(lord)
  const lordDusthana = lordHouse != null && DUSTHANA.has(lordHouse)

  const lordNotes: MarriedLifeNote[] = []
  const occupantNotes: MarriedLifeNote[] = []
  const dynamicNotes: MarriedLifeNote[] = []
  const multiNotes: MarriedLifeNote[] = []
  const timingNotes: MarriedLifeNote[] = []
  const strainNotes: MarriedLifeNote[] = []
  const years: number[] = []

  if (lord && lordHouse != null) {
    const seat = `${gn(lord.id)} rules the 7th (${rn(seventhSign)}) from ${rn(lord.rashi)}, house ${lordHouse}`
    if (lordDignified && !lord.isCombust) {
      lordNotes.push(note(
        'bphs-19-1',
        'Full happiness through the partner',
        `${seat}, in ${lord.dignity === 'exalted' ? 'exaltation' : 'its own strength'}. This is the gold-standard seat for partnership. The bond can carry intimacy, respect, and a shared direction at the same time. Full happiness here means the two can meet trouble together. It does not mean a life with no trouble.`,
        'supportive',
      ))
    } else if (lordDignified && lord.isCombust) {
      lordNotes.push(note(
        'bphs-19-1',
        'Dignified 7th lord, under combustion',
        `${seat}. Own sign or exaltation is still the happiness benchmark, and combustion drains it. The capacity is there. The expression is scorched until the Sun’s pressure eases.`,
        'mixed',
      ))
    } else if (lordDusthana) {
      lordNotes.push(note(
        'bphs-19-2',
        `7th lord in the ${ordinal(lordHouse)} — development, not ease`,
        `${seat}, without own sign or exaltation. ${dusthanaCopy(lordHouse, spouse)} The classical term Rogini here means a disturbance of the partner’s ease: emotional strain, psychological load, or a bond that wears the person down. It is not a finding that the ${spouse} is physically ill. If this lord later gains strength, the same house becomes workable. Strength overrides the house.`,
        'caution',
      ))
    } else {
      lordNotes.push(note(
        'bphs-19-lord',
        `7th lord in the ${ordinal(lordHouse)}`,
        `${seat}. This is neither the full-happiness benchmark nor the 6th, 8th, or 12th developmental seat. Continuity depends on dignity, on who occupies the 7th, and on the dasha that opens the marriage.`,
        lordWeak ? 'caution' : 'mixed',
      ))
    }

    if (lordDusthana && lordDignified) {
      lordNotes.push(note(
        'bphs-19-2-override',
        'Dignity overrides the difficult house',
        `${dusthanaCopy(lordHouse, spouse)} Because the lord is dignified, that pressure stays manageable. The marriage is still aimed at ${lordHouse === 6 ? 'service' : lordHouse === 8 ? 'change' : 'renunciation'}, and the strength makes the aim constructive.`,
        'mixed',
      ))
    }
  }

  const lordCapable = !!lord && (lordDignified || lord.dignity === 'friend' || lord.dignity === 'great_friend') && !lord.isCombust
  if (lord && lordCapable && joinedOrSeenByBenefic(lord, chart)) {
    lordNotes.push(note(
      'bphs-19-4',
      'A strong 7th lord with benefics',
      'A capable 7th lord joined or seen by a benefic ties the marriage to the rest of life. The classical fruit is wealth, honor, contentment, and a fortunate match: the relationship enriches experience, raises the person’s standing, and feels like the right person at a workable time. The 7th is the mirror of the 1st. A clear mirror gives the life a clearer shape.',
      'supportive',
    ))
  }

  if (lord && lordWeak && !(lordDusthana && !lordDignified)) {
    lordNotes.push(note(
      'bphs-19-5',
      'A weak 7th lord scatters the bond',
      `The 7th lord is ${lord.isCombust ? 'combust' : lord.dignity === 'debilitated' ? 'debilitated' : 'in a hostile sign'}. It cannot pour the whole relationship into one channel. The life then holds several heavy bonds at once — a spouse plus a mentor, a colleague, a friend — each legitimate, each costly. Several marriages in fact need a separating dasha, a second-marriage yoga, and Navamsha agreement. Until those agree, read dispersal of attention, and a ${spouse} who carries more strain than ease.`,
      'caution',
    ))
  }

  if (lord && (lord.dignity === 'exalted' || (joinedOrSeenByBenefic(lord, chart) && (SATURN_SIGNS.has(lord.rashi) || VENUS_SIGNS.has(lord.rashi))))) {
    const why = lord.dignity === 'exalted'
      ? 'Exaltation is the maximum of this energy. It attracts more than one possible partner.'
      : SATURN_SIGNS.has(lord.rashi)
        ? 'In Saturn’s sign the person treats more than one bond with real gravity: sequential commitments, each taken seriously.'
        : 'In Venus’s sign the person is drawn to more than one kind of beauty and more than one tone of closeness.'
    lordNotes.push(note(
      'bphs-19-6',
      'Even a strong 7th tends toward more than one bond',
      `${why} At full strength this reads as many possibilities in partnership. Whether they become several marriages depends on the rest of the chart. The work is to choose one commitment and let the surplus become depth, not a second household.`,
      'mixed',
    ))
  }

  if (venus && houseOf(venus.rashi, asc) === 7) {
    lordNotes.push(note(
      'bphs-19-3',
      'Venus in the 7th — desire at full volume',
      'Venus in the 7th intensifies wanting on every register of partnership: beauty, emotional contact, romance, and the senses. The person does not want a tolerable match. They want a refined one, and a small miss can feel disproportionate. That hunger is larger than sex. A relationship that is only practical will feel empty.',
      'mixed',
    ))
  }

  if (venus) {
    const mals = maleficsWith(venus, chart)
    if (mals.length) {
      lordNotes.push(note(
        'bphs-19-3b',
        'Venus with a malefic — the Venusian quality is what comes under pressure',
        `Venus is with ${mals.map(g => gn(g.id)).join(' and ')}. The strongest traditional reading is a serious loss in the marriage. In most charts what suffers first is the warmth and pleasure of the marriage, and only a stack of afflictions together with the Navamsha and dasha would push that toward a hard ending. This does not indicate a death. ${venusMaleficCopy(mals.map(g => g.id))}`,
        'caution',
      ))
    }
  }

  if (in7.length) {
    occupantNotes.push(note(
      'bphs-19-7-frame',
      'A planet in the 7th colors the marriage',
      'The closed bond, the trader’s wit, and the teacher’s spouse are patterns of the relationship. They are not a character verdict on the person who will marry this native. An occupied 7th makes the sexual and social bond less simple. Read the pattern, then check Navamsha.',
      'mixed',
    ))
  }

  for (const g of in7) {
    if (g.id === 'Mo') {
      occupantNotes.push(note(
        'bphs-19-7-mo',
        'Moon in the 7th — an emotionally matched bond',
        `The partner lines up with the native’s feeling and background. The marriage can feel like coming home. The 7th is ${rn(seventhSign)}. ${MOON_SIGN_TEXTURE[seventhSign] ?? ''} Emotional weather in the home becomes the native’s own weather.`,
        'mixed',
      ))
      continue
    }
    const row = OCCUPANT[g.id]
    if (!row) continue
    const extra = nurtureLine(g.id)
    occupantNotes.push(note(
      `bphs-19-7-${g.id}`,
      row.title,
      extra && g.id !== 'Ve' && g.id !== 'Sa' ? `${row.detail} ${extra}` : row.detail,
      row.tone,
    ))
  }

  const moonPhase = waxing(moon, sun)
  const maleficIn7 = in7.some(g => MALEFIC.has(g.id))
  const maleficIn12 = chart.grahas.some(g => houseOf(g.rashi, asc) === 12 && MALEFIC.has(g.id))
  const moonIn5 = !!moon && houseOf(moon.rashi, asc) === 5
  if (maleficIn7 && maleficIn12 && moonIn5 && moonPhase === false) {
    dynamicNotes.push(note(
      'bphs-19-10',
      'The partner’s will outweighs the native’s',
      'A waning Moon in the 5th leaves little creative independence in emotional trouble. Malefics in the 7th harden the partnership, and malefics in the 12th make surrender the reflex. Together the native is run by the spouse, and the spouse’s values pull against the birth family. The central tension is a split loyalty: partner on one side, family on the other.',
      'caution',
    ))
  }

  const marsOn7 = !!mars && (houseOf(mars.rashi, asc) === 7 || aspects(mars, seventhSign) || lordId === 'Ma')
  const saturnOn7 = !!saturn && (houseOf(saturn.rashi, asc) === 7 || aspects(saturn, seventhSign) || lordId === 'Sa')
  if (marsOn7 && saturnOn7 && mars && saturn) {
    const bothPresent = houseOf(mars.rashi, asc) === 7 && houseOf(saturn.rashi, asc) === 7
    const otherIn7 = (lordId === 'Sa' && houseOf(mars.rashi, asc) === 7)
      || (lordId === 'Ma' && houseOf(saturn.rashi, asc) === 7)
    const severe = bothPresent || otherIn7 || lordWeak || in7.filter(g => g.id === 'Ra' || g.id === 'Ke' || g.id === 'Su').length > 0
    const natural = NATURAL_MA_SA.has(asc)
    if (natural && !severe) {
      dynamicNotes.push(note(
        'bphs-19-11-guard',
        'Mars and Saturn rule this 7th by lagna — do not force the harsh line',
        'Taurus, Cancer, Leo, and Libra already give the 7th to Mars or Saturn. The classical warning about an unbound spouse does not apply from that fact alone. It needs a further affliction: both planets in the 7th, a weak 7th lord, or a second malefic piled on the house.',
        'mixed',
      ))
    } else {
      dynamicNotes.push(note(
        'bphs-19-11',
        'Saturn tightens the bond, Mars pushes out of it',
        `${natural ? 'This lagna already gives the 7th to Mars or Saturn, and a further affliction is present. ' : ''}Saturn restricts the partnership. Mars wants heat and a separate will. The partner can feel hemmed in and then seek intensity outside the frame the native expected — a close friendship, a private life, a refusal to be managed. Classical texts word this severely. Read it as strong independence under pressure, not as misconduct. This line alone does not indicate it.`,
        'caution',
      ))
    }
  }

  if (venus && mars) {
    const veD9 = d9RashiOf(chart, venus)
    const marsSign = venus.rashi === 1 || venus.rashi === 8
    const marsNav = veD9 === 1 || veD9 === 8
    const linked = marsSign || marsNav || venus.rashi === mars.rashi || aspects(mars, venus.rashi)
    if (linked) {
      dynamicNotes.push(note(
        'bphs-19-12',
        'Venus tied to Mars — intimacy runs hot',
        'Desire is steered by instinct. The person wants a complete physical bond and is poorly matched with a partner who stays polite and partial. Frustration here is a mismatch of intensity, so openly talking about needs and pace helps.',
        'mixed',
      ))
    }
  }

  if (venus && saturn) {
    const veD9 = d9RashiOf(chart, venus)
    const satSign = venus.rashi === 10 || venus.rashi === 11
    const satNav = veD9 === 10 || veD9 === 11
    const linked = satSign || satNav || venus.rashi === saturn.rashi || aspects(saturn, venus.rashi)
    if (linked) {
      dynamicNotes.push(note(
        'bphs-19-13',
        'Venus tied to Saturn — desire is delayed or fenced',
        'Saturn restricts, postpones, or reroutes Venus. Intimacy may need unusual privacy, a long runway, or a structure the person can control. Performance anxiety and a late start belong to this pattern. Difference is not a defect, and this says nothing about orientation. Closeness is possible once the person can name the conditions under which it feels safe.',
        'mixed',
      ))
    }
  }

  const beneficIn7 = in7.some(g => isBenefic(g, chart))
  const lagnaStrongIn7 = !!lagnaLord && lagnaHouse === 7 && dignified(lagnaLord.dignity) && !lagnaLord.isCombust
  if (lordDignified && beneficIn7 && lagnaStrongIn7) {
    dynamicNotes.push(note(
      'bphs-19-14',
      'The best-case partnership pattern',
      `Three conditions meet: the 7th lord is dignified, a benefic occupies the 7th, and a strong ${gn(lagnaId)} sits in the 7th. The ${spouse} is then read as virtuous in the sense that the marriage brings out the better self, and as generative: children, work, and a lineage of effort, not a single event. A weak lagna lord could not have sustained this. The mirror only reflects what stands in front of it.`,
      'supportive',
    ))
  }

  const lordMalefic = !!lord && maleficsWith(lord, chart).length > 0
  const marriageAfflicted = (maleficIn7 && lordMalefic) || ((maleficIn7 || lordMalefic) && lordWeak)
  if (marriageAfflicted) {
    const mild = lordDignified && !lordWeak
    dynamicNotes.push(note(
      'bphs-19-16',
      mild ? 'Malefics touch a strong 7th' : 'Malefics on a weak marriage signature',
      mild
        ? 'A malefic joins the 7th or its lord, and the lord still has strength. This points to a mild loss of ease: friction, a thinner romance, a season of distance. It does not by itself indicate the marriage ending.'
        : 'A malefic joins the 7th or its lord, and strength is missing. The spectrum runs from a hollow marriage, to a long separation, and, rarely, a serious loss. The far end needs Navamsha, a confirming dasha, and no benefic rescue, and it is not indicated by this line alone. The more common effect is that a person can lose their own outline inside the bond.',
      mild ? 'mixed' : 'caution',
    ))
  }

  if (lord && lordDusthana && lordWeak) {
    const kind = lordHouse === 6
      ? 'In the 6th with no strength, marriage becomes unpaid labor. The person may eventually want out of the service.'
      : lordHouse === 8
        ? 'In the 8th with no strength, the change is forced. Crisis rewrites both people.'
        : 'In the 12th with no strength, the bond dissolves by distance or by becoming a marriage in name.'
    dynamicNotes.push(note(
      'bphs-19-17',
      'A weak 7th lord in a developmental house',
      `${kind} The house still describes a curriculum. Debility means the curriculum arrives as pain rather than as a chosen discipline. Growth is available. Ease is not the design.`,
      'caution',
    ))
  } else if (lord?.dignity === 'debilitated' && !lordDusthana) {
    dynamicNotes.push(note(
      'bphs-19-17b',
      '7th lord debilitated',
      'Debility of the 7th lord is the classical mark for a marriage that cannot hold its shape. The bond is not denied. It is denied comfort, and it breaks or empties when the dasha agrees. A benefic influence or another cancelling factor on the 7th lord can ease this considerably.',
      'caution',
    ))
  }

  const karaka = gender === 'female' ? jupiter ?? venus : venus
  const karakaWeak = !karaka || weakDignity(karaka) || (!!karaka && DUSTHANA.has(houseOf(karaka.rashi, asc)))
  if (moon && houseOf(moon.rashi, asc) === 7 && lordHouse === 12 && karakaWeak) {
    const phase = waxing(moon, sun)
    const base = `The Moon in the 7th ties peace of mind to the marriage. The 7th lord in the 12th spends that marriage on distance and giving-up. ${karaka ? gn(karaka.id) : 'The marriage significator'} is too weak to repair the gap.`
    dynamicNotes.push(note(
      'bphs-19-18',
      phase === true ? 'A waxing Moon softens the denial of marital ease' : 'Need without a working mechanism',
      phase === true
        ? `${base} Classical texts apply the full denial of marital happiness to a waning Moon. This Moon is waxing, so the adversity is mitigated: the need is still there, and the mechanism is still thin, but the chart is not read as a marriage without happiness.`
        : `${base} The person needs a partner and is poorly built to sustain one. The lived experience is “I give everything and I am not met,” not “the spouse is the defect.” Strengthen the Moon’s emotional skill, make peace with the 12th, and support Venus or Jupiter. Blaming a sequence of partners misses the chart. ${phase === false ? 'The Moon is waning, which is the classical condition for the full reading.' : 'Classical texts reserve the full denial for a waning Moon. The Moon’s phase is not available for this chart, so the far end stays open.'}`,
      phase === true ? 'mixed' : 'caution',
    ))
  }

  const lordD9 = lord ? d9RashiOf(chart, lord) : null
  const kliba = DUAL.has(seventhSign) || (lordD9 != null && DUAL.has(lordD9))
  if (lord?.dignity === 'debilitated' && maleficsWith(lord, chart).length > 0 && kliba) {
    multiNotes.push(note(
      'bphs-19-19',
      'Two partnership chapters',
      'The 7th lord is debilitated, joined to a malefic, and the 7th carries a dual sign or a dual navamsha. The life can divide into two partnership eras: a second partnership, or one marriage that becomes a different marriage halfway through. The person’s own picture of a partner can stay unclear. Weakness plus ambiguity is why the energy may not settle into one story.',
      'caution',
    ))
  }

  const marsVenusIn7 = !!mars && !!venus && houseOf(mars.rashi, asc) === 7 && houseOf(venus.rashi, asc) === 7
  const saturnAspect7 = !!saturn && (houseOf(saturn.rashi, asc) === 7 || aspects(saturn, seventhSign))
  if (lagnaHouse === 8 && (marsVenusIn7 || saturnAspect7)) {
    multiNotes.push(note(
      'bphs-19-20',
      'The spouse meets more than one version of this person',
      `${marsVenusIn7 ? 'Mars and Venus together in the 7th ask for heat and beauty at the same time. ' : 'Saturn’s pressure on the 7th keeps testing the bond. '}The lagna lord in the 8th means the native’s identity itself changes. Across a long marriage the partner can feel they have lived with successive people: first the attraction, then the crisis, then whatever stability the 8th allows. “Several spouses” here is several selves.`,
      'mixed',
    ))
  }

  if (venus && venus.dignity === 'exalted' && DUAL.has(venus.rashi)) {
    const signLord = find(chart, LORDS[venus.rashi])
    const withLord = !!signLord && (signLord.id === 'Ve' || signLord.rashi === venus.rashi)
    const lagnaStrong = !!lagnaLord && dignified(lagnaLord.dignity) && !lagnaLord.isCombust
    if (withLord && lagnaStrong) {
      multiNotes.push(note(
        'bphs-19-21',
        'Many openings, from strength',
        'Venus is exalted in a dual sign and with its sign lord, and the lagna lord is strong. This is the generous reading of “many spouses”: charm and relational intelligence draw several real possibilities. The karma is to conduct that surplus into one commitment. A strong 7th lord can do that. A weak one cannot, and then the possibilities become successive bonds.',
        'supportive',
      ))
    }
  }

  const pushYears = (id: string, title: string, detail: string, pair: [number, number] | [number], tone: LifeTone = 'mixed') => {
    years.push(...pair)
    const label = pair.length === 2 ? `${ordinal(pair[0])} or ${ordinal(pair[1])}` : ordinal(pair[0])
    timingNotes.push(note(
      id,
      title,
      `This timing mark sits at the ${label} year. Treat the number as an early-marriage-era marker. What travels is the order: this chart ripens ${pair[0] <= 16 ? 'early' : pair[0] <= 22 ? 'on a middling schedule' : 'late'} relative to a chart with a different marker. ${detail}`,
      tone,
    ))
  }

  if (lord && BENEFIC_SIGNS.has(lord.rashi) && venus && dignified(venus.dignity)) {
    pushYears(
      'bphs-19-22',
      'Early marriage marker',
      'The 7th lord sits in a benefic sign and Venus is in its own strength or exaltation. Partnership is available before life has become heavy.',
      [5, 9],
      'supportive',
    )
  }

  if (sun && houseOf(sun.rashi, asc) === 7 && lord && venus && lord.id !== 'Ve' && lord.rashi === venus.rashi) {
    pushYears(
      'bphs-19-23',
      'Marriage with a public face',
      'The Sun occupies the 7th and the 7th lord joins Venus. The wedding is tied to status and to desire becoming official.',
      [7, 11],
    )
  }

  if (venus && houseOf(venus.rashi, asc) === 2 && lordHouse === 11) {
    pushYears(
      'bphs-19-24',
      'Marriage through family and gain',
      'Venus in the 2nd and the 7th lord in the 11th tie the wedding to household speech and to a visible social or material gain.',
      [10, 16],
    )
  }

  const venusKendra = !!venus && [1, 4, 7, 10].includes(houseOf(venus.rashi, asc))
  if (venusKendra && lagnaLord && SATURN_SIGNS.has(lagnaLord.rashi)) {
    pushYears(
      'bphs-19-25',
      'Saturn slows a well-placed Venus',
      'Venus is angular, and the lagna lord is in Saturn’s sign. Responsibility has to arrive before the marriage ripens.',
      [11],
    )
  }

  if (venusKendra && venus && saturn && nthFrom(venus.rashi, 7) === saturn.rashi) {
    pushYears(
      'bphs-19-26',
      'Saturn stands in front of Venus',
      'Saturn occupies the 7th from Venus, so the relationship Venus is walking toward is delayed on purpose.',
      [12, 19],
    )
  }

  if (venus && moon && saturn && nthFrom(moon.rashi, 7) === venus.rashi && nthFrom(venus.rashi, 7) === saturn.rashi) {
    pushYears(
      'bphs-19-27',
      'Both feeling and desire are slowed',
      'Venus is 7th from the Moon, and Saturn is 7th from Venus. Emotional maturity and relational maturity are both on Saturn’s clock.',
      [18],
    )
  }

  const secondLord = find(chart, LORDS[signOf(asc, 2)])
  const eleventhLord = find(chart, LORDS[signOf(asc, 11)])
  if (secondLord && houseOf(secondLord.rashi, asc) === 11 && lagnaHouse === 10) {
    pushYears(
      'bphs-19-28',
      'Work is scheduled before marriage',
      'The 2nd lord in the 11th and the lagna lord in the 10th put public effort ahead of the wedding.',
      [15],
    )
  }

  if (secondLord && eleventhLord && houseOf(secondLord.rashi, asc) === 11 && houseOf(eleventhLord.rashi, asc) === 2) {
    pushYears(
      'bphs-19-29',
      'Marriage through the social circle',
      'The 2nd and 11th lords exchange houses. Family speech and gains feed each other, and the match comes through that network.',
      [13],
      'supportive',
    )
  }

  const eighthLord = find(chart, LORDS[signOf(asc, 8)])
  if (venus && eighthLord && venus.rashi === nthFrom(eighthLord.rashi, 7) && lagnaLord && mars && lagnaLord.rashi === mars.rashi && lagnaLord.id !== 'Ma') {
    pushYears(
      'bphs-19-30',
      'Marriage after a personal change',
      'Venus stands 7th from the 8th lord, and the lagna lord is with Mars. The person has to be altered by crisis or courage before the marriage is ready.',
      [22, 27],
      'caution',
    )
  }

  const lagnaD9 = lagnaLord ? d9RashiOf(chart, lagnaLord) : null
  const d9Lagna = chart.vargaLagnas?.D9
  const lagnaInSeventhNav = (d9Lagna && lagnaD9 && houseOf(lagnaD9, d9Lagna) === 7)
    || (lagnaD9 != null && lagnaD9 === seventhSign)
  if (lagnaInSeventhNav && lordHouse === 12) {
    pushYears(
      'bphs-19-31',
      'A giving-up comes before the wedding',
      'The lagna lord falls in the spouse’s navamsha, and the 7th lord is in the 12th. Identity is already aimed at partnership. Marriage still waits on a sacrifice.',
      [23, 26],
    )
  }

  if (eighthLord && houseOf(eighthLord.rashi, asc) === 7 && venus && d9Lagna && d9RashiOf(chart, venus) === d9Lagna) {
    pushYears(
      'bphs-19-32',
      'A karmic marriage, later',
      'The 8th lord occupies the 7th, and Venus joins the Navamsha lagna. Transformation sits inside the partnership house. The wedding follows a long private ripening.',
      [25, 33],
      'mixed',
    )
  }

  const ninthLord = find(chart, LORDS[signOf(asc, 9)])
  if (venus && ninthLord && rahu && venus.rashi === nthFrom(ninthLord.rashi, 9) && rahu.rashi === nthFrom(ninthLord.rashi, 5)) {
    pushYears(
      'bphs-19-33',
      'A late and unusual match',
      'Venus is 9th from the 9th lord and Rahu is 5th from that lord. Fortune and obsession time the wedding. Cross-cultural, foreign, or plainly fated matches belong to this marker.',
      [31, 33],
      'mixed',
    )
  }

  if (venus && ninthLord && lord && venus.rashi === nthFrom(ninthLord.rashi, 7) && lordHouse === 3) {
    pushYears(
      'bphs-19-34',
      'The person has to go and ask',
      'Venus is 7th from the 9th lord, and the 7th lord is in the 3rd. Marriage is not delivered. It is sought, through courage, messages, and repeated effort.',
      [27, 30],
    )
  }

  if (timingNotes.length) {
    timingNotes.unshift(note(
      'bphs-19-timing-frame',
      'How to use these years',
      'These age markers assume a culture of very early marriage. Read the sequence of the markers rather than the literal birthday, and confirm any year with the dasha of the 7th lord, Venus, and Jupiter.',
      'mixed',
    ))
  }

  if (lord?.dignity === 'debilitated' && venus && [6, 8].includes(houseOf(venus.rashi, asc))) {
    years.push(18, 33)
    strainNotes.push(note(
      'bphs-19-35',
      'A breaking point near the 18th or 33rd marker',
      'The 7th lord is debilitated and Venus sits in the 6th or 8th. Relationship capacity and relationship circumstance are both weak. The classical “destruction” is a spectrum: a health crisis in the bond, a separation, or the moment the accumulated strain will not be carried quietly. It is not an automatic bereavement.',
      'caution',
    ))
  }

  const twelfthLord = find(chart, LORDS[signOf(asc, 12)])
  if (lordHouse === 8 && twelfthLord && houseOf(twelfthLord.rashi, asc) === 7) {
    years.push(19)
    strainNotes.push(note(
      'bphs-19-36',
      'Transformation in the marriage, loss inside the 7th',
      'The 7th lord is in the 8th and the 12th lord is in the 7th. The marriage is built to change the person, and the partnership house itself receives loss, distance, or a bill that comes due. The 19th-year marker is when that pattern is old enough to be visible. This marks a hard season, and a benefic influence on the chart can soften it.',
      'caution',
    ))
  }

  if (rahu && mars && houseOf(rahu.rashi, asc) === 2 && houseOf(mars.rashi, asc) === 7) {
    strainNotes.push(note(
      'bphs-19-37',
      'Toxicity immediately after the union',
      'Rahu in the 2nd contaminates family, speech, or money. Mars in the 7th puts heat in the marriage itself. The classical image is a sudden poisonous strike in the first days. In practice that is a secret, a family rupture, or a violent word that lands during the wedding period — not a literal animal bite. The damage is early. It does not wait for a long decline.',
      'caution',
    ))
  }

  const fourthLord = find(chart, LORDS[signOf(asc, 4)])
  if (venus && houseOf(venus.rashi, asc) === 4 && fourthLord && enemySign(fourthLord.dignity)) {
    years.push(12, 19)
    strainNotes.push(note(
      'bphs-19-38',
      'The home is what undermines the marriage',
      'Venus in the 4th puts desire inside the house. The 4th lord in an enemy sign means domestic peace does not hold. In-laws, property, or the simple absence of a feeling of home are the instruments. The markers fall at the 12th and 19th years of the classical count.',
      'caution',
    ))
  }

  if (lagnaLord?.dignity === 'debilitated' && secondLord && houseOf(secondLord.rashi, asc) === 8) {
    years.push(13)
    strainNotes.push(note(
      'bphs-19-39',
      'The native cannot hold the marriage up alone',
      'The lagna lord is debilitated, so personal stamina is low, and the 2nd lord in the 8th puts family support and money through a crisis. Without a self and without a household behind that self, the bond has nothing to lean on. The 13th-year marker is when that shortage becomes obvious.',
      'caution',
    ))
  }

  if (venus && moon && mercury && nthFrom(venus.rashi, 7) === moon.rashi && houseOf(mercury.rashi, asc) === 5) {
    years.push(10, 22, 33)
    multiNotes.push(note(
      'bphs-19-40',
      'Three relational chapters',
      'The Moon is 7th from Venus and Mercury is in the 5th. Three partnership eras are timed at the 10th, 22nd, and 33rd markers: an early innocent bond, a corrective bond, and a bond chosen with some wisdom. They are not always three legal weddings. They can be three distinct eras inside one long marriage, or one marriage plus two bonds that carried the weight of a marriage.',
      'mixed',
    ))
  }

  const siege = !!mars && !!rahu && !!saturn
    && houseOf(mars.rashi, asc) === 6
    && houseOf(rahu.rashi, asc) === 7
    && houseOf(saturn.rashi, asc) === 8
  if (siege) {
    strainNotes.push(note(
      'bphs-19-42',
      'Fight, illusion, then a hard aftermath',
      'Mars in the 6th is a combative way into relationships. Rahu in the 7th puts the partnership on an unstable or illusory footing. Saturn in the 8th makes the aftermath long. Classical severity marks the far end of a spectrum that also includes a painful collapse of the marriage, a depleted spouse, and a person who unknowingly repeats a pattern. It is a tendency, not a verdict. A benefic on the 7th lord or in the Navamsha eases it considerably.',
      'caution',
    ))
  }

  const lossSpectrum = strainNotes.length > 0 || dynamicNotes.some(n => n.id === 'bphs-19-16' || n.id === 'bphs-19-17' || n.id === 'bphs-19-18')
  const gold = dynamicNotes.some(n => n.id === 'bphs-19-14')
  const dusthanaUndignified = lordDusthana && !lordDignified

  let headline = 'Marriage-house reading'
  if (gold) headline = 'A high-standard partnership pattern'
  else if (siege) headline = 'The marriage house is under three-way pressure'
  else if (lordDignified && !lordWeak) headline = 'Full happiness through the partner is available'
  else if (dusthanaUndignified) headline = 'This marriage is built for development'
  else if (lordWeak) headline = 'The planet ruling the marriage house cannot hold the bond alone'

  const occNames = in7.map(g => gn(g.id))
  const occLine = occNames.length === 0
    ? 'The marriage house (7th) is empty, so its ruling planet carries the description.'
    : occNames.length === 1
      ? `${occNames[0]} sits in the marriage house (7th).`
      : `${occNames.slice(0, -1).join(', ')} and ${occNames[occNames.length - 1]} sit in the marriage house (7th).`
  const summary = lord && lordHouse != null
    ? `${gn(lord.id)} rules ${rn(seventhSign)} as the marriage-house (7th) lord and sits in the ${ordinal(lordHouse)}${lordDignified ? ', with dignity' : lordWeak ? ', without strength' : ''}. ${occLine}`
    : 'The planet ruling the marriage house (7th) is not available in this chart.'

  return {
    headline,
    summary,
    principles: JAYA_PRINCIPLES,
    lord: lordNotes,
    occupants: occupantNotes,
    dynamics: dynamicNotes,
    multiplicity: multiNotes,
    timing: timingNotes,
    strain: strainNotes,
    flags: {
      dignifiedLord: lordDignified && !lordWeak,
      dusthanaUndignified,
      goldStandard: gold,
      weakLord: lordWeak,
      lossSpectrum,
      siege,
      earliestYear: years.length ? Math.min(...years) : null,
      latestYear: years.length ? Math.max(...years) : null,
    },
  }
}

function band(year: number | null): 'early' | 'middle' | 'late' | null {
  if (year == null) return null
  if (year <= 16) return 'early'
  if (year <= 24) return 'middle'
  return 'late'
}

/** How the two seventh-house readings sit together in a match. */
export function compareJayaBhava(
  a: JayaBhavaReading,
  b: JayaBhavaReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  const notes: MarriedLifeNote[] = []

  if (a.flags.goldStandard && b.flags.goldStandard) {
    notes.push(note(
      'jaya-pair-gold',
      'Both charts meet the gold standard',
      `${nameA} and ${nameB} each have a dignified 7th lord, a benefic in the 7th, and a strong lagna lord invested in partnership. The marriage has two people who can actually stand in it.`,
      'supportive',
    ))
  } else if (a.flags.dignifiedLord && b.flags.dignifiedLord) {
    notes.push(note(
      'jaya-pair-dignity',
      'Both 7th lords can carry a marriage',
      `${nameA} and ${nameB} both have the classical benchmark for marital happiness available. Trouble can still come, and the charts say the two can meet it as a pair.`,
      'supportive',
    ))
  }

  const devA = a.flags.dusthanaUndignified
  const devB = b.flags.dusthanaUndignified
  if (devA && devB) {
    notes.push(note(
      'jaya-pair-both-develop',
      'Both marriages are developmental',
      `Each 7th lord sits in the 6th, 8th, or 12th without dignity. The couple will grow by service, crisis, or sacrifice. Ease is not what either chart promised. Naming that before the wedding keeps it a shared project.`,
      'caution',
    ))
  } else if (devA !== devB) {
    const heavier = devA ? nameA : nameB
    const steadier = devA ? nameB : nameA
    notes.push(note(
      'jaya-pair-uneven',
      'One chart is steadier than the other',
      `${steadier} has the more workable 7th lord. ${heavier}’s marriage signature is aimed at development through a difficult house. The steadier person will be asked to carry that curriculum. It becomes resentment only when it is mistaken for a personality flaw.`,
      'mixed',
    ))
  }

  if (a.flags.siege || b.flags.siege) {
    const who = a.flags.siege && b.flags.siege
      ? 'Both charts'
      : a.flags.siege ? nameA : nameB
    notes.push(note(
      'jaya-pair-siege',
      'A three-part pressure on partnership',
      `${who} show Mars in the 6th, Rahu in the 7th, and Saturn in the 8th. The pattern is a fight on the way in, an unstable bond, and a long aftermath. This does not indicate a death. The useful question is whether the couple can see the pattern before they reenact it.`,
      'caution',
    ))
  } else if (a.flags.lossSpectrum && b.flags.lossSpectrum) {
    notes.push(note(
      'jaya-pair-strain',
      'Continuity is the work for both',
      'Both charts carry a strain line on the 7th. Separation language still needs Navamsha and dasha. What can be said now is that neither person should expect the marriage to be self-maintaining.',
      'caution',
    ))
  }

  const bandA = band(a.flags.earliestYear)
  const bandB = band(b.flags.earliestYear)
  if (bandA && bandB && bandA !== bandB) {
    notes.push(note(
      'jaya-pair-timing',
      'The marriage clocks do not match',
      `${nameA}’s earliest marriage-timing marker is ${bandA}. ${nameB}’s is ${bandB}. The later clock sets the real pace. Pushing the earlier chart produces a wedding the other person is not built for yet.`,
      'mixed',
    ))
  } else if (bandA && bandB) {
    notes.push(note(
      'jaya-pair-timing-same',
      'The marriage clocks agree',
      `Both earliest markers sit in the ${bandA} band. Relative timing is aligned. The absolute year still has to be read from dasha, with a modern cultural delay.`,
      'supportive',
    ))
  }

  if (!notes.length) {
    notes.push(note(
      'jaya-pair-plain',
      'No shared extreme on the seventh',
      `${nameA} and ${nameB} do not share a gold-standard pairing or a shared strain signature. Each 7th lord is best understood on its own, together with the cross-chart notes above.`,
      'mixed',
    ))
  }

  return notes
}
