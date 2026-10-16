// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/TransitBiWheelPanel.tsx
//  Bi-wheel chart + Moorthy Nirnaya + D9 gochar
// ─────────────────────────────────────────────────────────────

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import { analyzeD9Gochar, type D9GocharReport } from '@/lib/engine/d9Gochar'
import type { MoorthyResult } from '@/lib/engine/moorthyNirnaya'

const CircleChakra = dynamic(
  () => import('@/components/chakra/CircleChakra').then(m => m.CircleChakra),
  { ssr: false },
)

interface TransitBiWheelPanelProps {
  chart: ChartOutput
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function toneColor(tone: string): string {
  if (tone === 'supportive') return 'var(--teal)'
  if (tone === 'caution') return 'var(--rose)'
  return 'var(--amber)'
}

export function TransitBiWheelPanel({ chart }: TransitBiWheelPanelProps) {
  const [date, setDate] = useState(todayISO())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transitGrahas, setTransitGrahas] = useState<GrahaData[] | null>(null)
  const [moorthy, setMoorthy] = useState<MoorthyResult[]>([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const fetchAll = useCallback(async (d: string) => {
    setLoading(true)
    setError(null)
    try {
      const [chartRes, moorthyRes] = await Promise.all([
        fetch('/api/chart/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Transit',
            birthDate: d,
            birthTime: '12:00:00',
            birthPlace: chart.meta.birthPlace,
            latitude: chart.meta.latitude,
            longitude: chart.meta.longitude,
            timezone: chart.meta.timezone,
            settings: chart.meta.settings,
          }),
        }),
        fetch(`/api/transit/moorthy?asOf=${d}`),
      ])
      const chartJson = await chartRes.json()
      const moorthyJson = await moorthyRes.json()
      if (!chartJson.success) throw new Error(chartJson.error || 'Transit chart failed')
      setTransitGrahas(chartJson.data.grahas as GrahaData[])
      setMoorthy(moorthyJson.success ? moorthyJson.data : [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load bi-wheel data')
      setTransitGrahas(null)
      setMoorthy([])
    } finally {
      setLoading(false)
    }
  }, [chart])

  useEffect(() => {
    void fetchAll(date)
  }, [date, fetchAll])

  const d9Report: D9GocharReport | null = useMemo(() => {
    if (!transitGrahas?.length) return null
    const natalD9 = chart.vargas?.D9 ?? []
    const d9Lagna = (chart.vargaLagnas?.D9 ?? null) as Rashi | null
    return analyzeD9Gochar({
      transitGrahas,
      natalD9,
      d9Lagna,
    })
  }, [transitGrahas, chart.vargas, chart.vargaLagnas])

  const chartSize = isMobile ? 320 : 440

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.35rem' }}>
      <div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Natal inner · Transit outer
            </div>
            <h2 style={{ margin: '0.25rem 0 0', fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.35rem' : '1.75rem', color: 'var(--text-gold)' }}>
              Bi-wheel · Moorthy · D9
            </h2>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            Transit date
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                padding: '0.4rem 0.55rem',
                borderRadius: 8,
                border: '1px solid var(--border-soft)',
                background: 'var(--surface-3)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </label>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-gold)', fontStyle: 'italic' }}>
          Building bi-wheel…
        </div>
      )}
      {error && (
        <div className="card" style={{ padding: '1rem', color: 'var(--rose)' }}>{error}</div>
      )}

      {!loading && !error && transitGrahas && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', alignItems: 'start' }}>
          <div className="card" style={{ padding: isMobile ? '0.75rem' : '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
            <CircleChakra
              ascRashi={chart.lagnas.ascRashi}
              grahas={chart.grahas}
              lagnas={chart.lagnas}
              transitGrahas={transitGrahas}
              size={chartSize}
              showDegrees
              biWheel
              showTooltip
            />
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span><span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>●</span> Natal (inner)</span>
              <span><span style={{ color: 'rgba(139,124,246,0.95)', fontWeight: 700 }}>●</span> Transit (outer)</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Moorthy Nirnaya (Ju / Sa)
              </h3>
              {moorthy.length === 0 ? (
                <div className="card" style={{ padding: '0.85rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Moorthy data unavailable for this date.
                </div>
              ) : (
                moorthy.map(m => (
                  <div
                    key={m.planetId}
                    className="card"
                    style={{
                      padding: '0.85rem 1rem',
                      borderLeft: `4px solid ${toneColor(m.tone)}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{m.planetName} in {m.rashiName}</strong>
                      <span style={{ color: toneColor(m.tone), fontWeight: 800, fontSize: '0.78rem' }}>{m.metalLabel}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Ingress {m.ingressIso} · {m.weekday}
                    </div>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {m.summary}
                    </p>
                  </div>
                ))
              )}
            </section>

            {d9Report && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  D9 gochar{d9Report.d9LagnaName ? ` · D9 lagna ${d9Report.d9LagnaName}` : ''}
                </h3>
                {d9Report.highlights.length > 0 && (
                  <div className="card" style={{ padding: '0.75rem 0.9rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {d9Report.highlights.slice(0, 3).map((h, i) => (
                      <div key={i} style={{ marginBottom: i < 2 ? '0.35rem' : 0 }}>• {h}</div>
                    ))}
                  </div>
                )}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-3)', textAlign: 'left' }}>
                          {['Graha', 'D1', 'D9', 'Natal D9', 'H(D9)', 'Flags'].map(h => (
                            <th key={h} style={{ padding: '0.45rem 0.55rem', color: 'var(--text-muted)', fontWeight: 700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {d9Report.rows.map(r => (
                          <tr key={r.planetId} style={{ borderTop: '1px solid var(--border-soft)' }}>
                            <td style={{ padding: '0.4rem 0.55rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.planetName}</td>
                            <td style={{ padding: '0.4rem 0.55rem', color: 'var(--text-secondary)' }}>{r.transitD1Name}</td>
                            <td style={{ padding: '0.4rem 0.55rem', color: 'var(--text-secondary)' }}>{r.transitD9Name}</td>
                            <td style={{ padding: '0.4rem 0.55rem', color: 'var(--text-muted)' }}>{r.natalD9Name ?? '—'}</td>
                            <td style={{ padding: '0.4rem 0.55rem', color: 'var(--text-secondary)' }}>{r.houseFromD9Lagna ?? '—'}</td>
                            <td style={{ padding: '0.4rem 0.55rem', color: 'var(--text-gold)', fontWeight: 600 }}>
                              {[
                                r.isVargottamaTransit ? 'Vg' : null,
                                r.overNatalD9Ids.length ? `×${r.overNatalD9Ids.join(',')}` : null,
                              ].filter(Boolean).join(' ') || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          padding: '1rem 1.15rem',
          background: 'var(--surface-2)',
          borderRadius: 'var(--r-md)',
          border: '1px dashed var(--border-soft)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>How to read this:</strong> Bi-wheel shows natal grahas inside and transit outside from your D1 lagna.
        Moorthy uses the weekday of Ju/Sa sign ingress (gold/silver supportive; copper mixed; iron caution).
        D9 gochar maps the same transit longitudes into Navamsha for marriage/dharma confirmation — pair with dasha.
      </div>
    </div>
  )
}
