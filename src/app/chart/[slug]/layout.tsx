// src/app/chart/[slug]/layout.tsx
// Server component — exports generateMetadata for SEO
// The actual page is a client component (page.tsx)
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { LOCALE_TAGS } from '@/i18n/config'
import { absoluteUrl, pageLocale } from '@/lib/seo/i18nMeta'
import { generateChartMetadata } from './metadata'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  return generateChartMetadata(slug)
}

export default async function ChartLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const locale = await pageLocale()
  const t = await getTranslations({ locale, namespace: 'chart.public' })
  const path = `/chart/${slug}`
  const url = absoluteUrl(path, locale)

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('breadcrumb.home'), item: absoluteUrl('/', locale) },
      { '@type': 'ListItem', position: 2, name: t('breadcrumb.chart'), item: url },
    ],
  }

  const profilePage = {
    '@context':  'https://schema.org',
    '@type':     'ProfilePage',
    url,
    inLanguage:  LOCALE_TAGS[locale],
    mainEntity: {
      '@type': 'Person',
      description: t('profileDescription'),
    },
  }

  return (
    <>
      <JsonLd data={breadcrumb} />
      <JsonLd data={profilePage} />
      {children}
    </>
  )
}
