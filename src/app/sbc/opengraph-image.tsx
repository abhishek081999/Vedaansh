import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Sarvatobhadra Chakra — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'सर्वतोभद्र चक्र' : 'Sarvatobhadra Chakra',
    subtitle: hi ? '9×9 गोचर वेध जाल' : '9×9 Transit Vedha Grid',
    badge: hi ? 'शास्त्रीय समय' : 'Classical Timing',
  })
}
