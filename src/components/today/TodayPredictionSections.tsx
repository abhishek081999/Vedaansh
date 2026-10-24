'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/today/TodayPredictionSections.tsx
//  Presentational cards for the house-by-house predictions
//  (no data fetching). Engine: src/lib/engine/todayPredictions.ts
// ─────────────────────────────────────────────────────────────

import React from 'react'
import type { Confidence, Tone as PredTone, TodayPredictions } from '@/lib/engine/todayPredictions'
import { fmtWhen, toned } from './TodayReadingSections'
import styles from './today-reading.module.css'

type UiTone = 'good' | 'mixed' | 'caution'

const TONE: Record<PredTone, UiTone> = { favourable: 'good', mixed: 'mixed', challenging: 'caution' }
const TONE_LABEL: Record<PredTone, string> = { favourable: 'Favourable', mixed: 'Mixed', challenging: 'Challenging' }
const CONF_LABEL: Record<Confidence, string> = {
  high: 'High confidence',
  moderate: 'Moderate confidence',
  low: 'Light indication',
}

export function PredictionsCard({ p, tz }: { p: TodayPredictions; tz: string }) {
  return (
    <section className={styles.card} aria-label="What to expect today">
      <h2 className={styles.cardTitle}>What to expect today</h2>

      {p.phases.length > 0 && (
        <div className={styles.phases}>
          {p.phases.map(ph => (
            <div key={ph.label} className={styles.phase} style={toned(TONE[ph.tone])}>
              <span className={styles.phaseHead}>
                <span className={styles.dot} />
                {ph.label}
                {ph.untilIso ? ` · until ~${fmtWhen(ph.untilIso, tz)}` : ''}
              </span>
              <span className={styles.phaseTitle}>Moon in {ph.rashiName} · {ph.areaTitle}</span>
              <span className={styles.kvNote} style={{ gridColumn: 'auto' }}>{ph.text}</span>
            </div>
          ))}
        </div>
      )}

      {p.predictions.length === 0 && (
        <p className={styles.note}>No single area stands out strongly today; it is a quiet day astrologically.</p>
      )}

      {p.predictions.map(item => (
        <article key={item.house} className={styles.predItem} style={toned(TONE[item.tone])}>
          <header className={styles.predHead}>
            <h3 className={styles.predTitle}>{item.title}</h3>
            <span className={styles.badge}>{TONE_LABEL[item.tone]}</span>
            <span className={styles.predConf}>{CONF_LABEL[item.confidence]}</span>
          </header>
          <p className={styles.predText}>{item.text}</p>
          <ul className={styles.because}>
            {item.because.map(b => <li key={b}>{b}</li>)}
          </ul>
        </article>
      ))}

      {p.yogaNotes.length > 0 && (
        <div className={styles.phase} style={toned('good')}>
          <span className={styles.phaseHead}><span className={styles.dot} />Natal yoga in play</span>
          {p.yogaNotes.map(n => <span key={n} className={styles.kvNote} style={{ gridColumn: 'auto' }}>{n}</span>)}
        </div>
      )}

      <p className={styles.note}>
        Each house is read from your birth chart (Ashtakavarga bindus, Shadbala of its lord, Bhava Bala) against today&apos;s transits, drishti and your running dasha. These are tendencies, not fixed events.
      </p>
    </section>
  )
}

/** House-by-house map for today, as a compact tab panel. */
export function HouseMapPanel({ p }: { p: TodayPredictions }) {
  return (
    <div className={styles.panelBody}>
      {p.houses.map(h => {
        const tone: UiTone = h.verdict === 'Quiet' ? 'mixed' : TONE[h.tone]
        return (
          <div key={h.house} className={styles.kv} style={toned(tone)}>
            <span className={styles.kvKey}>House {h.house}</span>
            <span className={styles.kvVal}>
              <span className={styles.badge}>{h.verdict}</span>
              <span className={styles.mono}>{h.score}</span>
              <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{h.rashiName} · natal {h.promise}</span>
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
