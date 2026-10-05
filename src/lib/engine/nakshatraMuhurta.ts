// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraMuhurta.ts
//  Classical muhurta classifications for the 27 nakshatras:
//  nature-group (Dhruva…Tikshna), mukha (facing), Abhijit window,
//  and Ashwini weekday yogas. Complements nakshatraAdvanced.ts.
// ─────────────────────────────────────────────────────────────

import { NAKSHATRA_NAMES } from '@/types/astrology'
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
    weekdayHint: 'Sunday affinity in classical lists',
    goodFor: 'Foundations, house construction, wells, Upanayana, agriculture',
    energy: 'Stable, enduring, suited to lasting establishments',
  },
  Chara: {
    id: 'Chara',
    label: 'Chara (Chalayaman)',
    aka: 'Movable',
    weekdayHint: 'Monday affinity in classical lists',
    goodFor: 'Travel, driving, movement, relocation',
    energy: 'Mobile, change-oriented, favours journeys',
  },
  Ugra: {
    id: 'Ugra',
    label: 'Ugra (Kroor)',
    aka: 'Fierce / cruel',
    weekdayHint: 'Tuesday affinity in classical lists',
    goodFor: 'Aggressive / cautionary acts — weapons training, poison research (medicinal), forceful work',
    energy: 'Fierce intensity; avoid soft auspicious rites',
  },
  Mishra: {
    id: 'Mishra',
    label: 'Mishra (Dwiswabhava)',
    aka: 'Mixed',
    weekdayHint: 'Wednesday affinity in classical lists',
    goodFor: 'Craft, metalwork, gas-related work, interior design',
    energy: 'Dual nature — adaptable to skilled crafts',
  },
  Laghu: {
    id: 'Laghu',
    label: 'Laghu (Kshipra)',
    aka: 'Light / quick',
    weekdayHint: 'Thursday affinity in classical lists',
    goodFor: 'Shop opening, buying, education start, partnerships, new light work',
    energy: 'Quick, light, favourable for swift starts',
  },
  Mridu: {
    id: 'Mridu',
    label: 'Mridu (Maitra)',
    aka: 'Soft / friendly',
    weekdayHint: 'Friday affinity in classical lists',
    goodFor: 'Music, new clothes, games, friendship, jewellery',
    energy: 'Gentle, pleasant, socially harmonious',
  },
  Tikshna: {
    id: 'Tikshna',
    label: 'Tikshna (Daruna)',
    aka: 'Sharp / severe',
    weekdayHint: 'Saturday affinity in classical lists',
    goodFor: 'Tantra, sadhana, Hatha Yoga, animal training, hypnotism',
    energy: 'Sharp and severe; suited to intense practices',
  },
}

