// __tests__/engine/planetInterpretationMix.test.ts
import { describe, it, expect } from 'vitest'
import {
  mixPlanetPlacement,
  mixPlanetInHouseCatalogue,
  mixPlanetInSignCatalogue,
} from '@/lib/engine/planetInterpretationMix'

describe('mixPlanetPlacement', () => {
  it('mixes house, rashi, and planet layers for Mars natal-like input', () => {
    const mixed = mixPlanetPlacement({
      grahaId: 'Ma',
      house: 10,
      rashi: 10,
      dignity: 'exalted',
      nakshatraIndex: 21,
      pada: 2,
      ascRashi: 1,
      grahaName: 'Mars',
      scope: 'all',
    })

    expect(mixed).toBeTruthy()
    expect(mixed!.layers.length).toBeGreaterThanOrEqual(8)
    const ids = mixed!.layers.map(l => l.id)
    expect(ids).toContain('house_theme')
    expect(ids).toContain('planet_house_platform')
    expect(ids).toContain('planet_house_classical')
    expect(ids).toContain('rashi_core')
    expect(ids).toContain('planet_sign_platform')
    expect(ids).toContain('planet_sign_psych')
    expect(ids).toContain('nakshatra')
    expect(ids).toContain('dignity')
    expect(mixed!.blendedSummary.length).toBeGreaterThan(40)
  })

  it('scopes house catalogue without sign psyche noise', () => {
    const layers = mixPlanetInHouseCatalogue('Ma', 6)
    expect(layers.some(l => l.id === 'planet_house_classical')).toBe(true)
    expect(layers.some(l => l.id === 'planet_sign_psych')).toBe(false)
  })

  it('scopes sign catalogue without house theme noise', () => {
    const layers = mixPlanetInSignCatalogue('Ma', 1)
    expect(layers.some(l => l.id === 'planet_sign_classical')).toBe(true)
    expect(layers.some(l => l.id === 'house_theme')).toBe(false)
  })
})
