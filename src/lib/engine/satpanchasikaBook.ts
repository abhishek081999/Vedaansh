// ─────────────────────────────────────────────────────────────
//  src/lib/engine/satpanchasikaBook.ts
//  What the book chapter "Shatpanchasika in a Nutshell"
//  (docs/research/prashna-4-extract.md) adds to the Satpanchasika
//  engine: the specifics of a lost article from 6.4–6.5 (colour, size,
//  touch, permanent loss, distance in yojanas, direction by sign, time
//  of theft, age of the person), the 1.5 benefic-Moon window, and the
//  book's topic index to the ślokas. Bilingual, pure.
// ─────────────────────────────────────────────────────────────

import type { Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import type { EngineLang } from './lang'
import { D9 } from './vargas'

type T = { en: string; hi: string }
const t = (en: string, hi: string): T => ({ en, hi })
const P = (x: T, lang: EngineLang) => (lang === 'hi' ? x.hi : x.en)

const SIGN_LORD: GrahaId[] = ['Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me', 'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju']
const lordOf = (r: Rashi): GrahaId => SIGN_LORD[r - 1]
const houseFrom = (from: Rashi, sign: Rashi) => ((sign - from + 12) % 12) + 1
const STRONG: Dignity[] = ['exalted', 'moolatrikona', 'own', 'great_friend']
const WEAK: Dignity[] = ['debilitated', 'enemy', 'great_enemy']

/** 6.5: colour of the article by the rising sign, Aries to Pisces. */
export const SIGN_COLOUR: T[] = [
  t('red', 'लाल'), t('white', 'सफ़ेद'), t('green', 'हरा'), t('pink', 'गुलाबी'), t('pale white or smoky', 'हल्का सफ़ेद या धुएँ जैसा'),
  t('variegated', 'चितकबरा'), t('black', 'काला'), t('black', 'काला'), t('yellow', 'पीला'), t('mixed, variegated', 'मिश्रित, चितकबरा'),
  t('dark brown', 'गहरा भूरा'), t('light blue', 'हल्का नीला'),
]
/** 6.5: size by the rising navāṃśa sign. */
export const sizeOf = (navSign: Rashi): 'short' | 'medium' | 'long' =>
  [1, 6, 7, 12].includes(navSign) ? 'short' : [2, 5, 8, 11].includes(navSign) ? 'medium' : 'long'
const SIZE_T = { short: t('short, small', 'छोटा'), medium: t('medium', 'मध्यम'), long: t('long, large', 'लंबा, बड़ा') }
/** 6.5: direction by the rising sign's trine. */
export const trineDirection = (r: Rashi): 'East' | 'South' | 'West' | 'North' => (['East', 'South', 'West', 'North'] as const)[(r - 1) % 4]
const DIR_T = { East: t('East', 'पूर्व'), South: t('South', 'दक्षिण'), West: t('West', 'पश्चिम'), North: t('North', 'उत्तर') }
/** 6.5: age by the Lagna lord, as this book gives it. */
export const LORD_AGE: Partial<Record<GrahaId, T>> = {
  Su: t('older, 50–60', 'प्रौढ़, 50–60'),
  Mo: t('a small child, 3–5 (some say 50–60)', 'छोटा बच्चा, 3–5 (कुछ के मत में 50–60)'),
  Ma: t('a boy of 10–12', '10–12 वर्ष का लड़का'),
  Me: t('an adolescent, 16–20', 'किशोर, 16–20'),
  Ju: t('an adult, 35–50', 'वयस्क, 35–50'),
  Ve: t('young, 20–35', 'युवा, 20–35'),
  Sa: t('very old, 70–80', 'बहुत वृद्ध, 70–80'),
}

export interface SatBookInput {
  ascRashi: Rashi
  /** Sidereal ascendant, 0–360. */
  ascDegree: number
  grahas: GrahaData[]
}

export interface SatBookLine { id: string; label: string; value: string; working: string; tone?: 'good' | 'bad' }

/** The book's extra specifics for a lost or stolen article (6.3–6.5). */
export function satpanchasikaBookLost(c: SatBookInput, lang: EngineLang = 'en'): SatBookLine[] {
  const hi = lang === 'hi'
  const asc = c.ascRashi
  const degIn = ((c.ascDegree % 30) + 30) % 30
  const nav = Math.min(9, Math.floor(degIn / (10 / 3)) + 1)
  const navSign = D9(((c.ascDegree % 360) + 360) % 360) as Rashi
  const navLord = lordOf(navSign)
  const G = new Map(c.grahas.map(g => [g.id, g]))
  const nl = G.get(navLord)
  const S = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const N = (g: GrahaId) => (hi ? GRAHA_HI[g] : GRAHA_NAMES[g])
  const out: SatBookLine[] = []

  out.push({ id: 'colour', label: hi ? 'रंग' : 'Colour', value: P(SIGN_COLOUR[asc - 1], lang), working: hi ? `उदित राशि ${S(asc)} (6.5)।` : `Rising sign ${S(asc)} (6.5).` })
  const size = sizeOf(navSign)
  out.push({ id: 'size', label: hi ? 'आकार' : 'Size', value: P(SIZE_T[size], lang), working: hi ? `उदित नवांश ${S(navSign)} (6.5)।` : `Rising navāṃśa ${S(navSign)} (6.5).` })
  if (nl) {
    const strong = STRONG.includes(nl.dignity) && !nl.isCombust
    const weak = WEAK.includes(nl.dignity) || nl.isCombust
    out.push({
      id: 'touch', label: hi ? 'स्पर्श' : 'Touch',
      value: strong ? (hi ? 'कठोर' : 'hard') : weak ? (hi ? 'मुलायम' : 'soft') : (hi ? 'न स्पष्ट कठोर, न मुलायम' : 'neither clearly hard nor soft'),
      working: hi ? `नवांश स्वामी ${N(navLord)} ${strong ? 'बली' : weak ? 'दुर्बल' : 'मध्यम'} (6.5)।` : `Navāṃśa lord ${N(navLord)} is ${strong ? 'strong' : weak ? 'weak' : 'middling'} (6.5).`,
    })
    const h = houseFrom(asc, nl.rashi)
    const gone = nl.dignity === 'debilitated' || h === 7
    out.push({
      id: 'loss', label: hi ? 'स्थायी हानि' : 'Lost for good', tone: gone ? 'bad' : 'good',
      value: gone ? (hi ? 'हाँ, वस्तु सदा के लिए गई' : 'yes, the article is lost for good') : (hi ? 'नहीं' : 'no'),
      working: hi
        ? `नवांश स्वामी ${N(navLord)} ${nl.dignity === 'debilitated' ? 'नीच' : `${h}वें भाव में`}; नियम: नीच या 7वें में हो तो स्थायी हानि (6.5)।`
        : `Navāṃśa lord ${N(navLord)} is ${nl.dignity === 'debilitated' ? 'debilitated' : `in house ${h}`}; rule: debilitated or in the 7th means lost for good (6.5).`,
    })
  }
  const yojana = nav <= 5 ? 1 : 1 + (nav - 5)
  out.push({
    id: 'distance', label: hi ? 'दूरी' : 'Distance',
    value: hi ? `${nav <= 5 ? '1 योजन के भीतर' : `लगभग ${yojana} योजन`} (≈ ${yojana * 14} कि.मी.)` : `${nav <= 5 ? 'within 1 yojana' : `about ${yojana} yojanas`} (≈ ${yojana * 14} km)`,
    working: hi ? `उदित नवांश ${nav}; 5वें तक 1 योजन, आगे हर नवांश पर 1 योजन और (6.4)। स्थिति के अनुसार अनुपात में पढ़ें।` : `Rising navāṃśa ${nav}; up to the 5th, 1 yojana, then 1 more per navāṃśa (6.4). Scale to the setting.`,
  })
  out.push({ id: 'direction', label: hi ? 'दिशा (राशि से)' : 'Direction (by sign)', value: P(DIR_T[trineDirection(asc)], lang), working: hi ? `${S(asc)}: 1, 5, 9 पूर्व; 2, 6, 10 दक्षिण; 3, 7, 11 पश्चिम; 4, 8, 12 उत्तर (6.5)।` : `${S(asc)}: 1, 5, 9 East; 2, 6, 10 South; 3, 7, 11 West; 4, 8, 12 North (6.5).` })
  const when = asc === 12 ? t('day or night', 'दिन या रात') : [1, 2, 3, 4, 9, 10].includes(asc) ? t('at night', 'रात में') : t('by day', 'दिन में')
  out.push({ id: 'time', label: hi ? 'चोरी का समय' : 'Time of theft', value: P(when, lang), working: hi ? `${S(asc)} ${asc === 12 ? 'दिन और रात दोनों में बली' : [1, 2, 3, 4, 9, 10].includes(asc) ? 'रात्रि-बली' : 'दिवा-बली'} (6.5)।` : `${S(asc)} is ${asc === 12 ? 'strong by day and night' : [1, 2, 3, 4, 9, 10].includes(asc) ? 'nocturnal' : 'diurnal'} (6.5).` })
  const ll = lordOf(asc)
  if (LORD_AGE[ll]) out.push({ id: 'age', label: hi ? 'व्यक्ति की आयु' : 'Age of the person', value: P(LORD_AGE[ll]!, lang), working: hi ? `लग्नेश ${N(ll)}, इस ग्रंथ की आयु सीमा (6.5)।` : `Lagna lord ${N(ll)}, this book's age range (6.5).` })

  // 1.5 / 6.3: the Moon in the Lagna, benefic from the 8th bright to the 7th dark tithi.
  const moon = G.get('Mo'), sun = G.get('Su')
  if (moon && sun && moon.rashi === asc) {
    const el = (((moon.lonSidereal - sun.lonSidereal) % 360) + 360) % 360
    const benefic = el >= 84 && el < 264
    out.push({
      id: 'moon', label: hi ? 'लग्न में चंद्र' : 'Moon in the Lagna', tone: benefic ? 'good' : undefined,
      value: benefic ? (hi ? 'शुभ चंद्र: वस्तु लौटने का संकेत' : 'a benefic Moon: points to recovery') : (hi ? 'चंद्र अभी शुभ नहीं' : 'the Moon is not benefic yet'),
      working: hi ? `सूर्य से चंद्र ${el.toFixed(0)}°; यह ग्रंथ शुक्ल अष्टमी से कृष्ण सप्तमी (84°–264°) तक चंद्र को शुभ मानता है (1.5, 6.3)।` : `Moon ${el.toFixed(0)}° from the Sun; this book counts the Moon benefic from the 8th bright to the 7th dark tithi, 84°–264° (1.5, 6.3).`,
    })
  }
  return out
}

// ── Topic index ─────────────────────────────────────────────

export interface SatTopic { topic: string; slokas: string[] }
interface SatTopicDef { topic: T; slokas: string[] }

/** The book's index, topic to ślokas (chapter.śloka), grouped and lightly merged. */
const TOPICS: SatTopicDef[] = [
  { topic: t('Position: gaining it', 'पद: प्राप्ति'), slokas: ['2.1', '4.3'] },
  { topic: t('Position: failing to get it', 'पद: न मिलना'), slokas: ['2.2'] },
  { topic: t('Position: falling from it, transfer', 'पद: पतन, स्थानांतरण'), slokas: ['1.2'] },
  { topic: t('Prosperity of the querist or a house', 'प्रश्नकर्ता या भाव की समृद्धि'), slokas: ['1.2', '1.3'] },
  { topic: t('Success and failure in general', 'सामान्य सफलता और असफलता'), slokas: ['1.2', '1.4', '2.2', '4.4'] },
  { topic: t('Desires fulfilled', 'इच्छा पूर्ति'), slokas: ['4.1', '4.2'] },
  { topic: t('Gains and wealth', 'लाभ और धन'), slokas: ['4.3', '4.4'] },
  { topic: t('Gains through a woman', 'स्त्री से लाभ'), slokas: ['4.4'] },
  { topic: t('Subject of the query: dhatu, mula, jeeva', 'प्रश्न का विषय: धातु, मूल, जीव'), slokas: ['1.6', '1.7'] },
  { topic: t('Whom the querist is thinking of', 'प्रश्नकर्ता किसके बारे में सोच रहा है'), slokas: ['7.6', '7.7', '7.8'] },
  { topic: t('Travel, going abroad', 'यात्रा, विदेश जाना'), slokas: ['1.2', '2.1', '2.5', '7.9'] },
  { topic: t('Return of a traveller', 'यात्री की वापसी'), slokas: ['1.2', '2.1', '3.5', '5.1', '5.2', '7.9'] },
  { topic: t('Traveller safe, with gains', 'यात्री सुरक्षित, लाभ सहित'), slokas: ['5.3'] },
  { topic: t('Traveller confined, moved on or robbed', 'यात्री बंदी, आगे गया या लूटा गया'), slokas: ['5.4'] },
  { topic: t('Traveller ill or in danger', 'यात्री बीमार या संकट में'), slokas: ['7.11'] },
  { topic: t('Father abroad: still there or moved on', 'विदेश में पिता: वहीं या आगे'), slokas: ['7.12'] },
  { topic: t('Timing a return', 'वापसी का समय'), slokas: ['2.14', '2.15', '2.16', '2.17', '3.5', '5.5'] },
  { topic: t('Opponent: will he come', 'विरोधी: आएगा या नहीं'), slokas: ['2.6', '2.10', '2.11', '2.13'] },
  { topic: t('Opponent: turns back or retreats', 'विरोधी: लौटता या पीछे हटता'), slokas: ['2.4', '2.7', '2.8', '2.10', '2.12'] },
  { topic: t('Opponent: defeated', 'विरोधी: पराजित'), slokas: ['2.3', '2.4', '3.1'] },
  { topic: t('No prediction either way', 'किसी भी ओर भविष्यवाणी नहीं'), slokas: ['2.10'] },
  { topic: t('Setting out for a contest', 'मुकाबले के लिए प्रस्थान'), slokas: ['2.9'] },
  { topic: t('Victory: defender or challenger', 'विजय: रक्षक या चुनौती देने वाला'), slokas: ['3.1', '3.2'] },
  { topic: t('Peace or conflict', 'संधि या संघर्ष'), slokas: ['3.3', '3.4'] },
  { topic: t('Recovery of a patient', 'रोगी का स्वस्थ होना'), slokas: ['2.1', '4.5'] },
  { topic: t('Lost item: recovery', 'खोई वस्तु: वापसी'), slokas: ['1.5', '5.1', '6.3'] },
  { topic: t('Lost item: taken by someone close', 'खोई वस्तु: किसी निकट व्यक्ति ने ली'), slokas: ['6.1'] },
  { topic: t('Lost item: where in the house', 'खोई वस्तु: घर में कहाँ'), slokas: ['6.2'] },
  { topic: t('Lost item: direction and distance', 'खोई वस्तु: दिशा और दूरी'), slokas: ['6.4', '6.5'] },
  { topic: t('Lost item: kind, colour, size, the person', 'खोई वस्तु: प्रकार, रंग, आकार, व्यक्ति'), slokas: ['6.5'] },
  { topic: t('Marriage', 'विवाह'), slokas: ['7.1', '7.2'] },
  { topic: t('Pregnancy, boy or girl', 'गर्भ, लड़का या लड़की'), slokas: ['7.1', '7.5'] },
  { topic: t('Rain', 'वर्षा'), slokas: ['7.3', '7.4'] },
  { topic: t('The Moon: young, adult, old, auspicious', 'चंद्र: बाल, युवा, वृद्ध, शुभ'), slokas: ['4.3', '7.6'] },
  { topic: t('Head- and back-rising signs', 'शीर्षोदय और पृष्ठोदय राशियाँ'), slokas: ['1.4', '5.4', '6.3'] },
  { topic: t('Fixed, movable and dual signs', 'स्थिर, चर और द्विस्वभाव राशियाँ'), slokas: ['2.1', '2.2', '2.5', '2.6', '2.7', '2.8', '6.1', '7.9'] },
  { topic: t('Biped and watery signs', 'द्विपद और जलीय राशियाँ'), slokas: ['3.3', '3.4', '4.2', '7.4'] },
  { topic: t('Kendras and trikonas', 'केंद्र और त्रिकोण'), slokas: ['3.4', '4.1', '5.2', '5.3', '7.2'] },
  { topic: t('Navāṃśa, drekkāṇa, vargottama', 'नवांश, द्रेष्काण, वर्गोत्तम'), slokas: ['1.7', '6.1', '6.2', '6.5'] },
  { topic: t('Retrograde planets', 'वक्री ग्रह'), slokas: ['5.5', '7.9'] },
]

export function satpanchasikaTopics(lang: EngineLang = 'en'): SatTopic[] {
  return TOPICS.map(x => ({ topic: P(x.topic, lang), slokas: x.slokas }))
}
