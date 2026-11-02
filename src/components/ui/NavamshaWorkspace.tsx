// ─────────────────────────────────────────────────────────────
//  src/components/ui/NavamshaWorkspace.tsx
//  Dedicated Navamsha (D9) workspace — D1/D9 charts, mapping & predictions
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Briefcase,
  ChevronDown,
  Compass,
  Crown,
  Gauge,
  Gem,
  GitCompare,
  Heart,
  Hourglass,
  Info,
  Layers,
  Link2,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  TriangleAlert,
  UserRound,
  Users,
  Waypoints,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell, PlanGate } from '@/components/ui/patterns'
import { NavamshaPredictionsPanel } from '@/components/ui/NavamshaPredictionsPanel'
import {
  analyzeNavamsha,
  NAVAMSHA_VARIANT_LABELS,
  type DashaTone,
  type NavamshaInsight,
  type NavamshaVariantId,
} from '@/lib/engine/navamshaAnalysis'
import { GRAHA_DISPLAY_COLOR } from '@/lib/engine/grahaDisplayColors'
import { RASHI_SHORT } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import type { ChartOutput, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import styles from './NavamshaWorkspace.module.css'

type TabId =
  | 'overview'
  | 'predictions'
  | 'mapping'
  | 'relations'
  | 'advanced'
  | 'vargottama'
  | 'marriage'
  | 'spouse'
  | 'dasha'
  | 'destiny'
  | 'houses'
  | 'variants'

type IconType = typeof Star

interface TabDef {
  id: TabId
  label: string
  shortLabel: string
  Icon: IconType
  hint: string
}

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', Icon: Sparkles, hint: 'Key Navamsha themes at a glance' },
  { id: 'predictions', label: 'Predictions', shortLabel: 'Predict', Icon: ScrollText, hint: 'Planet-by-planet readings and triggered rules' },
  { id: 'destiny', label: 'Destiny', shortLabel: 'Destiny', Icon: Compass, hint: 'Dharma, Karakamsha and the soul’s direction' },
  { id: 'mapping', label: 'D1 → D9 Mapping', shortLabel: 'Mapping', Icon: ArrowRight, hint: 'Where each natal planet lands in Navamsha' },
  { id: 'relations', label: 'D1↔D9 Relations', shortLabel: 'Relations', Icon: Link2, hint: 'Sign-count links between Rashi and Navamsha' },
  { id: 'houses', label: 'D9 Houses', shortLabel: 'Houses', Icon: Layers, hint: 'All twelve Navamsha bhavas' },
  { id: 'vargottama', label: 'Vargottama & Pushkara', shortLabel: 'Vargottama', Icon: Gem, hint: 'Specially strengthened placements' },
  { id: 'marriage', label: 'Marriage', shortLabel: 'Marriage', Icon: Heart, hint: '7th house, its lord and partnership notes' },
  { id: 'spouse', label: 'Spouse Sketch', shortLabel: 'Spouse', Icon: Users, hint: 'Indicated nature of the partner' },
  { id: 'dasha', label: 'Dasha × D9', shortLabel: 'Dasha', Icon: Hourglass, hint: 'Running Vimshottari lords read through Navamsha' },
  { id: 'advanced', label: 'Advanced', shortLabel: 'Advanced', Icon: Waypoints, hint: 'Dispositors, exchanges, conjunctions and scores' },
  { id: 'variants', label: 'D9 Variants', shortLabel: 'Variants', Icon: GitCompare, hint: 'Parashara vs Pada, Nadi and Somanatha schemes' },
]

const TAB_BY_ID = Object.fromEntries(TABS.map((t) => [t.id, t])) as Record<TabId, TabDef>

const TAB_GROUPS: { label: string; tabs: TabId[] }[] = [
  { label: 'Read', tabs: ['overview', 'predictions', 'destiny'] },
  { label: 'Chart', tabs: ['mapping', 'relations', 'houses', 'vargottama'] },
  { label: 'Marriage', tabs: ['marriage', 'spouse'] },
  { label: 'Depth', tabs: ['dasha', 'advanced', 'variants'] },
]

function compactDashaPath(pathLabel: string): string {
  const parts = pathLabel.split(/\s*\/\s*/).filter(Boolean)
  if (parts.length <= 1) return pathLabel
  const out: string[] = []
  for (const p of parts) {
    if (out[out.length - 1] !== p) out.push(p)
  }
  return out.join(' / ')
}

const VARIANT_COLS: Exclude<NavamshaVariantId, 'D9'>[] = ['D9_Pada', 'D9_Nadi', 'D9_Somanatha']

function insightClass(kind: NavamshaInsight['kind']): string {
  if (kind === 'strength') return styles.insightStrength
  if (kind === 'caution') return styles.insightCaution
  if (kind === 'highlight') return styles.insightHighlight
  return styles.insightInfo
}

const INSIGHT_ICON: Record<NavamshaInsight['kind'], IconType> = {
  strength: ShieldCheck,
  caution: TriangleAlert,
  highlight: Star,
  info: Info,
}

