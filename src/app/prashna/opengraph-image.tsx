import { ogBrandedImage } from '@/lib/seo/og-template'

export const runtime = 'edge'
export const alt = 'Prashna Horary — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return ogBrandedImage({
    title:    'Prashna Jyotish',
    subtitle: 'Krishneeyam Kerala Horary',
    badge:    'Instant Answers',
  })
}
