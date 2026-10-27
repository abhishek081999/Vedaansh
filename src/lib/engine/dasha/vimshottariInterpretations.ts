// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/vimshottariInterpretations.ts
//  Condensed Vimshottari Mahadasha narratives (educational, safety-filtered)
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
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
  'Read results in this order: the houses, then the signs, then the planet’s natural significations, then the planets that aspect it, then the houses it aspects, then its conjunctions. Every mahadasha can touch home, money, career, and relationship. It is never only one house.'

/** High-value Antar hints only (not a full 9×9 matrix). Key = `${MD}-${AD}`. */
export const VIMSHOTTARI_ANTAR_HINTS: Record<string, string> = {
  'Su-Su': 'A quick rise in career is possible. After the lift, watch the ego, false accusation, and brief dips in health.',
  'Su-Mo': 'Authority meets feeling. Public image and private mood pull apart, and a transfer or a change of home is possible.',
  'Su-Ma': 'The drive for status turns aggressive. If Mars is heated, conflict with superiors or siblings is likely.',
  'Su-Me': 'Career turns on speech, paperwork, and the contacts that open a promotion.',
  'Su-Ju': 'Mentors and a sense of ethics support your authority. Roles in teaching or counsel can open.',
  'Su-Ve': 'Status and comfort pull together. Watch spending that is really about image.',
  'Su-Sa': 'Duty tests authority. Accept the limits, and career structures form slowly and hold.',
  'Su-Ra': 'Status can swing suddenly, often along an unconventional path. Verify the ground before you leap.',
  'Su-Ke': 'Projects of the ego lose their hold. Career tilts toward research, or toward the occult.',
  'Mo-Mo': 'Money can arrive alongside emotional lows. Mood runs to the extremes, with little middle ground.',
  'Mo-Ra': 'Distance from family is likely. If the Moon is weak and Rahu is strong, Rahu can still rescue the situation by an unconventional route.',
  'Mo-Sa': 'A Vish Yoga colouring: mental labour intensifies, and negativity rises unless Saturn is well placed.',
  'Mo-Ma': 'Physical effort and travel increase. Action takes the place of contemplation.',
  'Mo-Me': 'Spending turns toward self-growth. Career decisions need extra care; avoid an impulsive change of course.',
  'Mo-Ve': 'If the Sun was strong and the Moon is afflicted, gains from the previous period can drain quickly.',
  'Mo-Su': 'The closing phase of the Moon can place the whole personality in the light. An illness from earlier years may finally receive clear treatment, or stress may peak. This is not medical advice.',
  'Mo-Ju': 'Emotional wisdom returns, and so does support from elders. Faith is restored after earlier unrest.',
  'Ma-Ma': 'Warrior energy peaks. Compete, build, and travel, and put the heat into skill rather than quarrel.',
  'Ma-Me': 'Strategy meets action, above all in technology, engineering, or sharp negotiation.',
  'Ma-Ju': 'Courage takes a dharmic form: you teach by what you do. Avoid righteous anger.',
  'Ma-Sa': 'Frustration comes first, then discipline. A long project finally moves if you stay patient.',
  'Ma-Ra': 'Fights can break out suddenly, including contests over foreign matters or technology. Adrenaline runs high; pause before you take a risk.',
  'Ma-Ke': 'Action becomes detached. Conflict, or a matter of property, can be cut off suddenly.',
  'Ve-Ve': 'The seed of bhoga, enjoyment, sprouts. Attraction to comfort and to attachment grows strong.',
  'Ve-Su': 'Ego and self-image come alive. Style and status turn on “me and mine.”',
  'Ve-Mo': 'The heart wakes: a search for a soulmate, old feeling, and the possibility of heartbreak.',
  'Ve-Ma': 'The senses and the drive both run hot. Keep impulsiveness in check, in relationship and in conflict.',
  'Ve-Me': 'Mind and heart compete. The pull is toward practical work rather than pure romance.',
  'Ve-Ju': 'Wisdom appears, and so do mentors. Romance looks for a balance with dharma.',
  'Ve-Sa': 'Past indulgence comes due. Boundaries, patience, and a reality check on relationship follow.',
  'Ve-Ra': 'For many this is the most memorable antardasha: maya meets maya. Events imprint the subconscious, and transformation follows. Take extra care before any major medical procedure.',
  'Ve-Ke': 'Detachment begins. A relationship, or a layer of identity, may fall away, and an early spiritual light appears.',
  'Sa-Sa': 'Saturn doubled: the restructuring is heavy. These are the foundation years for the rest of the mahadasha.',
  'Sa-Me': 'Speech, documents, and skill all ask for patience. Careless paperwork now returns in a later period.',
  'Sa-Ke': 'For about a year, uncertainty and separation dominate. Isolation can push you toward a mentor.',
  'Sa-Ve': 'Duty and comfort pull apart. A relationship either matures or ends, and luxury is earned slowly.',
  'Sa-Su': 'Authority comes under scrutiny. The ego learns hierarchy, and it learns time.',
  'Sa-Mo': 'Emotional coldness comes first, then maturity. Family duty intensifies.',
  'Sa-Ma': 'Effort meets friction. Physical labour increases, and so do boundaries.',
  'Sa-Ju': 'Teaching arrives as karma. Mentors demand discipline, and wisdom comes through the work itself.',
  'Sa-Ra': 'Illusion clears slowly. Duty turns unconventional, or foreign work arrives with delay.',
  'Me-Me': 'The mind enters its programming phase: who am I, and what should I learn? Old patterns refresh.',
  'Me-Ke': 'Wisdom turns quiet. Too much knowledge brings no peace; learn the language of stillness.',
  'Me-Ve': 'Thought meets aesthetics: creativity, style, and collaboration. Do not force logic onto feeling.',
  'Me-Su': 'Identity is recognised. Leadership and a public voice open. Avoid the swelling ego of “I know everything.”',
  'Me-Mo': 'Logic vs emotion: pause overnight before an important decision.',
  'Me-Ma': 'This is execution. Plans become action. Watch burnout, and watch haste.',
  'Me-Ra': 'A trap of virtual and informational illusion. Verify your sources. Fame on a digital platform is possible.',
  'Me-Ju': 'Data meets wisdom. Knowing is not the same as understanding. Purpose clarifies if you stay open.',
  'Me-Sa': 'A test of reality. Dreams are brought to ground, and a platform is laid for the harvest of the next period.',
  'Ju-Ju': 'Faith and teaching expand. Optimism that runs ahead of the facts still needs a budget.',
  'Ju-Sa': 'Wisdom meets duty. Dharmic gain comes slowly. Avoid moral rigidity.',
  'Ju-Me': 'Teaching, publishing, and counsel. The intellect serves a larger purpose.',
  'Ju-Ra': 'A guru may be unconventional, and wisdom may come from abroad. Separate hype from truth.',
  'Ju-Ke': 'Wisdom turns detached. Over-expansion can be cut suddenly, and the tilt is spiritual.',
  'Ra-Ve': 'The same memorable imprint of maya as Venus with Rahu: events stamp the subconscious.',
  'Ra-Ra': 'Ambition peaks. Verify your motives. A check on the ego is common around the middle of the cycle.',
  'Ra-Ju': 'Illusion turns toward wisdom, and a platform is laid for the lessons Jupiter will teach later.',
  'Ra-Sa': 'Work with the shadow proceeds slowly. The structures are unconventional, and the breakthroughs are delayed.',
  'Ra-Me': 'Information overloads, and so does digital branding. Stay checked against reality.',
  'Ra-Ke': 'Along the shadow axis, the pivot between craving and detachment is abrupt.',
  'Ke-Ke': 'Detachment runs deep. The period can feel brief. Release what no longer fits.',
  'Ke-Ve': 'After the release, a spiritual light appears. Relationship may feel otherworldly, or simply distant.',
  'Ke-Su': 'The ego dissolves around status. A flash of research, or of an occult career, can appear.',
  'Ke-Mo': 'Emotion is released. The mind seeks solitude, or an unusual path of healing.',
  'Ke-Ma': 'Action is cut off suddenly. Martial energy remains, without attachment.',
  'Ke-Ra': 'The karmic axis flips. Craving returns for a short while, then drops again.',
}

