// ─────────────────────────────────────────────────────────────
//  src/components/ui/BirthForm.tsx
//  Birth data entry form with location autocomplete
//  Defaults: Delhi · current date/time · Asia/Kolkata
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useState, useRef, useCallback, useEffect, useId } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ChartOutput, ChartSettings, Gender } from '@/types/astrology'
import { DEFAULT_SETTINGS } from '@/types/astrology'
import { parseCoordinate } from '@/lib/atlas/coords'
import { useSession } from 'next-auth/react'
import { ChartTagsInput } from '@/components/ui/ChartTagsInput'

// ── Delhi defaults ────────────────────────────────────────────

const DELHI_DEFAULT = {
  name: 'Delhi',
  place: 'New Delhi, Delhi, IN',
  lat: 28.6139,
  lng: 77.2090,
  tz: 'Asia/Kolkata',
}

const FALLBACK_TZ_LIST = [
  'Asia/Kolkata', 'Asia/Kathmandu', 'Asia/Dubai', 'Asia/Singapore', 
  'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 
  'Europe/Paris', 'Australia/Sydney', 'Asia/Tokyo', 'Asia/Hong_Kong'
]

function nowIST(): { date: string; time: string } {
  // Use current moment in IST
  const now = new Date()
  // Format in IST
  const istOpts: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }
  const parts = new Intl.DateTimeFormat('en-CA', istOpts).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  const date = `${get('year')}-${get('month')}-${get('day')}`
  const time = `${get('hour').replace('24', '00')}:${get('minute')}:${get('second')}`
  return { date, time }
}

// ── Types ─────────────────────────────────────────────────────

interface LocationResult {
  name: string
  country: string
  admin1: string
  latitude: number
  longitude: number
  timezone: string
}

interface BirthFormProps {
  onResult: (data: ChartOutput) => void
  onLoading?: (loading: boolean) => void
  autoSubmit?: boolean   // calculate immediately on mount with defaults
  onSaveTagsChange?: (tags: string[]) => void
  initialTags?: string[]
  initialName?: string
  initialData?: {
    name: string; birthDate: string; birthTime: string; birthPlace: string
    latitude: number; longitude: number; timezone: string; gender?: Gender; settings?: ChartSettings
  }
}

// ── Component ────────────────────────────────────────────────

