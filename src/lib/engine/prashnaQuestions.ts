// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaQuestions.ts
//  M1 study aids from the praśna class notes:
//   • a checklist per kind of question (houses, their lords, signs and
//     occupants, the kārakas, and whether the question looks genuine),
//   • the 12-question scheme (where the reference point moves for each
//     further question asked of one chart),
//   • clues for a lost or stolen item (D1 / D9 lagna type, Mars, Saturn,
//     the Moon, Ishrafa and Ithasala).
//  Each line states its rule. Nothing here forms a verdict. Pure.
// ─────────────────────────────────────────────────────────────

import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import type { EngineLang } from './lang'
import { hasParasharaAspect } from './aspects'
import { dignityText } from './divisionalLang'
import { GRAHA_LABEL, SIGN_TABLE, signName } from './satpanchasikaFacts'
import { TAJIKA_SIGN_LORD, panchavargiyaBala } from './tajikaBala'
import { tajikaLink } from './tajika'

type T = { en: string; hi: string }
const pick = (t: T, L: EngineLang) => (L === 'hi' ? t.hi : t.en)
const gName = (id: GrahaId, L: EngineLang) => (L === 'hi' ? GRAHA_HI[id] ?? id : GRAHA_LABEL[id] ?? id)
const sName = (r: Rashi, L: EngineLang) => (L === 'hi' ? RASHI_HI[r] : signName(r))
const MALEFICS: GrahaId[] = ['Su', 'Ma', 'Sa', 'Ra', 'Ke']
const DUSTHANA = [6, 8, 12]

// ── Kinds of question ──────────────────────────────────────

export type QuestionKind =
  | 'job' | 'promotion' | 'transfer' | 'marriage' | 'children' | 'health'
  | 'propertySale' | 'lost' | 'quarrel' | 'accident' | 'police'

interface QuestionDef {
  id: QuestionKind
  label: T
  /** House of the matter first; the lagna is always added. */
  houses: Array<{ house: number; role: T }>
  /** Karyesha: the lord of this house is the lord of the matter. */
  karyeshaHouse: number
  karakas: Array<{ id: GrahaId; role: T }>
  note?: T
}

const H = (house: number, en: string, hi: string) => ({ house, role: { en, hi } })
const K = (id: GrahaId, en: string, hi: string) => ({ id, role: { en, hi } })

