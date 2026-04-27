// ─────────────────────────────────────────────────────────────
//  src/components/chakra/SarvatobhadraChakra.tsx
//  Sarvatobhadra Chakra (SBC) — classical Muhurta grid
//
//  Structure:
//   - 9×9 grid = 81 cells
//   - Outer ring (border cells):  27 Nakshatras + 4 corners (directions)
//   - Second ring:                Tithi (30 tithis distributed)
//   - Third ring:                 Vara (weekday lords)
//   - Inner ring:                 Vowels / Consonants (for Vedha analysis)
//   - Centre cell (5,5):          "Brahma" — the focal point
//
//  Nakshatra ring layout (outer 28 cells, 4 corners = directions):
//   Starting from top-left corner going clockwise:
//   N (top row L→R): Nak 1–7  (Ashwini → Punarvasu)  +  NE corner
//   E (right col T→B): Nak 8–14 (Pushya → Vishakha)  +  SE corner
//   S (bottom row R→L): Nak 15–21 (Anuradha → Dhanishtha) + SW corner
//   W (left col B→T): Nak 22–27 + Nak 0 (Shatabhisha, PBhadra, UBhadra,
//                                         Revati, Ashwini partial, Bharani)
//                      + NW corner
//
//  The 4 corner cells show the cardinal directions:
//   TL=NW, TR=NE, BR=SE, BL=SW
//
//  Grahas are placed on their birth nakshatra cell with a coloured dot.
//  Tithi number shows in second ring. Vara lord shows in third ring.
//
//  Reference: Phaladeepika Ch. 26, K.N. Rao's Muhurta texts
// ─────────────────────────────────────────────────────────────
'use client'

import { useMemo } from 'react'
import type { GrahaData } from '@/types/astrology'
import type { SBCGrahaInput } from '@/lib/engine/sarvatobhadra'
import { getPlanetsOnSBC, getSBCGrid } from '@/lib/engine/sarvatobhadra'
import { SarvatobhadraChakra as UISarvatobhadraChakra } from '@/components/ui/SarvatobhadraChakra'

interface SarvatobhadraProps {
  grahas:        GrahaData[]
  moonNakIndex:  number
  tithiNumber:   number
  varaNumber:    number
  size?:         number
  showGrahas?:   boolean
  showTithi?:    boolean
  showVara?:     boolean
  showAkshara?:  boolean
  fontScale?:    number
}

export function SarvatobhadraChakra({
  grahas,
  moonNakIndex,
  tithiNumber: _tithiNumber,
  varaNumber: _varaNumber,
  size = 486,
  showGrahas   = true,
  showTithi: _showTithi = true,
  showVara: _showVara = true,
  showAkshara: _showAkshara = true,
  fontScale    = 1.0,
}: SarvatobhadraProps) {
  const grid = useMemo(() => getSBCGrid(), [])
  const natalInput = useMemo<SBCGrahaInput[]>(
    () => grahas
      .filter((g) => !['Ur', 'Ne', 'Pl'].includes(g.id))
      .map((g) => ({ id: g.id, lonSidereal: g.lonSidereal })),
    [grahas]
  )
  const natalPlanets = useMemo(
    () => (showGrahas ? getPlanetsOnSBC(natalInput, true) : []),
    [natalInput, showGrahas]
  )

  return (
    <UISarvatobhadraChakra
      grid={grid}
      natalPlanets={natalPlanets}
      transitPlanets={[]}
      size={size}
      fontScale={fontScale}
      birthNakshatraIndex={moonNakIndex}
      showDiagonalVedha={false}
    />
  )
}
