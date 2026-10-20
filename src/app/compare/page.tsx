'use client'
// src/app/compare/page.tsx — Professional Kundali Matching & Comparison
import { useState, useMemo, useRef, useCallback, useEffect, Suspense } from 'react'
import React from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import type { ChartOutput, GrahaData } from '@/types/astrology'
import { RASHI_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import { calculateAshtakoot, type GanaSchool } from '@/lib/engine/ashtakoot'
import type { MilanRole } from '@/lib/engine/milanSuite'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'
import { planMeetsUiGate } from '@/lib/ui/planGate'

const BirthForm = dynamic(() => import('@/components/ui/BirthForm').then(m => m.BirthForm), { ssr: false })
const VargaSwitcher = dynamic(() => import('@/components/chakra/VargaSwitcher').then(m => m.VargaSwitcher), { ssr: false })
const DashaTree = dynamic(() => import('@/components/dasha/DashaTree').then(m => m.DashaTree), { ssr: false })
const AshtakavargaGrid = dynamic(() => import('@/components/ui/AshtakavargaGrid').then(m => m.AshtakavargaGrid), { ssr: false })
const ShadbalaTable = dynamic(() => import('@/components/ui/ShadbalaTable').then(m => m.ShadbalaTable), { ssr: false })
const YogaList = dynamic(() => import('@/components/ui/YogaList').then(m => m.YogaList), { ssr: false })
const CompatibilityDoshaPanel = dynamic(() => import('@/components/ui/CompatibilityDoshaPanel').then(m => m.CompatibilityDoshaPanel), { ssr: false })
const MilanDeepAnalysisPanel = dynamic(() => import('@/components/ui/MilanDeepAnalysisPanel').then(m => m.MilanDeepAnalysisPanel), { ssr: false })
const MilanExpandPanel = dynamic(() => import('@/components/ui/MilanExpandPanel').then(m => m.MilanExpandPanel), { ssr: false })
const MilanMarriedLifePanel = dynamic(() => import('@/components/ui/MilanMarriedLifePanel').then(m => m.MilanMarriedLifePanel), { ssr: false })
const MilanMatchMakingPanel = dynamic(() => import('@/components/ui/MilanMatchMakingPanel').then(m => m.MilanMatchMakingPanel), { ssr: false })
const NatalPanchangPanel = dynamic(() => import('@/components/panchang/NatalPanchangPanel').then(m => m.NatalPanchangPanel), { ssr: false })
const SavedChartSelector = dynamic(
  () => import('@/components/ui/SavedChartSelector').then(m => m.SavedChartSelector),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Loading chart library"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3000,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="spin-loader" style={{ width: 36, height: 36, borderTopColor: 'var(--gold)' }} />
      </div>
    ),
  },
)

// ── Compatibility Logic ───────────────────────────────────────
interface CompatItem { label: string; score: number; reason: string; level: 'good' | 'neutral' | 'bad' }

function signOf(deg: number): number {
  return Math.floor(((deg % 360) + 360) % 360 / 30) + 1
}

function signDiff(a: number, b: number): number {
  const diff = ((b - a + 12) % 12) + 1; // 1 to 12
  return diff;
}

function rn(s: number): string {
  return RASHI_NAMES[s as keyof typeof RASHI_NAMES] ?? '—'
}

