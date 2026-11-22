// ─────────────────────────────────────────────────────────────
//  src/lib/engine/remedyPractices.ts
//  Trackable planetary remedies: a daily beej-mantra japa (one mala
//  of 108) and a weekly fast on the planet's weekday. Calendar rules:
//  • daily  — day 1 is the start date in the user's time zone; only
//             today can be ticked; an unticked earlier day breaks the run.
//  • weekly — practice days are the planet's weekday from the start
//             date onward; only today's practice day can be ticked; a
//             passed practice day left unticked breaks the run.
//  Pure — used by the API (enforcement) and the UI (display).
// ─────────────────────────────────────────────────────────────

import type { RemedyGrahaId } from './planetaryRemedies'
import type { EngineLang } from './lang'
import { lkCalendarDate, lkTrackerState, type LkTrackerState } from './lalKitab/trackerDays'

export type PracticeKind = 'mantra' | 'fast'
export type PracticeCadence = 'daily' | 'weekly'

export interface RemedyPracticeDef {
  /** e.g. "Su.mantra", "Mo.fast" */
  id: string
  graha: RemedyGrahaId
  kind: PracticeKind
  cadence: PracticeCadence
  /** 0 = Sunday … 6 = Saturday (weekly only). */
  weekday?: number
  /** Run lengths the user may pick (days for daily, weeks for weekly). */
  lengths: readonly number[]
  defaultLength: number
  /** Devanagari mantra (mantra only). */
  mantra?: string
  /** Repetitions per sitting (mantra only). */
  count?: number
}

export interface RemedyPracticeView extends RemedyPracticeDef {
  title: string
  how: string
}

const BEEJ: Record<RemedyGrahaId, string> = {
  Su: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः',
  Mo: 'ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः',
  Ma: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
  Me: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',
  Ju: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',
  Ve: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः',
  Sa: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
  Ra: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः',
  Ke: 'ॐ स्रां स्रीं स्रौं सः केतवे नमः',
}

/** Weekday of each planet's vrat. Rahu and Ketu have no single agreed fast day, so none is offered. */
const FAST_DAY: Partial<Record<RemedyGrahaId, number>> = { Su: 0, Mo: 1, Ma: 2, Me: 3, Ju: 4, Ve: 5, Sa: 6 }

const GRAHA_EN: Record<RemedyGrahaId, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
}
const GRAHA_HI: Record<RemedyGrahaId, string> = {
  Su: 'सूर्य', Mo: 'चंद्र', Ma: 'मंगल', Me: 'बुध', Ju: 'गुरु', Ve: 'शुक्र', Sa: 'शनि', Ra: 'राहु', Ke: 'केतु',
}
const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAY_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार']

const FAST_HOW_EN: Partial<Record<RemedyGrahaId, string>> = {
  Su: 'Eat one simple meal before sunset and offer water to the rising Sun.',
  Mo: 'Worship Shiva and offer water or milk on the Shivling; keep the fast till evening.',
  Ma: 'Worship Hanuman and recite the Hanuman Chalisa; eat one simple meal.',
  Me: 'Worship Ganesha and give green moong or greens in charity.',
  Ju: 'Worship Vishnu, wear or give something yellow, and eat once without salt.',
  Ve: 'Worship Lakshmi and give white sweets or rice in charity.',
  Sa: 'Worship Shani or Hanuman and light a mustard-oil lamp under a peepal tree in the evening.',
}
const FAST_HOW_HI: Partial<Record<RemedyGrahaId, string>> = {
  Su: 'सूर्यास्त से पहले एक बार सादा भोजन करें और उगते सूर्य को जल अर्पित करें।',
  Mo: 'शिव पूजा करें और शिवलिंग पर जल या दूध चढ़ाएँ; शाम तक व्रत रखें।',
  Ma: 'हनुमान जी की पूजा करें और हनुमान चालीसा पढ़ें; एक बार सादा भोजन करें।',
  Me: 'गणेश जी की पूजा करें और हरी मूंग या हरी सब्ज़ी दान करें।',
  Ju: 'विष्णु पूजा करें, पीली वस्तु पहनें या दान करें, और बिना नमक एक बार भोजन करें।',
  Ve: 'लक्ष्मी पूजा करें और सफ़ेद मिठाई या चावल दान करें।',
  Sa: 'शनि देव या हनुमान जी की पूजा करें और शाम को पीपल के नीचे सरसों के तेल का दीपक जलाएँ।',
}

