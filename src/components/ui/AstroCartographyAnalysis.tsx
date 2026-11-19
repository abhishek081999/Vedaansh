'use client'
// ─────────────────────────────────────────────────────────────
//  AstroCartographyAnalysis.tsx
//  Tabbed ACG analysis: Top Cities · Parans · Planetary Guide
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react'
import { interactiveTransition } from '@/lib/ui/transitions'
import { useTranslations } from 'next-intl'
import { getAcgInterpretation } from '@/lib/engine/astroInterpretation'
import { grahaName, nakshatraName } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import type { GrahaId, UserPlan } from '@/types/astrology'
import { NAKSHATRA_NAMES } from '@/types/astrology'
import { scoreLocation } from '@/lib/engine/acgProximity'
import { dashaWindowsFor, scoreLocationForChart, type AcgChartProfile } from '@/lib/engine/acgChartProfile'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Link } from '@/i18n/navigation'
import { ACG_COLORS, ACG_GLYPHS, ACG_NAMES } from '@/components/ui/acgPalette'
import { MAJOR_CITIES } from '@/components/ui/acgCities'
import { AcgComparePanel } from '@/components/ui/AcgComparePanel'
import { AcgCouplePanel, type PartnerState } from '@/components/ui/AcgCouplePanel'
import type { ACGLineData, ACGParan, ACGStarParan, ComparePoint } from '@/components/ui/acgTypes'

const COLORS = ACG_COLORS
const GLYPHS = ACG_GLYPHS
const NAMES = ACG_NAMES

interface Props {
  visiblePlanets: Set<GrahaId>
  parans: ACGParan[]
  starParans?: ACGStarParan[]
  natalData?: ACGLineData[]
  profile?: AcgChartProfile | null
  userPlan?: UserPlan
  comparePoints?: ComparePoint[]
  onAddCompare?: (p: ComparePoint) => void
  onRemoveCompare?: (id: string) => void
  onFocusPlace?: (p: ComparePoint) => void
  partner?: PartnerState | null
  onPartner?: (p: PartnerState | null) => void
  activeTab?: Tab
  onTabChange?: (tab: Tab) => void
  hideTabBar?: boolean
}

export type ACGAnalysisTab = 'cities' | 'parans' | 'compare' | 'couple' | 'guide'
type Tab = ACGAnalysisTab
type LifeArea = 'all' | 'career' | 'love' | 'home' | 'identity'
type CitySort = 'supportive' | 'intensity'

const ANGLE_MAP: Record<LifeArea, string[]> = {
  all:      ['AS', 'MC', 'DS', 'IC'],
  career:   ['MC'],
  love:     ['DS'],
  home:     ['IC'],
  identity: ['AS'],
}

// ─── Main Component ──────────────────────────────────────────

