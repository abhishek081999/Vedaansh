'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { GRAHA_HI, GRAHA_SHORT_HI, NAKSHATRA_HI, NAKSHATRA_SHORT_HI, masaHi, samvatsaraHi, termHi } from '@/i18n/jyotish'
import { NAKSHATRA_NAMES, NAKSHATRA_SHORT, type Rashi } from '@/types/astrology'
import { SAURA_MASA_BY_RASHI } from '@/lib/panchang/hindu-calendar'

export type CosmicWheelVariant = 'astrology' | 'prashna' | 'panchang' | 'calendar' | 'compare'

type SkyPlanet = { id: string; sa: string; longitude: number; retro: boolean }
type SkyHora = { lord: string; start: string; end: string }

type SkyTimelineSegment = {
  start: string
  end: string
  label: string
  /** Paksha for tithi segments */
  sub?: string
}

type SkyPanchang = {
  sunRashi: { rashi: number; sa: string }
  moonRashi: { rashi: number; sa: string }
  vara: { number: number; sanskrit: string }
  tithi: { number: number; name: string; paksha: 'shukla' | 'krishna' }
  nakshatra: { index: number; name: string; pada: number }
  yoga: { number: number; name: string }
  karana: { number: number; name: string }
  lunarElongationDeg: number
  planets: SkyPlanet[]
  horaTable: SkyHora[]
  sunrise: string
  sunset: string
  rahuKalam: { start: string; end: string }
  abhijitMuhurta: { start: string; end: string }
  calendarContext: { sauraMasa: string; rituSa: string; ayanaSa: string; samvatsara: string }
  /** Sunrise→next-sunrise limb runs; used when tithi (etc.) changes during the day. */
  timeline?: {
    tithi: SkyTimelineSegment[]
  }
}

export type TodaySky = {
  panchang: SkyPanchang
  /** Index into horaTable of the hora running when the sky loaded; -1 before today's sunrise. */
  horaIndex: number
}

// The landing wheel is a shared public snapshot, so it uses one reference place instead of asking for location.
export const SKY_REFERENCE = { lat: 23.18, lng: 75.78, tz: 'Asia/Kolkata', label: 'Ujjain' }

