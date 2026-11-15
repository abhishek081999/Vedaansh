// ─────────────────────────────────────────────────────────────
//  src/lib/engine/tithiTeaching.ts
//  Tithi as "feeling": the class teaching on each lunar day — Nitya
//  devi, core emotion, life pattern, shadow, myth, dagdha rashis,
//  tithi × vaar combinations and traditional remedies.
//
//  Frame: yoga = the outcome, tithi = how you feel on the road to it
//  (Jal / water — emotion), vaar = the catalyst that supports or
//  opposes that feeling. Daily tithi = mood of the day (transit);
//  birth tithi = life pattern. Pure — no React / DB.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import { RASHI_HI } from '@/i18n/jyotish'
import type { EngineLang } from '@/lib/engine/lang'
import { lunarDayFromTithi } from '@/lib/engine/tithiMeta'
import {
  TEACHING_HI,
  TEACHING_PRINCIPLES_HI,
  VAAR_COMBOS_HI,
} from '@/lib/engine/locale/tithiTeaching.hi'

/** 1–15 lunar day (15 = Purnima) or 30 for Amavasya. */
export type TithiTeachingKey =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 30

/** 0 = Sunday … 6 = Saturday (same as vaarMeta). */
export type VaraIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type VaarComboTone = 'supports' | 'opposes' | 'mixed'

export interface TithiTeachingText {
  /** Nitya devi / presiding deity as taught */
  devi:        string
  /** One-line core feeling of the tithi */
  essence:     string
  /** Life pattern when born on this tithi */
  nature:      string
  /** The tithi dosha — what goes wrong if unworked */
  shadow:      string
  /** Myth that carries the lesson */
  story:       string
  /** How the day feels when this tithi is running */
  dayFeeling:  string
  goodFor:     string[]
  avoid:       string[]
  remedies:    string[]
  /** Why the dagdha (zero) signs don't land for this tithi */
  dagdhaWhy:   string
  /** How natives tend to present themselves (profile photo etc.) — optional */
  presentation?: string
}

export interface TithiVaarCombo {
  tone: VaarComboTone
  text: string
}

export interface TithiTeaching extends TithiTeachingText {
  key:          TithiTeachingKey
  lunarDay:     number
  /** Lord as stated in class; null where not taught. A side parameter only. */
  lord:         GrahaId | null
  dagdhaRashis: Rashi[]
  dagdhaNames:  string[]
  /** True when the dagdha list is the classical one, not yet covered in class */
  dagdhaClassicalOnly: boolean
}

interface TeachingShape {
  lord: GrahaId | null
  dagdha: Rashi[]
  dagdhaClassicalOnly?: boolean
}

const SHAPE: Record<TithiTeachingKey, TeachingShape> = {
  1:  { lord: 'Su', dagdha: [7, 10] },
  2:  { lord: null, dagdha: [9, 12] },
  3:  { lord: 'Ma', dagdha: [5, 10] },
  4:  { lord: null, dagdha: [2, 11] },
  5:  { lord: 'Ju', dagdha: [3, 6] },
  6:  { lord: 'Ve', dagdha: [1, 5] },
  7:  { lord: 'Sa', dagdha: [4, 9], dagdhaClassicalOnly: true },
  8:  { lord: 'Mo', dagdha: [3, 6] },
  9:  { lord: 'Su', dagdha: [5, 8] },
  10: { lord: null, dagdha: [5, 8] },
  11: { lord: null, dagdha: [9, 12] },
  12: { lord: null, dagdha: [7, 10] },
  13: { lord: null, dagdha: [2, 5] },
  14: { lord: null, dagdha: [3, 6, 9, 12] },
  15: { lord: null, dagdha: [] },
  30: { lord: null, dagdha: [] },
}

