'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/PrashnaQuestionCard.tsx
//  M1: pick the kind of question and read the chart for it — a checklist of
//  houses, lords and kārakas, the 12-question scheme, and lost-item clues.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import {
  QUESTION_KINDS, buildQuestionChecklist, houseFromPoint, lostItemClues, twelveQuestionPoints,
  type ChecklistNote, type PlanetPlace, type QuestionChartInput, type QuestionKind,
} from '@/lib/engine/prashnaQuestions'

type Pane = 'checklist' | 'twelve' | 'lost'
import { karyaPrinciples, readPrinciples, type PrincipleTone } from '@/lib/engine/prashnaPrinciples'
import { readTajikaBook } from '@/lib/engine/prashnaTajikaBook'

const PTONE: Record<PrincipleTone, string> = { good: 'var(--teal)', mixed: 'var(--gold)', bad: 'var(--rose)', neutral: 'var(--text-secondary)' }
const TONE: Record<ChecklistNote['tone'], string> = { good: 'var(--teal)', mixed: 'var(--gold)', bad: 'var(--rose)', info: 'var(--text-secondary)' }

function toInput(chart: ChartOutput): QuestionChartInput {
  const d9 = chart.vargas?.D9
  const d9Asc = chart.vargaLagnas?.D9
  return {
    ascRashi: chart.lagnas.ascRashi as Rashi,
    grahas: chart.grahas,
    ...(d9 && d9Asc ? { d9: { ascRashi: d9Asc, signs: Object.fromEntries(d9.map(g => [g.id, g.rashi])) as Partial<Record<GrahaId, Rashi>> } } : {}),
  }
}

const muted = { fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }

