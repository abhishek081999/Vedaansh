// ─────────────────────────────────────────────────────────────
//  src/lib/engine/navamshaPredictions.ts
//  Advanced D9 prediction engine — planet-in-navamsha readings,
//  D1-source flavours, lordship rules, atmakaraka, combinations,
//  age markers and dasha activation. Builds on analyzeNavamsha().
//  Pure — no React / DB imports.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  analyzeNavamsha,
  signCount,
  type DashaTone,
  type NavamshaAnalysis,
  type NavamshaPlanetRow,
} from '@/lib/engine/navamshaAnalysis'
import {
  ATMAKARAKA_IN_NAVAMSHA,
  D9_HOUSE_THEME,
  DEBILITATED_IN,
  EXALTED_IN,
  GRAHA_QUALITIES,
  GRAHA_SIGNIFIES,
  MERCURY_FAME,
  NAMING_DEITY,
  NAVAMSHA_DASHA_NOTE,
  NAVAMSHA_SIGNS,
  SIGN_ELEMENT,
  SOURCE_SIGN_GENERIC,
} from '@/lib/engine/navamshaSignKnowledge'

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const DUSTHANA = [6, 8, 12]
const MALEFICS: GrahaId[] = ['Su', 'Ma', 'Sa', 'Ra', 'Ke']
const BENEFICS: GrahaId[] = ['Mo', 'Me', 'Ju', 'Ve']
/** Vimshottari nakshatra lords, repeating every 9 nakshatras from Ashwini. */
const NAK_LORDS: GrahaId[] = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me']

/** House n counted from h (1 = h itself). */
function houseFrom(h: number, n: number): number {
  return ((h - 1 + n - 1) % 12) + 1
}

export type NavamshaRuleCategory =
  | 'lagna'
  | 'combination'
  | 'lordship'
  | 'health'
  | 'dignity'
  | 'karaka'
  | 'house'
  | 'guidance'
  | 'departure'
  | 'timing'

export interface NavamshaRuleHit {
  id: string
  category: NavamshaRuleCategory
  title: string
  text: string
  tone: DashaTone
  planets: GrahaId[]
}

export interface NavamshaPlanetPrediction {
  id: GrahaId
  name: string
  d1Rashi: Rashi
  d1RashiName: string
  d1House: number
  d9Rashi: Rashi
  d9RashiName: string
  d9House: number
  navamshaTitle: string
  /** D1 houses this planet rules (empty for nodes) */
  lordOf: number[]
  isVargottama: boolean
  isAtmakaraka: boolean
  /** Active as one of the running dasha lords */
  dashaLevels: string[]
  /** Core reading of the planet in this navamsha */
  signReading: string
  /** Flavour from the D1 sign it comes from */
  sourceReading: string
  /** What the D9 house adds */
  houseReading: string
  /** Optional house-specific teaching for this navamsha */
  houseSpecial: string | null
  /** What the dasha of this planet tends to bring, from its navamsha */
  dashaReading: string
  remedy: string
  tone: DashaTone
}

export interface NavamshaPredictionExtras {
  /** Indu lagna longitude 0–360 (wealth check) */
  induLagnaLon?: number
  /** Strongest graha by Shadbala (naming guidance); falls back to D9 strength */
  strongestGraha?: GrahaId
}

export interface NavamshaAtmakarakaReading {
  id: GrahaId
  name: string
  d9Rashi: Rashi
  d9RashiName: string
  theme: string
  present: { planet: GrahaId; text: string } | null
  missing: { planet: GrahaId; text: string } | null
}

export interface NavamshaSignCard {
  house: number
  sign: Rashi
  signName: string
  title: string
  keywords: string[]
  essence: string
  shadow: string
  guidance: string
  remedy: string
  houseTheme: string
  houseSpecial: string | null
  occupants: GrahaId[]
  /** House is empty but its sign/house still speaks via its lord */
  empty: boolean
}

export interface NavamshaAgeMarker {
  age: number
  sign: Rashi
  signName: string
  planets: GrahaId[]
  note: string
}

export interface NavamshaPredictionReport {
  d9Lagna: Rashi
  d9LagnaName: string
  headline: string
  planets: NavamshaPlanetPrediction[]
  atmakaraka: NavamshaAtmakarakaReading | null
  rules: NavamshaRuleHit[]
  signCards: NavamshaSignCard[]
  ageMarkers: NavamshaAgeMarker[]
  activeNow: NavamshaPlanetPrediction[]
  elementBalance: Record<'fire' | 'earth' | 'air' | 'water', GrahaId[]>
}

function houseLords(ascRashi: Rashi): Record<number, GrahaId> {
  const out: Record<number, GrahaId> = {}
  for (let h = 1; h <= 12; h++) {
    const sign = (((ascRashi - 1 + h - 1) % 12) + 1) as Rashi
    out[h] = SIGN_LORDS[sign]
  }
  return out
}

function lordshipsOf(id: GrahaId, lords: Record<number, GrahaId>): number[] {
  if (id === 'Ra' || id === 'Ke') return []
  return Object.entries(lords)
    .filter(([, lord]) => lord === id)
    .map(([h]) => Number(h))
}

function planetTone(row: NavamshaPlanetRow): DashaTone {
  if (row.isVargottama || ['exalted', 'moolatrikona', 'own'].includes(row.d9Dignity)) return 'supportive'
  if (row.d9Dignity === 'debilitated' || DUSTHANA.includes(row.d9House)) return 'challenging'
  if (['enemy', 'great_enemy'].includes(row.d9Dignity)) return 'mixed'
  return 'neutral'
}

function sourceReading(d1Rashi: Rashi, d9Rashi: Rashi): string {
  const profile = NAVAMSHA_SIGNS[d9Rashi]
  const specific = profile.fromSign?.[d1Rashi]
  if (specific) return specific
  const byElement = profile.fromElement?.[SIGN_ELEMENT[d1Rashi]]
  if (byElement) return `${SOURCE_SIGN_GENERIC[d1Rashi]} ${byElement}`
  return SOURCE_SIGN_GENERIC[d1Rashi]
}

function rule(
  id: string,
  category: NavamshaRuleCategory,
  title: string,
  text: string,
  tone: DashaTone,
  planets: GrahaId[],
): NavamshaRuleHit {
  return { id, category, title, text, tone, planets }
}

