'use client'
// ─────────────────────────────────────────────────────────────
//  Live compass — point the phone at a wall and see which Vastu
//  zone it faces and how strong that zone is in your chart.
//  Uses DeviceOrientation; falls back to a manual slider.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { headingFromOrientation, smoothHeading, zoneForBearing } from '@/lib/engine/astroVastu'

export interface LiveZone {
  id: string
  angle: number
  score: number
  quality: string
}

type Status = 'idle' | 'starting' | 'active' | 'denied' | 'unsupported'

interface OrientationEventIOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number
}
interface OrientationCtorIOS {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

const scoreColor = (s: number) => (s > 70 ? '#4ecdc4' : s < 40 ? '#e07b8e' : '#c9a84c')

interface Props {
  zones: LiveZone[]
  sectorAngle: number
  dirName: (code: string) => string
}

export function LiveCompass({ zones, sectorAngle, dirName }: Props) {
  const t = useTranslations('vastu.live')
  const [status, setStatus] = useState<Status>('idle')
  const [heading, setHeading] = useState<number | null>(null)
  const [manual, setManual] = useState(0)
  const headingRef = useRef<number | null>(null)
  const frame = useRef<number | null>(null)
  const timeout = useRef<number | null>(null)

  const onOrientation = useCallback((e: Event) => {
    const ev = e as OrientationEventIOS
    const h = headingFromOrientation({
      alpha: ev.alpha,
      absolute: ev.absolute || e.type === 'deviceorientationabsolute',
      webkitCompassHeading: ev.webkitCompassHeading,
      screenAngle: typeof screen !== 'undefined' ? screen.orientation?.angle ?? 0 : 0,
    })
    if (h === null) return
    headingRef.current = smoothHeading(headingRef.current, h)
    if (frame.current === null) {
      frame.current = requestAnimationFrame(() => {
        frame.current = null
        setHeading(headingRef.current)
        setStatus('active')
      })
    }
  }, [])

  const stop = useCallback(() => {
    window.removeEventListener('deviceorientationabsolute', onOrientation)
    window.removeEventListener('deviceorientation', onOrientation)
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    if (timeout.current !== null) clearTimeout(timeout.current)
    frame.current = null
    timeout.current = null
  }, [onOrientation])

  useEffect(() => stop, [stop])

  const start = async () => {
    if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
      setStatus('unsupported')
      return
    }
    setStatus('starting')
    const ctor = DeviceOrientationEvent as unknown as OrientationCtorIOS
    if (typeof ctor.requestPermission === 'function') {
      try {
        if ((await ctor.requestPermission()) !== 'granted') { setStatus('denied'); return }
      } catch {
        setStatus('denied')
        return
      }
    }
    window.addEventListener('deviceorientationabsolute', onOrientation)
    window.addEventListener('deviceorientation', onOrientation)
    // No absolute reading within 3 s → this device has no usable compass
    timeout.current = window.setTimeout(() => {
      if (headingRef.current === null) { stop(); setStatus('unsupported') }
    }, 3000)
  }

  const live = status === 'active' && heading !== null
  const h = live ? heading : manual
  const zone = zones.length ? zoneForBearing(h, zones) : null

  return (
    <section className="card" aria-labelledby="vastu-live-compass" style={{ padding: '1.5rem', border: '1px solid var(--border-bright)' }}>
      <h3 id="vastu-live-compass" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '1.05rem', fontWeight: 600 }}>📱 {t('title')}</h3>
      <p style={{ margin: '0.3rem 0 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('subtitle')}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        {/* Dial: the zone the phone faces is always at the top */}
        <div style={{ position: 'relative', flex: '0 0 auto', width: 'min(240px, 70vw)', aspectRatio: '1', margin: '0 auto' }}>
          <svg viewBox="0 0 200 200" role="img" aria-label={zone ? t('facingAria', { zone: dirName(zone.id) }) : t('title')} style={{ width: '100%', height: '100%' }}>
            <g style={{ transform: `rotate(${-h}deg)`, transformOrigin: '100px 100px', transition: live ? 'none' : 'transform 0.2s ease-out' }}>
              {zones.map(z => {
                const a0 = (z.angle - sectorAngle / 2 - 90) * Math.PI / 180
                const a1 = (z.angle + sectorAngle / 2 - 90) * Math.PI / 180
                const on = zone?.id === z.id
                return (
                  <path key={z.id}
                    d={`M100 100 L${100 + 90 * Math.cos(a0)} ${100 + 90 * Math.sin(a0)} A90 90 0 0 1 ${100 + 90 * Math.cos(a1)} ${100 + 90 * Math.sin(a1)}Z`}
                    fill={scoreColor(z.score)} fillOpacity={on ? 0.55 : 0.16} stroke="var(--border)" strokeWidth={0.5} />
                )
              })}
              {zones.map(z => {
                const a = (z.angle - 90) * Math.PI / 180
                const x = 100 + 72 * Math.cos(a), y = 100 + 72 * Math.sin(a)
                return (
                  <text key={'l' + z.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                    fontSize={sectorAngle < 30 ? 7 : 10} fontWeight={z.id === 'N' ? 800 : 600}
                    fill={z.id === 'N' ? 'var(--rose)' : 'var(--text-secondary)'}
                    transform={`rotate(${z.angle} ${x} ${y})`}>
                    {z.id}
                  </text>
                )
              })}
            </g>
            {/* Fixed pointer: the direction the phone's top edge points */}
            <path d="M100 4 L108 20 L92 20 Z" fill="var(--gold)" />
            <circle cx="100" cy="100" r="26" fill="var(--surface-1)" stroke="var(--gold)" strokeWidth="1.2" />
            <text x="100" y="98" textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--text-gold)">{Math.round(h)}°</text>
            <text x="100" y="112" textAnchor="middle" fontSize="7" fill="var(--text-muted)">{zone?.id ?? ''}</text>
          </svg>
        </div>

        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          {zone && (
            <div aria-live="polite" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{t('facing')}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{dirName(zone.id)}</span>
                <span style={{ fontWeight: 700, color: scoreColor(zone.score) }}>{zone.score}%</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{zone.quality}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                {zone.score > 70 ? t('tip.strong') : zone.score < 40 ? t('tip.weak') : t('tip.mid')}
              </div>
            </div>
          )}

          {live ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600 }}>● {t('liveOn')}</span>
              <button type="button" onClick={() => { stop(); headingRef.current = null; setHeading(null); setStatus('idle') }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('stop')}
              </button>
            </div>
          ) : (
            <>
              <button type="button" onClick={start} disabled={status === 'starting'} className="btn btn-primary"
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
                {status === 'starting' ? t('starting') : t('start')}
              </button>
              {(status === 'denied' || status === 'unsupported') && (
                <p role="status" style={{ margin: '0.6rem 0 0', fontSize: '0.75rem', color: 'var(--rose)', lineHeight: 1.5 }}>{t(status)}</p>
              )}
              <label style={{ display: 'block', marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {t('manual')}
                <input type="range" min={0} max={359} value={manual} onChange={e => setManual(Number(e.target.value))}
                  style={{ display: 'block', width: '100%', marginTop: 6, accentColor: 'var(--gold)' }} />
              </label>
            </>
          )}
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t('note')}</p>
        </div>
      </div>
    </section>
  )
}
