// ─────────────────────────────────────────────────────────────
//  src/lib/engine/rashiDeepGuide.ts
//  Deep rashi teaching notes (attributes, symbolism, careers,
//  spiritual themes). Educational — not medical/legal advice.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import type { ClassicalGrahaId } from './houseInterpretations'

export interface RashiNakshatraSpan {
  name: string
  padas: string
  lord?: string
  note?: string
}

export interface RashiCompatibility {
  best: string[]
  moderate?: string[]
  low?: string[]
  principle: string
}

export interface RashiDeepGuide {
  rashi: Rashi
  english: string
  sanskrit: string
  /** One keyword that dominates the sign in practice */
  keyword: string
  element: 'Agni' | 'Prithvi' | 'Vayu' | 'Jal'
  elementEn: 'Fire' | 'Earth' | 'Air' | 'Water'
  motion: 'Char' | 'Sthir' | 'Dwiswabhav'
  motionEn: 'Movable' | 'Fixed' | 'Dual'
  temperament: string
  risingType: string
  lord: ClassicalGrahaId
  lordName: string
  exaltedPlanet?: string
  strongTime: string
  weakTime?: string
  kaalPurushPart: string
  direction?: string
  varna?: string
  guna?: string
  deity?: string
  chakraHint?: string
  activationAge: string
  nakshatras: RashiNakshatraSpan[]
  symbolMeaning: string[]
  spiritual: string[]
  positiveTraits: string[]
  challengingTraits: string[]
  behavioralNotes: string[]
  careers: string[]
  healthThemes: string[]
  compatibility?: RashiCompatibility
  luckyColors?: string[]
  unluckyColors?: string[]
  gemstone?: string
  /** Lord in this sign vs the other sign of the same lord */
  lordContrast?: string
  practicalNotes: string[]
}

export interface RashiSharedTeaching {
  id: string
  title: string
  points: string[]
}

/** How to combine rashi classifications when reading a bhava */
export const RASHI_CLASSIFICATION_TEACHING: RashiSharedTeaching = {
  id: 'classifications',
  title: 'Reading a rashi in a house',
  points: [
    'Tattva (element) shows how energy moves inside — fire initiates, earth sustains, air connects, water feels.',
    'Gati (Char / Sthir / Dwiswabhav) shows day-to-day lifestyle and how actions unfold.',
    'Kaal Purush body part maps physical and symbolic focus for that sign’s natural house.',
    'Time of strength (morning / noon / evening / night) shows when that energy peaks — plan work for that bhava accordingly.',
    'Combine element + motion + Kaal Purush + strength time on the house where the rashi falls for sharper predictions.',
  ],
}

export const SOUL_JOURNEY_PHASES: RashiSharedTeaching = {
  id: 'soul-journey',
  title: 'Soul’s journey through the zodiac',
  points: [
    'Emergence (Aries–Leo, 1–5): soul rising — will, resources, communication, emotion, ego.',
    'Testing (Virgo–Scorpio, 6–8): purification, partnership balance, and deep transformation.',
    'Liberation (Sagittarius–Pisces, 9–12): dharma, karma peak, collective vision, and moksha.',
    'Libra is the gate: personal journey (1–6) turns toward relating and prepares for Scorpio’s depth.',
  ],
}

export const CHART_KEYWORD_TEACHING: RashiSharedTeaching = {
  id: 'one-keyword',
  title: 'One keyword per chart',
  points: [
    'Ask: what is this chart’s purpose — why was this person born?',
    'Prefer one dominant keyword (spiritual, material, or destructive track) rather than mixing every significator.',
    'Every planet and every sign has one quality that manifests regardless of dignity; expression changes with Desh–Kaal–Patra.',
    'Same significations, different deliverables by place, era, and the person sitting in front of you.',
  ],
}

export const KARMA_TEACHING: RashiSharedTeaching = {
  id: 'karma',
  title: 'Karma and free will (overview)',
  points: [
    'Sanchit: storehouse of all past karma. Prarabdha: the portion fixed for this life (often linked to the 5th).',
    'Kriyaman: current choices via buddhi and vivek — builds future sanchit. Akarmaniya: renunciate path of devotion alone.',
    'Every house has both destined and free-will sides — not only 3/6/11.',
    'Destiny shapes what arrives; free will shapes reaction, diversion, and how you mold the situation.',
  ],
}

export const ACTIVATION_AGES: Record<Rashi, string> = {
  1: '7–12',
  2: '13–16',
  3: '17–21',
  4: '22–24',
  5: '25–28',
  6: '29–32',
  7: '33–35',
  8: '32–35',
  9: '36–40',
  10: '41–44',
  11: '45–48',
  12: '49–52',
}

