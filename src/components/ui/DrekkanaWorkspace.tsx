// ─────────────────────────────────────────────────────────────
//  src/components/ui/DrekkanaWorkspace.tsx
//  Dedicated Drekkana (D3) workspace — subconscious mind & effort
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Activity,
  BatteryWarning,
  Brain,
  GitCompare,
  Heart,
  Layers,
  Music,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeDrekkana,
  type D3Tone,
  type DrekkanaInsight,
} from '@/lib/engine/drekkanaAnalysis'
import { RASHI_SHORT } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import styles from './DrekkanaWorkspace.module.css'

type TabId = 'overview' | 'mind' | 'style' | 'capacity' | 'drain' | 'kama' | 'effort' | 'houses' | 'planets'

const TABS: { id: TabId; label: string; shortLabel: string; Icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', Icon: Sparkles },
  { id: 'mind', label: 'Mind Focus', shortLabel: 'Mind', Icon: Brain },
  { id: 'style', label: 'Style · Music', shortLabel: 'Style', Icon: Music },
  { id: 'capacity', label: 'Capacity · Digbala', shortLabel: 'Capacity', Icon: Activity },
  { id: 'drain', label: 'Saturn · Exhaustion', shortLabel: 'Drain', Icon: BatteryWarning },
  { id: 'kama', label: 'Desire Axis', shortLabel: 'Desire', Icon: Heart },
  { id: 'effort', label: 'Effort Sutras', shortLabel: 'Effort', Icon: GitCompare },
  { id: 'houses', label: 'Key Houses', shortLabel: 'Houses', Icon: Layers },
  { id: 'planets', label: 'Planets', shortLabel: 'Planets', Icon: Zap },
]

function insightClass(kind: DrekkanaInsight['kind']): string {
  if (kind === 'strength') return styles.insightStrength
  if (kind === 'caution') return styles.insightCaution
  if (kind === 'highlight') return styles.insightHighlight
  return styles.insightInfo
}

