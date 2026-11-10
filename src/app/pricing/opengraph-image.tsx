import { ogBrandedImage } from '@/lib/seo/og-template'
import { ogIsHindi, type OgSearchParams } from '@/lib/seo/og-locale'

export const runtime = 'edge'
export const alt = 'Pricing — Vedaansh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ searchParams }: { searchParams?: Promise<OgSearchParams> } = {}) {
  const hi = await ogIsHindi(searchParams)
  return ogBrandedImage({
    title: hi ? 'मूल्य योजनाएँ' : 'Pricing Plans',
    subtitle: hi ? 'Free · Gold · Platinum' : 'Free · Gold · Platinum',
    badge: hi ? 'निःशुल्क आरंभ' : 'Start Free',
  })
}
