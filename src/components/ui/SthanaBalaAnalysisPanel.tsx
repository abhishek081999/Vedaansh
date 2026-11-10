// ─────────────────────────────────────────────────────────────
//  src/components/ui/SthanaBalaAnalysisPanel.tsx
//  Sthana Bala (positional / space strength) interpretive panel
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { DashaNode, GrahaData, GrahaId, ShadbalaResult } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI } from '@/i18n/jyotish'
import {
  analyzeSthanaBala,
  STHANA_CLASSICAL_MIN_VIRUPAS,
  STHANA_SATURN_USABLE,
  STHANA_SOFT_ABOVE_AVG,
  STHANA_SOFT_BASELINE,
  sthanaSoftBandColor,
  type SthanaPlanetAnalysis,
} from '@/lib/engine/sthanaBalaAnalysis'
import { PanelShell } from '@/components/ui/patterns/PanelShell'
import { BalaBreakdownViz } from '@/components/ui/BalaBreakdownViz'

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

function profileColor(profile: string): string {
  if (profile === 'above_average') return 'var(--teal)'
  if (profile === 'struggling') return 'var(--rose)'
  return 'var(--text-gold)'
}

function toneColor(tone: string): string {
  if (tone === 'favorable') return 'var(--teal)'
  if (tone === 'supportive') return 'var(--text-gold)'
  if (tone === 'caution') return 'var(--rose)'
  return 'var(--amber)'
}

function Pill({
  children,
  color,
}: {
  children: React.ReactNode
  color?: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        padding: '0.12rem 0.4rem',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--border)',
        background: 'var(--surface-2)',
        color: color ?? 'var(--text-secondary)',
      }}
    >
      {children}
    </span>
  )
}

