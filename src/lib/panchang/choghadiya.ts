/**
 * Choghadiya — 8 divisions of daytime and 8 of night, each ruled by a quality.
 * Weekday sets which quality starts the day / night period (North Indian convention).
 */

export const CHOGHADIYA_NAMES = [
  'Udveg',
  'Chal',
  'Labh',
  'Amrit',
  'Rog',
  'Kaal',
  'Shubh',
  'Char',
] as const

export type ChoghadiyaName = (typeof CHOGHADIYA_NAMES)[number]

/** Auspicious for beginnings: Labh, Amrit, Shubh; Char is mixed; rest generally avoided. */
export function choghadiyaQuality(name: ChoghadiyaName): 'good' | 'mixed' | 'avoid' {
  if (name === 'Labh' || name === 'Amrit' || name === 'Shubh') return 'good'
  if (name === 'Char') return 'mixed'
  return 'avoid'
}

/** First daytime choghadiya index (0–7) for Sunday–Saturday */
const DAY_START: number[] = [0, 1, 2, 3, 4, 5, 6]

/** First nighttime choghadiya index (0–7) for Sunday–Saturday */
const NIGHT_START: number[] = [6, 7, 0, 1, 2, 3, 4]

export interface ChoghadiyaSlot {
  name: ChoghadiyaName
  quality: 'good' | 'mixed' | 'avoid'
  start: Date
  end: Date
}

/**
 * Build 8 daytime + 8 nighttime choghadiya slots between sunrise and next sunrise.
 */
export function getChoghadiyaTable(
  sunrise: Date,
  sunset: Date,
  nextSunrise: Date,
  weekday0Sun: number,
): { day: ChoghadiyaSlot[]; night: ChoghadiyaSlot[] } {
  const dayLen = sunset.getTime() - sunrise.getTime()
  const nightLen = nextSunrise.getTime() - sunset.getTime()
  const daySlot = dayLen / 8
  const nightSlot = nightLen / 8

  const dayStart = DAY_START[weekday0Sun % 7]
  const nightStart = NIGHT_START[weekday0Sun % 7]

  const day: ChoghadiyaSlot[] = []
  for (let i = 0; i < 8; i++) {
    const name = CHOGHADIYA_NAMES[(dayStart + i) % 8]
    day.push({
      name,
      quality: choghadiyaQuality(name),
      start: new Date(sunrise.getTime() + i * daySlot),
      end: new Date(sunrise.getTime() + (i + 1) * daySlot),
    })
  }

  const night: ChoghadiyaSlot[] = []
  for (let i = 0; i < 8; i++) {
    const name = CHOGHADIYA_NAMES[(nightStart + i) % 8]
    night.push({
      name,
      quality: choghadiyaQuality(name),
      start: new Date(sunset.getTime() + i * nightSlot),
      end: new Date(sunset.getTime() + (i + 1) * nightSlot),
    })
  }

  return { day, night }
}
