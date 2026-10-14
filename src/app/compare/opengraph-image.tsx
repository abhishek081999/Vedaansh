import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Kundali Matching — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Kundali Matching',
    subtitle: 'Ashtakoot · Guna Milan · Synastry',
    badge:    'Free Compatibility',
  })
}
