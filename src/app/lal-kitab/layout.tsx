import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Lal Kitab — Teva, Pakka Ghar & Aspects',
  description: 'Lal Kitab on your birth chart: the Teva with house 1 as Aries, permanent houses, exaltation, Lal Kitab aspects, takkar, and the reasons behind every finding.',
  keywords: ['Lal Kitab', 'Lal Kitab kundli', 'Teva', 'pakka ghar', 'Lal Kitab remedies'],
  openGraph: {
    title: 'Lal Kitab — Teva, Pakka Ghar & Aspects | Vedaansh',
    description: 'Your birth chart read by Lal Kitab rules, with the facts behind every finding.',
    url: `${SITE_URL}/lal-kitab`,
    type: 'website',
    images: routeOgImage('/lal-kitab', 'Lal Kitab — Vedaansh'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lal Kitab — Teva, Pakka Ghar & Aspects | Vedaansh',
    description: 'Your birth chart read by Lal Kitab rules, with the facts behind every finding.',
    images: [`${SITE_URL}/lal-kitab/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/lal-kitab', locale, metadataEn, {
    title: 'लाल किताब — टेवा, पक्का घर और दृष्टि',
    description: 'आपकी जन्म कुंडली पर लाल किताब: भाव 1 को मेष मानकर टेवा, पक्के घर, उच्च-नीच, लाल किताब दृष्टि, टक्कर और हर फल के पीछे का कारण।',
    ogTitle: 'लाल किताब — टेवा, पक्का घर और दृष्टि | Vedaansh',
    ogDescription: 'लाल किताब के नियमों से पढ़ी गई आपकी जन्म कुंडली, हर फल के कारण के साथ।',
    keywords: ['लाल किताब', 'लाल किताब कुंडली', 'टेवा', 'पक्का घर', 'लाल किताब उपाय'],
  }), locale, '/lal-kitab/opengraph-image', 'लाल किताब — Vedaansh')
}

export default async function LalKitabLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('lalKitab')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.feature'), path: '/lal-kitab' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['lalKitab']}>{children}</IntlScope>
    </>
  )
}