function PlanetDetail({ row, name }: { row: SthanaPlanetAnalysis; name: string }) {
  const t = useTranslations('chartTools.shadbala.analysis')
  const parts = [
    ['uccha', row.breakdown?.uccha],
    ['saptavargaja', row.breakdown?.saptavargaja],
    ['ojhayugma', row.breakdown?.ojhayugma],
    ['kendradi', row.breakdown?.kendradi],
    ['drekkana', row.breakdown?.drekkana],
  ] as const
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{name}</span>
        <Pill color={sthanaSoftBandColor(row.softBand)}>{t(`sthana.band.${row.softBand}`)}</Pill>
        {row.meetsClassicalMin ? (
          <Pill color="var(--teal)">{t('sthana.classicalOk', { n: String(STHANA_CLASSICAL_MIN_VIRUPAS) })}</Pill>
        ) : (
          <Pill color="var(--rose)">{t('sthana.belowN', { n: String(STHANA_CLASSICAL_MIN_VIRUPAS) })}</Pill>
        )}
        {row.id === 'Sa' && row.virupas >= STHANA_SATURN_USABLE && row.virupas < STHANA_SOFT_ABOVE_AVG ? (
          <Pill color="var(--amber)">{t('sthana.saturnUsable', { n: String(STHANA_SATURN_USABLE) })}</Pill>
        ) : null}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        {t('sthana.metrics', {
          v: row.virupas.toFixed(1),
          r: row.rupas.toFixed(3),
          pct: (row.classicalRatio * 100).toFixed(0),
          min: String(STHANA_CLASSICAL_MIN_VIRUPAS),
        })}
      </div>
      {row.spaceThemes.length > 0 && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {t('sthana.spaceThemes', { list: row.spaceThemes.join(' · ') })}
        </div>
      )}
      {row.bodyCue && (
        <div style={{ fontSize: '0.74rem', color: 'var(--rose)', borderLeft: '2px solid var(--rose)', paddingLeft: '0.5rem' }}>
          {row.bodyCue}
        </div>
      )}
      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
        <span style={{ fontWeight: 700, color: 'var(--text-gold)' }}>{t('remedyFocus')} </span>
        {row.remedy}
      </div>
      {row.breakdown && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.3rem' }}>
          {parts.map(([key, val]) => (
            <div
              key={key}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--r-sm)',
                padding: '0.28rem 0.35rem',
              }}
            >
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{t(`sthana.part.${key}`)}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700 }}>{(val ?? 0).toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SthanaBalaAnalysisPanel({
  shadbala,
  dashaNodes,
  grahas,
  compact = false,
}: {
  shadbala: ShadbalaResult
  dashaNodes?: DashaNode[]
  grahas?: GrahaData[]
  compact?: boolean
}) {
  const t = useTranslations('chartTools.shadbala.analysis')
  const { lang, hi } = useLang()
  const nameOf = (id: string) => (hi && id in GRAHA_HI ? GRAHA_HI[id as GrahaId] : (GRAHA_NAMES[id as GrahaId] ?? id))
  const analysis = useMemo(
    () => analyzeSthanaBala(shadbala, { dashaNodes, grahas, lang }),
    [shadbala, dashaNodes, grahas, lang],
  )
  const [active, setActive] = useState<GrahaId>('Su')

  if (!analysis) {
    return (
      <PanelShell
        title={t('sthana.title')}
        empty={{ title: t('sthana.unavailableTitle'), description: t('recalc') }}
      >
        {null}
      </PanelShell>
    )
  }

  const activeRow = analysis.rows.find((r) => r.id === active) ?? analysis.rows[0]

  if (compact) {
    const topPred = analysis.predictions.find((p) => p.topic === 'career') ?? analysis.predictions[0]
    return (
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          background: 'var(--surface-2)',
          padding: '0.5rem 0.55rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="label-caps">{t('sthana.profileLabel')}</div>
          <Pill color={profileColor(analysis.profile)}>{t(`sthana.profile.${analysis.profile}`)}</Pill>
        </div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{analysis.summary}</div>
        {topPred && (
          <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: toneColor(topPred.tone), lineHeight: 1.35 }}>
            <span style={{ fontWeight: 700 }}>{topPred.title}: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{topPred.text}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <PanelShell title={t('sthana.title')} padding="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, rgba(166,124,0,0.08), rgba(78,205,196,0.06))',
            padding: '0.7rem 0.8rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div className="label-caps">{t('sthana.lifetime')}</div>
              <div style={{ marginTop: '0.2rem', fontWeight: 800, fontSize: '0.92rem', color: profileColor(analysis.profile) }}>
                {t('meanLine', { profile: t(`sthana.profile.${analysis.profile}`), n: analysis.meanVirupas.toFixed(0) })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              <Pill>{t('sthana.softGe', { n: String(STHANA_SOFT_ABOVE_AVG) })}</Pill>
              <Pill>{t('sthana.baselineN', { n: String(STHANA_SOFT_BASELINE) })}</Pill>
              <Pill>{t('sthana.classicalN', { n: String(STHANA_CLASSICAL_MIN_VIRUPAS) })}</Pill>
            </div>
          </div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{analysis.profileNote}</div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{analysis.summary}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.4rem' }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{t('sthana.strongest')}</div>
            <div style={{ fontWeight: 800, color: 'var(--teal)' }}>{nameOf(analysis.strongestId)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {t('vShort', { n: analysis.rows.find((r) => r.id === analysis.strongestId)?.virupas.toFixed(0) ?? '0' })}
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{t('sthana.weakest')}</div>
            <div style={{ fontWeight: 800, color: 'var(--rose)' }}>{nameOf(analysis.weakestId)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {t('vShort', { n: analysis.rows.find((r) => r.id === analysis.weakestId)?.virupas.toFixed(0) ?? '0' })}
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{t('sthana.range')}</div>
            <div style={{ fontWeight: 800 }}>
              {analysis.minVirupas.toFixed(0)}–{analysis.maxVirupas.toFixed(0)}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('weakN', { n: String(analysis.dipCount) })}</div>
          </div>
        </div>

        {analysis.predictions.length > 0 && (
          <div>
            <div className="label-caps" style={{ marginBottom: '0.4rem' }}>{t('predictions')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.45rem' }}>
              {analysis.predictions.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-sm)',
                    background: 'var(--surface-2)',
                    padding: '0.55rem 0.6rem',
                    borderLeft: `3px solid ${toneColor(p.tone)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem' }}>{p.title}</div>
                    <Pill color={toneColor(p.tone)}>{t(`tone.${p.tone}`)}</Pill>
                  </div>
                  {(p.basedOn || p.virupas != null) && (
                    <div style={{ marginTop: '0.15rem', fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {p.basedOn ?? ''}
                      {p.basedOn && p.virupas != null ? ' · ' : ''}
                      {p.virupas != null ? t('vShort', { n: p.virupas.toFixed(0) }) : ''}
                    </div>
                  )}
                  <div style={{ marginTop: '0.3rem', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {p.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(analysis.dasha.current || analysis.dasha.next) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.45rem' }}>
            {[analysis.dasha.current, analysis.dasha.next].filter(Boolean).map((cue) => (
              <div
                key={cue!.role}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--surface-2)',
                  padding: '0.5rem 0.55rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.35rem', alignItems: 'center' }}>
                  <div className="label-caps">{cue!.role === 'current' ? t('currentMd') : t('nextMd')}</div>
                  <Pill color={sthanaSoftBandColor(cue!.softBand)}>{t(`sthana.band.${cue!.softBand}`)}</Pill>
                </div>
                <div style={{ marginTop: '0.2rem', fontWeight: 800 }}>
                  {nameOf(cue!.lord)}
                  {cue!.viaDispositor && cue!.scoredId ? (
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem' }}> → {nameOf(cue!.scoredId)}</span>
                  ) : null}
                </div>
                {cue!.virupas != null && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {t('virupasN', { n: cue!.virupas.toFixed(0) })}
                  </div>
                )}
                <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {cue!.note}
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="label-caps" style={{ marginBottom: '0.4rem' }}>{t('sthana.perPlanet')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.25rem' }}>
            {ORDER.map((id) => {
              const row = analysis.rows.find((r) => r.id === id)!
              const on = active === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActive(id)}
                  style={{
                    border: `1px solid ${on ? 'var(--border-bright)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-sm)',
                    background: on ? 'var(--surface-3)' : 'var(--surface-2)',
                    padding: '0.35rem 0.2rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.72rem' }}>{hi ? GRAHA_HI[id] : id}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: sthanaSoftBandColor(row.softBand), fontWeight: 700 }}>
                    {row.virupas.toFixed(0)}
                  </div>
                </button>
              )
            })}
          </div>
          <div
            style={{
              marginTop: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-1)',
              padding: '0.65rem 0.7rem',
            }}
          >
            {activeRow ? <PlanetDetail row={activeRow} name={nameOf(activeRow.id)} /> : null}
          </div>
        </div>

        <BalaBreakdownViz
          title={t('sthana.vizTitle')}
          rows={analysis.rows.map((r) => ({ ...r, name: nameOf(r.id) }))}
          classicalMin={STHANA_CLASSICAL_MIN_VIRUPAS}
          activeId={activeRow?.id}
          breakdown={activeRow?.breakdown}
          breakdownLabels={{
            uccha: t('sthana.part.uccha'),
            saptavargaja: t('sthana.part.saptavargaja'),
            ojhayugma: t('sthana.part.ojhayugma'),
            kendradi: t('sthana.part.kendradi'),
            drekkana: t('sthana.part.drekkana'),
          }}
        />

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem' }}>{t('planet')}</th>
                <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>{t('virupas')}</th>
                <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>{t('soft')}</th>
                <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>{t('sthana.vsN', { n: String(STHANA_CLASSICAL_MIN_VIRUPAS) })}</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.3rem 0.4rem', fontWeight: 700 }}>{nameOf(r.id)}</td>
                  <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.virupas.toFixed(1)}</td>
                  <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', color: sthanaSoftBandColor(r.softBand), fontWeight: 700 }}>
                    {t(`sthana.band.${r.softBand}`)}
                  </td>
                  <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: r.meetsClassicalMin ? 'var(--teal)' : 'var(--rose)' }}>
                    {(r.classicalRatio * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {t('sthana.footnote', { min: String(STHANA_CLASSICAL_MIN_VIRUPAS) })}
        </div>
      </div>
    </PanelShell>
  )
}
