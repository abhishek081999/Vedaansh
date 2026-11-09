'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/YearCalendarExport.tsx
//  Gold — download a year of personal-day ratings with the
//  sunrise tithi as an .ics file (Google / Apple / Outlook)
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarPlus } from 'lucide-react'
import { downloadIcs } from '@/lib/engine/muhurtaIcs'
import { Button } from '@/components/ui/primitives/Button'
import { Label } from '@/components/ui/primitives/Label'
import { SectionCard } from './shared'

export interface CalendarLocation {
  lat: number
  lng: number
  tz: string
  label: string
}

/** Used when no chart is open — central India, IST. */
const DEFAULT_LOCATION = { lat: 23.1765, lng: 75.7885, tz: 'Asia/Kolkata' }

export function YearCalendarExport({ birthDate, name, entitled, location }: {
  birthDate: string
  name: string
  entitled: boolean
  location: CalendarLocation | null
}) {
  const t = useTranslations('numerology.calendar')
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const [include, setInclude] = useState<'highlights' | 'all'>('highlights')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const place = location ?? { ...DEFAULT_LOCATION, label: t('ujjain') }

  const download = async () => {
    setBusy(true)
    setError(null)
    try {
      const qs = new URLSearchParams({
        birthDate,
        year: String(year),
        lat: String(place.lat),
        lng: String(place.lng),
        tz: place.tz,
        include,
      })
      if (name) qs.set('name', name.slice(0, 80))
      const res = await fetch(`/api/numerology/calendar?${qs}`)
      if (!res.ok) {
        const json = await res.json().catch(() => null) as { error?: string } | null
        throw new Error(json?.error ?? t('fail'))
      }
      downloadIcs(`numerology-${year}.ics`, await res.text())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('fail'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard
      title={t('title')}
      subtitle={t('sub', { place: place.label })}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'end' }}>
        <div>
          <Label htmlFor="numerology-cal-year" caps>{t('year')}</Label>
          <select id="numerology-cal-year" className="input" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[thisYear - 1, thisYear, thisYear + 1, thisYear + 2].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="numerology-cal-include" caps>{t('days')}</Label>
          <select id="numerology-cal-include" className="input" value={include} onChange={e => setInclude(e.target.value as 'highlights' | 'all')}>
            <option value="highlights">{t('highlights')}</option>
            <option value="all">{t('all')}</option>
          </select>
        </div>
        <Button size="sm" onClick={() => { void download() }} disabled={!entitled || busy} title={entitled ? undefined : t('gold')}>
          <CalendarPlus size={14} aria-hidden style={{ marginRight: 4 }} />
          {busy ? t('building') : t('download')}
        </Button>
      </div>
      {!entitled && <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>{t('locked')}</p>}
      {!location && entitled && (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('placeHint')}</p>
      )}
      {error && <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--rose)' }}>{error}</p>}
    </SectionCard>
  )
}
