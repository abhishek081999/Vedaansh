import { describe, it, expect } from 'vitest'
import { parseCoordinate } from '@/lib/atlas/coords'

describe('parseCoordinate', () => {
  it('parses plain decimals', () => {
    expect(parseCoordinate('28.6139')).toBeCloseTo(28.6139, 5)
    expect(parseCoordinate('-73.5167')).toBeCloseTo(-73.5167, 5)
  })

  it('accepts trailing decimal point (in-progress typing)', () => {
    expect(parseCoordinate('28.')).toBe(28)
    expect(parseCoordinate('-12.')).toBe(-12)
  })

  it('parses DMS colon / degree formats', () => {
    expect(parseCoordinate('28:02')).toBeCloseTo(28 + 2 / 60, 5)
    expect(parseCoordinate(`73°31'`)).toBeCloseTo(73 + 31 / 60, 5)
  })
})
