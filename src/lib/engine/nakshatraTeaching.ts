// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraTeaching.ts
//  Nakshatra as thought: the class teaching on the Moon's nakshatra,
//  grouped by its lord (three nakshatras each). Nakshatra is the air
//  element of the panchang — it brings the thoughts that drive a life,
//  and it is the "passport" of the realm a soul came from.
//
//  Remedies come from the graha that can support the lord, not the
//  lord itself. Pure — no React / DB.
// ─────────────────────────────────────────────────────────────

import { NAKSHATRA_LORDS, NAKSHATRA_NAMES } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { NAKSHATRA_PRINCIPLES_HI, NAKSHATRA_TEACHING_HI } from '@/lib/engine/locale/nakshatraTeaching.hi'

export type NakshatraLord = 'Ke' | 'Ve' | 'Su' | 'Mo' | 'Ma' | 'Ra' | 'Ju' | 'Sa' | 'Me'

export interface NakshatraTeachingText {
  /** Realm the soul comes from */
  realm:    string
  /** How thoughts arrive for this group */
  essence:  string
  nature:   string
  shadow:   string
  /** Which graha helps, and why */
  helper:   string
  remedies: string[]
}

export interface NakshatraTeaching extends NakshatraTeachingText {
  lord:       NakshatraLord
  /** 0-based indexes of the three nakshatras in this group */
  nakshatras: number[]
}

export const NAKSHATRA_TEACHING_EN: Record<NakshatraLord, NakshatraTeachingText> = {
  Ke: {
    realm: 'Pitru-loka — restless souls returning to finish what was left',
    essence: 'Thoughts come from the sixth sense, not the five.',
    nature: 'Born to complete unfinished karma or settle an old account in the same family. Healers at three levels: the body (Ashwini), worldly life (Magha) and the spirit (Mula).',
    shadow: 'Restless and anxious until the purpose is found; if there is no tension today, something feels forgotten. Hears and is told, yet does what the heart already decided — called stubborn.',
    helper: 'The five elements — the senses that are "missing" have to be given back.',
    remedies: [
      'The logic of Mula shanti: water and soil gathered from many places, so the five senses return. Bring water and earth from good places and good people.',
      'A seven-metal (or five-metal) bangle or ring — the elements Ketu lacks.',
      'Multigrain flour in daily food.',
    ],
  },
  Ve: {
    realm: 'Shukra-loka — the realm of creation, food and relationships',
    essence: 'Thoughts are about relationships, food and how things are seen.',
    nature: 'See the good in everyone, like Shukracharya who chose to guide the daityas. Food, relationships and outlook matter most; they say things in an intricate way.',
    shadow: 'Communication — the meaning is lost in the telling. Ego and fault-finding destroy both money and relationships.',
    helper: 'Mercury — Venus’s trouble is communication.',
    remedies: [
      'Emerald set in a silver chain — Mercury’s communication brought to the emotional level of the Moon.',
      'Plant amla trees.',
      'Give flowers to your spouse without an occasion; once a choice is made, stop finding faults in it.',
    ],
  },
  Su: {
    realm: 'Surya-loka — the administrative realm',
    essence: 'Thoughts come as precise orders and vision.',
    nature: 'Born to show others the way and to manage — or sent down after a mistake in the Sun’s realm, which can bring trouble from government.',
    shadow: 'Thoughts arrive fierce and full of ego — “how dare they not obey?”',
    helper: 'Moon (and Jupiter) — the Sun’s raw energy is usable only when softened.',
    remedies: [
      'Offer water to the Sun — the Moon makes the Sun’s energy usable.',
      'Donate wheat or atta halwa; food is the Moon’s domain.',
      'A ruby set in silver; speak gently even when giving orders.',
    ],
  },
  Mo: {
    realm: 'Chandra-loka — the realm of resources and nourishment',
    essence: 'Thoughts are about conserving, nourishing and emotional support.',
    nature: 'Use resources well, support others emotionally and heal at many levels.',
    shadow: 'Desire, especially around food, runs ahead of them.',
    helper: 'Saturn or Jupiter — only the elder or the servant can teach the Moon its value.',
    remedies: [
      'Conserve: don’t waste water, food or emotions; keep the water tank clean.',
      'Learn to eat — one dish, seated, unhurried, no TV, and not alone.',
      'Fasting and a little scarcity (Saturn), or citrine on the index finger and turmeric milk (Jupiter); talk with the elders at a temple.',
    ],
  },
  Ma: {
    realm: 'Mangal-loka — selfless strength',
    essence: 'Thoughts come as action and strength used for others.',
    nature: 'Great strength without ego; they work for others.',
    shadow: '“I, me, mine” — the moment strength turns to pride, Mars takes it back.',
    helper: 'Saturn — service without ego. Never Jupiter’s stone for this group.',
    remedies: [
      'Hanuman — sindoor, chola, Hanuman Chalisa, Sundarkand: strength with no ego.',
      'Remember “akinchit” — nothing here is mine.',
      'Blue sapphire (Saturn’s stone); Saturn’s dasha tends to go well, Jupiter’s badly.',
    ],
  },
  Ra: {
    realm: 'A realm of unfulfilled desire — “a hundred go so that one is born”',
    essence: 'Thoughts are many people’s desires carried in one body.',
    nature: 'Want one thing, get it, and run to the next; life changes many times.',
    shadow: 'Hunger that never ends, no grounding, no contentment even with everything.',
    helper: 'Moon (foundation) or Jupiter (contentment).',
    remedies: [
      'Each Amavasya light a lamp outside the house and give clothes or food — many souls are freed through you.',
      'Citrine (not yellow sapphire) or a turmeric bath, as before a wedding.',
      'Build a foundation: learn something under a guru, without shortcuts or pirated knowledge; take your mother’s blessings.',
    ],
  },
  Ju: {
    realm: 'Satya-loka — a realm of light air and honesty',
    essence: 'Thoughts are honest, trusting and wise.',
    nature: 'Happy to see others grow; give good advice even to an enemy.',
    shadow: 'Easily fooled, can’t keep anything in the stomach, trust too fast. Breath and kapha trouble in earth’s heavier air.',
    helper: 'Rahu for the body (breath), Saturn for protection from deceit.',
    remedies: [
      'For breath and kapha trouble, the class gives hessonite (gomed) in silver — Rahu rules air; alongside medical care.',
      'When deceived: blue sapphire, and Saturn’s habit — say “I know nothing”, keep plans to yourself.',
      'A tilak of bhasma; avoid business partnerships.',
    ],
  },
  Sa: {
    realm: 'Karma storehouses — what you did for society is kept here',
    essence: 'Thoughts carry the weight of past deeds for others.',
    nature: 'Pushya is called the best nakshatra because good deeds for society bloom there. Big people think for many, and carry big problems.',
    shadow: 'Gloom, underestimating oneself; the frustration you caused others (even a badly parked car) is stored and returned.',
    helper: 'Mars for the body (warmth), Moon for the emotions.',
    remedies: [
      'Give necessity, not luxury — water, shoes, clothes.',
      'Physical trouble: Mars — oil, lamps, discipline, coral, keep warm.',
      'Emotional gloom: Moon — serve others, widen your circle, sit with cheerful people, read joyful poets; pearl bhasma in milk.',
    ],
  },
  Me: {
    realm: 'The binding realm — Mercury ties you to earth and relationships',
    essence: 'Thoughts are about ties, order and who said what.',
    nature: 'Hold relationships and the body together; liberation itself means being freed from Mercury.',
    shadow: 'Nerves and the body; fights of “he didn’t ask me, she didn’t give me”.',
    helper: 'Saturn for the body, Jupiter for the emotions.',
    remedies: [
      'Physical / nerve trouble: Saturn — long-keeping medicines like chyawanprash, amla, giloy.',
      'Emotional fights: Jupiter — citrine, books, wisdom that lets small things go.',
      'Tulsi and Vishnu Sahasranama.',
    ],
  },
}