function defsFor(graha: RemedyGrahaId): RemedyPracticeDef[] {
  const out: RemedyPracticeDef[] = [
    { id: `${graha}.mantra`, graha, kind: 'mantra', cadence: 'daily', lengths: [21, 40], defaultLength: 40, mantra: BEEJ[graha], count: 108 },
  ]
  const weekday = FAST_DAY[graha]
  if (weekday !== undefined) {
    out.push({
      id: `${graha}.fast`, graha, kind: 'fast', cadence: 'weekly', weekday,
      // Solah Somvar (16 Mondays) is the well-known Moon vrat.
      lengths: [7, 11, 16, 21], defaultLength: graha === 'Mo' ? 16 : 11,
    })
  }
  return out
}

const ALL: RemedyPracticeDef[] = (['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'] as RemedyGrahaId[]).flatMap(defsFor)

export function practiceGrahaName(graha: RemedyGrahaId, lang: EngineLang = 'en'): string {
  return lang === 'hi' ? GRAHA_HI[graha] : GRAHA_EN[graha]
}

export function getRemedyPractice(id: string): RemedyPracticeDef | null {
  return ALL.find((p) => p.id === id) ?? null
}

export function remedyPracticesFor(graha: RemedyGrahaId, lang: EngineLang = 'en'): RemedyPracticeView[] {
  return defsFor(graha).map((d) => describePractice(d, lang))
}

export function describePractice(d: RemedyPracticeDef, lang: EngineLang = 'en'): RemedyPracticeView {
  const hi = lang === 'hi'
  if (d.kind === 'mantra') {
    return {
      ...d,
      title: hi ? `${GRAHA_HI[d.graha]} बीज मंत्र जप` : `${GRAHA_EN[d.graha]} beej mantra japa`,
      how: hi
        ? `प्रतिदिन एक माला (${d.count} बार) जप करें, हो सके तो एक ही समय और स्थान पर।`
        : `Chant one mala (${d.count} times) every day, ideally at the same time and place.`,
    }
  }
  const day = d.weekday ?? 0
  return {
    ...d,
    title: hi ? `${WEEKDAY_HI[day]} व्रत (${GRAHA_HI[d.graha]})` : `${WEEKDAY_EN[day]} fast for ${GRAHA_EN[d.graha]}`,
    how: (hi ? FAST_HOW_HI[d.graha] : FAST_HOW_EN[d.graha]) ?? '',
  }
}

// ── Calendar state ───────────────────────────────────────────

export interface PracticeTrackerState extends LkTrackerState {
  /** Today is a practice day (always true for daily practices). */
  practiceDay: boolean
  /** Next practice date (YYYY-MM-DD) that is still open, or null when the run is over. */
  nextDate: string | null
}

function dayNumber(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

function ymdOf(dayNo: number): string {
  return new Date(dayNo * 86_400_000).toISOString().slice(0, 10)
}

/** Weekday (0 = Sunday) of a day number since the Unix epoch (1970-01-01 was a Thursday). */
const weekdayOf = (dayNo: number) => (((dayNo + 4) % 7) + 7) % 7

export function weeklyTrackerState(
  days: readonly boolean[],
  startedAt: Date,
  now: Date,
  tz: string,
  weekday: number,
): PracticeTrackerState {
  const start = dayNumber(lkCalendarDate(startedAt, tz))
  const today = dayNumber(lkCalendarDate(now, tz))
  const first = start + ((weekday - weekdayOf(start) + 7) % 7)
  const practiceDay = today >= first && weekdayOf(today) === weekday
  // Practice days strictly before today.
  const passed = today <= first ? 0 : Math.floor((today - first - 1) / 7) + 1
  const todayIndex = practiceDay ? (today - first) / 7 : passed
  const missed = days.slice(0, Math.min(passed, days.length)).some((d) => !d)
  const over = todayIndex >= days.length
  const canTick = practiceDay && !missed && !over && !days[todayIndex]
  const nextIdx = days.findIndex((d, i) => !d && i >= todayIndex)
  return {
    todayIndex,
    missed,
    over,
    canTick,
    practiceDay,
    nextDate: missed || nextIdx < 0 ? null : ymdOf(first + nextIdx * 7),
  }
}

export function practiceTrackerState(
  def: Pick<RemedyPracticeDef, 'cadence' | 'weekday'>,
  days: readonly boolean[],
  startedAt: Date,
  now: Date,
  tz: string,
): PracticeTrackerState {
  if (def.cadence === 'weekly') return weeklyTrackerState(days, startedAt, now, tz, def.weekday ?? 0)
  const s = lkTrackerState(days, startedAt, now, tz)
  const start = dayNumber(lkCalendarDate(startedAt, tz))
  const nextIdx = days.findIndex((d, i) => !d && i >= s.todayIndex)
  return { ...s, practiceDay: true, nextDate: s.missed || nextIdx < 0 ? null : ymdOf(start + nextIdx) }
}
