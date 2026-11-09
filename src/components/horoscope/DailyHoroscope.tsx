'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/horoscope/DailyHoroscope.tsx
//  General daily horoscope (Dainik Rashifal) by Moon sign — no
//  birth chart. Parchment chakra + manuscript card.
//  Used on the landing page and /horoscope/[sign].
// ─────────────────────────────────────────────────────────────

import { Link, useRouter } from '@/i18n/navigation'
import { useLang } from '@/i18n/useLang'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { ArrowRight, Share2 } from 'lucide-react'
import type {
  DailyHoroscopeReport,
  HoroscopeTone,
  RashiHoroscope,
} from '@/lib/engine/dailyRashiHoroscope'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'
import type { Rashi } from '@/types/astrology'
import { RashiGlyph, RashiIcon } from './RashiIcon'
import styles from './DailyHoroscope.module.css'

const STORAGE_KEY = 'vedaansh:horoscope-sign'

const PLANET_GLYPHS: Record<string, string> = {
  Su: '☉', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}
const COLOR_SWATCH: Record<string, string> = {
  Saffron: '#f4a03a', 'Pearl white': '#efe9dc', 'Coral red': '#e0604e', 'Emerald green': '#2f9e6b',
  'Turmeric yellow': '#e6b422', 'Diamond white': '#f4f1ea', 'Indigo blue': '#3f4fc4', 'Smoky grey': '#8a8f9c', 'Ash brown': '#9c7b62',
}

type HoroscopeCopy = ReturnType<typeof useTranslations<'horoscope'>>

// ── Helpers ──────────────────────────────────────────────────

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function fmtDate(date: string, tag: string): string {
  return new Intl.DateTimeFormat(tag, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}

function fmtTime(iso: string, tag: string): string {
  return new Intl.DateTimeFormat(tag, {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
  }).format(new Date(iso))
}

function ordinalHouse(t: HoroscopeCopy, house: number): string {
  return t(`ordinal.${house}` as 'ordinal.1')
}

function toneLabel(t: HoroscopeCopy, tone: HoroscopeTone): string {
  return t(`tone.${tone}`)
}

function planetName(t: HoroscopeCopy, id: string): string {
  return t(`planets.${id}` as 'planets.Su')
}

function readStoredSign(): Rashi | null {
  try {
    const n = Number(window.localStorage.getItem(STORAGE_KEY))
    return n >= 1 && n <= 12 ? (n as Rashi) : null
  } catch {
    return null
  }
}

function storeSign(r: Rashi) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(r))
  } catch {
    /* storage blocked — selection still works for this view */
  }
}

// ── Chakra geometry (degrees clockwise from 12 o'clock, Mesha centred at the top) ──

const C = 200
const R_OUT = 190
const R_IN = 122
const R_TONE = 112
const R_SCORE = 92
const round = (n: number) => Math.round(n * 100) / 100

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: round(C + r * Math.sin(rad)), y: round(C - r * Math.cos(rad)) }
}

function sector(r1: number, r2: number, a0: number, a1: number) {
  const p1 = polar(r2, a0)
  const p2 = polar(r2, a1)
  const p3 = polar(r1, a1)
  const p4 = polar(r1, a0)
  return `M${p1.x} ${p1.y}A${r2} ${r2} 0 0 1 ${p2.x} ${p2.y}L${p3.x} ${p3.y}A${r1} ${r1} 0 0 0 ${p4.x} ${p4.y}Z`
}

function arc(r: number, a0: number, a1: number) {
  const p1 = polar(r, a0)
  const p2 = polar(r, a1)
  return `M${p1.x} ${p1.y}A${r} ${r} 0 0 1 ${p2.x} ${p2.y}`
}

