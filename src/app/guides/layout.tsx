import type { Metadata } from 'next'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Jyotish Guides — Kundali, Dasha, Panchang & Matching',
  description:
    'Free Vedic astrology guides: Kundali, Navamsha (D9), Ashtakoot Guna Milan, Vimshottari Dasha, Panchang, and Rahu Kalam — with links to Vedaansh calculators.',
  keywords:    ['vedic astrology guides', 'kundali guide', 'jyotish articles', 'learn vedic astrology'],
  openGraph: {
    title:       'Jyotish Guides — Vedaansh',
    description: 'Clear guides on Kundali, Dasha, Panchang, and matching — linked to free calculators.',
    url:         `${SITE_URL}/guides`,
    type:        'website',
    images:      routeOgImage('/guides', 'Jyotish Guides — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Jyotish Guides — Vedaansh',
    description: 'Clear guides on Kundali, Dasha, Panchang, and matching — linked to free calculators.',
    images:      [`${SITE_URL}/guides/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/guides', locale, metadataEn, {
    title: 'ज्योतिष मार्गदर्शिकाएँ — कुंडली, दशा, पंचांग और मिलान',
    description:
      'निःशुल्क वैदिक ज्योतिष मार्गदर्शिकाएँ: कुंडली, नवांश (D9), अष्टकूट गुण मिलान, विंशोत्तरी दशा, पंचांग और राहु काल — Vedaansh कैलकुलेटरों की लिंक सहित।',
    ogTitle: 'ज्योतिष मार्गदर्शिकाएँ — Vedaansh',
    ogDescription: 'कुंडली, दशा, पंचांग और मिलान पर स्पष्ट मार्गदर्शिकाएँ — निःशुल्क कैलकुलेटरों से जुड़ी।',
    keywords: ['वैदिक ज्योतिष मार्गदर्शिकाएँ', 'कुंडली गाइड', 'ज्योतिष लेख', 'वैदिक ज्योतिष सीखें'],
  }), locale, '/guides/opengraph-image', 'ज्योतिष मार्गदर्शिकाएँ — Vedaansh')
}

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return children
}
