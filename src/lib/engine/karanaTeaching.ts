// ─────────────────────────────────────────────────────────────
//  src/lib/engine/karanaTeaching.ts
//  Karana as the earthly outcome: the class teaching on each half-tithi
//  — what it materialises (money, position, the body), its animal,
//  professions, diseases, and the weekday pairings taught.
//
//  Frame: karana is the tithi split in two (60 a month). Tithi is the
//  feeling; karana narrows it to something you can touch — wealth,
//  position, health. When the other limbs push the same way as the
//  karana, a person rises high; when they pull apart, things don't
//  materialise. Pure — no React / DB.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { normalizeKaranaName, type KaranaId } from '@/lib/engine/karanaMeta'
import {
  KARANA_PRINCIPLES_HI,
  KARANA_TEACHING_HI,
  KARANA_VAAR_HI,
} from '@/lib/engine/locale/karanaTeaching.hi'

/** 0 = Sunday … 6 = Saturday (same as vaarMeta). */
export type KaranaVaraIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type KaranaVaarTone = 'supports' | 'opposes' | 'mixed'

export interface KaranaTeachingText {
  /** Animal given for the karana */
  animal:      string
  /** What the karana materialises */
  essence:     string
  nature:      string
  professions: string[]
  /** Body areas / diseases the karana carries */
  health:      string
  remedy:      string
  example:     string
}

export interface KaranaVaarNote {
  tone: KaranaVaarTone
  text: string
}

export interface KaranaTeaching extends KaranaTeachingText {
  id:    KaranaId
  lord:  GrahaId
  fixed: boolean
}

const SHAPE: Record<KaranaId, { lord: GrahaId; fixed: boolean }> = {
  Bava:        { lord: 'Su', fixed: false },
  Balava:      { lord: 'Mo', fixed: false },
  Kaulava:     { lord: 'Ma', fixed: false },
  Taitila:     { lord: 'Me', fixed: false },
  Garija:      { lord: 'Ju', fixed: false },
  Vanija:      { lord: 'Ve', fixed: false },
  Vishti:      { lord: 'Sa', fixed: false },
  Shakuni:     { lord: 'Ra', fixed: true },
  Chatushpada: { lord: 'Ke', fixed: true },
  Naga:        { lord: 'Ra', fixed: true },
  Kimstughna:  { lord: 'Ke', fixed: true },
}

