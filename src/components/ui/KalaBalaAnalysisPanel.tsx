// ─────────────────────────────────────────────────────────────
//  src/components/ui/KalaBalaAnalysisPanel.tsx
//  Kaal Bala (temporal / time-luck strength) interpretive panel
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { DashaNode, GrahaData, GrahaId, Rashi, ShadbalaResult } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI } from '@/i18n/jyotish'
import {
  analyzeKalaBala,
  KALA_CLASSICAL_MIN_VIRUPAS,
  KALA_SOFT_BASELINE,
  KALA_SOFT_STABLE,
  kalaPredictionToneColor,
  kalaSoftBandColor,
  type KalaPlanetAnalysis,
} from '@/lib/engine/kalaBalaAnalysis'
import { PanelShell } from '@/components/ui/patterns/PanelShell'
import { BalaBreakdownViz } from '@/components/ui/BalaBreakdownViz'

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

function profileColor(profile: string): string {
  if (profile === 'stable') return 'var(--teal)'
  if (profile === 'weak') return 'var(--rose)'
  return 'var(--text-gold)'
}

function Pill({ children, color }: { children: React.ReactNode; color?: string }) {
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

function PlanetDetail({ row, name }: { row: KalaPlanetAnalysis; name: string }) {
  const t = useTranslations('chartTools.shadbala.analysis')
  const parts = [
    ['natha', row.breakdown?.natha],
    ['paksha', row.breakdown?.paksha],
    ['tribhaga', row.breakdown?.tribhaga],
    ['vaara', row.breakdown?.vaara],
    ['hora', row.breakdown?.hora],
    ['maasa', row.breakdown?.maasa],
    ['varsha', row.breakdown?.varsha],
    ['ayana', row.breakdown?.ayana],
  ] as const
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{name}</span>
        <Pill color={kalaSoftBandColor(row.softBand)}>{t(`kala.band.${row.softBand}`)}</Pill>
        {row.meetsClassicalMin ? (
          <Pill color="var(--teal)">{t('kala.classicalOk', { n: String(KALA_CLASSICAL_MIN_VIRUPAS) })}</Pill>
        ) : (
          <Pill color="var(--rose)">{t('kala.belowN', { n: String(KALA_CLASSICAL_MIN_VIRUPAS) })}</Pill>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        {t('kala.metrics', {
          v: row.virupas.toFixed(1),
          r: row.rupas.toFixed(3),
          pct: (row.classicalRatio * 100).toFixed(0),
          min: String(KALA_CLASSICAL_MIN_VIRUPAS),
        })}
      </div>
      {row.themes.length > 0 && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('kala.themes', { list: row.themes.join(' · ') })}</div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.3rem' }}>
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
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{t(`kala.part.${key}`)}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700 }}>{(val ?? 0).toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function KalaBalaAnalysisPanel({
  shadbala,
  dashaNodes,
  grahas,
  ascRashi,
  compact = false,
}: {
  shadbala: ShadbalaResult
  dashaNodes?: DashaNode[]
  grahas?: GrahaData[]
  ascRashi?: Rashi
  compact?: boolean
}) {
  const t = useTranslations('chartTools.shadbala.analysis')
  const { lang, hi } = useLang()
  const nameOf = (id: string) => (hi && id in GRAHA_HI ? GRAHA_HI[id as GrahaId] : (GRAHA_NAMES[id as GrahaId] ?? id))
  const analysis = useMemo(
    () => analyzeKalaBala(shadbala, { dashaNodes, grahas, ascRashi, lang }),
    [shadbala, dashaNodes, grahas, ascRashi, lang],
  )
  const [active, setActive] = useState<GrahaId>('Su')

  if (!analysis) {
    return (
      <PanelShell
        title={t('kala.title')}
        empty={{ title: t('kala.unavailableTitle'), description: t('recalc') }}
      >
        {null}
      </PanelShell>
    )
  }

  const activeRow = analysis.rows.find((r) => r.id === active) ?? analysis.rows[0]

  if (compact) {
    const top =
      analysis.predictions.find((p) => p.topic === 'job_vs_business') ??
      analysis.predictions.find((p) => p.topic === 'career') ??
      analysis.predictions[0]
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
          <div className="label-caps">{t('kala.profileLabel')}</div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            <Pill color={profileColor(analysis.profile)}>{t(`kala.profile.${analysis.profile}`)}</Pill>
            <Pill>{t(`kala.career.${analysis.careerPath}`)}</Pill>
          </div>
        </div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{analysis.summary}</div>
        {top && (
          <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', lineHeight: 1.35 }}>
            <span style={{ fontWeight: 700, color: kalaPredictionToneColor(top.tone) }}>{top.title}: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{top.text}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <PanelShell title={t('kala.title')} padding="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, rgba(78,205,196,0.08), rgba(166,124,0,0.06))',
            padding: '0.7rem 0.8rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div className="label-caps">{t('kala.timeLuck')}</div>
              <div style={{ marginTop: '0.2rem', fontWeight: 800, fontSize: '0.92rem', color: profileColor(analysis.profile) }}>
                {t('meanLine', { profile: t(`kala.profile.${analysis.profile}`), n: analysis.meanVirupas.toFixed(0) })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              <Pill color="var(--text-gold)">{t(`kala.career.${analysis.careerPath}`)}</Pill>
              <Pill>{t('kala.softGe', { n: String(KALA_SOFT_STABLE) })}</Pill>
              <Pill>{t('kala.baselineN', { n: String(KALA_SOFT_BASELINE) })}</Pill>
              <Pill>{t('kala.classicalN', { n: String(KALA_CLASSICAL_MIN_VIRUPAS) })}</Pill>
            </div>
          </div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{analysis.profileNote}</div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: 'var(--text-gold)', fontWeight: 600, lineHeight: 1.4 }}>
            {analysis.goldenRule}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.4rem' }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{t('kala.strongest')}</div>
            <div style={{ fontWeight: 800, color: 'var(--teal)' }}>{nameOf(analysis.strongestId)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {t('vShort', { n: analysis.rows.find((r) => r.id === analysis.strongestId)?.virupas.toFixed(0) ?? '0' })}
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{t('kala.weakest')}</div>
            <div style={{ fontWeight: 800, color: 'var(--rose)' }}>{nameOf(analysis.weakestId)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {t('vShort', { n: analysis.rows.find((r) => r.id === analysis.weakestId)?.virupas.toFixed(0) ?? '0' })}
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.4rem 0.5rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{t('kala.spread')}</div>
            <div style={{ fontWeight: 800 }}>{analysis.spreadVirupas.toFixed(0)}</div>
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
                    borderLeft: `3px solid ${kalaPredictionToneColor(p.tone)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem' }}>{p.title}</div>
                    <Pill color={kalaPredictionToneColor(p.tone)}>{t(`tone.${p.tone}`)}</Pill>
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

        {(analysis.dasha.previous || analysis.dasha.current || analysis.dasha.next) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.45rem' }}>
            {([analysis.dasha.previous, analysis.dasha.current, analysis.dasha.next] as const)
              .filter(Boolean)
              .map((cue) => (
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
                    <div className="label-caps">
                      {cue!.role === 'previous' ? t('prevMd') : cue!.role === 'current' ? t('currentMd') : t('nextMd')}
                    </div>
                    <Pill color={kalaSoftBandColor(cue!.softBand)}>{t(`kala.band.${cue!.softBand}`)}</Pill>
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

        {analysis.drains.some((d) => d.active) && (
          <div
            style={{
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--r-sm)',
              padding: '0.5rem 0.55rem',
              background: 'var(--surface-1)',
            }}
          >
            <div className="label-caps" style={{ marginBottom: '0.35rem' }}>
              {t('kala.drain', { planet: nameOf(analysis.dasha.current?.scoredId ?? analysis.dasha.next?.scoredId ?? analysis.weakestId) })}
            </div>
            <div style={{ display: 'grid', gap: '0.3rem' }}>
              {analysis.drains
                .filter((d) => d.active)
                .map((d) => (
                  <div key={d.varga} style={{ fontSize: '0.72rem', color: 'var(--rose)', lineHeight: 1.4 }}>
                    <strong>{d.label}:</strong> {d.detail}
                  </div>
                ))}
            </div>
          </div>
        )}

        <div>
          <div className="label-caps" style={{ marginBottom: '0.4rem' }}>{t('kala.perPlanet')}</div>
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
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: kalaSoftBandColor(row.softBand), fontWeight: 700 }}>
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
          title={t('kala.vizTitle')}
          rows={analysis.rows.map((r) => ({ ...r, name: nameOf(r.id) }))}
          classicalMin={KALA_CLASSICAL_MIN_VIRUPAS}
          activeId={activeRow?.id}
          breakdown={activeRow?.breakdown}
          breakdownLabels={{
            natha: t('kala.part.natha'),
            paksha: t('kala.part.paksha'),
            tribhaga: t('kala.part.tribhaga'),
            vaara: t('kala.part.vaara'),
            hora: t('kala.part.hora'),
            maasa: t('kala.part.maasa'),
            varsha: t('kala.part.varsha'),
            ayana: t('kala.part.ayana'),
          }}
        />

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem' }}>{t('planet')}</th>
                <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>{t('virupas')}</th>
                <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>{t('soft')}</th>
                <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem' }}>{t('kala.vsN', { n: String(KALA_CLASSICAL_MIN_VIRUPAS) })}</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.3rem 0.4rem', fontWeight: 700 }}>{nameOf(r.id)}</td>
                  <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.virupas.toFixed(1)}</td>
                  <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right', color: kalaSoftBandColor(r.softBand), fontWeight: 700 }}>
                    {t(`kala.band.${r.softBand}`)}
                  </td>
                  <td
                    style={{
                      padding: '0.3rem 0.4rem',
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      color: r.meetsClassicalMin ? 'var(--teal)' : 'var(--rose)',
                    }}
                  >
                    {(r.classicalRatio * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {t('kala.footnote', { min: String(KALA_CLASSICAL_MIN_VIRUPAS) })}
        </div>
      </div>
    </PanelShell>
  )
}
