// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaAiPrompt.ts
//  Turns a cast Prashna M1 chart into one self-contained Markdown prompt
//  for any AI assistant: the question, the moment, panchang and hora, the
//  chart, and everything Prashna Essentials reads from it (Lagna traits,
//  avasthas, dhatu / mula / jeeva, looks, wars, mrityu / pushkara bhaga),
//  plus the method, so the AI interprets instead of recalculating.
//
//  Two lengths: 'full' (adds the praśna house reference) and 'short'.
//  Pure: no React / DB / Redis.
// ─────────────────────────────────────────────────────────────

import { type ChartOutput, type GrahaData, type GrahaId, type Rashi, type UserPlan } from '@/types/astrology'
import type { EngineLang } from './lang'
import { getDashaPathAt } from './dasha/current'
import { CLASSICAL, aspectersOf, cell, day, gname, houseFrom, signOfHouse, table, time, DRISHTI_NOTE } from './aiPromptFormat'
import { RASHI_NAMES } from '@/types/astrology'
import { buildPrashnaGlance, computeAvasthas, planetaryWars, signLord, type GlancePlanet } from './prashnaGlance'
import { readPrashnaRashi, lookText, constitutionText, combinedIndication } from './prashnaRashiEssentials'
import { readPrashnaPlanets } from './prashnaPlanetEssentials'
import { HOUSE_KARAKAS } from './prashnaHouseEssentials'
import { getHouseSignifications } from './prashnaHouseSignifications'
import { readPrinciples, timeFrames } from './prashnaPrinciples'
import { bookSahams, readBookSaham, readTajikaBook } from './prashnaTajikaBook'
import { kindLabel, readMook, readMushti } from './prashnaMook'

export interface PrashnaAiPromptOptions {
  question?: string
  /** The prashna instant. */
  at: Date
  place: string
  lat: number
  lng: number
  tz: string
  /** Hora running at the moment (computed by the caller). */
  hora?: { lord: GrahaId; start: Date; end: Date } | null
  lang?: EngineLang
  /** Leave the question text out (the AI is told to ask for it). */
  hideQuestion?: boolean
  detail?: 'full' | 'short'
  /** Free gets the short prompt only; 'full' is Gold+. Default 'free'. */
  plan?: UserPlan
}

const SHADVARGA = ['D1', 'D2', 'D3', 'D9', 'D12', 'D30'] as const
const sign = (r: Rashi | undefined) => (r ? RASHI_NAMES[r] : '—')
const deg = (d: number) => `${Math.floor(((d % 30) + 30) % 30)}°${String(Math.floor((((d % 1) + 1) % 1) * 60)).padStart(2, '0')}'`

function planetsOf(chart: ChartOutput): GlancePlanet[] {
  return chart.grahas.filter(g => CLASSICAL.includes(g.id)).map(g => ({
    id: g.id, rashi: g.rashi, degree: ((g.degree % 30) + 30) % 30,
    lonSidereal: g.lonSidereal, latitude: g.latitude, isCombust: g.isCombust, isRetro: g.isRetro,
  }))
}

function shadvarga(chart: ChartOutput): Partial<Record<GrahaId, Rashi[]>> {
  const out: Partial<Record<GrahaId, Rashi[]>> = {}
  for (const id of CLASSICAL) {
    const s = SHADVARGA.map(v => chart.vargas?.[v]?.find(g => g.id === id)?.rashi).filter((r): r is Rashi => r != null)
    if (s.length) out[id] = s
  }
  return out
}

function isDay(chart: ChartOutput, at: Date): boolean {
  const rise = new Date(chart.panchang.sunrise).getTime()
  const set = new Date(chart.panchang.sunset).getTime()
  const ms = at.getTime()
  return Number.isFinite(rise) && Number.isFinite(set) && ms >= rise && ms < set
}

