import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { vastuIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Vastu Shastra — Directional Astrology from Kundali',
  description: 'Vedic Vastu analysis from your birth chart: planetary directions, Dig Bala, Vastu Dosha identification, room guidance, and remedies.',
  alternates:  { canonical: `${SITE_URL}/vastu` },
  keywords:    ['Vastu Shastra', 'Vastu astrology', 'Dig Bala', 'Digbala', 'directional strength', 'Vastu Dosha', 'planetary directions', 'Jyotish Vastu', 'Astro Vastu'],
  openGraph: {
    title:       'Vastu Shastra — Directional Astrology | Vedaansh',
    description: 'Planetary directions, Dig Bala & Vastu Dosha analysis from your Vedic birth chart.',
    url:         `${SITE_URL}/vastu`,
    type:        'website',
    images:      routeOgImage('/vastu', 'Vastu Shastra — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Vastu Shastra — Directional Astrology | Vedaansh',
    description: 'Planetary directions, Dig Bala & Vastu Dosha analysis from your Vedic birth chart.',
    images:      [`${SITE_URL}/vastu/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/vastu', locale, metadataEn, {
    title: 'वास्तु शास्त्र — कुंडली से दिशात्मक ज्योतिष',
    description: 'आपकी जन्म कुंडली से वैदिक वास्तु विश्लेषण: ग्रह दिशाएँ, दिग्बल, वास्तु दोष पहचान, कक्ष मार्गदर्शन और उपाय।',
    ogTitle: 'वास्तु शास्त्र — दिशात्मक ज्योतिष | Vedaansh',
    ogDescription: 'आपकी वैदिक जन्म कुंडली से ग्रह दिशाएँ, दिग्बल और वास्तु दोष विश्लेषण।',
    keywords: ['वास्तु शास्त्र', 'वास्तु ज्योतिष', 'दिग्बल', 'दिशा बल', 'दिशात्मक बल', 'वास्तु दोष', 'ग्रह दिशाएँ', 'ज्योतिष वास्तु', 'ज्योतिष-वास्तु'],
  }), locale, '/vastu/opengraph-image', 'वास्तु शास्त्र — Vedaansh')
}

export default async function VastuLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('vastu')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.vastu'), path: '/vastu' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['vastu']}>{children}</IntlScope>
      <SeoIntro {...vastuIntro(locale)} />
    </>
  )
}
