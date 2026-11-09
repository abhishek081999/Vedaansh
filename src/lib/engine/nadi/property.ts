// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/property.ts
//  Chaturthamsha (D4) property and Shodashamsha (D16) vehicles.
//  Each varga is its own chart. Exchange is read first.
//  A debilitated planet in the 6th, 8th, or 12th of that
//  varga is read as exalted. Nodes are not switched here.
// ─────────────────────────────────────────────────────────────

import type { NodeMode, Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDignity } from '@/lib/engine/dignity'
import {
  RASHI_LORDS,
  wholeSignHouseFromLagna,
  type ClassicalGrahaId,
  type HouseNumber,
} from '@/lib/engine/houseInterpretations'
import { rashiForHouseFromLagna } from '@/lib/engine/rashiInterpretations'
import { nadiAspectsSign } from '@/lib/engine/nadi/snapshots'
import { nadiConjunct, type NadiYogaPlacement } from '@/lib/engine/nadi/yogas'
import { nG, nJoin, nLang, nOrd, nSay, type EngineLang } from '@/lib/engine/nadi/text'

export const NADI_PROPERTY_NOTE =
  'Chaturthamsha is read as its own chart. The lagna and the 4th are the property houses, and Mars is the property significator. Parental property and self-acquired property are read together. A link with the 12th or with Rahu is property away from home. The Sun on the lagna, the 4th, or their lords is government quarters. An exchange is read ahead of the other lines.'

export const NADI_PROPERTY_NOTE_HI =
  'चतुर्थांश को एक स्वतंत्र कुंडली की तरह पढ़ा जाता है। लग्न और चौथा भाव संपत्ति के भाव हैं, और मंगल संपत्ति का कारक है। पैतृक संपत्ति और स्वयं अर्जित संपत्ति साथ पढ़ी जाती हैं। बारहवें भाव या राहु से संबंध घर से दूर की संपत्ति है। लग्न, चौथे भाव या उनके स्वामियों पर सूर्य सरकारी आवास है। परिवर्तन योग को बाकी पंक्तियों से पहले पढ़ा जाता है।'

export const NADI_VEHICLE_NOTE_HI =
  'षोडशांश को एक स्वतंत्र कुंडली की तरह पढ़ा जाता है। लग्न और चौथा भाव वाहन के भाव हैं, और शुक्र वाहन का कारक है। चंद्र, शुक्र, शनि और मंगल में सबसे बलवान ग्रह रंग बताता है। लग्न, चौथे भाव, चतुर्थेश, मंगल या शुक्र पर राहु या केतु हो तो दुर्घटना की जाँच की जाती है। सूर्य सरकारी वाहन है। लग्न या चौथे भाव पर मंगल बत्ती या झंडे वाला वाहन है। परिवर्तन योग को बाकी पंक्तियों से पहले पढ़ा जाता है।'

export const NADI_NODE_NOTE_HI = 'यह कुंडली मध्यम राहु-केतु का उपयोग करती है। नाड़ी राहु और केतु को स्पष्ट (ट्रू) राहु-केतु के रूप में पढ़ती है।'

export const NADI_VEHICLE_NOTE =
  'Shodashamsha is read as its own chart. The lagna and the 4th are the vehicle houses, and Venus is the vehicle significator. The strongest of the Moon, Venus, Saturn, and Mars gives the color. Rahu or Ketu on the lagna, the 4th, the 4th lord, Mars, or Venus is an accident checked. The Sun is a government vehicle. Mars on the lagna or the 4th is a vehicle with a light or a flag. An exchange is read ahead of the other lines.'

const ORDER: readonly ClassicalGrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const COLOR_PLANETS = ['Mo', 'Ve', 'Sa', 'Ma'] as const
const COLOR: Record<(typeof COLOR_PLANETS)[number], string> = {
  Mo: 'White',
  Ve: 'White or silver',
  Sa: 'Black',
  Ma: 'Red',
}

