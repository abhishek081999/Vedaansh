// ─────────────────────────────────────────────────────────────
//  src/lib/engine/aiPrompt.ts
//  Turns a calculated ChartOutput into one self-contained Markdown
//  prompt the user can paste into any AI assistant (Claude, ChatGPT,
//  Gemini…). The AI gets our computed data plus the method used, so it
//  interprets instead of recalculating (LLMs are bad at ephemeris maths).
//
//  Two lengths: 'full' (default) and 'short' (a few KB for AI chats with
//  small paste limits).
//
//  Pure: no React / DB / Redis. Works on a ChartOutput that went through
//  JSON (dates as strings) as well as a fresh one.
// ─────────────────────────────────────────────────────────────

import {
  GRAHA_NAMES,
  RASHI_NAMES,
  type ChartOutput,
  type DashaNode,
  type GrahaData,
  type GrahaId,
  type Rashi,
  type UserPlan,
} from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { buildInterpretationHub } from '@/lib/engine/interpretationHub'
import { AI_TOPICS, buildTopicStudy, topicTitle, type AiTopic } from '@/lib/engine/aiPromptTopics'
import {
  RASHI_LORD,
  CLASSICAL,
  KEY_VARGAS,
  DASHA_LABELS,
  LEVEL_NAMES,
  dms,
  signPos,
  day,
  time,
  gname,
  cell,
  table,
  num,
  houseFrom,
  aspectOffsets,
  aspectersOf,
  aspectsSign,
  conjunctWith,
  isNodePair,
  signOfHouse,
  DRISHTI_NOTE,
  SHADBALA_NOTE,
  shadbalaRupas,
} from '@/lib/engine/aiPromptFormat'

export interface AiPromptOptions {
  plan?: UserPlan
  lang?: EngineLang
  now?: number
  /** Replace the native's name with "Native" before sharing with a third-party AI. */
  hideName?: boolean
  /** Focus studies to add (career, marriage…). Empty = general reading. */
  topics?: AiTopic[]
  /**
   * 'full' (default): every calculation and reading (~100–250 KB).
   * 'short': the essentials in a few KB, for AI chats with small paste or context limits.
   */
  detail?: 'full' | 'short'
}

// ── short prompt ─────────────────────────────────────────────
// Same guardrails, only what an AI needs to read the chart: positions, houses
// with lords and aspects, Shadbala in rupas, D9/D10, running dashas, key yogas.

function shortInstructions(lang: EngineLang, topics: AiTopic[]): string {
  return [
    '# Vedic birth chart (Jyotish) — short data for AI analysis',
    '',
    'You are an experienced Vedic astrologer. This chart was calculated by Vedaansh (Swiss Ephemeris, sidereal zodiac, whole-sign houses from the Lagna). Use these numbers as given and do not recalculate. Cite the placement, aspect, strength or dasha behind every point, and say how confident you are. Quote Shadbala in rupas against the minimum. Astrology is reflective, not certain: no medical, legal or financial instructions, no death predictions.',
    lang === 'hi' ? '**Answer in Hindi (Devanagari).**' : 'Answer in clear English with short glosses for Sanskrit terms.',
    topics.length
      ? `**Focus:** ${topics.map(topicTitle).join(', ')}. Follow each focus method below step by step, then give timing and practical guidance.`
      : 'Wait for my question. If none, give a short overview of the chart and the current dasha.',
  ].join('\n')
}

const FLAG_SHORT = (g: GrahaData): string =>
  [
    g.isRetro && g.id !== 'Ra' && g.id !== 'Ke' ? 'R' : null,
    g.isCombust ? 'combust' : null,
    g.gandanta?.isGandanta ? 'gandanta' : null,
    g.yuddha?.isWarring ? 'war' : null,
    g.id === 'Mo' && g.isWaxingMoon != null ? (g.isWaxingMoon ? 'waxing' : 'waning') : null,
  ].filter(Boolean).join(', ')

