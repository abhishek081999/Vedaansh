import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Vedic Panchang Calendar — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Panchang Calendar',
    subtitle: 'Monthly Tithi · Nakshatra · Festivals',
    badge:    'Swiss Ephemeris',
  })
}