export const VIMSHOTTARI_INTERPRETATIONS: Record<string, VimshottariInterpretation> = {
  Su: {
    lord: 'Su',
    title: 'The Royal Sovereign',
    years: VIMSHOTTARI_YEARS.Su,
    nature: 'Mixed',
    keyTheme: 'Soul, authority, and the work of the ego',
    primaryPositive: 'Fame, authority, promotion, and official favour, when the Sun is well placed',
    secondaryBenefits: 'Self-respect, punctuality, and leadership, with a transfer into a better role',
    psychologicalState: 'Drive and passion rise. Feelings of ego and superiority may surface early.',
    negativeEffects: 'An afflicted Sun brings loss of respect, pressure or inquiry, and cycles of humiliation for the ego',
    healthCaution: 'After an early lift, a brief dip in health or stress around status is common. This is not medical advice.',
    lifeEvents: 'A jump in career, an award, themes of father and authority, and a shift in public reputation',
    phaseStart: 'Difficult traits, and the ego, can show first, even as the results arrive',
    phaseMiddle: 'Generosity, activity, and achievement reach their peak',
    phaseEnd: 'A turn toward self-reflection, and a solitude that success does not remove. This prepares the emotional work of the Moon.',
  },
  Mo: {
    lord: 'Mo',
    title: 'The Emotional Ocean',
    years: VIMSHOTTARI_YEARS.Mo,
    nature: 'Mixed',
    keyTheme: 'Mind, emotion, and a correction of course',
    primaryPositive: 'Wealth that continues, support from women, and the building of a home, when the Moon is strong',
    secondaryBenefits: 'A turn toward bhakti, a need to stay near family, and themes of food and comfort',
    psychologicalState: 'Emotion runs to extremes. After the Sun’s focus on the self, companionship is needed.',
    negativeEffects: 'An afflicted Moon brings unrest, conflict with the mother, and a draining of earlier gains',
    healthCaution: 'A weak or dark Moon can strain the mind and the digestion. Take health concerns to a professional.',
    lifeEvents: 'A change of home, a pivot in career, emotional bonds, and a shift in how money is spent',
    phaseStart: 'The results of house placement dominate at first',
    phaseMiddle: 'The significations of the sign reach their peak',
    phaseEnd: 'Results of aspect, and themes of the lagna. The path often changes from the dasha before.',
  },
  Ma: {
    lord: 'Ma',
    title: 'The Dynamic Warrior',
    years: VIMSHOTTARI_YEARS.Ma,
    nature: 'Mixed',
    keyTheme: 'A period of action after emotional work: courage and competition',
    primaryPositive: 'Initiative, technical skill, effort on property and land, and competitive wins when Mars is strong. A yogakaraka lift for Cancer and Leo.',
    secondaryBenefits: 'Energy for projects, siblings, engineering, sport, and, by house, the precision of surgery',
    psychologicalState: 'Drive and urgency. A need to prove strength. Impatience if Mars is afflicted.',
    negativeEffects: 'Conflict, haste, accidents of effort, and loops of anger, when Mars is poorly placed or aspected by malefics',
    healthCaution: 'Heat, inflammation, blood, and the risk of injury rise with affliction. This is not medical advice.',
    lifeEvents: 'Travel, construction, a fight for position, the proving of skill, and careers in the military, technology, or competition',
    phaseStart: 'Years 1–2: energy surges. Choose a constructive channel before conflict begins.',
    phaseMiddle: 'Execution, competition, and the visible results of effort reach their peak',
    phaseEnd: 'Consolidate what you have won. Avoid a last-minute battle that undoes the gain.',
  },
  Me: {
    lord: 'Me',
    title: 'The Intellectual Messenger',
    years: VIMSHOTTARI_YEARS.Me,
    nature: 'Benefic',
    keyTheme: 'Reading karma through the intellect',
    primaryPositive: 'Business, writing, analysis, networking, and income that rests on the intellect',
    secondaryBenefits: 'Power of speech, learning, many tasks at once, and an affinity for the digital and the technical',
    psychologicalState: 'The mind is fast. Analysis runs past what is useful. You mirror people who think as you do.',
    negativeEffects: 'Afflicted by Rahu or Saturn: a mental maze and a fog of identity. The last phase still brings you to ground.',
    healthCaution: 'Sleep and digestion suffer from overthinking. Rest the nervous system.',
    lifeEvents: 'The career profile shifts toward data and communication. Documents and deals matter.',
    phaseStart: 'Years 1–3: a matching of speed. Many beginnings at once.',
    phaseMiddle: 'Years 4–10: experiment, power of communication, and a practical peak',
    phaseEnd: 'Years 11–17: intellect matures into wisdom',
  },
  Ju: {
    lord: 'Ju',
    title: 'The Great Benevolent',
    years: VIMSHOTTARI_YEARS.Ju,
    nature: 'Benefic',
    keyTheme: 'Expansion, dharma, and guidance after the illusions of Rahu',
    primaryPositive: 'Wisdom, teaching, children when age allows, the wealth of faith, and roles of counsel',
    secondaryBenefits: 'Mentors, ethics, a long view, publishing, and travel undertaken in order to learn',
    psychologicalState: 'Optimism and principle. If Jupiter is afflicted, this can turn preachy or rigid.',
    negativeEffects: 'Over-expansion, delayed projects, moral conflict, and advice that rings hollow, when Jupiter is weak or with Rahu',
    healthCaution: 'Themes of liver, weight, and sugar when afflicted. Begin with how you live. This is not medical advice.',
    lifeEvents: 'Education, support around marriage, a dharmic opportunity, and the guidance of others',
    phaseStart: 'Doors of opportunity open after earlier confusion. Separate greed from growth.',
    phaseMiddle: 'Teaching, expansion, and the visible fruit of faith reach their peak',
    phaseEnd: 'Consolidate the wisdom. If Saturn follows, prepare for Saturn’s accounting.',
  },
  Ve: {
    lord: 'Ve',
    title: 'The Artist of Life',
    years: VIMSHOTTARI_YEARS.Ve,
    nature: 'Highly Benefic',
    keyTheme: 'From bhoga, enjoyment, toward shuddhi, purification',
    primaryPositive: 'Comfort, creativity, relationship, and skills of luxury that last a lifetime',
    secondaryBenefits: 'Fashion, vehicles, an artistic career, and offerings and opportunities that arrive',
    psychologicalState: 'Attachment is tested. Desire is fulfilled by right means or wrong ones, according to the placement.',
    negativeEffects: 'Over-indulgence, and the karma of speech and intention returning quickly. Confusion around the middle of the dasha.',
    healthCaution: 'A soft caution only: hormonal balance, teeth, sugar, the kidneys, and sensitivity to spice or smoke.',
    lifeEvents: 'Bonds of love, a shift of style, themes of pets or land according to the house, and a memorable chapter of Venus with Rahu',
    phaseStart: 'Years 1–5: an invitation into maya. Wants multiply.',
    phaseMiddle: 'Years 6–15: testing, then filtering, then a purification of values',
    phaseEnd: 'Years 16–20: bhoga turns toward yoga. The fruit of karma, and an inner light.',
  },
  Sa: {
    lord: 'Sa',
    title: 'The Lord of Karma',
    years: VIMSHOTTARI_YEARS.Sa,
    nature: 'Mixed',
    keyTheme: 'A check against reality, discipline, and structures that last',
    primaryPositive: 'Position, stability, land, a house, a factory: gains that are slow and permanent',
    secondaryBenefits: 'True companions remain. Skill in documents, and skill that becomes a legacy.',
    psychologicalState: 'Laziness as a test, and solitude. Emotional immaturity early, maturity later.',
    negativeEffects: 'The removal of illusion hurts. A false relationship ends. Fear and delay if you resist the change.',
    healthCaution: 'Back, knees, nerves, and stiffness. Walking and yoga help. Solitude with a phone can worsen the mood.',
    lifeEvents: 'A restructuring of career and role, a test of hierarchy, and final years that can repay a long struggle',
    phaseStart: 'Years 1–6: restructuring, an alignment of the ego, and exhaustion from running in circles',
    phaseMiddle: 'Years 7–13: self-control, and authority that comes with time',
    phaseEnd: 'Years 14–19: realisation, and the reward of patience',
  },
  Ra: {
    lord: 'Ra',
    title: 'The Ambitious Shadow',
    years: VIMSHOTTARI_YEARS.Ra,
    nature: 'Mixed',
    keyTheme: 'From illusion, bhram, toward awareness, bodh',
    primaryPositive: 'Ambition, innovation, a foreign or technical path, and a material breakthrough',
    secondaryBenefits: 'A passion for research, an unconventional career, and, in time, a spiritual seed',
    psychologicalState: 'Restlessness, rebellion, and a mind that locks onto one thing. A crushing of the ego around the middle is common.',
    negativeEffects: 'Confusion, swings of status, loops of addiction, and a hunger for validation, especially in the digital age',
    healthCaution: 'Migraine, skin, nerves, and infection. When Rahu is afflicted, the diagnosis can stay unclear.',
    lifeEvents: 'Marriage when age allows, a pivot of career, a setback in the middle followed by a rebuild, and preparation for Jupiter',
    phaseStart: 'Ambition spikes, and so does the appetite for risk',
    phaseMiddle: 'Often years 6–7: a check against reality, a collapse of the ego, then a rebuild',
    phaseEnd: 'Detachment, and a residue of wisdom that lasts a lifetime',
  },
  Ke: {
    lord: 'Ke',
    title: 'The Spiritual Liberator',
    years: VIMSHOTTARI_YEARS.Ke,
    nature: 'Mixed',
    keyTheme: 'Detachment, insight, and a sudden accounting',
    primaryPositive: 'Insight, depth of research, and a spiritual opening. A sudden gain is possible.',
    secondaryBenefits: 'A flash of skill from a former life, and release from a bond that was false',
    psychologicalState: 'Detachment. The period can pass quickly, before you have fully noticed it.',
    negativeEffects: 'What is closest to the heart may be tested, or taken. The loss is the teaching.',
    healthCaution: 'When Ketu is afflicted, symptoms can be mysterious or hard to name. Get a proper diagnosis.',
    lifeEvents: 'Separation, an interest in the occult, and inheritance or sudden money that comes with conditions',
    phaseStart: 'Detachment begins. Notice what you release.',
    phaseMiddle: 'Inner research, and insight that does not follow the usual path',
    phaseEnd: 'A quick close. What remains is what is essential.',
  },
}

