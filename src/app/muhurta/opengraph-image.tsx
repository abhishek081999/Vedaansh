import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Vedic Muhurta Finder — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Muhurta Finder',
    subtitle: 'Auspicious Time for Life Events',
    badge:    'Electional Jyotish',
  })
}
