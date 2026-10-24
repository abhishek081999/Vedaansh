'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/today/TodayReadingSections.tsx
//  Presentational cards for Today's Reading (no data fetching).
// ─────────────────────────────────────────────────────────────

import React from 'react'
import type { TodayReading, TimedWindow, Quality } from '@/lib/engine/todayReading'
import { GRAHA_NAMES } from '@/types/astrology'
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

export function fmtTime(iso: string, tz: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz })
  } catch {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }
}

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
function dayPrefix(iso: string, tz: string, ref: Date): string {
  const d = dateIn(iso, tz)
  const today = dateIn(ref, tz)
  if (d === today) return ''
  const diff = Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000)
  if (diff === 1) return 'tomorrow '
  try {
    return `${new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: tz }).format(new Date(iso))} `
  } catch {
    return ''
  }
}

/** Time with a day prefix when it is not today, e.g. "tomorrow 07:53 pm". */
export function fmtWhen(iso: string, tz: string, ref: Date = new Date()): string {
  return `${dayPrefix(iso, tz, ref)}${fmtTime(iso, tz)}`
}

/** Time range; the day is named once on each side only when it differs from the other side or today. */
export function fmtSpan(w: { startIso: string; endIso: string }, tz: string, ref: Date = new Date()): string {
  const startPrefix = dayPrefix(w.startIso, tz, ref)
  const endPrefix = dateIn(w.endIso, tz) === dateIn(w.startIso, tz) ? '' : dayPrefix(w.endIso, tz, ref)
  return `${startPrefix}${fmtTime(w.startIso, tz)} – ${endPrefix}${fmtTime(w.endIso, tz)}`
}

const span = (w: TimedWindow, tz: string) => fmtSpan(w, tz)

const QUALITY_LABEL: Record<Quality, string> = { good: 'Supportive', mixed: 'Neutral', caution: 'Caution' }

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

// ── Moon + Tara ──────────────────────────────────────────────

