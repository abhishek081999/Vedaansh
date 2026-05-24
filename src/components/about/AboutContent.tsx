'use client'

import React from 'react'
import Link from 'next/link'
import {
  ABOUT_VISION,
  ABOUT_DEVELOPER,
  ABOUT_GURU,
  ABOUT_SPECIAL_THANKS,
  ABOUT_CONTACT,
} from '@/lib/about/content'

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
            {p}
          </p>
        ))}
      </section>

      {/* Guru */}
      <section className="card" style={sectionStyle}>
        <div className="label-caps" style={{ marginBottom: '0.45rem' }}>Our Guru</div>
        <h2 style={{ margin: '0 0 0.2rem', fontSize: '1.35rem', fontFamily: 'var(--font-display)' }}>
          {ABOUT_GURU.name}
        </h2>
        <p style={{ margin: '0 0 0.35rem', color: 'var(--text-gold)', fontSize: '0.85rem', fontWeight: 600 }}>
          {ABOUT_GURU.honorific}
        </p>
        <p style={{ margin: '0 0 0.85rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {ABOUT_GURU.experienceLabel} of Vedic Astrology & spiritual practice
        </p>
        {ABOUT_GURU.paragraphs.map((p, i) => (
          <p key={i} style={{ margin: '0 0 0.75rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {p}
          </p>
        ))}
        <blockquote
          style={{
            margin: '1rem 0 0',
            padding: '0.85rem 1rem',
            borderLeft: '3px solid var(--text-gold)',
            background: 'rgba(201, 168, 76, 0.06)',
            borderRadius: '0 8px 8px 0',
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: 1.65,
            fontSize: '0.92rem',
          }}
        >
          {ABOUT_GURU.gratitude}
        </blockquote>
      </section>

      {/* Special thanks */}
      <section className="card" style={sectionStyle}>
        <div className="label-caps" style={{ marginBottom: '0.65rem' }}>{ABOUT_SPECIAL_THANKS.title}</div>
        {ABOUT_SPECIAL_THANKS.entries.map((entry) => (
          <div key={entry.name} style={{ marginBottom: '0.85rem' }}>
            <h2 style={{ margin: '0 0 0.2rem', fontSize: '1.15rem', fontFamily: 'var(--font-display)' }}>
              {entry.name}
            </h2>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--text-gold)', fontSize: '0.85rem', fontWeight: 600 }}>
              {entry.org}
            </p>
            <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{entry.note}</p>
          </div>
        ))}
      </section>

      {/* Contact */}
      <section className="card" style={sectionStyle}>
        <div className="label-caps" style={{ marginBottom: '0.65rem' }}>Connect With Us</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-gold)' }}>Email</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {ABOUT_CONTACT.emails.map((e) => (
                <li key={e.address}>
                  <a
                    href={`mailto:${e.address}`}
                    style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.92rem' }}
                  >
                    <span style={{ color: 'var(--text-muted)', marginRight: '0.35rem' }}>{e.label}:</span>
                    {e.address}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-gold)' }}>Instagram</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              {ABOUT_CONTACT.instagram.map((ig) => (
                <li key={ig.handle}>
                  <a
                    href={ig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
                  >
                    @{ig.handle}
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.35rem', fontSize: '0.75rem' }}>
                      ({ig.label})
                    </span>
                  </a>
                </li>
              ))}
            </ul>
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
