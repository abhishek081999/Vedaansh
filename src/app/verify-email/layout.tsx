import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Verify Email — Vedaansh',
  description: 'Verify your Vedaansh account email address.',
  alternates: { canonical: `${SITE_URL}/verify-email` },
  robots: { index: false, follow: false },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/verify-email', await pageLocale(), metadataEn, {
    title: 'ईमेल सत्यापन — Vedaansh',
    description: 'अपने Vedaansh खाते का ईमेल पता सत्यापित करें।',
  })
}

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['auth']}>{children}</IntlScope>
}
