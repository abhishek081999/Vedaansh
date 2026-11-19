import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Request a Feature',
  description:
    'Suggest a new Vedic astrology tool or calculation for Vedaansh, and upvote the ideas other astrologers have requested.',
  alternates: { canonical: `${SITE_URL}/feature-requests` },
  openGraph: {
    title: 'Request a Feature — Vedaansh',
    description: 'Suggest and upvote new Vedic astrology tools for Vedaansh.',
    url: `${SITE_URL}/feature-requests`,
    type: 'website',
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/feature-requests', await pageLocale(), metadataEn, {
    title: 'सुविधा का अनुरोध करें',
    description:
      'Vedaansh के लिए कोई नया वैदिक ज्योतिष टूल या गणना सुझाएँ, और दूसरे ज्योतिषियों के सुझावों को वोट दें।',
    ogTitle: 'सुविधा का अनुरोध करें — Vedaansh',
    ogDescription: 'Vedaansh के लिए नए वैदिक ज्योतिष टूल सुझाएँ और वोट दें।',
  })
}

export default function FeatureRequestsLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['featureRequests']}>{children}</IntlScope>
}
