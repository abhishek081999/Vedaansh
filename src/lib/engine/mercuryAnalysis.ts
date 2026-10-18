// ─────────────────────────────────────────────────────────────
//  src/lib/engine/mercuryAnalysis.ts
//  Budha: karakatva, houses, combust/vakri, mythology, remedies —
//  class teaching notes, chart-aware
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getPlanetInHouse } from '@/lib/engine/houseInterpretations'
import {
  getDignityAwarePlanetInSign,
  getPlanetInHouseClassical,
  getPlanetInSignClassical,
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

export interface MercurySignificationGroup {
  category: string
  items: string[]
}

export interface MercuryHouseFocus {
  house: number
  title: string
  themes: string[]
  notes: string[]
  difficulty: 'supportive' | 'neutral' | 'problematic' | 'most_problematic'
}

export interface MercuryFlag {
  id: string
  title: string
  active: boolean
  detail: string
}

export interface MercuryCompanion {
  id: GrahaId
  name: string
  sepDeg: number
  sameSign: boolean
}

export interface MercuryClassicalHouseEntry {
  house: number
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface MercuryClassicalSignEntry {
  rashi: Rashi
  rashiName: string
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface MercuryClassicalBundle {
  natalHouseClassical: ClassicalNote[]
  natalSignClassical: ClassicalNote[]
  vakriAst: ClassicalNote[]
  allHouses: MercuryClassicalHouseEntry[]
  allSigns: MercuryClassicalSignEntry[]
  platformNatalHouseFull: string | null
  platformNatalSignFull: string | null
  natalMixed: MixedPlanetPlacement | null
}

export interface MercuryConditionEffects {
  negatives: string[]
  positives: string[]
}

export interface MercuryAnalysisResult {
  mercury: {
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
    combustOrbUsed: number
    sepFromSunDeg: number | null
    ownSign: boolean
    exalted: boolean
    debilitated: boolean
    moolatrikona: boolean
    nearExaltPeak: boolean
    nearDebilPeak: boolean
  }
  nature: string[]
  karakatva: MercurySignificationGroup[]
  medical: MercurySignificationGroup[]
  vedicRoles: Array<{ veda: string; role: string }>
  houseFocus: MercuryHouseFocus
  allHouseFocus: MercuryHouseFocus[]
  houseCaution: MercuryFlag | null
  problematicHouses: number[]
  inProblematicHouse: boolean
  companions: MercuryCompanion[]
  companionNote: string
  moonEnemyFlag: MercuryFlag
  retroFlag: MercuryFlag
  combustFlag: MercuryFlag
  bothFlag: MercuryFlag
  retroEffects: MercuryConditionEffects
  combustEffects: MercuryConditionEffects
  bothEffects: MercuryConditionEffects
  twelfthPastLife: MercuryFlag
  needsSupport: string[]
  oneLiner: string
  mythology: string[]
  curses: string[]
  professions: string[]
  languagesNote: string
  remedies: string[]
  rudrakshaNote: string
  naturalAge: number
  naturalAgeNote: string
  relationships: {
    enemy: string
    neutrals: string[]
    note: string
  }
  classical: MercuryClassicalBundle
  caveats: string[]
  methodology: string[]
  summaryAttrs: Array<{ label: string; value: string }>
}

/** Class teaching: 9th most difficult, then 7th and 12th */
export const MERCURY_PROBLEMATIC_HOUSES = [9, 7, 12] as const

/** Combustion orbs from class notes: 14° direct, 12° when vakri */
export const MERCURY_COMBUST_ORB_DIRECT = 14
export const MERCURY_COMBUST_ORB_RETRO = 12

/** Nakshatra indices (0-based) ruled by Mercury */
export const MERCURY_NAKSHATRAS = [
  { index: 8, name: 'Ashlesha' },
  { index: 17, name: 'Jyeshtha' },
  { index: 26, name: 'Revati' },
] as const

export const MERCURY_KARAKATVA: MercurySignificationGroup[] = [
  {
    category: 'Core intellect',
    items: [
      'Intelligence (बुद्धि) — analytical thinking',
      'Communication (संचार) — all forms of expression',
      'Logic and debate (तर्क-वितर्क)',
      'Education and learning',
      'Knowledge storage and application — not only gaining, but using',
    ],
  },
  {
    category: 'Commerce & craft',
    items: [
      'Business (व्यापार), trade, accounts, bookkeeping',
      'Mathematics (गणित), statistics',
      'Technical / specialised skills',
      'Writing (लेखन), media, journalism',
      'Intraday / short-horizon trading decisions',
    ],
  },
  {
    category: 'People & movement',
    items: [
      'Cousins (paternal / maternal)',
      'Short travel and local journeys',
      'Stand-up comedy / wit / humour',
      'Behaves like the company kept — takes on yuti nature',
    ],
  },
  {
    category: 'Special arts',
    items: [
      'Astrology accuracy when Mercury is strong',
      'Numerology',
      'Sign language, Morse / ciphers, classical scripts',
      'Graphology (handwriting micro-analysis)',
      'Hypnotism / persuasive speech power when strong',
    ],
  },
]

export const MERCURY_MEDICAL: MercurySignificationGroup[] = [
  {
    category: 'Primary medical',
    items: [
      'Nervous system (तंत्रिका / स्नायु तंत्र)',
      'Brain as convergence of Saturn (veins/aging), Moon (mind), Mars (blood/energy)',
      'Skin (त्वचा) — skin issues when Mercury is involved',
      'Neurological pathway disorders (distinct from Moon’s hemorrhage domain)',
      'Autism indicators when Mercury is badly afflicted',
      'Stammering / stuttering (especially combust + retrograde)',
    ],
  },
  {
    category: 'Distinctions (not Mercury primary)',
    items: [
      'Brain hemorrhage etc. → primarily Moon',
      'Psoriasis-type skin lore → primarily Sun (esp. fire-sign lagna)',
      'Hair fall → Jupiter + Mars; complete baldness → Sun; premature greying ~15–16 → Moon',
      'Sun + Mercury alone does NOT mean spectacles — eyes from 2nd/12th + Sun + Moon + dasha',
    ],
  },
]

const HOUSE_FOCUS: Record<number, MercuryHouseFocus> = {
  1: {
    house: 1,
    title: 'Mercury in Lagna — youthful intellect on the body-self',
    themes: ['Wit', 'Restlessness', 'Adaptive identity'],
    difficulty: 'neutral',
    notes: [
      'Youthful, analytical presence; speech and fidgety curiosity colour the personality',
      'Needs a supporting graha — alone Mercury is the prince without a king’s seal',
    ],
  },
  2: {
    house: 2,
    title: 'Mercury in 2nd — speech wealth & family talk',
    themes: ['Eloquence', 'Trade speech', 'Family debates'],
    difficulty: 'neutral',
    notes: [
      'Wealth and family through intellect/trade; speech becomes the earning tool',
      'Debates in the family circle are common when Mercury is restless',
    ],
  },
  3: {
    house: 3,
    title: 'Mercury in 3rd — writing & short efforts',
    themes: ['Writing', 'Skills', 'Siblings / courage of mind'],
    difficulty: 'supportive',
    notes: [
      'Class teaching: even debilitated Mercury here can give excellent emotional writing, lyric, poetry',
      'Short journeys and communicative skills amplify',
    ],
  },
  4: {
    house: 4,
    title: 'Mercury in 4th — restless home mind',
    themes: ['Education at home', 'Routine chaos', 'Mother wit'],
    difficulty: 'neutral',
    notes: [
      'If debilitated: family life can become अस्त-व्यस्त — chaotic eating/sleeping routines',
      'May over-smart property deals and still make foolish moves; vehicle losses possible',
    ],
  },
  5: {
    house: 5,
    title: 'Mercury in 5th — buddhi & mantra seat',
    themes: ['Intelligence', 'Mantra', 'Children clever'],
    difficulty: 'supportive',
    notes: [
      'Sharp buddhi, speculative intellect; children often clever',
      'Combust here still supports writing and silent strategic mind when Sun is mature',
    ],
  },
  6: {
    house: 6,
    title: 'Mercury in 6th — audit & debate warrior',
    themes: ['Analysis', 'Accounts', 'Speech enemies'],
    difficulty: 'supportive',
    notes: [
      'Strong analytical / auditing power; big-picture + micro simultaneously',
      'Negative: creates enemies through speech (शत्रु via words); weak at self-serving micro-management',
    ],
  },
  7: {
    house: 7,
    title: 'Mercury in 7th — fluctuating partnerships',
    themes: ['Clever partner', 'Trade marriage', 'Immature relating'],
    difficulty: 'problematic',
    notes: [
      'Class teaching: often not preferred — partnership mind stays youthful and changeable',
      'On 1–7 axis with Moon: maximum immature relationship decisions',
    ],
  },
  8: {
    house: 8,
    title: 'Mercury in 8th — research & occult speech',
    themes: ['Research', 'Crisis intellect', 'Hidden codes'],
    difficulty: 'neutral',
    notes: [
      'Research speech, occult study; intellect survives through crisis',
      'Gambling/speculation lore when Rahu joins 5/8/11 with Mercury',
    ],
  },
  9: {
    house: 9,
    title: 'Mercury in 9th — most uncomfortable seat',
    themes: ['Father / dharma heat', 'Guru household lore', 'Immature fortune'],
    difficulty: 'most_problematic',
    notes: [
      'Class: sabse zyada खराब — Jupiter’s house energy suppresses youthful Mercury',
      'Mythology: Jupiter’s household is where Mercury felt suspicion and discomfort',
      '9th demands maturity, seriousness, devotion — qualities Mercury fundamentally lacks as Kumar',
      'Even own/exalted here: results come with discomfort; prediction accuracy may suffer for astrologers',
    ],
  },
  10: {
    house: 10,
    title: 'Mercury in 10th — career of communication',
    themes: ['Trade career', 'Counsel', 'Public intellect'],
    difficulty: 'supportive',
    notes: [
      'Career in communication, accounting, counsel, trade — Rama case study seat in class notes',
      'Needs Sun/Moon/Jupiter support to convert ideas into lasting authority',
    ],
  },
  11: {
    house: 11,
    title: 'Mercury in 11th — gains via ideas & friends',
    themes: ['Networks', 'Multiple income ideas', 'Cousins'],
    difficulty: 'supportive',
    notes: [
      'Gains through intellect and friends; many unfinished ideas unless a base planet steadies',
    ],
  },
  12: {
    house: 12,
    title: 'Mercury in 12th — past-life mind & foreign speech',
    themes: ['Solitary study', 'Foreign languages', 'Past-life resolution'],
    difficulty: 'problematic',
    notes: [
      'Generally watched; can open past-life connections and spiritual insight when supported',
      'Retro + combust + 12th: unfinished relationships/work resurface toward resolution',
      'Pisces in 12th: past-life hints via dreams or meditation',
    ],
  },
}

const COMBUST_EFFECTS: MercuryConditionEffects = {
  negatives: [
    'Confidence shaken; self-doubt increases',
    'Decision-making power weakens',
    'Communication timing off — cannot say the right thing at the right time',
    'Expression problems; illogical arguments replace crisp debate',
    'Travel plans postponed or cancelled frequently',
  ],
  positives: [
    'Deep thinking ability increases — profound thinker',
    'Understanding others’ and own emotions becomes highly active',
    'Writing skills become hyperactive — strong solitary written expression',
    'Strong internal emotional intelligence',
  ],
}

const RETRO_EFFECTS: MercuryConditionEffects = {
  negatives: [
    'Decision paralysis — analysis without deciding',
    'Frequent misunderstandings both ways',
    'Deeply attached to the past (memories, relationships, achievements)',
    'Constant relationship re-evaluation (पुनर्मूल्यांकन)',
    'Travel plans cancelled or postponed',
  ],
  positives: [
    'Analytical skills increase significantly',
    'Attraction to ancient knowledge, archaeology, historical texts',
    'Silent strategic intelligence — brain shows in work more than speech',
  ],
}

const BOTH_EFFECTS: MercuryConditionEffects = {
  negatives: [
    'Extreme confusion — highest confusion band',
    'Severe decision delay — decides only when the matter has gone out of hand',
    'Stammering at critical communication moments',
    'Over-evaluation until the decision becomes useless',
    'Travel disruption worse than combust or vakri alone',
  ],
  positives: [
    'Quick disconnection from society / exterior noise when needed',
    'Spiritual activation accelerates if they lean even slightly toward sadhana',
    'Deep internal processing of inner vs outer identity',
    'Sudden epiphany (आहत) / inner-signal guidance',
  ],
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

/**
 * Natal Budha analysis from class teaching notes.
 */
export function analyzeMercury(chart: ChartOutput): MercuryAnalysisResult | null {
  const mercury = chart.grahas.find(g => g.id === 'Me')
  if (!mercury) return null

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(mercury.rashi, asc)
  const sun = chart.grahas.find(g => g.id === 'Su')
  const moon = chart.grahas.find(g => g.id === 'Mo')

  const ownSign = mercury.rashi === 3 || mercury.rashi === 6
  const exalted = mercury.rashi === 6 || mercury.dignity === 'exalted'
  const debilitated = mercury.rashi === 12 || mercury.dignity === 'debilitated'
  const moolatrikona = mercury.rashi === 6
  const nearExaltPeak = mercury.rashi === 6 && Math.abs(mercury.degree - 15) <= 3
  const nearDebilPeak = mercury.rashi === 12 && Math.abs(mercury.degree - 15) <= 3

  const sepFromSun = sun ? angularSep(mercury.lonSidereal, sun.lonSidereal) : null
  const combustOrbUsed = mercury.isRetro ? MERCURY_COMBUST_ORB_RETRO : MERCURY_COMBUST_ORB_DIRECT
  const isCombust =
    mercury.isCombust ||
    (sepFromSun != null ? sepFromSun < combustOrbUsed : false)

  const houseFocus = HOUSE_FOCUS[house] ?? {
    house,
    title: `Mercury in house ${house}`,
    themes: [],
    notes: ['Judge dignity, yuti, and functional nature for this lagna.'],
    difficulty: 'neutral' as const,
  }

  const inProblematicHouse = (MERCURY_PROBLEMATIC_HOUSES as readonly number[]).includes(house)

  const houseCaution: MercuryFlag | null = inProblematicHouse
    ? {
        id: 'house_caution',
        title:
          house === 9
            ? '9th house — most uncomfortable'
            : house === 7
              ? '7th house — partnership caution'
              : '12th house — past-life / isolation caution',
        active: true,
        detail: houseFocus.notes[0] ?? `Mercury in H${house} is classically watched.`,
      }
    : debilitated && house === 4
      ? {
          id: 'house_caution',
          title: 'Debilitated Mercury in 4th — home chaos risk',
          active: true,
          detail:
            'Neech Budha in 4th: disorganized family routine, shallow home vibe, over-smart property moves that backfire.',
        }
      : null

  const companionIds: GrahaId[] = ['Su', 'Mo', 'Ma', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
  const companions: MercuryCompanion[] = []
  for (const id of companionIds) {
    const g = chart.grahas.find(x => x.id === id)
    if (!g || !sameSignOrConjunct(mercury, g)) continue
    companions.push({
      id,
      name: GRAHA_NAMES[id] ?? id,
      sepDeg: angularSep(mercury.lonSidereal, g.lonSidereal),
      sameSign: mercury.rashi === g.rashi,
    })
  }
  companions.sort((a, b) => a.sepDeg - b.sepDeg)

  const companionNote =
    companions.length > 0
      ? `Mercury sits with ${companions.map(c => c.name).join(', ')} — class teaching: Budha behaves like the company he keeps; decode results through these yuti first.`
      : 'No close yuti under this module’s orb — Mercury is relatively alone. Alone Mercury still works (~90% potential) but needs a father-figure / base planet for full expression.'

  const withMoon = companions.some(c => c.id === 'Mo')
  const moonEnemyFlag: MercuryFlag = {
    id: 'moon_enemy',
    title: 'Moon — natural enemy lore',
    active: withMoon,
    detail: withMoon
      ? 'Mercury–Moon yuti active. Biological-father lore: relationship is fluctuating (फेरबदल) — sometimes supportive for performance, sometimes emotionally confusing. Immature relationship decisions amplify on 1–7 axis patterns.'
      : 'Moon is Mercury’s natural enemy in class teaching (birth scandal lore). Current chart: no close Mercury–Moon conjunction under this module’s orb. Still weigh Moon’s support vs friction for speech/mind.',
  }

  const retroFlag: MercuryFlag = {
    id: 'retro',
    title: 'Retrograde Mercury (वक्रि बुध)',
    active: mercury.isRetro,
    detail: mercury.isRetro
      ? 'Vakri Budha: analysis up, decision paralysis, past attachment, misunderstandings, ancient-knowledge pull. Activation lore ~18–22.'
      : 'Mercury not retrograde — expression more forward than the vakri re-evaluation pattern.',
  }

  const combustFlag: MercuryFlag = {
    id: 'combust',
    title: 'Combust Mercury (अस्त बुध)',
    active: isCombust,
    detail: isCombust
      ? `Within ~${combustOrbUsed}° of Sun${sepFromSun != null ? ` (sep ${sepFromSun.toFixed(1)}°)` : ''}. Common — do not read as weak intelligence. Confidence/speech timing weaken; writing and deep thinking often strengthen. Classify by Sun’s maturity.`
      : `Mercury not combust (orb ${combustOrbUsed}° ${mercury.isRetro ? 'vakri' : 'direct'}). Speech significations less eclipsed by solar heat.`,
  }

  const bothActive = mercury.isRetro && isCombust
  const bothFlag: MercuryFlag = {
    id: 'both',
    title: 'Combust + Retrograde',
    active: bothActive,
    detail: bothActive
      ? 'Highest confusion / decision-delay band; stammering at critical moments possible; past resurfaces strongly in Mercury dasha. Also: rapid spiritual activation and quick social disconnection when conscious.'
      : 'Combust + vakri combination not indicated together.',
  }

  const twelfthPastLife: MercuryFlag = {
    id: 'twelfth_past',
    title: '12th-house past-life activation',
    active: house === 12 || (bothActive && house === 12),
    detail:
      house === 12 && bothActive
        ? 'Retro + combust + 12th: broken/incomplete relationships and unfinished past work resurface toward resolution; dreams/meditation may carry past-life hints (stronger if Pisces).'
        : house === 12
          ? 'Mercury in 12th: birth purpose can include resolving past-life karmas through speech, study, or solitude.'
          : 'Mercury not in 12th — 12th past-life speech pattern not primary from house seat.',
  }

  const remedies: string[] = [
    '4 Mukhi Rudraksha (Mercury) — activate (जागृत) with abhishek + “Om Akshamalaye Namah” ×108 before wearing',
    'Emerald (पन्ना) only if the full chart supports — not mandatory for all',
    'Hari moong, green cloth; copper (shared with Mars)',
    'Deities: Lord Vishnu / Buddha avatara lore; also Ganesha for obstacle-clear speech',
    'Prefer internal remedies (confidence, focus discipline, journaling) when the chart shows the native cannot follow ritual rules',
  ]
  if (bothActive) {
    remedies.unshift(
      'Combust + vakri: prioritize journaling, input-filtering, and short daily silence before gemstone/rudraksha prescriptions.',
    )
  }
  if (house === 9) {
    remedies.push(
      'In 9th: do not force Mercury remedies that ignore Jupiter/dharma friction — steady a mentor/base planet first.',
    )
  }

  const allHouses: MercuryClassicalHouseEntry[] = []
  for (let h = 1; h <= 12; h++) {
    allHouses.push({
      house: h,
      isNatal: h === house,
      classical: getPlanetInHouseClassical('Me', h),
      platformFull: getPlanetInHouse('Me', h, 'full'),
      platformSummary: getPlanetInHouse('Me', h, 'summary'),
      mixedLayers: mixPlanetInHouseCatalogue('Me', h, 'Mercury'),
    })
  }

  const allSigns: MercuryClassicalSignEntry[] = []
  for (let r = 1; r <= 12; r++) {
    const rr = r as Rashi
    allSigns.push({
      rashi: rr,
      rashiName: RASHI_NAMES[rr],
      isNatal: rr === mercury.rashi,
      classical: getPlanetInSignClassical('Me', rr),
      platformFull: getPlanetInSign('Me', rr, 'full'),
      platformSummary: getPlanetInSign('Me', rr, 'summary'),
      mixedLayers: mixPlanetInSignCatalogue('Me', rr, 'Mercury'),
    })
  }

  const vakriAst = getVakriAstNotes('Me', mercury.isRetro, isCombust, mercury.dignity, 'full')
  const natalSignClassical = getDignityAwarePlanetInSign(
    'Me',
    mercury.rashi,
    mercury.dignity,
    isCombust,
    mercury.isRetro,
    'full',
  )
  const natalMixed = mixPlanetFromGraha(
    { ...mercury, isCombust, name: 'Mercury' },
    house,
    asc,
    'all',
  )

  const classical: MercuryClassicalBundle = {
    natalHouseClassical: getPlanetInHouseClassical('Me', house),
    natalSignClassical,
    vakriAst,
    allHouses,
    allSigns,
    platformNatalHouseFull: getPlanetInHouse('Me', house, 'full'),
    platformNatalSignFull: getPlanetInSign('Me', mercury.rashi, 'full'),
    natalMixed,
  }

  return {
    mercury: {
      rashi: mercury.rashi,
      rashiName: RASHI_NAMES[mercury.rashi],
      nakshatraIndex: mercury.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[mercury.nakshatraIndex],
      pada: mercury.pada,
      house,
      dignity: mercury.dignity,
      degreeInSign: mercury.degree,
      isRetro: mercury.isRetro,
      isCombust,
      combustOrbUsed,
      sepFromSunDeg: sepFromSun,
      ownSign,
      exalted,
      debilitated,
      moolatrikona,
      nearExaltPeak,
      nearDebilPeak,
    },
    nature: [
      'Saumya (gentle) and Tatastha (neutral) — BPHS Ch.3 lore',
      'Napunsak graha (neuter) — feminine arts entered after mother-curse lore',
      'Kumar / Yuvaraj (~16) — heir, not king; needs permission and a base planet',
      'Chanchal / चुलबुला — restless, quick-changing (fastest after Moon)',
      'Ideas often borrowed (“तोते हैं”); analysis without long-term patience',
      'Can cheat/lie easily when badly placed; takes on yuti nature',
      'With Moon support performs well; with Sun support performs even better',
    ],
    karakatva: MERCURY_KARAKATVA,
    medical: MERCURY_MEDICAL,
    vedicRoles: [
      { veda: 'Rig Veda', role: 'Communication and knowledge' },
      { veda: 'Yajur Veda', role: 'Speech (वाणी) and correct mantra pronunciation' },
      { veda: 'Atharva Veda', role: 'Logic (तर्क शक्ति), analysis, problem-solving' },
    ],
    houseFocus,
    allHouseFocus: Array.from({ length: 12 }, (_, i) => {
      const h = i + 1
      return HOUSE_FOCUS[h] ?? {
        house: h,
        title: `Mercury in house ${h}`,
        themes: [],
        notes: ['Judge dignity, yuti, and functional nature for this lagna.'],
        difficulty: 'neutral' as const,
      }
    }),
    houseCaution,
    problematicHouses: [...MERCURY_PROBLEMATIC_HOUSES],
    inProblematicHouse,
    companions,
    companionNote,
    moonEnemyFlag,
    retroFlag,
    combustFlag,
    bothFlag,
    retroEffects: RETRO_EFFECTS,
    combustEffects: COMBUST_EFFECTS,
    bothEffects: BOTH_EFFECTS,
    twelfthPastLife,
    needsSupport: [
      'Cannot function at 100% alone — ~90% when unsupported; needs planetary energy',
      'Messenger of the planets (Narada-like) — intelligence without directing how to use it',
      'Inner planet under Sun’s energy — displays father’s/king’s authority more than own',
      'Starts many things, finishes few; gets overwhelmed by simultaneous novelty',
      'Immature for big deals alone — needs a father-figure / mentor seal',
    ],
    oneLiner:
      'Mercury is the battle between your Inner Core and Outer Core — whether normal, combust, retrograde, or both, it makes you identify the difference between your inner and outer self.',
    mythology: [
      'Skanda Purana: Tara (Brihaspati’s wife) and Chandra — Budha conceived; Brihaspati later adopts him',
      'Illegitimate birth karma — Moon attracted to Guru’s wife; Tara stayed willingly ~2+ years in Chandralok',
      'Mercury considers Brihaspati (Jupiter) an enemy in relationship lore; Moon relationship fluctuates',
      'Self-discovered wisdom: figured parentage from observation — “बुद्धिर् बलं यशो धर्मम्” lore',
      'Invocation: Priyangu Kalika Shyamam… — dark like Priyangu bud, gentle, saumya',
      'Symbolic kardhani (waist belt) — childlike protective ornament; always depicted as teenager',
    ],
    curses: [
      'Tara: “Filled with doubt — nobody will trust you; remain isolated.”',
      'Napunsak curse: feminine arts/qualities enter the male form',
      'Third curse lore (restlessness / chanchalta) — details vary; linked to disturbing tapasya',
      'Both parents eventually rejected him — shapes insecurity and validation hunger',
    ],
    professions: [
      'Writing, media, journalism, content, comedy',
      'Trade, accounting, audit, mathematics, data',
      'Teaching debate, counselling speech, multilingual roles',
      'Astrology / numerology when Mercury is strong',
      'Short-horizon trading / analytical markets',
    ],
    languagesNote:
      'Any language beyond mother tongue is Mercury’s domain — multilingualism is read from Budha’s strength and house/sign support.',
    remedies,
    rudrakshaNote:
      '4 Mukhi = Mercury. Wear only after bathing; remove for toilet, intimacy, sleep, and bathing. Smokers / those who cannot keep discipline should not wear casually — wrong wearing burns power (अस्त).',
    naturalAge: 16,
    naturalAgeNote:
      'Representational age ~16 (Kumar / Yuvaraj). Classical maturity age for Mercury significations strengthening is later (~32 in the maturity table) — do not conflate youth-image with maturity timing.',
    relationships: {
      enemy: 'Moon (Chandra)',
      neutrals: ['Mars', 'Saturn', 'Jupiter'],
      note: 'Mars is NOT Mercury’s enemy — sam-bhava (neutral). Software that marks Mars as enemy is wrong per this teaching.',
    },
    classical,
    caveats: [
      'Never tell a client combust/vakri Mercury is simply “bad” — balance with writing, depth, and spiritual positives',
      'Debilitation is by rashi, not house — neecha traits show even with neecha-bhanga softening',
      'Every planet is good including Rahu/Ketu/Saturn when decoded properly',
      'Check chart capacity before prescribing remedies — unused ritual karma can rebound on the astrologer',
      'Avoid volunteering sensational relationship predictions',
    ],
    methodology: [
      'Layer: Mercury nature → house (watch 9/7/12) → sign (Gemini/Virgo vs Pisces) → degree (~15° peaks) → yuti (company first) → combust orb (14° / 12° vakri) → vakri → dasha',
      'Decode Inner vs Outer Core whenever combust and/or vakri',
      'Give Mercury a base planet (Sun/Venus/mentor) before blaming Budha alone',
      'Medical: nerves/skin/neurology via Mercury; hemorrhage via Moon; hair stages via Mars→Jupiter→Sun',
    ],
    summaryAttrs: [
      { label: 'Element', value: 'Air (वायु)' },
      { label: 'Color', value: 'Green (Hari / moong)' },
      { label: 'Own signs', value: 'Gemini & Virgo (moolatrikona Virgo)' },
      { label: 'Exalt / Debil', value: 'Virgo @15° · Pisces @15°' },
      { label: 'Nakshatras', value: 'Ashlesha · Jyeshtha · Revati' },
      { label: 'Combustion', value: '0–14° (12° if vakri)' },
      { label: 'Deity', value: 'Vishnu · Ganesha · Buddha lore' },
      { label: 'Gem / Metal', value: 'Emerald · Copper' },
      { label: 'Rudraksha', value: '4 Mukhi' },
      { label: 'Natural age', value: '~16 (Kumar)' },
      { label: 'Enemy', value: 'Moon (Mars neutral)' },
      { label: 'Body', value: 'Nerves · brain junction · skin' },
    ],
  }
}
