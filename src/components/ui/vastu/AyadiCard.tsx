'use client'
// ─────────────────────────────────────────────────────────────
//  Ayadi Shadvarga — classical size check of a building from
//  its length and breadth, against the owner's birth nakshatra.
// ─────────────────────────────────────────────────────────────
import { useEffect, useId, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { NAKSHATRA_HI, VAAR_HI } from '@/i18n/jyotish'
import { NAKSHATRA_NAMES } from '@/types/astrology'
import { ayadi, ayadiSuggest, type AyadiResult } from '@/lib/engine/astroVastu'

const STORAGE_KEY = 'vedaansh.vastu.ayadi'
const M_TO_FT = 3.28084
const VARA_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type Unit = 'ft' | 'm'

interface Props {
  /** Owner's Moon nakshatra, 1–27. */
  birthNakshatra?: number
}

export function AyadiCard({ birthNakshatra }: Props) {
  const t = useTranslations('vastu.ayadi')
  const hi = useLocale() === 'hi'
  const lid = useId(), bid = useId()
  const [length, setLength] = useState('')
  const [breadth, setBreadth] = useState('')
  const [unit, setUnit] = useState<Unit>('ft')

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const v = JSON.parse(raw) as { length?: string; breadth?: string; unit?: Unit }
      if (typeof v.length === 'string') setLength(v.length)
      if (typeof v.breadth === 'string') setBreadth(v.breadth)
      if (v.unit === 'ft' || v.unit === 'm') setUnit(v.unit)
    } catch { /* storage unavailable */ }
  }, [])

  useEffect(() => {
    try {
      if (length || breadth) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ length, breadth, unit }))
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch { /* storage unavailable */ }
  }, [length, breadth, unit])

  // The area formulas are taught in feet; metres are converted.
  const toFt = (v: string) => (unit === 'm' ? Number(v) * M_TO_FT : Number(v))
  const lenFt = toFt(length), brFt = toFt(breadth)
  const result = useMemo(() => ayadi(lenFt, brFt, birthNakshatra), [lenFt, brFt, birthNakshatra])
  const suggestion = useMemo(
    () => (result && result.passed < result.total && unit === 'ft' ? ayadiSuggest(lenFt, brFt, birthNakshatra) : null),
    [result, unit, lenFt, brFt, birthNakshatra],
  )

  const nakName = (n: number) => (hi ? NAKSHATRA_HI[n - 1] : NAKSHATRA_NAMES[n - 1]) ?? String(n)
  const varaName = (n: number) => (hi ? VAAR_HI[n - 1] : VARA_EN[n - 1]) ?? String(n)
  const tithiName = (n: number) =>
    n === 15 ? t('purnima') : n === 30 ? t('amavasya') : t('tithiValue', { paksha: t(n <= 15 ? 'shukla' : 'krishna'), n: ((n - 1) % 15) + 1 })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.65rem', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit',
  }

  return (
    <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-bright)' }}>
      <h3 style={{ margin: 0, color: 'var(--text-gold)', fontSize: '1.1rem', fontWeight: 600 }}>📏 {t('title')}</h3>
      <p style={{ margin: '0.3rem 0 1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 640, lineHeight: 1.5 }}>{t('subtitle')}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 120px' }}>
          <label htmlFor={lid} style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('length')}</label>
          <input id={lid} type="number" inputMode="decimal" min="0" step="0.5" value={length} onChange={e => setLength(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: '1 1 120px' }}>
          <label htmlFor={bid} style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('breadth')}</label>
          <input id={bid} type="number" inputMode="decimal" min="0" step="0.5" value={breadth} onChange={e => setBreadth(e.target.value)} style={inputStyle} />
        </div>
        <div role="radiogroup" aria-label={t('unit')} style={{ display: 'flex', background: 'var(--surface-3)', padding: 3, borderRadius: 9, gap: 2 }}>
          {(['ft', 'm'] as const).map(u => (
            <button key={u} type="button" role="radio" aria-checked={unit === u} onClick={() => setUnit(u)}
              style={{ padding: '0.4rem 0.85rem', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.78rem', background: unit === u ? 'var(--gold)' : 'transparent', color: unit === u ? 'var(--text-on-gold)' : 'var(--text-secondary)' }}>
              {t(`units.${u}`)}
            </button>
          ))}
        </div>
      </div>

      {!result ? (
        <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('empty')}</p>
      ) : (
        <AyadiResultView result={result} t={t} nakName={nakName} varaName={varaName} tithiName={tithiName} />
      )}

      {suggestion && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 0.9rem', borderRadius: 10, background: 'var(--gold-faint)', border: '1px solid var(--border-bright)', fontSize: '0.8rem', lineHeight: 1.5 }}>
          {t.rich('suggest', {
            length: suggestion.length, breadth: suggestion.breadth,
            passed: suggestion.result.passed, total: suggestion.result.total,
            b: chunks => <strong>{chunks}</strong>,
          })}
        </div>
      )}

      <p style={{ margin: '1rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {unit === 'm' ? t('noteMetres') : t('note')}
      </p>
    </div>
  )
}

type T = ReturnType<typeof useTranslations<'vastu.ayadi'>>

function AyadiResultView({ result: r, t, nakName, varaName, tithiName }: {
  result: AyadiResult
  t: T
  nakName: (n: number) => string
  varaName: (n: number) => string
  tithiName: (n: number) => string
}) {
  const band = r.passed === r.total ? 'good' : r.passed >= r.total - 1 ? 'mid' : 'weak'
  const bandColor = band === 'good' ? 'var(--teal)' : band === 'mid' ? 'var(--gold)' : 'var(--rose)'
  const tiles: { key: string; label: string; value: string; sub?: string; ok?: boolean }[] = [
    { key: 'aaya', label: t('aaya'), value: `${r.aaya} / ${r.vyaya}`, sub: t('aayaSub'), ok: r.checks.aayaOverVyaya.ok },
    { key: 'yoni', label: t('yoni'), value: t(`yonis.${r.yoniId}`), sub: t('yoniSub', { n: r.yoni }), ok: r.checks.yoni.ok },
    { key: 'nak', label: t('nakshatra'), value: nakName(r.nakshatra), sub: r.tara ? t('taraSub', { tara: t(`taras.${r.tara}`) }) : t('noTara'), ok: r.checks.tara?.ok },
    { key: 'vara', label: t('vara'), value: varaName(r.vara), ok: r.checks.vara.ok },
    { key: 'tithi', label: t('tithi'), value: tithiName(r.tithi), ok: r.checks.tithi.ok },
  ]
  return (
    <div style={{ marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: bandColor }}>{t(`verdict.${band}`)}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('passed', { passed: r.passed, total: r.total, area: r.area })}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem' }}>
        {tiles.map(tile => {
          const c = tile.ok === undefined ? 'var(--text-muted)' : tile.ok ? 'var(--teal)' : 'var(--rose)'
          return (
            <div key={tile.key} style={{ padding: '0.7rem 0.8rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                <span>{tile.label}</span>
                {tile.ok !== undefined && <span style={{ color: c, fontWeight: 700 }}>{tile.ok ? t('ok') : t('notOk')}</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.2rem' }}>{tile.value}</div>
              {tile.sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{tile.sub}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
