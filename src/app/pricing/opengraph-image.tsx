import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Pricing — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Pricing Plans',
    subtitle: 'Free · Gold · Platinum',
    badge:    'Start Free',
  })
}
