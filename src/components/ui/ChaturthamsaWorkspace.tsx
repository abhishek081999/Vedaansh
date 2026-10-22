// ─────────────────────────────────────────────────────────────
//  src/components/ui/ChaturthamsaWorkspace.tsx
//  Dedicated Chaturthamsha (D4) workspace — home, happiness, space
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  Heart,
  Home,
  Hourglass,
  Layers,
  ScrollText,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell } from '@/components/ui/patterns'
import { ChaturthamsaClassicalPanel } from '@/components/ui/ChaturthamsaClassicalPanel'
import {
  analyzeChaturthamsa,
  type ChaturthamsaInsight,
  type D4Tone,
} from '@/lib/engine/chaturthamsaAnalysis'
import { buildChaturthamsaClassical } from '@/lib/engine/chaturthamsaClassical'
import { RASHI_SHORT } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import styles from './ChaturthamsaWorkspace.module.css'

type TabId = 'overview' | 'classical' | 'heart' | 'keyPlanets' | 'houses' | 'relocation' | 'affinity'

const TABS: { id: TabId; label: string; shortLabel: string; Icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', Icon: Sparkles },
  { id: 'classical', label: 'Classical Śāstra', shortLabel: 'Śāstra', Icon: ScrollText },
  { id: 'heart', label: 'Heart (Lagna)', shortLabel: 'Heart', Icon: Heart },
  { id: 'keyPlanets', label: 'Key Planets', shortLabel: 'Keys', Icon: Home },
  { id: 'houses', label: 'Houses', shortLabel: 'Houses', Icon: Layers },
  { id: 'relocation', label: 'Relocation', shortLabel: 'Moves', Icon: Hourglass },
  { id: 'affinity', label: 'Affinity Guide', shortLabel: 'Affinity', Icon: Users },
]

function insightClass(kind: ChaturthamsaInsight['kind']): string {
  if (kind === 'strength') return styles.insightStrength
  if (kind === 'caution') return styles.insightCaution
  if (kind === 'highlight') return styles.insightHighlight
  return styles.insightInfo
}

