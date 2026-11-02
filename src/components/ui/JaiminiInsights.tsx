// ─────────────────────────────────────────────────────────────
//  src/components/ui/JaiminiInsights.tsx
//  Focused Jaimini readings (argala, lagnas, houses, transits)
//  and the All Dashas board. Every reading follows the chosen method.
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  argalaResultPhaseStart,
  readArgalaTable,
  type ArgalaStatus,
} from '@/lib/engine/jaimini/argala'
import { calculateJaiminiBala } from '@/lib/engine/jaimini/bala'
import {
  BOARD_AREA_NAMES,
  LIFE_EVENT_TYPES,
  buildDashaBoard,
  matchLifeEvent,
  rankSystems,
  type BoardSystem,
  type LifeEvent,
  type LifeEventType,
  type MatchAnchors,
} from '@/lib/engine/jaimini/dashaBoard'
import {
  readAkNakshatra,
  readArudhaInsights,
  readGateway,
  readHouseTriads,
  readSpecialLagnas,
  readTransitTriggers,
  readTrinityActivation,
  strengthOfBala,
  type InsightContext,
  type TransitPosition,
} from '@/lib/engine/jaimini/insights'
import type { JaiminiMethod } from '@/lib/engine/jaimini/method'
import type { CharaKarakaResult } from '@/lib/engine/karakas'
import styles from './JaiminiPanel.module.css'

const text: React.CSSProperties = { margin: 0, fontSize: '0.74rem', lineHeight: 1.5 }
const muted: React.CSSProperties = { ...text, color: 'var(--text-secondary)' }

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>{title}</div>
      <div className={styles.sectionBody} style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ padding: '0.5rem 0.65rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: accent ?? 'var(--text-primary)', marginBottom: '0.15rem' }}>{title}</div>
      {children}
    </div>
  )
}

const STATUS_LABEL: Record<ArgalaStatus, { label: string; color: string }> = {
  none: { label: 'None', color: 'var(--text-muted)' },
  open: { label: 'Open', color: 'var(--teal)' },
  strong: { label: 'Beats block', color: 'var(--gold)' },
  partial: { label: 'Partial', color: 'var(--gold)' },
  blocked: { label: 'Blocked', color: 'var(--combust)' },
}

const BAND_COLOR = { strong: 'var(--teal)', middling: 'var(--gold)', weak: 'var(--combust)' } as const

function formatDate(value: Date): string {
  return value.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
}

function names(ids: GrahaId[]): string {
  return ids.map(id => GRAHA_NAMES[id]).join(', ')
}

export type JaiminiInsightSection =
  | 'argala'
  | 'gateway'
  | 'lagnas'
  | 'trinity'
  | 'arudha'
  | 'houses'
  | 'nakshatra'
  | 'transits'