export function useTodaySky(): { sky: TodaySky | null; failed: boolean } {
  const [sky, setSky] = useState<TodaySky | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: SKY_REFERENCE.tz }).format(new Date())
    const params = new URLSearchParams({
      date,
      lat: String(SKY_REFERENCE.lat),
      lng: String(SKY_REFERENCE.lng),
      tz: SKY_REFERENCE.tz,
    })

    fetch(`/api/panchang?${params}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json: { success: boolean; data?: SkyPanchang }) => {
        if (!json.success || !json.data) {
          setFailed(true)
          return
        }
        const now = Date.now()
        const horaIndex = json.data.horaTable.findIndex(
          (h) => new Date(h.start).getTime() <= now && now < new Date(h.end).getTime(),
        )
        setSky({ panchang: json.data, horaIndex })
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === 'AbortError')) setFailed(true)
      })

    return () => controller.abort()
  }, [])

  return { sky, failed }
}

// ── Geometry (degrees run clockwise from 12 o'clock, Mesha 0° at the top) ──

const CX = 200
const NAK_INNER = 150
const NAK_OUTER = 168
const BAND_INNER = 168
const BAND_OUTER = 186
const NAK_SPAN = 360 / 27
const round = (n: number) => Math.round(n * 100) / 100

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: round(CX + r * Math.sin(rad)), y: round(CX - r * Math.cos(rad)) }
}

function sectorPath(r1: number, r2: number, a0: number, a1: number) {
  const large = a1 - a0 > 180 ? 1 : 0
  const p1 = polar(r2, a0)
  const p2 = polar(r2, a1)
  const p3 = polar(r1, a1)
  const p4 = polar(r1, a0)
  return `M${p1.x} ${p1.y}A${r2} ${r2} 0 ${large} 1 ${p2.x} ${p2.y}L${p3.x} ${p3.y}A${r1} ${r1} 0 ${large} 0 ${p4.x} ${p4.y}Z`
}

/** Keeps tangent text upright on the lower half of a ring. */
function tangentRotation(deg: number) {
  const a = ((deg % 360) + 360) % 360
  return a > 90 && a < 270 ? a + 180 : a
}

function moonLitPath(cx: number, cy: number, r: number, elongationDeg: number) {
  const e = ((elongationDeg % 360) + 360) % 360
  const waxing = e < 180
  const cos = Math.cos((e * Math.PI) / 180)
  const rx = round(r * Math.abs(cos))
  const limbSweep = waxing ? 1 : 0
  const terminatorSweep = waxing ? (cos > 0 ? 0 : 1) : cos > 0 ? 1 : 0
  return `M${cx} ${cy - r}A${r} ${r} 0 0 ${limbSweep} ${cx} ${cy + r}A${rx} ${r} 0 0 ${terminatorSweep} ${cx} ${cy - r}Z`
}

// ── Domain labels ──

const RASHI_NAMES = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
]

const GRAHA_NAMES: Record<string, string> = {
  Su: 'Surya', Mo: 'Chandra', Ma: 'Mangala', Me: 'Budha', Ju: 'Guru',
  Ve: 'Shukra', Sa: 'Shani', Ra: 'Rahu', Ke: 'Ketu',
}

const GRAHA_COLORS: Record<string, string> = {
  Su: 'var(--cw-graha-su)', Mo: 'var(--cw-graha-mo)', Ma: 'var(--cw-graha-ma)', Me: 'var(--cw-graha-me)',
  Ju: 'var(--cw-graha-ju)', Ve: 'var(--cw-graha-ve)', Sa: 'var(--cw-graha-sa)', Ra: 'var(--cw-graha-ra)',
  Ke: 'var(--cw-graha-ke)',
}

const KOOTAS = [
  { name: 'Varna', points: 1 },
  { name: 'Vashya', points: 2 },
  { name: 'Tara', points: 3 },
  { name: 'Yoni', points: 4 },
  { name: 'Maitri', points: 5 },
  { name: 'Gana', points: 6 },
  { name: 'Bhakut', points: 7 },
  { name: 'Nadi', points: 8 },
]

// ── Page language ──

type WheelText = {
  hi: boolean
  t: ReturnType<typeof useTranslations<'home.wheel'>>
  /** Romanised engine name → page language (rashi, nakshatra, tithi, yoga…). */
  term: (en: string) => string
  masa: (en: string) => string
  paksha: (p: 'shukla' | 'krishna') => string
}

function useWheelText(): WheelText {
  const hi = useLocale() === 'hi'
  const t = useTranslations('home.wheel')
  return {
    hi,
    t,
    term: (en) => (hi ? termHi(en) : en),
    masa: (en) => (hi ? masaHi(en) : en),
    paksha: (p) => (p === 'shukla' ? t('shuklaName') : t('krishnaName')),
  }
}

function tithiLabel(t: { name: string; paksha: 'shukla' | 'krishna' }, w: WheelText) {
  if (t.name === 'Purnima' || t.name === 'Amavasya') return w.term(t.name)
  return `${w.paksha(t.paksha)} ${w.term(t.name)}`
}

function formatTime(iso: string, hi = false) {
  return new Intl.DateTimeFormat(hi ? 'hi-IN' : 'en-IN', {
    timeZone: SKY_REFERENCE.tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Staggers grahas onto inner tracks so close conjunctions stay readable. */
function layoutPlanets(
  planets: { id: string; longitude: number; retro: boolean }[],
  tracks: number[],
  minGap = 16,
) {
  const lastAngle: (number | null)[] = tracks.map(() => null)
  return [...planets]
    .sort((a, b) => a.longitude - b.longitude)
    .map((planet) => {
      let trackIndex = lastAngle.findIndex((angle) => angle === null || planet.longitude - angle >= minGap)
      if (trackIndex === -1) trackIndex = tracks.length - 1
      lastAngle[trackIndex] = planet.longitude
      return { planet, r: tracks[trackIndex] }
    })
}

// ── Shared layers ──

const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = 188 * Math.sqrt((i + 0.5) / 46)
  const p = polar(r, i * 137.508)
  return { ...p, size: i % 7 === 0 ? 1.2 : 0.7, delay: `${(i % 9) * 0.45}s` }
})

function Backdrop({ variant, accent }: { variant: string; accent: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`cw-disc-${variant}`} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="var(--cw-disc-1)" />
          <stop offset="58%" stopColor="var(--cw-disc-2)" />
          <stop offset="100%" stopColor="var(--cw-disc-3)" />
        </radialGradient>
        <radialGradient id={`cw-nebula-${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.34" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.04" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`cw-rim-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--cw-rim-hi)" />
          <stop offset="50%" stopColor={accent} />
          <stop offset="100%" stopColor="var(--cw-rim-lo)" />
        </linearGradient>
        <filter id={`cw-glow-${variant}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx={CX} cy={CX} r="197" fill={`url(#cw-disc-${variant})`} />
      <circle cx={CX} cy={CX} r="150" fill={`url(#cw-nebula-${variant})`} className="cosmic-wheel-breathe" />
      {STARS.map((star, i) => (
        <circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill="var(--cw-star)"
          className="cosmic-wheel-star"
          style={{ animationDelay: star.delay }}
        />
      ))}
      <circle cx={CX} cy={CX} r="197" fill="none" stroke={`url(#cw-rim-${variant})`} strokeWidth="1.6" />
      <g className="cosmic-wheel-spin-slow">
        {Array.from({ length: 72 }).map((_, i) => {
          const major = i % 6 === 0
          const a = polar(major ? 189 : 192, i * 5)
          const b = polar(196, i * 5)
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={accent}
              strokeWidth={major ? 1.1 : 0.5}
              strokeOpacity={major ? 0.85 : 0.45}
            />
          )
        })}
      </g>
    </>
  )
}

