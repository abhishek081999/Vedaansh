import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import styles from '@/components/seo/GuideArticle.module.css'
import { searchSite } from '@/lib/seo/search-index'
import { breadcrumbJsonLd } from '@/lib/seo/site'
import { pageLocale } from '@/lib/seo/i18nMeta'

type Props = { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const locale = await pageLocale()
  const t = await getTranslations('search')
  const { q: raw = '' } = await searchParams
  const q = raw.trim().slice(0, 120)
  const results = q ? searchSite(q, 24, locale) : []

  const breadcrumb = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.search'), path: '/search' },
  ])

  const typeLabel = (type: string) => {
    if (type === 'tool' || type === 'guide' || type === 'page') return t(`types.${type}`)
    return type
  }

  return (
    <div className={styles.wrap}>
      <JsonLd data={breadcrumb} />

      <p className={styles.eyebrow}>{t('eyebrow')}</p>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.lede}>{t('lede')}</p>

      <form className={styles.searchForm} action={locale === 'hi' ? '/hi/search' : '/search'} method="get" role="search">
        <label htmlFor="site-q" className={styles.srOnly}>{t('label')}</label>
        <input
          id="site-q"
          className={styles.searchInput}
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t('placeholder')}
          autoComplete="off"
          autoFocus
        />
        <button type="submit" className={styles.searchBtn}>{t('submit')}</button>
      </form>

      {!q && (
        <div className={styles.empty}>
          {t('emptyPrompt')}{' '}
          <Link href="/guides" style={{ color: 'var(--gold)' }}>{t('browseGuides')}</Link>
        </div>
      )}

      {q && results.length === 0 && (
        <div className={styles.empty}>
          {t('noResults', { q })}{' '}
          <Link href="/guides" style={{ color: 'var(--gold)' }}>{t('browseGuidesShort')}</Link>.
        </div>
      )}

      {results.length > 0 && (
        <>
          <p className={styles.meta}>
            {t('resultCount', { count: results.length, q })}
          </p>
          <div className={styles.grid}>
            {results.map((doc) => (
              <Link key={doc.url} href={doc.url} className={styles.card}>
                <p className={styles.resultMeta}>{typeLabel(doc.type)}</p>
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
