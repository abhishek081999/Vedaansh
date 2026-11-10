import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { jaiminiIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Jaimini Astrology — Chara Dasha & Karakas (natural indicator)',
  description: 'Jaimini Jyotish on your Vedic chart: Atmakaraka, Amatyakaraka, Chara Dasha periods, Jaimini aspects, Arudha Lagna & Padas & Sphuta calculations.',
  keywords:    ['Jaimini astrology', 'Chara Dasha', 'Atmakaraka', 'Amatyakaraka', 'Jaimini Karakas', 'Jaimini aspects', 'Arudha Lagna', 'Karakamsha', 'Argala'],
  openGraph: {
    title:       'Jaimini Astrology — Chara Dasha & Karakas (natural indicator) | Vedaansh',
    description: 'Atmakaraka, Chara Dasha, Jaimini aspects & Arudha Lagna & Padas on your Vedic birth chart.',
    url:         `${SITE_URL}/jaimini`,
    type:        'website',
    images:      routeOgImage('/jaimini', 'Jaimini Astrology — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Jaimini Astrology — Chara Dasha & Karakas (natural indicator) | Vedaansh',
    description: 'Atmakaraka, Chara Dasha, Jaimini aspects & Arudha Lagna & Padas on your Vedic birth chart.',
    images:      [`${SITE_URL}/jaimini/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/jaimini', locale, metadataEn, {
    title: 'जैमिनी ज्योतिष — चर दशा और कारक',
    description: 'आपकी वैदिक कुंडली पर जैमिनी ज्योतिष: आत्मकारक, अमात्यकारक, चर दशा, जैमिनी दृष्टि, आरूढ़ लग्न, पद और स्फुट गणना।',
    ogTitle: 'जैमिनी ज्योतिष — चर दशा और कारक | Vedaansh',
    ogDescription: 'आत्मकारक, चर दशा, जैमिनी दृष्टि और आरूढ़ लग्न व पद — आपकी वैदिक जन्म कुंडली पर।',
    keywords: ['जैमिनी ज्योतिष', 'चर दशा', 'आत्मकारक', 'अमात्यकारक', 'जैमिनी कारक', 'जैमिनी दृष्टि', 'आरूढ़ लग्न', 'कारकांश', 'अर्गला'],
  }), locale, '/jaimini/opengraph-image', 'जैमिनी ज्योतिष — Vedaansh')
}

export default async function JaiminiLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('jaimini')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.feature'), path: '/jaimini' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['jaimini', 'relationshipMarriage']}>{children}</IntlScope>
      <SeoIntro {...jaiminiIntro(locale)} />
    </>
  )
}
