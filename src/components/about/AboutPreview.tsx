'use client'

import React from 'react'
import Link from 'next/link'
import { ABOUT_VISION, ABOUT_SPECIAL_THANKS } from '@/lib/about/content'
import { textWithNameHighlight } from '@/components/about/highlightName'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'

type AboutPreviewProps = {
  onCtaClick?: () => void
}

export function AboutPreview({ onCtaClick }: AboutPreviewProps) {
  return (
    <section className="landing-section-row landing-section-row--gold about-preview" style={{ marginBottom: '1.25rem' }}>
      <div className="landing-section-row-content">
        <VedicSectionHeader
          kicker="About Vedaansh"
          title="Vision, tradition, and the people behind the platform"
          theme="gold"
        />
        <p className="landing-about-lead">
          {ABOUT_VISION.paragraphs[0]}
        </p>
        <div className="landing-about-pillars">
          {ABOUT_VISION.pillars.map((p) => (
            <div key={p.title} className="landing-premium-pillar landing-about-pillar">
              <div className="landing-premium-pillar-icon">
                <span aria-hidden>{p.icon}</span>
              </div>
              <span className="landing-premium-pillar-title">{p.title}</span>
            </div>
          ))}
        </div>
        <p className="landing-about-meta">
          Built by <strong>Abhishek Kumar</strong>, Software Engineer.
        </p>
        <p className="landing-about-meta">
          {textWithNameHighlight(ABOUT_SPECIAL_THANKS.text)}
        </p>
        <Link
          href="/about"
          onClick={onCtaClick}
          className="btn btn-secondary"
          style={{ textDecoration: 'none', display: 'inline-flex' }}
        >
          Read full story →
        </Link>
      </div>
    </section>
  )
}
