// ─────────────────────────────────────────────────────────────
//  src/lib/engine/houseInterpretations.ts
//  Bhava guide: house themes, sign-in-house, planet-in-house
//  Educational reference — not medical/legal advice.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'

export type ClassicalGrahaId = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'
export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
export type InterpDetail = 'full' | 'summary'

export const CLASSICAL_GRAHAS: ClassicalGrahaId[] = [
  'Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke',
]

export interface HouseTheme {
  house: HouseNumber
  sanskrit: string
  english: string
  shortThemes: string
  coreThemes: string[]
  intro: string
}

export interface RashiLordRow {
  number: Rashi
  english: string
  hindi: string
  lord: ClassicalGrahaId
  lordEnglish: string
  lordHindi: string
}

export interface PlanetAbbrev {
  code: string
  id: ClassicalGrahaId
  english: string
  hindi: string
}

// ── Fundamentals ─────────────────────────────────────────────

export const HOUSE_LAYOUT_NOTE =
  'In a Vedic chart (Kundli), house positions are fixed: the top-center diamond is the 1st House (Lagna), then houses proceed counter-clockwise. Numbers inside houses are zodiac signs (rashis), not house numbers.'

export const CONJUNCTION_NOTE =
  'Conjunctions (Yuti) occur when multiple planets appear in the same house, merging their influences in that area of life.'

export const LAGNA_LORD_NOTE =
  'The planet that rules the sign in the 1st House is the Lagna Lord—the “King” of the chart. Example: number 8 in the 1st House = Scorpio Ascendant; Lagna Lord is Mars.'

export const LAGNA_LORD_IN_FIRST =
  'When the Lagna Lord sits in the 1st House: strong self-reliance and personal responsibility; high focus on health, personality development, and maintaining respect. Others may receive more help from the native than they give back.'

/** First-glance checklist for Lagna / Lagna-lord strength (educational). */
export const LAGNA_STRENGTH_CHECKS: string[] = [
  'Benefic aspects on Lagna (and malefic pressure)',
  'Lagna lord placement (kendra / trikona / dusthāna)',
  'Yoga-kāraka status of Lagna lord for this Ascendant',
  'Dignity: exaltation, mūlatrikoṇa, own sign, or nīca',
  'Combustion (asta) and retrograde (vakri)',
  'If debilitated: is there nīcabhaṅga?',
]

/** Mental overlays used in reading — no need to redraw charts. */
export const ANALYSIS_LAGNAS_NOTE =
  'Readers also scan mentally from Birth Lagna, Sūrya Lagna (Sun), Chandra Lagna (Moon), Śukra Lagna (Venus, matchmaking), and Dasha Lagna (current mahādasha planet as temporary Lagna). D1 remains the foundation.'

/** Kendradhipati: natural benefics as kendra lords lose soft benefic nature. */
export const KENDRADHIPATI_NOTE =
  'Kendrādhipati doṣa: natural benefics (Ju, Ve, Me, Mo) as lords of kendras (1/4/7/10) behave more harshly. Full doṣa is clearest for dual (dwiswabhāva) Ascendants—Gemini/Virgo (Jupiter) and Sagittarius/Pisces (Mercury). Softens when that kendra lord sits in a trikona (1/5/9); results often peak in their dashā.'

/** Soft caution when 3rd-house periods are active. */
export const THIRD_HOUSE_DASHA_CAUTION =
  'Third-house periods should not be read as “only hobbies and short trips.” Classically the 3rd is also 8th-from-8th (sudden/cause themes) and 7th-from-9th (father’s vulnerability). Events can feel abrupt—stay alert for health, travel safety, and father’s well-being; soften predictions and suggest practical precautions.'

/** High-level Manglik overview (not a full cancellation matrix). */
export const MANGLIK_OVERVIEW =
  'Mānglik (Kuja) doṣa is commonly noted when Mars occupies houses 1, 4, 7, 8, or 12 from Lagna (some South-Indian schools also weigh the 2nd). It often shows high drive; relationship friction fears are overstated once Mars is own/exalted or after roughly age 28. Mutual Manglik–Manglik matching and Jupiter/Saturn/Rahu pacification also soften readings. Always judge the full chart—do not apply remedies blindly.'

/** Who can restrain Mars energy in partnership readings (class teaching). */
export const MARS_CONTROL_NOTE =
  'Mars carries commander (senāpati) energy—leadership, ego heat, and independence—regardless of gender. Saturn, Rahu, and Jupiter can often restrain or balance Mars; the Sun generally cannot (king gives the general a free hand). Weak Mars often shows as irritation more than open aggression.'

/** Partial vs full Manglik — educational framing from Lagna / Moon / Venus. */
export const ANSHIK_PURNA_MANGLIK_NOTE =
  'Aṁśik (partial) Manglik: Mars sits in a Kuja house from only one of Lagna, Moon, or Venus. Pūrṇa (full): from two or three of these perspectives. Full intensity is more psychological pressure when the partner lacks matching Mars, Saturn, or Rahu support—not an automatic life/death prediction.'

/** Soft early-marriage checklist (yogas, not timing engine). */
export const EARLY_MARRIAGE_INDICATORS: string[] = [
  'Benefics occupying both Lagna and the 7th (or strongly supporting them)',
  '2nd and 8th free of heavy malefic load',
  'Venus not combust; Jupiter/Venus not heavily afflicted or stalled by malefics',
  'Lagna lord strong (bali); Jupiter near Venus is a classic auspicious cue',
  '7th lord as a benefic sitting in the 7th, with Lagnesh–Saptamesh within ~3–4° → love/early bond lean (Gāndharva-style cue)',
]

/** Soft delayed-marriage checklist. */
export const DELAYED_MARRIAGE_INDICATORS: string[] = [
  'Malefics or pāpa-kartarī around key marriage houses (1/7 and related)',
  'Venus combust (asta) or heavily afflicted',
  'Saturn–Moon close conjunction: emotional self-sufficiency / low marriage urgency (judge degrees)',
  'Debilitated Venus under Saturn pressure; Sun graha-yuddha touching Lagna or 7th',
  'Delay often means readiness/filters, not “no marriage”—timing needs dashā study',
]

/** Soft 12th-house reading frame (class teaching). */
export const TWELFTH_HOUSE_READING_NOTE =
  'Twelfth-house planets color sleep, dreams, private expense, foreign/ashram spaces, and mokṣa lean. Class notes also flag hard outcomes when combinations support them—e.g. afflicted Rahu (jail), Rahu+afflicted Moon (mental instability/madness), weak Mars or stressed Ketu (ED). Still read dignity, aspects, and the full chart; for crisis ideation, urge real-world support.'

export function getKendradhipatiNoteForLagna(ascRashi: Rashi): string | null {
  // Dual signs: full dosha teaching applies most clearly
  if (ascRashi === 3 || ascRashi === 6) {
    return `${KENDRADHIPATI_NOTE} For this dual Ascendant, Jupiter as kendra lord is the classic focus.`
  }
  if (ascRashi === 9 || ascRashi === 12) {
    return `${KENDRADHIPATI_NOTE} For this dual Ascendant, Mercury as kendra lord is the classic focus.`
  }
  if (ascRashi === 2 || ascRashi === 5 || ascRashi === 8 || ascRashi === 11) {
    return 'Fixed Ascendant: Venus as a kendra lord can carry kendrādhipati coloring—judge placement and dashā; doṣa softens in trikona.'
  }
  // Char / movable
  if (ascRashi === 1 || ascRashi === 4 || ascRashi === 7 || ascRashi === 10) {
    return 'Movable Ascendant: Moon/Venus may be kendra lords without the full dual-sign kendrādhipati package—still weigh pakṣa bala (Moon) and dignity.'
  }
  return null
}

