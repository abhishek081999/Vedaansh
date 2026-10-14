import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Vedic Numerology — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Vedic Numerology',
    subtitle: 'Anka Jyotish · Predictions · Remedies',
    badge:    'Full Suite',
  })
}
