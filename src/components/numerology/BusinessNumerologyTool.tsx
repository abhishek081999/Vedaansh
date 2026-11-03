'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/BusinessNumerologyTool.tsx
//  Business name, launch date, logo initial and registration
//  number scored against the owner's core numbers
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { scoreBusiness, suggestLaunchDates } from '@/lib/engine/numerology/business'
import { getNameNumber } from '@/lib/engine/numerology/calc'
import { NUMBER_PROFILES, type CoreNumber } from '@/lib/engine/numerology/data'
import { Field } from '@/components/ui/primitives/Field'
import { HarmonyPill, NumberOrb, QUALITY_COLOR, SectionCard, gridColumns } from './shared'

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
  const [name, setName] = useState('')
  const [launchDate, setLaunchDate] = useState('')
  const [registration, setRegistration] = useState('')
  const [month, setMonth] = useState(() => monthValue(new Date()))

  const owner = useMemo(() => ({ moolank, bhagyank }), [moolank, bhagyank])
  const result = useMemo(
    () => (name.trim() ? scoreBusiness({ name, launchDate: launchDate || undefined, registration, owner }) : null),
    [name, launchDate, registration, owner],
  )
  const nameRoot = useMemo(() => (name.trim() ? getNameNumber(name)?.value ?? null : null), [name])
  const suggestions = useMemo(() => {
    const m = /^(\d{4})-(\d{2})$/.exec(month)
    if (!m) return []
    return suggestLaunchDates({ year: Number(m[1]), month: Number(m[2]), owner, nameRoot })
  }, [month, owner, nameRoot])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SectionCard
        title="Business Numerology"
        subtitle={`Name, launch date, logo initial and GST / PAN / CIN / phone, scored for owner Moolank ${moolank} and Bhagyank ${bhagyank}.`}
      >
        <div style={gridColumns(200)}>
          <Field label="Business / brand name" value={name} maxLength={120} placeholder="Shree Ganesh Traders" onChange={e => setName(e.target.value)} />
          <Field label="Launch / incorporation date" type="date" value={launchDate} onChange={e => setLaunchDate(e.target.value)} />
          <Field
            label="GST / PAN / CIN / phone"
            value={registration}
            maxLength={30}
            placeholder="27AAPFU0939F1ZV"
            onChange={e => setRegistration(e.target.value)}
            hint="Letters use Chaldean values; digits count at face value."
          />
        </div>

        {result && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', color: VERDICT_COLOR[result.verdict], lineHeight: 1 }}>{result.score}</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: VERDICT_COLOR[result.verdict], textTransform: 'capitalize' }}>{result.verdict}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Weighted: name ×3, date ×2, initial and registration ×1</div>
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
                        {p.compound > 9 ? `${p.compound} → ` : ''}{p.root} · {NUMBER_PROFILES[p.root].planet} · <span style={{ color: VERDICT_COLOR[p.score >= 63 ? 'good' : p.score >= 43 ? 'acceptable' : 'unfavourable'] }}>{p.score}</span>
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
            {result.tips.map(t => <div key={t} style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>• {t}</div>)}
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Launch Date Finder"
        subtitle={nameRoot ? `Dates that support you and the business name (root ${nameRoot}).` : 'Dates that support your Moolank and Bhagyank. Enter a business name to also match it.'}
      >
        <Field label="Month" type="month" value={month} onChange={e => setMonth(e.target.value)} />
        {suggestions.length > 0 ? (
          <div style={gridColumns(130)}>
            {suggestions.map(s => (
              <div key={s.date} style={{ padding: '0.5rem 0.6rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-gold)', fontSize: '0.85rem' }}>{s.date}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Date {s.dateRoot} · day {s.dayRoot} · {s.score}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>No strongly supportive dates this month — try the next one.</p>
        )}
        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confirm the final pick with the Muhurta tool for tithi, nakshatra and lagna.</p>
      </SectionCard>
    </div>
  )
}
