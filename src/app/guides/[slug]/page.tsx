import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import styles from '@/components/seo/GuideArticle.module.css'
import { getAllGuideSlugs } from '@/lib/seo/guides'
import { getGuide, getRelatedGuides } from '@/lib/seo/guides.hi'
import { localizeMetadata, pageLocale, absoluteUrl, withHindiOgImage } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, faqJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'
import { LOCALE_TAGS } from '@/i18n/config'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const locale = await pageLocale()
  const t = await getTranslations({ locale, namespace: 'guides' })
  const guide = getGuide(slug, locale)
  if (!guide) return { title: t('article.notFound') }

  const path = `/guides/${guide.slug}`
  const enGuide = getGuide(slug, 'en')!

  return withHindiOgImage(localizeMetadata(path, locale, {
    title:       enGuide.title,
    description: enGuide.description,
    keywords:    enGuide.keywords,
    openGraph: {
      title:       enGuide.title,
      description: enGuide.description,
      url:         `${SITE_URL}${path}`,
      type:        'article',
      publishedTime: enGuide.publishedAt,
      modifiedTime:  enGuide.updatedAt,
      images:      routeOgImage(path, enGuide.title),
    },
    twitter: {
      card:        'summary_large_image',
      title:       enGuide.title,
      description: enGuide.description,
      images:      [`${SITE_URL}${path}/opengraph-image`],
    },
  }, {
    title: guide.title,
    description: guide.description,
    ogTitle: guide.title,
    ogDescription: guide.description,
    keywords: guide.keywords,
  }), locale, `${path}/opengraph-image`, guide.title)
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const locale = await pageLocale()
  const t = await getTranslations({ locale, namespace: 'guides' })
  const guide = getGuide(slug, locale)
  if (!guide) notFound()
  const related = getRelatedGuides(guide.slug, locale)

  const path = `/guides/${guide.slug}`
  const breadcrumb = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.guides'), path: '/guides' },
    { name: guide.title, path },
  ])

  const article = {
    '@context':         'https://schema.org',
    '@type':            'Article',
    headline:           guide.title,
    description:        guide.description,
    datePublished:      guide.publishedAt,
    dateModified:       guide.updatedAt,
    inLanguage:         LOCALE_TAGS[locale],
    mainEntityOfPage:   absoluteUrl(path, locale),
    author:             { '@type': 'Organization', name: 'Vedaansh', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name:    'Vedaansh',
      url:     SITE_URL,
      logo:    { '@type': 'ImageObject', url: `${SITE_URL}/veda-icon.png` },
    },
  }

  return (
    <article className={styles.wrap}>
      <JsonLd data={breadcrumb} />
      <JsonLd data={article} />
      {guide.faqs.length > 0 && <JsonLd data={faqJsonLd(guide.faqs)} />}

      <Link href="/guides" className={styles.back}>{t('article.back')}</Link>
      <p className={styles.eyebrow}>{t('article.eyebrow')}</p>
      <h1 className={styles.title}>{guide.title}</h1>
      <p className={styles.meta}>
        {t('article.updated', { date: guide.updatedAt })}
        {' · '}
        <Link href="/search" style={{ color: 'inherit' }}>{t('article.searchSite')}</Link>
      </p>

      {guide.intro.map((p) => (
        <p key={p.slice(0, 40)} className={styles.lede}>{p}</p>
      ))}

      <Link href={guide.toolCta.href} className={styles.cta}>
        {guide.toolCta.label} →
      </Link>

      {guide.sections.map((section) => (
        <section key={section.heading} className={styles.section}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </section>
      ))}

      {guide.faqs.length > 0 && (
        <section className={styles.faq}>
          <h2>{t('article.faq')}</h2>
          <dl>
            {guide.faqs.map(({ q, a }) => (
              <div key={q} className={styles.faqItem}>
                <dt>{q}</dt>
                <dd>{a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {related.length > 0 && (
        <section className={styles.relatedSection}>
          <h2 className={styles.relatedHeading}>{t('article.related')}</h2>
          <div className={styles.grid}>
            {related.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className={styles.card}>
                <h3 className={styles.cardTitle}>{g.title}</h3>
                <p className={styles.cardDesc}>{g.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p style={{ marginTop: '2rem' }}>
        <Link href={guide.toolCta.href} className={styles.cta}>
          {guide.toolCta.label} →
        </Link>
      </p>
    </article>
  )
}
