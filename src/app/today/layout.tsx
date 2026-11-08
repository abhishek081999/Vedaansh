import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { pageLocale } from '@/lib/seo/i18nMeta'

// Personal, time-dependent page: nothing here is useful to index.
export async function generateMetadata(): Promise<Metadata> {
  const hi = (await pageLocale()) === 'hi'
  return {
    title: hi ? 'आज का फल — व्यक्तिगत दैनिक फलादेश' : "Today's Reading — Personal Daily Prediction",
    description: hi
      ? 'वैदिक ज्योतिष से आपका दिन: चंद्रमा, चल रही दशा, लाइव गोचर और आज का पंचांग, आपकी जन्म कुंडली के सापेक्ष।'
      : "Your day through Vedic astrology: Moon, running dasha, live transits and today's panchang read against your birth chart.",
    robots: { index: false, follow: true },
  }
}

export default function TodayLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['today']}>{children}</IntlScope>
}
