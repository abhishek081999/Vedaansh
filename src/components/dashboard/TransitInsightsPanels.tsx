'use client'

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  analyzeTransitMoment,
  type MomentLabel,
  type PlanetMomentAnalysis,
  type PositionVerdict,
} from '@/lib/engine/transitMomentAnalysis'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { dignityHi } from '@/lib/engine/locale/planetsA.util'
import { ClassicalNotesList } from '@/components/ui/ClassicalNotesList'
import styles from './transit-scrubber.module.css'

const LABEL_STYLE: Record<MomentLabel, { bg: string; border: string; color: string }> = {
  Excellent: { bg: 'rgba(78,205,196,0.12)', border: 'rgba(78,205,196,0.35)', color: 'var(--teal)' },
  Good:      { bg: 'rgba(78,205,196,0.08)', border: 'rgba(78,205,196,0.25)', color: 'var(--teal)' },
  Neutral:   { bg: 'var(--surface-2)', border: 'var(--border-soft)', color: 'var(--text-muted)' },
  Challenging: { bg: 'rgba(224,123,142,0.08)', border: 'rgba(224,123,142,0.25)', color: 'var(--rose)' },
  Avoid:     { bg: 'rgba(224,123,142,0.12)', border: 'rgba(224,123,142,0.35)', color: 'var(--rose)' },
}

const VERDICT_CLASS: Record<PositionVerdict, string> = {
  good: styles.verdictGood,
  mixed: styles.verdictMixed,
  caution: styles.verdictCaution,
}

function momentTimeKey(label: MomentLabel): 'good' | 'mixed' | 'caution' {
  if (label === 'Excellent' || label === 'Good') return 'good'
  if (label === 'Avoid' || label === 'Challenging') return 'caution'
  return 'mixed'
}

function VerdictBadge({ verdict }: { verdict: PositionVerdict }) {
  const t = useTranslations('transit.scrubber.insights')
  return <span className={`${styles.verdictBadge} ${VERDICT_CLASS[verdict]}`}>{t(`verdict.${verdict}`)}</span>
}

function PlanetInterpCard({ p }: { p: PlanetMomentAnalysis }) {
  const t = useTranslations('transit.scrubber.insights')
  const { hi } = useLang()
  const [open, setOpen] = useState(false)
  const hasClassical =
    p.houseClassical.length > 0 || p.signClassical.length > 0 || p.dignityClassical.length > 0
  const graha = hi ? (GRAHA_HI[p.planetId] ?? p.planetId) : (GRAHA_NAMES[p.planetId] ?? p.planetId)
  const rashi = hi ? RASHI_HI[p.transitRashi] : RASHI_NAMES[p.transitRashi]
  const dignity = (d: string) => (hi ? dignityHi(d) : d)

  return (
    <article className={styles.planetCard}>
      <div className={styles.planetCardHeader}>
        <span className={styles.planetCardName}>
          {graha}
          <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.3rem' }}>({p.planetId})</span>
          {p.isRetro && <span className={styles.retroMark}> ℞</span>}
        </span>
        <VerdictBadge verdict={p.transitVerdict} />
      </div>
      <div className={styles.planetCardMeta}>
        <span>{t('natalMeta', { house: p.natalHouse, dignity: dignity(p.natalDignity) })}</span>
        <span>→</span>
        <span>{t('gocharMeta', { house: p.transitHouse, rashi, dignity: dignity(p.transitDignity) })}</span>
      </div>
      <p className={styles.planetPrediction}>{p.prediction}</p>
      {p.teachingSummary ? (
        <p className={styles.planetTeaching}>
          <span className={styles.planetTeachingLabel}>{t('teaching')}</span>
          {p.teachingSummary}
        </p>
      ) : null}
      <p className={styles.planetDetail}>{p.detail}</p>
      <div className={styles.planetVerdictRow}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t('natalPosition')}</span>
        <VerdictBadge verdict={p.natalVerdict} />
      </div>
      {hasClassical ? (
        <div className={styles.planetClassicalBlock}>
          <button
            type="button"
            className={styles.planetClassicalToggle}
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
          >
            {open ? t('hideClassical') : t('showClassical')}
          </button>
          {open ? (
            <div className={styles.planetClassicalBody}>
              <ClassicalNotesList
                title={t('classicalHouse', { graha, house: p.transitHouse })}
                notes={p.houseClassical}
              />
              <ClassicalNotesList
                title={t('classicalSign', { graha, rashi })}
                notes={p.signClassical}
              />
              <ClassicalNotesList title={t('classicalDignity')} notes={p.dignityClassical} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

interface TransitInsightsPanelsProps {
  natalChart: ChartOutput
  transitChart: ChartOutput | null
}

export function TransitInsightsPanels({ natalChart, transitChart }: TransitInsightsPanelsProps) {
  const t = useTranslations('transit.scrubber.insights')
  const { lang } = useLang()
  const analysis = useMemo(() => {
    if (!transitChart) return null
    return analyzeTransitMoment(natalChart, transitChart, lang)
  }, [natalChart, transitChart, lang])

  if (!analysis) {
    return (
      <div className={styles.insightsSection}>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('empty')}
        </p>
      </div>
    )
  }

  const ls = LABEL_STYLE[analysis.label]

  return (
    <section className={styles.insightsSection}>
      <div
        className={styles.momentBanner}
        style={{ background: ls.bg, borderColor: ls.border }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              {t('thisMoment')}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: ls.color }}>
                {t(`time.${momentTimeKey(analysis.label)}`)}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {t('score', { score: analysis.score })}
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

      <div className={styles.factorsGrid}>
        <div className={`${styles.factorsCard} ${styles.factorsGood}`}>
          <h4 className={styles.factorsTitle}>{t('supportive')}</h4>
          {analysis.goodFactors.length > 0 ? (
            <ul className={styles.factorsList}>
              {analysis.goodFactors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.factorsEmpty}>{t('supportiveEmpty')}</p>
          )}
        </div>
        <div className={`${styles.factorsCard} ${styles.factorsCaution}`}>
          <h4 className={styles.factorsTitle}>{t('caution')}</h4>
          {analysis.cautionFactors.length > 0 ? (
            <ul className={styles.factorsList}>
              {analysis.cautionFactors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.factorsEmpty}>{t('cautionEmpty')}</p>
          )}
        </div>
      </div>

      <div className={styles.predictionsBlock}>
        <h3 className={styles.compareTitle}>{t('planetsTitle')}</h3>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {t('planetsHint')}
        </p>
        <div className={styles.planetGrid}>
          {analysis.planets.map(p => (
            <PlanetInterpCard key={p.planetId} p={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
