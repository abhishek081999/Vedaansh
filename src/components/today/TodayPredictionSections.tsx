'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/today/TodayPredictionSections.tsx
//  Presentational cards for the house-by-house predictions
//  (no data fetching). Engine: src/lib/engine/todayPredictions.ts
// ─────────────────────────────────────────────────────────────

import React from 'react'
import type { Confidence, Tone as PredTone, TodayPredictions } from '@/lib/engine/todayPredictions'
import { toned, useTodayFmt } from './TodayReadingSections'
import { useTranslations } from 'next-intl'
import styles from './today-reading.module.css'

type UiTone = 'good' | 'mixed' | 'caution'

const TONE: Record<PredTone, UiTone> = { favourable: 'good', mixed: 'mixed', challenging: 'caution' }
export function PredictionsCard({ p, tz }: { p: TodayPredictions; tz: string }) {
  const t = useTranslations('today.predictions')
  const fm = useTodayFmt()
  return (
    <section className={styles.card} aria-label={t('aria')}>
      <h2 className={styles.cardTitle}>{t('title')}</h2>

      {p.phases.length > 0 && (
        <div className={styles.phases}>
          {p.phases.map(ph => (
            <div key={ph.label} className={styles.phase} style={toned(TONE[ph.tone])}>
              <span className={styles.phaseHead}>
                <span className={styles.dot} />
                {ph.label}
                {ph.untilIso ? t('until', { when: fm.when(ph.untilIso, tz) }) : ''}
              </span>
              <span className={styles.phaseTitle}>{t('moonIn', { rashi: ph.rashiName, area: ph.areaTitle })}</span>
              <span className={styles.kvNote} style={{ gridColumn: 'auto' }}>{ph.text}</span>
            </div>
          ))}
        </div>
      )}

      {p.predictions.length === 0 && (
        <p className={styles.note}>{t('quiet')}</p>
      )}

      {p.predictions.map(item => (
        <article key={item.house} className={styles.predItem} style={toned(TONE[item.tone])}>
          <header className={styles.predHead}>
            <h3 className={styles.predTitle}>{item.title}</h3>
            <span className={styles.badge}>{t(`tone.${item.tone as PredTone}`)}</span>
            <span className={styles.predConf}>{t(`conf.${item.confidence as Confidence}`)}</span>
          </header>
          <p className={styles.predText}>{item.text}</p>
          <ul className={styles.because}>
            {item.because.map(b => <li key={b}>{b}</li>)}
          </ul>
        </article>
      ))}

      {p.yogaNotes.length > 0 && (
        <div className={styles.phase} style={toned('good')}>
          <span className={styles.phaseHead}><span className={styles.dot} />{t('yoga')}</span>
          {p.yogaNotes.map(n => <span key={n} className={styles.kvNote} style={{ gridColumn: 'auto' }}>{n}</span>)}
        </div>
      )}

      <p className={styles.note}>
        {t('note')}
      </p>
    </section>
  )
}

/** House-by-house map for today, as a compact tab panel. */
export function HouseMapPanel({ p }: { p: TodayPredictions }) {
  const t = useTranslations('today.predictions')
  return (
    <div className={styles.panelBody}>
      {p.houses.map(h => {
        const tone: UiTone = h.verdict === 'Quiet' ? 'mixed' : TONE[h.tone]
        return (
          <div key={h.house} className={styles.kv} style={toned(tone)}>
            <span className={styles.kvKey}>{t('house', { n: h.house })}</span>
            <span className={styles.kvVal}>
              <span className={styles.badge}>{h.verdictLabel}</span>
              <span className={styles.mono}>{h.score}</span>
              <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{t('natalPromise', { rashi: h.rashiName, promise: t(`promise.${h.promise}`) })}</span>
            </span>
            <span className={styles.kvNote}>
              {h.areaTitle}
              {h.influences.slice(0, 2).map(i => <span key={i.text} className={styles.windowNote}>{i.text}</span>)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