export function JaiminiDeepReading({
  chart,
  karakas,
  method,
  nodes,
  arudhas,
  dwaraSign,
  section,
}: {
  chart: ChartOutput
  karakas: CharaKarakaResult
  method: JaiminiMethod
  nodes: BoardSystem['nodes']
  arudhas: { AL: Rashi; A7: Rashi; A12: Rashi }
  dwaraSign: Rashi | null
  section: JaiminiInsightSection
}) {
  const [transits, setTransits] = useState<TransitPosition[] | null>(null)
  const [transitFailed, setTransitFailed] = useState(false)
  const ascRashi = chart.lagnas.ascRashi

  useEffect(() => {
    if (section !== 'transits') return
    let cancelled = false
    fetch(`/api/transit?ascRashi=${ascRashi}`)
      .then(res => res.json())
      .then(body => {
        if (cancelled) return
        const rows = Array.isArray(body?.currentPositions) ? body.currentPositions : []
        setTransits(rows.flatMap((row: { planetId?: GrahaId; sign?: Rashi }) => (
          row.planetId && row.sign ? [{ id: row.planetId, rashi: row.sign }] : []
        )))
      })
      .catch(() => {
        if (!cancelled) setTransitFailed(true)
      })
    return () => { cancelled = true }
  }, [ascRashi, section])

  const ctx = useMemo<InsightContext>(() => ({
    grahas: chart.grahas,
    lagnas: chart.lagnas,
    roleOf: karakas.roleOf,
    bala: calculateJaiminiBala({ grahas: chart.grahas, lagnas: chart.lagnas }),
    nodes,
    method,
  }), [chart.grahas, chart.lagnas, karakas.roleOf, nodes, method])

  const argala = useMemo(
    () => readArgalaTable(
      ascRashi,
      chart.grahas.filter(g => GRAHA_NAMES[g.id]).map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree })),
      strengthOfBala(ctx.bala),
      method,
    ),
    [ascRashi, chart.grahas, ctx.bala, method],
  )
  const gateway = dwaraSign ? readGateway(ctx, dwaraSign) : null
  const special = useMemo(() => readSpecialLagnas(ctx), [ctx])
  const trinity = useMemo(() => readTrinityActivation(ctx), [ctx])
  const arudhaInsights = useMemo(() => readArudhaInsights(ctx, arudhas), [ctx, arudhas])
  const triads = useMemo(() => readHouseTriads(ctx), [ctx])
  const nakshatra = useMemo(() => readAkNakshatra(ctx, karakas.AK), [ctx, karakas.AK])
  const trigger = useMemo(
    () => transits
      ? readTransitTriggers(ctx, transits, { dashaSign: dwaraSign, ak: karakas.AK, dk: karakas.DK, upapada: arudhas.A12 })
      : null,
    [ctx, transits, dwaraSign, karakas.AK, karakas.DK, arudhas.A12],
  )

  const runningMaha = nodes.find(n => n.isCurrent)
  const resultPhase = method === 'practical' && runningMaha
    ? argalaResultPhaseStart(runningMaha.start, runningMaha.end)
    : null

  return (
    <>
      {section === 'argala' && (
      <Card title="Argala on all 12 houses">
        <p style={muted}>
          {method === 'practical'
            ? 'Read in order of influence: 4th, then 2nd, then 11th, with the 5th as conditional argala. A planet obstructs only from the opposite degree quarter.'
            : 'Each source is obstructed by the house opposite to it in the scheme: 12th for 2nd, 10th for 4th, 3rd for 11th, 9th for 5th. The side with more planets, then more strength, wins.'}
        </p>
        {resultPhase && (
          <p style={text}>
            Argala works like a toll booth: effort comes first and results gather near the end. For the running dasha, that phase starts around {formatDate(resultPhase)}.
          </p>
        )}
        {argala.map(row => (
          <Row key={row.house} title={`House ${row.house} · ${RASHI_NAMES[row.sign]}${row.occupants.length ? ` · ${names(row.occupants)}` : ''}`}>
            <p style={text}>{row.summary}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', margin: '0.3rem 0' }}>
              {row.sources.filter(s => s.status !== 'none').map(s => (
                <span
                  key={s.id}
                  title={s.note}
                  style={{ fontSize: '0.64rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 6, border: `1px solid ${STATUS_LABEL[s.status].color}`, color: STATUS_LABEL[s.status].color }}
                >
                  {s.id} {names(s.occupants)}: {STATUS_LABEL[s.status].label}
                </span>
              ))}
              {row.selfDriven && (
                <span style={{ fontSize: '0.64rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 6, border: '1px solid var(--teal)', color: 'var(--teal)' }}>
                  Self-driven
                </span>
              )}
            </div>
            {row.sources.some(s => s.status !== 'none') && <p style={muted}>{row.meaning}</p>}
          </Row>
        ))}
      </Card>
      )}

      {section === 'gateway' && (
      <Card title="Dwara and Bahya">
        {gateway ? (
          <>
            <p style={text}>{gateway.entry}</p>
            <p style={{ ...text, color: BAND_COLOR[gateway.band] }}>{gateway.exit}</p>
            {gateway.useFor && <p style={muted}>{gateway.useFor}</p>}
          </>
        ) : (
          <p style={muted}>No sign is running in this dasha.</p>
        )}
      </Card>
      )}

      {section === 'lagnas' && (
      <Card title="Ghatika, Varnada, and Hora Lagna">
        {special.rows.map(row => (
          <Row key={row.id} title={`${row.name} · ${RASHI_NAMES[row.sign]}`} accent={BAND_COLOR[row.band]}>
            <p style={text}>{row.reading}</p>
            <p style={muted}>{row.timing}</p>
          </Row>
        ))}
        {special.comparison && <p style={text}>{special.comparison}</p>}
      </Card>
      )}

      {section === 'trinity' && (
      <Card title="Brahma, Maheshwara, and Rudra timing">
        {trinity.map(row => (
          <Row key={row.id} title={`${row.title}${row.active ? ' · active now' : ''}`} accent={row.active ? 'var(--gold)' : undefined}>
            <p style={text}>{row.theme}</p>
            <p style={muted}>{row.timing}</p>
          </Row>
        ))}
      </Card>
      )}

      {section === 'arudha' && (
      <Card title="Arudha: money and image">
        {arudhaInsights.map(row => (
          <Row key={row.id} title={row.title}>
            <p style={text}>{row.text}</p>
          </Row>
        ))}
      </Card>
      )}

      {section === 'houses' && (
      <Card title="Each house: chara karaka, lord, and fixed karaka">
        {triads.map(row => (
          <Row key={row.house} title={`House ${row.house} · ${RASHI_NAMES[row.sign]}`}>
            <p style={text}>{row.reading}</p>
          </Row>
        ))}
      </Card>
      )}

      {section === 'nakshatra' && nakshatra && (
        <Card title="Atmakaraka nakshatra">
          <p style={text}>
            {GRAHA_NAMES[nakshatra.planet]} is in {nakshatra.nakshatra}, pada {nakshatra.pada}, ruled by {GRAHA_NAMES[nakshatra.lord]}. {nakshatra.nature}
          </p>
          {nakshatra.story && <p style={text}>Past-life picture: {nakshatra.story}</p>}
          {nakshatra.cause && <p style={text}>{nakshatra.cause}</p>}
          {method === 'practical' && !nakshatra.detailed && (
            <p style={muted}>This is the general nature of the nakshatra.</p>
          )}
        </Card>
      )}

      {section === 'transits' && (
      <Card title="Transit triggers today">
        {transitFailed && <p style={muted}>Today&apos;s transits could not be loaded.</p>}
        {!transitFailed && !trigger && <p style={muted}>Loading today&apos;s transits.</p>}
        {trigger?.rows.map(row => (
          <Row key={row.target} title={`${row.target} · ${RASHI_NAMES[row.sign]}`}>
            <p style={row.hits.length ? text : muted}>{row.hits.length ? `${row.hits.join('. ')}.` : 'No slow planet touches this sign now.'}</p>
          </Row>
        ))}
        {trigger?.confirmation && (
          <Row title={`Event check: ${trigger.confirmation.count} of 4`} accent="var(--gold)">
            <p style={text}>{trigger.confirmation.text}</p>
            <p style={muted}>
              Dasha yes · Karaka {trigger.confirmation.karaka ? 'yes' : 'no'} · Argala {trigger.confirmation.argala ? 'yes' : 'no'} · Transit {trigger.confirmation.transit ? 'yes' : 'no'}
            </p>
          </Row>
        )}
      </Card>
      )}
    </>
  )
}

const EVENT_KEY_PREFIX = 'jaimini-life-events:'

function loadEvents(key: string): LifeEvent[] {
  try {
    const raw = window.localStorage.getItem(EVENT_KEY_PREFIX + key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveEvents(key: string, events: LifeEvent[]): void {
  try {
    window.localStorage.setItem(EVENT_KEY_PREFIX + key, JSON.stringify(events))
  } catch {
    // Events stay in memory for this visit when storage is blocked.
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

export function JaiminiAllDashas({
  chart,
  karakas,
  method,
  systems,
  anchors,
}: {
  chart: ChartOutput
  karakas: CharaKarakaResult
  method: JaiminiMethod
  systems: BoardSystem[]
  anchors: Omit<MatchAnchors, 'karakas'>
}) {
  const [dateText, setDateText] = useState(() => new Date().toISOString().slice(0, 10))
  const chartKey = `${chart.meta.birthDate}|${chart.meta.birthTime}`
  const [events, setEvents] = useState<LifeEvent[]>([])
  const [newType, setNewType] = useState<LifeEventType>('marriage')
  const [newDate, setNewDate] = useState('')

  useEffect(() => {
    setEvents(loadEvents(chartKey))
  }, [chartKey])

  const input = useMemo(() => ({
    grahas: chart.grahas,
    lagna: chart.lagnas.ascRashi,
    roleOf: karakas.roleOf,
    method,
  }), [chart.grahas, chart.lagnas.ascRashi, karakas.roleOf, method])

  const board = useMemo(() => {
    const asOf = new Date(`${dateText}T12:00:00Z`)
    return buildDashaBoard(systems, input, Number.isFinite(asOf.getTime()) ? asOf : new Date())
  }, [systems, input, dateText])

  const matches = useMemo(() => {
    const fullAnchors: MatchAnchors = { ...anchors, karakas }
    return events.flatMap(event => {
      const hit = matchLifeEvent(event, systems, input, fullAnchors)
      return hit ? [hit] : []
    })
  }, [events, systems, input, anchors, karakas])
  const ranking = useMemo(() => rankSystems(matches), [matches])

  const updateEvents = (next: LifeEvent[]) => {
    setEvents(next)
    saveEvents(chartKey, next)
  }

  const addEvent = () => {
    if (!newDate) return
    updateEvents([...events, { id: `${Date.now()}`, type: newType, date: newDate }])
    setNewDate('')
  }

  const print = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const rows = board.rows.map(row => `
      <tr><th>${escapeHtml(row.name)}</th>${[0, 1, 2].map(i => {
        const p = row.periods[i]
        return `<td>${p ? `<b>${escapeHtml(p.label)}</b><br/>${escapeHtml(p.detail)}<br/><small>${escapeHtml(formatDate(p.start))} to ${escapeHtml(formatDate(p.end))}</small>` : ''}</td>`
      }).join('')}</tr>`).join('')
    const agree = board.agreements.map(a => `<li>${escapeHtml(a.name)}: ${escapeHtml(a.systems.join(', '))}</li>`).join('')
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>All Dashas</title>
      <style>body{font:13px system-ui;margin:24px;color:#111}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:6px;text-align:left;vertical-align:top}small{color:#555}</style>
      </head><body><h2>All Dashas for ${escapeHtml(dateText)}</h2>
      <table><thead><tr><th>System</th><th>Maha</th><th>Antar</th><th>Pratyantar</th></tr></thead><tbody>${rows}</tbody></table>
      ${agree ? `<h3>Where the systems agree</h3><ul>${agree}</ul>` : ''}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  const fieldStyle: React.CSSProperties = {
    padding: '0.3rem 0.45rem',
    borderRadius: 6,
    background: 'var(--surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-soft)',
    fontSize: '0.74rem',
  }
  const buttonStyle: React.CSSProperties = {
    ...fieldStyle,
    color: 'var(--gold)',
    fontWeight: 700,
    cursor: 'pointer',
  }

  return (
    <>
      <Card title="All dashas on one page">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>
            Date{' '}
            <input type="date" value={dateText} onChange={e => setDateText(e.target.value)} style={fieldStyle} />
          </label>
          <button type="button" onClick={print} style={buttonStyle}>Print</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead>
              <tr>
                {['System', 'Maha', 'Antar', 'Pratyantar'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.35rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.rows.map(row => (
                <tr key={row.id}>
                  <td style={{ padding: '0.35rem', fontWeight: 800, verticalAlign: 'top', borderBottom: '1px solid var(--border-soft)' }}>{row.name}</td>
                  {[0, 1, 2].map(i => {
                    const p = row.periods[i]
                    return (
                      <td key={i} style={{ padding: '0.35rem', verticalAlign: 'top', borderBottom: '1px solid var(--border-soft)' }}>
                        {p ? (
                          <>
                            <div style={{ fontWeight: 700 }}>{p.label}</div>
                            <div style={{ color: 'var(--text-secondary)' }}>{p.detail}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>{formatDate(p.start)} to {formatDate(p.end)}</div>
                          </>
                        ) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Where the systems agree">
        <p style={muted}>
          {method === 'practical'
            ? 'Counts each system\'s Maha and Antar by house, by planet lordship, and by the karakas involved.'
            : 'Counts each system\'s Maha and Antar by house and by planet lordship.'}
        </p>
        {board.agreements.length === 0 && <p style={muted}>No life area is shared by two systems on this date.</p>}
        {board.agreements.map(a => (
          <Row key={a.area} title={`${BOARD_AREA_NAMES[a.area]} · ${a.systems.length} systems`} accent={a.strong ? 'var(--gold)' : undefined}>
            <p style={text}>{a.systems.join(', ')}</p>
          </Row>
        ))}
      </Card>

      <Card title="Check dashas against real events">
        <p style={muted}>
          Add dated events from this person&apos;s life to see which dasha system fits. The events are saved only in this browser.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <select aria-label="Event type" value={newType} onChange={e => setNewType(e.target.value as LifeEventType)} style={fieldStyle}>
            {LIFE_EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input aria-label="Event date" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={fieldStyle} />
          <button type="button" onClick={addEvent} disabled={!newDate} style={{ ...buttonStyle, opacity: newDate ? 1 : 0.5 }}>Add event</button>
        </div>

        {ranking.length > 0 && (
          <Row title="Best fit so far" accent="var(--gold)">
            {ranking.map(r => (
              <p key={r.id} style={text}>{r.name}: {r.average}% over {r.events} {r.events === 1 ? 'event' : 'events'}</p>
            ))}
            <p style={muted}>This is a signal, not proof. Use several events, because a single match can happen by chance.</p>
          </Row>
        )}

        {matches.map(match => (
          <Row key={match.event.id} title={`${LIFE_EVENT_TYPES.find(t => t.id === match.event.type)?.name} · ${match.event.date}`}>
            {match.systems.map(s => (
              <details key={s.id} style={{ fontSize: '0.72rem' }}>
                <summary style={{ cursor: 'pointer' }}>{s.name}: {s.score}% · {s.periods}</summary>
                {s.reasons.map(reason => <p key={reason} style={muted}>{reason}</p>)}
              </details>
            ))}
            <p style={muted}>{match.baseline}% of signs count as a match for this event type, so scores near that mean little.</p>
            <button
              type="button"
              onClick={() => updateEvents(events.filter(e => e.id !== match.event.id))}
              style={{ ...buttonStyle, marginTop: '0.3rem', color: 'var(--text-muted)' }}
            >
              Remove
            </button>
          </Row>
        ))}
      </Card>
    </>
  )
}
