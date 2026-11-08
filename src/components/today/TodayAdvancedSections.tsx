'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/today/TodayAdvancedSections.tsx
//  Presentational cards for the advanced lenses (no data fetching).
//  Engine: src/lib/engine/todayAdvanced.ts
// ─────────────────────────────────────────────────────────────

import React from 'react'
import type { HoraSegment, TodayAdvanced, Tone3 } from '@/lib/engine/todayAdvanced'
import { toned, useTodayFmt } from './TodayReadingSections'
import { useTranslations } from 'next-intl'
import { GRAHA_SHORT_HI } from '@/i18n/jyotish'
import styles from './today-reading.module.css'

// ── Hora timeline + personal best slots ──────────────────────

function TimelineStrip({ segments, tz }: { segments: HoraSegment[]; tz: string }) {
  const t = useTranslations('today.advanced')
  const fm = useTodayFmt()
  const fmtTime = fm.time
  const span = fm.span
  const { hi } = fm
  const total = segments.reduce((n, s) => n + (Date.parse(s.endIso) - Date.parse(s.startIso)), 0)
  const first = segments[0]
  const last = segments[segments.length - 1]
  return (
    <div>
      <div
        className={styles.strip}
        role="img"
        aria-label={t('stripAria', { from: fmtTime(first.startIso, tz), to: fmtTime(last.endIso, tz) })}
      >
        {segments.map(s => (
          <div
            key={s.startIso}
            className={`${styles.stripSeg} ${s.past ? styles.stripPast : ''} ${s.current ? styles.stripNow : ''}`}
            style={{ ...toned(s.tone), flexGrow: (Date.parse(s.endIso) - Date.parse(s.startIso)) / total }}
            title={`${t('segTitle', { lord: s.lordName, span: span(s, tz), score: s.score })}${s.notes.length ? ` · ${s.notes.join(', ')}` : ''}`}
          >
            <span className={styles.stripLabel}>{hi ? GRAHA_SHORT_HI[s.lord] ?? s.lord : s.lord}</span>
          </div>
        ))}
      </div>
      <div className={styles.stripAxis}>
        <span>{fmtTime(first.startIso, tz)}</span>
        <span>{t('legend')}</span>
        <span>{fmtTime(last.endIso, tz)}</span>
      </div>
    </div>
  )
}

export function DayTimelineCard({ a, tz }: { a: TodayAdvanced; tz: string }) {
  const tr = useTranslations('today.advanced')
  const { span } = useTodayFmt()
  const t = a.timeline
  if (!t) return null
  return (
    <section className={styles.card} aria-label={tr('aria')}>
      <h2 className={styles.cardTitle}>{tr('title')}</h2>
      <TimelineStrip segments={t.segments} tz={tz} />

      {t.best.length > 0 && (
        <>
          <h3 className={styles.cardTitle} style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>{tr('best')}</h3>
          {t.best.map(s => (
            <div key={s.startIso} className={styles.windowRow} style={toned(s.tone)}>
              <span className={styles.windowName}>
                {tr('hora', { lord: s.lordName })}{s.current && <span className={styles.nowTag}>{tr('now')}</span>}
                {s.notes.length > 0 && <span className={styles.windowNote}>{s.notes.join(' · ')}</span>}
              </span>
              <span className={styles.windowTime}>{span(s, tz)}</span>
            </div>
          ))}
        </>
      )}

      <h3 className={styles.cardTitle} style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>{tr('purpose')}</h3>
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
        {tr('horaNote')}
      </p>
    </section>
  )
}

// ── Kakshya ──────────────────────────────────────────────────

const VERDICT_TONE: Record<'strong' | 'steady' | 'weak', Tone3> = { strong: 'good', steady: 'mixed', weak: 'caution' }

export function KakshyaCard({ a, tz }: { a: TodayAdvanced; tz: string }) {
  const t = useTranslations('today.advanced')
  const tt = useTranslations('today.transits')
  const { span } = useTodayFmt()
  const k = a.kakshya
  if (!k) return null
  const hasPrastara = k.rows.some(r => r.hasBindu !== null)
  return (
    <section className={styles.card} aria-label={t('kAria')}>
      <h2 className={styles.cardTitle}>{t('kTitle')}</h2>

      {k.moonWindows.length > 0 && (
        <>
          <p className={styles.note}>{t('kMoon')}</p>
          <div className={styles.chipRow}>
            {k.moonWindows.map(w => (
              <span key={w.startIso} className={styles.winChip} style={toned(w.favourable ? 'good' : 'caution')}>
                <span className={styles.dot} />
                {span(w, tz)}
                <span className={styles.windowNote}>{t('kWin', { lord: w.kakshyaLord, state: w.favourable ? t('bindu') : t('noBindu') })}{w.current ? t('nowSuffix') : ''}</span>
              </span>
            ))}
          </div>
        </>
      )}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr><th>{tt('graha')}</th><th>{t('position')}</th><th>BAV</th><th>SAV</th>{hasPrastara && <th>{t('kakshya')}</th>}<th>{tt('read')}</th></tr>
          </thead>
          <tbody>
            {k.rows.map(r => (
              <tr key={r.planet}>
                <td>{r.planetName}</td>
                <td>{r.degreeInSign.toFixed(1)}° {r.rashiName}</td>
                <td className={styles.mono}>{r.bav}</td>
                <td className={styles.mono}>{r.sav}</td>
                {hasPrastara && <td>{r.kakshyaLord}{r.hasBindu === null ? '' : r.hasBindu ? ' ✓' : ' ✗'}</td>}
                <td style={toned(VERDICT_TONE[r.verdict])}><span className={styles.badge}>{t(`verdict.${r.verdict}`)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!hasPrastara && <p className={styles.note}>{t('recalc')}</p>}
      <p className={styles.note}>{t('kNote')}</p>
    </section>
  )
}

// ── Sudarshana ───────────────────────────────────────────────

export function SudarshanaCard({ a }: { a: TodayAdvanced }) {
  const t = useTranslations('today.advanced')
  const tt = useTranslations('today.transits')
  const s = a.sudarshana
  if (s.rows.length === 0) return null
  const tone = (good: number): Tone3 => (good >= 2 ? 'good' : good === 1 ? 'mixed' : 'caution')
  return (
    <section className={styles.card} aria-label={t('sAria')}>
      <h2 className={styles.cardTitle}>{t('sTitle')}</h2>
      {s.summary.map(line => <p key={line} className={styles.note} style={{ color: 'var(--text-secondary)' }}>{line}</p>)}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr><th>{tt('graha')}</th><th>{tt('lagna')}</th><th>{tt('moon')}</th><th>{t('sun')}</th><th>{t('agree')}</th></tr>
          </thead>
          <tbody>
            {s.rows.map(r => (
              <tr key={r.planet}>
                <td>{r.planetName}</td>
                <td className={styles.mono}>{r.houses.lagna}</td>
                <td className={styles.mono}>{r.houses.moon}</td>
                <td className={styles.mono}>{r.houses.sun}</td>
                <td style={toned(tone(r.good))}><span className={styles.badge}>{r.good}/3</span> <span className={styles.windowNote} style={{ display: 'inline' }}>{r.verdictLabel}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>{t('sNote')}</p>
    </section>
  )
}
