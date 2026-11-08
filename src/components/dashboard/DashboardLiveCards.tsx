'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/DashboardLiveCards.tsx
//  Time-dependent dashboard cards: today's Panchang and current
//  transits with Sade Sati status
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import type { ChartOutput, GrahaId, PanchangData, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_SHORT } from '@/types/astrology'
import type { SadeSatiReport } from '@/lib/engine/sadeSati'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'
import { ordHi } from '@/lib/engine/locale/todayReading.hi'
import { DashCard, DashEmpty, DashRow, DashNote, TONE_COLOR, type CardTone } from '@/components/dashboard/DashboardCardShell'

type DateLike = Date | string | null | undefined

function toMs(v: DateLike): number {
  if (!v) return NaN
  return v instanceof Date ? v.getTime() : new Date(v).getTime()
}

function fmtTime(v: DateLike, tz: string, tag = 'en-IN'): string {
  const ms = toMs(v)
  if (!Number.isFinite(ms)) return '—'
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
  try {
    return new Date(ms).toLocaleTimeString(tag, { ...opts, timeZone: tz })
  } catch {
    return new Date(ms).toLocaleTimeString(tag, opts)
  }
}

function fmtWindow(w: { start: DateLike; end: DateLike } | null | undefined, tz: string, tag = 'en-IN'): string {
  return w ? `${fmtTime(w.start, tz, tag)} – ${fmtTime(w.end, tz, tag)}` : '—'
}

function isNow(w: { start: DateLike; end: DateLike } | null | undefined): boolean {
  if (!w) return false
  const now = Date.now()
  return now >= toMs(w.start) && now < toMs(w.end)
}

// ── Today's Panchang ─────────────────────────────────────────

export function TodayPanchangCard({ panchang, timezone }: { panchang: PanchangData | null; timezone: string }) {
  const t = useTranslations('chart.livePanchang')
  const { hi, tag } = useLang()
  if (!panchang) {
    return <DashCard title={t('title')}><DashEmpty>{t('loading')}</DashEmpty></DashCard>
  }
  const tm = (v: DateLike) => fmtTime(v, timezone, tag)
  const win = (w: { start: DateLike; end: DateLike } | null | undefined) => fmtWindow(w, timezone, tag)
  const name = (n: string) => (hi ? termHi(n) : n)
  const lord = GRAHA_NAMES[panchang.vara.lord] ?? panchang.vara.lord
  const rahuNow = isNow(panchang.rahuKalam)
  const abhijitNow = isNow(panchang.abhijitMuhurta)
  return (
    <DashCard title={t('title')} meta={panchang.date}>
      <DashRow label={t('vara')} value={`${name(panchang.vara.name)} · ${hi ? GRAHA_HI[panchang.vara.lord as GrahaId] ?? lord : lord}`} />
      <DashRow
        label={t('tithi')}
        value={`${name(panchang.tithi.name)} · ${panchang.tithi.paksha === 'shukla' ? t('shukla') : t('krishna')} · ${t('till', { time: tm(panchang.tithi.endTime) })}`}
      />
      <DashRow label={t('nakshatra')} value={`${name(panchang.nakshatra.name)} · ${t('pada', { n: panchang.nakshatra.pada })}`} />
      <DashRow label={t('yoga')} value={`${name(panchang.yoga.name)} · ${t('till', { time: tm(panchang.yoga.endTime) })}`} />
      <DashRow label={t('karana')} value={`${name(panchang.karana.name)} · ${t('till', { time: tm(panchang.karana.endTime) })}`} />
      <DashRow label={t('sun')} value={t('sunTimes', { rise: tm(panchang.sunrise), set: tm(panchang.sunset) })} />
      <DashRow label={t('rahu')} tone={rahuNow ? 'alert' : 'neutral'} dot={rahuNow} value={`${win(panchang.rahuKalam)}${rahuNow ? t('now') : ''}`} />
      <DashRow label={t('gulika')} value={win(panchang.gulikaKalam)} />
      <DashRow label={t('yamaganda')} value={win(panchang.yamaganda)} />
      <DashRow label={t('abhijit')} tone={abhijitNow ? 'good' : 'neutral'} dot={abhijitNow} value={`${win(panchang.abhijitMuhurta)}${abhijitNow ? t('now') : ''}`} />
      <DashNote>{t('note', { tz: timezone })}</DashNote>
    </DashCard>
  )
}

// ── Current transits + Sade Sati ─────────────────────────────

interface TransitPlanet {
  id: GrahaId
  name: string
  rashi: Rashi
  rashiName: string
  degree: number
  isRetro: boolean
}

interface TransitState {
  planets: TransitPlanet[] | null
  sadeSati: SadeSatiReport | null
  error: string | null
}

const ORDER: GrahaId[] = ['Sa', 'Ju', 'Ra', 'Ke', 'Ma', 'Su', 'Mo', 'Me', 'Ve']

// Share responses between mounts (desktop grid vs. mobile tab) for the same chart and day.
const responseCache = new Map<string, unknown>()

async function getJson<T>(url: string): Promise<T> {
  if (responseCache.has(url)) return responseCache.get(url) as T
  const res = await fetch(url)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Request failed')
  responseCache.set(url, json)
  return json as T
}

