import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { pricingFaq } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, faqJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Pricing — Free, Gold & Platinum Plans',
  description: 'Vedaansh pricing: free Kundali and Panchang forever. Gold and Platinum add exports, full 41 vargas, white-labeling, and professional tools.',
  alternates:  { canonical: `${SITE_URL}/pricing` },
  keywords:    ['Vedaansh pricing', 'Vedic astrology subscription', 'free kundali', 'Jyotish software plans', 'astrology app pricing India'],
  openGraph: {
    title:       'Pricing — Vedaansh',
    description: 'Free Vedic astrology forever. Gold and Platinum plans for exports, full vargas, and professional workflows.',
    url:         `${SITE_URL}/pricing`,
    type:        'website',
    images:      routeOgImage('/pricing', 'Vedaansh Pricing Plans'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Pricing — Vedaansh',
    description: 'Free Vedic astrology forever. Gold and Platinum plans for exports, full vargas, and professional workflows.',
    images:      [`${SITE_URL}/pricing/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/pricing', locale, metadataEn, {
    title: 'मूल्य — Free, Gold और Platinum योजनाएँ',
    description: 'Vedaansh मूल्य: कुंडली और पंचांग हमेशा निःशुल्क। Gold और Platinum में निर्यात, पूरी 41 वर्ग, व्हाइट-लेबल और पेशेवर उपकरण।',
    ogTitle: 'मूल्य — Vedaansh',
    ogDescription: 'वैदिक ज्योतिष हमेशा निःशुल्क। निर्यात, पूर्ण वर्ग और पेशेवर वर्कफ़्लो के लिए Gold और Platinum योजनाएँ।',
    keywords: ['Vedaansh मूल्य', 'वैदिक ज्योतिष सदस्यता', 'निःशुल्क कुंडली', 'ज्योतिष सॉफ़्टवेयर योजनाएँ', 'ज्योतिष ऐप मूल्य भारत'],
  }), locale, '/pricing/opengraph-image', 'मूल्य — Vedaansh')
}

export default async function PricingLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('pricing')
  const breadcrumb = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.pricing'), path: '/pricing' },
  ])
  const faq = faqJsonLd(pricingFaq(locale))
  return (
    <>
      <JsonLd data={breadcrumb} />
      <JsonLd data={faq} />
      <IntlScope namespaces={['pricing']}>{children}</IntlScope>
    </>
  )
}
