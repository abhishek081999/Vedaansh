// ─────────────────────────────────────────────────────────────
//  src/lib/engine/advancedInterpretationLang.ts
//  Display-language layer for buildChartInterpretation() output (Insights
//  tab). Kept apart from advancedInterpretation.ts, which imports the
//  ephemeris-backed house module and so cannot ship to the browser.
// ─────────────────────────────────────────────────────────────
import type {
  ChartInterpretation,
  GrahaData,
  InterpretationInsight,
  Rashi,
  ShadbalaResult,
} from '@/types/astrology'
import { getPlanetInHouse, type ClassicalGrahaId } from './houseInterpretations'
import { getPlanetInSign } from './rashiInterpretations'
import { fill, type EngineLang } from './lang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { ordHi } from './locale/todayReading.hi'
import { HOUSE_THEMES_HI } from './locale/interpretations.hi'
import {
  DIGNITY_ACTION_HI,
  GRAHA_DOMAIN_HI,
  GRAHA_PRACTICE_HI,
  GANDANTA_TYPE_HI,
  HOUSE_LABEL_HI,
  INTERP_HI,
  MRITYU_REMEDY_HI,
  PUSHKARA_REMEDY_HI,
  RASHI_CORE_HI,
  RASHI_LORD,
} from './locale/advancedInterpretation.hi'
// ── Hindi (display layer) ───────────────────────────────────────
// The chart's interpretation is built once in English on the server. The
// Insights tab rebuilds each insight's text from its id, grahas and house so
// /hi can show Hindi without recalculating. English is returned untouched.

function hiArea(house: number | undefined, fallback: string): string {
  return house ? fill(INTERP_HI.yourHouse, { label: HOUSE_LABEL_HI[house] ?? '', nth: ordHi(house) }) : fallback
}

function hiHouseLabel(house: number | undefined, fallback: string): string {
  return house ? fill(INTERP_HI.houseLabel, { nth: ordHi(house), label: HOUSE_LABEL_HI[house] ?? '' }) : fallback
}

function hiDignityAction(g: GrahaData): string {
  return DIGNITY_ACTION_HI[g.dignity] ?? DIGNITY_ACTION_HI.default
}

