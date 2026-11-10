import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Jaimini Astrology — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'जैमिनी ज्योतिष' : 'Jaimini Astrology',
    subtitle: hi ? 'चर दशा · कारक · आरूढ़' : 'Chara Dasha · Karakas (natural indicator) · Arudha',
    badge: hi ? 'शास्त्रीय ज्योतिष' : 'Classical Jyotish',
  })
}
