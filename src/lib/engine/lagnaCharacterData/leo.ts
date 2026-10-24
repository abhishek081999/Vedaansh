// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/leo.ts
//  Leo Ascendant (Simha Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const LEO_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 5,
  title: 'Leo Ascendant (Simha Lagna)',
  intro:
    'Leo Lagna is the Solar-dynasty (Suryavanshi) ascendant and carries the king archetype: leadership, stewardship and a strong need for self-respect. ' +
    'Success depends heavily on Jupiter’s blessing and good guru guidance.',
  traits: [
    {
      id: 'king-archetype',
      title: 'The king archetype',
      points: [
        'Lion-like instinct to mark territory, manage and control the environment, and manage many people.',
        'Strong desire for recognition and fame; confident and strong; a royal duty to keep things running smoothly.',
        'Not inherently aggressive: protective of personal space and hierarchy.',
      ],
    },
    {
      id: 'diplomat',
      title: 'Diplomat and peacemaker',
      points: [
        'Natural mediators who take an authority position to reconcile parties (Libra, the diplomacy sign, falls on the 3rd of communication).',
        'May get involved as a third-party mediator in others’ love lives and draw criticism for meddling.',
      ],
    },
    {
      id: 'self-respect',
      title: 'Self-respect above all',
      points: [
        'Like a king guarding his throne, extremely sensitive about reputation, with constant concern about what people will say.',
        'The Sun’s quality is sacrifice, but image concerns often stop them from voicing their own needs; they can be cheated in partnerships because they cannot "downgrade" their self-image.',
      ],
    },
    {
      id: 'common-problems',
      title: 'Common life problems',
      points: [
        'Land and property conflicts; family conflicts (the Moon’s sign Cancer is the 12th).',
        'Kings and queens have bonds rather than ordinary marriages; prone to affairs or live-in arrangements, and cannot tolerate isolation.',
      ],
    },
    {
      id: 'cook',
      title: 'Cooking and feeding',
      points: [
        'Many are excellent cooks: Taurus (food) on the 10th plus the Moon (karaka of food) in the 12th; they love feeding people.',
      ],
    },
    {
      id: 'avoid',
      title: 'Energy to avoid',
      points: [
        'Strongly Saturnine people (thin, overthinking, Vata-natured) tend to drain Leo Lagna’s energy.',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Leo',
      theme: 'King archetype: control, recognition, self-respect',
      points: [
        'See the general traits: territory, management, diplomacy, self-respect, bond-type marriage.',
        'The Sun is the Lagna lord, so read where the Sun is placed first.',
      ],
    },
    2: {
      house: 2,
      signName: 'Virgo',
      theme: 'Slow wealth growth, rental and interest income, critical speech',
      points: [
        'Virgo means conflict, disease and correction; Mercury’s energy here is karmic. Extramarital affairs in the family can cause major problems.',
        'Wealth accumulates gradually: rental income, interest on lending, asset-based income and regular SIP or mutual-fund investing. A 6th-house sign on the 2nd gives a tax-collector type combination; income through bribes is possible, so use caution.',
        'If the Moon is in the 2nd, worries about home, money and emotions.',
        'Speech: documented-SOP style, rules and regulations, diplomatic and practical, with "he should not have done this" fault-finding and unsolicited corrections.',
        'Warning: gossip and backbiting damage reputation and corrupt planetary influences.',
      ],
    },
    3: {
      house: 3,
      signName: 'Libra',
      theme: 'Diplomatic, indecisive communication; selfish friends',
      points: [
        'Diplomatic speech with no clear yes or no; a tendency to switch sides, which is awkward for a king who must balance everyone.',
        'Saturn is exalted in Libra: slow decisions and plans that take long to materialise. Learn to decide faster and more clearly on important matters.',
        'Inability to take sides costs good friendships and attracts selfish friends; Aries, Leo, Sagittarius and Taurus types get irritated, while opportunistic Gemini types stay close.',
        'Good for parties and socialising, hard in conflicts that need a side.',
      ],
    },
    4: {
      house: 4,
      signName: 'Scorpio',
      theme: 'Land and home problems; strong, spiritual mother',
      points: [
        'Hard-to-solve problems about land and home; the mother may have recurring health issues.',
        'The mother is spiritually inclined (sadhana), with shiny skin and a bold personality; she is more responsible than the father, effectively plays the father’s role, and saves money for crises.',
        'Karmic debt to the mother: when earning begins, give back to her first.',
      ],
    },
    5: {
      house: 5,
      signName: 'Sagittarius',
      theme: 'Vision, moral guidance, guru; Jupiter must not be afflicted',
      points: [
        '"A king is as great as his vision": big-picture thinking, moral guidance for society, long-term strategy, social prestige and focused long-term goals.',
        'Jupiter must never be afflicted for Leo Lagna. A guru’s curse can destroy accumulated past merit; never disrespect the guru (Rama and Vashishta, Krishna and Sandipani).',
        'Visit temples regularly, serve the guru, and keep good advisors and mentors (9th-house link).',
        'Large, shining forehead and glowing skin; strong brahmacharya if the Sun is well placed in its nakshatras.',
        '5th-8th link: interest in astrology and occult sciences, with healing and diagnostic ability (the Sun is karaka of health).',
        'Perform Agnihotra or fire rituals regularly; a stronger fire connection brings better recognition.',
      ],
    },
    6: {
      house: 6,
      signName: 'Capricorn',
      theme: 'Manager chart: workers, servants, competitive jobs',
      points: [
        'Saturn governs labourers, so this is a manager-type chart managing many poor or daily-wage workers; household help is likely.',
        'Measure the chart’s strength by how many people work under them, how they treat servants and subordinates, and how loyal and content those workers are.',
        'Workers may be rude to the world but controllable only by this person; loyal followers are likely.',
        'Saturn-linked health: Vata problems from overthinking. Heavy workload and demanding jobs in competitive environments, wherever office politics is strongest.',
      ],
    },
    7: {
      house: 7,
      signName: 'Aquarius',
      theme: 'Rahu obsession in relationships; partnerships and betrayal lessons',
      points: [
        'Rahu energy brings obsession, a "want it now" attitude and weak control, even though Venus is the natural partnership karaka.',
        'High physical expectations, many admirers and extramarital tendencies; the spouse tends to be dominating. Rahu cares only about end results, so over-following rules with the spouse leads to being dominated.',
        'Should go into partnerships: a king succeeds through partnerships (supported by Libra on the 3rd). Good partnership profit means the 7th is working; constant betrayal means Rahu outweighs the Lagna lord, so strengthen the Lagna.',
        'Early partnerships or relationships (about age 22-23) help burn out obsession and teach who the traitors are, so later life stabilises.',
        'Do not fully trust where Rahu sits; betrayal or infidelity can come from both sides.',
      ],
    },
    8: {
      house: 8,
      signName: 'Pisces',
      theme: 'Hidden matters, charity as remedy, never owe an astrologer',
      points: [
        'Hidden matters, research and sudden losses. When stuck in unsolvable problems, start donating, especially in astrology-related causes.',
        'Never keep dues owed to astrologers or spiritual guides; unpaid dues can damage 9th-house fortune.',
        'Under-the-table expenses are common, which explains success in high positions such as politics. Long-term illness is possible from the 8th.',
        'Mental instability link (Cancer is the 12th from the 8th). For sleeplessness, inability to let go or depression, charity is not happening properly. Remedy: regular donation, and while bathing pray for forgiveness and peaceful sleep.',
      ],
    },
    9: {
      house: 9,
      signName: 'Aries',
      theme: 'Initiative and big goals made too quickly; Hanuman sadhana',
      points: [
        'Initiative energy for starting new work; kings traditionally build temples and schools. Worship Hanuman regularly.',
        'Warning: big goals set too hastily (for example IAS or IPS preparation with rushed planning), causing frequent failures. A mentor is needed to plan properly.',
        'Always ready for higher education, research and learning.',
        'Health attention needed for hips, lower backbone and tailbone.',
      ],
    },
    10: {
      house: 10,
      signName: 'Taurus',
      theme: 'Stewardship of resources; wealth through investment and travel',
      points: [
        'Critical house for Leo Lagna: how resources are used, how they speak, and food and accumulated wealth.',
        'Royal duty here is stewardship, managing the treasury for good causes.',
        'Money should be made through investment; ask where existing money is being put. Career lifts mainly through travel.',
        'Those failing at government exams: start travelling and investing regularly. Working professionals: check where salary goes (SIP, mutual funds, real estate).',
        'Taurus on the 10th shows ancestors of good status who did good karma.',
      ],
    },
    11: {
      house: 11,
      signName: 'Gemini',
      theme: 'Arts, music, shows and gadgets',
      points: [
        'Royal-court entertainment: singers, dancers and poetry; many Leo Lagnas sing well (Venus’s Libra on the 3rd).',
        'Love of shows and concerts, travel, and being a devoted fan of talented artists.',
        'Earphones and headphones are favourites but break often; first major purchases when earning are electronics, especially mobile phones.',
      ],
    },
    12: {
      house: 12,
      signName: 'Cancer',
      theme: 'Spending, mother first, feeding the public, guru needed',
      points: [
        'Expenditure house with the mother’s sign: give the first salary priority to the mother, otherwise emotional distress follows.',
        'Cancer also means land investment and food: organise community feeding (bhandara); feeding the public regularly gives the best results.',
        'When emotional support is needed it often does not arrive; they feel alone and friends turn out selfish.',
        'Jupiter is exalted in Cancer: with a good guru comes regular charity, living like a true king with responsibility and generosity, and stability follows.',
      ],
    },
  },
  exceptions: [],
  readingNotes: [
    'Key remedies: respect and serve the guru; regular charity (especially for 8th-house issues); never leave astrologer dues unpaid; serve the mother first when earning begins; avoid gossip and backbiting.',
    'Also: enter partnerships early; travel and invest systematically; feed people regularly; perform Agnihotra; worship Hanuman; avoid people with excessive Saturn energy; avoid permanent enemies; decide important matters carefully, not hastily.',
    'Confirm every point against the actual planets, lords and aspects in the chart; sign-level text is the baseline only.',
  ],
}
