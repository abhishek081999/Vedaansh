// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/predictions.ts
//  Anka Jyotish predictions — life areas, maturity, pinnacles,
//  challenges, life phases, number yogas, annual / monthly forecast
// ─────────────────────────────────────────────────────────────

import type { Gender } from '@/types/astrology'
import {
  numberHarmony,
  reduceToCore,
  sumDigits,
  type Harmony,
  type ParsedDate,
} from './core'
import {
  NUMBER_PROFILES,
  PERSONAL_YEAR_THEMES,
  type CoreNumber,
} from './data'

/** Minimal cycle shape needed for annual / monthly forecast. */
export interface CyclesForPrediction {
  personalYear: CoreNumber
  personalMonth: CoreNumber
  personalDay: CoreNumber
  universalDay: CoreNumber
  cycleYear: number
  yearTheme: { theme: string; guidance: string }
  dayHarmony: Harmony
}

export type LifeAreaId =
  | 'personality'
  | 'career'
  | 'wealth'
  | 'marriage'
  | 'health'
  | 'education'
  | 'children'
  | 'travel'
  | 'spirituality'

export interface LifeAreaPrediction {
  id: LifeAreaId
  label: string
  tone: 'favourable' | 'mixed' | 'caution'
  summary: string
  detail: string
  timing: string
}

export interface MaturityResult {
  value: CoreNumber
  compound: number
  meaning: string
  activatesAroundAge: number
}

export interface ChallengeResult {
  id: string
  label: string
  value: CoreNumber
  lesson: string
}

export interface PinnacleResult {
  index: 1 | 2 | 3 | 4
  value: CoreNumber
  fromAge: number
  toAge: number | null
  theme: string
  guidance: string
  active: boolean
}

export interface LifePhase {
  id: 'moolank' | 'transition' | 'bhagyank'
  label: string
  ageFrom: number
  ageTo: number | null
  ruling: CoreNumber
  rulingLabel: string
  description: string
  active: boolean
}

export interface NumerologyYoga {
  id: string
  name: string
  quality: 'raj' | 'dhana' | 'mixed' | 'dosha'
  present: boolean
  meaning: string
}

export interface AnnualAreaForecast {
  area: LifeAreaId
  label: string
  outlook: 'favourable' | 'mixed' | 'caution'
  text: string
}

export interface MonthlyForecast {
  month: number
  monthName: string
  personalMonth: CoreNumber
  theme: string
  harmony: Harmony
  guidance: string
}

