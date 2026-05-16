import type { Rashi } from '@/types/astrology'

/**
 * Jaimini Gateway Signs
 * Dwara Rashi: The sign of the active Chara Dasha
 * Bahya Rashi: The outcome sign, calculated as distance from Lagna to Dwara, 
 * applied again from Dwara.
 */

export interface GatewayResult {
  dwara: Rashi
  bahya: Rashi
}

export function calculateGatewaySigns(
  lagnaRashi: Rashi,
  activeDashaRashi: Rashi
): GatewayResult {
  const dwara = activeDashaRashi
  
  // Distance from Lagna to Dwara
  const distance = (dwara - lagnaRashi + 12) % 12 + 1
  
  // Bahya = Dwara + (distance - 1)
  let bahya = (dwara + distance - 1) % 12
  if (bahya === 0) bahya = 12
  
  return {
    dwara,
    bahya: bahya as Rashi
  }
}
