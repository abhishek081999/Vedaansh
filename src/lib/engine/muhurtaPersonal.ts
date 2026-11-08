/**
 * src/lib/engine/muhurtaPersonal.ts
 * Personalized Muhurta Logic: Tara Bala and Chandra Bala
 */

import type { EngineLang } from '@/lib/engine/lang'
import { CHANDRA_BALA_DESC_HI, TARA_BALA_HI } from '@/lib/engine/locale/muhurtaPersonal.hi'
import { checkMuhurtaNavtara } from '@/lib/engine/navtaraPrediction'

/**
 * Tara Bala (Strength of Constellation)
 * Based on the distance from the Natal Moon's Nakshatra to the Transit Moon's Nakshatra.
 */
export function calcTaraBala(natalNakIndex: number, transitNakIndex: number, lang: EngineLang = 'en') {
  const diff = ((transitNakIndex - natalNakIndex + 27) % 27) + 1
  const tara = diff % 9 || 9

  const metadata: Record<number, { name: string; quality: 'good' | 'bad' | 'avg'; score: number; desc: string }> = {
    1: { name: 'Janma', quality: 'avg', score: 40, desc: 'Take care of your body and health' },
    2: { name: 'Sampat', quality: 'good', score: 100, desc: 'Wealth and Prosperity' },
    3: { name: 'Vipat', quality: 'bad', score: 0, desc: 'Possible losses; take extra care' },
    4: { name: 'Kshem', quality: 'good', score: 90, desc: 'Safety and well-being' },
    5: { name: 'Pratyari', quality: 'bad', score: 10, desc: 'Obstacles and enemies' },
    6: { name: 'Sadhaka', quality: 'good', score: 100, desc: 'Achievement and fulfillment' },
    7: { name: 'Vadha', quality: 'bad', score: 0, desc: 'Major obstacles; best avoided for new starts' },
    8: { name: 'Mitra', quality: 'good', score: 85, desc: 'Friendly and supportive' },
    9: { name: 'Ati-Mitra', quality: 'good', score: 95, desc: 'Highly favorable' },
  }

  const base = metadata[tara]
  if (lang !== 'hi') return base
  const hi = TARA_BALA_HI[tara]
  return {
    ...base,
    name: hi?.name ?? base.name,
    desc: hi?.desc ?? base.desc,
  }
}

/**
 * Booking gate using Navtara hard taras (Vipat / Pratyari / Vadha).
 * Prefer this before signing agreements, vehicle delivery, renovation start, etc.
 */
export function checkPersonalMuhurtaBooking(
  natalMoonNak: number,
  dayMoonNak: number,
  activityLabel?: string,
  lang: EngineLang = 'en',
) {
  const nav = checkMuhurtaNavtara(natalMoonNak, dayMoonNak, activityLabel, lang)
  const tara = calcTaraBala(natalMoonNak, dayMoonNak, lang)
  return {
    ...nav,
    taraBala: tara,
    favorable: nav.verdict === 'favourable',
  }
}

/**
 * Chandra Bala (Strength of Moon Sign)
 * Based on the distance from the Natal Moon Sign (Rashi) to the Transit Moon Sign.
 */
export function calcChandraBala(natalSign: number, transitSign: number, lang: EngineLang = 'en') {
  const pos = ((transitSign - natalSign + 12) % 12) + 1

  const goodPositions = [1, 3, 6, 10, 11]
  const veryBadPositions = [4, 8, 12]

  const isGood = goodPositions.includes(pos)
  const isVeryBad = veryBadPositions.includes(pos)

  const descEn = isGood
    ? 'Moon is in a favorable position from your birth sign.'
    : isVeryBad
      ? 'Moon is in a sensitive/challenging position.'
      : 'Moon is in a neutral position.'

  const desc =
    lang === 'hi'
      ? isGood
        ? CHANDRA_BALA_DESC_HI.good
        : isVeryBad
          ? CHANDRA_BALA_DESC_HI.bad
          : CHANDRA_BALA_DESC_HI.avg
      : descEn

  return {
    position: pos,
    quality: (isGood ? 'good' : isVeryBad ? 'bad' : 'avg') as 'good' | 'bad' | 'avg',
    score: isGood ? 100 : isVeryBad ? 0 : 50,
    desc,
  }
}
