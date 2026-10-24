// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/pisces.ts
//  Pisces Ascendant (Meen Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const PISCES_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 12,
  title: 'Pisces Ascendant (Meen Lagna)',
  intro:
    'Pisces is the sign of giving. A Pisces Lagna is born to give, with few boundaries, and the question of life is how much to give and to whom. ' +
    'It is considered a blessed ascendant that carries cosmic (akasha) inspiration, and its pain comes mainly from giving fully and then feeling drained. ' +
    'Venus is exalted and Mercury debilitated in Pisces: devotion comes easily, bargaining and calculation do not.',
  traits: [
    {
      id: 'giving',
      title: 'Born to give',
      points: [
        'Gives without bargaining over small amounts and without clear boundaries; wherever Pisces falls in the chart, that area is where they give.',
        'Others may "mine" them, extracting and leaving; the native feels exhausted and later questions why they keep giving.',
        'Key lesson: "I was born to give; whether I receive depends on God." Self-centredness is not a Pisces trait.',
        'They absorb others’ problems and negativity; people gather to unload on them.',
      ],
    },
    {
      id: 'emotional',
      title: 'Emotional body (4th, 8th, 12th)',
      points: [
        'Suffers emotionally more than most Lagnas; the emotional houses govern memory and storage.',
        'Surrender happens fully and once; afterward regret may follow.',
        'Cannot be reasoned with logically because their grace is unconditional.',
      ],
    },
    {
      id: 'blessing',
      title: 'Spiritual blessing',
      points: [
        'Considered blessed, as this Lagna is not reached without past devotion; can draw inspiration and knowledge from a broad, universal level.',
        'Excellent astrologers, sadhaks and devotees; need not hoard, since resources come when needed.',
        'Venus exalted in Pisces gives devotion (unconditional service to the deity), though in love it can bring depression and attraction to the wrong person (8th-house link).',
        'Mercury debilitated: cannot calculate or bargain; may give expensive things cheaply or free.',
      ],
    },
    {
      id: 'practices',
      title: 'Supportive practices',
      points: [
        'Visit spiritual places regularly (Rishikesh, Devprayag, Haridwar); bathe in holy rivers; Shiva and Mother Ganga devotion come naturally.',
        'Sadhana works through emotional absorption and love for the deity rather than rigid counting; walking alone at night under the moon builds personality.',
        'Protect themselves from being drained, and avoid getting addicted to Aquarius-type things (social media, gadgets).',
      ],
    },
    {
      id: 'transits-note',
      title: 'Planets in the Lagna sign (teaching summary)',
      points: [
        'Saturn in Pisces drains and confuses how much to give; Mars fights for the wrong people, often after damage is done.',
        'Ketu says "take only me, I will die for you" in relationships; Jupiter in Pisces only gives, so keep Jupiter content and keep receiving from it.',
        'Venus in Pisces gives strong devotion with a risk of low mood.',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Pisces',
      theme: 'Giving, surrender, devotion, no boundaries',
      points: [
        'See the general traits: unconditional giving, absorption of others’ pain, spiritual downloading.',
        'Jupiter is the Lagna lord, so read where Jupiter is placed first.',
      ],
    },
    2: {
      house: 2,
      signName: 'Aries',
      theme: 'Early financial responsibility; sudden money; fast, blunt speech',
      points: [
        'Matures early and takes financial responsibility for the family like a commander ("leave it to me").',
        'Not a naturally wealthy sign; may overspend. Resources come suddenly and must be used wisely.',
        'Food must be hot, fresh and spicy, with mood-based eating patterns.',
        'Speech is fast, anger sudden and blunt when provoked. Hates being disrespected about money.',
        'Values courage; family teaches survival in hard situations. Inherited property is raw and must be developed by the native.',
        'Charity takes the form of land and abhaya (protection, "I will always be with you").',
      ],
    },
    3: {
      house: 3,
      signName: 'Taurus',
      theme: 'Resource-minded mind; food bonding; fierce for family',
      points: [
        'The mind runs on accumulation; good communication and singing, strong chest and beautiful eyes. Parshuram energy: fierce when family or lineage is insulted.',
        'Neighbourhood has wealthy people, shops and warehouses; likes busy commercial areas, possibly a shop below the home.',
        'Younger siblings may be treated like resources (given chores). Throat, vocal cords and thyroid are indicated.',
        'Friendships deepen by eating together; separation often starts with changed food habits; conversations revolve around food, and they like complete freedom when ordering.',
        'Keep savings healthy; a zero bank balance drains courage. Avoid being hit verbally about resources.',
        'The father’s habits of hoarding and protecting valuables are echoed in the native’s mindset.',
      ],
    },
    4: {
      house: 4,
      signName: 'Gemini',
      theme: 'Childlike, colourful home; words hurt deeply',
      points: [
        'A deeply emotional house; childhood deprivations hurt deeply, and harsh words damage the heart.',
        'Loves colourful things (pens, chocolates); home décor is playful (fairy lights, name on the wall, cartoons) and benefits from a wall for drawing or art.',
        'Certificates and medals are emotionally significant and proudly displayed.',
        'Home atmosphere cue: images of Krishna and playing Gopals suggest a happy home; images dominated by fierce deities may suggest childhood innocence was lost.',
      ],
    },
    5: {
      house: 5,
      signName: 'Cancer',
      theme: 'Emotional problem-solving; blessed talent; descriptive exams',
      points: [
        'Solves problems emotionally, like a mother. The Moon here is troubled: may have to "cry or beg" before getting what is needed.',
        'Education and talent are naturally blessed, though past-life debts can make studying emotionally hard. Good at Physics, Psychology, History, medicinal science, food engineering and hospitality.',
        'Struggles with rigid objective exams, better at descriptive and long-answer formats.',
        'Stomach and water-retention issues; romance can be traumatic; tends to show bias in giving.',
        'A mother’s emotional state affects studies; supporting the mother’s financial security helps. The father’s habits can affect fortune (9th link).',
        'Malefics in the 5th raise social standing through struggle; benefics bring popularity and support from the masses.',
      ],
    },
    6: {
      house: 6,
      signName: 'Leo',
      theme: 'Government service, father as creditor, prominent rivals',
      points: [
        'Must serve the father; strong government-job inclination (Sun as natural government karaka); loans or support from government sources.',
        'Health themes: fever, high body temperature, dehydration; need regular water and soothing foods (amla, aloe vera).',
        'Enemies are usually prominent people in the field; fights are public and dramatic. Keep public image clean in order to criticise others.',
        'Very persistent in competitive exams. The father relationship can feel transactional, like borrowing.',
      ],
    },
    7: {
      house: 7,
      signName: 'Virgo',
      theme: 'Critical, detail-minded partner; needs explicit statements',
      points: [
        'Partner is critical and fault-finding, complaining about small things without a clear root; may recall past gestures ("remember I fed you").',
        'Relationship needs explicit statements ("I love you") and practical, documented care; partner judges by brands and numbers (cars, house size). Venus is debilitated in Virgo.',
        'Confusion about whom to love; comparisons with past partners. Digestive problems worsen during breakups.',
        'The native listens well but, being Mercury-debilitated, explains their own problems unclearly.',
      ],
    },
    8: {
      house: 8,
      signName: 'Libra',
      theme: 'Unresolved love feelings, relationship insecurity, occult turn',
      points: [
        'Unresolved relationship feelings; insecurity and constant fear the partner is elsewhere.',
        'Two paths from here: children, or occult knowledge. When heartbroken they turn to astrology for answers.',
        'Keeps relationships very private, cries alone at night. May hide eating, avoiding eating in public and feeling embarrassed about certain foods; likes fermented foods.',
        'Insecurity may centre on rivals who are wealthy (3rd) or in stable government jobs (11th).',
      ],
    },
    9: {
      house: 9,
      signName: 'Scorpio',
      theme: 'Incomplete fortune; occult research; astrology aptitude',
      points: [
        'Fortune and higher knowledge come incomplete, only partially; higher-education certificates are delayed.',
        'Pull toward occult practice and research, wanting the root of everything; hidden or hard-to-reach temples (hills, caves) appeal to them.',
        'Receives unexpected blessings from the guru, deities and the universe; can become very skilled astrologers, especially in Nadi, Jaimini and Bhrigu Nandi Nadi systems, and can support others through chronic difficulty.',
        'Father relationship is wounded or unresolved; guru teaching may be harsh and unemotional, pushing the native out of comfort zones.',
        'Strong moral code about debts; remembers what was borrowed.',
      ],
    },
    10: {
      house: 10,
      signName: 'Sagittarius',
      theme: 'Clean, moral profession; teacher, counsellor, astrologer',
      points: [
        'Wants a clean, moral profession without double standards and with independence.',
        'Teaching and learning may come with discipline; religious views tend to be rule-based. Capacity for sacrifice and endurance (nishkama karma).',
        'Whoever guides them professionally rises very high in their own field.',
        'Natural inclination toward teaching, astrology, consulting, counselling and religious service; known for strong moral values.',
        'The father’s finances may be unstable.',
      ],
    },
    11: {
      house: 11,
      signName: 'Capricorn',
      theme: 'Gains through steady, hard work; responsibility kills play',
      points: [
        'Desires are met through hard, consistent, structured work; wants a regular job, can become obsessive about work and unable to stop.',
        'Tenacious once committed. Saturn’s influence suppresses childlike play; avoids holidays and fun for fear of underperforming.',
        'May face insult in friend groups. Older siblings are thick-skinned and stubborn. Business, if started and nurtured, can grow quickly.',
        'The family may press about career instability because of the father’s own history.',
      ],
    },
    12: {
      house: 12,
      signName: 'Aquarius',
      theme: 'Vivid dreams, gadget dependence, love of terraces and technology',
      points: [
        'Vivid, detailed dreams. Struggles with isolation and uses gadgets to stay settled alone; loves terraces and rooftops.',
        'Dream setting: a terrace with water features, soft lights, plants and an attached modern room.',
        'Fascinated by advanced technology, futuristic cities, space travel, private jets and aerospace; and by birds and flight.',
        'Risk of social-media or gadget overuse in the 12th.',
      ],
    },
  },
  exceptions: [],
  readingNotes: [
    'Method (7th-house demand): in any house, you "sit" in the 7th house from it, and that sign shows what is being asked of you. Example: with Capricorn on the 4th, the 10th-house sign shows what the mother expects.',
    'Astrology is to be felt as well as calculated; practise by sitting with each house and sign in turn.',
    'Confirm every point against the actual planets, lords and aspects in the chart; sign-level text is the baseline only.',
  ],
}
