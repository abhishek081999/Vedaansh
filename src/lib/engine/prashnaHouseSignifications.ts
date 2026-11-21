// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaHouseSignifications.ts
//  What each of the 12 houses covers. Every signification applies in praśna;
//  groups flagged `prashna` are horary-specific uses and are listed first.
//  Curated from a class-notes sheet ("Prashna House Significations"):
//  class chatter, celebrity examples and moral judgements were left out.
//  Reference data only: nothing here feeds a verdict.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import type { EngineLang } from './lang'
import { PRASHNA_HOUSE_SIG_HI, PRASHNA_PLANET_MEDICAL_HI } from './locale/prashnaHouseSignifications.hi'

export interface HouseSignification {
  text: string
  note?: string
}

export interface HouseSignificationGroup {
  /** Stable id, `h<house>-<slug>`; the Hindi table is keyed on it. */
  id: string
  title: string
  /** True for horary-specific uses. All groups still apply in praśna. */
  prashna: boolean
  items: HouseSignification[]
}

export interface HouseSignifications {
  house: number
  groups: HouseSignificationGroup[]
}

type Row = [text: string, note?: string]

function g(id: string, title: string, prashna: boolean, rows: Row[]): HouseSignificationGroup {
  return { id, title, prashna, items: rows.map(([text, note]) => (note ? { text, note } : { text })) }
}

const P = true
const N = false

