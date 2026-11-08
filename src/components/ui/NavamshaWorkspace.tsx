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
  type DashaTone,
  type NavamshaInsight,
  type NavamshaVariantId,
} from '@/lib/engine/navamshaAnalysis'
import { GRAHA_DISPLAY_COLOR } from '@/lib/engine/grahaDisplayColors'
import { cn } from '@/lib/ui/cn'
import { termHi } from '@/i18n/jyotish'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
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
  Icon: IconType
}

const TABS: TabDef[] = [
  { id: 'overview', Icon: Sparkles },
  { id: 'predictions', Icon: ScrollText },
  { id: 'destiny', Icon: Compass },
  { id: 'mapping', Icon: ArrowRight },
  { id: 'relations', Icon: Link2 },
  { id: 'houses', Icon: Layers },
  { id: 'vargottama', Icon: Gem },
  { id: 'marriage', Icon: Heart },
  { id: 'spouse', Icon: Users },
  { id: 'dasha', Icon: Hourglass },
  { id: 'advanced', Icon: Waypoints },
  { id: 'variants', Icon: GitCompare },
]

const TAB_BY_ID = Object.fromEntries(TABS.map((t) => [t.id, t])) as Record<TabId, TabDef>

const TAB_GROUPS: { key: 'read' | 'chart' | 'marriage' | 'depth'; tabs: TabId[] }[] = [
  { key: 'read', tabs: ['overview', 'predictions', 'destiny'] },
  { key: 'chart', tabs: ['mapping', 'relations', 'houses', 'vargottama'] },
  { key: 'marriage', tabs: ['marriage', 'spouse'] },
  { key: 'depth', tabs: ['dasha', 'advanced', 'variants'] },
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
  const t = useTranslations('divisional.d9')
  const rounded = Math.round(score)
  const pct = Math.max(0, Math.min(100, rounded))
  return (
    <span className={cn(styles.scoreBar, scoreClass(rounded))} title={t('scoreTitle', { n: rounded })}>
      <span className={styles.scoreTrack}>
        <span className={styles.scoreFill} style={{ width: `${pct}%` }} />
      </span>
      <span className={styles.scoreNum}>{rounded}</span>
    </span>
  )
}

