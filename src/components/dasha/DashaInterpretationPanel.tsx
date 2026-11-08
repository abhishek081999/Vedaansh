'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/DashaInterpretationPanel.tsx
//  Active Vimshottari MD/AD narrative + chart-conditioned flags
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI } from '@/i18n/jyotish'
import type { EngineLang } from '@/lib/engine/lang'
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
  getVimshottariResultHierarchy,
  isBeneficVimNature,
  isMaleficVimNature,
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
  type DashaLordRemedy,
  type RemedyNeed,
} from '@/lib/engine/planetaryRemedies'
import { localizeDashaLordRemedies, remedyKeyRule } from '@/lib/engine/dasha/dashaRemedyText'
import type { TransitPosition } from '@/lib/engine/transits'
import { GRAHA_DISPLAY_COLOR } from '@/lib/engine/grahaDisplayColors'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { cn } from '@/lib/ui/cn'
import { Button } from '@/components/ui/primitives/Button'
import { TattvaDashaOverlayStrip } from '@/components/ui/TattvaPredictionPanel'
import { analyzeTattvaDashaOverlay } from '@/lib/engine/tattvaPrediction'
import styles from './DashaInterpretationPanel.module.css'
import { TimelineBand, type BandSegment } from '@/components/ui/viz'
import { lordColor } from '@/components/dasha/dashaPalette'

/** Stored English event labels (saved with the note) → message key for display. */
const DASHA_EVENT_LABELS = [
  ['Job change', 'job'],
  ['Move / home', 'move'],
  ['Relationship', 'relationship'],
  ['Health', 'health'],
  ['Travel', 'travel'],
  ['Finance', 'finance'],
  ['Other', 'other'],
] as const

const LEVEL_KEYS = ['maha', 'antar', 'pratya'] as const

type T = ReturnType<typeof useTranslations>

type Tone = 'supportive' | 'caution' | 'mixed' | 'neutral'
type TabId = 'reading' | 'remedies' | 'areas' | 'timeline' | 'gochar' | 'delivery'

