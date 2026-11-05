import { describe, expect, it } from 'vitest'
import { findEclipses } from '@/lib/engine/eclipses'

const DELHI = { lat: 28.6139, lng: 77.209 }
const ist = (iso?: string) => (iso ? new Date(new Date(iso).getTime() + 5.5 * 3600_000).toISOString().slice(0, 16) : '')

describe('eclipse finder', () => {
  const list = findEclipses(new Date('2025-01-01'), new Date('2027-12-31'), DELHI)

  it('finds the known 2025–2027 eclipses', () => {
    // NASA eclipse catalogue: 2025-03-14 TL, 2025-03-29 PS, 2025-09-07 TL, 2025-09-21 PS, 2026-02-17 AS,
    // 2026-03-03 TL, 2026-08-12 TS, 2026-08-28 PL, 2027-02-06 AS, 2027-02-20 NL, 2027-07-18 NL, 2027-08-02 TS, 2027-08-17 NL
    expect(list.map((e) => `${e.max.slice(0, 10)} ${e.kind[0]}${e.type[0]}`)).toEqual([
      '2025-03-14 lt', '2025-03-29 sp', '2025-09-07 lt', '2025-09-21 sp', '2026-02-17 sa', '2026-03-03 lt',
      '2026-08-12 st', '2026-08-28 lp', '2027-02-06 sa', '2027-02-20 lp', '2027-07-18 lp', '2027-08-02 st', '2027-08-17 lp',
    ])
  })

  it('7 Sep 2025 total lunar eclipse: visible from Delhi, 21:57–01:26 IST, sutak from 12:57', () => {
    const e = list.find((x) => x.max.startsWith('2025-09-07'))!
    expect(e.local.visible).toBe(true)
    expect(ist(e.local.start)).toBe('2025-09-07T21:57')
    expect(ist(e.local.end)).toBe('2025-09-08T01:26')
    expect(ist(e.local.sutakStart)).toBe('2025-09-07T12:57')
  })

  it('3 Mar 2026: already eclipsed at moonrise in Delhi; sutak from ~6:20 AM IST', () => {
    const e = list.find((x) => x.max.startsWith('2026-03-03'))!
    expect(e.local.visible).toBe(true)
    expect(e.local.inProgressAtRise).toBe(true)
    expect(ist(e.local.sutakStart)).toBe('2026-03-03T06:20')
  })

  it('penumbral lunar eclipses have no sutak; invisible eclipses have no local times', () => {
    for (const e of list.filter((x) => x.type === 'penumbral')) expect(e.local.sutakStart).toBeUndefined()
    for (const e of list.filter((x) => !x.local.visible)) expect(e.local.start).toBeUndefined()
  })
})
