import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { muhurtaIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Muhurta Finder — Auspicious Time & Shubh Muhurat',
  description: 'Gold Muhurta finder for weddings, griha pravesh, travel, and business. Scores days by Tithi, Nakshatra, Yoga, Karana, Rahu Kalam, and personal Tara/Chandra Bala.',
  alternates:  { canonical: `${SITE_URL}/muhurta` },
  keywords:    ['Muhurta', 'auspicious time', 'Vedic election astrology', 'wedding Muhurta', 'Shubh Muhurta', 'Rahu Kalam', 'Tithi', 'Nakshatra timing'],
  openGraph: {
    title:       'Muhurta — Auspicious Time Selector | Vedaansh',
    description: 'Tithi, Nakshatra, Yoga, Karana & personal Dasha analysis to find your perfect auspicious time.',
    url:         `${SITE_URL}/muhurta`,
    type:        'website',
    images:      routeOgImage('/muhurta', 'Muhurta — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Muhurta — Auspicious Time Selector | Vedaansh',
    description: 'Find your perfect auspicious Muhurta using Vedic Panchang & personal Dasha compatibility.',
    images:      [`${SITE_URL}/muhurta/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/muhurta', locale, metadataEn, {
    title: 'मुहूर्त खोजक — शुभ समय और शुभ मुहूर्त',
    description: 'विवाह, गृह प्रवेश, यात्रा और व्यापार के लिए Gold मुहूर्त खोजक। तिथि, नक्षत्र, योग, करण, राहु काल और व्यक्तिगत तारा/चंद्र बल से दिनों का मूल्यांकन।',
    ogTitle: 'मुहूर्त — शुभ समय चयन | Vedaansh',
    keywords: ['मुहूर्त', 'शुभ समय', 'वैदिक इलेक्शनल ज्योतिष', 'विवाह मुहूर्त', 'शुभ मुहूर्त', 'राहु काल', 'तिथि', 'नक्षत्र समय'],
  }), locale, '/muhurta/opengraph-image', 'मुहूर्त — Vedaansh')
}

export default async function MuhurtaLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('muhurta')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.muhurta'), path: '/muhurta' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['muhurta', 'panchang']}>{children}</IntlScope>
      <SeoIntro {...muhurtaIntro(locale)} />
    </>
  )
}
