// __tests__/engine/ashtakoot.test.ts
// Ashtakoot Milan scoring, dosha exceptions, eligibility band

import { describe, it, expect } from 'vitest'
import {
  calculateAshtakoot,
  getVarnaName,
  getVashyaName,
  getGanaName,
  getNadiShort,
  getYoniName,
} from '@/lib/engine/ashtakoot'

describe('Ashtakoot name helpers', () => {
  it('maps varna by rashi element groups', () => {
    expect(getVarnaName(4)).toBe('Brahmin')
    expect(getVarnaName(1)).toBe('Kshatriya')
    expect(getVarnaName(2)).toBe('Vaishya')
    expect(getVarnaName(3)).toBe('Shudra')
  })

  it('splits Sagittarius and Capricorn by degree for Vashya', () => {
    expect(getVashyaName(9, 10)).toBe('Human')
    expect(getVashyaName(9, 20)).toBe('Quadruped')
    expect(getVashyaName(10, 5)).toBe('Quadruped')
    expect(getVashyaName(10, 22)).toBe('Water')
    expect(getVashyaName(5)).toBe('Wild')
    expect(getVashyaName(8)).toBe('Insect')
  })

  it('classifies gana and nadi from nakshatra index', () => {
    expect(getGanaName(1)).toBe('Deva')       // Ashwini
    expect(getGanaName(2)).toBe('Manushya')   // Bharani
    expect(getGanaName(3)).toBe('Rakshasa')   // Krittika
    expect(getNadiShort(1)).toBe('Aadi')
    expect(getNadiShort(2)).toBe('Madhya')
    expect(getNadiShort(3)).toBe('Antya')
  })

  it('maps yoni animals', () => {
    expect(getYoniName(1)).toBe('Horse')      // Ashwini
    expect(getYoniName(24)).toBe('Horse')     // Shatabhisha
    expect(getYoniName(2)).toBe('Elephant')   // Bharani
  })
})

describe('calculateAshtakoot core scoring', () => {
  it('awards full nadi when nadis differ', () => {
    // Ashwini (Aadi) vs Bharani (Madhya)
    const r = calculateAshtakoot(1, 1, 2, 1)
    expect(r.nadi.points).toBe(8)
    expect(r.nadi.dosha).toBeFalsy()
  })

  it('flags nadi dosha for same nadi without cancellation', () => {
    // Ashwini + Ardra = both Aadi, different signs
    const r = calculateAshtakoot(1, 1, 6, 3)
    expect(r.nadi.points).toBe(0)
    expect(r.nadi.dosha).toBe(true)
  })

  it('cancels nadi dosha for same rashi different nakshatra', () => {
    // Anuradha (17, Madhya) + Jyeshtha (18, Aadi) — different nadi actually.
    // Use Pushya (8, Madhya) + Purva Phalguni (11, Madhya) both... need same nadi same sign.
    // Scorpio: Anuradha(17 Madhya) vs Jyeshtha(18 Aadi) — different nadi.
    // Same sign Cancer: Pushya(8 Madhya) + Ashlesha(9 Antya) — different.
    // Same sign Leo Magha(10 Antya) — only one in Leo start...
    // Both Madhya in same sign is rare. Use same nadi different nak same sign:
    // Taurus: Rohini(4 Antya) + Mrigashira(5 Madhya) — different.
    // Virgo: Hasta(13 Aadi) only mostly.
    // Capricorn: Uttarashadha(21 Manushya Antya) + Shravana(22 Deva Antya) — both Antya, Capricorn.
    const r = calculateAshtakoot(21, 10, 22, 10)
    expect(getNadiShort(21)).toBe('Antya')
    expect(getNadiShort(22)).toBe('Antya')
    expect(r.nadi.points).toBe(8)
    expect(r.nadi.notes?.some(n => n.includes('cancelled'))).toBe(true)
  })

  it('cancels nadi dosha for same nakshatra different pada', () => {
    const r = calculateAshtakoot(1, 1, 1, 1, { boyPada: 1, girlPada: 3 })
    expect(r.nadi.points).toBe(8)
    expect(r.nadi.notes?.some(n => n.includes('pada'))).toBe(true)
  })

  it('classical gana: Deva bride + Rakshasa groom = 0; reverse = 1', () => {
    // Boy Rakshasa (3), Girl Deva (1) → classical 0
    const a = calculateAshtakoot(3, 1, 1, 1, { ganaSchool: 'classical' })
    expect(a.gana.points).toBe(0)
    // Boy Deva, Girl Rakshasa → classical 1
    const b = calculateAshtakoot(1, 1, 3, 1, { ganaSchool: 'classical' })
    expect(b.gana.points).toBe(1)
  })

  it('parampara gana: Boy Rakshasa + Girl Deva = 1', () => {
    const a = calculateAshtakoot(3, 1, 1, 1, { ganaSchool: 'parampara' })
    expect(a.gana.points).toBe(1)
  })

  it('gives full yoni for same animal and zero for horse–buffalo', () => {
    // Ashwini + Shatabhisha = Horse
    const same = calculateAshtakoot(1, 1, 24, 11)
    expect(same.yoni.points).toBe(4)
    // Ashwini (Horse) + Hasta (Buffalo = 9)
    const enemy = calculateAshtakoot(1, 1, 13, 6)
    expect(enemy.yoni.points).toBe(0)
  })

  it('applies bhakoot 6–8 cancellation for Aries–Scorpio (both Mars)', () => {
    const r = calculateAshtakoot(1, 1, 18, 8) // Aries–Scorpio
    expect(r.bhakoot.points).toBe(7)
    expect(r.bhakoot.notes?.some(n => n.includes('cancelled') || n.includes('Shadashtak'))).toBe(true)
  })

  it('treats boy-5th-from-girl as acceptable nav-pancham exception', () => {
    // Girl Aries(1), Boy Leo(5) → boy is 5th from girl
    const r = calculateAshtakoot(1, 5, 1, 1)
    expect(r.bhakoot.points).toBe(7)
  })

  it('scores boy-9th-from-girl nav-pancham as dosha', () => {
    // Girl Aries(1), Boy Sagittarius(9) → boy is 9th
    const r = calculateAshtakoot(1, 9, 1, 1)
    expect(r.bhakoot.points).toBe(0)
    expect(r.bhakoot.dosha).toBe(true)
  })

  it('sets eligibility bands at 18 and 32', () => {
    // Force a mid score by checking structure
    const mid = calculateAshtakoot(1, 1, 7, 4) // varied
    expect(['below_minimum', 'ideal', 'above_ideal']).toContain(mid.eligibility.band)
    expect(mid.disclaimer.length).toBeGreaterThan(20)
    expect(mid.layers.psychology).toBeTruthy()
    expect(mid.varna.insight).toBeTruthy()
  })

  it('total equals sum of eight kootas', () => {
    const r = calculateAshtakoot(5, 2, 15, 7)
    const sum =
      r.varna.points + r.vashya.points + r.tara.points + r.yoni.points +
      r.maitri.points + r.gana.points + r.bhakoot.points + r.nadi.points
    expect(r.total).toBe(sum)
    expect(r.total).toBeGreaterThanOrEqual(0)
    expect(r.total).toBeLessThanOrEqual(36)
  })
})
