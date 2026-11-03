'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingTodaySky.tsx
//  Live panchang band under the hero — graphic sky strip
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GRAHA_NAMES, type GrahaId } from '@/types/astrology'
import { moonLitPath } from '@/lib/panchang/moon-phase'
import { SKY_REFERENCE, type TodaySky } from '@/components/home/LandingCosmicWheel'
import styles from '@/components/home/LandingSections.module.css'

function fmtTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: SKY_REFERENCE.tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

type SkyTone = 'caution' | 'good'
type SkyMark = 'moon' | 'star' | 'knot' | 'sun' | 'rahu' | 'peak'

type SkyTile = {
  label: string
  value: string
  sub: string
  mark: SkyMark
  tone?: SkyTone
}

type LandingTodaySkyProps = {
  sky: TodaySky | null
  failed: boolean
  onNavigate: () => void
}

function SkyMarkIcon({ mark }: { mark: SkyMark }) {
  const common = { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': true as const }
  switch (mark) {
    case 'moon':
      return (
        <svg {...common}>
          <path
            d="M10.2 2.2a5.8 5.8 0 1 0 3.6 10.4A6.2 6.2 0 1 1 10.2 2.2Z"
            fill="currentColor"
            opacity="0.92"
          />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path
            d="M8 1.4l1.55 3.55 3.85.4-2.9 2.55.86 3.78L8 9.7l-3.36 1.98.86-3.78-2.9-2.55 3.85-.4L8 1.4Z"
            fill="currentColor"
          />
        </svg>
      )
    case 'knot':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.35" />
          <path d="M8 2.8v10.4M2.8 8h10.4" stroke="currentColor" strokeWidth="1.15" />
        </svg>
      )
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="3.1" fill="currentColor" />
          <path
            d="M8 1.2v1.7M8 13.1v1.7M1.2 8h1.7M13.1 8h1.7M3.1 3.1l1.2 1.2M11.7 11.7l1.2 1.2M12.9 3.1l-1.2 1.2M4.3 11.7l-1.2 1.2"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'rahu':
      return (
        <svg {...common}>
          <path
            d="M2.4 10.8c1.6-3.4 4-5.4 5.6-5.4s4 2 5.6 5.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          <circle cx="8" cy="5.2" r="2.1" fill="currentColor" />
        </svg>
      )
    case 'peak':
      return (
        <svg {...common}>
          <path d="M8 2.2 13.2 13H2.8L8 2.2Z" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
          <circle cx="8" cy="9.2" r="1.35" fill="currentColor" />
        </svg>
      )
  }
}

function SkyMoonArt({
  elongation,
  paksha,
  tithiName,
}: {
  elongation: number
  paksha: 'shukla' | 'krishna'
  tithiName: string
}) {
  const r = 28
  const lit = moonLitPath(elongation, r)
  return (
    <div className={styles.skyArt} aria-hidden>
      <svg className={styles.skyArtSvg} viewBox="0 0 120 120" role="presentation">
        <defs>
          <radialGradient id="skyMoonGlow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.28" />
            <stop offset="55%" stopColor="var(--gold)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className={styles.skyOrbit} cx="60" cy="60" r="54" />
        <circle className={styles.skyOrbit} cx="60" cy="60" r="44" />
        <circle cx="60" cy="60" r="38" fill="url(#skyMoonGlow)" />
        <g transform="translate(60 60)">
          <circle cx="0" cy="0" r={r} className={styles.skyMoonDark} />
          <path d={lit} className={styles.skyMoonLit} />
          <circle cx="0" cy="0" r={r} className={styles.skyMoonEdge} fill="none" />
        </g>
        <circle className={styles.skyOrbitDot} cx="60" cy="6" r="2.2" />
        <circle className={styles.skyOrbitDot} cx="114" cy="60" r="1.6" />
      </svg>
      <div className={styles.skyArtMeta}>
        <span className={styles.skyArtPaksha}>{paksha === 'shukla' ? 'Shukla' : 'Krishna'}</span>
        <strong>{tithiName}</strong>
      </div>
    </div>
  )
}

