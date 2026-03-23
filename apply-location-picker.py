#!/usr/bin/env python3
# Run from project root: python apply-location-picker.py
import os, sys

def read(p):
    with open(p, encoding='utf-8') as f: return f.read()

def write(p, c):
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

print("\n=== Location Picker Upgrade ===\n")

# ── 1. Rewrite LocationPicker.tsx ────────────────────────────
NEW_PICKER = r"""'use client'
// src/components/ui/LocationPicker.tsx
// Atlas-backed location typeahead with:
// - localStorage persistence (remembers last location)
// - "Use birth location" quick button
// - Browser geolocation ("My location")

import { useState, useRef, useCallback, useEffect } from 'react'

export interface LocationValue {
  lat:  number
  lng:  number
  tz:   string
  name: string
}

interface AtlasResult {
  name:      string
  country:   string
  admin1:    string
  latitude:  number
  longitude: number
  timezone:  string
}

interface Props {
  value:         LocationValue
  onChange:      (loc: LocationValue) => void
  label?:        string
  birthLocation?: LocationValue | null
}

export const DELHI_DEFAULT: LocationValue = {
  lat: 28.6139, lng: 77.209, tz: 'Asia/Kolkata', name: 'New Delhi, India',
}

const LS_KEY = 'vedaansh-panchang-location'

export function getSavedLocation(): LocationValue {
  if (typeof window === 'undefined') return DELHI_DEFAULT
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as LocationValue
  } catch {}
  return DELHI_DEFAULT
}

function saveLocation(loc: LocationValue) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(loc)) } catch {}
}

export function LocationPicker({ value, onChange, label = 'Location', birthLocation }: Props) {
  const [query,      setQuery]      = useState(value.name)
  const [results,    setResults]    = useState<AtlasResult[]>([])
  const [open,       setOpen]       = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value.name) }, [value.name])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/atlas/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setOpen(true)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => search(val), 220)
  }

  function handleSelect(r: AtlasResult) {
    const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    const loc: LocationValue = { lat: r.latitude, lng: r.longitude, tz: r.timezone, name }
    setQuery(name); setOpen(false); setResults([])
    saveLocation(loc); onChange(loc)
  }

  function handleBirthLocation() {
    if (!birthLocation) return
    saveLocation(birthLocation); onChange(birthLocation)
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res  = await fetch(`/api/atlas/search?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`)
          const data = await res.json()
          if (data.results?.length > 0) { handleSelect(data.results[0]); return }
        } catch {}
        const loc: LocationValue = {
          lat, lng,
          tz:   Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          name: `${lat.toFixed(2)}\u00b0, ${lng.toFixed(2)}\u00b0`,
        }
        saveLocation(loc); onChange(loc); setGeoLoading(false)
      },
      () => setGeoLoading(false),
      { timeout: 8000 },
    )
  }

  const showBirthHighlight = birthLocation &&
    (Math.abs(birthLocation.lat - value.lat) > 0.01 || Math.abs(birthLocation.lng - value.lng) > 0.01)

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
          {label}
        </label>
      )}

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={geoLoading}
          title="Use my current location"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.2rem 0.55rem', fontSize: '0.7rem', fontFamily: 'inherit',
            background: 'var(--surface-3)', border: '1px solid var(--border-soft)',
            borderRadius: 'var(--r-sm)', color: 'var(--text-secondary)',
            cursor: geoLoading ? 'wait' : 'pointer', opacity: geoLoading ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {geoLoading ? '\u27f3' : '\ud83d\udccd'} {geoLoading ? 'Locating\u2026' : 'My location'}
        </button>

        {birthLocation && (
          <button
            type="button"
            onClick={handleBirthLocation}
            title={`Use birth location: ${birthLocation.name}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.2rem 0.55rem', fontSize: '0.7rem', fontFamily: 'inherit',
              background: showBirthHighlight ? 'rgba(184,134,11,0.08)' : 'var(--surface-3)',
              border: `1px solid ${showBirthHighlight ? 'rgba(184,134,11,0.3)' : 'var(--border-soft)'}`,
              borderRadius: 'var(--r-sm)',
              color: showBirthHighlight ? 'var(--text-gold)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
              maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            \u2726 Birth: {birthLocation.name.split(',')[0]}
          </button>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          className="input"
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search city\u2026"
          autoComplete="off"
          style={{ width: '100%', paddingRight: loading ? '2rem' : undefined }}
        />
        {loading && (
          <span style={{
            position: 'absolute', right: '0.5rem', top: '50%',
            transform: 'translateY(-50%)', fontSize: '0.72rem', color: 'var(--text-muted)',
          }}>\u27f3</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', zIndex: 200, top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          maxHeight: 260, overflowY: 'auto',
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              onMouseDown={() => handleSelect(r)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.55rem 0.85rem', background: 'none', border: 'none',
                cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid var(--border-soft)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {[r.admin1, r.country, r.timezone].filter(Boolean).join(' \u00b7 ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
"""