export const TEACHING_EN: Record<TithiTeachingKey, TithiTeachingText> = {
  1: {
    devi: 'Kameshwari — desire',
    essence: 'The urge to begin: desire, innovation and leadership.',
    nature: 'Pioneers, researchers and system-builders who break from tradition and set up a new school, rule or domain. Bold and self-willed, full of brilliant ideas; they lead and have followers rather than partners.',
    shadow: 'Never satisfied — has everything yet loses sleep over the one piece still missing. Ego, impatience with slow consistent work, and little taste for logic, accounts or step-by-step calculation. Head injuries are a traditional sensitivity.',
    story: 'King Bali ruled the three worlds yet could not sleep for want of a small piece of heaven; ignoring Shukracharya’s counsel, he lost everything. Indra too was unhappy that one village, Gokul, worshipped Krishna instead of him.',
    dayFeeling: 'Restless and ambitious: a lot gets started and nothing feels like enough. Good for beginnings, poor for contentment.',
    goodFor: ['Starting new and original work', 'Launching ideas you will lead yourself'],
    avoid: ['Partnerships', 'Shopping or marriage when you want lasting satisfaction'],
    remedies: [
      'Practise contentment: sit down and consciously appreciate what is already there — without it the vrata is empty.',
      'Bali Pratipada (Kartik Shukla Pratipada): tie a red thread round a kaner tree, worship it, fast and remember King Bali.',
    ],
    dagdhaWhy: 'Libra (partnership, give-and-take) and Capricorn (patient daily grind on one problem) — energies a Pratipada native does not naturally understand.',
    presentation: 'Face clearly visible and bold — wants to be seen.',
  },
  2: {
    devi: 'Bhagamalini — the preserver',
    essence: 'To gather, preserve and protect — family, money and people.',
    nature: 'Compassionate healers and helpers who keep everyone together and adopt friends as family. Comfort-loving homebodies who want a sense of protection, like a mother guarding the child in the womb.',
    shadow: 'Physical and emotional difficulties come so that compassion can grow. Blamed — and blames itself — for family troubles that are not its fault (self-sabotage). Trusts outsiders too easily: money lent rarely returns and the relationship ends. Dislikes travel and leaving the comfort zone; moody.',
    story: 'Yudhishthira blamed himself for the fall of the Kuru clan and asked Krishna for a remedy. In Chyavana Rishi’s story, Sukanya had to recognise her real husband among three look-alikes made by the Ashwini Kumars — the gift of seeing people truly.',
    dayFeeling: 'Tender around money, family and feelings. A day for self-assessment and for staying close to true family.',
    goodFor: ['Self-assessment and review', 'Time with genuine family'],
    avoid: ['Lending money or resources', 'Building new trust-based ties or marriage', 'Starting construction — the day Vishwakarma laid down his tools'],
    remedies: [
      'Netra vrata (Vaishakha Shukla Dwitiya, Sun in Taurus): spend the day seeing and reading only what soothes the eyes.',
      'Offer water to the Sun and pray to see truth in relationships.',
      'Worship an inexpensive red stone (ruby or red agate) and let it go in flowing water.',
    ],
    dagdhaWhy: 'Sagittarius (law, rules, everyone treated equally) and Pisces (knowing when to let go) — the opposite of holding everything together.',
    presentation: 'Decorated — with family, food or a pleasant background; wants to be looked at without showing off.',
  },
  3: {
    devi: 'Nityaklinna — nourishment through effort (her pearls are sweat)',
    essence: 'Hard work, effort and fight.',
    nature: 'Very hard-working and courageous (parakram); life feels tough from birth and they push through. Often sharp-featured and physically strong.',
    shadow: 'Cannot let go or forgive, and enjoys a fight. Little regard for others’ feelings. Regular jobs and dignity suffer through aggression; trouble through partner and family.',
    story: 'Rambha, an apsara born on Tritiya with the Sun in Gemini and a daughter-in-law of Kubera’s house, was abducted by Ravana at a family gathering, and curses followed. Hurt inside the family leaves distrust of family.',
    dayFeeling: 'Driven and combative — a lot gets done and tempers flare.',
    goodFor: ['Hard physical work', 'Remedies for family peace (Shukla or Krishna Tritiya, best with Sun in Gemini)'],
    avoid: ['Avoidable arguments', 'Partnerships begun in anger'],
    remedies: [
      'Cover the Shivalinga with red sandalwood paste.',
      'Four bamboo or jute baskets of 12 uncut Indian fruits each (banana, ber) — for ancestors, the priest, the family and the river. Nothing that needs a knife: cutting brings violence back.',
      'Spend relaxed time with family instead of handing out work.',
    ],
    dagdhaWhy: 'Leo (dignity — respect given and received) and Capricorn (knowing that not every day needs a fight).',
    presentation: 'Posing with strength — gym, weapons or powerful people.',
  },
  4: {
    devi: 'Bhairavi; deity Ganesha — Rikta (empty)',
    essence: 'The zero point: empty the head, pause and reset.',
    nature: 'Writers, meditators and natural students of jyotish; much is held inside.',
    shadow: 'Fear of humiliation and strong self-consciousness — hides the face, keeps the camera off. Unclear even to itself about what it wants; finds self-acceptance hard and bottles up poison.',
    story: 'Shiva says: come to me when you feel you have no head. Ganesha’s cure was writing — fast and well. When Shiva threw Kartikeya’s book of prediction into the sea, Samudra completed it as Samudrika Shastra.',
    dayFeeling: 'An empty day — not for starting. Good for meditation, questioning yourself and bringing things to zero.',
    goodFor: ['Ending things — divorce, shaking off enemies, closing matters', 'Meditation, sadhana, yantra-making, gardening, sketching', 'Starting to learn jyotish or to write a book'],
    avoid: ['Starting new work or ventures'],
    remedies: [
      'Keep a turmeric or gold Ganesha (or a turmeric painting) and touch it to the forehead daily — as a hair clip, ring or inside a cap.',
      'Traditional six-day Ganesha puja (Thursday to Wednesday) with Ganesha Atharvashirsha and flower forms of Ganesha.',
      'Write: writing lets out what cannot be said.',
    ],
    dagdhaWhy: 'Taurus (presenting oneself, care of appearance) and Aquarius (openly saying what one wants).',
    presentation: 'Hidden — face covered by hair, someone else’s photo, or a back view.',
  },
  5: {
    devi: 'Vahnivasini; deities Nagas and Pitris',
    essence: 'Learning, love and creation — without ego.',
    nature: 'Adaptable like the serpent, logical and good listeners; creative, sensitive and brilliant. Love and education are the life themes: partners are chosen for mind rather than looks, children’s education drives big decisions, and they leave work where learning stops. They reread the same text and find something new each time.',
    shadow: 'Take time to settle into life; struggle to gather things in. Speak little — and sharply when they do.',
    story: 'Chaitra Shukla Panchami (Sun in Pisces) is Hayagriva and Matsya jayanti; feeding fish on Panchami opens access to knowledge.',
    dayFeeling: 'Open, easy and curious — good for learning and for starting anything that needs siddhi.',
    goodFor: ['Education and learning', 'Love and creative work', 'Beginning work for a specific siddhi', 'Marriage — the class’s pick among tithis, ideally with Priti yoga'],
    avoid: ['Pointless debate'],
    remedies: [
      'Feed fish, especially on Chaitra Shukla Panchami.',
      'Crush a pomegranate by hand and bathe the Devi with it.',
    ],
    dagdhaWhy: 'Gemini (idle chatter) and Virgo (disputes) — they use neither question marks nor exclamation marks.',
  },
  6: {
    devi: 'Vajreshwari; deity Kartikeya',
    essence: 'A material goal — work for tangible results and money.',
    nature: 'Practical, earthy and results-driven; skilled with the hands, dance and craft.',
    shadow: 'Money becomes the main goal and the body is sacrificed for it. Traditional sensitivities: lower abdomen and digestion, children and fertility, married life, vastu of the home, and a sense of evil eye. Over-planning — nature works on a bigger scale than the plan.',
    story: 'Kartikeya’s spear is made in a perfect ratio — the same proportion used in vastu. In the Agni Purana, Shiva’s Tandava (Nataraja) form belongs to Shashthi.',
    dayFeeling: 'Calculating and goal-driven.',
    goodFor: ['Practical, hands-on work'],
    avoid: ['Reducing a decision to its money value'],
    remedies: [
      'Sit in Vajrasana after meals — the lower abdomen settles.',
      'Worship Nataraja: a painting, or a silver idol of 48 g (or a multiple), kept in the south-east and consecrated on Shashthi or Shivaratri.',
      'Sun worship on Vaishakha Shukla Shashthi and on each Shashthi for the protection of children.',
    ],
    dagdhaWhy: 'Aries (care of one’s own body) and Leo (full attention to children).',
    presentation: 'Deity images, idols or dance poses; the one forwarding morning deity posters.',
  },
  7: {
    devi: 'Shivaduti',
    essence: 'Protect, serve and keep discipline — the middle point of balance.',
    nature: 'Protective, disciplined and service-minded. Work is valued by whom it helps, not by money. Saturn here is called Ishvara-amsha.',
    shadow: 'Stubborn — repeats the same mistake knowing the result. When balance breaks they go to extremes, very religious or very sensual; life runs in ups and downs. Physical problems, especially of the legs, are a traditional sensitivity.',
    story: 'Seventh of fifteen, Saptami sits at the centre — six tithis on either side — so balance is its lesson.',
    dayFeeling: 'Steady and service-oriented.',
    goodFor: ['Seva and disciplined work'],
    avoid: ['Starting construction'],
    remedies: ['Physical seva with your own hands.'],
    dagdhaWhy: 'Classical list (Cancer and Sagittarius) — not yet discussed in class.',
  },
  8: {
    devi: 'Kali; deity Krishna (Krishna and Radha Ashtami)',
    essence: 'Balance through detachment — the art of diplomacy.',
    nature: 'Diplomats who stand with both sides and offend no one; stay young and never sit still. Not stubborn — they can justify everything they do.',
    shadow: 'Life is always a little imbalanced and commitment is hard. Easily affected by outer influences. No firm friends, and attachment to any fixed ideology becomes their downfall.',
    story: 'Krishna stands with one leg raised — like balancing on a rope. He is with Pandavas and Kauravas alike, and his Gita speaks to the householder, the politician and the sannyasi.',
    dayFeeling: 'Detached; you can justify anything today.',
    goodFor: ['Mediation and diplomacy'],
    avoid: ['Marriage or starting a business — attachment does not form'],
    remedies: [
      'Run Ashtami vratas for the house where life is imbalanced, starting when the Sun transits it (e.g. eight Mahalakshmi vratas with the Sun in Taurus for money).',
      'Read the Gita; chant Hare Krishna to dissolve hatred.',
      'A mandala or rangoli with a copper kalash and a consecrated Krishna idol on it.',
      'Peacock-feather jhaada; bathe in water boiled with jatamansi and khus.',
    ],
    dagdhaWhy: 'Gemini and Virgo — asking questions, giving reasons, knowing who a real friend is.',
  },
  9: {
    devi: 'Kulasundari; deity Rama',
    essence: 'Dharma, lineage and protocol.',
    nature: 'Confident through lineage and tradition. Standards, SOPs and proper brands matter; never claim rights, yet do every duty.',
    shadow: 'Every word they hear becomes a rule. Breaking a protocol or tradition is agony; cannot assert themselves or bring big transformations.',
    story: 'Before battle Rama offered 108 lotuses to Chandi; two were missing, so he offered his own eyes — hence Rajiv-nayan.',
    dayFeeling: 'Bound by rules — what must not be done weighs heavy.',
    goodFor: ['Formal rites and following tradition'],
    avoid: ['Forcing a break with tradition'],
    remedies: ['Worship Maa Chandi — with blue lotus if possible (it grows in a pot). Chandi’s energy helps them break protocol when needed.'],
    dagdhaWhy: 'Leo (speaking with authority) and Scorpio (letting go, bringing transformation).',
  },
  10: {
    devi: 'Yama / Dharmaraja; Ganga, Ashta Vasus, Dashavatara',
    essence: 'Guidance descends — knowledge, discipline and help for others.',
    nature: 'Very knowledgeable yet humble and disciplined; self-guided. Businesses and hobbies change through life because they keep needing new knowledge.',
    shadow: 'Restless — neither rests nor lets others rest; does not settle in one place or take the boss’s chair.',
    story: 'Ganga came to earth on Jyeshtha Shukla Dashami, and the Dashavatara are celebrated on Bhadrapada Shukla Dashami — this is the day the guides come down.',
    dayFeeling: 'Purposeful and outward — a day of learning and movement.',
    goodFor: ['Learning', 'Travel to mountains'],
    avoid: ['Expecting to settle down'],
    remedies: [
      'Go to the mountains — trek, stay in the hills; mountains gather the energy of the ten directions.',
      'Parikrama of Kailash (even by air) for those who seek wisdom.',
    ],
    dagdhaWhy: 'Leo (holding a position) and Scorpio (they grow things rather than end them).',
  },
  11: {
    devi: 'Ekadashi Devi; Vishnu',
    essence: 'Dreamy and switched off — heal by letting go.',
    nature: 'Live in their own world; dreamy-eyed.',
    shadow: 'Long-term planning and absorbing knowledge are hard on this energy.',
    story: 'Ekadashi Devi protected Vishnu from a demon and vowed no sin would remain on earth. Sin begged for a home and was given grain for one tithi — hence no grain on Ekadashi.',
    dayFeeling: 'You zone out; the subconscious is strong. Best spent resting and cleaning the mind.',
    goodFor: ['Fasting, rest and healing'],
    avoid: ['Marriage — you stay absent-minded in it', 'Long-term planning, learning, gym or heavy work'],
    remedies: ['Ekadashi fast without grain: rest, light food, lie like Vishnu on Shesha — no exertion.'],
    dagdhaWhy: 'Sagittarius and Pisces — signs of planning and knowledge, which a zoned-out mind cannot use.',
  },
  12: {
    devi: 'Vishnu / Vamana',
    essence: 'The fruit of karma — results of what was done before.',
    nature: 'Either born lucky or carrying a heavy inheritance; the remote control of life lies elsewhere. Must stay humble.',
    shadow: 'Results do not follow effort; inherited (pitru) burdens. Rahu tends to be troubled in the chart, wherever it sits.',
    story: 'All that was done on the other tithis comes back on Dwadashi — the most karmic of the tithis.',
    dayFeeling: 'Out of your hands — results arrive, good or bad.',
    goodFor: ['Charity and closing karmic accounts'],
    avoid: ['Starting a business — no profit, no loss', 'Handing control of your life to others'],
    remedies: [
      'The 12-syllable mantra: Om Namo Bhagavate Vasudevaya.',
      'Give uncooked khichdi in a pot to 12 Brahmins, or feed 12 at home.',
      'Burn 108 dried cow-dung balls in a perforated pot, take the smoke through the house, then hang it outside to burn.',
      'Light 12 lamps outside at night.',
    ],
    dagdhaWhy: 'Libra (power in another’s hands) and Capricorn (one’s own karma seems to make no difference).',
  },
  13: {
    devi: 'Sarvamangala; Shiva — Pradosh',
    essence: 'Release — finishing, freeing and letting go.',
    nature: 'Oriented to moksha and freedom. From Trayodashi on, the energy comes from beyond the earth.',
    shadow: 'Irritable over small things; the mind wanders, so accidents are a traditional sensitivity. Saturn tends to give poor results — work and married life suffer.',
    story: 'Madar, kaner and aak are its trees; the remedy honours the vahanas — Shiva on Nandi and Parvati on the lion.',
    dayFeeling: 'Wants to end and leave things; not a day to set goals.',
    goodFor: ['Ending things — divorce, release from a partner, moksha practice'],
    avoid: ['Setting goals or making plans'],
    remedies: [
      'Worship a clay idol of Shiva on Nandi and Parvati on a lion.',
      'Kamadhenu / cow worship.',
    ],
    dagdhaWhy: 'Taurus (accumulation, family) and Leo (sitting in the chair of power).',
  },
  14: {
    devi: 'Kali',
    essence: 'The final burst before fullness — fearless, all or nothing.',
    nature: 'Fearless world-changers who have already faced the worst; tested again and again, they become great. Accept themselves and do not care how they look. Straight — no dual personality.',
    shadow: 'Extreme reactions to insult and a hunger for revenge; no diplomacy. Untimely deaths in the family pattern — a child born after such a loss often comes on Chaturdashi.',
    story: 'Sati’s self-sacrifice fell on Chaturdashi — she would not bear the insult, even at the cost of herself.',
    dayFeeling: 'Raw and intense — big, uncompromising moves.',
    goodFor: ['Bold, decisive change'],
    avoid: ['Situations that need diplomacy'],
    remedies: [
      'Narasimha vrata: sweet wheat roti with sugar and ghee offered to Narasimha.',
      'Cover the Shivalinga with local seasonal flowers.',
      'A four-faced flour lamp (diya) at a crossroads or outside the home — a diya shows the way; a jyot points up to God, and only a jyot is lit in the home temple.',
    ],
    dagdhaWhy: 'All four dual signs — Gemini, Virgo, Sagittarius, Pisces. There is no duality and no diplomacy here.',
  },
  15: {
    devi: 'Purnima — full Moon',
    essence: 'Full energy — life goes to extremes.',
    nature: 'Life swings to extremes along the house axis where the Sun–Moon opposition falls, and one side of life tends to be ignored. Less struggle — life feels pre-destined, with good and bad opportunities arriving on their own. Lunar eclipses fall only on Purnima.',
    shadow: 'Hard to bear their intensity or predict when the mind will change; no middle path.',
    story: 'On Kartik Purnima people bathe in the Ganga and offer a lamp to the water.',
    dayFeeling: 'Unstable — either finish everything or do nothing. Brain circuits feel overloaded.',
    goodFor: ['Dana — giving grain with your own hands', 'Completing'],
    avoid: ['Starting new work'],
    remedies: [
      'Each Purnima, give grain with your own hands — local staples, about one-twelfth of your body weight over the year — to a temple, gurudwara or someone who chants God’s name.',
      'Kartik month: bathe at dawn and float a lamp with your own hand.',
    ],
    dagdhaWhy: 'No dagdha signs are taught for Purnima.',
  },
  30: {
    devi: 'Amavasya — new Moon',
    essence: 'Zero energy — life goes to extremes.',
    nature: 'Like Purnima, life runs to extremes along the axis where Sun and Moon meet; less struggle, more destiny. Solar eclipses fall only on Amavasya. At Amavasya the Moon meets the Sun and collects the messages it will carry until the next new Moon — which is why the new-Moon chart is read.',
    shadow: 'Energy is unstable; no middle path.',
    story: 'The Moon meets the king (Sun) and asks which messages to carry to the planets this month.',
    dayFeeling: 'Unstable — either finish everything or do nothing.',
    goodFor: ['Dana — giving grain with your own hands', 'Inner work'],
    avoid: ['Starting new work'],
    remedies: ['Each Amavasya, give grain with your own hands — local staples — to a temple, gurudwara or someone who chants God’s name.'],
    dagdhaWhy: 'No dagdha signs are taught for Amavasya.',
  },
}

