import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { JAIMINI_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, ogImages, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Jaimini Astrology — Chara Dasha & Karakas',
  description: 'Jaimini Jyotish on your Vedic chart: Atmakaraka, Amatyakaraka, Chara Dasha periods, Jaimini aspects, Arudha Lagna & Padas & Sphuta calculations.',
  alternates:  { canonical: `${SITE_URL}/jaimini` },
  keywords:    ['Jaimini astrology', 'Chara Dasha', 'Atmakaraka', 'Amatyakaraka', 'Jaimini Karakas', 'Jaimini aspects', 'Arudha Lagna', 'Karakamsha', 'Argala'],
  openGraph: {
    title:       'Jaimini Astrology — Chara Dasha & Karakas | Vedaansh',
    description: 'Atmakaraka, Chara Dasha, Jaimini aspects & Arudha Lagna & Padas on your Vedic birth chart.',
    url:         `${SITE_URL}/jaimini`,
    type:        'website',
    images:      ogImages('Jaimini Astrology — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Jaimini Astrology — Chara Dasha & Karakas | Vedaansh',
    description: 'Atmakaraka, Chara Dasha, Jaimini aspects & Arudha Lagna & Padas on your Vedic birth chart.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Jaimini Astrology', path: '/jaimini' },
])

export default async function JaiminiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoIntro {...JAIMINI_SEO} />
      <JsonLd data={jsonLd} />
      {children}
    </>
  )
}
