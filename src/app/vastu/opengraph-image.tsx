import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Vedic Vastu — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'वैदिक वास्तु' : 'Vedic Vastu',
    subtitle: hi ? 'दिग्बल · दिशाएँ · उपाय' : 'Dig Bala · Directions · Remedies',
    badge: hi ? 'आपकी कुंडली से' : 'From Your Kundali',
  })
}
