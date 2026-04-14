// ─────────────────────────────────────────────────────────────
//  src/components/ui/TransitTimeline.tsx
//  Visual 12-Month Cosmic Roadmap Component
// ─────────────────────────────────────────────────────────────

'use client'

import React, { useState, useEffect } from 'react'
import { GRAHA_NAMES, RASHI_NAMES, type GrahaId } from '@/types/astrology'

interface TransitEvent {
  planetId:    GrahaId
  date:        string
  type:        string
  description: string
  house:       number
}

interface TransitTimelineProps {
  ascRashi: number
}

export function TransitTimeline({ ascRashi }: TransitTimelineProps) {
  const [events, setEvents] = useState<TransitEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'major'>('major')

  useEffect(() => {
    async function fetchTransits() {
      try {
        const res = await fetch(`/api/transit?ascRashi=${ascRashi}&months=12`)
        const json = await res.json()
        if (json.success) {
          setEvents(json.data)
        }
      } catch (err) {
        console.error('Failed to fetch transits:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTransits()
  }, [ascRashi])

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="spin-loader" style={{ margin: '0 auto 1.5rem', width: 40, height: 40, border: '3px solid var(--border-soft)', borderTopColor: 'var(--gold)', borderRadius: '50%' }} />
        <div style={{ color: 'var(--text-gold)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Calculating your personal roadmap...</div>
      </div>
    )
  }

  const GRAHA_ICONS: Record<string, string> = {
    'Ju': '♃',
    'Sa': '♄',
    'Ra': '☊',
    'Ke': '☋',
  }

  const GRAHA_COLORS: Record<string, string> = {
    'Ju': 'var(--teal)',
    'Sa': 'var(--gold)',
    'Ra': 'var(--rose)',
    'Ke': 'var(--amber)',
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-soft)', paddingBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-gold)' }}>12-Month Cosmic Roadmap</h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Upcoming planetary shifts relative to your natal Ascendant.</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--surface-3)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
          <button 
            onClick={() => setFilter('major')}
            style={{ 
              padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', 
              background: filter === 'major' ? 'var(--gold)' : 'transparent',
              color: filter === 'major' ? 'var(--text-on-gold)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700
            }}
          >Major Shifts</button>
          <button 
            onClick={() => setFilter('all')}
            style={{ 
              padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', 
              background: filter === 'all' ? 'var(--gold)' : 'transparent',
              color: filter === 'all' ? 'var(--text-on-gold)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700
            }}
          >All Movements</button>
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: '3rem' }}>
        {/* Central Line */}
        <div style={{ position: 'absolute', left: '1rem', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, var(--gold) 0%, var(--border-soft) 100%)', opacity: 0.3 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {events.map((ev, i) => {
            const date = new Date(ev.date)
            const month = date.toLocaleString('default', { month: 'short' })
            const day = date.getDate()
            const color = GRAHA_COLORS[ev.planetId] || 'var(--gold)'

            return (
              <div key={i} className="transit-row" style={{ position: 'relative' }}>
                {/* Dot */}
                <div style={{ 
                  position: 'absolute', left: '-2.4rem', top: '0.2rem', 
                  width: '12px', height: '12px', borderRadius: '50%', 
                  background: color, border: '3px solid var(--bg-page)',
                  boxShadow: `0 0 10px ${color}88`, zIndex: 2
                }} />

                {/* Date Label (Floating) */}
                <div style={{ 
                  position: 'absolute', left: '-7rem', top: '0', 
                  width: '4rem', textAlign: 'right', 
                  fontFamily: 'var(--font-mono)', fontSize: '0.75rem', 
                  color: 'var(--text-muted)', lineHeight: 1.2 
                }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{day}</div>
                  <div>{month}</div>
                </div>

                <div className="card" style={{ 
                  padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center',
                  background: `linear-gradient(90deg, ${color}05 0%, transparent 100%)`,
                  borderLeft: `4px solid ${color}`,
                  transition: 'transform 0.2s',
                  cursor: 'default'
                }} onMouseOver={e => e.currentTarget.style.transform = 'translateX(5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
                  
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '12px', 
                    background: 'var(--surface-3)', border: '1px solid var(--border-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', color: color
                  }}>
                    {GRAHA_ICONS[ev.planetId]}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span className="badge" style={{ background: `${color}15`, color: color, fontSize: '0.65rem', fontWeight: 800 }}>{ev.type.replace('_',' ').toUpperCase()}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.planetId === 'Ju' ? 'Bṛhaspati' : ev.planetId === 'Sa' ? 'Shani' : 'Nodes'}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {ev.description}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '80px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Influence</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: ev.type.includes('house') ? 'var(--text-gold)' : 'var(--text-secondary)' }}>
                      House {ev.house}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ 
        marginTop: '2rem', padding: '1.5rem', background: 'var(--surface-2)', 
        borderRadius: 'var(--r-md)', border: '1px dashed var(--border-soft)',
        fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6
      }}>
        💡 <strong>Analytical Tip:</strong> Transits of slow-moving planets like Jupiter and Saturn define the major cycles of your life. When they transit through your 1st, 5th, or 9th houses, it often marks periods of expansion and spiritual growth.
      </div>
    </div>
  )
}
