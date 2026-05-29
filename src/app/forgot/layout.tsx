import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Forgot Password — Vedaansh',
  description: 'Reset your Vedaansh account password.',
  alternates:  { canonical: `${BASE_URL}/forgot` },
  robots:      { index: false, follow: false },
}

export default function ForgotLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
