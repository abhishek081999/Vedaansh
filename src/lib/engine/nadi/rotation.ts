// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/rotation.ts
//  Bhrigu Nadi house rotation. A relative’s house is their lagna.
//  Count anti-clockwise for career (10), marriage (7), education (5),
//  and death (8). Shloka 731 times death by Saturn on that 8th lord’s navamsha.
// ─────────────────────────────────────────────────────────────

import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'
import type { ClassicalGrahaId, HouseNumber } from '@/lib/engine/houseInterpretations'
import { NADI_PAPA_GRAHAS } from '@/lib/engine/nadi/houses'
import { NADI_CAREER_WORK_HI, NADI_RELATIVE_HI } from '@/lib/engine/locale/nadiRead.hi'
import { nG, nJoin, nLang, nOrd, nR, nSay, type EngineLang } from '@/lib/engine/nadi/text'

export const NADI_ROTATION_NOTE =
  'Each relative’s house is their lagna. Count anti-clockwise: the 10th is career, the 7th marriage, the 5th education, the 8th longevity. Bhrigu Nadi 731 looks for a loss in the family when Saturn transits the navamsha of the lord of that 8th house.'

export const NADI_ROTATION_NOTE_HI =
  'हर संबंधी का भाव उसका लग्न है। वामावर्त गिनें: दसवाँ करियर, सातवाँ विवाह, पाँचवाँ शिक्षा, आठवाँ आयु। भृगु नाड़ी 731 परिवार में हानि तब देखता है जब शनि उस आठवें भाव के स्वामी के नवांश पर गोचर करता है।'

export interface NadiRotationSubject {
  id: string
  label: string
  house: HouseNumber
}

export const NADI_ROTATION_SUBJECTS: readonly NadiRotationSubject[] = [
  { id: 'native', label: 'Native', house: 1 },
  { id: 'younger', label: 'Younger siblings', house: 3 },
  { id: 'mother', label: 'Mother', house: 4 },
  { id: 'children', label: 'Children', house: 5 },
  { id: 'maternal', label: 'Maternal uncle / aunt', house: 6 },
  { id: 'spouse', label: 'Spouse', house: 7 },
  { id: 'father', label: 'Father', house: 10 },
  { id: 'elder', label: 'Elder siblings', house: 11 },
]

function ordinalHouse(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}

/** House `nth` counted anti-clockwise from `start`. 1 means `start` itself. */
export function houseCountedFrom(start: number, nth: number): HouseNumber {
  const s = ((start - 1) % 12 + 12) % 12
  const n = ((nth - 1) % 12 + 12) % 12
  return ((s + n) % 12 + 1) as HouseNumber
}

export const NADI_CAREER_WORK: Record<ClassicalGrahaId, string> = {
  Su: 'government, administration, or authority',
  Mo: 'nursing, hospitality, liquids, farming, or public dealing',
  Ma: 'engineering, defence, surgery, sport, or construction',
  Me: 'communication, accounts, trade, writing, or software',
  Ju: 'law, teaching, banking, or advice',
  Ve: 'art, fashion, hotels, beauty, or media',
  Sa: 'law, labour, mining, oil, or long service',
  Ra: 'technical work, electronics, IT, or a foreign company',
  Ke: 'software, research, an NGO, or spiritual work',
}

export const NADI_JUPITER_TRANSIT = [
  { planet: 'Saturn', result: 'Professional growth, a new post, or a promotion. Some work is read even if none is held.' },
  { planet: 'Venus', result: 'Wealth, a marriage or a meeting that may not last, jewelry, or a vehicle.' },
  { planet: 'Rahu', result: 'A hard period. Classical texts look here for a loss in the family, illness, a loss of work, or a move. This is the hardest of these transits, but it is not a fixed outcome.' },
  { planet: 'Ketu', result: 'A pilgrimage or a turn toward spiritual life, a change of place, surgery, a break in work, or childbirth.' },
  { planet: 'Mars', result: 'A property purchase, a building, or work on a house.' },
  { planet: 'Sun', result: 'A promotion, a government benefit, or a rise in work.' },
  { planet: 'Mercury', result: 'A course, a skill, or the end of a degree.' },
  { planet: 'Moon', result: 'A long journey, a change of place, or a change in cash. Defame is checked when Rahu sits with the Moon.' },
] as const

