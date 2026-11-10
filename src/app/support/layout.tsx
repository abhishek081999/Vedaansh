import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { IntlScope } from '@/components/providers/IntlScope'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { supportIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Support',
  description:
    'Contact Vedaansh for billing, account access, chart exports, and technical support. Email help for Gold and Platinum subscribers and free users.',
  alternates: { canonical: `${SITE_URL}/support` },
  openGraph: {
    title:       'Support — Vedaansh',
    description: 'Billing, account, and technical support for the Vedaansh Vedic astrology platform.',
    url:         `${SITE_URL}/support`,
    type:        'website',
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/support', await pageLocale(), metadataEn, {
    title: 'सहायता',
    description:
      'बिलिंग, खाता पहुँच, कुंडली निर्यात और तकनीकी सहायता के लिए Vedaansh से संपर्क करें। Gold और Platinum सदस्यों तथा निःशुल्क उपयोगकर्ताओं के लिए ईमेल सहायता।',
    ogTitle: 'सहायता — Vedaansh',
    ogDescription: 'Vedaansh वैदिक ज्योतिष मंच के लिए बिलिंग, खाता और तकनीकी सहायता।',
  })
}

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('support')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.support'), path: '/support' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['support']}>{children}</IntlScope>
      <SeoIntro {...supportIntro(locale)} />
    </>
  )
}
