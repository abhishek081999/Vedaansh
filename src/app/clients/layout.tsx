import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Client Management — Vedaansh',
  description:
    'Manage your astrology clients: save multiple charts, add notes, track Dasha timelines and share birth chart reports. Platinum feature.',
  alternates: { canonical: `${SITE_URL}/clients` },
  robots: { index: false, follow: false },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/clients', await pageLocale(), metadataEn, {
    title: 'क्लाइंट प्रबंधन — Vedaansh',
    description:
      'अपने ज्योतिष क्लाइंट प्रबंधित करें: कई कुंडलियाँ सहेजें, नोट जोड़ें, दशा समयरेखा ट्रैक करें और जन्म कुंडली रिपोर्ट साझा करें। Platinum सुविधा।',
  })
}

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['clients']}>{children}</IntlScope>
}
