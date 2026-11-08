'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/panchang/PanchangDayWindows.tsx
//  Favourable and avoid windows, plotted on a dawn-to-sunset rail and listed
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import styles from './PanchangDayWindows.module.css'

interface TimeWindow {
  start: string
  end: string
}

interface Props {
  sunrise: string
  sunset: string
  tz: string
  abhijit?: TimeWindow | null
  brahma?: TimeWindow
  godhuli?: TimeWindow
  rahu: TimeWindow
  gulika: TimeWindow
  yamaganda: TimeWindow
  durMuhurat?: TimeWindow[]
}

type Tone = 'good' | 'bad' | 'caution'

interface WindowItem extends TimeWindow {
  key: string
  label: string
  short: string
  tone: Tone
  startMs: number
  endMs: number
}

/** Below this % of the rail, a segment is too narrow to carry its name. */
const MIN_SEGMENT_LABEL_PCT = 8

const TONE_CLASS: Record<Tone, string> = {
  good: styles.toneGood,
  bad: styles.toneBad,
  caution: styles.toneCaution,
}

function fmtTime(ms: number, tz: string, tag = 'en-IN'): string {
  return new Intl.DateTimeFormat(tag, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ms))
}

function toItem(key: string, label: string, short: string, tone: Tone, w: TimeWindow): WindowItem {
  return {
    ...w,
    key,
    label,
    short,
    tone,
    startMs: new Date(w.start).getTime(),
    endMs: new Date(w.end).getTime(),
  }
}

export function PanchangDayWindows({
  sunrise,
  sunset,
  tz,
  abhijit,
  brahma,
  godhuli,
  rahu,
  gulika,
  yamaganda,
  durMuhurat,
}: Props) {
  const [now, setNow] = useState(() => Date.now())
  const t = useTranslations('panchang.windows')
  const { tag } = useLang()

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const { good, avoid } = useMemo(() => {
    const goodItems = [
      brahma && toItem('brahma', t('brahma'), t('brahmaShort'), 'good', brahma),
      abhijit && toItem('abhijit', t('abhijit'), t('abhijitShort'), 'good', abhijit),
      godhuli && toItem('godhuli', t('godhuli'), t('godhuliShort'), 'good', godhuli),
    ].filter((w): w is WindowItem => Boolean(w))
    const avoidItems = [
      toItem('rahu', t('rahu'), t('rahuShort'), 'bad', rahu),
      toItem('gulika', t('gulika'), t('gulikaShort'), 'bad', gulika),
      toItem('yamaganda', t('yamaganda'), t('yamagandaShort'), 'caution', yamaganda),
      ...(durMuhurat ?? []).map((w, i) => toItem(`dur-${i}`, t('dur'), t('durShort'), 'bad', w)),
    ]
    const byStart = (a: WindowItem, b: WindowItem) => a.startMs - b.startMs
    return { good: goodItems.sort(byStart), avoid: avoidItems.sort(byStart) }
  }, [abhijit, brahma, godhuli, rahu, gulika, yamaganda, durMuhurat, t])

  const sunriseMs = new Date(sunrise).getTime()
  const sunsetMs = new Date(sunset).getTime()
  const railStart = Math.min(sunriseMs, ...good.map((w) => w.startMs))
  const railSpan = Math.max(1, sunsetMs - railStart)
  const pct = (ms: number) => Math.max(0, Math.min(100, ((ms - railStart) / railSpan) * 100))
  const nowOnRail = now >= railStart && now <= sunsetMs

  const lanes: Array<{ title: string; items: WindowItem[] }> = [
    { title: t('favourable'), items: good },
    { title: t('avoid'), items: avoid },
  ]

  return (
    <div className={styles.root}>
      {/* The lists below carry the same information for assistive tech */}
      <div className={styles.rail} aria-hidden>
        <div className={styles.railScale}>
          <span className={styles.scaleMark} style={{ left: `${pct(sunriseMs)}%` }}>
            {t('sunriseAt', { time: fmtTime(sunriseMs, tz, tag) })}
          </span>
          <span className={`${styles.scaleMark} ${styles.scaleMarkEnd}`} style={{ left: '100%' }}>
            {t('sunsetAt', { time: fmtTime(sunsetMs, tz, tag) })}
          </span>
        </div>
        {lanes.map((lane) => (
          <div key={lane.title} className={styles.lane}>
            <span className={styles.laneLabel}>{lane.title}</span>
            <div className={styles.laneTrack}>
              <span className={styles.preDawn} style={{ width: `${pct(sunriseMs)}%` }} />
              {lane.items.map((w) => {
                const left = pct(w.startMs)
                const width = Math.max(0.6, pct(w.endMs) - left)
                return (
                  <span
                    key={w.key}
                    className={`${styles.segment} ${TONE_CLASS[w.tone]}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${w.label} · ${fmtTime(w.startMs, tz, tag)} – ${fmtTime(w.endMs, tz, tag)}`}
                  >
                    {width >= MIN_SEGMENT_LABEL_PCT && <span className={styles.segmentName}>{w.short}</span>}
                  </span>
                )
              })}
              {nowOnRail && <span className={styles.nowLine} style={{ left: `${pct(now)}%` }} />}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.lists}>
        <WindowList title={t('favourable')} icon={<CircleCheck size={15} aria-hidden />} items={good} tz={tz} now={now} toneClass={styles.toneTextGood} />
        <WindowList title={t('avoid')} icon={<TriangleAlert size={15} aria-hidden />} items={avoid} tz={tz} now={now} toneClass={styles.toneTextBad} />
      </div>
    </div>
  )
}

interface WindowListProps {
  title: string
  icon: React.ReactNode
  items: WindowItem[]
  tz: string
  now: number
  toneClass: string
}

function WindowList({ title, icon, items, tz, now, toneClass }: WindowListProps) {
  const t = useTranslations('panchang.windows')
  const { tag } = useLang()
  return (
    <div className={styles.list}>
      <h3 className={`${styles.listTitle} ${toneClass}`}>{icon}{title}</h3>
      <ul className={styles.listRows}>
        {items.map((w) => {
          const active = now >= w.startMs && now <= w.endMs
          return (
            <li key={w.key} className={`${styles.row} ${active ? styles.rowActive : ''}`}>
              <span className={`${styles.swatch} ${TONE_CLASS[w.tone]}`} aria-hidden />
              <span className={styles.rowName}>
                {w.label}
                {active && <span className={styles.nowBadge}>{t('now')}</span>}
              </span>
              <span className={styles.rowTime}>
                {fmtTime(w.startMs, tz, tag)} – {fmtTime(w.endMs, tz, tag)}
              </span>
              <span className={styles.rowDuration}>{t('min', { n: Math.round((w.endMs - w.startMs) / 60_000) })}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
