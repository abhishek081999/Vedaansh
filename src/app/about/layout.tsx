import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title: 'About — Vision, Team & Guru',
  description:
    'Learn about Vedaansh — a Vedic astrology and community platform. Our vision, creator Abhishek Kumar, and Guru Sameer Bhatnagar Acharya.',
  alternates: { canonical: `${BASE_URL}/about` },
  keywords: [
    'Vedaansh',
    'Vedic astrology',
    'Sameer Bhatnagar',
    'Jyotish community',
    'Vedic culture',
  ],
  openGraph: {
    title: 'About Vedaansh',
    description:
      'Vision for Vedic culture, Jyotish, scripture knowledge, and community — plus the team and Guru behind Vedaansh.',
    url: `${BASE_URL}/about`,
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'About Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'About Vedaansh',
    description:
      'Vision for Vedic culture, Jyotish, and community — plus the team and Guru behind Vedaansh.',
    images:      ['/og-default.png'],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type':    'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name:    'What is Vedaansh?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Vedaansh is a free Vedic astrology platform offering birth charts (Kundali), Dasha, 41 varga charts, Panchang, Nakshatra analysis, and Muhurta tools with Swiss Ephemeris precision.',
      },
    },
    {
      '@type': 'Question',
      name:    'Is Vedaansh free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Core chart calculation, Panchang, and many Jyotish tools are free. Optional paid plans add saved charts, exports, and advanced features.',
      },
    },
    {
      '@type': 'Question',
      name:    'Which ayanamsha does Vedaansh use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Vedaansh uses Lahiri (Chitrapaksha) ayanamsha by default, with Swiss Ephemeris for arc-second accurate planetary positions.',
      },
    },
  ],
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  )
}
