// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/sagittarius.ts
//  Sagittarius Ascendant (Dhanu Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const SAGITTARIUS_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 9,
  title: 'Sagittarius Ascendant (Dhanu Lagna)',
  intro:
    'Sagittarius Lagna looks strong (sportspeople, administrators and many successful people carry it), but direction is its core problem: ' +
    'Mercury, lord of the 7th, is the Baadhak (obstructing) planet here. Rise comes mainly through fortune and good mentors rather than effort alone. ' +
    'The emotional body (Moon, lord of the 8th) and Venus are the usual weak points.',
  traits: [
    {
      id: 'weak-points',
      title: 'Typical weak points',
      points: [
        'The emotional body: the Moon rules the 8th, so expressing emotion is hard.',
        'Venus brings relationship and value-related friction through life.',
        'Direction and guidance: Mercury as Baadhak causes lack of clear direction and of planned execution.',
      ],
    },
    {
      id: 'learning',
      title: 'Learning and endurance',
      points: [
        'Good students with strong technical skill and fast learning (Aries, Mars’s sign, falls on the 5th).',
        'Long-term memory can be weak (fast but not retaining) and long-endurance tasks lasting years are hard: the 5th lacks patience and Saturn, the 2nd lord, is a maraka.',
        'Logical and engineering-style thinking is good; rote-memory exams are harder.',
      ],
    },
    {
      id: 'life-pattern',
      title: 'Life pattern',
      points: [
        'The first 25 years are generally good; struggles begin with corporate life (trouble with managers, heavy workload, several changes of career direction).',
        'Rahu dasha can be damaging, since Rahu has no principles and can pull a naturally one-pointed Lagna into indulgence; Moon and Saturn periods can also disrupt, and Saturn’s dasha hits hard, especially with Rahu.',
        'Rumours and misrepresented information are common (Aquarius on the 3rd).',
      ],
    },
    {
      id: 'day-night',
      title: 'Day and night temperament',
      points: [
        'Jupiter is the Lagna lord and carries real ego. By night Pisces (4th) makes them soft and accommodating; by day the Sun’s heavy energy on the 10th makes them strict and harsh.',
        'Practical cue: avoid arguing with them in the afternoon; approach them at night.',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Sagittarius',
      theme: 'Seeker, counsellor, lifts others; leaves home to grow',
      points: [
        'Purpose: leave home, pursue philosophy, gain experience and, in the traditional reading, relieve ancestral karma.',
        'Childhood sinus, cough or breathing sensitivity is common. Whoever enters their life tends to rise, so counselling, consulting, professorship, training and third-party service businesses suit them.',
        'If Jupiter is afflicted: backbone, cervical spine, calf, thigh and knee issues (sports, army and combat roles stress the lower body).',
        'Initially fast learners who ask logical questions, until outside planetary pressure (such as Saturn) increases.',
        'Jupiter is the Lagna lord, so read where Jupiter is placed first.',
      ],
    },
    2: {
      house: 2,
      signName: 'Capricorn',
      theme: 'Modest early family finances; harsh speech; pending karma with mother',
      points: [
        'Saturn’s sign on the 2nd: family finances are modest at first and improve over time as Saturn-type items (iron, machinery, heavy equipment) accumulate.',
        'Birth often follows the mother’s intense prayers or temple donations; the main pending karma is with the mother.',
        'Afflictions to the 2nd by Mars, Venus or Rahu can bring a traumatic childhood, family disputes and neighbour conflicts.',
        'Speech can be harsh, rude or cutting, like acid; practise sweet and gentle speech. Mars is exalted in Capricorn, giving a sharp, to-the-point teaching style.',
      ],
    },
    3: {
      house: 3,
      signName: 'Aquarius',
      theme: 'Childhood blame, restless pursuit of recognition, information ethics',
      points: [
        'Siblings or cousins may falsely blame the native, leaving a deep sense of unfair treatment. Elder siblings may misuse gifts or money meant for the child.',
        'School pattern: wrong books, heavy bags, copying notes and getting caught.',
        'As adults can become workaholics chasing medals and recognition (Rahu has no end point).',
        'Ethical risk: manipulating information, spreading rumours or using unethical means to gain information or undermine others.',
      ],
    },
    4: {
      house: 4,
      signName: 'Pisces',
      theme: 'Urge to stay away from home; spiritual nature',
      points: [
        'Pisces is Jupiter’s own sign; the native’s true nature is spiritual rather than ego-driven (Sagittarius is more intellectual and combative).',
        'Strong urge to stay away from home as they grow; conflicts around eating habits and criticism at home; may run away or hide during fights.',
      ],
    },
    5: {
      house: 5,
      signName: 'Aries',
      theme: 'Very fast learning and execution; last-minute work',
      points: [
        'Finishes holiday homework in a day, often at school itself; works last-minute and under pressure but very fast.',
        'Does siblings’ drawing or art assignments; may be called as a witness in sibling matters.',
        'Saturn debilitated here is especially hard, as it sits in an already impatient house.',
      ],
    },
    6: {
      house: 6,
      signName: 'Taurus',
      theme: 'Career strain, money to mother’s health and debts',
      points: [
        'Career troubles begin here: may study engineering or medicine but lacks endurance; competitive exams may not survive more than two attempts.',
        'A large share of time and money (30-40%) can go to the mother’s health and treatment; repeated thought of leaving a job to care for her.',
        'Money often goes to debt repayment, EMIs and family obligations; hard to enjoy or retain money, which goes to trips and leisure.',
      ],
    },
    7: {
      house: 7,
      signName: 'Gemini',
      theme: 'Baadhak house: weak direction and execution in business',
      points: [
        'Gemini on the 7th with Mercury as Baadhak: does not know which business, which direction or what timing; weak at procedural, software and automation tasks.',
        'Jack-of-all-trades pattern: engineering, then civil services, then something else, never settling on a path.',
        'Often ends up in counselling as the shortcut when direct business execution fails.',
        'Needs a strong mentor or guide; without a father or guru support system makes poor independent decisions.',
      ],
    },
    8: {
      house: 8,
      signName: 'Cancer',
      theme: 'Emotional vulnerability in marriage; second-phase karma with spouse',
      points: [
        'A strong emotional body with a possibly traumatic childhood makes them vulnerable in marriage, including to manipulative or narcissistic partners.',
        'Fear of false allegations or legal trouble from the spouse, echoing the 3rd-house childhood blame.',
        'The biggest pending karma in the second phase of life concerns the spouse; honesty and fairness in marriage matter.',
      ],
    },
    9: {
      house: 9,
      signName: 'Leo',
      theme: 'Famous gurus and teachers; dark phase after father or guru passes',
      points: [
        'Teachers, gurus and counsellors they study under become famous and get promoted.',
        'When the father or guru passes, a dark phase of confusion may follow before spiritual growth.',
        'Trouble with managers arises from Leo on the 9th. Jupiter-Venus together in the 9th forces a choice between faith-led and material growth.',
      ],
    },
    10: {
      house: 10,
      signName: 'Virgo',
      theme: 'Labour-heavy, logistics-heavy, high-workload jobs',
      points: [
        'The workplace is generally difficult, with the most labour-intensive, logistics-heavy and high-workload jobs.',
        'Backbone strain from the Mercury sign on the 10th. If the early career goes well it holds; if they get stuck early, they tend to stay stuck.',
      ],
    },
    11: {
      house: 11,
      signName: 'Libra',
      theme: 'Good gains; avoid Venus-related loans',
      points: [
        'A good placement: easy social and romantic access, above-average salary, multiple income sources and ancestral wealth.',
        'Condition: avoid loans connected to Venus matters. Rahu’s influence on Venus here raises the risk of affairs, linked to the weak 7th.',
        'Infidelity damages the 11th: job loss or a downturn can follow.',
      ],
    },
    12: {
      house: 12,
      signName: 'Scorpio',
      theme: 'Help that is never returned; grief; night-time sadhana',
      points: [
        'Gives money and help freely but rarely gets it back: treat it as a donation, not a loan.',
        'Deep grief over breakups, losses and failed exams; the bedroom tends to be cluttered (12th with the 8th-house Moon).',
        'Taking on others’ sorrows by helping them improves their own situation.',
        'Scorpio on the 12th favours tantric-style practice, with meditation and mala chanting late at night (for example 1 AM).',
      ],
    },
  },
  exceptions: [],
  readingNotes: [
    'Remedies: faith in a guru or mentor (essential), temple donations, offering garlands to deities, Vishnu worship, Ekadashi fasting, late-night meditation and chanting, and speaking gently.',
    'Rise comes through fortune (bhagya) more than pure effort; core wound is the relationship with the mother (2nd and 8th); core obstacle is direction-finding (7th Mercury).',
    'Moon in Sagittarius (as opposed to the Lagna) shows similar behaviour but different physical patterns; the native may not hold to self-made routines but can be highly creative.',
    'Confirm every point against the actual planets, lords and aspects in the chart; sign-level text is the baseline only.',
  ],
}
