// src/app/sitemap.ts
// Generates sitemap.xml — static pages + all public charts
import type { MetadataRoute } from 'next'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

/** Nakshatra tab slugs — keep in sync with nakshatra/[tab]/layout.tsx TAB_META */
const NAKSHATRA_TABS = ['overview', 'compatibility', 'remedies', 'transits', 'muhurta'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:             BASE_URL,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        1,
    },
    {
      url:             `${BASE_URL}/panchang`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        0.9,
    },
    {
      url:             `${BASE_URL}/panchang/calendar`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        0.8,
    },
    {
      url:             `${BASE_URL}/nakshatra`,
      lastModified:    new Date(),
      changeFrequency: 'weekly',
      priority:        0.8,
    },
    {
      url:             `${BASE_URL}/muhurta`,
      lastModified:    new Date(),
      changeFrequency: 'weekly',
      priority:        0.8,
    },
    {
      url:             `${BASE_URL}/compare`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.75,
    },
    {
      url:             `${BASE_URL}/jaimini`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.75,
    },
    {
      url:             `${BASE_URL}/prashna`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.75,
    },
    {
      url:             `${BASE_URL}/acg`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.7,
    },
    {
      url:             `${BASE_URL}/sbc`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.7,
    },
    {
      url:             `${BASE_URL}/vastu`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.7,
    },
    {
      url:             `${BASE_URL}/roadmap`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.65,
    },
    {
      url:             `${BASE_URL}/pricing`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.6,
    },
    {
      url:             `${BASE_URL}/about`,
      lastModified:    new Date(),
      changeFrequency: 'monthly',
      priority:        0.55,
    },
    ...NAKSHATRA_TABS.map((tab) => ({
      url:             `${BASE_URL}/nakshatra/${tab}`,
      lastModified:    new Date(),
      changeFrequency: 'weekly' as const,
      priority:        0.75,
    })),
  ]

  // Public chart pages
  try {
    await connectDB()
    const publicCharts = await Chart
      .find({ isPublic: true, slug: { $ne: null } })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean()

    const chartPages: MetadataRoute.Sitemap = publicCharts.map((c: any) => ({
      url:             `${BASE_URL}/chart/${c.slug}`,
      lastModified:    c.updatedAt ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority:        0.7,
    }))

    return [...staticPages, ...chartPages]
  } catch {
    return staticPages
  }
}