export const NAKSHATRA_PRINCIPLES_EN: string[] = [
  'Nakshatra is the air element: it brings thoughts, and one thought can turn a life around.',
  'The Moon’s nakshatra governs thinking for life; dashas change the timing, not the way a person thinks. The lagna nakshatra matters less.',
  'Your nakshatra is a passport — the realm you came from, either to finish work or after a mistake there.',
  'A remedy rarely uses the lord itself; it uses the graha that can support it.',
  'Stones are chosen from the Moon nakshatra, not the running dasha. Pick clear, shining stones without spots — light has to pass through.',
  'Try every remedy on yourself first.',
  'A sixth limb, nadika (ghati), decides the final outcome of a muhurta; never compromise on it.',
]

/** Teaching for a 0-based nakshatra index (Ashwini = 0). */
export function getNakshatraTeaching(nakshatraIndex: number, lang: EngineLang = 'en'): NakshatraTeaching | null {
  const i = Math.floor(nakshatraIndex)
  if (i < 0 || i >= NAKSHATRA_NAMES.length) return null
  const lord = NAKSHATRA_LORDS[i] as NakshatraLord
  const table = lang === 'hi' ? NAKSHATRA_TEACHING_HI : NAKSHATRA_TEACHING_EN
  const text = table[lord]
  if (!text) return null
  const nakshatras = NAKSHATRA_LORDS.map((l, idx) => (l === lord ? idx : -1)).filter((idx) => idx >= 0 && idx < 27)
  return { ...text, lord, nakshatras }
}

export function listNakshatraPrinciples(lang: EngineLang = 'en'): string[] {
  return lang === 'hi' ? NAKSHATRA_PRINCIPLES_HI : NAKSHATRA_PRINCIPLES_EN
}
