// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/capricorn.ts
//  Capricorn Ascendant (Makar Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const CAPRICORN_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 10,
  title: 'Capricorn Ascendant (Makar Lagna)',
  intro:
    'Capricorn Lagna is the sign of delay and hard labour: nothing comes easily, and success often starts at the point where others give up. ' +
    'Mars is exalted and Jupiter debilitated in Capricorn, so the sign rewards persistence rather than ease. ' +
    'Results build slowly and last; the early years are the hardest.',
  traits: [
    {
      id: 'delay',
      title: 'Delay, struggle and slow rise',
      points: [
        'Saturn’s grip brings long delays, emotional suppression and sometimes an older-than-age look.',
        'Career growth is gradual, not exponential: a low-salary struggle for roughly the first ten years, then stability and steady growth.',
        'The "boat" is unstable at first and does well over time. Common fields: jewellery, gemstones, building and family businesses.',
      ],
    },
    {
      id: 'family-pattern',
      title: 'Family background pattern',
      points: [
        'Often a father who criticises over small matters regularly (finding many faults a day) rather than fighting openly.',
        'Small issues with gurus and teachers can also turn into conflict.',
      ],
    },
    {
      id: 'saturn',
      title: 'Saturn as Lagna and 2nd lord',
      points: [
        'Saturn owns the 1st and 2nd, with its Moolatrikona in the 2nd (Aquarius); the main pending karma sits with the Lagna and appears most in profession.',
        'Saturn is exalted in Libra on the 10th: full focus on career helps work but can strain marriage and relationships.',
        'Venus is exalted in Pisces on the 3rd.',
      ],
    },
    {
      id: 'persistence',
      title: 'Persistence and endurance',
      points: [
        'Unlike signs that give up after a few losses, Capricorn does not quit a fight or a cause; this shows most in arguments and long campaigns.',
        'Susceptible to flattery, since Saturn sits on the Lagna; may also prefer heavy, durable things (vehicles, jewellery).',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Capricorn',
      theme: 'Struggle, discipline, delay and hard work',
      points: [
        'Saturn rules; the natural significator of struggle, discipline and hard work. Everything is delayed and nothing is free.',
        'Saturn is the Lagna lord, so read its placement first.',
      ],
    },
    2: {
      house: 2,
      signName: 'Aquarius',
      theme: 'Show of wealth, family debt, tension at home',
      points: [
        'The family shows wealth or status on the surface that does not match reality; unnecessary spending and debts (Rahu).',
        'Someone at home (mother, father or younger sibling) may suffer panic or anger, making the home feel like a battlefield.',
        'Rahu on the 2nd can give an intuitive or "blind-prediction" astrologer type; frequent food-delivery spending, often ordering for the partner too.',
      ],
    },
    3: {
      house: 3,
      signName: 'Pisces',
      theme: 'Missed forms and dates, directionless effort',
      points: [
        'Missed exam dates and unfiled forms; works hard for others while recognition goes elsewhere.',
        'Directionless early on. For competitive exams the first two years go to finding a teacher, procedure and plan; real work starts in the third year.',
        'Younger siblings may cause trouble; women with brothers may face favouritism toward the brother.',
        'Rahu-style attachment and aversion. Venus is exalted here: warm, flattering early-relationship behaviour ("love bombing") can occur.',
      ],
    },
    4: {
      house: 4,
      signName: 'Aries',
      theme: 'Builders; money stuck in property; restless home',
      points: [
        'Many builders have this Lagna: they buy plots nobody else wants and settle new areas first.',
        'Money can get stuck in property or frauds (link to the 2nd). Constant home renovation (bed, curtains, windows) means little peace at home.',
        'Most office work is done from home. Politicians often have a large gathering or dining area at home.',
        'Mother has good financial standing and a controlling presence; the parents clash regularly (Aries head-on versus Virgo fault-finding).',
      ],
    },
    5: {
      house: 5,
      signName: 'Taurus',
      theme: 'Resource-based judgement; large living area; authority conflicts',
      points: [
        'Dining and living halls are large and central (charger, WiFi, TV, food all in the hall).',
        'Quietly judges people by money, lineage, relatives and vehicles.',
        'Family conflicts, especially on the father’s side, happen in the living area and centre on authority.',
      ],
    },
    6: {
      house: 6,
      signName: 'Gemini',
      theme: 'Tireless arguer; stamina in conflict',
      points: [
        'Can argue endlessly; the opponent tires first. Their staying power in conflict is high, so use it for advocacy rather than for prolonged feuds.',
        'The maternal uncle is often misled by misplaced trust (for example FD or investment losses).',
        'Links to the 7th-house Moon-Venus combination, where prolonged conflict can wear a partner down.',
      ],
    },
    7: {
      house: 7,
      signName: 'Cancer',
      theme: 'Emotional, intense partnerships; risk of toxic dynamics',
      points: [
        'Moon with Venus themes: strong emotional pull, with a risk of narcissistic or controlling patterns when respect fails.',
        'Once relationships begin they can come in multiples; if none happen, none happen.',
        'Conflict with a Capricorn Lagna as an enemy tends to be thorough, so maintain diplomatic friendship rather than confrontation.',
      ],
    },
    8: {
      house: 8,
      signName: 'Leo',
      theme: 'Emotionally distant father or authority; egoistic in-laws',
      points: [
        'The father or authority figure may provide materially but remain emotionally unavailable.',
        'In-laws tend to be egoistic and stingy.',
      ],
    },
    9: {
      house: 9,
      signName: 'Virgo',
      theme: 'Wants step-by-step remedies with timelines',
      points: [
        'Wants detailed, practical, step-by-step processes for religion and remedies, with a timeline ("solved in 40 days").',
        'Becomes very loyal when promises are delivered on time and cools if not; give written step-by-step remedies.',
        'Avoid fault-finding with gurus, which creates further problems.',
      ],
    },
    10: {
      house: 10,
      signName: 'Libra',
      theme: 'Group work, cause-driven roles, Saturn exalted',
      points: [
        'Saturn is exalted here, and Venus has its Moolatrikona in Libra: taking many people together, group work and office politics.',
        'Often works in religious institutions or NGOs, sometimes without pay, collecting money or fighting for causes on behalf of others.',
        'Venus on the 10th can create a gap between education and career match (to be read with the chart).',
      ],
    },
    11: {
      house: 11,
      signName: 'Scorpio',
      theme: 'Intense, sometimes toxic friendships and gossip circles',
      points: [
        'Friendships can turn toxic; others feel suppressed, fearing old secrets will be dug up. Social groups may revolve around gossip.',
        'Scorpio does not attack directly; it notes things and uses them later.',
        'Venus here in Scorpio can hide toxicity beneath an attractive surface; partners may not reveal their true qualities openly.',
      ],
    },
    12: {
      house: 12,
      signName: 'Sagittarius',
      theme: 'Absent or battling home life; sleep and intimacy issues',
      points: [
        'The father is often away or the home is a constant battlefield; Sagittarius on the 12th can disturb the bedroom and intimacy, and cause insomnia.',
        'The mother may make temple vows; if they go unfulfilled it can bring losses to the native.',
        'Ideas arrive during sleep (Sagittarius on the 12th); keep a dream or thought journal.',
        'With Mars in the 12th, protect energy with Hanuman Chalisa and avoid red bedding and heavy electronics in the bedroom.',
      ],
    },
  },
  exceptions: [],
  readingNotes: [
    'Remedies emphasised: regular anna daan (food donation) to balance Rahu’s taking energy on the 2nd, Ekadashi fasting for Jupiter’s blessings, avoiding fault-finding with gurus, and giving written step-by-step remedies.',
    'Gold and accumulated wealth are generally favourable, though gifted gold may go missing in some Jupiter sub-periods.',
    'Cause-and-effect tendencies like downfall of those who mistreat a Capricorn Lagna or who borrow from them are traditional folk observations, not rules.',
    'Confirm every point against the actual planets, lords and aspects in the chart; sign-level text is the baseline only.',
  ],
}
