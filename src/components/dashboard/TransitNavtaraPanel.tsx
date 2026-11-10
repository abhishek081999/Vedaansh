'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/TransitNavtaraPanel.tsx
//  Navtara at scrubbed transit moment — gochara taras + dasha match
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import {
  buildGocharaNavtaraReport,
  checkMuhurtaNavtara,
  getNavtaraPrediction,
  type TaraTone,
} from '@/lib/engine/navtaraPrediction'
import styles from './transit-scrubber.module.css'

const TONE: Record<TaraTone, { color: string; bg: string; border: string }> = {
  supportive:     { color: 'var(--teal)',  bg: 'rgba(78,205,196,0.08)',  border: 'rgba(78,205,196,0.3)' },
  challenging:    { color: 'var(--rose)',  bg: 'rgba(224,123,142,0.08)', border: 'rgba(224,123,142,0.3)' },
  neutral:        { color: 'var(--amber)', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.3)' },
  transformative: { color: 'var(--gold)',  bg: 'rgba(201,168,76,0.1)',   border: 'rgba(201,168,76,0.35)' },
}

interface TransitNavtaraPanelProps {
  natalChart: ChartOutput
  transitChart: ChartOutput | null
  asOf: Date
}

export function TransitNavtaraPanel({ natalChart, transitChart, asOf }: TransitNavtaraPanelProps) {
  const t = useTranslations('transit.scrubber.navtara')
  const { lang, hi } = useLang()
  const prediction = useMemo(
    () => getNavtaraPrediction(natalChart, asOf, lang),
    [natalChart, asOf, lang],
  )

  const activeLords = useMemo(() => {
    const vim = natalChart.dashas?.vimshottari ?? []
    return getDashaPathAt(vim, asOf.getTime()).map(n => n.lord as GrahaId)
  }, [natalChart.dashas?.vimshottari, asOf])

  const gochara = useMemo(() => {
    if (!transitChart) return null
    const dateStr = asOf.toISOString().slice(0, 10)
    return buildGocharaNavtaraReport(
      prediction.birthNakshatraIndex,
      transitChart.grahas.map(g => ({
        id: g.id,
        name: g.name,
        nakshatraIndex: g.nakshatraIndex,
        nakshatraName: g.nakshatraName,
        isRetro: g.isRetro,
      })),
      activeLords,
      dateStr,
      lang,
    )
  }, [transitChart, prediction.birthNakshatraIndex, activeLords, asOf, lang])

  const moonBooking = useMemo(() => {
    if (!gochara?.moonTara) return null
    return checkMuhurtaNavtara(
      prediction.birthNakshatraIndex,
      gochara.moonTara.nakshatraIndex,
      t('activity'),
      lang,
    )
  }, [gochara?.moonTara, prediction.birthNakshatraIndex, lang, t])

  const taraName = (name: string, hindi?: string) => (hi && hindi ? hindi : name)

  if (!transitChart || !gochara) {
    return (
      <section className={styles.insightsSection}>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {t('empty')}
        </p>
      </section>
    )
  }

  const maha = prediction.current.maha
  const antar = prediction.current.antar
  const tone = TONE[prediction.current.experienceTone]
  const bookingTone = moonBooking?.isHardTara
    ? TONE.challenging
    : moonBooking?.verdict === 'caution'
      ? TONE.neutral
      : TONE.supportive

  return (
    <section className={styles.insightsSection} aria-label={t('aria')}>
      <div className={styles.momentBanner} style={{ background: tone.bg, borderColor: tone.border }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <div className={styles.momentLabel}>{t('window')}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: tone.color, marginTop: 2 }}>
              {maha ? `${taraName(maha.tara, maha.profile.hindi)} · ${maha.lordName} ${t('md')}` : t('dashaUnavailable')}
              {antar ? ` / ${taraName(antar.tara, antar.profile.hindi)} · ${antar.lordName} ${t('ad')}` : ''}
            </div>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('fromBirth', { nak: prediction.birthNakshatraName, synthesis: prediction.current.synthesis })}
            </p>
          </div>
          <span
            style={{
              fontSize: '0.58rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 8px',
              borderRadius: 4,
              border: `1px solid ${tone.border}`,
              color: tone.color,
              background: 'var(--surface-1)',
              flexShrink: 0,
            }}
          >
            {t(`tone.${prediction.current.experienceTone}`)}
          </span>
        </div>
        <p style={{ margin: '0.65rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          <strong style={{ color: 'var(--text-gold)' }}>{t('decide')}</strong> {prediction.current.decisionAdvice}
        </p>
      </div>

      {moonBooking && (
        <div
          className={styles.navtaraMoonCard}
          style={{ background: bookingTone.bg, borderColor: bookingTone.border }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div>
              <div className={styles.momentLabel}>{t('moonTitle')}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: bookingTone.color }}>
                {gochara.moonTara?.nakshatraName} → {taraName(moonBooking.tara, moonBooking.profile.hindi)}
              </div>
            </div>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: bookingTone.color }}>
              {t(`verdict.${moonBooking.verdict}`)}
            </span>
          </div>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {moonBooking.advice}
          </p>
        </div>
      )}

      <div className={styles.factorsGrid}>
        <div className={`${styles.factorsCard} ${styles.factorsGood}`}>
          <h4 className={styles.factorsTitle}>{t('candidatesTitle')}</h4>
          {gochara.activeEventCandidates.length > 0 ? (
            <ul className={styles.factorsList}>
              {gochara.activeEventCandidates.map(p => (
                <li key={p.grahaId}>
                  {t.rich('candidate', {
                    graha: p.grahaName,
                    nak: p.nakshatraName,
                    tara: taraName(p.tara, p.profile.hindi),
                    retro: p.isRetro ? ' ℞' : '',
                    b: (chunks) => <strong>{chunks}</strong>,
                  })}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.factorsEmpty}>
              {t('candidatesEmpty')}
            </p>
          )}
        </div>
        <div className={`${styles.factorsCard} ${styles.factorsCaution}`}>
          <h4 className={styles.factorsTitle}>{t('hardTitle')}</h4>
          {gochara.hardTransits.length > 0 ? (
            <ul className={styles.factorsList}>
              {gochara.hardTransits.map(p => (
                <li key={p.grahaId}>
                  {t.rich('hardLine', {
                    graha: p.grahaName,
                    tara: taraName(p.tara, p.profile.hindi),
                    label: p.profile.shortLabel,
                    dasha: p.dashaActive ? t('dashaActive') : '',
                    b: (chunks) => <strong>{chunks}</strong>,
                  })}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.factorsEmpty}>{t('hardEmpty')}</p>
          )}
        </div>
      </div>

      <div className={styles.predictionsBlock}>
        <h3 className={styles.compareTitle}>{t('gocharaTitle')}</h3>
        <p style={{ margin: '0 0 0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {gochara.summary}
        </p>
        <div className={styles.planetGrid}>
          {gochara.planets.map(p => {
            const hard = p.profile.isHard
            return (
              <article
                key={p.grahaId}
                className={styles.planetCard}
                style={hard ? { borderColor: 'rgba(224,123,142,0.35)' } : undefined}
              >
                <div className={styles.planetCardHeader}>
                  <span className={styles.planetCardName}>
                    {p.grahaName}
                    {p.isRetro && <span className={styles.retroMark}> ℞</span>}
                  </span>
                  <span
                    className={`${styles.verdictBadge} ${
                      p.eventLikelihood === 'active' ? styles.verdictGood : styles.verdictMixed
                    }`}
                  >
                    {p.eventLikelihood === 'active' ? t('active') : t('energy')}
                  </span>
                </div>
                <div className={styles.planetCardMeta}>
                  <span>{p.nakshatraName}</span>
                  <span>→</span>
                  <span style={{ color: hard ? 'var(--rose)' : 'var(--teal)', fontWeight: 600 }}>
                    {p.taraNumber}. {taraName(p.tara, p.profile.hindi)}
                  </span>
                </div>
                <p className={styles.planetPrediction}>{p.profile.shortLabel}</p>
                <p className={styles.planetDetail}>{p.profile.experience}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
