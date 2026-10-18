// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lordshipInterpretations.ts
//  Classical house-lord / Lagna-lord phalita (BPHS-style)
//  Educational paraphrases — not critical-edition text.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import type { ClassicalNote } from './classicalInterpretations'
import type { HouseNumber } from './houseInterpretations'
import { wholeSignHouseFromLagna } from './houseInterpretations'

export const SIGN_LORD_BY_RASHI: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const HOUSE_SHORT: Record<HouseNumber, string> = {
  1: 'self/body',
  2: 'wealth/speech/family',
  3: 'courage/siblings/effort',
  4: 'home/mother/happiness',
  5: 'children/intellect/punya',
  6: 'enemies/disease/service',
  7: 'spouse/partnerships',
  8: 'longevity/occult/obstacles',
  9: 'dharma/father/fortune',
  10: 'career/status/karma',
  11: 'gains/friends/desires',
  12: 'loss/moksha/foreign',
}

const KENDRA = new Set([1, 4, 7, 10])
const TRIKONA = new Set([1, 5, 9])
const DUSTHANA = new Set([6, 8, 12])
const UPACHAYA = new Set([3, 6, 10, 11])

function n(text: string, source: ClassicalNote['source'] = 'BPHS', ref?: string): ClassicalNote {
  return ref ? { source, ref, text } : { source, text }
}

/** Lagna lord in houses 1–12 — core classical + class-teaching reading. */
export const LAGNA_LORD_IN_HOUSE: Record<HouseNumber, ClassicalNote[]> = {
  1: [
    n('Lagna lord in Lagna: strong self-reliance, healthy vitality when unafflicted; native is self-made and protective of identity.', 'BPHS', 'Lagna lord'),
    n('Own-house lagna lord supports longevity of purpose and bodily resilience.', 'Phaladeepika'),
  ],
  2: [
    n('Lagna lord in 2nd: life path through wealth, speech, family duty, and cultural values; earnings tied to personal effort.', 'BPHS', 'Lagna lord'),
    n('2nd colors thought-process and values into mid-life—family atmosphere and traditional frames matter.', 'Phaladeepika', 'Class teaching'),
  ],
  3: [
    n('Lagna lord in 3rd: courage, skills, short travels, and sibling themes shape the life path; self-made through effort.', 'BPHS', 'Lagna lord'),
  ],
  4: [
    n('Lagna lord in 4th: self-made comforts—little comes without effort; education (esp. spiritual texts), intuition, and mother’s blessings support.', 'BPHS', 'Lagna lord'),
    n('Creates own home peace through hard work; property and emotional roots define identity.', 'Phaladeepika', 'Class teaching'),
  ],
  5: [
    n('Lagna lord in 5th: intelligence, mantra, romance, and children color destiny; past-life merit supports the self.', 'BPHS', 'Lagna lord'),
  ],
  6: [
    n('Lagna lord in 6th: life path through service, competition, healing enemies/debts; health vigilance required.', 'BPHS', 'Lagna lord'),
    n('Can conquer rivals through discipline, yet may overwork the body.', 'Phaladeepika'),
  ],
  7: [
    n('Lagna lord in 7th: life transforms after marriage; thought process influenced by spouse; public reputation and principles rise—also tendency to lean on the partner.', 'BPHS', 'Lagna lord'),
    n('Often dislocates from birthplace (travel/settlement through partnerships) regardless of the planet’s soft or hard nature; weigh Rāhu–Ketu carefully.', 'Phaladeepika', 'Class teaching'),
  ],
  8: [
    n('Lagna lord in 8th: transformative life, research/occult bent, sudden turns; longevity and shared resources themes.', 'BPHS', 'Lagna lord'),
    n('Needs regenerative practices; identity rebuilt after crises.', 'JatakaParijata'),
  ],
  9: [
    n('Lagna lord in 9th: fortune through dharma, father, guru, and long journeys; auspicious when strong.', 'BPHS', 'Lagna lord'),
  ],
  10: [
    n('Lagna lord in 10th: continuous work ethic, tough decisions, problem-solving—self-made professional destiny; enjoys challenges.', 'BPHS', 'Lagna lord'),
    n('If Saturn is Lagna lord here: may procrastinate yet still complete work; results can delay but duty persists.', 'Phaladeepika', 'Class teaching'),
  ],
  11: [
    n('Lagna lord in 11th: gains, networks, and desire fulfillment; friends and elder siblings aid the self; result-oriented temperament.', 'BPHS', 'Lagna lord'),
  ],
  12: [
    n('Lagna lord in 12th: expenses, foreign residence, solitude, or moksha lean; identity refined through letting go.', 'BPHS', 'Lagna lord'),
  ],
}

