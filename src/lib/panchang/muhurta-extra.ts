/**
 * Extra muhūrta-style windows used on many North Indian / online pañcāṅgas.
 * Rules are approximate; regional āgamas and printed calendars may differ.
 */

export interface TimeWindow {
  start: Date
  end: Date
}

/**
 * Divide sunrise→sunset into 15 equal parts (≈ “day muhūrtas”).
 * Dur muhūrta: commonly the 6th and 10th segments (0-based: indices 5 and 9).
 */
export function getDurMuhurat(sunrise: Date, sunset: Date): [TimeWindow, TimeWindow] {
  const ms = sunset.getTime() - sunrise.getTime()
  const u = ms / 15
  return [
    {
      start: new Date(sunrise.getTime() + 5 * u),
      end: new Date(sunrise.getTime() + 6 * u),
    },
    {
      start: new Date(sunrise.getTime() + 9 * u),
      end: new Date(sunrise.getTime() + 10 * u),
    },
  ]
}

/**
 * Gōdhūli — “cow-dust” twilight: often taken as the ~24 minutes before local sunset.
 */
export function getGodhuliMuhurat(sunset: Date, minutesBefore = 24): TimeWindow {
  const end = sunset.getTime()
  return {
    start: new Date(end - minutesBefore * 60 * 1000),
    end: new Date(end),
  }
}

/** Rikta tithis: Chaturthī, Navamī, Chaturdaśī in each fortnight → lunar days 4,9,14,19,24,29. */
export function isRiktaTithi(tithiNumber1to30: number): boolean {
  return [4, 9, 14, 19, 24, 29].includes(tithiNumber1to30)
}

export function riktaTithiDescription(): string {
  return 'Ṛkta tithi (Chaturthī, Navamī, Chaturdaśī in śukla and kṛṣṇa pakṣa): classically “empty” for lasting foundations; fine for routine acts in many traditions.'
}
