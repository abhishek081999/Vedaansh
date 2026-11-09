// ─────────────────────────────────────────────────────────────
//  src/components/ui/JaiminiInsights.tsx
//  Focused Jaimini readings (argala, lagnas, houses, transits)
//  and the All Dashas board. Every reading follows the chosen method.
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import {
  argalaResultPhaseStart,
  readArgalaTable,
  type ArgalaStatus,
} from '@/lib/engine/jaimini/argala'
import { calculateJaiminiBala } from '@/lib/engine/jaimini/bala'
import {
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

const STATUS_COLOR: Record<ArgalaStatus, string> = {
  none: 'var(--text-muted)',
  open: 'var(--teal)',
  strong: 'var(--gold)',
  partial: 'var(--gold)',
  blocked: 'var(--combust)',
}

const BAND_COLOR = { strong: 'var(--teal)', middling: 'var(--gold)', weak: 'var(--combust)' } as const

function formatDate(value: Date, tag: string): string {
  return value.toLocaleDateString(tag, { year: 'numeric', month: 'short' })
}

function names(ids: GrahaId[], hi: boolean): string {
  return ids.map(id => (hi ? GRAHA_HI[id] : GRAHA_NAMES[id])).join(', ')
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
  const t = useTranslations('jaimini.insights')
  const tRead = useTranslations('jaimini.readings')
  const tStatus = useTranslations('jaimini.status')
  const tArgala = useTranslations('jaimini.argala')
  const tIntel = useTranslations('jaimini.intel')
  const { lang, tag, hi } = useLang()
  const [transits, setTransits] = useState<TransitPosition[] | null>(null)
  const [transitFailed, setTransitFailed] = useState(false)
  const ascRashi = chart.lagnas.ascRashi
  const rashiLabel = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const grahaLabel = (id: GrahaId) => (hi ? GRAHA_HI[id] : GRAHA_NAMES[id])

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
    lang,
  }), [chart.grahas, chart.lagnas, karakas.roleOf, nodes, method, lang])

  const argala = useMemo(
    () => readArgalaTable(
      ascRashi,
      chart.grahas.filter(g => GRAHA_NAMES[g.id]).map(g => ({ id: g.id, rashi: g.rashi, degree: g.degree })),
      strengthOfBala(ctx.bala),
      method,
      lang,
    ),
    [ascRashi, chart.grahas, ctx.bala, method, lang],
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
      <Card title={t('argalaTitle')}>
        <p style={muted}>
          {method === 'practical' ? t('argalaPractical') : t('argalaClassical')}
        </p>
        {resultPhase && (
          <p style={text}>
            {t('toll', { date: formatDate(resultPhase, tag) })}
          </p>
        )}
        {argala.map(row => (
          <Row key={row.house} title={row.occupants.length
            ? t('houseOccupants', { house: row.house, sign: rashiLabel(row.sign), planets: names(row.occupants, hi) })
            : t('houseRow', { house: row.house, sign: rashiLabel(row.sign) })}>
            <p style={text}>{row.summary}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', margin: '0.3rem 0' }}>
              {row.sources.filter(s => s.status !== 'none').map(s => (
                <span
                  key={s.id}
                  title={s.note}
                  style={{ fontSize: '0.64rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 6, border: `1px solid ${STATUS_COLOR[s.status]}`, color: STATUS_COLOR[s.status] }}
                >
                  {t('sourceChip', { id: s.id, planets: names(s.occupants, hi), status: tStatus(s.status) })}
                </span>
              ))}
              {row.selfDriven && (
                <span style={{ fontSize: '0.64rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 6, border: '1px solid var(--teal)', color: 'var(--teal)' }}>
                  {tArgala('selfDriven')}
                </span>
              )}
            </div>
            {row.sources.some(s => s.status !== 'none') && <p style={muted}>{row.meaning}</p>}
          </Row>
        ))}
      </Card>
      )}

      {section === 'gateway' && (
      <Card title={t('gatewayTitle')}>
        {gateway ? (
          <>
            <p style={text}>{gateway.entry}</p>
            <p style={{ ...text, color: BAND_COLOR[gateway.band] }}>{gateway.exit}</p>
            {gateway.useFor && <p style={muted}>{gateway.useFor}</p>}
          </>
        ) : (
          <p style={muted}>{tRead('noSign')}</p>
        )}
      </Card>
      )}

      {section === 'lagnas' && (
      <Card title={t('lagnasTitle')}>
        {special.rows.map(row => (
          <Row key={row.id} title={`${row.name} · ${rashiLabel(row.sign)}`} accent={BAND_COLOR[row.band]}>
            <p style={text}>{row.reading}</p>
            <p style={muted}>{row.timing}</p>
          </Row>
        ))}
        {special.comparison && <p style={text}>{special.comparison}</p>}
      </Card>
      )}

      {section === 'trinity' && (
      <Card title={t('trinityTitle')}>
        {trinity.map(row => (
          <Row key={row.id} title={`${row.title}${row.active ? ` · ${tIntel('activeNow')}` : ''}`} accent={row.active ? 'var(--gold)' : undefined}>
            <p style={text}>{row.theme}</p>
            <p style={muted}>{row.timing}</p>
          </Row>
        ))}
      </Card>
      )}

      {section === 'arudha' && (
      <Card title={t('arudhaTitle')}>
        {arudhaInsights.map(row => (
          <Row key={row.id} title={row.title}>
            <p style={text}>{row.text}</p>
          </Row>
        ))}
      </Card>
      )}

      {section === 'houses' && (
      <Card title={t('housesTitle')}>
        {triads.map(row => (
          <Row key={row.house} title={t('houseRow', { house: row.house, sign: rashiLabel(row.sign) })}>
            <p style={text}>{row.reading}</p>
          </Row>
        ))}
      </Card>
      )}

      {section === 'nakshatra' && nakshatra && (
        <Card title={t('nakshatraTitle')}>
          <p style={text}>
            {t('nakshatraLead', {
              planet: grahaLabel(nakshatra.planet),
              nakshatra: hi ? termHi(nakshatra.nakshatra) : nakshatra.nakshatra,
              pada: nakshatra.pada,
              lord: grahaLabel(nakshatra.lord),
              nature: nakshatra.nature,
            })}
          </p>
          {nakshatra.story && <p style={text}>{t('pastLife', { story: nakshatra.story })}</p>}
          {nakshatra.cause && <p style={text}>{nakshatra.cause}</p>}
          {method === 'practical' && !nakshatra.detailed && (
            <p style={muted}>{t('generalNature')}</p>
          )}
        </Card>
      )}

      {section === 'transits' && (
      <Card title={t('transitTitle')}>
        {transitFailed && <p style={muted}>{t('transitFailed')}</p>}
        {!transitFailed && !trigger && <p style={muted}>{t('transitLoading')}</p>}
        {trigger?.rows.map(row => (
          <Row key={row.target} title={`${row.target} · ${rashiLabel(row.sign)}`}>
            <p style={row.hits.length ? text : muted}>{row.hits.length ? `${row.hits.join('. ')}.` : t('noSlow')}</p>
          </Row>
        ))}
        {trigger?.confirmation && (
          <Row title={t('eventCheck', { count: trigger.confirmation.count })} accent="var(--gold)">
            <p style={text}>{trigger.confirmation.text}</p>
            <p style={muted}>
              {t('factors', {
                karaka: trigger.confirmation.karaka ? t('yes') : t('no'),
                argala: trigger.confirmation.argala ? t('yes') : t('no'),
                transit: trigger.confirmation.transit ? t('yes') : t('no'),
              })}
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
  const t = useTranslations('jaimini.board')
  const tEvents = useTranslations('jaimini.events')
  const tAreas = useTranslations('jaimini.areas')
  const { tag, lang } = useLang()
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
    lang,
  }), [chart.grahas, chart.lagnas.ascRashi, karakas.roleOf, method, lang])

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
        return `<td>${p ? `<b>${escapeHtml(p.label)}</b><br/>${escapeHtml(p.detail)}<br/><small>${escapeHtml(formatDate(p.start, tag))} ${escapeHtml(t('to'))} ${escapeHtml(formatDate(p.end, tag))}</small>` : ''}</td>`
      }).join('')}</tr>`).join('')
    const agree = board.agreements.map(a => `<li>${escapeHtml(tAreas(a.area))}: ${escapeHtml(a.systems.join(', '))}</li>`).join('')
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(t('printTitle'))}</title>
      <style>body{font:13px system-ui;margin:24px;color:#111}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:6px;text-align:left;vertical-align:top}small{color:#555}</style>
      </head><body><h2>${escapeHtml(t('printHeading', { date: dateText }))}</h2>
      <table><thead><tr><th>${escapeHtml(t('system'))}</th><th>${escapeHtml(t('maha'))}</th><th>${escapeHtml(t('antar'))}</th><th>${escapeHtml(t('pratyantar'))}</th></tr></thead><tbody>${rows}</tbody></table>
      ${agree ? `<h3>${escapeHtml(t('agreeHeading'))}</h3><ul>${agree}</ul>` : ''}</body></html>`)
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
      <Card title={t('title')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700 }}>
            {t('date')}{' '}
            <input type="date" value={dateText} onChange={e => setDateText(e.target.value)} style={fieldStyle} />
          </label>
          <button type="button" onClick={print} style={buttonStyle}>{t('print')}</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead>
              <tr>
                {([
                  ['system', t('system')],
                  ['maha', t('maha')],
                  ['antar', t('antar')],
                  ['pratyantar', t('pratyantar')],
                ] as const).map(([key, label]) => (
                  <th key={key} style={{ textAlign: 'left', padding: '0.35rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}>{label}</th>
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
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>{formatDate(p.start, tag)} {t('to')} {formatDate(p.end, tag)}</div>
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

      <Card title={t('agreeTitle')}>
        <p style={muted}>
          {method === 'practical' ? t('agreePractical') : t('agreeClassical')}
        </p>
        {board.agreements.length === 0 && <p style={muted}>{t('noShare')}</p>}
        {board.agreements.map(a => (
          <Row key={a.area} title={t('systemsCount', { area: tAreas(a.area), count: a.systems.length })} accent={a.strong ? 'var(--gold)' : undefined}>
            <p style={text}>{a.systems.join(', ')}</p>
          </Row>
        ))}
      </Card>

      <Card title={t('checkTitle')}>
        <p style={muted}>{t('checkBody')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <select aria-label={t('eventType')} value={newType} onChange={e => setNewType(e.target.value as LifeEventType)} style={fieldStyle}>
            {LIFE_EVENT_TYPES.map(event => <option key={event.id} value={event.id}>{tEvents(event.id)}</option>)}
          </select>
          <input aria-label={t('eventDate')} type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={fieldStyle} />
          <button type="button" onClick={addEvent} disabled={!newDate} style={{ ...buttonStyle, opacity: newDate ? 1 : 0.5 }}>{t('add')}</button>
        </div>

        {ranking.length > 0 && (
          <Row title={t('best')} accent="var(--gold)">
            {ranking.map(r => (
              <p key={r.id} style={text}>{t('scoreLine', { name: r.name, average: r.average, events: r.events, unit: r.events === 1 ? t('event') : t('events') })}</p>
            ))}
            <p style={muted}>{t('signal')}</p>
          </Row>
        )}

        {matches.map(match => (
          <Row key={match.event.id} title={t('eventRow', { name: tEvents(match.event.type), date: match.event.date })}>
            {match.systems.map(s => (
              <details key={s.id} style={{ fontSize: '0.72rem' }}>
                <summary style={{ cursor: 'pointer' }}>{t('matchSummary', { name: s.name, score: s.score, periods: s.periods })}</summary>
                {s.reasons.map(reason => <p key={reason} style={muted}>{reason}</p>)}
              </details>
            ))}
            <p style={muted}>{t('baseline', { baseline: match.baseline })}</p>
            <button
              type="button"
              onClick={() => updateEvents(events.filter(e => e.id !== match.event.id))}
              style={{ ...buttonStyle, marginTop: '0.3rem', color: 'var(--text-muted)' }}
            >
              {t('remove')}
            </button>
          </Row>
        ))}
      </Card>
    </>
  )
}