/** High-value special lord-from → lord-to overrides (BPHS-style + class teaching). */
const SPECIAL_LORDSHIP: Partial<Record<string, ClassicalNote[]>> = {
  '2-11': [n('2nd lord in 11th: wealth through gains/networks; strong dhana yoga flavor when unafflicted.', 'BPHS')],
  '11-2': [n('11th lord in 2nd: income consolidates into family assets and speech-based earnings.', 'BPHS')],
  '9-10': [n('9th lord in 10th: dharma supports karma — classic raja-yoga / dharma-karmādhipati pathway (with 10th strength).', 'BPHS')],
  '10-9': [n('10th lord in 9th: career aligned with fortune/guru/father; slow steady ethical rise (dharma-karmādhipati).', 'BPHS')],
  '5-9': [n('5th lord in 9th: intelligence meets fortune — counsel, mantra, children blessing dharma.', 'BPHS')],
  '9-5': [n('9th lord in 5th: fortune through children, creativity, and past-life merit; education supported when unafflicted.', 'BPHS')],
  '4-10': [n('4th lord in 10th: excellent — aspects own house; government/admin benefit, mother’s longevity, business rise.', 'BPHS', 'Class teaching')],
  '10-4': [n('10th lord in 4th: work-from-home / property / family-business karmas; nurturing duty with testing of neediness.', 'BPHS', 'Class teaching')],
  '4-6': [n('4th lord in 6th: property via disputes; competition and education blocks; domestic happiness under envy pressure.', 'BPHS', 'Class teaching')],
  '4-8': [n('4th lord in 8th: mokṣa-leaning comforts fade; parental/family strain with spiritual depth.', 'BPHS', 'Class teaching')],
  '4-12': [n('4th lord in 12th: worldly comforts hard to hold; foreign/ashram tilt; parental distance themes.', 'BPHS', 'Class teaching')],
  '4-7': [n('4th lord in 7th: home happiness sought through spouse; vehicles/property via partnership.', 'BPHS')],
  '5-5': [n('5th lord in 5th: pūrva-puṇya amplified — fortune and ease when unafflicted; blessings magnify with benefics.', 'BPHS', 'Class teaching')],
  '5-8': [n('5th lord in 8th: progeny/education struggles possible; research depth and eventual success with effort.', 'BPHS', 'Class teaching')],
  '5-11': [n('5th lord in 11th: gains via intellect, children, speculation, creative networks.', 'BPHS')],
  '11-5': [n('11th lord in 5th: friends/gains support romance, education, and progeny; multi-income logic — caution if malefic+8th (speculation excess).', 'BPHS', 'Class teaching')],
  '6-1': [n('6th lord in Lagna: administrative drive and earning focus; often fewer idle illnesses than peers when strong.', 'BPHS', 'Class teaching')],
  '6-2': [n('6th lord in 2nd: speech/teeth tension, family stress, theft anxiety if afflicted; weak Venus here can delay settled family life.', 'BPHS', 'Class teaching')],
  '6-5': [n('6th lord in 5th: maternal-family support when benefic; afflicted — education/childbirth friction.', 'BPHS', 'Class teaching')],
  '6-10': [n('6th lord in 10th: unstable career, transfers, conflict-heavy roles (collection, litigation, competitive service).', 'BPHS', 'Class teaching')],
  '6-7': [n('6th lord in 7th: disputes enter marriage/partnerships; healing through conscious relating.', 'BPHS')],
  '6-8': [n('6th lord in 8th: dusthana interchange — Viparīta-leaning if lords strong; crises that cure.', 'BPHS')],
  '6-11': [n('6th lord in 11th with 11th in 6th: politics / strategist flavor — gains through contest.', 'BPHS', 'Class teaching')],
  '7-1': [n('7th lord in Lagna: spouse/partner strongly colors personality; known-circle marriage possible; becomes partner’s shadow.', 'BPHS', 'Class teaching')],
  '7-2': [n('7th lord in 2nd: desire colors speech/values; if severely afflicted (esp. also 11th themes), livelihood ethics need vigilance.', 'BPHS', 'Class teaching')],
  '7-3': [n('7th lord in 3rd: struggle phases in marriage; boundary caution with relatives.', 'BPHS', 'Class teaching')],
  '7-4': [n('7th lord in 4th: spouse brings comfort; children often supported; home-centered marriage.', 'BPHS', 'Class teaching')],
  '7-5': [n('7th lord in 5th: love-marriage / early marriage lean; partner may be slightly less resourced — needs 11th support.', 'BPHS', 'Class teaching')],
  '7-6': [n('7th lord in 6th: strong cousin bonds; delay in marriage possible (Jupiter aspect softens); male charts — check Venus for fertility stress.', 'BPHS', 'Class teaching')],
  '7-7': [n('7th lord in 7th: Phaladīpikā — good spouse even if malefic lord; prolonged search (many proposals) before settling.', 'Phaladeepika', 'Class teaching')],
  '7-8': [n('7th lord in 8th: financial gain via marriage likely; early married-life tests; partner age-gap clues.', 'BPHS', 'Class teaching')],
  '7-9': [n('7th lord in 9th: male charts often excellent partner; female charts need sensitive reading of husband’s private life.', 'BPHS', 'Class teaching')],
  '7-10': [n('7th lord in 10th: partner supports career; growth after marriage; agency/foreign professional links.', 'BPHS', 'Class teaching')],
  '7-11': [n('7th lord in 11th: good partner with possible private emotional bond beyond public marriage narrative — judge compassionately.', 'BPHS', 'Class teaching')],
  '7-12': [n('7th lord in 12th: more than one significant bond possible; delay, death-related separation, or extreme wait — never predict from this alone.', 'BPHS', 'Class teaching')],
  '1-7': [n('Lagna/1st themes in 7th via 1st lord: life path through partners (see also Lagna lord table).', 'BPHS')],
  '8-1': [n('8th lord in Lagna: secretive mind, health/injury vigilance; modern charts may still give influence if dignity is strong.', 'BPHS', 'Class teaching')],
  '8-2': [n('8th lord in 2nd: ancestral property, investments, insurance/banking gains; speech may carry secrecy.', 'BPHS', 'Class teaching')],
  '8-3': [n('8th lord in 3rd: strong intuition and travel transformation; father-health vigilance (3rd as father’s maraka) after childhood.', 'BPHS', 'Class teaching')],
  '8-4': [n('8th lord in 4th: ancestral property with legal/ruin risk; handle ancestral rites with liberation intent, not binding.', 'BPHS', 'Class teaching')],
  '8-5': [n('8th lord in 5th: childbirth/education obstacles with deep-study capacity; speculation luck if 5th–8th linked.', 'BPHS', 'Class teaching')],
  '8-6': [n('8th lord in 6th: enemies defeated; childhood poison/accident caution; debts/disease follow planetary condition.', 'BPHS', 'Class teaching')],
  '8-7': [n('8th lord in 7th: marriage turbulence and sudden relationship turns; partnership caution; second bond possible.', 'BPHS', 'Class teaching')],
  '8-8': [n('8th lord in 8th: longevity rises; restless occult pull — rarely lets the native “rest.”', 'BPHS', 'Class teaching')],
  '8-9': [n('8th lord in 9th: clever political mind, occult family line, father happiness mixed; help arrives oddly from crises.', 'BPHS', 'Class teaching')],
  '8-10': [n('8th lord in 10th: research/intelligence careers; blame, transfers, and career breaks as check-post karma.', 'BPHS', 'Class teaching')],
  '8-11': [n('8th lord in 11th: late recognition — struggle before ~50, then sudden gains (classic late-bloomer pattern).', 'BPHS', 'Class teaching')],
  '8-12': [n('8th lord in 12th: hospital/medical or deep mokṣa path; high spiritual growth often invisible publicly.', 'BPHS', 'Class teaching')],
  '9-1': [n('9th lord in Lagna: early maturity, father’s imprint, influential dharmic personality; rise or fall after father’s events by dignity.', 'BPHS', 'Class teaching')],
  '9-2': [n('9th lord in 2nd: dharma fuels money; family financial burden accepted leads to progress; paternal property litigation common.', 'BPHS', 'Class teaching')],
  '9-3': [n('9th lord in 3rd: fortune via spouse support, skills, pilgrimage/travel; self-effort with father’s blessing.', 'BPHS', 'Class teaching')],
  '9-4': [n('9th lord in 4th: father–mother role blend; vehicles/property from father when benefic; childhood teachings become life quotes.', 'BPHS', 'Class teaching')],
  '9-6': [n('9th lord in 6th: judicial/service path (Saturn support for judge); give-and-take hospitality karma.', 'BPHS', 'Class teaching')],
  '9-7': [n('9th lord in 7th: inter-community marriage lean; rise or fall after marriage by planet quality; abroad after marriage possible.', 'BPHS', 'Class teaching')],
  '9-8': [n('9th lord in 8th: occult family line, father distance/health; adoption indication if 8↔9 exchange — not automatic.', 'BPHS', 'Class teaching')],
  '9-9': [n('9th lord in 9th: strong luck and travel; father’s profession fruitful if followed; political visibility when supported.', 'BPHS', 'Class teaching')],
  '9-11': [n('9th lord in 11th: family business, influential father; Mercury/Jupiter strong — institution/book building.', 'BPHS', 'Class teaching')],
  '9-12': [n('9th lord in 12th: dharma in mokṣa house — foreign company work, hospital/death-related service, or yogic withdrawal; confirm foreign yoga separately.', 'BPHS', 'Class teaching')],
  '10-1': [n('10th lord in Lagna: cannot sit idle — action identity; Saturn as 10th lord swings workaholic ↔ extreme laziness.', 'BPHS', 'Class teaching')],
  '10-2': [n('10th lord in 2nd: karmas tied to family business/resources — rise, wipeout, or status-quo by strength.', 'BPHS', 'Class teaching')],
  '10-3': [n('10th lord in 3rd: passion vs career choices; malefics in upachaya can excel in mahādasha through hard work.', 'BPHS', 'Class teaching')],
  '10-5': [n('10th lord in 5th: education obstacles then rājayoga-leaning recognition.', 'BPHS', 'Class teaching')],
  '10-6': [n('10th lord in 6th: livelihood via conflict fields — law, police, competitive service.', 'BPHS', 'Class teaching')],
  '10-8': [n('10th lord in 8th: career instability unless profession uses 8th themes (research, insurance, occult, PhD mentorship).', 'BPHS', 'Class teaching')],
  '10-11': [n('10th lord in 11th: auspicious for gains, fame, and desire fulfillment through work.', 'BPHS')],
  '10-12': [n('10th lord in 12th: earning linked to foreign / out-of-home bases — check whether abroad, other state, or other city.', 'BPHS', 'Class teaching')],
  '11-1': [n('11th lord in Lagna: result-oriented self; strong support system; spends on self-presentation.', 'BPHS', 'Class teaching')],
  '11-3': [n('11th lord in 3rd: gains through hard work and hobbies; results with obstacles more than easy 1st/2nd placements.', 'BPHS', 'Class teaching')],
  '11-4': [n('11th lord in 4th: multiplies property/mother comforts — 11th as multiplication of 4th themes.', 'BPHS', 'Class teaching')],
  '11-6': [n('11th lord in 6th: medical/legal/political contest gains; enemies in earnings if afflicted.', 'BPHS', 'Class teaching')],
  '11-7': [n('11th lord in 7th: networking marriage; wealth via spouse possible; private bonds need maturity to interpret.', 'BPHS', 'Class teaching')],
  '11-8': [n('11th lord in 8th: sudden unexpected gains; calamity/theft risk if malefic — speculation if 5th linked.', 'BPHS', 'Class teaching')],
  '11-9': [n('11th lord in 9th: supportive fortune–gains link.', 'BPHS')],
  '11-10': [n('11th lord in 10th: fame, name, and money through karma.', 'BPHS')],
  '11-11': [n('11th lord in 11th: own-house gains — desires and networks stand firmly when strong.', 'BPHS')],
  '11-12': [n('11th lord in 12th: life U-turn after foreign/isolation; earnings recycle into expenses; one crisis can reset built gains.', 'BPHS', 'Class teaching')],
  '12-4': [n('12th lord in 4th: spend on home/vehicles without lasting satisfaction, care for mother/home from distance, or foreign house — not automatic migration.', 'BPHS', 'Class teaching')],
  '12-6': [n('12th lord in 6th: foreign/service mix; expenses conquer obstacles when directed.', 'BPHS')],
  '12-9': [n('12th lord in 9th: foreign dharma, expenses on pilgrimage/guru; moksha through faith.', 'BPHS')],
  '3-10': [n('3rd lord in 10th: courage and skills fuel career; fame via effort/media/hands.', 'BPHS')],
  '5-1': [n('5th lord in Lagna: intelligent, creative self; children/romance imprint personality.', 'BPHS')],
  '2-8': [n('2nd lord in 8th: family resources via spouse wealth, insurance, research; delayed savings.', 'BPHS')],
}

