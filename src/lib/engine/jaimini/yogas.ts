// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/yogas.ts
//  Jaimini rajayogas from chara karakas and rashi drishti.
//  PK is the fifth chara karaka in the 7-karaka scheme.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { jG, jR, jLang, say, type EngineLang } from '@/lib/engine/locale/jaiminiLang'
import { rashiAspectsOrOccupies } from './aspects'
import { fifthKarakaName, type JaiminiMethod } from './method'
import { resolveSignLord } from './trinity'

export interface JaiminiYogaHit {
  id: string
  name: string
  strength: 'Exceptional' | 'Strong' | 'Present'
  desc: string
}

interface YogaGraha {
  id: GrahaId
  rashi: Rashi
  degree: number
}

interface YogaKarakas {
  AK: GrahaId
  AmK: GrahaId
  PK: GrahaId
  DK: GrahaId
}

export interface JaiminiYogaCharts {
  d9?: YogaGraha[]
  d9Lagna?: Rashi
  /** Atmakaraka's navamsha sign. Fifth-lord yogas are also read from here. */
  karakamsha?: Rashi
  method?: JaiminiMethod
  lang?: EngineLang
}

function houseFrom(seed: Rashi, house: number): Rashi {
  return ((((seed - 1) + (house - 1)) % 12) + 1) as Rashi
}

function placed(grahas: YogaGraha[], id: GrahaId): YogaGraha | undefined {
  return grahas.find(g => g.id === id)
}

function linked(a: YogaGraha, b: YogaGraha): boolean {
  return a.id === b.id || rashiAspectsOrOccupies(a.rashi, b.rashi)
}

function linkWord(a: YogaGraha, b: YogaGraha, lang: EngineLang): string {
  if (lang === 'hi') return a.rashi === b.rashi ? 'युति' : 'राशि दृष्टि'
  return a.rashi === b.rashi ? 'conjunction' : 'rashi drishti'
}

const ROLE_HI: Record<string, string> = {
  AK: 'आत्मकारक',
  AmK: 'अमात्यकारक',
  PK: 'पंचम कारक',
  DK: 'दारकारक',
  Moon: 'चंद्र',
  Venus: 'शुक्र',
  Atmakaraka: 'आत्मकारक',
  Amatyakaraka: 'अमात्यकारक',
  Darakaraka: 'दारकारक',
  Pitrukaraka: 'पितृकारक',
  Putrakaraka: 'पुत्रकारक',
  Lagna: 'लग्न',
  Karakamsha: 'कारकांश',
}

function role(name: string, lang: EngineLang): string {
  return lang === 'hi' ? (ROLE_HI[name] ?? name) : name
}

function pairYoga(
  id: string,
  name: string,
  a: YogaGraha,
  aRole: string,
  b: YogaGraha,
  bRole: string,
  meaning: string,
  lang: EngineLang,
): JaiminiYogaHit {
  const same = a.id === b.id || a.rashi === b.rashi
  const desc = lang === 'hi'
    ? a.id === b.id
      ? `${jG(a.id, lang)} ${role(aRole, lang)} भी है और ${role(bRole, lang)} भी। ${meaning}`
      : `${jG(a.id, lang)} (${role(aRole, lang)}) और ${jG(b.id, lang)} (${role(bRole, lang)}) ${linkWord(a, b, lang)} से जुड़े हैं। ${meaning}`
    : a.id === b.id
      ? `${jG(a.id, lang)} is both ${aRole} and ${bRole}. ${meaning}`
      : `${jG(a.id, lang)} (${aRole}) and ${jG(b.id, lang)} (${bRole}) are connected by ${linkWord(a, b, lang)}. ${meaning}`
  return {
    id,
    name,
    strength: same ? 'Exceptional' : 'Strong',
    desc,
  }
}

