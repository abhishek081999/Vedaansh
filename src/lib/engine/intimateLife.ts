// src/lib/engine/intimateLife.ts
// Intimate style, in-laws, and who bends the mind — from one chart.
// Sequence: 5th, 7th, 8th and 12th, Venus, Mercury/Saturn/Ketu, Moon, then D9.
// D3 is the mind in the running period. D7 is who enters (3rd), who leaves (6/8/12), hidden bonds (8th), and children (Sun, Ketu, Jupiter).
// Tendencies for matching. Not a verdict that an act has already happened.
// Pure engine — no React/DB.

import type { ChartOutput, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { D7 } from '@/lib/engine/vargas'

export interface IntimateLife {
  headline: string
  notes: MarriedLifeNote[]
  inlaws: MarriedLifeNote[]
  influence: MarriedLifeNote[]
  timings: MarriedLifeNote[]
  divisions: MarriedLifeNote[]
}

export interface DusthanaLink {
  helper: string
  native: string
  house: 6 | 8 | 12
  detail: string
}

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const EXALT: Partial<Record<GrahaId, number>> = {
  Su: 1, Mo: 2, Ma: 10, Me: 6, Ju: 4, Ve: 12, Sa: 7,
}

const MALEFICS = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
const INTIMATE_HOUSES = new Set([5, 7, 8, 12])

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function signOf(asc: number, house: number): Rashi {
  return ((((asc - 1 + house - 1) % 12) + 1) as Rashi)
}

function find(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.grahas.find(g => g.id === id)
}

function inHouse(chart: ChartOutput, house: number, asc: number): GrahaData[] {
  return chart.grahas.filter(g => EXALT[g.id] !== undefined || g.id === 'Ra' || g.id === 'Ke')
    .filter(g => houseOf(g.rashi, asc) === house)
}

function classical(chart: ChartOutput): GrahaData[] {
  return chart.grahas.filter(g => g.id === 'Ra' || g.id === 'Ke' || EXALT[g.id] !== undefined)
}

function aspectsHouse(g: GrahaData, target: number, asc: number): boolean {
  const h = houseOf(g.rashi, asc)
  if (h === target) return true
  const diff = (target - h + 12) % 12
  if (diff === 6) return true
  if (g.id === 'Ma' && (diff === 3 || diff === 7)) return true
  if (g.id === 'Ju' && (diff === 4 || diff === 8)) return true
  if (g.id === 'Sa' && (diff === 2 || diff === 9)) return true
  return false
}

function sameSign(a?: GrahaData, b?: GrahaData): boolean {
  return !!a && !!b && a.rashi === b.rashi
}

function names(list: GrahaData[]): string {
  return list.map(g => GRAHA_NAMES[g.id]).join(', ')
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

function d9Of(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.vargas?.D9?.find(g => g.id === id)
}

function exaltedInD9(chart: ChartOutput, id: GrahaId): boolean {
  const g = d9Of(chart, id)
  return !!g && EXALT[id] === g.rashi
}

const DASHA_BOND: Partial<Record<GrahaId, string>> = {
  Me: 'Finances come first in this period. A relationship is for advantage. A stronger option strains loyalty.',
  Ve: 'A bond in this period wants status, not a passing tie. Without that standing, the bond does not form.',
  Ke: 'Ketu’s mahadasha cuts the bond. The person turns unavailable, and the bond does not rejoin.',
  Su: 'A bond breaks on ego or family honor.',
  Mo: 'After a break, the person misses the partner.',
  Ma: 'A broken bond can restart.',
  Sa: 'Inferiority pushes toward a bond. What came easily before now takes repeated work, and the bond stays difficult for a long time.',
  Ra: 'A stronger person can appear and pull the bond off center.',
  Ju: 'Effort in this period returns more than it costs.',
}

function hemmed(middle: GrahaData, left: GrahaData, right: GrahaData): boolean {
  const a = (middle.rashi - left.rashi + 12) % 12
  const b = (right.rashi - middle.rashi + 12) % 12
  return (a === 1 && b === 1) || ((middle.rashi - right.rashi + 12) % 12 === 1 && (left.rashi - middle.rashi + 12) % 12 === 1)
}

function pushPatterns(chart: ChartOutput, asc: number, notes: MarriedLifeNote[]) {
  const moon = find(chart, 'Mo')
  const venus = find(chart, 'Ve')
  const mars = find(chart, 'Ma')
  const saturn = find(chart, 'Sa')
  const ketu = find(chart, 'Ke')
  const rahu = find(chart, 'Ra')
  const mercury = find(chart, 'Me')

  if (moon && (moon.rashi === 2 || moon.rashi === 7)) {
    notes.push(note('moon-venus-sign', 'Moon in a Venus sign', 'This person needs to be the priority. Criticism and false urgency follow, and the partner’s reaction is later used as proof.', 'caution'))
  } else if (venus && venus.rashi === 4) {
    notes.push(note('venus-moon-sign', 'Venus in Cancer', 'This person needs to be the priority. Criticism and false urgency follow, and the partner’s reaction is later used as proof.', 'caution'))
  }

  if (mars && saturn && houseOf(mars.rashi, asc) === 4 && houseOf(saturn.rashi, asc) === 4) {
    notes.push(note('fourth-mars-saturn', 'Mars and Saturn in the 4th', 'Violence comes when the partner does not comply.', 'caution'))
  }

  const fourthMalefic = inHouse(chart, 4, asc).some(g => MALEFICS.has(g.id))
  if (!fourthMalefic && moon && venus && sameSign(moon, venus)) {
    notes.push(note('private-blow', 'Moon and Venus, 4th clear', 'Fine in public. When refused, the blow comes, then the apology.', 'caution'))
  }

  if (mars && houseOf(mars.rashi, asc) === 8) {
    notes.push(note('mars-eighth', 'Mars in the 8th', 'The harm stays inside the room. Outside, the person looks correct.', 'caution'))
  }

  if (moon && saturn && ketu && [moon, saturn, ketu].every(g => houseOf(g.rashi, asc) === 4)) {
    notes.push(note('numb', 'Saturn, Moon, and Ketu in the 4th', 'Feeling is dried. The partner is used, not held.', 'caution'))
  }

  if (venus && mars && rahu && hemmed(venus, mars, rahu)) {
    notes.push(note('venus-hemmed', 'Venus between Mars and Rahu', 'Marriage into this chart is unsafe.', 'caution'))
  }

  const ninthLord = find(chart, LORDS[signOf(asc, 9)])
  const ninthHouse = ninthLord ? houseOf(ninthLord.rashi, asc) : 0
  const saturnOnMercury3 = !!(saturn && mercury && houseOf(mercury.rashi, asc) === 3 && aspectsHouse(saturn, 3, asc))
  if ((rahu && rahu.rashi === 9) || ninthHouse === 3 || ninthHouse === 7 || saturnOnMercury3) {
    notes.push(note('many-bonds', 'Dharma cut', 'More than one relationship is the pattern.', 'caution'))
  }

  const fifthLord = find(chart, LORDS[signOf(asc, 5)])
  if (fifthLord && houseOf(fifthLord.rashi, asc) === 8) {
    notes.push(note('fifth-eighth', '5th lord in the 8th', 'A relationship does not stay private. Reputation takes the hit.', 'caution'))
  }
  if (fifthLord && houseOf(fifthLord.rashi, asc) === 12) {
    notes.push(note('fifth-twelfth', '5th lord in the 12th', 'A relationship does not stay contained.', 'caution'))
  }

  if (sameSign(mercury, rahu)) {
    notes.push(note('scandal', 'Mercury with Rahu', 'A scandal travels, including through talk and screens.', 'caution'))
  }
  if (sameSign(venus, rahu)) {
    notes.push(note('venus-rahu', 'Venus with Rahu', 'The bond produces scenes that do not stay private.', 'caution'))
  }
  const sun = find(chart, 'Su')
  if (sun && mercury && ketu && sun.rashi === mercury.rashi && mercury.rashi === ketu.rashi) {
    notes.push(note('phone-exposure', 'Mercury, Sun, and Ketu', 'Exposure of a bond runs through the phone.', 'caution'))
  }
  if (sameSign(venus, ketu)) {
    notes.push(note('venus-ketu', 'Venus with Ketu', 'Ketu does not hold Venus. The bond is seen and then lost.', 'caution'))
  }
  if (venus && (venus.dignity === 'exalted' || venus.rashi === 12)) {
    notes.push(note('venus-exalted', 'Venus exalted', 'Bonds arrive, and the cost of them is not weighed.', 'mixed'))
  }
  if (ketu && (ketu.rashi === 3 || ketu.rashi === 7 || ketu.rashi === 11)) {
    notes.push(note('ketu-kama', 'Ketu in a desire sign', 'The search does not settle, and the partner’s background stays unclear.', 'caution'))
  }
  if (ketu && (houseOf(ketu.rashi, asc) === 7 || houseOf(ketu.rashi, asc) === 8) && ketu.rashi !== 3 && ketu.rashi !== 7 && ketu.rashi !== 11) {
    notes.push(note('ketu-kama-house', `Ketu in the ${houseOf(ketu.rashi, asc)}th`, 'The search does not settle, and the partner’s background stays unclear.', 'caution'))
  }
  const aquarius = classical(chart).filter(g => g.rashi === 11)
  if (aquarius.length >= 3) {
    notes.push(note('aquarius-crowd', 'Several planets in Aquarius', 'Bonds repeat. They come with merit from before.', 'mixed'))
  }
  const lagnaLordId = LORDS[asc]
  const eighthLordId = LORDS[signOf(asc, 8)]
  const lagnaLord = find(chart, lagnaLordId)
  const eighthLord = find(chart, eighthLordId)
  if (lagnaLord && eighthLord && lagnaLordId !== eighthLordId && lagnaLord.rashi === signOf(asc, 8) && eighthLord.rashi === asc) {
    notes.push(note('bandhan', '1st and 8th lords exchange', 'The body and the 8th are tied. A bond here confines. In Saturn’s period that confinement is felt as restriction.', 'caution'))
  }

  if (venus && houseOf(venus.rashi, asc) === 8) {
    notes.push(note('venus-eighth', 'Venus in the 8th', 'Intimacy carries an old grievance. An outside bond is the risk.', 'caution'))
  } else if (venus && venus.rashi === 8) {
    notes.push(note('venus-scorpio', 'Venus in Scorpio', 'The partner feels karmic. The grievance is old.', 'mixed'))
  }

  const fourthLord = find(chart, LORDS[signOf(asc, 4)])
  const seventhLord = find(chart, LORDS[signOf(asc, 7)])
  if (chart.meta?.gender === 'female' && fourthLord && (
    houseOf(fourthLord.rashi, asc) === 7 || (seventhLord && sameSign(fourthLord, seventhLord))
  )) {
    notes.push(note('mil-wife', '4th lord with the 7th', 'Mother-in-law and wife clash.', 'caution'))
  }

  if (chart.meta?.gender === 'male' && venus) {
    const withVenus = classical(chart).filter(g => g.id !== 'Ve' && g.rashi === venus.rashi)
    if (withVenus.length >= 3) {
      notes.push(note('venus-crowd', 'Several planets with Venus', 'Relationships multiply. Each one teaches something, and then another starts.', 'caution'))
    }
  }

  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9
  if (d9?.length && d9Asc) {
    const lagnaLord = d9.find(g => g.id === LORDS[d9Asc])
    const d9Venus = d9.find(g => g.id === 'Ve')
    const d9Ketu = d9.find(g => g.id === 'Ke')
    const d9Sun = d9.find(g => g.id === 'Su')
    const seventhFromD9 = LORDS[signOf(d9Asc, 7)]
    const d9SeventhLord = d9.find(g => g.id === seventhFromD9)
    if (lagnaLord?.rashi === 1) notes.push(note('d9-aries', 'Lagna lord in Aries Navamsha', 'Impatience. Partners get changed.', 'caution'))
    if (d9Venus?.rashi === 11) notes.push(note('d9-aq', 'Venus in Aquarius Navamsha', 'Obsession with the partner.', 'mixed'))
    if (d9Ketu?.rashi === 4) notes.push(note('d9-cancer-ke', 'Ketu in Cancer Navamsha', 'Thirst that does not settle.', 'mixed'))
    if ((d9Venus && houseOf(d9Venus.rashi, d9Asc) === 8) || (d9Sun && houseOf(d9Sun.rashi, d9Asc) === 8)) {
      notes.push(note('d9-eighth', 'Planet in the 8th Navamsha', 'Trauma enters through the relationship.', 'caution'))
    }
    if (d9Venus?.rashi === 9 || d9SeventhLord?.rashi === 9) {
      notes.push(note('d9-sag', 'Sagittarius Navamsha', 'The relationship planet falls from its seat.', 'caution'))
    }
    if (d9Venus?.rashi === 7 || d9SeventhLord?.rashi === 7) {
      notes.push(note('d9-lib', 'Libra Navamsha', 'Everything is given expecting marriage. The bond breaks.', 'caution'))
    }
  }

  const d4Asc = chart.vargaLagnas?.D4
  const d4 = chart.vargas?.D4
  if (d4Asc && d4?.length) {
    const inD4Fourth = d4.filter(g => houseOf(g.rashi, d4Asc) === 4)
    if (inD4Fourth.some(g => g.id === 'Ju') && inD4Fourth.some(g => g.id === 'Ra')) {
      notes.push(note('d4-saint', 'Jupiter and Rahu in the D4 4th', 'Others see a saint. The house sees something else.', 'caution'))
    }
  }

  const tree = chart.dashas?.vimshottari
  const runningMaha = tree?.length ? getDashaPathAt(tree)[0] : undefined
  const maha = runningMaha?.lord as GrahaId | undefined
  if (maha && DASHA_BOND[maha]) {
    let detail = DASHA_BOND[maha]!
    if (maha === 'Ra' && chart.meta?.gender === 'male') {
      detail = 'A stronger partner can be found past this person. The bond is pulled off center.'
    }
    if (maha === 'Ke') {
      const jupiter = find(chart, 'Ju')
      const lagnaLord = find(chart, LORDS[asc])
      const held = !!lagnaLord && placedWell(lagnaLord)
        && !!moon && !placedBadly(moon)
        && !!jupiter && !placedBadly(jupiter)
      detail = held
        ? 'Ketu’s mahadasha cuts the bond. The lagna, Moon, and Jupiter are holding, so the period turns toward withdrawal rather than a collapse of work and the body.'
        : chart.meta?.gender === 'male'
          ? 'Ketu’s mahadasha cuts the bond. The person turns unavailable, and the bond does not rejoin. The body and intimacy go dry in this period.'
          : DASHA_BOND.Ke!
    }
    notes.push(note('dasha-bond', `${GRAHA_NAMES[maha]} dasha`, detail, 'mixed'))
  }
  if (maha === 'Sa' && tree?.length && runningMaha) {
    const start = new Date(runningMaha.start).getTime()
    const idx = tree.findIndex(n => n.lord === 'Sa' && new Date(n.start).getTime() === start)
    const prev = idx > 0 ? tree[idx - 1] : undefined
    if (prev?.lord === 'Ju') {
      notes.push(note('ju-sa-flip', 'Jupiter hands the period to Saturn', 'What arrived easily now takes repeated work. A bond that continues does so by effort.', 'mixed'))
    }
  }
  const fifthId = LORDS[signOf(asc, 5)]
  if (maha && maha === fifthId && maha !== 'Ve') {
    notes.push(note('fifth-dasha', '5th-lord dasha', 'A relationship period is open.', 'mixed'))
  }
}

const APPROACH: Partial<Record<number, string>> = {
  9: 'The approach is communication.',
  10: 'The approach is food, home, and a feeling of being provided for.',
  2: 'The approach uses the father’s resources, and it offers rescue when nobody else will.',
  3: 'The approach is trust.',
  4: 'The approach is work. Wealth is shown so the bond feels secure.',
}

function lordWeak(g?: GrahaData): boolean {
  if (!g) return false
  return g.isCombust || g.dignity === 'debilitated' || g.dignity === 'enemy' || g.dignity === 'great_enemy'
}

function marsStrong(g: GrahaData): boolean {
  return g.dignity === 'exalted' || g.dignity === 'moolatrikona' || g.dignity === 'own' || g.dignity === 'great_friend' || g.dignity === 'friend'
}

function pushDrive(chart: ChartOutput, asc: number, notes: MarriedLifeNote[]) {
  const moon = find(chart, 'Mo')
  const venus = find(chart, 'Ve')
  const mars = find(chart, 'Ma')
  const saturn = find(chart, 'Sa')
  const mercury = find(chart, 'Me')
  const jupiter = find(chart, 'Ju')
  const rahu = find(chart, 'Ra')
  const ketu = find(chart, 'Ke')
  const sun = find(chart, 'Su')
  const seventhLord = find(chart, LORDS[signOf(asc, 7)])
  const maleficOn7 = inHouse(chart, 7, asc).filter(g => g.id === 'Ma' || g.id === 'Sa' || g.id === 'Ra' || g.id === 'Ke')
  const seventhBlocked = maleficOn7.length >= 2

  if (moon && ketu && sameSign(moon, ketu)) {
    notes.push(note('moon-ketu', 'Moon with Ketu', 'Interest stops at the act. The relationship itself is not the point.', 'caution'))
  }
  if (moon && mars && sameSign(moon, mars)) {
    notes.push(note('moon-mars', 'Moon with Mars', 'The mood is agitated. Intimacy starts hot and stays restless.', 'caution'))
  }
  if (moon && mercury && sameSign(moon, mercury)) {
    notes.push(note('moon-mercury', 'Moon with Mercury', 'Partners multiply. The mind keeps looking for the next opening.', 'caution'))
  }
  if (moon && rahu && sameSign(moon, rahu)) {
    notes.push(note('moon-rahu-desire', 'Moon with Rahu', 'Desire is intense, and it does not stay at one wish.', 'caution'))
  }
  if (moon && jupiter && aspectsHouse(jupiter, houseOf(moon.rashi, asc), asc)) {
    notes.push(note('moon-jupiter', 'Jupiter on the Moon', 'The mood needs a known partner. A meeting with no understanding does not hold.', 'mixed'))
  }
  if (moon && houseOf(moon.rashi, asc) === 12) {
    notes.push(note('moon-twelfth', 'Moon in the 12th', 'Intimacy is isolated and done as duty. Pleasure is not the reason.', 'caution'))
  }
  if (moon && houseOf(moon.rashi, asc) === 4) {
    notes.push(note('moon-fourth', 'Moon in the 4th', 'The mood around intimacy is easy. The body feels at home.', 'supportive'))
  }

  const mercuryInSexual = !!mercury && [3, 7, 8].includes(houseOf(mercury.rashi, asc))
  const geminiOccupied = [3, 7, 8].some(h => signOf(asc, h) === 3 && inHouse(chart, h, asc).length > 0)
  if (mercuryInSexual || geminiOccupied) {
    notes.push(note(
      'same-sex-turn',
      'Gemini on a sexual house',
      'Attraction takes an artistic turn and can include the same sex.',
      'mixed',
    ))
  }

  if (mars && INTIMATE_HOUSES.has(houseOf(mars.rashi, asc)) && marsStrong(mars) && !seventhBlocked) {
    notes.push(note('mars-open', 'Mars strong on a sexual house', 'Passion is open. The relationship is explicit.', 'mixed'))
  }
  if (mars && houseOf(mars.rashi, asc) === 7 && !seventhBlocked && (lordWeak(venus) || lordWeak(seventhLord))) {
    const later = d9Of(chart, 'Sa')?.rashi === 7
    notes.push(note(
      'mars-unmet',
      'Mars in the 7th',
      later
        ? 'The 7th wants more than the partner allows. Later in life that unmet desire turns toward both sexes.'
        : 'The 7th wants more than the partner allows.',
      'caution',
    ))
  }
  if (mars && seventhLord && seventhLord.id !== 'Ma' && houseOf(mars.rashi, asc) === 7 && seventhLord.rashi === 5) {
    notes.push(note('seventh-leo', '7th lord in Leo', 'The partner keeps a standard the 7th’s appetite does not meet.', 'mixed'))
  }
  if (mars && venus && mars.rashi === 7 && venus.rashi === 7) {
    notes.push(note(
      'close-circle',
      'Mars and Venus in Libra',
      'The pursuit reaches friends, siblings, and partners of people already in the family.',
      'caution',
    ))
  }
  if (mars && mercury && sameSign(mars, mercury) && [3, 5, 7, 8, 12].includes(houseOf(mars.rashi, asc))) {
    notes.push(note('mars-hunts', 'Mars with Mercury', 'Mars starts the pursuit. Mercury keeps it in approach and talk.', 'mixed'))
  }
  if (mars && lordWeak(mars)) {
    notes.push(note('mars-drive', 'Mars weak', 'The drive does not answer. Passion is named and the body does not carry it.', 'caution'))
  }

  if (saturn && INTIMATE_HOUSES.has(houseOf(saturn.rashi, asc))) {
    notes.push(note('saturn-work', 'Saturn on a sexual house', 'Intimacy is organized like work, and humiliation sits nearby.', 'caution'))
  }
  if (mercury && [7, 8, 12].includes(houseOf(mercury.rashi, asc))) {
    notes.push(note(
      'mercury-friendship',
      'Mercury on a sexual house',
      'The bond stays at friendship. Messages and art carry it. The act itself stays infrequent.',
      'mixed',
    ))
  }
  if (sun && (houseOf(sun.rashi, asc) === 7 || (seventhLord && sameSign(sun, seventhLord)))) {
    notes.push(note('sun-rank', 'Sun on the partnership', 'The relationship is entered through rank or authority.', 'mixed'))
  }
  if (sun && houseOf(sun.rashi, asc) === 7) {
    notes.push(note('sun-seventh', 'Sun in the 7th', 'Disgrace comes through the partner.', 'caution'))
  }
  if (sun && houseOf(sun.rashi, asc) === 8) {
    notes.push(note('sun-eighth', 'Sun in the 8th', 'The father is away or emotionally absent, and a relationship tied to this Sun becomes public. The Sun in the 8th is an unfinished act, and the relationship is asked to fill that thirst.', 'caution'))
  }

  if (seventhBlocked) {
    notes.push(note(
      'seventh-afflicted',
      '7th afflicted',
      `${names(maleficOn7)} occupy the 7th. The marriage event does not arrive, and neither does the intimacy that belongs to it.`,
      'caution',
    ))
  } else if (lordWeak(seventhLord)) {
    notes.push(note('seventh-enjoy', '7th lord weak', 'The bond can form. Enjoyment of it does not.', 'caution'))
  }

  const onLagna = inHouse(chart, 1, asc).filter(g => g.id === 'Ma' || g.id === 'Sa' || g.id === 'Ra' || g.id === 'Ke')
  if (onLagna.length) {
    notes.push(note('lagna-blocked', 'Ascendant blocked', `${names(onLagna)} on the ascendant block the body from enjoying.`, 'caution'))
  }

  if (APPROACH[asc]) {
    notes.push(note('approach', `${RASHI_NAMES[asc as Rashi]} approach`, APPROACH[asc]!, 'mixed'))
  }

  const taurusCrowd = classical(chart).filter(g => g.rashi === 2)
  const venusArdra = !!venus && venus.nakshatraIndex === 5 && [2, 6, 10].includes(houseOf(venus.rashi, asc))
  if (taurusCrowd.length >= 3 || venusArdra) {
    notes.push(note('progeny', 'Lineage heavy', 'Children come in number. The line encoded here is thick.', 'supportive'))
  }
}

const CIRCUIT = new Set<GrahaId>(['Sa', 'Me', 'Su'])

function formatWhen(start: Date | string | number, end: Date | string | number): string {
  const fmt = (value: Date | string | number) => {
    const d = new Date(value)
    if (!Number.isFinite(d.getTime())) return ''
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return `${fmt(start)} – ${fmt(end)}`
}

const LEVEL_NAME: Record<number, string> = {
  3: 'Pratyantar',
  4: 'Sukshma',
}

function relationshipTimings(chart: ChartOutput, asc: number, now = Date.now()): MarriedLifeNote[] {
  const tree = chart.dashas?.vimshottari
  if (!tree?.length) return []
  const fifth = LORDS[signOf(asc, 5)]
  const eighth = LORDS[signOf(asc, 8)]
  const fifthGraha = find(chart, fifth)
  const fifthHouse = fifthGraha ? houseOf(fifthGraha.rashi, asc) : 0
  const rahu = find(chart, 'Ra')
  const venus = find(chart, 'Ve')
  const fromRahu = rahu && venus ? houseOf(venus.rashi, rahu.rashi) : 0
  const blockRahuVenus = fromRahu === 6 || fromRahu === 8
  const recent = now - 5 * 365.25 * 24 * 60 * 60 * 1000
  const rows: { kind: 'entry' | 'break'; level: number; start: number; end: number; note: MarriedLifeNote }[] = []
  const work: { start: number; end: number; note: MarriedLifeNote }[] = []

  const consider = (lords: GrahaId[], node: DashaNode) => {
    const level = lords.length
    if (level < 2 || level > 4) return
    const leaf = lords[level - 1]
    const maha = lords[0]
    if (leaf === 'Ve' && maha === 'Ra' && blockRahuVenus) {
      if (level === 2) {
        const start = new Date(node.start).getTime()
        const end = new Date(node.end).getTime()
        if (Number.isFinite(start) && Number.isFinite(end) && end > recent) {
          const open = start <= now && end > now
          work.push({
            start,
            end,
            note: note(
              `${open ? 'open-' : ''}work-${lords.join('')}-${start}`,
              `${open ? 'Work open' : 'Work, not a bond'} · ${lords.map(id => GRAHA_NAMES[id]).join('–')}`,
              `${formatWhen(node.start, node.end)}. Venus sits 6th or 8th from Rahu. This period is job, earnings, and people. A relationship does not form here.`,
              'mixed',
            ),
          })
        }
      }
      return
    }
    const breakup = leaf === 'Su' || leaf === 'Ke'
    const lowPoint = lords.includes('Me') && leaf === 'Sa'
    const venusLeaf = leaf === 'Ve'
    const fifthLeaf = leaf === fifth
    const circuit = (leaf === 'Sa' || leaf === 'Me') && lords.slice(0, -1).some(id => CIRCUIT.has(id) && id !== leaf)
    const aspectLord = [...lords].reverse().find(id => {
      const g = find(chart, id)
      return !!g && aspectsHouse(g, 5, asc)
    })
    if (!breakup && !lowPoint && !venusLeaf && !fifthLeaf && !circuit && !aspectLord) return

    const namesInPath = lords.map(id => GRAHA_NAMES[id]).join('–')
    const levelName = LEVEL_NAME[level]
    const when = formatWhen(node.start, node.end)
    const bits = [levelName ? `${levelName}. ${when}.` : `${when}.`]
    if (breakup) {
      bits.push(leaf === 'Ke'
        ? (maha === 'Ke'
          ? 'Ketu’s mahadasha cuts the bond. It does not rejoin.'
          : 'Ketu’s sub-period shortens the time for the bond. The break is smaller than a Ketu mahadasha.')
        : 'The bond breaks on ego or family honor.')
      if (leaf === 'Su' && lords.includes('Sa')) {
        bits.push(chart.meta?.gender === 'female'
          ? 'Inside Saturn, the bond is exposed through the father.'
          : 'Inside Saturn, the bond is exposed.')
      }
    } else if (lowPoint) {
      bits.push('The bond starts from a low point, with someone this person can stand over.')
    } else if (venusLeaf && maha === 'Sa') {
      bits.push('A bond can start inside Saturn and then stay difficult for a long time.')
    } else if (venusLeaf) {
      bits.push('A bond can start. It wants status, not a passing tie.')
    } else if (circuit) {
      const other = lords.slice(0, -1).find(id => CIRCUIT.has(id) && id !== leaf)
      bits.push(`${GRAHA_NAMES[other ?? maha]} and ${GRAHA_NAMES[leaf]} are both live. A relationship event belongs to this period.`)
    } else if (fifthLeaf) {
      bits.push('The 5th lord is live. A relationship period is open.')
    } else if (aspectLord) {
      const g = find(chart, aspectLord)!
      const h = houseOf(g.rashi, asc)
      const name = GRAHA_NAMES[aspectLord]
      const where = h === 11
        ? `${name} sits in the 11th and aspects the 5th`
        : h === 5
          ? `${name} sits in the 5th`
          : `${name} aspects the 5th`
      bits.push(aspectLord === leaf
        ? `${where}. A relationship period is open.`
        : `${where}, and its dasha is running. A relationship period is open.`)
    }
    if (!breakup && fifthLeaf && fifthHouse !== 6 && fifthHouse !== 8 && fifthHouse !== 12) {
      bits.push('The 5th lord is placed where this bond can stay private.')
    }
    if (!breakup && fifthLeaf && fifthHouse === 8) bits.push('This one becomes public.')
    if (!breakup && fifthLeaf && fifthHouse === 12) bits.push('This one does not stay contained.')
    if (!breakup && fifth !== eighth && lords.includes(fifth) && lords.includes(eighth)) {
      bits.push('The 5th lord and the 8th lord meet. The bond becomes public.')
    }
    const kind = breakup ? 'break' : 'entry'
    const head = kind === 'break' ? 'Breakup' : 'Entry'
    const title = levelName ? `${head} · ${levelName} · ${namesInPath}` : `${head} · ${namesInPath}`
    const start = new Date(node.start).getTime()
    const end = new Date(node.end).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= recent) return
    const open = start <= now && end > now
    const past = end <= now
    const liveTitle = open ? title.replace(/^Entry/, 'Entry open').replace(/^Breakup/, 'Breakup open') : title
    rows.push({
      kind,
      level,
      start,
      end,
      note: note(
        `${past ? 'past-' : ''}${kind}-${lords.join('')}-${start}`,
        liveTitle,
        bits.join(' '),
        /public|contained|exposed|cut/.test(bits.join(' ')) ? 'caution' : kind === 'break' ? 'caution' : 'mixed',
      ),
    })
  }

  const walk = (nodes: DashaNode[], above: GrahaId[]) => {
    for (const node of nodes) {
      const lords = [...above, node.lord as GrahaId]
      consider(lords, node)
      if (lords.length < 4 && node.children?.length) walk(node.children, lords)
    }
  }
  walk(tree, [])

  const pick = (kind: 'entry' | 'break') => {
    const relevant = rows.filter(r => r.kind === kind)
    const maxLevel = relevant.reduce((max, row) => Math.max(max, row.level), 0)
    if (!maxLevel) return []
    const levels = maxLevel >= 4 ? [4, 3] : [maxLevel]
    const chosen: typeof rows = []
    for (const level of levels) {
      const pool = relevant.filter(r => r.level === level).sort((a, b) => a.start - b.start)
      const past = pool.filter(r => r.end <= now)
      const current = pool.filter(r => r.start <= now && r.end > now)
      const future = pool.filter(r => r.start > now)
      if (level >= 4) chosen.push(...[...current, ...future].slice(0, 3))
      else chosen.push(...past, ...current, ...future.slice(0, 2))
    }
    const seen = new Set<string>()
    return chosen
      .sort((a, b) => a.start - b.start || b.level - a.level)
      .filter(row => {
        if (seen.has(row.note.id)) return false
        seen.add(row.note.id)
        return true
      })
      .map(row => row.note)
  }
  const openWork = work.find(row => row.start <= now && row.end > now)
  const futureWork = work.filter(row => row.start > now).sort((a, b) => a.start - b.start)[0]
  const pastWork = work.filter(row => row.end <= now).sort((a, b) => b.start - a.start)[0]
  const chosenWork = openWork ?? futureWork ?? pastWork
  return [...(chosenWork ? [chosenWork.note] : []), ...pick('entry'), ...pick('break')]
}

const OWN_SIGNS: Partial<Record<GrahaId, number[]>> = {
  Su: [5], Mo: [4], Ma: [1, 8], Me: [3, 6], Ju: [9, 12], Ve: [2, 7], Sa: [10, 11],
}
const DEBIL_SIGNS: Partial<Record<GrahaId, number>> = {
  Su: 7, Mo: 8, Ma: 4, Me: 12, Ju: 10, Ve: 6, Sa: 1,
}

function placedWell(g: GrahaData): boolean {
  return EXALT[g.id] === g.rashi || !!OWN_SIGNS[g.id]?.includes(g.rashi)
}

function placedBadly(g: GrahaData): boolean {
  return DEBIL_SIGNS[g.id] === g.rashi || g.isCombust
}

function vargaList(chart: ChartOutput, code: 'D3' | 'D7' | 'D27'): { asc: number; grahas: GrahaData[] } | null {
  const asc = chart.vargaLagnas?.[code]
  const grahas = chart.vargas?.[code]
  if (!asc || !grahas?.length) return null
  return { asc, grahas }
}

function divisionReadings(chart: ChartOutput, now = Date.now()): MarriedLifeNote[] {
  const out: MarriedLifeNote[] = []
  const path = chart.dashas?.vimshottari ? getDashaPathAt(chart.dashas.vimshottari, now) : []
  const lords = path.map(node => node.lord as GrahaId).slice(0, 4)
  const d3 = vargaList(chart, 'D3')
  const d7 = vargaList(chart, 'D7')

  if (d3) {
    if (lords.length) for (const id of [...lords].reverse()) {
      const g = d3.grahas.find(p => p.id === id)
      if (!g) continue
      const h = houseOf(g.rashi, d3.asc)
      const name = GRAHA_NAMES[id]
      if (h === 12 && g.rashi === 7) {
        out.push(note('d3-libra-12', 'D3 mind on an ending', `${name} is in the 12th in Libra in D3. The mind is on a breakup.`, 'caution'))
        break
      }
      if (h === 6 || h === 8 || h === 12) {
        const mind = h === 8
          ? 'The mind is on fear and grief, and it pulls that into the bond.'
          : h === 6
            ? 'The mind starts the conflict.'
            : 'The mind is on an ending and the regret that follows.'
        out.push(note('d3-dusthana', `D3 ${name} in the ${h}th`, `The running period sits in the ${h}th of D3. ${mind}`, 'caution'))
        break
      }
      if (h === 5 || h === 7) {
        out.push(note('d3-bond', `D3 ${name} in the ${h}th`, 'The mind in this period stays on the bond.', 'mixed'))
        break
      }
      if (h === 3) {
        out.push(note('d3-enter', `D3 ${name} in the 3rd`, 'The mind is on the person who is entering.', 'mixed'))
        break
      }
    }
    const moon = d3.grahas.find(p => p.id === 'Mo')
    const ketu = d3.grahas.find(p => p.id === 'Ke')
    if (moon && ketu && houseOf(moon.rashi, d3.asc) === 8 && houseOf(ketu.rashi, d3.asc) === 8) {
      out.push(note('d3-moon-ketu', 'Moon and Ketu in the D3 8th', 'The act happens, and the feeling then shuts.', 'caution'))
    }
    const inLagna = d3.grahas.filter(p => houseOf(p.rashi, d3.asc) === 1)
    if (inLagna.some(p => p.id === 'Me')) {
      out.push(note('d3-speech', 'Mercury in the D3 lagna', 'The mind puts the bond into words before it acts.', 'mixed'))
    }
    const mercuryLagna = d3.asc === 3 || d3.asc === 6
    if (inLagna.some(p => p.id === 'Sa') && (inLagna.some(p => p.id === 'Me') || mercuryLagna)) {
      out.push(note('d3-calc', 'Calculative mind in D3', 'The mind calculates before it bonds.', 'mixed'))
    }
    if (d3.asc === 7 && inLagna.some(p => p.id === 'Su') && inLagna.some(p => p.id === 'Ra')) {
      out.push(note('d3-sun-rahu', 'Sun and Rahu in the D3 lagna', 'The mind keeps more than one bond.', 'caution'))
    }
    const sun = d3.grahas.find(p => p.id === 'Su')
    if (sun && DEBIL_SIGNS.Su === sun.rashi && houseOf(sun.rashi, d3.asc) === 12) {
      out.push(note('d3-sun-12', 'Sun debilitated in the D3 12th', 'Rejection sits on the mind around partnership.', 'caution'))
    }
    const venus = d3.grahas.find(p => p.id === 'Ve')
    const rahu = d3.grahas.find(p => p.id === 'Ra')
    if (venus && rahu && houseOf(venus.rashi, d3.asc) === 5 && venus.rashi === rahu.rashi) {
      out.push(note('d3-ve-ra', 'Venus and Rahu in the D3 5th', 'Relationship thoughts take the mind.', 'mixed'))
    }
    const saturn = d3.grahas.find(p => p.id === 'Sa')
    const venusHouse = venus ? houseOf(venus.rashi, d3.asc) : 0
    const saturnHouse = saturn ? houseOf(saturn.rashi, d3.asc) : 0
    if ((venusHouse === 1 && saturnHouse === 5) || (venusHouse === 5 && saturnHouse === 1)) {
      out.push(note('d3-ve-sa', 'Venus and Saturn on the D3 1–5', 'Venus and Saturn link the lagna and the 5th. The mind stays on the relationship.', 'mixed'))
    }
    if (rahu && houseOf(rahu.rashi, d3.asc) === 2) {
      out.push(note(
        'd3-rahu-2',
        'Rahu in the D3 2nd',
        rahu.rashi === 9
          ? 'Rahu in Sagittarius in the 2nd of D3. The mind expects rejection.'
          : 'Rahu in the 2nd of D3. The mind expects rejection.',
        'caution',
      ))
    }
    const phone = ['Me', 'Su', 'Ke']
      .map(id => d3.grahas.find(p => p.id === id))
      .filter((p): p is GrahaData => !!p)
    if (phone.length === 3 && phone.every(p => p.rashi === phone[0].rashi)) {
      out.push(note('d3-phone', 'Mercury, Sun, and Ketu in D3', 'Exposure of the bond runs through the phone.', 'caution'))
    }
    if (moon && saturn && moon.rashi === saturn.rashi) {
      out.push(note('d3-moon-saturn', 'Moon and Saturn in D3', 'The mind reads people sharply and does not enjoy the bond.', 'caution'))
    }
  }

  const d27 = vargaList(chart, 'D27')
  if (d27 && lords.length) {
    for (const id of [...lords].reverse()) {
      const g = d27.grahas.find(p => p.id === id)
      if (!g) continue
      const h = houseOf(g.rashi, d27.asc)
      if (h === 6 || h === 8 || h === 12) {
        out.push(note(
          'd27-dusthana',
          `D27 ${GRAHA_NAMES[id]} in the ${h}th`,
          `The running period sits in the ${h}th of D27. The same trouble is already in the mind.`,
          'caution',
        ))
        break
      }
    }
  }

  if (d7) {
    const lagna = d7.grahas.filter(p => houseOf(p.rashi, d7.asc) === 1)
    if (lagna.some(p => p.id === 'Mo')) {
      out.push(note('d7-moon-lagna', 'Moon in the D7 lagna', 'Bonds change and do not settle.', 'caution'))
    }
    if (lagna.some(p => p.id === 'Ra')) {
      out.push(note('d7-rahu-lagna', 'Rahu in the D7 lagna', 'A bond outside the marriage can open.', 'caution'))
    }
    const anchors = lagna.filter(p => p.id === 'Ju' || p.id === 'Sa')
    if (anchors.length) {
      const child = anchors.some(p => p.id === 'Sa')
        ? ' A child is delayed, and the child is this person’s own.'
        : ''
      const both = anchors.some(p => p.id === 'Ju') && anchors.some(p => p.id === 'Sa')
      const stay = both
        ? 'Jupiter and Saturn both sit in the D7 lagna. The bond can become a marriage, and it stays inside it.'
        : `The bond stays inside the marriage.${child}`
      out.push(note('d7-anchor', `${anchors.map(p => GRAHA_NAMES[p.id]).join(' and ')} in the D7 lagna`, both ? `${stay}${child}` : stay, 'mixed'))
    }
    const venus = d7.grahas.find(p => p.id === 'Ve')
    const rahu = d7.grahas.find(p => p.id === 'Ra')
    const moonD7 = d7.grahas.find(p => p.id === 'Mo')
    if (venus && rahu && venus.rashi === rahu.rashi) {
      const boy = chart.meta?.gender === 'male'
      out.push(note(
        'd7-ve-ra',
        'Venus with Rahu in D7',
        boy
          ? 'D7 keeps returning to a bond. In a man’s chart that return is weaker.'
          : 'D7 keeps returning to a bond.',
        'mixed',
      ))
    }
    if (venus?.rashi === 5) {
      out.push(note('d7-venus-leo', 'Venus in Leo in D7', 'Bonds repeat. They do not stay with one person.', 'caution'))
    }
    if (moonD7 && rahu && moonD7.rashi === rahu.rashi) {
      out.push(note('d7-moon-rahu', 'Moon with Rahu in D7', 'Bonds change, and they change faster.', 'caution'))
    }
    const mercury = d7.grahas.find(p => p.id === 'Me')
    const mars = d7.grahas.find(p => p.id === 'Ma')
    if (mercury && mars && DEBIL_SIGNS.Me === mercury.rashi && houseOf(mercury.rashi, d7.asc) === 6 && (mars.rashi === mercury.rashi || houseOf(mars.rashi, d7.asc) === 6)) {
      out.push(note('d7-me-stuck', 'Mercury debilitated in the D7 6th', 'The person cannot decide to leave.', 'mixed'))
    }
    const seventh = d7.grahas.filter(p => houseOf(p.rashi, d7.asc) === 7)
    const fifth = d7.grahas.filter(p => houseOf(p.rashi, d7.asc) === 5)
    if (seventh.some(p => p.id === 'Ra') || fifth.some(p => p.id === 'Me')) {
      out.push(note('d7-both', 'D7 desire divided', 'Desire can include both sexes.', 'mixed'))
    }
    const lagnaLordId = LORDS[d7.asc]
    const lagnaLord = d7.grahas.find(p => p.id === lagnaLordId)
    if (lagnaLord?.isCombust) {
      out.push(note('d7-secret', 'D7 lagna lord combust', 'The bond is kept secret.', 'caution'))
    }
    if (lagnaLord && rahu && lagnaLord.id !== 'Ra' && lagnaLord.rashi === rahu.rashi) {
      out.push(note('d7-lord-rahu', 'D7 lagna lord with Rahu', 'A bond outside the marriage can open.', 'caution'))
    }
    if (lagnaLord && EXALT[lagnaLordId] === lagnaLord.rashi) {
      const ownLagna = !!OWN_SIGNS[lagnaLordId]?.includes(d7.asc)
      out.push(note(
        'd7-merit',
        'D7 lagna lord exalted',
        ownLagna
          ? 'The D7 lagna is strong and its lord is exalted. Past merit supports the child, and the child comes out strong.'
          : 'The D7 lagna lord is exalted. Past merit supports children.',
        'supportive',
      ))
    }
    const eighth = d7.grahas.filter(p => houseOf(p.rashi, d7.asc) === 8)
    if (eighth.some(p => p.id === 'Sa') && eighth.some(p => p.id === 'Ra')) {
      out.push(note('d7-mature', 'Saturn and Rahu in the D7 8th', 'The partner who fits this division is mature.', 'mixed'))
    } else if (eighth.some(p => p.id === 'Sa')) {
      out.push(note('d7-saturn-8', 'Saturn in the D7 8th', 'The 8th feels empty, and a bond is used to fill it.', 'caution'))
    }
    if (lagnaLord && houseOf(lagnaLord.rashi, d7.asc) === 8) {
      out.push(note('d7-lord-8', 'D7 lagna lord in the 8th', 'The bond is pulled into secrecy.', 'caution'))
    }
    const thirdEntry = d7.grahas.filter(p => {
      if (houseOf(p.rashi, d7.asc) !== 3) return false
      return p.id === 'Ve' || p.id === 'Mo' || p.id === 'Ju' || p.id === LORDS[signOf(d7.asc, 7)]
    })
    if (thirdEntry.length) {
      out.push(note(
        'd7-entry',
        'D7 3rd — how the partner enters',
        `${names(thirdEntry)} in the 3rd of D7. The partner enters from the close circle. The 7th shows the outcome of the bond, after that entry.`,
        'mixed',
      ))
    }
    const saturnD7 = d7.grahas.find(p => p.id === 'Sa')
    if (saturnD7 && venus && saturnD7.rashi === 7 && houseOf(saturnD7.rashi, d7.asc) === 7 && (venus.rashi === saturnD7.rashi || aspectsHouse(venus, 7, d7.asc))) {
      out.push(note('d7-sa-ve', 'Saturn and Venus on the D7 7th', 'The relationship comes through Saturn, and Venus confirms it.', 'mixed'))
    }
    const ketu = d7.grahas.find(p => p.id === 'Ke')
    if (ketu && houseOf(ketu.rashi, d7.asc) === 12) {
      out.push(note(
        'd7-ketu-12',
        'Ketu in the D7 12th',
        ketu.rashi === 12
          ? 'Ketu in Pisces in the 12th of D7. This division times an ending.'
          : 'An ending sits on D7.',
        'caution',
      ))
    }
    const mandi = chart.upagrahas?.Maandi ?? chart.upagrahas?.Gulika
    if (mandi && Number.isFinite(mandi.lonSidereal)) {
      const mandiHouse = houseOf(D7(mandi.lonSidereal), d7.asc)
      if (mandiHouse === 8 || mandiHouse === 6 || mandiHouse === 12) {
        out.push(note(
          'd7-mandi',
          `Mandi in the D7 ${mandiHouse}th`,
          mandiHouse === 8
            ? 'Mandi in the 8th of D7. A hidden bond, when it runs, is painful.'
            : 'Mandi on a dusthana of D7. The ending, when it runs, stays painful.',
          'caution',
        ))
      }
    }
    if (lords.length) {
      const endLords = new Set([6, 8, 12].map(h => LORDS[signOf(d7.asc, h)]))
      for (const id of [...lords].reverse()) {
        const g = d7.grahas.find(p => p.id === id)
        const h = g ? houseOf(g.rashi, d7.asc) : 0
        if (h === 3) {
          out.push(note('d7-third', 'D7 3rd', `${GRAHA_NAMES[id]} is in the 3rd of D7. The person enters from the close circle.`, 'mixed'))
        }
        if (h === 8 || id === LORDS[signOf(d7.asc, 8)]) {
          out.push(note('d7-hidden', 'D7 8th period', `${GRAHA_NAMES[id]} opens a hidden bond in D7.`, 'caution'))
        }
        if (endLords.has(id) || h === 6 || h === 8 || h === 12) {
          const quiet = h === 12 && g && placedWell(g)
          const rough = h === 12 && g && placedBadly(g)
          const mourn = h === 8
          out.push(note(
            'd7-end-now',
            'D7 ending period',
            quiet
              ? 'The relationship ends, and the leaving is quiet.'
              : rough
                ? 'The relationship ends, and the disturbance continues after.'
                : mourn
                  ? 'The relationship ends in this period, and the leaving is mourned.'
                  : 'The relationship ends in this period.',
            'caution',
          ))
          break
        }
      }
    }
    const sun = d7.grahas.find(p => p.id === 'Su')
    if (sun && DEBIL_SIGNS.Su === sun.rashi) {
      const sunLord = d7.grahas.find(p => p.id === LORDS[sun.rashi])
      const costly = !!sunLord && houseOf(sunLord.rashi, d7.asc) === 6
      out.push(note(
        'd7-child-hard',
        'Sun debilitated in D7',
        costly
          ? 'A child is difficult to bring, and the attempt costs heavily.'
          : 'A child is difficult to bring.',
        'caution',
      ))
    } else if (sun && placedWell(sun)) {
      out.push(note('d7-child-sun', 'Sun strong in D7', 'A child can come.', 'supportive'))
    }
    const jupiter = d7.grahas.find(p => p.id === 'Ju')
    if (jupiter && houseOf(jupiter.rashi, d7.asc) === 5) {
      const drive = !!mars && aspectsHouse(mars, 5, d7.asc)
      out.push(note(
        'd7-child-joy',
        'Jupiter in the D7 5th',
        drive
          ? 'Happiness from a child is supported, and Mars supplies the effort.'
          : 'Happiness from a child is supported.',
        'supportive',
      ))
    } else if (jupiter && houseOf(jupiter.rashi, d7.asc) === 8) {
      out.push(note('d7-child-strain', 'Jupiter in the D7 8th', 'Happiness from a child is strained.', 'caution'))
    }
    if (mars && ketu && mars.rashi === ketu.rashi) {
      out.push(note('d7-mars-ketu', 'Mars and Ketu in D7', 'A child does not stay.', 'caution'))
    }
    if (venus && (
      DEBIL_SIGNS.Ve === venus.rashi
      || venus.isCombust
      || d7.grahas.some(p => (p.id === 'Ma' || p.id === 'Sa' || p.id === 'Ra' || p.id === 'Ke') && p.rashi === venus.rashi)
    )) {
      out.push(note('d7-venus-child', 'Venus afflicted in D7', 'Development of a child is disturbed.', 'caution'))
    }
    const fifthLord = LORDS[signOf(d7.asc, 5)]
    if (ketu && (houseOf(ketu.rashi, d7.asc) === 5 || d7.grahas.some(p => p.id === fifthLord && p.rashi === ketu.rashi))) {
      out.push(note('d7-child-ketu', 'Ketu on the child in D7', 'The arrival of a child is cut before it settles.', 'caution'))
    }
    if (jupiter && houseOf(jupiter.rashi, d7.asc) === 8 && mercury && d7.grahas.some(p => p.id === 'Mo' && p.rashi === mercury.rashi)) {
      out.push(note('d7-other-child', 'Moon, Mercury, and Jupiter in D7', 'A child here can arrive through another household.', 'mixed'))
    }
  }

  out.push(...d7EndingWindows(chart, now))
  out.push(...exposureWindows(chart, now))
  return out
}

function exposureWindows(chart: ChartOutput, now: number): MarriedLifeNote[] {
  const tree = chart.dashas?.vimshottari
  if (!tree?.length) return []
  const geminiMoon = vargaList(chart, 'D3')?.grahas.find(p => p.id === 'Mo')?.rashi === 3
  const recent = now - 5 * 365.25 * 24 * 60 * 60 * 1000
  const rows: { start: number; end: number; note: MarriedLifeNote }[] = []
  const walk = (nodes: DashaNode[], above: GrahaId[]) => {
    for (const node of nodes) {
      const lords = [...above, node.lord as GrahaId]
      const level = lords.length
      if (level >= 2 && level <= 3) {
        const severe = lords.includes('Sa') && lords.includes('Ma') && lords.includes('Mo')
        const phone = !!geminiMoon && lords[level - 1] === 'Mo'
        const start = new Date(node.start).getTime()
        const end = new Date(node.end).getTime()
        if ((severe || phone) && Number.isFinite(start) && Number.isFinite(end) && end > recent) {
          const label = lords.map(id => GRAHA_NAMES[id]).join('–')
          const open = start <= now && end > now
          const detail = [
            `${formatWhen(node.start, node.end)}.`,
            severe ? 'Saturn, Mars, and the Moon are together. The pain is severe, and allegations can follow.' : '',
            phone
              ? (lords.includes('Sa')
                ? 'The Moon is in Gemini in D3. Inside Saturn, the bond is exposed through friends and the phone.'
                : 'The Moon is in Gemini in D3. The bond is exposed through friends and the phone.')
              : '',
          ].filter(Boolean).join(' ')
          rows.push({
            start,
            end,
            note: note(`${open ? 'open-' : ''}expose-${lords.join('')}-${start}`, `${open ? 'Exposure open' : 'Exposure'} · ${label}`, detail, 'caution'),
          })
        }
      }
      if (level < 3 && node.children?.length) walk(node.children, lords)
    }
  }
  walk(tree, [])
  const past = rows.filter(r => r.end <= now).sort((a, b) => b.start - a.start).slice(0, 2)
  const ahead = rows.filter(r => r.end > now).sort((a, b) => a.start - b.start).slice(0, 2)
  return [...past.reverse(), ...ahead].map(r => r.note)
}

function d7EndingWindows(chart: ChartOutput, now: number): MarriedLifeNote[] {
  const d7 = vargaList(chart, 'D7')
  const tree = chart.dashas?.vimshottari
  if (!d7 || !tree?.length) return []
  const endLords = new Set([6, 8, 12].map(h => LORDS[signOf(d7.asc, h)]))
  const recent = now - 5 * 365.25 * 24 * 60 * 60 * 1000
  const rows: { start: number; past: boolean; note: MarriedLifeNote }[] = []
  const walk = (nodes: DashaNode[], above: GrahaId[]) => {
    for (const node of nodes) {
      const lords = [...above, node.lord as GrahaId]
      const level = lords.length
      if (level >= 2 && level <= 3) {
        const id = lords[level - 1]
        const g = d7.grahas.find(p => p.id === id)
        const h = g ? houseOf(g.rashi, d7.asc) : 0
        if (endLords.has(id) || h === 6 || h === 8 || h === 12) {
          const start = new Date(node.start).getTime()
          const end = new Date(node.end).getTime()
          const open = start <= now && end > now
          if (Number.isFinite(start) && Number.isFinite(end) && end > recent && !open) {
            const past = end <= now
            const label = lords.map(lord => GRAHA_NAMES[lord]).join('–')
            rows.push({
              start,
              past,
              note: note(
                `${past ? 'past-' : ''}d7-end-${lords.join('')}-${start}`,
                `${past ? 'Relationship ended' : 'Relationship ends'} · D7 · ${label}`,
                `${formatWhen(node.start, node.end)}. The 6th, 8th, or 12th of D7 is live.`,
                'caution',
              ),
            })
          }
        }
      }
      if (level < 3 && node.children?.length) walk(node.children, lords)
    }
  }
  walk(tree, [])
  const past = rows.filter(r => r.past).sort((a, b) => b.start - a.start).slice(0, 3).reverse()
  const ahead = rows.filter(r => !r.past).sort((a, b) => a.start - b.start).slice(0, 1)
  return [...past, ...ahead].map(r => r.note)
}

export function analyzeIntimateLife(chart: ChartOutput): IntimateLife | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return null

  const notes: MarriedLifeNote[] = []
  const fifth = inHouse(chart, 5, asc)
  const venus = find(chart, 'Ve')
  const moon = find(chart, 'Mo')
  const mars = find(chart, 'Ma')
  const saturn = find(chart, 'Sa')
  const mercury = find(chart, 'Me')
  const jupiter = find(chart, 'Ju')
  const rahu = find(chart, 'Ra')
  const ketu = find(chart, 'Ke')

  const fifthText = fifthReading(fifth, saturn)
  if (fifthText) {
    notes.push(note('fifth', `5th — ${RASHI_NAMES[signOf(asc, 5)]}`, fifthText, 'mixed'))
  }

  if (venus && (venus.dignity === 'debilitated' || venus.isCombust)) {
    const h = houseOf(venus.rashi, asc)
    notes.push(note(
      'venus',
      `Venus in house ${h}`,
      venus.isCombust
        ? `Venus is combust in ${RASHI_NAMES[venus.rashi as Rashi]}. Romance burns under the Sun and the partner is hard to enjoy cleanly.`
        : `Venus is debilitated in ${RASHI_NAMES[venus.rashi as Rashi]}. Affection does not hold its own strength.`,
      'caution',
    ))
  }

  const knot = classical(chart).filter(g =>
    (g.id === 'Me' || g.id === 'Sa' || g.id === 'Ke') && INTIMATE_HOUSES.has(houseOf(g.rashi, asc)),
  )
  if (knot.length >= 2) {
    notes.push(note(
      'complication',
      'Mercury, Saturn, and Ketu together',
      `${names(knot)} sit on the 5th, 7th, 8th, or 12th. Sexual and married life complicates.`,
      'caution',
    ))
  }

  if (moon && saturn && sameSign(moon, saturn)) {
    notes.push(note(
      'moon-saturn',
      'Moon with Saturn',
      'Sexual enjoyment is held down. The mind feels inferior around the body, and attraction leans toward a mature partner.',
      'caution',
    ))
  }

  if (moon && venus && sameSign(moon, venus) && moon.rashi === 8 && ketu) {
    const ketuFromMoon = houseOf(ketu.rashi, moon.rashi)
    if (ketuFromMoon === 1 || ketuFromMoon === 5 || ketuFromMoon === 9) {
      notes.push(note(
        'touch',
        'Moon and Venus in Scorpio',
        'Touch is loaded. The person does not want to be touched.',
        'caution',
      ))
    }
  }

  if (saturn && saturn.speed < 0 && houseOf(saturn.rashi, asc) === 5) {
    notes.push(note(
      'mature-partner',
      'Saturn retrograde in the 5th',
      'Love leans toward a mature partner, or one with an established profession. Saturn does not chase novelty here.',
      'mixed',
    ))
  }

  if (ketu && houseOf(ketu.rashi, asc) === 5) {
    notes.push(note(
      'ketu-fifth',
      'Ketu in the 5th',
      `Ketu in ${RASHI_NAMES[ketu.rashi as Rashi]} makes the preference hard to name and outside the usual script.${ketu.rashi === 7 ? ' In Libra the choice is especially unsettled.' : ''}`,
      'mixed',
    ))
  }

  if (ketu && houseOf(ketu.rashi, asc) === 12) {
    notes.push(note(
      'ketu-twelfth',
      'Ketu in the 12th',
      'Ketu in the 12th thins bedroom pleasure. The bed is present and the enjoyment is not.',
      'caution',
    ))
  }

  if (jupiter && venus && sameSign(jupiter, venus)) {
    const h = houseOf(jupiter.rashi, asc)
    notes.push(note(
      'ju-ve',
      'Jupiter with Venus',
      `Jupiter and Venus together strain house ${h}. The topics of that house lose cleanliness. Desire and principle argue inside the same room.`,
      'caution',
    ))
  }

  const marsOn7 = !!mars && aspectsHouse(mars, 7, asc)
  const satOn7 = !!saturn && aspectsHouse(saturn, 7, asc)
  if (marsOn7 && satOn7) {
    const juOn7 = !!jupiter && aspectsHouse(jupiter, 7, asc)
    const raOn7 = !!rahu && aspectsHouse(rahu, 7, asc)
    notes.push(note(
      'seventh-pressure',
      'Mars and Saturn on the 7th',
      [
        'Mars and Saturn both reach the 7th. Intimate contact includes oral sex.',
        juOn7 ? 'Jupiter also reaches that 7th. Desire runs toward both sexes.' : '',
        raOn7 ? 'Rahu on the same 7th. The appetite is unrestrained.' : '',
      ].filter(Boolean).join(' '),
      'caution',
    ))
  }

  const d9Saturn = d9Of(chart, 'Sa')
  const d9Ketu = d9Of(chart, 'Ke')
  if (d9Saturn?.rashi === 7 && d9Ketu?.rashi === 7) {
    notes.push(note(
      'libra-d9',
      'Saturn and Ketu in Libra Navamsha',
      'Attraction runs toward both sexes.',
      'caution',
    ))
  }

  if (mercury && mercury.rashi === 7 && houseOf(mercury.rashi, asc) === 12) {
    const ketuThere = ketu && ketu.rashi === 7
    notes.push(note(
      'mercury-libra-12',
      'Mercury in Libra in the 12th',
      ketuThere
        ? 'Bedroom secrecy pulls toward people already inside the family. Others look at that partner with contempt.'
        : 'Bedroom life turns into an exchange. Pleasure is priced or traded.',
      'caution',
    ))
  }

  const d9Me = d9Of(chart, 'Me')
  const d9Sa = d9Of(chart, 'Sa')
  const d9Ve = d9Of(chart, 'Ve')
  if (d9Me && d9Sa && d9Me.rashi === d9Sa.rashi) {
    notes.push(note(
      'd9-me-sa',
      'Mercury with Saturn in Navamsha',
      'A breakup is painful, and the bond is physical.',
      'caution',
    ))
  }
  if (d9Me && d9Sa && d9Ve && d9Me.rashi === d9Sa.rashi && d9Ve.rashi === d9Me.rashi) {
    notes.push(note(
      'd9-delay',
      'Mercury and Saturn on Venus in Navamsha',
      'Marriage is delayed. The wedding comes late.',
      'mixed',
    ))
  }

  const gulika = chart.upagrahas?.Gulika ?? chart.upagrahas?.Maandi
  if (gulika?.rashi) {
    const h = houseOf(gulika.rashi, asc)
    if (INTIMATE_HOUSES.has(h) || h === 4) {
      notes.push(note(
        'gulika',
        `${gulika.name || 'Gulika'} in house ${h}`,
        'Gulika or Mandi removes the pleasure of the house it occupies. That area can still function and still feel joyless.',
        'caution',
      ))
    }
  }

  pushDrive(chart, asc, notes)
  pushPatterns(chart, asc, notes)

  const outcome = d9Outcome(chart)
  if (outcome) notes.push(outcome)

  const inlaws = inlawNotes(chart, asc)
  const influence = influenceNotes(chart, asc)
  const cautions = [...notes, ...inlaws, ...influence].filter(n => n.tone === 'caution')
  const headline = cautions.length
    ? cautions.slice(0, 3).map(n => n.title).join(' · ')
    : ''

  return {
    headline,
    notes,
    inlaws,
    influence,
    timings: relationshipTimings(chart, asc),
    divisions: divisionReadings(chart),
  }
}

function fifthReading(fifth: GrahaData[], saturn?: GrahaData): string {
  const ids = new Set(fifth.map(g => g.id))
  const bits: string[] = []
  if (ids.has('Ju') && ids.has('Mo')) {
    bits.push('Romance stays in the open. The family hears it first.')
  }
  if (ids.has('Me')) bits.push('Intimacy stays in talk. Mercury does not raise how often the act happens.')
  if (ids.has('Ra')) bits.push('Love fixes on one absorbing bond.')
  if (saturn && fifth.some(g => g.rashi === saturn.rashi) && saturn.speed >= 0) {
    bits.push('Play cools, and reputation fear sits on love.')
  }
  return bits.join(' ')
}

function d9Outcome(chart: ChartOutput): MarriedLifeNote | null {
  const d9Asc = chart.vargaLagnas?.D9
  const d9 = chart.vargas?.D9
  if (!d9Asc || !d9?.length) return null
  const lord = LORDS[d9Asc]
  const lordGraha = d9.find(g => g.id === lord)
  const lagnaExalted = !!lordGraha && EXALT[lord] === lordGraha.rashi
  const dispositor = lordGraha ? LORDS[lordGraha.rashi] : undefined
  const dispGraha = dispositor ? d9.find(g => g.id === dispositor) : undefined
  const dispExalted = !!dispositor && !!dispGraha && EXALT[dispositor] === dispGraha.rashi
  const flags = [
    lagnaExalted ? 'Navamsha lagna lord' : '',
    dispExalted ? 'its dispositor' : '',
    exaltedInD9(chart, 'Ju') ? 'Jupiter' : '',
    exaltedInD9(chart, 'Me') ? 'Mercury' : '',
    exaltedInD9(chart, 'Ve') ? 'Venus' : '',
  ].filter(Boolean)
  if (flags.length < 3) return null
  return note(
    'd9-outcome',
    'Navamsha carries the marriage',
    `${flags.join(', ')} exalted in Navamsha. Married life comes out well even where the birth chart looks rough.`,
    'supportive',
  )
}

function standing(g: GrahaData | undefined, from: number): 'strong' | 'weak' | 'mixed' {
  if (!g) return 'mixed'
  if (placedBadly(g)) return 'weak'
  if (placedWell(g)) return 'strong'
  const h = houseOf(g.rashi, from)
  if (h === 6 || h === 8 || h === 12) return 'weak'
  if (h === 1 || h === 4 || h === 5 || h === 7 || h === 9 || h === 10) return 'strong'
  return 'mixed'
}

function inlawNotes(chart: ChartOutput, asc: number): MarriedLifeNote[] {
  const out: MarriedLifeNote[] = []
  const tenth = inHouse(chart, 10, asc)
  const eighth = inHouse(chart, 8, asc)
  const ninth = inHouse(chart, 9, asc)
  const sun = find(chart, 'Su')
  const jupiter = find(chart, 'Ju')
  const rahu = find(chart, 'Ra')
  const sunJuTenth = !!sun && !!jupiter && houseOf(sun.rashi, asc) === 10 && houseOf(jupiter.rashi, asc) === 10
  if (sunJuTenth) {
    const rahuThere = !!rahu && houseOf(rahu.rashi, asc) === 10
    out.push(note(
      'mil-sun-jupiter',
      'Sun and Jupiter in the 10th',
      rahuThere
        ? 'The 10th is the 7th from the 4th, the mother-in-law. Sun and Jupiter make her good-natured, and Rahu in that house is the vice she will not accept: drink, late nights, bad company.'
        : 'The 10th is the 7th from the 4th, the mother-in-law. Sun and Jupiter make her good-natured. Strain comes with Rahu-type habits in the house: drink, late nights, bad company. Without those, the relationship works.',
      'mixed',
    ))
  }
  const mal10 = tenth.filter(g => MALEFICS.has(g.id) && !(sunJuTenth && g.id === 'Su'))
  const ben10 = tenth.filter(g => g.id === 'Ju' || g.id === 'Ve')
  if (mal10.length) {
    out.push(note(
      'mil-career',
      '10th — career and mother-in-law',
      `${names(mal10)} in the 10th ${mal10.length > 1 ? 'strengthen' : 'strengthens'} public life and ${mal10.length > 1 ? 'make' : 'makes'} the mother-in-law difficult. One area gets breath while the other is pressed.`,
      'caution',
    ))
  } else if (ben10.length && !sunJuTenth) {
    out.push(note(
      'mil-soft',
      '10th — family easier',
      `${names(ben10)} in the 10th soften the mother-in-law and can soften the career with it.`,
      'supportive',
    ))
  }
  const mal8 = eighth.filter(g => MALEFICS.has(g.id))
  if (mal8.length) {
    out.push(note(
      'inlaws-eighth',
      '8th — spouse’s family',
      `${names(mal8)} in the 8th. The in-laws are a source of heat.`,
      'caution',
    ))
  }
  const mal9 = ninth.filter(g => MALEFICS.has(g.id))
  if (mal9.length) {
    out.push(note(
      'fil',
      '9th — father-in-law',
      `${names(mal9)} in the 9th. Friction with the father-in-law.`,
      'caution',
    ))
  }
  const ketu = find(chart, 'Ke')
  if (ketu) {
    const h = houseOf(ketu.rashi, asc)
    if (h === 2 || h === 8) {
      out.push(note(
        'ketu-ties',
        `Ketu in the ${h === 2 ? '2nd' : '8th'}`,
        h === 2
          ? 'Ketu in the 2nd can sever the native’s own family ties.'
          : 'Ketu in the 8th can sever ties with the spouse’s family.',
        'caution',
      ))
    }
  }

  const thirdSign = signOf(asc, 3)
  const filLord = find(chart, LORDS[thirdSign])
  const filStanding = standing(filLord, thirdSign)
  if (filLord && filStanding !== 'mixed') {
    out.push(note(
      'fil-shifted',
      'Father-in-law, 3rd as lagna',
      filStanding === 'strong'
        ? `The 3rd (${RASHI_NAMES[thirdSign]}) is the 9th from the 7th. Taken as the lagna, its lord ${GRAHA_NAMES[filLord.id]} is well placed. The father-in-law has standing.`
        : `The 3rd (${RASHI_NAMES[thirdSign]}) is the 9th from the 7th. Taken as the lagna, its lord ${GRAHA_NAMES[filLord.id]} is under strain. The father-in-law’s position is pressed.`,
      filStanding === 'strong' ? 'supportive' : 'caution',
    ))
  }

  const eighthSign = signOf(asc, 8)
  const eighthLord = find(chart, LORDS[eighthSign])
  const fromBirth = standing(eighthLord, asc)
  const fromEighth = standing(eighthLord, eighthSign)
  if (eighthLord && fromBirth === 'strong') {
    out.push(note(
      'inlaws-status',
      'Spouse’s family, 8th as lagna',
      fromEighth === 'strong'
        ? `The 8th lord ${GRAHA_NAMES[eighthLord.id]} is strong from the birth lagna, and it stays strong when the 8th (${RASHI_NAMES[eighthSign]}) is taken as the lagna. The spouse’s family has influence and a higher social standing.`
        : `The 8th lord ${GRAHA_NAMES[eighthLord.id]} looks strong from the birth lagna. When the 8th (${RASHI_NAMES[eighthSign]}) is taken as the lagna, that standing is not confirmed.`,
      fromEighth === 'strong' ? 'supportive' : 'mixed',
    ))
  }
  return out
}

const RAHU_NAKSHATRA = new Set([5, 14, 23])
const WATER_SIGNS = new Set([4, 8, 12])

function influenceNotes(chart: ChartOutput, asc: number): MarriedLifeNote[] {
  const out: MarriedLifeNote[] = []
  const venus = find(chart, 'Ve')
  const moon = find(chart, 'Mo')
  const mercury = find(chart, 'Me')
  const rahu = find(chart, 'Ra')
  const mars = find(chart, 'Ma')
  const saturn = find(chart, 'Sa')
  const ketu = find(chart, 'Ke')
  const sun = find(chart, 'Su')
  if (venus && (houseOf(venus.rashi, asc) === 7 || sameSign(venus, moon))) {
    out.push(note(
      'venus-lever',
      'Venus as the lever',
      'Venus on the 7th, or with the Moon, gets what it wants by charm, gift, and mood. The other person often agrees before they notice the bargain.',
      'mixed',
    ))
  }
  if (sameSign(mercury, rahu)) {
    out.push(note(
      'me-ra',
      'Mercury with Rahu',
      'Speech is edited. Half the truth is offered, and the half that serves the aim is the half that is said.',
      'caution',
    ))
  }
  if (mercury && moon && rahu && mercury.rashi === moon.rashi && moon.rashi === rahu.rashi) {
    out.push(note(
      'me-ra-mo',
      'Mercury, Rahu, and the Moon',
      'Feeling is used without a limit. Only the part of the truth that serves the aim is said.',
      'caution',
    ))
  }
  if (sameSign(moon, rahu)) {
    out.push(note(
      'mo-ra',
      'Moon with Rahu',
      'The mind is the one that gets pulled. This chart is easier to steer emotionally than it is to steer by argument.',
      'caution',
    ))
  }
  if (sameSign(moon, rahu) && !!moon && (moon.rashi === 7 || houseOf(moon.rashi, asc) === 7)) {
    out.push(note(
      'libra-pressure',
      'Libra or the 7th holds Moon and Rahu',
      'Charm in Libra or in the 7th is aimed at a result. Agreement comes first. The bargain is noticed later.',
      'caution',
    ))
  }
  if (asc === 9) {
    out.push(note(
      'sagittarius-seventh',
      'Sagittarius lagna',
      'Gemini falls on the 7th. Bonds come in more than one form, and speech decides what each bond is for.',
      'mixed',
    ))
  }
  if (moon && mercury && (WATER_SIGNS.has(asc) || WATER_SIGNS.has(moon.rashi)) && (sameSign(moon, mercury) || WATER_SIGNS.has(mercury.rashi))) {
    out.push(note(
      'water-speech',
      'Water and Mercury',
      'Feeling is put into words, and the words are aimed at a result. Checking in and solving the other person’s problem is how the bond is steered.',
      'caution',
    ))
  }
  if (ketu && (houseOf(ketu.rashi, asc) === 7 || sameSign(ketu, venus))) {
    out.push(note(
      'ketu-silence',
      'Ketu cuts the conversation',
      'The pressure is withdrawal. The person goes silent and becomes unavailable.',
      'caution',
    ))
  }
  if (mars && saturn && houseOf(mars.rashi, asc) === 2 && houseOf(saturn.rashi, asc) === 2) {
    out.push(note(
      'second-weapon',
      'Mars and Saturn in the 2nd',
      'Speech is the weapon. A lie is followed by pressure, and the same old incident is brought back into the next fight.',
      'caution',
    ))
  }
  if (moon?.isCombust) {
    out.push(note(
      'moon-combust',
      'Moon combust',
      'The Moon is under the Sun. The bargain is accepted before it is seen.',
      'caution',
    ))
  }
  if (rahu && houseOf(rahu.rashi, asc) === 1 && (
    (moon != null && RAHU_NAKSHATRA.has(moon.nakshatraIndex))
    || (venus != null && RAHU_NAKSHATRA.has(venus.nakshatraIndex))
  )) {
    out.push(note(
      'rahu-lagna-nak',
      'Rahu on the lagna',
      'Rahu sits on the lagna, and the Moon or Venus is in Rahu’s nakshatra. The charm is practiced, and it is aimed outward.',
      'caution',
    ))
  }
  if (moon?.nakshatraIndex === 8 && sameSign(moon, mercury) && sameSign(moon, ketu)) {
    out.push(note(
      'ashlesha-hold',
      'Ashlesha with Mercury and Ketu',
      'The Moon in Ashlesha, with Mercury and Ketu, studies the other person completely. That knowledge is then used to devalue and to hold. Leaving the pattern is hard.',
      'caution',
    ))
  }
  if (moon?.nakshatraIndex === 17) {
    out.push(note(
      'jyeshtha-options',
      'Moon in Jyeshtha',
      'When pressed, this Moon drops the bond and names someone else who will do the thing.',
      'caution',
    ))
  }
  if (asc === 5 && sun && houseOf(sun.rashi, asc) === 1) {
    out.push(note(
      'sun-leo-lagna',
      'Sun in Leo on the lagna',
      'Duty and position come before the partner. The partner carries that absence.',
      'mixed',
    ))
  }
  const eighthLord = LORDS[signOf(asc, 8)]
  const live = chart.dashas?.vimshottari
    ? getDashaPathAt(chart.dashas.vimshottari).slice(0, 2).map(n => n.lord as GrahaId)
    : []
  if (live.some(id => {
    if (id === eighthLord) return true
    const g = find(chart, id)
    return !!g && houseOf(g.rashi, asc) === 8
  })) {
    out.push(note(
      'eighth-stuck',
      '8th period',
      'The 8th is live. The argument does not resolve. The same complaint returns, and the room feels airless.',
      'caution',
    ))
  }

  const d3Asc = chart.vargaLagnas?.D3
  const d3 = chart.vargas?.D3
  const d3Lord = d3Asc ? d3?.find(g => g.id === LORDS[d3Asc]) : undefined
  if (d3Asc && d3Lord) {
    const h = houseOf(d3Lord.rashi, d3Asc)
    if (h === 4 || h === 5 || h === 6 || h === 7 || h === 8 || h === 12) {
      const seat = h === 6
        ? 'Rivals, coworkers, and the person who handles the money sit on the mind.'
        : h === 4
          ? 'The home and its insecurity sit on the mind.'
          : h === 12
            ? 'What is hidden, and what is lost, sit on the mind.'
            : h === 5
              ? 'Desire sits on the mind.'
              : h === 7
                ? 'The partner sits on the mind.'
                : 'Crisis sits on the mind.'
      out.push(note(
        'd3-control',
        `D3 lagna lord in house ${h}`,
        `In the mind chart the lagna lord has left the lagna. ${seat}`,
        'caution',
      ))
    }
  }
  if (d3Asc && d3?.length) {
    const ju = d3.find(g => g.id === 'Ju')
    if (ju && LORDS[d3Asc] !== 'Ju' && houseOf(ju.rashi, d3Asc) === 6) {
      out.push(note(
        'd3-rival',
        'Jupiter in the D3 6th',
        'Rivals, coworkers, or the person who pays the bill steer the mind.',
        'caution',
      ))
    }
    if (d3Asc === 8 && ju && houseOf(ju.rashi, d3Asc) === 1) {
      out.push(note(
        'd3-guru',
        'Jupiter in a Scorpio D3 lagna',
        'A teacher or a guide figure holds the decisions.',
        'mixed',
      ))
    }
    const d3Venus = d3.find(g => g.id === 'Ve')
    if (d3Asc === 6 && d3Venus && houseOf(d3Venus.rashi, d3Asc) === 1) {
      out.push(note(
        'd3-filter',
        'Venus in a Virgo D3 lagna',
        'Status, and the fear of being judged, filter every bond. Someone who solves money or luxury can steer this mind.',
        'caution',
      ))
    }
    const handle = d3.filter(g => {
      const h = houseOf(g.rashi, d3Asc)
      return (h === 4 || h === 8 || h === 12) && (g.id === 'Ve' || g.id === 'Ra' || g.id === 'Me' || g.id === 'Mo')
    })
    if (handle.length) {
      out.push(note(
        'd3-handle',
        'D3 private houses',
        `${names(handle)} in the 4th, 8th, or 12th of D3 are the handle. Insecurity, crisis, or loss is where the mind can be steered.`,
        'caution',
      ))
    }
  }

  const d4Asc = chart.vargaLagnas?.D4
  const d4 = chart.vargas?.D4
  if (d4Asc && d4?.length) {
    const exposed = d4.filter(g => MALEFICS.has(g.id) && (houseOf(g.rashi, d4Asc) === 1 || houseOf(g.rashi, d4Asc) === 4))
    if (exposed.length) {
      out.push(note(
        'd4-insecure',
        'D4 shows the insecurity',
        `${names(exposed)} on the D4 lagna or its 4th mark the insecurity another person can use.`,
        'caution',
      ))
    }
  }

  const d7Asc = chart.vargaLagnas?.D7
  const d7Lord = d7Asc ? chart.vargas?.D7?.find(g => g.id === LORDS[d7Asc]) : undefined
  if (d7Asc && d7Lord) {
    const h = houseOf(d7Lord.rashi, d7Asc)
    if (h === 5 || h === 7 || h === 8) {
      out.push(note(
        'd7-karmic',
        `D7 lagna lord in house ${h}`,
        'The D7 lagna lord has left the lagna. The person stays emotionally inside that other bond through past merit.',
        'mixed',
      ))
    }
  }
  return out
}

/** Partner lagna in the native's 6th, 8th, or 12th: a crisis helper, not automatically a spouse. */
export function dusthanaLinks(nameA: string, ascA: number, nameB: string, ascB: number): DusthanaLink[] {
  const links: DusthanaLink[] = []
  const one = (nativeName: string, nativeAsc: number, otherName: string, otherAsc: number) => {
    const h = ((otherAsc - nativeAsc + 12) % 12) + 1
    if (h !== 6 && h !== 8 && h !== 12) return
    links.push({
      helper: otherName,
      native: nativeName,
      house: h,
      detail: `${otherName}'s ${RASHI_NAMES[otherAsc as Rashi]} lagna sits in ${nativeName}'s ${h}th. ${otherName} can pull ${nativeName} out of that crisis. As a spouse the same pair stays poor.`,
    })
  }
  one(nameA, ascA, nameB, ascB)
  one(nameB, ascB, nameA, ascA)
  return links
}
