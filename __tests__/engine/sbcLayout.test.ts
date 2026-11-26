// Sarvatobhadra Chakra: rashi placement and straight (front) vedha.
import { describe, expect, it } from 'vitest'
import { SBC_NAK_POS, SBC_RASHI_POS, frontVedhaKeys, getSBCGrid, getVedhaCells } from '@/lib/engine/sarvatobhadra'

// Side of a cell on the outer ring (0/8) or the rashi ring (2/6)
const side = ([r, c]: [number, number]) => {
  const ring = Math.min(r, c, 8 - r, 8 - c)
  if (r === ring) return 'N'
  if (r === 8 - ring) return 'S'
  if (c === ring) return 'W'
  return 'E'
}

describe('SBC rashi placement', () => {
  it('each rashi sits on the side of its own nakshatras', () => {
    // A rashi's nakshatras: the one that starts in it (index = floor((rashi-1)*30 / 13.333))
    for (let rashi = 1; rashi <= 12; rashi++) {
      const nak = Math.floor(((rashi - 1) * 30 + 15) / (360 / 27)) // nakshatra at mid-sign
      expect(side(SBC_RASHI_POS[rashi]), `rashi ${rashi}`).toBe(side(SBC_NAK_POS[nak]))
    }
  })
})

describe('SBC front vedha', () => {
  const grid = getSBCGrid()

  it('Krittika ↔ Shravana straight across, both ways', () => {
    const [kr, kc] = SBC_NAK_POS[2]
    expect(getVedhaCells(kr, kc, grid).affectedNakshatras).toEqual([21])
    const [sr, sc] = SBC_NAK_POS[21]
    expect(getVedhaCells(sr, sc, grid).affectedNakshatras).toEqual([2])
  })

  it('never casts vedha along a nakshatra’s own side', () => {
    SBC_NAK_POS.forEach(([r, c], i) => {
      const own = side([r, c])
      for (const [vr, vc] of frontVedhaKeys(r, c)) {
        const onPerimeter = vr === 0 || vr === 8 || vc === 0 || vc === 8
        if (onPerimeter) expect(side([vr, vc]), `nak ${i}`).not.toBe(own)
      }
    })
  })
})