export interface PredictionBundle {
  maturity: MaturityResult
  challenges: ChallengeResult[]
  pinnacles: PinnacleResult[]
  lifePhases: LifePhase[]
  lifeAreas: LifeAreaPrediction[]
  yogas: NumerologyYoga[]
  annual: {
    personalYear: CoreNumber
    theme: string
    overview: string
    areas: AnnualAreaForecast[]
    criticalMonths: number[]
    favourableMonths: number[]
  }
  monthly: MonthlyForecast[]
  powerDays: { day: number; reason: string }[]
  ageNow: number
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

const AREA_LABEL: Record<LifeAreaId, string> = {
  personality: 'Personality & Self',
  career: 'Career & Profession',
  wealth: 'Wealth & Finance',
  marriage: 'Marriage & Relationships',
  health: 'Health',
  education: 'Education & Skills',
  children: 'Children & Legacy',
  travel: 'Travel & Foreign',
  spirituality: 'Spirituality & Inner Life',
}

// ── Life-area text keyed by Moolank (primary) with Bhagyank colouring ─

const AREA_BY_MOOLANK: Record<CoreNumber, Record<LifeAreaId, { summary: string; detail: string; timing: string }>> = {
  1: {
    personality: { summary: 'Born to lead and initiate.', detail: 'Strong will, dignity and originality. You dislike subordination and prefer to set the agenda.', timing: 'Leadership peaks in personal years 1, 5 and 9.' },
    career: { summary: 'Authority, government, medicine, entrepreneurship.', detail: 'Roles with command suit you — administration, surgery, politics, own business. Avoid long periods as a subordinate.', timing: 'Promotion windows: ages 28–35 and personal year 1.' },
    wealth: { summary: 'Wealth through status and self-effort.', detail: 'Money follows recognition. Speculative gains possible but ego-driven risks must be controlled.', timing: 'Favourable: Thursday and Sunday; personal years 1 and 6.' },
    marriage: { summary: 'Needs a respectful, independent partner.', detail: 'Dominating tendencies can strain marriage. Best with numbers 2, 3, 5 or 9. Delay marriage until emotional maturity.', timing: 'Ideal marriage years: personal years 2, 6 or 9 after age 28.' },
    health: { summary: 'Heart, eyes, blood pressure, spine.', detail: 'Overwork and heat aggravate health. Regular cardio and eye care are essential.', timing: 'Watch health in personal years 4 and 8.' },
    education: { summary: 'Strong in leadership and applied sciences.', detail: 'Medicine, engineering, law and management come naturally. Prefer mentorship over rote learning.', timing: 'Peak learning: ages 16–27 (Moolank phase).' },
    children: { summary: 'Proud, protective parent; may expect high standards.', detail: 'Children often inherit ambition. Avoid excessive pressure; cultivate patience.', timing: 'Child-related luck: personal years 3 and 6.' },
    travel: { summary: 'Travel for status, work and recognition.', detail: 'Eastward travel is favourable. Short authoritative tours succeed more than aimless wandering.', timing: 'Best travel months: personal months 1, 5, 9.' },
    spirituality: { summary: 'Surya-bhakti and disciplined worship.', detail: 'Arghya, Aditya Hridayam and respect for father/gurus open the spiritual path.', timing: 'Deepening after age 36 when Bhagyank activates.' },
  },
  2: {
    personality: { summary: 'Sensitive, diplomatic and imaginative.', detail: 'You absorb atmospheres quickly. Intuition is a gift; mood swings are the shadow.', timing: 'Emotional clarity rises in personal years 2 and 6.' },
    career: { summary: 'Arts, healing, hospitality, counselling, liquids.', detail: 'Success through partnership and service more than solo aggression. Avoid harsh competitive fields.', timing: 'Career bloom: ages 28–45 with supportive partners.' },
    wealth: { summary: 'Steady through collaboration, not speculation.', detail: 'Joint ventures and creative income suit you. Sudden schemes rarely stick.', timing: 'Favourable: Monday and Friday; personal years 2 and 6.' },
    marriage: { summary: 'Needs emotional security and gentleness.', detail: 'Best with 1, 5, 7 or another 2. Over-sensitivity needs conscious communication.', timing: 'Marriage after emotional grounding — often after age 27.' },
    health: { summary: 'Chest, lungs, digestion, fluid balance.', detail: 'Emotional stress shows in the body first. Sleep, moonlit walks and hydration matter.', timing: 'Caution in personal years 4, 7 and 8.' },
    education: { summary: 'Arts, languages, psychology, design.', detail: 'Learn best in calm, aesthetic environments. Memorisation through feeling works better than force.', timing: 'Peak: ages 18–30.' },
    children: { summary: 'Nurturing, attached parent.', detail: 'Children may be artistic or sensitive. Avoid transferring anxiety onto them.', timing: 'Favourable child timing: personal years 2, 6, 9.' },
    travel: { summary: 'Water-related and short gentle journeys.', detail: 'North-West travel and sea voyages are supportive. Avoid rushed tours.', timing: 'Best: personal months 2 and 6.' },
    spirituality: { summary: 'Lunar devotion and Shiva/Gauri worship.', detail: 'Monday fasting, milk offerings and mantra of Chandra calm the mind.', timing: 'Spiritual receptivity peaks in personal year 7.' },
  },
  3: {
    personality: { summary: 'Wise, expressive and dharma-oriented.', detail: 'Natural teacher-counsellor energy. Can become preachy or extravagant if unchecked.', timing: 'Expression peaks in personal years 3 and 6.' },
    career: { summary: 'Teaching, law, banking, consulting, priesthood.', detail: 'Knowledge-based professions flourish. Mentorship roles bring long-term reputation.', timing: 'Authority rises after age 32–36.' },
    wealth: { summary: 'Wealth through wisdom and counsel.', detail: 'Jupiter rules expansion — investments that are ethical and long-term suit you. Avoid get-rich schemes.', timing: 'Favourable: Thursday; personal years 3 and 6.' },
    marriage: { summary: 'Seeks a cultured, principled partner.', detail: 'Best with 1, 5, 6 or 9. Marriage often delayed for education or status.', timing: 'Auspicious after personal year 3 milestones.' },
    health: { summary: 'Liver, fat, diabetes tendency, thighs.', detail: 'Moderation in sweets and rich food is non-negotiable.', timing: 'Watch metabolism in personal years 4 and 8.' },
    education: { summary: 'Born student and teacher.', detail: 'Philosophy, law, Sanskrit, finance and higher studies are natural. PhD-level depth is common.', timing: 'Peak: ages 20–36.' },
    children: { summary: 'Children often gifted in studies.', detail: 'You guide well but must avoid lecturing. One child may become a teacher or advisor.', timing: 'Favourable: personal years 3 and 9.' },
    travel: { summary: 'Pilgrimage and knowledge journeys.', detail: 'North-East and sacred sites expand destiny. Foreign education travel is lucky.', timing: 'Best: personal months 3 and 9.' },
    spirituality: { summary: 'Guru-disciple path and Vishnu worship.', detail: 'Thursday rituals, yellow offerings and respect for teachers open doors.', timing: 'Deepening lifelong; strong after age 36.' },
  },
  4: {
    personality: { summary: 'Unconventional, hardworking, original.', detail: 'You see what others miss. Sudden ups and downs teach detachment from fixed plans.', timing: 'Breakthroughs in personal years 4, 5 and 8.' },
    career: { summary: 'Tech, research, media, foreign trade, politics.', detail: 'Non-traditional paths succeed. Routine corporate ladders frustrate you.', timing: 'Foreign or digital careers bloom after age 28.' },
    wealth: { summary: 'Uneven but potentially large.', detail: 'Rahu wealth is sudden — tech IPOs, speculation, foreign remittance. Discipline prevents loss.', timing: 'Favourable: Saturday; personal years 4 and 8 need caution with debt.' },
    marriage: { summary: 'Few close bonds; unconventional match.', detail: 'Best with 1, 5, 6 or 8. Delay and unusual circumstances are common; choose carefully.', timing: 'Marriage often after age 30; personal years 5–6 better.' },
    health: { summary: 'Nerves, anxiety, unexplained ailments.', detail: 'Sleep hygiene and avoiding intoxicants are critical. Regular grounding routines help.', timing: 'High alert in personal years 4 and 7.' },
    education: { summary: 'Technical and research brilliance.', detail: 'Engineering, IT, occult, aviation and experimental fields suit you. Formal exams may feel restrictive.', timing: 'Peak: ages 22–35.' },
    children: { summary: 'Children may be unique or delayed.', detail: 'One child often has unusual talent. Avoid projecting restlessness.', timing: 'Favourable: personal years 5 and 6.' },
    travel: { summary: 'Foreign lands and sudden travel.', detail: 'South-West and overseas moves are destiny markers. Keep documents ready.', timing: 'Best: personal months 4, 5, 8.' },
    spirituality: { summary: 'Tantric / Durga / Bhairava path.', detail: 'Durga Chalisa, feeding dogs and disciplined occult study channel Rahu upward.', timing: 'Spiritual crisis → breakthrough in personal year 7.' },
  },
  5: {
    personality: { summary: 'Witty, versatile, business-minded.', detail: 'Change is oxygen. Restlessness is the shadow; networking is the gift.', timing: 'Peak mobility in personal years 5 and 1.' },
    career: { summary: 'Trade, media, writing, sales, travel, analytics.', detail: 'Multiple income streams suit you. Monotonous jobs drain life force.', timing: 'Career jumps every 5–9 years are normal.' },
    wealth: { summary: 'Wealth through communication and commerce.', detail: 'Mercury money — commissions, writing, trading. Avoid impulsive bets.', timing: 'Favourable: Wednesday; personal years 5 and 6.' },
    marriage: { summary: 'Needs intellectual stimulation.', detail: 'Best with 1, 2, 3, 6 or 9. Boredom ends relationships faster than conflict.', timing: 'Marriage after variety is satisfied — often mid-20s to early 30s.' },
    health: { summary: 'Nerves, skin, speech, respiratory system.', detail: 'Mental overwork causes fatigue. Breathwork and green spaces restore you.', timing: 'Caution in personal years 4 and 8.' },
    education: { summary: 'Quick learner, many subjects.', detail: 'Commerce, languages, journalism and IT fit. Depth requires conscious focus.', timing: 'Peak: ages 16–28.' },
    children: { summary: 'Playful, communicative parent.', detail: 'Children are often clever talkers. Teach consistency by example.', timing: 'Favourable: personal years 3 and 5.' },
    travel: { summary: 'Frequent short and medium journeys.', detail: 'North direction and trade travel prosper. Avoid chaotic last-minute trips.', timing: 'Best: personal months 5 and 1.' },
    spirituality: { summary: 'Ganesha and Buddhi yoga.', detail: 'Wednesday fasting, green offerings and mantra of Budha sharpen intuition.', timing: 'Inner stillness sought after age 36.' },
  },
  6: {
    personality: { summary: 'Harmonious, artistic, responsible.', detail: 'Beauty and family are central. Indulgence and vanity are the shadows.', timing: 'Relationship themes peak in personal years 2 and 6.' },
    career: { summary: 'Fashion, film, design, luxury, jewellery, hospitality.', detail: 'Aesthetic and people-facing work flourishes. Purely dry technical roles frustrate.', timing: 'Career bloom: ages 28–45.' },
    wealth: { summary: 'Wealth through beauty, art and partnerships.', detail: 'Venus money — luxury goods, design fees, spouse-linked gains. Overspending is the risk.', timing: 'Favourable: Friday; personal years 6 and 2.' },
    marriage: { summary: 'Marriage is central to destiny.', detail: 'Best with 1, 3, 5 or 9. Early romantic idealism needs grounding.', timing: 'Often marries in personal year 2 or 6; spouse may elevate status.' },
    health: { summary: 'Throat, kidneys, reproductive system, sugar.', detail: 'Sweet habits and late nights affect balance. Fragrance and clean space heal.', timing: 'Watch in personal years 4 and 8.' },
    education: { summary: 'Arts, design, music, hospitality management.', detail: 'Creative education thrives. Pure maths without beauty feels barren.', timing: 'Peak: ages 18–30.' },
    children: { summary: 'Devoted, aesthetic home environment.', detail: 'Children often artistic. Avoid overprotectiveness.', timing: 'Favourable: personal years 2, 6, 9.' },
    travel: { summary: 'Comfortable, beauty-focused travel.', detail: 'South-East and cultural destinations suit. Luxury travel is restorative, not wasteful, if budgeted.', timing: 'Best: personal months 2 and 6.' },
    spirituality: { summary: 'Lakshmi upasana and devotion through beauty.', detail: 'Friday worship, white offerings and seva of women open grace.', timing: 'Deepens after marriage / home establishment.' },
  },
  7: {
    personality: { summary: 'Introspective, mystical, analytical.', detail: 'You seek hidden truths. Isolation and pessimism are shadows; healing is the gift.', timing: 'Revelations in personal years 7 and 9.' },
    career: { summary: 'Research, occult, medicine, philosophy, foreign service.', detail: 'Depth work over sales. Healing and specialist roles suit you.', timing: 'Recognition often late — after age 35.' },
    wealth: { summary: 'Uneven; spiritual detachment from money.', detail: 'Ketu wealth is irregular. Research grants, royalties and foreign income help. Avoid gambling.', timing: 'Favourable: Monday; personal years 7 need frugality.' },
    marriage: { summary: 'Needs space and spiritual compatibility.', detail: 'Best with 2, 5 or 1. Detachment can feel cold; communicate needs early.', timing: 'Marriage may be delayed or unconventional; personal year 2 or 6 better.' },
    health: { summary: 'Skin, nerves, hard-to-diagnose ailments.', detail: 'Meditation and clean diet work better than aggressive allopathy alone.', timing: 'High alert personal years 4, 7, 8.' },
    education: { summary: 'Philosophy, medicine, occult, pure science.', detail: 'Self-study and research excel. Crowded classrooms drain you.', timing: 'Lifelong learner; peaks after 30.' },
    children: { summary: 'Few children; spiritual bond.', detail: 'One child may walk an unusual path. Avoid emotional distance.', timing: 'Favourable: personal years 2 and 6.' },
    travel: { summary: 'Pilgrimage and solitary journeys.', detail: 'North-West and remote places recharge. Group tourism rarely satisfies.', timing: 'Best: personal months 7 and 9.' },
    spirituality: { summary: 'Strong Ketu path — moksha orientation.', detail: 'Ganesha, meditation and feeding dogs are classical remedies that also elevate you.', timing: 'Spiritual peak lifelong; crisis years become breakthroughs.' },
  },
  8: {
    personality: { summary: 'Disciplined, karmic, enduring.', detail: 'Life teaches through delays. Justice and long-term planning are strengths; loneliness is the shadow.', timing: 'Hardest lessons in personal years 4 and 8; harvest in 9 and 1.' },
    career: { summary: 'Law, real estate, mining, labour, politics, public service.', detail: 'Slow-build careers win. Overnight fame is rare but authority lasts.', timing: 'True rise after age 36–40.' },
    wealth: { summary: 'Hard-earned, lasting assets.', detail: 'Saturn money — property, iron, oil, pensions. Avoid get-rich-quick and heavy debt in 8-years.', timing: 'Favourable: Saturday; personal years 8 require austerity.' },
    marriage: { summary: 'Late, serious, duty-bound marriage.', detail: 'Best with 4, 5, 6 or another 8. Patience required; spouse may be older or mature.', timing: 'Often after age 30–33; personal year 2 or 6 helps.' },
    health: { summary: 'Bones, joints, teeth, chronic fatigue.', detail: 'Long-term discipline in exercise and oil massage (abhyanga) is medicine.', timing: 'Critical: personal years 4 and 8.' },
    education: { summary: 'Law, engineering, labour studies, administration.', detail: 'Slow but thorough mastery. Failures early often lead to mastery later.', timing: 'Peak: ages 28–45.' },
    children: { summary: 'Strict but protective parent.', detail: 'Children may face early tests then succeed. Soften communication.', timing: 'Favourable: personal years 3 and 6.' },
    travel: { summary: 'Work travel and Westward moves.', detail: 'Foreign settlement possible after struggle. Avoid frivolous trips in 8-years.', timing: 'Best: personal months 5, 6, 9 — not 4 or 8.' },
    spirituality: { summary: 'Shani / Hanuman path — karma yoga.', detail: 'Saturday seva, Hanuman Chalisa and service to labourers transform destiny.', timing: 'Spiritual maturity after age 42.' },
  },
  9: {
    personality: { summary: 'Courageous, humanitarian, passionate.', detail: 'A fighter and protector. Anger and impulsiveness are shadows; generosity is the gift.', timing: 'Action peaks in personal years 9 and 1.' },
    career: { summary: 'Defence, surgery, sports, engineering, fire, metals.', detail: 'Executive and high-energy roles suit. Passive desk jobs frustrate.', timing: 'Leadership after proving courage — often by age 30.' },
    wealth: { summary: 'Wealth through effort and courage.', detail: 'Mars money — real estate, surgery fees, sports, machinery. Impulse spending is the leak.', timing: 'Favourable: Tuesday; personal years 9 and 1.' },
    marriage: { summary: 'Passionate; needs an equal, not a dependent.', detail: 'Best with 1, 3, 5 or 6. Temper control is the marriage remedy.', timing: 'Marriage after channelled energy — personal years 2, 6, 9.' },
    health: { summary: 'Blood, muscles, injuries, inflammation, fever.', detail: 'Sports injuries and accidents need mindfulness. Channel heat through exercise.', timing: 'Caution in personal years 4, 7, 8.' },
    education: { summary: 'Sports, medicine, engineering, military.', detail: 'Learn by doing. Competitive exams with physical edge suit you.', timing: 'Peak: ages 16–28.' },
    children: { summary: 'Protective, energetic parent.', detail: 'Children may be athletic or bold. Teach soft skills consciously.', timing: 'Favourable: personal years 3 and 9.' },
    travel: { summary: 'Adventure and Southward travel.', detail: 'Pilgrimage to warrior/Hanuman shrines and sports tours prosper.', timing: 'Best: personal months 1, 5, 9.' },
    spirituality: { summary: 'Hanuman / Kartikeya — karma and courage.', detail: 'Tuesday fasting, red offerings and Hanuman Chalisa convert aggression into seva.', timing: 'Humanitarian calling grows after age 36.' },
  },
}

function toneFromHarmony(h: Harmony): 'favourable' | 'mixed' | 'caution' {
  if (h === 'excellent' || h === 'good') return 'favourable'
  if (h === 'challenging') return 'caution'
  return 'mixed'
}

function colourArea(
  base: { summary: string; detail: string; timing: string },
  moolank: CoreNumber,
  bhagyank: CoreNumber,
  area: LifeAreaId,
): LifeAreaPrediction {
  const h = numberHarmony(moolank, bhagyank)
  let tone = toneFromHarmony(h)
  let detail = base.detail
  if (h === 'challenging') {
    detail += ` With Moolank ${moolank} and Bhagyank ${bhagyank} as natural enemies, expect inner desire and outer destiny to pull differently in ${AREA_LABEL[area].toLowerCase()} — bridge them with a friendly name number and remedies.`
    if (area === 'marriage' || area === 'career' || area === 'wealth') tone = 'caution'
  } else if (h === 'excellent' || h === 'good') {
    detail += ` Moolank ${moolank} and Bhagyank ${bhagyank} support each other, so this area tends to unfold with less friction.`
    if (tone === 'mixed') tone = 'favourable'
  }
  return { id: area, label: AREA_LABEL[area], tone, summary: base.summary, detail, timing: base.timing }
}

export function getLifeAreaPredictions(moolank: CoreNumber, bhagyank: CoreNumber): LifeAreaPrediction[] {
  const table = AREA_BY_MOOLANK[moolank]
  return (Object.keys(AREA_LABEL) as LifeAreaId[]).map(id => colourArea(table[id], moolank, bhagyank, id))
}

// ── Maturity = Moolank + Bhagyank ─────────────────────────────

const MATURITY_MEANING: Record<CoreNumber, string> = {
  1: 'Mature identity becomes that of a leader and initiator — authority arrives with age.',
  2: 'Mature life softens into diplomacy, partnership and creative sensitivity.',
  3: 'Mature years bring teaching, counsel and dharmic expansion.',
  4: 'Mature life takes an unconventional, technical or foreign turn.',
  5: 'Mature years emphasise commerce, communication and freedom.',
  6: 'Mature life centres on family, beauty, responsibility and harmony.',
  7: 'Mature years turn inward — research, healing and spirituality.',
  8: 'Mature life consolidates karma, property and hard-won authority.',
  9: 'Mature years awaken humanitarian service and courageous completion.',
}

export function getMaturityNumber(moolank: CoreNumber, bhagyank: CoreNumber): MaturityResult {
  const compound = moolank + bhagyank
  const value = reduceToCore(compound) as CoreNumber
  return {
    value,
    compound,
    meaning: MATURITY_MEANING[value],
    activatesAroundAge: 35,
  }
}

// ── Challenges (from DOB digits) ──────────────────────────────

const CHALLENGE_LESSON: Record<CoreNumber, string> = {
  1: 'Learn independence without ego; lead without dominating.',
  2: 'Learn emotional balance; do not lose yourself in others.',
  3: 'Learn disciplined expression; avoid scattered speech and extravagance.',
  4: 'Learn order amid chaos; finish what you start.',
  5: 'Learn constructive freedom; curb impulsiveness and inconsistency.',
  6: 'Learn healthy responsibility; avoid martyrdom and vanity.',
  7: 'Learn trust and openness; do not hide forever in analysis.',
  8: 'Learn patience with karma; neither resent delays nor force outcomes.',
  9: 'Learn to finish cycles with compassion; master anger.',
}

export function getChallengeNumbers(date: ParsedDate): ChallengeResult[] {
  const dayRoot = reduceToCore(date.day) as CoreNumber
  const monthRoot = reduceToCore(date.month) as CoreNumber
  const yearRoot = reduceToCore(date.year) as CoreNumber
  const first = reduceToCore(Math.abs(monthRoot - dayRoot)) as CoreNumber | 0
  const second = reduceToCore(Math.abs(dayRoot - yearRoot)) as CoreNumber | 0
  const main = reduceToCore(Math.abs((first || 9) - (second || 9))) as CoreNumber | 0
  const mk = (id: string, label: string, v: CoreNumber | 0): ChallengeResult | null => {
    if (!v) return null
    return { id, label, value: v, lesson: CHALLENGE_LESSON[v] }
  }
  return [
    mk('first', 'First challenge (Month − Day)', first),
    mk('second', 'Second challenge (Day − Year)', second),
    mk('main', 'Main challenge', main || 9),
  ].filter((x): x is ChallengeResult => x !== null)
}

// ── Pinnacles (life chapters) ─────────────────────────────────

export function getPinnacles(date: ParsedDate, ageNow: number): PinnacleResult[] {
  const day = reduceToCore(date.day) as CoreNumber
  const month = reduceToCore(date.month) as CoreNumber
  const year = reduceToCore(date.year) as CoreNumber
  const p1 = reduceToCore(month + day) as CoreNumber
  const p2 = reduceToCore(day + year) as CoreNumber
  const p3 = reduceToCore(p1 + p2) as CoreNumber
  const p4 = reduceToCore(month + year) as CoreNumber
  // First pinnacle length = 36 − life path (Bhagyank)
  const lifePath = reduceToCore(sumDigits(date.day) + sumDigits(date.month) + sumDigits(date.year)) as CoreNumber
  const firstLen = 36 - lifePath
  const ranges: { index: 1 | 2 | 3 | 4; value: CoreNumber; from: number; to: number | null }[] = [
    { index: 1, value: p1, from: 0, to: firstLen },
    { index: 2, value: p2, from: firstLen, to: firstLen + 9 },
    { index: 3, value: p3, from: firstLen + 9, to: firstLen + 18 },
    { index: 4, value: p4, from: firstLen + 18, to: null },
  ]
  return ranges.map(r => ({
    index: r.index,
    value: r.value,
    fromAge: r.from,
    toAge: r.to,
    theme: PERSONAL_YEAR_THEMES[r.value].theme,
    guidance: PERSONAL_YEAR_THEMES[r.value].guidance,
    active: ageNow >= r.from && (r.to === null || ageNow < r.to),
  }))
}

// ── Life phases (Indian: Moolank to ~35, then Bhagyank) ───────

export function getLifePhases(moolank: CoreNumber, bhagyank: CoreNumber, ageNow: number): LifePhase[] {
  return [
    {
      id: 'moolank',
      label: 'Moolank phase — formation',
      ageFrom: 0,
      ageTo: 35,
      ruling: moolank,
      rulingLabel: `Moolank ${moolank} (${NUMBER_PROFILES[moolank].planet})`,
      description: 'Personality, desires and early career follow the birth number. Self-image is shaped here.',
      active: ageNow < 35,
    },
    {
      id: 'transition',
      label: 'Transition — maturity bridge',
      ageFrom: 32,
      ageTo: 40,
      ruling: reduceToCore(moolank + bhagyank) as CoreNumber,
      rulingLabel: `Maturity number ${reduceToCore(moolank + bhagyank)}`,
      description: 'Moolank softens and Bhagyank begins to dominate destiny, marriage and public role.',
      active: ageNow >= 32 && ageNow < 40,
    },
    {
      id: 'bhagyank',
      label: 'Bhagyank phase — destiny harvest',
      ageFrom: 36,
      ageTo: null,
      ruling: bhagyank,
      rulingLabel: `Bhagyank ${bhagyank} (${NUMBER_PROFILES[bhagyank].planet})`,
      description: 'Outer life, reputation and karma follow the destiny number. Remedies for this number matter most now.',
      active: ageNow >= 36,
    },
  ]
}

// ── Number yogas (combinations) ───────────────────────────────

export function getNumerologyYogas(
  moolank: CoreNumber,
  bhagyank: CoreNumber,
  namank: CoreNumber | null,
  gridCounts: Record<CoreNumber, number>,
): NumerologyYoga[] {
  const has = (n: CoreNumber) => (gridCounts[n] ?? 0) > 0
  const set = new Set<CoreNumber>([moolank, bhagyank, ...(namank ? [namank] : [])])
  const yogas: NumerologyYoga[] = [
    {
      id: 'raj-1-5-7',
      name: 'Raja Yoga (1-5-7 / Sun-Mercury-Ketu)',
      quality: 'raj',
      present: [1, 5, 7].every(n => set.has(n as CoreNumber) || has(n as CoreNumber)),
      meaning: 'Intelligence, authority and spiritual insight combine — leadership with intuition.',
    },
    {
      id: 'raj-3-6-9',
      name: 'Raja Yoga (3-6-9 / Jupiter-Venus-Mars)',
      quality: 'raj',
      present: [3, 6, 9].every(n => set.has(n as CoreNumber) || has(n as CoreNumber)),
      meaning: 'Wisdom, luxury and courage — classical combination for status and creative power.',
    },
    {
      id: 'dhana-2-6-9',
      name: 'Dhana Yoga (2-6-9)',
      quality: 'dhana',
      present: [2, 6, 9].every(n => set.has(n as CoreNumber) || has(n as CoreNumber)),
      meaning: 'Partnership, beauty and effort bring wealth — strong for arts and joint ventures.',
    },
    {
      id: 'dhana-1-6',
      name: 'Dhana Yoga (1 & 6)',
      quality: 'dhana',
      present: set.has(1) && set.has(6),
      meaning: 'Sun and Venus — authority plus luxury; wealth through status and aesthetics.',
    },
    {
      id: 'golden-4-5-6',
      name: 'Golden Yoga (4-5-6 grid line)',
      quality: 'raj',
      present: has(4) && has(5) && has(6),
      meaning: 'Lo Shu success line present — recognition and material progress supported.',
    },
    {
      id: 'silver-2-5-8',
      name: 'Silver Yoga (2-5-8 property line)',
      quality: 'dhana',
      present: has(2) && has(5) && has(8),
      meaning: 'Property and stable assets yoga — land and long-term holdings favoured.',
    },
    {
      id: 'dosha-1-8',
      name: 'Sun–Saturn tension (1 & 8)',
      quality: 'dosha',
      present: (moolank === 1 && bhagyank === 8) || (moolank === 8 && bhagyank === 1) || (set.has(1) && set.has(8) && numberHarmony(1, 8) === 'challenging'),
      meaning: 'Ego vs karma — delays in authority; requires humility, Saturday seva and patience.',
    },
    {
      id: 'dosha-4-8',
      name: 'Rahu–Saturn load (4 & 8)',
      quality: 'dosha',
      present: (moolank === 4 && bhagyank === 8) || (moolank === 8 && bhagyank === 4),
      meaning: 'Heavy karmic workload — sudden obstacles and slow rewards; discipline is the only shortcut.',
    },
    {
      id: 'aligned-same',
      name: 'Moolank = Bhagyank (Ekanka)',
      quality: 'raj',
      present: moolank === bhagyank,
      meaning: 'Inner nature and outer destiny match — rare clarity of purpose; avoid over-identification with one trait.',
    },
    {
      id: 'name-bridge',
      name: 'Name bridges Moolank & Bhagyank',
      quality: 'mixed',
      present: namank != null
        && numberHarmony(namank, moolank) !== 'challenging'
        && numberHarmony(namank, bhagyank) !== 'challenging'
        && numberHarmony(moolank, bhagyank) === 'challenging',
      meaning: 'Your name number softens a difficult Moolank–Bhagyank pair — keep this spelling.',
    },
  ]
  return yogas
}

// ── Annual forecast by life area ──────────────────────────────

const YEAR_AREA: Record<CoreNumber, Partial<Record<LifeAreaId, string>>> = {
  1: {
    career: 'Start projects, seek promotion or launch a venture. Visibility matters.',
    wealth: 'New income streams open; invest in yourself first.',
    marriage: 'Independence themes; avoid ego clashes with partner.',
    health: 'Build a fresh fitness routine; heart and vitality focus.',
    travel: 'New destinations for work or status.',
  },
  2: {
    career: 'Collaborate; partnerships and soft-skill roles prosper.',
    wealth: 'Joint finances and slow accumulation beat speculation.',
    marriage: 'Excellent for marriage, reconciliation and romance.',
    health: 'Emotional and digestive care; rest more.',
    children: 'Favourable for pregnancy and family bonding.',
  },
  3: {
    career: 'Teaching, publishing, legal and advisory work expand.',
    wealth: 'Growth through knowledge products and counsel.',
    education: 'Courses, certifications and mentoring shine.',
    marriage: 'Social expansion; engage family wisely.',
    spirituality: 'Guru connection and dharmic study deepen.',
  },
  4: {
    career: 'Build systems; avoid reckless job hops. Technical work favoured.',
    wealth: 'Budget tightly; avoid new debt and speculation.',
    health: 'Nerves and sleep need protection.',
    travel: 'Sudden travel possible — keep documents ready; avoid impulsive moves.',
    marriage: 'Practical issues surface; patience required.',
  },
  5: {
    career: 'Sales, media, travel roles and career switches succeed.',
    wealth: 'Trading and commission income; curb impulsive spends.',
    travel: 'Highly favourable for short and medium journeys.',
    marriage: 'Need for freedom — negotiate space with partner.',
    education: 'Short courses and certifications stick.',
  },
  6: {
    career: 'Beauty, design, hospitality and service roles prosper.',
    wealth: 'Home, luxury and family spends; budget aesthetics.',
    marriage: 'Excellent for marriage, home and domestic harmony.',
    children: 'Family expansion and responsibility themes.',
    health: 'Throat and sugar balance; lifestyle refinement.',
  },
  7: {
    career: 'Research, analysis and specialist depth over networking.',
    wealth: 'Conserve; avoid speculation and flashy purchases.',
    spirituality: 'Peak year for meditation, retreats and occult study.',
    marriage: 'Need solitude — communicate so partner does not feel rejected.',
    health: 'Skin and nerves; prefer gentle healing.',
  },
  8: {
    career: 'Karma harvest — slow promotions, heavy responsibility, long-term roles.',
    wealth: 'Property and pensions; avoid leveraged bets.',
    health: 'Bones, joints and chronic issues need care.',
    marriage: 'Duty over romance; counselling helps if strained.',
    spirituality: 'Seva and Hanuman/Shani remedies transform obstacles.',
  },
  9: {
    career: 'Complete projects, lead teams, humanitarian or defence-style work.',
    wealth: 'Clear old debts; finish financial cycles before starting new ones.',
    marriage: 'Passionate year — temper and forgiveness both needed.',
    travel: 'Pilgrimage and completion journeys.',
    spirituality: 'Service and letting go of the old self.',
  },
}

function annualOverview(py: CoreNumber, moolank: CoreNumber): string {
  const theme = PERSONAL_YEAR_THEMES[py]
  const h = numberHarmony(py, moolank)
  const bridge = h === 'challenging'
    ? ` Personal year ${py} challenges your Moolank ${moolank} — move slowly and lean on remedies.`
    : h === 'excellent' || h === 'good'
      ? ` Personal year ${py} supports your Moolank ${moolank} — seize aligned opportunities.`
      : ''
  return `${theme.theme}. ${theme.guidance}${bridge}`
}

export function getAnnualForecast(
  personalYear: CoreNumber,
  moolank: CoreNumber,
  months: MonthlyForecast[],
): PredictionBundle['annual'] {
  const areaTexts = YEAR_AREA[personalYear]
  const areas: AnnualAreaForecast[] = (Object.keys(AREA_LABEL) as LifeAreaId[])
    .filter(id => areaTexts[id])
    .map(id => ({
      area: id,
      label: AREA_LABEL[id],
      outlook: toneFromHarmony(numberHarmony(personalYear, moolank)),
      text: areaTexts[id]!,
    }))
  const favourableMonths = months.filter(m => m.harmony === 'excellent' || m.harmony === 'good').map(m => m.month)
  const criticalMonths = months.filter(m => m.harmony === 'challenging').map(m => m.month)
  return {
    personalYear,
    theme: PERSONAL_YEAR_THEMES[personalYear].theme,
    overview: annualOverview(personalYear, moolank),
    areas,
    criticalMonths,
    favourableMonths,
  }
}

export function getMonthlyForecast(
  personalYear: CoreNumber,
  moolank: CoreNumber,
): MonthlyForecast[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const personalMonth = reduceToCore(personalYear + month) as CoreNumber
    return {
      month,
      monthName: MONTH_NAMES[i]!,
      personalMonth,
      theme: PERSONAL_YEAR_THEMES[personalMonth].theme,
      harmony: numberHarmony(personalMonth, moolank),
      guidance: PERSONAL_YEAR_THEMES[personalMonth].guidance,
    }
  })
}