export const KARANA_TEACHING_EN: Record<KaranaId, KaranaTeachingText> = {
  Bava: {
    animal: 'Lion',
    essence: 'Authority — a chair, boundaries and resources to manage.',
    nature: 'Rule from the heart, not from being strongest or fastest. Set boundaries and regulations for others and sacrifice a lot to stay at the top.',
    professions: ['Politicians', 'Managers and administrators', 'Military command', 'Hospital management'],
    health: 'Heart blockage, stomach, intestines and ulcers, head trouble, loss of honour.',
    remedy: 'Keep government symbols at home (national flag, Ashoka emblem); press your father’s feet; treat low-grade government staff with respect.',
    example: 'A businessman with Bava on a Saturday was rude to a postman — a complaint led to tax and court trouble that took his business to zero.',
  },
  Balava: {
    animal: 'Cat family (tiger, cat)',
    essence: 'Healing — the debt of living on earth paid by serving.',
    nature: 'Healers, good astrologers, doctors and storytellers; whoever they hold by the hand gets better. Cannot hate or absorb poison; close to the mother.',
    professions: ['Healers and doctors', 'Astrologers and counsellors', 'Storytellers, teachers'],
    health: 'Emotional pain that settles in the body; depression when work isn’t appreciated.',
    remedy: 'Serve — the power is given to repay a debt; the body’s pain eases once service starts.',
    example: 'Gandhi’s salt satyagraha: Balava healing through food and salt (Saturn-Moon).',
  },
  Kaulava: {
    animal: 'Boar (Varaha)',
    essence: 'Challenge and fight — land, weapons and things others fear to do.',
    nature: 'Wake up asking whom to take on today; uneasy until the sword is shown. With good support, excellent and fearless.',
    professions: ['Army', 'Land and property', 'Work others are afraid to do'],
    health: 'High BP, blood issues, tumours, ulcers, broken or missing limbs, disfigurement.',
    remedy: 'Mud bath with herbs — the irritable fighting energy settles, as the boar rolls in mud.',
    example: 'Born on a Wednesday under Pratipada with Kaulava: Mercury is the odd one out — expect nerve and blood-flow trouble in the head; remedy Wednesday.',
  },
  Taitila: {
    animal: 'Donkey',
    essence: 'Process — rules, SOPs and step-by-step order.',
    nature: 'Extremely organised; learn exactly what is taught and stick to it. Perfect copiers and mimics; strong ties with siblings, arts and books.',
    professions: ['Banking and investment', 'Architecture and civil engineering', 'Law, mediation (with Mars)', 'Sarcastic comedy (with Mars)'],
    health: 'Nerves — paralysis, Parkinson’s, varicose veins, inner brain issues.',
    remedy: 'Take breaks with no rules — a forest walk without gadgets, ten minutes of puja with no ritual, abstract painting, cooking without a recipe.',
    example: 'Building a house: Balava hires the interior designer, Bava checks the permits, Taitila tells you what to do in which order.',
  },
  Garija: {
    animal: 'Elephant',
    essence: 'Wisdom and the big picture — power without the urge to use it.',
    nature: 'Think very big; won’t fight unless pushed to the limit. The genius everyone runs to for solutions, often not the manager.',
    professions: ['Teachers and gurus', 'Counsellors and settlement-makers', 'Philosophers', 'Technical work with machines (with Saturday)'],
    health: 'Liver, pancreas, fat, water retention.',
    remedy: 'Drop the long list of filters — the details they never look at block them.',
    example: 'A nation with Gara plans one road across continents — vision huge, implementation weak, because execution needs Taitila.',
  },
  Vanija: {
    animal: 'Cow',
    essence: 'Complexity — finance, entertainment and intricate systems.',
    nature: 'Restless until a complex problem is solved; make easy things complex because the prize matters. Cool-headed and patient in battle — they plan the chakravyuha.',
    professions: ['Finance, banking, investment', 'Forensics, cyber-security', 'Entertainment', 'Research on chronic illness', 'Engineering (with Saturn or Mars)'],
    health: 'Eyes, kidneys and marriage — the three recurring troubles.',
    remedy: 'Honour Venus — care for what is delicate (eyes, silk, relationships).',
    example: 'A doctor born Dashami with Vanija only takes fourth-stage cancer and paralysis cases — complexity is the reward.',
  },
  Vishti: {
    animal: 'Not given in class',
    essence: 'Service and longevity — others rise because of them.',
    nature: 'Astrologers, tantriks, yoga and pranayama teachers, those working for the elderly; long-term planners. Life feels dry, without fun or a goal.',
    professions: ['Astrology and tantra', 'Yoga, medicine, longevity', 'Accounts and audit (with Wednesday)', 'Surgery (with Tuesday)'],
    health: 'Vata trouble — gas, arthritis, elephantiasis, stammering; one illness follows another; isolation and depression.',
    remedy: 'Listen to old classical music to bring back rasa.',
    example: 'An astrologer who taught most of the hills cannot afford a bicycle: Vishti on a Tuesday with Chaturdashi.',
  },
  Shakuni: {
    animal: 'Eagle',
    essence: 'Foresight — the bird’s-eye view.',
    nature: 'Active, not reactive; diplomatic and smiling; read the smallest move and know whether work will happen. Like Krishna and Shakuni in the Mahabharata.',
    professions: ['Strategy and long-term planning', 'Builders'],
    health: 'Sudden, hard-to-detect diseases (fixed karanas).',
    remedy: 'Respect nature — don’t dig or disturb sacred ground without worship.',
    example: 'A fixed karana: less freedom to change results by action than the movable seven.',
  },
  Chatushpada: {
    animal: 'Four-footed animal',
    essence: 'Danger and the unseen — places no one wants to go.',
    nature: 'Cool under pressure; climb mountains, work in mortuaries, spy, explore space — deal with tamas.',
    professions: ['Mountaineers and astronauts', 'Spies, insurance, mortuary work', 'Energy healing and reiki (with Monday)', 'Astrology (with Ashtami)'],
    health: 'Sudden death in remote places; the body may never be found.',
    remedy: 'Don’t enter places that shouldn’t be explored; worship the mountain before climbing.',
    example: 'With Monday, healing through the unseen; with Tuesday the same energy turns to theft.',
  },
  Naga: {
    animal: 'Serpent',
    essence: 'Living on others’ earnings.',
    nature: 'Police, army leaders, recovery agents, money-lenders, those who raise funds on others’ work.',
    professions: ['Police and army leadership', 'Lending and recovery', 'Fund-raising and charities'],
    health: 'Cancers and tumours that appear suddenly.',
    remedy: 'Puja at a Naga temple; donate for ancestors; light a lamp for ancestors daily.',
    example: 'For ulcerative colitis with blood under a fixed karana (Shakuni, Chaturdashi, Sunday), the class remedy was Naga-temple puja and giving for ancestors.',
  },
  Kimstughna: {
    animal: 'Not given in class',
    essence: 'The microscopic — what the eye can’t see but exists.',
    nature: 'Hair-splitting work: nuclear reactors, worms, bacteria, cultures, organic industry, pathology, vaccines.',
    professions: ['Pathology and lab science', 'Vaccines and pharma', 'Venture and crowd funding'],
    health: 'Hidden, slow-to-detect conditions.',
    remedy: 'Do the fine work, but don’t meddle with nature.',
    example: 'The one who first read disease from urine culture was born in it.',
  },
}