function RingText({ r, deg, size = 8.5, fill = 'var(--cw-ink-soft)', children }: {
  r: number
  deg: number
  size?: number
  fill?: string
  children: ReactNode
}) {
  const p = polar(r, deg)
  return (
    <text
      x={p.x}
      y={p.y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={size}
      fill={fill}
      className="cosmic-wheel-ring-text"
      transform={`rotate(${round(tangentRotation(deg))} ${p.x} ${p.y})`}
    >
      {children}
    </text>
  )
}

function ZodiacBand({ accent, labels = RASHI_NAMES, highlight = [], display }: {
  accent: string
  labels?: string[]
  highlight?: string[]
  /** Label shown on the ring; `labels` stay the matching keys. */
  display?: (name: string) => string
}) {
  const w = useWheelText()
  const show = display ?? w.term
  return (
    <g>
      {labels.map((name, i) => {
        const on = highlight.includes(name)
        const span = 360 / labels.length
        return (
          <g key={name}>
            <path
              d={sectorPath(BAND_INNER, BAND_OUTER, i * span, (i + 1) * span)}
              fill={on ? accent : 'var(--cw-band)'}
              fillOpacity={on ? 0.3 : i % 2 === 0 ? 0.075 : 0.03}
              stroke={accent}
              strokeOpacity="0.5"
              strokeWidth="0.6"
            />
            <RingText r={(BAND_INNER + BAND_OUTER) / 2} deg={(i + 0.5) * span} fill={on ? 'var(--cw-ink)' : 'var(--cw-ink-soft)'}>{show(name)}</RingText>
          </g>
        )
      })}
    </g>
  )
}

function nakshatraIndexAt(longitude: number): number {
  const lon = ((longitude % 360) + 360) % 360
  return Math.floor(lon / NAK_SPAN) % 27
}

function moonNakshatraIndex(planets: { id: string; longitude: number }[] | null | undefined): number | null {
  const moon = planets?.find(planet => planet.id === 'Mo')
  return moon ? nakshatraIndexAt(moon.longitude) : null
}

function NakshatraBand({ accent, skyIndex, natalIndex }: {
  accent: string
  skyIndex: number | null
  natalIndex: number | null
}) {
  const { hi } = useWheelText()
  return (
    <g>
      {(hi ? NAKSHATRA_SHORT_HI : NAKSHATRA_SHORT).map((name, i) => {
        const sky = i === skyIndex
        const birth = i === natalIndex && !sky
        return (
          <g key={NAKSHATRA_NAMES[i]}>
            <path
              d={sectorPath(NAK_INNER, NAK_OUTER, i * NAK_SPAN, (i + 1) * NAK_SPAN)}
              fill={sky ? accent : 'var(--cw-band)'}
              fillOpacity={sky ? 0.38 : i % 2 === 0 ? 0.07 : 0.025}
              stroke={accent}
              strokeOpacity={sky || birth ? 0.85 : 0.32}
              strokeWidth={birth ? 1.15 : 0.4}
            />
            <title>{hi ? NAKSHATRA_HI[i] : NAKSHATRA_NAMES[i]}</title>
            <RingText
              r={(NAK_INNER + NAK_OUTER) / 2}
              deg={(i + 0.5) * NAK_SPAN}
              size={6.2}
              fill={sky || birth ? 'var(--cw-ink)' : 'var(--cw-ink-soft)'}
            >
              {name}
            </RingText>
          </g>
        )
      })}
    </g>
  )
}

function Hub({ accent, r = 72 }: { accent: string; r?: number }) {
  return <circle cx={CX} cy={CX} r={r} fill="var(--cw-hub)" stroke={accent} strokeOpacity="0.45" strokeWidth="0.7" />
}

function GrahaLabel({ id, retro, x, y, size }: { id: string; retro?: boolean; x: number; y: number; size: number }) {
  const { hi, t } = useWheelText()
  const color = GRAHA_COLORS[id] ?? 'var(--cw-ink)'
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={size}
      fontWeight="700"
      fill={color}
      className="cosmic-wheel-center-text"
    >
      {hi ? GRAHA_SHORT_HI[id as keyof typeof GRAHA_SHORT_HI] ?? id : id}
      {retro && id !== 'Ra' && id !== 'Ke' ? <tspan fontSize={size * 0.65} dy={-size * 0.35}>{t('retro')}</tspan> : null}
    </text>
  )
}

function GrahaNode({ id, retro, r, longitude, edgeR = BAND_INNER }: {
  id: string
  retro?: boolean
  r: number
  longitude: number
  edgeR?: number
}) {
  const color = GRAHA_COLORS[id] ?? 'var(--cw-ink)'
  const edge = polar(edgeR, longitude)
  const node = polar(r, longitude)
  return (
    <g>
      <line x1={edge.x} y1={edge.y} x2={node.x} y2={node.y} stroke={color} strokeOpacity="0.5" strokeWidth="0.7" />
      <circle cx={edge.x} cy={edge.y} r="1.6" fill={color} />
      <circle cx={node.x} cy={node.y} r="10" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="0.9" />
      <GrahaLabel id={id} retro={retro} x={node.x} y={node.y} size={9} />
    </g>
  )
}

