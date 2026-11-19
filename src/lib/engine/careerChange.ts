// ─────────────────────────────────────────────────────────────
//  src/lib/engine/careerChange.ts
//  Career change and switch desk.
//  How often the work changes, when to switch, job vs business,
//  job-loss risk, promotion, transfer, boss and colleagues, side
//  income, reskilling, government work, satisfaction, late career.
//  Dasha windows are read by house lordship: 2/6/10/11 build the
//  post, 3/5/9/12 move it (5 and 9 are the 8th and 12th from the
//  10th), 8/12 disrupt it. Pure engine — no React/DB, no ephemeris.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, DashaNode, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { aspectsSign, signModality } from '@/lib/engine/dashamsaClassical'
import { NATURAL_ENEMIES, NATURAL_FRIENDS } from '@/lib/engine/dignity'
import { gName, rName } from '@/lib/engine/divisionalLang'
import type { EngineLang } from '@/lib/engine/lang'

export type ChangeTone = 'supportive' | 'caution' | 'mixed'
export type ChangeWindowKind = 'switch' | 'rise' | 'caution' | 'steady'
export type StabilityLevel = 'steady' | 'moderate' | 'frequent'

export interface ChangeCard {
  id: string
  title: string
  answer: string
  reading: string
  tone: ChangeTone
  factors: string[]
}

export interface ChangeWindow {
  id: string
  kind: ChangeWindowKind
  kindLabel: string
  mahaLord: GrahaId
  antarLord: GrahaId
  label: string
  start: string
  end: string
  live: boolean
  reading: string
  tone: ChangeTone
  /** Cross-checks of the dasha window: D10 placement, KP significations, future gochar. */
  checks: WindowChecks
}

export type CheckVerdict = 'agrees' | 'disagrees' | 'neutral'

export interface WindowChecks {
  d10: { verdict: CheckVerdict; line: string } | null
  kp: { verdict: CheckVerdict; line: string } | null
  gochar: { verdict: CheckVerdict; line: string } | null
  /** How many of the available checks agree with the window kind. */
  agree: number
  available: number
}

/** Sidereal sign span of a slow planet (shape of /api/transit/slow-spans). */
export interface SlowSpan {
  id: 'Sa' | 'Ju' | 'Ra' | 'Ke'
  rashi: Rashi
  start: string
  end: string
}

export interface CareerDayLink {
  id: 'interview' | 'join' | 'business'
  label: string
  note: string
  purpose: 'EDUCATION' | 'BUSINESS'
  from: string
  to: string
}

export interface ChangeGroup {
  id: 'pattern' | 'risk' | 'growth' | 'life'
  title: string
  cards: ChangeCard[]
}

export interface TransitPosition {
  id: GrahaId
  rashi: Rashi
  isRetro?: boolean
}

export interface CareerChangeAnalysis {
  headline: string
  summary: string
  stability: { level: StabilityLevel; score: number; label: string; reading: string; factors: string[] }
  now: ChangeCard
  sky: ChangeCard | null
  windows: ChangeWindow[]
  nextSwitch: ChangeWindow | null
  nextRise: ChangeWindow | null
  /** First switch window (live or upcoming) that at least two cross-checks confirm. */
  bestSwitch: ChangeWindow | null
  /** Muhurta day-finder presets for the career steps (interview, joining, starting a business). */
  dayLinks: CareerDayLink[]
  groups: ChangeGroup[]
  rules: string[]
  closing: string
}

const SIGN_LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}
const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const MALEFICS = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
const STRONG: Dignity[] = ['exalted', 'moolatrikona', 'own', 'great_friend']
const WEAK: Dignity[] = ['enemy', 'great_enemy', 'debilitated']
const GROW_HOUSES = [2, 6, 10, 11]
const MOVE_HOUSES = [3, 5, 9, 12]
const RISK_HOUSES = [8, 12]
const DAY = 86_400_000
const HORIZON_YEARS = 12

const WEEKDAY: Record<string, [string, string]> = {
  Su: ['Sunday', 'रविवार'], Mo: ['Monday', 'सोमवार'], Ma: ['Tuesday', 'मंगलवार'], Me: ['Wednesday', 'बुधवार'],
  Ju: ['Thursday', 'गुरुवार'], Ve: ['Friday', 'शुक्रवार'], Sa: ['Saturday', 'शनिवार'],
  Ra: ['Saturday', 'शनिवार'], Ke: ['Tuesday', 'मंगलवार'],
}

const FIELDS: Record<string, [string, string]> = {
  Su: ['government, administration, leadership roles, medicine', 'सरकार, प्रशासन, नेतृत्व पद, चिकित्सा'],
  Mo: ['hospitality, public dealing, care work, food, travel', 'आतिथ्य, जनसंपर्क, सेवा-देखभाल, खाद्य, यात्रा'],
  Ma: ['engineering, defence, police, real estate, sport, surgery', 'अभियांत्रिकी, रक्षा, पुलिस, भू-संपत्ति, खेल, शल्य'],
  Me: ['commerce, IT, writing, accounts, analysis, sales', 'वाणिज्य, आईटी, लेखन, लेखा, विश्लेषण, बिक्री'],
  Ju: ['teaching, law, finance, advisory, consulting', 'अध्यापन, विधि, वित्त, परामर्श'],
  Ve: ['arts, design, media, fashion, luxury, hospitality', 'कला, डिज़ाइन, मीडिया, फैशन, विलासिता, आतिथ्य'],
  Sa: ['operations, manufacturing, mining, labour, long-term service', 'संचालन, विनिर्माण, खनन, श्रम, दीर्घकालीन सेवा'],
  Ra: ['technology, foreign firms, aviation, research into the new, mass media', 'प्रौद्योगिकी, विदेशी कंपनियाँ, विमानन, नया शोध, जनसंचार'],
  Ke: ['specialist research, coding, healing, spiritual or technical depth', 'विशेषज्ञ शोध, कोडिंग, उपचार, आध्यात्मिक या तकनीकी गहराई'],
}

const HOUSE_ROLE: Record<number, [string, string]> = {
  1: ['the self', 'स्वयं'],
  2: ['income', 'आय'],
  3: ['effort and short moves', 'पराक्रम और छोटे स्थानांतरण'],
  4: ['the home base', 'घर-आधार'],
  5: ['study, and the 8th from the 10th', 'अध्ययन, और दशम से अष्टम'],
  6: ['service and competition', 'सेवा और प्रतिस्पर्धा'],
  7: ['business and partners', 'व्यापार और साझेदार'],
  8: ['disruption', 'व्यवधान'],
  9: ['fortune, and the 12th from the 10th', 'भाग्य, और दशम से द्वादश'],
  10: ['the post itself', 'स्वयं पद'],
  11: ['gains and promotion', 'लाभ और पदोन्नति'],
  12: ['exit, foreign work, and loss', 'निकास, विदेशी काम और हानि'],
}

const HI_ORDINAL: Record<number, string> = {
  1: 'प्रथम', 2: 'द्वितीय', 3: 'तृतीय', 4: 'चतुर्थ', 5: 'पंचम', 6: 'षष्ठ',
  7: 'सप्तम', 8: 'अष्टम', 9: 'नवम', 10: 'दशम', 11: 'एकादश', 12: 'द्वादश',
}

const KIND_LABEL: Record<ChangeWindowKind, [string, string]> = {
  switch: ['Change window', 'परिवर्तन खिड़की'],
  rise: ['Growth window', 'उन्नति खिड़की'],
  caution: ['Guard the post', 'पद की रक्षा'],
  steady: ['Steady', 'स्थिर'],
}

const KIND_TONE: Record<ChangeWindowKind, ChangeTone> = {
  switch: 'mixed',
  rise: 'supportive',
  caution: 'caution',
  steady: 'mixed',
}

function houseSign(asc: number, house: number): Rashi {
  return ((((asc - 1 + house - 1) % 12) + 12) % 12 + 1) as Rashi
}

function wholeSignHouse(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function toMs(value: Date | string | number): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

function day(ms: number): string {
  return Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : ''
}

function isStrong(d: Dignity | undefined): boolean {
  return !!d && STRONG.includes(d)
}

function isWeak(d: Dignity | undefined): boolean {
  return !!d && WEAK.includes(d)
}

function toneOf(score: number, goodAt = 2, badAt = -1): ChangeTone {
  if (score >= goodAt) return 'supportive'
  if (score <= badAt) return 'caution'
  return 'mixed'
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, Math.round(n)))
}