export const MARRIAGE_PILLARS: string[] = [
  '7th House — whether marriage is promised and its basic pattern',
  'Venus (Shukra) — quality and flavor of marriage (love, comfort, happiness)',
  '7th House Lord — what unfolds after marriage (growth, moves, challenges)',
  'D9 (Navamsha) Ascendant — luck and destiny shift after marriage',
]

export const RASHI_LORDS: RashiLordRow[] = [
  { number: 1, english: 'Aries', hindi: 'Mesh', lord: 'Ma', lordEnglish: 'Mars', lordHindi: 'Mangal' },
  { number: 2, english: 'Taurus', hindi: 'Vrishabha', lord: 'Ve', lordEnglish: 'Venus', lordHindi: 'Shukra' },
  { number: 3, english: 'Gemini', hindi: 'Mithun', lord: 'Me', lordEnglish: 'Mercury', lordHindi: 'Budh' },
  { number: 4, english: 'Cancer', hindi: 'Kark', lord: 'Mo', lordEnglish: 'Moon', lordHindi: 'Chandra' },
  { number: 5, english: 'Leo', hindi: 'Simha', lord: 'Su', lordEnglish: 'Sun', lordHindi: 'Surya' },
  { number: 6, english: 'Virgo', hindi: 'Kanya', lord: 'Me', lordEnglish: 'Mercury', lordHindi: 'Budh' },
  { number: 7, english: 'Libra', hindi: 'Tula', lord: 'Ve', lordEnglish: 'Venus', lordHindi: 'Shukra' },
  { number: 8, english: 'Scorpio', hindi: 'Vrishchik', lord: 'Ma', lordEnglish: 'Mars', lordHindi: 'Mangal' },
  { number: 9, english: 'Sagittarius', hindi: 'Dhanu', lord: 'Ju', lordEnglish: 'Jupiter', lordHindi: 'Guru' },
  { number: 10, english: 'Capricorn', hindi: 'Makar', lord: 'Sa', lordEnglish: 'Saturn', lordHindi: 'Shani' },
  { number: 11, english: 'Aquarius', hindi: 'Kumbh', lord: 'Sa', lordEnglish: 'Saturn', lordHindi: 'Shani' },
  { number: 12, english: 'Pisces', hindi: 'Meen', lord: 'Ju', lordEnglish: 'Jupiter', lordHindi: 'Guru' },
]

export const PLANET_ABBREVIATIONS: PlanetAbbrev[] = [
  { code: 'SU', id: 'Su', english: 'Sun', hindi: 'Surya' },
  { code: 'MO', id: 'Mo', english: 'Moon', hindi: 'Chandra' },
  { code: 'MA', id: 'Ma', english: 'Mars', hindi: 'Mangal' },
  { code: 'ME', id: 'Me', english: 'Mercury', hindi: 'Budh' },
  { code: 'JU', id: 'Ju', english: 'Jupiter', hindi: 'Guru' },
  { code: 'VE', id: 'Ve', english: 'Venus', hindi: 'Shukra' },
  { code: 'SA', id: 'Sa', english: 'Saturn', hindi: 'Shani' },
  { code: 'RA', id: 'Ra', english: 'Rahu', hindi: 'Rahu' },
  { code: 'KE', id: 'Ke', english: 'Ketu', hindi: 'Ketu' },
]

