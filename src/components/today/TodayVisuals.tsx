'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/today/TodayVisuals.tsx
//  Graphics for Today's Reading: score dial, life-area radar,
//  Moon phase + Tara / Chandra wheels, panchang limbs, 24h dial.
//  Presentational only — every value comes from the engine output.
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { Hourglass, Infinity as InfinityIcon, Moon, Sparkles, Sun } from 'lucide-react'
import type { PanchangItem, TodayReading, TodayTransitGraha } from '@/lib/engine/todayReading'
import type { HoraSegment } from '@/lib/engine/todayAdvanced'
import { ClockDial, Legend, RadarChart, SegmentRing, polar, type DialWindow } from '@/components/ui/viz'
import { fmtTime, scoreTone, toneColor, toned } from './TodayReadingSections'
import styles from './today-reading.module.css'

type Tone = 'good' | 'mixed' | 'caution'

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

// ── Hero score dial ──────────────────────────────────────────

const SWEEP = 0.75 // 270° arc

export function ScoreDial({ score, label }: { score: number; label: string }) {
  const size = 148
  const c = size / 2
  const r = 58
  const circ = 2 * Math.PI * r
  const track = circ * SWEEP
  const value = track * Math.max(0, Math.min(100, score)) / 100
  const color = toneColor(scoreTone(score))
  // Arc starts at 225° (bottom-left) and runs clockwise to 135°.
  const start = (-135 * Math.PI) / 180
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={styles.dial}
      role="img"
      aria-label={`${label}, ${score} out of 100`}
    >
      <defs>
        <radialGradient id="todayDialGlow" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor={color} stopOpacity={0} />
          <stop offset="100%" stopColor={color} stopOpacity={0.16} />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r + 10} fill="url(#todayDialGlow)" />
      <circle cx={c} cy={c} r={r - 12} fill="var(--surface-2)" />
      {Array.from({ length: 11 }).map((_, i) => {
        const a = start + (i / 10) * SWEEP * Math.PI * 2
        const [x0, y0] = polar(c, c, r + 8, a)
        const [x1, y1] = polar(c, c, r + (i % 5 === 0 ? 13 : 11), a)
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--text-muted)" strokeWidth={i % 5 === 0 ? 1.4 : 0.8} opacity={0.7} />
      })}
      <g transform={`rotate(135 ${c} ${c})`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={10} strokeLinecap="round" strokeDasharray={`${track} ${circ}`} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${value} ${circ}`}
          className={styles.dialArc}
          style={{ ['--dial-len' as string]: value }}
        />
      </g>
      {(() => {
        const [x, y] = polar(c, c, r, start + (score / 100) * SWEEP * Math.PI * 2)
        return <circle cx={x} cy={y} r={4} fill="var(--surface-1)" stroke={color} strokeWidth={2.5} />
      })()}
      <text x={c} y={c + 4} textAnchor="middle" fontSize={34} fontWeight={800} fill={color} style={{ fontFamily: 'var(--font-mono)' }}>
        {score}
      </text>
      <text x={c} y={c + 22} textAnchor="middle" fontSize={9} fontWeight={800} letterSpacing="0.12em" fill={color}>
        {label.toUpperCase()}
      </text>
      <text x={c} y={size - 6} textAnchor="middle" fontSize={8.5} fill="var(--text-muted)">out of 100</text>
    </svg>
  )
}

/** Three quick signals shown next to the dial: Tara, Chandra Bala, Panchang balance. */
export function DaySignals({ r }: { r: TodayReading }) {
  const taraTone: Tone = r.tara.tone === 'supportive' || r.tara.tone === 'transformative' ? 'good' : r.tara.isHard ? 'caution' : 'mixed'
  const moonTone: Tone = r.moon.chandraQuality === 'good' ? 'good' : r.moon.chandraQuality === 'bad' ? 'caution' : 'mixed'
  const pGood = r.panchang.filter(p => p.quality === 'good').length
  const pBad = r.panchang.filter(p => p.quality === 'caution').length
  const pTone: Tone = pGood > pBad + 1 ? 'good' : pBad > pGood ? 'caution' : 'mixed'
  const items: Array<{ k: string; v: string; t: Tone }> = [
    { k: 'Tara', v: r.tara.name, t: taraTone },
    { k: 'Chandra', v: `${ordinal(r.moon.chandraPosition)} from Moon`, t: moonTone },
    { k: 'Panchang', v: `${pGood}/5 supportive`, t: pTone },
  ]
  return (
    <ul className={styles.signals} aria-label="Key signals today">
      {items.map(it => (
        <li key={it.k} className={styles.signal} style={toned(it.t)}>
          <span className={styles.signalKey}>{it.k}</span>
          <span className={styles.signalVal}><span className={styles.dot} />{it.v}</span>
        </li>
      ))}
    </ul>
  )
}

// ── Life areas radar ─────────────────────────────────────────

export function AreasRadar({ r }: { r: TodayReading }) {
  if (r.areas.length < 3) return null
  // Scores cluster around 40–70, so scale to the top score (min 80) to keep the shape readable.
  const top = Math.max(80, ...r.areas.map(a => a.score))
  return (
    <RadarChart
      axes={r.areas.map(a => a.label.split(' & ')[0])}
      series={[{ label: 'Today', values: r.areas.map(a => a.score), color: toneColor(scoreTone(r.score)) }]}
      threshold={r.areas.map(() => 50)}
      max={top}
      size={180}
      ariaLabel={`Life areas: ${r.areas.map(a => `${a.label} ${a.score}`).join(', ')}`}
    />
  )
}

// ── Moon: phase, Tara wheel, Chandra wheel ───────────────────

const TARA_NAMES = ['Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra', 'Ati-Mitra']
const TARA_TONE: Tone[] = ['mixed', 'good', 'caution', 'good', 'caution', 'good', 'caution', 'good', 'good']
const CHANDRA_GOOD = new Set([1, 3, 6, 7, 10, 11])
const CHANDRA_BAD = new Set([4, 8, 12])

function tithiFrom(sunLon: number, moonLon: number): number {
  const elong = ((moonLon - sunLon) % 360 + 360) % 360
  return Math.floor(elong / 12) + 1
}

/** Night-sky Moon disc: ivory light on a dark face, independent of the page theme. */
function MoonDisc({ tithi, size = 86, label }: { tithi: number; size?: number; label: string }) {
  const phase = (tithi / 30) * Math.PI * 2
  const lit = (1 - Math.cos(phase)) / 2
  const waxing = tithi <= 15
  const c = size / 2
  const r = size / 2 - 3
  const rx = Math.abs(Math.cos(phase)) * r
  const outer = waxing ? 1 : 0
  const inner = lit > 0.5 ? (waxing ? 1 : 0) : (waxing ? 0 : 1)
  const d = `M${c},${c - r} A${r},${r} 0 0 ${outer} ${c},${c + r} A${rx},${r} 0 0 ${inner} ${c},${c - r} Z`
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={label}>
      <defs>
        <radialGradient id="todayMoonLight" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fffaf0" />
          <stop offset="100%" stopColor="#e9dcb8" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="#25223a" />
      {tithi === 15
        ? <circle cx={c} cy={c} r={r} fill="url(#todayMoonLight)" />
        : tithi !== 30 && <path d={d} fill="url(#todayMoonLight)" />}
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.18)" />
      <circle cx={c - r * 0.3} cy={c + r * 0.2} r={r * 0.12} fill="#000" opacity={0.06} />
      <circle cx={c + r * 0.25} cy={c - r * 0.3} r={r * 0.08} fill="#000" opacity={0.06} />
    </svg>
  )
}

function ChandraWheel({ position }: { position: number }) {
  const size = 132
  const c = size / 2
  const R = 48
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img" aria-label={`Transit Moon is ${position} houses from your natal Moon`}>
      <circle cx={c} cy={c} r={R} fill="none" stroke="var(--border)" strokeDasharray="2 3" />
      {Array.from({ length: 12 }).map((_, i) => {
        const h = i + 1
        const [x, y] = polar(c, c, R, (i / 12) * Math.PI * 2)
        const tone: Tone = CHANDRA_GOOD.has(h) ? 'good' : CHANDRA_BAD.has(h) ? 'caution' : 'mixed'
        const active = h === position
        return (
          <g key={h}>
            <title>{`${ordinal(h)} from natal Moon`}</title>
            {active && <circle cx={x} cy={y} r={13} fill={toneColor(tone)} opacity={0.22} className={styles.pulse} />}
            <circle cx={x} cy={y} r={active ? 9 : 7} fill={active ? toneColor(tone) : 'var(--surface-2)'} stroke={toneColor(tone)} strokeWidth={active ? 0 : 1.2} />
            <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={active ? 9 : 7.5} fontWeight={700} fill={active ? 'var(--surface-1)' : 'var(--text-secondary)'}>
              {h}
            </text>
          </g>
        )
      })}
      <text x={c} y={c - 4} textAnchor="middle" fontSize={16} fill="var(--gold)">☾</text>
      <text x={c} y={c + 12} textAnchor="middle" fontSize={7.5} letterSpacing="0.08em" fill="var(--text-muted)">NATAL MOON</text>
    </svg>
  )
}

export function MoonVisuals({ r, sun, moon }: { r: TodayReading; sun?: TodayTransitGraha | null; moon?: TodayTransitGraha | null }) {
  const tithi = sun && moon ? tithiFrom(sun.lonSidereal, moon.lonSidereal) : null
  const lit = tithi ? Math.round(((1 - Math.cos((tithi / 30) * Math.PI * 2)) / 2) * 100) : null
  const tithiName = r.panchang.find(p => p.key === 'tithi')?.value
  const tIdx = Math.max(0, Math.min(8, r.tara.taraNumber - 1))
  return (
    <div className={styles.moonViz}>
      {tithi !== null && (
        <figure className={styles.moonVizCell}>
          <div className={styles.moonDisc}>
            <MoonDisc tithi={tithi} label={`${tithiName ?? 'Tithi'}, about ${lit}% lit`} />
          </div>
          <figcaption>
            <strong>{tithiName ?? `Tithi ${tithi}`}</strong>
            <span>{tithi <= 15 ? 'Waxing' : 'Waning'} · {lit}% lit</span>
          </figcaption>
        </figure>
      )}
      <figure className={styles.moonVizCell}>
        <SegmentRing
          size={104}
          thickness={14}
          gapDeg={3}
          showLabels={false}
          centerValue={r.tara.taraNumber}
          centerLabel="of 9"
          ariaLabel={`Tara ${r.tara.taraNumber} of 9: ${r.tara.name}`}
          segments={TARA_NAMES.map((n, i) => ({
            label: n,
            value: 1,
            max: 1,
            color: toneColor(TARA_TONE[i]),
            active: i === tIdx,
            title: `${i + 1}. ${n}`,
          }))}
        />
        <figcaption>
          <strong>{r.tara.name} Tara</strong>
          <span>{r.tara.label}</span>
        </figcaption>
      </figure>
      <figure className={styles.moonVizCell}>
        <ChandraWheel position={r.moon.chandraPosition} />
        <figcaption>
          <strong>Chandra Bala</strong>
          <span>{ordinal(r.moon.chandraPosition)} from natal Moon</span>
        </figcaption>
      </figure>
    </div>
  )
}

// ── Panchang limbs ───────────────────────────────────────────

const LIMB_ICON: Record<PanchangItem['key'], React.ReactNode> = {
  vara: <Sun size={16} aria-hidden />,
  tithi: <Moon size={16} aria-hidden />,
  nakshatra: <Sparkles size={16} aria-hidden />,
  yoga: <InfinityIcon size={16} aria-hidden />,
  karana: <Hourglass size={16} aria-hidden />,
}

export function PanchangLimbs({ items }: { items: PanchangItem[] }) {
  return (
    <ol className={styles.limbs} aria-label="Five limbs of the panchang">
      {items.map(it => (
        <li key={it.key} className={styles.limb} style={toned(it.quality)}>
          <span className={styles.limbIcon}>{LIMB_ICON[it.key]}</span>
          <span className={styles.limbLabel}>{it.label}</span>
          <span className={styles.limbValue}>{it.value.split(' · ')[0]}</span>
        </li>
      ))}
    </ol>
  )
}

// ── 24h day dial ─────────────────────────────────────────────

function hoursIn(iso: string, tz: string): number {
  const d = new Date(iso)
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz }).formatToParts(d)
    const h = Number(parts.find(p => p.type === 'hour')?.value ?? 0)
    const m = Number(parts.find(p => p.type === 'minute')?.value ?? 0)
    return h + m / 60
  } catch {
    return d.getHours() + d.getMinutes() / 60
  }
}

export function DayDial({ r, segments, tz, now }: { r: TodayReading; segments?: HoraSegment[]; tz: string; now: Date }) {
  const windows: DialWindow[] = []
  segments?.forEach(s => {
    windows.push({
      key: `h-${s.startIso}`,
      start: hoursIn(s.startIso, tz),
      end: hoursIn(s.endIso, tz),
      color: toneColor(s.tone),
      label: `${s.lordName} hora · ${fmtTime(s.startIso, tz)}–${fmtTime(s.endIso, tz)}`,
      ring: 0,
    })
  })
  r.windows.good.forEach(w => windows.push({
    key: `g-${w.label}-${w.startIso}`,
    start: hoursIn(w.startIso, tz),
    end: hoursIn(w.endIso, tz),
    color: 'var(--teal)',
    label: `${w.label} · ${fmtTime(w.startIso, tz)}–${fmtTime(w.endIso, tz)}`,
    ring: 1,
  }))
  r.windows.avoid.forEach(w => windows.push({
    key: `a-${w.label}-${w.startIso}`,
    start: hoursIn(w.startIso, tz),
    end: hoursIn(w.endIso, tz),
    color: 'var(--rose)',
    label: `${w.label} · ${fmtTime(w.startIso, tz)}–${fmtTime(w.endIso, tz)}`,
    ring: 1,
  }))
  if (windows.length === 0) return null

  const sunrise = segments?.[0] ? hoursIn(segments[0].startIso, tz) : undefined
  const sunset = segments && segments.length >= 13 ? hoursIn(segments[12].startIso, tz) : undefined
  const cur = r.windows.currentHora

  return (
    <div className={styles.dayDial}>
      <ClockDial
        windows={windows}
        now={hoursIn(now.toISOString(), tz)}
        sunrise={sunrise}
        sunset={sunset}
        size={220}
        centerTop={fmtTime(now.toISOString(), tz)}
        centerBottom={cur ? cur.label : 'now'}
      />
      <Legend
        items={[
          ...(segments?.length ? [{ label: 'Outer ring: horas (colour = quality)', color: 'var(--amber)' }] : []),
          { label: 'Good window', color: 'var(--teal)' },
          { label: 'Avoid starting', color: 'var(--rose)' },
        ]}
      />
    </div>
  )
}
