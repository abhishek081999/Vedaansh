// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/data.ts
//  Vedic numerology (Anka Jyotish / Sankhya Shastra) reference data
//  Number → graha rulership, profiles, remedies, Chaldean letter
//  values, compound (10–52) meanings (Cheiro), grid interpretations
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'

export type CoreNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export const CORE_NUMBERS: readonly CoreNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

/** Classical Anka Jyotish rulership: 1 Surya … 9 Mangala. */
export const NUMBER_GRAHA: Record<CoreNumber, GrahaId> = {
  1: 'Su', 2: 'Mo', 3: 'Ju', 4: 'Ra', 5: 'Me', 6: 'Ve', 7: 'Ke', 8: 'Sa', 9: 'Ma',
}

export interface NumberProfile {
  number: CoreNumber
  graha: GrahaId
  planet: string
  sanskrit: string
  keyword: string
  element: string
  nature: string
  traits: string[]
  strengths: string[]
  challenges: string[]
  careers: string[]
  health: string
  luckyDays: string[]
  luckyColors: string[]
  avoidColors: string[]
  gemstone: string
  substituteGem: string
  metal: string
  direction: string
  deity: string
  beejMantra: string
  fastingDay: string
  remedies: string[]
}

export const NUMBER_PROFILES: Record<CoreNumber, NumberProfile> = {
  1: {
    number: 1, graha: 'Su', planet: 'Sun', sanskrit: 'Surya', keyword: 'Leadership',
    element: 'Agni (Fire)',
    nature: 'Independent, ambitious and authoritative. Natural initiators who prefer to lead rather than follow.',
    traits: ['Self-driven', 'Dignified', 'Original thinker', 'Strong willpower'],
    strengths: ['Leadership and command', 'Courage to start new ventures', 'Loyalty and honour', 'Clear decision making'],
    challenges: ['Ego and stubbornness', 'Dislike of criticism', 'Domineering in relationships', 'Impatience with slower people'],
    careers: ['Government and administration', 'Management / CEO roles', 'Politics', 'Medicine', 'Entrepreneurship'],
    health: 'Heart, eyes, spine and blood pressure. Avoid overexertion and heat.',
    luckyDays: ['Sunday', 'Monday'],
    luckyColors: ['Gold', 'Orange', 'Saffron', 'Yellow'],
    avoidColors: ['Black', 'Dark blue'],
    gemstone: 'Ruby (Manikya)', substituteGem: 'Red Garnet / Sunstone',
    metal: 'Gold, Copper', direction: 'East', deity: 'Surya Narayana',
    beejMantra: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
    fastingDay: 'Sunday',
    remedies: ['Offer water (Arghya) to the rising Sun', 'Recite Aditya Hridayam', 'Respect father and elders', 'Donate wheat or jaggery on Sundays'],
  },
  2: {
    number: 2, graha: 'Mo', planet: 'Moon', sanskrit: 'Chandra', keyword: 'Sensitivity',
    element: 'Jala (Water)',
    nature: 'Gentle, imaginative and intuitive. Diplomatic partners who seek harmony and emotional security.',
    traits: ['Caring', 'Artistic', 'Intuitive', 'Cooperative'],
    strengths: ['Diplomacy and mediation', 'Creative imagination', 'Empathy', 'Adaptability'],
    challenges: ['Mood swings', 'Over-sensitivity', 'Indecision', 'Lack of self-confidence'],
    careers: ['Arts, music and poetry', 'Nursing and healthcare', 'Hospitality', 'Counselling', 'Dairy, liquids and shipping'],
    health: 'Chest, lungs, digestion and fluid balance. Emotional stress affects health quickly.',
    luckyDays: ['Monday', 'Friday'],
    luckyColors: ['White', 'Cream', 'Silver', 'Light green'],
    avoidColors: ['Black', 'Dark red'],
    gemstone: 'Pearl (Moti)', substituteGem: 'Moonstone',
    metal: 'Silver', direction: 'North-West', deity: 'Shiva / Gauri',
    beejMantra: 'Om Shraam Shreem Shraum Sah Chandraya Namah',
    fastingDay: 'Monday',
    remedies: ['Offer milk or water on a Shivalinga on Mondays', 'Respect mother and women elders', 'Drink water from a silver vessel', 'Donate rice or white cloth on Mondays'],
  },
  3: {
    number: 3, graha: 'Ju', planet: 'Jupiter', sanskrit: 'Guru (Brihaspati)', keyword: 'Wisdom',
    element: 'Akasha (Ether)',
    nature: 'Disciplined, ambitious and principled. Natural teachers and advisers who value knowledge and dharma.',
    traits: ['Optimistic', 'Generous', 'Disciplined', 'Spiritual'],
    strengths: ['Teaching and guidance', 'Strong morals', 'Organisational ability', 'Expressive communication'],
    challenges: ['Preachy or rigid', 'Overconfidence', 'Dislike of subordination', 'Extravagance'],
    careers: ['Teaching and academia', 'Law and judiciary', 'Banking and finance', 'Priesthood / spiritual work', 'Consulting'],
    health: 'Liver, fat metabolism, diabetes tendency and thighs. Moderation in rich food is essential.',
    luckyDays: ['Thursday', 'Tuesday', 'Friday'],
    luckyColors: ['Yellow', 'Purple', 'Violet', 'Pink'],
    avoidColors: ['Black', 'Dark grey'],
    gemstone: 'Yellow Sapphire (Pukhraj)', substituteGem: 'Yellow Topaz / Citrine',
    metal: 'Gold', direction: 'North-East', deity: 'Vishnu / Dakshinamurti',
    beejMantra: 'Om Graam Greem Graum Sah Gurave Namah',
    fastingDay: 'Thursday',
    remedies: ['Respect teachers and Gurus', 'Apply saffron or turmeric tilak', 'Donate chana dal, turmeric or yellow cloth on Thursdays', 'Water a banana or peepal tree'],
  },
  4: {
    number: 4, graha: 'Ra', planet: 'Rahu', sanskrit: 'Rahu', keyword: 'Unconventional',
    element: 'Vayu (Air)',
    nature: 'Original, rebellious and strategic. Sees the world differently; success often comes through unconventional paths.',
    traits: ['Inventive', 'Hardworking', 'Practical', 'Independent'],
    strengths: ['Out-of-the-box thinking', 'Technical and research ability', 'Persistence', 'Mass appeal'],
    challenges: ['Sudden ups and downs', 'Few close friends', 'Argumentative', 'Confusion and restlessness'],
    careers: ['Technology and IT', 'Research and engineering', 'Politics and media', 'Foreign trade', 'Electricity and aviation'],
    health: 'Nervous system, unexplained ailments, anxiety and insomnia.',
    luckyDays: ['Saturday', 'Sunday', 'Monday'],
    luckyColors: ['Electric blue', 'Grey', 'Khaki'],
    avoidColors: ['Black', 'Red'],
    gemstone: 'Hessonite (Gomed)', substituteGem: 'Orange Zircon',
    metal: 'Lead / Ashtadhatu', direction: 'South-West', deity: 'Durga / Bhairava',
    beejMantra: 'Om Bhraam Bhreem Bhraum Sah Rahave Namah',
    fastingDay: 'Saturday',
    remedies: ['Recite Durga Saptashati or Durga Chalisa', 'Feed stray dogs', 'Donate black sesame or blankets', 'Avoid intoxicants and shortcuts'],
  },
  5: {
    number: 5, graha: 'Me', planet: 'Mercury', sanskrit: 'Budha', keyword: 'Intellect',
    element: 'Prithvi (Earth)',
    nature: 'Quick-witted, versatile and communicative. Thrives on variety, travel and mental stimulation.',
    traits: ['Witty', 'Business-minded', 'Adaptable', 'Youthful'],
    strengths: ['Communication and persuasion', 'Commerce and negotiation', 'Quick learning', 'Networking'],
    challenges: ['Restlessness', 'Nervous tension', 'Impulsive decisions', 'Inconsistency'],
    careers: ['Business and trade', 'Writing and journalism', 'Accounting and analytics', 'Marketing and sales', 'Travel and communication'],
    health: 'Nerves, skin, speech and respiratory system. Mental overwork leads to fatigue.',
    luckyDays: ['Wednesday', 'Friday'],
    luckyColors: ['Green', 'Light grey', 'White'],
    avoidColors: ['Dark red'],
    gemstone: 'Emerald (Panna)', substituteGem: 'Peridot / Green Tourmaline',
    metal: 'Bronze, Brass', direction: 'North', deity: 'Ganesha / Vishnu',
    beejMantra: 'Om Braam Breem Braum Sah Budhaya Namah',
    fastingDay: 'Wednesday',
    remedies: ['Worship Lord Ganesha with durva grass', 'Feed green fodder to cows', 'Donate green moong on Wednesdays', 'Keep promises and speak truthfully'],
  },
  6: {
    number: 6, graha: 'Ve', planet: 'Venus', sanskrit: 'Shukra', keyword: 'Harmony',
    element: 'Jala (Water)',
    nature: 'Charming, artistic and pleasure-loving. Seeks beauty, comfort and harmonious relationships.',
    traits: ['Attractive', 'Romantic', 'Responsible', 'Refined taste'],
    strengths: ['Artistic and aesthetic sense', 'Family devotion', 'Hospitality', 'Magnetic personality'],
    challenges: ['Indulgence and luxury', 'Jealousy', 'Stubbornness in love', 'Vanity'],
    careers: ['Fashion, design and beauty', 'Film, music and media', 'Hospitality and luxury', 'Interior design', 'Jewellery and cosmetics'],
    health: 'Throat, kidneys, reproductive system and sugar balance.',
    luckyDays: ['Friday', 'Tuesday', 'Thursday'],
    luckyColors: ['White', 'Light blue', 'Pink', 'Rose'],
    avoidColors: ['Black', 'Dark red'],
    gemstone: 'Diamond (Heera)', substituteGem: 'White Sapphire / Opal / Zircon',
    metal: 'Silver, Platinum', direction: 'South-East', deity: 'Lakshmi',
    beejMantra: 'Om Draam Dreem Draum Sah Shukraya Namah',
    fastingDay: 'Friday',
    remedies: ['Worship Goddess Lakshmi on Fridays', 'Respect women and spouse', 'Donate white sweets, curd or rice', 'Use fragrance and keep surroundings clean'],
  },
  7: {
    number: 7, graha: 'Ke', planet: 'Ketu', sanskrit: 'Ketu', keyword: 'Mysticism',
    element: 'Agni (Fire)',
    nature: 'Introspective, philosophical and intuitive. Seeks hidden truths; often detached from material pursuits.',
    traits: ['Spiritual', 'Analytical', 'Private', 'Intuitive'],
    strengths: ['Research and deep thinking', 'Psychic intuition', 'Healing ability', 'Independence'],
    challenges: ['Isolation', 'Pessimism', 'Unpredictable life events', 'Detachment in relationships'],
    careers: ['Spirituality and occult', 'Research and science', 'Medicine and healing', 'Philosophy and writing', 'Travel and foreign lands'],
    health: 'Skin, nervous disorders and hard-to-diagnose ailments.',
    luckyDays: ['Monday', 'Sunday'],
    luckyColors: ['Smoky grey', 'Light green', 'Multicolour'],
    avoidColors: ['Black', 'Dark red'],
    gemstone: "Cat's Eye (Lehsunia)", substituteGem: 'Tiger Eye',
    metal: 'Mixed metals', direction: 'North-West', deity: 'Ganesha',
    beejMantra: 'Om Straam Streem Straum Sah Ketave Namah',
    fastingDay: 'Tuesday',
    remedies: ['Worship Lord Ganesha', 'Feed dogs and help the needy', 'Donate a blanket or multi-coloured cloth', 'Practise meditation regularly'],
  },
  8: {
    number: 8, graha: 'Sa', planet: 'Saturn', sanskrit: 'Shani', keyword: 'Karma',
    element: 'Vayu (Air)',
    nature: 'Serious, patient and hardworking. Success comes slowly but endures; life teaches through discipline.',
    traits: ['Disciplined', 'Persistent', 'Just', 'Reserved'],
    strengths: ['Endurance and patience', 'Organisational power', 'Sense of justice', 'Long-term planning'],
    challenges: ['Delays and obstacles', 'Loneliness or melancholy', 'Being misunderstood', 'Rigidity'],
    careers: ['Law and judiciary', 'Real estate and construction', 'Mining, oil and iron', 'Labour management', 'Politics and public service'],
    health: 'Bones, joints, teeth, chronic ailments and nervous fatigue.',
    luckyDays: ['Saturday', 'Friday'],
    luckyColors: ['Dark blue', 'Black', 'Violet'],
    avoidColors: ['Red', 'Bright yellow'],
    gemstone: 'Blue Sapphire (Neelam) — wear only after trial', substituteGem: 'Amethyst / Blue Spinel',
    metal: 'Iron', direction: 'West', deity: 'Shani Dev / Hanuman',
    beejMantra: 'Om Praam Preem Praum Sah Shanaye Namah',
    fastingDay: 'Saturday',
    remedies: ['Recite Hanuman Chalisa on Saturdays', 'Light a mustard-oil lamp under a peepal tree', 'Serve labourers and the elderly', 'Donate black urad or mustard oil'],
  },
  9: {
    number: 9, graha: 'Ma', planet: 'Mars', sanskrit: 'Mangala', keyword: 'Courage',
    element: 'Agni (Fire)',
    nature: 'Energetic, brave and humanitarian. A fighter who achieves through effort and protects others.',
    traits: ['Courageous', 'Passionate', 'Generous', 'Determined'],
    strengths: ['Physical energy', 'Fearlessness', 'Protective instincts', 'Executive drive'],
    challenges: ['Anger and impulsiveness', 'Accident proneness', 'Arguments and conflicts', 'Impatience'],
    careers: ['Army, police and defence', 'Surgery and medicine', 'Engineering and real estate', 'Sports', 'Fire, metals and machinery'],
    health: 'Blood, muscles, injuries, fevers and inflammation.',
    luckyDays: ['Tuesday', 'Thursday', 'Friday'],
    luckyColors: ['Red', 'Crimson', 'Pink'],
    avoidColors: ['Black', 'Dark blue'],
    gemstone: 'Red Coral (Moonga)', substituteGem: 'Carnelian',
    metal: 'Copper', direction: 'South', deity: 'Hanuman / Kartikeya',
    beejMantra: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
    fastingDay: 'Tuesday',
    remedies: ['Recite Hanuman Chalisa on Tuesdays', 'Donate red lentils (masoor) or jaggery', 'Channel energy through exercise', 'Avoid anger and harsh speech'],
  },
}

