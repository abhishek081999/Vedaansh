// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/vimshottariInterpretations.ts
//  Condensed Vimshottari Mahadasha narratives (educational, safety-filtered)
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import { VIMSHOTTARI_YEARS } from '@/lib/engine/dasha/vimshottari'

export type VimshottariNature =
  | 'Benefic'
  | 'Mixed'
  | 'Malefic'
  | 'Highly Benefic'
  | 'Highly Malefic'

export interface VimshottariInterpretation {
  lord: GrahaId
  title: string
  years: number
  nature: VimshottariNature
  keyTheme: string
  primaryPositive: string
  secondaryBenefits: string
  psychologicalState: string
  negativeEffects: string | null
  /** Soft caution only — not medical advice */
  healthCaution: string | null
  lifeEvents: string
  phaseStart: string
  phaseMiddle: string
  phaseEnd: string
}

/** Educational result hierarchy (notes §16) — display only, not a score. */
export const VIMSHOTTARI_RESULT_HIERARCHY =
  'Read results in order: house significations → sign significations → planet’s natural karakatvas → aspecting planets → houses aspected → conjunctions. Every mahadasha can touch home, money, career, and relationships — not only one house.'

/** High-value Antar hints only (not a full 9×9 matrix). Key = `${MD}-${AD}`. */
export const VIMSHOTTARI_ANTAR_HINTS: Record<string, string> = {
  'Su-Su': 'Quick career jump possible; after the boost watch ego, false accusations, and short health dips.',
  'Su-Mo': 'Authority meets emotion — public image vs private mood; transfers or home shifts possible.',
  'Su-Ma': 'Aggressive drive for status; conflicts with bosses or siblings if Mars is hot.',
  'Su-Me': 'Speech and paperwork around career; networking for promotions.',
  'Su-Ju': 'Mentors and ethics support authority; teaching or counsel roles open.',
  'Su-Ve': 'Comfort-seeking with status; watch overspend on image.',
  'Su-Sa': 'Authority tested by duty; slow but solid career structures if you accept limits.',
  'Su-Ra': 'Sudden status swings; unconventional paths to recognition — verify before leaping.',
  'Su-Ke': 'Detachment from ego projects; occult or research tilt in career.',
  'Mo-Mo': 'Money may come with emotional lows — extremes of mood without a middle ground.',
  'Mo-Ra': 'Distance from family; if Moon is weak but Rahu strong, Rahu may still “save” the situation via unconventional routes.',
  'Mo-Sa': 'Vish Yoga flavour — mental labour intensifies; negativity rises unless Saturn is well placed.',
  'Mo-Ma': 'Physical effort and travel increase; action over contemplation.',
  'Mo-Me': 'Spending on self-growth; career decisions need extra care — avoid impulsive switches.',
  'Mo-Ve': 'If Sun was strong and Moon is afflicted, gains of the prior period can drain quickly.',
  'Mo-Su': 'Closing Moon phase can spotlight the whole personality; illness from earlier years may finally get clear treatment — or stress peaks. Not medical advice.',
  'Mo-Ju': 'Emotional wisdom and support from elders; faith restores after earlier unrest.',
  'Ma-Ma': 'Peak warrior energy — compete, build, travel; channel heat into skill not quarrels.',
  'Ma-Me': 'Strategy meets action — tech, engineering, or sharp negotiations.',
  'Ma-Ju': 'Dharmic courage — teaching through action; avoid righteous anger.',
  'Ma-Sa': 'Frustration then discipline; long projects finally move if you stay patient.',
  'Ma-Ra': 'Sudden fights or foreign/tech battles; high adrenaline — pause before risk.',
  'Ma-Ke': 'Detached action; sudden cuts in conflict or property themes.',
  'Ve-Ve': 'Seed of bhoga (enjoyment) sprouts — strong attraction to comforts and attachments.',
  'Ve-Su': 'Ego and self-image activate; “me and mine” focus in style and status.',
  'Ve-Mo': 'Heart activates — soulmate search, past emotions, possible heartbreak.',
  'Ve-Ma': 'Senses and drive hyper-activate; control impulsiveness in relationships and conflict.',
  'Ve-Me': 'Mind vs heart — pull toward practical work over pure romance.',
  'Ve-Ju': 'Wisdom and mentors appear; romance seeks balance with dharma.',
  'Ve-Sa': 'Results of past indulgence — boundaries, patience, reality checks on relationships.',
  'Ve-Ra': 'Most memorable Antar for many — Maya meets Maya; subconscious imprint and eventual transformation. Soft caution for major medical procedures.',
  'Ve-Ke': 'Detachment begins — relationships or identity may shed; early spiritual light.',
  'Sa-Sa': 'Double Saturn — heavy restructuring; foundation years for the rest of the mahadasha.',
  'Sa-Me': 'Speech control, documentation, skills — with patience. Poor papers now haunt later periods.',
  'Sa-Ke': 'Uncertainty and separation themes for ~a year; isolation can push toward a mentor.',
  'Sa-Ve': 'Duty vs comfort — relationships mature or end; luxury earned slowly.',
  'Sa-Su': 'Authority under scrutiny; ego learns hierarchy and time.',
  'Sa-Mo': 'Emotional coldness then maturity; family duties intensify.',
  'Sa-Ma': 'Effort with friction; physical labour and boundaries both rise.',
  'Sa-Ju': 'Karmic teaching — mentors who demand discipline; wisdom through work.',
  'Sa-Ra': 'Slow illusion clearing; unconventional duties or foreign work with delays.',
  'Me-Me': 'Mind’s programmer phase — “who am I / what should I learn?”; old patterns refresh.',
  'Me-Ke': 'Silent wisdom — knowledge without peace if overloaded; learn the language of stillness.',
  'Me-Ve': 'Thoughts + aesthetics — creativity, style, collaborations; don’t force logic onto feelings.',
  'Me-Su': 'Identity recognition — leadership and public voice; avoid “I know everything” ego inflation.',
  'Me-Mo': 'Logic vs emotion conflict — pause overnight before important decisions.',
  'Me-Ma': 'Execution mode — plans become action; watch burnout and haste.',
  'Me-Ra': 'Virtual / information illusion trap — verify sources; fame on digital platforms possible.',
  'Me-Ju': 'Data meets wisdom — knowing ≠ understanding; purpose clarifies if you stay open.',
  'Me-Sa': 'Reality test — grounds dreams; builds platform for the next period’s harvest.',
  'Ju-Ju': 'Expansion of faith and teaching; over-optimism needs a budget.',
  'Ju-Sa': 'Wisdom meets duty — slow dharmic gains; avoid moral rigidity.',
  'Ju-Me': 'Teaching, publishing, counsel; intellect serves a larger purpose.',
  'Ju-Ra': 'Unconventional gurus or foreign wisdom; filter hype from truth.',
  'Ju-Ke': 'Detached wisdom; sudden cuts in over-expansion; spiritual tilt.',
  'Ra-Ve': 'Same memorable Maya imprint as Venus–Rahu — events stamp the subconscious.',
  'Ra-Ra': 'Ambition peaks — verify motives; mid-cycle ego checks are common.',
  'Ra-Ju': 'Illusion toward wisdom — platform for later Jupiter lessons.',
  'Ra-Sa': 'Slow shadow work; unconventional structures and delayed breakthroughs.',
  'Ra-Me': 'Information overload / digital branding; stay reality-checked.',
  'Ra-Ke': 'Shadow axis — abrupt pivots between craving and detachment.',
  'Ke-Ke': 'Deep detachment — period can feel brief; release what no longer fits.',
  'Ke-Ve': 'Spiritual light after release; relationships may feel otherworldly or distant.',
  'Ke-Su': 'Ego dissolves around status; research or occult career flashes.',
  'Ke-Mo': 'Emotional release; mind seeks solitude or unusual healing paths.',
  'Ke-Ma': 'Sudden action cuts; martial energy without attachment.',
  'Ke-Ra': 'Karmic axis flip — craving returns briefly then drops again.',
}

