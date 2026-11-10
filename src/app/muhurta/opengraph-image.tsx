import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Vedic Muhurta Finder — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'मुहूर्त खोजक' : 'Muhurta Finder',
    subtitle: hi ? 'जीवन के शुभ समय' : 'Auspicious Time for Life Events',
    badge: hi ? 'मुहूर्त ज्योतिष' : 'Electional Jyotish',
  })
}
