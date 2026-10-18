// ─────────────────────────────────────────────────────────────
//  src/lib/engine/marsAnalysis.ts
//  Mangala: karakatva, upachaya, aspects, kalas, Mars–Ketu,
//  retro/combust, remedies — class teaching, chart-aware
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  MANGLIK_OVERVIEW,
  MARS_CONTROL_NOTE,
  getPlanetInHouse,
} from '@/lib/engine/houseInterpretations'
import {
  getDignityAwarePlanetInSign,
  getPlanetInHouseClassical,
  getPlanetInSignClassical,
  getSpecialAspectOverview,
  type ClassicalNote,
} from '@/lib/engine/classicalInterpretations'
import { getPlanetInSign } from '@/lib/engine/rashiInterpretations'
import { getVakriAstNotes } from '@/lib/engine/vakriAstInterpretations'
import {
  mixPlanetFromGraha,
  mixPlanetInHouseCatalogue,
  mixPlanetInSignCatalogue,
  type InterpLayer,
  type MixedPlanetPlacement,
} from '@/lib/engine/planetInterpretationMix'

export interface MarsSignificationGroup {
  category: string
  items: string[]
}

export interface MarsKalaDef {
  id: 'dhumra' | 'tejaswini' | 'martand' | 'kali'
  name: string
  sanskrit: string
  quality: string
  detail: string
}

export interface MarsAspectDef {
  span: 4 | 7 | 8
  name: string
  meaning: string
  detail: string
}

export interface MarsAspectHit {
  span: 4 | 7 | 8
  targetHouse: number
  teaching: MarsAspectDef
  note: string
}

export interface MarsHouseFocus {
  house: number
  title: string
  themes: string[]
  notes: string[]
}

export interface MarsFlag {
  id: string
  title: string
  active: boolean
  detail: string
}

export interface MarsKetuResult {
  active: boolean
  sepDeg: number | null
  sameSign: boolean
  placementTone: 'constructive' | 'intense' | 'neutral'
  detail: string
  positives: string[]
  negatives: string[]
}

export interface MarsClassicalHouseEntry {
  house: number
  isNatal: boolean
  classical: ClassicalNote[]
  /** Platform full house teaching (class notes) */
  platformFull: string | null
  platformSummary: string | null
  /** Mixed house-theme + classical + planet×house layers */
  mixedLayers: InterpLayer[]
}

export interface MarsClassicalSignEntry {
  rashi: Rashi
  rashiName: string
  isNatal: boolean
  classical: ClassicalNote[]
  /** Rashi-guide full planet-in-sign note */
  platformFull: string | null
  platformSummary: string | null
  /** Mixed rashi + planet×sign + psyche layers */
  mixedLayers: InterpLayer[]
}

export interface MarsClassicalBundle {
  /** Natal house: BPHS / Phaladeepika / etc. */
  natalHouseClassical: ClassicalNote[]
  /** Natal sign + dignity / vakri / asta modifiers */
  natalSignClassical: ClassicalNote[]
  vakriAst: ClassicalNote[]
  aspectOverviewClassical: ClassicalNote[]
  aspectTeachings: ClassicalNote[]
  allHouses: MarsClassicalHouseEntry[]
  allSigns: MarsClassicalSignEntry[]
  platformNatalHouseFull: string | null
  platformNatalSignFull: string | null
  /** Full mix: house + rashi + planet + nakshatra + dignity + lordship */
  natalMixed: MixedPlanetPlacement | null
}

