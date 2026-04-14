/**
 * src/lib/engine/muhurtaPersonal.ts
 * Personalized Muhurta Logic: Tara Bala and Chandra Bala
 */

/**
 * Tara Bala (Strength of Constellation)
 * Based on the distance from the Natal Moon's Nakshatra to the Transit Moon's Nakshatra.
 */
export function calcTaraBala(natalNakIndex: number, transitNakIndex: number) {
  const diff = ((transitNakIndex - natalNakIndex + 27) % 27) + 1;
  const tara = diff % 9 || 9;

  const metadata: Record<number, { name: string; quality: 'good' | 'bad' | 'avg'; score: number; desc: string }> = {
    1: { name: 'Janma',     quality: 'avg',  score: 40,  desc: 'Danger to body/health' },
    2: { name: 'Sampat',    quality: 'good', score: 100, desc: 'Wealth and Prosperity' },
    3: { name: 'Vipat',     quality: 'bad',  score: 0,   desc: 'Losses and accidents' },
    4: { name: 'Kshem',     quality: 'good', score: 90,  desc: 'Safety and well-being' },
    5: { name: 'Pratyari',  quality: 'bad',  score: 10,  desc: 'Obstacles and enemies' },
    6: { name: 'Sadhaka',   quality: 'good', score: 100, desc: 'Achievement and fulfillment' },
    7: { name: 'Vadha',     quality: 'bad',  score: 0,   desc: 'Destruction and danger' },
    8: { name: 'Mitra',     quality: 'good', score: 85,  desc: 'Friendly and supportive' },
    9: { name: 'Ati-Mitra', quality: 'good', score: 95,  desc: 'Highly favorable' },
  };

  return metadata[tara];
}

/**
 * Chandra Bala (Strength of Moon Sign)
 * Based on the distance from the Natal Moon Sign (Rashi) to the Transit Moon Sign.
 */
export function calcChandraBala(natalSign: number, transitSign: number) {
  const pos = ((transitSign - natalSign + 12) % 12) + 1;
  
  // 1, 3, 6, 7, 10, 11 are considered auspicious positions from Natal Moon
  const goodPositions = [1, 3, 6, 7, 10, 11];
  const veryBadPositions = [4, 8, 12];
  
  const isGood = goodPositions.includes(pos);
  const isVeryBad = veryBadPositions.includes(pos);

  return {
    position: pos,
    quality: isGood ? 'good' : isVeryBad ? 'bad' : 'avg' as 'good' | 'bad' | 'avg',
    score: isGood ? 100 : isVeryBad ? 0 : 50,
    desc: isGood ? 'Moon is in a favorable position from your birth sign.' : isVeryBad ? 'Moon is in a sensitive/challenging position.' : 'Moon is in a neutral position.'
  };
}
