import {
  SWISSEPH_IDS,
  dateToJD,
  degreeInSign,
  getAyanamsha,
  getPlanetPosition,
  ketuLongitude,
  signOf,
  toSidereal,
} from '@/lib/engine/ephemeris'
import { calcVimshottari } from '@/lib/engine/dasha/vimshottari'
import { getKarana, getNakshatra, getTithi, getVara, getYoga } from '@/lib/engine/nakshatra'
import {
  DEFAULT_SETTINGS,
  GRAHA_NAMES,
  RASHI_NAMES,
  type ChartOutput,
  type ChartSettings,
  type GrahaData,
  type GrahaId,
} from '@/types/astrology'

export interface CalculateChartInput {
  name: string
  birthDate: string
  birthTime: string
  birthPlace: string
  latitude: number
  longitude: number
  timezone: string
  settings?: ChartSettings
}

function parseUtcDateTime(date: string, time: string): Date {
  const safeTime = /^\d{2}:\d{2}:\d{2}$/.test(time) ? time : `${time}:00`
  return new Date(`${date}T${safeTime}Z`)
}

function buildGrahas(jd: number, ayanamsha: number): GrahaData[] {
  const grahaOrder: Array<Exclude<GrahaId, 'Ke'>> = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra']

  const grahas: GrahaData[] = grahaOrder.map((id): GrahaData => {
    const pos = getPlanetPosition(jd, SWISSEPH_IDS[id])
    const lonSidereal = toSidereal(pos.longitude, ayanamsha)
    const nak = getNakshatra(lonSidereal)
    const rashi = signOf(lonSidereal) as GrahaData['rashi']

    return {
      id,
      name: GRAHA_NAMES[id],
      lonTropical: pos.longitude,
      lonSidereal,
      latitude: pos.latitude,
      speed: pos.speed,
      isRetro: pos.isRetro,
      isCombust: false,
      rashi,
      rashiName: RASHI_NAMES[rashi],
      degree: degreeInSign(lonSidereal),
      totalDegree: lonSidereal,
      nakshatraIndex: nak.index,
      nakshatraName: nak.name,
      pada: nak.pada,
      dignity: 'neutral',
      charaKaraka: null,
    }
  })

  const rahu = grahas.find((g) => g.id === 'Ra')
  if (rahu) {
    const ketuLonSidereal = ketuLongitude(rahu.lonSidereal)
    const ketuNak = getNakshatra(ketuLonSidereal)
    const ketuRashi = signOf(ketuLonSidereal) as GrahaData['rashi']

    grahas.push({
      id: 'Ke',
      name: GRAHA_NAMES.Ke,
      lonTropical: ketuLongitude(rahu.lonTropical),
      lonSidereal: ketuLonSidereal,
      latitude: -rahu.latitude,
      speed: rahu.speed,
      isRetro: rahu.isRetro,
      isCombust: false,
      rashi: ketuRashi,
      rashiName: RASHI_NAMES[ketuRashi],
      degree: degreeInSign(ketuLonSidereal),
      totalDegree: ketuLonSidereal,
      nakshatraIndex: ketuNak.index,
      nakshatraName: ketuNak.name,
      pada: ketuNak.pada,
      dignity: 'neutral',
      charaKaraka: null,
    })
  }

  return grahas
}

export async function calculateChart(input: CalculateChartInput): Promise<ChartOutput> {
  const settings = input.settings ?? DEFAULT_SETTINGS
  const birthDateTime = parseUtcDateTime(input.birthDate, input.birthTime)
  const jd = dateToJD(birthDateTime)
  const ayanamshaValue = getAyanamsha(jd, settings.ayanamsha)

  const grahas = buildGrahas(jd, ayanamshaValue)
  const moon = grahas.find((g) => g.id === 'Mo')
  const sun = grahas.find((g) => g.id === 'Su')

  if (!moon || !sun) {
    throw new Error('Failed to calculate Sun/Moon positions')
  }

  const moonNak = getNakshatra(moon.lonSidereal)
  const tithi = getTithi(moon.lonSidereal, sun.lonSidereal)
  const yoga = getYoga(sun.lonSidereal, moon.lonSidereal)
  const karana = getKarana(moon.lonSidereal, sun.lonSidereal)
  const vara = getVara(jd)
  const vimshottari = calcVimshottari(moon.lonSidereal, birthDateTime, 4)

  return {
    meta: {
      name: input.name,
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      birthPlace: input.birthPlace,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: input.timezone,
      settings,
      calculatedAt: new Date(),
      ayanamshaValue,
      julianDay: jd,
    },
    grahas,
    lagnas: {
      ascDegree: 0,
      ascRashi: 1,
      ascDegreeInRashi: 0,
      horaLagna: 0,
      ghatiLagna: 0,
      bhavaLagna: 0,
      pranapada: 0,
      sriLagna: 0,
      varnadaLagna: 0,
      cusps: [],
      bhavalCusps: [],
    },
    arudhas: {
      AL: 1,
      A2: 1,
      A3: 1,
      A4: 1,
      A5: 1,
      A6: 1,
      A7: 1,
      A8: 1,
      A9: 1,
      A10: 1,
      A11: 1,
      A12: 1,
      grahaArudhas: { Su: 1, Mo: 1, Ma: 1, Me: 1, Ju: 1, Ve: 1, Sa: 1, Ra: 1, Ke: 1 },
      suryaArudhas: {},
      chandraArudhas: {},
    },
    karakas: {
      scheme: settings.karakaScheme,
      AK: 'Su',
      AmK: 'Mo',
      BK: 'Ma',
      MK: 'Me',
      PK: 'Ju',
      GK: 'Ve',
      DK: 'Sa',
      PiK: settings.karakaScheme === 8 ? 'Ra' : null,
    },
    vargas: { D1: grahas },
    dashas: {
      vimshottari,
      yogini: [],
      ashtottari: [],
      chara: [],
      narayana: [],
      tithi_ashtottari: [],
      naisargika: [],
    },
    panchang: {
      date: input.birthDate,
      location: { lat: input.latitude, lng: input.longitude, tz: input.timezone },
      vara: { number: vara.number, name: vara.name, lord: vara.lord },
      tithi: {
        number: tithi.number,
        name: tithi.name,
        paksha: tithi.paksha,
        lord: tithi.lord,
        endTime: new Date(birthDateTime.getTime() + 60 * 60 * 1000),
      },
      nakshatra: {
        index: moonNak.index,
        name: moonNak.name,
        pada: moonNak.pada,
        lord: moonNak.lord,
        degree: moonNak.degreeInNak,
        moonNakshatra: moonNak.name,
      },
      yoga: {
        number: yoga.number,
        name: yoga.name,
        endTime: new Date(birthDateTime.getTime() + 60 * 60 * 1000),
      },
      karana: {
        number: karana.number,
        name: karana.name,
        endTime: new Date(birthDateTime.getTime() + 30 * 60 * 1000),
      },
      sunrise: birthDateTime,
      sunset: birthDateTime,
      moonrise: null,
      moonset: null,
      rahuKalam: { start: birthDateTime, end: birthDateTime },
      gulikaKalam: { start: birthDateTime, end: birthDateTime },
      yamaganda: { start: birthDateTime, end: birthDateTime },
      abhijitMuhurta: null,
      horaTable: [],
    },
    upagrahas: {},
  }
}