export const PRASHNA_HOUSE_SIGNIFICATIONS: HouseSignifications[] = [
  {
    house: 1,
    groups: [
      g('h1-general', 'General', P, [
        ['The querent'],
        ['The nature of the question'],
        ['Thoughts on the querent\'s mind'],
        ['Body, overall health, head and face'],
        ['Age and longevity'],
      ]),
      g('h1-health', 'Health questions', P, [
        ['The treating doctor'],
        ['Should the doctor be changed?'],
        ['Is the diagnosis right?'],
      ]),
      g('h1-theft', 'Theft', P, [
        ['What kind of thief: a robber or a petty thief'],
        ['Appearance of the thief'],
        ['Where the thief went, and in which direction', 'Read from the direction of the lagna lord or of the lagna sign.'],
        ['Movable sign (1, 4, 7, 10) in the lagna or navāṁśa lagna', 'The thief is on the move, the item has gone far, and the thief is a stranger.'],
        ['Fixed sign (2, 5, 8, 11) in the lagna or navāṁśa lagna', 'The item is nearby, probably at home; the thief is from the household and has not left.'],
        ['Dual sign (3, 6, 9, 12) in the lagna or navāṁśa lagna', 'The thief is known to you but is not family; the item has not gone far.'],
        ['These are overview rules', 'Weigh the other rules before judging a theft question.'],
      ]),
      g('h1-medical', 'Health: body area', P, [
        ['The entire body: any disease is possible', 'Overall constitution.'],
        ['Brain and head'],
        ['Left eye', 'Some notes give the left eye to the 12th.'],
      ]),
      g('h1-body', 'Body and physical self', N, [
        ['Physical body, build, stature and constitution'],
        ['Appearance, complexion, skin, hair and features'],
        ['Head, brain and face', 'Body part of Aries, the natural 1st sign.'],
        ['Birthmarks, moles and scars, especially on the head or face'],
        ['Vitality, immunity and the power to recover from illness'],
        ['General health and longevity', 'Read together with the 8th house.'],
      ]),
      g('h1-personality', 'Personality and character', N, [
        ['Temperament, nature and inborn traits'],
        ['Ego, self-image and sense of identity'],
        ['Self-confidence, willpower and courage'],
        ['Mental disposition and attitude to life'],
        ['Habits, behaviour and how you present yourself'],
        ['The first impression you make on others'],
      ]),
      g('h1-life', 'Life direction', N, [
        ['Overall course and quality of life'],
        ['Independence, initiative and the ability to start things'],
        ['Self-expression and individuality'],
        ['Fame, honour, dignity and social standing'],
        ['General happiness and success', 'The 1st is both a kendra and a trikoṇa.'],
        ['The root of the chart', 'Every other house is read in relation to it.'],
      ]),
      g('h1-birth', 'Birth and early life', N, [
        ['Circumstances and place of birth'],
        ['Early childhood and upbringing'],
        ['The environment you were born into'],
      ]),
      g('h1-derived', 'Other contexts', N, [
        ['The nation or its head', 'Mundane astrology.'],
        ['7th from the 7th', 'Bhāvāt bhāvam: you as your spouse\'s partner.'],
        ['9th from the 5th', 'Bhāvāt bhāvam: the fortune of your children.'],
        ['4th from the 10th, 3rd from the 11th, 5th from the 9th', 'Bhāvāt bhāvam.'],
      ]),
      g('h1-nature', 'Natural associations', N, [
        ['Kāraka: Sun'],
        ['Natural sign: Aries', 'Ruled by Mars.'],
        ['Direction: east'],
        ['A kendra (angle) and a trikoṇa (trine)', 'Highly auspicious.'],
      ]),
    ],
  },
  {
    house: 2,
    groups: [
      g('h2-general', 'General', P, [
        ['Family'],
        ['Resources'],
        ['Food'],
        ['Finances and wealth'],
        ['Agricultural land'],
        ['Second marriage'],
        ['Expensive jewellery and ornaments'],
        ['Profit and loss'],
        ['Is the person speaking the truth?', 'Also how far they are using persuasion, bribery, pressure or division (sāma, dāna, daṇḍa, bheda).'],
        ['Close followers'],
        ['Dhātu, mūla or jīva signs and planets here', 'They also shape the answer.'],
      ]),
      g('h2-medical', 'Health: body area', P, [
        ['Face, mouth, teeth and speech'],
        ['Right eye'],
      ]),
      g('h2-core', 'Core significations', N, [
        ['Wealth (dhana bhāva)', 'Finances in general.'],
        ['Family (kuṭumba)', 'The family you are born into, and family life.'],
        ['Speech (vāṇī)', 'How you speak, and whether you speak the truth.'],
        ['Liquid money', 'Cash and digital money.'],
        ['Savings', 'How much you accumulate and manage to keep.'],
        ['Miserliness', 'How tightly you hold on to money.'],
        ['Stubbornness and willpower'],
        ['Beauty and beautification'],
        ['Gold and silver'],
        ['Food storage'],
        ['Home interiors', 'Whether the house looks beautiful and well kept.'],
      ]),
      g('h2-body', 'Body parts', N, [
        ['Face, from the eyebrows to the chin'],
        ['Eyes, especially the right eye'],
        ['Teeth'],
        ['Nose'],
        ['Nails'],
        ['Speech and voice'],
        ['Complexion and the glow of the face'],
      ]),
      g('h2-behaviour', 'Behaviour and values', N, [
        ['Treatment of guests', 'Whether you welcome them warmly or turn them away.'],
        ['Truth and lies'],
        ['Cultural values and the home environment'],
      ]),
      g('h2-education', 'Education and upbringing', N, [
        ['First education at home', 'Values from parents and how you were raised.'],
        ['The wish for higher education'],
        ['Formal education', 'Shown by the 5th house, not the 2nd.'],
      ]),
      g('h2-spiritual', 'Spiritual', N, [
        ['Vairāgya (renunciation)', 'Any leaning towards it, and what kind.'],
        ['Sādhanā', 'How deeply you can engage in spiritual practice.'],
        ['Mantra siddhi', 'Whether it is attained; knowledge of mantras is judged from the 5th.'],
      ]),
      g('h2-relations', 'Relationships and property', N, [
        ['Property you receive, and whether you can keep it'],
        ['Māṅgalya bhāva (2nd from the 7th)', 'Support between husband and wife; the household budget.'],
        ['First wife\'s death and the chance of a second marriage', 'Read in male charts.'],
        ['Women in a man\'s life', 'Read in male charts.'],
      ]),
    ],
  },
  {
    house: 3,
    groups: [
      g('h3-general', 'General', P, [
        ['Courage'],
        ['Younger siblings'],
        ['Short journeys'],
        ['Documents'],
        ['Team members'],
        ['Communication'],
        ['Neck and throat'],
        ['Right side and right ear', 'The 11th is the left.'],
        ['The thief and the theft', 'Signified by Mars. This also holds in the birth chart.'],
        ['Will you go outside the city?'],
        ['A thing that has gone and will not come back'],
        ['Will siblings help?'],
      ]),
      g('h3-medical', 'Health: body area', P, [
        ['Shoulders and arms'],
        ['Right ear and throat'],
      ]),
      g('h3-core', 'Core significations', N, [
        ['Younger brothers and sisters'],
        ['Courage (parākrama)'],
        ['Patience (dhairya)'],
        ['Close relatives'],
        ['Mental stability'],
        ['Willpower and stubbornness'],
        ['Hobbies and passion'],
        ['Efforts, and how you face challenges'],
        ['Social circle'],
        ['Short journeys'],
        ['Documents'],
        ['Passport', 'The visa is seen from the 9th.'],
        ['Communication'],
        ['Neighbours'],
        ['Handwriting and writing skills'],
      ]),
      g('h3-derived', 'Derived houses', N, [
        ['Cause of death', '8th from the 8th.'],
        ['Cause of the father\'s death', '7th from the 9th.'],
        ['Desire and passion', 'First house of the kāma triangle.'],
        ['Change of residence', '12th from the 4th.'],
      ]),
      g('h3-body', 'Body parts', N, [
        ['Throat and vocal cords'],
        ['Ears'],
        ['Shoulders, arms and wrists'],
      ]),
      g('h3-special', 'Special significations', N, [
        ['Singing', 'Singers need a strong 3rd house.'],
        ['Subconscious mind', 'First house of the 3-6-11 triangle.'],
        ['Literary ability and reading power'],
        ['Mathematical ability'],
        ['Driving skill'],
        ['Sudden accidents'],
      ]),
      g('h3-mundane', 'Mundane (medinī)', N, [
        ['Post offices, postal and courier services'],
        ['Neighbouring countries'],
      ]),
    ],
  },
  {
    house: 4,
    groups: [
      g('h4-lost', 'Theft and lost items', P, [
        ['Where the stolen or lost thing is kept, or will be found', 'The 4th matters most in questions of theft, health and missing people.'],
      ]),
      g('h4-health', 'Health: kind of medicine', P, [
        ['Will a simple remedy do, or are stronger drugs needed?'],
        ['Allopathy or alternatives such as Āyurveda, homeopathy or home remedies'],
      ]),
      g('h4-missing', 'Missing person', P, [
        ['Is the missing person comfortable or in hardship?'],
      ]),
      g('h4-general', 'General', P, [
        ['Farming'],
        ['Help from friends and relatives'],
        ['Vehicles'],
        ['Property'],
        ['Comforts and luxury'],
        ['Education'],
        ['Hidden wealth', 'In the birth chart, hidden wealth is seen from the 8th.'],
        ['Judgement of a court case', 'Will it go your way, and will you be content even if it does?'],
        ['Lower house of parliament', 'Mundane astrology.'],
      ]),
      g('h4-medical', 'Health: body area', P, [
        ['Heart, chest and lungs'],
        ['Breast'],
      ]),
      g('h4-family', 'Mother and her side', N, [
        ['Mother'],
        ['Step-mother'],
        ['Maternal relatives and the maternal home'],
        ['Happiness from maternal relatives'],
        ['Maternal uncle', 'Shown specifically by the 6th house, not the 4th.'],
      ]),
      g('h4-property', 'Property and vehicles', N, [
        ['Land and house'],
        ['Agricultural land and farm houses'],
        ['Gardens'],
        ['Barren land'],
        ['All kinds of vehicles'],
      ]),
      g('h4-comforts', 'Comforts', N, [
        ['Mental peace'],
        ['Happiness'],
        ['Luxuries and conveniences'],
      ]),
      g('h4-emotion', 'Emotions', N, [
        ['Feelings, emotional baggage and nourishment'],
        ['Emotion behind every 4th-house matter', 'The Moon is the natural ruler of this house.'],
        ['Attachment to home, land and property'],
        ['The emotional bond with the mother'],
        ['The emotional approach to education'],
        ['Emotional ties with associations'],
        ['The emotional relationship with money and comforts'],
      ]),
      g('h4-other', 'Other', N, [
        ['Pre-school education'],
        ['Home environment in childhood'],
        ['Hidden treasure and secret possessions'],
        ['Chest and breathing'],
        ['Prāṇāyāma and aṣṭāṅga yoga practice'],
        ['Politics and governance', 'For politicians.'],
        ['The company you keep (saṅgati)'],
      ]),
    ],
  },
  {
    house: 5,
    groups: [
      g('h5-general', 'General', P, [
        ['Children'],
        ['Speculation and gambling', 'Risk in general: will taking the risk bring success?'],
        ['Outcome of speculation'],
        ['Wisdom and intelligence'],
        ['Sādhanā and spiritual practice'],
        ['Close, devoted followers'],
        ['Fame and position'],
        ['Love affairs and relationships'],
        ['Stomach, belly and heart'],
        ['Merit from past lives'],
        ['Second younger sibling', '3rd from the 3rd.'],
      ]),
      g('h5-medical', 'Health: body area', P, [
        ['Liver and stomach'],
        ['Heart function'],
        ['Forearms, from the elbow down'],
      ]),
      g('h5-fortune', 'Fortune', N, [
        ['Making of destiny (bhāgya nirmāṇa)'],
        ['Merit from past lives (pūrva janma puṇya)'],
      ]),
      g('h5-education', 'Education and intellect', N, [
        ['Higher education'],
        ['Knowledge and intellectual power'],
        ['Intellect, wisdom and creative thinking'],
        ['Administrative ability'],
      ]),
      g('h5-children', 'Children', N, [
        ['Number of children'],
        ['Gender of children'],
        ['Nature of the children', 'Whether they turn out well.'],
      ]),
      g('h5-spiritual', 'Spiritual', N, [
        ['Sādhanā (spiritual practice)'],
        ['Mantra dīkṣā and mantra siddhi'],
        ['Prāyaścitta (atonement)'],
      ]),
      g('h5-creative', 'Creative', N, [
        ['Literature'],
        ['Arts and dance'],
      ]),
      g('h5-gains', 'Gains', N, [
        ['Sudden and windfall gains'],
        ['Lottery'],
        ['Stock market'],
      ]),
      g('h5-social', 'Social and love', N, [
        ['Followers, positions and fame'],
        ['Love', 'With anyone: parents, siblings or a partner.'],
        ['Prime minister\'s office', 'Mundane astrology.'],
        ['Abdomen'],
      ]),
    ],
  },
  {
    house: 6,
    groups: [
      g('h6-tenants', 'Tenants', P, [
        ['Tenants', 'One who will not vacate a shop or house, or misuses it.'],
      ]),
      g('h6-medical', 'Health: body area', P, [
        ['The main house of disease'],
        ['Intestines and digestive trouble'],
      ]),
      g('h6-core', 'Core: roga, ripu, ṛṇa', N, [
        ['Roga: disease and health problems'],
        ['Ripu and śatru: enemies and opponents'],
        ['Ṛṇa: debts and loans'],
        ['Part of the wealth triangle (dhana trikoṇa)', 'It also gives money, not only problems.'],
      ]),
      g('h6-health', 'Health', N, [
        ['Diseases and injuries'],
        ['Wounds that do not heal completely'],
        ['Sudden mishaps'],
        ['Sudden miscarriage or premature delivery', 'Read in women\'s charts.'],
      ]),
      g('h6-conflict', 'Opponents and disputes', N, [
        ['Problems from opponents, competitors and rivals'],
        ['Court cases and litigation'],
        ['All kinds of disputes'],
        ['Insults'],
        ['Competition and exams'],
      ]),
      g('h6-mind', 'Worries', N, [
        ['Sorrows, tensions and worries'],
      ]),
      g('h6-relations', 'Relations', N, [
        ['Maternal uncle'],
        ['Maternal cousins'],
        ['Step-mother', 'As per Parāśara.'],
      ]),
      g('h6-work', 'Work and service', N, [
        ['Defence and army services'],
        ['Servants and employees'],
        ['The service sector'],
        ['Colleagues and subordinates'],
      ]),
      g('h6-money', 'Financial', N, [
        ['Loans and debts'],
        ['Financial liabilities'],
      ]),
      g('h6-other', 'Other', N, [
        ['Clothes'],
      ]),
    ],
  },
  {
    house: 7,
    groups: [
      g('h7-general', 'General', P, [
        ['Spouse'],
        ['Relationships'],
        ['Partnerships'],
        ['Business and trading'],
        ['Social image'],
        ['The opposite party in court cases'],
        ['Divorce'],
        ['Adoption'],
        ['Foreign matters'],
        ['Victory over enemies'],
        ['Movement'],
        ['The public, society and followers'],
      ]),
      g('h7-theft', 'Theft: who the thief is', P, [
        ['Fire sign here', 'Suggests a quarrelsome, aggressive person.'],
        ['A professional thief, or someone from the neighbourhood?'],
        ['A servant or maid, or family?'],
        ['If family: son, daughter, wife, brother or mother-in-law'],
      ]),
      g('h7-missing', 'Missing person', P, [
        ['Will the missing person return?', 'Judged from the 7th, not the lagna.'],
      ]),
      g('h7-medical', 'Health: body area', P, [
        ['Lower abdomen'],
        ['Reproductive organs and cycles'],
      ]),
    ],
  },
  {
    house: 8,
    groups: [
      g('h8-general', 'General', P, [
        ['Losses'],
        ['Death, and life-and-death decisions'],
        ['Inheritance'],
        ['Changes in your surroundings and neighbours'],
        ['Defeat, obstacles and obstructions in court cases'],
        ['Scandals and conspiracy'],
        ['Raids'],
        ['Defamation and humiliation'],
      ]),
      g('h8-loans', 'Loans', P, [
        ['Part-payment of a loan', 'The minimum that must be paid to avoid forfeiture.'],
        ['Non-performing loans'],
        ['Closing a loan', 'Seen from the 12th, not the 8th.'],
      ]),
      g('h8-medical', 'Health: body area', P, [
        ['Hidden, chronic or serious illness'],
        ['Private parts'],
        ['Death'],
      ]),
      g('h8-nature', 'Nature of the house', N, [
        ['The darkest area of the chart'],
        ['Sorrows and difficulties hidden within'],
        ['The door to Yama (death)'],
        ['Treasures of happiness'],
        ['Every dimension of spirituality'],
        ['Āyuṣ: lifespan and longevity'],
      ]),
      g('h8-marriage', 'Marriage', N, [
        ['Māṅgalya bhāva', 'Read in women\'s charts; the 2nd from the 7th.'],
        ['Dowry'],
        ['Events on the wedding day and the day of the procession'],
        ['Fights or disputes around the marriage'],
        ['Nature of the in-laws\' home'],
      ]),
      g('h8-hidden', 'Hidden matters and conspiracies', N, [
        ['Secret enemies (gupta śatru)'],
        ['Theft and deceit'],
        ['Barriers on the life path'],
        ['Ambushes and plots against you'],
        ['Blame'],
        ['Income tax and government raids'],
        ['The kind and area of public criticism'],
      ]),
      g('h8-karma', 'Past-life karma', N, [
        ['Results of bad deeds from past births'],
        ['Unhappiness in this life rooted in past karma'],
        ['Pinpointing specific life difficulties'],
      ]),
      g('h8-occult', 'Occult sciences', N, [
        ['Occult and mystical knowledge'],
        ['Astrology (jyotiṣa vidyā)'],
        ['Tantra vidyā'],
        ['Inclination and capability in these fields'],
        ['Learning the occult', 'Maturity in it is the 12th.'],
        ['Transformation', 'Liberation is the 12th.'],
        ['Hidden matters', 'Open surrender is the 12th.'],
      ]),
      g('h8-health', 'Health and mind', N, [
        ['Problems with progeny'],
        ['Health of the private parts'],
        ['Potential diseases'],
        ['The psychological state', 'Manias and similar conditions can be read here.'],
      ]),
    ],
  },
  {
    house: 9,
    groups: [
      g('h9-general', 'General', P, [
        ['Overall progress'],
        ['Father'],
        ['Pilgrimage'],
        ['Higher education'],
        ['Charity: will you donate?'],
        ['Long journeys'],
        ['Foreign countries'],
        ['Immigration and permanent residence'],
        ['Psychic readers and spirit mediums'],
      ]),
      g('h9-medical', 'Health: body area', P, [
        ['Thighs and legs', 'Other notes give the thighs to the 10th and the knees to the 9th.'],
        ['Optic nerve'],
      ]),
      g('h9-core', 'Core meanings', N, [
        ['Dharma (righteousness)'],
        ['Bhāgya (fortune and luck)'],
        ['The father\'s house'],
        ['Intuitive experience'],
        ['Life\'s path and philosophy'],
        ['Leadership and popularity'],
        ['Blessings of ancestors and deities'],
      ]),
      g('h9-education', 'Education and knowledge', N, [
        ['Higher and spiritual education'],
        ['Legal knowledge'],
        ['Philosophy and science'],
        ['Humanities', 'With a Mercury connection.'],
        ['Finance management'],
        ['Imagination and intuitive power'],
      ]),
      g('h9-people', 'People', N, [
        ['Guru, teacher or mentor'],
        ['Father and lineage'],
        ['Bosses and higher authorities'],
      ]),
      g('h9-travel', 'Travel', N, [
        ['Long-distance travel', 'Not foreign travel as such.'],
        ['Adapting to other cultures'],
        ['Visa', 'The 3rd shows documents, the 12th the foreign land.'],
        ['Solo trips and travel agencies'],
      ]),
      g('h9-other', 'Other', N, [
        ['Knees and calves', 'The calves are called the second heart.'],
        ['Fame'],
        ['Deep past-life study', '5th from the 5th.'],
        ['Future challenges'],
        ['The ethical and moral framework of life'],
        ['Life pattern: ethical, moderate or unlawful'],
        ['Mapping of the personality'],
      ]),
    ],
  },
  {
    house: 10,
    groups: [
      g('h10-general', 'General', P, [
        ['Authority'],
        ['Ambition'],
        ['Profession'],
        ['Will legal help come in time?', 'Judiciary, lawyers, police and government.'],
        ['A patient\'s behaviour'],
        ['Saturn in the 10th of a praśna chart', 'A problem in the lower body, whatever the sign.'],
        ['A movable sign in the 10th with a planet in it', 'Shows a journey, along with the 3rd and 9th.'],
      ]),
      g('h10-medical', 'Health: body area', P, [
        ['Knees'],
      ]),
      g('h10-core', 'Core significations', N, [
        ['Power', 'Authority and influence in life.'],
        ['Status in society', 'Social standing and reputation.'],
        ['Karma (actions)', 'The nature and quality of your deeds, not only the job.'],
        ['Access to resources'],
        ['The father\'s condition'],
      ]),
      g('h10-karma', 'Karma', N, [
        ['Ethical or unethical actions'],
        ['Good, bad or mixed deeds'],
        ['How, when and in what way you react to situations'],
        ['How steady you stay in your actions'],
        ['Job stability and the ability to stick to your work'],
      ]),
      g('h10-livelihood', 'Livelihood (ājīvikā)', N, [
        ['Whether the livelihood will last'],
        ['How smoothly you earn'],
        ['Stability of income sources'],
      ]),
      g('h10-position', 'Position and fame', N, [
        ['Your position in society and at work'],
        ['Level of authority and leadership'],
        ['Fame and recognition through your work'],
        ['Work-related awards', 'General achievements and awards are the 11th.'],
        ['Potential to become a gazetted officer'],
      ]),
      g('h10-duty', 'Responsibilities', N, [
        ['Are you responsible?'],
        ['How many responsibilities you carry', 'Responsibilities, not liabilities.'],
      ]),
      g('h10-spiritual', 'Pilgrimage and mantra', N, [
        ['Long pilgrimages and religious travel'],
        ['Pronunciation of mantras'],
        ['Method of japa (chanting)'],
        ['Mastery over mantras'],
      ]),
      g('h10-other', 'Other', N, [
        ['Thighs', 'Also the knees and calves.'],
        ['Teaching ability', 'As per Uttara Kālāmṛta; not all authors agree.'],
      ]),
    ],
  },
  {
    house: 11,
    groups: [
      g('h11-general', 'General', P, [
        ['Gains and financial gain'],
        ['Achievements'],
        ['Fulfilment of desires'],
        ['Elder siblings'],
        ['Stepchildren'],
        ['Elections of any kind', 'National, municipal, local or professional bodies.'],
        ['Luxury vehicles', 'The 4th shows ordinary vehicles.'],
        ['Expensive jewellery'],
        ['Left side and left ear', 'The 3rd is the right.'],
      ]),
      g('h11-medical', 'Health: body area', P, [
        ['Legs, calves and circulation'],
        ['Left ear'],
      ]),
      g('h11-relations', 'Friends and siblings', N, [
        ['Friends and social network'],
        ['Quality of friendships'],
        ['Whether friends will help when needed'],
        ['Your ability to help others'],
        ['Support and benefit from elder siblings'],
      ]),
      g('h11-achievement', 'Ambitions and achievements', N, [
        ['Ambitions and whether they are fulfilled'],
        ['Effort needed to achieve them'],
        ['Rewards and awards'],
        ['Government recognition and affiliations'],
      ]),
      g('h11-money', 'Financial', N, [
        ['Income sources'],
        ['Financial growth and accumulation'],
      ]),
      g('h11-spiritual', 'Spiritual', N, [
        ['Siddhi (accomplishment) and prāpti (attainment)'],
        ['Whether spiritual goals will be reached'],
        ['Long pilgrimages'],
      ]),
      g('h11-other', 'Other', N, [
        ['Store of this life\'s karma', 'Gathered through friends, family, society and your own actions.'],
        ['Strength to fight serious disease', '6th from the 6th; matters when serious illness comes.'],
        ['Longevity', 'When the 11th lord links directly with the 6th, 8th or 12th.'],
        ['Good adaptability'],
      ]),
    ],
  },
  {
    house: 12,
    groups: [
      g('h12-general', 'General', P, [
        ['Hospital'],
        ['Losses and expenses'],
        ['Sin'],
        ['Separation from family'],
        ['Demotion'],
        ['Being sent away from home, district or country'],
        ['Settling abroad and foreign travel'],
        ['Materialistic tendencies'],
        ['Isolation'],
        ['Sleep and bed pleasures'],
        ['Jail'],
        ['The life partner\'s health'],
        ['Closing a loan', 'Part-payment is the 8th.'],
      ]),
      g('h12-medical', 'Health: body area', P, [
        ['Feet'],
        ['Left eye'],
        ['Hospital stay and bed rest'],
      ]),
      g('h12-moksha', 'Mokṣa and liberation', N, [
        ['Mokṣa, mukti and liberation', 'Transformation is the 8th.'],
        ['Detachment and vairāgya'],
        ['Maturity in occult sciences', 'Learning them is the 8th.'],
        ['Open surrender', 'Hidden matters are the 8th.'],
      ]),
      g('h12-confinement', 'Isolation and confinement', N, [
        ['Any isolation, imposed or chosen'],
        ['Jail and physical imprisonment'],
        ['Hospital and asylum'],
        ['Meditation retreats and vipassanā'],
        ['A state of void or emptiness'],
        ['The open sky and vastness'],
      ]),
      g('h12-foreign', 'Foreign lands and travel', N, [
        ['Foreign lands and settling abroad'],
        ['Travel abroad and long-distance travel'],
        ['Travel over water'],
        ['Comfort while travelling and while living abroad'],
      ]),
      g('h12-losses', 'Losses and expenditure', N, [
        ['All kinds of losses, including financial'],
        ['Major thefts'],
        ['How money is spent, and spending patterns'],
        ['Investment patterns and wrong investments'],
        ['Court expenses'],
        ['Spending on relationships'],
        ['Loss of honour'],
        ['Possible decline'],
        ['Taking others\' property, illegal possession'],
      ]),
      g('h12-bed', 'Bed pleasures (śayyā sukha)', N, [
        ['Physical relations after marriage'],
        ['Quality of sleep in your own bed'],
        ['Comfort in rest'],
      ]),
      g('h12-spiritual', 'Spiritual life', N, [
        ['The spiritual journey ahead'],
        ['Devotion to dharma and dedication to spirituality'],
        ['How festivals are celebrated'],
        ['Following traditions in spirit or only as formality'],
      ]),
      g('h12-other', 'Other', N, [
        ['Left eye'],
        ['Release from jail', 'When the 6th shows litigation.'],
        ['Results of court cases'],
      ]),
    ],
  },
]

