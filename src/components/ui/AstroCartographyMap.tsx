'use client'
// @refresh reset — Leaflet cannot reattach to a container React keeps across Fast Refresh.
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { interactiveTransition } from '@/lib/ui/transitions'
import { useTranslations } from 'next-intl'
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, ZoomControl, useMapEvents, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GrahaId, UserPlan } from '@/types/astrology'
import { NAKSHATRA_NAMES } from '@/types/astrology'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'
import { grahaName, nakshatraName } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { scoreLocation } from '@/lib/engine/acgProximity'
import { scoreLocationForChart, type AcgChartProfile } from '@/lib/engine/acgChartProfile'
import { localSpaceLine } from '@/lib/engine/acgRelocation'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { ACG_COLORS, ACG_GLYPHS, ACG_NAMES, ACG_PLANETS } from '@/components/ui/acgPalette'
import { AcgPlaceDrawer } from '@/components/ui/AcgPlaceDrawer'
import { AcgHeatmapLayer } from '@/components/ui/AcgHeatmapLayer'
import type {
  ACGDataBundle, ACGLineData, ACGNatalInfo, ACGParan, ACGPartner, ACGStarParan, ComparePoint, MapLayerId,
} from '@/components/ui/acgTypes'

const ESRI_CANVAS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
const ESRI_ATTRIBUTION = 'Powered by <a href="https://www.esri.com/">Esri</a> &middot; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
// Optional basemap override (e.g. a keyed Esri or CARTO URL). When set, it replaces the default
// Esri Canvas base and label layers. {z}/{x}/{y} placeholders as in Leaflet.
const CUSTOM_TILES = {
  light: process.env.NEXT_PUBLIC_ACG_TILE_URL_LIGHT,
  dark: process.env.NEXT_PUBLIC_ACG_TILE_URL_DARK,
  attribution: process.env.NEXT_PUBLIC_ACG_TILE_ATTRIBUTION,
}
const COLORS = ACG_COLORS
const GLYPHS = ACG_GLYPHS
const NAMES = ACG_NAMES
const PARTNER_COLOR = '#7c3aed'
const THEMES = [
  { id: 'all', icon: '🌌', planets: ACG_PLANETS },
  { id: 'wealth', icon: '💰', planets: ['Ju', 'Ve', 'Me'] },
  { id: 'love', icon: '❤️', planets: ['Ve', 'Mo'] },
  { id: 'career', icon: '🏆', planets: ['Su', 'Ma', 'Ju'] },
  { id: 'spirit', icon: '🧿', planets: ['Mo', 'Ju', 'Sa', 'Ke'] },
]
const ALL_PLANETS = ACG_PLANETS
const LAYERS: MapLayerId[] = ['heatmap', 'aspects', 'localSpace', 'paranBands', 'stars', 'partner']

interface Props {
  jd: number
  birthCoords?: [number, number]
  natal: ACGNatalInfo
  profile: AcgChartProfile | null
  userPlan: UserPlan
  partner?: ACGPartner | null
  focusPoint?: ComparePoint | null
  onDataChange?: (d: ACGDataBundle) => void
  onAddCompare?: (p: ComparePoint) => void
}

interface SelectedPlace { point: [number, number]; label?: string }

// ─── Sub-components ───────────────────────────────────────────────────────────