const COLOR_HI: Record<(typeof COLOR_PLANETS)[number], string> = {
  Mo: 'सफ़ेद',
  Ve: 'सफ़ेद या चाँदी जैसा',
  Sa: 'काला',
  Ma: 'लाल',
}

/** Hindi for the fixed phrase fragments the English sentences are built from. */
const PH: Record<string, string> = {
  'sits in the 12th': 'बारहवें भाव में बैठा है',
  'aspects the 12th': 'बारहवें भाव पर दृष्टि डालता है',
  'is the 12th lord': 'द्वादशेश है',
  'connects with the 12th lord': 'द्वादशेश से जुड़ा है',
  'is with Rahu': 'राहु के साथ है',
  'connects with Rahu': 'राहु से जुड़ा है',
  'is the lagna lord': 'लग्नेश है',
  'is with the lagna lord': 'लग्नेश के साथ है',
  'connects with the lagna lord': 'लग्नेश से जुड़ा है',
  'is the 4th lord': 'चतुर्थेश है',
  'is with the 4th lord': 'चतुर्थेश के साथ है',
  'connects with the 4th lord': 'चतुर्थेश से जुड़ा है',
  'sits in the lagna': 'लग्न में बैठा है',
  'aspects the lagna': 'लग्न पर दृष्टि डालता है',
  'sits in the 4th': 'चौथे भाव में बैठा है',
  'aspects the 4th': 'चौथे भाव पर दृष्टि डालता है',
  'is exalted': 'उच्च का है',
  'is in its own sign': 'अपनी राशि में है',
  'is in moolatrikona': 'मूलत्रिकोण में है',
  'rules the lagna': 'लग्न का स्वामी है',
  'rules the 4th': 'चौथे भाव का स्वामी है',
  'is the property significator': 'संपत्ति का कारक है',
  'is the vehicle significator': 'वाहन का कारक है',
  'is in the exchange': 'परिवर्तन योग में है',
  'the lagna': 'लग्न',
  'the 4th': 'चौथे भाव',
  'the 4th lord': 'चतुर्थेश',
}

function ph(parts: readonly string[]): string {
  return nJoin(parts.map((part) => PH[part] ?? part), 'hi')
}

function houseLabelHi(house: HouseNumber): string {
  return house === 1 ? 'लग्न' : `${nOrd(house, 'hi')} भाव`
}

const PERIOD_HI: Record<string, string> = {
  mahadasha: 'महादशा',
  antardasha: 'अंतर्दशा',
  'mahadasha and antardasha': 'महादशा और अंतर्दशा',
}

type Varga = { ascRashi: Rashi; grahas: readonly NadiYogaPlacement[] }

