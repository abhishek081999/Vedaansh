import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Nakshatra Analysis — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'नक्षत्र विश्लेषण' : 'Nakshatra Analysis',
    subtitle: hi ? 'पाद · मेल · उपाय' : 'Pada · Compatibility · Remedies',
    badge: hi ? 'सभी 27 नक्षत्र' : 'All 27 Stars',
  })
}