// ── Letter values ─────────────────────────────────────────────
// Chaldean (used in Indian / Vedic name numerology): no letter = 9.

export const CHALDEAN_VALUES: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
}

export const PYTHAGOREAN_VALUES: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
}

export const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])

// ── Compound numbers (Chaldean, after Cheiro) ─────────────────

export type CompoundQuality = 'fortunate' | 'mixed' | 'warning'

export interface CompoundMeaning {
  title: string
  meaning: string
  quality: CompoundQuality
}

const C = (title: string, meaning: string, quality: CompoundQuality): CompoundMeaning => ({ title, meaning, quality })

const COMPOUND_BASE: Record<number, CompoundMeaning> = {
  10: C('Wheel of Fortune', 'Honour, faith and self-confidence; rise and fall by one\'s own will. Name becomes known.', 'fortunate'),
  11: C('Lion Muzzled', 'Hidden dangers, trials and treachery from others. Warning to be cautious.', 'warning'),
  12: C('The Sacrifice', 'Anxiety and being sacrificed for others\' plans. Warning against suffering for others.', 'warning'),
  13: C('Regeneration', 'Change of plans, upheaval and power. Destructive if misused; transformation if handled wisely.', 'mixed'),
  14: C('Movement', 'Changes, travel and dealings with the public. Fortunate for money but risk from natural forces and others\' advice.', 'mixed'),
  15: C('The Magician', 'Eloquence, music, art and magnetism. Fortunate for obtaining money, gifts and favours.', 'fortunate'),
  16: C('Shattered Citadel', 'Strange fatalities, accidents and defeat of plans. Plan everything well in advance.', 'warning'),
  17: C('Star of the Magi', 'Spiritual peace, love and immortality of name. Rises above trials of early life.', 'fortunate'),
  18: C('Spiritual vs Material', 'Bitter quarrels, deception and danger from enemies. Warning number.', 'warning'),
  19: C('Prince of Heaven', 'Happiness, success, esteem and honour. One of the most fortunate numbers.', 'fortunate'),
  20: C('The Awakening', 'New purpose, new plans and a call to action. Spiritually strong, materially slow.', 'mixed'),
  21: C('Crown of the Magi', 'Advancement, honours and general success after a long struggle. Very fortunate.', 'fortunate'),
  22: C('Fool\'s Paradise', 'Illusion, false judgement and living in a dream. Warning against wrong advice.', 'warning'),
  23: C('Royal Star of the Lion', 'Success, help from superiors and protection. Very fortunate.', 'fortunate'),
  24: C('Love and Assistance', 'Help from those of rank, love, money and creativity. Fortunate.', 'fortunate'),
  25: C('Strength through Experience', 'Benefit gained through observation; trials early, success later. Fortunate.', 'fortunate'),
  26: C('Partnership Warnings', 'Disaster through bad advice, association and speculation. Choose partners carefully.', 'warning'),
  27: C('The Sceptre', 'Authority, command and reward from intellect and creative work. Fortunate.', 'fortunate'),
  28: C('Contradictions', 'Great promise but loss through trust in others and competition. Warning.', 'warning'),
  29: C('Grace under Pressure', 'Uncertainty, treachery and deception from others; trials through relationships. Warning.', 'warning'),
  30: C('Thoughtful Deduction', 'Mental superiority and retrospection; can be fortunate or not depending on the person\'s will.', 'mixed'),
  31: C('The Recluse', 'Self-contained, lonely and isolated. Not fortunate materially.', 'mixed'),
  32: C('Communication', 'Magical power like 5, 14 and 23; fortunate if the person holds to their own judgement.', 'fortunate'),
  37: C('Good Friendships', 'Fortunate partnerships, love and friendships of both sexes. Fortunate.', 'fortunate'),
  43: C('Revolution', 'Upheaval, strife and failure. Unfortunate.', 'warning'),
  51: C('The Warrior', 'Sudden advancement and power, but also enemies and danger. Powerful.', 'mixed'),
}

