// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaTajikaBook.ts
//  Tajika yogas and sahams as the book chapter "Tajik Yogas and
//  Techniques of Analysis" reads them (docs/research/prashna-5-extract.md).
//  The existing engine (tajika.ts) follows Tājika Nīlakaṇṭhī and is left
//  alone; this file adds the author's own readings where they differ —
//  Iqbal / Induvaar by majority, Purna and Bhavishyat ithsala, Manau as an
//  affliction of the faster planet, Nakta / Yamaya with any mix of links,
//  Kamboola / Khallasara by the Moon and the pair, Rudda with debility and
//  6 / 8 / 12, Ishraf graded, Rahu–Ketu, and the book's 15 sahams.
//  Pure.
// ─────────────────────────────────────────────────────────────

import type { Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import type { EngineLang } from './lang'
import { DEEPTAMSA, TAJIKA_SEVEN, checkTajikaAspect, futureIthasala, tajikaLink, type TajikaLink } from './tajika'
import { sahamPoint, sunAboveHorizon } from './tajikaSahams'
import { hasParasharaAspect } from './aspects'

type T = { en: string; hi: string }
const t = (en: string, hi: string): T => ({ en, hi })

export type BookTone = 'good' | 'mixed' | 'bad' | 'neutral'
export interface BookReading { id: string; tone: BookTone; title: string; text: string }

const SIGN_LORD: GrahaId[] = ['Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me', 'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju']
const lordOf = (r: Rashi): GrahaId => SIGN_LORD[r - 1]
const nth = (from: Rashi, n: number): Rashi => (((from - 1 + n - 1) % 12) + 1) as Rashi
const houseFrom = (from: Rashi, sign: Rashi) => ((sign - from + 12) % 12) + 1
const norm = (x: number) => ((x % 360) + 360) % 360

const MALEFICS = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
const BENEFICS = new Set<GrahaId>(['Ju', 'Ve', 'Me', 'Mo'])
const KENDRA_PANAPHARA_NO8 = [1, 2, 4, 5, 7, 10, 11]
const APOKLIMA_NO9 = [3, 6, 12]
const DUST = [6, 8, 12]

const RANK: Record<Dignity, number> = { exalted: 5, moolatrikona: 4, own: 3, great_friend: 2, friend: 1, neutral: 0, enemy: -1, great_enemy: -2, debilitated: -3 }
export const meanOrb = (a: GrahaId, b: GrahaId) => ((DEEPTAMSA[a] ?? 0) + (DEEPTAMSA[b] ?? 0)) / 2

export interface BookChart {
  ascRashi: Rashi
  /** Sidereal ascendant, 0–360. */
  ascDegree: number
  grahas: GrahaData[]
  /** Defaults to the Sun above the horizon. */
  isDay?: boolean
}

const N = (g: GrahaId, lang: EngineLang) => (lang === 'hi' ? GRAHA_HI[g] ?? g : GRAHA_NAMES[g] ?? g)
const S = (r: Rashi, lang: EngineLang) => (lang === 'hi' ? RASHI_HI[r] : RASHI_NAMES[r])
const P = (x: T, lang: EngineLang) => (lang === 'hi' ? x.hi : x.en)
const list = (ids: GrahaId[], lang: EngineLang) => ids.map(g => N(g, lang)).join(', ')

/** Strong as the book uses it: own sign, exaltation (or moolatrikona), not combust. */
const strong = (g: GrahaData) => RANK[g.dignity] >= 3 && !g.isCombust

// ── Rudda: what spoils the ithsala, in the book's order ────

export type RuddaCause = 'retrograde' | 'combust' | 'debilitated' | 'dusthana'
export function ruddaCause(g: GrahaData, house: number): RuddaCause | null {
  if (g.isRetro && g.id !== 'Su' && g.id !== 'Mo') return 'retrograde'
  if (g.isCombust) return 'combust'
  if (g.dignity === 'debilitated') return 'debilitated'
  if (DUST.includes(house)) return 'dusthana'
  return null
}

const CAUSE_T: Record<RuddaCause, T> = {
  retrograde: t('retrograde', 'वक्री'), combust: t('combust', 'अस्त'),
  debilitated: t('debilitated', 'नीच'), dusthana: t('in 6, 8 or 12', '6, 8 या 12 में'),
}

// ── Ithsala type as the book grades it ──────────────────────

export type IthsalaKind = 'purna' | 'vartamana' | 'bhavishyat-sign' | 'bhavishyat-orb'

/**
 * The book's second Bhavishyat ithsala: not yet inside the average orb but
 * no more than 1° outside it, the faster planet applying, in a non-neutral
 * aspect.
 */
export function bhavishyatByOrb(a: GrahaData, b: GrahaData): TajikaLink | null {
  const [fast, slow] = Math.abs(a.speed) >= Math.abs(b.speed) ? [a, b] : [b, a]
  const nature = checkTajikaAspect(fast.rashi, slow.rashi)
  if (nature === 'neutral') return null
  const orb = meanOrb(fast.id, slow.id)
  const gap = slow.degree - fast.degree
  if (gap <= orb || gap > orb + 1) return null
  if (fast.speed - slow.speed <= 0) return null
  return { type: 'ithasala', fast: fast.id, slow: slow.id, aspect: nature, gap: Math.round(gap * 100) / 100, orb, daysAtCurrentSpeed: null }
}

// ── Reading for a pair of significators ─────────────────────

/**
 * The book's Tajika reading of two significators (normally the lagnesh and
 * the karyesh). Only what is present is returned.
 */
export function readTajikaBook(c: BookChart, a: GrahaId, b: GrahaId, lang: EngineLang = 'en'): BookReading[] {
  const hi = lang === 'hi'
  const out: BookReading[] = []
  const G = new Map(c.grahas.map(g => [g.id, g]))
  const seven = TAJIKA_SEVEN.map(id => G.get(id)).filter((g): g is GrahaData => !!g)
  const house = (g: GrahaData) => houseFrom(c.ascRashi, g.rashi)
  // The Lagna lord is never counted as a 6/8/12 lord (Mars and Venus also rule the 8th for Aries and Libra).
  const dustLords = new Set(DUST.map(h => lordOf(nth(c.ascRashi, h))).filter(l => l !== lordOf(c.ascRashi)))
  const push = (id: string, tone: BookTone, title: T, text: string) => out.push({ id, tone, title: P(title, lang), text })

  // 1. Iqbal / Induvaar by majority (8th left out of Iqbal, 9th excused from Induvaar)
  if (seven.length === 7) {
    const inIqbal = seven.filter(g => KENDRA_PANAPHARA_NO8.includes(house(g))).length
    const inIndu = seven.filter(g => APOKLIMA_NO9.includes(house(g))).length
    const in8 = seven.filter(g => house(g) === 8).map(g => g.id)
    if (inIqbal >= 4) push('iqbal', 'good', t('Iqbal yoga', 'इकबाल योग'), hi
      ? `${inIqbal} ग्रह केंद्र और पणफर (8वाँ छोड़कर) में: बहुमत से इकबाल, प्रश्न के लिए शुभ।`
      : `${inIqbal} of seven planets in kendras and panpharas (leaving out the 8th): Iqbal by majority, favourable.`)
    else if (inIndu >= 4) push('induvaar', 'bad', t('Induvaar yoga', 'इन्दुवार योग'), hi
      ? `${inIndu} ग्रह 3, 6, 12 में (9वाँ शुभ मानकर छोड़ा): बहुमत से इन्दुवार, प्रतिकूल।`
      : `${inIndu} of seven planets in 3, 6 and 12 (the 9th excused as good): Induvaar by majority, adverse.`)
    if (in8.length) push('eighth', 'bad', t('Planets in the 8th', 'आठवें में ग्रह'), hi
      ? `आठवें में ${list(in8, lang)}: प्रश्न पूरा होने में अड़चन; शुभ ग्रह भी अवांछित, पाप और बुरे।`
      : `${list(in8, lang)} in the 8th: obstruction to the query; even a benefic is unwelcome there, a malefic worse.`)
  }

  const ga = G.get(a), gb = G.get(b)
  if (!ga || !gb || a === b) return out
  const link = tajikaLink(ga, gb)
  const fast = G.get(link.fast)!, slow = G.get(link.slow)!
  const pairName = `${N(a, lang)}–${N(b, lang)}`
  const touchesDust = [a, b].some(id => dustLords.has(id))
  const lordNote = touchesDust
    ? (hi ? ' 6/8/12 का स्वामी शामिल है, इसलिए फल में कष्ट या बाधा।' : ' A lord of 6, 8 or 12 is part of it, so the result brings trouble or obstacles.')
    : ''

  // 2. Ithsala and its grade
  if (link.type === 'ithasala') {
    const purna = link.gap <= 1
    push('ithsala', touchesDust ? 'mixed' : 'good', purna ? t('Purna ithsala', 'पूर्ण इत्थशाल') : t('Vartamana ithsala', 'वर्तमान इत्थशाल'), hi
      ? `${pairName} में ${link.aspect === 'friendly' ? 'मित्र' : 'शत्रु'} दृष्टि से इत्थशाल, अंतर ${link.gap}° (औसत दीप्तांश ${link.orb}°)। ${purna ? 'घटना अभी, तुरंत।' : 'घटना आगे; अंतर से समय।'}${lordNote}`
      : `${pairName} in ithsala by ${link.aspect} aspect, ${link.gap}° apart (mean orb ${link.orb}°). ${purna ? 'The event is now, immediate.' : 'The event lies ahead; the gap gives the timing.'}${lordNote}`)

    // Manau: a malefic afflicts the faster planet within orb
    const afflicters = c.grahas.filter(m => MALEFICS.has(m.id) && m.id !== a && m.id !== b && m.id !== 'Su').filter(m => {
      if (m.rashi === fast.rashi) return Math.abs(m.degree - fast.degree) <= ((DEEPTAMSA[m.id] ?? DEEPTAMSA[fast.id] ?? 8) + (DEEPTAMSA[fast.id] ?? 8)) / 2
      if (m.id === 'Ra' || m.id === 'Ke') return false
      return tajikaLink(m, fast).type !== 'none'
    }).map(m => m.id)
    if (afflicters.length) push('manau', 'bad', t('Manau yoga', 'मणऊ योग'), hi
      ? `तेज़ ग्रह ${N(fast.id, lang)} पर ${list(afflicters, lang)} का दीप्तांश में प्रभाव: इत्थशाल भंग, निराशा।`
      : `The faster planet ${N(fast.id, lang)} is afflicted within orb by ${list(afflicters, lang)}: the ithsala is cancelled, disappointment.`)

    // Moon: Kamboola, Gaira-kamboola, Khallasara
    const moon = G.get('Mo')
    if (moon && a !== 'Mo' && b !== 'Mo') {
      const joined = [ga, gb].filter(g => tajikaLink(moon, g).type === 'ithasala').map(g => g.id)
      const anyLink = [ga, gb].some(g => tajikaLink(moon, g).type !== 'none' || moon.rashi === g.rashi)
      const later = moon.degree >= 25 ? [ga, gb].filter(g => futureIthasala(moon, g)).map(g => g.id) : []
      if (joined.length) push('kamboola', 'good', t('Kamboola yoga', 'कम्बूल योग'), hi
        ? `चंद्र का ${list(joined, lang)} से इत्थशाल: इत्थशाल का फल निश्चित; पूरे मन से प्रयास।`
        : `The Moon is in ithsala with ${list(joined, lang)}: the ithsala's result is sure; a whole-hearted effort.`)
      else if (later.length) push('gaira-kamboola', 'good', t('Gaira-kamboola yoga', 'गैरी-कम्बूल योग'), hi
        ? `चंद्र राशि के अंतिम अंशों में, अगली राशि में ${list(later, lang)} से इत्थशाल करेगा: कम्बूल का फल, कुछ विलंब से।`
        : `The Moon, in the last degrees of its sign, will form ithsala with ${list(later, lang)} in the next sign: Kamboola's result with some delay.`)
      else if (!anyLink) push('khallasara', 'bad', t('Khallasara yoga', 'खल्लासर योग'), hi
        ? 'चंद्र दोनों में से किसी से नहीं जुड़ा: इत्थशाल नष्ट, प्रश्न में असफलता।'
        : 'The Moon is not involved with either planet: the ithsala is destroyed, the query fails.')
    }

    // Rudda / Durapha
    const causes = [fast, slow].map(g => ({ g, cause: ruddaCause(g, house(g)) }))
    const spoiled = causes.filter(x => x.cause)
    if (spoiled.length === 2) {
      push('durapha', 'bad', t('Durapha yoga', 'दुरफ योग'), hi
        ? `दोनों ग्रह दुर्बल (${spoiled.map(x => `${N(x.g.id, lang)}: ${P(CAUSE_T[x.cause!], lang)}`).join('; ')}): असफलता, अशुभ फल।`
        : `Both planets are weak (${spoiled.map(x => `${N(x.g.id, lang)}: ${P(CAUSE_T[x.cause!], lang)}`).join('; ')}): failure, inauspicious results.`)
      const helper = seven.find(g => g.id !== a && g.id !== b && strong(g) && [ga, gb].some(s => tajikaLink(s, g).type === 'ithasala'))
      if (helper) push('duthotha-davira', 'mixed', t('Duthotha-davira yoga', 'दुत्थोत्थ-दवीर योग'), hi
        ? `बलवान ${N(helper.id, lang)} इनमें से एक से इत्थशाल में: किसी की सहायता से कार्य पूरा।`
        : `The strong ${N(helper.id, lang)} is in ithsala with one of them: fulfilment through someone's help.`)
    } else if (spoiled.length === 1) {
      const { g, cause } = spoiled[0]
      const permanent = DUST.includes(house(g)) || touchesDust
      push('rudda', permanent ? 'bad' : 'mixed', t('Rudda yoga', 'रुद्द योग'), hi
        ? `${N(g.id, lang)} ${P(CAUSE_T[cause!], lang)}: इत्थशाल भंग। ${permanent ? '6/8/12 से या उनके स्वामी से बना, इसलिए रद्द होना स्थायी हो सकता है।' : 'शुभ भावों में बना, इसलिए पहले उलटफेर, फिर कार्य सिद्ध (प्रक्रिया दोहराई जा सकती है)।'}`
        : `${N(g.id, lang)} is ${P(CAUSE_T[cause!], lang)}: the ithsala is cancelled. ${permanent ? 'Formed from 6, 8, 12 or with their lords, so the cancellation may be permanent.' : 'Formed in good houses, so an initial reversal, then fulfilment (the process may repeat).'}`)
    }

    // Duphali-kutha: the slower planet stronger
    if (!spoiled.length && RANK[slow.dignity] > RANK[fast.dignity] && RANK[slow.dignity] >= 3) push('duphali-kutha', 'good', t('Duphali-kutha yoga', 'दुफालि-कुत्थ योग'), hi
      ? `धीमा ${N(slow.id, lang)} तेज़ ${N(fast.id, lang)} से बलवान: इत्थशाल अधिक फलदायी।`
      : `The slower ${N(slow.id, lang)} is stronger than the faster ${N(fast.id, lang)}: the ithsala is more fruitful.`)

    // Kutha: both in kendra / panaphara, benefic aspect, no malefic influence
    if (!spoiled.length && [fast, slow].every(g => [1, 2, 4, 5, 7, 10, 11].includes(house(g)))) {
      const on = (g: GrahaData, set: Set<GrahaId>) => c.grahas.some(o => set.has(o.id) && o.id !== a && o.id !== b && (o.rashi === g.rashi || hasParasharaAspect(o.rashi, o.id, g.rashi)))
      if ([fast, slow].some(g => on(g, BENEFICS)) && ![fast, slow].some(g => on(g, MALEFICS))) push('kutha', 'good', t('Kutha yoga', 'कुत्थ योग'), hi
        ? 'दोनों ग्रह केंद्र/पणफर में, शुभ दृष्टि, पाप प्रभाव नहीं: कार्य सिद्धि।'
        : 'Both in kendras or panpharas with benefic aspect and no malefic influence: karya siddhi.')
    }
  } else {
    // 3. Bhavishyat ithsala (by sign change, or within 1° beyond the orb)
    const fut = futureIthasala(ga, gb)
    const byOrb = fut ? null : bhavishyatByOrb(ga, gb)
    if (fut || byOrb) {
      const l = (fut ?? byOrb)!
      push('bhavishyat', 'mixed', t('Bhavishyat ithsala', 'भविष्यत् इत्थशाल'), hi
        ? `${pairName}: ${fut ? 'राशि बदलने पर' : `औसत दीप्तांश (${l.orb}°) से 1° के भीतर, अंतर ${l.gap}°;`} इत्थशाल बनेगा। फल विलंब से।`
        : `${pairName}: ithsala will form ${fut ? 'when the faster planet changes sign' : `as the gap of ${l.gap}° closes to the mean orb of ${l.orb}° (within 1°)`}. Results after delay.`)
    }

    // 4. Ishraf, graded
    if (link.type === 'ishrafa') {
      const mal = [a, b].filter(id => MALEFICS.has(id))
      const retro = [fast, slow].filter(g => g.isRetro || g.isCombust).map(g => g.id)
      const grade = touchesDust && (mal.length || retro.length) ? 'worst' : mal.length || retro.length || touchesDust ? 'worse' : 'plain'
      push('ishraf', 'bad', t('Ishraf yoga', 'ईसराफ़ योग'), hi
        ? `${pairName} अलग हो रहे (${link.gap}°): प्रायः बीती घटना; प्रश्न के लिए प्रतिकूल${grade === 'worst' ? ', और बहुत बुरा (पाप/वक्री/अस्त और 6/8/12 का स्वामी)' : grade === 'worse' ? ', और बुरा (पाप, वक्री/अस्त या 6/8/12 का स्वामी)' : ''}।`
        : `${pairName} separating (${link.gap}°): usually a past event; unfavourable for the query${grade === 'worst' ? ', worst here (malefic, retrograde or combust, and a 6/8/12 lord)' : grade === 'worse' ? ', worse here (malefic, retrograde or combust, or a 6/8/12 lord)' : ''}.`)
    }

    // 5. Nakta / Yamaya / mixed, through a third planet (any mix of links)
    if (link.type === 'none' && !fut && !byOrb) {
      for (const third of seven) {
        if (third.id === a || third.id === b) continue
        const la = tajikaLink(third, ga), lb = tajikaLink(third, gb)
        if (la.type === 'none' || lb.type === 'none') continue
        const sp = Math.abs(third.speed)
        const fasterThanA = sp > Math.abs(ga.speed), fasterThanB = sp > Math.abs(gb.speed)
        const kinds = [la.type, lb.type].filter(x => x === 'ithasala').length
        const mix = kinds === 2 ? (hi ? 'दोहरा इत्थशाल' : 'a double ithsala') : kinds === 1 ? (hi ? 'एक इत्थशाल, एक ईसराफ़' : 'one ithsala, one ishraf') : (hi ? 'दोहरा ईसराफ़' : 'a double ishraf')
        const tone: BookTone = kinds === 0 ? 'bad' : kinds === 1 ? 'mixed' : 'good'
        if (fasterThanA && fasterThanB) push(`nakta-${third.id}`, tone, t('Nakta yoga', 'नक्त योग'), hi
          ? `${pairName} में दृष्टि नहीं; तेज़ ${N(third.id, lang)} दोनों को जोड़ता है (${mix}): किसी की सहायता से शीघ्र फल।`
          : `${pairName} not in aspect; the faster ${N(third.id, lang)} links both (${mix}): quick results through someone's help.`)
        else if (!fasterThanA && !fasterThanB) push(`yamaya-${third.id}`, kinds === 2 ? 'mixed' : 'bad', t('Yamaya yoga', 'यमया योग'), hi
          ? `${pairName} में दृष्टि नहीं; धीमा ${N(third.id, lang)} दोनों को जोड़ता है (${mix}): विलंब और कठिनाई से।`
          : `${pairName} not in aspect; the slower ${N(third.id, lang)} links both (${mix}): with delay and difficulty.`)
        else push(`linked-${third.id}`, 'mixed', t('Mixed linkage', 'मिश्रित संबंध'), hi
          ? `${N(third.id, lang)} एक से तेज़, दूसरे से धीमा होकर दोनों को जोड़ता है (${mix}): कठिनाई के साथ, किसी की सहायता से शुभ फल।`
          : `${N(third.id, lang)}, faster than one and slower than the other, links both (${mix}): favourable with difficulty, through someone's help.`)
      }
    }
  }

  // 6. Moon with only one of them, when the pair is not linked
  const moon = G.get('Mo')
  if (moon && a !== 'Mo' && b !== 'Mo' && link.type === 'none') {
    const withOne = [ga, gb].filter(g => tajikaLink(moon, g).type !== 'none' || moon.rashi === g.rashi).map(g => g.id)
    if (withOne.length === 1) push('moon-one', 'neutral', t('The Moon with one only', 'चंद्र केवल एक से'), hi
      ? `चंद्र केवल ${N(withOne[0], lang)} से जुड़ा, दूसरे से नहीं: अकेले इससे कार्य सिद्धि नहीं।`
      : `The Moon is tied to ${N(withOne[0], lang)} only, not the other: that alone does not fulfil the query.`)
  }

  // 7. Rahu / Ketu with a yoga planet: same sign, or the axis within 3°
  for (const node of ['Ra', 'Ke'] as GrahaId[]) {
    const ng = G.get(node)
    if (!ng) continue
    const hit = [ga, gb].filter((g, i, arr) => arr.indexOf(g) === i).filter(g => g.rashi === ng.rashi || Math.abs(norm(g.lonSidereal - ng.lonSidereal + 180) - 180) <= 3)
    if (hit.length) push(`node-${node}`, 'bad', t('Rahu–Ketu', 'राहु–केतु'), hi
      ? `${N(node, lang)} का ${list(hit.map(g => g.id), lang)} से संबंध (राशि या निकट अंश): सामान्यतः अशुभ, असफलता की ओर।`
      : `${N(node, lang)} associated with ${list(hit.map(g => g.id), lang)} (same sign or close degrees): generally unfavourable, tends to failure.`)
  }

  return out
}

// ── The book's 15 sahams ────────────────────────────────────

export type BookSahamId =
  | 'punya' | 'vidya' | 'yasha' | 'raj' | 'matri' | 'putra' | 'roga' | 'karma'
  | 'mrityu' | 'dhana' | 'labha' | 'vivaha' | 'karyasiddhi' | 'preeti' | 'bandhan'

type Term = GrahaId | 'L' | `H${number}` | `LL${number}` | 'LSu' | 'LMo' | BookSahamId
interface BookSahamDef { id: BookSahamId; name: T; for: T; day: [Term, Term, Term]; night: 'reverse' | 'same' | [Term, Term, Term]; adverse?: boolean }

export const BOOK_SAHAMS: BookSahamDef[] = [
  { id: 'punya', name: t('Punya', 'पुण्य'), for: t('auspiciousness', 'शुभता'), day: ['Mo', 'Su', 'L'], night: 'reverse' },
  { id: 'vidya', name: t('Vidya (Guru)', 'विद्या (गुरु)'), for: t('higher education, knowledge', 'उच्च शिक्षा, ज्ञान'), day: ['Su', 'Mo', 'L'], night: 'reverse' },
  { id: 'yasha', name: t('Yasha', 'यश'), for: t('fame', 'कीर्ति'), day: ['Ju', 'punya', 'L'], night: 'reverse' },
  { id: 'raj', name: t('Raj / Pitra', 'राज / पितृ'), for: t('royal favour, father', 'राज कृपा, पिता'), day: ['Sa', 'Su', 'L'], night: 'reverse' },
  { id: 'matri', name: t('Matri', 'मातृ'), for: t('mother', 'माता'), day: ['Mo', 'Ve', 'L'], night: 'reverse' },
  { id: 'putra', name: t('Putra', 'पुत्र'), for: t('children', 'संतान'), day: ['Ju', 'Mo', 'L'], night: 'same' },
  { id: 'roga', name: t('Roga', 'रोग'), for: t('disease', 'रोग'), day: ['Sa', 'Mo', 'L'], night: 'reverse', adverse: true },
  { id: 'karma', name: t('Karma', 'कर्म'), for: t('profession', 'व्यवसाय'), day: ['Ma', 'Me', 'L'], night: 'reverse' },
  { id: 'mrityu', name: t('Mrityu', 'मृत्यु'), for: t('death', 'मृत्यु'), day: ['H8', 'Mo', 'Sa'], night: 'same', adverse: true },
  { id: 'dhana', name: t('Dhana', 'धन'), for: t('wealth', 'धन'), day: ['H2', 'LL2', 'L'], night: 'same' },
  { id: 'labha', name: t('Labha', 'लाभ'), for: t('gains', 'लाभ'), day: ['H11', 'LL11', 'L'], night: 'same' },
  { id: 'vivaha', name: t('Vivaha', 'विवाह'), for: t('marriage', 'विवाह'), day: ['Ve', 'Sa', 'L'], night: 'same' },
  { id: 'karyasiddhi', name: t('Karya siddhi', 'कार्य सिद्धि'), for: t('success', 'सफलता'), day: ['Sa', 'Su', 'LSu'], night: ['Sa', 'Mo', 'LMo'] },
  { id: 'preeti', name: t('Preeti', 'प्रीति'), for: t('emotional affairs', 'प्रेम संबंध'), day: ['vidya', 'punya', 'L'], night: 'same' },
  { id: 'bandhan', name: t('Bandhan', 'बंधन'), for: t('imprisonment, detention', 'कारावास, बंदी'), day: ['punya', 'Sa', 'L'], night: 'reverse', adverse: true },
]

export interface BookSaham {
  id: BookSahamId
  name: string
  for: string
  longitude: number
  rashi: Rashi
  degree: number
  lord: GrahaId
  house: number
  adverse: boolean
  plus30: boolean
}

export function bookSahams(c: BookChart, lang: EngineLang = 'en'): BookSaham[] {
  const G = new Map(c.grahas.map(g => [g.id, g]))
  const asc = norm(c.ascDegree)
  const ascRashi = (Math.floor(asc / 30) + 1) as Rashi
  const sun = G.get('Su')
  const isDay = c.isDay ?? (sun ? sunAboveHorizon(asc, sun.lonSidereal) : true)
  const done: Partial<Record<BookSahamId, number>> = {}
  const lon = (x: Term): number | undefined => {
    if (x === 'L') return asc
    if (x === 'LSu' || x === 'LMo') { const g = G.get(x === 'LSu' ? 'Su' : 'Mo'); return g ? G.get(lordOf(g.rashi))?.lonSidereal : undefined }
    if (/^H\d+$/.test(x)) return norm(asc + 30 * (Number(x.slice(1)) - 1))
    if (/^LL\d+$/.test(x)) return G.get(lordOf(nth(ascRashi, Number(x.slice(2)))))?.lonSidereal
    if (x in done) return done[x as BookSahamId]
    return G.get(x as GrahaId)?.lonSidereal
  }
  const out: BookSaham[] = []
  for (const def of BOOK_SAHAMS) {
    let terms = def.day
    if (!isDay) terms = def.night === 'same' ? def.day : def.night === 'reverse' ? [def.day[1], def.day[0], def.day[2]] : def.night
    const [A, B, C] = terms.map(lon)
    if (A == null || B == null || C == null) continue
    const p = sahamPoint(A, B, C)
    done[def.id] = p.lon
    const rashi = (Math.floor(p.lon / 30) + 1) as Rashi
    out.push({
      id: def.id, name: P(def.name, lang), for: P(def.for, lang),
      longitude: Math.round(p.lon * 100) / 100, rashi, degree: Math.round((p.lon % 30) * 100) / 100,
      lord: lordOf(rashi), house: houseFrom(ascRashi, rashi), adverse: !!def.adverse, plus30: p.plus30,
    })
  }
  return out
}

/** The book's five rules on a saham: lord's dignity, lord on the saham, aspects, 6/8/12, adverse vs auspicious. */
export function readBookSaham(c: BookChart, s: BookSaham, lang: EngineLang = 'en'): BookReading {
  const hi = lang === 'hi'
  const G = new Map(c.grahas.map(g => [g.id, g]))
  const lord = G.get(s.lord)
  const notes: string[] = []
  let score = 0
  if (lord) {
    const r = RANK[lord.dignity]
    if (r >= 3) { score++; notes.push(hi ? `स्वामी ${N(s.lord, lang)} बली (स्व/उच्च)` : `lord ${N(s.lord, lang)} strong (own or exalted)`) }
    else if (r < 0) { score--; notes.push(hi ? `स्वामी ${N(s.lord, lang)} दुर्बल (शत्रु/नीच)` : `lord ${N(s.lord, lang)} weak (enemy sign or debilitated)`) }
    if (lord.rashi === s.rashi || hasParasharaAspect(lord.rashi, lord.id, s.rashi)) { score++; notes.push(hi ? 'स्वामी सहम पर बैठा या उसे देखता' : 'lord occupies or aspects the saham') }
  }
  const on = (set: Set<GrahaId>) => c.grahas.filter(g => set.has(g.id) && (g.rashi === s.rashi || hasParasharaAspect(g.rashi, g.id, s.rashi))).map(g => g.id)
  const ben = on(BENEFICS), mal = on(MALEFICS)
  if (ben.length) { score++; notes.push(hi ? `शुभ प्रभाव: ${list(ben, lang)}` : `benefic influence: ${list(ben, lang)}`) }
  if (mal.length) { score--; notes.push(hi ? `पाप प्रभाव: ${list(mal, lang)}` : `malefic influence: ${list(mal, lang)}`) }
  if (DUST.includes(s.house)) { score--; notes.push(hi ? `${s.house}वें भाव में` : `in house ${s.house}`) }
  const strongSaham = score > 0
  // A saham in 6, 8 or 12 gives poor results for its matter, however strong its lord.
  const dust = DUST.includes(s.house)
  const tone: BookTone = s.adverse
    ? (strongSaham ? 'bad' : score < 0 ? 'good' : 'neutral')
    : dust ? (strongSaham ? 'mixed' : 'bad') : (strongSaham ? 'good' : score < 0 ? 'bad' : 'neutral')
  const where = `${S(s.rashi, lang)} ${s.degree.toFixed(1)}°, ${hi ? `${s.house}वाँ भाव` : `house ${s.house}`}`
  const verdict = s.adverse
    ? (strongSaham ? (hi ? 'अशुभ सहम बली: चिंता का विषय।' : 'an adverse saham that is strong: a concern.') : (hi ? 'अशुभ सहम दुर्बल, जैसा होना चाहिए।' : 'an adverse saham that is weak, as it should be.'))
    : dust && strongSaham ? (hi ? 'स्वामी बली, पर सहम 6/8/12 में: मिश्रित फल।' : 'its lord helps, but the saham sits in 6, 8 or 12: mixed.')
    : (strongSaham ? (hi ? 'शुभ सहम बली: उस विषय के लिए शुभ।' : 'strong: good for the matter.') : score < 0 ? (hi ? 'दुर्बल: उस विषय में कमी।' : 'weak: the matter suffers.') : (hi ? 'मध्यम।' : 'middling.'))
  return { id: `saham-${s.id}`, tone, title: `${s.name} ${hi ? 'सहम' : 'saham'}`, text: `${where}${notes.length ? ` · ${notes.join('; ')}` : ''}${hi ? '। ' : '. '}${verdict}` }
}

/** Book sahams for each praśna matter. */
export const BOOK_TOPIC_SAHAMS: Record<string, BookSahamId[]> = {
  general: ['karyasiddhi', 'punya'],
  career: ['raj', 'karma'],
  money: ['dhana', 'labha'],
  marriage: ['vivaha', 'preeti'],
  children: ['putra'],
  health: ['roga', 'mrityu'],
  education: ['vidya'],
  property: ['karyasiddhi'],
  travel: ['karyasiddhi'],
  dispute: ['bandhan', 'karyasiddhi'],
}

// ── Reference text ──────────────────────────────────────────

export interface BookSection { id: string; title: string; intro?: string; rows?: Array<{ term: string; text: string; tone?: BookTone }>; points?: string[] }

interface BookSectionDef { id: string; title: T; intro?: T; rows?: Array<{ term: T; text: T; tone?: BookTone }>; points?: T[] }

const SECTIONS: BookSectionDef[] = [
  {
    id: 'aspects', title: t('Tajika aspects and orbs', 'ताजिक दृष्टि और दीप्तांश'),
    intro: t('Speed, fast to slow: Moon, Mercury, Venus, Sun, Mars, Jupiter, Saturn (Rahu and Ketu between Jupiter and Saturn). Orb for a pair: the mean of their deeptamshas.', 'गति, तेज़ से धीमा: चंद्र, बुध, शुक्र, सूर्य, मंगल, गुरु, शनि (राहु-केतु गुरु और शनि के बीच)। जोड़े का दीप्तांश: दोनों का औसत।'),
    rows: [
      { term: t('5, 9', '5, 9'), tone: 'good', text: t('Openly friendly (pratyaksha mitra).', 'प्रत्यक्ष मित्र।') },
      { term: t('3, 11', '3, 11'), tone: 'good', text: t('Secretly friendly (gupta mitra).', 'गुप्त मित्र।') },
      { term: t('1, 7', '1, 7'), tone: 'bad', text: t('Openly inimical (pratyaksha shatru).', 'प्रत्यक्ष शत्रु।') },
      { term: t('4, 10', '4, 10'), tone: 'bad', text: t('Secretly inimical (gupta shatru).', 'गुप्त शत्रु।') },
      { term: t('2, 6, 8, 12', '2, 6, 8, 12'), tone: 'neutral', text: t('Neutral: not counted at all.', 'सम: गिनी ही नहीं जाती।') },
    ],
    points: [
      t('Deeptamsha: Sun 15, Moon 12, Mars 8, Mercury 7, Jupiter 9, Venus 7, Saturn 9.', 'दीप्तांश: सूर्य 15, चंद्र 12, मंगल 8, बुध 7, गुरु 9, शुक्र 7, शनि 9।'),
      t('Any two house lords can be read as the pair: for obstacles to children, 5L with 8L, or 5L with 12L (8th from the 5th).', 'कोई भी दो भावेश जोड़े के रूप में पढ़े जा सकते हैं: संतान की बाधा के लिए 5वें का स्वामी 8वें के स्वामी से, या 12वें के स्वामी (5वें से 8वाँ) से।'),
      t('A yoga works only if its planets, the Lagna, Lagna lord and Moon are strong.', 'योग तभी फल देता है जब उसके ग्रह, लग्न, लग्नेश और चंद्र बली हों।'),
    ],
  },
  {
    id: 'ithsala', title: t('Ithsala and its kinds', 'इत्थशाल और उसके प्रकार'),
    intro: t('Faster planet behind the slower, in a non-neutral aspect, within the mean orb. The gap gives the timing. Its result depends on the lords: lagnesh with 8L brings trouble, with 10L promotion.', 'तेज़ ग्रह धीमे के पीछे, सम के अलावा किसी दृष्टि में, औसत दीप्तांश के भीतर। अंतर से समय। फल स्वामियों पर: लग्नेश का 8वें के स्वामी से कष्ट, 10वें के स्वामी से पदोन्नति।'),
    rows: [
      { term: t('Vartamana', 'वर्तमान'), tone: 'good', text: t('Formed now: the event in the near future.', 'अभी बना: घटना निकट भविष्य में।') },
      { term: t('Purna', 'पूर्ण'), tone: 'good', text: t('Within ±1°: the event is immediate.', '±1° के भीतर: घटना तुरंत।') },
      { term: t('Bhavishyat', 'भविष्यत्'), tone: 'mixed', text: t('Forms on a sign change, or when 1° or less beyond the mean orb (the author rejects "within the sum of orbs" as too liberal): after delay.', 'राशि बदलने पर बने, या औसत दीप्तांश से 1° या कम बाहर हो (लेखक "दीप्तांशों के योग के भीतर" को बहुत उदार मानते हैं): विलंब से।') },
    ],
  },
  {
    id: 'yogas', title: t('The sixteen yogas', 'सोलह योग'),
    rows: [
      { term: t('Iqbal', 'इकबाल'), tone: 'good', text: t('All (or most) planets in 1, 2, 4, 5, 7, 10, 11. The author leaves out the 8th: any planet there obstructs.', 'सब (या अधिकांश) ग्रह 1, 2, 4, 5, 7, 10, 11 में। लेखक 8वाँ छोड़ते हैं: वहाँ कोई भी ग्रह अड़चन।') },
      { term: t('Induvaar', 'इन्दुवार'), tone: 'bad', text: t('All or most in 3, 6, 9, 12: failure. Planets in the 9th usually give good results, so excuse them.', 'सब या अधिकांश 3, 6, 9, 12 में: असफलता। 9वें के ग्रह प्रायः शुभ, इसलिए उन्हें छोड़ें।') },
      { term: t('Ithsala', 'इत्थशाल'), tone: 'good', text: t('Applying aspect within orb: future event; the most important yoga.', 'दीप्तांश में निकट आती दृष्टि: भविष्य की घटना; सबसे महत्वपूर्ण योग।') },
      { term: t('Ishraf', 'ईसराफ़'), tone: 'bad', text: t('Faster planet ahead by more than 1°: past event, failure. Worse for malefics, retrograde or combust; worst if also 6/8/12 lords.', 'तेज़ ग्रह 1° से अधिक आगे: बीती घटना, असफलता। पाप, वक्री या अस्त हों तो बुरा; साथ में 6/8/12 के स्वामी हों तो बहुत बुरा।') },
      { term: t('Nakta', 'नक्त'), tone: 'mixed', text: t('Pair not in aspect; a faster third planet links both (double ithsala, ithsala + ishraf, or double ishraf): quick, through someone.', 'जोड़े में दृष्टि नहीं; तेज़ तीसरा ग्रह दोनों को जोड़े (दोहरा इत्थशाल, इत्थशाल + ईसराफ़, या दोहरा ईसराफ़): शीघ्र, किसी के माध्यम से।') },
      { term: t('Yamaya', 'यमया'), tone: 'mixed', text: t('As Nakta with a slower third planet: delay and difficulty. A linker faster than one and slower than the other: success with difficulty, through someone.', 'नक्त जैसा पर धीमा तीसरा ग्रह: विलंब और कठिनाई। एक से तेज़, दूसरे से धीमा जोड़ने वाला: कठिनाई से सफलता, किसी के माध्यम से।') },
      { term: t('Manau', 'मणऊ'), tone: 'bad', text: t('A malefic afflicts the faster planet of the ithsala by conjunction or aspect within orb: cancelled.', 'इत्थशाल के तेज़ ग्रह पर पाप ग्रह की युति या दीप्तांश में दृष्टि: भंग।') },
      { term: t('Kamboola', 'कम्बूल'), tone: 'good', text: t('The Moon in ithsala with one or both: sure result, whole-hearted effort.', 'चंद्र का एक या दोनों से इत्थशाल: निश्चित फल, पूरे मन का प्रयास।') },
      { term: t('Gaira-kamboola', 'गैरी-कम्बूल'), tone: 'good', text: t('The Moon at the end of a sign will join them in the next: Kamboola with delay.', 'राशि के अंत में चंद्र अगली राशि में उनसे जुड़ेगा: विलंब से कम्बूल।') },
      { term: t('Khallasara', 'खल्लासर'), tone: 'bad', text: t('Ithsala but the Moon involved with neither: the ithsala is destroyed.', 'इत्थशाल पर चंद्र किसी से नहीं जुड़ा: इत्थशाल नष्ट।') },
      { term: t('Rudda', 'रुद्द'), tone: 'bad', text: t('One of the pair retrograde, combust, debilitated or in 6/8/12 (in that order): cancelled. In good houses, reversal then success; from 6/8/12 or with their lords, permanent.', 'जोड़े में एक वक्री, अस्त, नीच या 6/8/12 में (इसी क्रम में): भंग। शुभ भावों में हो तो उलटफेर फिर सफलता; 6/8/12 से या उनके स्वामियों से हो तो स्थायी।') },
      { term: t('Durapha', 'दुरफ'), tone: 'bad', text: t('Both of the ithsala weak (6/8/12, retrograde, combust): failure.', 'इत्थशाल के दोनों ग्रह दुर्बल (6/8/12, वक्री, अस्त): असफलता।') },
      { term: t('Duphali-kutha', 'दुफालि-कुत्थ'), tone: 'good', text: t('The slower planet stronger (own sign, exaltation): more fruitful.', 'धीमा ग्रह अधिक बली (स्वराशि, उच्च): अधिक फलदायी।') },
      { term: t('Duthotha-davira', 'दुत्थोत्थ-दवीर'), tone: 'mixed', text: t('Both weak, one in ithsala with a strong planet: success through someone\'s help.', 'दोनों दुर्बल, एक का बलवान ग्रह से इत्थशाल: किसी की सहायता से सफलता।') },
      { term: t('Tambira', 'तम्बीर'), tone: 'mixed', text: t('No aspect; one at the end of its sign will join a strong planet in the next: after effort and delay, through someone.', 'दृष्टि नहीं; एक राशि के अंत में अगली राशि में बलवान ग्रह से जुड़ेगा: प्रयास और विलंब के बाद, किसी के माध्यम से।') },
      { term: t('Kutha', 'कुत्थ'), tone: 'good', text: t('Ithsala in kendras or panpharas with benefic aspects and no malefic influence: karya siddhi.', 'केंद्र या पणफर में इत्थशाल, शुभ दृष्टि, पाप प्रभाव नहीं: कार्य सिद्धि।') },
    ],
  },
  {
    id: 'rules', title: t('Judging a query by Tajika', 'ताजिक से प्रश्न का निर्णय'),
    intro: t('Lagnesh and karyesh must be joined by one of:', 'लग्नेश और कार्येश इनमें से किसी से जुड़े हों:'),
    points: [
      t('Lagnesh in the Lagna and karyesh in its own house; or an exchange; or both together; or mutual aspect.', 'लग्नेश लग्न में और कार्येश अपने भाव में; या परिवर्तन; या दोनों साथ; या परस्पर दृष्टि।'),
      t('A favourable ithsala or kamboola.', 'शुभ इत्थशाल या कम्बूल।'),
      t('The yoga free of retrograde, combust or debilitated planets and of 6/8/12 houses or lords.', 'योग वक्री, अस्त या नीच ग्रहों से और 6/8/12 भावों या स्वामियों से मुक्त।'),
      t('The yoga planets free of the Rahu–Ketu axis and of close degrees with them.', 'योग के ग्रह राहु–केतु अक्ष से और उनसे निकट अंशों से मुक्त।'),
      t('No link, ishraf, rudda, 6/8/12 involvement or Rahu–Ketu closeness: failure.', 'संबंध नहीं, ईसराफ़, रुद्द, 6/8/12 का संबंध या राहु–केतु की निकटता: असफलता।'),
      t('The Moon joining a good link (aspect, conjunction, kamboola) brings success; the Moon with only one of them does not.', 'अच्छे संबंध से चंद्र का जुड़ना (दृष्टि, युति, कम्बूल) सफलता देता है; केवल एक से जुड़ा चंद्र नहीं।'),
    ],
  },
  {
    id: 'sahams', title: t('Sahams (day formula; night reverses A and B unless noted)', 'सहम (दिन का सूत्र; रात में A और B उलटें, जब तक अलग न लिखा हो)'),
    rows: BOOK_SAHAMS.map(s => ({
      term: s.name,
      text: t(`${s.for.en}: ${s.day.join(' − ').replace(/ − (\S+)$/, ' + $1')}${s.night === 'same' ? ' (day and night)' : Array.isArray(s.night) ? ` (night: ${s.night.join(' − ').replace(/ − (\S+)$/, ' + $1')})` : ''}`,
        `${s.for.hi}: ${s.day.join(' − ').replace(/ − (\S+)$/, ' + $1')}${s.night === 'same' ? ' (दिन और रात)' : Array.isArray(s.night) ? ` (रात: ${s.night.join(' − ').replace(/ − (\S+)$/, ' + $1')})` : ''}`),
      ...(s.adverse ? { tone: 'bad' as BookTone } : {}),
    })),
    points: [
      t('A − B + C; if C does not fall between B and A, add 30°. Example: Moon 4s 3°42′ − Sun 8s 9°12′ + Asc 10s 23°40′ = 6s 18°10′ (Libra 18°10′).', 'A − B + C; यदि C, B और A के बीच न हो तो 30° जोड़ें। उदाहरण: चंद्र 4रा 3°42′ − सूर्य 8रा 9°12′ + लग्न 10रा 23°40′ = 6रा 18°10′ (तुला 18°10′)।'),
      t('Judge by the saham lord\'s dignity, its lord on it, benefic or malefic aspects, and 6/8/12. Adverse sahams (roga, mrityu, bandhan) should be weak; good ones (punya, dhana, karya siddhi) strong.', 'सहम के स्वामी की गरिमा, स्वामी का उस पर होना, शुभ या पाप दृष्टि, और 6/8/12 से परखें। अशुभ सहम (रोग, मृत्यु, बंधन) दुर्बल हों; शुभ (पुण्य, धन, कार्य सिद्धि) बली।'),
    ],
  },
]

const TERM_HI: Record<string, string> = {
  Su: 'सू', Mo: 'चं', Ma: 'मं', Me: 'बु', Ju: 'गु', Ve: 'शु', Sa: 'श', L: 'लग्न',
  H2: 'भा2', H8: 'भा8', H11: 'भा11', LL2: '2वें का स्वामी', LL11: '11वें का स्वामी', LSu: 'सूर्य राशि का स्वामी', LMo: 'चंद्र राशि का स्वामी',
  punya: 'पुण्य', vidya: 'विद्या',
}
const TERM_EN: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', L: 'Asc',
  H2: '2H cusp', H8: '8H cusp', H11: '11H cusp', LL2: '2L', LL11: '11L', LSu: 'lord of Sun sign', LMo: 'lord of Moon sign',
  punya: 'Punya', vidya: 'Vidya',
}

export function tajikaBookSections(lang: EngineLang = 'en'): BookSection[] {
  const term = (x: string) => (lang === 'hi' ? TERM_HI : TERM_EN)[x] ?? x
  return SECTIONS.map(s => ({
    id: s.id,
    title: P(s.title, lang),
    ...(s.intro ? { intro: P(s.intro, lang) } : {}),
    ...(s.rows ? { rows: s.rows.map(r => ({ term: P(r.term, lang), text: P(r.text, lang).replace(/\b(Su|Mo|Ma|Me|Ju|Ve|Sa|L|H\d+|LL\d+|LSu|LMo|punya|vidya)\b/g, term), ...(r.tone ? { tone: r.tone } : {}) })) } : {}),
    ...(s.points ? { points: s.points.map(p => P(p, lang)) } : {}),
  }))
}
