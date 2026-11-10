import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { IntlScope } from '@/components/providers/IntlScope'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { numerologyIntro } from '@/lib/seo/intro-content.hi'
import { localizeMetadata, pageLocale, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title:       'Vedic Numerology — Predictions, Remedies & Name Number Calculator',
  description: 'Full Anka Jyotish suite: predictions, remedies, Moolank/Bhagyank/Namank, Lo Shu, Kua, baby names, business match, dasha timing, marriage windows, daily Anka muhurta, brand/plate scores, yantras and PDF export.',
  alternates:  { canonical: `${SITE_URL}/numerology` },
  keywords:    ['Vedic numerology', 'Anka Jyotish', 'Moolank', 'Bhagyank', 'Namank', 'numerology predictions', 'numerology remedies', 'Chaldean numerology', 'Lo Shu grid', 'Kua number', 'personal year number', 'baby name numerology', 'vehicle number numerology', 'yantra', 'Anka muhurta'],
  openGraph: {
    title:       'Vedic Numerology — Full Anka Jyotish Suite | Vedaansh',
    description: 'Predictions, remedies, advanced tools, daily Anka muhurta and PDF report from Vedic numerology.',
    url:         `${SITE_URL}/numerology`,
    type:        'website',
    images:      routeOgImage('/numerology', 'Vedic Numerology — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Vedic Numerology — Full Anka Jyotish Suite | Vedaansh',
    description: 'Predictions, remedies, advanced tools, daily Anka muhurta and PDF report from Vedic numerology.',
    images:      [`${SITE_URL}/numerology/opengraph-image`],
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  return withHindiOgImage(localizeMetadata('/numerology', locale, metadataEn, {
    title: 'वैदिक अंक ज्योतिष — फल, उपाय और नाम अंक कैलकुलेटर',
    description: 'पूरा अंक ज्योतिष: फल, उपाय, मूलांक/भाग्यांक/नामांक, लो शु, कुआ, शिशु नाम, व्यवसाय मिलान, दशा समय, विवाह खिड़कियाँ, दैनिक अंक मुहूर्त, ब्रांड/प्लेट अंक, यंत्र और पीडीएफ निर्यात।',
    ogTitle: 'वैदिक अंक ज्योतिष — पूरा अंक ज्योतिष | Vedaansh',
    ogDescription: 'वैदिक अंक ज्योतिष से फल, उपाय, उन्नत उपकरण, दैनिक अंक मुहूर्त और पीडीएफ रिपोर्ट।',
    keywords: ['वैदिक अंक ज्योतिष', 'अंक ज्योतिष', 'मूलांक', 'भाग्यांक', 'नामांक', 'अंक फल', 'अंक उपाय', 'कैल्डियन अंक', 'लो शु ग्रिड', 'कुआ अंक', 'व्यक्तिगत वर्ष', 'शिशु नाम अंक', 'वाहन अंक', 'यंत्र', 'अंक मुहूर्त'],
  }), locale, '/numerology/opengraph-image', 'वैदिक अंक ज्योतिष — Vedaansh')
}

export default async function NumerologyLayout({ children }: { children: React.ReactNode }) {
  const locale = await pageLocale()
  const t = await getTranslations('numerology')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.feature'), path: '/numerology' },
  ])
  return (
    <>
      <JsonLd data={jsonLd} />
      <IntlScope namespaces={['numerology', 'compare']}>{children}</IntlScope>
      <SeoIntro {...numerologyIntro(locale)} />
    </>
  )
}
