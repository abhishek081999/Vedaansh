// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/dashaReading.ts
//  Six-step reading of a Jaimini sign dasha:
//  sign, chara karaka, lord, argala, pada, rashi drishti.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { calcArudha } from '../arudhas'
import { getRashiDrishti } from './aspects'
import { evaluateArgala, evaluateReverseArgala, type ArgalaGraha } from './argala'
import { judgmentSteps } from './judgment'
import { resolveSignLord } from './trinity'
import { jG, jLang, jOrd, jR, say, type EngineLang } from '../locale/jaiminiLang'
import { DASHA_HOUSE_HI, DASHA_THEME_HI, DASHA_TITLES_HI } from '../locale/jaiminiDasha.hi'

export interface DashaReadingStep {
  title: string
  text: string
}

export interface DashaReading {
  sign: Rashi
  signName: string
  lord: GrahaId
  lordName: string
  lordSign: Rashi
  lordSignName: string
  lordKaraka: string | null
  pada: Rashi
  padaName: string
  aspects: Rashi[]
  reverseArgala: boolean
  steps: DashaReadingStep[]
  agreements: string[]
}

const SIGN_THEME: Record<Rashi, string> = {
  1: 'The period grows the personality and opens a new beginning.',
  2: 'The period works through material stability and what the person values.',
  3: 'The period works through communication, siblings, and the network.',
  4: 'The period works through emotional karma.',
  5: 'The period works through authority, recognition, and ego.',
  6: 'The period works through service, health, and cleaning up daily life.',
  7: 'The period works through relationships, balance, and other people.',
  8: 'Scorpio dissolves an old identity and rebuilds from that. Hidden fear, secrecy, and sexuality come forward.',
  9: 'Sagittarius changes the direction of life. Home, vehicles, work, and marriage can all shift.',
  10: 'Capricorn builds or tests structure: duty, career, and responsibility.',
  11: 'Aquarius changes the circle and the surroundings. Desire loosens.',
  12: 'Pisces humbles the ego repeatedly. The aim is dissolution of that ego, not punishment.',
}

const HOUSE_DOMAIN = [
  '',
  'the body and the self',
  'family resources and speech',
  'courage and siblings',
  'home and the mother',
  'children and intelligence',
  'obstacles, debt, and service',
  'marriage and partners',
  'sudden change and longevity',
  'the father, teachers, and long travel',
  'career and public work',
  'gains and income',
  'loss, foreign places, and release',
]

function houseFrom(seed: Rashi, house: number): number {
  return ((seed - 1 + house - 1) % 12) + 1
}

function distance(from: Rashi, to: Rashi): number {
  return ((to - from + 12) % 12) + 1
}

