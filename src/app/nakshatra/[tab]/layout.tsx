import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, ogImages, SITE_URL } from '@/lib/seo/site'

const TAB_META_EN: Record<string, { title: string; description: string; crumb: string }> = {
  overview: {
    title: 'Nakshatra Overview — Birth Star Analysis',
    description: 'Your birth Nakshatra at a glance: ruling planet, deity, Gana, Nadi, symbol, Pada & introductory interpretation via Swiss Ephemeris.',
    crumb: 'Overview',
  },
  compat: {
    title: 'Nakshatra Compatibility — Vedic Star Matching',
    description: 'Nakshatra-based compatibility analysis: Navtara, Stree-Dirgha, Vedha, Rajju & Mahendra compatibility scoring for relationships.',
    crumb: 'Compatibility',
  },
  remedies: {
    title: 'Nakshatra Remedies — Vedic Prescriptions',
    description: 'Personalized Nakshatra remedies: mantras, gemstones, colours, fasting days & deity worship based on your birth star.',
    crumb: 'Remedies',
  },
  bestdays: {
    title: 'Nakshatra Best Days — Monthly Forecast',
    description: 'Monthly nakshatra forecast: auspicious and inauspicious days from your birth star, tara quality, and Panchaka.',
    crumb: 'Best Days',
  },
  muhurta: {
    title: 'Nakshatra Muhurta — Auspicious Star Timings',
    description: 'Nakshatra-based Muhurta guidance: identify auspicious and inauspicious days based on transit Nakshatra and your birth star.',
    crumb: 'Muhurta',
  },
  panchaka: {
    title: 'Panchaka — Last Five Stars',
    description: 'Panchaka dosha from Dhanishtha through Revati: which natal planets sit in the zone and what each kind means.',
    crumb: 'Panchaka',
  },
  planet: {
    title: 'Planets in Nakshatra — Star Placements',
    description: 'Every graha’s nakshatra, pada, lord, Navtara from the birth Moon, and strength notes.',
    crumb: 'Planets',
  },
  taramandal: {
    title: 'Taramandal — Nakshatra Constellation Groups',
    description: 'Garuda, Naga, Deva, Rakshasa, Pitru, Marut, Agni, Soma, Vaishya & Pashu mandals: how constellation groups hold nakshatras and reshape planetary signification.',
    crumb: 'Taramandal',
  },
  navtara: {
    title: 'Navtara Predictions — Nine Tara Decision Windows',
    description: 'Navtara Chakra with dasha-linked prediction: Janma–Ati-Mitra groups, natal planet result capacity, current MD/AD experience nature, and decision windows. Confirm events with dasha + gochara.',
    crumb: 'Navtara',
  },
  profession: {
    title: 'Nakshatra Profession — Career Star Profile',
    description: 'Profession groups, formulas, and natal star career profile from your birth Moon nakshatra.',
    crumb: 'Profession',
  },
  medical: {
    title: 'Nakshatra Medical — Body Map & Dosha',
    description: 'Body-part map, dosha tendencies, and medical reference keyed to your birth nakshatra.',
    crumb: 'Medical',
  },
}

const DEFAULT_META = {
  title: 'Nakshatra Analysis — Vedic Astrology',
  description: 'Deep Nakshatra analysis: Pada, deity, planet, Yogini Dasha, compatibility & remedies. Swiss Ephemeris precision for all 27 Nakshatras.',
  crumb: 'Nakshatra',
}

export async function generateMetadata(
  { params }: { params: Promise<{ tab: string }> },
): Promise<Metadata> {
  const { tab } = await params
  const locale = await pageLocale()
  const t = await getTranslations('nakshatra')
  const en = TAB_META_EN[tab] ?? DEFAULT_META
  const hiKey = `tabMeta.${tab}` as const
  const hasHi = tab in TAB_META_EN
  const url = `${SITE_URL}/nakshatra/${tab}`

  const metaEn: Metadata = {
    title: en.title,
    description: en.description,
    alternates: { canonical: url },
    keywords: ['Nakshatra', tab, 'Vedic astrology', 'birth star', 'Janma Nakshatra', 'Swiss Ephemeris'],
    openGraph: {
      title: `${en.title} | Vedaansh`,
      description: en.description,
      url,
      type: 'website',
      images: ogImages(en.title),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${en.title} | Vedaansh`,
      description: en.description,
      images: ['/og-default.png'],
    },
  }

  if (!hasHi) {
    return localizeMetadata(`/nakshatra/${tab}`, locale, metaEn, {
      title: t('meta.title'),
      description: t('meta.description'),
    })
  }

  return localizeMetadata(`/nakshatra/${tab}`, locale, metaEn, {
    title: t(`${hiKey}.title`),
    description: t(`${hiKey}.description`),
  })
}

export default async function NakshatraTabLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tab: string }>
}) {
  const { tab } = await params
  const t = await getTranslations('nakshatra')
  const crumb = tab in TAB_META_EN
    ? t(`tabMeta.${tab}.crumb`)
    : t('breadcrumb.nakshatra')
  const jsonLd = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.nakshatra'), path: '/nakshatra' },
    { name: crumb, path: `/nakshatra/${tab}` },
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  )
}
