// ─────────────────────────────────────────────────────────────
//  src/components/ui/JaiminiMarriageSection.tsx
//  Jaimini marriage & relationship analysis (DK · UL · D9 · timing)
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  analyzeJaiminiMarriage,
  type InsightTone,
  type StrengthBand,
} from '@/lib/engine/jaiminiMarriageAnalysis'
import type { ChartOutput } from '@/types/astrology'
import { cn } from '@/lib/ui/cn'
import styles from './JaiminiMarriageSection.module.css'

type SubTab =
  | 'overview'
  | 'dk'
  | 'ul'
  | 'd9'
  | 'path'
  | 'flags'
  | 'timing'
  | 'guide'

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'dk', label: 'Darakaraka' },
  { id: 'ul', label: 'Upapada' },
  { id: 'd9', label: 'DK in D9' },
  { id: 'path', label: 'Love / Arranged' },
  { id: 'flags', label: 'Red Flags' },
  { id: 'timing', label: 'Timing' },
  { id: 'guide', label: 'Guide' },
]

function bandPill(band: StrengthBand): string {
  if (band === 'strong') return styles.pillStrong
  if (band === 'weak') return styles.pillWeak
  return styles.pillMid
}

function toneClass(tone: InsightTone): string {
  if (tone === 'supportive') return styles.insightSupportive
  if (tone === 'challenging') return styles.insightChallenging
  if (tone === 'mixed') return styles.insightMixed
  return ''
}

interface JaiminiMarriageSectionProps {
  chart: ChartOutput
}