export function LandingTodaySky({ sky, failed, onNavigate }: LandingTodaySkyProps) {
  if (failed) return null

  const p = sky?.panchang
  const hora = sky && sky.horaIndex >= 0 ? p?.horaTable[sky.horaIndex] : undefined
  const horaLord = hora ? (GRAHA_NAMES[hora.lord as GrahaId] ?? hora.lord) : null
  const tiles: SkyTile[] = p
    ? [
        { label: 'Tithi', value: p.tithi.name, sub: p.tithi.paksha === 'shukla' ? 'Shukla paksha' : 'Krishna paksha', mark: 'moon' },
        { label: 'Nakshatra', value: p.nakshatra.name, sub: `Pada ${p.nakshatra.pada}`, mark: 'star' },
        { label: 'Yoga', value: p.yoga.name, sub: `Karana ${p.karana.name}`, mark: 'knot' },
        { label: 'Sunrise', value: fmtTime(p.sunrise), sub: `Sunset ${fmtTime(p.sunset)}`, mark: 'sun' },
        {
          label: 'Rahu Kalam',
          value: fmtTime(p.rahuKalam.start),
          sub: `until ${fmtTime(p.rahuKalam.end)}`,
          mark: 'rahu',
          tone: 'caution',
        },
        {
          label: 'Abhijit',
          value: fmtTime(p.abhijitMuhurta.start),
          sub: `until ${fmtTime(p.abhijitMuhurta.end)}`,
          mark: 'peak',
          tone: 'good',
        },
      ]
    : []

  return (
    <section className={styles.sky} aria-label="Today's panchang" aria-busy={!p}>
      <div className={styles.skyGlow} aria-hidden />
      <div className={styles.skyBody}>
        {p ? (
          <SkyMoonArt
            elongation={p.lunarElongationDeg}
            paksha={p.tithi.paksha}
            tithiName={p.tithi.name}
          />
        ) : (
          <div className={`${styles.skyArt} ${styles.skyArtSkeleton}`} aria-hidden />
        )}

        <div className={styles.skyMain}>
          <div className={styles.skyHead}>
            <div className={styles.skyHeadMain}>
              <div className={styles.skyEyebrow}>
                <span className={styles.liveDot} aria-hidden />
                Today&rsquo;s sky
              </div>
              <div className={styles.skyPlace}>
                {p ? p.vara.sanskrit : `Loading ${SKY_REFERENCE.label}`}
              </div>
              <div className={styles.skyMetaRow}>
                <span className={styles.skyPlaceChip}>{SKY_REFERENCE.label}</span>
                {horaLord ? <span className={styles.skyHoraChip}>{horaLord} hora</span> : null}
              </div>
            </div>
            <Link href="/panchang" className={styles.skyLink} onClick={onNavigate}>
              Panchang for your city
              <ArrowRight size={14} strokeWidth={2.25} aria-hidden className={styles.skyLinkIcon} />
            </Link>
          </div>

          <dl className={styles.skyGrid}>
            {p
              ? tiles.map((tile, i) => (
                  <div
                    key={tile.label}
                    className={[
                      styles.skyTile,
                      tile.tone === 'caution' ? styles.skyTileCaution : '',
                      tile.tone === 'good' ? styles.skyTileGood : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ ['--sky-i' as string]: i }}
                  >
                    <dt>
                      <span className={styles.skyMark}>
                        <SkyMarkIcon mark={tile.mark} />
                      </span>
                      {tile.label}
                    </dt>
                    <dd>
                      <strong>{tile.value}</strong>
                      <span>{tile.sub}</span>
                    </dd>
                  </div>
                ))
              : Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className={`${styles.skyTile} ${styles.skySkeleton}`}
                    style={{ ['--sky-i' as string]: i }}
                    aria-hidden
                  />
                ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
