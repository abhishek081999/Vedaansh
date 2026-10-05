/**
 * src/lib/engine/muhurtaWindows.ts
 * Assemble classical avoid / favorable muhurta windows for display.
 * Scoring still uses boolean “is in window” flags at a point in time.
 */

import {
  getDurMuhurat,
  getGodhuliMuhurat,
  type TimeWindow,
} from '@/lib/panchang/muhurta-extra'

export interface LabeledWindow {
  label: string
  start: Date
  end: Date
  kind: 'favorable' | 'avoid'
}

/** Brahma Muhurta: commonly ~96–48 minutes before local sunrise (same as panchang API). */
export function getBrahmaMuhurta(sunrise: Date): TimeWindow {
  return {
    start: new Date(sunrise.getTime() - 96 * 60 * 1000),
    end: new Date(sunrise.getTime() - 48 * 60 * 1000),
  }
}

export interface MuhurtaWindowInputs {
  sunrise: Date
  sunset: Date
  rahuKalam: TimeWindow
  gulikaKalam: TimeWindow
  yamaganda?: TimeWindow | null
  abhijitMuhurta: TimeWindow | null
}

/**
 * Build labeled avoid + favorable windows for a civil day.
 */
export function assembleMuhurtaWindows(input: MuhurtaWindowInputs): {
  favorable: LabeledWindow[]
  avoid: LabeledWindow[]
} {
  const [dur1, dur2] = getDurMuhurat(input.sunrise, input.sunset)
  const godhuli = getGodhuliMuhurat(input.sunset)
  const brahma = getBrahmaMuhurta(input.sunrise)

  const favorable: LabeledWindow[] = [
    { label: 'Brahma Muhurta', start: brahma.start, end: brahma.end, kind: 'favorable' },
    { label: 'Godhuli', start: godhuli.start, end: godhuli.end, kind: 'favorable' },
  ]
  if (input.abhijitMuhurta) {
    favorable.unshift({
      label: 'Abhijit',
      start: input.abhijitMuhurta.start,
      end: input.abhijitMuhurta.end,
      kind: 'favorable',
    })
  }

  const avoid: LabeledWindow[] = [
    { label: 'Rahu Kalam', start: input.rahuKalam.start, end: input.rahuKalam.end, kind: 'avoid' },
    { label: 'Gulika', start: input.gulikaKalam.start, end: input.gulikaKalam.end, kind: 'avoid' },
    { label: 'Dur Muhurat', start: dur1.start, end: dur1.end, kind: 'avoid' },
    { label: 'Dur Muhurat', start: dur2.start, end: dur2.end, kind: 'avoid' },
  ]
  if (input.yamaganda) {
    avoid.splice(2, 0, {
      label: 'Yamaganda',
      start: input.yamaganda.start,
      end: input.yamaganda.end,
      kind: 'avoid',
    })
  }

  return { favorable, avoid }
}

/** Format a window for UI lists: "Label: 10:30 AM - 12:00 PM" */
export function formatWindowLabel(
  w: LabeledWindow,
  fmtTime: (d: Date) => string,
): string {
  return `${w.label}: ${fmtTime(w.start)} - ${fmtTime(w.end)}`
}

/**
 * Parse ISO (or Date) windows from panchang API payloads into Date objects.
 */
export function parseTimeWindow(
  w: { start: string | Date; end: string | Date } | null | undefined,
): TimeWindow | null {
  if (!w) return null
  return {
    start: w.start instanceof Date ? w.start : new Date(w.start),
    end: w.end instanceof Date ? w.end : new Date(w.end),
  }
}