function shortChart(chart: ChartOutput, hideName: boolean, now: number): string {
  const m = chart.meta
  const asc = chart.lagnas.ascRashi
  const grahas = chart.grahas.filter((g) => CLASSICAL.includes(g.id))
  const out: string[] = [
    '## Chart',
    '',
    `${hideName ? 'Native' : m.name}, ${m.gender}, born ${m.birthDate} ${m.birthTime} (${m.timezone}), ${m.birthPlace}. Ayanamsha ${m.settings?.ayanamsha ?? 'lahiri'} ${dms(m.ayanamshaValue)}.`,
    `**Lagna:** ${RASHI_NAMES[asc]} ${dms(chart.lagnas.ascDegreeInRashi)}, lord ${gname(RASHI_LORD[asc])}.`,
    '',
    table(['Planet', 'Sign', 'House', 'Nakshatra', 'Dignity', 'Shadbala', 'Karaka', 'Notes'], grahas.map((g) => [
      gname(g.id),
      `${RASHI_NAMES[g.rashi]} ${dms(g.degree)}`,
      houseFrom(asc, g.rashi),
      `${g.nakshatraName} ${g.pada}`,
      g.dignity,
      shadbalaRupas(chart.shadbala?.planets?.[g.id]).replace(' rupas', ''),
      g.charaKaraka ?? '',
      FLAG_SHORT(g),
    ])),
    '',
    '_Shadbala column: total rupas "of" the planet\'s minimum rupas (% of minimum; 100%+ = strong enough). Aspects: all planets 7th; Mars 4/8, Jupiter 5/9, Saturn 3/10, Rahu/Ketu 5/9._',
    '',
  ]
  const ids = (gs: GrahaData[]) => gs.map((g) => g.id).join(', ') || '—'
  const rows: unknown[][] = []
  for (let h = 1; h <= 12; h++) {
    const sign = signOfHouse(asc, h)
    const lord = RASHI_LORD[sign]
    const lg = chart.grahas.find((g) => g.id === lord)
    rows.push([
      h,
      RASHI_NAMES[sign],
      `${lord} → H${lg ? houseFrom(asc, lg.rashi) : '—'}`,
      lg ? ids(aspectersOf(chart.grahas, lg.rashi, lord)) : '—',
      ids(grahas.filter((g) => g.rashi === sign)),
      ids(aspectersOf(chart.grahas, sign)),
      chart.ashtakavarga?.sav?.[sign - 1] ?? '—',
    ])
  }
  out.push(table(['H', 'Sign', 'Lord → house', 'Lord aspected by', 'In house', 'Aspected by', 'SAV'], rows))

  const vline = (k: string) => {
    const vg = chart.vargas?.[k]
    const vl = chart.vargaLagnas?.[k] as Rashi | undefined
    if (!vg?.length || !vl) return null
    return `**${k}** Lagna ${RASHI_NAMES[vl]}: ${vg.filter((g) => CLASSICAL.includes(g.id)).map((g) => `${g.id} ${RASHI_NAMES[g.rashi].slice(0, 3)}${g.dignity && g.dignity !== 'neutral' ? ` (${g.dignity})` : ''}`).join(', ')}`
  }
  const vlines = ['D9', 'D10'].map(vline).filter(Boolean) as string[]
  if (vlines.length) out.push('', ...vlines.map((l) => `- ${l}`))

  const vim = chart.dashas?.vimshottari
  if (vim?.length) {
    const path = getDashaPathAt(vim, now)
    out.push('', `**Current Vimshottari (${day(now)}):** ${path.length ? dashaPath(path.slice(0, 3)) : '—'}`)
    out.push(`**Mahadashas:** ${vim.map((n) => `${n.lord} ${day(n.start).slice(0, 4)}–${day(n.end).slice(0, 4)}`).join(', ')}`)
    const md = path[0]
    if (md?.children?.length) out.push(`**Antardashas in ${gname(md.lord)} MD:** ${md.children.map((n) => `${n.lord} ${day(n.start).slice(0, 7)}`).join(', ')}`)
  }

  const k = chart.karakas
  const a = chart.arudhas
  if (k || a) {
    out.push('', [
      k ? `**Karakas:** AK ${k.AK}, AmK ${k.AmK}, DK ${k.DK}` : null,
      a?.AL ? `AL ${RASHI_NAMES[a.AL]} (H${houseFrom(asc, a.AL)})` : null,
      a?.A12 ? `UL ${RASHI_NAMES[a.A12]} (H${houseFrom(asc, a.A12)})` : null,
    ].filter(Boolean).join(' · '))
  }

  const yogas = (chart.yogas ?? []).filter((y) => y.strength !== 'weak')
  if (yogas.length) {
    const seen = new Set<string>()
    const names = yogas.filter((y) => !seen.has(y.name) && seen.add(y.name)).slice(0, 15).map((y) => `${y.name} (${y.strength}; ${y.planets.join('/')})`)
    out.push('', `**Main yogas:** ${names.join('; ')}`)
  }
  if (chart.interpretation?.headline) out.push('', `**Vedaansh summary:** ${chart.interpretation.headline}`)
  return out.join('\n')
}

