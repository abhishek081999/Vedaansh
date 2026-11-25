import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, ChevronDown, LifeBuoy } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import styles from '@/components/help/Help.module.css'
import { CategoryIcon, TopicIcon } from '@/components/help/guideIcons'
import { GuideSearch, type GuideSearchItem } from '@/components/help/GuideSearch'
import { HeroPhone } from '@/components/help/HeroPhone'
import { HELP_CATEGORIES, HELP_TOPICS, helpTopicsIn, helpShotSize } from '@/lib/help/topics'
import { pageLocale } from '@/lib/seo/i18nMeta'
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo/site'

interface TopicText {
  title: string
  summary: string
  sections: { heading: string; body?: string; steps?: string[] }[]
}

const FEATURED_SHOT = 'workspace.jpg'

export default async function HelpIndexPage() {
  const locale = await pageLocale()
  const t = await getTranslations({ locale, namespace: 'help' })
  const quickStart = t.raw('index.quickStart') as string[]
  const faq = t.raw('index.faq') as { q: string; a: string }[]
  const topicText = (id: string) => t.raw(`topics.${id}`) as TopicText
  const stepCount = (id: string) => topicText(id).sections.reduce((n, s) => n + (s.steps?.length ?? 0), 0)

  const searchItems: GuideSearchItem[] = HELP_TOPICS.map((topic) => {
    const text = topicText(topic.id)
    return {
      id: topic.id,
      title: text.title,
      summary: text.summary,
      section: t(`categories.${topic.category}.title`),
      // Headings, body and steps, so a word used anywhere in a guide finds it.
      keywords: text.sections.map((s) => [s.heading, s.body ?? '', ...(s.steps ?? [])].join(' ')).join(' '),
    }
  })

  const workspaceTopics = helpTopicsIn('workspace')
  const otherCategories = HELP_CATEGORIES.filter((c) => c !== 'workspace')
  const featured = helpShotSize(FEATURED_SHOT)

  return (
    <div className={styles.page}>
      <JsonLd data={breadcrumbJsonLd([
        { name: t('breadcrumb.home'), path: '/' },
        { name: t('breadcrumb.help'), path: '/help' },
      ])} />
      <JsonLd data={faqJsonLd(faq)} />

      {/* ── Hero ─────────────────────────────────────────── */}
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{t('index.eyebrow')}</p>
          <h1 className={styles.heroTitle}>{t('index.title')}</h1>
          <p className={styles.heroLede}>{t('index.lede')}</p>
          <GuideSearch
            items={searchItems}
            label={t('index.searchLabel')}
            placeholder={t('index.searchPlaceholder')}
            emptyTemplate={t.raw('index.searchEmpty') as string}
          />
          <p className={styles.heroStats}>
            {t('index.stats', { guides: HELP_TOPICS.length, sections: HELP_CATEGORIES.length })}
          </p>
        </div>
        {/* Decorative: the Workspace on a phone. */}
        <HeroPhone priority />
      </header>

      {/* ── Section jump links ───────────────────────────── */}
      <nav className={styles.jump} aria-label={t('index.jumpTo')}>
        {HELP_CATEGORIES.map((category) => (
          <a key={category} href={`#help-${category}`} className={styles.jumpChip}>
            <CategoryIcon category={category} size={15} />
            {t(`categories.${category}.title`)}
          </a>
        ))}
      </nav>

      {/* ── Quick start ──────────────────────────────────── */}
      <section className={styles.quick} aria-labelledby="quick-start">
        <h2 id="quick-start" className={styles.blockTitle}>{t('index.quickStartTitle')}</h2>
        <ol className={styles.quickSteps}>
          {quickStart.map((step, i) => (
            <li key={step} className={styles.quickStep}>
              <span className={styles.quickNum} aria-hidden>{i + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        <Link href="/?new=true" className={styles.btnPrimary}>
          {t('index.startButton')} <ArrowRight size={16} aria-hidden />
        </Link>
      </section>

      {/* ── Featured: the Workspace ──────────────────────── */}
      <section id="help-workspace" className={styles.featured} aria-labelledby="featured-title">
        <div className={styles.featuredText}>
          <p className={styles.eyebrow}>{t('index.featuredEyebrow')}</p>
          <h2 id="featured-title" className={styles.featuredTitle}>{t('index.featuredTitle')}</h2>
          <p className={styles.featuredBody}>{t('index.featuredBody')}</p>
          <ol className={styles.featuredList}>
            {workspaceTopics.map((topic) => (
              <li key={topic.id}>
                <Link href={`/help/${topic.id}`} className={styles.featuredLink}>
                  <TopicIcon id={topic.id} size={16} />
                  <span>{topicText(topic.id).title}</span>
                  <ArrowRight size={14} aria-hidden className={styles.featuredArrow} />
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <Link href="/help/workspace" className={styles.featuredShot} aria-label={t('index.featuredCta')}>
          <Image
            src={`/help/${FEATURED_SHOT}`}
            alt={t('index.featuredAlt')}
            width={featured.width}
            height={featured.height}
            sizes="(max-width: 960px) 100vw, 34rem"
            priority
          />
        </Link>
      </section>

      {/* ── All other sections ───────────────────────────── */}
      {otherCategories.map((category) => {
        return (
          <section key={category} id={`help-${category}`} className={styles.category} aria-labelledby={`help-${category}-title`}>
            <div className={styles.categoryHead}>
              <span className={styles.categoryIcon}><CategoryIcon category={category} /></span>
              <div>
                <h2 id={`help-${category}-title`}>{t(`categories.${category}.title`)}</h2>
                <p>{t(`categories.${category}.desc`)}</p>
              </div>
            </div>
            <div className={styles.grid}>
              {helpTopicsIn(category).map((topic) => {
                const text = topicText(topic.id)
                return (
                  <Link key={topic.id} href={`/help/${topic.id}`} className={styles.card}>
                    <span className={styles.cardIcon}><TopicIcon id={topic.id} /></span>
                    <h3 className={styles.cardTitle}>{text.title}</h3>
                    <p className={styles.cardDesc}>{text.summary}</p>
                    <span className={styles.cardFoot}>
                      <span className={styles.plan} data-plan={topic.plan}>{t(`plan.${topic.plan}`)}</span>
                      <span className={styles.cardMeta}>{t('index.stepsCount', { count: stepCount(topic.id) })}</span>
                      <ArrowRight size={15} aria-hidden className={styles.cardArrow} />
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className={styles.faq} aria-labelledby="faq-title">
        <h2 id="faq-title" className={styles.blockTitle}>{t('index.faqTitle')}</h2>
        <div className={styles.faqList}>
          {faq.map(({ q, a }) => (
            <details key={q} className={styles.faqItem}>
              <summary>
                <span>{q}</span>
                <ChevronDown size={18} aria-hidden className={styles.faqChevron} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Support ──────────────────────────────────────── */}
      <section className={styles.contact}>
        <span className={styles.contactIcon}><LifeBuoy size={22} aria-hidden /></span>
        <div>
          <h2>{t('index.contactTitle')}</h2>
          <p>{t('index.contactBody')}</p>
        </div>
        <Link href="/support" className={styles.btnSecondary}>
          {t('index.contactButton')} <ArrowRight size={16} aria-hidden />
        </Link>
      </section>
    </div>
  )
}