export const VIMSHOTTARI_INTERPRETATIONS: Record<string, VimshottariInterpretation> = {
  Su: {
    lord: 'Su',
    title: 'The Royal Sovereign',
    years: VIMSHOTTARI_YEARS.Su,
    nature: 'Mixed',
    keyTheme: 'Soul, authority & ego work',
    primaryPositive: 'Fame, authority, promotions, government favour when well placed',
    secondaryBenefits: 'Self-respect, punctuality, leadership; transfers to better roles',
    psychologicalState: 'Drive and passion rise; ego and superiority feelings may surface early',
    negativeEffects: 'Afflicted Sun: loss of respect, raids/pressure, ego humiliation cycles',
    healthCaution: 'After early boosts, short health dips or stress around status are common — not medical advice',
    lifeEvents: 'Career jumps, awards, father/authority themes, public reputation shifts',
    phaseStart: 'Negative traits and ego can show first even as results arrive',
    phaseMiddle: 'Peak generosity, activity, and achievement',
    phaseEnd: 'Self-reflection; isolation despite success; prepares for Moon’s emotional work',
  },
  Mo: {
    lord: 'Mo',
    title: 'The Emotional Ocean',
    years: VIMSHOTTARI_YEARS.Mo,
    nature: 'Mixed',
    keyTheme: 'Mind, emotion & course correction',
    primaryPositive: 'Wealth continuity, female support, home building when Moon is strong',
    secondaryBenefits: 'Bhakti inclination, family proximity needs, food and comfort themes',
    psychologicalState: 'Emotional extremes; need for companionship after Sun’s self-focus',
    negativeEffects: 'Afflicted Moon: unrest, mother conflicts, draining of prior gains',
    healthCaution: 'Weak / dark Moon themes can stress mind and digestion — seek professionals for health concerns',
    lifeEvents: 'Home changes, career pivots, emotional bonds, spending patterns shift',
    phaseStart: 'House-placement results dominate first',
    phaseMiddle: 'Sign (rashi) significations peak',
    phaseEnd: 'Aspect results and Lagna themes; path often changes from the prior dasha',
  },
  Ma: {
    lord: 'Ma',
    title: 'The Dynamic Warrior',
    years: VIMSHOTTARI_YEARS.Ma,
    nature: 'Mixed',
    keyTheme: 'Action period after emotional work — courage & competition',
    primaryPositive: 'Initiative, technical skill, property/land effort, competitive wins when strong; Yogakaraka lift for Cancer/Leo',
    secondaryBenefits: 'Energy for projects, siblings, engineering, sports, surgical precision themes by house',
    psychologicalState: 'Drive and urgency; need to prove strength; impatience if afflicted',
    negativeEffects: 'Conflicts, haste, accidents of effort, anger loops when poorly placed or aspected by malefics',
    healthCaution: 'Heat, inflammation, blood, and injury risk rise with affliction — not medical advice',
    lifeEvents: 'Travel, construction, fights for position, skill proving, military/tech/competitive careers',
    phaseStart: 'Years 1–2: energy surges — choose constructive channels before conflict',
    phaseMiddle: 'Peak execution, competition, and visible results of effort',
    phaseEnd: 'Consolidate wins; avoid last-minute battles that undo gains',
  },
  Me: {
    lord: 'Me',
    title: 'The Intellectual Messenger',
    years: VIMSHOTTARI_YEARS.Me,
    nature: 'Benefic',
    keyTheme: 'Decoding karma through intellect',
    primaryPositive: 'Business, writing, analysis, networking, intellect-based income',
    secondaryBenefits: 'Vak power, learning, multitasking, digital/tech affinity',
    psychologicalState: 'Fast mind; over-analysis; mirror people who think like you',
    negativeEffects: 'Afflicted with Rahu/Saturn: mental maze, identity fog — last phase still grounds',
    healthCaution: 'Sleep and digestion suffer from overthinking — rest the nervous system',
    lifeEvents: 'Career profile shifts toward data/comms; documents and deals matter',
    phaseStart: 'Years 1–3: speed matching — many starts at once',
    phaseMiddle: 'Years 4–10: experiments, communication power, practical peak',
    phaseEnd: 'Years 11–17: intellect matures into wisdom',
  },
  Ju: {
    lord: 'Ju',
    title: 'The Great Benevolent',
    years: VIMSHOTTARI_YEARS.Ju,
    nature: 'Benefic',
    keyTheme: 'Expansion, dharma & guidance after Rahu’s illusions',
    primaryPositive: 'Wisdom, teaching, children (age-appropriate), wealth of faith, counsel roles',
    secondaryBenefits: 'Mentors, ethics, long-term vision, publishing, travel for learning',
    psychologicalState: 'Optimism and principle; can become preachy or rigid if afflicted',
    negativeEffects: 'Over-expansion, delayed projects, moral conflicts, hollow advice when weak or with Rahu',
    healthCaution: 'Liver/weight/sugar themes when afflicted — lifestyle first; not medical advice',
    lifeEvents: 'Education, marriage support, dharmic opportunities, guidance of others',
    phaseStart: 'Opportunity doors open after prior confusion; filter greed from growth',
    phaseMiddle: 'Teaching, expansion, and visible fruits of faith peak',
    phaseEnd: 'Consolidate wisdom; prepare for Saturn’s accounting if Saturn follows',
  },
  Ve: {
    lord: 'Ve',
    title: 'The Artist of Life',
    years: VIMSHOTTARI_YEARS.Ve,
    nature: 'Highly Benefic',
    keyTheme: 'From bhoga (enjoyment) to shuddhi (purification)',
    primaryPositive: 'Comforts, creativity, relationships, luxury skills that last a lifetime',
    secondaryBenefits: 'Fashion, vehicles, artistic career, offerings and opportunities',
    psychologicalState: 'Attachment tests; desire fulfilment through right or wrong means per placement',
    negativeEffects: 'Over-indulgence, speech/intention karma returning quickly; mid-dasha confusion',
    healthCaution: 'Hormonal balance, teeth, sugar, kidneys, spice/smoke sensitivity — soft caution only',
    lifeEvents: 'Love bonds, style shifts, pets/land themes by house, memorable Venus–Rahu chapters',
    phaseStart: 'Years 1–5: invitation to Maya — wants multiply',
    phaseMiddle: 'Years 6–15: testing, filtering, then purification of values',
    phaseEnd: 'Years 16–20: bhoga toward yoga — fruits of karma and inner light',
  },
  Sa: {
    lord: 'Sa',
    title: 'The Lord of Karma',
    years: VIMSHOTTARI_YEARS.Sa,
    nature: 'Mixed',
    keyTheme: 'Reality check, discipline & lasting structures',
    primaryPositive: 'Position, stability, land, house, factory — slow but permanent gains',
    secondaryBenefits: 'True companions remain; documentation and legacy skills',
    psychologicalState: 'Laziness as a test; solitude; emotional immaturity early → maturity later',
    negativeEffects: 'Illusion removal hurts; false relationships end; fear and delay if resisting change',
    healthCaution: 'Back, knees, nerves, stiffness — walking/yoga help; solitude + phone can worsen mood',
    lifeEvents: 'Restructuring career/roles; hierarchy tests; last years can repay long struggle',
    phaseStart: 'Years 1–6: restructuring, ego alignment, exhaustion from running around',
    phaseMiddle: 'Years 7–13: self-control and authority with time',
    phaseEnd: 'Years 14–19: realization and rewards for patience',
  },
  Ra: {
    lord: 'Ra',
    title: 'The Ambitious Shadow',
    years: VIMSHOTTARI_YEARS.Ra,
    nature: 'Mixed',
    keyTheme: 'From illusion (bhram) to awareness (bodh)',
    primaryPositive: 'Ambition, innovation, foreign/tech paths, material breakthroughs',
    secondaryBenefits: 'Research passion, unconventional careers, eventual spiritual seed',
    psychologicalState: 'Restlessness, rebellion, neural hyper-focus; mid-period ego crush common',
    negativeEffects: 'Confusion, status swings, addiction loops, validation hunger (digital age)',
    healthCaution: 'Migraine, skin, nerves, infections — diagnosis can be unclear when afflicted',
    lifeEvents: 'Marriage if age-fit, career pivots, mid-dasha setback then rebuild, prep for Jupiter',
    phaseStart: 'Ambition and risk appetite spike',
    phaseMiddle: 'Often years 6–7: reality check / ego collapse then rebuild',
    phaseEnd: 'Detachment and wisdom residue that lasts a lifetime',
  },
  Ke: {
    lord: 'Ke',
    title: 'The Spiritual Liberator',
    years: VIMSHOTTARI_YEARS.Ke,
    nature: 'Mixed',
    keyTheme: 'Detachment, insight & sudden accounting',
    primaryPositive: 'Insight, research depth, spiritual openings; sudden gains possible',
    secondaryBenefits: 'Past-life skill flashes; liberation from false bonds',
    psychologicalState: 'Detachment; period can pass quickly without full awareness',
    negativeEffects: 'What is closest to the heart may be tested or taken; loss as teaching',
    healthCaution: 'Mysterious or hard-to-pin symptoms when afflicted — get proper diagnosis',
    lifeEvents: 'Separations, occult interest, inheritance/sudden money with strings',
    phaseStart: 'Detachment begins — notice what you release',
    phaseMiddle: 'Inner research and unconventional insight',
    phaseEnd: 'Quick closure; what remains is essential',
  },
}

export function getVimshottariInterpretation(lord: string): VimshottariInterpretation | null {
  return VIMSHOTTARI_INTERPRETATIONS[lord] ?? null
}

export function getVimshottariAntarHint(mahaLord: string, antarLord: string): string | null {
  return VIMSHOTTARI_ANTAR_HINTS[`${mahaLord}-${antarLord}`] ?? null
}

export function isBeneficVimNature(nature: VimshottariNature): boolean {
  return nature === 'Benefic' || nature === 'Highly Benefic'
}

export function isMaleficVimNature(nature: VimshottariNature): boolean {
  return nature === 'Malefic' || nature === 'Highly Malefic'
}
