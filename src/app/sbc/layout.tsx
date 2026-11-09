import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { IntlScope } from '@/components/providers/IntlScope'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { sbcIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Sarvatobhadra Chakra — Vedic Transit Grid',
  description: 'Sarvatobhadra Chakra (SBC): analyze planetary transits, Vedhas, Nakshatra activation, Muhurta, and life-area predictions on the 9×9 Vedic grid.',
  keywords: ['Sarvatobhadra Chakra', 'SBC', 'Vedic transit', 'Vedha', 'Nakshatra transit', 'Vedic grid', 'transit analysis', 'Sarvatobhadra'],
  openGraph: {
    title: 'Sarvatobhadra Chakra — Vedic Transit Grid | Vedaansh',
    description: 'Planetary transits, Vedhas & Nakshatra activation on the traditional Sarvatobhadra Chakra.',
    url: `${SITE_URL}/sbc`,
    type: 'website',
    images: routeOgImage('/sbc', 'Sarvatobhadra Chakra — Vedaansh'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sarvatobhadra Chakra — Vedic Transit Grid | Vedaansh',
    description: 'Planetary transits, Vedhas & Nakshatra activation on the traditional Sarvatobhadra Chakra.',
    images: [`${SITE_URL}/sbc/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/sbc', await pageLocale(), metadataEn, {
    title: 'सर्वतोभद्र चक्र — वैदिक गोचर ग्रिड',
    description: 'सर्वतोभद्र चक्र (SBC): 9×9 वैदिक ग्रिड पर ग्रह गोचर, वेध, नक्षत्र सक्रियण, मुहूर्त और जीवन-क्षेत्र के फल।',
    ogTitle: 'सर्वतोभद्र चक्र — वैदिक गोचर ग्रिड | Vedaansh',
    ogDescription: 'शास्त्रीय सर्वतोभद्र चक्र पर ग्रह गोचर, वेध और नक्षत्र सक्रियण।',
    keywords: ['सर्वतोभद्र चक्र', 'SBC', 'वैदिक गोचर', 'वेध', 'नक्षत्र गोचर', 'वैदिक ग्रिड', 'गोचर विश्लेषण', 'सर्वतोभद्र'],
  })
}

export default async function SBCLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('sbc')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.feature'), path: '/sbc' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['sbc']}>{children}</IntlScope>
      <SeoIntro {...sbcIntro(locale)} />
    </>
  )
}
