// ─────────────────────────────────────────────────────────────
//  src/components/ui/NavamshaPredictionsPanel.tsx
//  D9 advanced predictions — planet-in-navamsha readings, rules,
//  atmakaraka, sign cards and age markers.
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  analyzeNavamshaPredictions,
  type NavamshaRuleHit,
} from '@/lib/engine/navamshaPredictions'
import type { DashaTone } from '@/lib/engine/navamshaAnalysis'
import { GRAHA_NAMES } from '@/types/astrology'
import type { ChartOutput } from '@/types/astrology'
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

export function NavamshaPredictionsPanel({ chart }: { chart: ChartOutput }) {
  const report = useMemo(() => analyzeNavamshaPredictions(chart), [chart])
  const [view, setView] = useState<View>('planets')

  if (!report) return <p className={styles.emptyHint}>Navamsha predictions need D9 data — recalculate the chart.</p>

  const ak = report.atmakaraka

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>Navamsha Predictions</h3>
        <div className={styles.sectionRule} />
      </div>
      <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>{report.headline}</p>

      {ak && (
        <article className={cn(styles.insightCard, styles.insightHighlight)} style={{ marginBottom: '0.85rem' }}>
          <h4 className={styles.insightTitle}>
            Atmakaraka {ak.name} in {ak.d9RashiName} navamsha
          </h4>
          <p className={styles.insightText}>{ak.theme}</p>
          {ak.present && <p className={styles.insightText} style={{ marginTop: '0.35rem' }}>✓ {ak.present.text}</p>}
          {ak.missing && <p className={styles.insightText} style={{ marginTop: '0.35rem' }}>✗ {ak.missing.text}</p>}
        </article>
      )}

      {report.activeNow.length > 0 && (
        <div className={styles.badgeRow} style={{ marginBottom: '0.85rem' }}>
          {report.activeNow.map((p) => (
            <span key={p.id} className={cn(styles.badge, styles.badgeTeal)}>
              Active now: {p.name} ({p.dashaLevels.join(' / ')}) · {p.navamshaTitle}
            </span>
          ))}
        </div>
      )}

      <div className={styles.variantToolbar} role="tablist" aria-label="Prediction views">
        {([
          ['planets', 'Planet readings'],
          ['rules', `Rules triggered (${report.rules.length})`],
          ['signs', 'Sign map'],
        ] as [View, string][]).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className={cn(styles.tabBtn, view === id && styles.tabBtnActive)}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'planets' && (
        <div className={styles.cardGrid}>
          {report.planets.map((p) => (
            <article key={p.id} className={cn(styles.planetCard, toneInsight(p.tone))}>
              <div className={styles.planetCardHead}>
                <h4 className={styles.planetName}>{p.name}</h4>
                <span>
                  {p.isAtmakaraka && <span className={cn(styles.pill, styles.pillPk)}>AK</span>}
                  {p.isVargottama && <span className={cn(styles.pill, styles.pillVg)}>Vargottama</span>}
                  {p.dashaLevels.length > 0 && <span className={cn(styles.pill, styles.pillStrong)}>{p.dashaLevels[0]}</span>}
                  <span className={cn(styles.pill, tonePill(p.tone))}>{p.tone}</span>
                </span>
              </div>
              <div className={styles.mappingLine}>
                D1 {p.d1RashiName} (H{p.d1House}) → D9 {p.d9RashiName} (H{p.d9House}) · {p.navamshaTitle}
                {p.lordOf.length > 0 && ` · rules D1 H${p.lordOf.join(', H')}`}
              </div>
              <p className={styles.planetBody}>{p.signReading}</p>
              <p className={styles.planetBody}>{p.sourceReading}</p>
              <p className={styles.planetBody}>{p.houseReading}</p>
              {p.houseSpecial && <p className={styles.planetBody}>{p.houseSpecial}</p>}
              <p className={styles.planetBody}>
                <strong>{p.dashaLevels.length > 0 ? 'Running now: ' : 'Its dasha: '}</strong>
                {p.dashaReading}
              </p>
              <p className={styles.planetBody} style={{ color: 'var(--text-muted)' }}>Remedy: {p.remedy}</p>
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
                <h4 className={styles.insightTitle}>
                  {RULE_LABEL[r.category]} · {r.title}
                </h4>
                <p className={styles.insightText}>{r.text}</p>
              </article>
            ))}
          </div>
          {report.ageMarkers.length > 0 && (
            <>
              <div className={styles.sectionHead} style={{ marginTop: '1rem' }}>
                <h3 className={styles.sectionTitle}>Age markers</h3>
                <div className={styles.sectionRule} />
              </div>
              <ul className={styles.noteList}>
                {report.ageMarkers.map((m, i) => (
                  <li key={`${m.age}-${m.sign}-${i}`} className={styles.noteItem}>
                    <strong>Age {m.age}</strong> · {m.planets.map((id) => GRAHA_NAMES[id]).join(', ')} in {m.signName} — {m.note}
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
                  H{c.house} · {c.signName} — {c.title}
                </h4>
                <span>
                  {c.occupants.map((id) => (
                    <span key={id} className={cn(styles.pill, styles.pillStrong)}>{GRAHA_NAMES[id]}</span>
                  ))}
                </span>
              </div>
              <div className={styles.mappingLine}>{c.keywords.join(' · ')} · house of {c.houseTheme}</div>
              <p className={styles.planetBody}>{c.essence}</p>
              {c.houseSpecial && <p className={styles.planetBody}>{c.houseSpecial}</p>}
              {!c.empty && <p className={styles.planetBody}>Shadow: {c.shadow}</p>}
              <p className={styles.planetBody} style={{ color: 'var(--text-muted)' }}>{c.guidance}</p>
            </article>
          ))}
        </div>
      )}

      <p className={styles.emptyHint} style={{ marginTop: '0.85rem' }}>
        Navamsha is the fruit of the D1 tree — read these alongside the D1 promise. Interpretive guidance, not certainty.
      </p>
    </section>
  )
}