export function getPowerDays(moolank: CoreNumber, bhagyank: CoreNumber): { day: number; reason: string }[] {
  const out: { day: number; reason: string }[] = []
  for (let d = 1; d <= 31; d++) {
    const root = reduceToCore(d) as CoreNumber
    if (root === moolank) out.push({ day: d, reason: `Matches Moolank ${moolank} — personal power day` })
    else if (root === bhagyank) out.push({ day: d, reason: `Matches Bhagyank ${bhagyank} — destiny day` })
  }
  return out
}

export function getAge(date: ParsedDate, today: ParsedDate): number {
  let age = today.year - date.year
  if (today.month < date.month || (today.month === date.month && today.day < date.day)) age--
  return Math.max(0, age)
}

export function buildPredictionBundle(input: {
  date: ParsedDate
  moolank: CoreNumber
  bhagyank: CoreNumber
  namank: CoreNumber | null
  gridCounts: Record<CoreNumber, number>
  cycles: CyclesForPrediction
  today: ParsedDate
  gender?: Gender
}): PredictionBundle {
  const ageNow = getAge(input.date, input.today)
  const monthly = getMonthlyForecast(input.cycles.personalYear, input.moolank)
  return {
    maturity: getMaturityNumber(input.moolank, input.bhagyank),
    challenges: getChallengeNumbers(input.date),
    pinnacles: getPinnacles(input.date, ageNow),
    lifePhases: getLifePhases(input.moolank, input.bhagyank, ageNow),
    lifeAreas: getLifeAreaPredictions(input.moolank, input.bhagyank),
    yogas: getNumerologyYogas(input.moolank, input.bhagyank, input.namank, input.gridCounts),
    annual: getAnnualForecast(input.cycles.personalYear, input.moolank, monthly),
    monthly,
    powerDays: getPowerDays(input.moolank, input.bhagyank),
    ageNow,
  }
}
