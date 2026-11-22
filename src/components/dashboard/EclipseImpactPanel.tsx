'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/EclipseImpactPanel.tsx
//  Upcoming eclipses read against the natal chart: house from Lagna
//  and Moon, natal points touched, janma nakshatra / rashi, local
//  visibility and sutak. Free. Eclipse list from /api/transit/eclipses;
//  the natal reading runs here (pure eclipseImpact engine).
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import { RASHI_HI } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { eclipseImpact, type EclipseForImpact, type EclipseImpactLevel } from '@/lib/engine/eclipseImpact'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'

interface EclipseRow extends EclipseForImpact {
  start: string
  end: string
  nakshatra: string
  local: { visible: boolean; start?: string; max?: string; end?: string; sutakStart?: string }
}

const LEVEL_STYLE: Record<EclipseImpactLevel, { color: string; bg: string }> = {
  high: { color: 'var(--rose)', bg: 'rgba(244,114,128,0.12)' },
  moderate: { color: 'var(--amber)', bg: 'rgba(245,158,66,0.12)' },
  low: { color: 'var(--teal)', bg: 'rgba(45,212,191,0.1)' },
}

export function EclipseImpactPanel({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('transit.eclipses')
  const { lang, hi } = useLang()
  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  const [rows, setRows] = useState<EclipseRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setRows(null)
    setError(null)
    const qs = new URLSearchParams({ lat: String(location.lat), lng: String(location.lng), years: '2' })
    fetch(`/api/transit/eclipses?${qs}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        if (!json.success) setError(json.error || t('loadFailed'))
        else setRows(json.data.eclipses as EclipseRow[])
      })
      .catch(() => { if (!cancelled) setError(t('loadFailed')) })
    return () => { cancelled = true }
  }, [location.lat, location.lng, t])

  const readings = useMemo(
    () => (rows ?? []).map((e) => ({ e, impact: eclipseImpact(e, chart, lang) })),
    [rows, chart, lang],
  )

  const tag = hi ? 'hi-IN' : 'en-IN'
  const fmt = (iso: string, withTime = true) =>
    new Intl.DateTimeFormat(tag, {
      timeZone: location.tz,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(new Date(iso))
  const signName = (s: Rashi) => (hi ? RASHI_HI[s] : RASHI_NAMES[s])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75rem' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 560 }}>
          {t('intro')}
        </p>
        <LocationPicker
          value={location}
          onChange={setLocation}
          label={t('visibilityFor')}
          birthLocation={{ lat: chart.meta.latitude, lng: chart.meta.longitude, tz: chart.meta.timezone, name: chart.meta.birthPlace }}
        />
      </div>

      {error && <div style={{ color: 'var(--rose)', fontSize: '0.85rem' }}>{error}</div>}
      {!rows && !error && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('loading')}</div>}
      {rows && rows.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('none')}</div>}

      {readings.map(({ e, impact }) => {
        const lv = LEVEL_STYLE[impact.level]
        return (
          <article
            key={e.max}
            style={{ border: '1px solid var(--border-soft)', borderRadius: 10, padding: '1rem 1.1rem', background: 'var(--surface-2)' }}
          >
            <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {t(`kind.${e.kind}`)} · {t(`type.${e.type}`)}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {fmt(e.local.max ?? e.max)} · {signName(e.sign)} {Math.floor(e.longitude % 30)}°
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 999, color: lv.color, background: lv.bg }}>
                {t(`level.${impact.level}`)}
              </span>
            </header>

            <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {impact.lines.map((line) => <li key={line}>{line}</li>)}
            </ul>

            {e.local.visible && e.local.start && e.local.end && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {t('localTimes', { start: fmt(e.local.start), end: fmt(e.local.end) })}
                {e.local.sutakStart ? ` · ${t('sutakFrom', { time: fmt(e.local.sutakStart) })}` : ''}
              </div>
            )}
          </article>
        )
      })}

      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('note')}</p>
    </div>
  )
}
