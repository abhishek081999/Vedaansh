// /horoscope → today's horoscope, opening on the sign the Moon is in today.
import { redirect } from 'next/navigation'
import { getDailyHoroscope, todayHoroscopeDate } from '@/lib/horoscope/daily'
import { RASHI_SLUGS } from '@/lib/engine/dailyRashiHoroscope'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function HoroscopeIndex() {
  const report = await getDailyHoroscope(todayHoroscopeDate())
  redirect(`/horoscope/${RASHI_SLUGS[report.moonRashi]}`)
}
