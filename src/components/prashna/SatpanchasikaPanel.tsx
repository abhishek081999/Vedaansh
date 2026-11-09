'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/SatpanchasikaPanel.tsx
//  Ṣaṭpañcāśikā reading: verdict, fired rules, timing, lost-item details,
//  what was not evaluated, the 8-step method and interpretive decisions.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Activity, AlertTriangle, BookOpen, ChevronDown, ChevronRight, Clock, Compass, Copy, Info, ListChecks, Orbit, Scale,
  type LucideIcon,
} from 'lucide-react'
import {
  SATPANCHASIKA_INTERPRETIVE_NOTES,
  type FiredRule,
  type RulePolarity,
  type SatpanchasikaReading,
  type SatpanchasikaVerdict,
} from '@/lib/engine/satpanchasikaEngine'
import { getSatpanchasikaSloka } from '@/lib/engine/satpanchasikaSlokas'
import type { StabilityResult } from '@/lib/engine/prashnaStability'

export const VERDICT_STYLE: Record<SatpanchasikaVerdict, { color: string; label: string }> = {
  favourable: { color: 'var(--teal)', label: 'Favourable' },
  with_difficulty: { color: 'var(--gold)', label: 'With difficulty' },
  leans_unfavourable: { color: 'var(--amber)', label: 'Leans against' },
  unfavourable: { color: 'var(--rose)', label: 'Unfavourable' },
  no_change: { color: 'var(--text-secondary)', label: 'No change' },
  indication_only: { color: 'var(--text-secondary)', label: 'Indications' },
  insufficient: { color: 'var(--text-muted)', label: 'Too few signals' },
}

const POLARITY_STYLE: Record<RulePolarity, { color: string; label: string }> = {
  favourable: { color: 'var(--teal)', label: 'Favourable' },
  unfavourable: { color: 'var(--rose)', label: 'Unfavourable' },
  mixed: { color: 'var(--gold)', label: 'Mixed' },
  no_change: { color: 'var(--text-secondary)', label: 'No change' },
  descriptive: { color: 'var(--text-secondary)', label: 'Descriptive' },
}

export function Section({ title, Icon, accent = 'var(--gold)', defaultOpen = true, children }: {
  title: string
  Icon: LucideIcon
  accent?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const Chevron = open ? ChevronDown : ChevronRight
  return (
    <section style={{ background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-soft)', borderLeft: `3px solid ${accent}`, overflow: 'hidden' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', color: accent, textAlign: 'left' }}
      >
        <Icon size={15} aria-hidden style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>{title}</span>
        <Chevron size={15} aria-hidden style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>
      {open && <div style={{ padding: '0.75rem' }}>{children}</div>}
    </section>
  )
}

export function SlokaText({ id }: { id: string }) {
  const sloka = getSatpanchasikaSloka(id)
  if (!sloka) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <p lang="sa" style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-gold)' }}>{sloka.sanskrit}</p>
      <p style={{ margin: 0, fontSize: '0.76rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>{sloka.meaning}</p>
      {sloka.checkAgainstPrint && (
        <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--amber)' }}>First half is faint in the scan: check against the print.</p>
      )}
    </div>
  )
}

