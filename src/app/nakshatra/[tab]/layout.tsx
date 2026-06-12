import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, ogImages, SITE_URL } from '@/lib/seo/site'

const BASE_URL = SITE_URL

const TAB_META: Record<string, { title: string; description: string }> = {
  overview: {
    title:       'Nakshatra Overview — Birth Star Analysis',
    description: 'Your birth Nakshatra at a glance: ruling planet, deity, Gana, Nadi, symbol, Pada & introductory interpretation via Swiss Ephemeris.',
  },
  compatibility: {
    title:       'Nakshatra Compatibility — Vedic Star Matching',
    description: 'Nakshatra-based compatibility analysis: Navtara, Stree-Dirgha, Vedha, Rajju & Mahendra compatibility scoring for relationships.',
  },
  remedies: {
    title:       'Nakshatra Remedies — Vedic Prescriptions',
    description: 'Personalized Nakshatra remedies: mantras, gemstones, colours, fasting days & deity worship based on your birth star.',
  },
  transits: {
    title:       'Nakshatra Transits — Planetary Activations',
    description: 'Live and upcoming planetary transit activations through your birth Nakshatra and its trines, with timing precision via Swiss Ephemeris.',
  },
  muhurta: {
    title:       'Nakshatra Muhurta — Auspicious Star Timings',
    description: 'Nakshatra-based Muhurta guidance: identify auspicious and inauspicious days based on transit Nakshatra and your birth star.',
  },
}

const DEFAULT_META = {
  title:       'Nakshatra Analysis — Vedic Astrology',
  description: 'Deep Nakshatra analysis: Pada, deity, planet, Yogini Dasha, compatibility & remedies. Swiss Ephemeris precision for all 27 Nakshatras.',
}

export async function generateMetadata(
  { params }: { params: Promise<{ tab: string }> }
): Promise<Metadata> {
  const { tab } = await params
  const meta = TAB_META[tab] ?? DEFAULT_META
  const url  = `${BASE_URL}/nakshatra/${tab}`

  return {
    title:       meta.title,
    description: meta.description,
    alternates:  { canonical: url },
    keywords:    ['Nakshatra', tab, 'Vedic astrology', 'birth star', 'Janma Nakshatra', 'Swiss Ephemeris'],
    openGraph: {
      title:       `${meta.title} | Vedaansh`,
      description: meta.description,
      url,
      type:        'website',
      images:      ogImages(meta.title),
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${meta.title} | Vedaansh`,
      description: meta.description,
      images:      ['/og-default.png'],
    },
  }
}

export default async function NakshatraTabLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tab: string }>
}) {
  const { tab } = await params
  const tabLabel = TAB_META[tab]?.title.split('—')[0].trim() ?? 'Nakshatra'
  const jsonLd = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Nakshatra', path: '/nakshatra' },
    { name: tabLabel, path: `/nakshatra/${tab}` },
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  )
}
