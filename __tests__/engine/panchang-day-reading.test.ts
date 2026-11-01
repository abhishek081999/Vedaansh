import { describe, expect, it } from 'vitest'
import { buildDayReading, type DayReadingInput } from '@/lib/panchang/day-reading'
import type { PanchangDayTimeline, TimelineSegment } from '@/lib/panchang/day-timeline'

const SUNRISE = '2026-11-02T01:00:00.000Z'
const SUNSET = '2026-11-02T12:00:00.000Z'
const WINDOW_END = '2026-11-03T01:00:00.000Z'

function whole(label: string): TimelineSegment[] {
  return [{ start: SUNRISE, end: WINDOW_END, label }]
}

function timeline(overrides: Partial<PanchangDayTimeline> = {}): PanchangDayTimeline {
  return {
    windowStart: SUNRISE,
    windowEnd: WINDOW_END,
    sunrise: SUNRISE,
    sunset: SUNSET,
    boundaryTimes: [],
    tithi: whole('Ashtami'),
    nakshatra: whole('Ashlesha'),
    yoga: whole('Shubha'),
    karana: whole('Kaulava'),
    vara: { name: 'Monday', sanskrit: 'Somavara' },
    ...overrides,
  }
}

const BASE: DayReadingInput = {
  tithiNumber: 23, // Krishna Ashtami, a Jaya tithi
  nakshatraIndex: 8,
  nakshatraPada: 2,
  yogaName: 'Shubha',
  karanaName: 'Kaulava',
  varaNumber: 1,
}

describe('buildDayReading', () => {
  it('reads a day with only supportive limbs as favourable', () => {
    const reading = buildDayReading({ ...BASE, timeline: timeline() })
    expect(reading.tone).toBe('favourable')
    expect(reading.signals.every((s) => s.positive)).toBe(true)
    expect(reading.shifts).toEqual([])
  })

  it('draws favours and cautions from every limb table', () => {
    const reading = buildDayReading(BASE)
    expect(reading.favours.map((l) => l.limb)).toEqual(['Tithi', 'Nakshatra', 'Yoga', 'Vara'])
    expect(reading.cautions.map((l) => l.limb)).toEqual(['Yoga', 'Karana', 'Vara'])
    expect(reading.favours.every((l) => l.text.length > 0)).toBe(true)
  })

  it('counts Bhadra that begins in daylight even though noon is clear', () => {
    const reading = buildDayReading({
      ...BASE,
      timeline: timeline({
        karana: [
          { start: SUNRISE, end: '2026-11-02T09:00:00.000Z', label: 'Kaulava' },
          { start: '2026-11-02T09:00:00.000Z', end: WINDOW_END, label: 'Vishti', sub: 'Bhadra' },
        ],
      }),
    })
    expect(reading.tone).toBe('mixed')
    expect(reading.signals).toContainEqual({ label: 'Vishti karana (Bhadra)', positive: false })
    expect(reading.shifts).toHaveLength(1)
    expect(reading.shifts[0]).toMatchObject({ limb: 'Karana', from: 'Kaulava', to: 'Vishti', caution: true })
  })

  it('ignores a Bhadra that only begins after sunset', () => {
    const reading = buildDayReading({
      ...BASE,
      timeline: timeline({
        karana: [
          { start: SUNRISE, end: '2026-11-02T18:00:00.000Z', label: 'Kaulava' },
          { start: '2026-11-02T18:00:00.000Z', end: WINDOW_END, label: 'Vishti', sub: 'Bhadra' },
        ],
      }),
    })
    expect(reading.tone).toBe('favourable')
    expect(reading.shifts).toEqual([])
  })

  it('turns cautious when several limbs argue against the day', () => {
    const reading = buildDayReading({ ...BASE, yogaName: 'Vyatipata', karanaName: 'Vishti' })
    expect(reading.tone).toBe('cautious')
  })

  it('orders shifts by time across limbs', () => {
    const reading = buildDayReading({
      ...BASE,
      timeline: timeline({
        tithi: [
          { start: SUNRISE, end: '2026-11-02T07:41:00.000Z', label: 'Ashtami' },
          { start: '2026-11-02T07:41:00.000Z', end: WINDOW_END, label: 'Navami' },
        ],
        yoga: [
          { start: SUNRISE, end: '2026-11-02T06:36:00.000Z', label: 'Shubha' },
          { start: '2026-11-02T06:36:00.000Z', end: WINDOW_END, label: 'Shukla' },
        ],
      }),
    })
    expect(reading.shifts.map((s) => s.to)).toEqual(['Shukla', 'Navami'])
  })

  it('flags Vish Yoga as cautious regardless of other limbs', () => {
    const reading = buildDayReading({ ...BASE, tithiNumber: 7, nakshatraIndex: 0, varaNumber: 2 })
    expect(reading.tone).toBe('cautious')
    expect(reading.cautions.some((l) => l.text.includes('Vish Yoga'))).toBe(true)
  })
})