function instructions(lang: EngineLang, hasQuestion: boolean): string {
  return [
    '# Prashna (Vedic horary) chart — data for AI analysis',
    '',
    'You are an experienced Prashna astrologer (Prashna Marga, Krishneeyam, Shatpanchashika tradition). This horary chart was cast by Vedaansh for the moment the question was asked (Swiss Ephemeris, Lahiri ayanamsha, sidereal zodiac, whole-sign houses from the Lagna). Use the numbers and readings below as given and do not recalculate positions.',
    '',
    '**How to answer**',
    hasQuestion
      ? '1. Name the house (or houses) that rule this question and why; the karyesh is the lord of that house.'
      : '1. The question was not shared. Ask the querent for it before judging; until then describe the general state of the chart.',
    '2. Judge the Lagna and Lagna lord (the querent), the karya bhava and its lord (the matter), the Moon (the mind and the flow of events), and how they connect: conjunction, Parashari aspect, exchange, placement in kendra / trikona / dusthana.',
    '3. Weigh strength: dignity, avastha, strength by time of day, paksha and ayana, combustion, retrogression, mrityu / pushkara bhaga, planetary war.',
    '4. Give a verdict (yes / no / mixed, with likelihood), the reasoning behind it, and timing if the chart allows, citing the placement behind every point and how confident you are.',
    '5. Remedies only if asked, and kept simple.',
    '',
    '**Praśna rules to respect**',
    '- Use Parashari aspects only. Tajik aspects serve only to form Tajik yogas.',
    '- A retrograde planet in praśna points to repetition, cancellation or failure, depending on the other influences.',
    '- A dual-sign Lagna rising at 0–15° acts as fixed; at 15–30° as movable. Movable = change or movement, fixed = status quo.',
    '- Friend / enemy is read by praśna group friendship: Group I Sun, Moon, Mars, Jupiter, Ketu; Group II Mercury, Venus, Saturn, Rahu.',
    '- Astrology is reflective, not certain. No medical, legal or financial instructions, and no death predictions.',
    '',
    lang === 'hi' ? '**Answer in Hindi (Devanagari).**' : 'Answer in clear English with short glosses for Sanskrit terms.',
  ].join('\n')
}

function momentSection(chart: ChartOutput, o: PrashnaAiPromptOptions, day_: boolean): string {
  const p = chart.panchang
  const q = o.hideQuestion ? '(withheld by the querent)' : o.question?.trim() || '(not stated)'
  const rows: string[] = [
    '## 1. Question and moment',
    '',
    `- **Question:** ${q}`,
    `- **Moment:** ${day(o.at)} ${time(o.at, o.tz)} (${o.tz}), asked ${day_ ? 'by day' : 'at night'}`,
    `- **Place:** ${o.place} (${o.lat.toFixed(4)}, ${o.lng.toFixed(4)})`,
    `- **Sunrise / sunset:** ${time(p.sunrise, o.tz)} / ${time(p.sunset, o.tz)}`,
    '',
    '## 2. Panchang at the moment',
    '',
    `- **Vara:** ${p.vara.name} (lord ${gname(p.vara.lord)})`,
    `- **Tithi:** ${p.tithi.name}, ${p.tithi.paksha} paksha (tithi ${p.tithi.number} of 30)`,
    `- **Nakshatra:** ${p.nakshatra.name}`,
    `- **Yoga:** ${p.yoga.name} · **Karana:** ${p.karana.name}`,
  ]
  if (o.hora) rows.push(`- **Hora lord:** ${gname(o.hora.lord)} (${time(o.hora.start, o.tz)}–${time(o.hora.end, o.tz)}); the hora lord carries great weight in praśna`)
  return rows.join('\n')
}

function lagnaSection(chart: ChartOutput, g: ReturnType<typeof buildPrashnaGlance>, r: ReturnType<typeof readPrashnaRashi>): string {
  const ct = constitutionText('en')
  const lagnaPlanets = r.lagnaPlanets.map(p => `${gname(p.id)}${p.kind ? ` (${ct.kinds[p.kind]}: ${combinedIndication(p.kind, r.constitution.general)})` : ''}`)
  return [
    '## 3. Lagna',
    '',
    `- **Lagna:** ${sign(g.lagna.rashi)} ${deg(chart.lagnas.ascDegree)}, lord ${gname(g.lagna.lord)}; navamsha ${r.navamsha} of 9 in the sign; D9 Lagna ${sign(chart.vargaLagnas?.D9)}`,
    `- **Traits:** ${g.lagna.traits.map(t => `${t.title}: ${t.label}`).join('; ')}`,
    `- **Strength by time:** ${g.lagna.timeStrong ? 'strong' : 'weak'} at this hour${g.lagna.dualTilt ? `; dual sign leaning ${g.lagna.dualTilt}` : ''}${g.lagna.mrityu ? '; Lagna is in its mrityu bhaga' : ''}`,
    `- **Look (from the Sun in ${sign(r.sunRashi)}):** ${lookText(r.lagnaLook).label}`,
    `- **Dhatu / mula / jeeva (mook praśna):** ${ct.kinds[r.constitution.general]} by the general scheme, ${ct.kinds[r.constitution.krishnacharya]} by Krishnacharya`,
    `- **Planets in the Lagna:** ${lagnaPlanets.length ? lagnaPlanets.join(', ') : 'none'}${g.eventTimes.length ? `; they point to the ${g.eventTimes.join(' / ')} for the event` : ''}`,
  ].join('\n')
}

