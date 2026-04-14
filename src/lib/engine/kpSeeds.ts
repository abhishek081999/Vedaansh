
import { NAKSHATRA_LORDS, type GrahaId } from '@/types/astrology'

const VIMSHOTTARI_YEARS: Record<GrahaId, number> = {
  Ke: 7, Ve: 20, Su: 6, Mo: 10, Ma: 7, Ra: 18, Ju: 16, Sa: 19, Me: 17,
  Ur: 0, Ne: 0, Pl: 0,
}

const KP_SEQUENCE: GrahaId[] = ['Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me']
const TOTAL_VIM_YEARS = 120
const NAK_SPAN = 360 / 27
const SUB_SPAN = NAK_SPAN / TOTAL_VIM_YEARS

export function getKPSeedDegree(seed: number): number {
  if (seed < 1 || seed > 249) return 0
  
  let currentSeed = 1
  for (let nak = 0; nak < 27; nak++) {
    const nakStart = nak * NAK_SPAN
    const nakLord = NAKSHATRA_LORDS[nak]
    const nakLordIdx = KP_SEQUENCE.indexOf(nakLord)
    
    let cursor = nakStart
    for (let i = 0; i < 9; i++) {
       const subLordId = KP_SEQUENCE[(nakLordIdx + i) % 9]
       const span = VIMSHOTTARI_YEARS[subLordId] * SUB_SPAN
       
       if (currentSeed === seed) {
          return cursor // Start of the sub-division
       }
       
       cursor += span
       currentSeed++
       if (currentSeed > 249) break
    }
    if (currentSeed > 249) break
  }
  return 0
}
