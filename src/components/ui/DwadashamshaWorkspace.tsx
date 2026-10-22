// ─────────────────────────────────────────────────────────────
//  src/components/ui/DwadashamshaWorkspace.tsx
//  Dedicated Dwadashamsha (D12) workspace — isolation, thirst, release
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  CloudMoon,
  Droplets,
  GitCompare,
  Layers,
  Sparkles,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeDwadashamsha,
  type D12Tone,
  type DwadashamshaInsight,
} from '@/lib/engine/dwadashamshaAnalysis'
import { RASHI_SHORT } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import styles from './DwadashamshaWorkspace.module.css'

type TabId = 'overview' | 'isolation' | 'thirst' | 'houses' | 'contrast' | 'cross'

const TABS: { id: TabId; label: string; shortLabel: string; Icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', Icon: Sparkles },
  { id: 'isolation', label: 'Isolation / Dreams', shortLabel: 'Alone', Icon: CloudMoon },
  { id: 'thirst', label: 'Thirst & Release', shortLabel: 'Thirst', Icon: Droplets },
  { id: 'houses', label: 'Key Houses', shortLabel: 'Houses', Icon: Layers },
  { id: 'contrast', label: 'D4 · D8 · D12', shortLabel: 'Contrast', Icon: GitCompare },
  { id: 'cross', label: 'Cross Vargas', shortLabel: 'Cross', Icon: Wind },
]

function insightClass(kind: DwadashamshaInsight['kind']): string {
  if (kind === 'strength') return styles.insightStrength
  if (kind === 'caution') return styles.insightCaution
  if (kind === 'highlight') return styles.insightHighlight
  return styles.insightInfo
}

