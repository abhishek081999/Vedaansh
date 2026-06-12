import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { SBC_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, ogImages, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Sarvatobhadra Chakra — Vedic Transit Grid',
  description: 'Sarvatobhadra Chakra (SBC): analyze planetary transits, Vedhas, Nakshatra activation, Muhurta, and life-area predictions on the 9×9 Vedic grid.',
  alternates:  { canonical: `${SITE_URL}/sbc` },
  keywords:    ['Sarvatobhadra Chakra', 'SBC', 'Vedic transit', 'Vedha', 'Nakshatra transit', 'Vedic grid', 'transit analysis', 'Sarvatobhadra'],
  openGraph: {
    title:       'Sarvatobhadra Chakra — Vedic Transit Grid | Vedaansh',
    description: 'Planetary transits, Vedhas & Nakshatra activation on the traditional Sarvatobhadra Chakra.',
    url:         `${SITE_URL}/sbc`,
    type:        'website',
    images:      ogImages('Sarvatobhadra Chakra — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Sarvatobhadra Chakra — Vedic Transit Grid | Vedaansh',
    description: 'Planetary transits, Vedhas & Nakshatra activation on the traditional Sarvatobhadra Chakra.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Sarvatobhadra Chakra', path: '/sbc' },
])

export default async function SBCLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoIntro {...SBC_SEO} />
      <JsonLd data={jsonLd} />
      {children}
    </>
  )
}
