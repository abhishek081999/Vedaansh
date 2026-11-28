// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaPlanetEssentials.ts
//  Planet essentials for praśna: dignities, the classical planet tables
//  (sex, mobility, trees, avasthas, strength, directions, humours, remedies,
//  deities, time, aspects, friendship, dhatu / mula / jeeva …), each planet's
//  significations at a glance, dwelling places, mrityu and pushkara bhaga,
//  and readings from the prashna chart. Curated from class notes and a
//  praśna text; class chatter and moral judgements were left out.
//  Table cells may carry tokens: {Su} … {Ke} for planets, {r1} … {r12} for signs.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import type { EngineLang } from './lang'
import {
  PLANET_DIGNITY_TEXT_HI,
  PLANET_DWELLING_HI,
  PLANET_GLANCE_HI,
  PLANET_TABLES_HI,
  PLANET_BHAGA_TEXT_HI,
} from './locale/prashnaPlanetEssentials.hi'

export const PLANETS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

/** Replace {Su} / {r5} tokens with names in the given language. */
export function expandTokens(s: string, lang: EngineLang = 'en'): string {
  return s.replace(/\{(r(\d{1,2})|[A-Z][a-z])\}/g, (_, tok: string, r?: string) => {
    if (r) return lang === 'hi' ? RASHI_HI[Number(r) as Rashi] : RASHI_NAMES[Number(r) as Rashi]
    const g = tok as GrahaId
    return lang === 'hi' ? GRAHA_HI[g] ?? g : GRAHA_NAMES[g] ?? g
  })
}

// ── Generic tables ─────────────────────────────────────────

export interface PlanetTable {
  id: string
  title: string
  intro?: string
  head: string[]
  rows: string[][]
  notes?: string[]
}

const T = (id: string, title: string, head: string[], rows: string[][], extra: { intro?: string; notes?: string[] } = {}): PlanetTable =>
  ({ id, title, head, rows, ...extra })

