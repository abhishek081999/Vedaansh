// ─────────────────────────────────────────────────────────────
//  src/lib/engine/vaarTeaching.ts
//  Vaar as the ruler of the day: the class teaching on each weekday —
//  how its natives think, what to do / avoid, food and clothing in
//  sync with the day lord, marriage by weekday, and the signs that
//  show which graha a person is carrying when you meet them.
//
//  Frame: vaar is the strongest of the five limbs. Tithi and nakshatra
//  can be lost (kshaya) and yoga may change mid-day, but the day lord
//  rules sunrise to sunrise and sets the atmosphere. Pure — no React / DB.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import {
  PEOPLE_SIGNS_HI,
  VAAR_PRINCIPLES_HI,
  VAAR_TEACHING_HI,
} from '@/lib/engine/locale/vaarTeaching.hi'

/** 0 = Sunday … 6 = Saturday (same as vaarMeta). */
export type VaarIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface VaarTeachingText {
  /** One-line atmosphere of the day */
  essence:     string
  /** How people born on this weekday think and work */
  birthNature: string
  goodFor:     string[]
  avoid:       string[]
  eat:         string[]
  wear:        string[]
  /** What a wedding on this weekday tends to bring */
  marriage:    string
  /** Teaching example or Lal Kitab note for the day */
  example:     string
}

export interface VaarTeaching extends VaarTeachingText {
  vara: VaarIndex
  lord: GrahaId
}

export interface PeopleSign {
  graha: GrahaId
  signs: string
}

const LORDS: Record<VaarIndex, GrahaId> = { 0: 'Su', 1: 'Mo', 2: 'Ma', 3: 'Me', 4: 'Ju', 5: 'Ve', 6: 'Sa' }

export const VAAR_TEACHING_EN: Record<VaarIndex, VaarTeachingText> = {
  0: {
    essence: 'The king’s day — head, command and visibility.',
    birthNature: 'Think from the head: command and authority. Don’t push them into sweaty manual work — even hard work they do in a luxurious style.',
    goodFor: ['Leading, deciding, being seen', 'Things meant to keep your name alive — a portrait, a painting (Sun + Rahu gives fame)'],
    avoid: ['Buying shoes (Sun + Saturn)', 'Electronics, virtual or illusory things (Rahu) — they won’t serve you', 'Starting a job under someone’s rules', 'Shopping for clothes is mixed'],
    eat: ['Sun-supporting food — wheat, jaggery, besan: thepla, jaggery halwa, sheera, samosa', 'Skip fried, oily food and pakoras — that is Saturn’s day', 'Avoid salt and oil heavy food to protect children (5th house)'],
    wear: ['Something shiny and royal — red, velvet, satin, silk; a brooch or cufflinks', 'Straight (band) collar shirts; full trousers even at home', 'No denim or blue'],
    marriage: 'Two kings under one roof — both feel in charge, so cooperation is hard.',
    example: 'Lal Kitab: giving children money for loafing or fried street food on Sunday is a sign of their ruin — Saturn and Ketu fed to the Sun’s child turns them against you. Malls and food courts are fullest on Sunday for this reason.',
  },
  1: {
    essence: 'Healing, nurturing and feeling.',
    birthNature: 'Work from the emotional brain; healers and providers who help people.',
    goodFor: ['Healing and emotional connection', 'Meetings with people who show Sun or Jupiter signs — the work gets done'],
    avoid: ['Rahu things (fast food, gadgets) — over-priced, exaggerated, sold with lies', 'Dealing with someone carrying Ketu — information comes in pieces', 'Someone carrying Saturn signs brings pressure and heavy thinking'],
    eat: ['Light, soothing, milk and rice based food'],
    wear: ['Soft, loose cotton in gentle tones', 'A crystal or pearl that helps your healing — rings and bracelets, as healers wear'],
    marriage: 'Emotional connection.',
    example: 'Moon–Ketu people give information slowly, in bits, months apart — so a Ketu person met on Monday frustrates you.',
  },
  2: {
    essence: 'Action, courage and help without expectation — Mars wants only respect.',
    birthNature: 'Driven by spirit and action; act without overthinking and help everyone, as long as they are honoured.',
    goodFor: ['Physical work, workouts, independent action', 'Helping others'],
    avoid: ['Accounts, lending or borrowing money, auctions', 'Joining a new job — Mars hates following someone else’s rules', 'Property trading — Mars dislikes trade', 'Meeting someone carrying Ketu energy'],
    eat: ['Simple strong food; jaggery and masoor suit Mars'],
    wear: ['Rough gear: heavy boots, cargo pants, waterproof multi-pocket jackets', 'Not formal office wear (Mars clashes with Saturn), no denim'],
    marriage: 'Domination and fights — “bring a bulletproof jacket”.',
    example: 'The job you struggled most in was probably joined on a Tuesday or Sunday.',
  },
  3: {
    essence: 'Logic, organisation, name and business.',
    birthNature: 'Logical; need 2 + 2 = 4 and everything in a spreadsheet before they relax. They clash with Saturday people who say “we’ll see”.',
    goodFor: ['Accounts, data structuring, organising', 'Hiring an accountant or manager', 'Business and relationship remedies', 'Gifting elders (your “Sun”) Mercury things — your name shines'],
    avoid: ['Giving or taking Saturn, Ketu or Mars items — relationships sour and name suffers', 'Dry fruits like almonds (Saturn) as gifts'],
    eat: ['Green moong — as moong dal barfi when giving to others'],
    wear: ['New clothes; bright neon, rainbow, child-like or funky colours — anything that makes you stand out', 'Shoes with lights or golden stripes'],
    marriage: 'Constant logical arguments and explanations.',
    example: 'Companies send calendars, diaries and pens with their name every new year — Mercury gifts keep the name alive. Mars mixed into Mercury spreads a name fast, like fire in a jungle — good or bad.',
  },
  4: {
    essence: 'Wisdom, learning and the big picture.',
    birthNature: 'Think from wisdom and philosophy, not detail; often understood only after their time.',
    goodFor: ['Education and study', 'Broad planning and big decisions'],
    avoid: ['Shaving, haircuts, using blades, washing clothes at home — Saturn on Jupiter’s day', 'Alcohol at a wedding ceremony', 'Starting Mars or Saturn type work — ego swells'],
    eat: ['Besan and turmeric — besan laddu'],
    wear: ['Loose, plain cotton — gurus accept no bondage, tight clothes narrow thinking', 'No multi-coloured, heavily stitched clothes or jeans'],
    marriage: 'Good for wisdom, poor for intimacy.',
    example: 'Turmeric on the chest or shoulders of someone lacking confidence is a Jupiter remedy.',
  },
  5: {
    essence: 'Grace, relationships and lineage.',
    birthNature: 'Work through genetics and lineage — grace and class come naturally.',
    goodFor: ['Weddings — the best day', 'Relationships and self-care', 'Gifting good shoes or clothes to bring grace'],
    avoid: ['Ketu dressing — half sleeves, checks, half sandals, shirt half out', 'Saturn dressing — blue denim', 'Results of an ungraceful Friday land on money, children and lineage'],
    eat: ['Venus sweets such as jalebi'],
    wear: ['Loose, plain, graceful clothes; perfume; clean bedsheets'],
    marriage: 'The best weekday for marriage.',
    example: 'A contractor arrived on a Friday with a centre parting (Saturn), a broken hand, sandals and a half-sleeve check shirt (Ketu) — Ketu on Venus’s day. He was given besan laddu on the spot and no contract by evening.',
  },
  6: {
    essence: 'Service, pressure and endurance.',
    birthNature: 'Slow and steady — take their time and say “we’ll see”.',
    goodFor: ['Service, seva and routine work', 'Distributing bread pakora or kadhi-chawal'],
    avoid: ['Buying anything new — it ends up as junk', 'Shaving', 'Going out in the evening, parties and celebrations (Saturn + Ketu time) — attend briefly if you must'],
    eat: ['Fried, oily food is fine if your health and Saturn are good — urad dal vada', 'If Saturn troubles you, keep food simple'],
    wear: ['Tight is fine — denim, leather jackets, no-iron, low-maintenance clothes'],
    marriage: 'Not taught as a wedding day.',
    example: 'Saturn has no time for high-maintenance clothes — it serves others. Kings have time for velvet and dry cleaning.',
  },
}

