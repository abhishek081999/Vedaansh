// ─────────────────────────────────────────────────────────────
//  src/components/ui/DashamsaWorkspace.tsx
//  D10 workspace — Energy · Karma Verticals · Sectors & Signs
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Briefcase,
  GitBranch,
  HandHeart,
  Layers,
  LifeBuoy,
  Microscope,
  ScrollText,
  Sparkles,
  Target,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PanelShell } from '@/components/ui/patterns'
import {
  analyzeDashamsa,
  type CareerTone,
  type DashamsaInsight,
} from '@/lib/engine/dashamsaAnalysis'
import { buildDashamsaClassical } from '@/lib/engine/dashamsaClassical'
import { buildDashamsaPractical } from '@/lib/engine/dashamsaPractical'
import { buildDashamsaSynthesis } from '@/lib/engine/dashamsaSynthesis'
import { buildDashamsaAdvanced } from '@/lib/engine/dashamsaAdvanced'
import { DashamsaClassicalPanel } from '@/components/ui/DashamsaClassicalPanel'
import { DashamsaSynthesisPanel } from '@/components/ui/DashamsaSynthesisPanel'
import { DashamsaAdvancedPanel } from '@/components/ui/DashamsaAdvancedPanel'
import { RASHI_SHORT } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import type { ChartOutput, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import styles from './DashamsaWorkspace.module.css'

type TabId = 'energy' | 'classical' | 'synthesis' | 'advanced' | 'karma' | 'sectors' | 'pending' | 'bondage' | 'karmaYoga' | 'circuit' | 'survival'

const TABS: { id: TabId; label: string; shortLabel: string; Icon: LucideIcon }[] = [
  { id: 'energy', label: 'Dashamsha Energy', shortLabel: 'Energy', Icon: Sparkles },
  { id: 'classical', label: 'Classical Śāstra', shortLabel: 'Śāstra', Icon: ScrollText },
  { id: 'synthesis', label: 'Career Synthesis', shortLabel: 'Synth', Icon: Target },
  { id: 'advanced', label: 'Advanced Technical', shortLabel: 'Adv', Icon: Microscope },
  { id: 'survival', label: 'Survival Practice', shortLabel: 'Survival', Icon: LifeBuoy },
  { id: 'bondage', label: 'Soul Bondage', shortLabel: 'Bondage', Icon: Waypoints },
  { id: 'circuit', label: 'Multi-Varga Circuit', shortLabel: 'Circuit', Icon: GitBranch },
  { id: 'karmaYoga', label: 'Karma Yoga', shortLabel: 'Gītā', Icon: BookOpen },
  { id: 'karma', label: 'Karma Verticals', shortLabel: 'Karma', Icon: Layers },
  { id: 'sectors', label: 'Sectors & Signs', shortLabel: 'Sectors', Icon: Briefcase },
  { id: 'pending', label: 'Pending Karma', shortLabel: 'Pending', Icon: HandHeart },
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

function insightClass(kind: DashamsaInsight['kind']): string {
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

function toneClass(tone: CareerTone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <div className={styles.sectionRule} />
      </div>
      {children}
    </section>
  )
}

interface DashamsaWorkspaceProps {
  chart: ChartOutput
  userPlan?: UserPlan
}

export function DashamsaWorkspace({ chart, userPlan: _userPlan = 'free' }: DashamsaWorkspaceProps) {
  const [tab, setTab] = useState<TabId>('energy')
  const [transitPositions, setTransitPositions] = useState<
    { id: GrahaId; rashi: Rashi; isRetro?: boolean }[] | undefined
  >(undefined)

  useEffect(() => {
    let cancelled = false
    const ayan = chart.meta?.settings?.ayanamsha ?? 'lahiri'
    const date = new Date().toISOString().slice(0, 10)
    fetch(`/api/transits/planets?date=${date}&ayanamsha=${encodeURIComponent(ayan)}`)
      .then((r) => r.json())
      .then((json: { success?: boolean; grahas?: { id: GrahaId; rashi: number; isRetro?: boolean }[] }) => {
        if (cancelled || !json?.success || !json.grahas?.length) return
        setTransitPositions(
          json.grahas.map((g) => ({
            id: g.id,
            rashi: g.rashi as Rashi,
            isRetro: g.isRetro,
          })),
        )
      })
      .catch(() => {
        /* gochara stays optional */
      })
    return () => { cancelled = true }
  }, [chart.meta?.settings?.ayanamsha])

  const analysis = useMemo(() => analyzeDashamsa(chart), [chart])
  const practical = useMemo(
    () => (analysis ? buildDashamsaPractical(analysis, chart) : null),
    [analysis, chart],
  )
  const classical = useMemo(
    () => (analysis ? buildDashamsaClassical(analysis, chart) : null),
    [analysis, chart],
  )
  const synthesis = useMemo(
    () => (analysis && classical
      ? buildDashamsaSynthesis(analysis, classical, chart, { transitPositions })
      : null),
    [analysis, classical, chart, transitPositions],
  )
  const advanced = useMemo(
    () => (analysis && classical
      ? buildDashamsaAdvanced(analysis, classical, chart)
      : null),
    [analysis, classical, chart],
  )
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0

  if (!analysis || !practical) {
    return (
      <PanelShell
        title="Dashamsha (D10)"
        empty={{
          title: 'Dashamsha data unavailable',
          description: 'Recalculate the chart to generate the D10 Dashamsha chart and career interpretations.',
        }}
      >
        {null}
      </PanelShell>
    )
  }

  const dasha = analysis.dashaOverlay
  const dashaHighlights = dasha?.highlightHouses ?? []
  const d10Asc = analysis.d10Lagna
  const d10Grahas = chart.vargas?.D10 ?? []
  const { karma, sectors, pending, bondage, karmaYoga, circuit, survival } = practical

  return (
    <div className={styles.workspace}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>D10 · Dashamsha</p>
            <h2 className={styles.heroTitle}>
              {analysis.d10LagnaName}
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> · {analysis.d10LagnaSanskrit}</span>
            </h2>
            <p className={styles.heroSub}>{analysis.summary}</p>
          </div>
          <div className={styles.badgeRow}>
            <span className={cn(styles.badge, styles.badgeGold)}>
              Digpala {analysis.lagnaDigpala.name}
            </span>
            {classical && (
              <span className={cn(styles.badge, styles.badgeGold)}>
                Mahatphala {classical.mahatphala.gradeLabel}
              </span>
            )}
            {synthesis && (
              <span className={cn(styles.badge, styles.badgeTeal)}>
                {synthesis.track.id} · A10 {synthesis.a10.rashiShort}
              </span>
            )}
            {advanced && (
              <span className={cn(styles.badge, styles.badgeTeal)}>
                Adv {advanced.raja.filter((r) => r.formed).length} links
              </span>
            )}
            <span className={cn(styles.badge, styles.badgeTeal)}>
              Sector {sectors.lagnaSector.short}
            </span>
            <span className={cn(styles.badge, karma.recognition.tone === 'supportive' ? styles.badgeGold : styles.badgeTeal)}>
              Recognition {karma.recognition.score}%
            </span>
            {analysis.direction.foreignTheme && (
              <span className={cn(styles.badge, styles.badgeTeal)}>Overseas / West</span>
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
            <div className={styles.statLabel}>Dashamsha Lagna</div>
            <div className={styles.statValue}>{analysis.d10LagnaName}</div>
            <div className={styles.statHint}>Ājīvikā · Karma · Respect</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Lagna Digpala</div>
            <div className={styles.statValue}>{analysis.lagnaDigpala.name}</div>
            <div className={styles.statHint}>{analysis.direction.compass}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>10th Lord Digpala</div>
            <div className={styles.statValue}>{analysis.keyLords[1]?.digpalaName ?? '—'}</div>
            <div className={styles.statHint}>
              {analysis.keyLords[1]
                ? `${analysis.keyLords[1].name} · H${analysis.keyLords[1].d10House}`
                : 'Work karma style'}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Primary sector</div>
            <div className={styles.statValue}>{sectors.lagnaSector.short}</div>
            <div className={styles.statHint}>{sectors.lagnaSector.headline}</div>
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
            <span className={styles.chartTitle}>D10 · Dashamsha</span>
            <span className={styles.chartAccent}>
              {RASHI_SHORT[d10Asc]} lagna
              {dashaHighlights.length ? ` · dasha H${dashaHighlights.join(',')}` : ''}
            </span>
          </div>
          <ChakraSelector
            ascRashi={d10Asc}
            grahas={d10Grahas}
            vargaName="D10"
            lagnas={chart.lagnas}
            moonNakIndex={moonNakIndex}
            defaultStyle="north"
            size={280}
            showCharaDrishtiControls
            highlightHouses={dashaHighlights.length ? dashaHighlights : [1, 10, 11]}
          />
        </div>
      </div>

      <div className={styles.tabScroll}>
        <div className={styles.tabRow} role="tablist" aria-label="Dashamsha sections">
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
          ? <DashamsaClassicalPanel classical={classical} />
          : <p className={styles.heroSub}>Classical reading needs D1 lagna and the Dashamsha planets.</p>
      )}

      {tab === 'synthesis' && (
        synthesis
          ? <DashamsaSynthesisPanel synthesis={synthesis} />
          : <p className={styles.heroSub}>Synthesis needs A10 arudhas plus the Classical Śāstra reading.</p>
      )}

      {tab === 'advanced' && (
        advanced
          ? <DashamsaAdvancedPanel advanced={advanced} />
          : <p className={styles.heroSub}>Advanced technical needs Dashamsha planets plus the Classical Śāstra reading.</p>
      )}

      {tab === 'energy' && (
        <>
          <Section title="Dashamsha Energy">
            <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
              {analysis.d10LagnaTheme}
            </p>
            <div className={styles.insightGrid}>
              {analysis.insights.map((ins) => (
                <article key={ins.title} className={cn(styles.insightCard, insightClass(ins.kind))}>
                  <h4 className={styles.insightTitle}>{ins.title}</h4>
                  <p className={styles.insightText}>{ins.text}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Prediction protocol">
            <ol style={{ margin: '0 0 1rem', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {analysis.advanced.protocol.map((step) => (
                <li key={step} style={{ marginBottom: 6 }}>{step}</li>
              ))}
            </ol>
            <div className={styles.insightGrid}>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>Lagna Digpala</h4>
                <p className={styles.insightText}>{analysis.advanced.lagnaDigpalaReading}</p>
              </article>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>10th lord Digpala</h4>
                <p className={styles.insightText}>{analysis.advanced.tenthLordDigpalaReading}</p>
              </article>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>11th lord · awards</h4>
                <p className={styles.insightText}>{analysis.advanced.eleventhLordReading}</p>
              </article>
              <article className={cn(styles.insightCard, styles.insightInfo)}>
                <h4 className={styles.insightTitle}>Creation vs fame</h4>
                <p className={styles.insightText}>{analysis.advanced.creationVsFame}</p>
              </article>
            </div>
          </Section>

          <Section title="D1 → D10 mapping">
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Planet</th>
                    <th>D1</th>
                    <th>Part</th>
                    <th>D10</th>
                    <th>Digpala</th>
                    <th>House</th>
                    <th>Dignity</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.planets.map((p) => (
                    <tr key={p.id}>
                      <td className={styles.planetCell}>{p.name}</td>
                      <td>{p.d1RashiShort} · H{p.d1House}</td>
                      <td>{p.partInSign}/10</td>
                      <td><strong>{p.d10RashiShort}</strong></td>
                      <td>{p.digpala.name}</td>
                      <td>H{p.d10House}</td>
                      <td>
                        <span className={cn(styles.pill, dignityPill(p.d10Dignity))}>
                          {p.d10Dignity.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Direction · Profession · Ethics · Lords">
            <div className={styles.insightGrid}>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>Direction</h4>
                <p className={styles.insightText}>
                  <strong>{analysis.direction.compass}</strong> — {analysis.direction.advice}
                </p>
              </article>
              <article className={cn(styles.insightCard, styles.insightInfo)}>
                <h4 className={styles.insightTitle}>{analysis.profession.headline}</h4>
                <p className={styles.insightText}>{analysis.profession.respectPath}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {analysis.profession.fields.slice(0, 5).join(' · ')}
                </p>
              </article>
              <article className={cn(styles.insightCard, insightClass(analysis.ethics.tone === 'challenging' ? 'caution' : 'info'))}>
                <h4 className={styles.insightTitle}>{analysis.ethics.headline}</h4>
                <p className={styles.insightText}>{analysis.ethics.text}</p>
              </article>
              {analysis.keyLords.map((k) => (
                <article key={k.role} className={cn(styles.insightCard, styles.insightHighlight)}>
                  <h4 className={styles.insightTitle}>{k.role}</h4>
                  <p className={styles.insightText}>
                    <strong>{k.name}</strong> · {k.d10RashiName} H{k.d10House} · {k.digpalaName}
                  </p>
                  <p className={styles.insightText} style={{ marginTop: 6 }}>{k.note}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Dasha × D10">
            {dasha ? (
              <>
                <p className={styles.heroSub} style={{ marginBottom: '0.5rem' }}>{dasha.careerWindow}</p>
                <p className={styles.heroSub} style={{ marginBottom: '0.85rem' }}>{dasha.fameWindow}</p>
                <div className={styles.insightGrid}>
                  {dasha.lords.map((l) => (
                    <article key={`${l.level}-${l.lord}`} className={cn(styles.insightCard, styles.insightInfo)}>
                      <h4 className={styles.insightTitle}>
                        {l.levelLabel} · {l.lordName}
                        <span className={cn(styles.pill, toneClass(l.tone))} style={{ marginLeft: 8 }}>{l.tone}</span>
                      </h4>
                      <p className={styles.insightText}>{l.note}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.heroSub}>No active Vimshottari path.</p>
            )}
          </Section>
        </>
      )}

      {tab === 'bondage' && (
        <>
          <Section title="Why this soul took a body">
            <p className={styles.heroSub} style={{ marginBottom: 0, maxWidth: 'none' }}>{bondage.framing}</p>
          </Section>

          <Section title="Golden order — House → Sign → Planet">
            <ol style={{ margin: '0 0 0.5rem', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {bondage.goldenOrder.map((s) => (
                <li key={s} style={{ marginBottom: 6 }}>{s}</li>
              ))}
            </ol>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Jumping to the planet first is the most common student error — it makes predictions fast and wrong.
            </p>
          </Section>

          <Section title="Layered reading on this chart">
            <div className={styles.insightGrid}>
              {bondage.layered.map((layer) => (
                <article key={layer.id} className={cn(styles.insightCard, styles.insightHighlight)}>
                  <h4 className={styles.insightTitle}>{layer.title}</h4>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{layer.priority}</p>
                  <p className={styles.insightText}><strong>1 · House:</strong> {layer.house.label} — {layer.house.text}</p>
                  <p className={styles.insightText} style={{ marginTop: 6 }}><strong>2 · Sign:</strong> {layer.rashi.label} — {layer.rashi.text}</p>
                  <p className={styles.insightText} style={{ marginTop: 6 }}><strong>3 · Planet:</strong> {layer.planet.label} — {layer.planet.text}</p>
                  <p className={styles.insightText} style={{ marginTop: 8 }}>{layer.synthesis}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Inherited karma by planet">
            <div className={styles.insightGrid}>
              {bondage.inherited.map((p) => (
                <article
                  key={p.id}
                  className={cn(
                    styles.insightCard,
                    p.strengthHint === 'strong'
                      ? styles.insightHighlight
                      : p.strengthHint === 'soft'
                        ? styles.insightCaution
                        : styles.insightInfo,
                  )}
                >
                  <h4 className={styles.insightTitle}>
                    {p.name}
                    <span className={styles.pill} style={{ marginLeft: 8 }}>{p.strengthHint}</span>
                  </h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {p.source}
                  </p>
                  <p className={styles.insightText}>{p.detail}</p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {p.d10House != null ? `D10 H${p.d10House} ${p.d10RashiName}` : 'Not in classical set'}
                    {' · '}{p.toolNote}
                  </p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Tools given to navigate bondage">
            <div className={styles.insightGrid}>
              {bondage.navigationTools.map((t) => (
                <article key={t.planet} className={cn(styles.insightCard, t.active ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {t.planet}
                    {t.active
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>Strong</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>Quiet</span>}
                  </h4>
                  <p className={styles.insightText}>{t.how}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Reading principles">
            <ul style={{ margin: '0 0 0.85rem', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {bondage.principles.map((p) => (
                <li key={p} style={{ marginBottom: 6 }}>{p}</li>
              ))}
            </ul>
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>Homework</h4>
              <p className={styles.insightText}>{bondage.homework}</p>
            </article>
          </Section>
        </>
      )}

      {tab === 'karma' && (
        <>
          <Section title="Why D10 matters today">
            <p className={styles.heroSub} style={{ marginBottom: 0, maxWidth: 'none' }}>{karma.whyToday}</p>
          </Section>

          <Section title="Karmic bonds (D10 Lagna ↔ others’ D1)">
            <article className={cn(styles.insightCard, styles.insightHighlight)}>
              <h4 className={styles.insightTitle}>
                Match sign {karma.bonds.d10LagnaName}
              </h4>
              <p className={styles.insightText}>{karma.bonds.text}</p>
              <p className={styles.insightText} style={{ marginTop: 8 }}>
                Occupants: {karma.bonds.occupants.join(', ') || '—'} · Lagna lord {karma.bonds.lagnaLordName} in H{karma.bonds.lagnaLordHouse}
              </p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {karma.bonds.mutualTip}
              </p>
            </article>
          </Section>

          <Section title="2nd house — speech, lineage, stored wealth">
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>
                Family & Vāṇī karma
                {karma.secondHouse.speechBased && <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>Speech-led</span>}
                {karma.secondHouse.lineageLink && <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 6 }}>Lineage</span>}
              </h4>
              <p className={styles.insightText}>{karma.secondHouse.text}</p>
              <ul style={{ margin: '0.6rem 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {karma.secondHouse.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </article>
          </Section>

          <Section title="Moon-as-lagna — where the mind is stuck">
            <p className={styles.heroSub} style={{ marginBottom: '0.75rem' }}>
              Recast D10 with Moon as lagna ({karma.moonMind.moonAscName}) to see karmic entanglement of the mind.
            </p>
            <div className={styles.insightGrid}>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>4th from Moon · sukha sought</h4>
                <p className={styles.insightText}>{karma.moonMind.sukhNote}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {karma.moonMind.sukhOccupants.join(' · ') || 'Empty'}
                </p>
              </article>
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>12th from Moon · bulb’s shadow</h4>
                <p className={styles.insightText}>{karma.moonMind.twelfthNote}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {karma.moonMind.twelfthOccupants.join(' · ') || 'Empty'}
                </p>
              </article>
              <article className={cn(styles.insightCard, karma.moonMind.fireInitiative ? styles.insightHighlight : styles.insightInfo)}>
                <h4 className={styles.insightTitle}>Fire 1–5–9 initiative</h4>
                <p className={styles.insightText}>{karma.moonMind.fireNote}</p>
              </article>
            </div>
          </Section>

          <Section title="Three verticals — body · mind · soul">
            <p className={styles.heroSub} style={{ marginBottom: '0.85rem' }}>
              Recast D10 from Lagna (body), Moon (mind / Matṛ-ṛṇa), and Sun (soul attachment). Compare all three.
            </p>
            <div className={styles.insightGrid}>
              {karma.verticals.map((v) => (
                <article key={v.id} className={cn(styles.insightCard, styles.insightHighlight)}>
                  <h4 className={styles.insightTitle}>
                    {v.label} / {v.labelSa}
                    <span style={{ fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>
                      rises {v.ascName}
                    </span>
                  </h4>
                  <p className={styles.insightText}>{v.meaning}</p>
                  <p className={styles.insightText} style={{ marginTop: 6 }}>{v.summary}</p>
                  <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {v.houseNotes.map((h) => (
                      <div key={h.house}>H{h.house}: {h.occupants} — {h.note}</div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Desire · Fear · Prārabdha">
            <div className={styles.insightGrid}>
              <article className={cn(styles.insightCard, styles.insightHighlight)}>
                <h4 className={styles.insightTitle}>11th — desired karma</h4>
                <p className={styles.insightText}>{karma.desireFear.desire.text}</p>
                <p className={styles.insightText} style={{ marginTop: 6 }}>{karma.desireFear.desire.lordNote}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {karma.desireFear.desire.occupants.join(' · ') || 'Empty'}
                </p>
              </article>
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>8th — feared / hidden karma</h4>
                <p className={styles.insightText}>{karma.desireFear.fear.text}</p>
                <p className={styles.insightText} style={{ marginTop: 6 }}>{karma.desireFear.fear.lordNote}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {karma.desireFear.fear.occupants.join(' · ') || 'Empty'}
                </p>
              </article>
              <article className={cn(styles.insightCard, styles.insightInfo)}>
                <h4 className={styles.insightTitle}>6th — prārabdha (must endure)</h4>
                <p className={styles.insightText}>{karma.desireFear.prarabdha.text}</p>
                <p className={styles.insightText} style={{ marginTop: 6 }}>{karma.desireFear.prarabdha.lordNote}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {karma.desireFear.prarabdha.occupants.join(' · ') || 'Empty'}
                </p>
              </article>
            </div>
          </Section>

          <Section title="Recognition vs thankless work">
            <article className={cn(styles.insightCard, insightClass(karma.recognition.tone === 'supportive' ? 'strength' : karma.recognition.tone === 'challenging' ? 'caution' : 'info'))}>
              <h4 className={styles.insightTitle}>
                {karma.recognition.headline}
                <span className={cn(styles.pill, toneClass(karma.recognition.tone))} style={{ marginLeft: 8 }}>
                  {karma.recognition.score}%
                </span>
              </h4>
              <p className={styles.insightText}>{karma.recognition.text}</p>
            </article>
            <div className={styles.insightGrid} style={{ marginTop: '0.75rem' }}>
              {karma.recognition.factors.map((f) => (
                <article key={f.id} className={cn(styles.insightCard, f.ok ? styles.insightStrength : styles.insightCaution)}>
                  <h4 className={styles.insightTitle}>{f.label}</h4>
                  <p className={styles.insightText}>{f.detail}</p>
                </article>
              ))}
            </div>
            {karma.recognition.thanklessNotes.length > 0 && (
              <ul style={{ margin: '0.85rem 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {karma.recognition.thanklessNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Key takeaways">
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {karma.takeaways.map((t) => (
                <li key={t} style={{ marginBottom: 6 }}>{t}</li>
              ))}
            </ul>
          </Section>
        </>
      )}

      {tab === 'sectors' && (
        <>
          <Section title="Three-layer method">
            <p className={styles.heroSub} style={{ marginBottom: '0.5rem', maxWidth: 'none' }}>{sectors.method}</p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {sectors.houseFlavorNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Section>

          <Section title="Primary sector (D10 Lagna sign)">
            <article className={cn(styles.insightCard, styles.insightHighlight)}>
              <h4 className={styles.insightTitle}>
                {sectors.lagnaSector.name} · {sectors.lagnaSector.headline}
              </h4>
              <p className={styles.insightText}>{sectors.lagnaSector.flavor}</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {sectors.lagnaSector.industries.join(' · ')}
              </p>
              {sectors.lagnaSector.caution && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Caution: {sectors.lagnaSector.caution}
                </p>
              )}
            </article>
          </Section>

          <Section title="Active sign flavors in this chart">
            <div className={styles.insightGrid}>
              {sectors.hits.map((h) => (
                <article key={`${h.role}-${h.rashi}`} className={cn(styles.insightCard, styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {h.name}
                    <span style={{ fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>{h.role}</span>
                  </h4>
                  <p className={styles.insightText}>{h.sector.headline}</p>
                  <p className={styles.insightText} style={{ marginTop: 6 }}>{h.sector.flavor}</p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {h.sector.industries.slice(0, 4).join(' · ')}
                  </p>
                  {h.planetNames.length > 0 && (
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', fontWeight: 600 }}>
                      {h.planetNames.join(', ')}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </Section>

          <Section title="Career combinations">
            <div className={styles.insightGrid}>
              {sectors.combos.map((c) => (
                <article key={c.id} className={cn(styles.insightCard, c.matched ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {c.title}
                    {c.matched
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>Hit</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>Quiet</span>}
                  </h4>
                  <p className={styles.insightText}>{c.detail}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Energy & counseling notes">
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {sectors.energyNotes.map((n) => (
                <li key={n} style={{ marginBottom: 6 }}>{n}</li>
              ))}
            </ul>
          </Section>
        </>
      )}

      {tab === 'survival' && (
        <>
          <Section title="Survival-series D10">
            <p className={styles.heroSub} style={{ marginBottom: '0.65rem', maxWidth: 'none' }}>
              {survival.framing}
            </p>
            <p className={styles.insightText} style={{ marginBottom: 6 }}>{survival.threeLayer}</p>
            <p className={styles.insightText} style={{ color: 'var(--text-secondary)' }}>{survival.d10VsD9}</p>
          </Section>

          <Section title="Energy drain">
            <article className={cn(
              styles.insightCard,
              survival.energyDrain.risk === 'challenging' ? styles.insightCaution
                : survival.energyDrain.risk === 'mixed' ? styles.insightHighlight
                  : styles.insightStrength,
            )} style={{ marginBottom: '0.75rem' }}>
              <h4 className={styles.insightTitle}>{survival.energyDrain.headline}</h4>
              <p className={styles.insightText}>{survival.energyDrain.bulletRule}</p>
              <p className={styles.insightText} style={{ marginTop: 6 }}>{survival.energyDrain.recoveryNote}</p>
            </article>
            <div className={styles.insightGrid}>
              {survival.energyDrain.flags.map((f) => (
                <article
                  key={f.id}
                  className={cn(
                    styles.insightCard,
                    f.matched
                      ? (f.tone === 'challenging' ? styles.insightCaution : styles.insightHighlight)
                      : styles.insightInfo,
                  )}
                >
                  <h4 className={styles.insightTitle}>
                    {f.title}
                    {f.matched
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>Hit</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>Quiet</span>}
                  </h4>
                  <p className={styles.insightText}>{f.detail}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Can this client be helped?">
            <p className={styles.heroSub} style={{ marginBottom: '0.65rem', maxWidth: 'none' }}>{survival.helpability.text}</p>
            <div className={styles.insightGrid}>
              <article className={cn(styles.insightCard, styles.insightStrength)}>
                <h4 className={styles.insightTitle}>Good signs</h4>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {survival.helpability.good.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </article>
              <article className={cn(styles.insightCard, styles.insightCaution)}>
                <h4 className={styles.insightTitle}>Bad signs</h4>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {survival.helpability.bad.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </article>
            </div>
          </Section>

          <Section title="Sign distinctions (when relevant)">
            <div className={styles.insightGrid}>
              {survival.distinctions.map((d) => (
                <article key={d.id} className={cn(styles.insightCard, d.relevant ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {d.left.split('—')[0]?.trim()} vs {d.right.split('—')[0]?.trim()}
                    {d.relevant
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>Live</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>Ref</span>}
                  </h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {d.left} · {d.right}
                  </p>
                  <p className={styles.insightText}>{d.rule}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Survival career flags">
            <div className={styles.insightGrid}>
              {survival.extraCombos.map((c) => (
                <article key={c.id} className={cn(styles.insightCard, c.matched ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {c.title}
                    {c.matched
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>Hit</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>Quiet</span>}
                  </h4>
                  <p className={styles.insightText}>{c.detail}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Business partnership overlay (D10)">
            <p className={styles.heroSub} style={{ marginBottom: '0.65rem', maxWidth: 'none' }}>{survival.partnership.method}</p>
            <article className={cn(styles.insightCard, survival.partnership.hardHeaded ? styles.insightCaution : styles.insightInfo)} style={{ marginBottom: '0.75rem' }}>
              <h4 className={styles.insightTitle}>This chart’s partnership posture</h4>
              <p className={styles.insightText}>{survival.partnership.hardHeadedNote}</p>
            </article>
            <div className={styles.insightGrid}>
              {survival.partnership.rules.map((r) => (
                <article key={r.id} className={cn(styles.insightCard, r.tone === 'challenging' ? styles.insightCaution : r.tone === 'supportive' ? styles.insightStrength : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>{r.pair}</h4>
                  <p className={styles.insightText}>{r.effect}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Sun house roles · takeaways">
            <div className={styles.insightGrid} style={{ marginBottom: '0.75rem' }}>
              {survival.sunHouseGuide.map((s) => (
                <article key={s.house} className={cn(styles.insightCard, styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>Sun in H{s.house}</h4>
                  <p className={styles.insightText}>{s.role}</p>
                </article>
              ))}
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {survival.takeaways.map((t) => (
                <li key={t} style={{ marginBottom: 6 }}>{t}</li>
              ))}
            </ul>
          </Section>
        </>
      )}

      {tab === 'circuit' && (
        <>
          <Section title="Multi-varga circuit">
            <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
              {circuit.framing}
            </p>
            <ol style={{ margin: '0 0 0.85rem', paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {circuit.sequence.map((s) => (
                <li key={s} style={{ marginBottom: 4 }}>{s}</li>
              ))}
            </ol>
            <article className={cn(styles.insightCard, circuit.syncVerdict.synced ? styles.insightHighlight : styles.insightCaution)}>
              <h4 className={styles.insightTitle}>
                {circuit.syncVerdict.theme}
                {circuit.syncVerdict.synced
                  ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>Synced</span>
                  : <span className={styles.pill} style={{ marginLeft: 8 }}>Mixed</span>}
              </h4>
              <p className={styles.insightText}>{circuit.syncVerdict.detail}</p>
            </article>
          </Section>

          <Section title="Layer stack (current dasha)">
            <div className={styles.insightGrid}>
              {circuit.layers.map((layer) => (
                <article
                  key={layer.code}
                  className={cn(styles.insightCard, layer.available ? styles.insightInfo : styles.insightCaution)}
                >
                  <h4 className={styles.insightTitle}>
                    {layer.title}
                    {!layer.available && <span className={styles.pill} style={{ marginLeft: 8 }}>Missing</span>}
                  </h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {layer.represents}
                    {layer.lagnaName && ` · Lagna ${layer.lagnaName}`}
                    {layer.lagnaOccupants.length > 0 && ` · ${layer.lagnaOccupants.join(', ')}`}
                  </p>
                  {layer.dashaNotes.map((n, i) => (
                    <p key={`${layer.code}-${n.id}-${i}`} className={styles.insightText} style={{ marginTop: 6 }}>
                      <span className={cn(styles.pill, toneClass(n.tone) === styles.toneChallenging ? styles.pillWeak : undefined)} style={{ marginRight: 6 }}>
                        {n.title}
                      </span>
                      {n.text}
                    </p>
                  ))}
                  {layer.staticNotes.map((n, i) => (
                    <p key={`${layer.code}-static-${n.id}-${i}`} className={styles.insightText} style={{ marginTop: 6, color: 'var(--text-secondary)' }}>
                      {n.title}: {n.text}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          </Section>

          <Section title="Relationship & mind flags">
            {circuit.relationshipFlags.length === 0 && circuit.mindFears.length === 0 ? (
              <p className={styles.heroSub}>No strong relationship/mind flags from current circuit patterns.</p>
            ) : (
              <div className={styles.insightGrid}>
                {circuit.relationshipFlags.map((n) => (
                  <article key={n.id} className={cn(styles.insightCard, n.tone === 'challenging' ? styles.insightCaution : styles.insightInfo)}>
                    <h4 className={styles.insightTitle}>{n.title}</h4>
                    <p className={styles.insightText}>{n.text}</p>
                  </article>
                ))}
                {circuit.mindFears.map((n) => (
                  <article key={n.id} className={cn(styles.insightCard, styles.insightCaution)}>
                    <h4 className={styles.insightTitle}>{n.title}</h4>
                    <p className={styles.insightText}>{n.text}</p>
                  </article>
                ))}
              </div>
            )}
          </Section>

          <Section title="Job disruption flavors (D10 8th)">
            <article className={cn(styles.insightCard, circuit.jobDisruption.active ? styles.insightCaution : styles.insightInfo)} style={{ marginBottom: '0.75rem' }}>
              <h4 className={styles.insightTitle}>{circuit.jobDisruption.headline}</h4>
              <p className={styles.insightText}>{circuit.jobDisruption.caveat}</p>
            </article>
            <div className={styles.insightGrid}>
              {circuit.jobDisruption.flavors.map((f) => (
                <article key={f.id} className={cn(styles.insightCard, f.active ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {f.name}
                    {f.active
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>Active</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>Ref</span>}
                  </h4>
                  <p className={styles.insightText}>{f.nature}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Practice energy rules">
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {circuit.practiceAdvice.map((a) => (
                <li key={a} style={{ marginBottom: 6 }}>{a}</li>
              ))}
            </ul>
          </Section>
        </>
      )}

      {tab === 'karmaYoga' && (
        <>
          <Section title="Gītā · Karma Yoga on D10">
            <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
              {karmaYoga.framing}
            </p>
            <article className={cn(
              styles.insightCard,
              karmaYoga.sync.status === 'synced' || karmaYoga.sync.status === 'element-bridge'
                ? styles.insightStrength
                : karmaYoga.sync.status === 'soft-link'
                  ? styles.insightHighlight
                  : karmaYoga.sync.status === 'strain'
                    ? styles.insightCaution
                    : styles.insightCaution,
            )}>
              <h4 className={styles.insightTitle}>
                D1 ↔ D10 lagna sync
                <span
                  className={cn(
                    styles.pill,
                    karmaYoga.sync.status === 'synced' || karmaYoga.sync.status === 'element-bridge'
                      ? styles.pillVg
                      : undefined,
                  )}
                  style={{ marginLeft: 8 }}
                >
                  {karmaYoga.sync.statusLabel}
                </span>
              </h4>
              <p className={styles.insightText} style={{ fontWeight: 600, marginTop: 4 }}>
                {karmaYoga.sync.headline}
              </p>
              <p className={styles.insightText} style={{ marginTop: 6 }}>
                D1 {karmaYoga.sync.d1LagnaName} · D10 {karmaYoga.sync.d10LagnaName}
              </p>
              <p className={styles.insightText} style={{ marginTop: 8 }}>{karmaYoga.sync.text}</p>
              <p className={styles.insightText} style={{ marginTop: 10, color: 'var(--text-secondary)' }}>
                {karmaYoga.sync.d1Role}
              </p>
              <p className={styles.insightText} style={{ marginTop: 6, color: 'var(--text-secondary)' }}>
                {karmaYoga.sync.d10Role}
              </p>
              <p className={styles.insightText} style={{ marginTop: 10 }}>
                <strong style={{ fontWeight: 600 }}>How to bridge:</strong> {karmaYoga.sync.bridge}
              </p>
              <ul style={{ margin: '0.65rem 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                {karmaYoga.sync.recharge.map((r) => (
                  <li key={r} style={{ marginBottom: 4 }}>{r}</li>
                ))}
              </ul>
              <p className={styles.insightText} style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {karmaYoga.sync.counsel}
              </p>
            </article>
          </Section>

          <Section title="Dasha house events (D10)">
            {karmaYoga.dashaEvents.length === 0 ? (
              <p className={styles.heroSub}>No dasha overlay available for this chart.</p>
            ) : (
              <div className={styles.insightGrid}>
                {karmaYoga.dashaEvents.map((e) => (
                  <article key={`${e.levelLabel}-${e.lordName}`} className={cn(styles.insightCard, toneClass(e.tone) === styles.toneChallenging ? styles.insightCaution : styles.insightInfo)}>
                    <h4 className={styles.insightTitle}>
                      {e.levelLabel} · {e.lordName}
                      {e.d10House != null && (
                        <span className={styles.pill} style={{ marginLeft: 8 }}>H{e.d10House}</span>
                      )}
                    </h4>
                    <p className={styles.insightText}>{e.event}</p>
                    {e.pathHint && (
                      <p style={{ margin: '0.45rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {e.pathHint}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </Section>

          <Section title="Crisis mode · Jnana vs Bhakti">
            <article className={cn(styles.insightCard, karmaYoga.crisisMode.active ? styles.insightCaution : styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{karmaYoga.crisisMode.headline}</h4>
              <p className={styles.insightText}>{karmaYoga.crisisMode.acceptanceRule}</p>
              <p className={styles.insightText} style={{ marginTop: 8 }}><strong>Jnana:</strong> {karmaYoga.crisisMode.jnanaPath}</p>
              <p className={styles.insightText} style={{ marginTop: 6 }}><strong>Bhakti / Karma Yoga:</strong> {karmaYoga.crisisMode.bhaktiPath}</p>
            </article>
          </Section>

          <Section title="Pañca-mahābhūta triad remedies">
            <div className={styles.insightGrid}>
              {karmaYoga.triads.map((t) => (
                <article key={t.id} className={cn(styles.insightCard, t.active ? styles.insightHighlight : styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>
                    {t.houses} · {t.element}
                    {t.active
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>Active</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>Quiet</span>}
                  </h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {t.signs}
                  </p>
                  <p className={styles.insightText}>{t.remedy}</p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t.reason}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Planet corruption (D1 → D9 → D10)">
            {karmaYoga.corruption.length === 0 ? (
              <p className={styles.heroSub}>No classic strong-in-D1 / soft-in-D9 corruption pairs found.</p>
            ) : (
              <div className={styles.insightGrid}>
                {karmaYoga.corruption.map((c) => (
                  <article key={c.id} className={cn(styles.insightCard, styles.insightCaution)}>
                    <h4 className={styles.insightTitle}>{c.name}</h4>
                    <p className={styles.insightText}>
                      D1 {c.d1Dignity} → D9 {c.d9Dignity}
                    </p>
                    <p className={styles.insightText} style={{ marginTop: 6 }}>{c.d10Note}</p>
                  </article>
                ))}
              </div>
            )}
          </Section>

          <Section title="Oil field · multi-chart · ethics">
            <article className={cn(styles.insightCard, styles.insightInfo)} style={{ marginBottom: '0.75rem' }}>
              <h4 className={styles.insightTitle}>Energy drain / recharge</h4>
              <p className={styles.insightText}>{karmaYoga.oilField}</p>
            </article>
            <ul style={{ margin: '0 0 0.85rem', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {karmaYoga.multiChart.map((n) => (
                <li key={n} style={{ marginBottom: 6 }}>{n}</li>
              ))}
            </ul>
            <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {karmaYoga.ethics.map((e) => (
                <li key={e} style={{ marginBottom: 6 }}>{e}</li>
              ))}
            </ol>
          </Section>
        </>
      )}

      {tab === 'pending' && (
        <>
          <Section title="2–6–10 pending karma axis">
            <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
              {pending.axisRule}
            </p>
            {pending.items.length === 0 ? (
              <p className={styles.heroSub}>No classical planets currently sit in D10 2nd, 6th, or 10th.</p>
            ) : (
              <div className={styles.insightGrid}>
                {pending.items.map((item) => (
                  <article key={`${item.planetId}-${item.house}`} className={cn(styles.insightCard, styles.insightCaution)}>
                    <h4 className={styles.insightTitle}>
                      {item.planetName} · H{item.house} ({item.rashiName})
                    </h4>
                    <p className={styles.insightText}>{item.pendingTheme}</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Dana: {item.charity}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </Section>

          <Section title="Capricorn / 10–11 grind">
            <article className={cn(styles.insightCard, pending.capricornHardWork.active ? styles.insightCaution : styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{pending.capricornHardWork.headline}</h4>
              <p className={styles.insightText}>{pending.capricornHardWork.text}</p>
              {pending.capricornHardWork.notes.length > 0 && (
                <ul style={{ margin: '0.6rem 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {pending.capricornHardWork.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
            </article>
          </Section>

          <Section title="Live clinical flags">
            <div className={styles.insightGrid}>
              {pending.flags.map((f) => (
                <article
                  key={f.id}
                  className={cn(
                    styles.insightCard,
                    f.matched
                      ? (f.severity === 'challenging' ? styles.insightCaution : styles.insightHighlight)
                      : styles.insightInfo,
                  )}
                >
                  <h4 className={styles.insightTitle}>
                    {f.title}
                    {f.matched
                      ? <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>Hit</span>
                      : <span className={styles.pill} style={{ marginLeft: 8 }}>Quiet</span>}
                  </h4>
                  <p className={styles.insightText}>{f.detail}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Remedies compendium">
            <div className={styles.insightGrid}>
              {pending.remedies.map((r) => (
                <article key={r.id} className={cn(styles.insightCard, styles.insightInfo)}>
                  <h4 className={styles.insightTitle}>{r.title}</h4>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    When: {r.when}
                  </p>
                  <p className={styles.insightText}>{r.action}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section title="Reading methodology">
            <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
              {pending.methodSteps.map((s) => (
                <li key={s} style={{ marginBottom: 6 }}>{s}</li>
              ))}
            </ol>
          </Section>
        </>
      )}
    </div>
  )
}