function toneClass(tone: D4Tone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

function strengthLabel(s: string): string {
  if (s === 'occupation') return 'Occupation'
  if (s === 'lord') return 'Lagna lord'
  if (s === 'aspect') return 'Aspect'
  return 'Sign'
}

interface ChaturthamsaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function ChaturthamsaWorkspace({ chart, userPlan: _userPlan = 'free' }: ChaturthamsaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('overview')
  const analysis = useMemo(() => analyzeChaturthamsa(chart), [chart])
  const classical = useMemo(
    () => (analysis ? buildChaturthamsaClassical(analysis, chart) : null),
    [analysis, chart],
  )
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0

  const d4Asc = (chart.vargaLagnas?.D4 ?? 1) as Rashi
  const d4Grahas = chart.vargas?.D4 ?? []
  const dashaHighlights = analysis?.relocation?.highlightHouses ?? []

  if (!analysis) {
    return (
      <PanelShell
        title="Chaturthamsha (D4)"
        empty={{
          title: 'Chaturthamsha data unavailable',
          description: 'Recalculate the chart to generate the D4 chart and home / happiness interpretations.',
        }}
      >
        {null}
      </PanelShell>
    )
  }

  const { heart, keyTriad, relocation } = analysis

  return (
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>D4 · Chaturthamsha</p>
            <h2 className={styles.heroTitle}>
              {analysis.d4LagnaName}
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                {' '}· {analysis.d4LagnaSanskrit}
              </span>
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
          </div>
          <div className={styles.badgeRow}>
            {heart.lagnaEmpty ? (
              <span className={cn(styles.badge, styles.badgeTeal)}>Empty lagna → lord</span>
            ) : (
              <span className={cn(styles.badge, styles.badgeGold)}>
                {heart.occupants.map((o) => o.name).join(' · ')} on lagna
              </span>
            )}
            {heart.heartDisturbed && (
              <span className={cn(styles.badge)} style={{ color: 'var(--rose, #fb7185)' }}>
                Nodes on heart
              </span>
            )}
            {classical && (
              <span className={cn(styles.badge, styles.badgeGold)}>
                Sukhaphala {classical.sukhaphala.score}
              </span>
            )}
            {relocation?.pathLabel && (
              <span className={cn(styles.badge, styles.badgeTeal)}>
                Dasha {relocation.pathLabel}
              </span>
            )}
          </div>
        </div>

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>D4 Lagna</div>
            <div className={styles.statValue}>{analysis.d4LagnaName}</div>
            <div className={styles.statHint}>Home · Happiness · Space</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Primary signal</div>
            <div className={styles.statValue}>{strengthLabel(heart.primarySignal.strength)}</div>
            <div className={styles.statHint}>{heart.primarySignal.label}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Lagna lord</div>
            <div className={styles.statValue}>{heart.lagnaLord.name}</div>
            <div className={styles.statHint}>
              {heart.lagnaLord.rashiName} · H{heart.lagnaLord.house}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Key triad</div>
            <div className={styles.statValue}>
              {keyTriad.map((t) => t.name).join(' · ')}
            </div>
            <div className={styles.statHint}>Moon · 4th lord · Jupiter</div>
          </div>
        </div>
      </header>

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
            <span className={styles.chartTitle}>D4 · Chaturthamsha</span>
            <span className={styles.chartAccent}>
              {RASHI_SHORT[d4Asc]} lagna
              {dashaHighlights.length ? ` · dasha H${dashaHighlights.join(',')}` : ''}
            </span>
          </div>
          <ChakraSelector
            ascRashi={d4Asc}
            grahas={d4Grahas}
            vargaName="D4"
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={dashaHighlights.length ? dashaHighlights : [1, 4, 8]}
          />
        </div>
      </div>

      <div className={styles.tabScroll}>
        <div className={styles.tabRow} role="tablist" aria-label="Chaturthamsha sections">
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

      {tab === 'classical' && (
        classical
          ? <ChaturthamsaClassicalPanel classical={classical} />
          : (
            <section className={styles.section}>
              <p className={styles.emptyHint}>Classical sukhaphala unavailable for this chart.</p>
            </section>
          )
      )}

      {tab === 'overview' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>D4 Insights</h3>
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
          {analysis.conflictFlags.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>Conflict cautions</h3>
                <div className={styles.sectionRule} />
              </div>
              <ul className={styles.noteList}>
                {analysis.conflictFlags.map((f) => (
                  <li key={f.id} className={styles.noteItem}>
                    <strong>{f.title}.</strong> {f.text}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === 'heart' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>D4 Lagna — the heart</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            Hierarchy: occupation (full) → lagna lord &amp; conjunctions → aspects (~30–40%) → sign flavor (weakest).
            {heart.lagnaEmpty ? ' This lagna is empty — the lord’s address carries the story.' : ''}
          </p>

          <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
            <h4 className={styles.insightTitle}>{heart.primarySignal.label}</h4>
            <p className={styles.insightText}>{heart.primarySignal.detail}</p>
          </article>

          <div className={styles.sketchGrid}>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>Sign flavor</h4>
              <p className={styles.insightText}>{heart.signFlavor}</p>
            </div>
            <div className={styles.sketchCard}>
              <h4 className={styles.insightTitle}>
                Lagna lord · {heart.lagnaLord.name}
              </h4>
              <p className={styles.insightText}>{heart.lagnaLord.reading}</p>
              {heart.lagnaLord.conjunctNames.length > 0 && (
                <p className={styles.statHint} style={{ marginTop: '0.4rem', whiteSpace: 'normal' }}>
                  With {heart.lagnaLord.conjunctNames.join(', ')}
                </p>
              )}
            </div>
          </div>

          {heart.occupants.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>Planets on lagna</h3>
                <div className={styles.sectionRule} />
              </div>
              <div className={styles.cardGrid}>
                {heart.occupants.map((o) => (
                  <article key={o.id} className={styles.planetCard}>
                    <div className={styles.planetCardHead}>
                      <h4 className={styles.planetName}>
                        {o.name}
                        {o.isRetro ? ' ℞' : ''}
                      </h4>
                    </div>
                    <p className={styles.planetBody}>{o.reading}</p>
                    {o.signExtras.length > 0 && (
                      <ul className={styles.bulletList}>
                        {o.signExtras.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}

          {heart.aspectsOnLagna.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>Aspects on lagna (partial)</h3>
                <div className={styles.sectionRule} />
              </div>
              <ul className={styles.noteList}>
                {heart.aspectsOnLagna.map((a) => (
                  <li key={a.id} className={styles.noteItem}>
                    <strong>{a.name}</strong> from H{a.fromHouse} ({a.fromRashiName}). {a.note}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === 'keyPlanets' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Moon · 4th lord · Jupiter</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            These three frame emotional climate, where happiness is sought, and whether contentment (santosh) holds.
          </p>
          <div className={styles.cardGrid}>
            {keyTriad.map((t) => (
              <article key={t.role} className={styles.planetCard}>
                <div className={styles.planetCardHead}>
                  <h4 className={styles.planetName}>{t.name}</h4>
                  <span className={cn(styles.pill, toneClass(t.tone))}>{t.tone}</span>
                </div>
                <div className={styles.mappingLine}>{t.roleLabel}</div>
                <p className={styles.planetBody}>
                  {t.rashiName} · H{t.house} · {t.dignity.replace(/_/g, ' ')}
                  {t.isRetro ? ' · ℞' : ''}
                </p>
                <p className={styles.planetBody}>{t.reading}</p>
              </article>
            ))}
          </div>

          {analysis.retrogradeNotes.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1.1rem' }}>
                <h3 className={styles.sectionTitle}>Retrograde intensity</h3>
                <div className={styles.sectionRule} />
              </div>
              <ul className={styles.noteList}>
                {analysis.retrogradeNotes.map((n) => (
                  <li key={n} className={styles.noteItem}>{n}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === 'houses' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Focused D4 houses</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            3 communication · 4 internal happiness · 6 conflict · 8 secrets &amp; moves · 9 father · 11 desires
          </p>
          <div className={styles.houseGrid}>
            {analysis.focusedHouses.map((h) => (
              <article
                key={h.house}
                className={cn(styles.houseCard, (h.house === 4 || h.house === 8) && styles.houseCardHot)}
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

      {tab === 'relocation' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Residence change</h3>
            <div className={styles.sectionRule} />
          </div>
          {!relocation ? (
            <p className={styles.emptyHint}>Relocation timing unavailable.</p>
          ) : (
            <>
              <article className={cn(styles.insightCard, insightClass(
                relocation.tone === 'challenging' ? 'caution'
                  : relocation.tone === 'supportive' ? 'strength' : 'highlight',
              ))} style={{ marginBottom: '0.85rem' }}>
                <h4 className={styles.insightTitle}>{relocation.headline}</h4>
                <p className={styles.insightText}>{relocation.detail}</p>
              </article>

              <div className={styles.statGrid} style={{ marginBottom: '0.85rem' }}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>D4 8th occupants</div>
                  <div className={styles.statValue}>
                    {relocation.eighthOccupants.length
                      ? relocation.eighthOccupants.map((o) => o.name).join(', ')
                      : 'None'}
                  </div>
                  <div className={styles.statHint}>Their dashas time moves</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>8th / occupant period</div>
                  <div className={styles.statValue}>{relocation.eighthLordPeriodActive ? 'Active' : 'Quiet'}</div>
                  <div className={styles.statHint}>Current path</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>MD–AD 6/8 link</div>
                  <div className={styles.statValue}>{relocation.sixthEighthDashaLink ? 'Yes' : 'No'}</div>
                  <div className={styles.statHint}>Class relocation rule</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Path</div>
                  <div className={styles.statValue}>{relocation.pathLabel || '—'}</div>
                  <div className={styles.statHint}>Vimshottari</div>
                </div>
              </div>

              {relocation.dashaLords.length > 0 && (
                <div className={styles.dashaStack}>
                  {relocation.dashaLords.map((l) => (
                    <article key={`${l.level}-${l.lord}`} className={cn(styles.dashaCard, toneClass(l.tone))}>
                      <div className={styles.planetCardHead}>
                        <h4 className={styles.planetName}>
                          {l.levelLabel} · {l.lordName}
                        </h4>
                        <span className={cn(styles.pill, toneClass(l.tone))}>
                          {l.d4House != null ? `H${l.d4House}` : '—'}
                        </span>
                      </div>
                      <div className={styles.statHint} style={{ whiteSpace: 'normal' }}>
                        {l.start} → {l.end}
                        {l.d4RashiName ? ` · ${l.d4RashiName}` : ''}
                      </div>
                      <p className={styles.planetBody}>{l.note}</p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {tab === 'affinity' && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Roommate / partner affinity</h3>
            <div className={styles.sectionRule} />
          </div>
          <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
            Single-chart guide from D4 lagna occupants. For full couple overlay, use Milan match-making (D4 step).
          </p>
          <div className={styles.insightGrid}>
            {analysis.affinityGuide.map((n) => (
              <article key={n.pair} className={cn(styles.insightCard, toneClass(n.tone))}>
                <h4 className={styles.insightTitle}>{n.title}</h4>
                <p className={styles.insightText}>{n.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