export function readJaiminiDasha(input: {
  sign: Rashi
  grahas: ArgalaGraha[]
  roleOf: Partial<Record<GrahaId, string | null>>
  applyPadaExceptions?: boolean
  lagna?: Rashi
  d9?: Array<{ id: GrahaId; rashi: Rashi }>
  vimshottariLord?: string | null
  yoginiLord?: string | null
  /** K.N. Rao forward when true. Omit when the sequence direction is not Chara. */
  sequenceForward?: boolean
  antarSign?: Rashi
  upapada?: Rashi
  karakamsha?: Rashi
  lagnaDegree?: number
  lang?: EngineLang
}): DashaReading {
  const L = jLang(input.lang)
  const g = (id: GrahaId) => (L === 'hi' ? jG(id, L) : GRAHA_NAMES[id])
  const r = (sign: Rashi) => (L === 'hi' ? jR(sign, L) : RASHI_NAMES[sign])
  const { sign, grahas } = input
  const lord = resolveSignLord(sign, grahas)
  const lordGraha = grahas.find(g => g.id === lord)
  const lordSign = (lordGraha?.rashi ?? sign) as Rashi
  const lordKaraka = input.roleOf[lord] ?? null
  const occupants = grahas.filter(g => g.rashi === sign)
  const occupantText = occupants.length
    ? occupants.map(planet => {
        const role = input.roleOf[planet.id]
        return role ? `${g(planet.id)} (${role})` : g(planet.id)
      }).join(', ')
    : say(L, 'no planet', 'कोई ग्रह नहीं')
  const argala = evaluateArgala(sign, grahas)
  const reverse = evaluateReverseArgala(sign, grahas)
  const pada = calcArudha(sign, grahas, { applyExceptions: input.applyPadaExceptions ?? false })
  const aspects = getRashiDrishti(sign)
  const open = argala.filter(s => s.isArgalaActive)
  const blocked = argala.filter(s => s.occupants.length > 0 && !s.isArgalaActive)

  const argalaText = open.length
    ? say(L, `Open argala: ${open.map(s => `${s.label} (${s.id})`).join(', ')}.`, `खुली अर्गला: ${open.map(s => `${s.label} (${s.id})`).join(', ')}।`)
    : say(L, 'No argala is open.', 'कोई अर्गला खुली नहीं है।')
  const blockedText = blocked.length
    ? say(L, ` Blocked: ${blocked.map(s => s.label).join(', ')}.`, ` रुकी: ${blocked.map(s => s.label).join(', ')}।`)
    : ''
  const reverseText = reverse.active
    ? say(L, ' Three or more difficult planets in the 3rd form reverse argala, which is not obstructed.', ' तीसरे भाव में तीन या अधिक कठिन ग्रह उलटी अर्गला बनाते हैं, जो रुकती नहीं।')
    : ''
  const natalHouse = input.lagna ? distance(input.lagna, sign) : null
  const twelfthNote = natalHouse === 12
    ? say(L, ' This sign is the 12th from Lagna, so argala on it times 12th-house results.', ' यह राशि लग्न से बारहवीं है, इसलिए इस पर अर्गला बारहवें भाव के फल का समय बताती है।')
    : ''

  const aspecting = grahas.filter(g => aspects.includes(g.rashi))
  const aspectingText = aspecting.length
    ? aspecting.map(planet => {
        const role = input.roleOf[planet.id]
        return role
          ? say(L, `${g(planet.id)} (${role}) in ${r(planet.rashi)}`, `${r(planet.rashi)} में ${g(planet.id)} (${role})`)
          : say(L, `${g(planet.id)} in ${r(planet.rashi)}`, `${r(planet.rashi)} में ${g(planet.id)}`)
      }).join(', ')
    : say(L, 'no planet', 'कोई ग्रह नहीं')

  const kendraText = [4, 7, 10].map(house => {
    const rashi = houseFrom(sign, house) as Rashi
    const who = grahas.filter(planet => planet.rashi === rashi).map(planet => g(planet.id))
    return `${jOrd(house, L)} ${r(rashi)}${who.length ? ` (${who.join(', ')})` : ''}`
  }).join(', ')

  const d9Here = (input.d9 ?? []).filter(g => g.rashi === sign)
  const akId = (Object.entries(input.roleOf).find(([, role]) => role === 'AK')?.[0] ?? null) as GrahaId | null
  const gkActive = lordKaraka === 'GK' || occupants.some(g => input.roleOf[g.id] === 'GK')
  const antarLordRole = input.antarSign ? input.roleOf[resolveSignLord(input.antarSign, grahas)] : null
  const antarHasAk = antarLordRole === 'AK' || grahas.some(g => g.rashi === input.antarSign && input.roleOf[g.id] === 'AK')
  const akActive = lordKaraka === 'AK' || occupants.some(g => input.roleOf[g.id] === 'AK') || antarHasAk
  const akPlanet = akId ? grahas.find(g => g.id === akId) : undefined
  const akHouse = input.lagna && akPlanet ? distance(input.lagna, akPlanet.rashi) : null

  const theme = L === 'hi' ? DASHA_THEME_HI[sign] : SIGN_THEME[sign]
  const natalBit = natalHouse
    ? say(L, ` From the birth lagna it is the ${jOrd(natalHouse, L)} house: ${HOUSE_DOMAIN[natalHouse]}.`, ` जन्म लग्न से यह ${jOrd(natalHouse, L)} भाव है: ${DASHA_HOUSE_HI[natalHouse]}।`)
    : ''
  const lordPlace = distance(sign, lordSign) === 1
    ? say(L, 'the same sign', 'वही राशि')
    : say(L, `${distance(sign, lordSign)} signs from the dasha sign`, `दशा राशि से ${distance(sign, lordSign)} राशि`)
  const drishtiSigns = aspects.map(signId => r(signId)).join(', ')

  const steps: DashaReadingStep[] = [
    {
      title: say(L, 'Dasha sign', DASHA_TITLES_HI.sign),
      text: say(L, `${r(sign)} is the temporary lagna for this period. It holds ${occupantText}. ${theme}${natalBit}`, `${r(sign)} इस काल का अस्थायी लग्न है। इसमें ${occupantText} है। ${theme}${natalBit}`),
    },
    {
      title: say(L, 'Chara karaka', DASHA_TITLES_HI.karaka),
      text: lordKaraka
        ? say(L, `The sign lord ${g(lord)} carries ${lordKaraka}, so that life area is on stage with the sign.`, `राशि स्वामी ${g(lord)} ${lordKaraka} रखता है, इसलिए वह जीवन-क्षेत्र राशि के साथ मंच पर है।`)
        : say(L, `The sign lord ${g(lord)} has no chara-karaka (natural indicator) role. Use the karakas among the occupants.`, `राशि स्वामी ${g(lord)} का कोई चर-कारक नहीं है। बैठे ग्रहों के कारकों का उपयोग करें।`),
    },
    {
      title: say(L, 'Sign lord', DASHA_TITLES_HI.lord),
      text: say(L, `${g(lord)} sits in ${r(lordSign)}, ${lordPlace}.`, `${g(lord)} ${r(lordSign)} में है, ${lordPlace}।`),
    },
    {
      title: say(L, 'Argala', DASHA_TITLES_HI.argala),
      text: `${argalaText}${blockedText}${reverseText}${twelfthNote}`,
    },
    {
      title: say(L, 'Pada', DASHA_TITLES_HI.pada),
      text: say(L, `The arudha of ${r(sign)} is ${r(pada)}. Events of this dasha show up through that sign.`, `${r(sign)} का आरूढ़ ${r(pada)} है। इस दशा की घटनाएँ उस राशि से दिखती हैं।`),
    },
    {
      title: say(L, 'Rashi drishti', DASHA_TITLES_HI.drishti),
      text: say(L, `${r(sign)} is in rashi drishti with ${drishtiSigns}. Influencing planets: ${aspectingText}.`, `${r(sign)} की राशि दृष्टि ${drishtiSigns} पर है। प्रभाव डालने वाले ग्रह: ${aspectingText}।`),
    },
    {
      title: say(L, 'Houses from the dasha sign', DASHA_TITLES_HI.houses),
      text: say(L, `Taken as lagna, the kendras (angular houses: 1, 4, 7, 10) that this period can push are the ${kendraText}.`, `लग्न मानें तो इस काल के धकेले जा सकने वाले केंद्र (1, 4, 7, 10) ये हैं: ${kendraText}।`),
    },
  ]

  if (input.d9) {
    steps.push({
      title: say(L, 'Navamsha', DASHA_TITLES_HI.navamsha),
      text: d9Here.length
        ? say(L, `In D9 this sign holds ${d9Here.map(planet => g(planet.id)).join(', ')}.`, `डी9 में इस राशि में ${d9Here.map(planet => g(planet.id)).join(', ')} है।`)
        : say(L, 'In D9 this sign holds no classical planet.', 'डी9 में इस राशि में कोई पारंपरिक ग्रह नहीं है।'),
    })
  }

  if (input.vimshottariLord || input.yoginiLord) {
    const bits = [
      input.vimshottariLord ? say(L, `Vimshottari mahadasha is ${input.vimshottariLord}`, `विंशोत्तरी महादशा ${input.vimshottariLord} है`) : null,
      input.yoginiLord ? say(L, `Yogini mahadasha is ${input.yoginiLord}`, `योगिनी महादशा ${input.yoginiLord} है`) : null,
    ].filter(Boolean)
    steps.push({
      title: say(L, 'Cross-check', DASHA_TITLES_HI.cross),
      text: say(L, `${bits.join(', ')}. Those planetary periods are the trigger inside this sign period. A major event is stronger when they name the same area.`, `${bits.join(', ')}। वे ग्रह-काल इस राशि-काल के भीतर ट्रिगर हैं। बड़ी घटना तब बलवान होती है जब वे एक ही क्षेत्र बताएँ।`),
    })
  }

  if (input.sequenceForward === false) {
    steps.push({
      title: say(L, 'Indirect sequence', DASHA_TITLES_HI.indirect),
      text: say(L, 'This Chara sequence runs backward. That settles an older karmic account before the next step. The direction alone does not make the period negative. Read argala, aspects, and karakas (natural indicator) with it.', 'यह चर क्रम उलटा चलता है। वह अगले कदम से पहले पुराना कर्म-हिसाब निपटाता है। केवल दिशा काल को नकारात्मक नहीं बनाती। अर्गला, दृष्टि और कारकों को साथ पढ़ें।'),
    })
  }

  if (gkActive) {
    steps.push({
      title: say(L, 'Gnatikaraka', DASHA_TITLES_HI.gk),
      text: say(L, 'Gnatikaraka is active. The period pays a karmic debt. Effort is made, and the result still arrives as destined.', 'ज्ञातिकारक सक्रिय है। काल कर्म-ऋण चुकाता है। प्रयास होता है, और फल फिर भी नियति के अनुसार आता है।'),
    })
  }

  if (akActive) {
    const struggle = akHouse == null
      ? ''
      : [6, 8, 12].includes(akHouse)
        ? say(L, ' Atmakaraka sits in a dusthana (difficult houses: 6, 8, 12) from Lagna, so the gain comes with more struggle.', ' आत्मकारक लग्न से दुःस्थान (6, 8, 12) में है, इसलिए लाभ अधिक संघर्ष के साथ आता है।')
        : [1, 4, 5, 7, 9, 10, 11].includes(akHouse)
          ? say(L, ' Atmakaraka sits in a kendra (angular houses: 1, 4, 7, 10), trikona (trine houses: 1, 5, 9), or the 11th from Lagna, so the gain comes with less struggle.', ' आत्मकारक लग्न से केंद्र (1, 4, 7, 10), त्रिकोण (1, 5, 9) या ग्यारहवें भाव में है, इसलिए लाभ कम संघर्ष के साथ आता है।')
          : ''
    steps.push({
      title: say(L, 'Atmakaraka', DASHA_TITLES_HI.ak),
      text: say(L, `Atmakaraka is active, so this period carries at least one life-changing gain.${struggle} The same period is the soul's pain zone: unfinished karma surfaces as crisis, including when Atmakaraka is only the antardasha inside a stronger mahadasha.`, `आत्मकारक सक्रिय है, इसलिए इस काल में कम से कम एक जीवन बदलने वाला लाभ है।${struggle} यही काल आत्मा का पीड़ा-क्षेत्र है: अधूरा कर्म संकट बनकर आता है, तब भी जब आत्मकारक केवल बलवान महादशा के भीतर अंतर्दशा हो।`),
    })
  }

  steps.push(...judgmentSteps({
    sign,
    antarSign: input.antarSign,
    grahas,
    roleOf: input.roleOf,
    lagna: input.lagna,
    lagnaDegree: input.lagnaDegree,
    upapada: input.upapada,
    karakamsha: input.karakamsha,
    lang: L,
  }))

  const agreements: string[] = []
  const occupantRoles = new Set(occupants.map(g => input.roleOf[g.id]).filter(Boolean) as string[])
  const wealthOpen = open.some(s => s.id === '2nd')
  const gainsOpen = open.some(s => s.id === '11th')
  const homeOpen = open.some(s => s.id === '4th')
  const knowledgeOpen = open.some(s => s.id === '5th')
  const seventh = houseFrom(sign, 7) as Rashi
  const seventhOccupied = grahas.some(g => g.rashi === seventh)
  const dkActive = lordKaraka === 'DK' || occupantRoles.has('DK')
  const venusActive = lord === 'Ve' || occupants.some(g => g.id === 'Ve')

  if ((lordKaraka === 'AmK' || occupantRoles.has('AmK')) && (gainsOpen || wealthOpen)) {
    agreements.push(say(L, 'Career agrees: Amatyakaraka is involved and wealth or gains argala is open.', 'करियर सहमत है: अमात्यकारक लगा है और धन या लाभ की अर्गला खुली है।'))
  }
  if (dkActive && (seventhOccupied || venusActive)) {
    agreements.push(say(L, 'Partnership agrees: Darakaraka is active together with the 7th or Venus.', 'साझेदारी सहमत है: दारकारक सातवें भाव या शुक्र के साथ सक्रिय है।'))
  }
  if (homeOpen && (lordKaraka === 'MK' || occupantRoles.has('MK'))) {
    agreements.push(say(L, 'Home agrees: Matrukaraka is involved and 4th-house argala is open.', 'घर सहमत है: मातृकारक लगा है और चौथे भाव की अर्गला खुली है।'))
  }
  if (knowledgeOpen && (lordKaraka === 'PK' || occupantRoles.has('PK'))) {
    agreements.push(say(L, 'Intelligence agrees: the fifth karaka (natural indicator) is involved and 5th-house argala is open.', 'बुद्धि सहमत है: पाँचवाँ कारक लगा है और पाँचवें भाव की अर्गला खुली है।'))
  }
  if (reverse.active && (lordKaraka === 'GK' || occupantRoles.has('GK'))) {
    agreements.push(say(L, 'Struggle agrees: Gnatikaraka is involved and the 3rd holds unblockable difficult planet argala.', 'संघर्ष सहमत है: ज्ञातिकारक लगा है और तीसरे भाव में न रुकने वाली कठिन-ग्रह अर्गला है।'))
  }

  return {
    sign,
    signName: r(sign),
    lord,
    lordName: g(lord),
    lordSign,
    lordSignName: r(lordSign),
    lordKaraka,
    pada,
    padaName: r(pada),
    aspects,
    reverseArgala: reverse.active,
    steps,
    agreements,
  }
}
