// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/cancer.ts
//  Cancer Ascendant (Kark Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const CANCER_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 4,
  title: 'Cancer Ascendant (Kark Lagna)',
  intro:
    'Cancer Lagna is called a Rajayoga chart, a royal or queen’s chart. It is emotional and water-natured: home, safety, relaxation and mental stability come first, ' +
    'and family life must not be disturbed. The Moon, lord of the Lagna, rules the masses, so public service and feeding others are natural duties.',
  traits: [
    {
      id: 'emotional-body',
      title: 'Home, mother and emotional body',
      points: [
        'The mother and the home matter enormously; they need a good, peaceful home and should not live in a negative environment.',
        'Domestic violence or emotional disturbance at home severely disturbs the personality; they need someone who emotionally heals them regularly.',
        'Give very few people access to the emotional body: the more access someone has, the more they can affect the personality. Do not invite people into home or life carelessly.',
      ],
    },
    {
      id: 'emotional-decisions',
      title: 'Emotional decision-making',
      points: [
        'Decisions are always emotional. If they like someone or something they can do anything for it; if they dislike someone they can go to unexpected extremes.',
        'Friendship, love and enmity all operate "at the next level": loyal, devoted friends, but equally intense enmity.',
        'The mind is unpredictable: one thing today, a completely different decision tomorrow, with bias they may not notice themselves.',
      ],
    },
    {
      id: 'water-food',
      title: 'Water element and food',
      points: [
        'Life problems often arise through food and water, so be very selective about where and with whom they eat.',
        'Cancer Lagna carries a duty of feeding people and sharing food and water, and of caring for their own body regularly.',
      ],
    },
    {
      id: 'royal-masses',
      title: 'Royal lagna and the masses',
      points: [
        'A high or royal lagna with a strong link to the Moon and the common public; large responsibility for public service.',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Cancer',
      theme: 'Emotional, home-centred, intense in love and enmity',
      points: [
        'See the general traits: peaceful home, protected emotional body, selective eating, emotional decisions.',
        'The Moon is the Lagna lord, so read the Moon’s actual placement first.',
      ],
    },
    2: {
      house: 2,
      signName: 'Leo',
      theme: 'Proud, royal family; authoritative speech; feast-like food taste',
      points: [
        'Leo gives pride in family, speech and food; ego shows in speech, they cannot be insulted and stick to what they say.',
        'Royal or good family background is likely; traditionally Cancer Lagnas were born into royal families.',
        'Food: variety, picky, fond of expensive and luxury restaurants, love trying new things.',
        'Family deities: Rama, Durga, Krishna; ancestors often did religious or social work such as Bhagwat Katha.',
        'The father’s wealth and growth often rise after the native’s birth; with good past merit, significant wealth follows.',
        'Wealth is stored through a chair or position of power (politics, even forming parties), business, entertainment, government stocks; strong at charity and donation, a royal quality.',
        'Maintain the chair or position well; good use of it improves wealth and standing.',
      ],
    },
    3: {
      house: 3,
      signName: 'Virgo',
      theme: 'Paperwork trouble, election-style fighting, sibling quarrels',
      points: [
        'A very karmic house. Documents are the weak spot: land papers, driving licence, certificates, medals. Most forgetful about paperwork.',
        'While travelling, prone to scams, pickpocketing and losing money or a wallet; start things without checking price or documents. Once financially able, hire an accountant or manager for paperwork.',
        'Natural fighters with ego clashes; election contests suit them (ward member, MLA, MP, royal bureaucrats). Virgo’s urge to correct society shows here.',
        'Plant trees and greenery around the home; places with greenery and rainfall such as Rishikesh suit them.',
        'Conflict with younger siblings is near certain: they correct them, joke at them, and the sibling often asks for money.',
      ],
    },
    4: {
      house: 4,
      signName: 'Libra',
      theme: 'Most important house: loving mother, comfort, good location',
      points: [
        'Libra is a luxury sign: the mother is good-natured, a good speaker and feeder, beautiful and deeply loving.',
        'References: Mata Anusuya’s love for the Moon, Mata Yashoda’s love for Krishna. Mother’s debt is significant: give her what she wants and do not refuse her requests.',
        'Eating is emotionally comforting. They need business-class comfort in travel and vehicles.',
        'During the Moon dasha or 4th-house dasha take proper rest and focus on emotional healing.',
        'Home is usually near markets or the main city; better Venus gives better location near malls and trade areas, and good interiors and exteriors.',
        'First major purchases when money comes: a car, house or bike.',
      ],
    },
    5: {
      house: 5,
      signName: 'Scorpio',
      theme: 'Deep first love, improving studies, karmic people',
      points: [
        'Scorpio leaves wounds: first love leaves deep marks and sleepless nights; past relationships are hard to forget.',
        'Education: people assume they do not study, but they improve dramatically over time; they often study at night.',
        'Scorpio brings karmic, past-life people; be careful with toxic ones.',
        'School life is memorable: romances, being "over-smart", ups and downs with teachers, hidden help, parties and night outings.',
        'Friends become like family (11th house Taurus link) with a very close circle.',
      ],
    },
    6: {
      house: 6,
      signName: 'Sagittarius',
      theme: 'Karmic debt to the guru; liver and happiness issues',
      points: [
        'The largest pending karma is with the guru (Jupiter): Sagittarius brings cheaters, deceivers and karmic events, with Jupiter affliction and debt.',
        'Remedies: serve the guru and teachers regularly, donate clothes, visit temples regularly, annadaan and cloth donation. The debt must be repaid or they stay trapped.',
        'Health: liver-related problems and missing happiness; marital happiness suffers when the 6th activates negatively.',
        'Root cause: not listening to the guru’s advice and not following rules or discipline.',
      ],
    },
    7: {
      house: 7,
      signName: 'Capricorn',
      theme: 'Late, demanding partner; marriage improves slowly',
      points: [
        'Complex married life that improves over time; the partner comes late, works very hard and does not change easily.',
        'The spouse often does not listen, judges them (Saturn), does not trust easily, speaks bluntly and expects a lot of work.',
        'They can become submissive to the spouse; respect and compromise keep things smooth.',
        'Over time the partner becomes loyal (Saturn is loyal), makes them rich and the relationship becomes very stable. Overall happy married life for most.',
        'Beneath the strict exterior Capricorn energy is caring; they gradually accept what the spouse or mother serves.',
      ],
    },
    8: {
      house: 8,
      signName: 'Aquarius',
      theme: 'Occult talent, obsession, hidden gains',
      points: [
        'A special blessing: unconventional help and aptitude for astrology and the occult (Rahu influence).',
        'Obsession, anxiety and repetitive behaviour: relationships turn into obsessions, and they can become extremely attached to an astrologer whose predictions they like.',
        'Once they start wearing gemstones they find it hard to stop and may end up wearing all nine.',
        'Aquarius represents smoke; if addicted to smoking it is very hard to quit.',
        'Combination for hidden or buried wealth, luck in lottery and speculative gains.',
      ],
    },
    9: {
      house: 9,
      signName: 'Pisces',
      theme: 'Charitable father, guru service, pilgrimage and holy bathing',
      points: [
        'Strong charitable nature; the father is giving, and temple donations continue however thrifty otherwise.',
        'Always serve the guru, counsellors and advisors; strong in helping in adverse situations.',
        'Plan spiritual trips in free time: Vaishno Devi, Mahakal, Vrindavan, Mathura, Pavapuri, Gaya, Udupi.',
        'Holy river bathing (teerth snan) suits the Cancer water nature; bringing holy water home is beneficial.',
      ],
    },
    10: {
      house: 10,
      signName: 'Aries',
      theme: 'Pioneer and decision-maker; jobs are unstable',
      points: [
        'The most important career house: first movers who do what nobody in the family has done, and who get extra work assigned.',
        'Saturn is debilitated and the Sun exalted in Aries: they make others work under them but struggle in subordinate roles; jobs are high-pressure and unstable, with a constant urge to try something new.',
        'Avoid regular subordinate jobs where possible. Better: a government position of authority, own business (ideally in partnership), or a decision-making role such as manager.',
        'Managerial roles suit them; individual-contributor roles do not.',
      ],
    },
    11: {
      house: 11,
      signName: 'Taurus',
      theme: 'Rich friends, stable income, food business and investing',
      points: [
        'Great, wealthy friend circle; eating out with friends is common and friends become like family.',
        'Stable income and good for building property and finances.',
        'Food and restaurant business is favourable, as are online food platforms; face value brings money (content creators, influencers). Food bloggers often have the Moon in the 11th of the Navamsa.',
        'Good investors, profit-minded, and they like talking about their profits.',
      ],
    },
    12: {
      house: 12,
      signName: 'Gemini',
      theme: 'Lost papers, spending on hobbies, gadgets, travel and learning',
      points: [
        'Documents and papers are the most commonly lost or forgotten items, as in the 3rd.',
        'Spending on earphones and electronics, hobbies, and new foods and things.',
        'Fond of buying toys, colours and gifts for children.',
        'Regular travellers who spend a lot on travel, and on new learning, certifications and exams.',
      ],
    },
  },
  exceptions: [],
  readingNotes: [
    'Mars as lord of the 5th and 10th gives this Lagna its Rajayoga character; check Mars’s placement and strength.',
    'Biggest cautions: letting the wrong people into the emotional body, careless eating, unpaid guru debt (6th), and weak paperwork (3rd, 12th).',
    'Confirm every point against the actual planets, lords and aspects in the chart; sign-level text is the baseline only.',
  ],
}
