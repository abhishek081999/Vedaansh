import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import styles from '@/components/seo/GuideArticle.module.css'
import { searchSite } from '@/lib/seo/search-index'
import { breadcrumbJsonLd } from '@/lib/seo/site'

type Props = { searchParams: Promise<{ q?: string }> }

const TYPE_LABEL: Record<string, string> = {
  tool:  'Tool',
  guide: 'Guide',
  page:  'Page',
}

export default async function SearchPage({ searchParams }: Props) {
  const { q: raw = '' } = await searchParams
  const q = raw.trim().slice(0, 120)
  const results = q ? searchSite(q) : []

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Search', path: '/search' },
  ])

  return (
    <div className={styles.wrap}>
      <JsonLd data={breadcrumb} />

      <p className={styles.eyebrow}>Site search</p>
      <h1 className={styles.title}>Search Vedaansh</h1>
      <p className={styles.lede}>
        Find calculators and Jyotish guides. Try “kundali”, “navamsha”, “rahu kalam”, or “matching”.
      </p>

      <form className={styles.searchForm} action="/search" method="get" role="search">
        <label htmlFor="site-q" className={styles.srOnly}>Search query</label>
        <input
          id="site-q"
          className={styles.searchInput}
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search tools & guides…"
          autoComplete="off"
          autoFocus
        />
        <button type="submit" className={styles.searchBtn}>Search</button>
      </form>

      {!q && (
        <div className={styles.empty}>
          Enter a query to search tools and guides.{' '}
          <Link href="/guides" style={{ color: 'var(--gold)' }}>Browse all guides</Link>
        </div>
      )}

      {q && results.length === 0 && (
        <div className={styles.empty}>
          No results for “{q}”. Try another term or{' '}
          <Link href="/guides" style={{ color: 'var(--gold)' }}>browse guides</Link>.
        </div>
      )}

      {results.length > 0 && (
        <>
          <p className={styles.meta}>
            {results.length} result{results.length === 1 ? '' : 's'} for “{q}”
          </p>
          <div className={styles.grid}>
            {results.map((doc) => (
              <Link key={doc.url} href={doc.url} className={styles.card}>
                <p className={styles.resultMeta}>{TYPE_LABEL[doc.type] ?? doc.type}</p>
                <h2 className={styles.cardTitle}>{doc.title}</h2>
                <p className={styles.cardDesc}>{doc.description}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
