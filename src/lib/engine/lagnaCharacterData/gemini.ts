// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/gemini.ts
//  Gemini Ascendant (Mithun Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const GEMINI_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 3,
  title: 'Gemini Ascendant (Mithun Lagna)',
  intro:
    'Gemini Lagna is the artist’s chart: life centres on building a skill, practising it intensely, and earning recognition for it. ' +
    'Communication, ruled by Mercury, is the key. The reading is built from the sign in each house, its natural significations and the house significations.',
  traits: [
    {
      id: 'artist-chart',
      title: 'The artist’s chart: four priorities',
      points: [
        'Skill set, built over a lifetime.',
        'Sadhana: intense practice and dedication in the chosen field.',
        'Medals, name and recognition for the skill developed.',
        'Hobbies and small courses: continuous learning throughout life.',
      ],
    },
    {
      id: 'skill-based',
      title: 'Born for skill-based work',
      points: [
        'Titles like "God of Cricket" or "Saraswati of Singing" come from skill mastery; artists and musicians often have strong Gemini or 3rd-house emphasis.',
        'Best as coders, singers, writers, teachers and others who use a refined skill set.',
        'If not engaged in any skill or craft, life declines.',
        'They must be "selfishly" dedicated to learning for themselves.',
      ],
    },
    {
      id: 'communication',
      title: 'Communication is the key',
      points: [
        'Keep learning new skills, taking small certification courses, expressing and communicating knowledge.',
        'Career peaks when they go into isolation (the 8th-house Capricorn pattern, with the career house being Pisces).',
        'Natural teachers: the 3rd house is Leo, which is very strong for this Lagna.',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Gemini',
      theme: 'Artist’s chart: skill, sadhana, recognition, constant learning',
      points: [
        'Priorities in order: skill set, sadhana, medals and recognition, hobbies and short courses.',
        'Skill-based, communication-led life; learning must continue or life declines.',
        'Mercury is the Lagna lord, so read where Mercury is placed before applying generic text.',
      ],
    },
    2: {
      house: 2,
      signName: 'Cancer',
      theme: 'Emotional family, speech mood swings, public support as wealth',
      points: [
        'Moon’s sign in the 2nd means emotional turmoil at home; family drama and crying are common. Krishna’s own family life is the reference.',
        'Mars is debilitated and Jupiter exalted in Cancer: if the family gives a spiritual belief system or deity worship, the chart becomes excellent.',
        'Speech: mood swings and, over time, arrogance (especially in artists). Speak with love and warmth to avoid bad reputation (the Moon and Daksha story).',
        'Traditional caution on rule-breaking relationships (Moon and Tara story) showing up as family problems.',
        'Naturally attractive, good eyes and face, high metabolism; looks younger than their age.',
        'Real wealth comes from the masses and public support through communication; emotional, soothing expression such as poetry is the wealth.',
        'Remedies: keep books and water nearby; worship Mata Sati (Maa Brahmacharini), Radha Rani and Krishna; pearl is the best gemstone, with a pearl mala for chanting.',
      ],
    },
    3: {
      house: 3,
      signName: 'Leo',
      theme: 'Biggest strength: communication, skills, recognition',
      points: [
        'Leo (lord Sun) falls on the 3rd, and Mercury, the Lagna lord and karaka of communication, always stays close to the Sun: the most powerful house for this Lagna.',
        'Best fits: reporters, journalists, editors, content writers, directors, government officers, PR, auditors, singers.',
        'If they cannot write, speak, direct or audit well, the 3rd house is damaged.',
        'Take courses and certifications from valued government institutions; stay close to powerful people (many become personal assistants).',
        'Younger siblings’ growth mirrors their own. Live in powerful or expensive neighbourhoods near government bodies, army camps or politicians. Keep the balcony clean and luxurious.',
      ],
    },
    4: {
      house: 4,
      signName: 'Virgo',
      theme: 'Clean, disciplined home; mother’s corrections; sadhana as temple',
      points: [
        'Home often has conflicts; artists rarely have a peaceful home or married life.',
        'Virgo rules cleanliness: keep the house clean, avoid fault-finding, keep household help.',
        'The mother may correct punctuality and logic — this is good for them. Needless fights with the mother damage finances.',
        'Decor should be transparent and minimal in colour (glass items); use glass utensils for drinking water.',
        'Moral values rest on daily consistency; poor sleep may point to broken practice. Home is a temple of sadhana.',
        'The 4th also represents the masses; good in legal work defending public causes.',
      ],
    },
    5: {
      house: 5,
      signName: 'Libra',
      theme: 'Education is crucial; talented children; costly romance',
      points: [
        'Must attend the best schools and premium colleges; English plus local language command is where money comes from.',
        'Best schools offer extracurriculars and stage performance. Good schools, good speaking and premium colleges mean a strong 5th house.',
        'Children are talented, famous and succeed early; encourage camera presence.',
        'Relationships bring maturity but high expenses; with weak Venus, overspending on romantic partners.',
        'Libra teaches win-win diplomacy; social media is a good platform for 5th-house expression.',
      ],
    },
    6: {
      house: 6,
      signName: 'Scorpio',
      theme: 'Biggest warning: do not nurse enmity',
      points: [
        'Do not hold grudges or badmouth enemies constantly, hit below the belt or repeatedly insult friends.',
        'Scorpio stabs repeatedly, not once; unresolved enmity can create mysterious ailments that doctors cannot diagnose.',
        'Common pattern: fights with father over property and endless court cases.',
        'Leave enemies alone and stop circling conflicts; if this trap is avoided, enemies, debts and disease are manageable.',
      ],
    },
    7: {
      house: 7,
      signName: 'Sagittarius',
      theme: 'Dharmic, stable partner; infidelity is the major risk',
      points: [
        'Jupiter has no directional strength in the 7th.',
        'Ideal partner: religious, shows the right path, stable and speaks less (the native is already talkative), traditional.',
        'Infidelity damages both Sagittarius and Jupiter energy; lack of loyalty is the major relationship problem for this Lagna.',
        'A partner with strong Jupiter brings a major positive change; the Guru’s blessing is essential.',
        'Do not be overly selfish in education (5th) or partnership (7th); choose good moral values even over skill, and do not trade values for small gains.',
      ],
    },
    8: {
      house: 8,
      signName: 'Capricorn',
      theme: 'Career through isolation; past-life incomplete work',
      points: [
        'Saturn in the 8th means career built in isolation. Saturn’s dasha strips away drama and warns against being too selfish.',
        'Past-life karma of unfinished work: works under many people and is let go when payment or promotion is due.',
        'Remedy: research work and new or hidden professions, which bring recognition even if underpaid at first.',
        'Saturn slows ageing, so they look young for longer.',
      ],
    },
    9: {
      house: 9,
      signName: 'Aquarius',
      theme: 'Unconventional dharma, risk of being cheated, online learning',
      points: [
        'Does not follow traditional religious rules and may create new belief systems (Rahu influence).',
        'Risk of being cheated by father or guru; higher-education fraud is possible, so verify that institutions are government-approved.',
        'Repay the guru through social media appreciation; learn better online than offline.',
        'Rahu gives flashes of insight (dreams, sleep) that vanish quickly; do not trust such information fully.',
        'Body area: thighs and hips, often a source of self-consciousness.',
      ],
    },
    10: {
      house: 10,
      signName: 'Pisces',
      theme: 'Irregular, grace-led work; teaching and communication careers',
      points: [
        'Work comes irregularly, "by God’s grace", and career income is generally lower.',
        'Money comes from speech, skill and the air element (intangible services).',
        'Career fits: astrology, mathematics, communication, space industry, airlines, and especially teaching.',
        'Do not overthink career; build the skill set and the career follows.',
      ],
    },
    11: {
      house: 11,
      signName: 'Aries',
      theme: 'Multiple, fluctuating income streams',
      points: [
        'Mars energy gives a constant drive for achievement; they must be good at creating several income sources.',
        'Aries brings instability wherever it sits: income swings between high and low.',
        'They must keep learning and doing to keep income flowing; friends and desires share this fiery, unstable energy.',
      ],
    },
    12: {
      house: 12,
      signName: 'Taurus',
      theme: 'Spending on family; annadan and liberation talk',
      points: [
        'Tendency to spend on family, buy resources and hoard cash; family brings financial drain.',
        'Annadan (food donation) is the remedy: giving food, supporting family and buying necessary things brings peace.',
        'Taurus is also the speech sign and the 12th is moksha: think and talk about liberation regularly.',
      ],
    },
  },
  exceptions: [],
  readingNotes: [
    'Summary: artist’s chart, good auditor and communicator, good moral values, occasional home conflict, known for certifications and education, constantly building new income streams.',
    'Biggest cautions: enmity (6th), infidelity (7th), and being underpaid for work in the 8th-house pattern.',
    'Confirm every point against the actual planets, lords and aspects in the chart; sign-level text is the baseline only.',
  ],
}