const TABS: { id: TabId; icon: React.ElementType; gold: boolean }[] = [
  { id: 'reading', icon: ScrollText, gold: false },
  { id: 'remedies', icon: Flower2, gold: false },
  { id: 'areas', icon: Layers, gold: true },
  { id: 'timeline', icon: CalendarClock, gold: true },
  { id: 'gochar', icon: Orbit, gold: true },
  { id: 'delivery', icon: Link2, gold: true },
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

function planetName(lord: string, lang: EngineLang = 'en'): string {
  if (lang === 'hi') return GRAHA_HI[lord as GrahaId] ?? lord
  return GRAHA_NAMES[lord as GrahaId] ?? lord
}

function natureLabel(nature: VimshottariNature, t: T): string {
  return t(`nature.${nature.replace(' ', '')}`)
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

function formatRemaining(ms: number, t: T): string {
  if (ms <= 0) return t('remaining.ending')
  const days = Math.floor(ms / 86_400_000)
  const years = Math.floor(days / 365.25)
  const months = Math.floor((days - years * 365.25) / 30.44)
  if (years > 0) return months > 0 ? t('remaining.ym', { years, months }) : t('remaining.y', { years })
  if (months > 0) {
    const rem = Math.floor(days - months * 30.44)
    return rem > 0 ? t('remaining.md', { months, days: rem }) : t('remaining.m', { months })
  }
  return t('remaining.d', { days: Math.max(1, days) })
}

function formatNodeDate(value: Date | string | number, lang: EngineLang = 'en'): string {
  const ms = toMs(value)
  return Number.isFinite(ms) ? formatShortDate(new Date(ms).toISOString(), lang) : '—'
}

const DIGNITY_KEYS = new Set(['exalted', 'debilitated', 'own', 'moolatrikona', 'friend', 'great_friend', 'neutral', 'enemy', 'great_enemy'])
const BAND_KEYS = new Set(['excellent', 'strong', 'average', 'weak'])
const KARAKA_HI: Record<string, string> = {
  AK: 'आत्मकारक', AmK: 'अमात्यकारक', BK: 'भ्रातृकारक', MK: 'मातृकारक',
  PK: 'पुत्रकारक', PiK: 'पितृकारक', GK: 'ज्ञातिकारक', DK: 'दारकारक',
}

function dignityTone(dignity: string): Tone {
  const d = dignity.toLowerCase()
  if (d.includes('debil')) return 'caution'
  if (d.includes('exalt') || d.includes('own') || d.includes('moola')) return 'supportive'
  if (d.includes('enemy')) return 'mixed'
  return 'neutral'
}

function snapshotFacts(s: VimshottariLordSnapshot | null, t: T, hi: boolean): { label: string; tone: Tone }[] {
  if (!s) return []
  const facts: { label: string; tone: Tone }[] = []
  const dig = (d: string) => (DIGNITY_KEYS.has(d) ? t(`dignity.${d}`) : d)
  if (s.housesRuled.length) {
    facts.push({
      label: t('facts.rules', { houses: s.housesRuled.map(n => t('facts.house', { n })).join(t('facts.houseSep')) }),
      tone: 'neutral',
    })
  }
  if (s.house != null) facts.push({ label: t('facts.inHouse', { n: s.house }), tone: 'neutral' })
  if (s.dignity) facts.push({ label: t('facts.d1', { dignity: dig(s.dignity) }), tone: dignityTone(s.dignity) })
  if (s.d9Dignity) facts.push({ label: t('facts.d9', { dignity: dig(s.d9Dignity) }), tone: dignityTone(s.d9Dignity) })
  if (s.isVargottama) facts.push({ label: t('facts.vargottama'), tone: 'supportive' })
  if (s.shadbalaBand) {
    facts.push({ label: t('facts.shadbala', { band: BAND_KEYS.has(s.shadbalaBand) ? t(`band.${s.shadbalaBand}`) : s.shadbalaBand }), tone: 'neutral' })
  }
  if (s.bavBindus != null) {
    facts.push({
      label: t('facts.bav', { n: s.bavBindus }),
      tone: s.bavBindus >= 5 ? 'supportive' : s.bavBindus <= 3 ? 'caution' : 'neutral',
    })
  }
  if (s.arohiniKind === 'arohini') facts.push({ label: t('facts.arohini'), tone: 'supportive' })
  if (s.arohiniKind === 'avarohini') facts.push({ label: t('facts.avarohini'), tone: 'mixed' })
  if (s.isRetro) facts.push({ label: t('facts.retro'), tone: 'mixed' })
  if (s.isYogakaraka) facts.push({ label: t('facts.yogakaraka'), tone: 'supportive' })
  if (s.charaKaraka) facts.push({ label: hi ? KARAKA_HI[s.charaKaraka] ?? s.charaKaraka : s.charaKaraka, tone: 'neutral' })
  if (s.isMaraka) facts.push({ label: t('facts.maraka'), tone: 'caution' })
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
  const t = useTranslations('dashaPanel.vim')
  return (
    <div className={styles.upsell}>
      <div className={styles.upsellText}>
        <Crown size={16} aria-hidden style={{ color: 'var(--text-gold)', flex: '0 0 auto', marginTop: 2 }} />
        <div>
          <strong>{t('upsell.title')}</strong>
          {text}
        </div>
      </div>
      <Link href="/pricing" style={{ textDecoration: 'none' }}>
        <Button variant="primary" size="sm">{t('upsell.plans')}</Button>
      </Link>
    </div>
  )
}

function MixBar({ analysis }: { analysis: VimshottariPeriodAnalysis }) {
  const t = useTranslations('dashaPanel.vim')
  const segs: { label: string; value: number; tone: Tone }[] = [
    { label: t('mix.favorable'), value: analysis.favorableShare, tone: 'supportive' },
    { label: t('mix.neutral'), value: analysis.neutralShare, tone: 'mixed' },
    { label: t('mix.challenging'), value: analysis.challengingShare, tone: 'caution' },
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
  const t = useTranslations('dashaPanel.vim')
  if (!passages.length) return null
  return (
    <details className={styles.scriptures}>
      <summary className={styles.scripturesSummary}>
        <ScrollText size={14} aria-hidden />
        {t('scripture.title', { level })}
        <span className={styles.scripturesCount}>{passages.length}</span>
      </summary>
      <div className={styles.scripturesBody}>
        {passages.map((p, i) => (
          <figure key={`${p.source}-${i}`} className={styles.passage}>
            <figcaption className={styles.passageSource}>
              {t(`sources.${p.source}`)}{p.ref ? ` · ${p.ref}` : ''}
            </figcaption>
            <p className={styles.passageText}>{p.text}</p>
          </figure>
        ))}
        <div className={styles.note} style={{ fontStyle: 'italic' }}>
          {t('scripture.disclaimer')}
        </div>
      </div>
    </details>
  )
}

// ── Hero: active period chain ────────────────────────────────

function ChainTile({ node, index, now }: { node: DashaNode; index: number; now: number }) {
  const t = useTranslations('dashaPanel.vim')
  const { lang } = useLang()
  const levelName = t(`levels.${LEVEL_KEYS[index]}`)
  const progress = periodProgress(node, now)
  const remaining = toMs(node.end) - now
  return (
    <div className={cn(styles.chainTile, index === 0 && styles.chainTilePrimary)} style={planetVars(node.lord)}>
      <div className={styles.chainHead}>
        <Disc lord={node.lord} size={index === 0 ? 'lg' : undefined} />
        <div style={{ minWidth: 0 }}>
          <div className={styles.chainLevel}>{levelName}</div>
          <div className={styles.chainName}>{planetName(node.lord, lang)}</div>
        </div>
      </div>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label={t('chain.elapsed', { level: levelName })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className={styles.progressFill} style={{ width: `${Math.max(2, progress * 100)}%` }} />
      </div>
      <div className={styles.chainMeta}>
        <span className={styles.chainDates}>{formatNodeDate(node.start, lang)} → {formatNodeDate(node.end, lang)}</span>
        <span className={styles.chainMetaStrong}>{formatRemaining(remaining, t)}</span>
      </div>
    </div>
  )
}

// ── Period card ──────────────────────────────────────────────

const PHASES = [
  { key: 'phaseStart', label: 'opening' },
  { key: 'phaseMiddle', label: 'middle' },
  { key: 'phaseEnd', label: 'closing' },
] as const

/** Whole-life Mahadasha lane + current Mahadasha's Antardashas, both on one time axis. */
function DashaLifeBand({ nodes, mahaNode, now }: { nodes: DashaNode[]; mahaNode: DashaNode; now: number }) {
  const t = useTranslations('dashaPanel.vim')
  const { lang } = useLang()
  const segments = useMemo<BandSegment[]>(() => {
    const mahas = nodes.filter(n => n.level === 1).length ? nodes.filter(n => n.level === 1) : nodes
    const out: BandSegment[] = mahas.map((n, i) => ({
      key: `m-${i}`,
      start: n.start,
      end: n.end,
      lane: 0,
      color: lordColor(n.lord),
      label: n.lord,
      emphasis: n.isCurrent,
      title: t('band2.mahaTitle', { lord: planetName(n.lord, lang), start: formatNodeDate(n.start, lang), end: formatNodeDate(n.end, lang) }),
    }))
    ;(mahaNode.children ?? []).forEach((a, i) => {
      out.push({
        key: `a-${i}`,
        start: a.start,
        end: a.end,
        lane: 1,
        color: lordColor(a.lord),
        label: a.lord,
        emphasis: a.isCurrent,
        title: `${planetName(mahaNode.lord, lang)}–${planetName(a.lord, lang)} · ${formatNodeDate(a.start, lang)} → ${formatNodeDate(a.end, lang)}`,
      })
    })
    return out
  }, [nodes, mahaNode, t, lang])
  if (!segments.length) return null
  return (
    <TimelineBand
      segments={segments}
      laneLabels={[t('band2.lane'), t('band2.antars', { lord: planetName(mahaNode.lord, lang) })]}
      now={now}
      ticks={8}
      laneHeight={22}
      ariaLabel={t('band2.aria')}
    />
  )
}

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
  scriptureLevel,
}: {
  data: VimshottariInterpretation
  levelLabel: string
  /** Level name for the scripture heading (e.g. "Mahadasha") */
  scriptureLevel?: string
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
  const t = useTranslations('dashaPanel.vim')
  const [expanded, setExpanded] = useState(defaultExpanded)
  const tone = natureTone(data.nature)
  const durationText = durationLabel
    ?? t(data.years === 1 ? 'card.year' : 'card.years', { n: data.years })
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
            <Pill tone={tone}>{natureLabel(data.nature, t)}</Pill>
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
          {expanded ? t('card.less') : t('card.more')}
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
                <div className={styles.boxTitle}><Sparkles size={12} aria-hidden /> {t('card.supportive')}</div>
                <p className={styles.boxText}>
                  <b>{isAntar ? t('card.thisPeriod') : t('card.primary')}</b>{data.primaryPositive}
                </p>
                {data.secondaryBenefits && (
                  <p className={styles.boxText}><b>{t('card.also')}</b>{data.secondaryBenefits}</p>
                )}
              </div>
              <div className={cn(styles.box, styles.toneCaution)}>
                <div className={styles.boxTitle}><ShieldAlert size={12} aria-hidden /> {t('card.risks')}</div>
                {data.negativeEffects
                  ? <p className={styles.boxText}>{data.negativeEffects}</p>
                  : <p className={styles.boxText}>{t('card.fewNegatives')}</p>}
                {data.healthCaution && (
                  <p className={styles.boxText}><b>{t('card.health')}</b>{data.healthCaution}</p>
                )}
              </div>
            </div>

            <div>
              <div className={styles.eyebrow} style={{ marginBottom: '0.45rem' }}>{t('phases.title')}</div>
              <div className={styles.phases}>
                {PHASES.map((p, i) => (
                  <div
                    key={p.key}
                    className={cn(styles.phase, i === phaseIndex && styles.phaseNow, i < phaseIndex && styles.phasePast)}
                  >
                    <div className={styles.phaseHead}>
                      <span className={styles.phaseName}>{t(`phases.${p.label}`)}</span>
                      {i === phaseIndex && <Pill tone="mixed">{t('phases.here')}</Pill>}
                    </div>
                    <p className={styles.phaseText}>{data[p.key]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.events}>
              <Star size={14} aria-hidden style={{ color: 'var(--text-gold)', flex: '0 0 auto', marginTop: 3 }} />
              <div>
                <b>{t('card.lifeEvents')}</b>{data.lifeEvents}
                {antarHint && !isAntar && (
                  <div style={{ marginTop: 4 }}><b>{t('card.currentAntar')}</b>{antarHint}</div>
                )}
                {isAntar && (
                  <div className={styles.note} style={{ marginTop: 4 }}>
                    {t('card.subOnly')}
                  </div>
                )}
              </div>
            </div>

            <ScriptureBlock passages={scriptures} level={scriptureLevel ?? levelLabel} />
          </div>
        ) : (
          <div className={styles.cardBody}>
            <Upsell text={t('upsell.card')} />
          </div>
        )
      )}
    </article>
  )
}

// ── Tab content ──────────────────────────────────────────────

function TimelineBlock({ timeline }: { timeline: VimshottariUpcomingTimeline }) {
  const t = useTranslations('dashaPanel.vim')
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
        <div className={styles.note}>{t('timeline.none')}</div>
      )}
    </div>
  )
}