export const NADI_JUPITER_TRANSIT_HI: readonly { planet: string; result: string }[] = [
  { planet: 'शनि', result: 'व्यावसायिक वृद्धि, नया पद, या पदोन्नति। कोई काम न हो तो भी कुछ काम पढ़ा जाता है।' },
  { planet: 'शुक्र', result: 'धन, विवाह या ऐसी मुलाकात जो शायद न टिके, आभूषण, या वाहन।' },
  { planet: 'राहु', result: 'कठिन अवधि। शास्त्रीय ग्रंथ यहाँ परिवार में हानि, रोग, काम छूटना या स्थान परिवर्तन देखते हैं। इन गोचरों में यह सबसे कठिन है, पर यह निश्चित परिणाम नहीं है।' },
  { planet: 'केतु', result: 'तीर्थयात्रा या आध्यात्मिक जीवन की ओर झुकाव, स्थान परिवर्तन, शल्य चिकित्सा, काम में रुकावट, या संतान जन्म।' },
  { planet: 'मंगल', result: 'संपत्ति की खरीद, भवन, या घर पर काम।' },
  { planet: 'सूर्य', result: 'पदोन्नति, सरकारी लाभ, या काम में उन्नति।' },
  { planet: 'बुध', result: 'कोई पाठ्यक्रम, कौशल, या डिग्री का पूरा होना।' },
  { planet: 'चंद्र', result: 'लंबी यात्रा, स्थान परिवर्तन, या नकदी में बदलाव। चंद्र के साथ राहु हो तो अपयश की जाँच की जाती है।' },
]

export function nadiJupiterTransit(lang?: EngineLang): readonly { planet: string; result: string }[] {
  return lang === 'hi' ? NADI_JUPITER_TRANSIT_HI : NADI_JUPITER_TRANSIT
}

export function nadiRotationNote(lang?: EngineLang): string {
  return lang === 'hi' ? NADI_ROTATION_NOTE_HI : NADI_ROTATION_NOTE
}

const JUPITER_OVER_HI: Partial<Record<ClassicalGrahaId, string>> = {
  Sa: 'व्यावसायिक वृद्धि',
  Ve: 'धन, मुलाकात, आभूषण, या वाहन',
  Ra: 'परिवार, काम या स्थान परिवर्तन के लिए कठिन अवधि',
  Ke: 'तीर्थयात्रा, शल्य चिकित्सा, काम में रुकावट, या संतान जन्म',
  Ma: 'संपत्ति',
  Su: 'पदोन्नति या सरकारी लाभ',
  Me: 'पढ़ाई या नया कौशल',
  Mo: 'यात्रा या नकदी',
}

const JUPITER_OVER: Partial<Record<ClassicalGrahaId, string>> = {
  Sa: 'professional growth',
  Ve: 'wealth, a meeting, jewelry, or a vehicle',
  Ra: 'a hard period for the family, work, or a move',
  Ke: 'a pilgrimage, surgery, a break in work, or childbirth',
  Ma: 'property',
  Su: 'a promotion or a government benefit',
  Me: 'study or a new skill',
  Mo: 'travel or cash',
}

