'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/CoupleNumerologyCard.tsx
//  Couple numerology — core harmony, combined Lo Shu grid and
//  relationship number. Used in Numerology → Compatibility and
//  on the Kundali Milan match view.
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { buildCoupleNumerology, type CouplePersonInput } from '@/lib/engine/numerology/couple'
import { couplePlanetLabel } from '@/lib/engine/locale/coupleNumerology.hi'
import { LOSHU_LAYOUT, type CoreNumber } from '@/lib/engine/numerology/data'
import { useLang } from '@/i18n/useLang'
import { HarmonyPill, NumberOrb, SectionCard, TagList, gridColumns } from './shared'
import type { Harmony } from '@/lib/engine/numerology/core'

const VERDICT_COLOR = {
  excellent: 'var(--teal)',
  good: 'var(--teal)',
  average: 'var(--gold)',
  challenging: 'var(--rose)',
} as const

export function CoupleNumerologyCard({ a, b, title, compact = false }: {
  a: CouplePersonInput
  b: CouplePersonInput
  title?: string
  compact?: boolean
}) {
  const t = useTranslations('compare.numerology')
  const { lang } = useLang()
  const couple = useMemo(() => buildCoupleNumerology(a, b, lang), [a, b, lang])
  if (!couple) return null
  const rel = couple.relationshipNumber
  const cardTitle = title ?? t('defaultTitle')
  const planetTag = (n: CoreNumber) => `${n} · ${couplePlanetLabel(n, lang)}`

  return (
    <SectionCard
      title={cardTitle}
      subtitle={t('subtitle')}
      accent={VERDICT_COLOR[couple.verdict]}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
        {[couple.a, couple.b].map(p => (
          <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
            <NumberOrb value={p.moolank} size={38} />
            <NumberOrb value={p.bhagyank} size={38} muted />
            {p.namank && <NumberOrb value={p.namank} size={30} muted />}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{p.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: VERDICT_COLOR[couple.verdict], lineHeight: 1 }}>{couple.percent}%</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {t('verdictMatch', { verdict: t(`verdict.${couple.verdict}`) })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {couple.pairs.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span>{p.label} <span style={{ color: 'var(--text-muted)' }}>({p.a} ↔ {p.b})</span></span>
            <HarmonyPill harmony={p.harmony} label={t(`harmony.${p.harmony as Harmony}`)} />
          </div>
        ))}
      </div>

      {!compact && (
        <div style={gridColumns(220)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Caption>{t('combinedGrid')}</Caption>
            <div role="grid" aria-label={t('gridAria')} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: 3 }}>
              {LOSHU_LAYOUT.flat().map(n => {
                const c = couple.combinedCounts[n]
                const filled = couple.filledForA.includes(n) || couple.filledForB.includes(n)
                return (
                  <div
                    key={n}
                    role="gridcell"
                    aria-label={c ? t('gridCellPresent', { n, count: c }) : t('gridCellMissing', { n })}
                    style={{
                      height: 40, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, fontSize: '0.9rem',
                      background: c ? (filled ? 'var(--surface-3)' : 'var(--gold-faint)') : 'var(--surface-2)',
                      border: `1px solid ${filled ? 'var(--teal)' : c ? 'var(--border-bright)' : 'var(--border-soft)'}`,
                      color: c ? 'var(--text-gold)' : 'var(--text-muted)', opacity: c ? 1 : 0.4,
                    }}
                  >
                    {n}
                  </div>
                )
              })}
            </div>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{t('partnerSupplies')}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', minWidth: 0 }}>
            {couple.filledForA.length > 0 && (
              <div>
                <Caption>{t('bringsTo', { from: couple.b.label, to: couple.a.label })}</Caption>
                <TagList items={couple.filledForA.map(planetTag)} color="var(--teal)" />
              </div>
            )}
            {couple.filledForB.length > 0 && (
              <div>
                <Caption>{t('bringsTo', { from: couple.a.label, to: couple.b.label })}</Caption>
                <TagList items={couple.filledForB.map(planetTag)} color="var(--teal)" />
              </div>
            )}
            {couple.stillMissing.length > 0 && (
              <div>
                <Caption>{t('missingBoth')}</Caption>
                <TagList items={couple.stillMissing.map(planetTag)} color="var(--rose)" />
              </div>
            )}
            {couple.sharedPlanes.map(p => (
              <div key={p.name} style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {t('sharedPlane', { name: p.name, numbers: p.numbers.join('-'), meaning: p.meaning })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
        <NumberOrb value={rel.value} size={36} />
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{t('relationshipLine', { value: rel.value })}</strong>{' '}
          {t('relationshipMeta', { planet: rel.planet, keyword: rel.keyword, theme: rel.theme, guidance: rel.guidance })}
        </div>
      </div>
    </SectionCard>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
      {children}
    </div>
  )
}
