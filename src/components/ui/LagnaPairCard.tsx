'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LagnaPairCard.tsx
//  Ascendant-to-ascendant relation for two charts (Milan / compare)
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { RASHI_NAMES, type ChartOutput } from '@/types/astrology'
import { RASHI_HI } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { getLagnaPairDynamics } from '@/lib/engine/lagnaPairDynamics'

interface LagnaPairCardProps {
  chartA: ChartOutput
  chartB: ChartOutput
  nameA: string
  nameB: string
}

export function LagnaPairCard({ chartA, chartB, nameA, nameB }: LagnaPairCardProps) {
  const t = useTranslations('relationshipMarriage.lagnaPair')
  const { lang, hi } = useLang()
  const ascA = chartA.lagnas?.ascRashi
  const ascB = chartB.lagnas?.ascRashi
  const dyn = useMemo(
    () => (ascA && ascB ? getLagnaPairDynamics(ascA, ascB, lang) : null),
    [ascA, ascB, lang],
  )
  if (!dyn || !ascA || !ascB) return null

  return (
    <div className="card" style={{ padding: '1.15rem', borderLeft: '4px solid var(--gold)' }}>
      <div style={label}>{t('title')}</div>
      <div style={{ fontWeight: 800, margin: '4px 0' }}>
        {nameA} ({hi ? RASHI_HI[ascA] : RASHI_NAMES[ascA]}) × {nameB} ({hi ? RASHI_HI[ascB] : RASHI_NAMES[ascB]})
      </div>
      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--text-gold)' }}>{dyn.relation.label}.</strong> {dyn.relation.detail}
      </p>
      {dyn.notes.length > 0 ? (
        <ul style={{ margin: '0.55rem 0 0', paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {dyn.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
      <p style={{ margin: '0.6rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
        {t('caveat')}
      </p>
    </div>
  )
}

const label: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--text-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}
