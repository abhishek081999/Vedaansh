// ─────────────────────────────────────────────────────────────
//  src/components/ui/JaiminiReadings.tsx
//  Karakamsha / Swamsha, family significators, and dasha reading
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo } from 'react'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { calculateFamilyKarakas } from '@/lib/engine/jaimini/family'
import { readKarakamsha } from '@/lib/engine/jaimini/karakamsha'
import { readJaiminiDasha } from '@/lib/engine/jaimini/dashaReading'
import { ageInYears, readKarakaLife, readSoulKarakas } from '@/lib/engine/jaimini/judgment'
import type { CharaKarakaResult } from '@/lib/engine/karakas'
import styles from './JaiminiPanel.module.css'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>{title}</div>
      <div className={styles.sectionBody} style={{ padding: '0.75rem' }}>
        {children}
      </div>
    </div>
  )
}

export function KarakamshaCard({
  chart,
  karakas,
  arudhaLagna,
}: {
  chart: ChartOutput
  karakas: CharaKarakaResult
  arudhaLagna: Rashi
}) {
  const reading = useMemo(
    () => readKarakamsha({
      d1: chart.grahas,
      d9: chart.vargas?.D9 ?? [],
      lagna: chart.lagnas.ascRashi,
      arudhaLagna,
      ak: karakas.AK,
      amk: karakas.AmK,
      dk: karakas.DK,
    }),
    [chart.grahas, chart.vargas, chart.lagnas.ascRashi, arudhaLagna, karakas.AK, karakas.AmK, karakas.DK],
  )

  return (
    <Card title="Karakamsha and Swamsha">
      <p style={{ margin: '0 0 0.6rem', fontSize: '0.75rem', lineHeight: 1.55 }}>
        Karakamsha is {RASHI_NAMES[reading.karakamsha]}, the navamsha of Atmakaraka {GRAHA_NAMES[reading.ak]}, read in the birth chart.
        {reading.swamshaFallback ? ' Navamsha placement of the Atmakaraka is missing, so the birth-chart sign is used.' : ''}
      </p>
      <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
        {reading.usage}
      </p>
      <p style={{ margin: '0 0 0.45rem', fontSize: '0.72rem', lineHeight: 1.5 }}>{reading.direction}</p>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
        {reading.alignment} {reading.support}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
        {reading.themes.map(theme => (
          <div key={theme.id}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase' }}>{theme.title}</div>
            <div style={{ fontSize: '0.72rem', lineHeight: 1.45 }}>{theme.text}</div>
          </div>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>House</th>
              <th>Sign</th>
              <th>D1</th>
              <th>D9</th>
            </tr>
          </thead>
          <tbody>
            {reading.houses.map(row => (
              <tr key={row.house}>
                <td style={{ fontWeight: 800 }}>{row.house}</td>
                <td>{RASHI_SHORT[row.rashi]}</td>
                <td>{row.d1.join(', ') || '—'}</td>
                <td>{row.d9.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function LineList({ lines }: { lines: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {lines.map(line => (
        <p key={line} style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.45 }}>{line}</p>
      ))}
    </div>
  )
}

export function SoulKarakaCard({ chart, karakas }: { chart: ChartOutput; karakas: CharaKarakaResult }) {
  const reading = useMemo(
    () => readSoulKarakas({
      grahas: chart.grahas.map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree, dignity: g.dignity })),
      lagna: chart.lagnas.ascRashi,
      lagnaDegree: chart.lagnas.ascDegreeInRashi,
      ak: karakas.AK,
      amk: karakas.AmK,
      d9: chart.vargas?.D9?.map(g => ({ id: g.id, rashi: g.rashi })),
    }),
    [chart.grahas, chart.lagnas.ascRashi, chart.lagnas.ascDegreeInRashi, chart.vargas, karakas.AK, karakas.AmK],
  )

  return (
    <Card title="Atmakaraka and Amatyakaraka">
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Atmakaraka</div>
      <LineList lines={reading.akLines} />
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', margin: '0.75rem 0 0.35rem' }}>Amatyakaraka</div>
      <LineList lines={reading.amkLines} />
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', margin: '0.75rem 0 0.35rem' }}>Sagittarius</div>
      <LineList lines={reading.sagittariusLines} />
    </Card>
  )
}

export function KarakaLifeCard({ chart, karakas }: { chart: ChartOutput; karakas: CharaKarakaResult }) {
  const reading = useMemo(
    () => readKarakaLife({
      grahas: chart.grahas.map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree, dignity: g.dignity })),
      lagna: chart.lagnas.ascRashi,
      ak: karakas.AK,
      amk: karakas.AmK,
      bk: karakas.BK,
      mk: karakas.MK,
      pk: karakas.PK,
      gk: karakas.GK,
      dk: karakas.DK,
      ageYears: ageInYears(chart.meta.birthDate),
    }),
    [chart.grahas, chart.lagnas.ascRashi, chart.meta.birthDate, karakas],
  )

  return (
    <Card title="Karaka life story">
      {reading.rows.map(row => (
        <div key={row.id} style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{row.title}</div>
          <LineList lines={row.lines} />
        </div>
      ))}
      {reading.loop && (
        <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.45, color: 'var(--text-secondary)' }}>{reading.loop}</p>
      )}
    </Card>
  )
}

