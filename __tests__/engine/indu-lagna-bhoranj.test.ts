import { describe, it, expect } from 'vitest'
import { calculateChart } from '@/lib/engine/calculator'
import { calcInduLagna } from '@/lib/engine/astroDetailsDerived'
import { RASHI_NAMES, GRAHA_NAMES } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'

describe('Bhoranj 19 Aug 1999 10:00', () => {
  it('prints Indu Lagna breakdown', async () => {
    const chart = await calculateChart({
      name: 'Test',
      birthDate: '1999-08-19',
      birthTime: '10:00',
      utcDate: '1999-08-19',
      utcTime: '04:30:00',
      birthPlace: 'Bhoranj, Himachal Pradesh',
      latitude: 31.644,
      longitude: 76.642,
      timezone: 'Asia/Kolkata',
      gender: 'male',
    })

    const moon = chart.grahas.find(g => g.id === 'Mo')!
    const asc = chart.lagnas.ascRashi
    const il = chart.lagnas.induLagna
    const ilSign = (Math.floor(il / 30) + 1) as Rashi
    const deg = il % 30

    const ninthFrom = (b: Rashi) => ((((b + 7) % 12) + 12) % 12 + 1) as Rashi
    const INDU_RAYS: Record<string, number> = {
      Su: 30, Mo: 16, Ma: 6, Me: 8, Ju: 10, Ve: 12, Sa: 1,
    }
    const SIGN_LORD: Record<number, string> = {
      1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
      7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
    }
    const n9Asc = ninthFrom(asc)
    const n9Moon = ninthFrom(moon.rashi)
    const l1 = SIGN_LORD[n9Asc]
    const l2 = SIGN_LORD[n9Moon]
    const k1 = INDU_RAYS[l1]
    const k2 = INDU_RAYS[l2]
    const total = k1 + k2
    const rem = total % 12

    console.log('Asc:', RASHI_NAMES[asc], chart.lagnas.ascDegree.toFixed(2))
    console.log('Moon:', RASHI_NAMES[moon.rashi], moon.totalDegree.toFixed(2), 'house', ((moon.rashi - asc + 12) % 12) + 1)
    console.log('9th from Lagna:', RASHI_NAMES[n9Asc], 'lord', GRAHA_NAMES[l1 as keyof typeof GRAHA_NAMES], 'kala', k1)
    console.log('9th from Moon:', RASHI_NAMES[n9Moon], 'lord', GRAHA_NAMES[l2 as keyof typeof GRAHA_NAMES], 'kala', k2)
    console.log('Total kala:', total, 'remainder:', rem, rem === 0 ? '(→ sign before Moon)' : `(→ ${rem}th from Moon)`)
    console.log('Indu Lagna:', RASHI_NAMES[ilSign], deg.toFixed(2) + '°', 'lon', il.toFixed(2))
    console.log('Standalone calc:', RASHI_NAMES[(Math.floor(calcInduLagna(moon.totalDegree, moon.rashi, asc) / 30) + 1) as Rashi])
    console.log('Pranapada:', RASHI_NAMES[(Math.floor(chart.lagnas.pranapada / 30) + 1) as Rashi], (chart.lagnas.pranapada % 30).toFixed(2))
    console.log('Bhrigu Bindu:', RASHI_NAMES[(Math.floor(chart.lagnas.bhriguBindu / 30) + 1) as Rashi], (chart.lagnas.bhriguBindu % 30).toFixed(2))

    expect(Number.isFinite(il)).toBe(true)
    expect(ilSign).toBe(11) // Aquarius for this chart
  })
})