function planetSection(chart: ChartOutput, avasthas: ReturnType<typeof computeAvasthas>, pr: ReturnType<typeof readPrashnaPlanets>): string {
  const asc = chart.lagnas.ascRashi
  const d9 = (id: GrahaId) => chart.vargas?.D9?.find(x => x.id === id)?.rashi
  const rows = chart.grahas.filter(g => CLASSICAL.includes(g.id)).map((g: GrahaData) => {
    const row = pr.rows.find(x => x.id === g.id)
    const av = avasthas[g.id]
    const flags = [
      g.isRetro && 'retrograde', g.isCombust && 'combust',
      row?.mrityu && 'mrityu bhaga', row?.pushkara && 'pushkara bhaga',
      av?.war && `${av.war.won ? 'won' : 'lost'} war with ${gname(av.war.with)}`,
    ].filter(Boolean).join(', ')
    return [
      gname(g.id), `${sign(g.rashi)} ${deg(g.degree)}`, houseFrom(asc, g.rashi),
      `${g.nakshatraName} ${g.pada}`, row?.dignity ?? '—', av?.kinds.join(', ') || '—',
      row ? (row.timeStrong ? 'yes' : 'no') : '—', sign(d9(g.id)), flags || '—',
    ]
  })
  return [
    '## 4. Planets',
    '',
    table(['Planet', 'Sign / degree', 'House', 'Nakshatra pada', 'Dignity', 'Avasthas', 'Strong at this hour', 'D9', 'Flags'], rows),
    '',
    `- **Paksha:** ${pr.shukla ? 'shukla — benefics strong' : 'krishna — malefics strong'}; **ayana:** ${pr.uttarayana ? 'uttarayana — benefics strong' : 'dakshinayana — malefics strong'}`,
    `- **Moon:** ${pr.moonBenefic ? 'benefic' : 'malefic'} by tithi (benefic from shukla ashtami to krishna saptami)`,
    ...(pr.mandiMrityu ? ['- **Mandi** is in its mrityu bhaga.'] : []),
    '',
    'Avasthas: Deepta / Swastha / Mudita / Deena / Khala from the sign (friend and enemy by praśna group friendship); Shanta when at least 4 of 6 shadvarga signs are owned by benefics; Shakta when visible, Peedita when combust, Bheeta within 10° of the Sun; Vikala when joined with a malefic; Khala also for the loser of a planetary war (within 1°, the planet further north wins). Strong at this hour: Sun, Jupiter, Venus by day; Moon, Mars, Saturn at night; Mercury always. Rahu and Ketu take no dignity or avastha here because schools differ.',
  ].join('\n')
}

function houseSection(chart: ChartOutput): string {
  const asc = chart.lagnas.ascRashi
  const grahas = chart.grahas
  const rows = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1
    const s = signOfHouse(asc, h)
    const lord = signLord(s)
    const lordG = grahas.find(g => g.id === lord)
    const occ = grahas.filter(g => CLASSICAL.includes(g.id) && g.rashi === s).map(g => gname(g.id))
    const asp = aspectersOf(grahas, s).map(g => gname(g.id))
    return [h, sign(s), gname(lord), lordG ? houseFrom(asc, lordG.rashi) : '—', occ.join(', ') || '—', asp.join(', ') || '—', HOUSE_KARAKAS[h].map(gname).join(', ')]
  })
  return ['## 5. Houses', '', table(['House', 'Sign', 'Lord', 'Lord in house', 'Occupants', 'Aspected by', 'Fixed karaka'], rows), '', DRISHTI_NOTE].join('\n')
}