export interface MarsAnalysisResult {
  mars: {
    rashi: Rashi
    rashiName: string
    nakshatraIndex: number
    nakshatraName: string
    pada: number
    house: number
    dignity: string
    degreeInSign: number
    isRetro: boolean
    isCombust: boolean
    ownSign: boolean
    exalted: boolean
    debilitated: boolean
    moolatrikona: boolean
  }
  karakatva: MarsSignificationGroup[]
  distinctions: string[]
  sports: string[]
  strengthVsCardio: string
  activityNote: string
  upachaya: {
    houses: number[]
    inUpachaya: boolean
    detail: string
  }
  houseFocus: MarsHouseFocus
  houseCaution: MarsFlag | null
  aspects: MarsAspectHit[]
  aspectOverview: string
  kalas: MarsKalaDef[]
  tantricKalasNote: string
  marsKetu: MarsKetuResult
  retroFlag: MarsFlag
  combustFlag: MarsFlag
  bothLimited: boolean
  professions: string[]
  remedies: string[]
  mythology: string[]
  manglikPositive: string
  manglikOverview: string
  controlNote: string
  spiritual: string[]
  naturalAge: number
  naturalAgeNote: string
  functionalMaleficCaution: MarsFlag
  signDualityNote: string
  classical: MarsClassicalBundle
  caveats: string[]
  methodology: string[]
  summaryAttrs: Array<{ label: string; value: string }>
}

export const UPACHAYA_HOUSES = [3, 6, 10, 11] as const

/** Lagnas where Mars is often a functional malefic in class teaching */
export const MARS_FUNCTIONAL_MALEFIC_LAGNAS: Rashi[] = [3, 6, 10] // Gemini, Virgo, Capricorn
export const MARS_PERSONAL_LOSS_HOUSES = [2, 4, 7, 8, 9] as const

export const MARS_ASPECTS: MarsAspectDef[] = [
  {
    span: 4,
    name: '4th aspect — protection',
    meaning: 'Guarding one’s fort / territory',
    detail:
      'Senāpati duty: watchful borders, selfless maternal-style protection of that house’s significations, leadership embedded in care. Protects rather than attacks.',
  },
  {
    span: 7,
    name: '7th aspect — partnership',
    meaning: 'Taking along / walking together',
    detail:
      'Gives power and drive to the house; the standard full aspect shared by all grahas.',
  },
  {
    span: 8,
    name: '8th aspect — elimination',
    meaning: 'Finishing sudden threats & conspiracies',
    detail:
      'Eliminates enemies/threats related to that house — does NOT automatically destroy the house’s own people (spouse, siblings, friends). Harsh interpersonal results appear mainly when Mars is functionally harmful for the chart.',
  },
]

export const MARS_KALAS: MarsKalaDef[] = [
  {
    id: 'dhumra',
    name: 'Dhumra',
    sanskrit: 'धुमरा',
    quality: 'Extreme aggression',
    detail: 'Very strong fighting/war skills; physically extremely strong.',
  },
  {
    id: 'tejaswini',
    name: 'Tejaswini',
    sanskrit: 'तेजस्विनी',
    quality: 'Leadership',
    detail: 'Powerful leadership; commanding appearance and personality.',
  },
  {
    id: 'martand',
    name: 'Martand',
    sanskrit: 'मार्तंड',
    quality: 'Destructive / surgical precision',
    detail: 'Power to uproot; surgical skill; excellent for mechanical engineers.',
  },
  {
    id: 'kali',
    name: 'Kali',
    sanskrit: 'काली',
    quality: 'Hidden / life-threatening power',
    detail: 'Internal knowledge (आंतरिक विद्या); rarely correlates with espionage themes.',
  },
]

export const MARS_KARAKATVA: MarsSignificationGroup[] = [
  {
    category: 'Property & land',
    items: [
      'Raw land, bank, real estate (not agricultural land specifically — use changes the form)',
    ],
  },
  {
    category: 'Physical',
    items: ['Muscles', 'Physical strength', 'Blood'],
  },
  {
    category: 'Technical & industry',
    items: ['Technical work / professions', 'Industrialist', 'Industrial enterprises'],
  },
  {
    category: 'Military & medical person',
    items: [
      'Arms & tools (शस्त्र/औजार), Army, Defense, Forces',
      'Surgeon (the person who wields instruments — not “surgery” as abstract process)',
    ],
  },
  {
    category: 'Relationships',
    items: [
      'Husband significator (female charts)',
      'Marital / interpersonal heat',
      'Brothers and sisters',
    ],
  },
  {
    category: 'Energy & conflict',
    items: [
      'Risk-taking, adventure, competitive drive',
      'Inner energy, aggression, “keep going” attitude',
      'Fighting, quarrels, violence, cutting (काटपीट)',
      'Growth, revolt, war',
    ],
  },
]