export function JaiminiMarriageSection({ chart }: JaiminiMarriageSectionProps) {
  const [sub, setSub] = useState<SubTab>('overview')
  const analysis = useMemo(() => analyzeJaiminiMarriage(chart), [chart])

  if (!analysis) {
    return (
      <div className={styles.root}>
        <p className={styles.empty}>
          Marriage analysis needs D1 grahas, Upapada (A12), and D9 data. Recalculate the chart to continue.
        </p>
      </div>
    )
  }

  const { darakaraka: dk, upapada: ul, dkNavamsha: d9, seventh, social, marriagePath } = analysis

  return (
    <div className={styles.root}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Jaimini · Relationship</p>
        <h3 className={styles.title}>Marriage Analysis</h3>
        <p className={styles.summary}>{analysis.summary}</p>
        <div className={styles.badgeRow}>
          <span className={cn(styles.badge, styles.badgeGold)}>
            DK {dk.name} · {dk.sign.rashiShort}
          </span>
          <span className={cn(styles.badge, styles.badgeGold)}>
            UL {ul.sign.rashiShort}
          </span>
          <span className={cn(styles.badge, analysis.balance === 'balanced' ? styles.badgeOk : styles.badgeWarn)}>
            {analysis.balance === 'balanced' ? 'Balanced' : 'Imbalanced'}
          </span>
          <span className={cn(styles.badge, analysis.activeRedFlagCount ? styles.badgeWarn : styles.badgeOk)}>
            {analysis.activeRedFlagCount} red flag{analysis.activeRedFlagCount === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Darakaraka</div>
          <div className={styles.statValue}>{dk.name}</div>
          <div className={styles.statHint}>
            {dk.sign.rashiName} · H{dk.sign.houseFromLagna}
            {dk.isRetro ? ' · R' : ''}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Upapada</div>
          <div className={styles.statValue}>{ul.sign.rashiName}</div>
          <div className={styles.statHint}>H{ul.sign.houseFromLagna} · 7th {ul.seventhFromUl.rashiShort}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>DK / UL</div>
          <div className={styles.statValue}>
            <span className={cn(styles.pill, bandPill(dk.strength.band))}>{dk.strength.band}</span>
            {' / '}
            <span className={cn(styles.pill, bandPill(ul.strength.band))}>{ul.strength.band}</span>
          </div>
          <div className={styles.statHint}>{analysis.dkUlScenarioLabel}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Path · Quality</div>
          <div className={styles.statValue}>{marriagePath.type.replace(/_/g, ' ')}</div>
          <div className={styles.statHint}>
            Quality <span className={cn(styles.pill, bandPill(analysis.qualityBand))}>{analysis.qualityBand}</span>
          </div>
        </div>
      </div>

      <nav className={styles.subNav} aria-label="Marriage analysis sections">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={cn(styles.subBtn, sub === t.id && styles.subBtnActive)}
            onClick={() => setSub(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {sub === 'overview' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Key insights</h4>
            <div className={styles.insightGrid}>
              {analysis.insights.map(ins => (
                <article key={ins.title} className={cn(styles.insight, toneClass(ins.tone))}>
                  <h5 className={styles.insightTitle}>{ins.title}</h5>
                  <p className={styles.insightText}>{ins.text}</p>
                </article>
              ))}
            </div>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>DK vs UL</h4>
            <p className={styles.insightText}>{analysis.dkUlScenarioNote}</p>
            <p className={styles.insightText} style={{ marginTop: '0.45rem' }}>{analysis.qualitySummary}</p>
          </section>
          <blockquote className={styles.quote}>{analysis.quotes[0]}</blockquote>
        </div>
      )}

      {sub === 'dk' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Partner significator</h4>
            <ul className={styles.noteList}>
              {dk.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>DK planet profile</h4>
            <table className={styles.table}>
              <tbody>
                <tr><th scope="row">Nature</th><td>{dk.profile.nature}</td></tr>
                <tr><th scope="row">Hidden challenge</th><td>{dk.profile.hiddenChallenge}</td></tr>
                <tr><th scope="row">Karmic lesson</th><td>{dk.profile.karmicLesson}</td></tr>
                <tr><th scope="row">Dignity</th><td>{dk.dignity}{dk.isCombust ? ' · combust' : ''}</td></tr>
                <tr><th scope="row">Sign type</th><td>{dk.signType}</td></tr>
              </tbody>
            </table>
          </section>
          {dk.companions.length > 0 && (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Companions with DK</h4>
              <ul className={styles.noteList}>
                {dk.companions.map(c => (
                  <li key={c.id} className={styles.noteItem}>
                    {c.name}{c.isRetro ? ' (R)' : ''} · {c.dignity}
                    {c.charaKaraka ? ` · ${c.charaKaraka}` : ''}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Spouse influence areas (Jaimini aspects)</h4>
            <ul className={styles.noteList}>
              {dk.influenceAreas.map(a => (
                <li key={a.house} className={styles.noteItem}>
                  H{a.house} — {a.theme}
                </li>
              ))}
            </ul>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>7th house (classical + rashi)</h4>
            <ul className={styles.noteList}>
              {seventh.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
          </section>
        </div>
      )}

      {sub === 'ul' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Upapada Lagna — survival</h4>
            <ul className={styles.noteList}>
              {ul.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>UL map</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Point</th>
                  <th>Sign</th>
                  <th>House</th>
                  <th>Lord</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>UL</td>
                  <td>{ul.sign.rashiName}</td>
                  <td>H{ul.sign.houseFromLagna}</td>
                  <td>{ul.sign.lordName}</td>
                </tr>
                <tr>
                  <td>7th from UL</td>
                  <td>{ul.seventhFromUl.rashiName}</td>
                  <td>H{ul.seventhFromUl.houseFromLagna}</td>
                  <td>{ul.seventhFromUl.lordName}</td>
                </tr>
                <tr>
                  <td>2nd from UL</td>
                  <td>{ul.secondFromUl.rashiName}</td>
                  <td>H{ul.secondFromUl.houseFromLagna}</td>
                  <td>{ul.secondFromUl.lordName}</td>
                </tr>
                <tr>
                  <td>UL lord</td>
                  <td>{ul.ulLord.rashiName}</td>
                  <td>H{ul.ulLord.houseFromLagna}</td>
                  <td>
                    {ul.ulLord.name}
                    {ul.ulLord.isCombust ? ' · combust' : ''}
                    {ul.ulLord.isDebilitated ? ' · deb' : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Strength reasons</h4>
            <ul className={styles.noteList}>
              {ul.strength.reasons.map(r => <li key={r} className={styles.noteItem}>{r}</li>)}
            </ul>
          </section>
        </div>
      )}

      {sub === 'd9' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>DK in Navamsha — true partner nature</h4>
            <ul className={styles.noteList}>
              {d9.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>D9 snapshot</h4>
            <table className={styles.table}>
              <tbody>
                <tr><th scope="row">DK in D9</th><td>{d9.rashiName} · H{d9.houseFromD9Lagna}</td></tr>
                <tr><th scope="row">Dignity</th><td>{d9.dignity}{d9.isDebilitated ? ' (debilitated)' : ''}</td></tr>
                <tr><th scope="row">7th from DK</th><td>{d9.seventhFromDk.rashiName}</td></tr>
                <tr>
                  <th scope="row">Blessing</th>
                  <td>{d9.trinalBlessing ? 'Trine (1/5/9) — divine support' : 'Not in D9 trine'}</td>
                </tr>
              </tbody>
            </table>
          </section>
          {d9.seventhOccupants.length > 0 && (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Planets in 7th from DK (D9)</h4>
              <ul className={styles.noteList}>
                {d9.seventhOccupants.map(o => (
                  <li key={o.id} className={styles.noteItem}>{o.name} · {o.dignity}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {sub === 'path' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{marriagePath.label}</h4>
            <p className={styles.insightText}>
              Love markers: {marriagePath.loveScore} · Arranged markers: {marriagePath.arrangedScore}
            </p>
            <ul className={styles.noteList} style={{ marginTop: '0.55rem' }}>
              {marriagePath.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Society & family acceptance</h4>
            <ul className={styles.noteList}>
              {social.notes.map(n => <li key={n} className={styles.noteItem}>{n}</li>)}
            </ul>
            <p className={styles.insightText} style={{ marginTop: '0.5rem' }}>
              Family support:{' '}
              <span className={cn(styles.pill, bandPill(social.familySupport))}>{social.familySupport}</span>
              {' · '}Sun {social.sun.rashiName} · Moon {social.moon.rashiName}
            </p>
          </section>
        </div>
      )}

      {sub === 'flags' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Divorce / instability checklist</h4>
            <div className={styles.flagRow}>
              {analysis.redFlags.map(f => (
                <div key={f.id} className={cn(styles.flag, f.active && styles.flagActive)}>
                  <span className={styles.flagMark} aria-hidden>{f.active ? '!' : '·'}</span>
                  <div>
                    <p className={styles.flagLabel}>{f.label}</p>
                    <p className={styles.flagDetail}>{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <blockquote className={styles.quote}>
            {analysis.quotes.find(q => q.includes('Divorce')) ?? analysis.quotes[3]}
          </blockquote>
        </div>
      )}

      {sub === 'timing' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Marriage timing windows</h4>
            <p className={styles.insightText} style={{ marginBottom: '0.55rem' }}>
              Activate DK / UL / 7th-from-UL / 7th-from-DK in Chara dasha, then confirm with Vimshottari.
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Window</th>
                  <th>Sign</th>
                  <th>System</th>
                  <th>Now</th>
                </tr>
              </thead>
              <tbody>
                {analysis.timing.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div>{t.label}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.note}</div>
                    </td>
                    <td>{t.rashiName}</td>
                    <td>{t.system === 'chara' ? 'Chara' : 'Vimshottari'}</td>
                    <td className={t.isActiveNow ? styles.timingActive : undefined}>
                      {t.isActiveNow ? 'Active' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {analysis.timing[0]?.activePathLabel && (
              <p className={styles.insightText} style={{ marginTop: '0.55rem' }}>
                Current path: {analysis.timing.find(t => t.activePathLabel)?.activePathLabel}
              </p>
            )}
          </section>
          <blockquote className={styles.quote}>
            {analysis.quotes.find(q => q.includes('Vimshottari')) ?? analysis.quotes[2]}
          </blockquote>
        </div>
      )}

      {sub === 'guide' && (
        <div className={styles.stack}>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Practical checklist</h4>
            <ol className={styles.noteList} style={{ listStyle: 'decimal', paddingLeft: '1.1rem' }}>
              {analysis.checklist.map(step => (
                <li key={step} className={styles.noteItem} style={{ borderLeft: 'none', paddingLeft: 0 }}>
                  {step}
                </li>
              ))}
            </ol>
          </section>
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Session principles</h4>
            <div className={styles.stack}>
              {analysis.quotes.map(q => (
                <blockquote key={q} className={styles.quote}>{q}</blockquote>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default JaiminiMarriageSection
