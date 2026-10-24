import type { Metadata } from 'next'

// Personal, time-dependent page: nothing here is useful to index.
export const metadata: Metadata = {
  title: "Today's Reading — Personal Daily Prediction",
  description: "Your day through Vedic astrology: Moon, running dasha, live transits and today's panchang read against your birth chart.",
  robots: { index: false, follow: true },
}

export default function TodayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
