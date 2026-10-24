'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/today/TodayAdvancedSections.tsx
//  Presentational cards for the advanced lenses (no data fetching).
//  Engine: src/lib/engine/todayAdvanced.ts
// ─────────────────────────────────────────────────────────────

import React from 'react'
import type { HoraSegment, TodayAdvanced, Tone3 } from '@/lib/engine/todayAdvanced'
import { fmtSpan, fmtTime, toned } from './TodayReadingSections'
import styles from './today-reading.module.css'

const span = (s: { startIso: string; endIso: string }, tz: string) => fmtSpan(s, tz)

// ── Hora timeline + personal best slots ──────────────────────

function TimelineStrip({ segments, tz }: { segments: HoraSegment[]; tz: string }) {
  const total = segments.reduce((n, s) => n + (Date.parse(s.endIso) - Date.parse(s.startIso)), 0)
  const first = segments[0]
  const last = segments[segments.length - 1]
  return (
    <div>
      <div
        className={styles.strip}
        role="img"
        aria-label={`Hora timeline from ${fmtTime(first.startIso, tz)} to ${fmtTime(last.endIso, tz)}; details are listed below`}
      >
        {segments.map(s => (
          <div
            key={s.startIso}
            className={`${styles.stripSeg} ${s.past ? styles.stripPast : ''} ${s.current ? styles.stripNow : ''}`}
            style={{ ...toned(s.tone), flexGrow: (Date.parse(s.endIso) - Date.parse(s.startIso)) / total }}
            title={`${s.lordName} hora ${span(s, tz)} · score ${s.score}${s.notes.length ? ` · ${s.notes.join(', ')}` : ''}`}
          >
            <span className={styles.stripLabel}>{s.lord}</span>
          </div>
        ))}
      </div>
      <div className={styles.stripAxis}>
        <span>{fmtTime(first.startIso, tz)}</span>
        <span>green good · amber mixed · red caution · faded = past · outlined = now</span>
        <span>{fmtTime(last.endIso, tz)}</span>
      </div>
    </div>
  )
}

export function DayTimelineCard({ a, tz }: { a: TodayAdvanced; tz: string }) {
  const t = a.timeline
  if (!t) return null
  return (
    <section className={styles.card} aria-label="Hora timeline and best slots">
      <h2 className={styles.cardTitle}>Your day, hora by hora</h2>
      <TimelineStrip segments={t.segments} tz={tz} />

      {t.best.length > 0 && (
        <>
          <h3 className={styles.cardTitle} style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>Strongest upcoming horas</h3>
          {t.best.map(s => (
            <div key={s.startIso} className={styles.windowRow} style={toned(s.tone)}>
              <span className={styles.windowName}>
                {s.lordName} hora{s.current && <span className={styles.nowTag}>now</span>}
                {s.notes.length > 0 && <span className={styles.windowNote}>{s.notes.join(' · ')}</span>}
              </span>
              <span className={styles.windowTime}>{span(s, tz)}</span>
            </div>
          ))}
        </>
      )}

      <h3 className={styles.cardTitle} style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>Best slot for each purpose, from your own house lords</h3>
      {t.activities.map(x => (
        <div key={x.activity} className={styles.windowRow} style={toned(x.slot ? x.slot.tone : 'mixed')}>
          <span className={styles.windowName}>
            {x.activity}
            <span className={styles.windowNote}>{x.why}</span>
          </span>
          <span className={styles.windowTime}>{x.slot ? `${x.slot.lordName} · ${span(x.slot, tz)}` : '—'}</span>
        </div>
      ))}
      <p className={styles.note}>
        Hora lords are scored on their strength in your chart (dignity, Shadbala), today&apos;s gochar, the choghadiya underneath, and overlap with Rahu Kalam, Yamaganda and Gulika.
      </p>
    </section>
  )
}

// ── Kakshya ──────────────────────────────────────────────────

