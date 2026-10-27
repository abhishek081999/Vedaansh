// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nadi/houses.ts
//  Nadi house catalog — bhava significances, body parts,
//  professions, and lord-link readings used by later predictions.
//  Teaching associations, not a medical or legal finding.
// ─────────────────────────────────────────────────────────────

import type { HouseNumber } from '@/lib/engine/houseInterpretations'

export const NADI_PILLARS = [
  { rank: 1, id: 'house', label: 'Houses', note: 'Highest priority. Prediction mixes this with the planet and the sign.' },
  { rank: 2, id: 'graha', label: 'Planets', note: 'Second. A period is empty if the planet’s significances are not known.' },
  { rank: 3, id: 'rashi', label: 'Signs', note: 'Third. A sign carries the nature of its own natural house.' },
] as const

/** Papa grahas named for the living-significance rule. Sun is malefic in the graha catalog, and is not in this list. */
export const NADI_PAPA_GRAHAS = ['Ma', 'Sa', 'Ra', 'Ke'] as const

export const NADI_MALEFIC_LIVING_RULE =
  'Mars, Saturn, Rahu, and Ketu pressure the living significances of a house they occupy: harm, cuts, accidents, and strain on the people and body parts that house stands for.'

export interface NadiHouseProfile {
  house: HouseNumber
  name: string
  significances: string[]
  bodyParts: string[]
  professions: string[]
  subjects: string[]
  relatives: string[]
  healthNotes: string[]
  rules: string[]
  /** Planet-specific notes when that graha occupies the house. */
  occupants: Partial<Record<'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke', string>>
}

