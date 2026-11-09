import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Sign Up — Vedaansh',
  description: 'Create a free Vedaansh account to save birth charts and explore Vedic astrology tools.',
  alternates: { canonical: `${SITE_URL}/signup` },
  robots: { index: false, follow: false },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/signup', await pageLocale(), metadataEn, {
    title: 'साइन अप — Vedaansh',
    description: 'जन्म कुंडलियाँ सहेजने और वैदिक ज्योतिष उपकरण देखने के लिए निःशुल्क Vedaansh खाता बनाएँ।',
  })
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['auth']}>{children}</IntlScope>
}