export const PLANET_TABLES: PlanetTable[] = [
  T('nature', 'Natural benefics and malefics', ['Classification', 'Planets'], [
    ['Natural benefics', '{Ju}, {Ve}, {Me}, {Mo}'],
    ['Natural malefics', '{Su}, {Ma}, {Sa}, {Ra}, {Ke}'],
  ], { notes: [
    'Mercury is malefic when joined with malefics, otherwise not.',
    'The Moon is benefic from shukla ashtami to krishna saptami, and malefic from krishna ashtami to shukla saptami.',
    'The Sun is cruel (krura).',
  ] }),
  T('sex', 'Sex', ['Sex', 'Planets'], [
    ['Female', '{Mo}, {Ve}, {Ra}'],
    ['Male', '{Su}, {Ma}, {Ju}'],
    ['Eunuch', '{Me}, {Sa}, {Ke}'],
    ['Human', '{Ju}, {Ve}'],
  ], { notes: ['Eunuch planets give neutral results. When results are mixed, the majority decides the sex of the thief, the child and so on.'] }),
  T('mobility', 'Mobility', ['Mobility', 'Planets'], [
    ['Movable', '{Mo}, {Ma}, {Ve}, {Ra}'],
    ['Fixed', '{Su}, {Ju}, {Sa}'],
    ['Dual', '{Me}'],
  ]),
  T('avastha', 'Avasthas (states of planets)', ['Avastha', 'Condition', 'In praśna'], [
    ['Deepta', 'In its exaltation sign', 'In its exaltation sign'],
    ['Swastha (healthy)', 'In its own sign', 'In its own sign'],
    ['Mudita', 'In a friend\'s sign', 'In a friend\'s sign'],
    ['Shanta', 'In the vargas of benefic planets', 'In the divisional charts of benefic planets'],
    ['Shakta', 'Bright, heliacally rising and not combust', 'Has light and strength and is not combust; it is near the Sun, so check the degrees'],
    ['Peedita', 'Combust', 'Combust (Mercury often is)'],
    ['Deena', 'In its debilitation sign', 'In its debilitation sign'],
    ['Khala', 'Defeated in planetary war', 'In an enemy sign, or without the strength to fight; the loser of a planetary war will use any means (saam, daam, dand, bhay)'],
    ['Vikala', 'Joined with malefic planets', 'In an enemy sign, or with cruel (malefic) planets'],
    ['Bheeta', 'Heliacally set', 'Combust with the Sun, within about 10° of it'],
  ], { notes: [
    'Scholars classify avasthas in several ways. Retrogression has no place in these ten. In praśna a retrograde planet shows repetition, cancellation or failure, depending on the other influences.',
    'Seen from Earth, a planet too close to the Sun cannot be seen with the naked eye: it is heliacally set. When it moves away and becomes visible it is heliacally rising.',
    'Peedita and Bheeta both describe a combust planet. Combustion limits: Saturn about 15° from the Sun, Venus about 10–12°.',
  ] }),
  T('dayNight', 'Strength by day or night', ['Strength', 'Planets'], [
    ['Strong by day (divabali)', '{Su}, {Ju}, {Ve}'],
    ['Strong at night (ratribali)', '{Mo}, {Ma}, {Sa}'],
    ['Always strong (sarvabali)', '{Me}'],
  ]),
  T('eventTime', 'Time of the event', ['Planets in or aspecting the Lagna', 'Time'], [
    ['{Me}, {Ju}', 'Morning'],
    ['{Su}, {Ma}', 'Noon'],
    ['{Ve}, {Mo}', 'Afternoon'],
    ['{Sa}, {Ra}', 'Evening'],
  ], { intro: 'Planets in the Lagna or aspecting it show the time of the event, since they are strong.' }),
  T('pakshaAyana', 'Strength by paksha and ayana', ['Period', 'Strong planets'], [
    ['Shukla paksha (bright half)', 'Benefics'],
    ['Krishna paksha (dark half)', 'Malefics'],
    ['Uttarayana', 'Benefics'],
    ['Dakshinayana', 'Malefics'],
  ]),
  T('digbala', 'Directional strength', ['Position', 'Planets'], [
    ['In the Lagna', '{Ju}, {Me}'],
    ['In the 4th house', '{Mo}, {Ve}'],
    ['In the 7th house', '{Sa}'],
    ['In the 10th house', '{Su}, {Ma}'],
  ]),
  T('lords', 'Strength of lords', ['Lord', 'Strong for'], [
    ['Lord of the year: lord of Chaitra shukla pratipada, the first day of the Hindu year', 'The whole year'],
    ['Lord of the month: lord of the pratipada of each month (shukladi system)', 'The whole month'],
    ['Lord of the weekday', 'That weekday'],
    ['Lord of the hora', 'Of great importance in praśna'],
  ]),
  T('direction', 'Directions', ['Direction', 'Planet'], [
    ['East (Purva)', '{Su}'],
    ['South-East (Agneya)', '{Ve}'],
    ['South (Dakshin)', '{Ma}'],
    ['South-West (Nairitya)', '{Ra}, {Ke}'],
    ['West (Paschim)', '{Sa}'],
    ['North-West (Vayavya)', '{Mo}'],
    ['North (Uttar)', '{Me}'],
    ['North-East (Ishan)', '{Ju}'],
  ]),
  T('colour', 'Colours', ['Planet', 'Colour', 'Colour of clothes'], [
    ['{Su}', 'Dark red', 'Saffron'],
    ['{Mo}', 'White', 'White'],
    ['{Ma}', 'Light red', 'Red or burnt'],
    ['{Me}', 'Green', 'Green'],
    ['{Ju}', 'Golden', 'Yellow'],
    ['{Ve}', 'Blue', 'White'],
    ['{Sa}', 'Black', 'Black, old, worn out'],
    ['{Ra}, {Ke}', 'Variegated, black', 'Black or variegated'],
  ]),
  T('caste', 'Caste', ['Caste', 'Planets'], [
    ['Brahmin', '{Ju}, {Ve}'],
    ['Kshatriya', '{Su}, {Ma}'],
    ['Vaishya', '{Mo}'],
    ['Shudra', '{Me}'],
    ['Outcaste (mlechha)', '{Sa}'],
  ]),
  T('guna', 'Guna', ['Planets', 'Guna', 'Nature'], [
    ['{Su}, {Mo}, {Ju}', 'Sattvik', 'Philosophic or philanthropic'],
    ['{Me}, {Ve}', 'Rajasik', 'Imperious'],
    ['{Ma}, {Sa}, {Ra}, {Ke}', 'Tamasik', 'Mild and lazy'],
  ]),
  T('status', 'Status', ['Planet', 'Status'], [
    ['{Su}, {Mo}', 'King'],
    ['{Ma}', 'Commander'],
    ['{Me}', 'Heir to the throne'],
    ['{Ju}, {Ve}', 'Ministers'],
    ['{Sa}', 'Servant'],
    ['{Ra}, {Ke}', 'Defence personnel'],
  ]),
  T('shape', 'Shapes', ['Planet', 'Shape'], [
    ['{Mo}', 'Round and fat'],
    ['{Ve}', 'Lean but beautiful'],
    ['{Su}, {Ma}', 'Square'],
    ['{Ju}, {Me}', 'Round'],
    ['{Sa}, {Ra}', 'Long'],
  ]),
  T('tattva', 'Tattva (element)', ['Planet', 'Tattva'], [
    ['{Su}, {Ma}', 'Fire (agni)'],
    ['{Mo}, {Ve}', 'Water (jal)'],
    ['{Me}', 'Earth (prithvi)'],
    ['{Ju}', 'Ether (akash)'],
    ['{Sa}, {Ra}', 'Air (vayu)'],
  ]),
  T('taste', 'Taste', ['Planet', 'Taste (text)', 'Taste (another view)'], [
    ['{Su}', 'Bitter-spicy', 'Bitter'],
    ['{Mo}', 'Salty', 'Salty'],
    ['{Ma}', 'Bitter-spicy', 'Spicy, bitter'],
    ['{Me}', 'Astringent', 'Sweet-sour'],
    ['{Ju}', 'Sweet', 'Sweet'],
    ['{Ve}', 'Sour', 'Sour'],
    ['{Sa}', 'Pungent', 'Astringent'],
    ['{Ra}', 'Pungent', 'Astringent, poisonous'],
    ['{Ke}', '–', 'Like Rahu, milder'],
  ]),
  T('trees', 'Trees', ['Type of tree', 'Planet'], [
    ['Strong and tall trees', '{Su}'],
    ['Trees that ooze liquids, such as resin', '{Mo}'],
    ['Rough and thorny shrubs', '{Ma}'],
    ['Creepers', '{Mo}, {Ve}'],
    ['Trees that bear fruit or food', '{Ju}'],
    ['Trees that bear no fruit', '{Me}'],
    ['Trees with beautiful flowers', '{Ve}'],
    ['Thorny or useless trees', '{Sa}'],
    ['Bushes, clumps of old dead trees', '{Ra}, {Ke}'],
  ]),
  T('grain', 'Grains', ['Planet', 'Grain', 'Hindi name'], [
    ['{Su}', 'Wheat', 'Kanak, gehun'],
    ['{Mo}', 'Rice', 'Chawal'],
    ['{Ma}', 'Pulses, red gram', 'Dal, arhar'],
    ['{Me}', 'Green gram', 'Moong'],
    ['{Ju}', 'Bengal gram', 'Kabuli chana'],
    ['{Ve}', 'Cow gram', 'Lobia'],
    ['{Sa}', 'Sesame or black grains', 'Til, kale anaj'],
    ['{Ra}', 'Black gram', 'Kala chana'],
    ['{Ke}', 'Horse gram', 'Kulthi'],
  ]),
  T('time', 'Time and season', ['Planet', 'Period', 'Season'], [
    ['{Su}', 'One ayana (six months)', 'Summer (grishma)'],
    ['{Mo}', 'One muhurta (48 minutes)', 'Rainy (varsha)'],
    ['{Ma}', 'A day and night (ahoratra)', 'Summer (grishma)'],
    ['{Me}', 'A season (two months)', 'Autumn (hemanta)'],
    ['{Ju}', 'One month', 'Winter (sharad)'],
    ['{Ve}', 'One paksha', 'Spring (vasanta)'],
    ['{Sa}', 'One year', 'Winter (shishir)'],
    ['{Ra}', '8 months', '–'],
    ['{Ke}', '3 months', '–'],
  ], { notes: ['Use these periods to time when something will happen or when someone will return. Some take Ketu as 5 months.'] }),
  T('age', 'Ages', ['Planet', 'Age'], [
    ['{Me}', '7 years'],
    ['{Ma}', '16 years'],
    ['{Ve}', '20 years'],
    ['{Ju}', '30 years'],
    ['{Su}', '50 years'],
    ['{Mo}', '70 years'],
    ['{Sa}, {Ra}', '100 years'],
  ]),
  T('aspect', 'Aspects', ['Planet', 'Aspects houses'], [
    ['{Ju}', '5, 7, 9'],
    ['{Ma}', '4, 7, 8'],
    ['{Sa}', '3, 7, 10'],
    ['All other planets', '7'],
  ], { intro: 'Every planet aspects the 7th house from itself. Jupiter, Mars and Saturn have special aspects as well.' }),
  T('aspectDirection', 'Direction of the look', ['Planets', 'Look', 'Place or direction'], [
    ['{Su}, {Ma}', 'Urdhvadrishti', 'Looking up: roof, height'],
    ['{Sa}, {Ra}', 'Adhodrishti', 'Looking down: underground, basement'],
    ['{Me}, {Ve}', 'Tiryakdrishti', 'Looking sideways: oblique direction, corner of a wall'],
    ['{Mo}, {Ju}', 'Samadrishti (agradrishti)', 'Looking level: floor, level with the ground'],
  ]),
  T('tajik', 'Tajik aspects', ['Type', 'Sub-type', 'Houses'], [
    ['Friendly', 'Openly friendly', '5, 9'],
    ['Friendly', 'Secretly friendly', '3, 11'],
    ['Inimical', 'Openly inimical', '1, 7'],
    ['Inimical', 'Secretly inimical', '4, 10'],
    ['Neutral', 'No aspect', '2, 6, 8, 12'],
  ], { notes: ['Tajik aspects are needed only to form Tajik yogas. Otherwise use Parashari aspects alone in praśna analysis.'] }),
  T('friendship', 'Friendship', ['Group', 'Planets'], [
    ['Group I', '{Su}, {Mo}, {Ma}, {Ju}, {Ke}'],
    ['Group II', '{Me}, {Ve}, {Sa}, {Ra}'],
  ], {
    intro: 'Natural friendship is read from the mooltrikona sign: lords of the 2nd, 4th, 5th, 8th, 9th and 12th from it are friends, the rest enemies, and a planet that is both is neutral. Temporary friends sit in the 10th, 11th, 12th, 2nd, 3rd or 4th from a planet. Their blend (panchadha maitri) is not generally used in praśna; group friendship is used instead.',
    notes: ['Planets in the same group are friends; planets in the other group are enemies.'],
  }),
  T('bodyPart', 'Parts of the body (dhatus)', ['Planet', 'Body part'], [
    ['{Su}', 'Bones'],
    ['{Mo}', 'Blood'],
    ['{Ma}', 'Marrow'],
    ['{Me}', 'Skin'],
    ['{Ju}', 'Fat'],
    ['{Ve}', 'Semen'],
    ['{Sa}', 'Nerves and muscles'],
    ['{Ra}, {Ke}', 'Bones and feet'],
  ], { notes: ['The Sun also rules the heart, and Venus the kidneys and reproductive organs.'] }),
  T('humour', 'Vaat, pitta and kapha', ['Planet', 'Humour', 'Diseases'], [
    ['{Su}, {Ma}', 'Pitta', 'Fever, diarrhoea and dysentery, stomach disorders, high blood pressure, headaches'],
    ['{Mo}, {Ve}', 'Kapha', 'Cough and cold, pneumonia, bronchitis, asthma, constipation, jaundice'],
    ['{Sa}, {Ra}', 'Vaat', 'Gastric trouble, paralysis, rheumatism, body and joint pains, boils and ulcers'],
    ['{Me}, {Ju}', 'All three', 'Imbalance of all three humours: several diseases, nervous disorders'],
  ], { intro: 'Planets influencing the Lagna, the Lagna lord, the 6th house or the 6th lord show these humours and the diseases their imbalance brings. Traditional indications only, not medical advice.' }),
  T('remedy', 'Remedies', ['Planet', 'Mantra', 'Gem', 'Offerings (daan)'], [
    ['{Su}', 'ॐ सूर्याय नमः', 'Ruby', 'Gold, brass, wheat, red clothes, jaggery'],
    ['{Mo}', 'ॐ चं चन्द्राय नमः', 'Pearl', 'Silver, rice, white clothes, sugar, curd'],
    ['{Ma}', 'ॐ भुं भौमाय नमः', 'Coral', 'Red cloth, wheat, gold, copper, masoor'],
    ['{Me}', 'ॐ बुं बुधाय नमः', 'Emerald', 'Whole green gram, green clothes'],
    ['{Ju}', 'ॐ बृं बृहस्पतये नमः', 'Topaz', 'Gold, yellow clothes, tamarind, gram'],
    ['{Ve}', 'ॐ शुं शुक्राय नमः', 'Diamond', 'Silver, rice, milk, mishri'],
    ['{Sa}', 'ॐ शं शनैश्चराय नमः', 'Blue sapphire', 'Iron, mustard oil, whole urad, til, buffalo, black clothes, kulthi'],
    ['{Ra}', 'ॐ रां राहवे नमः', 'Gomedh', 'Blanket, til, oil, wheat, blue clothes'],
    ['{Ke}', 'ॐ कें केतवे नमः', 'Cat\'s eye', 'An instrument, til, black clothes, coconut, seven grains (urad, moong, wheat, gram, barley, rice, kangni)'],
  ], { intro: 'Ayurvedic texts give remedies for the humours. Astrologically, a dosha-causing planet is propitiated with mantra, yantra, tantra, gems, herbs, charity, bathing, fasting, puja, kavach path, japa, colour therapy and the like.' }),
  T('deity', 'Deities', ['Placement', 'Deity'], [
    ['{Su}', 'Shiva'],
    ['{Su} in the 1st drekkana of a dual sign', 'Subrahmanya'],
    ['{Su} in the 2nd drekkana of a dual sign', 'Ganesha'],
    ['{Mo} strong', 'Durga'],
    ['{Mo} weak', 'Kali'],
    ['{Mo} weak, or in a sign of Mars', 'Chamunda'],
    ['{Ma} in {r5} or {r9} (sattvik odd signs)', 'Subrahmanya'],
    ['{Ma} in {r1}, {r3}, {r7} or {r11} (other odd signs)', 'Bhairava'],
    ['{Ma} in an even sign', 'Chamunda, Kali'],
    ['{Me} in a movable or dual sign', 'Avatars of Vishnu'],
    ['{Me} in the 1st or 2nd drekkana of a fixed sign', 'Krishna'],
    ['{Me} in the 3rd drekkana of a fixed sign', 'Vishnu'],
    ['{Ju}', 'Vishnu'],
    ['{Ve}', 'Lakshmi'],
    ['{Ve} in sattvik signs and own houses', 'Annapurna'],
    ['{Ve} in rajasik signs and benefic houses', 'Lakshmi'],
    ['{Ve} in tamasik signs and malefic houses', 'Yakshi'],
    ['{Ve} in odd houses with male planets', 'Ganesha'],
    ['{Sa}', 'Ayyappa (both Shiva and Vishnu)'],
    ['{Ra}', 'Serpents'],
    ['{Ke}', 'Ganesha'],
  ], { notes: [
    'Mercury also takes the deity of the planet it joins.',
    'The ten avatars of Vishnu: Matsya, Kurma, Varaha, Narasimha, Vamana, Parashurama, Rama, Balarama, Buddha and Kalki.',
    'A strong Moon (exalted, full, or in shukla paksha from ashtami onwards) points to Krishna, Durga or Parvati. A weak Moon (in Scorpio, in krishna paksha or on amavasya, or joined or aspected by Rahu or Saturn) points to Chamunda or Kali.',
    'Mars in {r1}, {r3}, {r7} or {r11} can point to Hanuman; otherwise to fierce forms such as Bhairava or Chamunda.',
    'These praśna deities, used for remedies and upasana, are separate from the Ishta devata; do not mix the two. The deity changes with the sign, so check the sign before suggesting a remedy.',
  ] }),
  T('death', 'Cause of death', ['Planet', 'Cause'], [
    ['{Su}', 'Fire'],
    ['{Mo}', 'Drowning'],
    ['{Ma}', 'Weapons or accident'],
    ['{Me}', 'High fever'],
    ['{Ju}', 'Disease'],
    ['{Ve}', 'Thirst or sexual disease'],
    ['{Sa}', 'Hunger or sudden death'],
    ['{Ra}', 'Poison or faulty medicine'],
  ], { intro: 'Planets in the 8th, or influencing it, show the cause of death. Also weigh the 22nd drekkana, 64th navamsha and 85th dwadashamsha and their lords. For a peaceful or unhappy death, see the 7th from Mandi in the navamsha: a benefic there gives a peaceful death.' }),
  T('dmj', 'Dhatu, mula, jeeva', ['Category', 'Planets'], [
    ['Dhatu (mineral)', '{Mo}, {Ma}, {Ra}, {Sa}'],
    ['Mula (root)', '{Su}, {Ve}'],
    ['Jeeva (living)', '{Ju}, {Me}'],
  ], {
    intro: 'As per Krishnacharya, widely accepted. The planets influencing the Lagna show the category.',
    notes: ['Other views: Jupiter jeeva; Sun, Mars and Rahu dhatu; Saturn mula. Some take the Sun and Saturn as both dhatu and mula, Mercury as jeeva and Venus as mula. Another view takes the Moon as dhatu and jeeva, and Mercury and Venus as jeeva and mula.'],
  }),
  T('dhatu', 'Dhatu: which mineral', ['Condition', 'Indication'], [
    ['Planets influencing the Lagna', 'Any of {Mo}, {Ma}, {Sa}, {Ra}'],
    ['In the navamsha of malefics', 'Costly group: gold, silver, jewels'],
    ['In the navamsha of benefics', 'Inexpensive group: soil, stones, minerals'],
    ['{Su} linked with the karyesh', 'Pearl'],
    ['{Ve} or {Mo}', 'Silver'],
    ['{Ma}', 'Brass, red stones, coral'],
    ['{Me}', 'Gold'],
    ['{Ju}', 'Gold set with jewels'],
    ['{Sa}', 'Iron'],
    ['{Ra}', 'Bones, including ivory'],
  ], {
    intro: 'All minerals and metals taken from the earth are dhatu: one group of gold, silver and jewels, another of soil, stones, coal and minerals. They may also be split into malleable and non-malleable.',
    notes: ['Another view of the metals: Moon silver; Jupiter gold and gold ornaments; Saturn iron, lead and oil; Mars brass; Sun gems and copper.'],
  }),
  T('mula', 'Mula: which vegetation', ['Condition', 'Indication'], [
    ['Planets influencing the Lagna', '{Su} or {Ve}'],
    ['In the navamsha of watery signs (4, 8, 10, 11, 12)', 'Grows in water (jalaja mula)'],
    ['In the navamsha of other signs (1, 2, 3, 5, 6, 7, 9)', 'Grows on land (sthalaja mula)'],
  ], { intro: 'All vegetation is mula, growing either on land or in water.' }),
  T('jeeva', 'Jeeva: which living being', ['Planet linked with the karyesh', 'Kind of being'], [
    ['{Ju} or {Ve}', 'Two-legged (dwipad)'],
    ['{Su} or {Ma}', 'Four-legged (chatushpad): wild under malefics, pets under benefics'],
    ['{Me} or {Sa}', 'Birds: near water in watery signs, on land in other signs'],
    ['{Mo} or {Ra}', 'Insects: poisonous under malefics, harmless under benefics'],
  ], { intro: 'Planets influencing the Lagna: Mercury or Jupiter. Living beings are two-legged, four-legged or insects; by origin they are andaja (from eggs, like birds), keeta (insects) or pindaja (all others).' }),
]

