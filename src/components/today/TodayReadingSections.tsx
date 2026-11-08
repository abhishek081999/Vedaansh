'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/today/TodayReadingSections.tsx
//  Presentational cards for Today's Reading (no data fetching).
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import React, { useMemo } from 'react'
import type { ChartOutput } from '@/types/astrology'
import type { TodayReading, TimedWindow, Quality, TodayTransitGraha } from '@/lib/engine/todayReading'
import { GRAHA_NAMES } from '@/types/astrology'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI } from '@/i18n/jyotish'
import { ordHi } from '@/lib/engine/locale/todayReading.hi'
import { buildMoonTransitReport } from '@/lib/engine/moonTransitAnalysis'
import styles from './today-reading.module.css'

type Tone = 'good' | 'mixed' | 'caution'

export function toneColor(t: Tone): string {
  return t === 'good' ? 'var(--teal)' : t === 'caution' ? 'var(--rose)' : 'var(--amber)'
}

/** Sets the `--tone` custom property consumed by the CSS module. */
export function toned(t: Tone): React.CSSProperties {
  return { ['--tone' as string]: toneColor(t) }
}

export function scoreTone(score: number): Tone {
  return score >= 60 ? 'good' : score >= 42 ? 'mixed' : 'caution'
}

export function fmtTime(iso: string, tz: string, tag = 'en-IN'): string {
  try {
    return new Date(iso).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz })
  } catch {
    return new Date(iso).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit', hour12: true })
  }
}

/** Page-language formatting for times and day prefixes. */
export interface TodayFmt { tag: string; tomorrow: string }
const FMT_EN: TodayFmt = { tag: 'en-IN', tomorrow: 'tomorrow ' }

/** Calendar date (YYYY-MM-DD) of an instant in an IANA timezone. */
function dateIn(iso: string | number | Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso))
  } catch {
    return new Date(iso).toISOString().slice(0, 10)
  }
}

/**
 * "" for today, "tomorrow " for the next calendar day, otherwise a short weekday.
 * The Vedic day runs sunrise to sunrise, so many "today" windows fall after midnight.
 */
function dayPrefix(iso: string, tz: string, ref: Date, f: TodayFmt = FMT_EN): string {
  const d = dateIn(iso, tz)
  const today = dateIn(ref, tz)
  if (d === today) return ''
  const diff = Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000)
  if (diff === 1) return f.tomorrow
  try {
    return `${new Intl.DateTimeFormat(f.tag, { weekday: 'short', timeZone: tz }).format(new Date(iso))} `
  } catch {
    return ''
  }
}

/** Time with a day prefix when it is not today, e.g. "tomorrow 07:53 pm". */
export function fmtWhen(iso: string, tz: string, ref: Date = new Date(), f: TodayFmt = FMT_EN): string {
  return `${dayPrefix(iso, tz, ref, f)}${fmtTime(iso, tz, f.tag)}`
}

/** Time range; the day is named once on each side only when it differs from the other side or today. */
export function fmtSpan(w: { startIso: string; endIso: string }, tz: string, ref: Date = new Date(), f: TodayFmt = FMT_EN): string {
  const startPrefix = dayPrefix(w.startIso, tz, ref, f)
  const endPrefix = dateIn(w.endIso, tz) === dateIn(w.startIso, tz) ? '' : dayPrefix(w.endIso, tz, ref, f)
  return `${startPrefix}${fmtTime(w.startIso, tz, f.tag)} – ${endPrefix}${fmtTime(w.endIso, tz, f.tag)}`
}

