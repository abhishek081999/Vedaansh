// ─────────────────────────────────────────────────────────────
//  src/components/ui/NavamshaPredictionsPanel.tsx
//  D9 advanced predictions — planet-in-navamsha readings, rules,
//  atmakaraka, sign cards and age markers.
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import { CircleCheck, CircleX, Crown, Info, Leaf, ScrollText } from 'lucide-react'
import {
  analyzeNavamshaPredictions,
  type NavamshaRuleHit,
} from '@/lib/engine/navamshaPredictions'
import type { DashaTone } from '@/lib/engine/navamshaAnalysis'
import { GRAHA_DISPLAY_COLOR } from '@/lib/engine/grahaDisplayColors'
import { GRAHA_NAMES } from '@/types/astrology'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import styles from './NavamshaWorkspace.module.css'

type View = 'planets' | 'rules' | 'signs'

function toneInsight(tone: DashaTone): string {
  if (tone === 'supportive') return styles.insightStrength
  if (tone === 'challenging') return styles.insightCaution
  if (tone === 'mixed') return styles.insightHighlight
  return styles.insightInfo
}

function tonePill(tone: DashaTone): string {
  if (tone === 'supportive') return styles.toneSupportive
  if (tone === 'challenging') return styles.toneChallenging
  if (tone === 'mixed') return styles.toneMixed
  return styles.toneNeutral
}

const RULE_LABEL: Record<NavamshaRuleHit['category'], string> = {
  lagna: 'D9 Lagna',
  combination: 'Combination',
  lordship: 'Lordship',
  health: 'Health',
  dignity: 'Dignity',
  karaka: 'Karaka',
  house: 'House',
  guidance: 'Guidance',
  departure: 'Departure',
  timing: 'Pattern',
}

const ELEMENTS: { key: 'fire' | 'earth' | 'air' | 'water'; label: string; cls: string }[] = [
  { key: 'fire', label: 'Fire', cls: styles.accentRose },
  { key: 'earth', label: 'Earth', cls: styles.accentGold },
  { key: 'air', label: 'Air', cls: styles.accentTeal },
  { key: 'water', label: 'Water', cls: styles.accentBlue },
]

function Dot({ id }: { id: GrahaId }) {
  return (
    <span
      className={styles.planetDot}
      style={{ ['--planet' as string]: GRAHA_DISPLAY_COLOR[id] ?? 'var(--gold)' }}
      aria-hidden
    />
  )
}