// ── sections ─────────────────────────────────────────────────

function instructions(lang: EngineLang, topics: AiTopic[]): string {
  return [
    '# Vedic birth chart (Jyotish) — data for AI analysis',
    '',
    'You are an experienced Vedic astrologer (Parashari, Jaimini and KP). Below is a birth chart calculated by Vedaansh with the Swiss Ephemeris.',
    '',
    '**How to use this data**',
    '- Every position, strength, dasha and yoga below is already calculated. Use these numbers as given and do not recalculate positions from the birth time.',
    '- The zodiac is sidereal (see the ayanamsha below). Houses are counted from the Lagna using the stated house system. Rashi 1 = Aries.',
    '- Base every statement on the data here, and name the placement, yoga, strength or dasha you are reading from.',
    '- Quote Shadbala in rupas against the planet\'s minimum (for example "Mercury 8.28 rupas, needs 7.00"), never as a bare ratio.',
    '- Where indications conflict, weigh them (dignity, Shadbala, Ashtakavarga, divisional confirmation, dasha activation) and say how confident you are.',
    '- Astrology is a reflective tradition, not a certainty. Do not give medical, legal or financial instructions, and do not predict death.',
    lang === 'hi'
      ? '- **Answer in Hindi (Devanagari)**; Sanskrit terms of Jyotish are welcome.'
      : '- Answer in clear English; use Sanskrit terms with a short gloss.',
    '',
    ...(topics.length
      ? [
          `**Focus of this consultation:** ${topics.map(topicTitle).join(', ')}. Each focus has its own "Focus study" section near the end with the classical method to follow, the extracted data, and the dasha periods that activate it.`,
          '',
          'After reading the data, give a structured study of each focus area: follow its method step by step, cite the data for every point, then give timing from the dasha activation table and practical guidance. Then invite my follow-up questions.',
        ]
      : ['After reading the data, wait for my question. If I have not asked one, give a short overview of the chart and the current dasha.']),
  ].join('\n')
}

function birthDetails(chart: ChartOutput, hideName: boolean): string {
  const m = chart.meta
  const s = m.settings ?? ({} as ChartOutput['meta']['settings'])
  return [
    '## 1. Birth details and calculation settings',
    '',
    table(['Field', 'Value'], [
      ['Name', hideName ? 'Native' : m.name],
      ['Gender', m.gender],
      ['Date of birth', m.birthDate],
      ['Time of birth (local)', m.birthTime],
      ['Place', m.birthPlace],
      ['Latitude / Longitude', `${num(m.latitude, 4)}, ${num(m.longitude, 4)}`],
      ['Time zone', m.timezone],
      ['Ayanamsha', `${s.ayanamsha ?? 'lahiri'} (${dms(m.ayanamshaValue)})`],
      ['House system', s.houseSystem ?? 'whole_sign'],
      ['Rahu/Ketu', s.nodeMode === 'mean' ? 'Mean node' : 'True node'],
      ['Chara karaka scheme', `${s.karakaScheme ?? 7} karakas`],
      ['Julian day', num(m.julianDay, 5)],
    ]),
  ].join('\n')
}

