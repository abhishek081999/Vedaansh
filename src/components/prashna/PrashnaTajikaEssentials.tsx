'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/PrashnaTajikaEssentials.tsx
//  Prashna Essentials → Tajika: the book's chapter on Tajika yogas,
//  aspects, ithsala kinds, the rules for judging a query and its sahams.
// ─────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import { useLang } from '@/i18n/useLang'
import { tajikaBookSections, type BookTone } from '@/lib/engine/prashnaTajikaBook'

const TONE: Record<BookTone, string> = { good: 'var(--teal)', mixed: 'var(--gold)', bad: 'var(--rose)', neutral: 'var(--text-secondary)' }

export function PrashnaTajikaEssentials() {
  const { lang } = useLang()
  const sections = useMemo(() => tajikaBookSections(lang), [lang])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '0.75rem', alignItems: 'start' }}>
      {sections.map(s => (
        <section key={s.id} aria-labelledby={`tajika-${s.id}`} style={{ padding: '0.75rem 0.85rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.45rem', gridColumn: s.id === 'yogas' || s.id === 'sahams' ? '1 / -1' : undefined }}>
          <h3 id={`tajika-${s.id}`} style={{ margin: 0, fontSize: '0.88rem', fontFamily: 'var(--font-display)', color: 'var(--text-gold)' }}>{s.title}</h3>
          {s.intro && <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{s.intro}</p>}
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
  )
}
