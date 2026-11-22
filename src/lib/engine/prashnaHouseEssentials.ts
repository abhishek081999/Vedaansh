// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaHouseEssentials.ts
//  House essentials for praśna, alongside prashnaHouseSignifications.ts:
//  fixed significators (kārakas), the classical per-house table (dhatu, mula,
//  jeeva, body, place, relationships, states, virtues, abstract, misc), the
//  "Nth from Mth" relationships, and mundane significations then and now.
//  Reference data only: nothing here feeds a verdict.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import type { EngineLang } from './lang'
import { HOUSE_CLASSICAL_HI, HOUSE_MUNDANE_HI, HOUSE_MUNDANE_TEXT_HI, HOUSE_RELATIONS_HI } from './locale/prashnaHouseEssentials.hi'

export const HOUSE_KARAKAS: Record<number, GrahaId[]> = {
  1: ['Su'], 2: ['Ju'], 3: ['Ma'], 4: ['Mo', 'Me'], 5: ['Ju'], 6: ['Ma', 'Sa'],
  7: ['Ve'], 8: ['Sa'], 9: ['Su', 'Ju'], 10: ['Ju', 'Su', 'Me', 'Sa'], 11: ['Ju'], 12: ['Sa'],
}

export const HOUSE_FIELDS = ['dhatu', 'mula', 'jeeva', 'body', 'place', 'relation', 'mental', 'physical', 'virtues', 'abstract', 'misc'] as const
export type HouseField = typeof HOUSE_FIELDS[number]
/** One row per house; an empty string means the source gives nothing. */
export type HouseClassical = Record<HouseField, string>

const row = (...v: string[]): HouseClassical => Object.fromEntries(HOUSE_FIELDS.map((f, i) => [f, v[i] ?? ''])) as HouseClassical

