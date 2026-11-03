// ─────────────────────────────────────────────────────────────
//  src/components/ui/GrahaProfileHeader.tsx
//  Visual header for single-planet deep dives: dignity gauge,
//  house + drishti mini wheel, nakshatra position, Shadbala meter
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo } from 'react'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { getAspectedHouses } from '@/lib/engine/aspects'
import { DIGNITY_MAX, dignityRank } from '@/lib/ui/dignityScale'
import { lordColor } from '@/components/dasha/dashaPalette'
import { Gauge, Meter, SegmentRing, arcPath, polar } from '@/components/ui/viz'

const DIGNITY_LABEL: Record<string, string> = {
  exalted: 'Exalted', moolatrikona: 'Moolatrikona', own: 'Own sign', great_friend: 'Great friend',
  friend: 'Friend', neutral: 'Neutral', enemy: 'Enemy', great_enemy: 'Great enemy', debilitated: 'Debilitated',
}

/** 12 houses in a ring, Lagna at the top; occupied house gold, aspected houses accent. */
function HouseAspectWheel({ house, aspected, color }: { house: number; aspected: number[]; color: string }) {
  const size = 150
  const c = size / 2
  const rO = 66
  const rI = 38
  const step = (Math.PI * 2) / 12
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size, display: 'block', margin: '0 auto' }} role="img" aria-label={`In house ${house}; aspects houses ${aspected.join(', ')}`}>
      {Array.from({ length: 12 }, (_, i) => {
        const h = i + 1
        // House 1 centred at the top, counting counter-clockwise like a chart wheel
        const a0 = -i * step - step / 2
        const a1 = a0 + step
        const isHome = h === house
        const isAsp = aspected.includes(h)
        const [tx, ty] = polar(c, c, (rO + rI) / 2, (a0 + a1) / 2)
        return (
          <g key={h}>
            <path
              d={arcPath(c, c, rO, rI, a0 + 0.02, a1 - 0.02)}
              fill={isHome ? color : isAsp ? 'var(--accent)' : 'var(--surface-3)'}
              fillOpacity={isHome ? 0.95 : isAsp ? 0.55 : 1}
            >
              <title>{`House ${h}${isHome ? ' — placed here' : isAsp ? ' — receives drishti' : ''}`}</title>
            </path>
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill={isHome || isAsp ? 'var(--text-primary)' : 'var(--text-muted)'}>
              {h}
            </text>
          </g>
        )
      })}
      {aspected.map((h) => {
        const from = polar(c, c, rI - 2, -(house - 1) * step)
        const to = polar(c, c, rI - 2, -(h - 1) * step)
        return <line key={h} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="3 2" />
      })}
      <text x={c} y={c} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="var(--text-muted)">
        Lagna ↑
      </text>
    </svg>
  )
}

export function GrahaProfileHeader({ chart, id }: { chart: ChartOutput; id: GrahaId }) {
  const g = chart.grahas.find((x) => x.id === id)
  const info = useMemo(() => {
    if (!g) return null
    const asc = chart.lagnas.ascRashi
    const house = ((g.rashi - asc + 12) % 12) + 1
    return {
      house,
      aspected: getAspectedHouses(id, house),
      rank: dignityRank(g.dignity),
      shad: chart.shadbala?.planets?.[id],
    }
  }, [g, chart.lagnas.ascRashi, chart.shadbala, id])

  if (!g || !info) return null
  const color = lordColor(id)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))',
        gap: '0.6rem',
        padding: '0.8rem',
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
      }}
    >
      <Cell title="Dignity">
        {info.rank !== null ? (
          <Gauge value={info.rank} max={DIGNITY_MAX} valueText={DIGNITY_LABEL[g.dignity] ?? g.dignity} size={170} />
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem 0' }}>{g.dignity ?? '—'}</div>
        )}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
          {g.isRetro && <Flag color="var(--rose)">Retrograde</Flag>}
          {g.isCombust && <Flag color="var(--amber)">Combust</Flag>}
          {g.avastha?.baladi && <Flag color="var(--text-secondary)">{g.avastha.baladi}</Flag>}
        </div>
      </Cell>

      <Cell title={`House ${info.house} · drishti`}>
        <HouseAspectWheel house={info.house} aspected={info.aspected} color={color} />
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Aspects {info.aspected.map((h) => `H${h}`).join(', ')}
        </div>
      </Cell>

      <Cell title="Nakshatra">
        <SegmentRing
          segments={Array.from({ length: 27 }, (_, i) => ({
            label: String(i + 1),
            value: i === g.nakshatraIndex ? g.pada / 4 : 0,
            max: 1,
            color,
            active: i === g.nakshatraIndex,
            title: i === g.nakshatraIndex ? `${g.nakshatraName} pada ${g.pada}` : `Nakshatra ${i + 1}`,
          }))}
          showLabels={false}
          thickness={12}
          gapDeg={1}
          size={120}
          centerValue={g.pada}
          centerLabel="pada"
        />
        <div style={{ fontSize: '0.74rem', textAlign: 'center', color: 'var(--text-primary)', fontWeight: 700 }}>
          {g.nakshatraName}
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> · {g.rashiName} {g.degree.toFixed(1)}°</span>
        </div>
      </Cell>

      {info.shad && (
        <Cell title="Shadbala">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', textAlign: 'center', color: info.shad.isStrong ? 'var(--teal)' : 'var(--rose)' }}>
            {info.shad.total.toFixed(2)}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> / {info.shad.required} rupa</span>
          </div>
          <Meter value={info.shad.total} max={Math.max(info.shad.required * 1.6, info.shad.total)} threshold={info.shad.required} height={8} />
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {(info.shad.ratio * 100).toFixed(0)}% of the required strength
          </div>
        </Cell>
      )}
    </div>
  )
}

function Cell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 0 }}>
      <div className="label-caps" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{title}</div>
      {children}
    </div>
  )
}

function Flag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, color, border: `1px solid ${color}`, opacity: 0.9 }}>
      {children}
    </span>
  )
}
