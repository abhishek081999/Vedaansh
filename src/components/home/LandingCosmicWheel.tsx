'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { Rashi } from '@/types/astrology'
import { SAURA_MASA_BY_RASHI } from '@/lib/panchang/hindu-calendar'

export type CosmicWheelVariant = 'astrology' | 'prashna' | 'panchang' | 'calendar' | 'compare'

type SkyPlanet = { id: string; sa: string; longitude: number; retro: boolean }
type SkyHora = { lord: string; start: string; end: string }

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
const BAND_INNER = 158
const BAND_OUTER = 186
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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function tithiLabel(t: SkyPanchang['tithi']) {
  if (t.name === 'Purnima' || t.name === 'Amavasya') return t.name
  return `${capitalize(t.paksha)} ${t.name}`
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: SKY_REFERENCE.tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Staggers grahas onto inner tracks so close conjunctions stay readable. */
function layoutPlanets(planets: SkyPlanet[], tracks: number[]) {
  const lastAngle: (number | null)[] = tracks.map(() => null)
  return [...planets]
    .sort((a, b) => a.longitude - b.longitude)
    .map((planet) => {
      let trackIndex = lastAngle.findIndex((angle) => angle === null || planet.longitude - angle >= 16)
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

function Backdrop({ variant, accent }: { variant: CosmicWheelVariant; accent: string }) {
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

function ZodiacBand({ accent, labels = RASHI_NAMES, highlight = [] }: {
  accent: string
  labels?: string[]
  highlight?: string[]
}) {
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
            <RingText r={(BAND_INNER + BAND_OUTER) / 2} deg={(i + 0.5) * span} fill={on ? 'var(--cw-ink)' : 'var(--cw-ink-soft)'}>{name}</RingText>
          </g>
        )
      })}
    </g>
  )
}

function Hub({ accent, r = 72 }: { accent: string; r?: number }) {
  return <circle cx={CX} cy={CX} r={r} fill="var(--cw-hub)" stroke={accent} strokeOpacity="0.45" strokeWidth="0.7" />
}

function GrahaNode({ id, retro, r, longitude }: { id: string; retro?: boolean; r: number; longitude: number }) {
  const color = GRAHA_COLORS[id] ?? 'var(--cw-ink)'
  const edge = polar(BAND_INNER, longitude)
  const node = polar(r, longitude)
  return (
    <g>
      <line x1={edge.x} y1={edge.y} x2={node.x} y2={node.y} stroke={color} strokeOpacity="0.5" strokeWidth="0.7" />
      <circle cx={edge.x} cy={edge.y} r="1.6" fill={color} />
      <circle cx={node.x} cy={node.y} r="10" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="0.9" />
      <text
        x={node.x}
        y={node.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="9"
        fontWeight="700"
        fill={color}
        className="cosmic-wheel-center-text"
      >
        {id}
        {retro && id !== 'Ra' && id !== 'Ke' ? <tspan fontSize="6" dy="-3">R</tspan> : null}
      </text>
    </g>
  )
}

function Moon({ cx, cy, r, elongation, variant, glow = true }: {
  cx: number
  cy: number
  r: number
  elongation: number
  variant: CosmicWheelVariant
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

const GRAHA_TRACKS = [138, 116, 94]

function RashiWheel({ panchang, accent }: { panchang: SkyPanchang | null; accent: string }) {
  const planets = panchang ? layoutPlanets(panchang.planets, GRAHA_TRACKS) : []
  return (
    <g>
      <ZodiacBand accent={accent} highlight={panchang ? [RASHI_NAMES[panchang.moonRashi.rashi - 1]] : []} />
      <Hub accent={accent} />
      {planets.map(({ planet, r }) => (
        <g key={planet.id} className="cosmic-wheel-graha">
          <GrahaNode id={planet.id} retro={planet.retro} r={r} longitude={planet.longitude} />
        </g>
      ))}
      {panchang ? (
        <>
          <Moon cx={CX} cy={184} r={24} elongation={panchang.lunarElongationDeg} variant="astrology" />
          <CenterText y={225} size={10.5}>{tithiLabel(panchang.tithi)}</CenterText>
          <CenterText y={238} size={8.5} fill="var(--cw-ink-muted)" weight={500}>Moon in {panchang.moonRashi.sa}</CenterText>
        </>
      ) : null}
    </g>
  )
}

/** Prashna is read from the moment asked: the Moon and the running hora lord carry the question. */
function PrashnaWheel({ sky, accent }: { sky: TodaySky | null; accent: string }) {
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
          <CenterText y={180} size={8} fill="var(--cw-ink-muted)" weight={700}>HORA NOW</CenterText>
          <CenterText y={206} size={21} fill={GRAHA_COLORS[hora.lord]} weight={700}>{GRAHA_NAMES[hora.lord] ?? hora.lord}</CenterText>
          <CenterText y={223} size={9} fill="var(--cw-ink-muted)" weight={500}>until {formatTime(hora.end)}</CenterText>
        </>
      ) : panchang ? (
        <>
          <CenterText y={190} size={8} fill="var(--cw-ink-muted)" weight={700}>TODAY</CenterText>
          <CenterText y={212} size={17} weight={700}>{panchang.vara.sanskrit}</CenterText>
        </>
      ) : null}
    </g>
  )
}

