// __tests__/engine/dinmanMuhurta.test.ts
import { describe, it, expect } from 'vitest'
import { getDinmanRatriman, formatDinmanSlotLabel } from '@/lib/engine/dinmanMuhurta'
import { sanskarasByCategory, SANSKARAS } from '@/lib/engine/sanskaras'

describe('dinmanMuhurta', () => {
  const sunrise = new Date('2026-03-20T01:00:00.000Z') // ~06:30 IST
  const sunset  = new Date('2026-03-20T13:00:00.000Z') // ~18:30 IST — 12h day

  it('builds 15 day and 15 night slots', () => {
    const r = getDinmanRatriman(sunrise, sunset, { now: new Date('2026-03-20T02:00:00.000Z') })
    expect(r.daySlots).toHaveLength(15)
    expect(r.nightSlots).toHaveLength(15)
    expect(r.daySlots[7].nakName).toBe('Abhijit')
    expect(r.daySlots[0].nakName).toBe('Ardra')
    expect(r.nightSlots[4].nakName).toBe('Ashwini')
  })

  it('marks current slot and next favourable', () => {
    // Mid first day slot
    const now = new Date(sunrise.getTime() + 20 * 60 * 1000)
    const r = getDinmanRatriman(sunrise, sunset, { now })
    expect(r.current?.slot).toBe(1)
    expect(r.current?.period).toBe('day')
    expect(r.current?.nakName).toBe('Ardra')
    expect(r.nextFavourable).toBeTruthy()
    expect(formatDinmanSlotLabel(r.current!)).toMatch(/Dinman #1/)
  })

  it('uses equal divisions of day length', () => {
    const r = getDinmanRatriman(sunrise, sunset)
    const unit = (sunset.getTime() - sunrise.getTime()) / 15
    expect(r.daySlots[0].end.getTime() - r.daySlots[0].start.getTime()).toBe(unit)
    expect(r.daySlots[14].end.getTime()).toBe(sunset.getTime())
  })
})

describe('sanskaras', () => {
  it('lists 16 samskaras across 5 categories', () => {
    expect(SANSKARAS).toHaveLength(16)
    const groups = sanskarasByCategory()
    expect(groups).toHaveLength(5)
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(16)
    expect(SANSKARAS.filter((s) => s.commonlyPracticed).map((s) => s.id)).toEqual(
      expect.arrayContaining(['namakarana', 'vivaha', 'antyeshti']),
    )
  })
})
