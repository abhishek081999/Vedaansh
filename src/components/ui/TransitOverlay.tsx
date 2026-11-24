// ─────────────────────────────────────────────────────────────
//  src/components/ui/TransitOverlay.tsx
//  Transit chart overlay — fetches current planet positions
//  and passes them to the chart for dual rendering
// ─────────────────────────────────────────────────────────────
'use client'

import { useState, useEffect, useCallback } from 'react'
import { interactiveTransition } from '@/lib/ui/transitions'
import type { GrahaData, ChartOutput } from '@/types/astrology'
import { useTranslations } from 'next-intl'
import { zonedDateTime, zonedToday } from '@/lib/chart/zonedNow'

interface TransitOverlayProps {
  natalChart:    ChartOutput
  onTransitLoad: (grahas: GrahaData[] | null) => void
}

const GRAHA_SYMBOL: Record<string, string> = {
  Su:'☀', Mo:'☽', Ma:'♂', Me:'☿', Ju:'♃', Ve:'♀', Sa:'♄', Ra:'☊', Ke:'☋'
}
const GRAHA_NAME: Record<string, string> = {
  Su:'Sun', Mo:'Moon', Ma:'Mars', Me:'Mercury',
  Ju:'Jupiter', Ve:'Venus', Sa:'Saturn', Ra:'Rahu', Ke:'Ketu'
}

export function TransitOverlay({ natalChart, onTransitLoad }: TransitOverlayProps) {
  const t = useTranslations('chart.transitOverlay')
  const [enabled,  setEnabled]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [transit,  setTransit]  = useState<ChartOutput | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const tz = natalChart.meta.timezone
  const [date,     setDate]     = useState(() => zonedToday(tz))

  const fetchTransit = useCallback(async (d: string) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/chart/calculate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       'Transit',
          birthDate:  d,
          birthTime:  zonedDateTime(tz).time,
          birthPlace: natalChart.meta.birthPlace,
          latitude:   natalChart.meta.latitude,
          longitude:  natalChart.meta.longitude,
          timezone:   natalChart.meta.timezone,
          settings:   natalChart.meta.settings,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setTransit(json.data)
      onTransitLoad(json.data.grahas)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('failed'))
      onTransitLoad(null)
    } finally {
      setLoading(false)
    }
  }, [natalChart, onTransitLoad, t, tz])

  // Auto-fetch when enabled
  useEffect(() => {
    if (enabled) fetchTransit(date)
    else { setTransit(null); onTransitLoad(null) }
  }, [enabled, date]) // eslint-disable-line react-hooks/exhaustive-deps

  // Unmounting (e.g. switching to a full-width tab) must not leave a
  // transit overlay on other charts with no switch to turn it off.
  useEffect(() => () => onTransitLoad(null), [onTransitLoad])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem 0.75rem', flexWrap: 'wrap',
      minHeight: 36,
      background: enabled ? 'rgba(139,124,246,0.07)' : 'transparent',
      border: `1px solid ${enabled ? 'rgba(139,124,246,0.32)' : 'var(--border-soft)'}`,
      borderRadius: 'var(--r-sm)',
      padding: '0.3rem 0.6rem',
      transition: interactiveTransition('0.2s'),
    }}>
      {/* Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled(e => !e)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem 0',
          flexShrink: 0,
        }}
      >
        <span aria-hidden style={{
          width: 30, height: 17, borderRadius: 99, position: 'relative', flexShrink: 0,
          background: enabled ? 'var(--accent)' : 'var(--surface-4)',
          transition: 'background 0.2s',
        }}>
          <span style={{
            position: 'absolute', top: 2.5, left: enabled ? 15.5 : 2.5,
            width: 12, height: 12, borderRadius: '50%', background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }} />
        </span>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: '0.76rem',
          fontWeight: 600, color: enabled ? 'var(--accent)' : 'var(--text-secondary)',
        }}>
          {t('toggle')}
        </span>
      </button>

      {/* Date picker */}
      {enabled && (
        <input
          type="date"
          value={date}
          max={zonedToday(tz)}
          onChange={e => setDate(e.target.value)}
          aria-label={t('toggle')}
          style={{
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)', padding: '0.12rem 0.4rem',
            fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
            color: 'var(--text-primary)', cursor: 'pointer',
          }}
        />
      )}

      {loading && (
        <span className="spin-loader" style={{
          width: 14, height: 14,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
        }} />
      )}

      {error && (
        <span style={{ fontSize: '0.72rem', color: 'var(--rose)', fontFamily: 'var(--font-body)' }}>
          {error}
        </span>
      )}

      {/* Transit positions — same row, wraps on narrow screens */}
      {enabled && transit && !loading && (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', minWidth: 0 }}>
          {transit.grahas.map(g => (
            <span key={g.id} title={GRAHA_NAME[g.id]} style={{
              padding: '0.08rem 0.4rem', borderRadius: 99, fontSize: '0.68rem',
              background: 'rgba(139,124,246,0.12)', border: '1px solid rgba(139,124,246,0.25)',
              fontFamily: 'var(--font-mono)', color: 'var(--accent)', whiteSpace: 'nowrap',
            }}>
              {/* House counted from the natal Lagna (whole sign), not the transit sign number. */}
              {GRAHA_SYMBOL[g.id]} {g.rashi ? `H${((g.rashi - natalChart.lagnas.ascRashi + 12) % 12) + 1}` : g.id}
              {g.isRetro ? <span style={{ color: 'var(--rose)', marginLeft: 2 }}>℞</span> : ''}
            </span>
          ))}
        </div>
      )}

      {/* Legend */}
      {enabled && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', fontSize: '0.66rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-primary)' }}>{t('natal')}</span>
          <span style={{ color: 'var(--accent)' }}>{t('transit')}</span>
        </div>
      )}
    </div>
  )
}