/** The five limbs around today's Moon, with the Sun–Moon arc that produces the tithi. */
function PanchangWheel({ panchang, accent }: { panchang: SkyPanchang | null; accent: string }) {
  const sun = panchang?.planets.find((planet) => planet.id === 'Su')
  const moon = panchang?.planets.find((planet) => planet.id === 'Mo')
  const limbs = panchang
    ? [
        { label: 'Tithi', value: panchang.tithi.name },
        { label: 'Vara', value: panchang.vara.sanskrit },
        { label: 'Nakshatra', value: panchang.nakshatra.name },
        { label: 'Yoga', value: panchang.yoga.name },
        { label: 'Karana', value: panchang.karana.name },
      ]
    : [{ label: 'Tithi' }, { label: 'Vara' }, { label: 'Nakshatra' }, { label: 'Yoga' }, { label: 'Karana' }]

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
          <g key={limb.label}>
            <line x1={anchor.x} y1={anchor.y} x2={edge.x} y2={edge.y} stroke={accent} strokeOpacity="0.6" strokeWidth="0.8" />
            <circle cx={p.x} cy={p.y} r="33" fill="var(--cw-hub)" stroke={accent} strokeOpacity="0.75" strokeWidth="0.9" />
            <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="6.8" fontWeight="700" letterSpacing="0.5" fill="var(--cw-ink-muted)" className="cosmic-wheel-center-text">
              {limb.label.toUpperCase()}
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
  const currentIndex = panchang ? panchang.tithi.number - 1 : -1
  const sun = panchang?.planets.find((planet) => planet.id === 'Su')
  const sunEdge = sun ? polar(BAND_INNER, sun.longitude) : null

  return (
    <g>
      <ZodiacBand accent={accent} labels={MASA_NAMES} highlight={panchang ? [panchang.calendarContext.sauraMasa] : []} />
      {sunEdge ? <circle cx={sunEdge.x} cy={sunEdge.y} r="3.5" fill={GRAHA_COLORS.Su} /> : null}
      <path d={sectorPath(112, 116, 0.5, 179.5)} fill="var(--cw-shukla-ink)" />
      <path d={sectorPath(112, 116, 180.5, 359.5)} fill="var(--cw-ink-muted)" fillOpacity="0.5" />
      <RingText r={100} deg={90} size={8} fill="var(--cw-shukla-ink)">SHUKLA</RingText>
      <RingText r={100} deg={270} size={8} fill="var(--cw-ink-muted)">KRISHNA</RingText>
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
          <CenterText y={150} size={8} fill="var(--cw-ink-muted)" weight={700}>TITHI {panchang.tithi.number} OF 30</CenterText>
          <Moon cx={CX} cy={182} r={22} elongation={panchang.lunarElongationDeg} variant="calendar" />
          <CenterText y={224} size={11}>{tithiLabel(panchang.tithi)}</CenterText>
          <CenterText y={238} size={8.5} fill="var(--cw-ink-muted)" weight={500}>{panchang.calendarContext.sauraMasa} masa</CenterText>
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
      <text x={moon.x} y={moon.y} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="700" fill={GRAHA_COLORS.Mo} className="cosmic-wheel-center-text">Mo</text>
      <text x={cx} y={CX} textAnchor="middle" dominantBaseline="central" fontSize="10.5" fontWeight="600" fill="var(--cw-ink)" className="cosmic-wheel-center-text">{label}</text>
    </g>
  )
}

