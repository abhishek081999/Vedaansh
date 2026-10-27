import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Nadi Astrology — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title: 'Nadi Astrology',
    subtitle: 'Chart · Positions · Dasha',
    badge: 'Advanced Jyotish',
  })
}