export function AstroCartographyAnalysis({
  visiblePlanets, parans, starParans = [], natalData, profile = null, userPlan = 'free',
  comparePoints = [], onAddCompare, onRemoveCompare, onFocusPlace, partner = null, onPartner,
  activeTab, onTabChange, hideTabBar = false,
}: Props) {
  const { lang, tag } = useLang()
  const tNature = useTranslations('acg.nature')
  const tStars = useTranslations('acg.stars')
  const weighted = planMeetsUiGate(userPlan, 'gold') && !!profile
  const [citySort, setCitySort] = useState<CitySort>('supportive')
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(tag, { month: 'short', year: 'numeric' })
  const tTabs = useTranslations('acg.analysisTabs')
  const tCities = useTranslations('acg.cities')
  const tNames = useTranslations('acg.cities.names')
  const tParans = useTranslations('acg.parans')
  const tPairs = useTranslations('acg.parans.pairs')
  const tGuide = useTranslations('acg.guide')
  const tAngles = useTranslations('acg.guide.angles')
  const tCoords = useTranslations('acg.coords')
  const planetLabel = (id: string) => grahaName(id as GrahaId, lang, NAMES[id] ?? id)
  const paranMeaning = (p1: string, p2: string) => {
    const k1 = `${p1}-${p2}`
    const k2 = `${p2}-${p1}`
    if (tPairs.has(k1)) return tPairs(k1)
    if (tPairs.has(k2)) return tPairs(k2)
    return tParans('fallback', { p1: planetLabel(p1), p2: planetLabel(p2) })
  }
  const hemisphere = (value: number, kind: 'lat' | 'lng') => {
    const dir = kind === 'lat'
      ? tCoords(value >= 0 ? 'north' : 'south')
      : tCoords(value >= 0 ? 'east' : 'west')
    return `${Math.abs(value).toFixed(2)}°${dir}`
  }
  const planets = Array.from(visiblePlanets)
  const [internalTab, setInternalTab] = useState<Tab>('cities')
  const tab = activeTab ?? internalTab
  const setTab = (next: Tab) => {
    if (onTabChange) onTabChange(next)
    else setInternalTab(next)
  }
  const [lifeArea, setLifeArea] = useState<LifeArea>('all')
  const [expandedCity, setExpandedCity] = useState<number | null>(null)

  // ── City scoring ──
  const topCities = useMemo(() => {
    if (!natalData || natalData.length === 0) return []

    const results = MAJOR_CITIES.map(city => {
      if (weighted && profile) {
        const w = scoreLocationForChart(city.lat, city.lng, natalData, parans, profile, { grahas: visiblePlanets })
        const closest = w.hits[0]
        return {
          ...city,
          score: citySort === 'supportive' ? w.net : w.intensity,
          supportive: w.supportive,
          challenging: w.challenging,
          closestPlanet: closest?.grahaId ?? null,
          lineType: closest?.angle ?? 'MC',
          minKm: closest?.km ?? Infinity,
          activePlanets: w.hits.map(h => ({ planet: h.grahaId, line: h.angle, km: h.km, favor: h.favor as number | null })),
          paranCount: w.parans.length,
          windows: dashaWindowsFor(w.hits.map(h => h.grahaId), profile, { limit: 3 }),
          hasHits: w.hits.length + w.parans.length > 0,
        }
      }
      const { score, lines, parans: paranHits } = scoreLocation(city.lat, city.lng, natalData, parans, { grahas: visiblePlanets })
      const closest = lines[0]
      return {
        ...city,
        score,
        supportive: 0,
        challenging: 0,
        closestPlanet: closest?.grahaId ?? null,
        lineType: closest?.angle ?? 'MC',
        minKm: closest?.km ?? Infinity,
        activePlanets: lines.map(h => ({ planet: h.grahaId, line: h.angle, km: h.km, favor: null as number | null })),
        paranCount: paranHits.length,
        windows: [] as ReturnType<typeof dashaWindowsFor>,
        hasHits: score > 0,
      }
    })

    return results.filter(c => c.hasHits).sort((a, b) => b.score - a.score).slice(0, 8)
  }, [natalData, parans, visiblePlanets, weighted, profile, citySort])

  const maxScore = Math.max(1, ...topCities.map(c => Math.abs(c.score)))

  const activeAngles = ANGLE_MAP[lifeArea]

  // ─── Render ───────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {!hideTabBar && (
        <div style={{ display: 'flex', gap: '3px', background: 'var(--surface-2)', padding: '3px', borderRadius: '12px' }}>
          {([
            ['cities', '🌐'],
            ['parans', '✨'],
            ['compare', '⚖️'],
            ['couple', '💞'],
            ['guide',  '📖'],
          ] as [Tab, string][]).map(([id, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, padding: '7px 6px', borderRadius: '9px',
                background: tab === id ? 'var(--surface-0)' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
                color: tab === id ? 'var(--text-primary)' : 'var(--text-muted)',
                display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center',
                boxShadow: tab === id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                transition: interactiveTransition('0.2s'),
              }}
            >
              <span>{icon}</span><span>{tTabs(id)}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Cities Tab ─────────────────────────────────────── */}
      {tab === 'cities' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5, padding: '0 0.25rem' }}>
            {weighted ? tCities('introWeighted') : tCities('intro')}
          </div>

          {weighted ? (
            <div style={{ display: 'flex', gap: 4 }}>
              {(['supportive', 'intensity'] as const).map(k => (
                <button key={k} onClick={() => setCitySort(k)} style={{
                  flex: 1, padding: '5px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                  background: citySort === k ? 'var(--gold-faint)' : 'transparent',
                  border: `1px solid ${citySort === k ? 'var(--gold)' : 'var(--border)'}`,
                  color: citySort === k ? 'var(--gold)' : 'var(--text-muted)',
                }}>{tCities(k === 'supportive' ? 'sortSupportive' : 'sortIntensity')}</button>
              ))}
            </div>
          ) : profile ? (
            <div style={{ padding: '0.6rem 0.75rem', borderRadius: 10, border: '1px dashed var(--gold)', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {tCities('goldTeaser')} <Link href="/pricing" style={{ color: 'var(--gold)', fontWeight: 700 }}>{tCities('viewPlans')}</Link>
            </div>
          ) : null}

          {topCities.length === 0 ? (
            <EmptyState icon="🌍" message={tCities('empty')} />
          ) : (
            topCities.map((c, i) => {
              const expanded = expandedCity === i
              const barPct   = (Math.abs(c.score) / maxScore) * 100
              const barColor = c.score < 0 ? '#dc2626' : i === 0 ? 'var(--gold)' : c.closestPlanet ? COLORS[c.closestPlanet] : 'var(--gold)'

              return (
                <div
                  key={i}
                  onClick={() => setExpandedCity(expanded ? null : i)}
                  style={{
                    padding: '0.875rem',
                    border: `1px solid ${i === 0 ? 'var(--gold)' : 'var(--border-soft)'}`,
                    borderRadius: '14px',
                    background: i === 0
                      ? 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, transparent 100%)'
                      : 'var(--surface-1)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: expanded ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
                  }}
                  onMouseEnter={e => { if (i !== 0) e.currentTarget.style.borderColor = 'var(--border-bright)' }}
                  onMouseLeave={e => { if (i !== 0) e.currentTarget.style.borderColor = 'var(--border-soft)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      {/* Rank badge */}
                      <div style={{
                        width: 26, height: 26, borderRadius: '7px', flexShrink: 0,
                        background: i === 0 ? 'var(--gold)' : i === 1 ? 'rgba(192,192,192,0.3)' : i === 2 ? 'rgba(180,140,90,0.3)' : 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', fontWeight: 900,
                        color: i === 0 ? '#000' : 'var(--text-muted)',
                      }}>
                        {i === 0 ? '⭐' : `#${i + 1}`}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>{c.flag}</span> {tNames(c.id)}
                        </div>
                        {c.closestPlanet ? (
                          <div style={{ fontSize: '0.62rem', color: COLORS[c.closestPlanet], fontWeight: 700, marginTop: '1px' }}>
                            {GLYPHS[c.closestPlanet]} {planetLabel(c.closestPlanet)} {c.lineType}
                            {Number.isFinite(c.minKm) ? ` ${tCities('offset', { km: Math.round(c.minKm) })}` : ''}
                          </div>
                        ) : c.paranCount > 0 ? (
                          <div style={{ fontSize: '0.62rem', color: 'var(--gold)', fontWeight: 700, marginTop: '1px' }}>
                            {tCities('paranOnly', { n: c.paranCount })}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: barColor, fontFamily: 'var(--font-mono)' }}>{c.score}</div>
                        {weighted && (
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            <span style={{ color: '#16a34a' }}>▲{c.supportive}</span> <span style={{ color: '#dc2626' }}>▼{c.challenging}</span>
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden', marginBottom: expanded ? '0.75rem' : 0 }}>
                    <div style={{ height: '100%', width: `${barPct}%`, background: barColor, borderRadius: 4, transition: 'width 0.9s ease' }} />
                  </div>

                  {/* Expanded: active planets near this city */}
                  {expanded && c.activePlanets.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.5rem' }}>
                      {c.activePlanets.map((ap, ai) => (
                        <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '20px', background: `${COLORS[ap.planet]}12`, border: `1px solid ${COLORS[ap.planet]}25`, fontSize: '0.65rem', fontWeight: 700, color: COLORS[ap.planet] }}>
                          <span>{GLYPHS[ap.planet]}</span>
                          <span>{ap.line}</span>
                          <span style={{ opacity: 0.7 }}>({tCities('km', { km: Math.round(ap.km) })})</span>
                          {ap.favor !== null && (
                            <span style={{ color: ap.favor >= 0.35 ? '#16a34a' : ap.favor <= -0.25 ? '#dc2626' : 'var(--text-muted)' }}>
                              · {tNature(ap.favor >= 0.35 ? 'benefic' : ap.favor <= -0.25 ? 'malefic' : 'mixed')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {expanded && c.windows.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.64rem', color: 'var(--text-secondary)' }}>
                      <div style={{ fontWeight: 800, color: '#7c3aed', marginBottom: 2 }}>{tCities('activeWhen')}</div>
                      {c.windows.map(w => (
                        <div key={`${w.lord}-${w.level}-${w.start}`}>
                          <span style={{ color: COLORS[w.lord] }}>{GLYPHS[w.lord]}</span>{' '}
                          {w.level === 1 ? tCities('maha', { planet: planetLabel(w.lord) }) : tCities('antar', { planet: planetLabel(w.lord), parent: planetLabel(w.parent ?? '') })}
                          {' · '}{fmtDate(w.start)} – {fmtDate(w.end)}
                        </div>
                      ))}
                    </div>
                  )}
                  {expanded && onAddCompare && (
                    <button
                      onClick={e => { e.stopPropagation(); onAddCompare({ id: c.id, label: `${c.flag} ${tNames(c.id)}`, lat: c.lat, lng: c.lng }) }}
                      style={{ marginTop: '0.5rem', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.64rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {tCities('addCompare')}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </section>
      )}

      {/* ── Parans Tab ─────────────────────────────────────── */}
      {tab === 'parans' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5, padding: '0 0.25rem' }}>
            {tParans('intro')}
          </div>

          {parans.length === 0 ? (
            <EmptyState icon="✨" message={tParans('empty')} />
          ) : (
            parans.slice(0, 10).map((p, i) => (
              <div key={i} style={{ background: 'var(--surface-1)', borderRadius: '14px', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>
                {/* Header row */}
                <div style={{ padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.875rem', borderBottom: '1px solid var(--border-soft)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.3rem', color: COLORS[p.p1], filter: `drop-shadow(0 0 6px ${COLORS[p.p1]}80)` }}>{GLYPHS[p.p1]}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>×</span>
                    <span style={{ fontSize: '1.3rem', color: COLORS[p.p2], filter: `drop-shadow(0 0 6px ${COLORS[p.p2]}80)` }}>{GLYPHS[p.p2]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{planetLabel(p.p1)} × {planetLabel(p.p2)}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px' }}>{tParans('band', { lat: hemisphere(p.lat, 'lat') })}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
                      {p.type ? `${p.type} · ` : ''}{hemisphere(p.lat, 'lat')} · {hemisphere(p.lon, 'lng')}
                    </div>
                  </div>
                  {/* Dual color swatch */}
                  <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ width: 8, height: 24, background: COLORS[p.p1] }} />
                    <div style={{ width: 8, height: 24, background: COLORS[p.p2] }} />
                  </div>
                </div>
                {/* Interpretation */}
                <div style={{ padding: '0.75rem 0.875rem' }}>
                  <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {paranMeaning(p.p1, p.p2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* ── Yogatara parans ────────────────────────────────── */}
      {tab === 'parans' && starParans.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)', padding: '0 0.25rem' }}>✦ {tStars('title')}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5, padding: '0 0.25rem' }}>{tStars('intro')}</div>
          {[...starParans].sort((a, b) => Math.abs(a.lat) - Math.abs(b.lat)).slice(0, 12).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 0.75rem', borderRadius: 10, border: '1px solid var(--border-soft)', background: 'var(--surface-1)' }}>
              <span style={{ color: COLORS[s.grahaId], fontSize: '1.1rem' }}>{GLYPHS[s.grahaId]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  {tStars(s.meridian === 'graha' ? 'rowGraha' : 'rowStar', {
                    planet: planetLabel(s.grahaId), a1: s.angle1, a2: s.angle2,
                    nakshatra: nakshatraName(s.nakshatraIndex, lang, NAKSHATRA_NAMES[s.nakshatraIndex] ?? ''), star: s.star,
                  })}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{tParans('band', { lat: hemisphere(s.lat, 'lat') })}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Compare Tab ────────────────────────────────────── */}
      {tab === 'compare' && (
        <AcgComparePanel
          points={comparePoints}
          lines={natalData ?? []}
          parans={parans}
          visible={visiblePlanets}
          profile={profile}
          userPlan={userPlan}
          onAdd={p => onAddCompare?.(p)}
          onRemove={id => onRemoveCompare?.(id)}
          onFocus={p => onFocusPlace?.(p)}
        />
      )}

      {/* ── Couple Tab ─────────────────────────────────────── */}
      {tab === 'couple' && (
        <AcgCouplePanel
          lines={natalData ?? []}
          parans={parans}
          visible={visiblePlanets}
          profile={profile}
          userPlan={userPlan}
          partner={partner}
          extraPlaces={comparePoints}
          onPartner={p => onPartner?.(p)}
          onFocus={p => onFocusPlace?.(p)}
        />
      )}

      {/* ── Guide Tab ──────────────────────────────────────── */}
      {tab === 'guide' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Life-area filter */}
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tGuide('vedicNote')}</p>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{tGuide('filter')}</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {([
                ['all',      '🌐'],
                ['career',   '🏆'],
                ['love',     '❤️'],
                ['home',     '🏠'],
                ['identity', '✦'],
              ] as [LifeArea, string][]).map(([a, icon]) => (
                <button
                  key={a}
                  onClick={() => setLifeArea(a)}
                  style={{
                    padding: '5px 10px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700,
                    background: lifeArea === a ? 'var(--gold-faint)' : 'transparent',
                    border: `1px solid ${lifeArea === a ? 'var(--gold)' : 'var(--border)'}`,
                    color: lifeArea === a ? 'var(--gold)' : 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center', transition: interactiveTransition('0.2s'),
                  }}
                >
                  <span>{icon}</span><span>{tGuide(a)}</span>
                </button>
              ))}
            </div>

            {/* Angle description */}
            {lifeArea !== 'all' && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: '8px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {tAngles(`${ANGLE_MAP[lifeArea][0]}.desc`)}
              </div>
            )}
          </div>

          {planets.length === 0 ? (
            <EmptyState icon="🧿" message={tGuide('empty')} />
          ) : (
            planets.map(id => (
              <div key={id} style={{ background: 'var(--surface-1)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
                {/* Planet header */}
                <div style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: `${COLORS[id]}07`, borderBottom: '1px solid var(--border-soft)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${COLORS[id]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.55rem', color: COLORS[id], border: `1px solid ${COLORS[id]}30`, flexShrink: 0 }}>
                    {GLYPHS[id]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.975rem' }}>{tGuide('lines', { planet: planetLabel(id) })}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '1px' }}>
                      {activeAngles.length === 1
                        ? tGuide('angleFocus', { angle: activeAngles[0], label: tAngles(`${activeAngles[0]}.label`) })
                        : tGuide('allAngles')}
                    </div>
                  </div>
                  {/* Color bar accent */}
                  <div style={{ marginLeft: 'auto', width: 4, height: 36, borderRadius: 3, background: COLORS[id], opacity: 0.7 }} />
                </div>

                {/* Angle boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: activeAngles.length === 1 ? '1fr' : '1fr 1fr', gap: 0 }}>
                  {(['AS', 'MC', 'DS', 'IC'] as const).filter(a => activeAngles.includes(a)).map(angle => (
                    <AngleBox
                      key={angle}
                      angle={angle}
                      color={COLORS[id]}
                      label={tAngles(`${angle}.label`)}
                      pending={tGuide('pending')}
                      desc={getAcgInterpretation(id as GrahaId, angle, lang)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border)', borderRadius: '16px', lineHeight: 1.55 }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
      {message}
    </div>
  )
}

function AngleBox({ angle, desc, color, label, pending }: { angle: string; desc?: string; color: string; label: string; pending: string }) {
  return (
    <div
      style={{ padding: '0.75rem', margin: '3px', borderRadius: '10px', cursor: 'default', transition: 'background 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}0e` }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.58rem', fontWeight: 900, color, padding: '2px 6px', background: `${color}18`, borderRadius: '4px' }}>{angle}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.52, margin: 0 }}>{desc ?? pending}</p>
    </div>
  )
}