/** Birth planets: hollow marks on the inner ring, with no spoke across the sky. */
function NatalNode({ id, retro, r, longitude }: { id: string; retro?: boolean; r: number; longitude: number }) {
  const color = GRAHA_COLORS[id] ?? 'var(--cw-ink)'
  const node = polar(r, longitude)
  return (
    <g>
      <circle cx={node.x} cy={node.y} r="6.4" fill="var(--cw-hub)" stroke={color} strokeWidth="1.1" />
      <GrahaLabel id={id} retro={retro} x={node.x} y={node.y} size={7} />
    </g>
  )
}

function Moon({ cx, cy, r, elongation, variant, glow = true }: {
  cx: number
  cy: number
  r: number
  elongation: number
  variant: string
  glow?: boolean
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--cw-moon-dark)" stroke="var(--cw-moon-edge)" strokeWidth="0.6" />
      <path
        d={moonLitPath(cx, cy, r, elongation)}
        fill="var(--cw-moon-lit)"
        filter={glow ? `url(#cw-glow-${variant})` : undefined}
      />
    </g>
  )
}

function CenterText({ y, size, fill = 'var(--cw-ink)', weight = 600, children }: {
  y: number
  size: number
  fill?: string
  weight?: number
  children: ReactNode
}) {
  return (
    <text x={CX} y={y} textAnchor="middle" fontSize={size} fontWeight={weight} fill={fill} className="cosmic-wheel-center-text">
      {children}
    </text>
  )
}

// ── Variants ──

const GRAHA_TRACKS = [126, 108, 90]

export type SkyGrahaMark = { id: string; longitude: number; retro: boolean }

/** Fields the rashi sky wheel actually draws. The landing panchang payload satisfies this. */
export type RashiSkySlice = {
  planets: SkyGrahaMark[]
  moonRashi: { rashi: number; sa: string }
  sunRashi: { rashi: number; sa: string }
  nakshatra: { name: string }
  tithi: { name: string; paksha: 'shukla' | 'krishna' }
  lunarElongationDeg: number
}

/** Sky marks sit farther out once birth planets take the inner ring, still clear of the nakshatra band. */
const SKY_TRACKS_WITH_NATAL = [134, 114]
const NATAL_TRACKS = [80, 92]

/** Sanskrit rashi name printed on the wheel ring (Mesha at 12 o'clock). */
export function wheelRashiName(rashi: number): string {
  return RASHI_NAMES[(((rashi - 1) % 12) + 12) % 12] ?? ''
}

function RashiWheel({ panchang, natal, accent, variant }: {
  panchang: RashiSkySlice | null
  natal: SkyGrahaMark[] | null
  accent: string
  variant: string
}) {
  const w = useWheelText()
  const hasNatal = (natal?.length ?? 0) > 0
  const planets = panchang ? layoutPlanets(panchang.planets, hasNatal ? SKY_TRACKS_WITH_NATAL : GRAHA_TRACKS) : []
  const natalMarks = hasNatal && natal ? layoutPlanets(natal, NATAL_TRACKS, 12) : []
  const skyNak = moonNakshatraIndex(panchang?.planets)
  const natalNak = moonNakshatraIndex(natal)
  return (
    <g>
      <NakshatraBand accent={accent} skyIndex={skyNak} natalIndex={natalNak} />
      <ZodiacBand accent={accent} highlight={panchang ? [wheelRashiName(panchang.moonRashi.rashi)] : []} />
      <Hub accent={accent} />
      {hasNatal ? (
        <circle cx={CX} cy={CX} r={NATAL_TRACKS[0]} fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="0.6" strokeDasharray="2 3" />
      ) : null}
      {natalMarks.map(({ planet, r }) => (
        <g key={`natal-${planet.id}`} className="cosmic-wheel-graha">
          <NatalNode id={planet.id} retro={planet.retro} r={r} longitude={planet.longitude} />
        </g>
      ))}
      {planets.map(({ planet, r }) => (
        <g key={planet.id} className="cosmic-wheel-graha">
          <GrahaNode id={planet.id} retro={planet.retro} r={r} longitude={planet.longitude} edgeR={NAK_INNER} />
        </g>
      ))}
      {panchang ? (
        <>
          <Moon cx={CX} cy={184} r={24} elongation={panchang.lunarElongationDeg} variant={variant} />
          <CenterText y={225} size={10.5}>{tithiLabel(panchang.tithi, w)}</CenterText>
          <CenterText y={238} size={8.5} fill="var(--cw-ink-muted)" weight={500}>{w.t('moonIn', { rashi: w.term(wheelRashiName(panchang.moonRashi.rashi)) })}</CenterText>
        </>
      ) : null}
    </g>
  )
}