/** Tithi × vaar notes taught in class. Only the combinations actually taught are listed. */
export const VAAR_COMBOS_EN: Partial<Record<TithiTeachingKey, Partial<Record<VaraIndex, TithiVaarCombo>>>> = {
  1: {
    0: { tone: 'mixed', text: 'Called Amrit yoga — a natural pull to be king, but amrit means desire that never ends. Don’t expect contentment from shopping or a wedding on it.' },
    2: { tone: 'mixed', text: 'Mars fulfils the Sun’s desire — strength plus desire, so ego can climb very high.' },
    3: { tone: 'opposes', text: 'Sam-saptak: small practical decisions drain a king’s creativity. Poor for creative work.' },
    4: { tone: 'supports', text: 'Desire for knowledge and research; the shadow is pride in one’s own knowledge.' },
    6: { tone: 'opposes', text: 'Frustration — the going is very hard.' },
  },
  2: {
    1: { tone: 'supports', text: 'The Moon supports it — a good combination.' },
    4: { tone: 'supports', text: 'Jupiter at least steadies the emotions.' },
    6: { tone: 'opposes', text: 'Depression and miserliness over resources — Saturn dries up the goddess of milk, curd and ghee.' },
  },
  3: {
    0: { tone: 'opposes', text: 'Talking to them turns into a fight; jobs and dignity suffer.' },
    2: { tone: 'mixed', text: 'Very aggressive.' },
    4: { tone: 'opposes', text: 'Extremely aggressive — fighting against wisdom itself.' },
    6: { tone: 'opposes', text: 'Every conversation becomes a fight; regular jobs and position slip away.' },
  },
  5: {
    0: { tone: 'supports', text: 'Compatible energy for learning.' },
    2: { tone: 'mixed', text: 'Mars adds logic — strong at mental maths and engineering; they reach the answer by their own route.' },
    3: { tone: 'mixed', text: 'Questions multiply in the name of knowledge.' },
    4: { tone: 'supports', text: 'Compatible energy for learning.' },
  },
  7: {
    0: { tone: 'opposes', text: '“I am not your servant” — the urge to serve clashes with the Sun.' },
    1: { tone: 'opposes', text: 'Overthinking and low moods; feels over-worked. Close to the mother — serving her becomes part of life.' },
    2: { tone: 'opposes', text: 'Balance breaks; accidents and injuries are a traditional sensitivity.' },
    3: { tone: 'supports', text: 'Supportive to animals, children and family relations; the back is a traditional sensitivity.' },
    5: { tone: 'supports', text: 'Strongly supports the spouse — financially and with the mind.' },
  },
  13: {
    0: { tone: 'opposes', text: 'An active Sun with a goal-less tithi — the boss and goals become the issue.' },
    2: { tone: 'supports', text: 'Mars balances the Saturn trouble of Trayodashi.' },
    4: { tone: 'opposes', text: 'Opposed energy.' },
    6: { tone: 'opposes', text: 'Opposed energy.' },
  },
}

