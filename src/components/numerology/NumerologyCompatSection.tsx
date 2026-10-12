'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyCompatSection.tsx
//  Partner compatibility, mobile / vehicle / house number checker,
//  and the 9×9 number harmony matrix
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import {
  checkNumber,
  getBhagyank,
  getMoolank,
  HARMONY_LABEL,
  numberHarmony,
  parseBirthDate,
  type Harmony,
  type NumerologyReport,
} from '@/lib/engine/numerology/calc'
import { CORE_NUMBERS, NUMBER_PROFILES } from '@/lib/engine/numerology/data'
import { Field } from '@/components/ui/primitives/Field'
import { HARMONY_COLOR, HarmonyPill, NumberOrb, SectionCard, gridColumns } from './shared'
import { BusinessPartnerTool } from './BusinessPartnerTool'

const CHECK_KINDS = [
  { id: 'mobile', label: 'Mobile number', placeholder: '98765 43210' },
  { id: 'vehicle', label: 'Vehicle number', placeholder: 'MH 12 AB 1234' },
  { id: 'house', label: 'House / flat number', placeholder: '1204' },
  { id: 'other', label: 'Account / other', placeholder: 'Any number' },
] as const

const HARMONY_POINTS: Record<Harmony, number> = { excellent: 4, good: 3, neutral: 2, mixed: 1, challenging: 0 }

export function NumerologyCompatSection({ report }: { report: NumerologyReport }) {
  const { moolank, bhagyank, date } = report
  const selfDob = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`

  const [partnerDob, setPartnerDob] = useState('')
  const partner = useMemo(() => {
    const d = parseBirthDate(partnerDob)
    if (!d) return null
    const pm = getMoolank(d.day).value
    const pb = getBhagyank(d).value
    const pairs = [
      { label: `Your Moolank ${moolank.value} ↔ Partner Moolank ${pm}`, h: numberHarmony(moolank.value, pm), weight: 2 },
      { label: `Your Bhagyank ${bhagyank.value} ↔ Partner Bhagyank ${pb}`, h: numberHarmony(bhagyank.value, pb), weight: 1.5 },
      { label: `Your Moolank ${moolank.value} ↔ Partner Bhagyank ${pb}`, h: numberHarmony(moolank.value, pb), weight: 1 },
      { label: `Your Bhagyank ${bhagyank.value} ↔ Partner Moolank ${pm}`, h: numberHarmony(bhagyank.value, pm), weight: 1 },
    ]
    const max = pairs.reduce((s, p) => s + 4 * p.weight, 0)
    const got = pairs.reduce((s, p) => s + HARMONY_POINTS[p.h] * p.weight, 0)
    return { pm, pb, pairs, percent: Math.round((got / max) * 100) }
  }, [partnerDob, moolank.value, bhagyank.value])

  const [kind, setKind] = useState<(typeof CHECK_KINDS)[number]['id']>('mobile')
  const [numberInput, setNumberInput] = useState('')
  const check = useMemo(() => checkNumber(numberInput, moolank.value, bhagyank.value), [numberInput, moolank.value, bhagyank.value])
  const kindMeta = CHECK_KINDS.find(k => k.id === kind)!

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={gridColumns(300)}>
        <SectionCard title="Partner Compatibility" subtitle="Compare core numbers for marriage, business or friendship.">
          <Field label="Partner's date of birth" type="date" value={partnerDob} onChange={e => setPartnerDob(e.target.value)} />
          {partner && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <NumberOrb value={partner.pm} size={44} />
                <NumberOrb value={partner.pb} size={44} muted />
                <div>
                  <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', color: 'var(--text-gold)' }}>{partner.percent}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Numerological match</div>
                </div>
              </div>
              {partner.pairs.map(p => (
                <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span>{p.label}</span>
                  <HarmonyPill harmony={p.h} />
                </div>
              ))}
            </>
          )}
        </SectionCard>

        <SectionCard title="Number Checker" subtitle="Check if a mobile, vehicle, house or account number suits your Moolank and Bhagyank.">
          <div className="tab-bar" role="tablist" aria-label="Number type">
            {CHECK_KINDS.map(k => (
              <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} className={`tab-btn${kind === k.id ? ' active' : ''}`} onClick={() => setKind(k.id)}>
                {k.label.split(' ')[0]}
              </button>
            ))}
          </div>
          <Field
            label={kindMeta.label}
            value={numberInput}
            placeholder={kindMeta.placeholder}
            inputMode={kind === 'vehicle' ? 'text' : 'numeric'}
            maxLength={40}
            onChange={e => setNumberInput(e.target.value)}
            hint={kind === 'vehicle' ? 'Only the digits are counted.' : undefined}
          />
          {check && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <NumberOrb value={check.root} size={44} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize', color: check.verdict === 'favourable' ? 'var(--teal)' : check.verdict === 'acceptable' ? 'var(--gold)' : 'var(--rose)' }}>
                    {check.verdict}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Total {check.compound} → {check.root} ({NUMBER_PROFILES[check.root].planet})
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                With Moolank <HarmonyPill harmony={check.moolankHarmony} /> With Bhagyank <HarmonyPill harmony={check.bhagyankHarmony} />
              </div>
              {check.conflictingDigits.length > 0 && (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Contains digits that conflict with your Moolank: <strong style={{ color: 'var(--rose)' }}>{check.conflictingDigits.join(', ')}</strong>
                </div>
              )}
              {kind === 'mobile' && check.zeroCount >= 3 && (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Many zeros ({check.zeroCount}) weaken a mobile number&apos;s vibration in Indian numerology.
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Number Harmony Matrix" subtitle="How each number relates to every other (row ↔ column). Your Moolank and Bhagyank rows are highlighted.">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: '0.72rem', margin: '0 auto' }}>
            <thead>
              <tr>
                <th />
                {CORE_NUMBERS.map(n => (
                  <th key={n} style={{ padding: '0.25rem', color: 'var(--text-gold)', fontWeight: 700 }}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CORE_NUMBERS.map(r => {
                const mine = r === moolank.value || r === bhagyank.value
                return (
                  <tr key={r}>
                    <th style={{ padding: '0.25rem 0.5rem', color: mine ? 'var(--text-gold)' : 'var(--text-muted)', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {r} <span style={{ fontWeight: 400 }}>{NUMBER_PROFILES[r].graha}</span>
                    </th>
                    {CORE_NUMBERS.map(c => {
                      const h = numberHarmony(r, c)
                      return (
                        <td
                          key={c}
                          title={`${r} ↔ ${c}: ${HARMONY_LABEL[h]}`}
                          style={{
                            width: 30, height: 26, textAlign: 'center', borderRadius: 4,
                            color: HARMONY_COLOR[h], fontWeight: 700,
                            background: mine ? 'var(--gold-faint)' : 'var(--surface-2)',
                            border: `1px solid ${mine ? 'var(--border-bright)' : 'var(--border-soft)'}`,
                          }}
                        >
                          {HARMONY_LABEL[h][0]}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', fontSize: '0.7rem', justifyContent: 'center' }}>
          {(['excellent', 'good', 'neutral', 'mixed', 'challenging'] as const).map(h => (
            <span key={h} style={{ color: HARMONY_COLOR[h] }}>{HARMONY_LABEL[h][0]} = {HARMONY_LABEL[h]}</span>
          ))}
        </div>
      </SectionCard>

      <BusinessPartnerTool defaultDobA={selfDob} />
    </div>
  )
}