export function MoonCard({ r, tz }: { r: TodayReading; tz: string }) {
  const m = r.moon
  const moonTone: Tone = m.chandraQuality === 'good' ? 'good' : m.chandraQuality === 'bad' ? 'caution' : 'mixed'
  const taraTone: Tone = r.tara.tone === 'supportive' || r.tara.tone === 'transformative' ? 'good' : r.tara.isHard ? 'caution' : 'mixed'
  return (
    <section className={styles.card} aria-label="Your Moon today">
      <h2 className={styles.cardTitle}>Your Moon today</h2>
      <div className={styles.kv} style={toned(moonTone)}>
        <span className={styles.kvKey}>Moon</span>
        <span className={styles.kvVal}>
          <span className={styles.dot} />
          {m.rashiName} · {m.nakshatraName} (pada {m.pada})
        </span>
        <span className={styles.kvNote}>
          {m.chandraNote} Counted from your natal Moon it is the {ordinal(m.chandraPosition)} house; from your Lagna it lights up the {ordinal(m.lagnaHouse)} house of {m.lagnaTheme}.
        </span>
      </div>
      <div className={styles.kv} style={toned(taraTone)}>
        <span className={styles.kvKey}>Tara Bala</span>
        <span className={styles.kvVal}>
          <span className={styles.dot} />
          {r.tara.name} (#{r.tara.taraNumber}) · {r.tara.label}
        </span>
        <span className={styles.kvNote}>{r.tara.advice}{r.tara.trap ? ` Watch for: ${r.tara.trap.toLowerCase()}` : ''}</span>
      </div>
      {m.overNatal.length > 0 && (
        <div className={styles.kv}>
          <span className={styles.kvKey}>Over natal</span>
          <span className={styles.kvVal}>{m.overNatal.map(id => GRAHA_NAMES[id]).join(', ')}</span>
          <span className={styles.kvNote}>The Moon is crossing the sign of your natal {m.overNatal.map(id => GRAHA_NAMES[id]).join(' and ')}, so those themes feel closer today.</span>
        </div>
      )}
      {m.signChange && (
        <div className={styles.kv} style={toned(m.signChange.toChandraQuality === 'good' ? 'good' : m.signChange.toChandraQuality === 'bad' ? 'caution' : 'mixed')}>
          <span className={styles.kvKey}>Next shift</span>
          <span className={styles.kvVal}>
            <span className={styles.dot} />
            ~{fmtWhen(m.signChange.atIso, tz)} · Moon enters {m.signChange.toRashiName}
          </span>
          <span className={styles.kvNote}>
            It becomes the {ordinal(m.signChange.toChandraPosition)} from your Moon
            ({m.signChange.toChandraQuality === 'good' ? 'supportive' : m.signChange.toChandraQuality === 'bad' ? 'demanding' : 'neutral'}). Time is approximate (±15 min).
          </span>
        </div>
      )}
    </section>
  )
}

// ── Panchang ─────────────────────────────────────────────────

export function PanchangCard({ r }: { r: TodayReading }) {
  return (
    <section className={styles.card} aria-label="Panchang for today">
      <h2 className={styles.cardTitle}>Panchang, read for you</h2>
      {r.panchang.map(it => (
        <div key={it.key} className={styles.kv} style={toned(it.quality)}>
          <span className={styles.kvKey}>{it.label}</span>
          <span className={styles.kvVal}>
            <span className={styles.dot} />
            {it.value}
            <span className={styles.badge}>{QUALITY_LABEL[it.quality]}</span>
          </span>
          <span className={styles.kvNote}>{it.note}</span>
        </div>
      ))}
    </section>
  )
}

// ── Life areas ───────────────────────────────────────────────

export function AreasCard({ r }: { r: TodayReading }) {
  return (
    <section className={styles.card} aria-label="Life areas today">
      <h2 className={styles.cardTitle}>Life areas today</h2>
      {r.areas.map(a => {
        const tone = scoreTone(a.score)
        return (
          <div key={a.id} className={styles.areaRow} style={toned(tone)}>
            <span className={styles.areaName}>{a.label}</span>
            <div className={styles.areaBar} role="img" aria-label={`${a.label}: ${a.score} out of 100, ${a.verdict}`}>
              <div className={styles.areaFill} style={{ width: `${a.score}%` }} />
            </div>
            <span className={styles.areaScore}>{a.score}</span>
            {a.drivers.length > 0 && <span className={styles.areaWhy}>{a.verdict}: {a.drivers.join('; ')}.</span>}
          </div>
        )
      })}
      <p className={styles.note}>
        Scores combine today&apos;s Moon, Tara/Chandra Bala, panchang, and the gochar of the planets that rule each area. They are relative, not absolute.
      </p>
    </section>
  )
}

// ── Windows ──────────────────────────────────────────────────

export function WindowsCard({ r, tz }: { r: TodayReading; tz: string }) {
  const { good, avoid, horas, currentHora } = r.windows
  const row = (w: TimedWindow, tone: Tone) => (
    <div key={`${w.label}-${w.startIso}`} className={styles.windowRow} style={toned(tone)}>
      <span className={styles.windowName}>
        {w.label}
        {w.current && <span className={styles.nowTag}>now</span>}
        {w.note && <span className={styles.windowNote}>{w.note}</span>}
      </span>
      <span className={styles.windowTime}>{span(w, tz)}</span>
    </div>
  )
  return (
    <section className={styles.card} aria-label="Timing windows">
      <h2 className={styles.cardTitle}>Timing today</h2>
      {currentHora && (
        <p className={styles.note}>
          Now: <strong style={{ color: 'var(--text-primary)' }}>{currentHora.label}</strong>
          {currentHora.note ? ` — ${currentHora.note}` : ''} (until {fmtTime(currentHora.endIso, tz)})
        </p>
      )}
      {good.length > 0 ? good.map(w => row(w, 'good')) : <p className={styles.note}>No clean auspicious window is left today; keep to routine work.</p>}
      {horas.length > 0 && (
        <>
          <h3 className={styles.cardTitle} style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>Horas that suit your chart</h3>
          {horas.map(w => row(w, 'good'))}
        </>
      )}
      {avoid.length > 0 && (
        <>
          <h3 className={styles.cardTitle} style={{ marginTop: '0.4rem', color: 'var(--rose)' }}>Avoid starting things</h3>
          {avoid.map(w => row(w, 'caution'))}
        </>
      )}
    </section>
  )
}

// ── Do / Avoid / Why ─────────────────────────────────────────

export function DoAvoidCards({ r }: { r: TodayReading }) {
  return (
    <div className={styles.grid2}>
      <section className={styles.card} style={toned('good')} aria-label="Do today">
        <h2 className={styles.cardTitle} style={{ color: 'var(--teal)' }}>Lean into</h2>
        <ul className={styles.list}>{r.doList.map(t => <li key={t}>{t}</li>)}</ul>
      </section>
      <section className={styles.card} style={toned('caution')} aria-label="Avoid today">
        <h2 className={styles.cardTitle} style={{ color: 'var(--rose)' }}>Go easy on</h2>
        <ul className={styles.list}>{r.avoidList.map(t => <li key={t}>{t}</li>)}</ul>
      </section>
    </div>
  )
}

export function FactorsCard({ r }: { r: TodayReading }) {
  if (r.supportive.length === 0 && r.caution.length === 0) return null
  return (
    <div className={styles.grid2}>
      <section className={styles.card} aria-label="Supportive factors">
        <h2 className={styles.cardTitle} style={{ color: 'var(--teal)' }}>What is helping</h2>
        {r.supportive.length > 0
          ? <ul className={styles.list}>{r.supportive.map(t => <li key={t}>{t}</li>)}</ul>
          : <p className={styles.note}>No strong supportive factors stand out today.</p>}
      </section>
      <section className={styles.card} aria-label="Caution factors">
        <h2 className={styles.cardTitle} style={{ color: 'var(--rose)' }}>What is weighing</h2>
        {r.caution.length > 0
          ? <ul className={styles.list}>{r.caution.map(t => <li key={t}>{t}</li>)}</ul>
          : <p className={styles.note}>Nothing significant is pressing today.</p>}
      </section>
    </div>
  )
}

// ── Remedy ───────────────────────────────────────────────────

export function RemedyCard({ r }: { r: TodayReading }) {
  const v = r.remedy.vara
  return (
    <section className={styles.card} aria-label="Remedy of the day">
      <h2 className={styles.cardTitle}>Anchor for the day</h2>
      <div className={styles.kv}>
        <span className={styles.kvKey}>{v.name} day</span>
        <span className={styles.kvVal}>{v.remedy.mantra}</span>
        <span className={styles.kvNote}>
          Colour {v.remedy.color.toLowerCase()} · charity: {v.remedy.charity.toLowerCase()}.
        </span>
      </div>
      {r.remedy.extra.map(e => (
        <div key={e.reason} className={styles.kv}>
          <span className={styles.kvKey}>{e.name}</span>
          <span className={styles.kvVal}>{e.remedy.mantra}</span>
          <span className={styles.kvNote}>{e.reason}. {e.remedy.day}s are best for it; charity: {e.remedy.charity.toLowerCase()}.</span>
        </div>
      ))}
      <p className={styles.note}>Simple devotional practices only. Gemstones need a full chart review first.</p>
    </section>
  )
}

// ── Dasha / gochar / triggers (collapsible) ──────────────────

const STATUS_TONE: Record<'favourable' | 'vedha' | 'unfavourable', Tone> = {
  favourable: 'good', vedha: 'mixed', unfavourable: 'caution',
}

/** Transit detail behind the reading: gochar from the Moon, Saturn phase and natal contacts. */
export function TransitsPanel({ r }: { r: TodayReading }) {
  return (
    <div className={styles.panelBody}>
      <h3 className={styles.cardTitle}>Gochar from your Moon</h3>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr><th>Graha</th><th>Sign</th><th>Moon</th><th>Lagna</th><th>Read</th></tr>
          </thead>
          <tbody>
            {r.gochar.map(g => (
              <tr key={g.planet}>
                <td>{g.planetName}{g.isRetro ? ' ℞' : ''}</td>
                <td>{g.rashiName}</td>
                <td className={styles.mono}>{g.fromMoon}</td>
                <td className={styles.mono}>{g.fromLagna}</td>
                <td style={toned(STATUS_TONE[g.status])}>
                  <span className={styles.badge}>{g.status}</span>
                  <span className={styles.windowNote}>{g.note}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>{r.saturn.note}</p>

      <h3 className={styles.cardTitle} style={{ marginTop: '0.4rem' }}>Transit contacts to your birth chart</h3>
      {r.triggers.length > 0
        ? <ul className={styles.list}>{r.triggers.map(t => <li key={`${t.transit}-${t.natal}-${t.aspect}`}>{t.text}</li>)}</ul>
        : <p className={styles.note}>No close conjunctions or oppositions to your natal planets today.</p>}

      <p className={styles.note}>
        Gochar uses the classical Parashari tables (favourable houses from the natal Moon, with Vedha). Transits colour the day; your dasha and natal promise decide what can actually manifest.
      </p>
    </div>
  )
}