/** Cheiro maps 33–52 back onto earlier compound meanings. */
const COMPOUND_ALIASES: Record<number, number> = {
  33: 24, 34: 25, 35: 26, 36: 27, 38: 29, 39: 30, 40: 31, 41: 32,
  42: 24, 44: 26, 45: 27, 46: 37, 47: 29, 48: 30, 49: 31, 50: 32, 52: 43,
}

export function getCompoundMeaning(n: number): CompoundMeaning | null {
  if (COMPOUND_BASE[n]) return COMPOUND_BASE[n]!
  const alias = COMPOUND_ALIASES[n]
  return alias ? COMPOUND_BASE[alias] ?? null : null
}

/** Karmic debt compounds (13, 14, 16, 19) — lessons carried from past actions. */
export const KARMIC_DEBT: Record<number, string> = {
  13: 'Karmic lesson of laziness: success requires steady, disciplined work.',
  14: 'Karmic lesson of excess: learn moderation and avoid misuse of freedom.',
  16: 'Karmic lesson of ego: pride is broken to awaken humility and spirituality.',
  19: 'Karmic lesson of power: learn to use independence without dominating others.',
}

// ── Grid interpretations ──────────────────────────────────────

export const MISSING_NUMBER_EFFECTS: Record<CoreNumber, { effect: string; remedy: string }> = {
  1: { effect: 'Difficulty expressing self, low confidence and weak leadership.', remedy: 'Offer Arghya to the Sun daily; wear or keep a copper item.' },
  2: { effect: 'Low intuition, sensitivity issues and lack of patience in relationships.', remedy: 'Keep a silver item; drink water from a silver glass; worship Shiva on Mondays.' },
  3: { effect: 'Lack of imagination, creativity and guidance; difficulty with studies.', remedy: 'Apply turmeric or saffron tilak; respect teachers; keep a bamboo plant in the East.' },
  4: { effect: 'Lack of order, discipline and practical planning.', remedy: 'Keep surroundings organised; feed birds; keep a plant in the South-East.' },
  5: { effect: 'Instability, lack of balance and difficulty in communication.', remedy: 'Wear a green item; feed green fodder to cows; keep a crystal at the centre of the home.' },
  6: { effect: 'Disharmony in home and family, lack of comforts.', remedy: 'Worship Lakshmi on Fridays; keep fresh flowers and fragrance at home.' },
  7: { effect: 'Lack of spiritual inclination and repeated disappointments.', remedy: 'Meditate daily; feed dogs; keep a silver or white metal item in the West.' },
  8: { effect: 'Weak financial management and lack of patience for long-term goals.', remedy: 'Serve elders and labourers on Saturdays; keep a brass or crystal item in the North-East.' },
  9: { effect: 'Lack of energy, ambition and humanitarian outlook.', remedy: 'Recite Hanuman Chalisa on Tuesdays; keep a red item in the South.' },
}