/** Builds the per-chart context once; every card reads from it. */
function context(chart: ChartOutput, lang: EngineLang) {
  const asc = chart.lagnas.ascRashi as Rashi
  const hi = lang === 'hi'
  const T = (en: string, hiText: string) => (hi ? hiText : en)
  const find = (id: GrahaId) => chart.grahas.find(g => g.id === id)
  const lordOf = (h: number) => SIGN_LORDS[houseSign(asc, h)]
  const lordG = (h: number) => find(lordOf(h))
  const houseOf = (g: GrahaData | undefined) => (g ? wholeSignHouse(g.rashi, asc) : null)
  const occupants = (h: number) => chart.grahas.filter(g => CLASSICAL.includes(g.id) && g.rashi === houseSign(asc, h))
  const occ = (id: GrahaId, h: number) => occupants(h).some(g => g.id === id)
  const exchanges = (a: GrahaData, b: GrahaData) => SIGN_LORDS[a.rashi] === b.id && SIGN_LORDS[b.rashi] === a.id
  const linked = (a: GrahaData | undefined, b: GrahaData | undefined) => {
    if (!a || !b || a.id === b.id) return false
    if (a.rashi === b.rashi || exchanges(a, b)) return true
    return aspectsSign(a.rashi, a.id, b.rashi) || aspectsSign(b.rashi, b.id, a.rashi)
  }
  const aspectsHouse = (g: GrahaData | undefined, h: number) => !!g && aspectsSign(g.rashi, g.id, houseSign(asc, h))
  const name = (id: GrahaId | string) => gName(id as GrahaId, lang)
  const ord = (n: number) => (hi ? HI_ORDINAL[n] ?? String(n) : `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`)
  const role = (h: number) => HOUSE_ROLE[h][hi ? 1 : 0]
  const fields = (id: GrahaId) => FIELDS[id]?.[hi ? 1 : 0] ?? ''

  /** Houses a planet rules; Rahu and Ketu give the results of their dispositor. */
  const ruled = (id: GrahaId): number[] => {
    let ruler = id
    if (id === 'Ra' || id === 'Ke') {
      const node = find(id)
      if (!node) return []
      ruler = SIGN_LORDS[node.rashi]
    }
    const out: number[] = []
    for (let h = 1; h <= 12; h++) if (lordOf(h) === ruler) out.push(h)
    return out
  }

  return { asc, hi, T, find, lordOf, lordG, houseOf, occupants, occ, linked, aspectsHouse, name, ord, role, fields, ruled }
}

type Ctx = ReturnType<typeof context>

function lordScore(ctx: Ctx, id: GrahaId) {
  const g = ctx.find(id)
  const ruled = ctx.ruled(id)
  const sits = ctx.houseOf(g)
  let grow = ruled.filter(h => GROW_HOUSES.includes(h)).length
  let move = ruled.filter(h => MOVE_HOUSES.includes(h)).length
  let risk = ruled.filter(h => RISK_HOUSES.includes(h)).length
  if (sits != null) {
    if (sits === 10 || sits === 11) grow += 1
    else if (sits === 2 || sits === 6) grow += 0.5
    if (sits === 3 || sits === 9 || sits === 12) move += 1
    if (sits === 8 || sits === 12) risk += 1
  }
  if (id === 'Ra' || id === 'Ke') move += 1
  if (g && (g.dignity === 'debilitated' || g.isCombust)) risk += 1
  if (g && isStrong(g.dignity)) risk = Math.max(0, risk - 0.5)
  return { grow, move, risk, ruled, sits }
}

function describeLord(ctx: Ctx, id: GrahaId): string {
  const s = lordScore(ctx, id)
  const rules = s.ruled.length
    ? ctx.T(
      `${ctx.name(id)} rules ${s.ruled.map(h => `the ${ctx.ord(h)} (${ctx.role(h)})`).join(' and ')}`,
      `${ctx.name(id)} ${s.ruled.map(h => `${ctx.ord(h)} भाव (${ctx.role(h)})`).join(' और ')} का स्वामी है`,
    )
    : ctx.T(`${ctx.name(id)} rules no house here`, `${ctx.name(id)} यहाँ किसी भाव का स्वामी नहीं`)
  const node = id === 'Ra' || id === 'Ke'
    ? ctx.T(' through its dispositor', ' (अपने राशि-स्वामी के द्वारा)')
    : ''
  const sits = s.sits != null
    ? ctx.T(` and sits in the ${ctx.ord(s.sits)}`, ` और ${ctx.ord(s.sits)} भाव में बैठा है`)
    : ''
  return `${rules}${node}${sits}${ctx.T('.', '।')}`
}

function classifyPeriod(ctx: Ctx, maha: GrahaId, antar: GrahaId): { kind: ChangeWindowKind; reading: string } {
  const m = lordScore(ctx, maha)
  const a = lordScore(ctx, antar)
  const grow = a.grow + m.grow * 0.5
  const move = a.move + m.move * 0.5
  const risk = a.risk + m.risk * 0.5
  let kind: ChangeWindowKind = 'steady'
  if (risk >= 2 && risk > grow) kind = 'caution'
  else if (move >= 1.5 && move >= grow) kind = 'switch'
  else if (grow >= 1.5) kind = 'rise'
  const lines = [describeLord(ctx, antar)]
  if (maha !== antar) lines.push(describeLord(ctx, maha))
  const verdict: Record<ChangeWindowKind, [string, string]> = {
    switch: [
      'Movement houses lead: a job change, new role, or move is easier now. Leave with an offer in hand.',
      'गति के भाव आगे हैं: नौकरी बदलना, नई भूमिका या स्थानांतरण अभी आसान है। हाथ में प्रस्ताव लेकर ही छोड़ें।',
    ],
    rise: [
      'The houses that build the post lead: raise, promotion, or a bigger role where you are.',
      'पद बनाने वाले भाव आगे हैं: जहाँ हैं वहीं वेतन-वृद्धि, पदोन्नति या बड़ी भूमिका।',
    ],
    caution: [
      'Disruption houses lead: protect the post, avoid quitting in anger, keep savings ready.',
      'व्यवधान के भाव आगे हैं: पद की रक्षा करें, गुस्से में इस्तीफ़ा न दें, बचत तैयार रखें।',
    ],
    steady: [
      'No house group dominates: continue, build skills, and prepare the next move.',
      'कोई भाव-समूह हावी नहीं: काम जारी रखें, कौशल बढ़ाएँ और अगले कदम की तैयारी करें।',
    ],
  }
  lines.push(verdict[kind][ctx.hi ? 1 : 0])
  return { kind, reading: lines.join(' ') }
}

function d10Check(ctx: Ctx, chart: ChartOutput, lord: GrahaId, kind: ChangeWindowKind): WindowChecks['d10'] {
  const d10Asc = chart.vargaLagnas?.D10
  const g = chart.vargas?.D10?.find(x => x.id === lord)
  if (!d10Asc || !g) return null
  const h = wholeSignHouse(g.rashi, d10Asc)
  const good = [1, 4, 5, 7, 9, 10, 11].includes(h)
  const bad = [6, 8, 12].includes(h)
  let verdict: CheckVerdict = 'neutral'
  if (kind === 'caution') verdict = bad ? 'agrees' : good ? 'disagrees' : 'neutral'
  else if (kind === 'switch' || kind === 'rise') verdict = good ? 'agrees' : bad ? 'disagrees' : 'neutral'
  const line = good
    ? ctx.T(`D10: ${ctx.name(lord)} sits in dashamsha house ${h}, a strong career house.`, `दशमांश: ${ctx.name(lord)} दशमांश के ${h} भाव में, बलवान करियर भाव।`)
    : bad
      ? ctx.T(`D10: ${ctx.name(lord)} sits in dashamsha house ${h}, which strains the result.`, `दशमांश: ${ctx.name(lord)} दशमांश के ${h} भाव में, जो फल पर दबाव डालता है।`)
      : ctx.T(`D10: ${ctx.name(lord)} sits in dashamsha house ${h}, a neutral placement.`, `दशमांश: ${ctx.name(lord)} दशमांश के ${h} भाव में, तटस्थ स्थिति।`)
  return { verdict, line }
}

/** KP: 2/6/10/11 give a job or rise; 3/5/9 with 10 or 11 give a change of job; 5/9/12/8 without 10/11 end or disrupt it. */
function kpCheck(ctx: Ctx, chart: ChartOutput, lord: GrahaId, kind: ChangeWindowKind): WindowChecks['kp'] {
  const sig = chart.kp?.significators?.planetSignificators?.[lord]
  if (!sig?.length) return null
  const houses = [...new Set(sig)].sort((a, b) => a - b)
  const has = (h: number) => houses.includes(h)
  const job = has(10) || has(11)
  const grow = [2, 6, 10, 11].filter(has).length
  const move = [3, 5, 9].filter(has).length
  const loss = [5, 8, 9, 12].filter(has).length
  let kp: ChangeWindowKind = 'steady'
  if (move && job) kp = 'switch'
  else if (grow >= 2) kp = 'rise'
  else if (loss >= 2 && !job) kp = 'caution'
  const verdict: CheckVerdict = kp === kind ? 'agrees' : kp === 'steady' || kind === 'steady' ? 'neutral' : 'disagrees'
  const name: Record<ChangeWindowKind, [string, string]> = {
    switch: ['a change of job', 'नौकरी परिवर्तन'],
    rise: ['a new post or rise', 'नया पद या उन्नति'],
    caution: ['the end of a post', 'पद का अंत'],
    steady: ['no clear career event', 'कोई स्पष्ट करियर घटना नहीं'],
  }
  return {
    verdict,
    line: ctx.T(
      `KP: ${ctx.name(lord)} signifies houses ${houses.join(', ')}, which points to ${name[kp][0]}.`,
      `केपी: ${ctx.name(lord)} भाव ${houses.join(', ')} का कारक है, जो ${name[kp][1]} दिखाता है।`,
    ),
  }
}

function overlapDays(aStart: string, aEnd: string, bStart: string, bEnd: string): number {
  const s = Math.max(Date.parse(aStart), Date.parse(bStart))
  const e = Math.min(Date.parse(aEnd), Date.parse(bEnd))
  return e > s ? (e - s) / DAY : 0
}