export const HOUSE_CLASSICAL: HouseClassical[] = [
  row(
    'Wealth', '', 'Cattle, animal husbandry, living beings',
    'Body, limbs, hair, skin, head, vitality, proportion of the body, complexion',
    'Birthplace', 'Self',
    'Happiness, unhappiness, dreams, sleep, renunciation, decency, peace',
    'Longevity, old age, sound health, efforts related to the object of the query',
    'Knowledge, fame, strength, dignity, self-respect, stigma, honour, wisdom, ability to work, proficiency, personal charm',
    'Livelihood, gambling, insult, antecedents, defamation',
    'Moral character, good behaviour',
  ),
  row(
    'Wealth, diamonds, copper, precious stones, pearls, metals, artificial products, the nine gems',
    'Corn, eatables, the nine kinds of grain', 'Horses',
    'Speech, nails, tongue, right eye, nose, face, mouth, cheeks, chin, teeth',
    '', 'Family, close followers, family friends, miserliness, faith',
    'Control or determination, grace', 'Prosperous and affluent living',
    'Faith in sacred texts, good speech, learning, eloquence, truth, lies, deceit, hypocrisy, enjoyment of pleasures',
    'Acquiring money more to hoard than to enjoy, maintaining accounts',
    'Talkativeness, memory, splendour, modesty, trading in household goods, friendship, lore',
  ),
  row(
    'Ornaments, ear ornaments',
    'Crops, roots, bulbs, fruits, grains, corn, good or defective food', 'Soldiers, servants',
    'Right ear, feet, throat, the part of the hand between thumb and index finger, legs, collarbone, shoulder blade, growth of the body, nervous system',
    'Land or road, heaven, library, environment, surroundings',
    'Brother, near relatives, friends, slaves, neighbours, servants, maidservants, casual acquaintances',
    'Mental instability, religious duties',
    'Fitness, eating clean food and the like, valour, physical growth, personal strength',
    'Courage, valour, good qualities, education, hobbies',
    'Abode of the gods, partition of inheritance',
    'War, causing sorrow, wandering, small vehicles, short journeys, pilgrimages, correspondence, great undertakings, partition, publishing, the army, wicked intentions',
  ),
  row(
    'Sculpture, wealth, treasure hidden underground',
    'Clothes, agriculture, abundant crops, eatables, garden, harvest',
    'Buffaloes, cows, bulls, horses, elephants',
    'Heart, thoracic region, breast, chest, shoulder',
    'Land, small well, garden, mandap', 'Maternal uncle, mother, friends, relatives',
    'Victorious, elated', '',
    'Education, good name, faith or trust, pure or steady intellect, happiness, appealing manners',
    'False allegations, things that cause suffering',
    'National or government work, travel, vehicles, caste, oil bath, spices, drink, milk, medicine, perfumes, paternal property, digging of wells, ancestral property, water, direction of stolen articles',
  ),
  row(
    'Sculpture', 'Clothes', 'King, ministers',
    'Stomach, belly, heart, hand', 'Paternal property',
    'Children, love affairs, courtship, first child, second co-born, disciples',
    'Mind, discretion, foresight, seriousness, secrets, humility, emotions, piety',
    'Pregnancy, fertility, sterility',
    'Father\'s virtuous deeds, good character, education, vivek (telling good from bad), welfare, wisdom, genius, cheerfulness',
    'Mantras, composing poetry, scholarship in literature, literary work, any plan or scheme, resourcefulness',
    'Umbrella, auspicious documents, affairs with loose women, means of earning, lottery, gambling, public speaking, education, discharge of debt, minister, foresight, purva punya (merit of past lives)',
  ),
  row(
    '', 'Boiled rice, herbs, grains',
    'Animals, pets, domestic creatures, quadrupeds, donkeys, camels',
    'Urinary tract, belly, waist, navel region, diseases', 'Prison',
    'Maternal uncle, cousins, servants',
    'Madness, miserliness, mental agony or worry, hated by many, insanity, weariness, mental torture',
    'Diseases, cruelty, obstacles, smallpox, venereal boils, eye diseases, heavy breathing',
    'Miserly, forgetful, dejected mind, cruel deeds',
    'Debts, slenderness, delight of foes, profits, reproach, imprisonment, misunderstanding with brothers, calamity, vices, humiliation, superstitions',
    'Fighting in war, receiving alms, being chained or handcuffed, poison, quarrels, arms, thieves, enemies, swelling, enmity, service, the working class, industries, public health, sanitation',
  ),
  row(
    '', 'Betel leaves, flowers, pulses, favourite food', 'People, the public',
    'Semen, reproductive organs, anus, kidneys, bones, sex urge',
    'Mansion, own place, foreign or distant place',
    'Adopted son, wife or husband, partner, third co-born',
    'Straying from the right path, loss of memory, desire, arguments',
    'Marriage, loose sex life, sexual union, theft',
    'Husband\'s purity, charity, valour, victory, destruction of enemies, diplomacy, passion',
    'Victory in love or passion, breaks, travel, commerce or trade, money from a distant place, agreements, contracts, honour abroad',
    'Perfumes, music and flowers, delicious food, curd, clothes, milk, food with cereals, overthrow of enemies, controversy, straying from the right path, banker, lender, borrower, black money, wealth kept elsewhere, business partnership',
  ),
  row(
    'Buried treasure', 'New crops, enjoyment of food', 'Poisonous insects',
    'Loss of a limb, rectum, health', 'The enemy\'s fortress',
    'Slaves, dead relatives, enmity of a brother',
    'Happiness, worry about death, mental anguish, sorrow, worry from illness, fear of water',
    'Age, longevity, idleness, disputes among brothers, cancer, capital punishment, beheading',
    'Sin, terrifying sorrows, cruel acts, living on interest, a fall from a height, underground work, caves',
    'Defeat, absence of quarrels, debts, battle, scandals, impurities, anger, misfortune',
    'Insurance money, loss of money, punishment from the government, long-awaited or unearned money, accidents, death in water, mode of death, butchers, surgeons',
  ),
  row(
    '', 'Medicinal drugs', 'Horses, elephants, buffaloes',
    'Thighs', 'Temples, coronation halls, assembly halls, distant places',
    'Father, grandson, guru, acharya, boss',
    'Purity of mind, efforts to learn, splendour', 'Valour',
    'Charity, virtuous acts, devotion to and respect for elders and gods, virtues, nobility, generosity, compassion, Vedic sacrifice, religious bathing',
    'Penance, polity, listening to good stories, fortune, auspiciousness, luck, legal matters, inventions, science, law, religion',
    'Pilgrimage, travel or conveyances, fortune, prosperity, paternal property, distribution of money, foreign journeys, emigration or immigration',
  ),
  row(
    '', 'Medicines, agriculture', 'Horses',
    'Knees, joints, backbone', 'Sky, place of residence', 'Mother, adopted son',
    'Inclination to give orders and be obeyed', 'Prosperity, good living, luxuries',
    'Fame, the right path, self-control, good conduct, teaching ability, sacrifices, influence, capabilities',
    'Honour from the ruler, quality, lordship, fame, wisdom, ambitions, success, power, morality',
    'Service, teaching, reciting mantras, gods, occupation, ruler, commerce, news, distant places, aptitude for work, happiness, drought, rain, government',
  ),
  row(
    'Pearls, gold, ornaments, riches of every kind, jewels', 'Grains, corn', 'Cattle wealth',
    'Shanks, left ear, left hand, feet, right foot', '',
    'Elder brother, paternal uncle, spouse\'s brother, friends, close acquaintances, death of progeny',
    'Evil desires, dependence on the mother',
    'Skill in earning, longevity, recovery from ill health',
    'Worship of gods and sattvik deities, wisdom, reforming virtues, wicked desire, blaming others, fulfilment of desires',
    'Dependence on others, the post of a minister, skill in painting, acquisitions, realising objectives, commendations, museums',
    'Gains, all forms of income, profits, dawn of fortune, good returns, cooking, desires, paternal property, important papers and documents, many wives, principal plus interest of money lent',
  ),
  row(
    '', '', 'Elephants, horses, cattle, beasts',
    'Feet, left eye, crippled or lost limbs', 'Bed, jail, hospital, foreign land, inauspicious house',
    'Enemy',
    'Disturbed sleep, fear of foes, hated by the public, breakdown of marriage, anger, mental imbalance',
    'Imprisonment, loose sex life, physical ailments, loss of wife or husband',
    'Obstinacy, cleverness, ascetic life, seclusion, fear, cunning, adultery, blackmail, secret plans or scheming, envy, malice, intrigue, treachery',
    'Freedom from suffering, ascent to heaven, loss of authority, disputes, discharge of debt, impediments, sorrow, exile, fear, inferiority complex, receiving charity, poverty',
    'Relief from debts, paternal property, migrating to a distant place, expenditure of all kinds, the end, poverty, being chained or handcuffed, losses (physical, financial and emotional), convent or monastic life',
  ),
]

