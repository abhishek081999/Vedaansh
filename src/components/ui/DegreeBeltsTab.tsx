'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/DegreeBeltsTab.tsx
//  Degree belts (अंश क्षेत्र): each sign split into exaltation /
//  mooltrikona / own / debilitation belts, with this chart's
//  planets marked, the karakatvas each belt lifts or disturbs,
//  and the past–present–future read of Sun and the spouse karaka.
//  All text comes from the engine in the active language.
// ─────────────────────────────────────────────────────────────
import React, { useMemo } from 'react'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_SHORT_HI } from '@/i18n/jyotish'
import { fill, type EngineLang } from '@/lib/engine/lang'
import { gn } from '@/lib/engine/shrap/helpers'
import {
  buildDegreeBelts,
  degreeBeltsUiText,
  type BeltEffect,
  type BeltKind,
  type BeltPlacement,
  type BeltTone,
  type DegreeBelt,
  type KarakaTrajectory,
  type SignBeltRow,
  type StageTone,
} from '@/lib/engine/degreeBelts'
import { NATAL_KARAKATVA, type KarakatvaHouse } from '@/lib/engine/natalKarakatva'

type Ui = ReturnType<typeof degreeBeltsUiText>

const KIND_STYLE: Record<BeltKind, { bg: string; fg: string; border: string }> = {
  exaltation: { bg: 'var(--teal-soft)', fg: 'var(--teal)', border: 'var(--teal)' },
  mooltrikona: { bg: 'var(--gold-faint)', fg: 'var(--text-gold)', border: 'var(--gold)' },
  own: { bg: 'var(--surface-3)', fg: 'var(--text-secondary)', border: 'var(--border-soft)' },
  debilitation: { bg: 'var(--rose-soft)', fg: 'var(--rose)', border: 'var(--rose)' },
}

const TONE_COLOR: Record<BeltTone, string> = {
  strong: 'var(--teal)', good: 'var(--teal)', mixed: 'var(--text-muted)', weak: 'var(--rose)',
}

const EFFECT_COLOR: Record<BeltEffect, string> = {
  supported: 'var(--teal)', mixed: 'var(--text-muted)', disturbed: 'var(--rose)',
}

const STAGE_COLOR: Record<StageTone, string> = {
  good: 'var(--teal)', mixed: 'var(--text-muted)', hard: 'var(--rose)',
}

