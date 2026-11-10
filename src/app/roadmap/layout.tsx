import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { ROADMAP_SEO } from '@/lib/seo/intro-content'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Personal Transit Roadmap — Vedaansh',
  description: 'Your personal Vedic transit roadmap: upcoming planetary transits, Dasha periods & key astrological windows visualised on an interactive timeline.',
  alternates:  { canonical: `${SITE_URL}/transit/roadmap` },
  keywords:    ['Vedic transit', 'planetary transit', 'Dasha timeline', 'Jyotish roadmap', 'transit calendar', 'personal astrology forecast'],
  openGraph: {
    title:       'Personal Transit Roadmap | Vedaansh',
    description: 'Upcoming planetary transits, Dasha periods & key astrological windows on an interactive Vedic timeline.',
    url:         `${SITE_URL}/transit/roadmap`,
    type:        'website',
    images:      routeOgImage('/roadmap', 'Transit Roadmap — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Personal Transit Roadmap | Vedaansh',
    description: 'Upcoming planetary transits, Dasha periods & key astrological windows on an interactive timeline.',
    images:      [`${SITE_URL}/roadmap/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/transit/roadmap', locale, metadataEn, {
    title: 'व्यक्तिगत गोचर रोडमैप — Vedaansh',
    description: 'आपका व्यक्तिगत वैदिक गोचर रोडमैप: आगामी ग्रह गोचर, दशा अवधि और मुख्य ज्योतिष खिड़कियाँ एक समयरेखा पर।',
    ogTitle: 'व्यक्तिगत गोचर रोडमैप | Vedaansh',
    ogDescription: 'आगामी ग्रह गोचर, दशा अवधि और मुख्य ज्योतिष खिड़कियाँ — वैदिक समयरेखा पर।',
    keywords: ['वैदिक गोचर', 'ग्रह गोचर', 'दशा समयरेखा', 'ज्योतिष रोडमैप', 'गोचर कैलेंडर', 'व्यक्तिगत ज्योतिष फलादेश'],
  }), locale, '/roadmap/opengraph-image', 'व्यक्तिगत गोचर रोडमैप — Vedaansh')
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Transit Roadmap', path: '/transit/roadmap' },
])

export default async function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
      <SeoIntro {...ROADMAP_SEO} />
    </>
  )
}