type RashiSkyFigureProps = {
  sky: RashiSkySlice | null
  /** Birth-chart grahas, drawn on the inner ring. */
  natal?: SkyGrahaMark[] | null
  accent: string
  /** Shown under the facts once a sky is available. */
  source: string | null
  emptyLabel: string
  /** Keeps SVG gradient ids unique when more than one wheel is on the page. */
  wheelId?: string
}

/** Sidereal sky: rashis on the rim, grahas by longitude, tithi and Moon in the hub. */
export function RashiSkyFigure({ sky, natal = null, accent, source, emptyLabel, wheelId = 'astrology' }: RashiSkyFigureProps) {
  const w = useWheelText()
  const { t, term } = w
  const moonRashi = sky ? term(wheelRashiName(sky.moonRashi.rashi)) : ''
  const sunRashi = sky ? term(wheelRashiName(sky.sunRashi.rashi)) : ''
  const caption = sky
    ? [
        { id: 'moon', label: t('moon'), value: `${moonRashi} · ${term(sky.nakshatra.name)}` },
        { id: 'sun', label: t('sun'), value: sunRashi },
        { id: 'paksha', label: t('paksha'), value: w.paksha(sky.tithi.paksha) },
      ]
    : []
  const aria = sky
    ? t('ariaSky', { tithi: tithiLabel(sky.tithi, w), moon: moonRashi, nakshatra: term(sky.nakshatra.name), sun: sunRashi }) +
      (natal?.length ? t('ariaNatal') : '')
    : t('ariaEmpty')

  return (
    <figure className="cosmic-wheel" style={{ ['--cw-accent' as string]: accent }}>
      <svg viewBox="0 0 400 400" className="cosmic-wheel-svg" role="img" aria-label={aria}>
        <Backdrop variant={wheelId} accent="var(--cw-line)" />
        <RashiWheel panchang={sky} natal={natal} accent="var(--cw-line)" variant={wheelId} />
      </svg>
      <figcaption className="cosmic-wheel-caption">
        {caption.length > 0 ? (
          <ul className="cosmic-wheel-facts">
            {caption.map((fact) => (
              <li key={fact.id}>
                <span className="cosmic-wheel-fact-label">{fact.label}</span>
                <span className="cosmic-wheel-fact-value">{fact.value}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="cosmic-wheel-source">{sky && source ? source : emptyLabel}</p>
        {natal?.length ? (
          <p className="cosmic-wheel-source">{t('natalNote')}</p>
        ) : null}
      </figcaption>
    </figure>
  )
}

/** Prashna is read from the moment asked: the Moon and the running hora lord carry the question. */
function PrashnaWheel({ sky, accent }: { sky: TodaySky | null; accent: string }) {
  const w = useWheelText()
  const panchang = sky?.panchang ?? null
  const hora = panchang && sky && sky.horaIndex >= 0 ? panchang.horaTable[sky.horaIndex] : undefined
  const keyGrahas = hora ? ['Mo', hora.lord] : ['Mo']
  const planets = panchang ? layoutPlanets(panchang.planets, GRAHA_TRACKS) : []
  const keyRashis = planets
    .filter(({ planet }) => keyGrahas.includes(planet.id))
    .map(({ planet }) => RASHI_NAMES[Math.floor(planet.longitude / 30) % 12])

  return (
    <g>
      <ZodiacBand accent={accent} highlight={keyRashis} />
      {planets.filter(({ planet }) => keyGrahas.includes(planet.id)).map(({ planet, r }) => {
        const from = polar(72, planet.longitude)
        const to = polar(r - 10, planet.longitude)
        return (
          <line
            key={planet.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={GRAHA_COLORS[planet.id] ?? accent}
            strokeWidth="1.5"
            strokeLinecap="round"
            className="cosmic-wheel-pulse"
          />
        )
      })}
      <Hub accent={accent} />
      {planets.map(({ planet, r }) => (
        <g key={planet.id} opacity={keyGrahas.includes(planet.id) ? 1 : 0.32} className="cosmic-wheel-graha">
          <GrahaNode id={planet.id} retro={planet.retro} r={r} longitude={planet.longitude} />
        </g>
      ))}
      {hora ? (
        <>
          <CenterText y={180} size={8} fill="var(--cw-ink-muted)" weight={700}>{w.t('horaNow')}</CenterText>
          <CenterText y={206} size={21} fill={GRAHA_COLORS[hora.lord]} weight={700}>{w.hi ? GRAHA_HI[hora.lord as keyof typeof GRAHA_HI] ?? hora.lord : GRAHA_NAMES[hora.lord] ?? hora.lord}</CenterText>
          <CenterText y={223} size={9} fill="var(--cw-ink-muted)" weight={500}>{w.t('until', { time: formatTime(hora.end, w.hi) })}</CenterText>
        </>
      ) : panchang ? (
        <>
          <CenterText y={190} size={8} fill="var(--cw-ink-muted)" weight={700}>{w.t('today')}</CenterText>
          <CenterText y={212} size={17} weight={700}>{w.term(panchang.vara.sanskrit)}</CenterText>
        </>
      ) : null}
    </g>
  )
}

/** The five limbs around today's Moon, with the Sun–Moon arc that produces the tithi. */
function PanchangWheel({ panchang, accent }: { panchang: SkyPanchang | null; accent: string }) {
  const w = useWheelText()
  const sun = panchang?.planets.find((planet) => planet.id === 'Su')
  const moon = panchang?.planets.find((planet) => planet.id === 'Mo')
  const limbs = panchang
    ? [
        { id: 'tithi', label: w.t('tithi'), value: w.term(panchang.tithi.name) },
        { id: 'vara', label: w.t('vara'), value: w.term(panchang.vara.sanskrit) },
        { id: 'nakshatra', label: w.t('nakshatra'), value: w.term(panchang.nakshatra.name) },
        { id: 'yoga', label: w.t('yoga'), value: w.term(panchang.yoga.name) },
        { id: 'karana', label: w.t('karana'), value: w.term(panchang.karana.name) },
      ]
    : (['tithi', 'vara', 'nakshatra', 'yoga', 'karana'] as const).map((id) => ({ id, label: w.t(id) }))

  let elongationArc: string | null = null
  if (sun && moon) {
    const span = ((moon.longitude - sun.longitude) % 360 + 360) % 360
    const start = polar(138, sun.longitude)
    const end = polar(138, moon.longitude)
    elongationArc = `M${start.x} ${start.y}A138 138 0 ${span > 180 ? 1 : 0} 1 ${end.x} ${end.y}`
  }

  return (
    <g>
      <ZodiacBand accent={accent} highlight={panchang ? [RASHI_NAMES[panchang.sunRashi.rashi - 1], RASHI_NAMES[panchang.moonRashi.rashi - 1]] : []} />
      {elongationArc ? (
        <path d={elongationArc} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="1 5" />
      ) : null}
      {sun ? <GrahaNode id="Su" r={138} longitude={sun.longitude} /> : null}
      {moon ? <GrahaNode id="Mo" r={138} longitude={moon.longitude} /> : null}
      {limbs.map((limb, i) => {
        const p = polar(90, i * 72)
        const anchor = polar(46, i * 72)
        const edge = polar(58, i * 72)
        const value = 'value' in limb ? limb.value : undefined
        return (
          <g key={limb.id}>
            <line x1={anchor.x} y1={anchor.y} x2={edge.x} y2={edge.y} stroke={accent} strokeOpacity="0.6" strokeWidth="0.8" />
            <circle cx={p.x} cy={p.y} r="33" fill="var(--cw-hub)" stroke={accent} strokeOpacity="0.75" strokeWidth="0.9" />
            <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="6.8" fontWeight="700" letterSpacing="0.5" fill="var(--cw-ink-muted)" className="cosmic-wheel-center-text">
              {w.hi ? limb.label : limb.label.toUpperCase()}
            </text>
            {value ? (
              <text x={p.x} y={p.y + 8} textAnchor="middle" fontSize={value.length > 9 ? 8 : 9.5} fontWeight="600" fill="var(--cw-ink)" className="cosmic-wheel-center-text">
                {value}
              </text>
            ) : null}
          </g>
        )
      })}
      {panchang ? <Moon cx={CX} cy={CX} r={24} elongation={panchang.lunarElongationDeg} variant="panchang" /> : null}
    </g>
  )
}

const MASA_NAMES = Array.from({ length: 12 }, (_, i) => SAURA_MASA_BY_RASHI[(i + 1) as Rashi])

/** Year, month and day together: solar masas outside, the lunar month's 30 tithis inside. */
function CalendarWheel({ panchang, accent }: { panchang: SkyPanchang | null; accent: string }) {
  const w = useWheelText()
  const currentIndex = panchang ? panchang.tithi.number - 1 : -1
  const sun = panchang?.planets.find((planet) => planet.id === 'Su')
  const sunEdge = sun ? polar(BAND_INNER, sun.longitude) : null

  return (
    <g>
      <ZodiacBand accent={accent} labels={MASA_NAMES} display={w.masa} highlight={panchang ? [panchang.calendarContext.sauraMasa] : []} />
      {sunEdge ? <circle cx={sunEdge.x} cy={sunEdge.y} r="3.5" fill={GRAHA_COLORS.Su} /> : null}
      <path d={sectorPath(112, 116, 0.5, 179.5)} fill="var(--cw-shukla-ink)" />
      <path d={sectorPath(112, 116, 180.5, 359.5)} fill="var(--cw-ink-muted)" fillOpacity="0.5" />
      <RingText r={100} deg={90} size={8} fill="var(--cw-shukla-ink)">{w.t('shukla')}</RingText>
      <RingText r={100} deg={270} size={8} fill="var(--cw-ink-muted)">{w.t('krishna')}</RingText>
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i + 0.5) * 12
        const p = polar(135, angle)
        const on = i === currentIndex
        return (
          <g key={i}>
            {on ? <circle cx={p.x} cy={p.y} r="13" fill="none" stroke={accent} strokeWidth="1.2" className="cosmic-wheel-pulse" /> : null}
            <Moon cx={p.x} cy={p.y} r={on ? 10 : 6.5} elongation={angle} variant="calendar" glow={false} />
          </g>
        )
      })}
      <Hub accent={accent} r={78} />
      {panchang ? (
        <>
          <CenterText y={150} size={8} fill="var(--cw-ink-muted)" weight={700}>{w.t('tithiOf', { n: panchang.tithi.number })}</CenterText>
          <Moon cx={CX} cy={182} r={22} elongation={panchang.lunarElongationDeg} variant="calendar" />
          <CenterText y={224} size={11}>{tithiLabel(panchang.tithi, w)}</CenterText>
          <CenterText y={238} size={8.5} fill="var(--cw-ink-muted)" weight={500}>{w.t('masa', { masa: w.masa(panchang.calendarContext.sauraMasa) })}</CenterText>
        </>
      ) : null}
    </g>
  )
}

const MATCH_RADIUS = 72
const MATCH_OFFSET = 68
const MATCH_MOON_DEG = 30

function matchPoint(cx: number, radius: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: round(cx + radius * Math.sin(rad)), y: round(CX - radius * Math.cos(rad)) }
}

function MatchChart({ cx, label, moonDeg, grahaDegs, accent }: {
  cx: number
  label: string
  moonDeg: number
  grahaDegs: [string, number][]
  accent: string
}) {
  const { hi } = useWheelText()
  const r = MATCH_RADIUS
  const moon = matchPoint(cx, r - 12, moonDeg)
  return (
    <g>
      <circle cx={cx} cy={CX} r={r} fill="var(--cw-hub)" stroke={accent} strokeOpacity="0.8" strokeWidth="1" />
      <circle cx={cx} cy={CX} r={r - 24} fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="0.6" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = matchPoint(cx, r - 24, i * 30)
        const b = matchPoint(cx, r, i * 30)
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={accent} strokeOpacity="0.4" strokeWidth="0.6" />
      })}
      {grahaDegs.map(([id, deg]) => {
        const p = matchPoint(cx, r - 12, deg)
        return <circle key={id} cx={p.x} cy={p.y} r="3" fill={GRAHA_COLORS[id]} />
      })}
      <circle cx={moon.x} cy={moon.y} r="9" fill="var(--cw-hub)" stroke={GRAHA_COLORS.Mo} strokeWidth="1.1" />
      <text x={moon.x} y={moon.y} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="700" fill={GRAHA_COLORS.Mo} className="cosmic-wheel-center-text">{hi ? GRAHA_SHORT_HI.Mo : 'Mo'}</text>
      <text x={cx} y={CX} textAnchor="middle" dominantBaseline="central" fontSize="10.5" fontWeight="600" fill="var(--cw-ink)" className="cosmic-wheel-center-text">{label}</text>
    </g>
  )
}

