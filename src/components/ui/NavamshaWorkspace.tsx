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
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  Users,
  Waypoints,
} from 'lucide-react'
import { PanelShell, PlanGate } from '@/components/ui/patterns'
import { NavamshaPredictionsPanel } from '@/components/ui/NavamshaPredictionsPanel'
import {
  analyzeNavamsha,
  type NavamshaVariantId,
} from '@/lib/engine/navamshaAnalysis'
import { GRAHA_DISPLAY_COLOR } from '@/lib/engine/grahaDisplayColors'
import { cn } from '@/lib/ui/cn'
import { termHi } from '@/i18n/jyotish'
import { useTranslations } from 'next-intl'
import { useDivisionalCommon } from '@/components/ui/useDivisionalCommon'
import type { ChartOutput, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import {
  vargaStyles as styles,
  compactDashaPath,
  dignityPill,
  toneClass,
  toneToKind,
  VargaCharts,
  VargaHero,
  VargaInsight,
  VargaSectionHead,
  VargaSignalBalance,
  VargaTabNav,
  VargaWorkspace,
  type VargaAccent,
  type VargaTabGroup,
} from '@/components/ui/varga/VargaShell'

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


const VARIANT_COLS: Exclude<NavamshaVariantId, 'D9'>[] = ['D9_Pada', 'D9_Nadi', 'D9_Somanatha']





function scoreAccent(score: number): VargaAccent {
  if (score >= 65) return 'teal'
  if (score <= 40) return 'rose'
  return 'gold'
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
  return <VargaSectionHead Icon={TAB_BY_ID[tab].Icon} title={title ?? t(`tabs.${tab}.label`)} hint={t(`tabs.${tab}.hint`)} />
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
  const tabGroups: VargaTabGroup<TabId>[] = TAB_GROUPS.map((g) => ({
    key: g.key,
    label: t(`groups.${g.key}`),
    tabs: g.tabs.map((id) => ({
      id,
      Icon: TAB_BY_ID[id].Icon,
      label: t(`tabs.${id}.label`),
      short: t(`tabs.${id}.short`),
      hint: t(`tabs.${id}.hint`),
    })),
  }))
  const analysis = useMemo(() => analyzeNavamsha(chart, lang), [chart, lang])

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
    <VargaWorkspace varga="D9">
      <VargaHero
        varga="D9"
        eyebrow={t('eyebrow')}
        title={analysis.d9LagnaName}
        sanskrit={c.hi ? undefined : analysis.d9LagnaSanskrit}
        summary={analysis.summary}
        journey={{ from: lagnaRel.fromName, to: lagnaRel.toName, pair: lagnaRel.pair, tone: lagnaRel.tone, title: lagnaRel.label }}
        badges={[
          analysis.lagnaVargottama && { key: 'vl', Icon: Crown, label: t('badgeVargLagna'), tone: 'gold' },
          analysis.vargottama.length > 0 && { key: 'vg', Icon: Gem, label: t('badgeVarg', { n: analysis.vargottama.length }), tone: 'teal' },
          analysis.pushkaraPlanets.length > 0 && { key: 'pk', Icon: Sparkles, label: t('badgePush', { n: analysis.pushkaraPlanets.length }), tone: 'gold' },
          dasha && { key: 'dasha', Icon: Hourglass, label: t('badgeDasha', { path: compactDashaPath(dasha.pathLabel) }), tone: 'plain' },
        ]}
        stats={[
          { key: 'lagna', Icon: Compass, label: t('statLagna'), value: analysis.d9LagnaName, hint: lagnaRel.label },
          { key: 'karakamsha', Icon: Crown, label: t('statKarakamsha'), value: analysis.karakamshaName, hint: t('statAk', { name: analysis.atmakarakaName }) },
          {
            key: 'lord7',
            Icon: Heart,
            label: t('statLord7'),
            value: analysis.seventhLord.name,
            hint: `${analysis.seventhLord.d9RashiName} · ${c.houseShort(analysis.seventhLord.d9House)}`,
            accent: 'rose',
          },
          {
            key: 'avg',
            Icon: Gauge,
            label: t('statAvg'),
            value: <ScoreBar score={adv.averageStrength} />,
            hint: adv.strongest ? t('statBest', { name: adv.strongest.name }) : t('statComposite'),
            accent: scoreAccent(adv.averageStrength),
          },
        ]}
      />

      <VargaCharts
        chart={chart}
        d1Title={t('chartRashi')}
        d1Accent={t('chartRashiAccent')}
        focus={{
          tag: activeVargaName === 'D9' ? 'D9' : activeVargaName.replace('D9_', ''),
          title: activeVargaName === 'D9' ? t('chartNavamsha') : t(`variant.${activeVargaName}`),
          accent: `${c.lagnaOf(activeAsc)}${dashaHighlights.length ? t('chartDasha', { houses: dashaHighlights.join(', ') }) : t('chartLit')}`,
          ascRashi: activeAsc,
          grahas: activeGrahas,
          vargaName: activeVargaName,
          highlightHouses: dashaHighlights.length ? dashaHighlights : [1, 7, 9],
        }}
      />

      <VargaTabNav groups={tabGroups} active={tab} onChange={setTab} ariaLabel={t('tabsAria')} />

      {/* ── Overview ─────────────────────────────────────────── */}
      {tab === 'overview' && (
        <section className={styles.section}>
          <SectionHead tab="overview" title={t('insightsTitle')} />
          <p className={styles.lede}>{analysis.d9LagnaTheme}</p>
          <VargaSignalBalance kinds={analysis.insights.map((i) => i.kind)} />
          <div className={styles.insightGrid}>
            {analysis.insights.map((ins) => (
              <VargaInsight key={ins.title} kind={ins.kind} kicker={ins.title}>
                <p className={styles.insightText}>{ins.text}</p>
              </VargaInsight>
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

          <VargaInsight
            kind={toneToKind(lagnaRel.tone)}
            kicker={t('lagnaLink')}
            title={`${lagnaRel.fromName} → ${lagnaRel.toName} · ${lagnaRel.pair} ${lagnaRel.label}`}
            className={styles.insightWide}
          >
            <p className={styles.insightText}>
              {t('fwdRev', { fwd: lagnaRel.forward, rev: lagnaRel.reverse })} {lagnaRel.note}
            </p>
          </VargaInsight>

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
              <VargaInsight key={b.kind} kind={toneToKind(b.tone)} kicker={b.pairHint} title={b.label}>
                <div className={styles.housePlanets} style={{ paddingTop: 0 }}>
                  {b.planets.map((p) => (
                    <span key={p.id} className={styles.chip} title={`${p.from} → ${p.to}`}>
                      <span className={styles.planetDot} style={planetStyle(p.id)} aria-hidden />
                      {p.name} <span className={styles.mutedLine}>{p.from}→{p.to}</span>
                    </span>
                  ))}
                </div>
              </VargaInsight>
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
              <VargaInsight kind="strength" kicker={t('strongest')} Icon={TrendingUp} title={adv.strongest.name}>
                <ScoreBar score={adv.strongest.score} />
              </VargaInsight>
            )}
            {adv.weakest && (
              <VargaInsight kind="caution" kicker={t('weakest')} title={adv.weakest.name}>
                <ScoreBar score={adv.weakest.score} />
              </VargaInsight>
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
            <VargaInsight kind="strength" kicker={t('badgeVargLagna')} Icon={Crown} className={styles.insightWide}>
              <p className={styles.insightText}>
                {t('vargLagnaText', { sign: analysis.d9LagnaName })}
              </p>
            </VargaInsight>
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
            <VargaInsight kind="highlight" kicker={t('seventh')} Icon={Heart} title={analysis.seventhHouse.rashiName}>
              <p className={styles.insightText}>
                {analysis.seventhHouse.occupants.length
                  ? t('lordOcc', { lord: analysis.seventhHouse.lordName, names: analysis.seventhHouse.occupants.map((o) => o.name).join(', ') })
                  : t('lordEmpty', { lord: analysis.seventhHouse.lordName })}
              </p>
            </VargaInsight>
            <VargaInsight kind="info" kicker={t('lordJourney')} Icon={Waypoints} title={analysis.seventhLord.name}>
              <p className={styles.insightText}>
                {t('lordIn', { rashi: analysis.seventhLord.d9RashiName, house: analysis.seventhLord.d9House })}
                {analysis.seventhLord.isVargottama ? t('vargSuffix') : ''}
              </p>
            </VargaInsight>
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
            <VargaInsight kind="strength" kicker={t('strengths')}>
              <ul className={styles.bulletList}>
                {sketch.strengths.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </VargaInsight>
            <VargaInsight kind="caution" kicker={t('cautions')}>
              <ul className={styles.bulletList}>
                {sketch.cautions.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </VargaInsight>
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
                <VargaInsight kind="highlight" kicker={t('currentPath')} Icon={Hourglass}>
                  <p className={styles.insightText}>{dasha.pathLabel}</p>
                </VargaInsight>
                <VargaInsight kind="info" kicker={t('destinyWindow')} Icon={Compass}>
                  <p className={styles.insightText}>{dasha.destinyWindow}</p>
                </VargaInsight>
                <VargaInsight kind="highlight" kicker={t('marriageWindow')} Icon={Heart} className={styles.insightWide}>
                  <p className={styles.insightText}>{dasha.marriageWindow}</p>
                </VargaInsight>
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
          <VargaInsight
            kind="highlight"
            kicker={t('karakamshaKicker', { sign: analysis.karakamshaName })}
            Icon={Crown}
            title={t('akTitle', { name: analysis.atmakarakaName })}
            className={styles.insightWide}
          >
            <p className={styles.insightText}>{analysis.karakamshaTheme}</p>
          </VargaInsight>
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
                  <VargaInsight key={id} kind="info" Icon={GitCompare} kicker={t('vsParashara')} title={t(`variant.${id}`)}>
                    <ScoreBar score={pct} />
                    <p className={styles.insightText}>
                      {t('agreeCount', { m: rate.matches, t: rate.total })}
                      {variants.lagna.D9 && variants.lagna[id]
                        ? variants.lagna.D9 === variants.lagna[id]
                          ? t('lagnaMatches')
                          : t('lagnaVs', { a: variants.lagnaNames[id] ?? '', b: variants.lagnaNames.D9 ?? '' })
                        : ''}
                    </p>
                  </VargaInsight>
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
    </VargaWorkspace>
  )
}
