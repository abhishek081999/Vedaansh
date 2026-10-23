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

function ordinal(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

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
}): DashaReading {
  const { sign, grahas } = input
  const lord = resolveSignLord(sign, grahas)
  const lordGraha = grahas.find(g => g.id === lord)
  const lordSign = (lordGraha?.rashi ?? sign) as Rashi
  const lordKaraka = input.roleOf[lord] ?? null
  const occupants = grahas.filter(g => g.rashi === sign)
  const occupantText = occupants.length
    ? occupants.map(g => {
        const role = input.roleOf[g.id]
        return role ? `${GRAHA_NAMES[g.id]} (${role})` : GRAHA_NAMES[g.id]
      }).join(', ')
    : 'no planet'
  const argala = evaluateArgala(sign, grahas)
  const reverse = evaluateReverseArgala(sign, grahas)
  const pada = calcArudha(sign, grahas, { applyExceptions: input.applyPadaExceptions ?? false })
  const aspects = getRashiDrishti(sign)
  const open = argala.filter(s => s.isArgalaActive)
  const blocked = argala.filter(s => s.occupants.length > 0 && !s.isArgalaActive)

  const argalaText = open.length
    ? `Open argala: ${open.map(s => `${s.label} (${s.id})`).join(', ')}.`
    : 'No argala is open.'
  const blockedText = blocked.length
    ? ` Blocked: ${blocked.map(s => s.label).join(', ')}.`
    : ''
  const reverseText = reverse.active
    ? ' Three or more malefics in the 3rd form reverse argala, which is not obstructed.'
    : ''
  const natalHouse = input.lagna ? distance(input.lagna, sign) : null
  const twelfthNote = natalHouse === 12
    ? ' This sign is the 12th from Lagna, so argala on it times 12th-house results.'
    : ''

  const aspecting = grahas.filter(g => aspects.includes(g.rashi))
  const aspectingText = aspecting.length
    ? aspecting.map(g => {
        const role = input.roleOf[g.id]
        return role ? `${GRAHA_NAMES[g.id]} (${role}) in ${RASHI_NAMES[g.rashi]}` : `${GRAHA_NAMES[g.id]} in ${RASHI_NAMES[g.rashi]}`
      }).join(', ')
    : 'no planet'

  const kendraText = [4, 7, 10].map(house => {
    const rashi = houseFrom(sign, house) as Rashi
    const who = grahas.filter(g => g.rashi === rashi).map(g => GRAHA_NAMES[g.id])
    return `${ordinal(house)} ${RASHI_NAMES[rashi]}${who.length ? ` (${who.join(', ')})` : ''}`
  }).join(', ')

  const d9Here = (input.d9 ?? []).filter(g => g.rashi === sign)
  const akId = (Object.entries(input.roleOf).find(([, role]) => role === 'AK')?.[0] ?? null) as GrahaId | null
  const gkActive = lordKaraka === 'GK' || occupants.some(g => input.roleOf[g.id] === 'GK')
  const antarLordRole = input.antarSign ? input.roleOf[resolveSignLord(input.antarSign, grahas)] : null
  const antarHasAk = antarLordRole === 'AK' || grahas.some(g => g.rashi === input.antarSign && input.roleOf[g.id] === 'AK')
  const akActive = lordKaraka === 'AK' || occupants.some(g => input.roleOf[g.id] === 'AK') || antarHasAk
  const akPlanet = akId ? grahas.find(g => g.id === akId) : undefined
  const akHouse = input.lagna && akPlanet ? distance(input.lagna, akPlanet.rashi) : null

  const steps: DashaReadingStep[] = [
    {
      title: 'Dasha sign',
      text: `${RASHI_NAMES[sign]} is the temporary lagna for this period. It holds ${occupantText}. ${SIGN_THEME[sign]}${natalHouse ? ` From the birth lagna it is the ${ordinal(natalHouse)} house: ${HOUSE_DOMAIN[natalHouse]}.` : ''}`,
    },
    {
      title: 'Chara karaka',
      text: lordKaraka
        ? `The sign lord ${GRAHA_NAMES[lord]} carries ${lordKaraka}, so that life area is on stage with the sign.`
        : `The sign lord ${GRAHA_NAMES[lord]} has no chara-karaka role. Use the karakas among the occupants.`,
    },
    {
      title: 'Sign lord',
      text: `${GRAHA_NAMES[lord]} sits in ${RASHI_NAMES[lordSign]}, ${distance(sign, lordSign) === 1 ? 'the same sign' : `${distance(sign, lordSign)} signs from the dasha sign`}.`,
    },
    {
      title: 'Argala',
      text: `${argalaText}${blockedText}${reverseText}${twelfthNote}`,
    },
    {
      title: 'Pada',
      text: `The arudha of ${RASHI_NAMES[sign]} is ${RASHI_NAMES[pada]}. Events of this dasha show up through that sign.`,
    },
    {
      title: 'Rashi drishti',
      text: `${RASHI_NAMES[sign]} is in rashi drishti with ${aspects.map(r => RASHI_NAMES[r]).join(', ')}. Influencing planets: ${aspectingText}.`,
    },
    {
      title: 'Houses from the dasha sign',
      text: `Taken as lagna, the kendras that this period can push are the ${kendraText}.`,
    },
  ]

  if (input.d9) {
    steps.push({
      title: 'Navamsha',
      text: d9Here.length
        ? `In D9 this sign holds ${d9Here.map(g => GRAHA_NAMES[g.id]).join(', ')}.`
        : 'In D9 this sign holds no classical planet.',
    })
  }

  if (input.vimshottariLord || input.yoginiLord) {
    const bits = [
      input.vimshottariLord ? `Vimshottari mahadasha is ${input.vimshottariLord}` : null,
      input.yoginiLord ? `Yogini mahadasha is ${input.yoginiLord}` : null,
    ].filter(Boolean)
    steps.push({
      title: 'Cross-check',
      text: `${bits.join(', ')}. Those planetary periods are the trigger inside this sign period. A major event is stronger when they name the same area.`,
    })
  }

  if (input.sequenceForward === false) {
    steps.push({
      title: 'Indirect sequence',
      text: 'This Chara sequence runs backward. That settles an older karmic account before the next step. The direction alone does not make the period negative. Read argala, aspects, and karakas with it.',
    })
  }

  if (gkActive) {
    steps.push({
      title: 'Gnatikaraka',
      text: 'Gnatikaraka is active. The period pays a karmic debt. Effort is made, and the result still arrives as destined.',
    })
  }

  if (akActive) {
    const struggle = akHouse == null
      ? ''
      : [6, 8, 12].includes(akHouse)
        ? ' Atmakaraka sits in a dusthana from Lagna, so the gain comes with more struggle.'
        : [1, 4, 5, 7, 9, 10, 11].includes(akHouse)
          ? ' Atmakaraka sits in a kendra, trikona, or the 11th from Lagna, so the gain comes with less struggle.'
          : ''
    steps.push({
      title: 'Atmakaraka',
      text: `Atmakaraka is active, so this period carries at least one life-changing gain.${struggle} The same period is the soul's pain zone: unfinished karma surfaces as crisis, including when Atmakaraka is only the antardasha inside a stronger mahadasha.`,
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
    agreements.push('Career agrees: Amatyakaraka is involved and wealth or gains argala is open.')
  }
  if (dkActive && (seventhOccupied || venusActive)) {
    agreements.push('Partnership agrees: Darakaraka is active together with the 7th or Venus.')
  }
  if (homeOpen && (lordKaraka === 'MK' || occupantRoles.has('MK'))) {
    agreements.push('Home agrees: Matrukaraka is involved and 4th-house argala is open.')
  }
  if (knowledgeOpen && (lordKaraka === 'PK' || occupantRoles.has('PK'))) {
    agreements.push('Intelligence agrees: the fifth karaka is involved and 5th-house argala is open.')
  }
  if (reverse.active && (lordKaraka === 'GK' || occupantRoles.has('GK'))) {
    agreements.push('Struggle agrees: Gnatikaraka is involved and the 3rd holds unblockable malefic argala.')
  }

  return {
    sign,
    signName: RASHI_NAMES[sign],
    lord,
    lordName: GRAHA_NAMES[lord],
    lordSign,
    lordSignName: RASHI_NAMES[lordSign],
    lordKaraka,
    pada,
    padaName: RASHI_NAMES[pada],
    aspects,
    reverseArgala: reverse.active,
    steps,
    agreements,
  }
}
