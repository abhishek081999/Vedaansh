import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Verify Email — Vedaansh',
  description: 'Verify your Vedaansh account email address.',
  alternates:  { canonical: `${BASE_URL}/verify-email` },
  robots:      { index: false, follow: false },
}

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
