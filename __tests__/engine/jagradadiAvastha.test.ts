import { describe, expect, it } from 'vitest'
import { getDignity, getJagradadiAvastha } from '@/lib/engine/dignity'
import type { GrahaId, Rashi } from '@/types/astrology'

const jag = (g: GrahaId, r: Rashi, deg: number) => getJagradadiAvastha(g, r, getDignity(g, r, deg))

describe('Jagradadi avastha (BPHS)', () => {
  it('exalted, own and moolatrikona are Jagrat', () => {
    expect(jag('Su', 1, 10)).toBe('Jagrat')  // exalted
    expect(jag('Su', 5, 10)).toBe('Jagrat')  // moolatrikona
    expect(jag('Sa', 11, 5)).toBe('Jagrat')  // moolatrikona
    expect(jag('Sa', 10, 5)).toBe('Jagrat')  // own
  })

  it("friend's or neutral sign is Swapna", () => {
    expect(jag('Ju', 1, 10)).toBe('Swapna')  // Mars is Jupiter's friend
    expect(jag('Ma', 7, 10)).toBe('Swapna')  // Venus is neutral to Mars
  })

  it("enemy's sign or debilitation is Sushupti", () => {
    expect(jag('Su', 10, 10)).toBe('Sushupti') // Saturn is Sun's enemy
    expect(jag('Ma', 3, 10)).toBe('Sushupti')  // Mercury is Mars's enemy
    expect(jag('Su', 7, 10)).toBe('Sushupti')  // debilitated
    expect(jag('Ke', 2, 10)).toBe('Sushupti')  // debilitated Ketu
    expect(jag('Ra', 8, 10)).toBe('Sushupti')  // debilitated Rahu
  })
})