function dignityPill(dignity: string): string | null {
  if (dignity === 'exalted' || dignity === 'moolatrikona' || dignity === 'own') return styles.pillStrong
  if (dignity === 'debilitated' || dignity === 'enemy' || dignity === 'great_enemy') return styles.pillWeak
  return null
}

function toneClass(tone: DashaTone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

function scoreClass(score: number): string {
  if (score >= 65) return styles.accentTeal
  if (score <= 40) return styles.accentRose
  return styles.accentGold
}

function planetStyle(id: GrahaId): React.CSSProperties {
  return { ['--planet' as string]: GRAHA_DISPLAY_COLOR[id] ?? 'var(--gold)' }
}

function PlanetTag({ id, name }: { id: GrahaId; name: string }) {
  return (
    <span className={styles.planetTag}>
      <span className={styles.planetDot} style={planetStyle(id)} aria-hidden />
      {name}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const rounded = Math.round(score)
  const pct = Math.max(0, Math.min(100, rounded))
  return (
    <span className={cn(styles.scoreBar, scoreClass(rounded))} title={`D9 strength ${rounded}/100`}>
      <span className={styles.scoreTrack}>
        <span className={styles.scoreFill} style={{ width: `${pct}%` }} />
      </span>
      <span className={styles.scoreNum}>{rounded}</span>
    </span>
  )
}

function SectionHead({ tab, title }: { tab: TabId; title?: string }) {
  const def = TAB_BY_ID[tab]
  return (
    <div className={styles.sectionHead}>
      <span className={styles.sectionIcon} aria-hidden>
        <def.Icon size={16} />
      </span>
      <div className={styles.sectionHeadText}>
        <h3 className={styles.sectionTitle}>{title ?? def.label}</h3>
        <p className={styles.sectionHint}>{def.hint}</p>
      </div>
      <div className={styles.sectionRule} />
    </div>
  )
}

function Insight({
  kind,
  title,
  kicker,
  children,
  className,
  Icon,
}: {
  kind: NavamshaInsight['kind']
  title?: React.ReactNode
  kicker?: string
  children: React.ReactNode
  className?: string
  Icon?: IconType
}) {
  const I = Icon ?? INSIGHT_ICON[kind]
  return (
    <article className={cn(styles.insightCard, insightClass(kind), className)}>
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

function toneToKind(tone: DashaTone): NavamshaInsight['kind'] {
  if (tone === 'supportive') return 'strength'
  if (tone === 'challenging') return 'caution'
  if (tone === 'mixed') return 'highlight'
  return 'info'
}

function Flags({ vg, pk }: { vg: boolean; pk: boolean }) {
  if (!vg && !pk) return <span className={styles.mutedLine}>—</span>
  return (
    <>
      {vg && <span className={cn(styles.pill, styles.pillVg)} title="Vargottama">VG</span>}
      {pk && <span className={cn(styles.pill, styles.pillPk)} title="Pushkara Navamsha">PK</span>}
    </>
  )
}

interface NavamshaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function NavamshaWorkspace({ chart, userPlan = 'free' }: NavamshaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const [variantChart, setVariantChart] = useState<NavamshaVariantId>('D9')
  const analysis = useMemo(() => analyzeNavamsha(chart), [chart])
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0

  const activeVargaName = variantChart
  const activeAsc = (chart.vargaLagnas?.[activeVargaName] ?? chart.vargaLagnas?.D9 ?? 1) as Rashi
  const activeGrahas = chart.vargas?.[activeVargaName] ?? chart.vargas?.D9 ?? []
  const dashaHighlights = analysis?.dashaOverlay?.highlightHouses ?? []

  if (!analysis) {
    return (
      <PanelShell
        title="Navamsha (D9)"
        empty={{
          title: 'Navamsha data unavailable',
          description: 'Recalculate the chart to generate the D9 Navamsha chart and interpretations.',
        }}
      >
        {null}
      </PanelShell>
    )
  }

  const sketch = analysis.spouseSketch
  const dasha = analysis.dashaOverlay
  const variants = analysis.variants
  const adv = analysis.advanced
  const lagnaRel = adv.lagnaRelation
  const ranked = [...analysis.planets].sort((a, b) => b.strengthScore - a.strengthScore)
  const totalPlanets = analysis.planets.length || 1
  const neutralCount = Math.max(0, analysis.planets.length - adv.supportiveCount - adv.mixedCount - adv.challengingCount)
  const distribution = [
    { key: 'supportive', label: 'Supportive', count: adv.supportiveCount, cls: styles.accentTeal },
    { key: 'mixed', label: 'Mixed', count: adv.mixedCount, cls: styles.accentGold },
    { key: 'challenging', label: 'Challenging', count: adv.challengingCount, cls: styles.accentRose },
    { key: 'neutral', label: 'Unclassified', count: neutralCount, cls: styles.accentBlue },
  ].filter((d) => d.count > 0)

  return (
    <div className={styles.workspace}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div className={styles.heroIntro}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden />
              D9 · Navamsha
            </p>
            <h2 className={styles.heroTitle}>
              {analysis.d9LagnaName}
              <span className={styles.heroSanskrit}> · {analysis.d9LagnaSanskrit}</span>
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
            <div className={styles.badgeRow}>
              {analysis.lagnaVargottama && (
                <span className={cn(styles.badge, styles.badgeGold)}><Crown size={12} />Vargottama Lagna</span>
              )}
              {analysis.vargottama.length > 0 && (
                <span className={cn(styles.badge, styles.badgeTeal)}>
                  <Gem size={12} />{analysis.vargottama.length} Vargottama
                </span>
              )}
              {analysis.pushkaraPlanets.length > 0 && (
                <span className={cn(styles.badge, styles.badgeGold)}>
                  <Sparkles size={12} />{analysis.pushkaraPlanets.length} Pushkara
                </span>
              )}
              {dasha && (
                <span className={styles.badge}>
                  <Hourglass size={12} />Dasha {compactDashaPath(dasha.pathLabel)}
                </span>
              )}
            </div>
          </div>

          <div className={styles.journey} aria-label="Lagna from D1 to D9">
            <div className={styles.journeyNode}>
              <div className={styles.journeyLabel}>D1 Lagna</div>
              <div className={styles.journeySign}>{lagnaRel.fromName}</div>
            </div>
            <div className={styles.journeyLink}>
              <ArrowRight size={16} />
              <span className={cn(styles.pill, toneClass(lagnaRel.tone))} title={lagnaRel.label} style={{ margin: 0 }}>
                {lagnaRel.pair}
              </span>
            </div>
            <div className={cn(styles.journeyNode, styles.journeyNodeD9)}>
              <div className={styles.journeyLabel}>D9 Lagna</div>
              <div className={styles.journeySign}>{lagnaRel.toName}</div>
            </div>
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon} aria-hidden><Compass size={15} /></span>
            <div className={styles.statBody}>
              <div className={styles.statLabel}>Navamsha Lagna</div>
              <div className={styles.statValue}>{analysis.d9LagnaName}</div>
              <div className={styles.statHint}>{lagnaRel.label}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon} aria-hidden><Crown size={15} /></span>
            <div className={styles.statBody}>
              <div className={styles.statLabel}>Karakamsha</div>
              <div className={styles.statValue}>{analysis.karakamshaName}</div>
              <div className={styles.statHint}>Atmakaraka {analysis.atmakarakaName}</div>
            </div>
          </div>
          <div className={cn(styles.statCard, styles.accentRose)}>
            <span className={styles.statIcon} aria-hidden><Heart size={15} /></span>
            <div className={styles.statBody}>
              <div className={styles.statLabel}>7th Lord (D9)</div>
              <div className={styles.statValue}>{analysis.seventhLord.name}</div>
              <div className={styles.statHint}>
                {analysis.seventhLord.d9RashiName} · H{analysis.seventhLord.d9House}
              </div>
            </div>
          </div>
          <div className={cn(styles.statCard, scoreClass(adv.averageStrength))}>
            <span className={styles.statIcon} aria-hidden><Gauge size={15} /></span>
            <div className={styles.statBody}>
              <div className={styles.statLabel}>Avg D9 Strength</div>
              <ScoreBar score={adv.averageStrength} />
              <div className={styles.statHint}>
                {adv.strongest ? `Best ${adv.strongest.name}` : '0–100 composite'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Dual charts ──────────────────────────────────────── */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartLabel}>
            <span className={styles.chartTitle}>
              <span className={styles.chartTag}>D1</span>
              Rashi Chart
            </span>
            <span className={styles.chartAccent}>Birth promise</span>
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
        <div className={cn(styles.chartCard, styles.chartCardD9)}>
          <div className={styles.chartLabel}>
            <span className={styles.chartTitle}>
              <span className={styles.chartTag}>{activeVargaName === 'D9' ? 'D9' : activeVargaName.replace('D9_', '')}</span>
              {activeVargaName === 'D9' ? 'Navamsha' : NAVAMSHA_VARIANT_LABELS[activeVargaName]}
            </span>
            <span className={styles.chartAccent}>
              {RASHI_SHORT[activeAsc]} lagna
              {dashaHighlights.length ? ` · dasha H${dashaHighlights.join(', H')}` : ' · H1, H7, H9 lit'}
            </span>
          </div>
          <ChakraSelector
            ascRashi={activeAsc}
            grahas={activeGrahas}
            vargaName={activeVargaName}
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={dashaHighlights.length ? dashaHighlights : [1, 7, 9]}
          />
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <nav className={styles.tabNav} aria-label="Navamsha sections">
        <div className={styles.tabRow} role="tablist">
          {TAB_GROUPS.map((g) => (
            <div key={g.label} className={styles.tabGroup} role="presentation">
              <span className={styles.tabGroupLabel}>{g.label}</span>
              {g.tabs.map((id) => {
                const t = TAB_BY_ID[id]
                const active = tab === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    title={t.hint}
                    className={cn(styles.tabBtn, active && styles.tabBtnActive)}
                    onClick={() => setTab(id)}
                  >
                    <t.Icon size={14} strokeWidth={active ? 2.25 : 2} aria-hidden />
                    <span className={styles.tabLabelFull}>{t.label}</span>
                    <span className={styles.tabLabelShort}>{t.shortLabel}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </nav>

      {/* ── Overview ─────────────────────────────────────────── */}
      {tab === 'overview' && (
        <section className={styles.section}>
          <SectionHead tab="overview" title="Navamsha Insights" />
          <p className={styles.lede}>{analysis.d9LagnaTheme}</p>
          <div className={styles.insightGrid}>
            {analysis.insights.map((ins) => (
              <Insight key={ins.title} kind={ins.kind} kicker={ins.title}>
                <p className={styles.insightText}>{ins.text}</p>
              </Insight>
            ))}
          </div>

          <h4 className={styles.subHead}>D9 strength at a glance</h4>
          <ol className={styles.rankList}>
            {ranked.map((p, i) => (
              <li key={`rank-${p.id}`} className={styles.rankRow}>
                <span className={styles.rankIdx}>{i + 1}</span>
                <PlanetTag id={p.id} name={p.name} />
                <ScoreBar score={p.strengthScore} />
                <span className={styles.rankMeta}>
                  {p.d9RashiName} · H{p.d9House} · {p.d9Dignity.replace(/_/g, ' ')}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {tab === 'predictions' && <NavamshaPredictionsPanel chart={chart} />}

      {/* ── Mapping table ────────────────────────────────────── */}
      {tab === 'mapping' && (
        <section className={styles.section}>
          <SectionHead tab="mapping" title="Planet Rashi → Navamsha" />
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>D1 Rashi</th>
                  <th>Pada</th>
                  <th />
                  <th>D9 Navamsha</th>
                  <th>Relation</th>
                  <th>D9 House</th>
                  <th>Dignity</th>
                  <th>Strength</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {analysis.planets.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <PlanetTag id={p.id} name={p.name} />
                      {p.charaKaraka ? <span className={styles.cellSub}>{p.charaKaraka}</span> : null}
                    </td>
                    <td>
                      {p.d1RashiShort} · H{p.d1House}
                      <span className={styles.cellSub}>{p.d1Degree.toFixed(1)}°</span>
                    </td>
                    <td>{p.padaInSign}</td>
                    <td><ArrowRight size={13} className={styles.arrow} aria-hidden /></td>
                    <td>
                      <strong>{p.d9RashiName}</strong>
                      <span className={styles.cellSub}>{p.d9RashiShort} · {p.d9Degree.toFixed(1)}°</span>
                    </td>
                    <td>
                      <span className={cn(styles.pill, toneClass(p.d1d9Relation.tone))} title={p.d1d9Relation.label}>
                        {p.d1d9Relation.pair}
                      </span>
                      <span className={styles.cellSub}>{p.d1d9Relation.label.replace(/\s*\(.*\)$/, '')}</span>
                    </td>
                    <td>H{p.d9House}</td>
                    <td>
                      <span className={cn(styles.pill, dignityPill(p.d9Dignity))}>
                        {p.d9Dignity.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td><ScoreBar score={p.strengthScore} /></td>
                    <td><Flags vg={p.isVargottama} pk={p.isPushkara} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className={styles.subHead}>Planet interpretations</h4>
          <div className={styles.detailStack}>
            {analysis.planets.map((p) => (
              <details key={`card-${p.id}`} className={styles.detailItem}>
                <summary className={styles.detailSummary}>
                  <PlanetTag id={p.id} name={p.name} />
                  <span className={styles.mutedLine}>
                    {p.d1RashiShort} → {p.d9RashiShort}
                  </span>
                  <span className={cn(styles.pill, toneClass(p.d1d9Relation.tone))}>{p.d1d9Relation.pair}</span>
                  {p.isVargottama && <span className={cn(styles.pill, styles.pillVg)}>VG</span>}
                  {p.isPushkara && <span className={cn(styles.pill, styles.pillPk)}>PK</span>}
                  <ChevronDown size={15} className={styles.detailChevron} aria-hidden />
                </summary>
                <p className={styles.planetBody}>{p.interpretation}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── D1↔D9 Relations ──────────────────────────────────── */}
      {tab === 'relations' && (
        <section className={styles.section}>
          <SectionHead tab="relations" title="D1 ↔ D9 Rashi Relations" />
          <p className={styles.leadText}>
            Sign-count from natal rashi to Navamsha rashi — e.g. Aries → Taurus = 2nd / reverse 12th → pair <strong>2/12</strong>.
          </p>

          <Insight
            kind={toneToKind(lagnaRel.tone)}
            kicker="Lagna link"
            title={`${lagnaRel.fromName} → ${lagnaRel.toName} · ${lagnaRel.pair} ${lagnaRel.label}`}
            className={styles.insightWide}
          >
            <p className={styles.insightText}>
              Forward {lagnaRel.forward}, reverse {lagnaRel.reverse}. {lagnaRel.note}
            </p>
          </Insight>

          <h4 className={styles.subHead}>Relation mix · {analysis.planets.length} planets</h4>
          <div className={styles.distBar} role="img" aria-label="Distribution of D1 to D9 relation tones">
            {distribution.map((d) => (
              <span
                key={d.key}
                className={cn(styles.distSeg, d.cls)}
                style={{ width: `${(d.count / totalPlanets) * 100}%` }}
                title={`${d.label}: ${d.count}`}
              />
            ))}
          </div>
          <div className={styles.distLegend}>
            {distribution.map((d) => (
              <span key={d.key} className={cn(styles.distKey, d.cls)}>
                <span className={styles.distSwatch} aria-hidden />
                {d.label} <strong>{d.count}</strong>
              </span>
            ))}
            <span className={styles.distKey}>
              Avg D9 score <strong>{Math.round(adv.averageStrength)}</strong>
            </span>
          </div>

          <div className={styles.insightGrid} style={{ marginBottom: '1rem' }}>
            {adv.relationBuckets.map((b) => (
              <Insight key={b.kind} kind={toneToKind(b.tone)} kicker={b.pairHint} title={b.label}>
                <div className={styles.housePlanets} style={{ paddingTop: 0 }}>
                  {b.planets.map((p) => (
                    <span key={p.id} className={styles.chip} title={`${p.from} → ${p.to}`}>
                      <span className={styles.planetDot} style={planetStyle(p.id)} aria-hidden />
                      {p.name} <span className={styles.mutedLine}>{p.from}→{p.to}</span>
                    </span>
                  ))}
                </div>
              </Insight>
            ))}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>D1</th>
                  <th>D9</th>
                  <th>Fwd</th>
                  <th>Rev</th>
                  <th>Pair</th>
                  <th>Class</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {analysis.planets.map((p) => (
                  <tr key={`rel-${p.id}`}>
                    <td><PlanetTag id={p.id} name={p.name} /></td>
                    <td>{p.d1RashiName}</td>
                    <td>{p.d9RashiName}</td>
                    <td>{p.d1d9Relation.forward}</td>
                    <td>{p.d1d9Relation.reverse}</td>
                    <td>
                      <span className={cn(styles.pill, toneClass(p.d1d9Relation.tone))}>
                        {p.d1d9Relation.pair}
                      </span>
                    </td>
                    <td>{p.d1d9Relation.label}</td>
                    <td className={styles.cellNote}>{p.d1d9Relation.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Advanced ─────────────────────────────────────────── */}
      {tab === 'advanced' && (
        <section className={styles.section}>
          <SectionHead tab="advanced" title="Advanced Navamsha" />

          <div className={styles.insightGrid} style={{ marginBottom: '0.85rem' }}>
            {adv.strongest && (
              <Insight kind="strength" kicker="Strongest in D9" Icon={TrendingUp} title={adv.strongest.name}>
                <ScoreBar score={adv.strongest.score} />
              </Insight>
            )}
            {adv.weakest && (
              <Insight kind="caution" kicker="Needs care in D9" title={adv.weakest.name}>
                <ScoreBar score={adv.weakest.score} />
              </Insight>
            )}
          </div>

          <ul className={styles.noteList}>
            {adv.notes.map((n) => (
              <li key={n} className={styles.noteItem}>{n}</li>
            ))}
          </ul>

          <h4 className={styles.subHead}>Strength scores</h4>
          <ol className={styles.rankList}>
            {ranked.map((p, i) => (
              <li key={`score-${p.id}`} className={styles.rankRow}>
                <span className={styles.rankIdx}>{i + 1}</span>
                <PlanetTag id={p.id} name={p.name} />
                <ScoreBar score={p.strengthScore} />
                <span className={styles.rankMeta}>
                  <span className={cn(styles.pill, toneClass(p.d1d9Relation.tone))}>{p.d1d9Relation.pair}</span>
                  {p.d9Dignity.replace(/_/g, ' ')} · H{p.d9House}
                  {p.isVargottama ? ' · VG' : ''}
                  {p.isPushkara ? ' · PK' : ''}
                </span>
              </li>
            ))}
          </ol>

          <h4 className={styles.subHead}>Dignity crossovers</h4>
          {adv.dignityCrossovers.length === 0 ? (
            <p className={styles.emptyHint}>No special D1↔D9 dignity crossovers flagged.</p>
          ) : (
            <div className={styles.cardGrid}>
              {adv.dignityCrossovers.map((c, i) => {
                const down = c.kind === 'decline' || c.kind === 'neecha_navamsha'
                return (
                  <article
                    key={`${c.id}-${c.kind}-${i}`}
                    className={cn(styles.planetCard, down ? styles.toneChallenging : styles.toneSupportive)}
                  >
                    <div className={styles.planetCardHead}>
                      <h4 className={styles.planetName}>
                        <span className={styles.planetDot} style={planetStyle(c.id)} aria-hidden />
                        {c.name}
                      </h4>
                      <span className={cn(styles.pill, down ? styles.pillWeak : styles.pillStrong)}>{c.title}</span>
                    </div>
                    <p className={styles.planetBody}>{c.text}</p>
                  </article>
                )
              })}
            </div>
          )}

          <h4 className={styles.subHead}>Navamsha dispositors</h4>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>D9 Sign</th>
                  <th>Dispositor</th>
                  <th>Disp. in D9</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {adv.dispositors.map((d) => (
                  <tr key={`disp-${d.planetId}`}>
                    <td><PlanetTag id={d.planetId} name={d.planetName} /></td>
                    <td>{d.d9RashiName}</td>
                    <td><PlanetTag id={d.dispositorId} name={d.dispositorName} /></td>
                    <td>{d.dispositorD9RashiName} · H{d.dispositorD9House}</td>
                    <td className={styles.cellNote}>{d.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className={styles.subHead}>D9 Parivartana (exchanges)</h4>
          {adv.exchanges.length === 0 ? (
            <p className={styles.emptyHint}>No mutual sign exchanges in Navamsha.</p>
          ) : (
            <div className={styles.cardGrid}>
              {adv.exchanges.map((e) => (
                <article key={`${e.aId}-${e.bId}`} className={styles.planetCard}>
                  <h4 className={styles.planetName}>
                    <PlanetTag id={e.aId} name={e.aName} />
                    <span className={styles.mutedLine}>↔</span>
                    <PlanetTag id={e.bId} name={e.bName} />
                  </h4>
                  <p className={styles.planetBody}>{e.note}</p>
                </article>
              ))}
            </div>
          )}

          <h4 className={styles.subHead}>Navamsha conjunctions</h4>
          {adv.conjunctions.length === 0 ? (
            <p className={styles.emptyHint}>No multi-planet Navamsha conjunctions.</p>
          ) : (
            <div className={styles.cardGrid}>
              {adv.conjunctions.map((c) => (
                <article key={c.rashi} className={styles.planetCard}>
                  <div className={styles.planetCardHead}>
                    <h4 className={styles.planetName}>{c.rashiName}</h4>
                    <span className={styles.pill}>H{c.house}</span>
                  </div>
                  <div className={styles.housePlanets} style={{ paddingTop: 0 }}>
                    {c.planets.map((p) => (
                      <span key={p.id} className={styles.chip}>
                        <span className={styles.planetDot} style={planetStyle(p.id)} aria-hidden />
                        {p.name}
                      </span>
                    ))}
                  </div>
                  <p className={styles.planetBody}>{c.note}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Vargottama & Pushkara ────────────────────────────── */}
      {tab === 'vargottama' && (
        <section className={styles.section}>
          <SectionHead tab="vargottama" title="Special Strengths" />
          {analysis.lagnaVargottama && (
            <Insight kind="strength" kicker="Vargottama Lagna" Icon={Crown} className={styles.insightWide}>
              <p className={styles.insightText}>
                Ascendant is {analysis.d9LagnaName} in both D1 and D9 — identity and life direction stay remarkably consistent.
              </p>
            </Insight>
          )}
          {analysis.vargottama.length === 0 && analysis.pushkaraPlanets.length === 0 ? (
            <p className={styles.emptyHint} style={{ marginTop: '0.75rem' }}>
              No vargottama or Pushkara Navamsha planets in this chart.
            </p>
          ) : (
            <div className={styles.cardGrid} style={{ marginTop: analysis.lagnaVargottama ? '0.75rem' : 0 }}>
              {analysis.vargottama.map((p) => (
                <article key={`vg-${p.id}`} className={cn(styles.planetCard, styles.toneSupportive)}>
                  <div className={styles.planetCardHead}>
                    <h4 className={styles.planetName}>
                      <span className={styles.planetDot} style={planetStyle(p.id)} aria-hidden />
                      {p.name}
                    </h4>
                    <span className={cn(styles.pill, styles.pillVg)}>Vargottama</span>
                  </div>
                  <div className={styles.mappingLine}>{p.d1RashiName} in D1 &amp; D9</div>
                  <p className={styles.planetBody}>
                    Same-sign placement amplifies {p.name}&apos;s promise. Results tend to be steadier across life stages.
                  </p>
                </article>
              ))}
              {analysis.pushkaraPlanets.map((p) => (
                <article key={`pk-${p.id}`} className={cn(styles.planetCard, styles.toneMixed)}>
                  <div className={styles.planetCardHead}>
                    <h4 className={styles.planetName}>
                      <span className={styles.planetDot} style={planetStyle(p.id)} aria-hidden />
                      {p.name}
                    </h4>
                    <span className={cn(styles.pill, styles.pillPk)}>Pushkara</span>
                  </div>
                  <div className={styles.mappingLine}>
                    Pada {p.padaInSign} of {p.d1RashiName} → {p.d9RashiName}
                  </div>
                  <p className={styles.planetBody}>
                    {p.pushkaraNote ?? 'Auspicious Navamsha — remedies and spiritual practices are especially effective.'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Marriage ─────────────────────────────────────────── */}
      {tab === 'marriage' && (
        <section className={styles.section}>
          <SectionHead tab="marriage" title="Marriage & Partnership" />
          <div className={styles.insightGrid} style={{ marginBottom: '0.85rem' }}>
            <Insight kind="highlight" kicker="D9 7th house" Icon={Heart} title={analysis.seventhHouse.rashiName}>
              <p className={styles.insightText}>
                Lord {analysis.seventhHouse.lordName}
                {analysis.seventhHouse.occupants.length
                  ? ` · Occupied by ${analysis.seventhHouse.occupants.map((o) => o.name).join(', ')}`
                  : ' · Unoccupied'}
              </p>
            </Insight>
            <Insight kind="info" kicker="7th lord journey" Icon={Waypoints} title={analysis.seventhLord.name}>
              <p className={styles.insightText}>
                In {analysis.seventhLord.d9RashiName} (H{analysis.seventhLord.d9House})
                {analysis.seventhLord.isVargottama ? ' · Vargottama' : ''}
              </p>
            </Insight>
          </div>
          <ul className={styles.noteList}>
            {analysis.marriageNotes.map((note, i) => (
              <li key={i} className={styles.noteItem}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Spouse sketch ────────────────────────────────────── */}
      {tab === 'spouse' && (
        <section className={styles.section}>
          <SectionHead tab="spouse" />
          <p className={styles.lede}>{sketch.headline}</p>
          <div className={styles.traitRow}>
            {sketch.traits.map((t) => (
              <span key={t} className={cn(styles.badge, styles.badgeGold)}>{t}</span>
            ))}
          </div>
          <div className={styles.sketchGrid}>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}><UserRound size={14} aria-hidden />Physique / Presence</h4>
              <p className={styles.insightText}>{sketch.physique}</p>
            </article>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}><Activity size={14} aria-hidden />Temperament</h4>
              <p className={styles.insightText}>{sketch.temperament}</p>
            </article>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}><Gem size={14} aria-hidden />Values</h4>
              <p className={styles.insightText}>{sketch.values}</p>
            </article>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}><Briefcase size={14} aria-hidden />Vocation Hint</h4>
              <p className={styles.insightText}>{sketch.vocationHint}</p>
            </article>
            <article className={cn(styles.sketchCard, styles.sketchWide)}>
              <h4 className={styles.insightTitle}><Heart size={14} aria-hidden />Relationship Style</h4>
              <p className={styles.insightText}>{sketch.relationshipStyle}</p>
            </article>
          </div>
          <div className={styles.insightGrid} style={{ marginTop: '0.85rem' }}>
            <Insight kind="strength" kicker="Strengths">
              <ul className={styles.bulletList}>
                {sketch.strengths.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </Insight>
            <Insight kind="caution" kicker="Cautions">
              <ul className={styles.bulletList}>
                {sketch.cautions.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </Insight>
          </div>
          <p className={styles.footnote}>
            <Info size={13} aria-hidden style={{ flex: '0 0 auto', marginTop: 2 }} />
            Sources: {sketch.sources.join(' · ')}
          </p>
        </section>
      )}

      {/* ── Dasha overlay ────────────────────────────────────── */}
      {tab === 'dasha' && (
        <section className={styles.section}>
          <SectionHead tab="dasha" title="Vimshottari × Navamsha" />
          {!dasha ? (
            <p className={styles.emptyHint}>No active Vimshottari path found. Recalculate dashas with the chart.</p>
          ) : (
            <>
              <div className={styles.insightGrid} style={{ marginBottom: '1rem' }}>
                <Insight kind="highlight" kicker="Current path" Icon={Hourglass}>
                  <p className={styles.insightText}>{dasha.pathLabel}</p>
                </Insight>
                <Insight kind="info" kicker="Destiny window" Icon={Compass}>
                  <p className={styles.insightText}>{dasha.destinyWindow}</p>
                </Insight>
                <Insight kind="highlight" kicker="Marriage timing colour" Icon={Heart} className={styles.insightWide}>
                  <p className={styles.insightText}>{dasha.marriageWindow}</p>
                </Insight>
              </div>
              <ol className={styles.timeline}>
                {dasha.lords.map((l) => (
                  <li key={`${l.level}-${l.lord}`} className={cn(styles.timelineItem, toneClass(l.tone))}>
                    <span className={styles.timelineNode} aria-hidden />
                    <article className={styles.dashaCard}>
                      <div className={styles.dashaHead}>
                        <div>
                          <div className={styles.houseNum}>{l.levelLabel}</div>
                          <h4 className={styles.planetName}>
                            <span className={styles.planetDot} style={planetStyle(l.lord)} aria-hidden />
                            {l.lordName}
                          </h4>
                        </div>
                        <span className={cn(styles.pill, toneClass(l.tone))}>{l.tone}</span>
                      </div>
                      <div className={styles.mappingLine}>
                        {l.d9RashiName ? `${l.d9RashiName} · D9 H${l.d9House}` : 'D9 placement unavailable'}
                        {l.d9Dignity ? ` · ${l.d9Dignity.replace(/_/g, ' ')}` : ''}
                        {l.isVargottama ? ' · VG' : ''}
                        {l.isPushkara ? ' · PK' : ''}
                      </div>
                      <div className={styles.dashaDates}>{l.start} → {l.end}</div>
                      <p className={styles.planetBody}>{l.note}</p>
                    </article>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}

      {/* ── Destiny ──────────────────────────────────────────── */}
      {tab === 'destiny' && (
        <section className={styles.section}>
          <SectionHead tab="destiny" title="Destiny · Dharma · Karakamsha" />
          <Insight
            kind="highlight"
            kicker={`Karakamsha · ${analysis.karakamshaName}`}
            Icon={Crown}
            title={`Atmakaraka ${analysis.atmakarakaName}`}
            className={styles.insightWide}
          >
            <p className={styles.insightText}>{analysis.karakamshaTheme}</p>
          </Insight>
          <h4 className={styles.subHead}>Destiny notes</h4>
          <ul className={styles.noteList}>
            {analysis.destinyNotes.map((note, i) => (
              <li key={i} className={styles.noteItem}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ── D9 Houses ────────────────────────────────────────── */}
      {tab === 'houses' && (
        <section className={styles.section}>
          <SectionHead tab="houses" title="Navamsha Bhava Map" />
          <div className={styles.houseGrid}>
            {analysis.houses.map((h) => (
              <article
                key={h.house}
                className={cn(
                  styles.houseCard,
                  (h.house === 1 || h.house === 7 || h.house === 9 || dashaHighlights.includes(h.house)) && styles.houseCardHot,
                )}
              >
                <div className={styles.houseTop}>
                  <span className={styles.houseBadge}>{h.house}</span>
                  <span className={styles.houseMeta}>Lord {h.lordName}</span>
                </div>
                <div className={styles.houseSign}>{h.rashiName} <span className={styles.mutedLine}>{h.rashiShort}</span></div>
                <div className={styles.houseTheme} title={h.theme}>{h.theme}</div>
                <div className={styles.housePlanets}>
                  {h.occupants.length ? (
                    h.occupants.map((o) => (
                      <span key={o.id} className={styles.chip} title={o.dignity.replace(/_/g, ' ')}>
                        <span className={styles.planetDot} style={planetStyle(o.id)} aria-hidden />
                        {o.name}{o.isVargottama ? ' ★' : ''}
                      </span>
                    ))
                  ) : (
                    <span className={styles.mutedLine}>Empty</span>
                  )}
                </div>
              </article>
            ))}
          </div>
          <p className={styles.footnote}>
            <Info size={13} aria-hidden style={{ flex: '0 0 auto', marginTop: 2 }} />
            ★ marks vargottama. Highlighted: lagna (1), spouse (7), dharma (9), plus active dasha houses.
          </p>
        </section>
      )}

      {/* ── Variants (Platinum) ──────────────────────────────── */}
      {tab === 'variants' && (
        <section className={styles.section}>
          <SectionHead tab="variants" title="Navamsha Variants" />
          <PlanGate userPlan={userPlan} required="platinum" featureName="D9 variants (Pada / Nadi / Somanatha)">
            <div className={styles.variantToolbar}>
              {(['D9', ...VARIANT_COLS] as NavamshaVariantId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={variantChart === id}
                  className={cn(styles.tabBtn, variantChart === id && styles.tabBtnActive)}
                  onClick={() => setVariantChart(id)}
                >
                  {NAVAMSHA_VARIANT_LABELS[id]}
                  {variants.lagnaNames[id] ? ` · ${variants.lagnaNames[id]}` : ''}
                </button>
              ))}
            </div>

            <div className={cn(styles.insightGrid, styles.insightGrid3)} style={{ margin: '0.85rem 0' }}>
              {VARIANT_COLS.map((id) => {
                const rate = variants.matchRates[id]
                const pct = rate.total ? Math.round((rate.matches / rate.total) * 100) : 0
                return (
                  <Insight key={id} kind="info" Icon={GitCompare} kicker="vs Parashara" title={NAVAMSHA_VARIANT_LABELS[id]}>
                    <ScoreBar score={pct} />
                    <p className={styles.insightText}>
                      {rate.matches}/{rate.total} planets agree
                      {variants.lagna.D9 && variants.lagna[id]
                        ? variants.lagna.D9 === variants.lagna[id]
                          ? ' · Lagna matches'
                          : ` · Lagna ${variants.lagnaNames[id]} vs ${variants.lagnaNames.D9}`
                        : ''}
                    </p>
                  </Insight>
                )
              })}
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Planet</th>
                    <th>D1</th>
                    <th>Parashara</th>
                    <th>Pada</th>
                    <th>Nadi</th>
                    <th>Somanatha</th>
                    <th>Agree</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.planets.map((p) => (
                    <tr key={p.id}>
                      <td><PlanetTag id={p.id} name={p.name} /></td>
                      <td>{p.d1RashiShort}</td>
                      <td><strong>{p.parasharaShort}</strong></td>
                      {VARIANT_COLS.map((id) => {
                        const r = p.variants[id]
                        return (
                          <td key={id} className={r === p.parashara ? styles.cellMatch : undefined}>
                            {RASHI_SHORT[r]}
                          </td>
                        )
                      })}
                      <td>{p.agreementCount}/3</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className={styles.noteList} style={{ marginTop: '0.85rem' }}>
              {variants.notes.map((n) => (
                <li key={n} className={styles.noteItem}>{n}</li>
              ))}
            </ul>
            <p className={styles.footnote}>
              <Info size={13} aria-hidden style={{ flex: '0 0 auto', marginTop: 2 }} />
              Selecting a variant above swaps the right-hand chart to that scheme when the chart payload includes it.
            </p>
          </PlanGate>
        </section>
      )}
    </div>
  )
}
