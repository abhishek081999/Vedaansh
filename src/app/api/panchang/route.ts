// ─────────────────────────────────────────────────────────────
//  src/app/api/panchang/route.ts
//  GET /api/panchang?date=YYYY-MM-DD&lat=xx&lng=xx&tz=Asia/Kolkata
//  Returns full Panchang for a given date and location
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { addDays } from 'date-fns'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import type { Rashi } from '@/types/astrology'
import { redis, panchangCacheKey, CACHE_TTL } from '@/lib/redis'
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
import { personalBalaPayload } from '@/lib/panchang/tara-chandra-bala'
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

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Input validation ──────────────────────────────────────────

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  lat:  z.coerce.number().min(-90).max(90),
  lng:  z.coerce.number().min(-180).max(180),
  tz:   z.string().default('Asia/Kolkata'),
  ayanamsha: z.enum([
    'lahiri','true_chitra','true_revati','true_pushya',
    'raman','usha_shashi','yukteshwar'
  ]).default('lahiri'),
  birthNak: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().min(0).max(26).optional(),
  ),
  birthMoonRashi: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().min(1).max(12).optional(),
  ),
})

function mergePersonalBala(
  data: Record<string, unknown>,
  birthNak: number | undefined,
  birthMoonRashi: number | undefined,
): Record<string, unknown> {
  if (birthNak === undefined) return data
  const nak = data.nakshatra as { index: number } | undefined
  const moonR = data.moonRashi as { rashi: number } | undefined
  if (!nak || moonR?.rashi == null) return data
  return {
    ...data,
    personalBala: personalBalaPayload(
      birthNak,
      nak.index,
      moonR.rashi as Rashi,
      birthMoonRashi,
    ),
  }
}

// Sunrise/sunset now calculated via swisseph rise_trans (see sunrise.ts)

// ── Route handler ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams)
    const query  = QuerySchema.safeParse(params)

    if (!query.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: query.error.errors },
        { status: 400 },
      )
    }

    const { date, lat, lng, tz, ayanamsha, birthNak, birthMoonRashi } = query.data

    // Check cache
    const cacheKey = panchangCacheKey(date, lat, lng)
    const cached   = await redis.get(cacheKey)
    if (cached) {
      const data = mergePersonalBala(cached as Record<string, unknown>, birthNak, birthMoonRashi)
      return NextResponse.json({ success: true, data, fromCache: true })
    }

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

    // Cache for 24 hours (personal Tārā/Chandra bala is merged per-request, not stored)
    await redis.set(cacheKey, panchang, CACHE_TTL.PANCHANG)

    const data = mergePersonalBala(panchang as Record<string, unknown>, birthNak, birthMoonRashi)

    return NextResponse.json(
      { success: true, data, fromCache: false },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
    )

  } catch (err) {
    console.error('[panchang] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Panchang calculation failed' },
      { status: 500 },
    )
  }
}