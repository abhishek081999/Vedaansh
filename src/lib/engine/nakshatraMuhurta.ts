// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraMuhurta.ts
//  Classical muhurta classifications for the 27 nakshatras:
//  nature-group (Dhruva…Tikshna), mukha (facing), Abhijit window,
//  and Ashwini weekday yogas. Complements nakshatraAdvanced.ts.
// ─────────────────────────────────────────────────────────────

import { NAKSHATRA_NAMES } from '@/types/astrology'
import { NAKSHATRA_HI, termHi } from '@/i18n/jyotish'
import { overlay, type EngineLang } from '@/lib/engine/lang'
import {
  ABHIJIT_HI,
  ASHWINI_HI,
  FALL_EFFECTS_HI,
  GROUPS_HI,
  MUKHAS_HI,
  NAK_TEXT_HI,
  SHAKTI_HI,
  YONI_HI,
} from '@/lib/engine/locale/nakshatraMuhurta.hi'
import {
  getNakshatraCharacteristics,
  NAKSHATRA_SHAKTI,
  type NakshatraCharacteristics,
} from '@/lib/engine/nakshatraAdvanced'

/** Muhurta nature groups (classical electional classification) */
export type MuhurtaNakGroupId =
  | 'Dhruva'
  | 'Chara'
  | 'Ugra'
  | 'Mishra'
  | 'Laghu'
  | 'Mridu'
  | 'Tikshna'

export type MukhaId = 'Urdhvamukhi' | 'Adhomukhi' | 'Tiryakmukhi'

export interface MuhurtaNakGroupMeta {
  id:          MuhurtaNakGroupId
  label:       string
  aka:         string
  weekdayHint: string
  goodFor:     string
  energy:      string
}

export interface MukhaMeta {
  id:      MukhaId
  label:   string
  meaning: string
  goodFor: string
}

export interface NakshatraMuhurtaMeta {
  index:       number
  name:        string
  group:       MuhurtaNakGroupMeta
  mukha:       MukhaMeta
  /** Compact “basic energy” line for cosmic weather */
  basicEnergy: string
  /** Classical “effects wherever this nakshatra falls” (house / area colouring) */
  fallEffect:  string
  chars:       NakshatraCharacteristics
}

export interface AbhijitWindow {
  active:      boolean
  spanLabel:   string
  note:        string
}

export interface AshwiniYogaNote {
  id:      'amrit_siddhi' | 'sarvartha_siddhi' | 'vish_yoga'
  label:   string
  quality: 'auspicious' | 'caution' | 'inauspicious'
  detail:  string
}

const GROUPS: Record<MuhurtaNakGroupId, MuhurtaNakGroupMeta> = {
  Dhruva: {
    id: 'Dhruva',
    label: 'Dhruva (Sthira)',
    aka: 'Fixed',
    weekdayHint: 'Linked with Sunday in classical lists',
    goodFor: 'Foundations, house building, wells, Upanayana and agriculture',
    energy: 'Stable and lasting; suited to permanent establishments',
  },
  Chara: {
    id: 'Chara',
    label: 'Chara (Chalayaman)',
    aka: 'Movable',
    weekdayHint: 'Linked with Monday in classical lists',
    goodFor: 'Travel, driving, movement, relocation',
    energy: 'Mobile, change-oriented, favours journeys',
  },
  Ugra: {
    id: 'Ugra',
    label: 'Ugra (Kroor)',
    aka: 'Fierce / cruel',
    weekdayHint: 'Linked with Tuesday in classical lists',
    goodFor: 'Aggressive or cautionary acts — weapons training, (medicinal) research into poisons, forceful work',
    energy: 'Fierce intensity; avoid gentle auspicious rites',
  },
  Mishra: {
    id: 'Mishra',
    label: 'Mishra (Dwiswabhava)',
    aka: 'Mixed',
    weekdayHint: 'Linked with Wednesday in classical lists',
    goodFor: 'Crafts, metalwork, gas-related work and interior design',
    energy: 'A dual nature — adaptable to skilled crafts',
  },
  Laghu: {
    id: 'Laghu',
    label: 'Laghu (Kshipra)',
    aka: 'Light / quick',
    weekdayHint: 'Linked with Thursday in classical lists',
    goodFor: 'Opening a shop, buying, starting education, partnerships and new light work',
    energy: 'Quick and light; favourable for swift beginnings',
  },
  Mridu: {
    id: 'Mridu',
    label: 'Mridu (Maitra)',
    aka: 'Soft / friendly',
    weekdayHint: 'Linked with Friday in classical lists',
    goodFor: 'Music, new clothes, games, friendship and jewellery',
    energy: 'Gentle, pleasant, socially harmonious',
  },
  Tikshna: {
    id: 'Tikshna',
    label: 'Tikshna (Daruna)',
    aka: 'Sharp / severe',
    weekdayHint: 'Linked with Saturday in classical lists',
    goodFor: 'Tantra, sadhana, Hatha Yoga, animal training and hypnotism',
    energy: 'Sharp and severe; suited to intense practices',
  },
}

