import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { nadiIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Nadi Astrology — Houses, Yogas & Timing',
  description: 'Nadi Astrology on your Vedic birth chart: the active reading, twelve houses, yogas, marriage, career, wealth, coming years, transits, and remedies.',
  keywords: ['Nadi astrology', 'Bhrigu Nandi Nadi', 'Vedic chart', 'planetary positions', 'Vimshottari dasha'],
  openGraph: {
    title: 'Nadi Astrology — Houses, Yogas & Timing | Vedaansh',
    description: 'Active Nadi reading on your birth chart: houses, yogas, marriage, career, wealth, coming years, and the live sky.',
    url: `${SITE_URL}/nadi`,
    type: 'website',
    images: routeOgImage('/nadi', 'Nadi Astrology — Vedaansh'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nadi Astrology — Houses, Yogas & Timing | Vedaansh',
    description: 'Active Nadi reading on your birth chart: houses, yogas, marriage, career, wealth, coming years, and the live sky.',
    images: [`${SITE_URL}/nadi/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/nadi', await pageLocale(), metadataEn, {
    title: 'नाड़ी ज्योतिष — भाव, योग और समय',
    description: 'आपकी वैदिक जन्म कुंडली पर नाड़ी ज्योतिष: सक्रिय पठन, बारह भाव, योग, विवाह, करियर, धन, आने वाले वर्ष, गोचर और उपाय।',
    ogTitle: 'नाड़ी ज्योतिष — भाव, योग और समय | Vedaansh',
    ogDescription: 'जन्म कुंडली पर सक्रिय नाड़ी पठन: भाव, योग, विवाह, करियर, धन, आने वाले वर्ष और लाइव आकाश।',
    keywords: ['नाड़ी ज्योतिष', 'भृगु नंदी नाड़ी', 'वैदिक कुंडली', 'ग्रह स्थिति', 'विंशोत्तरी दशा'],
  })
}

export default async function NadiLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('nadi')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.feature'), path: '/nadi' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['nadi']}>{children}</IntlScope>
      <SeoIntro {...nadiIntro(locale)} />
    </>
  )
}
