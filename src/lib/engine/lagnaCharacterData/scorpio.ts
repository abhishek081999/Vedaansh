// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacterData/scorpio.ts
//  Scorpio Ascendant (Vrishchik Lagna) — character + house-wise reading
// ─────────────────────────────────────────────────────────────

import type { LagnaCharacterProfile } from '@/lib/engine/lagnaCharacter'

export const SCORPIO_LAGNA_PROFILE: LagnaCharacterProfile = {
  rashi: 8,
  title: 'Scorpio Ascendant (Vrishchik Lagna)',
  intro:
    'Scorpio is the natural 8th sign, the sign of transformation and mystery, so a Scorpio Lagna carries secrets and goes through repeated, gradual transformation. ' +
    'The synthesis method: house is the place, sign is the flavour, planet is the agent; combine the three rather than memorising ready-made combinations.',
  traits: [
    {
      id: 'depth',
      title: 'Depth, secrecy and research',
      points: [
        'Introverted, with difficulty expressing emotion; transformation comes through research and deep diving into any subject (research, data science, investigation, chemistry, science and teaching).',
        'Carries private episodes they will never share; builds layers of protection over time, especially in relationships, fearing that what they share could be used against them.',
        'Mars and Ketu energy: does not react immediately but stores the reaction, plans internally and may respond much later and strongly.',
        'Insults stick for life (Ketu). Can remove a rival from a position through patient, quiet strategy.',
      ],
    },
    {
      id: 'strong-energies',
      title: 'Strong planetary energies for this Lagna',
      points: [
        'Jupiter’s exaltation sign, Cancer, falls on the 9th (Jupiter itself rules the 2nd and 5th).',
        'The Sun is strong in the 10th: Leo, its own sign, falls there, where it has directional strength.',
        'Venus is the 7th and 12th lord; Libra on the 12th gives it own-sign strength there. Pisces on the 5th is Venus’s exaltation sign and Mercury’s debilitation sign.',
        'These make Scorpio Lagna one of the stronger ascendants when these planets are well placed.',
      ],
    },
    {
      id: 'ethics',
      title: 'Reading ethics',
      points: [
        'Astrology illuminates hidden patterns; it is not a tool to judge a client’s choices. Stay neutral when 8th-house themes surface.',
        'The 8th-house and Scorpio themes here (secrecy, grudges, obsession, intense desire) are tendencies to be channelled constructively, not fixed outcomes.',
      ],
    },
  ],
  houses: {
    1: {
      house: 1,
      signName: 'Scorpio',
      theme: 'Introverted researcher with stored reactions and secrets',
      points: [
        'See the general traits: secrecy, research, stored reactions, long memory.',
        'Mars is the Lagna lord (Ketu is the co-ruler), so read Mars’s placement first.',
      ],
    },
    2: {
      house: 2,
      signName: 'Sagittarius',
      theme: 'Moral speech, principled family, few words',
      points: [
        'Sagittarius on the 2nd suggests an ancestor who was a saint, leader or holder of a major position; pride in lineage, often from a reputed family.',
        'Brings morality into everything and judges right and wrong; anger when promises are broken. Family fights are about big principles, not petty ones.',
        'Readiness to sacrifice for a cause, religion or God. Misusing family or trust wealth meant for public service brings turmoil to the family.',
        'Speaks little, in few words, but fluently when given a platform such as teaching.',
        'The partner tends to be talkative, dominant and may feel superior, with the native quieter at home.',
        'Often tries to fulfil the mother’s unmet wishes (respect, pilgrimage). Dishonesty or cheating authorities can hurt the children’s career (2nd is the 10th from the 5th).',
        'The father’s workplace may have issues though he performs well, and the father may owe a debt to religion or a spiritual master.',
      ],
    },
    3: {
      house: 3,
      signName: 'Capricorn',
      theme: 'Late success through hard work; hobbies sacrificed; past-based communication',
      points: [
        'Saturn’s sign on the 3rd: success and recognition come late (often 40-50), opportunities are delayed and effort is heavy. Childhood hobbies may fade during Saturn periods.',
        'Good for research, publishing papers, teaching and discoveries. Gemini on the 8th supports writing books and papers.',
        'Communication draws on the past ("you did this before"); decisions rest on past patterns, and change is accepted outwardly but resisted inwardly.',
        'Neighbourhood may be working-class or industrial. Likes sports using legs, patient games such as chess, sad or separation songs, metallic instrument sounds.',
        'Possible thyroid, lung or vocal-cord sensitivity with strong Saturn. May be harsh in comparing younger siblings.',
        'Rereads the same books until the concept is clear; strict about discipline when teaching; prefers drivers to driving; hard-working in solo sadhana; frequent short work trips.',
      ],
    },
    4: {
      house: 4,
      signName: 'Aquarius',
      theme: 'Big-quantity desires, obsessive emotions, attachment to mother',
      points: [
        'Moon with Rahu-type energy: wants things in large quantities (big fridge, bulk shopping, big home, balcony and TV); size matters more than design.',
        'Obsessive emotional body; relationships can turn dark over time and desires are never satisfied ("always want more").',
        'Strong attachment to the mother, who meets their needs. Squabbles with elder siblings over material things.',
        'Land or property disputes and paperwork delays; may not trust anyone easily; lingering longing for a partner even when it is not shown.',
        'Ability to rouse or influence crowds.',
        'Ketu in the 4th mixes Aquarius obsession with letting go: sudden giving up or cutting everyone off after feeling betrayed.',
      ],
    },
    5: {
      house: 5,
      signName: 'Pisces',
      theme: 'Intuition, living in the past, research and exam strength',
      points: [
        'Lives in memories of achievements and daydreams; faith-driven, with a feeling of divine insight and clear intuition, and a risk of a grandiose self-image.',
        'Spending goes to romance, speculation, gambling, stocks and education.',
        'Venus is exalted and Jupiter in its own sign here: strong conceptual clarity (medicine, finance, higher knowledge) and a calm approach to learning. Mercury is debilitated: weak at routine calculation and Mercury-style subjects.',
        'Excels at research and competitive exams; leans toward data science and research rather than engineering (Mars is weak in Pisces).',
        'Does not trust shortcuts or AI answers; double-checks data and consults teachers and experts directly.',
      ],
    },
    6: {
      house: 6,
      signName: 'Aries',
      theme: 'Strong fighter; new systems at work; high pressure',
      points: [
        'Excellent at arguing and fighting; usually restrained at first, but if provoked enough can respond with sharp aggression. Head-on approach to conflict.',
        'Good at solving problem statements and introducing new management systems and technology; wants credit for new methods.',
        'Projects may fail for lack of resources or support; works hard, often paving the way for others, under high pressure.',
        'The paternal aunt may be quarrelsome. Health: urinary tract infections, surgeries, injuries from fights.',
      ],
    },
    7: {
      house: 7,
      signName: 'Taurus',
      theme: 'Resource-minded partnerships; family shapes the marriage',
      points: [
        'Partners are judged by financial stability, especially in hard times. Marriage can raise or lower status depending on Venus.',
        'Family plays a big role in marriage, for better or worse; boundaries with relatives can blur. Prefers business partnerships with people they know well.',
        'Protective of the partner (Parshuram energy). Partner is often good-looking, loud and expressive; strong physical drive.',
        'The native earns and the partner often controls the resources. The partner may feel insecure about the native’s conflicts or controversial stands.',
      ],
    },
    8: {
      house: 8,
      signName: 'Gemini',
      theme: 'Secret planning, long grudges, close-relation marriages, selfish in-laws',
      points: [
        'Gemini on the 8th supports research, writing, losing hobbies and interest in hidden knowledge.',
        'Secretive, thinks in isolation, does not reveal plans; the subconscious cannot let go and keeps calculating how to repay. Provoking a Scorpio Lagna can bring back double.',
        'Marriage often within close relations; in-laws tend to be opportunistic and fault-finding, and the relationship often does not work well; the 8th also touches extramarital themes.',
        'Gemini links to children and the subconscious; childhood boundary violations, if present, may leave deep, long-held hurt. Handle with care and sensitivity.',
        'Gemini on the 8th also suggests ability to dig out and publish what is hidden.',
      ],
    },
    9: {
      house: 9,
      signName: 'Cancer',
      theme: 'Emotional vulnerability about father, guru and beliefs',
      points: [
        'Cancer on the 9th starts well but gradually brings blame and emotional strain; the most vulnerable placement. If the father or guru relationship turns toxic, the whole chart suffers; early loss of the father is a major emotional wound.',
        'Betrayal or exploitation by a boss or manager makes them hard and tough.',
        'Big-picture beliefs can become emotionally driven rather than logical; a manipulative guru can use emotional narratives to recruit them for a cause.',
        'Insulting the father, guru or religion triggers a severe, disproportionate reaction.',
        'Remedy: food charity and feeding people (Cancer rules nourishment).',
      ],
    },
    10: {
      house: 10,
      signName: 'Leo',
      theme: 'Recognised for focused work; desire to head the office',
      points: [
        'The Sun owns the 10th and has directional strength here: desire to head offices and hold the chair; administrative and leadership roles such as IAS are possible.',
        'Known for profession and deep research; wants to showcase themselves through their career.',
      ],
    },
    11: {
      house: 11,
      signName: 'Virgo',
      theme: 'Gradual income; friction through friends and groups',
      points: [
        'Conflicts arise from friends, uncles and groups; may stir confusion inside groups. Never lend to or borrow from friends.',
        'Income improves slowly and steadily; may come from old or complicated legal cases, or from medicine-related and little-known solutions.',
        'Desires are linked to a fighting spirit: fights hard for what they want.',
        'With Venus in this Virgo 11th, conflict and fault-finding revolve around the partner.',
      ],
    },
    12: {
      house: 12,
      signName: 'Libra',
      theme: 'Strong desire nature; losses through partnerships; living abroad or apart',
      points: [
        'A strong sensual and relationship drive (Mars here can intensify it).',
        'Partnerships can bring losses. After marriage the native may move abroad, become isolated from old circles, or settle away from old friends.',
        'The 12th also relates to confinement and legal troubles, so conflicts in close relationships should be handled carefully.',
      ],
    },
  },
  exceptions: [],
  readingNotes: [
    'Method: house = place, sign = flavour, planet = agent; derive the prediction from the three instead of looking for ready-made combinations.',
    'Examples: Saturn in the 8th Gemini points to overthinking, delayed paperwork and incomplete work; Rahu and Ketu exchange across the 4th and 6th points to property fights at home and bringing work issues home.',
    'Confirm every point against the actual planets, lords and aspects in the chart; sign-level text is the baseline only.',
  ],
}