const MUKHAS: Record<MukhaId, MukhaMeta> = {
  Urdhvamukhi: {
    id: 'Urdhvamukhi',
    label: 'Urdhvamukhi',
    meaning: 'Upward-facing',
    goodFor: 'Multi-storey buildings, temples, parks — anything requiring upward growth',
  },
  Adhomukhi: {
    id: 'Adhomukhi',
    label: 'Adhomukhi',
    meaning: 'Downward-facing',
    goodFor: 'Wells, ponds, foundations, tunnels, basements, mines, drainage',
  },
  Tiryakmukhi: {
    id: 'Tiryakmukhi',
    label: 'Tiryakmukhi',
    meaning: 'Side-facing',
    goodFor: 'Roads, driving, travel, media / content delivery',
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

export function getAbhijitWindow(moonLonSidereal?: number | null): AbhijitWindow {
  const spanLabel = 'Makara 6°40′–10°53′20″ (within Uttara Ashadha)'
  if (moonLonSidereal == null || Number.isNaN(moonLonSidereal)) {
    return {
      active: false,
      spanLabel,
      note: 'Special 28th muhurta nakshatra — Laghu/Kshipra; check Moon longitude for Abhijit window.',
    }
  }
  const active = isAbhijitLongitude(moonLonSidereal)
  return {
    active,
    spanLabel,
    note: active
      ? 'Abhijit is active — treat as Laghu (Kshipra); excellent for light auspicious starts.'
      : 'Outside Abhijit span; use the current Moon nakshatra’s muhurta group.',
  }
}

/**
 * Classical “effects wherever it falls” — how the nakshatra colours
 * the house / life-area it occupies (compact teaching notes).
 * Index 0 = Ashwini … 26 = Revati.
 */
export const NAKSHATRA_FALL_EFFECTS: string[] = [
  // Ashwini
  'Quick starts and healing; rush energy; pioneering moves; vehicles and speed',
  // Bharani
  'Birth–death extremes; restraint and release; heavy karma; creative or reproductive pressure',
  // Krittika
  'Things get cut/refined; sharp communication; court/legal outcomes; purifying fire',
  // Rohini
  'Growth, beauty, and attraction; comfort and fertility; creative or material blossoming',
  // Mrigashira
  'Searching and roaming; curiosity; mild restlessness; hunting for options',
  // Ardra
  'Storms then clarity; emotional upheaval; research through crisis; transformative tears',
  // Punarvasu
  'Return and renewal; second chances; restoration after loss; hopeful rebound',
  // Pushya
  'Nourishment and protection; mentoring; steady care; auspicious support',
  // Ashlesha
  'Entanglement and secrecy; clinging bonds; shrewd strategy; venom then medicine',
  // Magha
  'Ancestral power and status; authority seats; legacy; pride of lineage',
  // Purva Phalguni
  'Pleasure, rest, and romance; celebration; creative leisure; union themes',
  // Uttara Phalguni
  'Contracts and patronage; lasting alliances; duty after pleasure; social standing',
  // Hasta
  'Skilled hands and craft; manipulation of detail; deals; clever problem-solving',
  // Chitra
  'Design, form, and flash; craftsmanship; image-making; sudden brilliant ideas',
  // Swati
  'Independence and airy movement; trade winds; self-reliance; flexible partnerships',
  // Vishakha
  'Ambition and forked aims; achievement drive; rivalry; goal fixation',
  // Anuradha
  'Friendship and devotion; occult loyalty; organised groups; hidden support',
  // Jyeshtha
  'Seniority and control; responsibility; protective dominance; mid-life authority',
  // Mula
  'Root disruption; uprooting; investigation to the core; endings that clear ground',
  // Purva Ashadha
  'Early victory energy; invincible push; pride; emotional conviction',
  // Uttara Ashadha
  'Later lasting victory; enduring fame; structured success; leadership that sticks',
  // Shravana
  'Listening and learning; news; counsel; pathways of knowledge and travel',
  // Dhanishtha
  'Rhythm, wealth, and music; status through skill; group prosperity; ambition',
  // Shatabhisha
  'Healing grids and secrecy; medicine; isolation for cure; technical mysteries',
  // Purva Bhadra
  'Fiery idealism; sacrifice; radical speech; scorched transformation',
  // Uttara Bhadra
  'Deep stability after ordeal; wisdom in depth; kundalini calm; enduring support',
  // Revati
  'Completion and safe passage; nourishment; endings that protect; journey’s close',
]

export function getNakshatraMuhurtaMeta(index: number, pada: number = 1): NakshatraMuhurtaMeta {
  const i = ((index % 27) + 27) % 27
  const chars = getNakshatraCharacteristics(i, pada)
  const group = GROUPS[GROUP_BY_INDEX[i]]
  const mukha = MUKHAS[MUKHA_BY_INDEX[i]]
  const shakti = NAKSHATRA_SHAKTI[i]
  const basicEnergy = `${chars.gana} · ${chars.yoni} yoni · ${shakti}`

  return {
    index: i,
    name: NAKSHATRA_NAMES[i],
    group,
    mukha,
    basicEnergy,
    fallEffect: NAKSHATRA_FALL_EFFECTS[i],
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
): AshwiniYogaNote[] {
  if (nakIndex !== 0) return []
  const notes: AshwiniYogaNote[] = []
  const isTue = varaNumber === 2
  const isThu = varaNumber === 4
  const isFri = varaNumber === 5
  const lunarDay = tithiNumber != null ? ((tithiNumber - 1) % 15) + 1 : null

  if (isTue || isThu || isFri) {
    notes.push({
      id: 'sarvartha_siddhi',
      label: 'Sarvartha Siddhi Yoga',
      quality: 'auspicious',
      detail: 'Ashwini on Tue/Thu/Fri — generally good for most work (see Vish Yoga caveat if Tue + Saptami).',
    })
  }
  if (isTue) {
    notes.push({
      id: 'amrit_siddhi',
      label: 'Amrit Siddhi Yoga',
      quality: 'caution',
      detail: 'Ashwini on Tuesday — auspicious overall, but avoid Griha Pravesh and house construction.',
    })
  }
  if (isTue && lunarDay === 7) {
    notes.push({
      id: 'vish_yoga',
      label: 'Vish Yoga (Madhu mein Vish)',
      quality: 'inauspicious',
      detail: 'Ashwini + Tuesday + Saptami — avoid all shubh karyas despite Amrit Siddhi label.',
    })
  }
  return notes
}

/** Compact Ashwini activity hints for muhurta UI */
export const ASHWINI_ACTIVITY_HINT = {
  favour: 'Horses/vehicles, pets, travel, plantation business, govt jobs, light finance (with empty 5/8/9 & Chara lagna caveat)',
  avoid: 'Agricultural ploughing/sowing and soil fertilisation timing',
}

export function formatNakshatraWeatherLine(meta: NakshatraMuhurtaMeta): string {
  return `${meta.group.label} · ${meta.mukha.label} — ${meta.group.goodFor}`
}

export function listMuhurtaNakGroups(): MuhurtaNakGroupMeta[] {
  return [GROUPS.Dhruva, GROUPS.Chara, GROUPS.Ugra, GROUPS.Mishra, GROUPS.Laghu, GROUPS.Mridu, GROUPS.Tikshna]
}
