import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Vedic Vastu — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Vedic Vastu',
    subtitle: 'Dig Bala · Directions · Remedies',
    badge:    'From Your Kundali',
  })
}