const MUKHAS: Record<MukhaId, MukhaMeta> = {
  Urdhvamukhi: {
    id: 'Urdhvamukhi',
    label: 'Urdhvamukhi',
    meaning: 'Upward-facing',
    goodFor: 'Multi-storey buildings, temples and parks — anything that needs to grow upward',
  },
  Adhomukhi: {
    id: 'Adhomukhi',
    label: 'Adhomukhi',
    meaning: 'Downward-facing',
    goodFor: 'Wells, ponds, foundations, tunnels, basements, mines and drainage',
  },
  Tiryakmukhi: {
    id: 'Tiryakmukhi',
    label: 'Tiryakmukhi',
    meaning: 'Side-facing',
    goodFor: 'Roads, driving, travel and media or content delivery',
  },
}

/**
 * Classical muhurta group by nakshatra index (0=Ashwini … 26=Revati).
 * Abhijit (special) is treated as Laghu when the Abhijit longitude window is active.
 */
const GROUP_BY_INDEX: MuhurtaNakGroupId[] = [
  'Laghu',   // 0 Ashwini
  'Ugra',    // 1 Bharani
  'Mishra',  // 2 Krittika
  'Dhruva',  // 3 Rohini
  'Mridu',   // 4 Mrigashira
  'Tikshna', // 5 Ardra
  'Chara',   // 6 Punarvasu
  'Laghu',   // 7 Pushya
  'Tikshna', // 8 Ashlesha
  'Ugra',    // 9 Magha
  'Ugra',    // 10 Purva Phalguni
  'Dhruva',  // 11 Uttara Phalguni
  'Laghu',   // 12 Hasta
  'Mridu',   // 13 Chitra
  'Chara',   // 14 Swati
  'Mishra',  // 15 Vishakha
  'Mridu',   // 16 Anuradha
  'Tikshna', // 17 Jyeshtha
  'Tikshna', // 18 Mula
  'Ugra',    // 19 Purva Ashadha
  'Dhruva',  // 20 Uttara Ashadha
  'Chara',   // 21 Shravana
  'Chara',   // 22 Dhanishtha
  'Chara',   // 23 Shatabhisha
  'Ugra',    // 24 Purva Bhadra
  'Dhruva',  // 25 Uttara Bhadra
  'Mridu',   // 26 Revati
]

/**
 * Mukha (facing). Punarvasu listed in both urdhva & tiryak in some notes —
 * assigned Urdhvamukhi here (primary upward list).
 */
const MUKHA_BY_INDEX: MukhaId[] = [
  'Tiryakmukhi',  // Ashwini
  'Adhomukhi',    // Bharani
  'Adhomukhi',    // Krittika
  'Urdhvamukhi',  // Rohini
  'Tiryakmukhi',  // Mrigashira
  'Urdhvamukhi',  // Ardra
  'Urdhvamukhi',  // Punarvasu
  'Urdhvamukhi',  // Pushya
  'Adhomukhi',    // Ashlesha
  'Adhomukhi',    // Magha
  'Adhomukhi',    // Purva Phalguni
  'Urdhvamukhi',  // Uttara Phalguni
  'Tiryakmukhi',  // Hasta
  'Tiryakmukhi',  // Chitra
  'Tiryakmukhi',  // Swati
  'Adhomukhi',    // Vishakha
  'Tiryakmukhi',  // Anuradha
  'Tiryakmukhi',  // Jyeshtha
  'Adhomukhi',    // Mula
  'Adhomukhi',    // Purva Ashadha
  'Urdhvamukhi',  // Uttara Ashadha
  'Tiryakmukhi',  // Shravana (classical side-facing travel/hearing)
  'Urdhvamukhi',  // Dhanishtha
  'Urdhvamukhi',  // Shatabhisha
  'Adhomukhi',    // Purva Bhadra
  'Urdhvamukhi',  // Uttara Bhadra
  'Tiryakmukhi',  // Revati
]