export function BirthForm({ onResult, onLoading, autoSubmit = false, onSaveTagsChange, initialTags = [], initialName = 'Transit', initialData }: BirthFormProps) {
  const fieldId = useId()
  const ids = {
    name: `${fieldId}-name`,
    gender: `${fieldId}-gender`,
    date: `${fieldId}-date`,
    time: `${fieldId}-time`,
    place: `${fieldId}-place`,
    lat: `${fieldId}-lat`,
    lng: `${fieldId}-lng`,
    tz: `${fieldId}-tz`,
    ayanamsha: `${fieldId}-ayanamsha`,
    houseSystem: `${fieldId}-house`,
    karaka: `${fieldId}-karaka`,
    nodes: `${fieldId}-nodes`,
    saveLibrary: `${fieldId}-save`,
  }

  const { date: todayDate, time: nowTime } = nowIST()
  const searchParams = useSearchParams()

  const { data: session } = useSession()
  const [name, setName] = useState(initialData?.name || initialName)
  const [saveToLibrary, setSaveToLibrary] = useState(false)
  const [saveTags, setSaveTags] = useState<string[]>(initialTags)

  useEffect(() => {
    setSaveTags(initialTags)
  }, [initialTags.join('|')])
  const [date, setDate] = useState(initialData?.birthDate || todayDate)
  const [time, setTime] = useState(initialData?.birthTime || nowTime)
  const [place, setPlace] = useState(initialData?.birthPlace || DELHI_DEFAULT.place)
  const [lat, setLat] = useState<number | null>(initialData?.latitude ?? DELHI_DEFAULT.lat)
  const [lng, setLng] = useState<number | null>(initialData?.longitude ?? DELHI_DEFAULT.lng)
  const [tz, setTz] = useState(initialData?.timezone || DELHI_DEFAULT.tz)
  const [gender, setGender] = useState<Gender>(initialData?.gender || 'male')
  const [settings, setSettings] = useState<ChartSettings>(initialData?.settings || DEFAULT_SETTINGS)

  const [locationResults, setLocationResults] = useState<LocationResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Timezone list for manual entry
  // Initialized with fallback list to avoid hydration mismatch between server/client
  const [tzList, setTzList] = useState(FALLBACK_TZ_LIST)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    // Populate full IANA list on client mount
    if (typeof Intl !== 'undefined' && (Intl as any).supportedValuesOf) {
      try {
        const fullList = (Intl as any).supportedValuesOf('timeZone') as string[]
        // Ensure both modern and legacy names are available for common Indian zones
        if (!fullList.includes('Asia/Kolkata')) fullList.push('Asia/Kolkata')
        if (!fullList.includes('Asia/Calcutta')) fullList.push('Asia/Calcutta')

        const sorted = [...new Set(fullList)].sort((a, b) => {
          const aAsia = a.startsWith('Asia/')
          const bAsia = b.startsWith('Asia/')
          if (aAsia && !bAsia) return -1
          if (!aAsia && bAsia) return 1
          return a.localeCompare(b)
        })
        setTzList(sorted)
      } catch (e) {
        console.warn("Full timezone list not supported", e)
      }
    }
  }, [])

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchCache = useRef<Map<string, LocationResult[]>>(new Map())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const didAutoSubmit = useRef(false)

  // ── Pre-fill and Auto-submit from URL ────────────────────────

  useEffect(() => {
    if (didAutoSubmit.current) return

    const pName = searchParams.get('name')
    const pDate = searchParams.get('birthDate')
    const pTime = searchParams.get('birthTime')
    const pPlace = searchParams.get('birthPlace')
    const pLat = searchParams.get('lat')
    const pLng = searchParams.get('lng')
    const pTz = searchParams.get('tz')
    const pGender = searchParams.get('gender') as Gender | null

    if (pName && pDate && pTime && pLat && pLng) {
      didAutoSubmit.current = true
      const n = pName
      const d = pDate
      const t = pTime
      const pl = pPlace || ''
      const lt = parseFloat(pLat)
      const lg = parseFloat(pLng)
      const tzone = pTz || '' // Start empty if not provided from URL

      setName(n)
      setDate(d)
      setTime(t)
      setPlace(pl)
      setLat(lt)
      setLng(lg)
      
      if (tzone) {
        setTz(tzone)
        setTimeout(() => submitChart(n, d, t, pl, lt, lg, tzone, gender, settings), 150)
      } else {
        // If coords provided but no TZ, we MUST resolve it first to avoid UTC bug
        fetch(`/api/atlas/search?lat=${lt}&lng=${lg}`)
          .then(r => r.json())
          .then(data => {
            const resolvedTz = data.results?.[0]?.timezone || 'Asia/Kolkata' // Default to IST if all else fails
            setTz(resolvedTz)
            submitChart(n, d, t, pl, lt, lg, resolvedTz, gender, settings)
          })
          .catch(() => {
            setTz('Asia/Kolkata')
            submitChart(n, d, t, pl, lt, lg, 'Asia/Kolkata', gender, settings)
          })
      }
    } else if (autoSubmit && initialData) {
      didAutoSubmit.current = true
      const resolvedTz = initialData.timezone || 'Asia/Kolkata'
      const g = initialData.gender || 'male'
      setTz(resolvedTz)
      setGender(g)
      setTimeout(() => submitChart(
        initialData.name,
        initialData.birthDate,
        initialData.birthTime,
        initialData.birthPlace,
        initialData.latitude,
        initialData.longitude,
        resolvedTz,
        g,
        initialData.settings || DEFAULT_SETTINGS
      ), 150)
    } else if (autoSubmit) {
      didAutoSubmit.current = true
      setTz(DELHI_DEFAULT.tz)
      setGender('male')
      setTimeout(() => submitChart(
        DELHI_DEFAULT.name,
        todayDate,
        nowTime,
        DELHI_DEFAULT.place,
        DELHI_DEFAULT.lat,
        DELHI_DEFAULT.lng,
        DELHI_DEFAULT.tz,
        'male',
        DEFAULT_SETTINGS,
      ), 150)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, autoSubmit, initialData])

  // ── Location search ───────────────────────────────────────

  const searchLocations = useCallback(async (q: string) => {
    const query = q.trim().toLowerCase()
    if (query.length < 2) { setLocationResults([]); return }
    
    // Check cache first
    if (searchCache.current.has(query)) {
      setLocationResults(searchCache.current.get(query) || [])
      setSearchOpen(true)
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/atlas/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Location search failed')
        setLocationResults([])
        return
      }
      let results = data.results ?? []
      
      // Client-side fix: If any result still says UTC but is in SAARC region, fix it
      results = results.map((loc: LocationResult) => {
        if (loc.timezone === 'UTC') {
          const isNepal = loc.country === 'Nepal' || (loc.latitude > 26.0 && loc.latitude < 30.5 && loc.longitude > 80.0 && loc.longitude < 88.5)
          const isIndia = !isNepal && (loc.latitude > 6.7 && loc.latitude < 37.5 && loc.longitude > 68.1 && loc.longitude < 97.4)
          if (isNepal) return { ...loc, timezone: 'Asia/Kathmandu' }
          if (isIndia) return { ...loc, timezone: 'Asia/Kolkata' }
        }
        return loc
      })
      
      // Only cache if results are GOOD (no UTC for India/Nepal)
      const hasBadUTC = results.some((r: LocationResult) => 
        r.timezone === 'UTC' && r.latitude > 6.7 && r.latitude < 37.5 && r.longitude > 68.1 && r.longitude < 97.4
      )
      
      if (!hasBadUTC && results.length > 0) {
        searchCache.current.set(query, results)
      }
      
      setLocationResults(results)
      setSearchOpen(true)
    } catch {
      setLocationResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setSearching(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lt, longitude: lg } = pos.coords
        setLat(lt)
        setLng(lg)
        // Reverse geocode via atlas search (approximate)
        try {
          const res = await fetch(`/api/atlas/search?lat=${lt}&lng=${lg}`)
          const data = await res.json()
          if (data.results?.[0]) {
            const loc = data.results[0]
            setPlace(`${loc.name}, ${loc.country}`)
            setTz(loc.timezone)
          } else {
            setPlace(`Current Location (${lt.toFixed(2)}, ${lg.toFixed(2)})`)
          }
        } catch {
          setPlace(`Current Location (${lt.toFixed(2)}, ${lg.toFixed(2)})`)
        } finally {
          setSearching(false)
        }
      },
      () => setSearching(false)
    )
  }

  const resolveTimezoneFromCoords = async () => {
    if (lat === null || lng === null) return
    setSearching(true)
    try {
      const res = await fetch(`/api/atlas/search?lat=${lat}&lng=${lng}`)
      const data = await res.json()
      if (data.results?.[0]?.timezone) {
        let resolvedTz = data.results[0].timezone
        // Client-side fix for UTC fallback in SAARC
        if (resolvedTz === 'UTC') {
          const loc = data.results[0]
          const isNepal = loc.country === 'Nepal' || (lat > 26.0 && lat < 30.5 && lng > 80.0 && lng < 88.5)
          const isIndia = !isNepal && (lat > 6.7 && lat < 37.5 && lng > 68.1 && lng < 97.4)
          if (isNepal) resolvedTz = 'Asia/Kathmandu'
          else if (isIndia) resolvedTz = 'Asia/Kolkata'
        }
        setTz(resolvedTz)
      }
    } catch {
      // ignore
    } finally {
      setSearching(false)
    }
  }

  // Auto-calculate is disabled — chart only recalculates on explicit button click.
  // (The initial autoSubmit on mount still works via the URL/defaults effect above.)

  const handlePlaceChange = (val: string) => {
    setPlace(val)
    setLat(null); setLng(null)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    
    // If it's in cache, show it immediately
    const query = val.trim().toLowerCase()
    if (query.length >= 2 && searchCache.current.has(query)) {
        setLocationResults(searchCache.current.get(query)!)
        setSearchOpen(true)
    }

    searchTimer.current = setTimeout(() => searchLocations(val), 400)
  }

  const selectLocation = (loc: LocationResult) => {
    setPlace(`${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}, ${loc.country}`)
    setLat(loc.latitude)
    setLng(loc.longitude)
    setTz(loc.timezone)
    setLocationResults([])
    setSearchOpen(false)
    setManualMode(false) // Exit manual mode if picking from list
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Core calculation ──────────────────────────────────────




  async function submitChart(
    nameVal: string, dateVal: string, timeVal: string,
    placeVal: string, latVal: number, lngVal: number,
    tzVal: string, genderVal: Gender, settingsVal: ChartSettings,
  ) {
    setError(null)
    setLoading(true)
    onLoading?.(true)

    try {
      const safeTime = /^\d{2}:\d{2}:\d{2}$/.test(timeVal) ? timeVal : `${timeVal}:00`
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameVal.trim() || 'Delhi',
          birthDate: dateVal,
          birthTime: safeTime,
          birthPlace: placeVal,
          latitude: latVal,
          longitude: lngVal,
          timezone: tzVal,
          gender: genderVal,
          settings: settingsVal,
          _t: Date.now(), // Cache buster to force re-calculation
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Calculation failed')
        return
      }

      // If "Save to Library" is checked and user is logged in, save it
      if (saveToLibrary && session?.user) {
        try {
          await fetch('/api/chart/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: nameVal.trim() || 'Natal Chart',
              birthDate: dateVal,
              birthTime: safeTime,
              birthPlace: placeVal,
              latitude: latVal,
              longitude: lngVal,
              timezone: tzVal,
              gender: genderVal,
              settings: settingsVal,
              tags: saveTags,
            }),
          })
        } catch (e) {
          console.error('Failed to auto-save chart:', e)
        }
      }

      onResult(json.data)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
      onLoading?.(false)
    }
  }

  // ── Form submit ───────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter a name'); return }
    if (!date) { setError('Please enter birth date'); return }
    const dParts = date.split('-')
    const isNeg = date.startsWith('-') && dParts.length > 3
    const yVal = isNeg ? '-' + dParts[1] : dParts[0]
    if (!yVal || isNaN(parseInt(yVal))) {
      setError('Please enter a valid birth year')
      return
    }
    if (lat === null || lng === null) { 
      setError('Please select a location or enter coordinates manually'); 
      return 
    }

    // If in manual mode, use the coordinates as the place name
    const finalPlace = manualMode 
      ? `Manual (${lat.toFixed(4)}, ${lng.toFixed(4)})` 
      : place

    await submitChart(name, date, time, finalPlace, lat, lng, tz, gender, settings)
  }

  // ── Date Part Handlers ────────────────────────────────────

  const handleDatePartChange = (part: 'y' | 'm' | 'd', val: string | number) => {
    const dParts = date.split('-')
    const isNeg = date.startsWith('-') && dParts.length > 3
    let y = isNeg ? '-' + dParts[1] : dParts[0]
    let m = dParts[isNeg ? 2 : 1] || '01'
    let d = dParts[isNeg ? 3 : 2] || '01'
    
    if (part === 'y') {
      y = val.toString()
    } else if (part === 'm') {
      m = String(val).padStart(2, '0')
    } else if (part === 'd') {
      d = String(val).padStart(2, '0')
    }

    // Validate day count for the month (e.g. Feb 31 -> Feb 28/29)
    // Only validate if we have a valid year and month
    const yInt = parseInt(y)
    const mInt = parseInt(m)
    let dInt = parseInt(d)
    
    if (!isNaN(yInt) && !isNaN(mInt)) {
      const maxDays = new Date(yInt, mInt, 0).getDate()
      if (dInt > maxDays) dInt = maxDays
      d = String(dInt).padStart(2, '0')
    }

    setDate(`${y}-${m}-${d}`)
  }

  const handleTimePartChange = (part: 'h' | 'm' | 's' | 'p', val: string | number) => {
    const parts = time.split(':')
    let h24 = parseInt(parts[0]) || 0
    let m = parseInt(parts[1]) || 0
    let s = parseInt(parts[2]) || 0
    
    // Current 12h state
    let h12 = h24 % 12 || 12
    let ampm = h24 >= 12 ? 'PM' : 'AM'

    if (part === 'h') h12 = val as number
    else if (part === 'm') m = val as number
    else if (part === 's') s = val as number
    else if (part === 'p') ampm = val as string

    // Back to 24h
    let newH24 = h12 % 12
    if (ampm === 'PM') newH24 += 12
    
    const tStr = `${String(newH24).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    setTime(tStr)
  }

  // ── Refresh to now ────────────────────────────────────────

  const setToNow = () => {
    const { date: d, time: t } = nowIST()
    setDate(d)
    setTime(t)
  }



  // Handle time input change (supports HH:MM, HH:MM:SS, and step values)
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    // If the input doesn't have seconds, append :00
    if (value && value.split(':').length === 2) {
      value = `${value}:00`
    }
    setTime(value)
  }

  // ── Incremental Time Adjusters ───────────────────────────



  // ── Render ────────────────────────────────────────────────

  const dParts = date.split('-')
  const isNeg = date.startsWith('-') && dParts.length > 3
  const yVal = isNeg ? '-' + dParts[1] : dParts[0]
  const mVal = parseInt(dParts[isNeg ? 2 : 1]) || 1
  const dVal = parseInt(dParts[isNeg ? 3 : 2]) || 1

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', overflow: 'visible' }}>
      



      {/* Name & Gender Row */}
      <div style={{ 
        display: 'flex', 
        gap: isMobile ? '0.5rem' : '0.75rem', 
        width: '100%',
        alignItems: 'flex-end'
      }}>
        {/* Name Field */}
        <div style={{ flex: 1 }}>
          <label className="field-label" htmlFor={ids.name} style={{ marginBottom: '0.15rem' }}>Name / Label</label>
          <input
            id={ids.name}
            className="input"
            type="text"
            placeholder="e.g. Ravi Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Gender Selection (Compact) */}
        <div style={{ width: isMobile ? 100 : 120, flexShrink: 0 }}>
          <span id={ids.gender} className="field-label" style={{ marginBottom: '0.15rem', display: 'block' }}>Gender</span>
          <div
            role="group"
            aria-labelledby={ids.gender}
            style={{
            display: 'flex',
            gap: '2px',
            background: 'var(--surface-2)',
            padding: '2px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border-soft)',
            height: '38px',
            alignItems: 'stretch',
            boxSizing: 'border-box'
          }}>
            {(['male', 'female', 'other'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                title={g}
                style={{
                  flex: 1,
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: gender === g ? 'var(--text-gold)' : 'transparent',
                  color: gender === g ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  padding: 0
                }}
              >
                {g === 'male' ? 'M' : g === 'female' ? 'F' : 'O'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date + Time section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1.15fr 1fr' : '1.1fr 1fr', 
        gap: isMobile ? '0.65rem' : '1.25rem', 
        width: '100%' 
      }}>
        {/* Date Field */}
        <div style={{ width: '100%', minWidth: 0 }}>
          <label className="field-label" htmlFor={ids.date} style={{ marginBottom: '0.25rem' }}>Date</label>
          <div
            id={ids.date}
            role="group"
            aria-label="Birth date"
            style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--r-md)',
            height: '42px',
            overflow: 'hidden'
          }}>
            <select
              value={dVal}
              onChange={(e) => handleDatePartChange('d', e.target.value)}
              style={{ 
                width: isMobile ? '38px' : '48px', background: 'transparent', border: 'none', 
                padding: isMobile ? '0 0 0 6px' : '0 4px', fontSize: '0.9rem', color: 'var(--text-primary)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center'
              }}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
              ))}
            </select>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-soft)', opacity: 0.6 }} />
            <select
              value={mVal}
              onChange={(e) => handleDatePartChange('m', e.target.value)}
              style={{ 
                flex: 1, background: 'transparent', border: 'none', 
                padding: '0 4px', fontSize: '0.9rem', color: 'var(--text-primary)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center'
              }}
            >
              {[
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
              ].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-soft)', opacity: 0.6 }} />
            <input
              type="number"
              value={yVal}
              onChange={(e) => handleDatePartChange('y', e.target.value)}
              style={{ 
                width: isMobile ? '48px' : '65px', background: 'transparent', border: 'none', 
                padding: isMobile ? '0 6px 0 2px' : '0 8px', fontSize: '0.9rem', color: 'var(--text-primary)',
                textAlign: 'center', appearance: 'none'
              }}
            />
          </div>
        </div>

        {/* Time Field - Same Pill Design */}
        <div style={{ width: '100%', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <label className="field-label" htmlFor={ids.time} style={{ marginBottom: 0 }}>Time</label>
            <button
              type="button"
              onClick={setToNow}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--gold)', fontSize: '0.6rem',
                fontFamily: 'var(--font-body)', letterSpacing: '0.04em',
                padding: 0, textTransform: 'uppercase', fontWeight: 600,
              }}
            >
              Now ↺
            </button>
          </div>
          <div
            id={ids.time}
            role="group"
            aria-label="Birth time"
            style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--r-md)',
            height: '42px',
            overflow: 'hidden'
          }}>
            {/* Hours */}
            <select
              value={parseInt(time.split(':')[0]) % 12 || 12}
              onChange={(e) => handleTimePartChange('h', parseInt(e.target.value))}
              style={{ 
                width: isMobile ? '32px' : '42px', background: 'transparent', border: 'none', 
                padding: isMobile ? '0 0 0 4px' : '0 4px', fontSize: '0.9rem', color: 'var(--text-primary)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center'
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
              ))}
            </select>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-soft)', opacity: 0.6 }} />
            
            {/* Minutes */}
            <select
              value={parseInt(time.split(':')[1]) || 0}
              onChange={(e) => handleTimePartChange('m', parseInt(e.target.value))}
              style={{ 
                width: isMobile ? '32px' : '42px', background: 'transparent', border: 'none', 
                padding: '0', fontSize: '0.9rem', color: 'var(--text-primary)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center'
              }}
            >
              {Array.from({ length: 60 }, (_, i) => i).map(m => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-soft)', opacity: 0.6 }} />
            
            {/* Seconds */}
            <select
              value={parseInt(time.split(':')[2]) || 0}
              onChange={(e) => handleTimePartChange('s', parseInt(e.target.value))}
              style={{ 
                width: isMobile ? '32px' : '42px', background: 'transparent', border: 'none', 
                padding: '0', fontSize: '0.9rem', color: 'var(--text-primary)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center'
              }}
            >
              {Array.from({ length: 60 }, (_, i) => i).map(s => (
                <option key={s} value={s}>{String(s).padStart(2, '0')}</option>
              ))}
            </select>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-soft)', opacity: 0.6 }} />
            
            {/* AM/PM */}
            <select
              value={parseInt(time.split(':')[0]) >= 12 ? 'PM' : 'AM'}
              onChange={(e) => handleTimePartChange('p', e.target.value)}
              style={{ 
                flex: 1, background: 'transparent', border: 'none', 
                padding: '0 4px 0 2px', fontSize: '0.9rem', color: 'var(--text-gold)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center', fontWeight: 600
              }}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      </div>



      {/* Location Field with autocomplete */}
      <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
        <label className="field-label" htmlFor={ids.place} style={{ marginBottom: '0.15rem', display: 'flex', alignItems: 'center' }}>
          Place
          {searching && (
            <span style={{ marginLeft: 8, fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              searching…
            </span>
          )}
          <button
            type="button"
            onClick={useMyLocation}
            title="Use current device location"
            style={{
              marginLeft: 'auto',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--gold)', fontSize: '0.62rem',
              fontFamily: 'var(--font-body)', letterSpacing: '0.04em',
              padding: 0, textTransform: 'uppercase', fontWeight: 600,
            }}
          >
            Use My Location 📍
          </button>
        </label>
        {/* Mode Toggler */}
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginBottom: '0.15rem' }}>
          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: manualMode ? 'var(--gold)' : 'var(--text-muted)',
              fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.04em',
              textTransform: 'uppercase', padding: '0 2px'
            }}
          >
            {manualMode ? '✓ Search City' : '✎ Enter Lat/Lng'}
          </button>
        </div>

        {manualMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', animation: 'fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label htmlFor={ids.lat} style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Latitude (-90 to 90)</label>
                  <input
                    id={ids.lat}
                    type="text" placeholder="e.g. 28:02 or 28.0333" 
                    className="input" style={{ width: '100%' }}
                    value={lat ?? ''} 
                    onChange={e => setLat(parseCoordinate(e.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor={ids.lng} style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Longitude (-180 to 180)</label>
                  <input
                    id={ids.lng}
                    type="text" placeholder="e.g. 73:31 or 73.5167" 
                    className="input" style={{ width: '100%' }}
                    value={lng ?? ''} 
                    onChange={e => setLng(parseCoordinate(e.target.value))}
                  />
                </div>
             </div>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              <input
                id={ids.place}
                className="input"
                type="text"
                placeholder="City, Country"
                value={place}
                onChange={(e) => handlePlaceChange(e.target.value)}
                onFocus={() => {
                  if (locationResults.length > 0) setSearchOpen(true)
                  else if (place.length >= 2) searchLocations(place)
                }}
                autoComplete="off"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />

              {/* Dropdown moved here to be relative to input */}
              {searchOpen && locationResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  zIndex: 1201,
                  width: '100%',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '6px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-bright)',
                  borderRadius: 12,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1)',
                  maxHeight: isMobile ? 250 : 300,
                  overflowY: 'auto',
                  boxSizing: 'border-box',
                  animation: 'fadeUp 0.2s ease-out'
                }}>
                  {locationResults.map((loc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectLocation(loc)}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 2,
                        width: '100%', textAlign: 'left',
                        padding: '0.6rem 1rem',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        borderBottom: i < locationResults.length - 1
                          ? '1px solid var(--border-soft)' : 'none',
                        transition: 'background 0.1s',
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.07)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {loc.name}
                        {loc.admin1 && (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>, {loc.admin1}</span>
                        )}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                        <span>{loc.country}</span>
                        <span>{loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°</span>
                        <span style={{ color: loc.timezone === 'UTC' ? 'var(--rose)' : 'var(--text-gold)', fontWeight: loc.timezone === 'UTC' ? 400 : 700 }}>{loc.timezone}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Coords display overlay */}
            {lat !== null && lng !== null && (
              <div style={{
                marginTop: 4, fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                display: 'flex', gap: '0.8rem', flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <span title="Latitude">{lat.toFixed(4)}° N</span>
                <span title="Longitude">{lng.toFixed(4)}° E</span>
              </div>
            )}
          </>
        )}

        {/* Unified Timezone Selection */}
        <div style={{ marginTop: '0.65rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
            <label className="field-label" htmlFor={ids.tz} style={{ marginBottom: 0 }}>Timezone (IANA)</label>
            {manualMode && (
              <button 
                type="button" 
                onClick={resolveTimezoneFromCoords}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--gold)', fontSize: '0.62rem', fontWeight: 600,
                  textTransform: 'uppercase', padding: 0, letterSpacing: '0.04em'
                }}
              >
                Resolve from Coords ⟲
              </button>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id={ids.tz}
              type="text"
              placeholder="Search e.g. Asia/Kolkata" 
              className="input" 
              style={{ width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
              value={tz} 
              onChange={e => setTz(e.target.value)}
              onFocus={e => e.target.select()}
              onMouseUp={e => e.preventDefault()} // Fix for some browsers not keeping selection on click
              list="tz-datalist"
              autoComplete="off"
            />
            <datalist id="tz-datalist">
               {/* Explicitly prioritize the most common ones at the very top */}
               <option value="Asia/Kolkata" />
               <option value="Asia/Kathmandu" />
               <option value="Asia/Calcutta" />
               <option value="Asia/Dubai" />
               <option value="Asia/Singapore" />
               <option value="UTC" />
               <option value="America/New_York" />
               <option value="Europe/London" />
               
               {/* Then the rest of the Asia/ zones and finally the global list */}
               {tzList
                 .filter(t => !['Asia/Kolkata', 'Asia/Kathmandu', 'Asia/Calcutta', 'Asia/Dubai', 'Asia/Singapore', 'UTC', 'America/New_York', 'Europe/London'].includes(t))
                 .map(t => <option key={t} value={t} />)
               }
            </datalist>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-gold)', marginTop: 2, fontStyle: 'italic', opacity: 0.8 }}>
              Selected: {tz}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced settings */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((o) => !o)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.8rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0,
            letterSpacing: '0.03em',
          }}
        >
          <span style={{
            display: 'inline-block',
            transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            fontSize: '0.55rem',
          }}>▶</span>
          Advanced settings
        </button>

        {showAdvanced && (
          <div className="grid-responsive-2" style={{
            marginTop: '0.75rem', padding: '1rem',
            background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--border-soft)',
            animation: 'fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <div>
              <label className="field-label" htmlFor={ids.ayanamsha}>Ayanamsha</label>
              <select id={ids.ayanamsha} className="input" value={settings.ayanamsha}
                onChange={(e) => setSettings((s) => ({ ...s, ayanamsha: e.target.value as any }))}
                style={{ width: '100%', boxSizing: 'border-box' }}>
                <option value="lahiri">Lahiri (default)</option>
                <option value="true_chitra">True Chitra</option>
                <option value="raman">Raman</option>
                <option value="true_revati">True Revati</option>
                <option value="usha_shashi">Usha-Shashi</option>
                <option value="yukteshwar">Yukteshwar</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor={ids.houseSystem}>House system</label>
              <select id={ids.houseSystem} className="input" value={settings.houseSystem}
                onChange={(e) => setSettings((s) => ({ ...s, houseSystem: e.target.value as any }))}
                style={{ width: '100%', boxSizing: 'border-box' }}>
                <option value="whole_sign">Whole Sign</option>
                <option value="placidus">Placidus</option>
                <option value="equal">Equal House</option>
                <option value="bhava_chalita">Bhava Chalita</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor={ids.karaka}>Karaka scheme</label>
              <select id={ids.karaka} className="input" value={settings.karakaScheme}
                onChange={(e) => setSettings((s) => ({ ...s, karakaScheme: Number(e.target.value) as 7 | 8 }))}
                style={{ width: '100%', boxSizing: 'border-box' }}>
                <option value={7}>7 Karakas (default)</option>
                <option value={8}>8 Karakas</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor={ids.nodes}>Rahu / Ketu nodes</label>
              <select id={ids.nodes} className="input" value={settings.nodeMode}
                onChange={(e) => setSettings((s) => ({ ...s, nodeMode: e.target.value as any }))}
                style={{ width: '100%', boxSizing: 'border-box' }}>
                <option value="mean">Mean nodes</option>
                <option value="true">True nodes</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Save to library checkbox */}
      {session && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
            <input
              id={ids.saveLibrary}
              type="checkbox"
              checked={saveToLibrary}
              onChange={(e) => setSaveToLibrary(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor={ids.saveLibrary} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer' }}>
              Save this chart to my library
            </label>
          </div>
          {saveToLibrary && (
            <ChartTagsInput
              tags={saveTags}
              onChange={(next) => {
                setSaveTags(next)
                onSaveTagsChange?.(next)
              }}
              compact
            />
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" style={{
          padding: '0.7rem 1rem',
          background: 'rgba(212,120,138,0.1)',
          border: '1px solid rgba(212,120,138,0.3)',
          borderRadius: 8,
          color: 'var(--rose)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.92rem',
        }}>
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '0.85rem',
          fontSize: '0.95rem',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.04em',
          opacity: loading ? 0.75 : 1,
          transition: 'opacity 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}
      >
        {loading ? (
          <>
            <span style={{
              width: 14, height: 14,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin-slow 0.7s linear infinite',
              display: 'inline-block',
              flexShrink: 0,
            }} />
            Consulting the stars…
          </>
        ) : (
          <>🪐 Calculate Chart</>
        )}
      </button>
    </form>
  )
}