/** Guna Milan compares the two natal Moons through eight kootas; positions here are illustrative. */
function MatchWheel({ accent }: { accent: string }) {
  const w = useWheelText()
  const total = KOOTAS.reduce((sum, koota) => sum + koota.points, 0)
  const leftCx = CX - MATCH_OFFSET
  const rightCx = CX + MATCH_OFFSET
  const moonA = matchPoint(leftCx, MATCH_RADIUS - 12, MATCH_MOON_DEG)
  const moonB = matchPoint(rightCx, MATCH_RADIUS - 12, -MATCH_MOON_DEG)
  return (
    <g>
      <ZodiacBand accent={accent} labels={KOOTAS.map((koota) => `${w.term(koota.name)} · ${koota.points}`)} display={(label) => label} />
      <MatchChart
        cx={leftCx}
        label={w.t('chartA')}
        moonDeg={MATCH_MOON_DEG}
        grahaDegs={[['Su', 100], ['Ma', 160], ['Me', 205], ['Ju', 250], ['Ve', 295], ['Sa', 340]]}
        accent={accent}
      />
      <MatchChart
        cx={rightCx}
        label={w.t('chartB')}
        moonDeg={-MATCH_MOON_DEG}
        grahaDegs={[['Su', 20], ['Ma', 65], ['Me', 110], ['Ju', 155], ['Ve', 200], ['Sa', 260]]}
        accent={accent}
      />
      <path
        d={`M${moonA.x} ${moonA.y}Q${CX} ${moonA.y - 26} ${moonB.x} ${moonB.y}`}
        fill="none"
        stroke={GRAHA_COLORS.Mo}
        strokeWidth="1.5"
        strokeDasharray="2 4"
        strokeLinecap="round"
        className="cosmic-wheel-pulse"
      />
      <Hub accent={accent} r={30} />
      <CenterText y={205} size={22} weight={700}>{total}</CenterText>
      <CenterText y={217} size={7.5} fill="var(--cw-ink-muted)" weight={600}>{w.t('guna')}</CenterText>
    </g>
  )
}