/** fmtTime / fmtWhen / fmtSpan bound to the page language, plus names and ordinals. */
export function useTodayFmt() {
  const t = useTranslations('today.fmt')
  const { tag, hi } = useLang()
  const f: TodayFmt = { tag, tomorrow: t('tomorrow') }
  return {
    hi,
    time: (iso: string, tz: string) => fmtTime(iso, tz, tag),
    when: (iso: string, tz: string, ref?: Date) => fmtWhen(iso, tz, ref ?? new Date(), f),
    span: (w: { startIso: string; endIso: string }, tz: string, ref?: Date) => fmtSpan(w, tz, ref ?? new Date(), f),
    nth: (n: number) => (hi ? ordHi(n) : ordinal(n)),
    graha: (id: keyof typeof GRAHA_NAMES) => (hi ? GRAHA_HI[id] : GRAHA_NAMES[id]),
  }
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

// ── Moon + Tara ──────────────────────────────────────────────

export function MoonCard({
  r,
  tz,
  natal,
  transitMoon,
  visual,
}: {
  r: TodayReading
  tz: string
  natal?: ChartOutput
  transitMoon?: TodayTransitGraha | null
  /** Optional graphic shown under the title (phase, Tara and Chandra wheels). */
  visual?: React.ReactNode
}) {
  const t = useTranslations('today.moon')
  const fm = useTodayFmt()
  const m = r.moon
  const moonTone: Tone = m.chandraQuality === 'good' ? 'good' : m.chandraQuality === 'bad' ? 'caution' : 'mixed'
  const taraTone: Tone = r.tara.tone === 'supportive' || r.tara.tone === 'transformative' ? 'good' : r.tara.isHard ? 'caution' : 'mixed'

  const crossings = useMemo(() => {
    if (!natal || !transitMoon) return []
    const report = buildMoonTransitReport({
      natal,
      moonLon: transitMoon.lonSidereal,
      moonSpeedDegPerDay: transitMoon.speed,
      lang: fm.hi ? 'hi' : 'en',
    })
    return report?.nearTerm.slice(0, 6) ?? []
  }, [natal, transitMoon, fm.hi])

  return (
    <section className={styles.card} aria-label={t('aria')}>
      <h2 className={styles.cardTitle}>{t('title')}</h2>
      {visual}
      <div className={styles.kv} style={toned(moonTone)}>
        <span className={styles.kvKey}>{t('moon')}</span>
        <span className={styles.kvVal}>
          <span className={styles.dot} />
          {t('value', { rashi: m.rashiName, nak: m.nakshatraName, pada: m.pada })}
        </span>
        <span className={styles.kvNote}>
          {m.chandraNote} {t('counted', { nth: fm.nth(m.chandraPosition), lagnaNth: fm.nth(m.lagnaHouse), theme: m.lagnaTheme })}
        </span>
      </div>
      <div className={styles.kv} style={toned(taraTone)}>
        <span className={styles.kvKey}>{t('tara')}</span>
        <span className={styles.kvVal}>
          <span className={styles.dot} />
          {t('taraValue', { name: r.tara.name, n: r.tara.taraNumber, label: r.tara.label })}
        </span>
        <span className={styles.kvNote}>{r.tara.advice}{r.tara.trap ? t('watch', { trap: fm.hi ? r.tara.trap : r.tara.trap.toLowerCase() }) : ''}</span>
      </div>
      {m.overNatal.length > 0 && (
        <div className={styles.kv}>
          <span className={styles.kvKey}>{t('overNatal')}</span>
          <span className={styles.kvVal}>{m.overNatal.map(id => fm.graha(id)).join(', ')}</span>
          <span className={styles.kvNote}>{t('overNote', { planets: m.overNatal.map(id => fm.graha(id)).join(t('and')) })}</span>
        </div>
      )}
      {m.signChange && (
        <div className={styles.kv} style={toned(m.signChange.toChandraQuality === 'good' ? 'good' : m.signChange.toChandraQuality === 'bad' ? 'caution' : 'mixed')}>
          <span className={styles.kvKey}>{t('nextShift')}</span>
          <span className={styles.kvVal}>
            <span className={styles.dot} />
            {t('enters', { when: fm.when(m.signChange.atIso, tz), rashi: m.signChange.toRashiName })}
          </span>
          <span className={styles.kvNote}>
            {t('becomes', {
              nth: fm.nth(m.signChange.toChandraPosition),
              state: m.signChange.toChandraQuality === 'good' ? t('supportive') : m.signChange.toChandraQuality === 'bad' ? t('demanding') : t('neutral'),
            })}
          </span>
        </div>
      )}
      {crossings.length > 0 && (
        <div className={styles.kv}>
          <span className={styles.kvKey}>{t('crossings')}</span>
          <span className={styles.kvVal}>{t('next72')}</span>
          <ul className={styles.crossList}>
            {crossings.map(c => {
              const tone: Tone = c.tone === 'supportive' ? 'good' : c.tone === 'pressure' ? 'caution' : 'mixed'
              return (
                <li key={`${c.key}-${c.atIso}`} className={styles.crossItem} style={toned(tone)}>
                  <span className={styles.crossWhen}>{fm.when(c.atIso, tz)}</span>
                  <span className={styles.crossLabel}>
                    <span className={styles.dot} />
                    {c.label}
                    {c.activeNow ? t('now') : ''}
                  </span>
                  <span className={styles.crossNote}>{c.text}</span>
                </li>
              )
            })}
          </ul>
          <p className={styles.kvNote}>
            <Link href="/transit/moon" className={styles.inlineLink}>
              {t('fullCycle')}
            </Link>
          </p>
        </div>
      )}
    </section>
  )
}

// ── Panchang ─────────────────────────────────────────────────

export function PanchangCard({ r, visual }: { r: TodayReading; visual?: React.ReactNode }) {
  const t = useTranslations('today.panchang')
  return (
    <section className={styles.card} aria-label={t('aria')}>
      <h2 className={styles.cardTitle}>{t('title')}</h2>
      {visual}
      {r.panchang.map(it => (
        <div key={it.key} className={styles.kv} style={toned(it.quality)}>
          <span className={styles.kvKey}>{it.label}</span>
          <span className={styles.kvVal}>
            <span className={styles.dot} />
            {it.value}
            <span className={styles.badge}>{t(`quality.${it.quality as Quality}`)}</span>
          </span>
          <span className={styles.kvNote}>{it.note}</span>
        </div>
      ))}
    </section>
  )
}

// ── Life areas ───────────────────────────────────────────────

export function AreasCard({ r, visual }: { r: TodayReading; visual?: React.ReactNode }) {
  const t = useTranslations('today.areas')
  const rows = r.areas.map(a => {
        const tone = scoreTone(a.score)
        return (
          <div key={a.id} className={styles.areaRow} style={toned(tone)}>
            <span className={styles.areaName}>{a.label}</span>
            <div className={styles.areaBar} role="img" aria-label={t('barLabel', { label: a.label, score: a.score, verdict: a.verdictLabel })}>
              <div className={styles.areaFill} style={{ width: `${a.score}%` }} />
            </div>
            <span className={styles.areaScore}>{a.score}</span>
            {a.drivers.length > 0 && <span className={styles.areaWhy}>{t('why', { verdict: a.verdictLabel, drivers: a.drivers.join('; ') })}</span>}
          </div>
        )
      })
  return (
    <section className={styles.card} aria-label={t('aria')}>
      <h2 className={styles.cardTitle}>{t('title')}</h2>
      {visual
        ? <div className={styles.areasLayout}><div className={styles.areasViz}>{visual}</div><div className={styles.areasRows}>{rows}</div></div>
        : rows}
      <p className={styles.note}>
        {t('note')}
      </p>
    </section>
  )
}

// ── Windows ──────────────────────────────────────────────────

export function WindowsCard({ r, tz, visual }: { r: TodayReading; tz: string; visual?: React.ReactNode }) {
  const { good, avoid, horas, currentHora } = r.windows
  const t = useTranslations('today.windows')
  const fm = useTodayFmt()
  const row = (w: TimedWindow, tone: Tone) => (
    <div key={`${w.label}-${w.startIso}`} className={styles.windowRow} style={toned(tone)}>
      <span className={styles.windowName}>
        {w.label}
        {w.current && <span className={styles.nowTag}>{t('now')}</span>}
        {w.note && <span className={styles.windowNote}>{w.note}</span>}
      </span>
      <span className={styles.windowTime}>{fm.span(w, tz)}</span>
    </div>
  )
  return (
    <section className={styles.card} aria-label={t('aria')}>
      <h2 className={styles.cardTitle}>{t('title')}</h2>
      {visual}
      {currentHora && (
        <p className={styles.note}>
          {t('nowLine')} <strong style={{ color: 'var(--text-primary)' }}>{currentHora.label}</strong>
          {currentHora.note ? ` — ${currentHora.note}` : ''} {t('until', { time: fm.time(currentHora.endIso, tz) })}
        </p>
      )}
      {good.length > 0 ? good.map(w => row(w, 'good')) : <p className={styles.note}>{t('noneGood')}</p>}
      {horas.length > 0 && (
        <>
          <h3 className={styles.cardTitle} style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>{t('horas')}</h3>
          {horas.map(w => row(w, 'good'))}
        </>
      )}
      {avoid.length > 0 && (
        <>
          <h3 className={styles.cardTitle} style={{ marginTop: '0.4rem', color: 'var(--rose)' }}>{t('avoid')}</h3>
          {avoid.map(w => row(w, 'caution'))}
        </>
      )}
    </section>
  )
}

// ── Do / Avoid / Why ─────────────────────────────────────────

export function DoAvoidCards({ r }: { r: TodayReading }) {
  const t = useTranslations('today.doAvoid')
  return (
    <div className={styles.grid2}>
      <section className={styles.card} style={toned('good')} aria-label={t('doAria')}>
        <h2 className={styles.cardTitle} style={{ color: 'var(--teal)' }}>{t('lean')}</h2>
        <ul className={styles.list}>{r.doList.map(t => <li key={t}>{t}</li>)}</ul>
      </section>
      <section className={styles.card} style={toned('caution')} aria-label={t('avoidAria')}>
        <h2 className={styles.cardTitle} style={{ color: 'var(--rose)' }}>{t('easy')}</h2>
        <ul className={styles.list}>{r.avoidList.map(t => <li key={t}>{t}</li>)}</ul>
      </section>
    </div>
  )
}

export function FactorsCard({ r }: { r: TodayReading }) {
  const t = useTranslations('today.factors')
  if (r.supportive.length === 0 && r.caution.length === 0) return null
  return (
    <div className={styles.grid2}>
      <section className={styles.card} aria-label={t('supAria')}>
        <h2 className={styles.cardTitle} style={{ color: 'var(--teal)' }}>{t('helping')}</h2>
        {r.supportive.length > 0
          ? <ul className={styles.list}>{r.supportive.map(t => <li key={t}>{t}</li>)}</ul>
          : <p className={styles.note}>{t('noHelp')}</p>}
      </section>
      <section className={styles.card} aria-label={t('cauAria')}>
        <h2 className={styles.cardTitle} style={{ color: 'var(--rose)' }}>{t('weighing')}</h2>
        {r.caution.length > 0
          ? <ul className={styles.list}>{r.caution.map(t => <li key={t}>{t}</li>)}</ul>
          : <p className={styles.note}>{t('noWeigh')}</p>}
      </section>
    </div>
  )
}

// ── Remedy ───────────────────────────────────────────────────

export function RemedyCard({ r }: { r: TodayReading }) {
  const v = r.remedy.vara
  const t = useTranslations('today.remedy')
  const { hi } = useLang()
  const low = (x: string) => (hi ? x : x.toLowerCase())
  return (
    <section className={styles.card} aria-label={t('aria')}>
      <h2 className={styles.cardTitle}>{t('title')}</h2>
      <div className={styles.kv}>
        <span className={styles.kvKey}>{t('day', { name: v.name })}</span>
        <span className={styles.kvVal}>{v.remedy.mantra}</span>
        <span className={styles.kvNote}>
          {t('line', { color: low(v.remedy.color), charity: low(v.remedy.charity) })}
        </span>
      </div>
      {r.remedy.extra.map(e => (
        <div key={e.reason} className={styles.kv}>
          <span className={styles.kvKey}>{e.name}</span>
          <span className={styles.kvVal}>{e.remedy.mantra}</span>
          <span className={styles.kvNote}>{t('extra', { reason: e.reason, day: e.remedy.day, charity: low(e.remedy.charity) })}</span>
        </div>
      ))}
      <p className={styles.note}>{t('note')}</p>
    </section>
  )
}

// ── Dasha / gochar / triggers (collapsible) ──────────────────

const STATUS_TONE: Record<'favourable' | 'vedha' | 'unfavourable', Tone> = {
  favourable: 'good', vedha: 'mixed', unfavourable: 'caution',
}

/** Transit detail behind the reading: gochar from the Moon, Saturn phase and natal contacts. */
export function TransitsPanel({ r }: { r: TodayReading }) {
  const t = useTranslations('today.transits')
  return (
    <div className={styles.panelBody}>
      <h3 className={styles.cardTitle}>{t('gochar')}</h3>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr><th>{t('graha')}</th><th>{t('sign')}</th><th>{t('moon')}</th><th>{t('lagna')}</th><th>{t('read')}</th></tr>
          </thead>
          <tbody>
            {r.gochar.map(g => (
              <tr key={g.planet}>
                <td>{g.planetName}{g.isRetro ? ' ℞' : ''}</td>
                <td>{g.rashiName}</td>
                <td className={styles.mono}>{g.fromMoon}</td>
                <td className={styles.mono}>{g.fromLagna}</td>
                <td style={toned(STATUS_TONE[g.status])}>
                  <span className={styles.badge}>{t(`status.${g.status}`)}</span>
                  <span className={styles.windowNote}>{g.note}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>{r.saturn.note}</p>

      <h3 className={styles.cardTitle} style={{ marginTop: '0.4rem' }}>{t('contacts')}</h3>
      {r.triggers.length > 0
        ? <ul className={styles.list}>{r.triggers.map(t => <li key={`${t.transit}-${t.natal}-${t.aspect}`}>{t.text}</li>)}</ul>
        : <p className={styles.note}>{t('noContacts')}</p>}

      <p className={styles.note}>
        {t('note')}
      </p>
    </div>
  )
}
