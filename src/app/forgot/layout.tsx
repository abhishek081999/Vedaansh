import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Forgot Password — Vedaansh',
  description: 'Reset your Vedaansh account password.',
  alternates: { canonical: `${SITE_URL}/forgot` },
  robots: { index: false, follow: false },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/forgot', await pageLocale(), metadataEn, {
    title: 'पासवर्ड भूल गए — Vedaansh',
    description: 'अपने Vedaansh खाते का पासवर्ड रीसेट करें।',
  })
}

export default function ForgotLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['auth']}>{children}</IntlScope>
}
