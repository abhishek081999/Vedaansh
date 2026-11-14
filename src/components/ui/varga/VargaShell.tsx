// ─────────────────────────────────────────────────────────────
//  src/components/ui/varga/VargaShell.tsx
//  Shared shell for every divisional-chart (varga) analysis view.
//  Order is fixed for all vargas: Hero → Stats → Charts → grouped tabs → section.
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useState } from 'react'
import { ArrowRight, Info, ShieldCheck, Star, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { Legend, SegmentRing } from '@/components/ui/viz'
import { cn } from '@/lib/ui/cn'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import styles from './VargaWorkspace.module.css'

export { styles as vargaStyles }

export type VargaTone = 'supportive' | 'challenging' | 'mixed' | 'neutral'
export type VargaInsightKind = 'strength' | 'caution' | 'highlight' | 'info'
export type VargaAccent = 'teal' | 'rose' | 'gold' | 'blue'

// ── Class helpers ────────────────────────────────────────────

export function toneClass(tone: VargaTone | string): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

export function insightClass(kind: VargaInsightKind | string): string {
  if (kind === 'strength') return styles.insightStrength
  if (kind === 'caution') return styles.insightCaution
  if (kind === 'highlight') return styles.insightHighlight
  return styles.insightInfo
}

export function accentClass(accent?: VargaAccent): string | undefined {
  if (accent === 'teal') return styles.accentTeal
  if (accent === 'rose') return styles.accentRose
  if (accent === 'gold') return styles.accentGold
  if (accent === 'blue') return styles.accentBlue
  return undefined
}

export function toneAccent(tone: VargaTone | string): VargaAccent {
  if (tone === 'supportive') return 'teal'
  if (tone === 'challenging') return 'rose'
  if (tone === 'mixed') return 'gold'
  return 'blue'
}

export function toneToKind(tone: VargaTone | string): VargaInsightKind {
  if (tone === 'supportive') return 'strength'
  if (tone === 'challenging') return 'caution'
  if (tone === 'mixed') return 'highlight'
  return 'info'
}

export function dignityPill(dignity: string): string | null {
  if (dignity === 'exalted' || dignity === 'moolatrikona' || dignity === 'own') return styles.pillStrong
  if (dignity === 'debilitated' || dignity === 'enemy' || dignity === 'great_enemy') return styles.pillWeak
  return null
}

export function compactDashaPath(pathLabel: string): string {
  const parts = pathLabel.split(/\s*\/\s*/).filter(Boolean)
  if (parts.length <= 1) return pathLabel
  const out: string[] = []
  for (const p of parts) {
    if (out[out.length - 1] !== p) out.push(p)
  }
  return out.join(' / ')
}

// ── Frame ────────────────────────────────────────────────────

export function VargaWorkspace({ varga, children }: { varga: string; children: React.ReactNode }) {
  return (
    <div className={styles.workspace} data-varga={varga}>
      {children}
    </div>
  )
}

// ── Hero ─────────────────────────────────────────────────────

export interface VargaBadge {
  key: string
  label: React.ReactNode
  tone?: 'gold' | 'teal' | 'rose' | 'plain'
  Icon?: LucideIcon
  title?: string
}

export interface VargaStat {
  key: string
  label: React.ReactNode
  value: React.ReactNode
  hint?: React.ReactNode
  Icon: LucideIcon
  accent?: VargaAccent
}

export interface VargaJourney {
  /** D1 lagna sign name */
  from: React.ReactNode
  /** This varga's lagna sign name */
  to: React.ReactNode
  pair?: React.ReactNode
  tone?: VargaTone | string
  title?: string
}

const MAX_BADGES = 4

function badgeClass(tone: VargaBadge['tone']): string | undefined {
  if (tone === 'gold') return styles.badgeGold
  if (tone === 'teal') return styles.badgeTeal
  if (tone === 'rose') return styles.badgeRose
  return undefined
}

export function VargaHero({
  varga,
  eyebrow,
  title,
  sanskrit,
  summary,
  badges = [],
  journey,
  stats,
}: {
  varga: string
  eyebrow: string
  title: React.ReactNode
  sanskrit?: React.ReactNode
  summary?: React.ReactNode
  badges?: (VargaBadge | false | null | undefined | '' | 0)[]
  journey?: VargaJourney
  stats: VargaStat[]
}) {
  const t = useTranslations('divisional.common.shell')
  const [allBadges, setAllBadges] = useState(false)
  const [fullSummary, setFullSummary] = useState(false)
  const longSummary = typeof summary === 'string' && summary.length > 220
  const list = badges.filter(Boolean) as VargaBadge[]
  const shown = allBadges ? list : list.slice(0, MAX_BADGES)
  const hidden = list.length - shown.length

  return (
    <header className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden />
      <div className={styles.heroTop}>
        <div className={styles.heroIntro}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden />
            {eyebrow.includes(varga) ? eyebrow : `${varga} · ${eyebrow}`}
          </p>
          <h2 className={styles.heroTitle}>
            {title}
            {sanskrit && <span className={styles.heroSanskrit}> · {sanskrit}</span>}
          </h2>
          {summary && (
            <p className={cn(styles.heroSub, longSummary && !fullSummary && styles.heroSubClamp)}>{summary}</p>
          )}
          {longSummary && (
            <button type="button" className={styles.readMore} onClick={() => setFullSummary((v) => !v)} aria-expanded={fullSummary}>
              {fullSummary ? t('readLess') : t('readMore')}
            </button>
          )}
          {list.length > 0 && (
            <div className={styles.badgeRow}>
              {shown.map((b) => (
                <span key={b.key} className={cn(styles.badge, badgeClass(b.tone))} title={b.title}>
                  {b.Icon && <b.Icon size={12} aria-hidden />}
                  {b.label}
                </span>
              ))}
              {hidden > 0 && (
                <button type="button" className={cn(styles.badge, styles.badgeMore)} onClick={() => setAllBadges(true)}>
                  {t('moreBadges', { n: hidden })}
                </button>
              )}
            </div>
          )}
        </div>

        {journey && (
          <div className={styles.journey} aria-label={t('journeyAria')}>
            <div className={styles.journeyNode}>
              <div className={styles.journeyLabel}>{t('journeyLagna', { varga: 'D1' })}</div>
              <div className={styles.journeySign}>{journey.from}</div>
            </div>
            <div className={styles.journeyLink}>
              <ArrowRight size={16} aria-hidden />
              {journey.pair && (
                <span
                  className={cn(styles.pill, journey.tone ? toneClass(journey.tone) : undefined)}
                  title={journey.title}
                  style={{ margin: 0 }}
                >
                  {journey.pair}
                </span>
              )}
            </div>
            <div className={cn(styles.journeyNode, styles.journeyNodeFocus)}>
              <div className={styles.journeyLabel}>{t('journeyLagna', { varga })}</div>
              <div className={styles.journeySign}>{journey.to}</div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.statGrid}>
        {stats.map((s) => (
          <div key={s.key} className={cn(styles.statCard, accentClass(s.accent))}>
            <span className={styles.statIcon} aria-hidden>
              <s.Icon size={15} />
            </span>
            <div className={styles.statBody}>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue} title={typeof s.value === 'string' ? s.value : undefined}>
                {s.value}
              </div>
              {s.hint && (
                <div className={styles.statHint} title={typeof s.hint === 'string' ? s.hint : undefined}>
                  {s.hint}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </header>
  )
}

// ── Charts (D1 + focus varga; one-at-a-time switch on narrow screens) ──

/** "D7 · Saptamsha" → "Saptamsha" when shown next to its own D7 tag. */
function withoutTag(title: string, tag: string): string {
  if (!title.startsWith(tag)) return title
  return title.slice(tag.length).replace(/^\s*[·:-]\s*/, '').trim() || title
}

export interface VargaFocusChart {
  tag: string
  title: string
  accent?: React.ReactNode
  ascRashi: Rashi
  grahas: GrahaData[]
  vargaName: string
  highlightHouses?: number[]
}

export function VargaCharts({
  chart,
  d1Title,
  d1Accent,
  focus,
}: {
  chart: ChartOutput
  d1Title: string
  d1Accent?: React.ReactNode
  focus: VargaFocusChart
}) {
  const t = useTranslations('divisional.common.shell')
  const [show, setShow] = useState<'d1' | 'focus'>('focus')
  const d1Label = withoutTag(d1Title, 'D1')
  const focusLabel = withoutTag(focus.title, focus.tag)
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0

  return (
    <div className={styles.chartsBlock}>
      <div className={styles.chartSwitch} role="tablist" aria-label={t('chartSwitchAria')}>
        {(['focus', 'd1'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={show === k}
            className={cn(styles.chartSwitchBtn, show === k && styles.chartSwitchBtnActive)}
            onClick={() => setShow(k)}
          >
            {k === 'd1' ? t('chartD1', { title: d1Label }) : `${focus.tag} · ${focusLabel}`}
          </button>
        ))}
      </div>
      <div className={styles.chartsRow} data-show={show}>
        <div className={cn(styles.chartCard, styles.chartCardBase)}>
          <div className={styles.chartLabel}>
            <span className={styles.chartTitle}>
              <span className={styles.chartTag}>D1</span>
              {d1Label}
            </span>
            {d1Accent && <span className={styles.chartAccent}>{d1Accent}</span>}
          </div>
          <ChakraSelector
            ascRashi={chart.lagnas.ascRashi as Rashi}
            grahas={chart.vargas?.D1 ?? chart.grahas}
            vargaName="D1"
            moonNakIndex={moonNakIndex}
            arudhas={chart.arudhas}
            tithiNumber={chart.panchang.tithi.number}
            varaNumber={chart.panchang.vara.number}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
          />
        </div>
        <div className={cn(styles.chartCard, styles.chartCardFocus)}>
          <div className={styles.chartLabel}>
            <span className={styles.chartTitle}>
              <span className={styles.chartTag}>{focus.tag}</span>
              {focusLabel}
            </span>
            {focus.accent && <span className={styles.chartAccent}>{focus.accent}</span>}
          </div>
          <ChakraSelector
            ascRashi={focus.ascRashi}
            grahas={focus.grahas}
            vargaName={focus.vargaName}
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={focus.highlightHouses}
          />
        </div>
      </div>
    </div>
  )
}

// ── Grouped tabs ─────────────────────────────────────────────

export interface VargaTabDef<T extends string> {
  id: T
  Icon: LucideIcon
  label: string
  short: string
  hint?: string
}

export interface VargaTabGroup<T extends string> {
  key: string
  label: string
  tabs: VargaTabDef<T>[]
}

export function VargaTabNav<T extends string>({
  groups,
  active,
  onChange,
  ariaLabel,
}: {
  groups: VargaTabGroup<T>[]
  active: T
  onChange: (id: T) => void
  ariaLabel: string
}) {
  return (
    <nav className={styles.tabNav} aria-label={ariaLabel}>
      <div className={styles.tabRow} role="tablist">
        {groups.map((g) => (
          <div key={g.key} className={styles.tabGroup} role="presentation">
            <span className={styles.tabGroupLabel}>{g.label}</span>
            {g.tabs.map((tb) => {
              const on = tb.id === active
              return (
                <button
                  key={tb.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  title={tb.hint ?? tb.label}
                  className={cn(styles.tabBtn, on && styles.tabBtnActive)}
                  onClick={() => onChange(tb.id)}
                >
                  <tb.Icon size={14} strokeWidth={on ? 2.25 : 2} aria-hidden />
                  <span className={styles.tabLabelFull}>{tb.label}</span>
                  <span className={styles.tabLabelShort}>{tb.short}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </nav>
  )
}

export type VargaGroupKey = 'read' | 'themes' | 'chart' | 'depth'

export interface VargaTabSpec<T extends string> {
  id: T
  Icon: LucideIcon
  group: VargaGroupKey
}

const GROUP_ORDER: VargaGroupKey[] = ['read', 'themes', 'chart', 'depth']

/**
 * Builds grouped tabs (Read / Themes / Chart / Depth) from a varga's tab list.
 * `label(id)` / `short(id)` resolve the varga's own tab strings.
 */
export function useVargaTabGroups<T extends string>(
  tabs: VargaTabSpec<T>[],
  label: (id: T) => string,
  short: (id: T) => string,
): VargaTabGroup<T>[] {
  const t = useTranslations('divisional.common.shell.groups')
  return GROUP_ORDER.map((key) => ({
    key,
    label: t(key),
    tabs: tabs.filter((tb) => tb.group === key).map((tb) => ({ id: tb.id, Icon: tb.Icon, label: label(tb.id), short: short(tb.id) })),
  })).filter((g) => g.tabs.length > 0)
}

export function tabIconMap<T extends string>(tabs: { id: T; Icon: LucideIcon }[]): Record<T, LucideIcon> {
  return Object.fromEntries(tabs.map((tb) => [tb.id, tb.Icon])) as Record<T, LucideIcon>
}

// ── Sections & cards ─────────────────────────────────────────

export function VargaSectionHead({
  Icon,
  title,
  hint,
  style,
}: {
  Icon?: LucideIcon
  title: React.ReactNode
  hint?: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div className={styles.sectionHead} style={style}>
      {Icon && (
        <span className={styles.sectionIcon} aria-hidden>
          <Icon size={16} />
        </span>
      )}
      <div className={styles.sectionHeadText}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        {hint && <p className={styles.sectionHint}>{hint}</p>}
      </div>
      <div className={styles.sectionRule} />
    </div>
  )
}

export function VargaSection({
  Icon,
  title,
  hint,
  children,
  className,
}: {
  Icon?: LucideIcon
  title: React.ReactNode
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn(styles.section, className)}>
      <VargaSectionHead Icon={Icon} title={title} hint={hint} />
      {children}
    </section>
  )
}

const INSIGHT_ICON: Record<VargaInsightKind, LucideIcon> = {
  strength: ShieldCheck,
  caution: TriangleAlert,
  highlight: Star,
  info: Info,
}

export function VargaInsight({
  kind,
  title,
  kicker,
  children,
  className,
  Icon,
  wide,
}: {
  kind: VargaInsightKind | string
  title?: React.ReactNode
  kicker?: string
  children?: React.ReactNode
  className?: string
  Icon?: LucideIcon
  wide?: boolean
}) {
  const I = Icon ?? INSIGHT_ICON[(kind as VargaInsightKind)] ?? Info
  return (
    <article className={cn(styles.insightCard, styles.insightCardIcon, insightClass(kind), wide && styles.insightWide, className)}>
      <span className={styles.insightIcon} aria-hidden>
        <I size={14} />
      </span>
      <div className={styles.insightBody}>
        {kicker && <span className={styles.insightKicker}>{kicker}</span>}
        {title && <h4 className={styles.insightTitle}>{title}</h4>}
        {children}
      </div>
    </article>
  )
}

/** Overview insight grid — the same treatment for every varga. */
export function VargaInsightGrid({ insights }: { insights: { kind: string; title: string; text: string }[] }) {
  return (
    <div className={styles.insightGrid}>
      {insights.map((ins, i) => (
        <VargaInsight key={`${ins.kind}-${i}-${ins.title}`} kind={ins.kind} kicker={ins.title}>
          <p className={styles.insightText}>{ins.text}</p>
        </VargaInsight>
      ))}
    </div>
  )
}

const BALANCE_ORDER: VargaInsightKind[] = ['strength', 'highlight', 'info', 'caution']
const BALANCE_COLOR: Record<VargaInsightKind, string> = {
  strength: 'var(--teal, #0d9488)',
  highlight: 'var(--gold)',
  info: 'var(--blue, #3b82f6)',
  caution: 'var(--rose, #e11d48)',
}

/** Signal balance ring: how the varga's readings split across strengths and cautions. */
export function VargaSignalBalance({ kinds }: { kinds: string[] }) {
  const t = useTranslations('divisional.common.shell.balance')
  const counts = BALANCE_ORDER.map((k) => ({ k, n: kinds.filter((x) => x === k).length })).filter((x) => x.n > 0)
  if (counts.length === 0) return null
  const total = counts.reduce((s, x) => s + x.n, 0)
  return (
    <div className={styles.balance}>
      <div className={styles.balanceRing}>
        <SegmentRing
          size={96}
          thickness={12}
          showLabels={false}
          centerValue={total}
          ariaLabel={t('title')}
          segments={counts.map(({ k, n }) => ({ label: t(k), value: n, max: n, color: BALANCE_COLOR[k], title: `${t(k)}: ${n}` }))}
        />
      </div>
      <div className={styles.balanceBody}>
        <p className={styles.balanceTitle}>{t('title')}</p>
        <Legend items={counts.map(({ k, n }) => ({ label: `${t(k)} · ${n}`, color: BALANCE_COLOR[k] }))} />
        <p className={styles.balanceCaption}>{t('caption')}</p>
      </div>
    </div>
  )
}
