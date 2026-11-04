// ─────────────────────────────────────────────────────────────
//  src/components/horoscope/RashiIcon.tsx
//  Indian-style pictorial rashi marks (original line art, 24×24):
//  Mesha ram, Vrishabha bull, Mithuna twins, Karka crab, Simha lion,
//  Kanya maiden with grain, Tula scales, Vrishchika scorpion,
//  Dhanu bow, Makara, Kumbha pot, Meena two fish.
//  <RashiGlyph> draws into an existing SVG; <RashiIcon> is standalone.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'

/** Lion's mane: a 24-point zigzag ring. */
const MANE = (() => {
  const pts: string[] = []
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    const r = i % 2 === 0 ? 9.6 : 7.4
    pts.push(`${(12 + r * Math.sin(a)).toFixed(2)} ${(12.5 - r * Math.cos(a)).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
})()

const ART: Record<Rashi, React.ReactNode> = {
  // Mesha — ram's head with curled horns
  1: (
    <>
      <path d="M9 7.2C6.2 3 1.4 4.6 2.3 8.8c.6 2.8 4.2 2.6 4-.2" />
      <path d="M15 7.2c2.8-4.2 7.6-2.6 6.7 1.6-.6 2.8-4.2 2.6-4-.2" />
      <path d="M9 7q3-1.6 6 0l-.6 8q-2.4 5.2-4.8 0Z" />
      <path d="M11 17.6h2" />
      <circle cx="10.4" cy="10.4" r=".55" fill="currentColor" stroke="none" />
      <circle cx="13.6" cy="10.4" r=".55" fill="currentColor" stroke="none" />
    </>
  ),
  // Vrishabha — bull's head, upswept horns
  2: (
    <>
      <path d="M7.2 8.6C4 8.6 2.8 5.6 3.8 2.8" />
      <path d="M16.8 8.6c3.2 0 4.4-3 3.4-5.8" />
      <path d="M7 8q5-2 10 0l-1 7.2Q14.6 20 12 20t-4-4.8Z" />
      <path d="M7.2 10.4 4 11.6M16.8 10.4 20 11.6" />
      <circle cx="10.6" cy="17.2" r=".6" fill="currentColor" stroke="none" />
      <circle cx="13.4" cy="17.2" r=".6" fill="currentColor" stroke="none" />
      <circle cx="9.8" cy="11.4" r=".55" fill="currentColor" stroke="none" />
      <circle cx="14.2" cy="11.4" r=".55" fill="currentColor" stroke="none" />
    </>
  ),
  // Mithuna — twin figures, hands joined
  3: (
    <>
      <circle cx="8" cy="4.6" r="2" />
      <circle cx="16" cy="4.6" r="2" />
      <path d="M8 6.8v7.4M16 6.8v7.4" />
      <path d="m8 14.2-2 6.4M8 14.2l2 6.4M16 14.2l-2 6.4M16 14.2l2 6.4" />
      <path d="M4.4 11.6 8 9h8l3.6 2.6" />
    </>
  ),
  // Karka — crab
  4: (
    <>
      <ellipse cx="12" cy="14.2" rx="6" ry="3.9" />
      <path d="M7.2 12.2C4.2 11.2 3 8.4 4.4 6m0 0-1.6-1.6M4.4 6l1.4-1.4" />
      <path d="M16.8 12.2c3-1 4.2-3.8 2.8-6.2m0 0 1.6-1.6M19.6 6l-1.4-1.4" />
      <path d="m6.6 15.6-3.2 2M7.8 17.4l-2.6 2.8M17.4 15.6l3.2 2M16.2 17.4l2.6 2.8" />
      <path d="M10.4 10.6V8.8M13.6 10.6V8.8" />
    </>
  ),
  // Simha — lion's face in a mane
  5: (
    <>
      <path d={MANE} />
      <circle cx="12" cy="13" r="4.8" />
      <circle cx="10.2" cy="11.8" r=".55" fill="currentColor" stroke="none" />
      <circle cx="13.8" cy="11.8" r=".55" fill="currentColor" stroke="none" />
      <path d="M11 14.2h2l-1 1.2Zm1 1.2v.9m-1.6.6q1.6 1 3.2 0" />
    </>
  ),
  // Kanya — maiden holding a sheaf of grain
  6: (
    <>
      <circle cx="10.5" cy="4.8" r="2.1" />
      <path d="M8.6 5.4Q8 9 7.4 10.4" />
      <path d="M10.5 7.2 7 20.4h7l-3.5-13.2Z" />
      <path d="m10.5 10.2 4.6 1.4" />
      <path d="m14.6 13 4.8-9.6" />
      <path d="M18.2 6.2c1.4-.2 2-1 2-2M17.4 7.8c-1.2-.4-1.6-1.4-1.4-2.4M19.2 4.6c-.2-1.2.4-2 1.4-2.2" />
    </>
  ),
  // Tula — balance scales
  7: (
    <>
      <circle cx="12" cy="3.6" r="1.1" />
      <path d="M12 4.7v15.1M8.4 20h7.2M4 7.4h16" />
      <path d="M4 7.4 1.6 13.2M4 7.4l2.4 5.8M20 7.4l-2.4 5.8M20 7.4l2.4 5.8" />
      <path d="M1.2 13.2q2.8 3.2 5.6 0ZM17.2 13.2q2.8 3.2 5.6 0Z" />
    </>
  ),
  // Vrishchika — scorpion, tail curled to strike
  8: (
    <>
      <ellipse cx="12" cy="9.8" rx="3" ry="3.6" />
      <path d="M12 13.4c0 4.6 1 7.6 4.6 7.1 3-.5 3-4.5.4-5m0 0-1.2-1.6m1.2 1.6 1.8-.8" />
      <path d="M10 7.4C7 7 5.5 5 6 3m0 0-1.6.3M6 3l.8-1.4" />
      <path d="M14 7.4c3-.4 4.5-2.4 4-4.4m0 0 1.6.3M18 3l-.8-1.4" />
      <path d="m9.2 9.6-3 1M9.2 11.6l-3 2M14.8 9.6l3 1M14.8 11.6l3 2" />
    </>
  ),
  // Dhanu — drawn bow and arrow
  9: (
    <>
      <path d="M6.4 2.6Q19 12 6.4 21.4" />
      <path d="M6.4 2.6 5 12l1.4 9.4" />
      <path d="M2.6 12h18.8m0 0-3-2.2m3 2.2-3 2.2" />
      <path d="M4.2 12 2.6 10.4M4.2 12l-1.6 1.6" />
    </>
  ),
  // Makara — goat-headed sea creature with a curled fish tail
  10: (
    <>
      <path d="M8.2 6.2C8 3.4 10 2 11.4 3" />
      <path d="M4.6 9.4C4.4 6.6 6.8 5 9 6.2l2.2 3c3.2 0 6 2 7 5 1 3 3.8 3.2 3-.4" />
      <path d="M21.2 13.8 22.6 12m-1.4 1.8 2 .8" />
      <path d="M4.6 9.4c1 .8 2 1 2.6 1.6C8.4 15 12 16.2 15 16.2c2 0 3.2-.8 3.2-2" />
      <path d="m8.4 12.4-1 4.4M10.8 13.6v3.6" />
      <circle cx="7" cy="8.2" r=".55" fill="currentColor" stroke="none" />
    </>
  ),
  // Kumbha — water pot with a pouring stream
  11: (
    <>
      <path d="M8.4 7.2h7.2M9.6 7.2v2M14.4 7.2v2" />
      <path d="M9.6 9.2C5.4 11 5.2 18 9 20.2h6c3.8-2.2 3.6-9.2-.6-11Z" />
      <path d="M6.8 14h10.4" />
      <path d="M16.4 6.2c2-1.6 3.6-1.6 4.4.2.6 1.4.2 3-.6 4.4" />
      <path d="M20.2 13.2q.9 1.4 0 2.4-.9-1 0-2.4Z" />
    </>
  ),
  // Meena — two fish swimming opposite ways
  12: (
    <>
      <path d="M3 8c4-4 9.6-4 12.6 0-3 4-8.6 4-12.6 0Z" />
      <path d="m15.6 8 4.6-3.2v6.4Z" />
      <path d="M21 16c-4-4-9.6-4-12.6 0 3 4 8.6 4 12.6 0Z" />
      <path d="M8.4 16 3.8 12.8v6.4Z" />
      <circle cx="6.2" cy="7.4" r=".6" fill="currentColor" stroke="none" />
      <circle cx="17.8" cy="15.4" r=".6" fill="currentColor" stroke="none" />
    </>
  ),
}

/** Draws the rashi mark centred on (cx, cy) inside an existing <svg>. */
export function RashiGlyph({
  rashi,
  cx,
  cy,
  size = 24,
  className,
}: {
  rashi: Rashi
  cx: number
  cy: number
  size?: number
  className?: string
}) {
  const s = size / 24
  return (
    <g
      className={className}
      transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${s})`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.35}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ART[rashi]}
    </g>
  )
}

/** Standalone icon. */
export function RashiIcon({ rashi, size = 24, className }: { rashi: Rashi; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <RashiGlyph rashi={rashi} cx={12} cy={12} />
    </svg>
  )
}
