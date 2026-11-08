// ─────────────────────────────────────────────────────────────
//  src/components/horoscope/HoroscopeDeepDive.tsx
//  Full Dainik Rashifal page extras (server-rendered):
//  Saptahik week chart · Chandrashtama window · Rashi swabhav.
// ─────────────────────────────────────────────────────────────

import { getTranslations } from 'next-intl/server'
import type { WeekDay } from '@/lib/horoscope/daily'
import type { RashiProfile } from '@/lib/engine/rashiInterpretations'
import { pageLocale } from '@/lib/seo/i18nMeta'
import { intlTag } from '@/i18n/config'
import { RASHI_SANSKRIT, type Rashi } from '@/types/astrology'
import { RashiIcon } from './RashiIcon'
import styles from './HoroscopeDeepDive.module.css'

const TZ = 'Asia/Kolkata'

type HoroscopeCopy = Awaited<ReturnType<typeof getTranslations<'horoscope'>>>

const PLANET_GLYPHS: Record<string, string> = {
  Su: '☉', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}

const fmtDay = (date: string, tag: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(tag, { ...opts, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))

const fmtWhen = (iso: string, tag: string) =>
  new Intl.DateTimeFormat(tag, {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ,
  }).format(new Date(iso))

function ordinalHouse(t: HoroscopeCopy, house: number): string {
  return t(`ordinal.${house}` as 'ordinal.1')
}

function planetName(t: HoroscopeCopy, id: string): string {
  return t(`planets.${id}` as 'planets.Su')
}

// ── Saptahik chart ───────────────────────────────────────────

const W = 700
const H = 220
const PAD_X = 50
const TOP = 30
const BASE = 150

function WeekChart({ week, t, tag }: { week: WeekDay[]; t: HoroscopeCopy; tag: string }) {
  const x = (i: number) => PAD_X + (i * (W - 2 * PAD_X)) / (week.length - 1)
  const y = (score: number) => BASE - ((score - 0) / 100) * (BASE - TOP)
  const line = week.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(d.score).toFixed(1)}`).join('')
  const area = `${line}L${x(week.length - 1)} ${BASE}L${x(0)} ${BASE}Z`
  const best = week.reduce((b, d, i) => (d.score > week[b].score ? i : b), 0)

  return (
    <svg className={styles.week} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('aria.weekChart')}>
      {[25, 50, 75].map((g) => (
        <line key={g} x1={PAD_X - 20} x2={W - PAD_X + 20} y1={y(g)} y2={y(g)} className={styles.grid} />
      ))}
      {week.map((d, i) =>
        d.moonHouse === 8 ? (
          <rect key={`c${d.date}`} x={x(i) - 26} y={TOP - 14} width={52} height={BASE - TOP + 14} className={styles.chBand} rx={6} />
        ) : null,
      )}
      <path d={area} className={styles.area} />
      <path d={line} className={styles.line} />
      {week.map((d, i) => (
        <g key={d.date} data-tone={d.tone}>
          <circle cx={x(i)} cy={y(d.score)} r={i === 0 ? 7 : 5.5} className={styles.dot} />
          <text x={x(i)} y={y(d.score) - 13} className={styles.score}>
            {i === best ? '★ ' : ''}
            {d.score}
          </text>
          <text x={x(i)} y={BASE + 24} className={i === 0 ? styles.dayNow : styles.day}>
            {i === 0 ? t('deepDive.weekDayToday') : i === 1 ? t('deepDive.weekDayTomorrow') : fmtDay(d.date, tag, { weekday: 'short' })}
          </text>
          <text x={x(i)} y={BASE + 40} className={styles.date}>
            {fmtDay(d.date, tag, { day: 'numeric', month: 'short' })}
          </text>
          <text x={x(i)} y={BASE + 58} className={d.moonHouse === 8 ? styles.moonCare : styles.moon}>
            {PLANET_GLYPHS.Mo} {ordinalHouse(t, d.moonHouse)}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ── Main ─────────────────────────────────────────────────────

export interface HoroscopeDeepDiveProps {
  rashi: Rashi
  english: string
  week: WeekDay[]
  chandrashtama: { rashi: Rashi; start: string; end: string } | null
  profile: RashiProfile | null
  now: number
}

export async function HoroscopeDeepDive({ rashi, english, week, chandrashtama, profile, now }: HoroscopeDeepDiveProps) {
  const t = await getTranslations('horoscope')
  const locale = await pageLocale()
  const tag = intlTag(locale)
  const sa = RASHI_SANSKRIT[rashi]
  const best = week.length ? week.reduce((b, d) => (d.score > b.score ? d : b), week[0]) : null
  const chActive = chandrashtama ? Date.parse(chandrashtama.start) <= now : false

  return (
    <section className={styles.dive} aria-label={t('aria.deepDive', { english })}>
      {week.length > 1 ? (
        <div className={styles.block}>
          <h2 className={styles.title}>
            {t('deepDive.weekTitle')} <em>{t('deepDive.weekTitleEm', { sanskrit: sa })}</em>
          </h2>
          <WeekChart week={week} t={t} tag={tag} />
          <p className={styles.caption}>
            {best ? (
              <>
                {t('deepDive.weekCaptionBest', {
                  day: fmtDay(best.date, tag, { weekday: 'long', day: 'numeric', month: 'short' }),
                  score: best.score,
                  headline: best.headline.toLowerCase(),
                })}{' '}
              </>
            ) : null}
            {t('deepDive.weekCaptionTail', { sanskrit: sa })}
          </p>
        </div>
      ) : null}

      <div className={styles.split}>
        {chandrashtama ? (
          <div className={styles.block}>
            <h2 className={styles.title}>
              {t('deepDive.chandraTitle')}{' '}
              <em>{t(chActive ? 'deepDive.chandraTitleNow' : 'deepDive.chandraTitleNext')}</em>
            </h2>
            <div className={styles.ch} data-active={chActive || undefined}>
              <RashiIcon rashi={chandrashtama.rashi} size={44} className={styles.chIcon} />
              <div>
                <p className={styles.chWhen}>
                  {chActive
                    ? t('deepDive.chandraNow')
                    : t('deepDive.chandraWhen', {
                        start: fmtWhen(chandrashtama.start, tag),
                        end: fmtWhen(chandrashtama.end, tag),
                      })}
                </p>
                <p className={styles.chText}>
                  {t('deepDive.chandraText', {
                    transitRashi: RASHI_SANSKRIT[chandrashtama.rashi],
                    sanskrit: sa,
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {profile ? (
          <div className={styles.block}>
            <h2 className={styles.title}>
              {t('deepDive.swabhavTitle')} <em>{t('deepDive.swabhavTitleEm', { sanskrit: sa })}</em>
            </h2>
            <p className={styles.lead}>{profile.coreSummary}</p>
            <ul className={styles.list}>
              {profile.coreNature.slice(0, 4).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <p className={styles.lord}>
              <strong>
                {t('deepDive.lordLine', { lord: planetName(t, profile.lord), lordHindi: profile.lordHindi })}
              </strong>{' '}
              {profile.lordSummary}
            </p>
            {profile.remedies.length > 0 ? (
              <>
                <h3 className={styles.sub}>{t('deepDive.upayaFor', { sanskrit: sa })}</h3>
                <ul className={styles.list}>
                  {profile.remedies.slice(0, 3).map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