// ── Dignities ──────────────────────────────────────────────

export interface PlanetDignity {
  exalt: Rashi
  deepExalt: number
  debil: Rashi
  deepDebil: number
  mt: { sign: Rashi; from: number; to: number }
  own: Rashi[]
}

export const PLANET_DIGNITY: Partial<Record<GrahaId, PlanetDignity>> = {
  Su: { exalt: 1, deepExalt: 10, debil: 7, deepDebil: 10, mt: { sign: 5, from: 0, to: 20 }, own: [5] },
  Mo: { exalt: 2, deepExalt: 3, debil: 8, deepDebil: 3, mt: { sign: 2, from: 3, to: 30 }, own: [4] },
  Ma: { exalt: 10, deepExalt: 28, debil: 4, deepDebil: 28, mt: { sign: 1, from: 0, to: 12 }, own: [1, 8] },
  Me: { exalt: 6, deepExalt: 15, debil: 12, deepDebil: 15, mt: { sign: 6, from: 15, to: 20 }, own: [6, 3] },
  Ju: { exalt: 4, deepExalt: 5, debil: 10, deepDebil: 5, mt: { sign: 9, from: 0, to: 10 }, own: [9, 12] },
  Ve: { exalt: 12, deepExalt: 27, debil: 6, deepDebil: 27, mt: { sign: 7, from: 0, to: 15 }, own: [7, 2] },
  Sa: { exalt: 7, deepExalt: 20, debil: 1, deepDebil: 20, mt: { sign: 11, from: 0, to: 20 }, own: [11, 10] },
}

