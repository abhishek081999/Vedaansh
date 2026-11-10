import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { IntlScope } from '@/components/providers/IntlScope'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { aboutIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, faqJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'About — Vision, Team & Guru',
  description:
    'Learn about Vedaansh — a Vedic astrology and community platform. Our vision, creator Abhishek Kumar, and Guru Sameer Bhatnagar Acharya.',
  alternates: { canonical: `${SITE_URL}/about` },
  keywords: [
    'Vedaansh',
    'Vedic astrology',
    'Sameer Bhatnagar',
    'Jyotish community',
    'Vedic culture',
  ],
  openGraph: {
    title: 'About Vedaansh',
    description:
      'Vision for Vedic culture, Jyotish, scripture knowledge, and community — plus the team and Guru behind Vedaansh.',
    url: `${SITE_URL}/about`,
    type: 'website',
    images: routeOgImage('/about', 'About Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'About Vedaansh',
    description:
      'Vision for Vedic culture, Jyotish, and community — plus the team and Guru behind Vedaansh.',
    images:      [`${SITE_URL}/about/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/about', locale, metadataEn, {
    title: 'परिचय — दृष्टि, टीम और गुरु',
    description:
      'Vedaansh के बारे में जानें — वैदिक ज्योतिष और सामुदायिक मंच। हमारी दृष्टि, निर्माता Abhishek Kumar, और गुरु Sameer Bhatnagar आचार्य।',
    ogTitle: 'Vedaansh के बारे में',
    ogDescription:
      'वैदिक संस्कृति, ज्योतिष, शास्त्र ज्ञान और समुदाय की दृष्टि — तथा Vedaansh के पीछे की टीम और गुरु।',
    keywords: [
      'Vedaansh',
      'वैदिक ज्योतिष',
      'Sameer Bhatnagar',
      'ज्योतिष समुदाय',
      'वैदिक संस्कृति',
    ],
  }), locale, '/about/opengraph-image', 'Vedaansh के बारे में')
}

export default async function AboutLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('about')
  const { seo, faq } = aboutIntro(locale)
  const breadcrumb = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.about'), path: '/about' },
  ])

  return (
    <>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqJsonLd(faq)} />
      <IntlScope namespaces={['about']}>{children}</IntlScope>
      <SeoIntro {...seo} />
    </>
  )
}
