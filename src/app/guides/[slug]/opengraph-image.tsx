import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'
import { getGuide } from '@/lib/seo/guides.hi'

export const runtime = 'edge'
export const alt = 'Vedaansh Jyotish Guide'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<OgSearchParams>
}) {
  const { slug } = await params
  const hi = await ogIsHindi(searchParams)
  const guide = getGuide(slug, hi ? 'hi' : 'en')
  const title = guide?.title ?? (hi ? 'ज्योतिष मार्गदर्शिका' : 'Jyotish Guide')
  const short = title.length > 48 ? `${title.slice(0, 45)}…` : title

  return ogBrandedImage({
    title: short,
    subtitle: hi ? 'Vedaansh मार्गदर्शिका' : 'Vedaansh Guide',
    badge: hi ? 'स्विस एफ़ेमेरिस ज्योतिष' : 'Swiss Ephemeris Jyotish',
  })
}
