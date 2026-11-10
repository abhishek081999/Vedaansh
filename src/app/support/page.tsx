'use client'

import { Link } from '@/i18n/navigation'
import React from 'react'
import { useTranslations } from 'next-intl'
import { LEGAL_CONTACT } from '@/lib/legal/content'

export default function SupportPage() {
  const t = useTranslations('support')

  return (
    <div
      className="fade-up"
      style={{
        maxWidth: 640,
        margin: '0 auto',
        width: '100%',
        padding: 'clamp(1.25rem, 3vw, 2.5rem)',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge-accent" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
          {t('header.badge')}
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: 800,
            margin: '0.35rem 0 0.5rem',
            color: 'var(--text-gold)',
          }}
        >
          {t('header.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          {t('header.subtitle')}
        </p>
      </header>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', margin: '0 0 0.75rem' }}>
          {t('contact.title')}
        </h2>
        <p style={{ margin: '0 0 1rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {t('contact.body')}
        </p>
        <p style={{ margin: 0, lineHeight: 1.8 }}>
          <a href={`mailto:${LEGAL_CONTACT.primary}`} style={{ color: 'var(--gold)' }}>
            {LEGAL_CONTACT.primary}
          </a>
          <br />
          <a href={`mailto:${LEGAL_CONTACT.support}`} style={{ color: 'var(--gold)' }}>
            {LEGAL_CONTACT.support}
          </a>
        </p>
      </section>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', margin: '0 0 0.75rem' }}>
          {t('topics.title')}
        </h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.85, color: 'var(--text-secondary)' }}>
          <li>
            {t.rich('topics.subscriptions', {
              b: (chunks) => <strong>{chunks}</strong>,
              refund: (chunks) => <Link href="/refund" style={{ color: 'var(--gold)' }}>{chunks}</Link>,
            })}
          </li>
          <li>
            {t.rich('topics.payment', {
              b: (chunks) => <strong>{chunks}</strong>,
              pricing: (chunks) => <Link href="/pricing?help=1" style={{ color: 'var(--gold)' }}>{chunks}</Link>,
            })}
          </li>
          <li>
            {t.rich('topics.cancel', {
              b: (chunks) => <strong>{chunks}</strong>,
            })}
          </li>
          <li>
            {t.rich('topics.export', {
              b: (chunks) => <strong>{chunks}</strong>,
            })}
          </li>
          <li>
            {t.rich('topics.legal', {
              b: (chunks) => <strong>{chunks}</strong>,
              privacy: (chunks) => <Link href="/privacy" style={{ color: 'var(--gold)' }}>{chunks}</Link>,
              terms: (chunks) => <Link href="/terms" style={{ color: 'var(--gold)' }}>{chunks}</Link>,
            })}
          </li>
        </ul>
      </section>

      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '1.5rem',
        }}
      >
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {t('nav.home')}
        </Link>
        <Link href="/terms" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {t('nav.terms')}
        </Link>
        <Link href="/privacy" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {t('nav.privacy')}
        </Link>
        <Link href="/refund" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {t('nav.refunds')}
        </Link>
      </nav>
    </div>
  )
}
