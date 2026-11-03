'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/DashaInterpretationPanel.tsx
//  Active Vimshottari MD/AD narrative + chart-conditioned flags
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Coins,
  Crown,
  Flower2,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Layers,
  Link2,
  Lock,
  Moon,
  Orbit,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Star,
  Tag,
} from 'lucide-react'
import type {
  AshtakavargaResult,
  DashaNode,
  GrahaData,
  GrahaId,
  Rashi,
  ShadbalaResult,
  UserPlan,
} from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import {
  analyzeVimshottariPeriod,
  type DispositorChain,
  type LifeAreaActivation,
  type LifeAreaId,
  type VimshottariLordSnapshot,
  type VimshottariPeriodAnalysis,
} from '@/lib/engine/dasha/vimshottariAnalysis'
import {
  analyzeDashaGochar,
  type DashaGocharOverlay,
} from '@/lib/engine/dasha/vimshottariGochar'
import {
  buildUpcomingVimshottariTimeline,
  formatShortDate,
  type UpcomingDashaItem,
  type VimshottariUpcomingTimeline,
} from '@/lib/engine/dasha/vimshottariTimeline'
import {
  buildVimshottariAntarInterpretation,
  buildVimshottariPratyantarInterpretation,
  durationMsToYears,
  formatVimshottariDurationYears,
  getVimshottariAntarHint,
  getVimshottariInterpretation,
  isBeneficVimNature,
  isMaleficVimNature,
  VIMSHOTTARI_RESULT_HIERARCHY,
  type VimshottariInterpretation,
  type VimshottariNature,
} from '@/lib/engine/dasha/vimshottariInterpretations'
import {
  getVimshottariAntarScriptures,
  getVimshottariMahaScriptures,
  getVimshottariPratyantarScriptures,
  type ScripturePassage,
} from '@/lib/engine/dasha/vimshottariScriptures'
import {
  computeDashaLordRemedies,
  REMEDY_CORE_PRINCIPLE,
  type DashaLordRemedy,
  type RemedyNeed,
} from '@/lib/engine/planetaryRemedies'
import type { TransitPosition } from '@/lib/engine/transits'
import { GRAHA_DISPLAY_COLOR } from '@/lib/engine/grahaDisplayColors'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { cn } from '@/lib/ui/cn'
import { Button } from '@/components/ui/primitives/Button'
import { TattvaDashaOverlayStrip } from '@/components/ui/TattvaPredictionPanel'
import { analyzeTattvaDashaOverlay } from '@/lib/engine/tattvaPrediction'
import styles from './DashaInterpretationPanel.module.css'

const DASHA_EVENT_LABELS = [
  'Job change',
  'Move / home',
  'Relationship',
  'Health',
  'Travel',
  'Finance',
  'Other',
] as const

const LEVEL_NAMES = ['Mahadasha', 'Antardasha', 'Pratyantardasha'] as const

type Tone = 'supportive' | 'caution' | 'mixed' | 'neutral'
type TabId = 'reading' | 'remedies' | 'areas' | 'timeline' | 'gochar' | 'delivery'

const TABS: { id: TabId; label: string; icon: React.ElementType; gold: boolean }[] = [
  { id: 'reading', label: 'Reading', icon: ScrollText, gold: false },
  { id: 'remedies', label: 'Remedies', icon: Flower2, gold: false },
  { id: 'areas', label: 'Life areas', icon: Layers, gold: true },
  { id: 'timeline', label: 'Timeline', icon: CalendarClock, gold: true },
  { id: 'gochar', label: 'Gochar', icon: Orbit, gold: true },
  { id: 'delivery', label: 'Delivery', icon: Link2, gold: true },
]

const LIFE_AREA_ICON: Record<LifeAreaId, React.ElementType> = {
  career: Briefcase,
  money: Coins,
  home: Home,
  relationship: Heart,
  health: HeartPulse,
  learning: GraduationCap,
}

export interface VimshottariInterpretationPanelProps {
  nodes: DashaNode[]
  grahas: GrahaData[]
  ascRashi: Rashi
  shadbala?: ShadbalaResult | null
  ashtakavarga?: AshtakavargaResult | null
  navamshaGrahas?: GrahaData[] | null
  /** Detailed "More" interpretation is Gold+ */
  userPlan?: UserPlan
  /** Saved chart id — enables Platinum dasha event notes */
  chartId?: string | null
}

// ── Helpers ──────────────────────────────────────────────────

function toneClass(tone: Tone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'caution') return styles.toneCaution
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

function natureTone(nature: VimshottariNature): Tone {
  if (isBeneficVimNature(nature)) return 'supportive'
  if (isMaleficVimNature(nature)) return 'caution'
  return 'mixed'
}

function insightTone(label: VimshottariPeriodAnalysis['insight']['toneLabel']): Tone {
  if (label === 'Favorable stretch') return 'supportive'
  if (label === 'Challenging stretch') return 'caution'
  return 'mixed'
}

function planetVars(lord: string): React.CSSProperties {
  return { '--planet': GRAHA_DISPLAY_COLOR[lord as GrahaId] ?? 'var(--gold)' } as React.CSSProperties
}

