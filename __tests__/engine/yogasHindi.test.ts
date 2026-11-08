// Hindi display text for detected yogas: every name, description and effect the
// engine emits on real charts must have a Hindi rendering (no English fallback).

import { describe, it, expect } from 'vitest'
import { calculateChart } from '@/lib/engine/calculator'
import { yogaDescriptionHi, yogaEffectHi, yogaNameHi } from '@/lib/engine/locale/yogas.hi'

const BIRTHS = [
  { birthDate: '1999-08-19', utcDate: '1999-08-19', utcTime: '04:30:00' },
  { birthDate: '1990-05-15', utcDate: '1990-05-15', utcTime: '05:00:00' },
  { birthDate: '1985-01-03', utcDate: '1985-01-02', utcTime: '20:15:00' },
  { birthDate: '2004-11-27', utcDate: '2004-11-27', utcTime: '12:40:00' },
  { birthDate: '1972-07-09', utcDate: '1972-07-08', utcTime: '23:05:00' },
]

const latin = /[A-Za-z]{3,}/

describe('yoga text in Hindi', () => {
  it('translates every yoga produced on sample charts', async () => {
    let seen = 0
    for (const b of BIRTHS) {
      const chart = await calculateChart({
        name: 'Test', birthTime: '10:00', birthPlace: 'New Delhi',
        latitude: 28.61, longitude: 77.21, timezone: 'Asia/Kolkata', gender: 'male', ...b,
      })
      for (const y of chart.yogas ?? []) {
        seen++
        expect(yogaNameHi(y.name), y.name).not.toMatch(latin)
        expect(yogaDescriptionHi(y.description), y.description).not.toMatch(latin)
        expect(yogaEffectHi(y.name, y.effect), y.name).not.toMatch(latin)
      }
    }
    expect(seen).toBeGreaterThan(10)
  })

  it('leaves unknown text unchanged', () => {
    expect(yogaDescriptionHi('Something new')).toBe('Something new')
    expect(yogaEffectHi('New Yoga', 'effect')).toBe('effect')
  })
})
