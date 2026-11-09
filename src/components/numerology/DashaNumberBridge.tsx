'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/DashaNumberBridge.tsx
//  Vimshottari MD/AD lords mapped to Anka numbers + outlook
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import type { NumerologyReport } from '@/lib/engine/numerology/calc'
import { buildDashaNumberBridge } from '@/lib/engine/numerology/tools'
import { HarmonyPill, NumberOrb, SectionCard, gridColumns, useNumerologyLang } from './shared'

const OUTLOOK_COLOR = {
  favourable: 'var(--teal)',
  mixed: 'var(--gold)',
  caution: 'var(--rose)',
  unknown: 'var(--text-muted)',
} as const

export function DashaNumberBridgePanel({
  report,
  chart,
}: {
  report: NumerologyReport
  chart: ChartOutput | null
}) {
  const t = useTranslations('numerology.dasha')
  const to = useTranslations('numerology.outlook')
  const lang = useNumerologyLang()
  const bridge = useMemo(() => {
    if (!chart?.dashas?.vimshottari?.length) return null
    if (chart.meta.birthDate !== `${String(report.date.year).padStart(4, '0')}-${String(report.date.month).padStart(2, '0')}-${String(report.date.day).padStart(2, '0')}`) {
      return null
    }
    return buildDashaNumberBridge({
      vimshottari: chart.dashas.vimshottari,
      moolank: report.moolank.value,
      bhagyank: report.bhagyank.value,
      personalYear: report.cycles.personalYear,
      lang,
    })
  }, [chart, report, lang])

  if (!chart) {
    return (
      <SectionCard title={t('title')} subtitle={t('needChart')}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <Link href="/?new=true" style={{ color: 'var(--text-gold)' }}>{t('enter')}</Link>
          {' '}{t('unlock')}
        </p>
      </SectionCard>
    )
  }

  if (!bridge) {
    return (
      <SectionCard title={t('title')}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('mismatch', { date: chart.meta.birthDate })}
        </p>
      </SectionCard>
    )
  }

  const headers = [t('lord'), t('no'), t('start'), t('end'), t('vs'), t('outlook')]

  return (
    <SectionCard title={t('title')} subtitle={bridge.summary} accent="var(--gold)">
      {bridge.amplification && (
        <div style={{
          padding: '0.7rem 0.85rem', borderRadius: 'var(--r-md)',
          background: 'var(--gold-faint)', border: '1px solid var(--border-bright)',
          fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5,
        }}>
          <strong style={{ color: 'var(--text-gold)' }}>{t('amp')} </strong>{bridge.amplification}
        </div>
      )}

      <div style={gridColumns(240)}>
        {bridge.current.map(c => (
          <div key={`${c.level}-${c.lord}`} style={{
            padding: '0.75rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)',
            border: '1px solid var(--border-soft)', borderLeft: `3px solid ${OUTLOOK_COLOR[c.outlook]}`,
          }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {c.levelName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', margin: '0.35rem 0' }}>
              {c.number != null ? <NumberOrb value={c.number} size={40} /> : <span style={{ width: 40, textAlign: 'center', color: 'var(--text-muted)' }}>—</span>}
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.lordName}</div>
                <div style={{ fontSize: '0.68rem', color: OUTLOOK_COLOR[c.outlook], fontWeight: 700, textTransform: 'uppercase' }}>{to(c.outlook)}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{c.start} → {c.end}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0.4rem 0', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {c.moolankHarmony && <>{t('moolank')} <HarmonyPill harmony={c.moolankHarmony} /></>}
              {c.bhagyankHarmony && <>{t('bhagyank')} <HarmonyPill harmony={c.bhagyankHarmony} /></>}
              {c.personalYearHarmony && <>{t('year')} <HarmonyPill harmony={c.personalYearHarmony} /></>}
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{c.note}</p>
          </div>
        ))}
      </div>

      {bridge.upcomingMahas.length > 0 && (
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>
            {t('upcoming')}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: 420 }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                  {headers.map(h => (
                    <th key={h} style={{ padding: '0.35rem 0.45rem', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-soft)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bridge.upcomingMahas.map(m => (
                  <tr key={m.start} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.4rem 0.45rem', fontWeight: 600 }}>{m.lordName}</td>
                    <td style={{ padding: '0.4rem 0.45rem', color: 'var(--text-gold)', fontWeight: 700 }}>{m.number ?? '—'}</td>
                    <td style={{ padding: '0.4rem 0.45rem', color: 'var(--text-muted)' }}>{m.start}</td>
                    <td style={{ padding: '0.4rem 0.45rem', color: 'var(--text-muted)' }}>{m.end}</td>
                    <td style={{ padding: '0.4rem 0.45rem' }}>{m.moolankHarmony ? <HarmonyPill harmony={m.moolankHarmony} /> : '—'}</td>
                    <td style={{ padding: '0.4rem 0.45rem', color: OUTLOOK_COLOR[m.outlook], fontWeight: 600, textTransform: 'capitalize' }}>{to(m.outlook)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
