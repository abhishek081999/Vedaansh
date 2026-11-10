'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'
import { useLang } from '@/i18n/useLang'
import { LEGAL_CONTACT, type LegalPageKey } from '@/lib/legal/content'
import { getLegalPage, legalNavLinks } from '@/lib/legal/content.hi'

const sectionStyle: React.CSSProperties = {
  marginBottom: '1.25rem',
}

export function LegalPageContent({ pageKey }: { pageKey: LegalPageKey }) {
  const { lang } = useLang()
  const t = useTranslations('legal')
  const page = getLegalPage(pageKey, lang)
  const navLinks = legalNavLinks(lang)

  return (
    <div
      className="fade-up"
      style={{
        maxWidth: 820,
        margin: '0 auto',
        width: '100%',
        padding: 'clamp(1.25rem, 3vw, 2.5rem)',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge-accent" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
          {t('badge')}
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: 800,
            margin: '0.35rem 0 0.5rem',
            lineHeight: 1.15,
            color: 'var(--text-gold)',
          }}
        >
          {page.title}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>
          {page.subtitle}
        </p>
        <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 0', fontSize: '0.8rem' }}>
          {t('effective', { date: page.effectiveDate })}
        </p>
      </header>

      {page.intro ? (
        <section className="card" style={{ ...sectionStyle, borderColor: 'var(--border-bright)' }}>
          <p style={{ margin: 0, lineHeight: 1.75, color: 'var(--text-secondary)' }}>{page.intro}</p>
        </section>
      ) : null}

      {page.sections.map((section) => (
        <section key={section.title} className="card" style={sectionStyle}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              fontWeight: 700,
              margin: '0 0 0.75rem',
              color: 'var(--text-gold)',
            }}
          >
            {section.title}
          </h2>
          {section.paragraphs?.map((p, i) => (
            <p
              key={i}
              style={{
                margin: i === 0 ? '0 0 0.85rem' : '0 0 0.85rem',
                lineHeight: 1.75,
                color: 'var(--text-secondary)',
              }}
            >
              {p}
            </p>
          ))}
          {section.list?.length ? (
            <ul
              style={{
                margin: section.paragraphs?.length ? '0.5rem 0 0' : 0,
                paddingLeft: '1.25rem',
                lineHeight: 1.75,
                color: 'var(--text-secondary)',
              }}
            >
              {section.list.map((item) => (
                <li key={item} style={{ marginBottom: '0.5rem' }}>
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <nav
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
        aria-label={t('navAria')}
      >
        <Link href="/support" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {t('support')}
        </Link>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              color: page.key === link.href.slice(1) ? 'var(--text-gold)' : 'var(--text-muted)',
              fontWeight: page.key === link.href.slice(1) ? 700 : 500,
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
            aria-current={page.key === link.href.slice(1) ? 'page' : undefined}
          >
            {link.label}
          </Link>
        ))}
        <span style={{ color: 'var(--border-bright)' }}>·</span>
        <Link href="/pricing" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          {t('pricing')}
        </Link>
        <span style={{ color: 'var(--border-bright)' }}>·</span>
        <Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          {t('about')}
        </Link>
      </nav>

      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
        {t('questions')}{' '}
        <a href={`mailto:${LEGAL_CONTACT.primary}`} style={{ color: 'var(--gold)' }}>
          {LEGAL_CONTACT.primary}
        </a>
      </p>

      <div style={{ height: '2rem' }} />
    </div>
  )
}