export const NADI_HOUSES: Record<HouseNumber, NadiHouseProfile> = {
  1: {
    house: 1,
    name: 'Lagna',
    significances: ['Body', 'Health and stamina', 'Longevity', 'Fame and defame', 'Character', 'Head and skull'],
    bodyParts: ['Head', 'Skull'],
    professions: ['Sports and physical work when the 1st is strong'],
    subjects: [],
    relatives: ['Self'],
    healthNotes: ['Head injury', 'Migraine when Moon meets Rahu or Ketu', 'Serious illness risk when Jupiter meets Rahu here'],
    rules: [
      'Malefics here strain health, longevity, and reputation.',
      'Benefics here support health, fame, and the body.',
    ],
    occupants: {
      Ra: 'Public recognition, including camera and social visibility.',
      Ke: 'Cuts and a sudden end to a body theme when other malefics join.',
    },
  },
  2: {
    house: 2,
    name: 'Dhana',
    significances: ['Wealth and income', 'Inheritance', 'Savings and jewelry', 'Face and expression', 'Speech and voice', 'Eyes, as a secondary theme'],
    bodyParts: ['Face', 'Teeth', 'Throat', 'Eyes'],
    professions: ['Banking', 'Accounts and audit', 'Tax and customs', 'Software and coding', 'Singing', 'Acting, modelling, and on-camera work', 'Economics'],
    subjects: ['Economics', 'Finance', 'Computer science', 'Mathematics'],
    relatives: ['Family'],
    healthNotes: ['Teeth', 'Face', 'Throat'],
    rules: [
      'A strong 2nd supports the face and any work that uses the face or the voice.',
      'An afflicted 2nd strains money, teeth, face, or throat.',
      'IT and software are read from the 2nd. Communication work is also read from the 3rd.',
    ],
    occupants: {},
  },
  3: {
    house: 3,
    name: 'Parakrama',
    significances: ['Courage', 'Short journeys', 'Younger siblings', 'Arms and hands', 'Writing and thought', 'A change of residence'],
    bodyParts: ['Arms', 'Hands', 'Shoulders', 'Lungs and breath'],
    professions: ['Writing and publishing', 'Journalism', 'Police and army', 'Art', 'Singing', 'Physical training'],
    subjects: [],
    relatives: ['Younger siblings'],
    healthNotes: ['Asthma and other breath trouble', 'Smoking when Rahu or Saturn sits here', 'Fracture of the arm, wrist, or hand when malefics afflict'],
    rules: ['Rahu or Saturn here is read with smoking and respiratory strain.'],
    occupants: {
      Ra: 'Smoking and breath trouble.',
      Sa: 'Smoking, restriction, and breath trouble.',
    },
  },
  4: {
    house: 4,
    name: 'Sukha',
    significances: ['Home, land, and property', 'Vehicles', 'Mother', 'Mental peace', 'The public', 'Pets', 'Farming, dairy, and agriculture'],
    bodyParts: ['Chest', 'Breasts', 'Lungs'],
    professions: ['Farming and dairy', 'Hotels and food places', 'Transport', 'Automobile work', 'Civil engineering and architecture', 'Interior work and Vastu', 'Building materials', 'Politics and public life'],
    subjects: [],
    relatives: ['Mother'],
    healthNotes: ['Chest and lungs', 'Breast region in a female chart'],
    rules: [
      'Do not collapse this house into one job title. Offer the cluster: property, farming, vehicles, construction, hotels.',
      'Malefics here are read with property disputes and land held by someone else.',
    ],
    occupants: {
      Su: 'Government quarters, a government father, or a spouse in government service.',
      Ma: 'Property dispute, or a cut/surgery theme for the mother.',
      Ra: 'Property dispute or an illegal hold on land.',
      Ke: 'Property dispute, or a cut related to the chest or the mother.',
    },
  },
  5: {
    house: 5,
    name: 'Putra',
    significances: ['Education', 'Romance', 'Children', 'Speculation, stocks, and lottery', 'Intelligence', 'Entertainment'],
    bodyParts: ['Heart', 'Brain'],
    professions: ['Teaching', 'Education departments and universities', 'Gynaecology', 'Advertising', 'Entertainment'],
    subjects: [],
    relatives: ['Children'],
    healthNotes: ['Heart', 'Blood conditions when Jupiter meets Rahu here'],
    rules: [
      'Saturn, Rahu, and Ketu are the three planets this method links with a break in education.',
      'The 5th lord with the 8th is a common signature of occult study, and also of strain around children.',
    ],
    occupants: {
      Ra: 'A romance that breaks, or education that stops or stays unfinished.',
      Ke: 'A break in study, then software or research if the rest of the chart supports it.',
      Ju: 'With Rahu, a serious blood or heart theme is checked before a soft reading.',
    },
  },
  6: {
    house: 6,
    name: 'Ripu',
    significances: ['Disease', 'Debt', 'Enemies', 'Litigation', 'Service and employment', 'Maternal uncle and aunt'],
    bodyParts: ['Digestion', 'Liver', 'Pancreas', 'Intestines'],
    professions: ['Medicine', 'Law, on the service side', 'Nursing and pharmacy', 'Police', 'Court and legal departments', 'Biology'],
    subjects: ['Biology'],
    relatives: ['Maternal uncle', 'Maternal aunt'],
    healthNotes: ['Liver', 'Digestion', 'Pancreas', 'Intestines'],
    rules: ['A strong 6th supports medicine, law, and service. An afflicted 6th is read with disease, debt, and enemies.'],
    occupants: {},
  },
  7: {
    house: 7,
    name: 'Kalatra',
    significances: ['Marriage and spouse', 'The start of a relationship', 'Own business', 'Private employment', 'Business partners'],
    bodyParts: ['Kidneys', 'Reproductive system'],
    professions: ['Own business', 'Private employment', 'Partnership work'],
    subjects: [],
    relatives: ['Spouse'],
    healthNotes: ['Kidneys', 'Blood sugar', 'Sexual health'],
    rules: [
      'Private work and own business are read from the 7th being alive.',
      'Planets here describe a source of income through their own significations.',
    ],
    occupants: {},
  },
  8: {
    house: 8,
    name: 'Ayu',
    significances: ['Longevity and the mode of death', 'Occult and hidden matters', 'Inheritance after a death', 'Business loss', 'Transformation', 'Fame after death', 'Old and historical things'],
    bodyParts: ['Reproductive organs', 'Anus and rectum'],
    professions: ['Occult research', 'Insurance and inheritance work'],
    subjects: ['Occult'],
    relatives: [],
    healthNotes: ['Piles and related complaints', 'Reproductive strain'],
    rules: [
      'For a business chart, an active 8th is read as loss. A fixed government salary is less exposed.',
      'A strong 8th lord supports a long life. The 8th lord in the 7th, or the reverse, is read as a business that collapses.',
      'The 8th marks food the body already rejects. Advice from this house is limited to what to leave out.',
    ],
    occupants: {},
  },
  9: {
    house: 9,
    name: 'Bhagya',
    significances: ['Luck received without effort', 'Dharma', 'Long journeys and pilgrimage', 'Higher education', 'Guru', 'Father, in this method', 'Second marriage, when a marriage was actually performed'],
    bodyParts: ['Spine', 'Hips'],
    professions: ['University teaching', 'Consulting and guidance', 'Astrology, with the 5th and 8th', 'Priesthood'],
    subjects: ['Higher study'],
    relatives: ['Father', 'Guru'],
    healthNotes: ['Back pain', 'Hip injury, often from strain such as a heavy lift'],
    rules: [
      'The 9th is luck: what arrives without being earned. The 10th is karma: what is earned by work.',
      'Rahu here is read as a break with the family religion or an unorthodox path.',
    ],
    occupants: {
      Ra: 'Moves against the inherited religion, or takes an unorthodox path.',
      Ke: 'Chronic back pain is checked.',
      Sa: 'Spine or hip injury.',
      Ma: 'Spine or hip injury.',
    },
  },
  10: {
    house: 10,
    name: 'Karma',
    significances: ['Father', 'Government and rank', 'Career earned by effort', 'Status and authority', 'Management', 'Politics', 'Court judgments', 'Mother-in-law'],
    bodyParts: ['Knees'],
    professions: ['Government service', 'Administration', 'Politics', 'Management'],
    subjects: [],
    relatives: ['Father', 'Mother-in-law'],
    healthNotes: ['Knees'],
    rules: [
      'A strong 10th lord supports rank. A weak 10th lord keeps authority small.',
      'Government notices and court results are timed from this house.',
    ],
    occupants: {
      Ke: 'Knee surgery is checked.',
      Ma: 'Knee injury.',
    },
  },
  11: {
    house: 11,
    name: 'Labha',
    significances: ['Gains of every kind', 'Elder siblings', 'Friends', 'Desires fulfilled', 'Income from all sources'],
    bodyParts: ['Lower leg', 'Ankle', 'Left ear'],
    professions: ['Commerce', 'Accounts', 'Banking'],
    subjects: ['Commerce'],
    relatives: ['Elder siblings', 'Friends'],
    healthNotes: ['Lower leg', 'Left ear'],
    rules: [
      'Buying land, a vehicle, or gold wants both the 4th and the 11th alive.',
      'The 5th lord here, or the 11th lord in the 5th, supports commerce, accounts, and banking.',
    ],
    occupants: {
      Ra: 'Friends who cheat or do not hold.',
      Ke: 'Injury to the lower leg.',
    },
  },
  12: {
    house: 12,
    name: 'Vyaya',
    significances: ['Loss and spending', 'Foreign lands and long travel', 'Investment, because the money is locked away', 'Theft and fraud', 'Hospital bills', 'Bed pleasures', 'Isolation and confinement', 'Addiction', 'Moksha'],
    bodyParts: ['Feet'],
    professions: ['Foreign postings', 'Hospitals, on the expense side', 'Ashrams'],
    subjects: [],
    relatives: ['Paternal uncle and aunt'],
    healthNotes: ['Feet', 'Addiction when Rahu or other malefics sit here'],
    rules: [
      'While this house runs, lock spare cash, take a deliberate foreign trip, or invest on purpose so the loss has a direction.',
      'The 5th lord here is read as study abroad, a foreign partner, children born abroad, or fees that were wasted.',
    ],
    occupants: {
      Ra: 'Severe addiction is checked before a soft foreign-travel reading.',
    },
  },
}