function RuleRow({ rule }: { rule: FiredRule }) {
  const [open, setOpen] = useState(false)
  const style = POLARITY_STYLE[rule.polarity]
  const Chevron = open ? ChevronDown : ChevronRight
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)', borderLeft: `3px solid ${style.color}` }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', gap: '0.5rem', padding: '0.55rem 0.65rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit', alignItems: 'flex-start' }}
      >
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--gold)', flexShrink: 0, minWidth: '2.1rem' }}>{rule.slokaId}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{rule.statement}</span>
          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45, marginTop: 2 }}>{rule.facts.join(' · ')}</span>
        </span>
        <span style={{ flexShrink: 0, textAlign: 'right' }}>
          <span style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: style.color }}>{style.label}</span>
          {rule.weight > 0 && <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)' }}>weight {rule.weight.toFixed(1)}</span>}
        </span>
        <Chevron size={14} aria-hidden style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
      </button>
      {open && (
        <div style={{ padding: '0 0.65rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SlokaText id={rule.slokaId} />
          <p style={{ margin: 0, fontSize: '0.66rem', color: 'var(--text-muted)' }}>
            {rule.label}. Base {rule.baseWeight} × strength {rule.strengthFactor}{rule.repeated ? ' × 1.25 (stated twice in the text)' : ''}.
          </p>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, working }: { label: string; value: string; working: string }) {
  return (
    <div style={{ padding: '0.45rem 0', borderBottom: '1px solid var(--border-soft)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.15rem 0.75rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.45, marginTop: 2 }}>{working}</div>
    </div>
  )
}

function readingAsText(r: SatpanchasikaReading, question: string): string {
  return [
    'SATPANCHASIKA READING',
    question ? `Question: ${question}` : '',
    `Type: ${r.questionLabel}`,
    `Reading: ${r.headline}`,
    '',
    'RULES THAT FIRED',
    ...r.fired.map(x => `${x.slokaId} [${x.polarity}, ${x.weight}] ${x.statement} (${x.facts.join('; ')})`),
    '',
    r.timing.length ? 'TIMING (separate methods, not added together)' : '',
    ...r.timing.map(t => `${t.slokas} ${t.name}: ${t.value ?? '-'} ${t.unit === 'event' ? '' : t.unit}. ${t.working}`),
    '',
    ...r.notices,
  ].filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n')
}

/** Calendar date a span after the question (yyyy-MM-dd), with no timezone drift. */
export function approxDate(askedOn: string, value: number, unit: 'months' | 'days' | 'event'): string | null {
  const [y, m, d] = askedOn.split('-').map(Number)
  if (!y || !m || !d || unit === 'event') return null
  const date = unit === 'months' ? new Date(Date.UTC(y, m - 1 + value, d)) : new Date(Date.UTC(y, m - 1, d + value))
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function StabilitySection({ stability }: { stability: StabilityResult }) {
  return (
    <Section title={stability.stable ? 'Time sensitivity: stable' : 'Time sensitivity: changes nearby'} Icon={Activity} accent={stability.stable ? 'var(--teal)' : 'var(--amber)'}>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.76rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{stability.summary}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
        {stability.points.map(p => (
          <div key={p.offsetDegrees} style={{ padding: '0.4rem 0.55rem', background: 'var(--surface-2)', borderRadius: 7, border: `1px solid ${p.changed ? 'var(--amber)' : 'var(--border-soft)'}` }}>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>About {p.approxMinutes > 0 ? '+' : ''}{p.approxMinutes} min · {p.lagna}</div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: p.changed ? 'var(--amber)' : 'var(--text-secondary)' }}>{p.verdict}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function PlanetTable({ reading }: { reading: SatpanchasikaReading }) {
  return (
    <Section title="How the engine sees each planet" Icon={Orbit} defaultOpen={false}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
              {['Planet', 'House', 'Sign', 'Navāṃśa', 'Nature', 'Strength'].map(h => (
                <th key={h} style={{ padding: '0.3rem 0.4rem', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reading.planets.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>
                <td style={{ padding: '0.3rem 0.4rem', fontWeight: 700, color: 'var(--text-gold)', whiteSpace: 'nowrap' }}>{p.name}{p.retrograde ? ' (R)' : ''}</td>
                <td style={{ padding: '0.3rem 0.4rem' }}>{p.house}</td>
                <td style={{ padding: '0.3rem 0.4rem' }}>{p.sign}</td>
                <td style={{ padding: '0.3rem 0.4rem' }}>{p.navamsa}</td>
                <td style={{ padding: '0.3rem 0.4rem', color: p.nature === 'Benefic' ? 'var(--teal)' : 'var(--rose)' }} title={p.natureReason}>{p.nature}</td>
                <td style={{ padding: '0.3rem 0.4rem', whiteSpace: 'nowrap' }}>{p.strength.toFixed(2)}{p.isStrongest ? ' (strongest)' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

export function SatpanchasikaPanel({ reading: r, questionText, stability, askedOn }: { reading: SatpanchasikaReading; questionText: string; stability?: StabilityResult | null; askedOn?: string }) {
  const tr = useTranslations('prashna.sat')
  const tv = useTranslations('prashna.verdict')
  const [copied, setCopied] = useState(false)
  const v = VERDICT_STYLE[r.verdict]
  const showClarity = r.verdict !== 'indication_only' && r.verdict !== 'insufficient'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(readingAsText(r, questionText))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
      {/* Verdict */}
      <div style={{ borderRadius: 12, border: '1px solid var(--border)', borderTop: `4px solid ${v.color}`, background: 'var(--surface-1)', padding: '1rem 1.1rem' }}>
        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tr('kicker', { topic: r.questionLabel })}</div>
        <h2 style={{ fontSize: '1.3rem', margin: '0.3rem 0', color: v.color, fontFamily: 'var(--font-display)', lineHeight: 1.25 }}>{r.headline}</h2>
        {questionText && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 0.4rem' }}>&quot;{questionText}&quot;</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 1rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 700, color: v.color }}>{tv(r.verdict)}</span>
          {showClarity && <span>{tr('clarity', { n: r.clarity })}</span>}
          {r.verdict !== 'indication_only' && (
            <span>{tr('weights', { for: r.weights.favourable.toFixed(1), against: r.weights.unfavourable.toFixed(1), mixed: r.weights.mixed.toFixed(1), still: r.weights.noChange.toFixed(1) })}</span>
          )}
        </div>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {tr('strength', { source: r.strengthSource === 'shadbala' ? tr('shadbala') : tr('dignity') })}
        </p>
      </div>

      {/* Notices */}
      <div role="note" style={{ display: 'flex', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
        <AlertTriangle size={15} aria-hidden style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
          {r.notices.map(n => <span key={n}>{n}</span>)}
        </div>
      </div>

      {/* Rules that fired */}
      <Section title={tr('fired', { n: r.fired.length })} Icon={Scale}>
        {r.fired.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>{tr('noneFired')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {r.fired.map(rule => <RuleRow key={rule.ruleId} rule={rule} />)}
          </div>
        )}
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
          {tr('firedFoot', { n: r.notFiredCount, rules: r.notFiredCount === 1 ? tr('rule') : tr('rules') })}
        </p>
      </Section>

      {/* Timing */}
      <Section title={tr('timing')} Icon={Clock} accent="var(--amber)">
        {r.timingNote ? (
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.timingNote}</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.45rem' }}>
              {r.timing.map(t => {
                const date = t.status === 'computed' && t.value !== null && askedOn ? approxDate(askedOn, t.value, t.unit) : null
                return (
                  <div key={t.id} style={{ padding: '0.55rem 0.65rem', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gold)' }}>{t.name} · {t.slokas}</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: t.basis === 'text' ? 'var(--teal)' : 'var(--amber)' }}>{t.basis === 'text' ? 'From the text' : 'Adapted'}</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: t.status === 'computed' ? 'var(--text-primary)' : 'var(--text-muted)', margin: '0.15rem 0' }}>
                      {t.status === 'computed' ? (t.value === 0 ? 'Now' : `${t.value} ${t.unit}`) : t.status === 'event' ? 'On an event' : 'Void'}
                    </div>
                    {date && <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>Around {date}</div>}
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{t.purpose}. {t.working}</div>
                  </div>
                )
              })}
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.66rem', color: 'var(--text-muted)' }}>Dates count from the moment of the question. Each method is separate: they are not added or averaged.</p>
          </>
        )}
        {r.paceNotes.length > 0 && <p style={{ margin: '0.5rem 0 0', fontSize: '0.74rem', fontWeight: 600, color: 'var(--teal)' }}>{r.paceNotes.join(' ')}</p>}
        {r.timingCaveat && <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', lineHeight: 1.5, color: 'var(--amber)' }}>{r.timingCaveat}</p>}
      </Section>

      {/* Lost item */}
      {r.lostItem && (
        <Section title={tr('lost')} Icon={Compass} accent="var(--teal)">
          <DetailRow label="What it is" value={r.lostItem.object.kind} working={r.lostItem.object.working + (r.lostItem.objectBy16 ? ` Also ${r.lostItem.objectBy16}` : '')} />
          <DetailRow label="Who has it" value={r.lostItem.whoHolds.value} working={r.lostItem.whoHolds.working} />
          <DetailRow label="Where" value={r.lostItem.where.place} working={r.lostItem.where.working} />
          <DetailRow label="Direction" value={r.lostItem.direction.value} working={r.lostItem.direction.working} />
          <DetailRow label="Distance" value={`${r.lostItem.distance.steps} ${r.lostItem.distance.steps === 1 ? 'step' : 'steps'}`} working={r.lostItem.distance.working} />
          <DetailRow label="When lost" value={r.lostItem.whenLost.value} working={r.lostItem.whenLost.working} />
          <DetailRow label="Age of the person involved" value={r.lostItem.personAge.value} working={r.lostItem.personAge.working} />
        </Section>
      )}

      {stability && <StabilitySection stability={stability} />}

      <PlanetTable reading={r} />

      {/* Subject */}
      <Section key={r.question} title={tr('concernsTitle')} Icon={Info} defaultOpen={['whom', 'object_class', 'person_age'].includes(r.question)}>
        <DetailRow label="Concerns" value={r.subject.concerns} working={r.subject.concernsWorking} />
        <DetailRow label="Class of the query" value={r.subject.classBy17} working={r.subject.classBy16 ? `From the rising navāṃśa (1.7). Also ${r.subject.classBy16}` : 'From the rising navāṃśa (1.7).'} />
        {r.subject.navamsaRelation && <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{r.subject.navamsaRelation}</p>}
        {r.subject.personAge && <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{r.subject.personAge}</p>}
      </Section>

      {/* Not evaluated */}
      <Section title={`Not evaluated (${r.notEvaluated.length})`} Icon={AlertTriangle} accent="var(--text-muted)" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {r.notEvaluated.map(n => (
            <div key={n.ruleId} style={{ fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--gold)' }}>{n.slokaId}</strong> {n.label}: {n.reason}
            </div>
          ))}
        </div>
      </Section>

      {/* Method */}
      <Section title={tr('method')} Icon={ListChecks} defaultOpen={false}>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {r.steps.map(s => (
            <li key={s.step} style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.66rem', fontWeight: 700, flexShrink: 0 }}>{s.step}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.title} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({s.slokas})</span></div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.summary}</div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Decisions */}
      <Section title={tr('interpreted')} Icon={BookOpen} accent="var(--text-muted)" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {SATPANCHASIKA_INTERPRETIVE_NOTES.map(n => (
            <div key={n.note} style={{ fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--gold)' }}>{n.slokas}</strong> {n.note}
            </div>
          ))}
        </div>
      </Section>

      <button type="button" className="btn btn-ghost btn-sm" onClick={copy} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Copy size={13} aria-hidden /> {copied ? tr('copied') : tr('copy')}
      </button>
    </div>
  )
}