/** Pairs/groups of grahas sharing a D9 sign → combination readings from the lectures. */
const COMBINATIONS: { ids: GrahaId[]; title: string; text: string; tone: DashaTone; signs?: Rashi[] }[] = [
  { ids: ['Ma', 'Ra'], signs: [1], title: 'Mars–Rahu in Aries navamsha', text: 'Explosive and hard to stop — a flag in construction, technology, security, banking or finance, or a fight with no backup. Channel it into sport, defence or taking machines apart. Do not trust it while you are the one being fought, and do not drive on anger.', tone: 'challenging' },
  { ids: ['Ma', 'Ke'], signs: [1], title: 'Mars–Ketu in Aries navamsha', text: 'Cholesterol and stress chemistry, anxiety or panic, and a headless fight: afraid until fear drops, then willing to give everything for the cause. Strong for audit, investigation and detailed crisis work. Keep the body calm and the cause clean.', tone: 'challenging' },
  { ids: ['Su', 'Ke'], signs: [1], title: 'Sun–Ketu in Aries navamsha', text: 'Confidence collapses in front of authority. When something new is born, a senior — often the father figure — is the sacrifice. Ketu cuts; the Sun is the authority that gets cut.', tone: 'challenging' },
  { ids: ['Su', 'Ke'], signs: [3], title: 'Sun–Ketu in Gemini navamsha', text: 'Father and other seniors use very few words, and you share less with anyone who has a post. Self-doubt keeps adding one more reading before the exam. The depth is real; the confidence arrives late.', tone: 'mixed' },
  { ids: ['Su', 'Ke'], signs: [5], title: 'Sun–Ketu in Leo navamsha', text: 'Always improving, and afraid the presentation is not the best. The heart stays in the work until it is perfect. Together in front of the father, confidence drops.', tone: 'mixed' },
  { ids: ['Ju', 'Sa'], signs: [1], title: 'Jupiter–Saturn in Aries navamsha', text: 'Learning happens under pressure. Early teachers talk a lot; the ones who last are hard, practical and test you on real work. Public speaking starts with the fear that you were under-prepared, then the words will not stop.', tone: 'mixed' },
  { ids: ['Ve', 'Ke'], signs: [1], title: 'Venus–Ketu in Aries navamsha', text: 'The bond starts suddenly and separates just as suddenly — an on-off marriage. A journey to a shakti peetha is the taught stabiliser. A business tied to the same planets can stop without warning and then has to change form. Confirm delay or denial of marriage with D4 before you close it.', tone: 'challenging' },
  { ids: ['Ve', 'Ke'], signs: [5], title: 'Venus–Ketu in Leo navamsha', text: 'Young, many partners, a dance or a peak, and then the thing is left. Jupiter beside them makes them deny it.', tone: 'challenging' },
  { ids: ['Mo', 'Ma'], signs: [2], title: 'Moon–Mars in Taurus navamsha', text: 'Every sheet, bed and corner is "mine". Affection and violence trade places within minutes, usually over food, cash, or what was brought from the parents\' house. Do not trust the soft minute.', tone: 'challenging' },
  { ids: ['Mo', 'Ma'], signs: [5], title: 'Moon–Mars in Leo navamsha', text: 'Royal standards, and a royal giving. Three questions and the irritation is immediate. Clear cut. No drama.', tone: 'mixed' },
  { ids: ['Ma', 'Ra'], signs: [4], title: 'Mars–Rahu in Cancer navamsha', text: 'The fight goes on until it is solved, and then the person cries that it should not have gone that far. The whole house is disturbed. Water systems, filters and machines that use a fluid keep failing, or the fear of that failure stays. Walk it out. Do not use the heat on a child.', tone: 'challenging' },
  { ids: ['Sa', 'Ke'], signs: [4], title: 'Saturn–Ketu in Cancer navamsha', text: 'Love without a claim. The wife is cared for, and the happiness is found in Mahadeva and Krishna, not in being understood. Oil the body. Sit with people who have left the world. A cheat produces a guilt this pair will not release.', tone: 'mixed' },
  { ids: ['Sa', 'Ke'], signs: [5], title: 'Saturn–Ketu in Leo navamsha', text: 'Inferiority, plus a wish to unseat the chair. Fault-finding, transfers, and a room with nothing extra. A pitri blessing and a hill temple. Do not share a weakness.', tone: 'challenging' },
  { ids: ['Ju', 'Ra'], signs: [4], title: 'Jupiter–Rahu in Cancer navamsha', text: 'The work gets done. If a straight request fails, another route appears. People taken for saints often turn out false, so devotion here needs a named deity, not a new guide every season.', tone: 'challenging' },
  { ids: ['Ma', 'Ra'], signs: [5], title: 'Mars–Rahu in Leo navamsha', text: 'Grey labour and a shortcut that uses the young. The cleaner side puts children into sport. Accidents, and a hard return when Saturn comes. Do not use people for free.', tone: 'challenging' },
  { ids: ['Ma', 'Ra'], signs: [6], title: 'Mars–Rahu in Virgo navamsha', text: 'The correction is aggressive and the apology is demanded first, in public. The fact comes after the admission. Do not meet it with ego. Blood, a workout and a short fuse sit in the same procedure.', tone: 'challenging' },
  { ids: ['Ma', 'Ke'], signs: [6], title: 'Mars–Ketu in Virgo navamsha', text: 'Blood, a gym that cannot be skipped, and pressure on the gut. The mood goes from soft to a closed door. Fermented food and a steady workout are the practical side. The micro-management is real.', tone: 'challenging' },
  { ids: ['Sa', 'Ke'], signs: [6], title: 'Saturn–Ketu in Virgo navamsha', text: 'Things are ordered, then the room is too full and everything must go, including the bed. Under-confident: two days off the book feels like a ruined life. The kitchen is where oil and cleanliness decide the pests. Clean it. Do not hoard it.', tone: 'mixed' },
  { ids: ['Mo', 'Ve'], signs: [6], title: 'Moon–Venus in Virgo navamsha', text: 'Herbs, a decoction, and a house kept white. Food is judged to the grain. The bond is never quite satisfied, because Venus is debilitated and the Moon still wants the day to be exact.', tone: 'mixed' },
  { ids: ['Su', 'Me'], signs: [6], title: 'Sun–Mercury in Virgo navamsha', text: 'Orders, quality, and authority that stays off the stage. The report is asked for before the praise. Logistics and a government-style desk suit the pair. The fight is verbal, and the instruction is written down.', tone: 'supportive' },
  { ids: ['Me', 'Ra'], signs: [6], title: 'Mercury–Rahu in Virgo navamsha', text: 'The wrong information arrives dressed as a deal. Deadlines slip, the scheme looks perfect, and the agent is offered for a two-line form. Check it with Jupiter and the Sun before any money moves.', tone: 'challenging' },
  { ids: ['Me', 'Ke'], signs: [6], title: 'Mercury–Ketu in Virgo navamsha', text: 'The form creates anxiety, so someone else is appointed to fill it, and the copy is still checked three times. Detail is encrypted. The inside of the work is not shown. The procedure is followed once it is written.', tone: 'mixed' },
  { ids: ['Ve', 'Ra'], signs: [6], title: 'Venus–Rahu in Virgo navamsha', text: 'A workplace bond, and the betrayal shows when the shared method breaks. Price, brand and a second option stay in the mind. Do not call every case an affair. Do not ignore one that started at the desk.', tone: 'challenging' },
  { ids: ['Ma', 'Ra'], title: 'Mars–Rahu together in D9', text: 'Dacoit-like daring: takes what it wants and fights for it. Strong will; needs rules and Hanuman sadhana.', tone: 'mixed' },
  { ids: ['Sa', 'Ve'], signs: [5], title: 'Saturn–Venus in Leo navamsha', text: 'More than one bond is maintained, and the traditional pressure makes the relation heavy. Status, without admitting the fault.', tone: 'challenging' },
  { ids: ['Sa', 'Ve'], title: 'Saturn–Venus in D9', text: 'Creates expensive things — showrooms, mills, construction, luxury goods. Money through partnerships but disputes too; beware the "half-truth" habit.', tone: 'mixed' },
  { ids: ['Sa', 'Mo'], signs: [4], title: 'Saturn–Moon in Cancer navamsha', text: 'The heart is dried until it cannot be given again. A little access brings the fear that the old wound has returned. The room, unlike Saturn alone, is kept deeply clean. Public service, a kitchen, and work for the many succeed. Show the feeling to God, not to the office.', tone: 'challenging' },
  { ids: ['Sa', 'Mo'], title: 'Saturn–Moon in D9', text: 'A deep thinker, not a curse combination: easy enjoyment dries up and the person matures early. The house may be large and emotionally dry. They see through an inflated price. Needs light, company and devotion.', tone: 'mixed' },
  { ids: ['Sa', 'Me'], signs: [7], title: 'Saturn–Mercury in Libra navamsha', text: 'Low interest in marriage and intimacy; doubt and hesitation in the bedroom — commitment comes late and needs patience.', tone: 'challenging' },
  { ids: ['Sa', 'Mo'], signs: [7], title: 'Saturn–Moon in Libra navamsha', text: 'Finance is learned from rock bottom. Mother\'s money is tight, the job underpays, and the mind stays on partnership and insecurity until the basics are rebuilt. Soft floral or oil-based scent; confirm with the rest of D9.', tone: 'challenging' },
  { ids: ['Ra', 'Sa'], signs: [7], title: 'Rahu–Saturn in Libra navamsha', text: 'Obsession with doubling money meets delay and restriction. When Saturn is afflicted in D9, the native is easily cheated in finance — impatience buys the wrong deal. Patience is the missing filter.', tone: 'challenging' },
  { ids: ['Ju', 'Ke'], signs: [7], title: 'Jupiter–Ketu in Libra navamsha', text: 'Donates freely and helps the helpless. Society service over second income. Filters stay high; casual deals and casual bonds both feel wrong.', tone: 'supportive' },
  { ids: ['Ju', 'Ve'], signs: [7], title: 'Jupiter–Venus in Libra navamsha', text: 'Chemical wish: money, honour and a sattvic branded life. Quality over quantity — ingredients, cloth, travel class. Wedding and pleasure want dignity. The pair can over-idealise the bond.', tone: 'supportive' },
  { ids: ['Ma', 'Ra'], signs: [7], title: 'Mars–Rahu in Libra navamsha', text: 'Passion without a checklist. Reputation risk, impulsive spend on display or friends, and a bond entered as a conquest. Heat plus no filter — confirm before predicting excess.', tone: 'challenging' },
  { ids: ['Ve', 'Ke'], signs: [7], title: 'Venus–Ketu in Libra navamsha', text: 'Beauty meets detachment. Touch and closeness need the person to be truly liked; otherwise the body withdraws. Money and pleasure filters are strict. Fertility and intimacy deserve a careful medical reading when the 5th is also tied.', tone: 'mixed' },
  { ids: ['Su', 'Ve'], signs: [7], title: 'Sun–Venus in Libra navamsha', text: 'Status and pleasure braid. The person spends to be seen, and the partner is drawn by polish and rank. Debilitated Sun still wants the palace dressed; loyalty keeps the brand intact.', tone: 'mixed' },
  { ids: ['Mo', 'Ju'], signs: [7], title: 'Moon–Jupiter in Libra navamsha', text: 'Mind and faith sit in heaven. Trust in the partner runs high; sandalwood, tulsi-flower and soft white scent. Marriage often taken on belief — re-read the class for the full soft predictions.', tone: 'supportive' },
  { ids: ['Ma', 'Ra'], signs: [8], title: 'Mars–Rahu in Scorpio navamsha', text: 'Reactive heat in the damp room. The first blow is rarely theirs; the ledger is then equalised hard. Career can rise while marriage and body absorb the cost. Channel into research, surgery or defence — not into private score-settling.', tone: 'challenging' },
  { ids: ['Ma', 'Ke'], signs: [8], title: 'Mars–Ketu in Scorpio navamsha', text: 'Cuts the knot instead of untying it. Escapes the mess; facilities stay broken until a third party is paid. One deep heartbreak, then detachment. Hidden donations without a name. Do not leave the spouse carrying every repair alone.', tone: 'challenging' },
  { ids: ['Ma', 'Sa'], signs: [8], title: 'Mars–Saturn in Scorpio navamsha', text: 'Sleeps through other people\'s panic and still solves the file. Heavy problem-solver; the spouse\'s Moon-language is the blind spot. Take a pause in consultation so depth is felt, not only speed.', tone: 'mixed' },
  { ids: ['Sa', 'Ke'], signs: [8], title: 'Saturn–Ketu in Scorpio navamsha', text: 'Responsibility meets the headless escape. When one chart runs Saturn and the other Ketu, friction is almost certain — pressure versus refusal of bondage. Distance and clear duty lines prevent the drain.', tone: 'challenging' },
  { ids: ['Mo', 'Ke'], signs: [8], title: 'Moon–Ketu in Scorpio navamsha', text: 'Middle person in a fight — both sides trust the one who seems to want nothing. Emotionally blunt after enough needles. Untangles some knots; cuts others. Mediation gift with a dry heart cost.', tone: 'mixed' },
  { ids: ['Me', 'Ke'], signs: [8], title: 'Mercury–Ketu in Scorpio navamsha', text: 'Law, pattern, and reverse-engineering. Half the message is sent; the rest is assumed. Notes never feel finished. First exam of a set often scores worst. Research and encrypted detail over surface GK.', tone: 'mixed' },
  { ids: ['Me', 'Ra'], signs: [8], title: 'Mercury–Rahu in Scorpio navamsha', text: 'Magnifies research into many papers — and can cook data when ethics slip. Attendance games, proxies, and a mind that never forgets an insult. Publish clean; the same placement catches fraud for others.', tone: 'challenging' },
  { ids: ['Ju', 'Ra'], signs: [8], title: 'Jupiter–Rahu in Scorpio navamsha', text: 'Guilt theatre and unconventional mentors. Faith is tested in damp rooms; anonymous learning suits better than the front row. One ruin often precedes the climb. Keep non-veg and loose company light while this pair is loud.', tone: 'challenging' },
  { ids: ['Ve', 'Sa'], signs: [8], title: 'Venus–Saturn in Scorpio navamsha', text: 'Love that waits and hardens. Breakups tend toward zero but leave an ember. Inheritance and money fights sit beside research pay. Adorn the deity; do not turn the bond into bonded labour.', tone: 'challenging' },
  { ids: ['Su', 'Ke'], signs: [8], title: 'Sun–Ketu in Scorpio navamsha', text: 'Will not stay under anyone, and will not perform for the chair. Father-distance and remote work suit. Childhood spark thins; authority becomes research or a quiet exit. Donate in the father\'s name when the dasha burns.', tone: 'mixed' },
  { ids: ['Mo', 'Ra'], signs: [8], title: 'Moon–Rahu in Scorpio navamsha', text: 'Obsession in the shmashan: cannot forget, cannot fully drink the water beside them. Fear of deep water or compulsive care of bathrooms. Feed forgiveness work, not the rumour mill.', tone: 'challenging' },
  { ids: ['Su', 'Ju'], signs: [9], title: 'Sun–Jupiter in Sagittarius navamsha', text: 'Authority and dharma on the same ridge. Father/guru/manager either elevates or falls with you — keep the moral bar or the chair goes. Gayatri, Rama and honest administration protect; bribery and ego slap-downs do not.', tone: 'mixed' },
  { ids: ['Mo', 'Ve'], signs: [9], title: 'Moon–Venus in Sagittarius navamsha', text: 'Mother and spouse both correct on ideology. Food customs and relationship boundaries break under pressure — not always sexual, often dietary and social codes. Ask Krishna or Lakshmi once, then act; Gemini-style bargaining drains faith.', tone: 'mixed' },
  { ids: ['Mo', 'Ju'], signs: [9], title: 'Moon–Jupiter in Sagittarius navamsha', text: 'Mind wants the guru\'s silence and the mother\'s space. Long texts, prasadam kitchen, high ceilings. Marriage to a quiet Jupiter-natured partner. Pack bags if rules are forced without care.', tone: 'mixed' },
  { ids: ['Ma', 'Ju'], signs: [9], title: 'Mars–Jupiter in Sagittarius navamsha', text: 'Warrior-dharma: Narasimha protection, strict guru, land fights when philosophy is insulted. Channel into temple defence and crisis service — not into five-minute moral collapse in houses 1/7/8/12.', tone: 'challenging' },
  { ids: ['Me', 'Ju'], signs: [9], title: 'Mercury–Jupiter in Sagittarius navamsha', text: 'Best student of the ridge: books, three gurus, articulate preaching. Curse if marketing bends the teacher\'s morals or pirates the research. Gratitude to the one who taught; big goals, muted speech.', tone: 'supportive' },
  { ids: ['Ve', 'Ma'], signs: [9], title: 'Venus–Mars in Sagittarius navamsha', text: 'Passionate dasha on the moral ridge. Attraction arrives loud; ting-tong costs the chair. Take Lakshmi\'s blessing and keep distance — fire plus desire without vow empties punya.', tone: 'challenging' },
  { ids: ['Sa', 'Ju'], signs: [9], title: 'Saturn–Jupiter in Sagittarius navamsha', text: 'Slow craft under a strict guru. Lifelong free seva, temple labour and hard-won wisdom. Abuse and comparison train you; once trust lands, you hold the feet. Patience eventually crowns the ridge.', tone: 'mixed' },
  { ids: ['Ra', 'Ke'], signs: [9], title: 'Rahu–Ketu in Sagittarius navamsha', text: 'Axis of faith versus shortcut. Rahu shops gurus and miracles; Ketu already knows who is clean. Initiation in a living sampradaya beats half-learned online mantra. Instinct over pomp.', tone: 'mixed' },
  { ids: ['Su', 'Sa'], signs: [9], title: 'Sun–Saturn in Sagittarius navamsha', text: 'Father and time on the steep climb. Feeling stepmothered under authority; heavy duty before honour. Do not buy the short queue — the long Jagannath line is the teaching.', tone: 'challenging' },
  { ids: ['Me', 'Ra'], signs: [9], title: 'Mercury–Rahu in Sagittarius navamsha', text: 'Piracy, proxy and "PDF from somewhere" mind. Wins assignments by bending edges; Jupiter pays later. Pay for knowledge; stop the urgent-consultation panic; finish the full course before teaching.', tone: 'challenging' },
  { ids: ['Ve', 'Ke'], signs: [9], title: 'Venus–Ketu in Sagittarius navamsha', text: 'Bond cut when dharma was missing — Ketu may break engagements to save you. Pure purpose in love: serve and leave without trapping. Ritual spouse or temple marriage when Jupiter supports the bind.', tone: 'mixed' },
  { ids: ['Su', 'Sa'], signs: [10], title: 'Sun–Saturn in Capricorn navamsha', text: 'Authority under the hammer. Father/boss pressure cooker; consistency builds the chair while personal life burns. Do not play victim — copper, Surya-Narayana and clear purpose keep the Sun from draining into bonded labour.', tone: 'challenging' },
  { ids: ['Mo', 'Sa'], signs: [10], title: 'Moon–Saturn in Capricorn navamsha', text: 'Childhood scalded into practicality; tears dry until crying no longer summons help. Mother\'s bondage and desi Saturn food. Not a kind sannyasa — dreams of soft youth are taken; temples appear on Moon–Saturn transits. Happiness only through work.', tone: 'challenging' },
  { ids: ['Ma', 'Sa'], signs: [10], title: 'Mars–Saturn in Capricorn navamsha', text: 'Machines, land, construction and scars. One-man army from mill to GST; big vehicles and towers. Channel into core industry — not into IT churn that demands reinvention every quarter.', tone: 'mixed' },
  { ids: ['Me', 'Sa'], signs: [10], title: 'Mercury–Saturn in Capricorn navamsha', text: 'Copy-paste grind until automation is forbidden by load. Critic mind, guilt that quits addictions, CA/audit/data depth. Tracks every paisa; sibling marriage stress. Choose archives, history and number-matching over shiny startups.', tone: 'mixed' },
  { ids: ['Ju', 'Sa'], signs: [10], title: 'Jupiter–Saturn in Capricorn navamsha', text: 'Guru in the prison. Happiness and soft honour thin (Jupiter debilitated). Strict teachers; career or health trade-off; thick skin in arguments. Morning sadhana and deep breathing; work and small bhakti — not philosophy sermons.', tone: 'challenging' },
  { ids: ['Ve', 'Sa'], signs: [10], title: 'Venus–Saturn in Capricorn navamsha', text: 'Slave of money, partner and family until spouse-karma ends. Expensive perfume and petroleum beauty; orthodox partner. Materials without heart — when forced to choose, status over soft romance.', tone: 'challenging' },
  { ids: ['Ra', 'Sa'], signs: [10], title: 'Rahu–Saturn in Capricorn navamsha', text: 'Amplifier of pressure and third-party traps. Addiction significator; sama-dama-danda-bheda politics. Scams and fake government-job promises — significator only. AI/stock theatre without real grind until the market hole is capitalised the hard way.', tone: 'challenging' },
  { ids: ['Ke', 'Sa'], signs: [10], title: 'Ketu–Saturn in Capricorn navamsha', text: 'Nishkama detail or no job at all. Research, ML, encrypted tools; kills middlemen; buttermilk desk; resigns before collapse. Managers keep distance. Career gaps — choose break-friendly craft.', tone: 'mixed' },
  { ids: ['Su', 'Mo'], signs: [10], title: 'Sun–Moon in Capricorn navamsha', text: 'Amavasya flavour in the prison: authority without soft emotion. Father and mother both bind; home becomes territory marks and duty. Stand for mother\'s dignity without draining the Sun.', tone: 'challenging' },
  { ids: ['Me', 'Ra'], signs: [10], title: 'Mercury–Rahu in Capricorn navamsha', text: 'Allegations stick — theft and smear narratives when matchmaking joins this pair. Deal-closing talk without real delivery. Keep paperwork honest; Capricorn demands real work Rahu prefers to fake.', tone: 'challenging' },
  { ids: ['Mo', 'Ke'], signs: [10], title: 'Moon–Ketu in Capricorn navamsha', text: 'Love once, not twice — barrier after break. Reads attachment and salary on faces. Mother-bond with research isolation. Not the negotiator; walks away after stating faults.', tone: 'mixed' },
  { ids: ['Ve', 'Ra'], signs: [10], title: 'Venus–Rahu in Capricorn navamsha', text: 'Ultra-rich products and status after marriage when capitalised; also drink/cheat risk on the partner axis. Expensive brands; mother from a solid line. Keep clinical distance from sugar-status traps.', tone: 'challenging' },
  { ids: ['Sa', 'Me'], signs: [3], title: 'Saturn–Mercury in Gemini navamsha', text: 'Fault is found in everything the partner does, and the marriage is hard to live in. The same pair gives audit, law and a critic\'s eye, and it takes the ease out of childhood. Thyroid is the health watch. Be kind; Mars nearby is what makes the pressure bearable.', tone: 'challenging' },
  { ids: ['Sa', 'Me'], signs: [5], title: 'Saturn–Mercury in Leo navamsha', text: 'The portfolio is judged before anything is called premium. A critic, and hard to love. Interest in intimacy dries with age. Affairs before marriage are unlikely.', tone: 'challenging' },
  { ids: ['Sa', 'Me'], title: 'Saturn–Mercury in D9', text: 'Fault-finding and accountant mind (CA/audit/legal); may look older than age. Famous for one big lasting work.', tone: 'mixed' },
  { ids: ['Ju', 'Ve'], title: 'Jupiter–Venus in D9', text: 'Strong desires and refined taste; brings wealth and respect, but marriage needs conscious balance between dharma and pleasure.', tone: 'mixed' },
  { ids: ['Su', 'Mo'], title: 'Sun–Moon in D9 (Amavasya)', text: 'Mind cannot express under authority — things get done secretly; friction with father and bosses. Daily offerings at a temple balance it.', tone: 'challenging' },
  { ids: ['Su', 'Sa'], signs: [5], title: 'Sun–Saturn in Leo navamsha', text: 'The cold wire and the hot wire. Once triggered, Saturn grinds for days. They cannot stay on each other. Do not join them in a match.', tone: 'challenging' },
  { ids: ['Su', 'Sa'], title: 'Sun–Saturn in D9', text: 'Ego wars with father, bosses and siblings — wealth comes, but with rivalry ("if I buy a Thar, brother buys bigger").', tone: 'challenging' },
  { ids: ['Me', 'Ke'], title: 'Mercury–Ketu in D9', text: 'Gives anonymously — does not want the name on the plate; strict privacy about passwords and accounts.', tone: 'neutral' },
  { ids: ['Me', 'Ra'], signs: [3], title: 'Mercury–Rahu in Gemini navamsha', text: 'Speech and action do not match, and the speaker may not know which one they will keep. Books, video and software are wanted free. Paper and certificates get twisted, and a point is argued for hours. Open tools belong to this Rahu; locked and encrypted work belongs to Ketu. Keep the dealing straight.', tone: 'challenging' },
  { ids: ['Me', 'Ra'], title: 'Mercury–Rahu in D9', text: 'Known for coding, trading or schemes; digital footprint everywhere; pierce-and-hack curiosity. Complete paperwork first.', tone: 'mixed' },
  { ids: ['Mo', 'Ra'], signs: [4], title: 'Moon–Rahu in Cancer navamsha', text: 'The thirst does not close. After a break the calls, the gifts and the third person do not stop, because happiness is still being sought outside. Ketu in this sign can turn inward. Rahu cannot. Leave the toxic circle or the feeling owns the life.', tone: 'challenging' },
  { ids: ['Mo', 'Ra'], title: 'Moon–Rahu in D9', text: 'Obsessive attachment — cannot let go even when it hurts; strong appetite for experiences. Practise conscious release.', tone: 'challenging' },
  { ids: ['Mo', 'Ke'], title: 'Moon–Ketu in D9', text: 'Spiritual, introverted mind; needs solitude, white clothes, ekadashi and bhajan to stay balanced.', tone: 'mixed' },
  { ids: ['Ju', 'Ke'], signs: [5], title: 'Jupiter–Ketu in Leo navamsha', text: 'A sattvic rajyoga, and an investigator. The post is not enjoyed. Speech is too sharp. Silence helps. After they leave, the place often falls.', tone: 'mixed' },
  { ids: ['Ju', 'Ke'], title: 'Jupiter–Ketu in D9', text: 'Charity and social service; temple flowers or prasad often precede good news.', tone: 'supportive' },
  { ids: ['Ma', 'Ke'], title: 'Mars–Ketu in D9', text: 'Irritable, iron-deficient energy; sudden injuries — blood donation and Hanuman worship help.', tone: 'challenging' },
  { ids: ['Ve', 'Ra'], title: 'Venus–Rahu in D9', text: 'Intense attraction without filters; relationships carry a little "poison" — choose partners slowly.', tone: 'challenging' },
]

