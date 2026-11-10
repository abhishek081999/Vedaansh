import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Kundali Matching — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'कुंडली मिलान' : 'Kundali Matching',
    subtitle: hi ? 'अष्टकूट · गुण मिलान · मेल' : 'Ashtakoot · Guna Milan · Synastry',
    badge: hi ? 'निःशुल्क मिलान' : 'Free Compatibility',
  })
}
