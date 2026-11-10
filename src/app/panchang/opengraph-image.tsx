import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Daily Vedic Panchang — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'दैनिक वैदिक पंचांग' : 'Daily Vedic Panchang',
    subtitle: hi ? 'तिथि · नक्षत्र · योग · राहु काल' : 'Tithi · Nakshatra · Yoga · Rahu Kalam',
    badge: hi ? 'हर दिन निःशुल्क' : 'Free Every Day',
  })
}
