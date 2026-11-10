'use client'

import { Link } from '@/i18n/navigation'
import React from 'react'
import { useTranslations } from 'next-intl'
import {
  ABOUT_CREATOR_CONTACT,
  ABOUT_PILLAR_ICONS,
  ABOUT_VEDAANSH_CONTACT,
} from '@/lib/about/content'
import { textWithNameHighlight } from '@/components/about/highlightName'

const sectionStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
}

export function AboutContent({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('about')
  const pad = compact ? '1.25rem' : 'clamp(1.25rem, 3vw, 2.5rem)'
  const visionParagraphs = t.raw('vision.paragraphs') as string[]
  const pillars = t.raw('vision.pillars') as { title: string; text: string }[]
  const creatorParagraphs = t.raw('creator.paragraphs') as string[]

  return (
    <div
      className="fade-up"
      style={{
        maxWidth: 920,
        margin: '0 auto',
        width: '100%',
        padding: pad,
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: compact ? '1.25rem' : '2rem' }}>
        <span className="badge-accent" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
          {t('badge')}
        </span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: compact ? '1.75rem' : 'clamp(2rem, 5vw, 2.75rem)',
            fontWeight: 800,
            margin: '0.35rem 0 0.5rem',
            lineHeight: 1.15,
            color: 'var(--text-gold)',
          }}
        >
          {t('title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: compact ? '0.9rem' : '1.05rem', maxWidth: 640, marginInline: 'auto' }}>
          {t('tagline')}
        </p>
      </header>

      <section className="card" style={sectionStyle}>
        <div className="label-caps" style={{ marginBottom: '0.5rem' }}>{t('vision.title')}</div>
        {visionParagraphs.map((p, i) => (
          <p key={i} style={{ margin: '0 0 0.85rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {p}
          </p>
        ))}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            marginTop: '1rem',
          }}
        >
          {pillars.map((pillar, i) => (
            <article key={pillar.title} className="stat-chip" style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '1.25rem' }} aria-hidden>{ABOUT_PILLAR_ICONS[i] ?? ''}</span>
              <span className="stat-value" style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.95rem' }}>
                {pillar.title}
              </span>
              <span className="stat-sub" style={{ display: 'block', marginTop: '0.25rem' }}>{pillar.text}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="card" style={sectionStyle}>
        <div className="label-caps" style={{ marginBottom: '0.5rem' }}>{t('creator.sectionTitle')}</div>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', fontFamily: 'var(--font-display)' }}>
          {t('creator.name')}
        </h2>
        <p style={{ margin: '0 0 0.75rem', color: 'var(--text-gold)', fontSize: '0.88rem', fontWeight: 600 }}>
          {t('creator.subtitle')}
        </p>
        {creatorParagraphs.map((p, i) => (
          <p key={i} style={{ margin: '0 0 0.75rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {textWithNameHighlight(p)}
          </p>
        ))}
      </section>

      <section
        className="card"
        style={{
          ...sectionStyle,
          padding: '1rem 1.15rem',
          borderLeft: '3px solid var(--text-gold)',
          background: 'color-mix(in oklab, var(--gold-faint, rgba(197, 160, 89, 0.1)) 55%, var(--surface-1) 45%)',
        }}
      >
        <div className="label-caps" style={{ marginBottom: '0.4rem' }}>{t('thanks.sectionTitle')}</div>
        <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          {textWithNameHighlight(t('thanks.text'))}
        </p>
      </section>

      <section className="card" style={sectionStyle}>
        <div className="label-caps" style={{ marginBottom: '0.65rem' }}>{t('connect.sectionTitle')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <p style={{ margin: '0 0 0.65rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {ABOUT_CREATOR_CONTACT.name} · {t('connect.creatorRole')}
            </p>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-gold)' }}>{t('connect.email')}</h3>
            <a
              href={`mailto:${ABOUT_CREATOR_CONTACT.email}`}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500 }}
            >
              {ABOUT_CREATOR_CONTACT.email}
            </a>
            <h3 style={{ margin: '0.85rem 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-gold)' }}>{t('connect.instagram')}</h3>
            <a
              href={ABOUT_CREATOR_CONTACT.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '0.45rem 0.85rem', display: 'inline-flex' }}
            >
              @{ABOUT_CREATOR_CONTACT.instagram.handle}
            </a>
          </div>
          <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '1.1rem' }}>
            <p style={{ margin: '0 0 0.65rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {t('connect.vedaanshLabel')}
            </p>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-gold)' }}>{t('connect.email')}</h3>
            <a
              href={`mailto:${ABOUT_VEDAANSH_CONTACT.email}`}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500 }}
            >
              {ABOUT_VEDAANSH_CONTACT.email}
            </a>
            <h3 style={{ margin: '0.85rem 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-gold)' }}>{t('connect.instagram')}</h3>
            <a
              href={ABOUT_VEDAANSH_CONTACT.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '0.45rem 0.85rem', display: 'inline-flex' }}
            >
              @{ABOUT_VEDAANSH_CONTACT.instagram.handle}
            </a>
          </div>
        </div>
      </section>

      {!compact && (
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            {t('backHome')}
          </Link>
        </div>
      )}

      <div style={{ height: compact ? '0.5rem' : '2rem' }} />
    </div>
  )
}