/** All groups for one house (1–12), localized. */
export function getHouseSignifications(house: number, lang: EngineLang = 'en'): HouseSignifications | undefined {
  const base = PRASHNA_HOUSE_SIGNIFICATIONS[house - 1]
  if (!base || base.house !== house) return undefined
  return lang === 'hi' ? localize(base) : base
}

function localize(h: HouseSignifications): HouseSignifications {
  return {
    house: h.house,
    groups: h.groups.map(grp => {
      const hi = PRASHNA_HOUSE_SIG_HI[grp.id]
      if (!hi) return grp
      return {
        ...grp,
        title: hi.title,
        items: grp.items.map((it, i) => {
          const row = hi.items[i]
          if (!row) return it
          const [text, note] = row
          return note ? { text, note } : { text }
        }),
      }
    }),
  }
}

/** Horary-specific groups for a house. */
export function prashnaGroupsFor(house: number, lang: EngineLang = 'en'): HouseSignificationGroup[] {
  return getHouseSignifications(house, lang)?.groups.filter(grp => grp.prashna) ?? []
}

export interface HouseSignificationHit {
  house: number
  group: HouseSignificationGroup
  item: HouseSignification
}

/** Case-insensitive search over text, note and group title, in the given language. */
/** Lower-case, NFC, and drop the nukta so वीजा matches वीज़ा. */
function norm(s: string): string {
  return s.normalize('NFD').replace(/\u093C/g, '').normalize('NFC').toLowerCase()
}