function fifthLordYoga(
  id: string,
  roleName: string,
  planet: YogaGraha | undefined,
  grahas: YogaGraha[],
  reference: Rashi,
  referenceName: string,
  lang: EngineLang,
): JaiminiYogaHit | null {
  if (!planet) return null
  const fifth = houseFrom(reference, 5)
  const lord = placed(grahas, resolveSignLord(fifth, grahas))
  if (!lord || (lord.id !== planet.id && !linked(planet, lord))) return null
  const strength = lord.id === planet.id || planet.rashi === lord.rashi ? 'Exceptional' : 'Strong'
  if (lang === 'hi') {
    const r = role(roleName, lang)
    const ref = role(referenceName, lang)
    return {
      id,
      name: `${r} और ${ref} से पंचमेश`,
      strength,
      desc: lord.id === planet.id
        ? `${jG(planet.id, lang)} ${r} भी है और ${ref} से पंचमेश (${jR(fifth, lang)}) भी।`
        : `${jG(planet.id, lang)} (${r}) और पंचमेश ${jG(lord.id, lang)} (${ref} से ${jR(fifth, lang)}) ${linkWord(planet, lord, lang)} से जुड़े हैं।`,
    }
  }
  return {
    id,
    name: `${roleName} and 5th lord from ${referenceName}`,
    strength,
    desc: lord.id === planet.id
      ? `${jG(planet.id, lang)} is both ${roleName} and 5th lord from ${referenceName} (${jR(fifth, lang)}).`
      : `${jG(planet.id, lang)} (${roleName}) and 5th lord ${jG(lord.id, lang)} (${jR(fifth, lang)} from ${referenceName}) are connected by ${linkWord(planet, lord, lang)}.`,
  }
}