export function FamilyKarakaCard({ chart }: { chart: ChartOutput }) {
  const rows = useMemo(() => calculateFamilyKarakas(chart.grahas), [chart.grahas])
  return (
    <Card title="Family significators">
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Relation</th>
            <th>Rule</th>
            <th style={{ textAlign: 'right' }}>Planet</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.relation}>
              <td style={{ fontWeight: 800 }}>
                {row.relation}
                {row.note && (
                  <div style={{ fontWeight: 500, fontSize: '0.62rem', color: 'var(--text-muted)' }}>{row.note}</div>
                )}
              </td>
              <td style={{ color: 'var(--text-secondary)' }}>{row.rule}</td>
              <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.planet}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export function DashaReadingCard({
  sign,
  chart,
  roleOf,
  applyPadaExceptions,
  sequenceForward,
  antarSign,
  upapada,
  karakamsha,
}: {
  sign: Rashi | null
  chart: ChartOutput
  roleOf: Partial<Record<GrahaId, string | null>>
  applyPadaExceptions: boolean
  sequenceForward?: boolean
  antarSign?: Rashi | null
  upapada?: Rashi
  karakamsha?: Rashi
}) {
  const reading = useMemo(() => {
    if (!sign) return null
    const periodLabel = (nodes?: { isCurrent: boolean; level: number; lord: string; label?: string }[]) => {
      const current = nodes?.find(n => n.isCurrent && n.level === 1) ?? nodes?.find(n => n.isCurrent)
      if (!current) return null
      return current.label || current.lord
    }
    return readJaiminiDasha({
      sign,
      grahas: chart.grahas.map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree })),
      roleOf,
      applyPadaExceptions,
      lagna: chart.lagnas.ascRashi,
      d9: chart.vargas?.D9?.map(g => ({ id: g.id, rashi: g.rashi })),
      vimshottariLord: periodLabel(chart.dashas?.vimshottari),
      yoginiLord: periodLabel(chart.dashas?.yogini),
      sequenceForward,
      antarSign: antarSign ?? undefined,
      upapada,
      karakamsha,
      lagnaDegree: chart.lagnas.ascDegreeInRashi,
    })
  }, [sign, antarSign, upapada, karakamsha, chart.grahas, chart.lagnas.ascRashi, chart.lagnas.ascDegreeInRashi, chart.vargas, chart.dashas, roleOf, applyPadaExceptions, sequenceForward])

  if (!reading) {
    return (
      <Card title="Dasha reading">
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>No sign is running in this dasha.</p>
      </Card>
    )
  }

  return (
    <Card title={`${reading.signName} dasha reading`}>
      <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {reading.steps.map(step => (
          <li key={step.title} style={{ fontSize: '0.72rem', lineHeight: 1.45 }}>
            <span style={{ fontWeight: 800 }}>{step.title}. </span>
            {step.text}
          </li>
        ))}
      </ol>
      {reading.agreements.length > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', lineHeight: 1.45 }}>
          {reading.agreements.map(line => (
            <div key={line} style={{ color: 'var(--teal)' }}>{line}</div>
          ))}
        </div>
      )}
    </Card>
  )
}
