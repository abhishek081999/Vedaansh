// ─────────────────────────────────────────────────────────────
//  src/lib/panchang/buildPanchangDay.ts
//  Server-only: full panchang for one date + place. Shared by
//  /api/panchang and the admin Social Studio data route (sweph).
// ─────────────────────────────────────────────────────────────

import { addDays } from 'date-fns'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import type { AyanamshaMode, Rashi } from '@/types/astrology'
import { getSunriseSunset, getMoonriseMoonset, getSunrise } from '@/lib/engine/sunrise'
import { rashiBlockFromLongitude } from '@/lib/panchang/sidereal'
import { getChoghadiyaTable } from '@/lib/panchang/choghadiya'
import {
  SAURA_MASA_BY_RASHI,
  RITU_BY_RASHI,
  getAyana,
  SAMVATSARA_NAMES,
  samvatsaraIndexForYear,
  approximateShakaYear,
  approximateVikramSamvat,
} from '@/lib/panchang/hindu-calendar'
import { findNextTithiEnd, findNextNakshatraEnd, findNextYogaEnd } from '@/lib/panchang/transitions'
import { buildPanchangDayTimeline } from '@/lib/panchang/day-timeline'
import { getPanchangPlanetSnapshot } from '@/lib/panchang/planets-snapshot'
import {
  getDurMuhurat,
  getGodhuliMuhurat,
  isRiktaTithi,
  riktaTithiDescription,
} from '@/lib/panchang/muhurta-extra'
import {
  toJulianDay,
  getPlanetPosition,
  getAyanamsha,
  toSidereal,
  SWISSEPH_IDS,
} from '@/lib/engine/ephemeris'
import {
  getNakshatra, getTithi, getYoga, getKarana, getVara,
  getRahuKalam, getGulikaKalam, getYamaganda, getAbhijitMuhurta,
  getHoraTable,
} from '@/lib/engine/nakshatra'

export interface PanchangDayInput {
  date: string
  lat: number
  lng: number
  tz: string
  ayanamsha: AyanamshaMode
}

