'use client'
/**
 * Prashna M1 — the horary chart itself: panchang, all vargas, planet details and
 * the dasha running at the moment of the question. Cast for "now" (Capture moment)
 * or for any date, time and place.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'
import { VargaSwitcher } from '@/components/chakra/VargaSwitcher'
import { GrahaTable } from '@/components/ui/GrahaTable'
import { DashaTree } from '@/components/dasha/DashaTree'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'
import { PrashnaEssentials } from '@/components/prashna/PrashnaEssentials'
import { GRAHA_NAMES, RASHI_NAMES, type ChartOutput, type GrahaId, type UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { getHoraTable } from '@/lib/engine/nakshatra'
import { GRAHA_HI, NAKSHATRA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'

const DASHA_SYSTEMS = ['vimshottari', 'yogini', 'chara', 'chara_fe', 'mandook', 'sthir', 'ashtottari', 'kalachakra'] as const
type SideDasha = typeof DASHA_SYSTEMS[number]

const DAY_MS = 24 * 60 * 60 * 1000
/** ISO weekday % 7 (0 = Sunday) → day lord. */
const WEEKDAY_LORD: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

const SAVED_KEY = 'prashna_m1_saved'
/** One height for every control in the input card, so the row lines up. */
const CONTROL_H = 44

interface SavedPrashna {
  id: string
  question: string
  date: string
  time: string
  place: LocationValue
  savedAt: number
}

function readSaved(): SavedPrashna[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch { return [] }
}

function writeSaved(list: SavedPrashna[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)) } catch { /* storage blocked */ }
}

const savedId = (date: string, time: string, loc: LocationValue) => `${date}T${time}@${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`

function nowIn(tz: string) {
  const d = new Date()
  return { date: formatInTimeZone(d, tz, 'yyyy-MM-dd'), time: formatInTimeZone(d, tz, 'HH:mm:ss') }
}

