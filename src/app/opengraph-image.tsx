import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Vedaansh — Free Vedic Astrology Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Free Vedic Astrology',
    subtitle: 'Kundali · Dasha · 41 Vargas · Panchang',
    badge:    'Swiss Ephemeris Precision',
  })
}
