'use client'

import { Link } from '@/i18n/navigation'
import React from 'react'
import { useTranslations } from 'next-intl'
import { ABOUT_VISION } from '@/lib/about/content'
import { textWithNameHighlight } from '@/components/about/highlightName'
import { VedicSectionHeader } from '@/components/ui/VedicSectionHeader'

type AboutPreviewProps = {
  onCtaClick?: () => void
}

export function AboutPreview({ onCtaClick }: AboutPreviewProps) {
  const t = useTranslations('home.aboutPreview')
  const pillarTitles = t.raw('pillars') as string[]
  return (
    <section className="landing-section-row landing-section-row--gold about-preview" style={{ marginBottom: '1.25rem' }}>
      <div className="landing-section-row-content">
        <VedicSectionHeader
          kicker={t('kicker')}
          title={t('title')}
          theme="gold"
        />
        <p className="landing-about-lead">
          {t('lead')}
        </p>
        <div className="landing-about-pillars">
          {ABOUT_VISION.pillars.map((p, i) => (
            <div key={p.title} className="landing-premium-pillar landing-about-pillar">
              <div className="landing-premium-pillar-icon">
                <span aria-hidden>{p.icon}</span>
              </div>
              <span className="landing-premium-pillar-title">{pillarTitles[i] ?? p.title}</span>
            </div>
          ))}
        </div>
        <p className="landing-about-meta">
          {t.rich('builtBy', { b: (chunks) => <strong>{chunks}</strong> })}
        </p>
        <p className="landing-about-meta">
          {textWithNameHighlight(t('thanks'))}
        </p>
        <Link
          href="/about"
          onClick={onCtaClick}
          className="btn btn-secondary"
          style={{ textDecoration: 'none', display: 'inline-flex' }}
        >
          {t('cta')}
        </Link>
      </div>
    </section>
  )
}
