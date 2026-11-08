'use client'
// src/app/compare/page.tsx — Professional Kundali Matching & Comparison
import { Link } from '@/i18n/navigation'
import { useState, useMemo, useRef, useCallback, useEffect, Suspense } from 'react'
import React from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import { NAKSHATRA_HI, RASHI_HI } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { calculateAshtakoot, type GanaSchool } from '@/lib/engine/ashtakoot'
import {
  awarenessItems,
  getCompatibility,
  getVerdict,
  kootaLabels,
  sameNadi,
} from '@/lib/engine/compareCompat'
import type { KootaKey } from '@/lib/engine/ashtakoot'
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
const CoupleNumerologyCard = dynamic(() => import('@/components/numerology/CoupleNumerologyCard').then(m => m.CoupleNumerologyCard), { ssr: false })
const MilanMarriedLifePanel = dynamic(() => import('@/components/ui/MilanMarriedLifePanel').then(m => m.MilanMarriedLifePanel), { ssr: false })
const MilanMatchMakingPanel = dynamic(() => import('@/components/ui/MilanMatchMakingPanel').then(m => m.MilanMatchMakingPanel), { ssr: false })
const RelationshipMarriagePanel = dynamic(() => import('@/components/ui/RelationshipMarriagePanel').then(m => m.RelationshipMarriagePanel), { ssr: false })
const NatalPanchangPanel = dynamic(() => import('@/components/panchang/NatalPanchangPanel').then(m => m.NatalPanchangPanel), { ssr: false })
function ChartLibraryLoader() {
  const t = useTranslations('compare')
  return (
    <div
      role="status"
      aria-label={t('loader.chartLibrary')}
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
  )
}

const SavedChartSelector = dynamic(
  () => import('@/components/ui/SavedChartSelector').then(m => m.SavedChartSelector),
  { ssr: false, loading: ChartLibraryLoader },
)

function signOf(deg: number): number {
  return Math.floor(((deg % 360) + 360) % 360 / 30) + 1
}

function signDiff(a: number, b: number): number {
  return ((b - a + 12) % 12) + 1
}

function rn(s: number, hi: boolean): string {
  if (hi) return RASHI_HI[s as Rashi] ?? '—'
  return RASHI_NAMES[s as keyof typeof RASHI_NAMES] ?? '—'
}

const KOOTA_ORDER: KootaKey[] = ['varna', 'vashya', 'tara', 'yoni', 'maitri', 'gana', 'bhakoot', 'nadi']

