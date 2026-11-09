'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/BabyNameTool.tsx
//  Baby-name suggester — target roots, lucky totals, draft score
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { suggestBabyNames } from '@/lib/engine/numerology/tools'
import { Field } from '@/components/ui/primitives/Field'
import { HarmonyPill, NumberOrb, QUALITY_COLOR, SectionCard, TagList, gridColumns, useNumerologyLang } from './shared'

export function BabyNameTool({ defaultParentDob }: { defaultParentDob?: string }) {
  const t = useTranslations('numerology.baby')
  const tv = useTranslations('numerology.verdict')
  const lang = useNumerologyLang()
  const [babyDob, setBabyDob] = useState('')
  const [parentA, setParentA] = useState(defaultParentDob ?? '')
  const [parentB, setParentB] = useState('')
  const [candidate, setCandidate] = useState('')

  const result = useMemo(
    () => suggestBabyNames({
      babyDob: babyDob || undefined,
      parentDobs: [parentA, parentB].filter(Boolean),
      candidateName: candidate || undefined,
      lang,
    }),
    [babyDob, parentA, parentB, candidate, lang],
  )

  return (
    <SectionCard
      title={t('title')}
      subtitle={t('sub')}
      accent="var(--gold)"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '0.75rem' }}>
        <Field label={t('babyDob')} type="date" value={babyDob} onChange={e => setBabyDob(e.target.value)} />
        <Field label={t('parentA')} type="date" value={parentA} onChange={e => setParentA(e.target.value)} />
        <Field label={t('parentB')} type="date" value={parentB} onChange={e => setParentB(e.target.value)} />
        <Field label={t('draft')} value={candidate} maxLength={40} placeholder={t('draftPh')} onChange={e => setCandidate(e.target.value)} />
      </div>

      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{result.guidance}</p>

      {result.targetRoots.length > 0 && (
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
            {t('roots')}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {result.targetRoots.map(n => <NumberOrb key={n} value={n} size={36} />)}
          </div>
        </div>
      )}

      {result.scored && (
        <div style={{ padding: '0.85rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.45rem' }}>
            <NumberOrb value={result.scored.root} size={44} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {t('scored', { name: result.scored.name, compound: result.scored.compound, root: result.scored.root })}
              </div>
              <div style={{
                fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize',
                color: result.scored.verdict === 'excellent' || result.scored.verdict === 'good' ? 'var(--teal)'
                  : result.scored.verdict === 'acceptable' ? 'var(--gold)' : 'var(--rose)',
              }}>
                {tv(result.scored.verdict)}
              </div>
            </div>
          </div>
          {result.scored.babyHarmony && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              {t('vsM')} <HarmonyPill harmony={result.scored.babyHarmony.moolank} />
              {t('vsB')} <HarmonyPill harmony={result.scored.babyHarmony.bhagyank} />
            </div>
          )}
          {result.scored.compoundMeaning && (
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{result.scored.compoundMeaning}</p>
          )}
          {result.scored.tips.map(tip => (
            <div key={tip} style={{ fontSize: '0.74rem', color: 'var(--text-gold)', lineHeight: 1.4 }}>• {tip}</div>
          ))}
        </div>
      )}

      {result.luckyTotals.length > 0 && (
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
            {t('totals')}
          </div>
          <div style={gridColumns(140)}>
            {result.luckyTotals.map(row => (
              <div key={row.total} style={{ padding: '0.55rem 0.65rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                  {row.total} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>→ {row.root}</span>
                </div>
                {row.compoundTitle && (
                  <div style={{ fontSize: '0.68rem', color: row.quality ? QUALITY_COLOR[row.quality === 'fortunate' ? 'fortunate' : 'mixed'] : 'var(--text-muted)' }}>
                    {row.compoundTitle}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.startingLetters.length > 0 && (
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
            {t('letters')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {result.startingLetters.map(g => (
              <div key={g.root} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-gold)' }}>{g.root} · {g.planet}:</strong>{' '}
                <TagList items={g.letters.length ? g.letters : [t('useNine')]} />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{g.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  )
}