function TimelineRow({ item }: { item: UpcomingDashaItem }) {
  const t = useTranslations('dashaPanel.vim')
  const { lang } = useLang()
  const tone: Tone = item.tone === 'caution' ? 'caution' : item.tone === 'supportive' ? 'supportive' : 'mixed'
  const isMaha = item.kind === 'maha'
  return (
    <li className={styles.railItem}>
      <Disc lord={item.lord} size="sm" />
      <div className={cn(styles.railBody, isMaha && styles.railMaha)}>
        <div className={styles.railTop}>
          <span className={styles.railLabel}>{item.label}</span>
          <Pill tone={tone}>{item.toneLabel}</Pill>
          {isMaha && <Pill tone="neutral">{t('timeline.nextMaha')}</Pill>}
        </div>
        <div className={styles.railDates}>
          {formatShortDate(item.startIso, lang)} → {formatShortDate(item.endIso, lang)}
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
  const t = useTranslations('dashaPanel.vim')
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
                <Pill tone={strengthTone(a.strength)}>{t(`strength.${a.strength}`)}</Pill>
              </div>
              <div className={styles.meter} aria-hidden>
                {[1, 2, 3].map(n => (
                  <span key={n} className={cn(styles.meterSeg, n <= level && styles.meterOn)} />
                ))}
              </div>
              <p className={styles.areaNote}>{a.note}</p>
              {a.houses.length > 0 && (
                <span className={styles.areaHouses}>{t('areas.houses', { list: a.houses.map(n => t('facts.house', { n })).join(' · ') })}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GocharBlock({ overlay }: { overlay: DashaGocharOverlay | null }) {
  const t = useTranslations('dashaPanel.vim')
  const { lang } = useLang()
  if (!overlay) {
    return (
      <div className={styles.section}>
        <p className={styles.sectionLead}>{t('gochar.loading')}</p>
      </div>
    )
  }
  return (
    <div className={styles.section}>
      <p className={styles.sectionLead}>
        {overlay.summary} <em>{t('gochar.asOf', { date: lang === 'hi' ? formatShortDate(overlay.asOfLabel, lang) : overlay.asOfLabel })}</em>
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
  const t = useTranslations('dashaPanel.vim')
  const { lang } = useLang()
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
                  <span className={styles.linkName}>{planetName(l.lord, lang)}</span>
                  <span className={styles.linkRole}>{t(`delivery.${l.role}`)}</span>
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
  const t = useTranslations('dashaPanel.vim')
  return (
    <div className={styles.section}>
      <p className={styles.sectionLead}>
        {t('delivery.lead')}
      </p>
      <ChainRow title={t('delivery.mahaChain')} chain={analysis.dispositorChains.mahadasha} />
      {analysis.dispositorChains.antardasha && (
        <>
          <hr className={styles.divider} />
          <ChainRow title={t('delivery.antarChain')} chain={analysis.dispositorChains.antardasha} />
        </>
      )}
    </div>
  )
}

const NEED_TONE: Record<RemedyNeed, Tone> = {
  high: 'caution',
  moderate: 'mixed',
  low: 'supportive',
}

const REMEDY_LEVEL_KEY: Record<string, (typeof LEVEL_KEYS)[number]> = {
  Mahadasha: 'maha', Antardasha: 'antar', Pratyantardasha: 'pratya',
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
  const tr = useTranslations('dashaPanel.vim')
  const { lang, hi } = useLang()
  return (
    <div className={styles.section}>
      <p className={styles.sectionLead}>
        {tr('remedies.lead', { rule: remedyKeyRule(lang) })}
      </p>
      {remedies.map(({ levels, assessment: a }) => {
        const t = a.teaching
        const need = { tone: NEED_TONE[a.need], label: tr(`remedies.${a.need}`) }
        const deities = [...t.deities, `${a.nakshatraDeity} (${a.nakshatraName})`]
        return (
          <div key={a.grahaId} className={cn(styles.card, toneClass(need.tone))}>
            <div className={styles.cardHead} style={{ cursor: 'default' }}>
              <Disc lord={a.grahaId} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className={styles.eyebrow}>{levels.map(l => tr(`levels.${REMEDY_LEVEL_KEY[l]}`)).join(' · ')}</span>
                <div className={styles.cardTitleRow}>
                  <h3 className={styles.cardTitle}>{hi && t.sanskrit === t.name ? t.name : `${t.name} · ${t.sanskrit}`}</h3>
                  <Pill tone={need.tone}>{need.label}</Pill>
                </div>
                <div className={styles.cardSub}>
                  {a.reasons.length > 0 ? a.reasons.join(' · ') : tr('remedies.noAffliction')}
                </div>
                <div className={styles.cardSub}>
                  <b>{tr('remedies.deities')}</b> {deities.join(' · ')}
                </div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.duo}>
                <RemedyList title={tr('remedies.indications')} items={t.indications} />
                <RemedyList title={tr('remedies.behavioral')} items={t.behavioral} />
              </div>
              {canExpandDetails ? (
                <>
                  <div className={styles.duo}>
                    <RemedyList title={tr('remedies.spiritual')} items={t.spiritual} />
                    <RemedyList title={tr('remedies.daan')} items={[...t.donation, ...t.seva]} />
                  </div>
                  {t.notes.map(n => (
                    <div key={n} className={cn(styles.callout, styles.toneCaution)}>
                      <AlertTriangle size={15} aria-hidden className={styles.calloutIcon} />
                      <span>{n}</span>
                    </div>
                  ))}
                  {t.duration && <div className={styles.note}>{tr('remedies.duration', { d: t.duration })}</div>}
                </>
              ) : (
                <div className={styles.note}>
                  <Lock size={11} aria-hidden /> {tr('remedies.locked')}
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
  const t = useTranslations('dashaPanel.vim')
  const { lang, hi } = useLang()
  const canExpandDetails = planMeetsUiGate(userPlan, 'gold')
  const canTagEvents = planMeetsUiGate(userPlan, 'platinum')
  const [transitPositions, setTransitPositions] = useState<TransitPosition[] | null>(null)
  const [eventLabel, setEventLabel] = useState<string>(DASHA_EVENT_LABELS[0][0])
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
      lang,
    }),
    [nodes, ascRashi, grahas, shadbala, ashtakavarga, navamshaGrahas, lang],
  )

  const tattvaOverlay = useMemo(
    () => analyzeTattvaDashaOverlay(grahas, nodes),
    [grahas, nodes],
  )
  const moonGuidance = tattvaOverlay?.predictMode === 'guidance'

  const timeline = useMemo(
    () => buildUpcomingVimshottariTimeline(nodes, Date.now(), 5, lang),
    [nodes, lang],
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
    () => localizeDashaLordRemedies(computeDashaLordRemedies(activePath.map(n => n.lord), grahas, shadbala), lang),
    [activePath, grahas, shadbala, lang],
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
      lang,
    })
  }, [transitPositions, activePath, ascRashi, grahas, lang])

  if (activePath.length < 1) return null

  const maha = getVimshottariInterpretation(activePath[0].lord, lang)
  if (!maha) return null

  const mahaNode = activePath[0]
  const antarNode = activePath[1] ?? null
  const pratyaNode = activePath[2] ?? null
  const antarHint = antarNode
    ? getVimshottariAntarHint(mahaNode.lord, antarNode.lord, lang)
    : null
  const antarYears = antarNode ? durationMsToYears(antarNode.durationMs) : 0
  const antar = antarNode
    ? buildVimshottariAntarInterpretation(mahaNode.lord, antarNode.lord, antarYears, lang)
    : null
  const antarDurationLabel = antarNode
    ? formatVimshottariDurationYears(antarYears, lang)
    : null
  const pratyaYears = pratyaNode ? durationMsToYears(pratyaNode.durationMs) : 0
  const pratya = antarNode && pratyaNode
    ? buildVimshottariPratyantarInterpretation(
      mahaNode.lord,
      antarNode.lord,
      pratyaNode.lord,
      pratyaYears,
      lang,
    )
    : null
  const pratyaDurationLabel = pratyaNode
    ? formatVimshottariDurationYears(pratyaYears, lang)
    : null
  const mahaScriptures = getVimshottariMahaScriptures(mahaNode.lord, lang)
  const antarScriptures = antarNode
    ? getVimshottariAntarScriptures(mahaNode.lord, antarNode.lord, lang)
    : []
  const pratyaScriptures = antarNode && pratyaNode
    ? getVimshottariPratyantarScriptures(mahaNode.lord, antarNode.lord, pratyaNode.lord, lang)
    : []

  const chainNodes = activePath.slice(0, 3)
  const heroTone: Tone = analysis ? insightTone(analysis.insight.toneLabel) : natureTone(maha.nature)
  const cautionFlags = analysis ? analysis.flags.filter(f => f.tone === 'caution').slice(0, 4) : []
  const signals = analysis
    ? [
      analysis.d9Note && { title: t('signals.navamsha'), text: analysis.d9Note, icon: Layers },
      analysis.charaKarakaNote && { title: t('signals.chara'), text: analysis.charaKarakaNote, icon: Crown },
      analysis.yogakarakaNote && { title: t('signals.yogakaraka'), text: analysis.yogakarakaNote, icon: Sparkles },
      analysis.lagnaSpecialNote && { title: t('signals.lagna'), text: analysis.lagnaSpecialNote, icon: Star },
    ].filter(Boolean) as { title: string; text: string; icon: React.ElementType }[]
    : []

  async function saveDashaEvent() {
    if (!chartId || !canTagEvents || eventSaving) return
    const text = eventNote.trim()
    if (!text) {
      setEventMsg(t('notes.empty'))
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
        setEventMsg(body?.error || t('notes.failed'))
      } else {
        setEventNote('')
        setEventMsg(t('notes.saved'))
      }
    } catch {
      setEventMsg(t('notes.failed'))
    } finally {
      setEventSaving(false)
    }
  }

  const goldUpsell = t('upsell.tabs')
  const toneText = analysis ? analysis.insight.toneText ?? analysis.insight.toneLabel : ''

  return (
    <div className={styles.panel}>
      {/* ── Hero ── */}
      <section className={cn(styles.hero, toneClass(heroTone))} aria-label={t('hero.aria')}>
        <div className={styles.heroTop}>
          <span className={styles.eyebrow}>{t('hero.eyebrow')}</span>
          {analysis && <Pill tone={heroTone}>{toneText}</Pill>}
        </div>

        <div className={styles.chain} style={{ '--chain-cols': chainNodes.length } as React.CSSProperties}>
          {chainNodes.map((node, i) => (
            <ChainTile key={`${node.lord}-${i}`} node={node} index={i} now={now} />
          ))}
        </div>

        <DashaLifeBand nodes={nodes} mahaNode={mahaNode} now={now} />

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
            <span><strong>{t('hero.watch')}</strong>{analysis.insight.watch}</span>
          </div>
        )}

        {moonGuidance && (
          <div className={cn(styles.callout, styles.toneCaution)}>
            <Moon size={15} aria-hidden className={styles.calloutIcon} />
            <span>
              <strong>{t('hero.moonTitle')}</strong>
              {t('hero.moonText')}
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
      <div className={styles.tabs} role="tablist" aria-label={t('tabsAria')}>
        {TABS.map(tb => {
          const Icon = tb.icon
          const locked = tb.gold && !canExpandDetails
          return (
            <button
              key={tb.id}
              type="button"
              role="tab"
              id={`dasha-tab-${tb.id}`}
              aria-selected={tab === tb.id}
              aria-controls={`dasha-panel-${tb.id}`}
              className={cn(styles.tab, tab === tb.id && styles.tabActive, locked && styles.tabLock)}
              onClick={() => setTab(tb.id)}
            >
              <Icon size={14} aria-hidden />
              {t(`tabs.${tb.id}`)}
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
              levelLabel={t('card.activeMaha')}
              scriptureLevel={t('levels.maha')}
              facts={snapshotFacts(analysis?.mahadasha ?? null, t, hi)}
              scriptures={mahaScriptures}
              progress={periodProgress(mahaNode, now)}
              defaultExpanded={canExpandDetails}
              canExpandDetails={canExpandDetails}
            />
            {antar && antarNode && (
              <PlanetCard
                data={antar}
                levelLabel={t('card.activeAntar')}
                scriptureLevel={t('levels.antar')}
                facts={snapshotFacts(analysis?.antardasha ?? null, t, hi)}
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
                levelLabel={t('card.activePratya')}
                scriptureLevel={t('levels.pratya')}
                facts={snapshotFacts(analysis?.pratyantardasha ?? null, t, hi)}
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
            <Tag size={12} aria-hidden /> {t('notes.title')}
          </div>
          {!chartId ? (
            <p className={styles.sectionLead}>
              {t('notes.saveFirst')}{' '}
              <Link href="/clients" className={styles.textLink}>{t('notes.crm')}</Link>.
            </p>
          ) : (
            <>
              <p className={styles.sectionLead}>
                {t('notes.logBefore')}{' '}
                <b>{planetName(mahaNode.lord, lang)}{antarNode ? ` / ${planetName(antarNode.lord, lang)}` : ''}</b> {t('notes.logAfter')}
              </p>
              <div className={styles.eventRow}>
                <select
                  value={eventLabel}
                  onChange={e => setEventLabel(e.target.value)}
                  className={styles.control}
                  aria-label={t('notes.typeAria')}
                >
                  {DASHA_EVENT_LABELS.map(([value, key]) => (
                    <option key={value} value={value}>{t(`events.${key}`)}</option>
                  ))}
                </select>
                <input
                  value={eventNote}
                  onChange={e => setEventNote(e.target.value)}
                  placeholder={t('notes.placeholder')}
                  maxLength={500}
                  className={cn(styles.control, styles.controlGrow)}
                  aria-label={t('notes.noteAria')}
                />
                <Button variant="secondary" size="sm" onClick={() => void saveDashaEvent()} disabled={eventSaving}>
                  {eventSaving ? t('notes.saving') : t('notes.save')}
                </Button>
              </div>
              {eventMsg && <div className={styles.note}>{eventMsg}</div>}
              <Link href="/clients" className={styles.textLink}>{t('notes.openCrm')}</Link>
            </>
          )}
        </div>
      )}

      <div className={styles.footer}>
        <p>{getVimshottariResultHierarchy(lang)}</p>
        <p>{t('footer')}</p>
      </div>
    </div>
  )
}