/** Rahu and Ketu, as commonly tabled; schools differ (see the notes). */
export const NODE_DIGNITY: Record<'Ra' | 'Ke', { exalt: string; deepExalt: string; debil: string; deepDebil: string; mt: string; own: string }> = {
  Ra: { exalt: '{r2} (some: {r3})', deepExalt: '20° {r2}', debil: '{r8} (some: {r9})', deepDebil: '20° {r8}', mt: '{r6} (some: {r11})', own: '{r11} (some: {r6})' },
  Ke: { exalt: '{r8} (some: {r9})', deepExalt: '20° {r8}', debil: '{r2} (some: {r3})', deepDebil: '20° {r2}', mt: '{r12} (some: {r5})', own: '{r8} (some: {r12})' },
}

export const PLANET_DIGNITY_TEXT = {
  title: 'Exaltation, debilitation, mooltrikona and own sign',
  head: ['Planet', 'Exaltation', 'Deep exaltation', 'Debilitation', 'Deep debilitation', 'Mooltrikona', 'Own sign'],
  absolute: 'absolute',
  notes: [
    'Exaltation: strong in the whole sign, at its peak on the deep exaltation degree. Debilitation: weakest on the deep debilitation degree, exactly 180° from deep exaltation.',
    'Order of strength: exaltation > mooltrikona > own sign > friend\'s sign > neutral > enemy\'s sign > debilitation.',
    'Ranges differ by text: the Moon\'s mooltrikona is also given as Taurus 4°–30°, the Sun\'s as Leo 0°–10°, Mercury\'s as Virgo 16°–20°. In Taurus 0°–3° the Moon is exalted; from 3° it is mooltrikona (still exalted by sign). In Virgo 0°–15° Mercury is exalted.',
    'Rahu and Ketu: a widely held view gives Gemini as Rahu\'s exaltation and Ketu\'s debilitation, and Sagittarius as Ketu\'s exaltation and Rahu\'s debilitation; Virgo and Pisces are their own signs. They do well in the signs of Mercury, Jupiter and Venus, and on that basis Taurus is also taken as Rahu\'s exaltation. Both views are acceptable.',
    'A debilitated planet harms its lordships and the house it occupies. Neecha bhanga (cancellation) works for the houses the planet rules: (1) the lord of the debilitation sign is in a kendra from the Moon; (2) the lord of its exaltation sign is in a kendra from the Lagna or Moon; (3) the debilitated planet is in a kendra from the Lagna or Moon; (4) its debilitation sign lord influences it by position or aspect; (5) its debilitation and exaltation sign lords are in mutual aspect or kendras; (6) the planet exalted in its sign is in a kendra from the Lagna or Moon. These matter in birth charts and are rarely used in praśna; they need testing.',
    'Sarvartha Chintamani: an exalted planet that is retrograde gives the results of debilitation, and a retrograde debilitated planet those of exaltation. Praśna reads retrograde planets differently; this is open to research.',
  ],
}

