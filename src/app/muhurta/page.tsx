'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/muhurta/page.tsx
//  Muhurta Finder — day range search + 24h timeline
//  Day scores: tithi / nakshatra / yoga / karana / vara + personal balas
//  Timeline scores: + hora / choghadiya / panchaka / kalam at each slot
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Briefcase, Plane, Home, Heart, Stethoscope, Zap, BookOpen, Flame, CalendarPlus, FileText,
} from 'lucide-react'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import { useChart } from '@/components/providers/ChartProvider'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'
import { MuhurtaNowStrip } from '@/components/ui/MuhurtaNowStrip'
import { DinmanMuhurtaStrip } from '@/components/panchang/DinmanMuhurtaStrip'
import { SanskarasReference } from '@/components/panchang/SanskarasReference'
import { calcTaraBala, calcChandraBala } from '@/lib/engine/muhurtaPersonal'
import {
  analyzeMuhurta,
  MUHURTA_ACTIVITIES,
  MUHURTA_ACTIVITY_LABELS,
  type MuhurtaActivity,
  type MuhurtaScore,
} from '@/lib/engine/muhurtaAnalysis'
import {
  assembleMuhurtaWindows,
  formatWindowLabel,
  parseTimeWindow,
} from '@/lib/engine/muhurtaWindows'
import { MUHURTA_INTENTS } from '@/lib/engine/muhurtaIntents'
import { buildMuhurtaIcs, downloadIcs } from '@/lib/engine/muhurtaIcs'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import type { KaranaResult, NakshatraResult, TithiResult, VaraResult, YogaResult } from '@/lib/engine/nakshatra'
import type { GrahaId } from '@/types/astrology'

const MuhurtaTimeline = dynamic(
  () => import('@/components/ui/MuhurtaTimeline').then(m => m.MuhurtaTimeline),
  { ssr: false },
)

// ── Types ─────────────────────────────────────────────────────
interface DayPanchang {
  date: string
  vara: { name: string; lord: string; number: number }
  tithi: { name: string; paksha: string; number: number }
  nakshatra: { name: string; lord: string; pada: number; index: number; degree?: number }
  yoga: { name: string; quality: string; number?: number; percent?: number }
  karana: { name: string; isBhadra: boolean; type?: 'fixed' | 'movable'; number?: number }
  sunrise: string
  sunset: string
  rahuKalam: { start: string; end: string }
  gulikaKalam: { start: string; end: string }
  yamaganda?: { start: string; end: string }
  abhijitMuhurta: { start: string; end: string } | null
  brahmaMuhurta?: { start: string; end: string }
  durMuhurat?: [{ start: string; end: string }, { start: string; end: string }]
  godhuliMuhurat?: { start: string; end: string }
  moonLongitudeSidereal: number
}

interface MuhurtaResult {
  date: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  windows: string[]
  avoid: string[]
  reasons: string[]
  panchang: DayPanchang
  personal?: {
    taraBala: { name: string; score: number; desc: string }
    chandraBala: { position: number; score: number; desc: string }
  }
}

const PURPOSE_ICONS: Record<MuhurtaActivity, typeof Briefcase> = {
  BUSINESS: Briefcase,
  TRAVEL: Plane,
  REAL_ESTATE: Home,
  RELATIONSHIP: Heart,
  HEALTH: Stethoscope,
  SPIRITUAL: Flame,
  MARRIAGE: Heart,
  EDUCATION: BookOpen,
  GENERAL: Zap,
}

const PURPOSES = MUHURTA_ACTIVITIES.map(id => ({
  id,
  label: MUHURTA_ACTIVITY_LABELS[id],
  Icon: PURPOSE_ICONS[id],
}))

function fmtTimeFromDate(d: Date): string {
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
}

function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

const GRADE_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  A: { bg: 'rgba(78,205,196,0.15)', border: 'rgba(78,205,196,0.50)', text: 'var(--teal)' },
  B: { bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.40)', text: 'var(--text-gold)' },
  C: { bg: 'rgba(245,158,66,0.10)', border: 'rgba(245,158,66,0.30)', text: 'var(--amber)' },
  D: { bg: 'rgba(224,123,142,0.10)', border: 'rgba(224,123,142,0.35)', text: 'var(--rose)' },
}

function gradeFromLabel(label: string): 'A' | 'B' | 'C' | 'D' {
  if (label === 'Excellent') return 'A'
  if (label === 'Good') return 'B'
  if (label === 'Neutral') return 'C'
  return 'D'
}

