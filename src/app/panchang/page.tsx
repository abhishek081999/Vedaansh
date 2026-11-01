'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, UserRound } from 'lucide-react'
import { useChart } from '@/components/providers/ChartProvider'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'
import { DailyPanchangView, type PanchangApiData } from '@/components/panchang/DailyPanchangView'
import { LivePanchangTicker } from '@/components/panchang/LivePanchangTicker'
import { NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'
import pageStyles from './PanchangPage.module.css'

function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function PanchangPage() {
  const { chart } = useChart()
  const [date, setDate] = useState(todayIST)
  const [data, setData] = useState<PanchangApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  /** '' = do not send — no personal Tara/Chandra bala */
  const [birthNakSel, setBirthNakSel] = useState<string>('')
  /** '' = auto-estimate natal Moon rashi from nakshatra middle */
  const [birthMoonSel, setBirthMoonSel] = useState<string>('')
  const [personalOpen, setPersonalOpen] = useState(false)
  /** Ignores responses from superseded requests when stepping quickly through dates */
  const latestRequest = useRef(0)

  const fetchPanchang = useCallback(async (d: string) => {
    const requestId = ++latestRequest.current
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({
        date: d,
        lat: String(location.lat),
        lng: String(location.lng),
        tz: location.tz,
      })
      if (birthNakSel !== '') qs.set('birthNak', birthNakSel)
      if (birthMoonSel !== '') qs.set('birthMoonRashi', birthMoonSel)
      const res = await fetch(`/api/panchang?${qs.toString()}`)
      const json = await res.json()
      if (requestId !== latestRequest.current) return
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
    } catch (e: unknown) {
      if (requestId !== latestRequest.current) return
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      if (requestId === latestRequest.current) setLoading(false)
    }
  }, [location, birthNakSel, birthMoonSel])

  // Deep links from the monthly calendar: /panchang?date=YYYY-MM-DD
  useEffect(() => {
    const linked = new URLSearchParams(window.location.search).get('date')
    if (linked && /^\d{4}-\d{2}-\d{2}$/.test(linked)) setDate(linked)
  }, [])

  useEffect(() => { fetchPanchang(date) }, [date, fetchPanchang])

  const isToday = date === todayIST()

  return (
    <>
      <LivePanchangTicker data={data} loading={loading} locationName={location.name} />
      <main className={pageStyles.main}>
      <div className={pageStyles.toolbar}>
        <div className={pageStyles.topRow}>
          <div className={pageStyles.datePickerGroup}>
            <button
              type="button"
              onClick={() => setDate((d: string) => addDays(d, -1))}
              className={pageStyles.navButton}
              aria-label="Previous day"
              title="Previous day"
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <input
              id="panchang-date"
              type="date"
              aria-label="Panchang date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={pageStyles.dateInput}
            />
            <button
              type="button"
              onClick={() => setDate((d: string) => addDays(d, 1))}
              className={pageStyles.navButton}
              aria-label="Next day"
              title="Next day"
            >
              <ChevronRight size={18} aria-hidden />
            </button>
            {!isToday && (
              <button
                type="button"
                onClick={() => setDate(todayIST())}
                className={pageStyles.todayButton}
              >
                Today
              </button>
            )}
          </div>

          <div className={pageStyles.locationGroup}>
            <LocationPicker
              value={location}
              onChange={setLocation}
              label=""
              birthLocation={chart ? { lat: chart.meta.latitude, lng: chart.meta.longitude, tz: chart.meta.timezone, name: chart.meta.birthPlace } : null}
            />
          </div>

          <button
            type="button"
            onClick={() => setPersonalOpen(v => !v)}
            aria-expanded={personalOpen}
            className={`${pageStyles.personalToggle} ${birthNakSel !== '' ? pageStyles.personalToggleSet : ''}`}
          >
            <UserRound size={15} aria-hidden />
            {birthNakSel !== '' ? NAKSHATRA_NAMES[Number(birthNakSel)] : 'Personalise'}
          </button>
        </div>

        {personalOpen && (
          <div className={pageStyles.bottomRow}>
            <span className={pageStyles.birthMoonLabel}>
              Add your birth Moon to see Tara Bala and Chandra Bala
            </span>
            <div className={pageStyles.birthMoonControls}>
              <select
                aria-label="Birth nakshatra"
                value={birthNakSel}
                onChange={e => setBirthNakSel(e.target.value)}
                className={pageStyles.select}
              >
                <option value="">Birth nakshatra</option>
                {NAKSHATRA_NAMES.map((name, i) => (
                  <option key={name} value={i}>{name}</option>
                ))}
              </select>
              <select
                aria-label="Birth Moon rashi"
                value={birthMoonSel}
                onChange={e => setBirthMoonSel(e.target.value)}
                disabled={birthNakSel === ''}
                className={pageStyles.select}
              >
                <option value="">Auto rashi</option>
                {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as Rashi[]).map((r) => (
                  <option key={r} value={r}>{RASHI_NAMES[r]}</option>
                ))}
              </select>
              {chart && (
                <button
                  type="button"
                  onClick={() => {
                    const moon = chart.grahas.find(g => g.id === 'Mo')
                    if (moon) {
                      setBirthNakSel(String(moon.nakshatraIndex))
                      setBirthMoonSel(String(moon.rashi))
                    }
                  }}
                  className={pageStyles.natalButton}
                >
                  Use natal Moon
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className={pageStyles.errorMessage} role="alert">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className={pageStyles.loadingContainer}>
          <div className="spin-loader" />
          <div className={pageStyles.loadingText}>
            Calculating the celestial movements…
          </div>
        </div>
      )}

      {data && (
        <div className={loading ? pageStyles.refreshing : undefined} aria-busy={loading}>
          <DailyPanchangView data={data} locationName={location.name} />
        </div>
      )}
    </main>
    </>
  )
}
