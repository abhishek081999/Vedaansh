import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Daily Vedic Panchang — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Daily Vedic Panchang',
    subtitle: 'Tithi · Nakshatra · Yoga · Rahu Kalam',
    badge:    'Free Every Day',
  })
}
