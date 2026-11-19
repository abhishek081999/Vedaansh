// ─────────────────────────────────────────────────────────────
//  src/lib/engine/yogataras.ts
//  The 27 nakshatra yogataras (junction stars) with J2000 equatorial
//  coordinates, precessed to a date (IAU 1976). Pure, no ephemeris
//  files needed; accuracy is well under a map pixel.
// ─────────────────────────────────────────────────────────────

const RAD = Math.PI / 180
const ARCSEC = RAD / 3600

export interface Yogatara {
  /** Nakshatra index, 0 = Ashwini … 26 = Revati. */
  nakshatraIndex: number
  /** Bayer designation, for display next to the nakshatra name. */
  star: string
  /** J2000 right ascension and declination, degrees. */
  ra2000: number
  dec2000: number
}

function hms(h: number, m: number, s: number): number {
  return (h + m / 60 + s / 3600) * 15
}
function dms(sign: 1 | -1, d: number, m: number, s: number): number {
  return sign * (d + m / 60 + s / 3600)
}

export const YOGATARAS: Yogatara[] = [
  { nakshatraIndex: 0, star: 'β Ari', ra2000: hms(1, 54, 38.4), dec2000: dms(1, 20, 48, 29) },
  { nakshatraIndex: 1, star: '35 Ari', ra2000: hms(2, 43, 27.1), dec2000: dms(1, 27, 42, 26) },
  { nakshatraIndex: 2, star: 'η Tau', ra2000: hms(3, 47, 29.1), dec2000: dms(1, 24, 6, 18) },
  { nakshatraIndex: 3, star: 'α Tau', ra2000: hms(4, 35, 55.2), dec2000: dms(1, 16, 30, 33) },
  { nakshatraIndex: 4, star: 'λ Ori', ra2000: hms(5, 35, 8.3), dec2000: dms(1, 9, 56, 3) },
  { nakshatraIndex: 5, star: 'α Ori', ra2000: hms(5, 55, 10.3), dec2000: dms(1, 7, 24, 25) },
  { nakshatraIndex: 6, star: 'β Gem', ra2000: hms(7, 45, 18.9), dec2000: dms(1, 28, 1, 34) },
  { nakshatraIndex: 7, star: 'δ Cnc', ra2000: hms(8, 44, 41.1), dec2000: dms(1, 18, 9, 15) },
  { nakshatraIndex: 8, star: 'ε Hya', ra2000: hms(8, 46, 46.5), dec2000: dms(1, 6, 25, 8) },
  { nakshatraIndex: 9, star: 'α Leo', ra2000: hms(10, 8, 22.3), dec2000: dms(1, 11, 58, 2) },
  { nakshatraIndex: 10, star: 'δ Leo', ra2000: hms(11, 14, 6.5), dec2000: dms(1, 20, 31, 25) },
  { nakshatraIndex: 11, star: 'β Leo', ra2000: hms(11, 49, 3.6), dec2000: dms(1, 14, 34, 19) },
  { nakshatraIndex: 12, star: 'δ Crv', ra2000: hms(12, 29, 51.9), dec2000: dms(-1, 16, 30, 56) },
  { nakshatraIndex: 13, star: 'α Vir', ra2000: hms(13, 25, 11.6), dec2000: dms(-1, 11, 9, 41) },
  { nakshatraIndex: 14, star: 'α Boo', ra2000: hms(14, 15, 39.7), dec2000: dms(1, 19, 10, 57) },
  { nakshatraIndex: 15, star: 'α Lib', ra2000: hms(14, 50, 52.7), dec2000: dms(-1, 16, 2, 30) },
  { nakshatraIndex: 16, star: 'δ Sco', ra2000: hms(16, 0, 20.0), dec2000: dms(-1, 22, 37, 18) },
  { nakshatraIndex: 17, star: 'α Sco', ra2000: hms(16, 29, 24.5), dec2000: dms(-1, 26, 25, 55) },
  { nakshatraIndex: 18, star: 'λ Sco', ra2000: hms(17, 33, 36.5), dec2000: dms(-1, 37, 6, 14) },
  { nakshatraIndex: 19, star: 'δ Sgr', ra2000: hms(18, 20, 59.6), dec2000: dms(-1, 29, 49, 41) },
  { nakshatraIndex: 20, star: 'σ Sgr', ra2000: hms(18, 55, 15.9), dec2000: dms(-1, 26, 17, 48) },
  { nakshatraIndex: 21, star: 'α Aql', ra2000: hms(19, 50, 47.0), dec2000: dms(1, 8, 52, 6) },
  { nakshatraIndex: 22, star: 'β Del', ra2000: hms(20, 37, 32.9), dec2000: dms(1, 14, 35, 43) },
  { nakshatraIndex: 23, star: 'λ Aqr', ra2000: hms(22, 52, 36.9), dec2000: dms(-1, 7, 34, 47) },
  { nakshatraIndex: 24, star: 'α Peg', ra2000: hms(23, 4, 45.7), dec2000: dms(1, 15, 12, 19) },
  { nakshatraIndex: 25, star: 'γ Peg', ra2000: hms(0, 13, 14.2), dec2000: dms(1, 15, 11, 1) },
  { nakshatraIndex: 26, star: 'ζ Psc', ra2000: hms(1, 13, 43.9), dec2000: dms(1, 7, 34, 31) },
]

/** Precess J2000 equatorial coordinates to the mean equator and equinox of `jd` (IAU 1976). */
export function precessFromJ2000(ra2000: number, dec2000: number, jd: number): { ra: number; dec: number } {
  const T = (jd - 2451545.0) / 36525
  const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T ** 3) * ARCSEC
  const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T ** 3) * ARCSEC
  const theta = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T ** 3) * ARCSEC
  const a0 = ra2000 * RAD
  const d0 = dec2000 * RAD
  const A = Math.cos(d0) * Math.sin(a0 + zeta)
  const B = Math.cos(theta) * Math.cos(d0) * Math.cos(a0 + zeta) - Math.sin(theta) * Math.sin(d0)
  const C = Math.sin(theta) * Math.cos(d0) * Math.cos(a0 + zeta) + Math.cos(theta) * Math.sin(d0)
  const ra = ((Math.atan2(A, B) + z) / RAD + 360) % 360
  return { ra, dec: Math.asin(Math.max(-1, Math.min(1, C))) / RAD }
}

export function yogatarasAt(jd: number): (Yogatara & { ra: number; dec: number })[] {
  return YOGATARAS.map(y => ({ ...y, ...precessFromJ2000(y.ra2000, y.dec2000, jd) }))
}
