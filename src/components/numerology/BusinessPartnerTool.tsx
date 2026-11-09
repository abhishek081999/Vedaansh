'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/BusinessPartnerTool.tsx
//  Business partnership matcher — roles, venture number, advice
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { matchBusinessPartners } from '@/lib/engine/numerology/tools'
import { getNumberProfile } from '@/lib/engine/numerology/data'
import { Field } from '@/components/ui/primitives/Field'
import { HarmonyPill, NumberOrb, SectionCard, gridColumns, useNumerologyLang } from './shared'

const VERDICT_COLOR = {
  strong: 'var(--teal)',
  workable: 'var(--gold)',
  strained: 'var(--rose)',
} as const

export function BusinessPartnerTool({ defaultDobA }: { defaultDobA?: string }) {
  const t = useTranslations('numerology.partnerTool')
  const tv = useTranslations('numerology.verdict')
  const lang = useNumerologyLang()
  const [nameA, setNameA] = useState('')
  const [dobA, setDobA] = useState(defaultDobA ?? '')
  const [nameB, setNameB] = useState('')
  const [dobB, setDobB] = useState('')

  const result = useMemo(() => {
    if (!dobA || !dobB) return null
    return matchBusinessPartners(
      { label: nameA.trim(), birthDate: dobA },
      { label: nameB.trim(), birthDate: dobB },
      lang,
    )
  }, [nameA, dobA, nameB, dobB, lang])

  return (
    <SectionCard
      title={t('title')}
      subtitle={t('sub')}
      accent="var(--gold)"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.75rem' }}>
        <Field label={t('nameA')} value={nameA} maxLength={40} placeholder={t('you')} onChange={e => setNameA(e.target.value)} />
        <Field label={t('dobA')} type="date" value={dobA} onChange={e => setDobA(e.target.value)} />
        <Field label={t('nameB')} value={nameB} maxLength={40} placeholder={t('partner')} onChange={e => setNameB(e.target.value)} />
        <Field label={t('dobB')} type="date" value={dobB} onChange={e => setDobB(e.target.value)} />
      </div>

      {!result && (
        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t('need')}</p>
      )}

      {result && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <NumberOrb value={result.a.moolank} size={40} />
              <NumberOrb value={result.a.bhagyank} size={40} muted />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{result.a.label}</span>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>×</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <NumberOrb value={result.b.moolank} size={40} />
              <NumberOrb value={result.b.bhagyank} size={40} muted />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{result.b.label}</span>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: VERDICT_COLOR[result.verdict] }}>{result.percent}%</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: VERDICT_COLOR[result.verdict] }}>{tv(result.verdict)}</div>
            </div>
          </div>

          {result.pairs.map(p => (
            <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>{p.label}</span>
              <HarmonyPill harmony={p.harmony} />
            </div>
          ))}

          <div style={gridColumns(220)}>
            <div style={{ padding: '0.7rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('venture')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: 4 }}>
                <NumberOrb value={result.ventureNumber} size={40} />
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {getNumberProfile(result.ventureNumber, lang).planet} — {result.ventureMeaning}
                </div>
              </div>
            </div>
            <div style={{ padding: '0.7rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('roles')}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <div><strong style={{ color: 'var(--text-gold)' }}>{result.a.label}:</strong> {result.roles.a}</div>
                <div style={{ marginTop: 4 }}><strong style={{ color: 'var(--text-gold)' }}>{result.b.label}:</strong> {result.roles.b}</div>
              </div>
            </div>
          </div>

          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {result.advice.map(a => <li key={a}>{a}</li>)}
          </ul>
        </>
      )}
    </SectionCard>
  )
}
