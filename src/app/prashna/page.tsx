'use client'
/**
 * src/app/prashna/page.tsx
 * Advanced Krishneeyam Horary Astrology Dashboard
 * Based on "Krishneeyam" by Sri Krishna Acharya (~11th c. AD)
 */

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, NAKSHATRA_HI, RASHI_HI } from '@/i18n/jyotish'
import { dignityText } from '@/lib/engine/divisionalLang'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { Check, Lightbulb, Lock, X } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'
import type { ChartOutput, ChartStyle, Rashi, UserPlan } from '@/types/astrology'
import { useChartStyle } from '@/components/providers/ChartStyleProvider'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { Button } from '@/components/ui/primitives/Button'
import { getKPSubLord } from '@/lib/engine/nakshatraAdvanced'
import {
  runKrishneeyamPrashna,
  RASHI_NAMES,
  SIGN_LORDS,
  type PrashnaCategory,
  type KrishneeyamResult,
} from '@/lib/engine/krishneeyam'
import {
  runSatpanchasika,
  SATPANCHASIKA_QUESTIONS,
  SATPANCHASIKA_QUESTION_GROUPS,
  type ContestRole,
  type SatpanchasikaQuestion,
  type SatpanchasikaReading,
  type SatpanchasikaVerdict,
} from '@/lib/engine/satpanchasikaEngine'
import { runVedicPrashna, VEDIC_TOPICS, type VedicPrashnaReading, type VedicTopic } from '@/lib/engine/vedicPrashna'
import { analyseLagnaStability, type StabilityResult } from '@/lib/engine/prashnaStability'
import { SatpanchasikaPanel, VERDICT_STYLE } from '@/components/prashna/SatpanchasikaPanel'
import { VedicPrashnaPanel } from '@/components/prashna/VedicPrashnaPanel'
import { SatpanchasikaReference } from '@/components/prashna/SatpanchasikaReference'

const ChakraSelector = dynamic(
  () => import('@/components/chakra/ChakraSelector').then(m => m.ChakraSelector),
  { ssr: false },
)

type KPMode = 'vedic' | 'kp' | 'krishneeyam' | 'satpanchasika'
type HouseReference = 'udaya' | 'arudha'
type AroodhaMode = 'auto_lagna' | 'auto_al' | 'manual'

/** Free plan may use Satpanchasika only; Kerala / Vedic / KP require Gold+. */
const PAID_PRASHNA_MODES = new Set<KPMode>(['krishneeyam', 'vedic', 'kp'])

const CATEGORY_ICONS: Record<PrashnaCategory, string> = {
  yes_no: '⚖️', when: '⏰', what: '🔍', who: '🕵️', lost_article: '💎',
  health: '🏥', travel: '✈️', pregnancy: '👶', marriage: '💍',
  house_query: '🏠', spirit: '👁️', intercourse: '🌹', food: '🍽️',
  lawsuit: '⚖️', exam: '🎓', general: '🌟',
}

// Keyword → question map for the question auto-suggest chip (first match wins by order)
const SAT_QUESTION_KEYWORDS: Array<[SatpanchasikaQuestion, RegExp]> = [
  ['marriage', /\b(marry|marriage|wedding|spouse|betroth|alliance)\b/i],
  ['child_pregnancy', /\b(boy|girl|son|daughter|child|baby|pregnan\w*|conceive|expecting)\b/i],
  ['lost_item', /\b(lost|missing item|misplaced|stolen|thief|theft|find my|where is my)\b/i],
  ['patient', /\b(ill|illness|sick|disease|recover|cure|patient|surgery|operation)\b/i],
  ['money', /\b(money|wealth|loan|debt|finance|income|profit|investment|gain)\b/i],
  ['position', /\b(job|promotion|salary|post|position|appointment)\b/i],
  ['settlement', /\b(reconcil\w*|settle\w*|peace|patch up|make up|compromise)\b/i],
  ['contest', /\b(win|victory|defeat|lawsuit|court|litigation|competition|election|bid|tender|negotiation)\b/i],
  ['opponent', /\b(enemy|rival|opponent|attack|competitor)\b/i],
  ['go_abroad', /\b(abroad|foreign|overseas|emigrat\w*|visa|migrate)\b/i],
  ['traveller_safe', /\b(safe|safety|is .* okay|is .* alright)\b/i],
  ['traveller_return', /\b(return|come back|back home|coming back|traveller|traveler)\b/i],
  ['rain', /\b(rain|monsoon|drought)\b/i],
]

/** Best-guess question type from the free text, or null if nothing matches. */
function suggestSatQuestion(question: string): SatpanchasikaQuestion | null {
  const q = question.trim()
  if (q.length < 3) return null
  for (const [type, re] of SAT_QUESTION_KEYWORDS) {
    if (re.test(q)) return type
  }
  return null
}

const SAT_HOUSES = ['Self', 'Wealth', 'Siblings, courage', 'Home, mother', 'Children, intellect', 'Rivals, illness', 'Partner', 'Danger, longevity', 'Fortune, dharma', 'Work, status', 'Gains', 'Loss, foreign lands']

const SAT_HISTORY_VERDICT: Record<SatpanchasikaVerdict, string> = {
  favourable: 'YES', with_difficulty: 'HARD', leans_unfavourable: 'LEANS NO', unfavourable: 'NO',
  no_change: 'STILL', indication_only: 'NOTES', insufficient: 'UNCLEAR',
}