/** Planets that share a sign are woken together when Jupiter reaches that sign. */
export function jupiterTransitGroups(grahas: readonly { id: ClassicalGrahaId; rashi: Rashi }[], lang?: EngineLang): string[] {
  const L = nLang(lang)
  const bySign = new Map<Rashi, ClassicalGrahaId[]>()
  for (const g of grahas) {
    const list = bySign.get(g.rashi) ?? []
    list.push(g.id)
    bySign.set(g.rashi, list)
  }
  const lines: string[] = []
  for (const [sign, ids] of bySign) {
    const woken = ids.filter((id) => JUPITER_OVER[id])
    if (ids.length < 2 || woken.length === 0) continue
    let line: string
    if (L === 'hi') {
      const names = nJoin(ids.map((id) => nG(id, L)), L)
      const results = woken.map((id) => JUPITER_OVER_HI[id]).join('; ')
      line = `${names} एक ही राशि ${nR(sign, L)} में हैं। उस राशि पर गुरु को ${results} के रूप में पढ़ा जाता है।`
      if (woken.includes('Mo') && woken.includes('Ra')) line += ' अपयश की भी जाँच की जाती है।'
    } else {
      const names = joinNames(ids.map((id) => GRAHA_NAMES[id]))
      const results = woken.map((id) => JUPITER_OVER[id]).join('; ')
      line = `${names} share ${RASHI_NAMES[sign]}. Jupiter over that sign is read as ${results}.`
      if (woken.includes('Mo') && woken.includes('Ra')) line += ' Defame is also checked.'
    }
    lines.push(line)
  }
  return lines
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

const PAPA = NADI_PAPA_GRAHAS as readonly string[]

export function careerWork(ids: readonly ClassicalGrahaId[], lang?: EngineLang): string {
  const L = nLang(lang)
  if (ids.length === 0) return nSay(L, 'Empty. Read the lord of this career house.', 'खाली। इस करियर भाव का स्वामी पढ़ें।')
  if (L === 'hi') {
    const has = (id: ClassicalGrahaId) => ids.includes(id)
    const lines = ids.map((id) => `${nG(id, L)}: ${NADI_CAREER_WORK_HI[id]}।`)
    if ((has('Ma') || has('Sa')) && has('Ke')) lines.push('केतु के साथ: शल्य चिकित्सा या चिकित्सा की भी जाँच की जाती है।')
    if (has('Sa')) lines.push('करियर भाव पर शनि: कानून का प्रश्न हो तो काला कोट।')
    if (has('Ma')) lines.push('करियर भाव पर मंगल: वर्दी, इंजीनियरिंग, या शल्य चिकित्सा।')
    if (has('Ra')) lines.push('करियर भाव पर राहु: विदेशी या तकनीकी काम।')
    if (has('Su') && has('Me')) lines.push('सूर्य के साथ बुध: सरकारी अध्यापन।')
    if (has('Su') && has('Ju')) lines.push('सूर्य के साथ गुरु: प्रशासन के साथ कानून।')
    return lines.join(' ')
  }
  const lines = ids.map((id) => `${GRAHA_NAMES[id]}: ${NADI_CAREER_WORK[id]}`)
  const has = (id: ClassicalGrahaId) => ids.includes(id)
  if ((has('Ma') || has('Sa')) && has('Ke')) {
    lines.push('With Ketu: surgery or medicine is also checked.')
  }
  if (has('Sa')) lines.push('Saturn on a career house: a black coat, when law is the question.')
  if (has('Ma')) lines.push('Mars on a career house: a uniform, engineering, or surgery.')
  if (has('Ra')) lines.push('Rahu on a career house: foreign or technical work.')
  if (has('Su') && has('Me')) lines.push('Sun with Mercury: government teaching.')
  if (has('Su') && has('Ju')) lines.push('Sun with Jupiter: law with administration.')
  return lines.map((line) => (line.endsWith('.') ? line : `${line}.`)).join(' ')
}

export function educationNotes(ids: readonly ClassicalGrahaId[], lang?: EngineLang): string[] {
  const L = nLang(lang)
  const has = (id: ClassicalGrahaId) => ids.includes(id)
  const notes: string[] = []
  if (has('Sa') && has('Ma') && !has('Ra') && !has('Ke')) {
    notes.push(nSay(L, 'Saturn with Mars in the 5th: mechanical or civil engineering.', 'पाँचवें भाव में शनि के साथ मंगल: मैकेनिकल या सिविल इंजीनियरिंग।'))
  }
  if (has('Ra')) notes.push(nSay(L, 'Rahu in the 5th: a break in study, a change of stream, or electronics and computers. Foreign study is likely. Adoption, or treating someone as one’s own child, is also checked.', 'पाँचवें भाव में राहु: पढ़ाई में रुकावट, विषय-धारा में बदलाव, या इलेक्ट्रॉनिक्स और कंप्यूटर। विदेश में पढ़ाई की संभावना है। गोद लेना, या किसी को अपनी संतान की तरह मानना, इसकी भी जाँच की जाती है।'))
  if (has('Ke')) {
    notes.push(nSay(L, 'Ketu in the 5th: a break in formal study, then software. The degree often is not the final work.', 'पाँचवें भाव में केतु: औपचारिक पढ़ाई में रुकावट, फिर सॉफ़्टवेयर। अक्सर डिग्री अंतिम काम नहीं बनती।'))
  }
  if (has('Sa') && has('Ke')) {
    notes.push(nSay(L, 'Saturn with Ketu in the 5th: a break, then routine computer work. Occult study is also checked, and so is strain around children when the dasha agrees.', 'पाँचवें भाव में शनि के साथ केतु: रुकावट, फिर नियमित कंप्यूटर का काम। गूढ़ विद्या के अध्ययन की भी जाँच की जाती है, और दशा मेल खाए तो संतान से जुड़े तनाव की भी।'))
  }
  if (has('Ma') && has('Sa') && (has('Ra') || has('Ke'))) {
    notes.push(nSay(L, 'Mars, Saturn, and Rahu or Ketu in the 5th: engineering.', 'पाँचवें भाव में मंगल, शनि, और राहु या केतु: इंजीनियरिंग।'))
  }
  if (has('Ve')) notes.push(nSay(L, 'Venus in the 5th: arts, design, or fashion.', 'पाँचवें भाव में शुक्र: कला, डिज़ाइन, या फ़ैशन।'))
  if (has('Me')) notes.push(nSay(L, 'Mercury in the 5th: commerce, communication, or literature.', 'पाँचवें भाव में बुध: वाणिज्य, संचार, या साहित्य।'))
  if (has('Mo')) notes.push(nSay(L, 'Moon in the 5th: humanities or fine arts.', 'पाँचवें भाव में चंद्र: मानविकी या ललित कला।'))
  if (has('Ju')) notes.push(nSay(L, 'Jupiter in the 5th: law, philosophy, or teaching.', 'पाँचवें भाव में गुरु: कानून, दर्शन, या अध्यापन।'))
  if (has('Su')) notes.push(nSay(L, 'Sun in the 5th: administrative study.', 'पाँचवें भाव में सूर्य: प्रशासनिक अध्ययन।'))
  if (has('Su') && has('Ju')) notes.push(nSay(L, 'Sun with Jupiter in the 5th: law together with administration.', 'पाँचवें भाव में सूर्य के साथ गुरु: प्रशासन के साथ कानून।'))
  const breakers = (['Sa', 'Ra', 'Ke'] as const).filter(has)
  if (breakers.length) {
    const how = breakers.map((id) => {
      if (id === 'Sa') return nSay(L, 'Saturn: a stop or a long delay', 'शनि: रुकावट या लंबी देरी')
      if (id === 'Ra') return nSay(L, 'Rahu: a change of stream', 'राहु: विषय-धारा में बदलाव')
      return nSay(L, 'Ketu: leaving the classroom for self-teaching', 'केतु: कक्षा छोड़कर स्वयं सीखना')
    })
    notes.push(nSay(L, `Break in education: ${how.join('; ')}.`, `शिक्षा में रुकावट: ${how.join('; ')}।`))
  }
  if (has('Sa') && ids.length === 1) {
    notes.push(nSay(L, 'Saturn alone in the 5th: the slowest education, and the subject studied may not become the career.', 'पाँचवें भाव में अकेला शनि: सबसे धीमी शिक्षा, और पढ़ा गया विषय शायद करियर न बने।'))
  }
  return notes
}

export interface NadiRotatedRelative {
  id: string
  label: string
  house: HouseNumber
  careerHouse: HouseNumber
  marriageHouse: HouseNumber
  educationHouse: HouseNumber
  deathHouse: HouseNumber
  careerOccupantIds: ClassicalGrahaId[]
  careerOccupants: string[]
  careerWork: string
}

export function rotateRelatives(
  occupantsOf: (house: HouseNumber) => readonly { id: ClassicalGrahaId }[],
  lang?: EngineLang,
): NadiRotatedRelative[] {
  const L = nLang(lang)
  return NADI_ROTATION_SUBJECTS.map((subject) => {
    const careerHouse = houseCountedFrom(subject.house, 10)
    const ids = occupantsOf(careerHouse).map((g) => g.id)
    return {
      id: subject.id,
      label: subject.label,
      house: subject.house,
      careerHouse,
      marriageHouse: houseCountedFrom(subject.house, 7),
      educationHouse: houseCountedFrom(subject.house, 5),
      deathHouse: houseCountedFrom(subject.house, 8),
      careerOccupantIds: ids,
      careerOccupants: ids.map((id) => (L === 'hi' ? nG(id, L) : GRAHA_NAMES[id])),
      careerWork: careerWork(ids, L),
    }
  })
}

export interface NadiDeathIndicator {
  id: string
  label: string
  house: HouseNumber
  lordName: string
  navamshaName: string | null
}

export function deathIndicators(
  relatives: readonly NadiRotatedRelative[],
  lordName: (house: HouseNumber) => string,
  navamshaName: (house: HouseNumber) => string | null,
): NadiDeathIndicator[] {
  return relatives.map((rel) => ({
    id: rel.id,
    label: rel.label,
    house: rel.deathHouse,
    lordName: lordName(rel.deathHouse),
    navamshaName: navamshaName(rel.deathHouse),
  }))
}

export function healthFlags(
  occupantsOf: (house: HouseNumber) => readonly { id: ClassicalGrahaId }[],
  lang?: EngineLang,
): string[] {
  const L = nLang(lang)
  const papa = (house: HouseNumber) => occupantsOf(house).some((g) => PAPA.includes(g.id))
  const flags: string[] = []
  if (papa(1)) flags.push(nSay(L, 'Lagna holds a difficult planet: the person’s overall health and the head are under pressure.', 'लग्न में कठिन ग्रह है: व्यक्ति के समग्र स्वास्थ्य और सिर पर दबाव है।'))
  if (papa(10)) {
    flags.push(nSay(L, 'The 10th holds a difficult planet. That house is the 7th from the mother, so her kidneys, blood sugar, and uterus are checked.', 'दसवें भाव में कठिन ग्रह है। यह भाव माता से सातवाँ है, इसलिए उनके गुर्दे, रक्त शर्करा और गर्भाशय की जाँच की जाती है।'))
  }
  if (papa(9)) flags.push(nSay(L, 'The 9th holds a difficult planet. That house is the 6th from the mother, so her digestion is checked.', 'नौवें भाव में कठिन ग्रह है। यह भाव माता से छठा है, इसलिए उनके पाचन की जाँच की जाती है।'))
  if (papa(8)) flags.push(nSay(L, 'The 8th holds a difficult planet. That house is the 5th from the mother, so her heart is checked.', 'आठवें भाव में कठिन ग्रह है। यह भाव माता से पाँचवाँ है, इसलिए उनके हृदय की जाँच की जाती है।'))
  if (papa(11)) flags.push(nSay(L, 'The 11th holds a difficult planet. That house is the 7th from the children, so their kidneys are checked.', 'ग्यारहवें भाव में कठिन ग्रह है। यह भाव संतान से सातवाँ है, इसलिए उनके गुर्दों की जाँच की जाती है।'))
  if (papa(9) && papa(5)) flags.push(nSay(L, 'The 9th is also the 5th from the children: their heart and stomach are checked when it is afflicted.', 'नौवाँ भाव संतान से पाँचवाँ भी है: पीड़ित होने पर उनके हृदय और पेट की जाँच की जाती है।'))
  return flags
}

/** A parivartana house that is the 2nd from a relative strengthens that relative’s wealth. */
export function parivartanaWealth(
  pairs: readonly { a: HouseNumber; b: HouseNumber }[],
  lang?: EngineLang,
): string[] {
  const L = nLang(lang)
  const notes: string[] = []
  for (const pair of pairs) {
    for (const house of [pair.a, pair.b]) {
      for (const subject of NADI_ROTATION_SUBJECTS) {
        if (subject.id === 'native') continue
        if (houseCountedFrom(subject.house, 2) !== house) continue
        notes.push(nSay(L,
          `Exchange touching the ${ordinalHouse(house)} strengthens the wealth of ${subject.label.toLowerCase()}. That house is the 2nd from theirs.`,
          `${nOrd(house, L)} भाव को छूने वाला परिवर्तन योग ${NADI_RELATIVE_HI[subject.id] ?? subject.label} के धन को बल देता है। यह भाव उनके भाव से दूसरा है।`))
      }
    }
  }
  return [...new Set(notes)]
}

export function uniformNotes(
  tenthLord: ClassicalGrahaId | null,
  tenthOccupants: readonly ClassicalGrahaId[],
  lang?: EngineLang,
): string[] {
  const L = nLang(lang)
  const notes: string[] = []
  const saturn = tenthLord === 'Sa' || tenthOccupants.includes('Sa')
  const mars = tenthLord === 'Ma' || tenthOccupants.includes('Ma')
  if (saturn) notes.push(nSay(L, 'Saturn is tied to the 10th: a black coat, read as law, when the career holds.', 'शनि दसवें भाव से जुड़ा है: करियर टिके तो काला कोट, यानी कानून, पढ़ा जाता है।'))
  if (mars) notes.push(nSay(L, 'Mars is tied to the 10th: a uniform, read as police, military, or surgery, when the career holds.', 'मंगल दसवें भाव से जुड़ा है: करियर टिके तो वर्दी, यानी पुलिस, सेना या शल्य चिकित्सा, पढ़ी जाती है।'))
  return notes
}

export function navamshaLabel(rashi: Rashi | null | undefined, lang?: EngineLang): string | null {
  if (!rashi) return null
  return lang === 'hi' ? nR(rashi, lang) : RASHI_NAMES[rashi] ?? null
}