function planetName(lord: string): string {
  return GRAHA_NAMES[lord as GrahaId] ?? lord
}

function toMs(value: Date | string | number): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

function periodProgress(node: DashaNode, now: number): number {
  const start = toMs(node.start)
  const end = toMs(node.end)
  if (!(end > start)) return 0
  return Math.min(1, Math.max(0, (now - start) / (end - start)))
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'ending'
  const days = Math.floor(ms / 86_400_000)
  const years = Math.floor(days / 365.25)
  const months = Math.floor((days - years * 365.25) / 30.44)
  if (years > 0) return months > 0 ? `${years}y ${months}m left` : `${years}y left`
  if (months > 0) {
    const rem = Math.floor(days - months * 30.44)
    return rem > 0 ? `${months}m ${rem}d left` : `${months}m left`
  }
  return `${Math.max(1, days)}d left`
}

function formatNodeDate(value: Date | string | number): string {
  const ms = toMs(value)
  return Number.isFinite(ms) ? formatShortDate(new Date(ms).toISOString()) : '—'
}

function dignityTone(dignity: string): Tone {
  const d = dignity.toLowerCase()
  if (d.includes('debil')) return 'caution'
  if (d.includes('exalt') || d.includes('own') || d.includes('moola')) return 'supportive'
  if (d.includes('enemy')) return 'mixed'
  return 'neutral'
}

function snapshotFacts(s: VimshottariLordSnapshot | null): { label: string; tone: Tone }[] {
  if (!s) return []
  const facts: { label: string; tone: Tone }[] = []
  if (s.housesRuled.length) facts.push({ label: `Rules H${s.housesRuled.join(', H')}`, tone: 'neutral' })
  if (s.house != null) facts.push({ label: `In H${s.house}`, tone: 'neutral' })
  if (s.dignity) facts.push({ label: `D1 ${s.dignity}`, tone: dignityTone(s.dignity) })
  if (s.d9Dignity) facts.push({ label: `D9 ${s.d9Dignity}`, tone: dignityTone(s.d9Dignity) })
  if (s.isVargottama) facts.push({ label: 'Vargottama', tone: 'supportive' })
  if (s.shadbalaBand) facts.push({ label: `Shadbala ${s.shadbalaBand}`, tone: 'neutral' })
  if (s.bavBindus != null) {
    facts.push({
      label: `BAV ${s.bavBindus}`,
      tone: s.bavBindus >= 5 ? 'supportive' : s.bavBindus <= 3 ? 'caution' : 'neutral',
    })
  }
  if (s.arohiniKind === 'arohini') facts.push({ label: 'Arohini', tone: 'supportive' })
  if (s.arohiniKind === 'avarohini') facts.push({ label: 'Avarohini', tone: 'mixed' })
  if (s.isRetro) facts.push({ label: 'Retro', tone: 'mixed' })
  if (s.isYogakaraka) facts.push({ label: 'Yogakaraka', tone: 'supportive' })
  if (s.charaKaraka) facts.push({ label: s.charaKaraka, tone: 'neutral' })
  if (s.isMaraka) facts.push({ label: 'Maraka hardship', tone: 'caution' })
  return facts
}

// ── Small pieces ─────────────────────────────────────────────

function Disc({ lord, size }: { lord: string; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={cn(styles.disc, size === 'sm' && styles.discSm, size === 'lg' && styles.discLg)}
      style={planetVars(lord)}
      aria-hidden
    >
      {lord}
    </span>
  )
}

function Pill({ tone, children, title, className }: {
  tone: Tone
  children: React.ReactNode
  title?: string
  className?: string
}) {
  return (
    <span className={cn(styles.pill, toneClass(tone), className)} title={title}>
      <span className={styles.pillDot} aria-hidden />
      {children}
    </span>
  )
}

function Upsell({ text }: { text: string }) {
  return (
    <div className={styles.upsell}>
      <div className={styles.upsellText}>
        <Crown size={16} aria-hidden style={{ color: 'var(--text-gold)', flex: '0 0 auto', marginTop: 2 }} />
        <div>
          <strong>Unlock with Gold</strong>
          {text}
        </div>
      </div>
      <Link href="/pricing" style={{ textDecoration: 'none' }}>
        <Button variant="primary" size="sm">View plans</Button>
      </Link>
    </div>
  )
}

