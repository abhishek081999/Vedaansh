'use client'
// ─────────────────────────────────────────────────────────────
//  AcgPlaceDrawer.tsx
//  What a clicked place means for this chart: relocated lagna and
//  houses, lines in orb read through the chart, when they switch on
//  (dasha and transits) and a solar return cast for the place.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import { grahaName, rashiName } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { getAcgInterpretation } from '@/lib/engine/astroInterpretation'
import { linesNear, nearestLine, type ACGLineHit } from '@/lib/engine/acgProximity'
import { buildRelocatedChart } from '@/lib/engine/acgRelocation'
import { dashaWindowsFor, digBalaAt, lineFavor, type AcgChartProfile, type AcgNature } from '@/lib/engine/acgChartProfile'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Link } from '@/i18n/navigation'
import { ACG_COLORS as COLORS, ACG_GLYPHS as GLYPHS, ACG_NAMES as NAMES } from '@/components/ui/acgPalette'
import type { ACGLineData, ACGNatalInfo, ComparePoint } from '@/components/ui/acgTypes'

interface RelocateResult { relocatedAsc: number; relocatedMc?: number }
interface TransitWindow { grahaId: GrahaId; angle: string; start: string; end: string; peak: string; minKm: number }
interface SolarReturn { ascRashi: Rashi; munthaRashi: number; sunHouse: number }

export const NATURE_COLOR: Record<AcgNature, string> = {
  yogakaraka: '#d4a017', benefic: '#16a34a', mixed: '#64748b', malefic: '#dc2626',
}

interface Props {
  point: [number, number]
  label?: string
  natalJd: number
  lines: ACGLineData[]
  visible: ReadonlySet<GrahaId>
  natal: ACGNatalInfo
  profile: AcgChartProfile | null
  userPlan: UserPlan
  isDark: boolean
  isMobile: boolean
  onClose: () => void
  onAddCompare?: (p: ComparePoint) => void
}

