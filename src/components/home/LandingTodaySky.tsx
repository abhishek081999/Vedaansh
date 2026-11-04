'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingTodaySky.tsx
//  Aaj ka Panchang under the hero — an open manuscript leaf:
//  Moon medallion (tithi ring) · five angas · dinman day arc.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { GRAHA_NAMES, type GrahaId } from '@/types/astrology'
import { getVaarMeta } from '@/lib/engine/vaarMeta'
import { moonLitPath } from '@/lib/panchang/moon-phase'
import { SKY_REFERENCE, type TodaySky } from '@/components/home/LandingCosmicWheel'
import styles from '@/components/home/LandingTodaySky.module.css'

function fmtTime(value: string | number): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: SKY_REFERENCE.tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

type Panchang = NonNullable<TodaySky['panchang']>
type TithiSegment = { start: string; end: string; label: string; sub?: string }

type AngaRow = {
  label: string
  sanskrit: string
  value: string
  /** Secondary line: change time, pada, lord… */
  note?: string
  tone?: 'good' | 'care'
}

const ROUND = (n: number) => Math.round(n * 100) / 100

// ── Moon medallion with the 30-tithi ring ────────────────────

function MoonMedallion({ p }: { p: Panchang }) {
  const r = 30
  const lit = moonLitPath(p.lunarElongationDeg, r)
  const current = p.tithi.number // 1–30
  return (
    <svg className={styles.medallion} viewBox="0 0 140 140" role="img" aria-label={`Moon phase: ${p.tithi.name}`}>
      <defs>
        <radialGradient id="pp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" className={styles.glowIn} />
          <stop offset="100%" className={styles.glowOut} />
        </radialGradient>
      </defs>
      <circle cx="70" cy="70" r="66" className={styles.ringOuter} />
      {Array.from({ length: 30 }, (_, i) => {
        // Tithi 1 starts at the top (new Moon just past), running clockwise.
        const a = ((i + 0.5) / 30) * Math.PI * 2
        const r1 = 54
        const r2 = i + 1 === current ? 63 : i % 5 === 4 ? 61 : 59
        return (
          <line
            key={i}
            x1={ROUND(70 + r1 * Math.sin(a))}
            y1={ROUND(70 - r1 * Math.cos(a))}
            x2={ROUND(70 + r2 * Math.sin(a))}
            y2={ROUND(70 - r2 * Math.cos(a))}
            className={i + 1 === current ? styles.tickNow : i < 15 ? styles.tickShukla : styles.tickKrishna}
          />
        )
      })}
      <circle cx="70" cy="70" r="48" fill="url(#pp-glow)" />
      <g transform="translate(70 70)">
        <circle r={r} className={styles.moonDark} />
        <path d={lit} className={styles.moonLit} />
        <circle r={r} className={styles.moonEdge} />
      </g>
      <text x="70" y="9" className={styles.ringLabel}>अमा</text>
      <text x="70" y="137" className={styles.ringLabel}>पूर्णिमा</text>
    </svg>
  )
}

// ── Dinman: sunrise → sunset arc ─────────────────────────────

const AX = 130
const AY = 112
const AR = 100

function arcPoint(frac: number) {
  const t = Math.PI - Math.PI * Math.min(1, Math.max(0, frac))
  return { x: ROUND(AX + AR * Math.cos(t)), y: ROUND(AY - AR * Math.sin(t)) }
}

function arcPath(f0: number, f1: number) {
  const a = arcPoint(f0)
  const b = arcPoint(f1)
  return `M${a.x} ${a.y}A${AR} ${AR} 0 0 1 ${b.x} ${b.y}`
}

function useNow(stepMs = 60_000): number | null {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), stepMs)
    return () => window.clearInterval(id)
  }, [stepMs])
  return now
}

function DayArc({ p }: { p: Panchang }) {
  const now = useNow()
  const rise = Date.parse(p.sunrise)
  const set = Date.parse(p.sunset)
  const span = set - rise
  const f = (iso: string) => (Date.parse(iso) - rise) / span
  const rahu = [f(p.rahuKalam.start), f(p.rahuKalam.end)] as const
  const abhijit = [f(p.abhijitMuhurta.start), f(p.abhijitMuhurta.end)] as const
  const isDay = now !== null && now >= rise && now <= set
  const sun = isDay ? arcPoint((now - rise) / span) : null
  const hours = Math.floor(span / 3_600_000)
  const mins = Math.round((span % 3_600_000) / 60_000)

  return (
    <figure className={styles.arcFig}>
      <svg className={styles.arc} viewBox="0 0 260 132" role="img" aria-label="Day from sunrise to sunset">
        <line x1="14" y1={AY} x2="246" y2={AY} className={styles.horizon} />
        <path d={arcPath(0, 1)} className={styles.arcTrack} />
        {isDay ? <path d={arcPath(0, (now - rise) / span)} className={styles.arcDone} /> : null}
        <path d={arcPath(rahu[0], rahu[1])} className={styles.arcRahu} />
        <path d={arcPath(abhijit[0], abhijit[1])} className={styles.arcAbhijit} />
        {sun ? (
          <g className={styles.sun} transform={`translate(${sun.x} ${sun.y})`}>
            <circle r="9" className={styles.sunHalo} />
            <circle r="4.6" />
          </g>
        ) : null}
        <text x={AX} y={AY - 30} className={styles.arcCaption}>दिनमान</text>
        <text x={AX} y={AY - 14} className={styles.arcSub}>
          {hours}h {mins}m of daylight
        </text>
        <text x="14" y="128" className={styles.arcEnd} textAnchor="start">↑ {fmtTime(p.sunrise)}</text>
        <text x="246" y="128" className={styles.arcEnd} textAnchor="end">{fmtTime(p.sunset)} ↓</text>
      </svg>
      <figcaption className={styles.legend}>
        <span className={styles.legendRahu}>
          <i aria-hidden /> Rahu Kalam <b>{fmtTime(p.rahuKalam.start)} – {fmtTime(p.rahuKalam.end)}</b>
        </span>
        <span className={styles.legendAbhijit}>
          <i aria-hidden /> Abhijit <b>{fmtTime(p.abhijitMuhurta.start)} – {fmtTime(p.abhijitMuhurta.end)}</b>
          {/* Classical rule: Abhijit muhurta is not taken on Budhavara. */}
          {p.vara.number === 3 ? <em>(not used on Wednesday)</em> : null}
        </span>
      </figcaption>
    </figure>
  )
}

