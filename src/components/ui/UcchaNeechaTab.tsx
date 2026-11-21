'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/UcchaNeechaTab.tsx
//  Uccha–Neecha lens: Lagna lord's exaltation house (motivation) and
//  debilitation house (insecurity), then every house or planet.
//  mode 'houses' (House panel) or 'planets' (Planets workspace).
//  All text comes from the engine in the active language.
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import { RASHI_HI } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { fill } from '@/lib/engine/lang'
import { gn } from '@/lib/engine/shrap/helpers'
import {
  analyzeUcchaNeechaLens,
  ucchaNeechaLabels,
  ucchaNeechaTitle,
  type UNFocus,
  type UNHouseLens,
} from '@/lib/engine/ucchaNeechaLens'

const SEVEN: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

const card: React.CSSProperties = {
  padding: '1rem 1.1rem',
  background: 'var(--surface-2)',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border-soft)',
  minWidth: 0,
}
const heading: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }
const body: React.CSSProperties = { margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }
const chip: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.15rem 0.5rem',
  borderRadius: 999,
  fontSize: '0.7rem',
  fontWeight: 600,
  background: 'var(--surface-3)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-soft)',
}
const sectionTitle: React.CSSProperties = { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-gold)' }

function FocusCard({ f, lang }: { f: UNFocus; lang: 'en' | 'hi' }) {
  const L = ucchaNeechaLabels(lang)
  const accent = f.kind === 'motivation' ? (f.strained ? 'var(--amber)' : 'var(--teal)') : (f.strained ? 'var(--rose)' : 'var(--amber)')
  return (
    <div style={{ ...card, borderColor: accent }}>
      <div style={heading}>{ucchaNeechaTitle(f.kind, f.house, lang)}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
        {fill(L.subtitle, { lord: gn(f.lord, lang), sign: lang === 'hi' ? RASHI_HI[f.sign] : RASHI_NAMES[f.sign] })}
      </div>
      <p style={body}>{f.summary}</p>
      <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', ...body }}>
        {f.points.map((p) => <li key={p}>{p}</li>)}
      </ul>
      {f.facets.length ? (
        <div style={{ marginTop: '0.6rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>{L.karakas}</div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {f.facets.map((x) => (
              <span
                key={x.graha}
                style={{
                  ...chip,
                  borderColor: x.condition === 'strong' ? 'var(--teal)' : x.condition === 'weak' ? 'var(--rose)' : 'var(--border-soft)',
                }}
              >
                {gn(x.graha, lang)} · {x.facet}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function HouseRow({ h, open, onToggle, lang }: { h: UNHouseLens; open: boolean; onToggle: () => void; lang: 'en' | 'hi' }) {
  const L = ucchaNeechaLabels(lang)
  return (
    <div style={{ ...card, padding: 0 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text-primary)',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{fill(L.house, { n: h.house })} · {gn(h.lord, lang)}</span>
        <span style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ ...chip, borderColor: 'var(--teal)' }}>{L.colDrive}: {h.motivationHouse}</span>
          <span style={{ ...chip, borderColor: 'var(--amber)' }}>{L.colFear}: {h.insecurityHouse}</span>
        </span>
      </button>
      {open ? (
        <div style={{ padding: '0 1rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {h.house !== 1 ? (
            <>
              <p style={body}><strong>{L.motivation}:</strong> {h.motivationText}</p>
              <p style={body}><strong>{L.insecurity}:</strong> {h.insecurityText}</p>
            </>
          ) : null}
          <div>
            <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{L.bhavatBhavam}</strong>
            <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem', ...body }}>
              {h.bhavatBhavam.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
          {h.special ? <p style={{ ...body, color: 'var(--text-gold)' }}>{h.special}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

export function UcchaNeechaTab({ chart, mode = 'houses' }: { chart: ChartOutput; mode?: 'houses' | 'planets' }) {
  const { lang } = useLang()
  const L = ucchaNeechaLabels(lang)
  const un = useMemo(() => {
    try {
      return analyzeUcchaNeechaLens(chart, lang)
    } catch {
      return null
    }
  }, [chart, lang])
  const [open, setOpen] = useState<number | null>(null)
  if (!un) return null

  const planetRows = SEVEN.map((id) => {
    const owned = un.houses.filter((h) => h.lord === id)
    const g = chart.grahas.find((p) => p.id === id)
    const lensText = un.planets.find((p) => p.graha === id)?.text
    return { id, owned, dignity: g?.dignity, lensText }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
      <div style={card}>
        <div style={heading}>{L.tabTitle}</div>
        <p style={body}>{L.tabIntro}</p>
        <details style={{ marginTop: '0.6rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-gold)', fontWeight: 600 }}>{L.method}</summary>
          <p style={body}>{un.method}</p>
          <p style={body}><strong>{L.duty}:</strong> {un.dutyNote}</p>
        </details>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '0.75rem' }}>
        <FocusCard f={un.motivation} lang={lang} />
        <FocusCard f={un.insecurity} lang={lang} />
      </div>

      {mode === 'houses' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={sectionTitle}>{L.housesTitle}</div>
          {un.houses.map((h) => (
            <HouseRow key={h.house} h={h} lang={lang} open={open === h.house} onToggle={() => setOpen(open === h.house ? null : h.house)} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={sectionTitle}>{L.planetsTitle}</div>
          <p style={{ ...body, margin: 0 }}>{L.planetsIntro}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.75rem' }}>
            {planetRows.map((r) => {
              const first = r.owned[0]
              const badge = r.dignity === 'exalted' ? L.exalted : r.dignity === 'debilitated' ? L.debilitated : null
              return (
                <div
                  key={r.id}
                  style={{
                    ...card,
                    borderColor: r.dignity === 'exalted' ? 'var(--teal)' : r.dignity === 'debilitated' ? 'var(--rose)' : 'var(--border-soft)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ ...heading, fontSize: '0.9rem' }}>{gn(r.id, lang)}</span>
                    {badge ? <span style={chip}>{badge}</span> : null}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {r.owned.length ? fill(L.rules, { list: r.owned.map((h) => h.house).join(', ') }) : L.noRule}
                  </div>
                  {first ? (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      <span style={{ ...chip, borderColor: 'var(--teal)' }}>{L.colDrive}: {first.motivationHouse}</span>
                      <span style={{ ...chip, borderColor: 'var(--amber)' }}>{L.colFear}: {first.insecurityHouse}</span>
                    </div>
                  ) : null}
                  {r.owned.filter((h) => h.house !== 1).map((h) => (
                    <p key={h.house} style={body}>{fill(L.house, { n: h.house })}: {h.motivationText}</p>
                  ))}
                  {r.lensText ? <p style={{ ...body, color: 'var(--text-primary)' }}>{r.lensText}</p> : null}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
