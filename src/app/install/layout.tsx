import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title: 'Install App — Android & iPhone',
  description:
    'Install Vedaansh on Android or iPhone. Google Play coming soon; add to home screen from Chrome or Safari for charts and panchang on the go.',
  alternates: { canonical: `${BASE_URL}/install` },
  openGraph: {
    title: 'Install Vedaansh App',
    description:
      'Install Vedaansh on Android or iPhone. Google Play coming soon; browser install steps for Chrome and Safari.',
    url: `${BASE_URL}/install`,
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Install Vedaansh' }],
  },
}

export default function InstallLayout({ children }: { children: React.ReactNode }) {
  return children
}
