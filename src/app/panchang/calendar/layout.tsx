import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { PANCHANG_CALENDAR_SEO } from '@/lib/seo/intro-content'
import { routeOgImage, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Vedic Panchang Calendar — Monthly Tithi & Nakshatra',
  description: 'Monthly Vedic Panchang calendar: every day\'s Tithi, Nakshatra, Yoga, Karana, festivals, Ekadashi, Amavasya & Purnima. Swiss Ephemeris accuracy.',
  alternates:  { canonical: `${SITE_URL}/panchang/calendar` },
  keywords:    ['Vedic calendar', 'Panchang calendar', 'Tithi calendar', 'Ekadashi', 'Purnima', 'Amavasya', 'Hindu calendar', 'Nakshatra calendar'],
  openGraph: {
    title:       'Vedic Panchang Calendar — Tithi, Nakshatra & Festivals',
    description: 'Monthly Vedic calendar with every day\'s Tithi, Nakshatra, Yoga, festivals & auspicious days.',
    url:         `${SITE_URL}/panchang/calendar`,
    type:        'website',
    images:      routeOgImage('/panchang/calendar', 'Vedic Panchang Calendar — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Vedic Panchang Calendar | Vedaansh',
    description: 'Monthly Tithi, Nakshatra, Yoga, festivals & auspicious days. Swiss Ephemeris accuracy.',
    images:      [`${SITE_URL}/panchang/calendar/opengraph-image`],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type':    'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home',             item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Panchang',         item: `${SITE_URL}/panchang` },
    { '@type': 'ListItem', position: 3, name: 'Monthly Calendar', item: `${SITE_URL}/panchang/calendar` },
  ],
}

export default async function PanchangCalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...PANCHANG_CALENDAR_SEO} />
    </>
  )
}
