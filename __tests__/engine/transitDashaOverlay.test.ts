// ─────────────────────────────────────────────────────────────
//  __tests__/engine/transitDashaOverlay.test.ts
//  Vimshottari bands for Cosmic Roadmap overlay
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  toJulianDay,
  getPlanetPosition,
  getAyanamsha,
  toSidereal,
  SWISSEPH_IDS,
} from '@/lib/engine/ephemeris'
import { calcVimshottari } from '@/lib/engine/dasha/vimshottari'
import {
  buildTransitDashaOverlay,
  dashaLordsAt,
  formatDashaPathAt,
} from '@/lib/engine/dasha/transitDashaOverlay'

const BIRTH_JD = toJulianDay(1980, 1, 1, 12.0)
const BIRTH_DATE = new Date('1980-01-01T12:00:00Z')

function moonSidereal() {
  const moon = getPlanetPosition(BIRTH_JD, SWISSEPH_IDS.Mo)
  const ayan = getAyanamsha(BIRTH_JD, 'lahiri')
  return toSidereal(moon.longitude, ayan)
}

describe('transitDashaOverlay', () => {
  it('builds non-empty MD/AD bands for a 12-month window', () => {
    const nodes = calcVimshottari(moonSidereal(), BIRTH_DATE, 3)
    const windowStart = new Date('2020-01-01T00:00:00Z')
    const windowEnd = new Date('2021-01-01T00:00:00Z')
    const overlay = buildTransitDashaOverlay(nodes, windowStart, windowEnd, windowStart.getTime())

    expect(overlay.maha.length).toBeGreaterThan(0)
    expect(overlay.antar.length).toBeGreaterThan(0)
    for (const seg of [...overlay.maha, ...overlay.antar]) {
      expect(seg.endFrac).toBeGreaterThan(seg.startFrac)
      expect(seg.startFrac).toBeGreaterThanOrEqual(0)
      expect(seg.endFrac).toBeLessThanOrEqual(1)
    }
  })

  it('formats MD/AD path at a known moment', () => {
    const nodes = calcVimshottari(moonSidereal(), BIRTH_DATE, 3)
    const at = new Date('2000-06-15T12:00:00Z')
    const lords = dashaLordsAt(nodes, at)
    const label = formatDashaPathAt(nodes, at)

    expect(lords.maha).toBeTruthy()
    expect(label).toContain(lords.maha as string)
    if (lords.antar) {
      expect(label).toContain(lords.antar)
      expect(label).toMatch(/ \/ /)
    }
  })
})
