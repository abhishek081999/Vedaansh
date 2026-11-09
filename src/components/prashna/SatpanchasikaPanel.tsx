'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/SatpanchasikaPanel.tsx
//  Ṣaṭpañcāśikā reading: verdict, fired rules, timing, lost-item details,
//  what was not evaluated, the 8-step method and interpretive decisions.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { RASHI_HI } from '@/i18n/jyotish'
import { RASHI_NAMES } from '@/types/astrology'
import {
  Activity, AlertTriangle, BookOpen, ChevronDown, ChevronRight, Clock, Compass, Copy, Info, ListChecks, Orbit, Scale,
  type LucideIcon,
} from 'lucide-react'
import {
  satpanchasikaInterpretiveNotes,
  satpanchasikaText,
  type FiredRule,
  type RulePolarity,
  type SatpanchasikaReading,
  type SatpanchasikaVerdict,
} from '@/lib/engine/satpanchasikaEngine'
import { getSatpanchasikaSloka } from '@/lib/engine/satpanchasikaSlokas'
import type { StabilityResult } from '@/lib/engine/prashnaStability'
import type { EngineLang } from '@/lib/engine/lang'

/** Verdict colours; the labels live in `prashna.verdict`. */
export const VERDICT_STYLE: Record<SatpanchasikaVerdict, { color: string }> = {
  favourable: { color: 'var(--teal)' },
  with_difficulty: { color: 'var(--gold)' },
  leans_unfavourable: { color: 'var(--amber)' },
  unfavourable: { color: 'var(--rose)' },
  no_change: { color: 'var(--text-secondary)' },
  indication_only: { color: 'var(--text-secondary)' },
  insufficient: { color: 'var(--text-muted)' },
}

const POLARITY_COLOR: Record<RulePolarity, string> = {
  favourable: 'var(--teal)',
  unfavourable: 'var(--rose)',
  mixed: 'var(--gold)',
  no_change: 'var(--text-secondary)',
  descriptive: 'var(--text-secondary)',
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
  const tr = useTranslations('prashna.sat')
  const { lang } = useLang()
  const sloka = getSatpanchasikaSloka(id, lang)
  if (!sloka) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <p lang="sa" style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-gold)' }}>{sloka.sanskrit}</p>
      <p style={{ margin: 0, fontSize: '0.76rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>{sloka.meaning}</p>
      {sloka.checkAgainstPrint && (
        <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--amber)' }}>{tr('faint')}</p>
      )}
    </div>
  )
}

