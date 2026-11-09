import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { nakshatraIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Nakshatra Analysis — Vedic Astrology',
  description: 'Deep Nakshatra analysis: Pada, ruling deity, planet, compatibility, remedies, Yogini Dasha & transit activation. Swiss Ephemeris precision for all 27 Nakshatras.',
  alternates:  { canonical: `${SITE_URL}/nakshatra` },
  keywords:    ['Nakshatra', 'Vedic nakshatra', 'birth star', 'Pada', 'Yogini dasha', 'nakshatra compatibility', 'Ashwini', 'Rohini', 'Hasta'],
  openGraph: {
    title:       'Nakshatra Analysis — Vedaansh',
    description: 'All 27 Nakshatras — Pada, deity, planet, Yogini Dasha & remedies. Swiss Ephemeris accuracy.',
    url:         `${SITE_URL}/nakshatra`,
    type:        'website',
    images:      routeOgImage('/nakshatra', 'Nakshatra Analysis — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Nakshatra Analysis — Vedaansh',
    description: 'All 27 Nakshatras — Pada, deity, planet, Yogini Dasha & remedies.',
    images:      [`${SITE_URL}/nakshatra/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/nakshatra', await pageLocale(), metadataEn, {
    title: 'नक्षत्र विश्लेषण — वैदिक ज्योतिष',
    description: 'गहन नक्षत्र विश्लेषण: पाद, अधिष्ठातृ देवता, ग्रह, अनुकूलता, उपाय, योगिनी दशा और गोचर सक्रियण। सभी २७ नक्षत्रों के लिए स्विस एफ़ेमेरिस सटीकता।',
    ogTitle: 'नक्षत्र विश्लेषण — Vedaansh',
    ogDescription: 'सभी २७ नक्षत्र — पाद, देवता, ग्रह, योगिनी दशा और उपाय। स्विस एफ़ेमेरिस सटीकता।',
    keywords: ['नक्षत्र', 'वैदिक नक्षत्र', 'जन्म नक्षत्र', 'पाद', 'योगिनी दशा', 'नक्षत्र अनुकूलता', 'अश्विनी', 'रोहिणी', 'हस्त'],
  })
}

export default async function NakshatraLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('nakshatra')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.nakshatra'), path: '/nakshatra' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['nakshatra']}>{children}</IntlScope>
      <SeoIntro {...nakshatraIntro(locale)} />
    </>
  )
}
