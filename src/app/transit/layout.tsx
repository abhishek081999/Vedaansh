import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { transitIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Transit Hub — Live Gochar & Forecast | Vedaansh',
  description: 'Personal Vedic transit hub: Live Transit scrubber, Forecast, Moon Passages, and Cosmic Roadmap with Vimshottari dasha overlay.',
  alternates:  { canonical: `${SITE_URL}/transit/scrubber` },
  keywords:    ['Vedic transit', 'gochar', 'planetary transit', 'Dasha timeline', 'Jyotish roadmap', 'transit calendar', 'personal astrology forecast', 'Moon transit'],
  openGraph: {
    title:       'Transit Hub | Vedaansh',
    description: 'Live gochar scrubber, Moon passages, Forecast, and Cosmic Roadmap with Mahadasha/Antardasha overlay.',
    url:         `${SITE_URL}/transit/scrubber`,
    type:        'website',
    images:      routeOgImage('/transit', 'Transit Hub — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Transit Hub | Vedaansh',
    description: 'Live Transit, Forecast, Moon Passages, and Cosmic Roadmap in one hub.',
    images:      [`${SITE_URL}/transit/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/transit/scrubber', await pageLocale(), metadataEn, {
    title: 'गोचर हब — लाइव गोचर और फलादेश | Vedaansh',
    description: 'व्यक्तिगत वैदिक गोचर हब: लाइव गोचर स्क्रबर, फलादेश, चंद्र संक्रमण और विंशोत्तरी दशा ओवरले सहित कॉस्मिक रोडमैप।',
    ogTitle: 'गोचर हब | Vedaansh',
    keywords: ['वैदिक गोचर', 'गोचर', 'ग्रह गोचर', 'दशा समयरेखा', 'ज्योतिष रोडमैप', 'गोचर कैलेंडर', 'व्यक्तिगत ज्योतिष फलादेश', 'चंद्र गोचर'],
  })
}

export default async function TransitLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('transit')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.transit'), path: '/transit/scrubber' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['transit']}>{children}</IntlScope>
      <SeoIntro {...transitIntro(locale)} />
    </>
  )
}