function gocharCheck(ctx: Ctx, spans: SlowSpan[], start: string, end: string, kind: ChangeWindowKind): WindowChecks['gochar'] {
  if (!spans.length) return null
  const total = Math.max(1, (Date.parse(end) - Date.parse(start)) / DAY)
  const moon = ctx.find('Mo')
  let covered = 0
  let juGood = 0
  let saHard = 0
  let saGood = 0
  for (const sp of spans) {
    const d = overlapDays(start, end, sp.start, sp.end)
    if (!d) continue
    const fromLagna = wholeSignHouse(sp.rashi, ctx.asc)
    const fromMoon = moon ? wholeSignHouse(sp.rashi, moon.rashi) : 0
    if (sp.id === 'Ju') {
      covered += d
      if ([2, 9, 10, 11].includes(fromLagna) || [2, 5, 7, 9, 11].includes(fromMoon)) juGood += d
    }
    if (sp.id === 'Sa') {
      if ([12, 1, 2, 4, 8].includes(fromMoon)) saHard += d
      else if ([3, 6, 11].includes(fromMoon)) saGood += d
    }
  }
  if (!covered) return null
  const ju = Math.round((juGood / total) * 100)
  const saH = Math.round((saHard / total) * 100)
  const saG = Math.round((saGood / total) * 100)
  const support = ju >= 50 || saG >= 50
  const strain = saH >= 50 && ju < 50
  let verdict: CheckVerdict = 'neutral'
  if (kind === 'caution') verdict = strain ? 'agrees' : support ? 'disagrees' : 'neutral'
  else if (kind === 'switch' || kind === 'rise') verdict = support && !strain ? 'agrees' : strain ? 'disagrees' : 'neutral'
  const parts = [ctx.T(`Jupiter supports ${ju}% of this window`, `गुरु इस खिड़की के ${ju}% भाग में सहायक`)]
  if (saH) parts.push(ctx.T(`Saturn presses the Moon (sade sati or dhaiya) for ${saH}%`, `शनि ${saH}% भाग में चंद्र पर दबाव (साढ़ेसाती या ढैया) डालता है`))
  if (saG) parts.push(ctx.T(`Saturn is in a growth house from the Moon for ${saG}%`, `शनि ${saG}% भाग में चंद्र से उपचय भाव में`))
  return { verdict, line: `${ctx.T('Gochar: ', 'गोचर: ')}${parts.join(ctx.T('; ', '; '))}${ctx.T('.', '।')}` }
}

function buildChecks(ctx: Ctx, chart: ChartOutput, spans: SlowSpan[], lord: GrahaId, kind: ChangeWindowKind, start: string, end: string): WindowChecks {
  const d10 = d10Check(ctx, chart, lord, kind)
  const kp = kpCheck(ctx, chart, lord, kind)
  const gochar = gocharCheck(ctx, spans, start, end, kind)
  const list = [d10, kp, gochar].filter((c): c is NonNullable<typeof c> => !!c)
  return { d10, kp, gochar, agree: list.filter(c => c.verdict === 'agrees').length, available: list.length }
}

function buildWindows(ctx: Ctx, chart: ChartOutput, asOf: number, spans: SlowSpan[] = []): ChangeWindow[] {
  const nodes = (chart.dashas?.vimshottari ?? []) as DashaNode[]
  const horizon = asOf + HORIZON_YEARS * 365.25 * DAY
  const out: ChangeWindow[] = []
  for (const maha of nodes) {
    const mEnd = toMs(maha.end)
    const mStart = toMs(maha.start)
    if (mEnd <= asOf || mStart >= horizon) continue
    const children = maha.children?.length ? maha.children : [maha]
    for (const antar of children) {
      const start = toMs(antar.start)
      const end = toMs(antar.end)
      if (end <= asOf || start >= horizon) continue
      const mLord = maha.lord as GrahaId
      const aLord = antar.lord as GrahaId
      if (!CLASSICAL.includes(mLord) || !CLASSICAL.includes(aLord)) continue
      const { kind, reading } = classifyPeriod(ctx, mLord, aLord)
      const checks = buildChecks(ctx, chart, spans, aLord, kind, day(Math.max(start, asOf)), day(end))
      const disagree = [checks.d10, checks.kp, checks.gochar].filter(c => c?.verdict === 'disagrees').length
      let tone = KIND_TONE[kind]
      if ((kind === 'switch' || kind === 'rise') && checks.agree >= 2 && disagree === 0) tone = 'supportive'
      else if ((kind === 'switch' || kind === 'rise') && disagree >= 2) tone = 'caution'
      out.push({
        id: `change-${mLord}-${aLord}-${day(start)}`,
        kind,
        kindLabel: KIND_LABEL[kind][ctx.hi ? 1 : 0],
        mahaLord: mLord,
        antarLord: aLord,
        label: `${ctx.name(mLord)}–${ctx.name(aLord)}`,
        start: day(start),
        end: day(end),
        live: asOf >= start && asOf < end,
        reading,
        tone,
        checks,
      })
    }
  }
  return out
}

function stabilityOf(ctx: Ctx) {
  const { T } = ctx
  const tenthSign = houseSign(ctx.asc, 10)
  const tenthLord = ctx.lordG(10)
  const tlH = ctx.houseOf(tenthLord)
  const moon = ctx.find('Mo')
  const saturn = ctx.find('Sa')
  let score = 5
  const factors: string[] = []
  const mod = signModality(tenthSign)
  if (mod === 'movable') { score += 2; factors.push(T(`The 10th is a movable sign (${rName(tenthSign, 'en')}): the post likes to move.`, `दशम चर राशि (${rName(tenthSign, 'hi')}) है: पद गति चाहता है।`)) }
  else if (mod === 'dual') { score += 1; factors.push(T(`The 10th is a dual sign (${rName(tenthSign, 'en')}): two strands of work or one change of track.`, `दशम द्विस्वभाव राशि (${rName(tenthSign, 'hi')}) है: काम की दो धाराएँ या एक बार मार्ग-परिवर्तन।`)) }
  else { score -= 2; factors.push(T(`The 10th is a fixed sign (${rName(tenthSign, 'en')}): the post wants to stay.`, `दशम स्थिर राशि (${rName(tenthSign, 'hi')}) है: पद टिकना चाहता है।`)) }
  if (tenthLord) {
    const lm = signModality(tenthLord.rashi)
    if (lm === 'movable') { score += 1; factors.push(T(`The 10th lord ${ctx.name(tenthLord.id)} sits in a movable sign.`, `दशमेश ${ctx.name(tenthLord.id)} चर राशि में है।`)) }
    if (lm === 'fixed') { score -= 1; factors.push(T(`The 10th lord ${ctx.name(tenthLord.id)} sits in a fixed sign.`, `दशमेश ${ctx.name(tenthLord.id)} स्थिर राशि में है।`)) }
    if (tlH != null && [3, 9, 12].includes(tlH)) { score += 1; factors.push(T(`The 10th lord in the ${ctx.ord(tlH)} ties work to movement.`, `दशमेश ${ctx.ord(tlH)} भाव में काम को गति से जोड़ता है।`)) }
    if (tlH != null && [1, 4, 10].includes(tlH)) { score -= 1; factors.push(T(`The 10th lord in the ${ctx.ord(tlH)} keeps the work rooted.`, `दशमेश ${ctx.ord(tlH)} भाव में काम को जड़ देता है।`)) }
    if (tenthLord.isRetro) { score += 1; factors.push(T('A retrograde 10th lord revisits and revises the career.', 'वक्री दशमेश करियर को दोहराता और सुधारता है।')) }
    if (isStrong(tenthLord.dignity) && tlH != null && [1, 4, 7, 10].includes(tlH)) { score -= 1; factors.push(T('A dignified 10th lord in a kendra steadies the post.', 'केंद्र में बलवान दशमेश पद को स्थिर करता है।')) }
  }
  if (ctx.occ('Ra', 10) || ctx.occ('Ke', 10)) { score += 2; factors.push(T('A node in the 10th brings sudden turns in work.', 'दशम में राहु/केतु काम में अचानक मोड़ लाता है।')) }
  else if (ctx.occ('Ra', 4) || ctx.occ('Ke', 4)) { score += 1; factors.push(T('The nodes on the 4th–10th axis unsettle the base and the post.', '4–10 अक्ष पर राहु/केतु आधार और पद को अस्थिर करते हैं।')) }
  if (moon && signModality(moon.rashi) === 'movable') { score += 1; factors.push(T('The Moon in a movable sign keeps the mind looking for the next thing.', 'चर राशि का चंद्र मन को अगली चीज़ की ओर रखता है।')) }
  if (ctx.occ('Mo', 10)) { score += 1; factors.push(T('The Moon in the 10th makes public work rise and fall in phases.', 'दशम का चंद्र सार्वजनिक काम को चरणों में घटाता-बढ़ाता है।')) }
  if (ctx.occ('Ma', 10)) { score += 1; factors.push(T('Mars in the 10th can make exits abrupt.', 'दशम का मंगल निकास को अचानक बना सकता है।')) }
  if (saturn && ctx.occ('Sa', 10) && !isWeak(saturn.dignity)) { score -= 2; factors.push(T('Saturn in the 10th rewards staying long in one line.', 'दशम का शनि एक ही मार्ग में लंबे टिकने का फल देता है।')) }
  else if (saturn && ctx.aspectsHouse(saturn, 10)) { score -= 1; factors.push(T('Saturn aspects the 10th: patience is part of the career.', 'शनि की दशम पर दृष्टि: धैर्य करियर का हिस्सा है।')) }
  const s = clamp10(score)
  const level: StabilityLevel = s >= 7 ? 'frequent' : s <= 3 ? 'steady' : 'moderate'
  const label = {
    frequent: T('Frequent change', 'बार-बार परिवर्तन'),
    moderate: T('A few planned changes', 'कुछ नियोजित परिवर्तन'),
    steady: T('Long tenure', 'लंबा कार्यकाल'),
  }[level]
  const reading = {
    frequent: T(
      'This chart changes jobs, roles, or places more often than most. Treat that as the design: build portable skills and a network, and judge each move by the window it falls in.',
      'यह कुंडली औरों से अधिक बार नौकरी, भूमिका या स्थान बदलती है। इसे स्वभाव मानें: साथ चलने वाले कौशल और संपर्क बनाएँ, और हर कदम को उसकी खिड़की से परखें।',
    ),
    moderate: T(
      'Expect two or three real changes across the working life. Each should be timed to a change window, not to a bad week.',
      'पूरे कार्यजीवन में दो-तीन असली परिवर्तन मानें। हर एक को परिवर्तन खिड़की से जोड़ें, किसी बुरे सप्ताह से नहीं।',
    ),
    steady: T(
      'This chart rewards long tenure. Growth comes from depth and seniority; frequent switching costs more than it pays.',
      'यह कुंडली लंबे कार्यकाल का फल देती है। उन्नति गहराई और वरिष्ठता से आती है; बार-बार बदलना जितना देता है उससे अधिक लेता है।',
    ),
  }[level]
  return { level, score: s, label, reading, factors }
}