function summarySection(g: ReturnType<typeof buildPrashnaGlance>, wars: ReturnType<typeof planetaryWars>): string {
  return [
    '## 6. Key connections',
    '',
    `- **Lagna lord:** ${gname(g.lagnaLord.id)} in ${sign(g.lagnaLord.rashi)}, house ${g.lagnaLord.house}${g.lagnaLord.retro ? ', retrograde' : ''}; avasthas ${g.lagnaLord.avasthas?.kinds.join(', ') || '—'}`,
    `- **Moon:** ${sign(g.moon.rashi)}, house ${g.moon.house}; avasthas ${g.moon.avasthas?.kinds.join(', ') || '—'}${g.moon.pushkara ? '; in pushkara bhaga' : ''}${g.moon.mrityu ? '; in mrityu bhaga' : ''}`,
    `- **Kendras:** ${g.kendras.map(k => `${k.house}: ${k.planets.map(gname).join(', ') || '—'}`).join(' · ')}`,
    `- **Planetary wars:** ${wars.length ? wars.map(w => `${gname(w.winner)} beats ${gname(w.loser)}`).join('; ') : 'none'}`,
  ].join('\n')
}

function principlesSection(chart: ChartOutput): string {
  const input = {
    ascRashi: chart.lagnas.ascRashi,
    ascDegree: chart.lagnas.ascDegreeInRashi,
    varaLord: chart.panchang?.vara?.lord,
    grahas: chart.grahas.filter(g => CLASSICAL.includes(g.id)),
  }
  const tag = { good: 'for', bad: 'against', mixed: 'mixed', neutral: 'note' } as const
  const tf = timeFrames(input)
  return [
    '## 6b. General principles present',
    '',
    'Rules from "General Principles of Prashna" that apply to this chart. Weigh them with the karyesh of the actual question (link of lagnesh and karyesh, retrograde planets on them, kartari on the karya bhava).',
    '',
    ...readPrinciples(input).map(r => `- [${tag[r.tone]}] ${r.text}`),
    `- [note] Planets by time frame: past (houses 9–12) ${tf.past.map(gname).join(', ') || '—'}; present (1–4) ${tf.present.map(gname).join(', ') || '—'}; future (5–8) ${tf.future.map(gname).join(', ') || '—'}.`,
  ].join('\n')
}

function tajikaBookSection(chart: ChartOutput): string {
  const c = { ascRashi: chart.lagnas.ascRashi, ascDegree: chart.lagnas.ascDegree, grahas: chart.grahas }
  const lagnesh = signLord(chart.lagnas.ascRashi)
  const wide = readTajikaBook(c, lagnesh, lagnesh)
  const sahams = bookSahams(c)
  return [
    '## 6c. Tajika as the book reads it',
    '',
    'Judge the question with the lagnesh and the karyesh (lord of the house of the question): ithsala (purna if within 1°, bhavishyat if it forms on a sign change or is within 1° beyond the mean orb), kamboola if the Moon is in ithsala with either, khallasara if the Moon is linked with neither, rudda if one of the pair is retrograde, combust, debilitated or in 6/8/12 (permanent if from 6/8/12 or with their lords), manau if a malefic afflicts the faster planet within orb, ishraf (past, unfavourable), nakta / yamaya through a third planet. Rahu or Ketu with the pair spoils it. The Moon tied to only one of them does not fulfil the query.',
    '',
    ...(wide.length ? wide.map(r => `- **${r.title}:** ${r.text}`) : ['- No chart-wide Iqbal or Induvaar.']),
    '',
    'Sahams (book formulas). Adverse sahams (roga, mrityu, bandhan) should be weak; good ones strong:',
    '',
    ...sahams.map(s => { const r = readBookSaham(c, s); return `- ${r.title} (${s.for}): ${r.text}` }),
  ].join('\n')
}

