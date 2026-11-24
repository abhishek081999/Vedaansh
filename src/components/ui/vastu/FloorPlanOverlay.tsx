'use client'
// ─────────────────────────────────────────────────────────────
//  Floor-plan overlay. The user loads a plan image, sets where
//  North points and where the centre (Brahmasthan) is, and the
//  Vastu zones are drawn on top, coloured by their chart score.
//  Tapping the plan shows that spot's zone and lets the user mark
//  a room there (feeds the My Home room mapper).
//  The image stays in this browser: it is scaled down and kept in
//  localStorage when it fits, never uploaded.
// ─────────────────────────────────────────────────────────────
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  planBearing, planHomeZone, planScreenAngle, roomsForZone, zoneForBearing, ROOM_IDS,
  type HomeZone, type RoomId,
} from '@/lib/engine/astroVastu'

export interface PlanZone { id: string; angle: number; score: number; quality: string }

interface Plan { src: string; w: number; h: number }
interface Saved { plan: Plan; north: number; cx: number; cy: number }

const STORAGE_KEY = 'vedaansh.vastu.plan'
const MAX_SIDE = 1400
const scoreColor = (s: number) => (s > 70 ? '#4ecdc4' : s < 40 ? '#e07b8e' : '#c9a84c')

/** Read an image file and scale it down to a JPEG data URL. */
function loadScaled(file: File): Promise<Plan> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('no canvas')); return }
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve({ src: c.toDataURL('image/jpeg', 0.82), w, h })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')) }
    img.src = url
  })
}

interface Props {
  zones: PlanZone[]
  sectorAngle: number
  dirName: (code: string) => string
  /** Adds a room at a home zone in the room mapper. */
  onMarkRoom: (room: RoomId, zone: HomeZone) => void
  /** Rooms already placed per zone, to show "already marked". */
  roomsAt: (zone: HomeZone) => RoomId[]
}

