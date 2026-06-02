'use client'

import React from 'react'
import Link from 'next/link'
import {
  ABOUT_VISION,
  ABOUT_DEVELOPER,
  ABOUT_SPECIAL_THANKS,
  ABOUT_CREATOR_CONTACT,
  ABOUT_VEDAANSH_CONTACT,
} from '@/lib/about/content'
import { textWithNameHighlight } from '@/components/about/highlightName'

const sectionStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
}

export function AboutContent({ compact = false }: { compact?: boolean }) {
  const pad = compact ? '1.25rem' : 'clamp(1.25rem, 3vw, 2.5rem)'

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
          ॥ वेदांश ॥
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
          About Vedaansh
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: compact ? '0.9rem' : '1.05rem', maxWidth: 640, marginInline: 'auto' }}>
          Vedic culture · Jyotish · Scripture · Community
        </p>
      </header>

      {/* Vision */}
      <section className="card" style={sectionStyle}>
        <div className="label-caps" style={{ marginBottom: '0.5rem' }}>{ABOUT_VISION.title}</div>
        {ABOUT_VISION.paragraphs.map((p, i) => (
          <p key={i} style={{ margin: i === 0 ? '0 0 0.85rem' : '0 0 0.85rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
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
          {ABOUT_VISION.pillars.map((pillar) => (
            <article key={pillar.title} className="stat-chip" style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '1.25rem' }} aria-hidden>{pillar.icon}</span>
              <span className="stat-value" style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.95rem' }}>
                {pillar.title}
              </span>
              <span className="stat-sub" style={{ display: 'block', marginTop: '0.25rem' }}>{pillar.text}</span>
            </article>
          ))}
        </div>
      </section>

      {/* Developer */}
      <section className="card" style={sectionStyle}>
        <div className="label-caps" style={{ marginBottom: '0.5rem' }}>About the Creator</div>
        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', fontFamily: 'var(--font-display)' }}>
          {ABOUT_DEVELOPER.name}
        </h2>
        <p style={{ margin: '0 0 0.75rem', color: 'var(--text-gold)', fontSize: '0.88rem', fontWeight: 600 }}>
          {ABOUT_DEVELOPER.subtitle}
        </p>
        {ABOUT_DEVELOPER.paragraphs.map((p, i) => (
          <p key={i} style={{ margin: '0 0 0.75rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {textWithNameHighlight(p)}
          </p>
        ))}
      </section>

      {/* Acknowledgement */}
      <section
        className="card"
        style={{
          ...sectionStyle,
          padding: '1rem 1.15rem',
          borderLeft: '3px solid var(--text-gold)',
          background: 'color-mix(in oklab, var(--gold-faint, rgba(197, 160, 89, 0.1)) 55%, var(--surface-1) 45%)',
        }}
      >
        <div className="label-caps" style={{ marginBottom: '0.4rem' }}>Special thanks</div>
        <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          {textWithNameHighlight(ABOUT_SPECIAL_THANKS.text)}
        </p>
      </section>

      {/* Contact */}
      <section className="card" style={sectionStyle}>
        <div className="label-caps" style={{ marginBottom: '0.65rem' }}>Connect with us</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <p style={{ margin: '0 0 0.65rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {ABOUT_CREATOR_CONTACT.name} · {ABOUT_CREATOR_CONTACT.roleLabel}
            </p>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-gold)' }}>Email</h3>
            <a
              href={`mailto:${ABOUT_CREATOR_CONTACT.email}`}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500 }}
            >
              {ABOUT_CREATOR_CONTACT.email}
            </a>
            <h3 style={{ margin: '0.85rem 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-gold)' }}>Instagram</h3>
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
              {ABOUT_VEDAANSH_CONTACT.label}
            </p>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-gold)' }}>Email</h3>
            <a
              href={`mailto:${ABOUT_VEDAANSH_CONTACT.email}`}
              style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500 }}
            >
              {ABOUT_VEDAANSH_CONTACT.email}
            </a>
            <h3 style={{ margin: '0.85rem 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-gold)' }}>Instagram</h3>
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
            ← Back to Home
          </Link>
        </div>
      )}

      <div style={{ height: compact ? '0.5rem' : '2rem' }} />
    </div>
  )
}