function useTransitSnapshot(chart: ChartOutput): TransitState & { loading: boolean } {
  const [state, setState] = useState<TransitState>({ planets: null, sadeSati: null, error: null })
  const [loading, setLoading] = useState(true)
  const moonRashi = chart.grahas.find(g => g.id === 'Mo')?.rashi
  const ascRashi = chart.lagnas.ascRashi
  const ayanamsha = chart.meta.settings.ayanamsha

  useEffect(() => {
    let cancelled = false
    const today = new Date().toISOString().split('T')[0]
    setLoading(true)
    async function load() {
      const planetsReq = getJson<{ grahas: TransitPlanet[] }>(`/api/transits/planets?date=${today}&ayanamsha=${encodeURIComponent(ayanamsha)}`)
      const sadeReq = moonRashi
        ? getJson<{ data: SadeSatiReport }>(`/api/transit/sade-sati?${new URLSearchParams({
            moonRashi: String(moonRashi), ascRashi: String(ascRashi), asOf: today, lookbackYears: '1', lookAheadYears: '12',
          })}`)
        : Promise.resolve(null)
      // Independent: a Sade Sati failure must not blank the planet list, and vice versa.
      const [p, s] = await Promise.allSettled([planetsReq, sadeReq])
      if (cancelled) return
      setState({
        planets: p.status === 'fulfilled' ? p.value.grahas : null,
        sadeSati: s.status === 'fulfilled' && s.value ? s.value.data : null,
        error: p.status === 'rejected' ? 'error' : null,
      })
      setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [moonRashi, ascRashi, ayanamsha])

  return { ...state, loading }
}

function houseFrom(rashi: number, from: number): number {
  return ((rashi - from + 12) % 12) + 1
}

function sadeTone(r: SadeSatiReport): CardTone {
  if (r.now.kind === 'sade_sati_peak' || r.now.kind === 'ashtama') return 'alert'
  if (r.now.kind === 'clear') return 'good'
  return 'watch'
}

export function TransitSnapshotCard({ chart, onOpen }: { chart: ChartOutput; onOpen?: () => void }) {
  const t = useTranslations('chart.liveTransits')
  const { hi } = useLang()
  const { planets, sadeSati, error, loading } = useTransitSnapshot(chart)
  const moonRashi = chart.grahas.find(g => g.id === 'Mo')?.rashi
  const asc = chart.lagnas.ascRashi

  const phase = sadeSati?.currentPhase
  const next = sadeSati?.upcoming[0]
  const ordered = planets
    ? ORDER.map(id => planets.find(p => p.id === id)).filter((p): p is TransitPlanet => !!p)
    : []

  return (
    <DashCard title={t('title')} meta={t('meta')} actionLabel={onOpen ? t('hub') : undefined} onAction={onOpen}>
      {sadeSati && (
        <div style={{ padding: '0.3rem 0 0.45rem', borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: TONE_COLOR[sadeTone(sadeSati)] }}>
            {sadeSati.now.inSadeSati || sadeSati.now.inKantaka || sadeSati.now.inAshtama ? sadeSati.now.label : t('clear')}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
            {t('saturn', { sign: hi ? termHi(sadeSati.now.saturnRashiName) : sadeSati.now.saturnRashiName, nth: hi ? ordHi(sadeSati.now.fromMoonHouse) : sadeSati.now.fromMoonHouse })}
            {phase && phase.kind !== 'clear' ? t('until', { date: phase.endIso, pct: phase.progressPct }) : ''}
            {(!phase || phase.kind === 'clear') && next ? t('next', { label: next.label, date: next.startIso }) : ''}
          </div>
        </div>
      )}
      {loading && !planets ? <DashEmpty>{t('loading')}</DashEmpty> : null}
      {error ? <DashEmpty>{t('error')}</DashEmpty> : null}
      {ordered.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.66rem', marginTop: '0.2rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ textAlign: 'left', fontWeight: 700, padding: '0.15rem 0' }}>{t('graha')}</th>
              <th style={{ textAlign: 'left', fontWeight: 700 }}>{t('sign')}</th>
              <th style={{ textAlign: 'right', fontWeight: 700 }} title={t('lagnaTitle')}>{t('lagna')}</th>
              <th style={{ textAlign: 'right', fontWeight: 700 }} title={t('moonTitle')}>{t('moon')}</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.18rem 0', color: 'var(--text-primary)' }}>
                  {hi ? GRAHA_HI[p.id] ?? p.name : GRAHA_NAMES[p.id] ?? p.name}
                  {p.isRetro && p.id !== 'Ra' && p.id !== 'Ke' ? <span title={t('retro')} style={{ marginLeft: 4, color: 'var(--rose)', fontSize: '0.58rem' }}>{t('retroShort')}</span> : null}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{hi ? RASHI_HI[p.rashi] : RASHI_SHORT[p.rashi]} {p.degree.toFixed(1)}°</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-gold)' }}>{houseFrom(p.rashi, asc)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{moonRashi ? houseFrom(p.rashi, moonRashi) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <DashNote>{t('note')}</DashNote>
    </DashCard>
  )
}
