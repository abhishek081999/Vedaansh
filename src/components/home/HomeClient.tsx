'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/page.tsx
//  Home — birth form + full chart result
//  Redesigned: themed, animated, cleaner visual hierarchy
// ─────────────────────────────────────────────────────────────

import dynamic from 'next/dynamic'
import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BirthForm } from '@/components/ui/BirthForm'
import { Sparkles, Info, Clock, Moon, Zap, Star, Grid3x3, Scale, Home, BarChart3, HelpCircle, Compass, Calendar, Globe, Layers, ArrowRight, Download, Library } from 'lucide-react'

// Dynamic imports for heavy tab-specific components
const VarshaphalPanel = dynamic(() => import('@/components/ui/VarshaphalPanel').then(m => m.VarshaphalPanel), { ssr: false })
const VargaSwitcher = dynamic(() => import('@/components/chakra/VargaSwitcher').then(m => m.VargaSwitcher), { ssr: false })
const DashaTree = dynamic(() => import('@/components/dasha/DashaTree').then(m => m.DashaTree), { ssr: false })
const DashaInterpretationPanel = dynamic(() => import('@/components/dasha/DashaInterpretationPanel').then(m => m.DashaInterpretationPanel), { ssr: false })
const PersonalDayCard = dynamic(() => import('@/components/dashboard/PersonalDayCard').then(m => m.PersonalDayCard), { ssr: false })
const GrahaTable = dynamic(() => import('@/components/ui/GrahaTable').then(m => m.GrahaTable), { ssr: false })
const AshtakavargaGrid = dynamic(() => import('@/components/ui/AshtakavargaGrid').then(m => m.AshtakavargaGrid), { ssr: false })
const YogaList = dynamic(() => import('@/components/ui/YogaList').then(m => m.YogaList), { ssr: false })
const TransitOverlay = dynamic(() => import('@/components/ui/TransitOverlay').then(m => m.TransitOverlay), { ssr: false })
const ShadbalaTable = dynamic(() => import('@/components/ui/ShadbalaTable').then(m => m.ShadbalaTable), { ssr: false })
const ShadbalaVisuals = dynamic(() => import('@/components/ui/ShadbalaVisuals').then(m => m.ShadbalaVisuals), { ssr: false })
const BhavaBalaTable = dynamic(() => import('@/components/ui/BhavaBalaTable').then(m => m.BhavaBalaTable), { ssr: false })
const VimsopakaBalaPanel = dynamic(() => import('@/components/ui/VimsopakaBalaPanel').then(m => m.VimsopakaBalaPanel), { ssr: false })
const PlanetsWorkspace = dynamic(() => import('@/components/ui/PlanetsWorkspace').then(m => m.PlanetsWorkspace), { ssr: false })
const InterpretationPanel = dynamic(() => import('@/components/ui/InterpretationPanel').then(m => m.InterpretationPanel), { ssr: false })
const NakshatraPanel = dynamic(() => import('@/components/ui/NakshatraPanel').then(m => m.NakshatraPanel), { ssr: false })
const HousePanel = dynamic(() => import('@/components/ui/HousePanel').then(m => m.HousePanel), { ssr: false })
const ActiveHousesCard = dynamic(() => import('@/components/dashboard/ActiveHousesCard').then(m => m.ActiveHousesCard), { ssr: false })
const ProgressionWidget = dynamic(() => import('@/components/dashboard/ProgressionWidget').then(m => m.ProgressionWidget), { ssr: false })
const ExportPdfButton = dynamic(() => import('@/components/ui/ExportPdfButton').then(m => m.ExportPdfButton), { ssr: false })
const EmailChartButton = dynamic(() => import('@/components/ui/EmailChartButton').then(m => m.EmailChartButton), { ssr: false })
const KPStellarPanel = dynamic(() => import('@/components/ui/KPStellarPanel').then(m => m.KPStellarPanel), { ssr: false })
const AstroDetailsPanel = dynamic(() => import('@/components/ui/AstroDetailsPanel').then(m => m.AstroDetailsPanel), { ssr: false })