/** Karana × vaar notes taught in class. */
export const KARANA_VAAR_EN: Partial<Record<KaranaId, Partial<Record<KaranaVaraIndex, KaranaVaarNote>>>> = {
  Bava: {
    0: { tone: 'supports', text: 'Sunday backs the Sun — good politicians and leaders.' },
    2: { tone: 'opposes', text: 'Excess pitta; with Shashthi it turns to army command.' },
    3: { tone: 'supports', text: 'Mercury stays under the Sun’s control — a sharp brain.' },
    5: { tone: 'opposes', text: 'Trouble in relationships and money; problems come complex.' },
    6: { tone: 'opposes', text: 'Sun and Saturn don’t mix — remedy Saturn (Saturday fasts, give to low-grade government staff).' },
  },
  Balava: {
    0: { tone: 'supports', text: 'With Navami, two Suns and a Moon — counsellors and teachers.' },
    2: { tone: 'mixed', text: 'Mars brings the fight into healing — criminal lawyers, acupressure.' },
    4: { tone: 'supports', text: 'With Pratipada, all three support — no inner conflict.' },
    5: { tone: 'supports', text: 'With Panchami — marriage and relationship counsellors.' },
    6: { tone: 'opposes', text: 'Depression about work not being appreciated; emotional pain in the body.' },
  },
  Kaulava: {
    0: { tone: 'supports', text: 'Sun support — straight into the army.' },
    3: { tone: 'opposes', text: 'Mercury is the odd one out — nerve and blood trouble; remedy Wednesday.' },
    5: { tone: 'opposes', text: 'Relationship fights over complex problems at home.' },
  },
  Taitila: {
    0: { tone: 'supports', text: 'With Pratipada — born for a bank job.' },
    2: { tone: 'mixed', text: 'Rules plus Mars — lawyers, property dealers, civil engineers.' },
    3: { tone: 'mixed', text: 'With Shashthi — so much routine and fight it can end in paralysis.' },
  },
  Garija: {
    0: { tone: 'supports', text: 'Sunday supports — good.' },
    3: { tone: 'mixed', text: 'With Shashthi — a lawyer who settles out of court.' },
    5: { tone: 'opposes', text: 'Friday’s fine specifications never reach the elephant — plans don’t start.' },
    6: { tone: 'supports', text: 'Technical work with machines.' },
  },
  Vanija: {
    2: { tone: 'supports', text: 'Mars brings the engineer’s complexity — aeronautics.' },
    6: { tone: 'supports', text: 'Saturn brings the engineer’s complexity.' },
  },
  Vishti: {
    1: { tone: 'supports', text: 'Spiritual work; with Saptami, relationships become the focus.' },
    2: { tone: 'mixed', text: 'Surgery — nothing happens without cutting; with Chaturdashi, struggle.' },
    3: { tone: 'mixed', text: 'Accounts and audit; with Chaturdashi, vata trouble and stammering.' },
    5: { tone: 'supports', text: 'Rich — deals in oil, perfume or liquor.' },
    6: { tone: 'mixed', text: 'Good, but results wait till after 42.' },
  },
  Chatushpada: {
    1: { tone: 'supports', text: 'Healing through the unseen — reiki, energy work.' },
    2: { tone: 'opposes', text: 'The same energy turns to theft.' },
  },
}

export const KARANA_PRINCIPLES_EN: string[] = [
  'Karana is the tithi split in two — 60 a month. Tithi is the feeling; karana is what you can touch: money, position, the body.',
  'Vaar starts things (fire), tithi carries the feeling, yoga is the destination, karana is the earthly result.',
  'When tithi, vaar and the rest push the same way as the karana, a person rises high; when they pull apart, nothing materialises.',
  'Find the odd one out among the tithi lord, vaar lord and karana lord — remedy that limb, not the others.',
  'Diseases show through the karana, but the remedy goes to whichever limb is out of line.',
  'Karana remedies bring the thing without satisfaction; tithi remedies cover the karana too, so they are preferred.',
  'Movable karanas (Bava to Vishti) leave room to change results by action; the four fixed ones (Shakuni to Kimstughna) give less freedom.',
  'Read the yearly tithi-pravesh panchang: the year a marriage happens, the limbs line up on Venus.',
  'Dreams show the dosha: flying or empty vessels — vata; sun, blood, weapons — pitta; kings, gurus, temples, water — kapha.',
]

export function getKaranaTeaching(name: string, lang: EngineLang = 'en'): KaranaTeaching | null {
  const id = normalizeKaranaName(name)
  if (!id) return null
  const text = (lang === 'hi' ? KARANA_TEACHING_HI : KARANA_TEACHING_EN)[id]
  return { ...text, id, ...SHAPE[id] }
}

/** Karana × vaar note (vara 0 = Sunday); null when the class did not teach that pair. */
export function getKaranaVaarNote(name: string, varaNumber: number, lang: EngineLang = 'en'): KaranaVaarNote | null {
  const id = normalizeKaranaName(name)
  if (!id) return null
  const v = (((Math.floor(varaNumber) % 7) + 7) % 7) as KaranaVaraIndex
  return (lang === 'hi' ? KARANA_VAAR_HI : KARANA_VAAR_EN)[id]?.[v] ?? null
}

export function listKaranaPrinciples(lang: EngineLang = 'en'): string[] {
  return lang === 'hi' ? KARANA_PRINCIPLES_HI : KARANA_PRINCIPLES_EN
}
