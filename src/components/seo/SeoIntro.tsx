// Visible, crawlable intro for tool pages (server component).
// Prefer h2 when the interactive page already owns the h1.
import type { ReactNode } from 'react'
import Link from 'next/link'
import type { SeoIntroProps } from './SeoIntro.types'
import styles from './SeoIntro.module.css'

export type { SeoIntroProps } from './SeoIntro.types'

function SeoBlock({
  compact,
  title,
  as: Tag,
  titleClassName,
  children,
}: {
  compact: boolean
  title: string
  as: 'h2' | 'h3'
  titleClassName: string
  children: ReactNode
}) {
  const heading = <Tag className={titleClassName}>{title}</Tag>
  if (!compact) return <>{heading}{children}</>
  return (
    <details className={styles.collapsible}>
      <summary className={styles.summary}>{heading}</summary>
      {children}
    </details>
  )
}

export function SeoIntro({
  ariaLabel,
  h1,
  paragraphs,
  h2,
  bullets,
  titleAs = 'h2',
  faq,
  relatedLinks,
  relatedTitle = 'Related guides',
  compact = false,
}: SeoIntroProps) {
  const TitleTag = titleAs === 'h1' ? 'h1' : 'h2'
  const SubTag = titleAs === 'h1' ? 'h2' : 'h3'

  return (
    <section className={`${styles.section}${compact ? ` ${styles.compact}` : ''}`} aria-label={ariaLabel}>
      <TitleTag className={styles.title}>{h1}</TitleTag>
      {paragraphs.map((p) => (
        <p key={p.slice(0, 48)} className={styles.paragraph}>
          {p}
        </p>
      ))}
      {h2 && bullets && bullets.length > 0 && (
        <SeoBlock compact={compact} title={h2} as={SubTag} titleClassName={styles.subtitle}>
          <ul className={styles.list}>
            {bullets.map((b) => (
              <li key={b.label} className={styles.item}>
                <strong>{b.label}</strong>
                <span className={styles.desc}>{b.desc}</span>
              </li>
            ))}
          </ul>
        </SeoBlock>
      )}
      {relatedLinks && relatedLinks.length > 0 && (
        <div className={styles.related}>
          <SubTag className={styles.subtitle}>{relatedTitle}</SubTag>
          <ul className={styles.relatedList}>
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.relatedLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {faq && faq.length > 0 && (
        <div className={styles.faq}>
          <SeoBlock compact={compact} title="Frequently asked questions" as={SubTag} titleClassName={styles.faqTitle}>
            <dl className={styles.faqList}>
              {faq.map(({ q, a }) => (
                <div key={q} className={styles.faqItem}>
                  <dt>{q}</dt>
                  <dd>{a}</dd>
                </div>
              ))}
            </dl>
          </SeoBlock>
        </div>
      )}
    </section>
  )
}
