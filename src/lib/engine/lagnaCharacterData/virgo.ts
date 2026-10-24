// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/virgo.ts
//  Virgo Ascendant (Kanya Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const VIRGO_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 6,
  title: 'Virgo Ascendant (Kanya Lagna)',
  intro:
    'Virgo Lagna is the self-improver: always refining, matching, correcting and solving. Mercury is exalted and Venus debilitated in Virgo, ' +
    'so process, rules and analysable problems come easily while blind faith does not. ' +
    'For each house, ask what the sign is doing there, how it works there, and why that sign landed there.',
  traits: [
    {
      id: 'why-virgo',
      title: 'Why one gets a Virgo Lagna',
      points: [
        'A life spent constantly upgrading oneself.',
        'Past-life pattern: fear, problems and shortcomings were made the centre of life. Solving problems is part of life, but when disease, debt, enemies (6th-house matters) or a profession becomes the whole identity ("I am a doctor, a surgeon, an analyst"), Virgo Lagna results.',
      ],
    },
    {
      id: 'mercurial',
      title: 'Mercurial strengths',
      points: [
        'Excellent at tangible work, rules, SOPs and analytically solvable problems; process-oriented and consistent.',
        'Weakness: cannot trust blindly or close their eyes and have faith; an inner worry of "will it work or not".',
        'Common among analytical and technical people (engineers, AI and ML work), who constantly refine and test models and methods.',
      ],
    },
    {
      id: 'jack-of-trades',
      title: 'Broad knowledge and operations',
      points: [
        'Superficial knowledge of many things lets them manage operations well; Virgo-dominant people often become COOs.',
        'Detail memory is a strength: exact specifications, measurements and names, with steady, consistent output.',
      ],
    },
    {
      id: 'symptoms',
      title: 'Symptom-first thinking',
      points: [
        'Analyses by development stage: where it started, how it grew, what the features are. Catches symptoms first (they will list ten) while the root cause must be found separately; Ketu gives the root-cause "seed".',
        'Either a great problem solver or a great mess creator, because they see too many problems everywhere.',
        'Practical rather than emotional: needs things stated explicitly and asks many operational questions before acting (when to chant, what to wear, where).',
      ],
    },
    {
      id: 'blind-spot',
      title: 'Biggest weakness: missing the big picture',
      points: [
        'Fights over small amounts while overlooking what has already been received.',
        'Rigid checklists in marriage (for example a highly successful partner who also consults on every decision); life is a barter, so compromise is needed.',
        'Disease, debt and enemies exist for everyone and dominate only when one is weak, so work on health regularly.',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Virgo',
      theme: 'Self-improvement, analysis, process and detail',
      points: [
        'See the general traits: refinement, SOP thinking, symptom-first analysis, need for faith.',
        'Mercury is the Lagna lord (and 10th lord), so read its placement first.',
      ],
    },
    2: {
      house: 2,
      signName: 'Libra',
      theme: 'Wealth as refinement; fair distribution; money-led family conflict',
      points: [
        'Their wealth is refinement: the ability to polish anything given to them. Saturn is exalted in Libra, so they distribute resources evenly.',
        'Family conflict likely over joint versus separate living and over money, which is the first area of conflict; in marriage the spouse may try to control resources.',
        'Money is held in multiple forms (cash, investments, gold, bonds, stocks) and balanced.',
        'Diplomatic speech: gives positives and negatives but no direct verdict. The Sun is debilitated in Libra, so given responsibility they get stuck and prefer to hand over money and let others manage.',
        'Selfishness ("all mine") is the danger; the true Virgo quality is fair distribution with credit shared among contributors. For women, much of life may go into balancing the family.',
      ],
    },
    3: {
      house: 3,
      signName: 'Scorpio',
      theme: 'Deep, research-style writing and thinking; anxiety about missing points',
      points: [
        'Scorpio’s depth is needed to write good SOPs and manuals; teaching means breaking ideas into steps with examples. Ketu brings talk of past incidents.',
        'Virgo with Scorpio is perpetually unsatisfied and keeps asking questions. Medals and achievements come through research (for example root causes of disease); belief that they can write good research papers or books.',
        'Writing: condensed, small, functional, cryptic notes (the Moon is debilitated in Scorpio, so no aesthetic concern). Contrast with Jupiter-type long paragraphs in big letters.',
        'Anxiety about forgetting or leaving out a point; habit of carrying notes and double-checking. Stammering or memory lapses are possible with Ketu influence.',
      ],
    },
    4: {
      house: 4,
      signName: 'Sagittarius',
      theme: 'Faith, fairness and guidelines at home; growth by leaving home',
      points: [
        'Jupiter rules Sagittarius here; devotion and fire sustain detailed long-term service. The heart needs unwavering faith that guidelines (guru) are right.',
        'Scrupulously fair, wanting to reciprocate every kindness; guilt about even small unfair gains, fed by Ketu’s mental replay.',
        'Talks about philosophy, justice and long journeys at home, and shows knowledge there. Must leave the comfort zone or hometown to grow.',
        'The mother-figure guides by rules ("even if you suffer, follow the rules").',
        'Vehicle: big, comfortable, clean-fuel cars suited to long rides. Deity images in home and car.',
        'Attracted to bold, one-sided partners who pull them out of over-analysis loops.',
      ],
    },
    5: {
      house: 5,
      signName: 'Capricorn',
      theme: 'High positions through sustained study; strict with children',
      points: [
        'The 10th-house sign on the 5th makes them good at reaching high positions. Belief that success needs ten hours of steady study; they push children hard.',
        'Saturn energy: children may be lazy yet able to carry heavy loads, or rebel against instructions. Wants to control and set boundaries; clashes with higher authority; may be a union-leader type with documented complaints.',
        'Collects historical records. Handles heavy workload well (steady daily study rather than cramming).',
        'Love: attracted to mature, hardworking, traditional, stable partners, but cannot control Capricorn once it matures.',
        'Digestion: weak digestive fire, skipped meals, cold Saturn energy (oil or belly massage helps); trust in Ayurveda but wants visible results; selective about food quality and ingredients. Career becomes life’s vision.',
      ],
    },
    6: {
      house: 6,
      signName: 'Aquarius',
      theme: 'Strongest 6th house: scaling operations, networks, gut health',
      points: [
        'Mercury with Saturn and Rahu energy makes a very capable 6th house: CS-type analytical precision, and ability to scale operations (one hospital to many).',
        'Excellent networking; all good deeds are counted here without big-or-small distinctions. Hidden rules govern large organisations.',
        'Caution: paperwork may go missing, and a person may look serious at work without working; "any means" thinking.',
        'Health themes: asthma, nerves, intestines, constipation or retention (Rahu), appendix, gastric and bladder problems, hernia. Any serious symptom needs medical evaluation.',
      ],
    },
    7: {
      house: 7,
      signName: 'Pisces',
      theme: 'Blind faith in partners; faith-led business types',
      points: [
        'This is what Virgo cannot naturally do: trust blindly. Venus is exalted and Mercury debilitated in Pisces.',
        'Cannot question the partner and the partner does not share everything; the relationship works only on faith. Common complaint: "I trusted blindly but something else emerged."',
        'Partnership business types: import-export, spirituality, courier, therapy, hospital, ashram, medicine, tourism, mediation, food and travel, aviation, schools and hostels, play schools, old-age homes, sleep products, counselling.',
        'Business and marriage both run on faith ("Ram bharose"). The spouse can be read by treating Pisces as their effective Lagna.',
      ],
    },
    8: {
      house: 8,
      signName: 'Aries',
      theme: 'Sudden research breakthroughs; in-law friction; working alone',
      points: [
        'Research needs deep, aggressive knowledge of machinery and equipment to automate and innovate processes; common among AI and automation engineers.',
        'Friction with in-laws, quick and incomplete speech causing arguments, inheritance disputes.',
        'Sudden ideas, publications and cancellations. Habit of working alone with intense effort; background research before confronting anyone.',
        'Health cautions from Aries: heart and blood pressure, accidents, blood-related issues; stressful periods for women; hernia or piles for men.',
        'Tendency to regret past actions ("I should have spoken then").',
      ],
    },
    9: {
      house: 9,
      signName: 'Taurus',
      theme: 'Resources toward temples, schools and degrees',
      points: [
        'Contributes resources to temples, schools and institutions; treats higher degrees as investments and will pay for study, including abroad.',
        'Conversation centres on higher learning, spirituality and resources, and often on marriage (2nd-house Libra link), usually ending with "leave it to God".',
      ],
    },
    10: {
      house: 10,
      signName: 'Gemini',
      theme: 'CS, accounting, automation, multitasking careers',
      points: [
        'Mercury owns both the 1st and 10th, so professional capability in analytical fields is strong: CS, accountancy, law, medicine (prescriptions), teaching, reporting (sometimes with spin).',
        'Automation and multiplying operations (one factory to three, one department to three); multiple projects and small degrees at once.',
        'Can be selfish about their profession. Gemini also suggests stationery, hobby goods, instruments, toys and medical supplies as businesses.',
      ],
    },
    11: {
      house: 11,
      signName: 'Cancer',
      theme: 'Emotional attachment to desires; stubbornness',
      points: [
        'Moon with Rahu-type energy: emotionally tied to dreams and possessions, possessive and stubborn, with obsessive habits about food and home decor.',
        'Risk of addictive patterns (alcohol, smoking, cannabis). Posts emotional and family content on social media; gets hurt easily in groups; resists group rules.',
        'Changing jobs needs an emotional trigger. Friendships are sustained through shared meals and travel. Elder siblings act like mothers.',
      ],
    },
    12: {
      house: 12,
      signName: 'Leo',
      theme: 'Ego exiled; recognition from distance; separate space',
      points: [
        'The Sun (ego) is sent to the 12th so that ego stays out of service work.',
        'Tendency to want separate rooms or alone time; recognition comes from living away from home.',
        'Secret work is always eventually revealed.',
        'The father is authoritative at home; the mother visits temples regularly; dreams may feature authority figures.',
        'Timing cue (Naisargika, indicative only): age 25 is the Sun’s age, which may bring going abroad for work or study, self-reliance, and changes in the father’s situation.',
      ],
    },
  },
  exceptions: [],
  readingNotes: [
    'Method: for every house ask what the sign is doing there, how it works there, and why that sign landed there; practise this across all 12 signs.',
    'Individual charts vary with exact placements and running dashas, but the core background pattern stays consistent.',
    'Confirm every point against the actual planets, lords and aspects in the chart; sign-level text is the baseline only.',
  ],
}
