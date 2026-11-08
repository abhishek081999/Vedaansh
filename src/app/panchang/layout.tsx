import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { panchangIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Free Daily Panchang — Tithi, Nakshatra & Rahu Kalam',
  description: 'Free daily Vedic Panchang: Tithi, Vara, Nakshatra, Yoga, Karana, Rahu Kalam, Gulika & Abhijit Muhurta. Real sunrise/sunset via Swiss Ephemeris.',
  alternates:  { canonical: `${SITE_URL}/panchang` },
  keywords:    ['Panchang', 'daily panchang', 'Tithi', 'Nakshatra', 'Rahu Kalam', 'Abhijit Muhurta', 'Hora table', 'Vedic calendar', 'Hindu panchang'],
  openGraph: {
    title:       'Daily Panchang — Vedaansh',
    description: 'Free daily Vedic Panchang with astronomical sunrise, Rahu Kalam, Nakshatra & Hora table.',
    url:         `${SITE_URL}/panchang`,
    type:        'website',
    images:      routeOgImage('/panchang', 'Daily Panchang — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Daily Panchang — Vedaansh',
    description: 'Tithi, Nakshatra, Yoga, Karana, Rahu Kalam & Hora table — free every day.',
    images:      [`${SITE_URL}/panchang/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/panchang', await pageLocale(), metadataEn, {
    title: 'आज का पंचांग — तिथि, नक्षत्र, राहु काल (निःशुल्क)',
    description: 'निःशुल्क दैनिक वैदिक पंचांग: तिथि, वार, नक्षत्र, योग, करण, राहु काल, गुलिक और अभिजित मुहूर्त। स्विस एफ़ेमेरिस से वास्तविक सूर्योदय/सूर्यास्त।',
    ogTitle: 'आज का पंचांग — Vedaansh',
    keywords: ['आज का पंचांग', 'दैनिक पंचांग', 'तिथि', 'नक्षत्र', 'राहु काल', 'अभिजित मुहूर्त', 'चौघड़िया', 'होरा', 'हिंदू पंचांग'],
  })
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Panchang', path: '/panchang' },
])

export default async function PanchangLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['panchang']}>{children}</IntlScope>
      <SeoIntro {...panchangIntro(locale)} />
    </>
  )
}