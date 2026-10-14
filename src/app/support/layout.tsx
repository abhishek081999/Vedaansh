import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { SUPPORT_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Support',
  description:
    'Contact Vedaansh for billing, account access, chart exports, and technical support. Email help for Gold and Platinum subscribers and free users.',
  alternates: { canonical: `${SITE_URL}/support` },
  openGraph: {
    title:       'Support — Vedaansh',
    description: 'Billing, account, and technical support for the Vedaansh Vedic astrology platform.',
    url:         `${SITE_URL}/support`,
    type:        'website',
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Support', path: '/support' },
])

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...SUPPORT_SEO} />
    </>
  )
}
