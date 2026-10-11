// ─────────────────────────────────────────────────────────────
//  src/components/ui/NavamshaWorkspace.tsx
//  Dedicated Navamsha (D9) workspace — D1/D9 charts, mapping & predictions
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  ArrowRight,
  Compass,
  Gem,
  GitCompare,
  Heart,
  Hourglass,
  Layers,
  Link2,
  Sparkles,
  Star,
  Users,
  Waypoints,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell, PlanGate } from '@/components/ui/patterns'
import {
  analyzeNavamsha,
  NAVAMSHA_VARIANT_LABELS,
  type DashaTone,
  type NavamshaInsight,
  type NavamshaVariantId,
} from '@/lib/engine/navamshaAnalysis'
import { RASHI_SHORT } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import styles from './NavamshaWorkspace.module.css'

type TabId =
  | 'overview'
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

const TABS: { id: TabId; label: string; shortLabel: string; Icon: typeof Star }[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', Icon: Sparkles },
  { id: 'mapping', label: 'D1 → D9 Mapping', shortLabel: 'Mapping', Icon: ArrowRight },
  { id: 'relations', label: 'D1↔D9 Relations', shortLabel: 'Relations', Icon: Link2 },
  { id: 'advanced', label: 'Advanced', shortLabel: 'Advanced', Icon: Waypoints },
  { id: 'vargottama', label: 'Vargottama & Pushkara', shortLabel: 'Vargottama', Icon: Gem },
  { id: 'marriage', label: 'Marriage', shortLabel: 'Marriage', Icon: Heart },
  { id: 'spouse', label: 'Spouse Sketch', shortLabel: 'Spouse', Icon: Users },
  { id: 'dasha', label: 'Dasha × D9', shortLabel: 'Dasha', Icon: Hourglass },
  { id: 'destiny', label: 'Destiny', shortLabel: 'Destiny', Icon: Compass },
  { id: 'houses', label: 'D9 Houses', shortLabel: 'Houses', Icon: Layers },
  { id: 'variants', label: 'D9 Variants', shortLabel: 'Variants', Icon: GitCompare },
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

  return (
    <div className={styles.workspace}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>D9 · Navamsha</p>
            <h2 className={styles.heroTitle}>
              {analysis.d9LagnaName}
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> · {analysis.d9LagnaSanskrit}</span>
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
          </div>
          <div className={styles.badgeRow}>
            {analysis.lagnaVargottama && <span className={cn(styles.badge, styles.badgeGold)}>Vargottama Lagna</span>}
            {analysis.vargottama.length > 0 && (
              <span className={cn(styles.badge, styles.badgeTeal)}>
                {analysis.vargottama.length} Vargottama
              </span>
            )}
            {analysis.pushkaraPlanets.length > 0 && (
              <span className={cn(styles.badge, styles.badgeGold)}>
                {analysis.pushkaraPlanets.length} Pushkara
              </span>
            )}
            {dasha && (
              <span className={cn(styles.badge, styles.badgeTeal)}>
                Dasha {compactDashaPath(dasha.pathLabel)}
              </span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Navamsha Lagna</div>
            <div className={styles.statValue}>{analysis.d9LagnaName}</div>
            <div className={styles.statHint}>Marriage · Dharma · Destiny</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Karakamsha</div>
            <div className={styles.statValue}>{analysis.karakamshaName}</div>
            <div className={styles.statHint}>AK {analysis.atmakarakaName}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>7th Lord (D9)</div>
            <div className={styles.statValue}>{analysis.seventhLord.name}</div>
            <div className={styles.statHint}>
              {analysis.seventhLord.d9RashiName} · H{analysis.seventhLord.d9House}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>D1↔D9 Lagna</div>
            <div className={styles.statValue}>{analysis.advanced.lagnaRelation.pair}</div>
            <div className={styles.statHint}>{analysis.advanced.lagnaRelation.label}</div>
          </div>
        </div>
      </header>

      {/* ── Dual charts ──────────────────────────────────────── */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartLabel}>
            <span className={styles.chartTitle}>D1 · Rashi Chart</span>
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
        <div className={styles.chartCard}>
          <div className={styles.chartLabel}>
            <span className={styles.chartTitle}>
              {activeVargaName === 'D9' ? 'D9 · Navamsha' : `${activeVargaName} · ${NAVAMSHA_VARIANT_LABELS[activeVargaName]}`}
            </span>
            <span className={styles.chartAccent}>
              {RASHI_SHORT[activeAsc]} lagna
              {dashaHighlights.length ? ` · dasha H${dashaHighlights.join(',')}` : ''}
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
      <div className={styles.tabScroll}>
        <div className={styles.tabRow} role="tablist" aria-label="Navamsha sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={cn(styles.tabBtn, tab === t.id && styles.tabBtnActive)}
              onClick={() => setTab(t.id)}
            >
              <t.Icon size={14} style={{ marginRight: 5, verticalAlign: -2 }} strokeWidth={tab === t.id ? 2.25 : 2} />
              <span className={styles.tabLabelFull}>{t.label}</span>
              <span className={styles.tabLabelShort}>{t.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview ─────────────────────────────────────────── */}
      {tab === 'overview' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Navamsha Insights</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {analysis.d9LagnaTheme}
          </p>
          <div className={styles.insightGrid}>
            {analysis.insights.map((ins) => (
              <article key={ins.title} className={cn(styles.insightCard, insightClass(ins.kind))}>
                <h4 className={styles.insightTitle}>{ins.title}</h4>
                <p className={styles.insightText}>{ins.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Mapping table ────────────────────────────────────── */}
      {tab === 'mapping' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Planet Rashi → Navamsha</h3>
            <div className={styles.sectionRule} />
          </div>
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
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {analysis.planets.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.planetCell}>
                      {p.name}
                      {p.charaKaraka ? (
                        <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {p.charaKaraka}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      {p.d1RashiShort} · H{p.d1House}
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {p.d1Degree.toFixed(1)}°
                      </span>
                    </td>
                    <td>{p.padaInSign}</td>
                    <td className={styles.arrow}>→</td>
                    <td>
                      <strong>{p.d9RashiName}</strong>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {p.d9RashiShort} · {p.d9Degree.toFixed(1)}°
                      </span>
                    </td>
                    <td>
                      <span className={cn(styles.pill, toneClass(p.d1d9Relation.tone))} title={p.d1d9Relation.label}>
                        {p.d1d9Relation.pair}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {p.d1d9Relation.label.replace(/\s*\(.*\)$/, '')}
                      </span>
                    </td>
                    <td>H{p.d9House}</td>
                    <td>
                      <span className={cn(styles.pill, dignityPill(p.d9Dignity))}>
                        {p.d9Dignity.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {p.isVargottama && <span className={cn(styles.pill, styles.pillVg)}>VG</span>}
                      {p.isPushkara && <span className={cn(styles.pill, styles.pillPk)}>PK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.detailStack}>
            {analysis.planets.map((p) => (
              <details key={`card-${p.id}`} className={styles.detailItem}>
                <summary className={styles.detailSummary}>
                  <span className={styles.planetCell}>{p.name}</span>
                  <span className={styles.mappingLine}>
                    {p.d1RashiShort} → {p.d9RashiShort} · {p.d1d9Relation.pair}
                  </span>
                  {p.isVargottama && <span className={cn(styles.pill, styles.pillVg)}>VG</span>}
                  {p.isPushkara && <span className={cn(styles.pill, styles.pillPk)}>PK</span>}
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>D1 ↔ D9 Rashi Relations</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            Sign-count from natal rashi to Navamsha rashi — e.g. Aries → Taurus = 2nd / reverse 12th → pair <strong>2/12</strong>.
          </p>

          <article className={cn(styles.insightCard, insightClass(
            analysis.advanced.lagnaRelation.tone === 'challenging' ? 'caution'
              : analysis.advanced.lagnaRelation.tone === 'supportive' ? 'strength' : 'highlight',
          ))} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>
              Lagna {analysis.advanced.lagnaRelation.pair} · {analysis.advanced.lagnaRelation.label}
            </h4>
            <p className={styles.insightText}>
              {analysis.advanced.lagnaRelation.fromName} → {analysis.advanced.lagnaRelation.toName}
              {' '}(forward {analysis.advanced.lagnaRelation.forward}, reverse {analysis.advanced.lagnaRelation.reverse}).
              {' '}{analysis.advanced.lagnaRelation.note}
            </p>
          </article>

          <div className={styles.statGrid} style={{ marginBottom: '0.85rem' }}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Supportive</div>
              <div className={styles.statValue}>{analysis.advanced.supportiveCount}</div>
              <div className={styles.statHint}>1/1 · 5/9 · 4/10</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Mixed</div>
              <div className={styles.statValue}>{analysis.advanced.mixedCount}</div>
              <div className={styles.statHint}>7/7 · 3/11</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Challenging</div>
              <div className={styles.statValue}>{analysis.advanced.challengingCount}</div>
              <div className={styles.statHint}>2/12 · 6/8</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Avg D9 Score</div>
              <div className={styles.statValue}>{analysis.advanced.averageStrength}</div>
              <div className={styles.statHint}>0–100 composite</div>
            </div>
          </div>

          <div className={styles.insightGrid} style={{ marginBottom: '1rem' }}>
            {analysis.advanced.relationBuckets.map((b) => (
              <article key={b.kind} className={cn(styles.insightCard, toneClass(b.tone))}>
                <h4 className={styles.insightTitle}>{b.pairHint} · {b.label}</h4>
                <p className={styles.insightText}>
                  {b.count} planet{b.count > 1 ? 's' : ''}:{' '}
                  {b.planets.map((p) => `${p.name} (${p.from}→${p.to})`).join(', ')}
                </p>
              </article>
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
                    <td className={styles.planetCell}>{p.name}</td>
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
                    <td style={{ maxWidth: 280, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {p.d1d9Relation.note}
                    </td>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Advanced Navamsha</h3>
            <div className={styles.sectionRule} />
          </div>

          <ul className={styles.noteList} style={{ marginBottom: '0.85rem' }}>
            {analysis.advanced.notes.map((n) => (
              <li key={n} className={styles.noteItem}>{n}</li>
            ))}
          </ul>

          <div className={styles.insightGrid} style={{ marginBottom: '0.85rem' }}>
            {analysis.advanced.strongest && (
              <article className={cn(styles.insightCard, styles.insightStrength)}>
                <h4 className={styles.insightTitle}>Strongest D9</h4>
                <p className={styles.insightText}>
                  {analysis.advanced.strongest.name} · score {analysis.advanced.strongest.score}
                </p>
              </article>
            )}
            {analysis.advanced.weakest && (
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>Needs Care in D9</h4>
                <p className={styles.insightText}>
                  {analysis.advanced.weakest.name} · score {analysis.advanced.weakest.score}
                </p>
              </article>
            )}
          </div>

          <h4 className={styles.sectionTitle} style={{ fontSize: '0.95rem', marginBottom: '0.55rem' }}>
            Dignity Crossovers
          </h4>
          {analysis.advanced.dignityCrossovers.length === 0 ? (
            <p className={styles.emptyHint}>No special D1↔D9 dignity crossovers flagged.</p>
          ) : (
            <div className={styles.cardGrid} style={{ marginBottom: '1rem' }}>
              {analysis.advanced.dignityCrossovers.map((c, i) => (
                <article
                  key={`${c.id}-${c.kind}-${i}`}
                  className={styles.planetCard}
                >
                  <div className={styles.planetCardHead}>
                    <h4 className={styles.planetName}>{c.name}</h4>
                    <span className={cn(
                      styles.pill,
                      c.kind === 'decline' || c.kind === 'neecha_navamsha' ? styles.pillWeak : styles.pillStrong,
                    )}>
                      {c.title}
                    </span>
                  </div>
                  <p className={styles.planetBody}>{c.text}</p>
                </article>
              ))}
            </div>
          )}

          <h4 className={styles.sectionTitle} style={{ fontSize: '0.95rem', marginBottom: '0.55rem' }}>
            Navamsha Dispositors
          </h4>
          <div className={styles.tableWrap} style={{ marginBottom: '1rem' }}>
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
                {analysis.advanced.dispositors.map((d) => (
                  <tr key={`disp-${d.planetId}`}>
                    <td className={styles.planetCell}>{d.planetName}</td>
                    <td>{d.d9RashiName}</td>
                    <td>{d.dispositorName}</td>
                    <td>{d.dispositorD9RashiName} · H{d.dispositorD9House}</td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{d.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className={styles.sectionTitle} style={{ fontSize: '0.95rem', marginBottom: '0.55rem' }}>
            D9 Parivartana (Exchanges)
          </h4>
          {analysis.advanced.exchanges.length === 0 ? (
            <p className={styles.emptyHint} style={{ marginBottom: '1rem' }}>No mutual sign exchanges in Navamsha.</p>
          ) : (
            <div className={styles.cardGrid} style={{ marginBottom: '1rem' }}>
              {analysis.advanced.exchanges.map((e) => (
                <article key={`${e.aId}-${e.bId}`} className={styles.planetCard}>
                  <div className={styles.mappingLine}>{e.aName} ↔ {e.bName}</div>
                  <p className={styles.planetBody}>{e.note}</p>
                </article>
              ))}
            </div>
          )}

          <h4 className={styles.sectionTitle} style={{ fontSize: '0.95rem', marginBottom: '0.55rem' }}>
            Navamsha Conjunctions
          </h4>
          {analysis.advanced.conjunctions.length === 0 ? (
            <p className={styles.emptyHint}>No multi-planet Navamsha conjunctions.</p>
          ) : (
            <div className={styles.cardGrid}>
              {analysis.advanced.conjunctions.map((c) => (
                <article key={c.rashi} className={styles.planetCard}>
                  <div className={styles.planetCardHead}>
                    <h4 className={styles.planetName}>{c.rashiName}</h4>
                    <span className={styles.pill}>H{c.house}</span>
                  </div>
                  <div className={styles.mappingLine}>{c.planets.map((p) => p.name).join(' · ')}</div>
                  <p className={styles.planetBody}>{c.note}</p>
                </article>
              ))}
            </div>
          )}

          <h4 className={styles.sectionTitle} style={{ fontSize: '0.95rem', margin: '1rem 0 0.55rem' }}>
            Strength Scores
          </h4>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Score</th>
                  <th>Relation</th>
                  <th>D9 Dignity</th>
                  <th>House</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {[...analysis.planets].sort((a, b) => b.strengthScore - a.strengthScore).map((p) => (
                  <tr key={`score-${p.id}`}>
                    <td className={styles.planetCell}>{p.name}</td>
                    <td><strong>{p.strengthScore}</strong></td>
                    <td>
                      <span className={cn(styles.pill, toneClass(p.d1d9Relation.tone))}>
                        {p.d1d9Relation.pair}
                      </span>
                    </td>
                    <td>{p.d9Dignity.replace(/_/g, ' ')}</td>
                    <td>H{p.d9House}</td>
                    <td>
                      {p.isVargottama && <span className={cn(styles.pill, styles.pillVg)}>VG</span>}
                      {p.isPushkara && <span className={cn(styles.pill, styles.pillPk)}>PK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Vargottama & Pushkara ────────────────────────────── */}
      {tab === 'vargottama' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Special Strengths</h3>
            <div className={styles.sectionRule} />
          </div>
          {analysis.lagnaVargottama && (
            <article className={cn(styles.insightCard, styles.insightStrength)} style={{ marginBottom: '0.75rem' }}>
              <h4 className={styles.insightTitle}>Vargottama Lagna</h4>
              <p className={styles.insightText}>
                Ascendant is {analysis.d9LagnaName} in both D1 and D9 — identity and life direction stay remarkably consistent.
              </p>
            </article>
          )}
          <div className={styles.cardGrid}>
            {analysis.vargottama.length === 0 && analysis.pushkaraPlanets.length === 0 && (
              <p className={styles.emptyHint}>No vargottama or Pushkara Navamsha planets in this chart.</p>
            )}
            {analysis.vargottama.map((p) => (
              <article key={`vg-${p.id}`} className={styles.planetCard}>
                <div className={styles.planetCardHead}>
                  <h4 className={styles.planetName}>{p.name}</h4>
                  <span className={cn(styles.pill, styles.pillVg)}>Vargottama</span>
                </div>
                <div className={styles.mappingLine}>{p.d1RashiName} in D1 & D9</div>
                <p className={styles.planetBody}>
                  Same-sign placement amplifies {p.name}&apos;s promise. Results tend to be steadier across life stages.
                </p>
              </article>
            ))}
            {analysis.pushkaraPlanets.map((p) => (
              <article key={`pk-${p.id}`} className={styles.planetCard}>
                <div className={styles.planetCardHead}>
                  <h4 className={styles.planetName}>{p.name}</h4>
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
        </section>
      )}

      {/* ── Marriage ─────────────────────────────────────────── */}
      {tab === 'marriage' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Marriage & Partnership</h3>
            <div className={styles.sectionRule} />
          </div>
          <div className={styles.insightGrid} style={{ marginBottom: '0.85rem' }}>
            <article className={cn(styles.insightCard, styles.insightHighlight)}>
              <h4 className={styles.insightTitle}>D9 7th House</h4>
              <p className={styles.insightText}>
                {analysis.seventhHouse.rashiName} · Lord {analysis.seventhHouse.lordName}
                {analysis.seventhHouse.occupants.length
                  ? ` · Occupied by ${analysis.seventhHouse.occupants.map((o) => o.name).join(', ')}`
                  : ' · Unoccupied'}
              </p>
            </article>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>7th Lord Journey</h4>
              <p className={styles.insightText}>
                {analysis.seventhLord.name} in {analysis.seventhLord.d9RashiName} (H{analysis.seventhLord.d9House})
                {analysis.seventhLord.isVargottama ? ' · Vargottama' : ''}
              </p>
            </article>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Spouse Sketch</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {sketch.headline}
          </p>
          <div className={styles.traitRow}>
            {sketch.traits.map((t) => (
              <span key={t} className={cn(styles.badge, styles.badgeGold)}>{t}</span>
            ))}
          </div>
          <div className={styles.sketchGrid}>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Physique / Presence</h4>
              <p className={styles.insightText}>{sketch.physique}</p>
            </article>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Temperament</h4>
              <p className={styles.insightText}>{sketch.temperament}</p>
            </article>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Values</h4>
              <p className={styles.insightText}>{sketch.values}</p>
            </article>
            <article className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Vocation Hint</h4>
              <p className={styles.insightText}>{sketch.vocationHint}</p>
            </article>
            <article className={cn(styles.sketchCard, styles.sketchWide)}>
              <h4 className={styles.insightTitle}>Relationship Style</h4>
              <p className={styles.insightText}>{sketch.relationshipStyle}</p>
            </article>
          </div>
          <div className={styles.insightGrid} style={{ marginTop: '0.85rem' }}>
            <article className={cn(styles.insightCard, styles.insightStrength)}>
              <h4 className={styles.insightTitle}>Strengths</h4>
              <ul className={styles.bulletList}>
                {sketch.strengths.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </article>
            <article className={cn(styles.insightCard, styles.insightCaution)}>
              <h4 className={styles.insightTitle}>Cautions</h4>
              <ul className={styles.bulletList}>
                {sketch.cautions.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </article>
          </div>
          <p className={styles.emptyHint} style={{ marginTop: '0.75rem' }}>
            Sources: {sketch.sources.join(' · ')}
          </p>
        </section>
      )}

      {/* ── Dasha overlay ────────────────────────────────────── */}
      {tab === 'dasha' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Vimshottari × Navamsha</h3>
            <div className={styles.sectionRule} />
          </div>
          {!dasha ? (
            <p className={styles.emptyHint}>No active Vimshottari path found. Recalculate dashas with the chart.</p>
          ) : (
            <>
              <div className={styles.insightGrid} style={{ marginBottom: '0.85rem' }}>
                <article className={cn(styles.insightCard, styles.insightHighlight)}>
                  <h4 className={styles.insightTitle}>Current Path</h4>
                  <p className={styles.insightText}>{dasha.pathLabel}</p>
                </article>
                <article className={cn(styles.insightCard, styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>Destiny Window</h4>
                  <p className={styles.insightText}>{dasha.destinyWindow}</p>
                </article>
                <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ gridColumn: '1 / -1' }}>
                  <h4 className={styles.insightTitle}>Marriage Timing Color</h4>
                  <p className={styles.insightText}>{dasha.marriageWindow}</p>
                </article>
              </div>
              <div className={styles.dashaStack}>
                {dasha.lords.map((l) => (
                  <article key={`${l.level}-${l.lord}`} className={cn(styles.dashaCard, toneClass(l.tone))}>
                    <div className={styles.dashaHead}>
                      <div>
                        <div className={styles.houseNum}>{l.levelLabel}</div>
                        <div className={styles.planetName} style={{ fontSize: '1.05rem' }}>{l.lordName}</div>
                      </div>
                      <span className={cn(styles.pill, toneClass(l.tone))}>{l.tone}</span>
                    </div>
                    <div className={styles.mappingLine}>
                      {l.d9RashiName ? `${l.d9RashiName} · D9 H${l.d9House}` : 'D9 placement unavailable'}
                      {l.d9Dignity ? ` · ${l.d9Dignity.replace(/_/g, ' ')}` : ''}
                      {l.isVargottama ? ' · VG' : ''}
                      {l.isPushkara ? ' · PK' : ''}
                    </div>
                    <div className={styles.statHint}>{l.start} → {l.end}</div>
                    <p className={styles.planetBody}>{l.note}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* ── Destiny ──────────────────────────────────────────── */}
      {tab === 'destiny' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Destiny · Dharma · Karakamsha</h3>
            <div className={styles.sectionRule} />
          </div>
          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>Karakamsha</h4>
            <p className={styles.insightText}>{analysis.karakamshaTheme}</p>
          </article>
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
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Navamsha Bhava Map</h3>
            <div className={styles.sectionRule} />
          </div>
          <div className={styles.houseGrid}>
            {analysis.houses.map((h) => (
              <article
                key={h.house}
                className={cn(
                  styles.houseCard,
                  (h.house === 1 || h.house === 7 || h.house === 9 || dashaHighlights.includes(h.house)) && styles.houseCardHot,
                )}
                title={h.theme}
              >
                <div className={styles.houseNum}>House {h.house}</div>
                <div className={styles.houseSign}>{h.rashiShort} · {h.rashiName}</div>
                <div className={styles.houseMeta}>Lord {h.lordName}</div>
                <div className={styles.housePlanets}>
                  {h.occupants.length
                    ? h.occupants.map((o) => `${o.name}${o.isVargottama ? '★' : ''}`).join(', ')
                    : '—'}
                </div>
              </article>
            ))}
          </div>
          <p className={styles.emptyHint} style={{ marginTop: '0.75rem' }}>
            ★ marks vargottama. Hot cards: lagna (1), spouse (7), dharma (9), plus active dasha houses.
          </p>
        </section>
      )}

      {/* ── Variants (Platinum) ──────────────────────────────── */}
      {tab === 'variants' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Navamsha Variants</h3>
            <div className={styles.sectionRule} />
          </div>
          <PlanGate userPlan={userPlan} required="platinum" featureName="D9 variants (Pada / Nadi / Somanatha)">
            <div className={styles.variantToolbar}>
              {(['D9', ...VARIANT_COLS] as NavamshaVariantId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={cn(styles.tabBtn, variantChart === id && styles.tabBtnActive)}
                  onClick={() => setVariantChart(id)}
                >
                  {NAVAMSHA_VARIANT_LABELS[id]}
                  {variants.lagnaNames[id] ? ` · ${variants.lagnaNames[id]}` : ''}
                </button>
              ))}
            </div>

            <div className={styles.insightGrid} style={{ margin: '0.85rem 0' }}>
              {VARIANT_COLS.map((id) => {
                const rate = variants.matchRates[id]
                const pct = rate.total ? Math.round((rate.matches / rate.total) * 100) : 0
                return (
                  <article key={id} className={cn(styles.insightCard, styles.insightInfo)}>
                    <h4 className={styles.insightTitle}>{NAVAMSHA_VARIANT_LABELS[id]} vs Parashara</h4>
                    <p className={styles.insightText}>
                      {rate.matches}/{rate.total} planets agree ({pct}%)
                      {variants.lagna.D9 && variants.lagna[id]
                        ? variants.lagna.D9 === variants.lagna[id]
                          ? ' · Lagna matches'
                          : ` · Lagna ${variants.lagnaNames[id]} vs ${variants.lagnaNames.D9}`
                        : ''}
                    </p>
                  </article>
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
                      <td className={styles.planetCell}>{p.name}</td>
                      <td>{p.d1RashiShort}</td>
                      <td><strong>{p.parasharaShort}</strong></td>
                      {VARIANT_COLS.map((id) => {
                        const r = p.variants[id]
                        const match = r === p.parashara
                        return (
                          <td key={id} style={{ color: match ? 'var(--teal, #4fd1c5)' : 'var(--text-primary)' }}>
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
            <p className={styles.emptyHint} style={{ marginTop: '0.65rem' }}>
              Selecting a variant above swaps the right-hand chart to that scheme when the chart payload includes it.
            </p>
          </PlanGate>
        </section>
      )}
    </div>
  )
}
