// ─────────────────────────────────────────────────────────────
//  src/components/ui/DashamsaClassicalPanel.tsx
//  BPHS / Phaladeepika / Jaimini reading of the open D10 chart
// ─────────────────────────────────────────────────────────────
'use client'

import React from 'react'
import type { CareerTone } from '@/lib/engine/dashamsaAnalysis'
import type { DashamsaClassical } from '@/lib/engine/dashamsaClassical'
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

export function DashamsaClassicalPanel({ classical }: { classical: DashamsaClassical }) {
  const formed = classical.yogas.filter((y) => y.formed)
  const quiet = classical.yogas.filter((y) => !y.formed)
  const { mahatphala, livelihood, mahatEmphasis } = classical

  return (
    <>
      <Section title="Classical predictions">
        <p className={styles.heroSub} style={{ marginBottom: '0.85rem', maxWidth: 'none' }}>
          {classical.framing}
        </p>
        <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.84rem', lineHeight: 1.55 }}>
          {classical.predictions.map((line) => (
            <li key={line} style={{ marginBottom: 8 }}>{line}</li>
          ))}
        </ol>
      </Section>

      <Section title="Mahatphala grade">
        <article className={cn(styles.insightCard, styles.insightHighlight)}>
          <h4 className={styles.insightTitle}>
            {mahatphala.gradeLabel}
            <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>{mahatphala.score}</span>
          </h4>
          <p className={styles.insightText}>{mahatphala.headline}</p>
          <div
            style={{
              margin: '0.65rem 0',
              height: 6,
              borderRadius: 99,
              background: 'var(--surface-1, var(--surface-2))',
              border: '1px solid var(--border-soft)',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: `${mahatphala.score}%`, height: '100%', background: 'var(--gold)' }} />
          </div>
          <p className={styles.insightText} style={{ color: 'var(--text-muted)' }}>{mahatphala.text}</p>
        </article>
        <div className={styles.insightGrid} style={{ marginTop: '0.65rem' }}>
          {mahatphala.factors.map((f) => (
            <article key={f.label} className={cn(styles.insightCard, f.points > 0 ? styles.insightStrength : f.points < 0 ? styles.insightCaution : styles.insightInfo)}>
              <h4 className={styles.insightTitle}>
                {f.label}
                <span className={styles.pill} style={{ marginLeft: 8 }}>{f.points > 0 ? `+${f.points}` : f.points}</span>
              </h4>
              <p className={styles.insightText}>{f.note}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Livelihood planet">
        <article className={cn(styles.insightCard, mahatEmphasis.agrees ? styles.insightStrength : styles.insightHighlight)} style={{ marginBottom: '0.65rem' }}>
          <h4 className={styles.insightTitle}>
            {mahatEmphasis.agrees ? 'D1 and D10 agree' : 'D1 type · D10 status'}
          </h4>
          <p className={styles.insightText}>{mahatEmphasis.agreement}</p>
        </article>
        <p className={styles.heroSub} style={{ marginBottom: '0.75rem', maxWidth: 'none' }}>
          {livelihood.method}
        </p>
        <div className={styles.insightGrid} style={{ marginBottom: '0.75rem' }}>
          {classical.pointers.map((p) => (
            <article key={p.id} className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>{p.label}</h4>
              <p className={styles.insightText}>{p.detail}</p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{p.source}</p>
            </article>
          ))}
        </div>
        <p className={styles.insightText} style={{ marginBottom: '0.75rem' }}>{livelihood.prediction}</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Planet</th>
                <th>Score</th>
                <th>Why this score</th>
                <th>Fields</th>
              </tr>
            </thead>
            <tbody>
              {livelihood.candidates.slice(0, 6).map((c) => (
                <tr key={c.id}>
                  <td className={styles.planetCell}>
                    {c.name}
                    {c.id === livelihood.winner.id && (
                      <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 6 }}>Lead</span>
                    )}
                  </td>
                  <td>{c.score}</td>
                  <td>{c.why}</td>
                  <td>{c.fields.slice(0, 2).join(' · ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ margin: '0.55rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Dashamsha 10th complex leads with {mahatEmphasis.winner.name} ({mahatEmphasis.winner.score}) — {mahatEmphasis.winner.why}.
        </p>
      </Section>

      <Section title="10th lord and the 10th sign">
        <div className={styles.insightGrid}>
          <article className={cn(styles.insightCard, styles.insightHighlight)}>
            <h4 className={styles.insightTitle}>{classical.tenthLord.headline}</h4>
            <p className={styles.insightText}>{classical.tenthLord.prediction}</p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{classical.tenthLord.source}</p>
          </article>
          <article className={cn(styles.insightCard, styles.insightInfo)}>
            <h4 className={styles.insightTitle}>
              {classical.tenthSign.signName} · {classical.tenthSign.modalityLabel}
            </h4>
            <p className={styles.insightText}>{classical.tenthSign.prediction}</p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{classical.tenthSign.d1Note}</p>
          </article>
          {classical.tenthOccupants.map((o) => (
            <article key={o.id} className={cn(styles.insightCard, styles.insightStrength)}>
              <h4 className={styles.insightTitle}>{o.name} in the D10 10th</h4>
              <p className={styles.insightText}>{o.prediction}</p>
            </article>
          ))}
          {classical.luminaries.map((l) => (
            <article key={l.from} className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>10th from {l.from}</h4>
              <p className={styles.insightText}>{l.prediction}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Yogas that are formed">
        {formed.length === 0 ? (
          <p className={styles.heroSub}>No listed career yoga is formed. Use the 10th lord’s house as the reading.</p>
        ) : (
          <div className={styles.insightGrid}>
            {formed.map((y) => (
              <article key={y.id} className={cn(styles.insightCard, toneClass(y.tone))}>
                <h4 className={styles.insightTitle}>
                  {y.name}
                  <span className={cn(styles.pill, styles.pillVg)} style={{ marginLeft: 8 }}>Formed</span>
                </h4>
                <p className={styles.insightText}>{y.prediction}</p>
                <p style={{ margin: '0.45rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{y.source}</p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section title="Checked and not formed">
        <ul style={{ margin: 0, paddingLeft: '1.15rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>
          {quiet.map((y) => (
            <li key={y.id} style={{ marginBottom: 6 }}>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 650 }}>{y.name}.</strong> {y.prediction}
            </li>
          ))}
        </ul>
      </Section>

      {classical.amatyakaraka && (
        <Section title="Amatyakaraka">
          <article className={cn(styles.insightCard, styles.insightHighlight)}>
            <h4 className={styles.insightTitle}>{classical.amatyakaraka.headline}</h4>
            <p className={styles.insightText}>{classical.amatyakaraka.prediction}</p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{classical.amatyakaraka.source}</p>
          </article>
        </Section>
      )}

      <Section title="When it shows">
        <div className={styles.insightGrid}>
          {classical.timing.map((t) => (
            <article key={t.id} className={cn(styles.insightCard, t.live ? styles.insightHighlight : styles.insightInfo)}>
              <h4 className={styles.insightTitle}>
                {t.title}
                {t.live && <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>Live</span>}
              </h4>
              <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.window}</p>
              <p className={styles.insightText}>{t.prediction}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="How to read it">
        <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>
          {classical.readingOrder.map((s) => (
            <li key={s} style={{ marginBottom: 6 }}>{s}</li>
          ))}
        </ol>
        <ul style={{ margin: '0.8rem 0 0', paddingLeft: '1.15rem', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5 }}>
          {classical.sources.map((s) => (
            <li key={s} style={{ marginBottom: 4 }}>{s}</li>
          ))}
        </ul>
      </Section>
    </>
  )
}
