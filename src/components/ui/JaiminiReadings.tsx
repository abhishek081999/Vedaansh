// ─────────────────────────────────────────────────────────────
//  src/components/ui/JaiminiReadings.tsx
//  Karakamsha / Swamsha, family significators, and dasha reading
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { calculateFamilyKarakas } from '@/lib/engine/jaimini/family'
import { readKarakamsha } from '@/lib/engine/jaimini/karakamsha'
import { readJaiminiDasha } from '@/lib/engine/jaimini/dashaReading'
import { ageInYears, readKarakaLife, readSoulKarakas } from '@/lib/engine/jaimini/judgment'
import type { CharaKarakaResult } from '@/lib/engine/karakas'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import styles from './JaiminiPanel.module.css'

function useJyotishNames() {
  const { lang } = useLang()
  const hi = lang === 'hi'
  return {
    lang,
    graha: (id: GrahaId) => (hi ? GRAHA_HI[id] : GRAHA_NAMES[id]),
    rashi: (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r]),
    rashiShort: (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_SHORT[r]),
    term: (name: string) => (hi ? termHi(name) : name),
  }
}

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
  const t = useTranslations('jaimini.readings')
  const names = useJyotishNames()
  const reading = useMemo(
    () => readKarakamsha({
      d1: chart.grahas,
      d9: chart.vargas?.D9 ?? [],
      lagna: chart.lagnas.ascRashi,
      arudhaLagna,
      ak: karakas.AK,
      amk: karakas.AmK,
      dk: karakas.DK,
      lang: names.lang,
    }),
    [chart.grahas, chart.vargas, chart.lagnas.ascRashi, arudhaLagna, karakas.AK, karakas.AmK, karakas.DK, names.lang],
  )

  return (
    <Card title={t('karakamshaTitle')}>
      <p style={{ margin: '0 0 0.6rem', fontSize: '0.75rem', lineHeight: 1.55 }}>
        {t('karakamshaLead', { sign: names.rashi(reading.karakamsha), planet: names.graha(reading.ak) })}
        {reading.swamshaFallback ? ` ${t('swamshaFallback')}` : ''}
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
              <th>{t('house')}</th>
              <th>{t('sign')}</th>
              <th>{t('d1')}</th>
              <th>{t('d9')}</th>
            </tr>
          </thead>
          <tbody>
            {reading.houses.map(row => (
              <tr key={row.house}>
                <td style={{ fontWeight: 800 }}>{row.house}</td>
                <td>{names.rashiShort(row.rashi)}</td>
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
  const t = useTranslations('jaimini.readings')
  const { lang } = useLang()
  const reading = useMemo(
    () => readSoulKarakas({
      grahas: chart.grahas.map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree, dignity: g.dignity })),
      lagna: chart.lagnas.ascRashi,
      lagnaDegree: chart.lagnas.ascDegreeInRashi,
      ak: karakas.AK,
      amk: karakas.AmK,
      d9: chart.vargas?.D9?.map(g => ({ id: g.id, rashi: g.rashi })),
      lang,
    }),
    [chart.grahas, chart.lagnas.ascRashi, chart.lagnas.ascDegreeInRashi, chart.vargas, karakas.AK, karakas.AmK, lang],
  )

  return (
    <Card title={t('soulTitle')}>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{t('atmakaraka')}</div>
      <LineList lines={reading.akLines} />
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', margin: '0.75rem 0 0.35rem' }}>{t('amatyakaraka')}</div>
      <LineList lines={reading.amkLines} />
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', margin: '0.75rem 0 0.35rem' }}>{t('sagittarius')}</div>
      <LineList lines={reading.sagittariusLines} />
    </Card>
  )
}

export function KarakaLifeCard({ chart, karakas }: { chart: ChartOutput; karakas: CharaKarakaResult }) {
  const t = useTranslations('jaimini.readings')
  const { lang } = useLang()
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
      lang,
    }),
    [chart.grahas, chart.lagnas.ascRashi, chart.meta.birthDate, karakas, lang],
  )

  return (
    <Card title={t('lifeTitle')}>
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
  const t = useTranslations('jaimini.readings')
  const { lang } = useLang()
  const names = useJyotishNames()
  const rows = useMemo(() => calculateFamilyKarakas(chart.grahas, lang), [chart.grahas, lang])
  return (
    <Card title={t('familyTitle')}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>{t('relation')}</th>
            <th>{t('rule')}</th>
            <th style={{ textAlign: 'right' }}>{t('planet')}</th>
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
              <td style={{ textAlign: 'right', fontWeight: 800 }}>{names.graha(row.planet)}</td>
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
  const t = useTranslations('jaimini.readings')
  const { lang } = useLang()
  const names = useJyotishNames()
  const reading = useMemo(() => {
    if (!sign) return null
    const periodLabel = (nodes?: { isCurrent: boolean; level: number; lord: string; label?: string }[]) => {
      const current = nodes?.find(n => n.isCurrent && n.level === 1) ?? nodes?.find(n => n.isCurrent)
      if (!current) return null
      const raw = current.label || current.lord
      return lang === 'hi' ? termHi(raw) : raw
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
      lang,
    })
  }, [sign, antarSign, upapada, karakamsha, chart.grahas, chart.lagnas.ascRashi, chart.lagnas.ascDegreeInRashi, chart.vargas, chart.dashas, roleOf, applyPadaExceptions, sequenceForward, lang])

  if (!reading) {
    return (
      <Card title={t('dashaTitle')}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('noSign')}</p>
      </Card>
    )
  }

  return (
    <Card title={t('dashaNamed', { sign: names.rashi(reading.sign) })}>
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