function lagnaSection(chart: ChartOutput): string {
  const l = chart.lagnas
  if (!l) return ''
  const asc = l.ascRashi
  return [
    '## 2. Lagna and special ascendants',
    '',
    `**Lagna (Ascendant): ${RASHI_NAMES[asc]} ${dms(l.ascDegreeInRashi)}** — lagna lord ${gname(RASHI_LORD[asc])}.`,
    '',
    table(['Point', 'Position'], [
      ['Midheaven (MC)', signPos(l.mcDegree)],
      ['Hora Lagna', signPos(l.horaLagna)],
      ['Ghati Lagna', signPos(l.ghatiLagna)],
      ['Bhava Lagna', signPos(l.bhavaLagna)],
      ['Vighati Lagna', signPos(l.vighatiLagna)],
      ['Pranapada', signPos(l.pranapada)],
      ['Sri Lagna', signPos(l.sriLagna)],
      ['Varnada Lagna', signPos(l.varnadaLagna)],
      ['Indu Lagna', signPos(l.induLagna)],
      ['Bhrigu Bindu', signPos(l.bhriguBindu)],
    ]),
  ].join('\n')
}

function grahaFlags(g: GrahaData): string {
  return [
    g.isRetro ? 'Retrograde' : null,
    g.isCombust ? 'Combust' : null,
    g.gandanta?.isGandanta ? 'Gandanta' : null,
    g.yuddha?.isWarring ? `Graha yuddha${g.yuddha.winner === g.id ? ' (winner)' : ' (loser)'}` : null,
    g.pushkara?.isPushkara ? 'Pushkara' : null,
    g.mrityuBhaga?.severity && g.mrityuBhaga.severity !== 'none' ? `Mrityu bhaga (${g.mrityuBhaga.severity})` : null,
    g.id === 'Mo' && g.isWaxingMoon != null ? (g.isWaxingMoon ? 'Waxing' : 'Waning') : null,
  ].filter(Boolean).join(', ') || '—'
}

function grahaSection(chart: ChartOutput): string {
  const asc = chart.lagnas.ascRashi
  const rows = chart.grahas.map((g) => [
    `${g.name ?? gname(g.id)} (${g.id})`,
    `${RASHI_NAMES[g.rashi]} ${dms(g.degree)}`,
    houseFrom(asc, g.rashi),
    `${g.nakshatraName} pada ${g.pada}`,
    g.dignity,
    g.charaKaraka ?? '—',
    `${g.avastha?.baladi ?? '—'} / ${g.avastha?.jagradadi ?? '—'}`,
    g.kp ? `${g.kp.signLord}/${g.kp.starLord}/${g.kp.subLord}` : '—',
    grahaFlags(g),
  ])
  return [
    '## 3. Planets (D1, sidereal)',
    '',
    table(['Planet', 'Sign & degree', 'House', 'Nakshatra', 'Dignity', 'Chara karaka', 'Avastha (baladi / jagradadi)', 'KP sign/star/sub lord', 'Flags'], rows),
  ].join('\n')
}

function houseSection(chart: ChartOutput): string {
  const asc = chart.lagnas.ascRashi
  const bb = chart.bhavaBala?.houses
  const sav = chart.ashtakavarga?.sav
  const rows: unknown[][] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = signOfHouse(asc, h)
    const lord = RASHI_LORD[rashi]
    const lordG = chart.grahas.find((g) => g.id === lord)
    const occupants = chart.grahas.filter((g) => g.rashi === rashi).map((g) => g.id).join(', ') || '—'
    const names = (gs: GrahaData[]) => gs.map((g) => g.id).join(', ') || '—'
    rows.push([
      h,
      RASHI_NAMES[rashi],
      gname(lord),
      lordG ? houseFrom(asc, lordG.rashi) : '—',
      lordG ? names(conjunctWith(chart.grahas, lordG)) : '—',
      lordG ? names(aspectersOf(chart.grahas, lordG.rashi, lord)) : '—',
      occupants,
      names(aspectersOf(chart.grahas, rashi)),
      sav ? sav[rashi - 1] ?? '—' : '—',
      bb?.[h] ? `${num(bb[h].totalRupa)}${bb[h].isStrong ? ' (strong)' : ''}` : '—',
    ])
  }
  return [
    '## 4. Houses (whole sign from Lagna)',
    '',
    table(['House', 'Sign', 'Lord', 'Lord in house', 'Lord conjunct', 'Lord aspected by', 'Occupants', 'House aspected by', 'SAV bindus', 'Bhava bala (rupa)'], rows),
    chart.bhavaBala ? `\nStrongest house: ${chart.bhavaBala.strongestHouse}; weakest house: ${chart.bhavaBala.weakestHouse}.` : '',
    '',
    drishtiSection(chart),
  ].join('\n')
}