export function AcgPlaceDrawer({ point, label, natalJd, lines, visible, natal, profile, userPlan, isDark, isMobile, onClose, onAddCompare }: Props) {
  const { lang, tag } = useLang()
  const t = useTranslations('acg.drawer')
  const tMap = useTranslations('acg.map')
  const tNature = useTranslations('acg.nature')
  const tCoords = useTranslations('acg.coords')
  const gold = planMeetsUiGate(userPlan, 'gold')
  const [lat, lng] = point
  const planetLabel = (id: string) => grahaName(id as GrahaId, lang, NAMES[id] ?? id)
  const rashiLabel = (r: Rashi) => rashiName(r, lang, RASHI_NAMES[r] ?? '—')
  const fmtKm = (km: number) => Math.round(km).toLocaleString(tag)
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(tag, { month: 'short', year: 'numeric' })

  const [reloc, setReloc] = useState<RelocateResult | null>(null)
  const [transits, setTransits] = useState<TransitWindow[] | null>(null)
  const [transitState, setTransitState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [sr, setSr] = useState<SolarReturn | null>(null)
  const [srState, setSrState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [added, setAdded] = useState(false)

  // Relocated lagna for the place.
  useEffect(() => {
    let live = true
    setReloc(null); setTransits(null); setTransitState('idle'); setSr(null); setSrState('idle'); setAdded(false)
    fetch('/api/chart/relocate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jd: natalJd, lat, lng }),
    }).then(r => r.json()).then(j => { if (live && j.success) setReloc(j) }).catch(() => {})
    return () => { live = false }
  }, [natalJd, lat, lng])

  const relocated = useMemo(() => reloc
    ? buildRelocatedChart(reloc.relocatedAsc, natal.ayanamsha, natal.ascRashi, natal.grahas, reloc.relocatedMc)
    : null, [reloc, natal])

  const nearby: ACGLineHit[] = useMemo(() => linesNear(lat, lng, lines, { grahas: visible }).slice(0, 5), [lat, lng, lines, visible])
  const nearest = nearby[0] ?? nearestLine(lat, lng, lines, visible)
  const nearestInterp = nearest ? getAcgInterpretation(nearest.grahaId, nearest.angle, lang) : null
  const windows = useMemo(
    () => (profile && gold && nearby.length ? dashaWindowsFor(nearby.map(h => h.grahaId), profile, { limit: 4 }) : []),
    [profile, gold, nearby],
  )

  const loadTransits = async () => {
    setTransitState('loading')
    try {
      const j = await (await fetch(`/api/chart/acg-transits?natalJd=${natalJd}&lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}&years=3`)).json()
      if (!j.success) throw new Error()
      setTransits(j.windows); setTransitState('idle')
    } catch { setTransitState('error') }
  }

  const loadSolarReturn = async () => {
    if (natal.sunSidereal === undefined) return
    setSrState('loading')
    try {
      const now = new Date()
      const thisYear = now.getFullYear()
      const birthMonthDay = natal.birthDate.slice(5)
      const year = `${thisYear}-${birthMonthDay}` < now.toISOString().slice(0, 10) ? thisYear + 1 : thisYear
      const j = await (await fetch('/api/chart/varshaphal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          natalSunSidereal: natal.sunSidereal, returnYear: year, latitude: lat, longitude: lng,
          timezone: 'UTC', birthPlace: label ?? `${lat.toFixed(2)}, ${lng.toFixed(2)}`, settings: natal.settings,
          natalName: natal.name, birthDate: natal.birthDate, natalAscRashi: natal.ascRashi,
        }),
      })).json()
      if (!j.success) throw new Error()
      const asc = j.chart.lagnas.ascRashi as Rashi
      const sun = j.chart.grahas.find((g: { id: string }) => g.id === 'Su')
      setSr({ ascRashi: asc, munthaRashi: j.meta.munthaRashi, sunHouse: sun ? ((sun.rashi - asc + 12) % 12) + 1 : 0 })
      setSrState('idle')
    } catch { setSrState('error') }
  }

  const sub = isDark ? '#8a8a9a' : '#888'
  const text = isDark ? '#ddd' : '#333'
  const box = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  const sectionLabel: React.CSSProperties = { fontSize: '0.55rem', color: sub, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }
  const chip = (c: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: `${c}14`, border: `1px solid ${c}30`, fontSize: '0.64rem', fontWeight: 700, color: text })
  const button: React.CSSProperties = { padding: '6px 10px', borderRadius: 9, border: '1px solid var(--gold)', background: 'var(--gold-faint)', color: 'var(--gold)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }

  const natureChip = (id: GrahaId, angle: ACGLineHit['angle']) => {
    if (!profile || !gold) return null
    const p = profile.grahas[id]
    if (!p) return null
    const f = lineFavor(profile, id, angle)
    const nat: AcgNature = p.nature === 'yogakaraka' ? 'yogakaraka' : f >= 0.35 ? 'benefic' : f <= -0.25 ? 'malefic' : 'mixed'
    return <span style={{ ...chip(NATURE_COLOR[nat]), color: NATURE_COLOR[nat] }}>{tNature(nat)}</span>
  }
  const digChip = (id: GrahaId, angle: ACGLineHit['angle']) => {
    const d = digBalaAt(id, angle)
    if (!d) return null
    const c = d === 'full' ? '#0e7490' : '#9a3412'
    return <span title={t(d === 'full' ? 'digFullHint' : 'digNoneHint')} style={{ ...chip(c), color: c }}>{t(d === 'full' ? 'digFull' : 'digNone')}</span>
  }
  const dashaChip = (id: GrahaId) => {
    const role = profile?.grahas[id]?.dashaRole
    if (!role) return null
    return <span style={{ ...chip('#7c3aed'), color: '#7c3aed' }}>{t(role === 'antar' ? 'antarNow' : 'mahaNow')}</span>
  }

  return (
    <div style={{
      position: 'absolute', bottom: isMobile ? 0 : 18, left: isMobile ? 0 : 18, right: isMobile ? 0 : 'auto', zIndex: 1100,
      background: isDark ? 'rgba(6,6,18,0.97)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', padding: '1.1rem',
      borderRadius: isMobile ? '20px 20px 0 0' : '18px', border: `1px solid ${nearest ? COLORS[nearest.grahaId] + '40' : 'var(--border)'}`,
      width: isMobile ? '100%' : 380, maxHeight: isMobile ? '70%' : 'calc(100% - 36px)', overflowY: 'auto', boxSizing: 'border-box',
      boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
    }}>
      <button onClick={onClose} aria-label={t('close')} style={{ position: 'absolute', top: 11, right: 11, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: '0.72rem', color: sub }}>✕</button>

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.75rem', paddingRight: 28 }}>
        {nearest && (
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${COLORS[nearest.grahaId]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: COLORS[nearest.grahaId], flexShrink: 0 }}>
            {GLYPHS[nearest.grahaId]}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.975rem', color: isDark ? '#fff' : '#111' }}>
            {relocated ? tMap('rising', { rashi: rashiLabel(relocated.ascRashi) }) : t('loading')}
          </div>
          {label && <div style={{ fontSize: '0.68rem', color: sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>}
          {nearest && (
            <div style={{ fontSize: '0.68rem', color: COLORS[nearest.grahaId], fontWeight: 700, marginTop: 1 }}>
              {tMap('nearest', { planet: planetLabel(nearest.grahaId), line: nearest.angle, km: fmtKm(nearest.km) })}
            </div>
          )}
        </div>
      </div>

      {nearestInterp && (
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.76rem', color: isDark ? '#c8c8c8' : '#555', lineHeight: 1.55, background: box, padding: '0.625rem 0.75rem', borderRadius: 10, border: `1px solid ${nearest ? COLORS[nearest.grahaId] + '30' : 'var(--border)'}` }}>
          {nearestInterp}
        </p>
      )}

      {/* Lines in orb, read through the chart */}
      {nearby.length > 0 ? (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={sectionLabel}>{tMap('nearbyTitle')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {nearby.map(h => (
              <div key={`${h.grahaId}-${h.angle}`} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: '0.7rem', color: text }}>
                <span style={{ color: COLORS[h.grahaId] }}>{GLYPHS[h.grahaId]}</span>
                <b>{planetLabel(h.grahaId)} {h.angle}</b>
                <span style={{ color: sub }}>{tMap('km', { km: fmtKm(h.km) })}</span>
                {natureChip(h.grahaId, h.angle)}
                {digChip(h.grahaId, h.angle)}
                {dashaChip(h.grahaId)}
              </div>
            ))}
          </div>
        </div>
      ) : nearest ? (
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.68rem', color: sub }}>{tMap('noneInOrb')}</p>
      ) : null}

      {gold ? (
        <>
          {/* Relocated chart */}
          {relocated && (
            <div style={{ marginBottom: '0.75rem', background: box, borderRadius: 10, padding: '0.6rem 0.7rem' }}>
              <div style={sectionLabel}>{t('relocatedTitle')}</div>
              <div style={{ fontSize: '0.7rem', color: text, lineHeight: 1.6 }}>
                {t('vargaLagnas', { d9: rashiLabel(relocated.d9Lagna), d10: rashiLabel(relocated.d10Lagna) })}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {relocated.grahas.filter(g => COLORS[g.grahaId]).map(g => (
                  <span key={g.grahaId} title={t('houseShift', { from: g.natalHouse, to: g.house })} style={{ ...chip(COLORS[g.grahaId]), fontWeight: g.house === g.natalHouse ? 500 : 800 }}>
                    <span style={{ color: COLORS[g.grahaId] }}>{GLYPHS[g.grahaId]}</span>
                    {g.natalHouse === g.house ? t('house', { h: g.house }) : t('houseShiftShort', { from: g.natalHouse, to: g.house })}
                    {g.nearAngle && <span style={{ color: 'var(--gold)' }}>· {g.nearAngle}</span>}
                  </span>
                ))}
              </div>
              {relocated.kendra.length > 0 && (
                <div style={{ fontSize: '0.66rem', color: sub, marginTop: 6 }}>
                  {t('kendra', { list: relocated.kendra.map(planetLabel).join(', ') })}
                  {relocated.leftKendra.length > 0 && ` · ${t('leftKendra', { list: relocated.leftKendra.map(planetLabel).join(', ') })}`}
                </div>
              )}
            </div>
          )}

          {/* Dasha timing */}
          {windows.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={sectionLabel}>{t('dashaTitle')}</div>
              {windows.map(w => (
                <div key={`${w.lord}-${w.level}-${w.start}`} style={{ fontSize: '0.68rem', color: text, display: 'flex', gap: 6 }}>
                  <span style={{ color: COLORS[w.lord] }}>{GLYPHS[w.lord]}</span>
                  <span>{w.level === 1 ? t('maha', { planet: planetLabel(w.lord) }) : t('antar', { planet: planetLabel(w.lord), parent: planetLabel(w.parent ?? '') })}</span>
                  <span style={{ color: sub, marginLeft: 'auto' }}>{fmtDate(w.start)} – {fmtDate(w.end)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Transits over the place */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={sectionLabel}>{t('transitTitle')}</div>
            {transits === null ? (
              <button style={button} onClick={loadTransits} disabled={transitState === 'loading'}>
                {transitState === 'loading' ? t('loading') : transitState === 'error' ? t('retry') : t('transitButton')}
              </button>
            ) : transits.length === 0 ? (
              <div style={{ fontSize: '0.68rem', color: sub }}>{t('transitNone')}</div>
            ) : (
              transits.slice(0, 8).map((w, i) => (
                <div key={i} style={{ fontSize: '0.68rem', color: text, display: 'flex', gap: 6 }}>
                  <span style={{ color: COLORS[w.grahaId] }}>{GLYPHS[w.grahaId]}</span>
                  <span>{planetLabel(w.grahaId)} {w.angle}</span>
                  <span style={{ color: sub, marginLeft: 'auto' }}>{fmtDate(w.start)} – {fmtDate(w.end)} · {t('peak', { date: fmtDate(w.peak) })}</span>
                </div>
              ))
            )}
          </div>

          {/* Solar return here */}
          {natal.sunSidereal !== undefined && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={sectionLabel}>{t('srTitle')}</div>
              {sr ? (
                <div style={{ fontSize: '0.7rem', color: text, lineHeight: 1.55 }}>
                  {t('srResult', { lagna: rashiLabel(sr.ascRashi), muntha: rashiLabel(sr.munthaRashi as Rashi), house: sr.sunHouse })}
                </div>
              ) : (
                <button style={button} onClick={loadSolarReturn} disabled={srState === 'loading'}>
                  {srState === 'loading' ? t('loading') : srState === 'error' ? t('retry') : t('srButton')}
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.7rem', borderRadius: 10, border: '1px dashed var(--gold)', fontSize: '0.7rem', color: text, lineHeight: 1.5 }}>
          {t('goldTeaser')} <Link href="/pricing" style={{ color: 'var(--gold)', fontWeight: 700 }}>{t('viewPlans')}</Link>
        </div>
      )}

      {/* Coordinates + compare */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {[
          { key: 'latitude', val: `${Math.abs(lat).toFixed(3)}°${tCoords(lat >= 0 ? 'north' : 'south')}` },
          { key: 'longitude', val: `${Math.abs(lng).toFixed(3)}°${tCoords(lng >= 0 ? 'east' : 'west')}` },
        ].map(({ key, val }) => (
          <div key={key} style={{ padding: '0.45rem 0.625rem', background: box, borderRadius: 8 }}>
            <div style={{ fontSize: '0.55rem', color: sub, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>{tCoords(key)}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: text, fontFamily: 'monospace' }}>{val}</div>
          </div>
        ))}
      </div>
      {onAddCompare && (
        <button
          style={{ ...button, width: '100%', marginTop: 8 }}
          disabled={added}
          onClick={() => {
            onAddCompare({ id: `${lat.toFixed(3)},${lng.toFixed(3)}`, label: label ?? `${Math.abs(lat).toFixed(2)}°${tCoords(lat >= 0 ? 'north' : 'south')} ${Math.abs(lng).toFixed(2)}°${tCoords(lng >= 0 ? 'east' : 'west')}`, lat, lng })
            setAdded(true)
          }}
        >
          {added ? t('added') : t('addCompare')}
        </button>
      )}
    </div>
  )
}