export type DignityKind = 'exalted' | 'moolatrikona' | 'own' | 'friend' | 'enemy' | 'debilitated'

/** Prashna group friendship: same group = friends, other group = enemies. */
export const FRIEND_GROUPS: GrahaId[][] = [['Su', 'Mo', 'Ma', 'Ju', 'Ke'], ['Me', 'Ve', 'Sa', 'Ra']]
export const groupFriends = (a: GrahaId, b: GrahaId) => FRIEND_GROUPS.some(g => g.includes(a) && g.includes(b))

const SIGN_LORD: GrahaId[] = ['Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me', 'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju']

/** Dignity of a planet (Sun to Saturn) at a sign and degree; friend / enemy by group friendship. */
export function dignityOf(id: GrahaId, rashi: Rashi, degree: number): DignityKind | undefined {
  const d = PLANET_DIGNITY[id]
  if (!d) return undefined
  if (rashi === d.mt.sign) {
    // Moon in Taurus 0°–3° and Mercury in Virgo 0°–15° are exalted; past the range Mercury and the Sun are in own sign.
    if (degree >= d.mt.from && degree < d.mt.to) return 'moolatrikona'
    if (degree < d.mt.from) return rashi === d.exalt ? 'exalted' : 'own'
    return d.own.includes(rashi) ? 'own' : 'exalted'
  }
  if (rashi === d.exalt) return 'exalted'
  if (d.own.includes(rashi)) return 'own'
  if (rashi === d.debil) return 'debilitated'
  return groupFriends(id, SIGN_LORD[rashi - 1]) ? 'friend' : 'enemy'
}

// ── Mrityu and pushkara bhaga ──────────────────────────────