write('src/components/ui/LocationPicker.tsx', NEW_PICKER)
print("  [ok] LocationPicker.tsx — rewritten with persistence + geolocation + birth location")

# ── Helper to update a page ───────────────────────────────────
def update_page(path, fn_name, picker_old, picker_new):
    c = read(path)
    changed = False

    # Replace import
    old_import = "import { LocationPicker, DELHI_DEFAULT, type LocationValue } from '@/components/ui/LocationPicker'"
    new_import  = "import { useChart } from '@/components/providers/ChartProvider'\nimport { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'"
    if old_import in c and 'getSavedLocation' not in c:
        c = c.replace(old_import, new_import); changed = True

    # Replace initial state
    if 'DELHI_DEFAULT)' in c:
        c = c.replace('useState<LocationValue>(DELHI_DEFAULT)', 'useState<LocationValue>(getSavedLocation)'); changed = True

    # Add useChart inside function
    marker = f"export default function {fn_name}() {{\n"
    if marker in c and 'const { chart } = useChart()' not in c:
        c = c.replace(marker, marker + "  const { chart } = useChart()\n"); changed = True

    # Replace LocationPicker JSX
    if picker_old in c:
        c = c.replace(picker_old, picker_new); changed = True

    write(path, c)
    print(f"  {'[ok]' if changed else '[--]'} {path}")

# ── 2. Panchang daily page ────────────────────────────────────
update_page(
    'src/app/panchang/page.tsx',
    'PanchangPage',
    '<LocationPicker value={location} onChange={setLocation} label="" />',
    '''<LocationPicker
                value={location}
                onChange={setLocation}
                label=""
                birthLocation={chart ? { lat: chart.meta.latitude, lng: chart.meta.longitude, tz: chart.meta.timezone, name: chart.meta.birthPlace } : null}
              />'''
)

# ── 3. Panchang calendar page ─────────────────────────────────
update_page(
    'src/app/panchang/calendar/page.tsx',
    'MonthlyPanchangPage',
    '<LocationPicker value={location} onChange={(loc) => { setLocation(loc); setDayMap({}) }} label="" />',
    '''<LocationPicker
                value={location}
                onChange={(loc) => { setLocation(loc); setDayMap({}) }}
                label=""
                birthLocation={chart ? { lat: chart.meta.latitude, lng: chart.meta.longitude, tz: chart.meta.timezone, name: chart.meta.birthPlace } : null}
              />'''
)

# ── 4. Muhurta page ───────────────────────────────────────────
update_page(
    'src/app/muhurta/page.tsx',
    'MuhurtaPage',
    '<LocationPicker value={location} onChange={setLocation} label="\ud83d\udccd Location" />',
    '''<LocationPicker
              value={location}
              onChange={setLocation}
              label="\ud83d\udccd Location"
              birthLocation={chart ? { lat: chart.meta.latitude, lng: chart.meta.longitude, tz: chart.meta.timezone, name: chart.meta.birthPlace } : null}
            />'''
)

print("\n=== Done! Run: npm run typecheck ===\n")
