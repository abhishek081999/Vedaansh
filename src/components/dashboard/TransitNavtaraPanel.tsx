'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/TransitNavtaraPanel.tsx
//  Navtara at scrubbed transit moment — gochara taras + dasha match
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
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
  const prediction = useMemo(
    () => getNavtaraPrediction(natalChart, asOf),
    [natalChart, asOf],
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
    )
  }, [transitChart, prediction.birthNakshatraIndex, activeLords, asOf])

  const moonBooking = useMemo(() => {
    if (!gochara?.moonTara) return null
    return checkMuhurtaNavtara(
      prediction.birthNakshatraIndex,
      gochara.moonTara.nakshatraIndex,
      'this transit moment',
    )
  }, [gochara?.moonTara, prediction.birthNakshatraIndex])

  if (!transitChart || !gochara) {
    return (
      <section className={styles.insightsSection}>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Scrub date and time to read Navtara gochara at that moment.
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
    <section className={styles.insightsSection} aria-label="Navtara at this transit moment">
      <div className={styles.momentBanner} style={{ background: tone.bg, borderColor: tone.border }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <div className={styles.momentLabel}>Navtara · dasha window</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: tone.color, marginTop: 2 }}>
              {maha ? `${maha.tara} · ${maha.lordName} MD` : 'Dasha unavailable'}
              {antar ? ` / ${antar.tara} · ${antar.lordName} AD` : ''}
            </div>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              From {prediction.birthNakshatraName}. {prediction.current.synthesis}
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
            {prediction.current.experienceTone}
          </span>
        </div>
        <p style={{ margin: '0.65rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          <strong style={{ color: 'var(--text-gold)' }}>Decide:</strong> {prediction.current.decisionAdvice}
        </p>
      </div>

      {moonBooking && (
        <div
          className={styles.navtaraMoonCard}
          style={{ background: bookingTone.bg, borderColor: bookingTone.border }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div>
              <div className={styles.momentLabel}>Transit Moon tara</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: bookingTone.color }}>
                {gochara.moonTara?.nakshatraName} → {moonBooking.tara}
              </div>
            </div>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: bookingTone.color }}>
              {moonBooking.verdict}
            </span>
          </div>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {moonBooking.advice}
          </p>
        </div>
      )}

      <div className={styles.factorsGrid}>
        <div className={`${styles.factorsCard} ${styles.factorsGood}`}>
          <h4 className={styles.factorsTitle}>Event candidates (dasha + gochara)</h4>
          {gochara.activeEventCandidates.length > 0 ? (
            <ul className={styles.factorsList}>
              {gochara.activeEventCandidates.map(p => (
                <li key={p.grahaId}>
                  <strong>{p.grahaName}</strong> in {p.nakshatraName} → {p.tara}
                  {p.isRetro ? ' ℞' : ''} — can materialize with running dasha
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.factorsEmpty}>
              No dasha-matched transit lords — gochara is energy/tone only at this moment.
            </p>
          )}
        </div>
        <div className={`${styles.factorsCard} ${styles.factorsCaution}`}>
          <h4 className={styles.factorsTitle}>Hard tara transits</h4>
          {gochara.hardTransits.length > 0 ? (
            <ul className={styles.factorsList}>
              {gochara.hardTransits.map(p => (
                <li key={p.grahaId}>
                  <strong>{p.grahaName}</strong> · {p.tara} ({p.profile.shortLabel})
                  {p.dashaActive ? ' · dasha active' : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.factorsEmpty}>No Vipat / Pratyari / Vadha transit planets right now.</p>
          )}
        </div>
      </div>

      <div className={styles.predictionsBlock}>
        <h3 className={styles.compareTitle}>Gochara by Navtara</h3>
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
                    {GRAHA_NAMES[p.grahaId] ?? p.grahaName}
                    {p.isRetro && <span className={styles.retroMark}> ℞</span>}
                  </span>
                  <span
                    className={`${styles.verdictBadge} ${
                      p.eventLikelihood === 'active' ? styles.verdictGood : styles.verdictMixed
                    }`}
                  >
                    {p.eventLikelihood === 'active' ? 'Active' : 'Energy'}
                  </span>
                </div>
                <div className={styles.planetCardMeta}>
                  <span>{p.nakshatraName}</span>
                  <span>→</span>
                  <span style={{ color: hard ? 'var(--rose)' : 'var(--teal)', fontWeight: 600 }}>
                    {p.taraNumber}. {p.tara}
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
