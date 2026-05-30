'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Layers, Home, Star } from 'lucide-react'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_SHORT, GRAHA_NAMES } from '@/types/astrology'

interface KPStellarPanelProps {
  chart: ChartOutput
}

type KPSubTab = 'significators' | 'cusps' | 'rp'

const MOBILE_TABS: { id: KPSubTab; icon: typeof Layers; label: string }[] = [
  { id: 'significators', icon: Layers, label: 'Sig' },
  { id: 'cusps', icon: Home, label: 'Cusps' },
  { id: 'rp', icon: Star, label: 'Ruling' },
]

export function KPStellarPanel({ chart }: KPStellarPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<KPSubTab>('significators')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isMobile) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeSubTab, isMobile])

  if (!chart.kp) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        KP Stellar analysis not available for this chart.
      </div>
    )
  }

  const { significators, cusps, rulingPlanets } = chart.kp

  const tabLabel = (tab: KPSubTab) => {
    if (tab === 'rp') return 'Ruling Planets'
    if (tab === 'cusps') return 'Cusps'
    return 'Significators'
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem', padding: isMobile ? '0.75rem 1rem 6rem' : undefined }}>
      {/* Header & Sub-tabs */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '0.75rem' : 0,
        borderBottom: '1px solid var(--border-soft)',
        paddingBottom: '1rem',
      }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontSize: isMobile ? '1.35rem' : '1.8rem' }}>
            Stellar Intelligence
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)' }}>
            Advanced Krishnamurti Padhdhati (KP) Analysis
          </p>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
            {(['significators', 'cusps', 'rp'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'calc(var(--r-md) - 2px)',
                  border: 'none',
                  background: activeSubTab === tab ? 'var(--gold-faint)' : 'transparent',
                  color: activeSubTab === tab ? 'var(--gold)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
              >
                {tabLabel(tab)}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeSubTab === 'significators' && <SignificatorsGrid significators={significators} grahas={chart.grahas} isMobile={isMobile} />}
      {activeSubTab === 'cusps' && <CuspalInterlinks cusps={cusps} isMobile={isMobile} />}
      {activeSubTab === 'rp' && <RulingPlanetsView rp={rulingPlanets} isMobile={isMobile} />}

      {isMobile && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
          background: 'var(--surface-1)',
          borderTop: '1px solid var(--border-soft)',
          display: 'flex', alignItems: 'stretch',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.18)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}>
          {MOBILE_TABS.map(({ id, icon: Icon, label }) => {
            const active = activeSubTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSubTab(id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '0.2rem', padding: '0.6rem 0.15rem 0.4rem',
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                }}
              >
                {active && (
                  <div style={{
                    position: 'absolute', top: 0, left: '20%', right: '20%',
                    height: 2, background: 'var(--accent)',
                    boxShadow: '0 0 10px var(--accent)',
                    borderRadius: '0 0 2px 2px',
                  }} />
                )}
                <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ opacity: active ? 1 : 0.7 }} />
                <span style={{
                  fontSize: '0.58rem',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  marginTop: '0.1rem',
                }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Significators View ─────────────────────────────────────────

function SignificatorsGrid({ significators, grahas, isMobile }: { significators: any; grahas: any[]; isMobile: boolean }) {
  const [viewMode, setViewMode] = useState<'house' | 'planet'>('house')

  if (isMobile && viewMode === 'house') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} isMobile={isMobile} />
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
          <div key={h} className="card" style={{ padding: '0.85rem', border: '1px solid var(--border-soft)' }}>
            <div style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '0.85rem', marginBottom: '0.65rem' }}>House {h}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {(['A', 'B', 'C', 'D'] as const).map(level => (
                <div key={level} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.72rem' }}>
                  <span style={{ minWidth: 52, fontWeight: 700, color: level === 'A' ? 'var(--gold)' : 'var(--text-muted)', fontSize: '0.62rem', textTransform: 'uppercase' }}>
                    Lvl {level}
                  </span>
                  <div style={{ flex: 1 }}>{renderGrahaList(significators.houseSignificators[h][level])}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} isMobile={isMobile} />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: isMobile ? 480 : undefined, borderCollapse: 'collapse', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
            <thead style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border-soft)' }}>
              <tr>
                <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left', width: 100 }}>{viewMode === 'house' ? 'House' : 'Planet'}</th>
                {viewMode === 'house' ? (
                  <>
                    <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left' }}>Level A</th>
                    <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left' }}>Level B</th>
                    <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left' }}>Level C</th>
                    <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left' }}>Level D</th>
                  </>
                ) : (
                  <th style={{ padding: isMobile ? '0.65rem' : '1rem', textAlign: 'left' }}>Houses Signified</th>
                )}
              </tr>
            </thead>
            <tbody>
              {viewMode === 'house' ? (
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                  <tr key={h} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem', fontWeight: 700, color: 'var(--gold)' }}>House {h}</td>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem' }}>{renderGrahaList(significators.houseSignificators[h].A)}</td>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem' }}>{renderGrahaList(significators.houseSignificators[h].B)}</td>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem' }}>{renderGrahaList(significators.houseSignificators[h].C)}</td>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem' }}>{renderGrahaList(significators.houseSignificators[h].D)}</td>
                  </tr>
                ))
              ) : (
                grahas.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem', fontWeight: 600 }}>{GRAHA_NAMES[g.id as GrahaId]}</td>
                    <td style={{ padding: isMobile ? '0.65rem' : '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {(significators.planetSignificators[g.id] || []).map((h: number) => (
                          <span key={h} style={{
                            background: 'var(--teal-faint)', padding: '0.2rem 0.5rem',
                            borderRadius: '4px', fontSize: '0.7rem', color: 'var(--teal)', fontWeight: 600,
                          }}>
                            H{h}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ViewModeToggle({ viewMode, setViewMode, isMobile }: { viewMode: 'house' | 'planet'; setViewMode: (m: 'house' | 'planet') => void; isMobile: boolean }) {
  return (
    <div style={{ display: 'flex', gap: isMobile ? '0.35rem' : '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        onClick={() => setViewMode('house')}
        className={`btn btn-sm ${viewMode === 'house' ? 'btn-primary' : 'btn-secondary'}`}
        style={{ fontSize: '0.7rem', flex: isMobile ? 1 : undefined }}
      >
        By House
      </button>
      <button
        onClick={() => setViewMode('planet')}
        className={`btn btn-sm ${viewMode === 'planet' ? 'btn-primary' : 'btn-secondary'}`}
        style={{ fontSize: '0.7rem', flex: isMobile ? 1 : undefined }}
      >
        By Planet
      </button>
    </div>
  )
}

function renderGrahaList(ids: GrahaId[]) {
  if (!ids || ids.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
      {ids.map(id => (
        <span key={id} style={{
          background: 'var(--gold-faint)', padding: '0.2rem 0.5rem',
          borderRadius: '4px', fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600,
          border: '1px solid var(--border-soft)',
        }}>
          {id}
        </span>
      ))}
    </div>
  )
}

// ── Cuspal Interlinks View ─────────────────────────────────────

function CuspalInterlinks({ cusps, isMobile }: { cusps: any[]; isMobile: boolean }) {
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {cusps.map((c, i) => (
          <div key={i} className="card" style={{ padding: '0.85rem', border: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '0.9rem' }}>House {c.house}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {RASHI_SHORT[c.rashi as Rashi]} {c.degree.toFixed(2)}°
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', fontSize: '0.72rem' }}>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', textTransform: 'uppercase' }}>Sign Lord</span><div>{renderLord(c.signLord)}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', textTransform: 'uppercase' }}>Star Lord</span><div>{renderLord(c.starLord)}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', textTransform: 'uppercase' }}>Sub Lord</span><div>{renderLord(c.subLord, true)}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', textTransform: 'uppercase' }}>Sub-Sub</span><div>{renderLord(c.subSubLord)}</div></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border-soft)' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left' }}>House</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Cusp Degree</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Sign Lord</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Star Lord</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Sub Lord</th>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Sub-Sub Lord</th>
            </tr>
          </thead>
          <tbody>
            {cusps.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--gold)' }}>{c.house}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 600 }}>{RASHI_SHORT[c.rashi as Rashi]}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{c.degree.toFixed(2)}°</span>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>{renderLord(c.signLord)}</td>
                <td style={{ padding: '1rem' }}>{renderLord(c.starLord)}</td>
                <td style={{ padding: '1rem' }}>{renderLord(c.subLord, true)}</td>
                <td style={{ padding: '1rem' }}>{renderLord(c.subSubLord)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function renderLord(id: GrahaId, isSub = false) {
  return (
    <span style={{
      color: isSub ? 'var(--gold)' : 'var(--text-primary)',
      fontWeight: isSub ? 700 : 500,
      fontSize: '0.85rem',
    }}>
      {GRAHA_NAMES[id]}
    </span>
  )
}

// ── Ruling Planets View ───────────────────────────────────────

function RulingPlanetsView({ rp, isMobile }: { rp: any; isMobile: boolean }) {
  const items = [
    { label: 'Day Lord', value: rp.dayLord, icon: '📅' },
    { label: 'Moon Sign Lord', value: rp.moonSignLord, icon: '🌙' },
    { label: 'Moon Star Lord', value: rp.moonStarLord, icon: '✨' },
    { label: 'Lagna Sign Lord', value: rp.lagnaSignLord, icon: '🌅' },
    { label: 'Lagna Star Lord', value: rp.lagnaStarLord, icon: '✦' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem' }}>
      <p style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}>
        Calculated for the moment of query/event. Ruling Planets provide instant answers and time-rectification clues.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: isMobile ? '0.65rem' : '1rem' }}>
        {items.map((item, i) => (
          <div key={i} className="card" style={{
            padding: isMobile ? '1rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
            background: 'var(--gradient-gold-muted)', border: '1px solid var(--border-soft)',
          }}>
            <div style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{item.label}</div>
              <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 600, color: 'var(--gold)' }}>{GRAHA_NAMES[item.value as GrahaId]}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem', background: 'var(--surface-2)', border: '1px dashed var(--border-soft)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '0.85rem' : '0.9rem', color: 'var(--text-primary)' }}>RP Verification</h4>
        <p style={{ margin: 0, fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          In KP, an event is promised only if the Ruling Planets (especially Lagna Star Lord and Moon Star Lord) are present in the significators of the houses concerned.
        </p>
      </div>
    </div>
  )
}