export function propertyNotes(input: {
  chaturthamsha?: Varga
  dashaLords?: readonly ClassicalGrahaId[]
  lang?: EngineLang
}): string[] {
  const L = nLang(input.lang)
  const chart = input.chaturthamsha
  if (!chart) return []
  const { ascRashi: lagna, grahas } = chart
  const lines: string[] = []
  const exchanges = parivartana(lagna, grahas)
  const lagnaLord = signLord(lagna)
  const fourthLord = signLord(rashiForHouseFromLagna(lagna, 4))
  const twelfthLord = signLord(rashiForHouseFromLagna(lagna, 12))

  for (const pair of exchanges) {
    lines.push(nSay(L,
      `An exchange of the ${houseLabel(pair.a)} and the ${houseLabel(pair.b)} is present in Chaturthamsha. Property is read from that.`,
      `चतुर्थांश में ${houseLabelHi(pair.a)} और ${houseLabelHi(pair.b)} का परिवर्तन योग है। संपत्ति इसी से पढ़ी जाती है।`))
  }

  const eleventhIds = ORDER.filter((id) => {
    const planet = placed(grahas, id)
    return planet != null && wholeSignHouseFromLagna(lagna, planet.rashi) === 11
  })
  const eleventh = eleventhIds.map((id) => GRAHA_NAMES[id])
  if (eleventh.length >= 3) {
    lines.push(nSay(L,
      `${joinNames(eleventh)} sit in the 11th of Chaturthamsha. Property and income are read from that crowd.`,
      `${nJoin(eleventhIds.map((id) => nG(id, 'hi')), 'hi')} चतुर्थांश के ग्यारहवें भाव में हैं। संपत्ति और आय ग्रहों के इसी जमावड़े से पढ़े जाते हैं।`))
  }

  const lordInEleventh = [lagnaLord, fourthLord].filter((id, index, list) => list.indexOf(id) === index && houseOf(grahas, lagna, id) === 11)
  if (lordInEleventh.length === 2) {
    lines.push(nSay(L, 'The Chaturthamsha lagna lord and the 4th lord sit in the 11th. Property and gains are read from that.', 'चतुर्थांश के लग्नेश और चतुर्थेश ग्यारहवें भाव में हैं। संपत्ति और लाभ इसी से पढ़े जाते हैं।'))
  } else if (lordInEleventh[0] === lagnaLord) {
    lines.push(nSay(L, 'The Chaturthamsha lagna lord sits in the 11th. Property and gains are read from that.', 'चतुर्थांश का लग्नेश ग्यारहवें भाव में है। संपत्ति और लाभ इसी से पढ़े जाते हैं।'))
  } else if (lordInEleventh[0] === fourthLord) {
    lines.push(nSay(L, 'The 4th lord of Chaturthamsha sits in the 11th. Property and gains are read from that.', 'चतुर्थांश का चतुर्थेश ग्यारहवें भाव में है। संपत्ति और लाभ इसी से पढ़े जाते हैं।'))
  }

  const lagnaStrength = strengthPhrase(placed(grahas, lagnaLord), lagna)
  if (lagnaStrength) lines.push(nSay(L, `The Chaturthamsha lagna lord ${lagnaStrength}. The lagna is read as strong for property.`, `चतुर्थांश का लग्नेश ${PH[lagnaStrength]}। संपत्ति के लिए लग्न बलवान पढ़ा जाता है।`))
  const fourthStrength = strengthPhrase(placed(grahas, fourthLord), lagna)
  if (fourthStrength) lines.push(nSay(L, `The 4th lord of Chaturthamsha ${fourthStrength}. The 4th is read as strong for property.`, `चतुर्थांश का चतुर्थेश ${PH[fourthStrength]}। संपत्ति के लिए चौथा भाव बलवान पढ़ा जाता है।`))

  const mars = placed(grahas, 'Ma')
  if (mars && wholeSignHouseFromLagna(lagna, mars.rashi) === 9 && pole(mars) !== 'debilitated') {
    lines.push(nSay(L, 'Mars sits in the 9th of Chaturthamsha. Property is read as supported.', 'मंगल चतुर्थांश के नौवें भाव में है। संपत्ति को सहारा पढ़ा जाता है।'))
  }
  const marsStrength = strengthPhrase(mars, lagna)
  if (marsStrength) lines.push(nSay(L, `Mars ${marsStrength} in Chaturthamsha. Property is read from Mars.`, `चतुर्थांश में मंगल ${PH[marsStrength]}। संपत्ति मंगल से पढ़ी जाती है।`))

  const jupiter = placed(grahas, 'Ju')
  if (jupiter && wholeSignHouseFromLagna(lagna, jupiter.rashi) === 9 && pole(jupiter) === 'exalted') {
    lines.push(nSay(L, 'Jupiter is exalted in the 9th of Chaturthamsha. Property is read as supported.', 'चतुर्थांश के नौवें भाव में गुरु उच्च का है। संपत्ति को सहारा पढ़ा जाता है।'))
  }
  if (jupiter && wholeSignHouseFromLagna(lagna, jupiter.rashi) === 6) {
    const reversed = dusthanaHouse(jupiter, lagna)
    lines.push(nSay(L,
      `Jupiter in the 6th of Chaturthamsha is read as strong for property.${reversed ? ' The debilitation is read as exalted.' : ''}`,
      `चतुर्थांश के छठे भाव में गुरु संपत्ति के लिए बलवान पढ़ा जाता है।${reversed ? ' नीचता को उच्च की तरह पढ़ा जाता है।' : ''}`))
  }

  for (const id of unique([lagnaLord, fourthLord, 'Ma'])) {
    if (id === 'Ju' && houseOf(grahas, lagna, id) === 6) continue
    const planet = placed(grahas, id)
    const house = planet ? dusthanaHouse(planet, lagna) : null
    if (!planet || !house) continue
    lines.push(nSay(L,
      `${GRAHA_NAMES[id]} is debilitated in the ${ordinal(house)} of Chaturthamsha. That is read as exalted for property.`,
      `चतुर्थांश के ${nOrd(house, 'hi')} भाव में ${nG(id, 'hi')} नीच का है। संपत्ति के लिए इसे उच्च की तरह पढ़ा जाता है।`))
  }

  for (const id of unique([lagnaLord, fourthLord])) {
    const planet = placed(grahas, id)
    if (!planet) continue
    const links = foreignLinks(planet, lagna, grahas, twelfthLord)
    if (!links.length) continue
    const role = id === lagnaLord && id === fourthLord
      ? 'the lagna lord and the 4th lord'
      : id === lagnaLord
        ? 'the lagna lord'
        : 'the 4th lord'
    const roleHi = id === lagnaLord && id === fourthLord ? 'लग्नेश और चतुर्थेश' : id === lagnaLord ? 'लग्नेश' : 'चतुर्थेश'
    lines.push(nSay(L,
      `${GRAHA_NAMES[id]}, ${role} of Chaturthamsha, ${joinParts(links)}. Property away from home is checked.`,
      `चतुर्थांश का ${roleHi} ${nG(id, 'hi')} ${ph(links)}। घर से दूर की संपत्ति की जाँच की जाती है।`))
  }

  const sun = placed(grahas, 'Su')
  if (sun) {
    const links = [
      housePhrase(sun, lagna, 1),
      housePhrase(sun, lagna, 4),
      lordPhrase(sun, placed(grahas, lagnaLord), grahas, 'the lagna lord'),
      lordPhrase(sun, placed(grahas, fourthLord), grahas, 'the 4th lord'),
    ].filter((part): part is string => part !== null)
    if (links.length) {
      lines.push(nSay(L,
        `The Sun ${joinParts(links)} of Chaturthamsha. Government quarters are checked.`,
        `चतुर्थांश में सूर्य ${ph(links)}। सरकारी आवास की जाँच की जाती है।`))
    }
  }

  lines.push(...periodLines(input.dashaLords ?? [], (lord) => {
    const roles: string[] = []
    if (lord === lagnaLord) roles.push('rules the lagna')
    if (lord === fourthLord) roles.push('rules the 4th')
    if (lord === 'Ma') roles.push('is the property significator')
    if (exchangeLord(exchanges, lagna, lord)) roles.push('is in the exchange')
    if (!roles.length) return null
    const only = roles.length === 1 && roles[0] === 'is in the exchange'
    if (L === 'hi') {
      return `${nG(lord, 'hi')} ${ph(roles)}, ${only ? 'इसलिए यह अवधि संपत्ति के लिए सहायक पढ़ी जाती है' : 'इसलिए संपत्ति की जाँच की जाती है'}`
    }
    const effect = only
      ? 'so this period is read as supported for property'
      : 'so property is checked'
    return `${GRAHA_NAMES[lord]} ${joinParts(roles)}, ${effect}`
  }, L))

  return lines
}

