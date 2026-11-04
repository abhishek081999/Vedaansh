// ─────────────────────────────────────────────────────────────
//  src/app/horoscope/[sign]/page.tsx
//  Public daily horoscope for one Moon sign — server-rendered
//  for search, recomputed per IST day (Redis-cached).
// ─────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DailyHoroscope } from '@/components/horoscope/DailyHoroscope'
import { RashiIcon } from '@/components/horoscope/RashiIcon'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, faqJsonLd, ogImages, SITE_URL } from '@/lib/seo/site'
import { getChandrashtama, getDailyHoroscope, getWeekOutlook, todayHoroscopeDate } from '@/lib/horoscope/daily'
import { getRashiProfile } from '@/lib/engine/rashiInterpretations'
import { HoroscopeDeepDive } from '@/components/horoscope/HoroscopeDeepDive'
import { RASHI_SLUGS, rashiFromSlug } from '@/lib/engine/dailyRashiHoroscope'
import { RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import styles from '../horoscope.module.css'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ sign: string }> }

const FAQ = [
  {
    q: 'Is this horoscope based on my Sun sign or Moon sign?',
    a: 'Vedic astrology reads the daily horoscope (rashifal) from your Moon sign — the sidereal sign the Moon occupied at your birth. It often differs from your Western Sun sign.',
  },
  {
    q: 'How is today’s horoscope calculated?',
    a: 'We take today’s real planetary positions from the Swiss Ephemeris (Lahiri ayanamsha) and count each graha from your Moon sign, applying the classical gochara tables of favourable houses and Vedha (obstruction) from BPHS and Phaladeepika. The Moon’s transit carries the most weight for a single day.',
  },
  {
    q: 'How do I find my Moon sign?',
    a: 'Enter your birth date, time and place in the free Vedaansh birth chart. Your Moon sign (Chandra Rashi) appears in the chart summary.',
  },
]

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { sign } = await params
  const rashi = rashiFromSlug(sign)
  if (!rashi) return { title: 'Daily Horoscope' }
  const name = RASHI_NAMES[rashi]
  const sa = RASHI_SANSKRIT[rashi]
  const title = `${name} (${sa}) Horoscope Today — Vedic Daily Rashifal`
  const description = `Today's Vedic horoscope for ${name} Moon sign (${sa} Rashi): career, love, money and health scores from live planetary transits, plus lucky colour, number and remedy.`
  const url = `${SITE_URL}/horoscope/${RASHI_SLUGS[rashi]}`
  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [`${name} horoscope today`, `${sa} rashifal`, 'daily horoscope', 'Vedic horoscope', 'Moon sign horoscope', 'gochar'],
    openGraph: { title: `${title} | Vedaansh`, description, url, type: 'article', images: ogImages(title) },
  }
}

export default async function HoroscopeSignPage({ params }: Params) {
  const { sign } = await params
  const rashi = rashiFromSlug(sign)
  if (!rashi) notFound()

  const today = todayHoroscopeDate()
  const [report, week] = await Promise.all([getDailyHoroscope(today), getWeekOutlook(today, rashi)])
  const now = Date.now()
  const chandrashtama = getChandrashtama(rashi, new Date(now))
  const name = RASHI_NAMES[rashi]

  return (
    <main className={styles.main}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Daily Horoscope', path: `/horoscope/${RASHI_SLUGS[rashi]}` },
          { name: `${name} Horoscope Today`, path: `/horoscope/${RASHI_SLUGS[rashi]}` },
        ])}
      />
      <JsonLd data={faqJsonLd(FAQ)} />

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
        <h2 id="all-signs" className={styles.blockTitle}>All twelve Moon signs today</h2>
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
                <span className={styles.signScore} data-tone={s.tone}>{s.score}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="faq">
        <h2 id="faq" className={styles.blockTitle}>About the daily rashifal</h2>
        {FAQ.map((f) => (
          <details key={f.q} className={styles.faq}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        <p className={styles.blockNote}>
          This is a general reading shared by everyone born with the Moon in {name}.{' '}
          <Link href="/today">Today&rsquo;s Reading</Link> adds your dasha, lagna and natal transits.
        </p>
      </section>
    </main>
  )
}