export function buildNavamshaPredictions(
  analysis: NavamshaAnalysis,
  d1AscRashi: Rashi,
  extras: NavamshaPredictionExtras = {},
): NavamshaPredictionReport {
  const lords = houseLords(d1AscRashi)
  const akId = analysis.atmakaraka
  const dashaByLord = new Map<GrahaId, string[]>()
  for (const l of analysis.dashaOverlay?.lords ?? []) {
    const arr = dashaByLord.get(l.lord) ?? []
    arr.push(l.levelLabel)
    dashaByLord.set(l.lord, arr)
  }

  const planets: NavamshaPlanetPrediction[] = analysis.planets.map((row) => {
    const profile = NAVAMSHA_SIGNS[row.d9Rashi]
    const signReading =
      profile.planets[row.id] ??
      `${GRAHA_NAMES[row.id]} brings ${GRAHA_SIGNIFIES[row.id] ?? 'its significations'} into the ${profile.title.toLowerCase()} — ${profile.essence.split('.')[0]}.`
    const houseSpecial = profile.inHouse?.[row.d9House] ?? null
    return {
      id: row.id,
      name: row.name,
      d1Rashi: row.d1Rashi,
      d1RashiName: row.d1RashiName,
      d1House: row.d1House,
      d9Rashi: row.d9Rashi,
      d9RashiName: row.d9RashiName,
      d9House: row.d9House,
      navamshaTitle: profile.title,
      lordOf: lordshipsOf(row.id, lords),
      isVargottama: row.isVargottama,
      isAtmakaraka: row.id === akId,
      dashaLevels: dashaByLord.get(row.id) ?? [],
      signReading,
      sourceReading: sourceReading(row.d1Rashi, row.d9Rashi),
      houseReading: `Falls in D9 house ${row.d9House} — the ${GRAHA_SIGNIFIES[row.id] ?? 'its significations'} play out through ${D9_HOUSE_THEME[row.d9House]}.`,
      houseSpecial,
      dashaReading: NAVAMSHA_DASHA_NOTE[row.d9Rashi],
      remedy: profile.remedy,
      tone: planetTone(row),
    }
  })

  const byId = new Map(planets.map((p) => [p.id, p]))
  const rowById = new Map(analysis.planets.map((r) => [r.id, r]))
  const rules: NavamshaRuleHit[] = []

  // ── D9 lagna occupants ────────────────────────────────────
  const lagnaOcc = planets.filter((p) => p.d9House === 1).map((p) => p.id)
  const lagnaRules: Partial<Record<GrahaId, [string, DashaTone]>> = {
    Ju: ['Restraint in intimacy; marriage approached through dharma — physical side needs conscious care.', 'mixed'],
    Ve: ['High desire and charm; relationship energy is strong, sometimes more than one bond.', 'mixed'],
    Ma: ['Passionate and assertive in relationships; fights if not channelled.', 'mixed'],
    Me: ['Commitment comes slowly — "internship before PPO"; relationships before marriage are common.', 'mixed'],
    Ke: ['Hard to feel satisfied with the partner even when given gold; spiritual leaning in marriage.', 'challenging'],
    Mo: ['Needs a partner who keeps talking to you emotionally; moonlight and calm places heal.', 'neutral'],
  }
  for (const id of lagnaOcc) {
    const hit = lagnaRules[id]
    if (hit) rules.push(rule(`lagna-${id}`, 'lagna', `${GRAHA_NAMES[id]} in D9 lagna`, hit[0], hit[1], [id]))
  }
  const sa = byId.get('Sa')
  if (sa && (sa.d9House === 1 || sa.d9House === 7)) {
    rules.push(rule('lagna-Sa-1-7', 'lagna', 'Saturn on the D9 1/7 axis', 'Reputation and dignity in partnership get tested; avoid humiliation-prone situations and serve at a Rama temple to soften it.', 'challenging', ['Sa']))
  }

  // ── Combinations by shared D9 sign ────────────────────────
  const bySign = new Map<Rashi, GrahaId[]>()
  for (const p of planets) bySign.set(p.d9Rashi, [...(bySign.get(p.d9Rashi) ?? []), p.id])
  const usedCombo = new Set<string>()
  for (const c of COMBINATIONS) {
    for (const [sign, ids] of bySign) {
      if (!c.ids.every((id) => ids.includes(id))) continue
      if (c.signs && !c.signs.includes(sign)) continue
      const key = [...c.ids].sort().join('-')
      if (usedCombo.has(key)) continue
      usedCombo.add(key)
      rules.push(rule(`combo-${key}`, 'combination', `${c.title} (${RASHI_NAMES[sign]})`, c.text, c.tone, c.ids))
    }
  }

  // ── Health: dusthana-sourced planet into Aries navamsha ───
  for (const p of planets) {
    if (p.d9Rashi === 1 && DUSTHANA.includes(p.d1House)) {
      rules.push(rule(`health-aries-${p.id}`, 'health', `${p.name} from D1 house ${p.d1House} into Aries navamsha`, 'Coming from a 6/8/12 house into Aries, its dasha can show physically — injuries, accidents or surgery. Drive carefully and keep the body strong.', 'challenging', [p.id]))
    }
    if (p.d1Rashi === 6 && p.d9Rashi !== 6) {
      rules.push(rule(`health-virgo-${p.id}`, 'health', `${p.name} carries Virgo karma`, `From D1 Virgo into ${p.d9RashiName}: the lineage's roga-rina-shatru (illness, debt, dispute) travels with ${GRAHA_SIGNIFIES[p.id] ?? 'its significations'}. Preventive health checks and clearing loans help.`, 'challenging', [p.id]))
    }
  }

  // ── Dignity flips ─────────────────────────────────────────
  for (const r of analysis.planets) {
    if (r.d1Dignity === 'exalted' && r.d9Dignity === 'debilitated') {
      rules.push(rule(`dig-fall-${r.id}`, 'dignity', `${r.name}: exalted in D1, debilitated in D9`, 'Rises high and then falls through ego — keep humility once success arrives.', 'challenging', [r.id]))
    } else if (r.d1Dignity === 'debilitated' && r.d9Dignity === 'exalted') {
      rules.push(rule(`dig-rise-${r.id}`, 'dignity', `${r.name}: debilitated in D1, exalted in D9`, 'Starts at rock bottom and heals over time — the area that hurt early becomes a strength (neecha → ucha transformation).', 'supportive', [r.id]))
    }
  }

  // ── Lordship rules (D1 lords placed in specific navamshas) ─
  const lordIn = (house: number) => {
    const id = lords[house]
    return id ? byId.get(id) ?? null : null
  }
  const lordRules: { house: number; sign: Rashi; title: string; text: string; tone: DashaTone }[] = [
    { house: 1, sign: 5, title: 'Lagna lord in Leo navamsha', text: 'You must establish your authority wherever you go — ego wars, but strong personality and leadership.', tone: 'mixed' },
    { house: 2, sign: 5, title: '2nd lord in Leo navamsha', text: 'Takes charge of family and finances; speaks with authority, prefers people of standing.', tone: 'mixed' },
    { house: 4, sign: 5, title: '4th lord in Leo navamsha', text: 'Builds or fights for your own home; changes of residence.', tone: 'mixed' },
    { house: 3, sign: 6, title: '3rd lord in Virgo navamsha', text: 'Performance anxiety and mental blocks in intimacy — calm the subconscious with breathwork and reassurance.', tone: 'challenging' },
    { house: 7, sign: 6, title: '7th lord in Virgo navamsha', text: 'Early relationships leave scars to learn from; marriage needs daily maintenance and service.', tone: 'challenging' },
    { house: 10, sign: 6, title: '10th lord in Virgo navamsha', text: 'Work with data, sorting, analytics, audit — daily repeatable problem-solving.', tone: 'neutral' },
    { house: 5, sign: 9, title: '5th lord in Sagittarius navamsha', text: 'Positions come and go if principles slip; higher learning keeps you on the ridge. Children and romance carry the moral test — affairs and leaked messages are the classic trap.', tone: 'mixed' },
    { house: 1, sign: 9, title: 'Lagna lord in Sagittarius navamsha', text: 'Marriage stands on dharma. Cheat and regret follows. Temple relocation, gold on the body, and teachers\' blessings steady the bond; betrayal risk is high because trust is the OS.', tone: 'mixed' },
    { house: 2, sign: 9, title: '2nd lord in Sagittarius navamsha', text: 'Speech and family storehouse sit on the ridge. Tilak, sweets and scripture keep fortune; curses and lies drain it. Inheritance may be grantha and murti more than BMW.', tone: 'mixed' },
    { house: 3, sign: 9, title: '3rd lord in Sagittarius navamsha', text: 'Short travel, siblings and in-laws test after marriage. Do not move the home deity casually. Transfers toward temple-tree localities; avoid affairs with the 3rd-house people.', tone: 'challenging' },
    { house: 4, sign: 9, title: '4th lord in Sagittarius navamsha', text: 'Home needs open space and high ceiling. Cramped vastu wounds peace and mother\'s health. Lakshmi-Narayana and Balakanda keep the house; holy water helps.', tone: 'mixed' },
    { house: 6, sign: 9, title: '6th lord in Sagittarius navamsha', text: 'Debt of masses and mama-bua philosophy wars. Altar and bathroom placement matter. Regular temple seva and small donations; Jupiter gives slowly here.', tone: 'challenging' },
    { house: 7, sign: 9, title: '7th lord in Sagittarius navamsha', text: 'Partner is the dharma exam. South-India / Balaji debt after maturity. No partnership fraud; honour the spouse. Cheating on this axis wrecks bhagya.', tone: 'mixed' },
    { house: 8, sign: 9, title: '8th lord in Sagittarius navamsha', text: 'Fortune drains until sadhana intensifies. Incomplete temples and hidden love. Shame before the guru; japa on hard tithis. Children suffer if seventh-house ethics fail.', tone: 'challenging' },
    { house: 9, sign: 9, title: '9th lord in Sagittarius navamsha', text: 'Natural seat: father, guru and fortune. Pranam daily. Father\'s conduct can disturb marriage; keep the moral bar or the ridge drops you.', tone: 'mixed' },
    { house: 10, sign: 9, title: '10th lord in Sagittarius navamsha', text: 'Career in counsel, teaching, travel-for-dharma. Credit and fees often eaten by another. Mother-in-law as stern elder; do not become unpaid temple labour without boundaries.', tone: 'mixed' },
    { house: 11, sign: 9, title: '11th lord in Sagittarius navamsha', text: 'Blessed network — enemies struggle to touch you. Marketing and image excel. No ting-tong in the friend circle; the social blow is large if you slip.', tone: 'supportive' },
    { house: 12, sign: 9, title: '12th lord in Sagittarius navamsha', text: 'Bedroom and exit. God may free a bondage marriage. Donate openly; spend on father, guru and father-in-law. Children pay when ethics slip here.', tone: 'challenging' },
    { house: 9, sign: 7, title: '9th lord in Libra navamsha', text: 'Principles limit side income — salary may be lower because you will not cut corners.', tone: 'neutral' },
    { house: 11, sign: 7, title: '11th lord in Libra navamsha', text: 'Dhana yoga when Venus is well placed — steady income through partners and finance.', tone: 'supportive' },
    { house: 1, sign: 10, title: 'Lagna lord in Capricorn navamsha', text: 'Strong, wrestler-class partner after marriage; house and car arrive, soft emotion does not. Treated as servant until personal space is marked. Appreciation forgotten — endure, then command.', tone: 'challenging' },
    { house: 2, sign: 10, title: '2nd lord in Capricorn navamsha', text: 'People speak to your parents\' wealth and your worth. Build resources alone; ancestral share often thin. Depth of speech, steady funds, fridge-hoarding and one chronic family liar.', tone: 'mixed' },
    { house: 3, sign: 10, title: '3rd lord in Capricorn navamsha', text: 'After marriage nanad, devar and father-in-law nitpick. Brilliant at family budgeting; become late on purpose. Entrance clutter; industrial neighbours. Documents and writing when Mercury supports.', tone: 'challenging' },
    { house: 4, sign: 10, title: '4th lord in Capricorn navamsha', text: 'Servant in one\'s own home despite earning. Big house from insecurity; gym machines and storage. Out-house sleep; mother or spouse marks boundaries.', tone: 'challenging' },
    { house: 5, sign: 10, title: '5th lord in Capricorn navamsha', text: 'Creativity becomes career — you enjoy the work. Children treat effort as duty owed; slow improvers who later excel. Fear of social insult; alone at school events; hate asking for money.', tone: 'mixed' },
    { house: 6, sign: 10, title: '6th lord in Capricorn navamsha', text: 'Long quiet fights with ledgers. Attacks on roti-kapda-makaan; drain until dependent. Bones and dry joints. Do not centre someone else\'s life — keep a boundary and a sword behind seva.', tone: 'challenging' },
    { house: 7, sign: 10, title: '7th lord in Capricorn navamsha', text: 'Partnerships last; intimacy is mature and dry — living with a colleague. Stability and longevity. Habit risk (tea, caffeine, alcohol). Practical over flashy.', tone: 'mixed' },
    { house: 8, sign: 10, title: '8th lord in Capricorn navamsha', text: 'Job falls when marriage fails — keep the bond merely okay to protect profession. Strong researcher; must prove claims like a lawyer. Secret study to rise; inheritance tests.', tone: 'challenging' },
    { house: 9, sign: 10, title: '9th lord in Capricorn navamsha', text: 'God after helplessness. Temple work is sweeping and being ignored. Gurus whose marriages are hell. Initial disrespect, later rise when the grind is endured.', tone: 'mixed' },
    { house: 10, sign: 10, title: '10th lord in Capricorn navamsha', text: 'Ideal seat: DIY everything — own insurance, cab to the doctor alone. Mother-in-law friction pushes the job hunt. Nanad suffers similarly; mother\'s pre/post marriage photos show the cost.', tone: 'mixed' },
    { house: 11, sign: 10, title: '11th lord in Capricorn navamsha', text: 'Everything arrives after the teeth break. Desires bind into service; fulfil wants yourself (stitch, bake, balcony farm). Hands become craft.', tone: 'mixed' },
    { house: 12, sign: 10, title: '12th lord in Capricorn navamsha', text: 'Sleep destroyed by charts, office or spouse. Learn to give — hoarded technique becomes scrap. Losses mean distance more than drama.', tone: 'challenging' },
    { house: 3, sign: 3, title: '3rd lord in Gemini navamsha', text: 'Artistic, skill-driven nature beyond gender stereotypes — singing, painting, acting.', tone: 'supportive' },
    { house: 3, sign: 7, title: '3rd lord in Libra navamsha', text: 'Many partnerships — multiple businesses, ventures and relationships; keep boundaries clear.', tone: 'mixed' },
    { house: 2, sign: 7, title: '2nd lord in Libra navamsha', text: 'Wide social and romantic circle; more than one significant relationship is possible.', tone: 'mixed' },
    { house: 12, sign: 7, title: '12th lord in Libra navamsha', text: 'Pleasure and bed-comforts pull strongly; many attachments — discipline protects marriage and money.', tone: 'mixed' },
    { house: 3, sign: 5, title: '3rd lord in Leo navamsha', text: 'Works hard for medals and recognition; siblings or neighbours of high standing.', tone: 'supportive' },
    { house: 5, sign: 5, title: '5th lord in Leo navamsha', text: 'Education, children and romance carry status — partner and peers must be of the same class.', tone: 'mixed' },
    { house: 7, sign: 8, title: '7th lord in Scorpio navamsha', text: 'Marriage transforms you — often outside convention; leave what must leave and the bond renews.', tone: 'mixed' },
    { house: 5, sign: 8, title: '5th lord in Scorpio navamsha', text: 'Love prefers mystery and delay — the partner who replies too fast feels wrong. Protective to the end; affairs and politics are read by instinct. Research and gut health sit with romance.', tone: 'mixed' },
    { house: 6, sign: 8, title: '6th lord in Scorpio navamsha', text: 'Cannot be fought cleanly — trauma-sharing and guilt win the room. Healing, psychiatry and broken people gather. Colleagues carry crises; migraine and antidepressants appear when afflicted.', tone: 'challenging' },
    { house: 8, sign: 8, title: '8th lord in Scorpio navamsha', text: 'Vargottama research: inheritance, surgery and hidden money with equal pain. After a second child the marriage often reinvented. Leave violence early — it only hardens here.', tone: 'mixed' },
    { house: 9, sign: 8, title: '9th lord in Scorpio navamsha', text: 'Guru must catch the doubt at the lowest point. Shiva and Krishna in separation-rasa. Hidden donations to teachers. Pitri and incomplete temples. Do not cross opposite-sex boundaries in this dasha.', tone: 'mixed' },
    { house: 10, sign: 8, title: '10th lord in Scorpio navamsha', text: 'Mother-in-law and career collide — one ego, one job, or one person must yield. Fraud analysis, genetics, mines, insurance. Worship the deity of the 10th when the path goes dark.', tone: 'challenging' },
    { house: 11, sign: 8, title: '11th lord in Scorpio navamsha', text: 'Desires arrive late or incomplete — thirty percent withheld like a tax. Past-life thirst returns. Groups and elder siblings cry together. Blood labs, petrochemicals, extraction industries.', tone: 'mixed' },
    { house: 12, sign: 8, title: '12th lord in Scorpio navamsha', text: 'Divorce by slow freeze — silent treatment, separate rooms, roommate marriage. Bed comfort improves only with secrecy and maturity. What you fear most about parting tends to arrive if fed.', tone: 'challenging' },
    { house: 1, sign: 8, title: 'Lagna lord in Scorpio navamsha', text: 'Marriage is past-life karmic; emotions shown become weapons. Attracts the partner magnetically — keep the story short. Old wedding customs and ancestral house rites suit.', tone: 'mixed' },
    { house: 2, sign: 8, title: '2nd lord in Scorpio navamsha', text: 'Family never fully satisfies. Money rises while relatives are cut. Fear of losing the job. Food after insult feels inedible. In-law resources unpredictably promised then withheld.', tone: 'challenging' },
    { house: 3, sign: 8, title: '3rd lord in Scorpio navamsha', text: 'The bond cracked the day you first cried while speaking. Deleted love messages; diary pages torn. In-laws and younger siblings press hard. Shoulders carry someone else\'s tears.', tone: 'challenging' },
    { house: 4, sign: 8, title: '4th lord in Scorpio navamsha', text: 'As the house completes, distance grows. Mother and mother-in-law never fully understood. Heart fear of abandonment. Father\'s late loans; spouse\'s career stress. Land and inheritance conflict.', tone: 'challenging' },
    { house: 4, sign: 1, title: '4th lord in Aries navamsha', text: 'Comfort never settles. The house is renovated or changed again and again, often in a conflict zone, and putting roots down is hard.', tone: 'challenging' },
    { house: 9, sign: 1, title: '9th lord in Aries navamsha', text: 'Always starting something new — a building, a temple, a publication. The father is restless in his own ventures; the guru, boss or manager struggles each time a fresh start is required.', tone: 'mixed' },
  ]
  for (const lr of lordRules) {
    const p = lordIn(lr.house)
    if (p && p.d9Rashi === lr.sign) {
      if (lr.house === 11 && lr.sign === 7) {
        const ve = rowById.get('Ve')
        const veOk = ve && !['debilitated', 'enemy', 'great_enemy'].includes(ve.d9Dignity) && !DUSTHANA.includes(ve.d9House)
        if (!veOk) continue
      }
      rules.push(rule(`lord-${lr.house}-${lr.sign}`, 'lordship', lr.title, `${p.name} rules your D1 house ${lr.house}. ${lr.text}`, lr.tone, [p.id]))
    }
  }
  // 10th lord with 7th lord or Venus in Libra navamsha
  const tenth = lordIn(10)
  const seventh = lordIn(7)
  if (tenth && tenth.d9Rashi === 7 && ((seventh && seventh.d9Rashi === 7 && seventh.id !== tenth.id) || byId.get('Ve')?.d9Rashi === 7) && tenth.id !== 'Ve') {
    rules.push(rule('lord-10-7-libra', 'lordship', '10th lord joins 7th lord / Venus in Libra navamsha', 'Career and marriage get tied — partner chosen for status or work; choose for character too.', 'mixed', [tenth.id]))
  }
  // 5th + 6th lord together in Libra navamsha
  const fifth = lordIn(5)
  const sixth = lordIn(6)
  if (fifth && sixth && fifth.id !== sixth.id && fifth.d9Rashi === 7 && sixth.d9Rashi === 7) {
    rules.push(rule('lord-5-6-libra', 'lordship', '5th and 6th lords in Libra navamsha', 'Conception may need patience or medical support — check D7 lagna and Jupiter/Sun there.', 'challenging', [fifth.id, sixth.id]))
  }

  // ── Karaka rules ──────────────────────────────────────────
  const ak = byId.get(akId)
  const ke = byId.get('Ke')
  if (ak && ke && signCount(ak.d9Rashi, ke.d9Rashi) === 9) {
    rules.push(rule('karaka-ke-9-ak', 'karaka', 'Ketu 9th from Atmakaraka in D9', 'Old habits and addictions cling till late in life — vow-based discipline and guru guidance are essential.', 'challenging', ['Ke', akId]))
  }
  if (ak && ke && ak.d9Rashi === ke.d9Rashi) {
    rules.push(rule('karaka-ak-ke', 'karaka', 'Atmakaraka with Ketu in D9', 'The soul releases easily — detachment and a peaceful departure; moksha leaning.', 'supportive', [akId, 'Ke']))
  }
  const ra = byId.get('Ra')
  if (ak && ra && ak.d9Rashi === ra.d9Rashi && akId !== 'Ra') {
    rules.push(rule('karaka-ak-ra', 'karaka', 'Atmakaraka with Rahu in D9', 'Many unfinished desires — practise giving and contentment so the soul is not bound.', 'challenging', [akId, 'Ra']))
  }

  // ── Venus in Aries navamsha, restless houses + malefics ───
  const veAries = byId.get('Ve')
  if (veAries && veAries.d9Rashi === 1 && [3, 8, 11, 12].includes(veAries.d9House)) {
    const mal = (bySign.get(1) ?? []).filter((id) => id !== 'Ve' && MALEFICS.includes(id))
    if (mal.length) {
      rules.push(rule(
        'venus-aries-outlet',
        'house',
        'Venus in Aries navamsha under malefic pressure',
        'Physical need runs high. If it is not met inside the bond, this placement can pull toward an affair. Keep the relationship honest and the body occupied.',
        'challenging',
        ['Ve', ...mal],
      ))
    }
  }

  // ── Malefic in Taurus navamsha, houses 6 / 8 / 12 ─────────
  const taurusMal = planets.filter((p) => p.d9Rashi === 2 && [6, 8, 12].includes(p.d9House) && MALEFICS.includes(p.id))
  if (taurusMal.length) {
    rules.push(rule(
      'taurus-resource-fight',
      'house',
      'Malefic in Taurus navamsha in 6, 8 or 12',
      `Stored resources are fought over: dowry, what was brought from the parents' house, land or cash. The relative of that D9 house is the one who presses. ${taurusMal.some((p) => p.id === 'Ma') ? 'Mars makes the fight physical.' : 'Keep the marriage reading on money, not on romance.'}`,
      'challenging',
      taurusMal.map((p) => p.id),
    ))
  }

  // ── Mercury's fame by company (Gemini lecture) ────────────
  const me = byId.get('Me')
  if (me) {
    for (const other of bySign.get(me.d9Rashi) ?? []) {
      const text = MERCURY_FAME[other]
      if (text) rules.push(rule(`fame-Me-${other}`, 'combination', `Known for · Mercury with ${GRAHA_NAMES[other]} (${me.d9RashiName})`, text, 'neutral', ['Me', other]))
    }
  }

  // ── House suppressed from its 8th (Cancer lecture) ───────
  const occByHouse = new Map<number, GrahaId[]>()
  for (const p of planets) occByHouse.set(p.d9House, [...(occByHouse.get(p.d9House) ?? []), p.id])
  for (let h = 1; h <= 12; h++) {
    const eighth = houseFrom(h, 8)
    const mal = (occByHouse.get(eighth) ?? []).filter((id) => MALEFICS.includes(id))
    if (mal.length >= 2 && !(occByHouse.get(h)?.length)) {
      rules.push(rule(`eighth-from-${h}`, 'house', `D9 house ${h} pressed from its 8th`, `House ${h} is empty while its 8th (house ${eighth}) holds ${mal.map((id) => GRAHA_NAMES[id]).join(', ')}. A strong 8th "kills" the house it is 8th from — ${D9_HOUSE_THEME[h]} get suppressed. Strengthen this house first in remedies.`, 'challenging', mal))
    }
  }

  // ── Nodes harm a neighbouring house (Capricorn lecture) ───
  const keP = byId.get('Ke')
  if (keP) {
    const h = houseFrom(keP.d9House, 12)
    rules.push(rule('node-ke-12th', 'house', `Ketu clears the 12th from itself (D9 house ${h})`, `Ketu in house ${keP.d9House} disrupts house ${h} — ${D9_HOUSE_THEME[h]}: people leave, things end or change repeatedly there.`, 'mixed', ['Ke']))
  }
  const raP = byId.get('Ra')
  if (raP) {
    const h = houseFrom(raP.d9House, 2)
    rules.push(rule('node-ra-2nd', 'house', `Rahu disturbs the 2nd from itself (D9 house ${h})`, `Rahu in house ${raP.d9House} spoils house ${h} — ${D9_HOUSE_THEME[h]} — through stubbornness and obsession.`, 'mixed', ['Ra']))
  }

  // ── 4th lord in D1 7th with malefics (Cancer lecture) ─────
  const fourthLordId = lords[4]
  const fl = fourthLordId ? byId.get(fourthLordId) : undefined
  if (fl && fl.d1House === 7) {
    const mal = planets.filter((p) => p.d1House === 7 && p.id !== fl.id && MALEFICS.includes(p.id)).map((p) => p.id)
    if (mal.length) {
      rules.push(rule('lord-4-in-7-malefic', 'lordship', '4th lord in the 7th with malefics', `${fl.name} (4th lord) sits in the D1 7th with ${mal.map((id) => GRAHA_NAMES[id]).join(', ')} — the pull of partner and outside life can leave parents without care in old age. Plan consciously for their support.`, 'challenging', [fl.id, ...mal]))
    }
  }

  // ── Scorpio lecture: damp room, fear-magnet, digbala soften ─
  const scorpioPs = planets.filter((p) => p.d9Rashi === 8)
  if (scorpioPs.length) {
    rules.push(rule(
      'scorpio-fear-magnet',
      'guidance',
      'Planet(s) in Scorpio navamsha',
      `What is most feared in the domain of ${scorpioPs.map((p) => p.name).join(', ')} tends to arrive while this placement is loud. Do not feed that fear; forgive, forget, move on. Seek a Sagittarius guide who has already walked the same fire.`,
      'challenging',
      scorpioPs.map((p) => p.id),
    ))
    for (const p of scorpioPs) {
      if (p.d9Dignity === 'debilitated' || p.d9Dignity === 'enemy' || p.d9Dignity === 'great_enemy') {
        rules.push(rule(
          `scorpio-soft-${p.id}`,
          'dignity',
          `${p.name} weakened in Scorpio navamsha`,
          'Digbala or dignity already lost — the Scorpio blow softens. Transformation still happens; the torture is less theatrical. Confirm with D9 lagna strength.',
          'mixed',
          [p.id],
        ))
      }
    }
  }
  const moScorpio = byId.get('Mo')
  if (moScorpio && moScorpio.d9Rashi === 8) {
    rules.push(rule(
      'scorpio-moon-deb',
      'dignity',
      'Moon in Scorpio navamsha (debilitated)',
      'Emotional support of the soft kind is not the gift — occult, research and a changed heart after the dasha often are. Bhoga does not fill the cup. Care the body and the bathroom; fear of deep water is classical.',
      'challenging',
      ['Mo'],
    ))
  }

  // ── Sagittarius lecture: fall test, mute ridge, Ju deb in D9 ─
  const sagPs = planets.filter((p) => p.d9Rashi === 9)
  if (sagPs.length) {
    rules.push(rule(
      'sagittarius-fall-test',
      'guidance',
      'Planet(s) in Sagittarius navamsha',
      `Moral ridge active for ${sagPs.map((p) => p.name).join(', ')}. Temptation will call — refuse the slip (affairs, small cheats, regulatory breaks) or the chair falls. Stay mute; keep three–four months\' savings while loud; refill punya with nama and charity.`,
      'challenging',
      sagPs.map((p) => p.id),
    ))
    rules.push(rule(
      'sagittarius-mute-faith',
      'guidance',
      'Sagittarius navamsha is mute',
      'Ask the deity once, then do your duty — faith, not Gemini bargaining. Big three-to-five-year goals; do not fight over small change. Work under one cut-to-cut authority, not a panel.',
      'neutral',
      sagPs.map((p) => p.id),
    ))
  }
  const juRow = rowById.get('Ju')
  if (juRow && juRow.d9Dignity === 'debilitated') {
    rules.push(rule(
      'sagittarius-ju-deb-d9',
      'dignity',
      'Jupiter debilitated in D9',
      'Happiness from children thins; extramarital or boundary-breaking pull rises when ethics slip. Ask plainly about shady bonds when this Jupiter\'s age or dasha runs — confirm before stating. Rebuild through Vishnu-tattva and vows kept.',
      'challenging',
      ['Ju'],
    ))
  }
  const veSag = byId.get('Ve')
  if (veSag && veSag.d9Rashi === 9) {
    rules.push(rule(
      'sagittarius-venus-boundary',
      'guidance',
      'Venus in Sagittarius navamsha',
      'Keep respectful distance from casual opposite-sex pull. Loyalty is the exam; officers and public roles carry harassment-case risk if boundaries slip. Lakshmi or Radha; ritual purity over DJ shortcuts.',
      'challenging',
      ['Ve'],
    ))
  }
  const juSag = byId.get('Ju')
  const saSag = byId.get('Sa')
  if (juSag && juSag.d9Rashi === 9 && saSag) {
    const saAsp =
      saSag.d9Rashi === juSag.d9Rashi ||
      signCount(saSag.d9Rashi, juSag.d9Rashi) === 3 ||
      signCount(saSag.d9Rashi, juSag.d9Rashi) === 10
    if (saAsp) {
      rules.push(rule(
        'sagittarius-ju-sa-seva',
        'combination',
        'Saturn influences Jupiter in Sagittarius navamsha',
        'Lifelong free consultation, temple errands and social-religious service tend to be extracted — boundaries with "beta" labour requests still matter.',
        'mixed',
        ['Ju', 'Sa'],
      ))
    }
  }

  // ── Capricorn lecture: pressure cooker, bonded labour (Ju deb already covered above) ─
  const capPs = planets.filter((p) => p.d9Rashi === 10)
  if (capPs.length) {
    rules.push(rule(
      'capricorn-pressure-cooker',
      'guidance',
      'Planet(s) in Capricorn navamsha',
      `Pressure-cooker active for ${capPs.map((p) => p.name).join(', ')}. Mood does not excuse duty (opposite Cancer). You become the bonded labourer of that signification — serve, endure, then command. Do not play victim; mark boundaries so home is not unpaid office.`,
      'challenging',
      capPs.map((p) => p.id),
    ))
    rules.push(rule(
      'capricorn-manual-grind',
      'guidance',
      'Capricorn navamsha demands real work',
      'Manual, old-school, alone on the job nobody else knows. Under load the mind cannot innovate — finish the scrape first. Authority, money and status can arrive after grinding; soft honour stays thin (Jupiter debilitated here). Strong dignity commands; weak dignity gasps. Exit is Pisces: a little bhakti and letting go.',
      'neutral',
      capPs.map((p) => p.id),
    ))
  }
  const saCap = byId.get('Sa')
  if (saCap && saCap.d9Rashi === 10) {
    rules.push(rule(
      'capricorn-saturn-own',
      'guidance',
      'Saturn in Capricorn navamsha',
      'Own-sign prison: past laziness repaid as work with no shortcuts. Steer off IT quarterly churn toward core industry, finance, law, refining, QA or training. Major changes only — never fifteen-day software drama.',
      'challenging',
      ['Sa'],
    ))
  }
  const suCap = byId.get('Su')
  if (suCap && suCap.d9Rashi === 10) {
    rules.push(rule(
      'capricorn-sun-authority',
      'guidance',
      'Sun in Capricorn navamsha',
      'Mukhiya of labourers: territory, government quarter energy, consistency that outlasts early stares. Personal life burns while the post is built. Copper / Surya-Narayana; purpose before ego. Stand for mother when in the 4th without drowning the spouse.',
      'mixed',
      ['Su'],
    ))
  }

  // ── Virgo lecture: piercings, stitches, lifelong learning ─
  for (const id of ['Ma', 'Ra'] as GrahaId[]) {
    const p = byId.get(id)
    if (p && p.d9Rashi === 6) rules.push(rule(`virgo-pierce-${id}`, 'health', `${p.name} in Virgo navamsha`, 'Inclination to piercings or small body procedures; the body part ruled here needs correction work.', 'neutral', [id]))
  }
  for (const id of ['Ra', 'Ke'] as GrahaId[]) {
    const p = byId.get(id)
    if (p && p.d9Rashi === 6) rules.push(rule(`virgo-stitch-${id}`, 'health', `${p.name} in Virgo navamsha`, 'Stitches or minor surgery in the lower body/abdomen are indicated — keep up gut and pelvic health.', 'challenging', [id]))
  }
  const lagnaLord = lords[1] ? byId.get(lords[1]) : undefined
  if (lagnaLord) {
    const nodeWith = (bySign.get(lagnaLord.d9Rashi) ?? []).filter((id) => id === 'Ra' || id === 'Ke')
    if (nodeWith.length) rules.push(rule('lagna-lord-nodes', 'health', `Lagna lord ${lagnaLord.name} with ${nodeWith.map((id) => GRAHA_NAMES[id]).join('/')} in D9`, 'Head injuries or stitches to the head are indicated — wear a helmet and avoid risky falls.', 'challenging', [lagnaLord.id, ...nodeWith]))
  }
  const sixthLord = lords[6] ? byId.get(lords[6]) : undefined
  if (sixthLord && lagnaLord && sixthLord.id !== lagnaLord.id && (sixthLord.d9Rashi === lagnaLord.d9Rashi || sixthLord.d9House === 5)) {
    rules.push(rule('lord-6-learning', 'lordship', '6th lord linked to lagna lord / 5th in D9', 'A lifelong student — learning never stops; competitive exams may take many attempts, but persistence wins.', 'mixed', [sixthLord.id, lagnaLord.id]))
  }

  // ── Taurus lecture: Rahu AK, 0° planets, Moon 4th, Venus ──
  if (akId === 'Ra' && raP) {
    const disp = SIGN_LORDS[raP.d9Rashi]
    rules.push(rule('karaka-rahu-ak', 'karaka', 'Rahu as Atmakaraka', `Does not forgive easily and plans carefully against enemies; read the dispositor ${GRAHA_NAMES[disp]} (lord of D9 ${raP.d9RashiName}) to see how that plays out.`, 'mixed', ['Ra', disp]))
  }
  for (const r of analysis.planets) {
    if (r.d1Degree < 1) {
      rules.push(rule(`zero-deg-${r.id}`, 'dignity', `${r.name} at 0° (${r.d1RashiName})`, 'Planets at the very start of a sign give good results and great pace in life (per the lectures).', 'supportive', [r.id]))
    }
  }
  const moP = byId.get('Mo')
  if (moP && moP.d1House === 4) {
    rules.push(rule('moon-4th-donate', 'guidance', 'Moon in the D1 4th house', 'Be the first to give — donate food, water and salt regularly to keep home and mind steady.', 'neutral', ['Mo']))
  }
  const veD9 = rowById.get('Ve')
  if (veD9 && (['exalted', 'moolatrikona', 'own'].includes(veD9.d9Dignity) || veD9.isVargottama)) {
    rules.push(rule('venus-clean', 'guidance', 'Strong Venus in D9', 'Avoid eating in untidy places and living in a dirty environment — cleanliness keeps Venus giving money and grace.', 'supportive', ['Ve']))
  }

  // ── Naming after the strongest planet (Cancer lecture) ────
  const strongest = extras.strongestGraha ?? analysis.advanced?.strongest?.id
  if (strongest && NAMING_DEITY[strongest]) {
    rules.push(rule('naming-strongest', 'guidance', `Name after the strongest planet — ${GRAHA_NAMES[strongest]}`, `The name is called daily and carries emotion (Moon). Choose names of ${NAMING_DEITY[strongest]} for this chart's children or a pet-name.`, 'neutral', [strongest]))
  }

  // ── Indu lagna wealth check (Libra lecture) ───────────────
  if (typeof extras.induLagnaLon === 'number' && Number.isFinite(extras.induLagnaLon)) {
    const lon = ((extras.induLagnaLon % 360) + 360) % 360
    const nakLord = NAK_LORDS[Math.floor(lon / (360 / 27)) % 9]
    const nl = nakLord ? rowById.get(nakLord) : undefined
    if (nl && (nl.d1Dignity === 'exalted' || nl.d1Dignity === 'debilitated')) {
      rules.push(rule('indu-wealth', 'lordship', `Indu lagna star lord ${nl.name} is ${nl.d1Dignity}`, 'When the nakshatra lord of Indu lagna is exalted or debilitated, the chart can generate very large wealth.', 'supportive', [nl.id]))
    }
  }

  // ── How the soul departs (Scorpio lecture, Jaimini) ───────
  if (ak) {
    const withAk = (bySign.get(ak.d9Rashi) ?? []).filter((id) => id !== akId)
    const malWith = withAk.filter((id) => MALEFICS.includes(id))
    const benWith = withAk.filter((id) => BENEFICS.includes(id))
    const ketuTrine = keP ? [1, 5, 9].includes(signCount(keP.d9Rashi, ak.d9Rashi)) : false
    let text: string | null = null
    let tone: DashaTone = 'neutral'
    if (withAk.includes('Ra')) {
      text = 'With Rahu, many desires remain at the end — practise giving and contentment now so the soul leaves light.'
      tone = 'challenging'
    } else if (withAk.includes('Ke') || ketuTrine) {
      text = 'Ketu links the atmakaraka — the body is released easily and peacefully.'
      tone = 'supportive'
    } else if ((ak.d9House === 12 || ak.d9Rashi === 12) && !malWith.length) {
      text = 'Atmakaraka in the 12th / Pisces without malefics — a peaceful departure, as if in sleep.'
      tone = 'supportive'
    } else if (DUSTHANA.includes(ak.d9House) && malWith.length) {
      text = 'Atmakaraka in a dusthana with malefics — the end tends to come through illness or a hospital stay; preventive health care matters.'
      tone = 'challenging'
    } else if (ak.d9House === 9) {
      text = 'Atmakaraka in the 9th — the soul departs with blessings, often near a temple or in devotion.'
      tone = 'supportive'
    } else if (ak.d9House === 4) {
      const fourthSign = analysis.houses.find((h) => h.house === 4)?.rashi
      text = withAk.includes('Ma')
        ? 'Atmakaraka in the 4th with Mars — departure during travel; road safety is essential.'
        : fourthSign === 12
          ? 'Atmakaraka in the 4th (Pisces) — departure during travel, possibly air travel.'
          : 'Atmakaraka in the 4th — departure tends to happen while travelling.'
      tone = 'mixed'
    } else if (ak.d9House === 5) {
      text = 'Atmakaraka in the 5th — departure amid people or entertainment, at ease.'
      tone = 'neutral'
    }
    if (text) {
      rules.push(rule('departure-ak', 'departure', 'Atmakaraka indication of departure', `${text} (Jaimini indication of manner, not timing${benWith.length ? `; ${benWith.map((id) => GRAHA_NAMES[id]).join(', ')} with the AK soften it` : ''}.)`, tone, [akId]))
    }
  }

  // ── Atmakaraka reading ────────────────────────────────────
  let atmakaraka: NavamshaAtmakarakaReading | null = null
  const akRow = rowById.get(akId)
  if (akRow) {
    const s = akRow.d9Rashi
    const ex = EXALTED_IN[s]
    const db = DEBILITATED_IN[s]
    atmakaraka = {
      id: akId,
      name: GRAHA_NAMES[akId],
      d9Rashi: s,
      d9RashiName: RASHI_NAMES[s],
      theme: ATMAKARAKA_IN_NAVAMSHA[s],
      present: ex ? { planet: ex, text: `${GRAHA_NAMES[ex]} is exalted here — ${GRAHA_QUALITIES[ex]} come naturally.` } : null,
      missing: db ? { planet: db, text: `${GRAHA_NAMES[db]} is debilitated here — ${GRAHA_QUALITIES[db]} tend to be missing and must be built consciously.` } : null,
    }
  }

  // ── Sign cards (D9 houses 1–12) ───────────────────────────
  const signCards: NavamshaSignCard[] = analysis.houses.map((h) => {
    const profile = NAVAMSHA_SIGNS[h.rashi]
    const occupants = h.occupants.map((o) => o.id)
    return {
      house: h.house,
      sign: h.rashi,
      signName: h.rashiName,
      title: profile.title,
      keywords: profile.keywords,
      essence: profile.essence,
      shadow: profile.shadow,
      guidance: profile.guidance,
      remedy: profile.remedy,
      houseTheme: D9_HOUSE_THEME[h.house],
      houseSpecial: profile.inHouse?.[h.house] ?? null,
      occupants,
      empty: occupants.length === 0,
    }
  })

  // ── Age markers ───────────────────────────────────────────
  const ageMarkers: NavamshaAgeMarker[] = []
  for (const [sign, ids] of bySign) {
    for (const a of NAVAMSHA_SIGNS[sign].ages ?? []) {
      ageMarkers.push({ age: a.age, sign, signName: RASHI_NAMES[sign], planets: ids, note: a.note })
    }
  }
  const veRow = byId.get('Ve')
  if (veRow?.d9Rashi === 10) {
    ageMarkers.push({ age: 33, sign: 10, signName: RASHI_NAMES[10], planets: ['Ve'], note: 'Venus in Capricorn navamsha — after 32–33 a separate (nuclear) household eases career and marriage.' })
  }
  ageMarkers.sort((a, b) => a.age - b.age)

  // ── Element balance ───────────────────────────────────────
  const elementBalance: NavamshaPredictionReport['elementBalance'] = { fire: [], earth: [], air: [], water: [] }
  for (const p of planets) elementBalance[SIGN_ELEMENT[p.d9Rashi]].push(p.id)
  const dominant = (Object.entries(elementBalance) as [keyof typeof elementBalance, GrahaId[]][])
    .sort((a, b) => b[1].length - a[1].length)[0]
  if (dominant && dominant[1].length >= 4) {
    const elementText: Record<string, string> = {
      fire: 'Most planets in fire navamshas — always initiating, building and seeking status; finishing is the challenge.',
      earth: 'Most planets in earth navamshas — practical, resource-building, service-driven; joy must be cultivated.',
      air: 'Most planets in air navamshas — communication, networks and reactions drive life; ground yourself.',
      water: 'Most planets in water navamshas — emotional, intuitive and karmic; release and charity bring peace.',
    }
    rules.push(rule(`element-${dominant[0]}`, 'timing', `${dominant[1].length} planets in ${dominant[0]} navamshas`, elementText[dominant[0]], 'neutral', dominant[1]))
  }

  const activeNow = planets.filter((p) => p.dashaLevels.length > 0)
  const lagnaProfile = NAVAMSHA_SIGNS[analysis.d9Lagna]
  const headline = `${analysis.d9LagnaName} navamsha lagna — ${lagnaProfile.title}. ${lagnaProfile.guidance}`

  return {
    d9Lagna: analysis.d9Lagna,
    d9LagnaName: analysis.d9LagnaName,
    headline,
    planets,
    atmakaraka,
    rules,
    signCards,
    ageMarkers,
    activeNow,
    elementBalance,
  }
}

/** Convenience wrapper straight from a chart. */
export function analyzeNavamshaPredictions(chart: ChartOutput): NavamshaPredictionReport | null {
  const analysis = analyzeNavamsha(chart)
  if (!analysis) return null
  return buildNavamshaPredictions(analysis, chart.lagnas.ascRashi as Rashi, {
    induLagnaLon: chart.lagnas.induLagna,
    strongestGraha: chart.shadbala?.strongest as GrahaId | undefined,
  })
}
