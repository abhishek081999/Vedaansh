'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/today/TodayDashaPanel.tsx
//  The running dasha at a glance: every level with progress, the finer
//  periods turning over today, what changes next, and where the dasha
//  lords are transiting right now.
// ─────────────────────────────────────────────────────────────

import React from 'react'
import type { DashaDay } from '@/lib/engine/todayReading'
import type { DashaMicroPeriod, TodayDasha } from '@/lib/engine/todayDasha'
import { fmtSpan, toned } from './TodayReadingSections'
import styles from './today-reading.module.css'

type Tone = 'good' | 'mixed' | 'caution'

const DASHA_TONE: Record<DashaDay['tone'], Tone> = { supportive: 'good', mixed: 'mixed', challenging: 'caution' }
const STATUS_TONE: Record<TodayDasha['lords'][number]['status'], Tone> = { favourable: 'good', vedha: 'mixed', neutral: 'mixed', unfavourable: 'caution' }

function ordinal(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`
}

function fmtDate(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: tz }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

/** Long periods read best as dates, short ones (Prana, Deha) as clock times. */
function fmtPeriod(level: number, startIso: string, endIso: string, tz: string, ref: Date): string {
  if (level <= 4) return `${fmtDate(startIso, tz)} – ${fmtDate(endIso, tz)}`
  return fmtSpan({ startIso, endIso }, tz, ref)
}

function MicroList({ title, items, tz, refDate }: { title: string; items: DashaMicroPeriod[]; tz: string; refDate: Date }) {
  if (items.length === 0) return null
  return (
    <div className={styles.microBlock}>
      <h4 className={styles.microTitle}>{title}</h4>
      <ul className={styles.microList}>
        {items.map(m => (
          <li
            key={`${m.level}-${m.startIso}`}
            className={`${styles.microItem} ${m.current ? styles.microNow : ''} ${m.past ? styles.microPast : ''}`}
          >
            <span className={styles.microLord}>{m.lordName}{m.current && <span className={styles.nowTag}>now</span>}</span>
            <span className={styles.microTime}>{m.level <= 4 ? `${fmtDate(m.startIso, tz)} – ${fmtDate(m.endIso, tz)}` : fmtSpan(m, tz, refDate)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TodayDashaPanel({ d, tz, now }: { d: TodayDasha; tz: string; now: Date }) {
  return (
    <div className={styles.panelBody}>
      <p className={styles.panelLead}>{d.summary}</p>

      <div className={styles.dashaLevels}>
        {d.levels.map(l => (
          <div
            key={l.level}
            className={styles.dashaLevel}
            style={l.tone ? toned(DASHA_TONE[l.tone]) : { ['--tone' as string]: 'var(--text-muted)' } as React.CSSProperties}
          >
            <div className={styles.dashaHead}>
              <span className={styles.kvKey}>{l.levelLabel}</span>
              <span className={styles.dashaLord}><span className={styles.dot} />{l.lordName}</span>
              <span className={styles.dashaLeft}>{l.remaining} left</span>
            </div>
            <div
              className={styles.dashaBar}
              role="progressbar"
              aria-label={`${l.levelLabel} ${l.lordName} progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(l.progress * 100)}
            >
              <span style={{ width: `${Math.max(l.progress * 100, 1.5)}%` }} />
            </div>
            <div className={styles.dashaDates}>{fmtPeriod(l.level, l.startIso, l.endIso, tz, now)}</div>
            {l.note && <div className={styles.kvNote} style={{ gridColumn: 'auto' }}>{l.note}</div>}
          </div>
        ))}
      </div>

      <MicroList title="Prana periods today" items={d.prana} tz={tz} refDate={now} />
      <MicroList title="Sookshma around now" items={d.sookshma} tz={tz} refDate={now} />

      {d.changes.length > 0 && (
        <div className={styles.microBlock}>
          <h4 className={styles.microTitle}>What changes next</h4>
          <ul className={styles.microList}>
            {d.changes.map(c => (
              <li key={c.level} className={styles.microItem}>
                <span className={styles.microLord}>
                  {c.levelLabel}: {c.fromLordName}{c.toLordName ? ` → ${c.toLordName}` : ''}
                  {c.today && <span className={styles.nowTag}>today</span>}
                </span>
                <span className={styles.microTime}>{c.inText} · {fmtDate(c.atIso, tz)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.lords.length > 0 && (
        <div className={styles.microBlock}>
          <h4 className={styles.microTitle}>Dasha lords in the sky today</h4>
          {d.lords.map(l => (
            <div key={l.lord} className={styles.kv} style={toned(STATUS_TONE[l.status])}>
              <span className={styles.kvKey}>{l.roles.join(' + ')}</span>
              <span className={styles.kvVal}>
                {l.lordName}{l.isRetro ? ' ℞' : ''}
                <span className={styles.badge}>{l.status}</span>
              </span>
              <span className={styles.kvNote}>
                In {l.rashiName}: {ordinal(l.fromMoon)} from your Moon, {ordinal(l.fromLagna)} from Lagna. {l.note}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className={styles.note}>
        Vimshottari from your birth Moon. The Maha and Antar set the long theme, Pratyantar and Sookshma the weeks, Prana and Deha the hours. A lord that is well placed in your chart and favourable in transit delivers its results more easily.
      </p>
    </div>
  )
}
