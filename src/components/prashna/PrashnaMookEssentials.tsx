'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/PrashnaMookEssentials.tsx
//  Prashna Essentials → Mook: the silent question (dhatu / mula / jeeva,
//  the house of the matter, the person, how many, pleasant or not) and
//  the mushti (closed fist) article, read for the cast chart, with the
//  chapter's reference notes.
// ─────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { GRAHA_NAMES, type ChartOutput, type GrahaId, type Rashi } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI } from '@/i18n/jyotish'
import { kindLabel, mookSections, readMook, readMushti, type MookChart, type MookKind, type MookTone } from '@/lib/engine/prashnaMook'

const TONE: Record<MookTone, string> = { good: 'var(--teal)', mixed: 'var(--gold)', bad: 'var(--rose)', neutral: 'var(--text-secondary)' }
const KIND_TONE: Record<MookKind | 'mixed', string> = { dhatu: 'var(--gold)', mula: 'var(--teal)', jeeva: 'var(--rose)', mixed: 'var(--text-secondary)' }

const card: React.CSSProperties = { padding: '0.75rem 0.85rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: 0 }
const h3: React.CSSProperties = { margin: 0, fontSize: '0.88rem', fontFamily: 'var(--font-display)', color: 'var(--text-gold)' }
const small: React.CSSProperties = { margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }
const ul: React.CSSProperties = { margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--text-secondary)' }
const dot = (color: string) => <span aria-hidden style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: color, marginRight: 6, verticalAlign: 'middle' }} />

export function PrashnaMookEssentials({ chart }: { chart?: ChartOutput | null }) {
  const t = useTranslations('prashna.m1.essentials.mook')
  const { lang } = useLang()
  const hi = lang === 'hi'
  const name = (g: GrahaId) => (hi ? GRAHA_HI[g] : GRAHA_NAMES[g])
  const sections = useMemo(() => mookSections(lang), [lang])

  const input = useMemo<MookChart | null>(() => {
    if (!chart) return null
    const d9 = chart.vargas?.D9
    return {
      ascRashi: chart.lagnas.ascRashi as Rashi,
      ascDegree: chart.lagnas.ascDegree,
      grahas: chart.grahas,
      ...(d9 ? { d9: Object.fromEntries(d9.map(g => [g.id, g.rashi])) as Partial<Record<GrahaId, Rashi>> } : {}),
    }
  }, [chart])
  const mook = useMemo(() => (input ? readMook(input, lang) : null), [input, lang])
  const mushti = useMemo(() => (input ? readMushti(input, lang) : null), [input, lang])
  const lead = mook ? (Object.entries(mook.tally) as [MookKind, number][]).sort((a, b) => b[1] - a[1]) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {!mook || !mushti ? (
        <section style={card}><p style={small}>{t('castHint')}</p></section>
      ) : (
        <>
          <section aria-labelledby="mook-summary" style={{ ...card, borderColor: 'var(--gold)' }}>
            <h3 id="mook-summary" style={h3}>{t('summaryTitle')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.4rem' }}>
              <div style={{ padding: '0.45rem 0.6rem', borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('kindVotes')}</div>
                {lead.map(([k, n]) => (
                  <div key={k} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{dot(KIND_TONE[k])}<strong style={{ color: 'var(--text-primary)' }}>{n}</strong> · {kindLabel(k, lang)}</div>
                ))}
              </div>
              <div style={{ padding: '0.45rem 0.6rem', borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('houseVotes')}</div>
                {mook.houses.map(h => (
                  <div key={h.house} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>{t('houseN', { n: h.house })}</strong> · {h.topic} <span style={{ color: 'var(--text-muted)' }}>({t('votes', { n: h.votes })})</span></div>
                ))}
              </div>
              <div style={{ padding: '0.45rem 0.6rem', borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('strongest')}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-gold)' }}>{name(mook.strongest)}</div>
              </div>
            </div>
            <p style={{ ...small, color: 'var(--text-muted)', fontSize: '0.66rem' }}>{t('summaryNote')}</p>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '0.75rem', alignItems: 'start' }}>
            {mook.groups.filter(g => g.items.length).map(g => (
              <section key={g.id} aria-labelledby={`mook-${g.id}`} style={card}>
                <h3 id={`mook-${g.id}`} style={h3}>{g.title}</h3>
                <ul style={{ ...ul, listStyle: 'none', paddingLeft: 0 }}>
                  {g.items.map(it => (
                    <li key={it.id}>{dot(it.kind ? KIND_TONE[it.kind] : TONE[it.tone ?? 'neutral'])}{it.text}</li>
                  ))}
                </ul>
              </section>
            ))}
            <section aria-labelledby="mook-mushti" style={card}>
              <h3 id="mook-mushti" style={h3}>{t('mushtiTitle')}</h3>
              <p style={small}>
                {mushti.kendraStrong.length
                  ? t('kendraStrong', { list: mushti.kendraStrong.map(name).join(', ') })
                  : t('kendraNone')}
              </p>
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(96px, max-content) 1fr', gap: '0.3rem 0.7rem', fontSize: '0.72rem', lineHeight: 1.5 }}>
                {mushti.schools.map(s => (
                  <div key={s.school} style={{ display: 'contents' }}>
                    <dt style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</dt>
                    <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{s.kind ? kindLabel(s.kind, lang) : '—'}</dd>
                  </div>
                ))}
              </dl>
              {mushti.items.length > 0 && (
                <ul style={{ ...ul, listStyle: 'none', paddingLeft: 0 }}>
                  {mushti.items.map(it => <li key={it.id}>{dot(it.kind ? KIND_TONE[it.kind] : 'var(--text-muted)')}{it.text}</li>)}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '0.75rem', alignItems: 'start' }}>
        {sections.map(s => (
          <section key={s.id} aria-labelledby={`mook-ref-${s.id}`} style={card}>
            <h3 id={`mook-ref-${s.id}`} style={h3}>{s.title}</h3>
            {s.intro && <p style={small}>{s.intro}</p>}
            {s.rows && (
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(84px, max-content) 1fr', gap: '0.35rem 0.7rem', fontSize: '0.72rem', lineHeight: 1.5 }}>
                {s.rows.map(r => (
                  <div key={r.term} style={{ display: 'contents' }}>
                    <dt style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.term}</dt>
                    <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{r.text}</dd>
                  </div>
                ))}
              </dl>
            )}
            {s.points && <ul style={ul}>{s.points.map(p => <li key={p}>{p}</li>)}</ul>}
          </section>
        ))}
      </div>
    </div>
  )
}
