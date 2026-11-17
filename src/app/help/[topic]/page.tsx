import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, ArrowRight, ChevronDown, Expand, Lightbulb } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import styles from '@/components/help/Help.module.css'
import { TopicIcon } from '@/components/help/guideIcons'
import { HELP_CATEGORIES, HELP_TOPICS, getHelpTopic, helpNeighbours, helpShotSize, helpTopicsIn } from '@/lib/help/topics'
import { localizeMetadata, pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, SITE_URL } from '@/lib/seo/site'

type Props = { params: Promise<{ topic: string }> }

interface HelpSection {
  heading: string
  body?: string
  steps?: string[]
}

export function generateStaticParams() {
  return HELP_TOPICS.map((topic) => ({ topic: topic.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: id } = await params
  const locale = await pageLocale()
  const t = await getTranslations({ locale, namespace: 'help' })
  if (!getHelpTopic(id)) return { title: t('article.notFound') }
  const en = await getTranslations({ locale: 'en', namespace: 'help' })
  const path = `/help/${id}`
  return localizeMetadata(path, locale, {
    title: `${en(`topics.${id}.title`)} — ${en('breadcrumb.help')}`,
    description: en(`topics.${id}.summary`),
    openGraph: {
      title: en(`topics.${id}.title`),
      description: en(`topics.${id}.summary`),
      url: `${SITE_URL}${path}`,
      type: 'article',
    },
  }, {
    title: `${t(`topics.${id}.title`)} — ${t('breadcrumb.help')}`,
    description: t(`topics.${id}.summary`),
    ogTitle: t(`topics.${id}.title`),
    ogDescription: t(`topics.${id}.summary`),
  })
}

export default async function HelpTopicPage({ params }: Props) {
  const { topic: id } = await params
  const topic = getHelpTopic(id)
  if (!topic) notFound()

  const locale = await pageLocale()
  const t = await getTranslations({ locale, namespace: 'help' })
  const title = t(`topics.${id}.title`)
  const sections = t.raw(`topics.${id}.sections`) as HelpSection[]
  const tips = (t.has(`topics.${id}.tips`) ? t.raw(`topics.${id}.tips`) : []) as string[]
  const shotAlts = t.raw(`topics.${id}.shots`) as string[]
  const steps = sections.reduce((n, s) => n + (s.steps?.length ?? 0), 0)
  const { prev, next } = helpNeighbours(id)

  // First screenshot sits under the header; the rest follow the matching section.
  const shots = topic.shots.map((file, i) => ({ file, n: i + 1, alt: shotAlts[i] ?? title, ...helpShotSize(file) }))
  const renderShot = (shot: (typeof shots)[number]) => (
    <figure key={shot.file} className={styles.figure}>
      {/* Crops of one panel show at their natural width instead of being blown up. */}
      <a href={`/help/${shot.file}`} target="_blank" rel="noopener" className={styles.figureFrame} style={{ maxWidth: shot.width }}>
        <Image src={`/help/${shot.file}`} alt={shot.alt} width={shot.width} height={shot.height} sizes="(max-width: 768px) 100vw, 46rem" />
        <span className={styles.figureZoom} aria-hidden><Expand size={14} /></span>
        <span className={styles.srOnly}>{t('article.openFull')}</span>
      </a>
      <figcaption>
        <strong>{t('article.figure', { n: shot.n })}</strong> {shot.alt}
      </figcaption>
    </figure>
  )

  const sidebarList = (
    <ul className={styles.sideList}>
      {HELP_CATEGORIES.map((category) => (
        <li key={category}>
          <span className={styles.sideGroup}>{t(`categories.${category}.title`)}</span>
          <ul>
            {helpTopicsIn(category).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/help/${item.id}`}
                  className={styles.sideLink}
                  aria-current={item.id === id ? 'page' : undefined}
                >
                  {t(`topics.${item.id}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )

  return (
    <div className={styles.docs}>
      <JsonLd data={breadcrumbJsonLd([
        { name: t('breadcrumb.home'), path: '/' },
        { name: t('breadcrumb.help'), path: '/help' },
        { name: title, path: `/help/${id}` },
      ])} />

      {/* Desktop: sticky list of every guide. */}
      <aside className={styles.sidebar} aria-label={t('article.allGuides')}>
        <Link href="/help" className={styles.sideHome}>{t('breadcrumb.help')}</Link>
        {sidebarList}
      </aside>

      <article className={styles.article}>
        {/* Phone and tablet: the same list, folded. */}
        <details className={styles.sideMobile}>
          <summary>
            {t('article.allGuides')}
            <ChevronDown size={16} aria-hidden />
          </summary>
          {sidebarList}
        </details>

        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/help">{t('breadcrumb.help')}</Link>
          <span aria-hidden>/</span>
          <Link href={`/help#help-${topic.category}`}>{t(`categories.${topic.category}.title`)}</Link>
        </nav>

        <header className={styles.articleHead}>
          <span className={styles.articleIcon}><TopicIcon id={id} size={22} /></span>
          <h1 className={styles.articleTitle}>{title}</h1>
          <p className={styles.articleLede}>{t(`topics.${id}.summary`)}</p>
          <div className={styles.metaRow}>
            <Link href={topic.href} className={styles.btnPrimary}>
              {t('article.open')} <ArrowRight size={16} aria-hidden />
            </Link>
            <span className={styles.plan} data-plan={topic.plan}>{t(`plan.${topic.plan}`)}</span>
            {steps > 0 && <span className={styles.cardMeta}>{t('article.stepsCount', { count: steps })}</span>}
          </div>
        </header>

        {shots[0] && renderShot(shots[0])}
        {shots.length > 0 && <p className={styles.shotNote}>{t('article.screenshotNote')}</p>}

        {sections.map((section, i) => (
          <section key={section.heading} id={`s-${i + 1}`} className={styles.section}>
            <h2>{section.heading}</h2>
            {section.body && <p>{section.body}</p>}
            {section.steps && section.steps.length > 0 && (
              <ol className={styles.timeline}>
                {section.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            )}
            {shots[i + 1] && renderShot(shots[i + 1])}
          </section>
        ))}

        {shots.slice(sections.length + 1).map(renderShot)}

        {tips.length > 0 && (
          <aside id="tips" className={styles.tips}>
            <h2><Lightbulb size={16} aria-hidden /> {t('article.tips')}</h2>
            <ul>{tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
          </aside>
        )}

        <nav className={styles.pager} aria-label={t('article.allGuides')}>
          {prev ? (
            <Link href={`/help/${prev.id}`} className={styles.pagerPrev}>
              <span><ArrowLeft size={13} aria-hidden /> {t('article.prev')}</span>
              {t(`topics.${prev.id}.title`)}
            </Link>
          ) : <span />}
          {next && (
            <Link href={`/help/${next.id}`} className={styles.pagerNext}>
              <span>{t('article.next')} <ArrowRight size={13} aria-hidden /></span>
              {t(`topics.${next.id}.title`)}
            </Link>
          )}
        </nav>
      </article>

      {/* Wide screens: jump list for this guide. */}
      {sections.length > 1 && (
        <nav className={styles.toc} aria-label={t('article.onThisPage')}>
          <p className={styles.tocTitle}>{t('article.onThisPage')}</p>
          <ol>
            {sections.map((section, i) => (
              <li key={section.heading}><a href={`#s-${i + 1}`}>{section.heading}</a></li>
            ))}
            {tips.length > 0 && <li><a href="#tips">{t('article.tips')}</a></li>}
          </ol>
        </nav>
      )}
    </div>
  )
}