function scorePanchang(
  p: DayPanchang,
  purpose: MuhurtaActivity,
  natal: { moonNak: number; moonSign: number },
): MuhurtaResult {
  const moonLon = p.moonLongitudeSidereal ?? (p.nakshatra.index * (360 / 27) + (p.nakshatra.degree ?? 0))
  const nakshatra: NakshatraResult = {
    index: p.nakshatra.index,
    name: p.nakshatra.name,
    shortName: p.nakshatra.name.slice(0, 3),
    pada: p.nakshatra.pada,
    lord: p.nakshatra.lord as GrahaId,
    degreeInNak: p.nakshatra.degree ?? 0,
    exactDegree: moonLon,
  }
  const yoga: YogaResult = {
    number: p.yoga.number ?? 1,
    name: p.yoga.name,
    quality: (p.yoga.quality as YogaResult['quality']) || 'neutral',
    percent: p.yoga.percent ?? 0,
  }
  const karana: KaranaResult = {
    number: p.karana.number ?? 1,
    name: p.karana.name,
    type: p.karana.type ?? 'movable',
    isBhadra: p.karana.isBhadra,
  }
  const tithi = p.tithi as TithiResult
  const vara = p.vara as VaraResult

  // Day-level: structural factors only (kalams are avoid windows, not whole-day flags)
  const result = analyzeMuhurta(
    purpose,
    {
      tithi,
      nakshatra,
      yoga,
      karana,
      vara,
      isRahuKalam: false,
      isGulikaKalam: false,
      isYamaganda: false,
      isAbhijit: !!p.abhijitMuhurta,
    },
    natal,
  )

  const rahu = parseTimeWindow(p.rahuKalam)!
  const gulika = parseTimeWindow(p.gulikaKalam)!
  const yamaganda = parseTimeWindow(p.yamaganda)
  const abhijit = parseTimeWindow(p.abhijitMuhurta)
  const sunrise = new Date(p.sunrise)
  const sunset = new Date(p.sunset)

  const assembled = assembleMuhurtaWindows({
    sunrise,
    sunset,
    rahuKalam: rahu,
    gulikaKalam: gulika,
    yamaganda,
    abhijitMuhurta: abhijit,
  })

  const windows = assembled.favorable.map(w => formatWindowLabel(w, fmtTimeFromDate))
  const avoid = assembled.avoid.map(w => formatWindowLabel(w, fmtTimeFromDate))

  const tara = calcTaraBala(natal.moonNak, p.nakshatra.index)
  const transitSign = Math.floor(moonLon / 30) + 1
  const chandra = calcChandraBala(natal.moonSign, transitSign)

  return {
    date: p.date,
    score: result.score,
    grade: gradeFromLabel(result.label),
    windows,
    avoid,
    reasons: result.factors,
    panchang: p,
    personal: {
      taraBala: { name: tara.name, score: tara.score, desc: tara.desc },
      chandraBala: { position: chandra.position, score: chandra.score, desc: chandra.desc },
    },
  }
}

