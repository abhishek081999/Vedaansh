'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/PrashnaPrinciplesEssentials.tsx
//  Prashna Essentials → Principles: the general rules of a praśna chart
//  (success, failure, Lagna, breath, retrograde planets) read for the cast
//  chart, the five Jeeva / Roga / Mrityu sutras, and the reference notes.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES, type ChartOutput, type GrahaId, type Rashi } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, NAKSHATRA_HI, RASHI_HI } from '@/i18n/jyotish'
import { arudhaFromNumber108 } from '@/lib/engine/prashnaArudhaEssentials'
import {
  SUTRA_TONE,
  fiveSutras,
  principlesEssentials,
  readPrinciples,
  sutraLabel,
  sutraName,
  timeFrames,
  timeLabel,
  type PrincipleTone,
} from '@/lib/engine/prashnaPrinciples'

const TONE: Record<PrincipleTone, string> = { good: 'var(--teal)', mixed: 'var(--gold)', bad: 'var(--rose)', neutral: 'var(--text-secondary)' }
const SIGNS: Rashi[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const NAK_SPAN = 360 / 27

const card: React.CSSProperties = { padding: '0.75rem 0.85rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: 0 }
const h3: React.CSSProperties = { margin: 0, fontSize: '0.88rem', fontFamily: 'var(--font-display)', color: 'var(--text-gold)' }
const small: React.CSSProperties = { margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }
const field: React.CSSProperties = { height: 28, padding: '0 0.45rem', borderRadius: 6, border: '1px solid var(--border-soft)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: '0.72rem' }
const label: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }

export function PrashnaPrinciplesEssentials({ chart }: { chart?: ChartOutput | null }) {
  const t = useTranslations('prashna.m1.essentials.principles')
  const { lang } = useLang()
  const hi = lang === 'hi'
  const sections = useMemo(() => principlesEssentials(lang), [lang])
  const signName = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const grahaName = (g: GrahaId) => (hi ? GRAHA_HI[g] : GRAHA_NAMES[g])

  const [num, setNum] = useState('')
  const [arudhaSign, setArudhaSign] = useState<Rashi | ''>('')
  const [birthNak, setBirthNak] = useState<number | ''>('')

  const asc = chart?.lagnas.ascRashi as Rashi | undefined
  const input = useMemo(() => {
    if (!chart || asc == null) return null
    return {
      ascRashi: asc,
      ascDegree: chart.lagnas.ascDegreeInRashi,
      varaLord: chart.panchang?.vara?.lord,
      grahas: chart.grahas
        .filter(g => ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'].includes(g.id))
        .map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree, lonSidereal: g.lonSidereal, isRetro: g.isRetro, isCombust: g.isCombust })),
    }
  }, [chart, asc])

  const readings = useMemo(() => (input ? readPrinciples(input, lang) : []), [input, lang])
  const frames = useMemo(() => (input ? timeFrames(input) : null), [input])

  const fromNumber = useMemo(() => {
    const n = Number(num)
    return num.trim() && Number.isInteger(n) ? arudhaFromNumber108(n) : null
  }, [num])
  const arudha: Rashi | null = fromNumber?.sign ?? (arudhaSign === '' ? null : arudhaSign)

  const sutras = useMemo(() => {
    if (!chart || asc == null || arudha == null) return null
    const positions: Partial<Record<GrahaId, Rashi>> = {}
    for (const g of chart.grahas) positions[g.id] = g.rashi
    return fiveSutras({
      lagna: asc,
      arudha,
      positions,
      d9Lagna: chart.vargaLagnas?.D9,
      arudhaNavamsha: fromNumber?.navamsha,
      lagnaNakshatra: Math.floor((((chart.lagnas.ascDegree % 360) + 360) % 360) / NAK_SPAN),
      birthNakshatra: birthNak === '' ? undefined : birthNak,
    }, lang)
  }, [chart, asc, arudha, fromNumber, birthNak, lang])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* ── This chart ─────────────────────────────────────── */}
      <section aria-labelledby="principles-chart" style={{ ...card, borderColor: chart ? 'var(--gold)' : 'var(--border-soft)' }}>
        <h3 id="principles-chart" style={h3}>{t('chartTitle')}</h3>
        {!input ? <p style={small}>{t('castHint')}</p> : (
          <>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.72rem', lineHeight: 1.5 }}>
              {readings.map(r => (
                <li key={r.id} style={{ color: 'var(--text-secondary)' }}>
                  <span aria-hidden style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 999, background: TONE[r.tone], marginRight: 6, verticalAlign: 'middle' }} />
                  {r.text}
                </li>
              ))}
            </ul>
            {frames && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.4rem' }}>
                {(['past', 'present', 'future'] as const).map(f => (
                  <div key={f} style={{ padding: '0.4rem 0.5rem', borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--border-soft)', fontSize: '0.68rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-gold)', textTransform: 'capitalize' }}>{timeLabel(f, lang)} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({t(`houses.${f}`)})</span></div>
                    <div style={{ color: 'var(--text-secondary)' }}>{frames[f].length ? frames[f].map(grahaName).join(', ') : '—'}</div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ ...small, color: 'var(--text-muted)', fontSize: '0.66rem' }}>{t('chartNote')}</p>
          </>
        )}
      </section>

      {/* ── Five sutras ────────────────────────────────────── */}
      <section aria-labelledby="principles-sutras" style={card}>
        <h3 id="principles-sutras" style={h3}>{t('sutrasTitle')}</h3>
        <p style={small}>{t('sutrasIntro')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'flex-end' }}>
          <label style={label}>
            {t('number')}
            <input type="number" inputMode="numeric" min={1} max={108} value={num} onChange={e => setNum(e.target.value)} style={{ ...field, width: 90 }} />
          </label>
          <label style={label}>
            {t('arudhaSign')}
            <select value={fromNumber ? fromNumber.sign : arudhaSign} disabled={!!fromNumber} onChange={e => setArudhaSign(e.target.value === '' ? '' : (Number(e.target.value) as Rashi))} style={field}>
              <option value="">—</option>
              {SIGNS.map(r => <option key={r} value={r}>{signName(r)}</option>)}
            </select>
          </label>
          <label style={label}>
            {t('birthNak')}
            <select value={birthNak} onChange={e => setBirthNak(e.target.value === '' ? '' : Number(e.target.value))} style={field}>
              <option value="">—</option>
              {NAKSHATRA_NAMES.map((n, i) => <option key={n} value={i}>{hi ? NAKSHATRA_HI[i] : n}</option>)}
            </select>
          </label>
        </div>
        {num.trim() && !fromNumber && <p style={{ ...small, color: 'var(--rose)' }}>{t('numberInvalid')}</p>}
        {!chart || asc == null ? <p style={small}>{t('castHint')}</p>
          : !sutras ? <p style={small}>{t('pickArudha')}</p>
            : (
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(110px, max-content) 1fr', gap: '0.4rem 0.7rem', fontSize: '0.72rem', lineHeight: 1.5 }}>
                {sutras.map(s => (
                  <div key={s.id} style={{ display: 'contents' }}>
                    <dt style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sutraName(s.id, lang)}</dt>
                    <dd style={{ margin: 0 }}>
                      <strong style={{ color: TONE[SUTRA_TONE[s.sutra]] }}>{sutraLabel(s.sutra, lang)}</strong>
                      <span style={{ color: 'var(--text-muted)' }}> · {timeLabel(s.time, lang)}</span>
                      <div style={{ color: 'var(--text-secondary)' }}>{s.detail}</div>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
        {sutras && (!fromNumber || birthNak === '') && <p style={{ ...small, color: 'var(--text-muted)', fontSize: '0.66rem' }}>{t('sutrasMissing')}</p>}
      </section>

      {/* ── Reference ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '0.75rem', alignItems: 'start' }}>
        {sections.map(s => (
          <section key={s.id} aria-labelledby={`principles-${s.id}`} style={card}>
            <h3 id={`principles-${s.id}`} style={h3}>{s.title}</h3>
            {s.intro && <p style={small}>{s.intro}</p>}
            {s.rows && (
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(84px, max-content) 1fr', gap: '0.35rem 0.7rem', fontSize: '0.72rem', lineHeight: 1.5 }}>
                {s.rows.map(r => (
                  <div key={r.term} style={{ display: 'contents' }}>
                    <dt style={{ fontWeight: 700, color: r.tone ? TONE[r.tone] : 'var(--text-primary)' }}>{r.term}</dt>
                    <dd style={{ margin: 0, color: 'var(--text-secondary)' }}>{r.text}</dd>
                  </div>
                ))}
              </dl>
            )}
            {s.points && (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                {s.points.map(p => <li key={p}>{p}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