// ── Caption ──

function captionFor(variant: CosmicWheelVariant, sky: TodaySky | null, w: WheelText): { id: string; label: string; value: string }[] {
  const { t, term } = w
  if (variant === 'compare') {
    return [
      { id: 'kootas', label: t('kootas'), value: '8' },
      { id: 'heaviest', label: t('heaviest'), value: t('heaviestValue') },
      { id: 'maximum', label: t('maximum'), value: t('maximumValue') },
    ]
  }
  const p = sky?.panchang
  if (!p) return []
  switch (variant) {
    case 'astrology':
      return [
        { id: 'moon', label: t('moon'), value: `${term(p.moonRashi.sa)} · ${term(p.nakshatra.name)}` },
        { id: 'sun', label: t('sun'), value: term(p.sunRashi.sa) },
        { id: 'paksha', label: t('paksha'), value: w.paksha(p.tithi.paksha) },
      ]
    case 'prashna':
      return [
        { id: 'vara', label: t('vara'), value: term(p.vara.sanskrit) },
        { id: 'moon', label: t('moon'), value: term(p.nakshatra.name) },
        { id: 'tithi', label: t('tithi'), value: tithiLabel(p.tithi, w) },
      ]
    case 'panchang':
      return [
        { id: 'paksha', label: t('paksha'), value: w.paksha(p.tithi.paksha) },
        { id: 'moon', label: t('moon'), value: term(p.moonRashi.sa) },
        { id: 'sun', label: t('sun'), value: term(p.sunRashi.sa) },
      ]
    case 'calendar':
      return [
        { id: 'ritu', label: t('ritu'), value: term(p.calendarContext.rituSa) },
        { id: 'ayana', label: t('ayana'), value: term(p.calendarContext.ayanaSa) },
        {
          id: 'samvatsara',
          label: t('samvatsara'),
          value: w.hi ? samvatsaraHi(p.calendarContext.samvatsara) : p.calendarContext.samvatsara,
        },
      ]
  }
}

