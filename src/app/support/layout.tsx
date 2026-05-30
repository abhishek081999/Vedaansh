import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Contact Vedaansh for billing, account, and technical support.',
  alternates: { canonical: `${BASE_URL}/support` },
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children
}
