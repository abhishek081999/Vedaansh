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
import { fmtSpan, toned, useTodayFmt, type TodayFmt } from './TodayReadingSections'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import styles from './today-reading.module.css'

type Tone = 'good' | 'mixed' | 'caution'

const DASHA_TONE: Record<DashaDay['tone'], Tone> = { supportive: 'good', mixed: 'mixed', challenging: 'caution' }
const STATUS_TONE: Record<TodayDasha['lords'][number]['status'], Tone> = { favourable: 'good', vedha: 'mixed', neutral: 'mixed', unfavourable: 'caution' }

function fmtDate(iso: string, tz: string, tag = 'en-IN'): string {
  try {
    return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric', timeZone: tz }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

/** Long periods read best as dates, short ones (Prana, Deha) as clock times. */
function fmtPeriod(level: number, startIso: string, endIso: string, tz: string, ref: Date, f: TodayFmt): string {
  if (level <= 4) return `${fmtDate(startIso, tz, f.tag)} – ${fmtDate(endIso, tz, f.tag)}`
  return fmtSpan({ startIso, endIso }, tz, ref, f)
}

function MicroList({ title, items, tz, refDate }: { title: string; items: DashaMicroPeriod[]; tz: string; refDate: Date }) {
  const t = useTranslations('today.dasha')
  const fm = useTodayFmt()
  const { tag } = useLang()
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
            <span className={styles.microLord}>{m.lordName}{m.current && <span className={styles.nowTag}>{t('now')}</span>}</span>
            <span className={styles.microTime}>{m.level <= 4 ? `${fmtDate(m.startIso, tz, tag)} – ${fmtDate(m.endIso, tz, tag)}` : fm.span(m, tz, refDate)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TodayDashaPanel({ d, tz, now }: { d: TodayDasha; tz: string; now: Date }) {
  const t = useTranslations('today.dasha')
  const tf = useTranslations('today.fmt')
  const tt = useTranslations('today.transits')
  const fm = useTodayFmt()
  const { tag } = useLang()
  const f: TodayFmt = { tag, tomorrow: tf('tomorrow') }
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
              <span className={styles.dashaLeft}>{t('left', { time: l.remaining })}</span>
            </div>
            <div
              className={styles.dashaBar}
              role="progressbar"
              aria-label={t('progress', { level: l.levelLabel, lord: l.lordName })}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(l.progress * 100)}
            >
              <span style={{ width: `${Math.max(l.progress * 100, 1.5)}%` }} />
            </div>
            <div className={styles.dashaDates}>{fmtPeriod(l.level, l.startIso, l.endIso, tz, now, f)}</div>
            {l.note && <div className={styles.kvNote} style={{ gridColumn: 'auto' }}>{l.note}</div>}
          </div>
        ))}
      </div>

      <MicroList title={t('prana')} items={d.prana} tz={tz} refDate={now} />
      <MicroList title={t('sookshma')} items={d.sookshma} tz={tz} refDate={now} />

      {d.changes.length > 0 && (
        <div className={styles.microBlock}>
          <h4 className={styles.microTitle}>{t('next')}</h4>
          <ul className={styles.microList}>
            {d.changes.map(c => (
              <li key={c.level} className={styles.microItem}>
                <span className={styles.microLord}>
                  {c.levelLabel}: {c.fromLordName}{c.toLordName ? ` → ${c.toLordName}` : ''}
                  {c.today && <span className={styles.nowTag}>{t('today')}</span>}
                </span>
                <span className={styles.microTime}>{c.inText} · {fmtDate(c.atIso, tz, tag)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.lords.length > 0 && (
        <div className={styles.microBlock}>
          <h4 className={styles.microTitle}>{t('lords')}</h4>
          {d.lords.map(l => (
            <div key={l.lord} className={styles.kv} style={toned(STATUS_TONE[l.status])}>
              <span className={styles.kvKey}>{l.roles.join(' + ')}</span>
              <span className={styles.kvVal}>
                {l.lordName}{l.isRetro ? ' ℞' : ''}
                <span className={styles.badge}>{tt(`status.${l.status}`)}</span>
              </span>
              <span className={styles.kvNote}>
                {t('inSign', { rashi: l.rashiName, moonNth: fm.nth(l.fromMoon), lagnaNth: fm.nth(l.fromLagna), note: l.note })}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className={styles.note}>
        {t('note')}
      </p>
    </div>
  )
}