function SectionHead({ tab, title }: { tab: TabId; title?: string }) {
  const t = useTranslations('divisional.d9')
  const def = TAB_BY_ID[tab]
  return (
    <div className={styles.sectionHead}>
      <span className={styles.sectionIcon} aria-hidden>
        <def.Icon size={16} />
      </span>
      <div className={styles.sectionHeadText}>
        <h3 className={styles.sectionTitle}>{title ?? t(`tabs.${tab}.label`)}</h3>
        <p className={styles.sectionHint}>{t(`tabs.${tab}.hint`)}</p>
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
  const t = useTranslations('divisional.d9')
  if (!vg && !pk) return <span className={styles.mutedLine}>—</span>
  return (
    <>
      {vg && <span className={cn(styles.pill, styles.pillVg)} title={t('vgTitle')}>{t('vg')}</span>}
      {pk && <span className={cn(styles.pill, styles.pillPk)} title={t('pkTitle')}>{t('pk')}</span>}
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
  const t = useTranslations('divisional.d9')
  const c = useDivisionalCommon()
  const { lang } = c
  const analysis = useMemo(() => analyzeNavamsha(chart, lang), [chart, lang])
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0

  const activeVargaName = variantChart
  const activeAsc = (chart.vargaLagnas?.[activeVargaName] ?? chart.vargaLagnas?.D9 ?? 1) as Rashi
  const activeGrahas = chart.vargas?.[activeVargaName] ?? chart.vargas?.D9 ?? []
  const dashaHighlights = analysis?.dashaOverlay?.highlightHouses ?? []

  if (!analysis) {
    return (
      <PanelShell
        title={t('title')}
        empty={{
          title: t('emptyTitle'),
          description: t('emptyDesc'),
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
    { key: 'supportive', label: t('dist.supportive'), count: adv.supportiveCount, cls: styles.accentTeal },
    { key: 'mixed', label: t('dist.mixed'), count: adv.mixedCount, cls: styles.accentGold },
    { key: 'challenging', label: t('dist.challenging'), count: adv.challengingCount, cls: styles.accentRose },
    { key: 'neutral', label: t('dist.neutral'), count: neutralCount, cls: styles.accentBlue },
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
              {t('eyebrow')}
            </p>
            <h2 className={styles.heroTitle}>
              {analysis.d9LagnaName}
              {!c.hi && <span className={styles.heroSanskrit}> · {analysis.d9LagnaSanskrit}</span>}
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
            <div className={styles.badgeRow}>
              {analysis.lagnaVargottama && (
                <span className={cn(styles.badge, styles.badgeGold)}><Crown size={12} />{t('badgeVargLagna')}</span>
              )}
              {analysis.vargottama.length > 0 && (
                <span className={cn(styles.badge, styles.badgeTeal)}>
                  <Gem size={12} />{t('badgeVarg', { n: analysis.vargottama.length })}
                </span>
              )}
              {analysis.pushkaraPlanets.length > 0 && (
                <span className={cn(styles.badge, styles.badgeGold)}>
                  <Sparkles size={12} />{t('badgePush', { n: analysis.pushkaraPlanets.length })}
                </span>
              )}
              {dasha && (
                <span className={styles.badge}>
                  <Hourglass size={12} />{t('badgeDasha', { path: compactDashaPath(dasha.pathLabel) })}
                </span>
              )}
            </div>
          </div>

          <div className={styles.journey} aria-label={t('journeyAria')}>
            <div className={styles.journeyNode}>
              <div className={styles.journeyLabel}>{t('d1Lagna')}</div>
              <div className={styles.journeySign}>{lagnaRel.fromName}</div>
            </div>
            <div className={styles.journeyLink}>
              <ArrowRight size={16} />
              <span className={cn(styles.pill, toneClass(lagnaRel.tone))} title={lagnaRel.label} style={{ margin: 0 }}>
                {lagnaRel.pair}
              </span>
            </div>
            <div className={cn(styles.journeyNode, styles.journeyNodeD9)}>
              <div className={styles.journeyLabel}>{t('d9Lagna')}</div>
              <div className={styles.journeySign}>{lagnaRel.toName}</div>
            </div>
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon} aria-hidden><Compass size={15} /></span>
            <div className={styles.statBody}>
              <div className={styles.statLabel}>{t('statLagna')}</div>
              <div className={styles.statValue}>{analysis.d9LagnaName}</div>
              <div className={styles.statHint}>{lagnaRel.label}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon} aria-hidden><Crown size={15} /></span>
            <div className={styles.statBody}>
              <div className={styles.statLabel}>{t('statKarakamsha')}</div>
              <div className={styles.statValue}>{analysis.karakamshaName}</div>
              <div className={styles.statHint}>{t('statAk', { name: analysis.atmakarakaName })}</div>
            </div>
          </div>
          <div className={cn(styles.statCard, styles.accentRose)}>
            <span className={styles.statIcon} aria-hidden><Heart size={15} /></span>
            <div className={styles.statBody}>
              <div className={styles.statLabel}>{t('statLord7')}</div>
              <div className={styles.statValue}>{analysis.seventhLord.name}</div>
              <div className={styles.statHint}>
                {analysis.seventhLord.d9RashiName} · {c.houseShort(analysis.seventhLord.d9House)}
              </div>
            </div>
          </div>
          <div className={cn(styles.statCard, scoreClass(adv.averageStrength))}>
            <span className={styles.statIcon} aria-hidden><Gauge size={15} /></span>
            <div className={styles.statBody}>
              <div className={styles.statLabel}>{t('statAvg')}</div>
              <ScoreBar score={adv.averageStrength} />
              <div className={styles.statHint}>
                {adv.strongest ? t('statBest', { name: adv.strongest.name }) : t('statComposite')}
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
              {t('chartRashi')}
            </span>
            <span className={styles.chartAccent}>{t('chartRashiAccent')}</span>
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
              {activeVargaName === 'D9' ? t('chartNavamsha') : t(`variant.${activeVargaName}`)}
            </span>
            <span className={styles.chartAccent}>
              {c.lagnaOf(activeAsc)}
              {dashaHighlights.length ? t('chartDasha', { houses: dashaHighlights.join(', ') }) : t('chartLit')}
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
      <nav className={styles.tabNav} aria-label={t('tabsAria')}>
        <div className={styles.tabRow} role="tablist">
          {TAB_GROUPS.map((g) => (
            <div key={g.key} className={styles.tabGroup} role="presentation">
              <span className={styles.tabGroupLabel}>{t(`groups.${g.key}`)}</span>
              {g.tabs.map((id) => {
                const def = TAB_BY_ID[id]
                const active = tab === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    title={t(`tabs.${id}.hint`)}
                    className={cn(styles.tabBtn, active && styles.tabBtnActive)}
                    onClick={() => setTab(id)}
                  >
                    <def.Icon size={14} strokeWidth={active ? 2.25 : 2} aria-hidden />
                    <span className={styles.tabLabelFull}>{t(`tabs.${id}.label`)}</span>
                    <span className={styles.tabLabelShort}>{t(`tabs.${id}.short`)}</span>
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
          <SectionHead tab="overview" title={t('insightsTitle')} />
          <p className={styles.lede}>{analysis.d9LagnaTheme}</p>
          <div className={styles.insightGrid}>
            {analysis.insights.map((ins) => (
              <Insight key={ins.title} kind={ins.kind} kicker={ins.title}>
                <p className={styles.insightText}>{ins.text}</p>
              </Insight>
            ))}
          </div>

          <h4 className={styles.subHead}>{t('strengthGlance')}</h4>
          <ol className={styles.rankList}>
            {ranked.map((p, i) => (
              <li key={`rank-${p.id}`} className={styles.rankRow}>
                <span className={styles.rankIdx}>{i + 1}</span>
                <PlanetTag id={p.id} name={p.name} />
                <ScoreBar score={p.strengthScore} />
                <span className={styles.rankMeta}>
                  {p.d9RashiName} · {c.houseShort(p.d9House)} · {c.dignity(p.d9Dignity)}
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
          <SectionHead tab="mapping" title={t('mappingTitle')} />
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('col.planet')}</th>
                  <th>{t('col.d1Rashi')}</th>
                  <th>{t('col.pada')}</th>
                  <th />
                  <th>{t('col.d9Navamsha')}</th>
                  <th>{t('col.relation')}</th>
                  <th>{t('col.d9House')}</th>
                  <th>{t('col.dignity')}</th>
                  <th>{t('col.strength')}</th>
                  <th>{t('col.flags')}</th>
                </tr>
              </thead>
              <tbody>
                {analysis.planets.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <PlanetTag id={p.id} name={p.name} />
                      {p.charaKaraka ? <span className={styles.cellSub}>{c.hi ? termHi(p.charaKaraka) : p.charaKaraka}</span> : null}
                    </td>
                    <td>
                      {p.d1RashiShort} · {c.houseShort(p.d1House)}
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
                    <td>{c.houseShort(p.d9House)}</td>
                    <td>
                      <span className={cn(styles.pill, dignityPill(p.d9Dignity))}>
                        {c.dignity(p.d9Dignity)}
                      </span>
                    </td>
                    <td><ScoreBar score={p.strengthScore} /></td>
                    <td><Flags vg={p.isVargottama} pk={p.isPushkara} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className={styles.subHead}>{t('interpretations')}</h4>
          <div className={styles.detailStack}>
            {analysis.planets.map((p) => (
              <details key={`card-${p.id}`} className={styles.detailItem}>
                <summary className={styles.detailSummary}>
                  <PlanetTag id={p.id} name={p.name} />
                  <span className={styles.mutedLine}>
                    {p.d1RashiShort} → {p.d9RashiShort}
                  </span>
                  <span className={cn(styles.pill, toneClass(p.d1d9Relation.tone))}>{p.d1d9Relation.pair}</span>
                  {p.isVargottama && <span className={cn(styles.pill, styles.pillVg)}>{t('vg')}</span>}
                  {p.isPushkara && <span className={cn(styles.pill, styles.pillPk)}>{t('pk')}</span>}
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
          <SectionHead tab="relations" title={t('relationsTitle')} />
          <p className={styles.leadText}>
            {t.rich('relationsIntro', { b: (chunks) => <strong>{chunks}</strong> })}
          </p>

          <Insight
            kind={toneToKind(lagnaRel.tone)}
            kicker={t('lagnaLink')}
            title={`${lagnaRel.fromName} → ${lagnaRel.toName} · ${lagnaRel.pair} ${lagnaRel.label}`}
            className={styles.insightWide}
          >
            <p className={styles.insightText}>
              {t('fwdRev', { fwd: lagnaRel.forward, rev: lagnaRel.reverse })} {lagnaRel.note}
            </p>
          </Insight>

          <h4 className={styles.subHead}>{t('mixHead', { n: analysis.planets.length })}</h4>
          <div className={styles.distBar} role="img" aria-label={t('distAria')}>
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
              {t('avgScore')} <strong>{Math.round(adv.averageStrength)}</strong>
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
                  <th>{t('col.planet')}</th>
                  <th>{t('col.d1')}</th>
                  <th>{t('col.d9')}</th>
                  <th>{t('col.fwd')}</th>
                  <th>{t('col.rev')}</th>
                  <th>{t('col.pair')}</th>
                  <th>{t('col.class')}</th>
                  <th>{t('col.note')}</th>
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
          <SectionHead tab="advanced" title={t('advancedTitle')} />

          <div className={styles.insightGrid} style={{ marginBottom: '0.85rem' }}>
            {adv.strongest && (
              <Insight kind="strength" kicker={t('strongest')} Icon={TrendingUp} title={adv.strongest.name}>
                <ScoreBar score={adv.strongest.score} />
              </Insight>
            )}
            {adv.weakest && (
              <Insight kind="caution" kicker={t('weakest')} title={adv.weakest.name}>
                <ScoreBar score={adv.weakest.score} />
              </Insight>
            )}
          </div>

          <ul className={styles.noteList}>
            {adv.notes.map((n) => (
              <li key={n} className={styles.noteItem}>{n}</li>
            ))}
          </ul>

          <h4 className={styles.subHead}>{t('scores')}</h4>
          <ol className={styles.rankList}>
            {ranked.map((p, i) => (
              <li key={`score-${p.id}`} className={styles.rankRow}>
                <span className={styles.rankIdx}>{i + 1}</span>
                <PlanetTag id={p.id} name={p.name} />
                <ScoreBar score={p.strengthScore} />
                <span className={styles.rankMeta}>
                  <span className={cn(styles.pill, toneClass(p.d1d9Relation.tone))}>{p.d1d9Relation.pair}</span>
                  {c.dignity(p.d9Dignity)} · {c.houseShort(p.d9House)}
                  {p.isVargottama ? ` · ${t('vg')}` : ''}
                  {p.isPushkara ? ` · ${t('pk')}` : ''}
                </span>
              </li>
            ))}
          </ol>

          <h4 className={styles.subHead}>{t('crossovers')}</h4>
          {adv.dignityCrossovers.length === 0 ? (
            <p className={styles.emptyHint}>{t('noCrossovers')}</p>
          ) : (
            <div className={styles.cardGrid}>
              {adv.dignityCrossovers.map((x, i) => {
                const down = x.kind === 'decline' || x.kind === 'neecha_navamsha'
                return (
                  <article
                    key={`${x.id}-${x.kind}-${i}`}
                    className={cn(styles.planetCard, down ? styles.toneChallenging : styles.toneSupportive)}
                  >
                    <div className={styles.planetCardHead}>
                      <h4 className={styles.planetName}>
                        <span className={styles.planetDot} style={planetStyle(x.id)} aria-hidden />
                        {x.name}
                      </h4>
                      <span className={cn(styles.pill, down ? styles.pillWeak : styles.pillStrong)}>{x.title}</span>
                    </div>
                    <p className={styles.planetBody}>{x.text}</p>
                  </article>
                )
              })}
            </div>
          )}

          <h4 className={styles.subHead}>{t('dispositors')}</h4>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('col.planet')}</th>
                  <th>{t('col.d9Sign')}</th>
                  <th>{t('col.dispositor')}</th>
                  <th>{t('col.dispInD9')}</th>
                  <th>{t('col.note')}</th>
                </tr>
              </thead>
              <tbody>
                {adv.dispositors.map((d) => (
                  <tr key={`disp-${d.planetId}`}>
                    <td><PlanetTag id={d.planetId} name={d.planetName} /></td>
                    <td>{d.d9RashiName}</td>
                    <td><PlanetTag id={d.dispositorId} name={d.dispositorName} /></td>
                    <td>{d.dispositorD9RashiName} · {c.houseShort(d.dispositorD9House)}</td>
                    <td className={styles.cellNote}>{d.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className={styles.subHead}>{t('exchanges')}</h4>
          {adv.exchanges.length === 0 ? (
            <p className={styles.emptyHint}>{t('noExchanges')}</p>
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

          <h4 className={styles.subHead}>{t('conjunctions')}</h4>
          {adv.conjunctions.length === 0 ? (
            <p className={styles.emptyHint}>{t('noConjunctions')}</p>
          ) : (
            <div className={styles.cardGrid}>
              {adv.conjunctions.map((cj) => (
                <article key={cj.rashi} className={styles.planetCard}>
                  <div className={styles.planetCardHead}>
                    <h4 className={styles.planetName}>{cj.rashiName}</h4>
                    <span className={styles.pill}>{c.houseShort(cj.house)}</span>
                  </div>
                  <div className={styles.housePlanets} style={{ paddingTop: 0 }}>
                    {cj.planets.map((p) => (
                      <span key={p.id} className={styles.chip}>
                        <span className={styles.planetDot} style={planetStyle(p.id)} aria-hidden />
                        {p.name}
                      </span>
                    ))}
                  </div>
                  <p className={styles.planetBody}>{cj.note}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Vargottama & Pushkara ────────────────────────────── */}
      {tab === 'vargottama' && (
        <section className={styles.section}>
          <SectionHead tab="vargottama" title={t('specialTitle')} />
          {analysis.lagnaVargottama && (
            <Insight kind="strength" kicker={t('badgeVargLagna')} Icon={Crown} className={styles.insightWide}>
              <p className={styles.insightText}>
                {t('vargLagnaText', { sign: analysis.d9LagnaName })}
              </p>
            </Insight>
          )}
          {analysis.vargottama.length === 0 && analysis.pushkaraPlanets.length === 0 ? (
            <p className={styles.emptyHint} style={{ marginTop: '0.75rem' }}>
              {t('noSpecial')}
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
                    <span className={cn(styles.pill, styles.pillVg)}>{t('vargottama')}</span>
                  </div>
                  <div className={styles.mappingLine}>{t('inD1D9', { sign: p.d1RashiName })}</div>
                  <p className={styles.planetBody}>
                    {t('vargText', { name: p.name })}
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
                    <span className={cn(styles.pill, styles.pillPk)}>{t('pushkara')}</span>
                  </div>
                  <div className={styles.mappingLine}>
                    {t('padaOf', { pada: p.padaInSign, d1: p.d1RashiName, d9: p.d9RashiName })}
                  </div>
                  <p className={styles.planetBody}>
                    {p.pushkaraNote ?? t('pushkaraText')}
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
          <SectionHead tab="marriage" title={t('marriageTitle')} />
          <div className={styles.insightGrid} style={{ marginBottom: '0.85rem' }}>
            <Insight kind="highlight" kicker={t('seventh')} Icon={Heart} title={analysis.seventhHouse.rashiName}>
              <p className={styles.insightText}>
                {analysis.seventhHouse.occupants.length
                  ? t('lordOcc', { lord: analysis.seventhHouse.lordName, names: analysis.seventhHouse.occupants.map((o) => o.name).join(', ') })
                  : t('lordEmpty', { lord: analysis.seventhHouse.lordName })}
              </p>
            </Insight>
            <Insight kind="info" kicker={t('lordJourney')} Icon={Waypoints} title={analysis.seventhLord.name}>
              <p className={styles.insightText}>
                {t('lordIn', { rashi: analysis.seventhLord.d9RashiName, house: analysis.seventhLord.d9House })}
                {analysis.seventhLord.isVargottama ? t('vargSuffix') : ''}
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
            {sketch.traits.map((tr) => (
              <span key={tr} className={cn(styles.badge, styles.badgeGold)}>{tr}</span>
            ))}
          </div>
          <div className={styles.sketchGrid}>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}><UserRound size={14} aria-hidden />{t('physique')}</h4>
              <p className={styles.insightText}>{sketch.physique}</p>
            </article>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}><Activity size={14} aria-hidden />{t('temperament')}</h4>
              <p className={styles.insightText}>{sketch.temperament}</p>
            </article>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}><Gem size={14} aria-hidden />{t('values')}</h4>
              <p className={styles.insightText}>{sketch.values}</p>
            </article>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}><Briefcase size={14} aria-hidden />{t('vocation')}</h4>
              <p className={styles.insightText}>{sketch.vocationHint}</p>
            </article>
            <article className={cn(styles.sketchCard, styles.sketchWide)}>
              <h4 className={styles.insightTitle}><Heart size={14} aria-hidden />{t('style')}</h4>
              <p className={styles.insightText}>{sketch.relationshipStyle}</p>
            </article>
          </div>
          <div className={styles.insightGrid} style={{ marginTop: '0.85rem' }}>
            <Insight kind="strength" kicker={t('strengths')}>
              <ul className={styles.bulletList}>
                {sketch.strengths.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </Insight>
            <Insight kind="caution" kicker={t('cautions')}>
              <ul className={styles.bulletList}>
                {sketch.cautions.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </Insight>
          </div>
          <p className={styles.footnote}>
            <Info size={13} aria-hidden style={{ flex: '0 0 auto', marginTop: 2 }} />
            {t('sources', { list: sketch.sources.join(' · ') })}
          </p>
        </section>
      )}

      {/* ── Dasha overlay ────────────────────────────────────── */}
      {tab === 'dasha' && (
        <section className={styles.section}>
          <SectionHead tab="dasha" title={t('dashaTitle')} />
          {!dasha ? (
            <p className={styles.emptyHint}>{t('noDasha')}</p>
          ) : (
            <>
              <div className={styles.insightGrid} style={{ marginBottom: '1rem' }}>
                <Insight kind="highlight" kicker={t('currentPath')} Icon={Hourglass}>
                  <p className={styles.insightText}>{dasha.pathLabel}</p>
                </Insight>
                <Insight kind="info" kicker={t('destinyWindow')} Icon={Compass}>
                  <p className={styles.insightText}>{dasha.destinyWindow}</p>
                </Insight>
                <Insight kind="highlight" kicker={t('marriageWindow')} Icon={Heart} className={styles.insightWide}>
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
                        <span className={cn(styles.pill, toneClass(l.tone))}>{c.tone(l.tone)}</span>
                      </div>
                      <div className={styles.mappingLine}>
                        {l.d9RashiName ? t('dashaPlace', { rashi: l.d9RashiName, house: l.d9House ?? '' }) : t('noPlacement')}
                        {l.d9Dignity ? ` · ${c.dignity(l.d9Dignity)}` : ''}
                        {l.isVargottama ? ` · ${t('vg')}` : ''}
                        {l.isPushkara ? ` · ${t('pk')}` : ''}
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
          <SectionHead tab="destiny" title={t('destinyTitle')} />
          <Insight
            kind="highlight"
            kicker={t('karakamshaKicker', { sign: analysis.karakamshaName })}
            Icon={Crown}
            title={t('akTitle', { name: analysis.atmakarakaName })}
            className={styles.insightWide}
          >
            <p className={styles.insightText}>{analysis.karakamshaTheme}</p>
          </Insight>
          <h4 className={styles.subHead}>{t('destinyNotes')}</h4>
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
          <SectionHead tab="houses" title={t('housesTitle')} />
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
                  <span className={styles.houseMeta}>{t('lord', { name: h.lordName })}</span>
                </div>
                <div className={styles.houseSign}>{h.rashiName} {!c.hi && <span className={styles.mutedLine}>{h.rashiShort}</span>}</div>
                <div className={styles.houseTheme} title={h.theme}>{h.theme}</div>
                <div className={styles.housePlanets}>
                  {h.occupants.length ? (
                    h.occupants.map((o) => (
                      <span key={o.id} className={styles.chip} title={c.dignity(o.dignity)}>
                        <span className={styles.planetDot} style={planetStyle(o.id)} aria-hidden />
                        {o.name}{o.isVargottama ? ' ★' : ''}
                      </span>
                    ))
                  ) : (
                    <span className={styles.mutedLine}>{t('empty')}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
          <p className={styles.footnote}>
            <Info size={13} aria-hidden style={{ flex: '0 0 auto', marginTop: 2 }} />
            {t('housesFoot')}
          </p>
        </section>
      )}

      {/* ── Variants (Platinum) ──────────────────────────────── */}
      {tab === 'variants' && (
        <section className={styles.section}>
          <SectionHead tab="variants" title={t('variantsTitle')} />
          <PlanGate userPlan={userPlan} required="platinum" featureName={t('variantsFeature')}>
            <div className={styles.variantToolbar}>
              {(['D9', ...VARIANT_COLS] as NavamshaVariantId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={variantChart === id}
                  className={cn(styles.tabBtn, variantChart === id && styles.tabBtnActive)}
                  onClick={() => setVariantChart(id)}
                >
                  {t(`variant.${id}`)}
                  {variants.lagnaNames[id] ? ` · ${variants.lagnaNames[id]}` : ''}
                </button>
              ))}
            </div>

            <div className={cn(styles.insightGrid, styles.insightGrid3)} style={{ margin: '0.85rem 0' }}>
              {VARIANT_COLS.map((id) => {
                const rate = variants.matchRates[id]
                const pct = rate.total ? Math.round((rate.matches / rate.total) * 100) : 0
                return (
                  <Insight key={id} kind="info" Icon={GitCompare} kicker={t('vsParashara')} title={t(`variant.${id}`)}>
                    <ScoreBar score={pct} />
                    <p className={styles.insightText}>
                      {t('agreeCount', { m: rate.matches, t: rate.total })}
                      {variants.lagna.D9 && variants.lagna[id]
                        ? variants.lagna.D9 === variants.lagna[id]
                          ? t('lagnaMatches')
                          : t('lagnaVs', { a: variants.lagnaNames[id] ?? '', b: variants.lagnaNames.D9 ?? '' })
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
                    <th>{t('col.planet')}</th>
                    <th>{t('col.d1')}</th>
                    <th>{t('col.parashara')}</th>
                    <th>{t('variant.D9_Pada')}</th>
                    <th>{t('variant.D9_Nadi')}</th>
                    <th>{t('variant.D9_Somanatha')}</th>
                    <th>{t('col.agree')}</th>
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
                            {c.signShort(r)}
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
              {t('variantsFoot')}
            </p>
          </PlanGate>
        </section>
      )}
    </div>
  )
}
