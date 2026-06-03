// src/app/chart/[slug]/page.tsx
// Public chart share page — /chart/<slug>
// Optimized via Server Components (SSR) for instant loading and perfect SEO.
// ─────────────────────────────────────────────────────────────

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'
import { User } from '@/lib/db/models/User'
import { calculateChart } from '@/lib/engine/calculator'
import { hydrateCharaDashas } from '@/lib/engine/dasha/hydrateChara'
import { redis, chartCacheKey } from '@/lib/redis'
import { fromZonedTime } from 'date-fns-tz'
import { PublicChartClient } from './PublicChartClient'
import { generateChartMetadata } from './metadata'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ── Helpers ───────────────────────────────────────────────────

function localToUTC(date: string, time: string, tz: string): { utcDate: string; utcTime: string } {
  const safeTime = /^\d{2}:\d{2}:\d{2}$/.test(time) ? time : `${time}:00`
  const localDT  = `${date}T${safeTime}`
  try {
    const utcDate = fromZonedTime(localDT, tz)
    return { 
      utcDate: utcDate.toISOString().slice(0, 10), 
      utcTime: utcDate.toISOString().slice(11, 19) 
    }
  } catch {
    return { utcDate: date, utcTime: safeTime }
  }
}

// ── Page ──────────────────────────────────────────────────────

export default async function PublicChartPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  try {
    await connectDB()

    // 1. Fetch saved chart and update views in one atomic operation
    const savedRaw = await Chart.findOneAndUpdate(
      { slug, isPublic: true },
      { $inc: { views: 1 }, $set: { lastViewedAt: new Date() } },
      { new: true }
    ).lean()

    if (!savedRaw) return notFound()
    const saved = JSON.parse(JSON.stringify(savedRaw))

    // 2. Fetch Owner's Branding
    const owner = await User.findById(saved.userId).select('plan brandName brandLogo').lean()
    const branding = ((owner as any)?.plan === 'platinum') ? {
      brandName: (owner as any).brandName,
      brandLogo: (owner as any).brandLogo
    } : null

    // 3. Check Cache or Calculate
    const { utcDate, utcTime } = localToUTC(saved.birthDate, saved.birthTime, saved.timezone)
    const cacheKey = chartCacheKey(
      utcDate, utcTime,
      saved.latitude, saved.longitude,
      saved.settings?.ayanamsha    || 'lahiri',
      saved.settings?.nodeMode     || 'mean',
      saved.settings?.houseSystem  || 'whole_sign',
      saved.settings?.karakaScheme || 7,
      saved.settings?.gulikaMode   || 'phaladipika',
      0
    )

    let chartData = await redis.get<any>(cacheKey)

    if (!chartData) {
      // Direct engine call (no HTTP overhead)
      chartData = await calculateChart({
        name:       saved.name,
        birthDate:  saved.birthDate,
        birthTime:  saved.birthTime,
        utcDate,
        utcTime,
        birthPlace: saved.birthPlace,
        latitude:   saved.latitude,
        longitude:  saved.longitude,
        timezone:   saved.timezone,
        gender:     saved.gender || 'male',
        settings:   saved.settings,
      }, (owner as any)?.plan || 'free')

      // Background cache fill
      redis.set(cacheKey, chartData, 86_400).catch(() => {})
    }

    // Ensure metadata in chart matches current request (name might have changed)
    const finalChart = hydrateCharaDashas({
      ...chartData,
      meta: {
        ...chartData.meta,
        name: saved.name,
        birthPlace: saved.birthPlace,
      },
    })

    return (
      <PublicChartClient 
        chart={finalChart} 
        saved={saved} 
        branding={branding} 
      />
    )
  } catch (err) {
    console.error('[PublicChartPage] SSR Error:', err)
    throw err // Let Next.js error boundary handle it
  }
}