const GUIDES: Record<Rashi, RashiDeepGuide> = {
  1: {
    rashi: 1,
    english: 'Aries',
    sanskrit: 'Mesha',
    keyword: 'Willpower / “I am”',
    element: 'Agni',
    elementEn: 'Fire',
    motion: 'Char',
    motionEn: 'Movable',
    temperament: 'Kroor (fierce / initiating heat)',
    risingType: 'Prishthodaya',
    lord: 'Ma',
    lordName: 'Mars (Mangal)',
    exaltedPlanet: 'Sun (Surya)',
    strongTime: 'Day — peak Madhyahna (~12–3 PM)',
    weakTime: 'Night',
    kaalPurushPart: 'Head (Mastak)',
    direction: 'East',
    chakraHint: 'First fire rising from Mūlādhāra — sacred initiating Agni',
    activationAge: ACTIVATION_AGES[1],
    nakshatras: [
      { name: 'Ashwini', padas: 'All 4', lord: 'Ketu', note: 'Ketu can delay the start; once moving, full force' },
      { name: 'Bharani', padas: 'All 4', lord: 'Venus' },
      { name: 'Krittika', padas: 'Pada 1 only', lord: 'Sun' },
    ],
    symbolMeaning: [
      'Ram / Mesha: horns curve back — self-reflection and room to improve despite aggression.',
      'Horns map Ashwini–Bharani–Krittika positioning in the sky.',
      'Bhāgavat: head of Kāla Puruṣa — ego (ahaṅkāra) and gateway of consciousness.',
    ],
    spiritual: [
      'Core: “मैं हूं” — first step of the soul’s journey; pure will.',
      'Yukteshwar framing: first fire from the root — generates inner heat for the path.',
      'Mars / Mesh affliction themes often touch nerves, blood flow, and head — educational only.',
    ],
    positiveTraits: [
      'Leadership and front-runner courage',
      'Strong willpower and high energy',
      'Initiative — starts what others only discuss',
      'Loyalty and devotion once attached',
      'Self-reliance and risk appetite',
    ],
    challengingTraits: [
      'Impatience and over-reactivity',
      'Ego and stubbornness (ziddi)',
      'Recklessness without calculation',
      'Revenge impulse when betrayed — cannot rest until the other “realizes”',
    ],
    behavioralNotes: [
      'In groups: often the one talking nonstop — joshele, wants recognition.',
      'Energy like a hyperactive child — best channelled into sport / physical work.',
      'Modern politics: struggles when diplomacy is required — too direct (muṁh pe bolne vāle).',
      'Mesh Lagna: 11th is Aquarius — friend circles often calculative / practical types.',
    ],
    careers: [
      'Entrepreneurship / startups',
      'Sports and defense / military / police',
      'Engineering and construction',
      'Politics (leadership with diplomacy as weak spot)',
      'Dentistry (Mars restructuring + Mercury/Venus teeth themes — educational)',
    ],
    healthThemes: [
      'Head marks / intense gaze often noted classically',
      'Nerve and circulation themes when Mars/Mesh is stressed — not a diagnosis',
    ],
    compatibility: {
      best: ['Leo (Singh) — fire with strategy', 'Sagittarius (Dhanu) — adventure and independence', 'Gemini (Mithun) — air fuels fire and shows both sides'],
      moderate: ['Aquarius (Kumbh) — too calculative for emotional Mesh'],
      low: ['Cancer (Karka) — opposite emotional need for security', 'Libra (Tula) — needs patience Mesh lacks', 'Capricorn / Scorpio — stillness vs flowing heat'],
      principle: 'Matches energy, adventure, and risk capacity — not those who need stillness or heavy dependency.',
    },
    luckyColors: ['Red', 'Orange', 'Yellow'],
    unluckyColors: ['Black', 'Blue', 'Green'],
    gemstone: 'Red coral (Moonga) — oval to balance, triangular to intensify; educational color therapy framing only',
    lordContrast:
      'Mars in Aries = outer battlefield, direct sword. Mars in Scorpio = inner war, mind games, suppressed heat (warrior without an open field).',
    practicalNotes: [
      'Important Mesh-house work often peaks before ~2 PM when Mesh energy is strong.',
      'Gemstones and colors are supportive color/medical-astrology frames — not magic fixes.',
      'Install mentorship: Mesh thrives under clear orders.',
    ],
  },

  2: {
    rashi: 2,
    english: 'Taurus',
    sanskrit: 'Vrishabha',
    keyword: 'Nourishment / dependability',
    element: 'Prithvi',
    elementEn: 'Earth',
    motion: 'Sthir',
    motionEn: 'Fixed',
    temperament: 'Stable, elegant, strong',
    risingType: 'Mukhodaya / Shirshodaya',
    lord: 'Ve',
    lordName: 'Venus (Shukra)',
    strongTime: 'Morning',
    kaalPurushPart: 'Mouth (Mukh) and speech (Vāṇī)',
    chakraHint: 'Svādhiṣṭhāna — senses, creativity, dependable rasa',
    activationAge: ACTIVATION_AGES[2],
    nakshatras: [
      { name: 'Krittika', padas: 'Padas 2–4', note: 'Pada 1 in Mesha' },
      { name: 'Rohini', padas: 'All 4' },
      { name: 'Mrigashira', padas: 'Padas 1–2', note: 'Padas 3–4 in Mithuna' },
    ],
    symbolMeaning: [
      'Bull / Nandi — devotion, love, and earth-rooted strength.',
      'Agricultural symbolism: plowing and cart — nourishment and resources.',
      'Patient when unprovoked; lethal once angered — “एक बार बिगड़ गया तो जान लेके ही छोड़ेगा”.',
    ],
    spiritual: [
      'Yukteshwar: “ātmā mein rasa kā praveś” — nectar nourishing the whole system.',
      'Shukra path: bhog se moksha — enjoy without addiction; stability can become detachment (asakt bhāv).',
      'Venus also flavors refined speech (not only Mercury’s clever talk).',
    ],
    positiveTraits: [
      'Highest patience and perseverance',
      'Grounded, stable, resourceful',
      'Creative and nurturing',
      'Family-oriented and dependable',
      'Wealth-conscious without needing show',
    ],
    challengingTraits: [
      'Stubborn attachment to comfort and values',
      'Silent absorption until sudden explosion',
      'Material fixation if rasa turns only to bhog',
    ],
    behavioralNotes: [
      'Bears burdens others drop; flexible workhorse when content.',
      'Bull vs cow lore: simpler needs, earth-touch, contentment as spiritual marker.',
      'Strong 2nd-house themes support breath practices like Bhrāmarī (educational).',
    ],
    careers: [
      'Finance, luxury, fashion, art, music',
      'Farming and real estate',
      'Any field of sustained resource building',
    ],
    healthThemes: [
      'Mouth, speech, and sensory indulgence patterns',
      'Earth-sign daytime activity preference — educational timing only',
    ],
    lordContrast:
      'Taurus Venus = “what is MINE” — body, comfort, secure rasa, then nurture others. Libra Venus = “what is OURS” — balances everyone else first and may neglect self.',
    practicalNotes: [
      'Vrishabha Dāna (releasing a bull at a tīrtha) is classical pitṛ-liberation lore — cultural context, not an app prescription.',
      'Wherever Taurus sits is often where resources are stored or protected.',
    ],
  },

  3: {
    rashi: 3,
    english: 'Gemini',
    sanskrit: 'Mithuna',
    keyword: 'Bridge / knowledge',
    element: 'Vayu',
    elementEn: 'Air',
    motion: 'Dwiswabhav',
    motionEn: 'Dual',
    temperament: 'Dual — inside vs outside, home vs friends',
    risingType: 'Shirshodaya / Mukhodaya',
    lord: 'Me',
    lordName: 'Mercury (Budh)',
    strongTime: 'Night / evening (Sāyam–Rātri balī)',
    kaalPurushPart: 'Arms / shoulders (Bhuja)',
    direction: 'West (Paścim)',
    varna: 'Śūdra',
    deity: 'Viṣṇu',
    chakraHint: 'Maṇipūra themes — communication, power, intelligence',
    activationAge: ACTIVATION_AGES[3],
    nakshatras: [
      { name: 'Mrigashira', padas: 'Padas 3–4' },
      { name: 'Ardra', padas: 'All 4', lord: 'Rahu', note: 'Kāma / intensity of desire-learning' },
      { name: 'Punarvasu', padas: 'Padas 1–3', note: 'Pada 4 in Karka' },
    ],
    symbolMeaning: [
      'Male–female pair (mace and vīṇā) — dual form.',
      'Classical link to Yama–Yamī (Uttar Kālāmṛta / Ṛgveda twin framing) — treat 3rd-house dashās with respect.',
      'Arms = karmashīltā: capacity for effort and short journeys that teach.',
    ],
    spiritual: [
      'Bridge between ahaṁ (ego personality) and ātmā — the bridge is knowledge.',
      'Teaches balance of Dvaita and Advaita, speech and mauna.',
      'Anuloma–viloma association when the sign is strong — lung/spine balance lore (educational).',
      'Mercury issues: Viṣṇu Sahasranāma / Viṣṇu–Rāma–Kṛṣṇa connection as classical remedy frame.',
    ],
    positiveTraits: [
      'Wit, humor, ready replies (hāzir-jawāb)',
      'Intellectual multitasking and networking',
      'Skilled oratory and multiple crafts',
      'Adventurous mental energy',
      'Knows and can showcase own caliber',
    ],
    challengingTraits: [
      'Focus breaks every ~30 minutes; incomplete tasks',
      'Indecision and need for many opinions',
      'Job hopping / frequent transfers',
      'Speech can create controversy',
    ],
    behavioralNotes: [
      'Business expands sideways; jobs change; government roles often transfer every 2–3 years.',
      'Check 3rd and 5th for transfer patterns.',
      'Short journeys always teach — guru meetings, lessons, obstacles included.',
      'Classical physique notes vary; planetary yoga modifies height/face — never absolutize.',
    ],
    careers: [
      'Media, writing, journalism, advertising, PR',
      'Teaching (creative / modern methods)',
      'Telecom / ECE / digital communication',
      'Strategy, planning, networking roles',
      'Crafts depending on associating planets',
    ],
    healthThemes: [
      'Arms, shoulders, lungs, and nervous restlessness when air is overactive',
      'Balance speech with breath — educational yoga framing',
    ],
    lordContrast:
      'Gemini Mercury = playful messenger, broad curiosity, quick change. Virgo Mercury = mature analyzer, verifies before spreading, masters one depth.',
    practicalNotes: [
      'Gemini wants to give knowledge, network, popularity, oratory, and balance.',
      'Desh–Kaal–Patra: same Mithuna Lagna, different era and circumstances → different life story.',
    ],
  },

  4: {
    rashi: 4,
    english: 'Cancer',
    sanskrit: 'Karka',
    keyword: 'Emotions',
    element: 'Jal',
    elementEn: 'Water',
    motion: 'Char',
    motionEn: 'Movable',
    temperament: 'Soft, changeable, motherly',
    risingType: 'Prishthodaya (classically watery)',
    lord: 'Mo',
    lordName: 'Moon (Chandra)',
    strongTime: 'Night',
    kaalPurushPart: 'Chest / heart region',
    direction: 'North',
    varna: 'Brāhmaṇa',
    deity: 'Śiva',
    chakraHint: 'Linked with mind-mirror and Anāhata feeling field; Iḍā (Moon channel) lore',
    activationAge: ACTIVATION_AGES[4],
    nakshatras: [
      { name: 'Punarvasu', padas: 'Pada 4' },
      { name: 'Pushya', padas: 'All 4' },
      { name: 'Ashlesha', padas: 'All 4' },
    ],
    symbolMeaning: [
      'Crab: hard shell outside, soft inside — withdraws when hurt is sensed.',
      'Running / river water — emotions that move and change.',
      'Natural 4th: home, mother, roots, subconscious, ancestral imprint.',
    ],
    spiritual: [
      '“Candramā manaso jātaḥ” — Moon as mirror of mind.',
      'Self-analysis, meditation, bhakti; home temples common when strong.',
      'Healer lesson: be a mirror for others’ feelings — reflect, do not drown (shell protects).',
    ],
    positiveTraits: [
      'Compassion, nurturing, high EQ',
      'Imagination and intuitive sensing',
      'Strong family values',
      'Non-verbal emotional intelligence',
    ],
    challengingTraits: [
      'Mood swings (water + movable)',
      'Over-protectiveness and possessiveness',
      'Holding past trauma; HSP burnout risk',
      'Anxiety when security feels threatened',
    ],
    behavioralNotes: [
      'In female charts: menstrual / hormonal / divine-feminine themes are classical Moon–Karka links — educational.',
      'Dreams and “I’ve done this before” déjà vu often noted when Cancer is strong.',
      'Iḍā active at night lore for cooling and sleep — practice framing only.',
    ],
    careers: [
      'Nursing, counseling, psychology',
      'Hospitality, food, tiffin / kitchen service',
      'Real estate and home décor',
      'Emotional healing professions',
    ],
    healthThemes: [
      'Chest, lungs, fluids / edema themes when afflicted',
      'Sleep quality and hormonal balance — educational, not diagnostic',
    ],
    practicalNotes: [
      'Primary focus in analysis: emotional patterns, mother/home, and how the native nurtures.',
      'Water signs often peak at night — match important Cancer-house work to that rhythm when relevant.',
    ],
  },

  5: {
    rashi: 5,
    english: 'Leo',
    sanskrit: 'Simha',
    keyword: 'Ego (Ahaṁ)',
    element: 'Agni',
    elementEn: 'Fire',
    motion: 'Sthir',
    motionEn: 'Fixed',
    temperament: 'Sāttvic radiant authority',
    risingType: 'Shirshodaya',
    lord: 'Su',
    lordName: 'Sun (Sūrya)',
    strongTime: 'Day',
    kaalPurushPart: 'Heart / upper belly region (classical)',
    direction: 'East',
    chakraHint: 'Piṅgalā (Sun channel) — “I AM”, digestiive fire, confidence',
    activationAge: ACTIVATION_AGES[5],
    nakshatras: [
      { name: 'Magha', padas: 'All 4' },
      { name: 'Purva Phalguni', padas: 'All 4' },
      { name: 'Uttara Phalguni', padas: 'Pada 1', note: 'Padas 2–4 in Kanyā' },
    ],
    symbolMeaning: [
      'Lion / royal seat — tejas, dharma lean, rāja influence (Parāśara flavor).',
      'Natural 5th: soul creativity, intelligence, prārabdha fruits — rāja-ṛṣi potential.',
      'Father significations and completing father’s unfinished work when afflicted.',
    ],
    spiritual: [
      'Evolve self-love into universal love; surrender ahaṁ to ātmā.',
      'When ego dominates, criticism feels like enmity — humility is the practice.',
      'Piṅgalā vs Iḍā: action/heat vs mind/cool — balance for nāḍī health (educational).',
    ],
    positiveTraits: [
      'Natural leadership and decisive authority',
      'Confidence, generosity, management skill',
      'Public speaking and influence',
      'Royal dignity and protective warmth',
    ],
    challengingTraits: [
      'Inflated self-image; difficulty accepting criticism',
      'Attention hunger and emotional rigidity',
      'Leadership pressure becoming isolation',
    ],
    behavioralNotes: [
      'Leo in 3rd class example: gains and duties with little inner attachment — outer success can feel empty.',
      'Needs recognition but must learn constructive feedback.',
    ],
    careers: [
      'Corporate leadership and management',
      'Public figures, politics, authority roles',
      'Technology leadership when Sun is skilled',
    ],
    healthThemes: [
      'Heart, vitality, and heat regulation via Sun/Piṅgalā lore',
      'Daytime strength — schedule Leo-house peaks accordingly',
    ],
    practicalNotes: [
      'Keyword in chart reading: ego journey — where must pride become service?',
      'Triveṇī / Suṣumṇā meeting at Ājñā is shared yoga context for Sun–Moon balance, not sign-exclusive.',
    ],
  },

  6: {
    rashi: 6,
    english: 'Virgo',
    sanskrit: 'Kanyā',
    keyword: 'Purification / service',
    element: 'Prithvi',
    elementEn: 'Earth',
    motion: 'Dwiswabhav',
    motionEn: 'Dual',
    temperament: 'Analytical, service-oriented',
    risingType: 'Shirshodaya',
    lord: 'Me',
    lordName: 'Mercury (Budh)',
    exaltedPlanet: 'Mercury (mūlatrikoṇa 0–15°, exaltation peak ~15°)',
    strongTime: 'Morning into early afternoon (~7 AM–2:30 PM)',
    weakTime: 'Evening mental fatigue after sunset',
    kaalPurushPart: 'Belly / intestines (digestive field)',
    activationAge: ACTIVATION_AGES[6],
    nakshatras: [
      { name: 'Uttara Phalguni', padas: 'Padas 2–4', note: 'Purifying relationships and contracts' },
      { name: 'Hasta', padas: 'All 4', note: 'Karma and healing hands' },
      { name: 'Chitra', padas: 'Padas 1–2', note: 'Beauty, craft, creation' },
    ],
    symbolMeaning: [
      'Maiden with grain — ready to serve, heal, and offer remedy.',
      'Natural 6th: roga, ripu, ṛṇa — disease, enemy, debt as purification drama.',
      'Service is the gateway; diagnosis and healing abilities.',
    ],
    spiritual: [
      'Tapas, dhyāna, sevā — from impurity to purity.',
      'Mantra of practice: safāī — cleanliness of soul, body, mind, home, relationships.',
      'Unexpressed sexual/creative heat can become anxiety or, if channelled, healing/tantra discipline — educational frame only.',
    ],
    positiveTraits: [
      'Analytical, detail-oriented, practical',
      'Hard-working, hygienic, disciplined',
      'Health-conscious problem solvers',
      'Honest and reliable once trust is earned',
    ],
    challengingTraits: [
      'Criticism, judgment, perfectionism',
      'Overthinking and silent anxiety',
      'Trust builds slowly; emotional expression hard',
      'Feeling that everything is incomplete',
    ],
    behavioralNotes: [
      'Appears stable outside while calculating and replaying for years inside.',
      'Earth signs prefer daytime analytical work; water signs night — timing lore.',
      'When Virgo dominates the chart: karmic repayment via healing and service.',
    ],
    careers: [
      'Medicine, nutrition, research, data analysis',
      'Accounting, auditing, editing, counseling',
      'Modern: data science, AI audit, cyber security, health-tech, environment',
      'Hands skills: typing, craft, yoga teaching, astrology practice',
    ],
    healthThemes: [
      'Stomach / intestines / digestion vulnerability',
      'Mental stress, OCD-lean, burnout — silent anxiety pattern',
    ],
    lordContrast:
      'Virgo Mercury verifies and refines (“master this”). Gemini Mercury spreads and multitasks (“know everything”).',
    practicalNotes: [
      'Remedies lean to sevā (gau, orphanage, elderly, environment) and humility — not more self-criticism.',
      'Moon in Virgo: emotions measured under a microscope — replay of mistakes is common.',
    ],
  },

  7: {
    rashi: 7,
    english: 'Libra',
    sanskrit: 'Tulā',
    keyword: 'Balance',
    element: 'Vayu',
    elementEn: 'Air',
    motion: 'Char',
    motionEn: 'Movable',
    temperament: 'Rājasic diplomacy',
    risingType: 'Shirshodaya',
    lord: 'Ve',
    lordName: 'Venus (Shukra)',
    strongTime: 'Day / relational hours',
    kaalPurushPart: 'Lower belly / renals region (classical)',
    activationAge: ACTIVATION_AGES[7],
    nakshatras: [
      { name: 'Chitra', padas: 'Padas 3–4' },
      { name: 'Swati', padas: 'All 4' },
      { name: 'Vishakha', padas: 'Padas 1–3', note: 'Pada 4 in Vṛścika' },
    ],
    symbolMeaning: [
      'Scales — balance karma, not mere pleasure (contrast Taurus).',
      'Blindfolded justice trap: balancing others while eyes covered on self.',
      'Zodiac midpoint / gate: personal arc turns toward others before Scorpio’s depth.',
    ],
    spiritual: [
      'Learn to balance negative/positive, inner/outer, want vs action.',
      'Truth-based balance beyond worldly pleasure.',
      'Fire + air barren (bañjar) lore with Aries/Leo/Sag/Gemini/Aquarius for progeny & medinī contexts — not absolute infertility.',
    ],
    positiveTraits: [
      'Partnership skill, diplomacy, PR speech',
      'Aesthetic judgment and bridge-building',
      'Ability to join people and settle disputes',
      'Counseling and presentation craft',
    ],
    challengingTraits: [
      'Self-imbalance while balancing the world',
      'Decision paralysis and over-compromise',
      'Self-worth dependent on acceptance',
      'Surface harmony obsession',
    ],
    behavioralNotes: [
      'Never likes being alone; needs company and approval.',
      'Aries–Libra axis: Mars vs Venus, “I” vs “We”, impulse vs patience — classical friction.',
      'Libra engineers often drawn to bridges/flyovers lore — aesthetic balance.',
    ],
    careers: [
      'Law, diplomacy, arbitration, HR, PR',
      'Brand / image building, politics oration',
      'Psychology ambassadors, cultural diplomacy',
      'Counseling and partnership businesses',
    ],
    healthThemes: [
      'Mental stress from perpetual weighing',
      'Air-sign barren classification for fertility analysis contexts only',
    ],
    compatibility: {
      best: ['Fellow air/fire that can still respect relating'],
      low: ['Aries — opposite axis, patience clash'],
      principle: 'Works when the other allows mutual balance without trapping Libra in endless people-pleasing.',
    },
    lordContrast:
      'Libra Venus is mind and “ours”; Taurus Venus is body and “mine”. Reputation outside can look excellent while close partnerships strain if self is neglected.',
    practicalNotes: [
      'Main dilemma: how much others need you vs how much you need others — live without false guilt.',
      'Per Parāśara framing taught in class: Virgo is not bañjar; fire and air are.',
    ],
  },

  8: {
    rashi: 8,
    english: 'Scorpio',
    sanskrit: 'Vrishchika',
    keyword: 'Transformation',
    element: 'Jal',
    elementEn: 'Water',
    motion: 'Sthir',
    motionEn: 'Fixed',
    temperament: 'Tāmasic depth — stagnant water',
    risingType: 'Prishthodaya',
    lord: 'Ma',
    lordName: 'Mars (Mangal)',
    strongTime: 'Night',
    kaalPurushPart: 'Genitals / reproductive field',
    activationAge: ACTIVATION_AGES[8],
    nakshatras: [
      { name: 'Vishakha', padas: 'Pada 4', note: 'Forked desire — long goals' },
      { name: 'Anuradha', padas: 'All 4', lord: 'Mitra', note: 'Friendship, bhakti, discipline — good for sādhakas' },
      { name: 'Jyeshtha', padas: 'All 4', note: 'Eldest — heavy responsibility, hypnotic gaze' },
    ],
    symbolMeaning: [
      'Scorpion — hidden sting, secret power, death–rebirth.',
      'Stagnant water: depth that can grow toxicity if not transformed.',
      'Philosophy: vināś se sṛjan — destruction that creates.',
      'Snake shedding skin: painful renewal that must release the past mentally.',
    ],
    spiritual: [
      'Full Mūlādhāra→Sahasrāra journey; kundalinī / tantra–mantra depth (dakṣiṇa and vāma frames in classical lore).',
      'Jaimini: primary occult-science sign; Phaladīpikā “viṣayukta” (poison-linked) caution.',
      'Śiva tattva: death and immortality together; Garuḍa Purāṇa afterlife-journey flavor when strong without sādhanā.',
      '8th / āyuṣ: sudden endings and revival themes — educational longevity only; always read Saturn + 8th together.',
      'Occult cluster lore: tantra, nāga vidyā, chemical/poison mastery; Venus influence can color mṛt-sañjīvanī / healing revival themes.',
      'Ketu as Mars’s co-delivery: irritation (not open rage), multi-angle attack, deep digging, burst energy then fatigue.',
    ],
    positiveTraits: [
      'Secret-keepers and psychology readers',
      'Loyal once committed; resilient survivors',
      'Research to the foundation — beyond roots',
      'Strong intuition / sixth sense and subconscious activation',
      'Transforms crises into rebirth when they release attachment to old pain',
    ],
    challengingTraits: [
      'Jealousy, suspicion, hidden anger that explodes late',
      'Vengeance that can self-harm to destroy the betrayer',
      'Mental pressure and reproductive/hormonal stress lore',
      'Holding challenges in the mind so stagnant water turns toxic',
    ],
    behavioralNotes: [
      'In 8th/Scorpio dashā even loud people start hiding innermost thoughts.',
      'Sudden crises (often financial more than physical) with escapes — pattern lore.',
      'Never fights openly — mind games and calculated timing.',
      'People constantly confide secrets; brand/aesthetic privacy and spiritual peace often co-exist.',
      'Daily “sudden” micro-crises are common; physical accidents often leave them unhurt — pattern observation, not prediction.',
    ],
    careers: [
      'Intelligence agencies, cyber security, detective work',
      'Psychotherapy and depth psychology',
      'Research: AI, quantum, genetics, nuclear, biotech, space secrets',
      'Occult / mantra–tantra study when chart supports (educational framing)',
    ],
    healthThemes: [
      'Reproductive / hormonal field of Kāla Puruṣa',
      'Psychological pressure — channel into research or sādhanā',
      'Longevity reading: Scorpio + 8th + Saturn together — never isolate one factor',
    ],
    lordContrast:
      'Aries Mars = face-to-face warfare, outer leadership. Scorpio Mars = PTSD-like inner battlefield; warrior without an open field fights itself through irritation and strategy.',
    practicalNotes: [
      'Snake shedding skin: release past challenges mentally or they stagnate.',
      'Use hidden powers constructively; keep secrets without total emotional suppression.',
      'Natural spiritual abilities — develop them; do not weaponize psychology.',
      'When analyzing: catch the one keyword (transformation / secrecy / research) rather than listing every occult significator.',
    ],
  },

  9: {
    rashi: 9,
    english: 'Sagittarius',
    sanskrit: 'Dhanu',
    keyword: 'Dharma / aspiration',
    element: 'Agni',
    elementEn: 'Fire',
    motion: 'Dwiswabhav',
    motionEn: 'Dual',
    temperament: 'Kroor in Jaimini upheaval sense; Sāttvic aim',
    risingType: 'Prishthodaya',
    lord: 'Ju',
    lordName: 'Jupiter (Guru)',
    strongTime: 'Night',
    kaalPurushPart: 'Thighs / hips',
    direction: 'East',
    varna: 'Kṣatriya',
    guna: 'Sāttvic',
    activationAge: ACTIVATION_AGES[9],
    nakshatras: [
      { name: 'Mula', padas: 'All 4', note: 'Nirṛti — destroy old to plant dharma' },
      { name: 'Purva Ashadha', padas: 'All 4', note: 'Purification and emotional control' },
      { name: 'Uttara Ashadha', padas: 'Pada 1', note: 'Universal welfare; rest in Makara' },
    ],
    symbolMeaning: [
      'Half-human half-animal with bow aimed up — beast to sage.',
      'Arrow to sky = high goals; bow pulled back = remember past mistakes.',
      'Last of Dakṣiṇāyana — gateway before Uttarāyaṇa light (Makara Saṅkrānti).',
      'Called Brahma-nāla / ancestral–kul dharma portal in teaching lore.',
    ],
    spiritual: [
      'Three journeys: paśu→ṛṣi, bhog→yog, jhūṭh→sach.',
      'Mental lotus blooms with a true guru — guidance is medicine.',
      'Internet / visa (9th) connectivity lore — darkness to light bridge.',
      '“धनुष गुरु धर्म वृद्धि” — Jupiter here grows dharma, truth, knowledge.',
    ],
    positiveTraits: [
      'Lifelong learner, philosophical, ethical guide',
      'Global / multicultural mind',
      'Philanthropic high aspirations',
      'Teaching and counseling gift',
    ],
    challengingTraits: [
      'Inner conflict: stay or go, can I achieve?',
      'Irritability from inner fire; past/future, rarely present',
      'Cannot tolerate possessiveness',
      'Long path to goals; jealousy of others’ speed',
    ],
    behavioralNotes: [
      'Cannot stick to one career forever — needs variety.',
      'Partner = soulmate frame; freedom non-negotiable.',
      'Jaimini dashā of the sign can bring major upheavals.',
    ],
    careers: [
      'Higher education, philosophy, law, ethics',
      'International relations, human rights, public policy',
      'EdTech, ethical tech, sustainable development',
    ],
    healthThemes: [
      'Thighs/hips; pitta heat; Jupiter–Moon digestion lore when discussing acid themes',
      'Night strength — match Dhanu-house peaks when relevant',
    ],
    lordContrast:
      'Sagittarius Jupiter accumulates, teaches outwardly, establishes truth. Pisces Jupiter surrenders, dissolves into truth, spends rather than hoards.',
    practicalNotes: [
      'Ketu in Dhanu: philosophers and ritualists; reputation disturbance and quick monotony possible.',
      'Activation often loudest ~36–40 with supporting dashās.',
    ],
  },

  10: {
    rashi: 10,
    english: 'Capricorn',
    sanskrit: 'Makara',
    keyword: 'Karma / patience',
    element: 'Prithvi',
    elementEn: 'Earth',
    motion: 'Char',
    motionEn: 'Movable',
    temperament: 'Saumya outer, tāmasic depth',
    risingType: 'Prishthodaya',
    lord: 'Sa',
    lordName: 'Saturn (Śani)',
    strongTime: 'Night',
    kaalPurushPart: 'Knees / joints below thighs',
    direction: 'South',
    varna: 'Vaiśya',
    guna: 'Tāmasic',
    activationAge: ACTIVATION_AGES[10],
    nakshatras: [
      { name: 'Uttara Ashadha', padas: 'Padas 2–4', note: 'Permanent ethical victory' },
      { name: 'Shravana', padas: 'All 4', note: 'Listen, absorb, reflect in karma' },
      { name: 'Dhanishtha', padas: 'Padas 1–2', note: 'Aṣṭa Vasus — hidden luxury/energy' },
    ],
    symbolMeaning: [
      'Crocodile: extreme patience, strikes when ready, never releases the grip.',
      'Rough outer skin, soft inner emotional reservoir — “crocodile tears” strategy lore.',
      'Natural 10th: all karma dimensions, peak potential, prestige.',
      'Uttarāyaṇa begins here — light spreads from Makara.',
    ],
    spiritual: [
      'Struggle itself is sādhanā; no shortcuts.',
      'Yama / kāla justice; pitṛ karma — father’s unfinished duties often land here.',
      'Saturn’s justice (incl. sāḍhe sātī) is to be experienced — remedies are secondary to right conduct.',
    ],
    positiveTraits: [
      'Hardworking, disciplined, patient administrators',
      'Strategic, hierarchical respect, tradition builders',
      'Slow but permanent success',
      'Mountain-climber persistence',
    ],
    challengingTraits: [
      'Outer confidence vs inner insecurity about ambition',
      'Secretive, judgmental when unasked',
      'Power ego; emotional dryness when Moon is here',
    ],
    behavioralNotes: [
      'Paradox: practical face, deep feelings inside.',
      'Jupiter debilitated here — expansion meets restriction.',
      'Moon here struggles to express — stress and “viṣa-yoga” flavor lore.',
    ],
    careers: [
      'Corporate leadership, administration, judiciary',
      'Government and authority roles',
      'Any field needing discipline and long patience',
    ],
    healthThemes: [
      'Knees, joints, chronic fatigue patterns with Saturn',
      'Opposite-sign “remedy by strengthening enemy” is rejected in this teaching — doesn’t work logically',
    ],
    lordContrast:
      'Capricorn Saturn = personal karma field, judge-like structure. Aquarius Saturn = collective reform, society protocols, detached objectivity.',
    practicalNotes: [
      'Activation often ~41–44. You reap what you sow.',
      'Ketu here: career transformation, Vedic ritual lean, rush vs patience conflict.',
    ],
  },

  11: {
    rashi: 11,
    english: 'Aquarius',
    sanskrit: 'Kumbha',
    keyword: 'Collective welfare / lonely in a crowd',
    element: 'Vayu',
    elementEn: 'Air',
    motion: 'Sthir',
    motionEn: 'Fixed',
    temperament: 'Kroor, tāmasic visionary',
    risingType: 'Shirshodaya',
    lord: 'Sa',
    lordName: 'Saturn (Śani)',
    strongTime: 'Daytime',
    kaalPurushPart: 'Calves (piṇḍaliyāṁ)',
    direction: 'West',
    varna: 'Śūdra',
    guna: 'Tāmasic',
    activationAge: ACTIVATION_AGES[11],
    nakshatras: [
      { name: 'Dhanishtha', padas: 'Padas 3–4', note: 'Craft, art, networking' },
      { name: 'Shatabhisha', padas: 'All 4', note: 'Secret healing, science, research' },
      { name: 'Purva Bhadrapada', padas: 'Padas 1–3', note: 'Discipline and philosophical vision' },
    ],
    symbolMeaning: [
      'Person pouring kumbha — sarvajan hitāya; quench every thirst.',
      'Natural 11th: desires, gains, networks, results.',
      'Amṛt pot vs viṣ pot — path depends on selfishness vs service.',
    ],
    spiritual: [
      'High default consciousness and unusual / prophetic dreams.',
      'Past and present memory significations; cosmic frequency matching.',
      'Rahu as Saturn’s “delivery boy” for tech, maya, magnification — co-ruler flavor.',
      'If selfishness kills the collective heart, native feels stuck “neither here nor there”.',
    ],
    positiveTraits: [
      'Humanitarian, NGO / reform instinct',
      'Tech, networks, digitization, out-of-box science',
      'Team vision: “if I rise, let all rise”',
      'Longevity and strong intuition indications',
    ],
    challengingTraits: [
      'Loneliness despite huge networks',
      'Rise–fall–rise pattern with desire-triggered crashes',
      'Detached intimacy when protocols feel threatened',
    ],
    behavioralNotes: [
      'Hardworking “curseful” karma sign — double results for efforts after restart.',
      'Early Kumbha activation may skip corporate path into social reform.',
      'Health: nerves, energy, psychology, sleep, device effects lore.',
    ],
    careers: [
      'Technology, startups, large tech corps',
      'NGOs, social services, science & innovation',
      'Networking / media infrastructure roles',
    ],
    healthThemes: [
      'Nervous system, sleep, and electronic overstimulation themes',
      'Daytime strength for Kumbha-house work',
    ],
    lordContrast:
      'See Capricorn vs Aquarius Saturn: self-structure vs community vision; corporate judge vs protocol reformer.',
    practicalNotes: [
      'Illusion: world-sized network yet cannot share the innermost — that is the paradox to watch.',
      'Rahu dashā often unnoticed early; effects loud mid-period; stabilize near the end.',
    ],
  },

  12: {
    rashi: 12,
    english: 'Pisces',
    sanskrit: 'Meena',
    keyword: 'Surrender / moksha',
    element: 'Jal',
    elementEn: 'Water',
    motion: 'Dwiswabhav',
    motionEn: 'Dual',
    temperament: 'Saumya, sāttvic',
    risingType: 'Ubhayodaya',
    lord: 'Ju',
    lordName: 'Jupiter (Guru)',
    strongTime: 'Strong day and night',
    kaalPurushPart: 'Feet and heels',
    direction: 'North',
    varna: 'Brāhmaṇa',
    guna: 'Sāttvic',
    activationAge: ACTIVATION_AGES[12],
    nakshatras: [
      { name: 'Purva Bhadrapada', padas: 'Pada 4', note: 'Secretive sacrifice lean' },
      { name: 'Uttara Bhadrapada', padas: 'All 4', note: 'Deep contemplation, path discernment' },
      { name: 'Revati', padas: 'All 4', note: 'Music, craft, travel, guidance, nurture' },
    ],
    symbolMeaning: [
      'Two fish opposite ways — bhog/maya upper vs sādhanā lower.',
      'Last sign: completion portal; endings and sudden beginnings coexist.',
      'Wherever Meena falls, two paths appear for that house’s topics: escape vs sacrifice.',
      'Transition gateway: career shifts, foreign moves, and spiritual awakenings can arrive without long planning.',
    ],
    spiritual: [
      'Escape can be healthy (conscious renunciation with permission) or unhealthy (debts, cases, medical cost flight, abandonment).',
      'Channel “let go” toward ego, attachment, and fear — then cosmic connection opens.',
      'Betrayals, confusion, urge to flee, addiction loops = hints to turn spiritual.',
      'Music / frequency therapy (trance, healing tones) often soothes Meena periods.',
      'Dreams of future, past lives, and ancestors are common; intuition defaults “on” for the house Meena occupies.',
      'Bedroom-of-life / afterlife / ashram / hospital / exile significations — the hidden and the liminal.',
    ],
    positiveTraits: [
      'Compassion, mercy, service bhāva',
      'Imagination, intuition, healing gift',
      'Creative tech-art (VFX, digital design)',
      'Soft heart with open-sky thinking',
      'Completes long-pending work in Meena periods (“moksha” of tasks)',
    ],
    challengingTraits: [
      'Daydreaming, wandering, escapism',
      'Weak decisions; boundary confusion',
      'Unexplained guilt and unidentified fears',
      'Toxic relating when boundaries dissolve — “open sky is mine” oversteps',
      'Thin line between imagination and illusion / fake-guru risk if Jupiter is misused',
    ],
    behavioralNotes: [
      'During Meena dashās, pending work from years ago often completes.',
      'Private / bedroom-of-life: secrecy about the house Meena occupies; Lagna Meena often introverted after a hyperactive childhood.',
      'Mercury debilitated here — logic panic or gifted silent absorption.',
      'Relationships: “someone else will come” let-go attitude — teach boundaries gently; they resist correction.',
      'Constant tests: “Am I on the right path?” — clarity vs confusion battles.',
    ],
    careers: [
      'Astrology, spiritual guidance, counseling',
      'Music / sound therapy, dream work, past-life regression, psychoanalysis',
      'Hospitals, ashrams, foreign / retreat / healing centers',
      'Tech-enabled creative arts (graphic, VFX, digital design)',
    ],
    healthThemes: [
      'Feet and heels (Kāla Puruṣa)',
      'Circulation / blood-flow and blockage lore when stressed',
      'Neurological and psychic sensitivity — “fish diving deep, brain first” metaphor in teaching',
      'Lymphatic / edema / fluid-retention themes; auto-immune and psychosomatic patterns',
      'Stress-triggered allergic / urticaria-type lore in class cases — educational only, never diagnose from sign alone',
      'Mercury’s debilitation here colors mental processing under emotional oceans',
    ],
    lordContrast:
      'Pisces Jupiter = inner light, surrender, money comes and goes, dissolves boundaries. Sagittarius Jupiter = outer teaching, accumulation, debates, respects boundaries while expanding.',
    practicalNotes: [
      'Bottom line: surrender to divine energy or flow with it — choose conscious surrender over unconscious escape.',
      'Activation often ~49–52 with supporting periods.',
      'For any house with Meena: expect two paths, completion themes, escape urges, intuition, and privacy needs.',
      'Success formula: channel imagination productively, keep heart open with healthy boundaries, finish the pending.',
    ],
  },
}

export const RASHI_SHARED_TEACHINGS: RashiSharedTeaching[] = [
  RASHI_CLASSIFICATION_TEACHING,
  SOUL_JOURNEY_PHASES,
  CHART_KEYWORD_TEACHING,
  KARMA_TEACHING,
]

export function getRashiDeepGuide(rashi: number): RashiDeepGuide | null {
  if (rashi < 1 || rashi > 12) return null
  return GUIDES[rashi as Rashi]
}

export function getRashiKeyword(rashi: number): string | null {
  return getRashiDeepGuide(rashi)?.keyword ?? null
}

export function listRashiDeepGuides(): RashiDeepGuide[] {
  return (Object.keys(GUIDES) as unknown as Rashi[]).map((r) => GUIDES[r]).sort((a, b) => a.rashi - b.rashi)
}
