import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Jyotish Guides — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Jyotish Guides',
    subtitle: 'Kundali · Dasha · Panchang · Matching',
    badge:    'Learn Free',
  })
}