function toneClass(tone: D12Tone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

interface DwadashamshaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function DwadashamshaWorkspace({ chart, userPlan: _userPlan = 'free' }: DwadashamshaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const analysis = useMemo(() => analyzeDwadashamsha(chart), [chart])
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0

  const d12Asc = (chart.vargaLagnas?.D12 ?? 1) as Rashi
  const d12Grahas = chart.vargas?.D12 ?? []

  if (!analysis) {
    return (
      <PanelShell
        title="Dwadashamsha (D12)"
        empty={{
          title: 'Dwadashamsha data unavailable',
          description: 'Recalculate the chart to generate the D12 chart and isolation / thirst interpretations.',
        }}
      >
        {null}
      </PanelShell>
    )
  }

  const { isolation, thirst, ketuRelease } = analysis

  return (
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>D12 · Dwadashamsha</p>
            <h2 className={styles.heroTitle}>
              {analysis.d12LagnaName}
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                {' '}· {analysis.d12LagnaSanskrit}
              </span>
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
          </div>
          <div className={styles.badgeRow}>
            {isolation.lagnaEmpty ? (
              <span className={cn(styles.badge, styles.badgeTeal)}>Empty lagna → lord</span>
            ) : (
              <span className={cn(styles.badge, styles.badgeGold)}>
                {isolation.occupants.map((o) => o.name).join(' · ')} on lagna
              </span>
            )}
            {isolation.aloneInDreams && (
              <span className={cn(styles.badge)} style={{ color: 'var(--rose, #fb7185)' }}>
                Alone in dreams
              </span>
            )}
            {thirst && (
              <span className={cn(styles.badge, styles.badgeGold)}>
                Thirst · {thirst.name}
              </span>
            )}
            {ketuRelease.tone === 'supportive' && (
              <span className={cn(styles.badge, styles.badgeTeal)}>Ketu release</span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>D12 Lagna</div>
            <div className={styles.statValue}>{analysis.d12LagnaName}</div>
            <div className={styles.statHint}>Isolation · Dreams · Residue</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Primary signal</div>
            <div className={styles.statValue}>
              {isolation.primarySignal.strength === 'occupation' ? 'Occupation' : 'Lagna lord'}
            </div>
            <div className={styles.statHint}>{isolation.primarySignal.label}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Thirst planet</div>
            <div className={styles.statValue}>{thirst ? thirst.name : 'None marked'}</div>
            <div className={styles.statHint}>
              {thirst ? `${thirst.rashiName} · H${thirst.house}` : 'No D12 debility'}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Ketu release</div>
            <div className={styles.statValue}>
              {ketuRelease.house != null ? `H${ketuRelease.house}` : '—'}
            </div>
            <div className={styles.statHint}>{ketuRelease.rashiName ?? '—'}</div>
          </div>
        </div>
      </header>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartLabel}>
            <span className={styles.chartTitle}>D1 · Rashi Chart</span>
            <span className={styles.chartAccent}>Today</span>
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
            <span className={styles.chartTitle}>D12 · Dwadashamsha</span>
            <span className={styles.chartAccent}>{RASHI_SHORT[d12Asc]} lagna · Yesterday</span>
          </div>
          <ChakraSelector
            ascRashi={d12Asc}
            grahas={d12Grahas}
            vargaName="D12"
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={[1, 8, 12]}
          />
        </div>
      </div>

      <div className={styles.tabScroll}>
        <div className={styles.tabRow} role="tablist" aria-label="Dwadashamsha sections">
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
            <h3 className={styles.sectionTitle}>D12 Insights</h3>
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

      {tab === 'isolation' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Isolation &amp; dream tone</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            When D3 (subconscious) and D4 (heart) are quiet — deep sleep, solitude, pressure — D12 shows what still runs.
            {isolation.lagnaEmpty ? ' Empty lagna: follow the lord’s house.' : ''}
          </p>

          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{isolation.primarySignal.label}</h4>
            <p className={styles.insightText}>{isolation.primarySignal.detail}</p>
          </article>

          <div className={styles.sketchGrid}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Sign flavor</h4>
              <p className={styles.insightText}>{isolation.signFlavor}</p>
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>
                Lagna lord · {isolation.lagnaLord.name}
              </h4>
              <p className={styles.insightText}>{isolation.lagnaLord.reading}</p>
              {isolation.lagnaLord.conjunctNames.length > 0 && (
                <p className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  With {isolation.lagnaLord.conjunctNames.join(', ')}
                </p>
              )}
            </div>
          </div>

          {isolation.occupants.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>Planets on lagna</h3>
                <div className={styles.sectionRule} />
              </div>
              <div className={styles.cardGrid}>
                {isolation.occupants.map((o) => (
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

          {isolation.aloneInDreams && (
            <article className={cn(styles.insightCard, styles.insightCaution)} style={{ marginTop: '0.85rem' }}>
              <h4 className={styles.insightTitle}>Empty kendras</h4>
              <p className={styles.insightText}>
                Houses {isolation.emptyKendras.join(', ')} are empty — the dream field can feel without a visible support system.
                Strengthen waking relationships so solitude does not equal abandonment.
              </p>
            </article>
          )}
        </section>
      )}

      {tab === 'thirst' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Thirst &amp; release</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            Whatever felt incomplete tends to become craving now. Ketu is the best D12 ally for giving away and lightening the load.
          </p>

          {thirst ? (
            <article className={cn(styles.insightCard, styles.insightCaution)} style={{ marginBottom: '0.85rem' }}>
              <h4 className={styles.insightTitle}>
                Primary thirst · {thirst.name}
              </h4>
              <p className={styles.insightText}>{thirst.reading}</p>
              <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>
                {thirst.overcompensateHint}
              </p>
              <div className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                {thirst.rashiName} · H{thirst.house} · {thirst.dignity.replace(/_/g, ' ')}
              </div>
            </article>
          ) : (
            <p className={styles.emptyHint}>No debilitated planet in D12 — thirst is quieter; watch weak dignity and 8th/12th pressure instead.</p>
          )}

          {analysis.thirstCandidates.length > 1 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '0.5rem' }}>
                <h3 className={styles.sectionTitle}>Other debilitated markers</h3>
                <div className={styles.sectionRule} />
              </div>
              <div className={styles.cardGrid}>
                {analysis.thirstCandidates.slice(1).map((t) => (
                  <article key={t.id} className={styles.planetCard}>
                    <div className={styles.planetCardHead}>
                      <h4 className={styles.planetName}>{t.name}</h4>
                      <span className={cn(styles.pill, toneClass(t.tone))}>thirst</span>
                    </div>
                    <p className={styles.planetBody}>{t.reading}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
            <h3 className={styles.sectionTitle}>Ketu · letting go</h3>
            <div className={styles.sectionRule} />
          </div>
          <article className={cn(styles.insightCard, ketuRelease.tone === 'supportive' ? styles.insightStrength : styles.insightInfo)}>
            <h4 className={styles.insightTitle}>
              Ketu
              {ketuRelease.house != null ? ` · H${ketuRelease.house}` : ''}
            </h4>
            <p className={styles.insightText}>{ketuRelease.reading}</p>
          </article>

          <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
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

      {tab === 'houses' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Focused D12 houses</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            1 alone-self · 4 root in solitude · 7 unfinished relating · 8 deep residue · 12 dreams &amp; release
          </p>
          <div className={styles.houseGrid}>
            {analysis.focusedHouses.map((h) => (
              <article
                key={h.house}
                className={cn(styles.houseCard, (h.house === 8 || h.house === 12) && styles.houseCardHot)}
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

      {tab === 'contrast' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>D4 · D8 · D12</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            Keep these distinct: heart now (D4), this-life accumulated fear (D8), already-completed residue (D12).
          </p>
          <div className={styles.insightGrid}>
            {analysis.contrasts.map((c) => (
              <article key={c.id} className={cn(styles.insightCard, c.id === 'd12' ? styles.insightHighlight : styles.insightInfo)}>
                <h4 className={styles.insightTitle}>{c.label}</h4>
                <p className={styles.insightText}>
                  <strong>{c.nature}</strong> {c.summary}
                </p>
                {c.chartNote && (
                  <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>
                    {c.chartNote}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'cross' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Cross-varga notes</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            Soft class combinations — combine thoughtfully; do not read any single varga in isolation.
          </p>
          {analysis.crossNotes.length === 0 ? (
            <p className={styles.emptyHint}>
              Related vargas (D2 / D3 / D4 / D6 / D8) are limited on this chart — open those divisions when available for fuller cross-reads.
            </p>
          ) : (
            <div className={styles.insightGrid}>
              {analysis.crossNotes.map((n) => (
                <article key={n.id} className={cn(styles.insightCard, toneClass(n.tone))}>
                  <h4 className={styles.insightTitle}>{n.title}</h4>
                  <p className={styles.insightText}>{n.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
