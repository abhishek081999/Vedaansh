import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Transit Roadmap — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'गोचर रोडमैप' : 'Transit Roadmap',
    subtitle: hi ? 'दशा · ग्रह खिड़कियाँ · समयरेखा' : 'Dasha · Graha Windows · Timeline',
    badge: hi ? 'व्यक्तिगत फलादेश' : 'Personal Forecast',
  })
}
