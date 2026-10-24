// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/aquarius.ts
//  Aquarius Ascendant (Kumbh Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const AQUARIUS_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 11,
  title: 'Aquarius Ascendant (Kumbh Lagna)',
  intro:
    'Aquarius Lagna is tied to the ancestral realm (Pitru Loka) through Rahu, the karaka of ancestors, and is traditionally called the ascendant of natural astrologers because Scorpio, the occult sign, falls on the 10th. ' +
    'It is often born of parents’ intense prayers to ancestors and Hanuman. The central themes are obsession, backdoor routes, ancestral charity and a spiritual duality.',
  traits: [
    {
      id: 'rahu',
      title: 'Rahu-flavoured personality',
      points: [
        'Obsessive dedication: works very hard for the father (9th), wants what they want at any cost, and keeps consulting several astrologers because one question leads to another.',
        'Tends to reach goals by indirect or behind-the-scenes routes.',
        'Craving energy linked to a past-life lack of water at death, creating a karmic debt around charity and donation.',
      ],
    },
    {
      id: 'ancestors',
      title: 'Ancestral link',
      points: [
        'The biggest pending karma is charity for ancestors, family and clan.',
        'Regular donation in ancestors’ names, feeding people at the home dining table, and Amavasya observances help channel this.',
      ],
    },
    {
      id: 'duality',
      title: 'Liberation or bondage',
      points: [
        'Life often tends toward Capricorn-style bondage to duty and unfulfilled desire, or Pisces-style spiritual release; choices after about age 30 shape which direction dominates.',
        'Strong attachment to children and desires can bind; detachment and charity free.',
        'Sudden flashes of insight in sleep appear when the 5th and 12th are strong.',
      ],
    },
    {
      id: 'worship-myth',
      title: 'On worshipping the Sun and Rama',
      points: [
        'The common claim that Aquarius Lagna should not worship Rama or offer water to the Sun is called a myth: the Sun is the 7th lord, and many avoid "becoming" their 7th-house energy at first.',
        'Chanting Sun mantras and Rama devotion strengthen the Lagna and bring position and authority; natives often avoid temples early, then become devoted, often to Rama, after life’s shocks.',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Aquarius',
      theme: 'Ancestral origin, obsession, astrologer’s chart',
      points: [
        'See the general traits: Rahu-flavoured obsession, backdoor approach, ancestral karma.',
        'Saturn is the Lagna lord (with Rahu as co-ruler), so read Saturn’s placement first.',
      ],
    },
    2: {
      house: 2,
      signName: 'Pisces',
      theme: 'Charity for ancestors and family; family ties versus liberation',
      points: [
        'Pisces links the 2nd strongly to dana: the biggest pending karma is charity for ancestors, family and clan.',
        'Sacrificing family ties may be required for liberation (moksha). Remedy: regular charity in ancestors’ names.',
        'Jupiter rules the 2nd and 11th; read its placement for family and gains.',
      ],
    },
    3: {
      house: 3,
      signName: 'Aries',
      theme: 'Mars energy: army, government, undeveloped land',
      points: [
        'Explains strength in army, government service, transport, communication and diplomacy.',
        'Mars is the most important planet not to afflict.',
        'Property: buy barren or undeveloped land and develop it themselves.',
        'Prefer areas near army camps, police stations, forests or undeveloped places over posh societies; living in posh societies usually comes from fortune, not nature.',
        'Career grows when younger siblings and neighbours are not growing too much.',
      ],
    },
    4: {
      house: 4,
      signName: 'Taurus',
      theme: 'Bulk buying, storage, rental income, mother’s blessings',
      points: [
        'Buys in bulk (bedsheets, groceries, household items); a nurturing nature, also seen in the father.',
        'Rental property and income are strong indicators; storing items at home increases wealth.',
        'Mother’s blessings are crucial, and her health tends to decline as life progresses; she keeps the family in touch.',
      ],
    },
    5: {
      house: 5,
      signName: 'Gemini',
      theme: 'Selfish-turning children; pending karma with children',
      points: [
        'Mercury energy: children may become more self-centred over time despite parents’ efforts, and their married life can suffer.',
        'Pending karma with children: they may take large loans that burden the parents, depleting savings (link to the 8th, Virgo).',
      ],
    },
    6: {
      house: 6,
      signName: 'Cancer',
      theme: 'Mother is the sensitive point',
      points: [
        'The most sensitive affliction relates to the mother: avoid conflict with her, as health issues rise after such conflicts.',
        'Heartbreaks hit harder because of this Cancer energy.',
      ],
    },
    7: {
      house: 7,
      signName: 'Leo',
      theme: 'Biggest marriage strain: ego and authority',
      points: [
        'The Sun, 7th lord, is in its own sign here. The biggest trouble in married life and ancestral karma sits here.',
        'As wealth, authority and status rise, married life can feel hollow, with ego issues and a tendency to dominate the spouse.',
        'The person who shines outwardly often lacks real power; power rests with the one in the background. A 7th lord between the Moon and Mercury suggests in-law interference, especially sisters-in-law.',
        'Rama mala for the spouse and Sun mantras for the native are the remedies suggested.',
      ],
    },
    8: {
      house: 8,
      signName: 'Virgo',
      theme: 'Long problems and sudden gains; avoid lending and borrowing',
      points: [
        'Long-running problems alongside sudden gains: wealth often comes after court cases, fighting through illness or after a death.',
        'Surgeons and doctors from this Lagna earn well; medical consultations and tests are profitable areas.',
        'Avoid lending and borrowing, since Virgo on the 8th creates prolonged financial entanglements.',
      ],
    },
    9: {
      house: 9,
      signName: 'Libra',
      theme: 'Well-wishing father; Lakshmi devotion',
      points: [
        'The father is generally a well-wisher.',
        'Natives are often devotees of Lakshmi (and Balaji for South Indian consultees); more devotion brings more luck.',
        'Libra on the 9th and Sagittarius on the 11th can push them toward expensive, heavy remedies, so beware of advisers who exploit this.',
      ],
    },
    10: {
      house: 10,
      signName: 'Scorpio',
      theme: 'Occult and astrology aptitude; hard-to-satisfy career',
      points: [
        'Natural pull toward the occult and astrology; often self-taught through their own charts.',
        'Career can feel never fully satisfying (Scorpio on the 10th, Saturn in the 12th).',
        'Best paths: government jobs, foreign postings, authoritative roles (army, police, officers). Avoid business, which tends to be unstable.',
      ],
    },
    11: {
      house: 11,
      signName: 'Sagittarius',
      theme: 'Obsessive desires; Jupiter-led gains',
      points: [
        'Jupiter’s sign on the 11th shows obsession around desires and gains.',
        'Long-term investing is more profitable than day trading; day trading works only with small amounts. Forex can work; third-party service companies and platforms are good investment themes.',
        'A Sun-Saturn-Mercury combination here can cause over-analysis and fault-finding in relationships; develop a Jupiter-style big-picture view.',
      ],
    },
    12: {
      house: 12,
      signName: 'Capricorn',
      theme: 'Avoids sustained labour; changes activity often',
      points: [
        'Despite Capricorn’s nature, natives tend to avoid sustained hard work and change activities every few hours.',
        'Escapism or avoidance of long labour; Saturn here also weighs on career.',
        'Later-life pattern: after the middle years, bondage to duty or spiritual release becomes the question.',
      ],
    },
  },
  exceptions: [],
  readingNotes: [
    'Remedies emphasised: regular ancestor charity, feeding people at home, bhandara, Sun mantras and Rama devotion, Devi worship (Balaji or Shaktipeeth), and avoiding loans and lending. Offering a red garland and coconut at a Devi temple is suggested for stagnation.',
    'Colour cues in this reading: blue stabilising, yellow for sattvic purity, red for new opportunities, grey natural; green is cautioned.',
    'Gemstone suggestions in the source are chart-specific and sometimes risky; get individual advice rather than applying them generically.',
    'Confirm every point against the actual planets, lords and aspects in the chart; sign-level text is the baseline only.',
  ],
}
