import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import styles from '@/components/seo/GuideArticle.module.css'
import { getAllGuideSlugs, getGuide, getRelatedGuides } from '@/lib/seo/guides'
import { breadcrumbJsonLd, faqJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return { title: 'Guide not found' }

  const url = `${SITE_URL}/guides/${guide.slug}`
  return {
    title:       guide.title,
    description: guide.description,
    keywords:    guide.keywords,
    alternates:  { canonical: url },
    openGraph: {
      title:       guide.title,
      description: guide.description,
      url,
      type:        'article',
      publishedTime: guide.publishedAt,
      modifiedTime:  guide.updatedAt,
      images:      routeOgImage(`/guides/${guide.slug}`, guide.title),
    },
    twitter: {
      card:        'summary_large_image',
      title:       guide.title,
      description: guide.description,
      images:      [`${SITE_URL}/guides/${guide.slug}/opengraph-image`],
    },
  }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()
  const related = getRelatedGuides(guide.slug)

  const path = `/guides/${guide.slug}`
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/guides' },
    { name: guide.title, path },
  ])

  const article = {
    '@context':         'https://schema.org',
    '@type':            'Article',
    headline:           guide.title,
    description:        guide.description,
    datePublished:      guide.publishedAt,
    dateModified:       guide.updatedAt,
    inLanguage:         'en-IN',
    mainEntityOfPage:   `${SITE_URL}${path}`,
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

      <Link href="/guides" className={styles.back}>← All guides</Link>
      <p className={styles.eyebrow}>Jyotish guide</p>
      <h1 className={styles.title}>{guide.title}</h1>
      <p className={styles.meta}>
        Updated {guide.updatedAt}
        {' · '}
        <Link href="/search" style={{ color: 'inherit' }}>Search site</Link>
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
          <h2>Frequently asked questions</h2>
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
          <h2 className={styles.relatedHeading}>Related guides</h2>
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