function card(id: string, title: string, answer: string, reading: string, tone: ChangeTone, factors: string[]): ChangeCard {
  return { id, title, answer, reading, tone, factors }
}

function windowLine(ctx: Ctx, w: ChangeWindow | null | undefined): string {
  if (!w) return ctx.T('No matching period falls in the next twelve years.', 'अगले बारह वर्षों में कोई मेल खाती अवधि नहीं।')
  return ctx.T(`Next: ${w.label} (${w.start} to ${w.end}).`, `अगली: ${w.label} (${w.start} से ${w.end})।`)
}

function firstWindow(windows: ChangeWindow[], pred: (w: ChangeWindow) => boolean): ChangeWindow | null {
  return windows.find(w => pred(w)) ?? null
}

function skyCard(ctx: Ctx, transits: TransitPosition[]): ChangeCard | null {
  if (!transits.length) return null
  const { T } = ctx
  const moon = ctx.find('Mo')
  const at = (id: GrahaId) => transits.find(t => t.id === id)
  const factors: string[] = []
  let score = 0
  const sa = at('Sa')
  const ju = at('Ju')
  const ra = at('Ra')
  const ke = at('Ke')
  if (sa) {
    const fromLagna = wholeSignHouse(sa.rashi, ctx.asc)
    const fromMoon = moon ? wholeSignHouse(sa.rashi, moon.rashi) : null
    if (fromMoon != null && [12, 1, 2].includes(fromMoon)) { score -= 2; factors.push(T('Saturn is in sade sati over the Moon: pressure is high, so avoid impulsive resignations.', 'चंद्र पर साढ़ेसाती चल रही है: दबाव अधिक है, आवेग में इस्तीफ़ा न दें।')) }
    else if (fromMoon != null && [3, 6, 11].includes(fromMoon)) { score += 2; factors.push(T(`Saturn transits the ${ctx.ord(fromMoon)} from the Moon: effort turns into results and change.`, `शनि चंद्र से ${ctx.ord(fromMoon)} भाव में: परिश्रम परिणाम और परिवर्तन में बदलता है।`)) }
    else if (fromMoon === 4 || fromMoon === 8) { score -= 1; factors.push(T(`Saturn transits the ${ctx.ord(fromMoon)} from the Moon (dhaiya): workplace or home strain.`, `शनि चंद्र से ${ctx.ord(fromMoon)} भाव में (ढैया): कार्यस्थल या घर पर तनाव।`)) }
    if (fromLagna === 10) { factors.push(T('Saturn over the 10th from the lagna loads responsibility: work hard, change only with a firm offer.', 'लग्न से दशम पर शनि ज़िम्मेदारी बढ़ाता है: मेहनत करें, पक्के प्रस्ताव पर ही बदलें।')) }
  }
  if (ju) {
    const fromLagna = wholeSignHouse(ju.rashi, ctx.asc)
    const fromMoon = moon ? wholeSignHouse(ju.rashi, moon.rashi) : null
    if ([10, 11, 2, 9].includes(fromLagna) || (fromMoon != null && [2, 5, 7, 9, 11].includes(fromMoon))) {
      score += 2
      factors.push(T('Jupiter transits a supportive house: offers, interviews, and promotions open more easily.', 'गुरु अनुकूल भाव में गोचर कर रहा है: प्रस्ताव, साक्षात्कार और पदोन्नति आसानी से खुलते हैं।'))
    } else if (fromMoon != null && [6, 8, 12].includes(fromMoon)) {
      score -= 1
      factors.push(T(`Jupiter transits the ${ctx.ord(fromMoon)} from the Moon: support is thin, so check every offer twice.`, `गुरु चंद्र से ${ctx.ord(fromMoon)} भाव में: सहारा कम है, हर प्रस्ताव दो बार जाँचें।`))
    }
  }
  if (ra && wholeSignHouse(ra.rashi, ctx.asc) === 10) { score += 1; factors.push(T('Rahu transits the 10th: sudden, unconventional changes in work.', 'राहु दशम में गोचर: काम में अचानक, अपरंपरागत परिवर्तन।')) }
  if (ke && wholeSignHouse(ke.rashi, ctx.asc) === 10) { score -= 1; factors.push(T('Ketu transits the 10th: detachment from the current role; don’t decide from boredom alone.', 'केतु दशम में गोचर: वर्तमान भूमिका से विरक्ति; केवल ऊब से निर्णय न लें।')) }
  if (!factors.length) factors.push(T('No slow planet is pressing the career houses right now.', 'अभी कोई धीमा ग्रह करियर भावों पर दबाव नहीं डाल रहा।'))
  const tone = toneOf(score, 2, -1)
  const answer = tone === 'supportive'
    ? T('The sky supports a move or a rise now.', 'अभी आकाश परिवर्तन या उन्नति का साथ देता है।')
    : tone === 'caution'
      ? T('The sky asks for patience before a switch.', 'आकाश परिवर्तन से पहले धैर्य माँगता है।')
      : T('The sky is neutral; let the dasha decide.', 'आकाश तटस्थ है; दशा को निर्णय करने दें।')
  return card('sky', T('Transits now', 'वर्तमान गोचर'), answer, T('Slow planets confirm or delay what the dasha opens. A switch backed by both is stronger.', 'धीमे ग्रह दशा द्वारा खोले गए द्वार की पुष्टि करते या देर कराते हैं। दोनों का साथ हो तो परिवर्तन अधिक मज़बूत।'), tone, factors)
}