/** [n, from, meaning]: this house is the nth from house `from`. */
export type HouseRelation = [n: number, from: number, meaning: string]

export const HOUSE_RELATIONS: HouseRelation[][] = [
  [
    [2, 12, 'Hospital, court expenses'],
    [3, 11, 'Journeys or co-borns of friends'],
    [4, 10, 'Achievements in career or profession'],
    [5, 9, 'Father\'s speculative fortunes'],
    [6, 8, 'Illness of the spouse\'s family or relatives'],
    [7, 7, 'Health, appearance and associates of the spouse'],
    [8, 6, 'Obstacles to enemies and debtors'],
    [9, 5, 'Long journeys and fortune of children'],
    [10, 4, 'Reputation of mother, family and home'],
    [11, 3, 'Gains to brothers'],
    [12, 2, 'Loss of family and food'],
  ],
  [
    [2, 1, 'Everything about money'],
    [3, 12, 'Short journeys of secret enemies'],
    [4, 11, 'Home of friends'],
    [5, 10, 'Speculation and investments in business'],
    [6, 9, 'Ailments and enemies of the father'],
    [7, 8, 'Unearned gains to the spouse'],
    [8, 7, 'Death of the spouse'],
    [9, 6, 'Journeys and fortunes of maternal relatives'],
    [10, 5, 'Career and profession of children'],
    [11, 4, 'Gains and social activities of the mother'],
    [12, 3, 'Losses and hospitalisation of brothers or neighbours'],
  ],
  [
    [5, 11, 'Children of friends'],
    [6, 10, 'Litigation in your own career'],
    [7, 9, 'Father\'s trade associates'],
    [9, 7, 'The partner\'s or spouse\'s father, and their long journeys'],
    [10, 6, 'Career and occupation of enemies'],
    [11, 5, 'Gains of children'],
    [12, 4, 'Losses, dreams and hospitalisation of the mother'],
  ],
  [
    [2, 3, 'Profit of brothers'],
    [5, 12, 'Children of secret enemies, sudden gains'],
    [6, 11, 'Enemies and debts of friends'],
    [7, 10, 'Spouse of career associates or partners'],
    [8, 9, 'Father\'s inheritance'],
    [9, 8, 'Sudden luck, lottery, prizes, income'],
    [10, 7, 'Career of the spouse or partner'],
    [11, 6, 'Gains of enemies'],
    [12, 5, 'Loss in speculation, illness of children'],
  ],
  [
    [2, 4, 'Income from mother, property and vehicles'],
    [3, 3, 'Brother\'s friends'],
    [4, 2, 'Family estates, cars'],
    [6, 12, 'Problems and sickness of secret enemies'],
    [7, 11, 'Liaisons with associates'],
    [8, 10, 'Losses in career'],
    [9, 9, 'Grandfather, father\'s luck'],
    [10, 8, 'Social background of the spouse\'s family'],
    [11, 7, 'Gains from the wife, partnerships'],
    [12, 6, 'Secret enemies and clandestine deals'],
  ],
  [
    [2, 5, 'Children\'s families'],
    [3, 4, 'Maternal uncles and aunts'],
    [4, 3, 'Family estates, cars'],
    [5, 2, 'Luck through singing, speech, family trade'],
    [7, 12, 'Affairs and sweethearts of enemies'],
    [8, 11, 'Death of friends'],
    [9, 10, 'Deputations, official journeys, transfers'],
    [10, 9, 'Father\'s career'],
    [11, 8, 'Legacies of friends'],
    [12, 7, 'Secret enemies and affairs of the spouse'],
  ],
  [
    [2, 6, 'Wealth of enemies, profit through jails, hospitals and clinics'],
    [3, 5, 'Brothers of a sweetheart'],
    [4, 4, 'Mother\'s property, change of residence'],
    [5, 3, 'Nephews and nieces'],
    [6, 2, 'Family disputes'],
    [8, 12, 'Penalty, punishment, death of enemies'],
    [9, 11, 'Friends\' antecedents and business gains'],
    [10, 10, 'Merit in career, victories in battle'],
    [11, 9, 'Father\'s personal effects and his gains'],
    [12, 8, 'Tracing and detaining thieves'],
  ],
  [
    [2, 7, 'Dowry, income from partners'],
    [3, 6, 'Supporters of enemies'],
    [4, 5, 'Children\'s education and schooling'],
    [5, 4, 'Happiness through writing, literary talent'],
    [6, 3, 'Brother\'s enemies and debts'],
    [7, 2, 'Substance of the wife or husband'],
    [9, 12, 'Antecedents of conspirators'],
    [10, 11, 'Profession of friends or the elder brother'],
    [11, 10, 'Gains from profession'],
    [12, 9, 'Father\'s hospitalisation, political imprisonment'],
  ],
  [
    [2, 8, 'Gains through inheritance'],
    [3, 7, 'Letters about partnerships and spouses, short journeys'],
    [4, 6, 'Properties of enemies'],
    [5, 5, 'Speculative gains of grandchildren or children'],
    [6, 4, 'Mother\'s health, debts and legal battles'],
    [7, 3, 'Brother\'s wife or sister\'s husband'],
    [8, 2, 'Monetary losses or obstacles'],
    [10, 12, 'Acts of enemies, conspiracies'],
    [11, 11, 'Gains of friends or the elder brother'],
    [12, 10, 'Tricks and conspiracies of enemies'],
  ],
  [
    [2, 9, 'Father\'s income and family'],
    [3, 8, 'End of obstacles through effort or karma'],
    [4, 7, 'Spouse\'s mother, house'],
    [5, 6, 'Children of servants or tenants'],
    [6, 5, 'Enemies or adversaries of children'],
    [7, 4, 'Mother\'s public activities and trusts'],
    [8, 3, 'Death or legacies of brothers and sisters'],
    [9, 2, 'General fortune of the family'],
    [11, 12, 'Friends and sympathisers of ill-wishers'],
    [12, 11, 'Elder brother\'s expenditure and losses'],
  ],
  [
    [2, 10, 'Income from your own efforts'],
    [3, 9, 'Paternal uncles, father\'s short journeys'],
    [4, 8, 'Legal education, secret knowledge'],
    [5, 7, 'Spouse\'s affairs'],
    [6, 6, 'Enemies of enemies, their debts and illness'],
    [7, 5, 'Marriage of a son, or spouse of a son or daughter'],
    [8, 4, 'Mother\'s inheritance'],
    [9, 3, 'Long or foreign journeys of a brother'],
    [10, 2, 'Family occupation, business and reputation'],
    [12, 12, 'End of losses, recovery of health'],
  ],
  [
    [2, 11, 'Invitations to good food from friends'],
    [3, 10, 'Short journeys and efforts related to career'],
    [4, 9, 'Grandmother, ancestral land'],
    [5, 8, 'Insurance investments for progeny'],
    [6, 7, 'Ailments of the wife'],
    [7, 6, 'Disputes with servants and tenants, repayment of debts'],
    [8, 5, 'Death or kidnapping of children'],
    [9, 4, 'Foreign residence'],
    [10, 3, 'Career or profession of a brother'],
    [11, 2, 'Gains for family business, friends of relatives'],
  ],
]