const HOUSE_FOCUS: Record<number, MarsHouseFocus> = {
  1: {
    house: 1,
    title: 'Mars in Lagna — personality rewrite',
    themes: ['Hyperactivity', 'Commander identity', 'Trait shift'],
    notes: [
      'Completely changes personality flavour — behaves differently from baseline lagna tone',
      'Can make the native hyperactive; Manglik house — pace partnerships consciously',
    ],
  },
  2: {
    house: 2,
    title: 'Mars in 2nd — speech & family heat',
    themes: ['Harsh speech', 'Family disturbance'],
    notes: [
      'Disturbs family life; bitter/harsh speech (कड़वे वचन)',
      'People avoid conversation — family and outsiders',
      'If Ketu joins here → extremely problematic in class teaching',
    ],
  },
  3: {
    house: 3,
    title: 'Mars in 3rd — upachaya courage',
    themes: ['Siblings', 'Valour', 'Effort'],
    notes: [
      'Strong upachaya seat — sibling happiness, courage (पराक्रम), strength for life challenges',
      'Hands, short efforts, competitive skill amplify',
    ],
  },
  4: {
    house: 4,
    title: 'Mars in 4th — home fort under fire',
    themes: ['Property', 'Mother comfort', 'Domestic agitation'],
    notes: [
      'Heat around home, emotional security, property — channel into constructive root action',
      'Watched classically for married-life comfort',
    ],
  },
  5: {
    house: 5,
    title: 'Mars in 5th — fight as love language',
    themes: ['Children', 'Romance', 'Intelligence heat'],
    notes: [
      'Not a preferred seat — conflicts with children / romance; Sun’s natural house → ego clashes',
      'Love language can become playful fighting / irritating others',
      'Sharp intellect; education energy can be fierce',
    ],
  },
  6: {
    house: 6,
    title: 'Mars in 6th — upachaya warrior',
    themes: ['Enemies', 'Disease fight', 'Competition'],
    notes: [
      'Excellent upachaya — defeats enemies and disease; surgical/competitive success when not ruined elsewhere',
    ],
  },
  7: {
    house: 7,
    title: 'Mars in 7th — partnership commander',
    themes: ['Marriage heat', 'Contracts', 'Independence'],
    notes: [
      'Kuja house — aggression, leadership, authority in marriage/business (all genders)',
      'Space and boundaries soften friction more than fatalism',
    ],
  },
  8: {
    house: 8,
    title: 'Mars in 8th — surgery, accident, research',
    themes: ['Sudden events', 'Shared resources', 'Intensity'],
    notes: [
      'Accidents/surgery vigilance, research courage, inheritance fights',
      'With Ketu: class example of frequent life-threatening accidents when badly configured',
      'Not automatically “bad” — dignity and chart decide',
    ],
  },
  9: {
    house: 9,
    title: 'Mars in 9th — strict dharma / father heat',
    themes: ['Father', 'Belief', 'Pilgrim warrior'],
    notes: [
      'Father may be strict / harsh-speaking; native may invent a divine father-figure (e.g. Shiva)',
      'Self-made spiritual rules; dharmic fighter energy',
      'Property lore often needs both Mars signs traced (see methodology)',
    ],
  },
  10: {
    house: 10,
    title: 'Mars in 10th — digbala career command',
    themes: ['Ambition', 'Technical / military success'],
    notes: [
      'Strong upachaya + career seat — command, technical drive, industrial/defense flavour',
    ],
  },
  11: {
    house: 11,
    title: 'Mars in 11th — gains through courage',
    themes: ['Networks', 'Elder siblings', 'Targets'],
    notes: [
      'Upachaya gains through courage and networks; elder-sibling energy strong',
    ],
  },
  12: {
    house: 12,
    title: 'Mars in 12th — private / foreign heat',
    themes: ['Expenses', 'Solitude', 'Bed comforts'],
    notes: [
      'Drive toward solitude, foreign settings, or behind-the-scenes effort',
      'Rest and boundaries matter; spiritual discipline can channel heat',
    ],
  },
}