function MixBar({ analysis }: { analysis: VimshottariPeriodAnalysis }) {
  const segs: { label: string; value: number; tone: Tone }[] = [
    { label: 'Favorable', value: analysis.favorableShare, tone: 'supportive' },
    { label: 'Neutral', value: analysis.neutralShare, tone: 'mixed' },
    { label: 'Challenging', value: analysis.challengingShare, tone: 'caution' },
  ]
  return (
    <div className={styles.mix}>
      <div className={styles.mixBar} role="img" aria-label={segs.map(s => `${s.label} ${s.value}%`).join(', ')}>
        {segs.filter(s => s.value > 0).map(s => (
          <div
            key={s.label}
            className={cn(styles.mixSeg, toneClass(s.tone))}
            style={{ flexGrow: s.value, flexBasis: 0 }}
            title={`${s.label} ${s.value}%`}
          />
        ))}
      </div>
      <div className={styles.mixLegend}>
        {segs.map(s => (
          <span key={s.label} className={cn(styles.mixLegendItem, toneClass(s.tone))}>
            <span className={styles.pillDot} aria-hidden />
            {s.label} <span className={styles.mixLegendValue}>{s.value}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function ScriptureBlock({ passages, level }: { passages: ScripturePassage[]; level: string }) {
  if (!passages.length) return null
  return (
    <details className={styles.scriptures}>
      <summary className={styles.scripturesSummary}>
        <ScrollText size={14} aria-hidden />
        Classical references · {level}
        <span className={styles.scripturesCount}>{passages.length}</span>
      </summary>
      <div className={styles.scripturesBody}>
        {passages.map((p, i) => (
          <figure key={`${p.source}-${i}`} className={styles.passage}>
            <figcaption className={styles.passageSource}>
              {p.source}{p.ref ? ` · ${p.ref}` : ''}
            </figcaption>
            <p className={styles.passageText}>{p.text}</p>
          </figure>
        ))}
        <div className={styles.note} style={{ fontStyle: 'italic' }}>
          Educational paraphrases of classical teaching — not verbatim scripture, not predictive certainty.
        </div>
      </div>
    </details>
  )
}

// ── Hero: active period chain ────────────────────────────────

function ChainTile({ node, index, now }: { node: DashaNode; index: number; now: number }) {
  const progress = periodProgress(node, now)
  const remaining = toMs(node.end) - now
  return (
    <div className={cn(styles.chainTile, index === 0 && styles.chainTilePrimary)} style={planetVars(node.lord)}>
      <div className={styles.chainHead}>
        <Disc lord={node.lord} size={index === 0 ? 'lg' : undefined} />
        <div style={{ minWidth: 0 }}>
          <div className={styles.chainLevel}>{LEVEL_NAMES[index]}</div>
          <div className={styles.chainName}>{planetName(node.lord)}</div>
        </div>
      </div>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label={`${LEVEL_NAMES[index]} elapsed`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className={styles.progressFill} style={{ width: `${Math.max(2, progress * 100)}%` }} />
      </div>
      <div className={styles.chainMeta}>
        <span className={styles.chainDates}>{formatNodeDate(node.start)} → {formatNodeDate(node.end)}</span>
        <span className={styles.chainMetaStrong}>{formatRemaining(remaining)}</span>
      </div>
    </div>
  )
}

// ── Period card ──────────────────────────────────────────────

const PHASES = [
  { key: 'phaseStart', label: 'Opening' },
  { key: 'phaseMiddle', label: 'Middle' },
  { key: 'phaseEnd', label: 'Closing' },
] as const

function PlanetCard({
  data,
  levelLabel,
  facts,
  antarHint,
  durationLabel,
  scriptures = [],
  isAntar = false,
  progress,
  defaultExpanded = true,
  canExpandDetails,
}: {
  data: VimshottariInterpretation
  levelLabel: string
  facts: { label: string; tone: Tone }[]
  antarHint?: string | null
  /** Override years display (e.g. antardasha months) */
  durationLabel?: string | null
  scriptures?: ScripturePassage[]
  isAntar?: boolean
  /** Elapsed fraction of this period (0–1), drives the phase marker */
  progress: number
  defaultExpanded?: boolean
  canExpandDetails: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const tone = natureTone(data.nature)
  const durationText = durationLabel
    ?? `${data.years} ${data.years === 1 ? 'Year' : 'Years'}`
  const phaseIndex = progress < 1 / 3 ? 0 : progress < 2 / 3 ? 1 : 2

  return (
    <article className={cn(styles.card, toneClass(tone))}>
      <button
        type="button"
        className={styles.cardHead}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <Disc lord={data.lord} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.eyebrow}>{levelLabel}</div>
          <div className={styles.cardTitleRow}>
            <h3 className={styles.cardTitle}>{data.title}</h3>
            <Pill tone={tone}>{data.nature}</Pill>
          </div>
          <div className={styles.cardSub}>
            <b>{durationText}</b> · {data.keyTheme}
          </div>
          {facts.length > 0 && (
            <div className={styles.facts}>
              {facts.map(f => (
                <span key={f.label} className={cn(styles.fact, toneClass(f.tone))}>
                  {f.label}
                </span>
              ))}
            </div>
          )}
          {!expanded && <p className={styles.cardPreview}>{data.primaryPositive}</p>}
        </div>
        <span className={styles.chev}>
          {!canExpandDetails && <Lock size={12} aria-hidden />}
          {expanded ? 'Less' : 'More'}
          <ChevronDown size={14} aria-hidden className={cn(styles.chevIcon, expanded && styles.chevOpen)} />
        </span>
      </button>

      {expanded && (
        canExpandDetails ? (
          <div className={styles.cardBody}>
            {data.psychologicalState && (
              <p className={styles.mood}>{data.psychologicalState}</p>
            )}

            <div className={styles.duo}>
              <div className={cn(styles.box, styles.toneSupportive)}>
                <div className={styles.boxTitle}><Sparkles size={12} aria-hidden /> Supportive effects</div>
                <p className={styles.boxText}>
                  <b>{isAntar ? 'This period: ' : 'Primary: '}</b>{data.primaryPositive}
                </p>
                {data.secondaryBenefits && (
                  <p className={styles.boxText}><b>Also: </b>{data.secondaryBenefits}</p>
                )}
              </div>
              <div className={cn(styles.box, styles.toneCaution)}>
                <div className={styles.boxTitle}><ShieldAlert size={12} aria-hidden /> Risks & caution</div>
                {data.negativeEffects
                  ? <p className={styles.boxText}>{data.negativeEffects}</p>
                  : <p className={styles.boxText}>Few classical negatives when well placed.</p>}
                {data.healthCaution && (
                  <p className={styles.boxText}><b>Health: </b>{data.healthCaution}</p>
                )}
              </div>
            </div>

            <div>
              <div className={styles.eyebrow} style={{ marginBottom: '0.45rem' }}>How it unfolds</div>
              <div className={styles.phases}>
                {PHASES.map((p, i) => (
                  <div
                    key={p.key}
                    className={cn(styles.phase, i === phaseIndex && styles.phaseNow, i < phaseIndex && styles.phasePast)}
                  >
                    <div className={styles.phaseHead}>
                      <span className={styles.phaseName}>{p.label}</span>
                      {i === phaseIndex && <Pill tone="mixed">You are here</Pill>}
                    </div>
                    <p className={styles.phaseText}>{data[p.key]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.events}>
              <Star size={14} aria-hidden style={{ color: 'var(--text-gold)', flex: '0 0 auto', marginTop: 3 }} />
              <div>
                <b>Life events: </b>{data.lifeEvents}
                {antarHint && !isAntar && (
                  <div style={{ marginTop: 4 }}><b>Current antar: </b>{antarHint}</div>
                )}
                {isAntar && (
                  <div className={styles.note} style={{ marginTop: 4 }}>
                    Sub-period only — does not replace the active mahadasha story.
                  </div>
                )}
              </div>
            </div>

            <ScriptureBlock passages={scriptures} level={levelLabel.replace('Active ', '')} />
          </div>
        ) : (
          <div className={styles.cardBody}>
            <Upsell text=" Phases, risks, life events and classical references for every active period." />
          </div>
        )
      )}
    </article>
  )
}

// ── Tab content ──────────────────────────────────────────────

function TimelineBlock({ timeline }: { timeline: VimshottariUpcomingTimeline }) {
  const items = [...timeline.upcomingAntars, ...(timeline.nextMaha ? [timeline.nextMaha] : [])]
  return (
    <div className={styles.section}>
      <p className={styles.sectionLead}>{timeline.headline}</p>
      {items.length > 0 ? (
        <ol className={styles.rail}>
          {items.map((item, i) => (
            <TimelineRow key={`${item.kind}-${item.lord}-${item.startIso}-${i}`} item={item} />
          ))}
        </ol>
      ) : (
        <div className={styles.note}>No upcoming periods in range.</div>
      )}
    </div>
  )
}

function TimelineRow({ item }: { item: UpcomingDashaItem }) {
  const tone: Tone = item.tone === 'caution' ? 'caution' : item.tone === 'supportive' ? 'supportive' : 'mixed'
  const isMaha = item.kind === 'maha'
  return (
    <li className={styles.railItem}>
      <Disc lord={item.lord} size="sm" />
      <div className={cn(styles.railBody, isMaha && styles.railMaha)}>
        <div className={styles.railTop}>
          <span className={styles.railLabel}>{item.label}</span>
          <Pill tone={tone}>{item.toneLabel}</Pill>
          {isMaha && <Pill tone="neutral">Next mahadasha</Pill>}
        </div>
        <div className={styles.railDates}>
          {formatShortDate(item.startIso)} → {formatShortDate(item.endIso)}
        </div>
        {item.hint && <p className={styles.railHint}>{item.hint}</p>}
      </div>
    </li>
  )
}

const STRENGTH_LEVEL: Record<LifeAreaActivation['strength'], number> = { high: 3, medium: 2, low: 1, quiet: 0 }

function strengthTone(strength: LifeAreaActivation['strength']): Tone {
  if (strength === 'high') return 'supportive'
  if (strength === 'medium') return 'mixed'
  return 'neutral'
}

function LifeAreaGrid({ areas, headline }: { areas: LifeAreaActivation[]; headline: string }) {
  const sorted = [...areas].sort((a, b) => STRENGTH_LEVEL[b.strength] - STRENGTH_LEVEL[a.strength])
  return (
    <div className={styles.section}>
      <p className={styles.sectionLead}>{headline}</p>
      <div className={styles.areas}>
        {sorted.map(a => {
          const Icon = LIFE_AREA_ICON[a.id] ?? Layers
          const level = STRENGTH_LEVEL[a.strength]
          return (
            <div key={a.id} className={cn(styles.area, toneClass(strengthTone(a.strength)), a.strength === 'quiet' && styles.areaQuiet)}>
              <div className={styles.areaHead}>
                <span className={styles.areaName}>
                  <Icon size={14} aria-hidden className={styles.areaIcon} />
                  {a.label}
                </span>
                <Pill tone={strengthTone(a.strength)}>{a.strength}</Pill>
              </div>
              <div className={styles.meter} aria-hidden>
                {[1, 2, 3].map(n => (
                  <span key={n} className={cn(styles.meterSeg, n <= level && styles.meterOn)} />
                ))}
              </div>
              <p className={styles.areaNote}>{a.note}</p>
              {a.houses.length > 0 && (
                <span className={styles.areaHouses}>Houses {a.houses.map(h => `H${h}`).join(' · ')}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GocharBlock({ overlay }: { overlay: DashaGocharOverlay | null }) {
  if (!overlay) {
    return (
      <div className={styles.section}>
        <p className={styles.sectionLead}>Loading dasha × gochar…</p>
      </div>
    )
  }
  return (
    <div className={styles.section}>
      <p className={styles.sectionLead}>
        {overlay.summary} <em>· as of {overlay.asOfLabel}</em>
      </p>
      {overlay.hits.length > 0 && (
        <ul className={styles.hits}>
          {overlay.hits.map(h => (
            <li key={h.id} className={cn(styles.hit, toneClass(h.tone))}>
              <Disc lord={h.transitLord} size="sm" />
              <div style={{ minWidth: 0 }}>
                <div className={styles.hitLabel}>{h.label}</div>
                <p className={styles.hitDetail}>{h.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ChainRow({ title, chain }: { title: string; chain: DispositorChain }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div className={styles.eyebrow}>{title}</div>
      {chain.links.length > 0 && (
        <div className={styles.links}>
          {chain.links.map((l, i) => (
            <React.Fragment key={`${l.lord}-${l.role}-${i}`}>
              {i > 0 && <ArrowRight size={14} aria-hidden className={styles.linkArrow} />}
              <span className={styles.link} title={l.label}>
                <Disc lord={l.lord} size="sm" />
                <span className={styles.linkText}>
                  <span className={styles.linkName}>{planetName(l.lord)}</span>
                  <span className={styles.linkRole}>{l.role === 'period' ? 'Period lord' : `${l.role} lord`}</span>
                </span>
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      <p className={styles.sectionLead}>{chain.summary}</p>
    </div>
  )
}

function DeliveryBlock({ analysis }: { analysis: VimshottariPeriodAnalysis }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLead}>
        A dasha lord delivers through the planets that host it — its sign lord and nakshatra lord shape how results arrive.
      </p>
      <ChainRow title="Mahadasha chain" chain={analysis.dispositorChains.mahadasha} />
      {analysis.dispositorChains.antardasha && (
        <>
          <hr className={styles.divider} />
          <ChainRow title="Antardasha chain" chain={analysis.dispositorChains.antardasha} />
        </>
      )}
    </div>
  )
}

const NEED_TONE: Record<RemedyNeed, { tone: Tone; label: string }> = {
  high: { tone: 'caution', label: 'Needs remedy' },
  moderate: { tone: 'mixed', label: 'Some strain' },
  low: { tone: 'supportive', label: 'Supported' },
}

function RemedyList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className={styles.box}>
      <span className={styles.boxTitle}>{title}</span>
      <ul className={styles.bullets} style={{ marginTop: 0 }}>
        {items.map(i => (
          <li key={i} className={styles.bullet} style={{ fontSize: '0.76rem' }}>
            <ChevronRight size={13} aria-hidden className={styles.bulletIcon} />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RemediesBlock({ remedies, canExpandDetails }: {
  remedies: DashaLordRemedy[]
  canExpandDetails: boolean
}) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLead}>
        Remedies for the planets running your dasha now. {REMEDY_CORE_PRINCIPLE.keyRule}
      </p>
      {remedies.map(({ levels, assessment: a }) => {
        const t = a.teaching
        const need = NEED_TONE[a.need]
        const deities = [...t.deities, `${a.nakshatraDeity} (${a.nakshatraName})`]
        return (
          <div key={a.grahaId} className={cn(styles.card, toneClass(need.tone))}>
            <div className={styles.cardHead} style={{ cursor: 'default' }}>
              <Disc lord={a.grahaId} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className={styles.eyebrow}>{levels.join(' · ')}</span>
                <div className={styles.cardTitleRow}>
                  <h3 className={styles.cardTitle}>{t.name} · {t.sanskrit}</h3>
                  <Pill tone={need.tone}>{need.label}</Pill>
                </div>
                <div className={styles.cardSub}>
                  {a.reasons.length > 0 ? a.reasons.join(' · ') : 'No major natal affliction'}
                </div>
                <div className={styles.cardSub}>
                  <b>Deities:</b> {deities.join(' · ')}
                </div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.duo}>
                <RemedyList title="Indications" items={t.indications} />
                <RemedyList title="Behavioural" items={t.behavioral} />
              </div>
              {canExpandDetails ? (
                <>
                  <div className={styles.duo}>
                    <RemedyList title="Spiritual" items={t.spiritual} />
                    <RemedyList title="Daan & Seva" items={[...t.donation, ...t.seva]} />
                  </div>
                  {t.notes.map(n => (
                    <div key={n} className={cn(styles.callout, styles.toneCaution)}>
                      <AlertTriangle size={15} aria-hidden className={styles.calloutIcon} />
                      <span>{n}</span>
                    </div>
                  ))}
                  {t.duration && <div className={styles.note}>Duration: {t.duration}</div>}
                </>
              ) : (
                <div className={styles.note}>
                  <Lock size={11} aria-hidden /> Spiritual remedies, daan, seva and cautions on Gold.
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** @deprecated Prefer VimshottariInterpretationPanel — alias kept for clarity */
export function DashaInterpretationPanel(props: VimshottariInterpretationPanelProps) {
  return <VimshottariInterpretationPanel {...props} />
}

export function VimshottariInterpretationPanel({
  nodes,
  grahas,
  ascRashi,
  shadbala,
  ashtakavarga,
  navamshaGrahas,
  userPlan = 'free',
  chartId = null,
}: VimshottariInterpretationPanelProps) {
  const canExpandDetails = planMeetsUiGate(userPlan, 'gold')
  const canTagEvents = planMeetsUiGate(userPlan, 'platinum')
  const [transitPositions, setTransitPositions] = useState<TransitPosition[] | null>(null)
  const [eventLabel, setEventLabel] = useState<string>(DASHA_EVENT_LABELS[0])
  const [eventNote, setEventNote] = useState('')
  const [eventSaving, setEventSaving] = useState(false)
  const [eventMsg, setEventMsg] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('reading')
  const [now] = useState(() => Date.now())

  const activePath = useMemo(() => {
    const path: DashaNode[] = []
    let current = nodes.find(n => n.isCurrent)
    while (current) {
      path.push(current)
      current = current.children.find(c => c.isCurrent)
    }
    return path
  }, [nodes])

  const analysis = useMemo(
    () => analyzeVimshottariPeriod({
      nodes,
      ascRashi,
      grahas,
      shadbala,
      ashtakavarga,
      navamshaGrahas,
    }),
    [nodes, ascRashi, grahas, shadbala, ashtakavarga, navamshaGrahas],
  )

  const tattvaOverlay = useMemo(
    () => analyzeTattvaDashaOverlay(grahas, nodes),
    [grahas, nodes],
  )
  const moonGuidance = tattvaOverlay?.predictMode === 'guidance'

  const timeline = useMemo(
    () => buildUpcomingVimshottariTimeline(nodes),
    [nodes],
  )

  useEffect(() => {
    let cancelled = false
    const asOf = new Date().toISOString().slice(0, 10)
    fetch(`/api/transit?ascRashi=${ascRashi}&months=1&startDate=${asOf}`)
      .then(r => r.json())
      .then((body: { success?: boolean; currentPositions?: TransitPosition[] }) => {
        if (cancelled) return
        if (body?.success && Array.isArray(body.currentPositions)) {
          setTransitPositions(body.currentPositions)
        } else {
          setTransitPositions([])
        }
      })
      .catch(() => {
        if (!cancelled) setTransitPositions([])
      })
    return () => { cancelled = true }
  }, [ascRashi])

  const remedies = useMemo(
    () => computeDashaLordRemedies(activePath.map(n => n.lord), grahas, shadbala),
    [activePath, grahas, shadbala],
  )

  const gochar = useMemo(() => {
    if (!transitPositions || activePath.length < 1) return null
    return analyzeDashaGochar({
      ascRashi,
      natalGrahas: grahas,
      mahaLord: activePath[0].lord,
      antarLord: activePath[1]?.lord ?? null,
      pratyaLord: activePath[2]?.lord ?? null,
      transitPositions,
    })
  }, [transitPositions, activePath, ascRashi, grahas])

  if (activePath.length < 1) return null

  const maha = getVimshottariInterpretation(activePath[0].lord)
  if (!maha) return null

  const mahaNode = activePath[0]
  const antarNode = activePath[1] ?? null
  const pratyaNode = activePath[2] ?? null
  const antarHint = antarNode
    ? getVimshottariAntarHint(mahaNode.lord, antarNode.lord)
    : null
  const antarYears = antarNode ? durationMsToYears(antarNode.durationMs) : 0
  const antar = antarNode
    ? buildVimshottariAntarInterpretation(mahaNode.lord, antarNode.lord, antarYears)
    : null
  const antarDurationLabel = antarNode
    ? formatVimshottariDurationYears(antarYears)
    : null
  const pratyaYears = pratyaNode ? durationMsToYears(pratyaNode.durationMs) : 0
  const pratya = antarNode && pratyaNode
    ? buildVimshottariPratyantarInterpretation(
      mahaNode.lord,
      antarNode.lord,
      pratyaNode.lord,
      pratyaYears,
    )
    : null
  const pratyaDurationLabel = pratyaNode
    ? formatVimshottariDurationYears(pratyaYears)
    : null
  const mahaScriptures = getVimshottariMahaScriptures(mahaNode.lord)
  const antarScriptures = antarNode
    ? getVimshottariAntarScriptures(mahaNode.lord, antarNode.lord)
    : []
  const pratyaScriptures = antarNode && pratyaNode
    ? getVimshottariPratyantarScriptures(mahaNode.lord, antarNode.lord, pratyaNode.lord)
    : []

  const chainNodes = activePath.slice(0, 3)
  const heroTone: Tone = analysis ? insightTone(analysis.insight.toneLabel) : natureTone(maha.nature)
  const cautionFlags = analysis ? analysis.flags.filter(f => f.tone === 'caution').slice(0, 4) : []
  const signals = analysis
    ? [
      analysis.d9Note && { title: 'Navamsha', text: analysis.d9Note, icon: Layers },
      analysis.charaKarakaNote && { title: 'Chara Karaka', text: analysis.charaKarakaNote, icon: Crown },
      analysis.yogakarakaNote && { title: 'Yogakaraka', text: analysis.yogakarakaNote, icon: Sparkles },
      analysis.lagnaSpecialNote && { title: 'Lagna note', text: analysis.lagnaSpecialNote, icon: Star },
    ].filter(Boolean) as { title: string; text: string; icon: React.ElementType }[]
    : []

  async function saveDashaEvent() {
    if (!chartId || !canTagEvents || eventSaving) return
    const text = eventNote.trim()
    if (!text) {
      setEventMsg('Add a short note first.')
      return
    }
    setEventSaving(true)
    setEventMsg(null)
    const mahaLord = mahaNode.lord
    const antarLord = antarNode?.lord
    const periodStart = antarNode
      ? new Date(antarNode.start).toISOString()
      : new Date(mahaNode.start).toISOString()
    const periodEnd = antarNode
      ? new Date(antarNode.end).toISOString()
      : new Date(mahaNode.end).toISOString()
    const content = `[Dasha · ${mahaLord}${antarLord ? `/${antarLord}` : ''} · ${eventLabel}] ${text}`
    try {
      const res = await fetch('/api/chart/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartId,
          content,
          dashaTag: {
            mahaLord,
            antarLord,
            periodStart,
            periodEnd,
            eventLabel,
          },
        }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok || !body?.success) {
        setEventMsg(body?.error || 'Could not save note.')
      } else {
        setEventNote('')
        setEventMsg('Saved to chart notes.')
      }
    } catch {
      setEventMsg('Could not save note.')
    } finally {
      setEventSaving(false)
    }
  }

  const goldUpsell = ' Life-area activation, the upcoming dasha timeline, live gochar overlay and dispositor delivery chains.'

  return (
    <div className={styles.panel}>
      {/* ── Hero ── */}
      <section className={cn(styles.hero, toneClass(heroTone))} aria-label="Vimshottari interpretation">
        <div className={styles.heroTop}>
          <span className={styles.eyebrow}>Vimshottari · Now running</span>
          {analysis && <Pill tone={heroTone}>{analysis.insight.toneLabel}</Pill>}
        </div>

        <div className={styles.chain} style={{ '--chain-cols': chainNodes.length } as React.CSSProperties}>
          {chainNodes.map((node, i) => (
            <ChainTile key={`${node.lord}-${i}`} node={node} index={i} now={now} />
          ))}
        </div>

        {analysis && (
          <div>
            <h2 className={styles.headline}>{analysis.insight.headline}</h2>
            {analysis.insight.bullets.length > 0 && (
              <ul className={styles.bullets}>
                {analysis.insight.bullets.map((b, i) => (
                  <li key={i} className={styles.bullet}>
                    <ChevronRight size={14} aria-hidden className={styles.bulletIcon} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {analysis?.insight.watch && (
          <div className={cn(styles.callout, styles.toneCaution)}>
            <AlertTriangle size={15} aria-hidden className={styles.calloutIcon} />
            <span><strong>Watch: </strong>{analysis.insight.watch}</span>
          </div>
        )}

        {moonGuidance && (
          <div className={cn(styles.callout, styles.toneCaution)}>
            <Moon size={15} aria-hidden className={styles.calloutIcon} />
            <span>
              <strong>Moon period — guidance mode. </strong>
              Firm event forecasts are softened. Prefer sadhana / katha; see Tattva Prediction → Remedies.
              {tattvaOverlay?.remedies[0] ? ` ${tattvaOverlay.remedies[0].text}` : ''}
            </span>
          </div>
        )}

        {analysis && <MixBar analysis={analysis} />}

        {analysis && analysis.flags.length > 0 && (
          <div className={styles.flags}>
            {analysis.flags.map(f => (
              <Pill key={f.id} tone={f.tone} title={f.detail} className={styles.flag}>{f.label}</Pill>
            ))}
          </div>
        )}

        {cautionFlags.length > 0 && (
          <ul className={styles.bullets} style={{ marginTop: 0 }}>
            {cautionFlags.map(f => (
              <li key={`d-${f.id}`} className={cn(styles.bullet, styles.toneCaution)} style={{ fontSize: '0.74rem' }}>
                <ShieldAlert size={13} aria-hidden className={styles.bulletIcon} style={{ color: 'var(--tone)' }} />
                <span>{f.detail}</span>
              </li>
            ))}
          </ul>
        )}

        {signals.length > 0 && (
          <>
            <hr className={styles.divider} />
            <div className={styles.signals}>
              {signals.map(s => {
                const Icon = s.icon
                return (
                  <div key={s.title} className={styles.signal}>
                    <Icon size={14} aria-hidden className={styles.signalIcon} />
                    <div>
                      <span className={styles.signalTitle}>{s.title}</span>
                      {s.text}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      <TattvaDashaOverlayStrip grahas={grahas} dashaNodes={nodes} />

      {/* ── Tabs ── */}
      <div className={styles.tabs} role="tablist" aria-label="Dasha interpretation sections">
        {TABS.map(t => {
          const Icon = t.icon
          const locked = t.gold && !canExpandDetails
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`dasha-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`dasha-panel-${t.id}`}
              className={cn(styles.tab, tab === t.id && styles.tabActive, locked && styles.tabLock)}
              onClick={() => setTab(t.id)}
            >
              <Icon size={14} aria-hidden />
              {t.label}
              {locked && <Lock size={11} aria-hidden />}
            </button>
          )
        })}
      </div>

      <div
        className={styles.tabPanel}
        role="tabpanel"
        id={`dasha-panel-${tab}`}
        aria-labelledby={`dasha-tab-${tab}`}
      >
        {tab === 'reading' && (
          <>
            <PlanetCard
              data={maha}
              levelLabel="Active Mahadasha"
              facts={snapshotFacts(analysis?.mahadasha ?? null)}
              scriptures={mahaScriptures}
              progress={periodProgress(mahaNode, now)}
              defaultExpanded={canExpandDetails}
              canExpandDetails={canExpandDetails}
            />
            {antar && antarNode && (
              <PlanetCard
                data={antar}
                levelLabel="Active Antardasha"
                facts={snapshotFacts(analysis?.antardasha ?? null)}
                antarHint={antarHint}
                durationLabel={antarDurationLabel}
                scriptures={antarScriptures}
                isAntar
                progress={periodProgress(antarNode, now)}
                defaultExpanded={canExpandDetails}
                canExpandDetails={canExpandDetails}
              />
            )}
            {pratya && pratyaNode && (
              <PlanetCard
                data={pratya}
                levelLabel="Active Pratyantardasha"
                facts={snapshotFacts(analysis?.pratyantardasha ?? null)}
                durationLabel={pratyaDurationLabel}
                scriptures={pratyaScriptures}
                isAntar
                progress={periodProgress(pratyaNode, now)}
                defaultExpanded={false}
                canExpandDetails={canExpandDetails}
              />
            )}
          </>
        )}

        {tab === 'remedies' && (
          <RemediesBlock remedies={remedies} canExpandDetails={canExpandDetails} />
        )}

        {tab !== 'reading' && tab !== 'remedies' && !canExpandDetails && <Upsell text={goldUpsell} />}

        {canExpandDetails && analysis && (
          <>
            {tab === 'areas' && (
              <LifeAreaGrid areas={analysis.lifeAreas.areas} headline={analysis.lifeAreas.headline} />
            )}
            {tab === 'timeline' && <TimelineBlock timeline={timeline} />}
            {tab === 'gochar' && <GocharBlock overlay={gochar} />}
            {tab === 'delivery' && <DeliveryBlock analysis={analysis} />}
          </>
        )}
      </div>

      {canTagEvents && (
        <div className={styles.section}>
          <div className={styles.eyebrow} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag size={12} aria-hidden /> Event tag · Platinum
          </div>
          {!chartId ? (
            <p className={styles.sectionLead}>
              Save this chart to attach dasha-dated notes, or manage clients in{' '}
              <Link href="/clients" className={styles.textLink}>CRM</Link>.
            </p>
          ) : (
            <>
              <p className={styles.sectionLead}>
                Log what happened during the current{' '}
                <b>{planetName(mahaNode.lord)}{antarNode ? ` / ${planetName(antarNode.lord)}` : ''}</b> period.
              </p>
              <div className={styles.eventRow}>
                <select
                  value={eventLabel}
                  onChange={e => setEventLabel(e.target.value)}
                  className={styles.control}
                  aria-label="Event type"
                >
                  {DASHA_EVENT_LABELS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <input
                  value={eventNote}
                  onChange={e => setEventNote(e.target.value)}
                  placeholder="What happened / note…"
                  maxLength={500}
                  className={cn(styles.control, styles.controlGrow)}
                  aria-label="Event note"
                />
                <Button variant="secondary" size="sm" onClick={() => void saveDashaEvent()} disabled={eventSaving}>
                  {eventSaving ? 'Saving…' : 'Save note'}
                </Button>
              </div>
              {eventMsg && <div className={styles.note}>{eventMsg}</div>}
              <Link href="/clients" className={styles.textLink}>Open client CRM →</Link>
            </>
          )}
        </div>
      )}

      <div className={styles.footer}>
        <p>{VIMSHOTTARI_RESULT_HIERARCHY}</p>
        <p>
          Educational timing overlay — every dasha mixes supportive, neutral, and challenging themes.
          Health notes are soft cautions, not medical advice. Maraka means hardship pressure, not a life-ending forecast.
        </p>
      </div>
    </div>
  )
}
