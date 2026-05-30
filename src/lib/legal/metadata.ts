import type { Metadata } from 'next'
import type { LegalPageKey } from '@/lib/legal/content'
import { LEGAL_PAGES } from '@/lib/legal/content'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

const META: Record<
  LegalPageKey,
  { title: string; description: string }
> = {
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

export function legalPageMetadata(key: LegalPageKey): Metadata {
  const page = LEGAL_PAGES[key]
  const { title, description } = META[key]
  const paths: Record<LegalPageKey, string> = {
    terms: '/terms',
    privacy: '/privacy',
    refund: '/refund',
  }
  const path = paths[key]
  const url = `${BASE_URL}${path}`

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