export function getVimshottariInterpretation(lord: string): VimshottariInterpretation | null {
  return VIMSHOTTARI_INTERPRETATIONS[lord] ?? null
}

export function getVimshottariAntarHint(mahaLord: string, antarLord: string): string | null {
  return VIMSHOTTARI_ANTAR_HINTS[`${mahaLord}-${antarLord}`] ?? null
}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000

/** Format antardasha length for UI (months when under ~1.5y). */
export function formatVimshottariDurationYears(years: number): string {
  if (!Number.isFinite(years) || years <= 0) return 'Sub-period'
  if (years < 1.5) {
    const months = Math.max(1, Math.round(years * 12))
    return months === 1 ? '1 Month' : `${months} Months`
  }
  const rounded = Math.round(years * 10) / 10
  return `${rounded} ${rounded === 1 ? 'Year' : 'Years'}`
}

export function durationMsToYears(durationMs: number): number {
  return durationMs / MS_PER_YEAR
}

/**
 * Antardasha narrative — never reuse the full mahadasha essay/years for the AD lord.
 * Prefer the MD–AD pair hint when present; otherwise synthesise a sub-period colouring of the MD.
 */
export function buildVimshottariAntarInterpretation(
  mahaLord: string,
  antarLord: string,
  durationYears: number,
): VimshottariInterpretation | null {
  const maha = getVimshottariInterpretation(mahaLord)
  const antar = getVimshottariInterpretation(antarLord)
  if (!maha || !antar) return null

  const hint = getVimshottariAntarHint(mahaLord, antarLord)
  const mahaName = GRAHA_NAMES[maha.lord] ?? mahaLord
  const antarName = GRAHA_NAMES[antar.lord] ?? antarLord
  const sameLord = mahaLord === antarLord

  const title = sameLord
    ? `${antar.title} · Opening Antar`
    : `${antarName} Antar in ${mahaName} MD`

  const keyTheme = sameLord
    ? `First colour of ${maha.keyTheme}`
    : `${antar.keyTheme}, colouring the ${mahaName} mahadasha`

  const primaryPositive = hint
    ?? (sameLord
      ? `This antardasha opens the ${mahaName} mahadasha. Early results often echo ${antar.keyTheme}, and they are usually a setup rather than the full harvest of the mahadasha.`
      : `Within the ${mahaName} mahadasha (${maha.keyTheme}), this ${antarName} antardasha colours the timing with ${antar.keyTheme}.`)

  const secondaryBenefits = hint
    ? `The mahadasha backdrop is ${maha.keyTheme}. The antar planet brings ${antar.primaryPositive}.`
    : `Expect ${antar.primaryPositive} as a sub-theme, not as the full story of a ${antarName} mahadasha. The houses and signs of the mahadasha still set the stage.`

  const psychologicalState = sameLord
    ? `The tone of the new mahadasha arrives. ${antar.psychologicalState}`
    : `The mind mixes the aims of ${mahaName} with the habits of ${antarName}. ${antar.psychologicalState}`

  const negativeEffects = antar.negativeEffects
    ? `An antar caution, secondary to the mahadasha: ${antar.negativeEffects}`
    : maha.negativeEffects
      ? `Watch the pressure of the mahadasha during this antar: ${maha.negativeEffects}`
      : null

  const healthCaution = antar.healthCaution ?? maha.healthCaution

  const lifeEvents = hint
    ?? `Events tilt toward ${antar.lifeEvents}, while the larger ${mahaName} chapter continues: ${maha.lifeEvents}.`

  return {
    lord: antar.lord,
    title,
    years: durationYears > 0 ? durationYears : antar.years / 9,
    nature: antar.nature,
    keyTheme,
    primaryPositive,
    secondaryBenefits,
    psychologicalState,
    negativeEffects,
    healthCaution,
    lifeEvents,
    phaseStart: sameLord
      ? 'The opening antar is often a phase of setup and struggle. It seeds the rest of the mahadasha.'
      : `${antarName} themes enter under ${mahaName}. Notice the shift in pace and in focus.`,
    phaseMiddle: hint
      ? `The peak of this pair: ${hint}`
      : `In the middle, ${antar.keyTheme} is most visible inside the ongoing ${maha.keyTheme}.`,
    phaseEnd: 'As this antar fades, the next antardasha reframes the same mahadasha.',
  }
}

