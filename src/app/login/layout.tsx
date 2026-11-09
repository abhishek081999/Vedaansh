import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Sign In — Vedaansh',
  description: 'Sign in to Vedaansh to access your saved birth charts, Dasha timelines & personal astrology dashboard.',
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: false },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/login', await pageLocale(), metadataEn, {
    title: 'साइन इन — Vedaansh',
    description: 'सहेजी जन्म कुंडलियाँ, दशा समयरेखा और व्यक्तिगत ज्योतिष डैशबोर्ड खोलने के लिए Vedaansh में साइन इन करें।',
  })
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['auth']}>{children}</IntlScope>
}