function ResultCard({ result }: { result: MuhurtaResult }) {
  const [open, setOpen] = useState(false)
  const gc = GRADE_COLOR[result.grade]
  return (
    <div style={{
      background: gc.bg, border: `1px solid ${gc.border}`,
      borderRadius: 'var(--r-md)', overflow: 'hidden',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o) }}
        role="button"
        tabIndex={0}
        style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: gc.bg, border: `2px solid ${gc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: '1.2rem',
          fontWeight: 700, color: gc.text,
        }}>
          {result.grade}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {fmtDateShort(result.date)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            {result.panchang.tithi.name} · {result.panchang.nakshatra.name} · {result.panchang.yoga.name}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 80, height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${result.score}%`, background: gc.text, borderRadius: 99 }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: gc.text, fontWeight: 700 }}>
            {Math.round(result.score)}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', userSelect: 'none' }}>
          {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${gc.border}`, padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {result.windows.length > 0 && (
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>Auspicious windows</div>
              {result.windows.map(w => (
                <div key={w} style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', paddingLeft: 8 }}>{w}</div>
              ))}
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--rose)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>Avoid</div>
            {result.avoid.map(a => (
              <div key={a} style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', paddingLeft: 8 }}>{a}</div>
            ))}
          </div>
          {result.personal && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.4rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--surface-3)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase' }}>Tara Bala</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: result.personal.taraBala.score > 50 ? 'var(--teal)' : 'var(--rose)' }}>
                  {result.personal.taraBala.name}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{result.personal.taraBala.desc}</div>
              </div>
              <div style={{ padding: '0.5rem', background: 'var(--surface-3)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase' }}>Chandra Bala</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: result.personal.chandraBala.score > 50 ? 'var(--teal)' : 'var(--rose)' }}>
                  {result.personal.chandraBala.position}th Pos
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{result.personal.chandraBala.desc}</div>
              </div>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>
              Day factors (hora / choghadiya / panchaka on timeline above)
            </div>
            {result.reasons.map(r => (
              <div key={r} style={{
                fontSize: '0.75rem', fontFamily: 'var(--font-display)',
                color: 'var(--text-muted)',
              }}>{r}</div>
            ))}
          </div>
          <Link href={`/panchang?date=${result.date}`} style={{
            display: 'inline-block', fontSize: '0.72rem',
            color: 'var(--text-gold)', textDecoration: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 600,
          }}>
            Full Panchang for this day →
          </Link>
        </div>
      )}
    </div>
  )
}

export default function MuhurtaPage() {
  const { chart } = useChart()
  const today = todayIST()
  const [purpose, setPurpose] = useState<MuhurtaActivity>('GENERAL')
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(addDays(today, 30))
  const [results, setResults] = useState<MuhurtaResult[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [minGrade, setMinGrade] = useState<'A' | 'B' | 'C' | 'D'>('B')

  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  const [timelineData, setTimelineData] = useState<{ time: string; scores: Record<string, MuhurtaScore> }[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState<string | null>(null)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true)
    setTimelineError(null)
    try {
      const natalNak = chart?.grahas.find(g => g.id === 'Mo')?.nakshatraIndex
        ?? chart?.panchang?.nakshatra?.index
        ?? 0
      const natalSign = chart?.grahas.find(g => g.id === 'Mo')?.rashi ?? 1

      const params = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        tz: location.tz,
        natalNak: String(natalNak),
        natalSign: String(natalSign),
      })

      if (chart?.dashas?.vimshottari?.length) {
        const path = getDashaPathAt(chart.dashas.vimshottari, Date.now())
        if (path[0]?.lord) params.set('maha', path[0].lord)
        if (path[1]?.lord) params.set('antar', path[1].lord)
      }
      if (chart?.ashtakavarga?.sav?.length === 12) {
        params.set('sav', chart.ashtakavarga.sav.join(','))
      }

      const res = await fetch(`/api/muhurta/timeline?${params}`)
      const json = await res.json()
      if (!res.ok || json.success === false) {
        setTimelineData([])
        setTimelineError(json.error || (res.status === 403 ? 'Gold plan required for Muhurta timeline' : 'Failed to load timeline'))
        return
      }
      const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
      setTimelineData(data)
    } catch (e) {
      console.error(e)
      setTimelineData([])
      setTimelineError('Failed to load timeline')
    } finally {
      setTimelineLoading(false)
    }
  }, [location, chart])

  const avoidNowLabels = useMemo(() => {
    const now = Date.now()
    const labels: string[] = []
    for (const p of timelineData) {
      const score = p.scores?.[purpose]
      if (!score) continue
      const t = new Date(p.time).getTime()
      if (Math.abs(t - now) > 20 * 60 * 1000) continue
      for (const f of score.factors) {
        if (/Rahu Kalam|Yamaganda|Gulika|Grahan|Tyajya|Gandanta/i.test(f) && !labels.includes(f)) {
          labels.push(f.replace(/\s*\(.*?\)\s*/g, '').trim())
        }
      }
    }
    return labels.slice(0, 4)
  }, [timelineData, purpose])

  const exportCalendar = useCallback(() => {
    const events: { title: string; description?: string; start: Date; end: Date; location?: string }[] = []

    if (results.length > 0) {
      for (const r of results.slice(0, 10)) {
        const dayStart = new Date(r.date + 'T09:00:00')
        const dayEnd = new Date(r.date + 'T11:00:00')
        events.push({
          title: `Muhurta ${MUHURTA_ACTIVITY_LABELS[purpose]} · Grade ${r.grade}`,
          description: `${r.reasons.slice(0, 5).join('; ')}\nWindows: ${r.windows.join(', ')}`,
          start: dayStart,
          end: dayEnd,
          location: location.name,
        })
      }
    } else {
      const ranked = [...timelineData]
        .map(p => ({ time: p.time, score: p.scores?.[purpose] }))
        .filter((p): p is { time: string; score: MuhurtaScore } => !!p.score)
        .sort((a, b) => b.score.score - a.score.score)
        .slice(0, 5)
      for (const p of ranked) {
        const start = new Date(p.time)
        const end = new Date(start.getTime() + 30 * 60 * 1000)
        events.push({
          title: `Muhurta ${MUHURTA_ACTIVITY_LABELS[purpose]} · ${p.score.label}`,
          description: p.score.factors.slice(0, 8).join('; '),
          start,
          end,
          location: location.name,
        })
      }
    }

    if (events.length === 0) {
      setError('No windows to export yet — run Find Muhurta or wait for the timeline.')
      return
    }
    const ics = buildMuhurtaIcs(events, `Vedaansh · ${MUHURTA_ACTIVITY_LABELS[purpose]}`)
    downloadIcs(`vedaansh-muhurta-${purpose.toLowerCase()}.ics`, ics)
  }, [results, timelineData, purpose, location.name])

  const exportReport = useCallback(async () => {
    setError(null)
    try {
      const peakPoint = [...timelineData]
        .map(p => ({ time: p.time, score: p.scores?.[purpose] }))
        .filter((p): p is { time: string; score: MuhurtaScore } => !!p.score)
        .sort((a, b) => b.score.score - a.score.score)[0]

      const dashaPath = chart?.dashas?.vimshottari?.length
        ? getDashaPathAt(chart.dashas.vimshottari, Date.now())
        : []
      const personalNote = dashaPath.length
        ? `Current dasha: ${dashaPath.map(d => d.lord).join(' → ')}`
        : chart
          ? 'Personal Tara/Chandra bala applied from loaded chart.'
          : 'Load a birth chart for personal dasha & ashtakavarga overlays.'

      const res = await fetch('/api/muhurta/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: purpose,
          locationName: location.name,
          peak: peakPoint
            ? {
                time: peakPoint.time,
                score: {
                  score: peakPoint.score.score,
                  label: peakPoint.score.label,
                  factors: peakPoint.score.factors,
                },
              }
            : undefined,
          dayResults: results.map(r => ({
            date: r.date,
            score: r.score,
            grade: r.grade,
            windows: r.windows,
            avoid: r.avoid,
            reasons: r.reasons,
          })),
          personalNote,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Could not build report')
        return
      }
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setError('Could not build report')
    }
  }, [timelineData, purpose, location.name, results, chart])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  const findMuhurta = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResults([])
    setProgress(0)
    setSearched(true)

    const natal = {
      moonNak: chart?.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0,
      moonSign: chart?.grahas.find(g => g.id === 'Mo')?.rashi ?? 1,
    }

    const dates: string[] = []
    let d = fromDate
    while (d <= toDate && dates.length < 60) {
      dates.push(d)
      d = addDays(d, 1)
    }

    if (dates.length === 0) {
      setError('Invalid date range')
      setLoading(false)
      return
    }

    const scored: MuhurtaResult[] = []
    let fetchFailures = 0

    for (let i = 0; i < dates.length; i += 5) {
      const batch = dates.slice(i, i + 5)
      await Promise.all(batch.map(async (date) => {
        try {
          const res = await fetch(`/api/panchang?date=${date}&lat=${location.lat}&lng=${location.lng}&tz=${encodeURIComponent(location.tz)}`)
          const json = await res.json()
          if (json.success) {
            const result = scorePanchang(json.data as DayPanchang, purpose, natal)
            scored.push(result)
          } else {
            fetchFailures++
          }
        } catch {
          fetchFailures++
        }
      }))
      setProgress(Math.round(((i + batch.length) / dates.length) * 100))
    }

    if (scored.length === 0 && fetchFailures > 0) {
      setError('Could not load panchang for the selected range. Try again.')
      setLoading(false)
      setProgress(100)
      return
    }

    const minScoreMap: Record<'A' | 'B' | 'C' | 'D', number> = { A: 75, B: 55, C: 35, D: 0 }
    const minScore = minScoreMap[minGrade]
    const filtered = scored
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)

    setResults(filtered)
    setLoading(false)
    setProgress(100)
  }, [fromDate, toDate, purpose, minGrade, location, chart])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      <main className="muhurta-main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, color: 'var(--text-gold)', margin: 0 }}>
            Muhurta Intelligence
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={exportCalendar}
              className="btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
            >
              <CalendarPlus className="w-4 h-4" /> Add to calendar
            </button>
            <button
              type="button"
              onClick={exportReport}
              className="btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
            >
              <FileText className="w-4 h-4" /> Share report
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>Quick intents</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {MUHURTA_INTENTS.map(intent => (
              <button
                key={intent.id}
                type="button"
                title={intent.blurb}
                onClick={() => setPurpose(intent.activity)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--r-md)',
                  border: `1px solid ${purpose === intent.activity ? 'var(--border-bright)' : 'var(--border)'}`,
                  background: purpose === intent.activity ? 'var(--gold-faint)' : 'var(--surface-2)',
                  color: purpose === intent.activity ? 'var(--text-gold)' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {intent.label}
              </button>
            ))}
          </div>
        </div>

        <MuhurtaNowStrip
          activity={purpose}
          data={timelineData}
          loading={timelineLoading}
          avoidNow={avoidNowLabels}
        />

        {results[0]?.panchang?.sunrise && results[0]?.panchang?.sunset && (
          <DinmanMuhurtaStrip
            sunrise={results[0].panchang.sunrise}
            sunset={results[0].panchang.sunset}
          />
        )}

        <SanskarasReference />

        <section>
          <MuhurtaTimeline
            data={timelineData}
            loading={timelineLoading}
            error={timelineError}
            activity={purpose}
            onActivityChange={setPurpose}
          />
        </section>

        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: isMobile ? '1.25rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Find Auspicious Days
            </h2>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Day grades: tithi, nakshatra, yoga, karana, vara, Tara/Chandra. Timeline adds hora, choghadiya, panchaka, electional lagna, gandanta, tyajya, grahan yoga, dasha &amp; SAV when a chart is loaded.
            </p>
          </div>
          <div>
            <label style={{ fontSize: '0.72rem' }}>Purpose</label>
            <div className="muhurta-purpose-list">
              {PURPOSES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPurpose(id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    background: purpose === id ? 'rgba(201,168,76,0.15)' : 'var(--surface-2)',
                    border: `1px solid ${purpose === id ? 'var(--border-bright)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)', cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontSize: '0.8rem',
                    fontWeight: purpose === id ? 700 : 400,
                    color: purpose === id ? 'var(--text-gold)' : 'var(--text-secondary)',
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="muhurta-range-grid">
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: '0.72rem' }}>From</label>
              <input type="date" className="input" value={fromDate} min={today}
                onChange={e => setFromDate(e.target.value)} style={{ marginTop: '0.35rem' }} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: '0.72rem' }}>To (max 60 days)</label>
              <input type="date" className="input" value={toDate} min={fromDate}
                onChange={e => setToDate(e.target.value)} style={{ marginTop: '0.35rem' }} />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: '0.72rem' }}>Min grade</label>
              <select className="input" value={minGrade} onChange={e => setMinGrade(e.target.value as 'A' | 'B' | 'C' | 'D')} style={{ marginTop: '0.35rem' }}>
                <option value="A">A — Excellent only</option>
                <option value="B">B — Good & above</option>
                <option value="C">C — Average & above</option>
                <option value="D">D — All days</option>
              </select>
            </div>
          </div>
          <div style={{ maxWidth: isMobile ? '100%' : 400 }}>
            <LocationPicker value={location} onChange={setLocation} label="Location" autoGeolocate />
          </div>
          <button
            type="button"
            onClick={findMuhurta}
            disabled={loading}
            className="btn btn-primary muhurta-find-btn"
            style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem' }}
          >
            {loading
              ? <><span className="spin-loader" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Searching…</>
              : 'Find Muhurta'}
          </button>
        </div>

        {loading && (
          <div>
            <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gold)', borderRadius: 99, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.85rem 1rem',
            background: 'rgba(224,123,142,0.1)',
            border: '1px solid rgba(224,123,142,0.35)',
            borderRadius: 'var(--r-md)',
            color: 'var(--rose)',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        {!loading && searched && !error && results.length === 0 && (
          <div style={{
            padding: '1.25rem',
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}>
            No days met the minimum grade in this range. Try lowering the min grade or expanding the dates.
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {results.map(r => <ResultCard key={r.date} result={r} />)}
          </div>
        )}
      </main>
    </div>
  )
}
