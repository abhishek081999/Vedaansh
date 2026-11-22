'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/panchang/FestivalCalendarExport.tsx
//  "Add festivals to my calendar": a year of festivals, vrats,
//  sankrantis and eclipses for the chosen place as an .ics file,
//  with the visitor's tithi birthday when a chart is loaded. Free.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { getLunarMonth } from '@/lib/engine/panchangVishesh'
import { downloadIcs } from '@/lib/engine/muhurtaIcs'
import type { LocationValue } from '@/components/ui/LocationPicker'

const KINDS = ['festival', 'vrat', 'sankranti', 'eclipse'] as const
type Kind = (typeof KINDS)[number]

interface Props {
  location: LocationValue
  chart: ChartOutput | null
  /** The year on screen; the picker also offers the next one. */
  year: number
}

/** Birth tithi and amanta masa from the natal Sun and Moon. */
function birthTithi(chart: ChartOutput): { tithi: number; masa: string } | null {
  const sun = chart.grahas.find((g) => g.id === 'Su')
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const tithi = chart.panchang?.tithi?.number
  if (!sun || !moon || !tithi) return null
  return { tithi, masa: getLunarMonth(sun.lonSidereal, moon.lonSidereal).amanta }
}

export function FestivalCalendarExport({ location, chart, year }: Props) {
  const t = useTranslations('panchang.calendar.export')
  const { lang } = useLang()
  const [pickYear, setPickYear] = useState(year)
  const [kinds, setKinds] = useState<Set<Kind>>(() => new Set(KINDS))
  const [withBirthday, setWithBirthday] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const birth = useMemo(() => (chart ? birthTithi(chart) : null), [chart])

  const years = [year, year + 1]

  const toggle = (k: Kind) =>
    setKinds((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  const download = async () => {
    if (kinds.size === 0 && !(birth && withBirthday)) return
    setBusy(true)
    setMessage(null)
    try {
      const qs = new URLSearchParams({
        year: String(pickYear),
        lat: String(location.lat),
        lng: String(location.lng),
        tz: location.tz,
        place: location.name.slice(0, 80),
        lang,
        format: 'ics',
      })
      qs.set('kinds', [...kinds].join(','))
      if (birth && withBirthday) {
        qs.set('birthTithi', String(birth.tithi))
        qs.set('birthMasa', birth.masa)
      }
      const res = await fetch(`/api/panchang/festivals?${qs}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || t('failed'))
      }
      downloadIcs(`vedaansh-festivals-${pickYear}.ics`, await res.text())
      setMessage({ ok: true, text: t('done') })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : t('failed') })
    } finally {
      setBusy(false)
    }
  }

  const nothing = kinds.size === 0 && !(birth && withBirthday)

  return (
    <section
      aria-labelledby="festival-export-title"
      style={{
        marginTop: '1.25rem',
        padding: '1rem 1.1rem',
        border: '1px solid var(--border-soft)',
        borderRadius: 12,
        background: 'var(--surface-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div>
        <h2
          id="festival-export-title"
          style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <CalendarPlus size={18} aria-hidden /> {t('title')}
        </h2>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('body', { place: location.name })}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'center' }}>
        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {t('year')}
          <select
            value={pickYear}
            onChange={(e) => setPickYear(Number(e.target.value))}
            style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.25rem 0.4rem' }}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        {KINDS.map((k) => (
          <label key={k} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={kinds.has(k)} onChange={() => toggle(k)} />
            {t(`kinds.${k}`)}
          </label>
        ))}
        {birth && (
          <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={withBirthday} onChange={(e) => setWithBirthday(e.target.checked)} />
            {t('birthday', { name: chart?.meta.name || t('you') })}
          </label>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
        <button type="button" className="btn btn-primary" onClick={() => void download()} disabled={busy || nothing} style={{ fontSize: '0.8rem' }}>
          {busy ? t('building') : t('download')}
        </button>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('hint')}</span>
      </div>
      {message && (
        <p role="status" style={{ margin: 0, fontSize: '0.75rem', color: message.ok ? 'var(--teal)' : 'var(--rose)' }}>
          {message.text}
        </p>
      )}
    </section>
  )
}