function categoryNote(from: HouseNumber, to: HouseNumber): ClassicalNote {
  if (from === to) {
    return n(
      `Lord of ${from} in own house (${from}): significations of ${HOUSE_SHORT[from]} stand firmly when the lord is strong and unafflicted.`,
      'BPHS',
      'Own house',
    )
  }
  if (KENDRA.has(to) && TRIKONA.has(from)) {
    return n(
      `Lord of trikona ${from} (${HOUSE_SHORT[from]}) in kendra ${to}: classical yoga pathway — fortune supports action.`,
      'BPHS',
      'Kendra-Trikona',
    )
  }
  if (TRIKONA.has(to) && KENDRA.has(from)) {
    return n(
      `Lord of kendra ${from} (${HOUSE_SHORT[from]}) in trikona ${to}: karma elevated by dharma/intelligence/fortune.`,
      'BPHS',
      'Kendra-Trikona',
    )
  }
  if (DUSTHANA.has(from) && DUSTHANA.has(to) && from !== to) {
    return n(
      `Dusthāna lord of ${from} in dusthāna ${to}: Viparīta-leaning if both lords strong — crises that reverse into power.`,
      'BPHS',
      'Viparīta',
    )
  }
  if (DUSTHANA.has(to) && !DUSTHANA.has(from)) {
    return n(
      `Lord of ${from} (${HOUSE_SHORT[from]}) in dusthāna ${to}: that life area meets obstacles, service, secrecy, or loss — results after effort.`,
      'BPHS',
    )
  }
  if (UPACHAYA.has(to) && from !== to) {
    return n(
      `Lord of ${from} (${HOUSE_SHORT[from]}) in upachaya ${to}: growth through effort over time in ${HOUSE_SHORT[to]}.`,
      'BPHS',
      'Upachaya',
    )
  }
  return n(
    `Lord of ${from} (${HOUSE_SHORT[from]}) in house ${to} (${HOUSE_SHORT[to]}): joins the agenda of house ${from} with the field of house ${to}. Judge dignity, aspects, and dispositor.`,
    'BPHS',
    'Lordship',
  )
}

