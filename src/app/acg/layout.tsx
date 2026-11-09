import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { acgIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Astrocartography — Vedic Locality Charts',
  description: 'Vedic Astrocartography (ACG): find your power locations worldwide using planetary lines, Parivartana zones & relocation chart strength analysis.',
  alternates:  { canonical: `${SITE_URL}/acg` },
  keywords:    ['astrocartography', 'Vedic locality chart', 'ACG', 'planetary lines', 'relocation astrology', 'power locations', 'Jyotish ACG'],
  openGraph: {
    title:       'Astrocartography — Vedic Locality Charts | Vedaansh',
    description: 'Find your power locations worldwide using Vedic planetary lines & relocation chart analysis.',
    url:         `${SITE_URL}/acg`,
    type:        'website',
    images:      routeOgImage('/acg', 'Astrocartography — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Astrocartography — Vedic Locality Charts | Vedaansh',
    description: 'Find your power locations worldwide using Vedic planetary lines & relocation chart analysis.',
    images:      [`${SITE_URL}/acg/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/acg', await pageLocale(), metadataEn, {
    title: 'एस्ट्रोकार्टोग्राफी — वैदिक स्थान कुंडली',
    description: 'वैदिक एस्ट्रोकार्टोग्राफी (ACG): ग्रह रेखाओं, परिवर्तना क्षेत्रों और स्थानांतरण-कुंडली के बल विश्लेषण से विश्व भर में अपने शक्ति-स्थान खोजें।',
    ogTitle: 'एस्ट्रोकार्टोग्राफी — वैदिक स्थान कुंडली | Vedaansh',
    ogDescription: 'वैदिक ग्रह रेखाओं और स्थानांतरण-कुंडली विश्लेषण से विश्व भर में अपने शक्ति-स्थान खोजें।',
    keywords: ['एस्ट्रोकार्टोग्राफी', 'वैदिक स्थान कुंडली', 'ACG', 'ग्रह रेखाएँ', 'स्थानांतरण ज्योतिष', 'शक्ति स्थान', 'ज्योतिष ACG'],
  })
}

export default async function ACGLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('acg')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.feature'), path: '/acg' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['acg']}>{children}</IntlScope>
      <SeoIntro {...acgIntro(locale)} />
    </>
  )
}
