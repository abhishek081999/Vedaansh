import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Astrocartography — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Astrocartography',
    subtitle: 'Planetary Lines · Relocation',
    badge:    'Vedic Locality',
  })
}
