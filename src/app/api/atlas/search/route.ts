// ─────────────────────────────────────────────────────────────
//  src/app/api/atlas/search/route.ts
//  Lightweight geocoding (Photon) + offline timezone lookup
//  Replaces 115MB SQLite with public geocoding APIs + Redis
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { redis, CACHE_TTL, atlasCacheKey, atlasReverseCacheKey } from '@/lib/redis'
import { resolveTimezone } from '@/lib/geo/timezone'

// ── Types ──────────────────────────────────────────────────────
interface LocationResult {
  name:      string
  country:   string
  admin1:    string    // State/Province
  latitude:  number
  longitude: number
  timezone:  string
  population:number
}

// ── Photon API Types ───────────────────────────────────────────
interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    city?: string
    state?: string
    country?: string
    osm_value?: string
    extent?: [number, number, number, number]
  }
}

import { applyRouteSecurity } from '@/lib/security/route'
import { rateLimitMessages, RATE_LIMIT_WINDOWS, userLimits } from '@/lib/security/rateLimitPolicy'

const ATLAS_RATE_LIMIT = {
  bucket: 'atlas_search',
  limit: userLimits.atlasSearchPerMinute,
  windowSeconds: RATE_LIMIT_WINDOWS.minute,
  message: rateLimitMessages.atlas,
} as const

async function blockIfAtlasRateLimited(req: NextRequest) {
  const securityBlocked = await applyRouteSecurity(req, { rateLimit: ATLAS_RATE_LIMIT })
  return securityBlocked
}

// ── Route Handler ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const latParam = req.nextUrl.searchParams.get('lat')
  const lngParam = req.nextUrl.searchParams.get('lng')

  // 1. Handle Reverse Geocoding (by Lat/Lng)
  if (latParam && lngParam) {
    try {
      const lat = parseFloat(latParam)
      const lng = parseFloat(lngParam)
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
      }
      const reverseCacheKey = atlasReverseCacheKey(lat, lng)

      // Cached reverse lookups are cheap — do not count against rate limit
      const cached = await redis.get<LocationResult>(reverseCacheKey)
      if (cached) {
        return NextResponse.json({ results: [cached], fromCache: true })
      }

      const securityBlocked = await blockIfAtlasRateLimited(req)
      if (securityBlocked) return securityBlocked
      
      const tz = resolveTimezone(lat, lng)

      // The place name is optional: a geocoder outage must not lose the timezone.
      let place: { city?: string; locality?: string; countryName?: string; principalSubdivision?: string } = {}
      let placeResolved = false
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`, {
          next: { revalidate: 604800 }
        })
        if (!res.ok) throw new Error(`BigDataCloud API error ${res.status}`)
        place = await res.json()
        placeResolved = true
      } catch (err) {
        console.warn('[atlas/reverse] Place name lookup failed:', err instanceof Error ? err.message : err)
      }

      const result: LocationResult = {
        name:      place.city || place.locality || 'Current Location',
        country:   place.countryName || '',
        admin1:    place.principalSubdivision || '',
        latitude:  lat,
        longitude: lng,
        timezone:  tz,
        population: 0
      }

      if (!placeResolved) {
        return NextResponse.json({ results: [result], fromCache: false })
      }

      // Cache in Redis (7 days)
      await redis.set(reverseCacheKey, result, CACHE_TTL.ATLAS)

      return NextResponse.json({ results: [result], fromCache: false })
    } catch (err) {
      console.error('[atlas/reverse] Error:', err)
      return NextResponse.json({ results: [] })
    }
  }

  // 2. Handle Search (by Query)
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Global search cache to prevent redundant external Photon calls
  const searchCacheKey = atlasCacheKey(q)
  const cachedResults = await redis.get<LocationResult[]>(searchCacheKey)
  if (cachedResults && cachedResults.length > 0) {
    return NextResponse.json(
      { results: cachedResults, fromCache: true },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } }
    )
  }

  const securityBlocked = await blockIfAtlasRateLimited(req)
  if (securityBlocked) return securityBlocked

  try {
    let features: PhotonFeature[] = []

    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10`
      const photonRes = await fetch(photonUrl)
      if (!photonRes.ok) {
        const text = await photonRes.text()
        throw new Error(`Photon API error ${photonRes.status}: ${text.slice(0, 100)}`)
      }
      const photonData = await photonRes.json()
      features = photonData.features || []
    } catch (primaryErr) {
      console.warn('[atlas/search] Primary geocoder failed, falling back...', primaryErr instanceof Error ? primaryErr.message : primaryErr)
      
      try {
        // Fallback 1: Open-Meteo
        const meteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&format=json`
        const meteoRes = await fetch(meteoUrl)
        if (!meteoRes.ok) {
          const text = await meteoRes.text()
          throw new Error(`Open-Meteo API error ${meteoRes.status}: ${text.slice(0, 100)}`)
        }
        const meteoData = await meteoRes.json()
        features = (meteoData.results || []).map((item: any) => ({
          geometry: { coordinates: [item.longitude, item.latitude] },
          properties: {
            name: item.name,
            state: item.admin1,
            country: item.country,
          }
        }))
      } catch (secondaryErr) {
        console.warn('[atlas/search] Open-Meteo geocoder failed, falling back to Nominatim...', secondaryErr instanceof Error ? secondaryErr.message : secondaryErr)
        // Fallback 2: Nominatim
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=10`
        const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'VedaanshAstrology/1.0' } })
        
        if (!nomRes.ok) {
          const text = await nomRes.text()
          throw new Error(`Fallback API error ${nomRes.status}: ${text.slice(0, 100)}`)
        }
        const nomData = await nomRes.json()
        
        // Convert Nominatim format to Photon format
        features = nomData.map((item: any) => ({
          geometry: { coordinates: [parseFloat(item.lon), parseFloat(item.lat)] },
          properties: {
            name: item.name,
            city: item.type === 'city' ? item.name : undefined,
            country: item.display_name?.split(',').pop()?.trim()
          }
        }))
      }
    }

    // Map features to our standard interface + Parallel TZ Lookup
    const results: LocationResult[] = await Promise.all(
      features.map(async (feat) => {
        const [lng, lat] = feat.geometry.coordinates
        
        const name    = feat.properties.name || feat.properties.city || 'Unknown'
        const country = feat.properties.country || ''
        const admin1  = feat.properties.state || ''

        const timezone = resolveTimezone(lat, lng)

        return {
          name,
          country,
          admin1,
          latitude:  lat,
          longitude: lng,
          timezone,
          population: 0
        }
      })
    )

    // Only cache if we actually have results
    if (results.length > 0) {
      await redis.set(searchCacheKey, results, CACHE_TTL.ATLAS)
    }

    return NextResponse.json(
      { results, fromCache: false },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        },
      },
    )
  } catch (err) {
    console.error('[atlas/search] Error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ results: [] })
  }
}