export const REPEAT_NUMBER_EFFECTS: Record<CoreNumber, [string, string, string]> = {
  1: ['Balanced self-expression.', 'Strong communication; can talk well and stand firm.', 'Excess ego or difficulty expressing feelings; may be talkative or withdrawn.'],
  2: ['Sensitive and intuitive.', 'Highly intuitive, judges people well.', 'Over-sensitive and easily hurt; emotional extremes.'],
  3: ['Creative and imaginative.', 'Strong imagination; may live in a dream world.', 'Highly critical or argumentative; scattered thinking.'],
  4: ['Practical and orderly.', 'Hardworking but rigid; may overwork.', 'Too materialistic or stuck in routine.'],
  5: ['Emotionally balanced.', 'Highly driven and determined; may be overconfident.', 'Hasty, accident-prone or reckless.'],
  6: ['Caring and home-loving.', 'Worrying nature, overprotective of family.', 'Excessive anxiety; may neglect self for others.'],
  7: ['Learns through experience.', 'Repeated setbacks lead to deep wisdom.', 'Losses in love, health or money; strong spiritual calling.'],
  8: ['Methodical and attentive to detail.', 'Strong financial focus; restless if idle.', 'Highly stubborn and fixed in opinions.'],
  9: ['Humanitarian and ambitious.', 'Intelligent but critical of others.', 'Detached or living in their own world; idealistic.'],
}

