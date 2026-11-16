'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/KarakaLensTab.tsx
//  House + Karaka lens — event-level significations judged on
//  this chart (house affliction × karaka affliction).
//  All text comes from the engine in the active language.
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { gn } from '@/lib/engine/shrap/helpers'
import {
  bklUiText,
  buildBhavaKarakaLens,
  type BklHouse,
  type BklHouseState,
  type BklItemReading,
  type BklPlanetState,
  type BklVerdict,
} from '@/lib/engine/bhavaKarakaLens'

type Filter = 'asked' | 'all' | 'flagged'

const VERDICT_TONE: Record<BklVerdict, { fg: string; bg: string; border: string }> = {
  pinpointed: { fg: 'var(--rose)', bg: 'var(--rose-soft)', border: 'var(--rose)' },
  houseOnly: { fg: 'var(--amber)', bg: 'var(--gold-faint)', border: 'var(--gold)' },
  karakaOnly: { fg: 'var(--amber)', bg: 'var(--gold-faint)', border: 'var(--gold)' },
  supported: { fg: 'var(--teal)', bg: 'var(--teal-soft)', border: 'var(--teal)' },
  steady: { fg: 'var(--text-secondary)', bg: 'var(--surface-3)', border: 'var(--border-soft)' },
  houseRead: { fg: 'var(--text-muted)', bg: 'var(--surface-3)', border: 'var(--border-soft)' },
}

const FLAGGED: BklVerdict[] = ['pinpointed', 'houseOnly', 'karakaOnly']

export function KarakaLensTab({ chart }: { chart: ChartOutput }) {
  const { lang } = useLang()
  const ui = bklUiText(lang)
  const lens = useMemo(() => buildBhavaKarakaLens(chart, lang), [chart, lang])
  const [filter, setFilter] = useState<Filter>('asked')
  const [house, setHouse] = useState<BklHouse | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  if (!lens) return null

  const stateText = (s: BklHouseState | BklPlanetState) =>
    s === 'afflicted' ? ui.stateAfflicted : s === 'supported' ? ui.stateSupported : s === 'strong' ? ui.stateStrong : ui.stateMixed

  const visible = lens.items.filter((it) => {
    if (house && it.house !== house) return false
    if (filter === 'asked') return it.asked
    if (filter === 'flagged') return FLAGGED.includes(it.verdict)
    return true
  })

  const byHouse = new Map<BklHouse, BklItemReading[]>()
  for (const it of visible) {
    const list = byHouse.get(it.house) ?? []
    list.push(it)
    byHouse.set(it.house, list)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
      {/* Header */}
      <div style={card}>
        <div style={heading}>{ui.title}</div>
        <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>{ui.subtitle}</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <Stat n={lens.counts.pinpointed} label={ui.countPinpointed} tone={VERDICT_TONE.pinpointed} />
          <Stat n={lens.counts.supported} label={ui.countSupported} tone={VERDICT_TONE.supported} />
        </div>
        <details style={{ marginTop: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-gold)', fontWeight: 600 }}>{ui.methodTitle}</summary>
          <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.6 }}>
            {lens.method.map((m) => <li key={m}>{m}</li>)}
          </ol>
        </details>
      </div>

      {/* Rules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.75rem' }}>
        {lens.rules.map((r) => {
          const warn = r.id === 'moonMercuryJupiter' ? r.active : !r.active
          return (
            <div key={r.id} style={{ ...card, borderLeft: `3px solid ${warn ? 'var(--rose)' : 'var(--gold)'}` }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.title}</div>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{r.text}</p>
              {r.avoidGems && r.avoidGems.length > 0 ? (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {r.avoidLabel}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                    {r.avoidGems.map((g) => (
                      <span key={g.planet} style={chip}>{gn(g.planet, lang)} · {g.gem}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {(['asked', 'flagged', 'all'] as Filter[]).map((f) => (
            <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === 'asked' ? ui.filterAsked : f === 'flagged' ? ui.filterFlagged : ui.filterAll}
            </Pill>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as BklHouse[]).map((h) => {
            const s = lens.houses[h].state
            return (
              <button
                key={h}
                type="button"
                onClick={() => setHouse(house === h ? null : h)}
                aria-pressed={house === h}
                title={`${fill(ui.house, { n: h })} · ${stateText(s)}`}
                style={{
                  minWidth: 34,
                  padding: '0.3rem 0.45rem',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: house === h ? 'var(--gold-faint)' : 'var(--surface-2)',
                  color: house === h ? 'var(--text-gold)' : 'var(--text-secondary)',
                  border: `1px solid ${house === h ? 'var(--gold)' : 'var(--border-soft)'}`,
                  borderBottom: `3px solid ${s === 'afflicted' ? 'var(--rose)' : s === 'supported' ? 'var(--teal)' : 'var(--border-soft)'}`,
                }}
              >
                {h}
              </button>
            )
          })}
        </div>
      </div>

      {/* Items */}
      {visible.length === 0 ? (
        <div style={{ ...card, color: 'var(--text-muted)', fontSize: '0.82rem' }}>{ui.empty}</div>
      ) : (
        [...byHouse.entries()].map(([h, list]) => {
          const hr = lens.houses[h]
          return (
            <section key={h} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={heading}>{fill(ui.house, { n: h })}</span>
                <span style={{ fontSize: '0.72rem', color: hr.state === 'afflicted' ? 'var(--rose)' : 'var(--text-muted)' }}>
                  {stateText(hr.state)}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '0.6rem', alignItems: 'start' }}>
                {list.map((it) => (
                  <ItemCard
                    key={it.id}
                    item={it}
                    open={open === it.id}
                    onToggle={() => setOpen(open === it.id ? null : it.id)}
                    lens={lens}
                    ui={ui}
                    lang={lang}
                    stateText={stateText}
                  />
                ))}
              </div>
            </section>
          )
        })
      )}

      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{lens.disclaimer}</p>
    </div>
  )
}

