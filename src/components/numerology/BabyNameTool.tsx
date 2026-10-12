'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/BabyNameTool.tsx
//  Baby-name suggester — target roots, lucky totals, draft score
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { suggestBabyNames } from '@/lib/engine/numerology/tools'
import { Field } from '@/components/ui/primitives/Field'
import { HarmonyPill, NumberOrb, QUALITY_COLOR, SectionCard, TagList, gridColumns } from './shared'

export function BabyNameTool({ defaultParentDob }: { defaultParentDob?: string }) {
  const [babyDob, setBabyDob] = useState('')
  const [parentA, setParentA] = useState(defaultParentDob ?? '')
  const [parentB, setParentB] = useState('')
  const [candidate, setCandidate] = useState('')

  const result = useMemo(
    () => suggestBabyNames({
      babyDob: babyDob || undefined,
      parentDobs: [parentA, parentB].filter(Boolean),
      candidateName: candidate || undefined,
    }),
    [babyDob, parentA, parentB, candidate],
  )

  return (
    <SectionCard
      title="Baby Name Suggester"
      subtitle="Chaldean totals that support the baby's Moolank & Bhagyank (or both parents if DOB is not yet known)."
      accent="var(--gold)"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '0.75rem' }}>
        <Field label="Baby DOB (if known)" type="date" value={babyDob} onChange={e => setBabyDob(e.target.value)} />
        <Field label="Parent A DOB" type="date" value={parentA} onChange={e => setParentA(e.target.value)} />
        <Field label="Parent B DOB" type="date" value={parentB} onChange={e => setParentB(e.target.value)} />
        <Field label="Draft first name" value={candidate} maxLength={40} placeholder="e.g. Aryan" onChange={e => setCandidate(e.target.value)} />
      </div>

      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{result.guidance}</p>

      {result.targetRoots.length > 0 && (
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
            Ideal name roots
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
                {result.scored.name} · total {result.scored.compound} → {result.scored.root}
              </div>
              <div style={{
                fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize',
                color: result.scored.verdict === 'excellent' || result.scored.verdict === 'good' ? 'var(--teal)'
                  : result.scored.verdict === 'acceptable' ? 'var(--gold)' : 'var(--rose)',
              }}>
                {result.scored.verdict}
              </div>
            </div>
          </div>
          {result.scored.babyHarmony && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              vs baby Moolank <HarmonyPill harmony={result.scored.babyHarmony.moolank} />
              vs baby Bhagyank <HarmonyPill harmony={result.scored.babyHarmony.bhagyank} />
            </div>
          )}
          {result.scored.compoundMeaning && (
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{result.scored.compoundMeaning}</p>
          )}
          {result.scored.tips.map(t => (
            <div key={t} style={{ fontSize: '0.74rem', color: 'var(--text-gold)', lineHeight: 1.4 }}>• {t}</div>
          ))}
        </div>
      )}

      {result.luckyTotals.length > 0 && (
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
            Lucky name totals
          </div>
          <div style={gridColumns(140)}>
            {result.luckyTotals.map(t => (
              <div key={t.total} style={{ padding: '0.55rem 0.65rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                  {t.total} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>→ {t.root}</span>
                </div>
                {t.compoundTitle && (
                  <div style={{ fontSize: '0.68rem', color: t.quality ? QUALITY_COLOR[t.quality === 'fortunate' ? 'fortunate' : 'mixed'] : 'var(--text-muted)' }}>
                    {t.compoundTitle}
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
            Favourable starting letters (Chaldean)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {result.startingLetters.map(g => (
              <div key={g.root} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-gold)' }}>{g.root} · {g.planet}:</strong>{' '}
                <TagList items={g.letters.length ? g.letters : ['(use total → 9)']} />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{g.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  )
}
