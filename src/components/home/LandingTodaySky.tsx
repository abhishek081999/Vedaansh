'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingTodaySky.tsx
//  Aaj ka Panchang under the hero — an open manuscript leaf:
//  Moon medallion (tithi ring) · five angas · dinman day arc.
// ─────────────────────────────────────────────────────────────

import { Link } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { masaHi, samvatsaraHi, termHi, VAAR_HI } from '@/i18n/jyotish'
import { ArrowRight, MapPin } from 'lucide-react'
import { GRAHA_NAMES, type GrahaId } from '@/types/astrology'
import { getVaarMeta } from '@/lib/engine/vaarMeta'
import { moonLitPath } from '@/lib/panchang/moon-phase'
import { SKY_REFERENCE, type TodaySky } from '@/components/home/LandingCosmicWheel'
import styles from '@/components/home/LandingTodaySky.module.css'

function fmtTime(value: string | number, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    timeZone: SKY_REFERENCE.tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

type Panchang = NonNullable<TodaySky['panchang']>
type TithiSegment = { start: string; end: string; label: string; sub?: string }

type AngaRow = {
  /** Key under home.todaySky.angas */
  id: 'tithi' | 'nakshatra' | 'yoga' | 'karana' | 'vara'
  sanskrit: string
  value: string
  /** Secondary line: change time, pada, lord… */
  note?: string
  tone?: 'good' | 'care'
}

const ROUND = (n: number) => Math.round(n * 100) / 100

// ── Moon medallion with the 30-tithi ring ────────────────────

type T = ReturnType<typeof useTranslations<'home.todaySky'>>
/** Engine names (romanised) in the page language. */
type Name = (en: string) => string

function MoonMedallion({ p, t, name }: { p: Panchang; t: T; name: Name }) {
  const r = 30
  const lit = moonLitPath(p.lunarElongationDeg, r)
  const current = p.tithi.number // 1–30
  return (
    <svg className={styles.medallion} viewBox="0 0 140 140" role="img" aria-label={t('moonPhase', { tithi: name(p.tithi.name) })}>
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

function DayArc({ p, t, locale }: { p: Panchang; t: T; locale: string }) {
  const now = useNow()
  const fmt = (v: string) => fmtTime(v, locale)
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
      <svg className={styles.arc} viewBox="0 0 260 132" role="img" aria-label={t('dayAria')}>
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
          {t('daylight', { hours, mins })}
        </text>
        <text x="14" y="128" className={styles.arcEnd} textAnchor="start">↑ {fmt(p.sunrise)}</text>
        <text x="246" y="128" className={styles.arcEnd} textAnchor="end">{fmt(p.sunset)} ↓</text>
      </svg>
      <figcaption className={styles.legend}>
        <span className={styles.legendRahu}>
          <i aria-hidden /> {t('rahuKalam')} <b>{fmt(p.rahuKalam.start)} – {fmt(p.rahuKalam.end)}</b>
        </span>
        <span className={styles.legendAbhijit}>
          <i aria-hidden /> {t('abhijit')} <b>{fmt(p.abhijitMuhurta.start)} – {fmt(p.abhijitMuhurta.end)}</b>
          {/* Classical rule: Abhijit muhurta is not taken on Budhavara. */}
          {p.vara.number === 3 ? <em>{t('abhijitWednesday')}</em> : null}
        </span>
      </figcaption>
    </figure>
  )
}

// ── Angas ────────────────────────────────────────────────────

function tithiRow(
  p: Panchang,
  segments: TithiSegment[] | undefined,
  t: T,
  name: Name,
  locale: string,
): AngaRow {
  const paksha = p.tithi.paksha === 'shukla' ? t('shukla') : t('krishna')
  if (segments && segments.length > 1) {
    const [a, b] = segments
    return {
      id: 'tithi',
      sanskrit: 'तिथि',
      value: `${name(a.label)} → ${name(b.label)}`,
      note: t('tithiChanges', { paksha: a.sub ? name(a.sub) : paksha, time: fmtTime(a.end, locale) }),
    }
  }
  return { id: 'tithi', sanskrit: 'तिथि', value: name(p.tithi.name), note: t('paksha', { paksha }) }
}

type LandingTodaySkyProps = {
  sky: TodaySky | null
  failed: boolean
  onNavigate: () => void
}

export function LandingTodaySky({ sky, failed, onNavigate }: LandingTodaySkyProps) {
  const t = useTranslations('home.todaySky')
  const locale = useLocale()
  const isHi = locale === 'hi'
  const name: Name = (en) => (isHi ? termHi(en) : en)
  if (failed) return null

  const p = sky?.panchang
  const hora = sky && sky.horaIndex >= 0 ? p?.horaTable[sky.horaIndex] : undefined
  const horaLord = hora ? name(GRAHA_NAMES[hora.lord as GrahaId] ?? hora.lord) : null
  const cal = p?.calendarContext
  const vaar = p ? getVaarMeta(p.vara.number) : null

  const angas: AngaRow[] = p
    ? [
        tithiRow(p, p.timeline?.tithi, t, name, locale),
        { id: 'nakshatra', sanskrit: 'नक्षत्र', value: name(p.nakshatra.name), note: t('pada', { pada: p.nakshatra.pada }) },
        { id: 'yoga', sanskrit: 'योग', value: name(p.yoga.name) },
        {
          id: 'karana',
          sanskrit: 'करण',
          value: name(p.karana.name),
          note: p.karana.name === 'Vishti' ? t('bhadra') : undefined,
          tone: p.karana.name === 'Vishti' ? 'care' : undefined,
        },
        {
          id: 'vara',
          sanskrit: 'वार',
          value: isHi ? VAAR_HI[p.vara.number] ?? p.vara.sanskrit : vaar?.name ?? p.vara.sanskrit,
          note: [vaar ? t('lordDay', { lord: name(vaar.lordName) }) : null, horaLord ? t('horaNow', { lord: horaLord }) : null]
            .filter(Boolean)
            .join(' · '),
        },
      ]
    : []

  return (
    <section className={styles.leaf} aria-label={t('ariaLabel')} aria-busy={!p}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>
          <span aria-hidden>❖</span> {t('eyebrow')} <span aria-hidden>❖</span>
        </p>
        <div className={styles.headMeta}>
          <span className={styles.place}>
            <MapPin size={13} aria-hidden /> {t('place')}
          </span>
          {p ? (
            <span className={styles.signs}>
              {t('signs', { sun: name(p.sunRashi.sa), moon: name(p.moonRashi.sa) })}
            </span>
          ) : null}
          <Link href="/panchang" className={styles.link} onClick={onNavigate}>
            {t('cityLink')} <ArrowRight size={13} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </header>

      {p ? (
        <div className={styles.body}>
          <div className={styles.moonCol}>
            <MoonMedallion p={p} t={t} name={name} />
            <h3 className={styles.vara}>{isHi ? VAAR_HI[p.vara.number] ?? p.vara.sanskrit : p.vara.sanskrit}</h3>
            {cal ? (
              <p className={styles.calendar}>
                {t('calendarLine1', { masa: isHi ? masaHi(cal.sauraMasa) : cal.sauraMasa, ritu: name(cal.rituSa) })}
                <br />
                {t('calendarLine2', { ayana: name(cal.ayanaSa), samvatsara: isHi ? samvatsaraHi(cal.samvatsara) : cal.samvatsara })}
              </p>
            ) : null}
          </div>

          <dl className={styles.angas}>
            {angas.map((a) => (
              <div key={a.id} className={styles.anga} data-tone={a.tone}>
                <dt>
                  <span className={styles.angaSa}>{a.sanskrit}</span>
                  {isHi ? null : <span className={styles.angaEn}>{t(`angas.${a.id}`)}</span>}
                </dt>
                <span className={styles.leader} aria-hidden />
                <dd>
                  <strong>{a.value}</strong>
                  {a.note ? <span>{a.note}</span> : null}
                </dd>
              </div>
            ))}
          </dl>

          <DayArc p={p} t={t} locale={locale} />
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