export const HOUSE_THEMES: Record<HouseNumber, HouseTheme> = {
  1: {
    house: 1,
    sanskrit: 'Tanu Bhava / Lagna',
    english: 'Self, personality, physical body',
    shortThemes: 'Self, personality, and physical body',
    coreThemes: [
      'Self, personality & life track',
      'Physical body, vitality & longevity outline',
      'Appearance (sign when empty; planets/aspects modify)',
      'Coping capacity & attraction/listening style',
      'Wealth retention (12th from 2nd — spend vs save)',
      'Mother’s public karma (10th from 4th)',
      'Inherent potential vs actual achievements',
    ],
    intro:
      'Lagna is the foundational pillar—if Lagna is weak, the native’s own vehicle feels weak. Empty Lagna leans on the sign; occupants and aspects reshape body and mind. Strength check: benefic aspects, Lagna-lord placement/dignity, yoga-kāraka, combust/retro, nīcabhaṅga.',
  },
  2: {
    house: 2,
    sanskrit: 'Dhana Bhava',
    english: 'Wealth, family, speech',
    shortThemes: 'Wealth, family lineage, and speech',
    coreThemes: [
      'Speech, truthfulness & voice quality',
      'Kutumba — family values & upbringing',
      'Accumulated / liquid wealth & saving capacity',
      'Face (brows–chin), right eye, teeth, glow',
      'Primary education & cultural values',
      'Hospitality, food storage & stubborn will',
      'Soft maraka note (with 7th) — longevity timing only with full chart',
    ],
    intro:
      'The 2nd shows resources that sustain you—speech, family atmosphere, savings, face value, and early values. It also colors how you retain wealth versus spend it.',
  },
  3: {
    house: 3,
    sanskrit: 'Sahaja Bhava',
    english: 'Courage, siblings, communication',
    shortThemes: 'Courage, siblings, and efforts',
    coreThemes: [
      'Younger siblings, neighbors & social circle',
      'Courage (parākrama), patience & willpower',
      'Efforts, hobbies, skills, writing & singing',
      'Short journeys, documents, passport (visa via 9th)',
      'Throat, ears, shoulders–wrists',
      'Subconscious / desire (1st of 3–7–11 kāma triangle)',
      'Caution: 8th-from-8th & 7th-from-9th sudden themes in dashā',
    ],
    intro:
      'The 3rd is effort, courage, siblings, communication, and skill. Singers and writers need it strong. In dashā it can deliver sudden events—read with care for native and father’s well-being, not only hobbies.',
  },
  4: {
    house: 4,
    sanskrit: 'Sukha Bhava',
    english: 'Home, mother, happiness',
    shortThemes: 'Mother, home, and happiness',
    coreThemes: [
      'Mother, maternal relatives (nanihāl) & childhood home',
      'Land, house, vehicles & comforts',
      'Mental peace, emotions & nourishment (Moon’s natural house)',
      'Primary/nursery education',
      'First of mokṣa trikoṇa (4–8–12): attachment & detachment',
      'Politics / governance (state-level) & company (saṅgati)',
      'Chest, breath, prāṇāyāma themes',
    ],
    intro:
      'Fourth is home, mother, property, and emotional sanctuary—first of the mokṣa triangle. Every signification here carries feeling; check Moon, 4th lord, and aspects together.',
  },
  5: {
    house: 5,
    sanskrit: 'Putra Bhava',
    english: 'Intelligence, education, children',
    shortThemes: 'Intelligence, education, and children',
    coreThemes: [
      'Pūrva-puṇya — past-life merit shaping fortune',
      'Higher education, intellect & creativity',
      'Children, romance & mantra / sādhanā',
      'Sudden gains, speculation & followers (caution with gambling)',
      'Administrative / creative fame',
      'Abdomen / digestive zone',
      'Love bonds of many kinds (not only romantic)',
    ],
    intro:
      'Fifth is a trikoṇa of intelligence, children, mantra, and past-life credit. Jupiter is natural significator for progeny; always weigh 5th lord, Moon/Mars (fertility context), and D7/D9—never one placement alone.',
  },
  6: {
    house: 6,
    sanskrit: 'Shatru Bhava',
    english: 'Debts, enemies, disease, service',
    shortThemes: 'Debts, enemies, and diseases',
    coreThemes: [
      'Disease, injury & recovery capacity',
      'Enemies, rivals & litigation',
      'Debts, loans & service / employees',
      'Upachaya — growth through effort over time',
      'Regular income (with 2–10–11 wealth chain)',
      'Maternal uncle (māmā) & competitive exams',
      'Defense, medical & administrative service',
    ],
    intro:
      'Sixth is not only trouble—it is upachaya fighting capacity, service, and regular income. Malefics here often strengthen contest; benefics can heal but may also create stubborn health themes. Connect 2–6–10–11 for livelihood.',
  },
  7: {
    house: 7,
    sanskrit: 'Yuvati Bhava',
    english: 'Spouse, partnerships, public image',
    shortThemes: 'Spouse, contracts, and public relating',
    coreThemes: [
      'Marriage, spouse & long-term relating',
      'Business partners, startups & professional contracts',
      'Foreign travel / travel-linked livelihood themes',
      'Promotion, transfer & public image through others',
      'Marital friction, affairs, and whether bonds stabilize',
      'Mirror of Lagna — qualities sought (and mirrored) in others',
      'Secondary maraka (with 2nd) — longevity only via full chart',
      'Read with Venus, 7th lord, Manglik status & D9 Ascendant',
    ],
    intro:
      'Seventh is partnership beyond marriage alone—spouse, business deals, travel contracts, and how others complete you. Same house governs marriage and business partnerships as separate outcomes. Lagnesh–7th exchange needs support factors; exact timing needs dashā work, not yogas alone.',
  },
  8: {
    house: 8,
    sanskrit: 'Ayu Bhava',
    english: 'Longevity, secrets, transformation',
    shortThemes: 'Longevity, sudden changes, and obstacles',
    coreThemes: [
      'Longevity, crises & deep transformation (“check-post”)',
      'Occult, research, astrology & tantra inclination',
      'In-laws, mangalya (for spouse longevity context)',
      'Hidden enemies, raids, blame & sudden gains/losses',
      'Second of mokṣa trikoṇa — bridge toward 12th',
      'Shared resources, insurance & unearned money',
      'Psychological depth & regenerative healing',
    ],
    intro:
      'Eighth is the dark checkpoint of the chart—longevity, occult willpower, in-laws, and transformation. It is not only “bad”; it decides whether material and spiritual tracks rebalance after crisis.',
  },
  9: {
    house: 9,
    sanskrit: 'Dharma Bhava',
    english: 'Fortune, dharma, father, gurus',
    shortThemes: 'Dharma, fortune, religion, and father',
    coreThemes: [
      'Bhāgya, dharma & ethical life path',
      'Father, gurus, mentors & higher authorities',
      'Higher education, law, philosophy & finance knowledge',
      'Long journeys, pilgrimage & visa themes (foreign via 12th)',
      'Blessings, fame & leadership of groups',
      'Knees / calves; past-life merit deepening (5th from 5th)',
      'Guru after 8th-house self-realization need',
    ],
    intro:
      'Ninth is fortune, father, and teachers—where treasures found in the 8th get guidance. Afflicted 9th often means self-made luck; benefic 9th opens family and guru support.',
  },
  10: {
    house: 10,
    sanskrit: 'Karma Bhava',
    english: 'Career, karma, public standing',
    shortThemes: 'Career, karma, and public standing',
    coreThemes: [
      'Nature of karmas (not job title alone) — ethical vs mixed',
      'Livelihood, status, authority & gazetted roles',
      'Public vs private conduct (dual personality)',
      'Artha trikoṇa (2–6–10) — sustaining life',
      'Fame through work; awards often via 11th',
      'Father’s condition; long pilgrimages',
      'Permanent karma pattern across dashās',
    ],
    intro:
      'Tenth defines how you act—career is only one layer. Outer and inner karmas both show here; results ripen toward the 11th. Sun, Saturn, Jupiter, and Mercury are classic kārakas.',
  },
  11: {
    house: 11,
    sanskrit: 'Labha Bhava',
    english: 'Gains, networks, desires',
    shortThemes: 'Gains, social circle, and fulfillment of desires',
    coreThemes: [
      'Icchā-pūrti — desire fulfillment & ambitions',
      'Gains, income sources (2nd = income; 11th = sources)',
      'Friends, elder siblings & networks',
      'Awards, recognition & degree level',
      'Largest upachaya — growth through association',
      'Immunity edge (6th from 6th) when serious illness arises',
      'In Kali-yuga, active 3–6–10–11 often aids material survival',
    ],
    intro:
      'Eleventh is gains, friends, and fulfilled desires—the collection box of current-life karma. Strong 11th/11th lord supports awards; malefic coloring can still deliver material results if purposeful.',
  },
  12: {
    house: 12,
    sanskrit: 'Vyaya Bhava',
    english: 'Expenses, isolation, liberation',
    shortThemes: 'Expenses, sleep, foreign, and mokṣa',
    coreThemes: [
      'Mokṣa, vairāgya & private spiritual practice (sādhana)',
      'Expenses, charity, losses & completing unfinished vows',
      'Foreign lands, hospitals, ashrams, retreats & isolation',
      'Sleep, dreams, bed comfort (śayyā-sukha) & subconscious',
      'Behind-the-scenes work, research & hidden enemies',
      'Left eye; private life & confinement themes',
      'Journey from bhoga (enjoyment) toward detachment',
      'Chosen or forced solitude — same house energy',
    ],
    intro:
      'Twelfth closes the cycle—expenditure, foreign/ashram spaces, sleep/dreams, and liberation. Planets here color private life and subconscious patterns strongly; dignity and aspects decide whether solitude heals or drains. Judge the whole chart—not one 12th placement alone.',
  },
}

// ── Sign in house (where source material provides it) ────────

