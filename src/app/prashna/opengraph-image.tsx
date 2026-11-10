import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Prashna Horary — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'प्रश्न ज्योतिष' : 'Prashna Jyotish',
    subtitle: hi ? 'कृष्णीय केरल प्रश्न' : 'Krishneeyam Kerala Horary',
    badge: hi ? 'तुरंत उत्तर' : 'Instant Answers',
  })
}
