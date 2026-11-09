'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/MilanDeepAnalysisPanel.tsx
//  Stage 2–3 Kundali Milan: psychology, D1/D9, Venus–Mars, houses
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { useLang } from '@/i18n/useLang'
import { useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import type { AshtakootResult } from '@/lib/engine/ashtakoot'
import { analyzeMilanDeep } from '@/lib/engine/milanDeepAnalysis'
import { MilanDashaTimeline, MilanGunaRing } from '@/components/ui/MilanVisuals'

const TONE: Record<string, string> = {
  supportive: 'var(--teal)',
  caution: 'var(--rose)',
  mixed: 'var(--text-gold)',
}

interface Props {
  chartA: ChartOutput
  chartB: ChartOutput
  ashtakoot: AshtakootResult
}

export function MilanDeepAnalysisPanel({ chartA, chartB, ashtakoot }: Props) {
  const { lang } = useLang()
  const t = useTranslations('relationshipMarriage.compareMil.deep')
  const deep = useMemo(() => analyzeMilanDeep(chartA, chartB, lang), [chartA, chartB, lang])

  const kootas = [
    { key: 'Varna', s: ashtakoot.varna },
    { key: 'Vashya', s: ashtakoot.vashya },
    { key: 'Tara', s: ashtakoot.tara },
    { key: 'Yoni', s: ashtakoot.yoni },
    { key: 'Maitri', s: ashtakoot.maitri },
    { key: 'Gana', s: ashtakoot.gana },
    { key: 'Bhakoot', s: ashtakoot.bhakoot },
    { key: 'Nadi', s: ashtakoot.nadi },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Eligibility + disclaimer */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          borderLeft: `4px solid ${
            ashtakoot.eligibility.band === 'ideal' ? 'var(--teal)' :
            ashtakoot.eligibility.band === 'above_ideal' ? 'var(--text-gold)' : 'var(--rose)'
          }`,
        }}
      >
        <div className="label-caps" style={{ fontSize: '0.62rem', marginBottom: '0.35rem' }}>
          {t('stage1Caps')}
        </div>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.35rem' }}>
          {ashtakoot.eligibility.label}
          <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {' '}· {ashtakoot.total}/36
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {ashtakoot.eligibility.detail}
        </p>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {ashtakoot.disclaimer}
        </p>
      </div>

      <MilanGunaRing ashtakoot={ashtakoot} />

      {/* Three layers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.75rem' }}>
        {([
          [t('psychology'), ashtakoot.layers.psychology],
          [t('energy'), ashtakoot.layers.energy],
          [t('sharedPath'), ashtakoot.layers.karma],
        ] as const).map(([t, d]) => (
          <div key={t} className="card" style={{ padding: '1rem' }}>
            <div className="label-caps" style={{ fontSize: '0.6rem', color: 'var(--text-gold)' }}>{t}</div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{d}</p>
          </div>
        ))}
      </div>

      {/* Per-koota insight */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
          <h3 className="label-caps" style={{ margin: 0, fontSize: '0.72rem' }}>{t('kootaTitle')}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {kootas.map(({ key, s }, i) => (
            <div
              key={key}
              style={{
                padding: '1rem 1.25rem',
                borderBottom: i < kootas.length - 1 ? '1px solid var(--border-soft)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                <div>
                  <span style={{ fontWeight: 800 }}>{key}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{s.meaning}</span>
                </div>
                <div style={{ fontWeight: 800, color: s.points === 0 ? 'var(--rose)' : 'var(--text-primary)' }}>
                  {s.points}/{s.max}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{s.insight}</p>
              {s.notes && s.notes.length > 0 && (
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {s.notes.map(n => <li key={n}>{n}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage 2–3 overall */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>{t('beyond')}</div>
        <h3 style={{ margin: '0.25rem 0 0.5rem', fontSize: '1.15rem' }}>{deep.overall.stageLabel}</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{deep.overall.summary}</p>
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{
            padding: '0.25rem 0.65rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
            background: 'rgba(201,168,76,0.12)', color: 'var(--text-gold)', border: '1px solid rgba(201,168,76,0.25)',
          }}>
            {t('chemistry', { score: deep.stage3.chemistryScore, label: deep.stage3.chemistryLabel })}
          </span>
        </div>
      </div>

      <MilanDashaTimeline chartA={chartA} chartB={chartB} dashaPair={deep.dashaPair} />

      {/* Stage 3 Venus–Mars */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 className="label-caps" style={{ margin: '0 0 1rem', fontSize: '0.72rem' }}>{t('stage3Title')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.65rem' }}>
          {deep.stage3.venusMars.map((l, i) => (
            <div
              key={`${l.from}-${l.to}-${i}`}
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--r-md)',
                border: `1px solid ${TONE[l.tone]}33`,
                background: `${TONE[l.tone]}08`,
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{l.from} → {l.to}</div>
              <div style={{ fontSize: '0.7rem', color: TONE[l.tone], marginTop: '0.25rem' }}>{l.label}</div>
            </div>
          ))}
        </div>
        <p style={{ margin: '1rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {deep.stage3.marsNakTara.detail}
        </p>
        <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {deep.stage3.findings.map(f => (
            <div key={f.id} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderLeft: `3px solid ${TONE[f.tone]}`, paddingLeft: '0.75rem' }}>
              <strong style={{ color: TONE[f.tone] }}>{f.title}:</strong> {f.detail}
            </div>
          ))}
        </div>
      </div>

      {/* Stage 2 houses + rotation */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.75rem', fontSize: '0.72rem' }}>{t('stage2Title')}</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{deep.stage2.d1Summary}</p>
        {deep.stage2.d9Summary && (
          <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{deep.stage2.d9Summary}</p>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>{t('house')}</th>
                <th style={{ padding: '0.65rem', color: 'var(--text-gold)' }}>{chartA.meta.name}</th>
                <th style={{ padding: '0.65rem', color: 'var(--accent)' }}>{chartB.meta.name}</th>
                <th style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>{t('match')}</th>
              </tr>
            </thead>
            <tbody>
              {deep.stage2.houseAfflictions.map(h => (
                <tr key={h.house} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.65rem' }}>
                    <div style={{ fontWeight: 700 }}>House {h.house}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{h.name}</div>
                  </td>
                  <td style={{ padding: '0.65rem', color: h.personAAfflicted ? 'var(--rose)' : 'var(--teal)' }}>
                    {h.personAAfflicted ? t('strained') : t('clear')}
                  </td>
                  <td style={{ padding: '0.65rem', color: h.personBAfflicted ? 'var(--rose)' : 'var(--teal)' }}>
                    {h.personBAfflicted ? t('strained') : t('clear')}
                  </td>
                  <td style={{ padding: '0.65rem', color: h.matched ? 'var(--teal)' : 'var(--text-gold)' }}>
                    {h.matched ? t('aligned') : t('uneven')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {deep.stage2.findings.map(f => (
            <div key={f.id} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderLeft: `3px solid ${TONE[f.tone]}`, paddingLeft: '0.75rem' }}>
              <strong style={{ color: TONE[f.tone] }}>{f.title}:</strong> {f.detail}
            </div>
          ))}
        </div>
      </div>

      {/* 7th rotation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.75rem' }}>
        {deep.stage2.seventhRotation.map(r => (
          <div key={r.person} className="card" style={{ padding: '1.1rem' }}>
            <div className="label-caps" style={{ fontSize: '0.6rem' }}>{t('partnerView', { person: r.person })}</div>
            <div style={{ fontWeight: 800, margin: '0.35rem 0' }}>{t('lagnaFromView', { sign: r.newLagnaName })}</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {r.notes.map(n => <li key={n}>{n}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* Partner longevity and wellbeing yogas (Vaidhavya / Vidhur) */}
      <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${TONE[deep.longevityYogas.tone]}` }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.5rem', fontSize: '0.72rem' }}>
          {t('vaidhavyaTitle')}
          {deep.longevityYogas.cancelled && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--teal)', fontWeight: 800 }}>{t('similarStrength')}</span>
          )}
        </h3>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {t('vaidhavyaLead')}
        </p>
        <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {deep.longevityYogas.summary}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.75rem' }}>
          {[deep.longevityYogas.personA, deep.longevityYogas.personB].map(y => (
            <div key={`${y.person}-${y.role}`} style={{ padding: '0.9rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {y.role === 'vaidhavya' ? t('vaidhavyaBride') : t('vidhurGroom')}
              </div>
              <div style={{ fontWeight: 800, marginTop: 4 }}>{y.person}</div>
              <div style={{ fontSize: '0.85rem', marginTop: 6 }}>
                {t('cueStrength')} <strong style={{ color: y.band === 'high' ? 'var(--rose)' : y.band === 'none' ? 'var(--teal)' : 'var(--text-gold)' }}>{y.intensity}/10</strong>
                <span style={{ color: 'var(--text-muted)' }}> · {y.band}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {y.longevityNote}
              </div>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {y.factors.slice(0, 4).map(f => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Dasha pair */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.5rem', fontSize: '0.72rem' }}>{t('dashaTitle')}</h3>
        <p style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{deep.dashaPair.summary}</p>
        {(deep.dashaPair.currentA || deep.dashaPair.currentB) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem', fontSize: '0.75rem' }}>
            {deep.dashaPair.currentA && (
              <span style={{ padding: '0.25rem 0.6rem', borderRadius: 6, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: 'var(--text-gold)' }}>
                {t('mahaUntil', { name: chartA.meta.name, lord: deep.dashaPair.currentA.lord, end: deep.dashaPair.currentA.end })}
              </span>
            )}
            {deep.dashaPair.currentB && (
              <span style={{ padding: '0.25rem 0.6rem', borderRadius: 6, background: 'rgba(120,160,200,0.12)', border: '1px solid rgba(120,160,200,0.3)', color: 'var(--accent)' }}>
                {t('mahaUntil', { name: chartB.meta.name, lord: deep.dashaPair.currentB.lord, end: deep.dashaPair.currentB.end })}
              </span>
            )}
          </div>
        )}
        {deep.dashaPair.windows.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {deep.dashaPair.windows.map((w, i) => (
              <div key={`${w.overlapStart}-${i}`} style={{ padding: '0.75rem', borderLeft: `3px solid ${TONE[w.tone]}`, background: 'var(--surface-2)', borderRadius: '0 var(--r-sm) var(--r-sm) 0' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  {w.personALord} × {w.personBLord}
                  <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}> · {w.overlapStart} → {w.overlapEnd}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: TONE[w.tone], marginTop: 2 }}>{w.relation}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>{w.note}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('noDashaOverlap')}</p>
        )}
      </div>

      {/* Varnamala */}
      <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${TONE[deep.varnamala.tone]}` }}>
        <h3 className="label-caps" style={{ margin: '0 0 0.5rem', fontSize: '0.72rem' }}>{t('varnamalaTitle')}</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{deep.varnamala.summary}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.75rem' }}>
          {[deep.varnamala.personA, deep.varnamala.personB].map(p => (
            <div key={p.person} style={{ padding: '0.85rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 800 }}>{p.person}</div>
              <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
                {t('syllable')} <strong style={{ color: 'var(--text-gold)' }}>{p.janmaSyllable}</strong>
                {p.group && <> · {p.group.animalSa} ({p.group.animal})</>}
              </div>
              {p.group && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {t('letters')}: {p.group.letters}
                  {p.enemyGroup && <> · {t('opposingGroup')}: {p.enemyGroup.animalSa}</>}
                </div>
              )}
            </div>
          ))}
        </div>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          {t('varnamalaFoot')}
        </p>
      </div>

      {/* Priorities */}
      <div
        style={{
          padding: '1rem',
          background: 'var(--surface-2)',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--border)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('prioritiesTitle')}</div>
        <ol style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.5 }}>
          {deep.overall.priorities.map(p => <li key={p}>{p}</li>)}
        </ol>
      </div>
    </div>
  )
}