function ItemCard({
  item, open, onToggle, lens, ui, lang, stateText,
}: {
  item: BklItemReading
  open: boolean
  onToggle: () => void
  lens: NonNullable<ReturnType<typeof buildBhavaKarakaLens>>
  ui: ReturnType<typeof bklUiText>
  lang: EngineLang
  stateText: (s: BklHouseState | BklPlanetState) => string
}) {
  const tone = VERDICT_TONE[item.verdict]
  const houses = [item.house, ...item.withHouses]
  return (
    <div style={{ ...card, padding: '0.7rem 0.8rem', borderLeft: `3px solid ${tone.border}` }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 0, overflowWrap: 'anywhere' }}>{item.label}</span>
          <span
            style={{
              flexShrink: 0, fontSize: '0.64rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999,
              border: `1px solid ${tone.border}`,
              // Strong verdicts are filled so they read at a glance.
              ...(item.verdict === 'pinpointed' || item.verdict === 'supported'
                ? { color: '#fff', background: tone.border }
                : { color: tone.fg, background: tone.bg }),
            }}
          >
            {item.verdictLabel}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.45rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{houses.map((h) => `H${h}`).join(' + ')} ·</span>
          {item.karakas.length === 0 ? (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{ui.houseOnly}</span>
          ) : (
            item.karakas.map((k) => <KarakaChip key={k} id={k} state={lens.planets[k]?.state} lang={lang} />)
          )}
          {item.noFixedKaraka ? <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>({ui.noFixed})</span> : null}
        </div>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.summary}</p>
      </button>

      {open ? (
        <div style={{ marginTop: '0.55rem', paddingTop: '0.55rem', borderTop: '1px dashed var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {item.note ? <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-gold)', lineHeight: 1.5 }}>{item.note}</p> : null}
          {houses.map((h) => {
            const hr = lens.houses[h]
            return (
              <Why key={`h${h}`} title={`${fill(ui.whyHouse, { n: h })} — ${stateText(hr.state)}`} lines={hr.reasons.map((r) => r.text)} />
            )
          })}
          {item.karakas.map((k) => {
            const pr = lens.planets[k]
            if (!pr) return null
            return <Why key={k} title={`${fill(ui.whyKaraka, { p: pr.name })} — ${stateText(pr.state)}`} lines={pr.reasons.map((r) => r.text)} />
          })}
          {item.altKarakas.length ? (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {ui.alt}: {item.altKarakas.map((k) => gn(k, lang)).join(', ')}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Why({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      {lines.length ? (
        <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1.05rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {lines.map((l, i) => <li key={`${l}-${i}`}>{l}</li>)}
        </ul>
      ) : (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</div>
      )}
    </div>
  )
}

function KarakaChip({ id, state, lang }: { id: GrahaId; state?: BklPlanetState; lang: EngineLang }) {
  const color = state === 'afflicted' ? 'var(--rose)' : state === 'strong' ? 'var(--teal)' : 'var(--border-soft)'
  return (
    <span style={{ ...chip, borderColor: color, color: state === 'afflicted' ? 'var(--rose)' : 'var(--text-primary)' }}>
      {gn(id, lang)}
    </span>
  )
}

function Stat({ n, label, tone }: { n: number; label: string; tone: { fg: string; bg: string; border: string } }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.35rem', padding: '0.3rem 0.65rem', borderRadius: 999, background: tone.border, border: `1px solid ${tone.border}` }}>
      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{n}</strong>
      <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 600 }}>{label}</span>
    </span>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '0.35rem 0.8rem',
        borderRadius: 999,
        cursor: 'pointer',
        fontSize: '0.76rem',
        fontWeight: active ? 700 : 500,
        background: active ? 'var(--gold-faint)' : 'var(--surface-2)',
        color: active ? 'var(--text-gold)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--gold)' : 'var(--border-soft)'}`,
      }}
    >
      {children}
    </button>
  )
}

const card: React.CSSProperties = {
  padding: '0.9rem 1rem',
  background: 'var(--surface-2)',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border-soft)',
  minWidth: 0,
}

const chip: React.CSSProperties = {
  padding: '1px 7px',
  borderRadius: 5,
  fontSize: '0.7rem',
  fontWeight: 600,
  background: 'var(--surface-3)',
  border: '1px solid var(--border-soft)',
}

const heading: React.CSSProperties = {
  fontSize: '0.66rem',
  fontWeight: 700,
  color: 'var(--text-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}
