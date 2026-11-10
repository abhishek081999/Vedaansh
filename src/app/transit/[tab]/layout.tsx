import type { Metadata } from 'next'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Personal Transit Roadmap — Vedaansh',
  description: 'Your personal Vedic transit roadmap: upcoming planetary transits, Dasha periods & key astrological windows visualised on an interactive timeline.',
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

/** /roadmap redirects here. Only the roadmap tab replaces the hub card. */
export async function generateMetadata({ params }: { params: Promise<{ tab: string }> }): Promise<Metadata> {
  const { tab } = await params
  if (tab !== 'roadmap') return {}
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/transit/roadmap', locale, metadataEn, {
    title: 'व्यक्तिगत गोचर रोडमैप — Vedaansh',
    description: 'आपका व्यक्तिगत वैदिक गोचर रोडमैप: आगामी ग्रह गोचर, दशा अवधि और मुख्य ज्योतिष खिड़कियाँ एक समयरेखा पर।',
    ogTitle: 'व्यक्तिगत गोचर रोडमैप | Vedaansh',
    ogDescription: 'आगामी ग्रह गोचर, दशा अवधि और मुख्य ज्योतिष खिड़कियाँ — वैदिक समयरेखा पर।',
    keywords: ['वैदिक गोचर', 'ग्रह गोचर', 'दशा समयरेखा', 'ज्योतिष रोडमैप', 'गोचर कैलेंडर', 'व्यक्तिगत ज्योतिष फलादेश'],
  }), locale, '/roadmap/opengraph-image', 'व्यक्तिगत गोचर रोडमैप — Vedaansh')
}

export default function TransitTabLayout({ children }: { children: React.ReactNode }) {
  return children
}
