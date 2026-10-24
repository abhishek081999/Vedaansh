// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/libra.ts
//  Libra Ascendant (Tula Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const LIBRA_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 7,
  title: 'Libra Ascendant (Tula Lagna)',
  intro:
    'Libra Lagna carries the archetype of the married woman, the Lakshmi ascendant, who must keep balancing in-laws, natal family, children and spouse. ' +
    'The archetype describes the pattern for every native of this Lagna, not only women. ' +
    'Giving too much or too little to anyone creates problems, so diplomacy and balance are the working method.',
  traits: [
    {
      id: 'balance',
      title: 'Balance as life method',
      points: [
        'Must constantly balance several relationships and responsibilities; cannot be one-sided and must take diplomatic steps.',
        'Venus is the Lagna lord, so relationships, aesthetics and harmony set the tone of the whole chart.',
      ],
    },
    {
      id: 'unspoken',
      title: 'Incomplete expression',
      points: [
        'Diplomacy means half the matter is spoken and half is not; much pain stays unspoken, even to an astrologer.',
        'Small hurts are remembered for a long time and resurface in quiet moments, however busy the day.',
      ],
    },
    {
      id: 'order',
      title: 'Cleanliness and order',
      points: [
        'Strong standards of cleanliness and orderliness, especially in the bedroom, linens and personal hygiene (Virgo on the 12th).',
        'Needs a calm, cosy environment to rest and recharge.',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Libra',
      theme: 'Balance, diplomacy and relationships',
      points: [
        'See the general traits: balance between relationships, diplomatic speech, order and cleanliness.',
        'Read where Venus (Lagna lord) is placed first.',
      ],
    },
    2: {
      house: 2,
      signName: 'Scorpio',
      theme: 'Natal-home attachment, hidden money, long memory, unresolved family wounds',
      points: [
        'Scorpio is something you can neither fully leave nor fully hold: constant attachment to the natal family while adjusting to the spouse’s family (Taurus goes to the 8th).',
        'Tendency to gossip and to hide things, including money kept in secret places; wealth often arrives as inheritance.',
        'The Moon is exalted in Taurus but debilitated in Scorpio: strong attachment to home can make settling into married life hard. No planet is exalted in Scorpio, so the link to family never fully breaks.',
        'Longing to talk to parents quietly through the day; those with living parents may undervalue them, those separated from them long for them.',
        'Old insults and grudges are remembered for years; touching old family wounds causes intense pain; half-truths and held trauma.',
        'Advice: spend money regularly instead of hoarding, since delayed spending (for example travel) can later turn into regret.',
      ],
    },
    3: {
      house: 3,
      signName: 'Sagittarius',
      theme: 'Devotion, rituals, philosophy, one-pointed focus',
      points: [
        'One-pointed devotion and fidelity of mind (pativrata ideal); folk rituals such as Karva Chauth and Bhai Dooj belong here.',
        'Likes philosophical reading that calms the mind, and sharing quotes or pages from books online. Follows religious instructions literally.',
        'Writing: large handwriting, long messages or diary entries, capital letters for emphasis. Prefers studying one subject at a time.',
        'Hobbies: travel, especially pilgrimage and temple visits; wishes and vows for exams or presentations; devotion to younger siblings’ wellbeing.',
        'Prefers big, trusted brands for devices (reliability, service, resale value).',
        'Neighbourhood: a wise elderly neighbour, a priest or temple nearby, schools, gardens with fruit trees. Navratri is a favourite festival.',
      ],
    },
    4: {
      house: 4,
      signName: 'Capricorn',
      theme: 'Heavy domestic duty, little appreciation, rigid traditions',
      points: [
        'Carries most household work, often without recognition; may feel like a servant in their own home.',
        'The mother is hardworking, enduring and traditional, resistant to change; old-fashioned attitudes and gender bias at home.',
        'The heart holds emotional memory: nothing is forgotten. The Moon-Saturn combination (Vish yoga) can bring low mood, especially under in-law criticism.',
        'Hard to change homes despite poor maintenance (leaks, dampness, drainage); hoards old items; the house gets cluttered without help.',
      ],
    },
    5: {
      house: 5,
      signName: 'Aquarius',
      theme: 'Obsessive study, innovation, egalitarian, rebellious toward authority',
      points: [
        'Strong academically when committed, studying obsessively with a Rahu-style intensity; good at visualisation and memorising patterns (for example chemistry).',
        'Interest in philosophy, psychology, entrepreneurship and discovery-oriented projects.',
        'Natural group organisers who often do most of the work in group projects; treats everyone with equal respect; postpones deadlines when unprepared.',
        'In romance expects attention and gestures; knows how to fulfil their own desires, such as changing job or city.',
        'Can be highly rebellious toward managers and fight fiercely when provoked.',
      ],
    },
    6: {
      house: 6,
      signName: 'Pisces',
      theme: 'Forgive-and-forget burden, anxiety spending, charity, need for rest',
      points: [
        'Expected to forgive and forget as "fate", yet small hurts resurface at rest; sleep struggles from overthinking.',
        'Work can feel like heaven compared with a conflict-ridden home.',
        'Spends on medical tests and legal matters out of anxiety; very charitable, even clearing others’ debts at personal cost.',
        'Spouse’s financial setbacks may be repeatedly absorbed by the native.',
        'Works better at night in quiet; needs rest, and a short nap greatly improves productivity.',
      ],
    },
    7: {
      house: 7,
      signName: 'Aries',
      theme: 'Energetic, protective partnership; dynamic partner',
      points: [
        'Aries gives drive and initiative in partnerships, and a strongly protective attitude toward the partner.',
        'Attracted to mature, masculine, athletic, entrepreneurial and action-oriented partners who are busy and building something.',
        'Likes a well-groomed look: good hygiene, pleasant fragrance, fitted clothes; dislikes an unkempt look.',
      ],
    },
    8: {
      house: 8,
      signName: 'Taurus',
      theme: 'Savings, frugality and in-laws’ resources',
      points: [
        'The married woman’s duty to save and keep funds aside for emergencies, sometimes not fully disclosed; bank accounts, FDs and liquid funds.',
        'Frugal and resourceful (reuses leftovers).',
        'Food: rice-based and fermented dishes, liquid dishes such as soups and broths, herbal and root drinks (ginger tea, ayurvedic drinks).',
        'Accumulated or inherited wealth from the spouse’s side.',
      ],
    },
    9: {
      house: 9,
      signName: 'Gemini',
      theme: 'Calculative father; his decisions affect married life',
      points: [
        'Frequent arguments with the father, who is often detail-oriented, calculative, nitpicking and sometimes self-serving.',
        'The father’s decisions, for example on marriage matches, can negatively affect married life; he may give in to others’ pressure.',
        'He may not fully value the mother, but in serious situations the mother’s steadiness (Capricorn on the 4th) prevails.',
        'Both the native’s father and father-in-law can influence the quality of married life.',
      ],
    },
    10: {
      house: 10,
      signName: 'Cancer',
      theme: 'Nurturing workplace; caregiving and mass-oriented work',
      points: [
        'Needs a comforting, nurturing workplace with greenery, water, privacy, clean spaces and calm sounds such as instrumental music.',
        'Frequent calls with the mother from work. Prefers caregiving or mass-oriented work.',
        'Needs 15-20 minutes to settle before tasks; not suited to aggressive fieldwork or sales.',
        'Emotional drama from the mother-in-law can affect work, particularly in an in-laws’ business.',
      ],
    },
    11: {
      house: 11,
      signName: 'Leo',
      theme: 'Desire for status, successful spouse, children',
      points: [
        'Strong desire for status and a position of authority (eventually the family matriarch).',
        'Expects a highly successful spouse who provides luxury and lifestyle.',
        'Strong wish for children and continuation of lineage, especially to meet family expectations; desire for higher knowledge.',
        'Friends tend to be elite, wealthy and high-status, especially with good Mercury or Rahu in the 11th.',
      ],
    },
    12: {
      house: 12,
      signName: 'Virgo',
      theme: 'Cleanliness obsession, alone-time, hygiene standards',
      points: [
        'Strong cleanliness standards for bedroom and bedsheets (clean, preferably white), with frequent washing; arguments with partners may arise just before sleep over this.',
        'Judges hygiene, especially feet; wears socks and uses heel-care products; deep cleans on weekends.',
        'Fastidious about dental hygiene and tries many brands.',
        'Needs alone time to reset and organise life.',
      ],
    },
  },
  exceptions: [],
  readingNotes: [
    'Core pattern: balance of relationships, unspoken pain tied to the natal home (2nd), heavy domestic duty (4th), and a calculative father influencing marriage (9th).',
    'Venus is the Lagna lord; check its placement, strength and dasha first.',
    'Confirm every point against the actual planets, lords and aspects in the chart; sign-level text is the baseline only.',
  ],
}
