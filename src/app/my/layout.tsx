import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'My Charts — Vedaansh',
  description: 'Your saved Vedic birth charts on Vedaansh.',
  alternates:  { canonical: `${BASE_URL}/my` },
  robots:      { index: false, follow: false },
}

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
