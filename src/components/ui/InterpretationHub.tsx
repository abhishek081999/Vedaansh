'use client'

// ─────────────────────────────────────────────────────────────
//  src/components/ui/InterpretationHub.tsx
//  Chart readings hub — tone map, strength charts, house map,
//  planet strip, and expandable insight cards.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Gauge as GaugeIcon,
  Home,
  Lock,
  Orbit,
  Sparkles,
  Timer,
} from 'lucide-react'
import type { ChartOutput, GrahaData, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_SHORT } from '@/types/astrology'
import type { TransitPosition } from '@/lib/engine/transits'
import {
  buildInterpretationHub,
  type HubItem,
  type HubSection,
  type HubSectionId,
  type HubTone,
} from '@/lib/engine/interpretationHub'
import { wholeSignHouseFromLagna } from '@/lib/engine/houseInterpretations'
import { PanelShell } from '@/components/ui/patterns/PanelShell'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { Button } from '@/components/ui/primitives/Button'
import { BarList, Gauge, Legend, Meter, RadarChart, SegmentRing, VizCard, toneFor } from '@/components/ui/viz'
import { lordColor } from '@/components/dasha/dashaPalette'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import styles from './InterpretationHub.module.css'

interface InterpretationHubProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

/** Free preview: overview only, first N insight cards. */
const FREE_OVERVIEW_LIMIT = 3
const FREE_SECTION_IDS: HubSectionId[] = ['overview']

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const SHADBALA_AXES: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

const GLYPH: Record<string, string> = {
  Su: '☉', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}

const SECTION_META: Record<HubSectionId, { label: string; Icon: typeof Sparkles }> = {
  overview: { label: 'Overview', Icon: Sparkles },
  planets: { label: 'Planets', Icon: Orbit },
  houses: { label: 'Houses', Icon: Home },
  rashis: { label: 'Rashis', Icon: Compass },
  strength: { label: 'Strength', Icon: GaugeIcon },
  transit: { label: 'Transit', Icon: BookOpen },
  dasha: { label: 'Dasha', Icon: Timer },
}

const TONE_COLOR: Record<HubTone, string> = {
  supportive: 'var(--teal)',
  caution: 'var(--rose)',
  mixed: 'var(--gold)',
  neutral: 'var(--text-muted)',
}

function toneStyles(tone: HubTone) {
  if (tone === 'supportive') {
    return { bg: 'rgba(78,205,196,0.10)', border: 'rgba(78,205,196,0.35)', text: 'var(--teal)', label: 'Supportive' }
  }
  if (tone === 'caution') {
    return { bg: 'rgba(224,123,142,0.12)', border: 'rgba(224,123,142,0.35)', text: 'var(--rose)', label: 'Caution' }
  }
  if (tone === 'mixed') {
    return { bg: 'rgba(201,168,76,0.10)', border: 'rgba(201,168,76,0.35)', text: 'var(--text-gold)', label: 'Mixed' }
  }
  return { bg: 'var(--surface-1, transparent)', border: 'var(--border-soft)', text: 'var(--text-muted)', label: 'Note' }
}

function countTones(items: HubItem[]) {
  const counts: Record<HubTone, number> = { supportive: 0, caution: 0, mixed: 0, neutral: 0 }
  for (const item of items) counts[item.tone] += 1
  return counts
}

function dignityTone(d: string | null | undefined): HubTone {
  if (d === 'exalted' || d === 'moolatrikona' || d === 'own' || d === 'great_friend' || d === 'friend') return 'supportive'
  if (d === 'debilitated' || d === 'enemy' || d === 'great_enemy') return 'caution'
  return 'mixed'
}