export function PrashnaM1Panel() {
  const t = useTranslations('prashna.m1')
  const tw = useTranslations('chart.workspace')
  const { data: session } = useSession()
  const { lang } = useLang()
  const hi = lang === 'hi'
  const userPlan = ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free') as UserPlan

  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [question, setQuestion] = useState('')
  const [chart, setChart] = useState<ChartOutput | null>(null)
  const [castAt, setCastAt] = useState<{ date: string; time: string; place: string; tz: string; instant: Date; loc: LocationValue; question: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [sideTab, setSideTab] = useState<'planets' | 'dasha'>('planets')
  const [dashaSystem, setDashaSystem] = useState<SideDasha>('vimshottari')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedPrashna[]>([])
  const [showSaved, setShowSaved] = useState(false)
  const [showEssentials, setShowEssentials] = useState(false)
  const essentialsRef = useRef<HTMLDivElement>(null)
  // Opening Essentials brings it into view (it sits below the chart once one is cast).
  useEffect(() => {
    if (showEssentials) essentialsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [showEssentials])

  // Fill date/time on the client only (avoids a hydration mismatch).
  useEffect(() => {
    const n = nowIn(location.tz)
    setDate(n.date)
    setTime(n.time)
    setSaved(readSaved())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cast = useCallback(async (d: string, tm: string, loc: LocationValue = location, q: string = question) => {
    if (!d || !tm) { setError(t('needDateTime')); return }
    const birthTime = tm.length === 5 ? `${tm}:00` : tm
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: q.trim() || t('chartName'),
          birthDate: d,
          birthTime,
          birthPlace: loc.name,
          latitude: loc.lat, longitude: loc.lng, timezone: loc.tz,
          settings: { ayanamsha: 'lahiri', houseSystem: 'whole_sign' },
        }),
      })
      const json = await res.json()
      if (json.success) {
        const data = json.data as ChartOutput
        setChart(data)
        const instant = fromZonedTime(`${d}T${birthTime}`, loc.tz)
        setCastAt({ date: d, time: birthTime, place: loc.name, tz: loc.tz, instant, loc, question: q })
      } else {
        setError(json.error ?? t('calcFailed'))
      }
    } catch {
      setError(t('network'))
    } finally {
      setLoading(false)
    }
  }, [location, question, t])

  const captureMoment = () => {
    const n = nowIn(location.tz)
    setDate(n.date)
    setTime(n.time)
    cast(n.date, n.time)
  }

  const setToNow = () => {
    const n = nowIn(location.tz)
    setDate(n.date)
    setTime(n.time)
  }

  const currentId = castAt ? savedId(castAt.date, castAt.time, castAt.loc) : null
  const isSaved = !!currentId && saved.some(x => x.id === currentId)

  const savePrashna = () => {
    if (!castAt || !currentId || isSaved) return
    const entry: SavedPrashna = { id: currentId, question: question.trim() || castAt.question.trim(), date: castAt.date, time: castAt.time, place: castAt.loc, savedAt: Date.now() }
    const next = [entry, ...readSaved().filter(x => x.id !== currentId)].slice(0, 100)
    writeSaved(next)
    setSaved(next)
  }

  const deleteSaved = (id: string) => {
    const next = readSaved().filter(x => x.id !== id)
    writeSaved(next)
    setSaved(next)
  }

  const openSaved = (e: SavedPrashna) => {
    setQuestion(e.question)
    setDate(e.date)
    setTime(e.time)
    setLocation(e.place)
    setShowSaved(false)
    cast(e.date, e.time, e.place, e.question)
  }

  const panchangChips = (c: ChartOutput, at: Date, tz: string) => {
    const p = c.panchang
    const term = (en: string) => (hi ? termHi(en) : en)
    const asc = c.lagnas.ascRashi
    return [
      { label: t('chip.vara'), value: term(p.vara.name) },
      { label: t('chip.tithi'), value: `${term(p.tithi.name)} · ${p.tithi.paksha === 'shukla' ? t('chip.shukla') : t('chip.krishna')}` },
      { label: t('chip.nakshatra'), value: hi ? NAKSHATRA_HI[p.nakshatra.index] ?? p.nakshatra.name : p.nakshatra.name },
      { label: t('chip.yoga'), value: term(p.yoga.name) },
      { label: t('chip.karana'), value: term(p.karana.name) },
      { label: t('chip.lagna'), value: `${hi ? RASHI_HI[asc] : RASHI_NAMES[asc]} ${Math.floor(c.lagnas.ascDegree % 30)}°` },
      { label: t('chip.hora'), value: horaAt(c, at, tz) },
    ]
  }

  /** Hora lord running at the prashna moment, with its time window (hora day runs sunrise to sunrise). */
  const horaAt = (c: ChartOutput, at: Date, tz: string) => {
    const ms = at.getTime()
    let sunrise = new Date(c.panchang.sunrise)
    let sunset = new Date(c.panchang.sunset)
    if (!Number.isFinite(sunrise.getTime()) || !Number.isFinite(sunset.getTime())) return '—'
    if (ms < sunrise.getTime()) {
      // Before today's sunrise the hora still belongs to yesterday's night.
      sunrise = new Date(sunrise.getTime() - DAY_MS)
      sunset = new Date(sunset.getTime() - DAY_MS)
    }
    const dayLord = WEEKDAY_LORD[Number(formatInTimeZone(sunrise, tz, 'i')) % 7]
    const h = getHoraTable(sunrise, sunset, dayLord).find(x => x.start.getTime() <= ms && ms < x.end.getTime())
    if (!h) return '—'
    const lord = hi ? GRAHA_HI[h.lord] ?? h.lord : GRAHA_NAMES[h.lord] ?? h.lord
    const fmt = (d: Date) => formatInTimeZone(d, tz, 'HH:mm')
    return `${lord} · ${fmt(h.start)}–${fmt(h.end)}`
  }

  const label: React.CSSProperties = { display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* ── Input ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {/* Ask now */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <input type="text" className="input" placeholder={`✍️ ${t('questionPlaceholder')}`} aria-label={t('questionPlaceholder')}
            value={question} onChange={e => setQuestion(e.target.value)}
            style={{ flex: '1000 1 260px', height: CONTROL_H, fontSize: '0.88rem' }} />
          <button type="button" onClick={captureMoment} disabled={loading} className="btn btn-primary"
            style={{ flex: '1 0 auto', height: CONTROL_H, padding: '0 1.4rem', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
            {t('captureBtn')}
          </button>
        </div>

        {/* Or choose a moment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{t('orManual')}</span>
          <span style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1000 1 150px', minWidth: 0 }}>
            <label htmlFor="m1-date" style={label}>{t('date')}</label>
            <input id="m1-date" type="date" className="input" value={date} onChange={e => setDate(e.target.value)} style={{ height: CONTROL_H, fontSize: '0.9rem' }} />
          </div>
          <div style={{ flex: '1000 1 170px', minWidth: 0 }}>
            <label htmlFor="m1-time" style={label}>{t('time')}</label>
            <input id="m1-time" type="time" step={1} className="input" value={time} onChange={e => setTime(e.target.value)} style={{ height: CONTROL_H, fontSize: '0.9rem' }} />
          </div>
          <div style={{ flex: '3000 1 240px', minWidth: 0 }}>
            <span style={label}>{t('place')}</span>
            <LocationPicker value={location} onChange={setLocation} label="" inlineLocate />
          </div>
          <div style={{ flex: '1 0 auto', display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={setToNow} className="btn btn-ghost" title={t('nowHint')}
              style={{ flex: '1 0 auto', height: CONTROL_H, padding: '0 1rem', justifyContent: 'center' }}>
              {t('nowBtn')}
            </button>
            <button type="button" onClick={() => cast(date, time)} disabled={loading} className="btn btn-secondary"
              style={{ flex: '2 0 auto', height: CONTROL_H, padding: '0 1.2rem', justifyContent: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {t('castBtn')}
            </button>
          </div>
        </div>

        {/* Footer: hint + tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.7rem', borderTop: '1px solid var(--border-soft)' }}>
          <span style={{ flex: '1 1 200px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t('tzHint', { tz: location.tz })}</span>
          <button type="button" onClick={() => setShowSaved(v => !v)} aria-expanded={showSaved} className="btn btn-sm btn-ghost"
            style={{ whiteSpace: 'nowrap', background: showSaved ? 'var(--gold-faint)' : undefined }}>
            {t('savedBtn', { n: saved.length })}
          </button>
          <button type="button" onClick={() => setShowEssentials(v => !v)} aria-expanded={showEssentials} className="btn btn-sm btn-ghost"
            style={{ whiteSpace: 'nowrap', background: showEssentials ? 'var(--gold-faint)' : undefined }}>
            {t('essentialsBtn')}
          </button>
        </div>

        {showSaved && (
          <div style={{ border: '1px solid var(--border-soft)', borderRadius: 10, background: 'var(--surface-2)', padding: '0.6rem' }}>
            {saved.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('savedEmpty')}</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 280, overflowY: 'auto' }}>
                {saved.map(e => (
                  <li key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.question || t('noQuestion')}</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{e.date} {e.time} · {e.place.name}</div>
                    </div>
                    <button type="button" onClick={() => openSaved(e)} disabled={loading} className="btn btn-sm btn-secondary">{t('openBtn')}</button>
                    <button type="button" onClick={() => deleteSaved(e.id)} className="btn btn-sm btn-ghost" aria-label={t('deleteAria')} style={{ color: 'var(--rose)' }}>{t('deleteBtn')}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {error && (
          <div style={{ fontSize: '0.75rem', color: 'var(--rose)', padding: '0.5rem 0.65rem', borderRadius: 8, border: '1px solid var(--rose)' }}>
            {error}
          </div>
        )}
      </div>

      {/* Before a chart is cast, Essentials opens here as a plain reference. */}
      {showEssentials && !(chart && castAt) && (
        <div ref={essentialsRef} style={{ scrollMarginTop: 80 }}><PrashnaEssentials /></div>
      )}

      {loading && (
        <div className="card" style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <VedaanshLoader size={48} message={t('casting')} />
        </div>
      )}

      {!chart && !loading && (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--surface-0)', borderRadius: 14, border: '1px dashed var(--border)' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>🧿</div>
          <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 0.4rem' }}>{t('emptyTitle')}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('emptyBody')}</p>
        </div>
      )}

      {chart && castAt && !loading && (
        <>
          {/* ── Panchang strip ───────────────────────────────── */}
          <section className="card" style={{ padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
              <div className="label-caps">{t('panchang')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {t('castFor')} <strong style={{ color: 'var(--rose)' }}>{castAt.date} {castAt.time}</strong> · {castAt.place}
                </span>
                <button type="button" onClick={savePrashna} disabled={isSaved} className={`btn btn-sm ${isSaved ? 'btn-ghost' : 'btn-primary'}`}>
                  {isSaved ? t('savedDone') : t('saveBtn')}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
              {panchangChips(chart, castAt.instant, castAt.tz).map(c => (
                <div key={c.label} style={{ padding: '0.4rem 0.6rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-gold)' }}>{c.value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Dashboard: chart left, planets + dasha right ─── */}
          <div className="chart-layout-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
              <VargaSwitcher
                vargas={chart.vargas}
                vargaLagnas={chart.vargaLagnas}
                ascRashi={chart.lagnas.ascRashi}
                lagnas={chart.lagnas}
                arudhas={chart.arudhas}
                userPlan={userPlan}
                moonNakIndex={chart.panchang.nakshatra.index}
                tithiNumber={chart.panchang.tithi.number}
                varaNumber={chart.panchang.vara.number}
                chart={chart}
              />
            </div>

            <div className="sticky-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
              <div className="panel">
                <div className="panel-header" style={{ flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
                  <div role="tablist" aria-label={t('sideAria')} style={{ display: 'inline-flex', padding: 2, gap: 2, background: 'var(--surface-3)', border: '1px solid var(--border-soft)', borderRadius: 999 }}>
                    {(['planets', 'dasha'] as const).map(v => (
                      <button key={v} type="button" role="tab" aria-selected={sideTab === v} onClick={() => setSideTab(v)}
                        style={{
                          height: 24, padding: '0 0.75rem', border: 'none', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                          background: sideTab === v ? 'var(--gold)' : 'transparent',
                          color: sideTab === v ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                        }}>
                        {t(v)}
                      </button>
                    ))}
                  </div>
                  {sideTab === 'dasha' && (
                    <select value={dashaSystem} onChange={e => setDashaSystem(e.target.value as SideDasha)} aria-label={tw('dashaSystem')}
                      style={{ height: 26, marginLeft: 'auto', padding: '0 0.45rem', fontSize: '0.64rem', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-soft)', borderRadius: 999, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                      {DASHA_SYSTEMS.map(d => <option key={d} value={d}>{tw(`dasha.${d}`)}</option>)}
                    </select>
                  )}
                </div>
                {sideTab === 'planets' ? (
                  <div style={{ overflowX: 'auto' }}>
                    <GrahaTable
                      grahas={chart.grahas}
                      vargas={chart.vargas}
                      vargaLagnas={chart.vargaLagnas}
                      lagnas={chart.lagnas}
                      upagrahas={chart.upagrahas}
                      arudhas={chart.arudhas}
                    />
                  </div>
                ) : (
                  <div style={{ padding: '0.5rem 0.65rem' }}>
                    {chart.dashas[dashaSystem]?.length ? (
                      <DashaTree
                        key={dashaSystem}
                        nodes={chart.dashas[dashaSystem]}
                        birthDate={castAt.instant}
                        maxDepth={dashaSystem === 'vimshottari' ? (userPlan === 'free' ? 4 : 6) : 3}
                        lazyExpand={dashaSystem === 'vimshottari'}
                        asOf={castAt.instant}
                        timezone={castAt.tz}
                      />
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.75rem', textAlign: 'center' }}>
                        {tw('computationRequired', { system: tw(`dasha.${dashaSystem}`) })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* With a cast chart, Essentials reads that chart, below it. */}
          {showEssentials && (
            <div ref={essentialsRef} style={{ scrollMarginTop: 80 }}>
              <PrashnaEssentials chart={chart} at={castAt.instant} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