function describeWheel(variant: CosmicWheelVariant, sky: TodaySky | null, w: WheelText) {
  if (variant === 'compare') return w.t('ariaMatch')
  const p = sky?.panchang
  if (!p) return w.t('ariaEmpty')
  return w.t('ariaToday', {
    tithi: tithiLabel(p.tithi, w),
    moon: w.term(p.moonRashi.sa),
    nakshatra: w.term(p.nakshatra.name),
    sun: w.term(p.sunRashi.sa),
  })
}

type LandingCosmicWheelProps = {
  variant: CosmicWheelVariant
  accent: string
  sky: TodaySky | null
  failed: boolean
}

export function LandingCosmicWheel({ variant, accent, sky, failed }: LandingCosmicWheelProps) {
  const w = useWheelText()
  const { t } = w
  const place = t('place')
  const panchang = sky?.panchang ?? null
  if (variant === 'astrology') {
    return (
      <RashiSkyFigure
        sky={panchang}
        accent={accent}
        wheelId="astrology"
        source={panchang ? t('source', { place }) : null}
        emptyLabel={failed ? t('unavailable') : t('reading')}
      />
    )
  }

  const caption = captionFor(variant, sky, w)
  const line = 'var(--cw-line)'

  return (
    <figure className="cosmic-wheel" style={{ ['--cw-accent' as string]: accent }}>
      <svg viewBox="0 0 400 400" className="cosmic-wheel-svg" role="img" aria-label={describeWheel(variant, sky, w)}>
        <Backdrop variant={variant} accent={line} />
        {variant === 'prashna' ? <PrashnaWheel sky={sky} accent={line} /> : null}
        {variant === 'panchang' ? <PanchangWheel panchang={panchang} accent={line} /> : null}
        {variant === 'calendar' ? <CalendarWheel panchang={panchang} accent={line} /> : null}
        {variant === 'compare' ? <MatchWheel accent={line} /> : null}
      </svg>

      <figcaption className="cosmic-wheel-caption">
        {caption.length > 0 ? (
          <ul className="cosmic-wheel-facts">
            {caption.map((fact) => (
              <li key={fact.id}>
                <span className="cosmic-wheel-fact-label">{fact.label}</span>
                <span className="cosmic-wheel-fact-value">{fact.value}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {variant !== 'compare' ? (
          <p className="cosmic-wheel-source">
            {panchang
              ? t(variant === 'prashna' ? 'sourcePrashna' : 'source', { place })
              : failed
                ? t('unavailable')
                : t('reading')}
          </p>
        ) : (
          <p className="cosmic-wheel-source">{t('matchNote')}</p>
        )}
      </figcaption>
    </figure>
  )
}
