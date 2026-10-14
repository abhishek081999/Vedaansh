import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Nakshatra Analysis — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Nakshatra Analysis',
    subtitle: 'Pada · Compatibility · Remedies',
    badge:    'All 27 Stars',
  })
}