function wholeSignHouse(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function angularSep(a: number, b: number): number {
  let d = Math.abs((((a - b) % 360) + 360) % 360)
  if (d > 180) d = 360 - d
  return d
}

function sameSignOrConjunct(a: GrahaData, b: GrahaData, orb = 8): boolean {
  return a.rashi === b.rashi || angularSep(a.lonSidereal, b.lonSidereal) <= orb
}

function aspectTargetHouse(marsHouse: number, span: number): number {
  return ((marsHouse - 1 + (span - 1)) % 12) + 1
}

function buildAspectHits(marsHouse: number): MarsAspectHit[] {
  return MARS_ASPECTS.map(teaching => {
    const targetHouse = aspectTargetHouse(marsHouse, teaching.span)
    return {
      span: teaching.span,
      targetHouse,
      teaching,
      note: `From H${marsHouse}, ${teaching.span}th aspect lands on H${targetHouse} — ${teaching.meaning.toLowerCase()}.`,
    }
  })
}

function marsKetuTone(house: number, ownOrExalted: boolean): MarsKetuResult['placementTone'] {
  if (UPACHAYA_HOUSES.includes(house as 3 | 6 | 10 | 11) && ownOrExalted) return 'constructive'
  if ([8, 1, 2, 7].includes(house)) return 'intense'
  if (ownOrExalted || UPACHAYA_HOUSES.includes(house as 3 | 6 | 10 | 11)) return 'constructive'
  return 'neutral'
}

/**
 * Natal Mangala analysis from class teaching notes.
 */
export function analyzeMars(chart: ChartOutput): MarsAnalysisResult | null {
  const mars = chart.grahas.find(g => g.id === 'Ma')
  if (!mars) return null

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(mars.rashi, asc)
  const ketu = chart.grahas.find(g => g.id === 'Ke')
  const sun = chart.grahas.find(g => g.id === 'Su')

  const ownSign = mars.rashi === 1 || mars.rashi === 8
  const exalted = mars.rashi === 10 || mars.dignity === 'exalted'
  const debilitated = mars.rashi === 4 || mars.dignity === 'debilitated'
  const moolatrikona = mars.rashi === 1 // Aries moolatrikona seat in teaching
  const isCombust =
    mars.isCombust ||
    (sun ? angularSep(mars.lonSidereal, sun.lonSidereal) < 17 : false)

  const houseFocus = HOUSE_FOCUS[house] ?? {
    house,
    title: `Mars in house ${house}`,
    themes: [],
    notes: ['Judge dignity, aspects, and functional nature for this lagna.'],
  }

  const inUpachaya = UPACHAYA_HOUSES.includes(house as 3 | 6 | 10 | 11)
  const aspects = buildAspectHits(house)

  const withKetu = ketu ? sameSignOrConjunct(mars, ketu) : false
  const ketuSep = ketu ? angularSep(mars.lonSidereal, ketu.lonSidereal) : null
  const ketuTone = withKetu ? marsKetuTone(house, ownSign || exalted) : 'neutral'

  const marsKetu: MarsKetuResult = {
    active: withKetu,
    sepDeg: withKetu ? ketuSep : null,
    sameSign: !!(ketu && mars.rashi === ketu.rashi),
    placementTone: withKetu ? ketuTone : 'neutral',
    detail: withKetu
      ? ketuTone === 'constructive'
        ? 'Mars–Ketu active with relatively supportive house/dignity — class notes allow deep spirituality, tantra, surgery excellence, or defense medals when the chart supports.'
        : ketuTone === 'intense'
          ? 'Mars–Ketu active in a high-heat house — class notes warn of accidents, surgeries, cutting, criminal charts when badly configured; past-life issues surface. With Moon involvement, treat as high-caution combination.'
          : 'Mars–Ketu active — two fires: anger-fire (Mars) vs sadhana-fire (Ketu). Ketu detaches; Mars pushes forward → lifelong internal conflict. Results swing by house and sign.'
      : 'No close Mars–Ketu conjunction under this module’s orb. Class teaching calls this pair one of the hardest when badly placed — and one of the most powerful when well placed.',
    positives: [
      'Takes spirituality / tantra very far when well placed',
      'Excellent surgeons; defense services with top-level medals/honors',
    ],
    negatives: [
      'Two volcanoes erupting — Ketu behaves Mars-like; havoc when badly placed',
      'Accidents, surgeries, life-threatening situations; criminal charts when extreme',
      'Mars + Ketu + Moon = very dangerous combination in class warning',
    ],
  }

  const lagnaFunctional = MARS_FUNCTIONAL_MALEFIC_LAGNAS.includes(asc)
  const inPersonalLossHouse = (MARS_PERSONAL_LOSS_HOUSES as readonly number[]).includes(house)
  const functionalMaleficCaution: MarsFlag = {
    id: 'functional_malefic',
    title: 'Functional-malefic lagna caution',
    active: lagnaFunctional && inPersonalLossHouse,
    detail: lagnaFunctional && inPersonalLossHouse
      ? `For ${RASHI_NAMES[asc]} lagna, Mars in H${house} (watched houses 2/4/7/8/9) is a class caution: personal losses (relationship fights, health, accidents, surgeries, harassment) can outweigh money themes — Mars often does not “merely” give financial loss.`
      : lagnaFunctional
        ? `${RASHI_NAMES[asc]} lagna: Mars is often a functional malefic — watch houses 2, 4, 7, 8, 9 especially. Current Mars in H${house} is outside that personal-loss set.`
        : 'Functional-malefic personal-loss set (Gemini / Virgo / Capricorn lagnas with Mars in 2/4/7/8/9) not indicated for this chart.',
  }

  const houseCaution: MarsFlag | null =
    house === 1 || house === 5
      ? {
          id: 'house_caution',
          title: house === 1 ? 'Lagna hyperactivity risk' : '5th-house conflict risk',
          active: true,
          detail:
            house === 1
              ? 'Mars in 1st rewrites personality traits and can make the native hyperactive.'
              : 'Mars in 5th can turn love/children/education into conflict fields — ego clashes in Sun’s natural house.',
        }
      : null

  const remedies: string[] = [
    'Primary chart deity for Mars: Hanuman Ji (Mars as Hanuman avatar in kundali teaching)',
    'Also: Kartikeya, Chamunda',
    'Extremely afflicted: Lord Vishnu — Nārāyaṇa Kavach; Narasimha puja',
    'Mangalnath Temple, Ujjain — Mars birthplace lore; भात का अभिषेक for Mars problems',
    'Manglik marriage lore: first symbolic marriage with Vishnu (Peepal / Kumbh / Krishna idol) before human marriage in some traditions',
  ]
  if (withKetu && ketuTone === 'intense') {
    remedies.unshift('With harsh Mars–Ketu: prioritize Hanuman / Vishnu pacification and avoid reckless physical risk until dasha context is clear.')
  }
  if (mars.rashi === 8 && house === 9) {
    remedies.push('Scorpio Mars in 9th class note: inclination may lean Shiva even while Hanuman remains the general Mars deity.')
  }

  const allHouses: MarsClassicalHouseEntry[] = []
  for (let h = 1; h <= 12; h++) {
    allHouses.push({
      house: h,
      isNatal: h === house,
      classical: getPlanetInHouseClassical('Ma', h),
      platformFull: getPlanetInHouse('Ma', h, 'full'),
      platformSummary: getPlanetInHouse('Ma', h, 'summary'),
      mixedLayers: mixPlanetInHouseCatalogue('Ma', h, 'Mars'),
    })
  }

  const allSigns: MarsClassicalSignEntry[] = []
  for (let r = 1; r <= 12; r++) {
    const rr = r as Rashi
    allSigns.push({
      rashi: rr,
      rashiName: RASHI_NAMES[rr],
      isNatal: rr === mars.rashi,
      classical: getPlanetInSignClassical('Ma', rr),
      platformFull: getPlanetInSign('Ma', rr, 'full'),
      platformSummary: getPlanetInSign('Ma', rr, 'summary'),
      mixedLayers: mixPlanetInSignCatalogue('Ma', rr, 'Mars'),
    })
  }

  const aspectTeachings: ClassicalNote[] = dataAspectClassicalNotes(aspects)
  const vakriAst = getVakriAstNotes('Ma', mars.isRetro, isCombust, mars.dignity, 'full')
  const natalSignClassical = getDignityAwarePlanetInSign(
    'Ma',
    mars.rashi,
    mars.dignity,
    isCombust,
    mars.isRetro,
    'full',
  )
  const natalMixed = mixPlanetFromGraha(
    { ...mars, isCombust, name: 'Mars' },
    house,
    asc,
    'all',
  )

  const classical: MarsClassicalBundle = {
    natalHouseClassical: getPlanetInHouseClassical('Ma', house),
    natalSignClassical,
    vakriAst,
    aspectOverviewClassical: getSpecialAspectOverview('Ma'),
    aspectTeachings,
    allHouses,
    allSigns,
    platformNatalHouseFull: getPlanetInHouse('Ma', house, 'full'),
    platformNatalSignFull: getPlanetInSign('Ma', mars.rashi, 'full'),
    natalMixed,
  }

  return {
    mars: {
      rashi: mars.rashi,
      rashiName: RASHI_NAMES[mars.rashi],
      nakshatraIndex: mars.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[mars.nakshatraIndex],
      pada: mars.pada,
      house,
      dignity: mars.dignity,
      degreeInSign: mars.degree,
      isRetro: mars.isRetro,
      isCombust,
      ownSign,
      exalted,
      debilitated,
      moolatrikona,
    },
    karakatva: MARS_KARAKATVA,
    distinctions: [
      'Mars = surgeon (person with शस्त्र in hand), not “surgery” as abstract medical field alone',
      'Mars = raw land; agricultural / put-to-use land is a changed form — not the primary signification',
    ],
    sports: [
      'Gymnastics (primary sport to weigh)',
      'Badminton',
      'Tennis',
      'Football',
      'Swimming',
      'Outdoor sports requiring muscular / physical energy',
    ],
    strengthVsCardio:
      'Strength / weight training → Mars. Cardio (running, continuous movement) is read separately. Afflicted Mars may worsen hyperactivity with heavy weights — cardio that burns inner heat can suit better. Judge by sign and condition.',
    activityNote:
      'If Mars is very good, the person cannot sit idle — always doing something (kitchen innovation, projects, training). Manglik positive trait: can work until death if they choose; constructive vs destructive depends on placement.',
    upachaya: {
      houses: [...UPACHAYA_HOUSES],
      inUpachaya,
      detail: inUpachaya
        ? `Mars in H${house} — upachaya seat (3/6/10/11). Class teaching: Mars gives very good results here — sibling happiness, courage, strength to meet challenges.`
        : `Mars in H${house} — outside upachaya (3/6/10/11). Still judge dignity; 1st and 5th are specially cautioned for personality rewrite / children-romance conflict.`,
    },
    houseFocus,
    houseCaution,
    aspects,
    aspectOverview:
      'Always weigh Mars’s special 4th and 8th aspects — never blunt-predict from house alone. 8th aspect removes threats to a house; it does not mean automatic fights with that house’s people unless Mars is functionally bad.',
    kalas: MARS_KALAS,
    tantricKalasNote:
      'In tantra, Mars has 16 kalas (Tejas / Shaurya kala) — separate deep track from the four classical kalas above.',
    marsKetu,
    retroFlag: {
      id: 'retro',
      title: 'Retrograde Mars',
      active: mars.isRetro,
      detail: mars.isRetro
        ? 'Obsessive behaviour; either excessive body-building or total neglect of physique; significations turn inward; slow to recognize own capability and control energy; old problems resurface. Similar pattern when retro Mars activates in dasha.'
        : 'Mars not retrograde — expression more outward than the vakri internalization pattern.',
    },
    combustFlag: {
      id: 'combust',
      title: 'Combust Mars',
      active: isCombust,
      detail: isCombust
        ? 'Shows as fearless/tireless outwardly; at the real moment may say “you go, I’m coming” — courage and पराक्रम diminish when action is required.'
        : 'Mars not combust — courage significations less eclipsed by solar heat.',
    },
    bothLimited: mars.isRetro && isCombust,
    professions: [
      'Mechanical / civil engineers, robotics, defense machinery',
      'Surgeon, hematologist (blood)',
      'Industrialist, Army / Defense',
      'Sports requiring physical strength',
    ],
    remedies,
    mythology: [
      'Bhasmāsura: Shiva’s boon of touch-to-ash → Vishnu as Mohini tricks the demon into self-destruction — why Vishnu pacifies extreme Mars',
      'Mars’s biggest planetary enemy is Mercury, but Vishnu is the controller in remedy lore',
      'Mars carries Tridev qualities: creation, protection, and destruction',
      'In kundali, Mars IS Hanuman Ji — specific placements may shift inclination to Vishnu, Rāma, or Shiva',
    ],
    manglikPositive:
      'Most positive Manglik trait: never sits idle — lifelong engagement capacity. Whether activity builds or destroys depends on sign, house, and full chart.',
    manglikOverview: MANGLIK_OVERVIEW,
    controlNote: MARS_CONTROL_NOTE,
    spiritual: [
      'Well-placed Mars: top-level spiritual persons with real शक्तियां; deep tantra / sadhana',
      'Want peace but anger erupts like a volcano after suppression',
      'Self-teachers — ask themselves, find answers, then believe; create own spiritual rules',
      'Practical bhakti example: milk to beggars over ritual pouring — “that is my spirituality”',
    ],
    naturalAge: 28,
    naturalAgeNote:
      'Mars’s natural age ~28 — significations (donations, mature Martian behaviour) strengthen after this; Manglik marriage-fear readings also soften around this age in class teaching.',
    functionalMaleficCaution,
    signDualityNote:
      'Aries (fire, moolatrikona) vs Scorpio (water, fixed): Mars owns contradictory seats — same planet, different indications. Same Scorpio Mars in H5 vs H9 can read as sky-and-earth difference.',
    classical,
    caveats: [
      'No chart is purely good or bad — always balanced',
      'Never blunt-predict on Mars alone; special aspects always apply',
      'Mars in 7th or 8th is not automatically bad — chart-specific',
      'Decode Moon → emotions of the kundali; decode Mars → the native’s ACTIVITIES',
      'Seek hidden facts (both signs owned, 2nd-from / 8th-from links) — surface abroad/job calls are easy',
      'Parashari system: Rahu/Ketu are not assigned sign lordship (some texts give Ketu Scorpio co-rule — class follows Parashara)',
    ],
    methodology: [
      'Layer: Mars energy → house → sign (Aries vs Scorpio duality) → degree/nakshatra → aspects 4/7/8 → yuti (esp. Ketu) → dasha',
      'Trace significations through BOTH signs Mars owns when predicting property/money conversion themes',
      'Lifetime properties of the chart beat short-term gossip predictions',
      'Same own-sign Mars in different houses → completely different life stories',
    ],
    summaryAttrs: [
      { label: 'Element', value: 'Fire (अग्नि)' },
      { label: 'Color', value: 'Red' },
      { label: 'Own signs', value: 'Aries (moolatrikona), Scorpio' },
      { label: 'Best houses', value: '3, 6, 10, 11 (upachaya)' },
      { label: 'Aspects', value: '4th protect · 7th partner · 8th eliminate threats' },
      { label: 'Deity', value: 'Hanuman (primary)' },
      { label: 'Sacred place', value: 'Mangalnath, Ujjain' },
      { label: 'Natural age', value: '28' },
      { label: 'Enemy', value: 'Mercury' },
    ],
  }
}

function dataAspectClassicalNotes(aspects: MarsAspectHit[]): ClassicalNote[] {
  return aspects.map(a => ({
    source: 'Teaching' as const,
    ref: `Ma ${a.span}→H${a.targetHouse}`,
    text: `${a.teaching.name}: ${a.teaching.detail} ${a.note}`,
  }))
}
