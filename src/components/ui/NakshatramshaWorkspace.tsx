// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatramshaWorkspace.tsx
//  Dedicated Nakshatramsha (D27) workspace — bandwidth & ask themes
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Activity,
  Layers,
  MessageCircle,
  Sparkles,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeNakshatramsha,
  type D27Tone,
  type NakshatramshaInsight,
} from '@/lib/engine/nakshatramshaAnalysis'
import { RASHI_SHORT } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import styles from './NakshatramshaWorkspace.module.css'

type TabId = 'overview' | 'bandwidth' | 'ask' | 'layer' | 'houses' | 'planets'

const TABS: { id: TabId; label: string; shortLabel: string; Icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', Icon: Sparkles },
  { id: 'bandwidth', label: 'Bandwidth', shortLabel: 'Capacity', Icon: Activity },
  { id: 'ask', label: 'Likely Asks', shortLabel: 'Asks', Icon: MessageCircle },
  { id: 'layer', label: 'D1→D3→D27', shortLabel: 'Layers', Icon: Waves },
  { id: 'houses', label: 'Key Houses', shortLabel: 'Houses', Icon: Layers },
  { id: 'planets', label: 'Planets', shortLabel: 'Planets', Icon: Zap },
]

function insightClass(kind: NakshatramshaInsight['kind']): string {
  if (kind === 'strength') return styles.insightStrength
  if (kind === 'caution') return styles.insightCaution
  if (kind === 'highlight') return styles.insightHighlight
  return styles.insightInfo
}

