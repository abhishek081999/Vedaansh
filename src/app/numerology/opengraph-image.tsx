import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Vedic Numerology — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'वैदिक अंक ज्योतिष' : 'Vedic Numerology',
    subtitle: hi ? 'अंक ज्योतिष · फल · उपाय' : 'Anka Jyotish · Predictions · Remedies',
    badge: hi ? 'पूर्ण संग्रह' : 'Full Suite',
  })
}
