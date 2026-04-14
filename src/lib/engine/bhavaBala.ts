// ─────────────────────────────────────────────────────────────
//  src/lib/engine/bhavaBala.ts
//  Bhava Bala — House Strength Calculation
//  Ref: Brihat Parashara Hora Shastra (BPHS), Chapter 28
// ─────────────────────────────────────────────────────────────

import type { 
  BhavaBalaResult, 
  BhavaBalaHouse, 
  ShadbalaResult, 
  GrahaData, 
  LagnaData,
  Rashi,
  GrahaId
} from '@/types/astrology'

// ── Constants ─────────────────────────────────────────────────

const HOUSE_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju'
}

// Sign categories for Bhava Digbala
// 1 = Nara (Human), 2 = Chatushpada (Quadruped), 3 = Jalachara (Water), 4 = Keeta (Insect)
enum SignCategory {
  Nara = 1,
  Chatushpada = 2,
  Jalachara = 3,
  Keeta = 4
}

// ── Helpers ───────────────────────────────────────────────────

function norm(d: number) { return ((d % 360) + 360) % 360 }

function degDiff(a: number, b: number): number {
  const d = Math.abs(norm(a - b))
  return d > 180 ? 360 - d : d
}

function getSignCategory(rashi: number, degreeInSign: number): SignCategory {
  // Dhanu (9): 0-15 Nara, 15-30 Chatushpada
  if (rashi === 9) return degreeInSign <= 15 ? SignCategory.Nara : SignCategory.Chatushpada
  // Makara (10): 0-15 Chatushpada, 15-30 Jalachara
  if (rashi === 10) return degreeInSign <= 15 ? SignCategory.Chatushpada : SignCategory.Jalachara
  
  if ([3, 6, 7, 11].includes(rashi)) return SignCategory.Nara
  if ([1, 2, 5].includes(rashi)) return SignCategory.Chatushpada
  if ([4, 12].includes(rashi)) return SignCategory.Jalachara
  if (rashi === 8) return SignCategory.Keeta
  
  return SignCategory.Nara
}

/**
 * BPHS Drishti (Aspect) value on a point
 * Returns value in Shashtiamsas (0-60)
 */
function getDrishtiValue(planetLon: number, pointLon: number, planetId: GrahaId): number {
  const diff = norm(pointLon - planetLon)
  let val = 0
  
  // Standard BPHS Aspect Curve
  if (diff > 30 && diff <= 60) val = (diff - 30) / 2
  else if (diff > 60 && diff <= 90) val = 15 + (diff - 60)
  else if (diff > 90 && diff <= 120) val = 45 - (diff - 90) / 2
  else if (diff > 120 && diff <= 150) val = 30 + (diff - 120) / 2
  else if (diff > 150 && diff <= 180) val = 45 + (diff - 150) / 2
  
  // Special Aspects (Replace standard if higher)
  if (planetId === 'Ju' && ([120, 240].some(d => degDiff(diff, d) < 5))) val = 60
  if (planetId === 'Ma' && ([90, 210].some(d => degDiff(diff, d) < 5))) val = 60
  if (planetId === 'Sa' && ([60, 270].some(d => degDiff(diff, d) < 5))) val = 60
  
  return Math.min(60, val)
}

// ── Implementation ─────────────────────────────────────────────

export function calculateBhavaBala(
  shadbala: ShadbalaResult,
  grahas:   GrahaData[],
  lagnas:   LagnaData,
): BhavaBalaResult {
  const houses: Record<number, BhavaBalaHouse> = {}
  
  const ascDegree = lagnas.ascendantSidereal
  const ascRashi = lagnas.ascRashi
  
  // Peak points for Digbala (Middle of each house)
  const PEAK_POINTS = {
    [SignCategory.Nara]: ascDegree,                      // House 1
    [SignCategory.Jalachara]: norm(ascDegree + 90),     // House 4
    [SignCategory.Keeta]: norm(ascDegree + 180),        // House 7
    [SignCategory.Chatushpada]: norm(ascDegree + 270),  // House 10
  }

  for (let h = 1; h <= 12; h++) {
    const houseRashi = ((ascRashi + h - 2) % 12 + 1) as Rashi
    const houseCuspLon = norm(ascDegree + (h - 1) * 30)
    const degreeInSign = houseCuspLon % 30
    
    // 1. Dhipati Bala (House Lord Strength)
    const lord = HOUSE_LORD[houseRashi]
    const adhipatiBala = shadbala.planets[lord]?.totalShash || 0
    
    // 2. Bhava Digbala
    const cat = getSignCategory(houseRashi, degreeInSign)
    const peak = PEAK_POINTS[cat]
    const dist = degDiff(houseCuspLon, peak)
    const digBala = (180 - dist) / 3 // 0 to 60 Shashtiamsas
    
    // 3. Bhava Drishti Bala (Aspectual Strength)
    let drishtiBala = 0
    for (const g of grahas) {
      if (['Ra', 'Ke'].includes(g.id)) continue // Nodes don't aspect in BPHS Bhava Bala
      
      const val = getDrishtiValue(g.totalDegree, houseCuspLon, g.id)
      
      // Determine if planet is benefic or malefic for Drishti
      // Benefics: Ju, Ve, well-associated Me, Waxing Mo
      // Malefics: Su, Ma, Sa
      const isBenefic = ['Ju', 'Ve'].includes(g.id) || 
                        (g.id === 'Mo' && !['kshina'].includes('')) || // Simple Mo check
                        (g.id === 'Me' && !g.isCombust) 
      
      // We refine Benefic/Malefic logic
      const maleficIds = ['Su', 'Ma', 'Sa']
      if (maleficIds.includes(g.id)) {
        drishtiBala -= (val / 4)
      } else {
        drishtiBala += (val / 4)
      }
    }
    
    const totalShash = adhipatiBala + digBala + drishtiBala
    const totalRupa = totalShash / 60
    
    houses[h] = {
      house: h,
      rashi: houseRashi,
      adhipatiBala: +adhipatiBala.toFixed(2),
      digBala: +digBala.toFixed(2),
      drishtiBala: +drishtiBala.toFixed(2),
      totalShash: +totalShash.toFixed(2),
      totalRupa: +totalRupa.toFixed(3),
      isStrong: totalRupa >= 7.5 // General threshold in BPHS
    }
  }

  const sorted = Object.values(houses).sort((a,b) => b.totalRupa - a.totalRupa)

  return {
    houses,
    strongestHouse: sorted[0].house,
    weakestHouse: sorted[sorted.length-1].house
  }
}