export function FloorPlanOverlay({ zones, sectorAngle, dirName, onMarkRoom, roomsAt }: Props) {
  const t = useTranslations('vastu')
  const fileId = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [north, setNorth] = useState(0)
  const [centre, setCentre] = useState<{ x: number; y: number } | null>(null)
  const [mode, setMode] = useState<'inspect' | 'centre'>('inspect')
  const [pick, setPick] = useState<{ x: number; y: number } | null>(null)
  const [room, setRoom] = useState<RoomId>('kitchen')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'unsaved'>('idle')

  // Restore once
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const v = JSON.parse(raw) as Saved
      if (v?.plan?.src?.startsWith('data:image/') && v.plan.w > 0 && v.plan.h > 0) {
        setPlan(v.plan)
        setNorth(Number(v.north) || 0)
        setCentre({ x: Number(v.cx) || v.plan.w / 2, y: Number(v.cy) || v.plan.h / 2 })
      }
    } catch { /* nothing saved */ }
  }, [])

  // Save when anything changes
  useEffect(() => {
    if (!plan || !centre) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ plan, north, cx: centre.x, cy: centre.y } satisfies Saved))
      setStatus(s => (s === 'unsaved' ? 'idle' : s))
    } catch {
      setStatus('unsaved') // image too large for browser storage; it still works this session
    }
  }, [plan, north, centre])

  const onFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    setStatus('loading')
    try {
      const p = await loadScaled(file)
      setPlan(p)
      setCentre({ x: p.w / 2, y: p.h / 2 })
      setNorth(0)
      setPick(null)
      setMode('inspect')
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  const remove = () => {
    setPlan(null)
    setCentre(null)
    setPick(null)
    try { window.localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

  const toPlan = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg || !plan) return null
    const r = svg.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * plan.w) / r.width, y: ((e.clientY - r.top) * plan.h) / r.height }
  }

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = toPlan(e)
    if (!p) return
    if (mode === 'centre') { setCentre(p); setMode('inspect'); setPick(null) } else setPick(p)
  }

  const c = centre ?? (plan ? { x: plan.w / 2, y: plan.h / 2 } : { x: 0, y: 0 })
  const minSide = plan ? Math.min(plan.w, plan.h) : 1
  const centreR = minSide * 0.1
  const R = plan ? Math.hypot(plan.w, plan.h) : 1
  const pt = (angle: number, r: number) => {
    const a = (angle * Math.PI) / 180
    return { x: c.x + r * Math.sin(a), y: c.y - r * Math.cos(a) }
  }

  // Picked spot
  const picked = pick && plan ? (() => {
    const dx = pick.x - c.x, dy = pick.y - c.y
    const home = planHomeZone(dx, dy, north, centreR)
    const fine = home === 'Center' ? null : zoneForBearing(planBearing(dx, dy, north), zones)
    return { home, fine, fit: roomsForZone(home), marked: roomsAt(home) }
  })() : null

  const chip = (on: boolean): React.CSSProperties => ({
    minHeight: 32, padding: '0.3rem 0.7rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${on ? 'var(--gold)' : 'var(--border-soft)'}`, background: on ? 'var(--gold)' : 'var(--surface-3)', color: on ? 'var(--text-on-gold)' : 'var(--text-secondary)',
  })
  const roomName = (r: RoomId) => t(`home.rooms.${r}`)

  return (
    <section className="card" aria-labelledby="vastu-plan-title" style={{ padding: '1.75rem', border: '1px solid var(--border-bright)' }}>
      <h3 id="vastu-plan-title" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '1.1rem', fontWeight: 600 }}>🗺️ {t('plan.title')}</h3>
      <p style={{ margin: '0.3rem 0 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 660, lineHeight: 1.5 }}>{t('plan.subtitle')}</p>

      {!plan ? (
        <div style={{ padding: '1.5rem', border: '1px dashed var(--border-bright)', borderRadius: 12, textAlign: 'center', background: 'var(--surface-2)' }}>
          <label htmlFor={fileId} className="btn btn-primary" style={{ display: 'inline-block', padding: '0.6rem 1.2rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            {status === 'loading' ? t('plan.loading') : t('plan.upload')}
          </label>
          <input id={fileId} type="file" accept="image/*" onChange={e => void onFile(e.target.files?.[0])} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>{t('plan.privacy')}</p>
          {status === 'error' && <p role="alert" style={{ margin: '0.5rem 0 0', fontSize: '0.76rem', color: 'var(--rose)' }}>{t('plan.error')}</p>}
        </div>
      ) : (
        <>
          {/* Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '0.9rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('plan.northIs')}</div>
              <div role="radiogroup" aria-label={t('plan.northIs')} style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {([0, 90, 180, 270] as const).map(a => (
                  <button key={a} type="button" role="radio" aria-checked={north === a} onClick={() => setNorth(a)} style={chip(north === a)}>
                    {t(`plan.north.${a}`)}
                  </button>
                ))}
              </div>
            </div>
            <label style={{ flex: '1 1 180px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {t('plan.fine', { deg: north })}
              <input type="range" min={0} max={359} value={north} onChange={e => setNorth(Number(e.target.value))}
                style={{ display: 'block', width: '100%', marginTop: 6, accentColor: 'var(--gold)' }} />
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button type="button" aria-pressed={mode === 'centre'} onClick={() => setMode(m => (m === 'centre' ? 'inspect' : 'centre'))} style={chip(mode === 'centre')}>
                {mode === 'centre' ? t('plan.centreActive') : t('plan.setCentre')}
              </button>
              <label htmlFor={fileId} style={{ ...chip(false), display: 'inline-flex', alignItems: 'center' }}>{t('plan.replace')}</label>
              <input id={fileId} type="file" accept="image/*" onChange={e => void onFile(e.target.files?.[0])} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
              <button type="button" onClick={remove} style={chip(false)}>{t('plan.remove')}</button>
            </div>
          </div>
          <p role="status" style={{ margin: '0 0 0.6rem', fontSize: '0.74rem', color: mode === 'centre' ? 'var(--text-gold)' : 'var(--text-muted)' }}>
            {mode === 'centre' ? t('plan.centreHint') : t('plan.tapHint')}
            {status === 'unsaved' && <span style={{ color: 'var(--rose)' }}> {t('plan.unsaved')}</span>}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-start' }}>
            {/* Plan + overlay */}
            <div style={{ position: 'relative', flex: '1 1 340px', maxWidth: 720, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', lineHeight: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, never served */}
              <img src={plan.src} alt={t('plan.alt')} style={{ width: '100%', height: 'auto', display: 'block' }} />
              <svg
                ref={svgRef}
                viewBox={`0 0 ${plan.w} ${plan.h}`}
                onPointerDown={onPointer}
                role="img"
                aria-label={t('plan.overlayLabel')}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: mode === 'centre' ? 'crosshair' : 'pointer', touchAction: 'manipulation' }}
              >
                {zones.map(z => {
                  const a0 = planScreenAngle(z.angle - sectorAngle / 2, north)
                  const p0 = pt(a0, R), p1 = pt(a0 + sectorAngle, R)
                  const fineOn = picked?.fine?.id === z.id
                  return (
                    <path key={z.id} d={`M${c.x} ${c.y} L${p0.x} ${p0.y} A${R} ${R} 0 0 1 ${p1.x} ${p1.y} Z`}
                      fill={scoreColor(z.score)} fillOpacity={fineOn ? 0.42 : 0.18} stroke="#5b4a1f" strokeOpacity={0.45} strokeWidth={minSide * 0.002} />
                  )
                })}
                {zones.map(z => {
                  const p = pt(planScreenAngle(z.angle, north), minSide * 0.36)
                  return (
                    <text key={'l' + z.id} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                      fontSize={minSide * (sectorAngle < 30 ? 0.03 : 0.045)} fontWeight={800}
                      fill={z.id === 'N' ? '#b42345' : '#3d3215'} stroke="#fff" strokeWidth={minSide * 0.006} paintOrder="stroke">
                      {z.id}
                    </text>
                  )
                })}
                <circle cx={c.x} cy={c.y} r={centreR} fill="#c9a84c" fillOpacity={0.22} stroke="#8a6d1d" strokeWidth={minSide * 0.003} />
                <circle cx={c.x} cy={c.y} r={minSide * 0.008} fill="#8a6d1d" />
                {pick && (
                  <g>
                    <circle cx={pick.x} cy={pick.y} r={minSide * 0.022} fill="#fff" stroke="#b42345" strokeWidth={minSide * 0.006} />
                    <circle cx={pick.x} cy={pick.y} r={minSide * 0.007} fill="#b42345" />
                  </g>
                )}
                {/* North arrow, top-right */}
                <g transform={`translate(${plan.w - minSide * 0.09} ${minSide * 0.09}) rotate(${north})`}>
                  <circle r={minSide * 0.06} fill="#fff" fillOpacity={0.9} stroke="#8a6d1d" strokeWidth={minSide * 0.003} />
                  <path d={`M0 ${-minSide * 0.045} L${minSide * 0.02} ${minSide * 0.015} L0 ${minSide * 0.003} L${-minSide * 0.02} ${minSide * 0.015} Z`} fill="#b42345" />
                  <text y={minSide * 0.045} textAnchor="middle" fontSize={minSide * 0.03} fontWeight={800} fill="#3d3215" transform={`rotate(${-north} 0 ${minSide * 0.035})`}>N</text>
                </g>
              </svg>
            </div>

            {/* Picked spot */}
            <div aria-live="polite" style={{ flex: '1 1 240px', minWidth: 0 }}>
              {!picked ? (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('plan.nothingPicked')}</p>
              ) : (
                <div style={{ padding: '1rem', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t('plan.thisSpot')}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                      {picked.fine ? dirName(picked.fine.id) : dirName('Center')}
                    </span>
                    {picked.fine && <span style={{ fontWeight: 700, color: scoreColor(picked.fine.score) }}>{picked.fine.score}%</span>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {picked.fine ? picked.fine.quality : t('plan.centreNote')}
                  </div>

                  {picked.fit.best.length > 0 && (
                    <p style={{ margin: '0.6rem 0 0', fontSize: '0.76rem', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--teal)' }}>{t('plan.goodFor')}</strong> {picked.fit.best.map(roomName).join(', ')}
                    </p>
                  )}
                  {picked.fit.avoid.length > 0 && (
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.76rem', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--rose)' }}>{t('plan.avoid')}</strong> {picked.fit.avoid.map(roomName).join(', ')}
                    </p>
                  )}
                  {picked.marked.length > 0 && (
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {t('plan.marked', { rooms: picked.marked.map(roomName).join(', '), zone: dirName(picked.home) })}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.8rem' }}>
                    <select value={room} onChange={e => setRoom(e.target.value as RoomId)} aria-label={t('plan.roomLabel')}
                      style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 7, padding: '0.35rem 0.5rem', fontSize: '0.76rem', fontFamily: 'inherit', maxWidth: '100%' }}>
                      {ROOM_IDS.map(r => <option key={r} value={r}>{roomName(r)}</option>)}
                    </select>
                    <button type="button" disabled={picked.marked.includes(room)} onClick={() => onMarkRoom(room, picked.home)}
                      style={{ ...chip(false), borderColor: 'var(--text-gold)', color: 'var(--text-gold)' }}>
                      {picked.marked.includes(room) ? t('plan.alreadyMarked') : t('plan.markHere', { zone: dirName(picked.home) })}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
