// ─────────────────────────────────────────────────────────────
//  src/lib/horoscope/daily.ts
//  Server helper: general daily horoscope for all 12 Moon signs,
//  cached per IST date (same for every visitor, so one compute/day).
// ─────────────────────────────────────────────────────────────

import { redis } from '@/lib/redis'
import { buildDailyHoroscopeSky, findMoonInSign } from '@/lib/engine/dailyHoroscopeSky'
import {
  buildDailyHoroscopeReport,
  type DailyHoroscopeReport,
  type RashiHoroscope,
} from '@/lib/engine/dailyRashiHoroscope'
import type { Rashi } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'

const CACHE_TTL_SECONDS = 3 * 86_400

export function horoscopeCacheKey(date: string, lang: EngineLang = 'en'): string {
  return `horoscope:rashi-daily:v7:${date}:${lang}`
}

/** Today's date in IST (YYYY-MM-DD) — the horoscope day runs 06:00 → 06:00 IST. */
export function todayHoroscopeDate(now: Date = new Date()): string {
  // Before 06:00 IST we are still in the previous Vedic day.
  const shifted = new Date(now.getTime() - 30 * 60_000)
  return shifted.toISOString().slice(0, 10)
}

/** Guards against entries written by an older report shape under a reused key. */
function isCurrentShape(r: DailyHoroscopeReport | null): r is DailyHoroscopeReport {
  return Boolean(r?.moonNakshatra?.name && r.signs?.length === 12 && Boolean(r.timings && r.signs[0]?.shubhSamay && r.signs[0]?.devanagari) && r.signs[0]?.areas?.length === 5 && Boolean(r.panchang))
}

export async function getDailyHoroscope(date: string, lang: EngineLang = 'en'): Promise<DailyHoroscopeReport> {
  const key = horoscopeCacheKey(date, lang)
  const cached = await redis.get<DailyHoroscopeReport>(key)
  if (isCurrentShape(cached)) return cached

  const report = buildDailyHoroscopeReport(buildDailyHoroscopeSky(date), lang)
  await redis.set(key, report, CACHE_TTL_SECONDS)
  return report
}

export interface WeekDay {
  date: string
  score: number
  tone: RashiHoroscope['tone']
  moonHouse: number
  headline: string
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Seven-day outlook for one Moon sign, starting at `date` (each day is cached). */
export async function getWeekOutlook(date: string, rashi: Rashi, lang: EngineLang = 'en'): Promise<WeekDay[]> {
  const days = await Promise.all(Array.from({ length: 7 }, (_, i) => getDailyHoroscope(addDays(date, i), lang)))
  return days.map((r) => {
    const s = r.signs[rashi - 1]
    return { date: r.date, score: s.score, tone: s.tone, moonHouse: s.moon.house, headline: s.headline }
  })
}

/** Next (or current) Chandrashtama: the Moon in the 8th sign from the Janma Rashi. */
export function getChandrashtama(rashi: Rashi, from: Date = new Date()): { rashi: Rashi; start: string; end: string } | null {
  const eighth = (((rashi - 1 + 7) % 12) + 1) as Rashi
  const w = findMoonInSign(from, eighth)
  return w ? { rashi: eighth, ...w } : null
}