export type BhagaKey = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke' | 'Md' | 'La'
export const MRITYU_KEYS: BhagaKey[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke', 'Md', 'La']

/** Fateful degree per sign (Aries … Pisces). */
export const MRITYU_BHAGA: Record<BhagaKey, number[]> = {
  Su: [20, 9, 12, 6, 8, 24, 16, 17, 22, 2, 3, 23],
  Mo: [8, 25, 22, 22, 21, 1, 4, 23, 18, 20, 20, 10],
  Ma: [19, 28, 25, 23, 29, 28, 14, 21, 2, 15, 11, 6],
  Me: [15, 14, 13, 12, 8, 18, 20, 10, 21, 22, 7, 5],
  Ju: [19, 29, 12, 27, 6, 4, 13, 10, 17, 11, 15, 28],
  Ve: [28, 15, 11, 17, 10, 13, 4, 6, 27, 12, 29, 19],
  Sa: [10, 4, 7, 9, 12, 16, 3, 18, 28, 14, 13, 15],
  Ra: [14, 13, 12, 11, 24, 23, 22, 21, 10, 20, 18, 8],
  Ke: [8, 18, 20, 10, 21, 22, 23, 24, 11, 12, 13, 14],
  Md: [23, 24, 11, 12, 13, 14, 8, 18, 20, 10, 21, 22],
  La: [1, 9, 22, 22, 25, 2, 4, 23, 18, 20, 24, 10],
}

/** Moon's pushkara bhaga per sign (Aries … Pisces). */
export const MOON_PUSHKARA: number[] = [21, 14, 18, 8, 19, 9, 24, 11, 23, 14, 19, 9]

/** True when `degree` (0–30) falls in the given bhaga, i.e. the nth degree (n − 1 to n). */
export const inBhaga = (degree: number, bhaga: number) => degree >= bhaga - 1 && degree < bhaga

export const PLANET_BHAGA_TEXT = {
  mrityuTitle: 'Mrityu bhaga (fateful degrees)',
  mrityuIntro: 'These degrees of each planet in each sign are inauspicious.',
  pushkaraTitle: 'Pushkara bhaga of the Moon',
  pushkaraIntro: 'Some degrees give auspicious results (pushkara bhaga or pushkaramsha). The Moon in these degrees is auspicious.',
  mandi: 'Mandi',
  lagna: 'Lagna',
}

// ── Each planet at a glance ────────────────────────────────

export const GLANCE_FIELDS = ['dhatu', 'mula', 'jeeva', 'body', 'dosha', 'place', 'relation', 'faculties', 'abstract', 'society', 'misc'] as const
export type GlanceField = typeof GLANCE_FIELDS[number]
export type PlanetGlance = Record<GlanceField, string>
const G = (...v: string[]): PlanetGlance => Object.fromEntries(GLANCE_FIELDS.map((f, i) => [f, v[i] ?? ''])) as PlanetGlance

export const PLANET_GLANCE: Record<GrahaId, PlanetGlance> = {
  Su: G(
    'Copper, brass, gold, valuables, ornaments, pearls, ruby, stones, red coral, topaz',
    'Timber, almond, chillies, grass, orange',
    'Cattle, quadrupeds, lion, wool, deer, goose',
    'Heart, bones, stomach, eyes, body, face, soul',
    'Bile, fevers and inflammations, diseases of the eyes and head, thinning hair, red eyes',
    'Fortress, forest, river banks, temples, palatial buildings and apartments',
    'Father',
    'Vitality, power, courage, bitter taste, valour, wickedness, mental purity, awakening of knowledge, ambition, enthusiasm, freedom from disease, short stature, anger slow to cool',
    'Heat, worship of Shiva, the king\'s favour, the mortal world, travel, affairs of the kingdom or government, open conduct, strong at noon, sattvik temper, the soul (atma)',
    'King, ruler, physician, officiating priest at a sacrifice',
    'Anything auspicious, strong and tall trees, a half year, wandering over hills, circular forms, blood-red cloth, capturing the foe, saffron, thick yarn, yagnas, mountaineering',
  ),
  Mo: G(
    'Silver, pearl, diamond, crystal, ruby',
    'Fruits, sugarcane, wheat, pulses, algae, barley, flowers',
    'Fish and other water creatures, serpents, horned animals',
    'Mind, facial lustre, face, stomach, mouth',
    'Phlegmatic constitution, epilepsy, ulcers, acidity, malarial fever, ailments of the shoulders',
    'Wells, tanks, facing west, the middle world, kitchen, toilets, distilleries',
    'Mother, self',
    'Intelligence, nature, happiness, impartial outlook, short stature, ability, sense of humour, swiftness, fondness for curd, beauty, fame, brown or blue eyes, soft speech, delicacy',
    'Disease, laziness, sleep, consumption, whiteness, muhurta, worship of Parvati, favour, nourishment, pleasures, middle age, the mind (manas)',
    'Brahmin, woman, lover, washerman',
    'Sea bath, monsoon, perfumes, going to a fortress, liquids, pilgrimages, noon, waistband, salt, ascetics, strong at night, saline things, eating, distant travel, milk, fountains, farming, good food, cutlery, crockery',
  ),
  Ma: G(
    'Tin, ruby, jewels, gold, copper, metals, minerals',
    'Trees, cashew, coffee, ginger, lotus, pepper',
    'Quadrupeds, snake, ram, jackal, cat, monkey, tiger, vulture, carnivores',
    'Blood, bone marrow',
    'Loss of virility, bile, heat, wounds, ailments',
    'Land, the ruler\'s hall, house, kitchen, hideouts, underworld, butchery',
    'Brothers, relatives',
    'Valour, strength, anger, charity, sight, fondness, steadfastness, shortness, fame, desire, firm limbs, skill in archery, strength of the enemy, leanness, speech, cruelty, stamina',
    'Carrying weapons, ruling people, opposition, battle, foes, love of deep red, royal service, obstacles, youth, pungent taste, summer, Brahma, the king\'s favour, independence',
    'King, thief, minister, goldsmith, army commander, cooks',
    'Archaeologist, obstinate fool, sound of trumpets, going abroad, supporter, fire, controversy, arguments, day, sky, sword, spear, burnt place, earthenware, eating meat, abuse, man, axe, forest officer, village chief, odd clothes, rumours, scandals, firearms, Samaveda, summer',
  ),
  Me: G(
    'Ornaments, compound substances',
    'Betel leaves, grass, plants without fruit',
    'Horses, birds, parrot',
    'Skin, neck, navel, sex organs',
    'Skin diseases; vaat, pitta and kapha in equal measure',
    'Treasury, fine palaces, heavens, temple towers, garden, library, temples',
    'Maternal grandfather, younger siblings',
    'Knowledge, speech, lecturing, humility, fear, devotion, self-control, laughter, versed in the Puranas, scholarship, witty language, helpful nature, judging gems (ratna parkhi)',
    'Education, sculpture, maths, astrology, commerce, Vedanta, bad dreams, moisture, renunciation, religious rites, season, dancing, evenness, grammar',
    'Infantry, eunuch, child, Shudras, tantrik, clerks',
    'Script, writing, new clothes, building palaces, grass green, pilgrimages, black magic, looking sideways, strong in the morning, hemanta season (early winter), bills, dust',
  ),
  Ju: G(
    'Precious stones, gold, topaz, cat\'s eye',
    'Peepal tree, black gram, fruit plants',
    'Cows, horses, buffaloes',
    'Brain, knees, body fat',
    'Digestive disorders, wind complaints, phlegm, dropsy',
    'Mansions, strange or peculiar places',
    'Son, grandson, elder brother, grandfather, dear friend',
    'Jurisprudence, large body, valour, fame, logic, proficiency, eloquence, long intellect, knowledge of texts, gentleness, sattvik nature, reading others\' thoughts, benefic',
    'Religious and other duties, astrology, physical health, charity, dharma, old age, yellow, impartiality, penance, mantra, long poems',
    'Brahmin, teachers, traders',
    'Chariot, deposits, treasury, holy water, wealth in elephants, Indra, Vedanta, the second half of winter, pilgrimage places, idol of Brahma, throne, honey, oil, silk, paunch',
  ),
  Ve: G(
    'Silver, pearls, precious stones, ornaments, diamond, mica',
    'Flowers, cherry, cotton, creepers, juicy fruits',
    'Bipeds, elephants, horses, peacock, silk',
    'Genitals, urinary tract',
    'Cough',
    'Watery places, theatre, cinema, hotels, dance halls, brothels, harem',
    'Wife, husband',
    'Gentleness, happiness from married life, short stature, fame, youth, pride, rajasik nature, firmness, beauty, enjoyment, love of humour, depth, eminence, well built',
    'Income, sour taste, commands, cross vision, unusual poetry, music, lustre, charming speech, tenderness, kingdom, decoration, wedding festivities, respect',
    'Women, Vaishyas, ruler, merchant',
    'Good clothes, white umbrella, marriage, conveyances, salty taste, a fortnight, Yajurveda, cosmetics, dancing, middle age, swimming, fortune, walking, well-proportioned limbs, trade, spring, musical instruments, veena, flute, skill in Bharatanatyam',
  ),
  Sa: G(
    'Precious stones, iron, lead, tin',
    'Wood, black grains, inferior cereals',
    'Horse, donkey, elephant, snake, goat, bird, dog, buffalo',
    'Skin, tendons, bones, nerves',
    'Disease',
    'Dirty houses, battlefields, labourers\' quarters, garbage, dilapidated buildings',
    'Cousin; father, for those born at night',
    'Distress, enmity, dirty mind, disgust, charity, longevity, indignation, long-lasting, exertion, cruelty, generosity, fierceness, severity, being chained',
    'Ill health, obstruction, standards, death, old age, happiness from a woman, lying, a servant\'s duties, sins, friendship with the wicked, destiny',
    'Outcastes, lords, eunuchs, Shudras, tamasik Brahmins, blacksmiths',
    'Income, maidservant, people with deformed limbs, wind, untraditional acts, roaming in woods, strong at day\'s end, dirty cloth, black, ashes, a year, blanket, thefts',
  ),
  Ra: G(
    'Gomedh, iron, emerald',
    'Bushes, sesame',
    'Serpents, reptiles, mosquito, bug, owl, insects',
    'Bones',
    'Hidden abdominal ulcer, malignant tumour, acute duodenal pain, wind and phlegm, boils and eruptions, catarrh',
    'Difficult places, dense forests, the world of snakes, tunnels, anthills, graveyards',
    'Maternal grandfather',
    'Harsh speech, faulty logic, uncleanliness, great valour, falsehood, perplexity, masochism, wickedness',
    'Gambling, strong at sunset, going abroad, living in a dream world, old age, corruption, bribery',
    'Mlechha, Shudra, irreligious people',
    'Looking downward, the southern breeze, umbrella, air, travel, one muhurta, conveyance, association with animals, heretics, Urdu or Persian, a planet of confusion and material inspiration',
  ),
  Ke: G(
    'Stones',
    'Bushes, thorns',
    'Dog, donkey, cock, vultures, horned animals',
    'Feet',
    'Painful fevers, wind complaints, wounds, stomach and eye diseases, duodenal ulcer, smallpox, skin eruptions',
    'Holes, tunnels, darkness',
    'Paternal grandfather',
    'Pain, grief, friendship with hunters, unsteady mind, great penance, hypersensitivity, hunger, stupidity, knowledge of Brahman, renunciation, knowledge of animals, poor eating habits',
    'Salvation, consumption, prosperity, mantra shastra, rising high like a flagpole, luxury, fortune, suffering from foes',
    'Doctors, Shudras, snake charmers, Buddhists',
    'Wealth, treasure, final liberation, bathing in the Ganga, zoology, silence, Vedanta, association with Shudras, release from prison, a mysterious planet that also shows intrigue',
  ),
} as Record<GrahaId, PlanetGlance>

/** Dwelling places (nivas sthan) of each planet. */
export const PLANET_DWELLING: Partial<Record<GrahaId, string[]>> = {
  Su: ['Shiva temples', 'Open spaces'],
  Mo: ['Places with water', 'Places with honey or alcohol', 'Places of herbal medicine'],
  Ma: ['Fireplaces', 'Battlegrounds', 'Where thieves and dacoits live', 'Mars is a major significator of theft'],
  Me: ['Gardens and parks', 'Places of scholars and learned people', 'Places of humour and entertainment', 'Play schools (children under 12)'],
  Ju: ['Places of money (banks, vaults)', 'Where peepal trees stand', 'Brahmin quarters', 'Temples (dev sthan)'],
  Ve: ['Bedrooms', 'Luxurious places', 'Palaces', 'Brothels', 'Perfume shops', 'Places decorated with flowers'],
  Sa: ['Garbage areas', 'Dirty drains', 'Iron and scrap yards', 'Labourers\' areas', 'Saturn temples'],
  Ra: ['Desolate places', 'Isolated, secluded areas', 'Rooms closed for a long time (with holes)', 'Termite mounds', 'Snake holes'],
  Ke: ['Desolate and secluded places, as Rahu', 'Ancient temples on hills', 'Goddess temples reached by climbing, such as Vaishno Devi'],
}

// ── Readings from the prashna chart ────────────────────────

export interface PlanetReadingInput {
  grahas: { id: GrahaId; rashi: Rashi; degree: number; isCombust: boolean; isRetro: boolean }[]
  ascRashi: Rashi
  ascDegree: number
  mandi?: { rashi: Rashi; degree: number }
  isDay: boolean
  tithi: number
  /** Sun's tropical longitude, for the ayana. */
  sunTropical: number
}

export interface PlanetReadingRow {
  id: GrahaId
  rashi: Rashi
  degree: number
  dignity?: DignityKind
  combust: boolean
  retro: boolean
  /** True when the planet is strong at this hour (day / night / always). */
  timeStrong: boolean
  mrityu: boolean
  pushkara: boolean
}

export type EventTime = 'morning' | 'noon' | 'afternoon' | 'evening'
/** Time of the event shown by a planet in (or aspecting) the Lagna. */
export const EVENT_TIME: Partial<Record<GrahaId, EventTime>> = {
  Me: 'morning', Ju: 'morning', Su: 'noon', Ma: 'noon', Ve: 'afternoon', Mo: 'afternoon', Sa: 'evening', Ra: 'evening',
}

/** Strong by day / at night; Mercury is strong at both. */
export const DAY_STRONG: GrahaId[] = ['Su', 'Ju', 'Ve']
export const NIGHT_STRONG: GrahaId[] = ['Mo', 'Ma', 'Sa']

export function readPrashnaPlanets(input: PlanetReadingInput) {
  const rows: PlanetReadingRow[] = PLANETS.map((id): PlanetReadingRow | undefined => {
    const g = input.grahas.find(x => x.id === id)
    if (!g) return undefined
    const deg = ((g.degree % 30) + 30) % 30
    return {
      id, rashi: g.rashi, degree: deg,
      dignity: dignityOf(id, g.rashi, deg),
      combust: g.isCombust, retro: g.isRetro,
      timeStrong: id === 'Me' || (input.isDay ? DAY_STRONG : NIGHT_STRONG).includes(id),
      mrityu: inBhaga(deg, MRITYU_BHAGA[id as BhagaKey][g.rashi - 1]),
      pushkara: id === 'Mo' && inBhaga(deg, MOON_PUSHKARA[g.rashi - 1]),
    }
  }).filter((r): r is PlanetReadingRow => !!r)
  const ascDeg = ((input.ascDegree % 30) + 30) % 30
  const t = ((input.sunTropical % 360) + 360) % 360
  return {
    rows,
    moonBenefic: input.tithi >= 8 && input.tithi <= 22,
    shukla: input.tithi <= 15,
    uttarayana: t >= 270 || t < 90,
    lagnaMrityu: inBhaga(ascDeg, MRITYU_BHAGA.La[input.ascRashi - 1]),
    mandiMrityu: input.mandi ? inBhaga(input.mandi.degree, MRITYU_BHAGA.Md[input.mandi.rashi - 1]) : false,
    lagnaPlanets: rows.filter(r => r.rashi === input.ascRashi).map(r => r.id),
  }
}

// ── Lookups with language ──────────────────────────────────

export function getPlanetTables(lang: EngineLang = 'en'): PlanetTable[] {
  return PLANET_TABLES.map(tb => {
    const hi = lang === 'hi' ? PLANET_TABLES_HI[tb.id] : undefined
    const src = hi ? { ...tb, ...hi } : tb
    return {
      ...src,
      head: src.head.map(c => expandTokens(c, lang)),
      rows: src.rows.map(r => r.map(c => expandTokens(c, lang))),
      ...(src.intro ? { intro: expandTokens(src.intro, lang) } : {}),
      ...(src.notes ? { notes: src.notes.map(n => expandTokens(n, lang)) } : {}),
    }
  })
}

export const getPlanetGlance = (id: GrahaId, lang: EngineLang = 'en'): PlanetGlance =>
  lang === 'hi' ? PLANET_GLANCE_HI[id] : PLANET_GLANCE[id]

export const getPlanetDwelling = (id: GrahaId, lang: EngineLang = 'en'): string[] =>
  (lang === 'hi' ? PLANET_DWELLING_HI[id] : PLANET_DWELLING[id]) ?? []

export function getDignityText(lang: EngineLang = 'en') {
  const base = lang === 'hi' ? PLANET_DIGNITY_TEXT_HI : PLANET_DIGNITY_TEXT
  return { ...base, notes: base.notes.map(n => expandTokens(n, lang)) }
}

export const getBhagaText = (lang: EngineLang = 'en') => (lang === 'hi' ? PLANET_BHAGA_TEXT_HI : PLANET_BHAGA_TEXT)

export function nodeDignity(id: 'Ra' | 'Ke', lang: EngineLang = 'en') {
  const d = NODE_DIGNITY[id]
  const some = lang === 'hi' ? 'कुछ मत' : 'some'
  const x = (s: string) => expandTokens(s.replace('some:', `${some}:`), lang)
  return { exalt: x(d.exalt), deepExalt: x(d.deepExalt), debil: x(d.debil), deepDebil: x(d.deepDebil), mt: x(d.mt), own: x(d.own) }
}
