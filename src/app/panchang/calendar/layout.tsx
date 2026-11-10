import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { panchangCalendarIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/panchang/calendar', locale, metadataEn, {
    title: 'मासिक पंचांग कैलेंडर — तिथि, नक्षत्र और पर्व',
    description: 'मासिक वैदिक पंचांग कैलेंडर: हर दिन की तिथि, नक्षत्र, योग, करण, पर्व, एकादशी, अमावस्या और पूर्णिमा। स्विस एफ़ेमेरिस की सटीकता।',
    ogTitle: 'मासिक पंचांग कैलेंडर — Vedaansh',
    keywords: ['पंचांग कैलेंडर', 'हिंदू कैलेंडर', 'तिथि कैलेंडर', 'एकादशी', 'पूर्णिमा', 'अमावस्या', 'मासिक पंचांग'],
  }), locale, '/panchang/calendar/opengraph-image', 'मासिक पंचांग कैलेंडर — Vedaansh')
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
  const locale = await pageLocale()
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...panchangCalendarIntro(locale)} />
    </>
  )
}