/** Graha drishti: what each planet aspects and receives, conjunctions, mutual aspects. */
function drishtiSection(chart: ChartOutput): string {
  const asc = chart.lagnas.ascRashi
  const grahas = chart.grahas.filter((g) => CLASSICAL.includes(g.id))
  const lordships = (id: GrahaId) =>
    ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const).filter((h) => RASHI_LORD[signOfHouse(asc, h)] === id)
  const rows = grahas.map((g) => {
    const from = houseFrom(asc, g.rashi)
    const aspHouses = aspectOffsets(g.id).map((o) => ((from - 1 + o - 1) % 12) + 1)
    const aspPlanets = grahas.filter((x) => x.id !== g.id && !isNodePair(g.id, x.id) && x.rashi !== g.rashi && aspectsSign(g, x.rashi))
    return [
      gname(g.id),
      `H${from}`,
      lordships(g.id).map((h) => `H${h}`).join(', ') || '—',
      aspHouses.map((h) => `H${h} ${RASHI_NAMES[signOfHouse(asc, h)]}`).join(', '),
      aspPlanets.map((x) => x.id).join(', ') || '—',
      aspectersOf(chart.grahas, g.rashi, g.id).map((x) => x.id).join(', ') || '—',
      conjunctWith(chart.grahas, g).map((x) => x.id).join(', ') || '—',
    ]
  })
  const mutual: string[] = []
  for (let i = 0; i < grahas.length; i++) {
    for (let j = i + 1; j < grahas.length; j++) {
      const a = grahas[i], b = grahas[j]
      if (!isNodePair(a.id, b.id) && a.rashi !== b.rashi && aspectsSign(a, b.rashi) && aspectsSign(b, a.rashi)) mutual.push(`${gname(a.id)} ↔ ${gname(b.id)}`)
    }
  }
  return [
    '### Graha drishti (planetary aspects)',
    '',
    `_${DRISHTI_NOTE}_`,
    '',
    table(['Planet', 'In house', 'Lord of', 'Aspects houses', 'Aspects planets', 'Aspected by', 'Conjunct with'], rows),
    '',
    `Mutual aspects: ${mutual.join('; ') || 'none'}.`,
  ].join('\n')
}

/** Rank by raw rupas and by % of minimum: the two can disagree (Mars needs 5, Mercury 7). */
function shadbalaRanking(planets: ChartOutput['shadbala']['planets']): string {
  const ps = CLASSICAL.filter((id) => planets[id] && planets[id].required > 0).map((id) => ({ id, total: planets[id].total, pct: planets[id].total / planets[id].required }))
  if (!ps.length) return ''
  const by = (k: 'total' | 'pct') => [...ps].sort((a, b) => b[k] - a[k])
  const t = by('total'), r = by('pct')
  return `By total rupas: strongest ${gname(t[0].id)}, weakest ${gname(t[t.length - 1].id)}. By % of minimum: strongest ${gname(r[0].id)}, weakest ${gname(r[r.length - 1].id)}. Use % of minimum to judge whether a planet can deliver its results.`
}

