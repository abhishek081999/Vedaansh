'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/prashna/PrashnaHouseReference.tsx
//  What each house covers, praśna uses first. Search answers
//  "which house rules my question?". Reference only.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronRight, Home, Search } from 'lucide-react'
import { useLang } from '@/i18n/useLang'
import { termHi } from '@/i18n/jyotish'
import { grahaName } from '@/lib/engine/satpanchasikaFacts'
import {
  getHouseSignifications,
  getPlanetMedical,
  searchHouseSignifications,
  type HouseSignificationGroup,
} from '@/lib/engine/prashnaHouseSignifications'

const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

function PlanetMedicalBlock() {
  const t = useTranslations('prashna.houses')
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const Chevron = open ? ChevronDown : ChevronRight
  return (
    <div style={{ borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--surface-2)' }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text-secondary)' }}>
        <span style={{ flex: 1, fontSize: '0.76rem', fontWeight: 700 }}>{t('planetsTitle')}</span>
        <Chevron size={14} aria-hidden style={{ color: 'var(--text-muted)' }} />
      </button>
      {open && (
        <div style={{ padding: '0 0.75rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('planetsHint')}</p>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'minmax(64px, max-content) 1fr', gap: '0.3rem 0.75rem' }}>
            {getPlanetMedical(lang).map(p => (
              <div key={p.id} style={{ display: 'contents' }}>
                <dt style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-gold)' }}>{lang === 'hi' ? termHi(grahaName(p.id)) : grahaName(p.id)}</dt>
                <dd style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>{p.areas.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

function GroupBlock({ group, accent }: { group: HouseSignificationGroup; accent: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <h4 style={{ margin: 0, fontSize: '0.7rem', color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group.title}</h4>
      <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {group.items.map(it => (
          <li key={it.text} style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
            {it.text}
            {it.note && <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{it.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Compact list of what the matter's house covers in praśna, for the Vedic reading. */
export function PrashnaHouseCovers({ house }: { house: number }) {
  const t = useTranslations('prashna.houses')
  const { lang } = useLang()
  const groups = getHouseSignifications(house, lang)?.groups ?? []
  if (!groups.length) return null
  const horary = groups.filter(g => g.prashna)
  const other = groups.filter(g => !g.prashna)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('coversHint', { n: house })}</p>
      {horary.length > 0 && <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--teal)' }}>{t('inPrashna')}</div>}
      {horary.map(g => <GroupBlock key={g.id} group={g} accent="var(--text-secondary)" />)}
      {other.length > 0 && <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('general')}</div>}
      {other.map(g => <GroupBlock key={g.id} group={g} accent="var(--text-muted)" />)}
    </div>
  )
}

export function PrashnaHouseReference({ initialHouse = 1 }: { initialHouse?: number }) {
  const t = useTranslations('prashna.houses')
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const [house, setHouse] = useState(initialHouse)
  const [query, setQuery] = useState('')
  // Follow the chosen topic's house when it changes.
  const [seenInitial, setSeenInitial] = useState(initialHouse)
  if (seenInitial !== initialHouse) {
    setSeenInitial(initialHouse)
    setHouse(initialHouse)
  }

  const hits = useMemo(() => searchHouseSignifications(query, lang), [query, lang])
  const byHouse = useMemo(() => {
    const m = new Map<number, typeof hits>()
    for (const h of hits) m.set(h.house, [...(m.get(h.house) ?? []), h])
    return [...m.entries()]
  }, [hits])
  const data = getHouseSignifications(house, lang)
  const prashna = data?.groups.filter(g => g.prashna) ?? []
  const natal = data?.groups.filter(g => !g.prashna) ?? []
  const searching = query.trim().length > 0
  const Chevron = open ? ChevronDown : ChevronRight

  return (
    <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left' }}
      >
        <Home size={16} aria-hidden style={{ color: 'var(--gold)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 700 }}>{t('title')}</span>
        <Chevron size={16} aria-hidden style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('intro')}</p>

          <div style={{ position: 'relative' }}>
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

          {searching ? (
            hits.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('none')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {byHouse.map(([h, list]) => (
                  <div key={h} style={{ padding: '0.55rem 0.7rem', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                    <button type="button" onClick={() => { setHouse(h); setQuery('') }}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 800, color: 'var(--gold)' }}>
                      {t('houseN', { n: h })} →
                    </button>
                    <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      {list.map(x => (
                        <li key={`${x.group.id}-${x.item.text}`} style={{ fontSize: '0.76rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                          {x.item.text}
                          <span style={{ fontSize: '0.66rem', color: x.group.prashna ? 'var(--teal)' : 'var(--text-muted)' }}> · {x.group.prashna ? t('prashnaTag') : x.group.title}</span>
                          {x.item.note && <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{x.item.note}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )
          ) : (
            <>
              <div role="tablist" aria-label={t('houseAria')} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))', gap: '0.3rem' }}>
                {HOUSES.map(h => {
                  const active = h === house
                  return (
                    <button key={h} type="button" role="tab" aria-selected={active} aria-label={t('houseN', { n: h })} onClick={() => setHouse(h)}
                      style={{ padding: '0.35rem 0', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, border: active ? '2px solid var(--gold)' : '1px solid var(--border-soft)', background: active ? 'var(--gold-faint)' : 'var(--surface-2)', color: active ? 'var(--text-gold)' : 'var(--text-secondary)' }}>
                      {h}
                    </button>
                  )
                })}
              </div>

              <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--gold)' }}>{t('houseN', { n: house })}</h3>
                {prashna.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.6rem 0.75rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--teal)' }}>{t('inPrashna')}</div>
                    {prashna.map(g => <GroupBlock key={g.id} group={g} accent="var(--text-secondary)" />)}
                  </div>
                )}
                {natal.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('general')}</div>
                    {natal.map(g => <GroupBlock key={g.id} group={g} accent="var(--text-muted)" />)}
                  </div>
                )}
                <PlanetMedicalBlock />
              </div>
            </>
          )}
          <p style={{ margin: 0, fontSize: '0.66rem', color: 'var(--text-muted)' }}>{t('footnote')}</p>
        </div>
      )}
    </section>
  )
}
