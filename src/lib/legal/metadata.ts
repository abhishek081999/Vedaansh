import type { Metadata } from 'next'
import type { LegalPageKey } from '@/lib/legal/content'
import { LEGAL_PAGES } from '@/lib/legal/content'
import { getLegalPage } from '@/lib/legal/content.hi'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

const PATHS: Record<LegalPageKey, string> = {
  terms: '/terms',
  privacy: '/privacy',
  refund: '/refund',
}

const META_EN: Record<LegalPageKey, { title: string; description: string }> = {
  terms: {
    title: 'Terms of Service',
    description:
      'Terms of Service for Vedaansh — rules for accounts, subscriptions, acceptable use, and disclaimers for our Vedic astrology platform.',
  },
  privacy: {
    title: 'Privacy Policy',
    description:
      'How Vedaansh collects, uses, and protects your account, birth chart, and payment data. Cookies, analytics, and your privacy rights.',
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    description:
      'Vedaansh refunds: monthly plans non-refundable; annual plans 7-day no-questions refund. Cancellations, chargebacks, and how to contact us.',
  },
}

const META_HI: Record<LegalPageKey, { title: string; description: string }> = {
  terms: {
    title: 'सेवा की शर्तें',
    description:
      'Vedaansh की सेवा की शर्तें — खाते, सदस्यता, स्वीकार्य उपयोग और वैदिक ज्योतिष प्लेटफ़ॉर्म के अस्वीकरण के नियम।',
  },
  privacy: {
    title: 'गोपनीयता नीति',
    description:
      'Vedaansh आपके खाते, जन्म कुंडली और भुगतान डेटा को कैसे एकत्र, उपयोग और सुरक्षित करता है। कुकीज़, एनालिटिक्स और आपके गोपनीयता अधिकार।',
  },
  refund: {
    title: 'धनवापसी और रद्दीकरण नीति',
    description:
      'Vedaansh धनवापसी: मासिक योजनाएँ वापसी योग्य नहीं; वार्षिक योजनाओं में 7-दिन की बिना-प्रश्न धनवापसी। रद्दीकरण, चार्जबैक और संपर्क कैसे करें।',
  },
}

/** Synchronous English-only metadata (legacy callers). Prefer generateLegalMetadata. */
export function legalPageMetadata(key: LegalPageKey): Metadata {
  const page = LEGAL_PAGES[key]
  const { title, description } = META_EN[key]
  const path = PATHS[key]
  const url = `${SITE_URL}${path}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${page.title} — Vedaansh`,
      description,
      url,
      type: 'website',
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: page.title }],
    },
    twitter: {
      card: 'summary',
      title: `${page.title} — Vedaansh`,
      description,
    },
  }
}

export async function generateLegalMetadata(key: LegalPageKey): Promise<Metadata> {
  const path = PATHS[key]
  const enMeta = META_EN[key]
  const hiMeta = META_HI[key]
  const enPage = LEGAL_PAGES[key]
  const hiPage = getLegalPage(key, 'hi')
  const url = `${SITE_URL}${path}`

  const metadataEn: Metadata = {
    title: enMeta.title,
    description: enMeta.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${enPage.title} — Vedaansh`,
      description: enMeta.description,
      url,
      type: 'website',
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: enPage.title }],
    },
    twitter: {
      card: 'summary',
      title: `${enPage.title} — Vedaansh`,
      description: enMeta.description,
    },
  }

  return localizeMetadata(path, await pageLocale(), metadataEn, {
    title: hiMeta.title,
    description: hiMeta.description,
    ogTitle: `${hiPage.title} — Vedaansh`,
    ogDescription: hiMeta.description,
  })
}