/** Abhijit: Capricorn 6°40′–10°53′20″ → sidereal 276°40′–280°53′20″ */
export const ABHIJIT_START_DEG = 270 + 6 + 40 / 60
export const ABHIJIT_END_DEG   = 270 + 10 + 53 / 60 + 20 / 3600

export function isAbhijitLongitude(moonLonSidereal: number): boolean {
  const lon = ((moonLonSidereal % 360) + 360) % 360
  return lon >= ABHIJIT_START_DEG && lon < ABHIJIT_END_DEG
}

export function getAbhijitWindow(moonLonSidereal?: number | null, lang: EngineLang = 'en'): AbhijitWindow {
  const hi = lang === 'hi'
  const spanLabel = hi ? ABHIJIT_HI.spanLabel : 'Makara 6°40′–10°53′20″ (within Uttara Ashadha)'
  if (moonLonSidereal == null || Number.isNaN(moonLonSidereal)) {
    return {
      active: false,
      spanLabel,
      note: hi ? ABHIJIT_HI.unknown : 'A special 28th muhurta nakshatra — Laghu/Kshipra; check the Moon’s longitude for the Abhijit window.',
    }
  }
  const active = isAbhijitLongitude(moonLonSidereal)
  return {
    active,
    spanLabel,
    note: active
      ? hi ? ABHIJIT_HI.active : 'Abhijit is active — treat it as Laghu (Kshipra); excellent for light, auspicious beginnings.'
      : hi ? ABHIJIT_HI.inactive : 'Outside the Abhijit span; use the muhurta group of the current Moon nakshatra.',
  }
}

/**
 * Classical “effects wherever it falls” — how the nakshatra colours
 * the house / life-area it occupies (compact teaching notes).
 * Index 0 = Ashwini … 26 = Revati.
 */
export const NAKSHATRA_FALL_EFFECTS: string[] = [
  // Ashwini
  'Quick starts and healing; a rush of energy; pioneering moves; vehicles and speed',
  // Bharani
  'The extremes of birth and death; restraint and release; heavy karma; creative or reproductive pressure',
  // Krittika
  'Things are cut and refined; sharp communication; court or legal outcomes; purifying fire',
  // Rohini
  'Growth, beauty and attraction; comfort and fertility; creative or material blossoming',
  // Mrigashira
  'Searching and roaming; curiosity; mild restlessness; hunting for options',
  // Ardra
  'Storms followed by clarity; emotional upheaval; research through crisis; transforming tears',
  // Punarvasu
  'Return and renewal; second chances; restoration after loss; a hopeful rebound',
  // Pushya
  'Nourishment and protection; mentoring; steady care; auspicious support',
  // Ashlesha
  'Entanglement and secrecy; clinging bonds; shrewd strategy; venom that becomes medicine',
  // Magha
  'Ancestral power and status; seats of authority; legacy; pride in lineage',
  // Purva Phalguni
  'Pleasure, rest and romance; celebration; creative leisure; themes of union',
  // Uttara Phalguni
  'Contracts and patronage; lasting alliances; duty after pleasure; social standing',
  // Hasta
  'Skilled hands and craft; handling detail; deals; clever problem-solving',
  // Chitra
  'Design, form and flair; craftsmanship; image-making; sudden brilliant ideas',
  // Swati
  'Independence and airy movement; trade winds; self-reliance; flexible partnerships',
  // Vishakha
  'Ambition and divided aims; a drive to achieve; rivalry; fixation on goals',
  // Anuradha
  'Friendship and devotion; occult loyalty; organised groups; hidden support',
  // Jyeshtha
  'Seniority and control; responsibility; protective dominance; authority in mid-life',
  // Mula
  'Disruption at the root; uprooting; investigating to the core; endings that clear the ground',
  // Purva Ashadha
  'The energy of early victory; an unstoppable push; pride; emotional conviction',
  // Uttara Ashadha
  'Later, lasting victory; enduring fame; structured success; leadership that endures',
  // Shravana
  'Listening and learning; news; counsel; pathways of knowledge and travel',
  // Dhanishtha
  'Rhythm, wealth and music; status through skill; group prosperity; ambition',
  // Shatabhisha
  'Healing networks and secrecy; medicine; isolation for the sake of cure; technical mysteries',
  // Purva Bhadra
  'Fiery idealism; sacrifice; radical speech; scorching transformation',
  // Uttara Bhadra
  'Deep stability after an ordeal; profound wisdom; calm kundalini; enduring support',
  // Revati
  'Completion and safe passage; nourishment; protective endings; the close of a journey',
]

