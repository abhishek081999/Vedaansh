// ─────────────────────────────────────────────────────────────
//  src/components/ui/DashamsaAdvancedPanel.tsx
//  D10 Advanced — dispositors, drishti, strength, karakas, timeline
// ─────────────────────────────────────────────────────────────
'use client'

import React from 'react'
import type { CareerTone } from '@/lib/engine/dashamsaAnalysis'
import type { DashamsaAdvanced } from '@/lib/engine/dashamsaAdvanced'
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

export function DashamsaAdvancedPanel({ advanced }: { advanced: DashamsaAdvanced }) {
  const {
    framing,
    headline,
    dispositor,
    drishti,
    shadbala,
    bhavaBala,
    ashtakavarga,
    karakas,
    flags,
    raja,
    timeline,
    takeaways,
  } = advanced

  return (
    <>
      <Section title="Advanced technical">
        <p className={styles.heroSub} style={{ marginBottom: '0.65rem', maxWidth: 'none' }}>
          {framing}
        </p>
        <article className={cn(styles.insightCard, styles.insightHighlight)}>
          <h4 className={styles.insightTitle}>Headline</h4>
          <p className={styles.insightText}>{headline}</p>
        </article>
        <div className={styles.insightGrid} style={{ marginTop: '0.75rem' }}>
          {takeaways.map((line) => (
            <article key={line.slice(0, 48)} className={cn(styles.insightCard, styles.insightInfo)}>
              <p className={styles.insightText}>{line}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Dispositor chains">
        {dispositor.map((chain) => (
          <article
            key={chain.startId + chain.role}
            className={cn(styles.insightCard, chain.cyclic ? styles.insightHighlight : styles.insightInfo)}
            style={{ marginBottom: '0.65rem' }}
          >
            <h4 className={styles.insightTitle}>
              {chain.startName}
              <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>{chain.role}</span>
              {chain.cyclic && (
                <span className={cn(styles.pill, styles.pillWeak)} style={{ marginLeft: 6 }}>loop</span>
              )}
            </h4>
            <p className={styles.insightText} style={{ fontFamily: 'var(--font-mono, ui-monospace)', fontSize: '0.8rem' }}>
              {chain.links.map((l) => `${l.name} H${l.house}`).join(' → ')}
            </p>
            <p className={styles.insightText} style={{ marginTop: '0.4rem' }}>{chain.prediction}</p>
          </article>
        ))}
      </Section>

      <Section title="Graha drishti on D10">
        <article className={cn(styles.insightCard, styles.insightInfo)} style={{ marginBottom: '0.65rem' }}>
          <p className={styles.insightText}>{drishti.prediction}</p>
        </article>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Target</th>
                <th>Planet</th>
                <th>From</th>
                <th>Aspect</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {drishti.onTenth.map((h) => (
                <tr key={`10-${h.id}`}>
                  <td>10th</td>
                  <td className={styles.planetCell}>{h.name}</td>
                  <td>H{h.fromHouse}</td>
                  <td><span className={cn(styles.pill, toneClass(h.tone) === styles.insightStrength ? styles.pillStrong : styles.pillPk)}>{h.aspectLabel}</span></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{h.note}</td>
                </tr>
              ))}
              {drishti.onLagna.map((h) => (
                <tr key={`1-${h.id}`}>
                  <td>Lagna</td>
                  <td className={styles.planetCell}>{h.name}</td>
                  <td>H{h.fromHouse}</td>
                  <td><span className={cn(styles.pill, styles.pillPk)}>{h.aspectLabel}</span></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{h.note}</td>
                </tr>
              ))}
              {!drishti.onTenth.length && !drishti.onLagna.length && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--text-muted)' }}>No full aspects on D10 10th or lagna.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Natal Shadbala · career lords">
        <p className={styles.heroSub} style={{ marginBottom: '0.55rem', maxWidth: 'none' }}>
          {shadbala.prediction}
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Planet</th>
                <th>Role</th>
                <th>Ratio</th>
                <th>Band</th>
                <th>Dig</th>
                <th>Read</th>
              </tr>
            </thead>
            <tbody>
              {shadbala.rows.map((r) => (
                <tr key={r.id}>
                  <td className={styles.planetCell}>{r.name}</td>
                  <td>{r.role}</td>
                  <td>{r.ratio != null ? r.ratio.toFixed(2) : '—'}</td>
                  <td>
                    {r.quality ?? (r.isStrong == null ? '—' : r.isStrong ? 'strong' : 'weak')}
                  </td>
                  <td>{r.digBala != null ? r.digBala.toFixed(1) : '—'}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Bhava bala · 10th & 11th">
        <p className={styles.heroSub} style={{ marginBottom: '0.55rem', maxWidth: 'none' }}>
          {bhavaBala.prediction}
        </p>
        <div className={styles.insightGrid}>
          {bhavaBala.tenth && (
            <article className={cn(styles.insightCard, bhavaBala.tenth.isStrong ? styles.insightStrength : styles.insightCaution)}>
              <h4 className={styles.insightTitle}>H10 · {bhavaBala.tenth.totalRupa.toFixed(2)} rupa</h4>
              <p className={styles.insightText}>{bhavaBala.tenth.note}</p>
            </article>
          )}
          {bhavaBala.eleventh && (
            <article className={cn(styles.insightCard, bhavaBala.eleventh.isStrong ? styles.insightStrength : styles.insightCaution)}>
              <h4 className={styles.insightTitle}>H11 · {bhavaBala.eleventh.totalRupa.toFixed(2)} rupa</h4>
              <p className={styles.insightText}>{bhavaBala.eleventh.note}</p>
            </article>
          )}
          {!bhavaBala.tenth && !bhavaBala.eleventh && (
            <article className={cn(styles.insightCard, styles.insightInfo)}>
              <p className={styles.insightText}>Bhava bala not on this chart — recalculate to attach house strength.</p>
            </article>
          )}
        </div>
      </Section>

      <Section title="Sarvashtakavarga · career houses">
        <p className={styles.heroSub} style={{ marginBottom: '0.55rem', maxWidth: 'none' }}>
          {ashtakavarga.prediction}
        </p>
        <div className={styles.insightGrid}>
          {ashtakavarga.houses.map((h) => (
            <article key={h.house} className={cn(styles.insightCard, toneClass(h.tone))}>
              <h4 className={styles.insightTitle}>
                Natal H{h.house} · {h.rashiName}
                {h.bindus != null && (
                  <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>{h.bindus} bindus</span>
                )}
              </h4>
              <p className={styles.insightText}>{h.note}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Chara karakas in D10">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Planet</th>
                <th>D10 house</th>
                <th>Sign</th>
                <th>Career note</th>
              </tr>
            </thead>
            <tbody>
              {karakas.map((k) => (
                <tr key={k.code}>
                  <td className={styles.planetCell}>{k.code}</td>
                  <td>{k.name}</td>
                  <td>H{k.house}</td>
                  <td>{k.rashiName}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{k.careerNote}</td>
                </tr>
              ))}
              {!karakas.length && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--text-muted)' }}>No chara karakas on this payload.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Dignity & special flags">
        <div className={styles.insightGrid}>
          {flags.map((f) => (
            <article key={f.id} className={cn(styles.insightCard, styles.insightInfo)}>
              <h4 className={styles.insightTitle}>
                {f.name}
                <span className={cn(styles.pill, styles.pillPk)} style={{ marginLeft: 8 }}>{f.role}</span>
              </h4>
              <div style={{ margin: '0.35rem 0' }}>
                {f.flags.length
                  ? f.flags.map((flag) => (
                      <span key={flag} className={cn(styles.pill, styles.pillStrong)} style={{ marginRight: 4 }}>{flag}</span>
                    ))
                  : <span className={styles.pill}>plain</span>}
              </div>
              <p className={styles.insightText}>{f.note}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="D10 raja · kendra–trikona links">
        <div className={styles.insightGrid}>
          {raja.map((r) => (
            <article
              key={r.id}
              className={cn(styles.insightCard, r.formed ? toneClass(r.tone) : styles.insightInfo)}
            >
              <h4 className={styles.insightTitle}>
                {r.title}
                <span
                  className={cn(styles.pill, r.formed ? styles.pillStrong : styles.pillPk)}
                  style={{ marginLeft: 8 }}
                >
                  {r.formed ? 'formed' : 'quiet'}
                </span>
              </h4>
              <p className={styles.insightText}>{r.prediction}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Career dasha timeline">
        <p className={styles.heroSub} style={{ marginBottom: '0.55rem', maxWidth: 'none' }}>
          {timeline.headline}
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Period</th>
                <th>Lord</th>
                <th>Window</th>
                <th>Career</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {timeline.items.map((item) => (
                <tr key={`${item.label}-${item.start}`}>
                  <td className={styles.planetCell}>{item.label}</td>
                  <td>{item.lordName}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{item.start} → {item.end}</td>
                  <td>
                    {item.careerHit
                      ? <span className={cn(styles.pill, styles.pillStrong)}>hit</span>
                      : <span className={cn(styles.pill, styles.pillPk)}>bg</span>}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.note}</td>
                </tr>
              ))}
              {!timeline.items.length && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--text-muted)' }}>No Vimshottari periods attached — recalculate for timing.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  )
}