const GRAHA_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const GRAHA_SYM: Record<string, string> = { Su: '☀', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋' }

type View = 'verdict' | 'match' | 'people' | 'charts'
type ChartTool = 'charts' | 'overlay' | 'planets' | 'dasha' | 'panchang' | 'ashtakavarga' | 'compat'

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
  const t = useTranslations('compare')
  const { lang, hi } = useLang()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const milanId = searchParams.get('milanId')
  const userPlan = ((session?.user as any)?.plan ?? 'free') as 'free' | 'gold' | 'platinum'
  const fullMilan = planMeetsUiGate(userPlan, 'gold')
  const [step, setStep] = useState<'a' | 'b' | 'done'>('a')
  const [chartA, setChartA] = useState<ChartOutput | null>(null)
  const [chartB, setChartB] = useState<ChartOutput | null>(null)
  const [view, setView] = useState<View>('verdict')
  const [chartTool, setChartTool] = useState<ChartTool>('charts')
  const [person, setPerson] = useState<'a' | 'b'>('a')
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
    setView(id)
  }, [])

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
          setLoadError(json.error || t('errors.openSaved'))
          return
        }
        const calc = async (person: Record<string, unknown>) => {
          const response = await fetch('/api/chart/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(person),
          })
          const body = await response.json()
          if (!body.success) throw new Error(body.error || t('errors.calculateChart'))
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
        setSaveMessage(t('save.openedFromCharts'))
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : t('errors.openSaved'))
      } finally {
        if (!cancelled) setOpeningSaved(false)
      }
    })()
    return () => { cancelled = true }
  }, [milanId, t])

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
        setLoadError(json.error || t('errors.loadChart'))
      }
    } catch (e) {
      console.error('Failed to load chart', e)
      setLoadError(t('errors.network'))
    } finally {
      setLoadingChart(false)
    }
  }, [closeSelector, t])

  const items = useMemo(
    () => (chartA && chartB ? getCompatibility(chartA, chartB, lang) : []),
    [chartA, chartB, lang],
  )
  
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

    return calculateAshtakoot(
      boyNak,
      boySign,
      girlNak,
      girlSign,
      {
        boyMoonDegree: boyMo.totalDegree,
        girlMoonDegree: girlMo.totalDegree,
        boyPada: boyMo.pada,
        girlPada: girlMo.pada,
        ganaSchool,
      },
      lang,
    )
  }, [chartA, chartB, roleA, ganaSchool, lang])

  const labels = useMemo(() => kootaLabels(lang), [lang])

  const verdict = useMemo(() => (ashtakootScore ? getVerdict(ashtakootScore, lang) : null), [ashtakootScore, lang])
  const awareness = useMemo(() => (ashtakootScore ? awarenessItems(ashtakootScore, lang) : []), [ashtakootScore, lang])

  const saveMilan = useCallback(async () => {
    if (!chartA || !chartB || !ashtakootScore) return
    if (status !== 'authenticated') {
      setSaveMessage(t('save.signInRequired'))
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
        setSaveMessage(json.error || t('save.failed'))
        return
      }
      setSaveMessage(t('save.saved'))
    } catch {
      setSaveMessage(t('save.failed'))
    } finally {
      setSavingMilan(false)
    }
  }, [chartA, chartB, ashtakootScore, status, roleA, roleB, ganaSchool, t])

  const openMilanPrintPage = useCallback(async () => {
    if (!fullMilan || !chartA || !chartB || !ashtakootScore) return
    const { openMilanPrintPage: openPage } = await import('@/components/ui/MilanPrintPreview')
    openPage({
      chartA,
      chartB,
      ashtakoot: ashtakootScore,
      roleA,
      roleB,
      lang,
    })
  }, [fullMilan, chartA, chartB, ashtakootScore, roleA, roleB, lang])

  return (
    <div style={{ flex: '1 0 auto', width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', paddingBottom: '4rem' }}>
      <main className="compare-main" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 1rem' }}>
        
        {/* Navigation / Steps */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <div className="compare-steps" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-1)', padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid var(--border)' }}>
            {([
              { s: 'a' as const, l: t('steps.person1'), done: step !== 'a' },
              { s: 'b' as const, l: t('steps.person2'), done: step === 'done' },
              { s: 'done' as const, l: t('steps.matchResult'), done: false },
            ]).map(({ s, l, done }, i, arr) => (
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
            <VedaanshLoader message={t('loader.openingSaved')} />
          </div>
        )}

        {/* Input Forms */}
        {!openingSaved && step === 'a' && (
          <div className="fade-up" style={{ maxWidth: 500, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{t('form.enterPerson1')}</h2>
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
                  {t('form.selectFromCharts')}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('form.orManual')}</span>
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
                <div style={{ fontSize: '0.65rem', color: 'var(--text-gold)', fontWeight: 800 }}>{t('form.person1Loaded')}</div>
                <div style={{ fontWeight: 600 }}>{chartA.meta.name}</div>
              </div>
              <button onClick={() => setStep('a')} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>{t('form.change')}</button>
            </div>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{t('form.enterPerson2')}</h2>
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
                  {t('form.selectFromCharts')}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('form.orManual')}</span>
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(hi ? NAKSHATRA_HI : NAKSHATRA_NAMES)[Math.floor((chartA.grahas.find(g => g.id === 'Mo')?.totalDegree ?? 0) / (360 / 27))]}</div>
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
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{t('score.outOf36')}</span>
                   </div>
                </div>

                <div className="compare-score-side is-b">
                  <div className="compare-score-name" style={{ color: 'var(--accent)' }}>{chartB.meta.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(hi ? NAKSHATRA_HI : NAKSHATRA_NAMES)[Math.floor((chartB.grahas.find(g => g.id === 'Mo')?.totalDegree ?? 0) / (360 / 27))]}</div>
                </div>
              </div>

              <div style={{ maxWidth: 560 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{verdict.icon} {verdict.label}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>{verdict.sub}</p>
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {ashtakootScore.eligibility.label}
                </p>
                <p style={{ margin: '0.55rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t.rich('score.relationshipHint', {
                    link: (chunks) => (
                      <Link href="/relationship" style={{ color: 'var(--text-gold)', fontWeight: 700 }}>
                        {chunks}
                      </Link>
                    ),
                  })}
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
                  {savingMilan ? t('save.saving') : t('save.saveButton')}
                </button>
                {fullMilan && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void openMilanPrintPage()}
                    style={{ fontSize: '0.85rem', gap: '0.4rem' }}
                  >
                    {t('print.allSections')}
                  </button>
                )}
              </div>
              {saveMessage && (
                <p className="no-print" style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {saveMessage}{' '}
                  {status !== 'authenticated' && (
                    <Link href="/login?callbackUrl=/compare" style={{ color: 'var(--text-gold)' }}>{t('save.signIn')}</Link>
                  )}
                  {saveMessage === t('save.saved') && (
                    <Link href="/my/charts" style={{ color: 'var(--text-gold)' }}>{t('save.openMyCharts')}</Link>
                  )}
                </p>
              )}
            </div>

            {/* View Tabs */}
            <div className="compare-tabs no-print" style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              {([
                ['verdict', t('tabs.summary')],
                ['match', t('tabs.matchReading')],
                ['people', t('tabs.eachChart')],
                ['charts', t('tabs.charts')],
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
                    {t('print.allSections')}
                  </button>
                </div>
              )}
            </div>

            {view === 'verdict' && (
              <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--teal)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--teal)' }}>{t('verdict.strengthsTitle')}</h4>
                <ul style={{ margin: 0, padding: '0 0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ashtakootScore.nadi.points > 0 && !sameNadi(ashtakootScore) && (
                    <li><strong>{t('verdict.strengthNadi')}:</strong> {t('verdict.strengthNadiBody')}</li>
                  )}
                  {ashtakootScore.maitri.points >= 3 && <li><strong>{t('verdict.strengthMaitri')}:</strong> {ashtakootScore.maitri.insight}</li>}
                  {ashtakootScore.gana.points >= 5 && <li><strong>{t('verdict.strengthGana')}:</strong> {ashtakootScore.gana.insight}</li>}
                  {ashtakootScore.yoni.points >= 3 && <li><strong>{t('verdict.strengthYoni')}:</strong> {ashtakootScore.yoni.insight}</li>}
                  {ashtakootScore.eligibility.band === 'ideal' && (
                    <li><strong>{t('verdict.strengthEligibility')}:</strong> {t('verdict.strengthEligibilityBody')}</li>
                  )}
                  {ashtakootScore.bhakoot.points === 7 && ashtakootScore.bhakoot.notes?.some(n => n.includes('cancelled') || n.includes('निरस्त')) && (
                    <li><strong>{t('verdict.strengthBhakoot')}:</strong> {t('verdict.strengthBhakootBody')}</li>
                  )}
                </ul>
              </div>
              <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--rose)' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--rose)' }}>{t('verdict.awarenessTitle')}</h4>
                {awareness.length > 0 ? (
                  <ul style={{ margin: 0, padding: '0 0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {awareness.map(item => (
                      <li key={item.id}><strong>{item.label}:</strong> {item.text}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {t('verdict.awarenessEmpty')}
                  </p>
                )}
              </div>
            </div>
            <MilanExpandPanel
              chartA={chartA}
              chartB={chartB}
              ashtakoot={ashtakootScore}
              roleA={roleA}
              roleB={roleB}
              ganaSchool={ganaSchool}
              onRoleChange={(a, b) => { setRoleA(a); setRoleB(b) }}
              onGanaSchoolChange={setGanaSchool}
              userPlan={userPlan}
              part="manglik"
            />
            <div className="card fade-up" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <h3 className="label-caps" style={{ margin: 0, fontSize: '0.75rem' }}>{t('verdict.gunaTitle')}</h3>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {ashtakootScore.layers.psychology}
                  </p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', width: '28%' }}>{t('verdict.tableKoota')}</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('verdict.tablePerson1')}</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('verdict.tablePerson2')}</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', width: '18%' }}>{t('verdict.tableStrength')}</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>{t('verdict.tableScore')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {KOOTA_ORDER.map((key, i) => {
                        const s = ashtakootScore[key]
                        return (
                        <tr key={key} style={{ borderBottom: '1px solid var(--border-soft)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{labels[key]}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.meaning}</div>
                            {s.notes && s.notes[0] && (
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-gold)', marginTop: 4, lineHeight: 1.35 }}>{s.notes[0]}</div>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}><span style={{ color: 'var(--text-gold)', fontWeight: 600, fontSize: '0.9rem' }}>{s.p1}</span></td>
                          <td style={{ padding: '1rem' }}><span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>{s.p2}</span></td>
                          <td style={{ padding: '1rem' }}>
                             <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden', width: '100%' }}>
                                <div style={{ height: '100%', width: `${(s.points / s.max) * 100}%`, background: s.points === 0 ? 'var(--rose)' : s.points === s.max ? 'var(--teal)' : 'var(--text-gold)', borderRadius: 3 }} />
                             </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.points === 0 ? 'var(--rose)' : 'var(--text-primary)' }}>
                              {s.points}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}> / {s.max}</span>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            <MilanMarriedLifePanel chartA={chartA} chartB={chartB} roleA={roleA} roleB={roleB} userPlan={userPlan} pairOnly />
              </>
            )}

            {view === 'match' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <MilanMatchMakingPanel chartA={chartA} chartB={chartB} userPlan={userPlan} />
                <MilanExpandPanel
                  chartA={chartA}
                  chartB={chartB}
                  ashtakoot={ashtakootScore}
                  roleA={roleA}
                  roleB={roleB}
                  ganaSchool={ganaSchool}
                  onRoleChange={(a, b) => { setRoleA(a); setRoleB(b) }}
                  onGanaSchoolChange={setGanaSchool}
                  userPlan={userPlan}
                  part="match"
                />
                <CompatibilityDoshaPanel chartA={chartA} chartB={chartB} />
                <MilanDeepAnalysisPanel chartA={chartA} chartB={chartB} ashtakoot={ashtakootScore} />
                <CoupleNumerologyCard
                  title={t('numerology.title')}
                  a={{ birthDate: chartA.meta.birthDate, name: chartA.meta.name, label: chartA.meta.name?.trim() || t('charts.person1Fallback') }}
                  b={{ birthDate: chartB.meta.birthDate, name: chartB.meta.name, label: chartB.meta.name?.trim() || t('charts.person2Fallback') }}
                />
              </div>
            )}

            {view === 'people' && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(['a', 'b'] as const).map(id => {
                    const chart = id === 'a' ? chartA : chartB
                    const label = chart.meta?.name?.trim() || (id === 'a' ? t('charts.person1Fallback') : t('charts.person2Fallback'))
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPerson(id)}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: 'var(--r-sm)',
                          border: `1px solid ${person === id ? 'var(--text-gold)' : 'var(--border)'}`,
                          background: person === id ? 'var(--surface-3)' : 'var(--surface-1)',
                          color: person === id ? 'var(--text-gold)' : 'var(--text-muted)',
                          fontWeight: person === id ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                <RelationshipMarriagePanel
                  key={person}
                  chart={person === 'a' ? chartA : chartB}
                  userPlan={userPlan}
                  embedded
                />
              </div>
            )}

            {view === 'charts' && (
              <div className="no-print" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {([
                  ['charts', t('chartTools.sideBySide')],
                  ['overlay', t('chartTools.overlay')],
                  ['planets', t('chartTools.positions')],
                  ['dasha', t('chartTools.dasha')],
                  ['panchang', t('chartTools.panchang')],
                  ['ashtakavarga', t('chartTools.ashtakavarga')],
                  ['compat', t('chartTools.auraAffinity')],
                ] as [ChartTool, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setChartTool(id)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--r-sm)',
                      border: `1px solid ${chartTool === id ? 'var(--text-gold)' : 'var(--border)'}`,
                      background: chartTool === id ? 'var(--surface-3)' : 'var(--surface-1)',
                      color: chartTool === id ? 'var(--text-gold)' : 'var(--text-muted)',
                      fontWeight: chartTool === id ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {view === 'charts' && chartTool === 'compat' && (
              <div className="card fade-up" style={{ padding: '2rem' }}>
                <h3 className="label-caps" style={{ marginBottom: '1.5rem' }}>{t('charts.auraTitle')}</h3>
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
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.04em',
                        color: item.level === 'good' ? 'var(--teal)' : item.level === 'bad' ? 'var(--rose)' : 'var(--text-gold)',
                      }}>
                        {item.level === 'good' ? t('charts.levelGood') : item.level === 'bad' ? t('charts.levelCare') : t('charts.levelMix')}
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
            {view === 'charts' && chartTool === 'charts' && (
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
            {view === 'charts' && chartTool === 'overlay' && (
               <div className="fade-up card" style={{ padding: '2rem' }}>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                     <h3 style={{ margin: 0 }}>{t('charts.overlayTitle')}</h3>
                     <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('charts.overlayHint')}</p>
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
            {view === 'charts' && chartTool === 'planets' && (
              <div className="card fade-up" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                   <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                         <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>{t('charts.planetCol')}</th>
                         <th style={{ padding: '1rem', color: 'var(--text-gold)' }}>{chartA.meta.name.toUpperCase()}</th>
                         <th style={{ padding: '1rem', color: 'var(--accent)' }}>{chartB.meta.name.toUpperCase()}</th>
                         <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>{t('charts.relationCol')}</th>
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
                             <td style={{ padding: '1rem' }}>{rn(sA, hi)} {gA.totalDegree.toFixed(1)}°</td>
                             <td style={{ padding: '1rem' }}>{rn(sB, hi)} {gB.totalDegree.toFixed(1)}°</td>
                             <td style={{ padding: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 12 }}>{diff}/{(14-diff)%12 || 12} {t('charts.axis')}</span>
                             </td>
                          </tr>
                        )
                      })}
                   </tbody>
                </table>
              </div>
            )}

            {/* Other detailed views */}
            {view === 'charts' && chartTool === 'ashtakavarga' && chartA.ashtakavarga && chartB.ashtakavarga && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '1.25rem' }}>
                {[chartA, chartB].map((chart, i) => (
                  <div key={i} className="card" style={{ padding: '0.85rem' }}>
                    <div style={{ textAlign: 'center', fontWeight: 800, color: i === 0 ? 'var(--text-gold)' : 'var(--accent)', marginBottom: '0.75rem' }}>
                      {chart.meta.name} — {t('charts.sav')} {chart.ashtakavarga!.savTotal}
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

            {view === 'charts' && chartTool === 'dasha' && (
               <div className="print-break" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '2rem' }}>
                  {[chartA, chartB].map((chart, i) => (
                    <div key={`dasha-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       <div style={{ textAlign: 'center', fontWeight: 800, color: i === 0 ? 'var(--text-gold)' : 'var(--accent)' }}>{chart.meta.name} — {t('chartTools.dasha')}</div>
                       <div className="card" style={{ padding: '1.5rem' }}><DashaTree nodes={chart.dashas.vimshottari} birthDate={new Date(chart.meta.birthDate)} maxDepth={userPlan === 'free' ? 4 : 6} /></div>
                    </div>
                  ))}
               </div>
            )}

            {view === 'charts' && chartTool === 'panchang' && (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '2rem' }}>
                  {[chartA, chartB].map((chart, i) => (
                    <div key={`panchang-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       <div style={{ textAlign: 'center', fontWeight: 800, color: i === 0 ? 'var(--text-gold)' : 'var(--accent)' }}>{chart.meta.name} — {t('chartTools.panchang')}</div>
                       <div className="card" style={{ padding: '1.5rem' }}><NatalPanchangPanel p={chart.panchang} moonRashi={chart.grahas.find(g => g.id === 'Mo')?.rashi} chart={chart} title={t('charts.natalPanchang')} /></div>
                    </div>
                  ))}
               </div>
            )}

          </div>
        )}
      </main>
      
      {/* Footer Branding */}
      <footer className="no-print" style={{ marginTop: 'auto', padding: '3rem 0', textAlign: 'center', borderTop: '1px solid var(--border-soft)', opacity: 0.6 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>{t('footer.brand')}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-gold)', marginTop: '0.5rem' }}>{t('footer.tagline')}</div>
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

