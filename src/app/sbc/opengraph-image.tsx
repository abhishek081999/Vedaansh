import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Sarvatobhadra Chakra — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Sarvatobhadra Chakra',
    subtitle: '9×9 Transit Vedha Grid',
    badge:    'Classical Timing',
  })
}
