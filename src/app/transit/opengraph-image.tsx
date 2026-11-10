import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Transit Hub — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'गोचर हब' : 'Transit Hub',
    subtitle: hi ? 'रोडमैप · दशा · लाइव गोचर' : 'Roadmap · Dasha Overlay · Live Gochar',
    badge: hi ? 'व्यक्तिगत फलादेश' : 'Personal Forecast',
  })
}
