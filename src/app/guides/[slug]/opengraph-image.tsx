import { ogBrandedImage } from '@/lib/seo/og-template'
import { getGuide } from '@/lib/seo/guides'

export const runtime = 'edge'
export const alt = 'Vedaansh Jyotish Guide'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = getGuide(slug)
  const title = guide?.title ?? 'Jyotish Guide'
  const short = title.length > 48 ? `${title.slice(0, 45)}…` : title

  return ogBrandedImage({
    title:    short,
    subtitle: 'Vedaansh Guide',
    badge:    'Swiss Ephemeris Jyotish',
  })
}
