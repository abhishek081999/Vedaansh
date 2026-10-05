import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requirePlanGate } from '@/lib/security/planAccess'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { getSunriseSunset } from '@/lib/engine/sunrise'
import {
  getVara,
  getTithi,
  getNakshatra,
  getYoga,
  getKarana,
  getRahuKalam,
  getGulikaKalam,
  getYamaganda,
  getAbhijitMuhurta,
  getHoraLord,
} from '@/lib/engine/nakshatra'
import { dateToJD, getPlanetPosition, SWISSEPH_IDS, getAyanamsha } from '@/lib/engine/ephemeris'
import {
  MUHURTA_ACTIVITIES,
  type MuhurtaActivity,
  type MuhurtaScore,
} from '@/lib/engine/muhurtaAnalysis'
import { scoreMuhurtaFull } from '@/lib/engine/muhurtaElection'
import { calcHouses } from '@/lib/engine/houses'
import { getChoghadiya, getMuhurtaPanchaka } from '@/lib/engine/muhurtaAdvanced'
import type { GrahaId } from '@/types/astrology'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const blocked = await guardRoute(req, routeSecurityPresets.muhurtaRead())
  if (blocked) return blocked

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const planBlocked = await requirePlanGate(session.user.id, 'gold')
  if (planBlocked) return planBlocked

  let lastStage = 'initialization'
  try {
    const { searchParams } = new URL(req.url)
    lastStage = 'location-parsing'
    const lat = parseFloat(searchParams.get('lat') || '28.6139')
    const lng = parseFloat(searchParams.get('lng') || '77.2090')
    const tz = searchParams.get('tz') || 'Asia/Kolkata'
    const natalNak = parseInt(searchParams.get('natalNak') || '0')
    const natalSign = parseInt(searchParams.get('natalSign') || '1')
    const ayanMode = (searchParams.get('ayan') || 'lahiri') as Parameters<typeof getAyanamsha>[1]
    const mahaLord = (searchParams.get('maha') || '') as GrahaId | ''
    const antarLord = (searchParams.get('antar') || '') as GrahaId | ''
    const savRaw = searchParams.get('sav') || ''
    const savBindusByRashi = savRaw
      ? savRaw.split(',').map(n => parseInt(n, 10)).filter(n => Number.isFinite(n))
      : undefined
    const savOk = savBindusByRashi && savBindusByRashi.length === 12 ? savBindusByRashi : undefined
    const dasha =
      mahaLord && ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'].includes(mahaLord)
        ? {
            maha: mahaLord as GrahaId,
            antar:
              antarLord && ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'].includes(antarLord)
                ? (antarLord as GrahaId)
                : undefined,
          }
        : undefined

    lastStage = 'planetary-engine'
    const startDate = new Date()

    try {
      lastStage = 'ayanamsha'
      const jdStart = dateToJD(startDate)
      getAyanamsha(jdStart, ayanMode)
    } catch (e) {
      console.error('[muhurta/timeline] Ayanamsha initialization failed:', e)
    }

    const intervals = 48
    const timelineData: { time: string; scores: Record<MuhurtaActivity, MuhurtaScore> }[] = []

    const dateToday = startDate.toISOString().split('T')[0]
    const nextDate = new Date(startDate.getTime() + 86400000).toISOString().split('T')[0]

    lastStage = 'sunInfoToday'
    const sunInfoToday = getSunriseSunset(dateToday, lat, lng, tz)
    lastStage = 'sunInfoNext'
    const sunInfoNext = getSunriseSunset(nextDate, lat, lng, tz)

    for (let i = 0; i < intervals; i++) {
      const currentTime = new Date(startDate.getTime() + i * 30 * 60 * 1000)
      const jd = dateToJD(currentTime)

      lastStage = `interval-${i}-positions`
      let sunPos, moonPos
      try {
        sunPos = getPlanetPosition(jd, SWISSEPH_IDS.Su, true)
        moonPos = getPlanetPosition(jd, SWISSEPH_IDS.Mo, true)
      } catch (epheError) {
        console.error(`[muhurta/timeline] Ephemeris error at interval ${i}:`, epheError)
        continue
      }

      lastStage = `interval-${i}-panchang`
      const tithi = getTithi(moonPos.longitude, sunPos.longitude)
      const nakshatra = getNakshatra(moonPos.longitude)
      const yoga = getYoga(sunPos.longitude, moonPos.longitude)
      const karana = getKarana(moonPos.longitude, sunPos.longitude)
      const vara = getVara(jd)

      lastStage = `interval-${i}-kalam`
      const sunInfo = currentTime < sunInfoNext.sunrise ? sunInfoToday : sunInfoNext

      const rahu = getRahuKalam(sunInfo.sunrise, sunInfo.sunset, vara.number)
      const gulika = getGulikaKalam(sunInfo.sunrise, sunInfo.sunset, vara.number)
      const yamaganda = getYamaganda(sunInfo.sunrise, sunInfo.sunset, vara.number)
      const abhijit = getAbhijitMuhurta(sunInfo.sunrise, sunInfo.sunset)

      const isRahuKalam = currentTime >= rahu.start && currentTime <= rahu.end
      const isGulikaKalam = currentTime >= gulika.start && currentTime <= gulika.end
      const isYamaganda = currentTime >= yamaganda.start && currentTime <= yamaganda.end
      const isAbhijit = abhijit
        ? currentTime >= abhijit.start && currentTime <= abhijit.end
        : false

      lastStage = `interval-${i}-advanced`
      const houseData = calcHouses(jd, lat, lng, ayanMode)
      const lagnaIndex = houseData.ascRashi

      const panchaka = getMuhurtaPanchaka(
        tithi.number,
        vara.number,
        nakshatra.index + 1,
        lagnaIndex,
      )

      const choghadiyaRes = getChoghadiya(
        currentTime,
        sunInfoToday.sunrise,
        sunInfoToday.sunset,
        sunInfoNext.sunrise,
        vara.number,
      )

      let horaLord
      const isDaytime = currentTime >= sunInfo.sunrise && currentTime < sunInfo.sunset
      if (isDaytime) {
        const dayDuration = sunInfo.sunset.getTime() - sunInfo.sunrise.getTime()
        const horaDuration = dayDuration / 12
        const horaIndex = Math.floor(
          (currentTime.getTime() - sunInfo.sunrise.getTime()) / horaDuration,
        )
        horaLord = getHoraLord(vara.lord, horaIndex)
      } else {
        const nightStart = sunInfo.sunset.getTime()
        const nightEnd = sunInfoNext.sunrise.getTime()
        const nightDuration = nightEnd - nightStart
        const horaDuration = nightDuration / 12
        let diff = currentTime.getTime() - nightStart
        if (diff < 0) diff += 24 * 3600000
        const horaIndex = 12 + Math.floor(diff / horaDuration)
        horaLord = getHoraLord(vara.lord, horaIndex)
      }

      lastStage = `interval-${i}-scoring`
      const scores = {} as Record<MuhurtaActivity, MuhurtaScore>
      // getPlanetPosition(..., true) already returns sidereal longitudes
      const sunSid = sunPos.longitude
      const moonSid = moonPos.longitude

      for (const act of MUHURTA_ACTIVITIES) {
        try {
          scores[act] = scoreMuhurtaFull(
            act,
            {
              tithi,
              nakshatra,
              yoga,
              karana,
              vara,
              isRahuKalam,
              isGulikaKalam,
              isYamaganda,
              isAbhijit,
              horaLord,
              choghadiya: choghadiyaRes,
              panchaka,
            },
            { moonNak: natalNak, moonSign: natalSign },
            {
              lagnaRashi: lagnaIndex,
              moonLonSidereal: moonSid,
              sunLonSidereal: sunSid,
              dasha,
              savBindusByRashi: savOk,
            },
          )
        } catch (scoringError) {
          console.error(`[muhurta/timeline] Scoring error for ${act}:`, scoringError)
          scores[act] = {
            score: 0,
            label: 'Avoid',
            factors: ['Error in calculation'],
          }
        }
      }

      timelineData.push({
        time: currentTime.toISOString(),
        scores,
      })
    }

    return NextResponse.json({ success: true, data: timelineData })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[muhurta/timeline] CRITICAL error:', error, { stage: lastStage })
    return NextResponse.json(
      { success: false, error: message, stage: lastStage },
      { status: 500 },
    )
  }
}