import { useAppLayout } from '@/components/providers/LayoutProvider'
import { useChart } from '@/components/providers/ChartProvider'
import { routeAllowsWithoutChart } from '@/lib/chartGateRoutes'
import type { ChartOutput, GrahaId, Rashi, ChartSettings } from '@/types/astrology'
import { DEFAULT_SETTINGS, GRAHA_NAMES, NAKSHATRA_NAMES as NAK_NAMES } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { PlanetDetailCard } from '@/components/ui/PlanetDetailCard'
import { getGraNakPositions, getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'
import { NatalPanchangPanel } from '@/components/panchang/NatalPanchangPanel'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import { LandingShell, LandingVedicDivider } from '@/components/home/LandingShell'
import { ChartFormDrawer } from '@/components/home/ChartFormDrawer'
import { MobileDashboardNav, type MobileDashTab, type MobileStrengthSubTab } from '@/components/home/MobileDashboardNav'
import { SiteFooter } from '@/components/ui/layout/SiteFooter'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import { ChartContextBar, PanelShell } from '@/components/ui/patterns'
import {
  isFlushPaddingChartTab,
  isFullWidthChartTab,
  isStrengthAnalyticsTab,
} from '@/lib/ui/chartTabRegistry'

const MOBILE_STRENGTH_TABS = [
  { id: 'ashtakavarga' as const, icon: Grid3x3, label: 'Ashtaka' },
  { id: 'shadbala' as const, icon: Scale, label: 'Shadbala' },
  { id: 'bhava' as const, icon: Home, label: 'Bhava' },
  { id: 'vimsopaka' as const, icon: BarChart3, label: 'Vimsho' },
]

// ─────────────────────────────────────────────────────────────
//  Arudha Panel
// ─────────────────────────────────────────────────────────────

const ARUDHA_TOPICS: Record<string, string> = {
  AL:  'Public image · worldly self',
  A2:  'Wealth · speech · sustenance',
  A3:  'Courage · siblings · skills',
  A4:  'Home · mother · property',
  A5:  'Intellect · children · karma',
  A6:  'Debts · enemies · service',
  A7:  'Spouse · partnerships',
  A8:  'Longevity · hidden matters',
  A9:  'Dharma · father · fortune',
  A10: 'Career · status · action',
  A11: 'Gains · elder siblings · wishes',
  A12: 'Loss · liberation',
}

function ArudhaPanel({ arudhas, arudhasBphs }: { arudhas: ChartOutput['arudhas']; arudhasBphs?: ChartOutput['arudhasBphs'] }) {
  const [useBphsExceptions, setUseBphsExceptions] = useState(false)
  const display = useBphsExceptions && arudhasBphs ? arudhasBphs : arudhas
  const keys = ['AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] as const

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', paddingBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {useBphsExceptions ? 'BPHS exception-corrected' : 'Raw pada (no exceptions)'}
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={useBphsExceptions}
            onChange={(e) => setUseBphsExceptions(e.target.checked)}
          />
          Apply BPHS exceptions
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.35rem' }}>
        {keys.map((key) => {
          const rashi = display[key] as Rashi | undefined
          if (!rashi) return null
          const isAL = key === 'AL'
          return (
            <div key={key} style={{
              padding: '0.35rem 0.55rem',
              background: isAL ? 'rgba(201,168,76,0.08)' : 'var(--surface-2)',
              border: `1px solid ${isAL ? 'var(--border-bright)' : 'var(--border-soft)'}`,
              borderRadius: 'var(--r-sm)',
              display: 'flex', gap: '0.5rem', alignItems: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: isAL ? 'var(--gold)' : 'var(--text-muted)', minWidth: 24, fontWeight: 700 }}>
                {key}
              </span>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: isAL ? 600 : 400 }}>
                  {RASHI_NAMES[rashi]}
                  <span style={{ marginLeft: 4, fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{RASHI_SHORT[rashi]}</span>
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{ARUDHA_TOPICS[key]}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.4rem', borderTop: '1px solid var(--border-soft)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span><span style={{ color: 'var(--gold)' }}>A12:</span> {display.A12 ? RASHI_NAMES[display.A12] : '—'} · Upapada</span>
        <span><span style={{ color: 'var(--gold)' }}>A7:</span> {display.A7 ? RASHI_NAMES[display.A7] : '—'} · Darapada</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Chart Summary sidebar strip
// ─────────────────────────────────────────────────────────────

function ChartSummary({ chart }: { chart: ChartOutput }) {
  const rows = [
    { label: 'Ascendant', value: `${RASHI_NAMES[chart.lagnas.ascRashi as Rashi]} ${chart.lagnas.ascDegreeInRashi.toFixed(1)}°` },
    { label: 'Ayanamsha', value: `${chart.meta.settings.ayanamsha} ${chart.meta.ayanamshaValue.toFixed(3)}°` },
    { label: 'Julian Day', value: chart.meta.julianDay.toFixed(4), mono: true },
  ]
  return (
    <div style={{
      marginTop: '0.85rem',
      padding: '0.85rem 1rem',
      background: 'var(--gold-faint)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Chart Summary</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {rows.map(({ label, value, mono }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{
              color: 'var(--text-secondary)',
              fontFamily: mono ? 'var(--font-mono)' : 'inherit',
              fontSize: mono ? '0.72rem' : '0.8rem',
            }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardSavChart({ sav, ascRashi, size = 220 }: { sav: number[]; ascRashi: number; size?: number }) {
  const CHART_COLOR = {
    teal: 'var(--teal, #4fd1c5)',
    blue: 'var(--blue, #60a5fa)',
    gold: 'var(--text-gold, #f6d365)',
    rose: 'var(--rose, #fb7185)',
    muted: 'var(--text-muted, #94a3b8)',
    border: 'var(--border-soft, #3b3f5c)',
  } as const

  const S = size
  const Q = S / 4
  const M = S / 2
  const maxSav = Math.max(...sav, 1)

  const polyPts = (h: number): [number, number][] => {
    switch (h) {
      case 1: return [[Q, Q], [M, M], [3 * Q, Q], [M, 0]]
      case 2: return [[0, 0], [Q, Q], [M, 0]]
      case 3: return [[0, 0], [0, M], [Q, Q]]
      case 4: return [[0, M], [Q, 3 * Q], [M, M], [Q, Q]]
      case 5: return [[0, M], [0, S], [Q, 3 * Q]]
      case 6: return [[Q, 3 * Q], [0, S], [M, S]]
      case 7: return [[Q, 3 * Q], [M, S], [3 * Q, 3 * Q], [M, M]]
      case 8: return [[3 * Q, 3 * Q], [M, S], [S, S]]
      case 9: return [[3 * Q, 3 * Q], [S, S], [S, M]]
      case 10: return [[3 * Q, Q], [M, M], [3 * Q, 3 * Q], [S, M]]
      case 11: return [[3 * Q, Q], [S, M], [S, 0]]
      case 12: return [[M, 0], [3 * Q, Q], [S, 0]]
      default: return []
    }
  }

  const centroid = (pts: [number, number][]) => ({
    x: pts.reduce((sum, p) => sum + p[0], 0) / pts.length,
    y: pts.reduce((sum, p) => sum + p[1], 0) / pts.length,
  })

  const colorForSav = (v: number) => {
    if (v >= 32) return CHART_COLOR.teal
    if (v >= 28) return CHART_COLOR.blue
    if (v >= 24) return CHART_COLOR.gold
    return CHART_COLOR.rose
  }

  return (
    <svg viewBox={`0 0 ${S} ${S}`} style={{ display: 'block', width: 'min(100%, 260px)', height: 'auto', margin: '0 auto' }}>
      {Array.from({ length: 12 }, (_, i) => i + 1).map((houseNo) => {
        const pts = polyPts(houseNo)
        const pos = centroid(pts)
        const rashi = ((ascRashi - 1 + houseNo - 1) % 12) + 1
        const val = sav[rashi - 1] ?? 0
        return (
          <g key={houseNo}>
            <polygon
              points={pts.map((p) => p.join(',')).join(' ')}
              fill="var(--surface-1)"
              stroke={CHART_COLOR.border}
              strokeWidth="1"
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={S * 0.095}
              fontWeight={800}
              fill={colorForSav(val)}
            >
              {val}
            </text>
            <text
              x={pos.x}
              y={pos.y + S * 0.06}
              textAnchor="middle"
              fontSize={S * 0.03}
              fill={rashi === ascRashi ? CHART_COLOR.gold : CHART_COLOR.muted}
              fontWeight={700}
            >
              {RASHI_SHORT[rashi as Rashi]}
            </text>
          </g>
        )
      })}
      <rect width={S} height={S} fill="none" stroke={CHART_COLOR.border} strokeWidth="1" />
      <text x={S * 0.5} y={S * 0.47} textAnchor="middle" fontSize={S * 0.08} fill={CHART_COLOR.muted} fontWeight={700}>
        {ascRashi}
      </text>
    </svg>
  )
}

function DashboardMetricChip({
  label,
  value,
  sub,
  valueColor = 'var(--teal)',
}: {
  label: string
  value: string | number
  sub?: string
  valueColor?: string
}) {
  return (
    <div style={{
      padding: '0.3rem 0.5rem',
      background: 'var(--surface-2)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--r-sm)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: valueColor, lineHeight: 1.3 }}>{value}</div>
      {sub ? <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div> : null}
    </div>
  )
}

function getCurrentMahaDashaLord(chart: ChartOutput): GrahaId | null {
  const now = Date.now()
  const mahaNodes = (chart.dashas.vimshottari ?? []).filter((n) => n.level === 1)
  const current =
    mahaNodes.find((n) => n.isCurrent) ??
    mahaNodes.find((n) => {
      const start = new Date(n.start).getTime()
      const end = new Date(n.end).getTime()
      return now >= start && now <= end
    }) ??
    mahaNodes[0]

  if (!current?.lord) return null
  return current.lord as GrahaId
}

function getCurrentMahaDasha(chart: ChartOutput): string {
  const lord = getCurrentMahaDashaLord(chart)
  if (!lord) return '—'
  return `${GRAHA_NAMES[lord] ?? lord} mahadasha`
}

function isNowSlot(start?: Date | string, end?: Date | string): boolean {
  if (!start || !end) return false
  const now = Date.now()
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  return Number.isFinite(s) && Number.isFinite(e) && now >= s && now <= e
}

function fmtClock(value: Date | string | number, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

function MajorKundaliStrip({
  chart,
  todayPanchang,
}: {
  chart: ChartOutput
  todayPanchang: import('@/types/astrology').PanchangData | null
}) {
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const sun = chart.grahas.find((g) => g.id === 'Su')
  const ak = chart.karakas?.AK ? (GRAHA_NAMES[chart.karakas.AK] ?? chart.karakas.AK) : '—'
  const liveHora = todayPanchang?.horaTable?.find((h) => isNowSlot(h.start, h.end))
  const runningRahu = todayPanchang && isNowSlot(todayPanchang.rahuKalam.start, todayPanchang.rahuKalam.end)
  const runningGulika = todayPanchang && isNowSlot(todayPanchang.gulikaKalam.start, todayPanchang.gulikaKalam.end)
  const runningYamaganda = todayPanchang && isNowSlot(todayPanchang.yamaganda.start, todayPanchang.yamaganda.end)
  const runningTag = runningRahu ? 'Rahu Kalam' : runningGulika ? 'Gulika Kalam' : runningYamaganda ? 'Yamaganda' : 'Auspicious'

  const nextChangeCandidates = [
    liveHora?.end,
    runningRahu ? todayPanchang?.rahuKalam.end : undefined,
    runningGulika ? todayPanchang?.gulikaKalam.end : undefined,
    runningYamaganda ? todayPanchang?.yamaganda.end : undefined,
  ].filter((v): v is Date => Boolean(v))
  const nextChangeMs = nextChangeCandidates.length
    ? Math.min(...nextChangeCandidates.map((v) => new Date(v).getTime()))
    : null
  const leftMs = nextChangeMs ? Math.max(0, nextChangeMs - Date.now()) : null
  const countdown = leftMs != null
    ? `${Math.floor(leftMs / 60_000)}m ${Math.floor((leftMs % 60_000) / 1000)}s`
    : null

  const natalPanchang = [
    `Vara ${chart.panchang.vara.name}`,
    `Tithi ${chart.panchang.tithi.name} (${chart.panchang.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'})`,
    `Nak ${chart.panchang.nakshatra.name}`,
    `Yoga ${chart.panchang.yoga.name}`,
    `Karana ${chart.panchang.karana.name}`,
  ].join(' · ')
  const livePanchang = todayPanchang
    ? [
      `Vara ${todayPanchang.vara.name}`,
      `Tithi ${todayPanchang.tithi.name} (${todayPanchang.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'})`,
      `Nak ${todayPanchang.nakshatra.name}`,
      `Yoga ${todayPanchang.yoga.name}`,
      `Karana ${todayPanchang.karana.name}`,
    ].join(' · ')
    : 'Loading live panchang...'
  const [y, mm, dd] = chart.meta.birthDate.split('-')
  const formattedDOB = `${dd} ${mm} ${y}`

  const items: { label: string; value: string; hideLabel?: boolean }[] = [
    { label: 'DOB', value: formattedDOB },
    { label: 'Lagna', value: `${RASHI_NAMES[chart.lagnas.ascRashi as Rashi]} ${chart.lagnas.ascDegreeInRashi.toFixed(1)}°` },
    { label: 'Moon', value: moon ? `${RASHI_NAMES[moon.rashi]} · ${moon.nakshatraName}` : '—' },
    { label: 'Sun', value: sun ? `${RASHI_NAMES[sun.rashi]} ${sun.degree.toFixed(1)}°` : '—' },
    { label: 'AK', value: ak },
    { label: '', value: getCurrentMahaDasha(chart), hideLabel: true },
    { label: 'Natal Panchang', value: natalPanchang },
    { label: 'Live Panchang', value: livePanchang },
  ]

  return (
    <div
      className="fade-up kundali-snapshot-strip"
      style={{
        marginTop: '0.45rem',
        marginBottom: '0.65rem',
        padding: '0.42rem 0.55rem',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--border-soft)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
      }}
    >
      {items.map((item, idx) => (
        <React.Fragment key={item.label || `item-${idx}`}>
          <span style={{ whiteSpace: 'nowrap', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {!item.hideLabel && (
              <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                {item.label === 'Live Panchang' ? (
                  <>
                    <span style={{ color: 'var(--rose)' }}>Live</span>
                    <span style={{ marginLeft: 3 }}>Panchang</span>
                  </>
                ) : item.label}
              </span>
            )}
            <span style={{ marginLeft: item.hideLabel ? 0 : 4, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
          </span>
          {idx < items.length - 1 && <span style={{ color: 'var(--border-bright)' }}>|</span>}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────────────────────

import { Suspense } from 'react'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'
import { LandingPremiumHero } from '@/components/home/LandingPremiumHero'
import { LandingStickyMobileCta } from '@/components/home/LandingStickyMobileCta'
import { LandingReveal } from '@/components/home/LandingReveal'
import { AboutPreview } from '@/components/about/AboutPreview'
import { PwaInstallGuide } from '@/components/ui/PwaInstallGuide'

/** Query string matches BirthForm URL hydration (`name`, `birthDate`, … `tz`). */
function buildChartShareUrl(chart: ChartOutput): string {
  const m = chart.meta
  const q = new URLSearchParams({
    name: m.name,
    birthDate: m.birthDate,
    birthTime: m.birthTime,
    birthPlace: m.birthPlace,
    lat: String(m.latitude),
    lng: String(m.longitude),
    tz: m.timezone,
  })
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/?${q.toString()}`
}

function ShareLinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

const VIMSHOTTARI_TARA_IDS = ['Mo', 'As', 'Su', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'] as const

function VimshottariDashaBlock({
  nodes,
  birthDate,
  tara,
  tribhagi,
  userPlan,
  onTara,
  onTribhagi,
}: {
  nodes: import('@/types/astrology').DashaNode[]
  birthDate: Date
  tara: string
  tribhagi: boolean
  userPlan: 'free' | 'gold' | 'platinum'
  onTara: (id: string) => void
  onTribhagi: (on: boolean) => void
}) {
  const chipStyle = (active: boolean, locked = false): React.CSSProperties => ({
    padding: '0.1rem 0.3rem',
    fontSize: '0.65rem',
    fontFamily: 'inherit',
    background: active ? 'var(--gold-faint)' : 'var(--surface-3)',
    border: `1px solid ${active ? 'var(--gold)' : 'var(--border-soft)'}`,
    borderRadius: 3,
    cursor: 'pointer',
    color: locked ? 'var(--text-muted)' : (active ? 'var(--text-gold)' : 'var(--text-secondary)'),
    opacity: locked ? 0.5 : 1,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tara:</span>
        {VIMSHOTTARI_TARA_IDS.map((id) => {
          const locked = userPlan === 'free' && id !== 'Mo'
          return (
            <button
              key={id}
              type="button"
              onClick={() => (locked ? (window.location.href = '/pricing') : onTara(id))}
              title={locked ? 'Requires Gold plan' : undefined}
              style={chipStyle(tara === id, locked)}
            >
              {locked ? '🔒' : ''}{id}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mode:</span>
        <button type="button" onClick={() => onTribhagi(false)} style={chipStyle(!tribhagi)}>Standard</button>
        <button type="button" onClick={() => onTribhagi(true)} style={chipStyle(tribhagi)} title="Tribhagi: each period ÷3, full sequence repeated 3× (40+40+40 years)">Tribhagi</button>
      </div>
      <DashaTree nodes={nodes} birthDate={birthDate} showNakshatra={tribhagi} />
    </div>
  )
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Astrology: Sparkles,
  Prashna: HelpCircle,
  Panchang: Compass,
  Calendar: Calendar,
  Nakshatra: Star,
  'Jaimini Astrology': Zap,
  'Astro Vastu': Home,
  AstroCartography: Globe,
  'Sarvatobhadra Chakra': Layers,
  'Muhurta Finder': Clock,
  'Install App': Download,
  'My Charts': Library,
}

function HomeContent() {
  const { data: session, status } = useSession()
  const { chart, setChart, isFormOpen, setIsFormOpen, pendingDestination, setPendingDestination } = useChart()
  const { activeTab, setActiveTab } = useAppLayout()
  
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
  }
  
  const userPlan = ((session?.user as any)?.plan ?? 'free') as 'free' | 'gold' | 'platinum'
  const [userPrefs, setUserPrefs] = useState<ChartSettings>(DEFAULT_SETTINGS)
  const [transitGrahas, setTransitGrahas] = useState<import('@/types/astrology').GrahaData[] | null>(null)
  const [dashaSystem, setDashaSystem] = useState<'vimshottari' | 'ashtottari' | 'yogini' | 'chara' | 'chara_fe' | 'mandook' | 'sthir'>('vimshottari')
  const [vimshottariTara, setVimshottariTara] = useState<string>('Mo')
  const [vimshottariTribhagi, setVimshottariTribhagi] = useState(false)
  const [activeVarga, setActiveVarga] = useState<string>('D1')
  const [altVimshottari, setAltVimshottari] = useState<import('@/types/astrology').DashaNode[] | null>(null)

  const vimshottariNodes = useMemo(() => {
    if (!chart) return [] as import('@/types/astrology').DashaNode[]
    if (vimshottariTara === 'Mo' && !vimshottariTribhagi) return chart.dashas.vimshottari
    return altVimshottari ?? chart.dashas.vimshottari
  }, [chart, vimshottariTara, vimshottariTribhagi, altVimshottari])
  const [selectedAcgPlanets, setSelectedAcgPlanets] = useState<Set<any>>(new Set(['Su', 'Mo', 'Ju', 'Ve']))
  const [activeAcgParans, setActiveAcgParans] = useState<any[]>([])
  const [acgNatalData, setAcgNatalData] = useState<any[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()
  const savedChartId = searchParams.get('chartId')
  const isSavedChart = Boolean(savedChartId && status === 'authenticated')

  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saveDone,   setSaveDone]   = useState(false)
  const [chartTags,  setChartTags]  = useState<string[]>([])
  const [shareCopied, setShareCopied] = useState(false)
  const [crmSaving,  setCrmSaving]  = useState(false)
  const [crmDone,    setCrmDone]    = useState(false)
  const [defaultChart, setDefaultChart] = useState<any>(null)
  const [fetchingDefault, setFetchingDefault] = useState(false)
  const [todayPanchang,   setTodayPanchang]   = useState<import('@/types/astrology').PanchangData | null>(null)
  const [dashExpandAv, setDashExpandAv] = useState(false)
  const [dashExpandShad, setDashExpandShad] = useState(false)
  const [dashExpandBhava, setDashExpandBhava] = useState(false)
  const [dashExpandVim, setDashExpandVim] = useState(false)
  const [dashExpandPanchang, setDashExpandPanchang] = useState(false)
  const [dashExpandYogas, setDashExpandYogas] = useState(false)
  const [expandGraha, setExpandGraha] = useState(false)
  const [expandAstro, setExpandAstro] = useState(false)
  const [planetaryDetailTab, setPlanetaryDetailTab] = useState<'planets' | 'dasha'>('planets')
  const [desktopDashboardCardOrder, setDesktopDashboardCardOrder] = useState<Array<'summary' | 'cosmic' | 'planetary' | 'astronomical'>>([
    'summary',
    'astronomical',
    'planetary',
    'cosmic',
  ])
  const [draggingDashboardCard, setDraggingDashboardCard] = useState<'summary' | 'cosmic' | 'planetary' | 'astronomical' | null>(null)

  const [isMobile, setIsMobile] = useState(false)
  const [mobileHeaderMenuOpen, setMobileHeaderMenuOpen] = useState(false)
  const [mobileDashCategory, setMobileDashCategory] = useState<'astrology' | 'panchang' | 'nakshatra' | 'advanced'>('astrology')
  const [mobileDashTab, setMobileDashTab] = useState<'astro' | 'planetary' | 'dashas' | 'today' | 'panchang' | 'strengths' | 'yogas'>('astro')
  const [mobileStrengthTab, setMobileStrengthTab] = useState<'shadbala' | 'bhava' | 'vimsopaka' | 'ashtakavarga'>('ashtakavarga')
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isMobile && mobileHeaderMenuOpen) setMobileHeaderMenuOpen(false)
  }, [isMobile, mobileHeaderMenuOpen])

  useEffect(() => {
    if (!isMobile) return
    const main = document.querySelector('.main-content')
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' })
  }, [mobileDashTab, isMobile])

  const isStrengthAnalyticsTabActive = isStrengthAnalyticsTab(activeTab)
  const showStrengthSubNav = isMobile && !!chart && (
    (activeTab === 'dashboard' && mobileDashTab === 'strengths') ||
    isStrengthAnalyticsTabActive
  )
  const showMainDashBottomNav = isMobile && !!chart && activeTab === 'dashboard'
  const strengthSubNavStacked = showMainDashBottomNav && mobileDashTab === 'strengths'

  const activeStrengthSubTab: MobileStrengthSubTab = useMemo(() => {
    if (activeTab === 'ashtakavarga') return 'ashtakavarga'
    if (activeTab === 'shadbala') return 'shadbala'
    if (activeTab === 'bhava-bala') return 'bhava'
    if (activeTab === 'vimsopaka') return 'vimsopaka'
    return mobileStrengthTab
  }, [activeTab, mobileStrengthTab])

  const handleStrengthSubTab = (id: MobileStrengthSubTab) => {
    if (activeTab === 'dashboard') {
      setMobileStrengthTab(id)
    } else {
      const map = { ashtakavarga: 'ashtakavarga', shadbala: 'shadbala', bhava: 'bhava-bala', vimsopaka: 'vimsopaka' } as const
      setActiveTab(map[id])
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!isMobile || !showStrengthSubNav) return
    const main = document.querySelector('.main-content')
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeStrengthSubTab, isMobile, showStrengthSubNav])


  const dashboardAshtakSummary = useMemo(() => {
    if (!chart?.ashtakavarga) return null
    const sav = chart.ashtakavarga.sav
    const signs = sav.map((val, i) => ({ sign: (i + 1) as Rashi, val }))
    const sorted = [...signs].sort((a, b) => b.val - a.val)
    return {
      savTotal: chart.ashtakavarga.savTotal,
      avg: (chart.ashtakavarga.savTotal / 12).toFixed(1),
      highest: sorted[0],
      lowest: sorted[sorted.length - 1],
    }
  }, [chart])

  const dashboardShadbalaSummary = useMemo(() => {
    if (!chart?.shadbala) return null
    const { strongest, weakest, planets } = chart.shadbala
    const core: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
    const sn = GRAHA_NAMES[strongest as GrahaId] ?? strongest
    const wn = GRAHA_NAMES[weakest as GrahaId] ?? weakest
    const ratios = core.map((id) => planets[id]?.ratio).filter((r): r is number => typeof r === 'number')
    const meanRatio = ratios.length ? (ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(2) : '—'
    const ranked = core
      .map((id) => ({
        id,
        name: GRAHA_NAMES[id] ?? id,
        total: planets[id]?.total ?? 0,
        ratio: planets[id]?.ratio ?? 0,
      }))
      .sort((a, b) => b.total - a.total)
    const top5 = ranked.slice(0, 5)
    const maxTotal = ranked.length ? Math.max(...ranked.map((r) => r.total), 1) : 1
    const minTotal = ranked.length ? Math.min(...ranked.map((r) => r.total)) : 0
    const spread = (maxTotal - minTotal).toFixed(2)
    return {
      strongestLabel: sn,
      weakestLabel: wn,
      strongTotal: planets[strongest]?.total.toFixed(2) ?? '—',
      weakTotal: planets[weakest]?.total.toFixed(2) ?? '—',
      meanRatio,
      spread,
      maxTotal,
      top5,
    }
  }, [chart])

  const dashboardBhavaBalaSummary = useMemo(() => {
    if (!chart?.bhavaBala?.houses) return null
    const strongestHouse = chart.bhavaBala.strongestHouse
    const weakestHouse = chart.bhavaBala.weakestHouse
    const strong = chart.bhavaBala.houses[strongestHouse]
    const weak = chart.bhavaBala.houses[weakestHouse]
    if (!strong || !weak) return null
    const totals = Object.values(chart.bhavaBala.houses).map((h) => h.totalRupa)
    const avgRupa = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : null
    return {
      strongestHouse,
      weakestHouse,
      strongTotal: strong.totalRupa.toFixed(2),
      weakTotal: weak.totalRupa.toFixed(2),
      avgRupa: avgRupa != null ? avgRupa.toFixed(2) : '—',
      spreadRupa: (strong.totalRupa - weak.totalRupa).toFixed(2),
    }
  }, [chart])

  const dashboardVimsopakaSummary = useMemo(() => {
    if (!chart?.vimsopaka?.planets) return null
    const v = chart.vimsopaka
    const board = v.leaderboard?.length ? v.leaderboard : []
    const top3 = board.slice(0, 3)
    const strongScore = v.planets[v.strongest]?.shodasvarga
    const weakScore = v.planets[v.weakest]?.shodasvarga
    return {
      strongest: GRAHA_NAMES[v.strongest as GrahaId] ?? v.strongest,
      weakest: GRAHA_NAMES[v.weakest as GrahaId] ?? v.weakest,
      strongScore: strongScore != null ? strongScore.toFixed(2) : '—',
      weakScore: weakScore != null ? weakScore.toFixed(2) : '—',
      avg: v.insights?.averageShodasvarga != null ? v.insights.averageShodasvarga.toFixed(2) : null,
      top3,
    }
  }, [chart])

  const showSecondaryAnalysisColumn =
    activeTab === 'dashboard' ||
    activeTab === 'dasha' ||
    activeTab === 'panchang' ||
    activeTab === 'astro-details' ||
    activeTab === 'yogas' ||
    activeTab === 'arudhas' ||
    activeTab === 'ashtakavarga' ||
    activeTab === 'shadbala' ||
    activeTab === 'bhava-bala' ||
    activeTab === 'vimsopaka'

  const handleAcgPlanetsChange = React.useCallback((planets: Set<any>, parans: any[], rawNatal?: any[]) => {
    setSelectedAcgPlanets(prev => {
        if (prev.size === planets.size && Array.from(planets).every(p => prev.has(p))) return prev
        return planets
    })
    setActiveAcgParans(parans)
    if (rawNatal) setAcgNatalData(rawNatal)
  }, [])

  // 1. Fetch default chart if logged in (with client-side caching)
  useEffect(() => {
    if (status === 'authenticated') {
      // Check local cache first for instant load
      const cached = sessionStorage.getItem('jyotish_user_me')
      if (cached) {
        try {
          const data = JSON.parse(cached)
          if (data.success) {
            if (data.personalChart) setDefaultChart(data.personalChart)
            if (data.user?.preferences) {
              const prefs = data.user.preferences
              setUserPrefs(prev => ({
                ...prev,
                ...(prefs.defaultAyanamsha    ? { ayanamsha:    prefs.defaultAyanamsha    } : {}),
                ...(prefs.defaultHouseSystem  ? { houseSystem:  prefs.defaultHouseSystem  } : {}),
                ...(prefs.defaultNodeMode     ? { nodeMode:     prefs.defaultNodeMode     } : {}),
                karakaScheme: (prefs.karakaScheme === 8) ? 7 : (prefs.karakaScheme || 7),
                ...(prefs.showDegrees   != null ? { showDegrees:  prefs.showDegrees   } : {}),
                ...(prefs.showNakshatra != null ? { showNakshatra:prefs.showNakshatra } : {}),
                ...(prefs.showKaraka    != null ? { showKaraka:   prefs.showKaraka    } : {}),
              }))
            }
          }
        } catch (e) {
          sessionStorage.removeItem('jyotish_user_me')
        }
      }

      setFetchingDefault(true)
      fetch('/api/user/me')
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            // Update cache
            sessionStorage.setItem('jyotish_user_me', JSON.stringify(data))
            
            if (data.personalChart) {
               setDefaultChart(data.personalChart)
            }
            // Apply user preferences
            if (data.user?.preferences) {
              const prefs = data.user.preferences
              setUserPrefs(prev => ({
                ...prev,
                ...(prefs.defaultAyanamsha    ? { ayanamsha:    prefs.defaultAyanamsha    } : {}),
                ...(prefs.defaultChartStyle   ? { chartStyle:   prefs.defaultChartStyle   } : {}),
                ...(prefs.defaultHouseSystem  ? { houseSystem:  prefs.defaultHouseSystem  } : {}),
                ...(prefs.defaultNodeMode     ? { nodeMode:     prefs.defaultNodeMode     } : {}),
                karakaScheme: (prefs.karakaScheme === 8) ? 7 : (prefs.karakaScheme || 7),
                ...(prefs.showDegrees   != null ? { showDegrees:  prefs.showDegrees   } : {}),
                ...(prefs.showNakshatra != null ? { showNakshatra:prefs.showNakshatra } : {}),
                ...(prefs.showKaraka    != null ? { showKaraka:   prefs.showKaraka    } : {}),
              }))
            }
          }
        })
        .finally(() => setFetchingDefault(false))
    }
  }, [status])

  // 1b. Fetch today's panchang for dashboard insights
  useEffect(() => {
    if (chart && activeTab === 'dashboard' && !todayPanchang) {
      const todayString = new Date().toISOString().split('T')[0]
      fetch(`/api/panchang?date=${todayString}&lat=${chart.meta.latitude}&lng=${chart.meta.longitude}&tz=${encodeURIComponent(chart.meta.timezone)}`)
        .then(r => r.json())
        .then(json => {
            if (json.success) setTodayPanchang(json.data)
        })
    }
  }, [chart, activeTab, todayPanchang])

  // 2. Open form if 'new=true' is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true' && !isFormOpen) {
      setIsFormOpen(true)
      setChart(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setIsFormOpen, setChart]) 

  async function handleSave(type: 'regular' | 'personal' = 'regular') {
    if (!chart || saving) return
    setSaving(true)
    const payload = {
      name:       chart.meta.name,
      birthDate:  chart.meta.birthDate,
      birthTime:  chart.meta.birthTime,
      birthPlace: chart.meta.birthPlace,
      latitude:   chart.meta.latitude,
      longitude:  chart.meta.longitude,
      timezone:   chart.meta.timezone,
      gender:     chart.meta.gender,
      settings:   chart.meta.settings,
      isPersonal: type === 'personal',
      tags:       chartTags,
    }
    try {
      const res = isSavedChart
        ? await fetch(`/api/chart/${savedChartId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/chart/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      if (res.ok) {
        const json = await res.json().catch(() => ({}))
        if (!isSavedChart && json.chartId) {
          const params = new URLSearchParams(searchParams.toString())
          params.set('chartId', json.chartId)
          router.replace(`?${params.toString()}`, { scroll: false })
        }
        setSaveDone(true)
        setTimeout(() => setSaveDone(false), 4000)
      }
    } catch (e) {
      console.error('Save failed', e)
    } finally {
      setSaving(false)
    }
  }

  const startNewChart = React.useCallback(() => {
    setChart(null)
    setChartTags([])
    setIsFormOpen(true)
    router.push('/?new=true')
  }, [router, setChart, setIsFormOpen])

  async function handleSaveToCRM() {
    if (!chart || crmSaving) return
    setCrmSaving(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       chart.meta.name,
          birthDate:  chart.meta.birthDate,
          birthTime:  chart.meta.birthTime,
          birthPlace: chart.meta.birthPlace,
          latitude:   chart.meta.latitude,
          longitude:  chart.meta.longitude,
          timezone:   chart.meta.timezone,
          status:     'active',
        })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setCrmDone(true)
        setTimeout(() => setCrmDone(false), 4000)
      } else {
        alert(json.error || 'Failed to add client to CRM')
      }
    } catch (e) {
      console.error('CRM Save failed', e)
    } finally {
      setCrmSaving(false)
    }
  }

  async function handleCopyShareLink() {
    if (!chart) return
    const url = buildChartShareUrl(chart)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {
        return
      }
    }
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2500)
  }

  useEffect(() => {
    if (!chart || (vimshottariTara === 'Mo' && !vimshottariTribhagi)) {
      setAltVimshottari(null)
      return
    }
    let refLon: number | null = null
    if (vimshottariTara === 'As') {
      refLon = chart.lagnas.ascDegree
    } else {
      const g = chart.grahas.find(g => g.id === vimshottariTara)
      if (g) refLon = g.lonSidereal
    }
    if (refLon === null) { setAltVimshottari(null); return }
    import('@/lib/engine/dasha/vimshottari').then(({ calcVimshottari }) => {
      const nodes = calcVimshottari(refLon!, new Date(chart.meta.birthDate), 6, undefined, {
        tribhagi: vimshottariTribhagi,
      })
      setAltVimshottari(nodes)
    })
  }, [chart, vimshottariTara, vimshottariTribhagi])

    const moonNakIndex = chart?.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const tithiNumber  = chart?.panchang.tithi.number ?? 1
  const varaNumber   = chart?.panchang.vara.number  ?? 0

  const closeDrawer = React.useCallback(() => {
    setIsFormOpen(false)
    setPendingDestination(null)
    if (searchParams.get('new') === 'true') {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('new')
      const p = params.toString()
      router.replace(p ? `?${p}` : window.location.pathname, { scroll: false })
    }
  }, [searchParams, router, setIsFormOpen, setPendingDestination])

  // Load hashtags when opening a saved chart from My Charts (chartId in URL)
  useEffect(() => {
    const chartId = searchParams.get('chartId')
    if (!chartId || status !== 'authenticated') return

    let cancelled = false
    fetch(`/api/chart/${chartId}`)
      .then(r => r.json())
      .then(json => {
        if (!cancelled && json.success && Array.isArray(json.chart?.tags)) {
          setChartTags(json.chart.tags)
        }
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [searchParams, status])

  // Hashtags from default / personal chart profile
  useEffect(() => {
    if (searchParams.get('chartId')) return
    if (searchParams.get('new') === 'true') {
      setChartTags([])
      return
    }
    if (searchParams.get('name')) {
      setChartTags([])
      return
    }
    if (Array.isArray(defaultChart?.tags)) {
      setChartTags(defaultChart.tags)
    }
  }, [defaultChart, searchParams])

  const openAstrologyApp = React.useCallback(() => {
    setIsFormOpen(true)
    router.push('/?new=true')
  }, [router, setIsFormOpen])

  const openSectionWithChartGate = React.useCallback((href: string, e?: React.MouseEvent<HTMLElement>) => {
    if (routeAllowsWithoutChart(href)) {
      return
    }

    const isAstrologyTarget = href === '/' || href.startsWith('/?')
    if (!chart && !isAstrologyTarget) {
      e?.preventDefault()
      setPendingDestination(href)
      setIsFormOpen(true)
      router.push('/?new=true')
      return
    }
    if (!chart && isAstrologyTarget) {
      e?.preventDefault()
      setIsFormOpen(true)
      router.push('/?new=true')
    }
  }, [chart, router, setIsFormOpen, setPendingDestination])

  const openMyDefaultChart = React.useCallback(async () => {
    if (!defaultChart) {
      router.push('/?new=true')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...defaultChart,
            settings: { ...userPrefs, ...defaultChart.settings },
            _t: Date.now(), // Cache buster
          }),
      })
      const json = await res.json()
      if (json.success) {
        setChart(json.data)
        if (Array.isArray(defaultChart?.tags)) {
          setChartTags(defaultChart.tags)
        }
        router.push('/')
      }
    } catch (error) {
      console.error('Default chart load failed', error)
    } finally {
      setLoading(false)
    }
  }, [defaultChart, router, setChart, userPrefs])

  const landingWhyVedaansh = [
    { title: 'Classical Accuracy', detail: 'Swiss Ephemeris precision with Lahiri ayanamsha and full varga depth.', icon: Compass },
    { title: 'One Workspace', detail: 'Kundali, dashas, Panchang, and Prashna in a single coherent flow.', icon: Layers },
    { title: 'Consultation Ready', detail: 'Built for practitioners and seekers — interpret, export, and plan.', icon: Star },
  ]

  const landingJourney = [
    { step: '01', title: 'Enter birth details', text: 'Open Astrology app and submit date, time, and place.' },
    { step: '02', title: 'Generate deep chart', text: 'Compute grahas, houses, dasha layers, and divisional charts instantly.' },
    { step: '03', title: 'Apply in real life', text: 'Use Panchang, Prashna, and calendar timing to plan your next action.' },
  ]

  const landingMajorSections = [
    {
      title: 'Astrology',
      subtitle: 'Dashboard',
      text: 'Kundali, vargas, dasha, and interpretation.',
      href: '/',
      ctaName: 'major_sections_astrology',
      icon: '🧿',
    },
    {
      title: 'Prashna',
      subtitle: 'Query',
      text: 'Guidance for specific questions.',
      href: '/prashna',
      ctaName: 'major_sections_prashna',
      icon: '🎯',
    },
    {
      title: 'Panchang',
      subtitle: 'Daily',
      text: 'Tithi, nakshatra, yoga, and karana.',
      href: '/panchang',
      ctaName: 'major_sections_panchang',
      icon: '🕉️',
    },
    {
      title: 'Calendar',
      subtitle: 'Monthly',
      text: 'Month-level Vedic timing windows.',
      href: '/panchang/calendar',
      ctaName: 'major_sections_calendar',
      icon: '🗓️',
    },
    {
      title: 'Nakshatra',
      subtitle: 'Lunar',
      text: 'Nakshatra insights day by day.',
      href: '/nakshatra',
      ctaName: 'major_sections_nakshatra',
      icon: '✨',
    },
    {
      title: 'Jaimini Astrology',
      subtitle: 'Advanced',
      text: 'Jaimini charts and life direction.',
      href: '/jaimini',
      ctaName: 'major_sections_jaimini',
      icon: '🔮',
    },
    {
      title: 'Astro Vastu',
      subtitle: 'Space',
      text: 'Vastu aligned with your chart.',
      href: '/vastu',
      ctaName: 'major_sections_astro_vastu',
      icon: '🏠',
    },
    {
      title: 'AstroCartography',
      subtitle: 'Location',
      text: 'Planetary lines for travel and moves.',
      href: '/acg',
      ctaName: 'major_sections_astrocartography',
      icon: '🌍',
    },
    {
      title: 'Sarvatobhadra Chakra',
      subtitle: 'Classical',
      text: 'Traditional S.B. Chakra timing.',
      href: '/sbc',
      ctaName: 'major_sections_sarvatobhadra',
      icon: '🌀',
    },
    {
      title: 'Muhurta Finder',
      subtitle: 'Timing',
      text: 'Auspicious windows for key actions.',
      href: '/muhurta',
      ctaName: 'major_sections_muhurta_finder',
      icon: '🕒',
    },
    {
      title: 'Install App',
      subtitle: 'Mobile',
      text: 'Add Vedaansh to your home screen.',
      href: '/install',
      ctaName: 'major_sections_install_app',
      icon: '📲',
    },
    {
      title: 'My Charts',
      subtitle: 'Library',
      text: 'Open saved charts from your account.',
      href: '/my/charts',
      ctaName: 'major_sections_my_charts',
      icon: '📚',
    },
  ]

  const landingTrustStats = [
    { value: '41', label: 'Varga charts' },
    { value: 'Arc-sec', label: 'Ephemeris precision' },
    { value: 'Free', label: 'Core tools' },
  ]

  const landingVariant = searchParams.get('lpv') === 'b' ? 'b' : 'a'

  const trackLandingCta = React.useCallback((ctaName: string) => {
    const payload = {
      event: 'landing_cta_click',
      ctaName,
      variant: landingVariant,
      ts: Date.now(),
    }

    if (typeof window === 'undefined') return
    ;(window as any).__vedaanshLandingEvents = (window as any).__vedaanshLandingEvents ?? []
    ;(window as any).__vedaanshLandingEvents.push(payload)

    // Future-proof bridge for common analytics providers when connected.
    if (typeof (window as any).plausible === 'function') {
      ;(window as any).plausible('landing_cta_click', { props: { ctaName, variant: landingVariant } })
    }
    if (typeof (window as any).umami?.track === 'function') {
      ;(window as any).umami.track('landing_cta_click', { ctaName, variant: landingVariant })
    }
    if (typeof (window as any).posthog?.capture === 'function') {
      ;(window as any).posthog.capture('landing_cta_click', { ctaName, variant: landingVariant })
    }
  }, [landingVariant])

  const moveDashboardCard = (
    sourceCard: 'summary' | 'cosmic' | 'planetary' | 'astronomical',
    targetCard: 'summary' | 'cosmic' | 'planetary' | 'astronomical',
  ) => {
    if (sourceCard === targetCard) return
    setDesktopDashboardCardOrder((current) => {
      const sourceIndex = current.indexOf(sourceCard)
      const targetIndex = current.indexOf(targetCard)
      if (sourceIndex < 0 || targetIndex < 0) return current
      const updated = [...current]
      updated.splice(sourceIndex, 1)
      updated.splice(targetIndex, 0, sourceCard)
      return updated
    })
  }

  const makeDesktopCardContainerProps = (
    cardId: 'summary' | 'cosmic' | 'planetary' | 'astronomical',
  ) => ({
    draggable: true,
    onDragStart: () => setDraggingDashboardCard(cardId),
    onDragEnd: () => setDraggingDashboardCard(null),
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault() },
    onDrop: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!draggingDashboardCard) return
      moveDashboardCard(draggingDashboardCard, cardId)
      setDraggingDashboardCard(null)
    },
    style: {
      opacity: draggingDashboardCard === cardId ? 0.55 : 1,
      cursor: 'grab',
    },
  })

  const renderDesktopDashboardCard = (
    cardId: 'summary' | 'cosmic' | 'planetary' | 'astronomical',
    dashboardChart: ChartOutput,
  ) => {
    if (cardId === 'planetary') {
      return (
        <div className="panel fade-up">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Planetary Details</span>
              <div style={{ display: 'inline-flex', gap: '0.22rem', marginLeft: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setPlanetaryDetailTab('planets')}
                  style={{
                    padding: '0.12rem 0.45rem',
                    fontSize: '0.64rem',
                    borderRadius: 999,
                    border: `1px solid ${planetaryDetailTab === 'planets' ? 'var(--gold)' : 'var(--border-soft)'}`,
                    background: planetaryDetailTab === 'planets' ? 'var(--gold-faint)' : 'transparent',
                    color: planetaryDetailTab === 'planets' ? 'var(--text-gold)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontWeight: planetaryDetailTab === 'planets' ? 700 : 500,
                  }}
                >
                  Planets
                </button>
                <button
                  type="button"
                  onClick={() => setPlanetaryDetailTab('dasha')}
                  style={{
                    padding: '0.12rem 0.45rem',
                    fontSize: '0.64rem',
                    borderRadius: 999,
                    border: `1px solid ${planetaryDetailTab === 'dasha' ? 'var(--gold)' : 'var(--border-soft)'}`,
                    background: planetaryDetailTab === 'dasha' ? 'var(--gold-faint)' : 'transparent',
                    color: planetaryDetailTab === 'dasha' ? 'var(--text-gold)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontWeight: planetaryDetailTab === 'dasha' ? 700 : 500,
                  }}
                >
                  Dasha
                </button>
              </div>
            </div>
            {planetaryDetailTab === 'planets' ? (
              <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', fontFamily: 'var(--font-body)' }} onClick={() => setExpandGraha(!expandGraha)}>
                {expandGraha ? '▴ Less' : '▾ More'}
              </button>
            ) : (
              <select
                value={dashaSystem}
                onChange={(e) => setDashaSystem(e.target.value as any)}
                style={{ padding: '0.15rem 0.35rem', fontSize: '0.62rem', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-soft)', borderRadius: '3px', fontFamily: 'inherit' }}
              >
                <option value="vimshottari">Vimshottari</option>
                <option value="yogini">Yogini</option>
                <option value="chara">Chara (K.N. Rao)</option>
                <option value="chara_fe">Chara (Rangacharya FE)</option>
                <option value="mandook">Mandook (K.N. Rao)</option>
                <option value="sthir">Sthir</option>
                <option value="ashtottari">Ashtottari</option>
              </select>
            )}
          </div>
          {planetaryDetailTab === 'planets' ? (
            <div style={{ padding: '0.4rem 0' }}>
              <GrahaTable
                grahas={dashboardChart.grahas}
                vargas={dashboardChart.vargas}
                vargaLagnas={dashboardChart.vargaLagnas}
                lagnas={dashboardChart.lagnas}
                upagrahas={dashboardChart.upagrahas}
                activeVarga={activeVarga}
                onVargaChange={setActiveVarga}
                arudhas={dashboardChart.arudhas}
                limited={!expandGraha}
              />
            </div>
          ) : (
            <div style={{ padding: '0.5rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {dashaSystem === 'vimshottari' && (
                <VimshottariDashaBlock
                  nodes={vimshottariNodes}
                  birthDate={new Date(dashboardChart.meta.birthDate)}
                  tara={vimshottariTara}
                  tribhagi={vimshottariTribhagi}
                  userPlan={userPlan}
                  onTara={setVimshottariTara}
                  onTribhagi={setVimshottariTribhagi}
                />
              )}
              {dashaSystem === 'ashtottari' && (dashboardChart.dashas.ashtottari?.length ? <DashaTree nodes={dashboardChart.dashas.ashtottari} birthDate={new Date(dashboardChart.meta.birthDate)} /> : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.75rem', textAlign: 'center' }}>Ashtottari computation required.</div>)}
              {dashaSystem === 'yogini' && (dashboardChart.dashas.yogini?.length ? <DashaTree nodes={dashboardChart.dashas.yogini} birthDate={new Date(dashboardChart.meta.birthDate)} /> : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.75rem', textAlign: 'center' }}>Yogini computation required.</div>)}
              {dashaSystem === 'chara' && (dashboardChart.dashas.chara?.length ? <DashaTree nodes={dashboardChart.dashas.chara} birthDate={new Date(dashboardChart.meta.birthDate)} /> : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.75rem', textAlign: 'center' }}>Chara computation required.</div>)}
              {dashaSystem === 'chara_fe' && (dashboardChart.dashas.chara_fe?.length ? <DashaTree nodes={dashboardChart.dashas.chara_fe} birthDate={new Date(dashboardChart.meta.birthDate)} /> : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.75rem', textAlign: 'center' }}>Chara FE computation required.</div>)}
              {dashaSystem === 'mandook' && (dashboardChart.dashas.mandook?.length ? <DashaTree nodes={dashboardChart.dashas.mandook} birthDate={new Date(dashboardChart.meta.birthDate)} /> : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.75rem', textAlign: 'center' }}>Mandook computation required.</div>)}
              {dashaSystem === 'sthir' && (dashboardChart.dashas.sthir?.length ? <DashaTree nodes={dashboardChart.dashas.sthir} birthDate={new Date(dashboardChart.meta.birthDate)} /> : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.75rem', textAlign: 'center' }}>Sthir computation required.</div>)}
            </div>
          )}
        </div>
      )
    }

    if (cardId === 'astronomical') {
      return (
        <div className="panel fade-up">
          <div className="panel-header">
            <span>Astronomical Details</span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', fontFamily: 'var(--font-body)' }} onClick={() => setExpandAstro(!expandAstro)}>
              {expandAstro ? '▴ Less' : '▾ More'}
            </button>
          </div>
          <div style={{ maxHeight: expandAstro ? 'none' : '220px', overflow: 'hidden', position: 'relative', padding: '0.4rem 0.5rem' }}>
            <AstroDetailsPanel chart={dashboardChart} />
            {!expandAstro && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px', background: 'linear-gradient(transparent, var(--surface-1))', pointerEvents: 'none' }} />
            )}
          </div>
        </div>
      )
    }

    if (cardId === 'summary') {
      return (
        <div className="panel fade-up">
          <div className="panel-header" style={{ flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem 0.65rem' }}>
            <span style={{ whiteSpace: 'nowrap' }}>Today&apos;s Timeline</span>
            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
              <span className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.8 }}>☽ {dashboardChart.panchang.nakshatra.name}</span>
              <select
                value={dashaSystem}
                onChange={(e) => setDashaSystem(e.target.value as any)}
                style={{ padding: '0.16rem 0.36rem', fontSize: '0.7rem', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-soft)', borderRadius: '3px', fontFamily: 'var(--font-body)', cursor: 'pointer' }}
              >
                <option value="vimshottari">Vimshottari</option>
                <option value="yogini">Yogini</option>
                <option value="chara">Chara (K.N. Rao)</option>
                <option value="chara_fe">Chara (Rangacharya FE)</option>
                <option value="mandook">Mandook (K.N. Rao)</option>
                <option value="sthir">Sthir</option>
                <option value="ashtottari">Ashtottari</option>
              </select>
            </div>
          </div>
          <div className="timeline-dashboard-grid">
            <div>
              {(() => {
                const nodes = dashaSystem === 'vimshottari'
                  ? vimshottariNodes
                  : (dashboardChart.dashas[dashaSystem] ?? [])
                if (!nodes || nodes.length === 0) return <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.5rem', fontFamily: 'var(--font-body)' }}>No data.</div>
                return (
                  <DashaTree
                    nodes={nodes}
                    birthDate={new Date(dashboardChart.meta.birthDate)}
                    showNakshatra={dashaSystem === 'vimshottari' && vimshottariTribhagi}
                  />
                )
              })()}
            </div>
            <div>
              <ActiveHousesCard chart={dashboardChart} transitMoonLon={todayPanchang?.moonLongitudeSidereal} />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="panel fade-up">
        <div className="panel-header">
          <span>Cosmic Weather</span>
          <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ☽ {dashboardChart.panchang.nakshatra.name}
          </span>
        </div>
        <div style={{ padding: '0.45rem 0.55rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>

          {/* Cosmic weather compact block */}
          <PersonalDayCard
            birthMoonNakIdx={dashboardChart.panchang.nakshatra.index}
            birthMoonName={dashboardChart.panchang.nakshatra.name}
            latitude={dashboardChart.meta.latitude}
            longitude={dashboardChart.meta.longitude}
            timezone={dashboardChart.meta.timezone}
            todayPanchang={todayPanchang}
            birthDate={dashboardChart.meta.birthDate}
          />

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border-soft)' }} />

          {/* Daily Suitability */}
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Daily Suitability</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '0.65rem', rowGap: '0.28rem' }}>
              {[
                { label: 'Spiritual', icon: '✦', rating: 95, color: 'var(--teal)' },
                { label: 'Wellness',  icon: '✦', rating: 82, color: 'var(--teal)' },
                { label: 'Learning',  icon: '✦', rating: 78, color: 'var(--gold)' },
                { label: 'Business',  icon: '✦', rating: 45, color: 'var(--rose)' },
                { label: 'Travel',    icon: '✦', rating: 30, color: 'var(--rose)' },
                { label: 'Property',  icon: '✦', rating: 15, color: 'var(--rose)' },
              ].map((act, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{act.label}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: act.color, fontFamily: 'var(--font-mono)' }}>{act.rating}%</span>
                  </div>
                  <div style={{ height: 2, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${act.rating}%`, background: act.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    )
  }

  const leftDashboardCards = desktopDashboardCardOrder.slice(0, 2)
  const rightDashboardCards = desktopDashboardCardOrder.slice(2)

  return (
    <div className="main-responsive-padding" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {loading ? (
        <div key="home-loading" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '6rem 2rem', minHeight: '60vh' }}>
          <div className="spin-loader" style={{ width: 56, height: 56, border: '4px solid var(--border-soft)', borderTopColor: 'var(--gold)', borderRadius: '50%', borderLeftColor: 'transparent' }} />
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-gold)', margin: '0 0 0.5rem 0', fontWeight: 500 }}>Recalculating Karma…</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aligning with stellar coordinates with Swiss Ephemeris precision.</p>
          </div>
        </div>
      ) : chart ? (
         <div key="home-chart" className="fade-up" style={{ minWidth: 0, paddingBottom: showStrengthSubNav && activeTab !== 'dashboard' ? '6rem' : undefined }}>
            
            {/* Compact Header Strip */}
            <div className="chart-header-row" style={isMobile ? { position: 'relative' } : undefined}>
              <ChartContextBar
                chart={chart}
                tags={chartTags}
                isMobile={isMobile}
                mobileReserveRight={
                  status === 'authenticated'
                    ? 'calc(5 * 34px + 4 * 0.4rem + 0.75rem)'
                    : 'calc(3 * 34px + 2 * 0.4rem + 0.75rem)'
                }
              />

              {isMobile && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    zIndex: 5,
                    display: 'flex',
                    gap: '0.4rem',
                    alignItems: 'center',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleCopyShareLink()}
                    aria-label={shareCopied ? 'Link copied' : 'Copy link to this chart'}
                    title={shareCopied ? 'Copied!' : 'Copy link — free, no login required'}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: `1px solid ${shareCopied ? 'var(--accent)' : 'var(--border-soft)'}`,
                      background: shareCopied ? 'rgba(34,197,94,0.1)' : 'var(--surface-2)',
                      color: shareCopied ? 'var(--accent)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                  >
                    {shareCopied ? (
                      <span style={{ fontSize: '0.85rem' }}>✓</span>
                    ) : (
                      <ShareLinkIcon />
                    )}
                  </button>
                  {status === 'authenticated' && (
                    <button
                      type="button"
                      onClick={() => handleSave('regular')}
                      disabled={saving || saveDone}
                      aria-label={isSavedChart ? 'Update saved chart' : 'Save chart'}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: `1px solid ${saveDone ? 'var(--accent)' : 'var(--border-soft)'}`,
                        background: saveDone ? 'rgba(34,197,94,0.1)' : 'var(--surface-2)',
                        color: saveDone ? 'var(--accent)' : 'var(--text-primary)',
                        fontSize: '1rem',
                        lineHeight: 1,
                        cursor: saving || saveDone ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      {saving ? (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.7 }}>…</span>
                      ) : saveDone ? (
                        <span style={{ fontSize: '0.85rem' }}>✓</span>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                          <polyline points="17 21 17 13 7 13 7 21"/>
                          <polyline points="7 3 7 8 15 8"/>
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                    aria-label="Edit birth details"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: '1px solid var(--border-soft)',
                      background: 'var(--surface-2)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  {status === 'authenticated' && (
                    <Link
                      href="/my/charts"
                      aria-label="My charts library"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid var(--border-soft)',
                        background: 'var(--surface-2)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        textDecoration: 'none',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileHeaderMenuOpen((s) => !s)}
                    aria-label="Open chart actions"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: '1px solid var(--border-soft)',
                      background: 'var(--surface-2)',
                      color: 'var(--text-primary)',
                      fontSize: '1.15rem',
                      lineHeight: 1,
                      cursor: 'pointer',
                    }}
                  >
                    ⋮
                  </button>
                </div>
              )}
              {isMobile && mobileHeaderMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close actions menu"
                    onClick={() => setMobileHeaderMenuOpen(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 40,
                      border: 'none',
                      background: 'rgba(0,0,0,0.22)',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  />
                  <div
                    style={{
                      position: 'fixed',
                      top: 76,
                      right: 16,
                      zIndex: 41,
                      width: 220,
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)',
                      boxShadow: 'var(--shadow-card)',
                      padding: '0.55rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setMobileHeaderMenuOpen(false)
                        void handleCopyShareLink()
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center' }} aria-hidden><ShareLinkIcon /></span>
                      {shareCopied ? 'Copied link' : 'Copy chart link'}
                    </button>
                    {status === 'authenticated' && (
                      <button
                        onClick={() => {
                          setMobileHeaderMenuOpen(false)
                          handleSave('regular')
                        }}
                        disabled={saving || saveDone}
                        className={`btn ${saveDone ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {saving ? 'Saving…' : saveDone ? '✓ Updated' : isSavedChart ? 'Update Chart' : '+ Save Chart'}
                      </button>
                    )}
                    {status === 'authenticated' && (
                      <Link
                        href="/my/charts"
                        onClick={() => setMobileHeaderMenuOpen(false)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span aria-hidden>📚</span> My Charts
                      </Link>
                    )}
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <ExportPdfButton chart={chart} compact />
                      <EmailChartButton chart={chart} compact />
                    </div>
                    <button
                      onClick={() => {
                        setMobileHeaderMenuOpen(false)
                        setIsFormOpen(true)
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        background: 'var(--surface-3)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-bright)',
                      }}
                    >
                      ✎ Edit Details
                    </button>
                    <button
                      onClick={() => {
                        setMobileHeaderMenuOpen(false)
                        startNewChart()
                      }}
                      className="btn btn-primary btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        background: 'var(--gold-faint)',
                        color: 'var(--text-gold)',
                        border: '1px solid var(--gold)',
                      }}
                    >
                      + New Chart
                    </button>
                  </div>
                </>
              )}

              <div className="chart-actions-compact" style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {status === 'authenticated' && (
                    <button onClick={() => handleSave('regular')} disabled={saving || saveDone} className={`btn ${saveDone ? 'btn-ghost' : 'btn-primary'} btn-sm`}>
                      {saving ? '…' : saveDone ? '✓' : isSavedChart ? 'Update' : '+ Save'}
                    </button>
                  )}
                  {status === 'authenticated' && (
                    <Link href="/my/charts" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      My Charts
                    </Link>
                  )}
                  {status === 'authenticated' && userPlan === 'platinum' && (
                    <button onClick={handleSaveToCRM} disabled={crmSaving || crmDone} className={`btn ${crmDone ? 'btn-ghost' : 'btn-secondary'} btn-sm`}
                      style={{ borderColor: 'var(--gold)', color: crmDone ? 'var(--text-muted)' : 'var(--gold)' }}>
                      {crmSaving ? '…' : crmDone ? '✓ CRM' : 'CRM'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleCopyShareLink()}
                    className={`btn btn-secondary btn-sm`}
                    title={shareCopied ? 'Copied!' : 'Copy link — free, no login required'}
                    aria-label={shareCopied ? 'Link copied' : 'Copy link to this chart'}
                  >
                    {shareCopied ? '✓' : <ShareLinkIcon />}
                  </button>
                  <ExportPdfButton chart={chart} compact />
                  <EmailChartButton chart={chart} compact />
                  <button onClick={() => setIsFormOpen(true)} className="btn btn-secondary btn-sm">✎</button>
                  <button onClick={startNewChart} className="btn btn-primary btn-sm">+ New</button>
              </div>
            </div>

            {activeTab === 'dashboard' && (
              <MajorKundaliStrip chart={chart} todayPanchang={todayPanchang} />
            )}
           
            {/* ── Full-width workspaces (replaces two-column layout) ── */}
            {isFullWidthChartTab(activeTab) && (
              <div
                className={`${isFlushPaddingChartTab(activeTab) ? '' : 'panel'} fade-up`}
                style={{ padding: isFlushPaddingChartTab(activeTab) ? '0' : '0.65rem', width: '100%' }}
              >
                {activeTab === 'planets' ? (
                    <PlanetsWorkspace chart={chart} />
                  ) : activeTab === 'house' ? (
                    <HousePanel chart={chart} />
                ) : activeTab === 'interpretation' ? (
                  <InterpretationPanel interpretation={chart.interpretation} />
                ) : activeTab === 'kp-stellar' ? (
                  <KPStellarPanel chart={chart} />
                ) : (
                  <VarshaphalPanel natalChart={chart} />
                )}
              </div>
            )}

             {/* Responsive: Dominant CHART | Tab Analysis — hidden when full-width workspace active */}
             {!isFullWidthChartTab(activeTab) && <div className="chart-layout-grid">
               {/* LEFT: Dominant chart area (Primary Focus) */}
               <div style={{ 
                 flex: '1 1 460px', 
                 minWidth: 'min(100%, 380px)', 
                 display: 'flex', 
                 flexDirection: 'column', 
                 gap: '0.75rem',
                 order: 1
               }}>
                  <TransitOverlay natalChart={chart} onTransitLoad={setTransitGrahas} />
                  <VargaSwitcher
                     vargas={chart.vargas}
                     vargaLagnas={chart.vargaLagnas ?? {}}
                     ascRashi={chart.lagnas.ascRashi}
                     lagnas={chart.lagnas}
                     arudhas={chart.arudhas}
                     userPlan={userPlan}
                     moonNakIndex={moonNakIndex}
                     tithiNumber={tithiNumber}
                     varaNumber={varaNumber}
                     onActiveVargaChange={setActiveVarga}
                     mobileSelectedVarga={activeVarga}
                     onMobileSelectedVargaChange={setActiveVarga}
                     hideMobileSelector={isMobile}
                     transitGrahas={transitGrahas ?? undefined}
                     chart={chart}
                     transitMoonLon={todayPanchang?.moonLongitudeSidereal}
                  />

                  {/* ── MOBILE DASHBOARD CONTENT ─────────────────────── */}
                  {activeTab === 'dashboard' && isMobile && (
                    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: mobileDashTab === 'strengths' ? '9rem' : '6rem' }}>

                      {/* ── Tab content ── */}
                      {mobileDashTab === 'astro' && (
                        <PanelShell title="Astro Details" padding="sm">
                          <AstroDetailsPanel chart={chart} />
                        </PanelShell>
                      )}

                      {mobileDashTab === 'planetary' && (
                        <div className="panel">
                          <div className="panel-header">
                            <span>Planetary Details</span>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', fontFamily: 'var(--font-body)' }} onClick={() => setExpandGraha(!expandGraha)}>
                              {expandGraha ? '▴ Less' : '▾ More'}
                            </button>
                          </div>
                          <div style={{ padding: '0.4rem 0' }}>
                            <GrahaTable
                              grahas={chart.grahas} vargas={chart.vargas} vargaLagnas={chart.vargaLagnas}
                              lagnas={chart.lagnas} upagrahas={chart.upagrahas}
                              activeVarga={activeVarga} onVargaChange={setActiveVarga} 
                              arudhas={chart.arudhas} limited={!expandGraha}
                            />
                          </div>
                        </div>
                      )}

                      {mobileDashTab === 'dashas' && (
                        <div className="panel">
                          <div className="panel-header">
                            <span>Dasha Timeline</span>
                            <select value={dashaSystem} onChange={(e) => setDashaSystem(e.target.value as any)}
                              style={{ padding: '0.15rem 0.35rem', fontSize: '0.62rem', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-soft)', borderRadius: '3px', fontFamily: 'inherit' }}>
                              <option value="vimshottari">Vimshottari</option>
                              <option value="yogini">Yogini</option>
                              <option value="chara">Chara (K.N. Rao)</option>
                              <option value="chara_fe">Chara (Rangacharya FE)</option>
                              <option value="mandook">Mandook (K.N. Rao)</option>
                              <option value="sthir">Sthir</option>
                              <option value="ashtottari">Ashtottari</option>
                            </select>
                          </div>
                          <div style={{ padding: '0.4rem 0.55rem' }}>
                            {(() => {
                              if (dashaSystem === 'vimshottari') {
                                return (
                                  <VimshottariDashaBlock
                                    nodes={vimshottariNodes}
                                    birthDate={new Date(chart.meta.birthDate)}
                                    tara={vimshottariTara}
                                    tribhagi={vimshottariTribhagi}
                                    userPlan={userPlan}
                                    onTara={setVimshottariTara}
                                    onTribhagi={setVimshottariTribhagi}
                                  />
                                )
                              }
                              const nodes = chart.dashas[dashaSystem] ?? []
                              if (!nodes?.length) return <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Data unavailable.</p>
                              return <DashaTree nodes={nodes} birthDate={new Date(chart.meta.birthDate)} />
                            })()}
                          </div>
                        </div>
                      )}

                      {mobileDashTab === 'today' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div className="panel">
                            <div className="panel-header"><span>Cosmic Weather</span></div>
                            <div style={{ padding: '0.4rem 0.55rem' }}>
                              <PersonalDayCard
                                birthMoonNakIdx={chart.panchang.nakshatra.index}
                                birthMoonName={chart.panchang.nakshatra.name}
                                latitude={chart.meta.latitude} longitude={chart.meta.longitude}
                                timezone={chart.meta.timezone} todayPanchang={todayPanchang}
                                birthDate={chart.meta.birthDate}
                              />
                            </div>
                          </div>
                          <div className="panel">
                            <div className="panel-header"><span>Active Houses</span></div>
                            <div style={{ padding: '0.4rem 0.55rem' }}>
                              <ActiveHousesCard chart={chart} transitMoonLon={todayPanchang?.moonLongitudeSidereal} />
                            </div>
                          </div>
                          <div className="panel">
                            <div className="panel-header"><span>Daily Suitability</span></div>
                            <div style={{ padding: '0.4rem 0.55rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                              {[
                                { label: 'Spiritual', rating: 95, color: 'var(--teal)' },
                                { label: 'Wellness',  rating: 82, color: 'var(--teal)' },
                                { label: 'Learning',  rating: 78, color: 'var(--gold)' },
                                { label: 'Business',  rating: 45, color: 'var(--rose)' },
                                { label: 'Travel',    rating: 30, color: 'var(--rose)' },
                                { label: 'Property',  rating: 15, color: 'var(--rose)' },
                              ].map((act) => (
                                <div key={act.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{act.label}</span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: act.color, fontFamily: 'var(--font-mono)' }}>{act.rating}%</span>
                                  </div>
                                  <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${act.rating}%`, background: act.color }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {mobileDashTab === 'panchang' && (
                        <div className="panel">
                          <div className="panel-header"><span>Natal Panchang</span></div>
                          <div style={{ padding: '0.4rem 0.55rem' }}><NatalPanchangPanel p={chart.panchang} /></div>
                        </div>
                      )}

                      {mobileDashTab === 'strengths' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div className="panel">
                            <div style={{ padding: '0.4rem 0.55rem' }}>
                              {mobileStrengthTab === 'shadbala' && (
                                chart.shadbala ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <ShadbalaTable shadbala={chart.shadbala} preferClassicCharts={true} />
                                  </div>
                                ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Unavailable.</p>
                              )}
                              {mobileStrengthTab === 'bhava' && (
                                chart.bhavaBala ? <BhavaBalaTable bhavaBala={chart.bhavaBala} chart={chart} />
                                  : <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Unavailable.</p>
                              )}
                              {mobileStrengthTab === 'vimsopaka' && (
                                chart.vimsopaka ? <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} userPlan={userPlan} />
                                  : <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Unavailable.</p>
                              )}
                              {mobileStrengthTab === 'ashtakavarga' && (
                                chart.ashtakavarga
                                  ? <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}><AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} transitGrahas={transitGrahas ?? chart.grahas} ayanamsha={chart.meta.settings.ayanamsha} grahas={chart.grahas} janmaNakshatraIndex={chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex} dashaLord={getCurrentMahaDashaLord(chart) ?? undefined} /></div>
                                  : <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Unavailable.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {mobileDashTab === 'yogas' && (
                        <div className="panel">
                          <div className="panel-header"><span>Graha Yogas</span></div>
                          <div style={{ padding: '0.4rem 0.55rem' }}>
                            {chart.yogas ? <YogaList yogas={chart.yogas} /> : <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Unavailable.</p>}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Bottom tab bar rendered via portal — see below */}

                  {activeTab === 'dashboard' && !isMobile && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {leftDashboardCards.map((cardId) => (
                        <div key={cardId} {...makeDesktopCardContainerProps(cardId)}>
                          {renderDesktopDashboardCard(cardId, chart)}
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               {/* RIGHT: Active Tab Content (Sidebar Analysis) — hidden on mobile dashboard */}
              {!(isMobile && activeTab === 'dashboard') && showSecondaryAnalysisColumn && (
               <div className="sticky-desktop" style={{ 
                 flex: `1 1 420px`, 
                 minWidth: `min(100%, 360px)`,
                 display: 'flex', flexDirection: 'column', 
                 gap: '0.75rem', 
                 order: 2 
               }}>
                  {activeTab === 'dashboard' && !isMobile && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {rightDashboardCards.map((cardId) => (
                        <div key={cardId} {...makeDesktopCardContainerProps(cardId)}>
                          {renderDesktopDashboardCard(cardId, chart)}
                        </div>
                      ))}
                    </div>
                  )}


                  {activeTab === 'dasha' && (
                     <div className="panel fade-up">
                       <div className="panel-header">
                         <span>Dasha Timeline</span>
                        <select
                          value={dashaSystem}
                          onChange={(e) => setDashaSystem(e.target.value as any)}
                          style={{
                            padding: '0.15rem 0.35rem',
                            fontSize: '0.62rem',
                            background: 'var(--surface-3)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-soft)',
                            borderRadius: '3px',
                            fontFamily: 'inherit',
                          }}
                        >
                          <option value="vimshottari">Vimshottari</option>
                          <option value="yogini">Yogini</option>
                          <option value="chara">Chara (K.N. Rao)</option>
                          <option value="chara_fe">Chara (Rangacharya FE)</option>
                          <option value="mandook">Mandook (K.N. Rao)</option>
                          <option value="sthir">Sthir</option>
                          <option value="ashtottari">Ashtottari</option>
                        </select>
                       </div>
                       <div style={{ padding: '0.5rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         {dashaSystem === 'vimshottari' && (
                           <VimshottariDashaBlock
                             nodes={vimshottariNodes}
                             birthDate={new Date(chart.meta.birthDate)}
                             tara={vimshottariTara}
                             tribhagi={vimshottariTribhagi}
                             userPlan={userPlan}
                             onTara={setVimshottariTara}
                             onTribhagi={setVimshottariTribhagi}
                           />
                         )}
                         {dashaSystem === 'ashtottari' && (chart.dashas.ashtottari?.length ? <DashaTree nodes={chart.dashas.ashtottari} birthDate={new Date(chart.meta.birthDate)} /> : <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', padding:'0.75rem', textAlign:'center' }}>Ashtottari computation required.</div>)}
                         {dashaSystem === 'yogini' && (chart.dashas.yogini?.length ? <DashaTree nodes={chart.dashas.yogini} birthDate={new Date(chart.meta.birthDate)} /> : <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', padding:'0.75rem', textAlign:'center' }}>Yogini computation required.</div>)}
                         {dashaSystem === 'chara' && (chart.dashas.chara?.length ? <DashaTree nodes={chart.dashas.chara} birthDate={new Date(chart.meta.birthDate)} /> : <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', padding:'0.75rem', textAlign:'center' }}>Chara computation required.</div>)}
                        {dashaSystem === 'chara_fe' && (chart.dashas.chara_fe?.length ? <DashaTree nodes={chart.dashas.chara_fe} birthDate={new Date(chart.meta.birthDate)} /> : <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', padding:'0.75rem', textAlign:'center' }}>Chara FE computation required.</div>)}
                        {dashaSystem === 'mandook' && (chart.dashas.mandook?.length ? <DashaTree nodes={chart.dashas.mandook} birthDate={new Date(chart.meta.birthDate)} /> : <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', padding:'0.75rem', textAlign:'center' }}>Mandook computation required.</div>)}
                        {dashaSystem === 'sthir' && (chart.dashas.sthir?.length ? <DashaTree nodes={chart.dashas.sthir} birthDate={new Date(chart.meta.birthDate)} /> : <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', padding:'0.75rem', textAlign:'center' }}>Sthir computation required.</div>)}
                       </div>
                     </div>
                  )}

                  {activeTab === 'panchang' && (
                     <div className="panel fade-up">
                        <div className="panel-header"><span>Natal Panchang</span></div>
                        <div style={{ padding: '0.5rem 0.65rem' }}><NatalPanchangPanel p={chart.panchang} /></div>
                     </div>
                  )}

                  {activeTab === 'astro-details' && (
                    <div className="panel fade-up" style={{ flexShrink: 0 }}>
                      <div className="panel-header"><span>Astro Details</span></div>
                      <div style={{ padding: '0.5rem 0.65rem' }}><AstroDetailsPanel chart={chart} /></div>
                    </div>
                  )}

                  {activeTab === 'yogas' && (
                     <div className="panel fade-up">
                        <div className="panel-header"><span>Graha Yogas</span></div>
                        <div style={{ padding: '0.5rem 0.65rem' }}>
                          {chart.yogas ? <YogaList yogas={chart.yogas} /> : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem', margin: 0 }}>Recalculate chart to see Yogas.</p>}
                        </div>
                     </div>
                  )}

                  {activeTab === 'arudhas' && (
                     <div className="panel fade-up">
                        <div className="panel-header"><span>Bhava Arudhas</span></div>
                        <div style={{ padding: '0.5rem 0.65rem' }}><ArudhaPanel arudhas={chart.arudhas} arudhasBphs={chart.arudhasBphs} /></div>
                     </div>
                  )}

                  {activeTab === 'ashtakavarga' && (
                    <div className="panel fade-up">
                      <div className="panel-header"><span>Sarvashtakvarga</span></div>
                      <div style={{ padding: '0.5rem 0.65rem' }}>
                        {!chart.ashtakavarga ? (
                          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, fontSize: '0.78rem' }}>Recalculate chart to see Ashtakavarga.</p>
                        ) : dashboardAshtakSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                            <DashboardSavChart
                              sav={chart.ashtakavarga.sav}
                              ascRashi={chart.lagnas.ascRashi ?? 1}
                              size={280}
                            />
                            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.35rem' }}>
                              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.35rem 0.45rem' }}>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>SAV Total</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-gold)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                  {dashboardAshtakSummary.savTotal}
                                  <span style={{ marginLeft: 4, fontSize: '0.58rem', fontWeight: 600, color: 'var(--text-muted)' }}>{dashboardAshtakSummary.avg}/sign</span>
                                </div>
                              </div>
                              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.35rem 0.45rem' }}>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Strong Sign</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--teal)', fontWeight: 800 }}>
                                  {RASHI_SHORT[dashboardAshtakSummary.highest.sign]}
                                  <span style={{ marginLeft: 4, fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>({dashboardAshtakSummary.highest.val})</span>
                                </div>
                              </div>
                              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.35rem 0.45rem', gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Weak Sign</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--rose)', fontWeight: 800 }}>
                                  {RASHI_SHORT[dashboardAshtakSummary.lowest.sign]}
                                  <span style={{ marginLeft: 4, fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>({dashboardAshtakSummary.lowest.val})</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {activeTab === 'shadbala' && (
                    <div className="panel fade-up">
                      <div className="panel-header"><span>Shadbala</span></div>
                      <div style={{ padding: '0.5rem 0.65rem' }}>
                        {chart.shadbala
                          ? <ShadbalaTable shadbala={chart.shadbala} hideDetails={true} preferClassicCharts={true} variant="widget" />
                          : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, fontSize: '0.78rem' }}>Shadbala data unavailable.</p>}
                      </div>
                    </div>
                  )}

                   {activeTab === 'bhava-bala' && (
                    <div className="panel fade-up">
                      <div className="panel-header"><span>Bhava Bala</span></div>
                      <div style={{ padding: '0.5rem 0.65rem' }}>
                        {chart.bhavaBala ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--teal)' }}>{chart.bhavaBala.houses[chart.bhavaBala.strongestHouse].totalRupa.toFixed(1)} R</div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Strongest H{chart.bhavaBala.strongestHouse}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--rose)' }}>{chart.bhavaBala.houses[chart.bhavaBala.weakestHouse].totalRupa.toFixed(1)} R</div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Weakest H{chart.bhavaBala.weakestHouse}</div>
                            </div>
                          </div>
                        ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, fontSize: '0.78rem' }}>Bhava Bala data unavailable.</p>}
                      </div>
                    </div>
                  )}

                  {activeTab === 'vimsopaka' && (
                    <div className="panel fade-up">
                      <div className="panel-header"><span>Vimsopaka</span></div>
                      <div style={{ padding: '0.5rem 0.65rem' }}>
                        {chart.vimsopaka ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-gold)' }}>{chart.vimsopaka.planets[chart.vimsopaka.strongest]?.shodasvarga.toFixed(1)}</div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Strongest: {chart.vimsopaka.strongest}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--rose)' }}>{chart.vimsopaka.planets[chart.vimsopaka.weakest]?.shodasvarga.toFixed(1)}</div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Weakest: {chart.vimsopaka.weakest}</div>
                            </div>
                          </div>
                        ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, fontSize: '0.78rem' }}>Vimsopaka data unavailable.</p>}
                      </div>
                    </div>
                  )}
                </div>
               )}
             </div>}  {/* end chart-layout-grid conditional */}

              {/* BOTTOM: Full-width all dashas below chart + sidebar */}
              {activeTab === 'dasha' && (
                <div className="panel fade-up" style={{ marginTop: '0.75rem' }}>
                  <div className="panel-header">
                    <span>All Dashas Available</span>
                    <ExportPdfButton
                      chart={chart}
                      compact
                      label="Dasha PDF"
                      title="Download Dasha PDF (includes user details, D1, D9, all dashas)"
                    />
                  </div>
                  <div style={{ padding: '0.5rem 0.65rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {([
                      { id: 'vimshottari', label: vimshottariTribhagi ? 'Vimshottari (Tribhagi)' : 'Vimshottari', nodes: vimshottariNodes },
                      { id: 'yogini', label: 'Yogini', nodes: chart.dashas.yogini ?? [] },
                      { id: 'chara', label: 'Chara (K.N. Rao)', nodes: chart.dashas.chara ?? [] },
                      { id: 'chara_fe', label: 'Chara (Rangacharya FE)', nodes: chart.dashas.chara_fe ?? [] },
                      { id: 'mandook', label: 'Mandook (K.N. Rao)', nodes: chart.dashas.mandook ?? [] },
                      { id: 'sthir', label: 'Sthir', nodes: chart.dashas.sthir ?? [] },
                      { id: 'ashtottari', label: 'Ashtottari', nodes: chart.dashas.ashtottari ?? [] },
                    ] as const).map((system) => (
                      <div
                        key={system.id}
                        style={{
                          border: '1px solid var(--border-soft)',
                          borderRadius: 8,
                          background: 'var(--surface-1)',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ padding: '0.4rem 0.55rem', borderBottom: '1px solid var(--border-soft)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {system.label}
                        </div>
                        <div style={{ padding: '0.4rem 0.45rem' }}>
                          {system.nodes.length > 0 ? (
                            <DashaTree
                              nodes={system.nodes}
                              birthDate={new Date(chart.meta.birthDate)}
                              showNakshatra={system.id === 'vimshottari' && vimshottariTribhagi}
                            />
                          ) : (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.55rem', textAlign: 'center' }}>
                              Not available for this chart.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

               {/* BOTTOM: Full-width Shadbala below charts */}
               {activeTab === 'shadbala' && (
                 <div className="panel fade-up" style={{ marginTop: '0.75rem' }}>
                   <div className="panel-header"><span>Shadbala Strength</span></div>
                   <div style={{ padding: '0.5rem 0.65rem' }}>
                     {chart.shadbala ? <ShadbalaTable shadbala={chart.shadbala} preferClassicCharts={true} /> : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>Recalculate chart to see Shadbala.</div>}
                   </div>
                 </div>
               )}

               {/* BOTTOM: Full-width Bhava Bala below charts */}
               {activeTab === 'bhava-bala' && (
                 <div className="panel fade-up" style={{ marginTop: '0.75rem' }}>
                   <div className="panel-header"><span>Bhava Bala — House Strength</span></div>
                   <div style={{ padding: '0.5rem 0.65rem' }}>
                     {chart.bhavaBala ? <BhavaBalaTable bhavaBala={chart.bhavaBala} chart={chart} /> : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>Recalculate chart to see Bhava Bala.</div>}
                   </div>
                 </div>
               )}

                {/* BOTTOM: Full-width Ashtakavarga below charts */}
                {activeTab === 'ashtakavarga' && (
                  <div className="panel fade-up" style={{ marginTop: '0.75rem' }}>
                    <div className="panel-header"><span>Ashtakavarga Intelligence</span></div>
                    <div style={{ padding: '0.5rem 0.65rem' }}>
                     {chart.ashtakavarga ? <AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} transitGrahas={transitGrahas ?? chart.grahas} ayanamsha={chart.meta.settings.ayanamsha} grahas={chart.grahas} janmaNakshatraIndex={chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex} dashaLord={getCurrentMahaDashaLord(chart) ?? undefined} /> : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>Recalculate chart to see Ashtakavarga.</div>}
                    </div>
                  </div>
                )}

                {/* BOTTOM: Full-width Vimsopaka below charts */}
                {activeTab === 'vimsopaka' && (
                  <div className="panel fade-up" style={{ marginTop: '0.75rem' }}>
                    <div className="panel-header"><span>Vimsopaka Bala</span></div>
                    {chart.vimsopaka ? <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} userPlan={userPlan} /> : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.75rem', fontSize: '0.78rem' }}>Vimsopaka data unavailable — recalculate chart.</div>}
                  </div>
                )}

                {/* BOTTOM: Dashboard Extended Details */}
                {activeTab === 'dashboard' && (
                  <div style={{
                    flex: '1 1 100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                    gap: '0.6rem',
                    marginTop: '0.6rem',
                    order: 3,
                    alignItems: 'start'
                  }}>

                    {/* ── Ashtakavarga ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandAv ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Ashtakavarga</span>
                        {chart.ashtakavarga && <button type="button" onClick={() => setDashExpandAv(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandAv ? '▴' : '▾ Full'}</button>}
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {!chart.ashtakavarga ? <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Unavailable.</p>
                        : dashExpandAv ? <AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} transitGrahas={transitGrahas ?? chart.grahas} ayanamsha={chart.meta.settings.ayanamsha} grahas={chart.grahas} janmaNakshatraIndex={chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex} dashaLord={getCurrentMahaDashaLord(chart) ?? undefined} />
                        : dashboardAshtakSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr auto',
                                gap: '0.6rem',
                                alignItems: 'center',
                                padding: '0.35rem',
                                border: '1px solid var(--border-soft)',
                                borderRadius: 'var(--r-sm)',
                                background: 'var(--surface-1)',
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                  Sarva-Ashtakavarga
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-gold)', fontFamily: 'var(--font-mono)' }}>
                                  {dashboardAshtakSummary.savTotal}
                                  <span style={{ marginLeft: 4, fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)' }}>total · {dashboardAshtakSummary.avg}/sign</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.14rem', fontSize: '0.62rem' }}>
                                  <span style={{ color: 'var(--teal)' }}>
                                    Strongest: {RASHI_SHORT[dashboardAshtakSummary.highest.sign]} ({dashboardAshtakSummary.highest.val})
                                  </span>
                                  <span style={{ color: 'var(--rose)' }}>
                                    Weakest: {RASHI_SHORT[dashboardAshtakSummary.lowest.sign]} ({dashboardAshtakSummary.lowest.val})
                                  </span>
                                </div>
                              </div>
                              <div
                                style={{
                                  width: 170,
                                  maxWidth: '42vw',
                                  border: '1px solid var(--border-soft)',
                                  borderRadius: 'var(--r-sm)',
                                  background: 'var(--surface-1)',
                                  padding: '0.2rem',
                                }}
                              >
                                <DashboardSavChart sav={chart.ashtakavarga.sav} ascRashi={chart.lagnas.ascRashi ?? 1} />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(70px, 1fr))', gap: '0.35rem' }}>
                              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.3rem 0.4rem', boxSizing: 'border-box' }}>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>SAV Total</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-gold)', fontWeight: 800 }}>{dashboardAshtakSummary.savTotal}</div>
                              </div>
                              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.3rem 0.4rem', boxSizing: 'border-box' }}>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Strong Sign</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--teal)', fontWeight: 800 }}>{RASHI_SHORT[dashboardAshtakSummary.highest.sign]}</div>
                              </div>
                              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.3rem 0.4rem', boxSizing: 'border-box' }}>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Weak Sign</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--rose)', fontWeight: 800 }}>{RASHI_SHORT[dashboardAshtakSummary.lowest.sign]}</div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* ── Shadbala ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandShad ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Shadbala</span>
                        {chart.shadbala && <button type="button" onClick={() => setDashExpandShad(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandShad ? '▴' : '▾ Full'}</button>}
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {!chart.shadbala ? <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Unavailable.</p>
                        : dashExpandShad ? <ShadbalaTable shadbala={chart.shadbala} preferClassicCharts={true} />
                        : dashboardShadbalaSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(70px, 1fr))', gap: '0.35rem' }}>
                              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.3rem 0.4rem', boxSizing: 'border-box' }}>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Strongest</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--teal)', fontWeight: 800 }}>{dashboardShadbalaSummary.strongestLabel}</div>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{dashboardShadbalaSummary.strongTotal}R</div>
                              </div>
                              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.3rem 0.4rem', boxSizing: 'border-box' }}>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Weakest</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--rose)', fontWeight: 800 }}>{dashboardShadbalaSummary.weakestLabel}</div>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{dashboardShadbalaSummary.weakTotal}R</div>
                              </div>
                              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.3rem 0.4rem', boxSizing: 'border-box' }}>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Avg / Spread</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-gold)', fontWeight: 800 }}>{dashboardShadbalaSummary.meanRatio}x</div>
                                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{dashboardShadbalaSummary.spread}R</div>
                              </div>
                            </div>
                            {dashboardShadbalaSummary.top5.map((row, idx) => {
                              const width = Math.max(8, Math.min(100, (row.total / dashboardShadbalaSummary.maxTotal) * 100))
                              const barColor = idx === 0 ? 'var(--teal)' : idx === 1 ? 'var(--text-gold)' : 'var(--accent)'
                              const badgeBg = row.ratio >= 1 ? 'rgba(78,205,196,0.12)' : 'rgba(224,123,142,0.12)'
                              const badgeColor = row.ratio >= 1 ? 'var(--teal)' : 'var(--rose)'
                              return (
                                <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', width: '4.4rem', flexShrink: 0 }}>#{idx+1} {row.name}</span>
                                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${width}%`, background: barColor, borderRadius: 2 }} />
                                  </div>
                                  <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '2.3rem', textAlign: 'right', flexShrink: 0 }}>{row.total.toFixed(1)}R</span>
                                  <span style={{ fontSize: '0.54rem', color: badgeColor, background: badgeBg, border: `1px solid ${badgeColor}33`, borderRadius: 4, padding: '1px 4px', width: '2.1rem', textAlign: 'center', flexShrink: 0 }}>
                                    {(row.ratio * 100).toFixed(0)}%
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* ── Vimsopaka ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandVim ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Vimsopaka (16 Vargas)</span>
                        {chart.vimsopaka && <button type="button" onClick={() => setDashExpandVim(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandVim ? '▴' : '▾ Full'}</button>}
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {!chart.vimsopaka ? <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Unavailable.</p>
                        : dashExpandVim ? <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} userPlan={userPlan} />
                        : dashboardVimsopakaSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.68rem', fontWeight: 700, alignItems: 'center' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>↑</span> 
                                <span style={{ color: 'var(--teal)' }}>{dashboardVimsopakaSummary.strongest}</span> 
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.62rem' }}>{dashboardVimsopakaSummary.strongScore}/20</span>
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>↓</span> 
                                <span style={{ color: 'var(--rose)' }}>{dashboardVimsopakaSummary.weakest}</span> 
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.62rem' }}>{dashboardVimsopakaSummary.weakScore}/20</span>
                              </span>
                              {dashboardVimsopakaSummary.avg && (
                                <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: 'auto' }}>
                                  avg {dashboardVimsopakaSummary.avg}
                                </span>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.1rem' }}>
                              {dashboardVimsopakaSummary.top3.map((row, idx) => {
                                const score = typeof row.score === 'number' ? row.score : 0
                                const pct = Math.max(8, Math.min(100, (score / 20) * 100))
                                const barColor = idx === 0 ? 'var(--teal)' : 'var(--gold)'
                                
                                return (
                                  <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, width: '4.2rem', flexShrink: 0 }}>
                                      #{idx + 1} {GRAHA_NAMES[row.id as GrahaId] ?? row.id}
                                    </span>
                                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                                      <div style={{ 
                                        height: '100%', 
                                        width: `${pct}%`, 
                                        background: barColor, 
                                        borderRadius: 2,
                                        boxShadow: idx === 0 ? '0 0 10px rgba(78,205,196,0.3)' : 'none'
                                      }} />
                                    </div>
                                    <span style={{ 
                                      fontSize: '0.65rem', 
                                      color: 'var(--text-secondary)', 
                                      fontFamily: 'var(--font-mono)', 
                                      fontWeight: 600,
                                      width: '2.2rem', 
                                      textAlign: 'right', 
                                      flexShrink: 0 
                                    }}>
                                      {score.toFixed(1)}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* ── Bhava Bala ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandBhava ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Bhava Bala</span>
                        {chart.bhavaBala && <button type="button" onClick={() => setDashExpandBhava(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandBhava ? '▴' : '▾ Full'}</button>}
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {!chart.bhavaBala ? <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Unavailable.</p>
                        : dashExpandBhava ? <BhavaBalaTable bhavaBala={chart.bhavaBala} chart={chart} />
                        : dashboardBhavaBalaSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.68rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                              <span>⬆ <span style={{ color: 'var(--teal)' }}>H{dashboardBhavaBalaSummary.strongestHouse}</span> {dashboardBhavaBalaSummary.strongTotal}R</span>
                              <span>⬇ <span style={{ color: 'var(--rose)' }}>H{dashboardBhavaBalaSummary.weakestHouse}</span> {dashboardBhavaBalaSummary.weakTotal}R</span>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>avg {dashboardBhavaBalaSummary.avgRupa}R</span>
                            </div>
                            {/* House strength mini-bars for all 12 */}
                            {chart.bhavaBala.houses && (
                              <div style={{ 
                                display: 'flex', 
                                gap: '3px', 
                                alignItems: 'flex-end', 
                                height: 32, 
                                background: 'rgba(0,0,0,0.02)', 
                                padding: '2px 4px', 
                                borderRadius: '4px',
                                border: '1px solid var(--border-soft)'
                              }}>
                                {Array.from({ length: 12 }, (_, i) => {
                                  const h = chart.bhavaBala!.houses[i + 1]
                                  const val = h?.totalRupa ?? 0
                                  const allVals = Object.values(chart.bhavaBala!.houses).map(x => x.totalRupa)
                                  const maxVal = Math.max(...allVals)
                                  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
                                  const isS = i + 1 === dashboardBhavaBalaSummary!.strongestHouse
                                  const isW = i + 1 === dashboardBhavaBalaSummary!.weakestHouse
                                  
                                  return (
                                    <div key={i} title={`H${i+1}: ${val.toFixed(1)}R`} style={{ 
                                      flex: 1, 
                                      height: `${Math.max(10, pct)}%`, 
                                      background: isS ? 'var(--teal)' : isW ? 'var(--rose)' : 'var(--border-bright)', 
                                      borderRadius: '1px', 
                                      alignSelf: 'flex-end',
                                      transition: 'height 0.3s ease',
                                      opacity: isS || isW ? 1 : 0.6
                                    }} />
                                  )
                                })}
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700, padding: '0 2px' }}>
                              <span>H1</span><span>H6</span><span>H12</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* ── Natal Panchang ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandPanchang ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Natal Panchang</span>
                        <button type="button" onClick={() => setDashExpandPanchang(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandPanchang ? '▴' : '▾ Full'}</button>
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {dashExpandPanchang ? (
                          <NatalPanchangPanel p={chart.panchang} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {[
                              { label: 'Vara',     value: `${chart.panchang.vara.name} · lord ${GRAHA_NAMES[chart.panchang.vara.lord as GrahaId] ?? chart.panchang.vara.lord}` },
                              { label: 'Tithi',    value: `${chart.panchang.tithi.name} (${chart.panchang.tithi.number}/30) · ${chart.panchang.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'}` },
                              { label: 'Nakshatra', value: `${chart.panchang.nakshatra.name} · Pada ${chart.panchang.nakshatra.pada}` },
                              { label: 'Yoga',     value: chart.panchang.yoga.name },
                              { label: 'Karana',  value: chart.panchang.karana.name },
                              { label: 'Sunrise',  value: new Date(chart.panchang.sunrise).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
                            ].map(({ label, value }) => (
                              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.18rem 0', borderBottom: '1px solid var(--border-soft)', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-primary)', textAlign: 'right' }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Graha Yogas ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandYogas ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Graha Yogas</span>
                        {chart.yogas && <button type="button" onClick={() => setDashExpandYogas(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandYogas ? '▴' : '▾ Full'}</button>}
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {!chart.yogas ? <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Unavailable.</p>
                        : dashExpandYogas ? <YogaList yogas={chart.yogas} />
                        : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {/* Summary line */}
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                              {chart.yogas.length} yoga{chart.yogas.length !== 1 ? 's' : ''} · {chart.yogas.filter((y: any) => y.strength === 'strong' || y.strength === 'Strong').length} strong
                            </div>
                            {/* Compact yoga list */}
                            {chart.yogas.slice(0, 6).map((yoga: any, idx: number) => {
                              const isStrong = yoga.strength === 'strong' || yoga.strength === 'Strong'
                              return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', padding: '0.15rem 0', borderBottom: '1px solid var(--border-soft)' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {yoga.name}
                                  </span>
                                  {isStrong && <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0 4px', borderRadius: 2, background: 'rgba(78,205,196,0.1)', color: 'var(--teal)', border: '1px solid rgba(78,205,196,0.3)', flexShrink: 0 }}>Strong</span>}
                                  {yoga.category && <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', flexShrink: 0 }}>{yoga.category}</span>}
                                </div>
                              )
                            })}
                            {chart.yogas.length > 6 && (
                              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>+{chart.yogas.length - 6} more — click ▾ Full</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                 </div>
               )}
             </div>
      ) : (
        <div key="home-landing" className="landing-page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          {!isFormOpen && (
            <LandingShell>
              <LandingPremiumHero
                trackLandingCta={trackLandingCta}
                onOpenAstrology={openAstrologyApp}
                onOpenMyChart={openMyDefaultChart}
                showMyChart={status === 'authenticated' && !!defaultChart}
                showMyCharts={status === 'authenticated'}
                withChartGate={openSectionWithChartGate}
              />

              <LandingReveal as="section" className="landing-section-row landing-section-row--gold landing-major-sections">
                <div className="landing-section-row-content">
                  <VedicSectionHeader
                    kicker="Explore"
                    title="Every core Vedaansh journey"
                    description="Jump straight to the tool you need."
                    theme="gold"
                  />
                  <div className="landing-major-sections-grid landing-reveal-stagger">
                    {landingMajorSections
                      .filter((section) => section.title !== 'My Charts' || status === 'authenticated')
                      .map((section, idx) => {
                        const IconComponent = iconMap[section.title] || Sparkles;
                        return (
                          <Link
                            key={section.title}
                            href={section.href}
                            onClick={(e) => {
                              trackLandingCta(section.ctaName)
                              openSectionWithChartGate(section.href, e)
                            }}
                            onMouseMove={handleMouseMove}
                            className="landing-major-section-card landing-premium-card"
                            style={{ ['--stagger-i' as string]: idx }}
                          >
                            <div className="card-icon-wrapper">
                              <IconComponent size={20} strokeWidth={2} />
                            </div>
                            <div className="card-body">
                              {section.subtitle && <span className="card-kicker">{section.subtitle}</span>}
                              <span className="stat-value">{section.title}</span>
                              <span className="stat-sub">{section.text}</span>
                            </div>
                            <span className="card-arrow" aria-hidden="true">
                              <ArrowRight size={14} strokeWidth={2.5} />
                            </span>
                          </Link>
                        )
                      })}
                  </div>
                </div>
              </LandingReveal>

              <LandingReveal as="section" className="landing-section-row landing-section-row--gold" delay={60}>
                <div className="landing-section-row-content">
                  <VedicSectionHeader
                    kicker="Why Vedaansh"
                    title="Classical depth with modern clarity"
                    description="Relevant information first — deep tooling always one click away."
                    theme="gold"
                  />
                  <div className="landing-premium-pillars landing-reveal-stagger">
                    {landingWhyVedaansh.map((item, idx) => {
                      const PillarIcon = item.icon;
                      return (
                        <article key={item.title} className="landing-premium-pillar" style={{ ['--stagger-i' as string]: idx }}>
                          <div className="landing-premium-pillar-icon">
                            <PillarIcon size={22} strokeWidth={1.75} />
                          </div>
                          <h4 className="landing-premium-pillar-title">{item.title}</h4>
                          <p className="landing-premium-pillar-desc">{item.detail}</p>
                        </article>
                      )
                    })}
                  </div>
                  <div className="landing-trust-bar">
                    {landingTrustStats.map((stat) => (
                      <div key={stat.label} className="landing-trust-stat">
                        <span className="landing-trust-stat-value">{stat.value}</span>
                        <span className="landing-trust-stat-label">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </LandingReveal>

              <LandingReveal as="section" className="landing-section-row landing-section-row--gold landing-flow-card" delay={80}>
                <div className="landing-section-row-content">
                  <VedicSectionHeader
                    kicker="How it works"
                    title="From birth data to confident direction"
                    theme="gold"
                  />
                  <div className="landing-flow-grid landing-reveal-stagger landing-flow-grid--animated">
                    {landingJourney.map((item, idx) => (
                      <article key={item.step} className="landing-premium-pillar landing-flow-step" style={{ ['--stagger-i' as string]: idx }}>
                        <span className="landing-flow-step-num">{item.step}</span>
                        <h4 className="landing-premium-pillar-title">{item.title}</h4>
                        <p className="landing-premium-pillar-desc">{item.text}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </LandingReveal>

              <LandingVedicDivider />

              <LandingReveal as="section" className="landing-section-row landing-section-row--gold" delay={90}>
                <div className="landing-section-row-content">
                  <VedicSectionHeader
                    kicker="Mobile"
                    title="Install Vedaansh"
                    description="Add to your home screen — works like an app."
                    theme="gold"
                  />
                  <div className="card" style={{ marginTop: '1rem' }}>
                    <PwaInstallGuide compact />
                  </div>
                </div>
              </LandingReveal>

              <LandingReveal delay={100}>
                <AboutPreview onCtaClick={() => trackLandingCta('about_preview_read_more')} />
              </LandingReveal>

              <LandingReveal as="section" id="landing-cta-band" className="landing-cta-band landing-premium-cta" delay={120}>
                <div>
                  <div className="label-caps landing-premium-cta-kicker">Start your journey</div>
                  <h3 className="landing-premium-cta-title">Open your Vedic command center</h3>
                  <p className="landing-premium-cta-desc">
                    Start with your chart, then move into Prashna, Panchang, and calendar planning in one workflow.
                  </p>
                </div>
                <div className="landing-cta-band-actions">
                  <button onClick={() => { trackLandingCta('cta_band_start_now'); openAstrologyApp() }} className="btn btn-primary landing-cta-band-primary">
                    Open Astrology App
                  </button>
                  <Link href="/prashna" onClick={() => trackLandingCta('cta_band_open_prashna')} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                    Open Prashna
                  </Link>
                  <Link href="/install" onClick={() => trackLandingCta('cta_band_install_app')} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                    Install App
                  </Link>
                  {status === 'authenticated' && (
                    <Link href="/my/charts" onClick={() => trackLandingCta('cta_band_my_charts')} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                      My Charts
                    </Link>
                  )}
                </div>
              </LandingReveal>

              <LandingStickyMobileCta
                onClick={() => {
                  trackLandingCta('sticky_mobile_start')
                  openAstrologyApp()
                }}
              />
            </LandingShell>
          )}
        </div>
      )}

      <SiteFooter />

      <ChartFormDrawer open={isFormOpen} onClose={closeDrawer}
        summary={chart ? <ChartSummary chart={chart} /> : undefined}
      >
            {(status === 'unauthenticated' || !fetchingDefault || !!searchParams.get('name') || !!searchParams.get('new')) && (
              <BirthForm
                onResult={(data) => {
                  setChart(data)
                  if (savedChartId) {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('name', data.meta.name)
                    params.set('birthDate', data.meta.birthDate)
                    params.set('birthTime', data.meta.birthTime)
                    params.set('birthPlace', data.meta.birthPlace)
                    params.set('lat', String(data.meta.latitude))
                    params.set('lng', String(data.meta.longitude))
                    params.set('tz', data.meta.timezone)
                    params.set('chartId', savedChartId)
                    router.replace(`?${params.toString()}`, { scroll: false })
                  }
                  setTimeout(() => {
                    setIsFormOpen(false)
                    if (pendingDestination) {
                      const destination = pendingDestination
                      setPendingDestination(null)
                      router.push(destination)
                    }
                  }, 300)
                }}
                onLoading={setLoading}
                onSaveTagsChange={setChartTags}
                initialTags={chartTags}
                savedChartId={savedChartId}
                autoSubmit={!!searchParams.get('name')}
                initialName="Natal Chart"
                initialData={chart ? {
                  name: chart.meta.name,
                  birthDate: chart.meta.birthDate,
                  birthTime: chart.meta.birthTime,
                  birthPlace: chart.meta.birthPlace,
                  latitude: chart.meta.latitude,
                  longitude: chart.meta.longitude,
                  timezone: chart.meta.timezone,
                  gender: chart.meta.gender,
                  settings: { 
                    ...userPrefs, 
                    ...chart.meta.settings,
                    karakaScheme: (chart.meta.settings?.karakaScheme === 8 || userPrefs.karakaScheme === 8) ? 7 : (chart.meta.settings?.karakaScheme || 7)
                  },
                } : (defaultChart ? {
                  ...defaultChart,
                  gender: (defaultChart as any).gender || 'male',
                  settings: {
                    ...defaultChart.settings,
                    karakaScheme: (defaultChart.settings?.karakaScheme === 8) ? 7 : (defaultChart.settings?.karakaScheme || 7)
                  }
                } : undefined)}
              />
            )}
      </ChartFormDrawer>

      <MobileDashboardNav
        showMainNav={showMainDashBottomNav}
        showStrengthSubNav={showStrengthSubNav}
        strengthSubNavStacked={strengthSubNavStacked}
        mobileDashTab={mobileDashTab}
        activeStrengthSubTab={activeStrengthSubTab}
        strengthTabs={MOBILE_STRENGTH_TABS}
        onDashTabChange={(tab) => setMobileDashTab(tab)}
        onStrengthSubTabChange={handleStrengthSubTab}
      />

    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <VedaanshLoader />
       </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