export function NavamshaPredictionsPanel({ chart }: { chart: ChartOutput }) {
  const report = useMemo(() => analyzeNavamshaPredictions(chart), [chart])
  const [view, setView] = useState<View>('planets')

  if (!report) return <p className={styles.emptyHint}>Navamsha predictions need D9 data — recalculate the chart.</p>

  const ak = report.atmakaraka
  const elementTotal = ELEMENTS.reduce((s, e) => s + report.elementBalance[e.key].length, 0) || 1

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionIcon} aria-hidden>
          <ScrollText size={16} />
        </span>
        <div className={styles.sectionHeadText}>
          <h3 className={styles.sectionTitle}>Navamsha Predictions</h3>
          <p className={styles.sectionHint}>Planet-by-planet readings and triggered rules</p>
        </div>
        <div className={styles.sectionRule} />
      </div>
      <p className={styles.lede}>{report.headline}</p>

      <div className={styles.insightGrid} style={{ marginBottom: '0.9rem' }}>
        {ak && (
          <article className={cn(styles.insightCard, styles.insightHighlight)}>
            <span className={styles.insightIcon} aria-hidden><Crown size={14} /></span>
            <div className={styles.insightBody}>
              <span className={styles.insightKicker}>Atmakaraka</span>
              <h4 className={styles.insightTitle}>{ak.name} in {ak.d9RashiName} navamsha</h4>
              <p className={styles.insightText}>{ak.theme}</p>
              {ak.present && (
                <p className={styles.insightText} style={{ display: 'flex', gap: '0.35rem' }}>
                  <CircleCheck size={14} style={{ flex: '0 0 auto', marginTop: 3, color: 'var(--teal)' }} aria-hidden />
                  {ak.present.text}
                </p>
              )}
              {ak.missing && (
                <p className={styles.insightText} style={{ display: 'flex', gap: '0.35rem' }}>
                  <CircleX size={14} style={{ flex: '0 0 auto', marginTop: 3, color: 'var(--rose)' }} aria-hidden />
                  {ak.missing.text}
                </p>
              )}
            </div>
          </article>
        )}
        <article className={cn(styles.insightCard, styles.insightInfo)}>
          <span className={styles.insightIcon} aria-hidden><Leaf size={14} /></span>
          <div className={styles.insightBody}>
            <span className={styles.insightKicker}>Element balance in D9</span>
            <div className={styles.distBar} role="img" aria-label="Planets by element in Navamsha">
              {ELEMENTS.filter((e) => report.elementBalance[e.key].length > 0).map((e) => (
                <span
                  key={e.key}
                  className={cn(styles.distSeg, e.cls)}
                  style={{ width: `${(report.elementBalance[e.key].length / elementTotal) * 100}%` }}
                  title={`${e.label}: ${report.elementBalance[e.key].map((id) => GRAHA_NAMES[id]).join(', ')}`}
                />
              ))}
            </div>
            <div className={styles.distLegend} style={{ marginBottom: 0 }}>
              {ELEMENTS.map((e) => (
                <span key={e.key} className={cn(styles.distKey, e.cls)}>
                  <span className={styles.distSwatch} aria-hidden />
                  {e.label} <strong>{report.elementBalance[e.key].length}</strong>
                </span>
              ))}
            </div>
          </div>
        </article>
      </div>

      {report.activeNow.length > 0 && (
        <div className={styles.badgeRow} style={{ margin: '0 0 0.9rem' }}>
          {report.activeNow.map((p) => (
            <span key={p.id} className={cn(styles.badge, styles.badgeTeal)}>
              <Dot id={p.id} />
              Active now: {p.name} ({p.dashaLevels.join(' / ')}) · {p.navamshaTitle}
            </span>
          ))}
        </div>
      )}

      <div className={styles.segmented} role="tablist" aria-label="Prediction views">
        {([
          ['planets', 'Planet readings', report.planets.length],
          ['rules', 'Rules triggered', report.rules.length],
          ['signs', 'Sign map', null],
        ] as [View, string, number | null][]).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className={cn(styles.segBtn, view === id && styles.segBtnActive)}
            onClick={() => setView(id)}
          >
            {label}
            {count !== null && <span className={styles.segCount}>{count}</span>}
          </button>
        ))}
      </div>

      {view === 'planets' && (
        <div className={styles.cardGrid}>
          {report.planets.map((p) => (
            <article key={p.id} className={cn(styles.planetCard, toneInsight(p.tone))}>
              <div className={styles.planetCardHead}>
                <h4 className={styles.planetName}>
                  <Dot id={p.id} />
                  {p.name}
                </h4>
                <span className={styles.pillRow}>
                  {p.isAtmakaraka && <span className={cn(styles.pill, styles.pillPk)}>AK</span>}
                  {p.isVargottama && <span className={cn(styles.pill, styles.pillVg)}>VG</span>}
                  {p.dashaLevels.length > 0 && <span className={cn(styles.pill, styles.pillStrong)}>{p.dashaLevels[0]}</span>}
                  <span className={cn(styles.pill, tonePill(p.tone))}>{p.tone}</span>
                </span>
              </div>
              <div className={styles.mappingLine}>
                {p.navamshaTitle}
                <span className={styles.cellSub}>
                  D1 {p.d1RashiName} (H{p.d1House}) → D9 {p.d9RashiName} (H{p.d9House})
                  {p.lordOf.length > 0 && ` · rules D1 H${p.lordOf.join(', H')}`}
                </span>
              </div>
              <dl className={styles.readList}>
                <div className={styles.readRow}>
                  <dt className={styles.readLabel}>In this navamsha</dt>
                  <dd>{p.signReading}</dd>
                </div>
                <div className={styles.readRow}>
                  <dt className={styles.readLabel}>From {p.d1RashiName}</dt>
                  <dd>{p.sourceReading}</dd>
                </div>
                <div className={styles.readRow}>
                  <dt className={styles.readLabel}>D9 house {p.d9House}</dt>
                  <dd>
                    {p.houseReading}
                    {p.houseSpecial && <> {p.houseSpecial}</>}
                  </dd>
                </div>
                <div className={styles.readRow}>
                  <dt className={styles.readLabel}>{p.dashaLevels.length > 0 ? 'Running now' : 'Its dasha'}</dt>
                  <dd>{p.dashaReading}</dd>
                </div>
              </dl>
              <p className={styles.remedy}><strong>Remedy · </strong>{p.remedy}</p>
            </article>
          ))}
        </div>
      )}

      {view === 'rules' && (
        <>
          {report.rules.length === 0 && <p className={styles.emptyHint}>No special navamsha rules triggered for this chart.</p>}
          <div className={styles.insightGrid}>
            {report.rules.map((r) => (
              <article key={r.id} className={cn(styles.insightCard, toneInsight(r.tone))}>
                <span className={styles.insightIcon} aria-hidden><ScrollText size={14} /></span>
                <div className={styles.insightBody}>
                  <span className={styles.insightKicker}>{RULE_LABEL[r.category]}</span>
                  <h4 className={styles.insightTitle}>{r.title}</h4>
                  <p className={styles.insightText}>{r.text}</p>
                </div>
              </article>
            ))}
          </div>
          {report.ageMarkers.length > 0 && (
            <>
              <h4 className={styles.subHead}>Age markers</h4>
              <ul className={styles.ageList}>
                {report.ageMarkers.map((m, i) => (
                  <li key={`${m.age}-${m.sign}-${i}`} className={styles.ageItem}>
                    <span className={styles.ageBadge} title={`Age ${m.age}`}>{m.age}</span>
                    <span>
                      <strong>{m.planets.map((id) => GRAHA_NAMES[id]).join(', ')} in {m.signName}</strong>
                      <span style={{ display: 'block' }}>{m.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {view === 'signs' && (
        <div className={styles.cardGrid}>
          {report.signCards.map((c) => (
            <article key={c.house} className={cn(styles.planetCard, c.empty ? undefined : styles.insightHighlight)}>
              <div className={styles.planetCardHead}>
                <h4 className={styles.planetName}>
                  <span className={styles.houseBadge}>{c.house}</span>
                  {c.signName}
                </h4>
                <span className={styles.pillRow}>
                  {c.occupants.map((id) => (
                    <span key={id} className={styles.chip}>
                      <Dot id={id} />
                      {GRAHA_NAMES[id]}
                    </span>
                  ))}
                </span>
              </div>
              <div className={styles.mappingLine}>
                {c.title}
                <span className={styles.cellSub}>{c.keywords.join(' · ')} · house of {c.houseTheme}</span>
              </div>
              <p className={styles.planetBody}>{c.essence}</p>
              {c.houseSpecial && <p className={styles.planetBody}>{c.houseSpecial}</p>}
              {!c.empty && (
                <p className={styles.planetBody}>
                  <strong style={{ color: 'var(--rose)' }}>Shadow · </strong>{c.shadow}
                </p>
              )}
              <p className={styles.remedy}><strong>Guidance · </strong>{c.guidance}</p>
            </article>
          ))}
        </div>
      )}

      <p className={styles.footnote}>
        <Info size={13} aria-hidden style={{ flex: '0 0 auto', marginTop: 2 }} />
        Navamsha is the fruit of the D1 tree — read these alongside the D1 promise. Interpretive guidance, not certainty.
      </p>
    </section>
  )
}
