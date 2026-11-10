import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import styles from '@/components/seo/GuideArticle.module.css'
import { listGuides } from '@/lib/seo/guides.hi'
import { localizePath } from '@/i18n/config'
import { pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, SITE_URL } from '@/lib/seo/site'

export default async function GuidesIndexPage() {
  const locale = await pageLocale()
  const t = await getTranslations({ locale, namespace: 'guides' })
  const guides = listGuides(locale)
  const searchAction = localizePath('/search', locale)

  const breadcrumb = breadcrumbJsonLd([
    { name: t('breadcrumb.home'), path: '/' },
    { name: t('breadcrumb.guides'), path: '/guides' },
  ])

  const itemList = {
    '@context': 'https://schema.org',
    '@type':    'ItemList',
    name:       t('index.itemListName'),
    itemListElement: guides.map((g, i) => ({
      '@type':   'ListItem',
      position:  i + 1,
      name:      g.title,
      url:       `${SITE_URL}${localizePath(`/guides/${g.slug}`, locale)}`,
    })),
  }

  return (
    <div className={styles.wrap}>
      <JsonLd data={breadcrumb} />
      <JsonLd data={itemList} />

      <p className={styles.eyebrow}>{t('index.eyebrow')}</p>
      <h1 className={styles.title}>{t('index.title')}</h1>
      <p className={styles.lede}>{t('index.lede')}</p>

      <form className={styles.searchForm} action={searchAction} method="get" role="search">
        <label htmlFor="guides-q" className={styles.srOnly}>{t('index.searchLabel')}</label>
        <input
          id="guides-q"
          className={styles.searchInput}
          type="search"
          name="q"
          placeholder={t('index.searchPlaceholder')}
          autoComplete="off"
        />
        <button type="submit" className={styles.searchBtn}>{t('index.search')}</button>
      </form>

      <div className={styles.grid}>
        {guides.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className={styles.card}>
            <h2 className={styles.cardTitle}>{g.title}</h2>
            <p className={styles.cardDesc}>{g.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