function HubCard({
  item,
  focused,
  onFocus,
}: {
  item: HubItem
  focused?: boolean
  onFocus?: () => void
}) {
  const [open, setOpen] = useState(false)
  const color = toneStyles(item.tone)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [focused])

  return (
    <div
      ref={ref}
      className={`${styles.card}${focused ? ` ${styles.cardFocused}` : ''}`}
      style={{
        ['--hub-accent' as string]: color.text,
        background: color.bg,
        borderColor: color.border,
      }}
      onClick={onFocus}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
          {item.title}
        </div>
        {color.label ? (
          <div
            style={{
              fontSize: '0.58rem',
              color: color.text,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <span className={styles.toneDot} style={{ background: color.text }} aria-hidden />
            {color.label}
          </div>
        ) : null}
      </div>
      {item.subtitle ? (
        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.subtitle}</div>
      ) : null}
      {item.summary ? (
        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.summary}</div>
      ) : null}
      {item.tags?.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {item.tags.map((t, i) => (
            <span
              key={`${t}-${i}`}
              style={{
                fontSize: '0.6rem',
                padding: '0.12rem 0.45rem',
                borderRadius: '999px',
                border: '1px solid var(--border-soft)',
                color: 'var(--text-gold)',
                background: 'rgba(201,168,76,0.06)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
      {item.points.length ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
            aria-expanded={open}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: '0.66rem',
              color: 'var(--text-gold)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: 600,
            }}
          >
            {open ? <ChevronUp size={12} aria-hidden /> : <ChevronDown size={12} aria-hidden />}
            {open ? 'Hide details' : `Show ${item.points.length} detail${item.points.length === 1 ? '' : 's'}`}
          </button>
          {open ? (
            <ul className={styles.detailList}>
              {item.points.map((p, i) => (
                <li key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {p.label ? <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.label}: </span> : null}
                  {p.text}
                  {p.source ? (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}> — {p.source}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function ToneBalanceViz({ section }: { section: HubSection }) {
  const counts = countTones(section.items)
  const total = section.items.length || 1
  const supportiveShare = Math.round((counts.supportive / total) * 100)
  return (
    <VizCard
      title="Reading balance"
      caption={`${section.items.length} notes in ${section.label.toLowerCase()}`}
      legend={[
        { label: 'Supportive', color: TONE_COLOR.supportive },
        { label: 'Mixed', color: TONE_COLOR.mixed },
        { label: 'Caution', color: TONE_COLOR.caution },
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 180px) 1fr', gap: '0.75rem', alignItems: 'center' }}>
        <SegmentRing
          size={150}
          thickness={18}
          showLabels={false}
          centerValue={`${supportiveShare}%`}
          centerLabel="Support"
          ariaLabel="Tone balance"
          segments={[
            { label: 'Supportive', value: counts.supportive, max: Math.max(1, counts.supportive), color: TONE_COLOR.supportive },
            { label: 'Mixed', value: counts.mixed, max: Math.max(1, counts.mixed), color: TONE_COLOR.mixed },
            { label: 'Caution', value: counts.caution, max: Math.max(1, counts.caution), color: TONE_COLOR.caution },
            { label: 'Notes', value: counts.neutral, max: Math.max(1, counts.neutral), color: TONE_COLOR.neutral },
          ].filter((s) => s.value > 0)}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {([
            ['Supportive', counts.supportive, TONE_COLOR.supportive],
            ['Mixed', counts.mixed, TONE_COLOR.mixed],
            ['Caution', counts.caution, TONE_COLOR.caution],
          ] as const).map(([label, value, color]) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 28px', gap: '0.45rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
              <Meter value={value} max={total} color={color} height={7} />
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', textAlign: 'right' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </VizCard>
  )
}

function PlanetStripViz({
  chart,
  focusId,
  onSelect,
}: {
  chart: ChartOutput
  focusId: string | null
  onSelect: (id: string) => void
}) {
  const asc = chart.lagnas.ascRashi
  return (
    <VizCard title="Planet map" caption="Tap a graha to jump to its reading">
      <div className={styles.planetStrip}>
        {CLASSICAL.map((id) => {
          const g = chart.grahas.find((p) => p.id === id)
          if (!g) return null
          const house = wholeSignHouseFromLagna(asc, g.rashi)
          const tone = dignityTone(g.dignity)
          const itemId = `planet-${id}`
          const active = focusId === itemId
          return (
            <button
              key={id}
              type="button"
              className={`${styles.planetChip}${active ? ` ${styles.planetChipActive}` : ''}`}
              onClick={() => onSelect(itemId)}
              title={`${g.name} · H${house} · ${g.dignity}`}
            >
              <span style={{ color: lordColor(id), fontSize: '0.95rem', lineHeight: 1 }}>{GLYPH[id]}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-primary)' }}>{GRAHA_NAMES[id]}</span>
              <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>H{house}</span>
              <span className={styles.toneDot} style={{ background: TONE_COLOR[tone] }} aria-hidden />
            </button>
          )
        })}
      </div>
    </VizCard>
  )
}

function HouseMapViz({
  chart,
  focusId,
  onSelect,
}: {
  chart: ChartOutput
  focusId: string | null
  onSelect: (id: string) => void
}) {
  const asc = chart.lagnas.ascRashi
  const byHouse = useMemo(() => {
    const map: Record<number, { rashi: Rashi; grahas: GrahaData[] }> = {}
    for (let h = 1; h <= 12; h++) {
      const rashi = ((((asc - 1 + h - 1) % 12) + 1) as Rashi)
      map[h] = {
        rashi,
        grahas: chart.grahas.filter((g) => CLASSICAL.includes(g.id as GrahaId) && wholeSignHouseFromLagna(asc, g.rashi) === h),
      }
    }
    return map
  }, [asc, chart.grahas])

  const strongest = chart.bhavaBala?.strongestHouse
  const weakest = chart.bhavaBala?.weakestHouse

  return (
    <VizCard title="House chart" caption="Whole-sign houses from Lagna · tap a bhava to open its reading">
      <div className={styles.houseMap}>
        {Array.from({ length: 12 }, (_, i) => {
          const h = i + 1
          const cell = byHouse[h]
          const itemId = `house-${h}`
          const active = focusId === itemId
          const accent =
            strongest === h ? 'var(--teal)' : weakest === h ? 'var(--rose)' : 'var(--border-soft)'
          return (
            <button
              key={h}
              type="button"
              className={`${styles.houseCell}${active ? ` ${styles.houseCellActive}` : ''}`}
              style={{ borderColor: active ? 'var(--gold)' : accent }}
              onClick={() => onSelect(itemId)}
            >
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-gold)', letterSpacing: '0.04em' }}>
                H{h}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{RASHI_SHORT[cell.rashi]}</span>
              <span style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', minHeight: 14 }}>
                {cell.grahas.map((g) => (
                  <span key={g.id} style={{ color: lordColor(g.id), fontSize: '0.72rem', lineHeight: 1 }} title={g.name}>
                    {GLYPH[g.id] ?? g.id}
                  </span>
                ))}
              </span>
            </button>
          )
        })}
      </div>
      <Legend
        items={[
          { label: 'Strongest bhava', color: 'var(--teal)' },
          { label: 'Weakest bhava', color: 'var(--rose)' },
        ]}
      />
    </VizCard>
  )
}

function StrengthCharts({ chart }: { chart: ChartOutput }) {
  const sb = chart.shadbala
  const bb = chart.bhavaBala

  const shadbalaRows = useMemo(() => {
    if (!sb?.planets) return []
    return SHADBALA_AXES
      .map((id) => {
        const p = sb.planets[id]
        if (!p) return null
        return {
          key: id,
          label: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: lordColor(id) }}>{GLYPH[id]}</span>
              {GRAHA_NAMES[id]}
            </span>
          ),
          value: p.ratio,
          threshold: 1,
          color: toneFor(Math.min(1.2, p.ratio) / 1.2, 0.75, 0.45),
          valueText: p.ratio.toFixed(2),
        }
      })
      .filter((r): r is NonNullable<typeof r> => !!r)
      .sort((a, b) => b.value - a.value)
  }, [sb])

  const radarAxes = SHADBALA_AXES.map((id) => GRAHA_NAMES[id] ?? id)
  const radarValues = SHADBALA_AXES.map((id) => sb?.planets?.[id]?.ratio ?? 0)
  const radarThreshold = SHADBALA_AXES.map(() => 1)

  const avgRatio =
    shadbalaRows.length > 0
      ? shadbalaRows.reduce((s, r) => s + r.value, 0) / shadbalaRows.length
      : 0

  const houseRows = useMemo(() => {
    if (!bb) return []
    return Object.values(bb.houses)
      .sort((a, b) => b.totalRupa - a.totalRupa)
      .map((h) => ({
        key: String(h.house),
        label: `H${h.house}`,
        value: h.totalRupa,
        color:
          h.house === bb.strongestHouse
            ? 'var(--teal)'
            : h.house === bb.weakestHouse
              ? 'var(--rose)'
              : 'var(--gold)',
        valueText: h.totalRupa.toFixed(1),
      }))
  }, [bb])

  if (!shadbalaRows.length && !houseRows.length) return null

  return (
    <div className={styles.vizRow}>
      {shadbalaRows.length ? (
        <VizCard title="Shadbala radar" caption="Ratio vs required strength (dashed = 1.0)">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 1fr) minmax(120px, 0.7fr)', gap: '0.75rem', alignItems: 'center' }}>
            <RadarChart
              axes={radarAxes}
              series={[{ label: 'Ratio', values: radarValues, color: 'var(--gold)' }]}
              threshold={radarThreshold}
              max={Math.max(1.4, ...radarValues)}
              size={200}
              ariaLabel="Shadbala strength radar"
            />
            <Gauge
              value={avgRatio}
              max={1.4}
              label="Mean ratio"
              valueText={avgRatio.toFixed(2)}
              size={150}
              zones={[
                { from: 0, to: 0.75, color: 'var(--rose)' },
                { from: 0.75, to: 1, color: 'var(--gold)' },
                { from: 1, to: 1.4, color: 'var(--teal)' },
              ]}
            />
          </div>
        </VizCard>
      ) : null}
      {shadbalaRows.length ? (
        <VizCard title="Shadbala ratios" caption="Tick mark = required strength (1.0)">
          <BarList rows={shadbalaRows} max={Math.max(1.4, ...shadbalaRows.map((r) => r.value))} />
        </VizCard>
      ) : null}
      {houseRows.length ? (
        <VizCard title="Bhava Bala" caption="House strength in rupas">
          <BarList rows={houseRows} unit="R" />
        </VizCard>
      ) : null}
    </div>
  )
}

function SectionVisuals({
  section,
  chart,
  focusId,
  onSelect,
  showFull,
}: {
  section: HubSection
  chart: ChartOutput
  focusId: string | null
  onSelect: (id: string) => void
  showFull: boolean
}) {
  if (section.id === 'strength') return <StrengthCharts chart={chart} />

  if (section.id === 'planets') {
    return (
      <div className={styles.vizRow}>
        <PlanetStripViz chart={chart} focusId={focusId} onSelect={onSelect} />
        <ToneBalanceViz section={section} />
      </div>
    )
  }

  if (section.id === 'houses') {
    return (
      <div className={styles.vizRow}>
        <HouseMapViz chart={chart} focusId={focusId} onSelect={onSelect} />
        <ToneBalanceViz section={section} />
      </div>
    )
  }

  if (section.id === 'overview' || section.id === 'rashis' || section.id === 'transit' || section.id === 'dasha') {
    return (
      <div className={styles.vizRow}>
        <ToneBalanceViz section={section} />
        {showFull && section.id === 'overview' && chart.shadbala?.planets ? (
          <VizCard title="At a glance" caption="Top Shadbala ratios">
            <BarList
              rows={SHADBALA_AXES
                .map((id) => {
                  const p = chart.shadbala?.planets?.[id]
                  if (!p) return null
                  return {
                    key: id,
                    label: GRAHA_NAMES[id],
                    value: p.ratio,
                    threshold: 1,
                    color: toneFor(Math.min(1.2, p.ratio) / 1.2),
                    valueText: p.ratio.toFixed(2),
                  }
                })
                .filter((r): r is NonNullable<typeof r> => !!r)
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)}
              max={1.4}
            />
          </VizCard>
        ) : null}
      </div>
    )
  }

  return null
}

export function InterpretationHub({ chart, userPlan = 'free' }: InterpretationHubProps) {
  const showFull = planMeetsUiGate(userPlan, 'gold')
  const [active, setActive] = useState<HubSectionId>('overview')
  const [focusId, setFocusId] = useState<string | null>(null)
  const [transitPositions, setTransitPositions] = useState<TransitPosition[] | null>(null)
  const [now] = useState(() => Date.now())
  const ascRashi = chart.lagnas.ascRashi

  useEffect(() => {
    if (!showFull) {
      setTransitPositions([])
      return
    }
    let cancelled = false
    const asOf = new Date().toISOString().slice(0, 10)
    fetch(`/api/transit?ascRashi=${ascRashi}&months=1&startDate=${asOf}`)
      .then((r) => r.json())
      .then((body: { success?: boolean; currentPositions?: TransitPosition[] }) => {
        if (cancelled) return
        setTransitPositions(body?.success && Array.isArray(body.currentPositions) ? body.currentPositions : [])
      })
      .catch(() => {
        if (!cancelled) setTransitPositions([])
      })
    return () => { cancelled = true }
  }, [ascRashi, showFull])

  const sections = useMemo(
    () => buildInterpretationHub(chart, transitPositions, now),
    [chart, transitPositions, now],
  )
  const section = sections.find((s) => s.id === active) ?? sections[0]

  useEffect(() => {
    setFocusId(null)
  }, [active])

  useEffect(() => {
    if (!showFull && !FREE_SECTION_IDS.includes(active)) {
      setActive('overview')
    }
  }, [showFull, active])

  const visibleItems = useMemo(() => {
    if (showFull || section.id !== 'overview') return section.items
    return section.items.slice(0, FREE_OVERVIEW_LIMIT)
  }, [showFull, section])

  const lockedExtra = !showFull && section.id === 'overview'
    ? Math.max(0, section.items.length - FREE_OVERVIEW_LIMIT)
    : 0

  const selectSection = (id: HubSectionId) => {
    if (!showFull && !FREE_SECTION_IDS.includes(id)) return
    setActive(id)
  }

  const toolbar = (
    <div className={styles.tabs} role="tablist" aria-label="Interpretation sections">
      {sections.map((s) => {
        const selected = s.id === section.id
        const locked = !showFull && !FREE_SECTION_IDS.includes(s.id)
        const meta = SECTION_META[s.id]
        const Icon = meta.Icon
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-disabled={locked}
            disabled={locked}
            title={locked ? 'Gold unlocks this section' : undefined}
            className={`${styles.tab}${selected ? ` ${styles.tabActive}` : ''}`}
            onClick={() => selectSection(s.id)}
            style={locked ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
          >
            {locked ? <Lock size={11} aria-hidden /> : <Icon size={12} aria-hidden />}
            {meta.label}
            {s.items.length ? <span className={styles.tabCount}>{s.items.length}</span> : null}
          </button>
        )
      })}
    </div>
  )

  return (
    <PanelShell title="Interpretation" toolbar={toolbar} padding="sm" className="fade-up">
      <div className={styles.root}>
        {!showFull && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--surface-3)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--gold-faint)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.55rem',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <Lock size={14} aria-hidden style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Free preview: overview tone map and the first {FREE_OVERVIEW_LIMIT} chart themes.
              Gold unlocks planets, houses, rashis, strength charts, transits, and dasha readings.
            </div>
            <Link href="/pricing" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">View plans</Button>
            </Link>
          </div>
        )}

        <SectionVisuals
          key={section.id}
          section={section}
          chart={chart}
          focusId={focusId}
          onSelect={setFocusId}
          showFull={showFull}
        />

        <div role="tabpanel" aria-label={section.label} className={styles.panelBody} key={`panel-${section.id}`}>
          <p className={styles.intro}>
            {showFull
              ? section.intro
              : 'A short preview of the strongest themes in this chart. Upgrade for the full reading hub.'}
          </p>
          {visibleItems.length ? (
            <div className={styles.cardGrid}>
              {visibleItems.map((item, idx) => (
                <HubCard
                  key={`${section.id}-${idx}-${item.id}`}
                  item={item}
                  focused={focusId === item.id}
                  onFocus={() => setFocusId(item.id)}
                />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
              No readings in this section yet.
            </div>
          )}

          {lockedExtra > 0 ? (
            <PlanGate userPlan={userPlan} required="gold" featureName="Full interpretation hub">
              <div className={styles.cardGrid} style={{ marginTop: '0.75rem', minHeight: 120 }}>
                {section.items.slice(FREE_OVERVIEW_LIMIT, FREE_OVERVIEW_LIMIT + 2).map((item, idx) => (
                  <HubCard key={`locked-${idx}-${item.id}`} item={item} />
                ))}
              </div>
            </PlanGate>
          ) : null}
        </div>
      </div>
    </PanelShell>
  )
}
