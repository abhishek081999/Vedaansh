// Nakshatra panel tables must agree with the Milan (ashtakoot) and Muhurta engines.
import { describe, expect, it } from 'vitest'
import {
  NAKSHATRA_GANA,
  NAKSHATRA_NATURE,
  NAKSHATRA_YONI,
  getNakCompatibility,
} from '@/lib/engine/nakshatraAdvanced'
import { getGanaName, getYoniName } from '@/lib/engine/ashtakoot'
import { getNakshatraMuhurtaMeta } from '@/lib/engine/nakshatraMuhurta'

const MUHURTA_TO_NATURE: Record<string, string> = {
  Dhruva: 'Sthira', Chara: 'Chara', Ugra: 'Ugra', Mishra: 'Mixed',
  Laghu: 'Kshipra', Mridu: 'Mridu', Tikshna: 'Tikshna',
}

describe('nakshatraAdvanced tables', () => {
  it('gana matches ashtakoot for all 27 nakshatras', () => {
    for (let i = 0; i < 27; i++) expect(NAKSHATRA_GANA[i]).toBe(getGanaName(i + 1))
  })

  it('yoni matches ashtakoot (Goat = Sheep)', () => {
    for (let i = 0; i < 27; i++) {
      const milan = getYoniName(i + 1)
      expect(NAKSHATRA_YONI[i]).toBe(milan === 'Sheep' ? 'Goat' : milan)
    }
  })

  it('nature matches the muhurta group', () => {
    for (let i = 0; i < 27; i++) {
      expect(NAKSHATRA_NATURE[i]).toBe(MUHURTA_TO_NATURE[getNakshatraMuhurtaMeta(i).group.id])
    }
  })

  it('compatibility tara counts the 9th star as Ati-Mitra', () => {
    expect(getNakCompatibility(0, 0).taraName).toBe('Janma')
    expect(getNakCompatibility(0, 2).taraName).toBe('Vipat')
    expect(getNakCompatibility(0, 2).taraScore).toBe(0)
    expect(getNakCompatibility(0, 8).taraName).toBe('Ati-Mitra')
    expect(getNakCompatibility(0, 8).taraScore).toBe(3)
  })
})