export const QUESTION_KINDS: QuestionDef[] = [
  {
    id: 'job', label: { en: 'Job or interview', hi: 'नौकरी या साक्षात्कार' }, karyeshaHouse: 6,
    houses: [H(10, 'Job, karma, the work itself', 'नौकरी, कर्म, कार्य स्वयं'), H(6, 'Service, competition (karyesha)', 'सेवा, प्रतियोगिता (कार्येश)'), H(11, 'Desire and expectation', 'इच्छा और अपेक्षा'), H(3, 'Effort: a weak 3rd cannot deliver', 'प्रयास: कमज़ोर तीसरा भाव निभा नहीं पाता')],
    karakas: [K('Sa', 'Service, labour', 'सेवा, श्रम'), K('Su', 'Authority, government', 'अधिकार, सरकार')],
  },
  {
    id: 'promotion', label: { en: 'Promotion', hi: 'पदोन्नति' }, karyeshaHouse: 10,
    houses: [H(10, 'Position and status', 'पद और प्रतिष्ठा'), H(5, 'Advancement', 'उन्नति'), H(11, 'Gains, fulfilment', 'लाभ, पूर्ति')],
    karakas: [K('Su', 'Rank, authority', 'पद, अधिकार'), K('Ju', 'Growth', 'वृद्धि')],
  },
  {
    id: 'transfer', label: { en: 'Transfer', hi: 'स्थानांतरण' }, karyeshaHouse: 5,
    houses: [H(5, 'Transfer (as taught in class)', 'स्थानांतरण (कक्षा में बताए अनुसार)'), H(10, 'The job', 'नौकरी')],
    karakas: [K('Mo', 'Movement, the mind', 'गति, मन')],
    note: { en: 'The class gave the 5th for transfer. Other texts also read the 3rd, 4th and 12th; compare them.', hi: 'कक्षा में स्थानांतरण के लिए पाँचवाँ भाव बताया गया। अन्य ग्रंथ तीसरा, चौथा और बारहवाँ भी देखते हैं; तुलना करें।' },
  },
  {
    id: 'marriage', label: { en: 'Marriage', hi: 'विवाह' }, karyeshaHouse: 7,
    houses: [H(7, 'Spouse, marriage (karyesha)', 'जीवनसाथी, विवाह (कार्येश)'), H(2, 'Family, addition to the family', 'कुटुंब, परिवार में वृद्धि')],
    karakas: [K('Ve', 'Marriage, spouse', 'विवाह, जीवनसाथी'), K('Ju', 'Blessing, husband', 'आशीर्वाद, पति'), K('Ra', 'Desire; read D1 and D9 (no dasha in praśna)', 'इच्छा; D1 और D9 देखें (प्रश्न में दशा नहीं)'), K('Mo', 'The mind on it', 'उस पर मन')],
    note: { en: 'Dārā pada is not used here.', hi: 'यहाँ दारा पद का प्रयोग नहीं होता।' },
  },
  {
    id: 'children', label: { en: 'Children', hi: 'संतान' }, karyeshaHouse: 5,
    houses: [H(5, 'Children (karyesha)', 'संतान (कार्येश)')],
    karakas: [K('Ju', 'Children', 'संतान')],
  },
  {
    id: 'health', label: { en: 'Health or operation', hi: 'स्वास्थ्य या ऑपरेशन' }, karyeshaHouse: 6,
    houses: [H(6, 'Illness, operation (karyesha)', 'रोग, ऑपरेशन (कार्येश)'), H(12, 'Hospital, expense', 'अस्पताल, व्यय'), H(8, 'Chronic trouble', 'दीर्घ कष्ट')],
    karakas: [K('Su', 'Vitality', 'प्राणशक्ति'), K('Mo', 'Mind, fluids', 'मन, द्रव')],
    note: { en: 'Traditional indication only, not medical advice.', hi: 'केवल पारंपरिक संकेत, चिकित्सा सलाह नहीं।' },
  },
  {
    id: 'propertySale', label: { en: 'Selling land, house or flat', hi: 'ज़मीन, घर या फ्लैट बेचना' }, karyeshaHouse: 4,
    houses: [H(4, 'The property itself (karyesha)', 'संपत्ति स्वयं (कार्येश)'), H(2, 'Money received', 'प्राप्त धन'), H(7, 'Dealings, the buyer: kind, direction, distance', 'सौदा, खरीदार: प्रकार, दिशा, दूरी'), H(8, 'Obstacles', 'बाधाएँ'), H(10, 'Legalities: documents, registry, litigation', 'कानूनी पक्ष: दस्तावेज़, रजिस्ट्री, मुकदमा'), H(11, 'Gain, a fair price', 'लाभ, उचित मूल्य')],
    karakas: [K('Ma', 'Land', 'भूमि'), K('Mo', 'The home', 'घर')],
  },
  {
    id: 'lost', label: { en: 'Lost or stolen item', hi: 'खोई या चोरी हुई वस्तु' }, karyeshaHouse: 2,
    houses: [H(2, 'Movable wealth', 'चल संपत्ति'), H(4, 'The home, where it was kept', 'घर, जहाँ रखी थी'), H(7, 'The thief or other party', 'चोर या दूसरा पक्ष'), H(12, 'Loss', 'हानि'), H(10, 'Police, legal support', 'पुलिस, कानूनी सहायता')],
    karakas: [K('Ma', 'Theft (karyesha for a stolen item)', 'चोरी (चोरी की वस्तु का कार्येश)'), K('Sa', 'Servants, labourers; iron', 'नौकर, श्रमिक; लोहा'), K('Mo', 'The mind on the loss', 'हानि पर मन')],
  },
  {
    id: 'quarrel', label: { en: 'Fight or quarrel', hi: 'लड़ाई या झगड़ा' }, karyeshaHouse: 6,
    houses: [H(6, 'Enemies, the quarrel', 'शत्रु, झगड़ा'), H(7, 'The other party', 'दूसरा पक्ष')],
    karakas: [K('Ma', 'Fights and quarrels', 'लड़ाई-झगड़े')],
  },
  {
    id: 'accident', label: { en: 'Accident', hi: 'दुर्घटना' }, karyeshaHouse: 8,
    houses: [H(8, 'Sudden events, accident', 'अचानक घटनाएँ, दुर्घटना'), H(6, 'Injury', 'चोट')],
    karakas: [K('Ma', 'Accidents, injury', 'दुर्घटना, चोट'), K('Ke', 'Accidents, sudden events', 'दुर्घटना, अचानक घटनाएँ')],
  },
  {
    id: 'police', label: { en: 'Police matter', hi: 'पुलिस का मामला' }, karyeshaHouse: 10,
    houses: [H(10, 'Authority, police, government', 'अधिकार, पुलिस, सरकार'), H(6, 'Dispute, the case', 'विवाद, मामला')],
    karakas: [K('Ma', 'Police: read Mars with the 10th', 'पुलिस: मंगल को दसवें के साथ देखें')],
  },
]

