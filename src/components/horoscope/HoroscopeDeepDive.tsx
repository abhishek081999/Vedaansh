// ─────────────────────────────────────────────────────────────
//  src/components/horoscope/HoroscopeDeepDive.tsx
//  Full Dainik Rashifal page extras (server-rendered):
//  Saptahik week chart · Chandrashtama window · Rashi swabhav.
// ─────────────────────────────────────────────────────────────

import type { WeekDay } from '@/lib/horoscope/daily'
import type { RashiProfile } from '@/lib/engine/rashiInterpretations'
import { RASHI_SANSKRIT, type Rashi } from '@/types/astrology'
import { RashiIcon } from './RashiIcon'
import styles from './HoroscopeDeepDive.module.css'

const TZ = 'Asia/Kolkata'
const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']
const LORD_NAMES: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
}

const fmtDay = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-IN', { ...opts, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))

const fmtWhen = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ,
  }).format(new Date(iso))

// ── Saptahik chart ───────────────────────────────────────────

const W = 700
const H = 220
const PAD_X = 50
const TOP = 30
const BASE = 150

function WeekChart({ week }: { week: WeekDay[] }) {
  const x = (i: number) => PAD_X + (i * (W - 2 * PAD_X)) / (week.length - 1)
  const y = (score: number) => BASE - ((score - 0) / 100) * (BASE - TOP)
  const line = week.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(d.score).toFixed(1)}`).join('')
  const area = `${line}L${x(week.length - 1)} ${BASE}L${x(0)} ${BASE}Z`
  const best = week.reduce((b, d, i) => (d.score > week[b].score ? i : b), 0)

  return (
    <svg className={styles.week} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Score for each of the next seven days">
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
            {i === 0 ? 'Aaj' : i === 1 ? 'Kal' : fmtDay(d.date, { weekday: 'short' })}
          </text>
          <text x={x(i)} y={BASE + 40} className={styles.date}>
            {fmtDay(d.date, { day: 'numeric', month: 'short' })}
          </text>
          <text x={x(i)} y={BASE + 58} className={d.moonHouse === 8 ? styles.moonCare : styles.moon}>
            ☽ {ORD[d.moonHouse]}
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

export function HoroscopeDeepDive({ rashi, english, week, chandrashtama, profile, now }: HoroscopeDeepDiveProps) {
  const sa = RASHI_SANSKRIT[rashi]
  const best = week.length ? week.reduce((b, d) => (d.score > b.score ? d : b), week[0]) : null
  const chActive = chandrashtama ? Date.parse(chandrashtama.start) <= now : false

  return (
    <section className={styles.dive} aria-label={`${english} deeper reading`}>
      {week.length > 1 ? (
        <div className={styles.block}>
          <h2 className={styles.title}>
            Saptahik <em>· {sa}&rsquo;s week ahead</em>
          </h2>
          <WeekChart week={week} />
          <p className={styles.caption}>
            {best ? (
              <>
                Best day: <strong>{fmtDay(best.date, { weekday: 'long', day: 'numeric', month: 'short' })}</strong> (
                {best.score}) — {best.headline.toLowerCase()}.{' '}
              </>
            ) : null}
            Shaded days are Chandrashtama. ☽ shows the Moon&rsquo;s house from {sa}.
          </p>
        </div>
      ) : null}

      <div className={styles.split}>
        {chandrashtama ? (
          <div className={styles.block}>
            <h2 className={styles.title}>
              Chandrashtama <em>· {chActive ? 'running now' : 'next window'}</em>
            </h2>
            <div className={styles.ch} data-active={chActive || undefined}>
              <RashiIcon rashi={chandrashtama.rashi} size={44} className={styles.chIcon} />
              <div>
                <p className={styles.chWhen}>
                  {chActive ? 'Now' : fmtWhen(chandrashtama.start)} → {fmtWhen(chandrashtama.end)}
                </p>
                <p className={styles.chText}>
                  The Moon moves through {RASHI_SANSKRIT[chandrashtama.rashi]}, the 8th sign from {sa}. Keep these
                  ~2½ days for routine work: avoid launches, big purchases, long drives and arguments.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {profile ? (
          <div className={styles.block}>
            <h2 className={styles.title}>
              Rashi swabhav <em>· the nature of {sa}</em>
            </h2>
            <p className={styles.lead}>{profile.coreSummary}</p>
            <ul className={styles.list}>
              {profile.coreNature.slice(0, 4).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <p className={styles.lord}>
              <strong>
                Rashi lord · {LORD_NAMES[profile.lord] ?? profile.lord} ({profile.lordHindi})
              </strong>{' '}
              {profile.lordSummary}
            </p>
            {profile.remedies.length > 0 ? (
              <>
                <h3 className={styles.sub}>Upaya for {sa}</h3>
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