export function vehicleNotes(input: {
  shodashamsha?: Varga
  dashaLords?: readonly ClassicalGrahaId[]
  lang?: EngineLang
}): string[] {
  const L = nLang(input.lang)
  const chart = input.shodashamsha
  if (!chart) return []
  const { ascRashi: lagna, grahas } = chart
  const lines: string[] = []
  const exchanges = parivartana(lagna, grahas)
  const lagnaLord = signLord(lagna)
  const fourthLord = signLord(rashiForHouseFromLagna(lagna, 4))

  for (const pair of exchanges) {
    lines.push(nSay(L,
      `An exchange of the ${houseLabel(pair.a)} and the ${houseLabel(pair.b)} is present in Shodashamsha. A vehicle is read from that.`,
      `षोडशांश में ${houseLabelHi(pair.a)} और ${houseLabelHi(pair.b)} का परिवर्तन योग है। वाहन इसी से पढ़ा जाता है।`))
  }

  const lagnaStrength = strengthPhrase(placed(grahas, lagnaLord), lagna)
  if (lagnaStrength) lines.push(nSay(L, `The Shodashamsha lagna lord ${lagnaStrength}. The lagna is read as strong for a vehicle.`, `षोडशांश का लग्नेश ${PH[lagnaStrength]}। वाहन के लिए लग्न बलवान पढ़ा जाता है।`))
  const fourthStrength = strengthPhrase(placed(grahas, fourthLord), lagna)
  if (fourthStrength) lines.push(nSay(L, `The 4th lord of Shodashamsha ${fourthStrength}. The 4th is read as strong for a vehicle.`, `षोडशांश का चतुर्थेश ${PH[fourthStrength]}। वाहन के लिए चौथा भाव बलवान पढ़ा जाता है।`))
  const venusStrength = strengthPhrase(placed(grahas, 'Ve'), lagna)
  if (venusStrength) lines.push(nSay(L, `Venus ${venusStrength} in Shodashamsha. A vehicle is read from Venus.`, `षोडशांश में शुक्र ${PH[venusStrength]}। वाहन शुक्र से पढ़ा जाता है।`))

  const ranked = COLOR_PLANETS.flatMap((id) => {
    const planet = placed(grahas, id)
    const value = planet ? colorScore(planet, lagna) : 0
    return value >= 3 ? [{ id, value }] : []
  })
  const top = ranked.reduce((best, row) => Math.max(best, row.value), 0)
  const winners = ranked.filter((row) => row.value === top)
  if (winners.length === 1) {
    const id = winners[0]!.id
    lines.push(nSay(L,
      `${GRAHA_NAMES[id]} is the strongest of the Moon, Venus, Saturn, and Mars in Shodashamsha. ${COLOR[id]} is the color read for a vehicle.`,
      `षोडशांश में चंद्र, शुक्र, शनि और मंगल में ${nG(id, 'hi')} सबसे बलवान है। वाहन के लिए ${COLOR_HI[id]} रंग पढ़ा जाता है।`))
  } else if (winners.length > 1) {
    const colors = winners.map((row) => `${COLOR[row.id]} is read from ${GRAHA_NAMES[row.id]}`)
    const colorsHi = winners.map((row) => `${nG(row.id, 'hi')} से ${COLOR_HI[row.id]} रंग पढ़ा जाता है`)
    lines.push(nSay(L,
      `${joinNames(winners.map((row) => GRAHA_NAMES[row.id]))} are the strongest of these in Shodashamsha. ${colors.join('. ')}.`,
      `षोडशांश में इनमें ${nJoin(winners.map((row) => nG(row.id, 'hi')), 'hi')} सबसे बलवान हैं। ${colorsHi.join('। ')}।`))
  }

  for (const id of unique([lagnaLord, fourthLord, 'Ve', 'Mo', 'Sa', 'Ma'])) {
    const planet = placed(grahas, id)
    const house = planet ? dusthanaHouse(planet, lagna) : null
    if (!planet || !house) continue
    lines.push(nSay(L,
      `${GRAHA_NAMES[id]} is debilitated in the ${ordinal(house)} of Shodashamsha. That is read as exalted for a vehicle.`,
      `षोडशांश के ${nOrd(house, 'hi')} भाव में ${nG(id, 'hi')} नीच का है। वाहन के लिए इसे उच्च की तरह पढ़ा जाता है।`))
  }

  const hits = (['Ra', 'Ke'] as const).flatMap((id) => {
    const node = placed(grahas, id)
    if (!node) return []
    const found: string[] = []
    const foundHi: string[] = []
    if (reachesHouse(node, lagna, 1)) { found.push('the lagna'); foundHi.push('लग्न') }
    if (reachesHouse(node, lagna, 4)) { found.push('the 4th'); foundHi.push('चौथे भाव') }
    const fourth = placed(grahas, fourthLord)
    if (fourth && fourth.id !== id && meets(node, fourth, grahas)) {
      const both = fourthLord === 'Ma' || fourthLord === 'Ve'
      found.push(both ? `${GRAHA_NAMES[fourthLord]}, the 4th lord` : 'the 4th lord')
      foundHi.push(both ? `चतुर्थेश ${nG(fourthLord, 'hi')}` : 'चतुर्थेश')
    }
    for (const otherId of ['Ma', 'Ve'] as const) {
      if (otherId === fourthLord) continue
      const other = placed(grahas, otherId)
      if (other && meets(node, other, grahas)) { found.push(GRAHA_NAMES[otherId]); foundHi.push(nG(otherId, 'hi')) }
    }
    if (!found.length) return []
    return [nSay(L,
      `${GRAHA_NAMES[id]} connects with ${joinParts(found)} in Shodashamsha`,
      `षोडशांश में ${nG(id, 'hi')} ${nJoin(foundHi, 'hi')} से जुड़ा है`)]
  })
  if (hits.length) {
    lines.push(nSay(L, `${hits.join('. ')}. An accident with a vehicle is checked.`, `${hits.join('। ')}। वाहन दुर्घटना की जाँच की जाती है।`))
  }

  const sun = placed(grahas, 'Su')
  const mars = placed(grahas, 'Ma')
  const sunBits = sun ? [housePhrase(sun, lagna, 1), housePhrase(sun, lagna, 4)].filter((part): part is string => part !== null) : []
  const marsBits = mars ? [housePhrase(mars, lagna, 1), housePhrase(mars, lagna, 4)].filter((part): part is string => part !== null) : []
  if (sunBits.length && marsBits.length) {
    lines.push(nSay(L,
      `The Sun ${joinParts(sunBits)} of Shodashamsha, and Mars ${joinParts(marsBits)}. A government vehicle with a light or a flag is checked.`,
      `षोडशांश में सूर्य ${ph(sunBits)}, और मंगल ${ph(marsBits)}। बत्ती या झंडे वाले सरकारी वाहन की जाँच की जाती है।`))
  } else if (sunBits.length) {
    lines.push(nSay(L, `The Sun ${joinParts(sunBits)} of Shodashamsha. A government vehicle is checked.`, `षोडशांश में सूर्य ${ph(sunBits)}। सरकारी वाहन की जाँच की जाती है।`))
  } else if (marsBits.length) {
    lines.push(nSay(L, `Mars ${joinParts(marsBits)} of Shodashamsha. A vehicle with a light or a flag is checked.`, `षोडशांश में मंगल ${ph(marsBits)}। बत्ती या झंडे वाले वाहन की जाँच की जाती है।`))
  }

  lines.push(...periodLines(input.dashaLords ?? [], (lord) => {
    const roles: string[] = []
    if (lord === lagnaLord) roles.push('rules the lagna')
    if (lord === fourthLord) roles.push('rules the 4th')
    if (lord === 'Ve') roles.push('is the vehicle significator')
    if (exchangeLord(exchanges, lagna, lord)) roles.push('is in the exchange')
    if (!roles.length) return null
    const only = roles.length === 1 && roles[0] === 'is in the exchange'
    if (L === 'hi') {
      return `${nG(lord, 'hi')} ${ph(roles)}, ${only ? 'इसलिए यह अवधि वाहन के लिए सहायक पढ़ी जाती है' : 'इसलिए वाहन की जाँच की जाती है, व्यक्ति कमा न रहा हो तो माता-पिता के माध्यम से भी'}`
    }
    const effect = only
      ? 'so this period is read as supported for a vehicle'
      : 'so a vehicle is checked, including through the parents when the person is not earning'
    return `${GRAHA_NAMES[lord]} ${joinParts(roles)}, ${effect}`
  }, L))

  return lines
}