// ── Chart input ────────────────────────────────────────────

export interface QuestionChartInput {
  ascRashi: Rashi
  grahas: GrahaData[]
  /** Navāṃśa lagna and planet signs, when the chart has them. */
  d9?: { ascRashi: Rashi; signs: Partial<Record<GrahaId, Rashi>> }
}

const houseOf = (asc: Rashi, r: Rashi) => ((r - asc + 12) % 12) + 1
const signAt = (asc: Rashi, h: number) => (((asc - 1 + h - 1) % 12) + 1) as Rashi
const byId = (c: QuestionChartInput) => Object.fromEntries(c.grahas.map(g => [g.id, g])) as Record<string, GrahaData>

export interface PlanetPlace {
  id: GrahaId
  name: string
  sign: string
  house: number
  degree: number
  dignity: string
  flags: string[]
  /** Sign in the navāṃśa, where known. */
  d9Sign?: string
}

function place(c: QuestionChartInput, g: GrahaData, L: EngineLang): PlanetPlace {
  const flags = [
    ...(g.isRetro && g.id !== 'Ra' && g.id !== 'Ke' ? [L === 'hi' ? 'वक्री' : 'retrograde'] : []),
    ...(g.isCombust ? [L === 'hi' ? 'अस्त' : 'combust'] : []),
    ...(DUSTHANA.includes(houseOf(c.ascRashi, g.rashi)) ? [L === 'hi' ? 'दुःस्थान' : 'dusthana'] : []),
  ]
  const d9 = c.d9?.signs[g.id]
  return {
    id: g.id, name: gName(g.id, L), sign: sName(g.rashi, L), house: houseOf(c.ascRashi, g.rashi),
    degree: Math.round(g.degree * 10) / 10, dignity: dignityText(g.dignity, L), flags,
    ...(d9 ? { d9Sign: sName(d9, L) } : {}),
  }
}

export interface ChecklistHouse {
  house: number
  role: string
  sign: string
  lord: PlanetPlace
  occupants: string[]
  /** Planets casting a Parashari aspect on the house. */
  aspectedBy: string[]
  malefics: boolean
}

export interface ChecklistNote { tone: 'good' | 'mixed' | 'bad' | 'info'; text: string }

export interface QuestionChecklist {
  kind: QuestionKind
  label: string
  karyesha: PlanetPlace
  lagna: { sign: string; lord: PlanetPlace; weakReasons: string[] }
  moon: PlanetPlace
  houses: ChecklistHouse[]
  karakas: Array<PlanetPlace & { role: string }>
  /** The Moon or lagna lord tied to the question houses: the question is on the querent's mind. */
  genuine: { ok: boolean; reasons: string[] }
  notes: ChecklistNote[]
}

/** Why a lagna lord is weak: the class notes say find where it sits, and that gives the reason. */
function weakReasons(c: QuestionChartInput, g: GrahaData, L: EngineLang): string[] {
  const G = byId(c)
  const out: string[] = []
  const h = houseOf(c.ascRashi, g.rashi)
  if (g.dignity === 'debilitated') out.push(L === 'hi' ? 'नीच का' : 'debilitated')
  else if (g.dignity === 'enemy' || g.dignity === 'great_enemy') out.push(L === 'hi' ? 'शत्रु राशि में' : 'in an enemy sign')
  if (g.isCombust) out.push(L === 'hi' ? 'अस्त' : 'combust')
  if (DUSTHANA.includes(h)) out.push(L === 'hi' ? `${h}वें भाव में` : `in the ${h}th house`)
  const withBad = MALEFICS.filter(m => m !== g.id && G[m]?.rashi === g.rashi)
  if (withBad.length) out.push(L === 'hi' ? `${withBad.map(m => gName(m, L)).join(', ')} के साथ` : `with ${withBad.map(m => gName(m, L)).join(', ')}`)
  return out
}