function getCompatibility(a: ChartOutput, b: ChartOutput): CompatItem[] {
  const items: CompatItem[] = []
  const aMo = a.grahas.find((g: GrahaData) => g.id === 'Mo')
  const bMo = b.grahas.find((g: GrahaData) => g.id === 'Mo')
  const aVe = a.grahas.find((g: GrahaData) => g.id === 'Ve')
  const bVe = b.grahas.find((g: GrahaData) => g.id === 'Ve')
  const aJu = a.grahas.find((g: GrahaData) => g.id === 'Ju')
  const bJu = b.grahas.find((g: GrahaData) => g.id === 'Ju')
  const aSu = a.grahas.find((g: GrahaData) => g.id === 'Su')
  const bSu = b.grahas.find((g: GrahaData) => g.id === 'Su')

  // 1. Moon Sign Affinity (Rashi Maitri)
  if (aMo && bMo) {
    const sA = signOf(aMo.totalDegree), sB = signOf(bMo.totalDegree)
    const diff = signDiff(sA, sB)
    const reverseDiff = signDiff(sB, sA)
    const isGood = [1, 5, 9, 3, 7, 11].includes(diff)
    const isBad = [2, 12, 6, 8].includes(diff)
    
    items.push({ 
      label: 'Moon Sign Affinity', 
      score: isGood ? 2 : isBad ? -1 : 0, 
      level: isGood ? 'good' : isBad ? 'bad' : 'neutral',
      reason: `${rn(sA)} ↔ ${rn(sB)} (${diff}/${reverseDiff} relation)` 
    })
  }

  // 2. Ascendant (Lagna) Harmony
  const aL = a.lagnas.ascRashi, bL = b.lagnas.ascRashi
  if (aL && bL) {
    const diff = signDiff(aL, bL)
    const isGood = [1, 5, 9, 3, 7, 11].includes(diff)
    items.push({ 
      label: 'Ascendant Harmony', 
      score: isGood ? 2 : 0, 
      level: isGood ? 'good' : 'neutral',
      reason: `${rn(aL)} ↔ ${rn(bL)}` 
    })
  }

  // 3. Venus–Moon (Emotional Connection)
  if (aVe && bMo) {
    const d = signDiff(signOf(aVe.totalDegree), signOf(bMo.totalDegree))
    if ([1, 5, 9].includes(d)) items.push({ label: "A's Venus ↔ B's Moon", score: 1.5, level: 'good', reason: 'Strong emotional attraction' })
  }
  if (bVe && aMo) {
    const d = signDiff(signOf(bVe.totalDegree), signOf(aMo.totalDegree))
    if ([1, 5, 9].includes(d)) items.push({ label: "B's Venus ↔ A's Moon", score: 1.5, level: 'good', reason: 'Strong emotional attraction' })
  }

  // 4. Jupiter Support (Blessings)
  if (aJu && bMo) {
    const d = signDiff(signOf(aJu.totalDegree), signOf(bMo.totalDegree))
    if ([1, 5, 7, 9].includes(d)) items.push({ label: "A's Jupiter blesses B's Moon", score: 1, level: 'good', reason: 'Fortunate for stability' })
  }

  // 5. Sun Sign Affinity
  if (aSu && bSu) {
    const d = signDiff(signOf(aSu.totalDegree), signOf(bSu.totalDegree))
    if ([1, 5, 9].includes(d)) items.push({ label: 'Sun Sign Affinity', score: 1, level: 'good', reason: 'Soul compatibility' })
  }

  return items
}

const KOOTA_LABELS = {
  varna: 'Varna',
  vashya: 'Vashya',
  tara: 'Tara',
  yoni: 'Yoni',
  maitri: 'Graha Maitri',
  gana: 'Gana',
  bhakoot: 'Bhakoot',
  nadi: 'Nadi',
} as const

function countsAsStrength(key: keyof typeof KOOTA_LABELS, score: ReturnType<typeof calculateAshtakoot>): boolean {
  if (key === 'nadi') return score.nadi.points > 0
  if (key === 'maitri') return score.maitri.points >= 3
  if (key === 'gana') return score.gana.points >= 5
  if (key === 'yoni') return score.yoni.points >= 3
  if (key === 'bhakoot') return score.bhakoot.points === 7
  return false
}

function awarenessText(key: keyof typeof KOOTA_LABELS, points: number, max: number, insight: string): string {
  const mark = `${points} of ${max}.`
  if (key === 'varna') return `${mark} Work and values do not line up between these two.`
  if (key === 'yoni') return `${mark} Physical affinity is thin. Closeness here is a choice, not an easy instinct.`
  if (key === 'gana') return `${mark} Temperament does not settle. The two react at different speeds.`
  return `${mark} ${insight}`
}

function awarenessItems(score: ReturnType<typeof calculateAshtakoot>) {
  const items: { id: string; label: string; text: string }[] = (Object.keys(KOOTA_LABELS) as (keyof typeof KOOTA_LABELS)[])
    .filter(key => score[key].points < score[key].max && !countsAsStrength(key, score))
    .map(key => ({
      id: key,
      label: KOOTA_LABELS[key],
      text: awarenessText(key, score[key].points, score[key].max, score[key].insight),
    }))
  if (score.total < 18) {
    items.push({ id: 'low', label: 'Low gunas', text: 'The mechanical score is under 18. Read the houses, the 7th lord, and the Navamsha before treating the guna total as the decision.' })
  }
  if (score.total > 32) {
    items.push({ id: 'high', label: 'Very high total', text: 'Some lineages treat a score above 32 as too alike. Check that the two charts still keep a Mars–Venus spark and a separate identity.' })
  }
  return items
}

function getVerdict(score: number) {
  // Classical band is 18–32; above 32 some traditions refuse as “too similar”
  if (score > 32) {
    return {
      label: 'Excellent (Very High)',
      sub: 'Over 32 gunas — mainstream reads this as excellent; some paramparas caution “too similar.” Still verify Venus–Mars spark.',
      color: 'var(--teal)',
      icon: '◇',
    }
  }
  if (score >= 28) return { label: 'Excellent Match', sub: 'Strong Stage-1 guna score. Still verify Venus–Mars chemistry and longevity — gunas alone are incomplete.', color: 'var(--teal)', icon: '✦' }
  if (score >= 21) return { label: 'Good Match', sub: 'Within the classical 18–32 window with solid cohesion. Review dosha exceptions and Stage 3 chemistry.', color: 'var(--text-gold)', icon: '★' }
  if (score >= 18) return { label: 'Average Match', sub: 'Meets traditional minimum (18). Conscious effort needed; karmic bonds can outweigh low–mid gunas.', color: 'var(--accent)', icon: '✓' }
  return { label: 'Below Traditional Minimum', sub: 'Under 18 gunas — classically refused, yet low-guna marriages often thrive via strong planetary karma. Stage 2–3 is essential.', color: 'var(--rose)', icon: '!' }
}

