// src/app/chart/[slug]/metadata.tsx
// Server-side metadata generation for public chart pages
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { SITE_URL } from '@/lib/seo/site'

type ChartMetaRow = {
  name: string
  birthDate: string
  birthPlace?: string
}

function shortDate(iso: string, months: readonly string[]): string {
  const d = new Date(iso + 'T12:00:00Z')
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export async function generateChartMetadata(slug: string): Promise<Metadata> {
  const locale = await pageLocale()
  const t = await getTranslations({ locale, namespace: 'chart.public' })
  const path = `/chart/${slug}`

  const withHindiImage = (meta: Metadata, alt: string): Metadata => {
    if (locale !== 'hi') return meta
    const image = `${SITE_URL}/chart/${slug}/opengraph-image?lang=hi`
    return {
      ...meta,
      openGraph: {
        ...meta.openGraph,
        images: [{ url: image, width: 1200, height: 630, alt }],
      },
      twitter: {
        ...meta.twitter,
        images: [image],
      },
    }
  }

  try {
    await connectDB()
    const chart = await Chart.findOne({ slug, isPublic: true })
      .select('name birthDate birthPlace').lean() as ChartMetaRow | null

    if (!chart) {
      return localizeMetadata(path, locale, {
        title: 'Chart Not Found',
        description: 'This chart is private or does not exist.',
        robots: { index: false, follow: false },
      }, {
        title: t('meta.notFoundTitle'),
        description: t('meta.notFoundDescription'),
      })
    }

    const months = t.raw('monthsShort') as string[]
    const name = chart.name
    const place = chart.birthPlace
      ? t('meta.inPlace', { place: chart.birthPlace })
      : ''
    const date = shortDate(chart.birthDate, months)
    const title = t('meta.title', { name })
    const description = t('meta.description', { name, date, place })
    const ogAlt = t('meta.ogAlt', { name })
    const ogImage = `${SITE_URL}/chart/${slug}/opengraph-image`

    const built: Metadata = {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE_URL}${path}`,
        type: 'profile',
        images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }],
        siteName: 'Vedaansh',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    }

    return withHindiImage(localizeMetadata(path, locale, built, {
      title,
      description,
      ogTitle: title,
      ogDescription: description,
    }), ogAlt)
  } catch {
    const title = t('meta.fallbackTitle')
    const description = t('meta.fallbackDescription')
    return localizeMetadata(path, locale, {
      title: 'Vedic Chart — Vedaansh',
      description: 'View this Vedic Jyotish birth chart on Vedaansh.',
    }, { title, description })
  }
}
