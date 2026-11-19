import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Lal Kitab — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'लाल किताब' : 'Lal Kitab',
    subtitle: hi ? 'टेवा · पक्का घर · दृष्टि' : 'Teva · Pakka Ghar · Aspects',
    badge: hi ? 'उन्नत ज्योतिष' : 'Advanced Jyotish',
  })
}
