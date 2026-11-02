'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/SatpanchasikaReference.tsx
//  Browsable reference of all 56 ślokas, by chapter, with search.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Search } from 'lucide-react'
import {
  SATPANCHASIKA_CHAPTERS,
  SATPANCHASIKA_COLOPHON,
  SATPANCHASIKA_SLOKAS,
} from '@/lib/engine/satpanchasikaSlokas'
import type { SlokaStatus } from '@/lib/engine/satpanchasikaEngine'
import { SlokaText } from './SatpanchasikaPanel'

const STATUS_LABEL: Partial<Record<SlokaStatus, { label: string; color: string }>> = {
  fired: { label: 'Fired', color: 'var(--teal)' },
  not_fired: { label: 'Did not match', color: 'var(--text-muted)' },
  not_evaluated: { label: 'Not evaluated', color: 'var(--amber)' },
  timing: { label: 'Timing', color: 'var(--gold)' },
  detail: { label: 'Item detail', color: 'var(--gold)' },
  subject: { label: 'Subject', color: 'var(--gold)' },
}

export function SatpanchasikaReference({ status }: { status?: Record<string, SlokaStatus> }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [chapter, setChapter] = useState<number | 'all'>('all')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SATPANCHASIKA_SLOKAS.filter(s =>
      (chapter === 'all' || s.chapter === chapter)
      && (!q || s.id.startsWith(q) || s.meaning.toLowerCase().includes(q) || s.sanskrit.includes(query.trim())),
    )
  }, [query, chapter])

  const Chevron = open ? ChevronDown : ChevronRight

  return (
    <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left' }}
      >
        <BookOpen size={16} aria-hidden style={{ color: 'var(--gold)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 700 }}>The 56 ślokas of Ṣaṭpañcāśikā</span>
        <Chevron size={16} aria-hidden style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Pṛthuyaśas, son of Varāhamihira. Text from the V. Subrahmanya Sastri edition (3rd ed., Bangalore, 1978). Meanings are short gists, not the book&apos;s translation. Some ślokas hold dated social categories: they are kept here as text and are not used in readings.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
              <Search size={14} aria-hidden style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="search"
                className="input"
                aria-label="Search ślokas"
                placeholder="Search by number or word"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ paddingLeft: 30, width: '100%', fontSize: '0.8rem' }}
              />
            </div>
            <select className="input" aria-label="Chapter" value={chapter} onChange={e => setChapter(e.target.value === 'all' ? 'all' : Number(e.target.value))} style={{ flex: '1 1 200px', minWidth: 0, fontSize: '0.8rem' }}>
              <option value="all">All chapters (56)</option>
              {SATPANCHASIKA_CHAPTERS.map(ch => (
                <option key={ch.number} value={ch.number}>{ch.number}. {ch.title} ({ch.slokaCount})</option>
              ))}
            </select>
          </div>

          {list.length === 0 && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>No śloka matches that search.</p>}

          {SATPANCHASIKA_CHAPTERS.map(ch => {
            const items = list.filter(s => s.chapter === ch.number)
            if (!items.length) return null
            return (
              <div key={ch.number} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--gold)' }}>
                  <span lang="sa">{ch.sanskritTitle}</span> · {ch.title}
                </h3>
                {items.map(s => {
                  const badge = status ? STATUS_LABEL[status[s.id]] : undefined
                  return (
                    <div key={s.id} style={{ padding: '0.6rem 0.7rem', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--gold)' }}>{s.id}</span>
                        {badge && <span style={{ fontSize: '0.64rem', fontWeight: 700, color: badge.color }}>{badge.label}</span>}
                      </div>
                      <SlokaText id={s.id} />
                    </div>
                  )
                })}
              </div>
            )
          })}
          {list.length === SATPANCHASIKA_SLOKAS.length && (
            <p lang="sa" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>{SATPANCHASIKA_COLOPHON}</p>
          )}
        </div>
      )}
    </section>
  )
}