function localizeInsightHi(
  ins: InterpretationInsight,
  ctx: { grahas: GrahaData[]; shadbala?: ShadbalaResult; ascRashi?: number },
): InterpretationInsight {
  const id = ins.id
  const gid = ins.relatedGrahas[0]
  const g = ctx.grahas.find((x) => x.id === gid)
  const name = gid ? GRAHA_HI[gid] ?? gid : ''
  const house = ins.house
  const domain = (gid && GRAHA_DOMAIN_HI[gid]) || ''
  const practice = (gid && GRAHA_PRACTICE_HI[gid]) || ''
  const v = { graha: name, domain, practice }
  const out = (title: string, message: string, actions?: string[]): InterpretationInsight => ({
    ...ins,
    title,
    message,
    ...(ins.actions ? { actions: actions ?? ins.actions } : {}),
  })

  if (id.startsWith('summary-yogi-graha-')) {
    const avayogi = ins.relatedGrahas[1]
    const yogiG = ctx.grahas.find((x) => x.id === gid)
    const d = yogiG ? GRAHA_DOMAIN_HI[yogiG.id] ?? INTERP_HI.yogiDomainFallback : INTERP_HI.yogiDomainFallback
    const pr = yogiG ? GRAHA_PRACTICE_HI[yogiG.id] ?? INTERP_HI.yogiPracticeFallback : INTERP_HI.yogiPracticeFallback
    return out(
      fill(INTERP_HI.yogiTitle, { graha: name }),
      fill(INTERP_HI.yogiMsg, { yogi: name, avayogi: avayogi ? GRAHA_HI[avayogi] : '', area: hiArea(house, INTERP_HI.yogiArea) }),
      INTERP_HI.yogiActions.map((a) => fill(a, { domain: d, practice: pr })),
    )
  }
  if (!g) return ins

  if (id.endsWith('-leads-your-chart') || id.endsWith('-needs-support')) {
    const strong = id.endsWith('-leads-your-chart')
    const val = ctx.shadbala?.planets[g.id]?.totalShash
    const valText = typeof val === 'number' ? val.toFixed(2) : '—'
    return out(
      fill(strong ? INTERP_HI.strongTitle : INTERP_HI.weakTitle, v),
      fill(strong ? INTERP_HI.strongMsg : INTERP_HI.weakMsg, { ...v, val: valText, area: hiArea(house, INTERP_HI.strongArea) }),
      [...(strong ? INTERP_HI.strongActions : INTERP_HI.weakActions), hiDignityAction(g)],
    )
  }
  if (id.endsWith('-in-gandanta')) {
    const exact = g.gandanta?.severity === 'exact'
    const type = g.gandanta?.type ? GANDANTA_TYPE_HI[g.gandanta.type] ?? g.gandanta.type : INTERP_HI.gandantaType
    const area = hiHouseLabel(house, INTERP_HI.lifeArea)
    return out(
      fill(INTERP_HI.gandantaTitle, v),
      fill(INTERP_HI.gandantaMsg, {
        ...v,
        type,
        deg: g.gandanta?.distanceFromJunction?.toFixed(2) ?? '—',
        area: hiArea(house, INTERP_HI.gandantaArea),
      }),
      [...(exact ? INTERP_HI.gandantaExact : INTERP_HI.gandantaNear).map((a) => fill(a, { ...v, area, rashi: RASHI_HI[g.rashi] })), hiDignityAction(g)],
    )
  }
  if (id.endsWith('-near-mrityu-bhaga')) {
    const area = hiHouseLabel(house, INTERP_HI.lifeArea)
    const remedy = g.mrityuBhaga?.remedy ? MRITYU_REMEDY_HI[g.mrityuBhaga.severity] : undefined
    return out(
      fill(INTERP_HI.mrityuTitle, v),
      fill(INTERP_HI.mrityuMsg, { ...v, deg: g.mrityuBhaga?.distanceFromMrityu.toFixed(2) ?? '—', area: hiArea(house, INTERP_HI.lifeArea) }),
      remedy
        ? [remedy, fill(INTERP_HI.mrityuWithRemedy, { ...v, area }), hiDignityAction(g)]
        : [...INTERP_HI.mrityuNoRemedy.map((a) => fill(a, { ...v, area })), hiDignityAction(g)],
    )
  }
  if (id.endsWith('-in-pushkara-navamsha')) {
    const area = hiHouseLabel(house, INTERP_HI.pushkaraArea)
    return out(
      fill(INTERP_HI.pushkaraTitle, v),
      fill(INTERP_HI.pushkaraMsg, { ...v, area: hiArea(house, INTERP_HI.lifeArea) }),
      g.pushkara?.remedy
        ? [PUSHKARA_REMEDY_HI, fill(INTERP_HI.pushkaraWithRemedy, { ...v, area }), hiDignityAction(g)]
        : [...INTERP_HI.pushkaraNoRemedy.map((a) => fill(a, { ...v, area })), hiDignityAction(g)],
    )
  }
  if (id.endsWith('-in-planetary-war')) {
    const win = g.yuddha?.winner === g.id
    const area = hiHouseLabel(house, INTERP_HI.lifeArea)
    return out(
      fill(INTERP_HI.yuddhaTitle, v),
      fill(win ? INTERP_HI.yuddhaWinMsg : INTERP_HI.yuddhaLoseMsg, { ...v, area }),
      [fill(win ? INTERP_HI.yuddhaWinAction : INTERP_HI.yuddhaLoseAction, { ...v, area }), INTERP_HI.yuddhaPause, hiDignityAction(g)],
    )
  }
  if (id.startsWith('summary-lagna-in-')) {
    const asc = (ctx.ascRashi ?? 0) as Rashi
    if (!RASHI_HI[asc]) return ins
    const lord = GRAHA_HI[RASHI_LORD[asc]]
    return out(
      fill(INTERP_HI.lagnaTitle, { rashi: RASHI_HI[asc] }),
      fill(INTERP_HI.lagnaMsg, { core: RASHI_CORE_HI[asc], lord }),
      INTERP_HI.lagnaActions.map((a) => fill(a, { lord })),
    )
  }
  const houseMatch = /-in-house-(\d+)$/.exec(id)
  if (houseMatch && house) {
    const theme = HOUSE_THEMES_HI[house as keyof typeof HOUSE_THEMES_HI]
    const msg = getPlanetInHouse(g.id as ClassicalGrahaId, house, 'summary', 'hi') ?? ''
    return out(
      fill(INTERP_HI.houseTitle, { ...v, nth: ordHi(house) }),
      theme ? `${msg} ${fill(INTERP_HI.houseColors, { theme: theme.english })}` : msg,
      [fill(INTERP_HI.houseWatch, { ...v, nth: ordHi(house), themes: theme?.shortThemes ?? '' }), hiDignityAction(g)],
    )
  }
  if (ins.category === 'summary' && id.startsWith(`summary-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-in-`)) {
    const msg = getPlanetInSign(g.id, g.rashi, 'summary', 'hi') ?? ''
    return out(
      fill(INTERP_HI.signTitle, { ...v, rashi: RASHI_HI[g.rashi] }),
      `${msg} ${fill(INTERP_HI.signTheme, { rashi: RASHI_HI[g.rashi], core: RASHI_CORE_HI[g.rashi] })}`.trim(),
    )
  }
  return ins
}

/**
 * Display copy of a chart interpretation in the requested language. Hindi
 * rebuilds titles, messages and actions per insight; classical-text excerpts
 * that only exist in English are left out of the Hindi message.
 */
export function localizeChartInterpretation(
  interp: ChartInterpretation,
  ctx: { grahas: GrahaData[]; shadbala?: ShadbalaResult; ascRashi?: number },
  lang: EngineLang = 'en',
): ChartInterpretation {
  if (lang !== 'hi') return interp
  const tr = (list: InterpretationInsight[]) => list.map((i) => localizeInsightHi(i, ctx))
  return {
    headline: interp.topInsights[0]?.tone === 'caution' ? INTERP_HI.headlineCaution : INTERP_HI.headlineSupportive,
    strengths: tr(interp.strengths),
    cautions: tr(interp.cautions),
    special: tr(interp.special),
    topInsights: tr(interp.topInsights),
  }
}
