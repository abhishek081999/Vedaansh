'use client'
// ─────────────────────────────────────────────────────────────
//  AcgCouplePanel.tsx
//  Second chart for couples astrocartography: pick a saved chart or
//  enter birth details, overlay their lines, and rank places that
//  work for both people.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import type { GrahaId, UserPlan } from '@/types/astrology'
import { grahaName } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { buildAcgChartProfile, scoreLocationForChart, type AcgChartInput, type AcgChartProfile } from '@/lib/engine/acgChartProfile'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { ACG_COLORS as COLORS, ACG_GLYPHS as GLYPHS, ACG_NAMES as NAMES } from '@/components/ui/acgPalette'
import { MAJOR_CITIES } from '@/components/ui/acgCities'
import type { ACGLineData, ACGParan, ACGPartner, ComparePoint } from '@/components/ui/acgTypes'

export interface PartnerState extends ACGPartner {
  profile: AcgChartProfile
}

interface SavedChart {
  _id: string; name: string; birthDate: string; birthTime: string; birthPlace: string
  latitude: number; longitude: number; timezone: string; gender?: string; settings?: unknown
}

interface BirthInput {
  name: string; birthDate: string; birthTime: string; birthPlace: string
  latitude: number; longitude: number; timezone: string; gender?: string; settings?: unknown
}

interface Props {
  lines: ACGLineData[]
  parans: ACGParan[]
  visible: ReadonlySet<GrahaId>
  profile: AcgChartProfile | null
  userPlan: UserPlan
  partner: PartnerState | null
  extraPlaces: ComparePoint[]
  onPartner: (p: PartnerState | null) => void
  onFocus: (p: ComparePoint) => void
}

