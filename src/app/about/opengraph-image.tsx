import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'About Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'Vedaansh के बारे में' : 'About Vedaansh',
    subtitle: hi ? 'दृष्टि · टीम · गुरु' : 'Vision · Team · Guru',
    badge: hi ? 'ज्योतिष मंच' : 'Jyotish Platform',
  })
}