function CitySearch({ onSelect, isDark, isMobile }: { onSelect: (lat: number, lng: number, label: string) => void; isDark: boolean; isMobile: boolean }) {
  const tMap = useTranslations('acg.map')
  const [q, setQ] = useState('')
  const [results, setResults] = useState<{ name: string; admin1?: string; country?: string; latitude: number; longitude: number }[]>([])
  const [open, setOpen] = useState(false)
  const map = useMap()

  const search = async (val: string) => {
    setQ(val)
    if (val.length < 2) { setResults([]); return }
    try {
      const res = await fetch(`/api/atlas/search?q=${encodeURIComponent(val)}`)
      const json = await res.json()
      if (json.results) setResults(json.results)
    } catch { /* search is best effort */ }
  }

  const clear = () => { setQ(''); setResults([]); setOpen(false) }
  const panelBg  = isDark ? 'rgba(8,8,22,0.92)'     : 'rgba(255,255,255,0.96)'
  const inputBg  = isDark ? 'rgba(10,10,28,0.88)'   : 'rgba(255,255,255,0.94)'
  const textCol  = isDark ? '#f0f0f0'               : '#111'
  const hoverBg  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'

  return (
    <div style={{ position: 'absolute', top: isMobile ? 12 : 20, left: isMobile ? 12 : 20, zIndex: 1000, width: isMobile ? 'calc(100% - 80px)' : 320 }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', opacity: 0.45, pointerEvents: 'none' }}>🔍</span>
        <input
          value={q}
          onChange={e => search(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder={tMap('searchPlaceholder')}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '11px 36px 11px 38px', borderRadius: '14px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
            background: inputBg, color: textCol, fontSize: '0.875rem', outline: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(16px)',
          }}
        />
        {q && (
          <button onClick={clear} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.5, color: textCol, padding: 0, lineHeight: 1 }}>✕</button>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{ marginTop: 6, background: panelBg, borderRadius: 12, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, maxHeight: 220, overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)' }}>
          {results.map((r, i) => {
            const label = `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}${r.country ? `, ${r.country}` : ''}`
            return (
              <div
                key={i}
                onMouseDown={() => {
                  map.flyTo([r.latitude, r.longitude], 6, { animate: true, duration: 1.2 })
                  onSelect(r.latitude, r.longitude, label)
                  setOpen(false)
                  setQ(label)
                }}
                style={{ padding: '10px 16px', borderBottom: i < results.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none', cursor: 'pointer', fontSize: '0.82rem', color: isDark ? '#e0e0e0' : '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = hoverBg }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <span>{r.name}{r.admin1 ? `, ${r.admin1}` : ''}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.45 }}>{r.country}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { if (e?.latlng) onClick(e.latlng.lat, L.Util.wrapNum(e.latlng.lng, [-180, 180], true)) } })
  return null
}

function MapController({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => {
    mapRef.current = map
    // The container can change size after mount (sidebars, viewport); keep tiles in step.
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    // Leaflet can measure the container before layout settles; measure again once it has.
    const raf = requestAnimationFrame(() => map.invalidateSize())
    const late = setTimeout(() => map.invalidateSize(), 300)
    return () => { ro.disconnect(); cancelAnimationFrame(raf); clearTimeout(late); mapRef.current = null }
  }, [map, mapRef])
  return null
}

const getGlyphIcon = (glyph: string, color: string, ring = false) => L.divIcon({
  html: `<div style="color:${color};font-size:1.05rem;text-shadow:0 0 8px ${color}99,0 0 18px ${color}44;line-height:1;user-select:none;${ring ? `border:1.5px solid ${color};border-radius:50%;padding:2px 4px;background:rgba(124,58,237,0.12);` : ''}">${glyph}</div>`,
  className: 'acg-glyph-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const starIcon = L.divIcon({
  html: '<div style="color:#eab308;font-size:0.8rem;line-height:1;text-shadow:0 0 4px rgba(0,0,0,0.5);user-select:none;">✦</div>',
  className: 'acg-glyph-icon',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AstroCartographyMap({ jd: natalJd, birthCoords, natal, profile, userPlan, partner, focusPoint, onDataChange, onAddCompare }: Props) {
  const { lang } = useLang()
  const tMap = useTranslations('acg.map')
  const tLayers = useTranslations('acg.layers')
  const tThemes = useTranslations('acg.themes')
  const tPlanetThemes = useTranslations('acg.planetThemes')
  const planetLabel = (id: string) => grahaName(id as GrahaId, lang, NAMES[id] ?? id)
  const gold = planMeetsUiGate(userPlan, 'gold')
  const [natalData, setNatalData]     = useState<ACGLineData[]>([])
  const [transitData, setTransitData] = useState<ACGLineData[]>([])
  const [natalParans, setNatalParans] = useState<ACGParan[]>([])
  const [starParans, setStarParans]   = useState<ACGStarParan[]>([])
  const [loading, setLoading]         = useState(true)
  const [mapReady, setMapReady]       = useState(false)
  const [mapSessionKey]               = useState(() => `acg-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const [visiblePlanets, setVisiblePlanets] = useState<Set<GrahaId>>(new Set(['Su', 'Mo', 'Ju', 'Ve']))
  const [viewMode, setViewMode]       = useState<'natal' | 'transit' | 'both'>('natal')
  const [mapTheme, setMapTheme]       = useState<'dark' | 'light'>('light')
  const [showSidebar, setShowSidebar] = useState(false)
  const [selected, setSelected]       = useState<SelectedPlace | null>(null)
  const [isMobile, setIsMobile]       = useState(false)
  const [lineStyle, setLineStyle]     = useState<'vivid' | 'subtle'>('vivid')
  const [activeTheme, setActiveTheme] = useState('all')
  const [layers, setLayers]           = useState<Set<MapLayerId>>(new Set(['partner']))
  const mapRef = useRef<L.Map | null>(null)
  const birthLat = birthCoords?.[0]
  const birthLng = birthCoords?.[1]

  useEffect(() => { setMapReady(true) }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const sync = () => {
      const t = document.documentElement.getAttribute('data-theme') || 'classic'
      setMapTheme(t === 'dark' ? 'dark' : 'light')
    }
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  // ── Propagate data up ──
  useEffect(() => {
    onDataChange?.({
      visible: visiblePlanets,
      parans: natalParans.filter(p => visiblePlanets.has(p.p1) && visiblePlanets.has(p.p2)),
      starParans: starParans.filter(p => visiblePlanets.has(p.grahaId)),
      natal: natalData,
    })
  }, [visiblePlanets, natalParans, starParans, natalData, onDataChange])

  // ── Data fetch: natal lines, then transits drawn in the natal frame (cyclocartography) ──
  const lastFetch = useRef('')
  useEffect(() => {
    const key = `${natalJd}-${birthLat}-${birthLng}`
    if (lastFetch.current === key) return
    async function fetchAll() {
      setLoading(true)
      try {
        const hasCoords = birthLat !== undefined && birthLng !== undefined
        const coords = hasCoords ? `&lat=${birthLat}&lng=${birthLng}` : ''
        const nJson = await (await fetch(`/api/chart/astrocartography?jd=${natalJd}${coords}&stars=1`)).json()
        if (nJson.success) { setNatalData(nJson.lines); setNatalParans(nJson.parans); setStarParans(nJson.starParans ?? []) }
        const transitJd = (Date.now() / 86400000) + 2440587.5
        const tJson = await (await fetch(`/api/chart/astrocartography?jd=${transitJd}&frameJd=${natalJd}`)).json()
        if (tJson.success) setTransitData(tJson.lines)
        lastFetch.current = key
      } catch { /* the loader stays until a retry */ }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [natalJd, birthLat, birthLng])

  // ── Fly to a place picked elsewhere (compare list) ──
  useEffect(() => {
    if (!focusPoint) return
    mapRef.current?.flyTo([focusPoint.lat, focusPoint.lng], 5, { animate: true, duration: 1.2 })
    setSelected({ point: [focusPoint.lat, focusPoint.lng], label: focusPoint.label })
  }, [focusPoint])

  const handleMapClick = useCallback((lat: number, lng: number, label?: string) => {
    setSelected({ point: [lat, lng], label })
  }, [])

  const togglePlanet = useCallback((id: GrahaId) => {
    setActiveTheme('custom')
    setVisiblePlanets(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }, [])

  const applyTheme = useCallback((t: typeof THEMES[0]) => {
    setActiveTheme(t.id)
    setVisiblePlanets(new Set(t.planets as GrahaId[]))
  }, [])

  const focusDasha = useCallback(() => {
    if (!profile) return
    const ids = [profile.mahaLord, profile.antarLord].filter(Boolean) as GrahaId[]
    if (ids.length === 0) return
    setActiveTheme('dasha')
    setVisiblePlanets(new Set(ids))
  }, [profile])

  const toggleLayer = (id: MapLayerId) => setLayers(prev => {
    const n = new Set(prev)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  const isDark   = mapTheme === 'dark'
  const opacity  = lineStyle === 'vivid' ? 0.9 : 0.45
  const panelBg  = isDark ? 'rgba(8,8,22,0.94)'     : 'rgba(255,255,255,0.97)'
  const panelBdr = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'
  const showMap  = mapReady && !loading
  const drawerLines = viewMode === 'transit' ? transitData : natalData
  const visibleParans = (viewMode === 'transit' ? [] : natalParans).filter(p => visiblePlanets.has(p.p1) && visiblePlanets.has(p.p2))
  // On the map, only crossings on the graha's own meridian lines: beads along MC/IC that stay readable.
  // The Crossings tab lists the rest.
  const visibleStarParans = layers.has('stars') && viewMode !== 'transit'
    ? starParans.filter(p => visiblePlanets.has(p.grahaId) && p.meridian === 'graha' && Math.abs(p.lat) <= 66)
    : []
  const dashaWeight = (id: GrahaId) => {
    const role = profile?.grahas[id]?.dashaRole
    return role === 'maha' || role === 'both' ? 1.6 : role === 'antar' ? 1.3 : 1
  }

  // Heatmap score: chart-weighted (signed) for Gold, raw activation otherwise.
  const heatmapScore = useMemo(() => {
    const vis = visiblePlanets
    if (gold && profile) return (lat: number, lng: number) => scoreLocationForChart(lat, lng, natalData, [], profile, { grahas: vis }).net
    return (lat: number, lng: number) => scoreLocation(lat, lng, natalData, [], { grahas: vis }).score
  }, [gold, profile, natalData, visiblePlanets])
  const heatmapKey = `${natalData.length}-${[...visiblePlanets].sort().join('')}-${gold && profile ? 'w' : 'n'}`

  const localSpace = useMemo(() => {
    if (!layers.has('localSpace') || birthLat === undefined || birthLng === undefined) return []
    return natalData.filter(p => visiblePlanets.has(p.grahaId)).map(p => ({ id: p.grahaId, segs: localSpaceLine(birthLat, birthLng, p.localSpaceBearing) }))
  }, [layers, birthLat, birthLng, natalData, visiblePlanets])

  const sidebarDashaChip = (id: GrahaId) => {
    const role = profile?.grahas[id]?.dashaRole
    if (!role) return null
    return (
      <span style={{ fontSize: '0.52rem', fontWeight: 800, padding: '1px 5px', borderRadius: 6, background: '#7c3aed22', color: '#7c3aed', flexShrink: 0 }}>
        {role === 'antar' ? tMap('adShort') : tMap('mdShort')}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* ── Top Control Bar ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.875rem', background: 'var(--surface-0)', borderBottom: '1px solid var(--border-soft)', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '3px', background: 'var(--surface-2)', padding: '3px', borderRadius: '10px', flexShrink: 0 }}>
          {(['natal', 'transit', 'both'] as const).map(m => {
            const active = viewMode === m
            const activeColor = m === 'natal' ? 'var(--gold)' : m === 'transit' ? '#22c55e' : '#3b82f6'
            return (
              <button key={m} onClick={() => setViewMode(m)} aria-pressed={active} style={{
                background: active ? activeColor : 'transparent', border: 'none',
                padding: '4px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.72rem',
                fontWeight: 700, color: active ? '#000' : 'var(--text-muted)', transition: interactiveTransition('0.2s'),
              }}>
                {tMap(m === 'both' ? 'overlay' : m)}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', flex: 1, justifyContent: 'center' }}>
          {profile && (profile.mahaLord || profile.antarLord) && (
            <button onClick={focusDasha} title={tMap('dashaFocusTitle')} style={{
              padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700,
              background: activeTheme === 'dasha' ? '#7c3aed22' : 'transparent',
              border: `1px solid ${activeTheme === 'dasha' ? '#7c3aed' : 'var(--border)'}`,
              color: activeTheme === 'dasha' ? '#7c3aed' : 'var(--text-muted)',
              cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              <span>⏳</span><span>{tMap('dashaFocus')}</span>
            </button>
          )}
          {THEMES.map(theme => {
            const active = activeTheme === theme.id
            return (
              <button key={theme.id} onClick={() => applyTheme(theme)} style={{
                padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700,
                background: active ? 'var(--gold-faint)' : 'transparent',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                color: active ? 'var(--gold)' : 'var(--text-muted)',
                cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', gap: '4px', alignItems: 'center', transition: interactiveTransition('0.2s'),
              }}>
                <span>{theme.icon}</span><span>{tThemes(theme.id)}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setLineStyle(s => s === 'vivid' ? 'subtle' : 'vivid')}
          title={tMap('lineOpacityTitle')}
          style={{ padding: '4px 11px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {lineStyle === 'vivid' ? tMap('vivid') : tMap('subtle')}
        </button>
      </div>

      {/* ── Map + Overlays ──────────────────────────────────────── */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {isMobile && (
          <button
            onClick={() => setShowSidebar(s => !s)}
            aria-label={tMap('layersTitle')}
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 1100, background: 'var(--gold)', border: 'none', borderRadius: '12px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', cursor: 'pointer', fontSize: '1.3rem' }}
          >
            {showSidebar ? '✕' : '🪐'}
          </button>
        )}

        {/* ── Planet Sidebar ── */}
        <div style={{
          position: 'absolute', top: isMobile ? 12 : 14, right: isMobile ? (showSidebar ? 12 : -230) : 14, zIndex: 1000,
          background: panelBg, backdropFilter: 'blur(20px)', borderRadius: '20px', border: `1px solid ${panelBdr}`, width: 215,
          maxHeight: isMobile ? 'calc(100% - 140px)' : 'calc(100% - 32px)', overflowY: 'auto',
          transition: 'right 0.4s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.7)' : '0 12px 40px rgba(0,0,0,0.15)',
        }}>
          <div style={{ padding: '0.875rem 1rem 0.5rem', borderBottom: `1px solid ${panelBdr}` }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{tMap('layersTitle')}</div>
            <div style={{ fontSize: '0.68rem', color: isDark ? '#777' : '#999', marginTop: '2px' }}>{tMap('activeCount', { n: visiblePlanets.size, total: ALL_PLANETS.length })}</div>
          </div>

          <div style={{ padding: '0.45rem 1rem', borderBottom: `1px solid ${panelBdr}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 0' }}>
            {[
              { type: 'MC', desc: 'midheaven', dash: false },
              { type: 'IC', desc: 'nadir', dash: true },
              { type: 'AS', desc: 'ascendant', dash: false },
              { type: 'DS', desc: 'descendant', dash: true },
            ].map(({ type, desc, dash }) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.6rem', color: isDark ? '#777' : '#aaa' }}>
                <svg width="18" height="6" viewBox="0 0 18 6" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="3" x2="18" y2="3" stroke={isDark ? '#888' : '#bbb'} strokeWidth="1.5" strokeDasharray={dash ? '4 3' : undefined} />
                </svg>
                <span style={{ fontWeight: 700 }}>{type}</span>
                <span style={{ opacity: 0.7 }}>{tMap(desc)}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '0.4rem 0.5rem' }}>
            {ALL_PLANETS.map(id => {
              const active = visiblePlanets.has(id)
              return (
                <button
                  key={id}
                  onClick={() => togglePlanet(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    background: active ? `${COLORS[id]}12` : 'transparent',
                    border: `1px solid ${active ? COLORS[id] + '35' : 'transparent'}`,
                    cursor: 'pointer', padding: '6px 9px', borderRadius: '10px',
                    width: '100%', marginBottom: '2px', textAlign: 'left',
                    color: active ? (isDark ? '#f0f0f0' : '#111') : (isDark ? '#4a4a5a' : '#bbb'),
                    transition: interactiveTransition('0.18s ease'),
                  }}
                >
                  <span style={{ fontSize: '1.2rem', color: active ? COLORS[id] : (isDark ? '#3a3a4a' : '#ddd'), filter: active ? `drop-shadow(0 0 5px ${COLORS[id]}80)` : 'none', lineHeight: 1, flexShrink: 0 }}>
                    {GLYPHS[id]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: active ? 700 : 400 }}>{planetLabel(id)}</div>
                    {active && <div style={{ fontSize: '0.58rem', color: COLORS[id], opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tPlanetThemes(id)}</div>}
                  </div>
                  {sidebarDashaChip(id)}
                  {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[id], flexShrink: 0, boxShadow: `0 0 6px ${COLORS[id]}` }} />}
                </button>
              )
            })}
          </div>

          {/* Extra layers */}
          <div style={{ padding: '0.5rem 0.75rem', borderTop: `1px solid ${panelBdr}` }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{tLayers('title')}</div>
            {LAYERS.filter(id => id !== 'partner' || partner).map(id => (
              <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: isDark ? '#ccc' : '#444', padding: '3px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={layers.has(id)} onChange={() => toggleLayer(id)} />
                <span>{tLayers(id)}</span>
              </label>
            ))}
          </div>

          {birthCoords && (
            <div style={{ padding: '0.5rem', borderTop: `1px solid ${panelBdr}` }}>
              <button
                onClick={() => mapRef.current?.flyTo(birthCoords, 4, { animate: true, duration: 1.5 })}
                style={{ width: '100%', padding: '8px', borderRadius: '10px', background: 'var(--gold-faint)', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {tMap('flyToBirth')}
              </button>
            </div>
          )}
        </div>

        {/* ── Place drawer ── */}
        {selected && (
          <AcgPlaceDrawer
            point={selected.point}
            label={selected.label}
            natalJd={natalJd}
            lines={drawerLines}
            visible={visiblePlanets}
            natal={natal}
            profile={profile}
            userPlan={userPlan}
            isDark={isDark}
            isMobile={isMobile}
            onClose={() => setSelected(null)}
            onAddCompare={onAddCompare}
          />
        )}

        {!showMap && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1200, background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <VedaanshLoader size={48} message={tMap('loading')} />
          </div>
        )}

        {showMap && (
        <MapContainer key={mapSessionKey} center={birthCoords ?? [20, 0]} zoom={2} zoomControl={false} worldCopyJump style={{ height: '100%', width: '100%' }}>
          <MapController mapRef={mapRef} />
          <CitySearch onSelect={handleMapClick} isDark={isDark} isMobile={isMobile} />
          <ClickHandler onClick={handleMapClick} />
          <ZoomControl position="bottomright" />

          {CUSTOM_TILES.light ? (
            <TileLayer
              url={(isDark ? CUSTOM_TILES.dark : undefined) ?? CUSTOM_TILES.light}
              attribution={CUSTOM_TILES.attribution ?? ''}
            />
          ) : (
            <>
              {/* Esri Canvas basemap: keyless, light and dark variants. CARTO now watermarks keyless tiles. */}
              <TileLayer
                url={`${ESRI_CANVAS}/${isDark ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'}/MapServer/tile/{z}/{y}/{x}`}
                maxNativeZoom={16}
                attribution={ESRI_ATTRIBUTION}
              />
              <TileLayer
                url={`${ESRI_CANVAS}/${isDark ? 'World_Dark_Gray_Reference' : 'World_Light_Gray_Reference'}/MapServer/tile/{z}/{y}/{x}`}
                maxNativeZoom={16}
              />
            </>
          )}

          {layers.has('heatmap') && natalData.length > 0 && (
            <AcgHeatmapLayer score={heatmapScore} signed={gold && !!profile} depsKey={heatmapKey} />
          )}

          {/* ── Natal Lines (current dasha lords drawn heavier) ── */}
          {(viewMode === 'natal' || viewMode === 'both') && natalData.filter(p => visiblePlanets.has(p.grahaId)).map(p => {
            const w = dashaWeight(p.grahaId)
            return (
              <React.Fragment key={`n-${p.grahaId}`}>
                <Polyline positions={[[-85, p.mcLine], [85, p.mcLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: 2.5 * w, opacity }}>
                  <Tooltip sticky className="acg-tt">{tMap('tooltipMc', { glyph: GLYPHS[p.grahaId], planet: planetLabel(p.grahaId) })}</Tooltip>
                </Polyline>
                <Polyline positions={[[-85, p.icLine], [85, p.icLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5 * w, opacity: opacity * 0.65, dashArray: '7 11' }}>
                  <Tooltip sticky className="acg-tt">{tMap('tooltipIc', { glyph: GLYPHS[p.grahaId], planet: planetLabel(p.grahaId) })}</Tooltip>
                </Polyline>
                {p.asCurve.map((seg, i) => (
                  <Polyline key={`as-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight: 2.5 * w, opacity }}>
                    {i === 0 && <Tooltip sticky className="acg-tt">{tMap('tooltipAs', { glyph: GLYPHS[p.grahaId], planet: planetLabel(p.grahaId) })}</Tooltip>}
                  </Polyline>
                ))}
                {p.dsCurve.map((seg, i) => (
                  <Polyline key={`ds-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5 * w, opacity: opacity * 0.65, dashArray: '5 9' }}>
                    {i === 0 && <Tooltip sticky className="acg-tt">{tMap('tooltipDs', { glyph: GLYPHS[p.grahaId], planet: planetLabel(p.grahaId) })}</Tooltip>}
                  </Polyline>
                ))}
                {layers.has('aspects') && p.aspects.map((a, i) => (
                  <Polyline key={`asp-${i}`} positions={[[-85, a.lon], [85, a.lon]]} pathOptions={{ color: COLORS[p.grahaId], weight: 1.2, opacity: opacity * 0.5, dashArray: '1 6' }}>
                    <Tooltip sticky className="acg-tt">{tLayers('drishtiTooltip', { planet: planetLabel(p.grahaId), n: a.house })}</Tooltip>
                  </Polyline>
                ))}
                <Marker position={[73, p.mcLine]} icon={getGlyphIcon(GLYPHS[p.grahaId], COLORS[p.grahaId], w > 1)} />
              </React.Fragment>
            )
          })}

          {/* ── Transit lines (cyclocartography: today's sky in the natal frame) ── */}
          {(viewMode === 'transit' || viewMode === 'both') && transitData.filter(p => visiblePlanets.has(p.grahaId)).map(p => (
            <React.Fragment key={`t-${p.grahaId}`}>
              <Polyline positions={[[-85, p.mcLine], [85, p.mcLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5, opacity: opacity * 0.55, dashArray: '10 16' }}>
                <Tooltip sticky className="acg-tt">{tMap('transitMc', { planet: planetLabel(p.grahaId) })}</Tooltip>
              </Polyline>
              <Polyline positions={[[-85, p.icLine], [85, p.icLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: 1, opacity: opacity * 0.4, dashArray: '4 14' }}>
                <Tooltip sticky className="acg-tt">{tMap('transitIc', { planet: planetLabel(p.grahaId) })}</Tooltip>
              </Polyline>
              {p.asCurve.map((seg, i) => (
                <Polyline key={`tas-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5, opacity: opacity * 0.55, dashArray: '10 16' }}>
                  {i === 0 && <Tooltip sticky className="acg-tt">{tMap('transitAs', { planet: planetLabel(p.grahaId) })}</Tooltip>}
                </Polyline>
              ))}
              {p.dsCurve.map((seg, i) => (
                <Polyline key={`tds-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight: 1, opacity: opacity * 0.4, dashArray: '4 14' }}>
                  {i === 0 && <Tooltip sticky className="acg-tt">{tMap('transitDs', { planet: planetLabel(p.grahaId) })}</Tooltip>}
                </Polyline>
              ))}
            </React.Fragment>
          ))}

          {/* ── Partner lines ── */}
          {partner && layers.has('partner') && partner.lines.filter(p => visiblePlanets.has(p.grahaId)).map(p => (
            <React.Fragment key={`p-${p.grahaId}`}>
              <Polyline positions={[[-85, p.mcLine], [85, p.mcLine]]} pathOptions={{ color: PARTNER_COLOR, weight: 2, opacity: opacity * 0.8, dashArray: '2 6' }}>
                <Tooltip sticky className="acg-tt">{tMap('partnerLine', { name: partner.name, planet: planetLabel(p.grahaId), line: 'MC' })}</Tooltip>
              </Polyline>
              <Polyline positions={[[-85, p.icLine], [85, p.icLine]]} pathOptions={{ color: PARTNER_COLOR, weight: 1.2, opacity: opacity * 0.55, dashArray: '2 6' }}>
                <Tooltip sticky className="acg-tt">{tMap('partnerLine', { name: partner.name, planet: planetLabel(p.grahaId), line: 'IC' })}</Tooltip>
              </Polyline>
              {p.asCurve.map((seg, i) => (
                <Polyline key={`pas-${i}`} positions={seg} pathOptions={{ color: PARTNER_COLOR, weight: 2, opacity: opacity * 0.8, dashArray: '2 6' }}>
                  {i === 0 && <Tooltip sticky className="acg-tt">{tMap('partnerLine', { name: partner.name, planet: planetLabel(p.grahaId), line: 'AS' })}</Tooltip>}
                </Polyline>
              ))}
              {p.dsCurve.map((seg, i) => (
                <Polyline key={`pds-${i}`} positions={seg} pathOptions={{ color: PARTNER_COLOR, weight: 1.2, opacity: opacity * 0.55, dashArray: '2 6' }}>
                  {i === 0 && <Tooltip sticky className="acg-tt">{tMap('partnerLine', { name: partner.name, planet: planetLabel(p.grahaId), line: 'DS' })}</Tooltip>}
                </Polyline>
              ))}
              <Marker position={[69, p.mcLine]} icon={getGlyphIcon(GLYPHS[p.grahaId], PARTNER_COLOR)} />
            </React.Fragment>
          ))}

          {/* ── Local space lines from the birth place ── */}
          {localSpace.map(ls => ls.segs.map((seg, i) => (
            <Polyline key={`ls-${ls.id}-${i}`} positions={seg} pathOptions={{ color: COLORS[ls.id], weight: 1.5, opacity: opacity * 0.7, dashArray: '12 4 2 4' }}>
              {i === 0 && <Tooltip sticky className="acg-tt">{tLayers('localSpaceTooltip', { planet: planetLabel(ls.id) })}</Tooltip>}
            </Polyline>
          )))}

          {/* ── Paran latitude bands ── */}
          {layers.has('paranBands') && visibleParans.map((pa, i) => (
            <Polyline key={`pb-${i}`} positions={[[pa.lat, -180], [pa.lat, 180]]} pathOptions={{ color: COLORS[pa.p2], weight: 1, opacity: opacity * 0.4, dashArray: '2 8' }}>
              <Tooltip sticky className="acg-tt">{tLayers('bandTooltip', { p1: planetLabel(pa.p1), p2: planetLabel(pa.p2) })}</Tooltip>
            </Polyline>
          ))}

          {/* ── Paran crossings ── */}
          {visibleParans.map((pa, i) => (
            <CircleMarker key={`pa-${i}`} center={[pa.lat, pa.lon]} radius={4} pathOptions={{ color: COLORS[pa.p1], fillColor: COLORS[pa.p2], fillOpacity: 0.9, weight: 2 }}>
              <Tooltip className="acg-tt">{tMap('paranTooltip', { p1: planetLabel(pa.p1), a1: pa.angle1, p2: planetLabel(pa.p2), a2: pa.angle2 })}</Tooltip>
            </CircleMarker>
          ))}

          {/* ── Yogatara parans ── */}
          {visibleStarParans.map((s, i) => (
            <Marker key={`sp-${i}`} position={[s.lat, s.lon]} icon={starIcon}>
              <Tooltip className="acg-tt">
                {tLayers(s.meridian === 'graha' ? 'starParanGraha' : 'starParanStar', {
                  planet: planetLabel(s.grahaId), a1: s.angle1, a2: s.angle2,
                  nakshatra: nakshatraName(s.nakshatraIndex, lang, NAKSHATRA_NAMES[s.nakshatraIndex] ?? ''), star: s.star,
                })}
              </Tooltip>
            </Marker>
          ))}

          {birthCoords && (
            <CircleMarker center={birthCoords} radius={7} pathOptions={{ color: '#FFD700', fillColor: '#fff', fillOpacity: 1, weight: 2.5 }}>
              <Tooltip direction="top" permanent className="acg-tt acg-tt-birth">{tMap('birth')}</Tooltip>
            </CircleMarker>
          )}

          {selected && (
            <CircleMarker center={selected.point} radius={6} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.85, weight: 2 }}>
              <Tooltip direction="top" permanent className="acg-tt acg-tt-sel">{tMap('selected')}</Tooltip>
            </CircleMarker>
          )}
        </MapContainer>
        )}

        {showMap && !selected && (
        <div style={{
          position: 'absolute', bottom: isMobile ? 6 : 10, left: '50%', transform: 'translateX(-50%)', zIndex: 900, pointerEvents: 'none',
          background: isDark ? 'rgba(6,6,18,0.82)' : 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)',
          padding: '5px 14px', borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.62rem', color: isDark ? '#aaa' : '#777', whiteSpace: 'nowrap',
        }}>
          {[
            { key: 'legendMc', dash: false, w: 2.5 },
            { key: 'legendIc', dash: true, w: 1.5 },
            { key: 'legendAs', dash: false, w: 2.5 },
            { key: 'legendDs', dash: true, w: 1.5 },
          ].map(({ key, dash, w }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="18" height="8" viewBox="0 0 18 8">
                <line x1="0" y1="4" x2="18" y2="4" stroke={isDark ? '#aaa' : '#777'} strokeWidth={w} strokeDasharray={dash ? '4 3' : undefined} />
              </svg>
              <span>{tMap(key)}</span>
            </div>
          ))}
        </div>
        )}

        {/* What transit mode draws */}
        {showMap && viewMode !== 'natal' && (
          <div style={{
            position: 'absolute', top: isMobile ? 64 : 72, left: isMobile ? 12 : 20, zIndex: 900, maxWidth: isMobile ? 'calc(100% - 80px)' : 320,
            background: isDark ? 'rgba(6,6,18,0.85)' : 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '6px 10px',
            fontSize: '0.64rem', lineHeight: 1.45, color: isDark ? '#bbb' : '#555', border: '1px solid #22c55e55', pointerEvents: 'none',
          }}>
            {tMap('transitHint')}
          </div>
        )}
      </div>

      <style>{`
        .acg-tt {
          font-size: 0.76rem !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
          padding: 4px 10px !important;
          white-space: nowrap !important;
          border: none !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25) !important;
        }
        .acg-tt-birth, .acg-tt-sel {
          font-size: 0.65rem !important;
          padding: 2px 7px !important;
          font-weight: 700 !important;
        }
        .acg-glyph-icon {
          background: none !important;
          border: none !important;
        }
        .acg-heatmap { pointer-events: none; }
      `}</style>
    </div>
  )
}
