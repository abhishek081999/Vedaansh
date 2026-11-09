// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/career.ts
//  Career from the birth chart, in the order taught:
//  exchange, then three planets in one house, then Saturn’s
//  conjunction, then Saturn’s trine, then a vargottama or
//  exalted planet, then the 10th. Rashi exchange only.
//  A retrograde planet is counted in the sign it occupies.
//  Saturn with the Moon is read as agriculture, dairy, food, or land.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAfflictedBy } from '@/lib/engine/nadi/grahas'
import { NADI_CAREER_WORK } from '@/lib/engine/nadi/rotation'
import { nadiClosenessClause, nadiConjunctionGrade, nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'
import { NADI_CAREER_WORK_HI } from '@/lib/engine/locale/nadiRead.hi'
import { nG, nJoin, nLang, nOrd, nSay, type EngineLang } from '@/lib/engine/nadi/text'

export const NADI_CAREER_CONTEXT =
  'Read the size of the result against the place of birth. The chart is the floor.'

export const NADI_CAREER_CONTEXT_HI =
  'फल का आकार जन्मस्थान के संदर्भ में पढ़ें। कुंडली न्यूनतम आधार है।'

const HOUSE_CAREER: Record<HouseNumber, string> = {
  1: 'the person’s own name and effort',
  2: 'food, a family business, a hotel, or accumulated wealth',
  3: 'writing, courage, or short journeys',
  4: 'property, rent, vehicles, or a family business in land',
  5: 'speculation, markets, or education',
  6: 'medicine, law, or consulting, with service and comfort around the person',
  7: 'business or a partnership, including one already established',
  8: 'inheritance, occult work, or wealth from the spouse’s family, with little need to earn it',
  9: 'luck, teaching, spiritual work, or trade across countries, often with little personal effort',
  10: 'rank and a public position',
  11: 'gains, a windfall, or a desire that is met',
  12: 'life abroad, an overseas career, or spiritual withdrawal',
}

const HOUSE_CAREER_HI: Record<HouseNumber, string> = {
  1: 'व्यक्ति का अपना नाम और प्रयास',
  2: 'भोजन, पारिवारिक व्यापार, होटल, या संचित धन',
  3: 'लेखन, साहस, या छोटी यात्राएँ',
  4: 'संपत्ति, किराया, वाहन, या भूमि का पारिवारिक व्यापार',
  5: 'सट्टा, बाज़ार, या शिक्षा',
  6: 'चिकित्सा, कानून, या परामर्श, व्यक्ति के आसपास सेवा और सुविधा के साथ',
  7: 'व्यापार या साझेदारी, पहले से स्थापित साझेदारी भी',
  8: 'विरासत, गूढ़ काम, या जीवनसाथी के परिवार से धन, कमाने की ज़रूरत कम',
  9: 'भाग्य, अध्यापन, आध्यात्मिक काम, या देशों के बीच व्यापार, अक्सर कम व्यक्तिगत प्रयास से',
  10: 'पद और सार्वजनिक स्थान',
  11: 'लाभ, अचानक मिला धन, या पूरी हुई इच्छा',
  12: 'विदेश में जीवन, विदेशी करियर, या आध्यात्मिक एकांत',
}

const MEGA_CAREER_HI: Partial<Record<HouseNumber, string>> = {
  1: 'अपने बल पर बना नाम',
  5: 'सट्टा, शेयर बाज़ार, या गेमिंग',
  6: 'डॉक्टर या वकील',
}

const PAIR_CAREER_HI: Record<string, string> = {
  '1-2': 'ऐसा नाम जो व्यापार चलाता है, और उसके साथ धन।',
  '2-4': 'भोजन या पारिवारिक व्यापार, या संपत्ति और किराया।',
  '4-12': 'विदेश में संपत्ति, और विदेश में बसा जीवन।',
  '5-11': 'सट्टा, बाज़ार, या लॉटरी जैसा अचानक मिला धन।',
  '9-12': 'विदेश में करियर, देशों के बीच व्यापार, या अध्यापन का पद।',
  '9-10': 'सरकारी काम, राजनीति, या पारिवारिक व्यापार।',
  '10-11': 'निदेशक जैसा ऊँचा पद।',
  '10-12': 'विदेश में काम, या आयात-निर्यात का व्यापार।',
}

const MEGA_CAREER: Partial<Record<HouseNumber, string>> = {
  1: 'a self-made name',
  5: 'speculation, the stock market, or gaming',
  6: 'a doctor or a lawyer',
}

const PAIR_CAREER: Record<string, string> = {
  '1-2': 'A name that carries a business, and wealth with it.',
  '2-4': 'Food or a family business, or property and rent.',
  '4-12': 'Property abroad, and a life settled overseas.',
  '5-11': 'Speculation, markets, or a windfall such as a lottery.',
  '9-12': 'A career abroad, trade across countries, or a teaching post.',
  '9-10': 'Government work, politics, or a family business.',
  '10-11': 'A high post, such as a director.',
  '10-12': 'Work abroad, or an import-export business.',
}

const WEALTH_HOUSES = new Set<HouseNumber>([2, 9, 11])
const STRONG = new Set(['exalted', 'own', 'moolatrikona'])
const DUSTHANA = new Set<HouseNumber>([6, 8, 12])
const SATURN_ORDER: readonly ClassicalGrahaId[] = ['Ra', 'Ke', 'Ma', 'Ve', 'Ju', 'Su', 'Me', 'Mo']

export interface NadiCareerReading {
  priority: 1 | 2 | 3 | 4 | 5
  lines: string[]
  wealth: string | null
  lucky: string | null
  exams: string | null
  notes: string[]
}

export interface NadiCareerInput {
  ascRashi: Rashi
  grahas: readonly NadiYogaPlacement[]
  parivartana: readonly { a: HouseNumber; b: HouseNumber }[]
  navamsha?: Partial<Record<ClassicalGrahaId, Rashi>>
  ninthArudhaInLagna?: boolean
  dashaLords?: readonly ClassicalGrahaId[]
  lang?: EngineLang
}

export function findNadiCareer(input: NadiCareerInput): NadiCareerReading {
  const L = nLang(input.lang)
  const lucky = input.ninthArudhaInLagna
    ? nSay(L,
      'The arudha of the 9th falls in the lagna. Wealth is read as unearned, from the father or through marriage, and things arrive with little personal effort.',
      'नवम भाव का आरूढ़ लग्न में पड़ता है। धन बिना कमाए, पिता से या विवाह के माध्यम से, पढ़ा जाता है, और चीज़ें कम व्यक्तिगत प्रयास से आती हैं।')
    : null
  const notes = sideNotes(input, L)
  const exams = examNote(input, L)
  const core = careerCore(input, L)
  return { ...core, lucky, exams, notes }
}

function careerCore(input: NadiCareerInput, L: EngineLang): Pick<NadiCareerReading, 'priority' | 'lines' | 'wealth'> {
  const t = (en: string, hi: string) => nSay(L, en, hi)
  const o = (n: number) => `${nOrd(n, 'hi')} भाव`
  if (input.parivartana.length > 0) {
    const lines = [t('An exchange is present, so career is read from those houses. The 10th is set aside.', 'परिवर्तन योग मौजूद है, इसलिए करियर उन्हीं भावों से पढ़ा जाता है। दसवें भाव को अलग रखा जाता है।')]
    let wealth = false
    for (const pair of input.parivartana) {
      const key = pair.a < pair.b ? `${pair.a}-${pair.b}` : `${pair.b}-${pair.a}`
      const named = PAIR_CAREER[key]
      const either = `${HOUSE_CAREER[pair.a]}; or ${HOUSE_CAREER[pair.b]}`
      const namedHi = PAIR_CAREER_HI[key]
      const eitherHi = `${HOUSE_CAREER_HI[pair.a]}; या ${HOUSE_CAREER_HI[pair.b]}`
      lines.push(t(
        named
          ? `Exchange of the ${ordinal(pair.a)} and the ${ordinal(pair.b)}. ${named} Either may show: ${either}.`
          : `Exchange of the ${ordinal(pair.a)} and the ${ordinal(pair.b)}. Either may show: ${either}.`,
        namedHi
          ? `${o(pair.a)} और ${o(pair.b)} का परिवर्तन योग। ${namedHi} इनमें से कोई भी दिख सकता है: ${eitherHi}।`
          : `${o(pair.a)} और ${o(pair.b)} का परिवर्तन योग। इनमें से कोई भी दिख सकता है: ${eitherHi}।`,
      ))
      const lords = new Set([lordOf(input.ascRashi, pair.a), lordOf(input.ascRashi, pair.b)])
      if (lords.has('Sa') && lords.has('Ve')) {
        lines.push(t('The exchanging lords are Saturn and Venus. Cloth, jewelry, hotels, vehicles, finance, or medicine is read ahead of a mere conjunction, and it is read as wealth.', 'परिवर्तन करने वाले स्वामी शनि और शुक्र हैं। कपड़ा, आभूषण, होटल, वाहन, वित्त या चिकित्सा को साधारण युति से पहले पढ़ा जाता है, और इसे धन के रूप में पढ़ा जाता है।'))
      }
      if (lords.has('Sa') && lords.has('Ma')) {
        lines.push(t('The exchanging lords are Saturn and Mars. Engineering is read ahead of a trine.', 'परिवर्तन करने वाले स्वामी शनि और मंगल हैं। इंजीनियरिंग को त्रिकोण से पहले पढ़ा जाता है।'))
      }
      if (pair.a === 5 && pair.b === 9) {
        lines.push(t('Exchange of the 5th and the 9th. A high government post is one option.', 'पाँचवें और नौवें भाव का परिवर्तन योग। ऊँचा सरकारी पद एक विकल्प है।'))
      }
      if (lords.has('Su') && lords.has('Sa')) {
        lines.push(t('Sun and Saturn are the exchanging lords. This is the one exchange read as under pressure. The houses are still the career.', 'परिवर्तन करने वाले स्वामी सूर्य और शनि हैं। यही एक परिवर्तन योग है जो दबाव में पढ़ा जाता है। फिर भी करियर इन्हीं भावों से है।'))
      }
      if ((pair.a === 12 || pair.b === 12) && !/abroad|overseas|import-export/.test(named ?? '')) {
        lines.push(t('The 12th is in the exchange. Work or settlement away from home is checked.', 'बारहवाँ भाव परिवर्तन योग में है। घर से दूर काम या बसने की जाँच की जाती है।'))
      }
      if ((pair.a === 4 || pair.b === 4) && jupiterStrong(input)) {
        lines.push(t('The 4th is in the exchange, and Jupiter is strong. Property and a vehicle are read as supported.', 'चौथा भाव परिवर्तन योग में है, और गुरु बलवान है। संपत्ति और वाहन को सहारा पढ़ा जाता है।'))
      }
      if (WEALTH_HOUSES.has(pair.a) || WEALTH_HOUSES.has(pair.b)) wealth = true
    }
    return {
      priority: 1,
      lines,
      wealth: wealth ? t('The 2nd, 9th, or 11th is in the exchange. That is read as large wealth.', 'दूसरा, नौवाँ या ग्यारहवाँ भाव परिवर्तन योग में है। इसे बड़े धन के रूप में पढ़ा जाता है।') : null,
    }
  }

  const byHouse = housesOf(input)
  const crowds = [...byHouse.entries()].filter(([, list]) => list.length >= 3)
  const decisive = crowds.filter(([house]) => house !== 1)
  if (decisive.length > 0) {
    const lines = decisive.map(([house, list]) => {
      const dusthana = house === 6 || house === 8 || house === 12
        ? t(' A crowd here is read as success in that house’s work.', ' यहाँ ग्रहों का जमावड़ा उस भाव के काम में सफलता पढ़ा जाता है।')
        : ''
      return t(
        `${list.map((g) => GRAHA_NAMES[g.id]).join(', ')} sit together in the ${ordinal(house)}. Career is read from that house: ${MEGA_CAREER[house] ?? HOUSE_CAREER[house]}.${dusthana}`,
        `${nJoin(list.map((g) => nG(g.id, 'hi')), 'hi')} ${o(house)} में साथ बैठे हैं। करियर उसी भाव से पढ़ा जाता है: ${MEGA_CAREER_HI[house] ?? HOUSE_CAREER_HI[house]}।${dusthana}`,
      )
    })
    if (decisive.length > 1) lines.push(t('More than one house holds three planets. Dashamsha is used to choose between them.', 'एक से अधिक भावों में तीन ग्रह हैं। इनमें से चुनने के लिए दशांश का उपयोग किया जाता है।'))
    return { priority: 2, lines, wealth: null }
  }

  const fifth = fifthSupports(input)
  const conjunct = saturnContacts(input.grahas, 'yuti')
  if (conjunct.length > 0) {
    return {
      priority: 3,
      lines: [
        t(`Saturn is conjunct ${namesOf(conjunct)}. That contact is read ahead of a trine.`, `शनि की ${namesOfHi(conjunct)} से युति है। इस संपर्क को त्रिकोण से पहले पढ़ा जाता है।`),
        ...conjunct.map((id) => {
          const clause = nadiClosenessClause(nadiConjunctionGrade(input.grahas, ['Sa', id]), L)
          const line = saturnLine(id, fifth, L)
          return clause ? `${line} ${clause}` : line
        }),
      ],
      wealth: null,
    }
  }

  const trine = saturnContacts(input.grahas, 'trine')
  if (trine.length > 0) {
    return {
      priority: 4,
      lines: [
        t(`In the 5th or 9th sign from Saturn: ${namesOf(trine)}. A conjunction would come ahead of this.`, `शनि से पाँचवीं या नौवीं राशि में: ${namesOfHi(trine)}। युति होती तो वह इससे पहले आती।`),
        ...trine.map((id) => saturnLine(id, fifth, L)),
      ],
      wealth: null,
    }
  }

  const special: string[] = []
  for (const g of input.grahas) {
    const vargottama = input.navamsha?.[g.id] === g.rashi
    const exalted = placedDignity(g) === 'exalted'
    if (!vargottama && !exalted) continue
    const how = vargottama && exalted ? 'vargottama and exalted' : vargottama ? 'vargottama' : 'exalted'
    const howHi = vargottama && exalted ? 'वर्गोत्तम और उच्च का' : vargottama ? 'वर्गोत्तम' : 'उच्च का'
    special.push(t(
      `${GRAHA_NAMES[g.id]} is ${how}. Career is read from that planet: ${NADI_CAREER_WORK[g.id]}.`,
      `${nG(g.id, 'hi')} ${howHi} है। करियर उसी ग्रह से पढ़ा जाता है: ${NADI_CAREER_WORK_HI[g.id]}।`,
    ))
  }
  if (special.length > 0) return { priority: 5, lines: special, wealth: null }

  const tenthSign = rashiForHouseFromLagna(input.ascRashi, 10)
  const tenthLord = RASHI_LORDS.find((row) => row.number === tenthSign)?.lord ?? 'Su'
  const occupants = (byHouse.get(10) ?? []).map((g) => GRAHA_NAMES[g.id])
  const where = occupants.length === 0
    ? ''
    : occupants.length === 1
      ? `, where ${occupants[0]} sits,`
      : `, where ${occupants.join(', ')} sit,`
  const missing = [
    'No exchange',
    'no group of three',
    'no Saturn career pair',
    input.navamsha ? 'no vargottama planet' : null,
    'no exalted planet',
  ].filter((part): part is string => part !== null).join(', ')
  if (L === 'hi') {
    const occ = (byHouse.get(10) ?? []).map((g) => nG(g.id, 'hi'))
    const whereHi = occ.length === 0 ? '' : `, जहाँ ${nJoin(occ, 'hi')} ${occ.length === 1 ? 'है' : 'हैं'},`
    const missingHi = [
      'कोई परिवर्तन योग नहीं',
      'तीन ग्रहों का कोई समूह नहीं',
      'शनि का कोई करियर जोड़ा नहीं',
      input.navamsha ? 'कोई वर्गोत्तम ग्रह नहीं' : null,
      'कोई उच्च का ग्रह नहीं',
    ].filter((part): part is string => part !== null).join(', ')
    return {
      priority: 5,
      lines: [`${missingHi}। करियर दसवें भाव${whereHi} और उसके स्वामी ${nG(tenthLord, 'hi')} से पढ़ा जाता है।`],
      wealth: null,
    }
  }
  return {
    priority: 5,
    lines: [
      `${missing}. Career is read from the 10th${where} and from its lord ${GRAHA_NAMES[tenthLord]}.`,
    ],
    wealth: null,
  }
}

function namesOfHi(ids: readonly ClassicalGrahaId[]): string {
  return ids.map((id) => nG(id, 'hi')).join(' और ')
}

const SATURN_LINE_HI: Record<string, string> = {
  Ra: 'आईटी, कंप्यूटर, या अन्य तकनीक। यही संपर्क काम को विदेश भी ले जा सकता है। उस क्षेत्र में यह करियर को सहारा देता है। उससे बाहर रुकावटों और बाधाओं की जाँच की जाती है।',
  KeFifth: 'आईटी या तकनीक। पाँचवाँ भाव पढ़ाई को सहारा देता है, इसलिए कानून का रास्ता खुला रहता है। उस क्षेत्र से बाहर रुकावटों की जाँच की जाती है।',
  Ke: 'आईटी या तकनीक। पाँचवाँ भाव कानून की पढ़ाई नहीं जोड़ता। उस क्षेत्र से बाहर रुकावटों की जाँच की जाती है।',
  MaFifth: 'इंजीनियरिंग या अन्य तकनीकी काम। पाँचवाँ भाव पढ़ाई को सहारा देता है, इसलिए शल्य चिकित्सा दुर्लभ रूप के तौर पर खुली रहती है।',
  Ma: 'इंजीनियरिंग या अन्य तकनीकी काम।',
  VeFifth: 'कपड़ा, आभूषण, होटल, वाहन, या अन्य विलास की वस्तुएँ। पाँचवाँ भाव पढ़ाई को सहारा देता है, इसलिए उस व्यापार के साथ वित्त या चिकित्सा पढ़ी जाती है। यह जोड़ा धन के रूप में भी पढ़ा जाता है।',
  Ve: 'कपड़ा, आभूषण, होटल, वाहन, या अन्य विलास की वस्तुएँ। पाँचवाँ भाव लंबी पढ़ाई नहीं जोड़ता, इसलिए व्यापार वाला रूप पढ़ना चाहिए। यह जोड़ा धन के रूप में भी पढ़ा जाता है।',
  Ju: 'अध्यापन, परामर्श, ज्योतिष, या कानून।',
  Su: 'व्यक्ति के लिए या पिता के लिए सरकारी पद। पिता के स्वास्थ्य और हृदय पर दबाव है, और न्यायालय के मामले की जाँच की जाती है।',
  Mo: 'कृषि, डेयरी, भोजन, या भूमि। शहर या देश बदलने की भी जाँच की जाती है।',
  Me: 'व्यापार, पत्रकारिता, बैंकिंग, अध्यापन, या बुध से जुड़ा अन्य काम।',
}

function saturnLine(id: ClassicalGrahaId, fifth: boolean, L: EngineLang = 'en'): string {
  if (L === 'hi') {
    const key = (id === 'Ke' || id === 'Ma' || id === 'Ve') && fifth ? `${id}Fifth` : id
    return SATURN_LINE_HI[key] ?? SATURN_LINE_HI.Me!
  }
  if (id === 'Ra') {
    return 'IT, computers, or other technology. The same contact can take the work abroad. In that field it supports the career. Outside it, breaks and obstacles are checked.'
  }
  if (id === 'Ke') {
    return fifth
      ? 'IT or technology. The 5th supports study, so law stays open. Outside that field, breaks are checked.'
      : 'IT or technology. The 5th does not add a law course. Outside that field, breaks are checked.'
  }
  if (id === 'Ma') {
    return fifth
      ? 'Engineering or other technical work. The 5th supports study, so surgery stays open as the rare form.'
      : 'Engineering or other technical work.'
  }
  if (id === 'Ve') {
    return fifth
      ? 'Cloth, jewelry, hotels, vehicles, or other luxury goods. The 5th supports study, so finance or medicine is read beside that business. The pair is also read as wealth.'
      : 'Cloth, jewelry, hotels, vehicles, or other luxury goods. The 5th does not add a long course, so the business form is the one to read. The pair is also read as wealth.'
  }
  if (id === 'Ju') return 'Teaching, consulting, astrology, or the law.'
  if (id === 'Su') {
    return 'A government post, for the person or for the father. The father’s health and the heart are under pressure, and a court case is checked.'
  }
  if (id === 'Mo') {
    return 'Agriculture, dairy, food, or land. A change of city or country is also checked.'
  }
  return 'Business, journalism, banking, teaching, or other Mercury work.'
}

function saturnContacts(grahas: readonly NadiYogaPlacement[], kind: 'yuti' | 'trine'): ClassicalGrahaId[] {
  const saturn = grahas.find((g) => g.id === 'Sa')
  if (!saturn) return []
  const fifth = countedSign(saturn.rashi, 5)
  const ninth = countedSign(saturn.rashi, 9)
  const found = SATURN_ORDER.filter((id) => {
    const other = grahas.find((g) => g.id === id)
    if (!other) return false
    if (kind === 'yuti') return nadiConjunct(grahas, ['Sa', id]) !== null
    return other.rashi === fifth || other.rashi === ninth
  })
  if (kind === 'trine' && found.length === 1 && found[0] === 'Ma') return []
  return found
}

function sideNotes(input: NadiCareerInput, L: EngineLang): string[] {
  const t = (en: string, hi: string) => nSay(L, en, hi)
  const notes: string[] = []
  const birth = nadiConjunct(input.grahas, ['Ma', 'Ve']) !== null
  const navamsha = input.navamsha?.Ma != null && input.navamsha.Ma === input.navamsha.Ve
  if (birth || navamsha) {
    const where = birth && navamsha
      ? 'in the birth chart and in Navamsha'
      : birth
        ? 'in the birth chart'
        : 'in Navamsha'
    const whereHi = birth && navamsha ? 'जन्म कुंडली और नवांश दोनों में' : birth ? 'जन्म कुंडली में' : 'नवांश में'
    notes.push(t(`Mars with Venus ${where}: the living is read as luxury, apart from the profession.`, `${whereHi} मंगल के साथ शुक्र: पेशे से अलग, रहन-सहन विलासपूर्ण पढ़ा जाता है।`))
  }

  const saturn = input.grahas.find((g) => g.id === 'Sa')
  const jupiter = input.grahas.find((g) => g.id === 'Ju')
  if (saturn && jupiter) {
    const saturnState = saturn.rashi === 7 ? 'exalted' : saturn.rashi === 10 || saturn.rashi === 11 ? 'own' : null
    const jupiterState = jupiter.rashi === 4 ? 'exalted' : jupiter.rashi === 9 || jupiter.rashi === 12 ? 'own' : null
    if (saturnState && jupiterState) {
      notes.push(saturnState === 'exalted' && jupiterState === 'own'
        ? t('Saturn is exalted and Jupiter is in its own sign. Inherited wealth is the strong form of this pair, with little need to earn it.', 'शनि उच्च का है और गुरु अपनी राशि में है। विरासत में मिला धन इस जोड़े का प्रबल रूप है, कमाने की ज़रूरत कम।')
        : t('Saturn and Jupiter are each in exaltation or their own sign. Wealth is read as inherited, with little need to earn it.', 'शनि और गुरु दोनों उच्च के या अपनी राशि में हैं। धन विरासत में मिला पढ़ा जाता है, कमाने की ज़रूरत कम।'))
    }
  }
  if (jupiter && wholeSignHouseFromLagna(input.ascRashi, jupiter.rashi) === 4) {
    notes.push(t('Jupiter in the 4th: an SUV is the vehicle read for this chart.', 'चौथे भाव में गुरु: इस कुंडली के लिए एसयूवी जैसा बड़ा वाहन पढ़ा जाता है।'))
  }
  if (nadiConjunct(input.grahas, ['Su', 'Me', 'Ve'])) {
    const sun = input.grahas.find((g) => g.id === 'Su')
    const sunStrong = sun?.rashi === 1 || sun?.rashi === 5
    notes.push(sunStrong
      ? t('Sun, Mercury, and Venus together, with the Sun strong: the father is read as wealthy. In a woman’s chart the same reading is taken for the father-in-law.', 'सूर्य, बुध और शुक्र साथ हैं, और सूर्य बलवान है: पिता धनी पढ़े जाते हैं। स्त्री की कुंडली में यही फल ससुर के लिए लिया जाता है।')
      : t('Sun, Mercury, and Venus are together, and the Sun is not strong, so the wealthy-father reading is not taken.', 'सूर्य, बुध और शुक्र साथ हैं, पर सूर्य बलवान नहीं है, इसलिए धनी पिता वाला फल नहीं लिया जाता।'))
  }
  const running = new Set((input.dashaLords ?? []).slice(0, 3))
  const pressured = new Set<ClassicalGrahaId>()
  const supportive = new Set<ClassicalGrahaId>()
  for (const pair of input.parivartana) {
    const lords = [lordOf(input.ascRashi, pair.a), lordOf(input.ascRashi, pair.b)]
    const target = lords.includes('Su') && lords.includes('Sa') ? pressured : supportive
    for (const id of lords) target.add(id)
  }
  if ([...running].some((id) => pressured.has(id))) {
    notes.push(t('A lord of the Sun and Saturn exchange is in the running period. The result is read as under pressure.', 'सूर्य और शनि के परिवर्तन योग का एक स्वामी चल रही दशा में है। फल दबाव में पढ़ा जाता है।'))
  } else if ([...running].some((id) => supportive.has(id))) {
    notes.push(t('A lord of the exchange is in the running period, so the career result is read now.', 'परिवर्तन योग का एक स्वामी चल रही दशा में है, इसलिए करियर का फल अभी पढ़ा जाता है।'))
  }
  const first = input.grahas.filter((g) => wholeSignHouseFromLagna(input.ascRashi, g.rashi) === 1)
  if (first.length >= 3) {
    notes.push(t('The 1st holds a crowd. Sport or physical work is the form. It does not name one profession by itself.', 'पहले भाव में ग्रहों का जमावड़ा है। खेल या शारीरिक काम इसका रूप है। यह अपने आप कोई एक पेशा नहीं बताता।'))
  }
  const study = studyPath(input, L)
  if (study) notes.push(study)
  if (nadiConjunct(input.grahas, ['Su', 'Me'])) {
    const sun = input.grahas.find((g) => g.id === 'Su')
    if (sun) {
      const house = wholeSignHouseFromLagna(input.ascRashi, sun.rashi)
      notes.push(t(`Sun with Mercury weakens the ${ordinal(house)}. Work is read from that house.`, `बुध के साथ सूर्य ${nOrd(house, 'hi')} भाव को कमज़ोर करता है। काम उसी भाव से पढ़ा जाता है।`))
    }
  }
  return notes
}

function examNote(input: NadiCareerInput, L: EngineLang): string | null {
  const fifth = lordState(input, 5)
  const ninth = lordState(input, 9)
  if (!fifth.placed || !ninth.placed) return null
  if (fifth.strong && ninth.strong) return null
  return nSay(L,
    'The 5th lord and the 9th lord are not both strong. A competitive exam is not the result read from this chart.',
    'पंचमेश और नवमेश दोनों बलवान नहीं हैं। इस कुंडली से प्रतियोगी परीक्षा का फल नहीं पढ़ा जाता।')
}

function jupiterStrong(input: NadiCareerInput): boolean {
  const jupiter = input.grahas.find((g) => g.id === 'Ju')
  if (!jupiter) return false
  return STRONG.has(placedDignity(jupiter)) && nadiAfflictedBy('Ju', coOccupants(input, jupiter.rashi)).length === 0
}

function studyPath(input: NadiCareerInput, L: EngineLang): string | null {
  const sign = rashiForHouseFromLagna(input.ascRashi, 5)
  const lord = lordOf(input.ascRashi, 5)
  const nodesInFifth = input.grahas.some((g) => (g.id === 'Ra' || g.id === 'Ke') && g.rashi === sign)
  const lordWithNode = input.grahas.some((g) => (g.id === 'Ra' || g.id === 'Ke') && nadiConjunct(input.grahas, [lord, g.id]) != null)
  const lordWithSaturn = nadiConjunct(input.grahas, ['Sa', lord]) != null
  if (nodesInFifth || lordWithNode || lordWithSaturn) {
    return nSay(L, 'The 5th is under pressure. Where a planet offers both a trained post and a practical trade, the practical trade is the one to read.', 'पाँचवें भाव पर दबाव है। जहाँ कोई ग्रह प्रशिक्षित पद और व्यावहारिक धंधा दोनों देता है, वहाँ व्यावहारिक धंधा पढ़ना चाहिए।')
  }
  const jupiter = input.grahas.find((g) => g.id === 'Ju')
  const jupiterReady = jupiter != null && jupiterStrong(input) && !DUSTHANA.has(wholeSignHouseFromLagna(input.ascRashi, jupiter.rashi))
  if (fifthSupports(input) || jupiterReady) {
    return nSay(L, 'The 5th supports study. Where a planet offers both a trained post and a practical trade, the trained post is the one to read.', 'पाँचवाँ भाव पढ़ाई को सहारा देता है। जहाँ कोई ग्रह प्रशिक्षित पद और व्यावहारिक धंधा दोनों देता है, वहाँ प्रशिक्षित पद पढ़ना चाहिए।')
  }
  return null
}

function coOccupants(input: NadiCareerInput, sign: Rashi): ClassicalGrahaId[] {
  return input.grahas.filter((g) => g.rashi === sign).map((g) => g.id)
}

function fifthSupports(input: NadiCareerInput): boolean {
  const fifth = lordState(input, 5)
  return fifth.placed && fifth.strong
}

function lordState(input: NadiCareerInput, house: HouseNumber): { placed: boolean; strong: boolean } {
  const lord = lordOf(input.ascRashi, house)
  const placed = input.grahas.find((g) => g.id === lord)
  if (!placed) return { placed: false, strong: false }
  const houseOfLord = wholeSignHouseFromLagna(input.ascRashi, placed.rashi)
  const co = input.grahas.filter((g) => g.rashi === placed.rashi).map((g) => g.id)
  const strong = STRONG.has(placedDignity(placed))
    && !DUSTHANA.has(houseOfLord)
    && nadiAfflictedBy(lord, co).length === 0
  return { placed: true, strong }
}

function housesOf(input: NadiCareerInput): Map<HouseNumber, NadiYogaPlacement[]> {
  const byHouse = new Map<HouseNumber, NadiYogaPlacement[]>()
  for (const g of input.grahas) {
    const house = wholeSignHouseFromLagna(input.ascRashi, g.rashi)
    const list = byHouse.get(house) ?? []
    list.push(g)
    byHouse.set(house, list)
  }
  return byHouse
}

function lordOf(asc: Rashi, house: HouseNumber): ClassicalGrahaId {
  const sign = rashiForHouseFromLagna(asc, house)
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function namesOf(ids: readonly ClassicalGrahaId[]): string {
  return ids.map((id) => GRAHA_NAMES[id]).join(' and ')
}

function placedDignity(g: NadiYogaPlacement): string {
  if (g.dignity) return g.dignity
  return getDignity(g.id, g.rashi, g.degree ?? 15)
}

function countedSign(start: Rashi, nth: number): Rashi {
  return (((start - 1 + (nth - 1)) % 12) + 1) as Rashi
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}
