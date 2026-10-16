import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Transit Hub — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Transit Hub',
    subtitle: 'Roadmap · Dasha Overlay · Live Gochar',
    badge:    'Personal Forecast',
  })
}
