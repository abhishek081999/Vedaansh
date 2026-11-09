import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Reset Password — Vedaansh',
  description: 'Set a new password for your Vedaansh account.',
  alternates: { canonical: `${SITE_URL}/reset-password` },
  robots: { index: false, follow: false },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/reset-password', await pageLocale(), metadataEn, {
    title: 'पासवर्ड रीसेट — Vedaansh',
    description: 'अपने Vedaansh खाते के लिए नया पासवर्ड सेट करें।',
  })
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['auth']}>{children}</IntlScope>
}