/**
 * Pratyantardasha narrative — finest of the three visible layers.
 * Never reuse a full mahadasha essay; colours MD→AD with a short PD note.
 */
export function buildVimshottariPratyantarInterpretation(
  mahaLord: string,
  antarLord: string,
  pratyaLord: string,
  durationYears: number,
): VimshottariInterpretation | null {
  const maha = getVimshottariInterpretation(mahaLord)
  const antar = getVimshottariInterpretation(antarLord)
  const pratya = getVimshottariInterpretation(pratyaLord)
  if (!maha || !antar || !pratya) return null

  const mahaName = GRAHA_NAMES[maha.lord] ?? mahaLord
  const antarName = GRAHA_NAMES[antar.lord] ?? antarLord
  const pratyaName = GRAHA_NAMES[pratya.lord] ?? pratyaLord
  const antarHint = getVimshottariAntarHint(mahaLord, antarLord)

  const title = `${pratyaName} Pratyantar · ${antarName}/${mahaName}`
  const keyTheme = `${pratya.keyTheme} inside ${antarName} antar`

  const primaryPositive =
    pratyaLord === antarLord && antarLord === mahaLord
      ? `A peak concentration of ${pratyaName} themes, nested from mahadasha through antardasha to pratyantar: a short, intense colouring of ${maha.keyTheme}.`
      : `Fine timing. The ${pratyaName} pratyantar colours the ${antarName} antar, within the ${mahaName} mahadasha, with ${pratya.keyTheme}.`

  return {
    lord: pratya.lord,
    title,
    years: durationYears > 0 ? durationYears : antar.years / 81,
    nature: pratya.nature,
    keyTheme,
    primaryPositive,
    secondaryBenefits: antarHint
      ? `The antar backdrop: ${antarHint} The pratyantar adds ${pratya.primaryPositive}.`
      : `Mahadasha (${mahaName}): ${maha.keyTheme}. Antardasha (${antarName}): ${antar.keyTheme}. The pratyantar adds ${pratya.primaryPositive}.`,
    psychologicalState: `For a short span the mind mixes the habits of ${pratyaName} into the ongoing chapter of ${antarName} and ${mahaName}. ${pratya.psychologicalState}`,
    negativeEffects: pratya.negativeEffects
      ? `A brief pratyantar caution: ${pratya.negativeEffects}`
      : antar.negativeEffects
        ? `Watch the pressure of the antar in this pratyantar: ${antar.negativeEffects}`
        : null,
    healthCaution: pratya.healthCaution ?? antar.healthCaution ?? maha.healthCaution,
    lifeEvents: `Short events tilt toward ${pratya.lifeEvents}, while the ${antarName} antar and the ${mahaName} mahadasha continue.`,
    phaseStart: `${pratyaName} enters as a micro-theme under ${antarName} and ${mahaName}.`,
    phaseMiddle: `In the middle, ${pratya.keyTheme} is most visible in day-to-day timing.`,
    phaseEnd: 'As this pratyantar ends, the next one reframes the same antardasha.',
  }
}

export function isBeneficVimNature(nature: VimshottariNature): boolean {
  return nature === 'Benefic' || nature === 'Highly Benefic'
}

export function isMaleficVimNature(nature: VimshottariNature): boolean {
  return nature === 'Malefic' || nature === 'Highly Malefic'
}