export const SIGN_IN_HOUSE: Partial<Record<HouseNumber, Record<Rashi, string>>> = {
  2: {
    1: 'Fast, logical, sometimes aggressive speech. May struggle to save; takes strong responsibility for feeding the family.',
    2: 'Excellent wealth accumulation. Strong neck; rich family lineage feel. Can be very stubborn.',
    3: 'Brilliant communicators who gather information. Loves collecting stationery/electronics. Family may feel somewhat self-serving.',
    4: 'Emotional family environment with mood cycles. Speaks sweetly but suffers mood swings.',
    5: 'Respected lineage. Speaks with authority; wants to be head of the family and values justice.',
    6: 'Point-to-point speech without much emotion. Possible disputes over family land/resources; stores wealth in documents/bonds.',
    7: 'Balanced, diplomatic speech. Strong resource management; balances family vs wealth.',
    8: 'Secretive about money and family issues. Solves quietly but can explode with words; deep grudges possible.',
    9: 'Speaks less but with wisdom. Wealth stored in knowledge/books; ancestral karma themes.',
    10: 'Practical, powerful speaker; often talks struggle or career. Family may demand financial support.',
    11: 'Big promises and networking talk. Sudden frauds or losses regarding family wealth possible.',
    12: 'Speaks about spirituality or abstract ideas; often gives personal resources to the family.',
  },
  10: {
    1: 'Career needs initiating projects, risk, and building from the ground up. Engineering, defense, management, sales.',
    2: 'Resource management and budgets; treasurer/signatory roles. Diplomacy, real estate, wholesale, food industry.',
    3: 'Communication, data, coordination. Coding, analysis, writing, PR, events, markets.',
    4: 'Public-facing emotional work. Banking, welfare, water industries, HR, caregiving, seasonal business.',
    5: 'Power and the “throne”; prefers managing over ground work. Government, R&D, expert visibility roles.',
    6: 'Service-oriented analysis. Healthcare, law, audit/tax, BI; policy-heavy defense/police roles.',
    7: 'Client management, partnerships, aesthetics. Fashion, jewelry, cosmetics, events, cyber filtering.',
    8: 'Research, hidden matters, transformation. Occult, surgery, data mining, fraud analysis, “decay” industries.',
    9: 'Strategist/advisor; avoids grey morality. Professors, healers, long-term planning, mass media PR.',
    10: 'Demanding, boundary-setting careers; monopoly-building. Heavy industry, construction, military, corporate sales.',
    11: 'Networks, mass media, digital systems. Telecom, e-commerce, social influence, sudden wealth themes.',
    12: 'Foreign lands, isolation, or high creativity. Export/import, visas, spiritual fundraising, insurance/legal from losses.',
  },
  12: {
    1: 'Rises after losses; high-energy meditation helps. Aggressive private life; father may change cars/decor often.',
    2: 'Fears financial loss; may hide food/money in the bedroom. Property charity or disputes for peace.',
    3: 'Active mind; hard to sleep. Loses small items in travel; gadgets in bedroom; younger sibling money asks.',
    4: 'Bedroom as sleeper sanctuary; late-night eating/rest. Releases stress alone; water travel or food/milk charity.',
    5: 'Ego clashes in private life; may sleep separately. Hidden immoral acts risk public disgrace.',
    6: 'Critical in private life; calculative expenses. Structured donations; work spillover into sleep.',
    7: 'Luxurious, refined bedroom. Partnership compromise to avoid losses; hidden relationship risk if afflicted.',
    8: 'Messy research/occult bedroom; nightmares or insomnia. Strong death intuition; in-law money friction.',
    9: 'Spiritual subconscious; temple donations and sacred books. Strict father; possible back/thigh/liver strain.',
    10: 'Traditional/philosophical; donates used items or builds ashrams. Unstable career, foreign/night work; hoarding.',
    11: 'Sleep disorders or bedroom intoxicants/electronics. Networking scams can drain savings.',
    12: 'Naturally giving and detached. Vivid dreams, sixth sense; ashram life and foreign travel; easy to release toxicity.',
  },
}

// ── Planet in house: FULL (guide) ────────────────────────────

