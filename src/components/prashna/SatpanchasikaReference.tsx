'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/SatpanchasikaReference.tsx
//  Browsable reference of all 56 ślokas, by chapter, with search.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookOpen, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useLang } from '@/i18n/useLang'
import {
  SATPANCHASIKA_CHAPTERS,
  SATPANCHASIKA_COLOPHON,
  SATPANCHASIKA_SLOKAS,
  getSatpanchasikaSloka,
  satpanchasikaChapterTitle,
} from '@/lib/engine/satpanchasikaSlokas'
import type { SlokaStatus } from '@/lib/engine/satpanchasikaEngine'
import { SlokaText } from './SatpanchasikaPanel'

/** Badge colours; the labels live in `prashna.ref.status`. */
const STATUS_COLOR: Partial<Record<SlokaStatus, string>> = {
  fired: 'var(--teal)',
  not_fired: 'var(--text-muted)',
  not_evaluated: 'var(--amber)',
  timing: 'var(--gold)',
  detail: 'var(--gold)',
  subject: 'var(--gold)',
}

export function SatpanchasikaReference({ status }: { status?: Record<string, SlokaStatus> }) {
  const t = useTranslations('prashna.ref')
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [chapter, setChapter] = useState<number | 'all'>('all')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SATPANCHASIKA_SLOKAS.filter(s =>
      (chapter === 'all' || s.chapter === chapter)
      && (!q || s.id.startsWith(q) || (getSatpanchasikaSloka(s.id, lang)?.meaning ?? s.meaning).toLowerCase().includes(q) || s.sanskrit.includes(query.trim())),
    )
  }, [query, chapter, lang])

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
        <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 700 }}>{t('title')}</span>
        <Chevron size={16} aria-hidden style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {t('intro')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
              <Search size={14} aria-hidden style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="search"
                className="input"
                aria-label={t('searchAria')}
                placeholder={t('searchPlaceholder')}
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ paddingLeft: 30, width: '100%', fontSize: '0.8rem' }}
              />
            </div>
            <select className="input" aria-label={t('chapterAria')} value={chapter} onChange={e => setChapter(e.target.value === 'all' ? 'all' : Number(e.target.value))} style={{ flex: '1 1 200px', minWidth: 0, fontSize: '0.8rem' }}>
              <option value="all">{t('all')}</option>
              {SATPANCHASIKA_CHAPTERS.map(ch => (
                <option key={ch.number} value={ch.number}>{t('chapterOption', { n: ch.number, title: satpanchasikaChapterTitle(ch, lang), count: ch.slokaCount })}</option>
              ))}
            </select>
          </div>

          {list.length === 0 && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('none')}</p>}

          {SATPANCHASIKA_CHAPTERS.map(ch => {
            const items = list.filter(s => s.chapter === ch.number)
            if (!items.length) return null
            return (
              <div key={ch.number} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--gold)' }}>
                  <span lang="sa">{ch.sanskritTitle}</span> · {satpanchasikaChapterTitle(ch, lang)}
                </h3>
                {items.map(s => {
                  const badge = status ? STATUS_COLOR[status[s.id]] : undefined
                  return (
                    <div key={s.id} style={{ padding: '0.6rem 0.7rem', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--gold)' }}>{s.id}</span>
                        {badge && status?.[s.id] && <span style={{ fontSize: '0.64rem', fontWeight: 700, color: badge }}>{t(`status.${status[s.id]}`)}</span>}
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
