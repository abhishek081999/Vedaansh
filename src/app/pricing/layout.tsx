import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { PRICING_FAQ } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, faqJsonLd, ogImages, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Pricing — Free, Gold & Platinum Plans',
  description: 'Vedaansh pricing: free Kundali and Panchang forever. Gold and Platinum add exports, full 41 vargas, white-labeling, and professional tools.',
  alternates:  { canonical: `${SITE_URL}/pricing` },
  keywords:    ['Vedaansh pricing', 'Vedic astrology subscription', 'free kundali', 'Jyotish software plans', 'astrology app pricing India'],
  openGraph: {
    title:       'Pricing — Vedaansh',
    description: 'Free Vedic astrology forever. Gold and Platinum plans for exports, full vargas, and professional workflows.',
    url:         `${SITE_URL}/pricing`,
    type:        'website',
    images:      ogImages('Vedaansh Pricing Plans'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Pricing — Vedaansh',
    description: 'Free Vedic astrology forever. Gold and Platinum plans for exports, full vargas, and professional workflows.',
    images:      ['/og-default.png'],
  },
}

const breadcrumb = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Pricing', path: '/pricing' },
])

const faq = faqJsonLd([...PRICING_FAQ])

export default async function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faq} />
      {children}
    </>
  )
}
