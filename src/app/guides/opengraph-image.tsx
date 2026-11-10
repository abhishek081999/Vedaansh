import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Jyotish Guides — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'ज्योतिष मार्गदर्शिकाएँ' : 'Jyotish Guides',
    subtitle: hi ? 'कुंडली · दशा · पंचांग · मिलान' : 'Kundali · Dasha · Panchang · Matching',
    badge: hi ? 'निःशुल्क सीखें' : 'Learn Free',
  })
}