/** How to use tithi — the class principles. */
export const TEACHING_PRINCIPLES_EN: string[] = [
  'Yoga is the outcome; tithi is how you feel on the way there. Tithi is the water element — it governs emotion.',
  'Read tithi with vaar: the day either supports the tithi’s feeling or opposes it. Add the yoga for the full picture.',
  'Daily tithi is the mood of the day (transit); birth tithi is the life pattern. For a muhurta, take the tithi running when the work starts.',
  'Shukla is not good and Krishna is not bad: Shukla moves away from the source toward independence, Krishna turns inward toward the soul.',
  'The tithi lord is only a side parameter — don’t run to the chart to judge a tithi by its lord.',
  'Dagdha (zero) signs are the sign energies a tithi does not understand; use them in panchang reading, not to modify planets in the chart.',
  'A perfect muhurta never comes. Aim for three or four good limbs out of five and remedy the rest.',
  'Keep a diary for two lunar cycles: note tithi, vaar, yoga, nakshatra and karana each morning and what happened each evening. By the third cycle you will feel the day before you check.',
]

export function teachingKeyFromTithi(tithiNumber1to30: number): TithiTeachingKey {
  const n = Math.min(30, Math.max(1, Math.floor(tithiNumber1to30)))
  return (n === 30 ? 30 : lunarDayFromTithi(n)) as TithiTeachingKey
}