export function nadiNodeNote(nodeMode?: NodeMode, lang?: EngineLang): string | null {
  if (nodeMode !== 'mean') return null
  return nSay(lang, 'This chart uses mean nodes. Nadi reads Rahu and Ketu as true nodes.', NADI_NODE_NOTE_HI)
}

function foreignLinks(
  planet: NadiYogaPlacement,
  lagna: Rashi,
  grahas: readonly NadiYogaPlacement[],
  twelfthLord: ClassicalGrahaId,
): string[] {
  const links: string[] = []
  const inTwelfth = wholeSignHouseFromLagna(lagna, planet.rashi) === 12
  if (inTwelfth) links.push('sits in the 12th')
  else if (nadiAspectsSign(planet.rashi, planet.id, rashiForHouseFromLagna(lagna, 12))) links.push('aspects the 12th')
  if (planet.id === twelfthLord && !inTwelfth) links.push('is the 12th lord')
  const twelfth = placed(grahas, twelfthLord)
  if (!inTwelfth && twelfth && twelfth.id !== planet.id && meets(planet, twelfth, grahas)) links.push('connects with the 12th lord')
  const rahu = placed(grahas, 'Ra')
  if (rahu && meets(planet, rahu, grahas)) links.push(nadiConjunct(grahas, [planet.id, 'Ra']) ? 'is with Rahu' : 'connects with Rahu')
  return links
}