export const HOUSE_RELATIONS_NOTE = 'Bhavat bhavam is used when one chart answers several questions; for a single question it is usually not needed.'

/** [ancient context (monarchies), present context (democracies)] per house. */
export const HOUSE_MUNDANE: [string, string][] = [
  ['The king or ruler, his body and well-being', 'The President or Prime Minister'],
  ['Wealth, treasures and finances of the kingdom', 'Finances of the country, banking'],
  ['The army, its warriors and commander (senapati)', 'The armed forces, advanced weaponry, defence, communications'],
  ['Lands, vehicles', 'The seat of government, agricultural production, lands'],
  ['Diplomacy, the education system', 'Diplomacy, literacy, education and its technical progress'],
  ['The enemy', 'Violence, the nation\'s debts (external and internal)'],
  ['Communications', 'Civil and social unrest'],
  ['Longevity', 'Term of the ruler and government, underground wealth, the insurance sector'],
  ['The mind of the king', 'The religious and moral fabric of the nation, judiciary, the working and mind of the rulers'],
  ['Trade and commerce', 'Employment, business, trade, services'],
  ['Income', 'Gains and income'],
  ['Expenditure', 'Foreign policy and relations, revenue and expenditure'],
]

export const HOUSE_MUNDANE_TEXT = {
  intro: 'Prashna Marga, written by a Namboodiri Brahmin of Kerala in 1649, gives some house significations for the king and kingdom, the Raj Jyotishi\'s whole concern. Read them in their period, and use the present-day meanings for prashnas about countries, politics and mundane affairs.',
  note: 'In those days the 7th signified communications because communication meant travel. Today\'s advanced communications give results from the 3rd.',
}

// ── Lookups with language ──────────────────────────────────

/** For house n (1–12), the house that is the `count`th from it. */
export const nthFrom = (from: number, count: number) => ((from - 1 + count - 1) % 12) + 1

export function getHouseClassical(house: number, lang: EngineLang = 'en'): HouseClassical {
  return lang === 'hi' ? HOUSE_CLASSICAL_HI[house - 1] : HOUSE_CLASSICAL[house - 1]
}

export function getHouseRelations(house: number, lang: EngineLang = 'en'): HouseRelation[] {
  const base = HOUSE_RELATIONS[house - 1]
  if (lang !== 'hi') return base
  return base.map(([n, from], i) => [n, from, HOUSE_RELATIONS_HI[house - 1][i]])
}

export function getHouseMundane(lang: EngineLang = 'en') {
  return lang === 'hi'
    ? { rows: HOUSE_MUNDANE_HI, ...HOUSE_MUNDANE_TEXT_HI }
    : { rows: HOUSE_MUNDANE, ...HOUSE_MUNDANE_TEXT, relationsNote: HOUSE_RELATIONS_NOTE }
}
