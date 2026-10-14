import Link from 'next/link'
import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import styles from '@/components/seo/GuideArticle.module.css'
import { GUIDES } from '@/lib/seo/guides'
import { breadcrumbJsonLd, routeOgImage, SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title:       'Jyotish Guides — Kundali, Dasha, Panchang & Matching',
  description:
    'Free Vedic astrology guides: Kundali, Navamsha (D9), Ashtakoot Guna Milan, Vimshottari Dasha, Panchang, and Rahu Kalam — with links to Vedaansh calculators.',
  alternates:  { canonical: `${SITE_URL}/guides` },
  keywords:    ['vedic astrology guides', 'kundali guide', 'jyotish articles', 'learn vedic astrology'],
  openGraph: {
    title:       'Jyotish Guides — Vedaansh',
    description: 'Clear guides on Kundali, Dasha, Panchang, and matching — linked to free calculators.',
    url:         `${SITE_URL}/guides`,
    type:        'website',
    images:      routeOgImage('/guides', 'Jyotish Guides — Vedaansh'),
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Jyotish Guides — Vedaansh',
    description: 'Clear guides on Kundali, Dasha, Panchang, and matching — linked to free calculators.',
    images:      [`${SITE_URL}/guides/opengraph-image`],
  },
}

const breadcrumb = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Guides', path: '/guides' },
])

const itemList = {
  '@context': 'https://schema.org',
  '@type':    'ItemList',
  name:       'Vedaansh Jyotish Guides',
  itemListElement: GUIDES.map((g, i) => ({
    '@type':   'ListItem',
    position:  i + 1,
    name:      g.title,
    url:       `${SITE_URL}/guides/${g.slug}`,
  })),
}

export default function GuidesIndexPage() {
  return (
    <div className={styles.wrap}>
      <JsonLd data={breadcrumb} />
      <JsonLd data={itemList} />

      <p className={styles.eyebrow}>Learn Jyotish</p>
      <h1 className={styles.title}>Vedic astrology guides</h1>
      <p className={styles.lede}>
        Short, practical explanations of Kundali, Dasha, Panchang, and matching — each linked to a free
        Vedaansh calculator.
      </p>

      <form className={styles.searchForm} action="/search" method="get" role="search">
        <label htmlFor="guides-q" className={styles.srOnly}>Search guides and tools</label>
        <input
          id="guides-q"
          className={styles.searchInput}
          type="search"
          name="q"
          placeholder="Search guides & tools…"
          autoComplete="off"
        />
        <button type="submit" className={styles.searchBtn}>Search</button>
      </form>

      <div className={styles.grid}>
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className={styles.card}>
            <h2 className={styles.cardTitle}>{g.title}</h2>
            <p className={styles.cardDesc}>{g.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