/** Conjunction and rashi-drishti rajayogas for one chart. Fifth lord is taken from `lagna`. */
function collectPairYogas(grahas: YogaGraha[], lagna: Rashi, karakas: YogaKarakas, method: JaiminiMethod, lang: EngineLang): JaiminiYogaHit[] {
  const yogas: JaiminiYogaHit[] = []
  const pkName = fifthKarakaName(method)
  const pkHi = role(pkName, lang)
  const akPkMeaning = method === 'practical'
    ? say(lang, 'Children, creation, and legacy participate in the soul\'s work.', 'संतान, रचना और विरासत आत्मा के कार्य में सहभागी हैं।')
    : say(lang, 'Father and authority participate in the soul\'s work.', 'पिता और अधिकार आत्मा के कार्य में सहभागी हैं।')
  const amkPkMeaning = method === 'practical'
    ? say(lang, 'Career and what the person creates or leaves behind move together.', 'करियर और व्यक्ति जो रचता या पीछे छोड़ता है, वे साथ चलते हैं।')
    : say(lang, 'Career and the father significator move together.', 'करियर और पितृ कारक साथ चलते हैं।')
  const ak = placed(grahas, karakas.AK)
  const amk = placed(grahas, karakas.AmK)
  const pk = placed(grahas, karakas.PK)
  const dk = placed(grahas, karakas.DK)
  const push = (hit: JaiminiYogaHit | null) => { if (hit) yogas.push(hit) }

  if (ak && amk && linked(ak, amk)) {
    push(pairYoga('ak-amk', say(lang, 'Atmakaraka–Amatyakaraka Raja Yoga', 'आत्मकारक–अमात्यकारक राजयोग'), ak, 'AK', amk, 'AmK', say(lang, 'Soul aim and career move together.', 'आत्मा का लक्ष्य और करियर साथ चलते हैं।'), lang))
  }
  if (ak && dk && linked(ak, dk)) {
    push(pairYoga('ak-dk', say(lang, 'Atmakaraka–Darakaraka Yoga', 'आत्मकारक–दारकारक योग'), ak, 'AK', dk, 'DK', say(lang, 'Partnership participates in the soul\'s work.', 'साझेदारी आत्मा के कार्य में सहभागी है।'), lang))
  }
  if (ak && pk && linked(ak, pk)) {
    push(pairYoga('ak-pk', say(lang, `Atmakaraka–${pkName} Yoga`, `आत्मकारक–${pkHi} योग`), ak, 'AK', pk, 'PK', akPkMeaning, lang))
  }
  if (amk && dk && linked(amk, dk)) {
    push(pairYoga('amk-dk', say(lang, 'Amatyakaraka–Darakaraka Yoga', 'अमात्यकारक–दारकारक योग'), amk, 'AmK', dk, 'DK', say(lang, 'Career and partnership move together.', 'करियर और साझेदारी साथ चलते हैं।'), lang))
  }
  if (amk && pk && linked(amk, pk)) {
    push(pairYoga('amk-pk', say(lang, `Amatyakaraka–${pkName} Yoga`, `अमात्यकारक–${pkHi} योग`), amk, 'AmK', pk, 'PK', amkPkMeaning, lang))
  }
  push(fifthLordYoga('ak-fifth-lord', 'Atmakaraka', ak, grahas, lagna, 'Lagna', lang))
  push(fifthLordYoga('amk-fifth-lord', 'Amatyakaraka', amk, grahas, lagna, 'Lagna', lang))
  push(fifthLordYoga('dk-fifth-lord', 'Darakaraka', dk, grahas, lagna, 'Lagna', lang))
  push(fifthLordYoga('pk-fifth-lord', pkName, pk, grahas, lagna, 'Lagna', lang))

  if (ak && amk && pk && linked(ak, amk) && linked(ak, pk)) {
    yogas.push({
      id: 'ak-amk-pk',
      name: say(lang, 'Atmakaraka–Amatyakaraka–PK Raja Yoga', 'आत्मकारक–अमात्यकारक–पंचम कारक राजयोग'),
      strength: ak.rashi === amk.rashi && ak.rashi === pk.rashi ? 'Exceptional' : 'Strong',
      desc: lang === 'hi'
        ? `${jG(ak.id, lang)} (आत्मकारक) ${jG(amk.id, lang)} (अमात्यकारक) और ${jG(pk.id, lang)} (पंचम कारक) दोनों से जुड़ा है। करियर और पंचम कारक (नैसर्गिक संकेतक) आत्मा के लक्ष्य को बल देते हैं।`
        : `${jG(ak.id, lang)} (AK) is connected to both ${jG(amk.id, lang)} (AmK) and ${jG(pk.id, lang)} (PK). Career and the fifth karaka (natural indicator) reinforce the soul aim.`,
    })
  }

  const moon = placed(grahas, 'Mo')
  const venus = placed(grahas, 'Ve')
  if (moon && venus && linked(moon, venus)) {
    push(pairYoga('moon-venus', say(lang, 'Moon–Venus Raja Yoga', 'चंद्र–शुक्र राजयोग'), moon, 'Moon', venus, 'Venus', say(lang, 'The mind and the partner significator support status.', 'मन और जीवनसाथी का कारक प्रतिष्ठा को सहारा देते हैं।'), lang))
  }
  if (moon) {
    const aspecting = grahas.filter(g => g.id !== 'Mo' && rashiAspectsOrOccupies(g.rashi, moon.rashi))
    if (aspecting.length >= 3) {
      yogas.push({
        id: 'moon-aspects',
        name: say(lang, 'Planets aspecting the Moon', 'चंद्र पर दृष्टि डालने वाले ग्रह'),
        strength: 'Strong',
        desc: lang === 'hi'
          ? `${aspecting.map(g => jG(g.id, lang)).join(', ')} चंद्र पर दृष्टि डालते हैं या उसके साथ बैठे हैं। चंद्र पर कई ग्रहों का प्रभाव राजयोग बनाता है।`
          : `${aspecting.map(g => jG(g.id, lang)).join(', ')} aspect or join the Moon. Several planets on the Moon form a raja yoga.`,
      })
    }
  }

  return yogas
}