function lordPhrase(
  planet: NadiYogaPlacement,
  lord: NadiYogaPlacement | null,
  grahas: readonly NadiYogaPlacement[],
  label: string,
): string | null {
  if (!lord) return null
  if (planet.id === lord.id) return `is ${label}`
  if (!meets(planet, lord, grahas)) return null
  return nadiConjunct(grahas, [planet.id, lord.id]) ? `is with ${label}` : `connects with ${label}`
}

function housePhrase(planet: NadiYogaPlacement, lagna: Rashi, house: HouseNumber): string | null {
  const label = house === 1 ? 'the lagna' : `the ${ordinal(house)}`
  if (wholeSignHouseFromLagna(lagna, planet.rashi) === house) return `sits in ${label}`
  if (nadiAspectsSign(planet.rashi, planet.id, rashiForHouseFromLagna(lagna, house))) return `aspects ${label}`
  return null
}

function reachesHouse(planet: NadiYogaPlacement, lagna: Rashi, house: HouseNumber): boolean {
  return housePhrase(planet, lagna, house) !== null
}

function meets(a: NadiYogaPlacement, b: NadiYogaPlacement, grahas: readonly NadiYogaPlacement[]): boolean {
  if (a.id === b.id) return false
  if (nadiConjunct(grahas, [a.id, b.id])) return true
  return nadiAspectsSign(a.rashi, a.id, b.rashi) || nadiAspectsSign(b.rashi, b.id, a.rashi)
}

