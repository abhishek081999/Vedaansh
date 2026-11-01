'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/home/LandingTodaySky.tsx
//  Live panchang band under the hero, fed by the hero's sky fetch
// ─────────────────────────────────────────────────────────────

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GRAHA_NAMES, type GrahaId } from '@/types/astrology'
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

type LandingTodaySkyProps = {
  sky: TodaySky | null
  failed: boolean
  onNavigate: () => void
}

export function LandingTodaySky({ sky, failed, onNavigate }: LandingTodaySkyProps) {
  if (failed) return null

  const p = sky?.panchang
  const hora = sky && sky.horaIndex >= 0 ? p?.horaTable[sky.horaIndex] : undefined
  const tiles = p
    ? [
        { label: 'Tithi', value: p.tithi.name, sub: p.tithi.paksha === 'shukla' ? 'Shukla paksha' : 'Krishna paksha' },
        { label: 'Nakshatra', value: p.nakshatra.name, sub: `Pada ${p.nakshatra.pada}` },
        { label: 'Yoga', value: p.yoga.name, sub: `Karana ${p.karana.name}` },
        { label: 'Sunrise', value: fmtTime(p.sunrise), sub: `Sunset ${fmtTime(p.sunset)}` },
        { label: 'Rahu Kalam', value: fmtTime(p.rahuKalam.start), sub: `until ${fmtTime(p.rahuKalam.end)}` },
        {
          label: 'Abhijit',
          value: fmtTime(p.abhijitMuhurta.start),
          sub: `until ${fmtTime(p.abhijitMuhurta.end)}`,
        },
      ]
    : []

  return (
    <section className={styles.sky} aria-label="Today's panchang" aria-busy={!p}>
      <div className={styles.skyHead}>
        <div>
          <p className={styles.eyebrow}>
            <span className={styles.liveDot} aria-hidden />
            Today&rsquo;s sky
          </p>
          <p className={styles.skyPlace}>
            {p ? `${p.vara.sanskrit} in ${SKY_REFERENCE.label}` : `Loading ${SKY_REFERENCE.label}`}
            {hora ? ` · ${GRAHA_NAMES[hora.lord as GrahaId] ?? hora.lord} hora` : ''}
          </p>
        </div>
        <Link href="/panchang" className={styles.textLink} onClick={onNavigate}>
          Panchang for your city
          <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
        </Link>
      </div>
      <dl className={styles.skyGrid}>
        {p
          ? tiles.map((tile) => (
              <div key={tile.label} className={styles.skyTile}>
                <dt>{tile.label}</dt>
                <dd>
                  <strong>{tile.value}</strong>
                  <span>{tile.sub}</span>
                </dd>
              </div>
            ))
          : Array.from({ length: 6 }, (_, i) => <div key={i} className={`${styles.skyTile} ${styles.skySkeleton}`} />)}
      </dl>
    </section>
  )
}
