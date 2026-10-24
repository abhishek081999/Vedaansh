// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/aries.ts
//  Aries Ascendant (Mesh Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const ARIES_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 1,
  title: 'Aries Ascendant (Mesh Lagna)',
  intro:
    'Aries Lagna sits at the start of Kala Purusha, so its house and sign themes line up directly with the natural zodiac order. ' +
    'It is a logical sign but not a stable one: readings depend heavily on planetary placements, and the pattern shifts with time, place and circumstance.',
  traits: [
    {
      id: 'no-preparation',
      title: 'Starts without preparation',
      points: [
        'Begins things with no groundwork or backup plan — "we will figure it out as we go".',
        'Asked "can you start?" the answer is "yes, let us start tomorrow"; no profit/loss planning first.',
        'Can start from any situation; no particular starting point is required.',
      ],
    },
    {
      id: 'potential-consistency',
      title: 'High potential, low consistency',
      points: [
        'Very high energy and potential, but consistency is the weak point.',
        'With strong Mars they may juggle several jobs or activities at once.',
      ],
    },
    {
      id: 'mindset',
      title: 'Horse-with-blinders mindset',
      points: [
        'Focused on moving forward; they do not think much before acting (Aries energy is on the Lagna).',
        'Saturn qualities are weak here: patience, tolerance of pressure, avoiding change, traditional discipline.',
        'Sun qualities are strong: stability, leadership, getting many people to work under them.',
      ],
    },
    {
      id: 'management',
      title: 'Management and leadership',
      points: [
        'Often found in managerial roles: sales, logistics, supervising factory or large workforces.',
        'Mars gives the "danda" (authority) to make people work and to reward or punish — a true owner/master feeling.',
        'Mars-type pressure manages workers well where Jupiter-type softness is taken advantage of.',
      ],
    },
    {
      id: 'survival',
      title: 'Survival instinct and self-belief',
      points: [
        'Aries is the sign of survival: extreme self-confidence and hope.',
        'Can be dropped or transferred into harsh circumstances and still settle down and perform.',
      ],
    },
    {
      id: 'fierce-energies',
      title: 'Three fierce energies on the Lagna',
      points: [
        'Narasimha energy: completing a task very fast.',
        'Hanuman energy: fierce intensity and speed in execution.',
        'Mangala energy (Yogini dasha concept): more conflict and force oriented.',
        'Good for entering competitive markets, breaking monopolies and setting up where others will not allow entry; Mars stubbornness goes exactly where told not to.',
      ],
    },
    {
      id: 'body',
      title: 'Physical character',
      points: [
        'Kshatriya spirit: regular cuts, wounds and injuries are common.',
        'Strong, muscular build; usually not very tall.',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Aries',
      theme: 'Impulsive action, no preparation, managerial ability',
      points: [
        'See the general characteristics: acts first, leads naturally, strong survival drive.',
        'Mars is the Lagna lord, so read where Mars is actually placed before applying any of this.',
      ],
    },
    2: {
      house: 2,
      signName: 'Taurus',
      theme: 'Direct speech, family as a resource, tit-for-tat',
      points: [
        'Speaks about money and family directly, with no beating around the bush; never speaks in a calculated, measured way.',
        'Sign and house energies sync (Taurus is the natural 2nd), so communication is clear.',
        'If family hurts them they respond directly ("tit for tat") — no displacement of emotion onto others.',
        'Treats family as a resource: gives value in proportion, with a return-on-investment view of who helps them.',
        'Anyone who listens to them, and whom they listen to, becomes deeply close.',
        'Money and resources are put to work on the initiatives they take; usually few backup options.',
        'Family can be good or bad — do not predict with bias; check Venus and the planets in the 2nd.',
      ],
    },
    3: {
      house: 3,
      signName: 'Gemini',
      theme: 'Poor listening, authoritative over siblings, uses them like accountants',
      points: [
        'Gemini does not listen well: many planets here mean needing repetition; absorbs only what is relevant.',
        'Mars and Mercury do not get along, so bonding with siblings is often not smooth.',
        'Authoritative toward siblings: gets work done, then rewards (a transactional, Mercury-style bond).',
        'Typical tasks for younger siblings: paperwork, bank errands, NOC or licence work, accounts and reconciliation.',
        'Irritated by detailed accounting themselves, so prefers hiring accountants.',
      ],
    },
    4: {
      house: 4,
      signName: 'Cancer',
      theme: 'Dramatic mother relationship, land and property focus',
      points: [
        'Unconditional love for the mother, yet she is also the person who irritates them most (Cancer weakens Aries logic).',
        'Domestic and emotional matters are less understood; in family fights they tend to stay away to avoid escalation.',
        'Mars in Cancer: anger comes fast and also settles fast.',
        'A well-placed Jupiter in the 4th improves the home situation and brings authority at home.',
        'Mars wants to control land: farmland, trees, knowing how many bigha they hold.',
      ],
    },
    5: {
      house: 5,
      signName: 'Leo',
      theme: 'Direct dealing with authority, values stable and government jobs',
      points: [
        'Goes straight to the person in charge and treats intermediaries dismissively; in school they want the Principal, not the teachers.',
        'Respects people with government jobs, stable income, authority and less workload; does not value someone who only labours without delegating.',
        'Mars on the Lagna is raw energy that understands power; not afraid of legal threats and only respects those with backing.',
      ],
    },
    6: {
      house: 6,
      signName: 'Virgo',
      theme: 'Skin issues, friction over small repetitive work',
      points: [
        'Most common health themes: skin problems, burning sensation, pimples, cuts and injuries.',
        'Dislikes small continuous repetitive work in subordinates; wants multitasking.',
        'Conflicts with Virgo style: Virgo wants clear instructions, rules and equal distribution, while Aries wants results fast with minimal instruction.',
        'Younger siblings may be seen as slow, and mocked for asking too many questions.',
      ],
    },
    7: {
      house: 7,
      signName: 'Libra',
      theme: 'Strong 1-7 attraction, business focus, high-volume trade',
      points: [
        'Strong attraction on the 1-7 axis and high drive in relationships; traditionally linked with many children.',
        'Venus in the 7th gives a strong business focus; works day and night and the business grows fast.',
        'Prefers daily-sales, high-volume, direct-customer businesses: staples (rice, flour, dal), FMCG, food stalls, restaurants with regular footfall, dairy, snacks.',
        'Does not suit premium, low-volume high-margin businesses; needs volume, manpower and land.',
      ],
    },
    8: {
      house: 8,
      signName: 'Scorpio',
      theme: 'Information gathering, strategic (Saam-Daam-Dand-Bhed)',
      points: [
        'Mars uses Scorpio like a spy for the backend work it cannot do openly.',
        'Gathers information through emotional pressure or guilt ("we tell you everything, you hide things").',
        'Uses all four strategies — conciliation, gift, punishment and division — and keeps information until the right moment to act.',
        'Cold, very clear energy behind the fiery front.',
      ],
    },
    9: {
      house: 9,
      signName: 'Sagittarius',
      theme: 'Shiva devotion, active service over meditation',
      points: [
        'Usually a devotee of Lord Shiva with a simple worship style (offering water to the Shivling), not elaborate rituals.',
        'Prefers active religious service — tents, sound systems, organising bhandara and wedding events — over sitting japa or meditation.',
        'Restless; always needs activity, travel and people.',
      ],
    },
    10: {
      house: 10,
      signName: 'Capricorn',
      theme: 'Extremely hard work, property and construction',
      points: [
        'Capable of very hard, sustained work; pushes through difficult work situations.',
        'Prefers not to work under others and expects fair compensation.',
        'Moon-Saturn 4-10 axis: family lineage often involves real estate; construction work (bricks, sand, cement) comes naturally and house-building is a strength.',
      ],
    },
    11: {
      house: 11,
      signName: 'Aquarius',
      theme: 'Powerful, sometimes dangerous social circle',
      points: [
        'Handles cunning or dangerous people comfortably; the circle can include flashy, unclear-income friends.',
        'Social circle gradually expands upward toward powerful, well-connected people with standing.',
        'Knows how to get paperwork done through authorities and handle tough situations ordinary people avoid.',
        'The network can have a tough or aggressive edge, including weapon-related connections.',
      ],
    },
    12: {
      house: 12,
      signName: 'Pisces',
      theme: 'Late-life spiritual awakening, pilgrimage',
      points: [
        'Around age 35-40 they become more spiritually inclined.',
        'Regular pilgrimage visits (Kashi, Prayagraj, Ganga bank) and traditional devotional practice develop later in life.',
        'Classic elder-style devotion: ritual bath, then offering water to the Shivling.',
      ],
    },
  },
  exceptions: [
    'For Aries Lagna, the 9th lord (Jupiter) and 10th lord (Saturn) together in the 10th house should not be treated as a Raja Yoga; the usual 9th-10th rule has a specific exception here. The effect that remains is a very hardworking, restless nature.',
  ],
  readingNotes: [
    'Aries Lagna fluctuates a lot, so planet placements carry a high share of the result.',
    'Example: Venus (7th lord of partnership) placed in the 1st can make the person easily offended, with a partner who has a controlling influence on their life.',
    'Mars in the 3rd or 4th points to fast, aggressive decision-making and quick likes and dislikes; Saturn and Ketu in the 5th can disturb exams — still analyse each placement before giving generic predictions.',
    'Keep practising: take 10-13 Aries Lagna charts and read each house for 15-20 minutes from the Rashi chart.',
  ],
}
