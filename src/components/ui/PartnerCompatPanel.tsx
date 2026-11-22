'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/PartnerCompatPanel.tsx
//  Compatibility beyond marriage: business partners and friends.
//  Shown as a tab on /compare. Free. Pure engine: partnerCompat.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { partnerCompatibility, type PartnerFactor, type PartnerMode } from '@/lib/engine/partnerCompat'

const LEVEL_COLOR: Record<PartnerFactor['level'], string> = {
  good: 'var(--teal)',
  neutral: 'var(--text-gold)',
  bad: 'var(--rose)',
}
const BAND_COLOR = { strong: 'var(--teal)', workable: 'var(--text-gold)', care: 'var(--rose)' } as const

export function PartnerCompatPanel({ chartA, chartB }: { chartA: ChartOutput; chartB: ChartOutput }) {
  const t = useTranslations('compare.partners')
  const { lang } = useLang()
  const [mode, setMode] = useState<PartnerMode>('business')
  const result = useMemo(() => partnerCompatibility(chartA, chartB, mode, lang), [chartA, chartB, mode, lang])
  const nameA = chartA.meta.name?.trim() || t('person1')
  const nameB = chartB.meta.name?.trim() || t('person2')

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--text-gold)' }}>{t('title')}</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('lede', { a: nameA, b: nameB })}</p>
          </div>
          <div role="radiogroup" aria-label={t('modeLabel')} style={{ display: 'flex', gap: 3, padding: 3, background: 'var(--surface-3)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
            {(['business', 'friendship'] as PartnerMode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                style={{
                  padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                  background: mode === m ? 'var(--surface-1, var(--surface-2))' : 'transparent',
                  color: mode === m ? 'var(--text-gold)' : 'var(--text-muted)', fontWeight: mode === m ? 700 : 500,
                }}
              >
                {t(`mode.${m}`)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '1.1rem', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 800, color: BAND_COLOR[result.band], lineHeight: 1 }}>
            {result.score}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>/100</span>
          </div>
          <div style={{ flex: '1 1 240px' }}>
            <div style={{ fontWeight: 700, color: BAND_COLOR[result.band] }}>{result.verdict}</div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{result.summary}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '0.75rem' }}>
        {result.factors.map((f) => (
          <div key={f.id} className="card" style={{ padding: '0.9rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.85rem' }}>{f.label}</strong>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: LEVEL_COLOR[f.level], whiteSpace: 'nowrap' }}>
                {f.max > 0 ? `${f.points}/${f.max}` : f.points === 0 ? '0' : `${f.points}`}
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.reason}</p>
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('note')}</p>
    </div>
  )
}