const FULL: Record<ClassicalGrahaId, Record<HouseNumber, string>> = {
  Su: {
    1: '“Suryavanshi” traits: authoritative, leadership-oriented, practical, ego-driven; may experience early hair thinning. Often tries to manage or control others.',
    2: 'Disciplined eating habits. Speaks with pride about family lineage. Highly practical with resources.',
    3: 'Neighborhood often near government buildings/quarters. Routine-oriented mindset; enjoys politics/news. May make younger siblings work for them.',
    4: 'Home-related mental tension and domestic worry; authority at home with dry emotion—protect peace routines and mother’s space.',
    5: 'Fire signs: honor, followers, strong education. Aries Sun: small family / child difficulty lean. Air signs: teacher/writer. Avoid gambling/speculation losses.',
    6: 'Strong manager energy but ego clashes. Heat/gastric sensitivity. Avoid clashing with government/authorities.',
    7: 'Difficult for equality in marriage: ego clashes and desire to dominate. Hard on business partnerships (“I / my share”). Public image may look overly accommodating to keep peace. Watch heat-related health themes.',
    8: 'Father’s side or father may travel/separate emotionally. Public insults or hidden career shortcuts possible. Mother may have lacked warmth in pregnancy. Weak vitality themes; disputes with father/authority; grows in isolation.',
    9: 'Responsible about temple/duty. Devotee of Lord Ram; Yama–Niyama routines. Father/guru famous, clear, grand-scale. Strong Raja Yoga—aims for top authority; mother is a high-pressure problem solver.',
    10: 'Digbala: political/power desire, pilgrimage-sponsor vibe. Strong benefic Sun: IAS/IPS lean. Leaving jobs without next offer in Sun periods is costly; Sun–Rāhu combo often self-sabotages via ego.',
    11: 'Royal image, parties, helpers, money when strong. As Lagna lord here: split-personality risk (public good / private harsh)—doesn’t take advice easily.',
    12: 'Private “royal” bedroom lean; dominates personal space; emotional satisfaction via ego-light spirituality. One-man-army service energy that catches the boss’s eye (help or friction). Easy spiritual path; hospital/charity fire. Physical distance from father with emotional attachment; foreign contracts with homesickness. Ego-driven king-desire; eye strain from screens. In Taurus/Gemini/Pisces: boundary risks in private relating—soften, don’t assume.',
  },
  Mo: {
    1: '“Chandravanshi” traits: emotional, sensitive, moody, easily hurt. Highly intuitive; prone to emotional fluctuations and “nazar” sensitivity.',
    2: 'Sweet talker whose words shift with moods. Family environment moves through heavy emotional cycles.',
    3: 'Neighborhood near water or peaceful spots. Emotional subconscious; enjoys arts, singing, romantic literature.',
    4: 'Strong: emotional sanctuary, mother bond, government/foreign comfort in chara signs. Afflicted by Mars+nodes: sharp domestic disturbance—stabilize Moon first.',
    5: 'Strong: creativity, medical aptitude, female-child lean; twins if Gemini/Pisces Moon strong. Afflicted: conception/water-bag stress; with Saturn—deceit risk. Soften extreme mental claims.',
    6: 'Emotional cycles color routine and service. Needs care with dietary/mood discipline in daily struggle houses.',
    7: 'Attractive partner theme with strong mood swings and intense love. Partner may steer the native’s emotions. World may see emotional volatility; mother’s social visibility; father’s income may be seasonal.',
    8: 'Critical in-laws; blame around food/cooking; feeling excluded. Deep abandonment fears. Pregnancy may have involved gastric distress for mother. Appetite/water-related health themes; home water leakage symbolism.',
    9: 'Benefic Moon: emotional control → progress, dharma without show, writing/healing words, temple emotion. Father “hard shell / soft core.” Afflicted: practice-hopping, sibling jealousy—study pakṣa bala carefully.',
    10: 'Helping nature builds reputation; travel/HR/food industries; foreign travel lean. Moon–Rāhu alone can still earn well (not mere “grahaṇa on karma”). Malefic Moon needs care.',
    11: 'Desires peace, white aesthetics, fancy dining. Emotional networks; may leave projects halfway. Seasonal/irregular income; desires often fulfilled after emotional release. Arts and herbal themes.',
    12: 'Liquid money flow with mindless/emotional spending and soft donations. Loves sleep; cooling/milky lights by the bed. Comfortable travel. Highly sensitive, fluctuating mind; nurturing; motherly devotion to the divine. Past-life spiritual intuitions hard to decode. Domestic ease often found outside the birth home more than inside it. Therapy/healing/medicine lean when supported. Mokṣa easier with sincere practice; Moon pushes novelty. Kalā cues often cited: kṣamā, puṣṭi, nṛtika (forgiveness, nurture, adaptability).',
  },
  Ma: {
    1: '“Commander” personality: brave, short-tempered, passionate, logical. Heavy responsibility; prone to minor facial injuries or scars.',
    2: 'When strong: karmasheel, never tires, family-responsible, authoritative speech, land/farm assets lean. Afflicted: harsh/abusive speech, quarrels, short temper—channel into disciplined duty.',
    3: 'Neighborhood near security/police. Fast-processing, technical mind. Sports and fast driving; can be aggressive.',
    4: 'Almost always grants own house/property (even if afflicted). Strong: land, multiple properties, factory if Saturn-linked. Afflicted: theft, fights, domestic heat—still property karma.',
    5: 'Cesarean lean in modern births, high posts, strong digestion. Afflicted: child risk, quarrels; charts may show attraction outside primary bond—counsel boundaries.',
    6: 'Very beneficial fighting spirit in upachaya—defense, contest, surgery recovery drive. Still watch injury and debt from property fights.',
    7: 'Kuja house: aggression, leadership, authority, and independence in relating (all genders). Passion and assertiveness high—space, clear contracts, and tempering of ego heat protect marriage and business deals.',
    8: 'Responsible but fight-prone in-laws (“roaring lion vs barking dog”). Friend-circle fights; marital conflict risk. Blood/cholesterol/surgery themes; ancestral property disputes; people may try to hold the native back.',
    9: 'Practical religion for protection and order; Hanuman, Narasimha, Kartikeya, Ram, Shiva. Strict father/gurus. Kshatriya mindset; managerial command; hot-climate or defense travel. Mother: blood/pain/urinary themes possible.',
    10: 'Digbala south: focused hard work in the right direction. Own/exalted → Ruchaka yoga power with effort. Afflicted: accidents, fire/weapon risk, difficult children dynamics.',
    11: 'Works very well for material gains and competitive networks; loyal-group drive—channel aggression into productive teams.',
    12: 'Foreign land/export lean; passionate at work with anger that needs energy management (often steadies after ~age 28). Blood-donation/service lean. Wanderer who dislikes sitting alone; long travel loved; abroad may feel smooth then unsettled. Rigid adaptability; over-shielding others can irritate them. Suppressed heat; martial/discipline outlets help. 4th aspect protects siblings themes; 7th reduces open enmity; 8th intensifies partner bond—if Mars is afflicted, class teaching warns of physical aggression toward partner. Can make the native physically weaker while significations stay aggressive; male charts often dominate the spouse. If Mars is weak (māraṇa-kāraka + low ṣaḍbala), class notes link erectile dysfunction (ED). Kālī/devotional warrior lean possible.',
  },
  Me: {
    1: 'Highly communicative, sharp intellect, youthful appearance. Consultant, diplomat, or problem-solver for others.',
    2: 'Excellent communicators, consultants, diplomats. Money through counseling or solving problems.',
    3: 'Neighborhood near schools or parks. Brilliant debate skills; active subconscious. Many hobbies—writing, traveling.',
    4: 'Strong: farm/garden love, arts/music skill, witty finance from home, foreign travel lean. Afflicted: speech that damages domestic peace—guard words at home.',
    5: 'Natural seat for Mercury: math, communication, astrology aptitude, flexible arts/dance when strong. Afflicted: education and focus issues.',
    6: 'Thrives on routines (CA, HR, finance). Neurological sensitivity. Betrayal from trusted people or paperwork debts possible.',
    7: 'Spouse often from nearby city, relatives, or a common friend (inner-circle Mercury). With Sun nearby: childhood/school/college bond lean. Playful, talkative partner; friendship-like dynamic. Mercury’s fluctuation brings ups and downs—couples often resolve issues with their own viveka when unafflicted.',
    8: 'Humorous but money-focused, gossipy in-laws. School-life relationship issues; hard to voice true feelings. Paperwork/certificate fraud themes. Health dips after bonuses. Caution around insurance/death-related money karma.',
    9: 'Searches new religious ideas; debates orthodoxy. Humorous, talkative father/guru in business/consulting. Competitive; travel for exams/business. Mother: skin themes; may depend on brothers.',
    10: 'Own/exalted → Bhadra yoga: rise via speech/wit—speaker, teacher, comic timing. Afflicted: company feels unpleasant; words taken wrong.',
    11: 'Very beneficial for gains, speech-deals, and multi-stream income; keep ethics clean in paperwork and friendships.',
    12: 'Favorable signs: trader/business focus and research skill. Unfavorable: scattered focus, overthinking, private-life friction. Mid-sentence forgetfulness; feels “I said something wrong” even when silent. Spiritual intuition and behind-the-scenes research; past-life sādhana hints; dreams linked to children/karma themes. Give-and-take with paternal/maternal aunts (buā/māsī)—transactions keep bonds warm. Neurological sensitivity if afflicted; speech insults and hidden enemies when weak.',
  },
  Ju: {
    1: '“Blessed” individual: spiritual, wise, non-jealous, magnetic. Seen as guide or advisor in society.',
    2: 'Family values and ethical speech prioritized; long-term budgeting, hospitality, dignified voice. Afflicted/retro: “know-it-all” speech that doesn’t listen. Also touches mangalya support themes (8th from 7th).',
    3: 'Neighborhood near temples, banks, or education. Slow processor but wise/spiritual. Enjoys reading and teaching.',
    4: 'Strong: value-filled childhood, religious prosperous home, pilgrimages, livestock if linked to 4th lord. Afflicted: friction or distance with children—protect progeny bonds.',
    5: 'Strong: theistic, wealthy lean, spiritual. Afflicted: direct pressure on children/separation themes—protect progeny with remedies and care.',
    6: 'Complex: can create hard-to-cure health themes and family disturbance even while giving knowledge; Virgo Jupiter especially separates via work/travel. Bhāvārtha Ratnākara still allows healing results—judge whole chart.',
    7: 'Condition decides everything. Strong/own/exalted Jupiter: philosophical, teacher-like spouse; high tolerance (partner may overlook much). Afflicted/retro/enemy/malefic-aspected: delay, remarriage/prior-family themes, or partnership strain—judge dignity and aspects minutely, not “Jupiter in 7th = always good.”',
    8: 'Prominent, charitable in-laws. May witness hypocrisy in a guru/authority; hidden spiritual visions. Mother spiritual/educated. Breathing/TB/sciatica/heart themes. Helps people near ruin; don’t hide wrongs from guru/father.',
    9: 'Natural 9th kāraka: smooth education, guru early, ancestral blessings, optimistic healer mind. Afflicted/retro: ego of knowledge, weight/liver, superstition—still strong when dignified.',
    10: 'Ethical, spiritual, compassionate karma; helps more than donates (expects some return until true renunciation). Material expectations can divert attention from others’ needs.',
    11: 'Faithful high-level networking; studies risk before investing. Friend of all; trustworthy successful friends. Money arrives when needed; habit of donating a share; gifts gold/jewelry to parents.',
    12: 'Mokṣa-minded; can initiate/guide others when strong; past-guru imprint lean. Analytical—needs proof in spiritual claims. Foreign accounts/spend-heavy money with weak management. Long travel easier (classically noted with Cancer coloring). Self-teacher who tests mentors; solid counsel in illness or legal stress. Badly placed Jupiter can still bless spirituality; well-placed may inflate knowledge-ego and invite one corrective fall. Marriage/bedroom strain rises with malefic aspects. Liver moderation and yoga suit this placement.',
  },
  Ve: {
    1: 'Loves luxury, fashion, fine dining. Beautiful eyes, charming speech, soft nature, refined aesthetic sense.',
    2: 'Luxury lifestyle lean, cooking/food interest, charming speech and wealth magnetism when strong; soften excess and debt from pleasure spending.',
    3: 'Neighborhood near markets, spas, luxury. Refined communication; mind on aesthetics and relationships.',
    4: 'Strong: luxuries, beautiful home, material ease. Afflicted: comfort deprivation that responds best to ongoing spiritual remedies rather than only material fixes.',
    5: 'Strong: fertility, followers, arts detail, female helpers, mantra-siddhi lean (speech tends to land). With Rahu: foreign/cross-community bonds. Afflicted: upheaval—spiritual remedies.',
    6: 'Good for medical, art, or interior design. Kidney-stone sensitivity. Debts from luxury or legal issues involving women/alimony.',
    7: 'Eager for relationships but may choose by attraction alone—prefer family advice/arranged filter. Beautiful, refined partner. World sees resourceful/lustful vibe. Father’s income strong but affair history possible; mother beautiful and cooks well. High physical desire—hygiene and moderation matter.',
    8: 'Wealthy in-laws (doctors, clothing/jewelry). Hidden affairs or past-life spouse themes; occult vs marital happiness trade-off. Mother beautiful/devotional but unsupported. STD/urinary risk if afflicted; fermented foods; luxurious bathroom hygiene.',
    9: 'Aesthetic devotion—decorating temples, bhajans, fine offerings. Female deities (Lakshmi, Radha, Gauri). Soft-spoken luxurious father; charismatic gurus. Fortune via prosperity/arts; comfortable travel. Mother: water retention/kidney/digestion themes.',
    10: 'Material luxury karma; often leaves studied field for skill work. Afflicted: boundary issues with opposite sex spoil work. Sign-specific marriage/child notes—judge whole chart.',
    11: 'Luxury and lifestyle gains without frantic chasing; opposite-sex/intoxicant caution—soft addiction lean if afflicted (all genders).',
    12: 'Selfless love lean; popular, passionate, optimistic relating—afflicted Venus may scatter partners. High material desire (brands, romance) with little lasting satisfaction except through sādhana. Comfortable luxury travel. Female signs: female-deity / altar-decoration devotion; advanced private bhakti and nature poetry. Nurturing creative outdoor lean. In Virgo: angry/jealous/unromantic coloring and blame patterns. Soft journey from bhoga toward mokṣa when practice is steady.',
  },
  Sa: {
    1: 'Hardworking but faces delays. Constant effort and discipline; results after struggle or external validation.',
    2: 'Speaks slowly. Early poverty or delayed wealth accumulation. High-pressure speaking environment.',
    3: 'Industrial, older, or cluttered neighborhood. Workaholic who resists change. Harsh communication; life delays.',
    4: 'Often isolating even at home; family upheavals. Manageable mainly in own/strong sign; with Sun can still give good rental housing.',
    5: 'Strong: manageable; tantra-vidyā interest common. Afflicted: struggle across 5th themes—education, romance, children need patience.',
    6: 'Strong for government employees; slow growth. Vata/bone sensitivity. Avoid bribes; exams may need multiple attempts.',
    7: 'Hardworking but slow/lazy partner feel; intimacy treated like duty under pressure. World sees ideal hard worker; partners may make them do all heavy lifting. Father’s income stabilizes late. Fitness and performance anxiety themes.',
    8: 'In-laws: lying, complaining, food waste, clutter, backbiting. Secretive profession; only partial credit. Mother depressed/pressured in pregnancy. Slow painful decline themes; arthritis/constipation; negative intuitions often prove true.',
    9: 'Alone & benefic: karma-yoga, ethical self-made destiny, late exclusive attainments, temple/sadhana after mid-life. Strict father/judge lean. Afflicted: education/travel delays, joint strain—8–10 years extra effort common.',
    10: 'Primary 10th kāraka: minister/judge/IAS lean with slight effort when benefic. Malefic: grinds early life; results after long struggle. Benefic own-sign: fast delivery on honest work.',
    11: 'Mining/construction/logistics/security business lean; few true friends among many; antique-collecting attachment; walks light emotionally to avoid pain.',
    12: 'Natural 12th kāraka flavor: bhakti/sādhana for long stretches (may hide practice); mokṣa comes through effort. Foreign desire with hard exit/return; pilgrimages feel austere. Introvert, darkness-comfort, lazy sleep-anywhere habit; hard bed preference; foot/toe knocks common. Hard to receive support; hates discrimination; charity initiative with lifelong mental hurdles. Profession: struggle early, spiritual retreats and detachment later. Afflicted: bone/pelvis vigilance—soft medical language only.',
  },
  Ra: {
    1: 'Massive desires and worldly success drive. Speaks without boundaries; outsider feel; better luck networking outside immediate family.',
    2: 'Boundary-less speech (“air-building”). Massive wealth desire. Tamasic food preferences; treats friends as family.',
    3: 'Wealthy/showy neighborhood or corporate hubs. Hustler mindset; quick money; reckless driving.',
    4: 'Domestic disturbance, early-education delays, desire inflation; female charts—marriage stress possible. Dasha may still grant Ganga/pilgrimage journeys.',
    5: 'Mechanical/engineering aptitude when well placed; malefic influence stresses childbirth—handle progeny matters gently, no fatalism.',
    6: 'Highly competitive edge in 6th (classically favored malefic)—office politics skill; unusual health/sleep; channel obsession away from fraud/debt.',
    7: 'Foreign, distant, or culturally different spouse lean (Rahu pulls “elsewhere”). Intense desire/obsession risk; learn reciprocity. Complex partners; ethics and clarity essential. Grey public allegations; father’s income unstable if afflicted.',
    8: 'Political, boastful, fight-prone in-laws over money/property. Live-in/affair/illegal money extremes; boundary-crossing after breakups. Distressed pregnancy for mother. Sudden diseases, seizures, cancer, addictions. Strong for occult/tantra; fraud/bribery/grand-paternal karma disputes.',
    9: 'Good dispositor: unconventional rise, japa/siddhi lean, large following. Poor dispositor: father struggle, guru doubt, education breaks, showy charity. Jupiter aspect can make strong tantra/astrology practitioners. Execution house—not mantra-creation (that’s more Venus/5th).',
    10: 'Alone & not malefic: near rājayoga for material or spiritual path (Mesh/Vṛṣabha/Kumbha strong). Desire discipline essential—unchecked appetite derails rise. Foreign work possible.',
    11: 'Excellent natural kāma house for Rahu—strong dashā gains and desire fulfillment when not wildly malefic; keep legality conscious.',
    12: 'Strange/symbolic dreams (snakes, past/future) hard to decode; poor śayyā-sukha or insomnia when combinations support; may also sleep excessively and neglect goals. Knowledge in fragments—needs guidance to avoid confusion; excellent teacher only in thoroughly mastered subjects. Technical mind; extreme desires with limited delivery; impulsive spend. Mixed friend circle; strong intuition; ego-crushing; dharma-fear lean; late-life new spiritual skill hunger. Experimental edges without easy addiction. If Rahu is afflicted: jail / confinement combinations are classically warned. If Moon is also afflicted with this Rahu: class notes warn of mental instability / madness risk—treat as high-alert teaching, still weigh the full chart.',
  },
  Ke: {
    1: 'Introverted, spiritual, few words (that often come true). Detached from worldly gains and family wealth; anxiety themes.',
    2: 'Very few words; statements often come true. Detached from family wealth. Dental/mouth issues possible.',
    3: 'Isolated/blocked neighborhood or near old temples. Introverted; irritated by chatter. Trekking, raw music, occult interests.',
    4: 'Better than Rahu for 4th overall: foreign travel/networking and later career help, yet separation from home comfort and early struggle for domestic ease.',
    5: 'Mantra-siddhi and spiritual accomplishment lean; progeny path often includes at least one pregnancy loss risk—medical care and soft counseling, not certainty language.',
    6: 'Dislikes office politics; prefers independent work. Natural healer. Destroys enemies naturally; debt causes forced detachment.',
    7: 'Spouse often from known social circle/vicinity (not far). When Ketu is relatively clean: soulmate / past-life bond feel. Placement stronger than mere aspect. Eager then detached if expectations inflate—spiritual, low-demand partner suits. Touch sensitivity; sugar/numbness themes if afflicted.',
    8: 'Detachment from in-laws; visit anxiety. Inexpressive, suspicious partner; marital disconnect. Conception after intense prayers to Ganesha/Shiva. Insomnia, nerves, piles themes. Senses death; heal via high-altitude spiritual travel (Kailash, Jyotirlingas, mountains).',
    9: 'Mokṣa lean with completed education when dispositor good; fakir-guru after ~48; wanderer travel partly to space from father. Victory flags and self-inquiry (“Who am I?”); may skip routine lamp rituals.',
    10: 'In Mesh/Vṛścika/Vṛṣabha/Kanyā: śatru-hanta office-politics skill. HR/admin with Mercury. Afflicted: incapacity to work—needs autonomy and specialized niches.',
    11: 'Desires solitude; occult/coding/research passion. Dissatisfaction from friends; often works free/donates earnings. Father betrayed by younger brother; maternal uncle hoards cash/electronics. Only ~50% desires fulfilled; spiritual travel desires granted; strong intuition about others’ crises.',
    12: 'Heart-led mokṣa pull with unclear path at first; spiritual ego possible; quick research/intuition (astrology lean). Parallel/past-life dreams; purpose-seeking; comfort-zone attachment while scolding others for it. Tiny close circle; wanderlust without easy foreign settlement. Meditation strength; limb/restlessness themes. Bed pleasures may still be okay (Ketu as victory kāraka), but class notes link cortisol stress → low testosterone → erectile dysfunction (ED). Under extreme stress: identity crisis, “why am I here,” escape urges, and suicidal-thought risk—encourage real support. Retrograde flavor: friction with one relative possible. Mahādasha may revive old vows or self-realization.',
  },
}

