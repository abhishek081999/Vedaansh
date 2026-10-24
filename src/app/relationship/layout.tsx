import type { Metadata } from 'next'

// Personal page driven by the loaded birth chart: nothing here is useful to index.
export const metadata: Metadata = {
  title: 'Relationship & Marriage — Vedic Chart Reading',
  description: 'Marriage promise, timing, Mars and Vivah factors, and Navamsha analysis read from your Vedic birth chart.',
  robots: { index: false, follow: true },
}

export default function RelationshipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