function mookSection(chart: ChartOutput): string {
  const d9 = chart.vargas?.D9
  const c = {
    ascRashi: chart.lagnas.ascRashi, ascDegree: chart.lagnas.ascDegree, grahas: chart.grahas,
    ...(d9 ? { d9: Object.fromEntries(d9.map(g => [g.id, g.rashi])) as Partial<Record<GrahaId, Rashi>> } : {}),
  }
  const m = readMook(c)
  const fist = readMushti(c)
  const votes = (Object.entries(m.tally) as [keyof typeof m.tally, number][]).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${kindLabel(k)} ${n}`).join(', ')
  return [
    '## 6d. Mook praśna: what the unspoken question is about',
    '',
    'Pointers from "Mook and Mushti Prashna". Use them to find the matter when the querent has not said it, or to check whether something else is on their mind. The karyesh is the lord of the house the question turns out to be about.',
    '',
    `- **Dhatu / mula / jeeva votes:** ${votes}`,
    `- **Houses pointed to:** ${m.houses.map(h => `house ${h.house} (${h.topic}, ${h.votes})`).join('; ') || '—'}`,
    `- **Strongest planet:** ${gname(m.strongest)}`,
    ...m.groups.flatMap(g => g.items.map(it => `- ${it.text}`)),
    `- **Mushti (closed fist):** ${fist.schools.map(s => `${s.name}: ${s.kind ? kindLabel(s.kind) : '—'}`).join('; ')}${fist.items.length ? `. ${fist.items.map(i => i.text).join(' ')}` : ''}`,
  ].join('\n')
}

function dashaSection(chart: ChartOutput, at: Date): string {
  const vim = chart.dashas?.vimshottari
  if (!vim?.length) return ''
  const path = getDashaPathAt(vim, at.getTime()).slice(0, 3)
  if (!path.length) return ''
  return ['## 7. Vimshottari at the moment', '', path.map(n => `${gname(n.lord)} (to ${day(n.end)})`).join(' → ')].join('\n')
}

function houseReference(): string {
  const out = ['## 8. Reference: what each house covers in praśna', '']
  for (let h = 1; h <= 12; h++) {
    const groups = getHouseSignifications(h, 'en')?.groups.filter(g => g.prashna) ?? []
    if (!groups.length) continue
    out.push(`### House ${h}`)
    for (const g of groups) out.push(`- **${cell(g.title)}:** ${g.items.map(it => (it.note ? `${it.text} (${it.note})` : it.text)).join('; ')}`)
    out.push('')
  }
  return out.join('\n').trimEnd()
}

export function buildPrashnaAiPrompt(chart: ChartOutput, opts: PrashnaAiPromptOptions): string {
  const lang = opts.lang ?? 'en'
  const day_ = isDay(chart, opts.at)
  const planets = planetsOf(chart)
  const sv = shadvarga(chart)
  const asc = chart.lagnas.ascRashi
  const sun = planets.find(p => p.id === 'Su')
  const glance = buildPrashnaGlance({ ascRashi: asc, ascDegree: chart.lagnas.ascDegree, planets, isDay: day_, tithi: chart.panchang.tithi.number, shadvarga: sv })
  const avasthas = computeAvasthas(planets, sv)
  const rashi = readPrashnaRashi({
    ascRashi: asc, ascDegree: chart.lagnas.ascDegree, sunRashi: sun?.rashi ?? asc, isDay: day_,
    lagnaGrahas: planets.filter(p => p.rashi === asc).map(p => p.id),
  })
  const mandi = chart.upagrahas?.Maandi
  const pr = readPrashnaPlanets({
    grahas: planets.map(p => ({ id: p.id, rashi: p.rashi, degree: p.degree, isCombust: p.isCombust, isRetro: p.isRetro })),
    ascRashi: asc, ascDegree: chart.lagnas.ascDegree,
    mandi: mandi ? { rashi: mandi.rashi, degree: mandi.degree } : undefined,
    isDay: day_, tithi: chart.panchang.tithi.number,
    sunTropical: chart.grahas.find(g => g.id === 'Su')?.lonTropical ?? 0,
  })
  const hasQuestion = !opts.hideQuestion && !!opts.question?.trim()
  const parts = [
    instructions(lang, hasQuestion || !!opts.hideQuestion),
    momentSection(chart, opts, day_),
    lagnaSection(chart, glance, rashi),
    planetSection(chart, avasthas, pr),
    houseSection(chart),
    summarySection(glance, planetaryWars(planets)),
    principlesSection(chart),
    tajikaBookSection(chart),
    mookSection(chart),
    dashaSection(chart, opts.at),
  ]
  const full = (opts.plan ?? 'free') !== 'free' && opts.detail !== 'short'
  if (full) parts.push(houseReference())
  parts.push([
    '---',
    hasQuestion
      ? 'Now answer the question above, following "How to answer".'
      : opts.hideQuestion
        ? 'The querent will tell you the question next. Read it against this chart, following "How to answer".'
        : 'Ask the querent what the question is, then judge it against this chart.',
  ].join('\n'))
  return parts.filter(Boolean).join('\n\n') + '\n'
}
