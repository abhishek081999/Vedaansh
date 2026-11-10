'use client'

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { BhavaBalaHouse, BhavaBalaResult, Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { RASHI_HI } from '@/i18n/jyotish'
import { BarChart3, LayoutGrid, List, Sparkles, TrendingUp, Shield, Map, Eye } from 'lucide-react'

const COMPONENTS = [
  { key: 'adhipatiBala' as const, short: 'comp.adhipati' as const, full: 'comp.adhipatiFull' as const, icon: <Shield size={14} />, color: 'var(--teal)' },
  { key: 'digBala' as const, short: 'comp.dig' as const, full: 'comp.digFull' as const, icon: <Map size={14} />, color: 'var(--amber)' },
  { key: 'drishtiBala' as const, short: 'comp.drishti' as const, full: 'comp.drishtiFull' as const, icon: <Eye size={14} />, color: 'var(--rose)' },
]

const METRICS = [
  { key: 'adhipatiBala' as const, title: 'metric.adhipatiBala' as const, scale: 1, decimals: 1, color: 'var(--amber)' },
  { key: 'digBala' as const, title: 'metric.digBala' as const, scale: 1, decimals: 1, color: 'var(--text-gold)' },
  { key: 'drishtiBala' as const, title: 'metric.drishtiBala' as const, scale: 1, decimals: 1, color: 'var(--rose)' },
  { key: 'totalShash' as const, title: 'metric.totalShash' as const, scale: 1, decimals: 0, color: 'var(--teal)' },
  { key: 'totalRupa' as const, title: 'metric.totalRupa' as const, scale: 1, decimals: 2, color: 'var(--text-gold)' },
]

function statusKey(rupa: number): 'excellent' | 'strong' | 'average' | 'weak' {
  if (rupa >= 9) return 'excellent'
  if (rupa >= 7.5) return 'strong'
  if (rupa >= 6) return 'average'
  return 'weak'
}

function statusColor(rupa: number) {
  if (rupa >= 9) return 'var(--teal)'
  if (rupa >= 7.5) return 'var(--text-gold)'
  if (rupa >= 6) return 'var(--amber)'
  return 'var(--rose)'
}

function ClassicMetricCharts({ houses }: { houses: Record<number, BhavaBalaHouse> }) {
  const t = useTranslations('chartTools.bhavaBala')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
      {METRICS.map((metric) => {
        const vals = Array.from({ length: 12 }).map((_, i) => (houses[i + 1]?.[metric.key] as number) ?? 0)
        const max = Math.max(...vals.map((v) => Math.abs(v)), 1)
        
        return (
          <div key={metric.key} className="card" style={{ 
            padding: '1.25rem 0.5rem', 
            background: 'var(--surface-1)',
            border: '1px solid var(--border-soft)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              textAlign: 'center', 
              fontSize: '0.7rem', 
              fontWeight: 800, 
              marginBottom: '1.25rem', 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em'
            }}>
              {t(metric.title)}
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(12, 1fr)', 
              gap: '2px', 
              height: '140px',
              position: 'relative',
              paddingBottom: '20px' // Space for house numbers
            }}>
              {/* Baseline for Drishti Bala */}
              {metric.key === 'drishtiBala' && (
                <div style={{ 
                  position: 'absolute', 
                  left: 0, 
                  right: 0, 
                  top: '50px', // Adjusted to align with bars
                  height: '1px', 
                  background: 'var(--border-bright)', 
                  zIndex: 0 
                }} />
              )}

              {vals.map((v, idx) => {
                const isNegative = v < 0
                // For Drishti, we split the 100px height into 50/50
                const h = Math.max(1, (Math.abs(v) / max) * (metric.key === 'drishtiBala' ? 45 : 90))
                
                return (
                  <div key={`${metric.key}-${idx}`} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    position: 'relative',
                    height: '100%'
                  }}>
                    {/* Value label always at top of their respective bar area */}
                    <div style={{ 
                      fontSize: '0.45rem', 
                      color: 'var(--text-muted)', 
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      position: 'absolute',
                      top: metric.key === 'drishtiBala' ? (isNegative ? '55px' : `${50 - h - 12}px`) : `${90 - h - 12}px`,
                      textAlign: 'center',
                      width: '100%',
                      zIndex: 2,
                      transform: vals.some(val => val > 99) ? 'rotate(-45deg)' : 'none'
                    }}>
                      {v.toFixed(metric.decimals)}
                    </div>

                    {/* Bar Container */}
                    <div style={{ 
                      width: '100%', 
                      height: '100px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: metric.key === 'drishtiBala' ? 'flex-start' : 'flex-end',
                      paddingTop: metric.key === 'drishtiBala' ? '50px' : '0',
                      background: 'rgba(0,0,0,0.03)', // Light track
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                       {/* This inner div helps position the bar for Drishti */}
                       <div style={{ 
                         width: '100%', 
                         height: isNegative ? `${h}px` : '0', 
                         display: metric.key === 'drishtiBala' ? 'block' : 'none',
                         background: 'var(--rose)',
                         opacity: 0.8
                       }} />
                       
                       <div style={{ 
                         width: '100%', 
                         height: isNegative ? '0' : `${h}px`,
                         marginTop: metric.key === 'drishtiBala' ? `-${h}px` : '0',
                         background: metric.key === 'drishtiBala' ? 'var(--teal)' : `linear-gradient(180deg, ${metric.color}, var(--accent))`,
                         opacity: 0.9,
                         borderRadius: '1px 1px 0 0'
                       }} />
                    </div>

                    {/* House Number at fixed bottom */}
                    <div style={{ 
                      position: 'absolute',
                      bottom: '0',
                      fontSize: '0.6rem', 
                      color: 'var(--text-primary)', 
                      fontWeight: 800
                    }}>
                      {idx + 1}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HouseRadar({ house }: { house: BhavaBalaHouse }) {
  const t = useTranslations('chartTools.bhavaBala')
  const size = 200
  const center = size / 2
  const radius = 70
  const points = COMPONENTS.map((c, i) => {
    const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2
    // Normalized values for radar
    const val = house[c.key as keyof BhavaBalaHouse] as number
    let max = 60
    if (c.key === 'adhipatiBala') max = 500 // Adhipati can be large
    const pct = Math.min(1, Math.max(0, val / max))
    return `${center + Math.cos(angle) * radius * pct},${center + Math.sin(angle) * radius * pct}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="4 2" />
      <circle cx={center} cy={center} r={radius * 0.5} fill="none" stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="4 2" />
      {COMPONENTS.map((c, i) => {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2
        return (
          <line key={i} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke="var(--border-soft)" strokeWidth="1" />
        )
      })}
      <polygon points={points} fill="rgba(201,168,76,0.15)" stroke="var(--text-gold)" strokeWidth="2" />
      {COMPONENTS.map((c, i) => {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2
        const tx = center + Math.cos(angle) * (radius + 20)
        const ty = center + Math.sin(angle) * (radius + 20)
        return (
          <text key={i} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" style={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }}>
            {t(c.short)}
          </text>
        )
      })}
    </svg>
  )
}

export function BhavaBalaVisuals({ bhavaBala, chart }: { bhavaBala: BhavaBalaResult, chart?: any }) {
  const t = useTranslations('chartTools.bhavaBala')
  const { hi } = useLang()
  const signName = (rashi: Rashi) => (hi ? RASHI_HI[rashi] : RASHI_NAMES[rashi])
  const [viewMode, setViewMode] = useState<'charts' | 'classic' | 'modern'>('charts')
  const [activeHouse, setActiveHouse] = useState<number>(1)
  const { houses } = bhavaBala

  const currentHouse = houses[activeHouse]

  const ranked = useMemo(() => {
    return Object.values(houses).sort((a, b) => b.totalRupa - a.totalRupa)
  }, [houses])

  const avgStrength = useMemo(() => {
    const total = Object.values(houses).reduce((acc, h) => acc + h.totalRupa, 0)
    return total / 12
  }, [houses])

  const savData = useMemo(() => {
    if (!chart?.ashtakavarga || !chart?.lagnas?.ascRashi) return null
    const ascRashi = chart.lagnas.ascRashi
    return Array.from({ length: 12 }).map((_, i) => {
      const rIndex = (ascRashi - 1 + i) % 12
      return chart.ashtakavarga.sav[rIndex]
    })
  }, [chart])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Summary Card */}
      <div className="card" style={{ 
        padding: '1.5rem', 
        background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(139,124,246,0.05))',
        border: '1px solid rgba(201,168,76,0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05 }}>
            <Sparkles size={120} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="label-caps" style={{ color: 'var(--text-gold)', marginBottom: '0.5rem' }}>{t('title')}</div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>{t('strongest')}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--teal)' }}>{t('houseN', { n: String(bhavaBala.strongestHouse) })}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>{t('weakest')}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--rose)' }}>{t('houseN', { n: String(bhavaBala.weakestHouse) })}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>{t('avgStrength')}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t('rupas', { n: avgStrength.toFixed(2) })}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.25rem' }}>
             <button 
               className={`btn btn-sm ${viewMode === 'charts' ? 'active' : 'btn-ghost'}`} 
               onClick={() => setViewMode('charts')}
               style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}
             >
               <BarChart3 size={14} /> {t('charts')}
             </button>
             <button 
               className={`btn btn-sm ${viewMode === 'classic' ? 'active' : 'btn-ghost'}`} 
               onClick={() => setViewMode('classic')}
               style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}
             >
               <LayoutGrid size={14} /> {t('worksheet')}
             </button>
             <button 
               className={`btn btn-sm ${viewMode === 'modern' ? 'active' : 'btn-ghost'}`} 
               onClick={() => setViewMode('modern')}
               style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}
             >
               <TrendingUp size={14} /> {t('analytics')}
             </button>
          </div>
        </div>
      </div>

      {viewMode === 'charts' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="label-caps">{t('comparative')}</div>
          <ClassicMetricCharts houses={houses} />
          {savData && (
            <div className="card" style={{ padding: '1rem', background: 'var(--surface-1)' }}>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sav')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2px', alignItems: 'end', minHeight: 100 }}>
                {savData.map((v, idx) => {
                  const h = Math.max(4, (v / 40) * 80)
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{v}</div>
                      <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ 
                          width: '100%', 
                          height: h, 
                          borderRadius: 2, 
                          background: 'linear-gradient(180deg, var(--teal), var(--accent))',
                          opacity: 0.8
                        }} />
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{idx + 1}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'modern' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* House Selector Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem' }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const h = houses[i + 1]
              if (!h) return null
              const active = activeHouse === i + 1
              return (
                <button
                  key={i}
                  onClick={() => setActiveHouse(i + 1)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.75rem 0.5rem',
                    borderRadius: 'var(--r-md)',
                    background: active ? 'var(--surface-2)' : 'var(--surface-1)',
                    border: `1px solid ${active ? 'var(--text-gold)' : 'var(--border)'}`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>{t('hShort', { n: String(h.house) })}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: active ? 'var(--text-gold)' : 'var(--text-primary)' }}>{t(`ord.${i + 1}`)}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: statusColor(h.totalRupa), marginTop: '0.2rem' }}>{h.totalRupa.toFixed(1)}R</div>
                </button>
              )
            })}
          </div>

          {/* Active House Detail View */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
               <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('detailed')}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{t('houseName', { name: t(`name.${activeHouse}`) })}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span className="badge badge-outline" style={{ borderColor: 'var(--teal)', color: 'var(--teal)', fontSize: '0.65rem' }}>{signName(currentHouse.rashi)}</span>
                    <span className="badge badge-outline" style={{ borderColor: 'var(--amber)', color: 'var(--amber)', fontSize: '0.65rem' }}>{t('strengthBadge', { status: t(`status.${statusKey(currentHouse.totalRupa)}`) })}</span>
                  </div>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>{t('totalRupas')}</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: statusColor(currentHouse.totalRupa), lineHeight: 1 }}>{currentHouse.totalRupa.toFixed(3)}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('shashtiamsas', { n: currentHouse.totalShash.toFixed(2) })}</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-center">
               <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--surface-1)', borderRadius: 'var(--r-xl)', padding: '1rem' }}>
                  <HouseRadar house={currentHouse} />
               </div>
               <div style={{ display: 'grid', gap: '1rem' }}>
                  {COMPONENTS.map((c) => {
                    const val = currentHouse[c.key as keyof BhavaBalaHouse] as number
                    let max = 60
                    if (c.key === 'adhipatiBala') max = 500
                    const pct = Math.min(100, Math.max(0, (val / max) * 100))
                    return (
                      <div key={c.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ color: c.color, background: `${c.color}15`, padding: '0.4rem', borderRadius: 'var(--r-sm)' }}>{c.icon}</div>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t(c.full)}</span>
                           </div>
                           <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{val.toFixed(2)}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('rupaEach', { n: (val/60).toFixed(2) })}</div>
                           </div>
                        </div>
                        <div style={{ height: 10, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                           <div style={{ 
                             width: `${pct}%`, 
                             height: '100%', 
                             background: `linear-gradient(90deg, ${c.color}, var(--accent))`,
                             boxShadow: `0 0 10px ${c.color}33`
                           }} />
                        </div>
                      </div>
                    )
                  })}
               </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'classic' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           {/* Classical Table - JHora / Parashara Style */}
           <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-bright)' }}>
             <div style={{ background: 'var(--surface-2)', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-bright)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('classicalTitle')}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('valuesNote')}</span>
             </div>
             <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                 <thead>
                   <tr style={{ background: 'var(--surface-3)', borderBottom: '2px solid var(--border-bright)' }}>
                     <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid var(--border-soft)' }}>{t('colHouse')}</th>
                     <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-gold)', borderRight: '1px solid var(--border-soft)' }}>{t('colTotalSh')}</th>
                     <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--teal)', borderRight: '1px solid var(--border-soft)' }}>{t('colTotalRupa')}</th>
                     <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, borderRight: '1px solid var(--border-soft)' }}>{t('colLord')}</th>
                     <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, borderRight: '1px solid var(--border-soft)' }}>{t('colDig')}</th>
                     <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800 }}>{t('colDrig')}</th>
                   </tr>
                 </thead>
                 <tbody>
                   {Array.from({ length: 12 }).map((_, i) => {
                     const h = houses[i + 1]
                     if (!h) return null
                     const isOdd = i % 2 !== 0
                     return (
                       <tr key={h.house} style={{ 
                         background: activeHouse === h.house ? 'var(--surface-gold-soft)' : (isOdd ? 'var(--surface-1)' : 'transparent'),
                         borderBottom: '1px solid var(--border-soft)',
                         transition: 'background 0.2s ease'
                       }}>
                         <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--rose)', borderRight: '1px solid var(--border-soft)' }}>{t(`ord.${i + 1}`)}</td>
                         <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', borderRight: '1px solid var(--border-soft)' }}>{h.totalShash.toFixed(2)}</td>
                         <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', color: statusColor(h.totalRupa), borderRight: '1px solid var(--border-soft)' }}>{h.totalRupa.toFixed(3)}</td>
                         <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)', borderRight: '1px solid var(--border-soft)' }}>{h.adhipatiBala.toFixed(2)}</td>
                         <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)', borderRight: '1px solid var(--border-soft)' }}>{h.digBala.toFixed(2)}</td>
                         <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{h.drishtiBala.toFixed(2)}</td>
                       </tr>
                     )
                   })}
                 </tbody>
               </table>
             </div>
           </div>

           {/* Ranking Table */}
           <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                 <div style={{ background: 'var(--gold)', color: '#000', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}>
                   <List size={16} />
                 </div>
                 <div style={{ fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ranking')}</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-bright)' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 800 }}>{t('rank')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 800 }}>{t('colHouse')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 800 }}>{t('sign')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800 }}>{t('strengthR')}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800 }}>{t('statusCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((h, i) => (
                      <tr key={h.house} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                        <td style={{ padding: '0.65rem 0.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>#{i + 1}</td>
                        <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700 }}>{t(`name.${h.house}`)}</td>
                        <td style={{ padding: '0.65rem 0.5rem', fontSize: '0.75rem' }}>{signName(h.rashi)}</td>
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', color: statusColor(h.totalRupa) }}>{h.totalRupa.toFixed(3)}</td>
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                          <span className="badge badge-sm" style={{ 
                            background: `${statusColor(h.totalRupa)}15`, 
                            color: statusColor(h.totalRupa),
                            border: `1px solid ${statusColor(h.totalRupa)}44`,
                            fontSize: '0.65rem',
                            fontWeight: 800
                          }}>
                            {t(`status.${statusKey(h.totalRupa)}`)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
