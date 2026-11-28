'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/PrashnaSatpanchasikaEssentials.tsx
//  Prashna Essentials → Satpanchasika: the full Satpanchasika analysis
//  of the cast M1 chart for a chosen kind of question (the same engine
//  and result panel as M2), the book chapter "Shatpanchasika in a
//  Nutshell" — lost-article specifics for the chart — and its topic
//  index, opening each śloka.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { satpanchasikaBookLost, satpanchasikaTopics } from '@/lib/engine/satpanchasikaBook'
import {
  SATPANCHASIKA_QUESTION_GROUPS,
  runSatpanchasika,
  satpanchasikaGroupLabel,
  satpanchasikaQuestions,
  type SatpanchasikaReading,
} from '@/lib/engine/satpanchasikaEngine'
import type { ContestRole, SatpanchasikaQuestion } from '@/lib/engine/satpanchasikaRules'
import { SatpanchasikaPanel, SlokaText } from './SatpanchasikaPanel'

const card: React.CSSProperties = { padding: '0.75rem 0.85rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }
const h3: React.CSSProperties = { margin: 0, fontSize: '0.88rem', fontFamily: 'var(--font-display)', color: 'var(--text-gold)' }
const small: React.CSSProperties = { margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }
const field: React.CSSProperties = { height: 30, padding: '0 0.45rem', borderRadius: 6, border: '1px solid var(--border-soft)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: '0.74rem', maxWidth: '100%' }
const labelCss: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600, minWidth: 0 }
const TONE = { good: 'var(--teal)', bad: 'var(--rose)' } as const

export function PrashnaSatpanchasikaEssentials({ chart, question }: { chart?: ChartOutput | null; question?: string }) {
  const t = useTranslations('prashna.m1.essentials.satpanchasika')
  const tp = useTranslations('prashna')
  const { lang } = useLang()
  const topics = useMemo(() => satpanchasikaTopics(lang), [lang])
  const [topic, setTopic] = useState(0)
  const [sloka, setSloka] = useState<string | null>(null)
  const [kind, setKind] = useState<SatpanchasikaQuestion>('work')
  const [house, setHouse] = useState(1)
  const [role, setRole] = useState<ContestRole>('defender')
  const [rainy, setRainy] = useState(false)

  const questions = useMemo(() => satpanchasikaQuestions(lang), [lang])
  const book = useMemo(
    () => (chart ? { ascRashi: chart.lagnas.ascRashi as Rashi, ascDegree: chart.lagnas.ascDegree, grahas: chart.grahas } : null),
    [chart],
  )
  const lost = useMemo(() => (book ? satpanchasikaBookLost(book, lang) : []), [book, lang])
  const result = useMemo((): { reading: SatpanchasikaReading | null; failed: boolean } => {
    if (!chart) return { reading: null, failed: false }
    try {
      return { reading: runSatpanchasika(chart, { question: kind, contestRole: role, house, season: rainy ? 'rainy' : undefined }, lang), failed: false }
    } catch (err) {
      console.error('Satpanchasika (Essentials) error:', err)
      return { reading: null, failed: true }
    }
  }, [chart, kind, role, house, rainy, lang])
  const current = topics[topic]
  const shown = sloka ?? current.slokas[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* ── Analysis of the cast chart ── */}
      <section aria-labelledby="sat-analysis" style={{ ...card, borderColor: chart ? 'var(--gold)' : 'var(--border-soft)' }}>
        <h3 id="sat-analysis" style={h3}>{t('analysisTitle')}</h3>
        {!chart ? <p style={small}>{t('analysisCast')}</p> : (
          <>
            <p style={small}>{t('analysisIntro')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'flex-end' }}>
              <label style={{ ...labelCss, flex: '1 1 240px' }}>
                {t('kind')}
                <select value={kind} onChange={e => setKind(e.target.value as SatpanchasikaQuestion)} style={field}>
                  {SATPANCHASIKA_QUESTION_GROUPS.map(g => {
                    const items = questions.filter(q => q.group === g)
                    if (!items.length) return null
                    return (
                      <optgroup key={g} label={satpanchasikaGroupLabel(g, lang)}>
                        {items.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                      </optgroup>
                    )
                  })}
                </select>
              </label>
              {kind === 'any_house' && (
                <label style={labelCss}>
                  {tp('ui.houseToJudge')}
                  <select value={house} onChange={e => setHouse(Number(e.target.value))} style={field}>
                    {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}. {tp(`satHouse.${i + 1}`)}</option>)}
                  </select>
                </label>
              )}
              {kind === 'contest' && (
                <div role="group" aria-label={tp('page.yourSide')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>{tp('page.yourSide')}</span>
                  {(['defender', 'challenger'] as const).map(r => (
                    <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)}
                      className={`btn btn-sm ${role === r ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.68rem' }}>
                      {tp(`page.${r}`)}
                    </button>
                  ))}
                </div>
              )}
              {kind === 'rain' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={rainy} onChange={e => setRainy(e.target.checked)} />
                  {tp('ui.rainy')}
                </label>
              )}
            </div>
          </>
        )}
      </section>
      {result.failed && <p style={{ ...small, color: 'var(--rose)' }}>{tp('page.unreadable')}</p>}
      {result.reading && chart && book && (
        <SatpanchasikaPanel
          reading={result.reading}
          questionText={question ?? ''}
          lagnaRashi={chart.lagnas.ascRashi}
          lagnaDegree={chart.lagnas.ascDegreeInRashi}
          book={book}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '0.75rem', alignItems: 'start' }}>
        <section aria-labelledby="sat-topics" style={card}>
          <h3 id="sat-topics" style={h3}>{t('topicsTitle')}</h3>
          <p style={small}>{t('topicsIntro')}</p>
          <label style={labelCss}>
            {t('topic')}
            <select value={topic} onChange={e => { setTopic(Number(e.target.value)); setSloka(null) }} style={field}>
              {topics.map((x, i) => <option key={x.topic} value={i}>{x.topic}</option>)}
            </select>
          </label>
          <div role="group" aria-label={t('slokasAria')} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {current.slokas.map(id => {
              const on = shown === id
              return (
                <button key={id} type="button" aria-pressed={on} onClick={() => setSloka(id)}
                  style={{ padding: '0 0.55rem', height: 24, borderRadius: 999, border: '1px solid var(--border-soft)', background: on ? 'var(--gold)' : 'var(--surface-1)', color: on ? 'var(--text-on-gold)' : 'var(--text-gold)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                  {id}
                </button>
              )
            })}
          </div>
          <div style={{ padding: '0.55rem 0.65rem', borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 4 }}>{t('slokaN', { id: shown })}</div>
            <SlokaText id={shown} />
          </div>
        </section>

        <section aria-labelledby="sat-lost" style={card}>
          <h3 id="sat-lost" style={h3}>{t('lostTitle')}</h3>
          {!chart ? <p style={small}>{t('castHint')}</p> : (
            <>
              <p style={small}>{t('lostIntro')}</p>
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(96px, max-content) 1fr', gap: '0.4rem 0.7rem', fontSize: '0.72rem', lineHeight: 1.5 }}>
                {lost.map(l => (
                  <div key={l.id} style={{ display: 'contents' }}>
                    <dt style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{l.label}</dt>
                    <dd style={{ margin: 0 }}>
                      <strong style={{ color: l.tone ? TONE[l.tone] : 'var(--text-gold)' }}>{l.value}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{l.working}</div>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
