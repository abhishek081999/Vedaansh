'use client'

import React, { useMemo } from 'react'
import type { ChartOutput } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import {
  analyzeTransitMoment,
  type MomentLabel,
  type PositionVerdict,
} from '@/lib/engine/transitMomentAnalysis'
import styles from './transit-scrubber.module.css'

const LABEL_STYLE: Record<MomentLabel, { bg: string; border: string; color: string }> = {
  Excellent: { bg: 'rgba(78,205,196,0.12)', border: 'rgba(78,205,196,0.35)', color: 'var(--teal)' },
  Good:      { bg: 'rgba(78,205,196,0.08)', border: 'rgba(78,205,196,0.25)', color: 'var(--teal)' },
  Neutral:   { bg: 'var(--surface-2)', border: 'var(--border-soft)', color: 'var(--text-muted)' },
  Challenging: { bg: 'rgba(224,123,142,0.08)', border: 'rgba(224,123,142,0.25)', color: 'var(--rose)' },
  Avoid:     { bg: 'rgba(224,123,142,0.12)', border: 'rgba(224,123,142,0.35)', color: 'var(--rose)' },
}

const VERDICT_STYLE: Record<PositionVerdict, { label: string; className: string }> = {
  good:    { label: 'Favorable', className: styles.verdictGood },
  mixed:   { label: 'Mixed', className: styles.verdictMixed },
  caution: { label: 'Caution', className: styles.verdictCaution },
}

function VerdictBadge({ verdict }: { verdict: PositionVerdict }) {
  const v = VERDICT_STYLE[verdict]
  return <span className={`${styles.verdictBadge} ${v.className}`}>{v.label}</span>
}

interface TransitInsightsPanelsProps {
  natalChart: ChartOutput
  transitChart: ChartOutput | null
}

export function TransitInsightsPanels({ natalChart, transitChart }: TransitInsightsPanelsProps) {
  const analysis = useMemo(() => {
    if (!transitChart) return null
    return analyzeTransitMoment(natalChart, transitChart)
  }, [natalChart, transitChart])

  if (!analysis) {
    return (
      <div className={styles.insightsSection}>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Scrub date and time to generate good/bad time analysis and predictions.
        </p>
      </div>
    )
  }

  const ls = LABEL_STYLE[analysis.label]

  return (
    <section className={styles.insightsSection}>
      {/* Moment verdict */}
      <div
        className={styles.momentBanner}
        style={{ background: ls.bg, borderColor: ls.border }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              This moment
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: ls.color }}>
                {analysis.label === 'Excellent' || analysis.label === 'Good' ? 'Good time' : analysis.label === 'Avoid' || analysis.label === 'Challenging' ? 'Caution time' : 'Mixed time'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Score {analysis.score}/100
              </span>
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 640 }}>
              {analysis.summary}
            </p>
          </div>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: `3px solid ${ls.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: ls.color,
              flexShrink: 0,
            }}
          >
            {analysis.score}
          </div>
        </div>
      </div>

      {/* Good / caution columns */}
      <div className={styles.factorsGrid}>
        <div className={`${styles.factorsCard} ${styles.factorsGood}`}>
          <h4 className={styles.factorsTitle}>Supportive factors</h4>
          {analysis.goodFactors.length > 0 ? (
            <ul className={styles.factorsList}>
              {analysis.goodFactors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.factorsEmpty}>No strong supportive factors at this exact moment.</p>
          )}
        </div>
        <div className={`${styles.factorsCard} ${styles.factorsCaution}`}>
          <h4 className={styles.factorsTitle}>Caution factors</h4>
          {analysis.cautionFactors.length > 0 ? (
            <ul className={styles.factorsList}>
              {analysis.cautionFactors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.factorsEmpty}>No major caution flags detected.</p>
          )}
        </div>
      </div>

      {/* Per-planet predictions */}
      <div className={styles.predictionsBlock}>
        <h3 className={styles.compareTitle}>Planet-by-planet predictions</h3>
        <div className={styles.planetGrid}>
          {analysis.planets.map(p => (
            <article key={p.planetId} className={styles.planetCard}>
              <div className={styles.planetCardHeader}>
                <span className={styles.planetCardName}>
                  {GRAHA_NAMES[p.planetId]}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.3rem' }}>({p.planetId})</span>
                  {p.isRetro && <span className={styles.retroMark}> ℞</span>}
                </span>
                <VerdictBadge verdict={p.transitVerdict} />
              </div>
              <div className={styles.planetCardMeta}>
                <span>Natal H{p.natalHouse} · {p.natalDignity}</span>
                <span>→</span>
                <span>Transit H{p.transitHouse} · {p.transitDignity}</span>
              </div>
              <p className={styles.planetPrediction}>{p.prediction}</p>
              <p className={styles.planetDetail}>{p.detail}</p>
              <div className={styles.planetVerdictRow}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Natal position</span>
                <VerdictBadge verdict={p.natalVerdict} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
