import type { Metadata } from 'next'

// Personal page driven by the loaded birth chart: nothing here is useful to index.
export const metadata: Metadata = {
  title: 'Career & Profession — Vedic Chart Reading',
  description: 'Career direction, Dashamsha strength, and professional method readings from your Vedic birth chart.',
  robots: { index: false, follow: true },
}

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
