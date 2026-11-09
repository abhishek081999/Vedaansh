// ─────────────────────────────────────────────────────────────
//  src/app/horoscope/[sign]/page.tsx
//  Public daily horoscope for one Moon sign — server-rendered
//  for search, recomputed per IST day (Redis-cached).
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { DailyHoroscope } from '@/components/horoscope/DailyHoroscope'
import { RashiIcon } from '@/components/horoscope/RashiIcon'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, faqJsonLd, ogImages, SITE_URL } from '@/lib/seo/site'
import { getChandrashtama, getDailyHoroscope, getWeekOutlook, todayHoroscopeDate } from '@/lib/horoscope/daily'
import { getRashiProfile } from '@/lib/engine/rashiInterpretations'
import { HoroscopeDeepDive } from '@/components/horoscope/HoroscopeDeepDive'
import { RASHI_SLUGS, rashiFromSlug } from '@/lib/engine/dailyRashiHoroscope'
import { isAppLocale, localizePath, type AppLocale } from '@/i18n/config'
import { pageLocale } from '@/lib/seo/i18nMeta'
import { RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import { getLocale } from 'next-intl/server'
import styles from '../horoscope.module.css'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ sign: string }> }

type FaqItem = { q: string; a: string }

function horoscopeLang(raw: string): AppLocale {
  return isAppLocale(raw) ? raw : 'en'
}

async function loadHoroscope(date: string, lang: AppLocale) {
  return (getDailyHoroscope as (d: string, l?: AppLocale) => ReturnType<typeof getDailyHoroscope>)(date, lang)
}

async function loadWeek(date: string, rashi: number, lang: AppLocale) {
  return (getWeekOutlook as (d: string, r: typeof rashi, l?: AppLocale) => ReturnType<typeof getWeekOutlook>)(
    date,
    rashi,
    lang,
  )
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { sign } = await params
  const rashi = rashiFromSlug(sign)
  if (!rashi) {
    const t = await getTranslations('horoscope')
    return { title: t('meta.fallbackTitle') }
  }
  const locale = await pageLocale()
  const t = await getTranslations('horoscope')
  const name = RASHI_NAMES[rashi]
  const sa = RASHI_SANSKRIT[rashi]
  const path = `/horoscope/${RASHI_SLUGS[rashi]}`
  const url = `${SITE_URL}${localizePath(path, locale)}`
  const title = t('meta.title', { name, sanskrit: sa })
  const description = t('meta.description', { name, sanskrit: sa })
  const keywords = (t.raw('meta.keywords') as string[]).map((k) =>
    k.replace(/\{name\}/g, name).replace(/\{sanskrit\}/g, sa),
  )
  return {
    title,
    description,
    alternates: { canonical: url },
    keywords,
    openGraph: { title: `${title}${t('meta.ogTitleSuffix')}`, description, url, type: 'article', images: ogImages(title) },
  }
}

export default async function HoroscopeSignPage({ params }: Params) {
  const { sign } = await params
  const rashi = rashiFromSlug(sign)
  if (!rashi) notFound()

  const lang = horoscopeLang(await getLocale())
  const t = await getTranslations('horoscope')
  const faqItems = t.raw('faq.items') as FaqItem[]

  const today = todayHoroscopeDate()
  const [report, week] = await Promise.all([loadHoroscope(today, lang), loadWeek(today, rashi, lang)])
  const now = Date.now()
  const chandrashtama = getChandrashtama(rashi, new Date(now))
  const name = RASHI_NAMES[rashi]
  const slug = RASHI_SLUGS[rashi]

  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t('breadcrumb.home'), path: '/' },
          { name: t('breadcrumb.dailyHoroscope'), path: `/horoscope/${slug}` },
          { name: t('breadcrumb.signToday', { name }), path: `/horoscope/${slug}` },
        ])}
      />
      <JsonLd data={faqJsonLd(faqItems)} />

      <DailyHoroscope initialReport={report} sign={rashi} variant="page" />

      <HoroscopeDeepDive
        rashi={rashi}
        english={name}
        week={week}
        chandrashtama={chandrashtama}
        profile={getRashiProfile(rashi)}
        now={now}
      />

      <section className={styles.block} aria-labelledby="all-signs">
        <h2 id="all-signs" className={styles.blockTitle}>
          {t('signGrid.title')}
        </h2>
        <ul className={styles.signGrid}>
          {report.signs.map((s) => (
            <li key={s.rashi}>
              <Link
                href={`/horoscope/${s.slug}`}
                className={`${styles.signCard} ${s.rashi === rashi ? styles.signCardActive : ''}`}
                aria-current={s.rashi === rashi ? 'page' : undefined}
              >
                <span className={styles.signGlyph} aria-hidden>
                  <RashiIcon rashi={s.rashi} size={26} />
                </span>
                <span className={styles.signText}>
                  <strong>
                    {s.english} <span className={styles.signDeva}>{s.devanagari}</span>
                  </strong>
                  <span>{s.headline}</span>
                </span>
                <span className={styles.signScore} data-tone={s.tone}>
                  {s.score}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="faq">
        <h2 id="faq" className={styles.blockTitle}>
          {t('faq.title')}
        </h2>
        {faqItems.map((f) => (
          <details key={f.q} className={styles.faq}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        <p className={styles.blockNote}>
          {t('faq.note', { name })}{' '}
          <Link href="/today">{t('faq.noteLink')}</Link> adds your dasha, lagna and natal transits.
        </p>
      </section>
    </main>
  )
}