export function PrashnaQuestionCard({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('prashna.m1.question')
  const { lang } = useLang()
  const [kind, setKind] = useState<QuestionKind>('job')
  const [pane, setPane] = useState<Pane>('checklist')
  const input = useMemo(() => toInput(chart), [chart])
  const def = QUESTION_KINDS.find(q => q.id === kind)!
  const [matterHouse, setMatterHouse] = useState<number | null>(null)
  const house = matterHouse ?? def.karyeshaHouse

  const list = useMemo(() => buildQuestionChecklist(input, kind, lang), [input, kind, lang])
  const points = useMemo(() => twelveQuestionPoints(input, lang), [input, lang])
  const clues = useMemo(() => lostItemClues(input, lang), [input, lang])
  const principles = useMemo(() => {
    const karya = karyaPrinciples(input, def.karyeshaHouse, lang)
    const general = readPrinciples({
      ascRashi: input.ascRashi,
      ascDegree: chart.lagnas.ascDegreeInRashi,
      varaLord: chart.panchang?.vara?.lord,
      grahas: input.grahas.filter(g => ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'].includes(g.id)),
    }, lang)
    const SL = ['Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me', 'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju'] as const
    const lagnesh = SL[input.ascRashi - 1]
    const karyesh = SL[((input.ascRashi - 1 + def.karyeshaHouse - 1) % 12)]
    const tajika = readTajikaBook({ ascRashi: input.ascRashi, ascDegree: chart.lagnas.ascDegree, grahas: input.grahas }, lagnesh, karyesh, lang)
      .filter(r => !r.id.startsWith('node-'))
      .map(r => ({ id: `tajika-${r.id}`, tone: r.tone, text: `${r.title}: ${r.text}` }))
    return [...karya, ...tajika, ...general]
  }, [input, def.karyeshaHouse, chart, lang])
  const tally = { good: principles.filter(p => p.tone === 'good').length, bad: principles.filter(p => p.tone === 'bad').length }

  const placeText = (p: PlanetPlace) =>
    `${p.sign} ${p.degree}° · ${t('houseN', { n: p.house })} · ${p.dignity}${p.flags.length ? ` · ${p.flags.join(', ')}` : ''}${p.d9Sign ? ` · D9 ${p.d9Sign}` : ''}`

  const chip = (label: string, value: string, sub: string, key?: string) => (
    <div key={key} style={{ padding: '0.45rem 0.6rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', minWidth: 0 }}>
      <div style={muted}>{label}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-gold)' }}>{value}</div>
      <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{sub}</div>
    </div>
  )

  return (
    <section className="card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div className="label-caps">{t('title')}</div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('sub')}</p>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
          {t('kind')}
          <select value={kind} onChange={e => { setKind(e.target.value as QuestionKind); setMatterHouse(null) }}
            style={{ height: 28, padding: '0 0.5rem', fontSize: '0.72rem', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-soft)', borderRadius: 999, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
            {QUESTION_KINDS.map(q => <option key={q.id} value={q.id}>{lang === 'hi' ? q.label.hi : q.label.en}</option>)}
          </select>
        </label>
      </div>

      <div role="tablist" aria-label={t('paneAria')} style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: 2, gap: 2, background: 'var(--surface-3)', border: '1px solid var(--border-soft)', borderRadius: 999, maxWidth: '100%', overflowX: 'auto' }}>
        {(['checklist', 'twelve', 'lost'] as const).map(v => (
          <button key={v} type="button" role="tab" aria-selected={pane === v} onClick={() => setPane(v)}
            style={{ height: 26, padding: '0 0.8rem', border: 'none', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              background: pane === v ? 'var(--gold)' : 'transparent', color: pane === v ? 'var(--text-on-gold)' : 'var(--text-secondary)' }}>
            {t(`pane.${v}`)}
          </button>
        ))}
      </div>

      {pane === 'checklist' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.4rem' }}>
            {chip(t('lagnaLord', { sign: list.lagna.sign }), list.lagna.lord.name, placeText(list.lagna.lord))}
            {chip(t('moon'), list.moon.name, placeText(list.moon))}
            {chip(t('karyesha', { n: def.karyeshaHouse }), list.karyesha.name, placeText(list.karyesha))}
          </div>

          <div role="status" style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap', padding: '0.5rem 0.65rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', fontSize: '0.72rem' }}>
            <strong style={{ color: list.genuine.ok ? 'var(--teal)' : 'var(--gold)' }}>{list.genuine.ok ? t('genuineYes') : t('genuineNo')}</strong>
            <span style={{ color: 'var(--text-secondary)' }}>{list.genuine.ok ? list.genuine.reasons.join(' · ') : t('genuineHint')}</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                  {(['colHouse', 'colRole', 'colSign', 'colLord', 'colIn', 'colAspect'] as const).map(k => <th key={k} style={{ padding: '0.3rem 0.4rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{t(k)}</th>)}
                </tr>
              </thead>
              <tbody>
                {list.houses.map(h => (
                  <tr key={h.house} style={{ borderTop: '1px solid var(--border-soft)', verticalAlign: 'top' }}>
                    <td style={{ padding: '0.35rem 0.4rem', fontWeight: 700, color: 'var(--text-gold)' }}>{h.house}</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: 'var(--text-primary)', minWidth: 150 }}>{h.role}</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{h.sign}</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: 'var(--text-secondary)', minWidth: 160 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{h.lord.name}</strong> · {t('houseN', { n: h.lord.house })} · {h.lord.dignity}
                      {h.lord.flags.length > 0 && <span style={{ color: 'var(--rose)' }}> · {h.lord.flags.join(', ')}</span>}
                    </td>
                    <td style={{ padding: '0.35rem 0.4rem', color: h.malefics ? 'var(--rose)' : 'var(--text-secondary)' }}>{h.occupants.join(', ') || '—'}</td>
                    <td style={{ padding: '0.35rem 0.4rem', color: 'var(--text-muted)' }}>{h.aspectedBy.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div style={{ ...muted, marginBottom: '0.3rem' }}>{t('karakas')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.4rem' }}>
              {list.karakas.map(k => chip(k.role, k.name, placeText(k), k.id))}
            </div>
          </div>

          {list.notes.length > 0 && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {list.notes.map(n => (
                <li key={n.text} style={{ fontSize: '0.72rem', lineHeight: 1.5, color: TONE[n.tone] }}>{n.text}</li>
              ))}
            </ul>
          )}
          <div style={{ padding: '0.55rem 0.65rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={muted}>{t('principlesTitle')}</div>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>{t('principlesTally', { good: tally.good, bad: tally.bad })}</span>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {principles.map(p => (
                <li key={p.id} style={{ fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  <span aria-hidden style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: PTONE[p.tone], marginRight: 6, verticalAlign: 'middle' }} />
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
          <p style={{ margin: 0, fontSize: '0.64rem', color: 'var(--text-muted)' }}>{t('checklistNote')}</p>
        </>
      )}

      {pane === 'twelve' && (
        <>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('twelveIntro')}</p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: 'var(--text-secondary)', alignSelf: 'flex-start' }}>
            {t('matterHouse')}
            <select value={house} onChange={e => setMatterHouse(Number(e.target.value))}
              style={{ height: 26, padding: '0 0.45rem', fontSize: '0.7rem', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-soft)', borderRadius: 999, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{t('houseN', { n: h })}</option>)}
            </select>
          </label>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.3rem 0.4rem', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '0.3rem 0.4rem', fontWeight: 600 }}>{t('colPoint')}</th>
                  <th style={{ padding: '0.3rem 0.4rem', fontWeight: 600 }}>{t('colRefSign')}</th>
                  <th style={{ padding: '0.3rem 0.4rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{t('colFrom', { n: house })}</th>
                </tr>
              </thead>
              <tbody>
                {points.map(p => {
                  const m = houseFromPoint(p.sign, house, lang)
                  return (
                    <tr key={p.n} style={{ borderTop: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '0.35rem 0.4rem', fontWeight: 700, color: 'var(--text-gold)' }}>{p.n}</td>
                      <td style={{ padding: '0.35rem 0.4rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{p.name}</td>
                      <td style={{ padding: '0.35rem 0.4rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.signName} · {p.lord}</td>
                      <td style={{ padding: '0.35rem 0.4rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{m.signName} · {m.lordName}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p style={{ margin: 0, fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('twelveNote')}</p>
        </>
      )}

      {pane === 'lost' && (
        <>
          {kind !== 'lost' && <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--gold)' }}>{t('lostOnly')}</p>}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {clues.map(c => (
              <li key={c.id} style={{ padding: '0.5rem 0.65rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: TONE[c.tone] === 'var(--text-secondary)' ? 'var(--text-primary)' : TONE[c.tone] }}>{c.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 2 }}>{c.detail}</div>
              </li>
            ))}
          </ul>
          <p style={{ margin: 0, fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('lostNote')}</p>
        </>
      )}
    </section>
  )
}
