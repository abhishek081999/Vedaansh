import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { compareIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Free Kundali Matching — Ashtakoot Guna Milan',
  description: 'Free Kundali matching with 36-point Ashtakoot Guna Milan, dosha exceptions, Venus–Mars chemistry, house-difficult influence matching, and Mangal Dosha checks. No login required.',
  alternates:  { canonical: `${SITE_URL}/compare` },
  keywords:    ['Kundali matching', 'free kundali matching', 'Ashtakoot', 'Guna Milan', 'synastry', 'chart comparison', 'Mangal Dosha', 'Vedic compatibility', 'marriage matching'],
  openGraph: {
    title:       'Free Kundali Matching — Ashtakoot Guna Milan | Vedaansh',
    description: '36-point Ashtakoot scoring, dosha analysis, and dual birth-chart comparison — free.',
    url:         `${SITE_URL}/compare`,
    type:        'website',
    images:      routeOgImage('/compare', 'Kundali Matching — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Free Kundali Matching — Ashtakoot Guna Milan | Vedaansh',
    description: '36-point Ashtakoot scoring, dosha analysis, and dual birth-chart comparison — free.',
    images:      [`${SITE_URL}/compare/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/compare', locale, metadataEn, {
    title: 'निःशुल्क कुंडली मिलान — अष्टकूट गुण मिलान',
    description: '36-गुण अष्टकूट गुण मिलान, दोष-अपवाद, शुक्र–मंगल रसायन और मंगल दोष जाँच — निःशुल्क, बिना लॉगिन।',
    ogTitle: 'निःशुल्क कुंडली मिलान — Vedaansh',
    keywords: ['कुंडली मिलान', 'निःशुल्क कुंडली मिलान', 'अष्टकूट', 'गुण मिलान', 'विवाह मिलान', 'मंगल दोष', 'वैदिक मेल'],
  }), locale, '/compare/opengraph-image', 'कुंडली मिलान — Vedaansh')
}

export default async function CompareLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('compare')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.matching'), path: '/compare' },
  ])
  return (
    <IntlScope namespaces={['relationshipMarriage', 'compare']}>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...compareIntro(locale)} />
    </IntlScope>
  )
}