/** Signs that show which graha a person is carrying when you meet them. */
export const PEOPLE_SIGNS_EN: PeopleSign[] = [
  { graha: 'Su', signs: 'Touches the forehead; royal, shiny dress.' },
  { graha: 'Ju', signs: 'Rubs the stomach; yellow or orange clothes.' },
  { graha: 'Sa', signs: 'Shakes the leg, keeps fixing shoes, black clothes, sits over tea; centre parting.' },
  { graha: 'Ke', signs: 'Uncombed hair, shirt half out, check or contrast clothes, half sleeves, sandals, long nails; eating noodles, pizza or fermented food. Gives incomplete information.' },
  { graha: 'Ra', signs: 'Very diplomatic and smiling; doubles of everything — two phones, two watches, pocket inside a pocket; repeats in two languages; exaggerates; fake or borrowed profile photo.' },
]

export const VAAR_PRINCIPLES_EN: string[] = [
  'Vaar is the strongest limb: it rules sunrise to sunrise. In a muhurta you may drop other limbs, never the vaar.',
  'Vaar sets the atmosphere, tithi shows how you carry the journey, yoga decides how you feel on arrival.',
  'Align daily actions — what you eat, wear, buy and start — with the day lord; most daily friction comes from fighting it.',
  'Read people you meet: which graha they carry, set against the day lord, tells you how the meeting will go.',
  'Before any remedy, be clear on the objective and specific about the item — and think through its reaction.',
  'Remedies must be practical and socially acceptable — moong dal barfi, not raw moong, for relatives.',
]

export function getVaarTeaching(varaNumber: number, lang: EngineLang = 'en'): VaarTeaching {
  const vara = (((Math.floor(varaNumber) % 7) + 7) % 7) as VaarIndex
  const text = lang === 'hi' ? VAAR_TEACHING_HI[vara] : VAAR_TEACHING_EN[vara]
  return { ...text, vara, lord: LORDS[vara] }
}

export function listPeopleSigns(lang: EngineLang = 'en'): PeopleSign[] {
  return lang === 'hi' ? PEOPLE_SIGNS_HI : PEOPLE_SIGNS_EN
}

export function listVaarPrinciples(lang: EngineLang = 'en'): string[] {
  return lang === 'hi' ? VAAR_PRINCIPLES_HI : VAAR_PRINCIPLES_EN
}