export const LOSHU_LAYOUT: CoreNumber[][] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
]

/** Vedic grid (Indian square): Jupiter–Sun–Mars on top. */
export const VEDIC_LAYOUT: CoreNumber[][] = [
  [3, 1, 9],
  [6, 7, 5],
  [2, 8, 4],
]

export interface GridPlaneDef {
  id: string
  name: string
  numbers: [CoreNumber, CoreNumber, CoreNumber]
  complete: string
  empty: string
}

export const LOSHU_PLANES: GridPlaneDef[] = [
  { id: 'mental', name: 'Mental Plane', numbers: [4, 9, 2], complete: 'Sharp intellect, good memory and analytical power.', empty: 'Needs effort to plan and think things through.' },
  { id: 'emotional', name: 'Emotional Plane', numbers: [3, 5, 7], complete: 'Spiritually and emotionally strong; compassionate.', empty: 'Difficulty expressing feelings; may seem detached.' },
  { id: 'practical', name: 'Practical Plane', numbers: [8, 1, 6], complete: 'Materially skilled, hands-on and successful in worldly matters.', empty: 'Struggles with practical execution and money matters.' },
  { id: 'thought', name: 'Thought Plane', numbers: [4, 3, 8], complete: 'Good planner and strategist.', empty: 'Acts without enough planning.' },
  { id: 'will', name: 'Will Plane', numbers: [9, 5, 1], complete: 'Strong determination; finishes what is started.', empty: 'Lack of persistence; easily discouraged.' },
  { id: 'action', name: 'Action Plane', numbers: [2, 7, 6], complete: 'Turns ideas into action quickly.', empty: 'Procrastination; ideas stay ideas.' },
  { id: 'golden', name: 'Golden Yoga (Success)', numbers: [4, 5, 6], complete: 'Raj Yoga of success, wealth and recognition.', empty: 'Success needs consistent effort and patience.' },
  { id: 'silver', name: 'Silver Yoga (Property)', numbers: [2, 5, 8], complete: 'Gains through land, property and stable assets.', empty: 'Property matters need careful timing.' },
]