function periodLines(
  lords: readonly ClassicalGrahaId[],
  because: (lord: ClassicalGrahaId) => string | null,
  L: EngineLang = 'en',
): string[] {
  const periods: { lord: ClassicalGrahaId; which: string }[] = []
  if (lords[0] && lords[1] && lords[0] === lords[1]) periods.push({ lord: lords[0], which: 'mahadasha and antardasha' })
  else {
    if (lords[0]) periods.push({ lord: lords[0], which: 'mahadasha' })
    if (lords[1]) periods.push({ lord: lords[1], which: 'antardasha' })
  }
  return periods.flatMap((period) => {
    const reason = because(period.lord)
    if (!reason) return []
    const verb = period.which.includes(' and ') ? 'are' : 'is'
    if (L === 'hi') return [`${nG(period.lord, 'hi')} की ${PERIOD_HI[period.which] ?? period.which} चल रही है। ${reason}।`]
    return [`The ${period.which} of ${GRAHA_NAMES[period.lord]} ${verb} running. ${reason}.`]
  })
}

function exchangeLord(
  pairs: readonly { a: HouseNumber; b: HouseNumber }[],
  lagna: Rashi,
  lord: ClassicalGrahaId,
): boolean {
  return pairs.some((pair) => signLord(rashiForHouseFromLagna(lagna, pair.a)) === lord || signLord(rashiForHouseFromLagna(lagna, pair.b)) === lord)
}