export function getHouseLordInHouse(fromHouse: number, toHouse: number): ClassicalNote[] {
  if (fromHouse < 1 || fromHouse > 12 || toHouse < 1 || toHouse > 12) return []
  const key = `${fromHouse}-${toHouse}`
  const special = SPECIAL_LORDSHIP[key]
  if (special) return special
  return [categoryNote(fromHouse as HouseNumber, toHouse as HouseNumber)]
}

export function getLagnaLordInHouse(house: number): ClassicalNote[] {
  if (house < 1 || house > 12) return []
  return LAGNA_LORD_IN_HOUSE[house as HouseNumber] ?? []
}

export function rashiOfHouse(ascRashi: Rashi, house: HouseNumber): Rashi {
  return ((((ascRashi - 1 + house - 1) % 12) + 1) as Rashi)
}

export function lordOfHouse(ascRashi: Rashi, house: HouseNumber): GrahaId {
  return SIGN_LORD_BY_RASHI[rashiOfHouse(ascRashi, house)]
}

export interface LordshipPlacement {
  ownedHouse: HouseNumber
  lordId: GrahaId
  placedIn: HouseNumber
  lordRashi: Rashi
  notes: ClassicalNote[]
  isLagnaLord: boolean
}

/** Compute all 12 house-lord placements for a chart (whole-sign). */
export function getChartLordships(
  ascRashi: Rashi,
  grahas: { id: GrahaId; rashi: Rashi }[],
): LordshipPlacement[] {
  const out: LordshipPlacement[] = []
  for (let h = 1; h <= 12; h++) {
    const owned = h as HouseNumber
    const lordId = lordOfHouse(ascRashi, owned)
    const lord = grahas.find((g) => g.id === lordId)
    if (!lord) continue
    const placedIn = wholeSignHouseFromLagna(ascRashi, lord.rashi) as HouseNumber
    const isLagnaLord = owned === 1
    const notes = isLagnaLord
      ? getLagnaLordInHouse(placedIn)
      : getHouseLordInHouse(owned, placedIn)
    out.push({
      ownedHouse: owned,
      lordId,
      placedIn,
      lordRashi: lord.rashi,
      notes,
      isLagnaLord,
    })
  }
  return out
}