export function searchHouseSignifications(query: string, lang: EngineLang = 'en'): HouseSignificationHit[] {
  const q = norm(query.trim())
  if (!q) return []
  const hits: HouseSignificationHit[] = []
  for (let house = 1; house <= 12; house++) {
    const h = getHouseSignifications(house, lang)
    if (!h) continue
    for (const group of h.groups) {
      const groupMatch = norm(group.title).includes(q)
      for (const item of group.items) {
        if (groupMatch || norm(item.text).includes(q) || (item.note && norm(item.note).includes(q))) hits.push({ house, group, item })
      }
    }
  }
  return hits
}

// ── Planets in health questions ─────────────────────────────

export interface PlanetMedical {
  id: GrahaId
  areas: string[]
}

/** What each planet signifies in a health question. Traditional indications only, not medical advice. */
export const PRASHNA_PLANET_MEDICAL: PlanetMedical[] = [
  { id: 'Su', areas: ['Right eye', 'vitality', 'bones', 'bile', 'heart energy', 'skin'] },
  { id: 'Mo', areas: ['Left eye', 'mind', 'body fluids', 'breast', 'lungs', 'skin hydration'] },
  { id: 'Ma', areas: ['Blood', 'inflammation', 'muscles (movement)', 'infection', 'glands'] },
  { id: 'Me', areas: ['Nerves', 'nasal passages', 'speech', 'intelligence', 'skin', 'bile'] },
  { id: 'Ju', areas: ['Liver', 'blood sugar', 'muscles (growth)', 'lungs (air)', 'wisdom'] },
  { id: 'Ve', areas: ['Vision', 'kidneys', 'sexual health', 'beauty', 'sweetness', 'filtration'] },
  { id: 'Sa', areas: ['Chronic disease', 'bones', 'pressure', 'dryness', 'muscle power', 'obstruction'] },
  { id: 'Ra', areas: ['Allergies', 'abnormal growth', 'infection', 'illusion', 'abnormal breathing'] },
  { id: 'Ke', areas: ['Blockage', 'mysterious disease', 'obstruction', 'spiritual or karmic illness'] },
]

export function getPlanetMedical(lang: EngineLang = 'en'): PlanetMedical[] {
  if (lang !== 'hi') return PRASHNA_PLANET_MEDICAL
  return PRASHNA_PLANET_MEDICAL.map(p => ({ id: p.id, areas: PRASHNA_PLANET_MEDICAL_HI[p.id] ?? p.areas }))
}
