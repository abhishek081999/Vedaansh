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
  { ids: ['Ma', 'Ra'], signs: [1], title: 'Mars–Rahu in Aries navamsha', text: 'Violent, aggressive and fearless — ready to fight instantly. Channel into sport, defence or dismantling machines; avoid rash driving.', tone: 'challenging' },
  { ids: ['Ma', 'Ra'], title: 'Mars–Rahu together in D9', text: 'Dacoit-like daring: takes what it wants and fights for it. Strong will; needs rules and Hanuman sadhana.', tone: 'mixed' },
  { ids: ['Sa', 'Ve'], title: 'Saturn–Venus in D9', text: 'Creates expensive things — showrooms, mills, construction, luxury goods. Money through partnerships but disputes too; beware the "half-truth" habit.', tone: 'mixed' },
  { ids: ['Sa', 'Mo'], title: 'Saturn–Moon in D9', text: 'Deep thinker prone to heavy moods; big house but emotionally dry spaces. Needs light, company and devotion.', tone: 'mixed' },
  { ids: ['Sa', 'Me'], signs: [7], title: 'Saturn–Mercury in Libra navamsha', text: 'Low interest in marriage and intimacy; doubt and hesitation in the bedroom — commitment comes late and needs patience.', tone: 'challenging' },
  { ids: ['Sa', 'Me'], title: 'Saturn–Mercury in D9', text: 'Fault-finding and accountant mind (CA/audit/legal); may look older than age. Famous for one big lasting work.', tone: 'mixed' },
  { ids: ['Ju', 'Ve'], title: 'Jupiter–Venus in D9', text: 'Strong desires and refined taste; brings wealth and respect, but marriage needs conscious balance between dharma and pleasure.', tone: 'mixed' },
  { ids: ['Su', 'Mo'], title: 'Sun–Moon in D9 (Amavasya)', text: 'Mind cannot express under authority — things get done secretly; friction with father and bosses. Daily offerings at a temple balance it.', tone: 'challenging' },
  { ids: ['Su', 'Sa'], title: 'Sun–Saturn in D9', text: 'Ego wars with father, bosses and siblings — wealth comes, but with rivalry ("if I buy a Thar, brother buys bigger").', tone: 'challenging' },
  { ids: ['Me', 'Ke'], title: 'Mercury–Ketu in D9', text: 'Gives anonymously — does not want the name on the plate; strict privacy about passwords and accounts.', tone: 'neutral' },
  { ids: ['Me', 'Ra'], title: 'Mercury–Rahu in D9', text: 'Known for coding, trading or schemes; digital footprint everywhere; pierce-and-hack curiosity. Complete paperwork first.', tone: 'mixed' },
  { ids: ['Mo', 'Ra'], title: 'Moon–Rahu in D9', text: 'Obsessive attachment — cannot let go even when it hurts; strong appetite for experiences. Practise conscious release.', tone: 'challenging' },
  { ids: ['Mo', 'Ke'], title: 'Moon–Ketu in D9', text: 'Spiritual, introverted mind; needs solitude, white clothes, ekadashi and bhajan to stay balanced.', tone: 'mixed' },
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
    { house: 5, sign: 9, title: '5th lord in Sagittarius navamsha', text: 'Positions come and go if principles slip; higher learning keeps you on the ridge.', tone: 'mixed' },
    { house: 9, sign: 7, title: '9th lord in Libra navamsha', text: 'Principles limit side income — salary may be lower because you will not cut corners.', tone: 'neutral' },
    { house: 11, sign: 7, title: '11th lord in Libra navamsha', text: 'Dhana yoga when Venus is well placed — steady income through partners and finance.', tone: 'supportive' },
    { house: 5, sign: 10, title: '5th lord in Capricorn navamsha', text: 'You genuinely enjoy your work; creativity becomes career.', tone: 'supportive' },
    { house: 3, sign: 3, title: '3rd lord in Gemini navamsha', text: 'Artistic, skill-driven nature beyond gender stereotypes — singing, painting, acting.', tone: 'supportive' },
    { house: 3, sign: 7, title: '3rd lord in Libra navamsha', text: 'Many partnerships — multiple businesses, ventures and relationships; keep boundaries clear.', tone: 'mixed' },
    { house: 2, sign: 7, title: '2nd lord in Libra navamsha', text: 'Wide social and romantic circle; more than one significant relationship is possible.', tone: 'mixed' },
    { house: 12, sign: 7, title: '12th lord in Libra navamsha', text: 'Pleasure and bed-comforts pull strongly; many attachments — discipline protects marriage and money.', tone: 'mixed' },
    { house: 3, sign: 5, title: '3rd lord in Leo navamsha', text: 'Works hard for medals and recognition; siblings or neighbours of high standing.', tone: 'supportive' },
    { house: 5, sign: 5, title: '5th lord in Leo navamsha', text: 'Education, children and romance carry status — partner and peers must be of the same class.', tone: 'mixed' },
    { house: 7, sign: 8, title: '7th lord in Scorpio navamsha', text: 'Marriage transforms you — often outside convention; leave what must leave and the bond renews.', tone: 'mixed' },
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