/** `group.id` / `mukha.id` stay English; labels and text follow `lang`. */
export function getNakshatraMuhurtaMeta(index: number, pada: number = 1, lang: EngineLang = 'en'): NakshatraMuhurtaMeta {
  const i = ((index % 27) + 27) % 27
  const hi = lang === 'hi'
  const charsEn = getNakshatraCharacteristics(i, pada)
  const chars = hi ? getNakshatraCharacteristics(i, pada, 'hi') : charsEn
  const groupId = GROUP_BY_INDEX[i]
  const mukhaId = MUKHA_BY_INDEX[i]
  const group = overlay(GROUPS[groupId], GROUPS_HI[groupId], lang)
  const mukha = overlay(MUKHAS[mukhaId], MUKHAS_HI[mukhaId], lang)
  const basicEnergy = hi
    ? `${termHi(charsEn.gana)} · ${YONI_HI[charsEn.yoni] ?? charsEn.yoni} ${NAK_TEXT_HI.yoni} · ${SHAKTI_HI[i]}`
    : `${charsEn.gana} · ${charsEn.yoni} yoni · ${NAKSHATRA_SHAKTI[i]}`

  return {
    index: i,
    name: hi ? NAKSHATRA_HI[i] : NAKSHATRA_NAMES[i],
    group,
    mukha,
    basicEnergy,
    fallEffect: hi ? FALL_EFFECTS_HI[i] : NAKSHATRA_FALL_EFFECTS[i],
    chars,
  }
}

/**
 * Ashwini weekday yogas (classical muhurta notes).
 * varaNumber: 0=Sun … 6=Sat (engine Vara). tithiNumber: 1–30.
 */
export function getAshwiniYogaNotes(
  nakIndex: number,
  varaNumber: number,
  tithiNumber?: number | null,
  lang: EngineLang = 'en',
): AshwiniYogaNote[] {
  if (nakIndex !== 0) return []
  const hi = lang === 'hi'
  const notes: AshwiniYogaNote[] = []
  const isTue = varaNumber === 2
  const isThu = varaNumber === 4
  const isFri = varaNumber === 5
  const lunarDay = tithiNumber != null ? ((tithiNumber - 1) % 15) + 1 : null

  if (isTue || isThu || isFri) {
    notes.push({
      id: 'sarvartha_siddhi',
      label: hi ? ASHWINI_HI.sarvartha.label : 'Sarvartha Siddhi Yoga',
      quality: 'auspicious',
      detail: hi ? ASHWINI_HI.sarvartha.detail : 'Ashwini on Tuesday, Thursday or Friday — generally good for most work (note the Vish Yoga caveat for Tuesday + Saptami).',
    })
  }
  if (isTue) {
    notes.push({
      id: 'amrit_siddhi',
      label: hi ? ASHWINI_HI.amrit.label : 'Amrit Siddhi Yoga',
      quality: 'caution',
      detail: hi ? ASHWINI_HI.amrit.detail : 'Ashwini on Tuesday — auspicious overall, but avoid Griha Pravesh and house construction.',
    })
  }
  if (isTue && lunarDay === 7) {
    notes.push({
      id: 'vish_yoga',
      label: hi ? ASHWINI_HI.vish.label : 'Vish Yoga (Madhu mein Vish)',
      quality: 'inauspicious',
      detail: hi ? ASHWINI_HI.vish.detail : 'Ashwini + Tuesday + Saptami — avoid all shubh karyas despite the Amrit Siddhi label.',
    })
  }
  return notes
}

/** Compact Ashwini activity hints for muhurta UI */
export const ASHWINI_ACTIVITY_HINT = {
  favour: 'Horses and vehicles, pets, travel, plantation business, government jobs and light finance (subject to the empty 5/8/9 and Chara lagna caveat)',
  avoid: 'Timing for ploughing, sowing and fertilising the soil',
}

export function getAshwiniActivityHint(lang: EngineLang = 'en'): typeof ASHWINI_ACTIVITY_HINT {
  return lang === 'hi' ? { favour: ASHWINI_HI.favour, avoid: ASHWINI_HI.avoid } : ASHWINI_ACTIVITY_HINT
}

export function formatNakshatraWeatherLine(meta: NakshatraMuhurtaMeta): string {
  return `${meta.group.label} · ${meta.mukha.label} — ${meta.group.goodFor}`
}

export function listMuhurtaNakGroups(lang: EngineLang = 'en'): MuhurtaNakGroupMeta[] {
  return (['Dhruva', 'Chara', 'Ugra', 'Mishra', 'Laghu', 'Mridu', 'Tikshna'] as const).map((id) =>
    overlay(GROUPS[id], GROUPS_HI[id], lang),
  )
}