export function analyzeCareerChange(
  chart: ChartOutput,
  asOf: Date = new Date(),
  lang: EngineLang = 'en',
  transits: TransitPosition[] = [],
  slowSpans: SlowSpan[] = [],
): CareerChangeAnalysis | null {
  if (!chart?.lagnas?.ascRashi || !chart.grahas?.length) return null
  const ctx = context(chart, lang)
  const { T } = ctx
  const now = asOf.getTime()

  const tenthLord = ctx.lordG(10)
  const tlId = ctx.lordOf(10)
  const tlH = ctx.houseOf(tenthLord)
  const sun = ctx.find('Su')
  const moon = ctx.find('Mo')
  const mars = ctx.find('Ma')
  const mercury = ctx.find('Me')
  const jupiter = ctx.find('Ju')
  const saturn = ctx.find('Sa')
  const rahu = ctx.find('Ra')
  const ketu = ctx.find('Ke')
  const lagnaLord = ctx.lordG(1)

  const stability = stabilityOf(ctx)
  const windows = buildWindows(ctx, chart, now, slowSpans)
  const live = windows.find(w => w.live) ?? null
  const upcoming = windows.filter(w => !w.live)
  const nextSwitch = firstWindow(upcoming, w => w.kind === 'switch')
  const nextRise = firstWindow(upcoming, w => w.kind === 'rise')
  const nextCaution = firstWindow(upcoming, w => w.kind === 'caution')

  // ── Now ────────────────────────────────────────────────────
  const nowAnswer: Record<ChangeWindowKind, string> = {
    switch: T('Now is a window for change. Move with a written offer in hand.', 'अभी परिवर्तन की खिड़की है। लिखित प्रस्ताव हाथ में लेकर ही बदलें।'),
    rise: T('Now favours growth where you are. Ask for the raise before you leave.', 'अभी जहाँ हैं वहीं उन्नति का समय है। छोड़ने से पहले वृद्धि माँगें।'),
    caution: T('Now is for guarding the post. Do not resign without a signed offer.', 'अभी पद की रक्षा का समय है। हस्ताक्षरित प्रस्ताव के बिना इस्तीफ़ा न दें।'),
    steady: T('Now is steady. Prepare the next move instead of forcing a jump.', 'अभी स्थिर समय है। छलाँग लगाने के बजाय अगले कदम की तैयारी करें।'),
  }
  const nowCard = live
    ? card('now', T('Should I switch now?', 'क्या अभी बदलूँ?'), nowAnswer[live.kind],
      `${T(`Running: ${live.label} (${live.start} to ${live.end}).`, `चल रही: ${live.label} (${live.start} से ${live.end})।`)} ${live.reading}`,
      live.tone,
      [live.kind !== 'switch' ? windowLine(ctx, nextSwitch) : windowLine(ctx, nextRise)])
    : card('now', T('Should I switch now?', 'क्या अभी बदलूँ?'), T('The running period could not be read.', 'चल रही अवधि पढ़ी नहीं जा सकी।'),
      T('Vimshottari is not on this chart, so switch timing cannot be dated.', 'इस कुंडली में विंशोत्तरी नहीं है, इसलिए परिवर्तन का समय तय नहीं हो सकता।'), 'mixed', [])

  // ── Field switch ───────────────────────────────────────────
  const dispositor = tenthLord ? SIGN_LORDS[tenthLord.rashi] : tlId
  const nextFieldLord = nextSwitch?.antarLord ?? live?.antarLord ?? dispositor
  const fieldFactors = [
    T(`The 10th lord ${ctx.name(tlId)} keeps the core: ${ctx.fields(tlId)}.`, `दशमेश ${ctx.name(tlId)} मूल रखता है: ${ctx.fields(tlId)}।`),
  ]
  if (dispositor !== tlId) fieldFactors.push(T(`Its dispositor ${ctx.name(dispositor)} shows where the work drifts: ${ctx.fields(dispositor)}.`, `उसका राशि-स्वामी ${ctx.name(dispositor)} बताता है काम किधर झुकता है: ${ctx.fields(dispositor)}।`))
  if (nextFieldLord !== tlId && nextFieldLord !== dispositor) fieldFactors.push(T(`The next change period lord ${ctx.name(nextFieldLord)} colours the new field: ${ctx.fields(nextFieldLord)}.`, `अगली परिवर्तन अवधि का स्वामी ${ctx.name(nextFieldLord)} नए क्षेत्र को रंग देता है: ${ctx.fields(nextFieldLord)}।`))
  const dual10 = signModality(houseSign(ctx.asc, 10)) === 'dual'
  if (dual10) fieldFactors.push(T('A dual 10th can carry the old skill into the new field.', 'द्विस्वभाव दशम पुराने कौशल को नए क्षेत्र में ले जा सकता है।'))
  const fieldTone: ChangeTone = rahu && (ctx.occ('Ra', 10) || ctx.linked(rahu, tenthLord)) ? 'mixed' : 'supportive'
  const fieldCard = card('field', T('Which field to switch to', 'किस क्षेत्र में जाएँ'),
    T(`A switch works best toward ${ctx.fields(nextFieldLord)}.`, `परिवर्तन ${ctx.fields(nextFieldLord)} की ओर सबसे अच्छा चलता है।`),
    T('A career switch keeps what the 10th lord promises and changes the setting. Pick the new field where the core skill still applies.', 'करियर परिवर्तन दशमेश के वादे को रखता है और परिवेश बदलता है। ऐसा नया क्षेत्र चुनें जहाँ मूल कौशल काम आए।'),
    fieldTone, fieldFactors)

  // ── Job vs business ────────────────────────────────────────
  let service = 0
  let business = 0
  const jbFactors: string[] = []
  const sixthLord = ctx.lordG(6)
  const seventhLord = ctx.lordG(7)
  const thirdLord = ctx.lordG(3)
  const eleventhLord = ctx.lordG(11)
  const s6 = ctx.houseOf(sixthLord)
  const s7 = ctx.houseOf(seventhLord)
  if (tlH === 6 || (s6 != null && [1, 10, 11].includes(s6))) { service += 2; jbFactors.push(T('The 6th (service) links to the 10th or the self.', 'षष्ठ (सेवा) दशम या लग्न से जुड़ा है।')) }
  if (ctx.occ('Sa', 6) || ctx.occ('Sa', 10)) { service += 1; jbFactors.push(T('Saturn on the 6th or 10th suits structured employment.', 'षष्ठ या दशम का शनि संरचित नौकरी के अनुकूल।')) }
  if (sun && ctx.houseOf(sun) === 10) { service += 1; jbFactors.push(T('The Sun in the 10th suits a post under an institution.', 'दशम का सूर्य संस्था के अधीन पद के अनुकूल।')) }
  if (tlH === 7 || (s7 != null && [1, 10, 11].includes(s7))) { business += 2; jbFactors.push(T('The 7th (trade, clients) links to the 10th or the self.', 'सप्तम (व्यापार, ग्राहक) दशम या लग्न से जुड़ा है।')) }
  if (mercury && isStrong(mercury.dignity)) { business += 1; jbFactors.push(T('A strong Mercury gives commercial sense.', 'बलवान बुध व्यापारिक समझ देता है।')) }
  if (thirdLord && (isStrong(thirdLord.dignity) || [1, 3, 10, 11].includes(ctx.houseOf(thirdLord) ?? 0))) { business += 1; jbFactors.push(T('A strong 3rd lord gives the nerve to start alone.', 'बलवान तृतीयेश अकेले शुरू करने का साहस देता है।')) }
  if (rahu && [3, 7, 10, 11].includes(ctx.houseOf(rahu) ?? 0)) { business += 1; jbFactors.push(T('Rahu on a house of enterprise favours risk-taking.', 'उद्यम भाव का राहु जोखिम लेने का पक्ष लेता है।')) }
  if (eleventhLord && ctx.houseOf(eleventhLord) === 7) { business += 1; jbFactors.push(T('The 11th lord in the 7th pays through trade.', 'सप्तम में एकादशेश व्यापार से लाभ देता है।')) }
  const bizWindow = firstWindow(upcoming, w => {
    const r = ctx.ruled(w.antarLord)
    const sits = ctx.houseOf(ctx.find(w.antarLord))
    return w.kind !== 'caution' && (r.includes(7) || r.includes(3) || sits === 7 || sits === 3)
  })
  const jbCard = business >= service + 2
    ? card('business', T('Job or business switch', 'नौकरी या व्यापार'), T('Switching to business is supported.', 'व्यापार की ओर जाना समर्थित है।'),
      `${T('Start lean, keep accounts clean, and launch in a 7th or 3rd lord period.', 'हल्की शुरुआत करें, लेखा साफ़ रखें, और सप्तमेश या तृतीयेश की अवधि में आरंभ करें।')} ${windowLine(ctx, bizWindow)}`, 'supportive', jbFactors)
    : service >= business + 2
      ? card('business', T('Job or business switch', 'नौकरी या व्यापार'), T('Stay in service; switch employers, not to business.', 'सेवा में रहें; नियोक्ता बदलें, व्यापार नहीं।'),
        T('The chart pays through a structure. If business calls, run it as a side line first and keep the salary until it proves itself.', 'कुंडली संरचना से फल देती है। व्यापार का मन हो तो पहले साइड काम की तरह चलाएँ और सिद्ध होने तक वेतन न छोड़ें।'), 'mixed', jbFactors)
      : card('business', T('Job or business switch', 'नौकरी या व्यापार'), T('Hybrid: build a side business while employed.', 'मिश्रित: नौकरी में रहते हुए साइड व्यापार बनाएँ।'),
        `${T('Neither track dominates. Test the business in parallel and make the full switch only in a supportive window.', 'कोई मार्ग हावी नहीं। व्यापार को साथ-साथ परखें और पूरा परिवर्तन केवल अनुकूल खिड़की में करें।')} ${windowLine(ctx, bizWindow)}`, 'mixed', jbFactors)

  // ── Government work ────────────────────────────────────────
  let gov = 0
  const govFactors: string[] = []
  const suH = ctx.houseOf(sun)
  if (sun && suH != null && [1, 9, 10, 11].includes(suH)) { gov += 2; govFactors.push(T(`The Sun in the ${ctx.ord(suH)} points to state or institutional authority.`, `${ctx.ord(suH)} भाव का सूर्य राज्य या संस्थागत अधिकार की ओर संकेत करता है।`)) }
  if (sun && isStrong(sun.dignity)) { gov += 1; govFactors.push(T('The Sun is dignified.', 'सूर्य बलवान है।')) }
  if (sun && ctx.aspectsHouse(sun, 10)) { gov += 1; govFactors.push(T('The Sun aspects the 10th.', 'सूर्य की दशम पर दृष्टि है।')) }
  if (tlId === 'Su' || ctx.linked(sun, tenthLord)) { gov += 1; govFactors.push(T('The Sun is tied to the 10th lord.', 'सूर्य दशमेश से जुड़ा है।')) }
  if (jupiter && [9, 10].includes(ctx.houseOf(jupiter) ?? 0)) { gov += 1; govFactors.push(T('Jupiter on the 9th or 10th supports public office.', 'नवम या दशम का गुरु सार्वजनिक पद का समर्थन करता है।')) }
  if (rahu && [10, 11].includes(ctx.houseOf(rahu) ?? 0)) { gov += 1; govFactors.push(T('Rahu on the 10th or 11th helps in large systems and bureaucracy.', 'दशम या एकादश का राहु बड़े तंत्र और प्रशासन में सहायता करता है।')) }
  if (sun && (isWeak(sun.dignity) || [6, 8, 12].includes(suH ?? 0))) { gov -= 1; govFactors.push(T('The Sun is weak or hidden, so state posts come with friction.', 'सूर्य दुर्बल या छिपा है, इसलिए सरकारी पद में घर्षण।')) }
  const govWindow = firstWindow(upcoming, w => (w.antarLord === 'Su' || w.antarLord === tlId) && w.kind !== 'caution')
  const govCard = card('government', T('Government job', 'सरकारी नौकरी'),
    gov >= 3 ? T('A government or institutional post is well indicated.', 'सरकारी या संस्थागत पद अच्छी तरह संकेतित है।')
      : gov >= 1 ? T('A government post is possible with effort.', 'प्रयास से सरकारी पद संभव है।')
        : T('Private or independent work suits better than a state post.', 'सरकारी पद से निजी या स्वतंत्र काम अधिक अनुकूल।'),
    `${T('Exams and applications go best in a Sun or 10th lord period.', 'परीक्षा और आवेदन सूर्य या दशमेश की अवधि में सबसे अच्छे चलते हैं।')} ${windowLine(ctx, govWindow)}`,
    toneOf(gov, 3, 0), govFactors.length ? govFactors : [T('The Sun does not touch the career houses.', 'सूर्य करियर भावों को नहीं छूता।')])

  // ── Job loss risk ──────────────────────────────────────────
  let risk = 0
  const riskFactors: string[] = []
  if (tenthLord && tlH != null && [6, 8, 12].includes(tlH) && !isStrong(tenthLord.dignity)) { risk += 2; riskFactors.push(T(`The 10th lord in the ${ctx.ord(tlH)} without dignity makes the post fragile.`, `${ctx.ord(tlH)} भाव में बलहीन दशमेश पद को नाज़ुक बनाता है।`)) }
  for (const h of [6, 8, 12]) {
    const l = ctx.lordG(h)
    if (l && l.id !== tlId && ctx.houseOf(l) === 10) { risk += 1; riskFactors.push(T(`The ${ctx.ord(h)} lord sits in the 10th.`, `${ctx.ord(h)} भाव का स्वामी दशम में है।`)) }
  }
  const tenthMalefics = ctx.occupants(10).filter(g => MALEFICS.has(g.id) && g.id !== 'Su')
  if (tenthMalefics.length >= 2) { risk += 2; riskFactors.push(T(`${tenthMalefics.map(g => ctx.name(g.id)).join(' and ')} together in the 10th bring hard knocks.`, `दशम में ${tenthMalefics.map(g => ctx.name(g.id)).join(' और ')} साथ कठिन झटके देते हैं।`)) }
  if (tenthLord && (tenthLord.isCombust || tenthLord.dignity === 'debilitated')) { risk += 1; riskFactors.push(T('The 10th lord is combust or debilitated.', 'दशमेश अस्त या नीच है।')) }
  if (jupiter && (ctx.occ('Ju', 10) || ctx.aspectsHouse(jupiter, 10))) { risk -= 1; riskFactors.push(T('Jupiter protects the 10th.', 'गुरु दशम की रक्षा करता है।')) }
  const riskCard = card('job-loss', T('Job loss or layoff risk', 'नौकरी जाने का जोखिम'),
    risk >= 3 ? T('The post needs protection in hard periods.', 'कठिन अवधियों में पद को सुरक्षा चाहिए।')
      : risk >= 1 ? T('A setback is possible in one or two periods.', 'एक-दो अवधियों में झटका संभव है।')
        : T('Sudden job loss is not a strong theme.', 'अचानक नौकरी जाना प्रबल विषय नहीं।'),
    `${T('Keep six months of savings and an updated profile during guard-the-post windows.', 'पद-रक्षा खिड़कियों में छह माह की बचत और अद्यतन प्रोफ़ाइल रखें।')} ${windowLine(ctx, nextCaution)}`,
    risk >= 3 ? 'caution' : risk >= 1 ? 'mixed' : 'supportive',
    riskFactors.length ? riskFactors : [T('No dusthana lord presses the 10th.', 'कोई दुःस्थान स्वामी दशम पर दबाव नहीं डालता।')])

  // ── Boss and colleagues ────────────────────────────────────
  let rel = 0
  const relFactors: string[] = []
  if (sun && isStrong(sun.dignity)) { rel += 1; relFactors.push(T('A dignified Sun gives fair bosses.', 'बलवान सूर्य न्यायप्रिय अधिकारी देता है।')) }
  if (sun && [6, 8, 12].includes(suH ?? 0)) { rel -= 1; relFactors.push(T(`The Sun in the ${ctx.ord(suH ?? 0)} brings friction with authority.`, `${ctx.ord(suH ?? 0)} भाव का सूर्य अधिकारी से घर्षण लाता है।`)) }
  if (lagnaLord && tenthLord && lagnaLord.id !== tenthLord.id) {
    if (NATURAL_FRIENDS[lagnaLord.id]?.includes(tenthLord.id)) { rel += 1; relFactors.push(T('The lagna lord and 10th lord are friends: you fit the workplace.', 'लग्नेश और दशमेश मित्र हैं: आप कार्यस्थल में फिट बैठते हैं।')) }
    else if (NATURAL_ENEMIES[lagnaLord.id]?.includes(tenthLord.id)) { rel -= 1; relFactors.push(T('The lagna lord and 10th lord are enemies: the culture can feel foreign.', 'लग्नेश और दशमेश शत्रु हैं: कार्य-संस्कृति पराई लग सकती है।')) }
  }
  if (ctx.occ('Ma', 10) || (sixthLord && ctx.houseOf(sixthLord) === 10)) { rel -= 1; relFactors.push(T('Mars or the 6th lord on the 10th stirs office politics.', 'दशम पर मंगल या षष्ठेश कार्यालय राजनीति जगाता है।')) }
  if (ctx.occ('Ju', 10) || ctx.occ('Ve', 10) || ctx.occ('Me', 10)) { rel += 1; relFactors.push(T('A benefic in the 10th brings goodwill at work.', 'दशम का शुभ ग्रह कार्यस्थल पर सद्भाव लाता है।')) }
  if (mars && ctx.houseOf(mars) === 6) { rel += 1; relFactors.push(T('Mars in the 6th beats competitors.', 'षष्ठ का मंगल प्रतिस्पर्धियों को हराता है।')) }
  const relCard = card('workplace', T('Boss and colleagues', 'अधिकारी और सहकर्मी'),
    rel >= 2 ? T('Workplace relations support you.', 'कार्यस्थल के संबंध आपका साथ देते हैं।')
      : rel <= -1 ? T('Office politics is a real reason people leave this chart’s jobs.', 'कार्यालय राजनीति इस कुंडली में नौकरी छोड़ने का असली कारण बनती है।')
        : T('Relations are workable with clear boundaries.', 'स्पष्ट सीमाओं के साथ संबंध चल जाते हैं।'),
    T('If the reason to switch is one difficult boss, check whether the window is a change window. If not, change the team before the company.', 'यदि बदलने का कारण केवल एक कठिन अधिकारी है, तो देखें खिड़की परिवर्तन की है या नहीं। नहीं, तो कंपनी से पहले टीम बदलें।'),
    toneOf(rel, 2, -1), relFactors.length ? relFactors : [T('No strong pressure on authority or colleagues.', 'अधिकारी या सहकर्मियों पर कोई प्रबल दबाव नहीं।')])

  // ── Promotion ──────────────────────────────────────────────
  let promo = 0
  const promoFactors: string[] = []
  if (tenthLord && isStrong(tenthLord.dignity)) { promo += 1; promoFactors.push(T('The 10th lord is dignified.', 'दशमेश बलवान है।')) }
  if (eleventhLord && (isStrong(eleventhLord.dignity) || [10, 11].includes(ctx.houseOf(eleventhLord) ?? 0))) { promo += 1; promoFactors.push(T('The 11th lord is strong or on the 10th/11th.', 'एकादशेश बलवान है या दशम/एकादश में है।')) }
  if (ctx.linked(tenthLord, eleventhLord)) { promo += 1; promoFactors.push(T('The 10th and 11th lords are linked.', 'दशमेश और एकादशेश जुड़े हैं।')) }
  if (jupiter && (ctx.occ('Ju', 10) || ctx.occ('Ju', 11) || ctx.aspectsHouse(jupiter, 10))) { promo += 1; promoFactors.push(T('Jupiter blesses the 10th or 11th.', 'गुरु दशम या एकादश को आशीर्वाद देता है।')) }
  if (sun && [10, 11].includes(suH ?? 0)) { promo += 1; promoFactors.push(T('The Sun on the 10th or 11th gives rank.', 'दशम या एकादश का सूर्य पद देता है।')) }
  const promoCard = card('promotion', T('Promotion and raise', 'पदोन्नति और वेतन-वृद्धि'),
    promo >= 3 ? T('Promotions come steadily inside the organisation.', 'संस्था के भीतर पदोन्नति लगातार आती है।')
      : promo >= 1 ? T('Promotion comes, but usually needs a move or a push.', 'पदोन्नति आती है, पर प्रायः बदलाव या प्रयास से।')
        : T('Rank grows more by switching than by waiting.', 'पद प्रतीक्षा से अधिक बदलने से बढ़ता है।'),
    `${T('Ask for the raise inside a growth window; switching then can cost seniority.', 'वृद्धि उन्नति खिड़की में माँगें; तब बदलना वरिष्ठता खो सकता है।')} ${windowLine(ctx, nextRise)}`,
    toneOf(promo, 3, 0), promoFactors.length ? promoFactors : [T('The 10th and 11th lords are not dignified.', 'दशमेश और एकादशेश बलवान नहीं।')])

  // ── Transfer and relocation ────────────────────────────────
  let move = 0
  const moveFactors: string[] = []
  const fourthLord = ctx.lordG(4)
  const twelfthLord = ctx.lordG(12)
  if (signModality(houseSign(ctx.asc, 4)) === 'movable') { move += 1; moveFactors.push(T('A movable 4th loosens the home base.', 'चर चतुर्थ घर-आधार को ढीला करता है।')) }
  if (fourthLord && [3, 9, 12].includes(ctx.houseOf(fourthLord) ?? 0)) { move += 2; moveFactors.push(T(`The 4th lord in the ${ctx.ord(ctx.houseOf(fourthLord) ?? 0)} takes you away from the birthplace for work.`, `${ctx.ord(ctx.houseOf(fourthLord) ?? 0)} भाव में चतुर्थेश काम के लिए जन्मस्थान से दूर ले जाता है।`)) }
  if (twelfthLord && [4, 10].includes(ctx.houseOf(twelfthLord) ?? 0)) { move += 1; moveFactors.push(T('The 12th lord on the 4th or 10th brings distant postings.', 'चतुर्थ या दशम पर द्वादशेश दूर की नियुक्ति लाता है।')) }
  if (rahu && [3, 4, 9, 12].includes(ctx.houseOf(rahu) ?? 0)) { move += 1; moveFactors.push(T('Rahu on a travel house favours relocation.', 'यात्रा भाव का राहु स्थानांतरण का पक्ष लेता है।')) }
  if (tenthLord && [3, 9, 12].includes(tlH ?? 0)) { move += 1; moveFactors.push(T('The 10th lord on a travel house ties the post to travel.', 'यात्रा भाव का दशमेश पद को यात्रा से जोड़ता है।')) }
  const moveWindow = firstWindow(upcoming, w => {
    const sits = ctx.houseOf(ctx.find(w.antarLord))
    const r = ctx.ruled(w.antarLord)
    return r.includes(12) || r.includes(3) || sits === 12 || sits === 3 || sits === 9
  })
  const moveCard = card('transfer', T('Transfer and relocation', 'तबादला और स्थानांतरण'),
    move >= 3 ? T('Work takes you to another city or country.', 'काम आपको दूसरे शहर या देश ले जाता है।')
      : move >= 1 ? T('A transfer or move is likely once or twice.', 'एक-दो बार तबादला या स्थानांतरण संभव।')
        : T('Work can stay near home.', 'काम घर के पास रह सकता है।'),
    `${T('Accept a transfer most easily in a 3rd, 9th or 12th lord period.', 'तबादला तृतीयेश, नवमेश या द्वादशेश की अवधि में सबसे आसानी से स्वीकारें।')} ${windowLine(ctx, moveWindow)}`,
    move >= 3 ? 'supportive' : 'mixed', moveFactors.length ? moveFactors : [T('The 4th holds firm.', 'चतुर्थ दृढ़ है।')])

  // ── Side income ────────────────────────────────────────────
  let side = 0
  const sideFactors: string[] = []
  if (eleventhLord && signModality(eleventhLord.rashi) === 'dual') { side += 1; sideFactors.push(T('The 11th lord in a dual sign brings more than one income.', 'द्विस्वभाव राशि में एकादशेश एक से अधिक आय देता है।')) }
  if (ctx.occupants(11).length >= 2) { side += 1; sideFactors.push(T('Several planets in the 11th open several gain channels.', 'एकादश में कई ग्रह कई लाभ-मार्ग खोलते हैं।')) }
  if (rahu && ctx.houseOf(rahu) === 11) { side += 1; sideFactors.push(T('Rahu in the 11th multiplies income streams.', 'एकादश का राहु आय-स्रोत बढ़ाता है।')) }
  if (mercury && [2, 3, 10, 11].includes(ctx.houseOf(mercury) ?? 0)) { side += 1; sideFactors.push(T('Mercury on an income house rewards freelancing and trading.', 'आय भाव का बुध फ्रीलांस और व्यापार का फल देता है।')) }
  if (dual10) { side += 1; sideFactors.push(T('A dual 10th runs two lines of work at once.', 'द्विस्वभाव दशम एक साथ दो काम चलाता है।')) }
  const sideCard = card('side-income', T('Side income and freelancing', 'अतिरिक्त आय और फ्रीलांसिंग'),
    side >= 2 ? T('Side income is well supported.', 'अतिरिक्त आय अच्छी तरह समर्थित।') : side === 1 ? T('One side stream can work.', 'एक अतिरिक्त स्रोत चल सकता है।') : T('One focused income pays better than many.', 'कई स्रोतों से एक केंद्रित आय बेहतर।'),
    T('A side line is the safest way to test a career switch before resigning.', 'इस्तीफ़े से पहले करियर परिवर्तन परखने का सबसे सुरक्षित तरीका साइड काम है।'),
    side >= 2 ? 'supportive' : 'mixed', sideFactors.length ? sideFactors : [T('The 11th is quiet.', 'एकादश शांत है।')])

  // ── Reskilling ─────────────────────────────────────────────
  let study = 0
  const studyFactors: string[] = []
  const fifthLord = ctx.lordG(5)
  const ninthLord = ctx.lordG(9)
  if (ctx.linked(fifthLord, tenthLord)) { study += 1; studyFactors.push(T('The 5th lord (learning) links to the 10th lord.', 'पंचमेश (विद्या) दशमेश से जुड़ा है।')) }
  if (ctx.linked(ninthLord, tenthLord)) { study += 1; studyFactors.push(T('The 9th lord (higher study) links to the 10th lord.', 'नवमेश (उच्च शिक्षा) दशमेश से जुड़ा है।')) }
  if (fourthLord && ctx.linked(fourthLord, tenthLord)) { study += 1; studyFactors.push(T('The 4th lord (formal education) links to the 10th lord.', 'चतुर्थेश (औपचारिक शिक्षा) दशमेश से जुड़ा है।')) }
  if (jupiter && !isWeak(jupiter.dignity)) { study += 1; studyFactors.push(T('Jupiter is not weak, so a course or mentor helps.', 'गुरु दुर्बल नहीं, इसलिए पाठ्यक्रम या मार्गदर्शक सहायता करते हैं।')) }
  if (mercury && isStrong(mercury.dignity)) { study += 1; studyFactors.push(T('A strong Mercury learns new skills fast.', 'बलवान बुध नए कौशल जल्दी सीखता है।')) }
  const studyWindow = firstWindow(upcoming, w => {
    const r = ctx.ruled(w.antarLord)
    return r.includes(5) || r.includes(9) || r.includes(4) || w.antarLord === 'Ju'
  })
  const studyCard = card('reskill', T('Upskilling for a switch', 'परिवर्तन के लिए नया कौशल'),
    study >= 3 ? T('Study is the bridge to the next career.', 'अध्ययन अगले करियर का पुल है।') : study >= 1 ? T('A focused course helps the switch.', 'एक केंद्रित पाठ्यक्रम परिवर्तन में सहायता करता है।') : T('Experience teaches more than courses here.', 'यहाँ पाठ्यक्रम से अधिक अनुभव सिखाता है।'),
    `${T('Start a course or certification in a 4th, 5th, 9th lord or Jupiter period.', 'पाठ्यक्रम या प्रमाणपत्र चतुर्थेश, पंचमेश, नवमेश या गुरु की अवधि में शुरू करें।')} ${windowLine(ctx, studyWindow)}`,
    toneOf(study, 3, 0), studyFactors.length ? studyFactors : [T('The learning houses do not join the 10th.', 'विद्या भाव दशम से नहीं जुड़ते।')])

  // ── Job satisfaction ───────────────────────────────────────
  let joy = 0
  const joyFactors: string[] = []
  const moH = ctx.houseOf(moon)
  if (moon && [1, 4, 5, 9, 10, 11].includes(moH ?? 0) && !isWeak(moon.dignity)) { joy += 1; joyFactors.push(T('The Moon is well placed, so the mind can enjoy the work.', 'चंद्र अच्छी स्थिति में, इसलिए मन काम का आनंद ले सकता है।')) }
  if (moon && ([6, 8, 12].includes(moH ?? 0) || (saturn && moon.rashi === saturn.rashi))) { joy -= 1; joyFactors.push(T('The Moon is strained, so dissatisfaction can drive switches.', 'चंद्र दबाव में, इसलिए असंतोष बदलाव कराता है।')) }
  if (fifthLord && ctx.linked(fifthLord, tenthLord)) { joy += 1; joyFactors.push(T('The 5th (what you love) joins the 10th.', 'पंचम (जो आपको प्रिय) दशम से जुड़ता है।')) }
  if (ketu && ctx.houseOf(ketu) === 10) { joy -= 1; joyFactors.push(T('Ketu in the 10th rarely feels fulfilled by titles.', 'दशम का केतु पदों से कम ही तृप्त होता है।')) }
  if (lagnaLord && ctx.linked(lagnaLord, tenthLord)) { joy += 1; joyFactors.push(T('The lagna lord joins the 10th lord: work feels like your own.', 'लग्नेश दशमेश से जुड़ता है: काम अपना लगता है।')) }
  const joyCard = card('satisfaction', T('Job satisfaction', 'काम से संतोष'),
    joy >= 2 ? T('The work can feel meaningful.', 'काम सार्थक लग सकता है।') : joy <= -1 ? T('Restlessness, not the job, may be the real driver.', 'असली कारण नौकरी नहीं, बेचैनी हो सकती है।') : T('Satisfaction depends on the role more than the field.', 'संतोष क्षेत्र से अधिक भूमिका पर निर्भर।'),
    T('Before switching for happiness, name what is missing: money (2nd, 11th), meaning (5th, 9th), or respect (10th, Sun). Switch toward that.', 'खुशी के लिए बदलने से पहले पहचानें क्या कम है: धन (2, 11), अर्थ (5, 9) या सम्मान (10, सूर्य)। उसी ओर बदलें।'),
    toneOf(joy, 2, -1), joyFactors.length ? joyFactors : [T('No strong pull either way.', 'किसी ओर प्रबल खिंचाव नहीं।')])

  // ── Late career and retirement ─────────────────────────────
  let late = 0
  const lateFactors: string[] = []
  if (saturn && !isWeak(saturn.dignity)) { late += 1; lateFactors.push(T('Saturn holds, so work lasts into later life.', 'शनि सुदृढ़, इसलिए काम बाद के जीवन तक चलता है।')) }
  if (jupiter && [1, 4, 7, 10].includes(ctx.houseOf(jupiter) ?? 0)) { late += 1; lateFactors.push(T('Jupiter in a kendra favours an advisory role later.', 'केंद्र का गुरु बाद में सलाहकार भूमिका देता है।')) }
  if ((twelfthLord && ctx.houseOf(twelfthLord) === 10) || (ketu && ctx.houseOf(ketu) === 10)) { late -= 1; lateFactors.push(T('The 12th lord or Ketu on the 10th favours an early retreat.', 'दशम पर द्वादशेश या केतु जल्दी विराम का पक्ष लेता है।')) }
  if (tenthLord && isStrong(tenthLord.dignity)) { late += 1; lateFactors.push(T('A dignified 10th lord keeps the name working.', 'बलवान दशमेश नाम को सक्रिय रखता है।')) }
  const lateCard = card('late-career', T('Late career and retirement', 'उत्तर करियर और सेवानिवृत्ति'),
    late >= 2 ? T('Work continues late, often as mentoring or consulting.', 'काम देर तक चलता है, प्रायः मार्गदर्शन या परामर्श के रूप में।') : late <= -1 ? T('An early or voluntary retirement fits this chart.', 'जल्दी या स्वैच्छिक सेवानिवृत्ति इस कुंडली के अनुकूल।') : T('Retirement comes on the usual schedule.', 'सेवानिवृत्ति सामान्य समय पर।'),
    T('Plan the second innings before the last Saturn or 10th lord period ends.', 'अंतिम शनि या दशमेश अवधि समाप्त होने से पहले दूसरी पारी की योजना बनाएँ।'),
    toneOf(late, 2, -1), lateFactors.length ? lateFactors : [T('Saturn and the 10th lord are of ordinary strength.', 'शनि और दशमेश सामान्य बल के हैं।')])

  const stabilityCard = card('stability', T('How often the career changes', 'करियर कितनी बार बदलता है'), stability.label, stability.reading,
    stability.level === 'frequent' ? 'mixed' : 'supportive', stability.factors)

  const groups: ChangeGroup[] = [
    { id: 'pattern', title: T('Change pattern', 'परिवर्तन का स्वरूप'), cards: [stabilityCard, fieldCard, jbCard, govCard] },
    { id: 'risk', title: T('Risks at work', 'काम में जोखिम'), cards: [riskCard, relCard] },
    { id: 'growth', title: T('Growth and movement', 'उन्नति और गति'), cards: [promoCard, moveCard, sideCard, studyCard] },
    { id: 'life', title: T('Fit and later career', 'तालमेल और उत्तर करियर'), cards: [joyCard, lateCard] },
  ]

  const bestSwitch = windows.find(w => w.kind === 'switch' && w.checks.agree >= 2) ?? null
  const today = day(now)
  const span = (w: ChangeWindow | null): { from: string; to: string } => {
    const from = w && w.start > today ? w.start : today
    const cap = day(Date.parse(from) + 30 * DAY)
    return { from, to: w && w.end < cap ? w.end : cap }
  }
  const joinWindow = bestSwitch ?? (live?.kind === 'switch' ? live : nextSwitch)
  const dayLinks: CareerDayLink[] = [
    {
      id: 'interview',
      label: T('Pick an interview day', 'साक्षात्कार का दिन चुनें'),
      note: T('Next 30 days, scored for interviews and exams.', 'अगले 30 दिन, साक्षात्कार और परीक्षा के लिए अंकित।'),
      purpose: 'EDUCATION',
      ...span(null),
    },
    {
      id: 'join',
      label: T('Pick a day to sign or join', 'हस्ताक्षर या कार्यग्रहण का दिन चुनें'),
      note: joinWindow
        ? T(`First 30 days of the ${joinWindow.label} change window.`, `${joinWindow.label} परिवर्तन खिड़की के पहले 30 दिन।`)
        : T('Next 30 days.', 'अगले 30 दिन।'),
      purpose: 'BUSINESS',
      ...span(joinWindow),
    },
    {
      id: 'business',
      label: T('Pick a day to launch a business', 'व्यापार आरंभ का दिन चुनें'),
      note: bizWindow
        ? T(`First 30 days of the ${bizWindow.label} window.`, `${bizWindow.label} खिड़की के पहले 30 दिन।`)
        : T('Next 30 days.', 'अगले 30 दिन।'),
      purpose: 'BUSINESS',
      ...span(bizWindow),
    },
  ]

  const weekday = WEEKDAY[tlId]?.[ctx.hi ? 1 : 0] ?? ''
  const rules = [
    T('Resign only inside a change window and only with a written offer.', 'केवल परिवर्तन खिड़की में और लिखित प्रस्ताव के साथ ही इस्तीफ़ा दें।'),
    T('In a growth window, negotiate where you are before looking outside.', 'उन्नति खिड़की में बाहर देखने से पहले जहाँ हैं वहीं मोलभाव करें।'),
    T('In a guard-the-post window, document your work and avoid open fights.', 'पद-रक्षा खिड़की में अपना काम दर्ज रखें और खुले झगड़ों से बचें।'),
    T('A switch confirmed by both dasha and Saturn or Jupiter transit is stronger than either alone.', 'दशा और शनि या गुरु गोचर दोनों से पुष्ट परिवर्तन किसी एक से अधिक मज़बूत।'),
    T(`Send applications and sign joining papers on ${weekday}, the day of the 10th lord ${ctx.name(tlId)}.`, `आवेदन और नियुक्ति-पत्र ${weekday} को भेजें या हस्ताक्षर करें, जो दशमेश ${ctx.name(tlId)} का दिन है।`),
  ]

  const sky = skyCard(ctx, transits)
  const headline = live
    ? `${stability.label} · ${nowAnswer[live.kind]}`
    : stability.label
  const summary = [
    stability.reading,
    nextSwitch ? T(`Next change window: ${nextSwitch.label}, ${nextSwitch.start} to ${nextSwitch.end}.`, `अगली परिवर्तन खिड़की: ${nextSwitch.label}, ${nextSwitch.start} से ${nextSwitch.end}।`) : '',
    bestSwitch ? T(`Best confirmed change window: ${bestSwitch.label}, ${bestSwitch.start} to ${bestSwitch.end} (${bestSwitch.checks.agree} of ${bestSwitch.checks.available} checks agree).`, `सबसे पुष्ट परिवर्तन खिड़की: ${bestSwitch.label}, ${bestSwitch.start} से ${bestSwitch.end} (${bestSwitch.checks.available} में से ${bestSwitch.checks.agree} जाँचें सहमत)।`) : '',
    nextRise ? T(`Next growth window: ${nextRise.label}, ${nextRise.start} to ${nextRise.end}.`, `अगली उन्नति खिड़की: ${nextRise.label}, ${nextRise.start} से ${nextRise.end}।`) : '',
  ].filter(Boolean).join(' ')

  return {
    headline,
    summary,
    stability,
    now: nowCard,
    sky,
    windows,
    nextSwitch,
    nextRise,
    bestSwitch,
    dayLinks,
    groups,
    rules,
    closing: T(
      'Windows are read from Vimshottari antardashas by house lordship, then checked against the antar lord in D10, its KP significations, and the Saturn and Jupiter gochar across the window. Use them to time a decision you already have reasons for, not to invent one.',
      'खिड़कियाँ विंशोत्तरी अंतर्दशा से भाव-स्वामित्व द्वारा पढ़ी गई हैं, फिर दशमांश में अंतर्दशा स्वामी, उसके केपी कारकत्व और खिड़की भर के शनि-गुरु गोचर से जाँची गई हैं। इनसे उस निर्णय का समय चुनें जिसके कारण पहले से हों; नया निर्णय गढ़ने के लिए नहीं।',
    ),
  }
}
