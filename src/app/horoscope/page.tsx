// /horoscope → today's horoscope, opening on the sign the Moon is in today.
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { isAppLocale, type AppLocale } from '@/i18n/config'
import { getDailyHoroscope, todayHoroscopeDate } from '@/lib/horoscope/daily'
import { RASHI_SLUGS } from '@/lib/engine/dailyRashiHoroscope'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function HoroscopeIndex() {
  const raw = await getLocale()
  const lang: AppLocale = isAppLocale(raw) ? raw : 'en'
  const report = await (getDailyHoroscope as (d: string, l?: AppLocale) => ReturnType<typeof getDailyHoroscope>)(
    todayHoroscopeDate(),
    lang,
  )
  redirect(`/horoscope/${RASHI_SLUGS[report.moonRashi]}`)
}