function toneClass(tone: D3Tone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

interface DrekkanaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function DrekkanaWorkspace({ chart, userPlan: _userPlan = 'free' }: DrekkanaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const analysis = useMemo(() => analyzeDrekkana(chart), [chart])
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const d3Asc = (chart.vargaLagnas?.D3 ?? 1) as Rashi
  const d3Grahas = chart.vargas?.D3 ?? []

  if (!analysis) {
    return (
      <PanelShell
        title="Drekkana (D3)"
        empty={{
          title: 'Drekkana data unavailable',
          description: 'Recalculate the chart to generate the D3 chart and subconscious-mind interpretations.',
        }}
      >
        {null}
      </PanelShell>
    )
  }

  const {
    mind, kamaTrikona, persistence, stuckEighth,
    saturnDrain, timeStyle, musicStudy, capacity, courage, exhaustion,
  } = analysis

  return (
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>D3 · Drekkana</p>
            <h2 className={styles.heroTitle}>
              {analysis.d3LagnaName}
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                {' '}· {analysis.d3LagnaSanskrit}
              </span>
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
          </div>
          <div className={styles.badgeRow}>
            <span className={cn(styles.badge, styles.badgeGold)}>{timeStyle.label}</span>
            <span className={cn(styles.badge, styles.badgeTeal)}>
              {capacity.style === 'marathon' ? 'Marathon' : capacity.style === 'sprint' ? 'Sprint' : 'Mixed pace'}
            </span>
            {saturnDrain.active && (
              <span className={cn(styles.badge)} style={{ color: 'var(--rose, #fb7185)' }}>
                Saturn drain
              </span>
            )}
            {kamaTrikona.active && (
              <span className={cn(styles.badge, styles.badgeGold)}>Kama axis</span>
            )}
            {stuckEighth.loaded && (
              <span className={cn(styles.badge)} style={{ color: 'var(--rose, #fb7185)' }}>
                8th trauma zone
              </span>
            )}
            {persistence.active && (
              <span className={cn(styles.badge, styles.badgeTeal)}>Persistence</span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Time orientation</div>
            <div className={styles.statValue}>{timeStyle.orientation}</div>
            <div className={styles.statHint}>{timeStyle.element} lagna</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Capacity</div>
            <div className={styles.statValue}>{capacity.style}</div>
            <div className={styles.statHint}>{capacity.digbaliCount} digbali</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Exhaustion</div>
            <div className={styles.statValue}>{exhaustion.level}</div>
            <div className={styles.statHint}>{exhaustion.score}/10</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Mind cluster</div>
            <div className={styles.statValue}>
              {mind.dominantHouse != null ? `H${mind.dominantHouse}` : '—'}
            </div>
            <div className={styles.statHint}>
              {mind.decisionStyle === 'trine-clear'
                ? 'Trine-clear'
                : mind.decisionStyle === 'dusthana-confused'
                  ? '6/8 fog'
                  : 'Mixed decisions'}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartLabel}>
            <span className={styles.chartTitle}>D1 · Rashi</span>
            <span className={styles.chartAccent}>Outer layer</span>
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
            <span className={styles.chartTitle}>D3 · Drekkana</span>
            <span className={styles.chartAccent}>{RASHI_SHORT[d3Asc]} lagna · Manas</span>
          </div>
          <ChakraSelector
            ascRashi={d3Asc}
            grahas={d3Grahas}
            vargaName="D3"
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={[1, 5, 7, 8, 9]}
          />
        </div>
      </div>

      <div className={styles.tabScroll}>
        <div className={styles.tabRow} role="tablist" aria-label="Drekkana sections">
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

      {tab === 'overview' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>D3 Insights</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            {analysis.purpose}
          </p>
          <div className={styles.insightGrid}>
            {analysis.insights.map((ins) => (
              <article key={`${ins.kind}-${ins.title}`} className={cn(styles.insightCard, insightClass(ins.kind))}>
                <h4 className={styles.insightTitle}>{ins.title}</h4>
                <p className={styles.insightText}>{ins.text}</p>
              </article>
            ))}
          </div>
          <p className={styles.heroSub} style={{ marginTop: '0.85rem', maxWidth: 'none' }}>
            {analysis.layerNote}
          </p>
          <p className={styles.heroSub} style={{ marginTop: '0.55rem', maxWidth: 'none' }}>
            {analysis.sangatNote}
          </p>
        </section>
      )}

      {tab === 'mind' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Where the mind is stuck</h3>
            <div className={styles.sectionRule} />
          </div>
          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{mind.primarySignal.label}</h4>
            <p className={styles.insightText}>{mind.primarySignal.detail}</p>
          </article>
          <div className={styles.sketchGrid}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Sign flavor</h4>
              <p className={styles.insightText}>{mind.signFlavor}</p>
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Decision style</h4>
              <p className={styles.insightText}>{mind.decisionNote}</p>
            </div>
          </div>
          <div className={styles.sketchGrid} style={{ marginTop: '0.65rem' }}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Lagna lord · {mind.lagnaLord.name}</h4>
              <p className={styles.insightText}>{mind.lagnaLord.reading}</p>
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Persistence</h4>
              <p className={styles.insightText}>{persistence.reading}</p>
            </div>
          </div>
          {stuckEighth.loaded && (
            <article className={cn(styles.insightCard, styles.insightCaution)} style={{ marginTop: '0.85rem' }}>
              <h4 className={styles.insightTitle}>8th-house stuck thoughts</h4>
              <p className={styles.insightText}>{stuckEighth.reading}</p>
            </article>
          )}
          {mind.occupants.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>Planets on lagna</h3>
                <div className={styles.sectionRule} />
              </div>
              <div className={styles.cardGrid}>
                {mind.occupants.map((o) => (
                  <article key={o.id} className={styles.planetCard}>
                    <div className={styles.planetCardHead}>
                      <h4 className={styles.planetName}>
                        {o.name}
                        {o.isRetro ? ' ℞' : ''}
                      </h4>
                    </div>
                    <p className={styles.planetBody}>{o.reading}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'style' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Time · music · study</h3>
            <div className={styles.sectionRule} />
          </div>
          <div className={styles.insightGrid}>
            <article className={cn(styles.insightCard, styles.insightHighlight)}>
              <h4 className={styles.insightTitle}>{timeStyle.label}</h4>
              <p className={styles.insightText}>{timeStyle.reading}</p>
            </article>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{musicStudy.musicLabel}</h4>
              <p className={styles.insightText}>{musicStudy.musicReading}</p>
            </article>
            <article className={cn(styles.insightCard, toneClass(musicStudy.tone))}>
              <h4 className={styles.insightTitle}>{musicStudy.studyLabel}</h4>
              <p className={styles.insightText}>{musicStudy.studyReading}</p>
            </article>
            <article className={cn(styles.insightCard, toneClass(courage.tone))}>
              <h4 className={styles.insightTitle}>3rd · Mars courage</h4>
              <p className={styles.insightText}>{courage.reading}</p>
            </article>
          </div>
        </section>
      )}

      {tab === 'capacity' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Sprint vs marathon</h3>
            <div className={styles.sectionRule} />
          </div>
          <article className={cn(styles.insightCard, insightClass(
            capacity.tone === 'challenging' ? 'caution' : capacity.tone === 'supportive' ? 'strength' : 'info',
          ))} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>
              {capacity.style} · {capacity.digbaliCount} digbali
            </h4>
            <p className={styles.insightText}>{capacity.reading}</p>
          </article>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            Digbali dashas favor self-led decisions; non-digbali periods invite outside pressure — match goals to capacity.
          </p>
          <div className={styles.cardGrid}>
            {capacity.digbali.map((d) => (
              <article key={d.id} className={styles.planetCard}>
                <div className={styles.planetCardHead}>
                  <h4 className={styles.planetName}>{d.name}</h4>
                  <span className={cn(styles.pill, d.isDigbali ? styles.toneSupportive : styles.toneNeutral)}>
                    {d.isDigbali ? 'digbali' : `needs H${d.digHouse}`}
                  </span>
                </div>
                <div className={styles.mappingLine}>Now in H{d.house}</div>
                <p className={styles.planetBody}>{d.reading}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'drain' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Saturn · trauma · exhaustion</h3>
            <div className={styles.sectionRule} />
          </div>
          <div className={styles.insightGrid}>
            <article className={cn(styles.insightCard, toneClass(saturnDrain.tone))}>
              <h4 className={styles.insightTitle}>Saturn drain</h4>
              <p className={styles.insightText}>{saturnDrain.reading}</p>
            </article>
            <article className={cn(styles.insightCard, toneClass(exhaustion.tone))}>
              <h4 className={styles.insightTitle}>
                Exhaustion · {exhaustion.level} ({exhaustion.score}/10)
              </h4>
              <p className={styles.insightText}>{exhaustion.reading}</p>
            </article>
            <article className={cn(styles.insightCard, toneClass(stuckEighth.tone))}>
              <h4 className={styles.insightTitle}>8th · trauma zone</h4>
              <p className={styles.insightText}>{stuckEighth.reading}</p>
            </article>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>Sangat / overlap</h4>
              <p className={styles.insightText}>{analysis.sangatNote}</p>
            </article>
          </div>
        </section>
      )}

      {tab === 'kama' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Desire / relating axis</h3>
            <div className={styles.sectionRule} />
          </div>
          <article className={cn(styles.insightCard, kamaTrikona.active ? styles.insightCaution : styles.insightInfo)}>
            <h4 className={styles.insightTitle}>
              {kamaTrikona.classicPattern ? 'Classic Kama Trikona' : kamaTrikona.active ? 'Desire axis active' : 'Desire axis quiet'}
            </h4>
            <p className={styles.insightText}>{kamaTrikona.reading}</p>
            <div className={styles.statHint} style={{ marginTop: '0.45rem', whiteSpace: 'normal' }}>
              Rahu H{kamaTrikona.rahuHouse ?? '—'} · Venus H{kamaTrikona.venusHouse ?? '—'} · Mercury H{kamaTrikona.mercuryHouse ?? '—'}
            </div>
          </article>
          <p className={styles.heroSub} style={{ marginTop: '0.85rem', maxWidth: 'none' }}>
            Confirm with D1 7th before over-reading. This flags subconscious focus on relating — not a guarantee of any specific behavior.
          </p>
        </section>
      )}

      {tab === 'effort' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Who puts more effort?</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            Sutra: compare house strength of self (H1) vs the other house. Stronger side carries more subconscious effort.
          </p>
          <div className={styles.insightGrid}>
            {analysis.effortCompares.map((e) => (
              <article key={e.id} className={cn(styles.insightCard, toneClass(
                e.lean === 'balanced' ? 'neutral' : e.lean === 'self' ? 'supportive' : 'mixed',
              ))}>
                <h4 className={styles.insightTitle}>{e.label}</h4>
                <p className={styles.insightText}>{e.reading}</p>
                <div className={styles.statHint} style={{ marginTop: '0.35rem', whiteSpace: 'normal' }}>
                  H1 {e.selfScore} · H{e.otherHouse} {e.otherScore}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'houses' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Focused D3 houses</h3>
            <div className={styles.sectionRule} />
          </div>
          <div className={styles.houseGrid}>
            {analysis.focusedHouses.map((h) => (
              <article
                key={h.house}
                className={cn(styles.houseCard, (h.house === 8 || h.house === 7) && styles.houseCardHot)}
              >
                <div className={styles.houseNum}>House {h.house}</div>
                <div className={styles.houseSign}>{h.rashiName}</div>
                <div className={styles.houseMeta}>
                  Lord {h.lordName}
                  <span className={cn(styles.pill, toneClass(h.tone))} style={{ marginLeft: 6 }}>
                    {h.tone}
                  </span>
                </div>
                <div className={styles.housePlanets}>
                  {h.occupants.length
                    ? h.occupants.map((o) => `${o.name}${o.isRetro ? '℞' : ''}`).join(', ')
                    : '—'}
                </div>
                <p className={styles.planetBody} style={{ marginTop: '0.4rem' }}>{h.reading}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'planets' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Planet rows</h3>
            <div className={styles.sectionRule} />
          </div>
          <div className={styles.cardGrid}>
            {analysis.planets.map((p) => (
              <article key={p.id} className={styles.planetCard}>
                <div className={styles.planetCardHead}>
                  <h4 className={styles.planetName}>
                    {p.name}
                    {p.isRetro ? ' ℞' : ''}
                  </h4>
                  <span className={cn(styles.pill, toneClass(p.tone))}>{p.tone}</span>
                </div>
                <div className={styles.mappingLine}>
                  {p.rashiName} · H{p.house} · {p.dignity.replace(/_/g, ' ')}
                </div>
                <p className={styles.planetBody}>{p.interpretation}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
