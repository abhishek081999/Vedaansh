// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/karakas.ts
//  What each planet and each house stands for in Lal Kitab terms:
//  relatives, body, colour, items, metal and day for planets; the
//  Lal Kitab meaning of each house. Written in our own words from
//  the 1952 edition. Hindi lives in locale/lalKitabFoundation.hi.ts.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import { LK_GRAHA_KARAKA_HI, LK_HOUSE_MEANING_HI } from '@/lib/engine/locale/lalKitabFoundation.hi'
import type { LkGraha, LkHouse } from './types'

export interface LkGrahaKaraka {
  relatives: string
  body: string
  colour: string
  items: string
  metal: string
  day: string
  nature: string
}

export interface LkHouseMeaning {
  title: string
  meaning: string
}

export const LK_GRAHA_KARAKA: Record<LkGraha, LkGrahaKaraka> = {
  Su: { relatives: 'Father, the state, people in authority', body: 'Bones, right eye, heart, vitality', colour: 'Copper red, wheat colour', items: 'Wheat, jaggery, copper', metal: 'Copper', day: 'Sunday', nature: 'Royal and self-respecting; gives status when it is well placed' },
  Mo: { relatives: 'Mother, elderly women of the house', body: 'Mind, left eye, chest, body fluids', colour: 'White', items: 'Milk, rice, silver, water', metal: 'Silver', day: 'Monday', nature: 'Calm and caring; gives peace of mind, wealth from the mother side and long life' },
  Ma: { relatives: 'Brothers, friends who stand by you', body: 'Blood, muscles, courage', colour: 'Red', items: 'Red lentils (masoor), honey, sweets, sindoor', metal: 'Copper', day: 'Tuesday', nature: 'Brave and protective when good; hot-headed and harmful when bad' },
  Me: { relatives: 'Sisters, daughters, father\'s sisters, maternal family', body: 'Speech, nerves, skin, teeth', colour: 'Green', items: 'Green moong, green cloth, bronze', metal: 'Bronze', day: 'Wednesday', nature: 'Quick and clever; takes on the colour of the planets it sits with' },
  Ju: { relatives: 'Grandfather, teachers, elders, the family priest', body: 'Breath, liver, head hair, fat', colour: 'Yellow', items: 'Gold, turmeric, saffron, gram lentils', metal: 'Gold', day: 'Thursday', nature: 'Wise and generous; the planet of air, learning and fortune' },
  Ve: { relatives: 'Wife or husband, household women', body: 'Reproductive health, skin glow, throat', colour: 'Bright white, curd colour', items: 'Curd, ghee, camphor, perfume, cow', metal: 'Silver', day: 'Friday', nature: 'Loving and worldly; rules the home, comfort and the spouse' },
  Sa: { relatives: 'Father\'s brothers, servants, labourers', body: 'Eyes and eyebrows, nails, legs', colour: 'Black, dark blue', items: 'Iron, mustard oil, black urad, almonds', metal: 'Iron', day: 'Saturday', nature: 'Just and slow; gives what has been earned, very hard when bad' },
  Ra: { relatives: 'In-laws, the maternal grandfather', body: 'Brain, sudden illness, fear', colour: 'Blue, smoke grey', items: 'Coconut, barley, coal, radish, lead', metal: 'Lead', day: 'Saturday (with Saturn)', nature: 'Sudden and confusing; gives big gains or big shocks' },
  Ke: { relatives: 'Sons, nephews, maternal uncles', body: 'Spine, joints, feet, ears', colour: 'Black and white, grey', items: 'Sesame, blankets, a dog, two-coloured cloth', metal: 'Mixed metal', day: 'Sunday (with the Sun) and Thursday', nature: 'Detached and travelling; rules sons and movement' },
}

export const LK_HOUSE_MEANING: Record<LkHouse, LkHouseMeaning> = {
  1: { title: 'The throne', meaning: 'The self and the seat of power. Planets here rule the whole chart and show health, status and how the state treats you.' },
  2: { title: 'The temple', meaning: 'Family wealth, the in-laws and the house of worship. What sits here shows stored money and the family name.' },
  3: { title: 'Courage and siblings', meaning: 'Brothers and sisters, effort, short journeys and the courage to act.' },
  4: { title: 'Mother and milk', meaning: 'The mother, peace of mind, land, the home and the flow of water and milk in life.' },
  5: { title: 'Children and learning', meaning: 'Sons and daughters, education, the mind\'s creations and sudden gains.' },
  6: { title: 'Maternal family', meaning: 'Maternal uncles, enemies, disease and debt, and how you deal with them.' },
  7: { title: 'Spouse and partnership', meaning: 'Marriage, partners, trade and the household that grows around them.' },
  8: { title: 'The cremation ground', meaning: 'Death, long illness, hidden matters and sudden trouble. Planets here act through house 2.' },
  9: { title: 'Ancestors and fortune', meaning: 'Forefathers, religion, luck and the base on which the whole chart stands.' },
  10: { title: 'Work and the father\'s name', meaning: 'Career, government and the father\'s standing. It is Saturn\'s house.' },
  11: { title: 'Income', meaning: 'Earnings, gains and elder brothers. What comes in, and how steadily.' },
  12: { title: 'The bed', meaning: 'Sleep, expenses, travel and life abroad, comfort at night and the final rest. It is Rahu\'s house.' },
}

export function lkGrahaKaraka(id: LkGraha, lang: EngineLang = 'en'): LkGrahaKaraka {
  const en = LK_GRAHA_KARAKA[id]
  return lang === 'hi' ? { ...en, ...LK_GRAHA_KARAKA_HI[id] } : en
}

export function lkHouseMeaning(h: LkHouse, lang: EngineLang = 'en'): LkHouseMeaning {
  const en = LK_HOUSE_MEANING[h]
  return lang === 'hi' ? { ...en, ...LK_HOUSE_MEANING_HI[h] } : en
}
