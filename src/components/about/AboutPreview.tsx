'use client'

import React from 'react'
import Link from 'next/link'
import { ABOUT_VISION, ABOUT_GURU } from '@/lib/about/content'

type AboutPreviewProps = {
  onCtaClick?: () => void
}

export function AboutPreview({ onCtaClick }: AboutPreviewProps) {
  return (
    <section className="card fade-up-3 about-preview" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
      <div className="label-caps" style={{ marginBottom: '0.5rem' }}>About Vedaansh</div>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>Vision, tradition, and the people behind the platform</h3>
      <p style={{ margin: '0 0 0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 820 }}>
        {ABOUT_VISION.paragraphs[0]}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.65rem',
          marginBottom: '1rem',
        }}
      >
        {ABOUT_VISION.pillars.map((p) => (
          <div key={p.title} className="stat-chip" style={{ textAlign: 'left' }}>
            <span aria-hidden style={{ fontSize: '1.1rem' }}>{p.icon}</span>
            <span className="stat-value" style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.88rem' }}>
              {p.title}
            </span>
          </div>
        ))}
      </div>
      <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Built by <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Abhishek Kumar</strong>, Software Engineer
        and student of <strong style={{ color: 'var(--text-gold)', fontWeight: 600 }}>{ABOUT_GURU.name}</strong> ji — inspired by his teachings.
      </p>
      <Link
        href="/about"
        onClick={onCtaClick}
        className="btn btn-secondary"
        style={{ textDecoration: 'none', display: 'inline-flex' }}
      >
        Read full story →
      </Link>
    </section>
  )
}
