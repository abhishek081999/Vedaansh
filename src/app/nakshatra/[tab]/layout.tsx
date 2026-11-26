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
    crumb: 'Career',
  },
  medical: {
    title: 'Nakshatra Medical — Body Map & Dosha',
    description: 'Body-part map, dosha tendencies, and medical reference keyed to your birth nakshatra.',
    crumb: 'Health',
  },
  special: {
    title: 'Navatara & Nadi Nakshatras — Janma, Karma, Manasa, Abhisheka',
    description: 'The navatara grid in three paryays and the nadi nakshatras (Jati, Matru, Karma, Sanghatika, Samudaya, Adhana, Vainashika, Manasa, Abhisheka) from the Moon, Lagna, Sun or dasha lord, with planet roles, dasha and transits.',
    crumb: 'Nadi Nakshatras',
  },
  starlords: {
    title: 'Nakshatra Star Lords — What Each Planet Delivers',
    description: 'Each planet gives the results of its nakshatra lord: star-lord houses, lordships, chains, key star lords and nakshatra exchanges.',
    crumb: 'Star Lords',
  },
  birthday: {
    title: 'Vedic Star Birthday — Janma Nakshatra Dates',
    description: 'Your Vedic birthday by nakshatra for the next five years and the monthly days the Moon returns to your birth star, from Swiss Ephemeris.',
    crumb: 'Star Birthday',
  },
  degrees: {
    title: 'Sensitive Degrees — Gandanta, Pushkara & Mrityu Bhaga',
    description: 'Gandanta knots, Pushkara Navamsha and Bhaga, Mrityu Bhaga and nakshatra-edge checks for every planet and the Lagna.',
    crumb: 'Sensitive Degrees',
  },
  journey: {
    title: 'Nakshatra Life Journey — 27 Stages from Ashwini to Revati',
    description: 'The 27 nakshatras read in order as a lifetime, from first breath to release, with this chart’s planets marked on the stages they occupy.',
    crumb: 'Life Journey',
  },
  gandmool: {
    title: 'Gandmool Dosha — Birth in Ashwini, Ashlesha, Magha, Jyeshtha, Mula or Revati',
    description: 'Whether the birth Moon falls in a Gandmool star, which pada, what it affects, how strong it is, Abhukta Mula, and the Shanti remedy.',
    crumb: 'Gandmool',
  },
  namakshar: {
    title: 'Name Letters (Namakshar) — Naming Syllables by Nakshatra',
    description: 'The naming syllable for your birth pada, all 108 nakshatra syllables, and a checker that shows which star a name belongs to and its tara.',
    crumb: 'Name Letters',
  },
  ghatak: {
    title: 'Ghatak Chakra — Unfavourable Days by Moon Sign',
    description: 'The Ghatak Moon sign, month, tithi, weekday and nakshatra for your Moon sign, and whether today hits any of them.',
    crumb: 'Ghatak',
  },
  slowtransits: {
    title: 'Saturn, Jupiter, Rahu & Ketu Nakshatra Transits',
    description: 'When Saturn, Jupiter, Rahu and Ketu enter and leave each nakshatra over the coming years, with the tara each stay gives from your birth star.',
    crumb: 'Slow Transits',
  },
  latta: {
    title: 'Latta — Stars Kicked by Each Planet',
    description: 'Muhurta Chintamani’s Latta: which star each planet kicks, and whether natal or today’s planets strike your Janma or Lagna star.',
    crumb: 'Latta',
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
