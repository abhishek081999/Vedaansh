// Lahiri VP285 (true, with nutation) — matches apps that show Bhoranj dashas one day later than JHora.
import { describe, expect, it } from 'vitest'
import { fromZonedTime } from 'date-fns-tz'
import { calculateChart } from '@/lib/engine/calculator'
import { getAyanamsha, dateToJD } from '@/lib/engine/ephemeris'

const ist = (d: Date) => d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

describe('Lahiri VP285 (true) ayanamsha', () => {
  it('is a true (nutated) value distinct from mean Lahiri', () => {
    const jd = dateToJD(new Date('1999-08-19T04:30:00Z'))
    expect(getAyanamsha(jd, 'lahiri_vp285')).toBeCloseTo(23.85497, 4)
    expect(getAyanamsha(jd, 'lahiri')).toBeCloseTo(23.85192, 4)
  })

  it('Bhoranj 1999: Saturn and Mercury mahadashas start on 3 Nov', async () => {
    const utc = fromZonedTime('1999-08-19T10:00:00', 'Asia/Kolkata')
    const chart = await calculateChart({
      name: 'T', birthDate: '1999-08-19', birthTime: '10:00',
      utcDate: utc.toISOString().slice(0, 10), utcTime: utc.toISOString().slice(11, 19),
      birthPlace: 'Bhoranj', latitude: 31.644, longitude: 76.642, timezone: 'Asia/Kolkata', gender: 'male',
      settings: {
        ayanamsha: 'lahiri_vp285', houseSystem: 'whole_sign', nodeMode: 'true', karakaScheme: 7,
        gulikaMode: 'phaladipika', chartStyle: 'north', showDegrees: true, showNakshatra: true,
        showKaraka: true, showRetro: true,
      },
    })
    const v = chart.dashas.vimshottari
    expect(v[0].lord).toBe('Ju')
    expect(ist(v.find(d => d.lord === 'Sa')!.start)).toBe('3/11/1999')
    expect(ist(v.find(d => d.lord === 'Me')!.start)).toBe('3/11/2018')
  })
})