export function buildQuestionChecklist(c: QuestionChartInput, kind: QuestionKind, L: EngineLang = 'en'): QuestionChecklist {
  const def = QUESTION_KINDS.find(q => q.id === kind)
  if (!def) throw new Error(`Unknown question kind: ${kind}`)
  const G = byId(c)
  const lordAt = (h: number) => TAJIKA_SIGN_LORD[signAt(c.ascRashi, h)]
  const lagnaLord = G[lordAt(1)]
  const karyesha = G[lordAt(def.karyeshaHouse)]

  const houses: ChecklistHouse[] = [H(1, 'The querent', 'प्रश्नकर्ता'), ...def.houses].map(({ house, role }) => {
    const sign = signAt(c.ascRashi, house)
    const occ = c.grahas.filter(g => g.rashi === sign)
    const asp = c.grahas.filter(g => g.rashi !== sign && hasParasharaAspect(g.rashi, g.id, sign))
    return {
      house, role: pick(role, L), sign: sName(sign, L), lord: place(c, G[lordAt(house)], L),
      occupants: occ.map(g => gName(g.id, L)), aspectedBy: asp.map(g => gName(g.id, L)),
      malefics: occ.some(g => MALEFICS.includes(g.id)),
    }
  })

  // Genuine: the Moon or the lagna lord tied to a question house or its lord.
  const qHouses = def.houses.map(x => x.house)
  const reasons: string[] = []
  const moon = G.Mo
  for (const h of qHouses) {
    const sign = signAt(c.ascRashi, h)
    if (moon.rashi === sign) reasons.push(L === 'hi' ? `चंद्र ${h}वें भाव में` : `Moon in the ${h}th`)
    else if (hasParasharaAspect(moon.rashi, 'Mo', sign)) reasons.push(L === 'hi' ? `चंद्र की ${h}वें भाव पर दृष्टि` : `Moon aspects the ${h}th`)
    if (houseOf(c.ascRashi, lagnaLord.rashi) === h) reasons.push(L === 'hi' ? `लग्नेश ${h}वें भाव में` : `lagna lord in the ${h}th`)
  }
  if (karyesha.id !== 'Mo' && moon.rashi === karyesha.rashi) reasons.push(L === 'hi' ? `चंद्र कार्येश ${gName(karyesha.id, L)} के साथ` : `Moon with the karyesha ${gName(karyesha.id, L)}`)
  if (houseOf(c.ascRashi, karyesha.rashi) === 1) reasons.push(L === 'hi' ? 'कार्येश लग्न में' : 'karyesha in the lagna')

  const notes: ChecklistNote[] = []
  if (def.note) notes.push({ tone: 'info', text: pick(def.note, L) })
  const wr = weakReasons(c, lagnaLord, L)
  if (wr.length) notes.push({ tone: 'bad', text: L === 'hi'
    ? `लग्नेश कमज़ोर (${wr.join(', ')}): प्रश्नकर्ता प्रयास नहीं कर पाता, विकल्प सीमित हैं, या उसे अपनी स्थिति/क्षमता बदलनी होगी।`
    : `Lagna lord weak (${wr.join(', ')}): the querent can't put in effort, has limited options, or must change situation or capacity.` })
  if (kind === 'propertySale') {
    const l11 = G[lordAt(11)]
    if (l11.dignity === 'exalted') notes.push({ tone: 'good', text: L === 'hi' ? '11वें भाव का स्वामी उच्च: मनचाहा मूल्य, प्रायः बाज़ार से ऊपर।' : '11th lord exalted: the desired price, often above market value.' })
  }
  if (kind === 'police' || kind === 'lost') {
    const ten = signAt(c.ascRashi, 10)
    const ma = G.Ma
    const link = ma.rashi === ten || hasParasharaAspect(ma.rashi, 'Ma', ten) || ma.rashi === G[lordAt(10)].rashi
    if (kind === 'police') notes.push({ tone: link ? 'mixed' : 'info', text: L === 'hi'
      ? (link ? 'मंगल दसवें भाव से जुड़ा है: पुलिस का मामला सक्रिय।' : 'मंगल दसवें भाव से नहीं जुड़ा।')
      : (link ? 'Mars is tied to the 10th: the police matter is active.' : 'Mars is not tied to the 10th.') })
  }
  if (kind === 'marriage' && c.d9?.signs.Ra) {
    notes.push({ tone: 'info', text: L === 'hi'
      ? `राहु D1 में ${sName(G.Ra.rashi, L)} (${houseOf(c.ascRashi, G.Ra.rashi)}वाँ भाव), D9 में ${sName(c.d9.signs.Ra, L)}।`
      : `Rahu in D1: ${sName(G.Ra.rashi, L)} (house ${houseOf(c.ascRashi, G.Ra.rashi)}); in D9: ${sName(c.d9.signs.Ra, L)}.` })
  }

  return {
    kind, label: pick(def.label, L), karyesha: place(c, karyesha, L),
    lagna: { sign: sName(c.ascRashi, L), lord: place(c, lagnaLord, L), weakReasons: wr },
    moon: place(c, moon, L), houses,
    karakas: def.karakas.filter(k => G[k.id]).map(k => ({ ...place(c, G[k.id], L), role: pick(k.role, L) })),
    genuine: { ok: reasons.length > 0, reasons },
    notes,
  }
}