// ── Angas ────────────────────────────────────────────────────

function tithiRow(p: Panchang, segments: TithiSegment[] | undefined): AngaRow {
  const paksha = p.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'
  if (segments && segments.length > 1) {
    const [a, b] = segments
    return {
      label: 'Tithi',
      sanskrit: 'तिथि',
      value: `${a.label} → ${b.label}`,
      note: `${a.sub ?? paksha} · changes ${fmtTime(a.end)}`,
    }
  }
  return { label: 'Tithi', sanskrit: 'तिथि', value: p.tithi.name, note: `${paksha} paksha` }
}

type LandingTodaySkyProps = {
  sky: TodaySky | null
  failed: boolean
  onNavigate: () => void
}

export function LandingTodaySky({ sky, failed, onNavigate }: LandingTodaySkyProps) {
  if (failed) return null

  const p = sky?.panchang
  const hora = sky && sky.horaIndex >= 0 ? p?.horaTable[sky.horaIndex] : undefined
  const horaLord = hora ? (GRAHA_NAMES[hora.lord as GrahaId] ?? hora.lord) : null
  const cal = p?.calendarContext
  const vaar = p ? getVaarMeta(p.vara.number) : null

  const angas: AngaRow[] = p
    ? [
        tithiRow(p, p.timeline?.tithi),
        { label: 'Nakshatra', sanskrit: 'नक्षत्र', value: p.nakshatra.name, note: `Pada ${p.nakshatra.pada}` },
        { label: 'Yoga', sanskrit: 'योग', value: p.yoga.name },
        {
          label: 'Karana',
          sanskrit: 'करण',
          value: p.karana.name,
          note: p.karana.name === 'Vishti' ? 'Bhadra — avoid new starts' : undefined,
          tone: p.karana.name === 'Vishti' ? 'care' : undefined,
        },
        {
          label: 'Vara',
          sanskrit: 'वार',
          value: vaar?.name ?? p.vara.sanskrit,
          note: [vaar ? `${vaar.lordName} day` : null, horaLord ? `${horaLord} hora now` : null]
            .filter(Boolean)
            .join(' · '),
        },
      ]
    : []

  return (
    <section className={styles.leaf} aria-label="Today's panchang" aria-busy={!p}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>
          <span aria-hidden>❖</span> Aaj ka Panchang <span aria-hidden>❖</span>
        </p>
        <div className={styles.headMeta}>
          <span className={styles.place}>
            <MapPin size={13} aria-hidden /> {SKY_REFERENCE.label}
          </span>
          {p ? (
            <span className={styles.signs}>
              Surya in {p.sunRashi.sa} · Chandra in {p.moonRashi.sa}
            </span>
          ) : null}
          <Link href="/panchang" className={styles.link} onClick={onNavigate}>
            Panchang for your city <ArrowRight size={13} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </header>

      {p ? (
        <div className={styles.body}>
          <div className={styles.moonCol}>
            <MoonMedallion p={p} />
            <h3 className={styles.vara}>{p.vara.sanskrit}</h3>
            {cal ? (
              <p className={styles.calendar}>
                {cal.sauraMasa} · {cal.rituSa} ritu
                <br />
                {cal.ayanaSa} · {cal.samvatsara} samvatsara
              </p>
            ) : null}
          </div>

          <dl className={styles.angas}>
            {angas.map((a) => (
              <div key={a.label} className={styles.anga} data-tone={a.tone}>
                <dt>
                  <span className={styles.angaSa}>{a.sanskrit}</span>
                  <span className={styles.angaEn}>{a.label}</span>
                </dt>
                <span className={styles.leader} aria-hidden />
                <dd>
                  <strong>{a.value}</strong>
                  {a.note ? <span>{a.note}</span> : null}
                </dd>
              </div>
            ))}
          </dl>

          <DayArc p={p} />
        </div>
      ) : (
        <div className={styles.body} aria-hidden>
          <div className={`${styles.skeleton} ${styles.skeletonRound}`} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      )}
    </section>
  )
}
