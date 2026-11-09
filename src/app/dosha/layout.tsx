import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'

const metadataEn: Metadata = {
  title: 'Dosha & Upay — Shrap Analysis',
  description: 'Pitru, Matru, Sarpa, Guru and related Shrap flags, children focus, lending risk, and remedy timing from your Vedic birth chart.',
  robots: { index: false, follow: true },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/dosha', await pageLocale(), metadataEn, {
    title: 'दोष एवं उपाय — श्राप विश्लेषण',
    description: 'पितृ, मातृ, सर्प, गुरु और संबंधित श्राप संकेत, संतान फोकस, उधार जोखिम और उपाय समय — आपकी वैदिक जन्म कुंडली से।',
  })
}

export default function DoshaLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['dosha']}>{children}</IntlScope>
}
