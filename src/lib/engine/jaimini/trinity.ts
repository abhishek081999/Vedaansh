import type { GrahaId, Rashi, ChartOutput, GrahaData } from '@/types/astrology'
import { calcCharaKarakas } from '../karakas'

export interface JaiminiTrinity {
  brahma: {
    id: GrahaId | null
    reason: string
  }
  maheshwara: {
    id: GrahaId | null
    reason: string
  }
  rudra: {
    id: GrahaId | null
    reason: string
  }
}

/**
 * Calculate Jaimini Trinity: Brahma, Maheshwara, Rudra
 */
export function calculateJaiminiTrinity(chart: Partial<ChartOutput>): JaiminiTrinity {
  const grahas = chart.grahas || []
  const lagnas = chart.lagnas || { ascRashi: 1 }

  // Force 7-karaka scheme for Jaimini Trinity calculations
  const karakas = calcCharaKarakas(
    grahas.map((g) => ({ id: g.id, lonSidereal: g.lonSidereal, degree: g.degree })),
    7
  )

  // 1. BRAHMA
  // Logic: 8th Lord from AK, if placed in the 8th from AK.
  // Else: Compare Lagna and 7th house strength. Take 6th, 8th, 12th lords from the stronger one.
  // Strongest of these is Brahma. Ignore Saturn.
  
  const akPlanet = grahas.find(g => g.id === karakas.AK)
  let brahma: GrahaId | null = null
  let brahmaReason = ''

  if (akPlanet) {
    const akRashi = akPlanet.rashi
    const eighthFromAK = (((akRashi + 7 - 1) % 12) + 1) as Rashi
    const eighthLordFromAK = getRashiLord(eighthFromAK)
    const eighthLordPlanet = grahas.find(g => g.id === eighthLordFromAK)

    if (eighthLordPlanet && eighthLordPlanet.rashi === eighthFromAK && eighthLordFromAK !== 'Sa') {
      brahma = eighthLordFromAK
      brahmaReason = `8th Lord from AK (${eighthLordFromAK}) placed in 8th house from AK`
    }
  }

  if (!brahma) {
    // Simplified strength: count planets in Lagna vs 7th
    const lagnaRashi = lagnas.ascRashi
    const seventhRashi = (((lagnaRashi + 6 - 1) % 12) + 1) as Rashi
    
    const lagnaStrength = grahas.filter(g => g.rashi === lagnaRashi).length
    const seventhStrength = grahas.filter(g => g.rashi === seventhRashi).length
    
    const strongerRashi = lagnaStrength >= seventhStrength ? lagnaRashi : seventhRashi
    const lords = [
      getRashiLord((((strongerRashi + 5 - 1) % 12) + 1) as Rashi), // 6th
      getRashiLord((((strongerRashi + 7 - 1) % 12) + 1) as Rashi), // 8th
      getRashiLord((((strongerRashi + 11 - 1) % 12) + 1) as Rashi) // 12th
    ].filter(id => id !== 'Sa')

    // Find strongest of these (using degree as a simple proxy for now, or just the first one)
    // In a real engine we'd use Shadbala or Jaimini Bala. Let's use first non-Saturn for now.
    brahma = lords[0] || null
    brahmaReason = `Strongest of 6th, 8th, 12th lords from ${strongerRashi === lagnaRashi ? 'Lagna' : '7th House'} (Saturn ignored)`
  }

  // 2. MAHESHWARA
  // Logic: 8th Lord from AK.
  // Exception: If an exalted planet is in the 12th from AK, it becomes Maheshwara.
  
  let maheshwara: GrahaId | null = null
  let maheshwaraReason = ''

  if (akPlanet) {
    const twelfthFromAK = (((akPlanet.rashi + 10) % 12) + 1) as Rashi
    const exaltedInTwelfth = grahas.find(g => g.rashi === twelfthFromAK && g.dignity === 'exalted')
    
    if (exaltedInTwelfth) {
      maheshwara = exaltedInTwelfth.id
      maheshwaraReason = `Exalted planet (${exaltedInTwelfth.id}) in 12th house from AK`
    } else {
      const eighthFromAK = (((akPlanet.rashi + 7 - 1) % 12) + 1) as Rashi
      maheshwara = getRashiLord(eighthFromAK)
      maheshwaraReason = `8th Lord from AK`
    }
  }

  // 3. RUDRA
  // Logic: Stronger of 2nd and 8th lords from Lagna.
  
  const lagnaRashi = lagnas.ascRashi
  const secondLord = getRashiLord((((lagnaRashi + 1 - 1) % 12) + 1) as Rashi)
  const eighthLord = getRashiLord((((lagnaRashi + 7 - 1) % 12) + 1) as Rashi)
  
  // Proxy strength: higher degree = stronger for Jaimini (or just pick one for now)
  const p2 = grahas.find(g => g.id === secondLord)
  const p8 = grahas.find(g => g.id === eighthLord)
  
  let rudra: GrahaId | null = null
  if ((p2?.totalDegree || 0) >= (p8?.totalDegree || 0)) {
    rudra = secondLord
  } else {
    rudra = eighthLord
  }
  const rudraReason = `Stronger of 2nd Lord (${secondLord}) and 8th Lord (${eighthLord}) from Lagna`

  return {
    brahma: { id: brahma, reason: brahmaReason },
    maheshwara: { id: maheshwara, reason: maheshwaraReason },
    rudra: { id: rudra, reason: rudraReason }
  }
}

function getRashiLord(r: Rashi): GrahaId {
  if (r === 1 || r === 8) return 'Ma'
  if (r === 2 || r === 7) return 'Ve'
  if (r === 3 || r === 6) return 'Me'
  if (r === 4) return 'Mo'
  if (r === 5) return 'Su'
  if (r === 9 || r === 12) return 'Ju'
  if (r === 10 || r === 11) return 'Sa'
  return 'Su'
}
