import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { SeoIntro } from '@/components/seo/SeoIntro'
import { NUMEROLOGY_SEO } from '@/lib/seo/intro-content'
import { breadcrumbJsonLd, ogImages, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Vedic Numerology — Predictions, Remedies & Name Number Calculator',
  description: 'Full Anka Jyotish suite: predictions, remedies, Moolank/Bhagyank/Namank, Lo Shu, Kua, baby names, business match, dasha timing, marriage windows, daily Anka muhurta, brand/plate scores, yantras and PDF export.',
  alternates:  { canonical: `${SITE_URL}/numerology` },
  keywords:    ['Vedic numerology', 'Anka Jyotish', 'Moolank', 'Bhagyank', 'Namank', 'numerology predictions', 'numerology remedies', 'Chaldean numerology', 'Lo Shu grid', 'Kua number', 'personal year number', 'baby name numerology', 'vehicle number numerology', 'yantra', 'Anka muhurta'],
  openGraph: {
    title:       'Vedic Numerology — Full Anka Jyotish Suite | Vedaansh',
    description: 'Predictions, remedies, advanced tools, daily Anka muhurta and PDF report from Vedic numerology.',
    url:         `${SITE_URL}/numerology`,
    type:        'website',
    images:      ogImages('Vedic Numerology — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Vedic Numerology — Full Anka Jyotish Suite | Vedaansh',
    description: 'Predictions, remedies, advanced tools, daily Anka muhurta and PDF report from Vedic numerology.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Vedic Numerology', path: '/numerology' },
])

export default async function NumerologyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SeoIntro {...NUMEROLOGY_SEO} />
      <JsonLd data={jsonLd} />
      {children}
    </>
  )
}
