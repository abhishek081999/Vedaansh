import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Vedic Panchang Calendar — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'पंचांग कैलेंडर' : 'Panchang Calendar',
    subtitle: hi ? 'मासिक तिथि · नक्षत्र · पर्व' : 'Monthly Tithi · Nakshatra · Festivals',
    badge: hi ? 'स्विस एफ़ेमेरिस' : 'Swiss Ephemeris',
  })
}