function toneClass(tone: D27Tone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

interface NakshatramshaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function NakshatramshaWorkspace({ chart, userPlan: _userPlan = 'free' }: NakshatramshaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const analysis = useMemo(() => analyzeNakshatramsha(chart), [chart])
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const d27Asc = (chart.vargaLagnas?.D27 ?? 1) as Rashi
  const d27Grahas = chart.vargas?.D27 ?? []

  if (!analysis) {
    return (
      <PanelShell
        title="Nakshatramsha (D27)"
        empty={{
          title: 'Nakshatramsha data unavailable',
          description: 'Recalculate the chart to generate the D27 chart and bandwidth / consultation interpretations.',
        }}
      >
        {null}
      </PanelShell>
    )
  }

  const { focus, bandwidth, askThemes, layerLink } = analysis

  return (
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>D27 · Nakshatramsha / Bhamsha</p>
            <h2 className={styles.heroTitle}>
              {analysis.d27LagnaName}
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                {' '}· {analysis.d27LagnaSanskrit}
              </span>
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
          </div>
          <div className={styles.badgeRow}>
            <span className={cn(styles.badge, bandwidth.tone === 'supportive' ? styles.badgeTeal : bandwidth.tone === 'challenging' ? styles.badgeGold : styles.badge)}>
              {bandwidth.label}
            </span>
            {askThemes[0] && (
              <span className={cn(styles.badge, styles.badgeGold)}>
                Ask · H{askThemes[0].house}
              </span>
            )}
            {layerLink.d3OverlapNote && (
              <span className={cn(styles.badge, styles.badgeTeal)}>D3↔D27 repeat</span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>D27 Lagna</div>
            <div className={styles.statValue}>{analysis.d27LagnaName}</div>
            <div className={styles.statHint}>Fine consciousness</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Bandwidth</div>
            <div className={styles.statValue}>{bandwidth.score}/20</div>
            <div className={styles.statHint}>{bandwidth.band}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Top ask</div>
            <div className={styles.statValue}>
              {askThemes[0] ? `H${askThemes[0].house}` : '—'}
            </div>
            <div className={styles.statHint}>{askThemes[0]?.theme ?? '—'}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Lagna lord</div>
            <div className={styles.statValue}>{focus.lagnaLord.name}</div>
            <div className={styles.statHint}>
              {focus.lagnaLord.rashiName} · H{focus.lagnaLord.house}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartLabel}>
            <span className={styles.chartTitle}>D1 · Rashi</span>
            <span className={styles.chartAccent}>Outer</span>
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
            <span className={styles.chartTitle}>D27 · Nakshatramsha</span>
            <span className={styles.chartAccent}>{RASHI_SHORT[d27Asc]} lagna · Bandwidth</span>
          </div>
          <ChakraSelector
            ascRashi={d27Asc}
            grahas={d27Grahas}
            vargaName="D27"
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={[1, 4, 7, 10]}
          />
        </div>
      </div>

      <div className={styles.tabScroll}>
        <div className={styles.tabRow} role="tablist" aria-label="Nakshatramsha sections">
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
            <h3 className={styles.sectionTitle}>D27 Insights</h3>
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
        </section>
      )}

      {tab === 'bandwidth' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Pressure capacity</h3>
            <div className={styles.sectionRule} />
          </div>
          <article className={cn(styles.insightCard, insightClass(
            bandwidth.tone === 'challenging' ? 'caution' : bandwidth.tone === 'supportive' ? 'strength' : 'info',
          ))}>
            <h4 className={styles.insightTitle}>
              {bandwidth.label} · {bandwidth.score}/20
            </h4>
            <p className={styles.insightText}>{bandwidth.reading}</p>
          </article>
          <div className={styles.sketchGrid} style={{ marginTop: '0.85rem' }}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Sign flavor</h4>
              <p className={styles.insightText}>{focus.signFlavor}</p>
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Lagna lord · {focus.lagnaLord.name}</h4>
              <p className={styles.insightText}>{focus.lagnaLord.reading}</p>
            </div>
          </div>
          <p className={styles.heroSub} style={{ marginTop: '0.85rem', maxWidth: 'none' }}>
            Speaker analogy: circumstances change volume and frequency, but D27 sketches the maximum handleable load — not a medical or clinical risk score.
          </p>
        </section>
      )}

      {tab === 'ask' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>What may be voiced</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            Sutra: energy that cannot generate cleanly in D27 is often exactly what the client asks about.
          </p>
          <article className={cn(styles.insightCard, styles.insightInfo)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>Consultation hint</h4>
            <p className={styles.insightText}>{focus.consultationHint}</p>
          </article>
          <div className={styles.insightGrid}>
            {askThemes.map((a) => (
              <article key={a.house} className={cn(styles.insightCard, toneClass(a.tone))}>
                <h4 className={styles.insightTitle}>
                  H{a.house} · {a.theme}
                </h4>
                <p className={styles.insightText}>{a.reading}</p>
                <div className={styles.statHint} style={{ marginTop: '0.35rem', whiteSpace: 'normal' }}>
                  Vitality {a.vitalityScore}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'layer' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Consciousness layers</h3>
            <div className={styles.sectionRule} />
          </div>
          <article className={cn(styles.insightCard, styles.insightHighlight)}>
            <h4 className={styles.insightTitle}>D1 → D3 → D27</h4>
            <p className={styles.insightText}>{layerLink.reading}</p>
          </article>
          {layerLink.d3LagnaName && (
            <p className={styles.heroSub} style={{ marginTop: '0.85rem', maxWidth: 'none' }}>
              D3 lagna: {layerLink.d3LagnaName}. Open Drekkana (D3) beside this tab for silent mind-loops vs voiced D27 asks.
            </p>
          )}
        </section>
      )}

      {tab === 'houses' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Focused D27 houses</h3>
            <div className={styles.sectionRule} />
          </div>
          <div className={styles.houseGrid}>
            {analysis.focusedHouses.map((h) => (
              <article
                key={h.house}
                className={cn(styles.houseCard, (h.house === 1 || h.house === 7) && styles.houseCardHot)}
              >
                <div className={styles.houseNum}>House {h.house}</div>
                <div className={styles.houseSign}>{h.rashiName}</div>
                <div className={styles.houseMeta}>
                  Vitality {h.vitalityScore}
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
