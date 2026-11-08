import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'

// Personal page driven by the loaded birth chart: nothing here is useful to index.
const metadataEn: Metadata = {
  title: 'Career & Profession — Vedic Chart Reading',
  description: 'Career direction, Dashamsha strength, and professional method readings from your Vedic birth chart.',
  robots: { index: false, follow: true },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/career', await pageLocale(), metadataEn, {
    title: 'करियर एवं व्यवसाय — वैदिक कुंडली पाठ',
    description: 'आपकी वैदिक जन्म कुंडली से करियर दिशा, दशमांश बल और व्यावसायिक विधि पाठ।',
  })
}

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['careerProfession']}>{children}</IntlScope>
}
