import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Astrocartography — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'एस्ट्रोकार्टोग्राफी' : 'Astrocartography',
    subtitle: hi ? 'ग्रह रेखाएँ · स्थानांतरण' : 'Planetary Lines · Relocation',
    badge: hi ? 'वैदिक स्थान' : 'Vedic Locality',
  })
}