function RuleRow({ rule }: { rule: FiredRule }) {
  const tr = useTranslations('prashna.sat')
  const tp = useTranslations('prashna.polarity')
  const [open, setOpen] = useState(false)
  const color = POLARITY_COLOR[rule.polarity]
  const Chevron = open ? ChevronDown : ChevronRight
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)', borderLeft: `3px solid ${color}` }}>
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
          <span style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color }}>{tp(rule.polarity)}</span>
          {rule.weight > 0 && <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)' }}>{tr('weight', { n: rule.weight.toFixed(1) })}</span>}
        </span>
        <Chevron size={14} aria-hidden style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
      </button>
      {open && (
        <div style={{ padding: '0 0.65rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SlokaText id={rule.slokaId} />
          <p style={{ margin: 0, fontSize: '0.66rem', color: 'var(--text-muted)' }}>
            {tr('weightMath', { label: rule.label, base: rule.baseWeight, strength: rule.strengthFactor, repeat: rule.repeated ? tr('repeated') : '' })}
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

function readingAsText(
  r: SatpanchasikaReading,
  question: string,
  tr: (key: string, values?: Record<string, string | number>) => string,
  tp: (key: string) => string,
  lang: EngineLang,
): string {
  return [
    tr('copyHead'),
    question ? tr('copyQuestion', { q: question }) : '',
    tr('copyType', { type: r.questionLabel }),
    tr('copyReading', { headline: r.headline }),
    '',
    tr('copyRules'),
    ...r.fired.map(x => `${x.slokaId} [${tp(x.polarity)}, ${x.weight}] ${x.statement} (${x.facts.join('; ')})`),
    '',
    r.timing.length ? tr('copyTiming') : '',
    ...r.timing.map(t => `${t.slokas} ${t.name}: ${t.value ?? '-'} ${t.unit === 'event' ? '' : satpanchasikaText(t.unit, lang)}. ${t.working}`),
    '',
    ...r.notices,
  ].filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n')
}

/** Calendar date a span after the question (yyyy-MM-dd), with no timezone drift. */
export function approxDate(askedOn: string, value: number, unit: 'months' | 'days' | 'event', lang: EngineLang = 'en'): string | null {
  const [y, m, d] = askedOn.split('-').map(Number)
  if (!y || !m || !d || unit === 'event') return null
  const date = unit === 'months' ? new Date(Date.UTC(y, m - 1 + value, d)) : new Date(Date.UTC(y, m - 1, d + value))
  return date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function StabilitySection({ stability }: { stability: StabilityResult }) {
  const tr = useTranslations('prashna.sat')
  const { lang } = useLang()
  const sign = (n: StabilityResult['points'][number]['lagnaRashi']) => (lang === 'hi' ? RASHI_HI[n] : RASHI_NAMES[n])
  return (
    <Section title={stability.stable ? tr('stable') : tr('unstable')} Icon={Activity} accent={stability.stable ? 'var(--teal)' : 'var(--amber)'}>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.76rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
        {stability.changesWithin === null ? tr('stableSummary') : tr('unstableSummary', { min: stability.changesWithin })}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
        {stability.points.map(p => (
          <div key={p.offsetDegrees} style={{ padding: '0.4rem 0.55rem', background: 'var(--surface-2)', borderRadius: 7, border: `1px solid ${p.changed ? 'var(--amber)' : 'var(--border-soft)'}` }}>
            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{tr('aboutMin', { sign: p.approxMinutes > 0 ? '+' : '', min: p.approxMinutes, lagna: `${sign(p.lagnaRashi)} ${p.lagnaDegree.toFixed(1)}°` })}</div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: p.changed ? 'var(--amber)' : 'var(--text-secondary)' }}>{p.verdict}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function PlanetTable({ reading }: { reading: SatpanchasikaReading }) {
  const tr = useTranslations('prashna.sat')
  const { lang } = useLang()
  return (
    <Section title={tr('planets')} Icon={Orbit} defaultOpen={false}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
              {[tr('colPlanet'), tr('colHouse'), tr('colSign'), tr('colNav'), tr('colNature'), tr('colStrength')].map(h => (
                <th key={h} style={{ padding: '0.3rem 0.4rem', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reading.planets.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>
                <td style={{ padding: '0.3rem 0.4rem', fontWeight: 700, color: 'var(--text-gold)', whiteSpace: 'nowrap' }}>{p.name}{p.retrograde ? tr('retro') : ''}</td>
                <td style={{ padding: '0.3rem 0.4rem' }}>{p.house}</td>
                <td style={{ padding: '0.3rem 0.4rem' }}>{p.sign}</td>
                <td style={{ padding: '0.3rem 0.4rem' }}>{p.navamsa}</td>
                <td style={{ padding: '0.3rem 0.4rem', color: p.nature === 'Benefic' ? 'var(--teal)' : 'var(--rose)' }} title={p.natureReason}>{satpanchasikaText(p.nature, lang)}</td>
                <td style={{ padding: '0.3rem 0.4rem', whiteSpace: 'nowrap' }}>{p.strength.toFixed(2)}{p.isStrongest ? tr('strongest') : ''}</td>
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
  const tp = useTranslations('prashna.polarity')
  const { lang } = useLang()
  const [copied, setCopied] = useState(false)
  const v = VERDICT_STYLE[r.verdict]
  const showClarity = r.verdict !== 'indication_only' && r.verdict !== 'insufficient'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(readingAsText(r, questionText, tr, tp, lang))
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
                const date = t.status === 'computed' && t.value !== null && askedOn ? approxDate(askedOn, t.value, t.unit, lang) : null
                return (
                  <div key={t.id} style={{ padding: '0.55rem 0.65rem', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gold)' }}>{t.name} · {t.slokas}</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: t.basis === 'text' ? 'var(--teal)' : 'var(--amber)' }}>{t.basis === 'text' ? tr('fromText') : tr('adapted')}</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: t.status === 'computed' ? 'var(--text-primary)' : 'var(--text-muted)', margin: '0.15rem 0' }}>
                      {t.status === 'computed' ? (t.value === 0 ? tr('now') : `${t.value} ${satpanchasikaText(t.unit, lang)}`) : t.status === 'event' ? tr('onEvent') : tr('void')}
                    </div>
                    {date && <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>{tr('around', { date })}</div>}
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{t.purpose}{lang === 'hi' ? '। ' : '. '}{t.working}</div>
                  </div>
                )
              })}
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.66rem', color: 'var(--text-muted)' }}>{tr('timingFoot')}</p>
          </>
        )}
        {r.paceNotes.length > 0 && <p style={{ margin: '0.5rem 0 0', fontSize: '0.74rem', fontWeight: 600, color: 'var(--teal)' }}>{r.paceNotes.join(' ')}</p>}
        {r.timingCaveat && <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', lineHeight: 1.5, color: 'var(--amber)' }}>{r.timingCaveat}</p>}
      </Section>

      {/* Lost item */}
      {r.lostItem && (
        <Section title={tr('lost')} Icon={Compass} accent="var(--teal)">
          <DetailRow label={tr('what')} value={satpanchasikaText(r.lostItem.object.kind, lang)} working={r.lostItem.object.working + (r.lostItem.objectBy16 ? tr('also', { text: r.lostItem.objectBy16 }) : '')} />
          <DetailRow label={tr('whoHas')} value={r.lostItem.whoHolds.value} working={r.lostItem.whoHolds.working} />
          <DetailRow label={tr('where')} value={r.lostItem.where.place} working={r.lostItem.where.working} />
          <DetailRow label={tr('direction')} value={r.lostItem.direction.value} working={r.lostItem.direction.working} />
          <DetailRow label={tr('distance')} value={`${r.lostItem.distance.steps} ${r.lostItem.distance.steps === 1 ? tr('step') : tr('steps')}`} working={r.lostItem.distance.working} />
          <DetailRow label={tr('whenLost')} value={satpanchasikaText(r.lostItem.whenLost.value, lang)} working={r.lostItem.whenLost.working} />
          <DetailRow label={tr('age')} value={r.lostItem.personAge.value} working={r.lostItem.personAge.working} />
        </Section>
      )}

      {stability && <StabilitySection stability={stability} />}

      <PlanetTable reading={r} />

      {/* Subject */}
      <Section key={r.question} title={tr('concernsTitle')} Icon={Info} defaultOpen={['whom', 'object_class', 'person_age'].includes(r.question)}>
        <DetailRow label={tr('concerns')} value={r.subject.concerns} working={r.subject.concernsWorking} />
        <DetailRow label={tr('class')} value={r.subject.classBy17} working={r.subject.classBy16 ? tr('classAlso', { text: r.subject.classBy16 }) : tr('classOnly')} />
        {r.subject.navamsaRelation && <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{r.subject.navamsaRelation}</p>}
        {r.subject.personAge && <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{r.subject.personAge}</p>}
      </Section>

      {/* Not evaluated */}
      <Section title={tr('notEvaluated', { n: r.notEvaluated.length })} Icon={AlertTriangle} accent="var(--text-muted)" defaultOpen={false}>
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
          {satpanchasikaInterpretiveNotes(lang).map(n => (
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