// ── The 12-question scheme ─────────────────────────────────

export interface QuestionPoint {
  n: number
  /** What the point is, e.g. "D9 Moon". */
  name: string
  chart: 'D1' | 'D9'
  sign: Rashi
  signName: string
  lord: string
}

/**
 * Where the "lagna" sits for the n-th question asked of one chart:
 * D1/D9 lagna, Moon, Sun, Jupiter, then the stronger and the weaker of
 * Venus and Mercury in D1 and D9. Strength is pañcavargīya bala.
 */
export function twelveQuestionPoints(c: QuestionChartInput, L: EngineLang = 'en'): QuestionPoint[] {
  const G = byId(c)
  const ve = panchavargiyaBala(G.Ve).total, me = panchavargiyaBala(G.Me).total
  const [strong, weak]: GrahaId[] = ve >= me ? ['Ve', 'Me'] : ['Me', 'Ve']
  const lag = L === 'hi' ? 'लग्न' : 'Lagna'
  const pairs: Array<[string, Rashi | undefined, Rashi | undefined]> = [
    [lag, c.ascRashi, c.d9?.ascRashi],
    [gName('Mo', L), G.Mo.rashi, c.d9?.signs.Mo],
    [gName('Su', L), G.Su.rashi, c.d9?.signs.Su],
    [gName('Ju', L), G.Ju.rashi, c.d9?.signs.Ju],
    [`${gName(strong, L)} (${L === 'hi' ? 'बलवान' : 'stronger'})`, G[strong].rashi, c.d9?.signs[strong]],
    [`${gName(weak, L)} (${L === 'hi' ? 'दुर्बल' : 'weaker'})`, G[weak].rashi, c.d9?.signs[weak]],
  ]
  const out: QuestionPoint[] = []
  pairs.forEach(([name, d1, d9], i) => {
    for (const [chart, sign] of [['D1', d1], ['D9', d9]] as const) {
      if (!sign) continue
      out.push({ n: i * 2 + (chart === 'D1' ? 1 : 2), name: `${chart} ${name}`, chart, sign, signName: sName(sign, L), lord: gName(TAJIKA_SIGN_LORD[sign], L) })
    }
  })
  return out
}

/** The matter's house counted from a reference point: its sign and lord. */
export function houseFromPoint(point: Rashi, house: number, L: EngineLang = 'en') {
  const sign = signAt(point, house)
  return { sign, signName: sName(sign, L), lord: TAJIKA_SIGN_LORD[sign], lordName: gName(TAJIKA_SIGN_LORD[sign], L) }
}

// ── Lost or stolen item ────────────────────────────────────

export interface LostClue { id: string; tone: 'good' | 'mixed' | 'bad' | 'info'; title: string; detail: string }

