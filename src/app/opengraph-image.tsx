import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Vedaansh — Free Vedic Astrology Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'निःशुल्क वैदिक ज्योतिष' : 'Free Vedic Astrology',
    subtitle: hi ? 'कुंडली · दशा · 41 वर्ग · पंचांग' : 'Kundali · Dasha · 41 Vargas · Panchang',
    badge: hi ? 'स्विस एफ़ेमेरिस सटीकता' : 'Swiss Ephemeris Precision',
  })
}