const GRAHA_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const GRAHA_SYM: Record<string, string> = { Su: '☀', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋' }

type View = 'compat' | 'doshas' | 'ashtakoot' | 'matching' | 'married' | 'milan' | 'expand' | 'charts' | 'overlay' | 'planets' | 'dasha' | 'ashtakavarga' | 'shadbala' | 'yogas' | 'panchang' | 'all'

function personPayload(chart: ChartOutput) {
  return {
    name: chart.meta.name,
    birthDate: chart.meta.birthDate,
    birthTime: chart.meta.birthTime,
    birthPlace: chart.meta.birthPlace,
    latitude: chart.meta.latitude,
    longitude: chart.meta.longitude,
    timezone: chart.meta.timezone,
    gender: chart.meta.gender,
    settings: chart.meta.settings,
  }
}

function CompareContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const milanId = searchParams.get('milanId')
  const userPlan = ((session?.user as any)?.plan ?? 'free') as 'free' | 'gold' | 'platinum'
  const fullMilan = planMeetsUiGate(userPlan, 'gold')
  const [step, setStep] = useState<'a' | 'b' | 'done'>('a')
  const [chartA, setChartA] = useState<ChartOutput | null>(null)
  const [chartB, setChartB] = useState<ChartOutput | null>(null)
  const [view, setView] = useState<View>('ashtakoot')
  const [roleA, setRoleA] = useState<MilanRole>('boy')
  const [roleB, setRoleB] = useState<MilanRole>('girl')
  const [ganaSchool, setGanaSchool] = useState<GanaSchool>('classical')
  const [selectorFor, setSelectorFor] = useState<'a' | 'b' | null>(null)
  const [loadingChart, setLoadingChart] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [openingSaved, setOpeningSaved] = useState(false)
  const [savingMilan, setSavingMilan] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const selectorForRef = useRef<'a' | 'b' | null>(null)

  const handleViewChange = useCallback((id: View) => {
    if (id === 'all' && !fullMilan) return
    setView(id)
  }, [fullMilan])

  useEffect(() => {
    if (view === 'all' && !fullMilan) setView('ashtakoot')
  }, [view, fullMilan])

  useEffect(() => {
    if (!milanId) return
    let cancelled = false
    setOpeningSaved(true)
    setLoadError(null)
    ;(async () => {
      try {
        const res = await fetch(`/api/milan/${milanId}`)
        const json = await res.json()
        if (cancelled) return
        if (!json.success) {
          setLoadError(json.error || 'Could not open this Kundali Milan')
          return
        }
        const calc = async (person: Record<string, unknown>) => {
          const response = await fetch('/api/chart/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(person),
          })
          const body = await response.json()
          if (!body.success) throw new Error(body.error || 'Could not calculate chart')
          return body.data as ChartOutput
        }
        const [a, b] = await Promise.all([calc(json.milan.personA), calc(json.milan.personB)])
        if (cancelled) return
        setChartA(a)
        setChartB(b)
        setRoleA(json.milan.roleA)
        setRoleB(json.milan.roleB)
        setGanaSchool(json.milan.ganaSchool)
        setStep('done')
        setSaveMessage('Opened from My Charts')
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Could not open this Kundali Milan')
      } finally {
        if (!cancelled) setOpeningSaved(false)
      }
    })()
    return () => { cancelled = true }
  }, [milanId])

  const openSelector = useCallback((who: 'a' | 'b') => {
    selectorForRef.current = who
    setLoadError(null)
    setSelectorFor(who)
  }, [])

  const closeSelector = useCallback(() => {
    selectorForRef.current = null
    setSelectorFor(null)
  }, [])

  const handleSelectSaved = useCallback(async (c: {
    name: string
    birthDate: string
    birthTime: string
    birthPlace: string
    latitude: number
    longitude: number
    timezone: string
  }) => {
    const who = selectorForRef.current
    setLoadingChart(true)
    setLoadError(null)
    closeSelector()
    try {
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: c.name,
          birthDate: c.birthDate,
          birthTime: c.birthTime,
          birthPlace: c.birthPlace,
          latitude: c.latitude,
          longitude: c.longitude,
          timezone: c.timezone,
        }),
      })
      const json = await res.json()
      if (json.success) {
        if (who === 'a') {
          setChartA(json.data)
          setStep('b')
        } else if (who === 'b') {
          setChartB(json.data)
          setStep('done')
        }
      } else {
        setLoadError(json.error || 'Failed to load chart')
      }
    } catch (e) {
      console.error('Failed to load chart', e)
      setLoadError('Network error — please try again')
    } finally {
      setLoadingChart(false)
    }
  }, [closeSelector])

  const items = useMemo(() => chartA && chartB ? getCompatibility(chartA, chartB) : [], [chartA, chartB])
  
  const ashtakootScore = useMemo(() => {
    if (!chartA || !chartB) return null
    const aMo = chartA.grahas.find(g => g.id === 'Mo')
    const bMo = chartB.grahas.find(g => g.id === 'Mo')
    if (!aMo || !bMo) return null

    const aNak = (aMo.nakshatraIndex >= 0 ? aMo.nakshatraIndex : Math.floor(aMo.totalDegree / (360 / 27))) + 1
    const bNak = (bMo.nakshatraIndex >= 0 ? bMo.nakshatraIndex : Math.floor(bMo.totalDegree / (360 / 27))) + 1
    const aSign = aMo.rashi || signOf(aMo.totalDegree)
    const bSign = bMo.rashi || signOf(bMo.totalDegree)

    // Directional Ashtakoot: boy first, girl second
    const boyFirst = roleA === 'boy'
    const boyMo = boyFirst ? aMo : bMo
    const girlMo = boyFirst ? bMo : aMo
    const boyNak = boyFirst ? aNak : bNak
    const girlNak = boyFirst ? bNak : aNak
    const boySign = boyFirst ? aSign : bSign
    const girlSign = boyFirst ? bSign : aSign

    return calculateAshtakoot(boyNak, boySign, girlNak, girlSign, {
      boyMoonDegree: boyMo.totalDegree,
      girlMoonDegree: girlMo.totalDegree,
      boyPada: boyMo.pada,
      girlPada: girlMo.pada,
      ganaSchool,
    })
  }, [chartA, chartB, roleA, ganaSchool])

  const verdict = useMemo(() => ashtakootScore ? getVerdict(ashtakootScore.total) : null, [ashtakootScore]);
  const awareness = useMemo(() => ashtakootScore ? awarenessItems(ashtakootScore) : [], [ashtakootScore])

  const saveMilan = useCallback(async () => {
    if (!chartA || !chartB || !ashtakootScore) return
    if (status !== 'authenticated') {
      setSaveMessage('Sign in to save this match to My Charts.')
      return
    }
    setSavingMilan(true)
    setSaveMessage(null)
    try {
      const res = await fetch('/api/milan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${chartA.meta.name} & ${chartB.meta.name}`.slice(0, 120),
          roleA,
          roleB,
          ganaSchool,
          gunaTotal: ashtakootScore.total,
          personA: personPayload(chartA),
          personB: personPayload(chartB),
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setSaveMessage(json.error || 'Could not save this Kundali Milan')
        return
      }
      setSaveMessage('Saved to My Charts → Kundali Milan')
    } catch {
      setSaveMessage('Could not save this Kundali Milan')
    } finally {
      setSavingMilan(false)
    }
  }, [chartA, chartB, ashtakootScore, status, roleA, roleB, ganaSchool])

  const openMilanPrintPage = useCallback(async () => {
    if (!fullMilan || !chartA || !chartB || !ashtakootScore) return
    const { openMilanPrintPage: openPage } = await import('@/components/ui/MilanPrintPreview')
    openPage({
      chartA,
      chartB,
      ashtakoot: ashtakootScore,
      roleA,
      roleB,
    })
  }, [fullMilan, chartA, chartB, ashtakootScore, roleA, roleB])

  return (
    <div style={{ flex: '1 0 auto', width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', paddingBottom: '4rem' }}>
      <main className="compare-main" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 1rem' }}>
        
        {/* Navigation / Steps */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <div className="compare-steps" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-1)', padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid var(--border)' }}>
            {[{ s: 'a', l: 'Person 1', done: step !== 'a' }, { s: 'b', l: 'Person 2', done: step === 'done' }, { s: 'done', l: 'Match Result', done: false }].map(({ s, l, done }, i, arr) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, whiteSpace: 'nowrap', color: step === s ? 'var(--text-gold)' : done ? 'var(--teal)' : 'var(--text-muted)', fontWeight: step === s || done ? 700 : 400, fontSize: '0.8rem' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: step === s ? 'var(--gold)' : done ? 'var(--teal)' : 'var(--surface-3)', color: step === s || done ? '#000' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>{done ? '✓' : i + 1}</span>
                  {l}
                </div>
                {i < arr.length - 1 && <div style={{ width: 24, height: 1, background: 'var(--border)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Saved Chart Selector Modal — portaled; loading fallback covers chunk delay */}
        {selectorFor && (
          <SavedChartSelector
            onClose={closeSelector}
            onSelect={handleSelectSaved}
          />
        )}

        {openingSaved && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 1rem' }}>
            <VedaanshLoader message="Opening Kundali Milan…" />
          </div>
        )}

        {/* Input Forms */}
        {!openingSaved && step === 'a' && (
          <div className="fade-up" style={{ maxWidth: 500, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Enter Birth Details of Person 1</h2>
            <div className="card" style={{ padding: '2rem', position: 'relative' }}>
              {loadingChart && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-xl)' }}>
                   <div className="spin-loader" style={{ width: 30, height: 30 }} />
                </div>
              )}
              {loadError && (
                <div role="alert" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', background: 'rgba(212,120,138,0.1)', border: '1px solid rgba(212,120,138,0.3)', borderRadius: 8, color: 'var(--rose)', fontSize: '0.8rem' }}>
                  {loadError}
                </div>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <button 
                  type="button"
                  onClick={() => openSelector('a')}
                  className="btn btn-secondary w-full"
                  style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', borderStyle: 'dashed' }}
                >
                  📚 Select from My Charts
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR ENTER MANUALLY</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
                </div>
              </div>
              <BirthForm onResult={d => { setChartA(d); setStep('b') }} />
            </div>
          </div>
        )}

        {!openingSaved && step === 'b' && chartA && (
          <div className="fade-up" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(201,168,76,0.05)', borderRadius: 'var(--r-md)', border: '1px solid rgba(201,168,76,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-gold)', fontWeight: 800 }}>PERSON 1 LOADED</div>
                <div style={{ fontWeight: 600 }}>{chartA.meta.name}</div>
              </div>
              <button onClick={() => setStep('a')} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>Change</button>
            </div>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Enter Birth Details of Person 2</h2>
            <div className="card" style={{ padding: '2rem', position: 'relative' }}>
              {loadingChart && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-xl)' }}>
                   <div className="spin-loader" style={{ width: 30, height: 30 }} />
                </div>
              )}
              {loadError && (
                <div role="alert" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', background: 'rgba(212,120,138,0.1)', border: '1px solid rgba(212,120,138,0.3)', borderRadius: 8, color: 'var(--rose)', fontSize: '0.8rem' }}>
                  {loadError}
                </div>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <button 
                  type="button"
                  onClick={() => openSelector('b')}
                  className="btn btn-secondary w-full"
                  style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', borderStyle: 'dashed' }}
                >
                  📚 Select from My Charts
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR ENTER MANUALLY</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
                </div>
              </div>
              <BirthForm onResult={d => { setChartB(d); setStep('done') }} />
            </div>
          </div>
        )}

        {/* Match Results */}
        {step === 'done' && chartA && chartB && ashtakootScore && verdict && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Premium Score Card */}
            <div style={{ 
              background: 'var(--surface-1)', 
              borderRadius: 'var(--r-xl)', 
              padding: '2.5rem', 
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
              {/* Decorative elements */}
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: verdict.color, opacity: 0.05, filter: 'blur(60px)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, background: verdict.color, opacity: 0.05, filter: 'blur(60px)', borderRadius: '50%' }} />

              <div className="compare-score-row">
                <div className="compare-score-side is-a">
                  <div className="compare-score-name" style={{ color: 'var(--text-gold)' }}>{chartA.meta.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{NAKSHATRA_NAMES[Math.floor((chartA.grahas.find(g => g.id === 'Mo')?.totalDegree ?? 0) / (360 / 27))]}</div>
                </div>
                
                {/* Score Circle */}
                <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <svg width="140" height="140" viewBox="0 0 140 140">
                      <circle cx="70" cy="70" r="64" fill="none" stroke="var(--surface-3)" strokeWidth="8" />
                      <circle cx="70" cy="70" r="64" fill="none" stroke={verdict.color} strokeWidth="8" 
                              strokeDasharray={402} 
                              strokeDashoffset={402 - (402 * ashtakootScore.total) / 36}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                              transform="rotate(-90 70 70)" />
                   </svg>
                   <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: 900, color: verdict.color, lineHeight: 1 }}>{ashtakootScore.total}</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>OUT OF 36</span>
                   </div>
                </div>

                <div className="compare-score-side is-b">
                  <div className="compare-score-name" style={{ color: 'var(--accent)' }}>{chartB.meta.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{NAKSHATRA_NAMES[Math.floor((chartB.grahas.find(g => g.id === 'Mo')?.totalDegree ?? 0) / (360 / 27))]}</div>
                </div>
              </div>

              <div style={{ maxWidth: 560 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{verdict.icon} {verdict.label}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>{verdict.sub}</p>
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {ashtakootScore.eligibility.label}
                </p>
              </div>

              <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void saveMilan()}
                  disabled={savingMilan}
                  style={{ fontSize: '0.85rem' }}
                >
                  {savingMilan ? 'Saving…' : 'Save Kundali Milan'}
                </button>
                {fullMilan && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void openMilanPrintPage()}
                    style={{ fontSize: '0.85rem', gap: '0.4rem' }}
                  >
                    Print All Sections
                  </button>
                )}
              </div>
              {saveMessage && (
                <p className="no-print" style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {saveMessage}{' '}
                  {status !== 'authenticated' && (
                    <Link href="/login?callbackUrl=/compare" style={{ color: 'var(--text-gold)' }}>Sign in</Link>
                  )}
                  {saveMessage.startsWith('Saved') && (
                    <Link href="/my/charts" style={{ color: 'var(--text-gold)' }}>Open My Charts</Link>
                  )}
                </p>
              )}
            </div>

            {/* Match Insights Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--teal)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--teal)' }}>Relationship strengths</h4>
                <ul style={{ margin: 0, padding: '0 0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ashtakootScore.nadi.points > 0 && <li><strong>Nadi / prana:</strong> Different nadi — complementary life-force and healthier progeny outlook.</li>}
                  {ashtakootScore.maitri.points >= 3 && <li><strong>Graha Maitri:</strong> {ashtakootScore.maitri.insight}</li>}
                  {ashtakootScore.gana.points >= 5 && <li><strong>Gana temperament:</strong> {ashtakootScore.gana.insight}</li>}
                  {ashtakootScore.yoni.points >= 3 && <li><strong>Yoni affinity:</strong> {ashtakootScore.yoni.insight}</li>}
                  {ashtakootScore.eligibility.traditionallyAccepted && <li><strong>Eligibility band:</strong> Score sits in the classical 18–32 window.</li>}
                  {ashtakootScore.bhakoot.points === 7 && ashtakootScore.bhakoot.notes?.some(n => n.includes('cancelled')) && (
                    <li><strong>Bhakoot exception:</strong> Apparent dosha cancelled by friendly lords / direction rule.</li>
                  )}
                </ul>
              </div>
              <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--rose)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--rose)' }}>Areas for awareness</h4>
                {awareness.length > 0 ? (
                  <ul style={{ margin: 0, padding: '0 0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {awareness.map(item => (
                      <li key={item.id}><strong>{item.label}:</strong> {item.text}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Each of the eight kootas holds its full score. Dosha, Navamsha, and the 7th lord are the next places to read.
                  </p>
                )}
              </div>
            </div>

            {/* View Tabs */}
            <div className="compare-tabs no-print" style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              {([
                ['ashtakoot', 'Ashtakoot (36)'],
                ['matching', 'Match-Making'],
                ['married', 'Married Life'],
                ['milan', 'Deep Milan'],
                ['expand', 'Porutham + Timing'],
                ['doshas', 'Dosha Analysis'],
                ['compat', 'Aura Affinity'],
                ['charts', 'Side-by-Side'],
                ['overlay', 'Overlay View'],
                ['planets', 'Positions'],
                ['dasha', 'Dasha'],
                ['panchang', 'Panchang'],
                ['ashtakavarga', 'Ashtakavarga'],
                ...(fullMilan ? [['all', 'All Sections'] as [View, string]] : []),
              ] as [View, string][]).map(([id, label]) => (
                <button 
                  key={id} 
                  onClick={() => handleViewChange(id)} 
                  style={{ 
                    whiteSpace: 'nowrap',
                    padding: '0.5rem 1.25rem', 
                    background: view === id ? 'var(--surface-3)' : 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${view === id ? 'var(--text-gold)' : 'transparent'}`,
                    borderRadius: '4px 4px 0 0',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.85rem',
                    fontWeight: view === id ? 700 : 400,
                    color: view === id ? 'var(--text-gold)' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  {label}
                </button>
              ))}
              {fullMilan && (
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void openMilanPrintPage()}
                    style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  >
                    Print All Sections
                  </button>
                </div>
              )}
            </div>

            {/* Ashtakoot Detailed Breakdown */}
            {(view === 'ashtakoot' || (view === 'all' && fullMilan)) && (
              <div className="card fade-up" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <h3 className="label-caps" style={{ margin: 0, fontSize: '0.75rem' }}>Detailed Guna Milan Analysis</h3>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {ashtakootScore.layers.psychology}
                  </p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', width: '28%' }}>KOOTA</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>PERSON 1</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>PERSON 2</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', width: '18%' }}>STRENGTH</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>SCORE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { k: 'Varna', d: ashtakootScore.varna.meaning, s: ashtakootScore.varna },
                        { k: 'Vashya', d: ashtakootScore.vashya.meaning, s: ashtakootScore.vashya },
                        { k: 'Tara', d: ashtakootScore.tara.meaning, s: ashtakootScore.tara },
                        { k: 'Yoni', d: ashtakootScore.yoni.meaning, s: ashtakootScore.yoni },
                        { k: 'Maitri', d: ashtakootScore.maitri.meaning, s: ashtakootScore.maitri },
                        { k: 'Gana', d: ashtakootScore.gana.meaning, s: ashtakootScore.gana },
                        { k: 'Bhakoot', d: ashtakootScore.bhakoot.meaning, s: ashtakootScore.bhakoot },
                        { k: 'Nadi', d: ashtakootScore.nadi.meaning, s: ashtakootScore.nadi },
                      ].map((r, i) => (
                        <tr key={r.k} style={{ borderBottom: '1px solid var(--border-soft)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.k}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.d}</div>
                            {r.s.notes && r.s.notes[0] && (
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-gold)', marginTop: 4, lineHeight: 1.35 }}>{r.s.notes[0]}</div>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}><span style={{ color: 'var(--text-gold)', fontWeight: 600, fontSize: '0.9rem' }}>{r.s.p1}</span></td>
                          <td style={{ padding: '1rem' }}><span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>{r.s.p2}</span></td>
                          <td style={{ padding: '1rem' }}>
                             <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden', width: '100%' }}>
                                <div style={{ height: '100%', width: `${(r.s.points / r.s.max) * 100}%`, background: r.s.points === 0 ? 'var(--rose)' : r.s.points === r.s.max ? 'var(--teal)' : 'var(--text-gold)', borderRadius: 3 }} />
                             </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: r.s.points === 0 ? 'var(--rose)' : 'var(--text-primary)' }}>
                              {r.s.points}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}> / {r.s.max}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(view === 'matching' || (view === 'all' && fullMilan)) && (
              <div className="fade-up">
                <MilanMatchMakingPanel chartA={chartA} chartB={chartB} userPlan={userPlan} />
              </div>
            )}

            {(view === 'married' || (view === 'all' && fullMilan)) && (
              <div className="fade-up">
                <MilanMarriedLifePanel chartA={chartA} chartB={chartB} roleA={roleA} roleB={roleB} userPlan={userPlan} />
              </div>
            )}

            {/* Deep Milan — Stage 2/3 */}
            {(view === 'milan' || (view === 'all' && fullMilan)) && (
              <div className="fade-up">
                <MilanDeepAnalysisPanel chartA={chartA} chartB={chartB} ashtakoot={ashtakootScore} />
              </div>
            )}

            {/* Porutham + Timing + PDF + History */}
            {(view === 'expand' || (view === 'all' && fullMilan)) && (
              <div className="fade-up">
                <MilanExpandPanel
                  chartA={chartA}
                  chartB={chartB}
                  ashtakoot={ashtakootScore}
                  roleA={roleA}
                  roleB={roleB}
                  ganaSchool={ganaSchool}
                  onRoleChange={(a, b) => { setRoleA(a); setRoleB(b) }}
                  onGanaSchoolChange={setGanaSchool}
                />
              </div>
            )}

            {/* Dosha Analysis */}
            {(view === 'doshas' || (view === 'all' && fullMilan)) && (
              <div className="fade-up">
                 <CompatibilityDoshaPanel chartA={chartA} chartB={chartB} />
              </div>
            )}

            {/* Aura Affinity */}
            {(view === 'compat' || (view === 'all' && fullMilan)) && (
              <div className="card fade-up" style={{ padding: '2rem' }}>
                <h3 className="label-caps" style={{ marginBottom: '1.5rem' }}>Aura & Psychological Affinity</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ 
                      padding: '1.25rem', 
                      background: item.level === 'good' ? 'rgba(78,205,196,0.05)' : item.level === 'bad' ? 'rgba(224,123,142,0.05)' : 'var(--surface-2)',
                      border: `1px solid ${item.level === 'good' ? 'rgba(78,205,196,0.2)' : item.level === 'bad' ? 'rgba(224,123,142,0.2)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        {item.level === 'good' ? '🌟' : item.level === 'bad' ? '⚡' : '☯️'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts View */}
            {(view === 'charts' || (view === 'all' && fullMilan)) && (
              <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '2rem' }}>
                <div>
                   <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-gold)', fontWeight: 800 }}>{chartA.meta.name}</h3>
                   <VargaSwitcher vargas={chartA.vargas} vargaLagnas={chartA.vargaLagnas ?? {}} ascRashi={chartA.lagnas.ascRashi} lagnas={chartA.lagnas} arudhas={chartA.arudhas} userPlan={userPlan} direction="column" />
                </div>
                <div>
                   <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--accent)', fontWeight: 800 }}>{chartB.meta.name}</h3>
                   <VargaSwitcher vargas={chartB.vargas} vargaLagnas={chartB.vargaLagnas ?? {}} ascRashi={chartB.lagnas.ascRashi} lagnas={chartB.lagnas} arudhas={chartB.arudhas} userPlan={userPlan} direction="column" />
                </div>
              </div>
            )}

            {/* Overlay */}
            {(view === 'overlay' || (view === 'all' && fullMilan)) && (
               <div className="fade-up card" style={{ padding: '2rem' }}>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                     <h3 style={{ margin: 0 }}>Synastry Overlay</h3>
                     <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Visualizing Person 2&apos;s planets in Person 1&apos;s houses</p>
                  </div>
                  <VargaSwitcher 
                    vargas={chartA.vargas} 
                    vargaLagnas={chartA.vargaLagnas ?? {}} 
                    ascRashi={chartA.lagnas.ascRashi} 
                    lagnas={chartA.lagnas} 
                    arudhas={chartA.arudhas} 
                    userPlan={userPlan} 
                    comparisonGrahas={chartB.grahas} 
                  />
               </div>
            )}

            {/* Planets Table */}
            {(view === 'planets' || (view === 'all' && fullMilan)) && (
              <div className="card fade-up" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                   <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                         <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>PLANET</th>
                         <th style={{ padding: '1rem', color: 'var(--text-gold)' }}>{chartA.meta.name.toUpperCase()}</th>
                         <th style={{ padding: '1rem', color: 'var(--accent)' }}>{chartB.meta.name.toUpperCase()}</th>
                         <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>RELATION</th>
                      </tr>
                   </thead>
                   <tbody>
                      {GRAHA_ORDER.map(id => {
                        const gA = chartA.grahas.find(g => g.id === id)
                        const gB = chartB.grahas.find(g => g.id === id)
                        if (!gA || !gB) return null;
                        const sA = signOf(gA.totalDegree)
                        const sB = signOf(gB.totalDegree)
                        const diff = signDiff(sA, sB)
                        return (
                          <tr key={id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                             <td style={{ padding: '1rem', fontWeight: 700 }}>{GRAHA_SYM[id]} {id}</td>
                             <td style={{ padding: '1rem' }}>{rn(sA)} {gA.totalDegree.toFixed(1)}°</td>
                             <td style={{ padding: '1rem' }}>{rn(sB)} {gB.totalDegree.toFixed(1)}°</td>
                             <td style={{ padding: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 12 }}>{diff}/{(14-diff)%12 || 12} Axis</span>
                             </td>
                          </tr>
                        )
                      })}
                   </tbody>
                </table>
              </div>
            )}

            {/* Other detailed views */}
            {(view === 'ashtakavarga' || (view === 'all' && fullMilan)) && chartA.ashtakavarga && chartB.ashtakavarga && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '1.25rem' }}>
                {[chartA, chartB].map((chart, i) => (
                  <div key={i} className="card" style={{ padding: '0.85rem' }}>
                    <div style={{ textAlign: 'center', fontWeight: 800, color: i === 0 ? 'var(--text-gold)' : 'var(--accent)', marginBottom: '0.75rem' }}>
                      {chart.meta.name} — SAV {chart.ashtakavarga!.savTotal}
                    </div>
                    <AshtakavargaGrid
                      userPlan={userPlan}
                      ashtakavarga={chart.ashtakavarga!}
                      ascRashi={chart.lagnas.ascRashi ?? 1}
                      grahas={chart.grahas}
                      transitGrahas={chart.grahas}
                      ayanamsha={chart.meta.settings.ayanamsha}
                      janmaNakshatraIndex={chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex}
                    />
                  </div>
                ))}
              </div>
            )}

            {(view === 'dasha' || (view === 'all' && fullMilan)) && (
               <div className="print-break" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '2rem' }}>
                  {[chartA, chartB].map((chart, i) => (
                    <div key={`dasha-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       <div style={{ textAlign: 'center', fontWeight: 800, color: i === 0 ? 'var(--text-gold)' : 'var(--accent)' }}>{chart.meta.name} — Dasha</div>
                       <div className="card" style={{ padding: '1.5rem' }}><DashaTree nodes={chart.dashas.vimshottari} birthDate={new Date(chart.meta.birthDate)} maxDepth={userPlan === 'free' ? 4 : 6} /></div>
                    </div>
                  ))}
               </div>
            )}

            {(view === 'panchang' || (view === 'all' && fullMilan)) && (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '2rem' }}>
                  {[chartA, chartB].map((chart, i) => (
                    <div key={`panchang-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       <div style={{ textAlign: 'center', fontWeight: 800, color: i === 0 ? 'var(--text-gold)' : 'var(--accent)' }}>{chart.meta.name} — Panchang</div>
                       <div className="card" style={{ padding: '1.5rem' }}><NatalPanchangPanel p={chart.panchang} moonRashi={chart.grahas.find(g => g.id === 'Mo')?.rashi} title="Natal Panchang" /></div>
                    </div>
                  ))}
               </div>
            )}

          </div>
        )}
      </main>
      
      {/* Footer Branding */}
      <footer className="no-print" style={{ marginTop: 'auto', padding: '3rem 0', textAlign: 'center', borderTop: '1px solid var(--border-soft)', opacity: 0.6 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>VEDAANSH PRECISION ASTROLOGY ENGINE</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-gold)', marginTop: '0.5rem' }}>SWISS EPHEMERIS · ASHTAKOOT + DEEP MILAN (3-STAGE)</div>
      </footer>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <VedaanshLoader />
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}