// ── Kua (Lo Shu / directional) ────────────────────────────────

export const KUA_DIRECTIONS: Record<number, { group: 'East' | 'West'; success: string; health: string; love: string; growth: string }> = {
  1: { group: 'East', success: 'South-East', health: 'East', love: 'South', growth: 'North' },
  2: { group: 'West', success: 'North-East', health: 'West', love: 'North-West', growth: 'South-West' },
  3: { group: 'East', success: 'South', health: 'North', love: 'South-East', growth: 'East' },
  4: { group: 'East', success: 'North', health: 'South', love: 'East', growth: 'South-East' },
  6: { group: 'West', success: 'West', health: 'North-East', love: 'South-West', growth: 'North-West' },
  7: { group: 'West', success: 'North-West', health: 'South-West', love: 'North-East', growth: 'West' },
  8: { group: 'West', success: 'South-West', health: 'North-West', love: 'West', growth: 'North-East' },
  9: { group: 'East', success: 'East', health: 'South-East', love: 'North', growth: 'South' },
}

export const PERSONAL_YEAR_THEMES: Record<CoreNumber, { theme: string; guidance: string }> = {
  1: { theme: 'New beginnings', guidance: 'Start projects, take initiative and set long-term goals.' },
  2: { theme: 'Partnership and patience', guidance: 'Cooperate, nurture relationships and let plans mature.' },
  3: { theme: 'Expansion and expression', guidance: 'Learn, teach, create and widen your social circle.' },
  4: { theme: 'Foundation and work', guidance: 'Build structure, work hard and avoid shortcuts.' },
  5: { theme: 'Change and freedom', guidance: 'Travel, adapt and embrace change, but avoid recklessness.' },
  6: { theme: 'Family and responsibility', guidance: 'Focus on home, marriage, beauty and service.' },
  7: { theme: 'Introspection', guidance: 'Study, meditate and reflect; avoid major speculation.' },
  8: { theme: 'Karma and achievement', guidance: 'Harvest past effort; manage money and authority wisely.' },
  9: { theme: 'Completion', guidance: 'Finish cycles, let go of the old and serve others.' },
}