// ── Planet in house: SUMMARY (UI / interpretation) ───────────

const SUMMARY: Record<ClassicalGrahaId, Record<HouseNumber, string>> = {
  Su: {
    1: 'Authoritative presence and leadership focus; strong self-image and practical drive.',
    2: 'Authoritative speech and resource pride; disciplined food/money habits.',
    3: 'Routine, news/politics interest; assertive with younger siblings and local environment.',
    4: 'Home stress and authority at home—protect domestic peace.',
    5: 'Honor/education strength; avoid speculation; Aries Sun—child themes need care.',
    6: 'Strong manager under pressure; ego clashes and heat-related stress need care.',
    7: 'Partnership ego clashes; better as solo authority than equal business partner.',
    8: 'Hidden career/authority tests; isolation and father/authority friction themes.',
    9: 'Duty-bound faith and strong father/guru figures; aims for leadership roles.',
    10: 'Digbala power/career; don’t quit without next offer in Sun periods.',
    11: 'Royal gains image; as Lagna lord can split public/private faces.',
    12: 'Private authority/spiritual isolation; father distance with attachment; foreign with homesickness.',
  },
  Mo: {
    1: 'Sensitive, intuitive, emotionally changeable personality.',
    2: 'Sweet but mood-driven speech; family life moves in emotional waves.',
    3: 'Peaceful surroundings preferred; artistic, romantic mental interests.',
    4: 'Home sanctuary and mother bond when strong; nodes+Mars disturb domestics.',
    5: 'Creative/medical lean; check fertility water themes if afflicted.',
    6: 'Daily routines and service colored by mood cycles—structure helps.',
    7: 'Attractive, emotionally intense partnerships with noticeable mood swings.',
    8: 'Emotional depth and exclusion fears; careful with family criticism dynamics.',
    9: 'Benefic Moon: dharma progress and healing words; weigh pakṣa bala.',
    10: 'Helping reputation; travel/HR/food careers; Moon–Rāhu can still earn.',
    11: 'Desires comfort and beauty; gains may feel irregular or emotionally paced.',
    12: 'Sensitive spender/sleeper; healing lean; home ease often found outside birth home.',
  },
  Ma: {
    1: 'Brave, decisive, competitive self; temper and minor injury themes.',
    2: 'Hardworking family duty and forceful speech when strong; harsh speech if afflicted.',
    3: 'Fast mind, sports/driving drive; assertive local energy.',
    4: 'Property almost certain; fights/theft if afflicted—still home karma.',
    5: 'High drive and modern C-section lean; protect children and boundaries.',
    6: 'Strong upachaya fighter—defense/contest; watch injury and property debt.',
    7: 'Kuja drive in partnerships—leadership and heat; give space and clear contracts.',
    8: 'High-intensity in-law and property dynamics; transformative pressure.',
    9: 'Practical, protective dharma; strict mentors; warrior/manager mindset.',
    10: 'Digbala focus/hard work; Ruchaka when own/exalted—effort still required.',
    11: 'Strong material/competitive gains through loyal groups.',
    12: 'Foreign/export heat; weak Mars (māraṇa + low ṣaḍbala) → ED risk per class notes.',
  },
  Me: {
    1: 'Youthful communicator; natural advisor and problem-solver.',
    2: 'Skilled speech for counseling, trade, and problem-solving income.',
    3: 'Curious multitasker; strong debate and hobby variety.',
    4: 'Garden/arts/home deals when strong; words can break peace if afflicted.',
    5: 'Peak intellect seat—math, astrology, flexible arts when strong.',
    6: 'Thrives in structured service/finance roles; watch trust and paperwork.',
    7: 'Nearby/relative/friend spouse lean; playful bond with Mercury-style ups and downs.',
    8: 'Research and paperwork karma; careful communication of true feelings.',
    9: 'Analytical faith explorer; competitive study and teaching/consulting mentors.',
    10: 'Bhadra lean when strong—rise via speech, wit, teaching.',
    11: 'Excellent multi-stream gains and deal networks.',
    12: 'Hidden research/intuition; trade focus if strong; speech scatter if weak.',
  },
  Ju: {
    1: 'Wise, magnetic guide energy; naturally advisory presence.',
    2: 'Ethical family speech and long-term money planning; listen more if afflicted.',
    3: 'Learning/teaching hobbies; neighborhood near education or sacred spaces.',
    4: 'Value-filled home when strong; protect children if afflicted.',
    5: 'Religious wealth lean; protect progeny if afflicted.',
    6: 'Knowledge with stubborn health/family friction—Virgo Ju separates via work.',
    7: 'Judge Jupiter’s dignity: wise tolerant spouse when strong; strain/delay if afflicted.',
    8: 'Supportive in-laws and hidden spiritual depth; healing others in crisis.',
    9: 'Natural 9th strength—education, gurus, ancestral grace when dignified.',
    10: 'Ethical karma; helps more than pure donation until renunciation.',
    11: 'Trusted networks and timely gains; natural habit of sharing wealth.',
    12: 'Mokṣa guide lean; spend abroad; judge dignity—ego vs true wisdom.',
  },
  Ve: {
    1: 'Charm, aesthetics, and refined comfort shape the personality.',
    2: 'Luxury, food interest, and wealth-friendly charming speech.',
    3: 'Refined local communication; mind on beauty and relationships.',
    4: 'Luxuries when strong; afflicted comforts need spiritual remedies.',
    5: 'Mantra-siddhi and creative fertility lean; foreign bonds with Rahu.',
    6: 'Service through arts/healing; watch luxury-driven debt.',
    7: 'Strong marriage magnetism—choose with values, not looks alone.',
    8: 'Affluent in-law themes; passion and occult interest need balance with marriage.',
    9: 'Devotional aesthetics and prosperous, comfortable fortune path.',
    10: 'Luxury/skill career; watch boundaries if Venus afflicted.',
    11: 'Lifestyle gains with intoxicant/relationship moderation needed.',
    12: 'Selfless love and private bhakti; high desire unmet except by sādhana.',
  },
  Sa: {
    1: 'Serious self built through delayed, disciplined effort.',
    2: 'Cautious speech and delayed but solid wealth building.',
    3: 'Workaholic local habits; resists change; communication can feel harsh.',
    4: 'Isolation at home unless very strong; rental ease possible with Sun.',
    5: 'Tantra interest when strong; slow struggle across 5th themes if weak.',
    6: 'Steady government/service grind; slow wins over many attempts.',
    7: 'Duty-heavy partnerships; success through endurance more than romance.',
    8: 'Secretive work and slow transformation; partial credit for efforts.',
    9: 'Karma-yoga self-made destiny when alone & benefic; late exclusive fruits.',
    10: 'Top career kāraka—fast results if benefic; long grind if malefic.',
    11: 'Structure/logistics gains; few true friends; antique-collector lean.',
    12: 'Long sādhana, hard foreign exit/return; introvert duty then spiritual retreats.',
  },
  Ra: {
    1: 'Ambition and outsider networking; boundary-pushing self-expression.',
    2: 'Big wealth appetite and unconventional speech/food patterns.',
    3: 'Hustler mindset locally; quick gains and risk-taking travel style.',
    4: 'Domestic/education friction; pilgrimage in dashā still possible.',
    5: 'Engineering aptitude; handle childbirth stress gently if malefic.',
    6: 'Favored malefic in upachaya—competitive edge with unusual stress.',
    7: 'Distant/foreign partner lean; intense desire—reciprocity and ethics required.',
    8: 'Powerful occult/research bent with high-intensity in-law and secrecy themes.',
    9: 'Unconventional rise or father/guru doubt by dispositor; japa lean—not mantra authorship.',
    10: 'Near rājayoga if alone & clean; desire discipline essential.',
    11: 'Excellent kāma-house Rahu—strong desire fulfillment in dashā.',
    12: 'Strange dreams; afflicted Rahu → jail lean; + weak Moon → madness risk (class notes).',
  },
  Ke: {
    1: 'Quiet, spiritual, detached self; anxiety with worldly identity.',
    2: 'Sparse but piercing speech; detachment from family wealth themes.',
    3: 'Introverted local life; occult/trek interests; low tolerance for chatter.',
    4: 'Foreign lean with home separation struggle—better than Rahu overall.',
    5: 'Mantra strength with progeny path needing medical/emotional care.',
    6: 'Independent healer energy; debt can force abrupt detachment.',
    7: 'Known-circle spouse; clean Ketu can feel soulmate—keep expectations light.',
    8: 'Deep psychic sensitivity; in-law distance; healing through sacred travel.',
    9: 'Mokṣa lean, completed study when supported; fakir-guru after mid-life.',
    10: 'Enemy-cutting politics in key signs; needs autonomy niches.',
    11: 'Solitude over social climbing; spiritual travel desires fulfill more easily.',
    12: 'Mokṣa pull; cortisol/low-T → ED risk in class notes; stress can trigger escape/suicidal ideation.',
  },
}