const WHO: Record<'movable' | 'fixed' | 'dual', T> = {
  movable: { en: 'an outsider, a stranger', hi: 'बाहरी, अनजान व्यक्ति' },
  fixed: { en: 'someone of the household or family', hi: 'घर या परिवार का कोई' },
  dual: { en: 'a known person but not family, someone who comes and goes (a maid, a helper)', hi: 'परिचित पर परिवार से बाहर, आने-जाने वाला (नौकरानी, सहायक)' },
}
const WHERE: Record<'movable' | 'fixed' | 'dual', T> = {
  movable: { en: 'gone far away', hi: 'दूर चली गई' },
  fixed: { en: 'still near, within the house', hi: 'अब भी पास, घर के भीतर' },
  dual: { en: 'moved once, at a middle distance', hi: 'एक बार स्थानांतरित, मध्यम दूरी पर' },
}
const MOB_HI = { movable: 'चर', fixed: 'स्थिर', dual: 'द्विस्वभाव' }
const DIRECTION: Partial<Record<GrahaId, T>> = {
  Su: { en: 'East', hi: 'पूर्व' }, Mo: { en: 'North-West', hi: 'वायव्य' }, Ma: { en: 'South', hi: 'दक्षिण' }, Me: { en: 'North', hi: 'उत्तर' },
  Ju: { en: 'North-East', hi: 'ईशान' }, Ve: { en: 'South-East', hi: 'आग्नेय' }, Sa: { en: 'West', hi: 'पश्चिम' },
}

