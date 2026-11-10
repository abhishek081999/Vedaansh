import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Nadi Astrology — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'नाड़ी ज्योतिष' : 'Nadi Astrology',
    subtitle: hi ? 'भाव · योग · समय' : 'Houses · Yogas · Timing',
    badge: hi ? 'उन्नत ज्योतिष' : 'Advanced Jyotish',
  })
}