const RASHI_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}. ${RASHI_NAMES[i + 1]}` }))

function formatCaptureDateTime(date: Date, tz: string) {
  return {
    birthDate: formatInTimeZone(date, tz, 'yyyy-MM-dd'),
    birthTime: formatInTimeZone(date, tz, 'HH:mm:ss'),
  }
}

const BODY_PARTS = [
  { value: '', label: '— Not specified —' },
  { value: 'chest', label: 'Chest ✅' }, { value: 'hair', label: 'Hair ✅' },
  { value: 'nail', label: 'Nails ✅' }, { value: 'teeth', label: 'Teeth ✅' },
  { value: 'armpit', label: 'Armpit ✅' }, { value: 'breast', label: 'Breast ✅' },
  { value: 'hand', label: 'Hand / Palm ✅' }, { value: 'navel', label: 'Navel ✅' },
  { value: 'thigh', label: 'Thigh ✅' }, { value: 'head', label: 'Head ✅' },
  { value: 'foot', label: 'Foot ✅' }, { value: 'back_neck', label: 'Back of neck ⚠️' },
  { value: 'eyebrow', label: 'Eyebrow ⚠️' }, { value: 'nose', label: 'Nose ⚠️' },
  { value: 'finger', label: 'Finger ⚠️' }, { value: 'ankle', label: 'Ankle ⚠️' },
  { value: 'face', label: 'Face ❌' }, { value: 'knee', label: 'Knee ❌' },
  { value: 'belly', label: 'Belly ❌' }, { value: 'forehead', label: 'Forehead ❌' },
]

// ─── Small reusable UI pieces ─────────────────────────────────────────────────

const Chip = ({ label, value, color = 'var(--text-gold)', bg = 'var(--surface-2)' }: { label: string; value: string; color?: string; bg?: string }) => (
  <div style={{ background: bg, borderRadius: 6, padding: '0.35rem 0.65rem', border: '1px solid var(--border-soft)', minWidth: 0 }}>
    <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: '0.8rem', fontWeight: 700, color, lineHeight: 1.2, wordBreak: 'break-word' }}>{value}</div>
  </div>
)

const SectionCard = ({ title, icon, accent = 'var(--gold)', children }: { title: string; icon: string; accent?: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--surface-1)', borderRadius: 10, border: `1px solid var(--border-soft)`, borderLeft: `3px solid ${accent}`, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.9rem', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-2)' }}>
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent }}>{title}</span>
    </div>
    <div style={{ padding: '0.75rem' }}>{children}</div>
  </div>
)


const BulletList = ({ items }: { items: string[] }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.73rem', lineHeight: 1.5 }}>
        <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }}>◆</span>
        <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
      </div>
    ))}
  </div>
)

const IndicatorRow = ({ label, value, ok }: { label: string; value: string; ok: boolean | null }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border-soft)', gap: '0.5rem' }}>
    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      {ok !== null && <span style={{ fontSize: '0.75rem' }}>{ok ? '✅' : '❌'}</span>}
      <span style={{ fontSize: '0.73rem', fontWeight: 600, color: ok === true ? 'var(--teal)' : ok === false ? 'var(--rose)' : 'var(--gold)', textAlign: 'right' }}>{value}</span>
    </div>
  </div>
)

// ─── Nakshatra Dial ──────────────────────────────────────────────────────────
const NAK_NAMES = ['Ash','Bha','Kri','Roh','Mri','Ard','Pun','Pus','Ash','Mag','PP','UP','Has','Chi','Swa','Vis','Anu','Jye','Mul','PAs','UAs','Sra','Dha','Sha','PBh','UBh','Rev']
const NakshatraDial = ({ moonNakIdx, moonDeg }: { moonNakIdx: number; moonDeg: number }) => {
  const size = 160, cx = 80, cy = 80, r = 68, ir = 44
  const total = 27
  const sliceAngle = (2 * Math.PI) / total
  const moonAngle = -Math.PI / 2 + (moonNakIdx + (moonDeg % (360/27)) / (360/27)) / total * 2 * Math.PI
  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {Array.from({ length: total }, (_, i) => {
        const a0 = -Math.PI / 2 + i * sliceAngle
        const a1 = a0 + sliceAngle
        const active = i === moonNakIdx
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
        const xi0 = cx + ir * Math.cos(a0), yi0 = cy + ir * Math.sin(a0)
        const xi1 = cx + ir * Math.cos(a1), yi1 = cy + ir * Math.sin(a1)
        const d = `M${xi0},${yi0} L${x0},${y0} A${r},${r} 0 0,1 ${x1},${y1} L${xi1},${yi1} A${ir},${ir} 0 0,0 ${xi0},${yi0} Z`
        const mid = (a0 + a1) / 2
        const tx = cx + (r + ir) / 2 * Math.cos(mid), ty = cy + (r + ir) / 2 * Math.sin(mid)
        return (
          <g key={i}>
            <path d={d} fill={active ? 'var(--gold)' : i % 9 === 0 ? 'var(--surface-3)' : 'var(--surface-2)'} stroke="var(--border)" strokeWidth={0.5} />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={active ? 5.5 : 4.5} fontWeight={active ? 700 : 400} fill={active ? 'var(--bg-page)' : 'var(--text-muted)'}>{NAK_NAMES[i]}</text>
          </g>
        )
      })}
      <circle cx={cx + (ir - 4) * Math.cos(moonAngle)} cy={cy + (ir - 4) * Math.sin(moonAngle)} r={5} fill="var(--gold)" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={8} fontWeight={700} fill="var(--text-gold)">🌙</text>
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize={6.5} fill="var(--text-muted)">{NAK_NAMES[moonNakIdx]}</text>
    </svg>
  )
}

// ─── History types ────────────────────────────────────────────────────────────
interface HistoryEntry {
  id: string
  question: string
  category: PrashnaCategory
  verdict: string
  confidence: number
  headline: string
  location: string
  ts: number
  /** Which system read it; absent on older entries. */
  system?: string
  /** What actually happened, marked later by the user. */
  outcome?: 'hit' | 'miss'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PrashnaPage() {
  const t = useTranslations('prashna')
  const { lang } = useLang()
  const u = useTranslations('prashna.ui')
  const hi = lang === 'hi'
  /** Sign name in the page language. */
  const rn = (r: number) => (hi ? RASHI_HI[r as Rashi] : RASHI_NAMES[r]) ?? String(r)
  /** Planet given as an id or an English name, shown in the page language. */
  const planetHi = useCallback((v: string) => {
    if (!hi) return v
    const byName: Record<string, string> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' }
    const id = (byName[v] ?? v) as keyof typeof GRAHA_HI
    return GRAHA_HI[id] ?? v
  }, [hi])
  const boldTag = { b: (chunks: React.ReactNode) => <strong>{chunks}</strong> }
  const goldTag = { b: (chunks: React.ReactNode) => <strong style={{ color: 'var(--gold)' }}>{chunks}</strong> }
  const { data: session } = useSession()
  const userPlan = ((session?.user as { plan?: UserPlan } | undefined)?.plan ?? 'free') as UserPlan
  const canUsePaidModes = planMeetsUiGate(userPlan, 'gold')

  const [now, setNow] = useState(new Date())
  const [frozen, setFrozen] = useState(false)
  const [frozenAt, setFrozenAt] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  const [chart, setChart] = useState<ChartOutput | null>(null)
  const [loading, setLoading] = useState(false)
  const { chartStyle: style, setChartStyle: setStyle } = useChartStyle()
  const [varga, setVarga] = useState<'D1' | 'D9'>('D1')
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [chartSize, setChartSize] = useState(420)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['core', 'timing', 'category']))
  const [mode, setMode] = useState<KPMode>('satpanchasika')
  const modeLocked = !canUsePaidModes && PAID_PRASHNA_MODES.has(mode)
  const [kpNumber, setKpNumber] = useState<number | ''>('')
  const [category, setCategory] = useState<PrashnaCategory>('yes_no')
  const [satQuestion, setSatQuestion] = useState<SatpanchasikaQuestion>('work')
  const [satHouse, setSatHouse] = useState(1)
  const [vedicTopic, setVedicTopic] = useState<VedicTopic>('general')
  const [useCustomTime, setUseCustomTime] = useState(false)
  const [customTime, setCustomTime] = useState('')
  const [contestRole, setContestRole] = useState<ContestRole>('defender')
  const [isRainySeason, setIsRainySeason] = useState(false)
  const [houseReference, setHouseReference] = useState<HouseReference>('udaya')
  const [aroodhaMode, setAroodhaMode] = useState<AroodhaMode>('auto_lagna')
  const [aroodha, setAroodha] = useState<number | ''>('')
  const [questionText, setQuestionText] = useState('')
  const [bodyTouch, setBodyTouch] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const savedHistoryIdRef = useRef<string | null>(null)

  // Load history on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('prashna_history')
      if (saved) setHistory(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const saveToHistory = useCallback((entry: HistoryEntry) => {
    if (savedHistoryIdRef.current === entry.id) return
    savedHistoryIdRef.current = entry.id
    setHistory(prev => {
      if (prev.some(h => h.id === entry.id)) return prev
      const next = [entry, ...prev].slice(0, 50) // keep last 50
      try { localStorage.setItem('prashna_history', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const toggleSection = (id: string) => setExpandedSections(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      setChartSize(mobile ? Math.min(window.innerWidth - 48, 380) : 420)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setMounted(true)
    const t = setInterval(() => {
      const n = new Date()
      setNow(n)
      if (frozenAt) setElapsed(Math.floor((n.getTime() - frozenAt.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [frozenAt])

  const calculateChart = useCallback(async (targetDate: Date, wallClock?: { birthDate: string; birthTime: string }) => {
    setLoading(true)
    setError(null)
    const { birthDate, birthTime } = wallClock ?? formatCaptureDateTime(targetDate, location.tz)
    try {
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: t('page.chartName'),
          birthDate,
          birthTime,
          birthPlace: location.name,
          latitude: location.lat, longitude: location.lng, timezone: location.tz,
          prashnaNumber: kpNumber === '' ? undefined : kpNumber,
          settings: { ayanamsha: 'lahiri', houseSystem: 'whole_sign' }
        })
      })
      const json = await res.json()
      if (json.success) {
        setChart(json.data)
      } else {
        setError(json.error ?? t('page.calcFailed'))
        setFrozen(false)
        setFrozenAt(null)
        setElapsed(0)
        savedHistoryIdRef.current = null
      }
    } catch (err) {
      console.error('Prashna error:', err)
      setError(t('page.network'))
      setFrozen(false)
      setFrozenAt(null)
      setElapsed(0)
      savedHistoryIdRef.current = null
    } finally { setLoading(false) }
  }, [location, kpNumber, t])

  const handleAction = () => {
    if (frozen) {
      setFrozen(false)
      setChart(null)
      setFrozenAt(null)
      setElapsed(0)
      setError(null)
      savedHistoryIdRef.current = null
    } else {
      if (modeLocked) return
      const captured = new Date()
      const past = useCustomTime && customTime
        ? { birthDate: customTime.slice(0, 10), birthTime: `${customTime.slice(11, 16)}:00` }
        : undefined
      if (useCustomTime && !past) {
        setError(t('page.needTime'))
        return
      }
      setFrozen(true)
      setFrozenAt(captured)
      setElapsed(0)
      calculateChart(captured, past)
    }
  }

  const selectMode = (m: KPMode) => {
    if (frozen) return
    setMode(m)
  }

  const arudhaLagnaRashi = chart?.arudhas?.AL

  const resolvedAroodhaRashi = useMemo((): Rashi | null => {
    if (!chart) return null
    if (aroodhaMode === 'manual') return aroodha === '' ? null : Number(aroodha) as Rashi
    if (aroodhaMode === 'auto_al' && arudhaLagnaRashi) return arudhaLagnaRashi
    return chart.lagnas.ascRashi
  }, [chart, aroodhaMode, aroodha, arudhaLagnaRashi])

  const krishneeyamResult = useMemo((): KrishneeyamResult | null => {
    if (!chart || mode !== 'krishneeyam') return null
    const sun = chart.grahas.find(g => g.id === 'Su')
    const moon = chart.grahas.find(g => g.id === 'Mo')
    if (!sun || !moon) return null
    const houseRefRashi = houseReference === 'arudha' && arudhaLagnaRashi
      ? arudhaLagnaRashi
      : chart.lagnas.ascRashi
    return runKrishneeyamPrashna({
      lagnaRashi: chart.lagnas.ascRashi, lagnaDegreeFull: chart.lagnas.ascDegree,
      lagnaSignDegree: chart.lagnas.ascDegree % 30,
      sunRashi: sun.rashi, sunDegreeFull: sun.totalDegree,
      moonRashi: moon.rashi, moonDegreeFull: moon.totalDegree,
      moonDignity: moon.dignity, moonIsRetro: moon.isRetro, moonIsCombust: moon.isCombust,
      grahas: chart.grahas, tithiNumber: chart.panchang.tithi.number,
      tithiPaksha: chart.panchang.tithi.paksha as 'shukla' | 'krishna',
      varaDayNumber: chart.panchang.vara.number, nakshatraIndex: chart.panchang.nakshatra.index,
      aroodhaRashi: resolvedAroodhaRashi,
      category, bodyTouchPart: bodyTouch || undefined,
      houseReferenceRashi: houseRefRashi,
      houseReferenceType: houseReference,
    }, lang)
  }, [chart, mode, resolvedAroodhaRashi, category, bodyTouch, houseReference, arudhaLagnaRashi, lang])

  const satResult = useMemo((): { reading: SatpanchasikaReading | null; error: string | null } => {
    if (!chart || mode !== 'satpanchasika') return { reading: null, error: null }
    try {
      return {
        reading: runSatpanchasika(chart, {
          question: satQuestion,
          contestRole,
          house: satHouse,
          season: isRainySeason ? 'rainy' : undefined,
        }),
        error: null,
      }
    } catch (err) {
      console.error('Satpanchasika error:', err)
      return { reading: null, error: t('page.unreadable') }
    }
  }, [chart, mode, satQuestion, contestRole, satHouse, isRainySeason, t])
  const satpanchasikaReading = satResult.reading

  const vedicResult = useMemo((): { reading: VedicPrashnaReading | null; error: string | null } => {
    if (!chart || mode !== 'vedic' || modeLocked) return { reading: null, error: null }
    try {
      return { reading: runVedicPrashna(chart, vedicTopic, lang), error: null }
    } catch (err) {
      console.error('Vedic prashna error:', err)
      return { reading: null, error: t('page.unreadable') }
    }
  }, [chart, mode, modeLocked, vedicTopic, lang, t])
  const vedicReading = vedicResult.reading

  const stability = useMemo((): StabilityResult | null => {
    if (!chart) return null
    try {
      if (mode === 'satpanchasika') {
        return analyseLagnaStability(chart, c => VERDICT_STYLE[runSatpanchasika(c, { question: satQuestion, contestRole, house: satHouse, season: isRainySeason ? 'rainy' : undefined }).verdict].label)
      }
      if (mode === 'vedic' && !modeLocked) {
        return analyseLagnaStability(chart, c => VERDICT_STYLE[runVedicPrashna(c, vedicTopic, lang).verdict].label)
      }
    } catch { /* the reading itself reports the error */ }
    return null
  }, [chart, mode, modeLocked, satQuestion, contestRole, satHouse, isRainySeason, vedicTopic, lang])

  const setHistoryOutcome = (id: string, outcome: 'hit' | 'miss') => setHistory(prev => {
    const next = prev.map(h => h.id === id ? { ...h, outcome: h.outcome === outcome ? undefined : outcome } : h)
    try { localStorage.setItem('prashna_history', JSON.stringify(next)) } catch { /* ignore */ }
    return next
  })
  const marked = history.filter(h => h.outcome)
  const hits = marked.filter(h => h.outcome === 'hit').length

  const chartLagnaSource = houseReference === 'arudha' ? 'arudha' : 'natal'

  const rulingPlanets = useMemo(() => {
    if (!chart) return []
    const moon = chart.grahas.find(g => g.id === 'Mo')
    if (!moon) return []
    const ascLord = SIGN_LORDS[chart.lagnas.ascRashi]
    const moonStar = getKPSubLord(moon.totalDegree).nakshatraLord
    const ascStar = getKPSubLord(chart.lagnas.ascDegree).nakshatraLord
    return [
      { label: t('page.dayLord'), value: planetHi(String(chart.panchang.vara.lord)) },
      { label: t('page.moonSignLord'), value: planetHi(String(SIGN_LORDS[moon.rashi])) },
      { label: t('page.moonStarLord'), value: planetHi(String(moonStar)) },
      { label: t('page.lagnaLord'), value: planetHi(String(ascLord)) },
      { label: t('page.lagnaStarLord'), value: planetHi(String(ascStar)) },
    ]
  }, [chart, t, planetHi])

  // Save to history when result is ready
  useEffect(() => {
    if (!krishneeyamResult || !frozen || !frozenAt) return
    const entry: HistoryEntry = {
      id: frozenAt.toISOString(),
      question: questionText,
      category,
      verdict: krishneeyamResult.verdict,
      confidence: krishneeyamResult.confidence,
      headline: krishneeyamResult.headline,
      location: location.name,
      ts: frozenAt.getTime(),
    }
    saveToHistory(entry)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [krishneeyamResult])

  useEffect(() => {
    if (!satpanchasikaReading || !frozen || !frozenAt) return
    const entry: HistoryEntry = {
      id: frozenAt.toISOString(),
      question: questionText ? `[${satpanchasikaReading.questionLabel}] ${questionText}` : satpanchasikaReading.questionLabel,
      category: 'general',
      verdict: SAT_HISTORY_VERDICT[satpanchasikaReading.verdict],
      confidence: satpanchasikaReading.clarity,
      headline: satpanchasikaReading.headline,
      location: location.name,
      ts: frozenAt.getTime(),
      system: 'Satpanchasika',
    }
    saveToHistory(entry)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satpanchasikaReading])

  useEffect(() => {
    if (!vedicReading || !frozen || !frozenAt) return
    saveToHistory({
      id: frozenAt.toISOString(),
      question: questionText ? `[${vedicReading.topicLabel}] ${questionText}` : vedicReading.topicLabel,
      category: 'general',
      verdict: SAT_HISTORY_VERDICT[vedicReading.verdict],
      confidence: vedicReading.clarity,
      headline: vedicReading.headline,
      location: location.name,
      ts: frozenAt.getTime(),
      system: 'Vedic',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vedicReading])

  const formatElapsed = (sec: number) => {
    if (sec < 60) return `${sec}s`
    if (sec < 3600) return `${Math.floor(sec/60)}m ${sec%60}s`
    return `${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m`
  }

  const vc = krishneeyamResult?.verdict
  const verdictColor = vc === 'YES' ? 'var(--teal)' : vc === 'NO' ? 'var(--rose)' : vc === 'DELAYED' ? 'var(--amber)' : 'var(--gold)'

  const Collapsible = ({ id, title, icon, accent = 'var(--gold)', children }: { id: string; title: string; icon: string; accent?: string; children: React.ReactNode }) => {
    const open = expandedSections.has(id)
    return (
      <div style={{ background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-soft)', borderLeft: `3px solid ${accent}`, overflow: 'hidden' }}>
        <button onClick={() => toggleSection(id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', borderBottom: open ? '1px solid var(--border-soft)' : 'none' }}>
          <span style={{ fontSize: '1rem' }}>{icon}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent, flex: 1, textAlign: 'left' }}>{title}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
        </button>
        {open && <div style={{ padding: '0.75rem' }}>{children}</div>}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)', padding: '0.7rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/" style={{ fontSize: '1.4rem', textDecoration: 'none' }}>🔮</Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, letterSpacing: '0.04em' }}>{t('page.title')}</h1>
              <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 999, background: 'var(--gold-faint)', color: 'var(--gold)', fontWeight: 700, border: '1px solid var(--gold-dim)' }}>
                {t(`page.badge.${mode}`)}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.63rem', color: 'var(--text-muted)' }}>
              {t(`page.subtitle.${mode}`)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {mounted && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: frozen ? 'var(--rose)' : 'var(--teal)' }}>{now.toLocaleTimeString()}</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
              {frozen ? u('sinceBadge', { elapsed: formatElapsed(elapsed) }) : u('liveBadge')}
            </span>
          </div>}
          <button onClick={() => setShowHistory(h => !h)} title={t('page.historyTitle')}
            style={{ padding: '0.35rem 0.6rem', borderRadius: 7, border: '1px solid var(--border)', background: showHistory ? 'var(--gold-faint)' : 'var(--surface-2)', cursor: 'pointer', fontSize: '0.85rem' }}>
            📋 {history.length}
          </button>
          {frozen && chart && <button onClick={() => window.print()} title={t('page.printTitle')}
            style={{ padding: '0.35rem 0.6rem', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontSize: '0.85rem' }}>
            🖨️
          </button>}
          <ThemeToggle />
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 1600, width: '100%', margin: '0 auto', padding: isMobile ? '1rem' : '1.25rem 1.5rem 4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* ── Input Panel ──────────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

          {/* Row 1: Mode + Question + Location + Action */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Mode */}
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0, flexWrap: 'wrap', maxWidth: '100%' }}>
              {(['satpanchasika', 'krishneeyam', 'vedic', 'kp'] as KPMode[]).map(m => {
                const locked = !canUsePaidModes && PAID_PRASHNA_MODES.has(m)
                return (
                  <button key={m} onClick={() => selectMode(m)} disabled={frozen}
                    className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      fontSize: '0.68rem', fontWeight: mode === m ? 700 : 400, whiteSpace: 'nowrap',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      opacity: locked && mode !== m ? 0.85 : 1,
                    }}>
                    {locked && <Lock size={11} aria-hidden />}
                    {u(`modeBtn.${m}`)}
                  </button>
                )
              })}
            </div>
            {mode === 'kp' && !modeLocked && (
              <input type="number" className="input" placeholder={t('page.kpPlaceholder')} value={kpNumber} style={{ width: 160 }}
                onChange={e => setKpNumber(e.target.value === '' ? '' : Number(e.target.value))} disabled={frozen} />
            )}
            {/* Question */}
            <input type="text" className="input" placeholder={`✍️ ${t('page.questionPlaceholder')}`}
              value={questionText} onChange={e => setQuestionText(e.target.value)} disabled={frozen || modeLocked}
              style={{ flex: 1, minWidth: 180, fontSize: '0.82rem' }} />
            {/* Location */}
            <div style={{ flexShrink: 0, opacity: frozen || modeLocked ? 0.55 : 1, pointerEvents: frozen || modeLocked ? 'none' : 'auto' }}>
              <LocationPicker value={location} onChange={setLocation} label={u('locationLabel')} />
            </div>
            {/* Action */}
            <button onClick={handleAction}
              className={`btn ${frozen ? 'btn-secondary' : 'btn-primary'}`}
              disabled={!frozen && modeLocked}
              style={{ height: 40, fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0, whiteSpace: 'nowrap', opacity: !frozen && modeLocked ? 0.55 : 1 }}>
              {frozen ? u('newReadingBtn') : u('captureBtn')}
            </button>
          </div>

          {!modeLocked && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <input type="checkbox" checked={useCustomTime} disabled={frozen} onChange={e => setUseCustomTime(e.target.checked)} />
                {t('page.pastQuestion')}
              </label>
              {useCustomTime && (
                <input type="datetime-local" className="input" aria-label={t('page.pastAria')}
                  value={customTime} disabled={frozen} onChange={e => setCustomTime(e.target.value)} style={{ fontSize: '0.78rem', maxWidth: '100%' }} />
              )}
              {useCustomTime && <span style={{ color: 'var(--text-muted)' }}>{t('page.pastHint')}</span>}
            </div>
          )}

          {mode === 'vedic' && !modeLocked && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('page.matter')} <span style={{ color: 'var(--gold)' }}>· {t('page.matterHint')}</span>
              </div>
              <div role="radiogroup" aria-label={t('page.matterAria')} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.35rem' }}>
                {VEDIC_TOPICS.map(topic => {
                  const active = vedicTopic === topic.id
                  return (
                    <button key={topic.id} type="button" role="radio" aria-checked={active} onClick={() => setVedicTopic(topic.id)}
                      style={{ textAlign: 'left', padding: '0.4rem 0.55rem', borderRadius: 8, cursor: 'pointer', border: active ? '2px solid var(--gold)' : '1px solid var(--border-soft)', background: active ? 'var(--gold-faint)' : 'var(--surface-2)' }}>
                      <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: active ? 'var(--text-gold)' : 'var(--text-secondary)', lineHeight: 1.3 }}>{t(`topics.${topic.id}.label`)}</span>
                      <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: 1 }}>{t(`topics.${topic.id}.hint`)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {modeLocked && (
            <div style={{
              padding: '0.85rem 1rem',
              background: 'var(--surface-3)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--gold-faint)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.55rem',
            }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <Lock size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
                {t('page.goldRequired', { mode: t(`page.mode.${mode}`) })}
              </div>
              <Link href="/pricing" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm">{t('page.viewPlans')}</Button>
              </Link>
            </div>
          )}

          {/* Row 2: Categories + Aroodha + Body Touch (Krishneeyam only) */}
          {mode === 'krishneeyam' && !modeLocked && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* House reference: Udaya vs Arudha Lagna */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.55rem 0.7rem', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                <div style={{ flex: '1 1 140px' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{t('page.houseRefTitle')}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {u('houseRefHint')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {([
                    { id: 'udaya' as const, label: t('page.udaya'), sub: chart ? rn(chart.lagnas.ascRashi) : '—' },
                    { id: 'arudha' as const, label: t('page.arudha'), sub: chart && arudhaLagnaRashi ? rn(arudhaLagnaRashi) : '—' },
                  ]).map(ref => (
                    <button key={ref.id} type="button" disabled={frozen} onClick={() => setHouseReference(ref.id)}
                      style={{
                        border: houseReference === ref.id ? '2px solid var(--gold)' : '1px solid var(--border-soft)',
                        borderRadius: 8, padding: '0.4rem 0.65rem', cursor: frozen ? 'not-allowed' : 'pointer',
                        background: houseReference === ref.id ? 'var(--gold-faint)' : 'var(--surface-1)',
                        minWidth: 108, textAlign: 'left',
                      }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: houseReference === ref.id ? 'var(--gold)' : 'var(--text-secondary)' }}>{ref.label}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{ref.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Category picker */}
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>{t('page.queryCategory')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(8, 1fr)', gap: '4px' }}>
                  {(Object.keys(CATEGORY_ICONS) as PrashnaCategory[]).map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} disabled={frozen}
                      title={t(`category.${cat}`)}
                      style={{
                        border: category === cat ? `2px solid ${verdictColor}` : '1px solid var(--border-soft)',
                        borderRadius: 7, padding: '0.3rem 0.15rem',
                        background: category === cat ? `${verdictColor}18` : 'var(--surface-2)',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        transition: 'all 0.15s',
                      }}>
                      <span style={{ fontSize: '1rem' }}>{CATEGORY_ICONS[cat]}</span>
                      <span style={{ fontSize: '0.48rem', color: category === cat ? verdictColor : 'var(--text-muted)', fontWeight: 600, lineHeight: 1.2, textAlign: 'center' }}>
                        {t(`category.${cat}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aroodha (Sparsha) + Body Touch */}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 175 }}>
                  <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{t('page.aroodhaTitle')}</label>
                  <select className="input" value={aroodhaMode} disabled={frozen}
                    onChange={e => {
                      const m = e.target.value as AroodhaMode
                      setAroodhaMode(m)
                      if (m !== 'manual') setAroodha('')
                    }}>
                    <option value="auto_lagna">{t('page.aroodhaSameUdaya')}</option>
                    <option value="auto_al">{t('page.aroodhaSameAl')}</option>
                    <option value="manual">{t('page.aroodhaManual')}</option>
                  </select>
                  {aroodhaMode === 'manual' && (
                    <select className="input" value={aroodha} disabled={frozen} style={{ marginTop: 4 }}
                      onChange={e => setAroodha(e.target.value === '' ? '' : Number(e.target.value))}>
                      <option value="">{t('page.selectSign')}</option>
                      {RASHI_OPTIONS.map(r => <option key={r.value} value={r.value}>{hi ? `${r.value}. ${rn(r.value)}` : r.label}</option>)}
                    </select>
                  )}
                  <p style={{ fontSize: '0.56rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    {aroodhaMode === 'manual' ? u('aroodhaManualHint') : resolvedAroodhaRashi && chart ? u('aroodhaUsing', { sign: rn(resolvedAroodhaRashi) }) : u('aroodhaHint')}
                  </p>
                </div>
                <div style={{ minWidth: 155 }}>
                  <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{t('page.bodyTouch')}</label>
                  <select className="input" value={bodyTouch} disabled={frozen} onChange={e => setBodyTouch(e.target.value)}>
                    {BODY_PARTS.map(b => <option key={b.value} value={b.value}>{hi ? `${t(`body.${b.value || 'none'}`)} ${b.label.match(/[✅⚠️❌]+$/u)?.[0] ?? ''}`.trim() : b.label}</option>)}
                  </select>
                  <p style={{ fontSize: '0.56rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{t('page.bodyHint')}</p>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Row 2b: Satpanchasika question picker */}
          {mode === 'satpanchasika' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {u('questionType')} <span style={{ color: 'var(--gold)' }}>· {t('page.satIntro')}</span>
              </div>
              {(() => {
                const suggested = suggestSatQuestion(questionText)
                if (!suggested || suggested === satQuestion) return null
                const label = SATPANCHASIKA_QUESTIONS.find(q => q.id === suggested)?.label
                return (
                  <button type="button" onClick={() => setSatQuestion(suggested)}
                    style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.6rem', borderRadius: 999, border: '1px solid var(--gold)', background: 'var(--gold-faint)', color: 'var(--text-gold)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
                    <Lightbulb size={12} aria-hidden /> {u('suggest', { label: label ?? '' })}
                  </button>
                )
              })()}
              <div role="radiogroup" aria-label={u('questionType')} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {SATPANCHASIKA_QUESTION_GROUPS.map(group => (
                  <div key={group}>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{group}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.35rem' }}>
                      {SATPANCHASIKA_QUESTIONS.filter(q => q.group === group).map(q => {
                        const active = satQuestion === q.id
                        return (
                          <button key={q.id} type="button" role="radio" aria-checked={active} onClick={() => setSatQuestion(q.id)}
                            style={{ textAlign: 'left', padding: '0.4rem 0.55rem', borderRadius: 8, cursor: 'pointer', border: active ? '2px solid var(--gold)' : '1px solid var(--border-soft)', background: active ? 'var(--gold-faint)' : 'var(--surface-2)' }}>
                            <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: active ? 'var(--text-gold)' : 'var(--text-secondary)', lineHeight: 1.3 }}>{q.label}</span>
                            <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: 1 }}>{q.hint}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {satQuestion === 'any_house' && (
                <label style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {u('houseToJudge')}
                  <select className="input" value={satHouse} onChange={e => setSatHouse(Number(e.target.value))} style={{ fontSize: '0.78rem', width: 'auto' }}>
                    {SAT_HOUSES.map((label, i) => <option key={label} value={i + 1}>{i + 1}. {hi ? t(`satHouse.${i + 1}`) : label}</option>)}
                  </select>
                </label>
              )}
              {satQuestion === 'contest' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <span>{t('page.yourSide')}</span>
                  {([
                    { id: 'defender' as const, label: t('page.defender') },
                    { id: 'challenger' as const, label: t('page.challenger') },
                  ]).map(o => (
                    <button key={o.id} type="button" onClick={() => setContestRole(o.id)} aria-pressed={contestRole === o.id}
                      className={`btn btn-sm ${contestRole === o.id ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.68rem' }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {satQuestion === 'rain' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={isRainySeason} onChange={e => setIsRainySeason(e.target.checked)} />
                  {u('rainy')}
                </label>
              )}
            </div>
          )}

          {/* Frozen timestamp */}
          {frozen && chart && (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {u('frozenAt')} <strong style={{ color: 'var(--rose)' }}>{chart.meta?.birthDate} {chart.meta?.birthTime}</strong>
              {' · '}{location.name}
            </div>
          )}
          {error && (
            <div style={{ fontSize: '0.75rem', color: 'var(--rose)', padding: '0.5rem 0.65rem', background: 'var(--rose)12', borderRadius: 8, border: '1px solid var(--rose)' }}>
              {error}
            </div>
          )}
        </div>

        {/* ── History Panel ────────────────────────────────────────────────────── */}
        {showHistory && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem' }}>{u('historyHead', { n: history.length })}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {marked.length ? u('historyLog', { hits, misses: marked.length - hits, total: marked.length }) : u('historyHint')}
                </p>
              </div>
              <button onClick={() => { if (confirm(u('clearConfirm'))) { setHistory([]); localStorage.removeItem('prashna_history') } }}
                style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface-3)', cursor: 'pointer', color: 'var(--rose)' }}>
                {u('clearAll')}
              </button>
            </div>
            {history.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{t('page.historyEmpty')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 320, overflowY: 'auto' }}>
                {history.map(h => {
                  const col = h.verdict === 'YES' ? 'var(--teal)' : h.verdict === 'NO' ? 'var(--rose)' : 'var(--amber)'
                  return (
                    <div key={h.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.45rem 0.65rem', background: 'var(--surface-2)', borderRadius: 7, border: '1px solid var(--border-soft)' }}>
                      <span style={{ fontWeight: 900, color: col, fontSize: '0.85rem', flexShrink: 0, width: 60, textAlign: 'center' }}>{h.verdict}<br/><span style={{ fontSize: '0.6rem', fontWeight: 400 }}>{h.confidence}%</span></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.question || u('noQuestion')}</div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{h.system ?? `${CATEGORY_ICONS[h.category]} ${t(`category.${h.category}`)}`} · {h.location} · {new Date(h.ts).toLocaleString(lang === 'hi' ? 'hi-IN' : undefined)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button type="button" aria-pressed={h.outcome === 'hit'} aria-label={u('cameTrue')} title={u('cameTrue')} onClick={() => setHistoryOutcome(h.id, 'hit')}
                          style={{ padding: '0.25rem 0.4rem', borderRadius: 6, cursor: 'pointer', border: `1px solid ${h.outcome === 'hit' ? 'var(--teal)' : 'var(--border-soft)'}`, background: 'var(--surface-1)', color: h.outcome === 'hit' ? 'var(--teal)' : 'var(--text-muted)', display: 'inline-flex' }}>
                          <Check size={13} aria-hidden />
                        </button>
                        <button type="button" aria-pressed={h.outcome === 'miss'} aria-label={u('notTrue')} title={u('notTrue')} onClick={() => setHistoryOutcome(h.id, 'miss')}
                          style={{ padding: '0.25rem 0.4rem', borderRadius: 6, cursor: 'pointer', border: `1px solid ${h.outcome === 'miss' ? 'var(--rose)' : 'var(--border-soft)'}`, background: 'var(--surface-1)', color: h.outcome === 'miss' ? 'var(--rose)' : 'var(--text-muted)', display: 'inline-flex' }}>
                          <X size={13} aria-hidden />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Await state ──────────────────────────────────────────────────────── */}
        {!frozen && !loading && !modeLocked && (
          <div style={{ height: '42vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)', borderRadius: 14, border: '1px dashed var(--border)', gap: '1.5rem' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--gold-faint)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', animation: 'pulse 3s ease-in-out infinite' }}>🧿</div>
            <div style={{ textAlign: 'center', maxWidth: 500 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', opacity: 0.9, margin: '0 0 0.5rem' }}>{t('page.awaiting')}</h2>
              <p style={{ opacity: 0.6, lineHeight: 1.7, fontSize: '0.85rem', margin: 0 }}>
                {u('clearMind')}<br />
                {mode === 'krishneeyam' && u('awaitKrish')}
                {mode === 'satpanchasika' && u('awaitSat')}
                {u.rich('whenReady', boldTag)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {(u.raw(mode === 'satpanchasika' ? 'stepsSat' : 'stepsKrish') as string[]).map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ height: '55vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-1)', borderRadius: 14, border: '1px solid var(--gold-faint)', gap: '1rem' }}>
            <VedaanshLoader size={48} message={u('consulting')} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0, textAlign: 'center' }}>
              {u('casting', { what: mode === 'satpanchasika' ? u('castSat') : u('castKrish') })}
            </p>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────────────── */}
        {frozen && chart && !loading && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.25rem', alignItems: 'flex-start' }}>

            {/* ═══ LEFT: Chart Column ══════════════════════════════════════════ */}
            <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : Math.max(chartSize + 40, 460), display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Chart */}
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{t('page.kundali')}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{questionText || u('horaryChart')} · {location.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {(['D1', 'D9'] as const).map(v => (
                      <button key={v} onClick={() => setVarga(v)} className={`btn btn-sm ${varga === v ? 'btn-primary' : 'btn-ghost'}`}>{v}</button>
                    ))}
                    {(['north', 'south'] as ChartStyle[]).map(s => (
                      <button key={s} onClick={() => setStyle(s)} className={`btn btn-sm ${style === s ? 'btn-secondary' : 'btn-ghost'}`} style={{ fontSize: '0.65rem' }}>{s === 'north' ? u('styleNorth') : u('styleSouth')}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ChakraSelector
                    ascRashi={varga === 'D1' ? chart.lagnas.ascRashi : chart.vargaLagnas['D9']}
                    grahas={varga === 'D1' ? chart.grahas : chart.vargas['D9']}
                    arudhas={chart.arudhas} lagnas={chart.lagnas} vargaName={varga}
                    defaultStyle={style} size={chartSize} moonNakIndex={chart.panchang.nakshatra.index}
                    tithiNumber={chart.panchang.tithi.number} varaNumber={chart.panchang.vara.number} userPlan="platinum"
                    showCharaDrishtiControls
                    initialLagnaSource={chartLagnaSource}
                    defaultShowArudha
                  />
                </div>
                {/* Panchang chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.75rem' }} className="prashna-panchang-grid">
                  {[
                    { label: t('page.tithi'), value: chart.panchang.tithi.name },
                    { label: t('page.nakshatra'), value: hi ? NAKSHATRA_HI[chart.panchang.nakshatra.index] ?? chart.panchang.nakshatra.name : chart.panchang.nakshatra.name },
                    { label: t('page.yoga'), value: chart.panchang.yoga.name },
                    { label: t('page.vara'), value: chart.panchang.vara.name },
                    { label: t('page.udayaLagna'), value: `${rn(chart.lagnas.ascRashi)} ${Math.floor(chart.lagnas.ascDegree % 30)}°` },
                    { label: t('page.arudhaLagna'), value: arudhaLagnaRashi ? rn(arudhaLagnaRashi) : '—' },
                    { label: t('page.aroodhaSparsha'), value: resolvedAroodhaRashi ? rn(resolvedAroodhaRashi) : '—' },
                    { label: t('page.paksha'), value: chart.panchang.tithi.paksha === 'shukla' ? `☀️ ${t('page.shukla')}` : `🌑 ${t('page.krishna')}` },
                  ].map(c => (
                    <div key={c.label} style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '0.35rem 0.5rem', border: '1px solid var(--border-soft)' }}>
                      <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.label}</div>
                      <div style={{ fontSize: '0.77rem', fontWeight: 700, color: 'var(--text-gold)' }}>{c.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Planetary Status */}
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>🪐 {t('page.planets')}</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', opacity: 0.6 }}>
                        {(u.raw('th') as string[]).map(h => h.replace('{ref}', houseReference === 'arudha' ? 'AL' : u('lagna'))).map(h => (
                          <th key={h} style={{ padding: '0.4rem 0.35rem', textAlign: 'left', fontWeight: 600, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chart.grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id)).map(g => {
                        const refRashi = houseReference === 'arudha' && arudhaLagnaRashi ? arudhaLagnaRashi : chart.lagnas.ascRashi
                        const h = ((g.rashi - refRashi + 12) % 12) + 1
                        const dignityColor = ['exalted', 'moolatrikona', 'own'].includes(g.dignity) ? 'var(--teal)' : ['debilitated', 'great_enemy', 'enemy'].includes(g.dignity) ? 'var(--rose)' : 'var(--text-secondary)'
                        return (
                          <tr key={g.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                            <td style={{ padding: '0.4rem 0.35rem', fontWeight: 700, color: 'var(--gold)' }}>{hi ? GRAHA_HI[g.id] ?? g.name : g.name}</td>
                            <td style={{ padding: '0.4rem 0.35rem' }}>{rn(g.rashi)} {Math.floor(g.degree)}°</td>
                            <td style={{ padding: '0.4rem 0.35rem', color: 'var(--text-muted)' }}>{hi ? NAKSHATRA_HI[g.nakshatraIndex] ?? g.nakshatraName : g.nakshatraName.slice(0, 7)}</td>
                            <td style={{ padding: '0.4rem 0.35rem' }}>
                              <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 3, background: 'var(--surface-3)', color: dignityColor, fontWeight: 600 }}>{hi ? dignityText(g.dignity, 'hi') : g.dignity}</span>
                            </td>
                            <td style={{ padding: '0.4rem 0.35rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>H{h}</td>
                            <td style={{ padding: '0.4rem 0.35rem', fontSize: '0.62rem' }}>
                              {g.isRetro && <span style={{ color: 'var(--rose)', marginRight: 3 }}>℞</span>}
                              {g.isCombust && <span style={{ color: 'var(--amber)' }}>☀{t('page.combust')}</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Nakshatra Dial */}
              <div className="card" style={{ padding: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center' }}>🌙 {t('page.nakDial')}</div>
                <NakshatraDial moonNakIdx={chart.panchang.nakshatra.index} moonDeg={chart.grahas.find(g=>g.id==='Mo')?.totalDegree ?? 0} />
                <div style={{ textAlign: 'center', marginTop: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {u.rich('moonIn', { ...goldTag, nak: hi ? NAKSHATRA_HI[chart.panchang.nakshatra.index] ?? chart.panchang.nakshatra.name : chart.panchang.nakshatra.name, pada: chart.panchang.nakshatra.pada })}
                </div>
              </div>
            </div>

            {/* ═══ RIGHT: Full Analysis Panel ══════════════════════════════════ */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* ── Krishneeyam Oracle ──────────────────────────────────────── */}
              {mode === 'krishneeyam' && krishneeyamResult && (() => {
                const r = krishneeyamResult
                return (
                  <>
                    {/* ═ VERDICT BANNER ═════════════════════════════════════ */}
                    <div style={{ borderRadius: 12, border: `2px solid ${verdictColor}`, background: `${verdictColor}0d`, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: 4, background: `linear-gradient(90deg, ${verdictColor}, ${verdictColor}60)` }} />
                      <div style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.6rem', color: verdictColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                              {u('oracle', { cat: `${CATEGORY_ICONS[category]} ${t(`category.${category}`)}` })}
                            </div>
                            <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', margin: '0 0 0.25rem', color: verdictColor, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
                              {r.headline}
                            </h2>
                            {questionText && <p style={{ fontSize: '0.78rem', opacity: 0.7, fontStyle: 'italic', margin: '0 0 0.5rem' }}>&quot;{questionText}&quot;</p>}
                          </div>
                          <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: verdictColor, lineHeight: 1, fontFamily: 'var(--font-display)' }}>{r.verdict}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{t('page.verdict')}</div>
                          </div>
                        </div>

                        {/* Confidence meter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${r.confidence}%`, background: `linear-gradient(90deg, ${verdictColor}80, ${verdictColor})`, borderRadius: 4, transition: 'width 0.6s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: verdictColor, flexShrink: 0 }}>{t('page.confidence', { n: r.confidence })}</span>
                        </div>

                        {/* Rashmi Score */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, r.rashmiScore / 25)}%`, background: 'linear-gradient(90deg, var(--amber)60, var(--amber))', borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--amber)', flexShrink: 0 }}>{u('rashmi', { n: r.rashmiScore })}</span>
                        </div>
                      </div>
                    </div>

                    {/* House reference banner */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border-soft)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('page.reading')}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)' }}>{r.houseReference.label}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {u('udayaShort', { sign: rn(chart.lagnas.ascRashi) })}
                        {arudhaLagnaRashi ? u('alShort', { sign: rn(arudhaLagnaRashi) }) : ''}
                        {resolvedAroodhaRashi ? u('sparshaShort', { sign: rn(resolvedAroodhaRashi) }) : ''}
                      </span>
                    </div>

                    {/* ═ CORE INDICATORS GRID ══════════════════════════════ */}
                    <SectionCard title={u('coreTitle', { ref: r.houseReference.type === 'arudha' ? t('page.arudha') : t('page.udaya') })} icon="🔭" accent="var(--teal)">
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0 0 0.5rem', lineHeight: 1.45 }}>
                        {u.rich('computedFrom', { ...goldTag, sign: rn(r.coreLagnaRashi), suffix: r.houseReference.type === 'arudha' ? u('alSuffix') : u('risingSuffix') })}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <Chip label={u('ascType')} value={r.ascendantType} color={r.ascendantTypeResult === 'good' ? 'var(--teal)' : r.ascendantTypeResult === 'bad' ? 'var(--rose)' : 'var(--gold)'} />
                        <Chip label={u('signMukha')} value={r.signType} color={r.signTypeResult === 'good' ? 'var(--teal)' : r.signTypeResult === 'bad' ? 'var(--rose)' : 'var(--gold)'} />
                        <Chip label={r.aroodhaRelationLabel} value={r.aroodhaUdayaRelation.split(' — ')[0]} color={r.aroodhaUdayaResult === 'good' ? 'var(--teal)' : 'var(--rose)'} />
                        <Chip label={u('chathra')} value={`${rn(r.chhatraRashi)} ${r.chhatraIsObstacle ? u('obstacleTag') : u('favorableTag')}`} color={r.chhatraIsObstacle ? 'var(--rose)' : 'var(--teal)'} />
                      </div>
                      <IndicatorRow label={u('ascendant')} value={r.ascendantType} ok={r.ascendantTypeResult === 'good'} />
                      <IndicatorRow label={u('signMukha')} value={r.signType} ok={r.signTypeResult === 'good'} />
                      <IndicatorRow label={r.aroodhaRelationLabel} value={r.aroodhaUdayaRelation} ok={r.aroodhaUdayaResult === 'good'} />
                      <IndicatorRow label={u('chathra')} value={`${rn(r.chhatraRashi)} — ${r.chhatraIsObstacle ? u('obstacleFrom', { ref: r.houseReference.type === 'arudha' ? 'AL' : u('udaya') }) : u('favorable')}`} ok={!r.chhatraIsObstacle} />
                      <IndicatorRow label={t('page.udayaLagna')} value={rn(chart.lagnas.ascRashi)} ok={null} />
                      {arudhaLagnaRashi && (
                        <IndicatorRow label={`${t('page.arudhaLagna')} (AL)`} value={rn(arudhaLagnaRashi)} ok={null} />
                      )}
                      {resolvedAroodhaRashi && (
                        <IndicatorRow label={t('page.aroodhaSparsha')} value={rn(resolvedAroodhaRashi)} ok={null} />
                      )}
                      {r.bodyTouchResult && (
                        <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6, fontSize: '0.72rem', color: 'var(--gold)' }}>
                          ✋ <strong>{t('page.mushti')}</strong> {r.bodyTouchResult}
                        </div>
                      )}
                      {r.planetInAscendantEffect && (
                        <div style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          🪐 <strong>{t('page.planetInAsc')}</strong> {r.planetInAscendantEffect}
                        </div>
                      )}
                    </SectionCard>

                    {/* Planet houses from selected reference */}
                    <SectionCard title={u('housesFrom', { ref: r.houseReference.type === 'arudha' ? u('fromAl') : u('fromUdaya') })} icon="🏠" accent="var(--gold)">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem', fontSize: '0.68rem' }}>
                        {r.planetHousesFromReference.map(ph => (
                          <div key={ph.id} style={{ padding: '0.3rem 0.45rem', background: 'var(--surface-2)', borderRadius: 5, display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{hi ? GRAHA_HI[ph.id as keyof typeof GRAHA_HI] ?? ph.name : ph.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>H{ph.house}</span>
                          </div>
                        ))}
                      </div>
                    </SectionCard>

                    {/* ═ DREKKANA + ELEMENTS 2-col ══════════════════════════ */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                      {/* Drekkana */}
                      <SectionCard title={u('drekkana')} icon="🔺" accent="var(--teal)">
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{t('page.krishneeyamNote')}</div>
                        <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{u('lord', { lord: r.drekkanaAnalysis.lord.split(' [')[0] ?? '' })}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem' }}>
                          <div>{t('page.bodyPart')} <strong style={{ color: 'var(--accent)' }}>{r.drekkanaAnalysis.bodyPart}</strong></div>
                          <div style={{ color: 'var(--text-muted)' }}>{u('right', { v: r.drekkanaAnalysis.rightSide })}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{u('left', { v: r.drekkanaAnalysis.leftSide })}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{u('seventh', { v: r.drekkanaAnalysis.seventhSign })}</div>
                        </div>
                      </SectionCard>

                      {/* Five Elements + Height + Place */}
                      <SectionCard title={u('element')} icon="🌍" accent="var(--amber)">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.73rem' }}>
                          <div style={{ padding: '0.3rem 0.5rem', background: 'var(--surface-2)', borderRadius: 5 }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{t('page.fiveElement')}</span>
                            <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{r.subjectElement}</div>
                          </div>
                          <div style={{ padding: '0.3rem 0.5rem', background: 'var(--surface-2)', borderRadius: 5 }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{t('page.signHeight')}</span>
                            <div style={{ color: 'var(--gold)', fontWeight: 600 }}>{r.signHeight}</div>
                          </div>
                          <div style={{ padding: '0.3rem 0.5rem', background: 'var(--surface-2)', borderRadius: 5 }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{t('page.locationCh')}</span>
                            <div style={{ color: 'var(--teal)', fontWeight: 600 }}>{r.signPlace}</div>
                          </div>
                        </div>
                      </SectionCard>
                    </div>

                    {/* ═ TIMING ══════════════════════════════════════════════ */}
                    <SectionCard title={u('timingTitle')} icon="⏰" accent="var(--amber)">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 7 }}>
                          <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('page.earliest')}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--teal)' }}>{r.timing.rangeMin}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 7 }}>
                          <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('page.significator')}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold)' }}>{r.timing.significatorPlanet}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{t('page.planet')}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 7 }}>
                          <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('page.latest')}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--rose)' }}>{r.timing.rangeMax}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.timing.description}</div>
                    </SectionCard>

                    {/* ═ QUERIST PROFILE + MOON YOGA + PAST/PRESENT/FUTURE ══ */}
                    <Collapsible id="querist" title={u('querist')} icon="👤" accent="var(--rose)">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {/* Guna */}
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 7, fontSize: '0.73rem' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{t('page.guna')}</div>
                          <div style={{ color: 'var(--gold)', fontWeight: 600 }}>{r.queristGuna}</div>
                        </div>
                        {/* Physical Features */}
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 7, fontSize: '0.72rem' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{t('page.features')}</div>
                          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.planetPhysicalFeatures}</div>
                        </div>
                        {/* Moon Yoga */}
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 7, fontSize: '0.73rem', borderLeft: `3px solid ${r.moonYoga.result.includes('⚠') ? 'var(--rose)' : 'var(--teal)'}` }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{t('page.moonYoga')}</div>
                          <div style={{ fontWeight: 700, color: r.moonYoga.result.includes('⚠') ? 'var(--rose)' : 'var(--teal)', marginBottom: 2 }}>{r.moonYoga.name}</div>
                          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.moonYoga.result}</div>
                        </div>
                        {/* Past/Present/Future */}
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 7 }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                            {u('ppf')} <span style={{ color: 'var(--gold)' }}>{u('ppfFrom', { ref: r.houseReference.type === 'arudha' ? 'AL' : u('udaya') })}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.3rem', fontSize: '0.68rem' }}>
                            <div style={{ padding: '0.35rem', background: 'var(--surface-3)', borderRadius: 5, textAlign: 'center' }}>
                              <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>{t('page.past')}</div>
                              <div style={{ color: 'var(--rose)', fontWeight: 600 }}>{r.pastPresentFuture.past.join(', ') || '—'}</div>
                            </div>
                            <div style={{ padding: '0.35rem', background: 'var(--surface-3)', borderRadius: 5, textAlign: 'center' }}>
                              <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>{t('page.now')}</div>
                              <div style={{ color: 'var(--teal)', fontWeight: 600 }}>{r.pastPresentFuture.present.join(', ') || '—'}</div>
                            </div>
                            <div style={{ padding: '0.35rem', background: 'var(--surface-3)', borderRadius: 5, textAlign: 'center' }}>
                              <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>{t('page.future')}</div>
                              <div style={{ color: 'var(--gold)', fontWeight: 600 }}>{r.pastPresentFuture.future.join(', ') || '—'}</div>
                            </div>
                          </div>
                        </div>
                        {/* Querist Facts (Ch12) */}
                        {r.queristFeatures.length > 0 && (
                          <div style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 7 }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{t('page.queristFacts')}</div>
                            <BulletList items={r.queristFeatures} />
                          </div>
                        )}
                      </div>
                    </Collapsible>

                    {/* ═ MATERIAL ANALYSIS (Ch9) + DMJ ═══════════════════════ */}
                    <Collapsible id="material" title={u('material')} icon="⚗️" accent="var(--teal)">
                      {r.subjectMaterialDetail ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.73rem' }}>
                          {r.subjectMaterialDetail.split(/(?<=[.।])\s/).map((seg, i) => seg.trim() && (
                            <div key={i} style={{ padding: '0.35rem 0.55rem', background: 'var(--surface-2)', borderRadius: 5, color: 'var(--text-secondary)' }}>{seg}</div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{t('page.selectWhat')}</div>
                      )}
                      {/* DMJ dry/wet */}
                      <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6, fontSize: '0.72rem', color: 'var(--teal)' }}>
                        💧 <strong>{t('page.dryWet')}</strong> {r.dryWetAnalysis}
                      </div>
                    </Collapsible>

                    {/* ═ THIEF / THEFT ANALYSIS ═══════════════════════════════ */}
                    {(category === 'who' || category === 'lost_article') && (
                      <SectionCard title={u('theft')} icon="🕵️" accent="var(--rose)">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {/* Thief Entry */}
                          <div style={{ padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6, fontSize: '0.72rem', borderLeft: '3px solid var(--rose)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>{t('page.thiefEntry')}</div>
                            <div style={{ color: 'var(--text-secondary)' }}>{r.thiefEntry}</div>
                          </div>
                          {/* Thief profile */}
                          {r.thief && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.3rem' }}>
                              {[
                                { k: u('thief.gender'), v: r.thief.gender }, { k: u('thief.caste'), v: r.thief.caste },
                                { k: u('thief.relation'), v: r.thief.relation }, { k: u('thief.posture'), v: r.thief.posture },
                                { k: u('thief.color'), v: r.thief.color }, { k: u('thief.location'), v: r.thief.location },
                              ].map(({ k, v }) => (
                                <div key={k} style={{ padding: '0.3rem 0.5rem', background: 'var(--surface-2)', borderRadius: 5, fontSize: '0.7rem' }}>
                                  <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)' }}>{k}</div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{v}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {r.thief?.nameLetters && (
                            <div style={{ padding: '0.4rem 0.6rem', background: 'var(--gold-faint)', borderRadius: 6, border: '1px solid var(--gold-dim)', fontSize: '0.72rem' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>{t('page.nameLetters')}</div>
                              <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.9rem' }}>{r.thief.nameLetters}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{r.thief.nameLetterExplanation}</div>
                            </div>
                          )}
                          {r.thief?.features && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6 }}>
                              <strong style={{ color: 'var(--text-gold)' }}>{t('page.appearance')}</strong> {r.thief.features}
                            </div>
                          )}
                          {r.subjectNature && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--teal)', padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6 }}>
                              <strong>{t('page.recovery')}</strong> {r.subjectNature}
                            </div>
                          )}
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ HEALTH ANALYSIS [Ch13] ══════════════════════════════ */}
                    {category === 'health' && r.health && (
                      <SectionCard title={u('healthTitle')} icon="🏥" accent="var(--amber)">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <Chip label={u('dosha')} value={r.health.dosha} color="var(--amber)" />
                          <Chip label={u('curability')} value={r.health.curability} color={r.health.curable ? 'var(--teal)' : 'var(--rose)'} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.72rem' }}>
                          <IndicatorRow label={u('bodySystem')} value={r.health.bodySystem} ok={null} />
                          <IndicatorRow label={u('onset')} value={r.health.dayOfStart} ok={null} />
                          <IndicatorRow label={u('carePlace')} value={r.health.placeOfDeath} ok={null} />
                          <IndicatorRow label={u('riskTheme')} value={r.health.causeOfDeath} ok={null} />
                          <IndicatorRow label={u('spiritualDir')} value={r.health.rebirthNature} ok={null} />
                        </div>
                        {r.health.deathSymptoms && r.health.extraCare && (
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--rose)12', borderRadius: 6, border: '1px solid var(--rose)', fontSize: '0.73rem', color: 'var(--rose)' }}>
                            ⚠️ {r.health.deathSymptoms}
                          </div>
                        )}
                      </SectionCard>
                    )}

                    {/* ═ HOUSE QUERY [Ch15] ══════════════════════════════════ */}
                    {category === 'house_query' && r.houseQuery && (
                      <SectionCard title={u('houseQuery')} icon="🏠" accent="var(--teal)">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                          {[
                            { k: u('hq.type'), v: r.houseQuery.houseType },
                            { k: u('hq.direction'), v: r.houseQuery.direction },
                            { k: u('hq.shape'), v: r.houseQuery.shape },
                            { k: u('hq.ownership'), v: r.houseQuery.ownership },
                          ].map(({ k, v }) => <Chip key={k} label={k} value={v} />)}
                        </div>
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: r.houseQuery.hasTreasure.startsWith('YES') ? 'var(--gold-faint)' : 'var(--surface-2)', borderRadius: 6, border: `1px solid ${r.houseQuery.hasTreasure.startsWith('YES') ? 'var(--gold-dim)' : 'var(--border-soft)'}`, fontWeight: 700, color: r.houseQuery.hasTreasure.startsWith('YES') ? 'var(--gold)' : 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center' }}>
                          💰 Treasure: {r.houseQuery.hasTreasure}
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ SPIRIT / BAADHA [Ch19] ══════════════════════════════ */}
                    {category === 'spirit' && r.spirit && (
                      <SectionCard title={u('spiritTitle')} icon="👁️" accent="var(--rose)">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <Chip label={u('spiritType')} value={r.spirit.type} color="var(--rose)" />
                          <Chip label={u('deity')} value={r.spirit.deity} color="var(--gold)" />
                        </div>
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--teal)12', borderRadius: 6, border: '1px solid var(--teal)', fontSize: '0.73rem', color: 'var(--teal)' }}>
                          🙏 <strong>{t('page.remedy')}</strong> {r.spirit.remedy}
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ MARRIAGE / INTERCOURSE [Ch18] ══════════════════════ */}
                    {(category === 'marriage' || category === 'intercourse') && r.relationship && (
                      <SectionCard title={u('relTitle')} icon="💍" accent="var(--gold)">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                          <Chip label={u('quality')} value={r.relationship.quality} color="var(--teal)" />
                          <Chip label={u('partner')} value={r.relationship.partner} />
                          <Chip label={u('nature')} value={r.relationship.nature} />
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ FOOD [Ch16-17] ══════════════════════════════════════ */}
                    {category === 'food' && r.food && (
                      <SectionCard title={u('foodTitle')} icon="🍽️" accent="var(--amber)">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                          <Chip label={u('quality')} value={r.food.quality} color={r.food.good ? 'var(--teal)' : 'var(--rose)'} />
                          <Chip label={u('type')} value={r.food.type} />
                          <Chip label={u('taste')} value={r.food.taste} />
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ PREGNANCY [Ch21] ════════════════════════════════════ */}
                    {category === 'pregnancy' && (
                      <SectionCard title={u('pregTitle')} icon="👶" accent="var(--rose)">
                        <BulletList items={r.details.filter(d => d.toLowerCase().includes('ch21') || d.toLowerCase().includes('ketu') || d.toLowerCase().includes('pregnan') || d.toLowerCase().includes('child'))} />
                      </SectionCard>
                    )}

                    {/* ═ TRAVEL [Ch14] ═══════════════════════════════════════ */}
                    {category === 'travel' && (
                      <SectionCard title={u('travelTitle')} icon="✈️" accent="var(--teal)">
                        <BulletList items={r.details.filter(d => d.toLowerCase().includes('ch14') || d.toLowerCase().includes('travel') || d.toLowerCase().includes('return') || d.toLowerCase().includes('mode'))} />
                      </SectionCard>
                    )}

                    {/* ═ NAVAMSA + TRIMSAMSHA ══════════════════════════════════ */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                      {r.navamsaSignification && (
                        <SectionCard title={u('navamsa')} icon="🔬" accent="var(--gold)">
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.navamsaSignification}</div>
                        </SectionCard>
                      )}
                      {r.trimsamshaTopics.length > 0 && (
                        <SectionCard title={u('trimsamsha')} icon="📐" accent="var(--amber)">
                          <BulletList items={r.trimsamshaTopics} />
                        </SectionCard>
                      )}
                    </div>

                    {/* ═ ANIMAL QUERY [Ch11] ═════════════════════════════════ */}
                    {r.animalQuery && (
                      <SectionCard title={u('animal')} icon="🐾" accent="var(--amber)">
                        <div style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>{r.animalQuery}</div>
                      </SectionCard>
                    )}

                    {/* ═ LAWSUIT ANALYSIS ════════════════════════════════════ */}
                    {category === 'lawsuit' && r.lawsuit && (
                      <SectionCard title={u('legal')} icon="⚖️" accent="var(--rose)">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <Chip label={u('yourStrength')} value={r.lawsuit.queristStrength} color={r.lawsuit.queristLevel === 'Strong' ? 'var(--teal)' : r.lawsuit.queristLevel === 'Weak' ? 'var(--rose)' : 'var(--amber)'} />
                          <Chip label={u('oppStrength')} value={r.lawsuit.opponentStrength} color={r.lawsuit.opponentLevel === 'Strong' ? 'var(--rose)' : r.lawsuit.opponentLevel === 'Weak' ? 'var(--teal)' : 'var(--amber)'} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.73rem' }}>
                          <div style={{ padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6 }}>
                            <strong style={{ color: 'var(--gold)' }}>{t('page.outcome')}</strong> {r.lawsuit.outcome}
                          </div>
                          <IndicatorRow label={u('timeline')} value={r.lawsuit.timing} ok={null} />
                          <IndicatorRow label={u('keyPlanet')} value={r.lawsuit.keyPlanet} ok={null} />
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ EXAM / ELECTION ANALYSIS ════════════════════════════ */}
                    {category === 'exam' && r.exam && (
                      <SectionCard title={u('exam')} icon="🎓" accent="var(--teal)">
                        <div style={{ padding: '0.5rem 0.75rem', background: r.exam.success.includes('Excellent') ? 'var(--teal)12' : r.exam.success.includes('Good') ? 'var(--gold-faint)' : 'var(--rose)12', borderRadius: 7, border: `1px solid ${r.exam.success.includes('Excellent') ? 'var(--teal)' : r.exam.success.includes('Good') ? 'var(--gold-dim)' : 'var(--rose)'}`, marginBottom: '0.5rem', fontWeight: 600, color: r.exam.success.includes('Excellent') ? 'var(--teal)' : r.exam.success.includes('Good') ? 'var(--gold)' : 'var(--rose)', fontSize: '0.8rem' }}>
                          🎯 {r.exam.success}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.73rem' }}>
                          <IndicatorRow label={u('subjectStrength')} value={r.exam.subject} ok={null} />
                          <IndicatorRow label={u('keyStrength')} value={r.exam.keyStrength} ok={null} />
                          <IndicatorRow label={u('watchOut')} value={r.exam.weakness} ok={null} />
                          <IndicatorRow label={u('bestTiming')} value={r.exam.timing} ok={null} />
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ RAHU IN ASCENDANT ════════════════════════════════════ */}
                    {r.rahuInAscendant && (
                      <SectionCard title={u('rahuAsc')} icon="🐉" accent="var(--rose)">
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.rahuInAscendant}</div>
                      </SectionCard>
                    )}

                    {/* ═ SCORECARD ════════════════════════════════════════════ */}
                    <Collapsible id="scorecard" title={u('scorecard', { good: r.scorecard.filter(s => s.result === 'good').length, bad: r.scorecard.filter(s => s.result === 'bad').length, n: r.scorecard.filter(s => s.weight > 0).length })} icon="📊" accent="var(--teal)">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {r.scorecard.filter(s => s.weight > 0).map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', background: 'var(--surface-2)', borderRadius: 6, border: `1px solid ${item.result === 'good' ? 'var(--teal)30' : item.result === 'bad' ? 'var(--rose)30' : 'var(--border-soft)'}` }}>
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.result === 'good' ? '✅' : item.result === 'bad' ? '❌' : '〰️'}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: item.result === 'good' ? 'var(--teal)' : item.result === 'bad' ? 'var(--rose)' : 'var(--gold)' }}>{item.label}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Collapsible>

                    {/* ═ TIME STRENGTH NOTES ═══════════════════════════════════ */}
                    {r.timeStrengthNotes.length > 0 && (
                      <Collapsible id="timestrength" title={u('timeStrength')} icon="⏱" accent="var(--amber)">
                        <BulletList items={r.timeStrengthNotes} />
                      </Collapsible>
                    )}

                    {/* ═ RULES APPLIED ═══════════════════════════════════════ */}
                    <Collapsible id="rules" title={u('rulesApplied', { n: r.rules.length })} icon="📜" accent="var(--teal)">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {r.rules.map((rule, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.7rem', lineHeight: 1.5, padding: '0.3rem 0', borderBottom: '1px solid var(--border-soft)' }}>
                            <span style={{ color: 'var(--gold)', flexShrink: 0, fontSize: '0.65rem', marginTop: 1 }}>◆</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </Collapsible>

                    {/* ═ DETAILED NOTES ══════════════════════════════════════ */}
                    <Collapsible id="details" title={u('engineDetails', { n: r.details.length })} icon="🔬" accent="var(--text-muted)">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {r.details.map((d, i) => (
                          <p key={i} style={{ margin: 0, fontSize: '0.68rem', lineHeight: 1.6, borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.25rem', color: 'var(--text-muted)' }}>• {d}</p>
                        ))}
                      </div>
                    </Collapsible>

                    {/* ═ REMEDIES ════════════════════════════════════════════ */}
                    {r.remedies.length > 0 && (
                      <SectionCard title={u('remedies')} icon="🕯️" accent="var(--gold)">
                        <BulletList items={r.remedies.map(rem => `🕯️ ${rem}`)} />
                      </SectionCard>
                    )}

                    {/* ═ COPY BUTTON ═════════════════════════════════════════ */}
                    <button
                      style={{ padding: '0.65rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => {
                        const c = (k: string) => u(`copy.${k}`)
                        const none = c('none')
                        const lines = [
                          c('head'),
                          `=`.repeat(40),
                          questionText ? `${c('question')}: "${questionText}"` : '',
                          `${c('verdict')}: ${r.headline} (${r.confidence}% ${c('confidence')})`,
                          `${c('rashmi')}: ${r.rashmiScore}`,
                          ``,
                          c('core'),
                          `${c('houseRef')}: ${r.houseReference.label}`,
                          `${u('udaya')}: ${rn(chart.lagnas.ascRashi)} · ${r.ascendantType}`,
                          arudhaLagnaRashi ? `${t('page.arudhaLagna')}: ${rn(arudhaLagnaRashi)}` : '',
                          resolvedAroodhaRashi ? `${t('page.aroodhaSparsha')}: ${rn(resolvedAroodhaRashi)}` : '',
                          `${u('signMukha')}: ${r.signType}`,
                          `${c('aroodhaUdaya')}: ${r.aroodhaUdayaRelation}`,
                          `${u('chathra')}: ${rn(r.chhatraRashi)} (${r.chhatraIsObstacle ? c('obstacle') : c('favorable')})`,
                          ``,
                          `${u('drekkana')}: ${c('lordEq')} = ${r.drekkanaAnalysis.lord.split(' [')[0]}; ${c('bodyEq')} = ${r.drekkanaAnalysis.bodyPart}`,
                          `${c('fiveElement')}: ${r.subjectElement}`,
                          `${c('signHeight')}: ${r.signHeight} | ${c('location')}: ${r.signPlace}`,
                          ``,
                          c('timing'),
                          `${r.timing.rangeMin} ${c('to')} ${r.timing.rangeMax} (${r.timing.significatorPlanet})`,
                          r.timing.description,
                          ``,
                          c('queristProfile'),
                          `${t('page.guna')}: ${r.queristGuna}`,
                          `${c('features')}: ${r.planetPhysicalFeatures}`,
                          `${t('page.moonYoga')}: ${r.moonYoga.name} — ${r.moonYoga.result}`,
                          `${c('past')}: ${r.pastPresentFuture.past.join(', ') || none}`,
                          `${c('present')}: ${r.pastPresentFuture.present.join(', ') || none}`,
                          `${c('future')}: ${r.pastPresentFuture.future.join(', ') || none}`,
                          r.queristFeatures.length ? `\n${c('queristFacts')}\n${r.queristFeatures.map(f => `• ${f}`).join('\n')}` : '',
                          r.thief ? `\n${c('thiefProfile')}\n${c('entry')}: ${r.thiefEntry}\n${u('thief.gender')}: ${r.thief.gender} | ${u('thief.caste')}: ${r.thief.caste} | ${c('nameLetters')}: ${r.thief.nameLetters}` : '',
                          r.health ? `\n${c('health')}\n${u('dosha')}: ${r.health.dosha} | ${c('body')}: ${r.health.bodySystem} | ${u('curability')}: ${r.health.curability}` : '',
                          r.houseQuery ? `\n${c('house')}\n${r.houseQuery.houseType} | ${r.houseQuery.direction} | ${c('treasure')}: ${r.houseQuery.hasTreasure}` : '',
                          r.spirit ? `\n${c('spirit')}\n${u('type')}: ${r.spirit.type} | ${u('deity')}: ${r.spirit.deity} | ${t('page.remedy')} ${r.spirit.remedy}` : '',
                          r.subjectMaterialDetail ? `\n${c('material')}\n${r.subjectMaterialDetail}` : '',
                          `\n${c('rules')}\n${r.rules.map(rule => `• ${rule}`).join('\n')}`,
                          r.remedies.length ? `\n${c('remedies')}\n${r.remedies.map(rem => `• ${rem}`).join('\n')}` : '',
                        ].filter(Boolean).join('\n')
                        navigator.clipboard.writeText(lines)
                      }}>
                      {u('copyBtn')}
                    </button>
                  </>
                )
              })()}

              {/* ── Satpanchasika rule engine ───────────────────────────────── */}
              {mode === 'satpanchasika' && satpanchasikaReading && (
                <SatpanchasikaPanel reading={satpanchasikaReading} questionText={questionText} stability={stability} askedOn={chart.meta?.birthDate} />
              )}
              {mode === 'satpanchasika' && satResult.error && (
                <div role="alert" style={{ fontSize: '0.78rem', color: 'var(--rose)', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid var(--rose)' }}>
                  {satResult.error}
                </div>
              )}

              {/* ── Vedic praśna ──────────────────────────────────────────────── */}
              {mode === 'vedic' && vedicReading && (
                <VedicPrashnaPanel reading={vedicReading} questionText={questionText} stability={stability} askedOn={chart.meta?.birthDate} />
              )}
              {mode === 'vedic' && vedicResult.error && (
                <div role="alert" style={{ fontSize: '0.78rem', color: 'var(--rose)', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid var(--rose)' }}>
                  {vedicResult.error}
                </div>
              )}

              {/* KP Mode */}
              {mode === 'kp' && (
                <>
                  <div className="card">
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>{t('page.rulingPlanets')}</h3>
                    {rulingPlanets.map((rp, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border-soft)' }}>
                        <span style={{ opacity: 0.6 }}>{rp.label}</span>
                        <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{typeof rp.value === 'string' ? rp.value : String(rp.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {mode === 'satpanchasika' && (
          <SatpanchasikaReference status={satpanchasikaReading?.slokaStatus} />
        )}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4); }
          50% { box-shadow: 0 0 0 14px rgba(201,168,76,0); }
        }
        @media print {
          header, .btn, button, select, input { display: none !important; }
          body { background: white !important; color: black !important; }
          .card { border: 1px solid #ccc !important; box-shadow: none !important; }
          * { color-scheme: light !important; }
        }
      `}</style>
    </div>
  )
}