export function lostItemClues(c: QuestionChartInput, L: EngineLang = 'en'): LostClue[] {
  const G = byId(c)
  const out: LostClue[] = []
  const say = (en: string, hi: string) => (L === 'hi' ? hi : en)
  const mob = (r: Rashi) => SIGN_TABLE[r].mobility
  const lordAt = (h: number) => G[TAJIKA_SIGN_LORD[signAt(c.ascRashi, h)]]
  const lagnaLord = lordAt(1)

  const m1 = mob(c.ascRashi)
  out.push({ id: 'who', tone: 'info',
    title: say(`D1 lagna ${signName(c.ascRashi)} is ${m1}: who`, `D1 लग्न ${sName(c.ascRashi, L)} ${MOB_HI[m1]} है: कौन`),
    detail: say(`Points to ${WHO[m1].en}.`, `संकेत: ${WHO[m1].hi}।`) })
  if (c.d9) {
    const m9 = mob(c.d9.ascRashi)
    out.push({ id: 'where', tone: m9 === 'movable' ? 'bad' : m9 === 'fixed' ? 'good' : 'mixed',
      title: say(`D9 lagna ${signName(c.d9.ascRashi)} is ${m9}: where`, `D9 लग्न ${sName(c.d9.ascRashi, L)} ${MOB_HI[m9]} है: कहाँ`),
      detail: say(`The item is ${WHERE[m9].en}.`, `वस्तु ${WHERE[m9].hi}।`) })
    const l9 = c.d9.signs[lagnaLord.id]
    if (l9 && houseOf(c.d9.ascRashi, l9) === 12) {
      out.push({ id: 'lord-d9-12', tone: 'bad', title: say('Lagna lord in the 12th of D9', 'लग्नेश D9 के बारहवें भाव में'), detail: say('Loss.', 'हानि।') })
    }
  }

  const moonH = houseOf(c.ascRashi, G.Mo.rashi)
  if (moonH === 12) out.push({ id: 'moon-12', tone: 'bad', title: say('Moon in the 12th', 'चंद्र बारहवें भाव में'), detail: say('The mind is on a loss, so the question is genuine; the 12th is also ākāśa, poor in praśna.', 'मन हानि पर है, इसलिए प्रश्न सच्चा है; बारहवाँ आकाश तत्व भी है, प्रश्न में अशुभ।') })

  const ma = G.Ma
  const maH = houseOf(c.ascRashi, ma.rashi)
  if (ma.dignity === 'debilitated' || [4, 7, 8, 12].includes(maH)) {
    out.push({ id: 'mars', tone: 'bad',
      title: say(`Mars ${ma.dignity === 'debilitated' ? 'debilitated, ' : ''}in the ${maH}th`, `मंगल ${ma.dignity === 'debilitated' ? 'नीच, ' : ''}${maH}वें भाव में`),
      detail: say('Mars is the significator of theft: the loss is theft rather than misplacement.', 'मंगल चोरी का कारक है: हानि खोने से अधिक चोरी है।') })
  }
  const sa = G.Sa
  const saH = houseOf(c.ascRashi, sa.rashi)
  if (saH === 4 || sa.isRetro) {
    out.push({ id: 'saturn', tone: 'mixed',
      title: say(`Saturn${saH === 4 ? ' in the 4th' : ''}${sa.isRetro ? ', retrograde' : ''}`, `शनि${saH === 4 ? ' चौथे भाव में' : ''}${sa.isRetro ? ', वक्री' : ''}`),
      detail: say(`${saH === 4 ? 'Theft from the home. ' : ''}Saturn signifies labourers and servants${sa.isRetro ? '; retrograde suggests an occasionally called worker' : ''}. It also signifies iron (an iron almirah).`,
        `${saH === 4 ? 'घर से चोरी। ' : ''}शनि श्रमिक और नौकर का कारक है${sa.isRetro ? '; वक्री कभी-कभार बुलाए गए कर्मचारी का संकेत है' : ''}। लोहा भी (लोहे की अलमारी)।`) })
  }
  const ke = G.Ke
  if (ke && ke.rashi === lagnaLord.rashi) out.push({ id: 'lord-ketu', tone: 'bad', title: say('Lagna lord with Ketu', 'लग्नेश केतु के साथ'), detail: say('The querent is caught in a malefic influence.', 'प्रश्नकर्ता पाप प्रभाव में है।') })

  const tenLord = lordAt(10)
  const weakLaw = (g: GrahaData) => g.isRetro || g.dignity === 'debilitated'
  const noLaw = [
    ...(weakLaw(tenLord) ? [tenLord] : []),
    ...(G.Ve && G.Ve.id !== tenLord.id && houseOf(c.ascRashi, G.Ve.rashi) === 10 && weakLaw(G.Ve) ? [G.Ve] : []),
  ]
  if (noLaw.length) out.push({ id: 'no-law', tone: 'bad', title: say('10th weak: little police or legal support', 'दसवाँ कमज़ोर: पुलिस या कानूनी सहायता कम'), detail: say(`${noLaw.map(g => gName(g.id, L)).join(', ')} retrograde or debilitated: a complaint may not even get filed, or may not help.`, `${noLaw.map(g => gName(g.id, L)).join(', ')} वक्री या नीच: शिकायत दर्ज होना भी कठिन, या उससे लाभ नहीं।`) })

  // Ishrafa between the Moon and Mars or Saturn: what is gone is gone.
  for (const id of ['Ma', 'Sa'] as GrahaId[]) {
    const l = tajikaLink(G.Mo, G[id])
    if (l.type === 'ishrafa') out.push({ id: `ishrafa-${id}`, tone: 'bad', title: say(`Ishrafa: Moon and ${gName(id, L)}`, `ईसराफ़: चंद्र और ${gName(id, L)}`), detail: say(`${l.gap}° apart and separating: what is gone is gone.`, `${l.gap}° दूर और अलग हो रहे: जो गया सो गया।`) })
  }
  // Ithasala of the lagna lord with the 2nd lord: wealth returns to the owner.
  const second = lordAt(2)
  if (second.id !== lagnaLord.id) {
    const l = tajikaLink(lagnaLord, second)
    if (l.type === 'ithasala') out.push({ id: 'recovery', tone: 'good', title: say(`Ithasala: lagna lord and 2nd lord`, `इत्थशाल: लग्नेश और द्वितीयेश`), detail: say(`${l.gap}° to perfect: the owner and the wealth come together, a classical sign of recovery.`, `पूर्ण होने में ${l.gap}°: स्वामी और धन मिलते हैं, वापसी का शास्त्रीय संकेत।`) })
  }

  const dir = DIRECTION[lagnaLord.id]
  if (dir) out.push({ id: 'direction', tone: 'info', title: say(`Search direction: ${dir.en}`, `खोज की दिशा: ${dir.hi}`), detail: say(`The direction of the lagna lord ${gName(lagnaLord.id, L)}.`, `लग्नेश ${gName(lagnaLord.id, L)} की दिशा।`) })
  return out
}
