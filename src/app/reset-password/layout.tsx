import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Reset Password — Vedaansh',
  description: 'Set a new password for your Vedaansh account.',
  alternates:  { canonical: `${BASE_URL}/reset-password` },
  robots:      { index: false, follow: false },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
