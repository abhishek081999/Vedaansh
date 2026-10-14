import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { PRASHNA_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Prashna — Krishneeyam Kerala Horary Astrology',
  description: 'Free Prashna Jyotish with Krishneeyam Kerala horary rules: Yes/No verdicts, timing, lost articles, health, travel, and relationship queries.',
  alternates:  { canonical: `${SITE_URL}/prashna` },
  keywords:    ['Prashna', 'horary astrology', 'Krishneeyam', 'Kerala astrology', 'Prashna Jyotish', 'Aroodha', 'Udaya Lagna', 'Yes No astrology', 'Nashta Prashna', 'free prashna chart'],
  openGraph: {
    title:       'Prashna — Krishneeyam Kerala Horary | Vedaansh',
    description: 'Instant Prashna chart with Krishneeyam rules: Yes/No, When, What, Who, Lost Article, Health & more.',
    url:         `${SITE_URL}/prashna`,
    type:        'website',
    images:      routeOgImage('/prashna', 'Prashna Kerala Horary Astrology — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Prashna — Krishneeyam Kerala Horary | Vedaansh',
    description: 'Instant Prashna chart with traditional Krishneeyam rules for Yes/No, timing, lost articles & more.',
    images:      [`${SITE_URL}/prashna/opengraph-image`],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Prashna', path: '/prashna' },
])

export default async function PrashnaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...PRASHNA_SEO} />
    </>
  )
}