const VERDICT_TONE: Record<'strong' | 'steady' | 'weak', Tone3> = { strong: 'good', steady: 'mixed', weak: 'caution' }

export function KakshyaCard({ a, tz }: { a: TodayAdvanced; tz: string }) {
  const k = a.kakshya
  if (!k) return null
  const hasPrastara = k.rows.some(r => r.hasBindu !== null)
  return (
    <section className={styles.card} aria-label="Kakshya timing">
      <h2 className={styles.cardTitle}>Kakshya · fine timing inside the sign</h2>

      {k.moonWindows.length > 0 && (
        <>
          <p className={styles.note}>The Moon changes kakshya about every 7 hours. Its bindu windows are the best moments for Moon-ruled matters (mind, people, home).</p>
          <div className={styles.chipRow}>
            {k.moonWindows.map(w => (
              <span key={w.startIso} className={styles.winChip} style={toned(w.favourable ? 'good' : 'caution')}>
                <span className={styles.dot} />
                {span(w, tz)}
                <span className={styles.windowNote}>{w.kakshyaLord} kakshya · {w.favourable ? 'bindu' : 'no bindu'}{w.current ? ' · now' : ''}</span>
              </span>
            ))}
          </div>
        </>
      )}

      <table className={styles.table}>
        <thead>
          <tr><th>Graha</th><th>Position</th><th>BAV</th><th>SAV</th>{hasPrastara && <th>Kakshya</th>}<th>Read</th></tr>
        </thead>
        <tbody>
          {k.rows.map(r => (
            <tr key={r.planet}>
              <td>{r.planetName}</td>
              <td>{r.degreeInSign.toFixed(1)}° {r.rashiName}</td>
              <td className={styles.mono}>{r.bav}</td>
              <td className={styles.mono}>{r.sav}</td>
              {hasPrastara && <td>{r.kakshyaLord}{r.hasBindu === null ? '' : r.hasBindu ? ' ✓' : ' ✗'}</td>}
              <td style={toned(VERDICT_TONE[r.verdict])}><span className={styles.badge}>{r.verdict}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!hasPrastara && <p className={styles.note}>Recalculate this chart to unlock kakshya bindus; sign-level bindus are shown for now.</p>}
      <p className={styles.note}>BAV is the planet&apos;s own bindu count in the sign it is crossing (4+ is workable, 5+ good). A tick means the kakshya lord of its exact degree also contributed a bindu.</p>
    </section>
  )
}

// ── Sudarshana ───────────────────────────────────────────────

export function SudarshanaCard({ a }: { a: TodayAdvanced }) {
  const s = a.sudarshana
  if (s.rows.length === 0) return null
  const tone = (good: number): Tone3 => (good >= 2 ? 'good' : good === 1 ? 'mixed' : 'caution')
  return (
    <section className={styles.card} aria-label="Sudarshana Chakra">
      <h2 className={styles.cardTitle}>Sudarshana · three reference points</h2>
      {s.summary.map(t => <p key={t} className={styles.note} style={{ color: 'var(--text-secondary)' }}>{t}</p>)}
      <table className={styles.table}>
        <thead>
          <tr><th>Graha</th><th>Lagna</th><th>Moon</th><th>Sun</th><th>Agree</th></tr>
        </thead>
        <tbody>
          {s.rows.map(r => (
            <tr key={r.planet}>
              <td>{r.planetName}</td>
              <td className={styles.mono}>{r.houses.lagna}</td>
              <td className={styles.mono}>{r.houses.moon}</td>
              <td className={styles.mono}>{r.houses.sun}</td>
              <td style={toned(tone(r.good))}><span className={styles.badge}>{r.good}/3</span> <span className={styles.windowNote} style={{ display: 'inline' }}>{r.verdict}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>Each planet&apos;s house is counted from your Lagna, your Moon and your Sun. When all three agree the result is dependable; when they split, the influence is partial.</p>
    </section>
  )
}
