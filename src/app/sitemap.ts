// Generates sitemap.xml — static pages + all public charts
import type { MetadataRoute } from 'next'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

/** Bump when marketing/tool copy or structure changes — avoid `new Date()` fake freshness. */
const CONTENT_REV = new Date('2026-03-14T00:00:00.000Z')

/** Nakshatra tab slugs — keep in sync with nakshatra/[tab]/layout.tsx TAB_META */
const NAKSHATRA_TABS = ['overview', 'compatibility', 'remedies', 'transits', 'muhurta'] as const

function page(
  path: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  lastModified: Date = CONTENT_REV,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    page('/', 1, 'weekly'),
    page('/panchang', 0.9, 'daily'),
    page('/panchang/calendar', 0.8, 'daily'),
    page('/nakshatra', 0.8, 'weekly'),
    page('/muhurta', 0.8, 'weekly'),
    page('/compare', 0.75, 'monthly'),
    page('/jaimini', 0.75, 'monthly'),
    page('/prashna', 0.75, 'monthly'),
    page('/numerology', 0.75, 'monthly'),
    page('/acg', 0.7, 'monthly'),
    page('/sbc', 0.7, 'monthly'),
    page('/vastu', 0.7, 'monthly'),
    page('/roadmap', 0.65, 'monthly'),
    page('/pricing', 0.6, 'monthly'),
    page('/about', 0.55, 'monthly'),
    page('/support', 0.45, 'monthly'),
    page('/terms', 0.4, 'yearly'),
    page('/privacy', 0.4, 'yearly'),
    page('/refund', 0.4, 'yearly'),
    ...NAKSHATRA_TABS.map((tab) => page(`/nakshatra/${tab}`, 0.75, 'weekly')),
  ]

  try {
    await connectDB()
    const publicCharts = await Chart
      .find({ isPublic: true, slug: { $ne: null } })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean()

    const chartPages: MetadataRoute.Sitemap = publicCharts.map((c) => ({
      url:             `${BASE_URL}/chart/${c.slug}`,
      lastModified:    c.updatedAt ?? CONTENT_REV,
      changeFrequency: 'weekly' as const,
      priority:        0.7,
    }))

    return [...staticPages, ...chartPages]
  } catch {
    return staticPages
  }
}