function Chakra({
  report,
  selected,
  onSelect,
  t,
}: {
  report: DailyHoroscopeReport
  selected: RashiHoroscope
  onSelect: (r: Rashi) => void
  t: HoroscopeCopy
}) {
  const circ = 2 * Math.PI * R_SCORE
  // Mesha spans -15°..15°; the sidereal Moon is drawn on that same frame.
  const moon = polar(R_OUT, report.moonLongitude - 15)

  const onKey = (e: KeyboardEvent, r: Rashi) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(r)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      onSelect(((r % 12) + 1) as Rashi)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      onSelect((((r + 10) % 12) + 1) as Rashi)
    }
  }

  return (
    <svg className={styles.chakra} viewBox="0 0 400 400" role="radiogroup" aria-label={t('aria.chakra')}>
      <defs>
        <radialGradient id="hz-disc" cx="50%" cy="42%" r="60%">
          <stop offset="0%" className={styles.discHi} />
          <stop offset="100%" className={styles.discLo} />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={R_OUT + 6} className={styles.rimOuter} />
      <circle cx={C} cy={C} r={R_OUT} className={styles.rim} />

      {report.signs.map((s) => {
        const mid = (s.rashi - 1) * 30
        const active = s.rashi === selected.rashi
        // Labels stack vertically at the segment centre so wide Devanagari never collides at 3/9 o'clock.
        const at = polar(156, mid)
        return (
          <g
            key={s.rashi}
            role="radio"
            aria-checked={active}
            aria-label={t('aria.chakraSign', {
              sanskrit: s.sanskrit,
              english: s.english,
              tone: toneLabel(t, s.tone),
              score: s.score,
            })}
            tabIndex={active ? 0 : -1}
            className={`${styles.seg} ${active ? styles.segActive : ''}`}
            onClick={() => onSelect(s.rashi)}
            onKeyDown={(e) => onKey(e, s.rashi)}
          >
            <path d={sector(R_IN, R_OUT, mid - 15, mid + 15)} className={styles.segFill} />
            <RashiGlyph rashi={s.rashi} cx={at.x} cy={at.y - 8} size={28} className={styles.segIcon} />
            <text x={at.x} y={at.y + 17} className={styles.segDeva}>{s.devanagari}</text>
          </g>
        )
      })}

      {Array.from({ length: 12 }, (_, i) => {
        const a = polar(R_IN, i * 30 + 15)
        const b = polar(R_OUT, i * 30 + 15)
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={styles.spoke} />
      })}
      <circle cx={C} cy={C} r={R_IN} className={styles.rim} />

      {report.signs.map((s) => {
        const mid = (s.rashi - 1) * 30
        return (
          <path
            key={s.rashi}
            d={arc(R_TONE, mid - 11, mid + 11)}
            className={styles.toneArc}
            data-tone={s.tone}
          />
        )
      })}

      <circle cx={C} cy={C} r={R_TONE - 8} fill="url(#hz-disc)" className={styles.disc} />
      <circle cx={C} cy={C} r={R_SCORE} className={styles.scoreTrack} />
      <circle
        cx={C}
        cy={C}
        r={R_SCORE}
        className={styles.scoreArc}
        data-tone={selected.tone}
        strokeDasharray={`${(selected.score / 100) * circ} ${circ}`}
        transform={`rotate(-90 ${C} ${C})`}
      />
      <RashiGlyph rashi={selected.rashi} cx={C} cy={140} size={40} className={styles.hubIcon} />
      <text x={C} y={184} className={styles.hubDeva}>{selected.devanagari}</text>
      <text x={C} y={204} className={styles.hubEn}>
        {`${selected.sanskrit} · ${selected.english}`.toUpperCase()}
      </text>
      <text x={C} y={240} className={styles.hubScore} data-tone={selected.tone}>
        {selected.score}
        <tspan className={styles.hubOf}>{t('card.scoreOf')}</tspan>
      </text>
      <text x={C} y={258} className={styles.hubTone} data-tone={selected.tone}>
        {toneLabel(t, selected.tone).toUpperCase()}
      </text>

      <g className={styles.moonMark} aria-hidden>
        <title>{t('aria.moonToday', { nakshatra: report.moonNakshatra.name })}</title>
        <circle cx={moon.x} cy={moon.y} r={7} />
      </g>
    </svg>
  )
}

