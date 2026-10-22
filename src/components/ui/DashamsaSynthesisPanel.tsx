// ─────────────────────────────────────────────────────────────
//  src/components/ui/DashamsaSynthesisPanel.tsx
//  D10 Synthesis — A10, profession, track, foreign, timing, brief
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useCallback, useState } from 'react'
import type { CareerTone } from '@/lib/engine/dashamsaAnalysis'
import type { DashamsaSynthesis } from '@/lib/engine/dashamsaSynthesis'
import { cn } from '@/lib/ui/cn'
import styles from './DashamsaWorkspace.module.css'

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

function toneClass(tone: CareerTone): string {
  if (tone === 'supportive') return styles.insightStrength
  if (tone === 'challenging') return styles.insightCaution
  if (tone === 'mixed') return styles.insightHighlight
  return styles.insightInfo
}

function confidenceClass(c: DashamsaSynthesis['profession']['confidence']): string {
  if (c === 'high') return styles.insightStrength
  if (c === 'split') return styles.insightCaution
  return styles.insightHighlight
}

export function DashamsaSynthesisPanel({ synthesis }: { synthesis: DashamsaSynthesis }) {
  const [copied, setCopied] = useState(false)
  const { profession, a10, track, foreign, boss, vimsopaka, annual, transit, windows, brief } = synthesis

  const copyBrief = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(brief.markdown)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [brief.markdown])

  const downloadBrief = useCallback(() => {
    const blob = new Blob([brief.markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${brief.title.replace(/[^\w\-]+/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [brief])

  return (
    <>
      <Section title="Career synthesis">
        <p className={styles.heroSub} style={{ marginBottom: '0.65rem', maxWidth: 'none' }}>
          {synthesis.framing}
        </p>
        <article className={cn(styles.insightCard, styles.insightHighlight)}>
          <h4 className={styles.insightTitle}>Headline</h4>
          <p className={styles.insightText}>{synthesis.headline}</p>
        </article>
      </Section>

      <Section title="Profession card">
        <article className={cn(styles.insightCard, confidenceClass(profession.confidence))} style={{ marginBottom: '0.65rem' }}>
          <h4 className={styles.insightTitle}>
            {profession.headline}
            <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>
              {profession.confidence}
            </span>
          </h4>
          <p className={styles.insightText} style={{ fontWeight: 650 }}>{profession.doThis}</p>
          <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>{profession.agreement}</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {profession.nakshatraSummary}
          </p>
        </article>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Field</th>
                <th>Sources agreeing</th>
              </tr>
            </thead>
            <tbody>
              {profession.fields.slice(0, 10).map((f) => (
                <tr key={f.field}>
                  <td className={styles.planetCell}>{f.field}</td>
                  <td>
                    {[...new Set(f.sources)].map((s) => (
                      <span key={s} className={styles.pill} style={{ marginRight: 4 }}>{s}</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {profession.digpalaFields.length > 0 && (
          <p style={{ margin: '0.55rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Digpala fields: {profession.digpalaFields.join(' · ')}
          </p>
        )}
      </Section>

      <Section title="A10 · Rajya Pada">
        <article className={cn(styles.insightCard, styles.insightHighlight)}>
          <h4 className={styles.insightTitle}>{a10.headline}</h4>
          <p className={styles.insightText}>{a10.prediction}</p>
          {a10.bphsNote && (
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a10.bphsNote}</p>
          )}
          <p style={{ margin: '0.45rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{a10.source}</p>
        </article>
      </Section>

      <Section title="Job vs business · Foreign · Boss">
        <div className={styles.insightGrid}>
          <article className={cn(styles.insightCard, track.id === 'hybrid' ? styles.insightHighlight : styles.insightStrength)}>
            <h4 className={styles.insightTitle}>
              Track · {track.id}
            </h4>
            <p className={styles.insightText}>{track.headline}</p>
            <p className={styles.insightText} style={{ marginTop: '0.4rem' }}>{track.prediction}</p>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {track.factors.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </article>
          <article className={cn(styles.insightCard, foreign.active ? styles.insightHighlight : styles.insightInfo)}>
            <h4 className={styles.insightTitle}>
              {foreign.headline}
              <span className={styles.pill} style={{ marginLeft: 8 }}>{foreign.score}</span>
            </h4>
            <p className={styles.insightText}>{foreign.prediction}</p>
            {foreign.directionAdvice && (
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{foreign.directionAdvice}</p>
            )}
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {foreign.factors.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </article>
          <article className={cn(styles.insightCard, styles.insightInfo)}>
            <h4 className={styles.insightTitle}>Boss / patron · {boss.lordName}</h4>
            <p className={styles.insightText}>{boss.prediction}</p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{boss.source}</p>
          </article>
        </div>
      </Section>

      <Section title="Strength · Year · Gochara">
        <div className={styles.insightGrid}>
          <article className={cn(styles.insightCard, vimsopaka.available ? styles.insightStrength : styles.insightInfo)}>
            <h4 className={styles.insightTitle}>{vimsopaka.headline}</h4>
            <p className={styles.insightText}>{vimsopaka.prediction}</p>
            {(vimsopaka.tenthLord || vimsopaka.lagnaLord) && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {vimsopaka.tenthLord && (
                  <span className={cn(styles.pill, styles.pillPk)}>
                    10L {vimsopaka.tenthLord.name} D10 {vimsopaka.tenthLord.d10Points}
                  </span>
                )}
                {vimsopaka.lagnaLord && (
                  <span className={cn(styles.pill, styles.pillVg)}>
                    AL {vimsopaka.lagnaLord.name} D10 {vimsopaka.lagnaLord.d10Points}
                  </span>
                )}
              </div>
            )}
          </article>
          <article className={cn(styles.insightCard, styles.insightHighlight)}>
            <h4 className={styles.insightTitle}>{annual.headline}</h4>
            <p className={styles.insightText}>{annual.prediction}</p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {annual.source}
              {annual.openSolarReturn ? ' · Open Solar Return for full Varshaphal D10.' : ''}
            </p>
          </article>
          <article className={cn(styles.insightCard, transit.available ? styles.insightHighlight : styles.insightInfo)}>
            <h4 className={styles.insightTitle}>{transit.headline}</h4>
            <p className={styles.insightText}>{transit.prediction}</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>As of {transit.asOf}</p>
          </article>
        </div>
        {transit.hits.length > 0 && (
          <div className={styles.insightGrid} style={{ marginTop: '0.65rem' }}>
            {transit.hits.slice(0, 8).map((h) => (
              <article key={h.id} className={cn(styles.insightCard, toneClass(h.tone))}>
                <h4 className={styles.insightTitle}>
                  {h.name} · D10 H{h.house}
                  {h.isRetro && <span className={styles.pill} style={{ marginLeft: 8 }}>R</span>}
                </h4>
                <p className={styles.insightText}>{h.signName} — {h.note}</p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section title="Dasha windows">
        {windows.length === 0 ? (
          <p className={styles.heroSub}>No Vimshottari path on this chart.</p>
        ) : (
          <div className={styles.insightGrid}>
            {windows.map((w) => (
              <article key={w.id} className={cn(styles.insightCard, w.live ? styles.insightHighlight : styles.insightInfo)}>
                <h4 className={styles.insightTitle}>
                  {w.title}
                  {w.live && <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>Live</span>}
                </h4>
                <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {w.start} → {w.end}
                </p>
                <p className={styles.insightText}>{w.careerNote}</p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section title="Career brief">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button type="button" className={styles.tabBtn} onClick={copyBrief}>
            {copied ? 'Copied' : 'Copy Markdown brief'}
          </button>
          <button type="button" className={styles.tabBtn} onClick={downloadBrief}>
            Download .md
          </button>
        </div>
        <div className={styles.insightGrid}>
          {brief.sections.map((s) => (
            <article key={s.heading} className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{s.heading}</h4>
              <p className={styles.insightText} style={{ whiteSpace: 'pre-wrap' }}>{s.body}</p>
            </article>
          ))}
        </div>
        <p style={{ margin: '0.65rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Paste into notes or a client PDF. Full chart PDF export remains on the toolbar (Gold+).
        </p>
      </Section>
    </>
  )
}