export function getTithiTeaching(tithiNumber1to30: number, lang: EngineLang = 'en'): TithiTeaching {
  const key = teachingKeyFromTithi(tithiNumber1to30)
  const shape = SHAPE[key]
  const text = lang === 'hi' ? TEACHING_HI[key] : TEACHING_EN[key]
  return {
    ...text,
    key,
    lunarDay: key === 30 ? 15 : key,
    lord: shape.lord,
    dagdhaRashis: shape.dagdha,
    dagdhaNames: shape.dagdha.map((r) => (lang === 'hi' ? RASHI_HI[r] : RASHI_NAMES[r])),
    dagdhaClassicalOnly: shape.dagdhaClassicalOnly ?? false,
  }
}

/** Tithi × vaar note (vara 0 = Sunday); null when the class did not teach that pair. */
export function getTithiVaarCombo(
  tithiNumber1to30: number,
  varaNumber: number,
  lang: EngineLang = 'en',
): TithiVaarCombo | null {
  const key = teachingKeyFromTithi(tithiNumber1to30)
  const v = (((Math.floor(varaNumber) % 7) + 7) % 7) as VaraIndex
  const table = lang === 'hi' ? VAAR_COMBOS_HI : VAAR_COMBOS_EN
  return table[key]?.[v] ?? null
}

export function listTithiTeachingPrinciples(lang: EngineLang = 'en'): string[] {
  return lang === 'hi' ? TEACHING_PRINCIPLES_HI : TEACHING_PRINCIPLES_EN
}