export const PLANET_IN_HOUSE_FULL = FULL
export const PLANET_IN_HOUSE_SUMMARY = SUMMARY

// ── Helpers ──────────────────────────────────────────────────

function asHouse(n: number): HouseNumber | null {
  if (n >= 1 && n <= 12) return n as HouseNumber
  return null
}

function asClassical(id: string): ClassicalGrahaId | null {
  if ((CLASSICAL_GRAHAS as string[]).includes(id)) return id as ClassicalGrahaId
  return null
}

export function getHouseTheme(house: number): HouseTheme | null {
  const h = asHouse(house)
  return h ? HOUSE_THEMES[h] : null
}

export function getSignInHouse(house: number, rashi: number): string | null {
  const h = asHouse(house)
  if (!h) return null
  const table = SIGN_IN_HOUSE[h]
  if (!table) return null
  if (rashi < 1 || rashi > 12) return null
  return table[rashi as Rashi] ?? null
}

export function getPlanetInHouse(
  grahaId: string,
  house: number,
  detail: InterpDetail = 'summary',
): string | null {
  const g = asClassical(grahaId)
  const h = asHouse(house)
  if (!g || !h) return null
  return (detail === 'full' ? FULL : SUMMARY)[g][h] ?? null
}

export function isClassicalGraha(id: string): id is ClassicalGrahaId {
  return asClassical(id) !== null
}

export function wholeSignHouseFromLagna(ascRashi: number, planetRashi: number): HouseNumber {
  const a = ((ascRashi - 1) % 12 + 12) % 12
  const p = ((planetRashi - 1) % 12 + 12) % 12
  return (((p - a + 12) % 12) + 1) as HouseNumber
}
