import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { ABOUT_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, faqJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'About — Vision, Team & Guru',
  description:
    'Learn about Vedaansh — a Vedic astrology and community platform. Our vision, creator Abhishek Kumar, and Guru Sameer Bhatnagar Acharya.',
  alternates: { canonical: `${SITE_URL}/about` },
  keywords: [
    'Vedaansh',
    'Vedic astrology',
    'Sameer Bhatnagar',
    'Jyotish community',
    'Vedic culture',
  ],
  openGraph: {
    title: 'About Vedaansh',
    description:
      'Vision for Vedic culture, Jyotish, scripture knowledge, and community — plus the team and Guru behind Vedaansh.',
    url: `${SITE_URL}/about`,
    type: 'website',
    images: routeOgImage('/about', 'About Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'About Vedaansh',
    description:
      'Vision for Vedic culture, Jyotish, and community — plus the team and Guru behind Vedaansh.',
    images:      [`${SITE_URL}/about/opengraph-image`],
  },
}

const breadcrumb = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
])

const faq = faqJsonLd([
  {
    q: 'What is Vedaansh?',
    a: 'Vedaansh is a free Vedic astrology platform offering birth charts (Kundali), Dasha, 41 varga charts, Panchang, Nakshatra analysis, and Muhurta tools with Swiss Ephemeris precision.',
  },
  {
    q: 'Is Vedaansh free to use?',
    a: 'Core chart calculation, Panchang, and many Jyotish tools are free. Optional paid plans add saved charts, exports, and advanced features.',
  },
  {
    q: 'Which ayanamsha does Vedaansh use?',
    a: 'Vedaansh uses Lahiri (Chitrapaksha) ayanamsha by default, with Swiss Ephemeris for arc-second accurate planetary positions.',
  },
])

export default async function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faq} />
      {children}
      <SeoIntro {...ABOUT_SEO} />
    </>
  )
}