export function AcgCouplePanel({ lines, parans, visible, profile, userPlan, partner, extraPlaces, onPartner, onFocus }: Props) {
  const { lang } = useLang()
  const t = useTranslations('acg.couple')
  const tNames = useTranslations('acg.cities.names')
  const { status } = useSession()
  const planetLabel = (id: string) => grahaName(id as GrahaId, lang, NAMES[id] ?? id)

  const [saved, setSaved] = useState<SavedChart[]>([])
  const [mode, setMode] = useState<'saved' | 'manual'>('saved')
  const [form, setForm] = useState({ name: '', date: '', time: '12:00' })
  const [place, setPlace] = useState<{ label: string; lat: number; lng: number; tz: string } | null>(null)
  const [placeQ, setPlaceQ] = useState('')
  const [placeResults, setPlaceResults] = useState<{ name: string; admin1?: string; country?: string; latitude: number; longitude: number; timezone: string }[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  const gold = planMeetsUiGate(userPlan, 'gold')
  useEffect(() => {
    if (status !== 'authenticated') { setMode('manual'); return }
    if (!gold) return
    fetch('/api/chart/list?limit=50').then(r => r.json()).then(j => { if (j.success) setSaved(j.charts) }).catch(() => {})
  }, [status, gold])

  const searchPlace = async (val: string) => {
    setPlaceQ(val)
    if (val.length < 2) { setPlaceResults([]); return }
    try {
      const j = await (await fetch(`/api/atlas/search?q=${encodeURIComponent(val)}`)).json()
      setPlaceResults(j.results ?? [])
    } catch { setPlaceResults([]) }
  }

  const load = async (input: BirthInput) => {
    setState('loading')
    try {
      const c = await (await fetch('/api/chart/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, gender: input.gender ?? 'other', ...(input.settings ? { settings: input.settings } : {}) }),
      })).json()
      if (!c.success) throw new Error()
      const chart = c.data as AcgChartInput & { meta: { julianDay: number; latitude: number; longitude: number } }
      const a = await (await fetch(`/api/chart/astrocartography?jd=${chart.meta.julianDay}&lat=${chart.meta.latitude}&lng=${chart.meta.longitude}`)).json()
      if (!a.success) throw new Error()
      onPartner({ name: input.name, lines: a.lines, parans: a.parans, profile: buildAcgChartProfile(chart) })
      setState('idle')
    } catch { setState('error') }
  }

  const ranked = useMemo(() => {
    if (!partner || !profile) return []
    const places: ComparePoint[] = [
      ...extraPlaces,
      ...MAJOR_CITIES.map(c => ({ id: c.id, label: `${c.flag} ${tNames(c.id)}`, lat: c.lat, lng: c.lng })),
    ]
    return places.map(p => {
      const a = scoreLocationForChart(p.lat, p.lng, lines, parans, profile, { grahas: visible })
      const b = scoreLocationForChart(p.lat, p.lng, partner.lines, partner.parans, partner.profile, { grahas: visible })
      // A place is only as good as it is for the person it suits less.
      return { place: p, a, b, joint: Math.min(a.net, b.net) + 0.25 * Math.max(a.net, b.net) }
    }).filter(r => r.a.hits.length + r.b.hits.length > 0).sort((x, y) => y.joint - x.joint).slice(0, 8)
  }, [partner, profile, extraPlaces, lines, parans, visible, tNames])

  const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: '0.78rem' }
  const btn: React.CSSProperties = { padding: '8px 12px', borderRadius: 9, border: '1px solid var(--gold)', background: 'var(--gold-faint)', color: 'var(--gold)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }

  const hitList = (hits: ReturnType<typeof scoreLocationForChart>['hits']) => hits.slice(0, 2).map(h => (
    <span key={`${h.grahaId}-${h.angle}`} style={{ marginRight: 6, whiteSpace: 'nowrap' }}>
      <span style={{ color: COLORS[h.grahaId] }}>{GLYPHS[h.grahaId]}</span> {planetLabel(h.grahaId)} {h.angle}
    </span>
  ))

  const body = (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5, padding: '0 0.25rem' }}>{t('intro')}</div>

      {partner ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0.75rem', borderRadius: 10, border: '1px solid #7c3aed55', background: '#7c3aed10' }}>
          <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '0.8rem', flex: 1 }}>{t('partnerLoaded', { name: partner.name })}</span>
          <button style={{ ...btn, borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'transparent' }} onClick={() => onPartner(null)}>{t('clear')}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {saved.length > 0 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {(['saved', 'manual'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{ ...btn, flex: 1, background: mode === m ? 'var(--gold-faint)' : 'transparent', borderColor: mode === m ? 'var(--gold)' : 'var(--border)', color: mode === m ? 'var(--gold)' : 'var(--text-muted)' }}>
                  {t(m === 'saved' ? 'fromSaved' : 'enterDetails')}
                </button>
              ))}
            </div>
          )}
          {mode === 'saved' && saved.length > 0 ? (
            <select style={field} defaultValue="" aria-label={t('fromSaved')} onChange={e => {
              const c = saved.find(s => s._id === e.target.value)
              if (c) void load({ name: c.name, birthDate: c.birthDate, birthTime: c.birthTime, birthPlace: c.birthPlace, latitude: c.latitude, longitude: c.longitude, timezone: c.timezone, gender: c.gender, settings: c.settings })
            }}>
              <option value="" disabled>{t('pickChart')}</option>
              {saved.map(c => <option key={c._id} value={c._id}>{c.name} · {c.birthDate}</option>)}
            </select>
          ) : (
            <>
              <input style={field} placeholder={t('name')} aria-label={t('name')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <div style={{ display: 'flex', gap: 6 }}>
                <input style={field} type="date" aria-label={t('date')} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                <input style={field} type="time" step={1} aria-label={t('time')} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
              <div style={{ position: 'relative' }}>
                <input style={field} placeholder={t('place')} aria-label={t('place')} value={place ? place.label : placeQ} onChange={e => { setPlace(null); void searchPlace(e.target.value) }} />
                {!place && placeResults.length > 0 && (
                  <div style={{ position: 'absolute', zIndex: 20, left: 0, right: 0, marginTop: 4, background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, maxHeight: 200, overflowY: 'auto' }}>
                    {placeResults.map((r, i) => {
                      const label = `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}${r.country ? `, ${r.country}` : ''}`
                      return (
                        <button key={i} onClick={() => { setPlace({ label, lat: r.latitude, lng: r.longitude, tz: r.timezone }); setPlaceResults([]) }}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.76rem', cursor: 'pointer' }}>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <button
                style={btn}
                disabled={!form.name.trim() || !form.date || !form.time || !place || state === 'loading'}
                onClick={() => place && load({
                  name: form.name.trim(), birthDate: form.date, birthTime: form.time.length === 5 ? `${form.time}:00` : form.time,
                  birthPlace: place.label, latitude: place.lat, longitude: place.lng, timezone: place.tz,
                })}
              >
                {state === 'loading' ? t('loading') : t('addPartner')}
              </button>
            </>
          )}
          {state === 'loading' && mode === 'saved' && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('loading')}</div>}
          {state === 'error' && <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>{t('error')}</div>}
        </div>
      )}

      {partner && (ranked.length === 0 ? (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>{t('empty')}</div>
      ) : ranked.map((r, i) => (
        <button key={r.place.id} onClick={() => onFocus(r.place)} style={{ textAlign: 'left', padding: '0.7rem 0.8rem', borderRadius: 12, border: `1px solid ${i === 0 ? 'var(--gold)' : 'var(--border-soft)'}`, background: 'var(--surface-1)', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>{r.place.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: r.joint >= 0 ? 'var(--gold)' : '#dc2626' }}>{Math.round(r.joint)}</span>
          </div>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <div><b style={{ color: 'var(--text-secondary)' }}>{t('you', { score: r.a.net })}</b> {hitList(r.a.hits)}</div>
            <div><b style={{ color: '#7c3aed' }}>{t('them', { name: partner.name, score: r.b.net })}</b> {hitList(r.b.hits)}</div>
          </div>
        </button>
      )))}
    </section>
  )

  return <PlanGate userPlan={userPlan} required="gold" featureName={t('gateFeature')}>{body}</PlanGate>
}