/** Guna Milan compares the two natal Moons through eight kootas; positions here are illustrative. */
function MatchWheel({ accent }: { accent: string }) {
  const total = KOOTAS.reduce((sum, koota) => sum + koota.points, 0)
  const leftCx = CX - MATCH_OFFSET
  const rightCx = CX + MATCH_OFFSET
  const moonA = matchPoint(leftCx, MATCH_RADIUS - 12, MATCH_MOON_DEG)
  const moonB = matchPoint(rightCx, MATCH_RADIUS - 12, -MATCH_MOON_DEG)
  return (
    <g>
      <ZodiacBand accent={accent} labels={KOOTAS.map((koota) => `${koota.name} · ${koota.points}`)} />
      <MatchChart
        cx={leftCx}
        label="Chart A"
        moonDeg={MATCH_MOON_DEG}
        grahaDegs={[['Su', 100], ['Ma', 160], ['Me', 205], ['Ju', 250], ['Ve', 295], ['Sa', 340]]}
        accent={accent}
      />
      <MatchChart
        cx={rightCx}
        label="Chart B"
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
      <CenterText y={217} size={7.5} fill="var(--cw-ink-muted)" weight={600}>GUNA</CenterText>
    </g>
  )
}

// ── Caption ──

function captionFor(variant: CosmicWheelVariant, sky: TodaySky | null): { label: string; value: string }[] {
  if (variant === 'compare') {
    return [
      { label: 'Kootas', value: '8' },
      { label: 'Heaviest', value: 'Nadi · 8' },
      { label: 'Maximum', value: '36 guna' },
    ]
  }
  const p = sky?.panchang
  if (!p) return []
  switch (variant) {
    case 'astrology':
      return [
        { label: 'Moon', value: `${p.moonRashi.sa} · ${p.nakshatra.name}` },
        { label: 'Sun', value: p.sunRashi.sa },
        { label: 'Paksha', value: capitalize(p.tithi.paksha) },
      ]
    case 'prashna':
      return [
        { label: 'Vara', value: p.vara.sanskrit },
        { label: 'Moon', value: p.nakshatra.name },
        { label: 'Tithi', value: tithiLabel(p.tithi) },
      ]
    case 'panchang':
      return [
        { label: 'Paksha', value: capitalize(p.tithi.paksha) },
        { label: 'Moon', value: p.moonRashi.sa },
        { label: 'Sun', value: p.sunRashi.sa },
      ]
    case 'calendar':
      return [
        { label: 'Ritu', value: p.calendarContext.rituSa },
        { label: 'Ayana', value: p.calendarContext.ayanaSa },
        { label: 'Samvatsara', value: p.calendarContext.samvatsara },
      ]
  }
}

function describeWheel(variant: CosmicWheelVariant, sky: TodaySky | null) {
  if (variant === 'compare') return 'Two birth charts joined at their Moons, inside the eight Ashtakoot kootas totalling 36 guna.'
  const p = sky?.panchang
  if (!p) return 'Circular Vedic sky wheel.'
  return `Today's sky: ${tithiLabel(p.tithi)}, Moon in ${p.moonRashi.sa}, ${p.nakshatra.name} nakshatra, Sun in ${p.sunRashi.sa}.`
}

type LandingCosmicWheelProps = {
  variant: CosmicWheelVariant
  accent: string
  sky: TodaySky | null
  failed: boolean
}

export function LandingCosmicWheel({ variant, accent, sky, failed }: LandingCosmicWheelProps) {
  const panchang = sky?.panchang ?? null
  const caption = captionFor(variant, sky)
  const line = 'var(--cw-line)'

  return (
    <figure className="cosmic-wheel" style={{ ['--cw-accent' as string]: accent }}>
      <svg viewBox="0 0 400 400" className="cosmic-wheel-svg" role="img" aria-label={describeWheel(variant, sky)}>
        <Backdrop variant={variant} accent={line} />
        {variant === 'astrology' ? <RashiWheel panchang={panchang} accent={line} /> : null}
        {variant === 'prashna' ? <PrashnaWheel sky={sky} accent={line} /> : null}
        {variant === 'panchang' ? <PanchangWheel panchang={panchang} accent={line} /> : null}
        {variant === 'calendar' ? <CalendarWheel panchang={panchang} accent={line} /> : null}
        {variant === 'compare' ? <MatchWheel accent={line} /> : null}
      </svg>

      <figcaption className="cosmic-wheel-caption">
        {caption.length > 0 ? (
          <ul className="cosmic-wheel-facts">
            {caption.map((fact) => (
              <li key={fact.label}>
                <span className="cosmic-wheel-fact-label">{fact.label}</span>
                <span className="cosmic-wheel-fact-value">{fact.value}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {variant !== 'compare' ? (
          <p className="cosmic-wheel-source">
            {panchang
              ? `Today's sky · ${SKY_REFERENCE.label}, noon IST${variant === 'prashna' ? ' · hora live' : ''}`
              : failed
                ? 'Live sky unavailable right now'
                : "Reading today's sky…"}
          </p>
        ) : (
          <p className="cosmic-wheel-source">Illustrative charts · your score comes from your two birth charts</p>
        )}
      </figcaption>
    </figure>
  )
}