export function buildPanchangDay({ date, lat, lng, tz, ayanamsha }: PanchangDayInput) {
  // Compute noon JD for the date (in UTC)
  const noonLocal = fromZonedTime(`${date}T12:00:00`, tz)
  const y = noonLocal.getUTCFullYear()
  const m = noonLocal.getUTCMonth() + 1
  const d = noonLocal.getUTCDate()
  const h = noonLocal.getUTCHours() + noonLocal.getUTCMinutes() / 60 + noonLocal.getUTCSeconds() / 3600

  const jd   = toJulianDay(y, m, d, h)
  const ayan = getAyanamsha(jd, ayanamsha)

  const sunPos  = getPlanetPosition(jd, SWISSEPH_IDS.Su)
  const moonPos = getPlanetPosition(jd, SWISSEPH_IDS.Mo)

  const sunSid  = toSidereal(sunPos.longitude,  ayan)
  const moonSid = toSidereal(moonPos.longitude, ayan)

  const vara    = getVara(jd)
  const tithi   = getTithi(moonSid, sunSid)
  const yoga    = getYoga(sunSid, moonSid)
  const karana  = getKarana(moonSid, sunSid)
  const moonNak = getNakshatra(moonSid)
  const sunNak  = getNakshatra(sunSid)

  // Real sunrise/sunset via swisseph rise_trans
  const { sunrise, sunset } = getSunriseSunset(date, lat, lng, tz)
  const { moonrise, moonset } = getMoonriseMoonset(date, lat, lng, tz)

  const rahuKalam   = getRahuKalam(sunrise, sunset, vara.number)
  const gulikaKalam = getGulikaKalam(sunrise, sunset, vara.number)
  const yamaganda   = getYamaganda(sunrise, sunset, vara.number)
  const abhijit     = getAbhijitMuhurta(sunrise, sunset)
  const horaTable   = getHoraTable(sunrise, sunset, vara.lord)

  const nextDateStr = formatInTimeZone(addDays(fromZonedTime(`${date}T12:00:00`, tz), 1), tz, 'yyyy-MM-dd')
  const nextSunrise = getSunrise(nextDateStr, lat, lng, tz)
  const timeline = buildPanchangDayTimeline(sunrise, nextSunrise, sunset, ayanamsha)
  const choghadiya  = getChoghadiyaTable(sunrise, sunset, nextSunrise, vara.number)

  const tithiEnd   = findNextTithiEnd(jd, ayanamsha)
  const nakEnd     = findNextNakshatraEnd(jd, ayanamsha)
  const yogaEnd    = findNextYogaEnd(jd, ayanamsha)
  const planetRows = getPanchangPlanetSnapshot(jd, ayanamsha)

  const sunRashiBlk = rashiBlockFromLongitude(sunSid)
  const elong = ((moonSid - sunSid) % 360 + 360) % 360

  const ceYear    = parseInt(formatInTimeZone(noonLocal, tz, 'yyyy'), 10)
  const ceMonth0  = parseInt(formatInTimeZone(noonLocal, tz, 'MM'), 10) - 1
  const samIdx    = samvatsaraIndexForYear(ceYear)
  const ritu      = RITU_BY_RASHI[sunRashiBlk.rashi as Rashi]
  const ayana     = getAyana(sunRashiBlk.rashi as Rashi)

  const brahmaStart = new Date(sunrise.getTime() - 96 * 60 * 1000)
  const brahmaEnd   = new Date(sunrise.getTime() - 48 * 60 * 1000)

  const [dur1, dur2] = getDurMuhurat(sunrise, sunset)
  const godhuli      = getGodhuliMuhurat(sunset)
  const rikta        = isRiktaTithi(tithi.number)

  const panchang = {
    date,
    location: { lat, lng, tz },
    ayanamsha,
    sunRashi:  rashiBlockFromLongitude(sunSid),
    moonRashi: rashiBlockFromLongitude(moonSid),
    vara: {
      number:   vara.number,
      name:     vara.name,
      sanskrit: vara.sanskrit,
      lord:     vara.lord,
    },
    tithi: {
      number:  tithi.number,
      name:    tithi.name,
      paksha:  tithi.paksha,
      lord:    tithi.lord,
      percent: tithi.percent,
    },
    nakshatra: {
      index:   moonNak.index,
      name:    moonNak.name,
      pada:    moonNak.pada,
      lord:    moonNak.lord,
      degree:  moonNak.degreeInNak,
    },
    sunNakshatra: {
      index: sunNak.index,
      name:  sunNak.name,
      pada:  sunNak.pada,
      lord:  sunNak.lord,
    },
    yoga: {
      number:  yoga.number,
      name:    yoga.name,
      quality: yoga.quality,
      percent: yoga.percent,
    },
    karana: {
      number:  karana.number,
      name:    karana.name,
      type:    karana.type,
      isBhadra:karana.isBhadra,
    },
    sunrise: sunrise.toISOString(),
    sunset:  sunset.toISOString(),
    moonrise: moonrise ? moonrise.toISOString() : null,
    moonset:  moonset ? moonset.toISOString() : null,
    rahuKalam:   { start: rahuKalam.start.toISOString(),   end: rahuKalam.end.toISOString() },
    gulikaKalam: { start: gulikaKalam.start.toISOString(), end: gulikaKalam.end.toISOString() },
    yamaganda:   { start: yamaganda.start.toISOString(),   end: yamaganda.end.toISOString() },
    abhijitMuhurta: abhijit
      ? { start: abhijit.start.toISOString(), end: abhijit.end.toISOString() }
      : null,
    horaTable: horaTable.map((h) => ({
      lord:      h.lord,
      start:     h.start.toISOString(),
      end:       h.end.toISOString(),
      isDaytime: h.isDaytime,
    })),
    sunLongitudeSidereal:  sunSid,
    moonLongitudeSidereal: moonSid,
    julianDay: jd,
    lunarElongationDeg: Math.round(elong * 1000) / 1000,
    calendarContext: {
      sauraMasa: SAURA_MASA_BY_RASHI[sunRashiBlk.rashi as Rashi],
      rituSa: ritu.sa,
      rituEn: ritu.en,
      ayanaSa: ayana.sa,
      ayanaEn: ayana.en,
      samvatsara: SAMVATSARA_NAMES[samIdx],
      samvatsaraIndex: samIdx,
      shakaYear: approximateShakaYear(ceYear, ceMonth0),
      vikramSamvat: approximateVikramSamvat(ceYear, ceMonth0),
    },
    limbEnds: {
      tithi: tithiEnd ? tithiEnd.toISOString() : null,
      nakshatra: nakEnd ? nakEnd.toISOString() : null,
      yoga: yogaEnd ? yogaEnd.toISOString() : null,
    },
    brahmaMuhurta: {
      start: brahmaStart.toISOString(),
      end: brahmaEnd.toISOString(),
    },
    planets: planetRows.map((p) => ({
      id: p.id,
      sa: p.sa,
      longitude: Math.round(p.longitude * 1e6) / 1e6,
      rashiEn: p.rashiEn,
      rashiSa: p.rashiSa,
      degInSign: Math.round(p.degInSign * 1e4) / 1e4,
      retro: p.retro,
      combust: p.combust,
    })),
    choghadiya: {
      day: choghadiya.day.map((s) => ({
        name: s.name,
        quality: s.quality,
        start: s.start.toISOString(),
        end: s.end.toISOString(),
      })),
      night: choghadiya.night.map((s) => ({
        name: s.name,
        quality: s.quality,
        start: s.start.toISOString(),
        end: s.end.toISOString(),
      })),
    },
    riktaTithi: {
      active: rikta,
      detail: riktaTithiDescription(),
    },
    durMuhurat: [
      { start: dur1.start.toISOString(), end: dur1.end.toISOString() },
      { start: dur2.start.toISOString(), end: dur2.end.toISOString() },
    ],
    godhuliMuhurat: {
      start: godhuli.start.toISOString(),
      end: godhuli.end.toISOString(),
    },
    timeline,
  }
  return panchang
}

export type PanchangDay = ReturnType<typeof buildPanchangDay>