/**
 * Rajayogas for the birth chart.
 * When navamsha placements are passed, a link in both charts is marked stronger.
 * Fifth lord from Karakamsha is added when that sign is not the birth lagna.
 */
export function detectJaiminiRajayogas(
  grahas: YogaGraha[],
  lagna: Rashi,
  karakas: YogaKarakas,
  arudhaLagna?: Rashi,
  charts?: JaiminiYogaCharts,
): JaiminiYogaHit[] {
  const method = charts?.method ?? 'classical'
  const lang = jLang(charts?.lang)
  const yogas = collectPairYogas(grahas, lagna, karakas, method, lang)
  const d9 = charts?.d9
  if (d9 && d9.length) {
    const d9Hits = collectPairYogas(d9, charts.d9Lagna ?? lagna, karakas, method, lang)
    const d9Ids = new Set(d9Hits.map(hit => hit.id))
    for (const hit of yogas) {
      if (d9Ids.has(hit.id)) {
        hit.desc += say(lang, ' The same link is present in navamsha, so the yoga is stronger.', ' यही संबंध नवांश में भी है, इसलिए योग अधिक बलवान है।')
        if (hit.strength === 'Strong') hit.strength = 'Exceptional'
      } else {
        hit.desc += say(lang, ' Navamsha does not repeat this link.', ' नवांश में यह संबंध नहीं दोहराया गया।')
      }
    }
    for (const hit of d9Hits) {
      if (yogas.some(existing => existing.id === hit.id)) continue
      yogas.push({
        ...hit,
        id: `d9-${hit.id}`,
        name: say(lang, `${hit.name} (Navamsha)`, `${hit.name} (नवांश)`),
        desc: say(lang, `${hit.desc} This link is in navamsha and not in the birth chart.`, `${hit.desc} यह संबंध नवांश में है, जन्म कुंडली में नहीं।`),
      })
    }
  }

  if (charts?.karakamsha && charts.karakamsha !== lagna) {
    const ak = placed(grahas, karakas.AK)
    const amk = placed(grahas, karakas.AmK)
    const pk = placed(grahas, karakas.PK)
    const dk = placed(grahas, karakas.DK)
    const fromKk = [
      fifthLordYoga('kk-ak-fifth', 'Atmakaraka', ak, grahas, charts.karakamsha, 'Karakamsha', lang),
      fifthLordYoga('kk-amk-fifth', 'Amatyakaraka', amk, grahas, charts.karakamsha, 'Karakamsha', lang),
      fifthLordYoga('kk-dk-fifth', 'Darakaraka', dk, grahas, charts.karakamsha, 'Karakamsha', lang),
      fifthLordYoga('kk-pk-fifth', fifthKarakaName(method), pk, grahas, charts.karakamsha, 'Karakamsha', lang),
    ]
    for (const hit of fromKk) {
      if (hit) yogas.push(hit)
    }
  }

  if (arudhaLagna) {
    const benefics: GrahaId[] = ['Ju', 'Ve', 'Me']
    const hitting = grahas.filter(g => benefics.includes(g.id) && rashiAspectsOrOccupies(arudhaLagna, g.rashi))
    if (hitting.length >= 2) {
      yogas.push({
        id: 'arudha-shubha',
        name: say(lang, 'Arudha Shubha Yoga', 'आरूढ़ शुभ योग'),
        strength: 'Present',
        desc: lang === 'hi'
          ? `${hitting.map(g => jG(g.id, lang)).join(' और ')} आरूढ़ लग्न (${jR(arudhaLagna, lang)}) को प्रभावित करते हैं। सार्वजनिक छवि को शुभ ग्रहों का सहारा मिलता है।`
          : `${hitting.map(g => jG(g.id, lang)).join(' and ')} influence Arudha Lagna (${jR(arudhaLagna, lang)}). The public image has helpful planet support.`,
      })
    }
  }

  return yogas
}