function strengthSection(chart: ChartOutput): string {
  const out: string[] = ['## 5. Strength']
  const sb = chart.shadbala
  if (sb?.planets) {
    const rows = CLASSICAL.filter((id) => sb.planets[id]).map((id) => {
      const p = sb.planets[id]
      const pct = p.required > 0 ? `${Math.round((p.total / p.required) * 100)}%` : '—'
      return [gname(id), num(p.sthanaBala, 2), num(p.digBala, 2), num(p.kalaBala, 2), num(p.chestaBala, 2), num(p.naisargikaBala, 2), num(p.drikBala, 2), num(p.total, 2), num(p.required, 2), pct, p.qualityBand ?? (p.isStrong ? 'strong' : 'weak')]
    })
    out.push('', '### Shadbala (all values in rupas)', '',
      `_${SHADBALA_NOTE}_`, '',
      table(['Planet', 'Sthana', 'Dig', 'Kala', 'Chesta', 'Naisargika', 'Drik', 'Total rupas', 'Minimum rupas', '% of minimum', 'Verdict'], rows),
      '', shadbalaRanking(sb.planets))
  }
  const vp = chart.vimsopaka?.planets
  if (vp) {
    const rows = CLASSICAL.filter((id) => vp[id]).map((id) => {
      const v = vp[id]
      return [gname(id), num(v.shadvarga, 1), num(v.saptavarga, 1), num(v.dashavarga, 1), num(v.shodasvarga, 1), v.strength]
    })
    if (rows.length) {
      out.push('', '### Vimsopaka bala (out of 20)', '',
        table(['Planet', 'Shadvarga', 'Saptavarga', 'Dashavarga', 'Shodashavarga', 'Strength'], rows))
    }
  }
  const av = chart.ashtakavarga
  if (av?.bav) {
    const signs = (Object.keys(RASHI_NAMES) as unknown as Rashi[]).map((r) => RASHI_NAMES[r].slice(0, 3))
    const rows = Object.entries(av.bav).map(([k, p]) => [gname(p.planet ?? k), ...(p.bindus ?? []), p.total])
    if (av.sav) rows.push(['**SAV**', ...av.sav, av.savTotal])
    out.push('', '### Ashtakavarga (bindus by sign, Aries → Pisces)', '', table(['Chart', ...signs, 'Total'], rows))
  }
  return out.join('\n')
}

function vargaSection(chart: ChartOutput): string {
  const vargas = chart.vargas ?? {}
  const keys = Object.keys(vargas).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
  if (!keys.length) return ''
  const lines = keys.map((k) => {
    const lagna = chart.vargaLagnas?.[k]
    const pos = (vargas[k] ?? [])
      .filter((g) => CLASSICAL.includes(g.id))
      .map((g) => `${g.id} ${RASHI_NAMES[g.rashi]}${g.dignity && g.dignity !== 'neutral' ? ` (${g.dignity})` : ''}`)
      .join(', ')
    const label = KEY_VARGAS[k] ? ` — ${KEY_VARGAS[k]}` : ''
    return `- **${k}**${label}: Lagna ${lagna ? RASHI_NAMES[lagna] : '—'}; ${pos}`
  })
  return ['## 6. Divisional charts (vargas)', '', ...lines].join('\n')
}

function dashaPath(path: DashaNode[]): string {
  return path.map((n, i) => `${LEVEL_NAMES[i] ?? `L${i + 1}`} ${n.label ?? gname(n.lord)} (${day(n.start)} → ${day(n.end)})`).join(' › ')
}

function dashaSection(chart: ChartOutput, now: number): string {
  const dashas = chart.dashas ?? ({} as ChartOutput['dashas'])
  const out: string[] = ['## 7. Dashas (time periods)', '', `Reference date for "current": ${day(now)}.`]
  const vim = dashas.vimshottari
  if (vim?.length) {
    const path = getDashaPathAt(vim, now)
    out.push('', `**Current Vimshottari:** ${path.length ? dashaPath(path) : 'outside the computed range'}`)
    out.push('', '### Vimshottari mahadashas', '',
      table(['Mahadasha', 'Start', 'End'], vim.map((n) => [`${gname(n.lord)}${path[0] === n ? ' ← current' : ''}`, day(n.start), day(n.end)])))
    const md = path[0]
    if (md?.children?.length) {
      out.push('', `### Antardashas in the current ${gname(md.lord)} mahadasha`, '',
        table(['Antardasha', 'Start', 'End'], md.children.map((n) => [`${gname(n.lord)}${path[1] === n ? ' ← current' : ''}`, day(n.start), day(n.end)])))
    }
    // Next antardashas after the current MD helps "what is coming" questions.
    const idx = md ? vim.indexOf(md) : -1
    const next = idx >= 0 ? vim[idx + 1] : undefined
    if (next?.children?.length) {
      out.push('', `### Antardashas in the next (${gname(next.lord)}) mahadasha`, '',
        table(['Antardasha', 'Start', 'End'], next.children.map((n) => [gname(n.lord), day(n.start), day(n.end)])))
    }
  }
  const others = (Object.keys(dashas) as (keyof typeof dashas)[]).filter((k) => k !== 'vimshottari' && dashas[k]?.length)
  if (others.length) {
    out.push('', '### Other dasha systems (current periods)', '')
    for (const k of others) {
      const path = getDashaPathAt(dashas[k], now).slice(0, 3)
      if (path.length) out.push(`- **${DASHA_LABELS[k] ?? k}:** ${dashaPath(path)}`)
    }
  }
  return out.join('\n')
}

