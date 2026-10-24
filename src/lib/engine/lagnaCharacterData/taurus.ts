// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/taurus.ts
//  Taurus Ascendant (Vrishabha Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const TAURUS_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 2,
  title: 'Taurus Ascendant (Vrishabha Lagna)',
  intro:
    'Taurus on the Lagna makes life revolve around resources, family, speech and food. ' +
    'The reading is built in layers: the sign in each house, then its natural significations, then the house significations, ' +
    'then deity or mythological correlations, and finally any planets present.',
  traits: [
    {
      id: 'life-pillars',
      title: 'Four pillars that keep a Taurus Lagna alive',
      points: [
        'Resources (gathering and using them), family and ancestry, speech (the weight their words carry) and food (nourishment).',
        'Weaken any of these — cut family ties, silence them, deprive resources or food — and the person suffers most.',
        'Practical cue: ask a Taurus Lagna client whether they are eating properly; it is diagnostic.',
      ],
    },
    {
      id: 'parshuram',
      title: 'Parshuram energy',
      points: [
        'A life of struggle and fights against those who oppose their authority; never try to control their resources or authority.',
        'Parshuram’s father was killed over a refusal to give up the Kamadhenu cow — the resource and authority theme.',
        'Parshuram could not complete his guru dakshina to Lord Shiva, so Taurus Lagnas often carry an unfulfilled Guru Rina (debt to the guru) from the past.',
        'Result: delayed fortune (bhagyodaya). Gurus tend to ask difficult things, and fulfilling them brings fortune.',
      ],
    },
    {
      id: 'nandi',
      title: 'Nandishwar (Nandi)',
      points: [
        'Surrender to one who has nothing materially but holds transcendent power.',
        'Taurus Lagnas should serve and worship Lord Shiva: a minimal talker, quickly pleased (Bholenath), living simply.',
      ],
    },
    {
      id: 'annapurna',
      title: 'Maa Annapurna',
      points: [
        'Represents feeding people; in dharmic activity a major duty is anna daan.',
      ],
    },
    {
      id: 'fighter',
      title: 'Kshatriya spirit',
      points: [
        'They fight for resources, family, father, guru and justice for the wronged.',
        'Nandishwar plus Parshuram energy gives the fighting capability the shastras honour.',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Taurus',
      theme: 'Resources, family, speech and food; Parshuram and Nandi energy',
      points: [
        'See the general traits: the four pillars, Guru Rina and delayed fortune, Kshatriya fighting spirit.',
        'Venus is the Lagna lord, so read where Venus is placed before applying generic text.',
      ],
    },
    2: {
      house: 2,
      signName: 'Gemini',
      theme: 'Talks about family and money; relatives rarely reciprocate',
      points: [
        'Taurus is the natural 2nd, so 2nd-house energy is doubly important.',
        'Relatives rarely help despite the native’s dedication; Gemini is self-serving.',
        'Always talks about ancestors, family resources, land, investments, stocks; finds it hard to listen.',
        'Strong drive to accumulate, with travel and effort needed; needs a good bank balance. May collect gadgets such as phones and earphones.',
        'Each family member presents their own version as the correct one, so family disputes are hard to settle.',
        'Female deities matter: Annapurna, Brahmacharini, Saraswati, Lakshmi, Mahamaya. If the native reports poverty or family instability, traditional teaching asks to check the family history for mistreatment of girl children, with donations to female-linked causes as remedy.',
        'Mercury-Moon dasha with job loss: traditional teaching asks to look for rule-breaking relationships in the family draining finances.',
        'Kul Dharma dosha: Jupiter’s blessing is missing from the household (Sagittarius falls in the 8th); remedy is regular donation to Brahmins.',
        'Fast-food habits (chaat, pakode, golgappe, pizza, pasta) from this Gemini 2nd feed the digestive issues seen in the 6th.',
      ],
    },
    3: {
      house: 3,
      signName: 'Cancer',
      theme: 'Emotional mind, dramatic younger siblings, water and temple surroundings',
      points: [
        'Thinks emotionally and can be psychic; loves and hates intensely, passive-aggressive rather than openly aggressive.',
        'Stubborn, desire-driven mind; things come through emotional desperation ("until you cry, you do not get").',
        'Younger sibling bond is dramatic: intense love and intense emotional fights, with many allegations.',
        'Prefers water destinations (waterfalls, sea, boat rides); travel for emotional fulfilment.',
        'Neighbour friction is emotional and the environment affects them strongly; buy where surroundings evoke trust, ideally a familiar neighbourhood with water features, coconut trees and plants.',
        'Cancer links to Krishna, Shivling and Mata Sati; a Krishna temple nearby is supportive.',
        'Planet cues in Cancer 3rd: Venus - big brands; Saturn - liquor shops; Mars - health drinks; Jupiter - child-deity temples, coconut and mango trees; Ketu - narrow society roads, drains or water bodies, stray dogs, Shiva worship.',
        'Ashlesha (in Cancer) brings secrecy; insult or defeat hurts deeply, they plan carefully and revenge strategically and do not trust easily afterwards.',
      ],
    },
    4: {
      house: 4,
      signName: 'Leo',
      theme: 'Showcase home, ego issues with a strong mother',
      points: [
        'Wants to show resources through the home and invite friends; very sensitive to criticism of the house.',
        'Needs compound walls and boundaries, natural light, and premium societies with security; trouble begins in insecure or non-premium localities.',
        'Mother is giving but strict and strong, manages resources, and becomes the centre of attention.',
        'Main home conflict is ego: the Sun has zero directional strength in the 4th (strong in the 10th).',
        'Karmic debt: the mother was not supported enough in the past life, so despite doing much for her now they still face complaints.',
      ],
    },
    5: {
      house: 5,
      signName: 'Virgo',
      theme: 'Methodical education and work; over-correcting children',
      points: [
        'School: completes homework and follows procedure but teachers may not recognise the effort; learns everything methodically.',
        'Career fits: scientist, doctor, CS, CA or audit, teaching, SOP or manual writing, legal case work, HR procedures, reimbursements, IT support, surgery-related medical work.',
        'Finance fits: stock market analyst and fund manager (data and spreadsheet driven).',
        'Imposes their own method on children, is good at post-mortem analysis but not at unprecedented situations, and over-corrects small mistakes; children turn rebellious. Worse with Saturn in Virgo.',
        'Love life: attracted to younger partners; school-time romance is likely (Mercury plus good communication and resources).',
      ],
    },
    6: {
      house: 6,
      signName: 'Libra',
      theme: 'Partner-friendly workplace, kidney and digestive care, marriage karma',
      points: [
        'Wants collaboration at work: rich, big companies with good infrastructure and ambiance, team outings, polite communication, minimal ego issues and work-life balance.',
        'Libra (marriage) in the 6th (disputes) makes divorce-type issues a risk; the early marriage is tough and improves with time, so pick partners who can adjust gradually.',
        'Venus dasha brings growth but also 6th-house issues; prone to kidney stones, so drink adequate water.',
        'Virgo 5th plus Libra 6th points to stomach and intestinal trouble; avoid raw salads and cook vegetables.',
        'Libra in the 6th suggests pending relationship karma from a past life; the partner may be a past-life enemy returning, and Scorpio on the 7th adds toxicity.',
        'Any planet in the 6th corrects, and Taurus dislikes correction, so conflict follows. The partner may provide money (Venus) while relationship satisfaction stays low.',
      ],
    },
    7: {
      house: 7,
      signName: 'Scorpio',
      theme: 'Deep marriage wounds, spouse conflict with natal family',
      points: [
        'Scorpio gives wounds that take very long to heal; the marriage can turn intimacy-poor over time (Mars-Ketu energy).',
        'Spouse typically dislikes the native’s family: Mercury (2nd lord) does not get along with Mars or Ketu, and the family is seen as greedy; fights over money for family are common.',
        'Malefics in the 7th severely affect marriage.',
        'Business partnerships are slow to work and hard to exit on your own terms; clashes do not resolve quickly.',
      ],
    },
    8: {
      house: 8,
      signName: 'Sagittarius',
      theme: 'Hidden moral conflict, secrets, curse needing guidance',
      points: [
        'Moral and intellectual Sagittarius energy is suppressed here, giving an internal moral dilemma that worsens with secret relationships.',
        'Secrets may involve hidden accounts or relationships; a 9th sign in the 8th points to secrets about the legitimacy of marriage.',
        'The 9th relates to family deities, who bless when past karmic debt is cleared.',
        'Jupiter energy in the 8th acts like a curse that needs astrological guidance. When facing unsolvable secret problems, seek an astrologer.',
        'Gemstone remedies (8th) and a guru-given yantra or talisman can start bhagyodaya; Saturn as gemstone karaka sits in the 9th for this Lagna.',
      ],
    },
    9: {
      house: 9,
      signName: 'Capricorn',
      theme: 'Hard-working fortune, harsh managers, temple conduct',
      points: [
        'Managers treat them harshly ("climb over heads"); conflicts come from disrespectful communication.',
        'Father is heavy-handed and very ego-driven, like Daksha.',
        'Too much talking at temples or with gurus; they should serve at temples. Visit ancient temples (1500-2000 years old): Kailash, Jyotirlingas such as Kedarnath and Badrinath, and Shaktipeeths.',
        'Kumari worship at Shaktipeeths such as Kamakhya helps the 3rd and 8th house issues; Jyotirlinga visits help marriage problems and bring humility and fortune.',
        'Saturn demands excessive hard work; karma is dharma for these natives and consistent effort leads to success.',
      ],
    },
    10: {
      house: 10,
      signName: 'Aquarius',
      theme: 'Shortcuts and unconventional income, fraud risk',
      points: [
        'Aquarius means shortcuts and rule-breaking; wants quick money and is uncomfortable with uncertainty. With Virgo in the 5th the stock market becomes an important profile.',
        'Career fits: CA, CS, auditor (fraud-detection ability), fund management, financial analysis, debt management, gaming, YouTube and social media.',
        'High risk of falling for "double money in 10 days" schemes. The father’s family may have financial conflicts.',
      ],
    },
    11: {
      house: 11,
      signName: 'Pisces',
      theme: 'Unpredictable income that flows out to guru, spouse and children',
      points: [
        'Income can come from foreign sources or import-export, in a God-dependent, unpredictable flow.',
        'A donation share is already built into income: set aside 5-10% on receipt for temples, dhams or the guru.',
        'The wife and her children also draw on the native’s income (4-8-12 and 5th-from-7th connections); money flowing out helps resolve the 8th-house Jupiter curse.',
        'Others see them as wealthy even when money is not retained; EMIs get deducted at once.',
      ],
    },
    12: {
      house: 12,
      signName: 'Aries',
      theme: 'Sudden spending, income leaves quickly',
      points: [
        'Aries energy brings sudden, aggressive spending, sudden losses and sudden costly responsibilities.',
        'The 11th (Pisces) brings money and the 12th (Aries) sends it out immediately, so cash does not stay despite good resources.',
        'The 12th is the spouse’s 6th house: the spouse may have blood-related health issues needing expense.',
      ],
    },
  },
  exceptions: [],
  readingNotes: [
    'Core themes: resources central to identity; family as strength and conflict; Guru Rina and delayed fortune; marriage hard at first and improving; strict parenting from Virgo in the 5th; income that flows out to guru, spouse and children.',
    'Remedies emphasised in this reading: temple visits (especially ancient Shiva temples and Jyotirlingas), astrologer guidance for 8th-house issues, gemstone remedies, and donations to Brahmins and female deities.',
    'Confirm every point against the actual planets, lords and aspects in the chart; sign-level text is the baseline only.',
  ],
}
