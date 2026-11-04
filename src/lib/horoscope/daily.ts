// ─────────────────────────────────────────────────────────────
//  src/lib/horoscope/daily.ts
//  Server helper: general daily horoscope for all 12 Moon signs,
//  cached per IST date (same for every visitor, so one compute/day).
// ─────────────────────────────────────────────────────────────

import { redis } from '@/lib/redis'
import { buildDailyHoroscopeSky } from '@/lib/engine/dailyHoroscopeSky'
import { buildDailyHoroscopeReport, type DailyHoroscopeReport } from '@/lib/engine/dailyRashiHoroscope'

const CACHE_TTL_SECONDS = 3 * 86_400

export function horoscopeCacheKey(date: string): string {
  return `horoscope:rashi-daily:v5:${date}`
}

/** Today's date in IST (YYYY-MM-DD) — the horoscope day runs 06:00 → 06:00 IST. */
export function todayHoroscopeDate(now: Date = new Date()): string {
  // Before 06:00 IST we are still in the previous Vedic day.
  const shifted = new Date(now.getTime() - 30 * 60_000)
  return shifted.toISOString().slice(0, 10)
}

/** Guards against entries written by an older report shape under a reused key. */
function isCurrentShape(r: DailyHoroscopeReport | null): r is DailyHoroscopeReport {
  return Boolean(r?.moonNakshatra?.name && r.signs?.length === 12 && Boolean(r.signs[0]?.devanagari) && r.signs[0]?.areas?.length === 5 && Boolean(r.panchang))
}

export async function getDailyHoroscope(date: string): Promise<DailyHoroscopeReport> {
  const key = horoscopeCacheKey(date)
  const cached = await redis.get<DailyHoroscopeReport>(key)
  if (isCurrentShape(cached)) return cached

  const report = buildDailyHoroscopeReport(buildDailyHoroscopeSky(date))
  await redis.set(key, report, CACHE_TTL_SECONDS)
  return report
}
