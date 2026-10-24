// src/lib/engine/lagnaMatch.ts
// Ascendant-to-ascendant compatibility from blank-chart match-making.
// House relationship comes first; the sign pair is the broad pattern
// before planets are added. Pure data — no React/DB.

import type { Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'

export type LagnaMatchLevel =
  | 'excellent'
  | 'good'
  | 'strong'
  | 'moderate'
  | 'neutral'
  | 'difficult'
  | 'incompatible'

export interface LagnaMatch {
  a: Rashi
  b: Rashi
  nameA: string
  nameB: string
  level: LagnaMatchLevel
  tone: 'supportive' | 'caution' | 'mixed'
  reason: string
}

const LEVEL_TONE: Record<LagnaMatchLevel, LagnaMatch['tone']> = {
  excellent: 'supportive',
  good: 'supportive',
  strong: 'mixed',
  moderate: 'mixed',
  neutral: 'mixed',
  difficult: 'caution',
  incompatible: 'caution',
}

/** Unordered pairs. Key is `${smaller}-${larger}`. */
const PAIRS: Record<string, { level: LagnaMatchLevel; reason: string }> = {
  '1-1': { level: 'neutral', reason: 'Two leaders with the same style. Comfortable and familiar, with little extra spark, and both may want to lead at the same time.' },
  '1-2': { level: 'difficult', reason: 'Taurus prefers a secure, steady build, while Aries prefers faster risk. One may feel rushed and the other held back.' },
  '1-3': { level: 'incompatible', reason: 'The 7th-house patterns differ. Gemini enjoys leisure and travel, while Aries is busy and may treat a holiday as lost time. Talking about pace early helps.' },
  '1-4': { level: 'good', reason: 'Aries can play commander to Cancer’s royal home, but the lagna aspect irritates: blunt speech against emotional waves. It works when patience is learned.' },
  '1-5': { level: 'good', reason: 'Fire with fire and no shared ego-territory in the 7th. They respect each other’s independence and do not need to win the same room.' },
  '1-6': { level: 'difficult', reason: 'Virgo notices the unfinished task, and Mars dislikes being checked on. One partner may often feel they are on support duty inside the marriage.' },
  '1-7': { level: 'strong', reason: 'Natural 7th-house opposites. Libra’s diplomacy balances Aries’s rush; Aries’s decision rescues Libra from hovering. Opposites here complete.' },
  '1-8': { level: 'incompatible', reason: 'Both are strong-willed, with opposite tactics. Scorpio researches before moving, while Aries starts on impulse. Privacy can tire one partner and haste can tire the other.' },
  '1-9': { level: 'good', reason: 'Fire trine. Same enthusiasm and directness, like matching cloth: little built-in conflict, and not much contrast either.' },
  '1-10': { level: 'excellent', reason: 'Mars is exalted in Capricorn. Aries rises from Capricorn’s 10th and Capricorn from Aries’s 4th. Capricorn supplies the ground Aries lacks, and admires the hustle.' },
  '1-11': { level: 'good', reason: 'An 11th-house bond. Independence and large ideas. It behaves more like a friendship that chose marriage than a fused emotional knot, which suits both.' },
  '1-12': { level: 'good', reason: 'Venus is exalted in Pisces, so attraction is real. Pisces gives outward to everyone. Aries wants to be the priority, and that clash needs naming.' },
  '2-2': { level: 'neutral', reason: 'Two bulls in one field: loyal and sensual, and equally determined. Comfort can turn into a standstill when neither gives way.' },
  '2-3': { level: 'difficult', reason: 'Gemini spends on experiences, while Taurus protects savings for decades. One may seem carefree and the other overly careful.' },
  '2-4': { level: 'good', reason: 'Cancer’s home-and-family instinct feeds Taurus’s nest. Material comfort meets emotional warmth if speech stays simple.' },
  '2-5': { level: 'moderate', reason: 'Leo wants the grand gesture. Taurus wants comfort without display. One feels the other is wasteful; the other feels the first is withholding.' },
  '2-6': { level: 'excellent', reason: 'Earth trine. Shared practicality, loyalty, cleanliness, and routine. A low-drama household that actually functions.' },
  '2-7': { level: 'difficult', reason: 'Both are ruled by Venus, each with their own idea of beauty. Taste can become a quiet contest over whose version of “nice” wins.' },
  '2-8': { level: 'strong', reason: 'A 7th-house Venus–Mars pull. Magnetic and possessive on both sides. It can feel passionate or controlling, depending on whether power is shared.' },
  '2-9': { level: 'incompatible', reason: 'Sagittarius needs open roads, while Taurus needs a settled home. One may feel confined and the other left behind.' },
  '2-10': { level: 'excellent', reason: 'Earth trine. Long security, ambition, and wealth built slowly. The empire-over-twenty-years pairing.' },
  '2-11': { level: 'moderate', reason: 'Career can coordinate. Aquarius’s distance feels cold to a Taurus who loves by touch and routine comfort.' },
  '2-12': { level: 'good', reason: 'Venus is strong toward Pisces. Dreamy devotion plus grounded care makes an old-world, gentle bond.' },
  '3-3': { level: 'neutral', reason: 'Wit and motion, and nobody volunteers to be the anchor. Fun is easy. Follow-through is the work.' },
  '3-4': { level: 'difficult', reason: 'Cancer likes to feel every conversation through, while Gemini wants the next topic. One may feel dismissed and the other held back.' },
  '3-5': { level: 'good', reason: 'Social, playful and entertaining. Friction can start when Leo wants undivided attention and Gemini’s attention keeps traveling.' },
  '3-6': { level: 'moderate', reason: 'Same lord, opposite habits. Virgo finishes and corrects. Gemini starts ten things. Order and scatter rub.' },
  '3-7': { level: 'excellent', reason: 'Air trine. Talk, debate, and company do not run out. A genuinely easy mental match.' },
  '3-8': { level: 'difficult', reason: 'Scorpio holds a secret until ready, while Gemini wants it said now. One may feel exposed and the other shut out.' },
  '3-9': { level: 'strong', reason: '7th-house Mercury–Jupiter pair. Curiosity meets the long view. One of the stimulating opposites.' },
  '3-10': { level: 'incompatible', reason: 'Capricorn is building something lasting, while Gemini enjoys changing jobs and interests. Reliability is the topic to talk through.' },
  '3-11': { level: 'excellent', reason: 'Air trine. Ideas, space, and a low need to own each other’s mind. Progressive and lightly jealous.' },
  '3-12': { level: 'moderate', reason: 'Mercury is less comfortable in Pisces. Logic-first meets feeling-first. One may feel unheard and the other may feel hard to reason with.' },
  '4-4': { level: 'neutral', reason: 'Deep care and double weather. When both retreat, nobody is left to open the door. Empathy is high; mood can stall the house.' },
  '4-5': { level: 'moderate', reason: 'Leo wants to be seen. Cancer wants the private nest. Spotlight and shell take turns feeling wrong.' },
  '4-6': { level: 'good', reason: 'Virgo serves by fixing. Cancer serves by feeling. Together that is a working home if criticism stays kind.' },
  '4-7': { level: 'moderate', reason: 'Libra needs the room outside. Cancer needs the room inside. Company and nesting pull apart.' },
  '4-8': { level: 'excellent', reason: 'Water trine. Loyal, protective, almost wordless understanding. One of the stronger emotional matches.' },
  '4-9': { level: 'difficult', reason: 'Sagittarius’s blunt freedom unsettles Cancer’s need for a predictable presence.' },
  '4-10': { level: 'strong', reason: 'Moon–Saturn opposites. Structure meets warmth, and some friction is likely because the lords do not share an element. It holds well when Saturn’s reserve is read as steadiness and the Cancer feeling is given a place.' },
  '4-11': { level: 'incompatible', reason: 'Aquarius needs air and distance, and Cancer can read distance as being left. Emotional safety and detachment speak different languages.' },
  '4-12': { level: 'excellent', reason: 'Water trine, with Jupiter’s exaltation in the family. Gentle, fluent, and spiritually easy.' },
  '5-5': { level: 'neutral', reason: 'Two suns. Generous and magnetic, and both expect the center. Without turns, it is a contest for the light.' },
  '5-6': { level: 'difficult', reason: 'Virgo likes to correct, and Leo likes appreciation. Frequent corrections can dampen the warmth.' },
  '5-7': { level: 'good', reason: 'Charm, beauty, and a public couple. They enjoy being admired together.' },
  '5-8': { level: 'moderate', reason: 'Two fixed wills and real heat. Respect holds it after loyalty is proven. Power has to be shared on purpose.' },
  '5-9': { level: 'excellent', reason: 'Fire trine. Admiration, generosity, and room to move. Jealousy is not the native problem.' },
  '5-10': { level: 'difficult', reason: 'Leo’s display looks unnecessary to Capricorn, who wants the thing to work, not to shine.' },
  '5-11': { level: 'strong', reason: 'Sun opposite Saturn’s air. Personal glory meets the crowd. Humility helps on the Leo side, and clean public conduct helps on the Aquarius side; pride can invite gossip.' },
  '5-12': { level: 'incompatible', reason: 'Pisces gives quietly, while Leo likes the gift to be visible. Devotion that goes unnoticed can turn into resentment, so appreciation matters.' },
  '6-6': { level: 'neutral', reason: 'Order and loyalty, and two critics in one kitchen. The bond works and nitpicks at the same time.' },
  '6-7': { level: 'moderate', reason: 'Virgo wants the correct choice. Libra wants every option to stay pleasant. Precision and indecision argue.' },
  '6-8': { level: 'good', reason: 'Privacy, depth, and analysis. Both prefer substance to performance. Low drama, high attention.' },
  '6-9': { level: 'difficult', reason: 'Virgo wants a plan at home, and Sagittarius likes to leave the plan. Rules can feel confining to one and spontaneity can feel messy to the other.' },
  '6-10': { level: 'excellent', reason: 'Earth trine. Discipline, function, and a life that is built rather than performed.' },
  '6-11': { level: 'difficult', reason: 'Virgo loves the correct method. Aquarius breaks the method to see what happens.' },
  '6-12': { level: 'strong', reason: 'Venus is exalted in Pisces and debilitated in Virgo, so desire often sits at two temperatures. Virgo’s fixing feels like judgment. Pisces’s open giving feels like disorder. Read Venus, and the whole chart, before treating the match as settled.' },
  '7-7': { level: 'neutral', reason: 'Fair and polite, and nobody casts the deciding vote. Small choices stretch into negotiation.' },
  '7-8': { level: 'difficult', reason: 'Libra wants the open table. Scorpio wants the closed hand. Fairness and secrecy do not trust each other.' },
  '7-9': { level: 'good', reason: 'Ideas, people, and movement. Friendly and aimed at growth.' },
  '7-10': { level: 'moderate', reason: 'Saturn is exalted for this axis. Capricorn’s structure feels tight at first and later gives Libra a direction it cannot choose alone.' },
  '7-11': { level: 'excellent', reason: 'Air trine. Justice, ideas, and an equal meeting. Progressive and mentally kind.' },
  '7-12': { level: 'difficult', reason: 'Pisces speaks in moods and weather, while Libra needs a clear exchange to stay balanced. Their signals can be hard to translate.' },
  '8-8': { level: 'neutral', reason: 'Fierce loyalty, and two locked doors. Without openness it can turn into mutual suspicion; with it, the bond can be deep and lasting.' },
  '8-9': { level: 'difficult', reason: 'This is a teacher and a student more than a marriage. Sagittarius has the boldness Scorpio hides, and over time Scorpio leans on that. Freedom and control are the themes to work out.' },
  '8-10': { level: 'good', reason: 'Strategy, patience, and the long game. Both respect discipline more than display.' },
  '8-11': { level: 'good', reason: 'Aquarius can pull Scorpio out of a crisis Scorpio will not explain. Scorpio wants a partner absorbed in them, and Aquarius can carry that. Independence and fusion still negotiate.' },
  '8-12': { level: 'excellent', reason: 'Water trine. Pisces softens the sting. Scorpio gives the dream a protected room.' },
  '9-9': { level: 'neutral', reason: 'Adventure and philosophy, and neither naturally anchors the calendar. The bond can drift while both are having a fine time.' },
  '9-10': { level: 'difficult', reason: 'Jupiter is debilitated in Capricorn. “It will work out” meets “show me the plan,” especially around money.' },
  '9-11': { level: 'good', reason: 'Independence and odd ideas, with respect. Low possessiveness.' },
  '9-12': { level: 'good', reason: 'Both are Jupiter’s. Philosophy and faith line up. Sagittarius’s blunt edge can still hurt Pisces if it is not watched.' },
  '10-10': { level: 'neutral', reason: 'Loyal, ambitious, and reserved on both sides. The household runs. Feeling can be underfed.' },
  '10-11': { level: 'moderate', reason: 'Shared Saturn. Discipline agrees. Aquarius’s ideal can look impractical to Capricorn’s ledger.' },
  '10-12': { level: 'moderate', reason: 'Capricorn grounds the dream and can come across as reserved. Pisces may seem impractical and still needs the feeling that Capricorn shows through effort instead.' },
  '11-11': { level: 'neutral', reason: 'Open and mentally matched, and both can stay slightly outside the feeling. Strong ideas, with less outward warmth unless someone steps in.' },
  '11-12': { level: 'moderate', reason: 'Pisces wants to merge. Aquarius wants a door that closes. Intimacy becomes a push and a pull.' },
  '12-12': { level: 'neutral', reason: 'Empathy and romance, and a shared talent for skipping the practical boundary. Rich feeling, messy logistics.' },
}

function key(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

export function lagnaMatch(signA: number, signB: number): LagnaMatch {
  const a = ((((signA - 1 + 12) % 12) + 1) as Rashi)
  const b = ((((signB - 1 + 12) % 12) + 1) as Rashi)
  const row = PAIRS[key(a, b)] ?? {
    level: 'moderate' as const,
    reason: 'No general note is stored for this pair of lagnas. The house relationship is the best place to start, then the signs.',
  }
  return {
    a,
    b,
    nameA: RASHI_NAMES[a],
    nameB: RASHI_NAMES[b],
    level: row.level,
    tone: LEVEL_TONE[row.level],
    reason: row.reason,
  }
}

const ELEMENT: Record<number, 'fire' | 'earth' | 'air' | 'water'> = {
  1: 'fire', 5: 'fire', 9: 'fire',
  2: 'earth', 6: 'earth', 10: 'earth',
  3: 'air', 7: 'air', 11: 'air',
  4: 'water', 8: 'water', 12: 'water',
}

export function lagnaElementNote(signA: number, signB: number): string | null {
  const ea = ELEMENT[signA]
  const eb = ELEMENT[signB]
  if (!ea || ea !== eb) return null
  if (ea === 'water') {
    return 'Both lagnas are water. Kindness is remembered, and the bond is emotional at the root. A breach of trust or a long stretch of feeling alone can weigh heavily on the marriage, because the foundation is feeling.'
  }
  if (ea === 'fire') {
    return 'Both lagnas are fire. Initiative and spark are shared. Disagreements can escalate quickly when both react with fire.'
  }
  if (ea === 'earth') {
    return 'Both lagnas are earth. The match is built on routine, money and staying power. Feeling may need to be made time for, or it can go missing.'
  }
  return 'Both lagnas are air. Ideas and company come easily. Someone still needs to keep the home grounded.'
}