function strengthPhrase(planet: NadiYogaPlacement | null, lagna: Rashi): string | null {
  if (!planet || dusthanaHouse(planet, lagna)) return null
  const dignity = dignityOf(planet)
  if (dignity === 'exalted') return 'is exalted'
  if (dignity === 'own') return 'is in its own sign'
  if (dignity === 'moolatrikona') return 'is in moolatrikona'
  return null
}

function colorScore(planet: NadiYogaPlacement, lagna: Rashi): number {
  if (dusthanaHouse(planet, lagna)) return 4
  const dignity = dignityOf(planet)
  if (dignity === 'exalted') return 4
  if (dignity === 'own' || dignity === 'moolatrikona') return 3
  return 0
}

function dusthanaHouse(planet: NadiYogaPlacement, lagna: Rashi): HouseNumber | null {
  if (pole(planet) !== 'debilitated') return null
  const house = wholeSignHouseFromLagna(lagna, planet.rashi)
  return house === 6 || house === 8 || house === 12 ? house : null
}

function pole(planet: NadiYogaPlacement): 'exalted' | 'debilitated' | null {
  const dignity = dignityOf(planet)
  return dignity === 'exalted' || dignity === 'debilitated' ? dignity : null
}

function dignityOf(planet: NadiYogaPlacement): string {
  if (planet.dignity) return planet.dignity
  if (planet.id === 'Ra' || planet.id === 'Ke') return 'neutral'
  return getDignity(planet.id, planet.rashi, planet.degree ?? 15)
}

function houseOf(
  grahas: readonly NadiYogaPlacement[],
  lagna: Rashi,
  id: ClassicalGrahaId,
): HouseNumber | null {
  const planet = placed(grahas, id)
  return planet ? wholeSignHouseFromLagna(lagna, planet.rashi) : null
}

function placed(grahas: readonly NadiYogaPlacement[], id: ClassicalGrahaId): NadiYogaPlacement | null {
  return grahas.find((g) => g.id === id) ?? null
}

function parivartana(asc: Rashi, grahas: readonly NadiYogaPlacement[]): { a: HouseNumber; b: HouseNumber }[] {
  const lordHouse = (house: HouseNumber): HouseNumber | null => {
    const lord = signLord(rashiForHouseFromLagna(asc, house))
    const planet = placed(grahas, lord)
    return planet ? wholeSignHouseFromLagna(asc, planet.rashi) : null
  }
  const pairs: { a: HouseNumber; b: HouseNumber }[] = []
  for (let house = 1; house <= 12; house++) {
    const other = lordHouse(house as HouseNumber)
    if (other == null || other === house || house > other) continue
    if (lordHouse(other) === house) pairs.push({ a: house as HouseNumber, b: other })
  }
  return pairs
}

function signLord(sign: Rashi): ClassicalGrahaId {
  return RASHI_LORDS.find((row) => row.number === sign)?.lord ?? 'Su'
}

function unique(ids: readonly ClassicalGrahaId[]): ClassicalGrahaId[] {
  return ids.filter((id, index) => ids.indexOf(id) === index)
}

function houseLabel(house: HouseNumber): string {
  return house === 1 ? 'lagna' : ordinal(house)
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

function joinParts(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? ''
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

function ordinal(n: number): string {
  const teen = n % 100
  if (teen >= 11 && teen <= 13) return `${n}th`
  const last = n % 10
  if (last === 1) return `${n}st`
  if (last === 2) return `${n}nd`
  if (last === 3) return `${n}rd`
  return `${n}th`
}
