// Regression: Lahiri sidereal longitudes vs JHora — 19 Aug 1999, 10:00 IST, Bhoranj HP
import { describe, it, expect } from 'vitest'
import { fromZonedTime } from 'date-fns-tz'
import { calculateChart } from '@/lib/engine/calculator'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { GRAHA_NAMES } from '@/types/astrology'

const BHORANJ = {
  date: '1999-08-19',
  time: '10:00:00',
  tz: 'Asia/Kolkata',
  lat: 31.644,
  lng: 76.642,
}

function birthUtc() {
  return fromZonedTime(`${BHORANJ.date}T${BHORANJ.time}`, BHORANJ.tz)
}

describe('Bhoranj 19 Aug 1999 — Lahiri sidereal (JHora-style)', () => {
  it('planet degrees match tropical − Lahiri ayanamsha', async () => {
    const utc = birthUtc()
    const chart = await calculateChart({
      name: 'Test',
      birthDate: BHORANJ.date,
      birthTime: '10:00',
      utcDate: utc.toISOString().slice(0, 10),
      utcTime: utc.toISOString().slice(11, 19),
      birthPlace: 'Bhoranj, Himachal Pradesh',
      latitude: BHORANJ.lat,
      longitude: BHORANJ.lng,
      timezone: BHORANJ.tz,
      gender: 'male',
      settings: {
        ayanamsha: 'lahiri',
        houseSystem: 'whole_sign',
        nodeMode: 'true',
        karakaScheme: '7',
        gulikaMode: 'phaladipika',
        chartStyle: 'north',
        showDegrees: true,
        showNakshatra: true,
        showKaraka: true,
        showRetro: true,
      },
    })

    expect(chart.meta.ayanamshaValue).toBeCloseTo(23.8519, 3)

    const moon = chart.grahas.find(g => g.id === 'Mo')!
    expect(moon.nakshatraName).toMatch(/Vishakha/i)
    expect(moon.totalDegree).toBeCloseTo(213.162, 2)
    expect(moon.degree).toBeCloseTo(3.162, 2)

    const sun = chart.grahas.find(g => g.id === 'Su')!
    expect(sun.totalDegree).toBeCloseTo(121.922, 2)

    const rahu = chart.grahas.find(g => g.id === 'Ra')!
    expect(rahu.degree).toBeCloseTo(19.02, 1)
    expect(rahu.nakshatraName).toMatch(/Ashlesha/i)

    const moAntar = chart.dashas.vimshottari
      .find(d => d.lord === 'Me')
      ?.children?.find(c => c.lord === 'Mo')
    expect(moAntar).toBeDefined()
    expect(moAntar!.start.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })).toBe('2/12/2025')

    const path = getDashaPathAt(chart.dashas.vimshottari, Date.UTC(2025, 8, 19))
    expect(path[0]?.lord).toBe('Me')
    expect(GRAHA_NAMES[path[0]!.lord as keyof typeof GRAHA_NAMES]).toBe('Mercury')
  })
})
