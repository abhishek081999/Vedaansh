import type { Metadata } from 'next'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'Account — Vedaansh',
  description: 'Manage your Vedaansh account: profile, subscription, theme preferences and notification settings.',
  alternates: { canonical: `${SITE_URL}/account` },
  robots: { index: false, follow: false },
}

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata('/account', await pageLocale(), metadataEn, {
    title: 'खाता — Vedaansh',
    description: 'अपना Vedaansh खाता प्रबंधित करें: प्रोफ़ाइल, सदस्यता, थीम और सूचना सेटिंग्स।',
  })
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['account']}>{children}</IntlScope>
}
