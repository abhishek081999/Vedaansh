'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  /** '' = do not send — no personal Tārā/Chandra bala */
  const [birthNakSel, setBirthNakSel] = useState<string>('')
  /** '' = auto-estimate natal Moon rāśi from nakṣatra middle */
  const [birthMoonSel, setBirthMoonSel] = useState<string>('')

  const fetchPanchang = useCallback(async (d: string) => {
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
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [location, birthNakSel, birthMoonSel])

  useEffect(() => { fetchPanchang(date) }, [date, fetchPanchang])

  const isToday = date === todayIST()

  return (
    <>
      <LivePanchangTicker data={data} loading={loading} locationName={location.name} />
      <main className={pageStyles.main}>
      <div className={pageStyles.selectorCard}>
        <div className={pageStyles.topRow}>
          <div className={pageStyles.datePickerGroup}>
             <input
                id="panchang-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={pageStyles.dateInput}
              />
              <div className={pageStyles.dateControls}>
                <button
                  type="button"
                  onClick={() => setDate((d: string) => addDays(d, -1))}
                  className={pageStyles.navButton}
                  title="Previous Day"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setDate((d: string) => addDays(d, 1))}
                  className={pageStyles.navButton}
                  title="Next Day"
                >
                  →
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
          </div>

          <div className={pageStyles.locationGroup}>
            <LocationPicker
              value={location}
              onChange={setLocation}
              label=""
              birthLocation={chart ? { lat: chart.meta.latitude, lng: chart.meta.longitude, tz: chart.meta.timezone, name: chart.meta.birthPlace } : null}
            />
          </div>
        </div>

        <div className={pageStyles.bottomRow}>
          <span className={pageStyles.birthMoonLabel}>
            Birth Moon for Tara/Chandra Bala:
          </span>
          <div className={pageStyles.birthMoonControls}>
            <select
              value={birthNakSel}
              onChange={e => setBirthNakSel(e.target.value)}
              className={pageStyles.select}
            >
              <option value="">— Birth nakṣatra (optional) —</option>
              {NAKSHATRA_NAMES.map((name, i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </select>
            <select
              value={birthMoonSel}
              onChange={e => setBirthMoonSel(e.target.value)}
              disabled={birthNakSel === ''}
              className={pageStyles.select}
            >
              <option value="">Auto rāśi</option>
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
                Use Natal Moon
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className={pageStyles.loadingContainer}>
          <div className="spin-loader" />
          <div className={pageStyles.loadingText}>
            Calculating the celestial movements…
          </div>
        </div>
      )}

      {error && (
        <div className={pageStyles.errorMessage}>
          {error}
        </div>
      )}

      {data && !loading && <DailyPanchangView data={data} />}
    </main>
    </>
  )
}
