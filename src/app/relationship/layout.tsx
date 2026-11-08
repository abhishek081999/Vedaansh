import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'

// Personal page driven by the loaded birth chart: nothing here is useful to index.
const metadataEn: Metadata = {
  title: 'Relationship & Marriage — Vedic Chart Reading',
  description: 'Marriage promise, timing, Mars and Vivah factors, and Navamsha analysis read from your Vedic birth chart.',
  robots: { index: false, follow: true },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/relationship', await pageLocale(), metadataEn, {
    title: 'संबंध एवं विवाह — वैदिक कुंडली पाठ',
    description: 'विवाह का वचन, समय, मंगल और विवाह कारक, तथा आपकी वैदिक जन्म कुंडली से नवमांश विश्लेषण।',
  })
}

export default function RelationshipLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['relationshipMarriage']}>{children}</IntlScope>
}
