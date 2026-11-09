'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/BusinessNumerologyTool.tsx
//  Business name, launch date, logo initial and registration
//  number scored against the owner's core numbers
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { scoreBusiness, suggestLaunchDates } from '@/lib/engine/numerology/business'
import { getNameNumber } from '@/lib/engine/numerology/calc'
import { getNumberProfile, type CoreNumber } from '@/lib/engine/numerology/data'
import { Field } from '@/components/ui/primitives/Field'
import { HarmonyPill, NumberOrb, QUALITY_COLOR, SectionCard, gridColumns, useNumerologyLang } from './shared'

const VERDICT_COLOR = {
  excellent: 'var(--teal)',
  good: 'var(--teal)',
  acceptable: 'var(--gold)',
  unfavourable: 'var(--rose)',
} as const

function monthValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function BusinessNumerologyTool({ moolank, bhagyank }: { moolank: CoreNumber; bhagyank: CoreNumber }) {
  const t = useTranslations('numerology.business')
  const tv = useTranslations('numerology.verdict')
  const lang = useNumerologyLang()
  const [name, setName] = useState('')
  const [launchDate, setLaunchDate] = useState('')
  const [registration, setRegistration] = useState('')
  const [month, setMonth] = useState(() => monthValue(new Date()))

  const owner = useMemo(() => ({ moolank, bhagyank }), [moolank, bhagyank])
  const result = useMemo(
    () => (name.trim() ? scoreBusiness({ name, launchDate: launchDate || undefined, registration, owner, lang }) : null),
    [name, launchDate, registration, owner, lang],
  )
  const nameRoot = useMemo(() => (name.trim() ? getNameNumber(name, 'chaldean', lang)?.value ?? null : null), [name, lang])
  const suggestions = useMemo(() => {
    const m = /^(\d{4})-(\d{2})$/.exec(month)
    if (!m) return []
    return suggestLaunchDates({ year: Number(m[1]), month: Number(m[2]), owner, nameRoot })
  }, [month, owner, nameRoot])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SectionCard
        title={t('title')}
        subtitle={t('sub', { m: moolank, b: bhagyank })}
      >
        <div style={gridColumns(200)}>
          <Field label={t('name')} value={name} maxLength={120} placeholder={t('namePh')} onChange={e => setName(e.target.value)} />
          <Field label={t('launch')} type="date" value={launchDate} onChange={e => setLaunchDate(e.target.value)} />
          <Field
            label={t('reg')}
            value={registration}
            maxLength={30}
            placeholder="27AAPFU0939F1ZV"
            onChange={e => setRegistration(e.target.value)}
            hint={t('hint')}
          />
        </div>

        {result && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', color: VERDICT_COLOR[result.verdict], lineHeight: 1 }}>{result.score}</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: VERDICT_COLOR[result.verdict], textTransform: 'capitalize' }}>{tv(result.verdict)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('weights')}</div>
              </div>
            </div>
            <div style={gridColumns(230)}>
              {result.parts.map(p => (
                <div key={p.id} style={{ padding: '0.7rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <NumberOrb value={p.root} size={34} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.value}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {p.compound > 9 ? `${p.compound} → ` : ''}{p.root} · {getNumberProfile(p.root, lang).planet} · <span style={{ color: VERDICT_COLOR[p.score >= 63 ? 'good' : p.score >= 43 ? 'acceptable' : 'unfavourable'] }}>{p.score}</span>
                      </div>
                    </div>
                  </div>
                  {p.compoundMeaning && (
                    <div style={{ fontSize: '0.7rem', color: QUALITY_COLOR[p.compoundMeaning.quality] }}>{p.compoundMeaning.title}</div>
                  )}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    M <HarmonyPill harmony={p.moolankHarmony} /> B <HarmonyPill harmony={p.bhagyankHarmony} />
                  </div>
                  {p.note && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.note}</div>}
                </div>
              ))}
            </div>
            {result.tips.map(tip => <div key={tip} style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>• {tip}</div>)}
          </>
        )}
      </SectionCard>

      <SectionCard
        title={t('finderTitle')}
        subtitle={nameRoot ? t('finderKnown', { root: nameRoot }) : t('finderUnknown')}
      >
        <Field label={t('month')} type="month" value={month} onChange={e => setMonth(e.target.value)} />
        {suggestions.length > 0 ? (
          <div style={gridColumns(130)}>
            {suggestions.map(s => (
              <div key={s.date} style={{ padding: '0.5rem 0.6rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-gold)', fontSize: '0.85rem' }}>{s.date}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('dateLine', { dateRoot: s.dateRoot, dayRoot: s.dayRoot, score: s.score })}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t('none')}</p>
        )}
        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('muhurta')}</p>
      </SectionCard>
    </div>
  )
}
