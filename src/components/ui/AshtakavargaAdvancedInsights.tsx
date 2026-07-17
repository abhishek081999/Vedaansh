// ─────────────────────────────────────────────────────────────
//  src/components/ui/AshtakavargaAdvancedInsights.tsx
//  Transcript-faithful Ashtakavarga insights — polished workspace UI
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Compass,
  Home,
  Layers,
  Scale,
  Sparkles,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
} from 'lucide-react'
import {
  analyzeAshtakavargaInsights,
  bhavaBhaavam,
  negativeHouseNotes,
  type AshtakavargaInsights,
  type BinduBand,
  type NamedTotal,
} from '@/lib/engine/ashtakavargaInsights'
import type { AshtakavargaResult, GrahaData, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'

type SubTab = 'overview' | 'structure' | 'houses' | 'bhava' | 'timing'

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Sparkles size={14} /> },
  { id: 'structure', label: 'Khandas', icon: <Layers size={14} /> },
  { id: 'houses', label: 'Houses', icon: <Home size={14} /> },
  { id: 'bhava', label: 'Bhava-Bhaavam', icon: <Scale size={14} /> },
  { id: 'timing', label: 'Timing', icon: <TrendingUp size={14} /> },
]

const FOCUS_PRESETS: { house: number; label: string }[] = [
  { house: 10, label: 'Career' },
  { house: 7, label: 'Partner' },
  { house: 6, label: 'Health' },
  { house: 2, label: 'Wealth' },
  { house: 4, label: 'Home' },
  { house: 5, label: 'Children' },
  { house: 9, label: 'Fortune' },
  { house: 11, label: 'Gains' },
  { house: 1, label: 'Self' },
  { house: 12, label: 'Foreign' },
]

function bandColor(band: BinduBand): string {
  switch (band) {
    case 'critical':
    case 'authority':
    case 'loss':
    case 'weak':
      return 'var(--rose)'
    case 'neutral':
      return 'var(--amber, var(--text-gold))'
    case 'functional':
    case 'clean':
      return 'var(--blue, #60a5fa)'
    case 'strong':
    case 'abundant':
      return 'var(--teal)'
    default:
      return 'var(--text-muted)'
  }
}

function bandTint(band: BinduBand): string {
  switch (band) {
    case 'critical':
    case 'authority':
    case 'loss':
    case 'weak':
      return 'color-mix(in srgb, var(--rose) 12%, transparent)'
    case 'neutral':
      return 'color-mix(in srgb, var(--text-gold) 10%, transparent)'
    case 'functional':
    case 'clean':
      return 'color-mix(in srgb, var(--blue, #60a5fa) 10%, transparent)'
    case 'strong':
    case 'abundant':
      return 'color-mix(in srgb, var(--teal) 12%, transparent)'
    default:
      return 'var(--surface-1)'
  }
}

