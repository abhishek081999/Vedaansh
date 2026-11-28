// ─────────────────────────────────────────────────────────────
//  src/lib/engine/vedicPrashna.ts
//  Vedic praśna: Parashari significators (lagna lord, kārya-bhāva lord, kāraka,
//  Moon) plus the sixteen Tajika yogas between them (ithasala, ishrafa,
//  nakta, yamaya, manau, kamboola, radda, kuttha and the rest), as used in
//  praśna works such as Nīlakaṇṭha's Praśna Tantra. Detection is in tajika.ts.
//  Pure, no React/DB/Redis.
// ─────────────────────────────────────────────────────────────

import type { BhavaBalaResult, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { hasParasharaAspect, wholeSignCount } from './aspects'
import { checkTajikaAspect, findTajikaYogas, futureIthasala, tajikaLink, type TajikaYogaHit } from './tajika'
import { panchavargiyaFor, type PanchavargiyaBala } from './tajikaBala'
import { SAHAMS, TOPIC_SAHAMS, computeSahams } from './tajikaSahams'
import {
  KENDRAS, SEVEN_GRAHAS, SIGN_TABLE, TRIKONAS,
  buildChartFacts, grahaName, listNames, ordinal, signName,
  type ChartFacts, type SatpanchasikaChartInput,
} from './satpanchasikaFacts'
import { synthesiseVerdict, type SatpanchasikaVerdict } from './satpanchasikaEngine'
import type { EngineLang } from './lang'
import { VEDIC_HEADLINE_HI, VEDIC_NOTICE_HI, VEDIC_STUDY_HI, VEDIC_TOPIC_HI } from './locale/vedicPrashna.hi'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { dignityText } from './divisionalLang'
import type { Dignity } from '@/types/astrology'

// ── Hindi display helpers ──────────────────────────────────────
const ORD_HI = ['', 'पहले', 'दूसरे', 'तीसरे', 'चौथे', 'पाँचवें', 'छठे', 'सातवें', 'आठवें', 'नौवें', 'दसवें', 'ग्यारहवें', 'बारहवें']
const say = (L: EngineLang, en: string, hi: string) => (L === 'hi' ? hi : en)
const gN = (id: GrahaId, L: EngineLang) => (L === 'hi' ? GRAHA_HI[id] ?? grahaName(id) : grahaName(id))
const sN = (r: Rashi, L: EngineLang) => (L === 'hi' ? RASHI_HI[r] ?? signName(r) : signName(r))
const oH = (h: number) => `${ORD_HI[h] ?? `${h}वें`} भाव`
const listN = (ids: GrahaId[], L: EngineLang) => {
  if (L !== 'hi') return listNames(ids)
  const n = ids.map((id) => gN(id, L))
  return n.length <= 1 ? n[0] ?? '' : `${n.slice(0, -1).join(', ')} और ${n[n.length - 1]}`
}
const dig = (d: string, L: EngineLang) => (L === 'hi' ? dignityText(d as Dignity, 'hi') : d.replace('_', ' '))

export type VedicTopic =
  | 'general' | 'career' | 'money' | 'marriage' | 'children'
  | 'health' | 'education' | 'property' | 'travel' | 'dispute'

export interface VedicTopicMeta {
  id: VedicTopic
  label: string
  hint: string
  house: number
  karaka: GrahaId
  notice?: string
}

export const VEDIC_TOPICS: VedicTopicMeta[] = [
  { id: 'general', label: 'General matter', hint: '1st house, Sun', house: 1, karaka: 'Su' },
  { id: 'career', label: 'Career or post', hint: '10th house, Saturn', house: 10, karaka: 'Sa' },
  { id: 'money', label: 'Money or gain', hint: '11th house, Jupiter', house: 11, karaka: 'Ju', notice: 'Traditional indication only, not financial advice.' },
  { id: 'marriage', label: 'Marriage or partner', hint: '7th house, Venus', house: 7, karaka: 'Ve' },
  { id: 'children', label: 'Children', hint: '5th house, Jupiter', house: 5, karaka: 'Ju', notice: 'Traditional indication only, not medical advice.' },
  { id: 'health', label: 'Illness and recovery', hint: '6th house, Sun', house: 6, karaka: 'Su', notice: 'Traditional indication only, not medical advice. Please rely on a qualified doctor.' },
  { id: 'education', label: 'Study or exam', hint: '5th house, Mercury', house: 5, karaka: 'Me' },
  { id: 'property', label: 'Home or property', hint: '4th house, Mars', house: 4, karaka: 'Ma' },
  { id: 'travel', label: 'Long journey', hint: '9th house, Jupiter', house: 9, karaka: 'Ju' },
  { id: 'dispute', label: 'Dispute or lawsuit', hint: '6th house, Mars', house: 6, karaka: 'Ma', notice: 'Traditional indication only, not legal advice.' },
]

export { DEEPTAMSA, tajikaLink, type TajikaLink, type TajikaLinkType } from './tajika'

export type VedicPolarity = 'favourable' | 'unfavourable' | 'mixed' | 'descriptive'

export interface VedicFactor {
  id: string
  group: 'Significators' | 'Their connection' | 'Tajika' | 'The Moon' | 'The house'
  title: string
  detail: string
  polarity: VedicPolarity
  weight: number
}

export interface VedicTiming {
  name: string
  value: string
  /** Days from the question, when this method gives a countable span. */
  days?: number
  working: string
}

export interface VedicPrashnaReading {
  topic: VedicTopic
  topicLabel: string
  verdict: SatpanchasikaVerdict
  headline: string
  clarity: number
  weights: { favourable: number; unfavourable: number; mixed: number }
  significators: { lagnaLord: GrahaId; karyaHouse: number; karyaLord: GrahaId; karaka: GrahaId }
  factors: VedicFactor[]
  timing: VedicTiming[]
  strengthSource: 'shadbala' | 'dignity'
  notices: string[]
}

export type VedicChartInput = SatpanchasikaChartInput & { bhavaBala?: BhavaBalaResult }

const DUSTHANAS = [6, 8, 12]
const NODES: GrahaId[] = ['Ra', 'Ke']

const HEADLINES: Record<SatpanchasikaVerdict, string> = {
  favourable: 'Indications favour the matter being fulfilled',
  with_difficulty: 'Fulfilment is indicated, with difficulty',
  leans_unfavourable: 'Indications lean against the matter',
  unfavourable: 'Indications do not support the matter',
  no_change: 'No clear change is shown',
  indication_only: 'Indications only',
  insufficient: 'Too few signals to read',
}

const STUDY_NOTE = 'A study framework from classical praśna practice, not a forecast. Test it on past questions with known outcomes and keep a log of hits and misses.'

function significatorFactor(f: ChartFacts, id: GrahaId, role: string, factorId: string, weight: number, L: EngineLang = 'en'): VedicFactor {
  const g = f.grahas[id]
  const h = f.house(id)
  const factor = f.strengthFactor(id)
  const notes = L === 'hi'
    ? [
      `${sN(g.rashi, L)} में, ${oH(h)}`,
      dig(g.dignity, L),
      `बल ${factor.toFixed(2)}`,
      ...(g.isCombust ? ['अस्त'] : []),
      ...(g.isRetro ? ['वक्री'] : []),
    ]
    : [
      `in ${signName(g.rashi)}, ${ordinal(h)} house`,
      g.dignity.replace('_', ' '),
      `strength ${factor.toFixed(2)}`,
      ...(g.isCombust ? ['combust'] : []),
      ...(g.isRetro ? ['retrograde'] : []),
    ]
  const weak = factor < 1 || g.isCombust || g.dignity === 'debilitated'
  const badHouse = DUSTHANAS.includes(h)
  const polarity: VedicPolarity = !weak && !badHouse ? 'favourable' : weak && badHouse ? 'unfavourable' : 'mixed'
  const weakness = g.dignity === 'debilitated' ? 'debilitated' : g.isCombust ? 'combust' : 'weak'
  const verdictText = polarity === 'favourable' ? 'is strong and well placed' : polarity === 'unfavourable' ? `is ${weakness} and in a difficult house` : weak ? `is ${weakness}, though not in a difficult house` : 'is strong but in a difficult house'
  const weakHi = weakness === 'debilitated' ? 'नीच का' : weakness === 'combust' ? 'अस्त' : 'कमज़ोर'
  const verdictHi = polarity === 'favourable' ? 'बलवान और अच्छी स्थिति में है' : polarity === 'unfavourable' ? `${weakHi} है और कठिन भाव में है` : weak ? `${weakHi} है, हालाँकि कठिन भाव में नहीं` : 'बलवान है पर कठिन भाव में है'
  return {
    id: factorId,
    group: 'Significators',
    title: L === 'hi' ? `${role} ${gN(id, L)} ${verdictHi}` : `${role} ${grahaName(id)} ${verdictText}`,
    detail: notes.join(' · '),
    polarity,
    weight: Math.round(weight * Math.max(0.75, Math.min(1.25, factor)) * 100) / 100,
  }
}

function connectionFactor(f: ChartFacts, a: GrahaId, b: GrahaId, karyaHouse: number, L: EngineLang = 'en'): VedicFactor {
  const base = { id: 'connection', group: 'Their connection' as const, weight: 3 }
  if (a === b) {
    return { ...base, title: say(L, `One planet, ${grahaName(a)}, rules both the lagna and the matter`, `एक ही ग्रह, ${gN(a, L)}, लग्न और प्रश्न के विषय दोनों का स्वामी है`), detail: say(L, 'The querist and the matter share a lord.', 'प्रश्नकर्ता और विषय का स्वामी एक ही है।'), polarity: 'favourable' }
  }
  const ga = f.grahas[a]
  const gb = f.grahas[b]
  const links: string[] = []
  const lordOf = (rashi: Rashi) => f.lordOf(wholeSignCount(f.lagna, rashi))
  if (ga.rashi === gb.rashi) links.push(say(L, `joined in ${signName(ga.rashi)}`, `${sN(ga.rashi, L)} में साथ`))
  if (lordOf(ga.rashi) === b && lordOf(gb.rashi) === a) links.push(say(L, 'exchange of signs', 'राशि परिवर्तन'))
  const aToB = hasParasharaAspect(ga.rashi, a, gb.rashi)
  const bToA = hasParasharaAspect(gb.rashi, b, ga.rashi)
  if (aToB && bToA) links.push(say(L, 'mutual aspect', 'परस्पर दृष्टि'))
  else if (aToB) links.push(say(L, `${grahaName(a)} aspects ${grahaName(b)}`, `${gN(a, L)} की ${gN(b, L)} पर दृष्टि`))
  else if (bToA) links.push(say(L, `${grahaName(b)} aspects ${grahaName(a)}`, `${gN(b, L)} की ${gN(a, L)} पर दृष्टि`))
  if (f.house(a) === karyaHouse) links.push(say(L, `lagna lord in the ${ordinal(karyaHouse)}`, `लग्नेश ${oH(karyaHouse)} में`))
  if (f.house(b) === 1) links.push(say(L, 'matter\'s lord in the lagna', 'विषय का स्वामी लग्न में'))
  const ab = say(L, `${grahaName(a)} and ${grahaName(b)}`, `${gN(a, L)} और ${gN(b, L)}`)
  return links.length
    ? { ...base, title: say(L, 'The querist and the matter are connected', 'प्रश्नकर्ता और विषय आपस में जुड़े हैं'), detail: say(L, `${ab}: ${links.join(', ')}.`, `${ab}: ${links.join(', ')}।`), polarity: 'favourable' }
    : { ...base, weight: 2, title: say(L, 'No Parashari link between the querist and the matter', 'प्रश्नकर्ता और विषय के बीच कोई पाराशरी संबंध नहीं'), detail: say(L, `${ab} are not joined, in exchange or in aspect.`, `${ab} न साथ हैं, न परिवर्तन में, न दृष्टि में।`), polarity: 'unfavourable' }
}

const GRADE_HI = { uttama: 'उत्तम', madhyama: 'मध्यम', adhama: 'अधम' } as const

export function tajikaYogaFactor(y: TajikaYogaHit, L: EngineLang): VedicFactor {
  const group = 'Tajika' as const
  const [p, q, r, s] = y.planets as [GrahaId, GrahaId, GrahaId?, GrahaId?]
  const en = (id?: GrahaId) => (id ? grahaName(id) : '')
  const hi = (id?: GrahaId) => (id ? gN(id, L) : '')
  const pair = say(L, `${en(p)} and ${en(q)}`, `${hi(p)} और ${hi(q)}`)
  const l = y.link
  switch (y.id) {
    case 'ikkabala':
      return { id: 'ikkabala', group, weight: 1.5, polarity: 'favourable',
        title: say(L, 'Ikkabāla: every planet in a kendra or paṇaphara', 'इक्कबाल: हर ग्रह केंद्र या पणफर में'),
        detail: say(L, 'No planet is in a falling house (3rd, 6th, 9th, 12th), so the chart has the strength to act.', 'कोई ग्रह आपोक्लिम (3, 6, 9, 12) में नहीं, इसलिए कुंडली में कार्य करने का बल है।') }
    case 'induvara':
      return { id: 'induvara', group, weight: 1.5, polarity: 'unfavourable',
        title: say(L, 'Induvāra: every planet in a falling house', 'इन्दुवार: हर ग्रह आपोक्लिम में'),
        detail: say(L, 'All seven are in the 3rd, 6th, 9th or 12th, so the chart lacks the strength to act.', 'सातों ग्रह 3, 6, 9 या 12वें भाव में हैं, इसलिए कुंडली में कार्य करने का बल नहीं।') }
    case 'ithasala':
      return { id: 'ithasala', group, weight: 4, polarity: l!.aspect === 'friendly' ? 'favourable' : 'mixed',
        title: l!.gap <= 1
          ? say(L, `Pūrṇa ithasala between ${pair}: the matter is about to complete`, `${pair} के बीच पूर्ण इत्थशाल: विषय पूरा होने को है`)
          : say(L, `Vartamāna ithasala between ${pair}: the matter is applying`, `${pair} के बीच वर्तमान इत्थशाल: विषय निकट आ रहा है`),
        detail: say(L,
          `${l!.gap}° apart, inside the ${l!.orb}° orb, in ${l!.aspect === 'friendly' ? 'a friendly' : 'a hostile'} aspect${l!.aspect === 'hostile' ? ', so it comes with friction' : ''}.${l!.gap <= 1 ? ' Within 1°: the event comes very soon.' : ' The process is already active; other houses show whether the result is good.'}`,
          `${l!.gap}° की दूरी, ${l!.orb}° दीप्तांश के भीतर, ${l!.aspect === 'friendly' ? 'मित्र' : 'शत्रु'} दृष्टि में${l!.aspect === 'hostile' ? ', इसलिए यह घर्षण के साथ आता है' : ''}।${l!.gap <= 1 ? ' 1° के भीतर: घटना बहुत शीघ्र।' : ' प्रक्रिया आरंभ हो चुकी है; परिणाम अच्छा है या नहीं, अन्य भाव बताते हैं।'}`) }
    case 'bhavishyat-ithasala':
      return { id: 'bhavishyat-ithasala', group, weight: 3, polarity: l!.aspect === 'friendly' ? 'favourable' : 'mixed',
        title: say(L, `Bhaviṣyat ithasala: ${en(p)} will apply to ${en(q)} from the next sign`, `भविष्यत् इत्थशाल: ${hi(p)} अगली राशि से ${hi(q)} की ओर बढ़ेगा`),
        detail: say(L, `${en(p)} is at the end of its sign, ${l!.gap}° from ${en(q)} across the cusp, inside the ${l!.orb}° orb. The link forms once it changes sign, so the matter comes later.`, `${hi(p)} अपनी राशि के अंत में है, संधि के पार ${hi(q)} से ${l!.gap}°, ${l!.orb}° दीप्तांश के भीतर। राशि बदलते ही संबंध बनेगा, इसलिए विषय बाद में आता है।`) }
    case 'ishrafa':
      return { id: 'ishrafa', group, weight: 3, polarity: 'unfavourable',
        title: say(L, `Ishrafa between ${pair}: the moment has passed`, `${pair} के बीच ईसराफ़: क्षण बीत चुका है`),
        detail: say(L, `${l!.gap}° apart and separating. The contact is over, so the matter tends to slip away.`, `${l!.gap}° की दूरी और अलग हो रहे हैं। संपर्क बीत चुका है, इसलिए विषय हाथ से निकलने की प्रवृत्ति रखता है।`) }
    case 'nakta':
      return { id: `nakta-${r}`, group, weight: 2.5, polarity: 'favourable',
        title: say(L, `Nakta: ${en(r)} carries the matter between them`, `नक्त: ${hi(r)} विषय को उनके बीच ले जाता है`),
        detail: say(L, `${pair} are not joined. Faster than both, ${en(r)} applies to each: fulfilment through a go-between.`, `${pair} आपस में नहीं जुड़े। दोनों से तेज़, ${hi(r)} दोनों की ओर बढ़ता है: किसी मध्यस्थ के माध्यम से पूर्ति।`) }
    case 'yamaya':
      return { id: `yamaya-${r}`, group, weight: 2.5, polarity: 'favourable',
        title: say(L, `Yamaya: ${en(r)} gathers the matter`, `यमया: ${hi(r)} विषय को समेटता है`),
        detail: say(L, `${pair} are not joined, but both apply to the slower ${en(r)}: fulfilment through a third party.`, `${pair} आपस में नहीं जुड़े, पर दोनों धीमे ${hi(r)} की ओर बढ़ते हैं: किसी तीसरे व्यक्ति के माध्यम से पूर्ति।`) }
    case 'manau':
      return { id: 'manau', group, weight: 3, polarity: 'unfavourable',
        title: say(L, `Manaū: ${en(r)} cuts the ithasala`, `मणऊ: ${hi(r)} इत्थशाल को काटता है`),
        detail: say(L, `${en(r)} is in hostile aspect to a significator, inside its orb. Obstruction from a rival or authority.`, `${hi(r)} की कारक पर शत्रु दृष्टि है, दीप्तांश के भीतर। किसी प्रतिद्वंद्वी या अधिकारी से बाधा।`) }
    case 'kamboola': {
      const grade = y.grade!
      return { id: 'kamboola', group, weight: grade === 'uttama' ? 3 : grade === 'madhyama' ? 2 : 1.5, polarity: 'favourable',
        title: say(L, `Kamboola (${grade}): the Moon supports the ithasala`, `कंबूल (${GRADE_HI[grade]}): चंद्र इत्थशाल को सहारा देता है`),
        detail: say(L, `The Moon applies to ${en(s)}. Grade from the dignity of the Moon and ${en(s)}.`, `चंद्र ${hi(s)} की ओर बढ़ रहा है। श्रेणी चंद्र और ${hi(s)} की गरिमा से।`) }
    }
    case 'gairi-kamboola':
      return { id: 'gairi-kamboola', group, weight: 1.5, polarity: 'favourable',
        title: say(L, 'Gairi-kamboola: the Moon will lend support from the next sign', 'गैरि-कंबूल: चंद्र अगली राशि से सहारा देगा'),
        detail: say(L, `The Moon joins no planet now, but on changing sign it applies to a strong ${en(s)}. Help comes, a little late.`, `चंद्र अभी किसी ग्रह से नहीं जुड़ा, पर राशि बदलने पर बलवान ${hi(s)} की ओर बढ़ता है। सहायता आती है, थोड़ी देर से।`) }
    case 'khallasara':
      return { id: 'khallasara', group, weight: 2, polarity: 'unfavourable',
        title: say(L, 'Khallāsara: the Moon is void and gives no support', 'खल्लासर: चंद्र शून्य मार्ग में, सहारा नहीं'),
        detail: say(L, 'The Moon is in no Tajika aspect within orb to any planet, so the ithasala yields little.', 'चंद्र दीप्तांश के भीतर किसी ग्रह से ताजिक दृष्टि में नहीं, इसलिए इत्थशाल का फल थोड़ा रहता है।') }
    case 'radda': {
      const combust = y.cause === 'combust'
      return { id: 'radda', group, weight: 3, polarity: 'unfavourable',
        title: say(L, `Radda: ${en(r)} spoils the ithasala`, `रद्द: ${hi(r)} इत्थशाल को बिगाड़ता है`),
        detail: say(L, `${pair} form the ithasala, but ${en(r)} is ${combust ? 'combust' : 'retrograde'}. The matter comes close and then turns back.`, `${pair} इत्थशाल बनाते हैं, पर ${hi(r)} ${combust ? 'अस्त' : 'वक्री'} है। विषय पास आकर लौट जाता है।`) }
    }
    case 'durupha':
      return { id: 'durupha', group, weight: 2.5, polarity: 'unfavourable',
        title: say(L, `Durupha: both ${pair} are weak`, `दुरुफ: ${pair} दोनों दुर्बल`),
        detail: say(L, 'Each is weak by pañcavargīya bala or in the 6th, 8th or 12th. The ithasala lacks the strength to deliver.', 'हर एक पंचवर्गीय बल से दुर्बल है या 6, 8, 12वें भाव में। इत्थशाल में फल देने का बल नहीं।') }
    case 'dutthottha-davira':
      return { id: 'dutthottha-davira', group, weight: 2, polarity: 'mixed',
        title: say(L, `Dutthottha-davīra: a strong ${en(r)} lifts the weak significators`, `दुत्थोत्थ-दवीर: बलवान ${hi(r)} दुर्बल कारकों को उठाता है`),
        detail: say(L, `A significator applies to ${en(r)}, which is strong by pañcavargīya bala. Success with others' help and effort.`, `एक कारक ${hi(r)} की ओर बढ़ता है, जो पंचवर्गीय बल से बलवान है। दूसरों की सहायता और प्रयत्न से सफलता।`) }
    case 'duphali-kuttha':
      return { id: 'duphali-kuttha', group, weight: 2, polarity: 'favourable',
        title: say(L, `Duphāli-kuttha: the strong ${en(q)} carries the weak ${en(p)}`, `दुफालि-कुत्थ: बलवान ${hi(q)} दुर्बल ${hi(p)} को सँभालता है`),
        detail: say(L, `The faster ${en(p)} is weak, the slower ${en(q)} is strong by pañcavargīya bala. The matter succeeds through the stronger side.`, `तेज़ ${hi(p)} दुर्बल है, धीमा ${hi(q)} पंचवर्गीय बल से बलवान है। विषय बलवान पक्ष से सफल होता है।`) }
    case 'kuttha':
      return { id: 'kuttha', group, weight: 2.5, polarity: 'favourable',
        title: say(L, `Kuttha: ${pair} are strong and well placed`, `कुत्थ: ${pair} बलवान और अच्छी स्थिति में`),
        detail: say(L, 'Neither is weak, at least one is strong by pañcavargīya bala, and both are in kendras or paṇapharas.', 'कोई दुर्बल नहीं, कम से कम एक पंचवर्गीय बल से बलवान, और दोनों केंद्र या पणफर में।') }
    case 'tambira':
      return { id: 'tambira', group, weight: 2, polarity: 'favourable',
        title: say(L, `Tambīra: a significator will reach the strong ${en(r)} in the next sign`, `तंबीर: एक कारक अगली राशि में बलवान ${hi(r)} तक पहुँचेगा`),
        detail: say(L, `${pair} are not in ithasala, but one is at the end of its sign and will apply to ${en(r)} once it moves on. Fulfilment later, through ${en(r)}.`, `${pair} इत्थशाल में नहीं, पर एक अपनी राशि के अंत में है और आगे बढ़ते ही ${hi(r)} की ओर बढ़ेगा। ${hi(r)} के माध्यम से बाद में पूर्ति।`) }
  }
}

function tajikaFactors(f: ChartFacts, a: GrahaId, b: GrahaId, bala: Record<string, PanchavargiyaBala>, L: EngineLang = 'en'): VedicFactor[] {
  const yogas = findTajikaYogas({ grahas: f.grahas, house: f.house, band: id => bala[id]?.band ?? 'middling' }, a, b)
  const out = yogas.map(y => tajikaYogaFactor(y, L))
  const joined = yogas.some(y => !['ikkabala', 'induvara'].includes(y.id))
  if (a !== b && !joined) {
    const link = tajikaLink(f.grahas[a], f.grahas[b])
    const pair = say(L, `${grahaName(link.fast)} and ${grahaName(link.slow)}`, `${gN(link.fast, L)} और ${gN(link.slow, L)}`)
    out.push({ id: 'no-tajika', group: 'Tajika', weight: 2, title: say(L, 'No Tajika link between the significators', 'कारकों के बीच कोई ताजिक संबंध नहीं'), detail: say(L,
      `${pair} are ${link.aspect === 'none' ? 'in signs without Tajika aspect' : `${link.gap}° apart, outside the ${link.orb}° orb`}, and no third planet carries the light.`,
      `${pair} ${link.aspect === 'none' ? 'ऐसी राशियों में हैं जिनमें ताजिक दृष्टि नहीं' : `${link.gap}° दूर हैं, ${link.orb}° दीप्तांश से बाहर`}, और कोई तीसरा ग्रह प्रकाश नहीं पहुँचाता।`), polarity: 'unfavourable' })
  }
  return out
}

const BAND_HI = { strong: 'बलवान', middling: 'मध्यम', weak: 'दुर्बल' } as const

/** The matter's chief saham: where it falls, and the strength and reach of its lord. */
function sahamFactor(f: ChartFacts, ascDegree: number, topic: VedicTopic, lagnaLord: GrahaId, bala: Record<string, PanchavargiyaBala>, L: EngineLang): VedicFactor | null {
  const id = TOPIC_SAHAMS[topic]?.[0]
  if (!id || SEVEN_GRAHAS.some(g => !f.grahas[g])) return null
  const s = computeSahams({ ascDegree, grahas: f.grahas }, L === 'hi' ? 'hi' : 'en').find(x => x.id === id)!
  const lord = f.grahas[s.lord]
  const band = bala[s.lord]?.band ?? 'middling'
  const badHouse = DUSTHANAS.includes(s.house)
  const lordSees = s.lord === lagnaLord ? false : checkTajikaAspect(lord.rashi, s.rashi) !== 'neutral' || lord.rashi === s.rashi
  const joinsLagnaLord = s.lord === lagnaLord || tajikaLink(lord, f.grahas[lagnaLord]).type === 'ithasala'
  const good = Number(band === 'strong') + Number(!badHouse) + Number(lordSees || s.lord === lagnaLord) + Number(joinsLagnaLord)
  const polarity: VedicPolarity = band === 'weak' && badHouse ? 'unfavourable' : good >= 3 ? 'favourable' : good <= 1 ? 'unfavourable' : 'mixed'
  const name = SAHAMS.find(x => x.id === id)!
  return {
    id: 'saham', group: 'Tajika', weight: 2, polarity,
    title: say(L, `${name.en} saham in the ${ordinal(s.house)}, its lord ${grahaName(s.lord)} ${band}`, `${name.hi} सहम ${oH(s.house)} में, स्वामी ${gN(s.lord, L)} ${BAND_HI[band]}`),
    detail: say(L,
      `${s.degree.toFixed(1)}° ${signName(s.rashi)}${badHouse ? ', a difficult house' : ''}. ${grahaName(s.lord)} has pañcavargīya bala ${bala[s.lord]?.total.toFixed(1)}/20${lordSees ? ' and aspects the saham' : ''}${joinsLagnaLord && s.lord !== lagnaLord ? ', in ithasala with the lagna lord' : ''}${s.lord === lagnaLord ? ' and is the lagna lord itself' : ''}.`,
      `${sN(s.rashi, L)} ${s.degree.toFixed(1)}°${badHouse ? ', कठिन भाव' : ''}। ${gN(s.lord, L)} का पंचवर्गीय बल ${bala[s.lord]?.total.toFixed(1)}/20${lordSees ? ', सहम पर दृष्टि' : ''}${joinsLagnaLord && s.lord !== lagnaLord ? ', लग्नेश से इत्थशाल' : ''}${s.lord === lagnaLord ? ', स्वयं लग्नेश' : ''}।`),
  }
}

function moonFactors(f: ChartFacts, karyaHouse: number, L: EngineLang = 'en'): VedicFactor[] {
  const group = 'The Moon' as const
  const h = f.house('Mo')
  const moon = f.grahas.Mo
  const out: VedicFactor[] = [{
    id: 'moon-phase', group, weight: 1.5,
    title: f.moonWaxing ? say(L, 'Waxing Moon supports the mind of the question', 'बढ़ता चंद्र प्रश्न के मन को सहारा देता है') : say(L, 'Waning Moon weakens the support', 'घटता चंद्र सहारे को कमज़ोर करता है'),
    detail: say(L, `${f.elongation.toFixed(0)}° from the Sun, ${moon.dignity.replace('_', ' ')}.`, `सूर्य से ${f.elongation.toFixed(0)}°, ${dig(moon.dignity, L)}।`),
    polarity: f.moonWaxing ? 'favourable' : 'unfavourable',
  }]
  if (DUSTHANAS.includes(h)) {
    out.push({ id: 'moon-house', group, weight: 2, title: say(L, `Moon in the ${ordinal(h)}, a difficult house`, `चंद्र ${oH(h)} में, जो कठिन भाव है`), detail: say(L, `In ${signName(moon.rashi)}.`, `${sN(moon.rashi, L)} में।`), polarity: 'unfavourable' })
  } else if (KENDRAS.includes(h) || TRIKONAS.includes(h)) {
    out.push({ id: 'moon-house', group, weight: 2, title: say(L, `Moon in the ${ordinal(h)}, a strong house`, `चंद्र ${oH(h)} में, जो बलवान भाव है`), detail: say(L, `In ${signName(moon.rashi)}.`, `${sN(moon.rashi, L)} में।`), polarity: 'favourable' })
  }
  const sign = f.signAt(karyaHouse)
  if (h === karyaHouse || f.aspects('Mo', sign)) {
    out.push({ id: 'moon-link', group, weight: 1.5, title: say(L, `Moon touches the ${ordinal(karyaHouse)}`, `चंद्र ${oH(karyaHouse)} को छूता है`), detail: say(L, 'The mind of the querist is on the matter, and the matter is active.', 'प्रश्नकर्ता का मन विषय पर है, और विषय सक्रिय है।'), polarity: 'favourable' })
  }
  return out
}

function houseFactors(f: ChartFacts, chart: VedicChartInput, karyaHouse: number, L: EngineLang = 'en'): VedicFactor[] {
  const group = 'The house' as const
  const out: VedicFactor[] = []
  const sign = f.signAt(karyaHouse)
  const lord = f.lordOf(karyaHouse)
  const touching = (ids: GrahaId[]) => ids.filter(id => id !== lord && (f.house(id) === karyaHouse || f.aspects(id, sign)))
  const good = touching(f.benefics)
  const bad = touching(f.malefics)
  const nodes = chart.grahas.filter(g => NODES.includes(g.id) && g.rashi === sign).map(g => g.id)
  if (good.length) out.push({ id: 'house-good', group, weight: 2, title: say(L, `Benefics on the ${ordinal(karyaHouse)}`, `${oH(karyaHouse)} पर शुभ ग्रह`), detail: say(L, `On ${signName(sign)}, by placement or aspect: ${listNames(good)}.`, `${sN(sign, L)} पर, स्थिति या दृष्टि से: ${listN(good, L)}।`), polarity: 'favourable' })
  if (bad.length || nodes.length) out.push({ id: 'house-bad', group, weight: 2, title: say(L, `Malefics on the ${ordinal(karyaHouse)}`, `${oH(karyaHouse)} पर पाप ग्रह`), detail: say(L, `On ${signName(sign)}, by placement or aspect: ${listNames([...bad, ...nodes])}.`, `${sN(sign, L)} पर, स्थिति या दृष्टि से: ${listN([...bad, ...nodes], L)}।`), polarity: 'unfavourable' })

  // Kartari: the same kind of planet on both sides of the house.
  const before = f.inHouse(((karyaHouse + 10) % 12) + 1)
  const after = f.inHouse((karyaHouse % 12) + 1)
  if (before.length && after.length) {
    if (before.every(id => !f.isBenefic(id)) && after.every(id => !f.isBenefic(id))) {
      out.push({ id: 'papakartari', group, weight: 2.5, title: say(L, `Pāpakartari: the ${ordinal(karyaHouse)} is hemmed in by malefics`, `पापकर्तरी: ${oH(karyaHouse)} पाप ग्रहों से घिरा है`), detail: say(L, `${listNames(before)} before it and ${listNames(after)} after it.`, `इससे पहले ${listN(before, L)} और इसके बाद ${listN(after, L)}।`), polarity: 'unfavourable' })
    } else if (before.every(f.isBenefic) && after.every(f.isBenefic)) {
      out.push({ id: 'shubhakartari', group, weight: 2.5, title: say(L, `Śubhakartari: the ${ordinal(karyaHouse)} is protected by benefics`, `शुभकर्तरी: ${oH(karyaHouse)} शुभ ग्रहों से सुरक्षित है`), detail: say(L, `${listNames(before)} before it and ${listNames(after)} after it.`, `इससे पहले ${listN(before, L)} और इसके बाद ${listN(after, L)}।`), polarity: 'favourable' })
    }
  }
  const bala = chart.bhavaBala?.houses?.[karyaHouse]
  if (bala) {
    out.push({
      id: 'bhava-bala', group, weight: 1.5,
      title: say(L, `Bhāva bala of the ${ordinal(karyaHouse)} is ${bala.isStrong ? 'strong' : 'weak'}`, `${oH(karyaHouse)} का भाव बल ${bala.isStrong ? 'प्रबल' : 'कमज़ोर'} है`),
      detail: say(L, `${bala.totalRupa.toFixed(2)} rūpas.`, `${bala.totalRupa.toFixed(2)} रूप।`),
      polarity: bala.isStrong ? 'favourable' : 'unfavourable',
    })
  }
  const eighth = f.inHouse(8).filter(id => !f.isBenefic(id))
  if (eighth.length) {
    out.push({ id: 'eighth', group, weight: 1, title: say(L, 'Malefics in the 8th add obstacles', 'आठवें भाव में पाप ग्रह बाधाएँ जोड़ते हैं'), detail: say(L, `${listNames(eighth)} in ${signName(f.signAt(8))}.`, `${sN(f.signAt(8), L)} में ${listN(eighth, L)}।`), polarity: 'unfavourable' })
  }
  return out
}

function buildTiming(f: ChartFacts, a: GrahaId, b: GrahaId, L: EngineLang = 'en'): VedicTiming[] {
  const out: VedicTiming[] = []
  const h = f.house(b)
  const kind = KENDRAS.includes(h) ? 0 : [2, 5, 8, 11].includes(h) ? 1 : 2
  const pace = L === 'hi' ? ['जल्दी', 'मध्यम', 'देर से'][kind]! : ['Sooner', 'Moderate', 'Later'][kind]!
  const angle = ['a kendra', 'a paṇaphara', 'an āpoklima'][kind]!
  const angleHi = ['केंद्र', 'पणफर', 'आपोक्लिम'][kind]!
  out.push({
    name: say(L, 'Pace from the matter\'s lord', 'विषय के स्वामी से गति'),
    value: pace,
    working: say(L, `${grahaName(b)} is in the ${ordinal(h)}, ${angle} house. This gives pace only, not a date.`, `${gN(b, L)} ${oH(h)} में है, जो ${angleHi} भाव है। इससे केवल गति मिलती है, तिथि नहीं।`),
  })
  if (a !== b) {
    const link = tajikaLink(f.grahas[a], f.grahas[b])
    if (link.type === 'ithasala') {
      const mobility = SIGN_TABLE[f.grahas[link.fast].rashi].mobility
      const unit = mobility === 'movable' ? 'days' : mobility === 'dual' ? 'months' : 'years'
      const unitHi = unit === 'days' ? 'दिन' : unit === 'months' ? 'महीने' : 'वर्ष'
      const mobHi = mobility === 'movable' ? 'चर' : mobility === 'dual' ? 'द्विस्वभाव' : 'स्थिर'
      const n = Math.max(1, Math.round(link.gap))
      out.push({
        name: say(L, 'Ithasala degrees', 'इत्थशाल के अंश'),
        days: n * (unit === 'days' ? 1 : unit === 'months' ? 30 : 365),
        value: say(L, `About ${n} ${unit}`, `लगभग ${n} ${unitHi}`),
        working: say(L, `${link.gap}° to perfect, with ${grahaName(link.fast)} in a ${mobility} sign. This unit convention is common but varies between authors.`, `पूर्ण होने में ${link.gap}°, ${gN(link.fast, L)} ${mobHi} राशि में। यह इकाई का प्रचलित नियम है, पर लेखकों में भिन्न है।`),
      })
      if (link.daysAtCurrentSpeed !== null) {
        out.push({
          name: say(L, 'Astronomical perfection', 'खगोलीय पूर्णता'),
          days: link.daysAtCurrentSpeed,
          value: say(L, `About ${link.daysAtCurrentSpeed} days`, `लगभग ${link.daysAtCurrentSpeed} दिन`),
          working: say(L, 'When the aspect becomes exact at current speeds. This is a transit date, not a promise of the event.', 'वर्तमान गति से दृष्टि कब सटीक होगी। यह गोचर की तिथि है, घटना का वादा नहीं।'),
        })
      }
    } else {
      const future = futureIthasala(f.grahas[a], f.grahas[b])
      if (future?.daysAtCurrentSpeed != null) {
        out.push({
          name: say(L, 'Astronomical perfection', 'खगोलीय पूर्णता'),
          days: future.daysAtCurrentSpeed,
          value: say(L, `About ${future.daysAtCurrentSpeed} days`, `लगभग ${future.daysAtCurrentSpeed} दिन`),
          working: say(L, 'When the bhaviṣyat ithasala becomes exact at current speeds, across the sign change. A transit date, not a promise of the event.', 'वर्तमान गति से भविष्यत् इत्थशाल राशि बदलने के बाद कब सटीक होगा। गोचर की तिथि, घटना का वादा नहीं।'),
        })
      }
    }
  }
  return out
}

export function runVedicPrashna(chart: VedicChartInput, topicId: VedicTopic, lang: EngineLang = 'en'): VedicPrashnaReading {
  const f = buildChartFacts(chart)
  const topic = VEDIC_TOPICS.find(t => t.id === topicId)
  if (!topic) throw new Error(`Unknown Vedic prashna topic: ${topicId}`)
  const lagnaLord = f.lagnaLord
  const karyaLord = f.lordOf(topic.house)
  const bala = panchavargiyaFor(f.grahas, SEVEN_GRAHAS)

  const factors: VedicFactor[] = [
    significatorFactor(f, lagnaLord, say(lang, 'Lagna lord', 'लग्नेश'), 'lagna-lord', 3, lang),
    ...(karyaLord !== lagnaLord ? [significatorFactor(f, karyaLord, say(lang, `${ordinal(topic.house)} lord`, `${oH(topic.house)} का स्वामी`), 'karya-lord', 3, lang)] : []),
    ...(topic.karaka !== lagnaLord && topic.karaka !== karyaLord ? [significatorFactor(f, topic.karaka, say(lang, 'Kāraka', 'कारक'), 'karaka', 1.5, lang)] : []),
    connectionFactor(f, lagnaLord, karyaLord, topic.house, lang),
    ...tajikaFactors(f, lagnaLord, karyaLord, bala, lang),
    ...[sahamFactor(f, chart.lagnas.ascDegree, topic.id, lagnaLord, bala, lang)].filter((x): x is VedicFactor => x !== null),
    ...moonFactors(f, topic.house, lang),
    ...houseFactors(f, chart, topic.house, lang),
  ]
  if (f.lagnaDegree < 1 || f.lagnaDegree > 29) {
    factors.push({ id: 'sandhi', group: 'The house', title: say(lang, 'Lagna at a sign junction', 'राशि संधि पर लग्न'), detail: say(lang, `${f.lagnaDegree.toFixed(2)}° of ${signName(f.lagna)}. The rising sign itself is uncertain, so treat this reading with care.`, `${sN(f.lagna, lang)} का ${f.lagnaDegree.toFixed(2)}°। उदित राशि ही अनिश्चित है, इसलिए इस फल को सावधानी से लें।`), polarity: 'descriptive', weight: 0 })
  }

  const scored = factors.filter(x => x.polarity !== 'descriptive') as Array<VedicFactor & { polarity: 'favourable' | 'unfavourable' | 'mixed' }>
  const synthesis = synthesiseVerdict(scored)
  factors.sort((x, y) => y.weight - x.weight)

  return {
    topic: topic.id,
    topicLabel: lang === 'hi' ? (VEDIC_TOPIC_HI[topic.id] ?? topic.label) : topic.label,
    verdict: synthesis.verdict,
    headline: lang === 'hi' ? VEDIC_HEADLINE_HI[synthesis.verdict] : HEADLINES[synthesis.verdict],
    clarity: synthesis.clarity,
    weights: { favourable: synthesis.weights.favourable, unfavourable: synthesis.weights.unfavourable, mixed: synthesis.weights.mixed },
    significators: { lagnaLord, karyaHouse: topic.house, karyaLord, karaka: topic.karaka },
    factors,
    timing: buildTiming(f, lagnaLord, karyaLord, lang),
    strengthSource: f.strengthSource,
    notices: [
      lang === 'hi' ? VEDIC_STUDY_HI : STUDY_NOTE,
      ...(topic.notice ? [lang === 'hi' ? (VEDIC_NOTICE_HI[topic.id] ?? topic.notice) : topic.notice] : []),
    ],
  }
}