export type NadiLinkKind = 'either' | 'one-way' | 'malefics-in'

export interface NadiLordLink {
  id: string
  kind: NadiLinkKind
  a: HouseNumber
  b: HouseNumber
  reading: string
}

/** Lord-to-house readings. `either` fires if A’s lord is in B or B’s lord is in A. */
export const NADI_LORD_LINKS: NadiLordLink[] = [
  { id: '2-4-rent', kind: 'either', a: 2, b: 4, reading: 'Rent from property.' },
  { id: '4-6-dispute', kind: 'either', a: 4, b: 6, reading: 'Property dispute or a court matter over land or the house.' },
  { id: '4-malefics', kind: 'malefics-in', a: 4, b: 4, reading: 'Malefics in the 4th: property dispute, or land occupied by someone else.' },
  { id: '4-12-foreign-home', kind: 'either', a: 4, b: 12, reading: 'Home or property tied to a foreign place.' },
  { id: '4-8-delay', kind: 'either', a: 4, b: 8, reading: 'Delayed or disputed inheritance, and the mother’s health is checked.' },
  { id: '5-8-occult', kind: 'either', a: 5, b: 8, reading: 'Occult study, including astrology, with strain around children or pregnancy.' },
  { id: '5-12-foreign', kind: 'either', a: 5, b: 12, reading: 'Study abroad, a foreign partner, or children born abroad.' },
  { id: '5-9-foreign-study', kind: 'either', a: 5, b: 9, reading: 'Higher study away from home, often abroad.' },
  { id: '5-3-short-study', kind: 'either', a: 5, b: 3, reading: 'A short spell of study away from home.' },
  { id: '8-11-astrology', kind: 'one-way', a: 8, b: 11, reading: 'The 8th lord in the 11th: income through occult work, including astrology.' },
  { id: '5-11-commerce', kind: 'either', a: 5, b: 11, reading: 'Commerce, accounts, or banking.' },
  { id: '6-10-service', kind: 'either', a: 6, b: 10, reading: 'Medicine or law as the career.' },
  { id: '6-1-illness', kind: 'either', a: 6, b: 1, reading: 'Frequent illness, enemies, and competition.' },
  { id: '8-1-accident', kind: 'either', a: 8, b: 1, reading: 'The lagna and the 8th are linked. Accidents, a long illness, and tantra are checked.' },
  { id: '8-7-business-loss', kind: 'either', a: 8, b: 7, reading: 'Business loss or a sudden collapse of the business.' },
  { id: '8-10-career-break', kind: 'either', a: 8, b: 10, reading: 'A late career, a break, or a change of line.' },
  { id: '9-12-foreign-luck', kind: 'one-way', a: 9, b: 12, reading: 'Fortune connected with foreign lands.' },
  { id: '3-12-travel', kind: 'either', a: 3, b: 12, reading: 'Foreign travel.' },
  { id: '11-4-gain-asset', kind: 'either', a: 11, b: 4, reading: 'Gains that can become property, a vehicle, or rental income. Confirm the other of the 4th and 11th is also alive.' },
]

export function nadiHouse(house: number): NadiHouseProfile | null {
  if (house < 1 || house > 12) return null
  return NADI_HOUSES[house as HouseNumber]
}