const KINDS: BeltKind[] = ['exaltation', 'mooltrikona', 'own', 'debilitation']
const HOUSES: KarakatvaHouse[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

function short(id: GrahaId, lang: EngineLang): string {
  return lang === 'hi' ? GRAHA_SHORT_HI[id] ?? id : id
}

export function DegreeBeltsTab({ chart }: { chart: ChartOutput }) {
  const { lang } = useLang()
  const ui = degreeBeltsUiText(lang)
  const reading = useMemo(() => buildDegreeBelts(chart, lang), [chart, lang])
  if (!reading) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
      <div style={card}>
        <div style={heading}>{ui.title}</div>
        <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>{ui.subtitle}</p>
        <details style={{ marginTop: '0.75rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-gold)', fontWeight: 600 }}>{ui.methodTitle}</summary>
          <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.6 }}>
            {reading.method.map((m) => <li key={m}>{m}</li>)}
          </ol>
        </details>
      </div>

      {/* Belt table */}
      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
          <span style={heading}>{ui.tableTitle}</span>
          <span style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {KINDS.map((k) => (
              <span key={k} style={{ ...chip, background: KIND_STYLE[k].bg, color: KIND_STYLE[k].fg, borderColor: KIND_STYLE[k].border }}>
                {ui.legend[k]}
              </span>
            ))}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '0.75rem' }}>
          {reading.table.map((row) => <BeltRow key={row.rashi} row={row} ui={ui} lang={lang} />)}
        </div>
      </section>

      {/* Placements */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={heading}>{ui.placementsTitle}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '0.6rem', alignItems: 'start' }}>
          {reading.placements.map((p) => <PlacementCard key={p.graha} p={p} ui={ui} />)}
        </div>
      </section>

      {/* Trajectories */}
      {reading.trajectories.length ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={heading}>{ui.trajectoryTitle}</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '0.6rem' }}>
            {reading.trajectories.map((tr) => <TrajectoryCard key={tr.topic} tr={tr} ui={ui} />)}
          </div>
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-gold)', lineHeight: 1.5 }}>{reading.practice}</p>
        </section>
      ) : null}

      {/* Natal karakatva reference */}
      <details style={card}>
        <summary style={{ cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-gold)', fontWeight: 600 }}>{ui.karakatvaTableTitle}</summary>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
          {HOUSES.map((h) => {
            const rows = NATAL_KARAKATVA.filter((k) => k.house === h)
            const planets = [...new Set(rows.map((r) => r.planet))]
            return (
              <div key={h}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fill(ui.house, { n: h })}</div>
                <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1rem', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {planets.map((pl) => (
                    <li key={pl}>
                      <strong style={{ color: 'var(--text-primary)' }}>{gn(pl, lang)}</strong>:{' '}
                      {rows.filter((r) => r.planet === pl).map((r) => (lang === 'hi' ? r.hi : r.en)).join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </details>

      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reading.disclaimer}</p>
    </div>
  )
}

/** Split belts into lanes so the Virgo overlap gets its own strip. */
function lanes(belts: DegreeBelt[]): DegreeBelt[][] {
  const out: DegreeBelt[][] = []
  for (const b of belts) {
    const lane = out.find((l) => l.every((x) => b.from > Math.min(29, x.to) || Math.min(29, b.to) < x.from))
    if (lane) lane.push(b)
    else out.push([b])
  }
  return out
}

function BeltRow({ row, ui, lang }: { row: SignBeltRow; ui: Ui; lang: EngineLang }) {
  const rowLanes = lanes(row.belts)
  // Markers within 3° of each other stack instead of covering one another.
  const markers = [...row.planets].sort((a, b) => a.degree - b.degree)
  const level: number[] = []
  markers.forEach((m, i) => {
    let l = 0
    while (markers.slice(0, i).some((o, j) => level[j] === l && m.degree - o.degree < 3)) l++
    level.push(l)
  })
  const markerH = markers.length ? (Math.max(...level) + 1) * 15 : 0
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(68px, 92px) 1fr', gap: '0.5rem', alignItems: 'center' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{row.rashiName}</div>
        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{fill(ui.house, { n: row.house })}</div>
      </div>
      <div style={{ position: 'relative', minWidth: 0, paddingTop: markerH }}>
        {markers.map((p, i) => (
          <span
            key={p.graha}
            title={`${gn(p.graha, lang)} ${p.degree.toFixed(2)}°`}
            style={{
              position: 'absolute',
              top: markerH - 15 - level[i] * 15,
              left: `${(Math.min(29.99, p.degree) / 30) * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: '0.62rem',
              fontWeight: 700,
              lineHeight: 1,
              padding: '1px 3px',
              borderRadius: 3,
              background: 'var(--text-primary)',
              color: 'var(--surface-1)',
              whiteSpace: 'nowrap',
              zIndex: 1 + i,
            }}
          >
            {short(p.graha, lang)}
          </span>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rowLanes.map((lane, li) => (
            <div key={li} style={{ position: 'relative', height: li === 0 ? 24 : 16 }}>
              {lane.map((b) => {
                const end = Math.min(29, b.to) + 1
                const s = KIND_STYLE[b.kind]
                return (
                  <div
                    key={`${b.from}-${b.owner}-${b.kind}`}
                    title={`${b.from}–${b.to}° · ${gn(b.owner, lang)} ${ui.legend[b.kind]}`}
                    style={{
                      position: 'absolute',
                      left: `${(b.from / 30) * 100}%`,
                      width: `${((end - b.from) / 30) * 100}%`,
                      top: 0,
                      bottom: 0,
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: s.fg,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {end - b.from >= 4 ? `${short(b.owner, lang)} ${b.from}–${b.to}` : short(b.owner, lang)}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlacementCard({ p, ui }: { p: BeltPlacement; ui: Ui }) {
  return (
    <div style={{ ...card, padding: '0.7rem 0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 0, overflowWrap: 'anywhere' }}>
          {p.name} · {p.degreeLabel} {p.rashiName}
          <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.72rem' }}> · {fill(ui.house, { n: p.house })}</span>
        </span>
        <span style={{ flexShrink: 0, fontSize: '0.64rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, color: '#fff', background: TONE_COLOR[p.tone] }}>
          {ui.tone[p.tone]}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
        {p.belts.map((b) => (
          <span key={b.label} style={{ ...chip, background: KIND_STYLE[b.kind].bg, color: KIND_STYLE[b.kind].fg, borderColor: KIND_STYLE[b.kind].border }}>
            {b.label}
          </span>
        ))}
        <span style={{ ...chip, color: TONE_COLOR[p.tone] }}>{p.standingLabel}</span>
      </div>
      <ul style={{ margin: '0.45rem 0 0', paddingLeft: '1rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {p.lines.map((l) => <li key={l}>{l}</li>)}
      </ul>
      {p.effects.length ? (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-soft)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {p.effects.map((e) => (
            <div key={`${e.planet}-${e.effect}`}>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.64rem', fontWeight: 700, color: EFFECT_COLOR[e.effect] }}>{ui.effect[e.effect]}</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{e.text}</span>
              </div>
              {e.karakatvas.length ? (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                  {e.karakatvas.map((k) => (
                    <span key={k.id} style={{ ...chip, borderColor: EFFECT_COLOR[e.effect] }}>{k.label}</span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {p.motionText ? (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: 'var(--text-gold)', lineHeight: 1.5 }}>{p.motionText}</p>
      ) : null}
    </div>
  )
}

function TrajectoryCard({ tr, ui }: { tr: KarakaTrajectory; ui: Ui }) {
  return (
    <div style={card}>
      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {tr.topicLabel} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>· {tr.name}</span>
      </div>
      <ol style={{ listStyle: 'none', margin: '0.5rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {tr.stages.map((s) => (
          <li key={s.stage} style={{ borderLeft: `3px solid ${STAGE_COLOR[s.tone]}`, paddingLeft: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.stageLabel}</span>
              <span style={{ fontSize: '0.64rem', fontWeight: 700, color: STAGE_COLOR[s.tone] }}>{ui.stageTone[s.tone]}</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.text}</div>
          </li>
        ))}
      </ol>
    </div>
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
