'use client'
// src/app/compare/page.tsx — Professional Kundali Matching & Comparison
import { useState, useMemo } from 'react'
import React from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { BirthForm } from '@/components/ui/BirthForm'
import { useSession } from 'next-auth/react'
import { VargaSwitcher } from '@/components/chakra/VargaSwitcher'
import { DashaTree } from '@/components/dasha/DashaTree'
import { AshtakavargaGrid } from '@/components/ui/AshtakavargaGrid'
import { ShadbalaTable } from '@/components/ui/ShadbalaTable'
import { YogaList } from '@/components/ui/YogaList'
import type { ChartOutput, GrahaData } from '@/types/astrology'
import { RASHI_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import { calculateAshtakoot, getLord } from '@/lib/engine/ashtakoot'
import { CompatibilityDoshaPanel } from '@/components/ui/CompatibilityDoshaPanel'
import { NatalPanchangPanel } from '@/components/panchang/NatalPanchangPanel'
import { SavedChartSelector } from '@/components/ui/SavedChartSelector'

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

function getVerdict(score: number) {
  if (score >= 28) return { label: 'Excellent Match', sub: 'Ideal for a long-lasting and prosperous union.', color: 'var(--teal)', icon: '✨' }
  if (score >= 21) return { label: 'Good Match', sub: 'Strong compatibility with minor areas for adjustment.', color: 'var(--text-gold)', icon: '⭐' }
  if (score >= 18) return { label: 'Average Match', sub: 'Acceptable compatibility, requires conscious effort in some areas.', color: 'var(--accent)', icon: '✓' }
  return { label: 'Challenging Match', sub: 'Significant differences detected. Astrological remedies or careful consideration advised.', color: 'var(--rose)', icon: '⚠️' }
}

const GRAHA_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const GRAHA_SYM: Record<string, string> = { Su: '☀', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋' }

type View = 'compat' | 'doshas' | 'ashtakoot' | 'charts' | 'overlay' | 'planets' | 'dasha' | 'ashtakavarga' | 'shadbala' | 'yogas' | 'panchang' | 'all'

import { Suspense } from 'react'

function CompareContent() {
  const { data: session } = useSession()
  const userPlan = ((session?.user as any)?.plan ?? 'free') as 'free' | 'gold' | 'platinum'
  const [step, setStep] = useState<'a' | 'b' | 'done'>('a')
  const [chartA, setChartA] = useState<ChartOutput | null>(null)
  const [chartB, setChartB] = useState<ChartOutput | null>(null)
  const [view, setView] = useState<View>('ashtakoot')
  const [selectorFor, setSelectorFor] = useState<'a' | 'b' | null>(null)
  const [loadingChart, setLoadingChart] = useState(false)

  const items = useMemo(() => chartA && chartB ? getCompatibility(chartA, chartB) : [], [chartA, chartB])
  
  const ashtakootScore = useMemo(() => {
    if (!chartA || !chartB) return null;
    const aMo = chartA.grahas.find(g => g.id === 'Mo');
    const bMo = chartB.grahas.find(g => g.id === 'Mo');
    if (!aMo || !bMo) return null;
    
    const aNak = Math.floor(aMo.totalDegree / (360 / 27)) + 1;
    const bNak = Math.floor(bMo.totalDegree / (360 / 27)) + 1;
    const aSign = signOf(aMo.totalDegree);
    const bSign = signOf(bMo.totalDegree);
    
    return calculateAshtakoot(aNak, aSign, bNak, bSign);
  }, [chartA, chartB]);

  const verdict = useMemo(() => ashtakootScore ? getVerdict(ashtakootScore.total) : null, [ashtakootScore]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', paddingBottom: '4rem' }}>
      <main className="compare-main" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 1rem' }}>
        
        {/* Navigation / Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <div className="compare-steps" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-1)', padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid var(--border)' }}>
            {[{ s: 'a', l: 'Person 1', done: step !== 'a' }, { s: 'b', l: 'Person 2', done: step === 'done' }, { s: 'done', l: 'Match Result', done: false }].map(({ s, l, done }, i, arr) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: step === s ? 'var(--text-gold)' : done ? 'var(--teal)' : 'var(--text-muted)', fontWeight: step === s || done ? 700 : 400, fontSize: '0.8rem' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: step === s ? 'var(--gold)' : done ? 'var(--teal)' : 'var(--surface-3)', color: step === s || done ? '#000' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>{done ? '✓' : i + 1}</span>
                  {l}
                </div>
                {i < arr.length - 1 && <div style={{ width: 24, height: 1, background: 'var(--border)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Saved Chart Selector Modal */}
        {selectorFor && (
          <SavedChartSelector 
            onClose={() => setSelectorFor(null)}
            onSelect={async (c) => {
              setLoadingChart(true)
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
                    timezone: c.timezone
                  })
                })
                const json = await res.json()
                if (json.success) {
                  if (selectorFor === 'a') {
                    setChartA(json.data)
                    setStep('b')
                  } else {
                    setChartB(json.data)
                    setStep('done')
                  }
                }
              } catch (e) {
                console.error('Failed to load chart', e)
              } finally {
                setLoadingChart(false)
                setSelectorFor(null)
              }
            }}
          />
        )}

        {/* Input Forms */}
        {step === 'a' && (
          <div className="fade-up" style={{ maxWidth: 500, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Enter Birth Details of Person 1</h2>
            <div className="card" style={{ padding: '2rem', position: 'relative' }}>
              {loadingChart && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-xl)' }}>
                   <div className="spin-loader" style={{ width: 30, height: 30 }} />
                </div>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => setSelectorFor('a')}
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

        {step === 'b' && chartA && (
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
              <div style={{ marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => setSelectorFor('b')}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-gold)' }}>{chartA.meta.name}</div>
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

                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>{chartB.meta.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{NAKSHATRA_NAMES[Math.floor((chartB.grahas.find(g => g.id === 'Mo')?.totalDegree ?? 0) / (360 / 27))]}</div>
                </div>
              </div>

              <div style={{ maxWidth: 500 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{verdict.icon} {verdict.label}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>{verdict.sub}</p>
              </div>
            </div>

            {/* Match Insights Summary */}
            {step === 'done' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--teal)' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💎 Relationship Strengths</h4>
                  <ul style={{ margin: 0, padding: '0 0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ashtakootScore.nadi.points > 0 && <li><strong>Genetic Harmony:</strong> Nadi match indicates strong biological compatibility and healthy progeny.</li>}
                    {ashtakootScore.maitri.points >= 3 && <li><strong>Mutual Understanding:</strong> Good Lordship relationship suggests mental alignment and friendship.</li>}
                    {ashtakootScore.gana.points >= 5 && <li><strong>Temperamental Balance:</strong> Matching temperaments ensure fewer daily frictions.</li>}
                    {ashtakootScore.total >= 18 && <li><strong>Soul Connection:</strong> Overall score suggests a stable foundation for a long-term bond.</li>}
                  </ul>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--rose)' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🕯️ Areas for Awareness</h4>
                  <ul style={{ margin: 0, padding: '0 0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ashtakootScore.bhakoot.points === 0 && <li><strong>Bhakoot Dosha:</strong> Potential for emotional distance; focus on open communication and joint growth.</li>}
                    {ashtakootScore.nadi.points === 0 && <li><strong>Nadi Dosha:</strong> May impact physical health or lineage; consult for specific remedial measures.</li>}
                    {ashtakootScore.maitri.points < 3 && <li><strong>Mental Friction:</strong> Different mindsets require conscious effort to appreciate each other&apos;s perspective.</li>}
                    {ashtakootScore.total < 18 && <li><strong>Energy Mismatch:</strong> Requires extra dedication and possibly traditional rituals to harmonize energies.</li>}
                  </ul>
                </div>
              </div>
            )}

            {/* View Tabs */}
            <div className="no-print" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              {([
                ['ashtakoot', '🎎 Ashtakoot (36 Point)'],
                ['doshas', '⚔️ Dosha Analysis'],
                ['compat', '🔮 Aura Affinity'],
                ['charts', '◯ Side-by-Side'],
                ['overlay', '⚭ Overlay View'],
                ['planets', '✦ Positions'],
                ['dasha', '⏳ Dasha'],
                ['panchang', '📅 Panchang'],
                ['all', '🖨 Print All'],
              ] as [View, string][]).map(([id, label]) => (
                <button 
                  key={id} 
                  onClick={() => setView(id)} 
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
            </div>

            {/* Ashtakoot Detailed Breakdown */}
            {(view === 'ashtakoot' || view === 'all') && (
              <div className="card fade-up" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <h3 className="label-caps" style={{ margin: 0, fontSize: '0.75rem' }}>Detailed Guna Milan Analysis</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', width: '25%' }}>KOOTA (FACTOR)</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>PERSON 1</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>PERSON 2</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', width: '20%' }}>STRENGTH</th>
                        <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>SCORE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { k: 'Varna', d: 'Ego & Soul Level', s: ashtakootScore.varna, icon: '🕉️' },
                        { k: 'Vashya', d: 'Mutual Control', s: ashtakootScore.vashya, icon: '🤝' },
                        { k: 'Tara', d: 'Destiny & Health', s: ashtakootScore.tara, icon: '⭐' },
                        { k: 'Yoni', d: 'Physical Bond', s: ashtakootScore.yoni, icon: '🧬' },
                        { k: 'Maitri', d: 'Mental Harmony', s: ashtakootScore.maitri, icon: '🧠' },
                        { k: 'Gana', d: 'Temperament', s: ashtakootScore.gana, icon: '🎭' },
                        { k: 'Bhakoot', d: 'Emotional Growth', s: ashtakootScore.bhakoot, icon: '🌊' },
                        { k: 'Nadi', d: 'Genetic Health', s: ashtakootScore.nadi, icon: '🩸' },
                      ].map((r, i) => (
                        <tr key={r.k} style={{ borderBottom: '1px solid var(--border-soft)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '1.2rem' }}>{r.icon}</span>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.k}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{r.d}</div>
                              </div>
                            </div>
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

            {/* Dosha Analysis */}
            {(view === 'doshas' || view === 'all') && (
              <div className="fade-up">
                 <CompatibilityDoshaPanel chartA={chartA} chartB={chartB} />
              </div>
            )}

            {/* Aura Affinity */}
            {(view === 'compat' || view === 'all') && (
              <div className="card fade-up" style={{ padding: '2rem' }}>
                <h3 className="label-caps" style={{ marginBottom: '1.5rem' }}>Aura & Psychological Affinity</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
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
            {(view === 'charts' || view === 'all') && (
              <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
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
            {(view === 'overlay' || view === 'all') && (
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
            {(view === 'planets' || view === 'all') && (
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
            {(['dasha', 'panchang'].includes(view) || view === 'all') && (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                  {[chartA, chartB].map((chart, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       <div style={{ textAlign: 'center', fontWeight: 800, color: i === 0 ? 'var(--text-gold)' : 'var(--accent)' }}>{chart.meta.name}</div>
                       {view === 'dasha' && <div className="card" style={{ padding: '1.5rem' }}><DashaTree nodes={chart.dashas.vimshottari} birthDate={new Date(chart.meta.birthDate)} /></div>}
                       {view === 'panchang' && <div className="card" style={{ padding: '1.5rem' }}><NatalPanchangPanel p={chart.panchang} title="Natal Panchang" /></div>}
                    </div>
                  ))}
               </div>
            )}

          </div>
        )}
      </main>
      
      {/* Footer Branding */}
      <footer style={{ marginTop: 'auto', padding: '3rem 0', textAlign: 'center', borderTop: '1px solid var(--border-soft)', opacity: 0.6 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>VEDAANSH PRECISION ASTROLOGY ENGINE</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-gold)', marginTop: '0.5rem' }}>SWISS EPHEMERIS · ASHTAKOOT MILAN 2.0</div>
      </footer>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spin-loader" style={{ width: 40, height: 40, border: '3px solid var(--border-soft)', borderTopColor: 'var(--gold)', borderRadius: '50%' }} />
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}