function jaiminiSection(chart: ChartOutput): string {
  const out: string[] = ['## 8. Jaimini: karakas and arudhas']
  const k = chart.karakas
  if (k) {
    const names: [string, string][] = [['AK', 'Atmakaraka'], ['AmK', 'Amatyakaraka'], ['BK', 'Bhratrikaraka'], ['MK', 'Matrikaraka'], ['PK', 'Pitrikaraka'], ['PiK', 'Putrikaraka'], ['GK', 'Gnatikaraka'], ['DK', 'Darakaraka']]
    out.push('', names.filter(([key]) => k[key]).map(([key, label]) => `${label} (${key}): ${gname(k[key] as string)}`).join(' · '))
  }
  const a = chart.arudhas
  if (a) {
    const keys = ['AL', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12'] as const
    const asc = chart.lagnas.ascRashi
    out.push('', 'Bhava arudhas (sign, house from Lagna): ' + keys.filter((x) => a[x]).map((x) => `${x === 'AL' ? 'AL (Arudha Lagna)' : x === 'A12' ? 'UL / A12 (Upapada)' : x} ${RASHI_NAMES[a[x]]} (H${houseFrom(asc, a[x])})`).join('; '))
  }
  return out.join('\n')
}

function yogaSection(chart: ChartOutput): string {
  const yogas = chart.yogas ?? []
  if (!yogas.length) return ''
  return ['## 9. Yogas detected', '',
    table(['Yoga', 'Category', 'Strength', 'Planets', 'Houses', 'Effect'],
      yogas.map((y) => [y.name + (y.sanskrit && y.sanskrit !== y.name ? ` (${y.sanskrit})` : ''), y.category, y.strength, y.planets.join(', '), y.houses.join(', '), y.effect || y.description])),
  ].join('\n')
}

function specialPointsSection(chart: ChartOutput): string {
  const out: string[] = ['## 10. Special points and upagrahas']
  const y = chart.yogiPoint
  if (y) {
    out.push('', `Yogi point ${signPos(y.yogiPoint)} (Yogi graha ${gname(y.yogiGraha)}); Sahayogi ${gname(y.sahayogiGraha)}; Avayogi ${gname(y.avayogiGraha)} at ${signPos(y.avayogiPoint)}.`)
  }
  const up = Object.values(chart.upagrahas ?? {})
  if (up.length) out.push('', up.map((u) => `${u.name} ${RASHI_NAMES[u.rashi]} ${dms(u.degree)} (${u.nakshatraName})`).join('; '))
  return out.join('\n')
}

function panchangSection(chart: ChartOutput): string {
  const p = chart.panchang
  if (!p) return ''
  const tz = chart.meta.timezone
  return ['## 11. Janma panchang (day of birth)', '',
    table(['Limb', 'Value'], [
      ['Vara (weekday)', `${p.vara?.name} (lord ${gname(p.vara?.lord)})`],
      ['Tithi', `${p.tithi?.name} — ${p.tithi?.paksha} paksha #${p.tithi?.number}`],
      ['Nakshatra (Moon)', `${p.nakshatra?.name} pada ${p.nakshatra?.pada} (lord ${gname(p.nakshatra?.lord)})`],
      ['Yoga', p.yoga?.name],
      ['Karana', p.karana?.name],
      ['Sunrise / sunset', `${time(p.sunrise, tz)} / ${time(p.sunset, tz)}`],
    ]),
  ].join('\n')
}

function interpretationSection(chart: ChartOutput): string {
  const i = chart.interpretation
  if (!i) return ''
  const line = (x: { title: string; message: string; house?: number; relatedGrahas?: string[] }) =>
    `- **${x.title}**${x.house ? ` (H${x.house})` : ''}: ${x.message}`
  return ['## 12. Vedaansh rule-based reading (for reference)', '',
    i.headline ? `_${i.headline}_` : '',
    i.strengths?.length ? '\n**Strengths**\n' + i.strengths.map(line).join('\n') : '',
    i.cautions?.length ? '\n**Cautions**\n' + i.cautions.map(line).join('\n') : '',
    i.special?.length ? '\n**Special features**\n' + i.special.map(line).join('\n') : '',
  ].filter(Boolean).join('\n')
}

function hubSection(chart: ChartOutput, now: number, lang: EngineLang): string {
  let sections
  try {
    sections = buildInterpretationHub(chart, null, now, lang)
  } catch {
    return ''
  }
  const body = sections
    .filter((s) => s.id !== 'overview' && s.id !== 'transit' && s.items.length)
    .map((s) => [
      `### ${s.label}`,
      ...s.items.map((it) => {
        const pts = it.points.map((p) => `  - ${p.label ? `${p.label}: ` : ''}${p.text}`).join('\n')
        return `- **${it.title}**${it.subtitle ? ` (${it.subtitle})` : ''}: ${it.summary}${pts ? '\n' + pts : ''}`
      }),
    ].join('\n'))
  if (!body.length) return ''
  return ['## 13. Detailed interpretation notes (Vedaansh Interpretation hub)', '', ...body].join('\n\n')
}

function suggestedQuestions(): string {
  return ['## Questions you can ask', '',
    '- What are the main strengths and challenges in this chart?',
    '- What does the current mahadasha and antardasha bring, and what should I focus on?',
    '- Which career directions does the chart support (D1 10th house, D10, Amatyakaraka)?',
    '- What does the chart say about marriage and partnership (7th house, D9, Darakaraka, Upapada)?',
    '- Which yogas are the strongest, and when do the dashas activate them?',
    '- Which planets are weak, and what traditional remedies are suggested for them?',
  ].join('\n')
}

/**
 * Build a Markdown prompt with every calculation and reading for this chart.
 * Gold+ gets the full Interpretation hub notes; Free gets calculations plus the
 * rule-based overview (the same content it already sees on screen).
 */
export function buildAiPrompt(chart: ChartOutput, opts: AiPromptOptions = {}): string {
  const plan = opts.plan ?? 'free'
  const lang = opts.lang ?? 'en'
  const now = opts.now ?? Date.now()
  const topics = AI_TOPICS.filter((t) => opts.topics?.includes(t))
  if (opts.detail === 'short') {
    return [
      shortInstructions(lang, topics),
      shortChart(chart, !!opts.hideName, now),
      ...topics.map((t) => buildTopicStudy(chart, t, { plan, lang, now, short: true })),
      '_Short version from Vedaansh. Ask for the full prompt if you need every varga, dasha system and reading._',
    ].filter((p) => p && p.trim()).join('\n\n') + '\n'
  }
  const parts = [
    instructions(lang, topics),
    birthDetails(chart, !!opts.hideName),
    lagnaSection(chart),
    grahaSection(chart),
    houseSection(chart),
    strengthSection(chart),
    vargaSection(chart),
    dashaSection(chart, now),
    jaiminiSection(chart),
    yogaSection(chart),
    specialPointsSection(chart),
    panchangSection(chart),
    interpretationSection(chart),
    plan !== 'free' ? hubSection(chart, now, lang) : '',
    ...topics.map((t) => buildTopicStudy(chart, t, { plan, lang, now })),
    topics.length ? '' : suggestedQuestions(),
    '---\n_Calculated by Vedaansh (Swiss Ephemeris). Data is shared by the user for personal analysis._',
  ]
  return parts.filter((p) => p && p.trim()).join('\n\n') + '\n'
}
