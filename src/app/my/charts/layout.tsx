import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { IntlScope } from '@/components/providers/IntlScope'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

const metadataEn: Metadata = {
  title: 'My Charts — Vedaansh',
  description: 'Your saved Vedic birth charts on Vedaansh.',
  alternates: { canonical: `${SITE_URL}/my/charts` },
  robots: { index: false, follow: false },
}

export async function generateMetadata(): Promise<Metadata> {
  const hi = await getTranslations({ locale: 'hi', namespace: 'library' })
  return localizeMetadata('/my/charts', await pageLocale(), metadataEn, {
    title: hi('meta.title'),
    description: hi('meta.description'),
  })
}

export default function MyChartsLayout({ children }: { children: React.ReactNode }) {
  return <IntlScope namespaces={['compare', 'library']}>{children}</IntlScope>
}
