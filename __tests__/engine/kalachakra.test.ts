// ─────────────────────────────────────────────────────────────
//  Kalachakra Dasha — BPHS ch. 46 pada rows and birth balance
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  calcKalachakra,
  describeKalachakra,
  formatKalachakraSpan,
} from '@/lib/engine/dasha/kalachakra'

const BIRTH = new Date('1990-01-01T00:00:00Z')
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000

/** Taurus 4°50' — BPHS worked example for Krittika. */
const KRITTIKA_EXAMPLE = 30 + 4 + 50 / 60

describe('Kalachakra Dasha', () => {
  it('leaves 3y 7m 24d of Capricorn for Krittika at 1s 4°50\'', () => {
    const seed = describeKalachakra(KRITTIKA_EXAMPLE)
    expect(seed.nakshatraName).toBe('Krittika')
    expect(seed.pada).toBe(3)
    expect(seed.gati).toBe('Savya')
    expect(seed.paramayu).toBe(83)
    expect(seed.dehaName).toBe('Taurus')
    expect(seed.jeevaName).toBe('Gemini')

    const nodes = calcKalachakra(KRITTIKA_EXAMPLE, BIRTH, 3)
    expect(nodes).toHaveLength(9)
    expect(nodes[0].lord).toBe('Cp')
    expect(nodes[0].label).toBe('Capricorn (3y 7m 24d)')
    expect(nodes[0].durationMs / YEAR_MS).toBeCloseTo(3.65, 4)
    expect(nodes[0].children).toHaveLength(9)
    expect(nodes[0].children[0].lord).toBe('Cp')
    expect(nodes[0].children[0].children).toHaveLength(9)
  })

  it('opens Ashwini pada 1 on Aries for the full 7 years', () => {
    const nodes = calcKalachakra(0, BIRTH, 2)
    expect(nodes.map((node) => node.lord)).toEqual(['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg'])
    expect(nodes[0].label).toBe('Aries (7y)')
    expect(nodes[0].durationMs / YEAR_MS).toBeCloseTo(7, 6)

    const childMs = nodes[0].children.reduce((total, child) => total + child.durationMs, 0)
    expect(childMs).toBeCloseTo(nodes[0].durationMs, -1)
  })

  it('reads Bharani as the second Savya wheel, Deha Scorpio', () => {
    const seed = describeKalachakra(360 / 27)
    expect(seed.nakshatraName).toBe('Bharani')
    expect(seed.pada).toBe(1)
    expect(seed.gati).toBe('Savya')
    expect(seed.paramayu).toBe(100)
    expect(seed.dehaName).toBe('Scorpio')
    expect(seed.jeevaName).toBe('Pisces')

    const nodes = calcKalachakra(360 / 27, BIRTH, 1)
    expect(nodes[0].lord).toBe('Sc')
    expect(nodes[0].durationMs / YEAR_MS).toBeCloseTo(7, 6)
  })

  it('opens Rohini pada 1 on Sagittarius for 10 years', () => {
    const seed = describeKalachakra(40)
    expect(seed.nakshatraName).toBe('Rohini')
    expect(seed.gati).toBe('Apasavya')
    expect(seed.paramayu).toBe(86)
    expect(seed.dehaName).toBe('Sagittarius')

    const nodes = calcKalachakra(40, BIRTH, 1)
    expect(nodes.map((node) => node.lord)).toEqual(['Sg', 'Cp', 'Aq', 'Pi', 'Ar', 'Ta', 'Ge', 'Le', 'Cn'])
    expect(nodes[0].durationMs / YEAR_MS).toBeCloseTo(10, 6)
  })

  it('continues the nine signs into the next pada after the birth sign', () => {
    // Halfway through Ashwini pada 1: 50y of a 100y row has passed
    // (7+16+9 = 32), so Cancer is running with 3 years left.
    const lon = 0.5 * (360 / 108)
    const nodes = calcKalachakra(lon, BIRTH, 1)
    expect(nodes.map((node) => node.lord)).toEqual(['Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'])
    expect(nodes[0].label).toBe('Cancer (3y)')
    expect(nodes[0].durationMs / YEAR_MS).toBeCloseTo(3, 6)
  })

  it('keeps the last sign of a row when paramayu is not yet finished', () => {
    const start = 2 * (360 / 108)
    const lon = start + 0.98 * (360 / 108)
    const nodes = calcKalachakra(lon, BIRTH, 1)
    expect(nodes[0].lord).toBe('Ge')
    expect(nodes[0].label).toBe('Gemini (1y 7m 28d)')
    expect(nodes[1].lord).toBe('Cn')
    expect(nodes).toHaveLength(9)
  })

  it('formats the classical year as 12 months of 30 days', () => {
    expect(formatKalachakraSpan(3.65)).toBe('3y 7m 24d')
    expect(formatKalachakraSpan(7)).toBe('7y')
    expect(formatKalachakraSpan(0)).toBe('0d')
  })
})