function Diamonds({ rating, tone, t }: { rating: number; tone: HoroscopeTone; t: HoroscopeCopy }) {
  return (
    <span className={styles.diamonds} data-tone={tone} aria-label={t('aria.diamonds', { rating })}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? styles.dOn : styles.dOff} aria-hidden>
          {i < rating ? '◆' : '◇'}
        </span>
      ))}
    </span>
  )
}

function Card({
  sign,
  date,
  place,
  detailed,
  tag,
  lang,
  t,
}: {
  sign: RashiHoroscope
  date: string
  place: string
  detailed: boolean
  tag: string
  lang: string
  t: HoroscopeCopy
}) {
  const [first, ...rest] = sign.summary
  return (
    <article className={styles.card} key={`${date}-${sign.rashi}`} aria-live="polite">
      <span className={styles.cornerTl} aria-hidden />
      <span className={styles.cornerBr} aria-hidden />
      <p className={styles.kicker}>
        {t('card.kicker', { sanskrit: sign.sanskrit, english: sign.english })}
      </p>
      <h3 className={styles.headline}>{sign.headline}</h3>
      <p className={styles.meta}>
        {t('card.meta', {
          date: fmtDate(date, tag),
          element: sign.element,
          lord: planetName(t, sign.lord),
        })}
      </p>
      <div className={styles.ornament} aria-hidden>
        <span />◈<span />
      </div>

      <p className={styles.lede}>
        <span className={styles.dropCap}>{first}</span>
        {rest.join('')}
      </p>
      {sign.moon.later ? (
        <p className={styles.later}>
          {t('card.later', {
            time: fmtTime(sign.moon.later.at, tag),
            house: ordinalHouse(t, sign.moon.later.house),
            theme: sign.moon.later.theme,
          })}
        </p>
      ) : null}

      <h4 className={styles.label}>
        {t('card.phala')} <em>{t('card.phalaEm')}</em>
      </h4>
      <ul className={styles.phala}>
        {sign.areas.map((a) => (
          <li key={a.id} title={a.text}>
            <span className={styles.phalaName}>
              {a.label} <em>{a.sanskrit}</em>
            </span>
            <span className={styles.leader} aria-hidden />
            <Diamonds rating={a.rating} tone={a.tone} t={t} />
          </li>
        ))}
      </ul>

      <dl className={styles.shubh}>
        <div>
          <dt>{t('card.shubhRang')}</dt>
          <dd>
            <span className={styles.swatch} style={{ background: COLOR_SWATCH[sign.lucky.color] ?? 'var(--gold)' }} aria-hidden />
            {sign.lucky.color}
          </dd>
        </div>
        <div>
          <dt>{t('card.shubhAnk')}</dt>
          <dd className={styles.ank}>{sign.lucky.number}</dd>
        </div>
        <div>
          <dt>{t('card.disha')}</dt>
          <dd>{sign.lucky.direction}</dd>
        </div>
      </dl>

      {sign.shubhSamay?.length ? (
        <div className={styles.samay}>
          <h4 className={styles.label}>
            {t('card.shubhSamay')} <em>{t('card.shubhSamayEm', { place })}</em>
          </h4>
          <ul>
            {sign.shubhSamay.map((w) => (
              <li key={w.start}>
                <span className={styles.samayTime}>
                  {fmtTime(w.start, tag)} – {fmtTime(w.end, tag)}
                </span>
                <span className={styles.samayLord}>
                  {t('card.horaLine', { glyph: PLANET_GLYPHS[w.lord], planet: planetName(t, w.lord) })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.kv}>
        <div>
          <h4 className={styles.label}>
            {t('card.karya')} <em>{t('card.karyaEm')}</em>
          </h4>
          <ul>{sign.karya.map((k) => <li key={k}>{k}</li>)}</ul>
        </div>
        <div>
          <h4 className={`${styles.label} ${styles.labelCare}`}>
            {t('card.varjya')} <em>{t('card.varjyaEm')}</em>
          </h4>
          <ul>{sign.varjya.map((k) => <li key={k}>{k}</li>)}</ul>
        </div>
      </div>

      <p className={styles.upaya}>
        <span className={styles.upayaMark} aria-hidden>ॐ</span>
        <span>
          <strong>{t('card.upaya')}</strong>
          {sign.remedy}
        </span>
      </p>

      {detailed && (
        <>
          <h4 className={styles.label}>
            {t('card.gochara')} <em>{t('card.gocharaEm')}</em>
          </h4>
          <ul className={styles.gochara}>
            {sign.transits.map((tr) => (
              <li key={tr.planet} data-status={tr.status}>
                <span className={styles.gGlyph} aria-hidden>{PLANET_GLYPHS[tr.planet]}</span>
                <span>
                  <strong>
                    {t('card.gocharaLine', {
                      planet: planetName(t, tr.planet),
                      retro: tr.retro ? t('card.retrograde') : '',
                      house: ordinalHouse(t, tr.house),
                    })}
                  </strong>{' '}
                  {lang === 'en' ? tr.note.replace(/^\S+ in your \S+ /, '') : tr.note}
                </span>
              </li>
            ))}
          </ul>
          <h4 className={styles.label}>
            {t('card.dirgha')} <em>{t('card.dirghaEm')}</em>
          </h4>
          <ul className={styles.plain}>{sign.longTerm.map((l) => <li key={l}>{l}</li>)}</ul>
          {sign.cautions.length > 0 && (
            <>
              <h4 className={`${styles.label} ${styles.labelCare}`}>
                {t('card.savdhani')} <em>{t('card.savdhaniEm')}</em>
              </h4>
              <ul className={styles.plain}>{sign.cautions.map((l) => <li key={l}>{l}</li>)}</ul>
            </>
          )}
        </>
      )}
    </article>
  )
}

/** Rashi taalika — all twelve signs today as a score ribbon. */
function Taalika({
  report,
  selected,
  onSelect,
  t,
}: {
  report: DailyHoroscopeReport
  selected: Rashi
  onSelect: (r: Rashi) => void
  t: HoroscopeCopy
}) {
  // The sign whose 8th house the Moon occupies today.
  const chandrashtama = (((report.moonRashi + 4) % 12) + 1) as Rashi
  const best = [...report.signs].sort((a, b) => b.score - a.score)[0].rashi
  const ch = report.signs[chandrashtama - 1]
  const top = report.signs[best - 1]
  return (
    <div className={styles.taalika}>
      <h4 className={styles.label}>
        {t('taalika.title')} <em>{t('taalika.titleEm')}</em>
      </h4>
      <ol className={styles.bars}>
        {report.signs.map((s) => (
          <li key={s.rashi}>
            <button
              type="button"
              className={`${styles.bar} ${s.rashi === selected ? styles.barActive : ''}`}
              data-tone={s.tone}
              data-care={s.rashi === chandrashtama || undefined}
              aria-pressed={s.rashi === selected}
              aria-label={t('aria.taalikaBar', {
                sanskrit: s.sanskrit,
                english: s.english,
                score: s.score,
                chandrashtama: s.rashi === chandrashtama ? t('aria.chandrashtamaSuffix') : '',
              })}
              onClick={() => onSelect(s.rashi)}
            >
              <span className={styles.barScore}>
                {s.rashi === best ? <span className={styles.barStar} aria-hidden>★</span> : null}
                {s.score}
              </span>
              <span className={styles.barTrack} aria-hidden>
                <span style={{ height: `${s.score}%` }} />
              </span>
              <RashiIcon rashi={s.rashi} size={22} className={styles.barIcon} />
              <span className={styles.barName}>{s.devanagari}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className={styles.taalikaNote}>
        <span>
          <b className={styles.noteStar}>★</b> {t('taalika.strongest', { sanskrit: top.sanskrit, score: top.score })}
        </span>
        <span>
          <b className={styles.noteCare}>◆</b> {t('taalika.chandrashtama', { sanskrit: ch.sanskrit })}
        </span>
      </p>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────

export interface DailyHoroscopeProps {
  /** Server-provided report for today (page variant); landing fetches its own. */
  initialReport?: DailyHoroscopeReport | null
  /** Page variant: the sign in the URL. */
  sign?: Rashi
  variant?: 'landing' | 'page'
  onNavigate?: (cta: string) => void
  /** Landing: opens the birth-details form. Page variant links home instead. */
  onFindMoonSign?: () => void
}

type Day = 'today' | 'tomorrow'

export function DailyHoroscope({
  initialReport = null,
  sign,
  variant = 'landing',
  onNavigate,
  onFindMoonSign,
}: DailyHoroscopeProps) {
  const router = useRouter()
  const t = useTranslations('horoscope')
  const { lang, tag } = useLang()
  const isPage = variant === 'page'
  const [reports, setReports] = useState<Partial<Record<Day, DailyHoroscopeReport>>>(
    initialReport ? { today: initialReport } : {},
  )
  const [day, setDay] = useState<Day>('today')
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState<Rashi | null>(sign ?? null)
  const [shared, setShared] = useState(false)

  const load = useCallback(async (which: Day, date?: string, signal?: AbortSignal) => {
    const qs = new URLSearchParams()
    if (date) qs.set('date', date)
    qs.set('lang', lang)
    const res = await fetch(`/api/horoscope/daily?${qs}`, { signal })
    const json = (await res.json()) as { success: boolean; data?: DailyHoroscopeReport }
    if (!json.success || !json.data) throw new Error('horoscope unavailable')
    setReports((prev) => ({ ...prev, [which]: json.data }))
  }, [lang])

  useEffect(() => {
    if (reports.today) return
    const controller = new AbortController()
    load('today', undefined, controller.signal).catch((err: unknown) => {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setFailed(true)
    })
    return () => controller.abort()
  }, [load, reports.today])

  useEffect(() => {
    if (day !== 'tomorrow' || reports.tomorrow || !reports.today) return
    load('tomorrow', addDays(reports.today.date, 1)).catch(() => setDay('today'))
  }, [day, load, reports.today, reports.tomorrow])

  useEffect(() => {
    if (sign) {
      storeSign(sign)
      setSelected(sign)
      return
    }
    if (selected || !reports.today) return
    setSelected(readStoredSign() ?? reports.today.moonRashi)
  }, [sign, reports.today, selected])

  const report = reports[day] ?? (day === 'tomorrow' ? null : reports.today) ?? null
  const current = useMemo(
    () => report?.signs.find((s) => s.rashi === selected) ?? null,
    [report, selected],
  )

  if (failed) return null

  const pick = (r: Rashi) => {
    storeSign(r)
    setSelected(r)
    if (isPage && r !== sign) {
      const slug = report?.signs.find((s) => s.rashi === r)?.slug
      if (slug) router.push(`/horoscope/${slug}`, { scroll: false })
    }
  }

  const share = async () => {
    if (!current) return
    const url = `${window.location.origin}/horoscope/${current.slug}`
    const text = t('toolbar.shareText', {
      english: current.english,
      sanskrit: current.sanskrit,
      headline: current.headline,
    })
    try {
      if (navigator.share) await navigator.share({ title: t('toolbar.shareTitle'), text, url })
      else {
        await navigator.clipboard.writeText(`${text} — ${url}`)
        setShared(true)
        window.setTimeout(() => setShared(false), 2000)
      }
      onNavigate?.('horoscope_share')
    } catch {
      /* user dismissed the share sheet */
    }
  }

  const p = report?.panchang

  return (
    <section className={`${styles.shell} ${isPage ? styles.shellPage : ''}`} aria-label={t('aria.section')}>
      {isPage && current ? (
        <header className={styles.pageHead}>
          <p className={styles.pageKicker}>{t('page.kicker')}</p>
          <h1 className={styles.pageTitle}>
            {t('page.title', { english: current.english })}{' '}
            <span>{t('page.titleRashi', { sanskrit: current.sanskrit })}</span>
          </h1>
        </header>
      ) : !isPage ? (
        <VedicSectionHeader kicker={t('landing.kicker')} title={t('landing.title')} theme="gold" />
      ) : null}
      <p className={styles.intro}>{t('intro')}</p>

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label={t('aria.dayTabs')}>
          {(['today', 'tomorrow'] as Day[]).map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={day === d}
              className={`${styles.tab} ${day === d ? styles.tabActive : ''}`}
              onClick={() => setDay(d)}
            >
              {t(`tabs.${d}`)}
            </button>
          ))}
        </div>
        <span className={styles.readAt}>
          {report ? t('toolbar.readAtSunrise', { date: fmtDate(report.date, tag) }) : t('toolbar.readingSky')}
        </span>
        <button type="button" className={styles.share} onClick={share} disabled={!current}>
          <Share2 size={13} aria-hidden />
          {shared ? t('toolbar.linkCopied') : t('toolbar.share')}
        </button>
      </div>

      {p && report && isPage ? (
        <dl className={styles.strip}>
          <div><dt>{t('strip.vara')}</dt><dd>{p.vara.name}</dd></div>
          <div>
            <dt>{t('strip.tithi')}</dt>
            <dd className={styles.good}>
              {p.tithi.name.includes(' ')
                ? p.tithi.name
                : `${p.tithi.paksha === 'shukla' ? t('strip.pakshaShukla') : t('strip.pakshaKrishna')} ${p.tithi.name}`}
            </dd>
          </div>
          <div>
            <dt>{t('strip.chandra')}</dt>
            <dd>{report.signs[report.moonRashi - 1].english} · {report.moonNakshatra.name}</dd>
          </div>
          <div>
            <dt>{t('strip.yoga')}</dt>
            <dd className={p.yoga.quality === 'inauspicious' ? styles.care : styles.good}>{p.yoga.name}</dd>
          </div>
          <div>
            <dt>{t('strip.karana')}</dt>
            <dd className={p.karana.isBhadra ? styles.care : undefined}>{p.karana.name}</dd>
          </div>
        </dl>
      ) : null}

      {report && current ? (
        <div className={styles.layout}>
          <div className={styles.wheelCol}>
            <Chakra report={report} selected={current} onSelect={pick} t={t} />
            <p className={styles.hint}>
              <em>{t('hint.line1')}</em> <strong>{t('hint.line2')}</strong> <em>{t('hint.line3')}</em>
            </p>
            <div className={styles.wheelActions}>
              {onFindMoonSign ? (
                <button
                  type="button"
                  className={styles.cta}
                  onClick={() => {
                    onNavigate?.('horoscope_find_moon_sign')
                    onFindMoonSign()
                  }}
                >
                  {t('actions.findMoonSign')} <ArrowRight size={14} aria-hidden />
                </button>
              ) : (
                <Link href="/" className={styles.cta} onClick={() => onNavigate?.('horoscope_find_moon_sign')}>
                  {t('actions.findMoonSign')} <ArrowRight size={14} aria-hidden />
                </Link>
              )}
              <Link
                href={isPage ? '#all-signs' : `/horoscope/${current.slug}`}
                className={styles.textLink}
                onClick={() => onNavigate?.('horoscope_full')}
              >
                {isPage ? t('actions.allTwelve') : t('actions.fullReading', { sanskrit: current.sanskrit })}
              </Link>
            </div>
          </div>
          <Card
            sign={current}
            date={report.date}
            place={report.timings?.place ?? t('placeDefault')}
            detailed={isPage}
            tag={tag}
            lang={lang}
            t={t}
          />
        </div>
      ) : (
        <div className={styles.layout} aria-hidden>
          <div className={styles.skeletonWheel} />
          <div className={styles.skeletonCard} />
        </div>
      )}

      {report && current ? <Taalika report={report} selected={current.rashi} onSelect={pick} t={t} /> : null}

      <p className={styles.method}>
        {t('method.lead')}
        <Link href="/today" onClick={() => onNavigate?.('horoscope_personal')}>
          {t('method.personalLink')}
        </Link>
      </p>
    </section>
  )
}
