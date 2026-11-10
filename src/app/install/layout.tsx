import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { IntlScope } from '@/components/providers/IntlScope'
import { JsonLd } from '@/components/seo/JsonLd'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Install App — Android & iPhone',
  description:
    'Install Vedaansh on Android or iPhone. Google Play coming soon; add to home screen from Chrome or Safari for charts and panchang on the go.',
  alternates: { canonical: `${SITE_URL}/install` },
  openGraph: {
    title: 'Install Vedaansh App',
    description:
      'Install Vedaansh on Android or iPhone. Google Play coming soon; browser install steps for Chrome and Safari.',
    url: `${SITE_URL}/install`,
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Install Vedaansh' }],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/install', await pageLocale(), metadataEn, {
    title: 'ऐप इंस्टॉल — Android और iPhone',
    description:
      'Android या iPhone पर Vedaansh इंस्टॉल करें। Google Play जल्द; Chrome या Safari से होम स्क्रीन पर जोड़ें — कुंडली और पंचांग साथ रखें।',
    ogTitle: 'Vedaansh ऐप इंस्टॉल करें',
    ogDescription: 'Android या iPhone पर Vedaansh इंस्टॉल करें। Google Play जल्द; Chrome और Safari के लिए ब्राउज़र चरण।',
  })
}

export default async function InstallLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('install')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.install'), path: '/install' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['install']}>{children}</IntlScope>
    </>
  )
}
