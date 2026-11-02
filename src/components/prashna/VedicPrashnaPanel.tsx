'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/VedicPrashnaPanel.tsx
//  Vedic praśna reading: significators, weighted factors, Tajika links, timing.
// ─────────────────────────────────────────────────────────────

import { AlertTriangle, Clock, Scale, Target } from 'lucide-react'
import type { VedicPolarity, VedicPrashnaReading } from '@/lib/engine/vedicPrashna'
import { grahaName, ordinal } from '@/lib/engine/satpanchasikaFacts'
import type { StabilityResult } from '@/lib/engine/prashnaStability'
import { Section, StabilitySection, VERDICT_STYLE, approxDate } from './SatpanchasikaPanel'

const POLARITY: Record<VedicPolarity, { color: string; label: string }> = {
  favourable: { color: 'var(--teal)', label: 'Favourable' },
  unfavourable: { color: 'var(--rose)', label: 'Unfavourable' },
  mixed: { color: 'var(--gold)', label: 'Mixed' },
  descriptive: { color: 'var(--text-secondary)', label: 'Note' },
}

const GROUPS = ['Significators', 'Their connection', 'Tajika', 'The Moon', 'The house'] as const

export function VedicPrashnaPanel({ reading: r, questionText, stability, askedOn }: {
  reading: VedicPrashnaReading
  questionText: string
  stability: StabilityResult | null
  askedOn?: string
}) {
  const v = VERDICT_STYLE[r.verdict]
  const s = r.significators
  const chips = [
    { label: 'Querist (lagna lord)', value: grahaName(s.lagnaLord) },
    { label: `Matter (${ordinal(s.karyaHouse)} lord)`, value: grahaName(s.karyaLord) },
    { label: 'Kāraka', value: grahaName(s.karaka) },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
      <div style={{ borderRadius: 12, border: '1px solid var(--border)', borderTop: `4px solid ${v.color}`, background: 'var(--surface-1)', padding: '1rem 1.1rem' }}>
        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vedic praśna · {r.topicLabel}</div>
        <h2 style={{ fontSize: '1.3rem', margin: '0.3rem 0', color: v.color, fontFamily: 'var(--font-display)', lineHeight: 1.25 }}>{r.headline}</h2>
        {questionText && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 0.4rem' }}>&quot;{questionText}&quot;</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 1rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 700, color: v.color }}>{v.label}</span>
          <span>Signal clarity {r.clarity}%</span>
          <span>Weights: for {r.weights.favourable.toFixed(1)} · against {r.weights.unfavourable.toFixed(1)} · mixed {r.weights.mixed.toFixed(1)}</span>
        </div>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Strength comes from {r.strengthSource === 'shadbala' ? 'each planet\'s ṣaḍbala' : 'dignity, because ṣaḍbala was unavailable'}. Clarity shows how one-sided the signals are; it is not a probability.
        </p>
      </div>

      <div role="note" style={{ display: 'flex', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
        <AlertTriangle size={15} aria-hidden style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
          {r.notices.map(n => <span key={n}>{n}</span>)}
        </div>
      </div>

      <Section title="Significators" Icon={Target} accent="var(--teal)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
          {chips.map(c => (
            <div key={c.label} style={{ padding: '0.45rem 0.6rem', background: 'var(--surface-2)', borderRadius: 7, border: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{c.label}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-gold)' }}>{c.value}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Factors weighed (${r.factors.length})`} Icon={Scale}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {GROUPS.map(group => {
            const items = r.factors.filter(x => x.group === group)
            if (!items.length) return null
            return (
              <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group}</h3>
                {items.map(x => {
                  const p = POLARITY[x.polarity]
                  return (
                    <div key={x.id} style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.65rem', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)', borderLeft: `3px solid ${p.color}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{x.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45, marginTop: 2 }}>{x.detail}</div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: '0.66rem', fontWeight: 700, color: p.color }}>{p.label}</div>
                        {x.weight > 0 && <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>weight {x.weight.toFixed(1)}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Timing" Icon={Clock} accent="var(--amber)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.45rem' }}>
          {r.timing.map(t => (
            <div key={t.name} style={{ padding: '0.55rem 0.65rem', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gold)' }}>{t.name}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.15rem 0' }}>{t.value}</div>
              {t.days !== undefined && askedOn && <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>Around {approxDate(askedOn, t.days, 'days')}</div>}
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{t.working}</div>
            </div>
          ))}
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.66rem', color: 'var(--text-muted)' }}>Separate methods, not added or averaged.</p>
      </Section>

      {stability && <StabilitySection stability={stability} />}
    </div>
  )
}
