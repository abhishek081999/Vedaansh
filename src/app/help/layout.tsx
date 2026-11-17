import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await pageLocale()
  const en = await getTranslations({ locale: 'en', namespace: 'help.meta' })
  const t = await getTranslations({ locale, namespace: 'help.meta' })
  return localizeMetadata('/help', locale, {
    title: en('title'),
    description: en('description'),
    openGraph: {
      title: `${en('title')} — Vedaansh`,
      description: en('description'),
      url: `${SITE_URL}/help`,
      type: 'website',
    },
  }, {
    title: t('title'),
    description: t('description'),
    ogTitle: `${t('title')} — Vedaansh`,
    ogDescription: t('description'),
  })
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children
}
