import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { prashnaIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Prashna — Krishneeyam Kerala Horary Astrology',
  description: 'Free Prashna Jyotish with Krishneeyam Kerala horary rules: Yes/No verdicts, timing, lost articles, health, travel, and relationship queries.',
  keywords: ['Prashna', 'horary astrology', 'Krishneeyam', 'Kerala astrology', 'Prashna Jyotish', 'Aroodha', 'Udaya Lagna', 'Yes No astrology', 'Nashta Prashna', 'free prashna chart'],
  openGraph: {
    title: 'Prashna — Krishneeyam Kerala Horary | Vedaansh',
    description: 'Instant Prashna chart with Krishneeyam rules: Yes/No, When, What, Who, Lost Article, Health & more.',
    url: `${SITE_URL}/prashna`,
    type: 'website',
    images: routeOgImage('/prashna', 'Prashna Kerala Horary Astrology — Vedaansh'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prashna — Krishneeyam Kerala Horary | Vedaansh',
    description: 'Instant Prashna chart with traditional Krishneeyam rules for Yes/No, timing, lost articles & more.',
    images: [`${SITE_URL}/prashna/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/prashna', locale, metadataEn, {
    title: 'प्रश्न — कृष्णीय केरल होरेरी ज्योतिष',
    description: 'निःशुल्क प्रश्न ज्योतिष, कृष्णीय केरल होरेरी नियमों के साथ: हाँ/नहीं, समय, खोई वस्तु, स्वास्थ्य, यात्रा और संबंध के प्रश्न।',
    ogTitle: 'प्रश्न — कृष्णीय केरल होरेरी | Vedaansh',
    ogDescription: 'कृष्णीय नियमों के साथ तुरंत प्रश्न कुंडली: हाँ/नहीं, कब, क्या, कौन, खोई वस्तु, स्वास्थ्य और अधिक।',
    keywords: ['प्रश्न', 'होरेरी ज्योतिष', 'कृष्णीय', 'केरल ज्योतिष', 'प्रश्न ज्योतिष', 'आरूढ़', 'उदय लग्न', 'हाँ नहीं', 'नष्ट प्रश्न', 'निःशुल्क प्रश्न कुंडली'],
  }), locale, '/prashna/opengraph-image', 'प्रश्न ज्योतिष — Vedaansh')
}

export default async function PrashnaLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('prashna')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.feature'), path: '/prashna' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['prashna']}>{children}</IntlScope>
      <SeoIntro {...prashnaIntro(locale)} />
    </>
  )
}
