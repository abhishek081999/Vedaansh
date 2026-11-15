// ─────────────────────────────────────────────────────────────
//  src/lib/engine/muhurtaLimbPriority.ts
//  Class teaching: in a muhurta, the purpose decides which panchang
//  limb carries the most weight. Each limb is one element and answers
//  one question; nadika (ghati) is a sixth limb that settles the final
//  outcome and is never compromised.
//
//  The class gave two worked examples (writing → tithi first; wedding →
//  yoga first, tithi barely matters). Orders for the other activities
//  follow the same limb roles. Pure — no React / DB.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import type { MuhurtaActivity } from '@/lib/engine/muhurtaAnalysis'
import { LIMB_ROLE_HI, LIMB_FOCUS_HI, LIMB_PRINCIPLES_HI } from '@/lib/engine/locale/muhurtaLimbPriority.hi'

export type PanchangLimb = 'vara' | 'tithi' | 'karana' | 'nakshatra' | 'yoga'

export interface LimbRoleText {
  /** Element of the limb */
  element: string
  /** The question this limb answers for the work */
  role: string
}

export interface LimbPriority {
  activity: MuhurtaActivity
  /** Most important first */
  order: PanchangLimb[]
  /** Why this order for this purpose */
  focus: string
}

export const LIMB_ROLE_EN: Record<PanchangLimb | 'nadika', LimbRoleText> = {
  vara:      { element: 'Fire',  role: 'How ideas come and how you begin and approach the work.' },
  tithi:     { element: 'Water', role: 'How you will feel while doing it — the emotional tone and relationships.' },
  karana:    { element: 'Earth', role: 'What you gain materially and physically from it.' },
  nakshatra: { element: 'Air',   role: 'Where the thoughts come from — whose help and influence you draw on.' },
  yoga:      { element: 'Ether', role: 'The combined outcome of all the limbs together.' },
  nadika:    { element: 'Sixth limb', role: 'The final, fine result of the event. Never compromise on it.' },
}

const ORDER: Record<MuhurtaActivity, PanchangLimb[]> = {
  GENERAL:      ['vara', 'tithi', 'karana', 'nakshatra', 'yoga'],
  MARRIAGE:     ['yoga', 'nakshatra', 'vara', 'karana', 'tithi'],
  RELATIONSHIP: ['tithi', 'yoga', 'nakshatra', 'vara', 'karana'],
  EDUCATION:    ['nakshatra', 'vara', 'tithi', 'yoga', 'karana'],
  BUSINESS:     ['karana', 'yoga', 'vara', 'nakshatra', 'tithi'],
  REAL_ESTATE:  ['karana', 'yoga', 'nakshatra', 'vara', 'tithi'],
  HEALTH:       ['karana', 'yoga', 'nakshatra', 'vara', 'tithi'],
  TRAVEL:       ['vara', 'nakshatra', 'yoga', 'karana', 'tithi'],
  SPIRITUAL:    ['tithi', 'nakshatra', 'yoga', 'vara', 'karana'],
}

export const LIMB_FOCUS_EN: Record<MuhurtaActivity, string> = {
  GENERAL: 'Read in sequence: vara (what you start), tithi (how it feels), karana (what you gain), nakshatra (whose help), yoga (overall outcome) — then nadika for the final result. For writing or creative work the feeling matters most, so a good tithi can carry a weaker yoga.',
  MARRIAGE: 'For a wedding the final outcome matters, not how the day feels. Yoga comes first (avoid Vishkumbha), nakshatra counts up to a limit, and tithi matters least.',
  RELATIONSHIP: 'A proposal or talk of the heart runs on feeling — tithi first, then the yoga for where it leads.',
  EDUCATION: 'Learning and interviews run on thought — the nakshatra decides what you can draw on, vara how you present it.',
  BUSINESS: 'Contracts and deals are about material gain — karana first, yoga for the outcome; the day’s mood matters less.',
  REAL_ESTATE: 'Property is the earth element — karana first, then yoga for how the move settles.',
  HEALTH: 'Treatment works on the body — karana first. For surgery the class prefers harsh, Mars/Ketu-type days (Chaturthi, Chaturdashi, sharp nakshatras), and the dasha must support it.',
  TRAVEL: 'A journey is about the start and the approach — vara first, nakshatra for help on the way.',
  SPIRITUAL: 'Worship runs on bhava — tithi first, nakshatra for the thought you carry into it.',
}

export const LIMB_PRINCIPLES_EN: string[] = [
  'First ask what the objective of the day is; then weigh the limb that serves it.',
  'You can compromise on a limb that does not serve the purpose — but never on nadika, which decides the final outcome.',
  'Every limb is a reference to an energy, not a planet to map.',
]

export function getLimbPriority(activity: MuhurtaActivity, lang: EngineLang = 'en'): LimbPriority {
  const order = ORDER[activity] ?? ORDER.GENERAL
  const focus = (lang === 'hi' ? LIMB_FOCUS_HI : LIMB_FOCUS_EN)[activity] ?? LIMB_FOCUS_EN.GENERAL
  return { activity, order: [...order], focus }
}

export function getLimbRoles(lang: EngineLang = 'en'): Record<PanchangLimb | 'nadika', LimbRoleText> {
  return lang === 'hi' ? LIMB_ROLE_HI : LIMB_ROLE_EN
}

export function listLimbPrinciples(lang: EngineLang = 'en'): string[] {
  return lang === 'hi' ? LIMB_PRINCIPLES_HI : LIMB_PRINCIPLES_EN
}