function Meter({
  value,
  max,
  color,
  height = 8,
}: {
  value: number
  max: number
  color: string
  height?: number
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div
      style={{
        height,
        background: 'var(--surface-2)',
        borderRadius: 999,
        overflow: 'hidden',
        border: '1px solid var(--border-soft)',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 70%, white))`,
          borderRadius: 999,
          transition: 'width 280ms ease',
        }}
      />
    </div>
  )
}

function SectionHead({
  title,
  subtitle,
  icon,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        {icon ? <span style={{ color: 'var(--text-gold)', display: 'inline-flex' }}>{icon}</span> : null}
        <h3
          style={{
            margin: 0,
            fontSize: '0.92rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
      </div>
      {subtitle ? (
        <p style={{ margin: '0.28rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

function StatTile({
  label,
  value,
  detail,
  accent,
  active,
}: {
  label: string
  value: string | number
  detail?: string
  accent?: string
  active?: boolean
}) {
  return (
    <div
      style={{
        padding: '0.85rem 0.9rem',
        borderRadius: 'var(--r-md)',
        border: `1px solid ${active ? 'var(--gold)' : 'var(--border-soft)'}`,
        background: active
          ? 'linear-gradient(160deg, var(--gold-faint), var(--surface-1))'
          : 'var(--surface-1)',
        minHeight: 92,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
      }}
    >
      <div
        style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: accent ?? 'var(--text-primary)', lineHeight: 1.1 }}>
        {value}
      </div>
      {detail ? (
        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 'auto' }}>
          {detail}
        </div>
      ) : null}
    </div>
  )
}

function CompareRow({
  items,
  peakId,
  accent = 'var(--teal)',
}: {
  items: NamedTotal[]
  peakId: string
  accent?: string
}) {
  const max = Math.max(...items.map((i) => i.total), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {items.map((item) => {
        const peak = item.id === peakId
        return (
          <div key={item.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: 5 }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: peak ? 800 : 600,
                  color: peak ? 'var(--text-gold)' : 'var(--text-secondary)',
                }}
              >
                {item.name}
                {peak ? ' · peak' : ''}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: peak ? 'var(--text-gold)' : accent, fontVariantNumeric: 'tabular-nums' }}>
                {item.total}
              </span>
            </div>
            <Meter value={item.total} max={max} color={peak ? 'var(--gold)' : accent} />
          </div>
        )
      })}
    </div>
  )
}

function DirectionCompass({
  directions,
  peakId,
}: {
  directions: NamedTotal[]
  peakId: string
}) {
  const byId = Object.fromEntries(directions.map((d) => [d.id, d]))
  const cells: Array<{ id: string; label: string; gridArea: string }> = [
    { id: 'north', label: 'N', gridArea: '1 / 2' },
    { id: 'west', label: 'W', gridArea: '2 / 1' },
    { id: 'east', label: 'E', gridArea: '2 / 3' },
    { id: 'south', label: 'S', gridArea: '3 / 2' },
  ]
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr 1fr',
        gridTemplateRows: 'auto auto auto',
        gap: '0.45rem',
        alignItems: 'center',
        justifyItems: 'center',
        maxWidth: 320,
        margin: '0 auto',
      }}
    >
      {cells.map((c) => {
        const d = byId[c.id]
        const peak = c.id === peakId
        return (
          <div
            key={c.id}
            style={{
              gridArea: c.gridArea,
              width: '100%',
              minWidth: 88,
              padding: '0.65rem 0.5rem',
              borderRadius: 'var(--r-md)',
              border: `1px solid ${peak ? 'var(--gold)' : 'var(--border-soft)'}`,
              background: peak ? 'var(--gold-faint)' : 'var(--surface-1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              {c.label}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: peak ? 'var(--text-gold)' : 'var(--teal)' }}>
              {d?.total ?? '—'}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {d?.name.split(' ')[0] ?? ''}
            </div>
          </div>
        )
      })}
      <div
        style={{
          gridArea: '2 / 2',
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--text-gold)',
        }}
      >
        <Compass size={22} />
      </div>
    </div>
  )
}

function HouseHeatStrip({ ratings }: { ratings: AshtakavargaInsights['houseRatings'] }) {
  const max = Math.max(...ratings.map((r) => r.bindus), 1)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 4 }}>
      {ratings.map((h) => {
        const intensity = Math.max(0.18, h.bindus / max)
        return (
          <div
            key={h.house}
            title={`H${h.house}: ${h.bindus} — ${h.label}`}
            style={{
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border-soft)',
              background: `color-mix(in srgb, ${bandColor(h.band)} ${Math.round(intensity * 55)}%, var(--surface-1))`,
              padding: '0.45rem 0.15rem',
              textAlign: 'center',
              minHeight: 64,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)' }}>H{h.house}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: bandColor(h.band), fontVariantNumeric: 'tabular-nums' }}>
              {h.bindus}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AshtakavargaAdvancedInsights({
  ashtakavarga,
  ascRashi,
  grahas,
  janmaNakshatraIndex,
}: {
  ashtakavarga: AshtakavargaResult
  ascRashi: number
  grahas?: GrahaData[]
  janmaNakshatraIndex?: number
}) {
  const [subTab, setSubTab] = useState<SubTab>('overview')
  const [focusHouse, setFocusHouse] = useState(10)

  const moonNak = useMemo(() => {
    if (typeof janmaNakshatraIndex === 'number' && janmaNakshatraIndex >= 0) return janmaNakshatraIndex
    const moon = grahas?.find((g) => g.id === 'Mo')
    return moon?.nakshatraIndex ?? 0
  }, [grahas, janmaNakshatraIndex])

  const insights = useMemo(() => {
    if (!ashtakavarga.sav?.length) return null
    return analyzeAshtakavargaInsights({
      savByRashi: ashtakavarga.sav,
      ascRashi,
      grahas: (grahas ?? []).map((g) => ({ id: g.id, rashi: g.rashi })),
      janmaNakshatraIndex: moonNak,
    })
  }, [ashtakavarga.sav, ascRashi, grahas, moonNak])

  const bb = useMemo(() => {
    if (!insights) return null
    return bhavaBhaavam(insights.houseSav, focusHouse)
  }, [insights, focusHouse])

  if (!insights) {
    return (
      <div
        className="card"
        style={{
          padding: '1.25rem',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          textAlign: 'center',
        }}
      >
        Recalculate the chart to load Advanced Ashtakavarga insights.
      </div>
    )
  }

  const khandaList = [
    insights.khandas.bandhu,
    insights.khandas.sevak,
    insights.khandas.poshak,
    insights.khandas.ghatak,
  ]
  const khandaMax = Math.max(...khandaList.map((k) => k.total), 1)
  const ieMax = Math.max(insights.internalExternal.internal, insights.internalExternal.external, 1)
  const dominantKhanda = khandaList.find((k) => k.id === insights.khandas.dominant)
  const peakStage = insights.lifeStages.find((s) => s.id === insights.lifeStagePeak)
  const peakDir = insights.directions.find((d) => d.id === insights.directionPeak)
  const activeYogaCount =
    Number(insights.yogas.growthAt37) + Number(insights.yogas.wealthAt40) + Number(insights.yogas.strongLagna)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      {/* Hero */}
      <div
        className="card"
        style={{
          padding: '1rem 1.05rem',
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--gold) 10%, var(--surface-1)), var(--surface-1) 55%)',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            marginBottom: '0.85rem',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-gold)',
                marginBottom: '0.25rem',
              }}
            >
              Advanced Ashtakavarga
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              SAV {insights.savTotal}
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 8 }}>
                house-ordered bindus
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {insights.khandas.bandhuBusiness ? (
              <Badge tone="good" icon={<Briefcase size={12} />} text="Business potential" />
            ) : null}
            {insights.khandas.ghatakCaution ? (
              <Badge tone="warn" icon={<AlertTriangle size={12} />} text="Ghatak caution" />
            ) : null}
            {insights.yogas.strongLagna ? (
              <Badge tone="good" icon={<CheckCircle2 size={12} />} text="Strong Lagna" />
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.55rem',
          }}
        >
          <StatTile
            label="Dominant khanda"
            value={dominantKhanda?.name.replace(' Khanda', '') ?? '—'}
            detail={`Score ${dominantKhanda?.total ?? '—'}`}
            accent="var(--text-gold)"
            active
          />
          <StatTile
            label="Peak life stage"
            value={peakStage?.name.split(' ')[0] ?? '—'}
            detail={`${peakStage?.total ?? '—'} bindus`}
            accent="var(--teal)"
          />
          <StatTile
            label="Best direction"
            value={peakDir?.name.split(' ')[0] ?? '—'}
            detail={`${peakDir?.total ?? '—'} bindus`}
            accent="var(--blue, #60a5fa)"
          />
          <StatTile
            label="Active yogas"
            value={activeYogaCount}
            detail={
              insights.promotion
                ? `Promo: ${insights.promotion.targetNakshatraName}`
                : 'Timing formulas below'
            }
          />
        </div>
      </div>

      {/* Sub-nav */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '0.4rem',
        }}
      >
        {SUB_TABS.map((t) => {
          const on = subTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                minHeight: 42,
                borderRadius: 'var(--r-md)',
                border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`,
                background: on ? 'var(--gold-faint)' : 'var(--surface-1)',
                color: on ? 'var(--text-gold)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.72rem',
                cursor: 'pointer',
                padding: '0.4rem 0.5rem',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          )
        })}
      </div>

      {subTab === 'overview' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <SectionHead
              title="Internal vs External"
              subtitle="Internal = 1,4,5,7,9,10 · External = 2,3,6,8,11,12"
              icon={<CircleDot size={16} />}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Internal nature</span>
                  <b style={{ color: 'var(--teal)', fontVariantNumeric: 'tabular-nums' }}>
                    {insights.internalExternal.internal}
                  </b>
                </div>
                <Meter value={insights.internalExternal.internal} max={ieMax} color="var(--teal)" height={10} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>External nature</span>
                  <b style={{ color: 'var(--blue, #60a5fa)', fontVariantNumeric: 'tabular-nums' }}>
                    {insights.internalExternal.external}
                  </b>
                </div>
                <Meter value={insights.internalExternal.external} max={ieMax} color="var(--blue, #60a5fa)" height={10} />
              </div>
            </div>
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {insights.internalExternal.interpretation}
            </p>
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <SectionHead title="Growth direction" subtitle="Highest directional total = best growth axis" icon={<Compass size={16} />} />
            <DirectionCompass directions={insights.directions} peakId={insights.directionPeak} />
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <SectionHead title="Life stages" subtitle="Houses 1–4 · 5–8 · 9–12" icon={<TrendingUp size={16} />} />
            <CompareRow items={insights.lifeStages} peakId={insights.lifeStagePeak} accent="var(--teal)" />
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <SectionHead title="Ashrams" subtitle="1–4 · 4–7 · 7–10 · 10–12" icon={<Layers size={16} />} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem' }}>
              {insights.ashrams.map((a) => {
                const peak = a.id === insights.ashramPeak
                return (
                  <div
                    key={a.id}
                    style={{
                      padding: '0.7rem 0.75rem',
                      borderRadius: 'var(--r-md)',
                      border: `1px solid ${peak ? 'var(--gold)' : 'var(--border-soft)'}`,
                      background: peak ? 'var(--gold-faint)' : 'var(--surface-2)',
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: peak ? 'var(--text-gold)' : 'var(--text-muted)' }}>
                      {a.name}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                      {a.total}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {subTab === 'structure' ? (
        <div className="card" style={{ padding: '1rem' }}>
          <SectionHead
            title="Four Khandas"
            subtitle="Bandhu · Sevak · Poshak · Ghatak — from original Lagna SAV"
            icon={<Layers size={16} />}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.65rem',
              marginBottom: '0.9rem',
            }}
          >
            {khandaList.map((k) => {
              const isDom = insights.khandas.dominant === k.id
              return (
                <div
                  key={k.id}
                  style={{
                    padding: '0.9rem',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${isDom ? 'var(--gold)' : 'var(--border-soft)'}`,
                    background: isDom
                      ? 'linear-gradient(165deg, var(--gold-faint), var(--surface-1))'
                      : 'var(--surface-1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: isDom ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                      {k.name.replace(' Khanda', '')}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isDom ? 'var(--text-gold)' : 'var(--teal)' }}>
                      {k.total}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.55rem' }}>
                    Houses {k.houses.join(' + ')}
                  </div>
                  <Meter value={k.total} max={khandaMax} color={isDom ? 'var(--gold)' : 'var(--teal)'} height={9} />
                  <p style={{ margin: '0.65rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {k.interpretation}
                  </p>
                </div>
              )
            })}
          </div>
          {(insights.khandas.bandhuBusiness || insights.khandas.ghatakCaution) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {insights.khandas.bandhuBusiness ? (
                <Callout tone="good">Bandhu ≥ 88 — strong self-earned / business potential.</Callout>
              ) : null}
              {insights.khandas.ghatakCaution ? (
                <Callout tone="warn">
                  Ghatak &gt; 73 — caution with loans, hidden enemies, and excess display; correlate with lifestyle.
                </Callout>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {subTab === 'houses' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <SectionHead
              title="House bindu heatmap"
              subtitle="28+ functional · ≤23 weak · 30 clean · 34–40 strong · 41+ abundant"
              icon={<Home size={16} />}
            />
            <HouseHeatStrip ratings={insights.houseRatings} />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.55rem',
            }}
          >
            {insights.houseRatings.map((h) => (
              <div
                key={h.house}
                style={{
                  padding: '0.75rem 0.8rem',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border-soft)',
                  background: bandTint(h.band),
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>House {h.house}</span>
                  <span
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: bandColor(h.band),
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {h.bindus}
                  </span>
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: bandColor(h.band),
                    marginBottom: 6,
                  }}
                >
                  {h.band}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{h.label}</div>
                {[6, 8, 12].includes(h.house) ? (
                  <div style={{ marginTop: 8, fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {negativeHouseNotes(h.house, h.bindus)[0]}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {subTab === 'bhava' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <SectionHead
              title="Bhava-Bhaavam"
              subtitle="Make any house the Lagna: that house = BODY of the topic; the other 11 = LIFE of that topic only."
              icon={<Scale size={16} />}
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.55rem' }}>
              {FOCUS_PRESETS.map((p) => {
                const on = focusHouse === p.house
                return (
                  <button
                    key={p.house}
                    type="button"
                    onClick={() => setFocusHouse(p.house)}
                    style={{
                      border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`,
                      background: on ? 'var(--gold-faint)' : 'var(--surface-2)',
                      color: on ? 'var(--text-gold)' : 'var(--text-secondary)',
                      borderRadius: 999,
                      padding: '0.35rem 0.7rem',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      minHeight: 36,
                    }}
                  >
                    H{p.house} · {p.label}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4, marginBottom: '0.75rem' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                const on = focusHouse === h
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setFocusHouse(h)}
                    style={{
                      border: `1px solid ${on ? 'var(--gold)' : 'var(--border-soft)'}`,
                      background: on ? 'var(--gold-faint)' : 'var(--surface-1)',
                      color: on ? 'var(--text-gold)' : 'var(--text-muted)',
                      borderRadius: 'var(--r-sm)',
                      padding: '0.4rem 0.2rem',
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      minHeight: 40,
                    }}
                  >
                    {h}
                  </button>
                )
              })}
            </div>

            <Callout tone="warn">{bb?.caution ?? 'Compare bindus inside this topic only — not against other natal houses.'}</Callout>
          </div>

          {bb ? (
            <>
              {/* Body hero */}
              <div
                className="card"
                style={{
                  padding: '1.05rem 1.1rem',
                  background: 'linear-gradient(135deg, var(--gold-faint), var(--surface-1) 60%)',
                  border: '1px solid var(--gold)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-gold)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Body of {bb.topicShort} · relative H1 (= natal H{bb.body.originalHouse})
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{bb.topic}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45, maxWidth: 520 }}>
                      {bb.body.label}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: bandColor(bb.body.band), lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {bb.body.bindus}
                    </div>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: bandColor(bb.body.band), textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {bb.body.band}
                    </div>
                  </div>
                </div>
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {bb.body.reading}
                </p>
              </div>

              {/* Guided summary */}
              <div className="card" style={{ padding: '1rem' }}>
                <SectionHead title="Guided reading" subtitle="Compare only inside this rotated topic" icon={<Sparkles size={16} />} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {bb.summary.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        padding: '0.55rem 0.7rem',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--surface-2)',
                        borderLeft: '3px solid var(--gold)',
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key life houses */}
              <div className="card" style={{ padding: '1rem' }}>
                <SectionHead
                  title="Key life houses"
                  subtitle="Body · Resources · Struggle · Support · Sudden · Gains — class essentials"
                  icon={<Layers size={16} />}
                />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '0.5rem',
                  }}
                >
                  {bb.keyHouses.map((row) => (
                    <div
                      key={row.relativeHouse}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--r-md)',
                        border: `1px solid ${row.role === 'body' ? 'var(--gold)' : 'var(--border-soft)'}`,
                        background: row.role === 'body' ? 'var(--gold-faint)' : bandTint(row.band),
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {row.roleLabel}
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: bandColor(row.band), fontVariantNumeric: 'tabular-nums' }}>
                          {row.bindus}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        Rel H{row.relativeHouse}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}> · natal H{row.originalHouse}</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{row.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full life map */}
              <div className="card" style={{ padding: '1rem' }}>
                <SectionHead
                  title={`Life of ${bb.topicShort}`}
                  subtitle="All 12 relative houses — meanings are for this topic only"
                  icon={<Home size={16} />}
                />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.5rem',
                  }}
                >
                  {bb.houses.map((row) => {
                    const isBody = row.relativeHouse === 1
                    return (
                      <div
                        key={row.relativeHouse}
                        style={{
                          padding: '0.75rem 0.8rem',
                          borderRadius: 'var(--r-md)',
                          border: `1px solid ${isBody ? 'var(--gold)' : 'var(--border-soft)'}`,
                          background: isBody ? 'var(--gold-faint)' : 'var(--surface-1)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                            Rel H{row.relativeHouse}
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}> · natal H{row.originalHouse}</span>
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: bandColor(row.band), fontVariantNumeric: 'tabular-nums' }}>
                            {row.bindus}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.58rem',
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: isBody ? 'var(--text-gold)' : 'var(--text-muted)',
                            marginBottom: 4,
                          }}
                        >
                          {row.roleLabel}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 6 }}>
                          {row.label}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{row.reading}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {subTab === 'timing' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <SectionHead
              title="Special yogas"
              subtitle="Indicative classical bindu yogas — correlate with dasha and transit"
              icon={<Sparkles size={16} />}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.55rem',
              }}
            >
              <YogaCard
                active={insights.yogas.growthAt37}
                title="Growth ~37"
                detail="H1, H10, and H11 all ≥ 30"
              />
              <YogaCard
                active={insights.yogas.wealthAt40}
                title="Wealth ~40"
                detail="H4 and H11 both ≥ 30"
              />
              <YogaCard
                active={insights.yogas.strongLagna}
                title="Strong Lagna"
                detail="H1 ≥ 40 — person can weather weak houses"
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Saturn challenge age
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--rose)', marginTop: 4, lineHeight: 1 }}>
                {insights.ages.saturnChallengeAge != null ? `~${insights.ages.saturnChallengeAge}` : '—'}
              </div>
              <p style={{ margin: '0.55rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {insights.ages.saturnHouse != null
                  ? `Sum of SAV from H1 through H${insights.ages.saturnHouse} × 7 ÷ 27${
                      insights.ages.saturnChallengeRaw != null
                        ? ` (= ${insights.ages.saturnChallengeRaw.toFixed(2)})`
                        : ''
                    }`
                  : 'Saturn house unavailable'}
              </p>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Jupiter + Venus prosperity
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--teal)', marginTop: 4, lineHeight: 1 }}>
                {insights.ages.jupiterVenusProsperityAge != null
                  ? `~${insights.ages.jupiterVenusProsperityAge}`
                  : '—'}
              </div>
              <p style={{ margin: '0.55rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {insights.ages.jupiterHouse != null && insights.ages.venusHouse != null
                  ? `SAV of Ju (H${insights.ages.jupiterHouse}) + Ve (H${insights.ages.venusHouse}) × 7 ÷ 27${
                      insights.ages.jupiterVenusProsperityRaw != null
                        ? ` (= ${insights.ages.jupiterVenusProsperityRaw.toFixed(2)})`
                        : ''
                    }`
                  : 'Jupiter / Venus houses unavailable'}
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <SectionHead
              title="Promotion timing"
              subtitle="(H10 + H6) mod janma-nakshatra number → count remainder from birth nakshatra"
              icon={<Briefcase size={16} />}
            />
            {insights.promotion ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  alignItems: 'stretch',
                }}
              >
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--gold)',
                    background: 'linear-gradient(160deg, var(--gold-faint), var(--surface-1))',
                  }}
                >
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Target nakshatra
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-gold)', marginTop: 4 }}>
                    {insights.promotion.targetNakshatraName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.45 }}>
                    Watch {GRAHA_NAMES.Su} or{' '}
                    {GRAHA_NAMES[insights.promotion.tenthLord as GrahaId] ?? insights.promotion.tenthLord} transit here.
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.45rem' }}>
                  <MiniMetric label="H10 + H6" value={String(insights.promotion.sum)} />
                  <MiniMetric label="Janma #" value={String(insights.promotion.janmaNakshatraNumber)} />
                  <MiniMetric label="Remainder" value={String(insights.promotion.remainder)} />
                  <div style={{ gridColumn: '1 / -1', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45, paddingTop: 2 }}>
                    H10 = {insights.houseSav[9]} · H6 = {insights.houseSav[5]}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Promotion timing needs birth nakshatra.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Badge({
  tone,
  icon,
  text,
}: {
  tone: 'good' | 'warn'
  icon: React.ReactNode
  text: string
}) {
  const color = tone === 'good' ? 'var(--teal)' : 'var(--rose)'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: '0.66rem',
        fontWeight: 700,
        color,
        border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        borderRadius: 999,
        padding: '0.28rem 0.55rem',
      }}
    >
      {icon}
      {text}
    </span>
  )
}

function Callout({ tone, children }: { tone: 'good' | 'warn'; children: React.ReactNode }) {
  const color = tone === 'good' ? 'var(--teal)' : 'var(--rose)'
  return (
    <div
      style={{
        fontSize: '0.74rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.45,
        padding: '0.65rem 0.75rem',
        borderRadius: 'var(--r-md)',
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      {children}
    </div>
  )
}

function YogaCard({ active, title, detail }: { active: boolean; title: string; detail: string }) {
  return (
    <div
      style={{
        padding: '0.85rem',
        borderRadius: 'var(--r-md)',
        border: `1px solid ${active ? 'var(--gold)' : 'var(--border-soft)'}`,
        background: active
          ? 'linear-gradient(165deg, var(--gold-faint), var(--surface-1))'
          : 'var(--surface-1)',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: '0.62rem',
          fontWeight: 800,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: active ? 'var(--text-gold)' : 'var(--text-muted)',
          marginBottom: 6,
        }}
      >
        {active ? <CheckCircle2 size={12} /> : <CircleDot size={12} />}
        {active ? 'Active' : 'Inactive'}
      </div>
      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{detail}</div>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '0.65rem 0.55rem',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--border-soft)',
        background: 'var(--surface-2)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}
